import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Calendar, Plus } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_LOST_OBJECTS } from '@/lib/mock-data';

export default function LostObjectsScreen() {
  const [filter, setFilter] = useState<'all' | 'perdu' | 'trouve'>('all');

  const data =
    filter === 'all'
      ? MOCK_LOST_OBJECTS
      : MOCK_LOST_OBJECTS.filter((o) => o.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Objets Perdus</Text>
        <Text style={styles.subtitle}>Entraide citoyenne dans la commune</Text>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'perdu', 'trouve'] as const).map((status) => (
          <Pressable
            key={status}
            onPress={() => setFilter(status)}
            style={[styles.pill, filter === status && styles.pillActive]}
          >
            <Text style={[styles.pillText, filter === status && styles.pillTextActive]}>
              {status === 'all' ? 'Tous' : status === 'perdu' ? 'Perdus' : 'Trouvés'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.ref}>{item.reference}</Text>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'trouve' && { backgroundColor: '#DCFCE7' },
                ]}
              >
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.objTitle}>{item.title}</Text>
            <View style={styles.metaRow}>
              <MapPin size={14} color={COLORS.champagne} />
              <Text style={styles.metaText}>{item.location}</Text>
              <Calendar size={14} color={COLORS.champagne} style={{ marginLeft: 10 }} />
              <Text style={styles.metaText}>{item.date}</Text>
            </View>
          </View>
        )}
      />

      <Pressable onPress={() => router.push('/modals/submit')} style={styles.fab}>
        <Plus size={20} color={COLORS.noir} />
        <Text style={styles.fabText}>Déclarer un objet</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blanc },
  header: { backgroundColor: COLORS.vert, padding: 20 },
  title: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.or },
  subtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.blanc, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
  },
  pillActive: { backgroundColor: COLORS.or },
  pillText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.champagne },
  pillTextActive: { color: COLORS.noir },
  list: { padding: 20, gap: 14, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ref: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.champagne },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: { fontFamily: FONTS.headingBold, fontSize: 10, color: COLORS.noir },
  objTitle: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.noir, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.champagne },
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
  },
  fabText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.noir },
});
