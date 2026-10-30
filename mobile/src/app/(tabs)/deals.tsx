import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Tag,
  Gift,
  Search,
  Sparkles,
  Clock,
  Copy,
  ExternalLink,
  Check,
  Store,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { useCity } from '@/context/CityContext';
import {
  DealsService,
  BonPlan,
  DealCategory,
  MOCK_DEALS,
} from '@/lib/services/deals.service';

interface CategoryFilterItem {
  id: 'all' | DealCategory;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryFilterItem[] = [
  { id: 'all', label: 'Tous', icon: '🌟' },
  { id: 'billetterie', label: 'Billetterie', icon: '🎟️' },
  { id: 'concours', label: 'Concours', icon: '🎁' },
  { id: 'code_promo', label: 'Codes promo', icon: '🏷️' },
  { id: 'restauration', label: 'Sorties & Restos', icon: '🍽️' },
];

export default function DealsScreen() {
  const { currentCity } = useCity();

  const [activeCategory, setActiveCategory] = useState<'all' | DealCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deals, setDeals] = useState<BonPlan[]>(MOCK_DEALS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [participatedIds, setParticipatedIds] = useState<number[]>([]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchCategory =
        activeCategory === 'all' || deal.categorie === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        deal.titre.toLowerCase().includes(query) ||
        deal.partenaire.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query);

      return matchCategory && matchSearch;
    });
  }, [deals, activeCategory, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const refreshed = await DealsService.getDeals();
    setDeals(refreshed);
    setIsRefreshing(false);
  };

  const handleCategoryPress = (catId: 'all' | DealCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setActiveCategory(catId);
  };

  const handleCopyCode = (deal: BonPlan) => {
    if (!deal.codePromo) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setCopiedId(deal.id);
    setTimeout(() => setCopiedId(null), 3000);

    Toast.show({
      type: 'success',
      text1: `Code "${deal.codePromo}" copié ! 🏷️`,
      text2: `À utiliser chez ${deal.partenaire}`,
      visibilityTime: 2500,
    });
  };

  const handleParticipate = (deal: BonPlan) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (participatedIds.includes(deal.id)) {
      Alert.alert(
        'Participation enregistrée',
        `Vous êtes déjà inscrit au tirage au sort "${deal.titre}". Les gagnants seront notifiés le ${deal.dateFin}.`
      );
      return;
    }

    Alert.alert(
      'Participer au jeu-concours 🎉',
      `Confirmez votre participation au tirage au sort pour "${deal.titre}" avec votre compte citoyen de ${currentCity.name}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Je participe !',
          style: 'default',
          onPress: () => {
            setParticipatedIds((prev) => [...prev, deal.id]);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Toast.show({
              type: 'success',
              text1: 'Participation confirmée ! 🍀',
              text2: 'Bonne chance ! Tirage au sort le ' + deal.dateFin,
              visibilityTime: 3500,
            });
          },
        },
      ]
    );
  };

  const handleOpenLink = async (deal: BonPlan) => {
    if (!deal.lienUrl) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await WebBrowser.openBrowserAsync(deal.lienUrl);
    } catch {
      Alert.alert('Lien', `Rendez-vous sur ${deal.lienUrl}`);
    }
  };

  const renderDealCard = ({ item, index }: { item: BonPlan; index: number }) => {
    const isCopied = copiedId === item.id;
    const isParticipated = participatedIds.includes(item.id);

    const getBadgeStyle = () => {
      switch (item.categorie) {
        case 'concours':
          return { bg: '#FDF2D9', text: COLORS.or, border: '#F2D99C' };
        case 'billetterie':
          return { bg: '#E2F3EB', text: '#217346', border: '#C2E5D4' };
        case 'code_promo':
          return { bg: '#EBF4FF', text: '#2B6CB0', border: '#C3DAFE' };
        case 'restauration':
          return { bg: '#FEEBC8', text: '#C05621', border: '#FBD38D' };
        default:
          return { bg: '#F7FAFC', text: '#4A5568', border: '#E2E8F0' };
      }
    };

    const badgeStyle = getBadgeStyle();

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 70).springify().damping(16)}
        style={styles.cardWrapper}
      >
        <View style={styles.card}>
          {/* Illustration avec étiquette de valeur */}
          {item.image && (
            <View style={styles.imageBox}>
              <Image
                source={{ uri: item.image }}
                style={styles.coverImage}
                contentFit="cover"
                transition={200}
              />
              <View style={[styles.valueTag, { backgroundColor: COLORS.vert }]}>
                <Text style={styles.valueTagText}>{item.valeur}</Text>
              </View>

              {item.estExclusif && (
                <View style={styles.exclusiveBadge}>
                  <Sparkles size={11} color={COLORS.noir} />
                  <Text style={styles.exclusiveBadgeText}>Exclusivité Citoyenne</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.cardContent}>
            {/* Ligne catégorie & partenaire */}
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.categoryPill,
                  { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
                ]}
              >
                <Text style={[styles.categoryPillText, { color: badgeStyle.text }]}>
                  {CATEGORIES.find((c) => c.id === item.categorie)?.icon}{' '}
                  {CATEGORIES.find((c) => c.id === item.categorie)?.label}
                </Text>
              </View>

              <View style={styles.partnerRow}>
                <Store size={12} color="#718096" />
                <Text style={styles.partnerName} numberOfLines={1}>
                  {item.partenaire}
                </Text>
              </View>
            </View>

            {/* Titre et description */}
            <Text style={styles.dealTitle}>{item.titre}</Text>
            <Text style={styles.dealDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Conditions et date de fin */}
            <View style={styles.footerRow}>
              <View style={styles.clockRow}>
                <Clock size={12} color="#A0AEC0" />
                <Text style={styles.dateText}>Valable jusqu&apos;au {item.dateFin}</Text>
              </View>
            </View>

            {/* Boutons d'action contextuels */}
            <View style={styles.actionRow}>
              {item.codePromo && (
                <Pressable
                  onPress={() => handleCopyCode(item)}
                  style={[
                    styles.codeBtn,
                    isCopied && styles.codeBtnCopied,
                  ]}
                >
                  {isCopied ? (
                    <>
                      <Check size={14} color="#22543D" />
                      <Text style={styles.codeBtnTextCopied}>Code copié !</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={13} color={COLORS.noir} />
                      <Text style={styles.codeBtnText}>
                        Code : <Text style={styles.codeHighlight}>{item.codePromo}</Text>
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {item.categorie === 'concours' && (
                <Pressable
                  onPress={() => handleParticipate(item)}
                  style={[
                    styles.primaryBtn,
                    isParticipated && styles.primaryBtnParticipated,
                  ]}
                >
                  <Gift size={15} color={isParticipated ? '#22543D' : COLORS.noir} />
                  <Text
                    style={[
                      styles.primaryBtnText,
                      isParticipated && styles.primaryBtnTextParticipated,
                    ]}
                  >
                    {isParticipated ? 'Inscrit au tirage 🎉' : 'Participer au jeu'}
                  </Text>
                </Pressable>
              )}

              {item.lienUrl && item.categorie !== 'concours' && (
                <Pressable
                  onPress={() => handleOpenLink(item)}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Réserver</Text>
                  <ExternalLink size={13} color={COLORS.vert} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScreenContainer headerContextTitle="Bons Plans">
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color="#718096" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un bon plan, un commerce..."
            placeholderTextColor="#A0AEC0"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Barre de filtres horizontaux */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item.id;
            return (
              <Pressable
                onPress={() => handleCategoryPress(item.id)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
              >
                <Text style={styles.filterChipIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Liste des bons plans */}
      <FlatList
        data={filteredDeals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDealCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.vert}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Tag size={42} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Aucun bon plan trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Modifiez votre recherche ou sélectionnez une autre catégorie.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.montserrat,
    color: COLORS.noir,
    height: '100%',
  },
  filtersWrapper: {
    paddingVertical: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  filterChipIcon: {
    fontSize: 13,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: '#4A5568',
  },
  filterChipTextActive: {
    color: COLORS.blanc,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  imageBox: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F7FAFC',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  valueTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  valueTagText: {
    color: COLORS.blanc,
    fontSize: 13,
    fontFamily: FONTS.poppinsBlack,
    letterSpacing: 0.3,
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.or,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exclusiveBadgeText: {
    color: COLORS.noir,
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
  },
  cardContent: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '50%',
  },
  partnerName: {
    fontSize: 12,
    fontFamily: FONTS.montserratSemiBold,
    color: '#718096',
  },
  dealTitle: {
    fontSize: 16,
    fontFamily: FONTS.poppinsBlack,
    color: COLORS.noir,
    lineHeight: 22,
    marginBottom: 6,
  },
  dealDescription: {
    fontSize: 13,
    fontFamily: FONTS.montserrat,
    color: '#4A5568',
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    marginBottom: 12,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FONTS.montserrat,
    color: '#A0AEC0',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  codeBtnCopied: {
    backgroundColor: '#C6F6D5',
    borderColor: '#9AE6B4',
  },
  codeBtnText: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: COLORS.noir,
  },
  codeBtnTextCopied: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: '#22543D',
  },
  codeHighlight: {
    color: COLORS.vert,
    fontFamily: FONTS.poppinsBlack,
    letterSpacing: 0.5,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.or,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  primaryBtnParticipated: {
    backgroundColor: '#C6F6D5',
  },
  primaryBtnText: {
    fontSize: 13,
    fontFamily: FONTS.poppinsBlack,
    color: COLORS.noir,
  },
  primaryBtnTextParticipated: {
    color: '#22543D',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF4EE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: COLORS.vert,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.poppinsBlack,
    color: COLORS.noir,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    textAlign: 'center',
  },
});
