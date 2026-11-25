import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface DataCountBadgeProps {
  total: number;
  labelSingular?: string;
  labelPlural?: string;
  isOffline?: boolean;
}

export default function DataCountBadge({
  total,
  labelSingular = 'élément',
  labelPlural = 'éléments',
  isOffline = false,
}: DataCountBadgeProps) {
  const label = total <= 1 ? labelSingular : labelPlural;

  return (
    <View style={styles.container}>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {total} {label}
        </Text>
      </View>

      {isOffline && (
        <View style={styles.offlineBadge}>
          <Zap size={11} color="#C05621" />
          <Text style={styles.offlineText}>Hors-ligne (cache)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  countText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.orAccessible,
    letterSpacing: 0.2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEEBC8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBD38D',
  },
  offlineText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#C05621',
  },
});
