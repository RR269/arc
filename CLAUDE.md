# ARC — tableau de bord personnel de Rayan

Application web mono-fichier, en français, servie par GitHub Pages depuis `main` : https://rr269.github.io/arc/

## Les fichiers

- `index.html` : toute l'application (CSS, HTML, JavaScript), environ 4 080 lignes, sans étape de build.
- `sw.js` : service worker, réseau d'abord, cache `arc-v5` en secours hors ligne.
- `manifest.json`, `icon-192.png`, `icon-512.png` : installation sur l'écran d'accueil.

## Ce que fait ARC

- Cinq mondes (tableau `WORLDS`) : ARYAN, FBA, KITCHEN, TELENEUF, TRADING.
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

Branche `reprise-octobre` (non fusionnée) : panneau Claude des mondes et de Santé réparé, bouton de veille,
affichage des erreurs Claude, hors ligne réactivé, restes de la clé API retirés, texte de Claude nettoyé (DOMPurify).

### Ouvert, par ordre de gravité

1. **Données ouvertes.** `arc_data` est lue et écrite sans connexion avec la clé `anon` : n'importe qui peut la lire,
   pôles Santé et Juridique compris.
2. **Secret du proxy public.** `x-arc-token` est en clair dans `claudeCall` : n'importe qui peut consommer la clé Anthropic.
3. **Synchronisation entre appareils inopérante.** `getUID` fabrique un identifiant au hasard par appareil
   (`arc_uid`) : chaque appareil a sa propre ligne.
4. **Suivi MT5 mort.** Les gestionnaires existent (`mt5-json-inp`, `mt5-webhook-inp`, `mt5-m-capital`) mais les champs
   ont disparu de la page. À rebrancher ou à retirer : décision de Rayan.
5. **Contenu daté d'avril 2026.** Les cinq mondes ne reflètent plus l'état réel des projets ; Atlas n'y figure pas.
6. **Code jamais appelé** : `autoWorldBriefing`, `fmtDate`, `initClaude`, `renderChatHistory`, `renderSanteHistory`,
   `resetPomoWR`.

### Chantier suivant : la connexion

Les points 1 à 3 ont une seule solution : connexion Supabase par lien magique (e-mail).
- `arc_data` : `user_id` = `auth.uid()`, sécurité au niveau des lignes activée, une règle « chacun sa ligne ».
- `ARC-CLAUDE-PROXY` : vérifier le jeton de session de l'utilisateur, supprimer `x-arc-token`.
- `index.html` : écran de connexion, `getUID` remplacé par l'identifiant du compte, reprise des données locales
  à la première connexion.
- Côté Rayan, dans Supabase : activer l'e-mail, exécuter le SQL, redéployer la fonction. Le code du proxy n'est pas
  dans ce dépôt : le demander à Rayan avant d'écrire.
