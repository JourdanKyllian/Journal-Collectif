import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Landmark,
  Check,
  X,
  MapPin,
  Sparkles,
  Star,
  Search,
  BookmarkCheck,
  BookmarkPlus,
  Compass,
  SlidersHorizontal,
} from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { City, useCity } from '@/context/CityContext';

interface CitySelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'followed' | 'all';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.82, 620);

export default function CitySelectorSheet({
  visible,
  onClose,
  initialTab = 'followed',
}: CitySelectorSheetProps) {
  const {
    currentCity,
    cities,
    followedCities,
    isFollowed,
    isPrimary,
    selectCity,
    toggleFollowCity,
    setPrimaryCity,
    searchCities,
  } = useCity();

  const [modalVisible, setModalVisible] = useState(visible);
  const [activeTab, setActiveTab] = useState<'followed' | 'all'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

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
    setSearchQuery('');
    onClose();
  };

  const handleCitySelect = async (city: City) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await selectCity(city.slug);
    handleDismiss();
  };

  const handleToggleFollow = async (city: City, e: any) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleFollowCity(city.slug);
  };

  const handleSetPrimary = async (city: City, e: any) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setPrimaryCity(city.slug);
  };

  const filteredDirectory = useMemo(() => {
    return searchCities(searchQuery);
  }, [searchQuery, searchCities]);

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
                <Text style={styles.headerBadgeText}>ÉDITIONS TERRITORIALES</Text>
              </View>
              <Text style={styles.sheetTitle}>Mes Journaux & Territoires</Text>
              <Text style={styles.sheetSubtitle}>
                {"Sélectionnez vos éditions d'intérêt et basculez d'une commune à l'autre"}
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

          {/* Sélecteur d'onglets : Mes éditions vs Annuaire complet */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setActiveTab('followed');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'followed' && styles.tabBtnActive,
              ]}
            >
              <SlidersHorizontal
                size={14}
                color={activeTab === 'followed' ? COLORS.vert : COLORS.champagne}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'followed' && styles.tabBtnTextActive,
                ]}
              >
                Mes éditions ({followedCities.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setActiveTab('all');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'all' && styles.tabBtnActive,
              ]}
            >
              <Compass
                size={14}
                color={activeTab === 'all' ? COLORS.vert : COLORS.champagne}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'all' && styles.tabBtnTextActive,
                ]}
              >
                Explorer ({cities.length})
              </Text>
            </Pressable>
          </View>

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'followed' ? (
            <ScrollView
              contentContainerStyle={styles.scrollList}
              showsVerticalScrollIndicator={false}
            >
              {followedCities.map((city) => {
                const isSelected = city.slug === currentCity.slug;
                const isThisPrimary = isPrimary(city.slug);

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
                          numberOfLines={1}
                        >
                          {city.name}
                        </Text>
                        <View style={styles.postalBadge}>
                          <Text style={styles.postalText}>{city.postalCode}</Text>
                        </View>
                        {isThisPrimary && (
                          <View style={styles.primaryBadge}>
                            <Star size={10} color={COLORS.or} fill={COLORS.or} />
                            <Text style={styles.primaryBadgeText}>Principale</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cityTagline} numberOfLines={1}>
                        {city.nomJournal || city.tagline}
                      </Text>
                    </View>

                    {/* Actions de personnalisation de la carte */}
                    <View style={styles.cardActions}>
                      {/* Définir comme principale */}
                      {!isThisPrimary && (
                        <Pressable
                          onPress={(e) => handleSetPrimary(city, e)}
                          hitSlop={8}
                          style={styles.actionIconBtn}
                          accessibilityLabel="Définir comme édition principale"
                        >
                          <Star size={16} color={COLORS.champagne} />
                        </Pressable>
                      )}

                      {/* Indicateur de sélection active */}
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Check size={14} color={COLORS.blanc} strokeWidth={3} />
                        </View>
                      ) : (
                        <Pressable
                          onPress={(e) => handleToggleFollow(city, e)}
                          hitSlop={8}
                          style={styles.actionIconBtn}
                          accessibilityLabel="Retirer de mes éditions suivies"
                        >
                          <BookmarkCheck size={18} color={COLORS.vert} />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {followedCities.length <= 2 && (
                <Pressable
                  onPress={() => setActiveTab('all')}
                  style={styles.discoverCallout}
                >
                  <Compass size={18} color={COLORS.or} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.discoverCalloutTitle}>
                      {"Découvrir d'autres communes"}
                    </Text>
                    <Text style={styles.discoverCalloutDesc}>
                      {"Explorez l'annuaire pour suivre d'autres journaux du réseau Collectif"}
                    </Text>
                  </View>
                </Pressable>
              )}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Barre de recherche dans l'annuaire */}
              <View style={styles.searchBarContainer}>
                <Search size={16} color={COLORS.champagne} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher une ville, code postal, journal..."
                  placeholderTextColor={COLORS.champagne}
                  style={styles.searchInput}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && Platform.OS !== 'ios' && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <X size={16} color={COLORS.champagne} />
                  </Pressable>
                )}
              </View>

              <ScrollView
                contentContainerStyle={styles.scrollList}
                showsVerticalScrollIndicator={false}
              >
                {filteredDirectory.map((city) => {
                  const isSelected = city.slug === currentCity.slug;
                  const isCityFollowed = isFollowed(city.slug);
                  const isThisPrimary = isPrimary(city.slug);

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
                            numberOfLines={1}
                          >
                            {city.name}
                          </Text>
                          <View style={styles.postalBadge}>
                            <Text style={styles.postalText}>{city.postalCode}</Text>
                          </View>
                          {isThisPrimary && (
                            <View style={styles.primaryBadge}>
                              <Star size={10} color={COLORS.or} fill={COLORS.or} />
                              <Text style={styles.primaryBadgeText}>Principale</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.cityTagline} numberOfLines={1}>
                          {city.typeJournal} • {city.department}
                        </Text>
                      </View>

                      {/* Bouton Suivre / Suivi */}
                      <Pressable
                        onPress={(e) => handleToggleFollow(city, e)}
                        hitSlop={8}
                        style={[
                          styles.followPill,
                          isCityFollowed && styles.followPillActive,
                        ]}
                      >
                        {isCityFollowed ? (
                          <>
                            <BookmarkCheck size={14} color={COLORS.vert} />
                            <Text style={styles.followPillTextActive}>Suivi</Text>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus size={14} color={COLORS.champagne} />
                            <Text style={styles.followPillText}>Suivre</Text>
                          </>
                        )}
                      </Pressable>
                    </Pressable>
                  );
                })}

                {filteredDirectory.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>Aucune édition trouvée</Text>
                    <Text style={styles.emptyStateDesc}>
                      Aucun journal ne correspond à votre recherche « {searchQuery} ».
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
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
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.blanc,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
    marginBottom: 14,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
    marginTop: 2,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(142, 134, 113, 0.12)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: COLORS.blanc,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.champagne,
  },
  tabBtnTextActive: {
    color: COLORS.vert,
    fontFamily: FONTS.bodyBold,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.noir,
    padding: 0,
  },
  scrollList: {
    gap: 10,
    paddingBottom: 24,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 18,
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
    width: 40,
    height: 40,
    borderRadius: 13,
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
    marginRight: 6,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cityName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14.5,
    color: COLORS.noir,
  },
  cityNameSelected: {
    color: COLORS.vert,
  },
  postalBadge: {
    backgroundColor: 'rgba(142, 134, 113, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  postalText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10.5,
    color: COLORS.noir,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  primaryBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.or,
  },
  cityTagline: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: COLORS.champagne,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(142, 134, 113, 0.1)',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(142, 134, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  followPillActive: {
    backgroundColor: 'rgba(11, 28, 16, 0.08)',
    borderColor: 'rgba(11, 28, 16, 0.2)',
  },
  followPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.champagne,
  },
  followPillTextActive: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  discoverCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderStyle: 'dashed',
    marginTop: 6,
  },
  discoverCalloutTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  discoverCalloutDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  emptyStateDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    textAlign: 'center',
    marginTop: 4,
  },
});
