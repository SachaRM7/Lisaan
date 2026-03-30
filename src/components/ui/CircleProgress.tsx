// src/components/ui/CircleProgress.tsx
//
// Cercle de progression en pur React Native (sans react-native-svg).
// Technique "deux demi-cercles pleins" (D-shapes) :
//   right clip : demi-cercle solide droit (bords droits arrondis, gauche plat)
//                tourné de rightRotation = 180° → 0° pour ratio 0% → 50%
//   left clip  : demi-cercle solide gauche (bords gauches arrondis, droit plat)
//                tourné de leftRotation = 180° → 0° pour ratio 50% → 100%
//   centre     : trou blanc (backgroundColor card) pour créer l'apparence d'anneau
//
// IMPORTANT : utiliser des D-shapes (demi-cercles pleins) et NON des cercles complets.
// Un cercle complet clipé sur la moitié montre toujours 50% quel que soit la rotation.

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

  // Taille du trou central (crée l'apparence d'anneau à partir des D-shapes pleins)
  const holeSize = size - 2 * strokeWidth;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track gris (anneau de fond) */}
      <View style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: colors.background.group,
      }} />

      {/* Moitié droite — D-shape plein droit (bords droits arrondis, bord gauche plat) */}
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
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: size / 2,
            borderBottomRightRadius: size / 2,
            backgroundColor: colors.brand.primary,
            transform: [{ rotate: `${rightRotation}deg` }],
          }} />
        </View>
      )}

      {/* Moitié gauche — D-shape plein gauche (seulement si > 50 %) */}
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
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: size / 2,
            borderBottomLeftRadius: size / 2,
            backgroundColor: colors.brand.primary,
            transform: [{ rotate: `${leftRotation}deg` }],
          }} />
        </View>
      )}

      {/* Trou central : crée l'aspect anneau en cachant le remplissage des D-shapes */}
      <View style={{
        position: 'absolute',
        width: holeSize,
        height: holeSize,
        borderRadius: holeSize / 2,
        backgroundColor: colors.background.card,
      }} />

      {/* Texte centré (z-index au-dessus du trou) */}
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
