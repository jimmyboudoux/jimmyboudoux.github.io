import { buildSummary, describeSelection, euros, linePrice, mailto } from './core.mjs';

const form = document.querySelector('[data-sandbox-form]');
if (form) {
  const pricing = JSON.parse(form.dataset.pricing);
  const catalog = JSON.parse(form.dataset.catalog);
  const find = (selector) => form.querySelector(selector);
  const all = (selector) => [...form.querySelectorAll(selector)];
  const checked = (name) => all(`input[name="${name}"]:checked`).map((input) => input.value);
  const value = (name) => form.elements.namedItem(name).value;
  const state = () => ({
    configurations: value('configurations'),
    interface: value('interface'),
    objectives: checked('objectives'),
    profiles: checked('profiles'),
    extras: checked('extras')
  });
  const contact = () => Object.fromEntries(['prospect', 'company', 'email', 'comment'].map((name) => [name, value(name).trim()]));
  const summary = () => buildSummary(pricing, catalog, state(), contact());
  const recap = find('[data-recap]');
  const track = (event) => {
    // Fixed event names only. Never attach form fields or the recap.
    try { window.umami?.track(event); } catch { /* Analytics must not block the configurator. */ }
  };
  let started = false;
  let visited = false;
  const observeVisit = () => {
    if (visited) return;
    visited = true;
    track('sandbox_configurator_viewed');
  };

  function updatePreferences(target) {
    const advice = form.elements.namedItem('advised');
    if (target?.name === 'advised' && target.checked) {
      all('input[name="profiles"]').forEach((input) => { input.checked = false; });
    }
    advice.checked = checked('profiles').length === 0;
  }

  function render(target) {
    updatePreferences(target);
    const selection = state();
    const result = describeSelection(pricing, catalog, selection);
    find('[data-total]').textContent = `${result.custom ? 'Total partiel : ' : ''}${euros(result.total)}`;
    find('[data-total-note]').textContent = result.custom
      ? `Pour ${pricing.duration_days} jours, hors profils à définir ensemble. Montant final à confirmer.`
      : `Pour ${pricing.duration_days} jours. Tarifs indicatifs à confirmer après cadrage.`;
    const costs = find('[data-costs]');
    costs.replaceChildren();
    result.rows.forEach((row) => {
      const wrapper = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = row.label;
      description.textContent = linePrice(row);
      wrapper.append(term, description);
      costs.append(wrapper);
    });
    const custom = find('[data-custom-scope]');
    custom.hidden = !result.custom;
    custom.textContent = result.custom ? 'À chiffrer : les profils seront choisis ensemble. Leurs montants ne sont pas inclus dans ce total partiel.' : '';
    find('[data-objectives-summary]').textContent = result.objectivesText;
    find('[data-profiles-summary]').textContent = result.profilesText;
    find('[data-integration-hint]').hidden = !selection.objectives.includes('integration');
    recap.value = summary();
  }

  form.addEventListener('change', (event) => {
    if (!started && ['objectives', 'configurations', 'profiles', 'advised', 'interface', 'extras'].includes(event.target.name)) {
      started = true;
      observeVisit();
      track('sandbox_configuration_started');
    }
    find('[data-copy-status]').textContent = '';
    find('[data-contact-status]').textContent = '';
    render(event.target);
  });
  form.addEventListener('input', (event) => {
    if (['prospect', 'company', 'email', 'comment'].includes(event.target.name)) {
      recap.value = summary();
      find('[data-copy-status]').textContent = '';
      find('[data-contact-status]').textContent = '';
    }
  });
  form.addEventListener('reset', () => {
    // Native reset runs after the event; render once the browser restored defaults.
    setTimeout(() => {
      render();
      find('[data-copy-status]').textContent = 'Configuration et coordonnées réinitialisées.';
      find('[data-contact-status]').textContent = '';
    }, 0);
  });
  find('[data-copy]').addEventListener('click', async () => {
    recap.value = summary();
    try {
      await navigator.clipboard.writeText(recap.value);
      find('[data-copy-status]').textContent = 'Récapitulatif copié. Collez-le dans votre message pour me l’envoyer.';
    } catch {
      find('.sandbox-export').open = true;
      recap.focus();
      recap.select();
      find('[data-copy-status]').textContent = 'Copie automatique indisponible. Le texte est sélectionné : utilisez la commande Copier de votre appareil.';
    }
  });
  // Track the intent even when browser validation stops submission, with no payload.
  find('button[type="submit"]').addEventListener('click', () => track('sandbox_quote_requested'));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    recap.value = summary();
    find('[data-contact-status]').textContent = 'Demande préparée dans votre messagerie : vérifiez-la puis envoyez-la. Si rien ne s’ouvre, copiez le récapitulatif et contactez-moi par e-mail. Aucun message n’a été envoyé automatiquement.';
    window.location.href = mailto(form.dataset.contactEmail, recap.value);
  });

  render();
  form.hidden = false;
  document.querySelector('[data-sandbox-fallback]').hidden = true;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observeVisit();
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById('configurateur'));
  } else observeVisit();
}
