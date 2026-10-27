import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { AlertTriangle, Info, PartyPopper, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
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
    }, 5000);
    return () => clearInterval(interval);
  }, [alerts.length, dismissed]);

  if (dismissed || alerts.length === 0) return null;

  const alert = alerts[currentIdx];

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'urgent':
        return { bg: COLORS.urgent, icon: AlertTriangle, label: 'URGENT' };
      case 'info':
        return { bg: COLORS.info, icon: Info, label: 'INFO' };
      case 'event':
        return { bg: COLORS.success, icon: PartyPopper, label: 'ÉVÉNEMENT' };
      default:
        return { bg: COLORS.info, icon: Info, label: 'INFO' };
    }
  };

  const config = getTypeConfig(alert.type);

  return (
    <Animated.View
      entering={SlideInUp}
      exiting={SlideOutUp}
      style={[styles.container, { backgroundColor: config.bg }]}
    >
      <View style={styles.badge}>
        <config.icon size={12} color={COLORS.blanc} />
        <Text style={styles.badgeText}>{config.label}</Text>
      </View>

      <Animated.View
        key={alert.id}
        entering={FadeIn.duration(350)}
        exiting={FadeOut.duration(350)}
        style={styles.messageContainer}
      >
        <Text style={styles.text} numberOfLines={2}>
          <Text style={{ fontFamily: FONTS.bodyBold }}>{alert.title} — </Text>
          {alert.message}
        </Text>
      </Animated.View>

      {alerts.length > 1 && (
        <View style={styles.navigation}>
          <Pressable
            onPress={() => setCurrentIdx((prev) => (prev - 1 + alerts.length) % alerts.length)}
            style={styles.navBtn}
          >
            <ChevronLeft size={16} color={COLORS.blanc} />
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
            onPress={() => setCurrentIdx((prev) => (prev + 1) % alerts.length)}
            style={styles.navBtn}
          >
            <ChevronRight size={16} color={COLORS.blanc} />
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => setDismissed(true)} hitSlop={10} style={styles.closeBtn}>
        <X size={16} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: COLORS.blanc,
  },
  messageContainer: {
    flex: 1,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.blanc,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    padding: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: COLORS.blanc,
    transform: [{ scale: 1.2 }],
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  closeBtn: {
    paddingLeft: 4,
  },
});
