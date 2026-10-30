import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AlertTriangle, Info, PartyPopper, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { MobileAlert } from '@/lib/mock-data';

interface AlertBannerProps {
  alerts: MobileAlert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (alerts.length <= 1 || dismissed) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [alerts.length, dismissed]);

  if (dismissed || alerts.length === 0) return null;

  const alert = alerts[currentIdx];

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          bg: '#B91C1C',
          badgeBg: 'rgba(255, 255, 255, 0.22)',
          textColor: COLORS.blanc,
          badgeTextColor: COLORS.blanc,
          icon: AlertTriangle,
          label: 'URGENT',
        };
      case 'event':
        return {
          bg: COLORS.vert,
          badgeBg: 'rgba(212, 175, 55, 0.25)',
          textColor: COLORS.blanc,
          badgeTextColor: COLORS.or,
          icon: PartyPopper,
          label: 'ÉVÉNEMENT',
        };
      case 'info':
      default:
        return {
          bg: '#C2410C',
          badgeBg: 'rgba(255, 255, 255, 0.22)',
          textColor: COLORS.blanc,
          badgeTextColor: COLORS.blanc,
          icon: Info,
          label: 'INFO',
        };
    }
  };

  const config = getTypeConfig(alert.type);

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setDismissed(true);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.bannerStrip,
        { backgroundColor: config.bg },
      ]}
    >
      {/* Badge type d'alerte (style Web) */}
      <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
        <config.icon size={11} color={config.badgeTextColor} strokeWidth={2.5} />
        <Text style={[styles.badgeText, { color: config.badgeTextColor }]}>
          {config.label}
        </Text>
      </View>

      {/* Message de l'alerte */}
      <View style={styles.messageContainer}>
        <Text style={[styles.text, { color: config.textColor }]} numberOfLines={1} ellipsizeMode="tail">
          <Text style={styles.titleText}>{alert.title} — </Text>
          {alert.message}
        </Text>
      </View>

      {/* Navigation si plusieurs alertes */}
      {alerts.length > 1 && (
        <View style={styles.navigation}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setCurrentIdx((prev) => (prev - 1 + alerts.length) % alerts.length);
            }}
            style={styles.navBtn}
            hitSlop={8}
          >
            <ChevronLeft size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={styles.dots}>
            {alerts.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIdx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setCurrentIdx((prev) => (prev + 1) % alerts.length);
            }}
            style={styles.navBtn}
            hitSlop={8}
          >
            <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      )}

      {/* Bouton fermeture */}
      <Pressable onPress={handleDismiss} hitSlop={10} style={styles.closeBtn}>
        <X size={15} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  messageContainer: {
    flex: 1,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  titleText: {
    fontFamily: FONTS.bodyBold,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  navBtn: {
    padding: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 2.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: COLORS.blanc,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  closeBtn: {
    padding: 2,
  },
});
