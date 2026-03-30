// src/engines/review-mode-selector.ts

import type { SRSCard } from './srs';
import type { ExerciseType } from '../types/exercise';

interface ModeCtx { card: SRSCard; hasAudio: boolean; matchAvailable: boolean; }

export function selectReviewMode(ctx: ModeCtx): ExerciseType {
  const { card, hasAudio, matchAvailable } = ctx;
  if (card.ease_factor < 1.8) return 'mcq';
  if (card.repetitions <= 1) return 'mcq';
  if (card.repetitions >= 6 && card.ease_factor >= 2.3) return 'flashcard';
  if (card.repetitions >= 4) return 'write';

  const v = hashVariety(card.id, card.repetitions);
  if (hasAudio && v % 4 === 0) return 'listen_select';
  if (matchAvailable && v % 4 === 1) return 'match';
  if (v % 4 === 2) return 'write';
  return 'mcq';
}

function hashVariety(id: string, rep: number): number {
  let h = 0;
  const s = `${id}-${rep}-${new Date().toDateString()}`;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function selectModesForSession(
  cards: SRSCard[],
  audioMap: Map<string, boolean>,
  matchableTypes: SRSCard['item_type'][] = ['letter', 'diacritic'],
): Map<string, ExerciseType> {
  const r = new Map<string, ExerciseType>();
  for (const c of cards) r.set(c.id, selectReviewMode({
    card: c, hasAudio: audioMap.get(c.item_id) ?? false,
    matchAvailable: matchableTypes.includes(c.item_type),
  }));
  return r;
}
