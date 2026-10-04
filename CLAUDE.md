# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 4 260 lignes, sans étape de build.
- `supabase/functions/ARC-CLAUDE-PROXY/index.ts` : code du proxy Claude, sans aucun secret (copie de ce qui est déployé).
- `sw.js` : service worker, réseau d'abord, cache `arc-v5` en secours hors ligne.
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
- Claude : `claudeCall` appelle la fonction Supabase `ARC-CLAUDE-PROXY` avec le jeton de session ; le modèle est dans `CLAUDE_MODEL`,
  qui doit figurer dans `ALLOWED_MODELS` du proxy.

## Règles de travail

- Tout changement passe par une branche ; `main` est le site en ligne et ne se modifie qu'avec l'accord explicite de Rayan.
- Une cause se prouve avant de se corriger : citer `fichier:ligne`, ou la commande et sa sortie.
- Après chaque modification, charger la page dans un navigateur (Playwright) et vérifier : aucune erreur de console,
  les cinq mondes et les deux pôles s'ouvrent, le nombre de `<div` égale le nombre de `</div>`.
- Aucun secret dans le code : le dépôt est public. La clé `anon` Supabase est publique par nature, rien d'autre ne l'est.
- Aucune lecture ni écriture dans la base Supabase sans l'accord de Rayan.
- Ne pas ajouter de bibliothèque sans le dire.

## État au 4 octobre 2026

Sur `main` (`e2c6573`, en ligne) : branche `reprise-octobre` — panneau Claude des mondes et de Santé réparé, bouton de veille,
affichage des erreurs Claude, hors ligne réactivé, restes de la clé API retirés, texte de Claude nettoyé (DOMPurify).
Mondes v2 : Trading et tout le code MT5 retirés (données archivées dans `S.archive.trading`), monde ATLAS créé,
ARYAN remis à son état du tour 113.

Sur la branche `connexion` (non fusionnée, testée en réel sur localhost le 4 octobre) : chantier connexion terminé.
- Écran de connexion par e-mail (code ou lien), « Continuer sans connexion » pour un usage local.
- `getUID` renvoie l'identifiant du compte ; `arc_uid` est effacé quand l'appareil est relié (`arc_linked_uid`).
- Première synchronisation d'un appareil : si le compte n'a pas de ligne, l'appareil devient la référence après
  confirmation ; sinon la version en ligne l'emporte et l'état local est gardé sous `arc_v2_avant_connexion`.
- `claudeCall` : `x-arc-token` supprimé, envoi du jeton de session ; tous les blocs `text` de la réponse sont lus ;
  une réponse vide s'affiche en erreur (stop_reason, types de blocs) et n'est jamais enregistrée ; les messages vides
  sont retirés de l'historique envoyé ; les erreurs affichent statut et message, avec « (proxy ARC) » pour nos refus.

Tant que `connexion` n'est pas fusionnée, le site en ligne garde l'ancien `claudeCall` (jeton révoqué) et l'ancienne
synchronisation (table fermée à `anon`) : Claude et la synchronisation y sont hors service.

Sources du contenu : ARYAN, compte rendu du tour 113 (4 octobre) et points de reprise d'août ; ATLAS, sessions de
juillet à septembre — état à recaler avec Rayan (immatriculation, pages légales, achat en mode test : non confirmés).

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

### Ouvert, par ordre de gravité

1. **Fusion de `connexion` dans `main`** : à faire avec l'accord de Rayan ; d'ici là, Claude et la synchronisation sont
   hors service sur le site en ligne.
2. **Contenu de FBA, KITCHEN et TELENEUF daté d'avril 2026.** ATLAS est à recaler (voir plus haut).
3. **Code jamais appelé** : `autoWorldBriefing`, `fmtDate`, `initClaude`, `renderChatHistory`, `renderSanteHistory`,
   `resetPomoWR`.

### Audit et feuille de route

`docs/AUDIT.md` (4 octobre 2026) : mesures, défauts prouvés D1 à D10, nouveau modèle (mondes en données, point d'étape
publié par les projets), règles de design, fonctionnalités classées, ordre des chantiers 0 à 8. À lire avant tout chantier.

### Chantier suivant

Après la fusion de `connexion` : chantier 2 de `docs/AUDIT.md`, les mondes en données (`S.worlds`).
