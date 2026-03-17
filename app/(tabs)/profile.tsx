import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../src/constants/theme';
import { useSettingsStore } from '../../src/stores';
import type { HarakatsMode, DisplayMode, ExerciseDirection, AudioSpeed } from '../../src/types';

// ─── Setting Row Components ───────────────────────────────

interface CycleSettingProps {
  label: string;
  description: string;
  value: string;
  onPress: () => void;
}

function CycleSetting({ label, description, value, onPress }: CycleSettingProps) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <View style={styles.settingBadge}>
        <Text style={styles.settingBadgeText}>{value}</Text>
      </View>
    </Pressable>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function ToggleSetting({ label, description, value, onToggle }: ToggleSettingProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor={Colors.bgCard}
      />
    </View>
  );
}

// ─── Cycle helpers ────────────────────────────────────────

const HARAKATS_CYCLE: HarakatsMode[] = ['always', 'adaptive', 'tap_reveal', 'never'];
const HARAKATS_LABELS: Record<HarakatsMode, string> = {
  always: 'Toujours', adaptive: 'Adaptatif', tap_reveal: 'Au tap', never: 'Masqués',
};

const DISPLAY_CYCLE: DisplayMode[] = ['always', 'tap_reveal', 'never'];
const DISPLAY_LABELS: Record<DisplayMode, string> = {
  always: 'Toujours', tap_reveal: 'Au tap', never: 'Masqué',
};

const DIRECTION_CYCLE: ExerciseDirection[] = ['ar_to_fr', 'fr_to_ar', 'both'];
const DIRECTION_LABELS: Record<ExerciseDirection, string> = {
  ar_to_fr: 'AR → FR', fr_to_ar: 'FR → AR', both: 'Les deux',
};

const SPEED_CYCLE: AudioSpeed[] = ['slow', 'normal', 'native'];
const SPEED_LABELS: Record<AudioSpeed, string> = {
  slow: 'Lente', normal: 'Normale', native: 'Native',
};

function cycleValue<T>(current: T, options: T[]): T {
  const idx = options.indexOf(current);
  return options[(idx + 1) % options.length] as T;
}

// ─── Screen ───────────────────────────────────────────────

export default function ProfileScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const store = useSettingsStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Réglages</Text>
          <Pressable>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {/* Display section */}
        <Text style={styles.sectionTitle}>AFFICHAGE</Text>
        <View style={styles.sectionCard}>
          <CycleSetting
            label="Harakats (تشكيل)"
            description="Afficher les voyelles courtes"
            value={HARAKATS_LABELS[settings.harakats_mode]}
            onPress={() => store.setHarakatsMode(cycleValue(settings.harakats_mode, HARAKATS_CYCLE))}
          />
          <View style={styles.separator} />
          <CycleSetting
            label="Translittération"
            description="kitāb, madrasa..."
            value={DISPLAY_LABELS[settings.transliteration_mode]}
            onPress={() => store.setTransliterationMode(cycleValue(settings.transliteration_mode, DISPLAY_CYCLE))}
          />
          <View style={styles.separator} />
          <CycleSetting
            label="Traduction"
            description="Afficher la traduction française"
            value={DISPLAY_LABELS[settings.translation_mode]}
            onPress={() => store.setTranslationMode(cycleValue(settings.translation_mode, DISPLAY_CYCLE))}
          />
          <View style={styles.separator} />
          <CycleSetting
            label="Taille de police arabe"
            description="Ajuster la lisibilité"
            value={settings.font_size === 'small' ? 'Petite' : settings.font_size === 'medium' ? 'Moyenne' : settings.font_size === 'large' ? 'Grande' : 'Très grande'}
            onPress={() => store.setFontSize(cycleValue(settings.font_size, ['small', 'medium', 'large', 'xlarge'] as const))}
          />
        </View>

        {/* Exercises section */}
        <Text style={styles.sectionTitle}>EXERCICES</Text>
        <View style={styles.sectionCard}>
          <CycleSetting
            label="Direction d'exercice"
            description="Arabe → Français ou inverse"
            value={DIRECTION_LABELS[settings.exercise_direction]}
            onPress={() => store.setExerciseDirection(cycleValue(settings.exercise_direction, DIRECTION_CYCLE))}
          />
        </View>

        {/* Audio section */}
        <Text style={styles.sectionTitle}>AUDIO</Text>
        <View style={styles.sectionCard}>
          <CycleSetting
            label="Vitesse audio"
            description="Vitesse de lecture des sons"
            value={SPEED_LABELS[settings.audio_speed]}
            onPress={() => store.setAudioSpeed(cycleValue(settings.audio_speed, SPEED_CYCLE))}
          />
          <View style={styles.separator} />
          <ToggleSetting
            label="Lecture automatique"
            description="Jouer le son automatiquement"
            value={settings.audio_autoplay}
            onToggle={store.setAudioAutoplay}
          />
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.cardPaddingH,
    paddingVertical: Spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  settingLabel: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  settingBadgeText: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Layout.cardPaddingH,
  },
});
