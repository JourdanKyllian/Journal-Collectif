import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Landmark, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface AdminStudioBannerProps {
  userRole?: string;
}

export default function AdminStudioBanner({ userRole }: AdminStudioBannerProps) {
  return (
    <View style={styles.proStudioCard}>
      <View style={styles.proStudioHeader}>
        <View style={styles.proStudioBadge}>
          <Landmark size={12} color={COLORS.or} />
          <Text style={styles.proStudioBadgeText}>ESPACE GESTIONNAIRE</Text>
        </View>
        <Text style={styles.proRoleBadge}>{userRole || 'Rédacteur'}</Text>
      </View>

      <Text style={styles.proStudioTitle}>Studio de Rédaction Mobile</Text>
      <Text style={styles.proStudioDesc}>
        Modérez les propositions citoyennes, gérez les alertes, vos bons plans et vos équipes directement depuis votre smartphone.
      </Text>

      <Pressable
        onPress={() => router.push('/admin/dashboard')}
        style={styles.proStudioActionBtn}
        hitSlop={6}
      >
        <Sparkles size={16} color={COLORS.noir} />
        <Text style={styles.proStudioActionText}>Ouvrir le Studio de Rédaction</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  proStudioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(209, 160, 84, 0.45)',
    marginBottom: 26,
    shadowColor: COLORS.or,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  proStudioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  proStudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(209, 160, 84, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proStudioBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.or,
    letterSpacing: 0.6,
  },
  proRoleBadge: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#718096',
    textTransform: 'capitalize',
  },
  proStudioTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    marginBottom: 6,
  },
  proStudioDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#4A5568',
    lineHeight: 18,
    marginBottom: 14,
  },
  proStudioActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.or,
    paddingVertical: 12,
    borderRadius: 12,
  },
  proStudioActionText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
});

