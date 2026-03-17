import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the local SQLite database.
 * All content packs and user progress are stored here for offline-first operation.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('lisaan.db');
  await initializeSchema(db);
  return db;
}

/**
 * Initialize local schema.
 * These tables mirror the server schema for offline content + user data.
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Content cache
    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      ipa TEXT NOT NULL,
      form_isolated TEXT NOT NULL,
      form_initial TEXT NOT NULL,
      form_medial TEXT NOT NULL,
      form_final TEXT NOT NULL,
      connects_left INTEGER NOT NULL DEFAULT 1,
      connects_right INTEGER NOT NULL DEFAULT 1,
      is_sun_letter INTEGER NOT NULL DEFAULT 0,
      articulation_group TEXT NOT NULL,
      articulation_fr TEXT NOT NULL,
      pedagogy_notes TEXT,
      audio_url TEXT
    );

    CREATE TABLE IF NOT EXISTS diacritics (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      symbol TEXT NOT NULL,
      sound_effect TEXT NOT NULL,
      category TEXT NOT NULL,
      position TEXT NOT NULL,
      audio_url TEXT
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title_fr TEXT NOT NULL,
      title_ar TEXT,
      description_fr TEXT,
      sort_order INTEGER NOT NULL,
      variant TEXT NOT NULL DEFAULT 'msa'
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
      prerequisite_ids TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      difficulty INTEGER NOT NULL DEFAULT 1,
      tags TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS roots (
      id TEXT PRIMARY KEY,
      consonants TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      core_meaning_fr TEXT NOT NULL,
      core_meaning_ar TEXT,
      frequency_rank INTEGER
    );

    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      root_id TEXT,
      arabic TEXT NOT NULL,
      arabic_vocalized TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      ipa TEXT,
      pattern TEXT,
      pos TEXT NOT NULL,
      frequency_rank INTEGER,
      audio_url TEXT,
      gender TEXT NOT NULL DEFAULT 'na'
    );

    -- User progress (offline-first)
    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      score INTEGER DEFAULT 0,
      completed_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, lesson_id)
    );

    -- SRS cards (offline-first)
    CREATE TABLE IF NOT EXISTS srs_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days REAL NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_review_at TEXT,
      last_quality INTEGER,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, item_type, item_id)
    );

    -- Content pack versions
    CREATE TABLE IF NOT EXISTS content_packs (
      pack_id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      downloaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Sync queue for offline changes
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
