import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  Easing,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  Info,
  PartyPopper,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { MobileAlert } from '@/lib/mock-data';

interface AlertBannerProps {
  alerts: MobileAlert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Rotation automatique toutes les 5s (identique à la version Web)
  useEffect(() => {
    if (alerts.length <= 1 || dismissed) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [alerts.length, dismissed]);

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

  const config = alert ? getTypeConfig(alert.type) : null;
  const currentBg = config?.bg ?? '#B91C1C';

  // Gestion du fondu croisé de couleur (crossfade 500ms) selon le pattern officiel React
  const [prevBg, setPrevBg] = useState(currentBg);
  const [underBg, setUnderBg] = useState(currentBg);

  if (currentBg !== prevBg) {
    setPrevBg(currentBg);
    setUnderBg(prevBg);
  }

  if (dismissed || alerts.length === 0 || !alert || !config) return null;

  const navigate = (delta: 1 | -1) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setCurrentIdx((prev) => (prev + delta + alerts.length) % alerts.length);
  };

  const selectIndex = (index: number) => {
    if (index === currentIdx) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setCurrentIdx(index);
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setDismissed(true);
  };

  return (
    <View style={styles.bannerStrip}>
      {/* 1. Couche de fond sous-jacente (couleur précédente comme base) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: underBg },
        ]}
      />

      {/* 2. Couche de fond active avec fondu doux progressif sur 500ms */}
      <Animated.View
        key={currentBg}
        entering={FadeIn.duration(500).easing(Easing.out(Easing.quad))}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: currentBg },
        ]}
      />

      {/* Badge type d'alerte avec transition fluide */}
      <Animated.View
        key={config.label}
        entering={FadeIn.duration(350).easing(Easing.out(Easing.quad))}
        style={[styles.badge, { backgroundColor: config.badgeBg }]}
      >
        <config.icon size={11} color={config.badgeTextColor} strokeWidth={2.5} />
        <Text style={[styles.badgeText, { color: config.badgeTextColor }]}>
          {config.label}
        </Text>
      </Animated.View>

      {/* Message animé : transition fade + slide vertical fluide (identique à la version Web) */}
      <View style={styles.messageSlot}>
        <Animated.View
          key={currentIdx}
          entering={FadeInDown.duration(350).easing(Easing.out(Easing.quad))}
          exiting={FadeOutUp.duration(280).easing(Easing.in(Easing.quad))}
          style={styles.animatedMessageInner}
        >
          <Text
            style={[styles.text, { color: config.textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            <Text style={styles.titleText}>{alert.title} — </Text>
            {alert.message}
          </Text>
        </Animated.View>
      </View>

      {/* Navigation entre alertes si multiples */}
      {alerts.length > 1 && (
        <View style={styles.navigation}>
          <Pressable onPress={() => navigate(-1)} style={styles.navBtn} hitSlop={8}>
            <ChevronLeft size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={styles.dots}>
            {alerts.map((_, i) => (
              <Pressable key={i} onPress={() => selectIndex(i)} hitSlop={6}>
                <View
                  style={[
                    styles.dot,
                    i === currentIdx ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => navigate(1)} style={styles.navBtn} hitSlop={8}>
            <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      )}

      {/* Bouton fermeture */}
      <Pressable onPress={handleDismiss} hitSlop={10} style={styles.closeBtn}>
        <X size={15} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </View>
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
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    flexShrink: 0,
    zIndex: 1,
  },
  badgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  messageSlot: {
    flex: 1,
    height: 18,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    zIndex: 1,
  },
  animatedMessageInner: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
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
    flexShrink: 0,
    zIndex: 1,
  },
  navBtn: {
    padding: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    backgroundColor: COLORS.blanc,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  closeBtn: {
    padding: 2,
    flexShrink: 0,
    zIndex: 1,
  },
});
