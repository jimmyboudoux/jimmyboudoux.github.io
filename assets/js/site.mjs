import { mountBookingTracking, mountMenu, setCurrentYear } from './site-core.mjs';

const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');
if (menuButton && menu) {
  menuButton.hidden = false;
  menu.classList.add('is-collapsible');
}
mountMenu({
  button: menuButton,
  menu,
  documentRef: document,
  mediaQuery: window.matchMedia(`(min-width: ${getComputedStyle(document.documentElement).getPropertyValue('--menu-desktop-min').trim()})`)
});
setCurrentYear(document);
mountBookingTracking({
  documentRef: document,
  umami: () => window.umami,
  allowedLocations: JSON.parse(document.body.dataset.bookingLocations || '[]')
});
