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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { openLocalDB } from '../src/db/local';
import { initLocalSchema } from '../src/db/schema-local';
import { needsContentSync, syncContentFromCloud } from '../src/engines/content-sync';
import { startSyncListener } from '../src/engines/sync-manager';
import { ContentDownloadScreen } from '../src/components/ui/ContentDownloadScreen';
import { NetworkErrorScreen } from '../src/components/NetworkErrorScreen';

const DEVICE_ID_KEY = 'lisaan_device_id';

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

export default function RootLayout() {
  const router = useRouter();
  const { isCompleted, isLoading, checkOnboardingStatus } = useOnboardingStore();
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const setUserId = useAuthStore((s) => s.setUserId);
  const userId = useAuthStore((s) => s.userId);

  const [dbReady, setDbReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  const [fontsLoaded, _fontError] = useFonts({
    'Amiri': require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
    'Inter': require('../assets/fonts/Inter-Variable.ttf'),
    'NotoNaskhArabic': require('../assets/fonts/NotoNaskhArabic-Variable.ttf'),
  });

  // 0. Initialiser Sentry + PostHog
  useEffect(() => { getPostHog(); }, []);
  useEffect(() => { if (userId) identify(userId); }, [userId]);

  // 1. Initialiser SQLite au démarrage
  useEffect(() => {
    let unsubscribeSync: (() => void) | undefined;

    async function initDB() {
      try {
        // Ouvrir la base SQLite
        await openLocalDB();
        // Créer les tables si besoin
        await initLocalSchema();
        // Sync contenu si premier lancement
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
        // Lancer le listener de sync réseau
        unsubscribeSync = startSyncListener();
      } catch (err) {
        console.error('[DB] Init error:', err);
        // Mode dégradé : continuer même en cas d'erreur
        setSyncing(false);
        setDbReady(true);
      }
    }

    initDB();

    return () => {
      unsubscribeSync?.();
    };
  }, []);

  // 2. Initialiser le device_id local (pas besoin de Supabase Auth)
  useEffect(() => {
    if (!dbReady) return;

    async function initDeviceId() {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
      setUserId(deviceId);
    }

    initDeviceId().catch(err => console.error('[Auth] device_id error:', err));
  }, [dbReady]);

  // 3. Vérifier le statut d'onboarding et charger les réglages
  useEffect(() => {
    if (!dbReady) return;
    checkOnboardingStatus();
    loadSettings();
  }, [dbReady]);

  // 4. Cacher le splash screen une fois polices + DB + statut chargés
  useEffect(() => {
    if (fontsLoaded && dbReady && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady, isLoading]);

  // 5. Rediriger selon le statut d'onboarding
  useEffect(() => {
    if (!fontsLoaded || !dbReady || isLoading) return;
    if (!isCompleted) {
      router.replace('/(onboarding)/step1');
    } else {
      router.replace('/(tabs)/learn');
    }
  }, [fontsLoaded, dbReady, isLoading, isCompleted]);

  if (syncError) {
    return <NetworkErrorScreen onRetry={() => { setSyncError(false); setSyncing(false); setDbReady(false); }} />;
  }

  if (syncing) {
    return <ContentDownloadScreen />;
  }

  // Garder le splash visible pendant le chargement
  if (!fontsLoaded || !dbReady || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
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
            name="onboarding"
            options={{ animation: 'fade', gestureEnabled: false }}
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
