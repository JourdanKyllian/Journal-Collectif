import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { User, FileText, Shield, Star } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

export type ProfileTabType = 'public' | 'contributions' | 'security' | 'preferences';

interface ProfileTabNavigationProps {
  activeTab: ProfileTabType;
  onChangeTab: (tab: ProfileTabType) => void;
}

export default function ProfileTabNavigation({
  activeTab,
  onChangeTab,
}: ProfileTabNavigationProps) {
  const tabs = [
    { id: 'public' as const, label: 'Identité', icon: User },
    { id: 'contributions' as const, label: 'Contributions', icon: FileText },
    { id: 'security' as const, label: 'Sécurité', icon: Shield },
    { id: 'preferences' as const, label: 'Abonnements', icon: Star },
  ];

  const handlePress = (tabId: ProfileTabType) => {
    if (tabId === activeTab) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChangeTab(tabId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <Pressable
              key={tab.id}
              onPress={() => handlePress(tab.id)}
              style={[styles.pill, isActive && styles.pillActive]}
            >
              <IconComponent
                size={14}
                color={isActive ? COLORS.noir : COLORS.champagne}
              />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  pillActive: {
    backgroundColor: COLORS.or,
    borderColor: COLORS.or,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.champagne,
  },
  pillTextActive: {
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
});
