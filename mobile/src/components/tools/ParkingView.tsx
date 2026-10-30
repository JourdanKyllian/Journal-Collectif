import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { Car, Zap, Navigation, Clock, ShieldCheck, MapPin, Radio } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import { ParkingService, ParkingSpot } from '@/lib/services/parking.service';

export default function ParkingView() {
  const { currentCity } = useCity();
  const [filterType, setFilterType] = useState<'all' | 'ev' | 'free'>('all');
  const [parkings, setParkings] = useState<ParkingSpot[]>(() => ParkingService.getParkings());

  useEffect(() => {
    return ParkingService.subscribe((updated) => {
      setParkings(updated);
    });
  }, []);

  const activeParkings = parkings.filter((p) => p.isActive);

  const totalCapacity = activeParkings.reduce((sum, p) => sum + p.total, 0);
  const totalFree = activeParkings
    .filter((p) => p.hasSensors)
    .reduce((sum, p) => sum + p.available, 0);
  const openCount = activeParkings.length;

  const filteredParkings = activeParkings.filter((p) => {
    if (filterType === 'ev') return p.evSpots > 0;
    if (filterType === 'free') return p.freeGracePeriod.toLowerCase().includes('gratuit');
    return true;
  });

  const handleFilterChange = (filter: 'all' | 'ev' | 'free') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setFilterType(filter);
  };

  const handleNavigate = (parking: ParkingSpot) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const destination = `${parking.name}, ${currentCity.name}`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Apple Plans', 'Google Maps', 'Waze'],
          cancelButtonIndex: 0,
          title: `Itinéraire vers ${parking.name}`,
          message: `${parking.available} places libres • ${parking.distance}`,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            Toast.show({
              type: 'info',
              text1: 'Ouverture de Plans',
              text2: `Guidage vers ${parking.name}`,
            });
            await Linking.openURL(appleMapsUrl);
          } else if (buttonIndex === 2) {
            Toast.show({
              type: 'info',
              text1: 'Ouverture de Google Maps',
              text2: `Guidage vers ${parking.name}`,
            });
            await Linking.openURL(googleMapsUrl);
          } else if (buttonIndex === 3) {
            Toast.show({
              type: 'info',
              text1: 'Ouverture de Waze',
              text2: `Guidage vers ${parking.name}`,
            });
            await Linking.openURL(wazeUrl);
          }
        }
      );
    } else {
      Toast.show({
        type: 'info',
        text1: 'Lancement du guidage GPS',
        text2: `Itinéraire vers ${parking.name}`,
      });
      Linking.openURL(googleMapsUrl);
    }
  };

  const getOccupancyColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.35) return COLORS.success;
    if (ratio > 0.15) return COLORS.info;
    return '#C2410C';
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Live Badge d'actualisation */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.liveBanner}>
        <View style={styles.liveDot} />
        <Text style={styles.liveBannerText}>
          DISPONIBILITÉ EN TEMPS RÉEL • {currentCity.name.toUpperCase()}
        </Text>
      </Animated.View>

      {/* Cartouche d'information générale */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Car size={22} color={COLORS.or} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Mobilité & Stationnement</Text>
            <Text style={styles.summarySubtitle}>
              Capteurs de présence connectés sur la voirie municipale
            </Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalFree}</Text>
            <Text style={styles.statLabel}>Libres (Capteurs)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalCapacity}</Text>
            <Text style={styles.statLabel}>Capacité Totale</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{openCount}</Text>
            <Text style={styles.statLabel}>Parcs Ouverts</Text>
          </View>
        </View>
      </View>

      {/* Filtres ergonomiques à portée de pouce */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'Tous les parkings' },
            { key: 'ev', label: '⚡ Recharge Élec.' },
            { key: 'free', label: '🎁 Gratuités' },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.key}
            onPress={() => handleFilterChange(item.key)}
            style={[styles.filterChip, filterType === item.key && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === item.key && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Liste des parkings */}
      <View style={styles.list}>
        {filteredParkings.map((parking, index) => {
          const occupancyColor = getOccupancyColor(parking.available, parking.total);
          const percentFree = Math.round((parking.available / parking.total) * 100);

          return (
            <Animated.View
              key={parking.id}
              entering={FadeIn.delay(index * 100).duration(250)}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.typeBadgeRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{parking.type.toUpperCase()}</Text>
                    </View>
                    <View
                      style={[
                        styles.sensorBadge,
                        { backgroundColor: parking.hasSensors ? '#E6FFFA' : '#FEFCBF' },
                      ]}
                    >
                      <Radio
                        size={10}
                        color={parking.hasSensors ? '#217346' : '#975A16'}
                      />
                      <Text
                        style={[
                          styles.sensorBadgeText,
                          { color: parking.hasSensors ? '#217346' : '#975A16' },
                        ]}
                      >
                        {parking.hasSensors ? 'Capteurs en direct' : 'Non équipé'}
                      </Text>
                    </View>
                    <View style={styles.distanceBadge}>
                      <MapPin size={11} color={COLORS.champagne} />
                      <Text style={styles.distanceText}>{parking.distance}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{parking.name}</Text>
                </View>

                {/* Places disponibles (si capteurs) ou Capacité maximale (si non équipé) */}
                {parking.hasSensors ? (
                  <View style={styles.occupancyBox}>
                    <Text style={[styles.availableCount, { color: occupancyColor }]}>
                      {parking.available}
                    </Text>
                    <Text style={styles.totalCount}>/ {parking.total} libres</Text>
                  </View>
                ) : (
                  <View style={styles.occupancyBox}>
                    <Text style={[styles.availableCount, { color: COLORS.noir }]}>
                      {parking.total}
                    </Text>
                    <Text style={styles.totalCount}>places max</Text>
                  </View>
                )}
              </View>

              {/* Jauge cinématique pour capteurs connectés OU Affluence médiane constatée pour parcs non équipés */}
              {parking.hasSensors ? (
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={
                      percentFree > 35
                        ? ['#22C55E', '#16A34A']
                        : percentFree > 15
                        ? ['#F59E0B', '#EA580C']
                        : ['#EF4444', '#DC2626']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percentFree}%`,
                      },
                    ]}
                  />
                </View>
              ) : (
                <View style={styles.medianVisitorBox}>
                  <Text style={styles.medianVisitorText}>
                    {parking.affluenceMediane === 'calme'
                      ? '🟢 Affluence calme • Places faciles'
                      : parking.affluenceMediane === 'forte'
                      ? '🟠 Affluence forte constatée'
                      : parking.affluenceMediane === 'saturee'
                      ? '🔴 Affluence saturée • Souvent complet'
                      : '🟡 Affluence habituelle (Modérée)'}
                  </Text>
                </View>
              )}

              {/* Tags & Avantages */}
              <View style={styles.cardMetaRow}>
                <View style={styles.metaItem}>
                  <Clock size={13} color={COLORS.champagne} />
                  <Text style={styles.metaItemText}>{parking.freeGracePeriod}</Text>
                </View>
                {parking.evSpots > 0 && (
                  <View style={styles.metaItem}>
                    <Zap size={13} color={COLORS.or} />
                    <Text style={styles.metaItemText}>{parking.evSpots} bornes</Text>
                  </View>
                )}
              </View>

              {/* Bouton de guidage asymétrique et accessible au pouce */}
              <Pressable
                onPress={() => handleNavigate(parking)}
                style={({ pressed }) => [
                  styles.navButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
              >
                <Navigation size={15} color={COLORS.blanc} />
                <Text style={styles.navButtonText}>Naviguer vers ce parking</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Note de déploiement commune */}
      <View style={styles.infoBanner}>
        <ShieldCheck size={18} color={COLORS.or} />
        <Text style={styles.infoBannerText}>
          {"Données synchronisées avec les bornes d'entrée et les boucles magnétiques de "}
          {currentCity.shortName}.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  liveBannerText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.champagne,
    letterSpacing: 0.8,
  },
  summaryCard: {
    backgroundColor: COLORS.vert,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: COLORS.blanc,
  },
  summarySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.or,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.blanc,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
  },
  filterChipActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  filterChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.noir,
  },
  filterChipTextActive: {
    color: COLORS.blanc,
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.22)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: 'rgba(11, 28, 16, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.vert,
    letterSpacing: 0.5,
  },
  sensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sensorBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.montserratBold,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
  },
  cardTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.noir,
    letterSpacing: -0.2,
  },
  occupancyBox: {
    alignItems: 'flex-end',
  },
  availableCount: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    lineHeight: 24,
  },
  totalCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(142, 134, 113, 0.2)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  medianVisitorBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  medianVisitorText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: '#4A5568',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaItemText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.noir,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.vert,
    paddingVertical: 11,
    borderRadius: 14,
  },
  navButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.blanc,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.vert,
    lineHeight: 16,
  },
});

