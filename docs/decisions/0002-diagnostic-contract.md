# ADR 0002 — Contrat du Diagnostic IA

## Décision

Le contrat de soumission public du formulaire est décrit dans `contracts/diagnostic-submission.schema.json`. La logique de construction du payload est isolée et testée dans `assets/js/diagnostic/core.mjs`.

## Invariants

- Le brouillon reste dans `sessionStorage` et est supprimé après un envoi réussi.
- ALTCHA est résolu avant l'appel réseau.
- Umami reçoit uniquement des événements techniques et des UTM, jamais les réponses ni les coordonnées.
- Toute rupture de contrat doit être coordonnée avec le backend privé avant sa publication.
