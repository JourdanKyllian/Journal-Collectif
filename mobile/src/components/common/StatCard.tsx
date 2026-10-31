import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

export interface StatCardProps {
  label: string;
  count: number | string;
  icon?: LucideIcon;
  iconColor?: string;
  isActive?: boolean;
  onPress?: () => void;
  accentColor?: string;
}

export default function StatCard({
  label,
  count,
  icon: Icon,
  iconColor,
  isActive = false,
  onPress,
  accentColor = COLORS.bleu,
}: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        isActive && [styles.cardActive, { borderColor: accentColor }],
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.count, isActive && { color: accentColor }]}>
          {count}
        </Text>
        {Icon && (
          <View style={styles.iconWrapper}>
            <Icon size={14} color={iconColor || (isActive ? accentColor : '#A0AEC0')} />
          </View>
        )}
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 80,
  },
  cardActive: {
    backgroundColor: '#F8FAFC',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  count: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  iconWrapper: {
    padding: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#718096',
  },
  labelActive: {
    color: COLORS.noir,
    fontFamily: FONTS.semiBold,
  },
});

