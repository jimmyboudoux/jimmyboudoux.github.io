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

Cette commande construit le site dans un répertoire temporaire, modifie les paramètres dans une copie isolée pour vérifier leur propagation, vérifie le sitemap, les métadonnées SEO, les liens et ancres internes, le formulaire Diagnostic IA, la syntaxe JavaScript et les tests unitaires du Diagnostic. GitHub Actions exécute la même commande.

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
| Identité, URLs, profils professionnels, analytics, version des assets | `_config.yml` |
| Navigation | `_data/navigation.yml` |
| Trois piliers d’intervention | `_data/interventions.yml` |
| Catalogue des expertises spécialisées | `_data/services.yml` |
| Tarifs | `_data/pricing.yml` |
| Formations | `_data/formations.yml` |
| Questions du diagnostic | `_data/diagnostic.yml` |
| Durées de rendez-vous, promesses du diagnostic et suivi des réservations | `_data/engagement.yml` |
| Adresse et zones d’intervention | `_data/profile.yml` |
| Questions fréquentes | `_data/faqs.yml` |
| Structure commune | `_layouts/default.html`, `_includes/` |
| Styles | `assets/css/site.scss`, `_sass/` |
| Menu et interactions globales | `assets/js/site.mjs`, `assets/js/site-core.mjs` |
| Diagnostic : DOM | `assets/js/diagnostic/index.mjs` |
| Diagnostic : logique testable | `assets/js/diagnostic/core.mjs` |
| Contrat public du Diagnostic | `contracts/diagnostic-submission.schema.json` |

Les pages publiques restent dans leurs dossiers (`services/index.html`, `formations/.../index.html`, etc.). Garder le contenu spécifique dans la page ; extraire un include uniquement lorsqu'un bloc est partagé et stable.

## Modifier les tarifs et les paramètres partagés

Les prix sont des **montants numériques entiers en euros HT**, sans espaces ni symbole. L’include `price.html` ajoute les séparateurs de milliers, la mention HT, le préfixe et la période. Ne pas recopier un prix dans une page HTML.

- Prestations, audits, temps partagé et Sandbox : modifier `amount` dans `_data/pricing.yml`.
- Fourchettes : modifier `amount` et `max_amount`. Les prix de départ des audits et du temps partagé sont dérivés respectivement de `audit.ranges.targeted` et `fractional.light`.
- Formations : modifier `prices[].amount` dans `_data/formations.yml`. Les tableaux et cartes utilisent les tarifs des formats ; le prix de départ et l’offre JSON-LD utilisent le minimum. Le repère général des formations utilise le minimum du catalogue.
- Sandbox : `sandbox.duration_days`, `sandbox.max_configurations`, `sandbox.hardware.amount`, `sandbox.extension.amount`, `sandbox.extension.period_days` et `sandbox.extension.additional_configurations` pilotent le périmètre et les options.
- Rendez-vous : `booking_minutes` dans `_data/engagement.yml` pilote les durées affichées. Dans les arguments textuels des includes de réservation, utiliser `__booking_minutes__` : Liquid ne réévalue pas une expression imbriquée dans une chaîne.
- Délais d’accès aux formations : `training_access_days` dans `_data/engagement.yml` ; les textes du catalogue et de la FAQ utilisent `__training_access_days__`.
- Pilotage léger : `fractional.light.meetings_min` et `meetings_max` dans `_data/pricing.yml` pilotent la fréquence affichée.
- Diagnostic : `diagnostic.duration_min_minutes`, `duration_max_minutes` et `response_days` dans `_data/engagement.yml` pilotent les promesses affichées et la description SEO. Les questions restent dans `_data/diagnostic.yml`.
- Suivi des réservations : chaque `location` passée à `booking-link.html` doit figurer dans `booking_locations` ; les contrôles vérifient cette cohérence. L’analytics est recherché au moment du clic.

Par exemple, changer `sandbox.amount: 2400` en `sandbox.amount: 2800` suffit pour mettre à jour la page Sandbox et la page Tarifs. Aucun changement de template ni de constante de test n’est nécessaire.

Après une modification de `_data`, Jekyll régénère les pages ; après une modification de `_config.yml`, redémarrer le serveur local. Les changements apparaissent en production après construction et déploiement du site.

Les profils professionnels sont définis dans `socials` de `_config.yml`, avec une clé par plateforme et les champs `label` et `url`. Le footer, la page Contact et les tableaux `sameAs` du JSON-LD parcourent cette configuration dans l’ordre déclaré. Pour ajouter un profil, ajouter uniquement cette entrée ; aucun changement de template n’est nécessaire. Le lien LinkedIn de la page À propos utilise également cette source. Les liens ouvrent un nouvel onglet avec `noopener noreferrer`, sans `nofollow`.

Le graphe Schema.org conserve une seule entité `Person` (`/#person`), la photo existante et le `ProfessionalService` dont elle est fondatrice. `WebSite` désigne cette personne comme `publisher`. `schema_job_title` définit le métier pour les données structurées indépendamment du titre visible `professional_title` et de la signature marketing.

## Catalogue et FAQ

Les pages de service déclarent `service: <slug>`. Leur thème, les cartes partagées et les données structurées proviennent de `_data/services.yml`. Les formations utilisent `formation: <clé>` et leur thème vient de `_data/formations.yml`. Le titre SEO et les textes propres à une page restent dans sa source. Le token `__person_name__` dans un titre ou une description reprend l’identité de `_config.yml`. Le fil d’Ariane reprend le nom du catalogue ; `breadcrumb_label` permet de le personnaliser.

La FAQ générale est affichée sur la page Services. Les pages de service gardent leur contenu spécifique et leur CTA final ; les FAQ propres aux formations, à la Sandbox et à Poitiers restent sur leurs pages.

Chaque page choisit explicitement `faq: global`, `faq: poitiers`, `faq: sandbox`, `faq: formations` ou `faq: false`. Le layout n’ajoute aucune FAQ automatiquement. Placer `site-faq.html` avant le CTA final, ou `faq-list.html group=page.faq` dans une section existante. Les questions sont dans `_data/faqs.yml` et le JSON-LD lit les mêmes données. La FAQ Sandbox peut utiliser le token `__max_configurations__` pour reprendre sa limite commune.

Les cartes des pages locales utilisent `local-service-card.html` pour partager titre, lien et thème tout en conservant une description adaptée à la zone. Les zones affichées et les données structurées partagent `_data/profile.yml`.

## Front matter

Les pages utilisent `layout: default`. Les clés habituelles sont :

```yml
---
layout: default
title: Titre SEO de la page
description: Description SEO unique
theme: theme-ai
faq: global
noindex: false
sitemap: true
extra_js: []
extra_modules: []
---
```

`noindex: true` et `sitemap: false` doivent toujours être utilisés ensemble pour une page privée de l'indexation. `extra_modules` sert aux modules JavaScript ES ; `extra_js` reste disponible pour les scripts classiques.

## Styles et JavaScript

Le point d'entrée Sass est `assets/css/site.scss`. Les partials sous `_sass/` sont organisés par responsabilité et importés dans un ordre qui préserve la cascade. Les couleurs, polices et rayons sont dans `_sass/base/_foundation.scss`, les seuils responsive dans `_sass/base/_breakpoints.scss`. Le seuil desktop du menu est dérivé du même paramètre pour le CSS et le JavaScript. Les règles responsive d’un composant restent dans son partial ; le footer, le contact et l’accessibilité ont chacun leur fichier.

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

## Positionnement et parcours

L’identité est définie par `professional_title` et la promesse par `signature` dans `_config.yml`. Le libellé commun des CTA de projet, y compris les titres des blocs de contact, est défini par `project_cta_label` (« Parler de mon projet »). Les descriptions restent adaptées au contexte de chaque offre. L’accueil et Services présentent les trois piliers **Concevoir → Construire → Transformer**, décrits dans `_data/interventions.yml`. Le catalogue `_data/services.yml` conserve les expertises et leurs URLs ; il continue de piloter leurs thèmes et données structurées.

L’accueil présente le besoin, les trois interventions, la méthode, les compétences transverses, les raisons de travailler ensemble, les modes d’intervention et le contact. Le Diagnostic IA reste accessible depuis l’adoption IA et les ressources du footer. Formation et temps partagé sont des accompagnements secondaires. La page Contact rassemble la réservation et l’email dans le hero, puis une courte liste pour préparer l’échange, sans répéter un bloc CTA.

## Préparer le portfolio

La structure du portfolio est prête dans `realisations/index.html`. Elle est masquée pour le moment : `portfolio_enabled: false` dans `_config.yml` retire l’entrée Réalisations du header et du footer, le bloc portfolio de l’accueil et le lien depuis Services. Les blocs sont conservés dans les sources pour une réactivation simple.

La page reste accessible par son URL directe et affiche « Portfolio en préparation ». Elle porte `noindex: true` et `sitemap: false` tant que les cas publiables ne sont pas prêts. Ne pas créer de références ni de résultats pour remplir cet espace.

Pour publier le portfolio :

1. Remplacer le contenu provisoire de `realisations/index.html` par les cas validés : contexte, objectif, approche, réalisation, résultat, rôle et technologies en dernier.
2. Remplacer le bloc provisoire de l’accueil par au maximum trois cas, avec des liens vers les détails.
3. Passer `portfolio_enabled: true` dans `_config.yml` pour réafficher la navigation et les blocs conservés.
4. Retirer `noindex: true` et `sitemap: false` de la page Réalisations : le sitemap généré l’ajoutera au prochain build.
5. Adapter le test du portfolio masqué, les attentes de navigation et de sections, ainsi que le nombre de pages publiques attendu dans `test/site_test.rb`, puis exécuter `./script/check`.

Ne pas recréer un catalogue de technologies ou de sous-offres au même niveau que les trois piliers.
