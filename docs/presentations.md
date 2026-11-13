# Modes Visuel et Essentiel

## Choix et valeurs par défaut

| Présentation | Première visite | Couleurs | Accueil |
|---|---|---|---|
| Visuel (`commercial`) | Oui | Clair uniquement | Version détaillée de `main` |
| Essentiel (`minimalist`) | Sur sélection ou choix déjà mémorisé | Système par défaut, ou Clair / Sombre | Synthèse avec offres, tarifs, méthode et contact |

Le sélecteur « Présentation » est commun à toutes les pages. La préférence est mémorisée sous `jboudoux-presentation` ; le choix de couleur du minimaliste conserve la clé existante `jboudoux-color-theme`. Revenir au commercial garde en mémoire la couleur minimaliste pour le prochain passage.

Le changement conserve l’URL, la page intérieure, les saisies et l’étape du Diagnostic. Sur `/`, il remplace uniquement le contenu d’accueil par la version correspondante. Les mêmes nœuds sont restaurés lors des allers-retours : les interactions ne sont pas enregistrées deux fois.

## Organisation

- `assets/css/commercial.scss` importe les styles d’origine conservés dans `_sass/commercial/` ; `assets/css/site.scss` importe les styles minimalistes. Les seuils responsive sont partagés. Seules des anciennes règles sans élément correspondant ont été retirées du CSS commercial pour conserver le budget de taille existant.
- `_sass/components/_appearance.scss` fournit les contrôles communs et les règles du cadre selon la présentation.
- `_includes/presentations/commercial/` contient l’accueil, l’en-tête et le pied de page commerciaux. L’accueil minimaliste est dans `_includes/presentations/minimalist/` ; son en-tête et son pied de page restent dans les includes existants.
- Le layout sert le mode Visuel par défaut, y compris sans JavaScript. Les gabarits alternatifs sont dans des éléments `template`, inertes et extérieurs au contenu principal. `assets/js/theme.js` les active et conserve les nœuds de chaque présentation en mémoire.
- Les pages intérieures restent dans leurs sources actuelles. Services, formations, prix, identité et coordonnées continuent à provenir des mêmes données et de la même configuration.
- `assets/js/site.mjs` raccorde les menus et le suivi des réservations lors des échanges d’en-tête ou d’accueil. Le suivi utilise chaque lien une seule fois.

Les deux feuilles sont disponibles dans le document, mais une seule utilise `media="all"`. Lors d’un changement, la feuille cible doit être chargée avant de remplacer la présentation et de mémoriser le choix. En cas d’échec, la présentation courante reste utilisable et un message invite à réessayer. Une préférence initiale indisponible revient au mode Essentiel.

Sans JavaScript, le mode Visuel reste accessible avec sa navigation visible, et les sélecteurs sont masqués. Si le stockage local est bloqué, les sélecteurs fonctionnent sur la page courante. La couleur du minimaliste suit les changements du système uniquement en mode Système.

## Vérifications

- `./script/check` : génération Jekyll, 36 tests Ruby, 31 tests JavaScript, formatage, liens, ancres, métadonnées, Diagnostic et construction sous `/preview`.
- Les tests de génération simulent chaque présentation en activant ses gabarits et en retirant les alternatives inertes. Ils vérifient notamment l’unicité des titres et des identifiants actifs.
- Navigateur Chrome : 132 contrôles des 22 pages publiques, dans les deux présentations, à 320, 768 et 1 448 pixels. Aucun débordement horizontal et un seul H1 actif.
- Vérification visuelle des deux accueils et des pages intérieures ; vérification des deux menus mobiles avec Échap.
- Diagnostic : réponses et étape conservées lors d’un aller-retour. Aucun envoi au backend effectué.
- Les deux feuilles CSS restent sous 60 000 octets chacune. Les 22 URLs du sitemap sont conservées, dont Poitiers et Grand Ouest ; les pages non indexables restent exclues.

## Essai et publication

```sh
bundle exec jekyll serve
```

Choisir la présentation dans la barre située sous l’en-tête. La préférence mémorisée reste prioritaire sur le mode Visuel par défaut. Les identifiants internes `commercial` et `minimalist` restent stables pour préserver les préférences existantes.
