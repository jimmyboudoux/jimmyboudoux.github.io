import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  DIAGNOSTIC_EVENTS,
  analyticsProperties,
  buildDiagnosticPayload,
  decodeAltchaPayload,
  enforceExclusiveNone,
  initialState,
  readMarketing,
  safeStoredState,
  valuesFromElements
} from '../../assets/js/diagnostic/core.mjs';
import { solveAltcha } from '../../assets/js/diagnostic/altcha.mjs';
import { clearDraft, loadDraft, saveDraft } from '../../assets/js/diagnostic/storage.mjs';
import { submitDiagnostic } from '../../assets/js/diagnostic/transport.mjs';

test('readMarketing truncates campaign values and keeps only context metadata', () => {
  const marketing = readMarketing({
    search: '?utm_source=newsletter&utm_campaign=launch&partner=acme',
    referrer: 'https://example.test/source',
    pathname: '/diagnostic-ia/'
  });

  assert.equal(marketing.utm_source, 'newsletter');
  assert.equal(marketing.utm_campaign, 'launch');
  assert.equal(marketing.landing_page, '/diagnostic-ia/?utm_source=newsletter&utm_campaign=launch&partner=acme');
});

test('valuesFromElements preserves multi-select values and excludes anti-spam fields', () => {
  const values = valuesFromElements([
    { name: 'tools', type: 'checkbox', value: 'chatgpt', checked: true },
    { name: 'tools', type: 'checkbox', value: 'copilot', checked: false },
    { name: 'email', type: 'email', value: 'contact@example.test' },
    { name: 'newsletter_opt_in', type: 'checkbox', value: 'yes', checked: true },
    { name: 'website', type: 'text', value: 'bot.example.test' },
    { name: 'altcha', type: 'hidden', value: 'payload' }
  ]);

  assert.deepEqual(values, {
    tools: ['chatgpt'],
    email: 'contact@example.test',
    newsletter_opt_in: true
  });
});

test('none remains exclusive for the tools controls', () => {
  const chatgpt = { name: 'tools', type: 'checkbox', value: 'chatgpt', checked: true };
  const none = { name: 'tools', type: 'checkbox', value: 'none', checked: true };
  enforceExclusiveNone(none, [chatgpt, none]);
  assert.equal(chatgpt.checked, false);

  chatgpt.checked = true;
  enforceExclusiveNone(chatgpt, [chatgpt, none]);
  assert.equal(none.checked, false);
});

test('draft state falls back safely and retains persisted values', () => {
  const fallback = initialState({ crypto: { randomUUID: () => 'submission-id' }, now: () => 42 });
  assert.equal(safeStoredState('not-json', fallback), fallback);
  assert.deepEqual(safeStoredState('{"values":{"email":"a@b.test"}}', fallback), {
    ...fallback,
    values: { email: 'a@b.test' }
  });
});

test('draft storage is resilient to unavailable browser storage', () => {
  const storage = new Map();
  storage.getItem = storage.get.bind(storage);
  storage.setItem = storage.set.bind(storage);
  storage.removeItem = storage.delete.bind(storage);
  const fallback = { values: {}, submission_id: 'id', form_started_at: 42 };

  assert.equal(saveDraft(storage, 'draft', { ...fallback, values: { email: 'a@b.test' } }), true);
  assert.deepEqual(loadDraft(storage, 'draft', fallback), { ...fallback, values: { email: 'a@b.test' } });
  clearDraft(storage, 'draft');
  assert.equal(storage.has('draft'), false);
  assert.equal(saveDraft({ setItem: () => { throw new Error('blocked'); } }, 'draft', fallback), false);
});

test('payload retains the public API contract and keeps honeypot in contact', () => {
  const payload = buildDiagnosticPayload({
    values: {
      company_size: '2-10', industry: 'services', role: 'director', ai_usage_level: 'active', tools: ['chatgpt'],
      paid_licenses: 'yes', use_cases: ['writing'], confidential_data_usage: 'sometimes', ai_policy: 'no',
      training_level: 'none', data_rules: 'unknown', cost_visibility: 'partial', license_usage_visibility: 'partial',
      cost_evolution: 'stable', automation_potential: 'probably', data_hosting_concern: 'important',
      private_ai_interest: 'potentially', main_problem: 'Tester les priorités IA.', priorities: ['security'], horizon: 'now',
      first_name: 'Ada', last_name: 'Lovelace', company: 'Analytical', email: 'ada@example.test', phone: '',
      contact_preference: 'email', newsletter_opt_in: true
    },
    state: { submission_id: 'submission-id', form_started_at: 42 },
    marketing: { utm_source: 'newsletter' },
    honeypot: ''
  });

  assert.deepEqual(Object.keys(payload), [
    'submission_id', 'diagnostic_type', 'form_started_at', 'company', 'ai_usage', 'governance', 'costs', 'automation', 'needs', 'contact', 'marketing'
  ]);
  assert.equal(payload.contact.website, '');
  assert.equal(payload.contact.newsletter_opt_in, true);
  assert.deepEqual(payload.ai_usage.tools, ['chatgpt']);
});

test('ALTCHA payload accepts JSON and Base64URL JSON', () => {
  assert.deepEqual(decodeAltchaPayload('{"challenge":"ok"}'), { challenge: 'ok' });
  const encoded = Buffer.from('{"challenge":"ok"}').toString('base64url');
  assert.deepEqual(decodeAltchaPayload(encoded, (value) => Buffer.from(value, 'base64').toString()), { challenge: 'ok' });
  assert.throws(() => decodeAltchaPayload('invalid', () => { throw new Error('invalid'); }));
});

test('ALTCHA reports a missing widget without attempting a network submission', async () => {
  await assert.rejects(solveAltcha({ widget: null, form: {} }), /protection anti-robot/);
});

test('ALTCHA timeout is reported as a retryable verification failure', async () => {
  let timeoutCallback;
  const widget = {
    reset() {},
    addEventListener() {},
    removeEventListener() {},
    verify() {}
  };
  const pending = solveAltcha({
    widget,
    form: {},
    customElementsRef: { whenDefined: async () => {} },
    setTimeoutFn: (callback) => {
      timeoutCallback = callback;
      return 1;
    },
    clearTimeoutFn: () => {}
  });
  await new Promise((resolve) => queueMicrotask(resolve));
  timeoutCallback();
  await assert.rejects(pending, /vérification anti-robot a échoué/);
});

test('transport returns JSON, server validation errors and invalid JSON errors predictably', async () => {
  const ok = await submitDiagnostic({
    endpoint: 'https://example.test/diagnostics',
    payload: { diagnostic_type: 'general_ai' },
    fetchImpl: async () => ({ ok: true, json: async () => ({ accepted: true }) })
  });
  assert.deepEqual(ok, { accepted: true });

  await assert.rejects(
    submitDiagnostic({
      endpoint: 'https://example.test/diagnostics',
      payload: {},
      fetchImpl: async () => ({ ok: false, json: async () => ({ message: 'Champ invalide', fields: { email: 'Email invalide' } }) })
    }),
    (error) => error.message === 'Champ invalide' && error.fields.email === 'Email invalide'
  );

  await assert.rejects(
    submitDiagnostic({
      endpoint: 'https://example.test/diagnostics',
      payload: {},
      fetchImpl: async () => ({ ok: false, json: async () => { throw new Error('invalid json'); } })
    }),
    /Une erreur est survenue/
  );

  await assert.rejects(
    submitDiagnostic({
      endpoint: 'https://example.test/diagnostics',
      payload: {},
      fetchImpl: async () => { throw new Error('Network unavailable'); }
    }),
    /Network unavailable/
  );
});

test('analytics properties never receive form answers or contact details', () => {
  const properties = analyticsProperties({ utm_source: 'newsletter', utm_campaign: 'launch' }, { step_number: 3 });
  assert.deepEqual(properties, { step_number: 3, utm_source: 'newsletter', utm_campaign: 'launch' });
  assert.deepEqual(Object.values(DIAGNOSTIC_EVENTS).sort(), [
    'diagnostic_completed', 'diagnostic_page_view', 'diagnostic_started', 'diagnostic_step_completed'
  ]);
});

test('the versioned schema covers the serialized submission envelope', () => {
  const schema = JSON.parse(readFileSync('contracts/diagnostic-submission.schema.json', 'utf8'));
  assert.equal(schema.properties.diagnostic_type.const, 'general_ai');
  assert.deepEqual(schema.required, [
    'submission_id', 'diagnostic_type', 'form_started_at', 'company', 'ai_usage', 'governance', 'costs', 'automation', 'needs', 'contact', 'marketing', 'altcha'
  ]);
});
