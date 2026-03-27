// app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { SettingRow } from '../../src/components/settings/SettingRow';
import ArabicText from '../../src/components/arabic/ArabicText';
import { clearAudioCache } from '../../src/services/audio-cache-service';
import { supabase } from '../../src/db/remote';
import { useBadges } from '../../src/hooks/useBadges';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { getLocalDB } from '../../src/db/local';
import { devCompleteAllLessons, getCompletedLessonsCount } from '../../src/db/local-queries';
import { runSync } from '../../src/engines/sync-manager';
import { syncContentFromCloud } from '../../src/engines/content-sync';
import { checkAndUnlockBadges } from '../../src/engines/badge-engine';
import { useQueryClient } from '@tanstack/react-query';
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
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const store = useSettingsStore();
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const queryClient = useQueryClient();
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
            await supabase.auth.signOut();
            posthogReset();
            router.replace('/(onboarding)/step1' as never);
          },
        },
      ],
    );
  }

  const dailyGoalStr = String(userData?.daily_goal_minutes ?? 10);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Titre */}
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h1, color: colors.text.primary, marginBottom: spacing.xl }}>
          Profil
        </Text>

        {/* ── Carte stats ── */}
        <View style={{
          backgroundColor: colors.background.group,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          marginBottom: spacing.xl,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}>
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, marginBottom: spacing.lg, textAlign: 'center' }}>
            {userData?.display_name ?? 'Apprenant'}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 24 }}>🔥</Text>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.brand.primary }}>{userData?.streak_current ?? 0}</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>jours</Text>
            </View>
            <View style={{ width: 1, height: 40, backgroundColor: colors.border.medium }} />
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 24 }}>⭐</Text>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.brand.primary }}>{userData?.total_xp ?? 0}</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>XP</Text>
            </View>
            <View style={{ width: 1, height: 40, backgroundColor: colors.border.medium }} />
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
              <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.brand.primary }}>{userData?.streak_longest ?? 0}</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>record</Text>
            </View>
          </View>
        </View>

        {/* ── Badges ── */}
        <Text style={sectionTitleStyle}>
          BADGES · {allUnlockedBadges.length}/{allBadges.length}
        </Text>
        {allBadges.length === 0 ? (
          <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.base, backgroundColor: colors.background.card, borderRadius: borderRadius.lg, marginBottom: spacing.xs }}>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              Complete ta première leçon pour débloquer des badges 🏅
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.xs }}>
          {allBadges.map(badge => (
            <View
              key={badge.id}
              style={{
                width: '30%',
                alignItems: 'center',
                backgroundColor: badge.unlocked ? colors.background.card : colors.background.main,
                borderRadius: borderRadius.md,
                padding: 12,
                borderWidth: 1,
                borderColor: badge.unlocked ? colors.accent.gold : colors.border.subtle,
                opacity: badge.unlocked ? 1 : 0.5,
                ...shadows.subtle,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 6, opacity: badge.unlocked ? 1 : 0.3 }}>
                {badge.unlocked ? badge.icon : '🔒'}
              </Text>
              <Text
                style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.tiny, color: badge.unlocked ? colors.text.primary : colors.text.secondary, textAlign: 'center' }}
                numberOfLines={2}
              >
                {badge.unlocked ? badge.title_fr : '???'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Affichage ── */}
        <Text style={sectionTitleStyle}>AFFICHAGE</Text>

        {/* Preview live */}
        <View style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          marginBottom: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border.medium,
          borderStyle: 'dashed',
          ...shadows.subtle,
        }}>
          <ArabicText
            withoutHarakats="كتاب"
            transliteration="kitābun"
            translation="un livre"
          >
            كِتَابٌ
          </ArabicText>
        </View>

        <View style={sectionCardStyle}>
          <SettingRow
            label="Harakats (تشكيل)"
            type="select"
            options={HARAKATS_OPTIONS}
            selectedValue={store.harakats_mode}
            onSelect={(v) => store.updateSetting('harakats_mode', v as never)}
          />
          <View style={separatorStyle} />
          <SettingRow
            label="Translittération"
            type="select"
            options={TRANSLIT_OPTIONS}
            selectedValue={store.transliteration_mode}
            onSelect={(v) => store.updateSetting('transliteration_mode', v as never)}
          />
          <View style={separatorStyle} />
          <SettingRow
            label="Traduction"
            type="select"
            options={TRANSLATION_OPTIONS}
            selectedValue={store.translation_mode}
            onSelect={(v) => store.updateSetting('translation_mode', v as never)}
          />
          <View style={separatorStyle} />
          <SettingRow
            label="Taille du texte"
            type="select"
            options={FONT_SIZE_OPTIONS}
            selectedValue={store.font_size}
            onSelect={(v) => store.updateSetting('font_size', v as never)}
          />
        </View>

        {/* ── Exercices ── */}
        <Text style={sectionTitleStyle}>EXERCICES</Text>
        <View style={sectionCardStyle}>
          <SettingRow
            label="Sens"
            type="select"
            options={DIRECTION_OPTIONS}
            selectedValue={store.exercise_direction}
            onSelect={(v) => store.updateSetting('exercise_direction', v as never)}
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
          <SettingRow
            label="Vitesse"
            type="select"
            options={SPEED_OPTIONS}
            selectedValue={store.audio_speed}
            onSelect={(v) => store.updateSetting('audio_speed', v as never)}
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
          <SettingRow
            label="Temps quotidien"
            type="select"
            options={GOAL_OPTIONS}
            selectedValue={dailyGoalStr}
            onSelect={updateDailyGoal}
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

      </ScrollView>
    </SafeAreaView>
  );
}
