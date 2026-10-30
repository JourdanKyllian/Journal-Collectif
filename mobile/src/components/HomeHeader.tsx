import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Landmark,
  SlidersHorizontal,
  UserCircle,
  LogIn,
  ChevronDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';

interface HomeHeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onFilterPress: () => void;
  onUserPress: () => void;
  onCityPress: () => void;
  isCitySheetOpen?: boolean;
  isFilterActive?: boolean;
}

export default function HomeHeader({
  isLoggedIn,
  userName,
  onFilterPress,
  onUserPress,
  onCityPress,
  isCitySheetOpen = false,
  isFilterActive = false,
}: HomeHeaderProps) {
  const { currentCity } = useCity();

  // Reanimated rotation pour le chevron
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    chevronRotation.value = withSpring(isCitySheetOpen ? 180 : 0, {
      damping: 18,
      stiffness: 180,
    });
  }, [isCitySheetOpen, chevronRotation]);

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handleCityPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCityPress();
  };

  const handleFilterPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onFilterPress();
  };

  const handleUserPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onUserPress();
  };

  return (
    <View style={styles.header}>
      {/* Sélecteur de commune interactif */}
      <Pressable
        onPress={handleCityPress}
        style={({ pressed }) => [
          styles.brandRow,
          pressed && styles.brandRowPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Commune actuelle : ${currentCity.name}. Appuyez pour changer de ville.`}
      >
        <View style={styles.logoBox}>
          <Landmark size={20} color={COLORS.or} />
        </View>

        <View style={styles.brandTitleContainer}>
          <Text style={styles.brandPreTitle}>ÉDITION LOCALE</Text>
          <View style={styles.brandTitleRow}>
            <Text
              style={styles.journalTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentCity.shortName}
            </Text>
            <Animated.View
              style={[styles.chevronWrapper, animatedChevronStyle]}
            >
              <ChevronDown size={16} color={COLORS.vert} strokeWidth={2.5} />
            </Animated.View>
          </View>
        </View>
      </Pressable>

      {/* Actions à droite : Filtre & Profil */}
      <View style={styles.headerActions}>
        <Pressable
          onPress={handleFilterPress}
          style={({ pressed }) => [
            styles.iconButton,
            isFilterActive && styles.iconButtonActive,
            pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les filtres d'actualités"
          hitSlop={6}
        >
          <SlidersHorizontal
            size={18}
            color={isFilterActive ? COLORS.vert : COLORS.noir}
            strokeWidth={isFilterActive ? 2.5 : 2}
          />
          {isFilterActive && <View style={styles.filterActiveDot} />}
        </Pressable>

        <Pressable
          onPress={handleUserPress}
          style={({ pressed }) => [
            styles.userPill,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isLoggedIn ? 'Mon compte' : 'Connexion'}
        >
          {isLoggedIn ? (
            <>
              <UserCircle size={19} color={COLORS.or} />
              <Text style={styles.userPillText}>{userName || 'Mon compte'}</Text>
            </>
          ) : (
            <>
              <LogIn size={17} color={COLORS.blanc} />
              <Text style={[styles.userPillText, { color: COLORS.blanc }]}>
                Connexion
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanc,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.12)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 6,
    borderRadius: 14,
  },
  brandRowPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.vert,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTitleContainer: {
    justifyContent: 'center',
  },
  brandPreTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.champagne,
    letterSpacing: 0.8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  journalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.noir,
    letterSpacing: -0.4,
    maxWidth: 135,
  },
  chevronWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 28, 16, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonActive: {
    borderColor: COLORS.or,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.or,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.vert,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
  },
  userPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
});
