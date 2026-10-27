import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_ARTICLES, MOCK_ALERTS } from '@/lib/mock-data';

import AlertBanner from '@/components/AlertBanner';
import ArticleCard from '@/components/ArticleCard';
import FilterSheetModal from '@/components/FilterSheetModal';
import HomeHeader from '@/components/HomeHeader';

export default function FeedScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'Tous') return MOCK_ARTICLES;
    return MOCK_ARTICLES.filter((a) => a.categorie.libelle === selectedCategory);
  }, [selectedCategory]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <HomeHeader 
        isLoggedIn={isLoggedIn}
        onFilterPress={() => setIsFilterSheetOpen(true)}
        onUserPress={() => isLoggedIn ? router.push('/(tabs)/profile') : router.push('/modals/login')}
      />

      <AlertBanner alerts={MOCK_ALERTS} />

      <View style={styles.subHeader}>
        <Text style={styles.sectionHeading}>À la une</Text>
        <Pressable onPress={() => setIsFilterSheetOpen(true)} style={styles.activeFilterPill}>
          <Text style={styles.activeFilterText}>Thème : {selectedCategory}</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <ArticleCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
  safeArea: { flex: 1, backgroundColor: COLORS.blanc },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  sectionHeading: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.noir },
  activeFilterPill: { backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(142, 134, 113, 0.3)' },
  activeFilterText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.vert },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
});
