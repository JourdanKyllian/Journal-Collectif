import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import {
  Newspaper,
  LayoutGrid,
  Plus,
  Briefcase,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/theme/tokens';

const { width } = Dimensions.get('window');
const TAB_BAR_MARGIN = 20;
const TAB_BAR_WIDTH = width - TAB_BAR_MARGIN * 2;
const TAB_BAR_HEIGHT = 52;

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const tabWidth = TAB_BAR_WIDTH / state.routes.length;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, {
      damping: 22,
      stiffness: 240,
      mass: 0.8,
    });
  }, [state.index, tabWidth, translateX]);

  const animatedSliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? COLORS.vert : 'rgba(26, 26, 26, 0.42)';
    const size = 21;
    const strokeWidth = isFocused ? 2.4 : 1.8;

    switch (routeName) {
      case 'index':
        return <Newspaper color={color} size={size} strokeWidth={strokeWidth} />;
      case 'categories':
        return <LayoutGrid color={color} size={size} strokeWidth={strokeWidth} />;
      case 'action':
        return (
          <View style={styles.actionIconContainer}>
            <Plus color={COLORS.blanc} size={18} strokeWidth={2.8} />
          </View>
        );
      case 'tools':
        return <Briefcase color={color} size={size} strokeWidth={strokeWidth} />;
      case 'profile':
        return <User color={color} size={size} strokeWidth={strokeWidth} />;
      default:
        return <User color={color} size={size} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16 },
      ]}
    >
      {/* Fond Liquid Glass translucide ultra-fin (style Instagram / Deezer iOS) */}
      <BlurView
        intensity={85}
        tint={Platform.OS === 'ios' ? 'systemUltraThinMaterialLight' : 'light'}
        style={styles.absoluteFill}
      />
      <View style={styles.translucentGlassTint} />
      <View style={styles.specularBorder} />

      {/* Indicateur coulissant Liquid Glass discret et proportionné */}
      <Animated.View
        style={[
          styles.slidingWrapper,
          { width: tabWidth },
          animatedSliderStyle,
        ]}
      >
        {Platform.OS === 'ios' ? (
          <GlassView
            glassEffectStyle="regular"
            tintColor="rgba(255, 255, 255, 0.85)"
            style={styles.pillInner}
            pointerEvents="none"
          />
        ) : (
          <View style={styles.androidPillInner} />
        )}
      </Animated.View>

      {/* Ligne interactive des onglets */}
      <View style={styles.iconsRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isAction = route.name === 'action';

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            if (isAction) {
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
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              {getIcon(route.name, isFocused)}
              {isFocused && !isAction && <View style={styles.activeDot} />}
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
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFill,
  },
  translucentGlassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
  },
  specularBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.9)',
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
    width: 44,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  androidPillInner: {
    width: 44,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
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
  activeDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.or,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.vert,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});
