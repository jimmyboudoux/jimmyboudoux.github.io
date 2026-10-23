import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../../assets/js/theme.js', import.meta.url), 'utf8');

function fixture({ saved = null, dark = true, blocked = false } = {}) {
  const root = { dataset: {} };
  const meta = { setAttribute(name, value) { this[name] = value; } };
  const switcher = { hidden: true };
  const select = { addEventListener(name, listener) { this.change = listener; } };
  const system = { matches: dark, addEventListener(name, listener) { this.change = listener; } };
  const store = new Map(saved ? [['jboudoux-color-theme', saved]] : []);
  let ready;
  vm.runInNewContext(source, {
    window: {
      matchMedia: () => system,
      localStorage: {
        getItem(key) { if (blocked) throw new Error('Blocked'); return store.get(key); },
        setItem(key, value) { if (blocked) throw new Error('Blocked'); store.set(key, value); }
      }
    },
    document: {
      documentElement: root,
      querySelector(selector) {
        if (selector === '[data-theme-select]') return select;
        if (selector === '[data-theme-switcher]') return switcher;
        return meta;
      },
      addEventListener(name, listener) { ready = listener; }
    }
  });
  return { root, meta, switcher, select, system, store, ready: () => ready() };
}

test('a saved light theme overrides a dark computer before the page is displayed and persists across pages', () => {
  const page = fixture({ saved: 'light' });
  assert.equal(page.root.dataset.colorTheme, 'light');
  assert.equal(page.meta.content, '#f7f8fa');
  assert.equal(page.switcher.hidden, true);
  page.ready();
  assert.equal(page.select.value, 'light');
  assert.equal(page.switcher.hidden, false);
  page.select.value = 'dark';
  page.select.change();
  assert.equal(page.root.dataset.colorTheme, 'dark');
  assert.equal(page.meta.content, '#141617');
  const nextPage = fixture({ saved: page.store.get('jboudoux-color-theme'), dark: false });
  assert.equal(nextPage.root.dataset.colorTheme, 'dark');
});

test('system mode follows the computer, while an explicit preference stays fixed', () => {
  const page = fixture({ saved: 'invalid' });
  page.ready();
  assert.equal(page.select.value, 'system');
  assert.equal(page.root.dataset.colorTheme, 'dark');
  page.system.matches = false;
  page.system.change();
  assert.equal(page.root.dataset.colorTheme, 'light');
  page.select.value = 'light';
  page.select.change();
  page.system.matches = true;
  page.system.change();
  assert.equal(page.root.dataset.colorTheme, 'light');
  page.select.value = 'system';
  page.select.change();
  assert.equal(page.root.dataset.colorTheme, 'dark');
});

test('switching themes still works when browser storage is blocked', () => {
  const page = fixture({ blocked: true });
  page.ready();
  page.select.value = 'light';
  assert.doesNotThrow(() => page.select.change());
  assert.equal(page.root.dataset.colorTheme, 'light');
});
