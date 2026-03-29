// src/engines/user-data-pull.ts

import { supabase } from '../db/remote';
import * as ExpoCrypto from 'expo-crypto';
import {
  upsertProgress, upsertSRSCard, upsertSettings,
  getSyncMetadata, updateSyncMetadata,
} from '../db/local-queries';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Récupère la progression utilisateur depuis Supabase Cloud → SQLite.
 * Appelé UNE FOIS au premier lancement ou quand l'utilisateur se connecte.
 * Ne fait rien en Guest mode (pas de données cloud).
 */
export async function pullUserDataFromCloud(userId: string): Promise<void> {
  // Guest mode — pas de données cloud
  if (useAuthStore.getState().isGuest) {
    console.log('[UserDataPull] Guest mode — pull skipped');
    return;
  }

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
        id: p.id ?? ExpoCrypto.randomUUID(),
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
