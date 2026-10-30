import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MapPin, Calendar, Plus, HandHelping, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_LOST_OBJECTS, MobileLostObject } from '@/lib/mock-data';
import { useCity } from '@/context/CityContext';

export default function LostObjectsView() {
  const { currentCity } = useCity();
  const [filter, setFilter] = useState<'all' | 'perdu' | 'trouve'>('all');

  const filteredData =
    filter === 'all'
      ? MOCK_LOST_OBJECTS
      : MOCK_LOST_OBJECTS.filter((o) => o.status === filter);

  const handleFilterPress = (status: 'all' | 'perdu' | 'trouve') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setFilter(status);
  };

  const handleClaim = (item: MobileLostObject) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      'Service Objets Trouvés',
      `Pour réclamer la référence ${item.reference} (${item.title}), présentez-vous avec une pièce d'identité à l'accueil de la mairie de ${currentCity.shortName}.`
    );
  };

  const handleDeclare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/modals/declare-lost');
  };

  return (
    <View style={styles.container}>
      {/* Barre de filtres horizontaux */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'Tous les objets' },
            { key: 'perdu', label: 'Objets Perdus' },
            { key: 'trouve', label: 'Objets Trouvés' },
          ] as const
        ).map((item) => {
          const isActive = filter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleFilterPress(item.key)}
              style={[styles.pill, isActive && styles.pillActive]}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bannière de sensibilisation citoyenne */}
      <View style={styles.entraidCard}>
        <HandHelping size={18} color={COLORS.or} />
        <Text style={styles.entraidText}>
          Les objets trouvés sont conservés 90 jours au poste central de police municipale de{' '}
          {currentCity.shortName}.
        </Text>
      </View>

      {/* Liste des signalements */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isTrouve = item.status === 'trouve';
          const isReclame = item.status === 'reclame';

          return (
            <Animated.View
              entering={FadeInDown.delay(index * 80).duration(250)}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={styles.refBadge}>
                  <Text style={styles.refText}>{item.reference}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isTrouve && styles.statusBadgeTrouve,
                    isReclame && styles.statusBadgeReclame,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isTrouve && styles.statusTextTrouve,
                      isReclame && styles.statusTextReclame,
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.objTitle}>{item.title}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MapPin size={13} color={COLORS.champagne} />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={13} color={COLORS.champagne} />
                  <Text style={styles.metaText}>{item.date}</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleClaim(item)}
                style={({ pressed }) => [
                  styles.claimButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Info size={14} color={COLORS.vert} />
                <Text style={styles.claimButtonText}>
                  {isTrouve ? "C'est mon objet" : 'Détails & Contact régie'}
                </Text>
              </Pressable>
            </Animated.View>
          );
        }}
      />

      {/* Bouton d'action asymétrique au pouce pour déclarer un objet */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.fabContainer}>
        <Pressable
          onPress={handleDeclare}
          style={({ pressed }) => [
            styles.fab,
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Déclarer un objet perdu ou trouvé"
        >
          <View style={styles.fabIconBox}>
            <Plus size={18} color={COLORS.blanc} strokeWidth={2.8} />
          </View>
          <Text style={styles.fabText}>Déclarer</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  pillActive: {
    backgroundColor: COLORS.or,
    borderColor: COLORS.or,
  },
  pillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.champagne,
  },
  pillTextActive: {
    color: COLORS.noir,
  },
  entraidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  entraidText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.vert,
    lineHeight: 15,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.22)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refBadge: {
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.champagne,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusBadgeTrouve: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeReclame: {
    backgroundColor: 'rgba(142, 134, 113, 0.2)',
  },
  statusText: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: '#92400E',
  },
  statusTextTrouve: {
    color: '#166534',
  },
  statusTextReclame: {
    color: COLORS.noir,
  },
  objTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.noir,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 28, 16, 0.06)',
    paddingVertical: 9,
    borderRadius: 12,
  },
  claimButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.vert,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    zIndex: 10,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.vert,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 99,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  fabIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: COLORS.blanc,
    letterSpacing: 0.3,
  },
});

