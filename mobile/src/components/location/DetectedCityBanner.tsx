import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MapPin, ArrowRight, X } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';

export default function DetectedCityBanner() {
  const {
    detectedCity,
    currentCity,
    selectCity,
    dismissDetectedCity,
  } = useCity();

  if (!detectedCity || detectedCity.slug === currentCity.slug) {
    return null;
  }

  const handleSwitch = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await selectCity(detectedCity.slug);
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    dismissDetectedCity();
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOutUp}
      style={styles.container}
    >
      <View style={styles.bannerCard}>
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <MapPin size={16} color={COLORS.or} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.badgeText}>COMMUNE DÉTECTÉE</Text>
            <Text style={styles.title} numberOfLines={1}>
              Vous êtes à {detectedCity.name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Consulter l&apos;édition locale de {detectedCity.shortName} ?
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={handleSwitch} style={styles.switchBtn} hitSlop={4}>
            <Text style={styles.switchBtnText}>Basculer</Text>
            <ArrowRight size={13} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={handleDismiss} style={styles.dismissBtn} hitSlop={8}>
            <X size={15} color="#94A3B8" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(209, 160, 84, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.or,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.vert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.or,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.vert,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  switchBtnText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  dismissBtn: {
    padding: 4,
  },
});
