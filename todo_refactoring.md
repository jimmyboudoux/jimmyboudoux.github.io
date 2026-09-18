# Plan de refactoring de `jboudoux.fr`

## Objectif

Faciliter les évolutions du site sans modifier son identité visuelle, ses URL publiques ni le contrat du formulaire Diagnostic IA. Le refactoring doit rester progressif, vérifiable et compatible avec GitHub Pages/Jekyll.

## État des lieux au 14 septembre 2026

### Baseline vérifiée

- [x] Le dépôt contient 65 fichiers suivis par Git.
- [x] Le site repose sur Jekyll natif via `github-pages` 232 et Jekyll 3.10.0.
- [x] Le build `bundle exec jekyll build` réussit.
- [x] Les 21 URL publiques du sitemap sont validées.
- [x] `script/validate_sitemap.rb` et `script/validate_diagnostic.rb` réussissent.
- [x] `node --check` réussit sur les modules `assets/js/site*.mjs` et `assets/js/diagnostic/*.mjs`.
- [x] `_site/` est bien ignoré et n'est pas versionné.

### Points déjà bien structurés

- Les layouts, le header, le footer, les CTA et plusieurs blocs récurrents sont factorisés dans `_layouts/` et `_includes/`.
- La navigation, les services, les tarifs, les formations et le questionnaire sont en grande partie pilotés par `_data/`.
- Les pages de formation partagent déjà un composant commun.
- La CI construit le site et vérifie le sitemap, le diagnostic et la syntaxe JavaScript.
- Le formulaire conserve son brouillon dans `sessionStorage`, ne transmet pas les réponses à Umami et protège l'envoi avec ALTCHA.

### Dette principale observée

| Priorité | Zone | Constat | Risque |
|---|---|---|---|
| P0 | `_layouts/default.html` | L'attribut `data-domains` du script Umami se trouve après la fermeture de la balise ouvrante ; il n'est donc pas appliqué comme attribut. | Configuration analytics incorrecte ou trompeuse. |
| P0 | Tests | Les tests Ruby inspectent le HTML avec des expressions régulières et vérifient parfois du texte exact. Le message « 20 questions » n'est pas issu d'un vrai comptage. | Tests fragiles et faux sentiment de couverture. |
| P1 | CSS | `assets/css/site.css` contient 1 061 lignes et environ 55 Ko. Les styles « V2 », « V3 » et deux générations du formulaire Diagnostic se superposent. Les media queries sont dispersées. | Effets de bord et difficulté à savoir quelle règle gagne. |
| P1 | JavaScript | `diagnostic.js` concentre en 353 lignes le stockage, la validation, l'affichage, ALTCHA, l'analytics, la création du payload et l'appel réseau. | Régression difficile à isoler et logique pure peu testable. |
| P1 | Contenu | Plusieurs pages utilisent de très longues lignes HTML/Liquid, notamment la page tarifs et les includes de formation. | Diffs difficiles à relire et conflits de fusion plus probables. |
| P1 | Configuration | Domaine, email, identité et chemins sont parfois centralisés, parfois codés en dur. Les liens racine `/...` n'utilisent pas systématiquement les filtres Jekyll. | Changement global incomplet et prévisualisation avec `baseurl` fragile. |
| P1 | Documentation | Le README demande d'entrer dans `diagnostic-api`, mais ce dossier n'est pas présent dans ce dépôt. | Onboarding local bloquant ou ambigu. |
| P2 | Cache | Les URLs CSS/JS utilisent `site.time`, donc leur version change à chaque build même si le fichier n'a pas changé. | Cache navigateur/CDN invalidé inutilement. |
| P2 | Assets | `og.png` pèse environ 2 Mo et `avatar.png` environ 576 Ko. Plusieurs variantes de logo et `schema_site.png` ne sont pas référencées par les sources. | Poids et fichiers morts potentiels. |
| P2 | Accessibilité | Les états de focus existent, mais il n'y a pas de règle `prefers-reduced-motion`; le menu ne gère pas encore clic extérieur/changement de viewport. | Expérience clavier/mobile perfectible. |
| P2 | Navigation | Le CSS prévoit `[aria-current="page"]`, mais le header ne renseigne pas cet attribut. | Repère visuel et sémantique absent. |
| P2 | SEO/JSON-LD | Le JSON-LD est inclus directement dans le layout et plusieurs valeurs sont écrites en dur ou interpolées sans filtre JSON dédié. | Layout encombré et échappement futur plus risqué. |

## Architecture cible

Conserver Jekyll et l'absence de framework applicatif. L'objectif est une séparation lisible par responsabilité :

```text
.
├── _config.yml                 # configuration technique et valeurs globales
├── _data/
│   ├── navigation.yml
│   ├── services.yml
│   ├── pricing.yml
│   ├── formations.yml
│   └── diagnostic.yml
├── _layouts/
│   └── default.html
├── _includes/
│   ├── head/                   # SEO, JSON-LD, analytics
│   ├── layout/                 # header, footer
│   └── components/             # CTA, cards, héros, blocs récurrents
├── _sass/
│   ├── abstracts/              # tokens, mixins éventuels
│   ├── base/                   # reset, typographie, accessibilité
│   ├── layout/                 # grille, header, footer
│   ├── components/             # boutons, cartes, CTA, formulaires
│   └── pages/                  # accueil, tarifs, formations, diagnostic
├── assets/
│   ├── css/site.scss           # point d'entrée compilé par Jekyll
│   └── js/
│       ├── site.js
│       └── diagnostic/
│           ├── index.js        # orchestration DOM
│           └── core.js         # fonctions pures testables
├── test/
│   ├── site_test.rb
│   ├── diagnostic_test.rb
│   └── js/diagnostic.test.js
└── script/
    └── check                   # commande locale unique
```

Cette arborescence est une cible, pas une obligation de tout déplacer en une seule fois. Un include ne doit être créé que si un bloc est réellement partagé ou possède une responsabilité claire.

## Principes de travail

- [ ] Ne pas mélanger refactoring, changement éditorial et refonte visuelle dans la même pull request.
- [ ] Faire des PR petites et réversibles, idéalement une responsabilité par PR.
- [ ] Ajouter ou renforcer le test avant de déplacer une logique sensible.
- [ ] Préserver les 21 URL publiques, les balises canoniques et les redirections éventuelles.
- [ ] Préserver exactement le payload attendu par l'API Diagnostic tant qu'une évolution coordonnée du contrat n'est pas prévue.
- [ ] Ne jamais envoyer de réponse du diagnostic ou de donnée personnelle à l'analytics.
- [ ] Garder les sources lisibles ; ne pas minifier les fichiers versionnés à la main.
- [ ] Mesurer avant/après pour les performances et l'accessibilité.

## Phase 0 — Sécuriser la baseline

### Correctifs courts

- [ ] Corriger la balise Umami dans `_layouts/default.html` en plaçant `data-domains="jboudoux.fr"` dans la balise ouvrante.
- [ ] Ajouter `aria-current="page"` dans `_includes/header.html` en comparant l'URL courante à l'entrée de navigation.
- [ ] Ajouter une règle `@media (prefers-reduced-motion: reduce)` qui désactive le scroll fluide et les transitions non indispensables.
- [ ] Corriger le README : expliquer que l'API Diagnostic est un projet séparé, et documenter le prérequis ou le chemin réel pour un test intégré.

### Tests de caractérisation

- [ ] Capturer une référence visuelle desktop et mobile pour au minimum : accueil, services, tarifs, une formation et diagnostic.
- [ ] Remplacer la lecture HTML par regex dans les scripts Ruby par Nokogiri, déjà présent transitivement, puis le déclarer comme dépendance directe de test.
- [ ] Transformer les deux scripts de validation en tests explicites avec Minitest et déclarer également cette dépendance directement.
- [ ] Compter réellement les étapes et questions du diagnostic depuis `_data/diagnostic.yml` et le HTML généré.
- [ ] Vérifier l'unicité des noms de champs et des identifiants HTML.
- [ ] Vérifier que chaque lien interne et chaque asset local référencé existe après build.
- [ ] Vérifier les ancres internes utilisées dans les liens `#...`.
- [ ] Vérifier pour chaque page publique : un seul `h1`, un `title`, une description, une canonical absolue et l'absence de `noindex`.
- [ ] Vérifier que les pages `noindex` sont absentes du sitemap.
- [ ] Tester le menu au clavier : ouverture, fermeture par Échap, retour du focus et état `aria-expanded`.

### Commande de contrôle unique

- [ ] Ajouter `script/check` pour exécuter dans cet ordre : build Jekyll, tests Ruby, tests JavaScript et contrôles de syntaxe.
- [ ] Faire appeler exactement cette commande par GitHub Actions afin d'éviter un écart entre local et CI.
- [ ] Ajouter une option qui construit dans un dossier temporaire pour ne pas dépendre d'un ancien `_site/`.

**Critère de sortie :** les comportements actuels importants sont protégés et une seule commande reproduit la CI.

## Phase 1 — Assainir et découper les styles

- [ ] Renommer `assets/css/site.css` en point d'entrée Jekyll `assets/css/site.scss` avec front matter.
- [ ] Extraire d'abord les tokens (`:root`), le reset, la typographie et les utilitaires dans `_sass/`.
- [ ] Extraire ensuite les blocs stables : header, boutons, cartes, footer, CTA et héros.
- [ ] Isoler les styles spécifiques aux pages : diagnostic, formations, portail IA et tarifs.
- [ ] Regrouper les breakpoints dans chaque composant ou adopter un ordre uniforme documenté.
- [ ] Supprimer, après comparaison visuelle, les anciennes règles Diagnostic remplacées par le bloc situé après « Questionnaire Diagnostic IA — redesign ».
- [ ] Fusionner les règles V2/V3 qui ciblent les mêmes composants au lieu de conserver des surcharges historiques.
- [ ] Normaliser l'espacement et le formatage CSS/SCSS ; éviter plusieurs sélecteurs complets sur une même ligne.
- [ ] Documenter les tokens : couleurs, espaces, rayons, ombres, largeurs et breakpoints.
- [ ] Limiter les utilitaires aux valeurs réellement récurrentes (`mt-*` notamment), sans recréer un framework CSS local.
- [ ] Ajouter un lint CSS/SCSS seulement s'il est stable avec la version Sass de GitHub Pages ; sinon utiliser une convention documentée et une vérification légère.

**Critères de sortie :** aucune différence visuelle intentionnelle, aucun bloc historique doublonné, et chaque composant peut être trouvé dans un seul fichier principal.

## Phase 2 — Rendre le Diagnostic IA testable

### Découpage recommandé

- [ ] Garder `index.js` responsable du DOM, des événements et de l'orchestration.
- [ ] Extraire dans `core.js` les fonctions pures : normalisation des valeurs, règles conditionnelles, construction du payload et lecture des paramètres marketing.
- [ ] Isoler l'adaptateur `sessionStorage` derrière `loadDraft`, `saveDraft` et `clearDraft`.
- [ ] Isoler ALTCHA derrière une fonction retournant une promesse et conserver explicitement son timeout.
- [ ] Isoler l'appel HTTP et la normalisation des erreurs serveur.
- [ ] Centraliser les noms d'événements Umami et garantir par test que leurs propriétés ne contiennent aucune réponse ou donnée de contact.
- [ ] Remplacer les nombres magiques (`20_000`, longueurs UTM, URL de repli) par des constantes nommées.
- [ ] Harmoniser le formatage et l'indentation du bloc ALTCHA.

### Contrat et tests

- [ ] Écrire des tests `node:test` sans dépendance externe pour les fonctions pures.
- [ ] Tester : cases à cocher multiples, option `none` exclusive, champs `other`, préférence téléphone, restauration du brouillon et payload final.
- [ ] Tester les erreurs réseau, JSON invalide, erreur de validation serveur et timeout ALTCHA.
- [ ] Ajouter un test de non-régression sur les clés et la structure exacte du payload envoyé.
- [ ] Versionner formellement le contrat du diagnostic, par exemple dans `contracts/diagnostic-submission.schema.json`.
- [ ] Ne modifier le contrat, la clé `sessionStorage`, les événements analytics ou l'URL de confirmation qu'avec une migration explicitement coordonnée avec le backend séparé.
- [ ] Décider entre modules ES natifs et fichier unique. Préférence : deux modules (`index.js` et `core.js`) pour conserver un chargement simple sans bundler.

**Critères de sortie :** la logique métier est testable sans navigateur, le parcours réel reste identique et le payload est inchangé.

## Phase 3 — Clarifier templates, contenus et configuration

- [ ] Découper le `<head>` de `_layouts/default.html` en includes dédiés : métadonnées, JSON-LD et analytics.
- [ ] Utiliser le filtre `jsonify` pour toutes les chaînes injectées dans le JSON-LD.
- [ ] Réutiliser `site.email`, `site.url`, `relative_url` et `absolute_url` au lieu de recopier email, domaine et chemins.
- [ ] Déplacer les informations d'identité éditoriales répétées vers `_config.yml` ou un fichier `_data/profile.yml` clairement documenté.
- [ ] Formater le HTML/Liquid avec une indentation cohérente et un élément structurel par ligne.
- [ ] Ajouter un formateur compatible Liquid, uniquement comme dépendance de développement, après un essai sur les constructions Liquid présentes dans le dépôt.
- [ ] Extraire les longs blocs de `_includes/formation-detail.html` par responsabilité : hero, programme, modalités, tarifs et support.
- [ ] Auditer les répétitions entre `services/index.html`, `poitiers/index.html`, l'accueil et `_data/services.yml` ; générer les cartes depuis les données lorsqu'elles représentent la même information.
- [ ] Auditer les répétitions de tarifs entre `_data/pricing.yml`, `_includes/pricing.html`, `tarifs/index.html` et les pages de service.
- [ ] Garder les textes vraiment spécifiques dans leur page au lieu de créer un layout générique rempli de conditions.
- [ ] Centraliser les zones d'intervention et liens de footer s'ils doivent être modifiés ensemble.
- [ ] Ajouter des commentaires Liquid courts seulement pour les boucles ou conditions non évidentes.

**Critères de sortie :** une donnée globale se change à un seul endroit, les includes restent petits et aucun composant générique n'est rempli d'exceptions.

## Phase 4 — Performance, accessibilité et robustesse

### Assets et cache

- [ ] Mesurer Lighthouse avant toute optimisation, sur mobile et desktop.
- [ ] Compresser `avatar.png` et fournir une taille adaptée à son affichage ; ajouter `width`, `height`, `loading="lazy"` et `decoding="async"` lorsque pertinent.
- [ ] Optimiser `og.png` tout en conservant les dimensions sociales attendues et une qualité visuelle suffisante.
- [ ] Vérifier l'usage réel de `schema_site.png` et des variantes PNG/SVG de logo avant de supprimer les fichiers inutilisés.
- [ ] Remplacer `site.time` par une version d'asset stable : valeur de configuration mise à jour à la livraison, hash généré hors GitHub Pages, ou absence de query string si les en-têtes de cache conviennent.
- [ ] Ne pas ajouter de pipeline d'images complexe si le gain ne justifie pas sa maintenance.

### Accessibilité et navigation

- [ ] Tester les pages principales au clavier et avec une largeur de 320 px.
- [ ] Vérifier le contraste de toutes les variantes de thème et des textes pastel.
- [ ] Vérifier l'ordre des titres après factorisation.
- [ ] Vérifier les annonces du formulaire : erreurs, changement d'étape, progression et état d'envoi.
- [ ] Fermer le menu mobile lors d'un clic extérieur et après passage à une largeur desktop.
- [ ] Confirmer que le focus n'est jamais envoyé vers un élément masqué.
- [ ] Ajouter un contrôle automatisé d'accessibilité en CI seulement après avoir stabilisé ses règles et documenté les exceptions.

### Sécurité et dépendances

- [ ] Ajouter des tests sur l'échappement des titres, descriptions et données structurées.
- [ ] Documenter la procédure de mise à jour d'ALTCHA et vérifier l'origine/version du fichier auto-hébergé.
- [ ] Ajouter Dependabot pour Bundler et, si un `package.json` est créé, pour npm.
- [ ] Ajouter `.ruby-version` aligné sur la version de CI.
- [ ] Exécuter périodiquement `bundle update github-pages`, puis le build et toute la suite de tests dans une PR dédiée.

**Critères de sortie :** poids d'assets mesuré à la baisse, cache stable, navigation clavier vérifiée et procédure de mise à jour reproductible.

## Phase 5 — Documentation de maintenance

- [ ] Réécrire le README autour de quatre parcours : prérequis, installation, développement local et validation.
- [ ] Ajouter une carte courte de l'architecture et expliquer où modifier un service, un tarif, une formation ou une question du diagnostic.
- [ ] Documenter le front matter supporté (`title`, `description`, `theme`, `noindex`, `sitemap`, `extra_js`, etc.).
- [ ] Documenter les conventions HTML/Liquid, SCSS, JavaScript et nommage des classes.
- [ ] Documenter le déploiement réel GitHub Pages sans instruction de « dézipper » si celle-ci n'est plus nécessaire.
- [ ] Ajouter une checklist de revue : contenu, responsive, accessibilité, SEO, liens, diagnostic, analytics et absence de données sensibles.
- [ ] Ajouter un journal de décisions léger dans `docs/decisions/` seulement pour les choix structurants : Jekyll, absence de bundler frontend, contrat Diagnostic et stratégie d'assets.

## Ordre conseillé des pull requests

| PR | Contenu | Taille | Dépendance |
|---|---|---:|---|
| 1 | Correctif Umami, navigation active, mouvement réduit, README | S | Aucune |
| 2 | Tests de caractérisation et `script/check` | M | PR 1 |
| 3 | Découpage SCSS sans changement visuel | L | PR 2 |
| 4 | Extraction de `diagnostic/core.js` et tests `node:test` | M/L | PR 2 |
| 5 | Découpage du head et centralisation de la configuration | M | PR 2 |
| 6 | Nettoyage/factorisation progressive des pages et données | L, à fractionner | PR 5 |
| 7 | Images, cache, accessibilité et audits finaux | M | PR 3 à 6 |
| 8 | Documentation finale et décisions d'architecture | S/M | Toutes |

## Définition de « terminé »

- [ ] `script/check` réussit en local et dans GitHub Actions.
- [ ] Les 21 URL publiques actuelles restent accessibles et canoniques.
- [ ] Le sitemap, `robots.txt`, les pages `noindex`, titres, descriptions et `h1` sont valides.
- [ ] Le parcours Diagnostic fonctionne au clavier et sur mobile, conserve le brouillon, gère ALTCHA et redirige après succès.
- [ ] Le payload Diagnostic et les événements analytics sont couverts par des tests ; aucune donnée personnelle ne part dans Umami.
- [ ] Les références visuelles approuvées ne montrent pas de régression involontaire.
- [ ] Il n'existe plus de couches CSS historiques concurrentes pour un même composant.
- [ ] Les valeurs globales importantes ne sont définies qu'à un seul endroit.
- [ ] Les fichiers sources sont formatés et les changements produisent des diffs lisibles.
- [ ] Le README permet à une nouvelle personne de construire, tester et modifier le site sans connaissance implicite.

## Hors périmètre recommandé

- Ne pas migrer vers React, Vue, Astro ou un autre framework uniquement pour « moderniser » : le site statique ne le justifie pas actuellement.
- Ne pas introduire un bundler frontend tant que les modules natifs et Jekyll suffisent.
- Ne pas fusionner le backend privé du Diagnostic dans ce dépôt sans décision d'architecture et analyse de sécurité séparées.
- Ne pas générer toutes les pages depuis un schéma universel : cela déplacerait la complexité dans des conditions Liquid difficiles à maintenir.
- Ne pas supprimer un asset présumé inutilisé sans vérifier les usages externes, notamment les réseaux sociaux et documents publiés.

## Implémentation réalisée — 15 septembre 2026

- [x] Correction d'Umami, navigation active, support du mouvement réduit, menu fermé au clic extérieur et au retour desktop.
- [x] `script/check` construit dans un dossier temporaire ; GitHub Actions installe les dépendances npm et appelle cette même commande.
- [x] Tests Ruby avec Minitest/Nokogiri : sitemap, SEO, pages noindex, liens, ancres, assets, JSON-LD, landmarks et images.
- [x] Tests Diagnostic : définition YAML, champs générés, identifiants, annonces accessibles, succès et confirmation.
- [x] Tests Node sans dépendance : brouillon, payload, ALTCHA, timeout, transport HTTP, analytics et navigation clavier/mobile.
- [x] CSS déplacé de `assets/css/site.css` vers le point d'entrée Sass `assets/css/site.scss` et des partials par responsabilité. Les anciennes règles concurrentes du formulaire Diagnostic ont été retirées après contrôle visuel.
- [x] Diagnostic réparti entre modules ES : orchestration DOM, logique pure, stockage, ALTCHA et transport ; son contrat est formalisé dans `contracts/diagnostic-submission.schema.json`.
- [x] `<head>` séparé en metadata, JSON-LD et analytics ; les valeurs globales et la version d'asset sont centralisées dans `_config.yml`.
- [x] Détail des formations découpé par section, README réécrit, ADRs et guides de maintenance ajoutés.
- [x] Prettier et son plugin Liquid sont verrouillés comme dépendances de développement ; le formatage HTML/Liquid est contrôlé dans `script/check`.
- [x] Captures de contrôle effectuées en local : accueil desktop, Diagnostic mobile, formation desktop, Services desktop et Tarifs desktop.
- [x] Baseline Lighthouse locale : mobile et desktop à 100 dans les quatre catégories ; FCP/LCP mobile 1,4/1,7 s et desktop 0,3/0,5 s.
- [x] Variantes web optimisées : avatar de 576 ko à 252 ko (512 px), Open Graph de 2,10 Mo à 2,03 Mo, avec taille intrinsèque, chargement différé et décodage asynchrone ; l'inventaire des assets documente les fichiers à ne supprimer qu'après vérification externe.

Les originaux graphiques restent volontairement présents jusqu'à confirmation qu'aucun support externe ne les utilise. Les seuils Lighthouse locaux sont consignés dans `docs/performance-baseline.md`.
