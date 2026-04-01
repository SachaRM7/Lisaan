// src/hooks/useDailyChallenges.ts

import { useEffect, useState, useCallback } from 'react';
import {
  getTodayChallenge,
  getAllChallenges,
  getDailyChallengeProgress,
  upsertDailyChallengeProgress,
} from '../db/local-queries';
import { useAuthStore } from '../stores/useAuthStore';

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  title_fr: string;
  title_ar: string | null;
  theme: string;
  exercise_refs: {
    modules?: string[];
    exercise_types?: string[];
    count: number;
  };
  xp_reward: number;
  badge_reward: string | null;
}

export interface DailyChallengeProgress {
  challenge_id: string;
  user_id: string;
  completed_at: string | null;
  score: number;
  xp_earned: number;
}

/**
 * Hook pour gérer les défis quotidiens.
 *
 * useDailyChallenges() — Charge le défi du jour et la progression
 */
export function useDailyChallenges() {
  const effectiveUserId = useAuthStore(state => state.effectiveUserId());

  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge | null>(null);
  const [allChallenges, setAllChallenges] = useState<DailyChallenge[]>([]);
  const [progress, setProgress] = useState<DailyChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!effectiveUserId) return;

    try {
      setLoading(true);
      setError(null);

      const challenge = await getTodayChallenge();
      const all = await getAllChallenges();
      const prog = challenge ? await getDailyChallengeProgress(effectiveUserId, challenge.id) : null;

      setTodayChallenge(challenge);
      setAllChallenges(all);
      setProgress(prog);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeChallenge = useCallback(async (
    score: number,
    xpEarned: number
  ): Promise<void> => {
    if (!effectiveUserId || !todayChallenge) return;

    await upsertDailyChallengeProgress(
      effectiveUserId,
      todayChallenge.id,
      score,
      xpEarned
    );

    // Recharger les données
    await loadData();
  }, [effectiveUserId, todayChallenge, loadData]);

  const isTodayCompleted = !!progress?.completed_at;
  const todayScore = progress?.score ?? 0;

  return {
    todayChallenge,
    allChallenges,
    progress,
    loading,
    error,
    isTodayCompleted,
    todayScore,
    completeChallenge,
    refresh: loadData,
  };
}