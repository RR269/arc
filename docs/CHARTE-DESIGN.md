# Charte de design d'ARC (règles de Rayan, 6 octobre 2026)

Texte remis par Rayan tel quel. Il fait foi pour tout travail d'interface, avec `docs/VISION.md`.

Je suis Abdallah. Je construis une application et tu m'aides à en faire
un produit de très haut niveau. Voici tout ce que j'attends en matière de
design, de fonctionnement et de méthode. Ces règles viennent d'un autre
de mes projets, où je les ai fixées une par une après contrôle sur mon
iPhone. Applique-les sans me les faire redire, et signale-moi tout
endroit de cette application qui les contredit.

1. QUI JE SUIS, COMMENT ME PARLER
- Je ne code pas. Parle-moi en français, tutoie-moi, phrases courtes, la
  conclusion d'abord. Pas de jargon : explique tout terme technique en
  quelques mots.
- Je juge sur mon iPhone, en conditions réelles. Ne me demande pas de
  captures d'écran : c'est à toi de mesurer, de prouver et de me dire
  exactement quoi ouvrir et quoi regarder.
- Quand je dis que je ne vois pas un changement, n'argumente pas :
  applique un changement visible et montre-le.

2. L'EXIGENCE
- Finition des meilleures applications (le soin d'Apple), SANS copier
  l'identité visuelle de qui que ce soit.
- L'application doit donner envie : claire au premier regard, agréable à
  utiliser, jamais chargée. « Complet » veut dire que rien d'important ne
  manque, pas que c'est lourd.
- Rien qui fasse vieux, fade, générique ou « fait par une machine ».
- Chaque écran a UN but principal, visible en une seconde. Ce qui ne
  sert pas ce but sort de l'écran.

3. COULEUR
- Une couleur principale franche, déclinée en teintes pâles pour les
  fonds, plus UN seul accent. Propose-moi la palette si elle n'existe
  pas ; si elle existe, respecte-la et corrige ce qui en sort.
- JAMAIS de fond beige, sable, café ou jaune pâle derrière du texte : ça
  vieillit tout. Les blocs sont blancs ou dans la teinte pâle de la
  couleur principale.
- L'accent sert aux petits libellés et aux repères. Jamais en grand
  aplat. Il doit être vif, jamais terne ni brunâtre.
- Rouge et orange réservés aux vraies erreurs et aux actions qui
  détruisent quelque chose, avec sobriété. Jamais pour décorer.
- Pas d'emoji dans l'interface : des pictogrammes au trait, d'une seule
  famille, même épaisseur partout.
- Tout texte reste lisible : contraste d'au moins 4,5 pour 1, mesuré.
- Si un mode sombre existe ou est prévu : il est soigné autant que le
  mode clair, pas une simple inversion.
- Toutes les couleurs passent par des variables partagées. Aucune valeur
  recopiée à la main dans un écran.

4. ÉCRITURE ET TYPOGRAPHIE
- Police système de l'appareil. Corps de texte à 17 px, interligne 1,47,
  lettres très légèrement resserrées, encre presque noire mais pas noire
  pure. Gras à 600, réservé à un mot ou un groupe de mots.
- Une échelle de tailles courte et fixe (titre d'écran, titre de bloc,
  corps, libellé, mention). Aucune taille inventée au cas par cas.
- Titres francs, grands chiffres bien visibles, petits libellés de
  rubrique en capitales espacées.
- La même écriture partout : deux écrans ne doivent jamais « écrire »
  différemment.
- Typographie française correcte : aucune ligne ne commence par €, %, :,
  ; ? ! ou un guillemet ; un nombre n'est jamais séparé de son unité ;
  montants et dates au format français. C'est le code qui pose les
  espaces insécables, pas la main.

5. LES MOTS DE L'INTERFACE
- Des mots simples, les mêmes partout pour la même chose. Un bouton dit
  ce qu'il fait (« Enregistrer la fiche », pas « OK » ni « Valider »).
- Pas de pavés : 3 à 4 lignes au plus pour un paragraphe sur téléphone,
  2 à 3 pour un élément de liste. Ce qui dépasse devient des cases qu'on
  ouvre, des cartes ou un schéma.
- Les messages d'erreur disent ce qui s'est passé et quoi faire, en
  français courant, sans code ni reproche.
- Aucune note de travail visible par l'utilisateur (« à vérifier »,
  « test », texte provisoire, donnée d'exemple oubliée).

6. MISE EN PAGE ET COMPOSANTS
- De l'air : espacements réguliers tirés d'une échelle fixe, alignements
  nets, mêmes arrondis et mêmes filets partout.
- Dès qu'il y a une liste, une comparaison ou un enchaînement : on le
  montre (cartes, cases, frise, barre avec légende, grand chiffre), on ne
  l'écrit pas en prose.
- Style de référence : des cases blanches à filet fin, avec un
  pictogramme au trait dans un petit carré pâle.
- Case ouverte = UN SEUL BLOC avec son contenu : aucun espace entre les
  deux, un même contour dans la couleur principale, la case devient
  l'en-tête sur fond pâle, le contenu est collé dessous sur fond blanc,
  la flèche tourne, l'ouverture est douce. Le contour coloré n'apparaît
  que sur le bloc ouvert.
- Grands chiffres : une tuile par ligne, libellé à gauche, chiffre en
  grand à droite, jamais coupé ni serré.
- Aucun tableau à plus de deux colonnes sur téléphone : il devient des
  cartes.
- Un composant par usage, réutilisé partout (un seul bouton principal,
  une seule carte, un seul champ). Si deux écrans dessinent la même
  chose de deux façons, c'est un défaut.
- Sur chaque écran : UN bouton principal, bien visible, placé là où le
  pouce l'atteint. Les actions secondaires sont plus discrètes.

7. TOUCHER, GESTES ET MOUVEMENT
- Tout ce qui se touche fait au moins 44 px de haut, avec assez d'espace
  autour pour ne pas se tromper de cible.
- Au toucher : pas de voile gris, pas de couleur qui clignote. L'élément
  s'enfonce très légèrement et prend un fond pâle, c'est tout.
- Chaque action a une réponse immédiate et visible (état pressé, puis
  confirmation). L'utilisateur ne doit jamais se demander si son geste
  a été pris en compte.
- Animations courtes (environ 200 ms), douces, utiles pour comprendre ce
  qui se passe. Jamais décoratives. Désactivées si l'appareil demande
  moins de mouvement.
- Les gestes habituels de l'iPhone fonctionnent comme partout ailleurs
  (retour, défilement, fermeture d'un panneau).

8. NAVIGATION ET REPÈRES
- L'utilisateur sait toujours où il est, d'où il vient et comment
  revenir. Peu de niveaux, pas de cul-de-sac.
- En changeant d'écran ou d'étape, la page s'affiche par le haut.
- Un seul repère de progression par écran, pas de doublon.
- L'application retient où j'en étais et ce que j'avais commencé à
  saisir. Je reprends sans rien refaire.
- Les éléments fixes (barre du haut, barre du bas) ne cachent jamais le
  contenu, et respectent l'encoche et la barre d'accueil de l'iPhone.

9. LES ÉTATS DE CHAQUE ÉCRAN — aucun ne doit être oublié
Pour chaque écran et chaque liste, conçois et montre-moi :
- le chargement (une forme d'attente propre, pas une page blanche ni un
  saut de mise en page) ;
- l'écran vide, la première fois (il explique quoi faire et propose
  l'action) ;
- l'état normal, avec peu de données puis avec beaucoup ;
- l'erreur (ce qui s'est passé, et un bouton pour réessayer) ;
- l'absence de connexion ;
- la réussite d'une action (confirmation claire et brève).

10. FORMULAIRES ET SAISIE
- Le moins de champs possible. Un libellé clair au-dessus de chaque
  champ, pas seulement un texte grisé dedans.
- Texte des champs à 16 px au minimum (sinon l'iPhone zoome tout seul).
- Le bon clavier pour chaque champ (chiffres, e-mail, téléphone). La
  virgule est acceptée dans les nombres. Le clavier ne cache jamais le
  champ en cours ni le bouton de validation.
- L'erreur s'affiche à côté du champ concerné, au bon moment, et la
  saisie n'est jamais effacée.
- Les valeurs par défaut sont justes ou absentes. Jamais de chiffre
  d'exemple qu'on pourrait prendre pour une vraie donnée.

11. FONCTIONNEMENT ET CONFIANCE
- Ce qui est affiché est vrai : aucun chiffre inventé, aucun calcul
  approximatif présenté comme exact. Tout calcul est vérifié par un test.
  Si deux écrans donnent deux résultats différents pour la même chose,
  arrête-toi et dis-le-moi.
- Avant toute action qui supprime ou qui ne peut pas se défaire : une
  confirmation claire, ou mieux, la possibilité d'annuler juste après.
- Rien ne se perd : ce que l'utilisateur saisit est conservé, même s'il
  quitte l'écran ou perd la connexion.
- Rapide : l'écran s'affiche tout de suite, le défilement est fluide,
  rien ne saute pendant le chargement.
- Une fonction n'existe que si elle sert vraiment. Pas de gadget, pas de
  réglage que personne n'utilisera.
- Ce qui est réservé à une offre payante est annoncé clairement, sans
  mener l'utilisateur vers un cadenas par surprise.
- Données personnelles : ne demander que le nécessaire, dire pourquoi.

12. ACCESSIBILITÉ ET TAILLES D'ÉCRAN
- Téléphone d'abord. Aucun débordement horizontal. Vérifie à 375, 390,
  393 et 430 px de large, puis sur tablette et ordinateur si
  l'application y est prévue.
- L'application reste utilisable avec un texte agrandi dans les réglages
  du téléphone, et avec un lecteur d'écran (chaque bouton a un nom).
- La couleur ne porte jamais seule une information : toujours un mot ou
  un pictogramme avec.

13. MÉTHODE DE TRAVAIL
- On améliore ce qui existe, pièce par pièce. Ne reconstruis jamais une
  structure que je n'ai pas demandé de refaire. Ne me propose pas
  plusieurs maquettes à choisir : fais le meilleur choix et montre-le.
- Une mission à la fois, bornée, avec des vérifications mesurables :
  d'abord un état des lieux sans rien modifier, puis un plan court, puis
  l'exécution, puis je valide sur iPhone.
- On commence par UN écran poussé jusqu'au bout. Quand je le valide, il
  devient le modèle pour tous les autres, et on n'y revient plus.
- Arrête-toi et demande-moi avant toute décision de contenu, d'offre, de
  prix, de données, et avant tout ce qui ne peut pas se défaire.
- Chaque règle ci-dessus est protégée par un contrôle automatique quand
  c'est possible (contraste, tailles des cibles, débordement, longueur
  des textes, couleurs interdites), pour qu'elle ne se perde pas au fil
  des modifications.
- Avant de retirer ou déplacer une fonction, cherche qui l'utilise et
  qui y renvoie. Rien ne doit disparaître par accident.
- Enregistre le travail par petites étapes nommées clairement, et tiens
  un journal des décisions prises.
- À la fin de chaque mission, un résumé de quelques lignes que je peux
  lire : ce qui a changé, ce que je dois ouvrir et regarder, ce qui
  attend ma décision.

14. POUR COMMENCER
Fais un état des lieux complet de l'application au regard de ces règles,
SANS RIEN MODIFIER :
1. À quoi sert l'application et pour qui, en trois phrases, pour que je
   vérifie que tu as bien compris.
2. La liste de tous les écrans et de toutes les fonctions.
3. Pour chaque écran : ce qui respecte déjà ces règles, ce qui les
   contredit, et les états manquants (chargement, vide, erreur, hors
   connexion).
4. Les incohérences entre écrans : couleurs, tailles, composants, mots.
5. Les défauts mesurés : cibles trop petites, champs sous 16 px, textes
   trop longs, débordements, contrastes insuffisants.
6. Un classement du plus gênant au moins gênant, et l'ordre dans lequel
   tu proposes de corriger, en commençant par l'écran qui servira de
   modèle.