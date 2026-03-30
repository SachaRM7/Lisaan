// app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { SettingRow } from '../../src/components/settings/SettingRow';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { RichSelectionRow } from '../../src/components/ui/RichSelectionRow';
import { SegmentedControl } from '../../src/components/ui/SegmentedControl';
import ArabicText from '../../src/components/arabic/ArabicText';
import { clearAudioCache } from '../../src/services/audio-cache-service';
import { supabase } from '../../src/db/remote';
import { useBadges } from '../../src/hooks/useBadges';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useOnboardingStore } from '../../src/stores/useOnboardingStore';
import { getLocalDB } from '../../src/db/local';
import { devCompleteAllLessons, getCompletedLessonsCount } from '../../src/db/local-queries';
import { runSync } from '../../src/engines/sync-manager';
import { syncContentFromCloud } from '../../src/engines/content-sync';
import { checkAndUnlockBadges } from '../../src/engines/badge-engine';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reset as posthogReset } from '../../src/analytics/posthog';
import { useTheme } from '../../src/contexts/ThemeContext';

interface BadgeItem {
  id: string;
  title_fr: string;
  icon: string;
  description_fr: string;
  unlocked: number;
}

// ─── Options des sélecteurs ───────────────────────────────

const HARAKATS_OPTIONS = [
  { value: 'always',     label: 'Toujours affichés',  subtitle: 'Les voyelles sont toujours visibles' },
  { value: 'tap_reveal', label: 'Tap pour révéler',   subtitle: 'Appuie sur le mot pour afficher les voyelles' },
  { value: 'never',      label: 'Masqués',            subtitle: 'Sans voyelles — niveau avancé' },
  { value: 'adaptive',   label: 'Adaptatif',          subtitle: 'Masqués automatiquement une fois mémorisé' },
];

const TRANSLIT_OPTIONS = [
  { value: 'always',     label: 'Toujours visible',  subtitle: 'La translittération est toujours affichée' },
  { value: 'tap_reveal', label: 'Tap pour révéler',  subtitle: 'Appuie pour lire la prononciation' },
  { value: 'never',      label: 'Masquée',           subtitle: 'Immersion complète — pas de translittération' },
];

const TRANSLATION_OPTIONS = [
  { value: 'always',     label: 'Toujours visible',  subtitle: 'La traduction est toujours affichée' },
  { value: 'tap_reveal', label: 'Tap pour révéler',  subtitle: 'Appuie pour voir la signification' },
  { value: 'never',      label: 'Masquée',           subtitle: 'Déchiffre le sens par toi-même' },
];

const DIRECTION_OPTIONS = [
  { value: 'ar_to_fr', label: 'Arabe → Français',       subtitle: "On te montre l'arabe, tu réponds en français" },
  { value: 'fr_to_ar', label: 'Français → Arabe',       subtitle: "On te montre le français, tu réponds en arabe" },
  { value: 'both',     label: 'Les deux en alternance', subtitle: 'Combinaison des deux directions' },
];

const TOLERANCE_OPTIONS = [
  { value: 'strict',    label: 'Strict',    subtitle: 'La réponse doit être exacte' },
  { value: 'normal',    label: 'Normal',    subtitle: '1 faute tolérée' },
  { value: 'indulgent', label: 'Indulgent', subtitle: '2 fautes + synonymes' },
];

const SPEED_OPTIONS = [
  { value: 'slow',   label: 'Lent',   subtitle: 'Idéal pour bien distinguer chaque son' },
  { value: 'normal', label: 'Normal', subtitle: 'Vitesse naturelle de conversation' },
  { value: 'native', label: 'Natif',  subtitle: 'Prononciation rapide et fluide' },
];

const GOAL_OPTIONS = [
  { value: '5',  label: '5 min',  subtitle: 'Session express' },
  { value: '10', label: '10 min', subtitle: 'Apprentissage régulier' },
  { value: '15', label: '15 min', subtitle: 'Progression soutenue' },
  { value: '25', label: '25 min', subtitle: 'Immersion intensive' },
];

const FONT_SIZE_SEGMENTS = [
  { value: 'small',  label: 'أ', fontSize: 16 },
  { value: 'medium', label: 'أ', fontSize: 22 },
  { value: 'large',  label: 'أ', fontSize: 30 },
];

// ─── Helpers ──────────────────────────────────────────────

function formatMemberSince(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `Membre depuis ${d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  } catch {
    return '';
  }
}

function findLabel(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label ?? value;
}

// ─── Séparateur vertical (stats card) ────────────────────

function StatDivider({ height }: { height: number }) {
  const { colors } = useTheme();
  return <View style={{ width: 1, height, backgroundColor: colors.border.subtle, alignSelf: 'center' }} />;
}

// ─── Colonne stat ─────────────────────────────────────────

function StatColumn({
  icon, iconColor, value, label,
}: { icon: string; iconColor: string; value: number; label: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20, color: iconColor }}>{icon}</Text>
      <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.dark, marginTop: 2 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const store = useSettingsStore();
  const router = useRouter();
  const userId = useAuthStore(s => s.effectiveUserId());
  const isGuest = useAuthStore(s => s.isGuest);
  const authEmail = useAuthStore(s => s.email);
  const storeDisplayName = useAuthStore(s => s.displayName);
  const queryClient = useQueryClient();
  const { allUnlockedBadges } = useBadges();
  const [allBadges, setAllBadges] = useState<BadgeItem[]>([]);
  const [openSheet, setOpenSheet] = useState<string | null>(null);

  // Preview fade animation
  const previewOpacity = useSharedValue(1);
  const previewStyle = useAnimatedStyle(() => ({ opacity: previewOpacity.value }));

  useEffect(() => {
    previewOpacity.value = withSequence(
      withTiming(0, { duration: 100 }),
      withTiming(1, { duration: 200 }),
    );
  }, [store.harakats_mode, store.transliteration_mode, store.translation_mode, store.font_size]);

  useEffect(() => {
    if (!userId) return;
    getLocalDB().getAllAsync<BadgeItem>(
      `SELECT b.id, b.title_fr, b.icon, b.description_fr,
              CASE WHEN ub.badge_id IS NOT NULL THEN 1 ELSE 0 END as unlocked
       FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
       ORDER BY b.sort_order`,
      [userId]
    ).then(setAllBadges);
  }, [userId, allUnlockedBadges]);

  const { data: userData, refetch } = useQuery({
    queryKey: ['user_profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('users')
        .select('display_name, streak_current, streak_longest, total_xp, daily_goal_minutes, created_at')
        .eq('id', userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  async function updateDailyGoal(minutes: string) {
    if (!userId) return;
    await supabase
      .from('users')
      .update({ daily_goal_minutes: parseInt(minutes, 10) })
      .eq('id', userId);
    refetch();
  }

  function handleReset() {
    Alert.alert(
      'Réinitialiser les réglages',
      'Tous les réglages reviendront aux valeurs par défaut.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: () => store.resetToDefaults() },
      ],
    );
  }

  function handleLogout() {
    Alert.alert(
      'Se déconnecter',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            const { isGuest: wasGuest } = useAuthStore.getState();
            if (!wasGuest) {
              await supabase.auth.signOut();
            }
            useAuthStore.getState().clearUser();
            posthogReset();
            router.replace('/auth');
          },
        },
      ],
    );
  }

  function selectAndClose(settingKey: string, value: string) {
    store.updateSetting(settingKey as never, value as never);
    setTimeout(() => setOpenSheet(null), 300);
  }

  const dailyGoalStr = String(userData?.daily_goal_minutes ?? 10);
  const resolvedName = userData?.display_name ?? storeDisplayName;
  const initial = resolvedName?.[0]?.toUpperCase() ?? 'A';
  const displayName = resolvedName ?? 'Apprenant';
  const memberSince = formatMemberSince(userData?.created_at);

  const sectionTitleStyle = {
    fontFamily: typography.family.uiBold,
    fontSize: typography.size.tiny,
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.xl,
    marginLeft: spacing.xs,
    textTransform: 'uppercase' as const,
  };

  const sectionCardStyle = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
    ...shadows.subtle,
  };

  const separatorStyle = {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing.base,
  };

  const accountRowStyle = {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  };

  // ─── Ligne réglage avec chip valeur + chevron ──────────
  function SheetRow({
    label,
    valueLabel,
    sheetKey,
  }: { label: string; valueLabel: string; sheetKey: string }) {
    return (
      <Pressable
        onPress={() => setOpenSheet(sheetKey)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.base,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ flex: 1, fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary }}>
          {label}
        </Text>
        <View style={{
          backgroundColor: colors.brand.light,
          borderRadius: borderRadius.pill,
          paddingVertical: 4,
          paddingHorizontal: spacing.sm,
          marginRight: spacing.xs,
        }}>
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.brand.dark }}>
            {valueLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>

      {/* ── Header fixe ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        height: 56,
      }}>
        <View style={{ width: 32 }} />
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.h2, color: colors.text.primary }}>
          Mon Parcours
        </Text>
        <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone Identité ── */}
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.brand.light,
            borderWidth: 2, borderColor: colors.brand.primary,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.brand.dark }}>
              {initial}
            </Text>
          </View>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, marginTop: spacing.base }}>
            {displayName}
          </Text>
          {!isGuest && authEmail ? (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, marginTop: spacing.micro }}>
              {authEmail}
            </Text>
          ) : null}
          {memberSince ? (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, marginTop: spacing.micro }}>
              {memberSince}
            </Text>
          ) : null}
        </View>

        {/* ── Bannière conversion Guest → Auth ── */}
        {isGuest && (
          <View style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.base,
            backgroundColor: colors.brand.light,
            borderRadius: borderRadius.lg,
            padding: spacing.base,
            borderWidth: 1,
            borderColor: colors.brand.primary + '33',
            gap: spacing.sm,
          }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.brand.dark }}>
              ☁️ Sauvegarde ta progression
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary, lineHeight: 20 }}>
              Crée un compte pour ne rien perdre et synchroniser tes appareils.
            </Text>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                alignItems: 'center',
              })}
              onPress={() => router.push('/auth?mode=convert' as any)}
            >
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.small, color: colors.text.inverse }}>
                Créer un compte
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Zone Dashboard SRS ── */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.base,
          marginHorizontal: spacing.lg,
          ...shadows.medium,
        }}>
          <StatColumn icon="🔥" iconColor={colors.accent.gold} value={userData?.streak_current ?? 0} label="jours" />
          <StatDivider height={48} />
          <StatColumn icon="⭐" iconColor={colors.brand.primary} value={userData?.total_xp ?? 0} label="XP total" />
          <StatDivider height={48} />
          <StatColumn icon="🏆" iconColor={colors.accent.gold} value={userData?.streak_longest ?? 0} label="record" />
        </View>

        {/* ── MES ACCOMPLISSEMENTS ── */}
        <View style={{
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginHorizontal: spacing.lg,
          marginTop: spacing.xl,
        }}>
          <Text style={{
            fontFamily: typography.family.uiBold,
            fontSize: typography.size.tiny,
            color: colors.text.secondary,
            letterSpacing: typography.letterSpacing.caps,
            textTransform: 'uppercase',
            marginBottom: spacing.base,
          }}>
            MES ACCOMPLISSEMENTS
          </Text>

          {allBadges.length === 0 ? (
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              Complete ta première leçon pour débloquer des badges 🏅
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base }}>
              {allBadges.map(badge => {
                const isUnlocked = badge.unlocked === 1;
                return (
                  <View key={badge.id} style={{
                    width: '30%',
                    aspectRatio: 1,
                    backgroundColor: colors.background.card,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing.xs,
                    opacity: isUnlocked ? 1 : 0.5,
                    ...(isUnlocked ? shadows.subtle : {}),
                  }}>
                    <Text style={{ fontSize: 32, opacity: isUnlocked ? 1 : 0.3, marginBottom: spacing.micro }}>
                      {badge.icon}
                    </Text>
                    <Text numberOfLines={2} style={{
                      fontFamily: typography.family.ui,
                      fontSize: typography.size.tiny,
                      color: isUnlocked ? colors.text.primary : colors.text.secondary,
                      textAlign: 'center',
                    }}>
                      {isUnlocked ? badge.title_fr : '???'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════════════════ */}
        {/* ── Réglages ── */}
        {/* ════════════════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: spacing.lg }}>

          {/* ── Affichage ── */}
          <Text style={sectionTitleStyle}>AFFICHAGE</Text>

          {/* Preview live */}
          <Reanimated.View style={[{
            backgroundColor: colors.background.card,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border.medium,
            borderStyle: 'dashed',
            ...shadows.subtle,
          }, previewStyle]}>
            <ArabicText
              withoutHarakats="كتاب"
              transliteration="kitābun"
              translation="un livre"
            >
              كِتَابٌ
            </ArabicText>
          </Reanimated.View>

          <View style={sectionCardStyle}>
            <SheetRow
              label="Harakats (تشكيل)"
              valueLabel={findLabel(HARAKATS_OPTIONS, store.harakats_mode)}
              sheetKey="harakats"
            />
            <View style={separatorStyle} />
            <SheetRow
              label="Translittération"
              valueLabel={findLabel(TRANSLIT_OPTIONS, store.transliteration_mode)}
              sheetKey="translit"
            />
            <View style={separatorStyle} />
            <SheetRow
              label="Traduction"
              valueLabel={findLabel(TRANSLATION_OPTIONS, store.translation_mode)}
              sheetKey="translation"
            />
            <View style={separatorStyle} />
            {/* Taille du texte — SegmentedControl inline */}
            <View style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.base, gap: spacing.xs }}>
              <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary, marginBottom: spacing.xs }}>
                Taille du texte
              </Text>
              <SegmentedControl
                segments={FONT_SIZE_SEGMENTS}
                value={store.font_size}
                onChange={(v) => store.updateSetting('font_size', v as never)}
              />
            </View>
          </View>

          {/* ── Exercices ── */}
          <Text style={sectionTitleStyle}>EXERCICES</Text>
          <View style={sectionCardStyle}>
            <SheetRow
              label="Sens"
              valueLabel={findLabel(DIRECTION_OPTIONS, store.exercise_direction)}
              sheetKey="direction"
            />
            <View style={separatorStyle} />
            <SheetRow
              label="Tolérance (réponse écrite)"
              valueLabel={findLabel(TOLERANCE_OPTIONS, store.write_tolerance)}
              sheetKey="tolerance"
            />
            <View style={separatorStyle} />
            <SettingRow
              label="Vibrations"
              type="toggle"
              isOn={store.haptic_feedback}
              onToggle={(v) => store.updateSetting('haptic_feedback', v)}
            />
          </View>

          {/* ── Audio ── */}
          <Text style={sectionTitleStyle}>AUDIO</Text>
          <View style={sectionCardStyle}>
            <SettingRow
              label="Son activé"
              type="toggle"
              isOn={store.audio_enabled}
              onToggle={(v) => store.updateSetting('audio_enabled', v)}
            />
            <View style={separatorStyle} />
            <SettingRow
              label="Lecture auto"
              type="toggle"
              isOn={store.audio_autoplay}
              onToggle={(v) => store.updateSetting('audio_autoplay', v)}
            />
            <View style={separatorStyle} />
            <SheetRow
              label="Vitesse"
              valueLabel={findLabel(SPEED_OPTIONS, store.audio_speed)}
              sheetKey="speed"
            />
            <View style={separatorStyle} />
            <Pressable
              style={accountRowStyle}
              onPress={async () => {
                await clearAudioCache();
                if (Platform.OS === 'web') {
                  window.alert('Cache audio vidé — Les fichiers seront re-téléchargés à la prochaine lecture.');
                } else {
                  Alert.alert('Cache audio vidé', 'Les fichiers seront re-téléchargés à la prochaine lecture.');
                }
              }}
            >
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                Vider le cache audio
              </Text>
            </Pressable>
          </View>

          {/* ── Objectif ── */}
          <Text style={sectionTitleStyle}>OBJECTIF</Text>
          <View style={sectionCardStyle}>
            <SheetRow
              label="Temps quotidien"
              valueLabel={findLabel(GOAL_OPTIONS, dailyGoalStr)}
              sheetKey="goal"
            />
          </View>

          {/* ── Compte ── */}
          <Text style={sectionTitleStyle}>COMPTE</Text>
          <View style={sectionCardStyle}>
            <Pressable style={accountRowStyle} onPress={handleReset}>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                Réinitialiser les réglages
              </Text>
            </Pressable>
            <View style={separatorStyle} />
            <Pressable style={accountRowStyle} onPress={handleLogout}>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.status.error }}>
                Se déconnecter
              </Text>
            </Pressable>
          </View>

          {/* ── DEV ONLY ── */}
          {__DEV__ && (
            <>
              <Text style={sectionTitleStyle}>DEV</Text>
              <View style={sectionCardStyle}>
                <Pressable
                  style={accountRowStyle}
                  onPress={async () => {
                    try {
                      if (!userId) { Alert.alert('Non connecté'); return; }
                      const count = await devCompleteAllLessons(userId);
                      const lessonCount = await getCompletedLessonsCount(userId);
                      await checkAndUnlockBadges({ userId, lessonCount, isPerfectScore: true, streakDays: 30 });
                      await queryClient.invalidateQueries({ queryKey: ['progress'] });
                      runSync().catch(() => {});
                      Alert.alert('✅ Dev', `${count} leçons marquées complètes`);
                    } catch (e: any) {
                      Alert.alert('Erreur', e?.message ?? String(e));
                    }
                  }}
                >
                  <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                    Compléter toutes les leçons
                  </Text>
                </Pressable>

                <View style={separatorStyle} />
                <Pressable
                  style={accountRowStyle}
                  onPress={async () => {
                    Alert.alert(
                      'Reset onboarding',
                      'Vide AsyncStorage et repart depuis le début (onboarding). Les données SQLite sont conservées.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Reset',
                          style: 'destructive',
                          onPress: async () => {
                            // Reset isCompleted EN PREMIER — avant clearUser() qui déclenche le routing
                            useOnboardingStore.setState({ isCompleted: false, isLoading: false });
                            useAuthStore.getState().clearUser();
                            await AsyncStorage.clear();
                            router.replace('/(onboarding)/step1');
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.status.error }}>
                    Reset onboarding (dev)
                  </Text>
                </Pressable>

                <View style={separatorStyle} />
                <Pressable
                  style={accountRowStyle}
                  onPress={async () => {
                    try {
                      const db = getLocalDB();
                      await db.runAsync('DELETE FROM sync_metadata');
                      const result = await syncContentFromCloud();
                      const lessonCount = result.tables.lessons?.synced ?? 0;
                      const errors = result.errors.length > 0 ? `\nErreurs: ${result.errors.join(', ')}` : '';
                      await queryClient.invalidateQueries();
                      Alert.alert('✅ Sync forcé', `${lessonCount} leçons syncées${errors}`);
                    } catch (e: any) {
                      Alert.alert('Erreur sync', e?.message ?? String(e));
                    }
                  }}
                >
                  <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                    Force re-sync contenu
                  </Text>
                </Pressable>
              </View>
            </>
          )}

        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════ */}
      {/* ── Bottom Sheets ── */}
      {/* ════════════════════════════════════════════════════ */}

      <BottomSheet
        visible={openSheet === 'harakats'}
        onClose={() => setOpenSheet(null)}
        title="Harakats (تشكيل)"
      >
        {HARAKATS_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={store.harakats_mode === opt.value}
            onPress={() => selectAndClose('harakats_mode', opt.value)}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'translit'}
        onClose={() => setOpenSheet(null)}
        title="Translittération"
      >
        {TRANSLIT_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={store.transliteration_mode === opt.value}
            onPress={() => selectAndClose('transliteration_mode', opt.value)}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'translation'}
        onClose={() => setOpenSheet(null)}
        title="Traduction"
      >
        {TRANSLATION_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={store.translation_mode === opt.value}
            onPress={() => selectAndClose('translation_mode', opt.value)}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'direction'}
        onClose={() => setOpenSheet(null)}
        title="Sens des exercices"
      >
        {DIRECTION_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={store.exercise_direction === opt.value}
            onPress={() => selectAndClose('exercise_direction', opt.value)}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'tolerance'}
        onClose={() => setOpenSheet(null)}
        title="Tolérance (réponse écrite)"
      >
        {TOLERANCE_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={store.write_tolerance === opt.value}
            onPress={() => selectAndClose('write_tolerance', opt.value)}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'speed'}
        onClose={() => setOpenSheet(null)}
        title="Vitesse audio"
      >
        {SPEED_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={store.audio_speed === opt.value}
            onPress={() => selectAndClose('audio_speed', opt.value)}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'goal'}
        onClose={() => setOpenSheet(null)}
        title="Objectif quotidien"
      >
        {GOAL_OPTIONS.map(opt => (
          <RichSelectionRow
            key={opt.value}
            title={opt.label}
            subtitle={opt.subtitle}
            selected={dailyGoalStr === opt.value}
            onPress={() => {
              updateDailyGoal(opt.value);
              setTimeout(() => setOpenSheet(null), 300);
            }}
          />
        ))}
      </BottomSheet>

    </SafeAreaView>
  );
}
