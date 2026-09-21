# Maintenance d’ALTCHA

Le bundle frontend est volontairement auto-hébergé dans `assets/vendor/altcha/`. Sa version de référence est indiquée dans `assets/vendor/altcha/VERSION`.

- source : publication officielle ALTCHA, version 3.2.2 ;
- licence : vérifier la licence publiée avec chaque version avant mise à jour ;
- SHA-256 du bundle actuellement versionné : `71b2d6829de9893e5d6bfc806d343b2c7dead04b2157ff2a5ba3372938c3a6be`.

Pour une mise à jour :

1. Vérifier la version, l'origine et la licence depuis la publication officielle d’ALTCHA.
2. Remplacer le bundle, mettre à jour `VERSION` et consigner son SHA-256 dans une même modification.
3. Vérifier que le composant est toujours chargé comme module sur `/diagnostic-ia/`.
4. Tester le parcours complet contre l’environnement backend de développement autorisé.
5. Exécuter `./script/check` et vérifier manuellement le formulaire sur mobile et desktop.

Le backend reste responsable de la validation cryptographique du payload. Ne jamais désactiver ALTCHA uniquement pour contourner une erreur de formulaire en production.
