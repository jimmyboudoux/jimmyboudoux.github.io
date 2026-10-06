# Recentrage du site — 6 octobre 2026

## Audit initial

Site statique Jekyll, pages HTML/Liquid, styles Sass, modules JavaScript natifs. Les prix sont dans `_data/pricing.yml` et `_data/formations.yml`, les durées partagées dans `_data/engagement.yml`. Le sitemap est généré depuis les pages et collections. Les composants Hero, Card, Badge, CTA, Grid et le schéma de méthode existaient déjà.

L’inventaire des routes, titles, descriptions, H1, canonical et statuts d’indexation avant modification est conservé dans `seo-before-repositioning-2026-10-06.json`. Avant intervention, `./script/check` réussissait : 22 pages publiques, aucune référence interne manquante.

## Changements et composants

- Identité et signature : `_config.yml`.
- Navigation principale et footer : `_data/navigation.yml`, `_includes/header.html`, `_includes/footer.html`.
- Trois piliers partagés entre accueil et Services : `_data/interventions.yml`, nouvel include `_includes/intervention-cards.html`. Le catalogue des expertises `_data/services.yml` reste en place.
- Accueil : `index.html`, réutilisation des cartes, badges, CTA et styles existants.
- Méthode : extension de `_includes/engineering-map.html` à cinq étapes ordonnées, adaptées au mobile.
- Services : `services/index.html`, liens spécialisés regroupés par intervention, formation et temps partagé dans Accompagner.
- À propos, Contact, Tarifs et pages locales harmonisés ; CTA de réservation unifiés par l’include existant.
- Paramètres : fréquence du pilotage léger dans `_data/pricing.yml`, délai d’accès aux formations dans `_data/engagement.yml`. Montants, prix de départ, durées, coordonnées et liens de réservation continuent de lire les sources communes.
- README et contrôles existants adaptés à la nouvelle structure ; tests de propagation des paramètres étendus.

## URLs et référencement

Les 22 URLs publiques existantes sont conservées, dont AI Engineering, AI FinOps, Data / Reporting, Software Rescue, formations, temps partagé, IA privée, Sandbox, Tarifs, Poitiers et Grand Ouest. Aucune redirection n’est nécessaire. Les métadonnées des pages d’expertise restent spécialisées ; l’identité globale et les pages locales utilisent le nouveau positionnement.

## Portfolio reporté à la demande de l’utilisateur

Le portfolio constitue un projet ultérieur. `/realisations/` affiche un état « En construction », avec un gabarit pour annoncer les futures dimensions des cas : contexte, objectif, approche, réalisation, résultat, rôle et technologies. Aucun cas client ou projet provisoire n’a été ajouté.

La structure de la page, du bloc d’accueil et des liens est prête, mais leur affichage est désactivé par `portfolio_enabled: false` dans `_config.yml` (navigation, footer, accueil et Services). La page reste accessible par son URL directe. `noindex: true` et `sitemap: false` évitent d’indexer ce contenu temporaire. Lors de la publication des vrais cas, remplacer les contenus provisoires, activer `portfolio_enabled` et retirer les deux drapeaux ; le sitemap les découvrira automatiquement. Le test de cet état provisoire devra évoluer au même moment.

## Vérification des exigences

| Exigence | Preuve |
|---|---|
| Charte et composants conservés | Palette, polices, assets et JavaScript inchangés ; extensions limitées aux cartes de méthode et à l’adaptation du header |
| Identité, promesse, trois piliers et méthode | Contrôles du HTML généré dans `test/site_test.rb` |
| Technologies secondaires, IA locale, offre avec ou sans IA | Accueil et Services ; liens vers les pages spécialisées contrôlés |
| Diagnostic secondaire, formation et temps partagé accessibles | Absence de promotion Diagnostic dans le contenu principal de l’accueil ; accès via adoption IA et footer ; section Accompagner |
| Modes d’intervention et paramètres commerciaux | Trois modes sur l’accueil ; montants depuis les includes tarifaires ; reconstruction isolée avec tarifs, fréquence et délais modifiés |
| SEO et URLs | Sitemap, métadonnées, H1, canonical, liens, assets et ancres contrôlés sur le site généré et avec `/preview` |
| Responsive et accessibilité | Contrôle Chrome des pages sur sept largeurs, menu mobile, focus et mouvement réduit ; revue des captures |
| Performance | Aucun module ni image supplémentaire ; budgets des assets contrôlés par les tests existants |
| Compilation, formatage et tests | `./script/check` |

Les chiffres de Core Web Vitals en production ne peuvent pas être déduits d’une revue locale ; aucun changement de dépendance, JavaScript ou image n’a été introduit. La revue porte sur le site généré, sans envoi du diagnostic au backend privé ni déploiement.

## Résultats finaux

- `./script/check` : 30 tests Ruby (2 869 assertions) et 16 tests JavaScript, sans erreur ; formatage et syntaxe valides. Le message Bundler concernant `faraday-retry` existait déjà avant intervention.
- Chrome : 25 pages HTML à 320, 390, 760, 900, 901, 1 024 et 1 440 px ; aucun débordement horizontal. Ouverture/fermeture du menu mobile, focus du CTA, mouvement réduit et proportions du portrait vérifiés. Résumé conservé dans `responsive-repositionnement-2026-10-06.json`. Captures de l’accueil mobile/desktop, Services, À propos, Tarifs et Réalisations revues.
- Les 24 routes HTML générées avant intervention existent toujours ; `/realisations/` est la seule nouvelle page. Le sitemap conserve ses 22 pages publiques.
- CSS : 58 136 → 59 416 octets, sous le budget existant. JavaScript et images identiques en taille.
- L’accueil contient 542 mots dans le contenu principal ; le positionnement et les trois interventions précèdent les termes techniques.
- Revue visuelle : hauteur du portrait corrigée pour conserver ses proportions ; l’accompagnement secondaire reste sous les trois modes d’intervention.

## Masquage temporaire du portfolio

À la demande de l’utilisateur, l’entrée Réalisations et le bloc portfolio de l’accueil sont masqués. Le lien depuis Services et celui du footer suivent le même paramètre pour éviter de promouvoir une page provisoire. Le gabarit et les blocs sont conservés ; la procédure de publication et de réactivation est dans le README, section « Préparer le portfolio ». Les captures et chiffres de revue ci-dessus décrivent l’état avant ce masquage.
