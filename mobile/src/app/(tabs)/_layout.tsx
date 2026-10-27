import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Newspaper, LayoutGrid, Search, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';

export default function TabsLayout() {
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  return (
    <Tabs
      screenListeners={{
        tabPress: () => triggerHaptic(),
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.or,
        tabBarInactiveTintColor: COLORS.champagne,
        tabBarStyle: {
          backgroundColor: COLORS.vert,
          borderTopWidth: 1,
          borderTopColor: 'rgba(212, 175, 55, 0.2)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.bodyBold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Catégories',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lost"
        options={{
          title: 'Objets Perdus',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
