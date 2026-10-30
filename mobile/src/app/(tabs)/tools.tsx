import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { Search, Car } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import PageHeader from '@/components/navigation/PageHeader';
import LostObjectsView from '@/components/tools/LostObjectsView';
import ParkingView from '@/components/tools/ParkingView';

const { width } = Dimensions.get('window');
const SEGMENT_PADDING = 3;
const CONTAINER_HORIZONTAL_MARGIN = 20;
const SEGMENT_BAR_WIDTH = width - CONTAINER_HORIZONTAL_MARGIN * 2;
const SEGMENT_WIDTH = (SEGMENT_BAR_WIDTH - SEGMENT_PADDING * 2) / 2;
const SEGMENT_BAR_HEIGHT = 48;

export default function ToolsScreen() {
  const { currentCity } = useCity();
  const [activeTab, setActiveTab] = useState<'lost' | 'parking'>('lost');

  // Shared value pour l'indicateur coulissant Liquid Glass (même physique que CustomTabBar)
  const translateX = useSharedValue(0);

  const handleTabSwitch = (tab: 'lost' | 'parking') => {
    if (tab === activeTab) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setActiveTab(tab);
    translateX.value = withSpring(tab === 'lost' ? 0 : SEGMENT_WIDTH, {
      damping: 22,
      stiffness: 240,
      mass: 0.8,
    });
  };

  const animatedSliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* En-tête de la page renommé "Outils" */}
      <PageHeader
        title="Outils"
        subtitle={`Services & vie pratique • ${currentCity.shortName}`}
      />

      {/* Sous-navigation Liquid Glass avec bulle coulissante fluide */}
      <View style={styles.selectorWrapper}>
        <View style={styles.segmentedContainer}>
          {/* Fond dépoli translucide */}
          <BlurView
            intensity={85}
            tint={Platform.OS === 'ios' ? 'systemUltraThinMaterialLight' : 'light'}
            style={styles.absoluteFill}
          />
          <View style={styles.translucentTint} />
          <View style={styles.specularBorder} />

          {/* Bulle Liquid Glass coulissante avec physique Reanimated */}
          <Animated.View
            style={[
              styles.slidingPill,
              { width: SEGMENT_WIDTH },
              animatedSliderStyle,
            ]}
          >
            {Platform.OS === 'ios' ? (
              <GlassView
                glassEffectStyle="regular"
                tintColor="rgba(255, 255, 255, 0.90)"
                style={styles.glassPillFill}
                pointerEvents="none"
              />
            ) : (
              <View style={styles.androidPillFill} />
            )}
          </Animated.View>

          {/* Onglet 1 : Objets Perdus */}
          <Pressable
            onPress={() => handleTabSwitch('lost')}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'lost' }}
            accessibilityLabel="Objets Perdus"
            hitSlop={{ top: 6, bottom: 6 }}
          >
            <Search
              size={16}
              color={activeTab === 'lost' ? COLORS.vert : 'rgba(26, 26, 26, 0.42)'}
              strokeWidth={activeTab === 'lost' ? 2.4 : 1.8}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'lost' && styles.tabLabelActive,
              ]}
            >
              Objets Perdus
            </Text>
            {activeTab === 'lost' && <View style={styles.activeDot} />}
          </Pressable>

          {/* Onglet 2 : Parkings */}
          <Pressable
            onPress={() => handleTabSwitch('parking')}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'parking' }}
            accessibilityLabel="Parkings"
            hitSlop={{ top: 6, bottom: 6 }}
          >
            <Car
              size={16}
              color={activeTab === 'parking' ? COLORS.vert : 'rgba(26, 26, 26, 0.42)'}
              strokeWidth={activeTab === 'parking' ? 2.4 : 1.8}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'parking' && styles.tabLabelActive,
              ]}
            >
              Parkings
            </Text>
            {activeTab === 'parking' && <View style={styles.activeDot} />}
          </Pressable>
        </View>
      </View>

      {/* Contenu fluide avec Reanimated */}
      <View style={styles.contentArea}>
        {activeTab === 'lost' ? (
          <Animated.View
            key="lost-view"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.flexFill}
          >
            <LostObjectsView />
          </Animated.View>
        ) : (
          <Animated.View
            key="parking-view"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.flexFill}
          >
            <ParkingView />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  selectorWrapper: {
    paddingHorizontal: CONTAINER_HORIZONTAL_MARGIN,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: COLORS.blanc,
  },
  segmentedContainer: {
    height: SEGMENT_BAR_HEIGHT,
    borderRadius: SEGMENT_BAR_HEIGHT / 2,
    padding: SEGMENT_PADDING,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFill,
  },
  translucentTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  specularBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: SEGMENT_BAR_HEIGHT / 2,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    pointerEvents: 'none',
  },
  slidingPill: {
    position: 'absolute',
    top: SEGMENT_PADDING,
    bottom: SEGMENT_PADDING,
    left: SEGMENT_PADDING,
    borderRadius: (SEGMENT_BAR_HEIGHT - SEGMENT_PADDING * 2) / 2,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  glassPillFill: {
    flex: 1,
    borderRadius: (SEGMENT_BAR_HEIGHT - SEGMENT_PADDING * 2) / 2,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  androidPillFill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: (SEGMENT_BAR_HEIGHT - SEGMENT_PADDING * 2) / 2,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    zIndex: 2,
    borderRadius: (SEGMENT_BAR_HEIGHT - SEGMENT_PADDING * 2) / 2,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: 'rgba(26, 26, 26, 0.45)',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: COLORS.vert,
    fontFamily: FONTS.headingBold,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.or,
  },
  contentArea: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
});
