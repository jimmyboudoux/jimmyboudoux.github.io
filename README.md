# jboudoux.fr

Site statique Jekyll publié avec GitHub Pages. Il ne repose sur aucun framework frontend ni bundler : Jekyll génère les pages, Sass compile les styles et les modules JavaScript natifs couvrent les interactions.

## Démarrer

Prérequis : Ruby 3.2 (voir `.ruby-version`), Bundler et Node.js 22 ou plus récent.

```bash
bundle install
npm ci
bundle exec jekyll serve
```

La prévisualisation est disponible sur l'adresse affichée par Jekyll, généralement `http://127.0.0.1:4000`.

## Vérifier avant une modification

```bash
./script/check
```

Cette commande construit le site dans un répertoire temporaire, vérifie le sitemap, les métadonnées SEO, les liens et ancres internes, le formulaire Diagnostic IA, la syntaxe JavaScript et les tests unitaires du Diagnostic. GitHub Actions exécute la même commande.

Les gabarits HTML/Liquid sont formatés avec Prettier et son plugin Liquid :

```bash
npm run format:check
npm run format
```

Pour conserver les anciennes commandes dans un script externe :

```bash
bundle exec jekyll build
ruby script/validate_sitemap.rb
ruby script/validate_diagnostic.rb
```

## Où modifier quoi

| Besoin | Fichier principal |
|---|---|
| Identité, URLs, analytics, version des assets | `_config.yml` |
| Navigation | `_data/navigation.yml` |
| Services | `_data/services.yml` |
| Tarifs | `_data/pricing.yml` |
| Formations | `_data/formations.yml` |
| Questions du diagnostic | `_data/diagnostic.yml` |
| Structure commune | `_layouts/default.html`, `_includes/` |
| Styles | `assets/css/site.scss`, `_sass/` |
| Menu et interactions globales | `assets/js/site.mjs`, `assets/js/site-core.mjs` |
| Diagnostic : DOM | `assets/js/diagnostic/index.mjs` |
| Diagnostic : logique testable | `assets/js/diagnostic/core.mjs` |
| Contrat public du Diagnostic | `contracts/diagnostic-submission.schema.json` |

Les pages publiques restent dans leurs dossiers (`services/index.html`, `formations/.../index.html`, etc.). Garder le contenu spécifique dans la page ; extraire un include uniquement lorsqu'un bloc est partagé et stable.

## Front matter

Les pages utilisent `layout: default`. Les clés habituelles sont :

```yml
---
layout: default
title: Titre SEO de la page
description: Description SEO unique
theme: theme-ai
noindex: false
sitemap: true
extra_js: []
extra_modules: []
---
```

`noindex: true` et `sitemap: false` doivent toujours être utilisés ensemble pour une page privée de l'indexation. `extra_modules` sert aux modules JavaScript ES ; `extra_js` reste disponible pour les scripts classiques.

## Styles et JavaScript

Le point d'entrée Sass est `assets/css/site.scss`. Les partials sous `_sass/` sont organisés par responsabilité et importés dans un ordre qui préserve la cascade. Les variables de design sont dans `_sass/base/_foundation.scss`.

Le formulaire Diagnostic est volontairement séparé : `core.mjs` ne dépend pas du DOM et se teste avec Node ; `index.mjs` orchestre le formulaire, `sessionStorage`, ALTCHA et l'appel réseau. Toute évolution du payload, de la clé de brouillon, de l'URL de confirmation ou des événements analytics doit être coordonnée avec le backend privé.

Les événements analytics ne doivent jamais contenir de réponse de formulaire ni de donnée de contact.

## Diagnostic IA et backend privé

Le backend du Diagnostic, son administration, ses données et ses secrets ne sont pas dans ce dépôt. Pour tester l'interface sans backend, lancer simplement Jekyll. Un test d'envoi intégré nécessite l'accès au projet backend concerné et une configuration locale non versionnée qui remplace `diagnostic_api_url` par son URL de développement.

Ne pas ajouter de secrets au dépôt. Les fichiers `.env`, certificats, bases de données et sauvegardes sont ignorés par Git.

## Déploiement

Le déploiement est déclenché par un push sur la branche configurée dans GitHub Pages. Avant un push :

```bash
./script/check
git status
git add <fichiers-voulus>
git commit -m "Description du changement"
git push
```

## Checklist de revue

- La page a un titre, une description et un seul `h1` uniques.
- Les liens, ancres et images fonctionnent sur la version générée.
- La mise en page est vérifiée sur mobile et desktop, au clavier et avec mouvement réduit.
- Une page non indexable possède `noindex: true` et `sitemap: false`.
- Les modifications de tarif, service ou formation passent par les données lorsque la donnée est partagée.
- Le Diagnostic conserve son contrat et ne transmet aucune donnée personnelle à l'analytics.
- `./script/check` réussit.

Les décisions structurantes sont documentées dans `docs/decisions/`.
