# Étude de la carte : la planète de l'accueil et la carte plein écran (11 octobre 2026)

Demande de Rayan (11 octobre, soir, sur son iPhone) : « au téléphone ça se marche dessus, pas compréhensible » ;
« les mondes sont mal travaillés, l'agencement mal fait » ; « une étude, un audit pour voir ce qui devrait se faire
ou pas, du moins si c'est nécessaire pour avoir le meilleur résultat ».

Audit mené par un agent qui n'a pas construit l'écran, contre `VISION.md`, `CHARTE-DESIGN.md`, `ETUDE-ACCUEIL.md`,
le module « LA PLANÈTE ET LA CARTE » d'`index.html` et neuf rendus de la version actuelle (Chromium, données
d'essai : iPhone 390 × 844, petit iPhone 375 × 667, Mac 1440 × 900 ; accueil, carte, carte rapprochée avec fiche).
Les mesures en px sont des px CSS (rendus à ×3 divisés par 3).

## 1. Verdict

- **La bande de planète de l'accueil n'apporte rien : la retirer.** Elle redit en petit, et moins lisiblement, la
  liste « Projets » qui suit 200 px plus bas, et elle pousse le poste sous la barre de dépôt sur un petit iPhone.
  L'horizon reste ; une porte « Voir la carte » vit dans l'en-tête de « Projets ».
- **La carte plein écran se garde, mais se règle en profondeur** : la vue d'ensemble est presque juste ; la vue
  rapprochée est un brouhaha et doit être refaite. On ne lit plus les mots des points sur la carte : on touche un
  espace, la carte se centre sur lui et un panneau dit, en liste, ce que sont ses points.
- Trois signes visuels au lieu de six (à faire, fait, à ranger). Le reste se dit en mots, dans le panneau.

## 2. Diagnostic

### 2.1 L'accueil (bande `#h-orbite`, canevas `#h-planete`)

1. **Doublon.** La bande montre ATLAS, ARYAN, Santé, Juridique ; 200 px plus bas, « Projets » montre ATLAS et ARYAN
   avec leur état et leur pourcentage, puis « Ma vie » montre Santé et Juridique. Même information, deux fois, dont
   une illisible. Charte, règle 2 : « ce qui ne sert pas ce but sort de l'écran ».
2. **Elle coûte le premier écran.** Hauteur de la bande : 204 px (`#S1 .h-orbite{height:204px}`). À 375 × 667, la
   ligne « 1 pensée à ranger » du poste tombe à y ≈ 610, sous le haut de la barre de dépôt (y ≈ 597) : on la voit
   à travers la barre, on ne peut pas la toucher sans défiler. Le poste, but de l'écran, est coupé par un décor.
3. **Elle se marche dessus.** À 375, le nom « Juridique » (bas à y ≈ 367) touche la puce « Carte » (haut à
   y ≈ 367). « ARYAN » est posé sur la ligne pointillée du sol. Les noms font 12 px (`taille = … : 12` dans
   `plDessiner`), en canevas : pas de taille de texte réglable, pas de lecteur d'écran.
4. **Les points y sont muets.** À cette échelle, une pensée, une tâche faite et une entrée de journal font 2 à 3 px
   et se confondent. Les trois endormis sont des pastilles grises sans nom (`if(!V.carte && e.dort) return;`).
   Quelqu'un qui n'a pas lu la légende (elle n'est que sur la carte) voit des « grappes » sans sens.
5. **Geste ambigu.** Toucher une région ouvre l'espace, toucher à côté ouvre la carte, deux doigts ouvrent la
   carte (`plGestesBande`). Les cibles des régions ne sont pas visibles ; on ouvre une chose en voulant l'autre.

### 2.2 La carte, vue d'ensemble (`carteOuvrir`, `plDisposer`)

C'est la partie la plus aboutie : trois rangées nommées (Endormis, En cours, Ma vie), rien ne se croise sur les
noms à 390. Restent :

1. **En-tête de trois lignes** (`carteFaits`) : « 1 pensée en orbite, à ranger · 4 espaces ont des choses à faire ·
   FBA dort, lié à ATLAS », à 17 px, sur 3 lignes à 390 et à 375. Trois faits de nature différente, aucun ne se
   touche. Le seul qui appelle un geste (ranger) est noyé.
2. **Des traits passent sur les mots.** À 375, l'arc pointillé du haut de « Ma vie » traverse « 2 à faire · 8 faits »
   d'ATLAS (y ≈ 363). Le pont FBA → ATLAS traverse « FBA Endormi » (390 et 375). Cause : `libre()` ne compare une
   étiquette qu'aux autres étiquettes (`poses`), jamais aux traits (bord de rangée, ponts, fils).
3. **« Endormi » écrit trois fois** sous FBA, KITCHEN, TELENEUF, alors que la rangée s'appelle déjà « Endormis »
   (`plEtatLignes` renvoie `['Endormi']`). Du bruit pur.
4. **La légende ne correspond pas à ce qu'on voit.** Elle montre un rond blanc pour « Pensée », un petit rond gris
   pour « Tâche faite », un losange pour « Journal » ; sur la carte, tous les points sont à la couleur de l'espace
   et font 2 à 4 px : à cette taille un losange et un rond sont identiques. Cinq signes, aucun reconnaissable. Elle
   éduque au vocabulaire, pas à la lecture.
5. **Ce qui compte ne ressort pas.** ARYAN a 21 points de tâches faites (des tâches écrites dans le code en avril,
   `w.tasks_done` dans `plElements`) et 2 pensées à faire. Les 21 points de passé ont presque le même éclat que les
   2 qui attendent Rayan. L'œil compte des confettis ; il ne voit pas « 2 choses t'attendent ici ».
6. **Mac 1440** : tout le contenu tient dans une colonne de 500 px au centre ; les noms de rangées sont collés au
   bord gauche (x = 22), à 700 px de ce qu'ils nomment. Ils ne se rattachent à rien.

### 2.3 La carte rapprochée (pincer à ×1,8 et plus)

C'est ici que « ça se marche dessus ».

1. **Mots sur les points.** Dès `s >= 1.8`, chaque point écrit ses 28 premiers caractères à côté de lui, en 13 px
   avec une ombre (`plCourt(it.txt, 28)`). Sur 390, autour d'ARYAN : six libellés dans 110 px de haut, les points
   orange passent au milieu des lettres (« Tour 113 en production : mé… », « Métier de boutique obligato… »).
   `libre()` évite les rectangles de texte entre eux, pas les points ni les fils.
2. **Textes coupés à 28 caractères** : on lit des débuts de phrases (« Flux commande prouvé de bou… »), ce qui
   oblige à toucher pour comprendre. La carte ne dit rien qu'une liste ne dirait mieux.
3. **La fiche couvre l'espace qu'on regarde.** À 375, la fiche du point (`carteFiche`) recouvre le nom d'ARYAN et
   son état ; à 390, elle masque le libellé de rangée « Ma vie ». La carte ne se décale pas pour laisser la place.
4. **Des points sous l'en-tête.** En rapprochant, les points et fils de TELENEUF et KITCHEN passent derrière
   « Ta carte » et sa ligne de faits : le canevas n'est pas rogné sous l'en-tête (seules les étiquettes le sont,
   `haut = V.carte ? 100 : 0`).
5. **Geste caché.** Rien ne dit qu'il faut pincer pour voir les mots. Le seuil ×1,8 est invisible. Un geste
   secret n'est pas « intuitif » : c'est une charge.

### 2.4 La question des trois secondes

- **Accueil** : « à quoi sert la planète ? » Réponse honnête : à rien qu'on ne lise mieux juste dessous.
- **Carte d'ensemble** : « où en sont mes espaces, et où ça m'attend ? » Elle y répond presque, si on retire le
  bruit et qu'on fait ressortir les choses à faire.
- **Carte rapprochée** : « qu'y a-t-il dans ARYAN ? » Elle y répond mal : une liste groupée le dit en une seconde.
- **Le geste attendu** n'est écrit nulle part. Il doit être un seul : toucher un espace.

### 2.5 Lisibilité mesurée

- Corps de texte des étiquettes : 12 px (état), 13 px (rangées, mots des points), 15 px (noms). Sous l'échelle de
  la charte (corps 17 px) ; acceptable pour une mention, pas pour une information qu'on doit lire.
- Contraste des textes de la carte : bon (≥ 7 : 1, `#D1D1D6` et couleurs vives sur noir). Le problème n'est pas
  le contraste, c'est ce qui passe sous les lettres (points, fils, arcs).

## 3. Principes d'agencement

1. **Une chose, un seul endroit.** L'accueil liste, la carte situe. La carte ne refait pas une liste en petit,
   l'accueil ne refait pas une carte en petit.
2. **Sur la carte, des signes ; les mots dans un panneau.** Le canevas porte des noms d'espaces et des chiffres,
   jamais des phrases. Les phrases vivent dans du HTML (taille réglable, lecteur d'écran, aucun chevauchement).
3. **Ce qui t'attend brille, le passé est poussière.** Trois signes : à faire (point vif à la couleur de l'espace,
   avec lueur), fait (point minuscule et terne), à ranger (ambre, sur l'orbite). Tout le reste se dit en mots.
4. **Rien ne passe sur un mot.** Aucun point, fil, pont ni bord de rangée ne traverse une étiquette ; aucun point
   sous l'en-tête ni sous un panneau. Cela se mesure.
5. **Un geste, une réponse.** Toucher un espace le centre et ouvre son panneau ; toucher un point le désigne dans
   le panneau. Pincer et glisser restent libres, mais ne sont jamais nécessaires.

## 4. La direction : « la carte situe, le panneau dit »

### 4.1 L'accueil, à 390 × 844

- Barre du haut, date, titre, ligne de faits : inchangés.
- **L'horizon d'ARC reste** (`.h-horizon`, sa lueur, le ciel et le sol). **La bande de planète est retirée** :
  `#h-orbite`, le canevas `#h-planete`, `plGeoBande`, `plGestesBande` et le rendu de la bande dans `plImage`.
  Gain : environ 200 px. Le poste remonte directement sous l'horizon, comme le 10 octobre.
- Le poste (Déposé, Point du jour, dernière pensée, « N pensées à ranger ») : inchangé, entièrement visible dans le
  premier écran, y compris à 375 × 667.
- **« Projets »** : à droite du titre, à la place de « 2 en cours · 3 endormis », un lien « Carte › » de 44 px de
  haut (texte 15 px, `#EBEBF0`, chevron au trait). Le décompte passe sous le titre en mention (13 px). Les lignes
  de projet, les endormis et « Ma vie » : inchangés.
- Aucune touche blanche ajoutée.

### 4.2 La carte, vue d'ensemble, à 390 × 844

De haut en bas :

1. **En-tête** (fixe, verre sombre, 56 px) : « ‹ Accueil » à gauche, « Carte » au centre en 17 px demi-gras. Le
   canevas est rogné sous lui (rien ne passe derrière).
2. **Une ligne d'action, seulement si elle existe** : une puce ambre « 1 pensée à ranger › » (44 px, 15 px), qui
   ouvre « Déposé » sur la première. Les autres faits de `carteFaits` (« 4 espaces ont des choses à faire », « FBA
   dort, lié à ATLAS ») sont retirés de l'en-tête : la carte les montre déjà (lueurs, pont).
3. **L'orbite et l'horizon** : inchangés (points ambre = pensées à ranger).
4. **Endormis** : la rangée garde son titre ; sous chaque nom, plus de « Endormi ». Noms 13 px, `#C7C7CC`.
5. **En cours** : nom 17 px demi-gras à la couleur de l'espace ; dessous, une seule ligne 13 px : « 2 à faire » en
   blanc s'il y en a, sinon l'état (« Actif hier »). « 21 faits » sort de l'étiquette (il est dans le panneau).
   Autour du cœur : les choses à faire en points vifs (4 px, lueur), le passé en poussière (1,5 px, 35 %
   d'opacité). Une seule spirale, mais deux éclats.
6. **Ma vie** : sa bande teintée, mêmes règles ; l'arc du haut de la bande passe toujours sous les étiquettes
   d'« En cours » (la hauteur de rangée s'adapte, au lieu des 176 px fixes de `rang()`).
7. **Légende** (au-dessus de la barre de dépôt, 13 px) : trois entrées dessinées comme sur la carte : « À faire »
   (point vif à lueur), « Fait » (poussière), « À ranger » (ambre). Elle disparaît quand un panneau est ouvert.
8. Barre de dépôt : inchangée.

### 4.3 La carte, un espace touché, à 390 × 844

- Toucher un espace (ou son nom) : la carte glisse et se rapproche (300 ms, rien si mouvement réduit) pour placer
  l'espace dans le tiers haut de l'écran, au-dessus du panneau.
- **Le panneau** (verre sombre, monte du bas, 55 % de l'écran au plus, défile à l'intérieur) :
  - en tête : pastille de couleur, nom 22 px demi-gras, état en 15 px (« Actif aujourd'hui · 2 à faire ·
    21 faits ») ; à droite une croix de 44 px ;
  - **« Ouvrir ARYAN »**, la seule touche blanche de l'écran (50 px) ; pour un endormi, « Réveiller » blanche et
    « Ouvrir FBA » en verre ;
  - puis des groupes, chacun avec son titre 17 px et des lignes de 54 px (signe à gauche, mots sur deux lignes au
    plus en 17 px, « il y a 3 j » en 13 px) : **À faire** (pensées à faire, démarches à faire, rendez-vous à
    venir), **Pensées faites**, **Journal**, **Documents**, **Tâches faites** (repliée par défaut, « 21 »).
  - Toucher une ligne : le point correspondant s'allume sur la carte (anneau blanc) et la ligne s'ouvre là où la
    chose vit (pensée → « Déposé », journal → le projet, rendez-vous → Santé).
- Toucher un point sur la carte : le panneau s'ouvre (ou défile) sur sa ligne, surlignée. Plus de fiche séparée
  (`#carte-fiche` est remplacée par le panneau ; une pensée en orbite ouvre un panneau « À ranger » d'une ligne).
- **Plus aucun mot de point dessiné sur le canevas**, à aucune échelle (le bloc `if(V.carte && s >= 1.8)` part).
- Pincer et glisser restent : rapprocher montre les points plus gros et mieux séparés, rien d'autre.
- Mac : panneau à droite (380 px), la carte à gauche ; les titres de rangées se posent juste à gauche de la
  première case de la rangée, pas au bord de l'écran.

Ce panneau est, à l'identique, « la carte dans chaque monde » demandée plus tard : depuis l'écran d'un projet, on
ouvrira la carte déjà centrée sur lui, panneau ouvert.

## 5. Étapes de construction

Chaque étape est livrable seule, dans cet ordre ; la première d'abord.

1. **Retirer la bande de l'accueil.** Ce qui change : `#h-orbite`, `#h-planete` et leur code partent ; lien
   « Carte › » dans l'en-tête de « Projets » ; la carte garde tout. Vérification (`tests/accueil.mjs`,
   `tests/relier.mjs`) : aucun canevas dans `#S1` ; à 375 × 667 et 390 × 844, le bas de « N pensées à ranger » est
   au-dessus du haut de la barre de dépôt ; le lien fait ≥ 44 px et ouvre la carte ; hauteur de l'accueil réduite
   d'au moins 180 px ; contraste ≥ 4,5 : 1 ; contrôles de la planète sur l'accueil réécrits.
2. **Nettoyer la vue d'ensemble.** Ce qui change : en-tête d'une ligne, puce « à ranger » seule action ; plus de
   « Endormi » sous les endormis ; trois éclats (à faire, fait, à ranger) et légende de trois entrées ; canevas
   rogné sous l'en-tête ; `libre()` tient compte des traits (bord de rangée, ponts, fils) ; hauteur de rangée
   calculée. Vérification : la vue expose ses étiquettes et ses segments dessinés (`V.etiquettes`, `V.traits`) ;
   le test vérifie qu'aucun segment ne coupe une étiquette, à 360, 375, 390, 430 et 1440 px ; aucun point dessiné
   au-dessus du bas de l'en-tête ; l'éclat d'un point « à faire » est plus fort que celui d'un point « fait »
   (lecture des pixels) ; la légende a trois entrées.
3. **Le panneau d'un espace.** Ce qui change : toucher un espace centre la carte et ouvre le panneau ; le bloc des
   mots de points sur le canevas est retiré ; `#carte-fiche` remplacée. Vérification : le nombre de lignes du
   panneau égale le nombre de choses de l'espace (`plElements`), par groupe ; le centre de l'espace et son rayon
   restent au-dessus du haut du panneau ; une seule touche blanche ; lignes ≥ 44 px ; toucher une ligne allume le
   bon point, toucher un point surligne la bonne ligne ; aucun `fillText` de mots de pensée (le test compte les
   appels par un espion sur le contexte) ; Échap ferme le panneau puis la carte ; mouvement réduit : aucune
   animation.
4. **Mac.** Panneau à droite, titres de rangées près de leurs cases. Vérification : à 1440, l'écart entre un titre
   de rangée et sa première case est ≤ 40 px ; le panneau ne couvre aucun espace.
5. **La carte dans chaque monde.** Un lien « Carte » dans l'écran d'un projet ouvre la carte centrée sur lui,
   panneau ouvert. Vérification : depuis ARYAN, la carte s'ouvre avec le panneau d'ARYAN, rien d'autre à toucher.

Validation par Rayan sur son iPhone après l'étape 2, avant la 3.

## 6. Ce qu'il ne faut pas faire

- Écrire des phrases dans le canevas, à quelque échelle que ce soit.
- Une légende de plus de trois signes, ou des signes que l'œil ne distingue pas à la taille dessinée.
- Remettre une mini-carte sur l'accueil « pour l'ambiance » : c'est un décor qui redit la liste.
- Donner au passé le même éclat qu'à ce qui attend.
- Cacher une information derrière un seuil de zoom.
- Des touches + et −, un bouton « vue d'ensemble » (refusés par Rayan) ; un radar, des chiffres de remplissage.
- Inventer des points ou des liens ; un point par chose réelle, toujours.
- `mix-blend-mode`, une bibliothèque 3D ou de carte, du flou sur du texte.

## 7. Décisions qui restent à Rayan

1. **Retirer la planète de l'accueil** et la remplacer par le lien « Carte › » dans « Projets ». Réponse retenue
   par défaut : oui.
2. **Les tâches écrites dans le code en avril** (21 « faits » pour ARYAN) restent-elles des points de la carte ?
   Réponse retenue : oui, mais en poussière (fait), et repliées dans le panneau.
3. **Le panneau remplace la fiche** : un point touché ouvre le panneau de son espace, sur sa ligne, au lieu d'une
   fiche isolée. Réponse retenue : oui.
