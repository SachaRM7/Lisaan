# ÉTAPE 7 — Module 4 : Construire du sens

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0 (Foundation), 1 (Onboarding), 2 (Module 1 Alphabet + MCQ), 3 (SRS + progression), 4 (Profil/Réglages), **4.5 (migration offline-first)**, **5 (Module 2 Harakats + MatchExercise)**, **6 (Module 3 Premiers mots + WordCard + RootFamilyDisplay)**.
> Cette étape construit le Module 4 complet : phrases nominales simples, pronoms démonstratifs et possessifs, textes à trou (FillBlankExercise — premier usage), et mini-dialogues (2–3 répliques).

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (post-É4.5 — CRITIQUE)** :
> - **Offline-first** : Tous les hooks lisent depuis **SQLite local** (`src/db/local-queries.ts`). JAMAIS d'import de `src/db/remote` dans les hooks ou stores.
> - **Seuls** `content-sync.ts` et `sync-manager.ts` parlent à Supabase Cloud.
> - Après chaque écriture locale (progression, SRS), appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : les migrations SQL s'exécutent dans le Dashboard Supabase Cloud (SQL Editor).
> - Les exercices sont générés dynamiquement côté client (pas stockés en base).

> **Ce qui change dans cette étape** :
> - Deux nouvelles tables : `sentences` (déjà dans le schéma Cloud É0 mais non utilisée) et `dialogues` + `dialogue_turns` (nouvelles).
> - Le schéma SQLite local (`schema-local.ts`) est étendu avec ces 3 tables.
> - Le content-sync synchronise ces 3 tables.
> - Nouveaux mots : pronoms démonstratifs, adjectifs simples, mots-outils (قلم, كيف, شكراً…).
> - Premier usage de l'exercice `fill_blank` — son composant `FillBlankExercise.tsx` est implémenté ici.
> - Nouveau composant `SentenceCard` et `DialogueDisplay`.
> - Nouveau générateur `sentence-exercise-generator.ts`.

---

## MISSION 1 — Étendre le schéma SQLite local pour sentences, dialogues, dialogue_turns

**Contexte :**
Le schéma SQLite local (post-É6) contient 10 tables : letters, diacritics, modules, lessons, roots, words, word_variants, user_progress, srs_cards, user_settings + sync_metadata. Les tables `sentences`, `dialogues`, `dialogue_turns` n'existent pas encore en local.

**Action :**
Modifie `src/db/schema-local.ts`. Dans `initLocalSchema()`, ajoute après `word_variants` :

```sql
-- ============================================================
-- TABLES CONTENU — Phrases, dialogues (É7)
-- ============================================================

CREATE TABLE IF NOT EXISTS sentences (
  id TEXT PRIMARY KEY,
  arabic TEXT NOT NULL,             -- Phrase sans harakats
  arabic_vocalized TEXT NOT NULL,   -- Phrase avec harakats
  translation_fr TEXT NOT NULL,     -- Traduction française
  transliteration TEXT NOT NULL,
  word_ids TEXT,                    -- JSON array d'IDs de mots
  audio_url TEXT,
  context TEXT,                     -- Contexte d'utilisation (fr)
  variant TEXT NOT NULL DEFAULT 'msa',
  difficulty INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  title_fr TEXT NOT NULL,
  title_ar TEXT,
  context_fr TEXT,                  -- Description de la situation
  difficulty INTEGER NOT NULL DEFAULT 1,
  variant TEXT NOT NULL DEFAULT 'msa',
  sort_order INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS dialogue_turns (
  id TEXT PRIMARY KEY,
  dialogue_id TEXT NOT NULL,
  speaker TEXT NOT NULL,            -- 'A' ou 'B'
  sort_order INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  translation_fr TEXT NOT NULL,
  audio_url TEXT,
  synced_at TEXT,
  FOREIGN KEY (dialogue_id) REFERENCES dialogues(id)
);
```

Et ajoute ces index :

```sql
CREATE INDEX IF NOT EXISTS idx_sentences_sort ON sentences(sort_order);
CREATE INDEX IF NOT EXISTS idx_sentences_difficulty ON sentences(difficulty);
CREATE INDEX IF NOT EXISTS idx_dialogue_turns_dialogue ON dialogue_turns(dialogue_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_dialogues_sort ON dialogues(sort_order);
```

**Checkpoint :**
- [ ] `schema-local.ts` compile sans erreur
- [ ] Les tables `sentences`, `dialogues`, `dialogue_turns` sont créées au démarrage
- [ ] Les tables É6 (roots, words, word_variants) ne sont pas affectées

---

## MISSION 2 — Seeder dans Supabase Cloud : nouveaux mots, phrases, dialogues, leçons Module 4

**Action :**
Ouvre le **Dashboard Supabase Cloud** → **SQL Editor** → Nouvelle requête.

### 2.1 — Créer les tables manquantes dans Supabase Cloud

Les tables `dialogues` et `dialogue_turns` sont nouvelles, à créer dans Cloud :

```sql
-- Table dialogues
CREATE TABLE IF NOT EXISTS dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_fr TEXT NOT NULL,
  title_ar TEXT,
  context_fr TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1,
  variant TEXT NOT NULL DEFAULT 'msa',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table dialogue_turns
CREATE TABLE IF NOT EXISTS dialogue_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('A', 'B')),
  sort_order INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  translation_fr TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_dialogue_turns_dialogue ON dialogue_turns(dialogue_id, sort_order);

-- RLS
ALTER TABLE dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dialogues" ON dialogues FOR SELECT USING (true);
CREATE POLICY "Public read dialogue_turns" ON dialogue_turns FOR SELECT USING (true);

-- Colonnes manquantes dans sentences (si absentes)
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS context TEXT;
```

### 2.2 — Nouveaux mots pour Module 4

Ces mots sont nécessaires pour les phrases nominales, les démonstratifs et les adjectifs. Ils sont ajoutés sans racine (root_id NULL) car ils sont des mots-outils ou des adjectifs simples.

```sql
-- Vider les données de test éventuelles
DELETE FROM words WHERE id IN (
  'word-hatha','word-hathihi','word-dhalika','word-tilka',
  'word-kabir','word-saghir','word-jamil','word-mufid',
  'word-qalam','word-ma-interr','word-kayfa','word-shukran',
  'word-man-interr','word-ana','word-anta','word-hiya','word-huwa'
);

INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration,
                   translation_fr, pos, frequency_rank, gender,
                   is_simple_word, sort_order, pedagogy_notes)
VALUES
  -- Pronoms démonstratifs
  ('word-hatha', NULL, 'هذا', 'هَذَا', 'hādhā',
   'ceci / ce (m, proche)', 'demonstrative', 1, 'masculine', true, 100,
   'Pronom démonstratif masculin proche. Première structure de phrase nominale : هذا + nom = "ceci est un..."'),
  ('word-hathihi', NULL, 'هذه', 'هَذِهِ', 'hādhihi',
   'ceci / cette (f, proche)', 'demonstrative', 1, 'feminine', true, 101,
   'Pronom démonstratif féminin proche. Même structure que هذا mais pour les noms féminins.'),
  ('word-dhalika', NULL, 'ذلك', 'ذَلِكَ', 'dhālika',
   'cela / ce (m, éloigné)', 'demonstrative', 2, 'masculine', true, 102,
   'Pronom démonstratif masculin éloigné. Contraste هذا (proche) / ذلك (loin).'),
  ('word-tilka', NULL, 'تلك', 'تِلْكَ', 'tilka',
   'cela / cette (f, éloigné)', 'demonstrative', 2, 'feminine', true, 103,
   'Pronom démonstratif féminin éloigné. Même logique : هذه (f, proche) / تلك (f, loin).'),

  -- Pronoms personnels de base
  ('word-ana', NULL, 'أنا', 'أَنَا', 'anā',
   'je / moi', 'pronoun', 1, 'n/a', true, 110,
   'Premier pronom personnel. Identique pour masculin et féminin. Souvent omis en arabe (pro-drop), mais essentiel à connaître.'),
  ('word-anta', NULL, 'أنت', 'أَنْتَ', 'anta',
   'tu / toi (m)', 'pronoun', 1, 'masculine', true, 111,
   'Pronom 2ème personne masculin. أَنْتِ (anti) pour le féminin — introduit en même temps.'),
  ('word-huwa', NULL, 'هو', 'هُوَ', 'huwa',
   'il / lui', 'pronoun', 1, 'masculine', true, 112,
   'Pronom 3ème personne masculin. En arabe, هو et هي servent aussi de copule (= "est") dans les phrases nominales.'),
  ('word-hiya', NULL, 'هي', 'هِيَ', 'hiya',
   'elle / lui', 'pronoun', 1, 'feminine', true, 113,
   'Pronom 3ème personne féminin.'),

  -- Adjectifs simples
  ('word-kabir', NULL, 'كبير', 'كَبِير', 'kabīr',
   'grand / âgé', 'adjective', 5, 'masculine', true, 120,
   'Adjectif de base. En arabe, l''adjectif SUIT le nom et s''accorde en genre et défini/indéfini : بيت كبير (une grande maison) vs البيت الكبير (la grande maison).'),
  ('word-saghir', NULL, 'صغير', 'صَغِير', 'ṣaghīr',
   'petit / jeune', 'adjective', 6, 'masculine', true, 121,
   'Contraire de كبير. Première lettre : صاد (emphatique) — rappel du Module 1.'),
  ('word-jamil', NULL, 'جميل', 'جَمِيل', 'jamīl',
   'beau / magnifique', 'adjective', 7, 'masculine', true, 122,
   'Adjectif très usité. Employé comme expression de compliment : !جميل (Magnifique !).'),
  ('word-mufid', NULL, 'مفيد', 'مُفِيد', 'mufīd',
   'utile / bénéfique', 'adjective', 15, 'masculine', true, 123,
   'Pattern mufʿil (forme IV du participe actif). Lien avec la racine ف-ي-د (bénéficier).'),

  -- Mots-outils interrogatifs
  ('word-ma-interr', NULL, 'ما', 'مَا', 'mā',
   'quoi ? / qu''est-ce que ?', 'interrogative', 1, 'n/a', true, 130,
   'Particule interrogative sur les choses. مَا هَذَا؟ = Qu''est-ce que c''est ? À ne pas confondre avec ما de négation.'),
  ('word-man-interr', NULL, 'من', 'مَنْ', 'man',
   'qui ?', 'interrogative', 1, 'n/a', true, 131,
   'Particule interrogative sur les personnes. مَنْ هُوَ؟ = Qui est-il ? Attention : مِنْ (avec kasra) = "de/depuis" — sens différent !'),
  ('word-kayfa', NULL, 'كيف', 'كَيْفَ', 'kayfa',
   'comment ?', 'interrogative', 2, 'n/a', true, 132,
   'كَيْفَ حَالُكَ؟ = Comment vas-tu ? Littéralement "comment est ton état ?". Expression essentielle.'),

  -- Mots usuels
  ('word-qalam', NULL, 'قلم', 'قَلَم', 'qalam',
   'stylo / crayon', 'noun', 14, 'masculine', true, 140,
   'Mot courant. Visuellement simple : 3 lettres q-l-m. Fréquent dans les exercices de classe.'),
  ('word-shukran', NULL, 'شكرا', 'شُكْراً', 'shukran',
   'merci', 'adverb', 2, 'n/a', true, 141,
   'Tanwin fathatan sur le alif final. Un des premiers mots reconnus par les apprenants. Souvent suivi de جَزِيلاً (beaucoup).'),
  ('word-naam', NULL, 'نعم', 'نَعَم', 'naʿam',
   'oui', 'adverb', 1, 'n/a', true, 142,
   'Particule d''affirmation. Le ع (ayn) est un défi de prononciation. Contraire : لَا (lā).'),
  ('word-la', NULL, 'لا', 'لَا', 'lā',
   'non', 'adverb', 1, 'n/a', true, 143,
   'Particule de négation/refus. Ligature lam-alif — déjà vue comme caractère spécial en Module 1.');
```

### 2.3 — Variantes MSA pour les nouveaux mots

```sql
INSERT INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration)
SELECT
  'var-msa-' || w.id,
  w.id,
  'msa',
  w.arabic,
  w.arabic_vocalized,
  w.transliteration
FROM words w
WHERE w.id IN (
  'word-hatha','word-hathihi','word-dhalika','word-tilka',
  'word-kabir','word-saghir','word-jamil','word-mufid',
  'word-qalam','word-ma-interr','word-kayfa','word-shukran',
  'word-man-interr','word-ana','word-anta','word-hiya','word-huwa',
  'word-naam','word-la'
)
AND NOT EXISTS (
  SELECT 1 FROM word_variants wv WHERE wv.word_id = w.id AND wv.variant = 'msa'
);
```

### 2.4 — Seeder les phrases (sentences)

```sql
INSERT INTO sentences
  (id, arabic, arabic_vocalized, transliteration, translation_fr,
   word_ids, context, variant, difficulty, sort_order)
VALUES
  -- Leçon 1 : هذا/هذه — Démonstratifs proches
  ('sent-hatha-kitab', 'هذا كتاب', 'هَذَا كِتَابٌ', 'hādhā kitābun',
   'Ceci est un livre.',
   '["word-hatha","word-kitab"]', 'Identifier un objet masculin', 'msa', 1, 1),
  ('sent-hathihi-madrasa', 'هذه مدرسة', 'هَذِهِ مَدْرَسَةٌ', 'hādhihi madrasatun',
   'Ceci est une école.',
   '["word-hathihi","word-madrasa"]', 'Identifier un objet féminin', 'msa', 1, 2),
  ('sent-hatha-qalam', 'هذا قلم', 'هَذَا قَلَمٌ', 'hādhā qalamun',
   'Ceci est un stylo.',
   '["word-hatha","word-qalam"]', 'Identifier un objet masculin', 'msa', 1, 3),
  ('sent-hathihi-maktaba', 'هذه مكتبة', 'هَذِهِ مَكْتَبَةٌ', 'hādhihi maktabatun',
   'Ceci est une bibliothèque.',
   '["word-hathihi","word-maktaba"]', 'Identifier un lieu féminin', 'msa', 1, 4),
  ('sent-ma-hatha', 'ما هذا؟', 'مَا هَذَا؟', 'mā hādhā?',
   'Qu''est-ce que c''est ?',
   '["word-ma-interr","word-hatha"]', 'Question sur un objet', 'msa', 1, 5),
  ('sent-ma-hathihi', 'ما هذه؟', 'مَا هَذِهِ؟', 'mā hādhihi?',
   'Qu''est-ce que c''est ? (féminin)',
   '["word-ma-interr","word-hathihi"]', 'Question sur un objet féminin', 'msa', 1, 6),

  -- Leçon 2 : ذلك/تلك — Démonstratifs éloignés
  ('sent-dhalika-bayt', 'ذلك بيت', 'ذَلِكَ بَيْتٌ', 'dhālika baytun',
   'Cela est une maison.',
   '["word-dhalika","word-bayt"]', 'Identifier un objet éloigné', 'msa', 1, 10),
  ('sent-tilka-shams', 'تلك الشمس', 'تِلْكَ الشَّمْسُ', 'tilka sh-shamsu',
   'C''est le soleil.',
   '["word-tilka","word-shams"]', 'Identifier une chose éloignée définie', 'msa', 1, 11),
  ('sent-dhalika-bayt-kabir', 'ذلك بيت كبير', 'ذَلِكَ بَيْتٌ كَبِيرٌ', 'dhālika baytun kabīrun',
   'Cela est une grande maison.',
   '["word-dhalika","word-bayt","word-kabir"]', 'Phrase nominale avec adjectif', 'msa', 2, 12),
  ('sent-hatha-kitab-mufid', 'هذا كتاب مفيد', 'هَذَا كِتَابٌ مُفِيدٌ', 'hādhā kitābun mufīdun',
   'Ceci est un livre utile.',
   '["word-hatha","word-kitab","word-mufid"]', 'Phrase nominale avec adjectif', 'msa', 2, 13),

  -- Leçon 3 : Pronoms possessifs
  ('sent-kitabi', 'هذا كتابي', 'هَذَا كِتَابِي', 'hādhā kitābī',
   'C''est mon livre.',
   '["word-hatha","word-kitab"]', 'Possession 1ère personne', 'msa', 2, 20),
  ('sent-kitabuka', 'هذا كتابك', 'هَذَا كِتَابُكَ', 'hādhā kitābuka',
   'C''est ton livre.',
   '["word-hatha","word-kitab"]', 'Possession 2ème personne masculin', 'msa', 2, 21),
  ('sent-baytuna', 'هذا بيتنا', 'هَذَا بَيْتُنَا', 'hādhā baytunā',
   'C''est notre maison.',
   '["word-hatha","word-bayt"]', 'Possession 1ère personne pluriel', 'msa', 2, 22),
  ('sent-qalamuh', 'هذا قلمه', 'هَذَا قَلَمُهُ', 'hādhā qalamuhū',
   'C''est son stylo (à lui).',
   '["word-hatha","word-qalam"]', 'Possession 3ème personne masculin', 'msa', 2, 23),

  -- Leçon 4 : Phrase nominale avec adjectif
  ('sent-al-bayt-kabir', 'البيت كبير', 'الْبَيْتُ كَبِيرٌ', 'al-baytu kabīrun',
   'La maison est grande.',
   '["word-bayt","word-kabir"]', 'Phrase nominale définie + prédicat', 'msa', 2, 30),
  ('sent-al-kitab-mufid', 'الكتاب مفيد', 'الْكِتَابُ مُفِيدٌ', 'al-kitābu mufīdun',
   'Le livre est utile.',
   '["word-kitab","word-mufid"]', 'Phrase nominale définie + prédicat', 'msa', 2, 31),
  ('sent-al-madrasa-jamila', 'المدرسة جميلة', 'الْمَدْرَسَةُ جَمِيلَةٌ', 'al-madrasatu jamīlatun',
   'L''école est belle.',
   '["word-madrasa","word-jamil"]', 'Accord féminin de l''adjectif', 'msa', 2, 32),
  ('sent-al-walad-saghir', 'القمر جميل', 'الْقَمَرُ جَمِيلٌ', 'al-qamaru jamīlun',
   'La lune est belle.',
   '["word-qamar","word-jamil"]', 'Phrase nominale définie', 'msa', 2, 33);
```

### 2.5 — Seeder les dialogues

```sql
-- Dialogue 1 : Salutations
INSERT INTO dialogues (id, title_fr, title_ar, context_fr, difficulty, sort_order)
VALUES (
  'dial-salam',
  'Les salutations',
  'التَّحِيَّات',
  'Deux personnes se rencontrent et échangent les salutations traditionnelles.',
  1, 1
);

INSERT INTO dialogue_turns (id, dialogue_id, speaker, sort_order,
  arabic, arabic_vocalized, transliteration, translation_fr)
VALUES
  ('turn-salam-1', 'dial-salam', 'A', 1,
   'السلام عليكم', 'السَّلَامُ عَلَيْكُم', 'as-salāmu ʿalaykum',
   'La paix soit sur vous. (Bonjour)'),
  ('turn-salam-2', 'dial-salam', 'B', 2,
   'وعليكم السلام', 'وَعَلَيْكُمُ السَّلَام', 'wa ʿalaykumu s-salām',
   'Et sur vous la paix. (Et bonjour à vous)'),
  ('turn-salam-3', 'dial-salam', 'A', 3,
   'كيف حالك؟', 'كَيْفَ حَالُكَ؟', 'kayfa ḥāluka?',
   'Comment vas-tu ?'),
  ('turn-salam-4', 'dial-salam', 'B', 4,
   'بخير، شكرا', 'بِخَيْرٍ، شُكْراً', 'bi-khayr, shukran',
   'Bien, merci.');

-- Dialogue 2 : Identifier un objet
INSERT INTO dialogues (id, title_fr, title_ar, context_fr, difficulty, sort_order)
VALUES (
  'dial-maa-hatha',
  'Qu''est-ce que c''est ?',
  'مَا هَذَا؟',
  'Un apprenant montre un objet et demande ce que c''est.',
  1, 2
);

INSERT INTO dialogue_turns (id, dialogue_id, speaker, sort_order,
  arabic, arabic_vocalized, transliteration, translation_fr)
VALUES
  ('turn-obj-1', 'dial-maa-hatha', 'A', 1,
   'ما هذا؟', 'مَا هَذَا؟', 'mā hādhā?',
   'Qu''est-ce que c''est ?'),
  ('turn-obj-2', 'dial-maa-hatha', 'B', 2,
   'هذا كتاب', 'هَذَا كِتَابٌ', 'hādhā kitābun',
   'C''est un livre.'),
  ('turn-obj-3', 'dial-maa-hatha', 'A', 3,
   'كتاب من؟', 'كِتَابُ مَنْ؟', 'kitābu man?',
   'Le livre de qui ?'),
  ('turn-obj-4', 'dial-maa-hatha', 'B', 4,
   'كتابي', 'كِتَابِي', 'kitābī',
   'Mon livre.');

-- Dialogue 3 : Se présenter
INSERT INTO dialogues (id, title_fr, title_ar, context_fr, difficulty, sort_order)
VALUES (
  'dial-taqdim',
  'Se présenter',
  'التَّعَارُف',
  'Deux apprenants se présentent mutuellement.',
  2, 3
);

INSERT INTO dialogue_turns (id, dialogue_id, speaker, sort_order,
  arabic, arabic_vocalized, transliteration, translation_fr)
VALUES
  ('turn-pres-1', 'dial-taqdim', 'A', 1,
   'من أنت؟', 'مَنْ أَنْتَ؟', 'man anta?',
   'Qui es-tu ?'),
  ('turn-pres-2', 'dial-taqdim', 'B', 2,
   'أنا طالب', 'أَنَا طَالِبٌ', 'anā ṭālibun',
   'Je suis un étudiant.'),
  ('turn-pres-3', 'dial-taqdim', 'A', 3,
   'أنا أيضا طالبة', 'أَنَا أَيْضاً طَالِبَةٌ', 'anā ayḍan ṭālibatun',
   'Moi aussi, je suis étudiante.');
```

### 2.6 — Seeder les 6 leçons du Module 4

```sql
INSERT INTO lessons (module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
SELECT
  m.id, v.title_fr, v.title_ar, v.description_fr, v.sort_order, v.xp_reward, v.estimated_minutes
FROM modules m,
(VALUES
  ('هذا وهذه — Les démonstratifs proches',
   'هَذَا وَهَذِهِ', 'Ta première vraie phrase en arabe : هذا كتاب (Ceci est un livre). Masculin et féminin.',
   1, 25, 7),
  ('ذلك وتلك — Les démonstratifs éloignés',
   'ذَلِكَ وَتِلْكَ', 'Proches vs éloignés. La phrase nominale s''enrichit d''adjectifs.',
   2, 25, 7),
  ('Pronoms possessifs — كتابي، بيتك…',
   'الضَّمَائِر المُتَّصِلَة', 'Les suffixes possessifs transforment n''importe quel nom : كتاب → كتابي (mon livre).',
   3, 30, 8),
  ('La phrase nominale complète',
   'الجُمْلَة الاسْمِيَّة', 'البيت كبير. الكتاب مفيد. Sujet défini + prédicat : la structure de base de l''arabe.',
   4, 30, 8),
  ('Textes à trou — Complète la phrase',
   'أَكْمِل الجُمْلَة', 'Mets en pratique tout ce que tu as appris. Complète les mots manquants.',
   5, 30, 8),
  ('Mini-dialogues — Tes premières conversations',
   'حِوَارَات قَصِيرَة', 'Salutations, identifier des objets, se présenter. Tu construis de vraies conversations.',
   6, 40, 10)
) AS v(title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
WHERE m.sort_order = 4;
```

**Checkpoint :**
- [ ] Tout le SQL s'exécute sans erreur
- [ ] Tables `dialogues` et `dialogue_turns` créées avec RLS
- [ ] `SELECT COUNT(*) FROM words WHERE sort_order >= 100;` → 19 nouveaux mots
- [ ] `SELECT COUNT(*) FROM sentences;` → 17 phrases
- [ ] `SELECT COUNT(*) FROM dialogues;` → 3 dialogues
- [ ] `SELECT COUNT(*) FROM dialogue_turns;` → 11 répliques
- [ ] `SELECT COUNT(*) FROM lessons WHERE module_id = (SELECT id FROM modules WHERE sort_order = 4);` → 6

---

## MISSION 3 — Étendre content-sync et local-queries pour sentences/dialogues

### 3.1 — Fonctions CRUD dans local-queries.ts

```typescript
// src/db/local-queries.ts — AJOUTER :

// --- Sentences ---

export async function getAllSentences() {
  const db = getLocalDB();
  const rows = await db.getAllAsync<any>('SELECT * FROM sentences ORDER BY sort_order ASC');
  return rows.map(r => ({
    ...r,
    word_ids: typeof r.word_ids === 'string' ? JSON.parse(r.word_ids ?? '[]') : r.word_ids ?? [],
  }));
}

export async function getSentencesByDifficulty(maxDifficulty: number) {
  const db = getLocalDB();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sentences WHERE difficulty <= ? ORDER BY sort_order ASC',
    [maxDifficulty]
  );
  return rows.map(r => ({
    ...r,
    word_ids: typeof r.word_ids === 'string' ? JSON.parse(r.word_ids ?? '[]') : r.word_ids ?? [],
  }));
}

export async function upsertSentences(sentences: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const s of sentences) {
    await db.runAsync(
      `INSERT OR REPLACE INTO sentences
       (id, arabic, arabic_vocalized, transliteration, translation_fr,
        word_ids, audio_url, context, variant, difficulty, sort_order, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.arabic, s.arabic_vocalized, s.transliteration, s.translation_fr,
       JSON.stringify(s.word_ids ?? []), s.audio_url, s.context, s.variant ?? 'msa',
       s.difficulty ?? 1, s.sort_order ?? 0, now]
    );
  }
}

// --- Dialogues ---

export async function getAllDialogues() {
  const db = getLocalDB();
  return db.getAllAsync<any>('SELECT * FROM dialogues ORDER BY sort_order ASC');
}

export async function getDialogueWithTurns(dialogueId: string) {
  const db = getLocalDB();
  const dialogue = await db.getFirstAsync<any>('SELECT * FROM dialogues WHERE id = ?', [dialogueId]);
  if (!dialogue) return null;
  const turns = await db.getAllAsync<any>(
    'SELECT * FROM dialogue_turns WHERE dialogue_id = ? ORDER BY sort_order ASC',
    [dialogueId]
  );
  return { ...dialogue, turns };
}

export async function upsertDialogues(dialogues: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const d of dialogues) {
    await db.runAsync(
      `INSERT OR REPLACE INTO dialogues
       (id, title_fr, title_ar, context_fr, difficulty, variant, sort_order, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.title_fr, d.title_ar, d.context_fr, d.difficulty ?? 1,
       d.variant ?? 'msa', d.sort_order ?? 0, now]
    );
  }
}

export async function upsertDialogueTurns(turns: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const t of turns) {
    await db.runAsync(
      `INSERT OR REPLACE INTO dialogue_turns
       (id, dialogue_id, speaker, sort_order, arabic, arabic_vocalized,
        transliteration, translation_fr, audio_url, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.dialogue_id, t.speaker, t.sort_order, t.arabic,
       t.arabic_vocalized, t.transliteration, t.translation_fr, t.audio_url, now]
    );
  }
}
```

### 3.2 — Étendre content-sync.ts

Ajoute après les tables words/word_variants (É6) :

```typescript
// --- Sentences ---
try {
  const { data, error } = await supabase
    .from('sentences')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  if (data && data.length > 0) {
    await upsertSentences(data);
    await updateSyncMetadata('sentences', data.length);
    result.tables.sentences = { synced: data.length, skipped: false };
  }
} catch (e: any) {
  result.errors.push(`sentences: ${e.message}`);
}

// --- Dialogues ---
try {
  const { data, error } = await supabase
    .from('dialogues')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  if (data && data.length > 0) {
    await upsertDialogues(data);
    await updateSyncMetadata('dialogues', data.length);
    result.tables.dialogues = { synced: data.length, skipped: false };
  }
} catch (e: any) {
  result.errors.push(`dialogues: ${e.message}`);
}

// --- Dialogue Turns ---
try {
  const { data, error } = await supabase
    .from('dialogue_turns')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  if (data && data.length > 0) {
    await upsertDialogueTurns(data);
    await updateSyncMetadata('dialogue_turns', data.length);
    result.tables.dialogue_turns = { synced: data.length, skipped: false };
  }
} catch (e: any) {
  result.errors.push(`dialogue_turns: ${e.message}`);
}
```

Et mets à jour la liste dans `needsContentSync()` :

```typescript
const tables = [
  'letters', 'diacritics', 'modules', 'lessons',
  'roots', 'words', 'word_variants',
  'sentences', 'dialogues', 'dialogue_turns'
];
```

**Checkpoint :**
- [ ] `local-queries.ts` compile avec les nouvelles fonctions
- [ ] `content-sync.ts` synchronise 10 tables
- [ ] Après re-sync : `getAllSentences()` retourne 17 phrases
- [ ] `getAllDialogues()` retourne 3 dialogues
- [ ] `getDialogueWithTurns('dial-salam')` retourne le dialogue avec ses 4 répliques
- [ ] Les nouveaux mots (word-hatha, etc.) sont dans SQLite via la sync words de É6

---

## MISSION 4 — Hooks useSentences et useDialogues

### 4.1 — Créer `src/hooks/useSentences.ts`

```typescript
// src/hooks/useSentences.ts

import { useQuery } from '@tanstack/react-query';
import { getAllSentences, getSentencesByDifficulty } from '../db/local-queries';

export interface Sentence {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  word_ids: string[];
  audio_url: string | null;
  context: string | null;
  variant: string;
  difficulty: number;
  sort_order: number;
}

export function useSentences() {
  return useQuery({
    queryKey: ['sentences'],
    queryFn: getAllSentences,
    staleTime: Infinity,
  });
}

export function useSentencesByDifficulty(maxDifficulty: number) {
  return useQuery({
    queryKey: ['sentences', 'difficulty', maxDifficulty],
    queryFn: () => getSentencesByDifficulty(maxDifficulty),
    staleTime: Infinity,
  });
}
```

### 4.2 — Créer `src/hooks/useDialogues.ts`

```typescript
// src/hooks/useDialogues.ts

import { useQuery } from '@tanstack/react-query';
import { getAllDialogues, getDialogueWithTurns } from '../db/local-queries';

export interface DialogueTurn {
  id: string;
  dialogue_id: string;
  speaker: 'A' | 'B';
  sort_order: number;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  translation_fr: string;
  audio_url: string | null;
}

export interface Dialogue {
  id: string;
  title_fr: string;
  title_ar: string | null;
  context_fr: string | null;
  difficulty: number;
  sort_order: number;
}

export interface DialogueWithTurns extends Dialogue {
  turns: DialogueTurn[];
}

export function useDialogues() {
  return useQuery({
    queryKey: ['dialogues'],
    queryFn: getAllDialogues,
    staleTime: Infinity,
  });
}

export function useDialogueWithTurns(dialogueId: string | null) {
  return useQuery({
    queryKey: ['dialogue', dialogueId],
    queryFn: () => getDialogueWithTurns(dialogueId!),
    enabled: !!dialogueId,
    staleTime: Infinity,
  });
}
```

**Checkpoint :**
- [ ] Les deux hooks compilent sans erreur
- [ ] **Aucun import de `src/db/remote`** dans ces fichiers
- [ ] `useSentences()` retourne 17 phrases
- [ ] `useDialogueWithTurns('dial-salam')` retourne le dialogue avec `turns` peuplé

---

## MISSION 5 — Composant SentenceCard

**Action :**
Crée `src/components/arabic/SentenceCard.tsx`.

### Props :

```typescript
interface SentenceCardProps {
  sentence: Sentence;
  mode: 'compact' | 'full';
  showTransliteration?: boolean;
  showTranslation?: boolean;
  highlightWordIds?: string[];  // Pour fill_blank : met en surbrillance les mots-cibles
  onTap?: () => void;
}
```

### Structure mode `full` :

```
┌─────────────────────────────────────────┐
│                                         │
│   هَذَا كِتَابٌ مُفِيدٌ                 │  ← arabic_vocalized (ArabicText, xlarge, RTL)
│   hādhā kitābun mufīdun                 │  ← transliteration (si activée)
│   Ceci est un livre utile.              │  ← translation_fr (si activée)
│                                         │
│   [Contexte : Phrase nominale avec adj] │  ← context (gris, petit)
│                                         │
└─────────────────────────────────────────┘
```

### Structure mode `compact` (pour exercices fill_blank) :

```
┌──────────────────────────────────────┐
│   هَذَا _____ مُفِيدٌ                 │  ← Mot à trou = [ _____ ] mis en surbrillance
│   Ceci est un livre utile.           │  ← Traduction toujours visible (contexte)
└──────────────────────────────────────┘
```

### Comportement :

1. Le texte arabe utilise `ArabicText` avec les settings utilisateur
2. Si `highlightWordIds` est fourni, les mots correspondants sont remplacés visuellement par `_____` en orange (`#F4A261`) — uniquement dans le rendu RTL de la phrase
3. La phrase est affichée en direction RTL (textAlign: 'right', writingDirection: 'rtl')
4. Si `onTap` est fourni, la carte entière est pressable
5. **Style** : fond blanc, border-radius 16, padding 20, ombre légère — cohérent avec WordCard

**Checkpoint :**
- [ ] `SentenceCard.tsx` compile sans erreur
- [ ] Mode `full` affiche la phrase, la translittération, la traduction et le contexte
- [ ] Mode `compact` masque le mot ciblé avec `_____`
- [ ] La direction RTL est correcte
- [ ] Les settings utilisateur sont respectés

---

## MISSION 6 — Composant DialogueDisplay

**Action :**
Crée `src/components/arabic/DialogueDisplay.tsx`.

### Props :

```typescript
interface DialogueDisplayProps {
  dialogue: DialogueWithTurns;
  revealedTurnIds?: string[];   // IDs des répliques déjà dévoilées (animation progressive)
  highlightTurnId?: string;     // Réplique active (pour exercice)
  showTranslation?: boolean;
  showTransliteration?: boolean;
  onTurnTap?: (turn: DialogueTurn) => void;
}
```

### Structure :

```
┌─────────────────────────────────────────┐
│  💬 Les salutations                     │  ← Titre du dialogue
│  "Deux personnes se rencontrent..."     │  ← Contexte (italique)
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ A  السَّلَامُ عَلَيْكُم          │  │  ← Bulle gauche (locuteur A)
│  │    as-salāmu ʿalaykum             │  │  ← translittération
│  │    La paix soit sur vous.         │  │  ← traduction
│  └───────────────────────────────────┘  │
│          ┌─────────────────────────┐    │
│          │ وَعَلَيْكُمُ السَّلَام B│    │  ← Bulle droite (locuteur B)
│          │ wa ʿalaykumu s-salām    │    │
│          │ Et sur vous la paix.    │    │
│          └─────────────────────────┘    │
│  ┌───────────────────────────────────┐  │
│  │ A  كَيْفَ حَالُكَ؟              │  │
│  └───────────────────────────────────┘  │
│          ┌─────────────────────────┐    │
│          │ بِخَيْرٍ، شُكْراً    B │    │
│          └─────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Comportement :

1. **Bulles** : Locuteur A → bulle à gauche, fond `#F5F5F0`. Locuteur B → bulle à droite, fond `#E8F5E9`.
2. **Texte arabe** : toujours en `ArabicText`, RTL, police Amiri
3. **Animation** : Si `revealedTurnIds` est fourni, seules les répliques dans la liste sont visibles. Les nouvelles répliques apparaissent avec une animation `FadeIn` (Reanimated 3, 300ms)
4. **Highlight** : La réplique `highlightTurnId` a une bordure dorée — pour l'exercice "quelle réplique est correcte ?"
5. **Tap** : Chaque bulle est pressable → `onTurnTap`
6. Le dialogue entier a un fond `#FAFAF5`, border-radius 20, padding 16

**Checkpoint :**
- [ ] `DialogueDisplay.tsx` compile sans erreur
- [ ] Locuteur A à gauche, B à droite
- [ ] Animation d'apparition progressive fonctionne avec `revealedTurnIds`
- [ ] Translittération et traduction respectent les settings
- [ ] Le tap sur une bulle appelle `onTurnTap`

---

## MISSION 7 — Composant FillBlankExercise

**Action :**
Crée `src/components/exercises/FillBlankExercise.tsx` et enregistre-le dans le registry.

C'est le premier usage du type `fill_blank` — prévu dans l'architecture MVP mais non encore implémenté.

### ExerciseConfig étendu pour fill_blank :

```typescript
// src/types/exercise.ts — AJOUTER dans ExerciseConfig :
interface FillBlankConfig extends BaseExerciseConfig {
  type: 'fill_blank';
  sentence: {
    ar: string;          // Phrase complète avec harakats
    fr: string;          // Traduction française
    transliteration: string;
  };
  blank_word: {          // Le mot à deviner
    ar: string;          // Forme arabe correcte
    position: number;    // Index dans la phrase (0-based, sur les mots séparés par espaces)
  };
  options: ExerciseOption[];  // 3 options (1 correcte + 2 distracteurs)
}
```

### Composant FillBlankExercise :

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         هَذَا  [  ?  ]  مُفِيدٌ                    │  ← SentenceCard mode compact
│         Ceci est un livre utile.                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │   كِتَابٌ  │  │  قَلَمٌ   │  │  بَيْتٌ   │    │  ← Boutons de choix (tap)
│  └────────────┘  └────────────┘  └────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Comportement :

1. La phrase est affichée avec `SentenceCard` mode `compact`, le mot-cible masqué
2. 3 options en bas (boutons arabes)
3. Au tap sur la bonne réponse :
   - La case `[?]` se remplit avec le mot correct (animation)
   - La phrase s'affiche complète
   - Feedback visuel vert + appel à `onResult({ correct: true })`
4. Au tap sur une mauvaise réponse :
   - Flash rouge sur le bouton tapé
   - La case reste masquée
   - Appel à `onResult({ correct: false, selectedId })`

### Enregistrement dans le registry :

```typescript
// src/components/exercises/index.ts
exerciseRegistry.set('fill_blank', FillBlankExercise);
```

**Checkpoint :**
- [ ] `FillBlankExercise.tsx` compile sans erreur
- [ ] La phrase s'affiche avec le mot masqué
- [ ] Bonne réponse → animation de remplissage + feedback vert
- [ ] Mauvaise réponse → flash rouge + case reste masquée
- [ ] `exerciseRegistry.get('fill_blank')` retourne le composant
- [ ] Aucune régression sur MCQ et Match

---

## MISSION 8 — Générateur d'exercices phrases et dialogues

**Action :**
Crée `src/engines/sentence-exercise-generator.ts`.

```typescript
// src/engines/sentence-exercise-generator.ts

import type { ExerciseConfig } from '../types/exercise';
import type { Sentence } from '../hooks/useSentences';
import type { Dialogue, DialogueTurn } from '../hooks/useDialogues';
import type { Word } from '../hooks/useWords';

/**
 * Mapping leçon (sort_order dans Module 4) → type de contenu
 *
 * Leçon 1 : هذا/هذه (démonstratifs proches, phrases difficulty 1)
 * Leçon 2 : ذلك/تلك (démonstratifs éloignés + adjectifs)
 * Leçon 3 : Pronoms possessifs (-ي, -كَ, -هُ, -نَا)
 * Leçon 4 : Phrase nominale avec adjectif (البيت كبير)
 * Leçon 5 : Fill blank sur toutes les phrases apprises
 * Leçon 6 : Mini-dialogues
 */
export const LESSON_SENTENCE_CONFIG: Record<number, {
  type: 'demonstrative_close' | 'demonstrative_far' | 'possessive' | 'nominal' | 'fill_blank' | 'dialogue';
  sentenceIds?: string[];
  dialogueIds?: string[];
}> = {
  1: { type: 'demonstrative_close',
       sentenceIds: ['sent-hatha-kitab','sent-hathihi-madrasa','sent-hatha-qalam',
                     'sent-hathihi-maktaba','sent-ma-hatha','sent-ma-hathihi'] },
  2: { type: 'demonstrative_far',
       sentenceIds: ['sent-dhalika-bayt','sent-tilka-shams',
                     'sent-dhalika-bayt-kabir','sent-hatha-kitab-mufid'] },
  3: { type: 'possessive',
       sentenceIds: ['sent-kitabi','sent-kitabuka','sent-baytuna','sent-qalamuh'] },
  4: { type: 'nominal',
       sentenceIds: ['sent-al-bayt-kabir','sent-al-kitab-mufid',
                     'sent-al-madrasa-jamila','sent-al-walad-saghir'] },
  5: { type: 'fill_blank' },  // Toutes les phrases des leçons 1-4
  6: { type: 'dialogue', dialogueIds: ['dial-salam','dial-maa-hatha','dial-taqdim'] },
};

export function generateSentenceExercises(
  lessonSortOrder: number,
  lessonSentences: Sentence[],
  allSentences: Sentence[],
  allWords: Word[],
  dialogues?: { dialogue: Dialogue; turns: DialogueTurn[] }[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];
  const config = LESSON_SENTENCE_CONFIG[lessonSortOrder];

  // === Leçons 1-4 : MCQ traduction (AR → FR) + MCQ identification ===
  if (['demonstrative_close','demonstrative_far','possessive','nominal'].includes(config.type)) {
    for (const sentence of lessonSentences) {

      // MCQ : Phrase arabe → traduction française
      exercises.push({
        id: `mcq-sent-ar-fr-${sentence.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie cette phrase ?',
        prompt: { ar: sentence.arabic_vocalized },
        options: generateSentenceTranslationOptions(sentence, allSentences),
        metadata: { sentence_id: sentence.id },
      });

      // MCQ : Traduction française → phrase arabe
      exercises.push({
        id: `mcq-sent-fr-ar-${sentence.id}`,
        type: 'mcq',
        instruction_fr: 'Comment dit-on en arabe ?',
        prompt: { fr: sentence.translation_fr },
        options: generateSentenceArabicOptions(sentence, allSentences),
        metadata: { sentence_id: sentence.id },
      });
    }

    // MCQ sur le mot-outil de la leçon
    if (config.type === 'demonstrative_close') {
      exercises.push(generateDemonstrativeGenderMCQ(allWords));
    }
    if (config.type === 'possessive') {
      exercises.push(...generatePossessiveMCQs(allSentences, allWords));
    }
  }

  // === Leçon 5 : Fill blank ===
  if (config.type === 'fill_blank') {
    const targetSentences = allSentences.filter(s => s.difficulty <= 2);
    for (const sentence of targetSentences) {
      const words = sentence.arabic_vocalized.split(' ');
      if (words.length >= 2) {
        const blankIndex = Math.floor(words.length / 2); // Mot du milieu
        const correctWord = words[blankIndex];
        const distractors = findDistractors(correctWord, allWords, 2);

        exercises.push({
          id: `fill-${sentence.id}`,
          type: 'fill_blank',
          instruction_fr: 'Complète la phrase.',
          sentence: {
            ar: sentence.arabic_vocalized,
            fr: sentence.translation_fr,
            transliteration: sentence.transliteration,
          },
          blank_word: {
            ar: correctWord,
            position: blankIndex,
          },
          options: shuffleArray([
            { id: `opt-correct-${sentence.id}`, text: { ar: correctWord }, correct: true },
            ...distractors.map((d, i) => ({
              id: `opt-wrong-${sentence.id}-${i}`,
              text: { ar: d },
              correct: false,
            })),
          ]),
          metadata: { sentence_id: sentence.id },
        });
      }
    }
  }

  // === Leçon 6 : Dialogues ===
  if (config.type === 'dialogue' && dialogues) {
    for (const { dialogue, turns } of dialogues) {
      if (turns.length < 2) continue;

      // MCQ : "Quelle est la bonne réponse à cette réplique ?"
      for (let i = 0; i < turns.length - 1; i += 2) {
        const prompt = turns[i];
        const correctReply = turns[i + 1];
        const wrongReplies = turns.filter((_, j) => j !== i + 1 && j % 2 === 1);

        exercises.push({
          id: `mcq-dialogue-${dialogue.id}-${i}`,
          type: 'mcq',
          instruction_fr: 'Quelle est la bonne réponse ?',
          prompt: { ar: prompt.arabic_vocalized, fr: prompt.translation_fr },
          options: shuffleArray([
            { id: correctReply.id, text: { ar: correctReply.arabic_vocalized, fr: correctReply.translation_fr }, correct: true },
            ...(wrongReplies.slice(0, 2).map(w => ({
              id: w.id, text: { ar: w.arabic_vocalized, fr: w.translation_fr }, correct: false,
            }))),
          ]),
          metadata: { dialogue_id: dialogue.id },
        });
      }
    }
  }

  return shuffleArray(exercises);
}

// ---- Helpers ----

function generateSentenceTranslationOptions(
  correct: Sentence,
  allSentences: Sentence[],
): ExerciseOption[] {
  const distractors = allSentences
    .filter(s => s.id !== correct.id && s.difficulty <= correct.difficulty + 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    { id: correct.id, text: { fr: correct.translation_fr }, correct: true },
    ...distractors.map(d => ({ id: d.id, text: { fr: d.translation_fr }, correct: false })),
  ]);
}

function generateSentenceArabicOptions(
  correct: Sentence,
  allSentences: Sentence[],
): ExerciseOption[] {
  const distractors = allSentences
    .filter(s => s.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    { id: correct.id, text: { ar: correct.arabic_vocalized }, correct: true },
    ...distractors.map(d => ({ id: d.id, text: { ar: d.arabic_vocalized }, correct: false })),
  ]);
}

function generateDemonstrativeGenderMCQ(allWords: Word[]): ExerciseConfig {
  return {
    id: 'mcq-demonstrative-gender',
    type: 'mcq',
    instruction_fr: 'Quel démonstratif utilise-t-on pour un nom féminin ?',
    prompt: { fr: 'مدرسة (école) est féminin. Comment dit-on "ceci est une école" ?' },
    options: [
      { id: 'hathihi-opt', text: { ar: 'هَذِهِ مَدْرَسَةٌ' }, correct: true },
      { id: 'hatha-opt', text: { ar: 'هَذَا مَدْرَسَةٌ' }, correct: false },
      { id: 'dhalika-opt', text: { ar: 'ذَلِكَ مَدْرَسَةٌ' }, correct: false },
    ],
    metadata: {},
  };
}

function generatePossessiveMCQs(allSentences: Sentence[], allWords: Word[]): ExerciseConfig[] {
  return [
    {
      id: 'mcq-poss-1st',
      type: 'mcq',
      instruction_fr: 'Comment dit-on "mon livre" ?',
      prompt: { fr: '"Mon livre"' },
      options: shuffleArray([
        { id: 'kitabi', text: { ar: 'كِتَابِي' }, correct: true },
        { id: 'kitabuka', text: { ar: 'كِتَابُكَ' }, correct: false },
        { id: 'kitabuh', text: { ar: 'كِتَابُهُ' }, correct: false },
      ]),
      metadata: {},
    },
    {
      id: 'mcq-poss-2nd',
      type: 'mcq',
      instruction_fr: 'Comment dit-on "notre maison" ?',
      prompt: { fr: '"Notre maison"' },
      options: shuffleArray([
        { id: 'baytuna', text: { ar: 'بَيْتُنَا' }, correct: true },
        { id: 'bayti', text: { ar: 'بَيْتِي' }, correct: false },
        { id: 'baytuka', text: { ar: 'بَيْتُكَ' }, correct: false },
      ]),
      metadata: {},
    },
  ];
}

function findDistractors(targetWord: string, allWords: Word[], count: number): string[] {
  return allWords
    .filter(w => w.arabic_vocalized !== targetWord && w.arabic_vocalized.length > 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(w => w.arabic_vocalized);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

**Checkpoint :**
- [ ] `sentence-exercise-generator.ts` compile sans erreur
- [ ] Leçon 1 : retourne des MCQ AR→FR et FR→AR + MCQ genre démonstratif
- [ ] Leçon 5 : retourne des exercices `fill_blank` sur les phrases difficulty ≤ 2
- [ ] Leçon 6 : retourne des MCQ de dialogue "quelle réponse est correcte ?"
- [ ] Chaque MCQ a 3 options

---

## MISSION 9 — Refactoring écran de leçon pour Module 4

**Action :**
Modifie `app/lesson/[id].tsx` pour supporter `contentType === 'sentences'`.

### Détection du content type

```typescript
function getLessonContentType(moduleSortOrder: number): LessonContentType {
  if (moduleSortOrder === 1) return 'letters';
  if (moduleSortOrder === 2) return 'diacritics';
  if (moduleSortOrder === 3) return 'words';
  if (moduleSortOrder === 4) return 'sentences';
  return 'letters';
}
type LessonContentType = 'letters' | 'diacritics' | 'words' | 'sentences';
```

### Phase présentation pour Module 4

**Leçons 1-2 (démonstratifs) :**
1. Présenter le pronom démonstratif (WordCard mode full pour هذا/هذه/ذلك/تلك)
2. Expliquer la règle masculin/féminin (encadré pédagogique)
3. Afficher les phrases de la leçon avec `SentenceCard` mode `full`
4. Naviguer phrase par phrase avec un bouton "Suivant"

**Leçon 3 (pronoms possessifs) :**
1. Présenter le tableau des suffixes possessifs :
   ```
   -ي  (moi)     | كِتَابِي    (mon livre)
   -كَ  (toi m)  | كِتَابُكَ   (ton livre)
   -هُ  (lui)    | كِتَابُهُ   (son livre)
   -نَا (nous)   | كِتَابُنَا  (notre livre)
   ```
2. Montrer chaque phrase avec SentenceCard full
3. Insister sur la construction : radical + suffixe

**Leçon 4 (phrase nominale avec adjectif) :**
1. Expliquer la règle : sujet défini (avec al-) + adjectif indéfini = "X est [adj]"
2. Expliquer l'accord de l'adjectif : جَمِيل (m) → جَمِيلَة (f)
3. Afficher les phrases avec SentenceCard full

**Leçon 5 (fill blank) :**
1. Pas de phase présentation — aller directement aux exercices fill_blank
2. Message d'intro court : "Complète les phrases en choisissant le bon mot."

**Leçon 6 (dialogues) :**
1. Afficher chaque dialogue avec `DialogueDisplay`
2. Animer l'apparition réplique par réplique (1 réplique / 2 secondes auto, ou tap pour accélérer)
3. Après présentation d'un dialogue → exercice MCQ sur ce dialogue
4. Enchaîner les 3 dialogues

### Phase exercices pour Module 4

```typescript
if (contentType === 'sentences') {
  const lessonConfig = LESSON_SENTENCE_CONFIG[lessonSortOrder];
  let lessonSentences: Sentence[] = [];

  if (lessonConfig.sentenceIds) {
    lessonSentences = allSentences.filter(s => lessonConfig.sentenceIds!.includes(s.id));
  } else if (lessonConfig.type === 'fill_blank') {
    lessonSentences = allSentences.filter(s => s.difficulty <= 2);
  }

  const dialoguesWithTurns = lessonConfig.dialogueIds
    ? await Promise.all(lessonConfig.dialogueIds.map(id => getDialogueWithTurns(id)))
    : undefined;

  const exercises = generateSentenceExercises(
    lessonSortOrder, lessonSentences, allSentences, allWords,
    dialoguesWithTurns?.filter(Boolean) ?? undefined,
  );
  // → ExerciseRenderer
}
```

**Checkpoint :**
- [ ] `contentType === 'sentences'` détecté pour Module 4
- [ ] Leçons 1-4 : présentation + MCQ fonctionnels
- [ ] Leçon 5 : exercices fill_blank affichés et fonctionnels
- [ ] Leçon 6 : DialogueDisplay animé + MCQ de dialogue
- [ ] Modules 1, 2 et 3 fonctionnent toujours (aucune régression)

---

## MISSION 10 — Déverrouillage Module 4

La logique générique N→N-1 de É6 s'applique automatiquement. Aucune modification de code nécessaire.

**Vérification seulement :**

**Checkpoint :**
- [ ] Module 4 est `locked` tant que les 6 leçons du Module 3 ne sont pas `completed`
- [ ] Quand Module 3 est 100% terminé, Module 4 se déverrouille
- [ ] Feedback de déverrouillage visible (toast ou animation)

---

## MISSION 11 — SRS : cartes sentences après chaque leçon

**Action :**
Après la complétion d'une leçon du Module 4, créer des cartes SRS de type `sentence`.

```typescript
// Dans l'écran de leçon, après la phase exercices (Module 4) :
if (contentType === 'sentences') {
  const sentenceIds = lessonSentences.map(s => s.id);
  if (sentenceIds.length > 0) {
    createSRSCards.mutate({
      itemIds: sentenceIds,
      itemType: 'sentence',
    });
  }
}
```

### Révision des phrases dans l'onglet Réviser :

```typescript
if (card.item_type === 'sentence') {
  const sentence = await getSentenceById(card.item_id);
  // MCQ : Phrase arabe → traduction
  // Afficher SentenceCard mode compact
}
```

Ajoute `getSentenceById` dans `local-queries.ts` :

```typescript
export async function getSentenceById(id: string) {
  const db = getLocalDB();
  const row = await db.getFirstAsync<any>('SELECT * FROM sentences WHERE id = ?', [id]);
  if (!row) return null;
  return { ...row, word_ids: JSON.parse(row.word_ids ?? '[]') };
}
```

**Checkpoint :**
- [ ] Compléter une leçon Module 4 crée des cartes SRS `sentence`
- [ ] Les cartes `sentence` apparaissent dans l'onglet Réviser quand dues
- [ ] La révision affiche `SentenceCard` mode compact + MCQ traduction
- [ ] Les cartes `letter`, `diacritic`, `word` fonctionnent toujours
- [ ] **Aucun import `src/db/remote` dans l'écran de leçon ou le composant Réviser**

---

## MISSION 12 — Vérification end-to-end

**Action :**

```bash
npx expo start
```

### Scénario de test :

1. **Content sync** : Re-sync forcé (suppression app). Vérifier 17 phrases + 3 dialogues + 11 répliques en SQLite.

2. **Déverrouillage** : Module 4 locked tant que Module 3 incomplet → se déverrouille à 100%.

3. **Leçon 1 — هذا/هذه** :
   - WordCard pour هذا et هذه
   - 4 SentenceCards (هذا كتاب, هذه مدرسة, هذا قلم, هذه مكتبة)
   - MCQ AR→FR, FR→AR, + MCQ genre démonstratif

4. **Leçon 2 — ذلك/تلك** :
   - SentenceCards avec adjectifs
   - MCQ traduction + identification

5. **Leçon 3 — Pronoms possessifs** :
   - Tableau des suffixes affiché
   - SentenceCards : كتابي, كتابك, بيتنا, قلمه
   - MCQ : "Comment dit-on mon/ton/notre ?"

6. **Leçon 4 — Phrase nominale** :
   - Règle accord adjectif expliquée
   - SentenceCards : البيت كبير, الكتاب مفيد, المدرسة جميلة, القمر جميل
   - MCQ traduction

7. **Leçon 5 — Fill blank** :
   - Phrases à trou sur difficulté ≤ 2
   - Animation de remplissage sur bonne réponse
   - Flash rouge sur mauvaise réponse

8. **Leçon 6 — Dialogues** :
   - dial-salam : animation réplique par réplique
   - MCQ "quelle réponse est correcte ?"
   - Idem pour dial-maa-hatha et dial-taqdim

9. **SRS** : Cartes `sentence` dans l'onglet Réviser

10. **Offline** : Mode avion → tout fonctionne localement

11. **Régression** : Modules 1, 2, 3 fonctionnent toujours

### Points de vigilance :

- La direction RTL des phrases est irréprochable (padding, alignement, diacritiques)
- FillBlankExercise ne casse pas le flux ExerciseRenderer (type non connu précédemment)
- Les dialogues s'affichent correctement avec bulles A/B
- Les suffixes possessifs (-ي, -كَ, -هُ, -نَا) s'affichent sans bug de rendu
- **CRITIQUE : `grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/` → aucun résultat**

**Checkpoint final :**
- [ ] SQL Cloud : 19 nouveaux mots + 17 phrases + 3 dialogues + 11 répliques + 6 leçons M4
- [ ] Schéma SQLite local : sentences, dialogues, dialogue_turns créés
- [ ] Content-sync : 10 tables synchronisées
- [ ] Module 4 déverrouillé quand Module 3 complet (logique générique)
- [ ] Les 6 leçons jouables de bout en bout
- [ ] `SentenceCard`, `DialogueDisplay`, `FillBlankExercise` fonctionnent
- [ ] Le générateur produit MCQ + fill_blank + MCQ dialogue
- [ ] Cartes SRS `sentence` créées et révisables
- [ ] Aucune régression Modules 1, 2, 3
- [ ] **Aucun hook ni store n'importe `src/db/remote`**
- [ ] App fonctionnelle en mode avion
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 7

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Schéma SQLite : sentences, dialogues, dialogue_turns | ⬜ |
| 2 | SQL Cloud : 19 mots + 17 phrases + 3 dialogues + 11 répliques + 6 leçons M4 | ⬜ |
| 3 | content-sync (10 tables) + local-queries étendu | ⬜ |
| 4 | Hooks `useSentences` et `useDialogues` | ⬜ |
| 5 | Composant `SentenceCard` (full + compact + mode trou) | ⬜ |
| 6 | Composant `DialogueDisplay` (bulles A/B, animation progressive) | ⬜ |
| 7 | `FillBlankExercise` — premier usage du type fill_blank | ⬜ |
| 8 | Générateur `sentence-exercise-generator.ts` | ⬜ |
| 9 | Refactoring écran de leçon (Module 4 : démo, possessifs, fill_blank, dialogues) | ⬜ |
| 10 | Déverrouillage Module 4 (logique N→N-1 déjà en place) | ⬜ |
| 11 | SRS : cartes `sentence` + révision | ⬜ |
| 12 | Vérification end-to-end (online + offline + régression) | ⬜ |

> **Prochaine étape après validation :** Étape 8 — Audio : enregistrements natifs pour lettres, syllabes, mots et phrases (intégration Supabase Storage + cache local expo-file-system).

---

## GESTION /docs

**Fichiers à conserver dans /docs :**
- `ETAPE-7-module-construire-du-sens.md` (ce fichier)
- `lisaan-seed-letters.json` (référence lettres)

**Fichiers à supprimer de /docs :**
- `ETAPE-6-module-premiers-mots.md` (terminée)
