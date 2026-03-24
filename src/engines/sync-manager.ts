// src/engines/sync-manager.ts

import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../db/remote';
import {
  getUnsyncedProgress, markProgressSynced,
  getUnsyncedSRSCards, markSRSCardsSynced,
  getUnsyncedSettings, markSettingsSynced,
  getUnsyncedUserBadges, markUserBadgesSynced,
} from '../db/local-queries';
import { syncContentFromCloud, needsContentSync } from './content-sync';

export interface SyncResult {
  pushed: { progress: number; srsCards: number; settings: number; userBadges: number };
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
    pushed: { progress: 0, srsCards: 0, settings: 0, userBadges: 0 },
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
          audio_enabled: !!s.audio_enabled,
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

  // --- PUSH : user_badges ---
  try {
    const unsyncedBadges = await getUnsyncedUserBadges();
    if (unsyncedBadges.length > 0) {
      const { error } = await supabase
        .from('user_badges')
        .upsert(
          unsyncedBadges.map(ub => ({
            id: ub.id,
            user_id: ub.user_id,
            badge_id: ub.badge_id,
            unlocked_at: ub.unlocked_at,
            seen: ub.seen === 1,
            updated_at: ub.updated_at,
          })),
          { onConflict: 'user_id,badge_id' }
        );
      if (error) throw error;
      await markUserBadgesSynced(unsyncedBadges.map(ub => ub.id));
      result.pushed.userBadges = unsyncedBadges.length;
    }
  } catch (e: any) {
    result.errors.push(`push user_badges: ${e.message}`);
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
