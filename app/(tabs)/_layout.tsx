import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { useAppTheme } from '@/src/theme';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSub,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.cardBorder },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'house', android: 'home', web: 'home' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
