import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  cancelAnimation,
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

const DEFAULT_DISPLAY_MS = 5000;
const INITIAL_PAUSE_MS = 1600;
const SCROLL_SPEED_PX_PER_SEC = 38;
const FINAL_PAUSE_MS = 2500;

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [measuredWidths, setMeasuredWidths] = useState<Record<number, number>>({});

  const translateX = useSharedValue(0);

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

  // Gestion du fondu croisé de couleur (crossfade 500ms)
  const [prevBg, setPrevBg] = useState(currentBg);
  const [underBg, setUnderBg] = useState(currentBg);

  if (currentBg !== prevBg) {
    setPrevBg(currentBg);
    setUnderBg(prevBg);
  }

  // Largeur réelle du texte de l'alerte en cours
  const textWidth = alert ? measuredWidths[alert.id] || 0 : 0;

  // Calcul dynamique de la distance et de la durée de défilement
  const scrollDistance =
    containerWidth > 0 && textWidth > containerWidth
      ? Math.round(textWidth - containerWidth + 32)
      : 0;

  const scrollDuration =
    scrollDistance > 0
      ? Math.round((scrollDistance / SCROLL_SPEED_PX_PER_SEC) * 1000)
      : 0;

  const totalDisplayDuration =
    scrollDistance > 0
      ? INITIAL_PAUSE_MS + scrollDuration + FINAL_PAUSE_MS
      : DEFAULT_DISPLAY_MS;

  // Animation Reanimated du défilement horizontal (Ticker)
  useEffect(() => {
    cancelAnimation(translateX);
    translateX.value = 0;

    if (scrollDistance > 0) {
      translateX.value = withDelay(
        INITIAL_PAUSE_MS,
        withTiming(-scrollDistance, {
          duration: scrollDuration,
          easing: Easing.linear,
        })
      );
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [currentIdx, scrollDistance, scrollDuration, translateX]);

  // Rotation automatique ajustée en fonction de la longueur du texte
  useEffect(() => {
    if (dismissed || alerts.length === 0) return;

    if (alerts.length > 1) {
      const timer = setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % alerts.length);
      }, totalDisplayDuration);
      return () => clearTimeout(timer);
    } else if (scrollDistance > 0) {
      // Pour une alerte longue unique, on rejoue le défilement en boucle fluide
      const loopTimer = setTimeout(() => {
        cancelAnimation(translateX);
        translateX.value = 0;
        translateX.value = withDelay(
          INITIAL_PAUSE_MS,
          withTiming(-scrollDistance, {
            duration: scrollDuration,
            easing: Easing.linear,
          })
        );
      }, totalDisplayDuration);
      return () => clearTimeout(loopTimer);
    }
  }, [
    alerts.length,
    dismissed,
    currentIdx,
    totalDisplayDuration,
    scrollDistance,
    scrollDuration,
    translateX,
  ]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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

      {/* Badge type d'alerte */}
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

      {/* Mesure hors-champ de la largeur réelle complète du texte (sans troncature) */}
      <View
        key={`measure-${alert.id}`}
        style={styles.measureBox}
        pointerEvents="none"
      >
        <Text
          onLayout={(e) => {
            const width = Math.ceil(e.nativeEvent.layout.width);
            if (width > 0 && measuredWidths[alert.id] !== width) {
              setMeasuredWidths((prev) => ({ ...prev, [alert.id]: width }));
            }
          }}
          style={[styles.text, styles.measureText]}
        >
          <Text style={styles.titleText}>{alert.title} — </Text>
          {alert.message}
        </Text>
      </View>

      {/* Slot du message avec masquage des débordements et défilement complet */}
      <View
        style={styles.messageSlot}
        onLayout={(e) => {
          setContainerWidth(e.nativeEvent.layout.width);
        }}
      >
        <Animated.View
          key={currentIdx}
          entering={FadeInDown.duration(350).easing(Easing.out(Easing.quad))}
          exiting={FadeOutUp.duration(280).easing(Easing.in(Easing.quad))}
          style={styles.animatedMessageInner}
        >
          <Animated.View
            style={[
              styles.textRow,
              textWidth > 0 ? { minWidth: textWidth + 16 } : null,
              animatedTextStyle,
            ]}
          >
            <Text style={[styles.text, { color: config.textColor }]}>
              <Text style={styles.titleText}>{alert.title} — </Text>
              {alert.message}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Navigation entre alertes si multiples */}
      {alerts.length > 1 && (
        <View style={styles.navigation}>
          <Pressable
            onPress={() => navigate(-1)}
            style={styles.navBtn}
            hitSlop={8}
            accessibilityLabel="Alerte précédente"
          >
            <ChevronLeft size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={styles.dots}>
            {alerts.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => selectIndex(i)}
                hitSlop={6}
                accessibilityLabel={`Alerte ${i + 1}`}
              >
                <View
                  style={[
                    styles.dot,
                    i === currentIdx ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => navigate(1)}
            style={styles.navBtn}
            hitSlop={8}
            accessibilityLabel="Alerte suivante"
          >
            <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      )}

      {/* Bouton fermeture */}
      <Pressable
        onPress={handleDismiss}
        hitSlop={10}
        style={styles.closeBtn}
        accessibilityLabel="Fermer le bandeau d'alerte"
      >
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
  measureBox: {
    position: 'absolute',
    top: -9999,
    left: 0,
    opacity: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  measureText: {
    flexShrink: 0,
  },
  messageSlot: {
    flex: 1,
    height: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    zIndex: 1,
  },
  animatedMessageInner: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 12,
    flexShrink: 0,
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
