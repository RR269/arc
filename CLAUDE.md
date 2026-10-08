# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 5 480 lignes, sans étape de build.
- `supabase/functions/ARC-CLAUDE-PROXY/index.ts` : code du proxy Claude, sans aucun secret (copie de ce qui est déployé).
- `sw.js` : service worker, réseau d'abord, cache `arc-v6` en secours hors ligne.
- `supabase/schema/` : SQL des tables, pour mémoire (personne ne l'exécute depuis le dépôt).
- `tests/` (Playwright, outil de développement seulement ; mode d'emploi en tête de `tests/depot.mjs`) :
  `depot.mjs` (dépôt), `rangement.mjs` (rangement), `matin.mjs` (point du matin, horloge contrôlée),
  `outils.mjs` (serveur local, faux Supabase, faux proxy),
  `connexion.mjs` (écran d'entrée : identifiants, création de compte, mot de passe),
  `entree-fond.mjs` (fond de l'écran d'entrée : contraste mesuré dans l'image, six couleurs dans le fond et pas dans les lettres),
  `mondes.mjs` (écran des cinq mondes : tailles de texte, champs, cibles, contraste mesuré dans l'image),
  `poles.mjs` (Santé et Juridique, vides et remplis : mêmes mesures, barre du haut sur petit téléphone),
  `mesure.mjs` (outil commun : lecture d'image et mesure du contraste, sans dépendance),
  `proxy.mjs` (proxy hors ligne, sans dépendance : `node tests/proxy.mjs`).
- `manifest.json`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.

## Ce que fait ARC

- Cinq mondes (tableau `WORLDS`, l'`id` est l'index) : ARYAN, FBA, KITCHEN, TELENEUF, ATLAS.
- Le contenu d'un monde (tâches, bloquants, mission) est écrit en dur dans `WORLDS` ; ce que Rayan coche vit dans `S`.
- Changer la liste des mondes ou marquer des tâches comme faites : incrémenter `WORLDS_V` et compléter `migrateWorlds`.
- Deux pôles personnels : Santé et Juridique.
- Cockpit par tâche, War Room, Pomodoro, recherche, veille, import/export JSON.
- État dans l'objet `S`, enregistré dans `localStorage` sous la clé `arc_v2` (`loadS`, `saveS`).
- Connexion : adresse + mot de passe (`authGo`), ou code à 6 chiffres / lien par e-mail (`authSendCode`, `authVerifyCode`) ; `showAuthScreen` ; `getUID` = identifiant du compte.
- Synchronisation Supabase : table `arc_data`, une ligne par compte (`pushToCloud`, `pullFromCloud`). Sans session, rien n'est lu ni écrit.
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
  Relancer `tests/proxy.mjs`, `tests/connexion.mjs`, `tests/entree-fond.mjs`, `tests/mondes.mjs`, `tests/poles.mjs`, `tests/depot.mjs`, `tests/rangement.mjs` et `tests/matin.mjs` ; ne jamais toucher
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
- **Avis donné à Rayan (1 h 21), sans suite pour l'instant** : l'écran d'entrée promet plus que l'intérieur ne tient
  (priorité : le premier écran après connexion) ; la devise est écrite deux fois sur l'écran ; il manque une ligne
  sur les données à la création de compte (texte à écrire avec lui).
- **Question de Rayan du 7 octobre, 18 h** (Santé et Juridique « ont totalement changé », iPhone non connecté) :
  la PR #10 ne touche aucune ligne de données (recherche dans le diff : zéro) ; ses captures montrent l'état de
  départ (les quatre habitudes posées par `renderHabitudes`). Reste à vérifier par lui sur son Mac connecté si son
  compte contient du contenu Santé ou Juridique. Vu dans ses captures : la barre du haut de l'accueil déborde à
  droite sur iPhone (« Non connecté » et « War Room » sur deux lignes), pas corrigé.
- **À suivre, demandé par Rayan** : « finir de modifier cette page » (l'écran d'entrée), après la connexion.

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

### Ouvert

1. **Le geste central est construit, en essai** : dépôt en ligne ; rangement et point du matin sur la branche
   `rangement` ; proxy `a1ca2ca` déployé et essayé sur le Mac, version suivante à redéployer ; iPhone pas essayé.
2. **La synchronisation remplace tout l'état d'un coup** (dernière action gagne, `pullFromCloud`) : à remplacer
   par des pensées en ajout seul avant d'ouvrir le dépôt sur deux appareils.
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
