import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
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
import { X, Check, SlidersHorizontal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

interface FilterSheetModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.72, 560);

export default function FilterSheetModal({
  visible,
  onClose,
  selectedCategory,
  onSelectCategory,
}: FilterSheetModalProps) {
  const [modalVisible, setModalVisible] = useState(visible);

  if (visible && !modalVisible) {
    setModalVisible(true);
  }

  // Animations Reanimated fluides pour le fond et le tiroir
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

  const handleCategoryPress = (categoryName: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelectCategory(categoryName);
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
        {/* Backdrop sombre avec fondu progressif fluide (fade-in, jamais de slide brusque) */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        {/* Tiroir BottomSheet coulissant avec physique Reanimated */}
        <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
          <View style={styles.dragHandle} />

          {/* En-tête */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.headerBadge}>
                <SlidersHorizontal size={13} color={COLORS.or} />
                <Text style={styles.headerBadgeText}>FILTRAGE PAR THÉMATIQUE</Text>
              </View>
              <Text style={styles.sheetTitle}>Filtrer les actualités</Text>
              <Text style={styles.sheetSubtitle}>
                Sélectionnez une rubrique pour personnaliser votre flux citoyen
              </Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Fermer"
            >
              <X size={18} color={COLORS.noir} />
            </Pressable>
          </View>

          {/* Liste des catégories */}
          <View style={styles.categoryList}>
            {MOCK_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.libelle;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategoryPress(cat.libelle)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    pressed && styles.categoryCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.emojiBox,
                      isSelected && styles.emojiBoxSelected,
                    ]}
                  >
                    <Text style={styles.emojiText}>{cat.icon}</Text>
                  </View>

                  <View style={styles.categoryInfo}>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && styles.categoryLabelSelected,
                      ]}
                    >
                      {cat.libelle}
                    </Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
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
  categoryList: {
    gap: 9,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.18)',
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: COLORS.or,
  },
  categoryCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBoxSelected: {
    backgroundColor: COLORS.vert,
  },
  emojiText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.noir,
  },
  categoryLabelSelected: {
    color: COLORS.vert,
  },
  categoryDesc: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
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
