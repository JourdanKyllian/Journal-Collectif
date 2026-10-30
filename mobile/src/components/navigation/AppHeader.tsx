import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Landmark,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
import CitySelectorSheet from '@/components/CitySelectorSheet';

interface AppHeaderProps {
  /** Titre contextuel d'écran optionnel (ex: 'Rubriques', 'Outils') */
  pageContextTitle?: string;
  onDashboardPress?: () => void;
}

export default function AppHeader({
  pageContextTitle,
  onDashboardPress,
}: AppHeaderProps) {
  const { currentCity } = useCity();
  const { user } = useAuth();
  const [isCitySheetOpen, setIsCitySheetOpen] = useState(false);

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
    setIsCitySheetOpen(true);
  };

  const isStaffMember =
    user?.is_platform_admin === true ||
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'redacteur';

  const handleDashboardPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onDashboardPress) {
      onDashboardPress();
    } else {
      Toast.show({
        type: 'info',
        text1: 'Espace Rédaction & Gestion',
        text2: `Journal : ${currentCity.name} • Rôle : ${user?.role || 'Membre'}`,
      });
    }
  };

  return (
    <>
      <View style={styles.header}>
        {/* Sélecteur de territoire / journal étendu et valorisé */}
        <Pressable
          onPress={handleCityPress}
          style={({ pressed }) => [
            styles.brandRow,
            pressed && styles.brandRowPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Commune active : ${currentCity.name}. Appuyez pour changer d'édition territoriale.`}
        >
          <View style={styles.logoBox}>
            <Landmark size={20} color={COLORS.or} />
          </View>

          <View style={styles.brandTitleContainer}>
            <View style={styles.preTitleRow}>
              <Text style={styles.brandPreTitle}>
                {pageContextTitle
                  ? `ÉDITION • ${pageContextTitle.toUpperCase()}`
                  : `JOURNAL LOCAL • ${currentCity.department.toUpperCase()}`}
              </Text>
            </View>

            <View style={styles.brandTitleRow}>
              <Text
                style={styles.journalTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentCity.name}
              </Text>
              <Animated.View
                style={[styles.chevronWrapper, animatedChevronStyle]}
              >
                <ChevronDown size={16} color={COLORS.vert} strokeWidth={2.5} />
              </Animated.View>
            </View>
          </View>
        </Pressable>

        {/* Côté droit : Espace Dashboard pour les membres d'équipe, ou code postal discret */}
        <View style={styles.rightActions}>
          {isStaffMember ? (
            <Pressable
              onPress={handleDashboardPress}
              style={({ pressed }) => [
                styles.dashboardPill,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le panneau de gestion municipale"
            >
              <LayoutDashboard size={15} color={COLORS.or} />
              <Text style={styles.dashboardPillText}>Gestion</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCityPress}
              style={styles.postalCapsule}
              hitSlop={8}
            >
              <ShieldCheck size={13} color={COLORS.vert} />
              <Text style={styles.postalText}>{currentCity.postalCode}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Feuille de sélection de commune intégrée et accessible partout */}
      <CitySelectorSheet
        visible={isCitySheetOpen}
        onClose={() => setIsCitySheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanc,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.12)',
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
    paddingRight: 10,
  },
  brandRowPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.vert,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  brandTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  preTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    gap: 6,
    marginTop: 1,
  },
  journalTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: COLORS.noir,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  chevronWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11, 28, 16, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.vert,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  dashboardPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.blanc,
    letterSpacing: -0.2,
  },
  postalCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11, 28, 16, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  postalText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.5,
  },
});

