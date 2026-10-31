import React, { useState } from 'react';
import { StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import ScreenContainer from '@/components/layout/ScreenContainer';
import CitySelectorSheet from '@/components/CitySelectorSheet';
import ProfileHeader from '@/components/profile/ProfileHeader';
import AdminStudioBanner from '@/components/profile/AdminStudioBanner';
import CityPreferencesSection from '@/components/profile/CityPreferencesSection';
import NotificationPreferencesSection from '@/components/profile/NotificationPreferencesSection';

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
  const [subscribedCategoryIds, setSubscribedCategoryIds] = useState<number[]>([1, 2, 3]);

  const categoryList = MOCK_CATEGORIES.filter((c) => c.id !== 0);

  const isStaff =
    user?.is_platform_admin === true ||
    ['admin', 'super_admin', 'redacteur'].includes((user?.role || '').toLowerCase()) ||
    Boolean(user?.journal?.slug);

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

  return (
    <ScreenContainer headerContextTitle="Espace Citoyen">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          user={user}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />

        {isStaff && <AdminStudioBanner userRole={user?.role} />}

        <CityPreferencesSection
          currentCity={currentCity}
          followedCities={followedCities}
          isPrimary={isPrimary}
          isProManager={isProManager}
          hasAlertsEnabled={hasAlertsEnabled}
          onSwitchCity={handleSwitchCity}
          onSetPrimary={handleSetPrimary}
          onToggleAlerts={toggleAlertsForCity}
          onRemoveFollowed={handleRemoveFollowed}
          onOpenDirectory={handleOpenDirectory}
        />

        <NotificationPreferencesSection
          categories={categoryList}
          subscribedCategoryIds={subscribedCategoryIds}
          currentCityShortName={currentCity.shortName}
          onToggleCategory={toggleCategoryNotification}
          onTriggerTestAlert={triggerInstantNotification}
        />
      </ScrollView>

      <CitySelectorSheet
        visible={isCitySheetOpen}
        initialTab={sheetInitialTab}
        onClose={() => setIsCitySheetOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 130,
  },
});
