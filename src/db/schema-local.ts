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
