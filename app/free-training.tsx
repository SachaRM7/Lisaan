// app/free-training.tsx

import { useState } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity, Pressable, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useModules } from '../src/hooks/useModules';
import { useSRSCards } from '../src/hooks/useSRSCards';
import type { ReviewSessionConfig, ReviewDirection } from '../src/types/review';
import type { ExerciseType } from '../src/types/exercise';

type ForcedType = ExerciseType | null;
const CARD_COUNTS = [10, 15, 20, 25, 30, 40];

const DIRECTION_OPTIONS: { value: ReviewDirection; label: string }[] = [
  { value: 'ar_to_fr', label: 'Arabe → Français' },
  { value: 'fr_to_ar', label: 'Français → Arabe' },
  { value: 'mixed', label: 'Mix' },
];

const TYPE_OPTIONS: { value: ForcedType; label: string; icon: string }[] = [
  { value: 'flashcard', label: 'Flashcard', icon: '🃏' },
  { value: 'mcq', label: 'QCM', icon: '📝' },
  { value: 'write', label: 'Écrire', icon: '✍️' },
  { value: 'match', label: 'Associer', icon: '🔗' },
  { value: null, label: "L'algo décide", icon: '🎯' },
];

const MODULE_ALL = '__all__';

export default function FreeTrainingScreen() {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();
  const { data: modules = [] } = useModules();
  const { data: allCards = [] } = useSRSCards();

  const [direction, setDirection] = useState<ReviewDirection>('ar_to_fr');
  const [forcedType, setForcedType] = useState<ForcedType>(null);
  const [selectedModule, setSelectedModule] = useState<string>(MODULE_ALL);
  const [maxCards, setMaxCards] = useState(20);
  const [examMode, setExamMode] = useState(false);

  // Compter les cartes match disponibles (même type, 4+)
  const letterCards = allCards.filter(c => c.item_type === 'letter');
  const diacriticCards = allCards.filter(c => c.item_type === 'diacritic');
  const matchAvailable = letterCards.length >= 4 || diacriticCards.length >= 4;

  const sectionTitleStyle = {
    fontFamily: typography.family.uiBold,
    fontSize: typography.size.tiny,
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
  };

  const sectionCardStyle = {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.base,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    ...shadows.subtle,
  };

  function handleLaunch() {
    const config: ReviewSessionConfig = {
      mode: 'free',
      free_options: {
        direction,
        forced_exercise_type: forcedType,
        module_ids: selectedModule === MODULE_ALL ? [] : [selectedModule],
        max_cards: maxCards,
        exam_mode: examMode,
      },
    };
    router.push({ pathname: '/review-session', params: { config: JSON.stringify(config) } } as never);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.base }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, justifyContent: 'center' }} hitSlop={12}>
          <Text style={{ fontSize: 22, color: colors.text.secondary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, marginLeft: spacing.sm }}>
          Entraînement libre
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Direction */}
        <Text style={sectionTitleStyle}>Direction</Text>
        <View style={sectionCardStyle}>
          {DIRECTION_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setDirection(opt.value)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                {opt.label}
              </Text>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                borderWidth: 2,
                borderColor: direction === opt.value ? colors.brand.primary : colors.border.medium,
                backgroundColor: direction === opt.value ? colors.brand.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {direction === opt.value && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse }} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. Type d'exercice */}
        <Text style={sectionTitleStyle}>Type d'exercice</Text>
        <View style={sectionCardStyle}>
          {TYPE_OPTIONS.map(opt => {
            const isMatch = opt.value === 'match';
            const disabled = isMatch && !matchAvailable;
            const selected = forcedType === opt.value;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => !disabled && setForcedType(opt.value)}
                disabled={disabled}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: spacing.sm,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                  <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                    {opt.label}
                  </Text>
                  {disabled && (
                    <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.tiny, color: colors.text.secondary }}>
                      4 cartes min.
                    </Text>
                  )}
                </View>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected ? colors.brand.primary : colors.border.medium,
                  backgroundColor: selected ? colors.brand.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Contenu (modules) */}
        <Text style={sectionTitleStyle}>Contenu</Text>
        <View style={sectionCardStyle}>
          <TouchableOpacity
            onPress={() => setSelectedModule(MODULE_ALL)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontSize: 18 }}>📚</Text>
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary }}>
                Tout
              </Text>
            </View>
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              borderWidth: 2,
              borderColor: selectedModule === MODULE_ALL ? colors.brand.primary : colors.border.medium,
              backgroundColor: selectedModule === MODULE_ALL ? colors.brand.primary : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {selectedModule === MODULE_ALL && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse }} />
              )}
            </View>
          </TouchableOpacity>
          {modules.map(mod => (
            <TouchableOpacity
              key={mod.id}
              onPress={() => setSelectedModule(mod.id)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}
            >
              <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.body, color: colors.text.primary, flex: 1 }}>
                {mod.icon ? `${mod.icon} ` : ''}{mod.title_fr}
              </Text>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                borderWidth: 2,
                borderColor: selectedModule === mod.id ? colors.brand.primary : colors.border.medium,
                backgroundColor: selectedModule === mod.id ? colors.brand.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedModule === mod.id && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text.inverse }} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Nombre de cartes */}
        <Text style={sectionTitleStyle}>Nombre de cartes</Text>
        <View style={{ ...sectionCardStyle, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CARD_COUNTS.map(count => (
            <TouchableOpacity
              key={count}
              onPress={() => setMaxCards(count)}
              style={{
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.pill,
                borderWidth: 2,
                borderColor: maxCards === count ? colors.brand.primary : colors.border.medium,
                backgroundColor: maxCards === count ? colors.brand.light : 'transparent',
              }}
            >
              <Text style={{
                fontFamily: typography.family.uiBold,
                fontSize: typography.size.body,
                color: maxCards === count ? colors.brand.primary : colors.text.secondary,
              }}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Mode Examen */}
        <Text style={sectionTitleStyle}>Mode examen</Text>
        <View style={{ ...sectionCardStyle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.primary }}>
              Examen
            </Text>
            <Text style={{ fontFamily: typography.family.ui, fontSize: typography.size.small, color: colors.text.secondary }}>
              Pas de feedback, note à la fin
            </Text>
          </View>
          <Switch
            value={examMode}
            onValueChange={setExamMode}
            trackColor={{ false: colors.border.medium, true: colors.brand.primary }}
            thumbColor={colors.text.inverse}
          />
        </View>
      </ScrollView>

      {/* Bouton Lancer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.base,
        paddingBottom: spacing.xl,
        backgroundColor: colors.background.main,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
      }}>
        <Pressable
          onPress={handleLaunch}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: borderRadius.pill,
            backgroundColor: pressed ? colors.brand.dark : colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...(shadows.prominent as object),
          })}
        >
          <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.text.inverse }}>
            Lancer →
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
