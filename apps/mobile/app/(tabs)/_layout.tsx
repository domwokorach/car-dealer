import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useColors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName, focused: IconName) =>
  function TabIcon({ color, size, focused: isFocused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={isFocused ? focused : name} size={size} color={color as string} />;
  };

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.foreground,
        headerTitleStyle: { fontWeight: '300', letterSpacing: 1 },
        headerShadowVisible: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.border },
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Car Dealer', tabBarLabel: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="cars" options={{ title: 'Showroom', tabBarLabel: 'Cars', tabBarIcon: icon('car-sport-outline', 'car-sport') }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved cars', tabBarLabel: 'Saved', tabBarIcon: icon('heart-outline', 'heart') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarLabel: 'Account', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
