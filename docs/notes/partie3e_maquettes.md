# Partie 3e — Revue des neuf maquettes d'ARC (5 octobre 2026)

Revue de design et d'accessibilité des sources de `docs/maquettes/`.
Chaque constat porte une étiquette : **MESURÉ** (mesuré par script ou lu dans le code) ou **JUGEMENT** (avis d'expert).

## En bref

- La direction est bonne. Les écrans de monde (ARYAN, ATLAS) donnent vraiment l'impression d'entrer quelque part. La demande de Rayan (couleur, relief, envie) est tenue sur 7 écrans sur 9.
- Le défaut principal est la lisibilité sur la couleur. 22 textes passent sous le seuil de contraste dans leur pire zone, dont 12 sur toute leur surface. Les causes sont trois : le halo lumineux, le haut des dégradés trop clair, et le texte secondaire en teinte pâle.
- Le décor passe sur le texte. Des pastilles et des traits du motif sont posés sur des mots (4 écrans).
- Les écrans ne tiennent pas sur un vrai iPhone. Aucune marge pour l'encoche ni pour la barre d'accueil. Deux écrans débordent déjà dans le cadre 390 × 844.
- Il n'y a pas encore de système. 18 tailles de texte, 28 rayons, 19 ombres, 49 couleurs en hexadécimal et 45 en `rgba` pour neuf écrans.
- Le téléphone n'a pas de navigation. `Main` ne contient aucun lien vers `Espaces`.
- `Sante` et `Mac` sont d'une autre famille. `Sante` peut rester calme, c'est voulu. `Mac` doit être redessiné.
- Les textes se contredisent d'un écran à l'autre (« Rien ne dort » contre « Endormi depuis avril »).

## 1. Méthode et limites

**Rendu.** L'outil de maquettage (`support.js`) n'est pas disponible. J'ai construit neuf pages HTML simples dans le dossier de travail : le contenu de `<helmet>` va dans `<head>`, le reste de `<x-dc>` dans `<body>`. Rien n'a été modifié dans le dépôt. Captures faites avec Playwright (Chromium), 390 × 844 à densité 2 pour le téléphone, 1440 × 900 et 390 × 844 pour `Mac`.

**Police des titres.** MESURÉ : le lien Google Fonts ne charge pas dans ce bac à sable (`ERR_TUNNEL_CONNECTION_FAILED`, proxy 403). J'ai récupéré Bricolage Grotesque par npm (`@fontsource-variable/bricolage-grotesque` 5.3.0, fichier latin à axes `opsz` et `wght`) et je l'ai chargée en local dans mes copies. `document.fonts` répond « loaded » sur les sept écrans qui l'utilisent. Les jugements sur les titres portent donc sur la vraie police. Réserve : c'est la version fontsource, pas le fichier servi par Google ; le dessin est le même, le rendu peut varier d'un cheveu.

**Police du texte.** MESURÉ : la pile `-apple-system…` retombe ici sur Inter (Linux), pas sur San Francisco. Inter est un peu plus large. Les retours à la ligne et les débordements de quelques pixels sont à revérifier sur un iPhone et un Mac. Je le signale à chaque fois que cela compte.

**Contraste.** Pour chaque texte, j'ai rendu la page une seconde fois avec le texte invisible, puis lu les vrais pixels derrière chaque ligne de texte. Je donne trois valeurs : pire pixel, 5e centile (p5), médiane. Le pire pixel montre les collisions avec le décor. La médiane montre si tout le texte est en cause. Seuils WCAG 2.2 : 4,5:1 sous 24 px (ou sous 18,66 px gras), 3:1 au-dessus.

**Non vérifié.** Rendu réel sur iOS Safari (flou, performances, zones sûres). Dictée vocale. VoiceOver. Les maquettes sont statiques : aucun état survolé, appuyé, focus, chargement ou erreur n'existe, je ne peux donc pas les juger.

## 2. Ce que montrent les captures

| Écran | Ce qu'on voit | Première impression (JUGEMENT) |
|---|---|---|
| `Main` | Fond gris clair. Titre « Un cerveau. / Cinq projets, une vie. ». Grande carte orange « Maintenant · ARYAN » avec deux boutons. Liste « Ensuite » de trois lignes. Barre de dépôt flottante avec micro cerclé de sept couleurs. | Clair, une action forte. La liste du bas est serrée. |
| `Ecoute` | Grand disque noir avec onde, anneau de sept segments colorés, transcription en gros au centre, trois boutons en bas. | Le meilleur écran. Calme, évident. |
| `Capture` | Coche verte « C'est déposé. », citation, carte sarcelle « La première étape » avec trois moments, deux étapes « après », trois boutons de correction, « Fermer ». | Rassurant mais trop plein. |
| `Espaces` | « Cinq projets » : une grande carte ARYAN, quatre cartes colorées, puis « Ma vie » avec deux cartes blanches. Un quart de l'écran est vide en bas. | Beau, vif. Aucune barre de dépôt. |
| `Espace` | Plein écran orange, cercles concentriques, « ARYAN » en 76 px, trois compteurs en verre, carte blanche « Prochaine étape », liste en verre, barre sombre « Demander à Claude ». | Immersif. Le bas est tassé, une ligne passe sous la barre. |
| `Route` | Plein écran orange, frise verticale Fait / Maintenant / Ensuite / Cap, carte blanche au milieu, barre « 3 bloquants sur la route ». | Lisible, bonne métaphore. Le haut est trop clair. |
| `Atlas` | Plein écran sarcelle, globe en fil de fer, « ATLAS » en 76 px, trois tuiles « à confirmer », carte blanche, pensée déposée, barre. | Immersif et cohérent avec ARYAN. |
| `Sante` | Fond gris, en-tête vert pâle, trois cartes blanches avec icône. La dernière ligne est coupée en bas. | Sobre et net. Un peu administratif. |
| `Mac` | Barre latérale de 240 px, titre « Un cerveau. Sept espaces. », champ de dépôt, carte « Maintenant » blanche, liste « Ensuite », colonne de droite. | Propre mais fade. C'est un tableau de bord, pas ARC. |

## 3. Mesures

### 3.1 Tailles de texte — MESURÉ

- Aucun texte sous 12 px. Le minimum est 12 px, utilisé 21 fois (étiquettes en capitales, pastilles d'état, « à confirmer »).
- 18 tailles différentes : 12, 13, 14, 15, 16, 17, 19, 22, 23, 24, 25, 27, 28, 30, 34, 40, 44, 76.
- La « prochaine étape » existe en cinq tailles selon l'écran : 22, 23, 24, 25 et 28 px. C'est le même composant.
- 79 textes sur 188 (42 %) sont sous 15 px. La règle interne (`PSYCHOLOGIE-DESIGN.md`, section 4) dit : texte courant 17 px sur iPhone, jamais de contenu sous 15 px. Le texte courant des maquettes est à 15 ou 16 px ; le 17 px sert surtout aux boutons.
- Quatre graisses (500, 600, 700, 800), 14 valeurs d'interlettrage, 13 interlignes.

### 3.2 Contraste — MESURÉ sur les pixels rendus

Textes sous le seuil. « Partout » veut dire que la médiane est aussi sous le seuil.

| Écran | Texte | Taille | Pire | p5 | Médiane | Seuil | Cause |
|---|---|---|---|---|---|---|---|
| `Main` | Titre de la carte « Ouvrir « Ma boutique »… » | 25 px gras | 1,23 | 3,22 | 5,39 | 3 | Une pastille du décor est posée sur « et » |
| `Main` | « Ensuite » | 13 px | 3,41 | 3,50 | 3,94 | 4,5 | Partout. L'ombre orange de la carte tombe sur le libellé |
| `Main` | « Maintenant · ARYAN » | 12 px | 3,70 | 3,79 | 4,11 | 4,5 | Partout. Pâle `#FFE2CF` sur haut de dégradé `#D9480F` |
| `Ecoute` | « les pages légales… » (texte provisoire) | 27 px | 2,99 | 2,99 | 2,99 | 3 | `#8E8E93` sur `#F5F5F7`. Limite |
| `Capture` | « La première étape » | 12 px | 4,44 | 4,51 | 4,82 | 4,5 | Limite, près du halo |
| `Espace` | « Livraison halal locale · Valence » | 12 px | 1,38 | 2,13 | 3,32 | 4,5 | Partout. Texte pâle dans le halo |
| `Espace` | « En production. Il reste… » | 17 px | 1,23 | 4,48 | 5,60 | 4,5 | Pastille et pointillé du décor sur le texte |
| `Espace` | « ARYAN » | 76 px | 1,76 | 3,39 | 5,01 | 3 | Le « N » entre dans le halo. Passe au p5 |
| `Espace` | « faites », « en cours », « bloquants » | 13 px | 3,45 à 4,05 | 3,78 à 4,07 | 3,83 à 4,15 | 4,5 | Partout. Pâle sur tuile de verre |
| `Route` | « Feuille de route » | 40 px | 2,95 | 3,12 | 4,10 | 3 | Limite. Blanc sur le halo en haut à gauche |
| `Route` | « ARYAN » (en-tête) | 12 px | 3,15 | 3,21 | 3,45 | 4,5 | Partout |
| `Route` | « Fait » | 12 px | 3,44 | 3,51 | 3,64 | 4,5 | Partout |
| `Route` | « Cap : le premier vrai client. » | 16 px | 3,59 | 3,68 | 4,14 | 4,5 | Partout. Blanc sur `#D9652D` |
| `Route` | « Client, commerçant, livreur… » | 14 px | 4,25 | 4,50 | 4,87 | 4,5 | Limite |
| `Atlas` | « ATLAS » | 76 px | 1,18 | 3,87 | 5,77 | 3 | Traits du globe. Passe au p5 |
| `Atlas` | « À recaler avec la réalité… » | 17 px | 1,64 | 4,43 | 6,35 | 4,5 | Pastille turquoise posée sur « points » |
| `Atlas` | « Formation Amazon FBA » | 12 px | 1,76 | 3,27 | 4,63 | 4,5 | Halo et traits du globe |
| `Atlas` | « à confirmer » (trois fois) | 12 px | 4,17 à 4,45 | 4,17 à 4,51 | 4,23 à 4,57 | 4,5 | Partout ou limite. Pâle sur verre |

Aucun échec sur `Espaces`, `Sante` et `Mac`. Le gris secondaire `#6E6E73` passe de peu : 4,66 sur le fond `#F5F5F7`, 5,07 sur blanc.

Les trois causes, chiffrées (MESURÉ, calcul WCAG sur les valeurs du code) :

1. **Le haut des dégradés est trop clair pour du blanc.** Blanc sur `#F2590D` : 3,38. Sur `#E8590C` : 3,58. Sur `#D9480F` : 4,30. Sur `#10A5A5` : 3,02. Sur `#D99A00` (FBA) : 2,45. Sur `#E8437F` (KITCHEN) : 3,79. Sur `#7C5CF5` (TELENEUF) : 4,46.
2. **Le halo ajoute de la lumière sous le texte.** Halo `#FFB36B` à 75 % sur `#A8300A` donne `#E99253` : blanc à 2,41. Il faut descendre à 15 % pour garder 5,53.
3. **Le texte secondaire pâle n'a pas de marge.** `#FFE2CF` sur `#D9480F` : 3,49. `#FFE2CF` sur une tuile de verre (blanc 16 % sur `#A8300A`) : 4,04. `#C9F5EF` sur verre sur `#075C63` : 4,44.

Contraste hors texte (MESURÉ, seuil 3:1 pour un composant) :

- Anneau de case à cocher `#C7C7CC` sur blanc (`Route`) : 1,68. Échec.
- Carte blanche sur fond `#F5F5F7` : 1,09. Les cartes sans ombre ni liseré (`Sante`, liste de `Main`, `Mac`) ne tiennent que par ce 1,09. C'est le style iOS, mais en plein soleil la carte disparaît.
- Bordure en tirets `#8E8E93` sur blanc : 3,26. Passe.
- Pastilles de monde sur blanc : ARYAN 3,58, FBA 3,51, ATLAS 4,16. Passent.

Daltonisme (MESURÉ par simulation de Machado, écart ΔE 1976, donc approximatif) : en deutéranopie, les pastilles ARYAN `#E8590C` et FBA `#C27803` deviennent presque identiques (ΔE 2,9 ; 30,8 en vision normale). TELENEUF et Juridique aussi (ΔE 4,2). Sur `Main` et `Mac`, la pastille de 10 px est doublée par le nom du monde, donc l'information reste. Mais la couleur seule ne suffit pas à distinguer ces mondes.

### 3.3 Zones tactiles — MESURÉ

- Téléphone : aucun bouton ni lien sous 44 × 44 px. Le soin est visible. Les plus petits font exactement 44 px de haut.
- `Mac` : le lien « Revoir » fait 41 × 44 px.
- Les cases à cocher de `Espace` et `Route` sont des `div` de 22 px, pas des boutons. On ne sait pas si on coche en touchant le rond ou la ligne. Il faut que la ligne entière (52 px) soit la cible.
- `Espace` : le lien « Feuille de route » (y 730 à 778) est couvert par la barre du bas à partir de y 758. Il reste 28 px touchables sur 48.
- Trois boutons « Fixer un moment » identiques se suivent sur `Main`. Leur largeur varie (130, 112, 115 px) parce que le texte de gauche les écrase, et le libellé passe sur deux lignes.

### 3.4 Débordements et coupes — MESURÉ

- `Sante` : le contenu fait 868 px pour un cadre de 844. La dernière ligne (« Visible par toi seul… ») est coupée. Avec San Francisco, un peu plus étroite, cela peut passer de justesse : à revérifier.
- `Espace` : le bloc liste finit à y 779, la barre commence à y 758. Recouvrement de 21 px. « Feuille de route » est à moitié cachée.
- `Capture` : le bouton « Annuler le dépôt » finit à y 757, la barre « Fermer » commence à y 764. 7 px d'écart : un appui raté sur « Fermer » annule le dépôt. C'est le voisinage le plus dangereux des neuf écrans.
- `Atlas` : 29 px entre le contenu et la barre. Pas de marge pour une pensée plus longue.
- `Mac` à 390 px : dans la liste « Ensuite », le bouton de la deuxième ligne sort de la carte de 21 px.
- Retours à la ligne (rendu Inter) : sur `Main`, « Confirmer l'immatriculation » et « Définir les critères produit » passent sur deux lignes, et « Fixer un moment » aussi. Sur `Espaces`, « À commencer » passe sur deux lignes dans les cartes Santé et Juridique. Estimation : avec San Francisco, « Confirmer l'immatriculation » reste trop long pour les 154 px disponibles.
- Zones sûres : les huit écrans de téléphone posent leur en-tête à y 20. Sur un iPhone 390 × 844, la zone d'état occupe 47 px en haut et l'indicateur d'accueil 34 px en bas. L'en-tête est donc sous l'encoche et l'heure. Les barres du bas finissent entre y 820 et y 828, dans la zone de l'indicateur (y 810 à 844). Hauteur réellement utile : 763 px, soit 81 px de moins que le cadre dessiné. `Capture`, `Espace`, `Atlas` et `Sante` ne tiennent plus.

### 3.5 Texte agrandi — MESURÉ par simulation

J'ai multiplié toutes les tailles par 1,3 puis par 2, en gardant 390 px de large.

- À 130 % : presque tout tient si la page peut défiler. `Sante` : un bouton coupe son texte. `Mac` à 390 : un bouton sort de l'écran (417 px).
- À 200 % : 30 éléments à hauteur fixe coupent leur texte sur les huit écrans de téléphone. Tous les boutons à `height` fixe (44, 48, 50, 56 px), les barres du bas, et les cartes de `Espaces` (hauteurs fixes 176, 132 et 96 px : le nom du monde et son état se chevauchent). « Juridique » sort de l'écran (434 px).
- Cause unique : `height` au lieu de `min-height`, et des tailles en `px` au lieu de `rem`.

### 3.6 Cohérence du système — MESURÉ sur les neuf fichiers

| Élément | Valeurs distinctes | Remarque |
|---|---|---|
| Couleurs hexadécimales | 49 | Dont 20 utilisées une seule fois |
| Couleurs `rgba` | 45 | 13 opacités de blanc différentes (0,14 à 0,86) |
| Dégradés | 17 | Quatre angles (150°, 160°, 165°, 170°) pour le même monde ARYAN |
| Rayons | 28 | 10 valeurs entre 10 et 28 px pour cartes et boutons : 10, 12, 14, 16, 18, 20, 22, 24, 26, 28 |
| Ombres | 19 | Presque une par usage. Une seule est réutilisée |
| Tailles de texte | 18 | Voir 3.1 |
| Graisses | 4 | 500, 600, 700, 800 |
| Interlettrages | 14 | |
| Interlignes | 13 | |
| Espacements (`gap`) | 13 | 10 px (31 fois) et 12 px (24 fois) se font concurrence |
| Marges internes (`padding`) | 29 | |

JUGEMENT : l'œil ne voit pas la différence entre un rayon de 22 et de 24, ni entre 150° et 160°. Mais le code, lui, devra tout porter. La règle interne dit : « la cohérence d'ensemble compte plus qu'un écran spectaculaire isolé ». Le système est à figer avant d'écrire la première ligne.

Le même monde n'a pas les mêmes couleurs partout (MESURÉ). ARYAN démarre à `#D9480F` sur `Main`, `Espace` et `Route`, mais à `#F2590D` sur `Espaces`. ATLAS démarre à `#0A7C82` sur `Capture` et `Atlas`, mais à `#10A5A5` sur `Espaces`. Le bouton « C'est fait » est blanc à texte `#8A2606` sur `Main`, plein `#A8300A` sur `Espace`, noir sur `Mac`.

## 4. Critique écran par écran

### `Main` — Aujourd'hui

**Ce qui marche.** JUGEMENT : l'écran répond à une seule question, « quelle est ma prochaine étape ? ». La carte orange est le point le plus fort de l'écran, la barre de dépôt est en bas, sous le pouce. Le micro cerclé des sept couleurs est une vraie signature. C'est conforme à la vision : déposer et retrouver.

**Ce qui échoue.**
- MESURÉ : une pastille du décor est posée sur le titre de la carte (contraste local 1,23). L'ombre orange salit le libellé « Ensuite » (3,41).
- JUGEMENT : la liste « Ensuite » est la partie faible. Trois boutons en tirets identiques, des libellés sur deux lignes. Le bouton prend plus de place que la tâche. Un seul geste suffit : toucher la ligne ouvre le choix du moment.
- JUGEMENT : le titre « Un cerveau. Cinq projets, une vie. » est un slogan. Il prend 68 px tous les jours pour ne rien dire de neuf. À garder pour le premier lancement. Ensuite, un titre utile : « Lundi 5 octobre » en grand, ou une salutation courte.
- MESURÉ : « Tout a été revu ce matin. Rien ne dort. » contredit `Espaces` (« Endormi depuis avril », trois fois) et `Mac` (« Pas revu depuis avril »). Et la liste propose une tâche FBA alors que FBA est endormi.
- MESURÉ : aucun lien vers `Espaces`. Le bouton « R » mène au compte. On ne peut pas aller voir ses mondes.

**Ce qui manque.** L'état vide (premier jour, aucune pensée) : c'est l'écran le plus important selon la règle interne et il n'est pas dessiné. L'état « rien d'autre aujourd'hui ». Les pensées déposées récemment (présentes sur `Mac`, absentes ici). Le moment prévu de l'étape en cours.

### `Ecoute` — dictée

**Ce qui marche.** JUGEMENT : le meilleur écran. Un seul objet, la transcription en direct en très gros, une phrase qui rassure (« Parle comme ça vient. Tu n'as rien à trier : ARC range après. »). Clavier et photo sont à côté, pas cachés. « Terminé » est sous le pouce. C'est exactement la règle « le micro est l'action principale, le clavier est à côté ».

**Ce qui échoue.**
- MESURÉ : le texte provisoire gris est à 2,99:1. Passer à `#6F6F74` donne 4,6.
- JUGEMENT : la transcription est en Bricolage 27 px. Les mots de l'utilisateur ne sont pas un titre. La police système, plus neutre, convient mieux à sa propre parole, et elle évite un saut de police si Bricolage arrive en retard.
- JUGEMENT : « Annuler » en bleu en haut à gauche est loin du pouce. Acceptable, car c'est une sortie rare.

**Ce qui manque.** La durée d'enregistrement. Une pause. Ce qui se passe après un long silence. L'état « micro refusé ». L'état hors ligne. L'animation de l'onde sous « réduire les animations ». La transcription doit être modifiable au toucher (règle interne) : rien ne le montre.

### `Capture` — pensée rangée

**Ce qui marche.** JUGEMENT : « C'est déposé. Tu peux fermer. Le reste est facultatif. » est la meilleure phrase des neuf écrans. « Tes mots, gardés tels quels » et « Réécouter » construisent la confiance. « Ce n'est pas ATLAS » et « Corriger » sont visibles : l'IA propose, l'utilisateur décide. Le moment proposé (« Demain, en ouvrant le Mac ») est concret.

**Ce qui échoue.**
- JUGEMENT : l'écran dit « le reste est facultatif » puis montre neuf boutons. La densité contredit la promesse. Proposition : citation, carte de première étape avec ses moments, puis une seule ligne « 2 autres étapes · Corriger ».
- MESURÉ : « Annuler le dépôt » est à 7 px de « Fermer ». Il doit quitter cette zone (menu « Corriger », avec confirmation ou annulation possible pendant quelques secondes).
- JUGEMENT : on ne sait pas si « Demain, en ouvrant le Mac » est déjà choisi ou seulement proposé. Le bouton blanc ressemble à un choix fait. Il faut le dire : « Proposé : demain, en ouvrant le Mac ».
- JUGEMENT : le micro en bas à droite n'a plus son anneau de couleurs. Ce n'est plus le même objet que sur `Main`.
- MESURÉ : « Vérifier où en est l'immatriculation » ici, « Confirmer l'immatriculation » sur `Main`. Même étape, deux formulations.

**Ce qui manque.** L'état d'attente pendant que Claude classe (la règle interne demande une progression nommée au-delà de 2 secondes). L'état « ARC n'est pas sûr du monde ». L'échec du classement hors ligne : la pensée doit être gardée et rangée plus tard.

### `Espaces` — projets et vie

**Ce qui marche.** JUGEMENT : chaque monde a une couleur et un motif reconnaissables. La séparation « projets » puis « Ma vie » en cartes blanches calmes suit la décision de la vision. La grande carte ARYAN dit quel projet est vivant. Contraste propre partout (MESURÉ).

**Ce qui échoue.**
- JUGEMENT : la couleur ne porte pas le sens. Trois projets « endormis depuis avril » crient aussi fort que le projet actif. Un monde endormi devrait être éteint (teinte désaturée, pas d'ombre, motif seul). Alors la couleur dirait quelque chose.
- JUGEMENT : cinq grands aplats saturés sur un écran. C'est le contraire de la règle interne « jamais en grands aplats multiples ». Je garde la couleur ici, car c'est la galerie des mondes, mais seulement pour les mondes éveillés.
- JUGEMENT : la carte FBA (`#D99A00` vers `#5C3300`) tire vers l'ocre et le brun. La règle interne dit d'éviter les ocres. À retravailler en or franc.
- MESURÉ : pas de barre de dépôt, pas de retour vers Aujourd'hui, un quart de l'écran vide en bas.
- MESURÉ : le titre dit « Cinq projets », le bouton « Créer un projet », le retour depuis un monde « Retour aux mondes », `Mac` dit « Sept espaces » et « Nouvel espace ». Trois mots pour une notion.
- JUGEMENT : « À commencer » sous Santé et Juridique sonne comme un reproche. « Vide pour l'instant » ou rien.

**Ce qui manque.** Ce qu'on fait d'un projet endormi (« le réveiller ou l'archiver », dit la vision). L'ordre des mondes. Le cas à 2 mondes et le cas à 9 mondes, puisque « plus rien en dur ».

### `Espace` — le monde ARYAN

**Immersion.** JUGEMENT : oui, elle est là. Le plein écran coloré, le nom en 76 px, le motif en cercles avec son trajet en pointillé, la carte blanche qui flotte : on entre dans un lieu. C'est la réponse la plus nette à « plus de couleur, de relief et d'envie ». Les trois plans (fond, verre, carte blanche) sont lisibles.

**Ce qui échoue.**
- MESURÉ : six textes sous le seuil. L'étiquette du haut est à 3,32 de médiane. Les libellés des compteurs entre 3,8 et 4,2. Le décor traverse le sous-titre.
- MESURÉ : la liste passe sous la barre (21 px). « Feuille de route » est à moitié cachée.
- JUGEMENT : les compteurs « 21 faites, 11 en cours, 3 bloquants » sont des statistiques de tableau de bord. La règle interne les écarte de l'affichage d'office. « 11 en cours » contredit l'idée d'une seule prochaine étape et peut peser. La vision demande autre chose à cet endroit : le cap et le point d'étape daté. « 3 bloquants » mérite de rester, mais comme lien vers ce qui bloque.
- JUGEMENT : la barre du bas donne la grande zone à « Demander à Claude » et le petit rond au dépôt. Sur `Main`, c'est l'inverse. Le geste central d'ARC est le dépôt : la barre doit être la même partout, avec Claude en bouton secondaire.
- JUGEMENT : trois mots pour reporter une étape selon l'écran : « Plus tard » (`Main`), « Fixer un moment » (`Espace`), « Demain matin » (`Atlas`).

**Ce qui manque** par rapport à la vision : le point d'étape daté, les pensées déposées dans ce monde (présentes sur `Atlas`, absentes ici), ce qui bloque (seulement un chiffre). Le défilement : que devient le grand titre quand on descend ?

### `Route` — feuille de route d'ARYAN

**Ce qui marche.** JUGEMENT : la frise Fait, Maintenant, Ensuite, Cap suit la vision mot pour mot. La carte blanche sur « Maintenant » montre où l'on est. Le drapeau du cap en bas donne une direction. L'écran reste dans le monde (même orange), on ne ressort pas.

**Ce qui échoue.**
- MESURÉ : cinq textes sous le seuil, tous dans le tiers haut, là où le dégradé est le plus clair. « Cap : le premier vrai client. » est à 4,14 de médiane.
- MESURÉ : l'anneau gris de la seconde case (`#C7C7CC`) est à 1,68.
- JUGEMENT : « 0 sur 2 » montre un zéro. La règle interne préfère « il reste 2 étapes ».
- JUGEMENT : « 928 tests verts », « Q1–Q4 » sont du jargon de développement. Pour Rayan aujourd'hui, cela passe. Pour un produit vendu, non.
- JUGEMENT : le cap est écrit deux fois (sous le titre et en bas). Une fois suffit, en bas.
- JUGEMENT : le motif en cercles du monde a disparu. Il ne reste que le halo. Le monde perd sa signature.

**Ce qui manque.** Une feuille de route longue (10 étapes faites) : repli de « Fait ». Les bloquants placés sur la frise plutôt que comptés dans une barre.

### `Atlas` — le monde ATLAS

**Immersion.** JUGEMENT : réussie, et cohérente avec ARYAN. Même structure, autre couleur, autre motif (un globe). C'est la preuve que le modèle de monde tient. « Née de ta pensée déposée ce matin. » relie la capture au monde : c'est la valeur du retour, rendue visible. Très bon.

**Ce qui échoue.**
- MESURÉ : six textes sous le seuil. Une pastille turquoise est posée sur le mot « points ». Les trois « à confirmer » sont entre 4,17 et 4,57.
- JUGEMENT : les trois tuiles occupent la place des compteurs d'ARYAN mais ne sont pas le même objet. Elles ressemblent à des boutons et n'en sont pas. Si ce sont des points à confirmer, il faut une action : « Confirmé » ou « Pas encore ».
- JUGEMENT : « Immatri-culation » coupé en deux lignes dans une tuile de 110 px. Une liste de trois lignes serait plus lisible.
- JUGEMENT : l'étiquette « Formation Amazon FBA » sur le monde ATLAS, alors qu'il existe un monde FBA. À clarifier avec Rayan.

**Ce qui manque.** Le cap. La feuille de route (aucun lien, contrairement à ARYAN). Le point d'étape daté.

### `Sante` — premier jour

**Ce qui marche.** JUGEMENT : c'est un état vide exemplaire. Chaque bloc donne une phrase, un exemple à dire (« dentiste le 14 à 9 h ») et un bouton. C'est la règle interne à la lettre. La limite est dite avec tact : « Il ne pose pas de diagnostic : ça, c'est ton médecin. » La ligne sur la confidentialité est au bon endroit. Aucun échec de contraste (MESURÉ).

**Cohérence avec le reste.** La vision demande pour « Ma vie » un style plus calme. Le fond clair et les cartes blanches sont donc justes. Trois écarts à corriger tout de même :
- MESURÉ : le titre est en police système 34 px, pas en Bricolage. C'est le seul titre d'écran du téléphone sans la police de caractère.
- MESURÉ : pas de barre de dépôt. L'écran dit « Dépose ce que tu remarques » et n'offre pas le micro.
- MESURÉ : le retour mène à « Aujourd'hui », alors que les mondes reviennent à `Espaces`.
- MESURÉ : la dernière ligne est coupée (868 px pour 844).

JUGEMENT : calme ne veut pas dire sans identité. Un en-tête un peu plus affirmé (vert `#1E6B2E` en titre, motif discret) suffirait à en faire un « lieu » sans le rendre bruyant. « Chronologie » sans bouton ni exemple est le bloc le plus faible.

### `Mac` — Aujourd'hui sur ordinateur

**Ce qui marche.** JUGEMENT : la structure est saine. Barre latérale, champ de dépôt en haut avec ⌘K, colonne de lecture, « Déposé récemment » avec « Rangé dans ATLAS ». Aucun échec de contraste (MESURÉ). À 1440 px, tout tient dans 900 px de haut.

**Ce qui échoue.**
- JUGEMENT : c'est un autre produit. Aucune Bricolage, aucune couleur, aucun relief. La carte « Maintenant » est blanche avec un bouton noir. Rien de ce que Rayan a demandé n'y est. La vision dit « iPhone et Mac à égalité » : aujourd'hui le Mac est en retard d'une version.
- MESURÉ : le vocabulaire diffère (« Sept espaces », « Nouvel espace »). Le Mac a « Déposé » et « Revue de la semaine », que le téléphone n'a pas.
- JUGEMENT : « Où en est chaque espace » montre cinq lignes sur sept qui disent « pas revu » ou « vide ». C'est une liste de retards affichée d'office. La règle interne l'exclut de l'accueil.
- JUGEMENT : quatre boutons « Fixer un moment » en colonne. Même défaut que sur `Main`, en plus visible.
- MESURÉ : mise en page selon la largeur. Sous 800 px, la barre latérale passe au-dessus et prend 650 px de haut avant tout contenu (iPad mini en portrait, 744 px). De 801 à 1024 px au moins, les deux colonnes s'empilent ; elles sont côte à côte à 1180 px. À 2560 px, le contenu est centré à 880 px du bord alors que la barre latérale reste collée à gauche : un grand vide entre les deux.
- MESURÉ : le paragraphe sous la carte fait 560 px de large en 16 px, soit environ 70 signes par ligne (estimation). La règle interne plafonne à 65.

**Ce qui manque.** Les raccourcis clavier (seul ⌘K est montré). L'état de focus, indispensable au clavier. Un écran de monde en version large : c'est là que le Mac peut faire mieux que le téléphone (monde à gauche, feuille de route à droite).

### Le flux de dépôt : `Main` → `Ecoute` → `Capture`

JUGEMENT : c'est le cœur du produit et c'est la partie la mieux pensée. Deux appuis pour déposer (micro, puis « Terminé »). La confirmation finit bien. Le fil est tenu : la même phrase se retrouve dans `Ecoute`, `Capture`, `Atlas` et `Mac`.

Ruptures à corriger :

1. **L'objet micro change.** Anneau de sept couleurs sur `Main` et `Ecoute`. Rond blanc sans anneau sur `Capture`. Rond blanc à icône teintée dans les mondes. Rond noir sur `Mac`. Un seul objet, partout.
2. **Le bouton principal change de côté.** Sur `Main`, le micro est à droite. Sur `Ecoute`, « Terminé » est au centre, et à droite il y a l'appareil photo. Un double appui rapide au même endroit ouvre la photo.
3. **Le fond ne raconte pas le trajet.** `Ecoute` est neutre, c'est juste : on ne sait pas encore où va la pensée. `Capture` devrait montrer l'arrivée : la carte prend la couleur du monde, c'est fait, mais rien ne relie les deux. C'est l'endroit pour le seul mouvement signé d'ARC : l'anneau de sept couleurs se réduit à une seule, celle du monde choisi.
4. **Pas d'état entre les deux.** Que voit-on pendant que Claude classe ? Et si Claude ne répond pas ?
5. **Depuis un monde**, le micro dit « Déposer une pensée dans ARYAN ». Le flux saute-t-il le classement ? Ce n'est pas dessiné.

### Qualité du français

JUGEMENT : le ton est juste. Tutoiement constant, phrases courtes, guillemets français et espaces avant les deux-points corrects, « 9 h » bien écrit. Aucune faute d'orthographe trouvée.

À corriger :
- Un mot par notion. Choisir entre « projet », « monde » et « espace ». Proposition : « projet » pour les cinq, « Ma vie » pour Santé et Juridique, « monde » réservé au langage interne.
- Une formulation par étape (« Vérifier où en est l'immatriculation » partout).
- Un mot pour reporter : « Plus tard », « Fixer un moment », « Demain matin » se font concurrence. Proposition : « Choisir un moment » quand rien n'est prévu, le moment lui-même quand il est proposé.
- « ARC y voit 3 choses » : « ARC en tire 3 étapes » est plus clair.
- « après » en minuscule, seul à droite d'une ligne : peu clair. « Ensuite », comme sur les autres écrans.
- « Rien ne dort » à retirer tant que trois projets dorment.
- Jargon : « tour 113 », « Q1–Q4 », « 928 tests verts », « bloquants » (« ce qui bloque », dit la vision).

### États manquants, tous écrans

Accueil vide. Monde vide. Chargement. Erreur de Claude. Hors ligne. Non connecté (« Continuer sans connexion » existe dans le code actuel). Focus clavier. Bouton appuyé. Mode sombre. Juridique. Les trois mondes FBA, KITCHEN, TELENEUF (un monde endormi vu de l'intérieur). La saisie au clavier. La recherche.

## 5. Faisabilité sur le web

ARC est une page statique, installée comme application sur iOS Safari et ouverte sur ordinateur. Tout ce qui suit est du JUGEMENT d'ingénierie, sauf mention MESURÉ. Rien n'a été testé sur un iPhone.

**Flou d'arrière-plan (`backdrop-filter`).** MESURÉ : utilisé cinq fois (barre de `Main`, barre et bouton retour de `Espace` et `Atlas`). C'est peu, et c'est bien. Garder le préfixe `-webkit-`. Risques : chute de fluidité si le flou couvre un contenu qui défile, et bords qui bavent sur les coins arrondis. Règles : flou seulement sur des éléments fixes et petits ; jamais de flou imbriqué ; un fond de secours opaque avec `@supports not (backdrop-filter: blur(1px))` ; version opaque sous `prefers-reduced-transparency` et `prefers-contrast: more`. Incohérence à nettoyer (MESURÉ) : le bouton retour a un flou, le bouton réglages voisin n'en a pas, la barre de `Route` non plus.

**Tuiles « verre ».** MESURÉ : ce sont de simples fonds blancs à 14 ou 16 % d'opacité, sans flou. C'est gratuit en performance. Leur seul problème est le contraste (voir 3.2).

**Grands halos radiaux.** Un `radial-gradient` de 420 px se dessine sans coût notable tant qu'il ne bouge pas. Ne pas l'animer, ne pas lui ajouter `filter: blur`. Risque visible : des bandes dans les dégradés sombres sur certains écrans. Parade : un grain léger en image de 2 ko, ou des dégradés plus courts.

**Décor SVG.** Léger et net. Chaque motif est copié dans chaque écran avec des coordonnées différentes (MESURÉ). En production : un motif par monde, défini une fois (`<symbol>` ou image de fond), avec une zone interdite sous le texte. Tous portent déjà `aria-hidden="true"` : bien.

**Police.** MESURÉ : le lien demande à Google les axes `opsz` 12 à 96 et `wght` 400 à 800. Les maquettes n'utilisent que 600, 700 et 800. Poids des fichiers latins (fontsource 5.3.0) : 41 ko avec le seul axe `wght`, 77 ko avec `opsz` et `wght`, 132 ko avec tous les axes. Licence OFL-1.1 (lue dans le paquet).
Recommandation : héberger la police dans le dépôt. Un fichier `woff2` latin, `opsz` + `wght` (77 ko), car l'axe optique sert vraiment à 76 px. `font-display: swap`, un `<link rel="preload">`, mise en cache par `sw.js` (changer le nom du cache). Ajouter une police de repli ajustée (`size-adjust`, `ascent-override`) pour que le titre ne saute pas à l'arrivée de Bricolage. Raisons : le service worker ne garantit pas le hors-ligne d'une ressource d'un autre domaine ; un appel à Google à chaque visite envoie l'adresse IP à un tiers ; et un domaine de moins à résoudre. C'est un fichier ajouté au dépôt : à dire à Rayan, comme le veut la règle du projet.

**Mode sombre.** Aucun n'est dessiné. La règle interne dit : clair par défaut, sombre proposé selon le système. Les écrans de monde sont déjà sombres en bas et passeront presque tels quels. Les écrans clairs demandent un jeu complet : fond, fond élevé, texte, texte secondaire, séparateur. La carte blanche « Prochaine étape » deviendrait une carte sombre à liseré clair. À dessiner avant de coder, avec des jetons, sinon c'est une réécriture.

**Texte agrandi.** MESURÉ : à 200 %, 30 éléments coupent leur texte (voir 3.5). Sur iOS, une page web ne suit le réglage de taille du système que si on le demande (`font: -apple-system-body` sur la racine, puis tout en `rem`). Dans l'application installée, il n'y a pas de bouton « aA ». Il faut donc le prévoir : tailles en `rem`, `min-height` partout, barres du bas qui grandissent, cartes de `Espaces` sans hauteur fixe. Le titre de 76 px ne doit pas doubler : le borner avec `clamp()`.

**Animations réduites.** Aucune animation n'est spécifiée. À prévoir : l'onde de `Ecoute` devient un niveau fixe ou un point qui change d'opacité ; les transitions d'entrée dans un monde deviennent un fondu de 150 ms. Aucune animation d'ambiance en boucle (règle interne).

**Zones sûres.** MESURÉ : aucune maquette n'en tient compte (0 occurrence de `safe-area`). Il faut `viewport-fit=cover`, puis `padding-top: max(20px, env(safe-area-inset-top))` sur l'en-tête et `bottom: max(16px, env(safe-area-inset-bottom))` sur les barres flottantes. Le fond coloré d'un monde doit monter sous l'encoche : c'est ce qui donnera l'effet plein écran. Le contenu perd environ 81 px de hauteur. Tous les écrans doivent donc défiler ; aucun ne peut être pensé comme une affiche fixe. Ajouter aussi `theme-color` par monde pour teinter la barre d'état hors mode installé.

**Paysage et iPad.** Les huit écrans de téléphone sont fixés à 390 px : rien n'est prévu. En paysage sur iPhone (844 × 390), la barre du bas et l'en-tête mangeraient la moitié de la hauteur. Décision simple : colonne de 560 px au plus, centrée, pour le téléphone en paysage et l'iPad en portrait ; la mise en page `Mac` à partir de 1024 px. MESURÉ : la mise en page `Mac` actuelle bascule mal à 800 px (barre latérale de 650 px de haut au-dessus du contenu).

**Dictée et « Réécouter ».** Point dur, non vérifié. La reconnaissance vocale du navigateur est peu fiable dans une application web installée sur iOS : à tester sur l'appareil avant de promettre la transcription en direct de `Ecoute`. L'autre voie (enregistrer puis transcrire sur un serveur) demande un service que le proxy actuel n'a pas. « Réécouter » suppose de garder l'audio : pas dans l'état `S` synchronisé en JSON, plutôt en local (IndexedDB), avec une durée de vie courte. C'est le plus gros risque technique des neuf écrans.

**Droite à gauche.** Hors périmètre.

## 6. Le système à figer

### 6.1 Typographie

Deux polices. Bricolage Grotesque pour ce qui nomme (nom d'un monde, titre d'écran, chiffre). Police système pour ce qui se lit et ce qui s'actionne.

JUGEMENT : la « prochaine étape » est une phrase d'action. La règle interne veut qu'elle soit dans le texte le plus lisible, sans police de caractère. Je propose la police système en 22 px semi-gras. C'est un arbitrage : la vision demande du caractère dans les titres, et Bricolage en 24 px reste lisible. Si Rayan préfère la garder, c'est défendable, à condition de la retirer de la transcription de `Ecoute`.

Huit tailles au lieu de dix-huit. Tout en `rem` (base 17 px sur iPhone).

| Rôle | Taille | Graisse | Interligne | Police | Remplace |
|---|---|---|---|---|---|
| Nom de monde | 72 px, borné par `clamp(48px, 18vw, 72px)` | 800 | 0,92 | Bricolage, interlettrage −0,04 em | 76 |
| Titre d'écran | 34 px | 800 | 1,05 | Bricolage, −0,03 em | 34, 40, 44 |
| Titre de section, nom sur carte | 28 px | 800 | 1,1 | Bricolage, −0,02 em | 24, 27, 28, 30 |
| Prochaine étape | 22 px | 600 | 1,2 | Système | 22, 23, 24, 25, 28 |
| Texte courant, boutons | 17 px | 400 ; 600 pour les boutons | 1,4 | Système | 16, 17, 19 |
| Texte secondaire | 15 px | 400 | 1,4 | Système | 14, 15 |
| Légende, pastille | 13 px | 400 ou 600 | 1,3 | Système | 12, 13 |
| Étiquette en capitales | 13 px | 700 | 1,2 | Système, +0,08 em | 12 |

Trois graisses en police système (400, 600, 700) ; la 500 disparaît. Une graisse en Bricolage (800), plus 700 pour les chiffres. Plus aucun texte à 12 px.

### 6.2 Espacements

Échelle de 4 : 4, 8, 12, 16, 20, 24, 32, 48.
- Marge d'écran : 20. Entre blocs : 16. Entre sections : 32.
- Marge interne d'une carte : 20. D'une ligne de liste : 16. Hauteur minimale d'une ligne : 56.
- Le 10 px (31 usages) et le 14 px disparaissent au profit de 8, 12 et 16.

### 6.3 Rayons

Quatre valeurs et la pilule, au lieu de dix.
- 12 : pastilles, petits boutons, cases d'icône.
- 16 : boutons.
- 24 : cartes, panneaux de verre, listes.
- 28 : cartes d'action et cartes de monde.
- Pilule : barres flottantes, boutons ronds, moments.

Règle des coins emboîtés : rayon intérieur = rayon extérieur − marge. Un bouton de 16 dans une carte de 28 à 20 de marge est déjà presque juste.

### 6.4 Relief : trois plans

| Plan | Sert à | Sur écran clair | Dans un monde |
|---|---|---|---|
| 0 — Fond | Le lieu | `#F5F5F7` uni | Dégradé du monde (un seul angle : 160°) + motif + halo |
| 1 — Posé | Le contenu qui se lit | Carte blanche, liseré `#E5E5EA` 1 px, sans ombre | Panneau de verre : blanc 14 %, liseré blanc 24 %, sans flou, sans ombre |
| 2 — Flottant | Ce qui s'actionne : la carte d'action et la barre de dépôt | Ombre `0 20px 40px` teintée de la couleur profonde du monde à 35 % (carte) ; `0 8px 30px rgba(0,0,0,0.10)` + flou 20 px (barre) | Carte blanche, ombre `0 20px 40px` profonde à 45 % ; barre : fond profond à 55 %, flou 20 px |

Deux ombres au lieu de dix-neuf, plus une petite (`0 6px 14px` profonde à 30 %) pour un bouton posé sur une carte colorée. Une seule carte du plan 2 par écran : c'est elle qui dit « l'action est ici ».

Règles du décor :
- Le halo ne dépasse jamais 15 % d'opacité sous un texte. Il vit dans le coin opposé au titre.
- Aucun trait ni pastille du motif ne croise une ligne de texte. Le motif a une zone réservée (le tiers haut droit).
- Si un texte doit passer sur le décor, il reçoit un voile (`linear-gradient` de la couleur médiane, 0 à 60 %) derrière lui.

### 6.5 Couleurs par monde

Cinq valeurs par monde. Les valeurs viennent des maquettes ; celles qui échouaient sont corrigées. Tous les rapports sont MESURÉS par calcul WCAG.

- **Profond** : bas du dégradé, teinte des ombres, fond des barres.
- **Médian** : surface principale. Tout texte blanc est posé sur du médian ou plus sombre.
- **Vif** : haut du dégradé, pastille, icône, bouton plein. Corrigé pour que le blanc y tienne à 4,5.
- **Pâle** : fond de pastille sur écran clair ; texte secondaire sur médian ou profond seulement.
- **Texte sur pâle** : texte et icône sur fond pâle ou blanc.

| Monde | Profond | Médian | Vif | Pâle | Texte sur pâle |
|---|---|---|---|---|---|
| ARYAN | `#5E1703` | `#A8300A` | `#C94D0A` (était `#E8590C` et `#F2590D`) | `#FFE2CF` | `#8A2606` |
| ATLAS | `#032E33` | `#075C63` | `#0A7C82` (était `#0B8A8F` et `#10A5A5`) | `#C9F5EF` | `#06666A` |
| FBA | `#5C3300` | `#8F5200` (était `#A15C00`) | `#A66703` (était `#C27803` et `#D99A00`) | `#FFEFC7` (nouveau) | `#7A4B00` |
| KITCHEN | `#5E0C2C` | `#B01E55` | `#D6336C` (le `#E8437F` disparaît) | `#FDE4EC` (nouveau) | `#A61E4D` |
| TELENEUF | `#26166B` | `#4C2DB0` | `#6741D9` (le `#7C5CF5` disparaît) | `#ECE7FD` (nouveau) | `#4C2DB0` |
| Santé | `#0F3D19` (nouveau) | `#1E6B2E` | `#2A853C` (était `#2B8A3E`) | `#E6F4E9` | `#1E6B2E` |
| Juridique | `#0A2A66` (nouveau) | `#1247A8` | `#1C5FD4` | `#E4EDFB` | `#1247A8` |

Rapports obtenus :

| Monde | Blanc sur profond | Blanc sur médian | Blanc sur vif | Pâle sur médian | Pâle sur vif | Texte sur pâle | Vif sur blanc |
|---|---|---|---|---|---|---|---|
| ARYAN | 13,13 | 6,79 | 4,62 | 5,51 | 3,74 | 7,22 | 4,62 |
| ATLAS | 14,56 | 7,72 | 4,98 | 6,54 | 4,22 | 5,71 | 4,98 |
| FBA | 10,89 | 6,22 | 4,60 | 5,46 | 4,04 | 6,50 | 4,60 |
| KITCHEN | 13,42 | 6,64 | 4,62 | 5,53 | 3,84 | 6,00 | 4,62 |
| TELENEUF | 14,90 | 9,09 | 6,30 | 7,54 | 5,22 | 7,54 | 6,30 |
| Santé | 12,34 | 6,57 | 4,65 | 5,78 | 4,09 | 5,78 | 4,65 |
| Juridique | 13,67 | 8,43 | 5,77 | 7,14 | 4,90 | 7,14 | 5,77 |

Valeurs des maquettes écartées, avec leur mesure : blanc sur `#F2590D` 3,38 ; sur `#E8590C` 3,58 ; sur `#D9480F` 4,30 ; sur `#10A5A5` 3,02 ; sur `#0B8A8F` 4,16 ; sur `#D99A00` 2,45 ; sur `#C27803` 3,51 ; sur `#E8437F` 3,79 ; sur `#7C5CF5` 4,46 ; sur `#2B8A3E` 4,37.

Règles d'emploi :
1. Dégradé d'un monde : vif en haut, médian à 45 %, profond en bas, angle 160°. Toujours le même.
2. Texte principal sur couleur : blanc.
3. Texte secondaire sur couleur : pâle, mais seulement sur médian ou profond (colonne « Pâle sur vif » : cinq valeurs sur sept sont sous 4,5). Dans la zone haute, le texte secondaire est blanc.
4. Sur panneau de verre : texte blanc uniquement. Le pâle y tombe à 4,04 (ARYAN) et 4,44 (ATLAS).
5. Halo (`#FFB36B` pour ARYAN, `#3FE0D0` pour ATLAS) : décor seulement, jamais sous un texte au-delà de 15 %.
6. Les teintes vives d'origine (`#E8590C`, `#10A5A5`…) peuvent rester dans le motif et le halo. Elles ne portent plus de texte.

Neutres (repris des maquettes) : fond `#F5F5F7`, carte `#FFFFFF`, texte `#1D1D1F`, séparateur `#E5E5EA`. Texte secondaire : passer de `#6E6E73` (4,66 sur le fond, limite) à `#636366` (5,50). Texte provisoire : `#6F6F74` (4,6) au lieu de `#8E8E93` (2,99). Anneau de case : `#8E8E93` (3,26) au lieu de `#C7C7CC` (1,68).

Deux problèmes de fond à trancher :
- **Le bleu.** `#1C5FD4` est à la fois la couleur des liens de l'application (« Annuler », « Revoir », retour de `Sante`) et la couleur du monde Juridique. Un bleu ne peut pas dire « cliquable » et « juridique » à la fois. Proposition : les actions neutres passent en `#1D1D1F` ; dans un monde, l'accent est la couleur du monde ; le bleu reste à Juridique.
- **Les paires proches.** ARYAN et FBA, TELENEUF et Juridique se confondent en vision daltonienne (voir 3.2). Écarter les teintes (FBA vers un or plus jaune, Juridique vers un bleu plus froid) et toujours doubler la pastille par le nom ou une icône.

Si un jour l'utilisateur crée ses mondes (« plus rien en dur »), il choisit dans une liste de 8 à 10 jeux validés de cette façon, pas dans un sélecteur libre.

### 6.6 Quand un écran est en couleur, quand il est clair

- **Plein écran coloré** : seulement à l'intérieur d'un projet (son écran, sa feuille de route, ce qui bloque). Une seule couleur à la fois. C'est le « on entre dans un monde ».
- **Écran clair** : tout ce qui est transversal. Aujourd'hui, la liste des projets, l'écoute, la confirmation, la recherche, le compte.
- **Une touche de couleur sur écran clair** : une seule carte du plan 2, celle de l'étape en cours, dans la couleur de son monde. Les autres mondes n'apparaissent qu'en pastille.
- **Ma vie (Santé, Juridique)** : écran clair, en-tête en teinte pâle, titre en Bricolage dans la teinte « texte sur pâle ». Pas de plein écran coloré. C'est le « plus calme » de la vision.
- **Projet endormi** : sa carte perd le dégradé (fond pâle, nom dans la teinte « texte sur pâle », pas d'ombre). La couleur pleine revient quand on le réveille.
- **Le Mac** suit les mêmes règles : barre latérale claire, et le panneau principal prend la couleur quand on ouvre un projet.

### 6.7 Composants

| Composant | Définition | À corriger par rapport aux maquettes |
|---|---|---|
| **Barre de dépôt** | Flottante, pilule, hauteur minimale 68, plan 2. À gauche le champ « Dépose une pensée… », à droite le micro de 56 avec l'anneau des sept couleurs. Dans un monde : même barre sur fond profond, anneau d'une seule couleur, et un bouton « Claude » secondaire. Calée sur `env(safe-area-inset-bottom)`. | Présente partout, y compris `Espaces`, `Sante`, `Route`. Même sens partout (aujourd'hui inversé dans les mondes). Sur Mac : en haut, avec ⌘K. |
| **Carte de monde** | Rayon 28, dégradé du monde, motif dans le coin haut droit, pastille d'état, nom en 28 px, une ligne d'étape. Hauteur minimale, pas fixe. | Deux états : éveillé (couleur) et endormi (pâle). |
| **Carte d'action** | Plan 2, rayon 28, marge 20. Étiquette, étape en 22 px, une ligne de contexte, bouton principal « C'est fait », bouton de moment. | Une seule version. Aujourd'hui trois (orange pleine sur `Main`, blanche dans les mondes, blanche plate sur `Mac`). Proposition : colorée sur écran clair, blanche dans un monde. |
| **Panneau de verre** | Plan 1 dans un monde. Blanc 14 %, liseré blanc 24 %, rayon 24, texte blanc. Sans flou. | Jamais de texte pâle dessus. Version opaque (médian uni) sous `prefers-contrast: more`. |
| **Ligne de liste** | Hauteur minimale 56, pastille de monde 10 px, libellé 17 px, détail à droite en 15 px. Toute la ligne est la cible. | Retirer le bouton « Fixer un moment » de chaque ligne. Case à cocher : la ligne entière, anneau `#8E8E93` ou blanc 75 %. |
| **Pastille** | Rayon 12, 13 px semi-gras, fond pâle et texte « texte sur pâle » sur écran clair ; fond profond 40 % et texte blanc sur couleur. | Déjà cohérente. La garder. |
| **Moment** | Pilule de 44 de haut, 15 px. Proposé : plein. Autres : contour. Non fixé : tirets. | Dire « Proposé : ». Un seul mot pour reporter. |
| **Bouton** | Hauteur minimale 50, rayon 16, 17 px semi-gras. Principal : plein. Secondaire : teinté pâle. Tertiaire : texte seul. | États appuyé, désactivé et focus (anneau de 2 px décalé de 2 px) à dessiner. |
| **Bouton rond** | 44, pilule, verre ou blanc. | Même traitement pour retour et réglages (aujourd'hui l'un a un flou, l'autre non). |
| **Barre d'information du bas** (`Route`) | À fondre dans la barre de dépôt, ou à remonter dans la frise. | Deux barres du bas différentes selon l'écran, c'est une de trop. |
| **Navigation** | Téléphone : deux destinations, Aujourd'hui et Projets, à gauche de la barre de dépôt ou en glissement. Mac : barre latérale. | N'existe pas sur le téléphone aujourd'hui. |

Chaque composant est à livrer avec quatre choses : son état vide, son état à 200 %, son état sombre, son état de focus.

## 7. Les dix corrections, par ordre d'importance

1. **Rendre le texte lisible sur la couleur.** Haut des dégradés assombri (blanc à 4,6 au moins), halo plafonné à 15 % sous un texte, texte pâle interdit dans la zone haute et sur le verre. Avec la correction 2, cela règle 20 des 22 échecs mesurés (restent le texte provisoire de `Ecoute` et le libellé « Ensuite » sous l'ombre).
2. **Sortir le décor de sous le texte.** Zone réservée au motif. Quatre écrans ont une pastille ou un trait posé sur des mots.
3. **Dessiner pour un vrai iPhone.** Zones sûres en haut et en bas, écrans qui défilent, `min-height` au lieu de `height`. Corrige aussi le recouvrement de `Espace`, la coupe de `Sante` et les 30 éléments coupés à 200 %.
4. **Donner une navigation au téléphone, et la même barre de dépôt à tous les écrans.** Aujourd'hui `Main` ne mène pas à `Espaces`, et `Espaces`, `Sante`, `Route` n'ont pas de dépôt.
5. **Figer le système avant de coder** : 8 tailles, 4 rayons, 2 ombres, 5 couleurs par monde, un angle de dégradé. Les maquettes en comptent 18, 10, 19, et jusqu'à trois variantes par monde.
6. **Alléger `Capture` et écarter « Annuler le dépôt » de « Fermer ».** 7 px les séparent. L'écran promet « le reste est facultatif » et montre neuf boutons.
7. **Mettre les textes d'accord.** Un mot par notion (projet, monde ou espace). Une formulation par étape. Retirer « Rien ne dort » tant que trois projets dorment. Un mot pour reporter.
8. **Faire porter du sens à la couleur.** Projet endormi : carte éteinte. Remplacer les compteurs d'ARYAN par le cap et le point d'étape daté. Séparer le bleu des liens du bleu de Juridique.
9. **Refaire `Mac` dans la même famille.** Bricolage pour les titres, carte d'action colorée, écran de projet en couleur, même vocabulaire. Retirer la liste « Où en est chaque espace » de l'accueil. Revoir les largeurs sous 1100 px.
10. **Dessiner ce qui manque avant tout le reste du détail** : accueil vide, attente et échec du classement, micro refusé, hors ligne, focus, mode sombre. Et héberger la police (77 ko) au lieu d'appeler Google.

Hors classement, mais à faire en premier dans le temps : **tester la dictée sur un iPhone**. Si la transcription en direct ne marche pas dans l'application installée, `Ecoute` est à redessiner, et c'est le geste central.

## 8. Fichiers de travail

Tout est dans `/tmp/claude-0/-home-claude-arc/a977f312-cf6f-5b68-a0f1-018fdc7304a0/scratchpad/maquettes-review/` (dossier temporaire de la session) :

- `pages/` : les neuf copies autonomes (police locale). `pages_asis/` : les mêmes avec le lien Google d'origine.
- `shots/` : captures (`Main.png`…, `Mac_1440.png`, `Mac_390.png`, `bg_*.png` sans texte pour le contraste, `zoom130_*` et `zoom200_*`).
- `measure.json`, `analysis.txt` : mesures brutes.
- `build.py`, `shoot.js`, `analyze.py`, `syscount.py`, `pal.py`, `pal2.py`, `zoom.js`, `widths.js` : scripts.
