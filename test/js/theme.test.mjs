import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../../assets/js/theme.js', import.meta.url), 'utf8');
function eventTarget(extra = {}) {
  const listeners = new Map();
  return { ...extra, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name),
    emit: (name) => listeners.get(name)?.(), focus() {} };
}
function fixture({ presentation, color, dark = true, blocked = false } = {}) {
  const root = { dataset: { presentation: 'commercial' } };
  const meta = { setAttribute(name, value) { this[name] = value; } };
  const selector = eventTarget();
  const colorSelector = eventTarget();
  const control = { hidden: true };
  const controls = { hidden: true };
  const status = { textContent: '' };
  const system = eventTarget({ matches: dark });
  const store = new Map();
  if (presentation) store.set('jboudoux-presentation', presentation);
  if (color) store.set('jboudoux-color-theme', color);
  const styles = Object.fromEntries(['commercial', 'minimalist'].map((name) => [name,
    eventTarget({ dataset: { presentationStyles: name }, sheet: {} })]));
  const hosts = Object.fromEntries(['header', 'footer', 'home'].map((name) => [name, {
    childNodes: [{ name: `commercial-${name}` }],
    replaceChildren(...nodes) { this.childNodes = nodes; }
  }]));
  const templates = Object.fromEntries(['header', 'footer', 'home'].map((name) => [name, {
    content: { cloneNode: () => ({ childNodes: [{ name: `minimalist-${name}` }] }) }
  }]));
  let ready;
  const events = [];
  vm.runInNewContext(source, {
    Event: class { constructor(type) { this.type = type; } },
    window: {
      matchMedia: () => system, setTimeout, clearTimeout,
      localStorage: {
        getItem(key) { if (blocked) throw new Error('Blocked'); return store.get(key); },
        setItem(key, value) { if (blocked) throw new Error('Blocked'); store.set(key, value); }
      }
    },
    document: {
      documentElement: root,
      querySelectorAll: () => Object.values(styles),
      querySelector(query) {
        if (query === '[data-presentation-select]') return selector;
        if (query === '[data-theme-select]') return colorSelector;
        if (query === '[data-theme-switcher]') return control;
        if (query === '[data-appearance-controls]') return controls;
        if (query === '[data-appearance-status]') return status;
        if (query === '[data-home-content]') return hosts.home;
        const region = query.match(/data-(header|footer)-host|data-region="(header|footer|home)"/);
        if (region) return region[1] ? hosts[region[1]] : templates[region[2]];
        return meta;
      },
      dispatchEvent: (event) => events.push(event.type),
      addEventListener(name, listener) { ready = listener; }
    }
  });
  return { root, meta, selector, colorSelector, control, controls, status, styles, hosts, system, store, events, ready: () => ready(),
    async change(value) { selector.value = value; await selector.emit('change'); },
    changeColor(value) { colorSelector.value = value; colorSelector.emit('change'); } };
}

test('first visit defaults to the commercial view, including when a dark color preference was saved', async () => {
  const page = fixture({ color: 'dark' });
  assert.equal(page.root.dataset.presentation, 'commercial');
  assert.equal(page.root.dataset.colorTheme, 'light');
  assert.equal(page.styles.commercial.media, 'all');
  assert.equal(page.styles.minimalist.media, 'not all');
  await page.ready();
  assert.equal(page.selector.value, 'commercial');
  assert.equal(page.control.hidden, true);
  assert.equal(page.controls.hidden, false);
});

test('both views restore the same DOM nodes and preserve an existing pragmatic preference', async () => {
  const page = fixture();
  const original = page.hosts.home.childNodes[0];
  await page.ready();
  await page.change('minimalist');
  const pragmatic = page.hosts.home.childNodes[0];
  assert.equal(pragmatic.name, 'minimalist-home');
  assert.equal(page.control.hidden, false);
  page.changeColor('dark');
  await page.change('commercial');
  assert.equal(page.hosts.home.childNodes[0], original);
  assert.equal(page.control.hidden, true);
  await page.change('minimalist');
  assert.equal(page.hosts.home.childNodes[0], pragmatic);
  const next = fixture({ presentation: page.store.get('jboudoux-presentation'), color: page.store.get('jboudoux-color-theme') });
  await next.ready();
  assert.equal(next.root.dataset.presentation, 'minimalist');
  assert.equal(next.root.dataset.colorTheme, 'dark');
});

test('minimalist defaults to system and follows system changes only when requested', async () => {
  const page = fixture({ presentation: 'minimalist' });
  await page.ready();
  assert.equal(page.colorSelector.value, 'system');
  page.system.matches = false;
  page.system.emit('change');
  assert.equal(page.root.dataset.colorTheme, 'light');
  page.changeColor('dark');
  page.system.emit('change');
  assert.equal(page.root.dataset.colorTheme, 'dark');
  await page.change('commercial');
  page.system.matches = true;
  page.system.emit('change');
  assert.equal(page.root.dataset.colorTheme, 'light');
});

test('blocked storage does not prevent changing presentation or color', async () => {
  const page = fixture({ blocked: true });
  await page.ready();
  await page.change('minimalist');
  page.changeColor('light');
  assert.equal(page.root.dataset.presentation, 'minimalist');
  assert.equal(page.root.dataset.colorTheme, 'light');
});

test('failed stylesheet loading preserves the active presentation and saved preference', async () => {
  const page = fixture({ presentation: 'minimalist' });
  await page.ready();
  page.styles.commercial.sheet = null;
  const changing = page.change('commercial');
  page.styles.commercial.emit('error');
  await changing;
  assert.equal(page.root.dataset.presentation, 'minimalist');
  assert.equal(page.selector.value, 'minimalist');
  assert.equal(page.store.get('jboudoux-presentation'), 'minimalist');
  assert.match(page.status.textContent, /Impossible de charger/);
});

test('failed commercial stylesheet falls back to the pragmatic view on startup', async () => {
  const page = fixture({ presentation: 'commercial' });
  page.styles.commercial.sheet = null;
  const starting = page.ready();
  page.styles.commercial.emit('error');
  await starting;
  assert.equal(page.root.dataset.presentation, 'minimalist');
  assert.equal(page.root.dataset.colorTheme, 'dark');
  assert.equal(page.controls.hidden, false);
});
