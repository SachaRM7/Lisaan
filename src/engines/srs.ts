// src/engines/srs.ts

/**
 * Algorithme SRS basé sur SM-2 (SuperMemo 2), adapté pour l'arabe.
 *
 * quality : 0 à 5
 *   0 = blackout total (aucune idée)
 *   1 = incorrect, mais reconnu après coup
 *   2 = incorrect, mais on sentait la réponse proche
 *   3 = correct, avec difficulté significative
 *   4 = correct, avec légère hésitation
 *   5 = correct, instantané
 *
 * En pratique dans Lisaan (MCQ) :
 *   - Bonne réponse au 1er essai, < 3s → quality 5
 *   - Bonne réponse au 1er essai, >= 3s → quality 4
 *   - Bonne réponse au 2ème essai → quality 3
 *   - Mauvaise réponse → quality 1
 */

export interface SRSCard {
  id: string;
  user_id: string;
  item_type: 'letter' | 'diacritic' | 'word' | 'sentence' | 'conjugation' | 'grammar_rule' | 'quran_word';
  item_id: string;
  ease_factor: number;      // Défaut: 2.5
  interval_days: number;    // Intervalle avant prochaine révision
  repetitions: number;      // Nombre de révisions réussies consécutives
  next_review_at: string;   // ISO 8601
  last_review_at: string | null;
  last_quality: number;     // Dernière note 0-5
}

export interface SRSUpdate {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_review_at: string;
  last_quality: number;
}

/** Interval labels for UI display (kept for backward compatibility) */
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
 * Crée une nouvelle carte SRS avec les valeurs par défaut.
 */
export function createNewCard(
  userId: string,
  itemType: SRSCard['item_type'],
  itemId: string,
): Omit<SRSCard, 'id'> {
  return {
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: new Date().toISOString(),
    last_review_at: null,
    last_quality: 0,
  };
}

/**
 * Calcule la mise à jour d'une carte SRS après une révision.
 */
export function computeSRSUpdate(card: SRSCard, quality: number): SRSUpdate {
  const now = new Date();

  if (quality < 3) {
    // Échec : reset les répétitions, revoir dans 10 minutes
    return {
      ease_factor: Math.max(1.3, card.ease_factor - 0.2),
      interval_days: 0.0069, // ~10 minutes
      repetitions: 0,
      next_review_at: addDays(now, 0.0069).toISOString(),
      last_review_at: now.toISOString(),
      last_quality: quality,
    };
  }

  // Succès : calcul du nouveau ease_factor
  const newEase = Math.max(
    1.3,
    card.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  // Calcul du nouvel intervalle
  let newInterval: number;
  if (card.repetitions === 0) {
    newInterval = 0.0069; // 10 minutes (première révision)
  } else if (card.repetitions === 1) {
    newInterval = 1; // 1 jour
  } else if (card.repetitions === 2) {
    newInterval = 3; // 3 jours
  } else {
    newInterval = card.interval_days * newEase;
  }

  // Plafonner à 180 jours max
  newInterval = Math.min(newInterval, 180);

  return {
    ease_factor: newEase,
    interval_days: newInterval,
    repetitions: card.repetitions + 1,
    next_review_at: addDays(now, newInterval).toISOString(),
    last_review_at: now.toISOString(),
    last_quality: quality,
  };
}

/**
 * Convertit un résultat d'exercice MCQ en quality score SRS.
 *
 * @param correct - L'utilisateur a-t-il donné la bonne réponse ?
 * @param attempts - Nombre de tentatives (1 = premier coup)
 * @param timeMs - Temps de réponse en millisecondes
 */
export function exerciseResultToQuality(
  correct: boolean,
  attempts: number,
  timeMs: number,
): number {
  if (!correct) return 1;
  if (attempts > 1) return 3;
  if (timeMs < 3000) return 5;
  return 4;
}

/**
 * Filtre les cartes dues pour révision.
 */
export function getCardsDueForReview(cards: SRSCard[]): SRSCard[] {
  const now = new Date();
  return cards
    .filter(card => new Date(card.next_review_at) <= now)
    .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());
}

/**
 * Applique le plafonnement des confusion pairs.
 * Si une lettre d'une paire est maîtrisée (interval > 7j) mais pas l'autre,
 * la maîtrisée est plafonnée à 7j pour forcer la révision comparative.
 */
export function applyConfusionPairCap(
  cards: SRSCard[],
  confusionPairs: string[][], // ex: [['letter-002-ba', 'letter-003-ta', 'letter-004-tha'], ...]
): SRSCard[] {
  const CAP_DAYS = 7;
  const cardMap = new Map(cards.map(c => [c.item_id, c]));

  return cards.map(card => {
    if (card.item_type !== 'letter') return card;

    // Trouver les paires de confusion de cette lettre
    for (const pair of confusionPairs) {
      if (!pair.includes(card.item_id)) continue;

      // Vérifier si un membre de la paire est faible (interval < 3j)
      const hasWeakSibling = pair.some(siblingId => {
        if (siblingId === card.item_id) return false;
        const sibling = cardMap.get(siblingId);
        return !sibling || sibling.interval_days < 3;
      });

      // Si un sibling est faible et cette carte est forte, plafonner
      if (hasWeakSibling && card.interval_days > CAP_DAYS) {
        return {
          ...card,
          interval_days: CAP_DAYS,
          next_review_at: addDays(new Date(card.last_review_at ?? new Date()), CAP_DAYS).toISOString(),
        };
      }
    }

    return card;
  });
}

export function flashcardResultToQuality(userAnswer: string, timeMs: number): number {
  if (userAnswer === 'knew_it') return timeMs > 10000 ? 4 : 5;
  if (userAnswer === 'almost') return 3;
  return 1; // missed
}

export function writeResultToQuality(isCorrect: boolean, isExact: boolean, timeMs: number): number {
  if (!isCorrect) return 1;
  if (isExact && timeMs < 5000) return 5;
  if (isExact) return 4;
  return 3; // correct mais tolérance appliquée
}

// --- Helpers ---

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
  return result;
}
