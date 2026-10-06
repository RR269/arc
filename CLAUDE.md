# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 5 670 lignes, sans étape de build.
- `supabase/functions/ARC-CLAUDE-PROXY/index.ts` : code du proxy Claude, sans aucun secret (copie de ce qui est déployé).
- `sw.js` : service worker, réseau d'abord, cache `arc-v6` en secours hors ligne.
- `supabase/schema/` : SQL des tables, pour mémoire (personne ne l'exécute depuis le dépôt).
- `tests/` (Playwright, outil de développement seulement ; mode d'emploi en tête de `tests/depot.mjs`) :
  `depot.mjs` (dépôt), `rangement.mjs` (rangement), `matin.mjs` (point du matin, horloge contrôlée),
  `outils.mjs` (serveur local, faux Supabase, faux proxy),
  `connexion.mjs` (écran d'entrée : identifiants, création de compte, mot de passe),
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
  Relancer `tests/proxy.mjs`, `tests/connexion.mjs`, `tests/depot.mjs`, `tests/rangement.mjs` et `tests/matin.mjs` ; ne jamais toucher
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

Nouvel accueil et nouvelle connexion (branche `design`, 6 octobre, partie de `main` à `09b9196` ; PR #4 `rangement` fusionnée) :
- Demande de Rayan le 6 octobre : changer tout de suite l'accueil et l'écran de connexion, pour voir la direction.
- Direction des maquettes (`docs/maquettes/Main.dc.html`) : fond clair `#F5F5F7`, titres en Bricolage Grotesque
  (police Google Fonts ajoutée dans `<head>`), texte en police système, trois tons par espace (`HOME_PAL`).
- Accueil (`#S1`) : en-tête (anneau, date, état de synchronisation, menu « ··· » qui contient maintenant Recherche
  et War Room), « Maintenant » (la première des prochaines étapes, dans la couleur de son espace), « Ensuite »,
  Déposé et Point du jour, « Projets » (ARYAN et ATLAS en grandes cartes, FBA, KITCHEN et TELENEUF en lignes
  « Endormi »), « Ma vie » (Santé, Juridique, à part et plus calme).
- Retiré de l'écran : compteurs, progression globale, alerte « bloquants », ajout rapide de tâche, veille. Leur
  balisage est gardé dans `#home-legacy` (attribut `hidden`) parce que `renderHome`, `renderQA` et `renderIntel`
  s'y branchent encore ; à supprimer avec ce code au chantier « interface reconstruite ».
- Les variables de couleur sont redéfinies sur `#S1`, `#auth-screen`, `#depot-screen`, `#matin-screen` et
  `#depot-bar` : « Déposé », le point du matin et la barre de dépôt sont clairs aussi. Les mondes et les pôles
  gardent leur écran sombre (la barre de dépôt y reste claire).
- Connexion : même direction ; « J'ai déjà un code » passe à la saisie sans demander d'e-mail ; « Renvoyer un
  code » attend une minute après un envoi (`arc_auth_sent_at`) ; l'erreur d'un renvoi s'affiche sur l'étape du
  code (elle s'écrivait sur l'étape de l'adresse, invisible). Le blocage rencontré par Rayan sur l'iPhone
  (« trop de demandes ») vient de la limite d'envoi d'e-mails de Supabase : aucun changement de la page ne la lève.
- Identifiants (demande de Rayan, 6 octobre) : l'écran d'entrée a deux onglets, « Se connecter » (adresse + mot de
  passe, `signInWithPassword`, aucun e-mail envoyé) et « Créer un compte » (`signUp`). Une fois connecté, « ··· » ›
  « Mon mot de passe » le crée ou le change (`updateUser`). Le code par e-mail reste le secours (« Mot de passe
  oublié ? »). Le mot de passe n'est jamais gardé sur l'appareil. Fonctions : `authGo`, `authSetMode`, `authSavePass`.
  **Côté Supabase, rien n'a changé** : les inscriptions sont fermées (« Créer un compte » répond « pas encore
  ouverte »), le compte de Rayan n'a pas encore de mot de passe, et le proxy Claude refuse tout autre compte que
  `ARC_OWNER_ID`. Ouvrir les inscriptions est une décision de Rayan (réglage Auth, e-mails de confirmation limités).
- Écran d'entrée refait le 6 octobre au matin (Rayan : « pas de phrase en haut, de la couleur, le logo, le nom,
  du design qui donne envie ») : à gauche (en haut sur iPhone) un côté couleur avec le logo, le nom ARC en grand,
  une ligne (« Dépose ce que tu as en tête. ARC le range et te dit quoi faire. ») et le geste montré sur trois
  exemples fixes qui se suivent (`AUTH_DEMO`, `authDemoRun` ; aucun appel, arrêt si « moins de mouvement ») ; à
  droite (en dessous sur iPhone) les identifiants. Bouton principal en couleur.
- Tests le 6 octobre (bac à sable, bibliothèques servies en local) : connexion 13/13 (`tests/connexion.mjs`), dépôt
  19/19, rangement 25/25, matin 27/27, proxy 41/41 ; 549 `<div` / 549 `</div>` ; cinq mondes et deux pôles s'ouvrent, aucune erreur de console,
  iPhone 390×844 et Mac 1440×900. Pas encore vu par Rayan sur ses appareils.

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
