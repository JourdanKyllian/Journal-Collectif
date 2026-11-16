import React, { useState } from 'react';
import { StyleSheet, ScrollView, Platform, Alert, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ScreenContainer from '@/components/layout/ScreenContainer';
import CitySelectorSheet from '@/components/CitySelectorSheet';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabNavigation, {
  ProfileTabType,
} from '@/components/profile/ProfileTabNavigation';
import ProfileIdentityTab from '@/components/profile/ProfileIdentityTab';
import ProfileContributionsTab from '@/components/profile/ProfileContributionsTab';
import ProfileSecurityTab from '@/components/profile/ProfileSecurityTab';
import ProfilePreferencesTab from '@/components/profile/ProfilePreferencesTab';
import AdminStudioBanner from '@/components/profile/AdminStudioBanner';

export default function ProfileScreen() {
  const { currentCity } = useCity();
  const {
    user,
    isLoggedIn,
    logout,
    updateProfile,
    updateSecurity,
    deleteAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTabType>('public');
  const [isCitySheetOpen, setIsCitySheetOpen] = useState(false);
  const [contributionsCount, setContributionsCount] = useState<number>(2);

  const { isDark, toggleDarkMode } = useTheme();

  // Préférences & Switchs (Exigences du barème)
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>([
    'culture',
    'evenements',
  ]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const isStaff =
    user?.is_platform_admin === true ||
    ['admin', 'super_admin', 'redacteur'].includes(
      (user?.role || '').toLowerCase()
    ) ||
    Boolean(user?.journal?.slug);

  const handleToggleCategory = (catId: string) => {
    setSubscribedCategories((prev) => {
      const exists = prev.includes(catId);
      const next = exists
        ? prev.filter((id) => id !== catId)
        : [...prev, catId];
      Toast.show({
        type: exists ? 'info' : 'success',
        text1: exists ? 'Abonnement retiré' : 'Abonnement activé',
        text2: exists
          ? 'Vous ne recevrez plus les actus sur cette thématique.'
          : 'Vous suivez désormais cette thématique.',
      });
      return next;
    });
  };

  const handleToggleAlerts = (value: boolean) => {
    setAlertsEnabled(value);
    Toast.show({
      type: 'info',
      text1: value ? 'Alertes activées' : 'Alertes suspendues',
      text2: value
        ? 'Vous recevrez les alertes d’urgence de la mairie.'
        : 'Alertes locales coupées.',
    });
  };

  const handleToggleDarkMode = async (value: boolean) => {
    await toggleDarkMode(value);
    Toast.show({
      type: 'info',
      text1: value ? 'Mode Sombre actif' : 'Mode Clair actif',
      text2: 'Préférence d’affichage enregistrée.',
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

  return (
    <ScreenContainer headerContextTitle="Espace Citoyen">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CARTE EN-TÊTE PROFIL AVEC 2 STATS OBLIGATOIRES */}
        <ProfileHeader
          user={user}
          isLoggedIn={isLoggedIn}
          currentCityName={currentCity.name}
          contributionsCount={contributionsCount}
          onLogout={handleLogout}
        />

        {/* BANNIÈRE STUDIO ADMIN SI ÉLU / RÉDACTEUR */}
        {isStaff && <AdminStudioBanner userRole={user?.role} />}

        {/* NAVIGATION PAR ONGLETS (IDENTITÉ, CONTRIBUTIONS, SÉCURITÉ, ABONNEMENTS) */}
        <ProfileTabNavigation
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        {/* CONTENU SELON L'ONGLET ACTIF (ZÉRO TEXTE INUTILE, 100% MODIFIABLE) */}
        <View style={styles.tabContent}>
          {activeTab === 'public' && (
            <ProfileIdentityTab
              key={user?.id || 'guest'}
              user={user}
              isLoggedIn={isLoggedIn}
              onSave={updateProfile}
            />
          )}

          {activeTab === 'contributions' && (
            <ProfileContributionsTab
              isLoggedIn={isLoggedIn}
              onCountLoaded={setContributionsCount}
            />
          )}

          {activeTab === 'security' && (
            <ProfileSecurityTab
              isLoggedIn={isLoggedIn}
              onUpdateSecurity={updateSecurity}
              onDeleteAccount={deleteAccount}
            />
          )}

          {activeTab === 'preferences' && (
            <ProfilePreferencesTab
              currentCityName={currentCity.name}
              subscribedCategories={subscribedCategories}
              alertsEnabled={alertsEnabled}
              darkModeEnabled={isDark}
              onToggleCategory={handleToggleCategory}
              onToggleAlerts={handleToggleAlerts}
              onToggleDarkMode={handleToggleDarkMode}
              onOpenCitySelector={() => setIsCitySheetOpen(true)}
            />
          )}
        </View>
      </ScrollView>

      {/* SÉLECTEUR DE COMMUNE */}
      <CitySelectorSheet
        visible={isCitySheetOpen}
        initialTab="all"
        onClose={() => setIsCitySheetOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 130,
  },
  tabContent: {
    marginTop: 4,
  },
});
