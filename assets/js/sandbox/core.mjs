// Pricing comes from Jekyll data attributes, never from duplicated JS constants.
export const euros = (amount) => `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount).replace(/\s/g, ' ')} € HT`;

const select = (options, id) => options.find((option) => option.id === id) || options[0];
const selected = (options, ids = []) => options.filter((option) => ids.includes(option.id));

export function estimate(pricing, state) {
  const configurations = select(pricing.configurations, state.configurations);
  const hardware = selected(pricing.hardware, state.profiles);
  const interfaceOption = select(pricing.interfaces, state.interface);
  const extras = selected(pricing.extras, state.extras);
  const profileCents = hardware.reduce((total, profile) => total + Math.round(profile.supplement * 100), 0);
  const discountCents = hardware.length === pricing.hardware.length
    ? Math.round(profileCents * pricing.hardware_pack_discount_percent / 100)
    : 0;
  const rows = [
    { label: 'Forfait d’accompagnement', supplement: pricing.amount },
    configurations,
    ...(hardware.length ? hardware : [{ label: 'Profils à définir ensemble', custom: true }]),
    ...(discountCents ? [{ label: `Remise pack complet des profils (${pricing.hardware_pack_discount_percent} %)`, supplement: -discountCents / 100 }] : []),
    interfaceOption,
    ...extras
  ];
  return {
    rows,
    total: Math.round(rows.reduce((total, row) => total + (row.supplement || 0), 0) * 100) / 100,
    profilesTotal: (profileCents - discountCents) / 100,
    discount: discountCents / 100,
    custom: hardware.length === 0,
    configurations,
    hardware,
    interfaceOption,
    extras
  };
}

export function linePrice(row) {
  if (row.custom) return 'Sur devis';
  return row.supplement === 0 ? 'Inclus' : `${euros(row.supplement)}${row.monthly ? ' / mois' : ''}`;
}

export function describeSelection(pricing, catalog, state) {
  const result = estimate(pricing, state);
  const objectives = selected(catalog.objectives, state.objectives).map((item) => item.label);
  const profiles = selected(catalog.profiles, state.profiles).map((item) => item.label);
  return {
    ...result,
    objectivesText: `Objectifs : ${objectives.join(' ; ') || 'à cadrer ensemble'}.`,
    profilesText: `Profils retenus : ${profiles.join(' ; ') || 'je souhaite être conseillé'}.`
  };
}

export function buildSummary(pricing, catalog, state, contact = {}) {
  const result = describeSelection(pricing, catalog, state);
  const budget = result.custom
    ? `Total partiel connu : ${euros(result.total)} pour ${pricing.duration_days} jours. Hors profils à définir ensemble, qui seront chiffrés en supplément. Montant final à confirmer.`
    : `Budget total estimatif : ${euros(result.total)} pour ${pricing.duration_days} jours.`;
  return [
    'DEMANDE DE DEVIS — SANDBOX IA LOCALE',
    '',
    result.objectivesText,
    result.profilesText,
    '',
    'Prestations et budget :',
    ...result.rows.map((row) => `- ${row.label} : ${linePrice(row)}`),
    ...(result.extras.length ? [] : ['- Formation approfondie et rapport approfondi : non retenus']),
    budget,
    '',
    'Inclus dans le forfait de départ :',
    `- Jusqu’à ${pricing.max_configurations} configurations, sessions accompagnées et accès API sécurisé ; profils facturés séparément`,
    ...catalog.included.map((item) => `- ${item}`),
    '',
    'Les objectifs orientent le cadrage sans supplément automatique. Compatibilité des configurations, périmètre de comparaison et planification à valider après étude.',
    'Création de connecteurs ou d’agents spécifiques : sur devis séparé.',
    `Prolongation sans nouvelle campagne : ${pricing.extension.description}`,
    'Expérimentation uniquement. Accès, utilisateurs et volumes convenus ; pas de disponibilité permanente, de SLA de production ni de matériel exclusivement réservé.',
    'Données publiques, synthétiques ou anonymisées par défaut ; données sensibles ou personnelles réelles après cadrage approprié. Licences des modèles vérifiées.',
    'Tarifs indicatifs, confirmés après validation du périmètre. Aucune commande ni paiement.',
    '',
    'Coordonnées :',
    `Nom et prénom : ${contact.prospect || 'à compléter'}`,
    `Entreprise : ${contact.company || 'à compléter'}`,
    `E-mail : ${contact.email || 'à compléter'}`,
    `Commentaire : ${contact.comment || 'aucun'}`
  ].join('\n');
}

export function mailto(email, summary) {
  return `mailto:${email}?subject=${encodeURIComponent('Demande de devis — Sandbox IA locale')}&body=${encodeURIComponent(summary)}`;
}
