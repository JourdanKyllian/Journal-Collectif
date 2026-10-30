import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
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
  Star,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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
  const { currentCity, followedCities, selectCity, isPrimary } = useCity();
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

  const handleQuickSwitch = async (slug: string) => {
    if (slug === currentCity.slug) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await selectCity(slug);
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
      router.push('/admin/dashboard');
    }
  };

  const isCurrentPrimary = isPrimary(currentCity.slug);

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
                  : `ÉDITION LOCALE • ${currentCity.shortName.toUpperCase()}`}
              </Text>
              {isCurrentPrimary && (
                <View style={styles.primaryIndicator}>
                  <Star size={9} color={COLORS.or} fill={COLORS.or} />
                </View>
              )}
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
              <Text style={styles.dashboardPillText}>Studio Pro</Text>
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

      {/* Raccourci rapide d'éditions : visible si l'utilisateur suit au moins 2 journaux */}
      {followedCities.length > 1 && (
        <View style={styles.quickBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickBarContent}
          >
            {followedCities.map((city) => {
              const isSelected = city.slug === currentCity.slug;
              const isCityPrimary = isPrimary(city.slug);

              return (
                <Pressable
                  key={city.slug}
                  onPress={() => handleQuickSwitch(city.slug)}
                  style={[
                    styles.quickPill,
                    isSelected && styles.quickPillSelected,
                  ]}
                  hitSlop={{ top: 4, bottom: 4 }}
                >
                  {isCityPrimary && (
                    <Star
                      size={9}
                      color={isSelected ? COLORS.blanc : COLORS.or}
                      fill={isSelected ? COLORS.blanc : COLORS.or}
                    />
                  )}
                  <Text
                    style={[
                      styles.quickPillText,
                      isSelected && styles.quickPillTextSelected,
                    ]}
                  >
                    {city.shortName}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              onPress={handleCityPress}
              style={styles.quickAddBtn}
              hitSlop={{ top: 4, bottom: 4 }}
            >
              <Plus size={12} color={COLORS.champagne} />
              <Text style={styles.quickAddText}>Éditions</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

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
    gap: 5,
    marginBottom: 2,
  },
  brandPreTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9.5,
    color: COLORS.or,
    letterSpacing: 0.8,
  },
  primaryIndicator: {
    paddingHorizontal: 3,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journalTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.noir,
    letterSpacing: -0.3,
  },
  chevronWrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.vert,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11.5,
    color: COLORS.blanc,
    letterSpacing: 0.2,
  },
  postalCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 134, 113, 0.14)',
  },
  postalText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  quickBarContainer: {
    backgroundColor: COLORS.blanc,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.08)',
    paddingVertical: 6,
  },
  quickBarContent: {
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.16)',
  },
  quickPillSelected: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  quickPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11.5,
    color: COLORS.champagne,
  },
  quickPillTextSelected: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.blanc,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    borderStyle: 'dashed',
  },
  quickAddText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
  },
});
