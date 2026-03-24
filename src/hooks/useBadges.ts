// src/hooks/useBadges.ts

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import {
  checkAndUnlockBadges,
  getUnseenBadges,
  markBadgesSeen,
  BadgeUnlock,
  BadgeCheckContext,
} from '../engines/badge-engine';
import { getLocalDB } from '../db/local';

export interface UserBadgeDisplay {
  badge_id: string;
  title_fr: string;
  description_fr: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
}

export function useBadges() {
  const userId = useAuthStore(s => s.userId);
  const [allUnlockedBadges, setAllUnlockedBadges] = useState<UserBadgeDisplay[]>([]);
  const [unseenBadges, setUnseenBadges] = useState<BadgeUnlock[]>([]);

  const loadBadges = useCallback(async () => {
    if (!userId) return;
    const db = getLocalDB();
    const badges = await db.getAllAsync<UserBadgeDisplay>(
      `SELECT b.id as badge_id, b.title_fr, b.description_fr, b.icon, b.xp_reward,
              ub.unlocked_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ?
       ORDER BY ub.unlocked_at DESC`,
      [userId]
    );
    setAllUnlockedBadges(badges);

    const unseen = await getUnseenBadges(userId);
    setUnseenBadges(unseen);
  }, [userId]);

  useEffect(() => { loadBadges(); }, [loadBadges]);

  const checkBadges = useCallback(
    async (ctx: Omit<BadgeCheckContext, 'userId'>): Promise<BadgeUnlock[]> => {
      if (!userId) return [];
      const newBadges = await checkAndUnlockBadges({ ...ctx, userId });
      if (newBadges.length > 0) {
        await loadBadges();
      }
      return newBadges;
    },
    [userId, loadBadges]
  );

  const dismissUnseenBadges = useCallback(async () => {
    if (!userId) return;
    await markBadgesSeen(userId);
    setUnseenBadges([]);
  }, [userId]);

  return {
    allUnlockedBadges,
    unseenBadges,
    checkBadges,
    dismissUnseenBadges,
    reload: loadBadges,
  };
}
