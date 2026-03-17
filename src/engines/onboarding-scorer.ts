// src/engines/onboarding-scorer.ts

import type {
  OnboardingAnswers,
  VariantScores,
  OnboardingRecommendation,
  Motivation,
  Variant,
} from '../types/onboarding';

/**
 * Matrice de poids par motivation.
 * 'dialect_preferred' est résolu dynamiquement selon la réponse Q4.
 */
const MOTIVATION_WEIGHTS: Record<Motivation, Partial<VariantScores> & { dialect_preferred?: number }> = {
  quran:    { msa: 0.6, quranic: 0.4 },
  family:   { msa: 0.3, dialect_preferred: 0.7 },
  travel:   { msa: 0.4, dialect_preferred: 0.6 },
  media:    { msa: 0.3, egyptian: 0.5, levantine: 0.2 },
  books:    { msa: 0.9, quranic: 0.1 },
  business: { msa: 0.7, khaliji: 0.3 },
  culture:  { msa: 0.8, quranic: 0.2 },
};

/** Messages personnalisés par variante recommandée */
const RECOMMENDATION_MESSAGES: Record<Variant, string> = {
  msa: "L'arabe standard moderne (MSA) est ta meilleure porte d'entrée. C'est la langue commune à tous les pays arabophones — presse, livres, discours officiels. Une fois le MSA acquis, passer à un dialecte sera beaucoup plus naturel.",
  darija: "Le darija marocain correspond à tes objectifs. Cependant, au MVP, nous commençons par le MSA — l'alphabet et les sons sont identiques. Tu n'apprendras ça qu'une seule fois, et le darija sera bientôt disponible.",
  egyptian: "L'arabe égyptien est le dialecte le plus compris dans le monde arabe grâce au cinéma et à la musique. On commence par le MSA pour l'alphabet — les sons et les lettres sont les mêmes. Le module égyptien arrive bientôt.",
  levantine: "Le levantin (libanais, syrien, palestinien) correspond à tes objectifs. On commence par le MSA pour les fondamentaux — l'alphabet est le même partout. Le module levantin arrive bientôt.",
  khaliji: "L'arabe du Golfe correspond à tes objectifs professionnels. On commence par le MSA — la base est commune. Le module khaliji arrive bientôt.",
  quranic: "L'arabe coranique est ton objectif principal. Le MSA partage 90% de sa grammaire et de son vocabulaire avec l'arabe classique. C'est le chemin le plus efficace. Le module tajwid et vocabulaire coranique arrive en phase 3.",
};

/** Variantes disponibles au MVP */
const AVAILABLE_VARIANTS: Set<Variant> = new Set<Variant>(['msa']);

/**
 * Calcule les scores de pertinence par variante à partir des réponses d'onboarding.
 */
export function computeVariantScores(answers: OnboardingAnswers): VariantScores {
  const scores: VariantScores = {
    msa: 0, darija: 0, egyptian: 0,
    levantine: 0, khaliji: 0, quranic: 0,
  };

  // Résoudre le dialecte préféré (Q4)
  const dialectMap: Record<string, Variant> = {
    darija: 'darija',
    egyptian: 'egyptian',
    levantine: 'levantine',
    khaliji: 'khaliji',
  };
  const preferredDialect: Variant | null =
    answers.dialect_contact !== 'none'
      ? dialectMap[answers.dialect_contact] ?? null
      : null;

  // Accumuler les poids de chaque motivation sélectionnée
  for (const motivation of answers.motivations) {
    const weights = MOTIVATION_WEIGHTS[motivation];
    for (const [key, value] of Object.entries(weights)) {
      if (key === 'dialect_preferred') {
        // Distribuer vers le dialecte préféré, ou vers MSA si aucun
        const target = preferredDialect ?? 'msa';
        scores[target] += value as number;
      } else {
        scores[key as keyof VariantScores] += value as number;
      }
    }
  }

  // Bonus Q3 (objectif prioritaire)
  if (answers.primary_goal === 'understand_quran') {
    scores.quranic += 0.3;
    scores.msa += 0.1;
  } else if (answers.primary_goal === 'basic_conversation' && preferredDialect) {
    scores[preferredDialect] += 0.3;
  } else if (answers.primary_goal === 'read_fluently') {
    scores.msa += 0.2;
  } else if (answers.primary_goal === 'master_grammar') {
    scores.msa += 0.3;
  }

  // Bonus Q4 direct (dialecte de contact)
  if (preferredDialect) {
    scores[preferredDialect] += 0.2;
  }

  // Normaliser les scores (0 à 1)
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  if (total > 0) {
    for (const key of Object.keys(scores) as Array<keyof VariantScores>) {
      scores[key] = Math.round((scores[key] / total) * 100) / 100;
    }
  }

  return scores;
}

/**
 * Produit la recommandation finale à partir des scores.
 */
export function computeRecommendation(answers: OnboardingAnswers): OnboardingRecommendation {
  const scores = computeVariantScores(answers);

  // Trouver la variante avec le score le plus élevé
  let recommended: Variant = 'msa';
  let maxScore = 0;
  for (const [key, value] of Object.entries(scores) as Array<[Variant, number]>) {
    if (value > maxScore) {
      maxScore = value;
      recommended = key;
    }
  }

  return {
    scores,
    recommended,
    message_fr: RECOMMENDATION_MESSAGES[recommended],
    available: AVAILABLE_VARIANTS.has(recommended),
  };
}

/**
 * Convertit daily_time en minutes pour user.daily_goal_minutes.
 */
export function dailyTimeToMinutes(dt: OnboardingAnswers['daily_time']): number {
  const map: Record<typeof dt, number> = {
    '5min': 5,
    '10min': 10,
    '15-20min': 15,
    '20min+': 25,
  };
  return map[dt];
}
