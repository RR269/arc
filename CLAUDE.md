# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 4 020 lignes, sans étape de build.
- `sw.js` : service worker, réseau d'abord, cache `arc-v5` en secours hors ligne.
- `manifest.json`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.

## Ce que fait ARC

- Cinq mondes (tableau `WORLDS`, l'`id` est l'index) : ARYAN, FBA, KITCHEN, TELENEUF, ATLAS.
- Le contenu d'un monde (tâches, bloquants, mission) est écrit en dur dans `WORLDS` ; ce que Rayan coche vit dans `S`.
- Changer la liste des mondes ou marquer des tâches comme faites : incrémenter `WORLDS_V` et compléter `migrateWorlds`.
- Deux pôles personnels : Santé et Juridique.
- Cockpit par tâche, War Room, Pomodoro, recherche, veille, import/export JSON.
- État dans l'objet `S`, enregistré dans `localStorage` sous la clé `arc_v2` (`loadS`, `saveS`).
- Synchronisation Supabase : table `arc_data` (`pushToCloud`, `pullFromCloud`).
- Claude : `claudeCall` appelle la fonction Supabase `ARC-CLAUDE-PROXY` ; le modèle est dans `CLAUDE_MODEL`.

## Règles de travail

- Tout changement passe par une branche ; `main` est le site en ligne et ne se modifie qu'avec l'accord explicite de Rayan.
- Une cause se prouve avant de se corriger : citer `fichier:ligne`, ou la commande et sa sortie.
- Après chaque modification, charger la page dans un navigateur (Playwright) et vérifier : aucune erreur de console,
  les cinq mondes et les deux pôles s'ouvrent, le nombre de `<div` égale le nombre de `</div>`.
- Aucun secret dans le code : le dépôt est public. La clé `anon` Supabase est publique par nature, rien d'autre ne l'est.
- Aucune lecture ni écriture dans la base Supabase sans l'accord de Rayan.
- Ne pas ajouter de bibliothèque sans le dire.

## État au 4 octobre 2026

Branche `reprise-octobre`, fusionnée dans `main` le 4 octobre (`e2c6573`) et en ligne : panneau Claude des mondes et de Santé réparé, bouton de veille,
affichage des erreurs Claude, hors ligne réactivé, restes de la clé API retirés, texte de Claude nettoyé (DOMPurify).
Mondes v2 : Trading et tout le code MT5 retirés (données archivées dans `S.archive.trading`), monde ATLAS créé,
ARYAN remis à son état du tour 113.

Sources du contenu : ARYAN, compte rendu du tour 113 (4 octobre) et points de reprise d'août ; ATLAS, sessions de
juillet à septembre — état à recaler avec Rayan (immatriculation, pages légales, achat en mode test : non confirmés).

### Supabase : état au 4 octobre, 07 h 15

Le projet ARC (organisation RAYAN, offre gratuite) était en pause ; Rayan l'a rallumé, puis a posé deux verrous :
- `arc_data` : sécurité au niveau des lignes activée et tous les droits retirés au rôle `anon`. Vérifié dans l'éditeur SQL :
  3 lignes, protection active, lecture anonyme refusée. Aucune règle d'accès n'existe encore : la table est fermée à tous
  sauf au rôle de service.
- `ARC-CLAUDE-PROXY` : le jeton était écrit en dur à la ligne 2 de `index.ts` (`const ARC_SECRET`). Il a été remplacé par
  une valeur aléatoire et redéployé. Le jeton encore présent dans `claudeCall` ne vaut plus rien.

Conséquence voulue : ARC affiche « Offline » et Claude répond « Unauthorized » jusqu'au chantier connexion.
Le proxy lit la clé Anthropic dans le secret `ANTHROPIC_KEY`, répond aux requêtes `OPTIONS` avec `Access-Control-Allow-Origin: *`
et vérifie l'en-tête `x-arc-token`. Son code complet est à demander à Rayan (onglet Code de la fonction).

Les 3 lignes de `arc_data` sont celles de trois appareils distincts : à reprendre sous un seul compte au chantier connexion.

### Ouvert, par ordre de gravité

1. **Données fermées, mais plus de synchronisation.** `arc_data` est verrouillée (voir plus haut) ; il manque les règles
   « chacun sa ligne » et la connexion pour la rouvrir à Rayan seul.
2. **Proxy verrouillé, mais Claude éteint.** L'ancien jeton est révoqué ; le proxy doit vérifier la session de Rayan
   à la place d'un jeton partagé, et `x-arc-token` doit disparaître de `claudeCall`.
3. **Synchronisation entre appareils inopérante.** `getUID` fabrique un identifiant au hasard par appareil
   (`arc_uid`) : chaque appareil a sa propre ligne.
4. **Contenu de FBA, KITCHEN et TELENEUF daté d'avril 2026.** ATLAS est à recaler (voir plus haut).
5. **Code jamais appelé** : `autoWorldBriefing`, `fmtDate`, `initClaude`, `renderChatHistory`, `renderSanteHistory`,
   `resetPomoWR`.

### Audit et feuille de route

`docs/AUDIT.md` (4 octobre 2026) : mesures, défauts prouvés D1 à D10, nouveau modèle (mondes en données, point d'étape
publié par les projets), règles de design, fonctionnalités classées, ordre des chantiers 0 à 8. À lire avant tout chantier.

### Chantier suivant : la connexion

Les points 1 à 3 ont une seule solution : connexion Supabase par lien magique (e-mail).
- `arc_data` : `user_id` = `auth.uid()`, sécurité au niveau des lignes activée, une règle « chacun sa ligne ».
- `ARC-CLAUDE-PROXY` : vérifier le jeton de session de l'utilisateur, supprimer `x-arc-token`.
- `index.html` : écran de connexion, `getUID` remplacé par l'identifiant du compte, reprise des données locales
  à la première connexion.
- Côté Rayan, dans Supabase : activer l'e-mail, exécuter le SQL, redéployer la fonction. Le code du proxy n'est pas
  dans ce dépôt : le demander à Rayan avant d'écrire.
