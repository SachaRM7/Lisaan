// src/engines/streak.ts

import { supabase } from '../db/remote';

interface StreakData {
  streak_current: number;
  streak_longest: number;
  last_activity_date: string | null; // YYYY-MM-DD en heure locale
}

/**
 * Vérifie et met à jour le streak de l'utilisateur.
 * Appelée à chaque complétion de leçon ou session de révision.
 */
export async function updateStreak(): Promise<StreakData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Charger les données actuelles
    const { data: userData, error } = await supabase
      .from('users')
      .select('streak_current, streak_longest, last_activity_date')
      .eq('id', user.id)
      .single();

    if (error || !userData) return null;

    const today = getLocalDateString();
    const lastActivity = userData.last_activity_date;

    let newStreak: number;

    if (lastActivity === today) {
      // Déjà actif aujourd'hui — pas de changement
      return {
        streak_current: userData.streak_current,
        streak_longest: userData.streak_longest,
        last_activity_date: today,
      };
    }

    if (lastActivity === getYesterdayDateString()) {
      // Actif hier → incrémenter
      newStreak = (userData.streak_current ?? 0) + 1;
    } else {
      // Pas actif hier → reset à 1
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, userData.streak_longest ?? 0);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        streak_current: newStreak,
        streak_longest: newLongest,
        last_activity_date: today,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[streak] Update error:', updateError.message);
      return null;
    }

    return {
      streak_current: newStreak,
      streak_longest: newLongest,
      last_activity_date: today,
    };
  } catch (err) {
    console.error('[streak] Error:', err);
    return null;
  }
}

// --- Helpers ---

function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}
