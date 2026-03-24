// app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../src/constants/theme';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { SettingRow } from '../../src/components/settings/SettingRow';
import ArabicText from '../../src/components/arabic/ArabicText';
import { clearAudioCache } from '../../src/services/audio-cache-service';
import { supabase } from '../../src/db/remote';
import { useBadges } from '../../src/hooks/useBadges';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { getLocalDB } from '../../src/db/local';

interface BadgeItem {
  id: string;
  title_fr: string;
  icon: string;
  description_fr: string;
  unlocked: number;
}

// ─── Options des sélecteurs ───────────────────────────────

const HARAKATS_OPTIONS = [
  { value: 'always',    label: 'Toujours affichés' },
  { value: 'tap_reveal',label: 'Tap pour révéler' },
  { value: 'never',     label: 'Masqués' },
  { value: 'adaptive',  label: 'Adaptatif' },
];

const TRANSLIT_OPTIONS = [
  { value: 'always',    label: 'Toujours visible' },
  { value: 'tap_reveal',label: 'Tap pour révéler' },
  { value: 'never',     label: 'Masquée' },
];

const TRANSLATION_OPTIONS = [
  { value: 'always',    label: 'Toujours visible' },
  { value: 'tap_reveal',label: 'Tap pour révéler' },
  { value: 'never',     label: 'Masquée' },
];

const FONT_SIZE_OPTIONS = [
  { value: 'small',  label: 'Petite' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'large',  label: 'Grande' },
  { value: 'xlarge', label: 'Très grande' },
];

const DIRECTION_OPTIONS = [
  { value: 'ar_to_fr', label: 'Arabe → Français' },
  { value: 'fr_to_ar', label: 'Français → Arabe' },
  { value: 'both',     label: 'Les deux en alternance' },
];

const SPEED_OPTIONS = [
  { value: 'slow',   label: 'Lent' },
  { value: 'normal', label: 'Normal' },
  { value: 'native', label: 'Natif' },
];

const GOAL_OPTIONS = [
  { value: '5',  label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '25', label: '25 min' },
];

// ─── Screen ───────────────────────────────────────────────

export default function ProfileScreen() {
  const store = useSettingsStore();
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const { allUnlockedBadges } = useBadges();
  const [allBadges, setAllBadges] = useState<BadgeItem[]>([]);

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

  // Charger les données utilisateur
  const { data: userData, refetch } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('users')
        .select('display_name, streak_current, streak_longest, total_xp, daily_goal_minutes')
        .eq('id', user.id)
        .single();
      return data;
    },
  });

  async function updateDailyGoal(minutes: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('users')
      .update({ daily_goal_minutes: parseInt(minutes, 10) })
      .eq('id', user.id);
    refetch();
  }

  function handleReset() {
    Alert.alert(
      'Réinitialiser les réglages',
      'Tous les réglages reviendront aux valeurs par défaut.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => store.resetToDefaults(),
        },
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
            await supabase.auth.signOut();
            router.replace('/(onboarding)/step1' as never);
          },
        },
      ],
    );
  }

  const dailyGoalStr = String(userData?.daily_goal_minutes ?? 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Titre */}
        <Text style={styles.screenTitle}>Profil</Text>

        {/* ── Stats utilisateur ── */}
        <View style={styles.statsCard}>
          <Text style={styles.displayName}>
            {userData?.display_name ?? 'Apprenant'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{userData?.streak_current ?? 0}</Text>
              <Text style={styles.statLabel}>jours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{userData?.total_xp ?? 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statValue}>{userData?.streak_longest ?? 0}</Text>
              <Text style={styles.statLabel}>record</Text>
            </View>
          </View>
        </View>

        {/* ── Badges ── */}
        <Text style={styles.sectionTitle}>
          BADGES · {allUnlockedBadges.length}/{allBadges.length}
        </Text>
        <View style={styles.badgesGrid}>
          {allBadges.map(badge => (
            <View
              key={badge.id}
              style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}
            >
              <Text style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>
                {badge.unlocked ? badge.icon : '🔒'}
              </Text>
              <Text
                style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}
                numberOfLines={2}
              >
                {badge.unlocked ? badge.title_fr : '???'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Affichage ── */}
        <Text style={styles.sectionTitle}>AFFICHAGE</Text>

        {/* Preview live — lit le store automatiquement, aucune prop explicite */}
        <View style={styles.previewBox}>
          <ArabicText
            withoutHarakats="كتاب"
            transliteration="kitābun"
            translation="un livre"
          >
            كِتَابٌ
          </ArabicText>
        </View>

        <View style={styles.sectionCard}>
          <SettingRow
            label="Harakats (تشكيل)"
            type="select"
            options={HARAKATS_OPTIONS}
            selectedValue={store.harakats_mode}
            onSelect={(v) => store.updateSetting('harakats_mode', v as never)}
          />
          <View style={styles.separator} />
          <SettingRow
            label="Translittération"
            type="select"
            options={TRANSLIT_OPTIONS}
            selectedValue={store.transliteration_mode}
            onSelect={(v) => store.updateSetting('transliteration_mode', v as never)}
          />
          <View style={styles.separator} />
          <SettingRow
            label="Traduction"
            type="select"
            options={TRANSLATION_OPTIONS}
            selectedValue={store.translation_mode}
            onSelect={(v) => store.updateSetting('translation_mode', v as never)}
          />
          <View style={styles.separator} />
          <SettingRow
            label="Taille du texte"
            type="select"
            options={FONT_SIZE_OPTIONS}
            selectedValue={store.font_size}
            onSelect={(v) => store.updateSetting('font_size', v as never)}
          />
        </View>

        {/* ── Exercices ── */}
        <Text style={styles.sectionTitle}>EXERCICES</Text>
        <View style={styles.sectionCard}>
          <SettingRow
            label="Sens"
            type="select"
            options={DIRECTION_OPTIONS}
            selectedValue={store.exercise_direction}
            onSelect={(v) => store.updateSetting('exercise_direction', v as never)}
          />
          <View style={styles.separator} />
          <SettingRow
            label="Vibrations"
            type="toggle"
            isOn={store.haptic_feedback}
            onToggle={(v) => store.updateSetting('haptic_feedback', v)}
          />
        </View>

        {/* ── Audio ── */}
        <Text style={styles.sectionTitle}>AUDIO</Text>
        <View style={styles.sectionCard}>
          <SettingRow
            label="Son activé"
            type="toggle"
            isOn={store.audio_enabled}
            onToggle={(v) => store.updateSetting('audio_enabled', v)}
          />
          <View style={styles.separator} />
          <SettingRow
            label="Lecture auto"
            type="toggle"
            isOn={store.audio_autoplay}
            onToggle={(v) => store.updateSetting('audio_autoplay', v)}
          />
          <View style={styles.separator} />
          <SettingRow
            label="Vitesse"
            type="select"
            options={SPEED_OPTIONS}
            selectedValue={store.audio_speed}
            onSelect={(v) => store.updateSetting('audio_speed', v as never)}
          />
          <View style={styles.separator} />
          <Pressable
            style={styles.accountRow}
            onPress={async () => {
              await clearAudioCache();
              if (Platform.OS === 'web') {
                window.alert('Cache audio vidé — Les fichiers seront re-téléchargés à la prochaine lecture.');
              } else {
                Alert.alert('Cache audio vidé', 'Les fichiers seront re-téléchargés à la prochaine lecture.');
              }
            }}
          >
            <Text style={styles.accountRowText}>Vider le cache audio</Text>
          </Pressable>
        </View>

        {/* ── Objectif ── */}
        <Text style={styles.sectionTitle}>OBJECTIF</Text>
        <View style={styles.sectionCard}>
          <SettingRow
            label="Temps quotidien"
            type="select"
            options={GOAL_OPTIONS}
            selectedValue={dailyGoalStr}
            onSelect={updateDailyGoal}
          />
        </View>

        {/* ── Compte ── */}
        <Text style={styles.sectionTitle}>COMPTE</Text>
        <View style={styles.sectionCard}>
          <Pressable style={styles.accountRow} onPress={handleReset}>
            <Text style={styles.accountRowText}>Réinitialiser les réglages</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={styles.accountRow} onPress={handleLogout}>
            <Text style={[styles.accountRowText, styles.danger]}>Se déconnecter</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Layout.screenPaddingH,
    paddingBottom: 120,
  },
  screenTitle: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing['2xl'],
  },

  // Stats card
  statsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
    ...Shadows.card,
  },
  displayName: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  badgeLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  badgeIcon: { fontSize: 36, marginBottom: 6 },
  badgeIconLocked: { opacity: 0.3 },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeTitleLocked: { color: '#AAA' },

  // Preview live
  previewBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    ...Shadows.card,
  },

  // Sections
  sectionTitle: {
    fontSize: FontSizes.small,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing['2xl'],
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Layout.cardPaddingH,
  },

  // Compte
  accountRow: {
    paddingHorizontal: Layout.cardPaddingH,
    paddingVertical: Spacing.lg,
  },
  accountRowText: {
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
  },
  danger: {
    color: Colors.error,
  },
});
