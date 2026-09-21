export const STORAGE_KEY = 'jboudoux_diagnostic_general_ai_v1';
export const ALTCHA_TIMEOUT_MS = 20_000;
export const MARKETING_VALUE_MAX_LENGTH = 200;
export const MARKETING_CONTEXT_MAX_LENGTH = 1_000;

export const DIAGNOSTIC_EVENTS = Object.freeze({
  pageView: 'diagnostic_page_view',
  started: 'diagnostic_started',
  stepCompleted: 'diagnostic_step_completed',
  completed: 'diagnostic_completed'
});

export function newSubmissionId({ crypto = globalThis.crypto, now = Date.now, random = Math.random } = {}) {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${now().toString(16)}-${random().toString(16).slice(2)}-${random().toString(16).slice(2)}`;
}

export function initialState(options = {}) {
  const now = options.now || Date.now;
  return {
    values: {},
    submission_id: newSubmissionId(options),
    form_started_at: now()
  };
}

export function safeStoredState(serialized, fallback) {
  try {
    const stored = JSON.parse(serialized);
    return stored && typeof stored === 'object' ? { ...fallback, ...stored } : fallback;
  } catch {
    return fallback;
  }
}

export function readMarketing({ search = '', referrer = '', pathname = '' } = {}) {
  const params = new URLSearchParams(search);
  const read = (name) => (params.get(name) || '').slice(0, MARKETING_VALUE_MAX_LENGTH);

  return {
    utm_source: read('utm_source'),
    utm_medium: read('utm_medium'),
    utm_campaign: read('utm_campaign'),
    utm_content: read('utm_content'),
    utm_term: read('utm_term'),
    partner: read('partner'),
    referrer: referrer.slice(0, MARKETING_CONTEXT_MAX_LENGTH),
    landing_page: `${pathname}${search}`.slice(0, MARKETING_CONTEXT_MAX_LENGTH)
  };
}

export function valuesFromElements(elements) {
  const values = {};

  for (const element of elements) {
    if (!element.name || element.name === 'website' || element.name === 'altcha') continue;

    if (element.type === 'checkbox') {
      if (element.name === 'newsletter_opt_in') {
        values[element.name] = element.checked;
      } else {
        values[element.name] ||= [];
        if (element.checked) values[element.name].push(element.value);
      }
    } else if (element.type === 'radio') {
      if (element.checked) values[element.name] = element.value;
    } else {
      values[element.name] = element.value;
    }
  }

  return values;
}

export function isOtherSelected(elements) {
  return elements.some((element) => (
    element.value === 'other'
    && ((element.type === 'checkbox' && element.checked) || element.checked)
  ));
}

export function enforceExclusiveNone(changed, controls) {
  if (changed.name !== 'tools' || changed.type !== 'checkbox') return;

  const toolBoxes = controls.filter((control) => control.name === 'tools');
  if (changed.value === 'none' && changed.checked) {
    toolBoxes.filter((control) => control !== changed).forEach((control) => { control.checked = false; });
  }

  if (changed.value !== 'none' && changed.checked) {
    const none = toolBoxes.find((control) => control.value === 'none');
    if (none) none.checked = false;
  }
}

export function buildDiagnosticPayload({ values, state, marketing, honeypot = '' }) {
  return {
    submission_id: state.submission_id,
    diagnostic_type: 'general_ai',
    form_started_at: state.form_started_at,
    company: {
      company_size: values.company_size,
      industry: values.industry,
      industry_other: values.industry_other,
      role: values.role
    },
    ai_usage: {
      ai_usage_level: values.ai_usage_level,
      tools: values.tools || [],
      tools_other: values.tools_other,
      paid_licenses: values.paid_licenses,
      use_cases: values.use_cases || []
    },
    governance: {
      confidential_data_usage: values.confidential_data_usage,
      ai_policy: values.ai_policy,
      training_level: values.training_level,
      data_rules: values.data_rules
    },
    costs: {
      cost_visibility: values.cost_visibility,
      license_usage_visibility: values.license_usage_visibility,
      cost_evolution: values.cost_evolution
    },
    automation: {
      automation_potential: values.automation_potential,
      data_hosting_concern: values.data_hosting_concern,
      private_ai_interest: values.private_ai_interest
    },
    needs: {
      main_problem: values.main_problem,
      priorities: values.priorities || [],
      horizon: values.horizon
    },
    contact: {
      first_name: values.first_name,
      last_name: values.last_name,
      company: values.company,
      email: values.email,
      phone: values.phone,
      contact_preference: values.contact_preference,
      newsletter_opt_in: values.newsletter_opt_in === true,
      website: honeypot
    },
    marketing
  };
}

export function decodeAltchaPayload(value, decodeBase64 = globalThis.atob) {
  if (typeof value !== 'string' || !value) {
    throw new Error('La vérification anti-robot n’a pas pu être générée.');
  }

  try {
    return JSON.parse(value);
  } catch {
    // ALTCHA can return the JSON payload as Base64URL.
  }

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(decodeBase64(padded));
  } catch {
    throw new Error('La vérification anti-robot est invalide.');
  }
}

export function analyticsProperties(marketing, properties = {}) {
  const safeProperties = { ...properties };
  if (marketing.utm_source) safeProperties.utm_source = marketing.utm_source;
  if (marketing.utm_campaign) safeProperties.utm_campaign = marketing.utm_campaign;
  return safeProperties;
}
