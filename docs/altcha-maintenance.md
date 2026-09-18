# Maintenance d’ALTCHA

Le bundle frontend est volontairement auto-hébergé dans `assets/vendor/altcha/`. Sa version de référence est indiquée dans `assets/vendor/altcha/VERSION`.

Pour une mise à jour :

1. Vérifier la version et son origine depuis la publication officielle d’ALTCHA.
2. Remplacer le bundle et mettre à jour `VERSION` dans une même modification.
3. Vérifier que le composant est toujours chargé comme module sur `/diagnostic-ia/`.
4. Tester le parcours complet contre l’environnement backend de développement autorisé.
5. Exécuter `./script/check` et vérifier manuellement le formulaire sur mobile et desktop.

Le backend reste responsable de la validation cryptographique du payload. Ne jamais désactiver ALTCHA uniquement pour contourner une erreur de formulaire en production.
