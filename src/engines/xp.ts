// src/engines/xp.ts

import { supabase } from '../db/remote';

/**
 * Ajoute des XP à l'utilisateur.
 * Retourne le nouveau total, ou null en cas d'erreur.
 */
export async function addXP(amount: number): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    const currentXP = userData?.total_xp ?? 0;
    const newTotal = currentXP + amount;

    await supabase
      .from('users')
      .update({ total_xp: newTotal })
      .eq('id', user.id);

    return newTotal;
  } catch (err) {
    console.error('[xp] Error:', err);
    return null;
  }
}

/**
 * Calcule les XP gagnés pour une leçon complétée.
 * Bonus 50% si score parfait (100%).
 */
export function calculateLessonXP(baseXP: number, scorePercent: number): number {
  const multiplier = scorePercent >= 100 ? 1.5 : 1;
  return Math.round(baseXP * multiplier);
}

/**
 * Calcule les XP gagnés pour une session de révision.
 * 5 XP par carte révisée.
 */
export function calculateReviewXP(cardsReviewed: number): number {
  return cardsReviewed * 5;
}
