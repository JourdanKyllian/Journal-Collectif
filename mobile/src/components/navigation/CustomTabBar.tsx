import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GlassContainer, GlassView } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
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
const TAB_BAR_HEIGHT = 58;
const PILL_W = 52;
const PILL_H = 44;
const PILL_R = PILL_H / 2;

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const tabWidth = TAB_BAR_WIDTH / state.routes.length;
  const translateX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  useEffect(() => {
    const target = state.index * tabWidth + tabWidth / 2 - PILL_W / 2;
    translateX.value = withSpring(target, {
      damping: 22,
      stiffness: 260,
      mass: 0.6,
    });
    // Squash-and-stretch liquid morph
    scaleX.value = withSequence(
      withTiming(1.22, { duration: 90 }),
      withSpring(1, { damping: 15, stiffness: 240 })
    );
    scaleY.value = withSequence(
      withTiming(0.82, { duration: 90 }),
      withSpring(1, { damping: 15, stiffness: 240 })
    );
  }, [state.index, tabWidth, translateX, scaleX, scaleY]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? COLORS.or : '#424E46';
    const size = 22;
    const sw = isFocused ? 2.5 : 2.0;
    switch (routeName) {
      case 'index':
        return <Newspaper color={color} size={size} strokeWidth={sw} />;
      case 'categories':
        return <LayoutGrid color={color} size={size} strokeWidth={sw} />;
      case 'action':
        return (
          <View style={styles.actionBtn}>
            <Plus color={COLORS.blanc} size={20} strokeWidth={2.8} />
          </View>
        );
      case 'tools':
        return <Briefcase color={color} size={size} strokeWidth={sw} />;
      case 'profile':
        return <User color={color} size={size} strokeWidth={sw} />;
      default:
        return <User color={color} size={size} strokeWidth={sw} />;
    }
  };

  const bottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16;

  // iOS 26+ : vrai UIGlassEffect natif via GlassContainer + GlassView
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.shadowWrapper, { bottom }]}>
        {/*
          GlassContainer = UIGlassContainerEffect : orchestre la fusion des bulles de verre.
          Il n'a PAS overflow:hidden pour laisser UIKit rendre l'effet correctement.
        */}
        <GlassContainer
          spacing={8}
          style={[styles.glassContainer]}
        >
          {/* Fond principal : verre liquide natif sur toute la barre */}
          <GlassView
            glassEffectStyle="regular"
            colorScheme="light"
            style={styles.glassBarBackground}
            pointerEvents="none"
          />

          {/* Pill indicateur : autre élément en verre qui "fusionne" avec le fond */}
          <Animated.View style={[styles.pillWrapper, pillAnimatedStyle]}>
            <GlassView
              glassEffectStyle="clear"
              colorScheme="light"
              style={styles.pillGlass}
              pointerEvents="none"
            />
          </Animated.View>

          {/* Icônes : couche interactive au-dessus, zIndex élevé */}
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
        </GlassContainer>
      </View>
    );
  }

  // Android / Web : fallback BlurView translucide propre
  return (
    <View style={[styles.shadowWrapper, { bottom }]}>
      <View style={styles.fallbackContainer}>
        <BlurView
          intensity={55}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.fallbackTint} />
        <View style={styles.fallbackBorder} />

        {/* Pill fallback */}
        <Animated.View style={[styles.pillWrapper, pillAnimatedStyle]}>
          <View style={styles.pillFallback} />
        </Animated.View>

        <View style={styles.iconsRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const isAction = route.name === 'action';
            const onPress = () => {
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
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    position: 'absolute',
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    // Ombre portée séparée du container pour ne pas bloquer l'effet glass
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },

  // --- iOS GlassContainer ---
  glassContainer: {
    flex: 1,
    borderRadius: TAB_BAR_HEIGHT / 2,
    // PAS de overflow:hidden ici — crucial pour que UIGlassEffect fonctionne
  },
  glassBarBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: TAB_BAR_HEIGHT / 2,
  },

  // --- Fallback Android/Web ---
  fallbackContainer: {
    flex: 1,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  fallbackTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },
  fallbackBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    borderTopColor: '#FFFFFF',
    borderBottomColor: 'rgba(255, 255, 255, 0.30)',
    pointerEvents: 'none',
  },
  pillFallback: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_R,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // --- Pill partagé ---
  pillWrapper: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - PILL_H) / 2,
    left: 0,
    width: PILL_W,
    height: PILL_H,
    zIndex: 1,
  },
  pillGlass: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_R,
  },

  // --- Icônes ---
  iconsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.or,
    shadowColor: COLORS.or,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.vert,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.40,
    shadowRadius: 6,
    elevation: 4,
  },
});
