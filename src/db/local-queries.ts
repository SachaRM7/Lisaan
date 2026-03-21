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
    `INSERT OR REPLACE INTO srs_cards (id, user_id, item_type, item_id, ease_factor, interval_days,
      repetitions, next_review_at, last_review_at, last_quality, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [card.id, card.user_id, card.item_type, card.item_id,
     card.ease_factor, card.interval_days, card.repetitions,
     card.next_review_at, card.last_review_at, card.last_quality, now]
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
