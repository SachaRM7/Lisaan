# Apprendre l'arabe MSA avec YouTube — Le guide complet

> **Le principe :** extraire le vocabulaire d'une vidéo YouTube en arabe standard, le transformer en flashcards Anki, réviser 10-15 min, puis regarder la vidéo. Pas de manuels. Pas d'appli. Juste du contenu réel et un algorithme entraîné sur 700 millions de révisions.

---

## Pourquoi ça marche

Ton cerveau retient un mot quand il est attaché à une émotion, une voix, une scène. Un mot isolé sur un écran vert Duolingo est oublié en 48h — c'est la courbe de l'oubli d'Ebbinghaus, prouvée depuis 1885.

Le seul antidote : la **répétition espacée** (revoir un mot juste avant de l'oublier) combinée à **l'ancrage contextuel** (le retrouver dans une vraie situation).

Ce guide fait les deux en même temps.

---

## Les outils (tous gratuits)

| Outil | Rôle |
|---|---|
| **YouTube** | Source de contenu MSA avec sous-titres |
| **NotebookLM** (Google) | Extraction du vocabulaire depuis la transcription |
| **Claude** | Formatage en CSV pour Anki |
| **Anki** | Répétition espacée avec l'algorithme FSRS |

---

## Étape 0 — Choisir ses chaînes YouTube

Le MSA pur à l'oral est rare dans les séries. En revanche, YouTube en regorge. Voici des chaînes adaptées par niveau :

### Débutant-intermédiaire
- **AJ+ عربي** — actualité en MSA accessible, 3-8 min, sous-titres arabes intégrés
- **TED بالعربي** — conférences TED doublées en MSA, vocabulaire riche
- **DW عربية** — Deutsche Welle en arabe, diction très claire

### Intermédiaire-avancé
- **الجزيرة وثائقية** — documentaires Al Jazeera, MSA soutenu
- **Al Arabiya العربية** — reportages et analyses
- **Kerning Cultures عربي** — podcasts narratifs (version vidéo YouTube)

### Contenu "facile" mais efficace
- **Dessins animés doublés en MSA** (rechercher "فيلم كرتون بالعربية الفصحى") — diction lente, vocabulaire du quotidien, parfait pour débuter

**Règle :** choisis du contenu qui t'intéresse. Le système tombe à l'eau si la vidéo t'ennuie.

---

## Étape 1 — Récupérer la transcription

### Option A : Transcription YouTube intégrée
1. Ouvrir la vidéo YouTube
2. Cliquer sur **"...Plus"** sous la vidéo → **"Afficher la transcription"**
3. Copier tout le texte

### Option B : Outil externe (si pas de sous-titres)
- **Tactiq** ou **YouTube Transcript API** — extensions navigateur gratuites qui extraient le texte
- **Downsub.com** — coller l'URL, télécharger les sous-titres en .txt ou .srt
- Si la vidéo n'a aucun sous-titre : **Whisper** (modèle open-source d'OpenAI) transcrit l'audio en arabe avec une bonne précision

### Option C : Sous-titres SRT
Si tu récupères un fichier .srt, copie-colle le contenu brut. Les timestamps ne gênent pas NotebookLM.

⏱ **Temps : 1-2 minutes**

---

## Étape 2 — NotebookLM : extraction du vocabulaire

1. Ouvrir **notebooklm.google.com**
2. Créer un nouveau notebook
3. Ajouter la transcription comme source texte (coller ou importer PDF/txt)

### Le prompt à envoyer :

```
I'm learning Modern Standard Arabic (فصحى). My level: [A2/B1/B2].

From this transcript, extract the 40 most useful words and
expressions for a learner at my level.

Focus on:
- Common MSA verbs and their conjugated forms in the text
- Phrasal constructions and idiomatic expressions
- Connectors and discourse markers (إذن، بالتالي، على الرغم من...)
- Vocabulary specific to the topic of this video
- Any word that appears multiple times (high frequency = high value)

Skip: basic pronouns, numbers, days of the week, greetings.

For each item provide:
1. The word/expression in Arabic WITH FULL TASHKEEL (تشكيل)
2. Transliteration in Latin script
3. Translation in French
4. The exact sentence from the transcript where it appears
5. French translation of that sentence

Numbered list. Maximum 40 items.
Every example sentence must come directly from the transcript.
```

### Ajustements selon ton niveau :
- **Si trop facile :** "Too basic. Only B1-B2 level and above. Remove anything below A2."
- **Si trop dur :** "Include 10 high-frequency A2 words alongside the harder items."
- **Pour cibler un thème :** "Focus specifically on [politique / science / vie quotidienne] vocabulary."

### Bonus NotebookLM
Après l'extraction, tu peux générer un **Audio Overview** : deux voix IA discutent du contenu de la vidéo en anglais. Ça te donne une couche supplémentaire de compréhension avant de regarder.

Tu peux aussi poser des questions libres :
- *"Quels sont les mots les plus fréquents dans cette transcription ?"*
- *"Donne-moi 5 phrases utilisant le verbe يُحَاوِلُ tel qu'il apparaît dans le texte."*

⏱ **Temps : 3-5 minutes**

---

## Étape 3 — Claude : formatage CSV

NotebookLM extrait. Claude structure. Deux modèles, deux tâches, zéro perte de qualité.

### Le prompt à envoyer dans Claude :

```
Voici une liste de vocabulaire arabe extraite d'une transcription.
Crée un CSV à deux colonnes :

Colonne 1 (recto) : la phrase en français avec le mot cible
traduit. Après la phrase, entre parenthèses :
le mot en arabe avec tashkeel + translittération.

Colonne 2 (verso) : la phrase originale en arabe tirée de
la transcription, exactement telle quelle.

Format CSV, séparé par des virgules.
Chaque ligne = une flashcard.
Ne modifie pas les phrases arabes originales.
Mets les champs entre guillemets si nécessaire.
```

Puis coller la sortie de NotebookLM.

### Vérification :
1. Copier le CSV renvoyé par Claude
2. Coller dans **Google Sheets**
3. Vérifier : deux colonnes propres, pas de décalage
4. Télécharger en **.csv** (Fichier → Télécharger → .csv)

⏱ **Temps : 2-3 minutes**

---

## Étape 4 — Anki : import et configuration FSRS

### Premier import
1. Ouvrir **Anki** (gratuit sur desktop et Android, 25€ une fois sur iOS)
2. Créer un paquet → le nommer (ex: *"MSA — AJ+ عربي"*)
3. Fichier → Importer → sélectionner le .csv
4. Séparateur : virgule
5. Colonne 1 = Recto, Colonne 2 = Verso
6. Importer

### Activer FSRS (à faire une seule fois)
L'algorithme FSRS a remplacé l'ancien SM-2 (datant de 1987). Il est entraîné sur 700 millions de révisions réelles et modélise **ta** courbe d'oubli personnelle.

1. Options du paquet (icône engrenage)
2. Descendre jusqu'à **FSRS**
3. **Activer**
4. **Rétention souhaitée : 0.90**

> ⚠️ Ne monte pas au-dessus. Passer de 0.90 à 0.95 double ta charge quotidienne. 0.97 la quadruple. 0.90 est le point optimal confirmé par la recherche.

### Réglages complémentaires
- **Étapes d'apprentissage :** 1m 10m (pas plus de 12h)
- **Boutons :** utiliser uniquement **"À revoir"** et **"Correct"** — les boutons "Difficile" et "Facile" perturbent l'optimisation FSRS

---

## Étape 5 — La boucle quotidienne

### L'ordre est crucial. Tout le monde le fait à l'envers.

```
❌ Mauvais : regarder → ne pas comprendre → frustration → oublier

✅ Bon : cartes d'abord → vidéo ensuite → compréhension → ancrage
```

### Le rituel :

1. **Réviser les cartes Anki** — 10-15 min
   - D'abord les révisions du jour (anciennes cartes)
   - Puis les nouvelles cartes de l'épisode du jour
2. **Regarder la vidéo YouTube** — immédiatement après
   - Sous-titres **en arabe uniquement** (pas en français, jamais)
   - Chaque mot que tu viens de réviser apparaît dans un vrai contexte
3. **Supprimer les cartes trop faciles** — une tape, pas de menu

### Pourquoi cet ordre :
Anki charge 40 mots en mémoire à court terme. La vidéo les fait passer en mémoire à long terme par la **reconnaissance** — ton cerveau traite ça comme du déjà-vu, pas comme de l'étude.

C'est le principe **i+1 de Krashen** : l'acquisition se produit quand l'input est juste au-dessus de ton niveau. Sans préparation, la vidéo est trop dure → tu décroches. Après 15 min de cartes, elle est juste à la limite → tu progresses.

---

## Étape 6 — Améliorations

### Prononciation
Installer **AwesomeTTS** ou **HyperTTS** dans Anki. Ces plugins ajoutent l'audio sur chaque carte via Azure Neural TTS. La voix MSA est de bonne qualité.

### Définitions monolingues (niveau intermédiaire+)
Demander à Claude d'ajouter une troisième colonne avec une définition en arabe simple. Ça force ton cerveau à penser en arabe au lieu de traduire.

### Cartes inversées
Créer un deuxième type de carte : recto en arabe, verso en français. Tu travailles la reconnaissance ET le rappel actif.

### Batch processing
- 1 vidéo par jour
- 30-40 cartes par vidéo
- En un mois : 900-1200 cartes
- En une saison de contenu : vocabulaire B1 → B2 construit sur du contenu réel

### NotebookLM comme tuteur
Après avoir chargé la transcription, demande-lui n'importe quoi :
- *"Quels connecteurs logiques sont utilisés dans cette vidéo ?"*
- *"Explique-moi la structure grammaticale de cette phrase : [phrase]"*
- *"Donne-moi 5 exemples du mot تَطَوُّر tel qu'il apparaît dans le texte."*

Il ne répond qu'à partir de la source. Pas d'hallucinations.

---

## Le pipeline complet — résumé

| # | Action | Temps |
|---|---|---|
| 1 | Trouver une vidéo YouTube en MSA avec sous-titres | 1 min |
| 2 | Copier la transcription | 1-2 min |
| 3 | Charger dans NotebookLM → extraire 40 mots | 3-5 min |
| 4 | Envoyer à Claude → récupérer le CSV | 2-3 min |
| 5 | Importer dans Anki (FSRS activé, rétention 0.90) | 1 min |
| 6 | Réviser les cartes | 10-15 min |
| 7 | Regarder la vidéo (sous-titres arabes uniquement) | durée vidéo |
| | **Total de préparation** | **~10 min** |

---

## Spécificités de l'arabe à garder en tête

**Le tashkeel (تشكيل) est ton meilleur ami au début.** L'arabe non vocalisé est ambigu — le même mot peut se lire de 4 façons différentes. Demande toujours le tashkeel dans tes extractions. Tu le retireras quand tu n'en auras plus besoin.

**La translittération est une béquille temporaire.** Utile les 2-3 premiers mois pour vérifier ta lecture. Ensuite, supprime-la de tes cartes pour forcer la lecture directe.

**Les racines trilitères.** La majorité des mots arabes découlent d'une racine de 3 consonnes. Quand tu apprends كَتَبَ (kataba — écrire), tu débloques aussi كِتَاب (livre), كَاتِب (écrivain), مَكْتَبَة (bibliothèque). Demande à NotebookLM de regrouper les mots par racine quand c'est pertinent.

**MSA ≠ parlé.** Personne ne parle MSA dans la rue. C'est la langue des médias, de la littérature et du formel. C'est un excellent point de départ parce que tous les arabophones la comprennent, mais sache que la transition vers l'égyptien sera une étape distincte — et ce même pipeline s'y appliquera.

---

## Transition vers l'égyptien (quand tu seras prêt)

Après 2-3 mois de MSA régulier, tu comprendras déjà ~40-50% de l'égyptien grâce au vocabulaire partagé. À ce moment :

1. Créer un **deck Anki séparé** : *"Égyptien — [nom de la série]"*
2. Choisir une série égyptienne (Netflix/Shahid : *ما وراء الطبيعة*, *بـ100 وش*, etc.)
3. Adapter le prompt NotebookLM : remplacer "Modern Standard Arabic" par "Egyptian Arabic (عامية مصرية)"
4. Demander à NotebookLM de **signaler les différences avec le MSA** pour chaque mot

Les principales différences à repérer :
- **ج** → se prononce "g" dur (جميل = gamiil)
- **ق** → souvent remplacé par un coup de glotte (قلب = ʾalb)
- Vocabulaire courant qui change (ماذا → إيه, الآن → دلوقتي, أريد → عايز)

Même pipeline. Même logique. Nouveau deck.

---

## Le point essentiel

L'IA fait l'extraction. Le machine learning gère le planning de révision. Toi, tu regardes des vidéos.

10 minutes de préparation. 10-15 minutes de cartes. Puis du contenu qui t'intéresse.

Pas de manuels. Pas de conjugaisons recopiées 50 fois. Juste un système qui transforme ce que tu regardes déjà en cours d'arabe personnalisé.

---

*Pipeline adapté pour l'arabe MSA à partir de vidéos YouTube. Méthode originale par @phosphenq.*
