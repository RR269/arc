# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 4 590 lignes, sans étape de build.
- `supabase/functions/ARC-CLAUDE-PROXY/index.ts` : code du proxy Claude, sans aucun secret (copie de ce qui est déployé).
- `sw.js` : service worker, réseau d'abord, cache en secours hors ligne (`arc-v6` sur la branche `depot`).
- `supabase/schema/` : SQL des tables, pour mémoire (personne ne l'exécute depuis le dépôt).
- `tests/depot.mjs` : tests du dépôt de pensées (Playwright, outil de développement seulement ; mode d'emploi en tête du fichier).
- `manifest.json`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.

## Ce que fait ARC

- Cinq mondes (tableau `WORLDS`, l'`id` est l'index) : ARYAN, FBA, KITCHEN, TELENEUF, ATLAS.
- Le contenu d'un monde (tâches, bloquants, mission) est écrit en dur dans `WORLDS` ; ce que Rayan coche vit dans `S`.
- Changer la liste des mondes ou marquer des tâches comme faites : incrémenter `WORLDS_V` et compléter `migrateWorlds`.
- Deux pôles personnels : Santé et Juridique.
- Cockpit par tâche, War Room, Pomodoro, recherche, veille, import/export JSON.
- État dans l'objet `S`, enregistré dans `localStorage` sous la clé `arc_v2` (`loadS`, `saveS`).
- Connexion par e-mail (code à 6 chiffres ou lien) : `showAuthScreen`, `authSendCode`, `authVerifyCode` ; `getUID` = identifiant du compte.
- Synchronisation Supabase : table `arc_data`, une ligne par compte (`pushToCloud`, `pullFromCloud`). Sans session, rien n'est lu ni écrit.
- Dépôt de pensées (branche `depot`) : barre fixe en bas de l'écran, liste « Déposé » ; pensées dans `localStorage`
  sous `arc_thoughts_v1` (jamais dans `S`), envoyées dans la table `thoughts` (`depotFlush`, `depotPull`), mesures
  `open` et `deposit` dans `arc_events`.
- Claude : `claudeCall` appelle la fonction Supabase `ARC-CLAUDE-PROXY` avec le jeton de session ; le modèle est dans `CLAUDE_MODEL`,
  qui doit figurer dans `ALLOWED_MODELS` du proxy.

## Règles de travail

- Tout changement passe par une branche ; `main` est le site en ligne et ne se modifie qu'avec l'accord explicite de Rayan.
- Une cause se prouve avant de se corriger : citer `fichier:ligne`, ou la commande et sa sortie.
- Après chaque modification, charger la page dans un navigateur (Playwright) et vérifier : aucune erreur de console,
  les cinq mondes et les deux pôles s'ouvrent, le nombre de `<div` égale le nombre de `</div>`.
  Relancer `tests/depot.mjs` ; ne jamais toucher au dépôt sans que ses tests passent.
- Aucun secret dans le code : le dépôt est public. La clé `anon` Supabase est publique par nature, rien d'autre ne l'est.
- Aucune lecture ni écriture dans la base Supabase sans l'accord de Rayan.
- Ne pas ajouter de bibliothèque sans le dire.

## État au 5 octobre 2026

En ligne sur `main` (`052f7de`, PR #1 `reprise-octobre` puis PR #2 `connexion`, fusionnées le 4 octobre) :
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

Branche `etude-v2` (non fusionnée, documents seulement) : vision, étude du besoin, psychologie du design,
maquettes, étude complète. Aucune ligne de code.

Branche `depot` (non fusionnée, partie de `etude-v2`) : chantier 2 de la révision de l'ordre
(`docs/ETUDE-COMPLETE.md`, « Révision de l'ordre »), le dépôt minimal sur le socle actuel.
- Barre de dépôt fixe en bas (accueil, mondes, pôles ; iPhone et Mac), champ qui grandit, Entrée dépose sur Mac,
  Maj+Entrée va à la ligne ; la voix passe par la dictée du clavier (aucun code de reconnaissance vocale).
- Écriture locale immédiate (`arc_thoughts_v1`), puis envoi dans `thoughts` (doublons ignorés sur `id`) ; nouvel
  essai au lancement, au retour du réseau et au retour au premier plan ; aucune pensée n'est jamais retirée de
  l'appareil. Au lancement avec session : lecture des 200 dernières pensées, fusion par `id`.
- Sans session : pensée gardée sur l'appareil, « Sur cet appareil seulement », envoyée à la connexion suivante.
- Écran « Déposé » depuis l'accueil ; texte des pensées affiché par `textContent` seulement.
- `pushToCloud` et `pullFromCloud` ne sont pas touchés. `tests/depot.mjs` : 19 sur 19 le 5 octobre (faux Supabase), dont deux onglets ouverts en même temps.
- Pas encore essayé sur l'iPhone ni le Mac de Rayan, ni contre la vraie table `thoughts`.

### Décisions de Rayan (5 octobre)

- FBA, KITCHEN et TELENEUF sont « endormis » (pas archivés).
- Point du matin à 8 h par défaut.
- Entretiens (5 à 10) menés pendant la construction, avant toute vente.
- Accord donné pour les tables `thoughts` et `arc_events`, créées par Rayan lui-même.
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

### Documents à lire avant tout chantier, dans cet ordre

1. `docs/VISION.md` : la vision de Rayan et ses décisions du 5 octobre. Fait foi.
2. `docs/ETUDE-COMPLETE.md` : ce qui a été fait, l'écart avec la vision, ce qu'il faut apporter, les priorités,
   la première version à construire et l'ordre des chantiers.
3. `docs/ETUDE-BESOIN.md` : le besoin, sourcé ; la ligne à ne pas franchir en santé et en droit.
4. `docs/PSYCHOLOGIE-DESIGN.md`, `docs/maquettes/`, `docs/notes/` (détail : schéma, migration, faisabilité,
   revue des maquettes), `docs/AUDIT.md` (audit du code du 4 octobre).

### Ouvert

1. **Le geste central n'est qu'à moitié là** : le dépôt existe sur la branche `depot` ; le rangement par l'IA avec
   une étape et un moment (chantier 3) et le retour à heure convenue (chantier 4) restent à faire.
2. **La synchronisation remplace tout l'état d'un coup** (dernière action gagne, `pullFromCloud`) : à remplacer
   par des pensées en ajout seul avant d'ouvrir le dépôt sur deux appareils.
3. **Santé et Juridique jouent un rôle de « conseiller »** : à ramener à la mémoire, aux échéances, aux documents
   et à la préparation de rendez-vous. Aucun avis médical ni juridique.
4. **Aucun test dans le dépôt**, un seul fichier de 4 264 lignes, `supabase-js@2` non figé, insertions
   `innerHTML` non échappées. L'ancien jeton `x-arc-token` reste lisible dans l'historique public ; il a été
   remplacé le 4 octobre et le proxy v2 ne le lit plus.
5. **Code jamais appelé** : `autoWorldBriefing`, `fmtDate`, `initClaude`, `renderChatHistory`,
   `renderSanteHistory`, `resetPomoWR`.

### Chantier suivant

Après l'essai du dépôt par Rayan et sa fusion : chantier 3 de la révision (rangement par l'IA et prochaine étape
avec un moment, retrait des rôles « conseiller »). Toute création de table ou toute écriture dans Supabase demande
son accord.
