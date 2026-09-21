# Propositions d’amélioration du site jboudoux.fr

## Synthèse

Le site possède déjà un socle technique solide : architecture statique légère, bonnes performances, SEO structuré, accessibilité prise en compte et couverture automatisée importante.

Le principal potentiel d’amélioration est commercial. Le site présente clairement les expertises proposées, mais pourrait mieux démontrer les résultats obtenus, aider les visiteurs à reconnaître rapidement leur situation et renforcer la confiance avant la prise de contact.

Le **Diagnostic IA reste volontairement le CTA principal du site**. Il constitue l’offre d’entrée mise en avant et doit rester prioritaire dans le hero, la navigation et les principales sections de conversion. La réservation d’un échange de 20 minutes demeure une alternative pour les visiteurs dont le besoin est déjà bien défini ou ne concerne pas directement l’IA.

## 1. Ajouter des preuves concrètes

Il s’agit du levier de confiance le plus important.

Créer trois premières études de cas courtes, éventuellement anonymisées, présentant systématiquement :

- le problème initial ;
- le contexte et les contraintes ;
- l’intervention réalisée ;
- le résultat obtenu ou l’amélioration observée ;
- la durée de l’intervention ;
- un ordre de grandeur budgétaire lorsque cela est possible.

Les cas pourraient illustrer trois dimensions différentes de l’offre :

1. adoption, automatisation ou architecture IA ;
2. reprise d’une application ou fiabilisation d’un système Data ;
3. pilotage Tech, Data ou IA à temps partagé.

Le chiffre « 600+ collaborateurs sensibilisés à l’IA » pourrait apparaître plus tôt sur l’accueil. Il gagnerait à être accompagné de témoignages, de références autorisées ou d’éléments de contexte vérifiables.

## 2. Préciser la promesse de l’accueil

Le titre actuel — « Des problèmes Tech, Data ou IA à résoudre ? » — est accessible, mais reste très général.

Une formulation plus différenciante pourrait être :

> **Je transforme vos problèmes IA, Data et logiciels en systèmes utiles, maîtrisés et maintenables.**

Avec, par exemple, le texte d’introduction suivant :

> Cadrage, réalisation, reprise d’applications et direction Tech / IA à temps partagé pour les entreprises qui ont besoin d’avancer sans empiler les outils.

Cette proposition devra être testée avec le positionnement et la clientèle réellement recherchés. Une version encore plus précise pourrait mentionner explicitement le type d’entreprise ciblé si celui-ci est suffisamment défini.

### Hiérarchie des CTA à conserver

Le **Diagnostic IA reste le CTA principal**, conformément à l’objectif commercial du site.

- CTA principal : **Faire mon diagnostic IA** ;
- CTA secondaire : **Réserver un échange de 20 min** ;
- lien tertiaire : **Découvrir mes expertises**.

Cette hiérarchie doit rester cohérente dans le hero, le header et les blocs de conversion. Le Diagnostic doit être présenté comme la meilleure porte d’entrée pour une entreprise qui s’interroge sur ses usages, ses priorités, ses risques ou ses possibilités d’automatisation.

La réservation directe reste visible pour les visiteurs qui connaissent déjà leur besoin, ainsi que pour les demandes Data, Software ou de direction à temps partagé.

## 3. Clarifier les parcours sans diluer le Diagnostic IA

La navigation propose de nombreuses destinations. Elle pourrait être simplifiée tout en maintenant le Diagnostic IA comme action dominante.

Navigation principale proposée :

- Expertises ;
- Formations ;
- Tarifs ;
- À propos ;
- Contact ;
- CTA distinctif : **Faire le diagnostic IA**.

La section « Approche » resterait accessible depuis l’accueil. Le temps partagé pourrait devenir une entrée importante de la page Expertises plutôt qu’un élément de navigation de premier niveau.

Sur l’accueil, trois parcours pourraient aider les visiteurs à reconnaître rapidement leur situation :

- **Lancer, structurer ou sécuriser un projet IA** → Diagnostic IA ;
- **Reprendre une application, une automatisation ou des données fragiles** → Expertises ;
- **Piloter la Tech et l’IA dans la durée** → Temps partagé.

Le premier parcours doit rester visuellement prioritaire.

## 4. Rendre les tarifs plus faciles à parcourir

La transparence tarifaire constitue un point fort du site. La page détaillée est néanmoins longue et gagnerait à proposer une lecture synthétique dès le début.

Exemple de tableau d’orientation :

| Besoin | Format | Budget initial | Livrable principal |
|---|---|---:|---|
| Décider | Revue experte | 390 € HT | Avis et recommandation |
| Clarifier | Cadrage ciblé | 900 € HT | Options et prochaine étape |
| Construire | Réalisation | Dès 1 500 € HT | Solution fonctionnelle |
| Investiguer | Audit | Dès 2 500 € HT | Diagnostic et roadmap |
| Piloter | Temps partagé | Dès 900 € HT / mois | Décisions et continuité |

Les descriptions détaillées resteraient présentes sous cette synthèse. Le tableau ne remplace pas les explications : il aide simplement le visiteur à identifier le format qui lui correspond.

Un encart peut également rappeler que le Diagnostic IA est offert et constitue le point de départ recommandé lorsqu’une entreprise ne sait pas encore quel format choisir.

## 5. Renforcer la dimension humaine et visuelle

Le design est cohérent, mais repose sur de nombreuses cartes visuellement proches. Il serait possible de renforcer la hiérarchie et la crédibilité avec :

- un portrait professionnel placé plus tôt dans le parcours ;
- un exemple de livrable, de schéma d’architecture ou de dashboard ;
- quelques résultats chiffrés mis en avant ;
- moins de séries de cartes uniformes ;
- davantage de variations de rythme entre les sections.

Des éléments issus de missions réelles, même anonymisés, apporteraient davantage de confiance que de nouvelles illustrations purement décoratives.

## 6. Améliorer la mesure des conversions

Le suivi des clics de réservation contient actuellement plusieurs angles morts. Certains emplacements utilisés dans les pages ne figurent pas dans la liste autorisée par `assets/js/site-core.mjs`.

Les emplacements à vérifier comprennent notamment :

- `contact` ;
- `training` ;
- `grand-ouest` ;
- `diagnostic_confirmation` ;
- `ai_local_prototype` ;
- `private_ai_portal_final`.

Le suivi devrait couvrir au minimum :

- le clic sur « Faire mon diagnostic IA » depuis les principaux emplacements ;
- le démarrage du questionnaire ;
- la progression dans les étapes, sans transmettre les réponses ;
- l’envoi réussi du Diagnostic ;
- le clic sur une réservation, avec l’emplacement d’origine ;
- le clic sur l’adresse email ;
- les passages entre accueil, expertise, tarifs et réservation.

Les événements ne doivent contenir aucune réponse au questionnaire ni donnée de contact.

Un tableau de bord simple pourrait suivre chaque mois :

- visiteurs uniques ;
- taux de démarrage du Diagnostic ;
- taux d’envoi du Diagnostic ;
- clics de réservation ;
- pages d’entrée générant les meilleures conversions.

## 7. Finitions techniques

Les améliorations techniques restantes sont secondaires par rapport au contenu et à la conversion :

- utiliser l’image JPEG optimisée de 176 Ko dans les données structurées à la place du PNG d’environ 2 Mo ;
- ne plus publier les fichiers graphiques lourds qui ne sont pas nécessaires au site ;
- supprimer l’avertissement `faraday-retry` affiché pendant le build après vérification de sa compatibilité avec GitHub Pages ;
- compléter les tests automatisés par quelques tests manuels sur mobile, au clavier et avec un lecteur d’écran ;
- utiliser Search Console et Umami avant de décider de créer de nouvelles pages SEO.

Il n’est pas nécessaire de changer de framework, d’ajouter un bundler, de charger une police web ou d’introduire des animations lourdes. Le socle Jekyll actuel est adapté au besoin.

## Feuille de route proposée

### Lot 1 — Mesure et finitions rapides

- corriger la liste des emplacements de réservation suivis ;
- vérifier le suivi des CTA du Diagnostic IA ;
- suivre les clics email ;
- remplacer ou exclure les images PNG lourdes inutiles ;
- corriger l’avertissement du build.

### Lot 2 — Accueil et parcours

- préciser la promesse principale ;
- maintenir « Faire mon diagnostic IA » comme CTA dominant ;
- clarifier les trois principaux parcours visiteurs ;
- simplifier la navigation ;
- faire apparaître plus tôt les éléments de confiance.

### Lot 3 — Preuves

- produire trois études de cas ;
- ajouter des résultats chiffrés ;
- intégrer des témoignages ou références autorisées ;
- montrer un ou deux exemples de livrables anonymisés.

### Lot 4 — Tarifs et optimisation continue

- ajouter le tableau d’orientation des offres ;
- rappeler le rôle du Diagnostic IA comme porte d’entrée offerte ;
- analyser les parcours dans Umami ;
- comparer les conversions avant et après les changements ;
- ajuster les textes et CTA à partir des données observées.

## Priorité recommandée

L’ordre d’exécution recommandé est le suivant :

1. corriger le suivi des conversions et les images lourdes ;
2. préciser la promesse d’accueil en conservant le Diagnostic IA comme CTA principal ;
3. publier trois études de cas ;
4. simplifier la navigation et les parcours ;
5. ajouter la synthèse des tarifs ;
6. mesurer les résultats pendant plusieurs semaines avant d’engager d’autres changements importants.
