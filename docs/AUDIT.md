# Audit d'ARC — 4 octobre 2026

Étude faite sur la branche `reprise-octobre` (commit `67123df`), en se mettant à la place de l'utilisateur sur Mac
(1440×900), iPad (1024×768) et iPhone (390×844). Chaque constat porte sa mesure ou son `fichier:ligne`.
Ce qui n'est pas prouvé est marqué NON ÉTABLI.

## 1. Le verdict

ARC a une belle façade et un moteur à l'arrêt. Trois faits résument l'état :

1. **ARC ne dit pas la vérité tout seul.** L'état de chaque projet est écrit à la main dans le code. Il avait six mois
   de retard, et il en reprendra dès demain : ARYAN avance d'un tour par nuit, ARC n'en sait rien.
2. **ARC ne dit pas quoi faire maintenant.** L'accueil affiche cinq cartes et des compteurs, pas une décision.
   La première tâche d'un monde est sous le pli de l'écran sur iPad et iPhone.
3. **La moitié de ce qui est affiché ne fonctionne pas** : synchronisation, Claude sur téléphone, section vide,
   pastille « Offline », badge « Erreur ».

Un outil devient indispensable quand on l'ouvre parce qu'il sait quelque chose qu'on ne sait pas encore.
Aujourd'hui ARC sait moins que Rayan. C'est ça qu'il faut inverser, avant le design.

## 2. Ce qui a été mesuré

| Mesure | Mac | iPad | iPhone |
|---|---|---|---|
| Textes de l'accueil plus petits que 12 px | 83 sur 123 | 83 sur 123 | 83 sur 121 |
| Textes de l'accueil sous le contraste lisible (4,5:1) | 59 sur 123 | 59 sur 123 | 58 sur 121 |
| Zones cliquables d'un monde plus petites que 44 px | 36 sur 47 | 31 sur 47 | 42 sur 63 |
| Première carte de monde, depuis le haut de l'accueil | 610 px | 614 px | 598 px |
| Pôles Santé et Juridique, depuis le haut de l'accueil | 1 196 px | 1 435 px | 1 916 px |
| Première tâche d'un monde (écran de 900, 768, 844 px) | 776 px | 822 px, sous le pli | 1 084 px, sous le pli |
| Champ pour écrire à Claude dans un monde | visible | visible | **absent** |

Méthode : Playwright, réseau externe coupé, état vierge. Contraste calculé selon la formule WCAG sur chaque texte visible.
Le texte secondaire `--t3` vaut `#48484a` sur fond noir (`index.html:24`), soit un contraste d'environ 2,3:1.

Autres relevés : 279 Ko dans un seul fichier ; quatre familles de polices chargées chez Google (`index.html:19`), dont
une jamais utilisée (Azeret Mono) et une utilisée une seule fois (Big Shoulders Display) ; la police à chasse fixe est utilisée 116 fois, la police de texte 10 fois ;
aucun attribut d'accessibilité (`aria-`, `role`) ; aucun mode clair ; aucune prise en compte de « réduire les animations ».

## 3. Défauts prouvés

| # | Défaut | Preuve |
|---|---|---|
| D1 | « Sept espaces. » est écrit en dur : la phrase ne suit pas le nombre de mondes | `index.html:1038` |
| D2 | La section « Tes 5 projets » est toujours vide : deux éléments portent le même identifiant `hgrid`, seul le premier est rempli | `index.html:1055`, `:1071`, `:2320` |
| D3 | Sur téléphone, Claude est inaccessible dans un monde : le panneau est masqué, et le bouton flottant et la feuille censés le remplacer n'existent pas dans la page | `index.html:816`, `:923`, `:3430` |
| D4 | Tous les mondes sont « CRITIQUE » ou « URGENCE » : la règle ne regarde que le nombre de bloquants (plus de 2 = critique). Quand tout est rouge, rien ne l'est | `index.html:2338` |
| D5 | « 14 bloquants. Résous maintenant. » additionne des bloquants écrits en dur, sans date ni propriétaire | `index.html:2290` |
| D6 | Le bouton « Code ↗ » ouvre la page d'accueil de GitHub, pas le dépôt du projet | `index.html:3369` |
| D7 | Le compteur « 00:10 » en haut d'un monde chronomètre la visite sans rien en faire | `index.html:1089` |
| D8 | L'en-tête d'un monde occupe le premier tiers de l'écran avec trois lignes de texte dans une carte de 330 px | capture Mac, monde ARYAN |
| D9 | Veille : quatre fiches écrites en dur, dont une datée « 2025 » ; « Actualiser » ne va rien chercher | `INTEL_STATIC` |
| D10 | Pastille « Offline » et badge « Erreur » sous Claude, vus par Rayan le 4 octobre sur `localhost` | captures de Rayan |

Sur D10 : le nom `zcelpyexerxlhwtfpcbf.supabase.co` ne se résout pas depuis l'outil de vérification utilisé pour cet audit.
Hypothèse : le projet Supabase est en pause (les projets gratuits sont suspendus après une période sans activité).
NON ÉTABLI : à vérifier par Rayan dans le tableau de bord Supabase. Si c'est le cas, ni la synchronisation ni Claude ne
fonctionnent sur le site en ligne non plus, et c'est le premier geste à faire.

S'y ajoutent les trois défauts de fond déjà consignés dans `CLAUDE.md` : données ouvertes, secret du proxy public,
synchronisation entre appareils inopérante.

## 4. Le modèle à revoir

### 4.1 Un monde est une donnée, pas du code

Aujourd'hui un monde est un bloc de 50 lignes dans `WORLDS`. Ajouter, renommer ou retirer un monde demande une
modification du code et une migration (`WORLDS_V`). C'est la cause directe de D1, D2, D4, D5 et du retard de contenu.

Cible : les mondes vivent dans les données de Rayan (`S.worlds`, synchronisées), avec un écran pour les gérer.

- Créer un monde : nom, couleur, symbole, phrase de mission. Le reste se remplit à l'usage.
- Archiver un monde : il quitte l'accueil, ses données restent consultables (ce qu'on a fait à la main pour Trading).
- Réordonner les mondes par glisser-déposer.
- Les pôles Santé et Juridique deviennent des espaces du même modèle, avec un gabarit propre.
- Tout ce qui compte se calcule : « Un cerveau. N espaces. », le nombre de projets, les titres de section,
  le message d'accueil. Plus aucun nombre écrit en dur.

### 4.2 La vérité vient des projets, pas de la mémoire de Rayan

Rayan passe ses journées dans des sessions Claude Code qui tiennent déjà un état écrit de chaque projet
(`docs/REPRISE.md`, `DETTES.md` pour ARYAN). ARC doit lire cet état au lieu de le faire recopier.

Cible : chaque projet publie un **point d'étape** court et structuré, et ARC l'affiche.

```json
{ "monde": "ARYAN", "date": "2026-10-04", "etat": "Tour 113 en production",
  "fait": ["Métier affiché dans Ma boutique"], "suivant": ["Essai Ma boutique", "Réponses Q1-Q4"],
  "bloquants": [{ "texte": "4 courses payées attendent un livreur", "depuis": "2026-08-13" }],
  "chiffres": { "tests": 928, "dettes": 387 } }
```

- Côté projet : une commande de fin de session (« publie le point d'étape ARC ») que la session Claude Code exécute.
- Côté ARC : une table `arc_pulse`, une ligne par monde et par date, écrite avec le compte de Rayan.
- Tant que la connexion n'existe pas : un bouton « Coller un point d'étape » dans chaque monde, même format.
- ARC affiche la **fraîcheur** de chaque monde (« mis à jour il y a 3 heures », « muet depuis 12 jours »).
  Un monde muet depuis longtemps est une information plus utile qu'un badge rouge.

### 4.3 L'urgence se mérite

Remplacer D4 et D5 par trois signaux datés : un bloquant avec sa date d'apparition, une échéance avec sa date limite,
un monde muet avec sa durée. Un seul niveau d'alerte, réservé à ce qui a une date dépassée ou proche.

## 5. Le design

Direction : le calme d'une application système d'Apple, pas un tableau de bord de salle de marché.
Ce qui s'en écarte aujourd'hui : texte minuscule en capitales espacées partout, police à chasse fixe comme police
principale, émojis en guise d'icônes, cinq couleurs vives en même temps, cartes dans des cartes.

Règles à poser, dans cet ordre :

1. **Lisibilité.** Corps de texte à 15-17 px, jamais moins de 13 px. Texte secondaire à 4,5:1 minimum (`--t3` à remonter).
2. **Une seule police**, celle du système (`-apple-system`, SF Pro sur les appareils de Rayan) : zéro téléchargement,
   rendu natif. La chasse fixe est réservée aux chiffres.
3. **Une couleur à la fois.** L'interface est neutre ; la couleur d'un monde n'apparaît que dans ce monde et sur sa carte.
   Le rouge est réservé à l'alerte datée.
4. **Des symboles dessinés** à la place des émojis, un par monde, au trait, dans un style unique.
5. **Hiérarchie par la taille et l'espace**, pas par les bordures : moins de cadres, plus de marge.
6. **Zones tactiles de 44 px** minimum, partout.
7. **Densité utile** : en entrant dans un monde, l'action prioritaire et les trois premières tâches sont visibles sans
   défiler, sur les trois tailles d'écran. L'en-tête tient en une ligne.
8. **Mode clair et mode sombre**, qui suivent le réglage de l'appareil. Animations coupées si l'appareil le demande.
9. **Mouvement sobre** : transitions courtes à ressort entre accueil et monde, rien qui pulse en permanence.
10. **Accessibilité** : navigation au clavier, lecteur d'écran, focus visible.

À faire valider par Rayan sur maquettes avant d'écrire le code : deux directions d'accueil et un écran de monde,
aux trois tailles.

## 6. Les fonctionnalités qui rendent ARC indispensable

Classées par ce qu'elles changent dans une journée de Rayan.

| Rang | Fonction | Ce qu'elle apporte | Dépend de |
|---|---|---|---|
| 1 | **Aujourd'hui** : l'écran d'ouverture | Une à trois actions pour la journée, tous mondes confondus, choisies selon les échéances, les bloquants datés et l'énergie déclarée au check-in | 4.1, 4.2 |
| 2 | **Point d'étape automatique** | ARC est à jour sans rien saisir | 4.2, connexion |
| 3 | **Connexion et synchronisation réelle** | Les mêmes données sur Mac, iPad, iPhone ; données privées | chantier connexion |
| 4 | **Capture immédiate** | Une idée ou une tâche dictée ou tapée en deux secondes, rangée dans le bon monde par Claude | rien |
| 5 | **Palette de commandes** (Cmd+K) | Tout faire au clavier : ouvrir un monde, ajouter, cocher, chercher | rien |
| 6 | **Échéances** | Dates limites administratives et techniques (immatriculation, relecture juridique, fin d'essai d'un service), avec rappel | notifications |
| 7 | **Claude qui connaît l'état réel** | Briefing du matin et bilan de la semaine fondés sur les points d'étape, pas sur du texte figé | 2, proxy |
| 8 | **Santé reliée au travail** | Le check-in ajuste la charge proposée dans « Aujourd'hui » ; tendances lisibles | 1 |
| 9 | **Juridique avec échéancier** | Chaque démarche a une date, un état, une pièce jointe ; les lettres envoyées ne se perdent plus | 6 |
| 10 | **Revue hebdomadaire** | Dix minutes le dimanche : ce qui a avancé, ce qui est muet, ce qu'on arrête | 2 |
| 11 | **Vrai hors ligne** | Tout fonctionne sans réseau, la synchronisation reprend seule | 3 |
| 12 | **Claude sur téléphone** | Corrige D3 : une feuille qui monte depuis le bas | rien |

À retirer ou à refondre : le chronomètre de visite (D7), la veille figée (D9), la section vide (D2), les invites
écrites en dur sur chaque tâche (remplacées par le contexte réel du monde), les six fonctions jamais appelées.

Point d'attention : la War Room, le Pomodoro et le cockpit par tâche existent et fonctionnent. Ils sont à garder,
mais à ranger derrière « Aujourd'hui » : on y entre depuis l'action du jour.

## 7. L'ordre des chantiers

Chaque chantier se termine par un écran que Rayan regarde avant la fusion.

| # | Chantier | Contenu | Pourquoi à cette place |
|---|---|---|---|
| 0 | **Rallumer** | Vérifier l'état du projet Supabase ; fusionner `reprise-octobre` dans `main` | Rien ne sert de bâtir sur un service éteint |
| 1 | **Connexion** | Lien magique, données privées, proxy protégé, une seule identité par appareil | Défauts de fond 1 à 3 ; préalable à tout ce qui est synchronisé |
| 2 | **Mondes en données** | `S.worlds`, écran de gestion, phrases et compteurs calculés, pôles au même modèle | Règle D1, D2, D4, D5 d'un coup ; préalable au point d'étape |
| 3 | **Socle de design** | Variables de couleur, police système, tailles, zones tactiles, mode clair, symboles | Après le modèle, pour ne dessiner qu'une fois |
| 4 | **Aujourd'hui + capture + Cmd+K** | L'écran d'ouverture et les deux gestes rapides | Le moment où ARC devient utile chaque matin |
| 5 | **Point d'étape** | Table `arc_pulse`, collage manuel, puis commande dans les sessions ARYAN et Atlas | Le moment où ARC devient vrai sans effort |
| 6 | **Échéances et Juridique** | Dates, rappels, pièces | S'appuie sur 2 et 4 |
| 7 | **Claude informé** | Briefing, revue hebdomadaire, Claude sur téléphone | S'appuie sur 5 |
| 8 | **Découpage du fichier** | Séparer styles, données et logique ; tests de rendu | Quand le modèle est stable |

Le fichier unique de 4 000 lignes tient jusqu'au chantier 3. Au-delà, chaque changement de design devient risqué :
le chantier 8 peut remonter si le chantier 3 s'avère pénible.

## 8. Décisions qui reviennent à Rayan

1. ARC reste-t-il un outil pour lui seul ? La connexion par e-mail le permet ; l'ouvrir à d'autres est un autre projet.
2. FBA, KITCHEN et TELENEUF : mondes actifs, ou à archiver comme Trading ? Leur contenu date d'avril.
3. Direction visuelle : validation sur maquettes avant le chantier 3.
4. Le point d'étape automatique écrit dans la base depuis les sessions ARYAN et Atlas : accord à donner projet par projet.

## 9. Non établi

- L'état du projet Supabase (D10).
- Ce que contient réellement la table `arc_data` et combien de lignes d'appareils différents s'y trouvent.
- Le code du proxy `ARC-CLAUDE-PROXY`, absent du dépôt.
- L'état d'Atlas depuis septembre (immatriculation, pages légales, achat en mode test).
- Le comportement sur un vrai iPhone et un vrai iPad : les mesures viennent d'un navigateur simulé.
