// src/components/arabic/DialectBadge.tsx

import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type DialectVariant = 'darija' | 'egyptian' | 'levantine' | 'khaliji' | 'quranic';

const VARIANT_CONFIG: Record<DialectVariant, { label: string; short: string; color: string; bg: string; flag: string }> = {
  darija:    { label: 'Darija',    short: 'DZ', color: '#2E7D32', bg: '#E8F5E9', flag: '🇲🇦' },
  egyptian:  { label: 'Égyptien', short: 'EG', color: '#1565C0', bg: '#E3F2FD', flag: '🇪🇬' },
  levantine: { label: 'Levantin', short: 'LEV', color: '#6B7C4A', bg: '#EDF3E8', flag: '🇸🇾' },
  khaliji:   { label: 'Khaliji',  short: 'KH', color: '#C5A028', bg: '#FDF6E3', flag: '🇸🇦' },
  quranic:   { label: 'Coranique', short: 'QR', color: '#E65100', bg: '#FFF3E0', flag: '📖' },
};

interface DialectBadgeProps {
  variant: DialectVariant;
  showFull?: boolean;
}

export function DialectBadge({ variant, showFull = false }: DialectBadgeProps) {
  const { typography, borderRadius } = useTheme();
  const config = VARIANT_CONFIG[variant];

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: borderRadius.pill,
      backgroundColor: config.bg,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ fontSize: 12 }}>{config.flag}</Text>
      <Text style={{
        fontFamily: typography.family.uiMedium,
        fontSize: 11,
        color: config.color,
        letterSpacing: 0.3,
      }}>
        {showFull ? config.label : config.short}
      </Text>
    </View>
  );
}
