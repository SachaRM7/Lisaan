// src/components/arabic/SurahDisplay.tsx

import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuranEntriesBySurah, type QuranEntry } from '../../hooks/useQuranEntries';
import { AudioButton } from '../AudioButton';

interface SurahDisplayProps {
  surahNumber: number;
  showTransliteration?: boolean;
  showTranslation?: boolean;
  onWordTap?: (entry: QuranEntry) => void;
}

export function SurahDisplay({
  surahNumber,
  showTransliteration = true,
  showTranslation = true,
  onWordTap,
}: SurahDisplayProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { data: entries = [] } = useQuranEntriesBySurah(surahNumber);

  // Grouper par verset
  const ayahMap = new Map<number, QuranEntry[]>();
  for (const entry of entries) {
    if (!ayahMap.has(entry.ayah_number)) {
      ayahMap.set(entry.ayah_number, []);
    }
    ayahMap.get(entry.ayah_number)!.push(entry);
  }

  if (entries.length === 0) return null;

  const surahNameFr = entries[0]?.surah_name_fr ?? '';
  const surahNameAr = entries[0]?.surah_name_ar ?? '';

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Titre sourate */}
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text style={{
          fontFamily: typography.family.arabic,
          fontSize: 28,
          color: colors.text.heroArabic,
          lineHeight: 28 * 2,
          textAlign: 'right',
          writingDirection: 'rtl',
        }}>
          {surahNameAr}
        </Text>
        <Text style={{
          fontFamily: typography.family.uiMedium,
          fontSize: typography.size.body,
          color: colors.text.secondary,
        }}>
          {surahNameFr}
        </Text>
      </View>

      {/* Versets */}
      {Array.from(ayahMap.entries()).map(([ayahNumber, words]) => (
        <View key={ayahNumber} style={{
          backgroundColor: colors.background.card,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          padding: spacing.base,
          gap: spacing.sm,
        }}>
          {/* Numéro de verset */}
          <Text style={{
            fontFamily: typography.family.ui,
            fontSize: typography.size.small,
            color: colors.text.secondary,
          }}>
            Verset {ayahNumber}
          </Text>

          {/* Ligne arabe — mots cliquables */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: spacing.xs,
          }}>
            {words.map((word) => (
              <Pressable
                key={word.id}
                onPress={() => onWordTap?.(word)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  gap: 2,
                  opacity: pressed ? 0.7 : 1,
                  padding: 2,
                  borderRadius: borderRadius.sm,
                  backgroundColor: 'transparent',
                })}
              >
                <Text style={{
                  fontFamily: typography.family.arabic,
                  fontSize: 22,
                  color: colors.text.heroArabic,
                  lineHeight: 22 * 2,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                }}>
                  {word.arabic_vocalized}
                </Text>
                {showTransliteration && (
                  <Text style={{
                    fontFamily: typography.family.ui,
                    fontSize: 10,
                    color: colors.text.secondary,
                    textAlign: 'center',
                  }}>
                    {word.transliteration}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Traduction française du verset */}
          {showTranslation && (
            <Text style={{
              fontFamily: typography.family.ui,
              fontSize: typography.size.small,
              color: colors.text.secondary,
              fontStyle: 'italic',
            }}>
              {words.map(w => w.translation_fr).join(' ')}
            </Text>
          )}

          {/* AudioButton pour le verset entier */}
          <AudioButton
            audioUrl={null}
            fallbackText={words.map(w => w.arabic).join(' ')}
            fallbackLanguage="ar"
            size={18}
            color={colors.text.secondary}
          />
        </View>
      ))}
    </View>
  );
}
