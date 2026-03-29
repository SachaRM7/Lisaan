import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../src/contexts/ThemeContext';
import { borderRadius as br, getShadows } from '../../src/constants/theme';

// ─── Types ────────────────────────────────────────────────

type TabIconName =
  | 'book-outline' | 'book'
  | 'refresh-outline' | 'refresh'
  | 'person-outline' | 'person';

const ICON_MAP: Record<string, [TabIconName, TabIconName]> = {
  learn:   ['book-outline',   'book'],
  review:  ['refresh-outline','refresh'],
  profile: ['person-outline', 'person'],
};

const TAB_LABELS: Record<string, string> = {
  learn:   'Apprendre',
  review:  'Réviser',
  profile: 'Profil',
};

// ─── Custom Floating Tab Bar ──────────────────────────────

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const prominentShadow = getShadows(false, colors.shadowColor).prominent;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          bottom: Math.max(insets.bottom, 16) + 8,
          marginHorizontal: 24,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: `${colors.background.card}F2`, // ~95% opacité
            borderRadius: br.pill,
            ...prominentShadow,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const [inactiveIcon, activeIcon] = ICON_MAP[route.name] ?? ['book-outline', 'book'];
          const iconName = isFocused ? activeIcon : inactiveIcon;
          const label = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
            >
              {/* Icône */}
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? colors.brand.primary : colors.text.secondary}
              />

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  {
                    fontFamily: isFocused
                      ? typography.family.uiMedium
                      : typography.family.ui,
                    fontSize: typography.size.tiny,
                    color: isFocused ? colors.brand.primary : colors.text.secondary,
                    marginTop: 2,
                  },
                ]}
              >
                {label}
              </Text>

              {/* Dot or sous l'icône active */}
              {isFocused && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: colors.accent.gold },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="learn" />
      <Tabs.Screen name="review" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    // bottom est défini dynamiquement
  },
  pill: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  label: {
    letterSpacing: 0,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
