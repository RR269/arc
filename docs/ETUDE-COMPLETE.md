# Étude complète d'ARC (5 octobre 2026)

**Verdict.** ARC est aujourd'hui un tableau de bord de projets écrits à l'avance. La vision demande autre chose : déposer une pensée, la retrouver rangée avec une étape et un moment, et la voir revenir au bon moment. Ce geste n'existe nulle part dans le code. Le socle (connexion par e-mail, une ligne par compte, relais Claude protégé, page disponible hors ligne) est sain et récent. L'écran, lui, est celui d'avril, avec les dix défauts de l'audit, tous encore là. Sur le site en ligne, Rayan a constaté lui-même, captures à l'appui, que la connexion, Claude et la synchronisation Mac–iPhone marchent (4 et 5 octobre) ; aucun test automatique ne le rejoue.

**Les cinq premières priorités.** 1. Remettre `CLAUDE.md` à la vérité et constater ce qui marche en ligne. 2. Poser des tests, puis le nouveau modèle de données, avec une migration sans perte et les pensées dans une table où l'on ne fait qu'ajouter. 3. Figer le système de design et corriger les maquettes. 4. Construire le dépôt, le rangement par l'IA avec correction, et une seule prochaine étape avec un moment. 5. Construire l'écran « Aujourd'hui » et le retour à heure convenue.

**La première version.** Un champ de texte (la dictée du clavier de l'iPhone sert de voix, sans code), des pensées qui ne peuvent plus être écrasées, un rangement proposé par l'IA et corrigible en un geste, une étape avec son moment, l'écran « Aujourd'hui », un point du matin. Aucun avis médical ni juridique. Interface reconstruite sur le socle gardé.

**Les plus grands inconnus.** Un plan écrit par une IA soulage-t-il autant qu'un plan écrit par soi ? Personne ne l'a testé. Le comportement réel sur l'iPhone de Rayan (dictée, micro, notifications, stockage) n'a pas été essayé. L'état côté Supabase et le site en ligne n'ont pas pu être relus depuis l'environnement d'étude : ils ne sont connus que par les essais et les captures de Rayan. Quatre points de droit restent à confirmer par un avocat avant toute vente.

**Comment lire.** PROUVÉ : lu dans le code (fichier:ligne), mesuré, ou lu sur une page officielle. PROBABLE : déduction solide ou source secondaire. SUPPOSÉ : mémoire, parole rapportée ou déduction non testée. Sauf mention contraire, les numéros de ligne sont ceux d'`index.html` sur `origin/main` (`052f7de`).

## Partie 1 — Ce qui a été fait depuis le départ

### Chronologie

| Quand | Ce qui a été livré | Ce qui a été réellement vérifié, et comment |
|---|---|---|
| 1er au 15 avril 2026 | 27 commits de Rayan, par téléversement, titres par défaut de GitHub. Premier `index.html` de 5 457 lignes (`d2edcc6`). Au 15 avril (`a330e3c`) : 4 084 lignes, cinq mondes dont TRADING. | Rien n'est écrit sur des tests. Relu le 5 octobre dans le code d'avril : 526 `<div` pour 528 `</div>` ; bouton « Actualiser » qui appelle une fonction absente (`a330e3c:index.html:3330`) ; un identifiant au hasard par appareil, donc aucune synchronisation possible entre deux appareils (`a330e3c:index.html:1751-1755`) ; un jeton `x-arc-token` en clair (`a330e3c:index.html:3916`) ; service worker désactivé. PROUVÉ. |
| 15 avril au 4 octobre | Rien. Aucun commit. Un seul redéploiement de la même version le 24 juin, cause inconnue. | PROUVÉ (`gh api repos/RR269/arc/commits`). « Aucun usage réel » sur la période est la parole de Rayan (`docs/VISION.md:27`), pas une mesure : SUPPOSÉ. |
| 4 octobre, matin — PR #1 (`reprise-octobre`, fusion `e2c6573`) | 4 commits, +468 −270. Panneau Claude, veille, affichage des erreurs Claude, nettoyage du texte de Claude (DOMPurify), service worker `arc-v5` ; `CLAUDE.md` ; Trading et code MT5 retirés, monde ATLAS créé, ARYAN mis à jour ; `docs/AUDIT.md`. | Description de PR vide, aucun résultat de test dans les messages. Relu le 5 octobre : `<div` équilibrés depuis `559a04e` ; « MT5 » passe de 93 occurrences à 1 ; données Trading déplacées dans `S.archive.trading` (`:2344-2353`), PROUVÉ par lecture, non testé avec un vrai état d'avril. |
| 4 octobre, soir — PR #2 (`connexion`, fusion `052f7de`) | 2 commits, +431 −38. Écran de connexion, synchronisation par compte, nouveau `claudeCall`, code du proxy versionné. | Description vide. Seule trace : `CLAUDE.md:42` dit « testée en réel sur localhost le 4 octobre » ; aucune sortie de test dans le dépôt : SUPPOSÉ. GitHub Pages a déployé `052f7de` à 18 h 35 UTC : PROUVÉ. Que le site en ligne serve bien cette version : PROBABLE (page non chargée depuis l'environnement d'étude). |
| 5 octobre — branche `etude-v2`, non fusionnée | `docs/ETUDE-BESOIN.md`, `docs/VISION.md`, `docs/PSYCHOLOGIE-DESIGN.md`, neuf maquettes. Aucune ligne de code. | `git diff origin/main -- index.html sw.js manifest.json supabase/` : vide. Le code d'`etude-v2` est celui de `main`. PROUVÉ. |

Les mesures de l'audit du 4 octobre ont été refaites le 5 : elles tombent juste (83 textes de l'accueil sous 12 px, 36 zones cliquables sur 47 sous 44 px dans un monde sur Mac, 42 sur 63 sur iPhone). Le contraste n'a pas été remesuré.

Sur les dates : le code de la connexion a été fusionné le 4 octobre à 18 h 35 UTC (20 h 35 à Paris). Le chantier n'a été déclaré terminé que le 5 octobre vers 3 h 45, quand Rayan a confirmé la synchronisation entre le Mac et l'iPhone.

**Constaté par Rayan sur le site en ligne** (captures d'écran envoyées pendant le chantier ; essais manuels, non rejoués par un test) :

- 4 octobre, vers 20 h 55 : l'écran « Connexion à ARC » s'affiche sur https://rr269.github.io/arc/ ; sans connexion, Claude répond « Connecte-toi pour utiliser Claude ».
- 4 octobre, 20 h 59 : une fois connecté par code e-mail, Claude répond dans le monde ARYAN. Le proxy v2 (130 lignes) est donc déployé et accepte le compte de Rayan.
- 5 octobre, vers 3 h 45 : une tâche ajoutée sur le Mac apparaît sur l'iPhone. Avant cela, les deux appareils affichaient « En pause » parce que Rayan avait répondu « Pas maintenant » à la question de référence sur chacun (`index.html:3446`, `:1784`) : rien ne partait en ligne, et rien ne le signalait clairement. C'est un défaut d'ergonomie à corriger.
- Côté Supabase, Rayan a exécuté et montré : `arc_data` sous sécurité au niveau des lignes avec les trois règles `arc_*_own`, 3 anciennes lignes archivées dans `arc_data_archive`, inscriptions fermées, secrets `ANTHROPIC_KEY` et `ARC_OWNER_ID`, et l'ancien jeton du proxy remplacé puis l'ancien refusé (401).

### État réel aujourd'hui

**Ce qui marche** (PROUVÉ : Chromium piloté par Playwright, 1440×900 et 390×844, bibliothèques servies en local, aucune requête vers Supabase) :

- La page s'ouvre sans erreur JavaScript. Les cinq mondes et les deux pôles s'ouvrent et se referment.
- L'écran de connexion s'affiche à l'arrivée. « Continuer sans connexion » le ferme, la pastille dit « Non connecté ».
- Cocher une tâche, en ajouter une, recharger : tout est gardé sur l'appareil (clé `arc_v2`). L'export produit un fichier JSON.
- Sans session, rien n'est envoyé à Supabase (0 requête ; code `:1869`, `:1896-1897`).
- Écrire à Claude sans session donne un message clair : « Connecte-toi pour utiliser Claude ».
- Le texte de Claude est nettoyé avant affichage (`mdSafe`, `:2437-2441`).

**Ce qui est cassé** (PROUVÉ sauf mention) :

| Fonction | Ce qui se passe | Preuve |
|---|---|---|
| Recherche (Cmd+K) | La fenêtre s'ouvre, mais plante dès qu'on tape : `searchQuery` n'existe pas. | `:3683` ; erreur mesurée « searchQuery is not defined » |
| Accueil d'arrivée (3 écrans) | Ne s'affiche jamais : `S.seen` reçoit une date dès la création de l'état. | `:2339`, `:4238` |
| Section « Tes 5 projets » | Toujours vide : deux éléments portent le même identifiant `hgrid`, seul le premier est rempli (5 cartes, puis 0). | `:1075`, `:1091` |
| Briefing de la War Room | Le « plan d'attaque » est construit mais jamais envoyé à Claude. « Analyse War Room en cours… » reste affiché sans suite. | `:3845`, `:3847` |
| Claude sur téléphone | Les trois panneaux (mondes, Santé, Juridique) sont masqués. Le bouton flottant et la feuille prévus n'existent pas dans la page. Seul le champ du cockpit d'une tâche reste visible (202×24 px). | `:835`, `:857`, `:941-942` ; `:769`, `:873`, `:3647` |
| Écran de connexion si le serveur tiers ne répond pas | Si `supabase-js` ne se charge pas, l'écran de connexion n'apparaît pas. ARC passe en local, pastille « Hors ligne ». | `:1716-1719`, `:1730` |
| « Continuer sans connexion » (choix délibéré, pas une panne : à rediscuter) | Le choix est gardé pour l'onglet seulement. Il est redemandé dans chaque nouvel onglet. | `sessionStorage`, `:1760`, `:3444` |
| Bouton « Code ↗ » | Ouvre l'accueil de GitHub, pas le dépôt du projet. | `:3586` |
| Veille | Quatre fiches en dur, une datée 2025. « Actualiser » réaffiche les mêmes et dit « Veille actualisée ». Le compteur annonce 6 sources, il y en a 4. | `:2329-2334`, `:3519`, `:1088` |
| Compteur « urgents » de Juridique | Compte aussi les éléments terminés (`!it.status !== 'done'` est toujours vrai). | `:3184` |
| Bloquants | Un bloquant ajouté ne peut pas être retiré : aucun code de suppression. | `:3591`, `:2756-2769` |
| Historique Claude d'un monde | Enregistré, jamais réaffiché. Claude reçoit d'anciens messages que Rayan ne voit plus. | `renderChatHistory` (`:4195`) jamais appelée |
| Journal d'un monde | Les 200 premiers caractères de chaque réponse de Claude y sont copiés d'office. Le bouton pour couper cela est dans un bloc jamais affiché. | `:4145-4150`, `:1268` |
| Échéances et ordre des tâches | `S.deadlines` et `S.taskOrder` ne sont jamais écrits : le badge d'échéance et la poignée de glisser n'ont aucun effet. | `:2737`, `:2706` |
| Cockpit, touche Échap | Ne ferme pas le cockpit. PROBABLE (lu, non rejoué). | `:3661`, `:3776` |
| Chiffres de l'accueil | Un appareil neuf affiche déjà « 34 accomplies », « 45 % » et « 14 bloquants. Résous maintenant. ». Ces chiffres viennent du code, pas de Rayan. | état vierge du test ; `:2493` |

Six fonctions ne sont jamais appelées : `fmtDate` (`:2446`), `autoWorldBriefing` (`:2632`), `renderSanteHistory` (`:3044`), `resetPomoWR` (`:3988`), `initClaude` (`:4192`), `renderChatHistory` (`:4195`).

**Ce qui n'a pas pu être testé depuis l'environnement d'étude** : la connexion réelle (envoi et validation du code), la synchronisation avec la table `arc_data`, une réponse de Claude, le proxy déployé, les règles de sécurité Supabase, la révocation de l'ancien jeton, un vrai iPhone, le hors ligne par le service worker, la page en ligne `rr269.github.io`. Pour la connexion, Claude et la synchronisation, voir plus haut ce que Rayan a constaté lui-même en ligne.

### Défauts de l'audit D1 à D10

L'audit portait sur `67123df`. Les lignes ont glissé d'environ 20 depuis.

| # | Défaut | État au 5 octobre | Preuve |
|---|---|---|---|
| D1 | « Sept espaces. » écrit en dur | Présent. Tombe juste par hasard (5 mondes + 2 pôles). Aussi en dur : « 5 », « Tes 5 projets », « RAYAN · VALENCE ». | `:1058`, `:1062`, `:1090`, `:1042` |
| D2 | Identifiant `hgrid` en double | Présent | `:1075`, `:1091` |
| D3 | Claude inaccessible sur téléphone | Présent, à nuancer (champ du cockpit visible) | `:835`, `:857`, `:941-942` |
| D4 | Tout est « CRITIQUE » ou « URGENCE » | Présent : 4 mondes « CRITIQUE », 1 « URGENCE » | `:2541` |
| D5 | « 14 bloquants. Résous maintenant. » | Présent, même sur un appareil vierge | `:2493` |
| D6 | « Code ↗ » ouvre l'accueil de GitHub | Présent | `:3586` |
| D7 | Chronomètre de visite sans usage | Présent | `:1109`, `:2593-2617` |
| D8 | En-tête de monde trop haut | Présent : 239 px (Mac), 331 px (iPhone). Première tâche à 1 043 px sur un écran de 844. | mesure |
| D9 | Veille figée | Changé, pas réglé : le bouton ne plante plus, mais rien n'est cherché. | `:2329-2334`, `:3519` |
| D10 | Pastille « Offline », badge « Erreur » | Non vérifiable ici. Cause traitée d'après `CLAUDE.md:59` (Supabase rallumé). État avec session : SUPPOSÉ. | libellés toujours présents (`:1884`, `:1945`, `:1955`, `:4154`) |

**Aucun des dix défauts n'est corrigé.** Les deux chantiers livrés (reprise, connexion) n'y touchaient pas. Les trois défauts de fond de l'audit (données ouvertes, secret public, synchronisation inopérante) sont traités dans le code ; leur effet réel côté Supabase reste SUPPOSÉ.

### Ce que `CLAUDE.md` dit de faux ou de périmé

| Ligne | Ce qui est écrit | Réalité |
|---|---|---|
| 37 | « Sur `main` (`e2c6573`, en ligne) » | `origin/main` vaut `052f7de`, déployé le 4 octobre à 18 h 35 UTC. Faux. |
| 42 | « branche `connexion` (non fusionnée…) » | Fusionnée par la PR #2. Faux. |
| 51-52 | « Tant que `connexion` n'est pas fusionnée… Claude et la synchronisation y sont hors service » | `main` contient le nouveau code. Sa marche en ligne reste à constater. Périmé. |
| 75-76 | Point ouvert n° 1 : fusion de `connexion` | Fait. Périmé. |
| 86-88 | « Chantier suivant : chantier 2 » | `docs/VISION.md` pose une autre hypothèse : reconstruire l'interface sur le socle. Périmé. |
| 35 | « État au 4 octobre 2026 » | Rien sur le 5 octobre (vision, étude du besoin, maquettes). Incomplet. |
| 81-84 | Seul `docs/AUDIT.md` est à lire avant un chantier | `docs/VISION.md` dit faire foi avec l'étude du besoin. Incomplet. |

Tout le bloc « Supabase : état au 4 octobre » (lignes 57-71) est invérifiable sans lire la base, sauf ce qui se lit dans le fichier du proxy. `docs/AUDIT.md` a vieilli aussi : sa ligne 184 dit que le code du proxy est absent du dépôt (il y est), sa ligne 160 parle de fusionner `reprise-octobre` (fait). Sur le clone local, la branche `main` est restée à `a330e3c` : il faut lire `origin/main`.

### Sécurité

- **L'ancien jeton reste lisible dans l'historique public.** La valeur de `x-arc-token` est lisible dans 16 commits de `main`, du 14 avril (`2c19c3d`, où elle entre) à `60a79d9` ; elle sort du code avec `b97a938`. Le dépôt est public. PROUVÉ (`git log -S` et `git grep` sur chaque commit, relecture par la session Claude Code d'ARC le 5 octobre ; la première version de cette étude disait à tort « trois commits »). `CLAUDE.md:71` dit que ce jeton n'existe plus depuis le changement fait par Rayan dans Supabase le 4 octobre. Le 4 octobre, Rayan a remplacé la valeur dans la fonction (capture d'écran), et la session Claude Code d'ARC a obtenu un refus 401 avec l'ancien jeton. Depuis, le proxy v2 ne lit plus du tout `x-arc-token` (`supabase/functions/ARC-CLAUDE-PROXY/index.ts`). La valeur de l'historique ne sert donc plus à rien : PROBABLE (constaté le 4 octobre, non rejoué le 5).
- **Bibliothèque de connexion non figée.** `supabase-js` est chargé en version `@2` (la dernière 2.x à chaque visite) depuis un serveur tiers (`:1701`). Elle gère la connexion et le jeton de session. C'est le point le plus sensible de la page. PROUVÉ.
- **Aucun contrôle d'empreinte** (SRI : le navigateur refuse un fichier tiers modifié) sur `marked`, `DOMPurify` et `supabase-js`. Aucune politique de sécurité de contenu (CSP) dans la page. PROUVÉ.
- **Texte inséré sans échappement.** Plusieurs valeurs de l'état sont placées telles quelles dans la page : `:3100` (`h.em`), `:3098`, `:3237`, `:3231`, `:2746-2753`, `:3894`, `:3923`. Un lien `javascript:` est accepté dans les outils (`:2798`, `:2810`). Aujourd'hui seul Rayan écrit son état : risque faible. Il devient sérieux dès que du texte dicté, du texte d'IA et des noms d'espaces arrivent à ces endroits. PROUVÉ pour la présence.
- **L'import écrase sans contrôle** (`:3397-3398`). Un fichier d'avant octobre remettrait les données Trading dans ATLAS. PROBABLE.
- Ce qui est correct : aucune clé secrète dans les fichiers suivis ; la seule clé du code est la clé publique `anon` (`:1711`) ; le proxy lit ses secrets dans l'environnement (`index.ts:72`). PROUVÉ.

### Bilan honnête

**Ce qui a servi.** La page s'ouvre sans erreur sur Mac et sur téléphone, alors qu'en avril le balisage était cassé. Le travail local marche. La connexion a un parcours propre, avec une copie de l'état local avant écrasement (`:1915`). Le code n'expose plus ni jeton ni identifiant d'appareil ; le proxy vérifie la session et le compte (`index.ts:58`, `:91-94`) — PROUVÉ dans le code, SUPPOSÉ côté serveur. ARYAN et ATLAS ont un contenu d'octobre. L'audit est chiffré et ses mesures se refont.

**Ce qui n'a pas servi.** Le geste voulu n'existe pas : le seul dépôt rapide est « Ajoute une tâche… » (`:1087`), où il faut choisir le monde soi-même. Les dix défauts sont là. Claude est invisible sur téléphone. Santé est un suivi quotidien à curseurs avec score et série de jours ; Juridique s'appelle « conseiller juridique » : les deux sont du mauvais côté de la ligne posée par la vision. Le contenu de FBA, KITCHEN et TELENEUF n'a pas bougé depuis avril (3 lignes changées sur 157).

**Les erreurs de méthode à ne pas refaire.**

1. **Six mois sans usage.** Une première version livrée, puis rien du 15 avril au 4 octobre. Un outil se juge à l'usage, pas à la livraison.
2. **Le contenu écrit dans le code.** 38 011 caractères de mondes en dur. Le mettre à jour demande un développeur et une migration. Il avait six mois de retard.
3. **Aucun test, aucune trace de vérification.** 20 fichiers suivis, aucun test. Deux PR à description vide. La documentation de référence était fausse un jour après son écriture.
4. **Une liste de fonctions avant l'étude du besoin.** Cockpit, War Room, Pomodoro, veille, compteurs : aucune n'a été choisie à partir d'un besoin établi. Le Pomodoro, la veille et les compteurs ne servent aucun des cinq besoins trouvés ensuite.
5. **Santé et Juridique du mauvais côté.** Score, tendances, « conseiller » : ce que l'étude du besoin range dans la zone risquée. Et un suivi à saisie quotidienne, que les gens abandonnent en masse (chiffre lu dans un article tiers, pas dans l'étude d'origine).
6. **Des fonctions affichées qui ne marchent pas.** Recherche, briefing, section vide. Chaque écran doit être chargé et essayé avant d'être dit « fait ».

## Partie 2 — L'écart entre la vision et l'existant

### Chaque point de la vision, face au code

| Point de `docs/VISION.md` | État | Preuve |
|---|---|---|
| Déposer une pensée par la voix | ABSENT | Aucune occurrence de `SpeechRecognition`, `getUserMedia`, `MediaRecorder`. |
| Déposer une pensée par le texte, sans rien ranger | ABSENT | Les seuls champs libres sont liés à un monde choisi à la main (`:1087`, `:1230`, `:1238`). |
| Elle ne se perd jamais | PARTIEL | Gardée sur l'appareil et synchronisée (`:2408-2427`, `:1867`). Mais un conflit entre appareils remplace tout l'état (`:1932-1934`) et rien ne ramène une note vers Rayan. |
| La tête ne garde que le nécessaire | ABSENT | Aucun écran ne dit « voici la seule chose à faire ». L'accueil montre des compteurs (`:1061-1066`). |
| L'IA range la pensée et la relie au bon projet | ABSENT | Les quatre appels à Claude sont des discussions. Le monde se choisit par des boutons (`:2565`). |
| L'IA la développe et dit quoi en faire | PARTIEL | Seulement en posant soi-même la question dans le panneau d'un monde (`:4167`). Rien ne devient une étape. |
| Plus rien en dur | ABSENT | `WORLDS` (`:1969-2298`), `POLES` (`:2301-2327`), `JUR_SECTIONS` (`:3159`), « Rayan » sur 14 lignes, « Valence » sur 61, `manifest.json:4`. |
| Geste central : pensée rangée, étape précise, moment | ABSENT | Pas d'objet « pensée ». Une tâche est `{id, t}` (`:3601`) : aucun moment. |
| Le retour : point du matin | ABSENT | L'accueil affiche « Matin / Après-midi » et la date (`:2483-2486`). `autoWorldBriefing` n'est jamais appelée. |
| Le retour : revue de la semaine | ABSENT | Aucun code. |
| Projets et « Ma vie » séparés, style plus calme | PARTIEL | Deux sections sur l'accueil (`:1069-1084`), mais même thème noir. |
| Santé : mémoire, échéances, documents, rendez-vous | ABSENT (c'est l'inverse) | Curseurs quotidiens, score, série, tendances, « conseiller santé » (`:2832-3156`). Seul le journal santé est conforme (`:3070`). |
| Juridique : idem | PARTIEL | Éléments avec échéance et chronologie conformes (`:3196-3322`). « Conseiller juridique » non conforme (`:3377`). Pas de documents. |
| Jamais d'avis médical ni juridique | ABSENT | Rôles donnés à Claude (`:3154`, `:3377`). Un avertissement côté Juridique seulement (`:1577`). |
| iPhone et Mac à égalité | PARTIEL | 8 blocs `@media`, mais Claude masqué sur iPhone et 42 zones tactiles trop petites sur 63. |
| Projet endormi : réveiller ou archiver | ABSENT | Aucun état de projet. `S.lastActive` (`:2626-2628`) n'a pas de date. |
| Feuille de route Fait / Maintenant / Ensuite / Cap | PARTIEL | La matière existe, en dur et éclatée (`tasks_done`, `priority`, `nextActions`, `mission`). Aucun écran. |
| Point d'étape daté | ABSENT | Une date dans un texte en dur (`:1974`). |
| Une seule prochaine étape, avec un moment | PARTIEL | « Action prioritaire » en dur (`:2671`) et étoile « focus » (`:3463`). Aucun moment. |
| Ce qui bloque | PARTIEL | Liste en dur + ajouts (`:2759`), sans date, sans état, sans suppression. |
| Claude présent avec le contexte du monde | PARTIEL | Sur Mac, avec 1 708 caractères de contexte en dur. Absent sur iPhone. |
| Design clair, niveau Apple | ABSENT | Thème noir unique (`:23-24`). 0 occurrence de `prefers-`. 136 tailles de police sur 298 sous 12 px. |
| Ni séries de jours ni notifications culpabilisantes | ABSENT | Série Santé (`:2920`), « Check-in du jour manquant » (`:2512`), « Résous maintenant. » (`:2493`). |
| Typographie de caractère pour les titres, police système pour le texte | ABSENT | Quatre familles chargées chez Google (`:19`) ; la police à chasse fixe sert de police principale (`docs/AUDIT.md`). |
| Pour Rayan d'abord, puis vendu à d'autres | ABSENT pour la suite | Un seul compte possible : `ARC_OWNER_ID` (`index.ts:72-77`), `shouldCreateUser: false` (`:1803`). |
| Premier critère : ouvert tous les jours pendant trente jours | ABSENT | Aucune mesure d'usage dans le code. |
| Liberté technique : reconstruire l'interface, garder le socle | ABSENT (non commencé) | Hypothèse confirmée par les preuves : voir « Reconstruire ou refondre » plus bas. |

### Inventaire : chaque écran et chaque fonction

Les notes d'étude comptent 50 éléments hors socle : 19 à supprimer, 20 à transformer, 8 à fusionner, 3 à garder mais à refaire. Aucun n'est gardé tel quel.

| Élément | Où | Verdict | Raison |
|---|---|---|---|
| **Accueil** | | | |
| En-tête (logo, « RAYAN · VALENCE », pastille de synchro) | `:1040-1055` | TRANSFORMER | Nom et ville en dur. La pastille de synchro est à garder. |
| Titre « Un cerveau. Sept espaces. » | `:1058` | TRANSFORMER | Doit se calculer. |
| Quatre compteurs | `:1061-1066`, `:2458-2500` | SUPPRIMER | Des compteurs ne disent pas quoi faire ; « 5 » est en dur. |
| Barre de progression et phrase de motivation | `:1068`, `:2468-2479` | SUPPRIMER | Le pourcentage dépend d'une liste en dur ; la phrase est tirée au sort. |
| Alerte « N bloquants. Résous maintenant. » | `:1060`, `:2491-2494` | SUPPRIMER | Bloquants sans date ; ton culpabilisant. |
| Cartes des mondes | `:1075`, `:2522-2562` | TRANSFORMER | Devient l'écran des projets. Le badge ne regarde que le nombre de bloquants. |
| Cartes des pôles | `:1083`, `:2502-2520` | TRANSFORMER | Devient « Ma vie ». Retirer « Check-in du jour manquant ». |
| Ajout rapide de tâche | `:1087`, `:2565-2573` | TRANSFORMER | Ancêtre du dépôt, mais il faut choisir le monde et rien n'est daté. |
| Veille et sources | `:1088-1089`, `:2329-2334` | SUPPRIMER | Figée ; le bouton ne cherche rien. |
| Section « Tes 5 projets » | `:1090-1091` | SUPPRIMER | Toujours vide. |
| Horloge `h-clock` | `:2452-2453` | SUPPRIMER | L'élément n'existe pas ; un minuteur tourne chaque seconde pour rien. |
| **Mondes** | | | |
| Tableau `WORLDS` | `:1969-2298` | TRANSFORMER | Devient des données. |
| Écran d'un monde (en-tête, anneau, 4 métriques) | `:1096-1168`, `:2594-2695` | TRANSFORMER | L'idée « on entre dans un monde » est gardée ; la mise en page est à refaire. |
| Chronomètre de visite | `:1109`, `:2610-2619` | SUPPRIMER | Jamais enregistré ni utilisé. |
| Boutons « Prod ↗ », « Contexte », « Code ↗ » | `:1110-1112` | FUSIONNER | Avec les liens du projet. |
| Mission | `:1171-1177` | TRANSFORMER | Devient le cap, modifiable. |
| Action prioritaire | `:1180-1195` | TRANSFORMER | Devient la prochaine étape, une seule, avec un moment. |
| Tâches | `:1198-1209`, `:2697-2754` | TRANSFORMER | Deviennent des étapes, avec moment et origine. |
| Badge d'échéance, poignée de glisser | `:2737-2747` | SUPPRIMER | Code mort. |
| Bloquants | `:1212-1219`, `:2756-2769` | TRANSFORMER | À garder comme objet, avec une date et un état. |
| Prochaines actions | `:1222-1225` | FUSIONNER | Avec la feuille de route (« Ensuite »). |
| Notes du monde, journal du monde | `:1228-1242` | FUSIONNER | Avec les pensées déposées dans le projet. |
| Copie automatique de Claude dans le journal | `:4145-4150` | SUPPRIMER | Mélange du texte de machine aux mots de Rayan. |
| Outils (liens) | `:1245-1248`, `:3719-3731` | TRANSFORMER | Garder les liens par projet ; remplacer les trois fenêtres `prompt()`. |
| Tiroir latéral | `:1692-1697`, `:3860-3941` | SUPPRIMER | Répète ce qui est à l'écran ; un bouton sans code. |
| **Travail sur une tâche** | | | |
| Cockpit par tâche | `:1602-1633`, `:3769-3812` | TRANSFORMER | La zone de travail par étape est utile. Retirer les 75 invites en dur (21 706 caractères). |
| Pomodoro | `:1610-1615`, `:4004-4021` | SUPPRIMER (ou plus tard) | Ne sert aucun des cinq besoins ; rien n'est enregistré. |
| War Room | `:1672-1691`, `:3819-3849` | FUSIONNER | Avec le cockpit : deux écrans pour un même besoin, briefing jamais envoyé. |
| **Recherche, clavier, arrivée** | | | |
| Recherche (Cmd+K) | `:1634-1636`, `:3980-3986` | TRANSFORMER | Cassée. À refaire plus tard, jamais comme entrée unique. |
| Raccourcis clavier | `:3654-3678` | GARDER (à refaire) | Utiles sur Mac. |
| Accueil d'arrivée | `:1637-1641`, `:4024-4036` | SUPPRIMER | Jamais affiché ; texte périmé. |
| Bouton flottant Claude | `:769`, `:873`, `:3647` | SUPPRIMER | Code mort. |
| **Santé** | | | |
| Check-in du jour (4 curseurs) | `:1363-1408`, `:3048-3068` | SUPPRIMER | Saisie quotidienne : point de rupture documenté. Données à archiver, pas à effacer. |
| Score sur 100 et libellé | `:2901-2918` | SUPPRIMER | C'est une interprétation de l'état de la personne. |
| Série de jours | `:2920-2931` | SUPPRIMER | Exclue par la vision. |
| Moyennes et graphique | `:2945-3042` | SUPPRIMER | Repérer une tendance est du côté risqué. |
| Habitudes du jour | `:1430-1441`, `:3079-3105` | SUPPRIMER | Saisie quotidienne ; code de clic en double. |
| Objectifs santé | `:1444-1451` | FUSIONNER | Avec les étapes de l'espace Santé. |
| Journal santé | `:1454-1461`, `:3070-3077` | TRANSFORMER | Seule brique conforme : devient la mémoire datée. |
| Export CSV | `:3325-3338` | TRANSFORMER | Garder un export, pour les notes et les échéances. |
| « Claude Santé — Conseiller bien-être » | `:1471-1500`, `:3133-3156` | TRANSFORMER | Rôle interdit. Remplacer par : retrouver ses notes, préparer un rendez-vous. |
| **Juridique** | | | |
| Quatre rubriques avec date d'échéance | `:3159-3265` | TRANSFORMER | Seule vraie notion d'échéance d'ARC (`:3254`) : base de l'échéancier. |
| Chronologie | `:3301-3322` | GARDER (à refaire) | Conforme : échéancier personnel. |
| Compteur « urgents » | `:3175-3194` | TRANSFORMER | Bogue ligne 3184. |
| Recherche dans le dossier, notes juridiques | `:1533-1555` | FUSIONNER | Avec la recherche générale et les pensées. |
| Export texte | `:3340-3360` | GARDER (à refaire) | L'export complet est un argument de l'étude du besoin. |
| « Claude Juridique — Conseiller personnel » | `:1565-1597`, `:3362-3379` | TRANSFORMER | « Dans votre cas… » est la zone réservée. |
| **Claude** | | | |
| Quatre entrées (monde, cockpit, Santé, Juridique) | `:4044-4189` | TRANSFORMER | Une seule entrée par espace, avec le vrai contexte ; rôles posés côté serveur. |
| **Socle** | | | |
| Écran de connexion | `:1642-1671`, `:1743-1858` | GARDER | Récent, messages clairs. |
| Synchronisation | `:1706-1735`, `:1860-1955` | GARDER, règle à changer | La règle de conflit ne tient pas avec deux appareils. |
| État `S`, chargement, enregistrement | `:2337-2431` | GARDER, forme à changer | Voir Partie 3 b. |
| Export et import JSON | `:3382-3403` | GARDER, à durcir | L'import fusionne sans contrôle. |
| Proxy Claude | `supabase/functions/ARC-CLAUDE-PROXY/index.ts` | GARDER, à étendre | Voir Partie 3 c. |
| Service worker, manifeste, icônes | `sw.js`, `manifest.json` | GARDER | « Rayan » en dur dans le manifeste. |
| Utilitaires (`mdSafe`, `esc`, `uid`, `toast`, `fmtTs`) | `:2437-2447` | GARDER | Petits et justes. |

### Reconstruire ou refondre

**Recommandation : reconstruire l'interface, garder le socle.** L'hypothèse de la vision est confirmée par les preuves.

| Question | Constat | Preuve |
|---|---|---|
| Quelle part de l'affichage dépend de `WORLDS` ? | Presque tout : 28 références à `WORLDS`, 26 à `tasks_done` / `tasks_todo`. | `grep` |
| Quelle part du style survit ? | Très peu : thème noir unique, polices téléchargées, 136 tailles sous 12 px. | `:23-24` |
| Les écrans de la vision existent-ils ? | Non : ni Aujourd'hui, ni dépôt, ni feuille de route. | tableau ci-dessus |
| Le code d'affichage est-il sain ? | Non : recherche cassée, 6 fonctions mortes, actions en double, un écouteur de clics de 245 lignes (`:3406-3651`). | Partie 1 |
| Le socle est-il sain ? | Oui : refait le 4 octobre (`b97a938`). | `git log` |
| Y a-t-il des tests pour protéger une retouche ? | Non. | `git ls-files` |
| Y a-t-il beaucoup de données à préserver ? | Peu. La migration reste obligatoire. | `docs/VISION.md:27` (SUPPOSÉ) |

Retoucher sur place voudrait dire réécrire chaque fonction d'affichage, tout le style et tout le balisage, dans un fichier de 4 264 lignes sans test. On paierait le prix d'une reconstruction, plus le risque de casser le socle. « Reconstruire » ne veut pas dire changer d'hébergement, de base ou de fournisseur, ni ajouter un cadre logiciel.

**Ce qui est gardé** (environ 370 lignes de JavaScript sur 2 560, 420 avec les deux fonctions de migration, et 30 lignes de HTML sur 663) :

| Bloc | Lignes | Sort |
|---|---|---|
| Réglages Supabase, `sbInit` | `:1710-1735` | Tel quel. |
| Connexion (`getUID` à `authSignOut`) | `:1743-1835` | Tel quel. |
| `localSummary`, `authMakeReference` | `:1837-1858` | Garder ; adapter au nouveau schéma. |
| `setSyncUI` | `:1860-1865` | Tel quel. |
| `pushToCloud`, `schedulePush`, `pullFromCloud` | `:1867-1955` | Garder la structure. Remplacer la règle de conflit (`:1928-1942`). |
| `loadS`, `saveS`, enregistrement automatique | `:2356-2363`, `:2408-2431` | Garder ; nouvelle clé `arc_v3`. |
| `migrateWorlds`, `normalizeS` | `:2344-2354`, `:2366-2406` | Gardés dans le module de migration seulement. |
| `mdSafe`, `esc`, `uid`, `toast`, `fmtTs` | `:2437-2447` | Tels quels. |
| `claudeCall`, partie réseau | `:4056-4093` | Garder, séparée de l'affichage. |
| `createMsgEl`, `addChatMsg` | `:4212-4231` | Tels quels. |
| `exportData`, `importData` | `:3382-3403` | Garder ; durcir l'import. |
| Enregistrement du service worker | `:4255-4261` | Tel quel. |
| Balisage de l'écran de connexion | `:1642-1671` | Tel quel ; styles `:749-765` à repeindre. |

**Organisation proposée des fichiers** (sans étape de fabrication : pousser, c'est publier, comme aujourd'hui) :

```
index.html                 coquille de 60 à 100 lignes
css/base.css               variables, typographie, clair et sombre
css/ecrans.css             mises en page iPhone et Mac
js/main.js                 démarrage, navigation
js/socle/                  supabase.js  sync.js  etat.js  fusion.js  claude.js  util.js
js/donnees/                migration-v2.js  seed-v2.json (ancien contenu de WORLDS, lu par la migration seule)
js/ecrans/                 aujourdhui.js  depot.js  espaces.js  espace.js  route.js  vie.js  connexion.js
vendor/                    supabase.js  marked.min.js  purify.min.js (copies locales, versions figées)
sw.js                      liste de tous les fichiers ci-dessus
tests/                     migration.test.js  fusion.test.js (node --test)  fumee.py (Playwright)
```

Pour : rien à installer, des fichiers de 100 à 300 lignes plus sûrs à modifier, des fonctions testables avec Node seul. Contre : la liste de cache du service worker se tient à la main (prévoir un petit script qui l'écrit, et un test qui vérifie qu'il a été lancé) ; les bibliothèques se mettent à jour à la main. Les modules sont pris en charge par Safari : SUPPOSÉ (standard ancien, non testé sur les appareils de Rayan). Passer à une étape de fabrication seulement au-delà d'une trentaine de modules, et le dire à Rayan.

## Partie 3 — Ce qu'il faut apporter, niveau par niveau

### a. Produit

**État actuel.** Un tableau de bord. Pas de dépôt, pas de retour, pas d'état « endormi ».

**Ce qui manque et ce qui est proposé.**

- **Le geste central, en quatre temps.** Déposer (deux appuis, rien à choisir). Voir « C'est déposé » tout de suite, sans attendre le réseau ni l'IA. Retrouver la pensée rangée : un projet, une ou plusieurs étapes, un moment proposé. Corriger en un geste, ou fermer.
- **Une seule prochaine étape par projet, avec un moment.** De préférence une situation (« demain, en ouvrant le Mac ») plutôt qu'une date seule.
- **Le retour, à heure convenue.** Un point du matin que Rayan a choisi : une action faisable, pas une carte à lire. Il doit être visible à l'ouverture d'ARC, car une notification n'est jamais garantie. La journée se termine sur « rien d'autre aujourd'hui », jamais sur une liste de retards.
- **Comment le point arrive.** Les notifications web marchent sur iPhone depuis iOS 16.4, seulement pour une application ajoutée à l'écran d'accueil, et la demande d'autorisation doit suivre un appui sur un bouton (PROUVÉ, WebKit). L'envoi se programme côté Supabase (une tâche planifiée qui appelle une fonction). Un e-mail quotidien par un service d'envoi reste le filet de sécurité le plus simple. Non vérifié : qu'une page Apple de 2026 confirme ce fonctionnement dans l'Union européenne ; la durée de vie d'un abonnement aux notifications sur iOS. Un essai de cinq minutes sur l'iPhone de Rayan tranche.
- **La revue de la semaine.** Dix minutes, préparée par l'IA, validée par Rayan : ce qui a avancé, ce qui est muet, ce qu'on arrête. Courte et facultative.
- **Les projets endormis.** « Endormi » se calcule (dernière activité plus vieille qu'un seuil réglable, 30 jours proposés). ARC propose alors de réveiller ou d'archiver. Cela ne devient un état qu'après un geste de Rayan. Ce qui est périmé sort de la vue.
- **Ce qu'ARC ne fait pas.** Ni série de jours, ni compteur de retards, ni alerte devinée, ni message générique.

**Niveau de preuve.**

- Noter une intention fait passer l'oubli d'environ 45 % à environ 5 % en laboratoire : PROUVÉ, répliqué. Limite : tâches de quelques secondes à quelques minutes ; la vie réelle peut se comporter autrement.
- Un plan précis fait taire la pensée, même si la tâche n'est pas faite : PROBABLE. Petits groupes, aucune réplication indépendante trouvée. Le plan réduit les pensées, pas l'anxiété mesurée.
- Une tâche sans heure est abandonnée à 61,8 %, contre 31,5 % avec une heure : PROUVÉ avec réserves (prépublication non relue, un auteur travaille chez l'éditeur de l'outil).
- La forme « quand telle situation, je fais telle chose » aide plus qu'une simple date : PROUVÉ ; les chiffres d'effet viennent d'un résumé, la page de l'éditeur n'a pas pu être ouverte.
- Un retour convenu vaut mieux qu'une alerte devinée : PROBABLE. OpenAI a retiré son point du matin deviné (PROUVÉ) ; les meilleurs modèles choisissent le bon moment dans environ 64 % des cas (PROUVÉ, prépublication).
- La revue de la semaine « jamais faite » comme cause d'abandon : SUPPOSÉ, aucune mesure trouvée.
- Des étapes proposées et jamais suivies pourraient faire monter le stress : SUPPOSÉ. Seul le titre de l'étude a été lu. Parade : une étape à la fois, « pas maintenant » jamais puni, abandon possible.
- **Qu'un plan écrit par une IA soulage autant qu'un plan écrit par soi : jamais testé.** C'est l'hypothèse centrale. L'usage de Rayan peut produire cette preuve, s'il est mesuré (Partie 4).

### b. Modèle de données

**État actuel** (PROUVÉ). Le contenu des mondes est dans le code. L'état `S` garde des coches et des ajouts, rangés par numéro de monde (0 à 4). Ce numéro est une position : Trading était le n° 4, ATLAS l'est maintenant. Une tâche est `{id, t}`. En ligne : une ligne par compte, tout `S` dans un seul bloc JSON. État vierge mesuré : 2 894 caractères. La taille réelle de l'état de Rayan n'a pas été mesurée.

**Ce qui manque.** Un objet « pensée ». Un moment sur une étape. Des identifiants stables. Une fusion entre appareils. Des réglages à la place du nom et de la ville en dur.

**Proposition : l'état version 3.** Cinq principes. Plus aucun numéro de monde : chaque objet a un identifiant texte stable. Des collections rangées par identifiant. Chaque élément porte `createdAt`, `updatedAt` et `deletedAt` : on ne supprime pas, on marque. Les mots d'origine d'une pensée ne sont jamais modifiés ; ce que l'IA ajoute est rangé à côté. Rien de propre à Rayan dans le code.

```json
{ "meta": { "schema": 3, "updatedAt": "…", "migratedFrom": 2 },
  "settings": { "ownerName": "Rayan", "city": "Valence", "timezone": "Europe/Paris",
                "morningPoint": { "enabled": true, "time": "08:00" },
                "weeklyReview": { "enabled": true, "weekday": 7, "time": "18:00" },
                "dormantAfterDays": 30, "aiConsent": { "sendToModel": true, "at": "…" } },
  "spaces": {}, "thoughts": {}, "steps": {}, "deadlines": {}, "phases": {}, "reports": {},
  "blockers": {}, "chats": {}, "archive": { "trading": {}, "health": {} }, "legacy": {} }
```

```json
{ "id": "sp_aryan", "kind": "project", "name": "ARYAN", "color": "#ff6b35", "motif": "route",
  "cap": "Le premier vrai client", "status": "active", "lastActivityAt": "2026-10-04T22:10:00+02:00",
  "links": [ { "id": "lk_1", "name": "Prod", "url": "https://aryan-drab.vercel.app" } ], "legacyWid": 0 }
```

`kind` vaut `project` ou `life`. `status` vaut `active`, `dormant` ou `archived`. Un espace « Ma vie » a `"kind": "life"`, un gabarit `health` ou `legal`, pas de cap ni de phases.

```json
{ "id": "th_01JB2Q7K3M", "source": "voice", "device": "iphone", "createdAt": "2026-10-05T21:14:03+02:00",
  "text": "Il faut que je recale Atlas avec la réalité : l'immatriculation, les pages légales et l'achat en mode test.",
  "status": "filed", "spaceId": "sp_atlas", "filedBy": "ai", "confirmedByUser": false,
  "ai": { "summary": "Recaler Atlas : 3 points à vérifier" },
  "stepIds": ["st_01JB2Q7M1A", "st_01JB2Q7M1B", "st_01JB2Q7M1C"], "lastSurfacedAt": null }
```

`status` d'une pensée : `inbox` (déposée, pas encore rangée), `filed`, `done`, `dropped`. `lastSurfacedAt` sert à la garantie « rien ne dort ». Le son et les photos ne vont pas dans l'état : seulement une référence.

```json
{ "id": "st_01JB2Q7M1A", "spaceId": "sp_atlas", "text": "Vérifier où en est l'immatriculation",
  "moment": { "type": "situation", "text": "Demain, en ouvrant le Mac", "notBefore": "2026-10-06" },
  "status": "todo", "isNext": true, "origin": "thought", "originThoughtId": "th_01JB2Q7K3M",
  "proposedBy": "ai", "acceptedByUser": true, "work": "" }
```

`moment` a trois formes : vide, une date et une heure (`"type": "datetime"`), ou une situation. Une seule étape par espace porte `isNext: true`. Les autres objets (échéance, phase de feuille de route, point d'étape, bloquant) suivent le même moule ; leur forme complète est dans `docs/notes/partie2_inventaire_modele_technique.md`, section C.4. Deux règles à retenir : une date légale est toujours posée par la personne (`setBy: "user"`), avec un lien officiel ; un bloquant repris de l'ancien code a `since: null`, on n'invente pas sa date.

**Plan de migration sans perte (version 2 vers version 3).**

1. **Sauvegarder avant d'écrire.** Le nouvel état s'écrit sous une nouvelle clé `arc_v3`. La clé `arc_v2` n'est ni modifiée ni effacée. Proposer une fois le téléchargement du fichier JSON. En ligne, avec l'accord de Rayan, copier la ligne `arc_data` vers `arc_data_archive` (requête à lancer par Rayan).
2. **Des identifiants déterministes.** La migration fabrique les mêmes identifiants sur chaque appareil (`sp_aryan`, `st_w0_a22`, `th_w0_j_1759600000000`). Migrer deux fois, ou sur deux appareils, donne le même résultat, sans doublon.
3. **Faire correspondre chaque champ.** Les tâches deviennent des étapes ; c'est la coche de Rayan (`S.tasks`) qui fait foi, pas la liste du code. Les notes et le journal deviennent des pensées. Les copies « Claude: … » du journal vont à part (`legacy.aiCaptures`). Les éléments juridiques datés deviennent des échéances. Les check-ins et habitudes de santé vont dans `archive.health` : fonction retirée, données gardées et exportables. Les 75 invites en dur sont gardées dans `legacy`, plus affichées. Les dates peu fiables (`S.taskDates`) sont marquées approximatives. Le tableau complet, champ par champ, est dans la même note, section C.5.
4. **Contrôler.** Compter et comparer : nombre d'étapes, de coches, d'entrées de journal, d'éléments juridiques. Afficher le résultat à Rayan (« N étapes, N faites, 0 perdue »). Si un compte ne tombe pas juste : ne rien écrire, garder la version 2.
5. **Sortir le contenu du code.** L'ancien `WORLDS` vit dans `js/donnees/seed-v2.json`, lu par la migration seule. Un nouveau compte part de zéro.

Le cas dangereux : un appareil qui a encore l'ancien code (onglet resté ouvert). Il lit la ligne version 3, la mélange à son état, puis la renvoie en entier à sa première action (`:1932-1934`, `:1874`). PROUVÉ par lecture. Parades : le nouveau code fusionne toujours élément par élément ; il rejoue la migration s'il voit qu'un ancien code a écrit ; le jour de la bascule, recharger ARC une fois sur chaque appareil.

**La règle de conflit.** Aujourd'hui (PROUVÉ, `:1929-1941`) : une seule date pour tout l'état, la dernière action gagne, et tout l'état est remplacé. L'envoi ne regarde jamais ce qui est en ligne. Ouvrir un monde compte comme une action (`:2629`, `:2828`, `:2410`). Scénario de perte, PROBABLE (lu, non rejoué) : ARC reste ouvert sur le Mac ; Rayan dépose trois pensées sur l'iPhone ; il clique sur un monde sur le Mac ; le Mac envoie son état plus ancien ; les trois pensées sont écrasées en ligne, puis sur l'iPhone.

Proposition, en deux niveaux :

- **Les pensées sortent du bloc.** Une table `thoughts` où l'on ne fait qu'ajouter : `id` (créé sur l'appareil avec `crypto.randomUUID()`, clé primaire), `user_id`, `created_at` (heure de l'appareil), `received_at` (heure du serveur), `source`, `raw_text`, `audio_path`, `status`. Règles d'accès : lire et ajouter ses propres lignes ; aucune règle pour modifier ou supprimer le texte brut. Une pensée déposée ne peut plus être écrasée par un autre appareil. Renvoyer deux fois la même pensée donne un conflit de clé, traité comme un succès : la file d'attente hors ligne devient sûre. Le résultat du rangement (projet, résumé, étapes) est rangé à côté, relié par l'identifiant de la pensée ; où exactement (dans la collection `thoughts` de l'état, ou dans une table d'éléments) reste à trancher à la construction, comme le sort de la colonne `status`. Les deux notes d'étude ne disent pas tout à fait la même chose sur ce point : l'une garde les pensées dans l'état, l'autre les sort dans une table. Ce document retient la table pour le texte brut. Une nouvelle table demande l'accord de Rayan.
- **Le reste de l'état fusionne élément par élément.** Union des deux côtés ; pour un même identifiant, le `updatedAt` le plus récent gagne ; une suppression est une marque, jamais une absence. Écriture conditionnelle : « mets à jour seulement si `updated_at` vaut encore ce que j'ai lu » ; sinon relire, fusionner, réessayer. La colonne existe déjà. PROBABLE (à tester). Ouvrir un écran ne compte plus comme une action.

Plus tard, si le volume monte : une ligne par élément au lieu d'un bloc. Pas nécessaire pour commencer.

**Autres risques.** `localStorage` est limité à environ 5 Mo par site : SUPPOSÉ (valeur usuelle, non mesurée). À 10 pensées par jour, environ 2 Mo par an : prévoir le passage à IndexedDB (stockage du navigateur sans cette limite) avant 1 Mo. Quand le stockage est plein aujourd'hui, l'enregistrement peut être perdu avec un simple avertissement de console (`:2418-2425`, PROUVÉ). Un seul bloc par compte, sans historique : une sauvegarde quotidienne côté serveur serait une ceinture de sécurité, à décider avec Rayan.

### c. Intelligence artificielle

**État actuel** (PROUVÉ). Quatre entrées vers Claude, toutes des discussions.

| Entrée | Contexte envoyé | Historique | Enregistré |
|---|---|---|---|
| Panneau d'un monde (`:4167-4189`) | Mission, champ `context` en dur, 6 tâches faites, 6 à faire | 10 derniers messages du monde | Oui, 100 au plus |
| Cockpit (`:3531`) | Aucun | Aucun | Non |
| Santé (`:3133-3156`) | Chiffres du jour, rôle « conseiller santé » | Aucun | Non |
| Juridique (`:3362-3379`) | Rôle « conseiller juridique et administratif personnel » | Aucun | Non |

Pour ARYAN, le message de cadrage fait 1 708 caractères, dont 660 de contexte en dur. Il se termine par : « identifie les risques en premier, sois direct sans filtre. Réponds en français, 3-5 phrases. » Claude ne reçoit ni les bloquants, ni les notes, ni le journal, ni les tâches ajoutées par Rayan, ni les dates. Les six tâches « accomplies » envoyées sont toujours les six plus anciennes.

**La réponse hors sujet du 4 octobre.** À « Dis-moi bonjour en une phrase », Claude a répondu par un paragraphe sur l'authentification multi-rôles. Ce fait figure sur une capture d'écran de Rayan (site en ligne, 4 octobre, 20 h 59) ; il n'a pas été rejoué. Cause non établie. Ce que le code montre : chaque question part avec le contexte du projet, la consigne « identifie les risques en premier » et les dix derniers messages du monde, que Rayan ne voit plus à l'écran. Que cela suffise à expliquer la réponse : SUPPOSÉ. Leçon sûre : la consigne et l'historique doivent être visibles, maîtrisés, et adaptés à la demande.

**Ce qu'il faut envoyer.** Pour ranger une pensée : la pensée, et la liste des espaces (nom, cap, prochaine étape). Pour discuter dans un projet : le cap, le dernier point d'étape daté, la prochaine étape, ce qui bloque avec ses dates, les pensées récentes. Pour le point du matin : les étapes du jour et les échéances proches.

**Le rangement automatique et sa correction.**

- Le proxy reçoit un appel nommé, par exemple `tache: "ranger"` avec `{ pensee, espaces[] }`. Il écrit lui-même la consigne et impose le format de sortie : espace choisi, étapes, moment proposé, degré de confiance. La page ne peut pas changer la consigne.
- **Sorties structurées.** L'API Claude garantit un JSON valide et conforme à un schéma (`output_config.format`, `type: "json_schema"`). PROUVÉ (documentation lue le 5 octobre). Limites : pas de bornes de longueur ou de valeur ; 24 paramètres optionnels au plus ; réponse possiblement incomplète si le plafond de jetons est atteint ; un refus peut sortir du schéma.
- **Découper une pensée.** Une pensée peut donner plusieurs étapes (trois dans l'exemple des maquettes). Les mots d'origine restent intacts ; les étapes pointent vers la pensée. Une seule devient « la prochaine » ; les autres vont dans « Ensuite ».
- **Corriger.** Chaque rangement montre « Corriger » et une ligne « Pourquoi » repliée. Si l'IA hésite entre deux projets, elle le dit en toutes lettres et propose les deux ; pas de pourcentage. Après chaque action de l'IA, « Annuler » reste disponible quelques secondes. Une date ou un montant extrait est marqué « à vérifier » ; aucun rappel n'est programmé sur une date que Rayan n'a pas vue. Pouvoir modifier le résultat d'un algorithme augmente son adoption : PROUVÉ (référence citée de mémoire dans `docs/PSYCHOLOGIE-DESIGN.md`, lien non rouvert).
- **Si Claude ne répond pas**, la pensée reste déposée, marquée « à ranger », et sera rangée plus tard.
- La justesse du rangement automatique n'est mesurée par personne chez les concurrents. ARC doit mesurer la sienne : part des rangements corrigés.

**Le coût par mois, avec le calcul.** Prix lus le 5 octobre sur la page officielle (page non datée), par million de jetons, entrée / sortie : Haiku 4.5, 1 $ / 5 $ ; Sonnet 5.5, 2 $ / 10 $ ; Opus 5.5, 4 $ / 20 $. PROUVÉ. Hypothèses (non mesurées) : un dépôt = 1 500 jetons d'entrée et 300 de sortie ; un point du matin = 6 000 et 600 ; 15 dépôts par jour ; 30 jours ; sans cache.

- Volume : 450 dépôts et 30 points, soit 855 000 jetons d'entrée et 153 000 de sortie.
- Haiku 4.5 : un dépôt 0,0015 + 0,0015 = 0,003 $ ; un point 0,006 + 0,003 = 0,009 $ ; mois 450 × 0,003 + 30 × 0,009 = 1,35 + 0,27 = **1,62 $**.
- Sonnet 5.5 : un dépôt 0,006 $ ; un point 0,018 $ ; mois 2,70 + 0,54 = **3,24 $**. Opus 5.5 : **6,48 $**.
- Avec la voix transcrite sur un serveur (450 dépôts d'une minute à 0,003 $ la minute, soit 1,35 $) : environ **4,60 $ par mois** avec Sonnet 5.5.
- Le cache change peu à cette échelle : Haiku 4.5 ne met en cache qu'à partir de 4 096 jetons. Le surcoût en jetons du schéma JSON n'a pas été mesuré.

Proposition : Haiku 4.5 avec schéma strict pour ranger, et mesurer ; Sonnet 5.5 pour le point du matin si la qualité manque. L'API Claude n'accepte pas le son (texte et image seulement, PROUVÉ) : il faut transcrire avant.

**Les garde-fous Santé et Juridique.** Aujourd'hui les rôles « conseiller » sont écrits dans la page (`:3154`, `:3377`). Ils doivent être posés dans le proxy, hors de portée de la page : mémoire, échéances, préparation ; jamais d'avis sur le cas de la personne ; renvoi vers un professionnel ; aucune date, aucun montant, aucun taux légal sans source officielle datée. Dans ces deux espaces, la proposition de l'IA demande une validation explicite. Le texte d'origine est gardé à côté de toute version réécrite. Pourquoi : dans un essai de 1 298 personnes, celles aidées par des modèles ne trouvent la bonne affection que dans moins de 34,5 % des cas, pas mieux que le groupe témoin (PROUVÉ). En droit, les modèles généralistes inventent dans 58 à 88 % des cas sur des questions de jurisprudence américaine (PROUVÉ, lu dans une synthèse et non dans les études ; rien sur le droit français ni sur les modèles Claude récents).

**Ce que le proxy doit changer.** État actuel (PROUVÉ, `supabase/functions/ARC-CLAUDE-PROXY/index.ts`) : un seul compte (`ARC_OWNER_ID`, lignes 74, 91-94), un seul modèle (ligne 14), 1 500 jetons de réponse, 40 messages au plus, aucune limite sur la taille de ce qui entre, aucun compteur. Seuls `model`, `max_tokens`, `messages` et `system` en texte sont transmis (lignes 111-112).

| Besoin | Changement |
|---|---|
| Contexte plus large, coût maîtrisé | Plafonner la taille d'entrée et refuser clairement au-delà. Accepter `system` en blocs (aujourd'hui retiré sans avertissement). Lire et consigner `usage`. |
| Rangement fiable | Appels nommés côté serveur, consigne et format écrits par le proxy. Un second modèle autorisé, moins cher. |
| Garde-fous Santé et Juridique | Consignes posées dans le proxy. |
| Limites par compte | Table d'usage (compte, jour, appels, jetons). Refus 429 avec un message lisible. Nouvelle table : accord de Rayan. |
| Robustesse | Un délai maximal sur l'appel à Anthropic (aucun aujourd'hui, ligne 116). |
| Plus d'un compte, plus tard | Liste de comptes autorisés avec quota ; origines lues dans un secret. |
| Image ou son, plus tard | Blocs `image` acceptés ; une fonction séparée pour le son. |

À garder : aucun secret dans le fichier, erreurs marquées `source: "arc-proxy"`, journaux sans jeton ni identifiant complet.

### d. Capture

**État actuel.** Aucune entrée vocale, aucune boîte de dépôt, aucune file d'attente hors ligne, aucune photo. PROUVÉ.

**La voix : le chemin recommandé.**

1. **Niveau 1, tout de suite : un champ de texte bien placé, et la dictée du clavier de l'iPhone.** Aucun code, aucune autorisation web, aucun coût. Selon le réglage de l'appareil, la dictée est traitée sur l'iPhone ou sur les serveurs d'Apple (PROUVÉ, page Apple du 14 septembre 2026). Limite : le son n'est pas gardé, donc pas de « Réécouter ». Non vérifié : que le français soit traité sur l'appareil pour le modèle de Rayan.
2. **Niveau 2, plus tard : un bouton micro qui enregistre** (`getUserMedia` + `MediaRecorder`, présents dans Safari iOS depuis la version 14, PROUVÉ) et envoie le fichier à une fonction Supabase pour transcription. Demander `audio/mp4` d'abord, tester avec `isTypeSupported`.
3. **À éviter : la reconnaissance vocale du navigateur** (`webkitSpeechRecognition`). L'équipe WebKit écrit qu'elle n'est pas disponible dans une application ajoutée à l'écran d'accueil (bogue 225298 ; dernier commentaire en mars 2025, sans annonce de correction). PROUVÉ pour cette réponse ; **non vérifié sous iOS 26 ou 27**. Conséquence : la transcription en direct de la maquette `Ecoute` n'est pas acquise.

Autre risque : dans une application installée, l'autorisation du micro serait redemandée après fermeture (bogue WebKit 215884, témoignages jusqu'à iOS 18.5). SUPPOSÉ pour iOS 26 et 27. C'est une raison de plus pour garder la dictée du clavier comme chemin principal.

Sur l'intérêt de la voix : dicter serait environ trois fois plus rapide que taper (PROBABLE : 32 participants, anglais et mandarin, pièce calme, chiffres cités de mémoire). Aucune étude ne mesure l'effet d'une capture par la voix. Les gens évitent de dicter du privé en public (PROBABLE) : aucune fonction ne doit dépendre de la voix, et Santé et Juridique s'ouvrent au clavier.

**Le choix de la transcription (pour le niveau 2).** Un clip d'une à deux minutes coûte entre 0,1 et 2 centimes selon le service. Prix lus le 5 octobre sur les pages officielles :

| Service | Prix par minute | Europe | Remarque |
|---|---|---|---|
| Mistral Voxtral Mini Transcribe 2 | 0,003 $ | Données hébergées dans l'UE par défaut (PROUVÉ) | Français dans la liste. **Choix proposé.** |
| Deepgram Nova-3 | 0,0043 $ | Point d'accès européen (PROUVÉ) | Second choix. |
| OpenAI gpt-4o-mini-transcribe | 0,003 $ | Point d'accès européen sous conditions ; supplément de 10 % sur les modèles récents | |
| Groq Whisper Large v3 Turbo | 0,00067 $ | Aucun hébergement UE vérifié | Le moins cher. |
| Gladia Starter | 0,0102 $ | Hébergeur français par défaut | Offre gratuite : le son peut servir à l'entraînement. |

Non vérifié : la qualité en français (aucun comparatif indépendant lu ; à juger sur dix dépôts réels de Rayan) ; les formats acceptés par Mistral, OpenAI et Deepgram pour le MP4 de Safari ; la taille maximale d'une requête vers une fonction Supabase (non documentée). Plan B sûr : envoyer le son dans Supabase Storage (50 Mo par fichier, PROUVÉ), puis le lire depuis la fonction. Environ 1 % des transcriptions d'un modèle courant contenaient des phrases inventées (PROUVÉ) : garder le texte ou le son d'origine.

**La file d'attente hors ligne.** Safari n'a pas d'envoi en arrière-plan (`SyncManager` absent, PROUVÉ). Chaque dépôt est donc écrit d'abord sur l'appareil (IndexedDB) avec son identifiant et un état « en attente ». L'envoi est tenté tout de suite, puis à chaque ouverture, à chaque retour au premier plan et au retour du réseau. Limite à afficher clairement : « 2 pensées en attente d'envoi ». Appeler `navigator.storage.persist()` une fois, en mode installé. Safari efface le stockage d'un site après sept jours d'usage de Safari sans visite ; une application de l'écran d'accueil a son propre compteur, remis à zéro à chaque usage (PROUVÉ, texte WebKit ; un guide tiers dit le contraire, non tranché par un test). Sans connexion à un compte, rien ne protège les données si l'appareil les efface.

**L'accès rapide : un raccourci Apple.** Sur iPhone, ni le partage vers une application web (`share_target`) ni les raccourcis du manifeste ne marchent (PROUVÉ). Le meilleur accès est un raccourci de l'app Raccourcis : il demande ou dicte un texte, puis l'envoie par HTTPS à une fonction Supabase. Il se lance par le bouton Action, Siri, un double tap au dos ou le centre de contrôle (PROUVÉ). Le dépôt se fait sans ouvrir ARC. Il faut un jeton à part, par utilisateur, révocable, et une fonction séparée du proxy Claude. L'action « Dicter du texte » et l'ajout d'en-têtes HTTP dans un raccourci sont SUPPOSÉS (mémoire, la page Apple lue ne les décrit pas). Sur Mac : « Ajouter au Dock » (macOS 14 ou plus), puis un raccourci clavier global.

**La photo d'un document.** Faisable : un champ fichier ouvre l'appareil photo sur iPhone (PROUVÉ). Claude lit une image de 1 000 × 1 000 px pour 1 296 jetons, soit 0,0013 $ avec Haiku 4.5. Réduire l'image dans le navigateur avant envoi ; la garder dans un espace de stockage privé, un dossier par compte. SUPPOSÉ : la conversion des photos HEIC en JPEG par Safari. **À ne pas faire pour des documents médicaux tant que la question de l'hébergement de données de santé n'est pas tranchée** (voir g).

### e. Design

**État actuel.** Thème noir unique, 83 textes de l'accueil sur 121 sous 12 px, aucune prise en compte du mode clair ni de « réduire les animations ». Rien n'en survit. Les neuf maquettes du 5 octobre sont la base de travail. Leur revue a été faite sur un rendu Chromium avec la vraie police de titres ; la police de texte retombait sur Inter, pas sur San Francisco. Rien n'a été vu sur un iPhone.

**Verdict sur les neuf maquettes.** La direction est bonne : la demande de Rayan (couleur, relief, envie) est tenue sur 7 écrans sur 9. Le défaut principal est la lisibilité sur la couleur : 22 textes sous le seuil de contraste dans leur pire zone, dont 12 sur toute leur surface (mesuré sur les pixels rendus).

| Écran | Verdict | À corriger d'abord |
|---|---|---|
| `Main` (Aujourd'hui) | Garder. Une question, une action forte. | Décor posé sur le titre (contraste local 1,23). Liste « Ensuite » : trois boutons identiques. Aucun lien vers les projets. « Rien ne dort » contredit trois projets endormis. État vide non dessiné. |
| `Ecoute` | Le meilleur écran. À garder, **sous réserve du test de dictée sur iPhone**. | Texte provisoire à 2,99:1 (passer à `#6F6F74`). Mots de l'utilisateur en police système. États manquants : micro refusé, hors ligne, long silence. |
| `Capture` | Garder, alléger. | « Annuler le dépôt » à 7 px de « Fermer » : le voisinage le plus dangereux des neuf écrans. Neuf boutons alors que « le reste est facultatif ». Dire « Proposé : ». |
| `Espaces` | Garder. | Les projets endormis crient aussi fort que le projet actif. Pas de barre de dépôt. Carte FBA trop ocre. Trois mots pour une notion (projet, monde, espace). |
| `Espace` (ARYAN) | Garder : l'immersion est là. | Six textes sous le seuil. La liste passe sous la barre (21 px). Remplacer les compteurs par le cap et le point d'étape daté. Barre du bas inversée par rapport à `Main`. |
| `Route` | Garder. | Cinq textes sous le seuil dans le tiers haut. Anneau de case à 1,68:1. « 0 sur 2 » : préférer « il reste 2 étapes ». Jargon (« 928 tests verts », « Q1–Q4 »). |
| `Atlas` | Garder : cohérent avec ARYAN. | Six textes sous le seuil. Trois tuiles qui ressemblent à des boutons sans en être. Étiquette « Formation Amazon FBA » sur ATLAS, à clarifier avec Rayan. |
| `Sante` | Garder : état vide exemplaire, calme voulu. | Titre sans la police de caractère. Pas de barre de dépôt. Dernière ligne coupée (868 px pour 844). |
| `Mac` | **À redessiner.** C'est un autre produit : ni couleur, ni relief, ni la police de titres. | Même famille que le téléphone. Retirer la liste « Où en est chaque espace » de l'accueil. Revoir les largeurs sous 1 100 px. |

**Les dix corrections, par ordre d'importance.**

1. **Rendre le texte lisible sur la couleur.** Haut des dégradés assombri, halo plafonné à 15 % sous un texte, texte pâle interdit dans la zone haute et sur le verre. Avec la correction 2, cela règle 20 des 22 échecs.
2. **Sortir le décor de sous le texte.** Quatre écrans ont une pastille ou un trait posé sur des mots.
3. **Dessiner pour un vrai iPhone.** Zones sûres en haut (47 px) et en bas (34 px) : il reste 763 px utiles, 81 de moins que le cadre dessiné. Écrans qui défilent, `min-height` au lieu de `height`. À 200 % de taille de texte, 30 éléments coupent leur texte.
4. **Une navigation sur le téléphone, et la même barre de dépôt partout.**
5. **Figer le système avant de coder.** Les maquettes comptent 18 tailles de texte, 28 rayons, 19 ombres, 49 couleurs en hexadécimal.
6. **Alléger `Capture`** et écarter « Annuler le dépôt » de « Fermer ».
7. **Mettre les textes d'accord.** Un mot par notion (proposition de la revue : « projet » pour les cinq, « Ma vie » pour Santé et Juridique). Une formulation par étape. Un mot pour reporter.
8. **Faire porter du sens à la couleur.** Projet endormi : carte éteinte. Séparer le bleu des liens du bleu de Juridique.
9. **Refaire `Mac` dans la même famille.**
10. **Dessiner ce qui manque** : accueil vide, attente et échec du rangement, micro refusé, hors ligne, focus au clavier, mode sombre. Héberger la police de titres (77 Ko) au lieu d'appeler Google.

Hors classement, mais premier dans le temps : **tester la dictée sur un iPhone**. Si la transcription en direct ne marche pas dans l'application installée, `Ecoute` est à redessiner.

**Le système de design à figer.**

*Typographie.* Bricolage Grotesque pour ce qui nomme ; police système (`-apple-system, system-ui`) pour ce qui se lit et s'actionne. Tout en `rem`. Huit tailles :

| Rôle | Taille | Graisse | Interligne | Police |
|---|---|---|---|---|
| Nom de projet | `clamp(48px, 18vw, 72px)` | 800 | 0,92 | Bricolage, −0,04 em |
| Titre d'écran | 34 px | 800 | 1,05 | Bricolage, −0,03 em |
| Titre de section, nom sur carte | 28 px | 800 | 1,1 | Bricolage, −0,02 em |
| Prochaine étape | 22 px | 600 | 1,2 | Système |
| Texte courant, boutons | 17 px | 400 ; 600 pour les boutons | 1,4 | Système |
| Texte secondaire | 15 px | 400 | 1,4 | Système |
| Légende, pastille | 13 px | 400 ou 600 | 1,3 | Système |
| Étiquette en capitales | 13 px | 700 | 1,2 | Système, +0,08 em |

Plus aucun texte à 12 px. La prochaine étape en police système est un arbitrage de la revue ; garder Bricolage à cet endroit est défendable. À trancher par Rayan.

*Espacements.* Échelle de 4 : 4, 8, 12, 16, 20, 24, 32, 48. Marge d'écran 20, entre blocs 16, entre sections 32. Marge interne d'une carte 20. Hauteur minimale d'une ligne 56.

*Rayons.* 12 (pastilles, petits boutons), 16 (boutons), 24 (cartes, panneaux, listes), 28 (cartes d'action et de projet), et la pilule (barres flottantes, boutons ronds, moments). Rayon intérieur = rayon extérieur − marge.

*Relief : trois plans.*

| Plan | Sert à | Sur écran clair | Dans un projet |
|---|---|---|---|
| 0 — Fond | Le lieu | `#F5F5F7` uni | Dégradé du projet (angle unique : 160°), motif, halo |
| 1 — Posé | Ce qui se lit | Carte blanche, liseré `#E5E5EA` 1 px, sans ombre | Panneau de verre : blanc 14 %, liseré blanc 24 %, sans flou |
| 2 — Flottant | Ce qui s'actionne | Carte : ombre `0 20px 40px` de la teinte profonde à 35 %. Barre : `0 8px 30px rgba(0,0,0,0.10)` et flou 20 px | Carte blanche, ombre profonde à 45 %. Barre : fond profond à 55 %, flou 20 px |

Deux ombres, plus une petite (`0 6px 14px`, profonde à 30 %) pour un bouton posé sur une carte colorée. Une seule carte du plan 2 par écran. Aucun trait ni pastille du motif ne croise une ligne de texte. Flou d'arrière-plan seulement sur des éléments fixes et petits, avec une version opaque sous `prefers-reduced-transparency` et `prefers-contrast: more`.

*Couleurs par projet.* Cinq valeurs chacun. Les valeurs des maquettes qui échouaient sont corrigées. Rapports mesurés par calcul WCAG.

| Projet | Profond | Médian | Vif | Pâle | Texte sur pâle |
|---|---|---|---|---|---|
| ARYAN | `#5E1703` | `#A8300A` | `#C94D0A` (était `#E8590C` et `#F2590D`) | `#FFE2CF` | `#8A2606` |
| ATLAS | `#032E33` | `#075C63` | `#0A7C82` (était `#0B8A8F` et `#10A5A5`) | `#C9F5EF` | `#06666A` |
| FBA | `#5C3300` | `#8F5200` (était `#A15C00`) | `#A66703` (était `#C27803` et `#D99A00`) | `#FFEFC7` | `#7A4B00` |
| KITCHEN | `#5E0C2C` | `#B01E55` | `#D6336C` (le `#E8437F` disparaît) | `#FDE4EC` | `#A61E4D` |
| TELENEUF | `#26166B` | `#4C2DB0` | `#6741D9` (le `#7C5CF5` disparaît) | `#ECE7FD` | `#4C2DB0` |
| Santé | `#0F3D19` | `#1E6B2E` | `#2A853C` (était `#2B8A3E`) | `#E6F4E9` | `#1E6B2E` |
| Juridique | `#0A2A66` | `#1247A8` | `#1C5FD4` | `#E4EDFB` | `#1247A8` |

| Projet | Blanc sur profond | Blanc sur médian | Blanc sur vif | Pâle sur médian | Pâle sur vif | Texte sur pâle |
|---|---|---|---|---|---|---|
| ARYAN | 13,13 | 6,79 | 4,62 | 5,51 | 3,74 | 7,22 |
| ATLAS | 14,56 | 7,72 | 4,98 | 6,54 | 4,22 | 5,71 |
| FBA | 10,89 | 6,22 | 4,60 | 5,46 | 4,04 | 6,50 |
| KITCHEN | 13,42 | 6,64 | 4,62 | 5,53 | 3,84 | 6,00 |
| TELENEUF | 14,90 | 9,09 | 6,30 | 7,54 | 5,22 | 7,54 |
| Santé | 12,34 | 6,57 | 4,65 | 5,78 | 4,09 | 5,78 |
| Juridique | 13,67 | 8,43 | 5,77 | 7,14 | 4,90 | 7,14 |

Règles d'emploi : dégradé vif en haut, médian à 45 %, profond en bas. Texte principal sur couleur : blanc. Texte pâle seulement sur médian ou profond (cinq valeurs « pâle sur vif » sur sept sont sous 4,5). Sur panneau de verre : blanc uniquement. Les teintes vives d'origine peuvent rester dans le motif et le halo ; elles ne portent plus de texte.

Neutres : fond `#F5F5F7`, carte `#FFFFFF`, texte `#1D1D1F`, séparateur `#E5E5EA`, texte secondaire `#636366` (5,50, au lieu de `#6E6E73` à 4,66), texte provisoire `#6F6F74`, anneau de case `#8E8E93` (3,26, au lieu de `#C7C7CC` à 1,68).

Deux points à trancher. Le bleu `#1C5FD4` dit à la fois « cliquable » et « Juridique » : passer les actions neutres en `#1D1D1F`. En vision daltonienne simulée (mesure approximative), ARYAN et FBA se confondent, TELENEUF et Juridique aussi : écarter les teintes et toujours doubler la pastille par le nom.

*Quand la couleur.* Plein écran coloré : seulement à l'intérieur d'un projet. Écran clair : tout ce qui est transversal, avec une seule carte colorée, celle de l'étape en cours. Santé et Juridique : écran clair, en-tête en teinte pâle. Projet endormi : carte pâle, sans ombre.

*Composants.* Barre de dépôt (pilule, hauteur minimale 68, micro de 56, la même partout, calée sur `env(safe-area-inset-bottom)`). Carte de projet (deux états : éveillé, endormi). Carte d'action (une seule version : étiquette, étape en 22 px, « C'est fait », moment). Panneau de verre. Ligne de liste (toute la ligne est la cible, plus de bouton « Fixer un moment » par ligne). Pastille. Moment (« Proposé : » en plein, les autres en contour). Bouton (hauteur minimale 50). Bouton rond de 44. Navigation à deux destinations sur le téléphone, barre latérale sur Mac. Toute zone cliquable fait au moins 44 × 44 px.

*États manquants, à dessiner avec chaque composant* : vide, texte à 200 %, sombre, focus. Et pour les écrans : accueil vide, projet vide, chargement, erreur de Claude, hors ligne, non connecté, bouton appuyé, Juridique, un projet endormi vu de l'intérieur, la saisie au clavier, la recherche.

Les règles de fond (clair par défaut, sombre selon le système, pas de rouge pour « motiver », pas de statistiques d'office sur l'accueil) sont dans `docs/PSYCHOLOGIE-DESIGN.md`. La plupart de ses références sont citées de mémoire, liens non rouverts : il le signale ligne par ligne.

### f. Technique

**État actuel** (PROUVÉ). Un fichier de 294 028 octets : 1 014 lignes de style, 663 de balisage, 2 560 de JavaScript, dont 27 % de données en dur. 104 fonctions nommées, 28 variables globales, 6 minuteurs. Aucun test. Trois bibliothèques et quatre familles de polices chargées chez des tiers. 21 éléments cliquables inaccessibles au clavier (aucun `tabindex`).

**Proposition.**

- **Architecture.** Celle de la Partie 2 : des modules servis tels quels, le socle dans ses propres fichiers, les écrans à part. Pas de cadre logiciel, pas de changement d'hébergement.
- **Découpage, dans cet ordre.** D'abord le socle en modules, sans changer l'écran (même comportement, 0 erreur). Puis la migration et la fusion en fonctions pures avec leurs tests. Puis la nouvelle règle de synchronisation, testée avec deux navigateurs sur le même compte. Puis les nouveaux écrans, en commençant par le dépôt. L'ancien fichier est retiré quand les nouveaux écrans couvrent l'usage.
- **Tests.** `node --test` pour la migration et la fusion, sans rien installer. Un test de fumée Playwright à chaque changement : 0 erreur de console, tous les écrans s'ouvrent, `<div` et `</div>` en nombre égal. Les sorties de test sont collées dans la description de chaque PR.
- **Performance.** La pensée déposée apparaît en moins de 100 ms : écriture locale d'abord, rangement ensuite, sans bloquer. Plus de minuteur qui tourne pour rien. Une seule police téléchargée, hébergée dans le dépôt (77 Ko, licence OFL-1.1) : c'est un fichier ajouté, à dire à Rayan. Aujourd'hui tout l'état est réécrit et renvoyé en entier à chaque enregistrement : le découpage en éléments règle cela.
- **Hors ligne.** Le service worker actuel (réseau d'abord, cache `arc-v5`) sert la page hors ligne : PROBABLE (lu, non rejoué). Il n'a pas à porter la file d'attente des dépôts. Sa liste de fichiers doit suivre le découpage, et le nom du cache doit changer.
- **Sécurité.** Copies locales et figées des trois bibliothèques (`vendor/`) : cela règle la version flottante, l'absence de contrôle d'empreinte et l'écran de connexion qui disparaît si le serveur tiers tombe. Tout texte passe par `textContent` ou par une seule fonction d'échappement, sans exception. Refuser les liens `javascript:`. Poser une politique de sécurité de contenu. Supabase l'écrit : il sécurise l'infrastructure, l'éditeur sécurise son application (PROUVÉ).
- **Accessibilité.** De vrais boutons, des étiquettes reliées aux champs, un anneau de focus, et les quatre réglages du système pris en charge dès le début : `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-transparency`, `prefers-reduced-motion`. La prise en charge réelle de `prefers-reduced-transparency` par Safari n'a pas été vérifiée.
- **Sauvegarde et export.** Un export complet et lisible (JSON, plus un texte pour Santé et Juridique). Un import qui lit la version, migre, montre un résumé et demande confirmation. Une sauvegarde quotidienne de la ligne en ligne, à décider avec Rayan.
- **L'offre gratuite Supabase** met un projet en pause après une semaine sans activité (PROUVÉ). ARC a déjà dû être rallumé le 4 octobre. Ce que Supabase compte comme « activité » n'a pas été vérifié. L'offre Pro (25 $ par mois) ne se met jamais en pause.

### g. Données personnelles et droit

*Ce qui suit est une information de fond. Ce n'est pas un avis juridique. Chaque point est à faire confirmer par un avocat ou un délégué à la protection des données avant toute vente.*

**État actuel.** Rayan est le seul utilisateur. Les données de santé sont quatre nombres par jour et des notes, envoyés à Claude quand il pose une question dans Santé (`:3147-3154`).

**Ce qui change avec le dépôt de pensées.** Tout passe par un seul champ libre. Une pensée de santé ou de droit part chez le fournisseur du modèle avant tout tri. Le consentement doit donc couvrir l'envoi au modèle dès la saisie (PROBABLE) : c'est le rôle du réglage `aiConsent` du nouveau schéma. Tant que Rayan est seul, le risque est faible ; l'exemption « domestique » ne couvre pas clairement la partie professionnelle de son usage (PROBABLE). Dès la vente, l'éditeur devient responsable de traitement de données de santé : accord exprès de la personne (PROUVÉ, CNIL), analyse d'impact à tenir pour obligatoire (PROBABLE).

**La chaîne de traitement.**

| Maillon | Ce qui y passe | Où | Statut |
|---|---|---|---|
| Appareil | Tout l'état | iPhone, Mac | — |
| Dictée du clavier Apple | La voix | Sur l'appareil ou serveurs d'Apple, selon le réglage | PROUVÉ (page Apple) |
| Supabase | L'état, la session | Peut rester en Europe ; **la région réelle du projet ARC n'a pas été vérifiée** | À vérifier par Rayan |
| Anthropic (API Claude) | Le texte de chaque pensée et de chaque question | `inference_geo` vaut `global` ou `us` : **pas d'option Europe** | PROUVÉ (documentation lue le 5 octobre). Une région européenne existerait en passant par AWS Bedrock ou Google Vertex : sources tierces, non vérifié. |
| Transcription, si niveau 2 | Le son | Mistral : UE par défaut | PROUVÉ (aide Mistral) |
| Google Fonts, aujourd'hui | L'adresse IP à chaque visite | Tiers | Disparaît si la police est hébergée dans le dépôt |

Le contrat d'Anthropic inclut les clauses types européennes et une alerte sous 48 heures (PROUVÉ). La durée de conservation des requêtes n'a pas pu être vérifiée. Le cadre de transfert vers les États-Unis a été validé par le Tribunal de l'UE en septembre 2025 ; un pourvoi a été annoncé.

**La ligne de partage en santé et en droit.** Stocker, dater, rappeler, retrouver, préparer des questions, donner la règle générale avec le lien officiel : côté libre. Interpréter le cas de la personne (« vos symptômes évoquent… », « dans votre cas, vous avez droit à… », calculer un délai de recours) : côté réservé ou risqué. Un logiciel qui analyse les données d'une personne dans un but médical est un dispositif médical (PROUVÉ, guide européen MDCG 2019-11) ; ce que l'éditeur annonce compte aussi (règlement non relu). La consultation juridique « à titre habituel et rémunéré » est réservée (PROUVÉ) ; le Conseil national des barreaux a voté en décembre 2025 une définition qui vise les réponses personnalisées d'une IA : une proposition de la profession, pas la loi. Le besoin mesuré et la zone sûre tombent du même côté (PROBABLE).

**À confirmer avec un avocat avant de vendre.**

1. **Documents médicaux et hébergement de données de santé (HDS).** Des notes libres seraient hors champ selon la lecture dominante (PROBABLE). Déposer une ordonnance ou un compte rendu est le point gris. La position écrite de l'Agence du numérique en santé n'a pas été lue. Premier point à trancher.
2. **La frontière entre information et consultation juridique**, pour un produit vendu par abonnement. Aucune décision française trouvée sur un assistant juridique à base d'IA.
3. **Le transfert vers le fournisseur du modèle** : API directe hors d'Europe, ou chemin européen.
4. **L'analyse d'impact** et le texte du consentement.

À savoir aussi : l'obligation de dire à la personne qu'elle parle à une IA s'appliquerait depuis le 2 août 2026 (PROBABLE : sources secondaires, texte non relu). Déduire l'émotion à partir de la voix ferait basculer ARC en haut risque (PROBABLE) : ne jamais le faire.

### h. Alimentation automatique

**État actuel.** L'état d'un projet est recopié à la main dans le code. ARYAN avance dans des sessions Claude Code qui tiennent déjà un état écrit ; ARC n'en sait rien.

**Les options comparées** (analyse des notes de faisabilité, à partir de la documentation de Claude Code lue le 5 octobre) :

| | (a) Fichier dans le dépôt du projet, lu par ARC | (b) Envoi direct à une fonction Supabase | (c) Action GitHub à chaque envoi de code |
|---|---|---|---|
| Principe | Une commande fait écrire un petit JSON par Claude et l'enregistre dans le dépôt. | La même commande, puis un script l'envoie avec un secret par projet. | Un automate lit le fichier et l'envoie. |
| Coût | 0 $ | 0 $ | 0 $ en dépôt public ; minutes comptées en privé |
| Dépôt privé | ARC étant une page publique, il faudrait une fonction qui lit GitHub : on retombe sur (b), en plus compliqué. | Aucun jeton GitHub. | Secret rangé chez GitHub. |
| Bruit | Un commit par point d'étape. | Faible si le déclenchement est volontaire. | Un envoi à chaque fois, même sans nouveauté. |

**Recommandation : (b), avec un déclenchement volontaire.** Une commande personnelle `/point-etape` (un « skill » de Claude Code, avec `disable-model-invocation: true` pour que Claude ne la lance pas seul). Claude remplit un JSON court et fixe : projet, date, fait, en cours, bloquant, prochaine étape, preuve. La commande montre le JSON et demande confirmation. Un script l'envoie. La fonction vérifie le secret, valide le format, limite la taille et **ajoute** une ligne dans une table `points_etape`, sans jamais écraser. ARC affiche le dernier point par projet, avec sa date et sa source.

Pourquoi pas tout automatique : le déclencheur de fin de réponse (`Stop`) part des dizaines de fois par session ; celui de fin de session (`SessionEnd`) ne peut pas faire écrire Claude. Un point rédigé par un modèle peut annoncer « terminé » à tort : d'où le champ `preuve` et la relecture par Rayan. En attendant, un bouton « Coller un point d'étape » dans chaque projet suffit.

**Ce que Rayan doit faire.** Créer la commande une fois sur son Mac (`~/.claude/skills`). Générer un secret par projet ; le poser sur le Mac (variable d'environnement ou `settings.local.json`, jamais dans un fichier publié) et dans Supabase. Donner son accord projet par projet, et pour la nouvelle table. Non vérifié : si les dépôts ARYAN et Atlas sont publics ou privés ; le comportement dans l'extension VS Code.

### i. Mise sur le marché, plus tard

**Ce qui rendrait ARC vendable.**

- Plus rien en dur, et plusieurs comptes : aujourd'hui un seul compte est possible (`ARC_OWNER_ID`, `shouldCreateUser: false`). PROUVÉ.
- Un quota et un compteur d'usage par compte. Le coût a pesé sur un concurrent racheté en 2026 (PROUVÉ, déclaration de son cofondateur). Pour ARC : environ 4,60 $ par mois et par utilisateur avec la voix, selon les hypothèses du calcul.
- L'offre Supabase Pro (25 $ par mois), pour ne plus risquer la pause.
- Les quatre points de droit confirmés, un périmètre écrit pour Santé et Juridique, la mention « vous parlez à une IA ».
- Un export complet et lisible, et la garantie visible que rien ne dort : c'est ce que les grands assistants n'offrent pas (SUPPOSÉ, déduit des produits lus).
- **Cinq à dix entretiens** (guide prêt dans `docs/ETUDE-BESOIN.md`). Aucune donnée ne dit ce que d'autres ressentent ni ce qu'ils paieraient. Les prix de 8 à 16 dollars par mois sont ceux lus chez des concurrents.
- La preuve par l'usage de Rayan : trente jours d'ouverture, mesurés.

**Le contexte à garder en tête.** La catégorie retient mal : 23 % des abonnements annuels de productivité sont renouvelés une première fois (PROUVÉ). Les applications « IA » retiennent moins bien que les autres (PROUVÉ). Les plus occupés adoptent le moins (PROUVÉ, données de 2011-2012). Chaque fonction isolée existe ou existera gratuitement chez les grands assistants (SUPPOSÉ).

**Ce qu'il ne faut pas construire maintenant.** Abonnement, paiement, multi-clients. Suivi de santé à saisie quotidienne. Diagnostic, tri d'urgence, avis sur un droit. Stockage de documents médicaux. Écoute permanente. Alertes devinées. Étiquettes, graphes et réglages à apprendre. Entrée unique par la recherche. Lecture de l'émotion dans la voix. Aucun argument de vente fondé sur Zeigarnik, GTD, les « 23 minutes » ou les « 41 % ».

## Partie 4 — Les priorités

### Tout, classé

L'effort et le risque sont des estimations de cette étude, pas des mesures.

| Rang | Élément | Ce que cela apporte à Rayan | Effort | Risque | Dépend de |
|---|---|---|---|---|---|
| 1 | Remettre `CLAUDE.md` à la vérité (fait sur `etude-v2` le 5 octobre) ; connecter l'iPad ; corriger le piège « En pause » | Savoir sur quoi on bâtit | petit | faible | Rayan pour l'iPad |
| 2 | Cinq essais sur l'iPhone de Rayan : dictée du clavier dans ARC installé, micro, reconnaissance du navigateur, notification, stockage | Lever le plus gros doute technique avant de dessiner | petit | faible | Rayan |
| 3 | Tests de fumée, socle découpé en modules, bibliothèques figées en local | Ne plus rien casser sans le voir | moyen | casser le socle : tests d'abord | 1 |
| 4 | Modèle de données version 3, migration avec sauvegarde, fusion par élément | Plus rien en dur ; rien ne se perd entre deux appareils | gros | perte de données : sauvegarde et comptes de contrôle | 3, accord de Rayan |
| 5 | Table `thoughts` en ajout seul et file d'attente hors ligne | Une pensée déposée ne peut plus disparaître | moyen | nouvelle table | 4, accord de Rayan |
| 6 | Système de design figé, maquettes corrigées, états manquants | Un seul dessin, lisible, pour iPhone et Mac | moyen | goût : validation sur écran | 2 (pour `Ecoute`) |
| 7 | Dépôt par champ de texte, dictée du clavier | Vider sa tête en deux appuis | moyen | geste trop lent : le chronométrer | 5, 6 |
| 8 | Rangement par l'IA avec correction (proxy étendu) | Ne rien ranger soi-même | gros | mauvais rangement : « Corriger » et mesure | 7 |
| 9 | Une prochaine étape avec un moment | Savoir quoi faire, et quand | moyen | étapes jamais suivies | 8 |
| 10 | Écran « Aujourd'hui » | Ouvrir ARC et voir la seule chose à faire | moyen | faible | 9 |
| 11 | Mesures d'usage | Savoir si ARC aide vraiment | petit | faible | 7 |
| 12 | Le retour : point du matin, puis revue de la semaine | Rien ne dort | moyen | notification non garantie : visible à l'ouverture | 10 |
| 13 | Projets : écran, feuille de route, cap, point d'étape daté, ce qui bloque, endormi | Entrer dans un projet et voir où il en est | gros | faible | 10 |
| 14 | Claude avec le vrai contexte, sur téléphone aussi | Une aide qui sait où en est le projet | moyen | coût : plafond et compteur | 13 |
| 15 | Ma vie : Santé et Juridique recadrés (les garde-fous du proxy sont posés dès le rang 8) | Mémoire, échéances, préparation de rendez-vous | moyen | franchir la ligne : consignes côté serveur | 13 |
| 16 | Alimentation automatique (`/point-etape`) | Les projets à jour sans recopier | moyen | rapport faux : preuve et relecture | 13, accord de Rayan |
| 17 | Raccourci Apple « Déposer » | Déposer sans ouvrir ARC | petit | jeton sur le téléphone | 5 |
| 18 | Micro et transcription sur serveur | Réécouter, déposer sans clavier | moyen | autorisation du micro, qualité en français | 2, 7 |
| 19 | Photo d'un document | Garder un papier | moyen | documents médicaux : point de droit n° 1 | 8 |
| 20 | Recherche et palette de commandes | Retrouver et agir au clavier sur Mac | moyen | faible | 13 |
| 21 | Entretiens (5 à 10) | Savoir si d'autres ont ce besoin | petit | faible | rien ; avant toute vente |
| 22 | Avocat, plusieurs comptes, offre Pro | Pouvoir vendre | gros | juridique | 21 |

### La première version à construire

**Le but.** La plus petite version qui permet à Rayan d'ouvrir ARC tous les jours pendant trente jours.

**Ce qu'elle contient.**

1. **Un champ de dépôt, en bas de l'écran, sur iPhone et sur Mac.** La voix passe par la dictée du clavier de l'iPhone : aucun code.
2. **Des pensées qui ne se perdent pas.** Écrites d'abord sur l'appareil, puis ajoutées dans la table `thoughts`. Une file d'attente si le réseau manque.
3. **Le rangement par l'IA, corrigible.** Le projet proposé, « Corriger » visible, « Annuler » quelques secondes. Si l'IA n'est pas sûre, elle le dit.
4. **Une prochaine étape, avec un moment.** Une seule par projet. Le moment est proposé, Rayan le confirme ou le change.
5. **L'écran « Aujourd'hui ».** L'étape en cours, « C'est fait », la liste « Ensuite », les pensées déposées récemment, et un état « rien d'autre aujourd'hui ».
6. **Un retour à heure convenue.** Le point du matin, prêt à l'ouverture d'ARC à l'heure choisie par Rayan. La notification vient ensuite, si l'essai sur l'iPhone est concluant.
7. **Les cinq projets et les deux espaces de vie comme lieux de rangement**, repris par la migration. Leur écran peut rester simple : cap, prochaine étape, pensées.
8. **Les mesures d'usage**, dès le premier jour.
9. **L'interface reconstruite sur le socle gardé**, au système de design figé.

**Ce qu'elle ne contient pas.** Aucun avis médical ni juridique : les rôles « conseiller » sont retirés dès cette version. Pas de bouton micro ni de transcription sur serveur. Pas de photo. Pas de feuille de route détaillée. Pas d'alimentation automatique. Pas de recherche. Pas de revue de la semaine complète (seulement sa question de mesure). Pas de War Room, de Pomodoro, de veille, de compteurs, de score, de série de jours. Pas de vente.

**Pourquoi cette taille.** Les preuves les plus solides portent sur trois choses : noter, donner un moment, et faire revenir. La capture seule ne retient personne ; le rangement seul n'est mesuré par personne. Cette version tient la boucle entière, au plus petit coût, et permet de tester l'hypothèse nue : un plan proposé par l'IA soulage-t-il ?

### Ordre des chantiers

Chaque chantier passe par une branche, se termine par un écran que Rayan regarde, et ne touche `main` qu'avec son accord. L'ordre est fait pour ne rien reprendre deux fois : la vérité avant le code, les tests avant les données, les données avant le dessin final, le dessin avant les écrans.

| # | Chantier | Terminé quand | Dépend de |
|---|---|---|---|
| 0 | **Vérité.** Corriger `CLAUDE.md` (7 lignes fausses ou périmées) et les deux lignes périmées de `docs/AUDIT.md`. Rayan constate en ligne : connexion, synchronisation entre deux appareils, une réponse de Claude, jeton révoqué. | Chaque phrase d'état de `CLAUDE.md` porte sa preuve. Les quatre constats de Rayan y sont notés, avec leur date. | rien |
| 1 | **Essais sur l'iPhone.** Dictée du clavier dans ARC installé ; autorisation du micro après fermeture ; `webkitSpeechRecognition` ; une notification ; données gardées après plusieurs jours. | Un tableau de cinq résultats (marche, ne marche pas) dans `docs/`. | rien (Rayan) |
| 2 | **Filet de tests et socle en modules.** Mêmes écrans, code du socle déplacé, bibliothèques en copies locales figées. | Test de fumée : 0 erreur de console, 5 mondes et 2 pôles s'ouvrent, `<div` = `</div>`. Plus aucun appel à un serveur tiers pour une bibliothèque. | 0 |
| 3 | **Modèle version 3 et migration.** Fonctions pures de migration et de fusion, sauvegarde, table `thoughts`, écriture conditionnelle. | `node --test` vert. La migration d'un état version 2 affiche des comptes justes et 0 perdue (état vierge : 75 tâches en dur, dont 34 faites). `arc_v2` intact. Avec deux navigateurs sur le même compte, une pensée déposée sur l'un survit à une écriture ancienne de l'autre. | 2, accord de Rayan (table, copie d'archive) |
| 4 | **Système de design figé et maquettes corrigées.** Les dix corrections, les états manquants, `Mac` redessiné. Peut avancer en parallèle de 2 et 3. | Un fichier de variables (8 tailles, 4 rayons, 2 ombres, 5 couleurs par projet). Zéro texte sous le seuil mesuré sur les maquettes (4,5:1, ou 3:1 pour le grand texte). Rayan a validé sur écran, iPhone et Mac. | 1 |
| 5 | **Dépôt.** Champ de texte, écriture locale, file d'attente, mesures d'usage. | Un dépôt apparaît en moins de 100 ms. Déposé en mode avion puis rouvert : envoyé une fois, sans doublon. Vérifié sur l'iPhone et le Mac de Rayan. | 3, 4 |
| 6 | **Rangement et prochaine étape.** Proxy : appel nommé, sortie structurée, plafond d'entrée, compteur d'usage, consignes de garde-fou pour Santé et Juridique. Page : « Corriger », « Annuler », moment proposé ; les deux rôles « conseiller » (`:3154`, `:3377`) sont retirés. | Vingt vraies pensées de Rayan rangées ; chaque erreur corrigée en un geste. Sans réseau, la pensée reste « à ranger » puis est rangée. Au-delà du quota, refus 429 lisible. Plus aucun rôle « conseiller » dans la page. | 5, accord de Rayan (table d'usage, déploiement du proxy) |
| 7 | **Écran « Aujourd'hui ».** | À l'ouverture : une étape avec son moment, « C'est fait », l'état vide et « rien d'autre aujourd'hui ». Aucun nombre en dur. Zones tactiles de 44 px, texte à 200 % sans coupe. | 6 |
| 8 | **Le retour.** Point du matin à l'heure choisie ; notification ou e-mail de secours selon le chantier 1 ; question hebdomadaire de mesure. | Sept jours de suite, le point est prêt à l'heure convenue à l'ouverture. Début des trente jours d'usage. | 7 |
| 9 | **Projets.** Liste, écran d'un projet, feuille de route, cap, point d'étape daté, ce qui bloque avec sa date, endormi, Claude avec le vrai contexte sur téléphone. Retrait de l'ancien fichier. | Créer, renommer, archiver un projet sans toucher au code. Les anciens écrans et les six fonctions mortes ont disparu du dépôt. | 8 |
| 10 | **Ma vie.** Santé et Juridique : mémoire, échéances, préparation de rendez-vous ; anciennes données archivées et exportables. | Une question du type « mes symptômes évoquent quoi ? » reçoit le renvoi vers un médecin. Les échéances juridiques migrées s'affichent. Les anciens check-ins s'exportent. | 9 |
| 11 | **Alimentation automatique.** Commande `/point-etape`, fonction, table `points_etape`. | Un point publié depuis une session ARYAN apparaît dans ARC avec sa date et sa preuve. | 9, accord de Rayan |
| 12 | **Plus tard, sur preuve d'usage.** Raccourci Apple, micro et transcription, photo, recherche, revue de la semaine complète. | À définir chantier par chantier. | les trente jours |

### Révision de l'ordre (5 octobre, après relecture par la session Claude Code d'ARC)

La relecture a relevé une contradiction : cette étude dit qu'un outil se juge à l'usage, mais le tableau ci-dessus
ne fait commencer les trente jours d'usage qu'au chantier 8, après le découpage en modules, la migration et le
design figé. L'objection est juste. L'ordre retenu devient :

| # | Chantier | Terminé quand |
|---|---|---|
| 0 | Vérité (fait le 5 octobre sur `etude-v2`) | `CLAUDE.md` dit vrai |
| 1 | Essais sur l'iPhone de Rayan | Tableau de cinq résultats (dictée, micro, notification, stockage, reconnaissance vocale) |
| 2 | **Dépôt minimal sur le socle actuel** : un champ de dépôt dans l'ARC d'aujourd'hui, une table `thoughts` en ajout seul (accord de Rayan requis), une file d'attente hors ligne, les mesures d'usage | Une pensée déposée sur l'iPhone apparaît sur le Mac, sans doublon ni perte. **L'usage quotidien et les mesures commencent ici.** |
| 3 | Rangement par l'IA et prochaine étape avec un moment, toujours sur le socle actuel ; retrait des rôles « conseiller » | Une pensée déposée revient rangée, corrigible, avec une étape |
| 4 | Point du matin à heure convenue | Sept jours de suite, le point est prêt à l'heure choisie |
| 5 et suivants | Tests et modules, modèle version 3 et migration, système de design et maquettes corrigées, interface reconstruite (« Aujourd'hui », projets, Ma vie), alimentation automatique | Critères du tableau précédent |

Ce qui n'est pas refait deux fois : la table `thoughts`, l'appel de rangement dans le proxy et les mesures sont
gardés tels quels par la reconstruction. Seul le champ de dépôt provisoire, quelques dizaines de lignes, sera
redessiné. Le risque accepté : pendant quelques semaines, le dépôt vit dans l'ancienne interface, avec ses défauts.

### Ce qu'ARC doit mesurer dès le premier jour

Les mesures vivent dans les données de Rayan, sur l'appareil et dans sa ligne en ligne. Aucun outil d'analyse tiers. Elles sont consultables, pas affichées d'office sur l'accueil.

| Mesure | Comment | Ce qu'elle dit |
|---|---|---|
| Ouvertures par jour | Un compteur par jour | Le critère des trente jours |
| Dépôts par jour | Nombre de pensées créées | Si le geste devient un réflexe |
| Part des rangements corrigés | Pensées dont le projet ou l'étape a été changé par Rayan, sur le total rangé par l'IA | La justesse du rangement |
| Étapes faites, abandonnées, encore ouvertes | État des étapes | À comparer aux 49,5 %, 32 % et 18,5 % de l'étude de 2026 (prépublication) |
| Délai entre dépôt et rangement | Écart entre `createdAt` et `filedAt` | Si l'IA suit le rythme |
| Pensées qui reviennent | Une question simple, une fois par semaine, notée par Rayan | Le seul test direct de l'hypothèse centrale |

Sans ces mesures, « ça marche » restera invérifiable.

## Partie 5 — Ce qu'on ne sait pas

### Ce qui n'a pas pu être vérifié, et pourquoi

**Le site en ligne et Supabase** (accès coupé depuis l'environnement d'étude ; lecture de la base interdite sans l'accord de Rayan).
- La connexion, la synchronisation et Claude sur `rr269.github.io` : constatés par Rayan les 4 et 5 octobre (captures), jamais rejoués par un test automatique. L'iPad n'a pas été essayé.
- L'ancien jeton : refusé le 4 octobre (401), non rejoué depuis.
- Le contenu et les règles d'accès de `arc_data` ; la région du projet ; que le proxy déployé est la copie du dépôt.
- La taille réelle de l'état de Rayan et le nombre d'écritures par jour.
- Ce que Supabase compte comme activité pour éviter la pause ; la présence de `pg_cron` (tâches programmées) sur l'offre gratuite.

**Les appareils de Rayan** (aucun test sur un vrai iPhone ni un vrai Mac ; mesures faites dans un navigateur simulé).
- La dictée du clavier dans ARC installé, et si le français est traité sur l'appareil.
- La reconnaissance vocale du navigateur et la tenue de l'autorisation du micro sous iOS 26 ou 27.
- Les notifications d'une application de l'écran d'accueil en France en 2026 : la preuve est une déclaration d'Apple de mars 2024 rapportée par la presse ; un guide de 2026 dit le contraire.
- La conservation du stockage, le rendu du flou et des zones sûres, la taille de texte du système dans une page web.
- Le hors ligne après une première visite ; les scénarios de perte par synchronisation (déduits du code, non rejoués).

**La technique à choisir** (documentation absente ou non lue).
- La taille maximale d'une requête vers une fonction Supabase.
- La qualité des transcriptions en français ; les formats de son acceptés par Mistral, OpenAI, Deepgram.
- Les volumes de jetons réels d'un dépôt et d'un point du matin.
- L'envoi de notifications depuis une fonction Supabase.

**Le besoin** (aucune étude trouvée).
- Si un plan écrit par une IA soulage autant qu'un plan écrit par soi.
- L'effet d'une capture par la voix.
- Ce que vivent les entrepreneurs solo à plusieurs projets, et ce qu'ils paieraient.
- Ce qui fait revenir chaque jour dans un outil de ce type.
- L'usage réel d'ARC par Rayan entre avril et octobre : sa parole, pas une mesure.

**Le droit** (plusieurs pages officielles n'ont pas pu être rouvertes pendant la recherche).
- Hébergement de données de santé pour un document déposé par le patient.
- La date et le texte exacts de l'obligation de transparence sur l'IA.
- La durée de conservation des requêtes chez Anthropic ; un chemin européen pour Claude.

**Le contenu des projets.**
- L'état réel d'ATLAS (immatriculation, pages légales, achat en mode test).
- Le sort de FBA, KITCHEN et TELENEUF, dont le contenu date d'avril.
- La cause de la réponse hors sujet de Claude le 4 octobre.

### Les questions auxquelles seul Rayan peut répondre

1. **Depuis avril, as-tu ouvert ARC pour t'en servir vraiment, et pour quoi faire ?** C'est la réponse qui compte le plus pour choisir la première version. (Le fonctionnement en ligne est déjà constaté sur Mac et iPhone ; il reste l'iPad.)
2. **Donnes-tu ton accord pour toucher à la base ?** Une table `thoughts`, une table d'usage, plus tard une table `points_etape`, et une copie de ta ligne actuelle dans l'archive avant la migration.
3. **Quand veux-tu qu'ARC revienne vers toi ?** L'heure du point du matin. Et où les pensées t'arrivent le plus souvent : c'est là que le dépôt doit être le plus rapide.
4. **Que deviennent FBA, KITCHEN et TELENEUF, et où en est vraiment ATLAS ?** Actifs, endormis ou archivés ; et les trois points d'ATLAS à confirmer.
5. **Les entretiens : avant de construire, ou pendant ?** L'étude du besoin les demande avant d'écrire du code. La vision met ton propre usage en premier. Lecture proposée ici : construire la première version pour toi et mener les entretiens en parallèle, obligatoirement avant tout travail de vente. C'est à toi de trancher.

## Sources et documents

**Dans le dépôt.**
- `docs/VISION.md` : la vision et les décisions du 5 octobre. Fait foi.
- `docs/ETUDE-BESOIN.md` : le besoin, sourcé ; la ligne de partage en santé et en droit ; le guide d'entretien.
- `docs/PSYCHOLOGIE-DESIGN.md` : les règles de design et leur niveau de preuve.
- `docs/AUDIT.md` : l'audit du code du 4 octobre (défauts D1 à D10).
- `docs/maquettes/` : les neuf maquettes (`Main`, `Ecoute`, `Capture`, `Espaces`, `Espace`, `Route`, `Atlas`, `Sante`, `Mac`).
- `docs/notes/` : les quatre notes détaillées de cette étude (historique et état ; inventaire, modèle de données et technique ; faisabilité ; revue des maquettes). Le schéma complet et le tableau de migration champ par champ y sont.

**Principales pages externes des notes de faisabilité** (consultées le 5 octobre 2026).
- Voix dans le navigateur : https://webkit.org/blog/11353/mediarecorder-api/ ; https://bugs.webkit.org/show_bug.cgi?id=225298 ; https://bugs.webkit.org/show_bug.cgi?id=215884 ; https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/
- Transcription : https://mistral.ai/pricing/api ; https://docs.mistral.ai/capabilities/audio_transcription ; https://deepgram.com/pricing ; https://console.groq.com/docs/speech-to-text
- Claude : https://platform.claude.com/docs/en/about-claude/models/overview ; https://platform.claude.com/docs/en/about-claude/pricing ; https://platform.claude.com/docs/en/build-with-claude/structured-outputs ; https://platform.claude.com/docs/en/build-with-claude/data-residency ; https://platform.claude.com/docs/en/build-with-claude/vision
- Stockage et hors ligne sur iOS : https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ ; https://webkit.org/blog/14403/updates-to-storage-policy/
- Accès rapide : https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios ; https://support.apple.com/en-us/104996
- Notifications : https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ ; https://webkit.org/blog/16535/meet-declarative-web-push/ ; https://supabase.com/docs/guides/cron
- Supabase : https://supabase.com/pricing ; https://supabase.com/docs/guides/functions/limits ; https://supabase.com/docs/guides/storage/security/access-control ; https://supabase.com/docs/guides/realtime/postgres-changes
- Claude Code : https://code.claude.com/docs/en/hooks ; https://code.claude.com/docs/en/skills

Les sources de l'étude du besoin et des règles de design sont citées dans leurs documents respectifs.
