// app/auth-screen.tsx
// Écran d'inscription / connexion — email, Google, Apple

import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Platform, ScrollView, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/db/remote';
import { useAuthStore } from '../src/stores/useAuthStore';
import { upsertSettings } from '../src/db/local-queries';
import { DEFAULT_SETTINGS } from '../src/types/settings';
import { migrateGuestToAuth } from '../src/engines/guest-migration';
import { useTheme } from '../src/contexts/ThemeContext';

// Compléter la session OAuth dans le browser (lazy — évite import.meta au démarrage web)
if (Platform.OS !== 'web') {
  import('expo-web-browser').then(({ maybeCompleteAuthSession }) => maybeCompleteAuthSession());
}

// ── Logo Google multicolore ──────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

type AuthMode = 'signup' | 'login' | 'convert';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = (params.mode as AuthMode) ?? 'signup';
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [tab, setTab] = useState<'signup' | 'login'>(mode === 'login' ? 'login' : 'signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Helpers ─────────────────────────────────────────────

  async function onAuthSuccess(
    userId: string,
    userEmail: string,
    provider: 'email' | 'google' | 'apple',
    name?: string,
  ) {
    useAuthStore.getState().setAuthUser(userId, userEmail, provider);
    if (name) {
      useAuthStore.getState().setDisplayName(name);
    }
    if (mode === 'convert') {
      // Migration Guest → Auth
      await migrateGuestToAuth(userId);
      router.replace('/(tabs)/profile' as any);
    } else {
      // Écrire les réglages par défaut dans SQLite
      try { await upsertSettings(userId, DEFAULT_SETTINGS); } catch (_) {}
      router.replace('/(tabs)/learn');
    }
  }

  // ── Inscription email ─────────────────────────────────

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName.trim() || null } },
      });
      if (authError) { setError(authError.message); return; }
      if (data.user) {
        // Pousser le display_name dans la table users (en cas d'absence de trigger)
        if (displayName.trim()) {
          try {
            await supabase
              .from('users')
              .upsert({ id: data.user.id, display_name: displayName.trim() }, { onConflict: 'id' });
          } catch (_) {}
        }
        await onAuthSuccess(data.user.id, email.trim(), 'email', displayName.trim() || undefined);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue. Vérifie ta connexion.');
    } finally {
      setLoading(false);
    }
  }

  // ── Connexion email ───────────────────────────────────

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) { setError(authError.message); return; }
      if (data.user) {
        await onAuthSuccess(data.user.id, email.trim(), 'email');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de connexion. Vérifie ta connexion réseau.');
    } finally {
      setLoading(false);
    }
  }

  // ── Apple Sign In ─────────────────────────────────────
  // TODO: Activer quand Apple OAuth sera configuré dans Supabase Dashboard
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleAppleSignIn() {
    // TODO: Activer quand Apple OAuth sera configuré dans Supabase Dashboard
    // setError(null);
    // setLoading(true);
    // try {
    //   const AppleAuthentication = await import('expo-apple-authentication');
    //   const credential = await AppleAuthentication.signInAsync({
    //     requestedScopes: [
    //       AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    //       AppleAuthentication.AppleAuthenticationScope.EMAIL,
    //     ],
    //   });
    //   if (!credential.identityToken) throw new Error('Apple token manquant');
    //   const { data, error: authError } = await supabase.auth.signInWithIdToken({
    //     provider: 'apple',
    //     token: credential.identityToken,
    //   });
    //   if (authError) { setError(authError.message); return; }
    //   if (data.user) {
    //     const name = credential.fullName?.givenName ?? undefined;
    //     await onAuthSuccess(data.user.id, data.user.email ?? '', 'apple', name);
    //   }
    // } catch (e: any) {
    //   if (e?.code === 'ERR_REQUEST_CANCELED') {
    //     // Annulé par l'utilisateur
    //   } else {
    //     setError(e?.message ?? 'Connexion Apple échouée.');
    //   }
    // } finally {
    //   setLoading(false);
    // }
  }

  // ── Google Sign In ────────────────────────────────────
  // TODO: Activer quand Google OAuth sera configuré dans Supabase Dashboard
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleGoogleSignIn() {
    // TODO: Activer quand Google OAuth sera configuré dans Supabase Dashboard
    // setError(null);
    // setLoading(true);
    // try {
    //   const { makeRedirectUri } = await import('expo-auth-session');
    //   const WebBrowser = await import('expo-web-browser');
    //   const redirectUrl = makeRedirectUri({ scheme: 'lisaan' });
    //   const { data, error: authError } = await supabase.auth.signInWithOAuth({
    //     provider: 'google',
    //     options: {
    //       redirectTo: redirectUrl,
    //       skipBrowserRedirect: true,
    //     },
    //   });
    //   if (authError) { setError(authError.message); return; }
    //   if (data.url) {
    //     const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl) as any;
    //     if (result.type === 'success' && result.url) {
    //       const url = new URL(result.url);
    //       const accessToken = url.searchParams.get('access_token');
    //       const refreshToken = url.searchParams.get('refresh_token');
    //       if (accessToken && refreshToken) {
    //         const { data: sessionData, error: sessionError } =
    //           await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    //         if (sessionError) { setError(sessionError.message); return; }
    //         if (sessionData.user) {
    //           await onAuthSuccess(
    //             sessionData.user.id,
    //             sessionData.user.email ?? '',
    //             'google',
    //           );
    //         }
    //       }
    //     }
    //   }
    // } catch (e: any) {
    //   setError(e?.message ?? 'Connexion Google échouée.');
    // } finally {
    //   setLoading(false);
    // }
  }

  // ── Render ────────────────────────────────────────────

  const isConvert = mode === 'convert';
  const titleText = isConvert
    ? 'Crée ton compte'
    : tab === 'signup' ? 'Crée ton compte' : 'Connecte-toi';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]} edges={['top', 'bottom']}>
      {/* M5 — KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* M3 — Bouton retour en haut à gauche, fixe au-dessus du scroll */}
        <View style={[styles.backHeader, { paddingHorizontal: spacing.lg, paddingTop: spacing.base }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backBtn, { borderRadius: borderRadius.sm }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Titre */}
          <View style={styles.header}>
            <Text style={[styles.title, {
              fontFamily: typography.family.uiBold,
              fontSize: 26,
              color: colors.text.primary,
            }]}>
              {titleText}
            </Text>
            {isConvert && (
              <Text style={[styles.convertSubtitle, {
                fontFamily: typography.family.ui,
                fontSize: typography.size.body,
                color: colors.text.secondary,
                lineHeight: 22,
              }]}>
                Tes données locales seront migrées vers ton nouveau compte.
              </Text>
            )}
          </View>

          {/* Tab switcher (masqué en mode convert) */}
          {!isConvert && (
            <View style={[styles.tabBar, {
              backgroundColor: colors.background.group,
              borderRadius: borderRadius.md,
            }]}>
              {(['signup', 'login'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.tab,
                    {
                      borderRadius: borderRadius.sm,
                      backgroundColor: tab === t ? colors.background.card : 'transparent',
                    },
                  ]}
                  onPress={() => { setTab(t); setError(null); }}
                >
                  <Text style={{
                    fontFamily: tab === t ? typography.family.uiBold : typography.family.ui,
                    fontSize: typography.size.body,
                    color: tab === t ? colors.text.primary : colors.text.secondary,
                  }}>
                    {t === 'signup' ? "S'inscrire" : 'Se connecter'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* OAuth Apple (iOS seulement) — désactivé, provider non configuré dans Supabase */}
          {Platform.OS === 'ios' && (
            <View>
              <Pressable
                style={[
                  styles.appleBtn,
                  {
                    borderRadius: borderRadius.lg,
                    backgroundColor: '#000000',
                    opacity: 0.4,
                  },
                ]}
                disabled={true}
              >
                <View style={styles.oauthBtnContent}>
                  <Ionicons name="logo-apple" size={20} color={colors.text.inverse} />
                  <Text style={{
                    fontFamily: typography.family.uiBold,
                    fontSize: typography.size.body,
                    color: colors.text.inverse,
                  }}>
                    Continuer avec Apple
                  </Text>
                </View>
              </Pressable>
              <Text style={[styles.comingSoon, {
                fontFamily: typography.family.ui,
                fontSize: 12,
                color: colors.text.secondary,
              }]}>
                Bientôt disponible
              </Text>
            </View>
          )}

          {/* M1 + M2 — OAuth Google : désactivé (provider non configuré), avec logo */}
          <View>
            <Pressable
              style={[
                styles.oauthBtn,
                {
                  borderRadius: borderRadius.lg,
                  borderColor: colors.border.medium,
                  backgroundColor: colors.background.card,
                  opacity: 0.4,
                },
              ]}
              disabled={true}
            >
              <View style={styles.oauthBtnContent}>
                <GoogleIcon size={20} />
                <Text style={[styles.oauthBtnText, {
                  fontFamily: typography.family.uiBold,
                  fontSize: typography.size.body,
                  color: colors.text.primary,
                }]}>
                  Continuer avec Google
                </Text>
              </View>
            </Pressable>
            <Text style={[styles.comingSoon, {
              fontFamily: typography.family.ui,
              fontSize: 12,
              color: colors.text.secondary,
            }]}>
              Bientôt disponible
            </Text>
          </View>

          {/* Séparateur */}
          <View style={styles.separator}>
            <View style={[styles.sepLine, { backgroundColor: colors.border.medium }]} />
            <Text style={[styles.sepText, {
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.text.secondary,
            }]}>
              ou
            </Text>
            <View style={[styles.sepLine, { backgroundColor: colors.border.medium }]} />
          </View>

          {/* Formulaire email */}
          <View style={styles.form}>

            {/* M4 — Prénom (inscription uniquement) */}
            {(tab === 'signup' || isConvert) && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, {
                  fontFamily: typography.family.uiBold,
                  fontSize: typography.size.small,
                  color: colors.text.secondary,
                }]}>
                  Prénom ou pseudo
                </Text>
                <TextInput
                  style={[styles.input, {
                    fontFamily: typography.family.ui,
                    fontSize: typography.size.body,
                    color: colors.text.primary,
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.medium,
                    borderRadius: borderRadius.md,
                  }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Ton prénom ou pseudo"
                  placeholderTextColor={colors.text.secondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* M4 — Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, {
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.small,
                color: colors.text.secondary,
              }]}>
                Email
              </Text>
              <TextInput
                style={[styles.input, {
                  fontFamily: typography.family.ui,
                  fontSize: typography.size.body,
                  color: colors.text.primary,
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.medium,
                  borderRadius: borderRadius.md,
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="ton@email.com"
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            </View>

            {/* M4 — Mot de passe avec icône œil */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, {
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.small,
                color: colors.text.secondary,
              }]}>
                Mot de passe
              </Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput, {
                    fontFamily: typography.family.ui,
                    fontSize: typography.size.body,
                    color: colors.text.primary,
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.medium,
                    borderRadius: borderRadius.md,
                  }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8 caractères minimum"
                  placeholderTextColor={colors.text.secondary}
                  secureTextEntry={!showPassword}
                  autoComplete={tab === 'signup' || isConvert ? 'new-password' : 'current-password'}
                  textContentType={tab === 'signup' || isConvert ? 'newPassword' : 'password'}
                  returnKeyType="done"
                  onSubmitEditing={tab === 'signup' || isConvert ? handleSignUp : handleSignIn}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Message d'erreur inline */}
            {error && (
              <Text style={[styles.errorText, {
                fontFamily: typography.family.ui,
                fontSize: typography.size.small,
                color: colors.status.error,
                backgroundColor: colors.status.errorLight,
                borderRadius: borderRadius.sm,
              }]}>
                {error}
              </Text>
            )}

            {/* Bouton principal */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
                  borderRadius: borderRadius.pill,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={tab === 'signup' || isConvert ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={[styles.submitBtnText, {
                  fontFamily: typography.family.uiBold,
                  fontSize: typography.size.body,
                  color: colors.text.inverse,
                }]}>
                  {tab === 'signup' || isConvert ? 'Créer mon compte' : 'Se connecter'}
                </Text>
              )}
            </Pressable>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // M3 — Header retour fixe
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
  },
  header: { gap: 8 },
  title: {},
  convertSubtitle: {},
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  // M2 — Layout commun aux boutons OAuth
  oauthBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  appleBtn: {
    height: 54,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  oauthBtnText: {},
  // M1 — "Bientôt disponible"
  comingSoon: {
    textAlign: 'center',
    marginTop: 4,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sepLine: { flex: 1, height: 1 },
  sepText: {},
  // M4 — Espacement groupes de champs
  form: { gap: 20 },
  fieldGroup: { gap: 6 },
  label: { textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  // M4 — Champ mot de passe avec œil
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {},
});
