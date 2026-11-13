import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSummary, describeSelection, estimate, euros, linePrice, mailto } from '../../assets/js/sandbox/core.mjs';

const { pricing, catalog } = JSON.parse(process.env.SANDBOX_TEST_DATA);
const base = { configurations: 'base', interface: 'api', extras: [], objectives: [], profiles: ['lite'] };

test('default includes Lite; objectives do not automatically increase the budget', () => {
  assert.equal(estimate(pricing, base).total, 2500);
  assert.equal(estimate(pricing, { ...base, objectives: catalog.objectives.map((item) => item.id) }).total, 2500);
  assert.equal(pricing.interfaces.find((option) => option.id === 'api').supplement, 0);
  assert.equal(pricing.interfaces.find((option) => option.id === 'hosted').supplement, 200);
  assert.equal(estimate(pricing, base).custom, false);
});

test('individual profiles, pairs and the full pack use the requested tariffs', () => {
  for (const [profiles, profilePrice] of [[['lite'], 100], [['standard'], 180], [['premium'], 500], [['lite', 'standard'], 280], [['lite', 'premium'], 600], [['standard', 'premium'], 680], [['lite', 'standard', 'premium'], 702]]) {
    const result = estimate(pricing, { ...base, profiles });
    assert.equal(result.profilesTotal, profilePrice);
    assert.equal(result.total, pricing.amount + profilePrice);
  }
  const pack = estimate(pricing, { ...base, profiles: ['lite', 'standard', 'premium'], extras: ['training'], interface: 'hosted' });
  assert.equal(pack.discount, 78);
  assert.equal(pack.total, 4202); // Discount applies only to profiles, never to accompaniment or extras.
  assert.match(linePrice(pack.rows.find((row) => row.supplement < 0)), /-78 € HT/);
});

test('all 192 combinations respect profile selection, exclusive interfaces and advice-only partial totals', () => {
  for (let mask = 0; mask < 8; mask++) {
    const profiles = pricing.hardware.filter((_, index) => mask & (1 << index));
    const sum = profiles.reduce((total, profile) => total + profile.supplement, 0);
    const expectedProfiles = profiles.length === 3 ? sum * 0.9 : sum;
    for (const configuration of pricing.configurations) {
      for (const access of pricing.interfaces) {
        for (const extras of [[], ['training'], ['report'], ['training', 'report']]) {
          const result = estimate(pricing, { ...base, profiles: profiles.map((profile) => profile.id), configurations: configuration.id, interface: access.id, extras });
          assert.equal(result.total, pricing.amount + configuration.supplement + expectedProfiles + access.supplement + pricing.extras.filter((item) => extras.includes(item.id)).reduce((total, item) => total + item.supplement, 0));
          assert.equal(result.custom, profiles.length === 0);
          assert.equal(result.rows.filter((row) => pricing.interfaces.includes(row)).length, 1);
        }
      }
    }
  }
});

test('no selected profile means an explicit partial total, not a definitive quote', () => {
  const state = { ...base, profiles: [], interface: 'hosted', extras: ['report'] };
  const result = estimate(pricing, state);
  assert.equal(result.total, 3300);
  assert.equal(linePrice(result.rows.find((row) => row.custom)), 'Sur devis');
  const summary = buildSummary(pricing, catalog, state);
  assert.match(summary, /Total partiel connu : 3 300 € HT/);
  assert.match(summary, /Hors profils à définir ensemble/);
  assert.doesNotMatch(summary, /Budget total estimatif/);
});

test('summary includes selections, services, coordinates and the pack discount; mailto round-trips safely', () => {
  const state = { ...base, objectives: ['documents', 'investment'], profiles: ['lite', 'standard', 'premium'], extras: ['training', 'report'] };
  const contact = { prospect: 'Camille & Léa', company: 'Test + Co', email: 'test@example.org', comment: 'Contexte ? 10% & <script>test</script>\nDeuxième ligne' };
  const summary = buildSummary(pricing, catalog, state, contact);
  for (const value of [...catalog.included, ...Object.values(contact)]) assert.ok(summary.includes(value));
  assert.match(summary, /OCR/);
  assert.match(summary, /Profil Premium/);
  assert.match(summary, /Remise pack complet des profils \(10 %\) : -78 € HT/);
  assert.doesNotMatch(summary, /Mac mini|Mac Studio|Ryzen|RTX/);
  const url = new URL(mailto('contact@example.org', summary));
  assert.equal(url.searchParams.get('body'), summary);
  assert.equal(url.pathname, 'contact@example.org');
});

test('unknown IDs and duplicate profiles or extras cannot affect the quote', () => {
  assert.equal(estimate(pricing, { ...base, configurations: 'invalid', extras: ['training', 'training', 'fake'], profiles: ['lite', 'lite', 'fake'] }).total, 3400);
  const result = describeSelection(pricing, catalog, { ...base, objectives: ['fake'], profiles: ['fake'] });
  assert.match(result.objectivesText, /à cadrer ensemble/);
  assert.match(result.profilesText, /être conseillé/);
  assert.equal(result.custom, true);
});

test('tariff and discount edits propagate without changing JavaScript; amounts round in cents', () => {
  const changed = structuredClone(pricing);
  changed.amount = 2780;
  changed.interfaces.find((item) => item.id === 'hosted').supplement = 615;
  assert.equal(estimate(changed, { ...base, interface: 'hosted' }).total, 3495);
  changed.hardware[0].supplement = 101;
  const pack = estimate(changed, { ...base, profiles: ['lite', 'standard', 'premium'] });
  assert.equal(pack.profilesTotal, 702.9);
  assert.equal(euros(pack.profilesTotal), '702,90 € HT');
  changed.hardware_pack_discount_percent = 20;
  assert.equal(estimate(changed, { ...base, profiles: ['lite', 'standard', 'premium'] }).profilesTotal, 624.8);
});
