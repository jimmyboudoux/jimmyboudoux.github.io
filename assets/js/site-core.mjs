export function mountMenu({ button, menu, documentRef, mediaQuery }) {
  if (!button || !menu) return () => {};

  const closeMenu = ({ returnFocus = false } = {}) => {
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Ouvrir le menu');
    if (returnFocus) button.focus();
  };

  button.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  documentRef.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu({ returnFocus: true });
  });
  documentRef.addEventListener('click', (event) => {
    if (menu.classList.contains('is-open') && !menu.contains(event.target) && !button.contains(event.target)) closeMenu();
  });
  mediaQuery?.addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  return closeMenu;
}

export function setCurrentYear(documentRef, year = new Date().getFullYear()) {
  documentRef.querySelectorAll('[data-year]').forEach((element) => { element.textContent = year; });
}

export function mountBookingTracking({ documentRef, umami, allowedLocations = [] }) {
  const safeLocations = new Set(allowedLocations);
  documentRef.querySelectorAll('[data-booking-location]').forEach((link) => {
    link.addEventListener('click', () => {
      const location = link.dataset.bookingLocation;
      const tracker = typeof umami === 'function' ? umami() : umami;
      if (!safeLocations.has(location) || typeof tracker?.track !== 'function') return;

      tracker.track('booking_calendar_clicked', { location });
      if (location.startsWith('diagnostic')) tracker.track('diagnostic_calendar_clicked');
    });
  });
}
