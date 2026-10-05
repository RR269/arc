# Partie 3 — Faisabilité technique (état au 5 octobre 2026)

Mode de lecture.
- **PROUVÉ** : page officielle (doc, spécification, page de prix) lue pendant cette session, le 5 octobre 2026.
- **PROBABLE** : source secondaire crédible lue pendant cette session.
- **SUPPOSÉ** : mémoire ou déduction. À tester avant de s'engager.
- Toutes les URL ont été consultées le **5 octobre 2026**. La date entre parenthèses est la date de publication de la page, quand elle est connue.
- Les prix sont en dollars américains, hors taxes.
- Aucun test sur un vrai iPhone n'a été fait. Tout ce qui touche au comportement réel d'iOS 26/27 en mode « écran d'accueil » reste à vérifier sur l'appareil de Rayan.

---

## 1. Capture vocale dans une application web (iPhone, Mac)

### Takeaway
Le chemin le plus sûr est un champ de texte avec la dictée du clavier iOS : zéro code, marche partout. Le second chemin est un bouton micro (`getUserMedia` + `MediaRecorder`) qui envoie l'audio à une transcription côté serveur. La reconnaissance vocale du navigateur (`webkitSpeechRecognition`) est à écarter sur iPhone : WebKit dit qu'elle n'est pas disponible dans une application ajoutée à l'écran d'accueil.

### Cited Findings
- **PROUVÉ** — `MediaRecorder` existe dans Safari iOS depuis la version 14 et dans Safari Mac depuis 14.1 ; dans Chrome depuis 47. `MediaRecorder.isTypeSupported()` existe aux mêmes versions. — [MDN browser-compat-data, api/MediaRecorder.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/MediaRecorder.json)
- **PROUVÉ** — À l'origine, Safari n'enregistre qu'en MP4 : vidéo H.264, audio AAC. WebKit recommande de tester le format avec `isTypeSupported`. — [WebKit, « MediaRecorder API » (23 nov. 2020)](https://webkit.org/blog/11353/mediarecorder-api/)
- **PROUVÉ** — Depuis Safari 18.4, `MediaRecorder` sait aussi créer du WebM avec le codec audio Opus, et de l'audio sans perte ALAC/PCM. — [WebKit, « WebKit Features in Safari 18.4 » (31 mars 2025)](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- **PROUVÉ** — Safari 26.0 ajoute ALAC et PCM dans `MediaRecorder`. — [WebKit, « WebKit Features in Safari 26.0 » (15 sept. 2025)](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- **PROUVÉ** — `navigator.mediaDevices` (donc `getUserMedia`) existe dans Safari depuis la version 11. — [MDN browser-compat-data, api/Navigator.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Navigator.json)
- **PROUVÉ (rapport de bogue officiel, contenu = témoignages)** — Bogue WebKit 215884 : dans une application web installée sur iOS, l'autorisation caméra/micro est redemandée après un changement de route par « hash », après fermeture et réouverture, ou après un certain temps. L'autorisation donnée dans Safari ne passe pas à l'application installée. Des commentaires de 2025-2026 disent que le problème existe encore sous iOS 18.5. Le bogue est classé « RESOLVED / CONFIGURATION CHANGED », mais le responsable note que la redemande après fermeture est un autre problème. — [bugs.webkit.org #215884](https://bugs.webkit.org/show_bug.cgi?id=215884)
- **PROUVÉ** — `SpeechRecognition` : Safari Mac depuis 14.1 et Safari iOS depuis 14.5, avec le préfixe `webkit`. Support « partiel » selon caniuse. — [MDN browser-compat-data, api/SpeechRecognition.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/SpeechRecognition.json) ; [caniuse, Speech Recognition API](https://caniuse.com/speech-recognition)
- **PROUVÉ** — Dans Safari, la reconnaissance utilise le moteur de Siri, « plus de 50 langues et dialectes ». Siri doit être activé dans les réglages, sinon l'API n'est pas utilisable. — [WebKit, « New WebKit Features in Safari 14.1 » (29 avr. 2021)](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)
- **PROUVÉ (réponse de l'équipe WebKit dans le bogue)** — « SpeechRecognition API is not available in SafariViewController and web apps added to Home Screen for now. » Bogue ouvert en mai 2021, classé « RESOLVED / LATER », dernier commentaire le 1er mars 2025, sans annonce de correction. — [bugs.webkit.org #225298](https://bugs.webkit.org/show_bug.cgi?id=225298)
- **PROUVÉ** — Reconnaissance sur l'appareil par l'API web (`processLocally`, `available()`, `install()`) : Chrome de bureau 139 oui ; Safari non ; Chrome Android non. — [MDN browser-compat-data, api/SpeechRecognition.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/SpeechRecognition.json)
- **PROUVÉ** — Dans Chrome, la reconnaissance passe par un serveur : l'audio est envoyé à un service web, donc pas de fonctionnement hors ligne. — [MDN, SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- **PROUVÉ** — Dictée Apple (clavier) : l'appareil indique dans Réglages > Clavier si l'audio et le texte sont traités sur l'appareil. Sinon, ce qui est dicté est envoyé et traité sur les serveurs d'Apple, sans être conservé sauf accord « Améliorer Siri et Dictée ». Des données techniques liées à la requête sont aussi envoyées. — [Apple, « Ask Siri, Dictation & Privacy » (14 sept. 2026)](https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/)
- **PROUVÉ** — Les notes de Safari 27.0 ne citent aucun changement sur la reconnaissance vocale, le micro ou les applications web de l'écran d'accueil. — [WebKit, « WebKit Features for Safari 27.0 »](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)

### Inferences
- **Recommandation.** Niveau 1 : un `<textarea>` bien placé, avec le focus automatique. Le micro du clavier iOS fait la dictée en français. Aucun code, aucune autorisation web, aucun coût. Niveau 2 : un bouton micro qui enregistre et envoie le fichier à une fonction Supabase pour transcription (question 2). Ne pas construire sur `webkitSpeechRecognition`.
- Format d'enregistrement : demander `audio/mp4` d'abord, tester avec `isTypeSupported`, sinon `audio/webm;codecs=opus` (Chrome). Les services de transcription listés en question 2 acceptent MP4/M4A et WebM (prouvé pour Groq ; à vérifier pour les autres).
- Le bogue 215884 fait craindre une redemande d'autorisation micro à chaque lancement à froid de l'application installée. C'est une raison de plus pour garder la dictée du clavier comme chemin principal (SUPPOSÉ pour iOS 26/27).
- La dictée du clavier ne garde pas l'audio. Si l'on veut réécouter une pensée, il faut le niveau 2.

### Gaps
- Non vérifié : si `webkitSpeechRecognition` marche dans une application de l'écran d'accueil sous iOS 26 ou 27. Dernière preuve : mars 2025 (non). À tester sur l'iPhone.
- Non vérifié : persistance réelle de l'autorisation micro en mode installé sous iOS 26/27.
- Non vérifié sur une page Apple lue : la liste des langues de dictée traitées sur l'appareil (français inclus ou non selon le modèle). La page d'aide « Dictate text on iPhone » n'a pas rendu son contenu ([lien](https://support.apple.com/guide/iphone/dictate-text-iph2c0651d2/ios)).
- Non trouvé : débit audio par défaut de `MediaRecorder` dans Safari, donc poids exact d'un clip de 2 minutes.

---

## 2. Transcription côté serveur depuis une fonction Supabase

### Takeaway
Un clip de 1 à 2 minutes coûte entre 0,1 et 2 centimes à transcrire selon le service. Mistral Voxtral (0,003 $/min, données hébergées dans l'UE par défaut, français pris en charge) est le meilleur compromis prix / Europe. La fonction Supabase suffit en mémoire et en durée ; la seule inconnue est la taille maximale du corps de requête, non documentée.

### Cited Findings

Prix (pages de prix officielles, lues le 5 octobre 2026) :

| Service | Modèle | Prix lu | Par minute | Source |
|---|---|---|---|---|
| Mistral | Voxtral Mini Transcribe 2 (différé) | 0,003 $/min | 0,003 $ | [mistral.ai/pricing/api](https://mistral.ai/pricing/api) |
| Mistral | Voxtral Mini Transcribe Realtime | 0,006 $/min | 0,006 $ | idem |
| OpenAI | gpt-4o-mini-transcribe | 0,003 $/min | 0,003 $ | [developers.openai.com, pricing](https://developers.openai.com/api/docs/pricing) |
| OpenAI | gpt-4o-transcribe | 0,006 $/min | 0,006 $ | idem |
| OpenAI | gpt-transcribe | 0,0045 $/min | 0,0045 $ | idem |
| Deepgram | Nova-3 monolingue, pré-enregistré | 0,0043 $/min | 0,0043 $ | [deepgram.com/pricing](https://deepgram.com/pricing) |
| Deepgram | Nova-3 multilingue, pré-enregistré | 0,0052 $/min | 0,0052 $ | idem |
| AssemblyAI | Universal-2 | 0,15 $/h | 0,0025 $ | [assemblyai.com/pricing](https://www.assemblyai.com/pricing) |
| AssemblyAI | Universal-3.5 Pro | 0,21 $/h | 0,0035 $ | idem |
| Groq | Whisper Large v3 Turbo | 0,04 $/h | 0,00067 $ | [console.groq.com, speech-to-text](https://console.groq.com/docs/speech-to-text) |
| Groq | Whisper Large v3 | 0,111 $/h | 0,00185 $ | idem |
| Gladia | Starter, différé | 0,61 $/h | 0,0102 $ | [gladia.io/pricing](https://www.gladia.io/pricing) |
| ElevenLabs | Scribe v2 | 0,22 $/h | 0,0037 $ | [elevenlabs.io/pricing/api](https://elevenlabs.io/pricing/api) |
| Google | Speech-to-Text V2 standard | 0,016 $/min | 0,016 $ | [cloud.google.com/speech-to-text/pricing](https://cloud.google.com/speech-to-text/pricing) |
| Google | V2 « dynamic batch » | 0,003 $/min | 0,003 $ | idem |

(Les colonnes « par minute » pour les prix à l'heure sont des divisions par 60.)

- **PROUVÉ** — Mistral : « By default, your data is hosted in the European Union. » Un point d'accès américain existe, sur choix explicite. Des transferts temporaires vers des sous-traitants hors UE sont possibles pour certaines fonctions. — [Aide Mistral (12 août 2026)](https://help.mistral.ai/en/articles/347629-where-do-you-store-my-data-or-my-organization-s-data)
- **PROUVÉ** — Voxtral Mini Transcribe V2 : 13 langues dont le français, horodatage par mot, enregistrements jusqu'à 3 heures par requête. — [docs.mistral.ai, audio transcription](https://docs.mistral.ai/capabilities/audio_transcription)
- **PROUVÉ** — OpenAI : point d'accès européen `eu.api.openai.com`, `/v1/audio/transcriptions` inclus. Condition : accord pour « Zero Data Retention » ou surveillance d'abus modifiée. Sans cela, journaux gardés 30 jours par défaut. Les données de l'API ne servent pas à l'entraînement, sauf accord. — [developers.openai.com, « your data »](https://developers.openai.com/api/docs/guides/your-data)
- **PROUVÉ** — OpenAI : supplément de 10 % sur les points d'accès régionaux pour les modèles sortis à partir du 5 mars 2026. — [developers.openai.com, pricing](https://developers.openai.com/api/docs/pricing)
- **PROUVÉ** — Deepgram : point d'accès européen `api.eu.deepgram.com` pour la transcription. Crédit gratuit de 200 $. — [developers.deepgram.com, custom endpoints](https://developers.deepgram.com/reference/custom-endpoints) ; [deepgram.com/pricing](https://deepgram.com/pricing)
- **PROUVÉ** — Gladia : hébergement par défaut chez un fournisseur européen basé en France. Offre gratuite : l'audio « peut être utilisé pour l'entraînement des modèles » ; offres payantes : non. Conservation par défaut 12 mois, réglable jusqu'à zéro. 50 € de crédit de départ. — [gladia.io/security](https://www.gladia.io/security) ; [gladia.io/pricing](https://www.gladia.io/pricing)
- **PROUVÉ** — Groq : formats acceptés FLAC, MP3, MP4, MPEG, M4A, OGG, WAV, WebM. Fichier max 25 Mo (gratuit) ou 100 Mo. Facturation minimale de 10 secondes par requête. Taux d'erreur annoncé : 10,3 % (v3), 12 % (turbo). — [console.groq.com, speech-to-text](https://console.groq.com/docs/speech-to-text)
- **PROUVÉ** — AssemblyAI : inscription sans carte, 185 heures de pré-enregistré offertes. — [assemblyai.com/pricing](https://www.assemblyai.com/pricing)
- **PROUVÉ** — Azure : 5 heures audio gratuites par mois en transcription temps réel standard (niveau F0). Les prix payants dépendent de la région et n'ont pas été lus. — [azure.microsoft.com, Speech pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)
- **PROUVÉ** — Limites des fonctions Supabase : mémoire 256 Mo ; durée 150 s (gratuit) ou 400 s (payant) ; temps CPU 2 s par requête, hors attente réseau ; délai d'inactivité 150 s. La page ne donne **aucune** limite de taille du corps de requête. — [supabase.com/docs, Edge Functions limits](https://supabase.com/docs/guides/functions/limits)
- **PROUVÉ** — Supabase Storage, offre gratuite : envoi de fichier jusqu'à 50 Mo. — [supabase.com/pricing](https://supabase.com/pricing)

### Inferences
- Coût mensuel de transcription pour 15 dépôts par jour, tous à la voix : 450 dépôts. À 30 s chacun : 225 min → 0,68 $ chez Mistral (225 × 0,003). À 1 min chacun : 450 min → 1,35 $ chez Mistral, 0,30 $ chez Groq turbo (7,5 h × 0,04), 4,59 $ chez Gladia Starter (7,5 h × 0,61).
- Un clip de 2 minutes en AAC pèse probablement 1 à 2 Mo (SUPPOSÉ : débit 64 à 128 kbit/s). Le temps CPU de 2 s est la vraie contrainte : il faut transmettre le fichier tel quel (flux `multipart`), sans conversion en base64 dans la fonction.
- Si la taille du corps pose problème, plan B sûr : le navigateur envoie l'audio dans Supabase Storage (limite 50 Mo prouvée), puis la fonction lit le fichier.
- Choix proposé : Mistral Voxtral Mini Transcribe 2. Raisons : prix le plus bas avec hébergement UE par défaut, société française, français dans la liste. Second choix : Deepgram Nova-3 sur le point d'accès UE. Groq est le moins cher mais aucun hébergement UE n'a été vérifié.
- Rappel : un seul fournisseur de plus = un secret de plus dans Supabase, jamais dans le dépôt public.

### Gaps
- Qualité en français : aucun comparatif indépendant et daté n'a été lu. Les taux d'erreur cités sont ceux des vendeurs. À juger sur dix dépôts réels de Rayan.
- Taille maximale du corps d'une requête vers une fonction Supabase : non documentée. Une discussion GitHub parle d'une limite d'environ 4 Mo, mais elle concerne la taille du code déployé, pas le corps de requête ([supabase/cli #5076](https://github.com/supabase/cli/issues/5076)). À mesurer.
- Non vérifié : formats audio acceptés par Mistral, OpenAI, Deepgram (MP4/AAC de Safari en particulier) ; option UE d'AssemblyAI, ElevenLabs et Groq ; prix payants d'Azure ; modèles Chirp de Google.

---

## 3. Claude : audio, modèles, prix, JSON fiable, coût d'un dépôt

### Takeaway
L'API Claude n'accepte pas l'audio : texte et image seulement. Il faut donc transcrire avant. Le coût d'usage est faible : environ 1,62 $ par mois avec Haiku 4.5 et 3,24 $ avec Sonnet 5.5, pour 15 dépôts par jour et un point du matin. Les « structured outputs » sont en disponibilité générale et garantissent un JSON valide.

### Cited Findings
- **PROUVÉ** — « All current models support text and image input, text output… ». L'audio n'est cité nulle part comme entrée. — [platform.claude.com, Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **PROUVÉ** — Modèles actuels : Claude Fable 5.1 (`claude-fable-5-1`), Claude Opus 5.5 (`claude-opus-5-5`), Claude Sonnet 5.5 (`claude-sonnet-5-5`), Claude Haiku 4.5 (`claude-haiku-4-5-20251001`). Fenêtre : 1 M de jetons, sauf Haiku 4.5 : 200 k. — [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- **PROUVÉ** — Prix par million de jetons (entrée / sortie) : Haiku 4.5 : 1 $ / 5 $. Sonnet 5.5 : 2 $ / 10 $. Opus 5.5 : 4 $ / 20 $. Fable 5.1 : 10 $ / 50 $. — [platform.claude.com, Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- **PROUVÉ** — Cache de prompt, par million de jetons (écriture 5 min / écriture 1 h / lecture) : Haiku 4.5 : 1,25 $ / 2 $ / 0,10 $. Sonnet 5.5 : 2,50 $ / 4 $ / 0,20 $. Opus 5.5 : 5 $ / 8 $ / 0,20 $. — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- **PROUVÉ** — Taille minimale pour mettre en cache : 512 jetons pour Sonnet 5.5 et Opus 5.5 ; **4 096 jetons pour Haiku 4.5**. En dessous, pas de cache et pas d'erreur. Durée : 5 minutes par défaut, 1 heure en option. Un cache automatique existe (`cache_control` au niveau racine). — [platform.claude.com, Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **PROUVÉ** — Traitement par lots : −50 % (Haiku 4.5 : 0,50 $ / 2,50 $ ; Sonnet 5.5 : 1 $ / 5 $). — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- **PROUVÉ** — « Structured outputs » : disponibilité générale. Paramètre `output_config.format` avec `type: "json_schema"`, et `strict: true` sur les outils. JSON toujours valide et conforme au schéma. Modèles : Haiku 4.5, Sonnet 5.5, Opus 5.5, entre autres. Limites : pas de `minimum`/`maximum`/`minLength`/`maxLength` ; 24 paramètres optionnels au plus ; réponse possiblement incomplète si `max_tokens` est atteint ; un refus peut sortir du schéma. Changer le schéma invalide le cache. — [platform.claude.com, Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- **PROUVÉ** — Résidence des données : `inference_geo` vaut `global` (défaut) ou `us`. **Pas d'option UE** sur l'API Claude. Stockage des espaces de travail : `us` seulement. — [platform.claude.com, Data residency](https://platform.claude.com/docs/en/build-with-claude/data-residency)

### Inferences — le calcul

Hypothèses de la demande : dépôt = 1 500 jetons d'entrée + 300 de sortie ; point du matin = 6 000 + 600 ; 15 dépôts par jour ; mois de 30 jours ; sans cache.

- Volume mensuel. Dépôts : 15 × 30 = 450. Entrée : 450 × 1 500 = 675 000. Sortie : 450 × 300 = 135 000. Points du matin : 30. Entrée : 30 × 6 000 = 180 000. Sortie : 30 × 600 = 18 000. Total : **855 000 jetons d'entrée, 153 000 de sortie**.
- **Haiku 4.5** (1 $ / 5 $). Un dépôt : 1 500 × 1/1 000 000 + 300 × 5/1 000 000 = 0,0015 + 0,0015 = **0,0030 $**. Un point du matin : 0,006 + 0,003 = **0,009 $**. Mois : 450 × 0,003 + 30 × 0,009 = 1,35 + 0,27 = **1,62 $**.
- **Sonnet 5.5** (2 $ / 10 $). Un dépôt : 0,003 + 0,003 = **0,006 $**. Un point du matin : 0,012 + 0,006 = **0,018 $**. Mois : 2,70 + 0,54 = **3,24 $**.
- Pour mémoire, **Opus 5.5** (4 $ / 20 $) : 5,40 + 1,08 = **6,48 $** par mois.
- Le cache change peu de choses à cette échelle. Avec Haiku 4.5, un contexte de 1 500 jetons est sous le seuil de 4 096 : aucun cache. Avec Sonnet 5.5, le cache de 5 minutes ne sert que si deux dépôts se suivent en moins de 5 minutes.
- Chaîne complète voix → Claude avec Sonnet 5.5 et Voxtral, 450 dépôts d'une minute : 3,24 + 1,35 = environ **4,60 $ par mois et par utilisateur**.
- Pour le tri d'un dépôt (classer, découper, proposer une étape), commencer par Haiku 4.5 avec un schéma JSON strict, et mesurer. Passer à Sonnet 5.5 pour le point du matin si la qualité manque. Le proxy actuel plafonne `max_tokens` à 1 500 et limite les modèles à `ALLOWED_MODELS` : compatible avec ces volumes.
- Pour une vente en Europe : les textes des utilisateurs partent vers une API sans option UE. C'est un point à traiter dans les mentions légales et le contrat de sous-traitance (SUPPOSÉ sur le plan juridique ; le fait technique est prouvé).

### Gaps
- La page de prix ne porte pas de date. Les chiffres sont ceux affichés le 5 octobre 2026.
- Les volumes (1 500 / 300 / 6 000 / 600) sont des hypothèses. Le surcoût en jetons du schéma JSON (prompt système ajouté) n'a pas été mesuré.

---

## 4. Capture hors ligne sur iOS

### Takeaway
Background Sync n'existe pas dans Safari. La file d'attente doit être vidée par l'application elle-même, à l'ouverture et au retour du réseau. Le stockage d'une application installée est large et son compteur de 7 jours est remis à zéro à chaque usage.

### Cited Findings
- **PROUVÉ** — Background Sync (`SyncManager`) : Chrome depuis 49 ; Safari Mac et iOS : non ; Firefox : non. — [MDN browser-compat-data, api/SyncManager.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/SyncManager.json) ; [caniuse, Background Sync](https://caniuse.com/background-sync)
- **PROUVÉ** — Règle des 7 jours : Safari efface tout le stockage écrit par script (IndexedDB, LocalStorage, enregistrements de service worker…) après sept jours d'usage de Safari sans interaction avec le site. — [WebKit, « Full Third-Party Cookie Blocking and More » (24 mars 2020)](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- **PROUVÉ** — Exception : « Web applications added to the home screen are not part of Safari and thus have their own counter of days of use. » L'usage réel de l'application remet le compteur à zéro. — [même page](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- **PROUVÉ** — Quotas : jusqu'à 60 % du disque par origine, 80 % au total. Mêmes quotas en mode installé. L'éviction se fait par origine entière, la moins récemment utilisée d'abord. — [WebKit, « Updates to Storage Policy » (10 août 2023)](https://webkit.org/blog/14403/updates-to-storage-policy/)
- **PROUVÉ** — `navigator.storage.persist()` : WebKit accorde la demande selon des heuristiques, « like whether the website is opened as a Home Screen Web App ». Disponible depuis Safari 15.2 ; `estimate()` depuis Safari 17. — [même page](https://webkit.org/blog/14403/updates-to-storage-policy/) ; [MDN browser-compat-data, api/StorageManager.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/StorageManager.json)
- **PROBABLE, en conflit** — Un guide de mars 2026 affirme : « If a user doesn't open your PWA for a week, all cached data is gone. » — [MagicBell (mis à jour le 20 mars 2026)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) ; **contredit** par le texte WebKit ci-dessus, qui compte des jours d'usage et non des jours de calendrier.

### Inferences
- Conception minimale : chaque dépôt est écrit d'abord dans IndexedDB avec un UUID créé sur l'appareil et un état `en_attente`. L'envoi est tenté tout de suite, puis à chaque ouverture, à chaque retour au premier plan (`visibilitychange`) et à l'événement `online`. L'UUID rend le renvoi sans danger (voir question 9).
- Appeler `navigator.storage.persist()` une fois, en mode installé.
- Les blobs audio se rangent dans IndexedDB. Quelques mégaoctets en attente ne posent pas de problème de quota. Les supprimer après envoi confirmé.
- Limite à accepter : un dépôt fait hors ligne ne part pas tant que l'application n'est pas rouverte. Il faut l'afficher clairement (« 2 pensées en attente d'envoi »).
- Le service worker actuel (`sw.js`, réseau d'abord, cache `arc-v5`) sert déjà la page hors ligne. Il n'a pas à porter la file d'attente.

### Gaps
- Non testé : comportement réel de l'éviction sur l'iPhone de Rayan quand le disque est presque plein.
- Le conflit entre MagicBell et WebKit n'a pas été tranché par un test ; la source officielle est retenue.

---

## 5. Accès rapide sans application native

### Takeaway
Sur iPhone, le meilleur accès rapide est un raccourci Apple (app Raccourcis) qui envoie un texte à une fonction Supabase par HTTPS, déclenché par le bouton Action, Siri, le centre de contrôle ou un double tap au dos. Le « Web Share Target » et les `shortcuts` du manifeste ne marchent pas sur iOS.

### Cited Findings
- **PROUVÉ** — Un raccourci Apple se lance par Siri (en disant son nom), depuis l'écran d'accueil, un widget, l'Apple Watch, la feuille de partage d'une autre app, le bouton Action, un tap au dos, le centre de contrôle, la recherche, ou une automatisation. — [Apple, Guide Raccourcis (iOS 27)](https://support.apple.com/guide/shortcuts/intro-to-shortcuts-apdf22b0444c/ios)
- **PROUVÉ** — L'action « Obtenir le contenu de l'URL » sait faire GET, POST, PUT, PATCH, DELETE. En POST, un « corps de requête » JSON, formulaire ou fichier peut être envoyé. — [Apple, « Request your first API »](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios)
- **PROUVÉ** — Un raccourci activé pour la feuille de partage reçoit le contenu partagé par l'app d'origine. — [Apple, « Launch a shortcut from another app »](https://support.apple.com/guide/shortcuts/launch-a-shortcut-from-another-app-apd163eb9f95/ios)
- **PROUVÉ** — « Toucher le dos de l'appareil » : iPhone 8 ou plus récent, iOS 14 ou plus ; double ou triple tap ; peut lancer un raccourci. — [Apple, Back Tap](https://support.apple.com/en-us/111772)
- **PROUVÉ** — `share_target` du manifeste : Chrome Android 76, Chrome bureau 89 ; **Safari : non** (Mac et iOS). — [MDN browser-compat-data, manifests/webapp/share_target.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/manifests/webapp/share_target.json)
- **PROUVÉ** — `shortcuts` du manifeste : Safari Mac 17.4 oui ; **Safari iOS : non** ; Chrome Android 84. — [MDN browser-compat-data, manifests/webapp/shortcuts.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/manifests/webapp/shortcuts.json)
- **PROUVÉ** — Sur iOS 26, tout site ajouté à l'écran d'accueil s'ouvre par défaut comme application web ; plus aucune condition d'« installabilité ». — [WebKit, Safari 26.0 (15 sept. 2025)](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- **PROUVÉ** — Mac : « Ajouter au Dock » demande macOS Sonoma 14 ou plus. L'application web est rangée dans Applications, s'ouvre depuis le Dock ou Spotlight, peut s'ouvrir à la connexion, affiche notifications et pastille. Elle ne partage ni cookies ni données avec Safari. — [Apple, Safari web apps on Mac](https://support.apple.com/en-us/104996)
- **PROUVÉ** — Raycast : un « Quicklink » ouvre une URL avec un argument tapé (`{argument name="query"}`), peut recevoir un raccourci clavier, et s'ouvre dans l'application choisie ou le navigateur par défaut. — [Raycast, Quicklinks](https://manual.raycast.com/quicklinks)

### Inferences
- **Raccourci « Déposer »** (iPhone) : action « Dicter du texte » (ou « Demander une entrée »), puis « Obtenir le contenu de l'URL » en POST vers une fonction Supabase, avec un secret personnel. Lancé par le bouton Action ou « Dis Siri, déposer ». Le dépôt se fait sans ouvrir ARC. L'existence de l'action « Dicter du texte » et la possibilité d'ajouter des en-têtes HTTP sont SUPPOSÉES (mémoire) ; la page Apple lue ne les décrit pas.
- Ce raccourci ne peut pas utiliser la session e-mail d'ARC. Il lui faut un jeton à part, par utilisateur, révocable, vérifié par la fonction (même schéma que la question 8, option b). Ce jeton vit dans le raccourci, sur le téléphone.
- Pour partager un lien ou un texte vers ARC depuis une autre app : passer par le même raccourci dans la feuille de partage, puisque `share_target` n'existe pas sur iOS.
- Mac : installer ARC avec « Ajouter au Dock », puis un raccourci clavier global via l'app Raccourcis de macOS ou via Raycast (Quicklink vers l'URL d'ARC avec `?depot=…`). Les `shortcuts` du manifeste donneraient un menu sur l'icône du Dock (Safari 17.4+).
- SUPPOSÉ : sur iPhone, un raccourci « Ouvrir l'URL » ouvre Safari, pas l'application installée. D'où la préférence pour le POST direct.

### Gaps
- Non vérifié sur une page Apple lue : les modèles d'iPhone qui ont le bouton Action (les pages d'aide n'ont pas rendu leur contenu : [lien](https://support.apple.com/guide/iphone/use-and-customize-the-action-button-iphe89d61d66/ios)) ; les contrôles de l'écran verrouillé ; les en-têtes HTTP dans « Obtenir le contenu de l'URL ».
- Alfred n'a pas été étudié.
- Non testé : dictée dans un raccourci lancé depuis l'écran verrouillé (déverrouillage exigé ou non).

---

## 6. Notifications : « le retour à l'heure convenue »

### Takeaway
Le Web Push marche sur iPhone depuis iOS 16.4, uniquement pour une application ajoutée à l'écran d'accueil, y compris dans l'UE. Le « Declarative Web Push » (iOS 18.4+) est la forme la plus fiable. L'envoi se programme avec `pg_cron` qui appelle une fonction Supabase. Un e-mail quotidien reste le filet de sécurité le plus simple.

### Cited Findings
- **PROUVÉ** — Web Push sur iOS/iPadOS 16.4 : réservé aux applications web de l'écran d'accueil, dont le manifeste a `display: standalone` ou `fullscreen`. La demande d'autorisation doit suivre un geste direct de l'utilisateur (un bouton). Pastille d'icône (`setAppBadge`) et modes de concentration pris en charge. — [WebKit, « Web Push for Web Apps on iOS and iPadOS » (16 févr. 2023)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- **PROUVÉ** — `PushManager` : Safari iOS 16.4 (« web apps saved to the home screen »), Safari Mac 16 (macOS Ventura et plus), Chrome 42. — [MDN browser-compat-data, api/PushManager.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/PushManager.json)
- **PROUVÉ** — Declarative Web Push : iOS/iPadOS 18.4. Le message est un JSON normalisé (`"web_push": 8030`, objet `notification` avec `title`, `body`, `navigate` obligatoire, `app_badge`…). Plus besoin de service worker (`window.pushManager`). Plus fiable : l'abonnement ne dépend plus de l'enregistrement du service worker, que la prévention du pistage peut effacer, et plus de « pénalité de push silencieux ». Le même message marche sur les anciens navigateurs via le service worker. — [WebKit, « Meet Declarative Web Push » (27 mars 2025)](https://webkit.org/blog/16535/meet-declarative-web-push/) ; [WebKit, Safari 18.4 (31 mars 2025)](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- **PROBABLE** — Épisode DMA de 2024 : fin janvier 2024, la bêta d'iOS 17.4 retire les applications web de l'écran d'accueil dans l'UE. Le 1er mars 2024, Apple revient en arrière : « we will continue to offer the existing Home Screen web apps capability in the EU », avec la précision qu'elles restent construites sur WebKit. Retour effectif avec iOS 17.4, début mars 2024. — [9to5Mac (1er mars 2024), citant Apple](https://9to5mac.com/2024/03/01/apple-home-screen-web-apps-ios-17-eu/) ; [Open Web Advocacy (1er mars 2024)](https://open-web-advocacy.org/blog/apple-backs-off-killing-web-apps/)
- **PROBABLE, en conflit** — Un guide mis à jour le 20 mars 2026 écrit encore que les PWA ne tournent plus en mode autonome dans l'UE et que le push y est retiré. — [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) ; **contredit** par la déclaration d'Apple du 1er mars 2024 ci-dessus. Cette affirmation paraît périmée.
- **PROUVÉ** — La page Apple actuelle sur le DMA ne contient plus aucune mention des applications web de l'écran d'accueil. — [developer.apple.com, DMA and apps in the EU](https://developer.apple.com/support/dma-and-apps-in-the-eu/)
- **PROUVÉ** — Supabase Cron repose sur `pg_cron`. Un travail peut lancer du SQL, une fonction de base, ou une requête HTTP vers une fonction Edge (`pg_net`). Fréquence : de la seconde à l'année. Conseils : 8 travaux simultanés au plus, 10 minutes au plus par travail. Les identifiants se rangent dans Supabase Vault. — [supabase.com/docs, Cron](https://supabase.com/docs/guides/cron) ; [supabase.com/docs, Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- **PROUVÉ** — Les fonctions Supabase ne peuvent pas sortir par les ports 25 et 587 (SMTP). — [Edge Functions limits](https://supabase.com/docs/guides/functions/limits)
- **PROUVÉ** — E-mail par API HTTP, exemple Resend : offre gratuite de 3 000 e-mails par mois, 100 par jour ; ensuite 20 $ par mois pour 50 000. — [resend.com/pricing](https://resend.com/pricing)

### Inferences
- Montage : table `rendez_vous` (utilisateur, heure, type). Un travail `pg_cron` toutes les 5 ou 15 minutes appelle une fonction. La fonction prépare le point (Claude), puis envoie un push déclaratif à chaque abonnement de l'utilisateur. L'envoi demande des clés VAPID, à ranger dans les secrets Supabase (SUPPOSÉ pour le détail du chiffrement Web Push dans Deno : non vérifié).
- Fiabilité : la livraison d'un push n'est jamais garantie, et l'heure peut glisser de quelques minutes. Il faut donc que le point du matin soit aussi visible à l'ouverture d'ARC, et prévoir un e-mail quotidien de secours (API HTTP, pas SMTP).
- Abonnement calendrier (.ics) : une fonction Supabase peut servir un fichier `.ics` par une URL secrète. Les calendriers rafraîchissent un abonnement à leur rythme, souvent en heures. Bon pour une revue hebdomadaire fixe, mauvais pour un rappel précis (SUPPOSÉ ; aucune source lue).
- Sur Mac, le push marche dans Safari 16+ et dans l'application du Dock (pastille et notifications prouvées plus haut).

### Gaps
- État 2026 dans l'UE : aucune page Apple datée de 2026 ne confirme noir sur blanc que les applications web de l'écran d'accueil et le push fonctionnent dans l'UE. La preuve est la déclaration de mars 2024 rapportée par la presse, et l'absence de toute restriction dans les notes Safari 18.4, 26.0 et 27.0. Rayan est en France : un test de cinq minutes sur son iPhone tranche la question.
- Non vérifié : `pg_cron` sur l'offre gratuite (les pages de doc ne parlent pas d'offre) ; durée de vie réelle d'un abonnement push sur iOS ; bibliothèque Web Push compatible Deno.
- Non lu : documentation Apple sur les calendriers par abonnement.

---

## 7. Photo d'un document

### Takeaway
Faisable sans difficulté. Un champ fichier ouvre l'appareil photo sur iPhone. Claude lit l'image pour environ 0,13 à 1 centime selon le modèle et la taille. Il faut réduire l'image dans le navigateur avant envoi.

### Cited Findings
- **PROUVÉ** — Attribut `capture` de `<input>` : Safari iOS depuis la version 10, Chrome Android 25. Non pris en charge sur ordinateur (Safari Mac, Chrome bureau) : le champ ouvre alors un sélecteur de fichier. — [MDN browser-compat-data, api/HTMLInputElement.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/HTMLInputElement.json)
- **PROUVÉ** — Claude vision : formats JPEG, PNG, GIF, WebP. Image max 8 000 × 8 000 px et 10 Mo encodée en base64 sur l'API. Requête max 32 Mo. — [platform.claude.com, Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- **PROUVÉ** — Coût en jetons : ⌈largeur/28⌉ × ⌈hauteur/28⌉. Plafond standard : côté long 1 568 px, 1 568 jetons. Plafond haute résolution (« Claude 4.7 and later ») : côté long 2 576 px, 4 784 jetons. Une image de 1 000 × 1 000 px = 1 296 jetons. Exemple officiel : environ 1,30 $ pour mille images de cette taille avec Haiku 4.5. — [Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- **PROUVÉ** — Supabase Storage : aucun envoi n'est permis dans un bucket sans règle RLS. Les règles se posent sur `storage.objects`. Modèle classique : chaque utilisateur n'accède qu'à son dossier, comparé à `auth.jwt()->>'sub'` via `storage.foldername()`. La clé de service contourne les règles. — [supabase.com/docs, Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- **PROUVÉ** — Offre gratuite : 1 Go de stockage, 50 Mo par fichier, 5 Go de sortie. — [supabase.com/pricing](https://supabase.com/pricing)

### Inferences
- Coût par image (calcul) : 1 296 jetons → Haiku 4.5 : 1 296 × 1/1 000 000 = 0,0013 $ ; Sonnet 5.5 : 0,0026 $. Photo pleine résolution au plafond haute résolution, 4 784 jetons → Sonnet 5.5 : 0,0096 $ ; Opus 5.5 : 0,019 $. Ajouter la sortie.
- Haiku 4.5 est au plafond standard (1 568 jetons) puisqu'il précède la série 4.7 (déduction du libellé « Claude 4.7 and later »). Pour un document dense à petits caractères, Sonnet 5.5 en haute résolution lira mieux.
- Une photo d'iPhone pèse plusieurs Mo. La réduire dans le navigateur (canvas, côté long 1 568 ou 2 576 px, JPEG) avant envoi : moins de données, moins de temps CPU dans la fonction, coût maîtrisé.
- Le proxy actuel devra accepter des blocs `image` et un corps plus lourd. Garder l'image dans un bucket privé, dossier = identifiant du compte ; ne jamais rendre le bucket public.
- SUPPOSÉ : Safari iOS convertit une photo HEIC en JPEG quand le champ demande `accept="image/*"`. À tester.

### Gaps
- Non vérifié : la conversion HEIC → JPEG ; la taille maximale du corps de requête de la fonction (voir question 2).
- Le PDF n'a pas été étudié (hors question).

---

## 8. « Point d'étape » automatique depuis les sessions Claude Code

### Takeaway
La conception la plus sûre est une commande volontaire (`/point-etape`, un « skill ») qui fait rédiger un petit JSON par Claude, puis l'envoie à une fonction Supabase avec un secret propre au projet, gardé sur le Mac. Un déclenchement automatique à chaque fin de réponse (`Stop`) serait bruyant ; `SessionEnd` ne peut pas faire écrire Claude.

### Cited Findings
- **PROUVÉ** — Événements de hook existants, entre autres : `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop` (« When Claude finishes responding »), `SubagentStop`, `PreCompact`, `PostCompact`, `SessionEnd` (« When a session terminates »). — [code.claude.com, Hooks reference](https://code.claude.com/docs/en/hooks)
- **PROUVÉ** — Emplacements : `~/.claude/settings.json` (toute la machine, non partagé), `.claude/settings.json` (projet, peut être commité), `.claude/settings.local.json` (projet, ignoré par git). Structure : `"hooks": { "Stop": [ { "matcher": "...", "hooks": [ { "type": "command", "command": "...", "timeout": 30 } ] } ] }`. — [Hooks reference](https://code.claude.com/docs/en/hooks)
- **PROUVÉ** — Types de hook : `command` (script, JSON reçu sur l'entrée standard), `http` (POST du JSON vers une URL, avec `headers` et `allowedEnvVars` pour injecter un secret d'environnement comme `Bearer $MY_TOKEN`), `mcp_tool`, `prompt`, `agent`. Option `async` pour ne pas bloquer. — [Hooks reference](https://code.claude.com/docs/en/hooks)
- **PROUVÉ** — Le hook `Stop` reçoit `session_id`, `transcript_path`, `cwd`, `last_assistant_message` (texte complet de la dernière réponse), `stop_reason`. Il peut empêcher l'arrêt (`decision: "block"`). — [Hooks reference](https://code.claude.com/docs/en/hooks)
- **PROUVÉ** — Le hook `SessionEnd` reçoit `session_id`, `transcript_path`, `cwd`, `reason` (`clear`, `resume`, `logout`, `prompt_input_exit`, `other`). Il ne peut rien bloquer, sa sortie est ignorée. Budget partagé de 1,5 seconde, relevable jusqu'à 60 s par le `timeout` du hook. — [Hooks reference](https://code.claude.com/docs/en/hooks)
- **PROUVÉ** — Skills : `~/.claude/skills/<nom>/SKILL.md` (personnel) ou `.claude/skills/<nom>/SKILL.md` (projet). Lancement par `/nom`. `disable-model-invocation: true` empêche Claude de le lancer seul. `allowed-tools` pré-autorise des outils. Un skill peut exécuter un script (`${CLAUDE_SKILL_DIR}/scripts/...`). Les anciennes commandes `.claude/commands/*.md` marchent encore et sont fusionnées dans les skills. — [code.claude.com, Skills](https://code.claude.com/docs/en/skills)
- **PROUVÉ** — API GitHub « contenu d'un dépôt » : sans authentification pour un dépôt public ; pour un dépôt privé, jeton à permission « Contents » en lecture. Contenu brut avec `application/vnd.github.raw+json`. — [docs.github.com, Repository contents](https://docs.github.com/en/rest/repos/contents)
- **PROUVÉ** — GitHub Actions : gratuit pour les dépôts publics avec les exécuteurs standards ; 2 000 minutes par mois pour les dépôts privés sur GitHub Free. — [docs.github.com, Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- **PROUVÉ** — Secrets GitHub Actions : accessibles par `${{ secrets.NOM }}`, masqués dans les journaux, non transmis aux workflows lancés depuis un fork (sauf `GITHUB_TOKEN`). — [docs.github.com, Using secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- **PROUVÉ** — Supabase : jusqu'à 100 secrets par projet, 100 fonctions sur l'offre gratuite. — [Edge Functions limits](https://supabase.com/docs/guides/functions/limits)

### Inferences — comparaison (analyse de l'auteur, à partir des faits ci-dessus)

| | (a) Fichier `arc_pulse.json` dans le dépôt, lu par ARC | (b) Envoi direct à une fonction Supabase | (c) GitHub Action à chaque push |
|---|---|---|---|
| Principe | Un skill `/point-etape` fait écrire le JSON par Claude et le commite. ARC le lit sur GitHub. | Le même skill écrit le JSON, puis un script le POSTe avec un secret par projet. | Un workflow lit `arc_pulse.json` au push et le POSTe. |
| Coût | 0 $. | 0 $ (quelques appels par jour sur 500 000 offerts). | 0 $ en dépôt public ; minutes comptées en privé. |
| Dépôt public | Simple, mais le point d'étape est lisible par tous. | Sans objet. | Sans objet. |
| Dépôt privé | ARC est une page statique publique : il lui faudrait un jeton GitHub. Ce jeton ne peut pas être dans le code. Il faut donc une fonction Supabase qui lit GitHub : on retombe sur (b), en plus compliqué. | Aucun jeton GitHub. | Secret rangé dans GitHub Secrets. |
| Risque de fuite | Faible (pas de secret), sauf dépôt privé. | Secret sur le Mac : le mettre dans une variable d'environnement du shell ou dans `settings.local.json`, jamais dans `.claude/settings.json` commité. | Secret chez GitHub, masqué dans les journaux. |
| Risque de bruit | Un commit par point d'étape. | Faible si le déclenchement est volontaire. | Un envoi par push, même sans nouveauté. |
| Ce que Rayan doit faire | Créer le skill dans chaque projet ; rendre le dépôt public ou gérer un jeton. | Créer le skill (une fois, dans `~/.claude/skills`), générer un secret par projet, le poser sur le Mac et dans Supabase. | Ajouter un workflow et un secret dans chaque dépôt, et quand même produire le fichier. |

- **Recommandation : (b) avec déclenchement volontaire.** Un skill personnel `/point-etape`, `disable-model-invocation: true`. Claude remplit un JSON court et fixe (projet, date, fait, en cours, bloquant, prochaine étape). Un script l'envoie. La fonction vérifie le secret, valide le schéma, limite la taille, et **ajoute** une ligne dans une table `points_etape` (jamais d'écrasement). ARC affiche le dernier point par projet, avec sa date.
- Pourquoi pas tout automatique. `Stop` se déclenche à chaque fin de réponse : des dizaines d'envois par session. `SessionEnd` se déclenche une fois, mais Claude ne tourne plus : un script devrait résumer lui-même la transcription, ou envoyer du texte brut. Le hook `http` natif envoie l'entrée brute du hook (dont `last_assistant_message` et des chemins du Mac), pas un rapport propre.
- Compromis possible : un hook `SessionEnd` de type `command` qui envoie seulement « session terminée sans point d'étape » si aucun point n'a été publié. C'est un rappel, pas un rapport.
- Rapports faux : le point est rédigé par un modèle, il peut annoncer « terminé » à tort. Garde-fous : la règle du projet (« une cause se prouve ») reprise dans le skill, un champ `preuve` (commit ou commande), l'affichage de la date et de la source dans ARC, et la relecture par Rayan avant envoi (le skill montre le JSON puis demande confirmation).
- Sécurité de la fonction : elle ne passe pas par la session e-mail. Un secret par projet, long et aléatoire, comparé à une empreinte stockée ; droit d'ajout seulement ; révocable projet par projet. La fonction actuelle `ARC-CLAUDE-PROXY` vérifie le compte `ARC_OWNER_ID` : la nouvelle fonction doit être séparée.

### Gaps
- Non vérifié : le caractère public ou privé des dépôts ARYAN et Atlas.
- Non vérifié : le comportement des hooks dans l'extension VS Code (la doc lue décrit Claude Code en général).
- Non lu : la configuration Supabase pour désactiver la vérification du jeton de session sur une fonction (`verify_jwt`).

---

## 9. Conflits de synchronisation et limites de l'offre gratuite

### Takeaway
Le blob unique en « dernier qui écrit gagne » peut effacer une pensée déposée sur le téléphone si le Mac enregistre ensuite un état plus ancien. Le remède minimal : sortir les pensées du blob, dans une table où l'on ne fait qu'ajouter, avec un identifiant créé sur l'appareil. Le Realtime est inclus dans l'offre gratuite. Le vrai risque de l'offre gratuite est la mise en pause après une semaine d'inactivité.

### Cited Findings
- **PROUVÉ** — Offre gratuite Supabase : base de 500 Mo par projet ; 1 Go de stockage de fichiers, 50 Mo par fichier ; 5 Go de sortie ; 50 000 utilisateurs actifs par mois ; 500 000 appels de fonctions ; Realtime : 200 connexions simultanées et 2 millions de messages ; 2 projets actifs au plus ; **projet mis en pause « after 1 week of inactivity »**. — [supabase.com/pricing](https://supabase.com/pricing)
- **PROUVÉ** — Offre Pro : 25 $ par mois ; jamais de pause ; 8 Go de disque ; 100 Go de stockage ; 2 millions d'appels de fonctions ; 500 connexions Realtime. — [supabase.com/pricing](https://supabase.com/pricing)
- **PROUVÉ** — Realtime « Postgres Changes » : chaque événement est contrôlé par les règles RLS pour chaque abonné. La table doit être ajoutée à la publication `supabase_realtime` (`alter publication supabase_realtime add table ...`). La doc ne cite aucune restriction d'offre. Débit estimé : environ 64 changements par seconde. — [supabase.com/docs, Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- **PROUVÉ (dépôt ARC)** — État actuel : table `arc_data` (`user_id`, `state` jsonb, `updated_at`), une ligne par compte, règles `arc_select_own`, `arc_insert_own`, `arc_update_own`, pas de règle de suppression. — `/home/claude/arc/CLAUDE.md`, section « Supabase : état au 4 octobre »

### Inferences — conception minimale (analyse de l'auteur)
- **Table `thoughts`, ajout seulement.** Colonnes : `id uuid` (créé sur l'appareil avec `crypto.randomUUID()`, clé primaire), `user_id`, `created_at` (heure de l'appareil), `received_at` (heure du serveur), `source` (iphone, mac, raccourci), `raw_text`, `audio_path`, `status`. Règles RLS : `select` et `insert` sur ses propres lignes, **aucune règle `update` ni `delete`** sur le texte brut. Une pensée déposée ne peut donc plus être écrasée par un autre appareil.
- **Envoi sans doublon.** L'identifiant vient de l'appareil : renvoyer deux fois la même pensée donne un conflit de clé primaire, que le client traite comme un succès. La file d'attente hors ligne (question 4) devient sûre.
- **Le travail de l'IA à part.** Les éléments issus du tri (items, prochaine étape, « moment ») vont dans une table `items`, une ligne par élément, avec `updated_at` par ligne et `thought_id`. Le « dernier qui écrit gagne » s'applique alors à un seul élément, pas à tout l'état. Cocher une tâche sur le Mac n'efface plus rien d'autre.
- **Le blob `arc_data` reste** pour les réglages et l'ancien contenu, le temps de la migration vers `S.worlds` (chantier 2 de l'audit). Garde-fou simple en attendant : n'écrire le blob que si `updated_at` en base est égal à celui lu ; sinon relire et fusionner.
- **Realtime est un confort, pas la sécurité.** S'abonner aux insertions de `thoughts` fait apparaître sur le Mac la pensée dictée sur le téléphone. La sécurité vient de la table en ajout seul. En secours : relire les lignes dont `received_at` est plus récent que la dernière lecture, à chaque retour au premier plan. Un utilisateur avec deux appareils = 2 connexions sur 200.
- **Limites qui comptent.** 500 Mo de base : très large pour du texte. 1 Go de stockage : environ 500 à 1 000 clips de 2 minutes (SUPPOSÉ : 1 à 2 Mo par clip) ; supprimer l'audio après transcription règle la question. 500 000 appels : environ 500 par mois pour un utilisateur. **La pause après une semaine sans activité** est le seul vrai danger ; ARC a déjà été « rallumé » le 4 octobre. Avant de vendre, passer à l'offre Pro (25 $ par mois).

### Gaps
- Non vérifié : ce que Supabase compte comme « activité » pour éviter la pause, et si un travail `pg_cron` quotidien suffit.
- Non vérifié : `pg_cron` et Vault sur l'offre gratuite.
- Aucune mesure de la taille actuelle du blob `state` ni du nombre d'écritures par jour (aucune lecture de la base n'a été faite, conformément aux règles du projet).
