// src/services/invite-beta.ts
// Service de validation des codes d'invitation bêta
// Exception : ce service est autorisé à importer db/remote.ts directement
// car il s'agit d'un flux admin/bêta, pas d'un flux utilisateur standard.

import { supabase } from '../db/remote';
import { useAuthStore } from '../stores/useAuthStore';

export interface BetaInviteResult {
  valid: boolean;
  error?: 'not_found' | 'already_used' | 'network_error';
}

/**
 * Valide un code d'invitation bêta.
 * - Vérifie que le code existe et n'est pas déjà utilisé
 * - Marque le code comme utilisé avec l'userId
 * - Met à jour is_beta_tester dans le store local
 * - Push vers Supabase (fire-and-forget pour la perf)
 */
export async function validateBetaInviteCode(code: string): Promise<BetaInviteResult> {
  try {
    // 1. Vérifier que le code existe et n'est pas utilisé
    const { data: invite, error: fetchError } = await supabase
      .from('beta_invites')
      .select('code, used, used_by')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !invite) {
      return { valid: false, error: 'not_found' };
    }

    if (invite.used) {
      return { valid: false, error: 'already_used' };
    }

    // 2. Marquer le code comme utilisé
    const effectiveUserId = useAuthStore.getState().effectiveUserId();
    const { error: updateError } = await supabase
      .from('beta_invites')
      .update({
        used: true,
        used_by: effectiveUserId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code.toUpperCase());

    if (updateError) {
      console.error('[invite-beta] Erreur lors du marquage du code:', updateError);
      return { valid: false, error: 'network_error' };
    }

    // 3. Mettre à jour le store local
    useAuthStore.getState().setBetaTester(true);

    // 4. Push vers Supabase user_profiles (fire-and-forget)
    if (effectiveUserId) {
      supabase
        .from('user_profiles')
        .update({ is_beta_tester: true })
        .eq('id', effectiveUserId)
        .then(({ error }) => {
          if (error) {
            console.error('[invite-beta] Erreur sync is_beta_tester:', error);
          }
        });
    }

    return { valid: true };
  } catch (err) {
    console.error('[invite-beta] Exception:', err);
    return { valid: false, error: 'network_error' };
  }
}

/**
 * Marque un utilisateur comme beta tester (appelé après validation code).
 * Fire-and-forget vers Supabase.
 */
export async function markBetaTester(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_profiles')
      .update({ is_beta_tester: true })
      .eq('id', userId);
  } catch (err) {
    console.error('[invite-beta] markBetaTester error:', err);
  }
}
