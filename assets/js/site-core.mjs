export function mountMenu({ button, menu, documentRef, mediaQuery }) {
  if (!button || !menu) return () => {};

  const closeMenu = ({ returnFocus = false } = {}) => {
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus();
  };

  button.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
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

export function mountBookingTracking({ documentRef, umami }) {
  documentRef.querySelectorAll('[data-booking-location]').forEach((link) => {
    link.addEventListener('click', () => {
      if (link.dataset.bookingLocation.startsWith('diagnostic') && typeof umami?.track === 'function') {
        umami.track('diagnostic_calendar_clicked');
      }
    });
  });
}
