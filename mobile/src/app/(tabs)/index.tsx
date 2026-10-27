import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Landmark, SlidersHorizontal, Plus } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_ARTICLES, MOCK_ALERTS } from '@/lib/mock-data';

import AlertBanner from '@/components/AlertBanner';
import ArticleCard from '@/components/ArticleCard';
import FilterSheetModal from '@/components/FilterSheetModal';

export default function FeedScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Filtrage local en fonction de la Bottom Sheet
  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'Tous') return MOCK_ARTICLES;
    return MOCK_ARTICLES.filter((a) => a.categorie.libelle === selectedCategory);
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER MULTI-TENANT */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Landmark size={20} color={COLORS.or} />
          </View>
          <View>
            <Text style={styles.journalLabel}>X-JOURNAL : COLLECTIF-CHALONNAIS</Text>
            <Text style={styles.journalTitle}>Collectif Châlonnais</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setIsFilterSheetOpen(true)}
          style={styles.filterButton}
          accessibilityLabel="Filtrer par catégorie"
        >
          <SlidersHorizontal size={18} color={COLORS.or} />
        </Pressable>
      </View>

      {/* BANNIÈRE D'ALERTE URGENTE */}
      <AlertBanner alerts={MOCK_ALERTS} />

      {/* INDICATEUR DE FILTRE ACTIF */}
      <View style={styles.subHeader}>
        <Text style={styles.sectionHeading}>À la une</Text>
        <Pressable
          onPress={() => setIsFilterSheetOpen(true)}
          style={styles.activeFilterPill}
        >
          <Text style={styles.activeFilterText}>Thème : {selectedCategory}</Text>
        </Pressable>
      </View>

      {/* LISTE DES ARTICLES */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ArticleCard item={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* BOUTON FLOTTANT : SOUMETTRE UN ARTICLE */}
      <Pressable
        onPress={() => router.push('/modals/submit')}
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
      >
        <Plus size={22} color={COLORS.noir} strokeWidth={2.5} />
        <Text style={styles.fabText}>Contribuer</Text>
      </Pressable>

      {/* BOTTOM SHEET NATIVE POUR LES FILTRES */}
      <FilterSheetModal
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  header: {
    backgroundColor: COLORS.vert,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.noir,
    borderWidth: 1.5,
    borderColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalLabel: {
    fontFamily: FONTS.accent,
    fontSize: 10,
    color: COLORS.or,
    letterSpacing: 1,
  },
  journalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.blanc,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionHeading: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.noir,
  },
  activeFilterPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.3)',
  },
  activeFilterText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.vert,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.or,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 99,
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  fabText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.noir,
  },
});
