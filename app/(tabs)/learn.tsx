import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../src/constants/theme';
import { useUserStore, useProgressStore } from '../../src/stores';

interface ModuleCardProps {
  number: number;
  title: string;
  subtitle: string;
  progress?: number;
  isActive: boolean;
  isLocked: boolean;
}

function ModuleCard({ number, title, subtitle, progress, isActive, isLocked }: ModuleCardProps) {
  return (
    <Pressable
      style={[
        styles.moduleCard,
        isActive && styles.moduleCardActive,
        isLocked && styles.moduleCardLocked,
      ]}
      disabled={isLocked}
    >
      <Text style={[styles.moduleLabel, isActive && styles.moduleLabelActive]}>
        MODULE {number}
      </Text>
      <Text style={[styles.moduleTitle, isLocked && styles.moduleTitleLocked]}>
        {title}
      </Text>
      <Text style={styles.moduleSubtitle}>{subtitle}</Text>
      {progress !== undefined && progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% terminé</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function LearnScreen() {
  const user = useUserStore((s) => s.user);
  const moduleProgress = useProgressStore((s) => s.moduleProgress);

  const displayName = user?.display_name ?? 'Apprenant';
  const streak = user?.streak_current ?? 0;
  const xp = user?.total_xp ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {displayName}</Text>
            <Text style={styles.subtitle}>Continue ton parcours</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="flame-outline" size={16} color={Colors.gold} />
              <Text style={styles.statText}>{streak}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="flash-outline" size={16} color={Colors.primary} />
              <Text style={styles.statText}>{xp}</Text>
            </View>
          </View>
        </View>

        {/* Modules */}
        <View style={styles.modules}>
          <ModuleCard
            number={1}
            title="L'alphabet vivant"
            subtitle="28 lettres · 12 leçons"
            progress={moduleProgress['module-1'] ?? 0}
            isActive={true}
            isLocked={false}
          />
          <ModuleCard
            number={2}
            title="Les harakats démystifiés"
            subtitle="Voyelles courtes · 8 leçons"
            isActive={false}
            isLocked={false}
          />
          <ModuleCard
            number={3}
            title="Lire ses premiers mots"
            subtitle="Connexion des lettres · 10 leçons"
            isActive={false}
            isLocked={true}
          />
          <ModuleCard
            number={4}
            title="Construire du sens"
            subtitle="Vocabulaire de base · 14 leçons"
            isActive={false}
            isLocked={true}
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
    alignItems: 'flex-start',
    marginBottom: Spacing['3xl'],
  },
  greeting: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadows.card,
  },
  statText: {
    fontSize: FontSizes.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modules: {
    gap: Spacing.lg,
  },
  moduleCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Layout.cardPaddingH,
    paddingVertical: Layout.cardPaddingV + 4,
    ...Shadows.card,
  },
  moduleCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  moduleCardLocked: {
    opacity: 0.5,
  },
  moduleLabel: {
    fontSize: FontSizes.small,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  moduleLabelActive: {
    color: Colors.primary,
  },
  moduleTitle: {
    fontSize: FontSizes.heading - 2,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  moduleTitleLocked: {
    color: Colors.textMuted,
  },
  moduleSubtitle: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});
