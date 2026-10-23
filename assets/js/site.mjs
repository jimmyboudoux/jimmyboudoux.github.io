import { mountBookingTracking, mountMenu, setCurrentYear } from './site-core.mjs';

const menus = new WeakMap();
const closeMenus = new Set();
const refreshPage = () => {
  closeMenus.forEach((close) => close());
  document.querySelectorAll('[data-menu-button]').forEach((button) => {
    if (menus.has(button)) return;
    const menu = document.getElementById(button.getAttribute('aria-controls'));
    if (!menu) return;
    button.hidden = false;
    menu.classList.add('is-collapsible');
    const desktopMinimum = getComputedStyle(document.documentElement).getPropertyValue('--menu-desktop-min').trim() || '901px';
    const close = mountMenu({
      button, menu, documentRef: document,
      mediaQuery: window.matchMedia(`(min-width: ${desktopMinimum})`)
    });
    menus.set(button, close);
    closeMenus.add(close);
  });
  document.documentElement.classList.add('presentation-enhanced');
  setCurrentYear(document);
  mountBookingTracking({
    documentRef: document,
    umami: () => window.umami,
    allowedLocations: JSON.parse(document.body.dataset.bookingLocations || '[]')
  });
};
refreshPage();
document.addEventListener('presentationchange', refreshPage);
