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
Le sitemap est compilé automatiquement à chaque build à partir des pages HTML et des
collections Jekyll publiées (posts, articles, ressources, études de cas, etc.). La
commande suivante construit le site et vérifie le XML, les URLs canoniques, les
doublons, les URLs techniques et la référence dans `robots.txt` :
```bash
bundle exec jekyll build && ruby script/validate_sitemap.rb
```
Cette même vérification est exécutée automatiquement par GitHub Actions à chaque
push et pull request.

Pour prévisualiser le site localement :
```bash
bundle exec jekyll serve
```

Un contenu qui ne doit pas être indexé doit avoir dans son front matter :
```yml
noindex: true
sitemap: false
```

Ajoutez `last_modified_at` uniquement lorsqu'une date de modification réelle est
connue. Les contenus de collections utilisent aussi leur `date` de publication.

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
