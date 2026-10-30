import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerSkeleton from './ShimmerSkeleton';
import { COLORS } from '@/theme/tokens';

export default function ArticleCardSkeleton() {
  return (
    <View style={styles.card}>
      <ShimmerSkeleton width="100%" height={170} borderRadius={0} />
      <View style={styles.body}>
        <ShimmerSkeleton width={80} height={12} borderRadius={6} style={{ marginBottom: 10 }} />
        <ShimmerSkeleton width="90%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
        <ShimmerSkeleton width="70%" height={18} borderRadius={6} style={{ marginBottom: 14 }} />
        <View style={styles.footer}>
          <ShimmerSkeleton width={90} height={12} borderRadius={6} />
          <ShimmerSkeleton width={60} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    marginBottom: 16,
  },
  body: {
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 134, 113, 0.1)',
  },
});

