# jboudoux.fr — V3

Site GitHub Pages factorisé avec **Jekyll natif** (supporté par GitHub Pages), sans framework JavaScript ni build externe.

## Pourquoi Jekyll maintenant ?
La V2 répétait le `<head>`, le header, le footer et une partie des cartes dans presque chaque `index.html`. La V3 factorise ces éléments :

- `_layouts/default.html` : squelette HTML commun
- `_includes/header.html` / `footer.html` : navigation et footer
- `_includes/page-hero.html` : hero des pages secondaires
- `_includes/engineering-map.html` : schéma Comprendre → Concevoir → Construire → Mesurer
- `_includes/expertise-grid.html` : cartes expertises communes
- `_includes/pricing.html` : repères tarifaires
- `_includes/icon.html` : SVG line-art cohérents
- `_data/services.yml` : contenu des expertises
- `_data/pricing.yml` : repères budgétaires
- `_data/navigation.yml` : navigation

Chaque page `index.html` ne contient plus que son front matter et son contenu spécifique.

## Important
`.nojekyll` a été supprimé volontairement : GitHub Pages doit exécuter Jekyll pour résoudre les layouts/includes.

## Test local
Si Jekyll est installé :
```bash
bundle exec jekyll serve
```
Sinon, le rendu complet (Liquid/includes) est surtout à valider via GitHub Pages. Un simple `python -m http.server` ne compile pas Jekyll.

## Déploiement
Dézipper à la racine de `jimmyboudoux.github.io`, puis :
```bash
git add .
git commit -m "Refactor site with Jekyll and engineering identity"
git push
```

## À vérifier avant publication définitive
- tester `contact@jboudoux.fr`
- confirmer les repères budgétaires publics
- remplacer l’avatar par une photo professionnelle quand souhaité
