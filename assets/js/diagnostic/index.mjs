import {
  DEFAULT_API_ENDPOINT,
  DIAGNOSTIC_EVENTS,
  STORAGE_KEY,
  analyticsProperties,
  buildDiagnosticPayload,
  enforceExclusiveNone,
  initialState,
  isOtherSelected,
  readMarketing,
  valuesFromElements
} from './core.mjs';
import { solveAltcha } from './altcha.mjs';
import { clearDraft, loadDraft, saveDraft } from './storage.mjs';
import { submitDiagnostic } from './transport.mjs';

(() => {
  const form = document.querySelector('[data-diagnostic-form]');
  if (!form) return;

  const steps = [...form.querySelectorAll('[data-step]')];
  const previousButton = form.querySelector('[data-previous]');
  const nextButton = form.querySelector('[data-next]');
  const submitButton = form.querySelector('[data-submit]');
  const stepLabel = form.querySelector('[data-step-label]');
  const stepTitle = form.querySelector('[data-step-title]');
  const progressBar = form.querySelector('[data-progress-bar]');
  const formError = form.querySelector('[data-form-error]');
  const altchaWidget = form.querySelector('altcha-widget');
  const apiEndpoint = form.dataset.apiEndpoint || DEFAULT_API_ENDPOINT;
  const successUrl = form.dataset.successUrl || '/diagnostic-ia/merci/';
  const marketing = readMarketing({
    search: window.location.search,
    referrer: document.referrer,
    pathname: window.location.pathname
  });
  const fallbackState = initialState();
  let state = loadDraft(sessionStorage, STORAGE_KEY, fallbackState);
  let currentStep = 0;
  let started = false;
  let sending = false;

  const track = (name, properties = {}) => {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, analyticsProperties(marketing, properties));
    }
  };

  const formValues = () => valuesFromElements(form.elements);

  const saveState = () => {
    state.values = formValues();
    saveDraft(sessionStorage, STORAGE_KEY, state);
  };

  const restoreState = () => {
    Object.entries(state.values || {}).forEach(([name, value]) => {
      const elements = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
      elements.forEach((element) => {
        if (element.type === 'checkbox') {
          element.checked = name === 'newsletter_opt_in'
            ? value === true
            : Array.isArray(value) && value.includes(element.value);
        } else if (element.type === 'radio') {
          element.checked = element.value === value;
        } else {
          element.value = value || '';
        }
      });
    });
  };

  const markStarted = () => {
    if (started) return;
    started = true;
    track(DIAGNOSTIC_EVENTS.started);
  };

  const updateConditionalFields = () => {
    form.querySelectorAll('[data-other-for]').forEach((wrapper) => {
      const controls = [...form.querySelectorAll(`[name="${CSS.escape(wrapper.dataset.otherFor)}"]`)];
      const selected = isOtherSelected(controls);
      const input = wrapper.querySelector('input');
      wrapper.hidden = !selected;
      input.required = selected;
      if (!selected) input.setCustomValidity('');
    });

    const preference = form.querySelector('[name="contact_preference"]:checked')?.value;
    const phone = form.elements.phone;
    phone.required = preference === 'phone';
    const label = form.querySelector('label[for="phone"]');
    if (label) label.innerHTML = preference === 'phone' ? 'Téléphone *' : 'Téléphone <span class="muted">(optionnel)</span>';
  };

  const clearErrors = () => {
    formError.hidden = true;
    formError.textContent = '';
    form.querySelectorAll('.field-error').forEach((element) => { element.textContent = ''; });
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
  };

  const setFieldError = (name, message) => {
    const error = document.getElementById(`error-${name}`);
    if (error) error.textContent = message;
    const field = form.elements[name];
    const element = field instanceof RadioNodeList ? field[0] : field;
    if (element) element.setAttribute('aria-invalid', 'true');
  };

  const validateCurrentStep = () => {
    clearErrors();
    updateConditionalFields();
    const controls = [...steps[currentStep].querySelectorAll('input, select, textarea')]
      .filter((element) => !element.closest('[hidden]'));
    const invalid = controls.find((element) => !element.checkValidity());
    if (!invalid) return true;

    let message = invalid.validationMessage;
    if (invalid.validity.valueMissing) message = 'Ce champ est obligatoire.';
    if (invalid.validity.typeMismatch && invalid.type === 'email') message = 'Saisissez une adresse email valide.';
    if (invalid.validity.tooShort) message = `Saisissez au moins ${invalid.minLength} caractères.`;
    setFieldError(invalid.name, message);
    invalid.reportValidity();
    invalid.focus();
    return false;
  };

  const showStep = (index, focus = true) => {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => { step.hidden = stepIndex !== currentStep; });
    stepLabel.textContent = `Étape ${currentStep + 1} sur ${steps.length}`;
    stepTitle.textContent = steps[currentStep].querySelector('legend > span')?.textContent || '';
    progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    previousButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    clearErrors();
    updateConditionalFields();

    if (focus) {
      form.scrollIntoView({ behavior: 'auto', block: 'start' });
      window.setTimeout(() => {
        steps[currentStep].querySelector('input, select, textarea')?.focus({ preventScroll: true });
      }, 50);
    }
  };

  form.addEventListener('input', (event) => {
    markStarted();
    enforceExclusiveNone(event.target, [...form.querySelectorAll('[name="tools"]')]);
    updateConditionalFields();
    saveState();
  });

  form.addEventListener('change', (event) => {
    enforceExclusiveNone(event.target, [...form.querySelectorAll('[name="tools"]')]);
    updateConditionalFields();
    saveState();
  });

  nextButton.addEventListener('click', () => {
    markStarted();
    if (!validateCurrentStep()) return;
    track(DIAGNOSTIC_EVENTS.stepCompleted, { step_number: currentStep + 1 });
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
      const altcha = await solveAltcha({ widget: altchaWidget, form });
      submitButton.textContent = 'Envoi en cours…';

      await submitDiagnostic({
        endpoint: apiEndpoint,
        payload: {
          ...buildDiagnosticPayload({
            values: formValues(),
            state,
            marketing,
            honeypot: form.elements.website.value
          }),
          altcha
        }
      });

      track(DIAGNOSTIC_EVENTS.stepCompleted, { step_number: steps.length });
      track(DIAGNOSTIC_EVENTS.completed);
      clearDraft(sessionStorage, STORAGE_KEY);
      window.location.assign(successUrl);
    } catch (error) {
      Object.entries(error.fields || {}).forEach(([name, message]) => setFieldError(name, message));
      formError.textContent = `${error.message || 'Une erreur est survenue lors de l’envoi.'} Vos réponses sont conservées. Vous pouvez réessayer.`;
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formError.focus({ preventScroll: true });
      submitButton.disabled = false;
      submitButton.textContent = 'Envoyer mon diagnostic';
      sending = false;
    }
  });

  restoreState();
  updateConditionalFields();
  showStep(0, false);
  track(DIAGNOSTIC_EVENTS.pageView);
})();
