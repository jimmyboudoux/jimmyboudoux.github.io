import assert from 'node:assert/strict';
import test from 'node:test';

const { pricing, catalog } = JSON.parse(process.env.SANDBOX_TEST_DATA);

function element(properties = {}) {
  return {
    hidden: false, textContent: '', value: '', children: [], listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    emit(name, event = {}) { return this.listeners[name]?.(event); },
    append(...children) { this.children.push(...children); },
    replaceChildren() { this.children = []; },
    focus() { this.focused = true; },
    select() { this.selected = true; },
    ...properties
  };
}

test('DOM interactions: update, profile pack, copy fallback, email preparation, reset and private analytics', async () => {
  const inputs = [];
  for (const [name, options] of Object.entries({ configurations: pricing.configurations, interface: pricing.interfaces, extras: pricing.extras, objectives: catalog.objectives, profiles: pricing.hardware })) {
    options.forEach((option, index) => inputs.push(element({ name, value: option.id, checked: ['configurations', 'profiles', 'interface'].includes(name) && index === 0 })));
  }
  inputs.push(element({ name: 'advised', checked: false }));
  for (const name of ['prospect', 'company', 'email', 'comment']) inputs.push(element({ name }));
  const initial = inputs.map((input) => ({ checked: input.checked, value: input.value }));
  const names = ['total', 'total-note', 'costs', 'custom-scope', 'objectives-summary', 'profiles-summary', 'integration-hint', 'profile-status', 'recap', 'copy', 'copy-status', 'contact-status'];
  const nodes = Object.fromEntries(names.map((name) => [`[data-${name}]`, element()]));
  nodes['.sandbox-export'] = element({ open: false });
  nodes['button[type="submit"]'] = element();
  const form = element({ hidden: true, dataset: { pricing: JSON.stringify(pricing), catalog: JSON.stringify(catalog), contactEmail: 'contact@example.org' } });
  form.elements = { namedItem(name) {
    const matches = inputs.filter((input) => input.name === name);
    return matches.length === 1 ? matches[0] : { get value() { return matches.find((input) => input.checked)?.value; } };
  } };
  form.querySelector = (selector) => nodes[selector];
  form.querySelectorAll = (selector) => {
    const name = selector.match(/name="([^"]+)"/)[1];
    return inputs.filter((input) => input.name === name && (!selector.endsWith(':checked') || input.checked));
  };
  const fallback = element();
  const events = [];
  const browser = { location: {}, umami: { track: (...args) => events.push(args) } };
  let copied;
  const clipboard = { writeText: async (text) => { copied = text; } };
  const original = Object.fromEntries(['document', 'window', 'navigator'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { querySelector: (selector) => selector === '[data-sandbox-form]' ? form : fallback, createElement: () => element() } },
    window: { configurable: true, value: browser },
    navigator: { configurable: true, value: { clipboard } }
  });
  const input = (name, value) => inputs.find((item) => item.name === name && (value === undefined || item.value === value));
  const change = (name, value, checked = true) => {
    if (['configurations', 'interface'].includes(name)) inputs.filter((item) => item.name === name).forEach((item) => { item.checked = false; });
    const target = input(name, value);
    target.checked = checked;
    form.emit('change', { target });
  };
  try {
    await import('../../assets/js/sandbox/index.mjs');
    assert.equal(form.hidden, false);
    assert.equal(fallback.hidden, true);
    assert.equal(nodes['[data-total]'].textContent, '2 500 € HT');
    change('configurations', 'four');
    change('profiles', 'standard');
    change('extras', 'training');
    assert.equal(nodes['[data-total]'].textContent, '4 380 € HT');
    change('profiles', 'premium');
    assert.equal(nodes['[data-total]'].textContent, '4 802 € HT');
    assert.match(nodes['[data-recap]'].value, /Remise pack complet des profils/);
    change('interface', 'hosted');
    assert.equal(nodes['[data-total]'].textContent, '5 002 € HT');
    change('interface', 'api');
    change('profiles', 'standard', false);
    assert.equal(nodes['[data-total]'].textContent, '4 700 € HT');
    assert.doesNotMatch(nodes['[data-recap]'].value, /Remise pack complet/);
    change('advised', undefined);
    assert.equal(input('profiles', 'lite').checked, false);
    assert.equal(input('profiles', 'premium').checked, false);
    assert.equal(nodes['[data-total]'].textContent, 'Total partiel : 4 100 € HT');
    assert.equal(nodes['[data-custom-scope]'].hidden, false);
    change('profiles', 'premium');
    assert.equal(input('advised').checked, false);
    assert.equal(nodes['[data-total]'].textContent, '4 600 € HT');
    change('objectives', 'integration');
    assert.equal(nodes['[data-integration-hint]'].hidden, false);

    for (const [name, text] of Object.entries({ prospect: 'Camille Test', company: 'Entreprise Test', email: 'test@example.org', comment: 'Projet confidentiel de test' })) {
      input(name).value = text;
      form.emit('input', { target: input(name) });
    }
    assert.match(nodes['[data-recap]'].value, /Projet confidentiel de test/);
    await nodes['[data-copy]'].emit('click');
    assert.equal(copied, nodes['[data-recap]'].value);
    clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); };
    await nodes['[data-copy]'].emit('click');
    assert.equal(nodes['.sandbox-export'].open, true);
    assert.equal(nodes['[data-recap]'].selected, true);
    nodes['button[type="submit"]'].emit('click');
    let prevented = false;
    form.emit('submit', { preventDefault() { prevented = true; } });
    assert.ok(prevented);
    assert.equal(new URL(browser.location.href).searchParams.get('body'), nodes['[data-recap]'].value);
    assert.match(nodes['[data-contact-status]'].textContent, /Aucun message n’a été envoyé automatiquement/);
    assert.deepEqual(events, [['sandbox_configurator_viewed'], ['sandbox_configuration_started'], ['sandbox_quote_requested']]);

    form.emit('reset');
    inputs.forEach((item, index) => Object.assign(item, initial[index]));
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(nodes['[data-total]'].textContent, '2 500 € HT');
    assert.equal(nodes['[data-custom-scope]'].hidden, true);
    assert.equal(input('prospect').value, '');
    assert.doesNotMatch(nodes['[data-recap]'].value, /Projet confidentiel de test/);
    assert.match(nodes['[data-copy-status]'].textContent, /réinitialisées/);
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
