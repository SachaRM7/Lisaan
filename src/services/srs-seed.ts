// src/services/srs-seed.ts
// Génère les cartes SRS pour conjugaisons et règles de grammaire depuis SQLite.
// Idempotent : INSERT OR IGNORE sur la contrainte UNIQUE(user_id, item_type, item_id).

import { getLocalDB } from '../db/local';

export async function seedConjugationSRSCards(userId: string): Promise<number> {
  const db = getLocalDB();
  const now = new Date().toISOString();

  // Entrées de conjugaison sans carte SRS pour cet utilisateur
  const conjugations = await db.getAllAsync<{
    id: string;
    conjugated_ar_vocalized: string;
    conjugated_transliteration: string;
    pronoun_fr: string;
    tense: string;
  }>(
    `SELECT ce.id, ce.conjugated_ar_vocalized, ce.conjugated_transliteration,
            ce.pronoun_fr, ce.tense
     FROM conjugation_entries ce
     LEFT JOIN srs_cards sc
       ON sc.item_id = ce.id AND sc.item_type = 'conjugation' AND sc.user_id = ?
     WHERE sc.id IS NULL`,
    [userId],
  );

  let inserted = 0;
  for (const entry of conjugations) {
    await db.runAsync(
      `INSERT OR IGNORE INTO srs_cards
         (id, user_id, item_type, item_id,
          ease_factor, interval_days, repetitions,
          next_review_at, last_review_at, last_quality,
          updated_at, synced_at)
       VALUES (?, ?, 'conjugation', ?, 2.5, 0, 0, ?, NULL, 0, ?, NULL)`,
      [`${userId}-conjugation-${entry.id}`, userId, entry.id, now, now],
    );
    inserted++;
  }
  return inserted;
}

export async function seedGrammarSRSCards(userId: string): Promise<number> {
  const db = getLocalDB();
  const now = new Date().toISOString();

  // Règles de grammaire sans carte SRS pour cet utilisateur
  const rules = await db.getAllAsync<{
    id: string;
    title_fr: string;
    example_ar_vocalized: string;
    concept_fr: string;
  }>(
    `SELECT gr.id, gr.title_fr, gr.example_ar_vocalized, gr.concept_fr
     FROM grammar_rules gr
     LEFT JOIN srs_cards sc
       ON sc.item_id = gr.id AND sc.item_type = 'grammar_rule' AND sc.user_id = ?
     WHERE sc.id IS NULL`,
    [userId],
  );

  let inserted = 0;
  for (const rule of rules) {
    await db.runAsync(
      `INSERT OR IGNORE INTO srs_cards
         (id, user_id, item_type, item_id,
          ease_factor, interval_days, repetitions,
          next_review_at, last_review_at, last_quality,
          updated_at, synced_at)
       VALUES (?, ?, 'grammar_rule', ?, 2.5, 0, 0, ?, NULL, 0, ?, NULL)`,
      [`${userId}-grammar_rule-${rule.id}`, userId, rule.id, now, now],
    );
    inserted++;
  }
  return inserted;
}

export async function seedQuranSRSCards(userId: string): Promise<number> {
  const db = getLocalDB();
  const now = new Date().toISOString();

  const words = await db.getAllAsync<{
    id: string;
    arabic_vocalized: string;
    translation_fr: string;
    surah_name_fr: string;
    ayah_number: number;
  }>(
    `SELECT qe.id, qe.arabic_vocalized, qe.translation_fr, qe.surah_name_fr, qe.ayah_number
     FROM quran_entries qe
     LEFT JOIN srs_cards sc
       ON sc.item_id = qe.id AND sc.item_type = 'quran_word' AND sc.user_id = ?
     WHERE sc.id IS NULL`,
    [userId],
  );

  let inserted = 0;
  for (const word of words) {
    await db.runAsync(
      `INSERT OR IGNORE INTO srs_cards
         (id, user_id, item_type, item_id,
          ease_factor, interval_days, repetitions,
          next_review_at, last_review_at, last_quality,
          updated_at, synced_at)
       VALUES (?, ?, 'quran_word', ?, 2.5, 0, 0, ?, NULL, 0, ?, NULL)`,
      [`${userId}-quran_word-${word.id}`, userId, word.id, now, now],
    );
    inserted++;
  }
  return inserted;
}
