// app/auth-choice.tsx
// Écran de choix Auth / Guest — affiché après l'onboarding

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '../src/stores/useAuthStore';
import { upsertSettings } from '../src/db/local-queries';
import { useTheme } from '../src/contexts/ThemeContext';
import { DEFAULT_SETTINGS } from '../src/types/settings';

export default function AuthChoiceScreen() {
  const router = useRouter();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  async function handleGuestMode() {
    const guestId = Crypto.randomUUID();
    useAuthStore.getState().setGuestMode(guestId);
    // Écrire les réglages par défaut pour ce guestId
    try {
      await upsertSettings(guestId, DEFAULT_SETTINGS);
    } catch (e) {
      console.warn('[AuthChoice] upsertSettings error:', e);
    }
    router.replace('/(tabs)/learn');
  }

  function handleCreateAccount() {
    router.push('/auth-screen?mode=signup' as any);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]} edges={['top', 'bottom']}>
      <View style={styles.content}>

        {/* Header arabe */}
        <View style={styles.logoArea}>
          <Text style={[styles.logoAr, { color: colors.brand.primary }]}>
            لِسَان
          </Text>
          <Text style={[styles.tagline, {
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
            letterSpacing: 1.5,
          }]}>
            APPRENDRE L'ARABE
          </Text>
        </View>

        {/* Texte principal */}
        <View style={styles.textArea}>
          <Text style={[styles.title, {
            fontFamily: typography.family.uiBold,
            fontSize: 26,
            color: colors.text.primary,
          }]}>
            Prêt à commencer ?
          </Text>
          <Text style={[styles.subtitle, {
            fontFamily: typography.family.ui,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            lineHeight: 24,
          }]}>
            Crée un compte pour sauvegarder ta progression sur tous tes appareils et ne jamais perdre ton travail.
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.buttons}>

          {/* Bouton principal — Créer un compte */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
                borderRadius: borderRadius.lg,
                ...shadows.subtle,
              },
            ]}
            onPress={handleCreateAccount}
            accessibilityRole="button"
            accessibilityLabel="Créer un compte"
          >
            <Text style={[styles.primaryBtnText, {
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.body,
              color: colors.text.inverse,
            }]}>
              Créer un compte
            </Text>
          </Pressable>

          {/* Bouton secondaire — Continuer sans compte */}
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderRadius: borderRadius.lg,
                borderColor: colors.border.medium,
                backgroundColor: pressed ? colors.background.group : colors.background.card,
              },
            ]}
            onPress={handleGuestMode}
            accessibilityRole="button"
            accessibilityLabel="Continuer sans compte"
          >
            <Text style={[styles.secondaryBtnText, {
              fontFamily: typography.family.uiBold,
              fontSize: typography.size.body,
              color: colors.text.primary,
            }]}>
              Continuer sans compte
            </Text>
          </Pressable>

        </View>

        {/* Note discrète */}
        <Text style={[styles.note, {
          fontFamily: typography.family.ui,
          fontSize: typography.size.tiny,
          color: colors.text.secondary,
        }]}>
          Tu pourras créer un compte plus tard depuis ton profil.
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 8,
  },
  logoAr: {
    fontSize: 56,
    fontFamily: 'Amiri-Bold',
  },
  tagline: {
    textAlign: 'center',
  },
  textArea: {
    gap: 14,
    paddingHorizontal: 4,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  buttons: {
    gap: 14,
  },
  primaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {},
  secondaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryBtnText: {},
  note: {
    textAlign: 'center',
    paddingBottom: 8,
  },
});
