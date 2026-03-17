// src/engines/onboarding-sync.ts

import { supabase } from '../db/remote';
import type { OnboardingAnswers, Variant } from '../types/onboarding';
import { dailyTimeToMinutes } from './onboarding-scorer';

interface SyncParams {
  answers: OnboardingAnswers;
  recommendedVariant: Variant;
  chosenVariant: Variant;  // Ce que l'utilisateur a réellement choisi (peut différer de la reco)
}

export async function syncOnboardingToSupabase(params: SyncParams): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[onboarding-sync] No authenticated user, skipping sync');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        onboarding_answers: params.answers as unknown as Record<string, unknown>,
        recommended_variant: params.recommendedVariant,
        active_variant: params.chosenVariant,
        daily_goal_minutes: dailyTimeToMinutes(params.answers.daily_time),
      }, { onConflict: 'id' });

    if (error) {
      console.error('[onboarding-sync] Supabase error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[onboarding-sync] Network error:', err);
    return false;
  }
}
