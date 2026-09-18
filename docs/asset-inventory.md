# Inventaire des assets

## Assets utilisés par les sources

- `assets/img/avatar-512.png` : variante web du portrait, affichée sur l'accueil et la page À propos ; aussi référencée dans les données structurées.
- `assets/img/og-optimized.png` : image Open Graph et Twitter ; conserver ses dimensions 1730 × 909.
- `assets/img/logo-jb.svg` : logo utilisé dans le header et le footer.
- `assets/img/favicon.svg` : favicon du site.
- `assets/vendor/altcha/altcha.min.js` : composant anti-robot auto-hébergé du Diagnostic.

## Assets à vérifier avant suppression

Les originaux `avatar.png` et `og.png`, les variantes PNG/SVG de logo ainsi que `schema_site.png` ne sont pas référencés par les pages, mais peuvent être utilisés dans des supports externes. Ne les supprimer qu'après confirmation de leur absence d'usage hors du dépôt.

## Règle de maintenance

Toute image de contenu doit définir sa taille intrinsèque. Les images hors du premier écran utilisent `loading="lazy"` et `decoding="async"`. La compression ou le changement de format doit conserver le cadrage et faire l'objet d'un contrôle visuel desktop et mobile.
