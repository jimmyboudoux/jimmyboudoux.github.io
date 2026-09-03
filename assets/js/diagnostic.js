(() => {
  const form = document.querySelector('[data-diagnostic-form]');
  if (!form) return;

  const storageKey = 'jboudoux_diagnostic_general_ai_v1';
  const steps = [...form.querySelectorAll('[data-step]')];
  const previousButton = form.querySelector('[data-previous]');
  const nextButton = form.querySelector('[data-next]');
  const submitButton = form.querySelector('[data-submit]');
  const stepLabel = form.querySelector('[data-step-label]');
  const stepTitle = form.querySelector('[data-step-title]');
  const progressBar = form.querySelector('[data-progress-bar]');
  const formError = form.querySelector('[data-form-error]');
  const altchaWidget = form.querySelector('altcha-widget');
  const apiEndpoint = form.dataset.apiEndpoint || 'https://diagnostic-ia-api.jboudoux.fr/v1/diagnostics';
  let currentStep = 0;
  let started = false;
  let sending = false;

  const marketing = (() => {
    const params = new URLSearchParams(window.location.search);
    const read = (name) => (params.get(name) || '').slice(0, 200);
    return {
      utm_source: read('utm_source'),
      utm_medium: read('utm_medium'),
      utm_campaign: read('utm_campaign'),
      utm_content: read('utm_content'),
      utm_term: read('utm_term'),
      partner: read('partner'),
      referrer: document.referrer.slice(0, 1000),
      landing_page: `${window.location.pathname}${window.location.search}`.slice(0, 1000)
    };
  })();

  const track = (name, properties = {}) => {
    const safeProperties = { ...properties };
    if (marketing.utm_source) safeProperties.utm_source = marketing.utm_source;
    if (marketing.utm_campaign) safeProperties.utm_campaign = marketing.utm_campaign;
    if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, safeProperties);
  };

  const newSubmissionId = () => window.crypto?.randomUUID?.() || `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  const initialState = { values: {}, submission_id: newSubmissionId(), form_started_at: Date.now() };

  const loadState = () => {
    try {
      const state = JSON.parse(sessionStorage.getItem(storageKey));
      return state && typeof state === 'object' ? { ...initialState, ...state } : initialState;
    } catch {
      return initialState;
    }
  };
  let state = loadState();

  function formValues() {
    const values = {};
    for (const element of form.elements) {
      if (!element.name || element.name === 'website' || element.name === 'altcha') continue;
      if (element.type === 'checkbox') {
        if (element.name === 'newsletter_opt_in') values[element.name] = element.checked;
        else {
          values[element.name] ||= [];
          if (element.checked) values[element.name].push(element.value);
        }
      } else if (element.type === 'radio') {
        if (element.checked) values[element.name] = element.value;
      } else values[element.name] = element.value;
    }
    return values;
  }

  function saveState() {
    state.values = formValues();
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Navigation still works without storage. */ }
  }

  function restoreState() {
    Object.entries(state.values || {}).forEach(([name, value]) => {
      const elements = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
      elements.forEach((element) => {
        if (element.type === 'checkbox') element.checked = name === 'newsletter_opt_in' ? value === true : Array.isArray(value) && value.includes(element.value);
        else if (element.type === 'radio') element.checked = element.value === value;
        else element.value = value || '';
      });
    });
  }

  function markStarted() {
    if (started) return;
    started = true;
    track('diagnostic_started');
  }

  function updateConditionalFields() {
    form.querySelectorAll('[data-other-for]').forEach((wrapper) => {
      const name = wrapper.dataset.otherFor;
      const selected = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)].some((element) => element.value === 'other' && ((element.type === 'checkbox' && element.checked) || element.value === form.elements[name]?.value));
      wrapper.hidden = !selected;
      const input = wrapper.querySelector('input');
      input.required = selected;
      if (!selected) input.setCustomValidity('');
    });
    const preference = form.querySelector('[name="contact_preference"]:checked')?.value;
    const phone = form.elements.phone;
    phone.required = preference === 'phone';
    const label = form.querySelector('label[for="phone"]');
    if (label) label.innerHTML = preference === 'phone' ? 'Téléphone *' : 'Téléphone <span class="muted">(optionnel)</span>';
  }

  function enforceExclusiveNone(changed) {
    if (changed.name !== 'tools' || changed.type !== 'checkbox') return;
    const toolBoxes = [...form.querySelectorAll('[name="tools"]')];
    if (changed.value === 'none' && changed.checked) toolBoxes.filter((box) => box !== changed).forEach((box) => { box.checked = false; });
    if (changed.value !== 'none' && changed.checked) toolBoxes.find((box) => box.value === 'none').checked = false;
  }

  function clearErrors() {
    formError.hidden = true;
    formError.textContent = '';
    form.querySelectorAll('.field-error').forEach((element) => { element.textContent = ''; });
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
  }

  function setFieldError(name, message) {
    const error = document.getElementById(`error-${name}`);
    if (error) error.textContent = message;
    const field = form.elements[name];
    const element = field instanceof RadioNodeList ? field[0] : field;
    if (element) element.setAttribute('aria-invalid', 'true');
  }

  function validateCurrentStep() {
    clearErrors();
    updateConditionalFields();
    const controls = [...steps[currentStep].querySelectorAll('input, select, textarea')].filter((element) => !element.closest('[hidden]'));
    const invalid = controls.find((element) => !element.checkValidity());
    if (invalid) {
      let message = invalid.validationMessage;
      if (invalid.validity.valueMissing) message = 'Ce champ est obligatoire.';
      if (invalid.validity.typeMismatch && invalid.type === 'email') message = 'Saisissez une adresse email valide.';
      if (invalid.validity.tooShort) message = `Saisissez au moins ${invalid.minLength} caractères.`;
      setFieldError(invalid.name, message);
      invalid.reportValidity();
      invalid.focus();
      return false;
    }
    return true;
  }

  function decodeAltchaPayload(value) {
  if (typeof value !== 'string' || !value) {
    throw new Error('La vérification anti-robot n’a pas pu être générée.');
  }

  try {
    return JSON.parse(value);
  } catch {
    // ALTCHA encode normalement le payload en Base64.
  }

  try {
    const normalized = value
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      '='
    );

    return JSON.parse(atob(padded));
  } catch {
    throw new Error('La vérification anti-robot est invalide.');
  }
}

async function solveAltcha() {
  if (!altchaWidget) {
    throw new Error(
      'La protection anti-robot n’est pas disponible. Rechargez la page puis réessayez.'
    );
  }

  await customElements.whenDefined('altcha-widget');

  altchaWidget.reset();

  await new Promise((resolve, reject) => {
    let finished = false;

    const cleanup = () => {
      altchaWidget.removeEventListener('statechange', onStateChange);
      clearTimeout(timeout);
    };

    const succeed = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };

    const fail = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(
        new Error(
          'La vérification anti-robot a échoué. Réessayez dans quelques instants.'
        )
      );
    };

    const onStateChange = (event) => {
      const state = event.detail?.state;

      if (state === 'verified') {
        succeed();
      } else if (state === 'error') {
        fail();
      }
    };

    const timeout = window.setTimeout(fail, 20_000);

    altchaWidget.addEventListener('statechange', onStateChange);

    try {
      altchaWidget.verify();
    } catch {
      fail();
    }
  });

  const encoded = new FormData(form).get('altcha');

  return decodeAltchaPayload(encoded);
}

  function showStep(index, focus = true) {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => { step.hidden = stepIndex !== currentStep; });
    const legendTitle = steps[currentStep].querySelector('legend > span')?.textContent || '';
    stepLabel.textContent = `Étape ${currentStep + 1} sur ${steps.length}`;
    stepTitle.textContent = legendTitle;
    progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    previousButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    clearErrors();
    updateConditionalFields();
    if (focus) {
      form.scrollIntoView({ behavior: 'auto', block: 'start' });
      window.setTimeout(() => steps[currentStep].querySelector('input, select, textarea')?.focus({ preventScroll: true }), 50);
    }
  }

  function payload() {
    const value = formValues();
    return {
      submission_id: state.submission_id,
      diagnostic_type: 'general_ai',
      form_started_at: state.form_started_at,
      company: { company_size: value.company_size, industry: value.industry, industry_other: value.industry_other, role: value.role },
      ai_usage: { ai_usage_level: value.ai_usage_level, tools: value.tools || [], tools_other: value.tools_other, paid_licenses: value.paid_licenses, use_cases: value.use_cases || [] },
      governance: { confidential_data_usage: value.confidential_data_usage, ai_policy: value.ai_policy, training_level: value.training_level, data_rules: value.data_rules },
      costs: { cost_visibility: value.cost_visibility, license_usage_visibility: value.license_usage_visibility, cost_evolution: value.cost_evolution },
      automation: { automation_potential: value.automation_potential, data_hosting_concern: value.data_hosting_concern, private_ai_interest: value.private_ai_interest },
      needs: { main_problem: value.main_problem, priorities: value.priorities || [], horizon: value.horizon },
      contact: { first_name: value.first_name, last_name: value.last_name, company: value.company, email: value.email, phone: value.phone, contact_preference: value.contact_preference, newsletter_opt_in: value.newsletter_opt_in === true, website: form.elements.website.value },
      marketing
    };
  }

  form.addEventListener('input', (event) => {
    markStarted();
    enforceExclusiveNone(event.target);
    updateConditionalFields();
    saveState();
  });
  form.addEventListener('change', (event) => {
    enforceExclusiveNone(event.target);
    updateConditionalFields();
    saveState();
  });
  nextButton.addEventListener('click', () => {
    markStarted();
    if (!validateCurrentStep()) return;
    track('diagnostic_step_completed', { step_number: currentStep + 1 });
    showStep(currentStep + 1);
  });
  previousButton.addEventListener('click', () => showStep(currentStep - 1));
  document.querySelectorAll('[data-diagnostic-start]').forEach((button) => button.addEventListener('click', markStarted));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !validateCurrentStep()) return;
    sending = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Envoi en cours…';
    clearErrors();
    saveState();
    try {

      submitButton.textContent = 'Vérification…';

      const altcha = await solveAltcha();

      submitButton.textContent = 'Envoi en cours…';

      const diagnosticPayload = {
        ...payload(),
        altcha
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(diagnosticPayload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.fields) Object.entries(result.fields).forEach(([name, message]) => setFieldError(name, message));
        throw new Error(result.message || 'Une erreur est survenue lors de l’envoi.');
      }
      track('diagnostic_step_completed', { step_number: 7 });
      track('diagnostic_completed');
      sessionStorage.removeItem(storageKey);
      window.location.assign('/diagnostic-ia/merci/');
    } catch (error) {
      formError.textContent = `${error.message || 'Une erreur est survenue lors de l’envoi.'} Vos réponses sont conservées. Vous pouvez réessayer.`;
      formError.hidden = false;

      formError.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      formError.focus({ preventScroll: true });
      submitButton.disabled = false;
      submitButton.textContent = 'Envoyer mon diagnostic';
      sending = false;
    }
  });

  restoreState();
  updateConditionalFields();
  showStep(0, false);
  track('diagnostic_page_view');
})();
