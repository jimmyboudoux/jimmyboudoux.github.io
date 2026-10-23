// Run before the stylesheet so a saved preference applies on the first paint.
(() => {
  const storageKey = 'jboudoux-color-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (['light', 'dark', 'system'].includes(saved)) preference = saved;
  } catch {
    // Theme switching remains available when browser storage is blocked.
  }

  const applyTheme = () => {
    const theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.colorTheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141617' : '#f7f8fa');
  };
  applyTheme();
  systemTheme.addEventListener('change', () => {
    if (preference === 'system') applyTheme();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const select = document.querySelector('[data-theme-select]');
    const switcher = document.querySelector('[data-theme-switcher]');
    if (!select || !switcher) return;
    select.value = preference;
    switcher.hidden = false;
    select.addEventListener('change', () => {
      preference = select.value;
      try {
        window.localStorage.setItem(storageKey, preference);
      } catch {
        // Keep the selected theme for this page even without persistence.
      }
      applyTheme();
    });
  });
})();
