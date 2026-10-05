# ARC — vision et décisions (5 octobre 2026)

Ce document résume ce que Rayan a dit et décidé le 5 octobre 2026. Il fait foi pour la suite, avec
`docs/ETUDE-BESOIN.md` (le besoin, sourcé) et `docs/AUDIT.md` (l'état du code au 4 octobre).

## La vision, dans les mots de Rayan

La tête d'un humain contient ce qu'il est et ce qu'il vit (son identité, son quotidien, ses proches, ses soucis),
et tout ce qu'il porte : projets qui rapportent, projets qui ne rapportent pas, objectifs, idées, choses à faire.
Le soir on y pense ; le lendemain la vie reprend (le travail, les enfants) et ces pensées se perdent ou tournent.

ARC est né pour ça :

1. Dès qu'une pensée arrive, on la dépose dans un espace qui est à soi, par la voix ou par le texte.
2. Elle ne se perd jamais : elle quitte la tête mais prend place ailleurs.
3. La tête ne garde que le nécessaire.
4. L'IA la fait avancer : elle la range, la relie au bon projet, la développe et dit quoi en faire.

Ambition : un produit utile à tout humain, à la hauteur de ce que l'IA rend possible, dont chaque fonction sert
un besoin réel. « Je veux que chaque chose qu'on met en place serve réellement. »

## Décisions prises

- **Pour qui** : Rayan d'abord, puis vendu à d'autres. Pas d'abonnement ni de multi-clients maintenant, mais plus
  rien en dur (nom, ville, mondes, contenus deviennent des données).
- **Premier critère de réussite** : Rayan ouvre ARC tous les jours pendant trente jours parce qu'il l'aide.
  Constat de départ : aucun usage réel entre avril et octobre 2026.
- **Geste central** : déposer une pensée et la retrouver rangée, avec une étape précise et un moment. Ce geste
  n'existe pas dans l'ARC actuel, qui est un tableau de bord de projets écrits à l'avance.
- **La valeur est dans le retour** (étude du besoin) : ce qu'ARC ramène à la personne, quand, et sous quelle forme.
- **Projets et vie séparés** : les projets (ARYAN, ATLAS, FBA, KITCHEN, TELENEUF) d'un côté ; « Ma vie »
  (Santé, Juridique) à part, dans un style plus calme.
- **Santé et Juridique** : mémoire, échéances, documents à retrouver, préparation d'un rendez-vous. Jamais
  d'avis médical ni juridique sur le cas de la personne (voir la ligne de partage dans l'étude du besoin).
- **Appareils** : iPhone et Mac à égalité, deux mises en page pensées.
- **Liberté technique** : hypothèse de travail, reconstruire l'interface en gardant le socle (connexion par e-mail,
  état `S` et synchronisation, proxy Claude, service worker). À confirmer ou contredire par les preuves.
- **Design** : niveau Apple, clair, lisible, avec de la couleur et du relief. Chaque monde a son jeu de couleurs
  et son motif ; on « entre dans un monde ». Typographie de caractère pour les titres (Bricolage Grotesque dans
  les maquettes), police système pour le texte. Pas de séries de jours ni de notifications culpabilisantes.

## Ce que contient chaque monde (proposition du 5 octobre)

Un projet : le cap, le point d'étape daté, la prochaine étape (une seule, avec un moment), la feuille de route
(Fait, Maintenant, Ensuite, Cap), ce qui bloque, les pensées déposées. Claude y est présent avec ce contexte.
Un projet qui n'avance plus est « endormi » : ARC propose de le réveiller ou de l'archiver.

Santé et Juridique : ni cap ni feuille de route ; mémoire, échéances, documents, préparation de rendez-vous.

## Maquettes

`docs/maquettes/` contient la source des neuf écrans dessinés le 5 octobre (format `.dc.html` d'un outil de
maquettage : lire le balisage et les styles, ne pas chercher à les exécuter tels quels) :
`Main` (Aujourd'hui), `Ecoute` et `Capture` (déposer une pensée), `Espaces` (projets et vie), `Espace` (monde
ARYAN), `Route` (feuille de route), `Atlas` (monde ATLAS), `Sante`, `Mac`. Rayan a jugé la première version
« pas mal pour un début » et demandé plus de couleur, de relief et d'envie ; les écrans `Sante` et `Mac` ne sont
pas encore alignés sur cette direction. Rien n'est validé définitivement.

## Ce qui reste inconnu

- Si un plan écrit par une IA soulage autant qu'un plan écrit par soi-même (jamais testé).
- Ce que d'autres personnes ressentent et paieraient : 5 à 10 entretiens à mener (guide dans l'étude du besoin).
- L'état réel d'ATLAS (immatriculation, pages légales, achat en mode test) et le sort de FBA, KITCHEN, TELENEUF.
