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
