import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Colors, FontSizes, Layout } from '../../src/constants/theme';

type TabIconName = 'book-outline' | 'book' | 'refresh-outline' | 'refresh' | 'person-outline' | 'person';

function TabIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.textOnPrimary : Colors.textSecondary}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Apprendre',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Réviser',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'refresh' : 'refresh-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bg,
    borderTopWidth: 0,
    height: Layout.tabBarHeight,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primary,
    width: 56,
    borderRadius: 16,
  },
});
