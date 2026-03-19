import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';
import { useOnboardingStore } from '../src/stores/useOnboardingStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { supabase } from '../src/db/remote';

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

  const [fontsLoaded, _fontError] = useFonts({
    'Amiri': require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
    'Inter': require('../assets/fonts/Inter-Variable.ttf'),
    'NotoNaskhArabic': require('../assets/fonts/NotoNaskhArabic-Variable.ttf'),
  });

  // S'assurer qu'une session existe (sign-in anonyme si besoin)
  // et qu'une ligne existe dans public.users pour cet utilisateur.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let userId = session?.user?.id;

      if (!session) {
        const { data } = await supabase.auth.signInAnonymously().catch(() => ({ data: null }));
        userId = data?.user?.id;
      }

      if (userId) {
        await supabase
          .from('users')
          .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
      }
    });
  }, []);

  // Vérifier le statut d'onboarding et charger les réglages au montage
  useEffect(() => {
    checkOnboardingStatus();
    loadSettings();
  }, []);

  // Cacher le splash screen une fois polices + statut chargés
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Rediriger selon le statut d'onboarding
  useEffect(() => {
    if (!fontsLoaded || isLoading) return;
    if (!isCompleted) {
      router.replace('/(onboarding)/step1');
    } else {
      router.replace('/(tabs)/learn');
    }
  }, [fontsLoaded, isLoading, isCompleted]);

  // Garder le splash visible pendant le chargement
  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
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
