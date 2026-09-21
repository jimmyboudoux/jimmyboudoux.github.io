import assert from 'node:assert/strict';
import test from 'node:test';

import { mountBookingTracking, mountMenu, setCurrentYear } from '../../assets/js/site-core.mjs';

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(name, listener) { listeners.set(name, listener); },
    emit(name, event = {}) { listeners.get(name)?.(event); }
  };
}

function classList() {
  const values = new Set();
  return {
    add: (value) => values.add(value),
    remove: (value) => values.delete(value),
    contains: (value) => values.has(value),
    toggle: (value) => {
      if (values.has(value)) {
        values.delete(value);
        return false;
      }
      values.add(value);
      return true;
    }
  };
}

function menuFixture() {
  const documentRef = eventTarget();
  const mediaQuery = eventTarget();
  const button = {
    ...eventTarget(),
    attributes: { 'aria-expanded': 'false' },
    setAttribute(name, value) { this.attributes[name] = value; },
    contains: () => false,
    focusCalled: false,
    focus() { this.focusCalled = true; }
  };
  const link = eventTarget();
  const menu = {
    classList: classList(),
    contains: () => false,
    querySelectorAll: () => [link]
  };
  return { button, documentRef, link, mediaQuery, menu };
}

test('menu supports click, Escape, outside click, link click and desktop breakpoint close', () => {
  const fixture = menuFixture();
  mountMenu(fixture);

  fixture.button.emit('click');
  assert.equal(fixture.menu.classList.contains('is-open'), true);
  assert.equal(fixture.button.attributes['aria-expanded'], 'true');
  assert.equal(fixture.button.attributes['aria-label'], 'Fermer le menu');

  fixture.documentRef.emit('keydown', { key: 'Escape' });
  assert.equal(fixture.menu.classList.contains('is-open'), false);
  assert.equal(fixture.button.focusCalled, true);
  assert.equal(fixture.button.attributes['aria-label'], 'Ouvrir le menu');

  fixture.button.emit('click');
  fixture.documentRef.emit('click', { target: {} });
  assert.equal(fixture.menu.classList.contains('is-open'), false);

  fixture.button.emit('click');
  fixture.link.emit('click');
  assert.equal(fixture.menu.classList.contains('is-open'), false);

  fixture.button.emit('click');
  fixture.mediaQuery.emit('change', { matches: true });
  assert.equal(fixture.menu.classList.contains('is-open'), false);
});

test('global interactions update the year and track only allowlisted booking locations', () => {
  const normal = { ...eventTarget(), dataset: { bookingLocation: 'homepage' } };
  const diagnostic = { ...eventTarget(), dataset: { bookingLocation: 'diagnostic_home' } };
  const year = { textContent: '' };
  const documentRef = {
    querySelectorAll(selector) {
      if (selector === '[data-year]') return [year];
      return [normal, diagnostic];
    }
  };
  const events = [];

  setCurrentYear(documentRef, 2030);
  mountBookingTracking({ documentRef, umami: { track: (name, properties) => events.push([name, properties]) } });
  normal.emit('click');
  diagnostic.emit('click');

  assert.equal(year.textContent, 2030);
  assert.deepEqual(events, [
    ['booking_calendar_clicked', { location: 'homepage' }],
    ['booking_calendar_clicked', { location: 'diagnostic_home' }],
    ['diagnostic_calendar_clicked', undefined]
  ]);
});
