# Inventaire des assets

## Assets utilisés par les sources

- `assets/img/avatar-512.webp` : variante web prioritaire du portrait, affichée sur l'accueil et la page À propos. Le PNG 512 px reste le repli et l'image des données structurées.
- `assets/img/og-optimized.jpg` : image Open Graph et Twitter ; conserver ses dimensions 1730 × 909. Le PNG antérieur reste publié temporairement afin de ne pas casser les cartes sociales déjà mises en cache.
- `assets/img/logo-jb.svg` : logo utilisé dans le header et le footer.
- `assets/img/favicon.svg` : favicon du site.
- `assets/vendor/altcha/altcha.min.js` : composant anti-robot auto-hébergé du Diagnostic.

## Assets à vérifier avant suppression

Les originaux `avatar.png` et `og.png`, les variantes PNG/SVG de logo ainsi que `schema_site.png` ne sont pas référencés par les pages. Ils sont exclus de la sortie Jekyll mais restent dans le dépôt pour les supports externes. Ne les supprimer qu'après confirmation de leur absence d'usage hors du dépôt.

## Règle de maintenance

Toute image de contenu doit définir sa taille intrinsèque. Les images hors du premier écran utilisent `loading="lazy"` et `decoding="async"`. La compression ou le changement de format doit conserver le cadrage et faire l'objet d'un contrôle visuel desktop et mobile.
