import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_CATEGORIES, MOCK_ARTICLES } from '@/lib/mock-data';
import ScreenContainer from '@/components/layout/ScreenContainer';
import ArticleCard from '@/components/ArticleCard';

export default function CategoriesScreen() {
  // Liste des catégories valides (sans 'Tous')
  const categoryList = useMemo(
    () => MOCK_CATEGORIES.filter((c) => c.id !== 0),
    []
  );

  // État de sélection multi-rubriques : tableau vide = toutes les rubriques
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Articles filtrés selon la sélection
  const filteredArticles = useMemo(() => {
    if (selectedIds.length === 0) {
      return MOCK_ARTICLES;
    }
    return MOCK_ARTICLES.filter((article) =>
      selectedIds.includes(article.categorie.id)
    );
  }, [selectedIds]);

  // Nombre d'articles par catégorie
  const articleCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    categoryList.forEach((c) => {
      counts[c.id] = MOCK_ARTICLES.filter((a) => a.categorie.id === c.id).length;
    });
    return counts;
  }, [categoryList]);

  // Bascule d'une catégorie (multi-sélection fluide)
  const toggleCategory = (id: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sélection exclusive : "Entrer" directement dans une catégorie
  const enterSingleCategory = (id: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedIds([id]);
  };

  // Réinitialiser vers "Toutes les rubriques"
  const resetToAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedIds([]);
  };

  const isAll = selectedIds.length === 0;

  // Libellé de la sélection courante pour le sous-titre
  const activeSelectionLabel = useMemo(() => {
    if (isAll) return 'Toutes les actualités';
    const names = categoryList
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => c.libelle);
    return names.join(', ');
  }, [isAll, selectedIds, categoryList]);

  // En-tête de la liste
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Barre horizontale de pilules de filtres (accessibles d'une main) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        <Pressable
          onPress={resetToAll}
          style={[styles.pill, isAll && styles.pillActive]}
        >
          <Sparkles
            size={13}
            color={isAll ? COLORS.blanc : COLORS.champagne}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.pillText, isAll && styles.pillTextActive]}>
            Toutes
          </Text>
        </Pressable>

        {categoryList.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => toggleCategory(cat.id)}
              style={[styles.pill, isSelected && styles.pillActive]}
            >
              <Text style={{ marginRight: 4, fontSize: 13 }}>{cat.icon}</Text>
              <Text
                style={[
                  styles.pillText,
                  isSelected && styles.pillTextActive,
                ]}
              >
                {cat.libelle}
              </Text>
              {isSelected && (
                <View style={styles.pillDot} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 2. Quand "Toutes" est actif : Grille 2x2 des rubriques pour "entrer" dedans */}
      {isAll && (
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Explorer par Thématique</Text>
          <View style={styles.grid}>
            {categoryList.map((cat) => {
              const count = articleCounts[cat.id] ?? 0;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => enterSingleCategory(cat.id)}
                  style={({ pressed }) => [
                    styles.gridCard,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={styles.gridCardTop}>
                    <View style={styles.iconBox}>
                      <Text style={styles.gridEmoji}>{cat.icon}</Text>
                    </View>
                    <ArrowRight size={15} color={COLORS.champagne} />
                  </View>

                  <Text style={styles.gridTitle}>{cat.libelle}</Text>
                  <Text style={styles.gridCount}>{count} article{count > 1 ? 's' : ''}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. Barre de statut du flux d'articles */}
      <View style={styles.feedStatusRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.feedStatusTitle}>
            {isAll ? 'Fil d\'actualités' : activeSelectionLabel}
          </Text>
          <Text style={styles.feedStatusSub}>
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} disponible{filteredArticles.length > 1 ? 's' : ''}
          </Text>
        </View>

        {!isAll && (
          <Pressable onPress={resetToAll} style={styles.resetBtn}>
            <RotateCcw size={12} color={COLORS.vert} />
            <Text style={styles.resetBtnText}>Tout voir</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer headerContextTitle="Rubriques">

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <View style={styles.articleWrapper}>
            <ArticleCard item={item} index={index} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Sparkles size={28} color={COLORS.champagne} />
            <Text style={styles.emptyTitle}>Aucun article pour le moment</Text>
            <Text style={styles.emptySub}>
              Aucune actualité ne correspond aux rubriques sélectionnées.
            </Text>
            <Pressable onPress={resetToAll} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Réinitialiser les filtres</Text>
            </Pressable>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  listContent: {
    paddingBottom: 130,
  },
  headerContainer: {
    paddingTop: 12,
  },
  pillsScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.22)',
  },
  pillActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  pillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12.5,
    color: COLORS.champagne,
  },
  pillTextActive: {
    color: COLORS.blanc,
    fontFamily: FONTS.bodyBold,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.or,
    marginLeft: 6,
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.noir,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  gridEmoji: {
    fontSize: 18,
  },
  gridTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  gridCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    marginTop: 2,
  },
  feedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 134, 113, 0.12)',
  },
  feedStatusTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.noir,
  },
  feedStatusSub: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: COLORS.champagne,
    marginTop: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
  },
  resetBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  articleWrapper: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.noir,
    marginTop: 10,
  },
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  emptyBtn: {
    backgroundColor: COLORS.vert,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 99,
    marginTop: 14,
  },
  emptyBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
});
