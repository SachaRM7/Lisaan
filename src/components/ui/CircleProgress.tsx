// src/components/ui/CircleProgress.tsx
//
// Cercle de progression en pur React Native (sans react-native-svg).
// Technique "deux demi-cercles" :
//   right clip : θ = 180° − min(ratio, 0.5)×360°   → révèle l'arc 0°→180°
//   left clip  : θ = 180° − max(ratio−0.5, 0)×360° → révèle l'arc 180°→360°
// Le clip gauche masque naturellement la portion hors [180°, 360°].

import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CircleProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function CircleProgress({
  completed,
  total,
  size = 48,
  strokeWidth = 3,
}: CircleProgressProps) {
  const { colors, typography } = useTheme();
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0;

  const rightRotation = 180 - Math.min(ratio, 0.5) * 360;
  const leftRotation  = 180 - Math.max(ratio - 0.5, 0) * 360;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: colors.background.group,
      }} />

      {/* Moitié droite */}
      {ratio > 0 && (
        <View style={{
          position: 'absolute',
          left: size / 2,
          width: size / 2,
          height: size,
          overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute',
            right: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.brand.primary,
            transform: [{ rotate: `${rightRotation}deg` }],
          }} />
        </View>
      )}

      {/* Moitié gauche (seulement > 50 %) */}
      {ratio > 0.5 && (
        <View style={{
          position: 'absolute',
          left: 0,
          width: size / 2,
          height: size,
          overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute',
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.brand.primary,
            transform: [{ rotate: `${leftRotation}deg` }],
          }} />
        </View>
      )}

      {/* Texte centré */}
      <Text style={{
        fontFamily: typography.family.uiMedium,
        fontSize: size < 40 ? 10 : 11,
        color: colors.text.primary,
        textAlign: 'center',
        lineHeight: size < 40 ? 13 : 14,
      }}>
        {completed}/{total}
      </Text>
    </View>
  );
}
