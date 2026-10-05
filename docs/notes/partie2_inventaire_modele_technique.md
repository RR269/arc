# Partie 2 et Partie 3 (b, f) — inventaire, écarts, modèle de données, technique

Notes de travail du 5 octobre 2026. Branche lue : `etude-v2` (égale à `origin/main` plus les documents).
Lecture seule : aucun fichier suivi n'a été modifié, aucun appel à Supabase.

**Étiquettes.** PROUVÉ : lu dans le code (fichier:ligne) ou mesuré par une commande. PROBABLE : déduction solide du code,
non exécutée. SUPPOSÉ : connaissance générale, non vérifiée ici.

**Méthode.** Lecture complète de `index.html` (4 264 lignes), `sw.js`, `manifest.json`, du proxy. Mesures par un script
Node (comptages, évaluation de `WORLDS`). Un chargement réel de la page dans Chromium (Playwright), en 1440×900 et en
390×844, réseau externe bloqué, état vierge. Les numéros de ligne sont ceux de `index.html` sauf mention contraire.

**À savoir avant de lire.** `CLAUDE.md` dit que la branche `connexion` n'est pas fusionnée. C'est périmé : `git log`
montre `052f7de Merge pull request #2 from RR269/connexion` sur `main`, et le code de connexion est bien dans
`index.html` (1737-1858). PROUVÉ. `CLAUDE.md` est à mettre à jour.

---

## Résumé en dix lignes

1. ARC actuel est un tableau de bord de projets écrits à l'avance. Le geste central de la vision (déposer une pensée,
   la retrouver rangée avec une étape et un moment) n'existe nulle part dans le code. PROUVÉ.
2. Aucune entrée vocale, aucune boîte de dépôt libre, aucun « moment » sur une tâche, aucune notification. PROUVÉ.
3. Le contenu des cinq mondes (38 000 caractères) est en dur dans `WORLDS`. `S` ne garde que des coches et des ajouts,
   rangés par numéro de monde. Changer un monde demande de modifier le code. PROUVÉ.
4. Plusieurs fonctions affichées ne marchent pas : la recherche plante (`searchQuery` n'existe pas), l'accueil
   d'arrivée ne s'affiche jamais, le briefing War Room n'est jamais envoyé, Claude est invisible sur iPhone. PROUVÉ.
5. Santé est un suivi quotidien à curseurs avec score et série de jours ; Juridique s'appelle « conseiller juridique ».
   Les deux sont du mauvais côté de la ligne fixée par la vision et l'étude du besoin. PROUVÉ.
6. Le socle est sain et récent : connexion par e-mail, une ligne par compte, proxy Claude protégé, service worker.
7. La synchronisation remplace tout l'état d'un coup, selon la date de la dernière action. Ouvrir un monde compte
   comme une action. Deux appareils qui déposent des pensées se les écraseraient. PROUVÉ (lecture du code).
8. Recommandation : reconstruire l'interface, garder le socle. Environ 370 lignes de JavaScript sont à garder telles
   quelles ou presque, sur 2 560. Le reste est lié à `WORLDS` ou au thème sombre.
9. Nouveau schéma proposé : des collections par identifiant (pensées, espaces, étapes, échéances, phases, points
   d'étape, bloquants, réglages), une fusion élément par élément, une migration qui ne perd rien.
10. Le proxy laisse passer seulement `model`, `max_tokens`, `system` (texte) et `messages`. Pas d'outils, pas de
    limite de taille, pas de compteur d'usage, un seul compte autorisé. Quatre changements sont nécessaires.

---

# A. Inventaire (Partie 2)

Colonne « Saisie » : faut-il que Rayan tape quelque chose pour que la fonction serve ?
Verdicts : GARDER, TRANSFORMER, FUSIONNER, SUPPRIMER.

## A.1 Accueil

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| En-tête (logo, « RAYAN · VALENCE », pastille de synchro, Recherche, War Room, menu) | HTML 1040-1055 | Barre du haut | Non | TRANSFORMER | Nom et ville en dur (1042, 1059, 4241). La pastille de synchro est à garder. |
| Titre « Un cerveau. Sept espaces. » | 1058 | Phrase fixe | Non | TRANSFORMER | Faux : il y a 5 mondes et 2 pôles. Doit se calculer. PROUVÉ. |
| Quatre compteurs (Projets, Accomplies, Bloquants, Journal) | HTML 1061-1066 ; `renderHome` 2458-2500 | Additionne les coches et les bloquants | Non | SUPPRIMER | « 5 » est en dur (1062). Des compteurs ne disent pas quoi faire. |
| Barre « Progression globale » et phrase de motivation | 1068 ; 2468-2479 | % de tâches cochées, phrase choisie par `pct % 5` | Non | SUPPRIMER | Le % dépend d'une liste écrite en dur. La phrase est aléatoire. |
| Alerte « N bloquants. Résous maintenant. » | 1060 ; 2491-2494 | Somme des bloquants | Non | SUPPRIMER | Bloquants en dur, sans date. Ton culpabilisant, contraire à la vision. |
| Cartes des mondes | 1075 ; `renderCards` 2522-2562 | Une carte par monde : %, bloquants, badge, prochaine tâche | Non | TRANSFORMER | Devient l'écran « Espaces ». Le badge CRITIQUE/URGENCE ne regarde que le nombre de bloquants (2541). |
| Cartes des pôles | 1083 ; `renderPoles` 2502-2520 | Santé : « Check-in du jour manquant ». Juridique : nombre d'éléments | Non | TRANSFORMER | Devient « Ma vie », à part. Le rappel de check-in manquant est à retirer. |
| Ajout rapide de tâche | 1087 ; `renderQA` 2565-2573 ; touche Entrée 3704-3711 | Un champ, on choisit le monde, la tâche s'ajoute | Oui | TRANSFORMER | C'est l'ancêtre du dépôt. Mais il faut choisir le monde soi-même, et rien n'est rangé ni daté. |
| Veille & Sources | 1088-1089 ; `INTEL_STATIC` 2329-2334 ; `renderIntel` 2575-2590 ; bouton 3519 | 4 fiches en dur avec lien | Non | SUPPRIMER | « Actualiser » réaffiche la même liste (3519). Le compteur dit « 6 sources », il y en a 4 (1088). |
| Section « Tes 5 projets » | 1090-1091 | Rien | — | SUPPRIMER | Toujours vide : deuxième élément avec l'identifiant `hgrid`. Mesuré : `[5, 0]` enfants. PROUVÉ. |
| Horloge `h-clock` | 2452-2453 | Rien | — | SUPPRIMER | L'élément n'existe pas dans la page. Le minuteur tourne chaque seconde pour rien. PROUVÉ. |

## A.2 Mondes

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| Tableau `WORLDS` | 1969-2298 | Tout le contenu des 5 mondes, en dur | Dans le code | TRANSFORMER | Devient des données (`spaces`, `steps`, etc.). Voir partie C. |
| Écran monde : barre, en-tête, anneau de %, 4 métriques | HTML 1096-1168 ; `enterWorld` 2594-2630 ; `renderWorld` 2644-2695 | Affiche le monde | Non | TRANSFORMER | L'idée « on entre dans un monde » est gardée (couleur par monde, 2597). La mise en page est à refaire. |
| Chronomètre de visite | 1109 ; 2610-2619 | Compte les secondes passées dans le monde | Non | SUPPRIMER | La valeur n'est jamais enregistrée ni utilisée. |
| Boutons « Prod ↗ », « Contexte », « Code ↗ » | 1110-1112 ; 3585-3587 | Lien du monde ; tiroir ; ouvre `github.com` | Non | FUSIONNER | Avec les liens de l'espace. « Code ↗ » ouvre l'accueil de GitHub (3586). |
| Mission | 1171-1177 ; 2668 | Texte en dur | Non | TRANSFORMER | Devient le « cap » de l'espace, modifiable. |
| Action prioritaire | 1180-1195 ; 2671-2678 | Texte en dur (`w.priority`) | Non | TRANSFORMER | Devient « la prochaine étape, une seule, avec un moment ». |
| Tâches | HTML 1198-1209 ; `renderTasks` 2697-2731 ; `renderTaskRow` 2733-2754 ; clics 3451, 3463, 3466, 3601 | Liste à cocher, ajout, suppression, étoile « focus » | Oui pour les ajouts | TRANSFORMER | Devient les étapes. Aujourd'hui : pas de date, pas de moment, pas d'origine. |
| Badge d'échéance sur une tâche | 2737-2745 | Lit `S.deadlines` | — | SUPPRIMER (code mort) | `S.deadlines` n'est écrit nulle part (seules lignes : 2371 et 2737). Aucune échéance ne peut exister. PROUVÉ. |
| Poignée de glisser-déposer | 2747 ; style 258 | Affiche ↕ | — | SUPPRIMER (code mort) | Aucun code de glisser. `S.taskOrder` n'est jamais écrit (2373, 2706 seulement). PROUVÉ. |
| Bloquants | 1212-1219 ; `renderBlockers` 2756-2769 ; ajout 3591 | Liste en dur + ajouts | Oui pour les ajouts | TRANSFORMER | À garder comme objet, avec une date et un état. Aujourd'hui un bloquant ajouté ne peut pas être retiré : aucun code de suppression. PROUVÉ. |
| Prochaines actions | 1222-1225 ; `renderNA` 2771-2779 | Liste en dur | Non | FUSIONNER | Avec la feuille de route (colonne « Ensuite »). |
| Notes du monde | 1228-1232 ; écoute 3685 | Zone de texte libre, enregistrée après 1,5 s | Oui | FUSIONNER | Avec les pensées déposées dans l'espace. |
| Journal du monde | 1235-1242 ; `renderJournal` 2781-2791 ; 3593 | Entrées datées, 20 visibles | Oui | FUSIONNER | Avec les pensées (chronologie de l'espace). |
| Capture automatique de Claude dans le journal | 4145-4150 | Copie les 200 premiers caractères de chaque réponse de Claude dans le journal | Non | SUPPRIMER | Remplit le journal de texte de machine. Le bouton pour la couper est dans un bloc jamais affiché (`cp-autocap`, 1268, `display:none`). PROUVÉ. |
| Outils (liens) | 1245-1248 ; `renderTools` 2793-2802 ; `addTool` 3719-3731 | Liens ajoutés par trois fenêtres `prompt()` | Oui | TRANSFORMER | Garder l'idée de liens par espace. Remplacer les `prompt()`. |
| Tiroir latéral | HTML 1692-1697 ; `openDrawer` 3860-3941 | Détail d'une métrique, de la mission, etc. | Non | SUPPRIMER | Répète ce qui est déjà à l'écran. Le bouton « + » du tiroir Bloquants n'a pas de code (`dr-add-blocker`, 3901 seulement). Le cas `task-work` n'est jamais appelé. PROUVÉ. |

## A.3 Travail sur une tâche

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| Cockpit par tâche | HTML 1602-1633 ; `openCockpit` 3769-3812 ; envoi 3531 ; `saveCockpitWork` 3972-3977 | Plein écran : zone de travail par tâche, question à Claude, journal | Oui | TRANSFORMER | La « zone de travail » par étape est utile. Les 75 invites en dur (une par tâche, 21 706 caractères) sont à retirer. Échap ne ferme pas le cockpit : le test regarde `style.display` alors que l'ouverture pose une classe (3661, 3776). PROBABLE. |
| Pomodoro du cockpit | 1610-1615 ; `togglePomo` 4004-4021 ; 3485 | Minuteur 25/5 | Non | SUPPRIMER (ou plus tard) | Ne sert aucun des cinq besoins. Rien n'est enregistré (`S.sessions` reste vide, 2388 seul). |
| War Room | HTML 1672-1691 ; `openWarRoom` 3819-3849 ; minuteur 3487-3504 | Plein écran sur la première tâche non faite, avec un second Pomodoro | Oui | FUSIONNER | Avec le cockpit : deux écrans pour le même besoin. Le « plan d'attaque » est construit (3845) mais jamais envoyé à Claude. Le message « Analyse War Room en cours… » reste donc affiché sans suite (3847). PROUVÉ. |

## A.4 Recherche, clavier, arrivée

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| Recherche (Cmd+K) | HTML 1634-1636 ; `openSearch` 3980-3986 ; écoute 3683 | Ouvre une fenêtre de recherche | Oui | TRANSFORMER | **Elle ne marche pas.** La frappe appelle `searchQuery`, qui n'existe pas. Mesuré : erreur « searchQuery is not defined », résultats inchangés. PROUVÉ. À refaire plus tard, jamais comme entrée unique. |
| Raccourcis clavier | 3654-3678 | Cmd+K, Échap, Retour arrière, N | Non | GARDER (à refaire) | Utile sur Mac. « N » vise un champ d'un autre écran (3672-3675). |
| Accueil d'arrivée (3 écrans) | HTML 1637-1641 ; `obNext`, `obFinish` 4024-4036 ; test 4238 | Présente ARC au premier lancement | Non | SUPPRIMER | Ne s'affiche jamais : `S.seen` reçoit une date dès la création de `S` (2339), donc le test de 4238 est toujours faux. Mesuré. PROUVÉ. Le texte est aussi périmé. |
| Bouton flottant Claude sur téléphone | styles 769, 873, 944 ; clic 3647 | Rien | — | SUPPRIMER (code mort) | Ni `fab-claude` ni `claude-sheet` n'existent dans la page. PROUVÉ. |

## A.5 Les pôles

**Santé — ce qu'il contient vraiment.** HTML 1301-1502 ; code 2832-3156.

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| Check-in du jour (4 curseurs : sommeil, énergie, sport, mental) | 1363-1408 ; `saveCheckin` 3048-3068 | Enregistre 4 nombres par jour, 365 jours gardés | Oui, chaque jour | SUPPRIMER | « Pas de suivi de santé à saisie quotidienne » (étude du besoin). Données à archiver, pas à effacer. |
| Score sur 100 et libellé (« Fatigue détectée ») | `calcSanteScore` 2901-2918 ; 2876 | Calcule une note et un jugement | Non | SUPPRIMER | C'est une interprétation de l'état de la personne. |
| Série de jours (« 3 jours de suite ») | `getSanteStreak` 2920-2931 ; 2888-2898 | Compte les jours consécutifs | Non | SUPPRIMER | La vision dit : pas de séries de jours. |
| Moyennes 7 jours, graphique | 2945-3042 | Barres et tendances | Non | SUPPRIMER | « Repérer une tendance à valeur médicale » est du côté risqué. |
| Habitudes du jour | 1430-1441 ; `renderHabitudes` 3079-3105 | 4 habitudes par défaut à cocher chaque jour | Oui, chaque jour | SUPPRIMER | Saisie quotidienne. Le code de clic existe en double (3564-3575 et 3608-3641). |
| Objectifs santé | 1444-1451 ; 3119-3130 | Liste à cocher | Oui | FUSIONNER | Avec les étapes de l'espace Santé, si Rayan en veut. |
| Journal santé | 1454-1461 ; `renderSanteJournal` 3070-3077 ; 3605 | Notes datées. Pas de suppression possible | Oui | TRANSFORMER | C'est la seule brique conforme : la « chronologie datée ». Devient la mémoire de santé. |
| Export CSV | `exportSante` 3325-3338 | Télécharge les check-ins | Non | TRANSFORMER | Garder un export, pour les notes et les échéances. |
| « Claude Santé — Conseiller bien-être » | HTML 1471-1500 ; `santeCpSend` 3133-3156 | Envoie les chiffres du jour à Claude, rôle « conseiller santé… scientifiquement fondé » (3154). Boutons : « Optimiser mon sommeil », « Gérer le stress » | Oui | TRANSFORMER | Rôle interdit par la vision. À remplacer par : retrouver ses notes, préparer un rendez-vous. Les échanges ne sont jamais enregistrés. PROUVÉ (aucun `addChatMsg` pour Santé). |

Absents du pôle Santé : rendez-vous, échéances, documents, fiche « à dire au médecin ». PROUVÉ.

**Juridique — ce qu'il contient vraiment.** HTML 1504-1599 ; code 3159-3379.

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| 4 rubriques en accordéon (Statut, Contrats, Aides, Démarches) | `JUR_SECTIONS` 3159-3164 ; `renderJurSections` 3196-3265 ; ajout 3557 | Éléments avec texte, priorité, état, **date d'échéance** | Oui | TRANSFORMER | La seule vraie notion d'échéance d'ARC est ici (champ date, 3254). C'est la base de l'échéancier. Les rubriques sont en dur. |
| Chronologie | `renderJurTimeline` 3301-3322 | Les 10 premières échéances triées | Non | GARDER (à refaire) | Conforme : « échéancier personnel ». |
| Compteur « urgents » | `renderJurHero` 3175-3194 | Compte les échéances à 7 jours | Non | TRANSFORMER | Bogue : `!it.status !== 'done'` est toujours vrai (3184), donc les éléments terminés sont comptés. PROUVÉ. |
| Recherche dans le dossier | 1533-1539 ; `searchJur` 3291-3299 | Filtre les éléments | Oui | FUSIONNER | Avec la recherche générale. |
| Notes juridiques | 1551-1555 ; 3686 | Texte libre | Oui | FUSIONNER | Avec les pensées de l'espace. |
| Export texte | `exportJur` 3340-3360 | Télécharge le dossier | Non | GARDER (à refaire) | « Export complet et lisible » est un argument de l'étude. |
| « Claude Juridique — Conseiller personnel » | HTML 1565-1597 ; `jurCpSend` 3362-3379 | Rôle « conseiller juridique et administratif personnel » (3377). Boutons : « Quel statut juridique… », « Contrat type… » | Oui | TRANSFORMER | « Dans votre cas… » est la zone réservée. Garder : règle générale avec lien officiel, liste de pièces, préparation. Un avertissement existe déjà (1577). |

Absents du pôle Juridique : documents à retrouver (aucun fichier, aucun lien de pièce), rappel avant échéance. PROUVÉ.

## A.6 Claude : panneaux et messages envoyés

Il y a quatre entrées vers Claude. Toutes passent par `claudeCall` (4044-4164), qui envoie
`{model, max_tokens: 1500, system, messages}` (4057-4059) au proxy avec le jeton de session (4072-4078).

| Entrée | Où | Message système | Historique envoyé | Enregistré ? |
|---|---|---|---|---|
| Panneau du monde | HTML 1253-1296 ; `cpSend` 4167-4189 | Construit à 4185-4186 (voir ci-dessous) | Les 10 derniers messages du monde (4063-4067) | Oui, `S.chatMsgs[wid]`, 100 au plus (4227-4231) |
| Cockpit, mode « Injecter » | 3531 | **Aucun** | Aucun | Non |
| Santé | 3133-3156 | 3154 | Aucun | Non |
| Juridique | 3362-3379 | 3377 | Aucun | Non |

**Comment le contexte d'un monde est construit** (4182-4186, cité) :

```
'Tu es le partenaire stratégique de Rayan, entrepreneur à Valence (France).\n\nPROJET: '+w.name+
'\nMISSION: '+w.mission+'\nCONTEXTE: '+w.context+'\n\nACCOMPLI: '+done.slice(0,6).join(', ')+
'\nEN COURS: '+todo.slice(0,6).join(', ')+
'\n\nRègle: identifie les risques en premier, sois direct sans filtre. Réponds en français, 3-5 phrases.'
```

**Taille pour ARYAN, mesurée** (état vierge) : **1 708 caractères** de message système. Dedans : la mission (164),
le champ `context` en dur (660), les 6 premières tâches faites et les 6 premières à faire. S'y ajoutent la question
et au plus 9 messages d'historique. La réponse est plafonnée à 1 500 jetons.

Ce que Claude ne reçoit pas : les bloquants, les notes, le journal, les tâches ajoutées par Rayan (`S.custom` n'est
pas dans `allT`, 4182), la zone de travail, les dates. PROUVÉ. Les 6 tâches « accomplies » envoyées sont toujours les
six plus anciennes (« Projet React créé »…), pas les plus récentes.

Autres constats, tous PROUVÉS :
- Sur iPhone, les trois panneaux Claude sont masqués (`display:none!important`, 835, 857, 941-942). Mesuré en 390×844.
- L'historique d'un monde est enregistré mais jamais réaffiché : `renderChatHistory` (4195) n'est appelée nulle part.
  En revenant dans un monde, l'écran est vide alors que Claude reçoit encore les anciens messages.
- Les suggestions par monde (`w.suggestions`) ne s'affichent jamais : `cp-sugs-world` (1279) n'est jamais rempli.
- Le briefing automatique (`autoWorldBriefing`, 2632) n'est jamais appelé.
- Cockpit : la réponse arrive sans aucun contexte de projet, et utilise `CUR.wid` au lieu du monde du cockpit (3531).
- War Room : la question part dans le panneau du monde, caché derrière la War Room (3523). PROBABLE.
- Le texte de Claude est nettoyé avant affichage (`mdSafe`, 2437-2441). Bon point.

Verdict : TRANSFORMER. Une seule entrée « Demander à Claude » par espace, avec le vrai contexte (cap, point d'étape,
prochaine étape, bloquants, pensées récentes). Les rôles Santé et Juridique sont à réécrire et à poser côté serveur.

## A.7 Socle

| Élément | Où | Ce que ça fait | Saisie | Verdict | Raison |
|---|---|---|---|---|---|
| Écran de connexion | HTML 1642-1671 ; styles 749-765 ; code 1743-1858 | E-mail, code à 6 chiffres ou lien, « Continuer sans connexion », « cet appareil fait foi » | E-mail et code | GARDER | Récent, testé, messages clairs. Seul point : `shouldCreateUser:false` (1803) et le mot « Rayan » en commentaire. |
| Synchronisation | 1706-1735 ; 1860-1955 | Une ligne par compte, envoi 1,5 s après une action, lecture au retour au premier plan | Non | GARDER, règle à changer | Voir C.6 : la règle de conflit ne tient pas avec des dépôts depuis deux appareils. |
| État `S`, chargement, enregistrement | 2337-2431 | Lit et écrit `localStorage` | Non | GARDER, forme à changer | Voir C. |
| Export / import JSON | `exportData` 3382-3389 ; `importData` 3391-3403 ; 3716 | Sauvegarde et restauration | Non | GARDER, à durcir | L'import fusionne sans contrôle ni migration (3397). Voir C.6. |
| Proxy Claude | `supabase/functions/ARC-CLAUDE-PROXY/index.ts` | Relaie vers Anthropic pour le seul compte autorisé | Non | GARDER, à étendre | Voir D.6. |
| Service worker, manifeste, icônes | `sw.js` ; `manifest.json` ; 4255-4261 | Installation sur l'écran d'accueil, secours hors ligne | Non | GARDER | Voir D.4. Le manifeste dit « Rayan » en dur (`manifest.json:4`). |
| Utilitaires | `mdSafe`, `esc`, `uid`, `toast`, `fmtTs` 2437-2447 | Nettoyage, échappement, messages | Non | GARDER | Petits et justes. |

## A.8 Code jamais appelé ou cassé (liste complète relevée)

Jamais appelé : `autoWorldBriefing` (2632), `fmtDate` (2446), `initClaude` (4192), `renderChatHistory` (4195),
`renderSanteHistory` (3044), `resetPomoWR` (3988) : six fonctions, une seule occurrence chacune (vérifié par `grep`).
Appelée pour rien : `tickClock` (2452), dont la cible `h-clock` n'existe pas.
Variables sans usage : `intelRefreshed` (4039), `CUR.sug`, `CUR.intel` jamais rempli (2577), `S.sessions`,
`S.notifEnabled`, `S.deadlines`, `S.taskOrder`.
Cassé : `searchQuery` absent (3683) ; accueil d'arrivée (4238) ; `dr-add-blocker` (3901) ; briefing War Room (3845) ;
« Notifications bientôt disponibles » (3448) sans bouton correspondant dans la page.

---

# B. Tableau des écarts avec `docs/VISION.md`

| Point de la vision | État | Preuve |
|---|---|---|
| 1. Déposer une pensée **par la voix** | ABSENT | Aucune occurrence de `SpeechRecognition`, `getUserMedia`, `MediaRecorder` dans `index.html` (recherche faite, zéro ligne). |
| 1. Déposer une pensée **par le texte**, sans rien ranger | ABSENT | Les seuls champs libres sont liés à un monde choisi à la main : ajout rapide (1087, 3704-3711), notes (1230), journal (1238). Pas de boîte de dépôt commune. |
| 2. Elle ne se perd jamais | PARTIEL | Ce qui est saisi est gardé en local et synchronisé (2408-2427, 1867). Mais : un conflit entre appareils remplace tout l'état (1932-1934) ; le journal n'affiche que 20 entrées (2787) ; rien ne ramène une note vers Rayan. |
| 3. La tête ne garde que le nécessaire | ABSENT | Aucun écran ne dit « voici la seule chose à faire maintenant ». L'accueil montre des compteurs (1061-1066). |
| 4. L'IA range la pensée | ABSENT | Aucun appel à Claude ne classe quoi que ce soit. Les quatre appels sont des discussions (A.6). |
| 4. L'IA la relie au bon projet | ABSENT | Idem. Le monde est choisi par des boutons (`renderQA`, 2565). |
| 4. L'IA la développe et dit quoi en faire | PARTIEL | Possible seulement en posant la question soi-même dans le panneau du monde (4167). Rien n'est transformé en étape. |
| Plus rien en dur (nom, ville, mondes, contenus) | ABSENT | `WORLDS` 1969-2298 (38 011 caractères) ; `POLES` 2301-2327 ; `JUR_SECTIONS` 3159 ; « Rayan » sur 14 lignes et « Valence » sur 61 lignes d'`index.html` ; « Sept espaces » 1058 ; « 5 » 1062. |
| Geste central : pensée rangée, avec une étape précise et un moment | ABSENT | Pas d'objet « pensée ». Pas de champ « moment » sur une tâche (`{id, t}`, 3601). |
| La valeur est dans le retour : point du matin | ABSENT | L'accueil affiche seulement « Matin / Après-midi » et la date (2483-2486). `autoWorldBriefing` n'est jamais appelé. |
| Retour : revue de la semaine | ABSENT | Aucun code. |
| Projets et « Ma vie » séparés | PARTIEL | Deux sections distinctes sur l'accueil (1069-1084) et des écrans à part (S3, S4). Mais même style sombre, pas plus calme. |
| Santé limitée à mémoire, échéances, documents, préparation de rendez-vous | ABSENT (c'est l'inverse) | Suivi quotidien à curseurs, score, série, tendances, « conseiller santé » (A.5). Seul le journal santé est conforme (3070). |
| Juridique limité de la même façon | PARTIEL | Éléments avec échéance et chronologie : conforme (3196-3322). « Conseiller juridique » et suggestions de statut : non conforme (3377, 1580-1584). Pas de documents. |
| Jamais d'avis médical ni juridique | ABSENT | Rôles système 3154 et 3377. Un avertissement existe côté Juridique seulement (1577). |
| iPhone et Mac à égalité, deux mises en page | PARTIEL | Des règles pour petits écrans existent (8 blocs `@media`, dont 801, 880, 897). Mais Claude est masqué sur iPhone (835, 857) et l'audit mesure 42 zones tactiles trop petites sur 63. |
| Projet endormi, réveiller ou archiver | ABSENT | Aucun état de projet. `S.lastActive` (2626-2628) garde l'ordre des 5 derniers mondes ouverts, sans date. |
| Feuille de route Fait / Maintenant / Ensuite / Cap | PARTIEL | Matière présente mais en dur et éclatée : `tasks_done` (Fait), `priority` (Maintenant), `nextActions` (Ensuite), `mission` (Cap). Pas d'écran, pas de données modifiables. |
| Le cap du projet | PARTIEL | `w.mission`, en dur (2668). |
| Point d'étape daté | ABSENT | `w.desc` contient une date dans le texte (« Au tour 113 (4 octobre) », 1974), en dur. |
| Prochaine étape, une seule, avec un moment | PARTIEL | « Action prioritaire » en dur (2671) et étoile « focus » (3463). Aucun moment. |
| Ce qui bloque | PARTIEL | Liste en dur + ajouts (2759). Sans date, sans état, sans suppression. |
| Les pensées déposées dans le monde | PARTIEL | Notes et journal du monde (3685, 3593), saisis à la main dans le monde. |
| Claude présent avec ce contexte | PARTIEL | Présent sur Mac avec 1 708 caractères de contexte en dur (A.6). Absent sur iPhone. |
| Design clair, niveau Apple | ABSENT | Thème noir unique (23-24). Aucune règle `prefers-color-scheme` ni `prefers-reduced-motion` (0 occurrence). 136 tailles de police sur 298 sont sous 12 px. |
| Pas de séries de jours ni de notifications culpabilisantes | ABSENT | Série Santé (2920) ; « Check-in du jour manquant » (2512) ; « Résous maintenant. » (2493). |

**Réponses directes aux cinq questions.**
- Entrée vocale ? Non. PROUVÉ (zéro occurrence).
- Boîte de dépôt libre ? Non. PROUVÉ. Le plus proche est l'ajout rapide, qui exige de choisir un monde.
- Planification ou « moment » sur une tâche ? Non. PROUVÉ. Une tâche est `{id, t}`.
- Dates d'échéance ? Sur les tâches : non (`S.deadlines` jamais écrit). Dans Juridique : oui (3254, 3557).
- Code de notification ? Non. Ni `Notification`, ni `PushManager`, ni `showNotification`. Seul un message « bientôt
  disponibles » (3448). Le service worker n'a pas de gestion `push` (`sw.js`, 35 lignes lues).

---

# C. Modèle de données (Partie 3b)

## C.1 Où vit quoi aujourd'hui

- **En dur dans le code** : tout le contenu des mondes (`WORLDS`, 1969-2298), la description des pôles (`POLES`),
  les rubriques juridiques (`JUR_SECTIONS`), la veille (`INTEL_STATIC`), les 4 habitudes par défaut (3081-3086).
- **Dans `S`** : ce que Rayan coche ou ajoute, rangé par **numéro de monde** (0 à 4) ou par nom de pôle.
- **Sur l'appareil** : `localStorage`, clé `arc_v2` (2338, 2416). Taille mesurée d'un état vierge : 2 894 caractères.
- **En ligne** : table `arc_data`, une ligne par compte : `{ user_id: texte, state: tout S en JSON, updated_at }`
  (1706-1708, 1874-1876). Trois règles « chacun sa ligne » (`CLAUDE.md`). Non vérifié en base (interdit ici).

Le numéro de monde est la position dans `WORLDS` (« l'`id` est l'index », `CLAUDE.md`). C'est fragile : Trading
était le n° 4, ATLAS est maintenant le n° 4. Il a fallu `migrateWorlds` (2344-2354) pour ne pas mélanger les deux.

Ce que contient un monde dans `WORLDS` (mesuré) : `id, icon, name, color, wbg, cat, tags, desc, mission,
priority{num,title,detail,badge}, tasks_done[{id,t,prompt}], tasks_todo[…], blockers[texte], nextActions[texte],
suggestions[texte], lovable, linkLabel, context`.

| Monde | Faites | À faire | Bloquants | Suivantes | Invites en dur |
|---|---|---|---|---|---|
| ARYAN | 21 | 11 | 3 | 5 | 32 (8 754 car.) |
| FBA | 0 | 9 | 3 | 4 | 9 |
| KITCHEN | 0 | 7 | 3 | 4 | 7 |
| TELENEUF | 5 | 5 | 2 | 4 | 10 |
| ATLAS | 8 | 9 | 3 | 5 | 17 |

## C.2 La forme réelle de `S`, clé par clé

Mesuré au chargement : `tasks, notes, journal, custom, blkCustom, seen, focus, _worldsV, taskNotes, chatMsgs,
deadlines, lastActive, taskOrder, notifEnabled, tools, poles, taskDates, sessions, jurNotes`.

| Clé | Forme | Écrite à | Lue à | Remarque |
|---|---|---|---|---|
| `tasks` | `{ n°monde: { idTâche: vrai/faux } }` | 2400, 3451, 3480, 3506, 3601, 3707 ; 2352 | 2462, 2527, 2717… | La coche. Vaut pour les tâches en dur et les ajouts. |
| `custom` | `{ n°monde: [ {id:"c…", t} ] }` | 3601, 3707 ; retrait 3466 | 2701, 3771 | Tâches ajoutées par Rayan. |
| `blkCustom` | `{ n°monde: [ texte ] }` | 3591 | 2465, 2759 | Bloquants ajoutés. Jamais retirés. |
| `notes` | `{ n°monde: texte }` | 3685 | 2694 | Bloc-notes du monde. |
| `journal` | `{ n°monde: [ {ts, t} ] }` | 3593, 3595, 3597, 3599, 4146-4148 ; retrait 3469 | 2466, 2784, 3959 | Contient aussi les copies « Claude: … ». |
| `taskNotes` | `{ n°monde: { idTâche: texte } }` | 3460, 3854, 3976 | 3789, 3837 | Zone de travail du cockpit. |
| `taskDates` | `{ n°monde: { idTâche: horodatage } }` | 2401 (première vue), 3451 (coche), 3601, 3707 | **jamais** | Date ambiguë : première apparition, ou dernière coche. Non mise à jour par le cockpit (3480) ni la War Room (3506). |
| `focus` | `{ n°monde: idTâche ou null }` | 3463, 2686 | 2530, 2682, 3589 | L'étoile. |
| `chatMsgs` | `{ n°monde: [ {r, t, ts} ] }` | 4227-4231 ; vidé 3513-3515 ; purge 2420-2422 | 4063, 4197 | 100 messages au plus par monde. `sante` et `juridique` ne sont jamais remplis. |
| `tools` | `{ n°monde ou "sante"/"juridique": [ {id,name,url,icon} ] }` | 3724-3726 ; retrait 3735 | 2795, 2806 | Liens. |
| `poles.sante` | `[ {date ISO, sommeil, energie, sport, mental} ]` | 3055-3057 | 2505, 2844… | Un check-in par jour, 365 au plus. |
| `poles.sante_journal` | `[ {ts, t} ]` | 3605 | 3072 | Notes de santé. |
| `poles.habitudes` | `[ {id, name, em, color} ]` | 3081, 3606 ; retrait 3569 | 3096, 3150 | Créée à la première ouverture de Santé. |
| `poles.habDone` | `{ "hab_<date>": [ idHabitude ] }` | 3090, 3113, 3616 | 3091, 3152 | Une clé de plus par jour d'ouverture, même vide (3090). Grossit sans fin. |
| `poles.objectifs` | `[ {t, done, ts} ]` | 3607, 3572 ; retrait 3575 | 3123 | |
| `poles.juridique` | `{ statut, contrats, aides, demarches : [ {t, priority, status, deadline, ts, doneDate?} ] }` | 3557, 3560 ; retrait 3563 | 3180, 3202, 3305, 3375 | Seul endroit avec une échéance. |
| `jurNotes` | texte | 3686 | 3172, 3354 | |
| `archive.trading` | objet : les anciennes clés du monde n° 4 + `mt5` | 2350 | **jamais** | Données de l'ancien monde Trading. |
| `lastActive` | `[ n°monde ]`, 5 au plus | 2626-2628 | **jamais** | |
| `seen` | date ISO | 2339, 4034 | 4238 | Toujours remplie : voir A.4. |
| `_worldsV` | nombre (2) | 2353 ; remis à 0 à 1918, 1933 | 2345 | Version des mondes. |
| `_lastAction` | horodatage | 2410 | 1929-1930 | Sert à départager deux appareils. |
| `_savedAt` | horodatage | 2412 | **jamais** | |
| `deadlines` | `{ "n°:idTâche": date }` | **jamais** | 2737 | Toujours vide. |
| `taskOrder` | `{ n°monde: [ idTâche ] }` | **jamais** | 2706 | Toujours vide. |
| `sessions`, `notifEnabled` | `[]`, `false` | 2374, 2388 | **jamais** | Sans usage. |

Autres clés de `localStorage` (hors `S`) : `arc_linked_uid` (1746), `arc_v2_avant_connexion` (copie entière de `S`,
1915), `arc_cloud_ts` (1880, jamais relue), `arc_auth_email` (1807), `arc_v1` (ancien état, lu à 2360),
`arc_uid` et `arc_key` (effacées, 1757 et 2433). `sessionStorage` : `arc_auth_skip` (1760).

## C.3 Les six fonctions qui touchent `S`

- **`loadS`** (2356-2363) : lit `arc_v2`, fusionne dans `S` ; si aucune tâche, tente `arc_v1` ; puis `normalizeS`.
- **`normalizeS`** (2366-2406) : crée les clés manquantes ; appelle `migrateWorlds` ; pour chaque monde de `WORLDS`,
  crée les cases et coche d'office les tâches de `tasks_done` (2400).
- **`migrateWorlds`** (2344-2354) : si `_worldsV < 2`, déplace tout ce qui est au n° 4 vers `S.archive.trading`,
  coche les tâches faites d'ARYAN, pose `_worldsV = 2`.
- **`saveS`** (2408-2427) : pose `_lastAction` (sauf enregistrement automatique), programme l'envoi, écrit
  `localStorage`. Si le stockage est plein : coupe les discussions à 20 messages et réessaie (2418-2425).
  Un enregistrement automatique a lieu toutes les 30 s et à la fermeture (2430-2431).
- **`pushToCloud`** (1867-1888) : envoie **tout** `S` dans la ligne du compte (`upsert`, 1874-1877). Pas de contrôle
  de ce qui est déjà en ligne.
- **`pullFromCloud`** (1895-1948) : voir C.6.

## C.4 Nouveau schéma proposé

Principes :
1. **Plus aucun numéro de monde.** Chaque objet a un identifiant texte stable (`sp_…`, `th_…`, `st_…`).
2. **Des collections rangées par identifiant** (objets, pas tableaux). Cela permet de fusionner deux appareils
   élément par élément.
3. Chaque élément porte `createdAt`, `updatedAt`, et `deletedAt` (vide tant qu'il existe). On ne supprime jamais
   vraiment : on marque. C'est ce qui rend la fusion sûre.
4. **Les mots d'origine d'une pensée ne sont jamais modifiés.** Ce que l'IA ajoute est rangé à côté.
5. Rien de propre à Rayan dans le code : nom, ville, espaces sont des données.

Vue d'ensemble de l'état, version 3 :

```json
{
  "meta":      { "schema": 3, "updatedAt": "2026-10-12T08:02:11+02:00", "migratedFrom": 2, "migratedAt": "…" },
  "settings":  { },
  "spaces":    { "sp_aryan": { } },
  "thoughts":  { "th_…": { } },
  "steps":     { "st_…": { } },
  "deadlines": { "dl_…": { } },
  "phases":    { "ph_…": { } },
  "reports":   { "rp_…": { } },
  "blockers":  { "bl_…": { } },
  "chats":     { "sp_aryan": [ ] },
  "archive":   { "trading": { }, "health": { } },
  "legacy":    { }
}
```

**Réglages** (rien en dur) :

```json
{
  "ownerName": "Rayan",
  "city": "Valence",
  "locale": "fr-FR",
  "timezone": "Europe/Paris",
  "morningPoint": { "enabled": true, "time": "08:00" },
  "weeklyReview": { "enabled": true, "weekday": 7, "time": "18:00" },
  "dormantAfterDays": 30,
  "onboardedAt": "2026-04-13T09:00:00+02:00",
  "aiConsent": { "sendToModel": true, "at": "2026-10-12T08:00:00+02:00" }
}
```

**Espace** (`kind` : `project` ou `life`) :

```json
{
  "id": "sp_aryan",
  "kind": "project",
  "name": "ARYAN",
  "tagline": "Livraison halal locale · Valence",
  "color": "#ff6b35",
  "motif": "route",
  "icon": "🚀",
  "cap": "Le premier vrai client",
  "mission": "Amener ARYAN à son premier vrai client. Pilote décidé en août : …",
  "context": "ARYAN — marketplace de livraison halal locale…",
  "tags": ["React + Vite", "Supabase", "Stripe Connect", "Vercel"],
  "links": [ { "id": "lk_1", "name": "Prod", "url": "https://aryan-drab.vercel.app", "icon": "🔗" } ],
  "status": "active",
  "statusSince": "2026-10-04T00:00:00+02:00",
  "lastActivityAt": "2026-10-04T22:10:00+02:00",
  "order": 0,
  "template": null,
  "legacyWid": 0,
  "createdAt": "…", "updatedAt": "…", "deletedAt": null
}
```

`status` : `active`, `dormant`, `archived`. Un espace « Ma vie » : `"kind": "life"`, `"template": "health"` ou
`"legal"`, `"cap": null`, pas de phases. « Endormi » se calcule (`lastActivityAt` plus vieux que
`dormantAfterDays`) puis se propose ; il ne devient un état qu'après un geste de la personne.

**Pensée** :

```json
{
  "id": "th_01JB2Q7K3M",
  "text": "Il faut que je recale Atlas avec la réalité : l'immatriculation, les pages légales et l'achat en mode test.",
  "source": "voice",
  "audioRef": null,
  "photoRef": null,
  "device": "iphone",
  "createdAt": "2026-10-05T21:14:03+02:00",
  "updatedAt": "2026-10-05T21:14:09+02:00",
  "deletedAt": null,
  "status": "filed",
  "spaceId": "sp_atlas",
  "filedBy": "ai",
  "filedAt": "2026-10-05T21:14:09+02:00",
  "confirmedByUser": false,
  "ai": { "summary": "Recaler Atlas : 3 points à vérifier", "model": "…", "at": "2026-10-05T21:14:09+02:00" },
  "stepIds": ["st_01JB2Q7M1A", "st_01JB2Q7M1B", "st_01JB2Q7M1C"],
  "deadlineIds": [],
  "lastSurfacedAt": null,
  "legacy": null
}
```

`source` : `voice`, `text`, `photo`. `status` : `inbox` (déposée, pas encore rangée), `filed` (rangée),
`done` (toutes ses étapes sont closes), `dropped` (écartée par la personne). `text` reste tel que dit ou tapé.
`audioRef` et `photoRef` sont des références : le son et l'image ne vont pas dans l'état (trop lourds).
`lastSurfacedAt` sert à la garantie « rien ne dort ».

**Étape** (la prochaine action, avec son moment) :

```json
{
  "id": "st_01JB2Q7M1A",
  "spaceId": "sp_atlas",
  "text": "Vérifier où en est l'immatriculation",
  "moment": { "type": "situation", "text": "Demain, en ouvrant le Mac", "notBefore": "2026-10-06" },
  "person": null,
  "status": "todo",
  "doneAt": null,
  "isNext": true,
  "phaseId": "ph_atlas_now",
  "origin": "thought",
  "originThoughtId": "th_01JB2Q7K3M",
  "proposedBy": "ai",
  "acceptedByUser": true,
  "work": "",
  "order": 1,
  "legacy": null,
  "createdAt": "…", "updatedAt": "…", "deletedAt": null
}
```

`moment` a trois formes : `null` (pas encore fixé), `{ "type": "datetime", "at": "2026-10-07T10:00:00+02:00" }`,
ou `{ "type": "situation", "text": "…", "notBefore": "…" }`. L'étude du besoin dit qu'une situation marche mieux
qu'une date. `status` : `todo`, `done`, `dropped`. `origin` : `thought`, `user`, `ai`, `seed`. `work` est l'ancienne
zone de travail du cockpit. Une seule étape par espace a `isNext: true`.

**Échéance** :

```json
{
  "id": "dl_01JB3A0001",
  "spaceId": "sp_juridique",
  "title": "Déclaration de chiffre d'affaires",
  "dueOn": "2026-10-31",
  "dueTime": null,
  "status": "open",
  "doneAt": null,
  "remindDaysBefore": [7, 1],
  "category": "demarches",
  "priority": "haute",
  "sourceUrl": null,
  "setBy": "user",
  "originThoughtId": null,
  "createdAt": "…", "updatedAt": "…", "deletedAt": null
}
```

`status` : `open`, `done`, `cancelled`. `setBy` vaut toujours `user` pour une date légale : l'IA ne fixe jamais une
date de sa mémoire (étude du besoin). `sourceUrl` reçoit le lien officiel.

**Phase de feuille de route** :

```json
{
  "id": "ph_aryan_now",
  "spaceId": "sp_aryan",
  "column": "now",
  "title": "Le dernier mètre",
  "detail": "Essai « Ma boutique », puis réponses Q1-Q4.",
  "order": 1,
  "createdAt": "…", "updatedAt": "…", "deletedAt": null
}
```

`column` : `done` (Fait), `now` (Maintenant), `next` (Ensuite). La colonne « Cap » n'est pas une phase : elle
affiche `space.cap`. Une seule source pour le cap. Les étapes pointent vers leur phase par `phaseId`.

**Point d'étape** :

```json
{
  "id": "rp_aryan_2026-10-04",
  "spaceId": "sp_aryan",
  "date": "2026-10-04",
  "text": "Tour 113 en production. 928 tests verts, 387 dettes numérotées et suivies.",
  "source": "seed",
  "done": ["Métier affiché dans Ma boutique"],
  "next": ["Essai Ma boutique", "Réponses Q1-Q4"],
  "figures": { "tests": 928, "dettes": 387 },
  "createdAt": "…", "updatedAt": "…", "deletedAt": null
}
```

`source` : `user` (écrit ou collé), `claude-code` (publié par une session du projet), `ai` (résumé proposé),
`seed` (repris de l'ancien code). Compatible avec le format de `docs/AUDIT.md` §4.2.

**Bloquant** :

```json
{
  "id": "bl_aryan_1",
  "spaceId": "sp_aryan",
  "text": "Quatre courses payées et capturées attendent un livreur (#284)",
  "since": null,
  "status": "open",
  "resolvedAt": null,
  "origin": "seed",
  "originThoughtId": null,
  "createdAt": "…", "updatedAt": "…", "deletedAt": null
}
```

**Discussions** : `chats[spaceId] = [ { "r": "user", "t": "…", "ts": 1759600000000 } ]`, forme actuelle gardée.

## C.5 Plan de migration, champ par champ (version 2 vers version 3)

**Étape 0 — sauvegarde, avant toute écriture.**
1. Sur l'appareil : le nouvel état s'écrit sous une **nouvelle clé** `arc_v3`. La clé `arc_v2` n'est ni modifiée ni
   effacée. Elle reste la sauvegarde. `arc_v2_avant_connexion` reste aussi.
2. Proposer une fois le téléchargement du fichier JSON actuel (`exportData`, 3382).
3. En ligne : avec l'accord de Rayan, copier la ligne `arc_data` vers `arc_data_archive` avant la première écriture
   en version 3. C'est une requête SQL à lancer par Rayan (la table d'archive est fermée aux comptes).
4. L'état version 3 garde `legacy.v2Keys` : les clés non reprises ailleurs, telles quelles.

**Étape 1 — identifiants déterministes.** La migration fabrique les mêmes identifiants sur chaque appareil :
`sp_aryan`, `st_w0_a22` (monde 0, tâche `a22`), `st_w0_c8f3k2aa` (tâche ajoutée), `bl_w0_seed_1`, `bl_w0_user_2`,
`th_w0_j_1759600000000` (entrée de journal, par son horodatage). Ainsi, migrer deux fois, ou sur deux appareils,
donne le même résultat, sans doublon.

**Étape 2 — correspondance.**

| Source (v2) | Destination (v3) | Détail |
|---|---|---|
| `WORLDS[n].name, icon, color` | `spaces.sp_*` | `wbg` (fond sombre) part dans `legacy` : le thème change. |
| `WORLDS[n].cat` | `space.tagline` | |
| `WORLDS[n].tags` | `space.tags` | |
| `WORLDS[n].mission` | `space.mission` (texte entier) et `space.cap` (première phrase) | Le cap court est à valider par Rayan. |
| `WORLDS[n].desc` | `reports.rp_*_seed` (`source: "seed"`) | Date : 4 octobre 2026 pour ARYAN ; « avril 2026 » pour FBA, KITCHEN, TELENEUF (`CLAUDE.md`). |
| `WORLDS[n].context` | `space.context` | Sert à Claude en attendant de vrais points d'étape. |
| `WORLDS[n].priority` | une phase `now` + l'étape marquée `isNext` | `badge` et `num` dans `legacy`. |
| `WORLDS[n].tasks_done` / `tasks_todo` | `steps.st_w{n}_{id}`, `origin: "seed"` | `status` vient de `S.tasks[n][id]`, pas de la liste : c'est la coche de Rayan qui fait foi. |
| `task.prompt` (75 invites) | `step.legacy.prompt` | Gardées, plus affichées. |
| `WORLDS[n].nextActions` | phases `next`, une par ligne | |
| `WORLDS[n].blockers` | `blockers.bl_w{n}_seed_{i}`, `origin: "seed"`, `since: null` | Pas de date connue : ne pas en inventer. |
| `WORLDS[n].suggestions` | `legacy.seed.suggestions` | Jamais affichées aujourd'hui. |
| `WORLDS[n].lovable`, `linkLabel` | `space.links[0]` | |
| `S.tasks[n][id]` | `step.status` (`done` si vrai) | |
| `S.custom[n][]` | `steps`, `origin: "user"` | Les tâches ajoutées par Rayan. |
| `S.taskDates[n][id]` | `step.doneAt` si faite, sinon `step.createdAt` ; valeur brute dans `step.legacy.taskDate` | Date peu fiable (C.2) : marquer `legacy.dateApprox: true`. |
| `S.taskNotes[n][id]` | `step.work` | Zone de travail. |
| `S.focus[n]` | `step.isNext = true` | Si absent : la première étape `todo`. |
| `S.taskOrder[n]` | `step.order` | Vide en pratique. |
| `S.deadlines["n:id"]` | `step.moment = {type:"datetime"}` | Vide en pratique. |
| `S.blkCustom[n][]` | `blockers.bl_w{n}_user_{i}`, `origin: "user"` | |
| `S.notes[n]` | une pensée `th_w{n}_notes`, `source: "text"`, `legacy.from: "notes"` | Le texte entier, sans découpe. `createdAt` = date de migration, marqué approximatif. |
| `S.journal[n][]` sans préfixe « Claude: » | pensées `th_w{n}_j_{ts}`, `createdAt = ts`, `legacy.from: "journal"` | Ce sont des mots de Rayan : ils deviennent les « pensées déposées » de l'espace. |
| `S.journal[n][]` avec préfixe « Claude: » | `legacy.aiCaptures[spaceId]` | Texte de machine : ne pas le mêler aux pensées. |
| `S.chatMsgs[n]` | `chats[spaceId]` | Tel quel. |
| `S.tools[n]`, `S.tools.sante`, `S.tools.juridique` | `space.links` | |
| `S.lastActive` | `space.lastActivityAt` impossible (pas de date) ; garder dans `legacy` | |
| `POLES` | `spaces.sp_sante`, `spaces.sp_juridique`, `kind: "life"` | `desc` et `context` réécrits (plus de « conseiller »). |
| `S.poles.sante[]` (check-ins) | `archive.health.checkins` | Fonction retirée, données gardées et exportables. |
| `S.poles.habitudes`, `habDone` | `archive.health.habits`, `archive.health.habitsDone` | Idem. |
| `S.poles.objectifs[]` | `steps` de `sp_sante`, `origin: "user"` | `done` → `status`. |
| `S.poles.sante_journal[]` | pensées de `sp_sante`, `createdAt = ts` | La chronologie de santé. |
| `S.poles.juridique[rubrique][]` avec `deadline` | `deadlines`, `category = rubrique` | `status: done` → `done`, `doneDate` → `doneAt`. `progress` gardé dans `legacy.status`. |
| `S.poles.juridique[rubrique][]` sans `deadline` | `steps` de `sp_juridique`, `legacy.category = rubrique` | |
| `S.jurNotes` | une pensée de `sp_juridique`, `legacy.from: "jurNotes"` | |
| `S.archive.trading` | `archive.trading` | Copie exacte, non touchée. |
| `S.seen` | `settings.onboardedAt` | |
| `S._lastAction`, `_savedAt`, `_worldsV` | `legacy.v2Meta` | `meta.updatedAt` prend le relais. |
| `S.sessions`, `S.notifEnabled` | `legacy.v2Keys` | Sans usage, gardés quand même. |
| « Rayan », « Valence » en dur | `settings.ownerName`, `settings.city` | Remplis par la migration pour ce compte ; demandés à un nouveau compte. |

**Étape 3 — contrôle.** Après migration, compter et comparer : nombre d'étapes = tâches en dur + ajouts ; nombre de
coches identique ; nombre d'entrées de journal = pensées + captures ; nombre d'éléments juridiques = échéances +
étapes. Afficher le résultat à Rayan (« 75 étapes, 32 faites, 0 perdue »). Si un compte ne tombe pas juste : ne rien
écrire, garder la version 2.

**Étape 4 — le contenu d'amorçage.** Le contenu de `WORLDS` n'est plus dans le code de l'application. Il vit dans un
fichier `js/data/seed-v2.json` lu seulement par la migration. Un nouveau compte part de zéro.

**Ce qui arrive sur un appareil qui synchronise un ancien état.** Trois cas.

1. *L'appareil a le nouveau code et un état version 2 local.* Il migre sur place (étapes 0 à 3), puis lit la ligne
   en ligne. Si elle est en version 3 : fusion élément par élément (C.6). Les identifiants déterministes évitent
   les doublons. Rien n'est perdu.
2. *L'appareil a le nouveau code, la ligne en ligne est encore en version 2.* Il migre la copie en ligne en mémoire,
   la fusionne avec le local, puis écrit en version 3.
3. *L'appareil a encore l'ancien code* (onglet resté ouvert, ou hors ligne sur la copie en cache). C'est le cas
   dangereux. L'ancien code lit la ligne version 3, la fusionne en vrac dans son `S` (`Object.assign`, 1934), puis,
   à la première action, renvoie le tout avec un `_lastAction` récent (1874). Les collections version 3 qu'il
   renvoie sont celles qu'il avait lues, donc anciennes. Avec la règle actuelle, un appareil à jour les reprendrait
   telles quelles et perdrait les pensées déposées entre-temps. PROUVÉ par lecture (1932-1934).
   Parades, à combiner :
   - le nouveau code fusionne toujours élément par élément, jamais en bloc : un vieil élément ne peut pas en
     écraser un plus récent, et un élément absent n'est pas une suppression ;
   - si la ligne lue porte un `_lastAction` plus récent que `meta.updatedAt`, c'est qu'un ancien code a écrit : le
     nouveau code rejoue la migration sur les clés version 2 de cette ligne (coches comprises) et fusionne ;
   - le jour de la bascule, recharger ARC une fois sur chacun des trois appareils. Le service worker est « réseau
     d'abord » (`sw.js:17-34`), donc un simple rechargement en ligne suffit.

## C.6 Risques

**R1 — La règle de conflit actuelle : tout ou rien, la dernière action gagne.** PROUVÉ.

```
1929  var cloudAction = (res.data.state && res.data.state._lastAction) || 0;
1930  var localAction = S._lastAction || 0;
1932  if(cloudAction > localAction + 1000) {
1934    Object.assign(S, res.data.state);        // l'état en ligne remplace chaque clé de S
1940  } else if(localAction > cloudAction + 1000) {
1941    await pushToCloud();                     // l'état local remplace toute la ligne
```

- La comparaison porte sur une seule date pour tout l'état. Il n'y a aucune fusion.
- `Object.assign` remplace chaque clé de premier niveau en entier (`tasks`, `journal`, `poles`…).
- Si les deux dates sont à moins d'une seconde : rien ne se passe.
- L'envoi (`pushToCloud`, 1867-1877) ne regarde jamais ce qui est en ligne. Il part 1,5 s après chaque action (1892),
  et aussi au retour du réseau (1954), sans lecture préalable.
- **Ouvrir un monde ou un pôle compte comme une action** : `enterWorld` appelle `saveS()` (2629), `enterPole` aussi
  (2828). `saveS` pose alors `_lastAction` à maintenant (2410) et programme un envoi (2413).

Scénario de perte, PROBABLE (lecture du code, non rejoué) : ARC est resté ouvert sur le Mac. Rayan dépose trois
pensées sur l'iPhone. Il revient au Mac sans changer de fenêtre (pas d'événement `visibilitychange`, donc pas de
lecture, 1951-1953) et clique sur un monde. Le Mac envoie son état, plus ancien. Les trois pensées sont écrasées en
ligne. À la prochaine lecture, l'iPhone voit un état « plus récent » et les perd aussi.

Autre scénario : un appareil hors ligne revient. L'événement `online` déclenche un envoi direct (1954).

**R2 — Ce qu'il faut pour des pensées déposées depuis deux appareils.**
1. Des éléments avec identifiant unique créé sur l'appareil, et `updatedAt` par élément (C.4).
2. Une **fusion par élément** à la lecture : union des deux côtés ; pour un même identifiant, le `updatedAt` le plus
   récent gagne ; une suppression est une marque (`deletedAt`), jamais une absence.
3. Une **lecture avant chaque écriture**, ou mieux une écriture conditionnelle : « mets à jour la ligne seulement si
   `updated_at` vaut encore la valeur que j'ai lue ». Si zéro ligne modifiée : relire, fusionner, réessayer. La
   colonne `updated_at` existe déjà ; aucun changement de table n'est nécessaire pour cela. PROBABLE (à tester).
4. Ne plus compter l'ouverture d'un écran comme une action.
5. Une file d'attente locale pour les dépôts faits hors ligne : la pensée est d'abord écrite sur l'appareil, puis
   envoyée. Elle n'attend jamais le réseau ni l'IA pour être « déposée ».
6. Plus tard, si le volume ou le nombre de comptes monte : une ligne par élément (table `arc_items` : `user_id`,
   `id`, `kind`, `data`, `updated_at`, `deleted_at`) au lieu d'un seul bloc. Demande l'accord de Rayan et de
   nouvelles règles d'accès. Pas nécessaire pour commencer.

**R3 — Taille du stockage local.** `localStorage` est limité à environ 5 Mo par site. SUPPOSÉ (valeur usuelle des
navigateurs, non mesurée ici). État vierge mesuré : 2,9 Ko. Une pensée rangée pèse environ 600 caractères en JSON.
À 10 pensées par jour : environ 2 Mo par an, auxquels s'ajoutent les discussions (100 messages par espace) et la
copie `arc_v2_avant_connexion`. La limite serait atteinte en un à deux ans. Aujourd'hui, quand le stockage est
plein, le code coupe les discussions et réessaie une fois ; si cela échoue encore, l'enregistrement est perdu avec
un simple avertissement dans la console (2418-2425). PROUVÉ.
Conséquences : garder le son et les photos hors de l'état ; sortir de la vue ce qui est clos ; prévoir le passage
à IndexedDB (stockage du navigateur sans cette limite) avant d'atteindre 1 Mo. De plus, tout l'état est réécrit à
chaque enregistrement et renvoyé en entier à chaque envoi : plus il grossit, plus chaque dépôt coûte.

**R4 — Stockage effacé par iOS.** Safari peut effacer les données d'un site non utilisé depuis sept jours, sauf pour
une application installée sur l'écran d'accueil. SUPPOSÉ (comportement connu de Safari, non vérifié ici). La copie
en ligne protège si la connexion est active. Sans connexion (« Continuer sans connexion »), rien ne protège.

**R5 — L'import écrase sans contrôle.** `importData` fait `Object.assign(S, data)` puis enregistre (3397-3398), sans
`normalizeS`, sans regarder la version. Un fichier d'avant octobre remettrait les données Trading au n° 4, donc
dans ATLAS, car `_worldsV` reste à 2 si le fichier ne le contient pas. PROBABLE. Le nouvel import doit lire la
version, migrer, montrer un résumé et demander confirmation.

**R6 — Un seul bloc JSON par compte.** Une erreur d'écriture touche tout. Pas d'historique : `arc_data` n'a qu'une
ligne par compte et pas de règle de suppression ni de versions (`CLAUDE.md`). Une sauvegarde quotidienne de la
ligne (côté serveur) serait une ceinture de sécurité simple. À décider avec Rayan.

**R7 — Données de santé envoyées au modèle.** `santeCpSend` envoie les chiffres du jour (3147-3154). Avec un champ
de dépôt unique, une pensée de santé partira au modèle avant tout tri. Le réglage `aiConsent` du schéma sert à cela.

---

# D. Technique (Partie 3f) et choix reconstruire ou retoucher

## D.1 Mesures

| Mesure | Valeur | Source |
|---|---|---|
| Taille d'`index.html` | 294 028 octets, 4 264 lignes | `wc`, script |
| CSS | lignes 20-1035, soit 1 014 lignes, 88 Ko | script |
| HTML | lignes 1037-1700, soit 663 lignes, 41 Ko | script |
| JavaScript | lignes 1702-4263, soit 2 560 lignes, 163 Ko | script |
| dont données en dur `WORLDS` + `POLES` + veille | lignes 1969-2334, 43,5 Ko (27 % du JavaScript) | script |
| Fonctions nommées | 104 | script (`function nom`) |
| Fonctions anonymes | 163 | script |
| Variables globales | 28 déclarations au premier niveau | `grep` |
| `getElementById` | 247 appels | script |
| Minuteurs `setInterval` | 6 | script |
| Fenêtres `prompt()` / `confirm()` | 3 / 1 | 3720-3723, 1831 |
| `<div` / `</div>` | 533 / 533 | script |
| Tests | aucun fichier de test, pas de `package.json` | `git ls-files` (20 fichiers) |

**Gestion des clics.** Deux styles mélangés. Un écouteur unique de 245 lignes sur le document (3406-3651) qui teste
tour à tour des `data-action` (36 valeurs différentes) et des identifiants. Et 25 attributs `onclick` / `oninput`
écrits dans le HTML (par exemple 1376, 1415-1424, 1483-1487, 1516-1517, 1537-1538, 1580-1584), plus 2 dans du HTML
fabriqué par le code (2798, 2810). Plusieurs actions sont traitées deux fois (habitudes et objectifs : 3564-3575
puis 3608-3641 ; la seconde copie n'est jamais atteinte).

**Scripts et ressources externes.** PROUVÉ (lignes 15-19, 1701, et liste des requêtes bloquées pendant le test).

| Ressource | Version | Figée ? | Contrôle d'intégrité (SRI) |
|---|---|---|---|
| `marked` (cdnjs) | 9.1.6 | Oui | Non |
| `DOMPurify` (cdnjs) | 3.1.6 | Oui | Non |
| `supabase-js` (jsDelivr) | `@2` | **Non** : dernière version 2.x à chaque chargement | Non |
| Google Fonts, 4 familles | — | — | — |

`supabase-js` gère la connexion et le jeton de session. Une version non figée, sans contrôle d'intégrité, chargée
depuis un tiers, est le point le plus sensible de la page. Les polices : deux familles sur quatre sont presque
inutilisées (`docs/AUDIT.md` §2).

**Rendu.** Par fabrication de chaînes HTML puis `innerHTML` : 38 affectations `innerHTML`, 95 `textContent`,
11 `createElement`. La fonction d'échappement `esc` est appelée 37 fois. Le texte de Claude passe par `mdSafe`
(DOMPurify), 3 appels.

**Interpolations non échappées.** PROUVÉ pour la présence ; le risque dépend de la source.

| Ligne | Valeur insérée sans `esc` | Source | Risque |
|---|---|---|---|
| 3100 | `h.em` (pictogramme d'habitude) | `S.poles.habitudes` | Réel si `S` vient d'un fichier importé ou d'un état en ligne modifié : du HTML s'exécuterait. |
| 3098 | `h.color`, `h.id` dans des attributs | `S` | Idem. |
| 3237 | `item.priority` | `S.poles.juridique` | Idem (valeur normalement issue d'une liste). |
| 3231 | `item.status` dans un nom de classe | `S` | Idem. |
| 2746-2753, 3894, 3923 | `t.id` dans des attributs | `S.custom` | Idem. |
| 2798, 2810 | `tool.url` : échappée, mais un lien `javascript:` est accepté | saisi par `prompt()` | Faible, auto-infligé. |
| 2517, 2545, 2570, 2583-2585, 3213, 3807, 3883, 3919 | `p.name`, `p.desc`, `wd.icon`, `w.name`, `it.url`, `sec.title`, `w.priority.badge` | en dur dans le code | Nul aujourd'hui. Devient réel dès que les mondes sont des données. |

Aujourd'hui, `S` n'est écrit que par Rayan : le risque est faible. Il devient sérieux avec le nouveau produit, car
du texte dicté, du texte produit par l'IA et des noms d'espaces arriveront dans ces mêmes endroits. La règle à
poser dans la reconstruction : tout texte passe par `textContent` ou par une seule fonction d'échappement, sans
exception. Autre manque : aucune politique de sécurité de contenu (CSP) dans la page. PROUVÉ (`grep` : 0 occurrence
de `Content-Security-Policy`).

**Accessibilité.** PROUVÉ.
- 72 `<button>` dans le HTML, 20 dans le HTML fabriqué. Mais 21 `div` ou `span` cliquables (8 + 13) : cartes des
  mondes (2543), cartes des pôles (2517), cases à cocher des tâches (2748), texte des tâches (2750), métriques
  (1152-1164), bloquants (2763), habitudes (3098), objectifs (3125-3127), en-têtes juridiques (3211).
  Ils ne sont pas atteignables au clavier : aucun `tabindex` dans le fichier (0 occurrence).
- 2 attributs `aria-` et 5 `role`, tous dans l'écran de connexion (1647-1665).
- Un seul `<label>` dans la page (bouton Importer, 1050). Les champs n'ont pas d'étiquette reliée. Curseurs Santé
  sans nom accessible (1375-1402).
- Pas de mode clair, pas de respect de « réduire les animations » (0 occurrence de `prefers-`).
- 136 tailles de police sur 298 sont inférieures à 12 px. Contraste : voir `docs/AUDIT.md` §2.

## D.2 Service worker et hors ligne

`sw.js` (35 lignes). PROUVÉ.
- Cache `arc-v5`. À l'installation : `./`, `index.html`, le manifeste, les deux icônes (`sw.js:3-8`).
- À l'activation : efface les autres caches et prend la main tout de suite (`sw.js:11-15`).
- Pour chaque lecture (`GET`) : **réseau d'abord**, copie de la réponse en cache, y compris les scripts des tiers ;
  en cas d'échec, la copie en cache ; pour une navigation, `index.html` (`sw.js:17-34`).
- Jamais les envois, jamais rien vers `supabase.co` (`sw.js:19-21`).
- Enregistré à la fin d'`index.html` (4257-4261), sauf en `file:`.

Comportement hors ligne. Après une première visite en ligne, la page et ses scripts se rechargent depuis le cache.
PROBABLE (lecture du code ; non rejoué ici). L'état local se lit et s'écrit normalement. Claude est indisponible
(message d'erreur clair, 4073). La pastille affiche « Offline » (1955). Au retour du réseau, envoi direct (1954),
avec le risque R1. Si `supabase-js` n'a jamais été mis en cache, ARC passe en mode local et affiche « Hors ligne »
(1717-1720, 1782). Mesuré : avec le réseau bloqué, la page s'ouvre, les 5 mondes et les 2 pôles s'ouvrent, et la
seule erreur de script est celle de la recherche.

Limites pour le nouveau produit : pas de file d'attente pour les dépôts hors ligne ; pas de notification ; la
liste des fichiers à mettre en cache devra suivre le découpage en plusieurs fichiers.

## D.3 Reconstruire l'interface ou retoucher sur place : les preuves

| Question | Constat | Preuve |
|---|---|---|
| Quelle part du JavaScript dépend de `WORLDS` et de son numéro ? | Presque tout l'affichage : 28 références à `WORLDS`, 26 à `tasks_done` / `tasks_todo` hors données, dans `renderHome`, `renderCards`, `renderWorld`, `renderTasks`, `openCockpit`, `openWarRoom`, `openDrawer`, `cpSend`, `normalizeS`. | `grep` |
| Quelle part du CSS survit au nouveau design ? | Très peu : thème noir unique, variables sombres (24), polices téléchargées, 136 tailles sous 12 px. La vision demande clair, lisible, police système. | 23-24, script |
| Les écrans de la vision existent-ils ? | Non. Aujourd'hui, Écoute, Capture, Espaces, Feuille de route : aucun. | Partie B |
| Les écrans actuels sont-ils gardés ? | Sur 50 éléments inventoriés hors socle (A.1 à A.6) : 19 à supprimer, 20 à transformer, 8 à fusionner, 3 à garder mais à refaire. Aucun n'est gardé tel quel. | Partie A, comptage des verdicts |
| Le code d'affichage est-il sain ? | Recherche cassée, accueil d'arrivée jamais affiché, briefing jamais envoyé, 6 fonctions jamais appelées, actions en double, identifiant en double, écouteur de 245 lignes. | A.8 |
| Le socle est-il sain ? | Oui : connexion, lecture et écriture, proxy, service worker ont été refaits et testés le 4 octobre. | `git log` (`b97a938`), `CLAUDE.md` |
| Y a-t-il des tests pour protéger une retouche ? | Non, aucun. | `git ls-files` |
| Y a-t-il des données d'usage à préserver ? | Peu : aucun usage réel entre avril et octobre. La migration reste obligatoire mais porte sur peu de données. | `docs/VISION.md` |

**Recommandation : reconstruire l'interface, garder le socle.** L'hypothèse de travail de la vision est confirmée
par les preuves. Retoucher sur place voudrait dire réécrire chaque fonction d'affichage (toutes liées à `WORLDS`),
tout le CSS (thème), tout le HTML (écrans), dans un fichier de 4 264 lignes sans test, en traînant le code mort.
On paierait le prix d'une reconstruction, plus le risque de casser le socle au passage.

Ce que « reconstruire » ne veut pas dire : changer d'hébergement, de base, de fournisseur, ou ajouter un cadre
logiciel. Le socle reste, il est seulement déplacé dans ses propres fichiers.

**Ce qui est gardé tel quel, ou avec une retouche nommée.**

| Bloc | Lignes | Sort |
|---|---|---|
| Réglages Supabase (`SB_URL`, `SB_KEY`), `sbInit` | 1710-1735 | Tel quel. |
| Connexion : `getUID`, `isLinked`, `linkDevice`, `authSkipped`, `showAuthScreen`, `hideAuthScreen`, `authErr`, `renderAuthUI`, `authErrorText`, `authSendCode`, `authVerifyCode`, `authSignOut` | 1743-1835 | Tel quel. Retirer le mot « Rayan » des commentaires. |
| `localSummary`, `authMakeReference` | 1837-1858 | Garder ; `localSummary` à adapter au nouveau schéma. |
| `setSyncUI` | 1860-1865 | Tel quel. |
| `pushToCloud`, `schedulePush`, `pullFromCloud`, écouteurs réseau | 1867-1955 | Garder la structure (première liaison d'un appareil, 1902-1927). **Remplacer la règle de conflit** (1928-1942) par la fusion par élément et l'écriture conditionnelle. |
| `loadS`, `saveS`, enregistrement automatique | 2356-2363, 2408-2431 | Garder ; nouvelle clé `arc_v3`, appel à la migration. |
| `migrateWorlds`, `normalizeS` | 2344-2354, 2366-2406 | Gardés **dans le module de migration seulement**, pour amener un vieil état en version 2 avant de passer en 3. |
| `mdSafe`, `esc`, `uid`, `toast`, `fmtTs` | 2437-2447 | Tels quels. |
| `claudeCall`, partie réseau : jeton, appel, lecture des blocs, erreurs | 4056-4093 | Garder, en la séparant de la partie affichage (4045-4055, 4094-4163), qui est à refaire. |
| `createMsgEl`, `addChatMsg` | 4212-4231 | Tels quels. |
| `exportData`, `importData` | 3382-3403 | Garder ; l'import à durcir (R5). |
| Enregistrement du service worker | 4255-4261 | Tel quel. |
| HTML de l'écran de connexion | 1642-1671 | Tel quel ; styles 749-765 à repeindre au nouveau thème. |
| `sw.js`, `manifest.json`, icônes | fichiers | Gardés ; liste de cache et textes à mettre à jour. |
| Proxy | `supabase/functions/ARC-CLAUDE-PROXY/index.ts` | Gardé et étendu (D.6). |

Total gardé côté page : environ 370 lignes de JavaScript sur 2 560 (420 avec les deux fonctions de migration), et
30 lignes de HTML sur 663.
Tout le reste (affichage, écouteur de clics, CSS, données en dur) est réécrit ou devient des données.

## D.4 Organisation des fichiers

**Option A — sans étape de fabrication : des modules servis tels quels par GitHub Pages.**

```
index.html                 coquille : 60 à 100 lignes, <script type="module" src="js/main.js">
css/
  base.css                 variables, typographie, clair et sombre
  ecrans.css               mises en page iPhone et Mac
js/
  main.js                  démarrage, navigation entre écrans
  socle/
    supabase.js            connexion et session            (ex 1710-1858)
    sync.js                lecture, écriture, fusion       (ex 1867-1955, règle refaite)
    etat.js                S, chargement, enregistrement   (ex 2356-2431)
    fusion.js              fusion par élément (fonction pure, testable)
    claude.js              appel au proxy                  (ex 4056-4093)
    util.js                esc, mdSafe, uid, toast, dates  (ex 2437-2447)
  donnees/
    migration-v2.js        version 2 vers 3 (fonction pure, testable)
    seed-v2.json           l'ancien contenu de WORLDS, lu par la migration seulement
  ecrans/
    aujourdhui.js  depot.js  espaces.js  espace.js  route.js  vie.js  connexion.js
vendor/
  supabase.js  marked.min.js  purify.min.js     copies locales, versions figées
sw.js                      liste de tous les fichiers ci-dessus
tests/
  migration.test.js  fusion.test.js             lancés par « node --test », sans installation
  fumee.py                                      chargement Playwright : 0 erreur, écrans ouverts
```

| Pour | Contre |
|---|---|
| Rien à installer ni à lancer : on pousse, c'est en ligne. Même geste qu'aujourd'hui. | La liste de cache du service worker se tient à la main. Un oubli = un écran absent hors ligne. |
| Claude Code lit et modifie des fichiers de 100 à 300 lignes au lieu d'un de 4 264 : moins d'erreurs, revues plus faciles. | Une vingtaine de petites requêtes au premier chargement (peu gênant, mis en cache ensuite). |
| Les fonctions pures (migration, fusion) se testent avec Node seul. | Pas de vérification de types automatique (on peut poser `// @ts-check` et des commentaires de types). |
| Les modules sont pris en charge par Safari sur iPhone et Mac. SUPPOSÉ (standard ancien, non testé ici sur appareil réel). | Les bibliothèques tierces sont copiées à la main dans `vendor/` et mises à jour à la main. |
| En cas de panne, ce qui est en ligne est exactement ce qui est dans le dépôt. | Un vieux fichier en cache peut cohabiter avec un neuf ; le « réseau d'abord » limite ce risque. |

**Option B — une étape de fabrication minimale (par exemple Vite).**

| Pour | Contre |
|---|---|
| Un seul paquet optimisé, noms de fichiers uniques à chaque version, cache sans souci. | Il faut une action GitHub pour publier, ou pousser un dossier fabriqué. Une pièce de plus qui peut casser. |
| Bibliothèques gérées par un fichier de versions, TypeScript possible. | Ce qui est en ligne n'est plus ce qui est dans le dépôt : plus dur à vérifier pour quelqu'un qui ne code pas. |
| Liste de cache du service worker générée. | Node et des dépendances à installer et à tenir à jour. |

**Avis.** Option A maintenant. Elle garde ce qui marche (pousser = publier) et règle le vrai problème (un fichier
trop gros, sans test). Ajouter dès le début un petit script qui écrit la liste de cache du service worker à partir
des fichiers présents : ce n'est pas une étape de fabrication, c'est une commande à lancer avant de pousser, et un
test peut vérifier qu'elle a été lancée. Passer à l'option B seulement si le nombre de modules dépasse la trentaine
ou si TypeScript devient nécessaire. Ajouter des bibliothèques ou une étape de fabrication doit être dit à Rayan
(`CLAUDE.md`).

**Point non vérifié qui pèse sur le dépôt par la voix.** La reconnaissance vocale du navigateur sur iPhone, en
application installée sur l'écran d'accueil, est réputée peu fiable. SUPPOSÉ : non testé ici. À essayer sur le
vrai iPhone de Rayan avant de choisir entre trois voies : la dictée du clavier d'iOS dans un champ de texte (aucun
code), la reconnaissance du navigateur, ou un enregistrement envoyé à un service de transcription par le proxy.

## D.5 Ordre conseillé (technique seulement)

1. Découper le socle en modules, sans changer l'écran. Vérifier : même comportement, 0 erreur.
2. Écrire la migration et la fusion comme fonctions pures, avec leurs tests.
3. Changer la règle de synchronisation (R1, R2). Tester avec deux navigateurs sur le même compte.
4. Construire les nouveaux écrans sur le nouveau schéma, en commençant par le dépôt.
5. Retirer l'ancien fichier quand les nouveaux écrans couvrent l'usage.

Les étapes 2 et 3 touchent des données et la base : accord de Rayan avant toute écriture réelle (`CLAUDE.md`).

## D.6 Le proxy : ce qui doit changer

État actuel (`supabase/functions/ARC-CLAUDE-PROXY/index.ts`), PROUVÉ :
- un seul compte autorisé : `ARC_OWNER_ID` (74, 91-94) ;
- un seul modèle : `ALLOWED_MODELS = ["claude-sonnet-5-5"]` (14) ;
- réponse plafonnée à 1 500 jetons (17, 109) ; 40 messages au plus (18, 105) ;
- la demande transmise ne contient que `model`, `max_tokens`, `messages`, et `system` **s'il est un texte** (111-112) ;
- **aucune limite sur la taille de ce qui entre** : seul le nombre de messages est contrôlé ;
- aucun compteur, aucune trace de consommation ; la réponse d'Anthropic est renvoyée telle quelle (125-126) ;
- deux origines autorisées en dur (11) ; la session est vérifiée par un appel à Supabase à chaque demande (57).

| Besoin du produit | Ce qui manque | Changement |
|---|---|---|
| **Contexte plus large** (cap, point d'étape, bloquants, pensées récentes) | Pas de plafond d'entrée, donc pas de maîtrise du coût. `system` n'est accepté que comme texte (112) : sous forme de blocs, il serait **retiré sans avertissement**, ce qui empêche la mise en cache du contexte. | Plafonner la taille d'entrée (en caractères) et la refuser clairement au-delà. Accepter `system` en blocs. Lire `usage` dans la réponse et la consigner. Relever `MAX_TOKENS` seulement pour les appels qui en ont besoin. |
| **Rangement automatique** d'une pensée | La demande ne transmet ni outils ni format de réponse imposé (111) : impossible d'obtenir une réponse structurée fiable. Un seul modèle, coûteux pour un simple classement. Le texte de la consigne est fourni par la page, donc modifiable par quiconque a un compte. | Ajouter des appels nommés côté serveur, par exemple `tache: "ranger"` avec `{ pensee, espaces[] }`. Le proxy écrit lui-même la consigne et impose le format de sortie (espace choisi, étapes, moment proposé, degré de confiance). Autoriser un second modèle, plus rapide et moins cher, pour cet appel ; le choisir dans la liste à jour d'Anthropic. Réponse courte, plafond bas. |
| **Garde-fous Santé et Juridique** | Les rôles « conseiller santé » et « conseiller juridique » sont écrits dans la page (`index.html:3154`, `3377`). | Poser les consignes de ces deux espaces dans le proxy : mémoire, échéances, préparation ; jamais d'avis sur le cas ; renvoi vers un professionnel ; pas de date ni de montant légal sans source. La page ne peut plus les contourner. |
| **Limites par compte** | Aucun compteur. Un compte autorisé peut appeler sans fin. | Une table d'usage (compte, jour, nombre d'appels, jetons entrés et sortis), écrite par la fonction avec sa clé de service. Contrôle avant chaque relais. Refus avec le code 429 et un message lisible. Demande l'accord de Rayan (nouvelle table). |
| **Plus d'un compte, plus tard** | `ARC_OWNER_ID` unique (91). `shouldCreateUser: false` côté page (`index.html:1803`). Origines en dur (11). | Remplacer le test d'égalité par une liste de comptes autorisés (table ou attribut du compte) avec un quota par compte. Garder le refus 403 pour les autres. Origines lues dans un secret. Journal par compte, toujours sans jeton ni identifiant complet (46-48 : bonne pratique déjà en place). |
| **Robustesse** | Pas de délai maximal sur l'appel à Anthropic (116). Pas de réponse en flux. | Poser un délai et renvoyer une erreur claire. Le flux n'est utile que pour les réponses longues ; pas prioritaire. |
| **Voix par enregistrement** (si cette voie est retenue) | Aucune route pour du son. | Une fonction séparée, même contrôle de session, plafond de durée. Le fournisseur de transcription est à choisir ; non étudié ici. |

Ce qui est déjà bien et à garder : aucun secret dans le fichier (3-6) ; en-têtes CORS sur toutes les réponses,
erreurs comprises (31-38) ; erreurs marquées `source: "arc-proxy"` (41-43) ; journaux sans donnée sensible (46-48).

---

## Ce qui n'a pas pu être vérifié

- L'état réel de la table `arc_data` et de ses règles d'accès (lecture de la base interdite ici). Source : `CLAUDE.md`.
- Que le proxy déployé est bien la copie du dépôt.
- Le comportement sur un vrai iPhone et un vrai Mac : les mesures viennent de Chromium simulé, réseau coupé.
- Le hors ligne après une première visite en ligne : déduit de `sw.js`, non rejoué (il aurait fallu charger les
  scripts des tiers).
- Les scénarios de perte par synchronisation (R1) : déduits du code, non rejoués (ils demandent la base).
- La limite de 5 Mo de `localStorage`, l'effacement à sept jours par Safari, la reconnaissance vocale en
  application installée sur iPhone : connaissances générales, à tester sur les appareils de Rayan.
- La taille réelle de l'état de Rayan aujourd'hui (seul un état vierge a été mesuré : 2 894 caractères).
