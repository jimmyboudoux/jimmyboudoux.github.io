# Transformation « Minimalist Text-First Hierarchical UI »

Branche d’expérimentation : `test_ui_minimalist`.

## Intention

Une interface utilitaire, sombre, minimaliste et hiérarchique, privilégiant la lisibilité et l’accès direct à l’information. Aucun élément décoratif superflu, aucune carte marketing, aucun hero banner, aucune animation inutile. L’architecture de l’information constitue l’identité visuelle.

La référence fournie guide les proportions, les bordures fines, la navigation latérale et la synthèse d’accueil. Les offres, tarifs et conditions commerciales viennent du site existant ; l’image ne fait pas autorité sur le contenu.

## Plan implémenté

1. **Cadre commun** : en-tête `jboudoux.fr`, accès rapides Tarifs / Méthode / Contact, navigation latérale hiérarchique et contenu principal bordé. Une seule localisation dans le fil d’Ariane. L’élément actif utilise `aria-current="page"` et une surface bleue discrète.
2. **Accueil de synthèse** : titre court, phrase de positionnement, tableau sémantique des six domaines, tarifs HT issus de `_data/pricing.yml`, méthode numérotée, coordonnées et principes. Les conditions « à partir de » sont conservées. Les repères audit / pilotage sont accessibles dans un détail dépliable.
3. **Système visuel** : fond charbon uni, texte clair, liens bleus, séparateurs gris, police système sans téléchargement, quatre niveaux typographiques, petits rayons. Suppression des dégradés, ombres, formes décoratives et mouvements au survol.
4. **Pages intérieures** : bandeaux transformés en introductions compactes ; les anciennes cartes deviennent des sections textuelles séparées par un filet. Les contenus, URLs, données structurées et fonctionnalités métier sont conservés. Pied de page compact avec profils, ressources et liens légaux.
5. **Responsive et accessibilité** : colonne latérale sur ordinateur ; menu dans le flux sur petit écran, ouvert/fermé par bouton, Échap et clic extérieur. Le menu reste visible sans JavaScript. Tableaux lisibles, sections empilées, focus visible, lien d’évitement et contrôles de formulaire sombres.
6. **Vérification** : construction Jekyll, contrôles du dépôt, propagation des tarifs/configuration, navigation active, ancres et liens, contrat du Diagnostic IA, construction sous `/preview`, puis inspection visuelle si le navigateur local est disponible.

## Points d’entrée

- `_data/sidebar.yml` : arborescence du menu ; `_data/home_offers.yml` : synthèse des domaines et liens.
- `_layouts/default.html`, `_includes/header.html`, `_includes/sidebar.html`, `_includes/page-location.html`, `_includes/footer.html` : cadre commun.
- `index.html` : accueil.
- `_sass/base/_foundation.scss` : palette et typographie ; `_sass/components/_header.scss` : cadre et navigation ; `_sass/pages/_minimalist.scss` : synthèse et adaptation des contenus.
- Les autres partials Sass sont adaptés à la palette sombre ; les anciens styles du diagramme promotionnel sont supprimés.

## Critères d’acceptation

- Chaque page présente un seul H1, une navigation cohérente et des liens utilisables au clavier.
- L’accueil expose offres, tarifs et contact sans imposer un long parcours de sections promotionnelles.
- Les pages de détail et le Diagnostic restent accessibles ; aucun prix n’est copié en dur dans l’accueil.
- Aucun débordement horizontal sur mobile ; zones tactiles utilisables et menu accessible sans JavaScript.
- `./script/check` passe. Toute limite de vérification visuelle est explicitée lors de la livraison.

## Essai local

```sh
git switch test_ui_minimalist
bundle exec jekyll serve
```

Ouvrir l’adresse affichée par Jekyll. Aucun déploiement n’est nécessaire pour comparer cette branche à `main`.

## Résultats de validation

- `./script/check` : réussi (32 tests Ruby, 16 tests JavaScript, formatage et construction avec `/preview`).
- Navigateur Chrome : les 22 pages publiques ont été contrôlées à 320, 768 et 1 448 pixels, soit 66 vérifications sans débordement horizontal.
- Inspection visuelle de l’accueil sur ordinateur et mobile, et de la page Services sur ordinateur.
- Menu mobile : ouverture, fermeture avec Échap et état `aria-expanded` vérifiés.
- Diagnostic IA : erreur obligatoire et passage de la première à la deuxième étape vérifiés avec des réponses de test. L’envoi au backend n’a pas été exécuté.
- CSS compilé : 52 714 octets, sous le budget existant de 60 000 octets.
- L’audit local `AUDIT_ARCHITECTURE_jboudouxfr.md`, présent avant la refonte, est exclu de la génération Jekyll ; son contenu reste intact.
