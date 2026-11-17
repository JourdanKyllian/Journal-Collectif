import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Shield, User, LogOut, LogIn, Award } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { UserProfile } from '@/context/AuthContext';

export const AVATAR_COLORS: Record<string, string> = {
  default_01: '#217346', // Vert forêt
  default_02: '#D4AF37', // Or
  default_03: '#1F2937', // Noir ardoise
  default_04: '#C5B498', // Champagne chaud
};

interface ProfileHeaderProps {
  user: UserProfile | null;
  isLoggedIn: boolean;
  currentCityName: string;
  contributionsCount: number;
  onLogout: () => void;
}

export default function ProfileHeader({
  user,
  isLoggedIn,
  currentCityName,
  contributionsCount,
  onLogout,
}: ProfileHeaderProps) {
  const displayName = user
    ? user.firstname && user.lastname
      ? `${user.firstname} ${user.lastname}`
      : user.firstname || user.email.split('@')[0]
    : 'Visiteur';

  const roleBadge = user
    ? user.is_platform_admin
      ? 'Gérant Plateforme'
      : user.role === 'super_admin'
      ? 'Gérant'
      : user.role === 'admin'
      ? 'Administrateur'
      : user.role === 'redacteur'
      ? 'Rédacteur'
      : 'Citoyen Vérifié'
    : 'Mode Invité';

  const avatarBg = AVATAR_COLORS[user?.avatar_ref || 'default_01'] || '#217346';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          {user?.is_platform_admin ? (
            <Shield size={26} color={COLORS.blanc} />
          ) : (
            <User size={26} color={COLORS.blanc} />
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleBadge.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email || 'Synchronisez vos données sur votre commune'}
          </Text>
        </View>

        {isLoggedIn ? (
          <Pressable onPress={onLogout} style={styles.logoutBtn} hitSlop={8} accessibilityLabel="Déconnexion" testID="btn-logout">
            <LogOut size={16} color="#EF4444" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/modals/login')}
            style={styles.loginBtn}
            hitSlop={8}
            accessibilityLabel="Se connecter"
            testID="btn-login"
          >
            <LogIn size={15} color={COLORS.noir} />
            <Text style={styles.loginBtnText}>Connexion</Text>
          </Pressable>
        )}
      </View>

      {/* 2 STATS OBLIGATOIRES DU BARÈME */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={styles.statIconBadge}>
            <Award size={14} color={COLORS.or} />
          </View>
          <View>
            <Text style={styles.statValue}>{contributionsCount}</Text>
            <Text style={styles.statLabel}>Contributions</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={[styles.statIconBadge, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Text style={{ fontSize: 13 }}>🏛️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statValue} numberOfLines={1}>
              {currentCityName}
            </Text>
            <Text style={styles.statLabel}>Édition Active</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.vert,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.or,
    letterSpacing: 0.6,
  },
  name: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 1,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.or,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loginBtnText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 12,
  },
});
