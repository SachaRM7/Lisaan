// app/quran/index.tsx
// Quran screen - dark background, list of surahs (Mission 6 E20)

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useModules } from '../../src/hooks/useModules';
import { useLessons } from '../../src/hooks/useLessons';
import { useProgress } from '../../src/hooks/useProgress';
import { useQuranSurahs } from '../../src/hooks/useQuranEntries';
import { useTheme } from '../../src/contexts/ThemeContext';

const GOLD = '#D4AF37';
const DARK_BG = '#0A3D30';
const CARD_BG = '#0F4A3A';

export default function QuranScreen() {
  const router = useRouter();
  const { typography, spacing, borderRadius } = useTheme();

  const { data: modules } = useModules();
  const { data: progress = [] } = useProgress();
  const { data: surahs, isLoading } = useQuranSurahs();

  const quranModule = modules?.find(m => m.id.includes('quran'));
  const { data: lessons } = useLessons(quranModule?.id ?? '');

  // Stats
  const studiedCount = lessons
    ? progress.filter(p =>
        p.status === 'completed' &&
        lessons.some(l => l.id === p.lesson_id && l.module_id === quranModule?.id)
      ).length
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DARK_BG }}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
        <ActivityIndicator size="large" color={GOLD} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DARK_BG }}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Header avec retour */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.base,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.h2,
          color: '#FFFFFF',
          flex: 1,
        }}>
          Arabe Coranique
        </Text>
        <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(212,175,55,0.3)' }} />
      </View>

      {/* Progress card */}
      <View style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        backgroundColor: CARD_BG,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        gap: spacing.sm,
      }}>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.body,
          color: '#FFFFFF',
        }}>
          {surahs?.length ?? 0} sourates
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.small,
          color: GOLD,
        }}>
          {studiedCount} etudiees
        </Text>
        <View style={{
          height: 3,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 1.5,
          marginTop: spacing.xs,
          overflow: 'hidden',
        }}>
          <View style={{
            height: '100%',
            width: `${surahs && surahs.length > 0 ? Math.round((studiedCount / surahs.length) * 100) : 0}%`,
            backgroundColor: GOLD,
            borderRadius: 1.5,
          }} />
        </View>
      </View>

      {/* Liste des sourates */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {surahs?.map((surah) => {
          const lesson = lessons?.find(l =>
            l.content_refs?.includes(String(surah.surah_number))
          );
          const lessonProgress = lesson ? progress.find(p => p.lesson_id === lesson.id) : undefined;
          const status = lessonProgress?.status ?? 'locked';
          const score = lessonProgress?.score ?? 0;
          const isNew = !lessonProgress;
          const isMemorized = status === 'completed' && score >= 90;

          const rowStatus = isNew ? 'new'
            : status === 'completed' ? (isMemorized ? 'memorized' : 'completed')
            : status === 'in_progress' ? 'in_progress' : 'locked';

          return (
            <SurahRow
              key={surah.surah_number}
              surahNumber={surah.surah_number}
              surahNameAr={surah.surah_name_ar}
              surahNameFr={surah.surah_name_fr}
              ayahCount={surah.ayah_count}
              status={rowStatus}
              onPress={() => {
                if (lesson && status !== 'locked') {
                  router.push(`/lesson/${lesson.id}` as any);
                }
              }}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

type SurahStatus = 'new' | 'in_progress' | 'completed' | 'memorized' | 'locked';

function SurahRow({
  surahNumber,
  surahNameAr,
  surahNameFr,
  ayahCount,
  status,
  onPress,
}: {
  surahNumber: number;
  surahNameAr: string;
  surahNameFr: string;
  ayahCount: number;
  status: SurahStatus;
  onPress: () => void;
}) {
  const { typography, spacing, borderRadius } = useTheme();
  const arabicLineHeight = Math.round(typography.size.arabicBody * typography.lineHeight.arabic);

  const isLocked = status === 'locked';

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: CARD_BG,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        opacity: isLocked ? 0.5 : 1,
        borderLeftWidth: 2,
        borderLeftColor: GOLD,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: GOLD,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{
          fontFamily: typography.family.uiBold,
          fontSize: typography.size.small,
          color: DARK_BG,
        }}>
          {surahNumber}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: typography.family.arabic,
          fontSize: typography.size.arabicBody,
          lineHeight: arabicLineHeight,
          color: '#FFFFFF',
        }}>
          {surahNameAr}
        </Text>
        <Text style={{
          fontFamily: typography.family.ui,
          fontSize: typography.size.tiny,
          color: 'rgba(255,255,255,0.6)',
        }}>
          {surahNameFr} - {ayahCount} versets
        </Text>
      </View>

      {status === 'new' && (
        <View style={{
          borderWidth: 1,
          borderColor: GOLD,
          borderRadius: borderRadius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        }}>
          <Text style={{
            fontFamily: typography.family.uiMedium,
            fontSize: typography.size.tiny,
            color: GOLD,
          }}>
            Nouveau
          </Text>
        </View>
      )}
      {status === 'memorized' && (
        <Text style={{ fontSize: 18, color: GOLD }}>OK</Text>
      )}
      {status === 'completed' && (
        <Ionicons name="checkmark-circle" size={20} color={GOLD} />
      )}
      {status === 'in_progress' && (
        <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.5)" />
      )}
      {status === 'locked' && (
        <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" />
      )}
    </Pressable>
  );
}
