# Audit de factorisation et de cohérence — 5 octobre 2026

## Périmètre et conclusion

Analyse des sources locales dans leur état de travail actuel, incluant les modifications non commitées et la nouvelle Sandbox IA locale. Lecture des pages, données, includes, layout, styles, modules JavaScript, documentation et contrôles existants. Cet audit ne constitue pas une revue visuelle de toutes les pages dans un navigateur ni un contrôle de la version en production.

Le site est globalement bien factorisé. Jekyll, Liquid, Sass et les modules JavaScript natifs suffisent à sa taille. Le principal défaut concerne la centralisation incomplète des paramètres commerciaux : elle existe, mais ne garantit pas encore qu'un montant ou une caractéristique d'offre se modifie une seule fois.

## Architecture à conserver

- `_layouts/default.html` fournit le document commun, le header, le footer, les métadonnées et les scripts.
- `_includes/head/` sépare les métadonnées, les données structurées et l'analytics.
- `_includes/page-hero.html`, `booking-link.html`, `booking-cta.html`, `local-intervention.html` et `expertise-grid.html` factorisent des blocs réellement récurrents.
- L'accueil et la page Expertises utilisent le même catalogue `_data/services.yml` et le même include de cartes.
- Les fiches de formation utilisent `_data/formations.yml` et une composition de six sections partagées. Leurs fichiers de page restent petits.
- Les couleurs, polices, largeurs et rayons principaux sont partagés dans `_sass/base/_foundation.scss`. Les composants et les styles particuliers disposent de partials.
- Le diagnostic sépare orchestration DOM, logique, stockage, anti-spam et transport. Son contrat est versionné.
- Le sitemap est généré depuis les pages, ce qui couvre les ajouts sans maintenir une liste d'URL à la main.

La différence de longueur entre les pages de services n'est pas en elle-même un défaut de factorisation. Les contenus particuliers peuvent rester dans les pages. Extraire un bloc est utile quand sa structure ou ses paramètres doivent évoluer ensemble sur plusieurs pages.

## Constats prioritaires

### 1. Prix de la Sandbox dupliqués dans deux pages

Sources : `tarifs/index.html:173`, `:184`, `:189` et `sandbox-ia-locale/index.html:336`, `:356`, `:360`.

Les montants « À partir de 2 400 € HT », « +600 € HT » et « +650 € HT / 30 jours » sont codés dans les pages. Aucune entrée Sandbox n'existe dans `_data/pricing.yml`. Modifier uniquement ce YAML ne modifie donc pas cette offre. Les deux pages affichent actuellement les mêmes montants : le problème est le risque de divergence à la prochaine modification.

Action recommandée : créer `pricing.sandbox` avec prix de base, option matériel et prolongation ; remplacer les six occurrences par des lectures de cette entrée. Centraliser aussi la durée, le nombre de configurations et la durée de prolongation. Ces caractéristiques sont répétées dans les pages Tarifs, Sandbox, Ingénierie IA et dans le descriptif du prototype IA locale.

### 2. Trois représentations indépendantes du prix de chaque formation

Source : `_data/formations.yml:14`, `:15`, `:40` ; même structure pour FinOps IA et IA locale.

- `starting_price` alimente les repères tarifaires et les fiches.
- `prices[].price` alimente les tableaux et les cartes du catalogue.
- `price_amount` alimente les offres JSON-LD dans `_includes/head/page-structured-data.html`.

Le tarif AI Literacy est donc défini par trois valeurs distinctes : `650 € HT`, `650`, `650 € HT`. Changer seulement `starting_price` peut laisser le catalogue et les données structurées à l'ancien prix.

Action recommandée : conserver un montant numérique par format, puis dériver l'affichage et le prix de départ. Si une formation possède plusieurs formats, identifier explicitement le format de référence ou calculer le minimum. Les offres structurées doivent utiliser les mêmes montants.

### 3. Les tests tarifaires ne garantissent pas encore une modification simple

Sources : `test/site_test.rb:82`, `:190`, `:227`.

Certains tests fixent directement un montant, notamment `650` pour AI Literacy et le tarif de prolongation Sandbox. Une modification commerciale peut ainsi demander une modification de test. Le test des tarifs partagés vérifie la présence des valeurs YAML sur la page Tarifs ; il ne vérifie pas leur cohérence sur toutes les pages concernées et ne couvre pas la Sandbox centralisée, qui n'existe pas encore.

Action recommandée : comparer les affichages et les offres JSON-LD aux données YAML. Lors de la refactorisation, ajouter un contrôle ciblé de propagation d'un montant modifié pour éviter qu'une ancienne occurrence codée dans une page reste invisible au test.

### 4. Catalogue et page Sandbox incohérents sur leur thème et leur rubrique

Sources : `_data/services.yml:14`, `sandbox-ia-locale/index.html:5`, `_includes/header.html:23`, `_includes/head/page-structured-data.html:2`.

La carte Sandbox utilise `theme-data`, tandis que sa page utilise `theme-engineering`. La page dispose d'un fil d'Ariane « Expertises », mais n'a pas `service: sandbox-ia-locale` : le menu ne marque donc pas Expertises active et le template n'émet pas de JSON-LD `Service` pour cette page.

Action recommandée : choisir un thème commun et ajouter la clé `service`. À plus long terme, utiliser le catalogue comme valeur de thème par défaut pour les services afin d'éviter deux définitions indépendantes. Le portail IA figure aussi parmi les expertises mais reste une carte particulière de l'include et une page sans rattachement `service` ; clarifier son rattachement améliorerait la navigation.

### 5. FAQ globale ajoutée par défaut à presque toutes les pages

Source : `_layouts/default.html:13`, `_includes/site-faq.html`.

Le layout ajoute la FAQ sauf si `page.faq` ou `page.has_faq` est renseigné. Cela inclut les mentions légales, la confidentialité, la page 404 et la confirmation du diagnostic. La FAQ apparaît après le CTA final des pages qui en possèdent un. La factorisation technique est bonne, mais cette règle a une portée éditoriale trop large et deux drapeaux différents contrôlent le même emplacement.

Action recommandée : rendre le choix explicite par page, par exemple `faq: global`, `faq: poitiers`, `faq: sandbox` ou `faq: false`, avec une convention documentée pour la position. Une structure de FAQ commune pourrait remplacer les rendus séparés global, Poitiers, formations et Sandbox tout en conservant leurs contenus propres.

### 6. Suivi des réservations différent selon la page

Sources : `assets/js/site-core.mjs:35` et les appels à `booking-link.html`.

La liste autorisée du tracking n'inclut pas plusieurs emplacements effectivement utilisés : `contact`, `training`, `grand-ouest`, `private_ai_portal_final`, `diagnostic_confirmation`. Le lien fonctionne, mais le clic n'est pas mesuré par `mountBookingTracking` pour ces emplacements. Les emplacements de services utilisent tous `service`, ce qui ne distingue pas ces pages dans cet événement.

Action recommandée : aligner la liste sur les emplacements réellement utilisés, et décider du niveau de détail attendu. Si ces paramètres doivent être administrables depuis un fichier, les rendre depuis des données communes ; conserver une liste autorisée et des propriétés sans données personnelles.

## Autres paramètres et répétitions

| Paramètre | Source actuelle | Limite |
|---|---|---|
| Tarifs des prestations, audits, temps partagé | `_data/pricing.yml` | Centralisation correcte entre les pages concernées ; prix de départ et bornes de fourchettes restent des chaînes indépendantes. |
| Tarifs des formations | `_data/formations.yml` | Un fichier, mais trois valeurs par formation à synchroniser. |
| Navigation principale | `_data/navigation.yml` | Footer maintenu séparément ; distinction raisonnable tant que leurs contenus ont des rôles différents. |
| Email, réservation, identité, URLs techniques | `_config.yml` | Bonne centralisation générale ; identité encore écrite dans les mentions légales et certains textes SEO. |
| Adresse et villes desservies | `_data/profile.yml` | Adresse partagée entre mentions et JSON-LD ; textes et listes de villes éditoriaux restent maintenus dans les pages. |
| Catalogue de services | `_data/services.yml` | Cartes locales Poitiers/Grand Ouest et cartes portail/temps partagé maintenues séparément. |
| Questions du diagnostic | `_data/diagnostic.yml` | Durée et délai annoncés restent dans les pages et les métadonnées. |
| Durée de rendez-vous | Plusieurs pages et includes | « 20 minutes » n'est pas un paramètre commun. |

Les annonces actuelles du diagnostic utilisent « sous un jour ouvré », « sous 24 heures ouvrées » et une formulation plus prudente « généralement ». Choisir une formulation de référence permettrait de maintenir la même attente partout.

Pour les fourchettes, une donnée numérique comme `min_amount`, `max_amount`, `currency`, `tax_basis` et `period` évite de recopier la borne basse dans le prix de départ. La mise en forme appartient à un include tarifaire. Les prix identiques d'offres différentes doivent néanmoins rester indépendants : un prototype et une automatisation peuvent évoluer séparément.

Les descriptifs de prix peuvent légitimement différer selon le contexte. En revanche, les caractéristiques contractuelles et montants doivent venir de données communes. Les cartes des pages locales peuvent garder une introduction locale tout en récupérant titre, URL et thème du catalogue. Les libellés particuliers de l'accueil restent utiles ; il faut distinguer une variante éditoriale voulue d'une donnée commerciale recopiée.

## Styles et cohérence des gabarits

La palette et les composants communs donnent une base cohérente aux pages. Les héros spécialisés de l'accueil, du diagnostic et des formations sont justifiés par leurs parcours. Les pages de services usuelles partagent `page-hero`, intervention locale et CTA final.

Le découpage Sass est lisible, mais `_sass/components/_footer-accessibility.scss` contient encore des adaptations responsive du hero, des cartes, des processus et des blocs d'intervention. Modifier un composant peut donc demander de regarder deux fichiers. Replacer progressivement ces règles dans le partial du composant simplifierait la maintenance. Les espacements et les breakpoints sont encore exprimés à plusieurs endroits ; compléter les tokens existants est utile si ces valeurs doivent évoluer globalement.

Le menu utilise aujourd'hui le même seuil dans les styles et le JavaScript : mobile jusqu'à 900 px, desktop à partir de 901 px. L'ancien audit de septembre signalait un écart qui est corrigé dans l'état actuel. Les constats historiques de `todo_refactoring.md` et de l'audit de septembre ne doivent pas être traités comme des anomalies encore présentes sans vérifier les sources.

## Contrôles exécutés

- Construction Jekyll normale : réussie.
- Tests du site : 16 tests, 1 373 assertions, aucune erreur.
- Tests Ruby du diagnostic : 7 tests, 52 assertions, aucune erreur.
- Construction et tests avec `/preview` comme baseurl : 1 test, 761 assertions, aucune erreur.
- Vérifications de syntaxe des modules JavaScript prévues dans `script/check` : réussies avant l'étape de formatage.
- `npm run test:js`, exécuté séparément : 13 tests du diagnostic et 2 tests des interactions globales, tous réussis.
- `./script/check` échoue au formatage Prettier de huit fichiers : `_layouts/default.html`, `ai-adoption/index.html`, `ai-engineering/index.html`, `ai-finops/index.html`, `data-reporting/index.html`, `fractional-lead/index.html`, `services/index.html`, `software-rescue/index.html`.

Ces contrôles valident des propriétés techniques et des comportements unitaires. Ils ne prouvent pas le rendu visuel sur mobile, les contrastes, l'envoi réel au backend ni le fonctionnement en production. Aucune source applicative n'a été modifiée pour cet audit.

## Ordre de mise en œuvre proposé

1. Centraliser les prix et caractéristiques Sandbox ; supprimer les trois représentations indépendantes des prix de formation ; adapter les tests pour qu'un changement de prix reste une modification de données.
2. Aligner thème et rattachement Sandbox ; expliciter les FAQ par page ; aligner les emplacements analytics.
3. Centraliser les durées et délais partagés, puis les champs de catalogue utilisés dans les pages locales.
4. Redistribuer les règles responsive des composants et compléter la documentation de maintenance ; corriger le formatage des huit fichiers signalés.

Le critère de réussite principal est concret : changer un montant dans les données doit mettre à jour chaque affichage concerné et son offre structurée, sans modifier de page HTML ni de constante de test.


## Corrections appliquées après validation de l’audit

Les constats ci-dessus décrivent l’état avant intervention. Les prix ont été convertis en montants numériques partagés, les paramètres Sandbox et les durées centralisés, les thèmes des pages rattachés au catalogue, les FAQ explicitement choisies et rendues depuis les mêmes données que leur JSON-LD. Les cartes locales et les zones d’intervention réutilisent leurs données communes. Le suivi de réservation lit une liste configurée et résout l’analytics au clic. Les styles du contact, du footer et de l’accessibilité sont séparés ; les règles responsive ont rejoint les composants concernés.

Un test reconstruit une copie du site après modification des montants, durées et limites pour vérifier leur propagation sur les pages et les offres structurées. La marche à suivre pour modifier ces données est documentée dans le README. Le plan initial de refactoring est explicitement marqué comme historique.


Validation après corrections : `./script/check` réussit (tests du site, du diagnostic, de propagation des paramètres, du baseurl, de syntaxe JavaScript, formatage et tests Node). La revue dans Chrome a porté sur des captures de l’accueil desktop/mobile, des tarifs desktop, de la Sandbox, d’une formation et du diagnostic mobile. Le contrôle des 22 pages publiques à 320, 390, 900, 901, 1024 et 1440 px ne relève plus de débordement horizontal après correction du programme FinOps ; le menu mobile s’ouvre correctement. Ces contrôles ne remplacent pas un envoi réel au backend ni une revue avec lecteur d’écran.


### Allègement éditorial

Après revue des redondances, l’accueil présente une introduction courte, un seul bloc dédié au diagnostic et une méthode illustrée à un seul emplacement. Les reformulations des expertises, les listes de principes et les rappels de réservation successifs ont été retirés. La FAQ générale reste sur la page Expertises ; les FAQ propres à Poitiers, aux formations et à la Sandbox sont conservées. Les explications sur le benchmark dans Ingénierie IA renvoient vers la Sandbox, les passages logistiques répétés sur les offres sont retirés et le pied de page ne recopie plus le discours commercial. Les prix, durées et limites restent pilotés par les mêmes données partagées.

Le texte du contenu principal de l’accueil passe de 1 036 à 532 mots, celui d’Ingénierie IA de 1 129 à 598 mots, celui du diagnostic de 1 134 à 879 mots. Comptage du HTML généré, hors en-tête et pied de page, incluant les libellés du formulaire pour le diagnostic.
