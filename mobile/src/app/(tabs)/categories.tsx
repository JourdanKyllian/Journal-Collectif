import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import PageHeader from '@/components/navigation/PageHeader';

export default function CategoriesScreen() {
  const [subscribedIds, setSubscribedIds] = useState<number[]>([1]);

  const toggleSub = (id: number, label: string) => {
    Haptics.selectionAsync();
    setSubscribedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    Alert.alert('Notifications Push', `Préférences mises à jour pour « ${label} ».`);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <PageHeader 
        title="Catégories" 
        subtitle="Abonnez-vous aux alertes push par thématique" 
      />

      <FlatList
        data={MOCK_CATEGORIES.filter((c) => c.id !== 0)}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSub = subscribedIds.includes(item.id);
          return (
            <View style={styles.card}>
              <Text style={styles.emoji}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.libelle}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>
              <Pressable
                onPress={() => toggleSub(item.id, item.libelle)}
                style={[styles.subBtn, isSub && styles.subBtnActive]}
              >
                <Bell size={14} color={isSub ? COLORS.noir : COLORS.vert} />
                <Text style={[styles.subText, isSub && { color: COLORS.noir }]}>
                  {isSub ? 'Abonné' : 'Push'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blanc },
  list: { padding: 20, gap: 14, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emoji: { fontSize: 28 },
  cardTitle: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.noir },
  cardDesc: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.champagne, marginTop: 2 },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.vert,
  },
  subBtnActive: { backgroundColor: COLORS.or, borderColor: COLORS.or },
  subText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.vert },
});
