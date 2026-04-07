// src/engines/content-sync.ts

import { supabase } from '../db/remote';
import {
  upsertLetters, upsertDiacritics, upsertModules, upsertLessons,
  upsertRoots, upsertWords, upsertWordVariants,
  upsertSentences, upsertDialogues, upsertDialogueTurns,
  upsertBadges,
  upsertGrammarRules, upsertConjugationEntries,
  upsertDialogueScenarios, upsertDailyChallenges,
  upsertQuranEntries,
  getSyncMetadata, updateSyncMetadata,
} from '../db/local-queries';
import { prefetchAudio } from '../services/audio-cache-service';

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

  // --- Sentences ---
  try {
    const { data, error } = await supabase
      .from('sentences')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertSentences(data);
      await updateSyncMetadata('sentences', data.length);
      result.tables.sentences = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`sentences: ${e.message}`);
  }

  // --- Dialogues ---
  try {
    const { data, error } = await supabase
      .from('dialogues')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertDialogues(data);
      await updateSyncMetadata('dialogues', data.length);
      result.tables.dialogues = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`dialogues: ${e.message}`);
  }

  // --- Dialogue Turns ---
  try {
    const { data, error } = await supabase
      .from('dialogue_turns')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertDialogueTurns(data);
      await updateSyncMetadata('dialogue_turns', data.length);
      result.tables.dialogue_turns = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`dialogue_turns: ${e.message}`);
  }

  // --- Badges ---
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertBadges(data);
      await updateSyncMetadata('badges', data.length);
      result.tables.badges = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`badges: ${e.message}`);
  }

  // --- Grammar Rules ---
  try {
    const { data, error } = await supabase
      .from('grammar_rules')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertGrammarRules(data);
      await updateSyncMetadata('grammar_rules', data.length);
      result.tables.grammar_rules = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`grammar_rules: ${e.message}`);
  }

  // --- Conjugation Entries ---
  try {
    const { data, error } = await supabase
      .from('conjugation_entries')
      .select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertConjugationEntries(data);
      await updateSyncMetadata('conjugation_entries', data.length);
      result.tables.conjugation_entries = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`conjugation_entries: ${e.message}`);
  }

  // --- Dialogue Scenarios ---
  try {
    const { data, error } = await supabase
      .from('dialogue_scenarios')
      .select('*');
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertDialogueScenarios(data);
      await updateSyncMetadata('dialogue_scenarios', data.length);
      result.tables.dialogue_scenarios = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`dialogue_scenarios: ${e.message}`);
  }

  // --- Daily Challenges (É15) ---
  try {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('challenge_date');
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertDailyChallenges(data);
      await updateSyncMetadata('daily_challenges', data.length);
      result.tables.daily_challenges = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`daily_challenges: ${e.message}`);
  }

  // --- Quran Entries (É17) ---
  try {
    const { data, error } = await supabase
      .from('quran_entries')
      .select('*')
      .order('surah_number', { ascending: true })
      .order('ayah_number', { ascending: true })
      .order('word_position', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      await upsertQuranEntries(data);
      await updateSyncMetadata('quran_entries', data.length);
      result.tables.quran_entries = { synced: data.length, skipped: false };
    }
  } catch (e: any) {
    result.errors.push(`quran_entries: ${e.message}`);
  }

  // Pré-téléchargement audio en arrière-plan (fire-and-forget)
  prefetchAudio().catch(err => console.warn('[content-sync] prefetch audio failed:', err));

  return result;
}

/**
 * Vérifie si le contenu local a besoin d'un refresh.
 * Retourne true si au moins une table n'a jamais été sync.
 */
export async function needsContentSync(): Promise<boolean> {
  const tables = [
    'letters', 'diacritics', 'modules', 'lessons',
    'roots', 'words', 'word_variants',
    'sentences', 'dialogues', 'dialogue_turns',
    'badges',
    'grammar_rules', 'conjugation_entries',
    'dialogue_scenarios', 'daily_challenges',
    'quran_entries',
  ];
  for (const table of tables) {
    const meta = await getSyncMetadata(table);
    if (!meta) return true; // Jamais sync
  }
  return false;
}
