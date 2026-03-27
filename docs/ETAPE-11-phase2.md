# ÉTAPE 11 — Phase 2 amorce : grammaire, conjugaison, dialogue engine

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0 → 10. É10 = Beta fermée (PostHog, Sentry, polish, EAS Build, TestFlight + Play Store internal).
> Cette étape amorce la Phase 2 : deux nouveaux modules (Grammaire essentielle + Premiers verbes), deux nouveaux types d'exercices (reorder, dialogue), et les tables de données associées.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (offline-first — CRITIQUE)** :
> - Tous les hooks lisent depuis **SQLite local**. JAMAIS d'import `src/db/remote` dans hooks/stores/components/engines.
> - `content-sync.ts` et `sync-manager.ts` sont les seuls à parler à Supabase.
> - Après chaque écriture locale, appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : migrations SQL dans le Dashboard Cloud (SQL Editor).

> **Philosophie de cette étape** :
> - La grammaire arabe fait peur. Le Module 5 doit la rendre non-menaçante : 2 concepts fondamentaux, beaucoup d'exemples, zéro métalangage inutile.
> - La conjugaison (Module 6) se limite au passé, forme I, 6 verbes fréquents. L'objectif est de produire des phrases vraies, pas de mémoriser un paradigme.
> - Le dialogue engine est le socle de toute la Phase 2 — il doit être générique dès le départ.
> - Content as data : tout le contenu grammatical et les conjugaisons vivent en base, pas dans le code.

---

## Périmètre de É11

| Module | Contenu | Nouveaux types d'exercices |
|--------|---------|---------------------------|
| Module 5 — Grammaire essentielle | Phrase nominale (mubtada/khabar), genre (m/f), article défini (al-), idāfa (annexion) | `reorder` |
| Module 6 — Mes premiers verbes | Conjugaison passé (ماضي), forme I, 6 verbes fréquents, négation passé (ما + فعل) | `dialogue` |

**Ce qui est OUT de É11 :**
- Conjugaison présent/futur (É12)
- Formes dérivées II → X (Phase 2 avancée)
- Déclinaisons casuelles (iʿrāb) (Phase 3)
- Mini-jeux (É13)
- Dialectes (Phase 3)

---

## MISSION 1 — Schema DB : nouvelles tables

**Contexte :** Deux nouvelles tables de contenu à créer dans Supabase Cloud (PostgreSQL) et à répliquer dans le schéma SQLite local. Ces tables suivent le même pattern offline-first que les tables existantes (lettres, diacritiques, modules, leçons).

### 1a — Table `grammar_rules` (Supabase Cloud — SQL Editor)

```sql
-- Table : grammar_rules
-- Stocke les règles de grammaire avec exemples et notes pédagogiques.

CREATE TABLE IF NOT EXISTS grammar_rules (
  id             TEXT PRIMARY KEY,
  module_id      TEXT NOT NULL REFERENCES modules(id),
  sort_order     INTEGER NOT NULL,
  title_fr       TEXT NOT NULL,                  -- ex: "La phrase nominale"
  title_ar       TEXT,                           -- ex: "الجملة الاسمية"
  concept_fr     TEXT NOT NULL,                  -- Explication courte en français
  formula        TEXT,                           -- ex: "مبتدأ + خبر" (structure)
  example_ar     TEXT NOT NULL,                  -- ex: "هَذَا كِتَابٌ"
  example_ar_vocalized TEXT NOT NULL,            -- avec harakats
  example_transliteration TEXT NOT NULL,         -- "hādhā kitābun"
  example_translation_fr TEXT NOT NULL,          -- "Ceci est un livre"
  example_audio_url TEXT,
  pedagogy_notes TEXT,
  difficulty     INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE grammar_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grammar_rules_public_read" ON grammar_rules
  FOR SELECT USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_grammar_rules_module ON grammar_rules(module_id);
CREATE INDEX IF NOT EXISTS idx_grammar_rules_order ON grammar_rules(sort_order);
```

### 1b — Table `conjugation_entries` (Supabase Cloud — SQL Editor)

```sql
-- Table : conjugation_entries
-- Stocke les formes conjuguées pour chaque verbe enseigné.
-- Un verbe × un temps × un pronom = une ligne.

CREATE TABLE IF NOT EXISTS conjugation_entries (
  id               TEXT PRIMARY KEY,
  word_id          TEXT NOT NULL REFERENCES words(id),  -- Le verbe à l'infinitif (masdar)
  tense            TEXT NOT NULL,                        -- 'past' | 'present' | 'imperative'
  form             INTEGER NOT NULL DEFAULT 1,           -- Forme dérivée (I = 1, II = 2...)
  pronoun_code     TEXT NOT NULL,                        -- 'ana' | 'anta' | 'anti' | 'huwa' | 'hiya' | 'nahnu' | 'antum' | 'hum'
  pronoun_ar       TEXT NOT NULL,                        -- "أَنَا"
  pronoun_fr       TEXT NOT NULL,                        -- "je"
  conjugated_ar    TEXT NOT NULL,                        -- forme conjuguée sans harakats
  conjugated_ar_vocalized TEXT NOT NULL,                 -- avec harakats
  conjugated_transliteration TEXT NOT NULL,
  audio_url        TEXT,
  example_sentence_ar        TEXT,                       -- phrase d'exemple
  example_sentence_ar_vocalized TEXT,
  example_sentence_translation_fr TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE conjugation_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conjugation_entries_public_read" ON conjugation_entries
  FOR SELECT USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_conj_word ON conjugation_entries(word_id);
CREATE INDEX IF NOT EXISTS idx_conj_tense ON conjugation_entries(tense, form);
CREATE INDEX IF NOT EXISTS idx_conj_pronoun ON conjugation_entries(pronoun_code);
```

### 1c — Mise à jour `schema-local.ts` (SQLite local)

Dans `src/db/schema-local.ts`, ajouter les deux nouvelles tables après les tables existantes :

```typescript
// Ajouter dans initLocalSchema(), après CREATE TABLE lessons :

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS grammar_rules (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    title_fr TEXT NOT NULL,
    title_ar TEXT,
    concept_fr TEXT NOT NULL,
    formula TEXT,
    example_ar TEXT NOT NULL,
    example_ar_vocalized TEXT NOT NULL,
    example_transliteration TEXT NOT NULL,
    example_translation_fr TEXT NOT NULL,
    example_audio_url TEXT,
    pedagogy_notes TEXT,
    difficulty INTEGER NOT NULL DEFAULT 1,
    synced_at TEXT
  );
`);

await db.execAsync(`
  CREATE TABLE IF NOT EXISTS conjugation_entries (
    id TEXT PRIMARY KEY,
    word_id TEXT NOT NULL,
    tense TEXT NOT NULL,
    form INTEGER NOT NULL DEFAULT 1,
    pronoun_code TEXT NOT NULL,
    pronoun_ar TEXT NOT NULL,
    pronoun_fr TEXT NOT NULL,
    conjugated_ar TEXT NOT NULL,
    conjugated_ar_vocalized TEXT NOT NULL,
    conjugated_transliteration TEXT NOT NULL,
    audio_url TEXT,
    example_sentence_ar TEXT,
    example_sentence_ar_vocalized TEXT,
    example_sentence_translation_fr TEXT,
    synced_at TEXT
  );
`);

await db.execAsync(`
  CREATE INDEX IF NOT EXISTS idx_grammar_rules_module ON grammar_rules(module_id);
  CREATE INDEX IF NOT EXISTS idx_conj_word ON conjugation_entries(word_id);
  CREATE INDEX IF NOT EXISTS idx_conj_tense ON conjugation_entries(tense, form);
`);
```

**Checkpoint Mission 1 :**
- [ ] Tables `grammar_rules` et `conjugation_entries` créées dans Supabase Cloud (SQL Editor → vérifier dans Table Editor)
- [ ] RLS activé sur les deux tables avec policy `public_read`
- [ ] `schema-local.ts` mis à jour avec les deux CREATE TABLE
- [ ] `npx expo start` → SQLite s'initialise sans erreur (logs au démarrage)
- [ ] Aucune régression sur les tables existantes (letters, diacritics, modules, lessons)

---

## MISSION 2 — Seed data : Module 5 (Grammaire essentielle)

**Contexte :** Insérer en base le contenu du Module 5. Ce seed couvre les 4 concepts fondamentaux de la grammaire arabe accessible à un débutant.

### 2a — Module 5 dans la table `modules` (Supabase Cloud — SQL Editor)

```sql
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon)
VALUES (
  'module-005-grammar',
  'Grammaire essentielle',
  'القواعد الأساسية',
  'La phrase arabe démystifiée : construis tes premières phrases correctes.',
  5,
  '📐'
);
```

### 2b — Leçons du Module 5 (table `lessons`)

```sql
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES
  ('lesson-501', 'module-005-grammar', 'La phrase nominale', 'الجملة الاسمية', 'Sujet + attribut : la structure de base de l'arabe', 1, 30, 8),
  ('lesson-502', 'module-005-grammar', 'Le genre en arabe', 'المذكر والمؤنث', 'Masculin, féminin, et la tā marbūṭa', 2, 30, 8),
  ('lesson-503', 'module-005-grammar', 'L'article défini', 'أل التعريف', 'Al- solaire et lunaire en contexte de phrases', 3, 25, 7),
  ('lesson-504', 'module-005-grammar', 'L'annexion (idāfa)', 'الإضافة', 'Relier deux noms : livre de l'étudiant', 4, 35, 10),
  ('lesson-505', 'module-005-grammar', 'Révision grammaire', 'مراجعة', 'Consolide les 4 concepts avec des phrases variées', 5, 40, 12);
```

### 2c — Règles de grammaire dans `grammar_rules`

```sql
INSERT INTO grammar_rules
  (id, module_id, sort_order, title_fr, title_ar, concept_fr, formula, example_ar, example_ar_vocalized, example_transliteration, example_translation_fr, pedagogy_notes, difficulty)
VALUES
(
  'gr-001-nominal-sentence',
  'module-005-grammar', 1,
  'La phrase nominale',
  'الجملة الاسمية',
  'En arabe, une phrase peut ne pas avoir de verbe "être". Sujet (مبتدأ) + Prédicat (خبر) forment une phrase complète.',
  'مُبْتَدَأ + خَبَر',
  'هذا كتاب',
  'هَذَا كِتَابٌ',
  'hādhā kitābun',
  'Ceci est un livre',
  'Insister sur l'absence du verbe "être" au présent. Le contexte donne le sens. Exercice de choc culturel positif.',
  1
),
(
  'gr-002-gender',
  'module-005-grammar', 2,
  'Le genre grammatical',
  'المذكر والمؤنث',
  'Chaque nom arabe est masculin ou féminin. Le féminin est souvent marqué par la tā marbūṭa (ة) à la fin du mot.',
  'مُذَكَّر / مُؤَنَّث + ة',
  'مدرس / مدرسة',
  'مُدَرِّسٌ / مُدَرِّسَةٌ',
  'mudarrisun / mudarrisatun',
  'professeur (m) / professeure (f)',
  'Lister les exceptions notables : أُمّ (mère) est féminin sans tā marbūṭa. Exercice d'association m/f visuel.',
  1
),
(
  'gr-003-definite-article',
  'module-005-grammar', 3,
  'L'article défini al-',
  'أل التعريف',
  'L'article défini "al-" (ال) est identique pour tous les noms. Avec les lettres solaires, le "l" s'assimile au son suivant.',
  'ال + nom',
  'الكتاب / الشمس',
  'الْكِتَابُ / الشَّمْسُ',
  'al-kitābu / ash-shamsu',
  'le livre / le soleil',
  'Rappel du concept solaire/lunaire déjà vu au Module 3. Ici on l'ancre dans des phrases complètes. Ne pas entrer dans les détails de l'iʿrāb (cas).',
  2
),
(
  'gr-004-idafa',
  'module-005-grammar', 4,
  'L'annexion (idāfa)',
  'الإضافة',
  'Pour exprimer "de" ou une relation de possession, l'arabe juxtapose deux noms sans préposition. Le premier perd son article, le second prend le kasra ou tanwin.',
  'اسم + اسم (بدون أل على الأول)',
  'كتاب الطالب',
  'كِتَابُ الطَّالِبِ',
  'kitābu ṭ-ṭālibi',
  'le livre de l'étudiant',
  'Insister sur la règle clé : le premier terme de l'idāfa ne prend JAMAIS al-. Exercice de construction par glisser-déposer.',
  2
);
```

**Checkpoint Mission 2 :**
- [ ] Module `module-005-grammar` visible dans Table Editor Supabase
- [ ] 5 leçons insérées dans `lessons` avec `module_id = 'module-005-grammar'`
- [ ] 4 règles insérées dans `grammar_rules`
- [ ] Vérifier avec `SELECT * FROM grammar_rules;` dans SQL Editor → 4 lignes

---

## MISSION 3 — Seed data : Module 6 (Premiers verbes)

**Contexte :** Le Module 6 introduit 6 verbes fréquents conjugués au passé uniquement (ماضي), forme I. Chaque verbe est d'abord ajouté dans la table `words`, puis ses conjugaisons dans `conjugation_entries`.

### 3a — Module 6 dans `modules`

```sql
INSERT INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon)
VALUES (
  'module-006-verbs',
  'Mes premiers verbes',
  'أفعالي الأولى',
  'Conjugue 6 verbes essentiels au passé et construis tes premières phrases verbales.',
  6,
  '🔤'
);
```

### 3b — Leçons du Module 6

```sql
INSERT INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes)
VALUES
  ('lesson-601', 'module-006-verbs', 'Écrire et lire', 'كتب وقرأ', 'Les verbes كَتَبَ (écrire) et قَرَأَ (lire) au passé', 1, 35, 10),
  ('lesson-602', 'module-006-verbs', 'Aller et venir', 'ذهب وجاء', 'Les verbes ذَهَبَ (aller) et جَاءَ (venir) au passé', 2, 35, 10),
  ('lesson-603', 'module-006-verbs', 'Manger et boire', 'أكل وشرب', 'Les verbes أَكَلَ (manger) et شَرِبَ (boire) au passé', 3, 35, 10),
  ('lesson-604', 'module-006-verbs', 'Négatif et questions', 'النفي والاستفهام', 'Nier au passé avec مَا + فعل. Questionner avec هَلْ', 4, 40, 12);
```

### 3c — Les 6 verbes dans `words`

> Ces verbes sont insérés en tant que masdar de référence. La racine doit exister dans `roots` (ou l'insérer si absente).

```sql
-- Insérer les racines manquantes si besoin
INSERT INTO roots (id, consonants, transliteration, core_meaning_fr, core_meaning_ar, frequency_rank)
VALUES
  ('root-ktb', ARRAY['ك','ت','ب'], 'k-t-b', 'écrire, trace écrite', 'الكتابة', 1),
  ('root-qra', ARRAY['ق','ر','أ'], 'q-r-ʾ', 'lire, réciter', 'القراءة', 2),
  ('root-dhb', ARRAY['ذ','ه','ب'], 'dh-h-b', 'aller, partir', 'الذهاب', 3),
  ('root-jaa', ARRAY['ج','ي','ء'], 'j-ʾ', 'venir', 'المجيء', 4),
  ('root-akl', ARRAY['أ','ك','ل'], 'ʾ-k-l', 'manger', 'الأكل', 5),
  ('root-shb', ARRAY['ش','ر','ب'], 'sh-r-b', 'boire', 'الشرب', 6)
ON CONFLICT (id) DO NOTHING;

-- Les 6 verbes (forme passé 3ème pers. masc. sing. = forme de dictionnaire)
INSERT INTO words (id, root_id, arabic, arabic_vocalized, transliteration, ipa, pattern, pos, frequency_rank, gender)
VALUES
  ('word-kataba',  'root-ktb', 'كتب',  'كَتَبَ',  'kataba',  '/kataba/',  'faʿala', 'verb', 10, 'n/a'),
  ('word-qaraa',   'root-qra', 'قرأ',  'قَرَأَ',  'qaraʾa',  '/qaraʔa/', 'faʿala', 'verb', 12, 'n/a'),
  ('word-dhahaba', 'root-dhb', 'ذهب',  'ذَهَبَ',  'dhahaba', '/ðahaba/', 'faʿala', 'verb', 8,  'n/a'),
  ('word-jaaa',    'root-jaa', 'جاء',  'جَاءَ',   'jāʾa',    '/dʒaːʔa/','faʿala', 'verb', 9,  'n/a'),
  ('word-akala',   'root-akl', 'أكل',  'أَكَلَ',  'ʾakala',  '/ʔakala/', 'faʿala', 'verb', 7,  'n/a'),
  ('word-shariba', 'root-shb', 'شرب',  'شَرِبَ',  'shariba', '/ʃariba/', 'faʿila', 'verb', 11, 'n/a');
```

### 3d — Conjugaisons passé dans `conjugation_entries`

> Insérer les conjugaisons pour les 8 pronoms de base × 6 verbes = 48 lignes.
> Ci-dessous le template complet pour **كَتَبَ** (écrire). Répéter le même pattern pour les 5 autres verbes.

```sql
-- Conjugaisons passé de كَتَبَ (kataba — écrire)
INSERT INTO conjugation_entries
  (id, word_id, tense, form, pronoun_code, pronoun_ar, pronoun_fr, conjugated_ar, conjugated_ar_vocalized, conjugated_transliteration, example_sentence_ar, example_sentence_ar_vocalized, example_sentence_translation_fr)
VALUES
  ('conj-kataba-past-ana',   'word-kataba', 'past', 1, 'ana',   'أَنَا', 'je',        'كتبت',   'كَتَبْتُ',    'katabtu',    'أَنَا كَتَبْتُ رِسَالَةً',   'أَنَا كَتَبْتُ رِسَالَةً',   'J'ai écrit une lettre'),
  ('conj-kataba-past-anta',  'word-kataba', 'past', 1, 'anta',  'أَنْتَ','tu (m)',    'كتبت',   'كَتَبْتَ',    'katabta',    'أَنْتَ كَتَبْتَ كَثِيرًا',   'أَنْتَ كَتَبْتَ كَثِيرًا',   'Tu as beaucoup écrit'),
  ('conj-kataba-past-anti',  'word-kataba', 'past', 1, 'anti',  'أَنْتِ','tu (f)',    'كتبت',   'كَتَبْتِ',    'katabti',    'أَنْتِ كَتَبْتِ جَيِّدًا',    'أَنْتِ كَتَبْتِ جَيِّدًا',    'Tu as bien écrit'),
  ('conj-kataba-past-huwa',  'word-kataba', 'past', 1, 'huwa',  'هُوَ', 'il',        'كتب',    'كَتَبَ',      'kataba',     'هُوَ كَتَبَ الدَّرْسَ',      'هُوَ كَتَبَ الدَّرْسَ',      'Il a écrit la leçon'),
  ('conj-kataba-past-hiya',  'word-kataba', 'past', 1, 'hiya',  'هِيَ', 'elle',      'كتبت',   'كَتَبَتْ',    'katabat',    'هِيَ كَتَبَتِ الْكَلِمَةَ', 'هِيَ كَتَبَتِ الْكَلِمَةَ', 'Elle a écrit le mot'),
  ('conj-kataba-past-nahnu', 'word-kataba', 'past', 1, 'nahnu', 'نَحْنُ','nous',     'كتبنا',  'كَتَبْنَا',   'katabnā',    'نَحْنُ كَتَبْنَا الدَّرْسَ', 'نَحْنُ كَتَبْنَا الدَّرْسَ', 'Nous avons écrit la leçon'),
  ('conj-kataba-past-antum', 'word-kataba', 'past', 1, 'antum', 'أَنْتُمْ','vous',   'كتبتم',  'كَتَبْتُمْ',  'katabtum',   NULL, NULL, NULL),
  ('conj-kataba-past-hum',   'word-kataba', 'past', 1, 'hum',   'هُمْ', 'ils/elles', 'كتبوا',  'كَتَبُوا',    'katabū',     'هُمْ كَتَبُوا كَثِيرًا',     'هُمْ كَتَبُوا كَثِيرًا',     'Ils ont beaucoup écrit');

-- Répéter le même bloc pour word-qaraa, word-dhahaba, word-jaaa, word-akala, word-shariba
-- en adaptant les formes conjuguées selon les règles morphologiques de chaque verbe.
-- Les formes pour les 5 autres verbes sont données ci-dessous :

-- قَرَأَ (lire) : qараʾtu, qaraʾta, qaraʾti, qaraʾa, qaraʾat, qaraʾnā, qaraʾtum, qaraʾū
-- ذَهَبَ (aller) : dhahabtu, dhahabta, dhahabti, dhahaba, dhahabat, dhahabnā, dhahabtum, dhahabū
-- جَاءَ (venir) : jiʾtu, jiʾta, jiʾti, jāʾa, jāʾat, jiʾnā, jiʾtum, jāʾū
-- أَكَلَ (manger) : ʾakaltu, ʾakalta, ʾakalti, ʾakala, ʾakalat, ʾakalnā, ʾakaltum, ʾakalū
-- شَرِبَ (boire) : shаribtu, sharibta, sharibti, shariba, sharibat, sharibnā, sharibtum, sharibū
```

> **Note pour Claude Code :** Écrire les 5 blocs INSERT restants en suivant exactement le même pattern que كَتَبَ. Les formes conjuguées sont données en translittération ci-dessus — les convertir en arabe avec harakats.

**Checkpoint Mission 3 :**
- [ ] Module `module-006-verbs` visible dans Supabase Table Editor
- [ ] 4 leçons insérées pour Module 6
- [ ] 6 verbes insérés dans `words`
- [ ] 48 lignes dans `conjugation_entries` (6 verbes × 8 pronoms) — vérifier avec `SELECT COUNT(*) FROM conjugation_entries;`
- [ ] Racines insérées dans `roots` sans erreur de contrainte

---

## MISSION 4 — content-sync.ts : nouvelles tables

**Contexte :** Le fichier `content-sync.ts` télécharge le contenu depuis Supabase Cloud vers SQLite local. Il faut l'étendre pour inclure les deux nouvelles tables.

Dans `src/engines/content-sync.ts`, ajouter les deux nouvelles tables dans le tableau des tables à synchroniser :

```typescript
// Tableau existant (à compléter) :
const CONTENT_TABLES = [
  { name: 'letters',             primaryKey: 'id' },
  { name: 'diacritics',          primaryKey: 'id' },
  { name: 'modules',             primaryKey: 'id' },
  { name: 'lessons',             primaryKey: 'id' },
  // NOUVEAU É11 :
  { name: 'grammar_rules',       primaryKey: 'id' },
  { name: 'conjugation_entries', primaryKey: 'id' },
];
```

> Si `content-sync.ts` utilise un pattern différent (fonctions nommées par table plutôt qu'un tableau), ajouter deux fonctions `syncGrammarRules()` et `syncConjugationEntries()` en calquant le pattern de `syncLessons()`.

Ajouter les fonctions CRUD correspondantes dans `src/db/local-queries.ts` :

```typescript
// --- grammar_rules ---

export async function getGrammarRulesByModule(moduleId: string): Promise<GrammarRule[]> {
  const db = getLocalDB();
  return db.getAllAsync<GrammarRule>(
    'SELECT * FROM grammar_rules WHERE module_id = ? ORDER BY sort_order ASC',
    [moduleId]
  );
}

export async function upsertGrammarRule(rule: GrammarRule): Promise<void> {
  const db = getLocalDB();
  await db.runAsync(
    `INSERT INTO grammar_rules (id, module_id, sort_order, title_fr, title_ar, concept_fr, formula,
      example_ar, example_ar_vocalized, example_transliteration, example_translation_fr,
      example_audio_url, pedagogy_notes, difficulty, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title_fr = excluded.title_fr,
       concept_fr = excluded.concept_fr,
       example_ar_vocalized = excluded.example_ar_vocalized,
       synced_at = excluded.synced_at`,
    [rule.id, rule.module_id, rule.sort_order, rule.title_fr, rule.title_ar,
     rule.concept_fr, rule.formula ?? null, rule.example_ar, rule.example_ar_vocalized,
     rule.example_transliteration, rule.example_translation_fr, rule.example_audio_url ?? null,
     rule.pedagogy_notes ?? null, rule.difficulty, new Date().toISOString()]
  );
}

// --- conjugation_entries ---

export async function getConjugationsByWord(wordId: string, tense: string): Promise<ConjugationEntry[]> {
  const db = getLocalDB();
  return db.getAllAsync<ConjugationEntry>(
    'SELECT * FROM conjugation_entries WHERE word_id = ? AND tense = ? ORDER BY pronoun_code ASC',
    [wordId, tense]
  );
}

export async function upsertConjugationEntry(entry: ConjugationEntry): Promise<void> {
  const db = getLocalDB();
  await db.runAsync(
    `INSERT INTO conjugation_entries (id, word_id, tense, form, pronoun_code, pronoun_ar, pronoun_fr,
      conjugated_ar, conjugated_ar_vocalized, conjugated_transliteration, audio_url,
      example_sentence_ar, example_sentence_ar_vocalized, example_sentence_translation_fr, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       conjugated_ar_vocalized = excluded.conjugated_ar_vocalized,
       conjugated_transliteration = excluded.conjugated_transliteration,
       synced_at = excluded.synced_at`,
    [entry.id, entry.word_id, entry.tense, entry.form, entry.pronoun_code, entry.pronoun_ar,
     entry.pronoun_fr, entry.conjugated_ar, entry.conjugated_ar_vocalized,
     entry.conjugated_transliteration, entry.audio_url ?? null,
     entry.example_sentence_ar ?? null, entry.example_sentence_ar_vocalized ?? null,
     entry.example_sentence_translation_fr ?? null, new Date().toISOString()]
  );
}
```

Ajouter les types TypeScript correspondants dans `src/types/` :

```typescript
// src/types/grammar.ts

export interface GrammarRule {
  id: string;
  module_id: string;
  sort_order: number;
  title_fr: string;
  title_ar?: string;
  concept_fr: string;
  formula?: string;
  example_ar: string;
  example_ar_vocalized: string;
  example_transliteration: string;
  example_translation_fr: string;
  example_audio_url?: string;
  pedagogy_notes?: string;
  difficulty: number;
  synced_at?: string;
}

export interface ConjugationEntry {
  id: string;
  word_id: string;
  tense: 'past' | 'present' | 'imperative';
  form: number;
  pronoun_code: 'ana' | 'anta' | 'anti' | 'huwa' | 'hiya' | 'nahnu' | 'antum' | 'hum';
  pronoun_ar: string;
  pronoun_fr: string;
  conjugated_ar: string;
  conjugated_ar_vocalized: string;
  conjugated_transliteration: string;
  audio_url?: string;
  example_sentence_ar?: string;
  example_sentence_ar_vocalized?: string;
  example_sentence_translation_fr?: string;
  synced_at?: string;
}
```

Ajouter les deux hooks de lecture dans `src/hooks/` :

```typescript
// src/hooks/useGrammarRules.ts
import { useEffect, useState } from 'react';
import { getGrammarRulesByModule } from '../db/local-queries';
import { GrammarRule } from '../types/grammar';

export function useGrammarRules(moduleId: string) {
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGrammarRulesByModule(moduleId)
      .then(setRules)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [moduleId]);

  return { rules, loading };
}

// src/hooks/useConjugations.ts
import { useEffect, useState } from 'react';
import { getConjugationsByWord } from '../db/local-queries';
import { ConjugationEntry } from '../types/grammar';

export function useConjugations(wordId: string, tense: 'past' | 'present' | 'imperative') {
  const [conjugations, setConjugations] = useState<ConjugationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConjugationsByWord(wordId, tense)
      .then(setConjugations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wordId, tense]);

  return { conjugations, loading };
}
```

**Checkpoint Mission 4 :**
- [ ] `content-sync.ts` inclut `grammar_rules` et `conjugation_entries`
- [ ] `local-queries.ts` a `getGrammarRulesByModule`, `upsertGrammarRule`, `getConjugationsByWord`, `upsertConjugationEntry`
- [ ] `src/types/grammar.ts` créé avec `GrammarRule` et `ConjugationEntry`
- [ ] `useGrammarRules.ts` et `useConjugations.ts` créés dans `src/hooks/`
- [ ] **Aucun de ces fichiers n'importe `src/db/remote`**
- [ ] Test : relancer l'app, forcer un re-sync (vider `sync_metadata`) → les nouvelles tables se peuplent dans SQLite

---

## MISSION 5 — Nouveau type d'exercice : `reorder`

**Contexte :** L'exercice `reorder` présente des mots arabes mélangés que l'utilisateur doit remettre dans l'ordre pour former une phrase correcte. Utilisé intensivement dans le Module 5 (grammaire) pour ancrer les structures de phrases.

### 5a — Type et interface

Dans `src/types/exercise.ts` (ou équivalent), ajouter :

```typescript
export interface ReorderExerciseConfig {
  type: 'reorder';
  sentence_id: string;          // référence vers la table sentences
  words_shuffled: ReorderWord[]; // mots mélangés
  correct_order: string[];       // tableau d'IDs dans le bon ordre
  show_transliteration: boolean;
  show_translation: boolean;
  hint_fr?: string;              // indice grammatical optionnel
}

export interface ReorderWord {
  id: string;            // identifiant unique pour le drag & drop
  arabic: string;        // texte arabe
  arabic_vocalized: string;
  transliteration?: string;
}
```

### 5b — Composant `ReorderExercise.tsx`

Créer `src/components/exercises/ReorderExercise.tsx` :

```typescript
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ArabicText } from '../arabic/ArabicText';
import { ReorderExerciseConfig, ExerciseResult } from '../../types/exercise';

interface Props {
  config: ReorderExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
}

export function ReorderExercise({ config, onComplete }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState(config.words_shuffled);
  const [isValidated, setIsValidated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleWordTap = useCallback((wordId: string, fromSlot: 'available' | 'selected') => {
    if (isValidated) return;

    if (fromSlot === 'available') {
      // Déplacer vers la zone de réponse
      setSelectedOrder(prev => [...prev, wordId]);
      setAvailableWords(prev => prev.filter(w => w.id !== wordId));
    } else {
      // Retirer de la zone de réponse
      setSelectedOrder(prev => prev.filter(id => id !== wordId));
      const word = config.words_shuffled.find(w => w.id === wordId)!;
      setAvailableWords(prev => [...prev, word]);
    }
  }, [isValidated, config.words_shuffled]);

  const handleValidate = useCallback(() => {
    const correct = JSON.stringify(selectedOrder) === JSON.stringify(config.correct_order);
    setIsCorrect(correct);
    setIsValidated(true);

    setTimeout(() => {
      onComplete({
        correct,
        score: correct ? 100 : 0,
        timeSeconds: 0, // calculé par le parent
        attempts: 1,
      });
    }, 1200);
  }, [selectedOrder, config.correct_order, onComplete]);

  const selectedWords = selectedOrder.map(id => config.words_shuffled.find(w => w.id === id)!);

  return (
    <View style={styles.container}>
      {config.hint_fr && (
        <Text style={styles.hint}>{config.hint_fr}</Text>
      )}

      {/* Zone de réponse */}
      <View style={styles.answerZone}>
        <Text style={styles.zoneLabel}>Ta réponse</Text>
        <View style={styles.wordRow}>
          {selectedWords.map(word => (
            <TouchableOpacity
              key={word.id}
              style={[styles.wordChip, styles.wordChipSelected]}
              onPress={() => handleWordTap(word.id, 'selected')}
              accessibilityRole="button"
              accessibilityLabel={word.transliteration ?? word.arabic_vocalized}
              accessibilityHint="Appuyer pour retirer ce mot"
            >
              <ArabicText
                text={word.arabic_vocalized}
                transliteration={config.show_transliteration ? word.transliteration : undefined}
                style={styles.wordText}
              />
            </TouchableOpacity>
          ))}
          {selectedWords.length === 0 && (
            <Text style={styles.placeholder}>Appuie sur les mots ci-dessous</Text>
          )}
        </View>
      </View>

      {/* Mots disponibles */}
      <View style={styles.availableZone}>
        <View style={styles.wordRow}>
          {availableWords.map(word => (
            <TouchableOpacity
              key={word.id}
              style={styles.wordChip}
              onPress={() => handleWordTap(word.id, 'available')}
              accessibilityRole="button"
              accessibilityLabel={word.transliteration ?? word.arabic_vocalized}
            >
              <ArabicText
                text={word.arabic_vocalized}
                transliteration={config.show_transliteration ? word.transliteration : undefined}
                style={styles.wordText}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bouton Valider */}
      {selectedOrder.length === config.correct_order.length && !isValidated && (
        <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
          <Text style={styles.validateText}>Valider →</Text>
        </TouchableOpacity>
      )}

      {/* Feedback */}
      {isValidated && (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>
            {isCorrect ? '✓ Excellent !' : '✗ Pas tout à fait…'}
          </Text>
          {!isCorrect && config.show_translation && (
            <Text style={styles.feedbackHint}>
              La bonne réponse sera affichée à la prochaine révision.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  hint: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  answerZone: {
    minHeight: 80, borderRadius: 16, borderWidth: 1.5, borderColor: '#D0C4A8',
    borderStyle: 'dashed', padding: 12, marginBottom: 24,
    backgroundColor: '#FDFAF4',
  },
  zoneLabel: { fontSize: 11, color: '#AAA', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  availableZone: { marginBottom: 32 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wordChip: {
    backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#D0C4A8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
    elevation: 1,
  },
  wordChipSelected: { backgroundColor: '#EEF6F1', borderColor: '#2D6A4F' },
  wordText: { fontSize: 22, color: '#1A1A1A' },
  placeholder: { color: '#CCC', fontSize: 14, alignSelf: 'center', paddingVertical: 12 },
  validateButton: {
    backgroundColor: '#2D6A4F', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  validateText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  feedback: { borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center' },
  feedbackCorrect: { backgroundColor: '#EEF6F1' },
  feedbackWrong: { backgroundColor: '#FFF4F4' },
  feedbackText: { fontSize: 16, fontWeight: '700' },
  feedbackHint: { fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center' },
});
```

### 5c — Enregistrer dans le registry

Dans `src/components/exercises/index.ts` :

```typescript
import { ReorderExercise } from './ReorderExercise';
// ... imports existants ...

exerciseRegistry.set('reorder', ReorderExercise);
```

**Checkpoint Mission 5 :**
- [ ] `ReorderExercise.tsx` créé
- [ ] `ReorderExerciseConfig` et `ReorderWord` dans les types
- [ ] `exerciseRegistry.set('reorder', ReorderExercise)` dans le registry
- [ ] Test manuel : créer un config de test dans un écran temporaire, valider que le glissement de mots fonctionne
- [ ] Accessibilité : `accessibilityRole`, `accessibilityLabel` présents sur les word chips
- [ ] **Aucun import de `src/db/remote`**

---

## MISSION 6 — Nouveau type d'exercice : `dialogue`

**Contexte :** L'exercice `dialogue` présente un échange conversationnel avec un ou plusieurs tours de parole. L'utilisateur choisit la bonne réplique parmi 3 options. C'est le socle de tous les exercices conversationnels de la Phase 2.

### 6a — Types

```typescript
// Ajouter dans src/types/exercise.ts

export interface DialogueTurn {
  id: string;
  speaker: 'a' | 'b';                // A = interlocuteur, B = utilisateur
  speaker_name?: string;              // ex: "Ahmed", "Fatima"
  arabic: string;
  arabic_vocalized: string;
  transliteration?: string;
  translation_fr?: string;
  audio_url?: string;
}

export interface DialogueChoice {
  id: string;
  arabic: string;
  arabic_vocalized: string;
  transliteration?: string;
  is_correct: boolean;
  feedback_fr?: string;               // Pourquoi cette réponse est correcte/incorrecte
}

export interface DialogueExerciseConfig {
  type: 'dialogue';
  context_fr?: string;                // Contexte de la situation
  turns: DialogueTurn[];              // Les tours de parole avant la question
  choices: DialogueChoice[];          // Options pour l'utilisateur
  show_transliteration: boolean;
  show_translation: boolean;
}
```

### 6b — Composant `DialogueExercise.tsx`

Créer `src/components/exercises/DialogueExercise.tsx` :

```typescript
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ArabicText } from '../arabic/ArabicText';
import { DialogueExerciseConfig, ExerciseResult } from '../../types/exercise';

interface Props {
  config: DialogueExerciseConfig;
  onComplete: (result: ExerciseResult) => void;
}

export function DialogueExercise({ config, onComplete }: Props) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  const handleSelect = useCallback((choiceId: string) => {
    if (isValidated) return;
    setSelectedChoice(choiceId);
  }, [isValidated]);

  const handleValidate = useCallback(() => {
    if (!selectedChoice) return;
    const choice = config.choices.find(c => c.id === selectedChoice)!;
    setIsValidated(true);

    setTimeout(() => {
      onComplete({
        correct: choice.is_correct,
        score: choice.is_correct ? 100 : 0,
        timeSeconds: 0,
        attempts: 1,
      });
    }, 1500);
  }, [selectedChoice, config.choices, onComplete]);

  const selectedIsCorrect = selectedChoice
    ? config.choices.find(c => c.id === selectedChoice)?.is_correct
    : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Contexte */}
      {config.context_fr && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextText}>📍 {config.context_fr}</Text>
        </View>
      )}

      {/* Bulles de dialogue */}
      <View style={styles.dialogueContainer}>
        {config.turns.map(turn => (
          <View
            key={turn.id}
            style={[
              styles.bubble,
              turn.speaker === 'a' ? styles.bubbleA : styles.bubbleB,
            ]}
          >
            {turn.speaker_name && (
              <Text style={styles.speakerName}>{turn.speaker_name}</Text>
            )}
            <ArabicText
              text={turn.arabic_vocalized}
              transliteration={config.show_transliteration ? turn.transliteration : undefined}
              style={styles.bubbleArabic}
            />
            {config.show_translation && turn.translation_fr && (
              <Text style={styles.bubbleTranslation}>{turn.translation_fr}</Text>
            )}
          </View>
        ))}

        {/* Bulle de réponse de l'utilisateur (placeholder) */}
        <View style={[styles.bubble, styles.bubbleB, styles.bubblePlaceholder]}>
          {selectedChoice ? (
            <ArabicText
              text={config.choices.find(c => c.id === selectedChoice)!.arabic_vocalized}
              style={styles.bubbleArabic}
            />
          ) : (
            <Text style={styles.placeholderText}>Choisis ta réponse ↓</Text>
          )}
        </View>
      </View>

      {/* Choix */}
      <View style={styles.choicesContainer}>
        {config.choices.map(choice => {
          const isSelected = selectedChoice === choice.id;
          const showResult = isValidated && isSelected;

          return (
            <TouchableOpacity
              key={choice.id}
              style={[
                styles.choiceChip,
                isSelected && styles.choiceChipSelected,
                showResult && choice.is_correct && styles.choiceChipCorrect,
                showResult && !choice.is_correct && styles.choiceChipWrong,
              ]}
              onPress={() => handleSelect(choice.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={choice.transliteration ?? choice.arabic_vocalized}
            >
              <ArabicText
                text={choice.arabic_vocalized}
                transliteration={config.show_transliteration ? choice.transliteration : undefined}
                style={styles.choiceText}
              />
              {showResult && choice.feedback_fr && (
                <Text style={styles.feedbackInline}>{choice.feedback_fr}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bouton Valider */}
      {selectedChoice && !isValidated && (
        <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
          <Text style={styles.validateText}>Répondre →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  contextBanner: {
    backgroundColor: '#F5F0E8', borderRadius: 10, padding: 10, marginBottom: 20,
  },
  contextText: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  dialogueContainer: { marginBottom: 28, gap: 12 },
  bubble: {
    maxWidth: '78%', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    elevation: 1,
  },
  bubbleA: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  bubbleB: { alignSelf: 'flex-end', backgroundColor: '#EEF6F1', borderBottomRightRadius: 4 },
  bubblePlaceholder: { borderWidth: 1.5, borderColor: '#D0C4A8', borderStyle: 'dashed', backgroundColor: '#FDFAF4' },
  speakerName: { fontSize: 11, color: '#AAA', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleArabic: { fontSize: 22 },
  bubbleTranslation: { fontSize: 12, color: '#888', marginTop: 4 },
  placeholderText: { color: '#BBB', fontSize: 14, textAlign: 'center' },
  choicesContainer: { gap: 10, marginBottom: 24 },
  choiceChip: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#D0C4A8',
  },
  choiceChipSelected: { borderColor: '#2D6A4F', backgroundColor: '#EEF6F1' },
  choiceChipCorrect: { borderColor: '#27AE60', backgroundColor: '#F0FBF4' },
  choiceChipWrong: { borderColor: '#E74C3C', backgroundColor: '#FFF5F5' },
  choiceText: { fontSize: 20, textAlign: 'right' },
  feedbackInline: { fontSize: 13, color: '#666', marginTop: 6, fontStyle: 'italic' },
  validateButton: {
    backgroundColor: '#2D6A4F', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  validateText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
```

### 6c — Enregistrer dans le registry

```typescript
import { DialogueExercise } from './DialogueExercise';

exerciseRegistry.set('dialogue', DialogueExercise);
```

**Checkpoint Mission 6 :**
- [ ] `DialogueExercise.tsx` créé
- [ ] Types `DialogueTurn`, `DialogueChoice`, `DialogueExerciseConfig` dans les types
- [ ] `exerciseRegistry.set('dialogue', DialogueExercise)` actif
- [ ] Test manuel avec un config de dialogue fictif → les bulles s'affichent, la sélection fonctionne
- [ ] RTL correct sur les bulles arabes (alignement à droite)
- [ ] Accessibilité : `accessibilityRole="radio"` sur les choix

---

## MISSION 7 — Générateurs d'exercices : Module 5 et Module 6

**Contexte :** Au MVP, les exercices sont générés dynamiquement côté client. Deux nouveaux générateurs sont nécessaires pour les modules 5 et 6. Ils suivent le pattern de `exercise-generator.ts` existant.

### 7a — `grammar-exercise-generator.ts`

Créer `src/engines/grammar-exercise-generator.ts` :

```typescript
import { GrammarRule } from '../types/grammar';
import { ExerciseConfig, ReorderExerciseConfig, MCQExerciseConfig } from '../types/exercise';

/**
 * Génère un tableau d'exercices pour une leçon de grammaire.
 * Chaque règle produit 2-3 exercices : explication (MCQ) + construction (reorder).
 */
export function generateGrammarExercises(
  rules: GrammarRule[],
  allSentences: { id: string; arabic_vocalized: string; translation_fr: string; word_ids: string[] }[],
  showTransliteration: boolean = true,
  showTranslation: boolean = true
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  for (const rule of rules) {
    // 1. MCQ de compréhension : quelle est la traduction de l'exemple ?
    exercises.push(generateGrammarMCQ(rule, rules, showTranslation));

    // 2. Reorder : reconstituer la phrase d'exemple
    exercises.push(generateGrammarReorder(rule, showTransliteration, showTranslation));
  }

  return exercises;
}

function generateGrammarMCQ(
  rule: GrammarRule,
  allRules: GrammarRule[],
  showTranslation: boolean
): MCQExerciseConfig {
  // Distracteurs : traductions d'autres règles
  const distractors = allRules
    .filter(r => r.id !== rule.id)
    .slice(0, 2)
    .map(r => ({ id: r.id, label: r.example_translation_fr, is_correct: false }));

  return {
    type: 'mcq',
    question_ar: rule.example_ar_vocalized,
    question_transliteration: rule.example_transliteration,
    prompt_fr: 'Que signifie cette phrase ?',
    options: [
      { id: rule.id, label: rule.example_translation_fr, is_correct: true },
      ...distractors,
    ].sort(() => Math.random() - 0.5),
    show_transliteration: true,
    show_translation: showTranslation,
  };
}

function generateGrammarReorder(
  rule: GrammarRule,
  showTransliteration: boolean,
  showTranslation: boolean
): ReorderExerciseConfig {
  // Découper la phrase en mots
  const words = rule.example_ar_vocalized.trim().split(/\s+/);
  const wordObjects = words.map((w, i) => ({
    id: `${rule.id}-word-${i}`,
    arabic: w.replace(/[\u064B-\u065F]/g, ''), // sans harakats pour la forme de base
    arabic_vocalized: w,
    transliteration: undefined, // simplifié au MVP
  }));

  // Mélanger
  const shuffled = [...wordObjects].sort(() => Math.random() - 0.5);

  return {
    type: 'reorder',
    sentence_id: rule.id,
    words_shuffled: shuffled,
    correct_order: wordObjects.map(w => w.id),
    show_transliteration: showTransliteration,
    show_translation: showTranslation,
    hint_fr: rule.concept_fr,
  };
}
```

### 7b — `conjugation-exercise-generator.ts`

Créer `src/engines/conjugation-exercise-generator.ts` :

```typescript
import { ConjugationEntry } from '../types/grammar';
import { ExerciseConfig, MCQExerciseConfig, DialogueExerciseConfig } from '../types/exercise';

/**
 * Génère des exercices de conjugaison pour un verbe et un temps donnés.
 * Mélange MCQ (identifier la forme) + dialogue (utiliser dans contexte).
 */
export function generateConjugationExercises(
  verb_id: string,
  entries: ConjugationEntry[],
  allVerbEntries: ConjugationEntry[], // pour les distracteurs cross-verbes
  showTransliteration: boolean = true
): ExerciseConfig[] {
  const exercises: ExerciseConfig[] = [];

  // Pour chaque pronom prioritaire (ana, anta, huwa, hiya, nahnu)
  const priorityPronouns = ['ana', 'anta', 'huwa', 'hiya', 'nahnu'];
  const targetEntries = entries.filter(e => priorityPronouns.includes(e.pronoun_code));

  for (const entry of targetEntries) {
    // MCQ : quel est le pronom de cette forme ?
    exercises.push(generatePronounMCQ(entry, entries, showTransliteration));

    // MCQ : quelle est la forme pour ce pronom ?
    exercises.push(generateFormMCQ(entry, allVerbEntries, showTransliteration));
  }

  // Dialogue final si des phrases d'exemple existent
  const withExamples = entries.filter(e => e.example_sentence_ar_vocalized);
  if (withExamples.length >= 2) {
    exercises.push(generateConjugationDialogue(withExamples, showTransliteration));
  }

  return exercises;
}

function generatePronounMCQ(
  target: ConjugationEntry,
  allEntries: ConjugationEntry[],
  showTransliteration: boolean
): MCQExerciseConfig {
  const distractors = allEntries
    .filter(e => e.id !== target.id && e.pronoun_fr !== target.pronoun_fr)
    .slice(0, 2)
    .map(e => ({ id: e.id, label: `${e.pronoun_fr} (${e.pronoun_ar})`, is_correct: false }));

  return {
    type: 'mcq',
    question_ar: target.conjugated_ar_vocalized,
    question_transliteration: target.conjugated_transliteration,
    prompt_fr: 'Quel est le sujet de cette forme ?',
    options: [
      { id: target.id, label: `${target.pronoun_fr} (${target.pronoun_ar})`, is_correct: true },
      ...distractors,
    ].sort(() => Math.random() - 0.5),
    show_transliteration: showTransliteration,
    show_translation: true,
  };
}

function generateFormMCQ(
  target: ConjugationEntry,
  allEntries: ConjugationEntry[],
  showTransliteration: boolean
): MCQExerciseConfig {
  const distractors = allEntries
    .filter(e => e.id !== target.id && e.conjugated_ar !== target.conjugated_ar)
    .slice(0, 2)
    .map(e => ({
      id: e.id,
      label: e.conjugated_ar_vocalized,
      sublabel: showTransliteration ? e.conjugated_transliteration : undefined,
      is_correct: false,
    }));

  return {
    type: 'mcq',
    question_fr: `Comment dit-on "${target.pronoun_fr}" + verbe au passé ?`,
    prompt_fr: `${target.pronoun_fr} (${target.pronoun_ar})`,
    options: [
      {
        id: target.id,
        label: target.conjugated_ar_vocalized,
        sublabel: showTransliteration ? target.conjugated_transliteration : undefined,
        is_correct: true,
      },
      ...distractors,
    ].sort(() => Math.random() - 0.5),
    show_transliteration: showTransliteration,
    show_translation: true,
  };
}

function generateConjugationDialogue(
  entries: ConjugationEntry[],
  showTransliteration: boolean
): DialogueExerciseConfig {
  // Sélectionner 2 entrées avec exemples
  const [turnA, questionTurn, ...rest] = entries;

  const correctEntry = rest[0] ?? entries[1];
  const wrongEntries = entries.filter(e => e.id !== correctEntry.id).slice(0, 2);

  return {
    type: 'dialogue',
    context_fr: 'Complète le dialogue',
    turns: [
      {
        id: 'turn-a',
        speaker: 'a',
        arabic: turnA.example_sentence_ar ?? turnA.conjugated_ar,
        arabic_vocalized: turnA.example_sentence_ar_vocalized ?? turnA.conjugated_ar_vocalized,
        translation_fr: turnA.example_sentence_translation_fr,
      },
    ],
    choices: [
      {
        id: correctEntry.id,
        arabic: correctEntry.example_sentence_ar ?? correctEntry.conjugated_ar,
        arabic_vocalized: correctEntry.example_sentence_ar_vocalized ?? correctEntry.conjugated_ar_vocalized,
        transliteration: showTransliteration ? correctEntry.conjugated_transliteration : undefined,
        is_correct: true,
        feedback_fr: 'Bonne forme verbale !',
      },
      ...wrongEntries.map(e => ({
        id: e.id,
        arabic: e.conjugated_ar,
        arabic_vocalized: e.conjugated_ar_vocalized,
        transliteration: showTransliteration ? e.conjugated_transliteration : undefined,
        is_correct: false,
        feedback_fr: `Ici le sujet est différent (${e.pronoun_fr})`,
      })),
    ].sort(() => Math.random() - 0.5),
    show_transliteration: showTransliteration,
    show_translation: true,
  };
}
```

**Checkpoint Mission 7 :**
- [ ] `grammar-exercise-generator.ts` créé dans `src/engines/`
- [ ] `conjugation-exercise-generator.ts` créé dans `src/engines/`
- [ ] Les deux générateurs exportent des fonctions pures (pas d'import `src/db/remote`)
- [ ] Test unitaire rapide : appeler les générateurs avec des données mockées → pas d'erreur TypeScript

---

## MISSION 8 — Intégration dans le lesson engine

**Contexte :** Le fichier `app/lesson/[id].tsx` doit reconnaître les leçons des Modules 5 et 6 et appeler les bons générateurs.

Dans `app/lesson/[id].tsx` (ou dans le composant qui orchestre les exercices), étendre la logique de génération :

```typescript
import { generateGrammarExercises } from '../../src/engines/grammar-exercise-generator';
import { generateConjugationExercises } from '../../src/engines/conjugation-exercise-generator';
import { useGrammarRules } from '../../src/hooks/useGrammarRules';
import { useConjugations } from '../../src/hooks/useConjugations';

// Dans le composant de leçon, identifier le type de contenu selon le module :
function useExercisesForLesson(lesson: Lesson, settings: UserSettings) {
  const isGrammarLesson = lesson.module_id === 'module-005-grammar';
  const isConjugationLesson = lesson.module_id === 'module-006-verbs';

  const { rules } = useGrammarRules(lesson.module_id);
  // Pour les leçons de conjugaison, extraire le word_id du titre de leçon
  // ou ajouter un champ `content_ref` dans la table lessons (migration légère)

  if (isGrammarLesson && rules.length > 0) {
    return generateGrammarExercises(
      rules.filter(r => /* filtrer par leçon si nécessaire */),
      [],
      settings.transliteration_mode !== 'never',
      settings.translation_mode !== 'never'
    );
  }

  // Fallback : utiliser le générateur existant (lettres/harakats)
  return generateExistingExercises(lesson, settings);
}
```

> **Note :** Si la table `lessons` ne contient pas encore de champ `content_ref` pour lier une leçon à ses règles ou verbes spécifiques, ajouter la migration suivante dans Supabase Cloud :

```sql
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_refs TEXT[] DEFAULT '{}';
COMMENT ON COLUMN lessons.content_refs IS 'IDs des règles de grammaire, verbes ou autres contenus associés à cette leçon';

-- Mettre à jour les leçons existantes :
UPDATE lessons SET content_refs = ARRAY['gr-001-nominal-sentence'] WHERE id = 'lesson-501';
UPDATE lessons SET content_refs = ARRAY['gr-002-gender']            WHERE id = 'lesson-502';
UPDATE lessons SET content_refs = ARRAY['gr-003-definite-article']  WHERE id = 'lesson-503';
UPDATE lessons SET content_refs = ARRAY['gr-004-idafa']             WHERE id = 'lesson-504';
-- lesson-505 (révision) : toutes les règles
UPDATE lessons SET content_refs = ARRAY['gr-001-nominal-sentence','gr-002-gender','gr-003-definite-article','gr-004-idafa'] WHERE id = 'lesson-505';

UPDATE lessons SET content_refs = ARRAY['word-kataba','word-qaraa']   WHERE id = 'lesson-601';
UPDATE lessons SET content_refs = ARRAY['word-dhahaba','word-jaaa']   WHERE id = 'lesson-602';
UPDATE lessons SET content_refs = ARRAY['word-akala','word-shariba']  WHERE id = 'lesson-603';
-- lesson-604 : tous les verbes (révision négation)
UPDATE lessons SET content_refs = ARRAY['word-kataba','word-qaraa','word-dhahaba','word-jaaa','word-akala','word-shariba'] WHERE id = 'lesson-604';
```

Ajouter `content_refs TEXT` dans le schéma SQLite local (migration locale) :

```typescript
// Dans schema-local.ts, à la fin de initLocalSchema() :
await db.execAsync(`
  ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_refs TEXT DEFAULT '[]';
`);
```

**Checkpoint Mission 8 :**
- [ ] Champ `content_refs` ajouté dans Supabase + SQLite local
- [ ] `content_refs` peuplés pour toutes les leçons M5 et M6
- [ ] Le lesson engine appelle `generateGrammarExercises` pour les leçons du Module 5
- [ ] Le lesson engine appelle `generateConjugationExercises` pour les leçons du Module 6
- [ ] Flux complet : ouvrir Leçon 501 → des exercices MCQ + Reorder s'affichent (même avec données mockées)
- [ ] Flux complet : ouvrir Leçon 601 → des exercices MCQ conjugaison + Dialogue s'affichent

---

## MISSION 9 — Déverrouillage progressif M5 et M6

**Contexte :** Les Modules 5 et 6 doivent être verrouillés jusqu'à la complétion du Module 4 (Module 5) et du Module 5 (Module 6). La logique de déverrouillage est déjà en place dans le système de progression — il suffit de la configurer correctement.

Vérifier dans `src/engines/` (ou dans le hook `useProgress`) que la logique de déverrouillage de module suit bien la règle :

> Un module est `available` quand toutes les leçons du module précédent sont `completed`.

Si cette logique est basée sur `sort_order`, les modules 5 et 6 se déverrouilleront automatiquement.

Si la logique est basée sur des `prerequisites` explicites, ajouter dans Supabase Cloud :

```sql
-- Si la table modules a un champ prerequisite_module_id :
ALTER TABLE modules ADD COLUMN IF NOT EXISTS prerequisite_module_id TEXT REFERENCES modules(id);
UPDATE modules SET prerequisite_module_id = 'module-004-sentences' WHERE id = 'module-005-grammar';
UPDATE modules SET prerequisite_module_id = 'module-005-grammar'   WHERE id = 'module-006-verbs';
```

Ajouter `prerequisite_module_id TEXT` dans le schéma SQLite si le champ est ajouté en Cloud.

**Analytics — ajouter dans les générateurs :**

```typescript
import { track } from '../analytics/posthog';

// Dans generateGrammarExercises(), après la génération :
track('grammar_exercises_generated', {
  module_id: rules[0]?.module_id,
  rules_count: rules.length,
  exercises_count: exercises.length,
});
```

**Checkpoint Mission 9 :**
- [ ] Module 5 verrouillé sur l'onglet Learn jusqu'à complétion du Module 4
- [ ] Module 6 verrouillé jusqu'à complétion du Module 5
- [ ] Le déverrouillage fonctionne (compléter M4 → M5 passe à `available`)
- [ ] `track('grammar_exercises_generated', ...)` visible dans PostHog Live Events

---

## MISSION 10 — Tests et régression

### Scénarios de test É11

**1. Sync des nouvelles tables :**
- Vider `sync_metadata` dans SQLite → relancer l'app
- → `grammar_rules` (4 lignes) et `conjugation_entries` (48 lignes) se peuplent
- → Modules 5 et 6 visibles dans l'onglet Learn (verrouillés)

**2. Module 5 — Leçon 501 :**
- Débloquer artificiellement (en base) → ouvrir Leçon 501
- → Exercices MCQ de compréhension + Reorder s'affichent
- → Les mots arabes s'affichent correctement en RTL dans le Reorder
- → La validation fonctionne (correct / incorrect)

**3. Module 6 — Leçon 601 :**
- Débloquer artificiellement → ouvrir Leçon 601
- → Exercices MCQ pronoms + MCQ formes s'affichent
- → Exercice Dialogue final fonctionne (bulles, choix, validation)

**4. Accessibilité :**
- VoiceOver (iOS) / TalkBack (Android) : les word chips du Reorder et les choix du Dialogue ont des labels lisibles

**5. Offline :**
- Mode avion → les Modules 5 et 6 fonctionnent (contenu dans SQLite)
- → La progression est sauvegardée localement et poussée au retour réseau

**6. Régression Modules 1–4 + Audio + Gamification :**
- Compléter une leçon des Modules 1, 2, 3, 4 → aucune régression
- Vérifier XP flottant, badges, streak

**7. Architecture :**
```bash
grep -rn "from.*db/remote\|from.*supabase" \
  src/hooks/ src/stores/ src/components/ src/engines/grammar-exercise-generator.ts src/engines/conjugation-exercise-generator.ts
# → AUCUN résultat attendu
```

**Checkpoint final É11 :**
- [ ] Sync : `grammar_rules` et `conjugation_entries` dans SQLite après premier sync
- [ ] Module 5 : exercices MCQ + Reorder fonctionnels dans au moins 1 leçon
- [ ] Module 6 : exercices MCQ conjugaison + Dialogue fonctionnels dans au moins 1 leçon
- [ ] Déverrouillage progressif M5 → M6 fonctionnel
- [ ] `reorder` et `dialogue` dans le registry, aucun crash
- [ ] Types TypeScript stricts : `npx tsc --noEmit` sans erreur
- [ ] Architecture : aucun hook/engine n'importe `src/db/remote`
- [ ] Aucune régression Modules 1–4 + Gamification + Audio
- [ ] Analytics : events grammar visibles dans PostHog

---

## RÉSUMÉ DE L'ÉTAPE 11

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Schema DB : `grammar_rules` + `conjugation_entries` (Supabase + SQLite) | ⬜ |
| 2 | Seed Module 5 : module, 5 leçons, 4 règles de grammaire | ⬜ |
| 3 | Seed Module 6 : module, 4 leçons, 6 verbes, 48 conjugaisons passé | ⬜ |
| 4 | content-sync + local-queries + types + hooks pour les nouvelles tables | ⬜ |
| 5 | Exercice `reorder` : composant + types + registry | ⬜ |
| 6 | Exercice `dialogue` : composant + types + registry | ⬜ |
| 7 | Générateurs : `grammar-exercise-generator` + `conjugation-exercise-generator` | ⬜ |
| 8 | Intégration lesson engine + champ `content_refs` | ⬜ |
| 9 | Déverrouillage M5/M6 + analytics | ⬜ |
| 10 | Tests end-to-end + régression complète | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs :**
- `ETAPE-11-phase2.md` (ce fichier)
- `lisaan-seed-letters.json`

**Fichiers à supprimer de /docs :**
- `ETAPE-10-beta.md` (terminée)

---

> **Prochaine étape après validation :** Étape 12 — Conjugaison présent/inaccompli (مضارع), formes II-III, et enrichissement du dialogue engine avec des situations contextualisées (marché, famille, voyage).
