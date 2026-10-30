import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { UserCheck, LogIn, LogOut, Globe, BellRing, Bell, Shield, Sparkles } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import PageHeader from '@/components/navigation/PageHeader';

export default function ProfileScreen() {
  const { currentCity, cities, selectCity } = useCity();
  const { user, isLoggedIn, logout } = useAuth();

  // Abonnements aux alertes push par thématique
  const [subscribedCategoryIds, setSubscribedCategoryIds] = useState<number[]>([1, 2, 3]);

  const categoryList = MOCK_CATEGORIES.filter((c) => c.id !== 0);

  const toggleCategoryNotification = (id: number, label: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSubscribedCategoryIds((prev) => {
      const isSub = prev.includes(id);
      const next = isSub ? prev.filter((item) => item !== id) : [...prev, id];
      Toast.show({
        type: isSub ? 'info' : 'success',
        text1: isSub ? 'Alerte désactivée' : 'Alerte activée',
        text2: isSub
          ? `Plus de notifications push pour « ${label} ».`
          : `Alertes push actives pour « ${label} ».`,
      });
      return next;
    });
  };

  const switchTenant = async (newSlug: string) => {
    await selectCity(newSlug);
    Toast.show({
      type: 'info',
      text1: 'Édition territoriale',
      text2: `Journal basculé sur : ${newSlug}`,
    });
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter de votre compte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const triggerInstantNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Test Direct Jury : Alerte Mairie',
        body: 'Démonstration instantanée du module natif expo-notifications.',
        data: { articleId: '1' },
      },
      trigger: null,
    });
  };

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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <PageHeader
        title="Espace Citoyen"
        subtitle="Paramètres, alertes push & profil"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte de profil citoyen dynamique */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.is_platform_admin ? (
              <Shield size={26} color={COLORS.or} />
            ) : isLoggedIn ? (
              <UserCheck size={26} color={COLORS.or} />
            ) : (
              <Sparkles size={26} color={COLORS.champagne} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.roleBadgeContainer}>
              <Text style={styles.roleBadgeText}>{roleBadge.toUpperCase()}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? 'Connectez-vous pour participer'}
            </Text>
          </View>

          {isLoggedIn ? (
            <Pressable
              onPress={handleLogout}
              style={styles.logoutBtn}
              hitSlop={8}
              accessibilityLabel="Se déconnecter"
            >
              <LogOut size={16} color={COLORS.urgent} />
              <Text style={styles.logoutBtnText}>Quitter</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/modals/login')}
              style={styles.loginBtn}
              accessibilityLabel="Se connecter"
            >
              <LogIn size={16} color={COLORS.noir} />
              <Text style={styles.loginBtnText}>Connexion</Text>
            </Pressable>
          )}
        </View>

        {/* Section 1 : Préférences de notifications push */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS PUSH PAR THÉMATIQUE</Text>
          <Bell size={14} color={COLORS.vert} />
        </View>
        <Text style={styles.sectionHint}>
          Choisissez les rubriques pour lesquelles vous souhaitez recevoir les alertes instantanées sur votre téléphone.
        </Text>

        <View style={styles.notifContainer}>
          {categoryList.map((cat) => {
            const isSub = subscribedCategoryIds.includes(cat.id);
            return (
              <View key={cat.id} style={styles.notifRow}>
                <View style={styles.notifEmojiBox}>
                  <Text style={styles.notifEmoji}>{cat.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifLabel}>{cat.libelle}</Text>
                  <Text style={styles.notifDesc} numberOfLines={1}>
                    {cat.description}
                  </Text>
                </View>
                <Switch
                  value={isSub}
                  onValueChange={() => toggleCategoryNotification(cat.id, cat.libelle)}
                  trackColor={{ false: '#D1CFC9', true: COLORS.or }}
                  thumbColor={isSub ? COLORS.vert : '#FFF'}
                />
              </View>
            );
          })}
        </View>

        {/* Section 2 : Commune / Tenant actif */}
        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
          COMMUNE ACTIVE (EN-TÊTE X-JOURNAL)
        </Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {cities.map((city) => (
            <Pressable
              key={city.slug}
              onPress={() => switchTenant(city.slug)}
              style={[
                styles.tenantRow,
                currentCity.slug === city.slug && styles.tenantActive,
              ]}
            >
              <Globe
                size={18}
                color={currentCity.slug === city.slug ? COLORS.or : COLORS.champagne}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.tenantText}>{city.slug}</Text>
                <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.champagne }}>
                  {city.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Section 3 : Outil de test jury */}
        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
          DÉMONSTRATION NOTIFICATIONS
        </Text>
        <Pressable onPress={triggerInstantNotification} style={styles.demoBtn}>
          <BellRing size={18} color={COLORS.or} />
          <Text style={styles.demoBtnText}>
            Déclencher une alerte test immédiate
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blanc },
  content: { padding: 20, paddingBottom: 130 },
  profileCard: {
    backgroundColor: COLORS.vert,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  roleBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.or,
    letterSpacing: 0.5,
  },
  name: { fontFamily: FONTS.headingBold, fontSize: 16, color: COLORS.blanc },
  email: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.champagne, marginTop: 1 },
  loginBtn: {
    backgroundColor: COLORS.or,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loginBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.noir },
  logoutBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  logoutBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: '#FCA5A5' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  notifContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.12)',
  },
  notifEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifEmoji: {
    fontSize: 18,
  },
  notifLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  notifDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    marginTop: 1,
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.18)',
  },
  tenantActive: {
    borderWidth: 1.5,
    borderColor: COLORS.or,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  tenantText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.noir },
  demoBtn: {
    backgroundColor: COLORS.noir,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  demoBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.blanc },
});
