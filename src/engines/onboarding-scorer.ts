import type { OnboardingAnswers, OnboardingRecommendation, VariantScore, VariantType } from '../types';

/**
 * Lisaan Onboarding Scorer
 * Computes variant relevance scores based on user motivations, level, and preferences.
 * No ML — just weighted scoring with configurable weights.
 */

type WeightMap = Partial<Record<VariantType, number>>;

/** Motivation → variant weight mapping */
const MOTIVATION_WEIGHTS: Record<string, WeightMap> = {
  quran:     { msa: 0.5, quranic: 0.5 },
  family:    { msa: 0.3 }, // dialect_preferred gets 0.7 — resolved at runtime
  travel:    { msa: 0.4 }, // dialect_preferred gets 0.6
  media:     { msa: 0.3, egyptian: 0.5, levantine: 0.2 },
  books:     { msa: 0.9, quranic: 0.1 },
  business:  { msa: 0.7, khaliji: 0.3 },
  curiosity: { msa: 0.8, quranic: 0.2 },
};

/** Objective → variant weight boost */
const OBJECTIVE_BOOSTS: Record<string, WeightMap> = {
  read:    { msa: 0.2 },
  converse: {}, // uses dialect_preferred
  quran:   { quranic: 0.3, msa: 0.1 },
  grammar: { msa: 0.3 },
};

/** Dialect contact → variant mapping */
const DIALECT_MAP: Record<string, VariantType> = {
  none:      'msa',
  moroccan:  'darija',
  egyptian:  'egyptian',
  levantine: 'levantine',
  khaliji:   'khaliji',
};

const VARIANT_LABELS: Record<VariantType, string> = {
  msa:       'Arabe Standard Moderne',
  darija:    'Marocain',
  egyptian:  'Égyptien',
  levantine: 'Levantin',
  khaliji:   'Khaliji',
  quranic:   'Arabe coranique',
};

/**
 * Compute variant recommendation scores from onboarding answers.
 */
export function computeRecommendation(answers: OnboardingAnswers): OnboardingRecommendation {
  const scores: Record<string, number> = {
    msa: 0,
    darija: 0,
    egyptian: 0,
    levantine: 0,
    khaliji: 0,
    quranic: 0,
  };

  const preferredDialect = DIALECT_MAP[answers.dialect_contact] ?? 'msa';

  // 1. Motivations (multi-select, each contributes)
  for (const motivation of answers.motivations) {
    const weights = MOTIVATION_WEIGHTS[motivation];
    if (!weights) continue;

    for (const [variant, weight] of Object.entries(weights)) {
      scores[variant] = (scores[variant] ?? 0) + (weight ?? 0);
    }

    // Distribute dialect-preferred weight
    if (motivation === 'family' || motivation === 'travel') {
      const dialectWeight = motivation === 'family' ? 0.7 : 0.6;
      if (preferredDialect !== 'msa') {
        scores[preferredDialect] = (scores[preferredDialect] ?? 0) + dialectWeight;
      } else {
        scores['msa'] = (scores['msa'] ?? 0) + dialectWeight;
      }
    }
  }

  // 2. Objective boost
  const boosts = OBJECTIVE_BOOSTS[answers.objective] ?? {};
  for (const [variant, boost] of Object.entries(boosts)) {
    scores[variant] = (scores[variant] ?? 0) + (boost ?? 0);
  }
  if (answers.objective === 'converse' && preferredDialect !== 'msa') {
    scores[preferredDialect] = (scores[preferredDialect] ?? 0) + 0.4;
  }

  // 3. Normalize to 0-100
  const maxScore = Math.max(...Object.values(scores), 0.01);
  const normalizedScores: VariantScore[] = Object.entries(scores)
    .map(([variant, score]) => ({
      variant: variant as VariantType,
      label: VARIANT_LABELS[variant as VariantType] ?? variant,
      score: Math.round((score / maxScore) * 100),
    }))
    .filter(s => s.score > 10) // Hide irrelevant variants
    .sort((a, b) => b.score - a.score);

  const recommended = normalizedScores[0]?.variant ?? 'msa';

  // 4. Generate personalized message
  const message = generateMessage(answers, recommended, preferredDialect);

  return { scores: normalizedScores, recommended, message };
}

function generateMessage(
  answers: OnboardingAnswers,
  recommended: VariantType,
  _preferredDialect: VariantType
): string {
  if (recommended === 'msa') {
    if (answers.motivations.includes('quran')) {
      return 'Le MSA te donnera les bases solides pour comprendre la structure de la langue arabe. Une grande partie du vocabulaire coranique est partagée avec le MSA, ce qui facilitera ta transition vers l\'arabe du Coran.';
    }
    return 'L\'Arabe Standard Moderne est la base commune à tous les pays arabophones. C\'est le meilleur point de départ pour développer une compréhension large et polyvalente.';
  }

  if (recommended === 'quranic') {
    return 'L\'arabe coranique est ton objectif principal. On commencera par les bases du MSA qui te serviront de fondation, puis on se spécialisera rapidement vers le vocabulaire et les règles du Coran.';
  }

  const label = VARIANT_LABELS[recommended] ?? recommended;
  return `Le ${label} semble le plus pertinent pour tes objectifs. On commencera par les bases communes (alphabet, lecture), puis on intégrera les spécificités du dialecte.`;
}
