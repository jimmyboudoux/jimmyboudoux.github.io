# ADR 0001 — Jekyll et modules JavaScript natifs

## Décision

Le site reste construit avec Jekyll/GitHub Pages. Les interactions utilisent JavaScript natif et, lorsqu'elles exigent un découpage, des modules ES servis directement par le site.

## Conséquences

- Le déploiement reste compatible avec GitHub Pages sans outil de build frontend supplémentaire.
- Les styles sont découpés en partials Sass compilés par Jekyll.
- Un framework ou bundler n'est introduit que lorsqu'un besoin concret ne peut plus être traité simplement avec cette architecture.
