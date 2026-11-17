import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, Moon, MapPin, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface ProfilePreferencesTabProps {
  currentCityName: string;
  subscribedCategories: string[];
  alertsEnabled: boolean;
  darkModeEnabled: boolean;
  onToggleCategory: (cat: string) => void;
  onToggleAlerts: (value: boolean) => void;
  onToggleDarkMode: (value: boolean) => void;
  onOpenCitySelector: () => void;
}

const AVAILABLE_THEMES = [
  { id: 'culture', label: '🎭 Culture' },
  { id: 'travaux', label: '🏗️ Travaux' },
  { id: 'sport', label: '⚽ Sport' },
  { id: 'evenements', label: '🎉 Événements' },
  { id: 'ecologie', label: '🌱 Environnement' },
];

export default function ProfilePreferencesTab({
  currentCityName,
  subscribedCategories,
  alertsEnabled,
  darkModeEnabled,
  onToggleCategory,
  onToggleAlerts,
  onToggleDarkMode,
  onOpenCitySelector,
}: ProfilePreferencesTabProps) {
  const handleCategoryPress = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleCategory(id);
  };

  const handleAlertsToggle = (val: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleAlerts(val);
  };

  const handleDarkModeToggle = (val: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleDarkMode(val);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Abonnements & Thématiques</Text>
        <Text style={styles.subtitle}>
          Sélectionnez les sujets municipaux que vous souhaitez suivre en priorité
        </Text>
      </View>

      {/* PILLS THEMATIQUES */}
      <View style={styles.themesRow}>
        {AVAILABLE_THEMES.map((theme) => {
          const isSelected = subscribedCategories.includes(theme.id);
          return (
            <Pressable
              key={theme.id}
              onPress={() => handleCategoryPress(theme.id)}
              style={[
                styles.themeBadge,
                isSelected ? styles.themeBadgeSelected : styles.themeBadgeUnselected,
              ]}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.themeBadgeText,
                  isSelected && styles.themeBadgeTextSelected,
                ]}
              >
                {theme.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* SWITCH 1 & 2 OBLIGATOIRES DU BAREME */}
      <View style={styles.switchesGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchIconBox}>
            <Bell size={18} color={COLORS.or} />
          </View>
          <View style={styles.switchLabelBox}>
            <Text style={styles.switchTitle}>Alertes Mairie & Urgences</Text>
            <Text style={styles.switchDesc}>Notifications instantanées de la commune</Text>
          </View>
          <Switch
            value={alertsEnabled}
            onValueChange={handleAlertsToggle}
            trackColor={{ false: 'rgba(142, 134, 113, 0.3)', true: COLORS.or }}
            thumbColor={COLORS.blanc}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchIconBox}>
            <Moon size={18} color={COLORS.or} />
          </View>
          <View style={styles.switchLabelBox}>
            <Text style={styles.switchTitle}>Mode Sombre (Dark Mode)</Text>
            <Text style={styles.switchDesc}>Thème optimisé pour le confort nocturne</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: 'rgba(142, 134, 113, 0.3)', true: COLORS.or }}
            thumbColor={COLORS.blanc}
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* SELECTEUR D'EDITION COMMUNE */}
      <Pressable
        onPress={onOpenCitySelector}
        style={styles.citySelectorRow}
        hitSlop={6}
      >
        <View style={styles.switchIconBox}>
          <MapPin size={18} color={COLORS.or} />
        </View>
        <View style={styles.switchLabelBox}>
          <Text style={styles.switchTitle}>Édition Territoriale Suivie</Text>
          <Text style={styles.currentCityName}>{currentCityName}</Text>
        </View>
        <ChevronRight size={18} color={COLORS.champagne} />
      </Pressable>

      <View style={styles.divider} />

      {/* LIEN JURIDIQUE & CONFIDENTIALITÉ (RGPD / CGU) */}
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
          }
          router.push('/modals/privacy' as never);
        }}
        style={styles.citySelectorRow}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Consulter la confidentialité, les CGU et mentions légales"
      >
        <View style={styles.switchIconBox}>
          <ShieldCheck size={18} color={COLORS.vert} />
        </View>
        <View style={styles.switchLabelBox}>
          <Text style={styles.switchTitle}>Confidentialité &amp; Mentions</Text>
          <Text style={styles.currentCityName}>RGPD, CGU et protection des données</Text>
        </View>
        <ChevronRight size={18} color={COLORS.champagne} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.15)',
    paddingBottom: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 2,
    lineHeight: 15,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  themeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeBadgeSelected: {
    backgroundColor: COLORS.or,
    borderColor: COLORS.or,
  },
  themeBadgeUnselected: {
    backgroundColor: 'rgba(142, 134, 113, 0.08)',
    borderColor: 'rgba(142, 134, 113, 0.25)',
  },
  themeBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.champagne,
  },
  themeBadgeTextSelected: {
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
    marginVertical: 14,
  },
  switchesGroup: {
    gap: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabelBox: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  switchDesc: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 1,
  },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  currentCityName: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.or,
    marginTop: 2,
  },
});
