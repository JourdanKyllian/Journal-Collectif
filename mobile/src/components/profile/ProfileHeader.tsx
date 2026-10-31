import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Shield, UserCheck, LogOut, LogIn } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { UserProfile } from '@/context/AuthContext';

interface ProfileHeaderProps {
  user: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function ProfileHeader({ user, isLoggedIn, onLogout }: ProfileHeaderProps) {
  const displayName = user
    ? user.firstname && user.lastname
      ? `${user.firstname} ${user.lastname}`
      : user.firstname || user.email.split('@')[0]
    : 'Visiteur';

  const roleBadge = user
    ? user.is_platform_admin
      ? 'Super Admin'
      : user.role === 'admin'
      ? 'Administrateur'
      : user.role === 'redacteur'
      ? 'Rédacteur'
      : 'Citoyen Vérifié'
    : 'Non connecté';

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatar}>
        {user?.is_platform_admin ? (
          <Shield size={24} color={COLORS.or} />
        ) : (
          <UserCheck size={24} color={COLORS.or} />
        )}
      </View>
      <View style={styles.infoCol}>
        <View style={styles.roleBadgeContainer}>
          <Text style={styles.roleBadgeText}>{roleBadge.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email} numberOfLines={1}>
          {user?.email || 'Créez un compte pour synchroniser vos préférences'}
        </Text>
      </View>

      {isLoggedIn ? (
        <Pressable onPress={onLogout} style={styles.logoutBtn} hitSlop={6}>
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Quitter</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push('/modals/login')}
          style={styles.loginBtn}
          hitSlop={6}
        >
          <LogIn size={16} color={COLORS.noir} />
          <Text style={styles.loginBtnText}>Connexion</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: COLORS.vert,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(209, 160, 84, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  roleBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(209, 160, 84, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(209, 160, 84, 0.4)',
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.or,
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.or,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loginBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.noir,
  },
});
