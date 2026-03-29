// src/stores/useAuthStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  // Identity
  userId: string | null;        // Supabase Auth UID (null if guest)
  isGuest: boolean;             // true = pas de compte, false = auth
  guestId: string | null;       // UUID local généré pour le guest
  email: string | null;         // email du compte auth (null si guest)
  authProvider: 'email' | 'google' | 'apple' | null;
  displayName: string | null;   // Pseudo/prénom saisi lors de l'inscription

  // Computed — source de vérité unique pour les opérations de données
  effectiveUserId: () => string | null;

  // Actions
  setUserId: (id: string | null) => void;  // compat backwards (device_id)
  setGuestMode: (guestId: string) => void;
  setAuthUser: (
    userId: string,
    email: string,
    provider: 'email' | 'google' | 'apple'
  ) => void;
  setDisplayName: (name: string | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      isGuest: false,
      guestId: null,
      email: null,
      authProvider: null,
      displayName: null,

      effectiveUserId: () => {
        const { isGuest, guestId, userId } = get();
        return isGuest ? guestId : userId;
      },

      setUserId: (id) => set({ userId: id }),

      setGuestMode: (guestId) =>
        set({
          isGuest: true,
          guestId,
          userId: null,
          email: null,
          authProvider: null,
        }),

      setAuthUser: (userId, email, provider) =>
        set({
          isGuest: false,
          userId,
          email,
          authProvider: provider,
          guestId: null,
        }),

      setDisplayName: (name) => set({ displayName: name }),

      clearUser: () =>
        set({
          userId: null,
          isGuest: false,
          guestId: null,
          email: null,
          authProvider: null,
          displayName: null,
        }),
    }),
    {
      name: 'lisaan-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persiste uniquement les données — pas les fonctions
      partialize: (state) => ({
        userId: state.userId,
        isGuest: state.isGuest,
        guestId: state.guestId,
        email: state.email,
        authProvider: state.authProvider,
        displayName: state.displayName,
      }),
    }
  )
);
