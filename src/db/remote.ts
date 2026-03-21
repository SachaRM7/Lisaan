import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_URL.startsWith('https://')) {
  console.error('[remote] EXPO_PUBLIC_SUPABASE_URL manquant ou invalide:', JSON.stringify(SUPABASE_URL));
}

/**
 * Secure token storage.
 * - Native : expo-secure-store (chiffré sur l'appareil)
 * - Web    : localStorage (dev uniquement)
 */
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

// Fallback URL pour éviter le crash au démarrage si les env vars ne sont pas chargées
const safeUrl = SUPABASE_URL.startsWith('https://') ? SUPABASE_URL : 'https://placeholder.supabase.co';

export const supabase = createClient(safeUrl, SUPABASE_ANON_KEY || 'placeholder', {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
