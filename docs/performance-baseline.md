# Baseline Lighthouse — 15 septembre 2026

Mesure locale de la page d'accueil après le refactoring, avec Lighthouse 13.4.1 et Chrome headless. Les chiffres locaux sont une référence de non-régression ; ils ne remplacent pas une mesure sur l'hébergement de production.

| Profil | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Mobile | 100 | 100 | 100 | 100 | 1,4 s | 1,7 s | 0 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0,3 s | 0,5 s | 0 ms | 0 |

Commande mobile :

```bash
npx --yes lighthouse http://127.0.0.1:4000/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless --no-sandbox"
```

Pour le profil desktop, ajouter `--preset=desktop`.

Les résultats JSON de l'audit sont temporaires et ne sont pas versionnés.
