# ÉTAPE 4.5 — Migration infrastructure : Supabase Cloud + Offline-first SQLite

> **Contexte projet** : Lisaan est une app React Native (Expo SDK 52+) d'apprentissage de l'arabe.
> Étapes terminées : 0 à 4. L'app fonctionne mais TOUS les hooks (useLetters, useLessons, useSRSCards, useProgress, useSettingsStore) interrogent directement Supabase Cloud. Il n'y a aucune couche SQLite locale.
>
> **Changement d'infrastructure** :
> - Docker et Supabase Local sont SUPPRIMÉS (raisons de ressources disque)
> - Le backend est exclusivement Supabase Cloud (BaaS)
> - L'architecture offline-first doit être appliquée strictement :
>   - Le **contenu pédagogique** (lettres, diacritiques, modules, leçons) est téléchargé depuis Supabase Cloud et **stocké localement dans expo-sqlite**
>   - La **progression utilisateur** (user_progress, srs_cards, user_settings) est **écrite d'abord dans SQLite local**, puis **synchronisée vers Supabase Cloud** via un sync-manager
>   - L'app doit fonctionner SANS connexion pour le contenu déjà téléchargé

> **Règle** : Exécute chaque mission dans l'ordre. Ne passe à la suivante qu'après validation du checkpoint.

---

## MISSION 1 — Audit et nettoyage : supprimer toute trace de Docker / Supabase Local

**Action :**

### 1.1 — Supprimer le dossier `supabase/` local (CLI)

```bash
# Vérifier ce qui existe
ls -la supabase/

# GARDER uniquement le dossier migrations/ (on en aura besoin comme référence pour le schéma SQLite)
# Copier les migrations dans un dossier temporaire
mkdir -p _backup_migrations
cp -r supabase/migrations/ _backup_migrations/

# Supprimer tout le dossier supabase/
rm -rf supabase/

# Supprimer la dépendance Supabase CLI locale si elle est dans package.json
npm uninstall supabase
```

> **Note importante :** Les migrations SQL restent utiles comme documentation du schéma. On les a copiées dans `_backup_migrations/`. On pourra les supprimer une fois le schéma SQLite créé.

### 1.2 — Nettoyer les fichiers de config Docker

```bash
# Supprimer si présents :
rm -f docker-compose.yml docker-compose.*.yml
rm -f Dockerfile .dockerignore
rm -rf .docker/
```

### 1.3 — Nettoyer le .env

Ouvre `.env` et :
- Supprime toute référence à `localhost:54321` ou `localhost:54323`
- Vérifie que `EXPO_PUBLIC_SUPABASE_URL` pointe vers le projet Cloud (ex: `https://xxxxx.supabase.co`)
- Vérifie que `EXPO_PUBLIC_SUPABASE_ANON_KEY` est la clé anon du projet Cloud

Le `.env` doit ressembler à :
```
EXPO_PUBLIC_SUPABASE_URL=https://<ton-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ta-clé-anon-cloud>
```

### 1.4 — Nettoyer package.json

Supprime tout script npm qui référence Docker ou Supabase Local :
```bash
# Chercher les scripts suspects
grep -n "supabase\|docker" package.json
```

Supprime les scripts de type `"db:reset"`, `"db:start"`, `"supabase:start"`, etc.

### 1.5 — Nettoyer le .gitignore

Supprime les entrées relatives à Docker/Supabase local si elles existent :
```
# Supprimer ces lignes si présentes :
supabase/.temp/
.docker/
docker-compose.override.yml
```

Garde les entrées utiles :
```
.env
.env.local
```

### 1.6 — Vérifier que le client Supabase pointe vers le Cloud

Ouvre `src/db/remote.ts` et vérifie :

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing — check .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Pas besoin de changer le code — il lit les variables d'environnement. Mais vérifie qu'il n'y a pas de fallback vers `localhost`.

**Checkpoint :**
- [ ] Le dossier `supabase/` n'existe plus à la racine du projet
- [ ] Aucun `docker-compose.yml` ou `Dockerfile` dans le projet
- [ ] `package.json` ne contient aucun script avec "supabase" ou "docker"
- [ ] `.env` pointe exclusivement vers le Cloud Supabase (`https://....supabase.co`)
- [ ] `src/db/remote.ts` ne contient aucune référence à `localhost`
- [ ] `grep -rn "localhost:54" src/` ne retourne rien
- [ ] `grep -rn "supabase start\|supabase db reset\|supabase stop" .` ne retourne rien
- [ ] `_backup_migrations/` contient les fichiers SQL pour référence

---

## MISSION 2 — Installer et configurer expo-sqlite

**Action :**

### 2.1 — Installer expo-sqlite

```bash
npx expo install expo-sqlite
```

### 2.2 — Créer le module d'initialisation de la base locale

Crée `src/db/local.ts` :

```typescript
// src/db/local.ts
// Couche d'accès à la base SQLite locale (offline-first)

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Ouvre (ou crée) la base SQLite locale.
 * Appelé une seule fois au démarrage de l'app.
 */
export async function openLocalDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('lisaan.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Retourne l'instance de la base SQLite.
 * Lève une erreur si la base n'a pas été ouverte.
 */
export function getLocalDB(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Local DB not initialized — call openLocalDB() first');
  return db;
}
```

> **Note sur l'API expo-sqlite (SDK 52+)** : L'API est asynchrone (promise-based). Les méthodes clés sont :
> - `db.execAsync(sql)` — exécuter du SQL sans retour
> - `db.getAllAsync<T>(sql, params?)` — SELECT qui retourne un tableau
> - `db.getFirstAsync<T>(sql, params?)` — SELECT qui retourne 1 ligne
> - `db.runAsync(sql, params?)` — INSERT/UPDATE/DELETE (retourne `{ lastInsertRowId, changes }`)

**Checkpoint :**
- [ ] `expo-sqlite` est dans `package.json` (dependencies)
- [ ] `src/db/local.ts` compile sans erreur
- [ ] L'import `import * as SQLite from 'expo-sqlite'` résout correctement

---

## MISSION 3 — Schéma SQLite local

**Action :**
Crée `src/db/schema-local.ts` — le fichier qui crée toutes les tables SQLite locales au premier lancement.

Le schéma SQLite est un **miroir simplifié** du schéma Supabase. On ne réplique pas les policies RLS ni les triggers — ceux-ci restent côté Cloud. On réplique uniquement la structure des données.

```typescript
// src/db/schema-local.ts

import { getLocalDB } from './local';

/**
 * Crée toutes les tables locales si elles n'existent pas déjà.
 * Appelé au démarrage de l'app, après openLocalDB().
 */
export async function initLocalSchema(): Promise<void> {
  const db = getLocalDB();

  await db.execAsync(`

    -- ============================================================
    -- TABLES CONTENU (read-only local, sync depuis Cloud)
    -- ============================================================

    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      transliteration TEXT,
      ipa TEXT,
      form_isolated TEXT NOT NULL,
      form_initial TEXT,
      form_medial TEXT,
      form_final TEXT,
      connects_left INTEGER NOT NULL DEFAULT 0,
      connects_right INTEGER NOT NULL DEFAULT 0,
      audio_url TEXT,
      articulation_group TEXT,
      articulation_fr TEXT,
      sort_order INTEGER NOT NULL,
      is_sun_letter INTEGER NOT NULL DEFAULT 0,
      pedagogy_notes TEXT,
      confusion_pairs TEXT,  -- JSON array de IDs, ex: '["letter-003-ta","letter-004-tha"]'
      synced_at TEXT          -- ISO 8601, dernière sync depuis Cloud
    );

    CREATE TABLE IF NOT EXISTS diacritics (
      id TEXT PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      symbol TEXT NOT NULL,
      sound_effect TEXT,
      audio_url TEXT,
      category TEXT NOT NULL, -- 'vowel_short' | 'vowel_long' | 'tanwin' | 'other'
      sort_order INTEGER NOT NULL,
      pedagogy_notes TEXT,
      visual_description TEXT,
      example_letters TEXT,   -- JSON array, ex: '["بَ","تَ","سَ"]'
      transliteration TEXT,
      ipa TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title_fr TEXT NOT NULL,
      title_ar TEXT,
      description_fr TEXT,
      sort_order INTEGER NOT NULL,
      icon TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title_fr TEXT NOT NULL,
      title_ar TEXT,
      description_fr TEXT,
      sort_order INTEGER NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 10,
      estimated_minutes INTEGER NOT NULL DEFAULT 5,
      synced_at TEXT,
      FOREIGN KEY (module_id) REFERENCES modules(id)
    );

    -- ============================================================
    -- TABLES UTILISATEUR (read-write local, sync vers Cloud)
    -- ============================================================

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked', -- 'locked' | 'available' | 'in_progress' | 'completed'
      score INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      synced_at TEXT,         -- NULL = pas encore sync vers Cloud
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS srs_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,  -- 'letter' | 'diacritic' | 'word' | 'sentence'
      item_id TEXT NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_at TEXT NOT NULL,
      last_review_at TEXT,
      last_quality INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      UNIQUE(user_id, item_type, item_id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      harakats_mode TEXT NOT NULL DEFAULT 'always',
      transliteration_mode TEXT NOT NULL DEFAULT 'always',
      translation_mode TEXT NOT NULL DEFAULT 'always',
      exercise_direction TEXT NOT NULL DEFAULT 'both',
      audio_autoplay INTEGER NOT NULL DEFAULT 1,
      audio_speed TEXT NOT NULL DEFAULT 'slow',
      font_size TEXT NOT NULL DEFAULT 'large',
      haptic_feedback INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    -- ============================================================
    -- TABLE SYNC METADATA
    -- ============================================================

    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name TEXT PRIMARY KEY,
      last_synced_at TEXT NOT NULL,  -- ISO 8601 du dernier sync réussi
      row_count INTEGER NOT NULL DEFAULT 0
    );

    -- ============================================================
    -- INDEX
    -- ============================================================

    CREATE INDEX IF NOT EXISTS idx_letters_sort ON letters(sort_order);
    CREATE INDEX IF NOT EXISTS idx_diacritics_sort ON diacritics(sort_order);
    CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_srs_user_due ON srs_cards(user_id, next_review_at);
    CREATE INDEX IF NOT EXISTS idx_srs_user_type ON srs_cards(user_id, item_type, item_id);
    CREATE INDEX IF NOT EXISTS idx_progress_synced ON user_progress(synced_at);
    CREATE INDEX IF NOT EXISTS idx_srs_synced ON srs_cards(synced_at);

  `);
}
```

**Checkpoint :**
- [ ] `src/db/schema-local.ts` compile sans erreur
- [ ] Le schéma couvre les 4 tables contenu (letters, diacritics, modules, lessons) et les 3 tables utilisateur (user_progress, srs_cards, user_settings)
- [ ] La table `sync_metadata` permet de tracker la dernière sync de chaque table
- [ ] Les colonnes `synced_at` existent sur toutes les tables (NULL = pas encore sync)
- [ ] Les index couvrent les requêtes fréquentes (sort_order, user_id, next_review_at)

---

## MISSION 4 — Couche d'accès données locale (CRUD SQLite)

**Action :**
Crée `src/db/local-queries.ts` — toutes les fonctions de lecture/écriture SQLite.

Ce fichier centralise TOUTES les interactions avec la base locale. Aucun autre fichier ne devrait faire de SQL brut.

```typescript
// src/db/local-queries.ts

import { getLocalDB } from './local';

// ================================================================
// CONTENT — Lecture seule (sync depuis Cloud → SQLite)
// ================================================================

// --- Letters ---

export async function getAllLetters() {
  const db = getLocalDB();
  return db.getAllAsync<any>('SELECT * FROM letters ORDER BY sort_order ASC');
}

export async function getLettersBySortRange(start: number, end: number) {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM letters WHERE sort_order >= ? AND sort_order <= ? ORDER BY sort_order ASC',
    [start, end]
  );
}

export async function upsertLetters(letters: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const l of letters) {
    await db.runAsync(
      `INSERT OR REPLACE INTO letters (
        id, name_ar, name_fr, transliteration, ipa,
        form_isolated, form_initial, form_medial, form_final,
        connects_left, connects_right, audio_url,
        articulation_group, articulation_fr, sort_order, is_sun_letter,
        pedagogy_notes, confusion_pairs, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l.id, l.name_ar, l.name_fr, l.transliteration, l.ipa,
        l.form_isolated, l.form_initial, l.form_medial, l.form_final,
        l.connects_left ? 1 : 0, l.connects_right ? 1 : 0, l.audio_url,
        l.articulation_group, l.articulation_fr, l.sort_order, l.is_sun_letter ? 1 : 0,
        l.pedagogy_notes,
        JSON.stringify(l.confusion_pairs ?? []),
        now,
      ]
    );
  }
}

// --- Diacritics ---

export async function getAllDiacritics() {
  const db = getLocalDB();
  const rows = await db.getAllAsync<any>('SELECT * FROM diacritics ORDER BY sort_order ASC');
  return rows.map(d => ({
    ...d,
    example_letters: d.example_letters ? JSON.parse(d.example_letters) : [],
  }));
}

export async function getDiacriticsBySortOrders(sortOrders: number[]) {
  const db = getLocalDB();
  const placeholders = sortOrders.map(() => '?').join(',');
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM diacritics WHERE sort_order IN (${placeholders}) ORDER BY sort_order ASC`,
    sortOrders
  );
  return rows.map(d => ({
    ...d,
    example_letters: d.example_letters ? JSON.parse(d.example_letters) : [],
  }));
}

export async function upsertDiacritics(diacritics: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const d of diacritics) {
    await db.runAsync(
      `INSERT OR REPLACE INTO diacritics (
        id, name_ar, name_fr, symbol, sound_effect, audio_url,
        category, sort_order, pedagogy_notes, visual_description,
        example_letters, transliteration, ipa, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.id, d.name_ar, d.name_fr, d.symbol, d.sound_effect, d.audio_url,
        d.category, d.sort_order, d.pedagogy_notes, d.visual_description,
        JSON.stringify(d.example_letters ?? []),
        d.transliteration, d.ipa, now,
      ]
    );
  }
}

// --- Modules ---

export async function getAllModules() {
  const db = getLocalDB();
  return db.getAllAsync<any>('SELECT * FROM modules ORDER BY sort_order ASC');
}

export async function upsertModules(modules: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const m of modules) {
    await db.runAsync(
      `INSERT OR REPLACE INTO modules (id, title_fr, title_ar, description_fr, sort_order, icon, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.title_fr, m.title_ar, m.description_fr, m.sort_order, m.icon, now]
    );
  }
}

// --- Lessons ---

export async function getLessonsByModule(moduleId: string) {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order ASC',
    [moduleId]
  );
}

export async function getLessonById(lessonId: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>('SELECT * FROM lessons WHERE id = ?', [lessonId]);
}

export async function getLessonWithModule(lessonId: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    `SELECT l.*, m.sort_order as module_sort_order
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE l.id = ?`,
    [lessonId]
  );
}

export async function upsertLessons(lessons: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const l of lessons) {
    await db.runAsync(
      `INSERT OR REPLACE INTO lessons (
        id, module_id, title_fr, title_ar, description_fr,
        sort_order, xp_reward, estimated_minutes, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, l.module_id, l.title_fr, l.title_ar, l.description_fr,
       l.sort_order, l.xp_reward, l.estimated_minutes, now]
    );
  }
}

// ================================================================
// USER DATA — Lecture/écriture locale, sync vers Cloud
// ================================================================

// --- User Progress ---

export async function getProgressForUser(userId: string) {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM user_progress WHERE user_id = ?',
    [userId]
  );
}

export async function upsertProgress(progress: {
  id: string;
  user_id: string;
  lesson_id: string;
  status: string;
  score: number;
  completed_at: string | null;
  attempts: number;
  time_spent_seconds: number;
}): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user_progress (id, user_id, lesson_id, status, score, completed_at, attempts, time_spent_seconds, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       status = CASE WHEN excluded.status = 'completed' OR user_progress.status != 'completed' THEN excluded.status ELSE user_progress.status END,
       score = MAX(user_progress.score, excluded.score),
       completed_at = COALESCE(excluded.completed_at, user_progress.completed_at),
       attempts = user_progress.attempts + 1,
       time_spent_seconds = user_progress.time_spent_seconds + excluded.time_spent_seconds,
       updated_at = ?,
       synced_at = NULL`,
    [progress.id, progress.user_id, progress.lesson_id, progress.status,
     progress.score, progress.completed_at, progress.attempts,
     progress.time_spent_seconds, now, now]
  );
}

export async function getUnsyncedProgress(): Promise<any[]> {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM user_progress WHERE synced_at IS NULL'
  );
}

export async function markProgressSynced(ids: string[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE user_progress SET synced_at = ? WHERE id IN (${placeholders})`,
    [now, ...ids]
  );
}

// --- SRS Cards ---

export async function getSRSCardsForUser(userId: string) {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM srs_cards WHERE user_id = ? ORDER BY next_review_at ASC',
    [userId]
  );
}

export async function getDueCards(userId: string) {
  const db = getLocalDB();
  const now = new Date().toISOString();
  return db.getAllAsync<any>(
    'SELECT * FROM srs_cards WHERE user_id = ? AND next_review_at <= ? ORDER BY next_review_at ASC',
    [userId, now]
  );
}

export async function upsertSRSCard(card: {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string | null;
  last_quality: number;
}): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO srs_cards (id, user_id, item_type, item_id, ease_factor, interval_days,
      repetitions, next_review_at, last_review_at, last_quality, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(user_id, item_type, item_id) DO UPDATE SET
       ease_factor = excluded.ease_factor,
       interval_days = excluded.interval_days,
       repetitions = excluded.repetitions,
       next_review_at = excluded.next_review_at,
       last_review_at = excluded.last_review_at,
       last_quality = excluded.last_quality,
       updated_at = ?,
       synced_at = NULL`,
    [card.id, card.user_id, card.item_type, card.item_id,
     card.ease_factor, card.interval_days, card.repetitions,
     card.next_review_at, card.last_review_at, card.last_quality, now, now]
  );
}

export async function getUnsyncedSRSCards(): Promise<any[]> {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM srs_cards WHERE synced_at IS NULL'
  );
}

export async function markSRSCardsSynced(ids: string[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE srs_cards SET synced_at = ? WHERE id IN (${placeholders})`,
    [now, ...ids]
  );
}

// --- User Settings ---

export async function getSettings(userId: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId]
  );
}

export async function upsertSettings(userId: string, settings: Record<string, any>): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user_settings (user_id, harakats_mode, transliteration_mode, translation_mode,
      exercise_direction, audio_autoplay, audio_speed, font_size, haptic_feedback, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(user_id) DO UPDATE SET
       harakats_mode = excluded.harakats_mode,
       transliteration_mode = excluded.transliteration_mode,
       translation_mode = excluded.translation_mode,
       exercise_direction = excluded.exercise_direction,
       audio_autoplay = excluded.audio_autoplay,
       audio_speed = excluded.audio_speed,
       font_size = excluded.font_size,
       haptic_feedback = excluded.haptic_feedback,
       updated_at = ?,
       synced_at = NULL`,
    [userId, settings.harakats_mode, settings.transliteration_mode, settings.translation_mode,
     settings.exercise_direction, settings.audio_autoplay ? 1 : 0, settings.audio_speed,
     settings.font_size, settings.haptic_feedback ? 1 : 0, now, now]
  );
}

export async function getUnsyncedSettings(): Promise<any[]> {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM user_settings WHERE synced_at IS NULL'
  );
}

export async function markSettingsSynced(userId: string): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE user_settings SET synced_at = ? WHERE user_id = ?',
    [now, userId]
  );
}

// --- Sync Metadata ---

export async function getSyncMetadata(tableName: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    'SELECT * FROM sync_metadata WHERE table_name = ?',
    [tableName]
  );
}

export async function updateSyncMetadata(tableName: string, rowCount: number): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sync_metadata (table_name, last_synced_at, row_count)
     VALUES (?, ?, ?)
     ON CONFLICT(table_name) DO UPDATE SET last_synced_at = ?, row_count = ?`,
    [tableName, now, rowCount, now, rowCount]
  );
}
```

**Checkpoint :**
- [ ] `src/db/local-queries.ts` compile sans erreur
- [ ] Toutes les tables contenu ont des fonctions `getAll...`, `upsert...`
- [ ] Toutes les tables utilisateur ont des fonctions CRUD + `getUnsynced...` + `markSynced...`
- [ ] Les fonctions `upsert` utilisent `ON CONFLICT` pour les mises à jour idempotentes
- [ ] Les écritures utilisateur mettent `synced_at = NULL` (déclenche la sync vers Cloud)
- [ ] Le conflit de progression utilise `MAX(score)` (préférence au meilleur score)

---

## MISSION 5 — Content Sync : télécharger le contenu depuis Supabase Cloud → SQLite

**Action :**
Crée `src/engines/content-sync.ts` — le service qui télécharge le contenu pédagogique depuis Supabase Cloud et le stocke dans SQLite.

```typescript
// src/engines/content-sync.ts

import { supabase } from '../db/remote';
import {
  upsertLetters, upsertDiacritics, upsertModules, upsertLessons,
  getSyncMetadata, updateSyncMetadata,
} from '../db/local-queries';

export interface ContentSyncResult {
  tables: Record<string, { synced: number; skipped: boolean }>;
  errors: string[];
}

/**
 * Synchronise le contenu pédagogique depuis Supabase Cloud → SQLite local.
 *
 * Stratégie :
 * - Vérifie le timestamp de dernière sync pour chaque table
 * - Ne re-télécharge que si le contenu Cloud est plus récent (ou si jamais sync)
 * - Le contenu est statique et change rarement → sync complète par table
 *
 * Appelé :
 * - Au premier lancement (aucune donnée locale)
 * - Manuellement via un bouton "Mettre à jour le contenu" (futur)
 * - Automatiquement au retour de connexion (si sync_metadata est ancien)
 */
export async function syncContentFromCloud(): Promise<ContentSyncResult> {
  const result: ContentSyncResult = { tables: {}, errors: [] };

  // --- Letters ---
  try {
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertLetters(data);
      await updateSyncMetadata('letters', data.length);
      result.tables.letters = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`letters: ${e.message}`);
  }

  // --- Diacritics ---
  try {
    const { data, error } = await supabase
      .from('diacritics')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertDiacritics(data);
      await updateSyncMetadata('diacritics', data.length);
      result.tables.diacritics = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`diacritics: ${e.message}`);
  }

  // --- Modules ---
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertModules(data);
      await updateSyncMetadata('modules', data.length);
      result.tables.modules = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`modules: ${e.message}`);
  }

  // --- Lessons ---
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertLessons(data);
      await updateSyncMetadata('lessons', data.length);
      result.tables.lessons = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`lessons: ${e.message}`);
  }

  return result;
}

/**
 * Vérifie si le contenu local a besoin d'un refresh.
 * Retourne true si au moins une table n'a jamais été sync.
 */
export async function needsContentSync(): Promise<boolean> {
  const tables = ['letters', 'diacritics', 'modules', 'lessons'];
  for (const table of tables) {
    const meta = await getSyncMetadata(table);
    if (!meta) return true; // Jamais sync
  }
  return false;
}
```

**Checkpoint :**
- [ ] `src/engines/content-sync.ts` compile sans erreur
- [ ] `syncContentFromCloud()` télécharge lettres + diacritiques + modules + lessons depuis Supabase Cloud
- [ ] Les données sont insérées dans SQLite via les fonctions `upsert...`
- [ ] `sync_metadata` est mis à jour après chaque sync réussie
- [ ] `needsContentSync()` retourne `true` au premier lancement
- [ ] Les erreurs réseau ne crashent pas — elles sont collectées dans `result.errors`

---

## MISSION 6 — Progress Sync : pousser les données utilisateur depuis SQLite → Supabase Cloud

**Action :**
Refactore `src/engines/sync-manager.ts` — le service qui pousse la progression locale vers le Cloud.

```typescript
// src/engines/sync-manager.ts

import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../db/remote';
import {
  getUnsyncedProgress, markProgressSynced,
  getUnsyncedSRSCards, markSRSCardsSynced,
  getUnsyncedSettings, markSettingsSynced,
} from '../db/local-queries';
import { syncContentFromCloud, needsContentSync } from './content-sync';

export interface SyncResult {
  pushed: { progress: number; srsCards: number; settings: number };
  pulled: { content: boolean };
  errors: string[];
}

/**
 * Synchronisation bidirectionnelle :
 * 1. PUSH : données utilisateur (SQLite → Cloud)
 * 2. PULL : contenu pédagogique (Cloud → SQLite) si nécessaire
 *
 * Appelé :
 * - Manuellement via un bouton refresh
 * - Automatiquement quand la connectivité revient
 * - En background après chaque leçon complétée
 */
export async function runSync(): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: { progress: 0, srsCards: 0, settings: 0 },
    pulled: { content: false },
    errors: [],
  };

  // Vérifier la connectivité
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    result.errors.push('No network connection — sync skipped');
    return result;
  }

  // --- PUSH : progression ---
  try {
    const unsyncedProgress = await getUnsyncedProgress();
    if (unsyncedProgress.length > 0) {
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          unsyncedProgress.map(p => ({
            id: p.id,
            user_id: p.user_id,
            lesson_id: p.lesson_id,
            status: p.status,
            score: p.score,
            completed_at: p.completed_at,
            attempts: p.attempts,
            time_spent_seconds: p.time_spent_seconds,
          })),
          { onConflict: 'user_id,lesson_id' }
        );
      if (error) throw error;
      await markProgressSynced(unsyncedProgress.map(p => p.id));
      result.pushed.progress = unsyncedProgress.length;
    }
  } catch (e: any) {
    result.errors.push(`push progress: ${e.message}`);
  }

  // --- PUSH : cartes SRS ---
  try {
    const unsyncedCards = await getUnsyncedSRSCards();
    if (unsyncedCards.length > 0) {
      const { error } = await supabase
        .from('srs_cards')
        .upsert(
          unsyncedCards.map(c => ({
            id: c.id,
            user_id: c.user_id,
            item_type: c.item_type,
            item_id: c.item_id,
            ease_factor: c.ease_factor,
            interval_days: c.interval_days,
            repetitions: c.repetitions,
            next_review_at: c.next_review_at,
            last_review_at: c.last_review_at,
            last_quality: c.last_quality,
          })),
          { onConflict: 'user_id,item_type,item_id' }
        );
      if (error) throw error;
      await markSRSCardsSynced(unsyncedCards.map(c => c.id));
      result.pushed.srsCards = unsyncedCards.length;
    }
  } catch (e: any) {
    result.errors.push(`push srs: ${e.message}`);
  }

  // --- PUSH : settings ---
  try {
    const unsyncedSettings = await getUnsyncedSettings();
    for (const s of unsyncedSettings) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: s.user_id,
          harakats_mode: s.harakats_mode,
          transliteration_mode: s.transliteration_mode,
          translation_mode: s.translation_mode,
          exercise_direction: s.exercise_direction,
          audio_autoplay: !!s.audio_autoplay,
          audio_speed: s.audio_speed,
          font_size: s.font_size,
          haptic_feedback: !!s.haptic_feedback,
        }, { onConflict: 'user_id' });
      if (error) throw error;
      await markSettingsSynced(s.user_id);
      result.pushed.settings++;
    }
  } catch (e: any) {
    result.errors.push(`push settings: ${e.message}`);
  }

  // --- PULL : contenu (si nécessaire) ---
  try {
    if (await needsContentSync()) {
      await syncContentFromCloud();
      result.pulled.content = true;
    }
  } catch (e: any) {
    result.errors.push(`pull content: ${e.message}`);
  }

  return result;
}

/**
 * Écoute les changements de connectivité et lance une sync quand le réseau revient.
 * Appelé au démarrage de l'app.
 */
export function startSyncListener(): () => void {
  let wasDisconnected = false;

  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && wasDisconnected) {
      // Le réseau vient de revenir → sync
      console.log('[SyncManager] Network restored — syncing...');
      runSync().then(result => {
        console.log('[SyncManager] Sync result:', result);
      });
    }
    wasDisconnected = !state.isConnected;
  });

  return unsubscribe;
}
```

**Pré-requis — installer NetInfo :**
```bash
npx expo install @react-native-community/netinfo
```

**Checkpoint :**
- [ ] `@react-native-community/netinfo` est installé
- [ ] `src/engines/sync-manager.ts` compile sans erreur
- [ ] `runSync()` pousse les données non-sync (progress + SRS + settings) vers Supabase Cloud
- [ ] `runSync()` tire le contenu depuis Cloud si `needsContentSync()` est true
- [ ] `startSyncListener()` détecte le retour de connectivité et lance la sync
- [ ] Les erreurs réseau ne crashent pas l'app
- [ ] Après un push réussi, `synced_at` est mis à jour localement (pas re-pushé au prochain cycle)

---

## MISSION 7 — Initialisation au démarrage de l'app

**Action :**
Modifie `app/_layout.tsx` pour initialiser la base SQLite et la sync au démarrage.

### Séquence de démarrage :

```
1. Charger les polices (existant)
2. Ouvrir SQLite + créer le schéma (NOUVEAU)
3. Vérifier si le contenu est sync (NOUVEAU)
   → Si oui : continuer
   → Si non : afficher un loader "Téléchargement du contenu..." et sync
4. Lancer le listener de sync (NOUVEAU)
5. Afficher l'app
```

### Implémentation :

```typescript
// Dans app/_layout.tsx

import { openLocalDB } from '../src/db/local';
import { initLocalSchema } from '../src/db/schema-local';
import { needsContentSync, syncContentFromCloud } from '../src/engines/content-sync';
import { startSyncListener } from '../src/engines/sync-manager';

// Dans le composant principal :
const [dbReady, setDbReady] = useState(false);
const [syncing, setSyncing] = useState(false);

useEffect(() => {
  async function initDB() {
    try {
      // 1. Ouvrir SQLite
      await openLocalDB();
      // 2. Créer les tables
      await initLocalSchema();
      // 3. Sync contenu si premier lancement
      if (await needsContentSync()) {
        setSyncing(true);
        await syncContentFromCloud();
        setSyncing(false);
      }
      setDbReady(true);
      // 4. Lancer le listener
      const unsubscribe = startSyncListener();
      return unsubscribe;
    } catch (err) {
      console.error('DB init error:', err);
      // Fallback : continuer même en cas d'erreur (mode dégradé)
      setDbReady(true);
    }
  }
  initDB();
}, []);

// Écran de chargement :
if (!fontsLoaded || !dbReady) {
  return <SplashScreen />;  // Ou un loader avec message
}
if (syncing) {
  return <ContentDownloadScreen />;  // "Téléchargement du contenu..."
}
```

### Écran de téléchargement (ContentDownloadScreen)

Crée un composant simple `src/components/ui/ContentDownloadScreen.tsx` :
- Logo Lisaan centré
- Message : "Préparation du contenu..."
- Barre de progression indéterminée (ou spinner)
- Sous-texte : "Première utilisation — nécessite une connexion"

**Checkpoint :**
- [ ] `app/_layout.tsx` initialise SQLite avant de rendre l'app
- [ ] Au premier lancement avec réseau : le contenu est téléchargé et l'app se lance
- [ ] Au lancement suivant : pas de re-sync, l'app se lance directement depuis SQLite
- [ ] Le `SyncListener` est actif (vérifiable dans les logs console)
- [ ] Si le réseau est absent au premier lancement, un message d'erreur s'affiche (pas de crash)

---

## MISSION 8 — Refactorer TOUS les hooks de données pour lire depuis SQLite

**Action :**
C'est la mission la plus critique. Tous les hooks existants doivent être modifiés pour lire depuis SQLite local au lieu de Supabase Cloud.

### Principe : les hooks lisent TOUJOURS depuis SQLite. Le Cloud est géré par le sync-manager.

### 8.1 — Refactorer `src/hooks/useLetters.ts`

```typescript
// src/hooks/useLetters.ts — REFACTORÉ

import { useQuery } from '@tanstack/react-query';
import { getAllLetters, getLettersBySortRange } from '../db/local-queries';

// L'interface Letter reste identique
export interface Letter {
  id: string;
  name_ar: string;
  name_fr: string;
  transliteration: string;
  ipa: string;
  form_isolated: string;
  form_initial: string;
  form_medial: string;
  form_final: string;
  connects_left: boolean;
  connects_right: boolean;
  audio_url: string | null;
  articulation_group: string;
  articulation_fr: string;
  sort_order: number;
  is_sun_letter: boolean;
  pedagogy_notes: string | null;
  confusion_pairs: string[];
}

function mapLetterRow(row: any): Letter {
  return {
    ...row,
    connects_left: !!row.connects_left,
    connects_right: !!row.connects_right,
    is_sun_letter: !!row.is_sun_letter,
    confusion_pairs: typeof row.confusion_pairs === 'string'
      ? JSON.parse(row.confusion_pairs)
      : row.confusion_pairs ?? [],
  };
}

export function useLetters() {
  return useQuery({
    queryKey: ['letters'],
    queryFn: async () => {
      const rows = await getAllLetters();
      return rows.map(mapLetterRow);
    },
    staleTime: Infinity,
  });
}

export function useLettersForLesson(startOrder: number, endOrder: number) {
  return useQuery({
    queryKey: ['letters', 'range', startOrder, endOrder],
    queryFn: async () => {
      const rows = await getLettersBySortRange(startOrder, endOrder);
      return rows.map(mapLetterRow);
    },
    enabled: startOrder > 0 && endOrder > 0,
    staleTime: Infinity,
  });
}
```

### 8.2 — Refactorer `src/hooks/useLessons.ts`

```typescript
// src/hooks/useLessons.ts — REFACTORÉ

import { useQuery } from '@tanstack/react-query';
import { getLessonsByModule, getLessonWithModule } from '../db/local-queries';

export interface Lesson { /* identique */ }

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => getLessonsByModule(moduleId),
    enabled: !!moduleId,
    staleTime: Infinity,
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLessonWithModule(lessonId),
    enabled: !!lessonId,
    staleTime: Infinity,
  });
}
```

### 8.3 — Refactorer `src/hooks/useSRSCards.ts`

```typescript
// src/hooks/useSRSCards.ts — REFACTORÉ

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSRSCardsForUser, getDueCards as getDueCardsLocal, upsertSRSCard,
} from '../db/local-queries';
import { createNewCard } from '../engines/srs';
import { useUserStore } from '../stores/useUserStore';
import { runSync } from '../engines/sync-manager';

const SRS_QUERY_KEY = ['srs_cards'];

export function useSRSCards() {
  const userId = useUserStore(s => s.userId);
  return useQuery({
    queryKey: SRS_QUERY_KEY,
    queryFn: () => getSRSCardsForUser(userId ?? ''),
    enabled: !!userId,
  });
}

export function useDueCards() {
  const userId = useUserStore(s => s.userId);
  return useQuery({
    queryKey: [...SRS_QUERY_KEY, 'due'],
    queryFn: () => getDueCardsLocal(userId ?? ''),
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function useUpdateSRSCard() {
  const queryClient = useQueryClient();
  const userId = useUserStore(s => s.userId);

  return useMutation({
    mutationFn: async (params: {
      itemType: string;
      itemId: string;
      update: any;
    }) => {
      if (!userId) throw new Error('Not authenticated');
      await upsertSRSCard({
        id: `${userId}-${params.itemType}-${params.itemId}`,
        user_id: userId,
        item_type: params.itemType,
        item_id: params.itemId,
        ...params.update,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
      // Fire-and-forget sync vers Cloud
      runSync().catch(console.warn);
    },
  });
}

export function useCreateSRSCardsForLesson() {
  const queryClient = useQueryClient();
  const userId = useUserStore(s => s.userId);

  return useMutation({
    mutationFn: async (params: { itemIds: string[]; itemType?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const type = params.itemType ?? 'letter';
      for (const itemId of params.itemIds) {
        const card = createNewCard(userId, type as any, itemId);
        await upsertSRSCard({
          id: `${userId}-${type}-${itemId}`,
          ...card,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SRS_QUERY_KEY });
      runSync().catch(console.warn);
    },
  });
}
```

### 8.4 — Refactorer `src/hooks/useProgress.ts`

```typescript
// src/hooks/useProgress.ts — REFACTORÉ

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProgressForUser, upsertProgress } from '../db/local-queries';
import { useUserStore } from '../stores/useUserStore';
import { runSync } from '../engines/sync-manager';
import { randomUUID } from 'expo-crypto';

const PROGRESS_QUERY_KEY = ['user_progress'];

export function useProgress() {
  const userId = useUserStore(s => s.userId);
  return useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: () => getProgressForUser(userId ?? ''),
    enabled: !!userId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  const userId = useUserStore(s => s.userId);

  return useMutation({
    mutationFn: async (params: {
      lessonId: string;
      score: number;
      timeSpentSeconds: number;
      nextLessonId?: string;
    }) => {
      if (!userId) throw new Error('Not authenticated');

      // Marquer la leçon comme complétée (local)
      await upsertProgress({
        id: randomUUID(),
        user_id: userId,
        lesson_id: params.lessonId,
        status: 'completed',
        score: params.score,
        completed_at: new Date().toISOString(),
        attempts: 1,
        time_spent_seconds: params.timeSpentSeconds,
      });

      // Déverrouiller la leçon suivante (local)
      if (params.nextLessonId) {
        await upsertProgress({
          id: randomUUID(),
          user_id: userId,
          lesson_id: params.nextLessonId,
          status: 'available',
          score: 0,
          completed_at: null,
          attempts: 0,
          time_spent_seconds: 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
      // Fire-and-forget sync
      runSync().catch(console.warn);
    },
  });
}
```

### 8.5 — Refactorer `src/stores/useSettingsStore.ts`

Le store Zustand des settings doit lui aussi lire/écrire en SQLite local au lieu de Supabase :

```typescript
// Modifier loadSettings() pour lire depuis SQLite :
loadSettings: async () => {
  const settings = await getSettings(userId);
  if (settings) {
    set({
      ...settings,
      audio_autoplay: !!settings.audio_autoplay,
      haptic_feedback: !!settings.haptic_feedback,
      isLoaded: true,
    });
  } else {
    set({ ...DEFAULT_SETTINGS, isLoaded: true });
  }
},

// Modifier updateSetting() pour écrire en SQLite :
updateSetting: async (key, value) => {
  set({ [key]: value });
  const allSettings = get();
  await upsertSettings(userId, allSettings);
  // Fire-and-forget sync
  runSync().catch(console.warn);
},
```

### 8.6 — Modules hook (s'il existe, sinon le créer)

```typescript
// src/hooks/useModules.ts

import { useQuery } from '@tanstack/react-query';
import { getAllModules } from '../db/local-queries';

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: getAllModules,
    staleTime: Infinity,
  });
}
```

**Important** : Cherche dans tout le projet les imports de `../db/remote` ou `supabase` dans les hooks de données. S'il reste des appels directs à Supabase pour lire du contenu ou de la progression, refactore-les.

```bash
# Vérification exhaustive :
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ src/engines/ --include="*.ts" --include="*.tsx"
```

Les SEULS fichiers qui devraient encore importer `src/db/remote` sont :
- `src/engines/content-sync.ts` (pour PULL content)
- `src/engines/sync-manager.ts` (pour PUSH user data)

Tout le reste lit depuis SQLite via `src/db/local-queries.ts`.

**Checkpoint :**
- [ ] `useLetters` lit depuis SQLite (plus d'import de `supabase`)
- [ ] `useLessons` lit depuis SQLite
- [ ] `useSRSCards` et `useDueCards` lisent depuis SQLite
- [ ] `useProgress` lit et écrit dans SQLite
- [ ] `useSettingsStore` lit et écrit dans SQLite
- [ ] Après écriture locale, un `runSync()` est déclenché en fire-and-forget
- [ ] `grep -rn "from.*db/remote" src/hooks/ src/stores/` ne retourne AUCUN résultat
- [ ] Seuls `content-sync.ts` et `sync-manager.ts` importent `db/remote`

---

## MISSION 9 — Pull initial : récupérer la progression existante depuis le Cloud

**Action :**
Si l'utilisateur avait déjà une progression en Cloud (avant cette migration), il faut la rapatrier dans SQLite au premier lancement.

Ajoute une fonction dans `content-sync.ts` ou crée `src/engines/user-data-pull.ts` :

```typescript
// src/engines/user-data-pull.ts

import { supabase } from '../db/remote';
import { upsertProgress, upsertSRSCard, upsertSettings, getSyncMetadata, updateSyncMetadata } from '../db/local-queries';
import { randomUUID } from 'expo-crypto';

/**
 * Récupère la progression utilisateur depuis Supabase Cloud → SQLite.
 * Appelé UNE FOIS au premier lancement ou quand l'utilisateur se connecte.
 */
export async function pullUserDataFromCloud(userId: string): Promise<void> {
  // Vérifier si déjà fait
  const meta = await getSyncMetadata('user_data_initial_pull');
  if (meta) return; // Déjà pull

  // --- Progress ---
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (progressData) {
    for (const p of progressData) {
      await upsertProgress({
        id: p.id ?? randomUUID(),
        user_id: p.user_id,
        lesson_id: p.lesson_id,
        status: p.status,
        score: p.score,
        completed_at: p.completed_at,
        attempts: p.attempts,
        time_spent_seconds: p.time_spent_seconds,
      });
    }
  }

  // --- SRS Cards ---
  const { data: srsData } = await supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', userId);

  if (srsData) {
    for (const c of srsData) {
      await upsertSRSCard({
        id: c.id ?? `${userId}-${c.item_type}-${c.item_id}`,
        user_id: c.user_id,
        item_type: c.item_type,
        item_id: c.item_id,
        ease_factor: c.ease_factor,
        interval_days: c.interval_days,
        repetitions: c.repetitions,
        next_review_at: c.next_review_at,
        last_review_at: c.last_review_at,
        last_quality: c.last_quality,
      });
    }
  }

  // --- Settings ---
  const { data: settingsData } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (settingsData) {
    await upsertSettings(userId, settingsData);
  }

  // Marquer le pull initial comme fait
  await updateSyncMetadata('user_data_initial_pull', 1);
}
```

Intègre l'appel dans la séquence de démarrage (`app/_layout.tsx`), APRÈS l'auth et le content sync :

```typescript
// Après le content sync et quand l'utilisateur est authentifié :
if (user) {
  await pullUserDataFromCloud(user.id);
}
```

**Checkpoint :**
- [ ] `pullUserDataFromCloud` récupère progress + SRS + settings depuis le Cloud
- [ ] Le pull ne se fait QU'UNE FOIS (vérifié par `sync_metadata`)
- [ ] Après le pull, la progression locale reflète la progression Cloud
- [ ] Si l'utilisateur n'avait pas de données Cloud, le pull ne fait rien (pas d'erreur)

---

## MISSION 10 — Vérification end-to-end

**Action :**

```bash
npx expo start
```

### Scénario 1 : Premier lancement (base vierge)

1. Supprimer l'app du simulateur/device (pour une base SQLite fraîche)
2. Lancer l'app
3. **Attendu** : écran de chargement "Préparation du contenu...", puis l'app se lance
4. Vérifier dans les logs : `[SyncManager]` messages de sync
5. Aller sur l'onglet Apprendre → les 4 modules s'affichent (depuis SQLite)
6. Ouvrir une leçon du Module 1 → les lettres s'affichent (depuis SQLite)
7. Compléter la leçon → la progression est enregistrée
8. Vérifier dans Supabase Cloud (Dashboard) que la progression est arrivée

### Scénario 2 : Mode avion

1. Activer le mode avion sur le device/simulateur
2. Ouvrir l'app → elle se lance normalement (depuis SQLite)
3. Ouvrir une leçon → les lettres s'affichent
4. Compléter la leçon → la progression est enregistrée localement
5. Désactiver le mode avion
6. **Attendu** : le sync-manager pousse automatiquement la progression vers le Cloud
7. Vérifier dans Supabase Cloud Dashboard

### Scénario 3 : Données existantes

1. S'assurer qu'il y a de la progression en Cloud (d'avant la migration)
2. Supprimer et réinstaller l'app
3. Se connecter
4. **Attendu** : la progression est rapatriée depuis le Cloud → visible dans l'app

### Points de vigilance :

- Aucun import de `src/db/remote` dans les hooks/stores (seulement dans sync-manager et content-sync)
- Pas de crash en mode avion
- Pas de crash si la base SQLite est vide (premier lancement)
- Les settings sont persistés localement ET synchronisés vers Cloud
- Les cartes SRS fonctionnent en offline
- Le `ContentDownloadScreen` s'affiche au premier lancement
- Aucune régression fonctionnelle (onboarding, leçons, exercices, révision, profil)

```bash
# Vérification finale : aucun hook ne parle à Supabase directement
grep -rn "from.*db/remote\|from.*supabase" src/hooks/ src/stores/ --include="*.ts" --include="*.tsx"
# Résultat attendu : AUCUNE LIGNE
```

**Checkpoint final :**
- [ ] Aucun dossier `supabase/` ni fichier Docker dans le projet
- [ ] `.env` pointe vers Supabase Cloud uniquement
- [ ] SQLite est initialisé au démarrage avec le bon schéma
- [ ] Le contenu (lettres, diacritiques, modules, leçons) est sync depuis Cloud → SQLite
- [ ] Toutes les lectures passent par SQLite (JAMAIS de requête Cloud dans les hooks)
- [ ] Toutes les écritures passent par SQLite avec sync fire-and-forget vers Cloud
- [ ] Le sync-manager pousse automatiquement au retour de connectivité
- [ ] L'app fonctionne en mode avion (contenu déjà téléchargé)
- [ ] La progression existante est rapatriée au premier lancement
- [ ] Aucun crash, aucun warning critique
- [ ] Aucune régression fonctionnelle

---

## RÉSUMÉ DE L'ÉTAPE 4.5

| Mission | Livrable | Statut |
|---------|----------|--------|
| 1 | Nettoyage Docker/Supabase local + config Cloud | ⬜ |
| 2 | Installation et config expo-sqlite | ⬜ |
| 3 | Schéma SQLite local (7 tables + index + sync_metadata) | ⬜ |
| 4 | Couche d'accès données (`local-queries.ts`) — CRUD complet | ⬜ |
| 5 | Content Sync (Cloud → SQLite) | ⬜ |
| 6 | Progress Sync (SQLite → Cloud) + sync-manager + NetInfo | ⬜ |
| 7 | Initialisation au démarrage (openDB → schema → sync → app) | ⬜ |
| 8 | Refactoring TOUS les hooks (SQLite-first) | ⬜ |
| 9 | Pull initial progression Cloud → SQLite | ⬜ |
| 10 | Vérification end-to-end (online + offline + migration) | ⬜ |

> **Après validation de l'É4.5 :** Reprendre l'Étape 5 (Module Harakats) qui utilisera nativement l'architecture offline-first.
