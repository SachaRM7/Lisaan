import { create } from 'zustand';
import type {
  User,
  OnboardingAnswers,
  VariantType,
} from '../types';

// Re-export the new settings store as the canonical useSettingsStore
export { useSettingsStore } from './useSettingsStore';

// ─── User Store ───────────────────────────────────────────

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
  addXp: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setOnboardingAnswers: (answers: OnboardingAnswers) => void;
  setActiveVariant: (variant: VariantType) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnboarded: false,

  setUser: (user) => set({
    user,
    isAuthenticated: true,
    isOnboarded: user.onboarding_answers !== null,
  }),

  clearUser: () => set({
    user: null,
    isAuthenticated: false,
    isOnboarded: false,
  }),

  addXp: (amount) => set((state) => ({
    user: state.user ? { ...state.user, total_xp: state.user.total_xp + amount } : null,
  })),

  incrementStreak: () => set((state) => {
    if (!state.user) return {};
    const newStreak = state.user.streak_current + 1;
    return {
      user: {
        ...state.user,
        streak_current: newStreak,
        streak_longest: Math.max(newStreak, state.user.streak_longest),
      },
    };
  }),

  resetStreak: () => set((state) => ({
    user: state.user ? { ...state.user, streak_current: 0 } : null,
  })),

  setOnboardingAnswers: (answers) => set((state) => ({
    user: state.user ? { ...state.user, onboarding_answers: answers } : null,
    isOnboarded: true,
  })),

  setActiveVariant: (variant) => set((state) => ({
    user: state.user ? { ...state.user, active_variant: variant } : null,
  })),
}));

// ─── Progress Store ───────────────────────────────────────

interface ProgressState {
  /** Module completion percentages by module ID */
  moduleProgress: Record<string, number>;
  /** Lesson statuses by lesson ID */
  lessonStatuses: Record<string, 'locked' | 'available' | 'in_progress' | 'completed'>;
  /** Total cards due for SRS review */
  cardsDue: number;
  /** Total cards in the system */
  cardsTotal: number;
  /** Mastery percentage */
  mastery: number;

  setModuleProgress: (moduleId: string, percent: number) => void;
  setLessonStatus: (lessonId: string, status: 'locked' | 'available' | 'in_progress' | 'completed') => void;
  setSrsStats: (due: number, total: number, mastery: number) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  moduleProgress: {},
  lessonStatuses: {},
  cardsDue: 0,
  cardsTotal: 0,
  mastery: 0,

  setModuleProgress: (moduleId, percent) => set((s) => ({
    moduleProgress: { ...s.moduleProgress, [moduleId]: percent },
  })),

  setLessonStatus: (lessonId, status) => set((s) => ({
    lessonStatuses: { ...s.lessonStatuses, [lessonId]: status },
  })),

  setSrsStats: (due, total, mastery) => set({ cardsDue: due, cardsTotal: total, mastery }),
}));
