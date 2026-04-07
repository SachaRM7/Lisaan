// app/(onboarding)/beta-code.tsx
// Écran optionnel de saisie du code bêta — affiché après la recommandation
// Code valide → accès bêta activé. Code absent ou invalide → accès public limité.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/ui';
import { validateBetaInviteCode } from '../../src/services/invite-beta';
import { useAuthStore } from '../../src/stores/useAuthStore';

function formatCode(value: string): string {
  // Auto-format: uppercase + tiret automatique après "LIS-"
  const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length <= 3) return raw;
  if (raw.length <= 7) return `LIS-${raw.slice(3)}`;
  return `LIS-${raw.slice(3, 7)}`;
}

export default function BetaCodeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const setBetaTester = useAuthStore((s) => s.setBetaTester);

  const [formattedCode, setFormattedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleCodeChange(value: string) {
    const formatted = formatCode(value);
    setFormattedCode(formatted);
    setError(null);
  }

  async function handleActivate() {
    if (formattedCode.length < 7) {
      setError('Entre un code valide (ex: LIS-A1B2)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validateBetaInviteCode(formattedCode);

      if (result.valid) {
        setSuccess(true);
        setBetaTester(true);
        // Petit délai pour afficher le feedback succès avant de continuer
        setTimeout(() => {
          router.replace('/auth-choice' as any);
        }, 1200);
      } else if (result.error === 'already_used') {
        setError('Ce code a déjà été utilisé.');
      } else {
        setError('Code introuvable. Vérifie le code ou saute cette étape.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.replace('/auth-choice' as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xxxl,
          justifyContent: 'center',
        }}>
          {/* Header */}
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.h1,
            color: colors.text.primary,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}>
            Accès bêta
          </Text>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            textAlign: 'center',
            marginBottom: spacing.xxl,
            lineHeight: 24,
          }}>
            Tu as un code d'invitation pour rejoindre la bêta fermée ?
          </Text>

          {/* Champ code */}
          <View style={{ marginBottom: spacing.base }}>
            <TextInput
              value={formattedCode}
              onChangeText={handleCodeChange}
              placeholder="LIS-XXXX"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="ascii-capable"
              maxLength={8}
              style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.h2,
                color: colors.text.primary,
                textAlign: 'center',
                backgroundColor: colors.background.card,
                borderRadius: borderRadius.md,
                borderWidth: 2,
                borderColor: error
                  ? colors.status.error
                  : success
                  ? colors.brand.primary
                  : colors.border.subtle,
                paddingVertical: spacing.base,
                paddingHorizontal: spacing.lg,
                letterSpacing: 4,
              }}
              editable={!loading && !success}
            />
          </View>

          {/* Message d'erreur */}
          {error && (
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.status.error,
              textAlign: 'center',
              marginBottom: spacing.base,
            }}>
              {error}
            </Text>
          )}

          {/* Message de succès */}
          {success && (
            <Text style={{
              fontFamily: typography.family.uiMedium,
              fontSize: typography.size.body,
              color: colors.brand.primary,
              textAlign: 'center',
              marginBottom: spacing.base,
            }}>
              Accès bêta activé ✓
            </Text>
          )}

          {/* Bouton Activer */}
          <View style={{ marginBottom: spacing.lg }}>
            <Button
              label={loading ? '' : success ? 'Activé !' : 'Activer'}
              variant="primary"
              onPress={handleActivate}
              disabled={loading || success || formattedCode.length < 7}
              loading={loading}
            />
          </View>

          {/* Bouton Passer */}
          <TouchableOpacity
            onPress={handleSkip}
            disabled={loading || success}
            style={{
              paddingVertical: spacing.base,
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontFamily: typography.family.uiMedium,
              fontSize: typography.size.body,
              color: colors.text.secondary,
            }}>
              Passer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Indication discrète */}
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.tiny,
            color: colors.text.secondary,
            textAlign: 'center',
          }}>
            Les testeurs bêta ont accès aux nouvelles fonctionnalités en avant-première.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
