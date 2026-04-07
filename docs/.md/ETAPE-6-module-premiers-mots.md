# ÉTAPE 6 — Module 3 : Lire ses premiers mots

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0 (Supabase + polices), 1 (onboarding), 2 (Module 1 Alphabet + MCQ), 3 (SRS + progression), 4 (profil/réglages), **4.5 (migration offline-first : Supabase Cloud + expo-sqlite)**, **5 (Module 2 Harakats + MatchExercise)**.
> Cette étape construit le Module 3 complet : lecture de premiers mots, lettres solaires/lunaires avec al-, introduction au système de racines trilittères, ~28 mots organisés par 5 racines, et les composants/exercices associés.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (post-É4.5 — CRITIQUE)** :
> - **Offline-first** : Tous les hooks lisent depuis **SQLite local** (`src/db/local-queries.ts`). JAMAIS d'import de `src/db/remote` dans les hooks ou stores.
> - **Seuls** `content-sync.ts` et `sync-manager.ts` parlent à Supabase Cloud.
> - Après chaque écriture locale (progression, SRS), appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : les migrations SQL s'exécutent dans le Dashboard Supabase Cloud (SQL Editor).
> - Les exercices sont générés dynamiquement côté client (pas stockés en base).

> **Ce qui change dans cette étape** :
> - Les tables `roots`, `words`, `word_variants` (qui existent en Cloud depuis É0 mais ne sont pas encore utilisées) vont être peuplées avec de vraies données.
> - Le schéma SQLite local (`schema-local.ts`) doit être étendu pour inclure ces 3 tables.
> - Le content sync (`content-sync.ts`) doit synchroniser ces 3 nouvelles tables.
> - Deux nouveaux composants : `WordCard` et `RootFamilyDisplay`.
> - Un nouveau générateur d'exercices : `word-exercise-generator.ts`.

---

## MISSION 1 — Étendre le schéma SQLite local pour roots, words, word_variants

**Contexte :**
L'É4.5 a créé le schéma SQLite local avec 7 tables (letters, diacritics, modules, lessons, user_progress, srs_cards, user_settings) + sync_metadata. Les tables `roots`, `words` et `word_variants` existent dans Supabase Cloud (créées en É0) mais n'ont PAS de miroir SQLite local.

**Action :**
Modifie `src/db/schema-local.ts` pour ajouter les 3 tables manquantes.

Ajoute les `CREATE TABLE` suivants dans la fonction `initLocalSchema()`, **après** les tables existantes et **avant** les `CREATE INDEX` :

```sql
-- ============================================================
-- TABLES CONTENU — Vocabulaire et racines (É6)
-- ============================================================

CREATE TABLE IF NOT EXISTS roots (
  id TEXT PRIMARY KEY,
  consonants TEXT NOT NULL,        -- JSON array ["ك","ت","ب"]
  transliteration TEXT NOT NULL,   -- "k-t-b"
  core_meaning_fr TEXT NOT NULL,   -- "écrire"
  core_meaning_ar TEXT,
  frequency_rank INTEGER NOT NULL DEFAULT 100,
  pedagogy_notes TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  root_id TEXT,                     -- FK → roots (nullable pour mots-outils)
  arabic TEXT NOT NULL,             -- Mot sans harakats (كتاب)
  arabic_vocalized TEXT NOT NULL,   -- Mot avec harakats (كِتَاب)
  transliteration TEXT NOT NULL,
  ipa TEXT,
  translation_fr TEXT NOT NULL,     -- Traduction française
  pattern TEXT,                     -- Pattern morphologique (fiʿāl)
  pos TEXT,                         -- noun | verb | adj | adv | particle | pronoun
  frequency_rank INTEGER NOT NULL DEFAULT 100,
  audio_url TEXT,
  gender TEXT,                      -- masculine | feminine | n/a
  is_simple_word INTEGER NOT NULL DEFAULT 0,  -- 1 = mot simple (leçon 1), 0 = mot de racine
  pedagogy_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT,
  FOREIGN KEY (root_id) REFERENCES roots(id)
);

CREATE TABLE IF NOT EXISTS word_variants (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'msa',  -- msa | darija | egyptian | levantine | khaliji | quranic
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT,
  transliteration TEXT,
  audio_url TEXT,
  notes_fr TEXT,
  synced_at TEXT,
  FOREIGN KEY (word_id) REFERENCES words(id)
);
```

Et ajoute ces index à la fin, avec les index existants :

```sql
CREATE INDEX IF NOT EXISTS idx_words_root ON words(root_id);
CREATE INDEX IF NOT EXISTS idx_words_sort ON words(sort_order);
CREATE INDEX IF NOT EXISTS idx_words_simple ON words(is_simple_word);
CREATE INDEX IF NOT EXISTS idx_word_variants_word ON word_variants(word_id, variant);
CREATE INDEX IF NOT EXISTS idx_roots_freq ON roots(frequency_rank);
```

> **Note importante** : La colonne `translation_fr` est ajoutée dans la table `words` locale (elle n'existe pas dans le schéma Cloud d'origine). Si elle n'est pas dans le Cloud, crée-la dans la Mission 2 (SQL Cloud). La colonne `is_simple_word` est une commodité locale pour distinguer les mots de la leçon 1 (simples, sans racine) des mots de racine (leçons 3-5).

**Checkpoint :**
- [ ] `schema-local.ts` compile sans erreur
- [ ] Les tables `roots`, `words`, `word_variants` sont créées au démarrage de l'app
- [ ] Les index sont créés
- [ ] Les tables existantes (letters, diacritics, etc.) ne sont pas affectées

---

## MISSION 2 — Seeder les racines, mots et leçons dans Supabase Cloud

**Action :**
Ouvre le **Dashboard Supabase Cloud** → **SQL Editor** → Nouvelle requête.

### 2.1 — Vérifier et enrichir le schéma Cloud

Avant d'insérer les données, assure-toi que les colonnes nécessaires existent :

```sql
-- Ajouter les colonnes manquantes à la table words (si absentes)
ALTER TABLE words ADD COLUMN IF NOT EXISTS translation_fr TEXT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS is_simple_word BOOLEAN DEFAULT false;
ALTER TABLE words ADD COLUMN IF NOT EXISTS pedagogy_notes TEXT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Ajouter la colonne pedagogy_notes à roots (si absente)
ALTER TABLE roots ADD COLUMN IF NOT EXISTS pedagogy_notes TEXT;
```

### 2.2 — Supprimer les données d'exemple de É0 (si présentes)

```sql
-- Les données de test de É0 (6 roots, 6 words) sont incomplètes.
-- Les supprimer pour repartir proprement.
DELETE FROM word_variants;
DELETE FROM words;
DELETE FROM roots;
```

### 2.3 — Insérer les 5 racines

```sql
INSERT INTO roots (id, consonants, transliteration, core_meaning_fr, core_meaning_ar, frequency_rank, pedagogy_notes)
VALUES
  ('root-ktb', ARRAY['ك','ت','ب'], 'k-t-b', 'écrire', 'الكِتابة', 1,
   'La racine la plus iconique pour enseigner le système de racines. Tous les mots liés à l''écriture, aux livres et aux bureaux en dérivent. C''est la "star" pédagogique.'),
  ('root-3lm', ARRAY['ع','ل','م'], 'ʿ-l-m', 'savoir', 'العِلم', 2,
   'La racine du savoir et de l''enseignement. Très présente dans le vocabulaire quotidien et religieux. عالم (savant/monde) est un mot que les apprenants reconnaissent souvent.'),
  ('root-drs', ARRAY['د','ر','س'], 'd-r-s', 'étudier', 'الدِّراسة', 3,
   'La racine de l''étude. Essentielle pour tout apprenant car elle inclut "leçon" (درس) et "école" (مدرسة). Très motivante — l''apprenant parle de ce qu''il fait !'),
  ('root-qr2', ARRAY['ق','ر','أ'], 'q-r-ʾ', 'lire', 'القِراءة', 4,
   'La racine de la lecture. Le premier mot révélé du Coran est اقرأ (lis !). Pour les apprenants motivés par la foi, c''est une racine chargée de sens.'),
  ('root-fth', ARRAY['ف','ت','ح'], 'f-t-ḥ', 'ouvrir', 'الفَتح', 5,
   'La racine de l''ouverture. Inclut الفاتحة (la Fatiha, première sourate) et مفتاح (clé). Le lien avec la fatha (la voyelle "a" = "ouverture" de la bouche) est un bonus pédagogique.');
```

### 2.4 — Insérer les mots simples (sans racine — leçon 1)

```sql
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, translation_fr, pos, frequency_rank, gender, is_simple_word, sort_order, pedagogy_notes)
VALUES
  ('word-bayt', NULL, 'بيت', 'بَيْت', 'bayt', 'maison', 'noun', 5, 'masculine', true, 1,
   'Mot très courant. 3 lettres : ba-ya-ta. Le ya porte un soukoun (بَيْت). Premier mot de lecture idéal.'),
  ('word-bab', NULL, 'باب', 'بَاب', 'bāb', 'porte', 'noun', 8, 'masculine', true, 2,
   'Mot court et symétrique. Le alif au milieu est une voyelle longue ā. Facile à décoder.'),
  ('word-umm', NULL, 'أم', 'أُمّ', 'umm', 'mère', 'noun', 3, 'feminine', true, 3,
   'Deux lettres seulement. La chadda sur le mim double la consonne. Mot universel et affectif.'),
  ('word-ab', NULL, 'أب', 'أَب', 'ab', 'père', 'noun', 4, 'masculine', true, 4,
   'Le mot le plus court possible : deux lettres. Facile à lire, familier.'),
  ('word-maa', NULL, 'ماء', 'مَاء', 'māʾ', 'eau', 'noun', 6, 'masculine', true, 5,
   'Se termine par un hamza. Introduction douce à la hamza en contexte réel.'),
  ('word-yawm', NULL, 'يوم', 'يَوْم', 'yawm', 'jour', 'noun', 7, 'masculine', true, 6,
   'Le waw porte un soukoun. Mot du quotidien, très utile.'),
  ('word-shams', NULL, 'شمس', 'شَمْس', 'shams', 'soleil', 'noun', 10, 'feminine', true, 7,
   'Lettre solaire : الشَّمْس (ash-shams). Exemple parfait pour enseigner l''assimilation de l''article.'),
  ('word-qamar', NULL, 'قمر', 'قَمَر', 'qamar', 'lune', 'noun', 12, 'masculine', true, 8,
   'Lettre lunaire : القَمَر (al-qamar). Le contraste avec شمس est l''outil pédagogique idéal pour solaires/lunaires.');
```

### 2.5 — Insérer les mots de racine ك-ت-ب

```sql
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, translation_fr, pattern, pos, frequency_rank, gender, is_simple_word, sort_order, pedagogy_notes)
VALUES
  ('word-kitab', 'root-ktb', 'كتاب', 'كِتَاب', 'kitāb', 'livre', 'fiʿāl', 'noun', 1, 'masculine', false, 10,
   'Le mot arabe le plus connu. Pattern fiʿāl = nom d''objet/résultat. كِتاب = ce qui résulte de l''écriture.'),
  ('word-katib', 'root-ktb', 'كاتب', 'كَاتِب', 'kātib', 'écrivain', 'fāʿil', 'noun', 15, 'masculine', false, 11,
   'Pattern fāʿil = celui qui fait l''action. كاتب = celui qui écrit.'),
  ('word-maktaba', 'root-ktb', 'مكتبة', 'مَكْتَبَة', 'maktaba', 'bibliothèque', 'mafʿala', 'noun', 20, 'feminine', false, 12,
   'Pattern mafʿala = lieu de l''action. مكتبة = le lieu où l''on écrit/lit.'),
  ('word-maktub', 'root-ktb', 'مكتوب', 'مَكْتُوب', 'maktūb', 'écrit / destin', 'mafʿūl', 'noun', 25, 'masculine', false, 13,
   'Pattern mafʿūl = participe passif. مكتوب = ce qui est écrit, le destin. Concept culturel fort.');
```

### 2.6 — Insérer les mots de racine ع-ل-م

```sql
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, translation_fr, pattern, pos, frequency_rank, gender, is_simple_word, sort_order, pedagogy_notes)
VALUES
  ('word-3ilm', 'root-3lm', 'علم', 'عِلْم', 'ʿilm', 'science / savoir', 'fiʿl', 'noun', 2, 'masculine', false, 20,
   'Le savoir en arabe. Très valorisé dans la culture arabo-islamique. Le ع (ayn) est un défi de prononciation.'),
  ('word-3alim', 'root-3lm', 'عالم', 'عَالِم', 'ʿālim', 'savant', 'fāʿil', 'noun', 18, 'masculine', false, 21,
   'Pattern fāʿil = celui qui sait. Attention : عَالَم (ʿālam) avec fatha sur le lam = monde. Même lettres, sens différent selon les harakats !'),
  ('word-mu3allim', 'root-3lm', 'معلم', 'مُعَلِّم', 'muʿallim', 'enseignant', 'mufaʿʿil', 'noun', 22, 'masculine', false, 22,
   'Pattern mufa''il = celui qui fait faire l''action. La chadda sur le lam est essentielle à la prononciation.'),
  ('word-ta3allama', 'root-3lm', 'تعلم', 'تَعَلَّمَ', 'taʿallama', 'apprendre', 'tafaʿʿala', 'verb', 28, 'n/a', false, 23,
   'Forme V (tafaʿʿala) = action réfléchie. تعلّم = se faire enseigner soi-même = apprendre.');
```

### 2.7 — Insérer les mots de racine د-ر-س

```sql
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, translation_fr, pattern, pos, frequency_rank, gender, is_simple_word, sort_order, pedagogy_notes)
VALUES
  ('word-dars', 'root-drs', 'درس', 'دَرْس', 'dars', 'leçon', 'faʿl', 'noun', 9, 'masculine', false, 30,
   'Mot ultra-pertinent : l''apprenant est EN TRAIN de faire un درس ! Le soukoun sur le ra crée le cluster dr-.'),
  ('word-madrasa', 'root-drs', 'مدرسة', 'مَدْرَسَة', 'madrasa', 'école', 'mafʿala', 'noun', 11, 'feminine', false, 31,
   'Même pattern que مكتبة (mafʿala = lieu). L''apprenant commence à reconnaître le pattern !'),
  ('word-mudarris', 'root-drs', 'مدرس', 'مُدَرِّس', 'mudarris', 'professeur', 'mufaʿʿil', 'noun', 16, 'masculine', false, 32,
   'Même pattern que معلم (celui qui fait faire). La chadda est sur le ra ici.');
```

### 2.8 — Insérer les mots de racine ق-ر-أ

```sql
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, translation_fr, pattern, pos, frequency_rank, gender, is_simple_word, sort_order, pedagogy_notes)
VALUES
  ('word-quran', 'root-qr2', 'قرآن', 'قُرْآن', 'qurʾān', 'Coran', 'fuʿlān', 'noun', 1, 'masculine', false, 40,
   'Le mot le plus chargé de sens pour beaucoup d''apprenants. Littéralement "la récitation / la lecture". Le alif-madda (آ) est un alif + hamza + voyelle longue.'),
  ('word-qari2', 'root-qr2', 'قارئ', 'قَارِئ', 'qāriʾ', 'lecteur / récitateur', 'fāʿil', 'noun', 30, 'masculine', false, 41,
   'Pattern fāʿil. Un قارئ du Coran est un récitateur — titre respecté.'),
  ('word-qira2a', 'root-qr2', 'قراءة', 'قِرَاءَة', 'qirāʾa', 'lecture', 'fiʿāla', 'noun', 14, 'feminine', false, 42,
   'Le nom d''action de "lire". La hamza sur le alif rend ce mot un peu complexe — bon exercice.');
```

### 2.9 — Insérer les mots de racine ف-ت-ح

```sql
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, translation_fr, pattern, pos, frequency_rank, gender, is_simple_word, sort_order, pedagogy_notes)
VALUES
  ('word-fath', 'root-fth', 'فتح', 'فَتْح', 'fatḥ', 'ouverture / conquête', 'faʿl', 'noun', 13, 'masculine', false, 50,
   'Le nom d''action de "ouvrir". Lien direct avec la fatha (فَتْحة) = ouverture de la bouche. Pont pédagogique avec le Module 2.'),
  ('word-miftah', 'root-fth', 'مفتاح', 'مِفْتَاح', 'miftāḥ', 'clé', 'mifʿāl', 'noun', 19, 'masculine', false, 51,
   'Pattern mifʿāl = instrument de l''action. مفتاح = l''instrument qui ouvre. Pattern concret et mémorable.'),
  ('word-fatiha', 'root-fth', 'فاتحة', 'فَاتِحَة', 'fātiḥa', 'ouverture / Fatiha', 'fāʿila', 'noun', 8, 'feminine', false, 52,
   'La Fatiha = la sourate "ouvrante" du Coran. Pour les apprenants motivés par la foi, ce mot est un jalon émotionnel.');
```

### 2.10 — Insérer les variantes MSA (obligatoire pour chaque mot)

```sql
-- Variantes MSA pour tous les mots (une ligne par mot)
INSERT INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration)
SELECT
  'var-msa-' || w.id,
  w.id,
  'msa',
  w.arabic,
  w.arabic_vocalized,
  w.transliteration
FROM words w
WHERE NOT EXISTS (
  SELECT 1 FROM word_variants wv WHERE wv.word_id = w.id AND wv.variant = 'msa'
);
```

### 2.11 — Seeder les 6 leçons du Module 3

```sql
INSERT INTO lessons (module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
SELECT
  m.id, v.title_fr, v.title_ar, v.description_fr, v.sort_order, v.xp_reward, v.estimated_minutes
FROM modules m,
(VALUES
  ('Tes premiers mots', 'كَلِمَاتُكَ الأُولَى', 'Lis tes 8 premiers mots arabes : maison, porte, mère, père, eau, jour, soleil, lune.', 1, 20, 6),
  ('L''article al- : solaires et lunaires', 'الـ : شَمْسِيَّة وَقَمَرِيَّة', 'Découvre comment l''article "al-" change de prononciation selon la lettre qui suit.', 2, 20, 6),
  ('La magie des racines : ك-ت-ب', 'سِحْرُ الجُذُور : ك-ت-ب', 'Un concept révolutionnaire : en arabe, une racine de 3 lettres génère toute une famille de mots.', 3, 25, 7),
  ('Racines ع-ل-م et د-ر-س', 'جُذُور : ع-ل-م وَ د-ر-س', 'Le savoir et l''étude. Deux racines qui décrivent exactement ce que tu es en train de faire !', 4, 25, 7),
  ('Racines ق-ر-أ et ف-ت-ح', 'جُذُور : ق-ر-أ وَ ف-ت-ح', 'Lire et ouvrir. Du Coran à la clé de ta maison — l''arabe connecte les idées.', 5, 25, 7),
  ('Lecture libre : tous les mots', 'قِرَاءَة حُرَّة', 'Révise tous les mots appris. Décode, associe, maîtrise. Tu lis l''arabe !', 6, 30, 8)
) AS v(title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
WHERE m.sort_order = 3;  -- Module 3
```

**Checkpoint :**
- [ ] Tout le SQL s'exécute sans erreur dans le Dashboard Cloud
- [ ] `SELECT COUNT(*) FROM roots;` → 5
- [ ] `SELECT COUNT(*) FROM words;` → 27 (8 simples + 19 de racines)
- [ ] `SELECT COUNT(*) FROM word_variants;` → 27 (une variante MSA par mot)
- [ ] `SELECT COUNT(*) FROM lessons WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3);` → 6
- [ ] `SELECT w.transliteration, r.transliteration as root FROM words w LEFT JOIN roots r ON w.root_id = r.id ORDER BY w.sort_order;` retourne les mots avec leurs racines

---

## MISSION 3 — Étendre content-sync et local-queries pour roots/words

**Action :**

### 3.1 — Ajouter les fonctions CRUD dans local-queries.ts

```typescript
// Dans src/db/local-queries.ts — AJOUTER :

// --- Roots ---

export async function getAllRoots() {
  const db = getLocalDB();
  const rows = await db.getAllAsync<any>('SELECT * FROM roots ORDER BY frequency_rank ASC');
  return rows.map(r => ({
    ...r,
    consonants: typeof r.consonants === 'string' ? JSON.parse(r.consonants) : r.consonants ?? [],
  }));
}

export async function getRootById(rootId: string) {
  const db = getLocalDB();
  const row = await db.getFirstAsync<any>('SELECT * FROM roots WHERE id = ?', [rootId]);
  if (!row) return null;
  return {
    ...row,
    consonants: typeof row.consonants === 'string' ? JSON.parse(row.consonants) : row.consonants ?? [],
  };
}

export async function upsertRoots(roots: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const r of roots) {
    await db.runAsync(
      `INSERT OR REPLACE INTO roots (id, consonants, transliteration, core_meaning_fr, core_meaning_ar, frequency_rank, pedagogy_notes, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, JSON.stringify(r.consonants ?? []), r.transliteration, r.core_meaning_fr, r.core_meaning_ar, r.frequency_rank, r.pedagogy_notes, now]
    );
  }
}

// --- Words ---

export async function getAllWords() {
  const db = getLocalDB();
  return db.getAllAsync<any>('SELECT * FROM words ORDER BY sort_order ASC');
}

export async function getSimpleWords() {
  const db = getLocalDB();
  return db.getAllAsync<any>('SELECT * FROM words WHERE is_simple_word = 1 ORDER BY sort_order ASC');
}

export async function getWordsByRootId(rootId: string) {
  const db = getLocalDB();
  return db.getAllAsync<any>('SELECT * FROM words WHERE root_id = ? ORDER BY sort_order ASC', [rootId]);
}

export async function getWordsByRootIds(rootIds: string[]) {
  const db = getLocalDB();
  const placeholders = rootIds.map(() => '?').join(',');
  return db.getAllAsync<any>(
    `SELECT * FROM words WHERE root_id IN (${placeholders}) ORDER BY sort_order ASC`,
    rootIds
  );
}

export async function upsertWords(words: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const w of words) {
    await db.runAsync(
      `INSERT OR REPLACE INTO words (
        id, root_id, arabic, arabic_vocalized, transliteration, ipa,
        translation_fr, pattern, pos, frequency_rank, audio_url,
        gender, is_simple_word, pedagogy_notes, sort_order, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.id, w.root_id, w.arabic, w.arabic_vocalized, w.transliteration, w.ipa,
       w.translation_fr, w.pattern, w.pos, w.frequency_rank, w.audio_url,
       w.gender, w.is_simple_word ? 1 : 0, w.pedagogy_notes, w.sort_order ?? 0, now]
    );
  }
}

// --- Word Variants ---

export async function getVariantsForWord(wordId: string, variant: string = 'msa') {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    'SELECT * FROM word_variants WHERE word_id = ? AND variant = ?',
    [wordId, variant]
  );
}

export async function upsertWordVariants(variants: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const v of variants) {
    await db.runAsync(
      `INSERT OR REPLACE INTO word_variants (id, word_id, variant, arabic, arabic_vocalized, transliteration, audio_url, notes_fr, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.id, v.word_id, v.variant, v.arabic, v.arabic_vocalized, v.transliteration, v.audio_url, v.notes_fr, now]
    );
  }
}
```

### 3.2 — Étendre content-sync.ts

Ajoute la synchronisation des 3 nouvelles tables dans `syncContentFromCloud()`, **après** les tables existantes (letters, diacritics, modules, lessons) :

```typescript
// Dans src/engines/content-sync.ts — AJOUTER dans syncContentFromCloud() :

// --- Roots ---
try {
  const { data, error } = await supabase
    .from('roots')
    .select('*')
    .order('frequency_rank', { ascending: true });
  if (error) throw error;
  if (data && data.length > 0) {
    await upsertRoots(data);
    await updateSyncMetadata('roots', data.length);
    result.tables.roots = { synced: data.length, skipped: false };
  }
} catch (e: any) {
  result.errors.push(`roots: ${e.message}`);
}

// --- Words ---
try {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  if (data && data.length > 0) {
    await upsertWords(data);
    await updateSyncMetadata('words', data.length);
    result.tables.words = { synced: data.length, skipped: false };
  }
} catch (e: any) {
  result.errors.push(`words: ${e.message}`);
}

// --- Word Variants ---
try {
  const { data, error } = await supabase
    .from('word_variants')
    .select('*');
  if (error) throw error;
  if (data && data.length > 0) {
    await upsertWordVariants(data);
    await updateSyncMetadata('word_variants', data.length);
    result.tables.word_variants = { synced: data.length, skipped: false };
  }
} catch (e: any) {
  result.errors.push(`word_variants: ${e.message}`);
}
```

Et met à jour `needsContentSync()` pour inclure les nouvelles tables :

```typescript
// Modifier la liste des tables :
const tables = ['letters', 'diacritics', 'modules', 'lessons', 'roots', 'words', 'word_variants'];
```

**Checkpoint :**
- [ ] `local-queries.ts` compile avec les nouvelles fonctions
- [ ] `content-sync.ts` synchronise les 7 tables (au lieu de 4)
- [ ] Après re-sync (supprime l'app et relance), `getAllRoots()` retourne 5 racines
- [ ] `getAllWords()` retourne 27 mots
- [ ] `getWordsByRootId('root-ktb')` retourne 4 mots (كتاب, كاتب, مكتبة, مكتوب)
- [ ] `getSimpleWords()` retourne 8 mots

---

## MISSION 4 — Hooks useRoots et useWords (lecture SQLite)

**Action :**

### 4.1 — Créer `src/hooks/useRoots.ts`

```typescript
// src/hooks/useRoots.ts

import { useQuery } from '@tanstack/react-query';
import { getAllRoots, getRootById } from '../db/local-queries';

export interface Root {
  id: string;
  consonants: string[];
  transliteration: string;
  core_meaning_fr: string;
  core_meaning_ar: string | null;
  frequency_rank: number;
  pedagogy_notes: string | null;
}

export function useRoots() {
  return useQuery({
    queryKey: ['roots'],
    queryFn: getAllRoots,
    staleTime: Infinity,
  });
}

export function useRoot(rootId: string | null) {
  return useQuery({
    queryKey: ['root', rootId],
    queryFn: () => getRootById(rootId!),
    enabled: !!rootId,
    staleTime: Infinity,
  });
}
```

### 4.2 — Créer `src/hooks/useWords.ts`

```typescript
// src/hooks/useWords.ts

import { useQuery } from '@tanstack/react-query';
import { getAllWords, getSimpleWords, getWordsByRootId, getWordsByRootIds } from '../db/local-queries';

export interface Word {
  id: string;
  root_id: string | null;
  arabic: string;
  arabic_vocalized: string;
  transliteration: string;
  ipa: string | null;
  translation_fr: string;
  pattern: string | null;
  pos: string | null;
  frequency_rank: number;
  audio_url: string | null;
  gender: string | null;
  is_simple_word: boolean;
  pedagogy_notes: string | null;
  sort_order: number;
}

export function useWords() {
  return useQuery({
    queryKey: ['words'],
    queryFn: getAllWords,
    staleTime: Infinity,
  });
}

export function useSimpleWords() {
  return useQuery({
    queryKey: ['words', 'simple'],
    queryFn: getSimpleWords,
    staleTime: Infinity,
  });
}

export function useWordsByRoot(rootId: string | null) {
  return useQuery({
    queryKey: ['words', 'root', rootId],
    queryFn: () => getWordsByRootId(rootId!),
    enabled: !!rootId,
    staleTime: Infinity,
  });
}

export function useWordsByRoots(rootIds: string[]) {
  return useQuery({
    queryKey: ['words', 'roots', rootIds],
    queryFn: () => getWordsByRootIds(rootIds),
    enabled: rootIds.length > 0,
    staleTime: Infinity,
  });
}
```

**Checkpoint :**
- [ ] `useRoots.ts` et `useWords.ts` compilent sans erreur
- [ ] **Aucun import de `src/db/remote`** dans ces fichiers
- [ ] `useRoots()` retourne 5 racines depuis SQLite
- [ ] `useSimpleWords()` retourne 8 mots
- [ ] `useWordsByRoot('root-ktb')` retourne 4 mots

---

## MISSION 5 — Composant WordCard

**Action :**
Crée `src/components/arabic/WordCard.tsx`.

C'est la carte de présentation d'un mot, équivalent de LetterCard et DiacriticCard.

### Props :

```typescript
interface WordCardProps {
  word: Word;
  root?: Root | null;
  mode: 'compact' | 'full';
  showTransliteration?: boolean;
  showTranslation?: boolean;
  fontSize?: 'medium' | 'large' | 'xlarge';
}
```

### Structure mode `full` :

```
┌─────────────────────────────────────┐
│                                     │
│         كِتَاب                      │  ← arabic_vocalized (ArabicText, xlarge)
│         kitāb                       │  ← transliteration (si activée)
│         livre                       │  ← translation_fr (si activée)
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Racine : ك-ت-ب (écrire)   │    │  ← Root info (si root_id non null)
│  │  Pattern : fiʿāl            │    │  ← Pattern morphologique
│  │  Genre : masculin            │    │  ← gender
│  └─────────────────────────────┘    │
│                                     │
│  "Le mot arabe le plus connu..."   │  ← pedagogy_notes
│                                     │
└─────────────────────────────────────┘
```

### Structure mode `compact` :

```
┌──────────────────┐
│    كِتَاب         │  ← arabic_vocalized (large)
│    kitāb          │  ← transliteration
│    livre          │  ← translation_fr
└──────────────────┘
```

### Comportement :

1. Le texte arabe utilise `ArabicText` avec les settings utilisateur (harakats, translittération)
2. Si `root` est fourni, afficher la section racine avec les consonnes séparées par des tirets
3. Le pattern est affiché en italique
4. Les `pedagogy_notes` s'affichent sous la carte en mode full
5. **Style** : même direction artistique que LetterCard/DiacriticCard — fond blanc, border-radius 16, padding 24, ombre légère

**Checkpoint :**
- [ ] `WordCard.tsx` compile sans erreur
- [ ] Mode `full` affiche le mot, sa racine, son pattern et les notes pédagogiques
- [ ] Mode `compact` affiche le mot avec translittération et traduction
- [ ] Les mots sans racine (is_simple_word) n'affichent pas la section racine
- [ ] La translittération et la traduction respectent les settings utilisateur

---

## MISSION 6 — Composant RootFamilyDisplay

**Action :**
Crée `src/components/arabic/RootFamilyDisplay.tsx`.

C'est LE composant pédagogique clé du Module 3. Il montre une racine et tous les mots qui en dérivent, visuellement connectés.

### Props :

```typescript
interface RootFamilyDisplayProps {
  root: Root;
  words: Word[];
  showTransliteration?: boolean;
  showTranslation?: boolean;
  highlightWordId?: string;  // Pour mettre en surbrillance un mot spécifique
  onWordTap?: (word: Word) => void;
}
```

### Structure :

```
┌─────────────────────────────────────┐
│                                     │
│        ك - ت - ب                   │  ← Consonnes de la racine (grande taille, espacées)
│        écrire                       │  ← core_meaning_fr
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ كِتَاب   │  │ كَاتِب   │          │  ← Mots dérivés en grille
│  │ livre    │  │ écrivain │          │
│  │ fiʿāl   │  │ fāʿil   │          │
│  └─────────┘  └─────────┘          │
│  ┌─────────┐  ┌─────────┐          │
│  │ مَكْتَبَة │  │ مَكْتُوب │          │
│  │ biblio.  │  │ destin  │          │
│  │ mafʿala │  │ mafʿūl  │          │
│  └─────────┘  └─────────┘          │
│                                     │
└─────────────────────────────────────┘
```

### Comportement :

1. **En-tête racine** : Les 3 consonnes sont affichées en très grande taille (xlarge), séparées par des tirets, en police Amiri. Le sens fondamental est en dessous.
2. **Grille de mots** : Les mots dérivés sont affichés en grille 2 colonnes. Chaque mot est un mini-WordCard compact.
3. **Highlight** : Si `highlightWordId` est fourni, ce mot a une bordure dorée (`#D4A843`) et un fond légèrement doré (`#FFF8E1`).
4. **Tap** : Chaque mot est cliquable → appelle `onWordTap` (pour les exercices).
5. **Animation** : Les mots apparaissent en stagger (100ms entre chaque), de haut en bas.
6. **Style** : Fond `#FAFAF5`, border-radius 16. Les consonnes de la racine sont en couleur `#2A9D8F`. Les patterns morphologiques sont en italique gris.

**Checkpoint :**
- [ ] `RootFamilyDisplay.tsx` compile sans erreur
- [ ] Les 3 consonnes de la racine s'affichent en grande taille
- [ ] Les mots dérivés apparaissent en grille 2 colonnes
- [ ] Le tap sur un mot appelle `onWordTap`
- [ ] Le highlight fonctionne sur un mot spécifique
- [ ] Les settings (translittération, traduction) sont respectés

---

## MISSION 7 — Générateur d'exercices mots et racines

**Action :**
Crée `src/engines/word-exercise-generator.ts`.

```typescript
// src/engines/word-exercise-generator.ts

import type { ExerciseConfig, ExerciseOption, MatchPair } from '../types/exercise';
import type { Word } from '../hooks/useWords';
import type { Root } from '../hooks/useRoots';

/**
 * Mapping leçon (sort_order dans Module 3) → type de contenu
 *
 * Leçon 1 : Mots simples (is_simple_word = true)
 * Leçon 2 : Solaires/Lunaires (mots simples + al-)
 * Leçon 3 : Racine k-t-b
 * Leçon 4 : Racines ʿ-l-m et d-r-s
 * Leçon 5 : Racines q-r-ʾ et f-t-ḥ
 * Leçon 6 : Révision de tous les mots
 */
export const LESSON_WORD_CONFIG: Record<number, {
  type: 'simple' | 'solar_lunar' | 'root' | 'revision';
  rootIds?: string[];
}> = {
  1: { type: 'simple' },
  2: { type: 'solar_lunar' },
  3: { type: 'root', rootIds: ['root-ktb'] },
  4: { type: 'root', rootIds: ['root-3lm', 'root-drs'] },
  5: { type: 'root', rootIds: ['root-qr2', 'root-fth'] },
  6: { type: 'revision' },
};

/**
 * Génère des exercices pour une leçon du Module 3.
 */
export function generateWordExercises(
  lessonSortOrder: number,
  lessonWords: Word[],
  allWords: Word[],
  roots: Root[],
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];
  const config = LESSON_WORD_CONFIG[lessonSortOrder];

  if (config.type === 'simple' || config.type === 'revision') {
    // MCQ : Mot arabe → traduction française
    for (const word of lessonWords) {
      exercises.push({
        id: `mcq-ar-to-fr-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ : Traduction française → mot arabe
    for (const word of lessonWords.slice(0, 4)) {
      exercises.push({
        id: `mcq-fr-to-ar-${word.id}`,
        type: 'mcq',
        instruction_fr: `Trouve le mot "${word.translation_fr}"`,
        prompt: { fr: word.translation_fr },
        options: generateTranslationOptions(word, allWords, 'fr_to_ar'),
        metadata: { word_id: word.id },
      });
    }

    // MCQ : Mot arabe → translittération (exercice de décodage)
    for (const word of lessonWords.slice(0, 4)) {
      exercises.push({
        id: `mcq-decode-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Comment se prononce ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateDecodingOptions(word, allWords),
        metadata: { word_id: word.id },
      });
    }
  }

  if (config.type === 'solar_lunar') {
    // Exercices spécifiques solaires/lunaires
    for (const word of lessonWords) {
      const firstLetter = word.arabic[0];
      // On détermine si la première lettre est solaire ou lunaire
      // (cette info est dans le seed letters, mais on simplifie ici)
      exercises.push({
        id: `mcq-article-${word.id}`,
        type: 'mcq',
        instruction_fr: `Comment se prononce "le/la" + "${word.transliteration}" ?`,
        prompt: { ar: word.arabic_vocalized, fr: word.translation_fr },
        options: generateArticleOptions(word),
        metadata: { word_id: word.id },
      });
    }

    // + les MCQ de traduction classiques
    for (const word of lessonWords) {
      exercises.push({
        id: `mcq-ar-to-fr-solar-${word.id}`,
        type: 'mcq',
        instruction_fr: 'Que signifie ce mot ?',
        prompt: { ar: word.arabic_vocalized },
        options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
        metadata: { word_id: word.id },
      });
    }
  }

  if (config.type === 'root') {
    const lessonRoots = roots.filter(r => config.rootIds?.includes(r.id));

    for (const root of lessonRoots) {
      const rootWords = lessonWords.filter(w => w.root_id === root.id);

      // MCQ : Mot arabe → traduction
      for (const word of rootWords) {
        exercises.push({
          id: `mcq-root-ar-to-fr-${word.id}`,
          type: 'mcq',
          instruction_fr: 'Que signifie ce mot ?',
          prompt: { ar: word.arabic_vocalized },
          options: generateTranslationOptions(word, allWords, 'ar_to_fr'),
          metadata: { word_id: word.id, root_id: root.id },
        });
      }

      // Match : Associer les mots de la racine à leurs traductions
      if (rootWords.length >= 2) {
        exercises.push({
          id: `match-root-${root.id}`,
          type: 'match',
          instruction_fr: `Associe les mots de la racine ${root.transliteration}`,
          prompt: { fr: `Racine : ${root.consonants.join('-')} (${root.core_meaning_fr})` },
          matchPairs: rootWords.slice(0, 4).map(w => ({
            id: w.id,
            left: { ar: w.arabic_vocalized },
            right: { fr: w.translation_fr },
          })),
          metadata: { root_id: root.id },
        });
      }

      // MCQ : "Quel mot vient de la racine k-t-b ?"
      if (rootWords.length > 0) {
        const correctWord = rootWords[0];
        const distractors = allWords
          .filter(w => w.root_id !== root.id && w.root_id !== null)
          .slice(0, 2);

        exercises.push({
          id: `mcq-identify-root-${root.id}`,
          type: 'mcq',
          instruction_fr: `Quel mot vient de la racine ${root.consonants.join('-')} (${root.core_meaning_fr}) ?`,
          prompt: { fr: `Racine : ${root.consonants.join(' - ')}` },
          options: shuffleArray([
            { id: correctWord.id, text: { ar: correctWord.arabic_vocalized, fr: correctWord.translation_fr }, correct: true },
            ...distractors.map(d => ({
              id: d.id, text: { ar: d.arabic_vocalized, fr: d.translation_fr }, correct: false,
            })),
          ]),
          metadata: { root_id: root.id },
        });
      }
    }
  }

  return shuffleArray(exercises);
}

// ---- Helpers ----

function generateTranslationOptions(
  correct: Word,
  allWords: Word[],
  direction: 'ar_to_fr' | 'fr_to_ar',
): ExerciseOption[] {
  const distractors = allWords
    .filter(w => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    {
      id: correct.id,
      text: direction === 'ar_to_fr'
        ? { fr: correct.translation_fr }
        : { ar: correct.arabic_vocalized },
      correct: true,
    },
    ...distractors.map(d => ({
      id: d.id,
      text: direction === 'ar_to_fr'
        ? { fr: d.translation_fr }
        : { ar: d.arabic_vocalized },
      correct: false,
    })),
  ]);
}

function generateDecodingOptions(correct: Word, allWords: Word[]): ExerciseOption[] {
  const distractors = allWords
    .filter(w => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return shuffleArray([
    { id: correct.id, text: { fr: correct.transliteration }, correct: true },
    ...distractors.map(d => ({
      id: d.id, text: { fr: d.transliteration }, correct: false,
    })),
  ]);
}

function generateArticleOptions(word: Word): ExerciseOption[] {
  // Simplification : on génère les 2 options (al- prononcé vs assimilé)
  const assimilated = `a${word.transliteration.charAt(0)}-${word.transliteration}`;
  const regular = `al-${word.transliteration}`;

  // TODO : déterminer si la lettre est solaire ou lunaire via les données letters
  // Pour l'instant, on fournit les deux options et la bonne réponse doit être configurée côté données
  return shuffleArray([
    { id: 'regular', text: { fr: regular }, correct: true },  // Placeholder — à ajuster
    { id: 'assimilated', text: { fr: assimilated }, correct: false },
  ]);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

> **Note sur la leçon 2 (solaires/lunaires)** : La fonction `generateArticleOptions` est volontairement simplifiée. L'information solaire/lunaire est déjà dans la table `letters` (colonne `is_sun_letter`). Pour générer la bonne réponse, il faudra croiser le premier caractère du mot avec cette donnée. Implémente la logique complète dans le refactoring de l'écran de leçon (Mission 8).

**Checkpoint :**
- [ ] `word-exercise-generator.ts` compile sans erreur
- [ ] `generateWordExercises(1, simpleWords, allWords, roots)` retourne des MCQ de traduction et de décodage
- [ ] `generateWordExercises(3, ktbWords, allWords, roots)` retourne des MCQ + 1 Match pour la racine k-t-b
- [ ] `generateWordExercises(6, allWords, allWords, roots)` retourne des exercices de révision mixtes
- [ ] Chaque MCQ a 3 options (1 correcte + 2 distracteurs)

---

## MISSION 8 — Refactoring écran de leçon pour Module 3

**Action :**
Modifie `app/lesson/[id].tsx` pour supporter le contenu de type `words`.

### Détection du content type

Étendre `getLessonContentType` :

```typescript
function getLessonContentType(moduleSortOrder: number): LessonContentType {
  if (moduleSortOrder === 1) return 'letters';
  if (moduleSortOrder === 2) return 'diacritics';
  if (moduleSortOrder === 3) return 'words';
  return 'letters'; // fallback
}

type LessonContentType = 'letters' | 'diacritics' | 'words';
```

### Phase présentation pour les mots

Quand `contentType === 'words'` :

**Leçon 1 (mots simples)** :
1. Charger les mots simples via `useSimpleWords()`
2. Afficher chaque mot avec `WordCard` mode `full` (sans section racine)
3. Afficher `pedagogy_notes` en dessous
4. Bouton "Suivant" pour passer au mot suivant

**Leçon 2 (solaires/lunaires)** :
1. Charger les mots simples (شمس et قمر en particulier)
2. Afficher une explication de l'article al- :
   - Lettres lunaires : الْقَمَر → le ل se prononce
   - Lettres solaires : الشَّمْس → le ل s'assimile
3. Utiliser le `sun_letters` / `moon_letters` du seed pour montrer les listes
4. Exercices de prononciation de l'article

**Leçons 3-5 (racines)** :
1. Charger la/les racine(s) via `useRoot()` et les mots associés via `useWordsByRoot()`
2. Afficher `RootFamilyDisplay` pour montrer la famille
3. Afficher chaque mot individuellement avec `WordCard` mode `full`
4. Afficher les `pedagogy_notes` de la racine, puis de chaque mot
5. Insister sur les patterns morphologiques (fāʿil = celui qui fait, mafʿala = le lieu, etc.)

**Leçon 6 (révision)** :
1. Charger tous les mots du Module 3
2. Passer directement à la phase exercices (pas de présentation)

### Phase exercices

```typescript
if (contentType === 'words') {
  const config = LESSON_WORD_CONFIG[lessonSortOrder];
  let lessonWords: Word[];

  if (config.type === 'simple' || config.type === 'solar_lunar') {
    lessonWords = simpleWords;
  } else if (config.type === 'root') {
    lessonWords = words.filter(w => config.rootIds?.includes(w.root_id ?? ''));
  } else {
    lessonWords = allWords;
  }

  const exercises = generateWordExercises(
    lessonSortOrder, lessonWords, allWords, roots,
  );
  // Passer au ExerciseRenderer
}
```

**Checkpoint :**
- [ ] L'écran de leçon détecte `module_sort_order === 3` → `contentType = 'words'`
- [ ] Leçon 1 : affiche les 8 mots simples avec WordCard
- [ ] Leçon 2 : affiche l'explication solaires/lunaires
- [ ] Leçons 3-5 : affichent RootFamilyDisplay + WordCards pour chaque racine
- [ ] Leçon 6 : passe directement aux exercices de révision
- [ ] Les exercices MCQ et Match fonctionnent dans le flow
- [ ] Les Modules 1 et 2 fonctionnent toujours (aucune régression)

---

## MISSION 9 — Déverrouillage du Module 3

**Action :**
Le Module 3 se déverrouille quand TOUTES les leçons du Module 2 sont `completed` (6 leçons).

Modifie la fonction `isModuleUnlocked` dans `learn.tsx` :

```typescript
function isModuleUnlocked(
  moduleSortOrder: number,
  progressByModule: Record<string, LessonProgress[]>,
  modules: Module[],
  lessonCountByModule: Record<string, number>,
): boolean {
  if (moduleSortOrder === 1) return true;

  // Module N est déverrouillé quand Module N-1 est 100% complété
  const previousModule = modules.find(m => m.sort_order === moduleSortOrder - 1);
  if (!previousModule) return false;

  const previousProgress = progressByModule[previousModule.id] || [];
  const previousCompleted = previousProgress.filter(p => p.status === 'completed').length;
  const previousTotal = lessonCountByModule[previousModule.id] || 0;

  return previousTotal > 0 && previousCompleted >= previousTotal;
}
```

> Cette logique est **générique** : elle fonctionne pour Module 2 (quand Module 1 est complet), Module 3 (quand Module 2 est complet), et tout futur module.

**Checkpoint :**
- [ ] Module 3 est locked tant que Module 2 n'est pas 100% terminé
- [ ] Quand les 6 leçons du Module 2 sont `completed`, Module 3 se déverrouille
- [ ] Le feedback de déverrouillage (toast/banner) s'affiche
- [ ] Module 4 reste locked
- [ ] La logique est générique (N dépend de N-1)

---

## MISSION 10 — SRS : cartes mots après chaque leçon

**Action :**
Après la complétion d'une leçon du Module 3, créer des cartes SRS de type `word` pour chaque mot de la leçon.

```typescript
// Dans l'écran de leçon, après la phase exercices (Module 3) :
const createSRSCards = useCreateSRSCardsForLesson();

if (contentType === 'words') {
  createSRSCards.mutate({
    itemIds: lessonWords.map(w => w.id),
    itemType: 'word',
  });
}
```

### Révision des mots dans l'onglet Réviser

Modifie le composant de révision pour gérer le type `word` :

```typescript
if (card.item_type === 'word') {
  // Charger le mot via son item_id depuis SQLite
  // Afficher WordCard mode compact
  // MCQ "Que signifie ce mot ?" avec le même pattern
}
```

**Checkpoint :**
- [ ] Compléter une leçon du Module 3 crée des cartes SRS de type `word` dans SQLite
- [ ] Après sync, les cartes apparaissent dans Supabase Cloud
- [ ] Les cartes `word` apparaissent dans l'onglet Réviser quand elles sont dues
- [ ] La révision d'un mot affiche `WordCard` en mode compact
- [ ] Pas de régression : les cartes `letter` et `diacritic` fonctionnent toujours
- [ ] **Aucun import de `src/db/remote` dans l'écran de leçon**

---

## MISSION 11 — Vérification end-to-end

**Action :**

```bash
npx expo start
```

### Scénario de test :

1. **Prérequis** : Modules 1 et 2 complétés (ou simuler)

2. **Content sync** : Supprimer l'app et relancer pour forcer un re-sync. Vérifier que les 5 racines et 27 mots sont dans SQLite.

3. **Déverrouillage** : Module 3 est déverrouillé, 6 leçons affichées

4. **Leçon 1 — Premiers mots** :
   - 8 WordCards (بَيْت, بَاب, أُمّ, أَب, مَاء, يَوْم, شَمْس, قَمَر)
   - Pas de section racine (mots simples)
   - Exercices MCQ de traduction et décodage

5. **Leçon 2 — Solaires/Lunaires** :
   - Explication de al-
   - الشَّمْس vs الْقَمَر
   - Exercices sur la prononciation de l'article

6. **Leçon 3 — Racine ك-ت-ب** :
   - RootFamilyDisplay avec les 4 mots
   - WordCards individuels avec pedagogy_notes
   - Exercices MCQ + Match "associe les mots de k-t-b"

7. **Leçons 4-5** : Même flow avec les autres racines

8. **Leçon 6 — Révision** : Exercices mixtes sur tous les mots

9. **SRS** : Vérifier les cartes `word` dans l'onglet Réviser

10. **Offline** : Mode avion → contenu accessible, exercices fonctionnels, progression enregistrée localement

11. **Régression** : Module 1 (lettres) et Module 2 (harakats) fonctionnent toujours

### Points de vigilance :

- Les mots arabes vocalisés s'affichent correctement
- RootFamilyDisplay est lisible et les connexions racine → mots sont claires
- Le Match fonctionne avec les mots (colonnes arabe ↔ français)
- Le système de patterns (fāʿil, mafʿala, etc.) est affiché correctement
- Les settings (harakats, translittération, traduction) sont propagés
- **CRITIQUE : `grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/components/` ne retourne AUCUN résultat**

**Checkpoint final :**
- [ ] Le SQL Cloud s'exécute sans erreur (5 racines + 27 mots + 27 variantes + 6 leçons)
- [ ] Le schéma SQLite local inclut roots, words, word_variants
- [ ] Le content-sync synchronise les 7 tables
- [ ] Le Module 3 se déverrouille quand Module 2 est complet
- [ ] Les 6 leçons sont jouables de bout en bout
- [ ] WordCard et RootFamilyDisplay fonctionnent
- [ ] Le générateur d'exercices produit MCQ et Match pertinents
- [ ] Les cartes SRS `word` sont créées et révisables
- [ ] Aucune régression sur Modules 1 et 2
- [ ] **Aucun hook ni store n'importe `src/db/remote`**
- [ ] L'app fonctionne en mode avion
- [ ] Aucun crash, aucun warning critique

---

## RÉSUMÉ DE L'ÉTAPE 6

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Schéma SQLite étendu : tables roots, words, word_variants | ⬜ |
| 2 | SQL Cloud : 5 racines + 27 mots + 27 variantes + 6 leçons Module 3 | ⬜ |
| 3 | content-sync et local-queries étendus pour roots/words/variants | ⬜ |
| 4 | Hooks `useRoots` et `useWords` (SQLite local) | ⬜ |
| 5 | Composant `WordCard` (full + compact) | ⬜ |
| 6 | Composant `RootFamilyDisplay` (racine + famille de mots) | ⬜ |
| 7 | Générateur d'exercices mots et racines (`word-exercise-generator.ts`) | ⬜ |
| 8 | Refactoring écran de leçon (support Module 3 : mots, racines, solaires/lunaires) | ⬜ |
| 9 | Déverrouillage conditionnel Module 3 (générique N → N-1) | ⬜ |
| 10 | SRS : cartes `word` SQLite + sync Cloud + révision | ⬜ |
| 11 | Vérification end-to-end (online + offline + régression) | ⬜ |

> **Prochaine étape après validation :** Étape 7 — Module 4 : Construire du sens (phrases nominales, pronoms, textes à trou, dialogues simples)

---

## GESTION /docs

**Fichiers à conserver dans /docs :**
- `ETAPE-6-module-premiers-mots.md` (ce fichier)
- `lisaan-seed-letters.json` (toujours utile)

**Fichiers à supprimer de /docs :**
- `ETAPE-5-module-harakats.md` (terminée)

**Fichiers qui restent dans le projet Opus (PAS dans /docs) :**
- `lisaan-brief-projet-mvp.docx`
- `lisaan-architecture-data-model.docx` (V2)
