import React from 'react';
import { StyleSheet, ScrollView, Pressable, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/theme/tokens';

export interface PillCategory {
  id: number;
  libelle: string;
  icon: string;
}

interface CategoryPillsBarProps {
  categories: PillCategory[];
  selectedLabel: string;
  onSelect: (libelle: string) => void;
}

export default function CategoryPillsBar({
  categories,
  selectedLabel,
  onSelect,
}: CategoryPillsBarProps) {
  const handlePress = (libelle: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelect(libelle);
  };

  return (
    <BlurView intensity={60} tint="light" style={styles.blurContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {categories.map((cat) => {
          const isActive = selectedLabel === cat.libelle;
          return (
            <Pressable
              key={cat.id}
              onPress={() => handlePress(cat.libelle)}
              style={({ pressed }) => [
                styles.pill,
                isActive && styles.pillActive,
                pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filtrer par ${cat.libelle}`}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {cat.icon} {cat.libelle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.12)',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(245, 239, 230, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  pillActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  pillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.champagne,
  },
  pillTextActive: {
    color: COLORS.blanc,
  },
});

