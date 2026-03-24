// src/engines/badge-engine.ts

import { getLocalDB } from '../db/local';
import { runSync } from './sync-manager';
import { generateId } from '../utils/id';

export interface BadgeUnlock {
  badge_id: string;
  title_fr: string;
  description_fr: string;
  icon: string;
  xp_reward: number;
}

export interface BadgeCheckContext {
  userId: string;
  lessonCount?: number;        // Nombre total de leçons complétées
  completedModuleId?: string;  // ID du module fraîchement complété (ou undefined)
  streakDays?: number;         // Streak actuel en jours
  isPerfectScore?: boolean;    // Leçon complétée avec score 100%
  exerciseTimeMs?: number;     // Temps du dernier exercice MCQ en ms
}

interface BadgeRow {
  id: string;
  title_fr: string;
  description_fr: string;
  icon: string;
  category: string;
  condition_type: string;
  condition_value: number;
  condition_target: string | null;
  xp_reward: number;
}

export async function checkAndUnlockBadges(ctx: BadgeCheckContext): Promise<BadgeUnlock[]> {
  const db = getLocalDB();
  const { userId } = ctx;

  // Charger les badges non encore débloqués par cet utilisateur
  const allBadges = await db.getAllAsync<BadgeRow>(`
    SELECT b.* FROM badges b
    WHERE b.id NOT IN (
      SELECT badge_id FROM user_badges WHERE user_id = ?
    )
  `, [userId]);

  const newUnlocks: BadgeUnlock[] = [];

  for (const badge of allBadges) {
    let shouldUnlock = false;

    switch (badge.condition_type) {
      case 'lesson_count':
        shouldUnlock = (ctx.lessonCount ?? 0) >= badge.condition_value;
        break;

      case 'module_complete':
        shouldUnlock = ctx.completedModuleId === badge.condition_target;
        break;

      case 'streak_days':
        shouldUnlock = (ctx.streakDays ?? 0) >= badge.condition_value;
        break;

      case 'perfect_score':
        shouldUnlock = ctx.isPerfectScore === true;
        break;

      case 'speed_exercise':
        // condition_value est le temps max en ms (ex: 3000 = 3s)
        shouldUnlock = ctx.exerciseTimeMs !== undefined && ctx.exerciseTimeMs <= badge.condition_value;
        break;
    }

    if (shouldUnlock) {
      const now = new Date().toISOString();
      const id = generateId();
      await db.runAsync(
        `INSERT OR IGNORE INTO user_badges
         (id, user_id, badge_id, unlocked_at, seen, updated_at, synced_at)
         VALUES (?, ?, ?, ?, 0, ?, NULL)`,
        [id, userId, badge.id, now, now]
      );
      newUnlocks.push({
        badge_id: badge.id,
        title_fr: badge.title_fr,
        description_fr: badge.description_fr,
        icon: badge.icon,
        xp_reward: badge.xp_reward,
      });
    }
  }

  // Push en fire-and-forget si nouveaux badges
  if (newUnlocks.length > 0) {
    runSync().catch(e => console.warn('[BadgeEngine] sync error:', e));
  }

  return newUnlocks;
}

export async function getUnseenBadges(userId: string): Promise<BadgeUnlock[]> {
  const db = getLocalDB();
  return db.getAllAsync<BadgeUnlock>(
    `SELECT b.id as badge_id, b.title_fr, b.description_fr, b.icon, b.xp_reward
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = ? AND ub.seen = 0
     ORDER BY ub.unlocked_at ASC`,
    [userId]
  );
}

export async function markBadgesSeen(userId: string): Promise<void> {
  const db = getLocalDB();
  await db.runAsync(
    `UPDATE user_badges SET seen = 1, updated_at = ?, synced_at = NULL
     WHERE user_id = ? AND seen = 0`,
    [new Date().toISOString(), userId]
  );
  runSync().catch(e => console.warn('[BadgeEngine] sync error:', e));
}
