// src/types/onboarding.ts

/** Variantes linguistiques supportées par Lisaan */
export type Variant = 'msa' | 'darija' | 'egyptian' | 'levantine' | 'khaliji' | 'quranic';

/** Motivations possibles (multi-choix) */
export type Motivation =
  | 'quran'
  | 'family'
  | 'travel'
  | 'media'
  | 'books'
  | 'business'
  | 'culture';

/** Niveaux de base en arabe */
export type ArabicLevel =
  | 'zero'           // Aucune — je pars de zéro
  | 'few_letters'    // Je connais quelques lettres
  | 'slow_reader'    // Je sais lire mais lentement
  | 'oral_only'      // Je comprends à l'oral mais je ne sais pas lire/écrire
  | 'intermediate';  // Je me débrouille mais je veux progresser

/** Objectifs prioritaires */
export type PrimaryGoal =
  | 'read_fluently'      // Lire l'arabe couramment
  | 'basic_conversation' // Avoir une conversation basique
  | 'understand_quran'   // Comprendre le Coran sans traduction
  | 'master_grammar';    // Maîtriser la grammaire et l'écriture

/** Dialectes de contact */
export type DialectContact =
  | 'none'       // Aucun en particulier
  | 'darija'     // Marocain
  | 'egyptian'   // Égyptien
  | 'levantine'  // Levantin (libanais, syrien, palestinien)
  | 'khaliji';   // Du Golfe

/** Temps quotidien disponible */
export type DailyTime = '5min' | '10min' | '15-20min' | '20min+';

/** Réponses complètes de l'onboarding */
export interface OnboardingAnswers {
  motivations: Motivation[];           // Q1 — multi-choix
  arabic_level: ArabicLevel;           // Q2 — choix unique
  primary_goal: PrimaryGoal;           // Q3 — choix unique
  dialect_contact: DialectContact;     // Q4 — choix unique
  daily_time: DailyTime;              // Q5 — choix unique
}

/** Score de pertinence par variante (0 à 1) */
export interface VariantScores {
  msa: number;
  darija: number;
  egyptian: number;
  levantine: number;
  khaliji: number;
  quranic: number;
}

/** Résultat de la recommandation */
export interface OnboardingRecommendation {
  scores: VariantScores;
  recommended: Variant;
  message_fr: string;                  // Message personnalisé expliquant la reco
  available: boolean;                  // true si la variante recommandée est dispo au MVP (= msa uniquement)
}

/** Étape courante dans le flux d'onboarding */
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 'recommendation';
