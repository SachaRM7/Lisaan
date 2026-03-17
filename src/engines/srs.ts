import type { SrsCard } from '../types';

/**
 * Lisaan SRS Engine
 * Based on SM-2 (SuperMemo 2) with adaptations for Arabic learning:
 * - Shorter initial intervals for mobile context
 * - Confusion pair awareness (visually/phonetically similar letters)
 */

/** Quality ratings for SRS review */
export const SRS_QUALITY = {
  BLACKOUT: 0,   // Complete failure
  FAILED: 1,     // Incorrect after effort
  HARD: 2,       // Incorrect but close
  DIFFICULT: 3,  // Correct with significant effort
  CORRECT: 4,    // Correct with some hesitation
  EASY: 5,       // Perfect, instant recall
} as const;

export type SrsQuality = (typeof SRS_QUALITY)[keyof typeof SRS_QUALITY];

/** Map from UI buttons to quality values */
export const BUTTON_QUALITY_MAP = {
  failed: SRS_QUALITY.FAILED,
  difficult: SRS_QUALITY.DIFFICULT,
  correct: SRS_QUALITY.CORRECT,
  easy: SRS_QUALITY.EASY,
} as const;

/** Interval labels for UI display */
export const INTERVAL_LABELS: Record<string, (interval: number) => string> = {
  fr: (interval: number) => {
    if (interval < 0.007) return '< 1min';
    if (interval < 0.042) return `${Math.round(interval * 1440)}min`;
    if (interval < 1) return `${Math.round(interval * 24)}h`;
    if (interval === 1) return '1 jour';
    if (interval < 30) return `${Math.round(interval)} jours`;
    if (interval < 365) return `${Math.round(interval / 30)} mois`;
    return `${Math.round(interval / 365)} an(s)`;
  },
};

/**
 * Update an SRS card based on the review quality.
 * Returns a new card object (immutable).
 */
export function updateSrs(card: SrsCard, quality: SrsQuality): Partial<SrsCard> {
  const now = new Date().toISOString();

  // Failed review: reset repetitions
  if (quality < SRS_QUALITY.DIFFICULT) {
    return {
      ease_factor: Math.max(1.3, card.ease_factor - 0.2),
      interval_days: 0.0069, // ~10 minutes
      repetitions: 0,
      next_review_at: addDays(now, 0.0069),
      last_review_at: now,
      last_quality: quality,
    };
  }

  // Successful review: increase interval
  const newEase = Math.max(
    1.3,
    card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval: number;
  if (card.repetitions === 0) {
    newInterval = 0.0069; // 10 minutes
  } else if (card.repetitions === 1) {
    newInterval = 1; // 1 day
  } else if (card.repetitions === 2) {
    newInterval = 3; // 3 days
  } else {
    newInterval = card.interval_days * newEase;
  }

  // Cap maximum interval at 365 days
  newInterval = Math.min(newInterval, 365);

  return {
    ease_factor: newEase,
    interval_days: newInterval,
    repetitions: card.repetitions + 1,
    next_review_at: addDays(now, newInterval),
    last_review_at: now,
    last_quality: quality,
  };
}

/**
 * Get the next interval for each quality button (for UI preview).
 */
export function getIntervalPreviews(card: SrsCard): Record<string, number> {
  return {
    failed: 0.0069,
    difficult: card.repetitions === 0 ? 0.0069 : card.repetitions === 1 ? 1 : 3,
    correct: card.repetitions <= 1 ? 1 : card.repetitions === 2 ? 3 : card.interval_days * card.ease_factor,
    easy: card.repetitions <= 1 ? 3 : card.interval_days * card.ease_factor * 1.3,
  };
}

/**
 * Check if a card is due for review.
 */
export function isDue(card: SrsCard): boolean {
  return new Date(card.next_review_at) <= new Date();
}

/**
 * Create a new SRS card for a content item.
 */
export function createCard(
  userId: string,
  itemType: SrsCard['item_type'],
  itemId: string
): Omit<SrsCard, 'id'> {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: now,
    last_review_at: null,
    last_quality: null,
  };
}

// ─── Helpers ──────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}
