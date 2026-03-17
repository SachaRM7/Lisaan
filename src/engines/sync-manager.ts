/**
 * Lisaan Sync Manager
 * Handles bidirectional sync between local SQLite and Supabase.
 * Strategy: local-first writes, background sync when online.
 */

import { getDatabase } from '../db/local';
import { supabase } from '../db/remote';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  isSyncing: boolean;
}

let syncStatus: SyncStatus = {
  isOnline: false,
  lastSyncAt: null,
  pendingChanges: 0,
  isSyncing: false,
};

/**
 * Get current sync status.
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Queue a local change for sync.
 * Called after any local write to user data (progress, SRS, settings).
 */
export async function queueSync(
  tableName: string,
  recordId: string,
  operation: 'upsert' | 'delete',
  payload: Record<string, unknown>
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)`,
    [tableName, recordId, operation, JSON.stringify(payload)]
  );
  syncStatus.pendingChanges += 1;
}

/**
 * Process the sync queue — push local changes to Supabase.
 * Should be called when connectivity is restored.
 */
export async function processSyncQueue(): Promise<number> {
  if (syncStatus.isSyncing) return 0;
  syncStatus.isSyncing = true;

  const db = await getDatabase();
  let processed = 0;

  try {
    const items = await db.getAllAsync<{
      id: number;
      table_name: string;
      record_id: string;
      operation: string;
      payload: string;
    }>(`SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50`);

    for (const item of items) {
      try {
        const payload = JSON.parse(item.payload) as Record<string, unknown>;

        if (item.operation === 'upsert') {
          const { error } = await supabase
            .from(item.table_name)
            .upsert(payload);
          if (error) throw error;
        } else if (item.operation === 'delete') {
          const { error } = await supabase
            .from(item.table_name)
            .delete()
            .eq('id', item.record_id);
          if (error) throw error;
        }

        // Remove from queue on success
        await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
        processed += 1;
      } catch {
        // Leave in queue for retry
        break;
      }
    }

    syncStatus.pendingChanges = Math.max(0, syncStatus.pendingChanges - processed);
    syncStatus.lastSyncAt = new Date().toISOString();
  } finally {
    syncStatus.isSyncing = false;
  }

  return processed;
}

/**
 * Download a content pack from the server and inject into local SQLite.
 */
export async function downloadContentPack(packId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .functions.invoke('get-content-pack', {
        body: { pack_id: packId },
      });

    if (error || !data) return false;

    // Inject into local DB
    const db = await getDatabase();
    const pack = data as ContentPackPayload;

    // Insert lessons
    for (const lesson of pack.lessons ?? []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO lessons (id, module_id, title_fr, title_ar, description_fr, sort_order, xp_reward, estimated_minutes, prerequisite_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [lesson.id, lesson.module_id, lesson.title_fr, lesson.title_ar, lesson.description_fr, lesson.sort_order, lesson.xp_reward, lesson.estimated_minutes, JSON.stringify(lesson.prerequisite_ids)]
      );
    }

    // Insert exercises
    for (const exercise of pack.exercises ?? []) {
      await db.runAsync(
        `INSERT OR REPLACE INTO exercises (id, lesson_id, type, config, sort_order, difficulty, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [exercise.id, exercise.lesson_id, exercise.type, JSON.stringify(exercise.config), exercise.sort_order, exercise.difficulty, JSON.stringify(exercise.tags)]
      );
    }

    // Track pack version
    await db.runAsync(
      `INSERT OR REPLACE INTO content_packs (pack_id, version) VALUES (?, ?)`,
      [packId, pack.version]
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Set online status. Triggers sync when coming online.
 */
export async function setOnlineStatus(online: boolean): Promise<void> {
  const wasOffline = !syncStatus.isOnline;
  syncStatus.isOnline = online;

  if (online && wasOffline && syncStatus.pendingChanges > 0) {
    await processSyncQueue();
  }
}

// ─── Internal Types ───────────────────────────────────────

interface ContentPackPayload {
  version: string;
  lessons: Array<{
    id: string;
    module_id: string;
    title_fr: string;
    title_ar: string | null;
    description_fr: string | null;
    sort_order: number;
    xp_reward: number;
    estimated_minutes: number;
    prerequisite_ids: string[];
  }>;
  exercises: Array<{
    id: string;
    lesson_id: string;
    type: string;
    config: Record<string, unknown>;
    sort_order: number;
    difficulty: number;
    tags: string[];
  }>;
}
