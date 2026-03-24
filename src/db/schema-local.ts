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
      audio_enabled INTEGER NOT NULL DEFAULT 1,
      audio_autoplay INTEGER NOT NULL DEFAULT 1,
      audio_speed TEXT NOT NULL DEFAULT 'slow',
      font_size TEXT NOT NULL DEFAULT 'large',
      haptic_feedback INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    -- ============================================================
    -- TABLE AUDIO CACHE (É8)
    -- ============================================================

    CREATE TABLE IF NOT EXISTS audio_cache (
      id TEXT PRIMARY KEY,           -- "{type}_{item_id}" ou SHA de l'URL
      remote_url TEXT NOT NULL,
      local_path TEXT NOT NULL,      -- chemin FileSystem.documentDirectory + 'audio/...'
      downloaded_at INTEGER NOT NULL,
      file_size INTEGER,
      UNIQUE(remote_url)
    );

    -- ============================================================
    -- TABLES GAMIFICATION — Badges (É9)
    -- ============================================================

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      title_fr TEXT NOT NULL,
      description_fr TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,       -- 'progress' | 'streak' | 'mastery' | 'speed'
      condition_type TEXT NOT NULL, -- 'lesson_count' | 'module_complete' | 'streak_days' | 'perfect_score' | 'speed_exercise'
      condition_value INTEGER NOT NULL,
      condition_target TEXT,        -- ID optionnel (ex: module_id pour 'module_complete')
      xp_reward INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,    -- ISO 8601
      seen INTEGER NOT NULL DEFAULT 0, -- 0 = pas encore affiché à l'utilisateur
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      UNIQUE(user_id, badge_id)
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
    CREATE INDEX IF NOT EXISTS idx_words_root ON words(root_id);
    CREATE INDEX IF NOT EXISTS idx_words_sort ON words(sort_order);
    CREATE INDEX IF NOT EXISTS idx_words_simple ON words(is_simple_word);
    CREATE INDEX IF NOT EXISTS idx_word_variants_word ON word_variants(word_id, variant);
    CREATE INDEX IF NOT EXISTS idx_roots_freq ON roots(frequency_rank);
    CREATE INDEX IF NOT EXISTS idx_sentences_sort ON sentences(sort_order);
    CREATE INDEX IF NOT EXISTS idx_sentences_difficulty ON sentences(difficulty);
    CREATE INDEX IF NOT EXISTS idx_dialogue_turns_dialogue ON dialogue_turns(dialogue_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_dialogues_sort ON dialogues(sort_order);
    CREATE INDEX IF NOT EXISTS idx_audio_cache_url ON audio_cache(remote_url);
    CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_badges_seen ON user_badges(user_id, seen);

  `);

  // ── Migrations additives (colonnes ajoutées après création initiale) ──
  // SQLite ne supporte pas ALTER TABLE IF NOT EXISTS → on ignore l'erreur "duplicate column"
  const migrations = [
    `ALTER TABLE user_settings ADD COLUMN audio_enabled INTEGER NOT NULL DEFAULT 1`,
  ];
  for (const sql of migrations) {
    try { await db.execAsync(sql); } catch (_) { /* colonne déjà présente */ }
  }
}
