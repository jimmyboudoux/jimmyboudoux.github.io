import { mountBookingTracking, mountMenu, setCurrentYear } from './site-core.mjs';

mountMenu({
  button: document.querySelector('[data-menu-button]'),
  menu: document.querySelector('[data-menu]'),
  documentRef: document,
  mediaQuery: window.matchMedia('(min-width: 761px)')
});
setCurrentYear(document);
mountBookingTracking({ documentRef: document, umami: window.umami });
