// src/db/local-queries.ts

import { getLocalDB } from './local';
import * as ExpoCrypto from 'expo-crypto';
import type { LessonSessionState, SectionProgress } from '../types/section';

const randomUUID = () => ExpoCrypto.randomUUID();

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

export async function getFirstLessonOfNextModule(currentModuleId: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    `SELECT l.* FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE m.sort_order = (
       SELECT sort_order + 1 FROM modules WHERE id = ?
     )
     ORDER BY l.sort_order ASC
     LIMIT 1`,
    [currentModuleId]
  );
}

export async function getLessonWithModule(lessonId: string) {
  const db = getLocalDB();
  return db.getFirstAsync<any>(
    `SELECT l.*, m.sort_order as module_sort_order, l.content_refs
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
    // content_refs arrive comme TEXT[] de Supabase → stocker en JSON
    const contentRefs = Array.isArray(l.content_refs)
      ? JSON.stringify(l.content_refs)
      : (l.content_refs ?? '[]');
    await db.runAsync(
      `INSERT OR REPLACE INTO lessons (
        id, module_id, title_fr, title_ar, description_fr,
        sort_order, xp_reward, estimated_minutes, content_refs, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, l.module_id, l.title_fr, l.title_ar, l.description_fr,
       l.sort_order, l.xp_reward, l.estimated_minutes, contentRefs, now]
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

export async function getLessonProgress(
  lessonId: string,
  userId: string,
): Promise<{ status: string; score: number } | null> {
  const db = getLocalDB();
  const row = await db.getFirstAsync<{ status: string; score: number }>(
    'SELECT status, score FROM user_progress WHERE lesson_id = ? AND user_id = ?',
    [lessonId, userId]
  );
  return row ?? null;
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
      exercise_direction, audio_enabled, audio_autoplay, audio_speed, font_size, haptic_feedback,
      analytics_enabled, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(user_id) DO UPDATE SET
       harakats_mode = excluded.harakats_mode,
       transliteration_mode = excluded.transliteration_mode,
       translation_mode = excluded.translation_mode,
       exercise_direction = excluded.exercise_direction,
       audio_enabled = excluded.audio_enabled,
       audio_autoplay = excluded.audio_autoplay,
       audio_speed = excluded.audio_speed,
       font_size = excluded.font_size,
       haptic_feedback = excluded.haptic_feedback,
       analytics_enabled = excluded.analytics_enabled,
       updated_at = ?,
       synced_at = NULL`,
    [userId, settings.harakats_mode, settings.transliteration_mode, settings.translation_mode,
     settings.exercise_direction, settings.audio_enabled ? 1 : 0, settings.audio_autoplay ? 1 : 0,
     settings.audio_speed, settings.font_size, settings.haptic_feedback ? 1 : 0,
     settings.analytics_enabled !== false ? 1 : 0, now, now]
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

export async function getWordsByTheme(theme: string) {
  const db = getLocalDB();
  return db.getAllAsync<any>(
    'SELECT * FROM words WHERE theme = ? ORDER BY sort_order ASC',
    [theme]
  );
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
        gender, is_simple_word, pedagogy_notes, theme, sort_order, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.id, w.root_id, w.arabic, w.arabic_vocalized, w.transliteration, w.ipa,
       w.translation_fr, w.pattern, w.pos, w.frequency_rank, w.audio_url,
       w.gender, w.is_simple_word ? 1 : 0, w.pedagogy_notes, w.theme ?? null, w.sort_order ?? 0, now]
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

export async function getSentenceById(id: string) {
  const db = getLocalDB();
  const row = await db.getFirstAsync<any>('SELECT * FROM sentences WHERE id = ?', [id]);
  if (!row) return null;
  return { ...row, word_ids: JSON.parse(row.word_ids ?? '[]') };
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

// --- Sync Metadata ---

// ============================================================
// PROGRESSION — helpers gamification (É9)
// ============================================================

export async function getCompletedLessonsCount(userId: string): Promise<number> {
  const db = getLocalDB();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  return result?.count ?? 0;
}

export async function checkIfModuleComplete(moduleId: string, userId: string): Promise<boolean> {
  const db = getLocalDB();
  const result = await db.getFirstAsync<{ total: number; completed: number }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM lessons l
     LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ?
     WHERE l.module_id = ?`,
    [userId, moduleId]
  );
  return !!result && result.total > 0 && result.total === result.completed;
}

export async function getModuleStats(moduleId: string, userId: string) {
  const db = getLocalDB();
  const module = await db.getFirstAsync<{ title_fr: string; title_ar: string | null; icon: string; sort_order: number }>(
    `SELECT title_fr, title_ar, icon, sort_order FROM modules WHERE id = ?`,
    [moduleId]
  );
  const stats = await db.getFirstAsync<{ total_xp: number; lessons_count: number; total_seconds: number }>(
    `SELECT
      COALESCE(SUM(up.score), 0) as total_xp,
      COUNT(*) as lessons_count,
      COALESCE(SUM(up.time_spent_seconds), 0) as total_seconds
     FROM user_progress up
     JOIN lessons l ON l.id = up.lesson_id
     WHERE l.module_id = ? AND up.user_id = ? AND up.status = 'completed'`,
    [moduleId, userId]
  );
  return {
    title_fr: module?.title_fr ?? 'Module',
    title_ar: module?.title_ar ?? null,
    icon: module?.icon ?? '📚',
    sort_order: module?.sort_order ?? 1,
    total_xp: stats?.total_xp ?? 0,
    lessons_count: stats?.lessons_count ?? 0,
    total_seconds: stats?.total_seconds ?? 0,
  };
}

// ============================================================
// BADGES (É9)
// ============================================================

export async function upsertBadges(badges: any[]): Promise<void> {
  const db = getLocalDB();
  for (const b of badges) {
    await db.runAsync(
      `INSERT OR REPLACE INTO badges
       (id, title_fr, description_fr, icon, category, condition_type, condition_value,
        condition_target, xp_reward, sort_order, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.id, b.title_fr, b.description_fr, b.icon,
        b.category, b.condition_type, b.condition_value,
        b.condition_target ?? null, b.xp_reward, b.sort_order,
        new Date().toISOString(),
      ]
    );
  }
}

export async function getUnsyncedUserBadges(): Promise<any[]> {
  const db = getLocalDB();
  return db.getAllAsync(`SELECT * FROM user_badges WHERE synced_at IS NULL`);
}

export async function markUserBadgesSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getLocalDB();
  const now = new Date().toISOString();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE user_badges SET synced_at = ? WHERE id IN (${placeholders})`,
    [now, ...ids]
  );
}

// ============================================================
// Lesson Session (É10.7) — État transitoire des leçons en cours
// ============================================================

/**
 * Récupère la session en cours pour une leçon donnée.
 * Retourne null si aucune session n'existe (leçon pas commencée ou déjà complétée).
 */
export async function getLessonSession(
  lessonId: string,
  userId: string
): Promise<LessonSessionState | null> {
  const db = getLocalDB();
  const row = await db.getFirstAsync<{
    lesson_id: string;
    user_id: string;
    current_section_index: number;
    section_progress: string;
    updated_at: string;
  }>(
    'SELECT * FROM lesson_session WHERE lesson_id = ? AND user_id = ?',
    [lessonId, userId]
  );
  if (!row) return null;
  return {
    lessonId: row.lesson_id,
    userId: row.user_id,
    currentSectionIndex: row.current_section_index,
    sectionProgress: JSON.parse(row.section_progress) as SectionProgress[],
    updatedAt: row.updated_at,
  };
}

/**
 * Crée ou met à jour la session d'une leçon.
 * Appelé à chaque changement d'état (avancer dans les teachings, répondre à un exercice, changer de section).
 */
export async function upsertLessonSession(state: LessonSessionState): Promise<void> {
  const db = getLocalDB();
  const id = `session-${state.lessonId}-${state.userId}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO lesson_session
     (id, lesson_id, user_id, current_section_index, section_progress, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      state.lessonId,
      state.userId,
      state.currentSectionIndex,
      JSON.stringify(state.sectionProgress),
      now,
    ]
  );
}

/**
 * Supprime la session d'une leçon.
 * Appelé quand la leçon est complétée (toutes les sections terminées).
 */
export async function deleteLessonSession(lessonId: string, userId: string): Promise<void> {
  const db = getLocalDB();
  await db.runAsync(
    'DELETE FROM lesson_session WHERE lesson_id = ? AND user_id = ?',
    [lessonId, userId]
  );
}

// ============================================================
// GRAMMAIRE & CONJUGAISON (É11)
// ============================================================

export async function getGrammarRulesByModule(moduleId: string): Promise<any[]> {
  const db = getLocalDB();
  return db.getAllAsync(
    'SELECT * FROM grammar_rules WHERE module_id = ? ORDER BY sort_order ASC',
    [moduleId]
  );
}

export async function upsertGrammarRules(rules: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const r of rules) {
    await db.runAsync(
      `INSERT OR REPLACE INTO grammar_rules
         (id, module_id, sort_order, title_fr, title_ar, concept_fr, formula,
          example_ar, example_ar_vocalized, example_transliteration, example_translation_fr,
          example_audio_url, pedagogy_notes, difficulty, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.module_id, r.sort_order, r.title_fr, r.title_ar ?? null,
       r.concept_fr, r.formula ?? null, r.example_ar, r.example_ar_vocalized,
       r.example_transliteration, r.example_translation_fr,
       r.example_audio_url ?? null, r.pedagogy_notes ?? null, r.difficulty, now]
    );
  }
}

export async function getConjugationsByWords(wordIds: string[], tense: string): Promise<any[]> {
  if (wordIds.length === 0) return [];
  const db = getLocalDB();
  const placeholders = wordIds.map(() => '?').join(',');
  return db.getAllAsync(
    `SELECT * FROM conjugation_entries WHERE word_id IN (${placeholders}) AND tense = ? ORDER BY word_id, pronoun_code ASC`,
    [...wordIds, tense]
  );
}

export async function getConjugationsByWord(wordId: string, tense: string): Promise<any[]> {
  const db = getLocalDB();
  return db.getAllAsync(
    'SELECT * FROM conjugation_entries WHERE word_id = ? AND tense = ? ORDER BY pronoun_code ASC',
    [wordId, tense]
  );
}

export async function upsertConjugationEntries(entries: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const e of entries) {
    await db.runAsync(
      `INSERT OR REPLACE INTO conjugation_entries
         (id, word_id, tense, form, pronoun_code, pronoun_ar, pronoun_fr,
          conjugated_ar, conjugated_ar_vocalized, conjugated_transliteration, audio_url,
          example_sentence_ar, example_sentence_ar_vocalized,
          example_sentence_translation_fr, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.word_id, e.tense, e.form, e.pronoun_code, e.pronoun_ar, e.pronoun_fr,
       e.conjugated_ar, e.conjugated_ar_vocalized, e.conjugated_transliteration,
       e.audio_url ?? null, e.example_sentence_ar ?? null,
       e.example_sentence_ar_vocalized ?? null,
       e.example_sentence_translation_fr ?? null, now]
    );
  }
}

export async function upsertDialogueScenarios(scenarios: any[]): Promise<void> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  for (const s of scenarios) {
    await db.runAsync(
      `INSERT OR REPLACE INTO dialogue_scenarios
         (id, lesson_id, title_fr, title_ar, context_fr,
          setting_ar, setting_transliteration, difficulty,
          turns, vocabulary_ids, grammar_rule_ids, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, s.lesson_id, s.title_fr, s.title_ar, s.context_fr,
        s.setting_ar, s.setting_transliteration, s.difficulty ?? 3,
        JSON.stringify(s.turns ?? []),
        JSON.stringify(s.vocabulary_ids ?? []),
        JSON.stringify(s.grammar_rule_ids ?? []),
        now,
      ]
    );
  }
}

export async function getDialogueScenariosByLesson(lessonId: string): Promise<any[]> {
  const db = getLocalDB();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM dialogue_scenarios WHERE lesson_id = ?',
    [lessonId]
  );
  return rows.map(r => ({
    ...r,
    turns: JSON.parse(r.turns ?? '[]'),
    vocabulary_ids: JSON.parse(r.vocabulary_ids ?? '[]'),
    grammar_rule_ids: JSON.parse(r.grammar_rule_ids ?? '[]'),
  }));
}

// ============================================================
// DEV UTILITIES (jamais appelé en production)
// ============================================================

export async function devCompleteAllLessons(userId: string): Promise<number> {
  const db = getLocalDB();
  const now = new Date().toISOString();
  const lessons = await db.getAllAsync<{ id: string }>('SELECT id FROM lessons');
  for (const lesson of lessons) {
    await db.runAsync(
      `INSERT INTO user_progress (id, user_id, lesson_id, status, score, completed_at, attempts, time_spent_seconds, updated_at, synced_at)
       VALUES (?, ?, ?, 'completed', 100, ?, 1, 60, ?, NULL)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         status = 'completed', score = 100, completed_at = ?, updated_at = ?, synced_at = NULL`,
      [randomUUID(), userId, lesson.id, now, now, now, now]
    );
  }
  return lessons.length;
}

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
