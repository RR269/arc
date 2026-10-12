# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 6 750 lignes, sans étape de build.
- `supabase/functions/ARC-CLAUDE-PROXY/index.ts` : code du proxy Claude, sans aucun secret (copie de ce qui est déployé).
- `sw.js` : service worker, réseau d'abord (la page et les fichiers d'ARC toujours revalidés), cache `arc-v7` en secours hors ligne.
- `supabase/schema/` : SQL des tables, pour mémoire (personne ne l'exécute depuis le dépôt).
- `tests/` (Playwright, outil de développement seulement ; mode d'emploi en tête de `tests/depot.mjs`) :
  `depot.mjs` (dépôt), `rangement.mjs` (rangement), `matin.mjs` (point du matin, horloge contrôlée),
  `outils.mjs` (serveur local, faux Supabase, faux proxy),
  `connexion.mjs` (écran d'entrée : identifiants, création de compte, mot de passe),
  `entree-fond.mjs` (fond de l'écran d'entrée : contraste mesuré dans l'image, six couleurs dans le fond et pas dans les lettres),
  `accueil.mjs` (accueil, vide et rempli : mêmes mesures, barre du haut de 360 à 430 px, moment de la journée ;
  ordre de l'accueil, prochaine étape, « Ensuite », projets endormis et réveillés, cases à leur juste taille,
  nombre d'espaces, ville par la position avec un faux appareil et un faux service),
  `mondes.mjs` (écran des cinq mondes : tailles de texte, champs, cibles, contraste mesuré dans l'image),
  `poles.mjs` (Santé et Juridique, vides et remplis : mêmes mesures, barre du haut sur petit téléphone),
  `cockpit.mjs` (cockpit d'une tâche : mêmes mesures, réponse de Claude visible sur iPhone, notes, journal, « C'est fait », minuteur, Échap),
  `recherche.mjs` (recherche : pensées, tâches et notes, projets, journal, Juridique ; ouverture au bon endroit ; clavier ; charte),
  `synchro.mjs` (deux appareils sur le même compte : fusion, hors réseau, suppression, conflit, écriture conditionnelle),
  `projet.mjs` (« En faire un projet » : proposition de Claude, création, accueil, rechargement, erreurs, autre appareil, charte),
  `relier.mjs` (projets liés et mémoire qui revient : proposition avec raison, « Relier », « Pas lié », rechargement, endormi, accueil, synchronisation, charte),
  `mesure.mjs` (outil commun : lecture d'image et mesure du contraste, sans dépendance),
  `proxy.mjs` (proxy hors ligne, sans dépendance : `node tests/proxy.mjs`),
  `sw.mjs` (service worker : une page servie avec `max-age=600` est redemandée au serveur à chaque réouverture).
- `manifest.json`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.

## Ce que fait ARC

- Cinq mondes écrits dans le code (tableau `WORLDS`, `id` 0 à 4 = leur place) : ARYAN, FBA, KITCHEN, TELENEUF, ATLAS.
  Depuis le 10 octobre, les projets créés depuis ARC (« En faire un projet ») vivent dans `S.mondes` et `WORLDS` les
  reçoit à la suite (`mondesConstruire`, appelé par `normalizeS`) ; leur `id` est l'heure de création en ms.
  **Toujours chercher un projet par `monde(id)`, jamais par `WORLDS[id]`.**
- Le contenu d'un monde (tâches, bloquants, mission) est écrit en dur dans `WORLDS` ; ce que Rayan coche vit dans `S`.
- Changer la liste des mondes ou marquer des tâches comme faites : incrémenter `WORLDS_V` et compléter `migrateWorlds`.
- Un projet peut être « endormi » : `S.sleep[id]` (`mondeDort`, `mondeSommeil`, `renderSommeil`) ; c'est la seule
  source, pour l'accueil comme pour la note « Endormi. » envoyée au proxy de rangement (`rangeSpaces`).
- Deux pôles personnels : Santé et Juridique.
- Ma ville (option, menu « ··· ») : ville et pays d'après la position de l'appareil ; réglage et dernière ville dans
  `arc_lieu_v1` sur l'appareil (jamais dans `S`) ; nom de la ville demandé à BigDataCloud (`lieuCheck`, `lieuDemander`,
  `lieuNom`, `lieuBascule`).
- Cockpit par tâche (avec minuteur), recherche (`searchQuery`), import/export JSON. La War Room et les tiroirs n'existent plus (8 octobre).
- État dans l'objet `S`, enregistré dans `localStorage` sous la clé `arc_v2` (`loadS`, `saveS`).
- Connexion : adresse + mot de passe (`authGo`), ou code à 6 chiffres / lien par e-mail (`authSendCode`, `authVerifyCode`) ; `showAuthScreen` ; `getUID` = identifiant du compte.
- Synchronisation Supabase : table `arc_data`, une ligne par compte (`pushToCloud`, `pullFromCloud`). Sans session, rien n'est lu ni écrit.
  Depuis le 10 octobre, chaque échange fusionne (`syncEchange`, `syncFusionner`) au lieu de remplacer : voir « Synchronisation » plus bas.
- Dépôt de pensées : barre fixe en bas de l'écran, liste « Déposé » ; pensées dans `localStorage` sous
  `arc_thoughts_v1` (jamais dans `S`), envoyées dans la table `thoughts` (`depotFlush`, `depotPull`), mesures
  `open` et `deposit` dans `arc_events`.
- Rangement (branche `rangement`) : le proxy (task `file`) propose un espace, une étape, un moment et ce qui est
  gardé pour après ; lignes dans `arc_filings_v1`, envoyées dans `thought_filings` (`rangeRun`, `rangePull`) ;
  chaque correction est une nouvelle ligne, la plus récente fait foi. Bloc « Prochaines étapes » sur l'accueil.
- Point du matin (branche `rangement`) : calculé sur l'appareil à partir des pensées et rangements, sans IA, sans
  table, sans notification ; réglages et mesure dans `arc_matin_v1` (`matinCheck`, `matinShow`, `matinData`).
- Claude : `claudeCall` appelle la fonction Supabase `ARC-CLAUDE-PROXY` avec le jeton de session ; le modèle est dans `CLAUDE_MODEL`,
  qui doit figurer dans `ALLOWED_MODELS` du proxy.

## Règles de travail

- Tout changement passe par une branche ; `main` est le site en ligne et ne se modifie qu'avec l'accord explicite de Rayan.
- Une cause se prouve avant de se corriger : citer `fichier:ligne`, ou la commande et sa sortie.
- Après chaque modification, charger la page dans un navigateur (Playwright) et vérifier : aucune erreur de console,
  les cinq mondes et les deux pôles s'ouvrent, le nombre de `<div` égale le nombre de `</div>`.
  Relancer `tests/proxy.mjs`, `tests/connexion.mjs`, `tests/entree-fond.mjs`, `tests/accueil.mjs`, `tests/mondes.mjs`, `tests/poles.mjs`, `tests/cockpit.mjs`, `tests/recherche.mjs`, `tests/synchro.mjs`, `tests/projet.mjs`, `tests/depot.mjs`, `tests/rangement.mjs`, `tests/matin.mjs`, `tests/relier.mjs` et `tests/sw.mjs` ; ne jamais toucher
  au dépôt, au rangement ni au point du matin sans que leurs tests passent.
- Aucun secret dans le code : le dépôt est public. La clé `anon` Supabase est publique par nature, rien d'autre ne l'est.
- Aucune lecture ni écriture dans la base Supabase sans l'accord de Rayan.
- Ne pas ajouter de bibliothèque sans le dire.

## État au 5 octobre 2026

En ligne sur `main` (`c563e8c` : PR #1 `reprise-octobre` et PR #2 `connexion` le 4 octobre, PR #3 `depot` ensuite) :
- Réparations d'octobre : panneau Claude des mondes et de Santé, bouton de veille, affichage des erreurs Claude,
  hors ligne réactivé, texte de Claude nettoyé (DOMPurify). Mondes v2 : Trading et le code MT5 retirés (données
  archivées dans `S.archive.trading`), monde ATLAS créé, ARYAN remis à son état du tour 113.
- Connexion par e-mail (code ou lien), « Continuer sans connexion » pour un usage local. `getUID` renvoie
  l'identifiant du compte ; `arc_uid` est effacé quand l'appareil est relié (`arc_linked_uid`).
- Première synchronisation d'un appareil : si le compte n'a pas de ligne, l'appareil devient la référence après
  confirmation ; sinon la version en ligne l'emporte et l'état local est gardé sous `arc_v2_avant_connexion`.
  Piège connu : répondre « Pas maintenant » met la synchronisation « En pause » jusqu'au prochain lancement.
- `claudeCall` : jeton de session, tous les blocs `text` lus, réponse vide affichée en erreur et jamais enregistrée,
  messages vides retirés de l'historique, erreurs avec statut et message (« (proxy ARC) » pour nos refus).

Constaté par Rayan sur le site en ligne (essais manuels, captures d'écran ; aucun test automatique) : connexion et
réponse de Claude le 4 octobre au soir, synchronisation Mac–iPhone le 5 octobre. L'iPad n'a pas été essayé.

Les dix défauts D1 à D10 de `docs/AUDIT.md` sont toujours là. Le contenu de FBA, KITCHEN et TELENEUF date
d'avril 2026 ; ATLAS est à recaler avec Rayan (immatriculation, pages légales, achat en mode test : non confirmés).

Documents de `etude-v2` (arrivés dans `main` avec la PR #3) : vision, étude du besoin, psychologie du design,
maquettes, étude complète.

Dépôt (PR #3, `c563e8c`) : chantier 2 de la révision de l'ordre
(`docs/ETUDE-COMPLETE.md`, « Révision de l'ordre »), le dépôt minimal sur le socle actuel.
- Barre de dépôt fixe en bas (accueil, mondes, pôles ; iPhone et Mac), champ qui grandit, Entrée dépose sur Mac,
  Maj+Entrée va à la ligne ; la voix passe par la dictée du clavier (aucun code de reconnaissance vocale).
- Écriture locale immédiate (`arc_thoughts_v1`), puis envoi dans `thoughts` (doublons ignorés sur `id`) ; nouvel
  essai au lancement, au retour du réseau et au retour au premier plan ; aucune pensée n'est jamais retirée de
  l'appareil. Au lancement avec session : lecture des 200 dernières pensées, fusion par `id`.
- Sans session : pensée gardée sur l'appareil, « Sur cet appareil seulement », envoyée à la connexion suivante.
- Écran « Déposé » depuis l'accueil ; texte des pensées affiché par `textContent` seulement.
- `pushToCloud` et `pullFromCloud` ne sont pas touchés. `tests/depot.mjs` : 19 sur 19 le 5 octobre (faux Supabase), dont deux onglets ouverts en même temps.

Branche `rangement` (non fusionnée, partie de `main` à `c563e8c`) : chantier 3 de la révision.
- Proxy : task `file`, consigne écrite par le proxy, sortie par un outil unique (`ranger_pensee`, forcé à l'origine, `tool_choice` « auto » depuis le 6 octobre), validation
  (espace connu, longueurs, date plausible), 502 si invalide ; modèle `FILE_MODEL` (`claude-haiku-4-5-20251001` à l'origine, `claude-sonnet-5-5` ensuite) ;
  journaux sans le texte des pensées. La discussion (corps sans `task`) est inchangée.
  **Déployé par Rayan le 5 octobre (version du commit `9ecb6b5`)** ; le rangement marche en réel sur son Mac (vrai
  modèle, vraie table). Premier essai réel : trois défauts (moment inventé, étape fabriquée pour « dg »,
  reformulation inutile), corrigés ensuite dans le dépôt.
- Proxy, corrections après l'essai réel (**à redéployer par Rayan**) : un moment doit citer les mots de la pensée
  (champ `source` de l'outil, vérifié sans casse ni apostrophes typographiques, 2 caractères au moins), sinon il
  est ramené à « none » et le journal note « moment écarté : source introuvable » ; étape vide permise (une note) ;
  consigne : pas de moment par défaut, une action déjà formulée gardée presque telle quelle, trois exemples.
  Version du commit `2c5e7d6` déployée par Rayan (373 lignes). Second essai réel : un moment « ce soir 20 h » est
  apparu sur « faire la typo des modules complet ». Qu'il ait été inventé par le modèle n'est PAS établi : rien
  ne le prouve dans les journaux de cette version, et la garde stricte ci-dessous a été posée par prudence.
- Proxy, après le second essai (**à redéployer par Rayan**) : un moment n'est gardé que si sa source, retrouvée dans
  la pensée, contient une expression de temps (`hasTimeExpression` : aujourd'hui, ce soir, demain, jours, « dans
  N jours », « d'ici », semaine ou mois prochain, fin de mois, heures « 9 h » « 14:00 », dates « le 12 » « 12/10 »,
  mois) ou, pour une situation, un déclencheur (`hasSituationTrigger` : « en » + participe présent, quand, lorsque,
  dès que, une fois que, au prochain, au retour, avant de, après avoir, pendant). Reconnu par le proxy lui-même,
  sans casse ni accents, avec limites de mots. Sinon « none » ; journal « moment écarté : source introuvable »,
  « source sans expression de temps » ou « source sans expression de situation ».
  Version du commit `a1ca2ca` déployée par Rayan (423 lignes). Ses journaux, aux essais de 19 h 23 et 19 h 44,
  montrent « moment none » dans les trois cas : le proxy n'a inventé aucun moment. Les moments affichés
  (« Ce soir · 20:00 », « Demain · 08:00 », « Demain · 10:00 ») correspondent aux boutons « Ce soir »,
  « Demain matin » et « Choisir… » de la page : ils ont très probablement été fixés par Rayan. La garde reste.
- Proxy, après les essais du 5 octobre au soir (**à redéployer par Rayan**) : garde de l'espace nommé (« inconnu »
  alors que la pensée contient, comme mot entier, le nom ou la clé d'un seul espace → cet espace, confiance sure,
  journal « espace retenu : nom présent dans la pensée ») ; consigne : espace nommé = cet espace, l'étape et
  l'espace sont deux décisions séparées (une action a toujours une étape, même si l'espace est inconnu), deux
  exemples ajoutés ; `FILE_MODEL` passe à `claude-sonnet-5-5` (le petit modèle jugeait trop juste ; retour arrière
  possible dans la constante).
- Proxy, 6 octobre (**à redéployer par Rayan**, 455 lignes) : la version `b03fc14` déployée le 5 au soir échouait
  à chaque rangement. Preuve : journal « rangement 400 : erreur de l'API Anthropic » et motif gardé par la page
  (`attempts[].why`) : « tool_choice: type "tool" and "any" are not supported for this model ». `claude-sonnet-5-5`
  refuse l'outil forcé ; `tool_choice` passe à « auto » (un seul outil fourni, la consigne l'impose, une réponse
  sans outil reste un 502 que la page réessaie) et `FILE_MAX_TOKENS` à 700. Pas encore essayé en réel.
- Page : l'origine se voit dans « Déposé », « Prochaines étapes » et le point du matin : « ARC propose » tant que
  la ligne la plus récente vient de l'IA, « Rangé » dès que Rayan a modifié quelque chose.
- Page : rangement demandé après l'envoi de la pensée, sans jamais bloquer le dépôt ; nouvel essai aux mêmes moments
  que la file ; une pensée n'est rangée par l'IA qu'une fois. Sous chaque pensée : espace, étape, moment, « gardé pour
  après », « ARC hésite » avec les sept espaces ; actions : changer d'espace, modifier l'étape, fixer le moment,
  « C'est fait », annuler le dépôt (section « Annulées », rétablissable). Bloc « Prochaines étapes » sur l'accueil.
- Mesures locales (`arc_filings_v1`, champ `stats`) : rangements proposés et corrigés par Rayan.
- Essais de rangement bornés : 3 au plus par pensée, espacés d'une minute, comptés sur l'appareil (`attempts`) ;
  un 401 ou une coupure réseau ne comptent pas, un 400 arrête tout de suite ; ensuite « À ranger à la main »
  (espaces à choisir, « Réessayer » remet à zéro).
- Envois robustes (`sendRows`) pour `thoughts`, `arc_events` et `thought_filings` : si un lot échoue de façon
  définitive (42501, 23503, 23514, 22P02, ou 4xx hors 401 et 429), renvoi ligne par ligne ; la ligne refusée est
  marquée `rejected` sur l'appareil, gardée et plus renvoyée ; réseau, 401, 429 et 5xx se réessaient. Une pensée
  refusée reste affichée (« Refusée par le serveur »). Un rangement n'est envoyé qu'après sa pensée.
- Santé et Juridique : consignes de mémoire et d'organisation (noter, dater, retrouver, préparer un rendez-vous,
  règle générale avec source officielle) ; refus poli de tout diagnostic ou avis sur le cas, renvoi vers un médecin
  ou un avocat. Le mot « conseiller » a disparu de la page.
- Page, après l'essai réel : une pensée rangée sans étape s'affiche comme une note dans son espace (« Ajouter une
  étape ») ; « Prochaines étapes » et le point du matin ne montrent que des actions réelles (ni hésitation, ni espace
  inconnu, ni note) et une seule ligne « N pensées à ranger » qui ouvre « Déposé » ; aucune demande à l'IA avant la
  lecture des rangements déjà faits (sinon une pensée rangée sur un autre appareil était redemandée).
- Tests : `tests/proxy.mjs` 41 sur 41, `tests/depot.mjs` 19 sur 19, `tests/rangement.mjs` 25 sur 25, `tests/matin.mjs` 27 sur 27
  (le faux Supabase applique la règle de `thought_filings` : la pensée doit exister sur le serveur).
- Essayé en réel sur le Mac de Rayan (5 octobre) avec le proxy `9ecb6b5`. Pas encore sur l'iPhone.

Point du matin (chantier 4, branche `rangement`, à la suite) :
- Heure choisie dans le menu « ··· » (8 h par défaut), désactivable ; gardée sur l'appareil (`arc_matin_v1`), pas dans `S`.
- À la première ouverture d'ARC après l'heure (lancement ou retour au premier plan), une fois par jour et par
  appareil, par-dessus l'accueil ; se rouvre depuis l'accueil (« Point du jour »). La barre de dépôt reste au-dessus.
- Contenu : la date ; « Aujourd'hui » (étapes du jour, par heure) ; « À replacer » (moment passé, sans rouge ni
  reproche) ; « Sans moment » (trois plus anciennes, situations comprises) ; « À ranger » (pensées qui attendent un
  choix) ; état vide « Rien n'attend aujourd'hui. Dépose ce qui te vient. » ; sept lignes au plus, puis « Voir tout ».
- Actions : « C'est fait », « Fixer un moment », « Demain » (même heure si elle n'est pas passée, sinon 9 h),
  « Plus tard » (sans moment), chacune par une nouvelle ligne de rangement `origin` user. Fermeture « C'est parti ».
- Mesure sur l'appareil seulement : par jour, point vu ou non, automatiquement ou à la demande, nombre d'ouvertures.
- ARC laissé ouvert au premier plan : vérification légère chaque minute (rien tant que l'heure n'est pas passée ou
  que le point du jour a été vu).
- Tests : `tests/matin.mjs` 27 sur 27 ; les autres suites ferment le point s'il s'affiche (elles tournent à l'heure réelle).

Écran d'entrée (branche `entree`, 7 octobre, partie de `main` à `09b9196`) :
- Demande de Rayan (7 octobre, 1 h) : refaire l'écran vu avant d'être connecté, dans les couleurs actuelles d'ARC, avec
  adresse + mot de passe et création de compte. Les essais de design du 6 octobre (branches `design`, `design-v2`,
  `accueil`, `charte`) ne sont pas repris. `accueil-v2` (passe de design sur l'accueil existant) est dans `main`
  depuis la PR #6 (`3490b28`).
- Écran : fond `#070709` avec lueurs orange, rose et violette ; logo ARC et nom en Big Shoulders ; titre
  « Bienvenue. » en dégradé et « Entre dans ARC. » ; carte sombre à filet avec deux onglets, « Se connecter »
  (adresse + mot de passe, `signInWithPassword`, aucun e-mail envoyé) et « Créer un compte » (`signUp`) ; bouton
  principal en dégradé ; « Mot de passe oublié ? Recevoir un code », « J'ai déjà un code », « Continuer sans
  connexion ». Étapes code, premier appareil, et « Ton mot de passe » (menu « ··· » › « Mon mot de passe »,
  `updateUser`, visible seulement connecté). « Renvoyer un code » attend une minute (`arc_auth_sent_at`). Le mot de
  passe n'est jamais gardé sur l'appareil. Fonctions : `authGo`, `authSetMode`, `authSavePass`, `authHaveCode`,
  `authCooldown`.
- **Côté Supabase, rien n'a changé** : inscriptions fermées (« Créer un compte » répond « pas encore ouverte »), le
  compte de Rayan n'a pas encore de mot de passe (à créer une fois connecté par code), proxy réservé à `ARC_OWNER_ID`.
- `tests/connexion.mjs` (13 contrôles, fausses réponses d'Auth). Tests : connexion 13/13, dépôt 19/19, rangement
  25/25, matin 27/27, proxy 41/41 ; 569 `<div` / 569 `</div>`. Pas encore vu par Rayan sur son iPhone.

Écran d'entrée, le fond (branche `entree`, 7 octobre 3 h, correction demandée par Rayan) :
- **Ce que Rayan a dit** : l'essai précédent avait mis ses six couleurs (vert `#4FB82A`, jaune `#F2B108`, orange
  `#E97D00`, rouge `#DA0D23`, violet `#8B2694`, cyan `#008FC8`) dans les lettres du titre, en arc-en-ciel : « ça
  ressemble à un drapeau ». Ces couleurs sont pour LE FOND. L'écriture reste celle d'ARC.
- **Règle à garder** : jamais six bandes voisines dans l'ordre de l'arc-en-ciel, nulle part (c'est ce qui fait
  « drapeau »). Ici les couleurs sont séparées en deux familles (trois chaudes, trois froides), loin l'une de l'autre.
- Les mots de l'écran sont dans `docs/MOTS-ARC.md` (ils ont changé le 7 octobre à 6 h 17, voir plus bas) ; « J'ai
  déjà un code » n'existe plus.
- **Le titre** : blanc, puis le dégradé de l'accueil (`#FF9500` → `#FF2D55` → `#AF52DE`). Logo ARC d'origine (la marque
  en six arcs est retirée : le fond porte déjà les arcs).
- **Le fond** : six « mondes » vus à leur horizon. Chacun est un `<i class="auth-world">` dans `.auth-glow` : un disque
  sombre dont le bord est un arc net de sa couleur, avec une lueur vers l'extérieur et une teinte profonde à
  l'intérieur (un seul `radial-gradient`, réglé par `--x`, `--y`, `--r`, `--c`). Un grain fin (`.auth-glow::after`) :
  noir, posé sans mode de fusion (voir « Safari » plus bas). La carte est un verre sombre (`backdrop-filter`).
- **Téléphone (< 861 px)** : le fond défile avec le contenu (`#auth-screen` en grille, `.auth-glow` et `.auth-box` dans
  la même case). Jaune, orange, rouge dans le coin haut droit, hors de tout texte ; l'horizon violet passe juste
  au-dessus de la carte, le cyan derrière elle, le vert sous elle. `authFond()` pose `--card-y` et `--card-h` (haut et
  hauteur de la carte) pour que les horizons suivent la carte ; c'est le seul JavaScript du fond.
- **Mac (≥ 861 px)** : le fond tient à l'écran ; trois arcs chauds en haut à droite, trois froids en bas à gauche, dont
  le rayon se règle sur la largeur libre (`--jour`, `--nuit`) : aucun arc n'entre dans la colonne du texte.
- **Lisibilité, mesurée dans l'image** (`tests/entree-fond.mjs`, 12 tailles d'écran, 5 états de la carte, haut, milieu
  et bas du défilement) : le texte le moins contrasté est à 4,85 : 1 (le bout violet du titre, sur 430 px). Pour y
  arriver : sous-titre, note du bas, petits libellés de la carte et textes d'attente des champs éclaircis ; dégradé du
  bouton resserré (orange → rouge à 18 % → violet), car le blanc sur l'orange était à 2,8 : 1 pour les libellés longs.
- Aucune bibliothèque ajoutée. `color-mix()` demande Safari 16.2 ou plus (sinon deux lueurs simples, `@supports`).
- `entree` contient `main` (fusion du 7 octobre, PR #6 `accueil-v2` comprise) : la demande de fusion ne heurte rien.
- **Plus de pavé (7 octobre, 4 h 40, remarque de Rayan)** : le paragraphe de cinq lignes qui expliquait ARC est retiré.
  Restent le titre, une ligne et les trois étapes en frise, reliées par un trait. La ligne, choisie par Rayan à
  5 h 50 parmi cinq propositions : « Garde en tête le strict nécessaire. Le reste prend vie ici. » (« qu'il rapporte
  ou non » est écarté : incompréhensible à l'écran, pas l'identité d'ARC).
- **Toutes les phrases du haut changées sauf celle-là (7 octobre, 6 h 17 puis 6 h 51, demandes de Rayan)** :
  sous le logo, la devise donnée par Rayan : « Penser. Développer. Entreprendre. » ; titre « Tu as une idée. » (blanc)
  puis « Elle devient réelle. » (dégradé), **proposé, pas encore validé** ; frise reprenant les trois mots de la
  devise, **proposée, pas encore validée** : « Penser · Dépose ton idée, à la voix ou au clavier. », « Développer ·
  ARC la range et fixe sa prochaine étape. », « Entreprendre · Tes tâches du jour, sur tous tes appareils. » (une
  ligne chacune sur iPhone, rien qu'ARC ne fasse pas déjà). Sur téléphone, les trois arcs du coin sont un peu
  resserrés pour passer au-dessus de la devise, plus longue. Les anciennes phrases
  (« Ta tête n'est pas faite pour tout porter », « Une pensée naît. Un monde grandit. », « Chaque pensée, un monde »,
  Dépose / Fais naître / Fais grandir) ne sont plus sur l'écran. Tableau avant / après dans `docs/MOTS-ARC.md`. Règle à garder : ce qu'ARC fait se montre, on ne l'explique pas dans un paragraphe
  (détail dans `docs/MOTS-ARC.md`). Sur iPhone, le bouton « Se connecter » arrive maintenant dans le premier écran.
- Tests : entrée-fond 23/23, connexion 13/13, dépôt 19/19, rangement 25/25, matin 27/27, proxy 41/41 ; 569 `<div` /
  569 `</div>`. Vérifié dans Chromium seulement : **le rendu sur l'iPhone de Rayan (Safari) reste à voir par lui.**
- `docs/CHARTE-DESIGN.md` et `docs/ETAT-DES-LIEUX-CHARTE.md` repris de la branche `charte` (ils n'étaient sur aucune
  autre branche) : la charte fait foi pour l'interface.
- **En ligne depuis le 7 octobre, 7 h 10** : Rayan a fusionné la PR #7 (`main` à `27c5a34`).
- **Safari sur iPhone : le noir était gris (constaté par Rayan à 7 h 15, corrigé sur la branche `entree-safari`)**.
  Cause prouvée : le grain était blanc et posé en `mix-blend-mode: overlay` ; Safari sur iPhone ne l'a pas fusionné,
  il l'a posé tel quel, d'où un voile gris sur tout l'écran. Preuve : la même page dans Chromium avec
  `mix-blend-mode: normal` donne exactement sa capture. Correction : grain noir posé normalement (sur le noir il ne
  change rien), arcs un peu épaissis (1,4 px) et lueurs remontées pour garder le même rendu. Deux contrôles ajoutés à
  `tests/entree-fond.mjs` (25 contrôles) : aucun mode de fusion sur cet écran, et au moins 8 % de l'écran en noir franc.
  **Règle à garder : pas de `mix-blend-mode` dans ARC ; tout effet doit donner la même image sans lui.** Le reste
  (verre de la carte, arcs, horizons qui suivent la carte) rend bien sur son iPhone, d'après ses captures.

Mondes, passe de design (branche `mondes`, 7 octobre après-midi, partie de `main` à `1d4fa61`) :
- Rayan a validé l'écran d'entrée sur son iPhone (« c'est en noir, c'est bon ») et la PR #8 est fusionnée. Suite de
  sa liste : les mondes, ARYAN d'abord, dans la même identité.
- Les cinq mondes partagent un seul écran (`#S2`, teinté par `--wc`) : la passe s'applique aux cinq à la fois. Même
  contenu, même ordre, mêmes fonctions ; seul le dessin change (bloc de style `#S2 …` à la fin de la feuille).
- **Identité** : l'en-tête du monde porte son horizon, comme sur l'écran d'entrée (un arc net de sa couleur au bas de
  l'en-tête, en `radial-gradient`, sans mode de fusion) ; cartes en relief comme sur l'accueil ; étiquettes mono.
- **Charte, mesurée** (`tests/mondes.mjs`, cinq mondes × iPhone 390 et Mac 1440) : avant, ARYAN comptait 29 cibles
  sous 44 px, 44 textes sous 12 px (jusqu'à 8 px) et des champs à 13 px ; après : zéro. Contraste le plus faible :
  4,91 : 1. L'étoile et la croix d'une tâche font 44 px ; la case à cocher a une zone de toucher de 48 px.
- Petites corrections de mots et de signes : « done » → « fait » dans l'anneau ; l'emoji du monde dans la barre du
  haut devient un petit anneau de sa couleur ; l'emoji du panneau Claude est retiré. Une tâche faite n'est plus
  estompée (elle passait sous 3 : 1) : elle reste barrée, en gris lisible.
- **Pas touché, à faire ensuite** : le cockpit d'une tâche, les tiroirs (ouverts par les cartes), la War Room ; les
  emoji des outils et de l'accueil ; la description d'ARYAN fait six lignes sur iPhone (contenu de Rayan, non modifié).
- `tests/mesure.mjs` : la mesure du contraste est maintenant commune ; elle lit aussi les couleurs `color(srgb …)`
  (rendu d'un `color-mix()`) et le texte sombre sur fond clair.
- Tests : mondes 6/6, entrée-fond 25/25, connexion 13/13, dépôt 19/19, rangement 25/25, matin 27/27, proxy 41/41.
  Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.** Aucun mode de fusion (règle Safari).

Santé et Juridique, passe de design (branche `poles`, 7 octobre en fin d'après-midi, partie de `main` à `c39f0f3`) :
- Rayan a vu les mondes en ligne (PR #9 fusionnée, « les changements sont effectués ») et demandé la suite : les deux
  pôles, dans la même identité.
- Même contenu, même ordre, mêmes fonctions ; le dessin change (bloc de style `:is(#S3,#S4) …` à la fin de la
  feuille). Identité en plus calme (vision : « Ma vie » à part) : horizon discret de la couleur du pôle dans
  l'en-tête (vert Santé, bleu Juridique), cartes en relief, étiquettes mono, anneau de couleur dans la barre du haut.
- **Pictogrammes au trait** à la place des emoji (lune, éclair, pouls, cible ; loupe ; immeuble, document, euro,
  liste) : un masque CSS (`--ico`) teinté par la couleur de l'élément, une seule famille, trait de 1,7. L'emoji reste
  dans le balisage, en taille 0. Les emoji des habitudes et du graphique vide sont masqués.
- **Charte, mesurée** (`tests/poles.mjs`, deux pôles × vide et rempli × iPhone 390 et Mac 1440) : zéro texte sous
  12 px, zéro champ sous 16 px, zéro cible sous 44 px ; contraste le plus faible : 4,70 : 1 ; sur un téléphone de
  360 px, aucun bouton de la barre du haut ne sort de l'écran (« Aides » était coupé à 390 px au premier essai).
- **Trois défauts déjà en ligne, prouvés puis réparés** (ils n'étaient pas dans la demande, ils empêchaient l'usage) :
  1. Santé, objectifs : la case à cocher mesurait 0 × 0 px (le code écrivait `obj-cb` et `obj-text`, la feuille de
     style ne connaît que `obj-check` et `obj-txt`) : on ne pouvait pas cocher un objectif. Le code écrit les bonnes classes.
  2. Santé, « Tendances » : toutes les barres faisaient 4 px, même après un check-in (colonnes sans hauteur). Mesure
     sur `main` : « 4 4 4 4 4 4 4 » ; après : « 4 4 4 4 4 4 64 » pour 7 h de sommeil.
  3. Juridique : ajouter un élément, le marquer fait ou le supprimer refermait la section (toute la liste est
     redessinée) : l'élément ajouté disparaissait de la vue. `renderJurSections` garde les sections ouvertes ;
     `searchJur` ouvre les sections trouvées sans passer par `jurToggle`.
  Les éléments juridiques, leurs étiquettes et la chronologie n'avaient aucun style (classes `jur-item-text`,
  `jur-tl-row`… absentes de la feuille) : ils en ont un.
- Mots corrigés (accents, anglais) : « À faire », « Fait », « Rouvrir », « fait(s) » au lieu de « done », « Priorité
  haute », « Dans 5 jours », « Dépassée de 2 j », « Terminé », « Démarches en cours », « Aucun élément pour
  l'instant. », « Énergie ». Accueil de Claude Santé : « Je note, je retrouve, je prépare tes rendez-vous. » (les
  consignes envoyées à Claude ne sont pas touchées).
- **Pas touché, décision de Rayan** : le contenu de Santé reste un suivi à curseurs (check-in, score, série de jours),
  alors que la vision demande mémoire, échéances, documents, rendez-vous, sans série ; les boutons de Claude Santé
  « Optimiser sommeil », « Programme sport », « Gérer le stress », « Routine matin » demandent des conseils, ce que
  les consignes refusent. Le bouton « Aides » et les suggestions juridiques nomment Valence et ARYAN en dur.
- `tests/mesure.mjs` : un champ de date vide se mesure avec la couleur du champ, sans son pictogramme de calendrier.
- Tests : pôles 9/9, mondes 6/6, entrée-fond 25/25, connexion 13/13, dépôt 19/19, rangement 25/25, matin 27/27,
  proxy 41/41 ; 569 `<div` / 569 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.**
  Aucun mode de fusion (règle Safari).

Connexion guidée (branche `connexion-guide`, 7 octobre 20 h, partie de `main` à `b57a648`, PR #10 fusionnée à 17 h 59) :
- **Ce que Rayan a vécu** (capture du Mac, 20 h 12) : onglet « Créer un compte », son adresse, un mot de passe →
  « La création de compte n'est pas encore ouverte. » Il en a conclu qu'il ne pouvait entrer que sans connexion.
  Cause : son compte existe déjà et les inscriptions sont fermées dans Supabase ; l'écran ne disait pas quoi faire.
- **Correction** : quand « Créer un compte » est refusé parce que les inscriptions sont fermées, ARC demande un code
  pour cette adresse (`authClaimWithCode`, `shouldCreateUser: false`). Si l'adresse a un compte : étape « Ton code »
  (« Ton compte existe déjà. Tape le code envoyé à … : ton mot de passe sera enregistré. »), puis le mot de passe
  choisi est enregistré (`updateUser`) et l'écran se ferme. Si l'adresse n'a pas de compte : message inchangé.
  Le mot de passe choisi attend en mémoire (`_authPendingPass`), jamais sur l'appareil ; il est oublié si on change
  d'onglet de la carte, d'adresse, ou si la page se recharge.
- **Après un code tapé ou le lien de l'e-mail** (« Mot de passe oublié ? »), ARC propose aussitôt « Ton mot de passe »
  (`_authAskPass`, `_authFromLink`, `authDone`), avec « Plus tard ». Une étape de compte ouverte (mot de passe,
  premier appareil) ne se referme plus toute seule quand Supabase renvoie `SIGNED_IN` au retour sur l'onglet.
- Messages : « Pas encore de mot de passe ? Touche « Recevoir un code par e-mail » : tu le choisiras juste après. » ;
  la mention de « J'ai déjà un code » (bouton disparu) est retirée.
- **Côté Supabase, rien n'a changé et rien n'a été lu** : inscriptions toujours fermées. Non essayé en réel :
  l'enregistrement du mot de passe juste après un code (`updateUser`) n'est prouvé que contre de fausses réponses.
- **Trousseau du navigateur** (20 h 40, Rayan : « faire directement le nécessaire sans devoir y revenir ») : l'adresse
  est annoncée comme identifiant (`autocomplete="username"`), et l'étape « Ton mot de passe » porte l'adresse du
  compte dans un champ invisible (`#auth-pass-user`) pour que Safari ou Chrome proposent de retenir adresse et mot
  de passe. Non vérifiable ici : c'est le navigateur de Rayan qui décide de le proposer.
- Tests : connexion 20/20 (sept contrôles ajoutés), entrée-fond 25/25, mondes 6/6, pôles 9/9, dépôt 19/19, rangement
  25/25, matin 27/27, proxy 41/41 ; 569 `<div` / 569 `</div>`.
- **Décision de Rayan (7 octobre, 20 h 44)** : « je ne veux plus le système du code, je veux une inscription et une
  ouverture de compte normales » ; un code une seule fois pour son compte déjà créé ; « pour les utilisateurs il
  leur faut le moyen de s'inscrire ». Fait dans la page (même branche, PR #11) :
  - « Créer un compte » = `signUp` adresse + mot de passe ; si Supabase ouvre la session tout de suite, la personne
    est dans ARC sans code (« Compte créé · bienvenue dans ARC »), et un compte créé à l'instant ne voit pas la
    question « Premier appareil » (`_authNewAccount` : l'appareil est relié et envoyé d'office).
  - Adresse déjà inscrite tapée dans « Créer un compte » (`authExisting`) : le bon mot de passe fait entrer ; sinon un
    code confirme que c'est bien la personne et enregistre le mot de passe choisi. Jamais de message en anglais.
  - Le code ne reste que comme secours (« Mot de passe oublié ? ») et pour le compte de Rayan, une fois.
  **À faire par Rayan dans Supabase, sans quoi rien ne change** (Authentication › Sign In / Providers) : activer
  « Allow new users to sign up » ; dans le fournisseur Email, désactiver « Confirm email » (sinon chaque inscription
  attend un e-mail de confirmation, et l'envoi d'e-mails de l'offre gratuite est très limité).
  **Ce qu'un autre utilisateur trouve aujourd'hui, non résolu** : les cinq mondes de Rayan écrits en dur (ARYAN, FBA…),
  Valence et ARYAN dans Juridique ; pas de Claude ni de rangement (le proxy refuse tout autre compte que
  `ARC_OWNER_ID`, 403) ; ses données sont à lui seul d'après les règles des tables (non revérifié dans la base).
  Sans confirmation d'e-mail, n'importe qui peut créer des comptes avec n'importe quelle adresse. Héberger les
  données de santé d'autres personnes engage Rayan (RGPD) : à traiter avant d'inviter quelqu'un.
- Tests après cette décision : connexion 24/24, les sept autres suites inchangées.
- **Fait par Rayan le 7 octobre** : PR #11 fusionnée à 20 h 59 ; dans Supabase (Authentication › Sign In / Providers,
  bloc « User Signups »), « Allow new users to sign up » activé et « Confirm email » désactivé, enregistré à 22 h 02
  (sa capture : « Successfully updated settings »). Les inscriptions sont donc ouvertes, sans confirmation d'e-mail.
  Reste à constater par lui : son propre passage (« Créer un compte » avec son adresse → un code, une fois → mot de
  passe enregistré). Sa liste « Users » ne montre qu'un compte, le sien.
- **Constaté par Rayan (22 h 14)** : « c'est fait », son mot de passe existe ; sur son iPhone, le trousseau de Safari
  remplit l'adresse et le mot de passe (ses captures : les deux champs en jaune pâle).
- **Le bas de la carte d'entrée (branche `entree-bas`, 22 h 20, demande de Rayan)** : champs remplis par le trousseau
  gardés sombres (`:-webkit-autofill`, ombre intérieure, pas de mode de fusion ; le jaune rendait « Voir » illisible) ;
  « Mot de passe oublié ? » devient un lien sous le champ (`.auth-forgot`, même `#auth-send`) ; le bouton principal
  suit sans trou (la ligne d'erreur ne prend de place que s'il y a une erreur) ; « Continuer sans connexion · Sur cet
  appareil seulement. » est une ligne sous un filet (`.auth-skip`) ; la note en pied et les deux gros blocs
  (`.auth-alt`, `.auth-note`) sont retirés. Le mot « code » n'est plus sur cet écran. Tests : connexion 26/26
  (ordre, écarts, cibles ≥ 44 px, bouton dans le premier écran de l'iPhone), entrée-fond 25/25 ; 567 `<div` /
  567 `</div>`. Le rendu du trousseau n'est vérifiable que sur l'iPhone de Rayan.
- **Le cadran et le mouvement (même branche `entree-bas`, PR #12, 7 octobre 22 h 42)**. Ce que Rayan a dit : « je te veux
  expert aguerri en design et psychologie de ce que l'humain apprécie ; j'exige un design comme APPLE pour la
  typographie, le cadran des fonctions ; la couleur violette du trait, modifie-la en vert ; en bas le vert,
  modifie-le comme tu penses que ce soit mieux ; le point de Penser, mets le jaune poussin ; Développer en orange et
  Entreprendre en rouge ; mets de la fluidité ; un design qui inspire le monde connecté ; ARC est et va devenir le
  centre de contrôle de chaque être humain, comme dans la science-fiction ». Fait :
  - **Couleurs** : l'horizon qui porte la carte est vert (« le reste prend vie ici »), le cyan passe derrière elle,
    le violet ferme le bas (trait un peu plus épais et plus clair, `--w`, car c'est la plus sombre des six) ; sur Mac,
    vert, cyan, violet du plus large au plus petit. L'ordre des `<i class="auth-world">` compte : le plus grand
    disque d'abord (`w-vert`, `w-cyan`, `w-violet`), sinon son corps opaque cache les autres. Frise : jaune poussin
    `#FFE066` (`--a-poussin`), orange, rouge, comme les trois arcs du coin ; traits en dégradé d'un point au suivant.
  - **Typographie** : sous le titre, tout le texte passe dans la police du système (`--fa` : San Francisco sur iPhone
    et Mac, Plus Jakarta Sans ailleurs). Plus de petites capitales ni de chasse fixe dans la carte. Le titre garde
    Plus Jakarta Sans, la devise sous le logo garde ses capitales (ce sont les mots de Rayan).
  - **Le cadran** : sélecteur à curseur glissant (`.auth-tabs[data-mode]`, posé par `authSetMode`) ; deux champs
    groupés à libellé flottant (`.auth-fields`, `.auth-field`, `placeholder=" "`) ; œil au trait à la place de
    « Voir » (le mot reste pour les lecteurs d'écran) ; « 8 caractères au moins. » sous le champ quand on crée un
    compte (`#auth-pass-hint`) ; bouton plein de 50 px ; chevron dessiné. Champs à 17 px, cibles de 44 px au moins.
  - **Mouvement, un seul récit** : à l'arrivée, le jour se lève, la frise se pose, l'horizon s'allume, la carte se
    pose (`authLever`, `authPoser`). Ensuite, toutes les 13 s, une lumière descend la frise (`authFlux`, `authPoint`)
    puis file le long de l'horizon vert (`authEclat`, `.w-vert::after`). Seulement `transform`, `opacity` et la
    position d'un fond de 3 px ; aucun mode de fusion ; tout s'arrête avec `prefers-reduced-motion`. `authFond()`
    retire le déplacement d'entrée de la carte de sa mesure, sinon l'horizon se posait 14 px trop bas.
  - Tests : entrée-fond 30/30 (cinq contrôles ajoutés : couleurs des horizons et de la frise, typographie de la
    carte, curseur et libellé flottant, mouvement), connexion 26/26, mondes 6/6, pôles 9/9, dépôt 19/19, matin 27/27,
    proxy 41/41 ; contraste le plus faible 4,98 : 1 ; 572 `<div` / 572 `</div>`.
  - **`tests/rangement.mjs` échoue entre 23 h et minuit (24/25), y compris sur la version en ligne** : prouvé le
    7 octobre à 23 h 05 sur `origin/main`. Cause : `rangeTonight()` (`index.html`, « Ce soir ») renvoie « dans une
    heure, à l'heure ronde » après 20 h, donc minuit du lendemain après 23 h ; la pensée n'est plus dans
    « Aujourd'hui » du point du matin et le contrôle 20 ne la trouve pas. Rien à voir avec l'écran d'entrée ; à
    corriger à part (le test devrait fixer l'heure, et « Ce soir » après 23 h est à décider avec Rayan).
  - Vérifié dans Chromium seulement : la police San Francisco, le verre de la carte et la fluidité réelle du
    mouvement ne se jugent que sur l'iPhone et le Mac de Rayan.
- **PR #12 fusionnée à 23 h 38 ; constaté par Rayan sur son iPhone (23 h 43 et 23 h 46)** : l'écran rend comme prévu
  dans Safari (horizon vert, violet en bas, police d'Apple, éclat visible sur sa capture), et « les champs se
  remplissent, tout est ok » avec le trousseau.
- **Les trois phrases de la frise (branche `mots-frise`, 23 h 46)**. Rayan : elles « ne reflètent pas exactement […]
  les points d'ARC et son utilité ». Réécrites pour dire ce que chaque mot apporte, **proposées, à valider** :
  « Penser · Dépose chaque pensée. Aucune ne se perd. », « Développer · ARC la range, la relie et la fait avancer. »,
  « Entreprendre · Chaque matin, ta prochaine étape t'attend. » Deux autres jeux dans `docs/MOTS-ARC.md`.
  `tests/entree-fond.mjs` : 31 contrôles (une ligne par phrase de 375 à 430 px).
- **Refusées par Rayan (8 octobre, 1 h 06)** : « quand on développe, on ne range pas ! […] ARC est un espace qui est
  voué à être le centre de contrôle et le point de départ de tout. » **Règle à garder : sous chaque mot, la phrase
  dit ce qu'on attend en lisant ce mot, pas le mécanisme (jamais « ranger » sous « Développer »).** Nouvelle
  proposition, même branche et même PR #13, **à valider** : « Penser · Dépose ton idée : tout part d'ici. »,
  « Développer · Fais-en un projet, étape par étape. », « Entreprendre · Passe à l'action et pilote tout d'ici. »
  La deuxième engage le chantier « faire naître un monde depuis une pensée », pas encore construit.
- **Phrases validées par Rayan (8 octobre, 1 h 21) : « là on y est !!! »** (les trois de la PR #13).
- **La frise en feux de départ (même branche `mots-frise`, PR #13, 8 octobre 1 h 41)**. Rayan : « la calligraphie style
  Apple n'est pas visible sur les trois points ; mettre le point jaune en rouge, l'orange reste orange, le rouge
  devient vert, et le tout lumineux, mais les points ne deviennent lumineux que quand le fil de lumière arrive à
  eux ; et ce en continu ». Fait :
  - Typographie : le mot à 20 px, demi-gras, serré (`-0,45 px`) ; la phrase à 16 px en gris `#B4B4BA`.
  - Couleurs : Penser rouge, Développer orange, Entreprendre vert (`--a-poussin` n'existe plus).
  - Chaque point a deux états : éteint (le `<i>`, teinte sombre) et allumé (son `::after`, avec la lueur). Le fil a
    un trait éteint (`li::after`) et un trait de lumière (`li::before`) qui descend (`scaleY`).
  - Boucle de 8 s, en continu (`authFeu1/2/3`, `authFil1/2`, `authEclat`) : le rouge s'allume, le fil descend,
    l'orange s'allume quand il l'atteint, puis le vert ; la lumière file alors le long de l'horizon vert ; tout
    s'éteint et repart. `authFlux` et `authPoint` sont retirés. Sans animation, les trois points restent allumés.
  - Tests : entrée-fond 33/33 (deux contrôles ajoutés : l'ordre d'allumage image par image, et l'état sans
    animation) ; contraste le plus faible 4,84 : 1 ; les sept autres suites passent ; 572 `<div` / 572 `</div>`.
- **L'effet : la lumière arrive, l'écran répond (même branche `mots-frise`, PR #13, 8 octobre 2 h)**. Rayan : « c'est
  bien, mais j'aimerais que dans cette fluidité il y ait de l'effet, et qu'on ajoute dans le design ce genre de
  choses qui font ressentir le monde connecté qui prône le contrôle total pour une productivité totale ».
  **Règle à garder : sur cet écran, aucun faux chiffre ni faux signal ; chaque signe dit un état vrai.** Fait :
  - La frise : une étincelle court au bout du fil (`li span::after`, `authPointe1/2`) ; à l'allumage chaque point
    lance une onde (`li i::before`, `authOnde1/2/3`) ; son mot et sa phrase s'allument avec lui (`li b` et
    `li span`, de 80 % à 100 %, `authMot1/2/3`).
  - L'horizon : la lumière est une comète (tête blanche, traîne de 72 px, `.w-vert::after`) ; la carte, juste dessous,
    en garde le reflet sur son bord, calé sur la position de la comète (`.auth-card::before`, `authReflet`) ; puis le
    bouton s'éclaire (`.auth-btn::after`, `authAppel`). Boucle de 8 s : feux éteints de 84 à 94 %.
  - La carte répond : bouton « armé » (`#auth-go.is-ready`, `authArme`) quand l'adresse est valide et le mot de passe
    fait 8 caractères ; sur Mac, une lumière suit le pointeur (`--mx`, `--my`, `.auth-card::after`, sous le contenu).
  - Ligne d'état en tête de la carte (`#auth-status`, `authEtat`, `authVie`) : un état vrai (« En ligne » au premier
    jet, remplacé à 3 h 36 par « Prêt », voir plus bas), la date, l'heure à la seconde, chiffres à chasse fixe ; l'horloge s'arrête
    d'elle-même quand l'écran est fermé. La carte gagne 28 px : le bouton reste dans le premier écran (844 px).
  - On entre dans ARC (`hideAuthScreen`, classe `leaving`, `AUTH_LEAVE_MS` = 730 ms) : la carte s'efface, le fond
    plonge vers l'horizon vert, l'accueil apparaît dessous ; pendant le passage l'écran ne prend plus aucun geste.
    `showAuthScreen` annule un passage en cours. Immédiat si l'appareil demande moins d'animations. **Un test qui
    attend la fermeture doit attendre que la classe `active` parte** (ne pas compter 300 ms).
  - Toujours `transform`, `opacity` et la position d'un fond ; aucun mode de fusion ; aucune bibliothèque.
  - Tests : entrée-fond 38/38 (cinq contrôles ajoutés : état réel avec réseau coupé puis revenu, bouton armé, ordre des
    effets image par image, contraste quand les mots sont en retrait, passage vers ARC), connexion 26/26, mondes 6/6,
    pôles 9/9, dépôt 19/19, rangement 25/25, matin 27/27, proxy 41/41 ; contraste le plus faible 4,90 : 1 ;
    573 `<div` / 573 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.**
- **Plus de gris fade (même branche, PR #13, 8 octobre 2 h 49)**. Rayan, après avoir vu l'effet (« très bien ») : « le
  gris des descriptifs sous les trois points ne me plaît pas, il fait fade, et la couleur de la fonction Se connecter
  aussi ». **Règle à garder : pas de gris moyen pour un texte que Rayan doit lire sur cet écran.** Fait :
  - Les trois phrases de la frise et la ligne au-dessus passent en blanc lumineux (`#EBEBF0`, au lieu de `#B4B4BA`
    et `#D6D6DC`).
  - Le sélecteur « Se connecter / Créer un compte » n'est plus gris : fond de verre sombre comme les champs ; la
    touche choisie porte le dégradé d'ARC (filet orange → rose → violet, fond teinté, lueur ; `.auth-tabs::before`).
    Lecture retenue de « la fonction Se connecter » : l'onglet gris (confirmé par Rayan à 3 h 36 : « on laisse
    comme c'est »).
  - Tests : entrée-fond 39/39 (un contrôle ajouté), les sept autres suites passent ; contraste le plus faible
    5,02 : 1 ; 573 `<div` / 573 `</div>`.
- **« Prêt », pas « En ligne » ; bouton principal clair (même branche, PR #13, 8 octobre 3 h 36)**. Rayan : « on ne
  peut pas mettre En ligne dans une page dans laquelle on n'est pas encore connecté » ; l'onglet et les phrases :
  « on laisse comme c'est » (la lecture « onglet gris » était la bonne) ; le bouton « Se connecter » : « plus pro et
  plus clair avec le thème », à voir. Fait :
  - **Règle à garder : jamais « En ligne » sur l'écran d'entrée** (on le lit comme « connecté »). La ligne d'état dit
    « Prêt » tant qu'aucune session n'est ouverte (réseau présent, service de connexion chargé), « Connecté » quand
    la session existe (étapes mot de passe, premier appareil), « Pas de réseau » sinon (`authEtat`).
  - Bouton principal (`.auth-btn`) : une touche blanche au libellé presque noir (`#0B0B0F`), comme « Déposer » dans
    ARC ; c'est la seule grande forme blanche de l'écran. Les couleurs d'ARC restent en lueur autour d'elle (orange,
    rose, violet) : discrète au repos, pleine quand le bouton est armé ou que la lumière de la boucle arrive. Le
    dégradé plein orange → rouge → violet du bouton est retiré. **Proposé, à valider par Rayan sur son iPhone.**
  - Tests : entrée-fond 40/40 (un contrôle ajouté : bouton clair, libellé sombre ; l'état vérifie « Prêt »,
    « Connecté », « Pas de réseau » et l'absence de « En ligne »), les sept autres suites passent ; contraste le plus
    faible 5,03 : 1 ; 573 `<div` / 573 `</div>`.
- **Plus de mot d'état, plus de « Continuer sans connexion » (même branche, PR #13, 8 octobre 4 h 29)**. Rayan :
  « Prêt ? pourquoi c'est là ?! aucune utilité je pense ; et maintenant supprimons la case Continuer sans connexion
  puisque je peux me connecter maintenant ! ». Fait :
  - **Règle à garder : sur l'écran d'entrée, aucun mot d'état quand tout va bien** (« En ligne » puis « Prêt » refusés).
    La tête de la carte montre la date à gauche (« Jeudi 8 octobre ») et l'heure à la seconde à droite ; « Pas de
    réseau » remplace la date seulement quand le navigateur n'en a pas (la connexion échouerait). Le point vert et
    son pouls sont retirés (`authPouls` n'existe plus).
  - **« Continuer sans connexion » est retiré** (bouton `#auth-skip`, ses styles, `authSkipped()`, la clé
    `arc_auth_skip`). Le bouton principal ferme la carte (`#auth-email{padding-bottom:10px}`) ; sur iPhone 390 × 844
    tout l'écran d'entrée tient sans défiler.
  - **Conséquences, dites à Rayan** : on n'entre plus dans ARC sans compte. Sans session, l'écran d'entrée s'affiche
    toujours ; se déconnecter (ou une session refusée par le serveur, `SIGNED_OUT`) y ramène ; les données restent
    sur l'appareil. ARC ne s'ouvre sans session que si la bibliothèque de connexion n'a pas pu se charger (`_sb`
    absent : pas d'écran d'entrée, usage local, « Service de connexion injoignable » au menu). Donc : pas de réseau
    ET session expirée = impossible d'entrer tant que le réseau n'est pas revenu.
  - Le code de l'usage local reste (dépôt « Sur cet appareil seulement », envoi à la connexion suivante) : c'est ce
    qui sert quand le service est injoignable. Les tests de cet usage referment l'écran eux-mêmes
    (`entrerSansSession` dans `tests/outils.mjs` et `tests/depot.mjs`).
  - Tests : connexion 27/27 (le bas de la carte sans la ligne retirée ; un contrôle ajouté : se déconnecter ramène à
    l'écran d'entrée), entrée-fond 40/40 (tête de la carte : date, heure, aucun mot d'état), mondes 6/6, pôles 9/9,
    dépôt 19/19, rangement 25/25, matin 27/27, proxy 41/41 ; contraste le plus faible 5,03 : 1 ;
    573 `<div` / 573 `</div>`.
- **PR #13 fusionnée par Rayan le 8 octobre à 4 h 59** (« go c'est fait ») : l'écran d'entrée est en ligne dans son
  état final (frise en feux de départ, effet, bouton blanc, date et heure, plus de « Continuer sans connexion »).
- **Avis donné à Rayan (1 h 21), sans suite pour l'instant** : l'écran d'entrée promet plus que l'intérieur ne tient
  (priorité : le premier écran après connexion) ; la devise est écrite deux fois sur l'écran ; il manque une ligne
  sur les données à la création de compte (texte à écrire avec lui).
- **Question de Rayan du 7 octobre, 18 h** (Santé et Juridique « ont totalement changé », iPhone non connecté) :
  la PR #10 ne touche aucune ligne de données (recherche dans le diff : zéro) ; ses captures montrent l'état de
  départ (les quatre habitudes posées par `renderHabitudes`). Reste à vérifier par lui sur son Mac connecté si son
  compte contient du contenu Santé ou Juridique. Vu dans ses captures : la barre du haut de l'accueil déborde à
  droite sur iPhone (« Non connecté » et « War Room » sur deux lignes), pas corrigé.
- **À suivre, demandé par Rayan** : « finir de modifier cette page » (l'écran d'entrée), après la connexion.

Accueil, l'intérieur (branche `interieur-accueil`, 8 octobre 5 h, partie de `main` à `4bb5daf`) :
- Rayan : « on attaque l'intérieur d'ARC ». Premier écran après la connexion : l'accueil (`#S1`). Même contenu, même
  ordre, mêmes fonctions ; le dessin change, dans l'identité de l'écran d'entrée (bloc de style « ACCUEIL,
  l'intérieur » à la fin de la feuille, après celui d'`accueil-v2`).
- **Mesuré avant** (iPhone 390, `main`) : 9 cibles sous 44 px (état de synchronisation 36 px, Recherche et War Room
  40 px, menu 40 px, boutons de projet 34 px), 9 textes sous 12 px, 33 emoji, la barre du haut sortait de l'écran
  (« War Room » sur deux lignes, menu « ··· » coupé à droite), deux identifiants `hgrid`. **Après** : zéro partout.
- **L'écriture** : police du système pour tout le texte de l'accueil (`#S1{--f:var(--fa)}` ; San Francisco sur iPhone
  et Mac), Plus Jakarta Sans pour les titres seulement (`--ft` : titre, noms des mondes et des pôles), chasse fixe
  pour les petits libellés en capitales et les chiffres. `--fa` et `--ft` sont maintenant sur `:root`.
- **L'horizon d'ARC** (`.h-horizon`, un élément ajouté sous le titre) : un arc net orange → rose → violet avec sa
  lueur, qui porte le poste de commande (Déposé, Point du jour, compteurs), comme l'horizon vert porte la carte de
  l'entrée. Un dégradé masqué par un anneau (`mask`, déjà utilisé pour les pictogrammes) ; aucun mode de fusion. Il
  s'allume à l'arrivée sur l'accueil (`hHorizon`, une fois, rien si l'appareil demande moins d'animations). Sur
  grand écran l'arc est plus plat et ses bouts se fondent dans le noir.
- **Barre du haut** : son contenu s'aligne sur celui de la page, son fond va d'un bord à l'autre (`.hn::before`) ;
  boutons de 44 px ; sur téléphone, Recherche et War Room n'ont plus que leur pictogramme (le nom reste pour les
  lecteurs d'écran, `aria-label`) ; l'état de synchronisation se raccourcit au lieu de pousser les boutons dehors.
  Tient de 360 à 430 px, quel que soit l'état. Menu « ··· » : lignes de 48 px.
- **Pictogrammes au trait** (une famille, trait de 1,7, masque teinté) à la place des emoji : fusée, boîte, poêle,
  écran, boussole pour les cinq mondes (par `data-wid` ; un monde inconnu a un pictogramme « monde ») ; cœur et
  balance pour les pôles ; lune, soleil, soleil couchant pour le moment de la journée ; flèches « Actualiser » et
  « Ouvrir ». L'emoji des mondes et des pôles reste dans les données, masqué (taille 0). Les emoji écrits par le code
  de l'accueil sont retirés (« ⚡ 3 bloquants », « 🔴 CRITIQUE », « ▶ », boutons de projet).
- **Mots, petites corrections** : la date n'est plus écrite deux fois (la pastille dit le moment : « Nuit », « Matin »,
  « Après-midi », « Soirée » ; la date reste sous le titre) ; « Offline » → « Hors ligne » ; l'heure ne se coupe plus
  (« 08 h 00 » avec des espaces insécables posées par le code, charte règle 4 ; `tests/matin.mjs` en tient compte) ;
  section vide « Tes 5 projets » et son doublon `#hgrid` retirés du balisage.
- `tests/mesure.mjs` : un texte coupé par son propre bloc (lignes masquées, points de suspension) n'est plus mesuré
  hors de ce bloc.
- **Pas touché, à décider par Rayan** : l'ordre de l'accueil (« Prochaines étapes » n'arrive qu'au deuxième écran,
  après les compteurs et la progression, alors que c'est le cœur de la vision) ; FBA, KITCHEN et TELENEUF, déclarés
  « endormis » le 5 octobre, s'affichent encore « CRITIQUE » avec leurs bloquants ; « 14 bloquants. Résous
  maintenant. » (ton pressant, la vision dit sans reproche) ; « Valence » et « Sept espaces » écrits en dur.
- **Pas touché, à faire ensuite** : le cockpit d'une tâche, les tiroirs, la War Room, la recherche ; les mondes et
  les pôles gardent Plus Jakarta Sans pour le texte (à passer à la police du système quand l'accueil sera validé).
- Tests : accueil 8/8 (nouveau), entrée-fond 40/40, connexion 27/27, mondes 6/6, pôles 9/9, dépôt 19/19, rangement
  25/25, matin 27/27, proxy 41/41 ; contraste le plus faible sur l'accueil 4,89 : 1 ; 571 `<div` / 571 `</div>`.
  Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone** (police San Francisco, horizon masqué).

Accueil, le poste de commande (même branche `interieur-accueil`, PR #14, 8 octobre 6 h) :
- Rayan (5 h 50) : « on se veut en expert design et en expert fonctionnalité », « revoir ce qu'on propose, ce qu'on
  est censé proposer en respectant la vision », « nos objectifs, les vrais, sans se perdre avec tout ce qui a été
  dit » ; le design qu'il a apprécié se maintient et se continue dans les chantiers suivants.
- **Règle à garder : l'accueil a UN but, la prochaine étape** (vision : le geste central et « la valeur est dans le
  retour » ; étude complète, écran « Aujourd'hui »). Tout ce qui s'y ajoute passe en dessous ou n'y entre pas.
- **L'ordre** : barre du haut ; moment, titre, « Valence · date » ; l'horizon d'ARC ; **« Prochaine étape »** (une
  carte de verre à la couleur de son espace, « C'est fait » = la seule touche blanche de l'écran, « Fixer un moment »
  si elle n'en a pas) ; **« Ensuite »** (une ligne par étape, toute la ligne ouvre la pensée dans « Déposé ») ;
  « N pensées à ranger » ; « Déposé » et « Point du jour » ; **« Projets »** (ceux qui avancent, puis la liste
  « Endormis ») ; **« Ma vie »** (Santé, Juridique, cartes plus calmes) ; pied. Sur iPhone 390 × 844 la prochaine
  étape et sa touche sont dans le premier écran ; l'accueil passe de 4 744 px à 2 277 px de haut.
- **Sortis de l'accueil** (verdict « supprimer » de l'inventaire de `docs/ETUDE-COMPLETE.md`) : les quatre compteurs,
  la progression globale et sa phrase tirée au sort, « N bloquants. Résous maintenant. », « CRITIQUE » et
  « URGENCE », les étiquettes techniques des cartes, « Check-in du jour manquant » et le point qui clignote, l'ajout
  rapide de tâche (le dépôt le remplace), « Veille & Sources » (figée depuis avril ; `renderIntel`, `INTEL_STATIC`,
  `renderQA`, `animateCount` retirés, 129 lignes de style mortes aussi). Aucune donnée n'est effacée : `S.intel` et
  les tâches restent dans l'état.
- **Projets endormis** (décision du 5 octobre, enfin dans la page) : `WORLDS_V` = 3, `migrateWorlds` endort FBA,
  KITCHEN et TELENEUF une fois (`S.sleep`) ; ensuite c'est Rayan qui décide. Un projet endormi quitte les cartes :
  une ligne sous « Endormis » (anneau, nom, « Réveiller ») ; la ligne ouvre toujours le monde. Dans chaque monde, en
  bas : « Endormir ce projet » / « Réveiller ce projet » (`.w-sommeil`). `RANGE_DORMANT` n'existe plus : la note
  « Endormi. » envoyée au proxy suit `S.sleep`. Piège connu : un appareil resté sur une ancienne version de la page
  renvoie un état sans `sleep` ; à la lecture suivante les trois projets se rendorment.
- Carte d'un projet : pictogramme, « N bloquants » avec un point ambre (un fait, sans rouge ni ordre), nom,
  description sur deux lignes, progression, prochaine tâche. Le titre « Sept espaces. » est calculé (mondes + pôles).
- Mots : « Prochaine étape », « Ensuite », « Projets », « Ma vie », « Endormis », « Réveiller », « 2 en cours ·
  3 endormis » ; état vide : « Rien en cours. Dépose une pensée en bas de l'écran : ARC en tirera la prochaine
  étape. » ; Santé : « Ton suivi du jour, tes habitudes et tes objectifs. » (ce que l'écran fait aujourd'hui ;
  l'ancienne phrase promettait « performance, accompagnement »).
- Mac : la prochaine étape prend toute la largeur, sa touche à droite. Le raccourci « K recherche » du pied ne se
  montre que là où il y a un clavier.
- **À décider par Rayan (signalé, pas touché)** : « Valence » et le titre « Un cerveau. Sept espaces. » (vision :
  plus rien en dur) ; la War Room dans la barre du haut (elle s'ouvre sur ARYAN, tâches écrites en avril) ; le
  contenu de Santé (suivi à curseurs) ; les tâches et bloquants d'ARYAN et d'ATLAS affichés sur les cartes datent
  de l'état reconstitué, pas des pensées déposées (le lien pensée → projet reste à construire).
- Tests : accueil 12/12 (quatre contrôles ajoutés : ordre et retraits, prochaine étape dans le premier écran,
  « Ensuite » et « C'est fait », endormir et réveiller avec rechargement ; le moment de la journée pose l'heure au
  lieu de l'avancer, l'avance échouait parfois sous charge), entrée-fond 40/40, connexion 27/27, mondes 6/6, pôles
  9/9, dépôt 19/19, rangement 25/25, matin 27/27, proxy 41/41 ; contraste le plus faible sur l'accueil 5,41 : 1 ;
  538 `<div` / 538 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.**

Entrée, accueil épuré, ville (même branche `interieur-accueil`, PR #14, 8 octobre 7 h) :
- Rayan (6 h 41, dicté) : le nombre d'espaces du titre suit les espaces réels ; « Valence » vient de la position de
  l'appareil, ville et pays, et rien si la position n'est pas activée ou a été retirée ; sur l'écran d'entrée, « Garde
  en tête le strict nécessaire. Le reste prend vie ici. » prend la place de « Tu as une idée. Elle devient réelle. »
  (couleur à mon choix, « ça permettra à tout le reste de remonter ») ; sur l'accueil, « certaines choses doivent être
  supprimées sans même te dire », « la typographie doit être reprise immédiatement », « certaines cases sont assez
  grosses pour ce qu'elles sont » ; il invite à ajouter une idée de design ou de fonction.
- **Écran d'entrée, le titre** : « Garde en tête / le strict nécessaire. » en blanc, « Le reste prend vie ici. » dans
  le dégradé d'ARC ; trois lignes, coupées là où la phrase respire (`white-space:nowrap`, `<br>`), de 30 à 42 px ;
  `.auth-pitch` n'existe plus. Sur iPhone 390 × 844 la carte finit à 793 px (elle remonte). Contraste le plus faible
  4,94 : 1. `tests/entree-fond.mjs` : 41 contrôles (un ajouté : le titre de 360 à 1440 px).
- **Le nombre d'espaces** : déjà compté (`WORLDS.length + POLES.length`), maintenant vérifié (« Six espaces. »,
  « Un espace. »). **Ajouter ou retirer un espace depuis ARC n'existe pas encore** (les mondes sont écrits dans le
  code) : c'est le chantier « faire naître un monde depuis une pensée » ; le titre suivra tout seul.
- **Ma ville** (module « MA VILLE » dans `index.html`) : menu « ··· » › « Afficher ma ville ». Coupée par défaut : rien
  ne s'affiche et rien n'est demandé. Activée : le navigateur demande la position ; ARC affiche « ville, pays » après
  la date. Position refusée, autorisation retirée ou option coupée : rien, et la ville gardée est oubliée ; si
  l'autorisation revient, la ville revient seule. Vérifiée au lancement et au retour au premier plan (dix minutes au
  moins entre deux lectures).
  - **Donnée, à connaître** : pour trouver le nom de la ville, la position arrondie à 3 décimales (une centaine de
    mètres) part du navigateur vers `api.bigdatacloud.net` (service gratuit, sans clé, prévu pour le navigateur), au
    plus une fois tant que l'appareil n'a pas bougé d'un kilomètre. Jamais appelé sans coordonnées (il localiserait
    par l'adresse IP). Rien n'est écrit dans `S` ni dans Supabase ; `sw.js` ne garde pas la réponse en cache.
    Le pays s'écrit avec `Intl.DisplayNames` (« Royaume-Uni », pas la forme longue).
  - **Pas essayé avec le vrai service ni sur un vrai téléphone** : prouvé contre un faux appareil et un faux service.
    Sans session (écran d'entrée), ARC ne demande jamais la position ; après un refus, pas de nouvelle demande
    avant dix minutes.
    Sur iPhone, Safari peut redemander l'autorisation à chaque ouverture tant que le site n'est pas sur « Autoriser »
    (Réglages › Apps › Safari › Position).
- **Accueil épuré** (bloc de style unique « ACCUEIL : un seul but… » ; les règles de contenu des trois couches
  précédentes sont retirées, 150 lignes de style en moins) :
  - Le haut : une ligne (pictogramme du moment, date, ville) puis le titre sur UNE ligne (25 à 31 px, 40 px sur
    Mac ; dégradé éclairci `#FFA51F → #FF6B81 → #D596F7` car le titre est plus petit et plus près de l'horizon).
    La pastille « Matin / Nuit » et la ligne « Valence · date » n'existent plus (`#h-quand`, `#h-date`, `#h-lieu`).
  - Écriture du système partout ; titres de section en 17 px demi-gras (« Prochaine étape », « Ensuite »,
    « Projets », « Ma vie ») ; plus aucune petite capitale à chasse fixe sur l'accueil.
  - « N pensées à ranger » : une ligne fine avec un point ambre. « Déposé » et « Point du jour » : deux tuiles côte à
    côte (58 px au lieu de deux cases de 60 px empilées).
  - Projets en cours : une ligne chacun (`.pj` : pictogramme, nom, prochaine tâche, pourcentage, trait de progression
    en bas), 66 px au lieu de 255 px. Retirés de l'accueil : la description et « N bloquants » (ils sont dans le projet).
  - Endormis : repliés en une ligne (« Endormis · FBA, KITCHEN, TELENEUF », `#h-dort-tog`, `_dortOuvert`) ; dépliés,
    une ligne chacun avec « Réveiller ».
  - Ma vie : deux tuiles côte à côte (`.vie`), sans description ; une seconde ligne seulement s'il y a quelque chose
    à dire (« Check-in fait », « 3 éléments »).
  - Retirés : « ARC v2 · K recherche » en pied, « RAYAN · VALENCE » sous le logo.
  - Lignes de projet et tuiles se touchent au clavier (`role="button"`, Entrée ou Espace).
  - Hauteur de l'accueil sur iPhone 390 × 844 : 872 px vide (un écran), 1 171 px rempli (4 744 px en ligne le matin).
- Tests : accueil 17/17 (cinq contrôles ajoutés : cases à leur juste taille, nombre d'espaces, ville autorisée,
  ville refusée, aucune demande de position sans session), entrée-fond 41/41, connexion 27/27, mondes 6/6, pôles 9/9, dépôt 19/19, rangement 25/25, matin
  27/27, proxy 41/41 ; contraste le plus faible sur l'accueil 5,96 : 1 ; 519 `<div` / 519 `</div>`. Vérifié dans
  Chromium seulement : **à voir par Rayan sur son iPhone.**
- **Toujours à décider par Rayan** : la War Room dans la barre du haut ; le contenu de Santé ; « RAYAN » et « Valence »
  restent dans les contenus des projets et dans les consignes envoyées à Claude (ce sont ses projets, pas l'écran).

Mondes et pôles, l'écriture de l'accueil (branche `interieur-mondes`, 8 octobre 8 h, partie de `interieur-accueil` à `4684c0a`) :
- **État au départ** : PR #14 ouverte, pas fusionnée (vérifié à 7 h 55, « mergeable » sans conflit) ; `main` à `4bb5daf`.
  La branche part donc de `interieur-accueil` : **la PR #14 se fusionne d'abord, celle-ci ensuite.**
- Rayan (7 h 54) : « on continue l'intérieur d'ARC, dans le même design : les mondes et les pôles (même écriture que
  l'accueil), puis le cockpit d'une tâche, les tiroirs, la War Room, la recherche » ; garder « fond noir, horizons de
  couleur, verre sombre, police d'Apple, une seule touche blanche par écran, pictogrammes au trait, pas d'emoji ».
- Même contenu, même ordre, mêmes fonctions. Un seul bloc de style à la fin de la feuille (« MONDES ET PÔLES :
  l'écriture de l'accueil ») ; les règles d'en-tête des deux passes du 7 octobre sont retirées.
- **L'écriture** : police du système partout sur `#S2`, `#S3`, `#S4` (`--f` et `--fm` y valent `--fa`) ; Plus Jakarta
  Sans pour le nom du monde et le titre du pôle seulement (`--ft`) ; plus de chasse fixe ni de petites capitales ;
  titres de section à 17 px demi-gras, sans filet, comme « Projets » et « Ma vie ».
- **L'en-tête n'est plus une carte** : sur le noir, une ligne (la catégorie), le nom dans sa couleur, l'anneau, la
  description, puis **l'horizon de l'espace d'un bord à l'autre** (`.x-horizon`, un élément ajouté ; la même règle
  que `.h-horizon` de l'accueil, couleurs par `--c1`, `--c2`, `--c3`). Plus calme pour Santé et Juridique (couleurs
  à demi éteintes). **Piège prouvé : ne jamais mettre d'`opacity` sur `.x-horizon`** : elle en fait un plan à part et
  sa lueur passe au-dessus des cartes (le texte d'attente de la recherche juridique tombait à 3,39 : 1).
- **Pictogrammes** : ceux des espaces sont des variables sur `:root` (`--ico-w0` à `--ico-w4`, `--ico-monde`,
  `--ico-sante`, `--ico-juridique`), partagées par l'accueil et la barre du haut des mondes et des pôles
  (`#S2[data-wid]`, posé par `enterWorld`) ; étoile, étoile pleine et croix au trait à la place de ★ et ✕
  (`--ico-etoile`, `--ico-etoile-pleine`, `--ico-croix`) ; chevrons dessinés à la place de → et ↗.
- **Les cases à leur juste taille** (iPhone 390) : compteurs en une bande de quatre (60 px au lieu de quatre tuiles),
  lignes de 54 px, description repliée à trois lignes avec « Lire la suite » / « Réduire » (`descRepli`, le bouton ne
  se montre que si le texte dépasse). ARYAN : 4 078 → 3 408 px de haut, l'action prioritaire remonte de 953 à 650 px
  (elle entre dans le premier écran). Santé : 2 636 → 2 129 px. Juridique : 1 208 → 1 023 px.
- **Un seul repère de progression** : l'anneau (« 66 % fait », espace fine insécable) ; la pastille de la barre du
  haut est masquée. **Un bloquant est un fait** : ambre, comme sur l'accueil (plus de rouge sur le compteur, les
  cartes et le bouton d'ajout).
- **La touche blanche** : « Sauvegarder le check-in » sur Santé (le vert plein est retiré). Les mondes n'ont pas de
  touche blanche propre : la seule est « Déposer ». **À décider avec Rayan** quand le lien pensée → projet existera.
- Mots : « Accueil » sur le bouton de retour des mondes (« Mondes » avant ; les pôles disaient déjà « Accueil ») ;
  « Focus », « Lire la suite », « Réduire », « Aucun bloquant. » ; accents : « Mettre à jour », « Fatigue détectée ».
- **Trois défauts déjà en ligne, prouvés puis réparés** :
  1. La poignée ↕ de chaque tâche ne déplaçait rien : aucun code de glisser-déposer, `S.taskOrder` est lu
     (`renderTasks`) et jamais écrit. Elle est masquée.
  2. La croix ✕ ne supprime que les tâches ajoutées à la main (`del-task` filtre `S.custom`) ; sur une tâche écrite
     dans le monde elle ne faisait rien de visible. Elle ne s'affiche plus que sur les tâches ajoutées. **Toujours
     vrai : elle supprime sans confirmation ni annulation** (charte, règle 11) ; à traiter avec le cockpit.
  3. On revenait dans un monde ou un pôle à l'endroit où on l'avait quitté (`showScreen` ne remonte rien) : on y
     arrive maintenant par le haut (charte, règle 8).
- **Vu, pas touché** : sur iPhone, Claude n'est pas accessible depuis un monde ni un pôle (le panneau est masqué sous
  768 px et le bouton `#fab-claude` n'existe pas dans le balisage) ; les étiquettes « CHEMIN CRITIQUE », « BLOQUÉ »,
  « URGENT » et « Journalise maintenant. » sont des contenus pressants ; le minuteur de la barre du haut (Mac) ;
  `wbg` n'est plus lu (le fond des mondes est noir, la couleur vient de l'en-tête) ; « Aides » et les suggestions
  juridiques nomment toujours Valence et ARYAN ; le contenu de Santé (curseurs, score, « jour de suite »).
- Tests : `tests/mondes.mjs` et `tests/poles.mjs` contrôlent en plus l'écriture (police du système, ni chasse fixe ni
  capitales, sections à 17 px), l'horizon d'un bord à l'autre, un seul repère de progression, la description en
  trois lignes, le retour par le haut. `tests/accueil.mjs` : le contrôle du menu attend la fin de son ouverture
  (il échouait une fois sur six : mesuré pendant le fondu de 180 ms). Résultats : accueil 17/17, entrée-fond 41/41,
  connexion 27/27, mondes 6/6, pôles 9/9, dépôt 19/19, rangement 25/25, matin 27/27, proxy 41/41 ; contraste le plus
  faible : 5,28 : 1 (mondes), 5,68 : 1 (pôles) ; largeurs 360, 375, 393 et 430 px sans débordement ni libellé coupé ;
  522 `<div` / 522 `</div>`. Vérifié dans Chromium seulement, où la police du système est Inter : **San Francisco,
  le verre et les horizons masqués restent à voir par Rayan sur son iPhone.**
- **Outillage de cette session** : les serveurs des bibliothèques (cdnjs, jsdelivr, Google Fonts) étaient
  injoignables depuis l'environnement de travail ; les tests ont tourné avec les mêmes bibliothèques et polices
  installées par npm et servies localement (rien n'est ajouté au dépôt ni à la page).
- **Suite, dans l'ordre demandé** : le cockpit d'une tâche, les tiroirs, la War Room, la recherche (ils gardent
  l'ancienne écriture ; un tiroir ouvert depuis un monde se voit donc encore « d'avant »).
- **Décisions que Rayan doit encore prendre** : la War Room dans la barre du haut ; le contenu de Santé (curseurs,
  ou mémoire, échéances et rendez-vous) ; sa position envoyée à BigDataCloud pour afficher sa ville ; « Ce soir »
  après 23 h ; une ligne sur les données à la création de compte.

Cockpit d'une tâche (branche `interieur-cockpit`, 8 octobre 9 h 20, partie de `main` à `f70984c`) :
- **État au départ** : PR #14 et #15 fusionnées par Rayan à 9 h 12 ; l'accueil, les mondes et les pôles sont en ligne.
- Rayan (9 h 19) : « on enchaîne ! pour quoi as-tu opté en termes de fonction et de design ? ». Réponse donnée avant
  de construire : un cockpit = une tâche, de haut en bas ; le design des mondes.
- **Mesuré avant, sur iPhone 390** (Chromium) : le nom de la tâche réduit à « E » ; le bouton d'envoi à Claude hors de
  l'écran ; la réponse de Claude envoyée dans `#cockpit-right`, caché sous 481 px ; en mode « Chat », la réponse part
  dans le panneau du monde (`cpSend` → `#cp-msgs`), recouvert par le cockpit (preuve : `elementFromPoint` sur la
  réponse tombe dans `#cockpit`), et caché sur iPhone ; mission et journal cachés. Sur Mac : Échap ne fermait pas le
  cockpit (le code testait `style.display==="flex"`, jamais posé : le cockpit s'ouvre par la classe `open`).
  « Claude actif — contexte complet chargé » était un faux signal (seul le nom de la tâche partait). « Sauvegarde »
  n'apparaissait jamais (aucun code ne posait sa classe). Le compteur du monde ne suivait pas « Marquer accomplie ».
- **Fonction, dans l'ordre** :
  1. La tâche dans la carte de « Prochaine étape » de l'accueil, posée sur l'horizon du projet ; au-dessus, l'état
     (« Tâche à faire » / « Tâche faite ») ; l'échéance et « Focus du jour » s'il y a lieu (`#cockpit-meta`) ;
     **« C'est fait »**, la seule touche blanche (même mot que l'accueil). Faite, la tâche propose « Rouvrir la
     tâche », sans blanc. « C'est fait » ferme le cockpit et redessine le monde (`renderWorld`).
  2. **Mes notes** (`#cockpit-textarea`, `S.taskNotes`) : enregistrées 1,5 s après la frappe ; « Enregistré » ne
     s'affiche qu'après l'écriture (`saveCockpitWork`), et s'efface à la frappe suivante.
  3. **Demander à Claude** : un seul champ (`#ccb-inp`, devenu un champ qui grandit jusqu'à 160 px, `ccbTaille`) ;
     la question préparée d'une tâche (`task.prompt`) y est posée, jamais envoyée d'office ; la réponse arrive juste
     dessous (`.ck-ans`), avec « Ajouter à mes notes » → « Ajouté à tes notes ». **Le choix Injecter / Chat est
     retiré** (« Chat » répondait derrière le cockpit). Claude reçoit le nom du projet, sa mission, la tâche et la
     question (ligne vraie sous le champ). En cas d'erreur : le message dans le cockpit, et la question remise dans
     le champ (`cockpitState.lastQ`). Les réponses ne sont pas gardées : une autre tâche repart d'une liste vide.
  4. **Le projet** (mission, action prioritaire) et **Journal du projet** (`S.journal`, Entrée ajoute), visibles
     aussi sur iPhone.
  5. **Le minuteur** (Pomodoro) : un pictogramme et « Minuteur » dans la barre du haut ; pendant qu'il tourne, le
     bouton montre le temps restant ; « Démarrer », « Pause », « Reprendre », « Remettre à zéro », « Session 1 sur 4 ».
- **Design** : celui des mondes. Barre du haut : « ‹ [pictogramme] ARYAN » (retour au projet, `#cockpit-back-lbl`) et
  « Minuteur ». Police du système partout, titres de section à 17 px, aucune chasse fixe ni capitale, aucun emoji
  (« ✓ », « ↺ », « ⬆ », « ✦ », « 🍅 » retirés). Touche d'envoi en verre, flèche à la couleur du projet. Sur iPhone,
  une colonne qui défile (`#cockpit-body`) ; sur Mac (≥ 861 px), deux colonnes : la tâche, les notes et Claude à
  gauche, le projet et le journal à droite (380 px). Toutes les anciennes règles `#cockpit…`, `#ccb…`, `#pomo…` sont
  retirées (69 lignes) au profit d'un seul bloc « COCKPIT D'UNE TÂCHE » en fin de feuille.
- **Test intermittent réparé, cause prouvée** : `tests/accueil.mjs`, « Ma ville », échouait une fois sur trois
  (ERR_ABORTED vers BigDataCloud). Journal des requêtes : l'autorisation rendue, la page encore ouverte redemande la
  ville (voulu) et le test rechargeait 12 ms plus tard, coupant la demande. Le test attend 600 ms : 5 sur 5 ensuite.
  ARC n'est pas en cause.
- Tests : cockpit 17/17 (nouveau ; sur la version en ligne il bloque dès la première réponse de Claude, qui
  n'apparaît jamais), accueil 17/17, entrée-fond 41/41, connexion 27/27, mondes 6/6, pôles 9/9, dépôt 19/19,
  rangement 25/25, matin 27/27, proxy 41/41 ; contraste le plus faible dans le cockpit 7,98 : 1 ; 360 à 430 px sans
  débordement ; 520 `<div` / 520 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone**
  (San Francisco, verre, clavier qui monte sur le champ de Claude).
- **Pas touché** : la croix qui supprime une tâche ajoutée, sans confirmation (monde) ; la War Room, les tiroirs, la
  recherche (suite de la liste) ; sur iPhone, Claude reste inaccessible depuis l'écran d'un monde (seulement depuis
  le cockpit d'une tâche).
- **Décisions que Rayan doit encore prendre** : la War Room dans la barre du haut ; le contenu de Santé ; sa position
  envoyée à BigDataCloud ; « Ce soir » après 23 h ; une ligne sur les données à la création de compte.

Tiroirs, War Room, recherche (branche `interieur-tiroirs`, 8 octobre 10 h, partie de `interieur-cockpit` à `39be1c5`) :
- **État au départ** : PR #16 (cockpit) ouverte, pas fusionnée. **La PR #16 se fusionne d'abord, celle-ci ensuite.**
- Rayan (9 h 57) : « CHOISIS LE MEILLEUR POUR ARC ». Lecture retenue : continuer sa liste (tiroirs, War Room,
  recherche) en décidant moi-même, y compris la place de la War Room ; rien n'est en ligne avant qu'il fusionne.
  **Pas décidé à sa place** : sa position envoyée à BigDataCloud (donnée personnelle ; l'option reste coupée par
  défaut, donc rien ne part tant qu'il ne l'active pas), le contenu de Santé, « Ce soir » après 23 h, la ligne sur
  les données à la création de compte.
- **Tiroirs : retirés.** Mesuré sur iPhone : les six tiroirs (En cours, Bloquants, Journal, Mission, Action prioritaire,
  Contexte) recopiaient la page du monde ; le « + » du tiroir Bloquants ne faisait rien (`dr-add-blocker` n'avait
  aucun gestionnaire : 0 bloquant avant, 0 après, la phrase restée dans le champ) ; le tiroir de l'action prioritaire
  s'intitulait « ARYAN — Mission » ; le tiroir « task-work » n'était plus jamais ouvert (aucun appel). À la place,
  chaque compteur du monde mène à sa section (`allerA`, `data-aller` : `taches`, `faites` qui déplie les tâches
  faites, `bloquants`, `journal`, ids `wsec-…`), au doigt et au clavier. La mission, l'action prioritaire et les
  bloquants ne s'ouvrent plus (flèches retirées). Le bouton « Contexte » (Mac) est retiré. Aucune donnée touchée.
- **War Room : retirée**, avec son bouton de la barre du haut de l'accueil. Elle refaisait le cockpit en moins bien :
  une tâche choisie d'office (la première non faite d'ARYAN, écrite en avril), les mêmes notes (`S.taskNotes`), un
  Claude qui répondait dans le panneau du monde, caché derrière elle, et un « Analyse War Room en cours… » qui
  n'envoyait rien. Le cockpit garde tout ce qu'elle faisait (tâche, notes, Claude, minuteur, « C'est fait »), et le
  focus du jour (étoile d'une tâche) ouvre déjà le cockpit. L'accueil de bienvenue ne la nomme plus.
- **Recherche : construite. Elle n'avait jamais marché** : la page appelait `searchQuery`, jamais écrite (aucune
  définition dans aucune version depuis le premier envoi du 13 avril, `781a00f`) ; chaque lettre tapée levait une
  exception (preuve : 8 « searchQuery is not defined » pour « boutique »). Maintenant (`searchQuery`, `srNorm`,
  `srMark`, `srChoisir`) : pensées (sauf annulées, avec leur espace et leur date), tâches par titre ou par les notes
  du cockpit, projets (nom, catégorie, mission, description), journal des projets, Juridique ; sans accents ni casse,
  tous les mots ; six lignes par groupe ; mots trouvés surlignés ; texte posé sans `innerHTML`. Une ligne ouvre la
  chose là où elle vit : la pensée dans « Déposé », la tâche dans son cockpit, l'entrée au journal du projet, la
  démarche dans Juridique (la recherche y est reprise). ⌘K ouvre, flèches et Entrée sur Mac, « Fermer » et Échap.
  Même écriture que l'accueil (verre sombre, police du système, titres de groupe à 17 px).
- Tests : recherche 8/8 (nouveau ; échoue sur la version en ligne), mondes 7/7 (un contrôle ajouté : les compteurs
  mènent à leur section, plus de tiroir ni de flèche), accueil 17/17 (la War Room n'existe plus : ni bouton, ni
  écran, ni mot), cockpit 17/17, entrée-fond 41/41, connexion 27/27, pôles 9/9, dépôt 19/19, rangement 25/25,
  matin 27/27, proxy 41/41 ; 449 `<div` / 449 `</div>` (le code des tiroirs écrivait beaucoup de `<div` dans des
  chaînes). Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone** (clavier de l'iPhone sur la
  recherche, défilement doux vers une section).
- **Vu, pas touché** : l'accueil de bienvenue des nouveaux comptes (`#onboarding`, montré si `S.seen` est neuf) a
  des emoji, « ARC v2 » et « 5 mondes » ; Santé n'est pas dans la recherche (curseurs, en attente de sa décision).

Écran de bienvenue retiré (branche `interieur-bienvenue`, 8 octobre 18 h, partie de `interieur-tiroirs` à `6ad124c`) :
- **État au départ** : PR #16 (cockpit) et #17 (tiroirs, War Room, recherche) ouvertes, pas fusionnées.
  **Ordre de fusion : #16, puis #17, puis celle-ci.**
- Rayan (18 h 01) : « on attaque ». Chantier proposé à 10 h 20 : l'écran de bienvenue des nouveaux comptes.
- **Preuve : il ne s'affichait jamais.** L'état de départ porte déjà une date « vu » (`var S = {…, seen: new
  Date().toISOString()}`), et l'écran ne s'ouvrait que si `S.seen` était vide ou valait « new ». Mesuré : compte neuf
  connecté et sans session, `#onboarding` jamais actif. Son contenu datait d'avril (emoji, « ARC v2 », « 5 mondes »).
- **Choix : retiré** (balisage, style, `obNext`, `obFinish`, `obStep`). L'écran d'entrée présente déjà ARC (Penser,
  Développer, Entreprendre) et l'accueil vide dit quoi faire. Le champ `S.seen` reste dans l'état (donnée inchangée).
- Tests : accueil 17/17 (le contrôle de la barre du haut vérifie aussi que l'écran de bienvenue n'existe plus),
  les dix autres suites passent ; 427 `<div` / 427 `</div>`.
- **Vu pendant les tests, à éclaircir** : le 8 octobre à 18 h 12, une connexion vers le vrai Supabase
  (`zcelpyexerxlhwtfpcbf.supabase.co`) a été tentée pendant `tests/depot.mjs` ou `tests/rangement.mjs` ; le réseau de
  l'environnement de travail l'a refusée, rien n'a été lu ni écrit. Source non trouvée (le code d'ARC n'ouvre aucune
  connexion « temps réel ») : à chercher avant de faire tourner les tests sur une machine qui a accès au réseau.

En ligne (9 octobre) : PR #16, #17 et #18 fusionnées par Rayan le 8 octobre à 18 h 19 (`main` à `d5620f4`).

**Rangement constaté en réel sur l'iPhone (9 octobre, 23 h 26)** : Rayan a redéployé le proxy de `main` (455 lignes,
`claude-sonnet-5-5`, `tool_choice` « auto »). « Appeler le comptable » : étape gardée telle quelle, aucun moment inventé,
espace Juridique (validé par Rayan en touchant « Rétablir » ; il avait d'abord annulé le dépôt, sans doute pour cet
espace). Le geste central (déposer, ranger, voir l'étape) marche de bout en bout. Le point du matin s'est ouvert à
23 h 14 (première ouverture du jour, voulu).

Synchronisation, fusion au lieu d'écrasement (branche `synchro`, 10 octobre 1 h, partie de `main` à `d5620f4`) :
- Accord de Rayan (9 octobre, 23 h 37 et 10 octobre, 1 h 03) : « OUI », « GO ATTAQUONS ARC ».
- **Défaut prouvé** (avant toute correction, faux Supabase, deux navigateurs) : l'iPhone ajoute une entrée au journal,
  l'envoie ; le Mac, resté ouvert, ajoute une note de tâche et envoie tout son état ; l'entrée de l'iPhone disparaît
  en ligne, puis de l'iPhone à son retour au premier plan. Cause : `pushToCloud` envoyait tout `S` sans relire
  (`upsert`), `pullFromCloud` remplaçait tout (`Object.assign`) quand l'autre côté était plus récent. Sur la version en
  ligne, `tests/synchro.mjs` échoue 6 fois sur 11.
- **Correction** : un échange (`syncEchange`) lit la ligne, fait une fusion à trois (`syncFusionner`) entre la base
  (dernier état commun, `arc_sync_base_v1` sur l'appareil), l'état de l'appareil et l'état en ligne, puis n'écrit que
  si quelque chose change, et seulement si la ligne n'a pas bougé depuis la lecture (`update … eq('updated_at', …)` ;
  sinon relire et refusionner, trois fois ; au quatrième, si la ligne n'a vraiment pas bougé, écriture simple).
  Règles : ce qu'un seul côté change est gardé ; dans une liste, chaque ajout est gardé et chaque suppression appliquée
  (éléments datés remis dans l'ordre du temps) ; `lastActive` et `taskOrder` vont d'un bloc ; `_lastAction`,
  `_savedAt`, `_worldsV` : le plus grand ; même valeur changée des deux côtés : la plus récente (`_lastAction`)
  l'emporte et, si c'est un texte, l'autre est gardé sur l'appareil (`arc_sync_pertes_v1`, 50 au plus, aucun écran ne
  le montre encore) ; un seul check-in Santé par jour. Ce qui est saisi pendant un échange est refusionné
  (`syncAppliquer`). Un envoi demandé pendant un échange est refait juste après (`_syncAgain`, avant : perdu jusqu'à
  l'action suivante). Appareil qui se sait hors réseau : rien n'est tenté, « Hors ligne » tout de suite.
- **Premier échange de chaque appareil après la mise en ligne** : pas encore de base, donc union des deux états ; rien
  ne se perd, mais un élément supprimé sur un seul appareil avant la mise en ligne peut revenir une fois.
- Inchangé : la première connexion d'un appareil (la version en ligne l'emporte, état local gardé sous
  `arc_v2_avant_connexion`, et elle devient la base) ; la création de la ligne par l'appareil de référence ; aucune
  table ni règle Supabase touchée, aucune lecture de la vraie base. Les pensées et rangements n'étaient pas concernés.
- Hors réseau, supabase-js réessaie une lecture environ 8 s avant d'échouer (mesuré) : « Hors ligne » peut mettre ce
  temps à s'afficher quand le navigateur se croit en ligne.
- `tests/outils.mjs` : le faux Supabase garde une vraie ligne `arc_data` (lecture, création, écriture conditionnelle,
  date rendue comme Postgres) ; `fk.arc = null` = compte sans ligne.
- Tests : synchro 11/11 (nouveau), proxy 41/41, connexion 27/27, dépôt 19/19, rangement 25/25, matin 27/27, accueil
  17/17, mondes 7/7, pôles 9/9, cockpit 17/17, recherche 8/8, entrée-fond 41/41 ; 427 `<div` / 427 `</div>`.
  Vérifié dans Chromium seulement, contre un faux Supabase : **le vrai passage Mac ↔ iPhone reste à constater par Rayan.**
- **PR #19 fusionnée par Rayan le 10 octobre à 2 h 17 ; constaté en réel à 3 h 25** : une entrée au journal d'ARYAN
  écrite sur l'iPhone, une autre sur le Mac resté ouvert, les deux restent (« les deux test ok »).

En faire un projet (branche `developper`, 10 octobre 3 h 30, partie de `main` à `0e0bdf0`) :
- Rayan (3 h 25) : « go » pour « Développer · Fais-en un projet, étape par étape » (promis par l'écran d'entrée, pas
  construit). Accord donné pour envoyer la pensée à Claude afin qu'il propose le projet.
- **Socle** : `S.mondes` (une entrée par projet : `id`, `name`, `key`, `color`, `mission`, `desc`, `etapes` [{id, t}],
  `from` = la pensée d'origine) ; `monde(id)` remplace les 19 `WORLDS[…]` ; la recherche prend l'`id` du projet et
  non sa place. Les données par projet (`S.tasks`, `S.journal`…) restent rangées par `id`, comme avant. Les cinq projets
  d'origine ne bougent pas. La synchronisation fusionne `S.mondes` champ par champ (aucun changement dans `sync…`).
- **Le geste** : sous une pensée (« Déposé »), « En faire un projet » ouvre une feuille ; Claude propose nom, mission
  et trois étapes (`projetDemander` : chemin de la discussion du proxy, consigne `PJ_SYSTEM`, 500 jetons, rien
  d'enregistré côté serveur, **aucun redéploiement**) ; la réponse est lue comme du JSON et vérifiée (`projetLire`) ;
  un champ déjà touché par Rayan n'est jamais remplacé. Panne, réponse illisible ou hors réseau : la feuille le dit et
  la pensée est mise en première étape. Nom vide, trop court ou déjà pris (même clé de rangement, Santé et Juridique
  compris) : message sous les champs, rien n'est créé. « Créer le projet » : `S.mondes`, la pensée rangée dans le
  projet (ligne `origin` user), le projet s'ouvre, bulle « Projet créé · il est dans Projets ». Ensuite, sous la
  pensée : « Ouvrir le projet … ».
- **Dans le projet** : catégorie « Projet · né le … », description « Né de ta pensée : « … » », mission, les étapes
  comme tâches (cockpit, étoile, anneau, recherche : tout marche) ; « Action prioritaire » et « Prochaines actions »
  sont cachées quand elles sont vides (`wsec-prio`, `wsec-na`). Couleur choisie parmi `MONDE_COULEURS` (vives, aucune
  brune), la première qu'aucun projet n'a. Pictogramme : celui d'un monde inconnu.
- **Sur l'accueil** : la prochaine étape d'un projet né d'une pensée (une par projet éveillé) suit celles des pensées
  (`rangeHomeProjet`) ; « C'est fait » coche la tâche du projet ; « Ouvrir le projet ». Avant ce correctif, l'accueil
  disait « Rien en cours » juste après la création d'un projet de trois étapes. Les tâches des cinq projets d'origine
  n'y entrent pas (écrites en avril). `renderHome` redessine aussi la prochaine étape. Le point du matin n'est pas touché.
- **Rangement** : le nouvel espace est proposé au proxy (`key` gardée à la création, sans accents) ; au-delà de 12
  espaces (limite du proxy), les projets endormis puis les plus récents ne sont plus proposés ; Santé et Juridique
  toujours.
- Corrigé en passant : la bulle « ☁ Sync · heure » (emoji, et posée sur la note du dépôt) est retirée, la pastille du
  haut suffit ; le nuage est retiré des deux autres bulles.
- **Pas fait, à décider** : renommer ou supprimer un projet créé (l'endormir marche) ; ses étapes ajoutées ensuite
  vont dans `S.custom` comme pour les autres projets (l'anneau ne compte pas ces tâches-là, défaut ancien, tous
  projets) ; la croix qui supprime une tâche ajoutée sans confirmation (ancien).
- Tests : projet 26/26 (nouveau), synchro 11/11, proxy 41/41, connexion 27/27, dépôt 19/19, accueil 17/17,
  rangement 25/25, matin 27/27, mondes 7/7, pôles 9/9, cockpit 17/17, recherche 8/8, entrée-fond 41/41 ;
  436 `<div` / 436 `</div>`. Vérifié dans Chromium seulement : **le vrai Claude et l'iPhone restent à voir par Rayan.**

- **PR #20 fusionnée par Rayan le 10 octobre à 4 h 08.** Premier essai réel (4 h 13, iPhone, pensée « OUVRIR SOCIÉTÉ
  DE NETTOYAGE D'EXTÉRIEUR ») : « ARC n'a pas pu préparer le projet ». **Cause non prouvée** : le proxy transmet bien
  `system` et `max_tokens` (`supabase/functions/ARC-CLAUDE-PROXY/index.ts`, fonction `chat`) ; la page ne gardait pas
  la raison. Hypothèses : réponse de Claude dans une forme que `projetLire` refusait (clés accentuées comme « étapes »,
  objets au lieu de textes), réponse coupée à 500 jetons, refus du service, réseau.
- **Correctif (branche `projet-proposition`, partie de `main` à la fusion de la PR #20)** : lecture tolérante (bloc
  ```json, clés accentuées ou anglaises, étapes en textes, objets ou lignes, numéros retirés, objet `projet`
  englobant) ; 800 jetons ; la feuille dit la raison en mots (`PJ_RAISONS` : session, réseau, session expirée, compte
  sans accès, trop de demandes, panne, refus, réponse coupée, réponse vide, forme inattendue), sans code ; la raison
  est aussi gardée sur l'appareil (`arc_projet_diag`) ; « Demander à nouveau à ARC » (`projetProposer`) quand
  réessayer peut servir. Espaces insécables devant les deux-points (« pensée : » ne commence plus une ligne).
  **Au prochain essai, la phrase de la feuille dira la cause.**
- Tests : projet 30/30 (quatre contrôles ajoutés), les douze autres suites passent ; 436 `<div` / 436 `</div>`.
- **PR #21 fusionnée à 4 h 29 ; constaté en réel à 4 h 31 (iPhone)** : la feuille se remplit avec le vrai Claude
  (« Nettoyage extérieur », une mission, trois étapes concrètes, aucun fait inventé). La cause du premier échec reste
  non prouvée (lecture trop stricte ou réponse coupée, les deux corrigés). Vu sur sa capture : la mission de trois
  lignes était coupée dans son champ de deux lignes ; corrigé sur la branche `projet-mission` (la mission grandit
  comme les étapes ; le contrôle « en entier » échoue sur la version en ligne, passe après).

Sections vides repliées (branche `projet-sections`, 10 octobre 5 h, partie de `main` après la PR #22) :
- Vu sur les captures de Rayan (4 h 49, projet « Nettoyage d'extérieur ») : quatre sections vides (Bloquants, Notes,
  Journal, Outils) prenaient un écran et demi sous les trois étapes ; « Journalise maintenant. » donnait un ordre.
  Rayan : « go » (4 h 50).
- Vide, une section n'est plus qu'une ligne : son titre et une touche (« Ajouter », « Écrire » pour les notes ;
  `.wsec.vide`, `.wsec-ouvrir`, `sectionsVides`, `sectionOuvrir`, `_secOuvertes` remis à zéro à l'entrée d'un monde).
  La touche ouvre le champ et y place le curseur ; Outils ouvre directement l'ajout d'un outil. Dès qu'il y a quelque
  chose, la section reste ouverte. Vaut pour tous les projets. « Pas encore d'entrée. » sans l'ordre.
- Projet neuf sur iPhone 390 : 1 697 px de haut avant, 1 273 px après. Rien n'est effacé, aucune donnée touchée.
- `tests/mondes.mjs` : au clavier et au doigt, la position de la section Journal est comparée à 2 px près (elle
  différait d'un pixel d'arrondi une fois la page plus courte).
- Tests : projet 31/31 (un contrôle ajouté), mondes 7/7, et les onze autres suites passent ; 436 `<div` / 436 `</div>`.

Accueil, centre de contrôle : étude puis le sol et le ciel (branches `etude-accueil` et `centre-controle`, 10 octobre
5 h 30 et 6 h, parties de `main` après la PR #23) :
- Rayan (5 h 26, dicté) : « transformer cet espace en un centre de contrôle de notre vie, hyper connecté, comme dans un
  film de science-fiction, en supprimant ce fond noir fade seul ; là je vois une page chargée de fonctions, l'une
  après l'autre » ; il demande une étude ou un audit ; d'autres visions viendront, il en parlera plus tard.
  Puis (5 h 52) : « choisis le meilleur pour ARC, si tu as totalement compris ma vision ».
- **Étude** : `docs/ETUDE-ACCUEIL.md`, par un agent qui n'avait pas construit l'écran. Diagnostic : une colonne de
  cartes grises de même poids sur un noir uni, un horizon qui ne bouge jamais, aucun signal vivant. Trois principes :
  un horizon, un sol ; chaque lumière dit un fait ; le vivant devant, le dormant derrière. Direction unique « le sol
  et le ciel », quatre étapes testables (fond, hiérarchie, signaux vrais, horizon qui répond), validation iPhone
  après la deuxième. Cinq questions posées à Rayan avec réponses supposées (toutes « oui ») : il a délégué le choix.
- **Étape 1, le fond** (`#S1 .h-ciel`, `#S1 .h-sol`, dans `.hw` pour défiler avec le contenu, `z-index` −1 sous un
  `.hw` isolé ; aucun mode de fusion) : le ciel, une lueur basse en haut à la couleur de l'espace de la prochaine
  étape (`--ciel`, posé par `homeCiel` depuis `rangeHomeRender` : orange pour ARYAN, bleu pour un projet né d'une
  pensée, violet d'ARC si rien n'attend) ; le grain de l'écran d'entrée, noir, à 22 % ; le sol, un second arc
  presque éteint (opacité 0,5 sur un dégradé déjà pâle), dont le bord passe 40 px sous la carte du but (`--sol-y`,
  recalculé au rendu et au redimensionnement). **Piège vu** : `#S1` est `position:fixed` et défile ; les couches
  doivent vivre dans `.hw`, et le sol se mesure par rapport à `.hw`, pas à `#S1`.
- **Étape 2, la hiérarchie** : la carte du but porte un filet à sa couleur (45 %) ; tout ce qui suit (Ensuite,
  Projets, Ma vie, tuiles, Endormis) passe sous le sol avec un filet plus discret (6 %) et un fond plus sombre.
  Une seule touche blanche, inchangée. La page ne s'allonge pas (1 168 px remplie sur iPhone 390).
- **Pas encore fait, étapes 3 et 4** (après validation sur iPhone) : les signaux vrais (moment de l'étape, « N étapes
  faites aujourd'hui », dernière activité par projet et retrait après 7 jours, synchronisation en mot, Point du jour
  vu) ; l'horizon qui répond (comète sur « C'est fait », point de lumière au dépôt, éclair au rangement, trait de
  synchronisation), jamais en boucle.
- Tests : accueil 19/19 (deux contrôles ajoutés, iPhone et Mac : couches sous le contenu, grain, ciel à la couleur
  de la prochaine étape, sol sous sa carte, ≥ 8 % de noir franc), les douze autres suites passent ; contraste
  ≥ 4,5 : 1 mesuré partout ; 438 `<div` / 438 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan sur son
  iPhone** (le rendu des lueurs et du grain sur l'écran OLED).

Centre de contrôle, étapes 3 et 4 : les signaux vrais, l'horizon qui répond (branche `signaux-vrais`, 10 octobre
6 h 25, partie de `main` à `505071d`, PR #24 fusionnée à 6 h 21) :
- Rayan (6 h 22) : « go ».
- **Signaux vrais** (chaque chiffre vient de l'état ; zéro = absent) : sous le titre, `#h-faits` : « N étapes faites
  aujourd'hui · N pensées déposées » (`faitsDuJour`, `renderFaits`), absent s'il n'y a rien ; sur la carte du but,
  « Sans moment » si aucun moment n'est fixé (`.next-sans`) ; sur chaque ligne de projet, la dernière activité
  (`projetActivite`, `depuisQuand` : « aujourd'hui », « hier », « il y a N j », « il y a N mois »), en tête de la
  seconde ligne pour ne jamais être coupée ; sans mouvement depuis 7 jours, la ligne recule (`.pj.calme` : plus
  basse, sans relief, nom à 16 px, contraste gardé) ; la pastille de synchronisation dit « À jour 06:24 » (heure du
  dernier échange, `_syncAt`), « Envoi… » pendant, « Hors ligne » sinon, plus de point vert muet ni de « ✓ Sync » /
  « ARC » ; « Point du jour » dit « Vu à 08:12 » une fois vu (depuis le 10 octobre 7 h 30 : « 08:12 » en grand et
  « vu », dans le poste).
- **Faux signal prouvé et écarté** : `S.taskDates` est posé à `Date.now()` par défaut au chargement (`normalizeS`,
  « 34 étapes faites aujourd'hui » sur un appareil neuf). Un vrai « C'est fait » écrit `S.taskDone[wid][tid]`
  (`tacheFaite`, depuis la case d'un monde, le cockpit et l'accueil) ; seuls ces horodatages comptent.
- **L'horizon répond** (`horizonRepond`, une fois, jamais en boucle, rien si l'appareil demande moins de
  mouvement) : « C'est fait » lance la comète le long de l'arc (`.h-comete`, `hComete`, 1,1 s, tête blanche et
  traîne à la couleur de l'espace) ; une pensée déposée fait monter une étincelle de la barre du bas vers l'horizon
  (`.h-etincelle`, `hEtincelle`, 0,9 s) ; un rangement reçu de l'IA éclaire le ciel une seconde à la couleur de
  l'espace (`.h-ciel.va-eclair`, `hEclair`). Toujours `transform`, `opacity`, fond ; aucun mode de fusion.
- **Piège vu** : les rangements arrivent après `renderHome` (par `depotRender → rangeHomeRender`) ; les faits et
  les lignes de projet se redessinent donc aussi depuis `rangeHomeRender` (garde `_renderCardsEnCours`).
- Tests : accueil 24/24 (trois contrôles ajoutés : signaux vrais iPhone et Mac, « C'est fait » compté et comète
  absente sous mouvement réduit, et, avec le mouvement permis, étincelle et comète une fois puis éteintes, aucune
  boucle), les douze autres suites passent ; 439 `<div` / 439 `</div>`. Vérifié dans Chromium seulement : **la
  fluidité de la comète et de l'étincelle reste à voir par Rayan sur son iPhone.**

Accueil sans agenda, le poste (branche `accueil-sans-agenda`, 10 octobre 7 h 30, partie de `main` à `b1ae24c`, PR #25
fusionnée) :
- Rayan (7 h 19, dicté) : l'étincelle marche sur son iPhone ; « en entrant ici, on dirait que c'est un agenda. Et moi,
  ce que je veux, c'est pas un agenda […] la prochaine étape, elle y soit pas. Qu'on supprime ça. Le ensuite, on
  supprime. On laisse déposer, le point du jour, [les pensées] à ranger. On dispose d'une autre manière avec un design
  différent. Et ensuite, on verra pour la suite. On va diviser ça en deux parties. » **Règle à garder : la première
  page n'est pas un agenda ; aucune liste d'étapes sur l'accueil** (elles vivent dans le Point du jour et dans « Déposé »).
  Ceci est la première partie (le haut de l'accueil) ; la seconde (Projets, Ma vie) attend sa décision.
- **Retirés de l'accueil** : « Prochaine étape » (la carte, son « C'est fait », « Fixer un moment »), « Ensuite », « Rien
  en cours. Dépose une pensée… », `rangeNextSteps`, `rangeHomeProjet`, les styles `.next-*`, les deux tuiles
  `.depot-entry`. Aucune donnée touchée : les mêmes étapes s'affichent dans le Point du jour et dans « Déposé ».
- **Le poste** (`#h-poste`, bloc de style « LE POSTE ») : une console de verre que porte l'horizon, filet du haut aux
  couleurs d'ARC (la console est à ARC, pas à un espace), lueur et bord à la couleur du ciel. Deux instruments
  (`.h-inst`, chiffre en grand `.h-inst-v` 36 px, 44 sur Mac, chasse fixe, mot dessous `.h-inst-s`) : **Déposé**
  (`#depot-n` = nombre de pensées ni annulées ni refusées, `#depot-count` = « pensées · 2 en attente ») et **Point du
  jour** (`#matin-entry-v`, `#matin-entry-n`, posés par `matinLabels` : heure du point une fois vu, nombre d'étapes du
  jour, « 08:00 / à venir », « — / Rien n'attend », « — / Désactivé »). Dessous, **l'écho** (`#h-echo`, `homeEcho`,
  `ilYA`) : la dernière pensée déposée, ses mots sur une ligne, depuis quand ; ouvre « Déposé » sur elle. Puis
  **« N pensées à ranger »** (`#h-ranger`, point ambre), absent à zéro ; ouvre « Déposé ». `#next-torange` n'existe plus.
- **Le ciel** (`homeCiel`, `homeCielCouleur`) prend la couleur de l'espace où la dernière pensée a été rangée (un fait ;
  faites comprises, annulées et hésitations exclues) ; violet d'ARC sans rangement. Le sol passe 40 px sous le poste.
- **La comète** n'a plus de « C'est fait » sur l'accueil : elle part sur tout « C'est fait » (`rangeAdd` avec `status`
  done et `origin` user ; `tacheFaite`) et, si « Déposé » ou le Point du jour couvre l'accueil, attend leur fermeture
  (`_cometeEnAttente`, `cometeAttendue`, appelée par `depotClose` et `matinClose`). Toujours une fois, jamais en boucle.
- Plus aucune touche blanche sur l'accueil : la seule est « Déposer », dans la barre. iPhone 390 × 844 : l'accueil
  rempli fait 979 px (1 168 avant), tout le poste dans le premier écran.
- Tests : accueil 24/24 (contrôles réécrits : ordre avec le poste, aucune liste d'étapes ni « Prochaine étape » ni
  « Ensuite », chiffres vrais, écho, « à ranger », « C'est fait » depuis « Déposé » compté et comète à la fermeture),
  rangement 25/25 (les contrôles 6, 7, 9, 18, 19 et 20 lisent le Point du jour au lieu de l'accueil ; fixtures sans
  moment pour y figurer), projet 31/31 (le projet né d'une pensée est une ligne sous « Projets », le ciel prend sa
  couleur), et les dix autres suites passent ; contraste le plus faible sur l'accueil 6,29 : 1 ; 437 `<div` /
  437 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.**
- **PR #26 fusionnée par Rayan le 10 octobre (`main` à `57d2a4a`) ; vu sur son iPhone à 17 h 48** (ses captures) : tout
  le poste tient dans le premier écran (Déposé « 6 pensées », Point du jour « 08:02 vu », la dernière pensée, « 2 pensées
  à ranger »), titre « Un cerveau. Huit espaces. », pastille « À jour 17:48 ».

Le poste vu sur l'iPhone : deux défauts (branche `poste-iphone`, 10 octobre 18 h, partie de `main` à `57d2a4a`) :
- **Écran d'entrée, champ adresse en jaune pâle, texte illisible** (capture de Rayan, 17 h 48, champ sélectionné).
  Cause prouvée : `index.html`, `.auth-field .auth-input:focus{box-shadow:none}` (cadran du 7 octobre) a le même poids
  que `.auth-input:-webkit-autofill:focus` (ombre sombre qui couvre le jaune du trousseau) et vient plus bas : il
  l'emporte et retire l'ombre dès que le champ est sélectionné. Au repos le champ restait sombre, d'où le « tout est
  ok » du 7 octobre. Reproduit dans Chromium en rejouant la cascade (sélecteurs « autofill » remplacés par une classe,
  jaune posé comme le fait Safari, transition de retard coupée) : même image que sa capture. Correction : deux règles
  plus lourdes, `.auth-field .auth-input:-webkit-autofill:focus` et `:autofill:focus`, gardent l'ombre sombre et le
  texte clair. Outil de simulation hors dépôt ; le contrôle est dans `tests/connexion.mjs`.
- **« N pensées déposées » comptait les dépôts annulés** (`faitsDuJour`), alors que « Déposé », sur le même écran, les
  retire (`depotRender`). Prouvé sur `main` : trois pensées, une annulée → « Déposé 2 », « 3 pensées déposées ». Les
  deux suivent maintenant la même règle. Sur l'iPhone de Rayan (6 et 6), l'écart n'est pas démontré : sans lecture de
  ses données, impossible de savoir s'il a annulé une pensée aujourd'hui.
- **Test intermittent réparé, cause prouvée** : `tests/recherche.mjs`, cible de 42 px sur Mac, une fois de temps en
  temps. La recherche s'ouvre en 220 ms avec un zoom de 0,96 (`searchIn`) et le test mesurait à 150 ms
  (44 × 0,96 = 42). Le test attend la fin de l'animation. ARC n'est pas en cause.
- **Outillage de cette session** : cdnjs, jsdelivr et Google Fonts injoignables ; bibliothèques installées par npm et
  servies localement (`/tmp/arc-outils`, hors dépôt) ; Playwright 1.56.1, accordé au Chromium installé (1194).
- Tests : connexion 28/28 (un contrôle ajouté, échoue sur `main`), accueil 25/25 (un contrôle ajouté, échoue sur
  `main`), recherche 8/8, et les dix autres suites passent. Vérifié dans Chromium seulement : **le champ du trousseau
  reste à voir par Rayan sur son iPhone.**

- **PR #27 fusionnée par Rayan le 10 octobre à 18 h 57** (`main` à `fbfd185`).

Accueil, seconde partie : Projets et Ma vie (branche `accueil-projets`, 10 octobre 19 h, partie de `main` à `fbfd185`) :
- Rayan (18 h 58) : « go on continue », lu comme le « go » de la seconde partie (« sinon go et tu choisis le meilleur
  pour ARC »).
- **Constat sur ses captures** : chaque ligne de projet affichait sa prochaine tâche (« Essai « Ma boutique » : Bo… »,
  « Immatriculer la structure (micro ou… », coupées) : trois étapes listées sur l'accueil, c'est-à-dire l'agenda qu'il
  a refusé, en plus discret. Trois cartes teintées, chacune dans sa boîte, du même poids que le poste.
- **Projets, un seul panneau** (`.h-pjs`, qui contient `#hgrid` et `#h-dort`) : une ligne par projet, son pictogramme
  au trait sans carré, son nom dans sa couleur, **son état vrai** (`projetEtatMots` : « Actif aujourd'hui »,
  « Actif hier », « Actif il y a 3 j », « Calme depuis 10 j » ; rien s'il n'a jamais bougé), son pourcentage ; la barre
  de progression, en bas de la ligne, sert de séparation (lueur à la couleur du projet). **Plus aucune tâche.**
  Ordre : ceux qui bougent devant, du plus récent au plus ancien ; les calmes (7 jours sans mouvement) derrière,
  plus bas et plus sombres ; à égalité, l'ordre habituel. Les endormis sont la dernière ligne du panneau, repliée.
  Au toucher, la ligne prend un fond pâle (plus de rétrécissement dans un panneau).
- **Ma vie** : le même panneau, coupé en deux comme le poste mais sans sa lumière, plus sombre ; mêmes secondes lignes
  qu'avant (« Check-in fait », « 3 éléments », absentes à zéro).
- Le pourcentage reste celui de l'anneau du projet (même calcul) : pour les cinq projets d'origine, il compte des
  tâches écrites en avril. Non changé, signalé.
- **Pas fait, à proposer** : les pensées rangées dans un projet ne se voient pas dans le projet (l'écran d'un monde ne
  les liste pas) ; c'est pourquoi la ligne ne dit pas « 3 pensées » : ce chiffre ne mènerait à rien de visible.
- Tests : accueil 26/26 (un contrôle ajouté : un seul panneau, état vrai, aucune tâche, ordre ; le contrôle
  « endormir / réveiller » ne dépend plus de l'ordre des lignes ; le seuil de garde « plus de 300 morceaux de texte
  mesurés » passe à 250, l'accueil en ayant 300 pile sans les lignes de tâches ; le contraste le plus faible reste
  6,29 : 1), projet 31/31 (la ligne du projet né d'une pensée dit « Actif aujourd'hui » puis « 33 % », sans étape),
  et les onze autres suites passent ; 438 `<div` / 438 `</div>`. Vérifié dans Chromium seulement : **à voir par Rayan
  sur son iPhone.**

- **PR #28 fusionnée par Rayan le 10 octobre à 19 h 59** (`main` à `e90e28a`).

Les pensées d'un projet (branche `projet-pensees`, 10 octobre 20 h, partie de `main` à `e90e28a`) :
- Rayan (19 h 59) : « on continue », lu comme l'accord pour le chantier proposé à la PR #28 (vision : « l'IA la range,
  la relie au bon projet »).
- **Constat** : une pensée rangée dans ARYAN ne se voyait nulle part dans ARYAN (aucune section ne lisait les
  rangements ; seule la liste « Déposé » les montrait).
- **Section « Pensées »** (`#wsec-pensees`, sous les tâches) : les pensées dont le rangement le plus récent place dans
  ce projet (`penseesDuProjet` ; statut `filed` ou `done` ; ni annulées, ni « ARC hésite », ni refusées par le serveur).
  À faire d'abord, de la plus récente à la plus ancienne, puis les faites. Une ligne par pensée (`renderPenseesProjet`) :
  point à la couleur du projet (anneau éteint si faite), les mots de la pensée sur deux lignes au plus, dessous le
  moment ou « Faite » et « déposée il y a… » ; à droite « 2 à faire » (ou « Toutes faites »). Six lignes au plus, puis
  « Et N de plus, dans Déposé ». Toucher une ligne ouvre « Déposé » sur la pensée (`penseeOuvrir`), là où elle se
  modifie. Sans pensée, la section n'existe pas. Le même panneau sombre que l'accueil. Textes posés par `textContent`.
- La clé d'espace d'un projet est maintenant une seule fonction (`espaceCle`), utilisée par `rangeSpaces` et la section.
- L'écran d'un projet ouvert se redessine quand un rangement arrive (`rangeHomeRender` appelle `renderPenseesProjet`).
- Aucune donnée touchée, aucune table, rien de nouveau envoyé.
- Tests : accueil 27/27 (un contrôle ajouté : bon projet, ordre, moment, « Faite », annulée et autre projet exclus,
  ouverture dans « Déposé », projet sans pensée sans section, cibles ≥ 44 px, contraste le plus faible 8,91 : 1 ; les
  deux « 500 » de console de ce contrôle viennent du faux Supabase sans faux proxy, `tests/outils.mjs`, et sont
  écartés nommément), et les douze autres suites passent ; 442 `<div` / 442 `</div>`. Vérifié dans Chromium seulement :
  **à voir par Rayan sur son iPhone.**

- **PR #29 fusionnée par Rayan le 10 octobre à 20 h 36** (`main` à `d617d46`).

Juridique montre ses pensées (branche `juridique-pensees`, 10 octobre 20 h 40, partie de `main` à `d617d46`) :
- Rayan (20 h 37) : « go on continue », lu comme l'accord pour l'étape proposée avec la PR #29.
- La section « Pensées » des projets existe aussi dans Juridique (`#jsec-pensees`, sous la recherche du dossier) : les
  pensées rangées dans l'espace `juridique`, mêmes règles, même dessin (point bleu du pôle). Le code est commun :
  `penseesDe(clé)`, `renderPensees(section, liste, compte, pensées)` ; `renderPenseesJur` à l'entrée du pôle et quand un
  rangement arrive.
- **Santé n'a pas la section, exprès** : son contenu (curseurs, ou mémoire, échéances et rendez-vous) reste une
  décision de Rayan.
- Tests : accueil 27/27 (le contrôle des pensées vérifie aussi Juridique, contraste compris, et l'absence de section
  dans Santé), et les douze autres suites passent ; 446 `<div` / 446 `</div>`. Vérifié dans Chromium seulement :
  **à voir par Rayan sur son iPhone.**

- **PR #30 fusionnée par Rayan le 10 octobre à 20 h 56** (`main` à `104ac39`).

Santé et Juridique : l'étude (branche `etude-poles`, 11 octobre, partie de `main` à `104ac39`) :
- **Décision de Rayan (10 octobre, 21 h)**, à la question « Santé, je la construis comment ? » : ni curseurs ni simple
  mémoire : « un pôle santé à la Docteur House science-fiction avec le corps humain en 4D (idée exemple), un espace
  pour nos rdv médicaux avec des catégories de corps médical ; le reflet du monde de demain ; pareil pour le pôle
  juridique ; faudrait faire une étude pour voir comment nous pourrions et nous nous devons de construire ces pôles ».
- **`docs/ETUDE-POLES.md`** : ce qui existe (Santé = curseurs, score, série, conseils ; Juridique = quatre sections,
  chronologie, « Aides » avec Valence en dur), ce qui est permis (jamais d'avis ; **données de santé d'autres personnes
  = hébergeur certifié HDS, L. 1111-8, délit sans certificat : Santé se construit pour Rayan seul tant que ce n'est pas
  réglé** ; Mon espace santé tient déjà le dossier médical, ARC fait la mémoire personnelle et la préparation), le
  « 4D » lu comme le corps + le temps (corps-hologramme en 2D dessiné dans la page, zones allumées par un fait vrai,
  ligne du temps dessous ; le vrai 3D n'apporte aucune information et coûte une bibliothèque), Juridique « en orbite »
  (soi au centre, anneaux 7 / 30 / 90 jours, une échéance par point), les données (`S.sante.rdv`, `soins`, `docs` en
  référence sans fichier, `S.juridique.echeances`, aucune table), ce que l'IA fait (ranger, proposer un rendez-vous
  depuis une pensée datée à confirmer, préparer un rendez-vous, rappeler ; jamais conseiller), cinq décisions pour
  Rayan avec la réponse retenue par défaut, quatre étapes testées. Maquette de direction, hors application :
  `docs/maquettes/poles-direction.html` (données d'exemple marquées).
- **Aucune ligne d'`index.html` changée.** Les 13 suites relancées le 11 octobre sur la branche : toutes passent.

- **PR #31 fusionnée par Rayan le 11 octobre à 5 h 25** (`main` à `a2b5bad`).

Santé, étape 1 : la mémoire (branche `sante-socle`, 11 octobre 5 h 30, partie de `main` à `a2b5bad`) :
- Rayan (5 h 27) : « go on continue », sans préciser : **les réponses par défaut de l'étude sont retenues** (curseurs
  retirés de l'écran, données gardées ; la liste de spécialités du § 5 ; documents en référence, sans fichier ;
  « Aides » retiré, pas encore fait, ce sera avec Juridique ; Santé d'abord).
- **L'écran** (`#S3`) : « Ma santé » et une ligne vraie (`#sm-sous` : « Prochain rendez-vous : Kiné, demain à 18 h 00 »,
  sinon ce que l'écran garde) ; l'horizon vert ; **Rendez-vous** (à venir par date, heure à droite, « N à venir » ;
  vide : « Aucun rendez-vous à venir. » ; « Ajouter un rendez-vous », la seule touche blanche ; « Passés » replié, avec
  « ce qui en est sorti » sous chacun) ; **Spécialités** en puces (point lumineux = au moins un rendez-vous ou un
  document, anneau sinon ; jamais la couleur seule) ; **Pensées** rangées en Santé (`renderPensees`, déjà écrit) ;
  **Documents** (nom, spécialité, mois, « où il est ») ; puis le journal santé et les outils, inchangés.
- **La feuille** (`#sante-modal`, même dessin que « Nouveau projet », styles partagés) : rendez-vous (spécialité,
  praticien, date, heure, lieu, à apporter, mes questions ; « Ce qui en est sorti » une fois enregistré) ou document
  (nom, spécialité, date, où il est) ; « Choisis une spécialité. », « Indique la date du rendez-vous. », « Donne un nom
  au document. » ; supprimer demande un second geste (« Toucher encore pour supprimer », charte règle 11) ; Échap et le
  fond ferment. Fonctions : `renderSanteMemoire`, `santeOuvrir`, `santeEnregistrer`, `santeSupprimer`, `santeRdv`,
  `santeAVenir`, `santeJour`.
- **Données** : `S.sante.rdv` et `S.sante.docs`, des objets rangés par id (la synchronisation les fusionne champ par
  champ ; une suppression d'un côté et un ajout de l'autre restent tous les deux). Créés par `normalizeS`. Aucune table.
- **Retirés de l'écran, rien d'effacé** : le score, les quatre moyennes, le check-in, les tendances, les habitudes, les
  objectifs (dans `#sante-suivi`, caché, pour que leur code ne lève aucune erreur ; `S.poles.sante` intact ; « Export
  CSV » les exporte toujours) ; les cinq boutons de conseils de Claude Santé (« Optimiser sommeil »…).
- Accueil, « Ma vie » : Santé dit le prochain rendez-vous (« Kiné · Demain ») au lieu de « Check-in fait ».
- **Pas encore** (étapes suivantes de l'étude) : le corps et la ligne du temps ; Santé dans la recherche ; le Point du
  jour qui cite les rendez-vous ; « Préparer ce rendez-vous » avec Claude ; Juridique (orbite, « Aides »).
- Tests : accueil 27/27 (le contrôle des pensées vérifie que la section de Santé reste cachée sans pensée), pôles 10/10 (le remplissage de Santé passe par la feuille ; un contrôle ajouté : erreurs de la feuille,
  rendez-vous affiché avec son heure, « 1 à venir », spécialité allumée, ligne du haut, accueil, « Ce qui en est
  sorti », passage sous « Passés », suppression en deux gestes, ancien suivi caché et données gardées, aucun bouton de
  conseil ; contraste le plus faible 5,36 : 1, après avoir descendu la section sous la lueur de l'horizon, où « 1 à
  venir » tombait à 2,86 : 1), et les douze autres suites passent. Vérifié dans Chromium seulement : **à voir par Rayan
  sur son iPhone** (sélecteurs de date et d'heure de Safari, en français ; le Chromium de test les montre en anglais).

ARC en orbite, et Relier (11 octobre) :
- **PR #32 fusionnée par Rayan le 11 octobre à 9 h 17** (Santé, étape 1).
- **Pensée de Rayan (9 h 31)** : ARC est son deuxième cerveau « à 100 % de ses capacités ». **Règle à garder : ce qui
  est déposé doit revenir ; ARC ne garde rien qui ne serve.** Question posée, sans réponse : ses projets, son journal
  et sa santé peuvent-ils partir au proxy pour que Claude connaisse ARC ? (Seules les pensées partent aujourd'hui.)
- **Maquette « ARC en orbite »** (hors dépôt, carte publiée, données d'exemple) : l'accueil vu d'orbite, une planète
  dessinée dans la page (aucune bibliothèque, aucun mode de fusion) dont chaque région est un espace et chaque lumière
  une pensée ; puis, à sa demande (10 h 12, « le cerveau humain et toutes ses neurones qui se branchent »), les
  pensées en neurones reliés qui se transmettent des influx. Rayan : « les liens doivent être réels et non
  décoratifs ». **Règle à garder : la planète ne dessinera que des liens qui existent dans ARC.** Pas encore construite.
- **Relier, étape 1 (branche `relier`, partie de `main` à la fusion de la PR #32)**. Tout sur l'appareil, sans IA,
  rien de nouveau envoyé ailleurs que dans sa ligne `arc_data`. ARC propose, Rayan confirme.
  - **Projets liés** (section `#wsec-liens` d'un monde, avant « Pensées ») : deux projets qui partagent des mots rares
    (nom, catégorie, description, mission, outils, tâches, pensées rangées ; mots vides, verbes et participes écartés)
    ou dont l'un nomme l'autre (ATLAS dit « Amazon FBA »). Carte « ARC voit un lien avec FBA · En commun : FBA,
    Amazon, Achat, Marge », touches « Pas lié » et « Relier ». Relié : une ligne (nom, état, nombre de pensées, mots en
    commun) qui ouvre l'autre projet. Un projet endormi lié à un projet qui bouge le dit (« Ce projet dort. ATLAS, lié,
    avance : actif aujourd'hui. ») et l'accueil aussi, sous Endormis (« Lié à ATLAS »). Propositions vues sur les
    données d'avril : ATLAS ↔ FBA, ATLAS ↔ ARYAN (Supabase, Stripe, pages légales), ARYAN ↔ KITCHEN, FBA ↔ TELENEUF.
  - **La mémoire qui revient** (« Déposé ») : sous une pensée, la pensée plus ancienne la plus proche (deux mots rares en
    commun, ou un seul d'au moins 5 lettres) : « Ça rejoint une pensée déposée il y a 3 j », la citation (elle mène à
    la pensée), « En commun : comptable, TVA », « Pas lié » / « Relier ». Reliées, chacune montre l'autre. Au dépôt, le
    message sous la barre le dit (« Rangé dans ATLAS · ça rejoint une pensée déposée il y a 3 j »).
  - Données : `S.liens[id]` = { id, type 'projet'|'pensee', a, b, etat 'oui'|'non', mots, at } ; un refus n'est jamais
    reproposé ; la synchronisation fusionne l'objet comme `S.mondes` (contrôlé). Fonctions : `rlMots`,
    `rlLiensProjet`, `renderLiensProjet`, `rlLieAEveille`, `rlProche`, `rlBloc`, `rlAuDepot`.
  - **Pas encore** : liens vers Santé et Juridique ; pensées d'un projet lié affichées dans l'autre ; la planète ;
    Claude qui lit les liens (attend la réponse sur les données).
  - Tests : relier 18/18 (nouveau). Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.**
- **PR #33 fusionnée par Rayan le 11 octobre à 11 h 26.**
- **La planète (branche `planete`, partie de `main` à `b3f3c90`)** : sous l'horizon de l'accueil, la face de nuit d'une
  planète dessinée dans un canevas (`#h-planete`, sous le contenu ; la bande `#h-orbite`, 176 px sur iPhone et 240 px
  sur Mac, lui laisse la place et porte le geste). **Son bord est l'horizon d'ARC** : même cercle, lu dans `--hr` et
  `--hx` de `.h-horizon` (`plGeometrie`). Tout vient d'ARC (`plDonnees`, `plScene`) :
  une région par espace (projets, Santé, Juridique ; douze au plus, les plus vivants devant, les endormis au bord et
  gris), dont le nombre de points suit ses pensées ; une lumière par pensée rangée (récente forte, ancienne faible, faite
  = petit anneau) ; un fil de chaque pensée vers son espace ; un pont par projets reliés (`S.liens`), dont l'influx part
  de l'éveillé vers l'endormi ; un fil par pensées reliées ; l'orbite ambre au-dessus du bord = `rangeToSortCount`.
  Les influx ne courent que sur ces fils et jamais vers une pensée faite ; l'espace qui reçoit s'allume. Toucher une
  région ouvre l'espace. Mouvement réduit : une image fixe ; l'animation s'arrête quand l'accueil est caché ou
  l'onglet en arrière-plan (`plVisible`, `plDemarrer`). Sur Mac, les bords du canevas se fondent (masque CSS, pas de
  mode de fusion). Aucune bibliothèque. Compte neuf : les régions sans lumière (« elle s'allume à mesure »).
  Tests : relier 23/23 (cinq contrôles ajoutés : compte neuf, une lumière par pensée rangée, ponts, fils, orbite,
  image fixe sous mouvement réduit, toucher une région), les 13 autres suites passent ; 484 `<div` / 484 `</div>`.
  Vérifié dans Chromium seulement : **la fluidité sur l'iPhone et l'écran OLED restent à voir par Rayan.**
- **PR #34 fusionnée par Rayan le 11 octobre à 11 h 47.**
- **La carte (branche `carte`, 11 octobre 19 h, partie de `main` après la PR #34)**. Rayan (18 h 34) : « les mondes ne
  sont pas bien disposés », « une carte du monde interactive qui grandit et rétrécit avec les doigts », « Santé et
  Juridique ne doivent pas être mélangés aux mondes, ils doivent être sur leur espace », « un espace qui guide et
  dompte tout le reste ». Fait (module « LA PLANÈTE ET LA CARTE », qui remplace celui de la planète) :
  - **Disposition** (`plPlacer`) : rangées sur le sol, devant 3, au milieu 4, au fond le reste ; le plus vivant au
    centre ; **un endormi ne passe jamais devant** (il commence au fond).
  - **Santé et Juridique quittent la planète** : ils vivent sur une lune, « Ma vie », dans le ciel de la carte (leurs
    pensées, leurs fils, leurs noms posés dehors). La bande de l'accueil ne montre que les projets.
  - **La carte plein écran** (`#carte`, `carteOuvrir`, `carteFermer`) : on l'ouvre en touchant la bande hors d'une
    région, par la puce « Carte », ou en posant deux doigts sur la bande. Pincer pour rapprocher ou éloigner (1 à 5
    fois), glisser pour se déplacer, toucher deux fois pour rapprocher ; sur Mac, pincer sur le pavé (molette avec
    ctrl), glisser à deux doigts, touches « + » et « − » ; « + », « − » et « vue d'ensemble » en verre, 44 px.
    Une région touchée de loin se rapproche (`carteAller`) ; de près, elle ouvre l'espace ; de près, chaque lumière
    dit les mots de sa pensée et s'ouvre dans « Déposé » ; une pensée en orbite ouvre « Déposé ». « ‹ Accueil » et
    Échap ferment. La barre de dépôt reste au-dessus.
  - **Ce qui guide** (vrai, rien d'inventé) : en tête de la carte, une ligne de faits (`carteFaits` : « 1 pensée à
    ranger · 4 espaces ont des pensées à faire · FBA dort, lié à ATLAS ») ; sur la carte, chaque espace dit « N à
    faire » et un anneau respire autour de lui tant qu'il a des pensées à faire.
  - Une même scène, deux vues (`plScene(G, avecLune)`, `plDessiner(V, now)`) ; la carte a son propre bord aux couleurs
    d'ARC. Le corps de la planète est noir franc sous le bord (le contrôle « 8 % de noir franc » de l'accueil
    tombait à 7 % avec un corps bleu nuit).
  - Tests : relier 27/27 (contrôles de la planète réécrits, quatre ajoutés : carte ouverte depuis la bande, lune « Ma
    vie », faits vrais, touches et contraste, région rapprochée puis ouverte, « + », pincer jusqu'à 5, vue
    d'ensemble, Échap), accueil 27/27, et les 12 autres suites passent ; 490 `<div` / 490 `</div>`. `tests/connexion.mjs`
    a échoué une fois pendant la série complète (passe seul, 28/28 : intermittent, sans rapport avec la carte).
    Vérifié dans Chromium seulement : **le pincement réel sur l'iPhone reste à essayer par Rayan.**
- **PR #35 fusionnée par Rayan le 11 octobre à 19 h 06.** Vu sur son iPhone (19 h 10, ses captures) : sur l'accueil,
  les noms des endormis passaient sur le titre ; sur la carte, « Nettoyage d'extérieur » coupé au bord, Juridique
  posé sur le bord de la planète.
- **La carte vivante (branche `carte-vivante`, 11 octobre 19 h 40, partie de `main` après la PR #35)**. Rayan (19 h 32,
  dicté) : « ma vie, c'est les mondes » : Santé et Juridique ont leur espace à part des projets « mais pas en dehors du
  monde » ; l'orbite porte les pensées qui doivent rejoindre un monde ; « je dois pouvoir naviguer dessus sans stress,
  agrandir avec mes doigts, bouger à gauche, à droite, en haut ; il ne doit pas y avoir le plus, le moins et le
  point » ; la façon de présenter ARYAN, ATLAS, Nettoyage « plus travaillée » ; « au début d'un projet, aucun point
  autour du point principal ; plus on avance, plus les points s'ajoutent ; chaque point est réel ; quand on clique
  dessus, il notifie ce qu'il représente » ; une manière de travailler les endormis ; et, ensuite, une carte dans
  chaque monde. **Règle à garder : autour d'un espace, aucun point de décor ; chaque point est une chose d'ARC.**
  Fait (le module « LA PLANÈTE ET LA CARTE » est réécrit) :
  - **Points réels** (`plElements`) : une pensée rangée (lumière ; faite = anneau), une tâche faite (point plein),
    une entrée de journal (losange), un rendez-vous (anneau, vif s'il est à venir), un document (carré), une démarche
    juridique (pleine si faite, anneau sinon). Du plus ancien au plus récent, en spirale autour de l'espace : un
    projet neuf n'a aucun point. Les points de décor des régions et la texture de la planète sont retirés (restent les
    méridiens, le relief).
  - **Ma vie sur la planète** : Santé et Juridique dans leur zone, à droite des projets, cernée d'un pointillé et
    nommée « Ma vie » ; la lune n'existe plus. Les projets occupent la gauche et le centre.
  - **Les noms** : une pilule de verre (point à la couleur de l'espace, nom ; sur la carte, dessous, l'état vrai :
    « Actif aujourd'hui · 2 à faire · 21 faits », « Endormi »). Jamais l'une sur l'autre ni sur le titre : si la place
    manque, le nom seul, sinon rien à cette échelle (on rapproche pour le voir).
  - **Navigation libre** : la carte est un monde plus grand que l'écran ; vue d'ensemble à l'ouverture
    (`carteEnsemble`) ; pincer, glisser dans toutes les directions avec un élan qui s'amortit (`carteElan`), toucher
    deux fois dans le vide pour rapprocher puis revenir à l'ensemble ; Mac : pincer sur le pavé, glisser à deux doigts ;
    clavier « + », « − », « 0 ». Bornes : le centre de l'écran reste au-dessus de ce qui existe. **Plus de touches
    + / − / vue d'ensemble.**
  - **La fiche** (`#carte-fiche`, `carteFiche`, `carteToucher`) : toucher un point dit ce qu'il est (« Journal ·
    ATLAS », ses mots, depuis quand) et ce qu'on peut en faire (« Ouvrir dans Déposé », « Ouvrir ATLAS », « Ranger
    cette pensée » pour l'orbite) ; toucher un espace donne son état et « Ouvrir … ». **Un endormi se travaille** :
    sa fiche propose « Réveiller » (sur place) et « Ouvrir ». Échap ferme la fiche, puis la carte.
  - Accueil : les noms de la bande ne passent plus au-dessus du bord (fini, le titre recouvert).
  - **Pas encore : la carte dans chaque monde** (la même carte, centrée sur un projet et tout ce qui le fait). Prochain
    chantier.
  - Tests : relier 28/28 (contrôles de la carte réécrits : chaque point = une chose réelle comptée à part, Ma vie sur
    la planète, aucune touche de zoom, glisser déplace sans rien ouvrir, pincer jusqu'aux bornes, fiche d'une entrée de
    journal et son contraste, « Réveiller » sur place, Échap, « Ouvrir ATLAS »), et les 13 autres suites passent.
    Vérifié dans Chromium seulement : **l'élan et le pincement réels restent à essayer par Rayan sur son iPhone.**
- **PR #36 fusionnée par Rayan le 11 octobre à 20 h 03.** Vu sur son iPhone (20 h 05, ses captures) : sur la carte,
  les pilules couvraient les points et les autres noms (KITCHEN sur son fil, Nettoyage sur ARYAN, la zone Ma vie en
  travers d'ATLAS), un grand vide en haut et en bas ; sur l'accueil, une bande encombrée de pilules.
- **La carte réglée (branche `carte-ordre`, 11 octobre 20 h 20, partie de `main` après la PR #36)**. Rayan (20 h 14) :
  « la disposition : agréable, logique surtout, pas les unes sur les autres, fonction sur fonction ; là c'est un
  brouhaha » ; « que ça éduque, interactif, intuitif » ; « sinon c'est une deuxième charge qui n'éclaircit rien ».
  **Règle à garder : la carte est rangée en rangées qui ont chacune un rôle ; chaque espace a sa case, et ses points,
  son nom et son état restent dans sa case.** Fait (`plDisposer` remplace `plPlacer`) :
  - Du haut vers le bas : l'orbite (à ranger), **Endormis** (petites cases, près de l'horizon), **En cours** (grandes
    cases, au centre de l'écran), **Ma vie** (Santé, Juridique, dans une bande teintée entre deux arcs). Les rangées
    suivent la courbe de l'horizon ; sur la carte, chacune est nommée à gauche (« Endormis », « En cours »,
    « Ma vie »). Trop d'espaces pour une rangée : elle passe à la ligne.
  - Les noms ne sont plus des pilules : le nom à la couleur de l'espace, centré sous lui, puis son état en deux lignes
    courtes (« Actif aujourd'hui », « 2 à faire · 21 faits » ; « Endormi ») ; tronqués à la largeur de leur case ;
    jamais l'un sur l'autre (contrôlé). Sur l'accueil, les endormis restent sans nom (ils sont dans la carte et sous
    « Endormis ») ; bande portée à 204 px pour que « Juridique » ne touche plus la puce « Carte ».
  - Les points d'un espace restent dans son cercle : la spirale se resserre quand il y en a beaucoup.
  - Vue d'ensemble : la largeur tient dans l'écran, le haut sous l'en-tête ; si c'est plus haut que l'écran, on
    descend en glissant. La carte n'est plus un monde plus large que l'écran.
  - **La légende** (`#carte-legende`), au-dessus de la barre de dépôt : Pensée, Tâche faite, Journal, Rendez-vous, À
    ranger, chacun avec son signe ; cachée quand une fiche est ouverte. La zone ovale pointillée de Ma vie n'existe plus.
  - Tests : relier 29/29 (un contrôle ajouté : trois rangées nommées dans l'ordre, endormis au-dessus des projets en
    cours, Ma vie dessous, aucun nom qui en croise un autre sur la carte ni sur l'accueil, légende visible), et les
    13 autres suites passent. Vérifié dans Chromium seulement : **à voir par Rayan sur son iPhone.**

- **PR #37 fusionnée le 11 octobre à 20 h 56.** Les captures de Rayan de 21 h 06 montraient encore la version #36 :
  GitHub Pages sert la page avec un cache de 10 minutes, et le service worker (« réseau d'abord ») passe par ce cache.
- **Étude de la carte (branche `etude-carte`, PR #38, 21 h 20)** : `docs/ETUDE-CARTE.md`, écrite par un agent qui n'a
  pas construit l'écran. Verdict : retirer la bande de l'accueil, régler la carte, « la carte situe, le panneau dit ».
  **En attente de Rayan.**
- **Ma vie sur le côté (branche `ma-vie-cote`, 21 h 35)**. Rayan (21 h 31) : Santé et Juridique « ne doivent pas être au
  milieu », « visibles mais pas dans le champ ; le champ est fait pour être productif » ; « les deux à droite, l'un sur
  l'autre, Juridique en bas et Santé en haut, un peu décalés, avec leur effet ». **Règle à garder : le champ (gauche et
  centre) est aux projets ; Ma vie est une colonne sur le bord droit.** `plDisposer` : colonne `colW` (30 % de la largeur
  sur la carte, 26 % sur la bande), les rangées Endormis et En cours se centrent dans le reste ; Santé en haut,
  Juridique dessous, décalé vers le champ ; la zone teintée de Ma vie suit (filet pointillé vertical, lueur vers le
  bord). Un nom trop long réduit sa taille jusqu'à 11 px avant d'être coupé (« TELENEUF » à 375 px).
  Tests : relier 29/29 (les deux contrôles de Ma vie vérifient la colonne : à droite de tous les projets, aucun projet
  dedans, Santé au-dessus de Juridique). Vérifié dans Chromium seulement.

- **PR #38 (étude) et #39 (Ma vie sur le côté) fusionnées le 11 octobre (#39 à 0 h 11 le 12).**
- **La carte nette (branche `carte-nette`, 12 octobre 0 h 20)**. Rayan (0 h 15) : « on continue, je te veux expert
  exigeant dans chaque matière ». Étape 2 de `docs/ETUDE-CARTE.md` (la vue d'ensemble), faite avant l'étape 1 :
  **retirer la bande de l'accueil reste une décision de Rayan** (il venait d'y demander Ma vie à droite). Fait :
  - **Rien ne passe sur un mot** : `plDessiner` pose d'abord les noms et les titres de rangées (`noms`, `titres`,
    `V.etiquettes`), puis dessine traits et points sous une découpe qui exclut leurs rectangles (`sansMots`, découpe
    `evenodd`) ; les fonds (corps de la planète, teinte de Ma vie) restent sous les mots. **Rien sous l'en-tête** de la
    carte (découpe à `V.haut`, mesuré par `carteHaut`).
  - **Trois signes** : à faire (pensée, démarche pas faites, rendez-vous à venir : lueur vive, `plAFaire`), fait
    (poussière de 1,5 px à 35 %), à ranger (ambre, sur l'orbite). Légende de trois entrées. Les tâches d'avril sont de
    la poussière.
  - **Aucune phrase sur le canevas** : le bloc des mots de pensée de près est retiré ; la fiche les dit au toucher.
  - **Noms** : plus de « Endormi » sous les endormis ; en cours 17 px, une seule ligne dessous (« 2 à faire » en blanc,
    sinon quand il a bougé) ; « 21 faits » sort de la carte (`plLigneCarte` ; `plEtatLignes` retirée).
  - **En-tête** : « Carte » et une seule action vraie, la puce ambre « 1 pensée à ranger › » (`#carte-ranger`,
    `carteRanger`), qui ouvre « Déposé » sur elle ; absente à zéro. `carteFaits` et `#carte-faits` n'existent plus.
  - Vue d'ensemble posée au tiers haut de la place libre (plus de grand vide en bas).
  - Tests : relier 30/30 (un contrôle ajouté, lu dans les pixels : aucun trait ni point dans le rectangle d'un mot,
    rien sous l'en-tête, « à faire » plus lumineux que « fait », aucun mot de pensée écrit de près par `fillText`,
    plus de « Endormi », légende de trois signes). Vérifié dans Chromium seulement.
  - **Test réparé, cause prouvée** : `tests/accueil.mjs`, « un seul panneau », échouait entre minuit et 1 h (sur `main`
    aussi) : l'activité d'ATLAS était posée « il y a une heure », donc hier après minuit. Posée il y a une minute.
    Les 14 suites passent ; 494 `<div` / 494 `</div>`.

- **PR #40 fusionnée le 12 octobre à 0 h 55.**
- **Le panneau d'un espace, et la carte dans chaque monde (branche `carte-panneau`, 12 octobre 1 h 25)**. Rayan
  (1 h 20) : « go », pour l'étape 3 de `docs/ETUDE-CARTE.md` (plus l'étape 5). Fait :
  - **La fiche isolée est remplacée par un panneau** (`#carte-panneau`, `carteFiche(chose, sansAnim)` garde son nom) :
    toucher un espace le centre au milieu de la place libre au-dessus du panneau (`carteCentrer` ; à gauche du panneau
    sur Mac) ; le panneau monte du bas (58 % de l'écran au plus, défile dedans ; sur Mac, colonne de 380 px à droite) :
    en tête le point, « Projet », « Projet endormi » ou « Ma vie », le nom (22 px), l'état vrai (`plEtatCourt`), une
    croix de 44 px ; **une seule touche blanche** : « Ouvrir ARYAN », ou « Réveiller » pour un endormi (« Ouvrir FBA »
    en verre) ; puis les groupes (`PN_GROUPES`) : À faire, Pensées faites, Rendez-vous passés, Journal, Documents,
    Démarches faites, Tâches faites (repliée, « 21 »). Une ligne par chose réelle (`pnLigne`, 54 px, mots sur deux lignes,
    « Pensée · Déposée il y a 3 j »). Espace vide : « Rien encore. Dépose une pensée : elle s'allumera ici. »
  - **Toucher un point** ouvre le panneau de son espace, sur sa ligne, surlignée (et dépliée si elle est dans un groupe
    replié). **Toucher une ligne** ouvre la chose là où elle vit (`pnOuvrirChose` : pensée → « Déposé », journal → le
    projet sur son journal, tâche → le projet, rendez-vous et documents → Santé, démarche → Juridique). Une pensée en
    orbite ouvre le panneau « Orbite » (« 1 pensée à ranger », touche blanche « Ranger dans Déposé »).
  - Croix, Échap ou toucher le vide ferment le panneau ; fermer la carte le ferme aussi. Le panneau survit à une
    reconstruction de la scène (Réveiller) sans recentrer. Quand il est ouvert, la borne du bas laisse remonter un espace
    du bas de la carte au-dessus de lui (`carteBorner`, `V.panneau`).
  - **La carte dans chaque monde** : « Voir sur la carte » sous les étiquettes de l'en-tête d'un projet (`#w-carte`,
    44 px, `carteSur(id)`) ouvre la carte centrée sur ce projet, panneau ouvert. Pas encore dans Santé et Juridique.
  - Tests : relier 32/32 (contrôles de la fiche réécrits pour le panneau, deux ajoutés : toucher une pensée l'ouvre
    dans « Déposé » ; « Voir sur la carte » depuis ATLAS) ; les 14 suites passent ; 497 `<div` / 497 `</div>`.
    Vérifié dans Chromium seulement.

- **PR #41 fusionnée le 12 octobre à 1 h 48.**
- **La carte finie, et la nouvelle version visible tout de suite (branche `carte-finie`, 12 octobre 2 h)**. Rayan
  (1 h 49) : « on continue, que choisis-tu ? ». Fait :
  - **Cause prouvée du « 10 minutes »** : GitHub Pages sert la page avec `Cache-Control: max-age=600`, et le service
    worker (`sw.js`, « réseau d'abord ») appelait `fetch(req)`, qui passe par le cache HTTP du navigateur. Preuve
    (`tests/sw.mjs`, serveur local qui répond comme GitHub Pages, aucune interception, car Playwright couperait le
    cache HTTP) : sur `main`, rouvrir ARC deux fois → **0** demande au serveur ; avec le correctif → 2 (en-tête
    `max-age=0`). Correctif : les fichiers d'ARC (même origine) sont demandés avec `cache: 'no-cache'` (revalidation,
    réponse 304 si rien n'a changé) ; les bibliothèques des CDN, figées par leur version, ne changent pas ; cache
    hors ligne `arc-v7` (l'ancien `arc-v6` est retiré à l'activation). **Ce qui change pour Rayan** : après une
    fusion, rouvrir ARC suffit, une fois GitHub Pages déployé (environ une minute) ; il n'y a plus 10 minutes à attendre.
    Une seule fois encore, la première ouverture après cette mise en ligne passe par l'ancien service worker.
  - **« Voir sur la carte » dans Santé et Juridique** (`data-carte`, même bouton que les projets, à la couleur du pôle) :
    ouvre la carte sur leur panneau « Ma vie ».
  - **Titres de rangée près de leurs cases** (étape 4 de l'étude) : « Endormis » et « En cours » se posent juste à gauche
    de la première case de leur rangée (`sec.xg`), au lieu du bord de l'écran (loin des cases sur Mac).
  - Tests : sw 3/3 (nouveau ; échoue sur `main` : 0 demande, cache `arc-v6`), relier 33/33 (un contrôle ajouté :
    Santé et Juridique ouvrent leur panneau). Vérifié dans Chromium seulement : **le comportement du service worker
    de Safari sur iPhone reste à constater par Rayan** (il suit la même norme). Les 15 suites passent ; 497 `<div` / 497 `</div>`.

- **PR #42 fusionnée le 12 octobre à 2 h 43.** **Décision de Rayan (3 h 04) : la planète de l'accueil est gardée**
  (« oui on la garde »). L'étape 1 de `docs/ETUDE-CARTE.md` (retirer la bande) n'est donc pas faite, et ne le sera pas.
- **Santé, étape 2 : le corps (branche `sante-corps`, 12 octobre 3 h 10)**. Rayan (3 h 04) : « continuons, attaque ».
  Étape 2 de `docs/ETUDE-POLES.md`, partie Santé (l'orbite de Juridique suit). Fait :
  - **Le corps** (`#sc-corps`, sous l'horizon vert, avant « Rendez-vous ») : une silhouette-hologramme en SVG écrite par
    le code (`scSilhouette` : tubes translucides pour le volume, trait net en dégradé, trame sur le torse, sol en deux
    ellipses ; Dos : la colonne en pointillé et les omoplates). Aucune bibliothèque, aucun filtre, aucun mode de fusion.
  - **Une zone par spécialité, sur une seule vue** (`SC_ZONES`) : de face, psy (haut de la tête), ophtalmo (yeux), ORL
    (oreille), dentiste (bouche), cardio (cœur), généraliste (ventre), dermato (avant-bras) ; de dos, kiné (bas du dos).
    Imagerie, laboratoire, pharmacie et autre n'ont pas de zone (ils restent dans « Spécialités »). **Une zone ne
    s'allume que si un rendez-vous ou un document de sa spécialité existe** (`scFaits`) ; sans fait, le corps est
    atténué et une ligne dit quoi faire (« Ajoute un rendez-vous ou un document : sa zone s'allumera ici. »).
  - **Les étiquettes** (`.sc-e`, boutons de 44 px) : le nom de la spécialité, puis ce qui est vrai (`scResume`) :
    « RDV 14 nov. » (le prochain à venir), sinon « Vu en juin » ou « Doc. de sept. » (le plus récent). Deux colonnes
    (gauche, droite), reliées à leur point par un trait ; la colonne de gauche commence sous la bascule (mesurée).
    Toucher une étiquette ouvre ce rendez-vous ou ce document dans la feuille.
  - **Face / Dos** (`.sc-v`, `_scVue`) : un point sur l'autre vue quand elle a une zone allumée (« Dos, 1 zone allumée »
    pour les lecteurs d'écran). Les points se posent à l'affichage (une fois, rien si l'appareil demande moins de
    mouvement) ; aucune boucle.
  - **Pas encore** (étape 3) : la ligne du temps sous le corps (glisser pour voir le corps à une date). Puis l'orbite de
    Juridique.
  - Tests : pôles 13/13 (trois contrôles ajoutés, à 390, 360 et 430 px : éteint sans fait ; quatre zones de face, le
    laboratoire sans zone ; le kiné de dos et signalé sur « Dos » ; étiquettes entières, sans chevauchement, ni sur la
    bascule, ni hors du panneau ; cibles ≥ 44 px ; contraste ≥ 4,5 : 1 ; « Dentiste » ouvre son rendez-vous). La bascule
    passe à 44 px et la ligne de l'état vide prend un fond (elle tombait à 3,97 : 1 sur la silhouette).
    Vérifié dans Chromium seulement. Les 15 suites passent ; 501 `<div` / 501 `</div>`.
  - **Test intermittent signalé, pas encore réparé** : `tests/rangement.mjs`, « Dépôt instantané avec un proxy lent… nouvel
    essai réussi ensuite », échoue de temps en temps (« rangée au nouvel essai : false ») **sur `main` aussi** (1 fois sur
    13 le 12 octobre ; 3 sur 7 sur la branche, sans code de rangement touché). Cause non prouvée ; piste : le premier
    appel lent (5 s réelles) est encore en cours quand le test envoie « online ». À éclaircir à part.
- **PR #43 fusionnée le 12 octobre.**
- **Santé, étape 3 : la ligne du temps (branche `sante-temps`, 12 octobre 4 h)**. Rayan (3 h 56) : « go ». Fait (dans
  `#sc-corps`, sous la silhouette) :
  - **Une ligne horizontale** (`#sc-temps`, `scTemps`) : un point par rendez-vous et par document datés, toutes
    spécialités (`scDates`) ; un rendez-vous à venir est un anneau ; un trait blanc marque « Aujourd'hui » ; bornes
    (`scBornes`) : du premier fait (au plus tôt six mois avant) au dernier à venir (au moins trois mois après), plus
    15 jours ; mois de début et de fin dessous. Cachée s'il n'y a aucun fait daté.
  - **Le curseur est la date du corps** (`<input type=range>` natif, transparent, pouce blanc de 22 px, piste de 44 px ;
    `_scDate`, `scTempsGlisse`) : glisser montre le corps tel qu'il était à cette date (`scFaits(date)` : seuls les faits
    datés de ce jour ou d'avant ; un document sans date n'y est pas) ; les points d'après s'éteignent ; la date s'écrit
    en tête (« Le 4 juin 2026 ») avec « Revenir à aujourd'hui ». Il se pose sur un fait proche (2 % de la ligne) et sur
    aujourd'hui. Au-delà d'aujourd'hui, un rendez-vous à venir garde « RDV 14 nov. » (`scResume` ne dit plus « Vu » pour
    un rendez-vous pas encore passé). Le lecteur d'écran lit la date (`aria-valuetext`).
  - Aucune bibliothèque, aucun mode de fusion, aucune animation en boucle. Aucune donnée nouvelle.
  - **Défaut corrigé avant fusion** : `auj + 90 * j` concaténait une date et un nombre (`scBornes`) ; les dates sont
    maintenant des nombres.
  - Tests : pôles 15/15 (deux contrôles ajoutés, 390 et 360 px : cachée sans fait ; six points, l'anneau à venir ; un vrai
    toucher 130 jours avant n'allume que l'ophtalmo ; aimant sur le cardio ; après le rendez-vous à venir, le dentiste ;
    retour ; cibles ≥ 44 px ; contraste ; date lue). Vérifié dans Chromium seulement : **le glisser du doigt dans Safari
    reste à essayer par Rayan.**
- **PR #44 fusionnée le 12 octobre à 4 h 24.**
- **Juridique : l'orbite (branche `juridique-orbite`, 12 octobre 4 h 30)**. Rayan (4 h 24) : « go ». Partie Juridique de
  l'étape 2 de `docs/ETUDE-POLES.md`. Fait :
  - **Source** : les éléments du dossier qui ont une date et ne sont pas faits (`S.poles.juridique`, champ `deadline`).
    **Rien de nouveau dans `S`, aucune migration** (l'étude prévoyait `S.juridique.echeances` : pas nécessaire tant que
    la date vit dans l'élément ; `jurEcheances`, `joJours`).
  - **L'orbite** (`#jsec-orbite`, juste sous l'horizon, `renderJurOrbite` ; `renderJurTimeline` l'appelle, donc chaque
    ajout, « Fait » ou suppression la redessine) : SVG écrit par le code, au centre « Toi », trois anneaux nommés 7 j,
    30 j, 90 j (pointillé). Un point par échéance à 90 jours ou moins, d'autant plus près du centre qu'elle approche
    (`joRayon`) ; passée, un anneau contre le centre. Chaque section a son quart, nommé dans son coin (Statut, Contrats,
    Démarches, Aides) et sa couleur ; les points d'un quart s'écartent de ±22° pour ne jamais toucher un mot (contrôlé).
    Les points se posent à l'arrivée sur le pôle (`_joPose`), une fois ; rien si l'appareil demande moins de mouvement.
  - **La liste**, sous l'orbite, par date : passées d'abord (« À replacer »), puis « Aujourd'hui », « Demain »,
    « Dans 12 j » avec la date ; au-delà de 90 jours, dans la liste seulement. Toucher une ligne ouvre l'élément dans sa
    section (`jurOuvrirItem` : section dépliée, élément centré et éclairé). Toucher un point le signale dans la liste ;
    le toucher encore ouvre l'élément (`joChoisir`). En tête : « 6 à venir · 1 à replacer ».
  - **« Ajouter une échéance »**, la seule touche blanche (`joAjouter`) : ouvre le formulaire des démarches (date
    comprise). Vide : l'orbite seule et « Aucune échéance. Donne une date à une démarche : elle se placera ici. »
  - **La « Chronologie » est retirée** (l'orbite la remplace, même source). **Le bouton « Aides » (Valence en dur) est
    retiré** (réponse par défaut de l'étude) ; la suggestion de Claude « Aides création » ne nomme plus Valence.
  - **Sans rouge** : en-tête « 2 cette semaine », « 1 à replacer » en ambre (au lieu de « 2 urgents » en rouge) ; sections
    « 1 à 7 j » ; un élément passé dit « À replacer » (au lieu de « Dépassée de 2 j »). **Défaut corrigé en passant** :
    `renderJurHero` testait `!it.status !== 'done'` (toujours vrai), les éléments faits entraient dans le compte.
  - Les lignes et la touche blanche de Santé sont partagées (`#S4 .sm-row`, `.sm-quand`, `.sm-ajout`).
  - Tests : pôles 17/17 (deux contrôles ajoutés, 390 et 360 px : vide ; six points, la passée contre le centre ; distances
    dans l'ordre des dates ; aucun point sur un mot ; liste et ses mots ; aucun rouge ; plus de « Aides » ni de Valence ;
    toucher, toucher encore ; « Ajouter une échéance » ; cibles ≥ 44 px ; contraste). La section est descendue de 18 px
    sous la lueur de l'horizon (« 1 à venir · 1 à replacer » y tombait à 4,20 : 1). Vérifié dans Chromium seulement.
  - **Pas encore** : « C'est fait » depuis l'orbite (la comète) ; documents juridiques ; Juridique dans le Point du jour.
- **PR #45 fusionnée le 12 octobre à 5 h 17.**
- **Les gestes d'ARC dans les pôles (branche `poles-gestes`, 12 octobre 5 h 20)**. Rayan (5 h 17) : « on continue ».
  Étape 4 de `docs/ETUDE-POLES.md`, sans ce qui enverrait des données de santé au proxy (question toujours ouverte).
  Fait, tout sur l'appareil, sans IA nouvelle, rien de nouveau envoyé :
  - **ARC propose** (`propositions`, `renderProps`, `propAjouter`) : une pensée rangée en Santé ou en Juridique, pas
    faite, avec un moment daté d'aujourd'hui ou plus tard (le proxy ne garde un moment que s'il cite la pensée), devient
    une carte en tête de « Rendez-vous » (`#sprop`) ou d'« Échéances » (`#jprop`) : « ARC propose un rendez-vous :
    Dentiste », le jour et l'heure, « De ta pensée : « … » », « Pas maintenant » et « Ajouter » (la carte de Relier,
    partagée : `.wlien-prop`). Trois au plus, la plus proche d'abord.
  - **Rien n'est créé sans Rayan** : en Santé, « Ajouter » ouvre la feuille du rendez-vous remplie (spécialité, date,
    heure ; `santeOuvrir(mode, id, pre)`), il l'enregistre ; en Juridique, « Ajouter » met l'échéance dans les démarches
    (elle arrive sur l'orbite). L'origine est gardée (`from` = id de la pensée) : une pensée n'est proposée qu'une fois.
    « Pas maintenant » n'est jamais reproposé (`S.propNon['sante:'|'juridique:' + id]`, synchronisé).
  - **La spécialité est reconnue sur l'appareil** (`PROP_SPE`, `propSpe` : mots sans accents ni casse, mots entiers :
    dentiste, kiné, ostéo, ophtalmo, lunettes, ORL, cardio, dermato, psy, prise de sang, radio, IRM, pharmacie, médecin…) ;
    sans mot reconnu, la feuille demande la spécialité.
  - **Le Point du jour cite les rendez-vous et les échéances du jour** (`matinPoles`, `matinPoleRow`), dans « Aujourd'hui »,
    rangés par heure avec les étapes (une échéance sans heure ferme la journée) : « Rendez-vous · 18:00 · Santé · Kiné ·
    Mme Leroy » avec « Ouvrir » ; « Échéance · Juridique · Envoyer le Kbis » avec « C'est fait » et « Ouvrir ». Le chiffre
    du poste de l'accueil les compte (« vu · 1 étape · 1 rendez-vous »).
  - Tests : pôles 18/18 (un contrôle ajouté : proposition et spécialité, rien créé avant « Enregistrer », feuille remplie,
    proposition retirée une fois ajoutée, échéance sur l'orbite, « Pas maintenant » après rechargement, pensée sans moment
    ou au moment passé jamais proposée, Point du jour, « C'est fait » depuis le Point du jour, contraste, cibles).
    Vérifié dans Chromium seulement.
  - « Préparer ce rendez-vous » avec Claude : fait ensuite, voir plus bas (accord de Rayan, 5 h 48).
- **Préparer un rendez-vous (branche `sante-preparer`, partie de `poles-gestes`, 12 octobre 6 h)**. À la question « la
  spécialité, la date et tes notes du rendez-vous partiraient au proxy : d'accord ? », Rayan (5 h 48) : « go on
  continue », lu comme oui. **La PR #46 se fusionne d'abord, celle-ci ensuite.** Fait :
  - Dans la feuille d'un rendez-vous à venir (ou nouveau), sous « Mes questions » : « Préparer ce rendez-vous avec ARC »
    et la ligne vraie « Part à Claude : la spécialité, la date, le lieu et ce que tu as écrit dans ce rendez-vous. Claude
    organise, il ne donne aucun avis médical. » **Rien ne part sans ce geste** (contrôlé). Pas de section pour un
    rendez-vous passé ni pour un document.
  - Chemin de la discussion du proxy (`prepDemander`, 700 jetons, **aucun redéploiement**) ; consigne `PREP_SYSTEM` :
    organiser seulement, aucun diagnostic, avis, traitement, posologie ni interprétation ; JSON `questions` / `apporter`,
    3 à 5 chacun. Lecture tolérante (`prepLire`) ; ce qui est déjà noté n'est pas reproposé.
  - « Questions à poser » et « À apporter » en listes ; « Ajouter à la fiche » (`prepAjouter`) les ajoute aux champs
    (« - … », dans la limite de chaque champ) ; **rien n'est gardé avant « Enregistrer le rendez-vous »**.
  - Panne, session, réseau : la raison en mots (`PJ_RAISONS`, partagé avec « En faire un projet »).
  - Tests : pôles 19/19 (un contrôle ajouté : aucun appel avant le geste, demande et consigne, sans doublon, ajout à la
    fiche, rien d'enregistré avant « Enregistrer », panne, sections cachées, cibles, contraste). Vérifié dans Chromium
    seulement, contre un faux proxy : **le vrai Claude reste à essayer par Rayan.**
- **PR #46 et #47 fusionnées le 12 octobre (avant 6 h 14).**
- **Recherche dans Santé, un défaut de Juridique, un test intermittent (branche `recherche-poles`, 12 octobre 6 h 20)**.
  Rayan (6 h 14) : « continue go ». Fait :
  - **Santé dans la recherche** : un rendez-vous par sa spécialité et son praticien (« Dentiste · Dr Martin »,
    « Rendez-vous · Jeudi · à venir »), ou par ses notes (lieu, à apporter, questions, ce qui en est sorti : l'extrait,
    « Rendez-vous Dentiste ») ; un document par son nom, sa spécialité ou l'endroit où il est (« Document · Ophtalmo ·
    mars 2026 · Papier, chez moi »). Toucher la ligne ouvre sa feuille dans Santé. Une démarche datée dit quand
    (« Juridique · Démarches en cours · Dans 3 j », ou « Fait »).
  - **Défaut prouvé puis réparé (en ligne depuis toujours)** : dans Juridique, avec la recherche du dossier remplie,
    « Fait » et la croix visaient l'élément de même rang dans la liste complète. Preuve : démarches « Appeler la banque »,
    « Déclaration URSSAF », recherche « urssaf », « Fait » → `["Appeler la banque:done","Déclaration URSSAF:todo"]`
    (la croix aurait supprimé « Appeler la banque »). `renderJurSections` garde maintenant le rang du dossier
    (`rang`, une `Map`) ; après : `["Appeler la banque:todo","Déclaration URSSAF:done"]`.
  - **Test intermittent de `tests/rangement.mjs` (contrôle 1), cause prouvée** : l'horloge de Playwright n'avance
    parfois pas après `page.clock.fastForward('01:05')` quand la machine est chargée. Mesuré avec quatre navigateurs en
    parallèle : la page voyait 60 ms passer au lieu de 65 s (une fois sur vingt) ; l'écart d'une minute entre deux essais
    (`rangeMayTry`, voulu) bloquait donc le nouvel essai. ARC n'est pas en cause. Le test avance l'horloge jusqu'à ce que
    la page voie la minute passée (cinq fois au plus) ; 30 passages sur 30 ensuite, cinq navigateurs en parallèle.
  - Tests : recherche 9/9 (un contrôle ajouté : Santé, démarche datée, « Fait » filtré), rangement 25/25.
- **PR #48 fusionnée le 12 octobre à 6 h 41.**
- **Essai réel sur l'iPhone (12 octobre, 17 h 30 à 19 h 10, captures de Rayan)** : il dépose « Dentiste » (sans jour ni
  heure) ; ARC le range en Santé comme note, sans moment : pas de proposition, c'est voulu (ARC n'invente pas de date).
  Il fixe ensuite le moment (jeudi 15 octobre, 14 h) puis touche **« C'est fait »**, la touche blanche de la note, sans
  doute pour valider : la pensée passe « Fait », et une pensée faite n'est jamais proposée. **Défaut prouvé** :
  `rangeBoxEl` (`index.html`, `if(f.status === 'done') return box;`) ne laissait aucune touche sur une pensée faite :
  une erreur était sans retour (charte, règle 11).
- **Rouvrir (branche `rouvrir-pensee`, 12 octobre 19 h 15)** : sous une pensée faite, « Rouvrir » (discrète) la remet
  rangée, telle qu'elle était (`status` filed, ou unsure si ARC hésitait ; nouvelle ligne `origin` user). Sur une
  **note** (rangée sans étape), « C'est fait » n'est plus la touche blanche (rien n'est à faire). Tests : rangement
  26/26 (un contrôle ajouté : « C'est fait » puis « Rouvrir », la pensée revient rangée avec ses touches).
- **L'écriture d'Apple partout (branche `police-apple`, 12 octobre 20 h 45)**. Rayan (20 h 41) : « tu te dois d'utiliser
  la calligraphie Apple sur tout ARC ». **Règle à garder : une seule écriture dans ARC, celle d'Apple** (`-apple-system`,
  San Francisco sur iPhone et Mac). `--f`, `--fm`, `--fa` et `--ft` valent la même pile (`-apple-system,
  BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif`) ; le corps aussi, avec
  `tabular-nums` (les chiffres s'alignent sans police à chasse fixe) ; le canevas de la carte suit le corps. Plus Jakarta
  Sans (titres : « Un cerveau. Huit espaces. », noms des projets, « Ma santé », « Déposé »…), JetBrains Mono et Azeret
  Mono ne sont plus chargées. **Seul le logo ARC garde son dessin (Big Shoulders)** : c'est une marque, pas un texte
  (à changer si Rayan le demande). Le code dans une réponse de Claude reste en `ui-monospace` (SF Mono sur Apple).
  Tests : accueil 28/28 (un contrôle ajouté : sur l'entrée, l'accueil, Déposé, le Point du jour, un projet, Santé,
  Juridique, la recherche et la carte, chaque texte visible commence par `-apple-system`, hors logo ; aucune autre police
  chargée), mondes 7/7 (le titre d'un projet attendu en écriture d'Apple). **Non vérifiable ici** : le Chromium de test
  n'a ni San Francisco ni l'ancienne police, les images avant / après y sont identiques ; seul l'iPhone de Rayan montre
  le changement.

### Décisions de Rayan (5 octobre)

- FBA, KITCHEN et TELENEUF sont « endormis » (pas archivés).
- Point du matin à 8 h par défaut.
- Entretiens (5 à 10) menés pendant la construction, avant toute vente.
- Accord donné pour les tables `thoughts` et `arc_events`, puis `thought_filings`, créées par Rayan lui-même.
- Ordre des chantiers : celui de la « Révision de l'ordre » de `docs/ETUDE-COMPLETE.md` (le dépôt d'abord,
  l'usage quotidien et les mesures commencent avec lui).

### Supabase : état au 4 octobre

Projet ARC (organisation RAYAN, offre gratuite), rallumé le 4 octobre.
- **Auth** : connexion par e-mail activée, compte de Rayan ; ARC demande le code avec `shouldCreateUser: false`
  (aucun compte créé depuis ARC). Le proxy refuse tout autre compte que `ARC_OWNER_ID`.
- **`arc_data`** (`user_id` text, `state` jsonb, `updated_at` timestamptz) : sécurité au niveau des lignes activée,
  aucun droit pour `anon`, trois règles pour `authenticated` — `arc_select_own`, `arc_insert_own`, `arc_update_own` —
  avec `user_id = (select auth.uid())::text`. Pas de règle de suppression.
- **`arc_data_archive`** : les 3 lignes d'avril 2026 (état par défaut de trois appareils), archivées au chantier
  connexion ; fermée à `anon` et `authenticated`. `arc_data` est repartie vide avant la première connexion.
- **`ARC-CLAUDE-PROXY` v2** (code : `supabase/functions/ARC-CLAUDE-PROXY/index.ts`) : vérifie le jeton de session auprès
  de `/auth/v1/user`, puis que le compte est `ARC_OWNER_ID` (401 session invalide, 403 autre compte, cause dans les
  journaux de la fonction sans jeton ni identifiant complet). Modèles limités à `ALLOWED_MODELS`, `max_tokens` plafonné
  à 1 500, origines `https://rr269.github.io` et `http://localhost:8080`. Secrets : `ANTHROPIC_KEY`, `ARC_OWNER_ID`.
  `ARC_SECRET` et `x-arc-token` n'existent plus.
- **`thoughts`** et **`arc_events`** (5 octobre, créées par Rayan, avec son accord) : ajout seul, sécurité au niveau
  des lignes, lecture et ajout de ses propres lignes seulement, ni modification ni suppression. Schéma pour mémoire :
  `supabase/schema/2026-10-05-thoughts.sql` (le SQL exact exécuté par Rayan).
- **`thought_filings`** (créée par Rayan pour le chantier 3) : rangements en ajout seul (`id` fourni par l'appareil,
  `thought_id` → `thoughts`, `origin` ai|user, `status` filed|unsure|done|cancelled, `space` ≤ 40, `step` ≤ 300,
  `moment` et `extras` jsonb, `model`, `created_at`, `received_at`) ; lecture et ajout de ses propres lignes, pour ses
  propres pensées ; `space`, `step`, `moment` et `extras` acceptent null. SQL exact :
  `supabase/schema/2026-10-05-thought-filings.sql`.

### Documents à lire avant tout chantier, dans cet ordre

1. `docs/VISION.md` : la vision de Rayan et ses décisions du 5 octobre. Fait foi.
   `docs/CHARTE-DESIGN.md` : sa charte de design (6 octobre). Fait foi pour toute l'interface.
   `docs/MOTS-ARC.md` : les mots d'ARC (7 octobre). `docs/ETAT-DES-LIEUX-CHARTE.md` : l'écart mesuré avec la charte.
2. `docs/ETUDE-COMPLETE.md` : ce qui a été fait, l'écart avec la vision, ce qu'il faut apporter, les priorités,
   la première version à construire et l'ordre des chantiers.
3. `docs/ETUDE-BESOIN.md` : le besoin, sourcé ; la ligne à ne pas franchir en santé et en droit.
4. `docs/PSYCHOLOGIE-DESIGN.md`, `docs/maquettes/`, `docs/notes/` (détail : schéma, migration, faisabilité,
   revue des maquettes), `docs/AUDIT.md` (audit du code du 4 octobre).
5. `docs/ETUDE-ACCUEIL.md` (10 octobre, le centre de contrôle) et `docs/ETUDE-POLES.md` (11 octobre, Santé et
   Juridique : ce qui est permis, le corps en 4D, l'orbite, les étapes, les décisions de Rayan).

### Ouvert

1. **Le geste central marche en réel** (9 octobre, iPhone, proxy de `main` redéployé par Rayan) : les trente jours
   d'usage mesurés peuvent commencer.
2. **La synchronisation fusionne** (branche `synchro`, 10 octobre) au lieu de remplacer tout l'état ; l'état reste une
   seule ligne par compte : le modèle par élément (version 3) reste à faire avant d'ouvrir ARC à d'autres personnes.
3. **Santé reste un suivi à curseurs** (check-in, score, série) : les consignes envoyées à Claude ne jouent plus
   le « conseiller » (branche `rangement`), mais l'écran reste à ramener à la mémoire, aux échéances et aux documents.
4. **Un seul fichier** de plus de 5 000 lignes, `supabase-js@2` non figé, insertions
   `innerHTML` non échappées. L'ancien jeton `x-arc-token` reste lisible dans l'historique public ; il a été
   remplacé le 4 octobre et le proxy v2 ne le lit plus.
5. **Code jamais appelé** : `autoWorldBriefing`, `fmtDate`, `initClaude`, `renderChatHistory`,
   `renderSanteHistory`, `resetPomoWR`.

### Chantier suivant

Déploiement du proxy par Rayan, essai du rangement et du point du matin sur son iPhone et son Mac, fusion de
`rangement` : alors commencent les trente jours d'usage mesurés. Ensuite, la suite de la révision de l'ordre
(tests et modules, modèle version 3, design, interface reconstruite). Toute création de table ou toute écriture
dans Supabase demande son accord.
