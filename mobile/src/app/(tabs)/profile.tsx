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
import { router } from 'expo-router';
import {
  UserCheck,
  LogIn,
  LogOut,
  BellRing,
  Bell,
  Shield,
  Star,
  Trash2,
  Plus,
  Landmark,
  Check,
  Compass,
  Sparkles,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import ScreenContainer from '@/components/layout/ScreenContainer';
import CitySelectorSheet from '@/components/CitySelectorSheet';

export default function ProfileScreen() {
  const {
    currentCity,
    followedCities,
    isPrimary,
    selectCity,
    setPrimaryCity,
    toggleFollowCity,
    toggleAlertsForCity,
    hasAlertsEnabled,
    isProManager,
  } = useCity();

  const { user, isLoggedIn, logout } = useAuth();
  const [isCitySheetOpen, setIsCitySheetOpen] = useState(false);
  const [sheetInitialTab, setSheetInitialTab] = useState<'followed' | 'all'>('followed');

  const isStaff =
    user?.is_platform_admin === true ||
    ['admin', 'super_admin', 'redacteur'].includes((user?.role || '').toLowerCase()) ||
    Boolean(user?.journal?.slug);

  // Abonnements aux alertes push par thématique locale
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
        text1: isSub ? 'Alerte thématique désactivée' : 'Alerte thématique activée',
        text2: isSub
          ? `Plus de notifications pour « ${label} ».`
          : `Alertes push actives pour « ${label} ».`,
      });
      return next;
    });
  };

  const handleOpenDirectory = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSheetInitialTab('all');
    setIsCitySheetOpen(true);
  };

  const handleSwitchCity = async (slug: string) => {
    if (slug === currentCity.slug) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await selectCity(slug);
  };

  const handleSetPrimary = async (slug: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setPrimaryCity(slug);
  };

  const handleRemoveFollowed = (slug: string, name: string) => {
    if (followedCities.length <= 1) {
      Toast.show({
        type: 'error',
        text1: 'Action impossible',
        text2: 'Vous devez suivre au moins une édition territoriale.',
      });
      return;
    }

    Alert.alert(
      'Retirer cette édition ?',
      `Êtes-vous sûr de ne plus vouloir suivre « ${name} » dans vos journaux d'intérêt ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await toggleFollowCity(slug);
          },
        },
      ]
    );
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
        title: `🚨 Alerte Mairie • ${currentCity.name}`,
        body: 'Démonstration des notifications locales paramétrées selon vos préférences territoriales.',
        data: { citySlug: currentCity.slug },
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
    <ScreenContainer headerContextTitle="Espace Citoyen">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte de profil citoyen dynamique */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.is_platform_admin ? (
              <Shield size={24} color={COLORS.or} />
            ) : (
              <UserCheck size={24} color={COLORS.or} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.roleBadgeContainer}>
              <Text style={styles.roleBadgeText}>{roleBadge.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>
              {user?.email || 'Créez un compte pour synchroniser vos préférences'}
            </Text>
          </View>

          {isLoggedIn ? (
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <LogOut size={16} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Quitter</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/modals/login')}
              style={styles.loginBtn}
            >
              <LogIn size={16} color={COLORS.noir} />
              <Text style={styles.loginBtnText}>Connexion</Text>
            </Pressable>
          )}
        </View>

        {/* Module Espace Rédaction Pro */}
        {isStaff && (
          <View style={styles.proStudioCard}>
            <View style={styles.proStudioHeader}>
              <View style={styles.proStudioBadge}>
                <Landmark size={12} color={COLORS.or} />
                <Text style={styles.proStudioBadgeText}>ESPACE GESTIONNAIRE</Text>
              </View>
              <Text style={styles.proRoleBadge}>{user?.role || 'Rédacteur'}</Text>
            </View>

            <Text style={styles.proStudioTitle}>
              Studio de Rédaction Mobile
            </Text>
            <Text style={styles.proStudioDesc}>
              {"Modérez les demandes citoyennes, gérez les articles en ligne et publiez des actualités directement depuis votre téléphone."}
            </Text>

            <Pressable
              onPress={() => router.push('/admin/dashboard')}
              style={styles.proStudioActionBtn}
              hitSlop={6}
            >
              <Sparkles size={16} color={COLORS.noir} />
              <Text style={styles.proStudioActionText}>
                Ouvrir le Studio de Rédaction
              </Text>
            </Pressable>
          </View>
        )}

        {/* Section 1 : Gestion des éditions territoriales & Préférences */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            MES ÉDITIONS TERRITORIALES ({followedCities.length})
          </Text>
          {isProManager ? (
            <View style={styles.proLockedBadge}>
              <Text style={styles.proLockedBadgeText}>Édition liée</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleOpenDirectory}
              style={styles.addEditionLink}
              hitSlop={6}
            >
              <Plus size={14} color={COLORS.vert} />
              <Text style={styles.addEditionLinkText}>Ajouter</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.sectionHint}>
          {"Sélectionnez les journaux locaux dont vous souhaitez suivre l'actualité et recevoir les alertes."}
        </Text>

        <View style={styles.editionsContainer}>
          {followedCities.map((city) => {
            const isSelected = city.slug === currentCity.slug;
            const isThisPrimary = isPrimary(city.slug);
            const alertsActive = hasAlertsEnabled(city.slug);

            return (
              <View
                key={city.slug}
                style={[
                  styles.editionCard,
                  isSelected && styles.editionCardActive,
                ]}
              >
                {/* Ligne principale du journal */}
                <Pressable
                  onPress={() => handleSwitchCity(city.slug)}
                  style={styles.editionTopRow}
                >
                  <View
                    style={[
                      styles.editionIconBox,
                      isSelected && styles.editionIconBoxActive,
                    ]}
                  >
                    <Landmark
                      size={20}
                      color={isSelected ? COLORS.blanc : COLORS.champagne}
                    />
                  </View>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.editionNameRow}>
                      <Text
                        style={[
                          styles.editionName,
                          isSelected && styles.editionNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {city.name}
                      </Text>
                      <View style={styles.postalBadge}>
                        <Text style={styles.postalText}>{city.postalCode}</Text>
                      </View>
                    </View>
                    <Text style={styles.editionJournalType} numberOfLines={1}>
                      {city.nomJournal || city.typeJournal || 'Journal territorial'}
                    </Text>
                  </View>

                  {/* Badges de statut */}
                  <View style={styles.statusBadgesCol}>
                    {isSelected ? (
                      <View style={styles.activeTag}>
                        <Check size={11} color={COLORS.blanc} strokeWidth={3} />
                        <Text style={styles.activeTagText}>Actif</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleSwitchCity(city.slug)}
                        style={styles.activateBtn}
                      >
                        <Text style={styles.activateBtnText}>Consulter</Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>

                {/* Séparateur interne */}
                <View style={styles.editionDivider} />

                {/* Barre d'options et préférences pour cette édition */}
                <View style={styles.editionOptionsRow}>
                  {/* Option : Édition principale */}
                  <Pressable
                    onPress={() => handleSetPrimary(city.slug)}
                    style={[
                      styles.primaryOptionBtn,
                      isThisPrimary && styles.primaryOptionBtnActive,
                    ]}
                    hitSlop={6}
                  >
                    <Star
                      size={13}
                      color={isThisPrimary ? COLORS.or : COLORS.champagne}
                      fill={isThisPrimary ? COLORS.or : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.primaryOptionText,
                        isThisPrimary && styles.primaryOptionTextActive,
                      ]}
                    >
                      {isThisPrimary ? 'Édition principale' : 'Définir principale'}
                    </Text>
                  </Pressable>

                  {/* Option : Notifications push de cette commune */}
                  <View style={styles.notifToggleContainer}>
                    <Bell
                      size={13}
                      color={alertsActive ? COLORS.vert : COLORS.champagne}
                    />
                    <Text style={styles.notifToggleLabel}>Alertes</Text>
                    <Switch
                      value={alertsActive}
                      onValueChange={() => toggleAlertsForCity(city.slug)}
                      trackColor={{ false: '#D1CFC9', true: COLORS.or }}
                      thumbColor={alertsActive ? COLORS.vert : '#FFF'}
                      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                  </View>

                  {/* Option : Retirer des éditions (si > 1) */}
                  {followedCities.length > 1 && !isThisPrimary && (
                    <Pressable
                      onPress={() => handleRemoveFollowed(city.slug, city.name)}
                      hitSlop={8}
                      style={styles.deleteEditionBtn}
                      accessibilityLabel={`Ne plus suivre ${city.name}`}
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {/* Bouton pour explorer l'annuaire et ajouter un journal */}
          <Pressable
            onPress={handleOpenDirectory}
            style={styles.addJournalButton}
          >
            <Compass size={18} color={COLORS.vert} />
            <Text style={styles.addJournalButtonText}>
              {"Explorer l'annuaire des journaux locaux"}
            </Text>
          </Pressable>
        </View>

        {/* Section 2 : Préférences thématiques des notifications */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          ABONNEMENTS THÉMATIQUES
        </Text>
        <Text style={styles.sectionHint}>
          {"Choisissez les rubriques prioritaires pour vos notifications sur l'ensemble de vos éditions."}
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

        {/* Section 3 : Démonstration notifications locales */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          {"TEST DU DISPOSITIF D'ALERTES"}
        </Text>
        <Pressable onPress={triggerInstantNotification} style={styles.demoBtn}>
          <BellRing size={18} color={COLORS.or} />
          <Text style={styles.demoBtnText}>
            Déclencher une alerte test sur {currentCity.shortName}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Feuille de sélection & annuaire */}
      <CitySelectorSheet
        visible={isCitySheetOpen}
        initialTab={sheetInitialTab}
        onClose={() => setIsCitySheetOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 3,
    marginBottom: 12,
    lineHeight: 16,
  },
  addEditionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11, 28, 16, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addEditionLinkText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  editionsContainer: {
    gap: 10,
  },
  editionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    padding: 13,
  },
  editionCardActive: {
    borderColor: COLORS.or,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
  },
  editionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  editionIconBoxActive: {
    backgroundColor: COLORS.vert,
  },
  editionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editionName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14.5,
    color: COLORS.noir,
  },
  editionNameActive: {
    color: COLORS.vert,
  },
  postalBadge: {
    backgroundColor: 'rgba(142, 134, 113, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  postalText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.noir,
  },
  editionJournalType: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: COLORS.champagne,
    marginTop: 1,
  },
  statusBadgesCol: {
    alignItems: 'flex-end',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.vert,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10.5,
    color: COLORS.blanc,
  },
  activateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
  },
  activateBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.champagne,
  },
  editionDivider: {
    height: 1,
    backgroundColor: 'rgba(142, 134, 113, 0.12)',
    marginVertical: 10,
  },
  editionOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(142, 134, 113, 0.1)',
  },
  primaryOptionBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
  },
  primaryOptionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.champagne,
  },
  primaryOptionTextActive: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.or,
  },
  notifToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifToggleLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
  },
  deleteEditionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  addJournalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 28, 16, 0.2)',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addJournalButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    color: COLORS.vert,
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
  demoBtn: {
    backgroundColor: COLORS.noir,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  demoBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.blanc },
  proStudioCard: {
    backgroundColor: COLORS.vert,
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
    gap: 5,
    backgroundColor: 'rgba(201, 158, 57, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  proStudioBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.or,
    letterSpacing: 0.5,
  },
  proRoleBadge: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
  },
  proStudioTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 17,
    color: COLORS.blanc,
    marginBottom: 6,
  },
  proStudioDesc: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 18,
    marginBottom: 14,
  },
  proStudioActionBtn: {
    backgroundColor: COLORS.or,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  proStudioActionText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.noir,
    fontWeight: '700',
  },
  proLockedBadge: {
    backgroundColor: '#EBE7DE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  proLockedBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: '#657169',
  },
});
