// src/components/settings/SettingRow.tsx
import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SelectOption {
  value: string;
  label: string;
}

interface SettingRowProps {
  label: string;
  type: 'select' | 'toggle';
  // Pour select
  options?: SelectOption[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  // Pour toggle
  isOn?: boolean;
  onToggle?: (value: boolean) => void;
}

export function SettingRow({
  label,
  type,
  options = [],
  selectedValue,
  onSelect,
  isOn,
  onToggle,
}: SettingRowProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  const selectedLabel = options.find((o) => o.value === selectedValue)?.label ?? selectedValue ?? '';

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  };

  if (type === 'toggle') {
    return (
      <View style={rowStyle}>
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary, flex: 1 }}>
          {label}
        </Text>
        <Switch
          value={isOn ?? false}
          onValueChange={onToggle}
          trackColor={{ false: colors.border.medium, true: colors.brand.primary }}
          thumbColor={colors.background.card}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable style={rowStyle} onPress={() => setPickerVisible(true)}>
        <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.primary, flex: 1 }}>
          {label}
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.brand.light,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
          gap: spacing.xs,
        }}>
          <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.small, color: colors.brand.primary }}>
            {selectedLabel}
          </Text>
          <Text style={{ fontSize: 16, color: colors.brand.primary, lineHeight: 18 }}>›</Text>
        </View>
      </Pressable>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setPickerVisible(false)}
        >
          <View style={{
            backgroundColor: colors.background.card,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxl,
            paddingTop: spacing.base,
          }}>
            {/* Handle */}
            <View style={{
              width: 36,
              height: 4,
              backgroundColor: colors.border.medium,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: spacing.base,
            }} />

            <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.h2, color: colors.text.primary, marginBottom: spacing.xl, textAlign: 'center' }}>
              {label}
            </Text>

            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.base,
                  paddingHorizontal: spacing.sm,
                  borderRadius: borderRadius.md,
                  marginBottom: spacing.xs,
                  backgroundColor: option.value === selectedValue ? colors.brand.light : 'transparent',
                }}
                onPress={() => {
                  onSelect?.(option.value);
                  setPickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontFamily: option.value === selectedValue ? typography.family.uiMedium : typography.family.ui,
                  fontSize: typography.size.body,
                  color: option.value === selectedValue ? colors.brand.primary : colors.text.primary,
                }}>
                  {option.label}
                </Text>
                {option.value === selectedValue && (
                  <Text style={{ fontFamily: typography.family.uiBold, fontSize: typography.size.body, color: colors.brand.primary }}>
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={{ marginTop: spacing.base, paddingVertical: spacing.base, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border.subtle }}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={{ fontFamily: typography.family.uiMedium, fontSize: typography.size.body, color: colors.text.secondary }}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
