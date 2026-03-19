// src/components/settings/SettingRow.tsx
import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, FontSizes, Spacing, Radius, Shadows, Layout } from '../../constants/theme';

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
  const [pickerVisible, setPickerVisible] = useState(false);

  const selectedLabel = options.find((o) => o.value === selectedValue)?.label ?? selectedValue ?? '';

  if (type === 'toggle') {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Switch
          value={isOn ?? false}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.bgCard}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable style={styles.row} onPress={() => setPickerVisible(true)}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectedLabel}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sheetOption,
                  option.value === selectedValue && styles.sheetOptionSelected,
                ]}
                onPress={() => {
                  onSelect?.(option.value);
                  setPickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    option.value === selectedValue && styles.sheetOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.value === selectedValue && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.cardPaddingH,
    paddingVertical: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.body,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    gap: Spacing.xs,
  },
  badgeText: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  chevron: {
    fontSize: 16,
    color: Colors.primary,
    lineHeight: 18,
  },

  // Modal bottom sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing['4xl'],
    paddingTop: Spacing.lg,
    ...Shadows.card,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  sheetOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  sheetOptionText: {
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
  },
  sheetOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: FontSizes.body,
    color: Colors.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
