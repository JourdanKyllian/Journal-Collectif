import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { Sparkles, Tag } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { useCity } from '@/context/CityContext';
import {
  DealsService,
  BonPlan,
  DealCategory,
  MOCK_DEALS,
} from '@/lib/services/deals.service';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import DealCard from '@/components/deals/DealCard';

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

const CATEGORY_MAP: Record<DealCategory | 'all', { label: string; icon: string }> = {
  all: { label: 'Tous', icon: '🌟' },
  billetterie: { label: 'Billetterie', icon: '🎟️' },
  concours: { label: 'Concours', icon: '🎁' },
  code_promo: { label: 'Codes promo', icon: '🏷️' },
  restauration: { label: 'Sorties & Restos', icon: '🍽️' },
};

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

  return (
    <ScreenContainer headerContextTitle="Bons Plans & Privilèges">
      <View style={styles.container}>
        {/* En-tête des avantages locaux */}
        <View style={styles.topSection}>
          <View style={styles.cityBanner}>
            <View style={styles.badgeClub}>
              <Sparkles size={13} color={COLORS.noir} />
              <Text style={styles.badgeClubText}>AVANTAGES LECTEURS</Text>
            </View>
            <Text style={styles.cityTitle}>Privilèges & Bons Plans</Text>
            <Text style={styles.citySubtitle}>
              Tarifs réduits négociés pour vous auprès des acteurs locaux de {currentCity.name}.
            </Text>
          </View>

          {/* Barre de recherche partagée */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher une offre, un commerçant..."
            containerStyle={styles.searchContainer}
          />

          {/* Filtres par catégorie */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => {
              const isSelected = activeCategory === item.id;
              return (
                <Pressable
                  onPress={() => handleCategoryPress(item.id)}
                  style={[
                    styles.catChip,
                    isSelected && styles.catChipActive,
                  ]}
                >
                  <Text style={styles.catChipIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.catChipText,
                      isSelected && styles.catChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Liste des Bons Plans */}
        <FlatList
          data={filteredDeals}
          keyExtractor={(item) => `deal-${item.id}`}
          renderItem={({ item, index }) => (
            <DealCard
              deal={item}
              index={index}
              isCopied={copiedId === item.id}
              isParticipated={participatedIds.includes(item.id)}
              categoryLabels={CATEGORY_MAP}
              onCopyCode={handleCopyCode}
              onParticipate={handleParticipate}
              onOpenLink={handleOpenLink}
            />
          )}
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
            <EmptyState
              icon={Tag}
              title="Aucune offre trouvée"
              description="Aucun bon plan ne correspond à vos critères dans cette édition."
              actionLabel={searchQuery || activeCategory !== 'all' ? 'Réinitialiser les filtres' : undefined}
              onAction={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            />
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cityBanner: {
    backgroundColor: COLORS.vert,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  badgeClub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.or,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeClubText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    letterSpacing: 0.6,
  },
  cityTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
    marginBottom: 4,
  },
  citySubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    lineHeight: 18,
  },
  searchContainer: {
    marginBottom: 12,
  },
  categoryList: {
    gap: 8,
    paddingBottom: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  catChipIcon: {
    fontSize: 13,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#4A5568',
  },
  catChipTextActive: {
    color: COLORS.blanc,
    fontFamily: FONTS.semiBold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
});
