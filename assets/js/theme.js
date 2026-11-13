// Both stylesheets precede this blocking script: restore the choice before painting.
(() => {
  const root = document.documentElement;
  const initialPresentation = root.dataset.presentation;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const styles = Object.fromEntries([...document.querySelectorAll('[data-presentation-styles]')]
    .map((link) => [link.dataset.presentationStyles, link]));
  const read = (key, choices, fallback) => {
    try {
      const value = window.localStorage.getItem(key);
      return choices.includes(value) ? value : fallback;
    } catch { return fallback; }
  };
  const save = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch { /* Use this page without persistence. */ }
  };
  let presentation = read('jboudoux-presentation', ['commercial', 'minimalist'], 'commercial');
  let colorPreference = read('jboudoux-color-theme', ['system', 'light', 'dark'], 'system');
  const applyColor = () => {
    const color = presentation === 'commercial' ? 'light'
      : colorPreference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : colorPreference;
    root.dataset.colorTheme = color;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',
      presentation === 'commercial' ? '#fbfaf7' : color === 'dark' ? '#141617' : '#f7f8fa');
  };
  const activateStyles = () => {
    Object.entries(styles).forEach(([name, link]) => { link.media = name === presentation ? 'all' : 'not all'; });
    root.dataset.presentation = presentation;
    applyColor();
  };
  activateStyles();
  systemTheme.addEventListener('change', () => {
    if (presentation === 'minimalist' && colorPreference === 'system') applyColor();
  });

  const waitForStyles = (name) => {
    const link = styles[name];
    if (link?.sheet) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (!link) { reject(new Error('Missing stylesheet')); return; }
      const finish = (success) => {
        window.clearTimeout(timeout);
        link.removeEventListener('load', loaded);
        link.removeEventListener('error', failed);
        if (success) resolve(); else reject(new Error('Stylesheet unavailable'));
      };
      const loaded = () => finish(true);
      const failed = () => finish(false);
      const timeout = window.setTimeout(failed, 8000);
      link.addEventListener('load', loaded);
      link.addEventListener('error', failed);
    });
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const selector = document.querySelector('[data-presentation-select]');
    const colorSelector = document.querySelector('[data-theme-select]');
    const colorControl = document.querySelector('[data-theme-switcher]');
    const controls = document.querySelector('[data-appearance-controls]');
    const status = document.querySelector('[data-appearance-status]');
    if (!selector || !colorSelector || !controls) return;
    let mountedPresentation = initialPresentation;
    const regions = ['header', 'footer', 'home'].map((region) => {
      const host = document.querySelector(region === 'home' ? '[data-home-content]' : `[data-${region}-host]`);
      const template = document.querySelector(`template[data-region="${region}"]`);
      return host && template ? { host, template, cache: new Map([[initialPresentation, [...host.childNodes]]]) } : null;
    }).filter(Boolean);
    const mountPresentation = (next) => {
      if (next !== mountedPresentation) {
        regions.forEach(({ host, template, cache }) => {
          if (!cache.has(next)) cache.set(next, [...template.content.cloneNode(true).childNodes]);
          host.replaceChildren(...cache.get(next));
        });
        mountedPresentation = next;
      }
      presentation = next;
      activateStyles();
      selector.value = next;
      colorSelector.value = colorPreference;
      colorControl.hidden = next === 'commercial';
      root.dataset.presentationReady = 'true';
      document.dispatchEvent(new Event('presentationchange'));
    };
    try {
      await waitForStyles(presentation);
      mountPresentation(presentation);
    } catch {
      mountPresentation('minimalist');
      status.textContent = 'Cette présentation est indisponible. La vue pragmatique reste affichée.';
    }
    controls.hidden = false;
    selector.addEventListener('change', async () => {
      const next = selector.value;
      if (!['commercial', 'minimalist'].includes(next)) return;
      selector.disabled = true;
      status.textContent = '';
      try {
        await waitForStyles(next);
        mountPresentation(next);
        save('jboudoux-presentation', next);
      } catch {
        selector.value = presentation;
        status.textContent = 'Impossible de charger cette présentation. Réessayez dans un instant.';
      } finally {
        selector.disabled = false;
        selector.focus({ preventScroll: true });
      }
    });
    colorSelector.addEventListener('change', () => {
      if (!['system', 'light', 'dark'].includes(colorSelector.value)) return;
      colorPreference = colorSelector.value;
      save('jboudoux-color-theme', colorPreference);
      applyColor();
    });
  });
})();
