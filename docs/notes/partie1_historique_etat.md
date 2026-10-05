# Partie 1 — Ce qui a été fait depuis le départ (notes factuelles)

Notes prises le 5 octobre 2026 sur la branche `etude-v2` (`4e48c89`).
Chaque constat est étiqueté PROUVÉ, PROBABLE ou SUPPOSÉ, avec sa preuve.

## 0. Méthode et limites

- Lecture seule. Aucun fichier suivi par git n'a été modifié. Aucun appel à `supabase.co`.
- `git diff origin/main -- index.html sw.js manifest.json supabase/` : sortie vide. Le code de `etude-v2` est donc
  celui de `main` (`052f7de`). PROUVÉ.
- Test navigateur : `python3 -m http.server 8765`, Playwright 1.56 (Chromium), 1440×900 et 390×844,
  service workers bloqués, toute requête vers `supabase.co` coupée (0 requête tentée pendant les tests).
- Les CDN sont inaccessibles depuis ici (`curl` : `CONNECT tunnel failed, response 403`). Deux modes ont donc été testés :
  - mode A : `marked` 9.1.6, `dompurify` 3.1.6 et `supabase-js` 2.117.2 servis depuis une copie npm locale ;
  - mode B : tout l'externe coupé (cas « le CDN ne répond pas »).
- Les polices Google sont coupées dans les deux modes. Les tailles de texte ne changent pas, le dessin des lettres oui.
- Le clone local est tronqué (`.git/shallow` = `ffc5a87`). L'historique d'avant le 15 avril vient de l'API GitHub
  (`gh api repos/RR269/arc/commits`) : titres et dates seulement, pas le contenu.

**Non testable ici** : connexion réelle (envoi du code, validation), synchronisation `arc_data`, réponse de Claude,
proxy déployé, règles de sécurité Supabase, révocation de l'ancien jeton, vrai iPhone, hors ligne par service worker,
page en ligne `rr269.github.io` (accès coupé).

## 1. Chronologie

### 1.1 Avril 2026 — la première version (Rayan seul, par téléversement)

PROUVÉ (`gh api repos/RR269/arc/commits?sha=main&per_page=100` : 35 commits sur `main`, dont 27 en avril).

| Date (UTC) | Commits | Titres |
|---|---|---|
| 1 avril | 3 | dépôt créé (`created=2026-04-01`), premier `index.html` de 5 457 lignes (`d2edcc6`) |
| 2 avril | 6 | « Update index.html » |
| 13 avril | 3 | « Add files via upload » |
| 14 avril | 10 | téléversements, « Delete index.pdf », « Update sw.js » |
| 15 avril | 5 | téléversements ; dernier : `a330e3c` à 19 h 45 UTC |

- Tous les commits d'avril sont signés `RR269`, avec les titres par défaut de GitHub. Aucun message ne décrit le contenu. PROUVÉ.
- État au 15 avril (`a330e3c`) : `index.html` 4 084 lignes, 280 100 octets. Cinq mondes : ARYAN, FBA, KITCHEN,
  TELENEUF, TRADING (`git show a330e3c:index.html`, lignes 1843 à 2068). PROUVÉ.
- Ce qui ne marchait pas dans cette version, vérifié dans le code d'avril :
  - 526 `<div` pour 528 `</div>` : deux fermetures en trop. PROUVÉ.
  - Le bouton « Actualiser » appelait `refreshIntel()`, fonction absente (0 définition). PROUVÉ (`a330e3c:index.html:3330`).
  - `getUID` fabriquait un identifiant au hasard par appareil (`a330e3c:index.html:1751-1755`). Deux appareils
    n'avaient donc jamais la même ligne. La synchronisation entre appareils ne pouvait pas marcher. PROUVÉ.
  - Un jeton `x-arc-token` était écrit en clair dans le fichier (`a330e3c:index.html:3916`). PROUVÉ.
  - Le service worker était désactivé par le dernier commit d'avril (diff `e554f2c..a330e3c`). PROUVÉ.
- Les commits `94fb089` et `e554f2c` ne changent aucun fichier (`git diff --stat` vide). PROUVÉ.

### 1.2 Du 15 avril au 4 octobre — rien

- Aucun commit entre le 15 avril 19 h 45 et le 4 octobre 03 h 00 UTC. PROUVÉ (même commande).
- Un seul événement : un redéploiement GitHub Pages de `a330e3c` le 24 juin (`gh api .../deployments`). Cause inconnue.
- `docs/VISION.md:27` écrit : « aucun usage réel entre avril et octobre 2026 ». C'est la parole de Rayan, pas une mesure. SUPPOSÉ.

### 1.3 4 octobre, matin — reprise (`reprise-octobre`, PR #1, fusion `e2c6573`)

PR #1 : 4 commits, +468 −270, 4 fichiers. Fusionnée par `RR269` à 04 h 31 UTC. Description vide. PROUVÉ (`gh api .../pulls/1`).

| Commit | Heure (Paris) | Livré | Taille |
|---|---|---|---|
| `559a04e` | 05 h 00 | Réparations : panneau Claude, veille, erreurs Claude, DOMPurify, service worker `arc-v5` | `index.html` 52 lignes, `sw.js` 37 |
| `8382f92` | 05 h 14 | `CLAUDE.md` créé | +56 |
| `67123df` | 05 h 34 | Trading et code MT5 retirés, monde ATLAS créé, ARYAN mis à jour, `WORLDS_V=2` | `index.html` +181 −233 |
| `91bcec6` | 06 h 17 | `docs/AUDIT.md` (défauts D1 à D10, chantiers 0 à 8) | +186 |

Vérifié par moi dans le code :
- Les `<div` sont équilibrés depuis `559a04e` (525/525), puis 517/517, puis 533/533 aujourd'hui. PROUVÉ.
- « MT5 » : 93 occurrences en avril, 1 aujourd'hui (la ligne d'archivage, `index.html:2349`). PROUVÉ.
- Les données Trading d'un appareil sont déplacées dans `S.archive.trading`, pas effacées (`index.html:2344-2353`). PROUVÉ par lecture ; non testé avec un vrai état d'avril.

### 1.4 4 octobre, soir — connexion (`connexion`, PR #2, fusion `052f7de`)

PR #2 : 2 commits, +431 −38, 3 fichiers. Fusionnée par `RR269` à 18 h 35 UTC (20 h 35 Paris). Description vide. PROUVÉ.

| Commit | Livré | Taille |
|---|---|---|
| `60a79d9` | `CLAUDE.md` : Supabase rallumé, table fermée, jeton révoqué | 24 lignes |
| `b97a938` | Écran de connexion, synchronisation par compte, nouveau `claudeCall`, proxy versionné | `index.html` +279, proxy +130, `CLAUDE.md` 74 |

- GitHub Pages a déployé `052f7de` le 4 octobre à 18 h 35 min 52 s UTC (`gh api .../deployments`). PROUVÉ.
  Le site en ligne sert donc la version avec connexion. PROBABLE (la page elle-même n'a pas pu être chargée d'ici).

### 1.5 5 octobre — étude (`etude-v2`, non fusionnée)

| Commit | Livré | Taille |
|---|---|---|
| `9e98cf4` (05 h 15) | `docs/ETUDE-BESOIN.md` | +232 |
| `4e48c89` (06 h 20) | `docs/VISION.md`, `docs/PSYCHOLOGIE-DESIGN.md`, 9 maquettes `docs/maquettes/*.dc.html` | +1 298 |

Aucune ligne de code. `git diff --shortstat 052f7de 4e48c89` : 12 fichiers, +1 530. PROUVÉ.

### 1.6 Ce que les messages disent avoir vérifié

- Aucun message de commit et aucune description de PR ne cite un test ou son résultat. PROUVÉ (les deux PR ont `body: null`).
- Seule trace : `CLAUDE.md:42` dit que `connexion` a été « testée en réel sur localhost le 4 octobre ». Aucune sortie de test
  n'est dans le dépôt. SUPPOSÉ.
- L'audit décrit sa méthode (`docs/AUDIT.md:33`). J'ai refait ses mesures : elles tombent juste (voir section 3).

## 2. État réel de `main` aujourd'hui (vérifié)

### 2.1 Fichiers

- `index.html` : 4 264 lignes, 294 028 octets. Style lignes 20 à 1035, script lignes 1702 à 4264. 104 fonctions. PROUVÉ (`wc`, `grep -c`).
- `<div` : 533. `</div>` : 533. PROUVÉ.
- Trois bibliothèques chargées par CDN : `marked`, `DOMPurify`, `supabase-js@2` (`index.html:15`, `:16`, `:1701`). PROUVÉ.
- Quatre familles de polices Google, dont Azeret Mono (`index.html:19`). PROUVÉ.
- Proxy : `ALLOWED_MODELS=["claude-sonnet-5-5"]`, `MAX_TOKENS=1500`, deux origines autorisées
  (`supabase/functions/ARC-CLAUDE-PROXY/index.ts:11`, `:14`, `:17`). `CLAUDE_MODEL` vaut la même valeur (`index.html:4041`). PROUVÉ.
  Que ce fichier soit bien ce qui est déployé : SUPPOSÉ (invérifiable sans Supabase).

### 2.2 Résultats du navigateur (mode A, bibliothèques présentes)

| Vérification | Mac 1440×900 | iPhone 390×844 |
|---|---|---|
| Erreurs JavaScript (`pageerror`) | 0 | 0 |
| Erreurs de console | 1 par chargement : la feuille de polices Google, coupée par le test | idem |
| Écran de connexion à l'arrivée | affiché | affiché |
| « Continuer sans connexion » | ferme l'écran, pastille « Non connecté » | idem |
| ARYAN, FBA, KITCHEN, TELENEUF, ATLAS | s'ouvrent, retour à l'accueil correct, 0 erreur | idem |
| Santé, Juridique | s'ouvrent, 0 erreur | idem |
| Cocher une tâche | compteur 21 → 22 | idem |
| Ajouter une tâche puis recharger | la tâche est gardée dans `localStorage` (`arc_v2`) | idem |
| War Room, recherche, cockpit de tâche | s'ouvrent | s'ouvrent |
| Export | fichier `arc_backup_2026-10-05.json` | idem |
| Écrire à Claude sans session | message « Connecte-toi pour utiliser Claude (menu ··· › Se connecter) » | champ invisible (voir D3) |
| Requêtes vers `supabase.co` | 0 | 0 |

Tout ce tableau : PROUVÉ (scripts `test.js` et `test2.js` du dossier de travail, captures d'écran).

Autres constats du test :
- Sans session, ARC n'envoie rien à Supabase. PROUVÉ sur ce parcours (0 requête), conforme au code (`index.html:1869`, `:1896-1897`).
- « Continuer sans connexion » est gardé dans `sessionStorage` (`index.html:1760`, `:3444`). Dans un nouvel onglet,
  l'écran de connexion revient. PROUVÉ (test : `authNewTab: true`). Un usage local sans compte redemande donc à chaque ouverture.
- Mode B (CDN coupés) : l'écran de connexion **n'apparaît pas**. La pastille dit « Hors ligne ». ARC marche en local, 0 erreur JavaScript.
  Cause : sans `supabase-js`, `sbInit` sort avant de poser l'écouteur qui affiche l'écran (`index.html:1716-1719`, `:1730`). PROUVÉ.
- Appareil neuf : l'accueil affiche déjà « 34 accomplies », « 45 % » et « 14 bloquants. Résous maintenant. ». Ces chiffres viennent
  du contenu écrit dans le code, pas d'une action de Rayan. PROUVÉ (état vierge du test).

## 3. Les défauts D1 à D10 de l'audit, aujourd'hui

L'audit portait sur `67123df`. Les numéros de ligne ont glissé d'environ 20 depuis.

| # | État | Preuve aujourd'hui |
|---|---|---|
| D1 « Sept espaces. » en dur | **Présent.** PROUVÉ | `index.html:1058`. Le compte tombe juste par hasard (5 mondes + 2 pôles). Aussi en dur : « 5 » (`:1062`), « Tes 5 projets » (`:1090`), « RAYAN · VALENCE » (`:1042`) |
| D2 identifiant `hgrid` en double | **Présent.** PROUVÉ | `index.html:1075` et `:1091`. Test : premier bloc 5 cartes, second 0. Seul identifiant en double de la page |
| D3 Claude inaccessible sur téléphone | **Présent, à nuancer.** PROUVÉ | `.wcp{display:none!important}` (`:835`, `:942`), `.pcp` idem pour Santé et Juridique (`:857`, `:941`). `#fab-claude` et `#claude-sheet` : du CSS (`:769`, `:873`) et un gestionnaire (`:3647`), aucun élément dans la page. Nuance : dans le cockpit d'une tâche, le champ « Demande à Claude… » est visible à 390 px (202×24 px) |
| D4 tout est « CRITIQUE » ou « URGENCE » | **Présent.** PROUVÉ | `index.html:2541`. Test : 4 mondes « CRITIQUE », 1 « URGENCE » |
| D5 « 14 bloquants. Résous maintenant. » | **Présent.** PROUVÉ | `index.html:2493`. Affiché sur un appareil vierge |
| D6 « Code ↗ » ouvre l'accueil de GitHub | **Présent.** PROUVÉ | `index.html:3586`. Test : `window.open("https://github.com")`. Bouton masqué sur téléphone (`:831`) |
| D7 chronomètre de visite | **Présent.** PROUVÉ | `index.html:1109`, `:2593-2617`. Test : « 00:03 » après 3 secondes |
| D8 en-tête de monde trop haut | **Présent.** PROUVÉ | En-tête ARYAN : 239 px (Mac), 331 px (iPhone). Première tâche à 736 px sur 900 (Mac), à 1 043 px sur 844 (iPhone, sous le pli) |
| D9 veille figée | **Changé, pas réglé.** PROUVÉ | `INTEL_STATIC` : 4 fiches en dur, une datée 2025 (`:2329-2334`). « Actualiser » ne plante plus : il redessine les mêmes fiches et affiche « Veille actualisée » (`:3519`). Rien n'est cherché |
| D10 pastille « Offline », badge « Erreur » | **Non vérifiable ici.** | Cause traitée d'après `CLAUDE.md:59` (Supabase rallumé). Sans session la pastille dit « Non connecté ». Les libellés existent toujours (`:1884`, `:1945`, `:1955`, `:4154`). État avec session : SUPPOSÉ |

Mesures refaites (mode A, état vierge) — elles confirment `docs/AUDIT.md:25-31` :

| Mesure | Mac | iPhone | Audit |
|---|---|---|---|
| Textes de l'accueil sous 12 px | 83 sur 121 | 83 sur 119 | 83 sur 123 / 83 sur 121 |
| Zones cliquables d'un monde sous 44 px | 36 sur 47 | 42 sur 63 | 36 sur 47 / 42 sur 63 |
| Zones cliquables de l'accueil sous 44 px | 10 sur 21 | 10 sur 21 | non mesuré |
| Première carte de monde depuis le haut | 610 px | 598 px | 610 / 598 |
| Pôles depuis le haut | 1 196 px | 1 916 px | 1 196 / 1 916 |

Méthode : nœuds de texte visibles de `#S1`, taille lue par `getComputedStyle`. Zones : `button, a, input, textarea, select,
label, [data-action], [data-drawer], [data-pole]` visibles, largeur ou hauteur sous 44 px. L'écart de 2 textes sur le total
vient de la méthode de comptage. Sur iPhone, les tailles vont de 9 à 30 px ; 28 textes à 9 px, 35 à 10 px, 20 à 11 px. PROUVÉ.

Bilan : **aucun des dix défauts n'est corrigé.** Les deux chantiers livrés (reprise, connexion) n'y touchaient pas.
Les « trois défauts de fond » de `docs/AUDIT.md:60` (données ouvertes, secret public, synchronisation inopérante) sont traités
dans le code. Leur effet réel côté Supabase : SUPPOSÉ.

Le contraste n'a pas été remesuré.

## 4. Ce que `CLAUDE.md` dit de faux ou de périmé

| Ligne | Ce qui est écrit | Réalité | Statut |
|---|---|---|---|
| 37 | « Sur `main` (`e2c6573`, en ligne) » | `origin/main` = `052f7de`, déployé le 4 octobre à 18 h 35 UTC | PROUVÉ faux |
| 42 | « branche `connexion` (non fusionnée…) » | Fusionnée par la PR #2 (`052f7de`) | PROUVÉ faux |
| 51-52 | « Tant que `connexion` n'est pas fusionnée… Claude et la synchronisation y sont hors service » | `main` contient le nouveau `claudeCall` et la nouvelle synchronisation. Leur marche en ligne reste à constater | PROUVÉ périmé |
| 75-76 | Point ouvert n° 1 : « Fusion de `connexion` dans `main` » | Fait | PROUVÉ périmé |
| 86-88 | « Après la fusion… chantier 2 » | Fusion faite. `docs/VISION.md:36` pose une autre hypothèse : reconstruire l'interface en gardant le socle | PROUVÉ périmé |
| 35 | « État au 4 octobre 2026 » | Rien sur le 5 octobre : `etude-v2`, `VISION.md`, `ETUDE-BESOIN.md`, `PSYCHOLOGIE-DESIGN.md`, maquettes | PROUVÉ incomplet |
| 81-84 | Seul `docs/AUDIT.md` est cité comme lecture obligatoire | `VISION.md:3-4` dit faire foi avec l'étude du besoin | PROUVÉ incomplet |

Vrai et vérifié dans `CLAUDE.md` : les fichiers (lignes 7-10), les cinq mondes (14), `arc_v2` (19), `shouldCreateUser: false` (60 ;
`index.html:1803`), `arc_uid` effacé à la liaison (44 ; `index.html:1756`), les réglages du proxy (69-70), le code jamais appelé (78-79).

Invérifiable d'ici : tout le bloc « Supabase : état au 4 octobre » (lignes 57-71), sauf ce qui se lit dans le fichier du proxy.

`docs/AUDIT.md` a aussi vieilli : la ligne 184 dit que le code du proxy est absent du dépôt (il y est), et la ligne 160 parle de
fusionner `reprise-octobre` (fait).

Détail local : la branche `main` du clone est restée à `a330e3c` (« behind 8 »). Il faut lire `origin/main`. PROUVÉ (`git branch -vv`).

## 5. Code mort et secrets

Code jamais appelé — PROUVÉ, chaque nom n'apparaît qu'une fois, à sa définition (`grep -n`) :

| Fonction | Ligne |
|---|---|
| `fmtDate` | `index.html:2446` |
| `autoWorldBriefing` | `index.html:2632` |
| `renderSanteHistory` | `index.html:3044` |
| `resetPomoWR` | `index.html:3988` |
| `initClaude` | `index.html:4192` |
| `renderChatHistory` | `index.html:4195` |

Autres restes : la règle CSS `.cp-apikey` (`:309`), le CSS et le gestionnaire de `#fab-claude` (`:769`, `:3647`) sans élément,
la variable `intelRefreshed` (`:4039`).

Secrets :
- Fichiers suivis aujourd'hui : `x-arc-token` et `ARC_SECRET` n'apparaissent plus dans le code (`git grep`), seulement dans les
  documents qui en parlent. PROUVÉ.
- Seule clé dans le code : `SB_KEY` (`index.html:1711`). Son contenu décodé : `"role":"anon"`. C'est la clé publique autorisée. PROUVÉ.
- Le proxy lit ses secrets dans l'environnement (`index.ts:72`), aucun n'est écrit. PROUVÉ.
- **Attention** : l'ancienne valeur de `x-arc-token` reste lisible dans l'historique public (`a330e3c`, `559a04e`, `67123df`,
  1 occurrence chacun ; le dépôt est `visibility=public`). PROUVÉ. `CLAUDE.md:71` dit que ce jeton n'existe plus côté Supabase.
  Si c'est vrai, la valeur ne sert plus à rien. Ce point n'a pas pu être vérifié : SUPPOSÉ.

## 6. Avis franc

### 6.1 Ce qui sert Rayan aujourd'hui, preuves à l'appui

- **Une page qui s'ouvre sans erreur**, sur Mac et sur téléphone : 5 mondes, 2 pôles, 0 erreur JavaScript. En avril, le balisage
  était cassé et un bouton plantait. PROUVÉ.
- **Le travail local marche** : cocher, ajouter, recharger, exporter. PROUVÉ.
- **La connexion existe et a un parcours propre** : écran, code, choix « cet appareil fait foi », sauvegarde de l'état local
  avant écrasement (`index.html:1915`). PROUVÉ par lecture et par l'affichage ; le parcours réel n'a pas été rejoué ici.
- **Les données et la clé Claude ne sont plus ouvertes dans le code** : plus de jeton en clair, identité = compte, proxy qui
  vérifie la session et le propriétaire (`index.ts:58`, `:77`). PROUVÉ dans le code ; SUPPOSÉ côté serveur.
- **Les erreurs Claude se lisent** : message clair sans session, statut et cause sinon (`index.html:4073`, `:4087`). PROUVÉ pour le cas sans session.
- **ARYAN et ATLAS ont un contenu d'octobre.** PROUVÉ pour le texte ; son exactitude dépend de Rayan (`CLAUDE.md:54-55`).
- **Une règle de travail écrite et un audit chiffré** dont les mesures se refont à l'identique. PROUVÉ.

### 6.2 Ce qui ne le sert pas encore

- Le geste central voulu (déposer une pensée, la retrouver rangée) n'existe pas. `docs/VISION.md:28-29` le dit ; le code le confirme :
  le seul dépôt rapide est « Ajoute une tâche… » (`index.html:1087`). PROUVÉ.
- Les dix défauts de l'audit sont tous encore là (section 3). PROUVÉ.
- Sur téléphone, le panneau Claude des mondes et des pôles est invisible. PROUVÉ.
- L'usage réel n'est pas établi. Seule source : « aucun usage réel entre avril et octobre » (`VISION.md:27`). SUPPOSÉ.

### 6.3 Ce qui est fragile

| Fragilité | Preuve | Statut |
|---|---|---|
| Un seul fichier de 4 264 lignes, 294 Ko, style + page + logique + contenu | `wc -l index.html` | PROUVÉ |
| Aucun test automatique, aucune intégration continue | `git ls-files` : 20 fichiers, aucun test, pas de `.github/`, pas de `package.json` | PROUVÉ |
| Vérifications faites à la main, sans trace | PR sans description, messages sans résultat de test | PROUVÉ |
| Contenu de FBA, KITCHEN, TELENEUF inchangé depuis avril | Comparaison des blocs `WORLDS` entre `a330e3c` et `main` : 3 lignes changées sur 157, uniquement l'ajout de `linkLabel` | PROUVÉ |
| Contenu des mondes écrit dans le code ; le changer demande une migration | `index.html:1971-2300`, `WORLDS_V` (`:2343`) | PROUVÉ |
| Nom, ville, nombres écrits en dur | « Rayan » ou « Valence » sur 67 lignes d'`index.html` (`grep -c`) | PROUVÉ |
| Dépendance à trois CDN ; `supabase-js@2` sans version figée | `index.html:15`, `:16`, `:1701`. Si le CDN tombe : pas d'écran de connexion (mode B) | PROUVÉ |
| Synchronisation « le dernier qui agit gagne », état entier remplacé | `index.html:1928-1938` (`Object.assign(S, res.data.state)`) : deux appareils modifiés hors ligne, l'un perd ses changements | PROBABLE (lu, non testé) |
| Un seul compte possible, fixé côté proxy | `index.ts:72-77` (`ARC_OWNER_ID`), `shouldCreateUser:false`. Contraire à « vendu à d'autres » (`VISION.md:24`) | PROUVÉ |
| Accessibilité quasi absente | 5 attributs `aria-` ou `role` dans tout le fichier, tous sur l'écran de connexion (`index.html:1647-1665`) ; pas de mode clair ni de « réduire les animations » (`grep` : 0) | PROUVÉ |
| Ancien jeton dans l'historique public | section 5 | PROUVÉ (présence), SUPPOSÉ (révocation) |
| Documentation de référence déjà fausse un jour après | section 4 | PROUVÉ |
| Six mois sans commit après la première version | section 1.2 | PROUVÉ |

### 6.4 En une phrase

En deux jours d'octobre, le socle a été remis debout et fermé (page sans erreur, connexion, proxy), mais l'écran que Rayan voit
est encore celui d'avril, avec ses dix défauts, et rien dans le dépôt ne prouve que la connexion, la synchronisation et Claude
marchent en ligne.
