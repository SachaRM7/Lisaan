// src/engines/guest-migration.ts
// Migration seamless Guest → Auth : toutes les données SQLite migrent vers le nouveau userId

import { getLocalDB } from '../db/local';
import { useAuthStore } from '../stores/useAuthStore';
import { runSync } from './sync-manager';

/**
 * Migre toutes les données d'un guest vers un compte auth créé ou récupéré.
 *
 * Appelé juste AVANT de mettre à jour le store (setAuthUser) pour que
 * la migration SQLite s'exécute encore avec l'ancien guestId.
 *
 * Étapes :
 * 1. UPDATE user_progress SET user_id = newUserId WHERE user_id = guestId
 * 2. UPDATE srs_cards SET user_id = newUserId WHERE user_id = guestId
 * 3. UPDATE user_settings SET user_id = newUserId WHERE user_id = guestId
 * 4. runSync() pour pousser tout vers Cloud (synced_at = NULL)
 */
export async function migrateGuestToAuth(newUserId: string): Promise<void> {
  const db = getLocalDB();
  const oldGuestId = useAuthStore.getState().guestId;

  if (!oldGuestId) {
    throw new Error('[GuestMigration] No guest ID found — cannot migrate');
  }

  // Transaction atomique
  await db.withTransactionAsync(async () => {
    // 1. Migrer user_progress
    await db.runAsync(
      'UPDATE user_progress SET user_id = ?, synced_at = NULL WHERE user_id = ?',
      [newUserId, oldGuestId],
    );

    // 2. Migrer srs_cards
    await db.runAsync(
      'UPDATE srs_cards SET user_id = ?, synced_at = NULL WHERE user_id = ?',
      [newUserId, oldGuestId],
    );

    // 3. Migrer user_settings
    await db.runAsync(
      'UPDATE user_settings SET user_id = ?, synced_at = NULL WHERE user_id = ?',
      [newUserId, oldGuestId],
    );
  });

  // 4. Sync complet — toutes les lignes ont synced_at = NULL
  await runSync();

  console.log(`[GuestMigration] Migrated ${oldGuestId} → ${newUserId}`);
}
