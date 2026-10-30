import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ChevronDown, Calendar, BookOpen } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MobileArticle, MobileAlert, MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_ALERTS } from '@/lib/mock-data';
import { useCity } from '@/context/CityContext';
import { FeedService } from '@/lib/services/feed.service';

import AlertBanner from '@/components/AlertBanner';
import CitySelectorSheet from '@/components/CitySelectorSheet';
import HomeHeader from '@/components/HomeHeader';
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton';

const HERO_HEIGHT = 300;

// ─── Hero Card ─────────────────────────────────────────────────────────────────

function HeroCard({ article }: { article: MobileArticle }) {
  const bounceY = useSharedValue(0);

  React.useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bounceY]);

  const chevronAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/articles/${article.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.93 }]}
      accessibilityRole="button"
      accessibilityLabel={`Lire l'article : ${article.titre}`}
    >
      {/* Image plein-format */}
      {article.image_couverture ? (
        <Image
          source={{ uri: article.image_couverture }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.vert }]} />
      )}

      {/* Véritable dégradé cinématique */}
      <LinearGradient
        colors={['transparent', 'rgba(11, 28, 16, 0.45)', 'rgba(11, 28, 16, 0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Contenu bas */}
      <View style={styles.heroContent}>
        {/* Badge catégorie */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {article.categorie.icon} {article.categorie.libelle}
          </Text>
        </View>

        <Text style={styles.heroTitle} numberOfLines={3}>
          {article.titre}
        </Text>

        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Calendar size={12} color="rgba(254,249,241,0.7)" />
            <Text style={styles.heroMetaText}>{article.published_at}</Text>
          </View>
          <View style={styles.heroMetaDot} />
          <View style={styles.heroMetaItem}>
            <BookOpen size={12} color="rgba(254,249,241,0.7)" />
            <Text style={styles.heroMetaText}>{article.readTime} de lecture</Text>
          </View>
        </View>
      </View>

      {/* Chevron animé – invitation à scroller */}
      <Animated.View style={[styles.heroScrollHint, chevronAnimStyle]}>
        <ChevronDown size={20} color="rgba(254,249,241,0.6)" strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Category Pill ──────────────────────────────────────────────────────────────

interface CategoryPillProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}

function CategoryPill({ label, icon, isActive, onPress }: CategoryPillProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pill,
        isActive && styles.pillActive,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
      ]}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {icon} {label}
      </Text>
    </Pressable>
  );
}

// ─── Article list item (compact) ────────────────────────────────────────────────

function ArticleListItem({ item, index }: { item: MobileArticle; index: number }) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push(`/articles/${item.id}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(16)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.listItem,
          pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Lire : ${item.titre}`}
      >
        {/* Thumbnail */}
        <View style={styles.listThumb}>
          {item.image_couverture ? (
            <Image
              source={{ uri: item.image_couverture }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.vert }]} />
          )}
          <View style={styles.listBadge}>
            <Text style={styles.listBadgeText}>{item.categorie.icon}</Text>
          </View>
        </View>

        {/* Text */}
        <View style={styles.listBody}>
          <View style={styles.listCategoryRow}>
            <Text style={styles.listCategory}>{item.categorie.libelle}</Text>
          </View>
          <Text style={styles.listTitle} numberOfLines={2}>
            {item.titre}
          </Text>
          <View style={styles.listMeta}>
            <Calendar size={11} color={COLORS.champagne} />
            <Text style={styles.listMetaText}>{item.published_at}</Text>
            <View style={styles.listMetaDot} />
            <BookOpen size={11} color={COLORS.champagne} />
            <Text style={styles.listMetaText}>{item.readTime}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Sticky Filter Bar ──────────────────────────────────────────────────────────

interface FilterCategory {
  id: number;
  libelle: string;
  icon: string;
}

interface FilterBarProps {
  categories: FilterCategory[];
  selected: string;
  onSelect: (cat: string) => void;
}

function FilterBar({ categories, selected, onSelect }: FilterBarProps) {
  return (
    <BlurView intensity={60} tint="light" style={styles.filterBarBlur}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBarContent}
        style={styles.filterBarScroll}
      >
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            label={cat.libelle}
            icon={cat.icon}
            isActive={selected === cat.libelle}
            onPress={() => onSelect(cat.libelle)}
          />
        ))}
      </ScrollView>
    </BlurView>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { currentCity } = useCity();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isCitySheetOpen, setIsCitySheetOpen] = useState(false);
  const [isLoggedIn] = useState(false);

  const [articles, setArticles] = useState<MobileArticle[]>(MOCK_ARTICLES);
  const [categories, setCategories] = useState<FilterCategory[]>(MOCK_CATEGORIES);
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

  // Header rendu dans le ListHeaderComponent
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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {/* Header */}
      <HomeHeader
        isLoggedIn={isLoggedIn}
        onFilterPress={() => {}}
        onCityPress={() => setIsCitySheetOpen(true)}
        isCitySheetOpen={isCitySheetOpen}
        isFilterActive={selectedCategory !== 'Tous'}
        onUserPress={() =>
          isLoggedIn ? router.push('/(tabs)/profile') : router.push('/modals/login')
        }
      />

      {/* Bandeau alerte (sous le header, non flottant) */}
      <AlertBanner alerts={alerts} />

      {/* Filtre categories sticky */}
      <FilterBar
        categories={categories}
        selected={selectedCategory}
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

      {/* City Selector Sheet */}
      <CitySelectorSheet
        visible={isCitySheetOpen}
        onClose={() => setIsCitySheetOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },

  // ── Filter Bar ──
  filterBarBlur: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.12)',
  },
  filterBarScroll: {
    flexGrow: 0,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(245, 239, 230, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  pillActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  pillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.champagne,
  },
  pillTextActive: {
    color: COLORS.blanc,
  },

  // ── Hero Card ──
  heroCard: {
    height: HERO_HEIGHT,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.vert,
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    // Couche gradient inlinée directement
    backgroundColor: 'transparent',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.or,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: COLORS.noir,
  },
  heroTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    color: COLORS.blanc,
    lineHeight: 28,
    letterSpacing: -0.5,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: 'rgba(254, 249, 241, 0.75)',
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(254, 249, 241, 0.4)',
  },
  heroScrollHint: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    opacity: 0.7,
  },

  // ── Section header ──
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

  // ── List Item ──
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.blanc,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listThumb: {
    width: 100,
    height: 100,
    flexShrink: 0,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  listBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBadgeText: {
    fontSize: 13,
  },
  listBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listCategoryRow: {
    marginBottom: 4,
  },
  listCategory: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.or,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.noir,
    lineHeight: 19,
    flex: 1,
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listMetaText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
  },
  listMetaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.champagne,
    marginHorizontal: 2,
  },

  // ── Feed ──
  listContent: {
    paddingBottom: 120,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Empty state ──
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
