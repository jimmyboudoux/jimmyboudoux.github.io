(() => {
  const btn = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-menu]');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }));
  }
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-booking-location]').forEach(link => link.addEventListener('click', () => {
    if (link.dataset.bookingLocation.startsWith('diagnostic') && window.umami && typeof window.umami.track === 'function') {
      window.umami.track('diagnostic_calendar_clicked');
    }
  }));
})();
