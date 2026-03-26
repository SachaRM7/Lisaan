# ÉTAPE 10.5 — Pivot vocabulaire : fréquence d'abord, racines en lumière

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe pour francophones.
> Étapes terminées : 0 → 10. É10 = Beta fermée (PostHog, Sentry, polish, EAS Build, TestFlight + Play Store internal).
> Cette étape pivote la stratégie vocabulaire du Module 3 : au lieu d'organiser les leçons par racines trilittères, on organise par **fréquence d'usage** et **thèmes du quotidien**. Les racines restent visibles comme bonus pédagogique ("racines en lumière"), mais ne dictent plus le séquençage.

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

> **Rappel architecture (offline-first — CRITIQUE)** :
> - Tous les hooks lisent depuis **SQLite local**. JAMAIS d'import `src/db/remote` dans hooks/stores/components/engines.
> - `content-sync.ts` et `sync-manager.ts` sont les seuls à parler à Supabase.
> - Après chaque écriture locale, appeler `runSync()` en fire-and-forget.
> - **Pas de CLI Supabase** : migrations SQL dans le Dashboard Cloud (SQL Editor).

> **Pourquoi ce pivot** :
> Un natif arabophone a pointé un défaut fondamental : Lisaan enseigne des mots rares (مكتوب, قارئ) simplement parce qu'ils partagent une racine avec un mot courant, avant d'enseigner des mots essentiels comme طعام (nourriture), رجل (homme), عمل (travail), وقت (temps). L'apprenant comprend le *système* de la langue mais ne comprend pas une seule phrase réelle. Le pivot corrige ça : on sélectionne les mots par fréquence d'usage, et on regroupe les leçons par thèmes du quotidien. Quand plusieurs mots fréquents partagent la même racine (كتاب + مدرسة = racine visible), on le montre en bonus — mais on ne force jamais l'apprentissage de dérivés rares pour compléter une famille.

> **Impact sur le code existant** :
> - **Zéro** sur les composants UI (WordCard, RootFamilyDisplay, SentenceCard, etc.)
> - **Zéro** sur le SRS, la progression, le sync, les badges, l'audio, le profil
> - **Zéro** sur les Modules 1, 2 et 4
> - **Un seul fichier TS modifié** : `src/engines/word-exercise-generator.ts` (le LESSON_WORD_CONFIG)
> - **Seed SQL** : ajout de ~29 mots + réorganisation des leçons Module 3
> - **Schéma** : ajout d'une colonne `theme` à la table `words`

> **Impact sur É11–É16** : Aucun. Ces étapes ajoutent leurs propres modules (grammaire, verbes, conjugaisons, dialectes, coran, badges) et ne touchent ni au contenu du Module 3 ni au word-exercise-generator.

---

## Périmètre de É10.5

| Action | Détail |
|--------|--------|
| Ajout colonne | `theme TEXT` dans `words` (Cloud + SQLite) |
| Nouveaux mots | 29 mots haute fréquence (noms, adjectifs) |
| Thèmes existants | Mise à jour des 44 mots existants avec leur thème |
| Réorganisation | Leçons 3.3 → 3.6 du Module 3 renommées et rethématisées |
| Générateur | `LESSON_WORD_CONFIG` passe de `root`-based à `theme`-based |
| Variantes | MSA word_variants pour les 29 nouveaux mots |

**Ce qui est OUT de É10.5 :**
- Ajout de verbes (É11 s'en charge)
- Ajout de phrases/dialogues (É7 déjà fait, É11+ continue)
- Modification de WordCard ou RootFamilyDisplay (intacts)
- Modification du SRS ou de la progression (intacts)

---

## MISSION 1 — Ajouter la colonne `theme` au schéma

### 1a — Supabase Cloud (SQL Editor)

```sql
-- Ajout de la colonne theme à la table words
ALTER TABLE words ADD COLUMN IF NOT EXISTS theme TEXT;

-- Index pour les requêtes par thème
CREATE INDEX IF NOT EXISTS idx_words_theme ON words(theme);
```

### 1b — SQLite local (`src/db/schema-local.ts`)

Dans `initLocalSchema()`, localiser le `CREATE TABLE IF NOT EXISTS words` et ajouter la colonne `theme` :

```sql
-- Ajouter APRÈS la colonne pedagogy_notes, AVANT sort_order :
theme TEXT,
```

Le `CREATE TABLE` complet doit maintenant contenir :

```sql
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  root_id TEXT,
  arabic TEXT NOT NULL,
  arabic_vocalized TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  ipa TEXT,
  translation_fr TEXT NOT NULL,
  pattern TEXT,
  pos TEXT,
  frequency_rank INTEGER NOT NULL DEFAULT 100,
  audio_url TEXT,
  gender TEXT,
  is_simple_word INTEGER NOT NULL DEFAULT 0,
  pedagogy_notes TEXT,
  theme TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT,
  FOREIGN KEY (root_id) REFERENCES roots(id)
);
```

Ajouter aussi l'index :

```sql
CREATE INDEX IF NOT EXISTS idx_words_theme ON words(theme);
```

### 1c — Mettre à jour `upsertWords` dans `local-queries.ts`

Ajouter `theme` dans le `INSERT OR REPLACE` :

```typescript
export async function upsertWords(words: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const w of words) {
    await db.runAsync(
      `INSERT OR REPLACE INTO words (
        id, root_id, arabic, arabic_vocalized, transliteration, ipa,
        translation_fr, pattern, pos, frequency_rank, audio_url,
        gender, is_simple_word, pedagogy_notes, theme, sort_order, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.id, w.root_id, w.arabic, w.arabic_vocalized, w.transliteration, w.ipa,
       w.translation_fr, w.pattern, w.pos, w.frequency_rank, w.audio_url,
       w.gender, w.is_simple_word ? 1 : 0, w.pedagogy_notes, w.theme, w.sort_order ?? 0, now]
    );
  }
}
```

### 1d — Ajouter `getWordsByTheme` dans `local-queries.ts`

```typescript
export async function getWordsByTheme(theme: string) {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM words WHERE theme = ? ORDER BY sort_order ASC',
    [theme]
  );
}
```

### 1e — Mettre à jour `content-sync.ts`

Vérifier que le `SELECT *` de la table `words` récupère bien la colonne `theme`. C'est normalement le cas (SELECT *), mais vérifier que `upsertWords` est bien appelé avec le nouvel objet.

**Checkpoint M1 :**
- [ ] La colonne `theme` existe dans Supabase Cloud (`SELECT column_name FROM information_schema.columns WHERE table_name = 'words' AND column_name = 'theme';`)
- [ ] `schema-local.ts` compile avec la colonne `theme`
- [ ] `upsertWords` inclut `theme` dans l'INSERT
- [ ] `getWordsByTheme('family')` est disponible dans `local-queries.ts`
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 2 — Attribuer un thème aux 44 mots existants

### 2a — Thèmes des mots simples (Supabase Cloud — SQL Editor)

```sql
-- Mots de la leçon 3.1 : "Tes premiers mots"
UPDATE words SET theme = 'first_words' WHERE arabic IN ('بيت', 'باب', 'أم', 'أب', 'ماء', 'يوم', 'شمس', 'قمر');
```

### 2b — Thèmes des mots du Module 4 (restent NULL — pas concernés)

```sql
-- Démonstratifs, pronoms personnels, particules interrogatives :
-- PAS de thème M3 — ils appartiennent au Module 4 (sentences)
-- هذا, هذه, ذلك, تلك, أنا, أنت, هو, هي, ما, من, كيف, شكرا, نعم, لا
-- → theme reste NULL (pas affichés dans les leçons thématiques du Module 3)
```

### 2c — Thèmes des mots de racines et adjectifs existants

```sql
-- Mots fréquents réaffectés aux thèmes du quotidien
UPDATE words SET theme = 'places' WHERE arabic IN ('كتاب', 'مدرسة', 'درس', 'قلم');
UPDATE words SET theme = 'describe' WHERE arabic IN ('كبير', 'صغير', 'جميل', 'مفيد');

-- Mots de racines NON fréquents → theme = 'root_bonus' (accessibles en bonus, pas dans les leçons principales)
UPDATE words SET theme = 'root_bonus' WHERE arabic IN ('كاتب', 'مكتبة', 'مكتوب', 'عالم', 'معلم', 'مدرس', 'قارئ', 'قراءة', 'فتح', 'مفتاح', 'فاتحة');

-- تعلم est un verbe → sera couvert par É11 (conjugaison)
UPDATE words SET theme = 'root_bonus' WHERE arabic = 'تعلم';

-- علم est fréquent → thème quotidien
UPDATE words SET theme = 'daily' WHERE arabic = 'علم';

-- قرآن est spécifique au module coranique → pas de thème M3
UPDATE words SET theme = NULL WHERE arabic = 'قرآن';
```

**Checkpoint M2 :**
- [ ] `SELECT theme, COUNT(*) FROM words GROUP BY theme;` retourne :
  - `first_words` : 8
  - `places` : 4
  - `describe` : 4
  - `daily` : 1 (علم)
  - `root_bonus` : 12
  - `NULL` : 15 (M4 words + قرآن)
- [ ] Aucun mot n'est orphelin (chaque mot a un thème ou est explicitement NULL)

---

## MISSION 3 — Insérer 29 nouveaux mots haute fréquence

> **Source de fréquence** : les rangs sont basés sur les listes de fréquence de l'arabe moderne (Buckwalter & Parkinson, "A Frequency Dictionary of Arabic"). Les valeurs sont approximatives et relatives aux mots déjà dans la base.

### 3a — Thème `family` : La famille (8 mots)

```sql
INSERT INTO words (arabic, arabic_vocalized, transliteration, translation_fr, pos, frequency_rank, gender, is_simple_word, theme, sort_order, pedagogy_notes)
VALUES
  ('أخ', 'أَخ', 'akh', 'frère', 'noun', 15, 'masculine', true, 'family', 200,
   'Mot court (2 lettres). Le pluriel إخوة (ikhwa) est irrégulier — ne pas l''introduire maintenant.'),
  ('أخت', 'أُخْت', 'ukht', 'sœur', 'noun', 16, 'feminine', true, 'family', 201,
   'Le ta marbūṭa (ت) final est ici un ta normal — exception. Le soukoun sur le kha rend la prononciation nette.'),
  ('ابن', 'اِبْن', 'ibn', 'fils', 'noun', 10, 'masculine', true, 'family', 202,
   'Très fréquent dans les noms propres : ابن خلدون (Ibn Khaldoun). Le hamza waṣla disparaît en liaison.'),
  ('بنت', 'بِنْت', 'bint', 'fille', 'noun', 12, 'feminine', true, 'family', 203,
   'Mot courant au quotidien. Le pluriel بنات (banāt) est régulier — bon exemple pour plus tard.'),
  ('ولد', 'وَلَد', 'walad', 'garçon / enfant', 'noun', 14, 'masculine', true, 'family', 204,
   'Peut signifier "garçon" ou "enfant" selon le contexte. أولاد (awlād) = enfants.'),
  ('رجل', 'رَجُل', 'rajul', 'homme', 'noun', 8, 'masculine', true, 'family', 205,
   'Un des mots les plus fréquents. La damma sur le jim est caractéristique.'),
  ('امرأة', 'اِمْرَأَة', 'imraʾa', 'femme', 'noun', 11, 'feminine', true, 'family', 206,
   'Mot important mais phonétiquement complexe (hamza + ta marbūṭa). Le montrer, pas le forcer en exercice de décodage.'),
  ('طفل', 'طِفْل', 'ṭifl', 'enfant (petit)', 'noun', 20, 'masculine', true, 'family', 207,
   'Le ṭa emphatique (ط) rappelle le Module 1. Le pluriel أطفال (aṭfāl) suit le pattern afʿāl.')
ON CONFLICT (arabic) DO NOTHING;
```

### 3b — Thème `daily` : Le quotidien (8 mots)

```sql
INSERT INTO words (arabic, arabic_vocalized, transliteration, translation_fr, pos, frequency_rank, gender, is_simple_word, theme, sort_order, pedagogy_notes)
VALUES
  ('طعام', 'طَعَام', 'ṭaʿām', 'nourriture', 'noun', 18, 'masculine', true, 'daily', 210,
   'Le ṭa emphatique + le ع (ayn) : deux sons difficiles dans le même mot. Bon exercice de prononciation.'),
  ('خبز', 'خُبْز', 'khubz', 'pain', 'noun', 25, 'masculine', true, 'daily', 211,
   'Le خ (kha) est gutural. Le pain est central dans la culture arabe — mot très concret et utile.'),
  ('عمل', 'عَمَل', 'ʿamal', 'travail', 'noun', 6, 'masculine', true, 'daily', 212,
   'Extrêmement fréquent. La racine ع-م-ل donne aussi عامل (travailleur) et معمل (usine/laboratoire) — le mentionner en bonus racine.'),
  ('وقت', 'وَقْت', 'waqt', 'temps', 'noun', 8, 'masculine', true, 'daily', 213,
   'Le soukoun sur le qaf crée le cluster qt. Mot du quotidien par excellence : ما عندي وقت (je n''ai pas le temps).'),
  ('مال', 'مَال', 'māl', 'argent / richesse', 'noun', 13, 'masculine', true, 'daily', 214,
   'Mot court, voyelle longue ā. Très fréquent dans les expressions du quotidien et dans le Coran.'),
  ('شيء', 'شَيْء', 'shayʾ', 'chose', 'noun', 3, 'masculine', true, 'daily', 215,
   'Un des mots les plus fréquents de l''arabe. Se termine par une hamza — rappel du Module 2.'),
  ('كثير', 'كَثِير', 'kathīr', 'beaucoup / nombreux', 'adjective', 4, 'masculine', true, 'daily', 216,
   'Adjectif ultra-fréquent. Contraire de قليل. Pattern faʿīl.'),
  ('قليل', 'قَلِيل', 'qalīl', 'peu / rare', 'adjective', 12, 'masculine', true, 'daily', 217,
   'Contraire de كثير. Même pattern faʿīl. Les deux forment une paire naturelle.')
ON CONFLICT (arabic) DO NOTHING;
```

### 3c — Thème `places` : Les lieux (7 mots)

```sql
INSERT INTO words (arabic, arabic_vocalized, transliteration, translation_fr, pos, frequency_rank, gender, is_simple_word, theme, sort_order, pedagogy_notes)
VALUES
  ('سوق', 'سُوق', 'sūq', 'marché', 'noun', 20, 'masculine', true, 'places', 220,
   'Le waw est une voyelle longue ū. Le mot est universel dans le monde arabe — chaque ville a son سوق.'),
  ('شارع', 'شَارِع', 'shāriʿ', 'rue', 'noun', 22, 'masculine', true, 'places', 221,
   'Le ع (ayn) final est un défi de prononciation. Pattern fāʿil — techniquement "celui qui légifère" (la loi de la route).'),
  ('مدينة', 'مَدِينَة', 'madīna', 'ville', 'noun', 15, 'feminine', true, 'places', 222,
   'Le nom de la ville sainte المدينة المنورة (Médine). Ta marbūṭa finale = féminin.'),
  ('مسجد', 'مَسْجِد', 'masjid', 'mosquée', 'noun', 18, 'masculine', true, 'places', 223,
   'De la racine س-ج-د (se prosterner). Pattern mafʿil = lieu de l''action. Bonus racine naturel !'),
  ('طريق', 'طَرِيق', 'ṭarīq', 'chemin / route', 'noun', 12, 'masculine', true, 'places', 224,
   'Le ṭa emphatique + voyelle longue ī. Très fréquent : الطريق إلى... (le chemin vers...).'),
  ('سيارة', 'سَيَّارَة', 'sayyāra', 'voiture', 'noun', 16, 'feminine', true, 'places', 225,
   'Mot moderne mais la racine est ancienne : س-ي-ر (marcher/voyager). La chadda sur le ya est essentielle.'),
  ('غرفة', 'غُرْفَة', 'ghurfa', 'chambre / pièce', 'noun', 22, 'feminine', true, 'places', 226,
   'Le غ (ghayn) est un son nouveau pour les francophones. Ta marbūṭa = féminin.')
ON CONFLICT (arabic) DO NOTHING;
```

### 3d — Thème `describe` : Décrire le monde (6 mots)

```sql
INSERT INTO words (arabic, arabic_vocalized, transliteration, translation_fr, pos, frequency_rank, gender, is_simple_word, theme, sort_order, pedagogy_notes)
VALUES
  ('جديد', 'جَدِيد', 'jadīd', 'nouveau', 'adjective', 8, 'masculine', true, 'describe', 230,
   'Pattern faʿīl. Contraire de قديم. Très courant.'),
  ('قديم', 'قَدِيم', 'qadīm', 'ancien / vieux', 'adjective', 15, 'masculine', true, 'describe', 231,
   'Pattern faʿīl. S''utilise pour les choses (pas les personnes — on dit كبير pour "âgé").'),
  ('قريب', 'قَرِيب', 'qarīb', 'proche', 'adjective', 14, 'masculine', true, 'describe', 232,
   'Pattern faʿīl. Contraire de بعيد. Très utile en situation : هل هو قريب؟ (c''est proche ?).'),
  ('بعيد', 'بَعِيد', 'baʿīd', 'loin / éloigné', 'adjective', 16, 'masculine', true, 'describe', 233,
   'Pattern faʿīl. Le ع (ayn) au milieu. Contraire de قريب.'),
  ('سهل', 'سَهْل', 'sahl', 'facile', 'adjective', 22, 'masculine', true, 'describe', 234,
   'Mot court, facile à retenir — méta ! Le soukoun sur le ha rend la prononciation rapide.'),
  ('صعب', 'صَعْب', 'ṣaʿb', 'difficile', 'adjective', 20, 'masculine', true, 'describe', 235,
   'Le ṣad emphatique + le ع (ayn) : un concentré de sons arabes. Contraire de سهل.')
ON CONFLICT (arabic) DO NOTHING;
```

### 3e — Variantes MSA pour tous les nouveaux mots

```sql
-- Générer automatiquement les variantes MSA pour tous les mots qui n'en ont pas encore
INSERT INTO word_variants (word_id, variant, arabic, arabic_vocalized, transliteration)
SELECT
  w.id,
  'msa',
  w.arabic,
  w.arabic_vocalized,
  w.transliteration
FROM words w
WHERE w.theme IN ('family', 'daily', 'places', 'describe')
  AND NOT EXISTS (
    SELECT 1 FROM word_variants wv WHERE wv.word_id = w.id AND wv.variant = 'msa'
  );
```

**Checkpoint M3 :**
- [ ] `SELECT COUNT(*) FROM words;` → 73 (44 existants + 29 nouveaux)
- [ ] `SELECT theme, COUNT(*) FROM words WHERE theme IS NOT NULL GROUP BY theme ORDER BY theme;` → family:8, first_words:8, daily:9, places:11, describe:10, root_bonus:12
- [ ] `SELECT COUNT(*) FROM word_variants WHERE variant = 'msa';` → 73
- [ ] Aucune erreur SQL
- [ ] Les nouveaux mots ont des `arabic_vocalized` avec harakats corrects (vérifier visuellement 5-6 mots dans le Dashboard)

---

## MISSION 4 — Réorganiser les leçons du Module 3

### 4a — Mettre à jour les titres et descriptions des leçons existantes

> **IMPORTANT** : Les leçons du Module 3 ont été créées en É6 avec des IDs auto-générés. Il faut les identifier par leur `sort_order` et leur `module_id`.

```sql
-- Identifier le module_id de Module 3
-- SELECT id FROM modules WHERE sort_order = 3;
-- → utiliser ce résultat dans les requêtes ci-dessous (remplacer <module3_id>)

-- Leçon 3.1 : PAS DE CHANGEMENT (tes premiers mots)
-- Leçon 3.2 : PAS DE CHANGEMENT (solaires/lunaires)

-- Leçon 3.3 : était "La magie des racines : ك-ت-ب" → devient "Ma famille"
UPDATE lessons
SET title_fr = 'Ma famille',
    title_ar = 'عَائِلَتِي',
    description_fr = 'Les mots pour parler de ceux qui comptent : frère, sœur, fils, fille, homme, femme, enfant.'
WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3) AND sort_order = 3;

-- Leçon 3.4 : était "Racines ع-ل-م et د-ر-س" → devient "Le quotidien"
UPDATE lessons
SET title_fr = 'Le quotidien',
    title_ar = 'الحَيَاة اليَوْمِيَّة',
    description_fr = 'Nourriture, travail, temps, argent — les mots que tu entendras chaque jour.'
WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3) AND sort_order = 4;

-- Leçon 3.5 : était "Racines ق-ر-أ et ف-ت-ح" → devient "Mon environnement"
UPDATE lessons
SET title_fr = 'Mon environnement',
    title_ar = 'مَا حَوْلِي',
    description_fr = 'Livre, école, marché, rue, ville, mosquée — les lieux de ta vie en arabe.'
WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3) AND sort_order = 5;

-- Leçon 3.6 : était "Lecture libre : tous les mots" → devient "Décrire le monde"
UPDATE lessons
SET title_fr = 'Décrire le monde',
    title_ar = 'وَصْفُ العَالَم',
    description_fr = 'Grand, petit, nouveau, ancien, proche, loin, facile, difficile — les adjectifs essentiels.'
WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3) AND sort_order = 6;
```

### 4b — Mettre à jour le XP et le temps estimé

```sql
-- Les leçons thématiques ont plus de mots → légèrement plus de XP et de temps
UPDATE lessons
SET xp_reward = 30, estimated_minutes = 8
WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3) AND sort_order IN (3, 4, 5, 6);
```

**Checkpoint M4 :**
- [ ] `SELECT sort_order, title_fr, title_ar FROM lessons WHERE module_id = (SELECT id FROM modules WHERE sort_order = 3) ORDER BY sort_order;` retourne :
  1. Tes premiers mots
  2. L'article al- : solaires et lunaires
  3. Ma famille (عَائِلَتِي)
  4. Le quotidien (الحَيَاة اليَوْمِيَّة)
  5. Mon environnement (مَا حَوْلِي)
  6. Décrire le monde (وَصْفُ العَالَم)
- [ ] Les leçons 1 et 2 sont INCHANGÉES

---

## MISSION 5 — Modifier `word-exercise-generator.ts`

C'est la seule modification de code TypeScript de cette étape. Le fichier est `src/engines/word-exercise-generator.ts`.

### 5a — Remplacer `LESSON_WORD_CONFIG`

Trouver le bloc :

```typescript
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
```

> **Note** : Les rootIds utilisés dans le code pourraient être des UUIDs au lieu de `'root-ktb'`. Chercher le pattern réel dans le fichier.

Remplacer par :

```typescript
/**
 * Mapping leçon (sort_order dans Module 3) → type de contenu
 *
 * POST-PIVOT É10.5 :
 * Les leçons sont organisées par thème (fréquence d'abord),
 * pas par racine. Les racines apparaissent en bonus quand
 * plusieurs mots d'une leçon partagent la même racine.
 *
 * Leçon 1 : Premiers mots simples (is_simple_word + theme first_words)
 * Leçon 2 : Solaires/Lunaires (mots simples + al-)
 * Leçon 3 : Famille (theme family)
 * Leçon 4 : Quotidien (theme daily)
 * Leçon 5 : Environnement/Lieux (theme places)
 * Leçon 6 : Décrire (theme describe — adjectifs et révision)
 */
export const LESSON_WORD_CONFIG: Record<number, {
  type: 'simple' | 'solar_lunar' | 'theme' | 'revision';
  theme?: string;
}> = {
  1: { type: 'simple' },
  2: { type: 'solar_lunar' },
  3: { type: 'theme', theme: 'family' },
  4: { type: 'theme', theme: 'daily' },
  5: { type: 'theme', theme: 'places' },
  6: { type: 'theme', theme: 'describe' },
};
```

### 5b — Remplacer le bloc `if (config.type === 'root')` dans `generateWordExercises`

Trouver le bloc entier :

```typescript
if (config.type === 'root') {
  const lessonRoots = roots.filter(r => config.rootIds?.includes(r.id));
  // ... tout le bloc jusqu'à la fermeture }
}
```

Remplacer par :

```typescript
if (config.type === 'theme') {
  // MCQ : Mot arabe → traduction française (pour chaque mot du thème)
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

  // MCQ : Traduction française → mot arabe (moitié des mots)
  for (const word of lessonWords.slice(0, Math.ceil(lessonWords.length / 2))) {
    exercises.push({
      id: `mcq-fr-to-ar-${word.id}`,
      type: 'mcq',
      instruction_fr: `Trouve le mot "${word.translation_fr}"`,
      prompt: { fr: word.translation_fr },
      options: generateTranslationOptions(word, allWords, 'fr_to_ar'),
      metadata: { word_id: word.id },
    });
  }

  // MCQ : Décodage (mot arabe → translittération)
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

  // Match : Associer 4 mots du thème à leurs traductions
  if (lessonWords.length >= 4) {
    exercises.push({
      id: `match-theme-${config.theme}`,
      type: 'match',
      instruction_fr: 'Associe les mots à leur traduction',
      prompt: { fr: '' },
      matchPairs: lessonWords.slice(0, 4).map(w => ({
        id: w.id,
        left: { ar: w.arabic_vocalized },
        right: { fr: w.translation_fr },
      })),
      metadata: {},
    });
  }

  // BONUS RACINE : Si 2+ mots de la leçon partagent une racine, ajouter un exercice "quelle racine ?"
  const rootGroups = new Map<string, Word[]>();
  for (const word of lessonWords) {
    if (word.root_id) {
      const group = rootGroups.get(word.root_id) || [];
      group.push(word);
      rootGroups.set(word.root_id, group);
    }
  }

  for (const [rootId, rootWords] of rootGroups) {
    if (rootWords.length >= 2) {
      const root = roots.find(r => r.id === rootId);
      if (root) {
        exercises.push({
          id: `mcq-root-bonus-${rootId}`,
          type: 'mcq',
          instruction_fr: `Ces mots partagent une racine. Laquelle ?`,
          prompt: {
            ar: rootWords.map(w => w.arabic_vocalized).join(' — '),
            fr: rootWords.map(w => w.translation_fr).join(', '),
          },
          options: shuffleArray([
            { id: rootId, text: { ar: root.consonants.join(' - '), fr: root.core_meaning_fr }, correct: true },
            ...roots
              .filter(r => r.id !== rootId)
              .slice(0, 2)
              .map(r => ({
                id: r.id,
                text: { ar: r.consonants.join(' - '), fr: r.core_meaning_fr },
                correct: false,
              })),
          ]),
          metadata: { root_id: rootId },
        });
      }
    }
  }
}
```

### 5c — Mettre à jour l'écran de leçon : chargement par thème

Dans le fichier où les mots de la leçon sont chargés (probablement l'écran de leçon ou un hook), trouver la logique qui charge les mots selon le `LESSON_WORD_CONFIG`. Elle ressemble à :

```typescript
// AVANT : chargement par racine
if (config.type === 'root') {
  lessonWords = await getWordsByRootIds(config.rootIds);
}
```

Remplacer par :

```typescript
// APRÈS : chargement par thème
if (config.type === 'theme' && config.theme) {
  lessonWords = await getWordsByTheme(config.theme);
}
```

> **Note** : Le type `'simple'` et `'solar_lunar'` continuent de fonctionner comme avant (filtrage par `is_simple_word`). Seul le `'root'` est remplacé par `'theme'`.

### 5d — Bonus : RootFamilyDisplay en fin de leçon thématique

Dans l'écran de leçon, après la phase de présentation des mots (WordCards), ajouter un affichage optionnel de RootFamilyDisplay si des mots de la leçon partagent une racine :

```typescript
// Après les WordCards de la leçon :
if (config.type === 'theme') {
  // Chercher les racines partagées parmi les mots de la leçon
  const rootIdsInLesson = [...new Set(lessonWords.filter(w => w.root_id).map(w => w.root_id))];

  for (const rootId of rootIdsInLesson) {
    const rootWords = lessonWords.filter(w => w.root_id === rootId);
    if (rootWords.length >= 2) {
      const root = allRoots.find(r => r.id === rootId);
      if (root) {
        // Afficher un encadré "Le savais-tu ?" avec RootFamilyDisplay
        // → "كتاب et مدرسة partagent la racine ك-ت-ب !"
        // Le composant RootFamilyDisplay existe déjà — l'utiliser tel quel
      }
    }
  }
}
```

> Ce bonus est optionnel dans É10.5. Si le temps manque, le skipper — les exercices bonus racine de la M5b suffisent.

**Checkpoint M5 :**
- [ ] `LESSON_WORD_CONFIG` utilise `'theme'` au lieu de `'root'` pour les leçons 3-6
- [ ] Le type TypeScript `'root'` est supprimé, remplacé par `'theme'`
- [ ] `generateWordExercises` avec `type: 'theme'` génère MCQ + Match + bonus racine
- [ ] Le chargement des mots utilise `getWordsByTheme()` au lieu de `getWordsByRootIds()`
- [ ] `npx tsc --noEmit` → 0 erreur
- [ ] Aucun import de `src/db/remote` dans le fichier

---

## MISSION 6 — Mise à jour du hook `useWords`

Ajouter un hook pour charger les mots par thème :

### 6a — Dans `src/hooks/useWords.ts`

```typescript
export function useWordsByTheme(theme: string | null) {
  return useQuery({
    queryKey: ['words', 'theme', theme],
    queryFn: () => theme ? getWordsByTheme(theme) : Promise.resolve([]),
    staleTime: Infinity,
    enabled: !!theme,
  });
}
```

Vérifier que `getWordsByTheme` est bien importé depuis `local-queries.ts`.

**Checkpoint M6 :**
- [ ] `useWordsByTheme('family')` retourne 8 mots
- [ ] `useWordsByTheme('daily')` retourne 9 mots (8 nouveaux + علم)
- [ ] `useWordsByTheme('places')` retourne 11 mots (4 existants + 7 nouveaux)
- [ ] `useWordsByTheme('describe')` retourne 10 mots (4 existants + 6 nouveaux)
- [ ] `npx tsc --noEmit` → 0 erreur

---

## MISSION 7 — Vérification end-to-end

### 7a — Content sync

```
1. Supprimer l'app et relancer (forcer re-sync complet)
2. Vérifier dans les logs : 73 mots syncés, 73 word_variants, 5 racines
3. getWordsByTheme('family') en local → 8 mots
4. getWordsByTheme('daily') en local → 9 mots
5. getAllWords() → 73 mots
```

### 7b — Module 3 : leçons jouables

```
1. Onglet Apprendre → Module 3 → 6 leçons affichées
2. Leçon 3.1 "Tes premiers mots" → INCHANGÉE (8 WordCards : بيت, باب, أم, أب, ماء, يوم, شمس, قمر)
3. Leçon 3.2 "L'article al-" → INCHANGÉE
4. Leçon 3.3 "Ma famille" → 8 WordCards (أخ, أخت, ابن, بنت, ولد, رجل, امرأة, طفل)
   - MCQ AR→FR, FR→AR, décodage
   - Match (4 mots)
   - PAS de RootFamilyDisplay (aucun mot ne partage une racine ici)
5. Leçon 3.4 "Le quotidien" → 8-9 WordCards (طعام, خبز, عمل, وقت, مال, شيء, كثير, قليل, علم)
   - MCQ + Match
6. Leçon 3.5 "Mon environnement" → 11 WordCards (كتاب, مدرسة, درس, قلم, سوق, شارع, مدينة, مسجد, طريق, سيارة, غرفة)
   - MCQ + Match
   - BONUS RACINE possible : كتاب + درس partagent-ils une racine ? Non (racines différentes). Mais مسجد pourrait déclencher un bonus si d'autres mots de س-ج-د étaient présents.
7. Leçon 3.6 "Décrire le monde" → 10 WordCards (جديد, قديم, قريب, بعيد, سهل, صعب, كبير, صغير, جميل, مفيد)
   - MCQ + Match
```

### 7c — SRS

```
1. Compléter une leçon thématique (ex: "Ma famille")
2. → 8 cartes SRS de type 'word' créées dans SQLite
3. Les cartes apparaissent dans l'onglet Réviser quand elles sont dues
4. Les cartes SRS existantes (lettres, diacritiques, mots M3 anciens) fonctionnent toujours
```

### 7d — Mots root_bonus

```
1. Les 12 mots theme='root_bonus' (مكتوب, كاتب, مكتبة, عالم, معلم, مدرس, قارئ, قراءة, فتح, مفتاح, فاتحة, تعلم) ne sont PAS dans les leçons thématiques
2. Ils restent dans la base et sont utilisables par :
   - Le SRS (si des cartes existaient déjà)
   - Le Module 4 (sentences : هذا كتاب → utilise word-kitab qui est theme='places')
   - Les futures étapes (É11 grammaire utilise ces mots dans les exemples)
3. Aucun crash si on accède à ces mots via d'autres écrans
```

### 7e — Régression É0–É10

```
1. Onboarding : 5 écrans → recommandation → parcours standard
2. Module 1 alphabet : 7 leçons, MCQ, tracé
3. Module 2 harakats : exercices syllabiques
4. Module 4 construire du sens : phrases, dialogues, fill_blank — INCHANGÉ
5. SRS : révision lettres + diacritiques + mots (anciens ET nouveaux)
6. Streak et XP après chaque leçon
7. Profil : streaks, XP, stats
8. Settings : 8 settings propagés
9. Mode avion : tout fonctionne
10. Audio : lettres et mots jouables
```

### 7f — Vérification architecture

```bash
# Aucun import db/remote hors sync files
grep -rn "from.*db/remote\|from.*supabase" \
  src/hooks/ src/stores/ src/components/ src/engines/
# → Seul feedback-service.ts (si présent) doit apparaître

npx tsc --noEmit
# → 0 erreur
```

### Checkpoint final É10.5

- [ ] Colonne `theme` présente dans words (Cloud + SQLite)
- [ ] 73 mots dans la table `words` (44 anciens + 29 nouveaux)
- [ ] 73 variantes MSA dans `word_variants`
- [ ] Thèmes attribués : first_words(8), family(8), daily(9), places(11), describe(10), root_bonus(12), NULL(15)
- [ ] Leçons M3 : titres mis à jour (3.3→"Ma famille", 3.4→"Le quotidien", 3.5→"Mon environnement", 3.6→"Décrire le monde")
- [ ] `LESSON_WORD_CONFIG` utilise `'theme'` au lieu de `'root'`
- [ ] `getWordsByTheme()` fonctionne dans local-queries
- [ ] `useWordsByTheme()` fonctionne dans les hooks
- [ ] Les 6 leçons du Module 3 sont jouables de bout en bout
- [ ] Les exercices génèrent MCQ + Match + bonus racine (quand applicable)
- [ ] Les cartes SRS `word` sont créées après chaque leçon
- [ ] Aucune régression Modules 1, 2, 4
- [ ] Mode avion fonctionne
- [ ] **Aucun hook ni store n'importe `src/db/remote`**
- [ ] `npx tsc --noEmit` → 0 erreur

---

## RÉSUMÉ DE L'ÉTAPE 10.5

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Colonne `theme` (Cloud + SQLite + local-queries + sync) | ⬜ |
| 2 | Thèmes attribués aux 44 mots existants | ⬜ |
| 3 | 29 nouveaux mots haute fréquence (family, daily, places, describe) | ⬜ |
| 4 | Leçons M3 réorganisées par thèmes | ⬜ |
| 5 | `word-exercise-generator.ts` pivoté (theme-based + bonus racine) | ⬜ |
| 6 | Hook `useWordsByTheme` | ⬜ |
| 7 | Vérification end-to-end + régression É0–É10 | ⬜ |

---

## GESTION /docs

**Fichiers à conserver dans /docs après É10.5 :**
- `ETAPE-10_5-pivot-vocabulaire.md` (ce fichier)
- `lisaan-seed-letters.json` (toujours utile)

**Fichiers à supprimer de /docs :**
- Le fichier .md de l'étape précédente (É10)

---

## NOTE STRATÉGIQUE

> Ce pivot change la philosophie de sélection du vocabulaire, PAS l'architecture.
> Le principe fondateur "Racines d'abord" du brief est reformulé en **"Fréquence d'abord, racines en lumière"** :
> - L'apprenant apprend les mots dont il a besoin (sélectionnés par fréquence d'usage).
> - Lisaan lui montre systématiquement la racine derrière chaque mot (quand elle existe) pour développer le réflexe morphologique.
> - Les familles de racines complètes ne sont plus imposées dans les premières leçons — elles émergent naturellement au fil de l'apprentissage.
>
> **Impact sur É11–É16** : Aucun. Ces étapes ajoutent leurs propres modules, tables et générateurs d'exercices. Elles n'interfèrent pas avec le Module 3 ni avec le word-exercise-generator.
