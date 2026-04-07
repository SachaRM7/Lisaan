/**
 * feedback-service.ts — service de soumission de feedback bêta.
 *
 * Envoie les retours utilisateur vers Supabase (table beta_feedback).
 * Utilisé uniquement par les beta-testeurs.
 */

import { supabase } from '../db/remote';
import { useAuthStore } from '../stores/useAuthStore';

export interface FeedbackPayload {
  rating: number;       // 1-5
  comment?: string;
}

/**
 * Soumet un feedback pour l'utilisateur connecté.
 * Ne fait rien si l'utilisateur n'est pas connecté (guest).
 */
export async function submitBetaFeedback(payload: FeedbackPayload): Promise<{ success: boolean; error?: string }> {
  const userId = useAuthStore.getState().effectiveUserId();
  if (!userId || useAuthStore.getState().isGuest) {
    return { success: false, error: 'Utilisateur non connecté' };
  }

  if (payload.rating < 1 || payload.rating > 5) {
    return { success: false, error: 'Rating doit être entre 1 et 5' };
  }

  const { error } = await supabase
    .from('beta_feedback')
    .insert({
      user_id: userId,
      rating: payload.rating,
      comment: payload.comment ?? null,
    });

  if (error) {
    console.error('[feedback-service] insert error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
