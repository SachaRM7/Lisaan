// app/auth.tsx
// Écran d'authentification unifié — signup, login, convert
// Fusionne auth-choice.tsx + auth-screen.tsx

import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Platform, ScrollView, ActivityIndicator, KeyboardAvoidingView,
  LayoutAnimation, UIManager, Linking,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { supabase } from '../src/db/remote';
import { useAuthStore } from '../src/stores/useAuthStore';
import { upsertSettings } from '../src/db/local-queries';
import { DEFAULT_SETTINGS } from '../src/types/settings';
import { migrateGuestToAuth } from '../src/engines/guest-migration';
import { useTheme } from '../src/contexts/ThemeContext';

// Activer LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Compléter la session OAuth dans le browser
if (Platform.OS !== 'web') {
  import('expo-web-browser').then(({ maybeCompleteAuthSession }) => maybeCompleteAuthSession());
}

// ── Logo Google multicolore ──────────────────────────────────
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
  const { colors, typography } = useTheme();

  const [isLogin, setIsLogin] = useState<boolean>(mode === 'login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isConvert = mode === 'convert';
  const showGuestLink = mode !== 'convert' && mode !== 'login';
  const showSignup = !isLogin || isConvert;

  function toggleMode() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
    setError(null);
  }

  // ── Helpers ─────────────────────────────────────────────────

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
    if (isConvert) {
      await migrateGuestToAuth(userId);
      router.replace('/(tabs)/profile' as any);
    } else {
      try { await upsertSettings(userId, DEFAULT_SETTINGS); } catch (_) {}
      router.replace('/(tabs)/learn');
    }
  }

  // ── Guest mode ───────────────────────────────────────────────

  async function handleGuestMode() {
    const guestId = Crypto.randomUUID();
    useAuthStore.getState().setGuestMode(guestId);
    try {
      await upsertSettings(guestId, DEFAULT_SETTINGS);
    } catch (e) {
      console.warn('[Auth] upsertSettings guest error:', e);
    }
    router.replace('/(tabs)/learn');
  }

  // ── Inscription email ────────────────────────────────────────

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

  // ── Connexion email ──────────────────────────────────────────

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

  // ── Apple Sign In ────────────────────────────────────────────
  // TODO: Activer quand Apple OAuth sera configuré dans Supabase Dashboard
  // @ts-ignore — sera utilisé quand OAuth Apple sera activé
  async function _handleAppleSignIn() {
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

  // ── Google Sign In ───────────────────────────────────────────
  // TODO: Activer quand Google OAuth sera configuré dans Supabase Dashboard
  // @ts-ignore — sera utilisé quand OAuth Google sera activé
  async function _handleGoogleSignIn() {
    // setError(null);
    // setLoading(true);
    // try {
    //   const { makeRedirectUri } = await import('expo-auth-session');
    //   const WebBrowser = await import('expo-web-browser');
    //   const redirectUrl = makeRedirectUri({ scheme: 'lisaan' });
    //   const { data, error: authError } = await supabase.auth.signInWithOAuth({
    //     provider: 'google',
    //     options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
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
    //           await onAuthSuccess(sessionData.user.id, sessionData.user.email ?? '', 'google');
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

  // ── Render ───────────────────────────────────────────────────

  const cardTitleText = isConvert
    ? 'Créer un compte'
    : isLogin ? 'Bienvenue' : 'Créer un compte';

  const submitLabel = isLogin && !isConvert ? 'SE CONNECTER' : 'CRÉER MON COMPTE';

  function fieldStyle(fieldName: string) {
    const focused = focusedField === fieldName;
    return {
      backgroundColor: colors.background.main,
      borderColor: focused ? colors.brand.primary : colors.border.subtle,
      borderWidth: focused ? 1.5 : 1,
    };
  }

  const inputTextStyle = {
    fontFamily: typography.family.uiMedium,
    fontSize: 13,
    color: colors.text.primary,
    letterSpacing: 1,
  } as const;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ── A — Hero Arabe ── */}
          <View style={styles.heroArea}>
            <View>
              <Text style={[styles.heroAr, { color: colors.brand.primary }]}>
                لِسَان
              </Text>
            </View>
            <Text style={[styles.heroLatin, { color: colors.brand.primary }]}>
              LISAAN
            </Text>
          </View>

          {/* ── B — Card principale ── */}
          <View style={[styles.card, {
            backgroundColor: colors.background.card,
            shadowColor: colors.shadowColor,
          }]}>

            {/* B1 — Header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                {cardTitleText}
              </Text>
              {!isConvert && (
                <Pressable onPress={toggleMode} hitSlop={12}>
                  <Text style={[styles.toggleText, {
                    color: colors.brand.primary,
                    borderBottomColor: 'rgba(15, 98, 76, 0.25)',
                  }]}>
                    {isLogin ? "S'INSCRIRE" : 'SE CONNECTER'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* B2 — Champs */}

            {/* Prénom (inscription / convert) */}
            {showSignup && (
              <View style={[styles.fieldWrap, fieldStyle('name')]}>
                <TextInput
                  style={[styles.input, inputTextStyle]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Prénom ou pseudo"
                  placeholderTextColor={colors.text.secondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            )}

            {/* Email */}
            <View style={[styles.fieldWrap, fieldStyle('email')]}>
              <TextInput
                style={[styles.input, inputTextStyle]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Mot de passe */}
            <View style={[styles.fieldWrap, fieldStyle('password')]}>
              <TextInput
                style={[styles.input, styles.passwordInput, inputTextStyle]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe"
                placeholderTextColor={colors.text.secondary}
                secureTextEntry={!showPassword}
                autoComplete={showSignup ? 'new-password' : 'current-password'}
                textContentType={showSignup ? 'newPassword' : 'password'}
                returnKeyType="done"
                onSubmitEditing={showSignup ? handleSignUp : handleSignIn}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
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

            {/* Erreur inline */}
            {error && (
              <Text style={[styles.errorText, { color: colors.status.error }]}>
                {error}
              </Text>
            )}

            {/* B3 — Bouton CTA */}
            <View style={styles.ctaWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.ctaBtn,
                  {
                    backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
                    shadowColor: colors.brand.primary,
                    opacity: loading ? 0.75 : 1,
                  },
                ]}
                onPress={showSignup ? handleSignUp : handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text.inverse} size="small" />
                ) : (
                  <>
                    <Text style={[styles.ctaBtnText, { color: colors.text.inverse }]}>
                      {submitLabel}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.text.inverse} />
                  </>
                )}
              </Pressable>
            </View>

            {/* B4 — Séparateur OU */}
            <View style={styles.separator}>
              <View style={[styles.sepLine, { backgroundColor: colors.border.subtle }]} />
              <Text style={[styles.sepText, { color: colors.text.secondary }]}>
                OU
              </Text>
              <View style={[styles.sepLine, { backgroundColor: colors.border.subtle }]} />
            </View>

            {/* B5 — OAuth Apple (iOS seulement) */}
            {Platform.OS === 'ios' && (
              <Pressable
                style={({ pressed }) => [
                  styles.oauthBtn,
                  {
                    backgroundColor: pressed ? colors.background.main : colors.background.card,
                    borderColor: colors.border.subtle,
                    marginBottom: 12,
                    opacity: 0.5,
                  },
                ]}
                disabled={true}
              >
                <Ionicons name="logo-apple" size={20} color={colors.text.primary} />
                <Text style={[styles.oauthBtnText, { color: colors.text.primary }]}>
                  Continuer avec Apple
                </Text>
              </Pressable>
            )}

            {/* B5 — OAuth Google */}
            <Pressable
              style={({ pressed }) => [
                styles.oauthBtn,
                {
                  backgroundColor: pressed ? colors.background.main : colors.background.card,
                  borderColor: colors.border.subtle,
                  opacity: 0.5,
                },
              ]}
              disabled={true}
            >
              <GoogleIcon size={20} />
              <Text style={[styles.oauthBtnText, { color: colors.text.primary }]}>
                Continuer avec Google
              </Text>
            </Pressable>

            {/* B6 — Lien Guest */}
            {showGuestLink && (
              <View style={styles.guestSection}>
                <View style={[styles.guestDivider, { backgroundColor: colors.border.subtle }]} />
                <Pressable onPress={handleGuestMode}>
                  {({ pressed }) => (
                    <Text style={[styles.guestText, {
                      color: pressed ? colors.text.primary : colors.text.secondary,
                    }]}>
                      Explorer sans compte →
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

          </View>

          {/* C — Footer légal */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              En continuant, tu acceptes nos{' '}
              <Text
                style={[styles.footerLink, { color: colors.text.secondary }]}
                onPress={() => Linking.openURL('https://lisaan.app/terms')}
              >
                Conditions
              </Text>
              {' '}et notre{' '}
              <Text
                style={[styles.footerLink, { color: colors.text.secondary }]}
                onPress={() => Linking.openURL('https://lisaan.app/privacy')}
              >
                Politique de confidentialité
              </Text>
              .
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── A — Hero ──────────────────────────────────────────────
  heroArea: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  heroAr: {
    fontFamily: 'Amiri-Bold',
    fontSize: 80,
    lineHeight: 120,
    textAlign: 'center',
  },
  heroLatin: {
    fontFamily: 'Jost-SemiBold',
    fontSize: 14,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: -20,
  },

  // ── B — Card ──────────────────────────────────────────────
  card: {
    width: '100%',
    marginHorizontal: 24,
    borderRadius: 32,
    padding: 32,
    // Ombre émeraude douce
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 5,
  },

  // B1 — Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  cardTitle: {
    fontFamily: 'Jost-SemiBold',
    fontSize: 26,
  },
  toggleText: {
    fontFamily: 'Jost-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    borderBottomWidth: 2,
    paddingBottom: 4,
  },

  // B2 — Champs
  fieldWrap: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeBtn: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Jost-Regular',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },

  // B3 — CTA
  ctaWrap: {
    marginTop: 24,
  },
  ctaBtn: {
    height: 58,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    // Ombre émeraude soutenue
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaBtnText: {
    fontFamily: 'Jost-SemiBold',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // B4 — Séparateur OU
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  sepLine: {
    flex: 1,
    height: 1,
  },
  sepText: {
    fontFamily: 'Jost-SemiBold',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
  },

  // B5 — OAuth
  oauthBtn: {
    height: 54,
    borderRadius: 9999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  oauthBtnText: {
    fontFamily: 'Jost-SemiBold',
    fontSize: 14,
  },

  // B6 — Guest
  guestSection: {
    marginTop: 28,
    alignItems: 'center',
    gap: 28,
  },
  guestDivider: {
    height: 1,
    alignSelf: 'stretch',
  },
  guestText: {
    fontFamily: 'Jost-Regular',
    fontSize: 15,
    textAlign: 'center',
  },

  // C — Footer
  footer: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Jost-Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
