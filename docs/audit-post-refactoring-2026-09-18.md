# Audit et mise en œuvre post-refactoring — 18 septembre 2026

## État après mise en œuvre

Les recommandations techniques de cet audit ont été appliquées le 18 septembre 2026 : breakpoint unique du menu, suppression du thème Primer implicite, hiérarchie des titres, timeout et erreurs du Diagnostic, annonces accessibles, prix et FAQ structurés, métadonnées resserrées, données structurées par page, fil d’Ariane, images optimisées, budgets de poids, formatage SCSS, suivi de réservation sans donnée personnelle et documentation de maintenance.

Restent nécessairement hors de ce dépôt : validation manuelle lecteur d'écran et mobile, envoi réel vers le backend privé, mesure Lighthouse multi-pages, validation des cartes sociales et suivi Search Console/CrUX. Aucun contenu de preuve client n'a été inventé.

Les sections suivantes conservent les constats et mesures observés **avant correction**, pour documenter la décision et les critères de validation. Les éléments R1 à R10 et les actions techniques correspondantes ne décrivent donc plus l'état courant du site.

## Synthèse initiale (avant corrections)

Le refactoring est **globalement réussi**. Le dépôt est propre, le build Jekyll aboutit et la commande de contrôle commune à la CI passe sans erreur. La séparation entre contenu, présentation et logique est nettement meilleure qu'avant : données YAML, includes, partials Sass, modules JavaScript, contrat du Diagnostic et tests sont maintenant identifiables et maintenables.

Il n'y a pas de défaut bloquant détecté pour publier le site. Deux réserves empêchent néanmoins de considérer le chantier comme totalement terminé :

1. le menu utilise un breakpoint JavaScript à `761 px`, alors que son affichage mobile CSS reste actif jusqu'à `900 px` ;
2. le build charge implicitement le thème Primer de GitHub Pages et génère un fichier `assets/css/style.css` inutilisé de 136 Ko.

Le prochain investissement devrait surtout porter sur la suppression de la dette résiduelle, la robustesse du Diagnostic, l'accessibilité réelle au-delà de Lighthouse et l'instrumentation des conversions. Une migration de framework ou l'ajout d'un bundler ne sont pas justifiés.

## Périmètre et méthode

L'audit porte sur l'état du commit `64f7a1d` (`Refactoring`) de la branche `main`, synchronisée avec `origin/main` au moment du contrôle.

Contrôles réalisés :

- exécution de `./script/check` ;
- inspection de la sortie Jekyll générée dans un répertoire temporaire ;
- revue des layouts, includes, données, Sass, JavaScript, tests et configuration CI ;
- contrôle des liens internes, métadonnées, titres, descriptions, niveaux de titres et poids des fichiers générés ;
- comparaison avec les objectifs de `todo_refactoring.md` et la baseline Lighthouse documentée.

Résultats automatisés :

- build Jekyll réussi ;
- 17 tests Ruby réussis, soit 1 187 assertions ;
- 14 tests JavaScript réussis ;
- formatage HTML/Liquid validé ;
- 21 URL publiques présentes dans le sitemap ;
- aucune canonical, description, balise `title`, balise `h1`, ancre ou ressource locale manquante selon la suite actuelle.

Limites de cet audit :

- le parcours d'envoi n'a pas été exécuté contre le backend privé ;
- la baseline Lighthouse existante date du 15 septembre 2026 et ne couvre que l'accueil en local ;
- aucune donnée Google Search Console, CrUX, analytics ou conversion n'était disponible ;
- les contrôles automatisés ne remplacent pas un test manuel avec lecteur d'écran et appareils réels.

## Ce qui est réussi

### Architecture et maintenance

- La décision de conserver Jekyll, Sass et des modules ES natifs est proportionnée au besoin.
- Le `<head>` est séparé entre métadonnées, données structurées et analytics.
- Les formations partagent des composants ciblés, sans layout universel surchargé de conditions.
- Les services, formations, tarifs, navigation et questions du Diagnostic reposent largement sur `_data/`.
- La commande `script/check` reproduit bien la CI et construit dans un dossier temporaire.
- Ruby, Node et les dépendances de formatage sont verrouillés ; Dependabot couvre Bundler et npm.
- Les décisions d'architecture et la maintenance d'ALTCHA sont documentées.

### Diagnostic IA

- La logique pure, le DOM, le stockage, ALTCHA et le transport HTTP sont séparés.
- Le contrat de soumission est versionné et testé.
- Le brouillon est conservé dans `sessionStorage` et supprimé après succès.
- Les propriétés analytics sont limitées aux données de contexte prévues ; les réponses et coordonnées ne sont pas envoyées à Umami.
- Les cas d'erreur principaux, le timeout ALTCHA et le payload sont couverts par des tests unitaires.

### Performance actuelle

Le socle est léger :

| Ressource | Poids brut | Poids gzip approximatif | Lecture |
|---|---:|---:|---|
| CSS réellement chargé (`site.css`) | 52,9 Ko | 10,2 Ko | Bon |
| JavaScript global | 1,9 Ko | 0,9 Ko | Excellent |
| Modules propres au Diagnostic, hors ALTCHA | 16,4 Ko | 5,9 Ko | Bon |
| ALTCHA | 113,7 Ko | 34,8 Ko | Acceptable et limité à la page Diagnostic |
| Avatar web | 251,7 Ko | non compressible davantage par HTTP | Perfectible |
| Image Open Graph | 2,03 Mo | non chargée dans le rendu normal | Trop lourde pour les robots sociaux |

La baseline locale documentée annonce 100/100 dans les quatre catégories Lighthouse, avec un LCP mobile à 1,7 s. C'est une bonne référence, mais elle doit devenir un contrôle répétable sur plusieurs pages.

## Points à corriger en priorité

| ID | Priorité | Domaine | Constat | Action recommandée | Critère de validation |
|---|---|---|---|---|---|
| R1 | P1 | Navigation | Le CSS bascule le menu à `900 px`, le JavaScript écoute `(min-width: 761px)`. Les règles du menu sont en plus dupliquées dans deux media queries. | Choisir un breakpoint unique, probablement `900/901 px`, supprimer le bloc dupliqué et aligner le test JavaScript. | Ouverture/fermeture correcte à 760, 800, 900 et 901 px ; pas de règle dupliquée. |
| R2 | P1 | Accessibilité | Cinq pages passent directement d'un `h1` à des `h3` : services, AI Engineering, AI FinOps, Data Reporting et Software Rescue. | Ajouter un `h2` de section ou rendre les premiers titres de cartes `h2` selon la structure éditoriale. | Aucun saut de niveau dans la sortie générée. |
| R3 | P1 | Diagnostic | Une erreur serveur visant une question d'une étape précédente est écrite dans un champ masqué alors que l'utilisateur reste sur l'étape 7. | Associer chaque champ à son étape, revenir sur la première étape en erreur, afficher un résumé et focaliser le champ concerné. | Test automatisé d'une erreur serveur sur un champ des étapes 1 à 6. |
| R4 | P1 | Diagnostic | L'appel HTTP n'a pas de timeout et les erreurs réseau natives peuvent apparaître en anglais. | Utiliser `AbortController`, définir un timeout nommé et normaliser les messages hors ligne, timeout, 4xx et 5xx. | Tests déterministes pour timeout, rejet réseau et réponse serveur invalide. |
| R5 | P1 | Maintenance | Le thème implicite `jekyll-theme-primer` génère `assets/css/style.css` (136,5 Ko, 14,9 Ko gzip), qui n'est référencé par aucune page. | Neutraliser explicitement le thème par défaut dans la configuration, puis vérifier le build GitHub Pages. | `style.css` n'existe plus dans la sortie et `script/check` reste vert. |
| R6 | P1 | Données | Des tarifs restent écrits en dur dans `tarifs/index.html` alors que `_data/pricing.yml` est censé être la source de vérité. | Faire rendre toutes les valeurs tarifaires partagées depuis les données et ajouter un test sur les prix clés. | Un changement de tarif partagé ne nécessite qu'une modification. |
| R7 | P1 | UX/A11y | La progression du Diagnostic change visuellement, mais n'est pas exposée comme une vraie barre de progression ; les erreurs ne sont pas reliées aux champs par `aria-describedby`. | Ajouter `role="progressbar"`, `aria-valuemin/max/now`, une annonce sobre du changement d'étape et les relations champ-erreur. | Parcours cohérent avec NVDA/VoiceOver, sans annonces répétitives. |
| R8 | P2 | Configuration | L'URL par défaut de l'API existe dans `_config.yml`, le template et `core.mjs`. Les liens internes alternent entre `relative_url` et des chemins `/...` codés en dur. | Garder une seule source d'URL d'API ; décider explicitement si le site supporte un `baseurl`, puis appliquer cette décision partout. | Pas de duplication de l'endpoint ; build de test avec un `baseurl` si ce mode est supporté. |
| R9 | P2 | CSS | Plusieurs partials sont encore compactés sur une ligne et `_footer-accessibility.scss` mélange contact, footer, accessibilité et responsive global. | Appliquer un formatage SCSS, déplacer les règles dans leur composant et ajouter un contrôle de style léger. | Une responsabilité principale par partial ; formatage vérifié par CI. |
| R10 | P2 | Documentation | `todo_refactoring.md` conserve presque toutes les tâches initiales décochées, puis affirme plus bas qu'elles sont réalisées. | Transformer ce fichier en historique archivé ou cocher réellement les éléments avec des liens vers les preuves. | Aucun état contradictoire dans la documentation. |

## Maintenance et qualité du code

### Réduire les sources de vérité multiples

Les données globales devraient être modifiables à un seul endroit :

- tarifs et libellés tarifaires dans `_data/pricing.yml` ;
- promesses du Diagnostic (`5 minutes` contre `5 à 8 minutes`, délai de retour) dans les données du Diagnostic ;
- adresse, zone principale et identité légale dans `_config.yml` ou `_data/profile.yml` ;
- endpoint du Diagnostic dans la configuration rendue dans le HTML, sans fallback métier dupliqué dans JavaScript ;
- liens vers services, formations et pages locales via `relative_url` si la compatibilité `baseurl` est conservée.

Une faute est déjà visible dans `_data/formations.yml` : `1Journée minimum`. Le libellé pourrait devenir `1 journée minimum` ou, plus naturellement, `1 journée — approfondissement sur mesure`.

### Finir le découpage Sass

Le passage à Sass est positif, mais le découpage conserve une partie de la forme historique du fichier monolithique. Les prochaines étapes utiles sont :

1. déplacer les media queries du menu dans `_sass/components/_header.scss` ;
2. séparer contact, footer et accessibilité ;
3. documenter les breakpoints comme tokens ou, au minimum, dans une convention unique ;
4. formater tous les fichiers SCSS avec Prettier ou Stylelint sans minifier les sources ;
5. rechercher les sélecteurs dupliqués après compilation.

Le CSS réellement chargé ne pèse que 10,2 Ko gzip : le but est donc la lisibilité et la prévention des régressions, pas un découpage réseau par page.

### Renforcer les tests à rendement élevé

Ajouter en priorité :

- un test de cohérence entre breakpoint CSS et comportement du menu ;
- un test des niveaux de titres ;
- un test des longueurs de métadonnées sous forme d'avertissement, pas de règle SEO arbitraire bloquante ;
- un test garantissant que `assets/css/style.css` n'est pas généré ;
- un scénario navigateur minimal avec Playwright pour le menu et la navigation complète du Diagnostic ;
- un contrôle planifié des liens externes, séparé de la CI de chaque commit ;
- un budget de poids simple sur le CSS, le JavaScript global et les images réellement utilisées.

Le workflow et le job CI portent encore le nom `sitemap`, alors qu'ils valident désormais tout le site. Les renommer en `quality` ou `site-checks` rendrait leur rôle plus clair.

### Garder les changements futurs relisibles

Le commit de refactoring touche 95 fichiers et mélange structure, tests, contenu et nouvelles pages. C'était efficace pour remettre le dépôt à niveau, mais les évolutions suivantes devraient revenir à des lots plus petits : un correctif de navigation, un lot Diagnostic, un lot données, un lot SEO, puis un lot images. Cela facilitera la revue et le retour arrière.

## Performance et robustesse

### Gains immédiats

1. **Supprimer le CSS Primer inutilisé.** Il n'affecte pas le rendu puisqu'il n'est pas chargé, mais il alourdit inutilement la sortie publiée et brouille les audits.
2. **Réencoder l'image Open Graph.** Une image JPEG de bonne qualité aux dimensions sociales adaptées devrait pouvoir descendre nettement sous 500 Ko. Vérifier le rendu sur LinkedIn et autres cartes sociales avant remplacement.
3. **Proposer WebP/AVIF pour l'avatar visible**, avec PNG/JPEG de repli si nécessaire. Un objectif de 50 à 100 Ko est réaliste pour 512 px selon le contenu.
4. **Ne plus publier les originaux inutilisés.** Déplacer les fichiers sources hors de l'arborescence publiée ou les exclure explicitement après vérification des usages externes.
5. **Automatiser la version des assets.** `asset_version: "20260915"` sera facile à oublier. Utiliser une révision de build stable, avec un fallback local, ou documenter une étape de release contrôlée.

### Ce qu'il ne faut pas faire maintenant

- Ne pas ajouter de bundler uniquement pour minifier environ 18 Ko de JavaScript applicatif.
- Ne pas découper les 10 Ko gzip de CSS en feuilles par page.
- Ne pas charger une police web : les polices système actuelles évitent du réseau et du CLS.
- Ne pas ajouter de lazy-loading au logo du header ; il est petit et immédiatement visible.

### Mesure continue

Étendre la baseline Lighthouse aux pages suivantes :

- accueil ;
- Diagnostic IA ;
- Tarifs, qui est la page la plus longue avec environ 2 159 mots ;
- une formation ;
- une page locale, par exemple Poitiers.

Conserver les résultats JSON comme artefacts CI, comparer les médianes de plusieurs passages et définir des budgets tolérants plutôt que d'exiger systématiquement 100. Les données terrain CrUX et Search Console doivent primer sur un score local lorsqu'elles deviennent disponibles.

## UX et accessibilité

### Navigation

- Mettre à jour le libellé du bouton entre « Ouvrir le menu » et « Fermer le menu ».
- Marquer la rubrique parente active sur les pages enfants : « Expertises » pour les pages de service et « Formations IA » pour les fiches de formation.
- Indiquer visuellement ou textuellement l'ouverture d'un nouvel onglet pour les liens externes importants. Le nouvel onglet de la politique de confidentialité peut se justifier pendant la saisie du Diagnostic, mais ce choix doit rester intentionnel.
- Tester à 320 px, 400 %, clavier seul, VoiceOver Safari et NVDA Firefox/Chrome.

### Diagnostic

- Prévoir un message `<noscript>` et un état explicite si les modules JavaScript ou ALTCHA ne se chargent pas ; actuellement le formulaire devient simplement inerte.
- Mémoriser éventuellement l'étape courante avec le brouillon et proposer « Reprendre » ou « Recommencer ».
- Relier les erreurs aux champs, annoncer le titre de la nouvelle étape et ramener les erreurs serveur vers leur étape.
- Afficher une erreur réseau claire avec une action « Réessayer », sans perdre les réponses.
- Vérifier sur mobile que le bloc de navigation collant ne masque ni le dernier champ ni le clavier virtuel.
- Harmoniser les promesses de durée et de délai de réponse sur l'accueil et la page Diagnostic.

### Lisibilité et conversion

- La page Tarifs est complète mais très longue. Ajouter un sommaire ancré au début ou une navigation par type de besoin améliorerait le balayage sans masquer l'information.
- Standardiser les CTA principaux par intention : « faire le diagnostic », « réserver 20 minutes », « demander une formation ». Éviter plusieurs formulations concurrentes pour une même action sur une page.
- Les attributs `data-booking-location` existent sur tous les liens de réservation, mais seuls les clics issus du Diagnostic sont mesurés. Si le suivi de conversion est souhaité, envoyer un événement générique avec une `location` issue d'une liste autorisée, sans donnée personnelle.
- Ajouter des preuves uniquement réelles et vérifiables : études de cas anonymisées, résultats mesurés, méthode, certifications ou témoignages autorisés. C'est probablement le levier UX/SEO le plus fort après les correctifs techniques.

## SEO

### État actuel

Les fondamentaux sont solides : 21 pages publiques, canonicals absolues, titres et descriptions uniques, un seul `h1` par page, sitemap cohérent, pages privées hors sitemap, maillage interne dense, Open Graph, Twitter Cards et JSON-LD valides.

Points perfectibles observés :

- titres rendus dépassant environ 60 caractères sur certaines pages, notamment À propos et Diagnostic ;
- descriptions de 163 à 174 caractères sur l'accueil, le Diagnostic, le portail IA et les Tarifs ;
- cinq pages avec saut direct de `h1` à `h3` ;
- données structurées identiques sur toutes les pages, sans entités spécifiques aux services et formations ;
- absence de `lastmod` dans le sitemap tant qu'aucune date fiable n'est fournie ;
- image Open Graph beaucoup plus lourde que nécessaire.

Les longueurs ne sont pas des pénalités en elles-mêmes, mais les extraits risquent d'être tronqués. Réécrire d'abord les pages ayant une proposition de valeur importante, en plaçant l'intention principale au début.

### Données structurées recommandées

Ajouter seulement des données visibles et exactes :

- `Service` sur les pages d'expertise ;
- `Course` et `Offer` sur les trois formations ;
- `BreadcrumbList` sur les pages profondes, idéalement avec un fil d'Ariane visible ;
- `FAQPage` sur la page Poitiers uniquement si les questions et réponses restent affichées à l'identique. Le gain en résultat enrichi n'est pas garanti et ne doit pas justifier du contenu artificiel.

Valider le JSON-LD généré par test et avec les outils des moteurs après publication.

### Contenu et pilotage SEO

Priorités éditoriales :

1. publier quelques cas d'usage concrets reliant problème, intervention et résultat ;
2. renforcer les liens contextuels entre service, tarif, formation et zone géographique ;
3. éviter de créer des pages locales quasi identiques pour multiplier les villes ;
4. suivre impressions, requêtes, CTR, positions et conversions dans Search Console et Umami ;
5. n'ajouter `lastmod` que si la date peut être maintenue automatiquement ou honnêtement.

## Sécurité et dépendances

- Dependabot mensuel est un bon minimum.
- Ajouter la source exacte, la licence et le SHA-256 du bundle ALTCHA à sa documentation rendrait les mises à jour auditables.
- Le build affiche un avertissement sur l'absence de `faraday-retry`. Il est non bloquant, mais peut être supprimé en mettant à jour ou en complétant proprement la dépendance concernée après vérification avec `github-pages`.
- Si des en-têtes HTTP personnalisés deviennent nécessaires (`Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`), GitHub Pages seul sera limitant. Ne changer d'hébergement ou n'ajouter un proxy que pour un besoin mesuré.
- Toute évolution du contrat, du stockage, d'ALTCHA ou des événements analytics doit rester coordonnée avec le backend privé.

## Feuille de route proposée

### Lot 1 — Correctifs courts

- aligner le breakpoint du menu et supprimer la duplication CSS ;
- corriger les cinq hiérarchies de titres ;
- corriger `1Journée minimum` ;
- neutraliser Primer et empêcher la génération de `style.css` ;
- renommer le workflow CI ;
- archiver ou mettre à jour `todo_refactoring.md`.

### Lot 2 — Robustesse et maintenance

- gérer timeout, erreurs réseau et erreurs serveur multi-étapes du Diagnostic ;
- améliorer les annonces accessibles du formulaire ;
- centraliser tarifs, promesses du Diagnostic, profil et endpoint API ;
- décider et tester la stratégie `baseurl` ;
- formater et redistribuer les partials SCSS ;
- ajouter un test navigateur ciblé.

### Lot 3 — Performance, UX et SEO

- optimiser l'Open Graph et l'avatar ;
- retirer les assets non publiables de la sortie ;
- rendre la version des assets automatique ;
- améliorer la navigation de la page Tarifs ;
- ajouter les données structurées `Service`, `Course` et `BreadcrumbList` ;
- établir des baselines multi-pages et suivre les données terrain ;
- produire des cas clients ou preuves concrètes lorsque disponibles.

## Définition de terminé

Le refactoring pourra être considéré comme clos lorsque :

- `./script/check` et la CI passent ;
- le menu a un breakpoint unique testé ;
- aucune page ne saute de `h1` à `h3` ;
- le CSS Primer inutilisé n'est plus généré ;
- les tarifs et l'endpoint du Diagnostic ont une source de vérité unique ;
- une erreur serveur du Diagnostic ramène l'utilisateur au bon champ ;
- le parcours clavier et lecteur d'écran est vérifié manuellement ;
- les images sociales et visibles respectent un budget documenté ;
- les mesures Lighthouse couvrent plusieurs gabarits ;
- la documentation ne présente plus d'état contradictoire.

## Conclusion

Le refactoring a bien amélioré le projet et peut servir de base fiable. La priorité n'est plus de réorganiser massivement le dépôt, mais de corriger quelques incohérences précises, de rendre le Diagnostic plus résilient et d'installer une boucle de mesure réelle pour l'UX, le SEO et la conversion. Les trois lots ci-dessus peuvent être réalisés indépendamment, sans refonte visuelle ni changement d'architecture.
