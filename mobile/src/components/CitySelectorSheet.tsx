import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Landmark, Check, X, MapPin, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { City, useCity } from '@/context/CityContext';

interface CitySelectorSheetProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.65, 520);

export default function CitySelectorSheet({ visible, onClose }: CitySelectorSheetProps) {
  const { currentCity, cities, selectCity } = useCity();
  const [modalVisible, setModalVisible] = useState(visible);

  if (visible && !modalVisible) {
    setModalVisible(true);
  }

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 220,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else if (modalVisible) {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false);
        }
      });
    }
  }, [visible, modalVisible, backdropOpacity, translateY]);

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleCitySelect = async (city: City) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await selectCity(city.slug);
    onClose();
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!modalVisible) return null;

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop sombre réactif */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        {/* Panneau BottomSheet animé avec Reanimated */}
        <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
          <View style={styles.dragHandle} />

          {/* En-tête du sélecteur */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.headerBadge}>
                <Sparkles size={13} color={COLORS.or} />
                <Text style={styles.headerBadgeText}>ÉDITION TERRITORIALE</Text>
              </View>
              <Text style={styles.sheetTitle}>Choisir votre commune</Text>
              <Text style={styles.sheetSubtitle}>
                {"Basculez d'une ville à l'autre pour accéder aux informations et services locaux"}
              </Text>
            </View>
            <Pressable
              onPress={handleDismiss}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={COLORS.noir} />
            </Pressable>
          </View>

          {/* Liste des villes supportées */}
          <View style={styles.cityList}>
            {cities.map((city) => {
              const isSelected = city.slug === currentCity.slug;
              return (
                <Pressable
                  key={city.slug}
                  onPress={() => handleCitySelect(city)}
                  style={({ pressed }) => [
                    styles.cityCard,
                    isSelected && styles.cityCardSelected,
                    pressed && styles.cityCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.cityIconBox,
                      isSelected && styles.cityIconBoxSelected,
                    ]}
                  >
                    {isSelected ? (
                      <Landmark size={20} color={COLORS.blanc} />
                    ) : (
                      <MapPin size={20} color={COLORS.champagne} />
                    )}
                  </View>

                  <View style={styles.cityInfo}>
                    <View style={styles.cityNameRow}>
                      <Text
                        style={[
                          styles.cityName,
                          isSelected && styles.cityNameSelected,
                        ]}
                      >
                        {city.name}
                      </Text>
                      <View style={styles.postalBadge}>
                        <Text style={styles.postalText}>{city.postalCode}</Text>
                      </View>
                    </View>
                    <Text style={styles.cityTagline}>{city.tagline}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color={COLORS.blanc} strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 28, 16, 0.65)',
  },
  sheetContainer: {
    backgroundColor: COLORS.blanc,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(142, 134, 113, 0.35)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  headerBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.or,
    letterSpacing: 1,
  },
  sheetTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 20,
    color: COLORS.noir,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 4,
    lineHeight: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityList: {
    gap: 10,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.18)',
  },
  cityCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: COLORS.or,
  },
  cityCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  cityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconBoxSelected: {
    backgroundColor: COLORS.vert,
  },
  cityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.noir,
  },
  cityNameSelected: {
    color: COLORS.vert,
  },
  postalBadge: {
    backgroundColor: 'rgba(142, 134, 113, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  postalText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.noir,
  },
  cityTagline: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
