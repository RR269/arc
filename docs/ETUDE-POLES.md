# Santé et Juridique : l'étude (11 octobre 2026)

Demandée par Rayan le 10 octobre à 21 h, quand je lui ai proposé de choisir le contenu de Santé. Ses mots, repris
tels quels :

> « pour le côté santé j'aimerais que nous fassions un pôle santé à la Docteur House science-fiction avec le corps
> humain en 4D (c'est une idée exemple), un espace pour nos rdv médicaux avec des catégories de corps médical ; que ce
> produit soit le reflet du monde de demain vers lequel on se dirige à grande vitesse ; et pareil pour le pôle
> juridique ; ces espaces je veux qu'ils servent et qu'ils soient ce qui n'a jamais été ; pour ce faire, faudrait faire
> une étude pour voir comment nous pourrions et nous nous devons de construire ces pôles. »

Cette étude ne modifie rien dans ARC. Elle dit ce qui existe, ce qui est permis, ce qui tient sur un iPhone, la
direction proposée, les étapes, et les décisions qui restent à Rayan. La maquette de direction est dans
`docs/maquettes/poles-direction.html` (hors de l'application, données d'exemple marquées comme telles).

## 1. Ce que Rayan demande, traduit

| Ses mots | Ce que j'en lis |
|---|---|
| « à la Docteur House » | Le corps au centre de l'écran, et chaque point lumineux dessus est un fait : un rendez-vous, un document, un soin en cours. Pas un diagnostic (voir § 3). |
| « le corps humain en 4D » | Un corps que l'on voit, et le temps : ce qui a été fait, ce qui vient. 4D = le corps + le temps. |
| « un espace pour nos rdv médicaux avec des catégories de corps médical » | Les rendez-vous, rangés par spécialité (dentiste, ophtalmo, kiné…), avec la date, le lieu, ce qu'il faut apporter et ce qu'il en est sorti. |
| « le reflet du monde de demain » | Un écran qui ressemble à un poste de commande, pas à un formulaire : fond noir, lumière, mouvement qui répond à un fait vrai (règle d'ARC depuis le 8 octobre : aucun faux signal). |
| « pareil pour le pôle juridique » | Le dossier juridique vu de la même façon : au centre, soi ; autour, les échéances, plus proches quand elles approchent. |
| « qu'ils servent » | Le critère de réussite : Rayan y revient parce qu'il y retrouve quelque chose. Un écran qui en met plein la vue et qu'on n'ouvre pas est un échec. |

## 2. Ce qui existe aujourd'hui (mesuré dans le code, 11 octobre)

**Santé** (`#S3`, 2 129 px de haut sur iPhone 390) : un « check-in du jour » à curseurs (sommeil, énergie, stress,
sport), un score et une série de jours (`sante-score-val`, `sante-streak-row`), des « Tendances » en barres, quatre
habitudes posées d'office, des objectifs, un journal, « Outils & Apps », et un Claude dont les quatre boutons demandent
des conseils (« Optimiser sommeil », « Programme sport », « Gérer le stress », « Routine matin »), ce que ses consignes
refusent depuis le 5 octobre. Aucun rendez-vous, aucun document, aucune échéance. Les pensées rangées en Santé ne s'y
voient pas (choix du 10 octobre, en attendant cette étude).

**Juridique** (`#S4`, 1 023 px) : quatre sections en accordéon (Statut & Entreprise, Contrats & Documents, Aides &
Financement, Démarches en cours), chacune une liste d'éléments cochables avec une date facultative ; une chronologie
tirée de ces dates ; des notes ; des ressources ; une recherche ; un export ; un bouton « Aides » qui envoie à Claude
« Aides disponibles à Valence pour mon entreprise » (la ville est écrite en dur) ; et, depuis le 10 octobre, les pensées
rangées en Juridique.

**La vision** (`docs/VISION.md`, 5 octobre) : « Santé et Juridique : mémoire, échéances, documents à retrouver,
préparation d'un rendez-vous. Jamais d'avis médical ni juridique sur le cas de la personne. » Et `docs/ETUDE-BESOIN.md`
trace la ligne à ne pas franchir. La demande du 10 octobre ne la contredit pas : elle demande que cette mémoire soit
vue, comme un corps et une orbite, et non comme des listes.

## 3. Ce qui est permis, ce qui ne l'est pas

### L'avis médical et juridique

ARC note, date, retrouve, prépare, rappelle. ARC ne diagnostique pas, n'interprète pas un résultat, ne conseille pas
un traitement, ne dit pas « tu as le droit de » sur un cas. Un point sur le corps dit « ordonnance ophtalmo, mars » ;
il ne dit jamais « ta vue baisse ». C'est la règle de l'étude du besoin, et c'est aussi ce qui protège Rayan le jour
où ARC est vendu : un logiciel qui donne un avis médical change de catégorie (dispositif médical) et de responsabilité.

### Les données de santé d'autres personnes

Tant qu'ARC ne sert qu'à Rayan, ses données de santé sont les siennes, sur son compte : c'est de l'hébergement pour
compte propre, hors du régime HDS ; le RGPD s'applique quand même. Le jour où ARC garde les données de santé
**d'autres personnes**, la loi change de nature : héberger des données de santé pour le compte d'un tiers, « y compris
pour le compte du patient lui-même », demande un hébergeur certifié HDS (article L. 1111-8 du code de la santé
publique), et le faire sans certificat est un délit (L. 1115-1). Supabase, dans l'offre gratuite actuelle, n'est pas
un hébergeur HDS. **Conséquence pour la suite : construire Santé pour Rayan, oui ; l'ouvrir à d'autres comptes, non,
tant que la question de l'hébergement n'est pas réglée** (hébergeur certifié, ou chiffrement sur l'appareil tel que
le serveur ne voit jamais rien de lisible : c'est la piste que je recommande d'étudier le moment venu).

### Ce que l'État fait déjà

« Mon espace santé » (service public) tient déjà les documents médicaux déposés par les professionnels, une messagerie
sécurisée avec eux, un agenda médical et le carnet de vaccination. ARC ne doit pas refaire le dossier médical : il
ferait moins bien, avec plus de risques. **ARC fait ce que Mon espace santé ne fait pas** : la mémoire personnelle
(« ce que le dentiste m'a dit », « j'ai arrêté ce traitement en mai »), la préparation d'un rendez-vous (les questions
que je veux poser, ce que je dois apporter), le lien avec le reste de ma vie (une pensée déposée dans le métro devient
un rendez-vous à prendre), et la vue d'ensemble, le corps et le temps. Pour un document, ARC retient d'abord **où il
est** (« Mon espace santé », « papier, classeur bleu », « photo sur l'iPhone »), pas le fichier lui-même (§ 6).

## 4. Le corps en « 4D » : ce qui tient dans un iPhone, et ce qui ne vaut pas le poids

Un vrai corps en 3D que l'on fait tourner au doigt existe sur le web (WebGL marche dans Safari sur iPhone). Mais :
- il demande une bibliothèque (three.js, environ 600 Ko) et un modèle de corps (plusieurs Mo), alors qu'ARC tient en un
  fichier sans bibliothèque ajoutée ;
- il coûte de la batterie et de la fluidité, surtout sur un écran qui porte en plus le verre et les lueurs d'ARC ;
- et surtout, **il ne porte aucune information de plus** : sur un corps, un fait a une zone (les dents, les yeux, le
  genou), pas un angle de vue. Tourner le corps ne dit rien de vrai en plus. La charte d'ARC refuse les animations
  décoratives.

La quatrième dimension, elle, vaut tout : **le temps**. Ce qui a été fait, ce qui est en cours, ce qui vient.

**Proposition** : un corps-hologramme en deux dimensions (face et dos, dessiné dans la page, sans bibliothèque,
comme les pictogrammes au trait), dont chaque zone ne s'allume que pour un fait vrai, et, dessous, **la ligne du
temps** : chaque point est un rendez-vous ou un document daté ; « Aujourd'hui » est marqué ; on glisse le doigt pour
voir le corps tel qu'il était à une date (les zones allumées à ce moment-là). C'est le corps en 4D au sens qui compte,
honnête et léger. Un vrai 3D pourra venir plus tard s'il apporte un jour quelque chose que le 2D ne peut pas montrer
(je ne vois pas ce cas aujourd'hui).

**Ce qu'une zone montre quand on la touche** : la spécialité (ou les spécialités) de cette zone, les rendez-vous passés
et à venir, les documents, les soins en cours (« kiné, séance 6 sur 10 »). Rien d'autre.

## 5. La direction, écran par écran

### Santé : « Ton corps, ta mémoire. »

De haut en bas :
1. **Le corps** (panneau de verre, l'horizon vert du pôle derrière) : la silhouette-hologramme, Face / Dos, les zones
   allumées par un fait vrai, chacune avec son étiquette courte (« Dentiste · RDV 14 nov. », « Kiné · 6 séances sur
   10 ») ; dessous, la ligne du temps. Sans aucun fait, le corps est éteint et une ligne dit quoi faire : « Dépose une
   pensée ou ajoute un rendez-vous : il s'allumera ici. » (État vide, charte règle 9.)
2. **Rendez-vous** : une ligne par rendez-vous à venir (spécialité, praticien, date, heure), puis les passés repliés.
   Un rendez-vous ouvert : lieu, « à apporter », « mes questions », « ce qui en est sorti » (écrit après), documents liés.
   **« Préparer ce rendez-vous »** est le geste de Claude ici : il rassemble ce qu'ARC sait (pensées rangées en Santé
   qui parlent de cette spécialité, dernier rendez-vous, soins en cours) et propose une liste de questions à poser et
   de choses à apporter. Il ne répond jamais à la place du médecin.
3. **Spécialités** : les catégories de corps médical demandées par Rayan, en puces : allumées quand elles ont au moins
   un fait, éteintes sinon. Liste de départ (à valider) : généraliste, dentiste, ophtalmo, dermato, ORL, cardio, kiné,
   imagerie, laboratoire, psy, pharmacie. Chacune est liée à une ou plusieurs zones du corps.
4. **Pensées** rangées en Santé (la section construite le 10 octobre, déjà prête).
5. **Documents** : nom, date, spécialité, et **où il est**. Pas de fichier dans ARC en première version (§ 6).

Ce qui part de l'écran : les curseurs, le score, la série, les habitudes posées d'office, les quatre boutons de
conseils. Ce qui reste disponible : les données de ces check-ins, gardées dans l'état (`S.archive.sante`, comme
Trading en octobre) et exportables ; rien n'est effacé. **C'est une décision de Rayan** (§ 8, question 1).

### Juridique : « Ton dossier, en orbite. »

1. **L'orbite** : au centre, soi ; trois anneaux (7 jours, 30 jours, 90 jours) ; chaque point est une échéance vraie,
   d'autant plus proche du centre qu'elle approche ; passée, elle touche le centre et s'affiche « À replacer » (le mot du
   point du matin, sans rouge ni reproche). Faite, elle quitte l'orbite (la comète d'ARC, une fois). Une échéance se
   touche : ce qu'il faut faire, les documents, la section du dossier.
2. **Échéances** : la liste, par date.
3. **Le dossier** : les quatre sections d'aujourd'hui (Statut, Contrats, Aides, Démarches), inchangées dans leur
   contenu, dans l'écriture de l'accueil.
4. **Pensées** rangées en Juridique (déjà là).
5. **Documents** : comme en Santé (nom, date, où il est).

Ce qui change : la chronologie devient l'orbite (même source : les dates) ; le bouton « Aides » avec « Valence » en
dur disparaît, ou utilise la ville de « Ma ville » si elle est affichée (**décision de Rayan**, question 4).

### Ce qui est commun aux deux

- **Un seul composant « échéance »** (date, titre, espace, fait ou non) : le corps l'allume, l'orbite la place, le
  Point du jour la cite, le rangement peut en créer une (§ 7). Un composant par usage, réutilisé partout (charte).
- **Aucun faux signal** : rien ne s'allume sans fait, rien ne bouge sans cause (arrivée sur l'écran : l'orbite se pose ;
  « C'est fait » : la comète ; sinon, immobile).
- **Même écriture** que l'accueil (police du système, 17 px, pictogrammes au trait), même verre, même horizon.
- **Une seule touche blanche** par écran : « Ajouter un rendez-vous » en Santé, « Ajouter une échéance » en Juridique.

## 6. Les données

Nouveau, dans l'état `S` (une ligne par compte, synchronisée et fusionnée comme le reste) :
- `S.sante.rdv[]` : `{id, specialite, zone, praticien, lieu, at, apporter[], questions[], sortie, docs[]}` ;
- `S.sante.soins[]` : `{id, specialite, zone, titre, fait, total, debut}` (« kiné, 6 sur 10 ») ;
- `S.sante.docs[]` et `S.juridique.docs[]` : `{id, titre, date, specialite|section, ou}` (« où » : Mon espace santé,
  papier, photo, courriel ; jamais le fichier) ;
- `S.juridique.echeances[]` : `{id, titre, section, at, fait}`. Les dates déjà saisies dans les quatre sections y
  entrent une fois (migration, `WORLDS_V`-like, sans rien perdre).
- Les pensées restent où elles sont (`arc_thoughts_v1`, `thought_filings`) ; le corps et l'orbite les lisent par
  `penseesDe('sante')` et `penseesDe('juridique')`, déjà écrites.

Rien de nouveau dans Supabase : aucune table, aucune règle. Le fichier d'un document n'entre pas dans ARC en première
version : c'est ce qui garde la question HDS fermée tant qu'ARC est à Rayan seul, et c'est ce que Mon espace santé fait
déjà.

## 7. Ce que l'IA fait dans ces pôles (et seulement cela)

1. **Ranger** une pensée en Santé ou Juridique (fait).
2. **Lire une date et une spécialité dans une pensée** rangée là (« dentiste jeudi 14 h », « URSSAF avant le 15 ») et
   **proposer** un rendez-vous ou une échéance, que Rayan confirme d'un geste. Jamais créé sans lui. Techniquement : la
   même garde que le rangement (la date doit citer les mots de la pensée, `hasTimeExpression` du proxy) ; la spécialité
   est reconnue sur l'appareil par une liste de mots, sans IA.
3. **Préparer un rendez-vous** : questions à poser, choses à apporter, à partir de ce qu'ARC sait. Consigne stricte :
   organiser, jamais répondre à la place du professionnel.
4. **Rappeler** : le Point du jour cite les rendez-vous et échéances du jour (il a déjà la place).

Les boutons de conseils de Claude Santé sont retirés.

## 8. Les décisions qui restent à Rayan

Je ne les prends pas. Si Rayan répond « go » sans préciser, je retiens la réponse en gras.

1. **Les curseurs** (check-in, score, série) : **retirés de l'écran, données gardées et exportables** ; ou gardés,
   repliés en bas.
2. **Les spécialités de départ** : **la liste du § 5**, ou la sienne.
3. **Les documents** : **une référence (nom, date, où il est)**, pas de fichier ; ou des fichiers, et alors la question
   de l'hébergement se pose avant d'écrire une ligne.
4. **Le bouton « Aides » et Valence en dur** : **retiré** ; ou lié à « Ma ville ».
5. **L'ordre** : **Santé d'abord** (c'est l'écran qui change le plus), Juridique ensuite ; ou l'inverse.

## 9. Les étapes, chacune vérifiée par un test

| Étape | Ce qu'elle apporte | Ce qui est mesuré | Rayan voit |
|---|---|---|---|
| 1. Le socle | Rendez-vous, soins, documents (référence), échéances dans `S` ; migration des dates juridiques ; curseurs retirés (données gardées) ; boutons de conseils retirés ; « Ajouter un rendez-vous » / « Ajouter une échéance » (la touche blanche) | Lecture et écriture, synchronisation à deux appareils (suite `synchro`), rien de perdu à la migration, charte (cibles, contraste) | Les listes, dans l'écriture de l'accueil |
| 2. Le corps et l'orbite | La silhouette Face / Dos, zones allumées par un fait vrai ; l'orbite 7 / 30 / 90 jours ; états vides | Chaque point correspond à un fait de `S` (zéro = éteint), aucun mouvement sans cause, contraste mesuré dans l'image, 360 à 430 px | L'écran qui ressemble à la maquette, avec ses vraies données |
| 3. Le temps | La ligne du temps sous le corps, « Aujourd'hui », glisser pour voir une date ; « C'est fait » : la comète ; « À replacer » | Le corps à une date passée montre exactement les faits datés d'avant ; une fois, jamais en boucle | La 4e dimension |
| 4. Les gestes de l'IA | Une pensée rangée en Santé avec une date → proposition de rendez-vous à confirmer ; « Préparer ce rendez-vous » ; le Point du jour cite rendez-vous et échéances | Proxy hors ligne (suite `proxy`) : la date cite la pensée ou rien ; aucune création sans confirmation ; les consignes refusent tout avis | Le corps qui s'allume depuis une pensée déposée dans le métro |

Validation sur iPhone après l'étape 2 avant d'aller plus loin (comme pour l'accueil).

## 10. Ce que cette étude ne fait pas

Aucune ligne d'`index.html` n'a changé. Aucune table, aucune lecture dans Supabase. La maquette
(`docs/maquettes/poles-direction.html`) est un dessin de direction avec des données d'exemple, hors de l'application ;
ce n'est pas l'écran final, et le corps en 2D y est un croquis. Les tests d'ARC passent sur cette branche (aucun
changement de code), relancés le 11 octobre.

### Sources

- Hébergement de données de santé, article L. 1111-8 du code de la santé publique, « pour le compte du patient
  lui-même », certificat obligatoire, délit sans certificat (L. 1115-1) :
  [donneespersonnelles.fr, HDS](https://www.donneespersonnelles.fr/hebergement-donnees-sante-hds).
- Fonctions de Mon espace santé (documents, messagerie, agenda, carnet de vaccination) :
  [aide-sociale.fr](https://www.aide-sociale.fr/compte-mon-espace-sante).
- Ligne à ne pas franchir en santé et en droit : `docs/ETUDE-BESOIN.md` ; vision : `docs/VISION.md` ; charte :
  `docs/CHARTE-DESIGN.md`.
