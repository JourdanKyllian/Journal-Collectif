import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect'; // <-- Import du GlassView
import { Newspaper, LayoutGrid, Plus, Search, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/tokens';

const { width } = Dimensions.get('window');
const TAB_BAR_MARGIN = 24;
const TAB_BAR_WIDTH = width - TAB_BAR_MARGIN * 2;

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const tabWidth = TAB_BAR_WIDTH / state.routes.length;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 150,
    });
  }, [state.index, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getIcon = (routeName: string) => {
    const color = COLORS.blanc;
    const size = 24;
    switch (routeName) {
      case 'index': return <Newspaper color={color} size={size} />;
      case 'categories': return <LayoutGrid color={color} size={size} />;
      case 'action': return <Plus color={color} size={size} />;
      case 'lost': return <Search color={color} size={size} />;
      case 'profile': return <User color={color} size={size} />;
      default: return <User color={color} size={size} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 20 }
      ]}
    >
      {/* 1. Le fond global sombre de la barre */}
      <BlurView intensity={90} tint="dark" style={styles.absoluteFill} />
      <View style={styles.borderOverlay} />

      {/* 2. L'indicateur coulissant transformé en Liquid Glass */}
      <Animated.View style={[styles.slidingWrapper, { width: tabWidth }, animatedStyle]}>
        {Platform.OS === 'ios' ? (
          <GlassView 
            glassEffectStyle="regular" 
            tintColor="rgba(255, 255, 255, 0.25)" // Teinte claire vitrée
            style={styles.pillInner}
            pointerEvents="none"
          />
        ) : (
          <View style={[styles.pillInner, { backgroundColor: 'rgba(255, 255, 255, 0.20)' }]} />
        )}
      </Animated.View>

      {/* 3. La zone interactive des icônes */}
      <View style={styles.iconsRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            
            if (route.name === 'action') {
              navigation.navigate('modals/submit');
            } else {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              {getIcon(route.name)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  borderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    pointerEvents: 'none',
  },
  slidingWrapper: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pillInner: {
    width: 52,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden', // Indispensable pour que le GlassView respecte la forme ovale
  },
  iconsRow: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
