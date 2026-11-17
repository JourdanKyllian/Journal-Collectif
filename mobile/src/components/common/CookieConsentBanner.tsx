import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Shield, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

import { COLORS, FONTS } from '@/theme/tokens';
import { ConsentService, ConsentChoice } from '@/lib/services/consent.service';

interface CookieConsentBannerProps {
  onConsentChange?: (choice: ConsentChoice) => void;
}

export default function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    ConsentService.getConsentChoice().then((choice) => {
      // Affichage uniquement si l'utilisateur ne s'est pas encore prononcé
      if (choice === null) {
        setIsVisible(true);
      }
    });
  }, []);

  const handleChoice = async (choice: ConsentChoice) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await ConsentService.saveConsentChoice(choice);
    setIsVisible(false);
    onConsentChange?.(choice);
  };

  const handleLearnMore = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push('/modals/privacy' as never);
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(350).springify()}
      exiting={FadeOutDown.duration(250)}
      style={styles.floatingContainer}
    >
      <View style={styles.card}>
        {/* Header discret */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Shield size={14} color={COLORS.or} />
            <Text style={styles.badgeText}>Vie privée & Traceurs</Text>
          </View>
          <Pressable
            onPress={handleLearnMore}
            hitSlop={8}
            style={styles.learnMoreLink}
            accessibilityRole="link"
            accessibilityLabel="En savoir plus sur la politique de confidentialité"
          >
            <Text style={styles.learnMoreText}>Détails</Text>
            <ChevronRight size={12} color={COLORS.champagne} />
          </Pressable>
        </View>

        {/* Message d'information non culpabilisant */}
        <Text style={styles.message}>
          Nous utilisons des données locales strictement nécessaires au fonctionnement de l&apos;application
          (session, commune active) et des traceurs anonymes d&apos;audience citoyenne.
        </Text>

        {/* Boutons d'action équilibrés (conformité CNIL) */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => handleChoice('essential')}
            style={({ pressed }) => [
              styles.btnSecondary,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Accepter uniquement les traceurs essentiels"
          >
            <Text style={styles.btnSecondaryText}>Essentiels uniquement</Text>
          </Pressable>

          <Pressable
            onPress={() => handleChoice('all')}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tout accepter"
          >
            <Text style={styles.btnPrimaryText}>Tout accepter</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 84, // Flotte au-dessus de la barre d'onglets sans la masquer
    left: 14,
    right: 14,
    zIndex: 999,
  },
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.vert,
  },
  learnMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  learnMoreText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    textDecorationLine: 'underline',
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.noir,
    lineHeight: 17,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.champagne,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.vert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
});
