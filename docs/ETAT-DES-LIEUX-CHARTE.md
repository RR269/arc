# État des lieux d'ARC au regard de la charte (6 octobre 2026)

Mesuré sur le site tel qu'il est en ligne (`main`, commit `09b9196`), dans un navigateur, en iPhone 390 × 844,
375 × 812 et Mac 1440 × 900, avec une pensée rangée d'exemple. Rien n'a été modifié. Méthode : parcours de chaque
écran visible, contraste calculé selon WCAG (texte normal ≥ 4,5 : 1, grand texte ≥ 3 : 1), cibles mesurées en
pixels, tailles de police lues dans le navigateur. Les chiffres sont des ordres de grandeur fiables, pas des
vérités au pixel : un même texte peut être compté deux fois s'il est imbriqué.

## 1. À quoi sert ARC, pour qui

ARC est l'endroit où Rayan dépose, par la voix ou le texte, tout ce qu'il porte dans la tête : projets, idées,
démarches, santé. L'IA range chaque pensée dans le bon espace, en tire une prochaine étape et un moment, et le
point du matin lui remet chaque jour ce qui l'attend. Aujourd'hui c'est pour Rayan seul ; demain pour toute
personne qui veut vider sa tête sans rien perdre.

## 2. Les écrans et les fonctions

| Écran | Ce qu'il contient |
|---|---|
| Entrée | Adresse e-mail, code à 6 chiffres, « Continuer sans connexion », premier appareil |
| Accueil (`#S1`) | Titre, Déposé, Point du jour, 4 compteurs, progression globale, Prochaines étapes, 5 mondes, 2 pôles, ajout rapide de tâche, veille et sources |
| Monde (`#S2`, ×5) | Cap, tâches à faire et faites, bloquants, notes, journal, outils (Pomodoro, cockpit), panneau Claude |
| Santé (`#S3`) | Check-in du jour (curseurs), score, série, habitudes, objectifs, journal, Claude |
| Juridique (`#S4`) | Sections (structure, contrats, échéances…), recherche, notes, aides, Claude |
| Déposé | Liste des pensées, rangement par l'IA, corrections, annulées |
| Point du matin | Aujourd'hui, à replacer, sans moment, à ranger |
| Barre de dépôt | Champ fixe en bas, bouton Déposer |
| Transverses | Recherche (K), War Room, menu « ··· » (importer, exporter, connexion, point du matin) |

## 3. Écran par écran, mesuré en iPhone 390

| Écran | Textes | Contraste < 4,5 | Cibles < 44 px | Texte < 12 px | Champs < 16 px | Emoji | Polices | Tailles de police |
|---|---|---|---|---|---|---|---|---|
| Accueil | 131 | **65** | 10 | **83** | 1 | **29** | 4 | 14 |
| Monde ARYAN | 107 | **75** | **29** | 44 | 4 | 23 | 2 | 11 |
| Santé | 87 | **56** | 19 | 47 | **7** | 11 | 2 | 12 |
| Juridique | 32 | 17 | 5 | 12 | 2 | 8 | 2 | 7 |
| Déposé | 14 | 1 | 0 | 0 | 0 | 0 | 2 | 5 |
| Point du matin | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 6 |
| Barre de dépôt | 3 | 0 | 1 | 0 | 0 | 0 | 2 | 2 |

Lecture : les trois écrans construits en octobre (Déposé, point du matin, barre de dépôt) respectent presque
tout. Les quatre écrans d'avril (accueil, mondes, Santé, Juridique) contredisent la charte sur presque chaque
règle.

### Accueil
- Respecte : un seul fichier, pas de débordement, barre de dépôt qui ne cache rien, bloc « Prochaines étapes » lisible.
- Contredit : 4 polices chargées (règle 4 : police système) ; 14 tailles de police (règle 4 : échelle courte) ; 29 emoji
  (règle 3) ; 83 textes sous 12 px dont « ARC » à 9 px et « Recherche » à 11 px ; 65 contrastes insuffisants (« War
  Room » 1 : 1, date 2,1 : 1, « Valence · mardi » 2,3 : 1) ; cibles de 28 px (« ··· », Recherche) ; l'écran n'a pas UN
  but (règle 2) : titre, compteurs, progression, étapes, mondes, pôles, ajout rapide, veille se battent.
- États manquants : chargement (rien, l'écran saute quand les compteurs s'animent), hors connexion (un point rouge
  seulement), erreur.

### Mondes (ARYAN mesuré, les autres identiques)
- Respecte : la couleur du monde porte une identité ; les tâches cochables.
- Contredit : 29 cibles sous 44 px (★ 18 px, ✕ 22 px, « + Ajouter » 38 px) ; 4 champs à 13 px (l'iPhone zoome) ;
  75 contrastes insuffisants (étiquettes à 9 px à 1 : 1 ou 1,8 : 1) ; 23 emoji ; panneau Claude qui prend la moitié
  de l'écran ; aucun bouton principal.
- États manquants : vide (un monde sans tâche n'explique rien), chargement de Claude (trois points, pas d'erreur
  claire quand le proxy refuse), hors connexion.

### Santé
- Contredit : 7 champs sous 16 px, curseurs de 6 px de haut (injouables au pouce), score « -- » à 2,3 : 1, 56
  contrastes insuffisants ; le contenu même contredit la vision (curseurs, score, série) : la charte dit « une
  fonction n'existe que si elle sert vraiment ».
- États manquants : vide, erreur, hors connexion.

### Juridique
- Le moins chargé des quatre, mais mêmes défauts de base : champs à 13 px, contrastes (« 0 element total » 1 : 1),
  cibles de 26 px (Export, Aides), 8 emoji.

### Déposé, point du matin, barre de dépôt
- Respectent : police système, cibles 44 px, textes ≥ 12 px, champs ≥ 16 px, aucun emoji, états vides écrits.
- Contredit : « Envoyée » en vert sur fond vert pâle à 1,2 : 1 (règle 3) ; « Voir » à 32 px dans la note de la
  barre ; fond noir pur (règle 3 : le sombre doit être soigné, pas une inversion ; règle 4 : encre presque noire).

## 4. Incohérences entre écrans
- Deux écritures : les écrans d'avril en Plus Jakarta Sans + JetBrains Mono, ceux d'octobre en police système.
- 54 couleurs écrites en dur dans les règles de style, 194 occurrences : aucune palette partagée (règle 3).
- 24 tailles de police différentes dans le fichier (règle 4 : cinq).
- Trois dessins de bouton principal (blanc plein, couleur du monde, contour), deux dessins de carte, deux styles
  d'étiquette (capitales mono 9 px, et texte 13 px).
- 11 `!important` : des règles qui se battent.
- Les mots : « tâche », « étape », « action » pour la même chose ; « Valider » et « OK » existent encore.

## 5. Défauts mesurés, en bref (iPhone 390, écrans d'avril)
- Contrastes insuffisants : environ 210 textes.
- Cibles sous 44 px : environ 60.
- Textes sous 12 px : environ 185 (dont des 8 et 9 px).
- Champs sous 16 px : 14 (l'iPhone zoome à chaque saisie).
- Emoji dans l'interface : 58 dans le fichier, 30 différents.
- Débordement horizontal : aucun. Erreurs de console : aucune.

## 6. Classement et ordre proposé

Du plus gênant au moins gênant :
1. Les écrans d'avril ne sont pas lisibles au pouce (cibles, champs, contrastes) : c'est de l'utilisabilité, pas du goût.
2. Deux écritures et aucune palette partagée : impossible de corriger proprement sans d'abord poser la palette et
   l'échelle de tailles en variables.
3. L'accueil n'a pas un seul but.
4. Santé et Juridique montrent des fonctions qui ne servent pas (curseurs, score) au lieu de la mémoire et des échéances.
5. Le sombre est un noir pur, non soigné.

Ordre proposé, un écran poussé jusqu'au bout avant le suivant :
1. **Le socle** (sans écran) : la palette en variables (une couleur principale déclinée en pâle, un accent, erreur
   sobre), l'échelle de cinq tailles, les composants (un bouton principal, une carte, un champ, une étiquette), et
   les contrôles automatiques (contraste, cibles, champs, emoji, couleurs interdites) dans les tests.
2. **L'accueil**, écran modèle : un but (ce que je fais maintenant), tout le reste en dessous ou dans un menu.
3. **Déposé et la barre de dépôt** (déjà proches, à aligner sur le socle).
4. **Le point du matin**.
5. **Un monde** (ARYAN), puis les quatre autres par le même modèle.
6. **Santé** puis **Juridique**, avec la question de contenu à décider avec Rayan avant (règle 13).
7. **L'écran d'entrée**.

## Décisions qui attendent Rayan avant de dessiner (règle 13)
- La couleur principale d'ARC (une seule) et son accent. Proposition à suivre si Rayan ne tranche pas.
- Mode clair seul, ou clair et sombre ? La charte accepte les deux, à condition que le sombre soit soigné.
- Santé et Juridique : garder les curseurs et le score, ou passer à la mémoire et aux échéances (vision du 5 octobre) ?
- Les mots : « étape » partout pour ce qu'il y a à faire ?
