# Étude de l'accueil : du tableau de bord au centre de contrôle (10 octobre 2026)

Demande de Rayan (10 octobre, 5 h 26, dicté) : « transformer cet espace en un centre de contrôle de notre vie,
hyper connecté, ayant l'impression d'être dans un film de science-fiction, en supprimant ce fond noir fade seul ;
là je vois une page chargée de fonctions, l'une après l'autre, on a bien commencé mais on n'y est pas encore. »

Audit mené par un agent indépendant (il n'avait pas construit l'écran), contre `VISION.md`, `CHARTE-DESIGN.md`,
`MOTS-ARC.md`, les captures réelles de l'accueil (iPhone 390 et Mac 1440) et le code de l'écran d'entrée.

## 1. Diagnostic

L'accueil est propre, lisible, conforme à la charte. Mais c'est une colonne de cartes grises de même poids, empilées
sur un noir uni, sans rien qui vive. Causes précises :

1. **Rythme vertical plat** : sept blocs ont le même verre, le même filet, le même arrondi, le même gris. Rien ne dit
   lequel compte. L'œil lit une liste de fonctions.
2. **L'horizon est un décor** : il s'allume une fois à l'arrivée puis ne bouge plus. Sur l'entrée, il porte une comète,
   un reflet, une réponse au bouton. Ici, il est coupé de l'état.
3. **Aucun signal vivant** : la seule donnée qui respire est « 1 pensée ». Pas d'heure de l'étape, pas de « fait
   aujourd'hui », pas de dernière activité par projet. L'état de synchronisation est un point vert minuscule.
4. **Le fond est un aplat** : `#070709` uniforme, sans profondeur, sans grain (l'entrée en a un), sans lueur.
5. **Les cartes se ressemblent trop** : la prochaine étape (le but) et « Juridique » (une porte) sont dessinées avec
   le même composant. Le but n'est pas isolé.

## 2. Trois principes d'un centre de contrôle crédible

- **Un horizon, un sol.** Une ligne de référence sur laquelle tout se pose ; la lumière vient d'elle.
  Interdit : des lueurs au hasard, un halo derrière chaque carte, plusieurs horizons.
- **Chaque lumière dit un fait.** Ce qui brille a une donnée derrière : une étape faite, une pensée en vol, une
  synchronisation en cours. Interdit : un pouls « pour faire connecté », une comète en boucle sans cause, un chiffre
  inventé ou arrondi.
- **Le vivant devant, le dormant derrière.** Ce qui a bougé aujourd'hui est net et en avant ; ce qui n'a pas bougé
  depuis des jours recule (plus sombre, plus petit, replié), sans jamais passer sous 4,5 : 1.
  Interdit : le même relief pour un projet endormi et pour l'étape du jour.

## 3. La direction : « le sol et le ciel »

**Le fond**, trois couches, aucun mode de fusion :
- *Le ciel* : le noir d'ARC, traversé en haut d'une lueur très basse à la couleur de l'espace de la prochaine étape
  (orange pour ARYAN, bleu pour un projet né d'une pensée). C'est un fait : « ce que tu dois faire maintenant est là ».
- *Le grain* : celui de l'entrée, noir, discret. Il casse l'aplat sans toucher le contraste.
- *Le sol* : l'horizon d'ARC devient le sol de la page : un second arc, plus plat et presque éteint, reste visible
  derrière les sections suivantes. Tout ce qui est en dessous se lit « sous l'horizon ».

**Zone par zone, iPhone 390 × 844 :**
1. Barre du haut : logo, recherche, menu. L'état de synchronisation devient un mot vrai (« À jour 05:26 »,
   « Envoi… », « Hors ligne ») ; pendant un échange, un trait de lumière parcourt le haut de l'écran. Rien si rien ne bouge.
2. Le haut : date, ville, titre inchangés. Dessous, une ligne de faits vrais : « 2 étapes faites aujourd'hui ·
   1 pensée déposée ». Zéro = ligne absente, jamais « 0 ».
3. L'horizon répond : « C'est fait » lance la comète une fois le long de l'arc, puis la carte suivante monte ; une
   pensée déposée envoie un point de lumière de la barre du bas vers l'horizon ; un rangement reçu éclaire l'horizon
   une seconde à la couleur de l'espace. Jamais en boucle.
4. Prochaine étape : la seule carte posée *sur* l'horizon, filet à la couleur de l'espace ; elle gagne une ligne, le
   moment (« Ce soir · 20:00 ») ou « Sans moment ». « C'est fait » blanc, seule touche blanche de l'écran.
5. Ensuite : trois lignes au plus, puis « Et N de plus », verre plus sombre, sans filet clair (sous l'horizon).
6. Déposé · Point du jour : gardées ; « Point du jour » dit un état vrai (« Vu à 08:12 » / « Prêt à 08 h 00 »).
7. Projets : chaque ligne gagne la dernière activité (« hier », « il y a 12 j ») ; au-delà de 7 jours sans
   mouvement, la ligne recule (plus petite, moins de relief, texte toujours ≥ 4,5 : 1). Endormis : repliés.
8. Ma vie : les deux tuiles, avec une seconde ligne vraie quand elle existe.
9. Barre de dépôt : inchangée ; filet lumineux quand on y tape (réponse, pas décor).

Hauteur remplie : environ 1 150 px, pas plus qu'aujourd'hui. Disparaissent : le point vert sans mot, le bouton « ARC »
comme état, la bulle « Rangé dans ARYAN · Voir » posée sur les projets (remplacée par l'éclair de l'horizon et la ligne
dans Déposé). Mac : même ordre, deux colonnes sous l'horizon.

## 4. Ce qu'il ne faut pas faire

- Une lueur par carte, des halos partout : un seul horizon, une seule source de lumière.
- Une boucle : ici la comète ne part que sur un fait.
- Des chiffres de remplissage, un pouls, un radar, une grille hexagonale : c'est du jeu vidéo.
- Assombrir un projet inactif sous 4,5 : 1 : on réduit la taille et le relief, pas la lisibilité.
- `mix-blend-mode`, flou sur du texte, chasse fixe en capitales.
- Remettre les compteurs sortis le 8 octobre sous prétexte de « signaux ».

## 5. Questions à Rayan (et la réponse supposée s'il ne tranche pas)

1. Un projet sans activité depuis 7 jours peut-il reculer visuellement ? (Oui : un fait, pas un reproche.)
2. La ligne « N étapes faites aujourd'hui », absente les jours à zéro : la veux-tu ? (Oui.)
3. La bulle « Rangé dans ARYAN · Voir » remplacée par l'éclair de l'horizon et la ligne dans Déposé ? (Oui.)
4. L'état de synchronisation en mot et heure à côté de la date, ou caché jusqu'au problème ? (Visible.)
5. La teinte du ciel suit l'espace de la prochaine étape : acceptable que l'accueil change de couleur ? (Oui.)

## 6. Chantier en quatre étapes, chacune testable

1. **Le fond** : ciel teinté, grain, sol sous l'horizon. Mesure : contraste ≥ 4,5 : 1 sur douze largeurs, part de
   noir franc gardée, aucune fusion.
2. **La hiérarchie** : carte du but sur l'horizon, Ensuite et Projets plus sombres, projet inactif en retrait.
   Mesure : une seule touche blanche, hauteur ≤ 1 200 px, « C'est fait » dans le premier écran.
3. **Les signaux vrais** : moment, faits du jour, dernière activité, synchronisation en mot, Point du jour vu.
   Mesure : chaque chiffre comparé à l'état dans le test ; zéro = absent.
4. **L'horizon qui répond** : comète sur « C'est fait », point de lumière au dépôt, éclair au rangement, trait de
   synchronisation. Mesure : image par image, rien sans événement, rien si l'appareil demande moins d'animations.

Validation par Rayan sur iPhone après l'étape 2, avant les étapes 3 et 4.
