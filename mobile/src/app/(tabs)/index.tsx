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

import { COLORS, FONTS } from '@/theme/tokens';
import { MobileArticle, MobileAlert, MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_ALERTS } from '@/lib/mock-data';
import { useCity } from '@/context/CityContext';
import { FeedService } from '@/lib/services/feed.service';

import ScreenContainer from '@/components/layout/ScreenContainer';
import AlertBanner from '@/components/AlertBanner';
import CategoryPillsBar, { PillCategory } from '@/components/common/CategoryPillsBar';
import HeroCard from '@/components/articles/HeroCard';
import ArticleListItem from '@/components/articles/ArticleListItem';
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton';

export default function FeedScreen() {
  const { currentCity } = useCity();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const [articles, setArticles] = useState<MobileArticle[]>(MOCK_ARTICLES);
  const [categories, setCategories] = useState<PillCategory[]>(MOCK_CATEGORIES);
  const [alerts, setAlerts] = useState<MobileAlert[]>(MOCK_ALERTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Chargement des catégories & alertes
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, alertsData] = await Promise.all([
          FeedService.getCategories(),
          FeedService.getAlerts(),
        ]);
        setCategories(cats);
        setAlerts(alertsData);
      } catch {
        // Fallback silencieux sur mock
      }
    }
    loadMeta();
  }, [currentCity.slug]);

  // Chargement des articles au changement de commune ou de filtre
  useEffect(() => {
    let isMounted = true;

    async function fetchFeed() {
      try {
        const activeCatObj = categories.find((c) => c.libelle === selectedCategory);
        const catId = activeCatObj && activeCatObj.id !== 0 ? activeCatObj.id : undefined;

        const result = await FeedService.getPublishedArticles({
          categorieId: catId,
          limit: 20,
        });

        if (!isMounted) return;

        let list = result.articles;
        if (selectedCategory !== 'Tous') {
          list = list.filter((a) => a.categorie.libelle === selectedCategory);
        }
        setArticles(list);
      } catch {
        if (!isMounted) return;
        if (selectedCategory === 'Tous') {
          setArticles(MOCK_ARTICLES);
        } else {
          setArticles(MOCK_ARTICLES.filter((a) => a.categorie.libelle === selectedCategory));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchFeed();
    return () => {
      isMounted = false;
    };
  }, [categories, selectedCategory, currentCity.slug]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const activeCatObj = categories.find((c) => c.libelle === selectedCategory);
    const catId = activeCatObj && activeCatObj.id !== 0 ? activeCatObj.id : undefined;
    FeedService.getPublishedArticles({ categorieId: catId, limit: 20 })
      .then((result) => {
        let list = result.articles;
        if (selectedCategory !== 'Tous') {
          list = list.filter((a) => a.categorie.libelle === selectedCategory);
        }
        setArticles(list);
      })
      .catch(() => {})
      .finally(() => setIsRefreshing(false));
  }, [categories, selectedCategory]);

  // Premier article = Hero
  const heroArticle = articles[0] ?? null;
  // Reste de la liste (sans le hero)
  const listArticles = articles.slice(1);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
  }, []);

  const renderListHeader = () => (
    <View>
      {/* Hero Card */}
      {heroArticle && (
        <Animated.View entering={FadeIn.duration(350)}>
          <HeroCard article={heroArticle} />
        </Animated.View>
      )}

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Autres articles</Text>
        <Text style={styles.sectionCaption}>
          Actualités de {currentCity.shortName}
        </Text>
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MobileArticle; index: number }) => (
      <ArticleListItem item={item} index={index} />
    ),
    [],
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>Aucun article</Text>
      <Text style={styles.emptyCaption}>
        Aucune actualité dans cette rubrique pour le moment.
      </Text>
    </Animated.View>
  );

  return (
    <ScreenContainer>
      {/* Bandeau alerte (sous le header, non flottant) */}
      <AlertBanner alerts={alerts} />

      {/* Filtre categories sticky DRY */}
      <CategoryPillsBar
        categories={categories}
        selectedLabel={selectedCategory}
        onSelect={handleCategorySelect}
      />

      {/* Feed ou Skeleton pendant chargement initial */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
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
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.noir,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyCaption: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.champagne,
    lineHeight: 19,
    textAlign: 'center',
  },
});
