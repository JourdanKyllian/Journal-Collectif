import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Newspaper, BookmarkCheck } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MobileArticle, MobileAlert, MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_ALERTS } from '@/lib/mock-data';
import { useCity } from '@/context/CityContext';
import { FeedService } from '@/lib/services/feed.service';
import { OfflineService } from '@/lib/services/offline.service';

import ScreenContainer from '@/components/layout/ScreenContainer';
import AlertBanner from '@/components/AlertBanner';
import DetectedCityBanner from '@/components/location/DetectedCityBanner';
import CategoryPillsBar, { PillCategory } from '@/components/common/CategoryPillsBar';
import HeroCard from '@/components/articles/HeroCard';
import ArticleListItem from '@/components/articles/ArticleListItem';
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import DataCountBadge from '@/components/common/DataCountBadge';

const FAVORITES_PILL: PillCategory = {
  id: -1,
  libelle: 'Favoris',
  icon: '⭐',
};

export default function FeedScreen() {
  const { currentCity } = useCity();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const [articles, setArticles] = useState<MobileArticle[]>(MOCK_ARTICLES);
  const [categories, setCategories] = useState<PillCategory[]>([FAVORITES_PILL, ...MOCK_CATEGORIES]);
  const [alerts, setAlerts] = useState<MobileAlert[]>(MOCK_ALERTS);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  // 6 états des écrans de données :
  // 1. Données nominales (articles affichés)
  // 2. Chargement (isLoading)
  // 3. Vide (EmptyState si aucun résultat)
  // 4. Erreur avec retry (isError + ErrorState)
  // 5. Total de lignes (DataCountBadge affichant le décompte)
  // 6. Rafraîchissement / partiel (isRefreshing + RefreshControl)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Initialisation des favoris hors-ligne
  useEffect(() => {
    OfflineService.getFavoriteIds().then(setFavoriteIds);
  }, []);

  // Chargement des catégories & alertes
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, alertsData] = await Promise.all([
          FeedService.getCategories(),
          FeedService.getAlerts(),
        ]);
        // Intègre la catégorie virtuelle 'Favoris' en début
        setCategories([FAVORITES_PILL, ...cats]);
        setAlerts(alertsData);
      } catch {
        // Garde la liste de repli avec Favoris
        setCategories([FAVORITES_PILL, ...MOCK_CATEGORIES]);
      }
    }
    loadMeta();
  }, [currentCity.slug]);

  // Chargement des articles au montage et lors du changement de commune/catégorie
  useEffect(() => {
    let isMounted = true;

    async function fetchArticles() {
      try {
        const activeCatObj = categories.find((c) => c.libelle === selectedCategory);
        const catId =
          activeCatObj && activeCatObj.id > 0 ? activeCatObj.id : undefined;

        const result = await FeedService.getPublishedArticles({
          categorieId: catId,
          limit: 20,
        });

        if (!isMounted) return;

        let list = result.articles;
        if (selectedCategory !== 'Tous' && selectedCategory !== 'Favoris') {
          list = list.filter((a) => a.categorie.libelle === selectedCategory);
        }

        setArticles(list);
        setIsOffline(false);
        setIsError(false);

        // Sauvegarde silencieuse en cache local offline
        await OfflineService.saveCachedArticles(currentCity.slug, result.articles);
      } catch {
        if (!isMounted) return;
        // En cas d'échec réseau : tentative de lecture du cache offline
        const cached = await OfflineService.getCachedArticles(currentCity.slug);
        if (cached && cached.length > 0) {
          let list = cached;
          if (selectedCategory !== 'Tous' && selectedCategory !== 'Favoris') {
            list = list.filter((a) => a.categorie.libelle === selectedCategory);
          }
          setArticles(list);
          setIsOffline(true);
          setIsError(false);
        } else if (MOCK_ARTICLES.length > 0) {
          // Dernier fallback mock si pas de cache
          let list = MOCK_ARTICLES;
          if (selectedCategory !== 'Tous' && selectedCategory !== 'Favoris') {
            list = list.filter((a) => a.categorie.libelle === selectedCategory);
          }
          setArticles(list);
          setIsOffline(true);
        } else {
          setIsError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
          setIsRetrying(false);
        }
      }
    }

    fetchArticles();
    return () => {
      isMounted = false;
    };
  }, [categories, currentCity.slug, selectedCategory]);

  const onRefresh = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRefreshing(true);
    try {
      const activeCatObj = categories.find((c) => c.libelle === selectedCategory);
      const catId =
        activeCatObj && activeCatObj.id > 0 ? activeCatObj.id : undefined;

      const result = await FeedService.getPublishedArticles({
        categorieId: catId,
        limit: 20,
      });

      let list = result.articles;
      if (selectedCategory !== 'Tous' && selectedCategory !== 'Favoris') {
        list = list.filter((a) => a.categorie.libelle === selectedCategory);
      }
      setArticles(list);
      setIsOffline(false);
      setIsError(false);
      await OfflineService.saveCachedArticles(currentCity.slug, result.articles);
    } catch {
      // Garde l'état actuel si échec pendant le refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [categories, currentCity.slug, selectedCategory]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setIsLoading(true);
    setIsError(false);
    try {
      const activeCatObj = categories.find((c) => c.libelle === selectedCategory);
      const catId =
        activeCatObj && activeCatObj.id > 0 ? activeCatObj.id : undefined;

      const result = await FeedService.getPublishedArticles({
        categorieId: catId,
        limit: 20,
      });

      let list = result.articles;
      if (selectedCategory !== 'Tous' && selectedCategory !== 'Favoris') {
        list = list.filter((a) => a.categorie.libelle === selectedCategory);
      }
      setArticles(list);
      setIsOffline(false);
      setIsError(false);
      await OfflineService.saveCachedArticles(currentCity.slug, result.articles);
    } catch {
      const cached = await OfflineService.getCachedArticles(currentCity.slug);
      if (cached && cached.length > 0) {
        setArticles(cached);
        setIsOffline(true);
      } else {
        setIsError(true);
      }
    } finally {
      setIsRetrying(false);
      setIsLoading(false);
    }
  }, [categories, currentCity.slug, selectedCategory]);

  const handleToggleFavorite = useCallback(async (id: number) => {
    const isNowFav = await OfflineService.toggleFavorite(id);
    setFavoriteIds((prev) =>
      isNowFav ? [...prev, id] : prev.filter((favId) => favId !== id),
    );
  }, []);

  // Filtrage effectif pour la vue
  const displayedArticles = React.useMemo(() => {
    if (selectedCategory === 'Favoris') {
      return articles.filter((a) => favoriteIds.includes(a.id));
    }
    return articles;
  }, [articles, selectedCategory, favoriteIds]);

  // Premier article = Hero (si pas en filtre favoris vide)
  const heroArticle = displayedArticles[0] ?? null;
  // Reste de la liste
  const listArticles = displayedArticles.slice(1);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []);

  const renderListHeader = () => (
    <View>
      {/* Hero Card */}
      {heroArticle && (
        <Animated.View entering={FadeIn.duration(350)}>
          <HeroCard
            article={heroArticle}
            isFavorite={favoriteIds.includes(heroArticle.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        </Animated.View>
      )}

      {/* Section title & total ligne count */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'Favoris' ? 'Vos favoris enregistrés' : 'Actualités'}
          </Text>
          <Text style={styles.sectionCaption}>
            {selectedCategory === 'Favoris'
              ? 'Disponibles hors-ligne sur votre appareil'
              : `Édition locale : ${currentCity.shortName}`}
          </Text>
        </View>

        {/* Compteur total de lignes & statut hors-ligne */}
        <DataCountBadge
          total={displayedArticles.length}
          labelSingular="article"
          labelPlural="articles"
          isOffline={isOffline}
        />
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MobileArticle; index: number }) => (
      <ArticleListItem
        item={item}
        index={index}
        isFavorite={favoriteIds.includes(item.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [favoriteIds, handleToggleFavorite],
  );

  const renderEmpty = () => {
    if (selectedCategory === 'Favoris') {
      return (
        <EmptyState
          icon={BookmarkCheck}
          title="Aucun favori enregistré"
          description="Touchez l'icône marque-page sur un article pour le sauvegarder et le lire hors-ligne à tout moment."
          actionLabel="Explorer les actualités"
          onAction={() => setSelectedCategory('Tous')}
        />
      );
    }
    return (
      <EmptyState
        icon={Newspaper}
        title="Aucun article dans cette rubrique"
        description={`Aucune actualité publiée pour ${currentCity.shortName} sous la catégorie sélectionnée.`}
        actionLabel="Voir toutes les actualités"
        onAction={() => setSelectedCategory('Tous')}
      />
    );
  };

  return (
    <ScreenContainer>
      {/* Suggestion intelligente si déplacement dans une autre commune */}
      <DetectedCityBanner />

      {/* Bandeau alerte mairie */}
      <AlertBanner alerts={alerts} />

      {/* Filtre catégories sticky avec pilule 'Favoris' */}
      <CategoryPillsBar
        categories={categories}
        selectedLabel={selectedCategory}
        onSelect={handleCategorySelect}
      />

      {/* Gestion des 6 états */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      ) : isError && displayedArticles.length === 0 ? (
        <ErrorState
          title="Impossible de joindre le serveur"
          message="Vérifiez votre connexion réseau. Vos articles en cache s'afficheront automatiquement dès qu'ils seront disponibles."
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <FlatList
          data={listArticles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={heroArticle ? null : renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.vert}
              colors={[COLORS.vert, COLORS.or]}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.noir,
    letterSpacing: -0.3,
  },
  sectionCaption: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 120,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
