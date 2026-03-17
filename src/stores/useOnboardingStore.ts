// src/stores/useOnboardingStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingAnswers,
  OnboardingRecommendation,
  OnboardingStep,
  Motivation,
  ArabicLevel,
  PrimaryGoal,
  DialectContact,
  DailyTime,
} from '../types/onboarding';
import { computeRecommendation, dailyTimeToMinutes } from '../engines/onboarding-scorer';

const ONBOARDING_COMPLETED_KEY = 'lisaan_onboarding_completed';

interface OnboardingState {
  // État du flux
  currentStep: OnboardingStep;
  isCompleted: boolean;
  isLoading: boolean;

  // Réponses partielles (remplies au fur et à mesure)
  motivations: Motivation[];
  arabicLevel: ArabicLevel | null;
  primaryGoal: PrimaryGoal | null;
  dialectContact: DialectContact | null;
  dailyTime: DailyTime | null;

  // Résultat
  recommendation: OnboardingRecommendation | null;

  // Actions
  setMotivations: (m: Motivation[]) => void;
  setArabicLevel: (l: ArabicLevel) => void;
  setPrimaryGoal: (g: PrimaryGoal) => void;
  setDialectContact: (d: DialectContact) => void;
  setDailyTime: (t: DailyTime) => void;
  goToStep: (step: OnboardingStep) => void;
  computeAndSetRecommendation: () => void;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<boolean>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  isCompleted: false,
  isLoading: true,
  motivations: [],
  arabicLevel: null,
  primaryGoal: null,
  dialectContact: null,
  dailyTime: null,
  recommendation: null,

  setMotivations: (m) => set({ motivations: m }),
  setArabicLevel: (l) => set({ arabicLevel: l }),
  setPrimaryGoal: (g) => set({ primaryGoal: g }),
  setDialectContact: (d) => set({ dialectContact: d }),
  setDailyTime: (t) => set({ dailyTime: t }),
  goToStep: (step) => set({ currentStep: step }),

  computeAndSetRecommendation: () => {
    const { motivations, arabicLevel, primaryGoal, dialectContact, dailyTime } = get();
    if (!arabicLevel || !primaryGoal || !dialectContact || !dailyTime) return;

    const answers: OnboardingAnswers = {
      motivations,
      arabic_level: arabicLevel,
      primary_goal: primaryGoal,
      dialect_contact: dialectContact,
      daily_time: dailyTime,
    };

    const recommendation = computeRecommendation(answers);
    set({ recommendation, currentStep: 'recommendation' });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    set({ isCompleted: true });
  },

  checkOnboardingStatus: async () => {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    const completed = value === 'true';
    set({ isCompleted: completed, isLoading: false });
    return completed;
  },

  reset: () => set({
    currentStep: 1,
    motivations: [],
    arabicLevel: null,
    primaryGoal: null,
    dialectContact: null,
    dailyTime: null,
    recommendation: null,
  }),
}));

export { dailyTimeToMinutes };
