# Refonte Sandbox IA locale — livraison

Publication autorisée par l’utilisateur sur GitHub Pages depuis la branche `main`. Les URL et redirections sont conservées. Les modifications d’apparence déjà présentes au début de l’intervention ont été conservées.

## Résultat

- Offre centrée sur l’expertise, la préparation des essais, le laboratoire personnel et l’analyse des résultats.
- Configurateur sans compte : objectifs multiples, configurations de modèles, campagne matérielle, préférences, interface exclusive, formation et rapport.
- Budget immédiat pour 30 jours : accompagnement de 2 400 € HT et profils facturés séparément (Lite 100 €, Standard 180 €, Premium 500 €). Les trois profils bénéficient de 10 % de remise sur leur montant cumulé : 702 € HT. Sans profil choisi, le total partiel exclut les profils à définir ensemble.
- Exemples vérifiés : accompagnement et profil Lite = **2 500 € HT** ; accompagnement et pack des trois profils = **3 102 € HT** ; quatre configurations, Lite + Standard, API et formation = **4 380 € HT**.
- Coordonnées et commentaire intégrés au récapitulatif. Le bouton prépare un e-mail dans la messagerie ; le visiteur doit le vérifier et l’envoyer. Copie automatique ou sélection manuelle du texte en secours, avec lien vers le contact existant.
- Section Sandbox placée après l’introduction générale et avant les services dans les deux présentations de l’accueil.
- Tarifs et FAQ harmonisés, y compris le JSON-LD de FAQ. Suppression de l’ancien forfait à cinq configurations et des anciens suppléments matériel/prolongation. Prolongation sans nouvelle campagne uniquement sur devis.
- Cadre explicite : expérimentation, données adaptées, accès limités et sécurisés, licences vérifiées, compatibilité étudiée et absence de ressources exclusivement réservées ou de SLA de production.

## Fichiers concernés par cette intervention

| Ensemble | Fichiers |
| --- | --- |
| Données commerciales et pédagogiques | `_data/pricing.yml`, `_data/sandbox.yml`, `_data/faqs.yml` |
| Page et configurateur | `sandbox-ia-locale/index.html`, `_includes/sandbox-configurator.html`, `_includes/sandbox-option-price.html`, `_includes/sandbox-extension-scope.html`, `_includes/sandbox-starting-price.html`, `_includes/sandbox-profile-pack.html` |
| Calcul et interactions | `assets/js/sandbox/core.mjs`, `assets/js/sandbox/index.mjs` |
| Accueil | `_includes/home-sandbox.html`, `_includes/presentations/minimalist/home.html`, `_includes/presentations/commercial/home.html` |
| Tarifs | `tarifs/index.html`, `_includes/price.html` (possibilité d’afficher un montant sans préfixe) |
| Styles | `_sass/pages/_home-sandbox.scss`, `_sass/pages/_sandbox-builder.scss`, `assets/css/site.scss`, `assets/css/commercial.scss`, `assets/css/sandbox.scss` |
| Chargement des styles par page | `_includes/head/meta.html` (prise en charge de `page.extra_css`) |
| Vérifications | `test/sandbox_test.rb`, `test/js/sandbox.test.mjs`, `test/js/sandbox-dom.test.mjs`, `test/configuration_test.rb`, `test/site_test.rb`, `script/check`, `script/test-sandbox-js`, `package.json` |
| Documentation | `README.md`, ce document |

Les tarifs restent centralisés dans `_data/pricing.yml`. Les objectifs, profils et prestations incluses sont dans `_data/sandbox.yml`. Ces données sont transmises au JavaScript par des attributs JSON échappés lors de la construction Jekyll : aucun script exécutable inline, CDN, backend, stockage des coordonnées ou dépendance JavaScript supplémentaire.

Les seuls événements Umami ajoutés sont `sandbox_configurator_viewed`, `sandbox_configuration_started` et `sandbox_quote_requested`, sans propriétés contenant des choix ou des données saisies. Les styles du configurateur se chargent seulement sur la page Sandbox ; le petit composant d’accueil utilise les styles partagés des deux présentations.

## Vérifications effectuées

`./script/check` passe intégralement :

- Constructions Jekyll normale et avec le préfixe `/preview`.
- 36 tests Ruby : références locales, ancres, métadonnées, JSON-LD et FAQ visibles, périmètre commercial, contrôles natifs et libellés accessibles, présence de l’offre avant les services dans les deux accueils, budgets de poids des ressources.
- 31 tests JavaScript au total, dont les tests Sandbox couvrant les 192 combinaisons tarifaires, les totaux partiels, les options exclusives, les modifications de tarifs, l’encodage du récapitulatif et la confidentialité des événements.
- Tests des interactions dans un DOM simulé : mise à jour immédiate, sélection de plusieurs profils et remise du pack, conseil par défaut, copie et secours manuel, préparation de l’e-mail et réinitialisation des coordonnées.
- Vérification de propagation avec des données commerciales modifiées dans une copie isolée du site : prix affichés, données utilisées par le calcul et FAQ structurée.
- Syntaxe JavaScript, formatage HTML/SCSS et `git diff --check`.

## Limite de validation

Le navigateur de contrôle est indisponible dans cette session. Les styles adaptatifs et la structure sémantique ont été contrôlés, mais **le rendu visuel et la navigation réelle au clavier sur mobile et ordinateur restent à vérifier dans un navigateur avant publication**. Les tests DOM ne remplacent pas cette vérification. Aucun e-mail réel n’a été envoyé.

Pour relire localement : `bundle exec jekyll serve`, puis ouvrir `/`, `/sandbox-ia-locale/#configurateur` et `/tarifs/#sandbox-ia-locale` dans les vues Pragmatique et Commerciale. Vérifier notamment le récapitulatif sur petit écran, les ancrages sous l’en-tête, le pack complet et le mode « être conseillé » et la copie du récapitulatif.

## Ajustements du 13 novembre

Le CTA « Découvrir le laboratoire » a été retiré du bloc d’accueil. L’API sécurisée est incluse dans le forfait sur la période d’expérimentation ; seule l’interface de chat hébergée ajoute 200 € HT/mois. Les connecteurs et agents spécifiques sont sur devis séparé. Les familles texte, code, image/vision, OCR et documentaire sont précisées dans l’étape B. Le contenu explique désormais ce que couvrent les 30 jours.

La réponse au `QCM_20261113160740.md` a été intégrée : profils Lite 100 €, Standard 180 €, Premium 500 € HT pour 30 jours, addition des profils sélectionnés et remise de 10 % sur cette catégorie lorsque les trois sont cochés. Le forfait d’accompagnement existant de 2 400 € HT est conservé séparément. Le prix d’entrée affiché sur l’accueil et la page Sandbox est donc de 2 500 € HT. Les anciennes campagnes tarifées uniquement au nombre de profils ont été supprimées. Les modèles des machines ne figurent plus dans les fiches de profils. Le fichier QCM est explicitement exclu de la génération Jekyll.

## Présentation par défaut et publication

Les libellés publics sont « Vue commerciale » et « Vue pragmatique ». La vue commerciale est la présentation initiale du HTML et le défaut JavaScript pour une première visite. Les préférences déjà mémorisées restent prioritaires. Les identifiants internes sont conservés pour assurer cette continuité. La publication utilise la configuration GitHub Pages existante : branche `main`, racine du dépôt, domaine `jboudoux.fr`.
