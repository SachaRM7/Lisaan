import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { getPostHog, identify } from '../src/analytics/posthog';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { supabase } from '../src/db/remote';
import { openLocalDB } from '../src/db/local';
import { initLocalSchema } from '../src/db/schema-local';
import { needsContentSync, syncContentFromCloud } from '../src/engines/content-sync';
import { startSyncListener } from '../src/engines/sync-manager';
import { pullUserDataFromCloud } from '../src/engines/user-data-pull';
import { ContentDownloadScreen } from '../src/components/ui/ContentDownloadScreen';
import { NetworkErrorScreen } from '../src/components/NetworkErrorScreen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function detectProvider(user: any): 'email' | 'google' | 'apple' {
  const provider = user?.app_metadata?.provider;
  if (provider === 'google') return 'google';
  if (provider === 'apple') return 'apple';
  return 'email';
}

export default function RootLayout() {
  const router = useRouter();
  const { isCompleted, isLoading, checkOnboardingStatus } = useOnboardingStore();
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const isGuest = useAuthStore((s) => s.isGuest);
  const authUserId = useAuthStore((s) => s.userId);
  const effectiveUserId = useAuthStore((s) => s.effectiveUserId());

  const [dbReady, setDbReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  const [fontsLoaded, _fontError] = useFonts({
    'Amiri': require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
    'Jost-Regular': require('../assets/fonts/Jost-Regular.ttf'),
    'Jost-Medium': require('../assets/fonts/Jost-Medium.ttf'),
    'Jost-SemiBold': require('../assets/fonts/Jost-SemiBold.ttf'),
    'NotoNaskhArabic': require('../assets/fonts/NotoNaskhArabic-Variable.ttf'),
  });

  // 0. Initialiser PostHog
  useEffect(() => { getPostHog(); }, []);
  useEffect(() => { if (effectiveUserId) identify(effectiveUserId); }, [effectiveUserId]);

  // 1. Initialiser SQLite au démarrage
  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    async function initDB() {
      try {
        await openLocalDB();
        await initLocalSchema();
        if (await needsContentSync()) {
          setSyncing(true);
          try {
            await syncContentFromCloud();
          } catch (_) {
            setSyncing(false);
            setSyncError(true);
            return;
          }
          setSyncing(false);
        }
        setDbReady(true);
        unsubscribeSync = startSyncListener();
      } catch (err) {
        console.error('[DB] Init error:', err);
        setSyncing(false);
        setDbReady(true);
      }
    }

    initDB();
    return () => { unsubscribeSync?.(); };
  }, []);

  // 3. Listener de session Supabase (Auth)
  useEffect(() => {
    // Récupérer une session existante au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useAuthStore.getState().setAuthUser(
          session.user.id,
          session.user.email ?? '',
          detectProvider(session.user),
        );
        pullUserDataFromCloud(session.user.id).catch(console.warn);
      }
    });

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        useAuthStore.getState().setAuthUser(
          session.user.id,
          session.user.email ?? '',
          detectProvider(session.user),
        );
        pullUserDataFromCloud(session.user.id).catch(console.warn);
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 4. Vérifier le statut d'onboarding et charger les réglages
  useEffect(() => {
    if (!dbReady) return;
    checkOnboardingStatus();
    loadSettings();
  }, [dbReady]);

  // 5. Cacher le splash screen une fois tout prêt
  const allReady = fontsLoaded && dbReady && !isLoading;
  useEffect(() => {
    if (allReady) SplashScreen.hideAsync();
  }, [allReady]);

  // 6. Routing conditionnel
  useEffect(() => {
    if (!allReady) return;

    if (!isCompleted) {
      // Onboarding pas encore fait
      router.replace('/(onboarding)/step1');
    } else if (!isGuest && !authUserId) {
      // Onboarding fait mais pas encore choisi Guest/Auth
      router.replace('/auth');
    } else {
      // Guest ou Auth → Home
      router.replace('/(tabs)/learn');
    }
  }, [allReady, isCompleted, isGuest, authUserId]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {syncError ? (
            <NetworkErrorScreen onRetry={() => { setSyncError(false); setSyncing(false); setDbReady(false); }} />
          ) : syncing ? (
            <ContentDownloadScreen />
          ) : !allReady ? null : (
            <ErrorBoundary>
              <StatusBar style="dark" backgroundColor={Colors.bg} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.bg },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="(onboarding)"
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="auth"
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="module/[id]"
                  options={{
                    animation: 'fade_from_bottom',
                    contentStyle: { backgroundColor: Colors.bg },
                  }}
                />
                <Stack.Screen
                  name="lesson/[id]"
                  options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="exercise/[id]"
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="review-session"
                  options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
                />
              </Stack>
            </ErrorBoundary>
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
