import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ActionSheetIOS,
  Linking,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import {
  Car,
  Zap,
  Radio,
  Sliders,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock,
  PauseCircle,
  Activity,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import {
  ParkingService,
  ParkingSpot,
  AffluenceMediane,
} from '@/lib/services/parking.service';
import EditParkingModal from '@/components/admin/EditParkingModal';

type FilterSubCategory = 'all' | 'sensors' | 'non_sensors' | 'ev' | 'inactive';

const AFFLUENCE_CONFIG: Record<
  AffluenceMediane,
  { label: string; badge: string; desc: string; color: string; bgColor: string }
> = {
  calme: {
    label: 'Calme',
    badge: '🟢',
    desc: 'Places faciles à trouver',
    color: '#217346',
    bgColor: '#E2F3EB',
  },
  moderee: {
    label: 'Habituelle (Modérée)',
    badge: '🟡',
    desc: 'Affluence moyenne constatée',
    color: '#975A16',
    bgColor: '#FEFCBF',
  },
  forte: {
    label: 'Forte affluence',
    badge: '🟠',
    desc: 'Recherche difficile',
    color: '#C05621',
    bgColor: '#FEEBC8',
  },
  saturee: {
    label: 'Saturée / Quasi complet',
    badge: '🔴',
    desc: 'Très peu ou pas de places',
    color: '#C53030',
    bgColor: '#FED7D7',
  },
};

const AFFLUENCE_LIST: { key: AffluenceMediane; label: string; badge: string }[] = [
  { key: 'calme', label: 'Calme', badge: '🟢' },
  { key: 'moderee', label: 'Habituelle', badge: '🟡' },
  { key: 'forte', label: 'Forte', badge: '🟠' },
  { key: 'saturee', label: 'Saturée', badge: '🔴' },
];

export default function AdminParkingView() {
  const { currentCity } = useCity();
  const [parkings, setParkings] = useState<ParkingSpot[]>(() => ParkingService.getParkings());
  const [filter, setFilter] = useState<FilterSubCategory>('all');
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [selectedParking, setSelectedParking] = useState<ParkingSpot | null>(null);

  useEffect(() => {
    return ParkingService.subscribe((updated) => {
      setParkings(updated);
    });
  }, []);

  // Filtrage des parkings
  const filteredParkings = parkings.filter((p) => {
    if (filter === 'sensors') return p.hasSensors;
    if (filter === 'non_sensors') return !p.hasSensors;
    if (filter === 'ev') return p.evSpots > 0;
    if (filter === 'inactive') return !p.isActive;
    return true;
  });

  // KPIs globaux
  const totalCapacity = parkings.reduce((sum, p) => sum + p.total, 0);
  const totalAvailableSensors = parkings
    .filter((p) => p.isActive && p.hasSensors)
    .reduce((sum, p) => sum + p.available, 0);
  const sensorCount = parkings.filter((p) => p.hasSensors).length;
  const nonSensorCount = parkings.filter((p) => !p.hasSensors).length;
  const activeCount = parkings.filter((p) => p.isActive).length;

  const handleFilterChange = (newFilter: FilterSubCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setFilter(newFilter);
  };

  // Mise à jour rapide de l'affluence médiane pour les parkings non équipés
  const handleSetMedianAffluence = async (parking: ParkingSpot, affluence: AffluenceMediane) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const updated = await ParkingService.setAffluenceMediane(parking.id, affluence);
    if (updated) {
      Toast.show({
        type: 'success',
        text1: `${parking.name} mis à jour`,
        text2: `Affluence médiane réglée sur : ${AFFLUENCE_CONFIG[affluence].badge} ${AFFLUENCE_CONFIG[affluence].label}`,
      });
    }
  };

  // Bascule En ligne / Hors ligne
  const handleToggleActive = async (parking: ParkingSpot) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = await ParkingService.toggleActive(parking.id);
    if (updated) {
      Toast.show({
        type: updated.isActive ? 'success' : 'info',
        text1: updated.isActive ? 'Parking remis en ligne 🟢' : 'Parking masqué (Hors service) 🔴',
        text2: updated.name,
      });
    }
  };

  // TEST DU LIEN GPS / GUIDAGE
  const handleTestGpsLink = (parking: ParkingSpot) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const destination = parking.address || `${parking.name}, ${currentCity.name}`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Tester Apple Plans', 'Tester Google Maps', 'Tester Waze'],
          cancelButtonIndex: 0,
          title: `Tester le lien de guidage : ${parking.name}`,
          message: `Destination transmise : "${destination}"`,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            Toast.show({
              type: 'info',
              text1: 'Test du guidage Apple Plans',
              text2: destination,
            });
            await Linking.openURL(appleMapsUrl);
          } else if (buttonIndex === 2) {
            Toast.show({
              type: 'info',
              text1: 'Test du guidage Google Maps',
              text2: destination,
            });
            await Linking.openURL(googleMapsUrl);
          } else if (buttonIndex === 3) {
            Toast.show({
              type: 'info',
              text1: 'Test du guidage Waze',
              text2: destination,
            });
            await Linking.openURL(wazeUrl);
          }
        }
      );
    } else {
      Toast.show({
        type: 'info',
        text1: 'Test du guidage GPS',
        text2: destination,
      });
      Linking.openURL(googleMapsUrl);
    }
  };

  // Édition
  const handleOpenEdit = (parking: ParkingSpot) => {
    setSelectedParking(parking);
    setIsEditModalVisible(true);
  };

  // Ajout nouveau
  const handleOpenCreate = () => {
    setSelectedParking(null);
    setIsEditModalVisible(true);
  };

  const handleSaveParking = (data: Omit<ParkingSpot, 'id'>, editId?: string) => {
    if (editId) {
      ParkingService.updateParking(editId, data);
      Toast.show({
        type: 'success',
        text1: 'Parking mis à jour 🅿️',
        text2: data.name,
      });
    } else {
      ParkingService.addParking(data);
      Toast.show({
        type: 'success',
        text1: 'Nouveau parking créé ✨',
        text2: data.name,
      });
    }
  };

  const handleDeleteParking = (parking: ParkingSpot) => {
    Alert.alert(
      'Supprimer ce parking ?',
      `Confirmez-vous la suppression définitive de "${parking.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            ParkingService.deleteParking(parking.id);
            Toast.show({
              type: 'info',
              text1: 'Parking supprimé',
              text2: parking.name,
            });
          },
        },
      ]
    );
  };

  const getOccupancyColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.35) return '#22C55E';
    if (ratio > 0.15) return '#EA580C';
    return '#DC2626';
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. CARTOUCHE DE CONTRÔLE ADMIN */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.kpiCard}>
        <View style={styles.kpiHeader}>
          <View style={styles.kpiIconBox}>
            <Sliders size={20} color={COLORS.vert} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiTitle}>Supervision du Stationnement</Text>
            <Text style={styles.kpiSubtitle}>
              Capteurs IoT & parcs municipaux de {currentCity.name}
            </Text>
          </View>
          <Pressable
            onPress={handleOpenCreate}
            style={styles.addParkingQuickBtn}
          >
            <Plus size={14} color={COLORS.blanc} />
            <Text style={styles.addParkingQuickText}>Nouveau parc</Text>
          </Pressable>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{totalAvailableSensors}</Text>
            <Text style={styles.kpiLabel}>Libres (Capteurs)</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{totalCapacity}</Text>
            <Text style={styles.kpiLabel}>Capacité Totale</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{sensorCount}</Text>
            <Text style={styles.kpiLabel}>Équipés IoT</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{nonSensorCount}</Text>
            <Text style={styles.kpiLabel}>Non Équipés</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiValue, { color: activeCount === parkings.length ? '#217346' : '#C05621' }]}>
              {activeCount}
            </Text>
            <Text style={styles.kpiLabel}>En Service</Text>
          </View>
        </View>
      </Animated.View>

      {/* 2. SOUS-CATÉGORIES & FILTRES ERGONOMIQUES */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(
            [
              { key: 'all', label: `🌟 Tous (${parkings.length})` },
              { key: 'sensors', label: `📡 Équipés capteurs (${sensorCount})` },
              { key: 'non_sensors', label: `🅿️ Non équipés (${nonSensorCount})` },
              { key: 'ev', label: `⚡ Bornes élec. (${parkings.filter((p) => p.evSpots > 0).length})` },
              { key: 'inactive', label: `⏸️ Hors service (${parkings.filter((p) => !p.isActive).length})` },
            ] as const
          ).map((item) => {
            const isActive = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => handleFilterChange(item.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. LISTE DES PARKINGS MUNICIPAUX */}
      <View style={styles.list}>
        {filteredParkings.map((parking, index) => {
          const occupancyColor = getOccupancyColor(parking.available, parking.total);
          const percentFree = Math.round((parking.available / parking.total) * 100);
          const isFull = parking.available <= 0;
          const affluenceCurrent = parking.affluenceMediane || 'moderee';
          const affluenceInfo = AFFLUENCE_CONFIG[affluenceCurrent];

          return (
            <Animated.View
              key={parking.id}
              entering={FadeIn.delay(index * 70).duration(200)}
              style={[
                styles.adminCard,
                !parking.isActive && styles.adminCardDisabled,
              ]}
            >
              {/* En-tête de carte avec badges statut */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    {/* Badge Type */}
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{parking.type.toUpperCase()}</Text>
                    </View>

                    {/* SOUS-CATÉGORIE : Équipé capteurs vs Non équipé */}
                    <View
                      style={[
                        styles.sensorBadge,
                        parking.hasSensors ? styles.sensorBadgeActive : styles.sensorBadgeManual,
                      ]}
                    >
                      <Radio
                        size={10}
                        color={parking.hasSensors ? '#217346' : '#975A16'}
                      />
                      <Text
                        style={[
                          styles.sensorBadgeText,
                          parking.hasSensors
                            ? styles.sensorBadgeTextActive
                            : styles.sensorBadgeTextManual,
                        ]}
                      >
                        {parking.hasSensors ? 'Équipé capteurs IoT' : 'Non équipé'}
                      </Text>
                    </View>

                    {/* Statut En Ligne */}
                    <View
                      style={[
                        styles.statusBadge,
                        parking.isActive ? styles.statusBadgeOnline : styles.statusBadgeOffline,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          parking.isActive
                            ? styles.statusBadgeTextOnline
                            : styles.statusBadgeTextOffline,
                        ]}
                      >
                        {parking.isActive ? 'En ligne' : 'Masqué'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardName}>{parking.name}</Text>
                  <View style={styles.addressRow}>
                    <MapPin size={11} color="#718096" />
                    <Text style={styles.addressText}>{parking.address || `${parking.name}, ${currentCity.name}`}</Text>
                  </View>
                </View>

                {/* Affichage places : Temps réel si capteurs, ou Capacité Max si non équipé */}
                {parking.hasSensors ? (
                  <View style={styles.occupancyBox}>
                    <Text style={[styles.availBigNumber, { color: occupancyColor }]}>
                      {parking.available}
                    </Text>
                    <Text style={styles.totalLabel}>/ {parking.total} libres</Text>
                  </View>
                ) : (
                  <View style={styles.occupancyBox}>
                    <Text style={[styles.availBigNumber, { color: COLORS.noir }]}>
                      {parking.total}
                    </Text>
                    <Text style={styles.totalLabel}>places max</Text>
                  </View>
                )}
              </View>

              {/* SECTION SELON ÉQUIPEMENT : CAPTEURS IOT vs AFFLUENCE MÉDIANE */}
              {parking.hasSensors ? (
                /* 1. Parking ÉQUIPÉ : Affichage de la jauge et flux de télémétrie automatique */
                <View style={styles.sensorsSection}>
                  <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeBg}>
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
                        style={[styles.gaugeFill, { width: `${percentFree}%` }]}
                      />
                    </View>
                    <View style={styles.gaugeLabelRow}>
                      <Text style={styles.gaugeStatusText}>
                        {isFull
                          ? '🛑 COMPLET / SATURÉ'
                          : percentFree > 35
                          ? '🟢 Circulation fluide'
                          : '🟡 Affluence forte'}
                      </Text>
                      <Text style={styles.gaugePercentText}>{percentFree}% disponible</Text>
                    </View>
                  </View>

                  {/* Bannière de télémétrie IoT automatique (Pas de gestion manuelle) */}
                  <View style={styles.iotBanner}>
                    <Activity size={13} color="#217346" />
                    <Text style={styles.iotBannerText}>
                      Synchronisation automatique en direct via sondes et caméras connectées
                    </Text>
                  </View>
                </View>
              ) : (
                /* 2. Parking NON ÉQUIPÉ : Affichage de la capacité max et réglage de l'affluence médiane */
                <View style={styles.medianSection}>
                  <View style={styles.medianHeaderRow}>
                    <View>
                      <Text style={styles.medianHeaderTitle}>Affluence médiane constatée :</Text>
                      <Text style={styles.medianHeaderSubtitle}>{affluenceInfo.desc}</Text>
                    </View>
                    <View style={[styles.currentAffluenceTag, { backgroundColor: affluenceInfo.bgColor }]}>
                      <Text style={[styles.currentAffluenceText, { color: affluenceInfo.color }]}>
                        {affluenceInfo.badge} {affluenceInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Sélecteur d'affluence médiane 1-tap pour l'administrateur */}
                  <View style={styles.affluencePillsRow}>
                    {AFFLUENCE_LIST.map((item) => {
                      const isSelected = affluenceCurrent === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => handleSetMedianAffluence(parking, item.key)}
                          style={[
                            styles.affluencePill,
                            isSelected && styles.affluencePillActive,
                          ]}
                        >
                          <Text style={styles.affluencePillIcon}>{item.badge}</Text>
                          <Text
                            style={[
                              styles.affluencePillText,
                              isSelected && styles.affluencePillTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Caractéristiques secondaires */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={12} color="#718096" />
                  <Text style={styles.metaText}>{parking.freeGracePeriod}</Text>
                </View>
                {parking.evSpots > 0 && (
                  <View style={styles.metaItem}>
                    <Zap size={12} color={COLORS.or} />
                    <Text style={styles.metaText}>{parking.evSpots} bornes élec.</Text>
                  </View>
                )}
                {parking.statusNote && (
                  <View style={styles.metaItem}>
                    <ShieldCheck size={12} color={COLORS.vert} />
                    <Text style={styles.metaText}>{parking.statusNote}</Text>
                  </View>
                )}
              </View>

              {/* --- ACTIONS ADMINISTRATEUR --- */}
              <View style={styles.adminActionRow}>
                {/* 1. TESTER LE LIEN GPS */}
                <Pressable
                  onPress={() => handleTestGpsLink(parking)}
                  style={styles.actionBtnTestLink}
                >
                  <ExternalLink size={13} color={COLORS.vert} />
                  <Text style={styles.actionBtnTestText}>Tester le lien GPS</Text>
                </Pressable>

                {/* 2. RÉGLER / PARAMÈTRES DU PARC */}
                <Pressable
                  onPress={() => handleOpenEdit(parking)}
                  style={styles.actionBtnEdit}
                >
                  <Sliders size={13} color="#2D3748" />
                  <Text style={styles.actionBtnEditText}>Paramètres</Text>
                </Pressable>

                {/* 3. BASCULE EN SERVICE / HORS SERVICE */}
                <Pressable
                  onPress={() => handleToggleActive(parking)}
                  style={[
                    styles.actionBtnToggle,
                    parking.isActive ? styles.actionBtnToggleOff : styles.actionBtnToggleOn,
                  ]}
                >
                  <PauseCircle size={13} color={parking.isActive ? '#C05621' : '#217346'} />
                  <Text
                    style={[
                      styles.actionBtnToggleText,
                      parking.isActive ? { color: '#C05621' } : { color: '#217346' },
                    ]}
                  >
                    {parking.isActive ? 'Désactiver' : 'Activer'}
                  </Text>
                </Pressable>

                {/* 4. SUPPRIMER */}
                <Pressable
                  onPress={() => handleDeleteParking(parking)}
                  style={styles.actionBtnDelete}
                  hitSlop={6}
                >
                  <Trash2 size={14} color="#E53E3E" />
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        {filteredParkings.length === 0 && (
          <View style={styles.emptyCard}>
            <Car size={32} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Aucun équipement trouvé</Text>
            <Text style={styles.emptyDesc}>
              Aucun parking ne correspond à ce filtre pour votre commune.
            </Text>
            <Pressable
              onPress={handleOpenCreate}
              style={[styles.addParkingQuickBtn, { marginTop: 12 }]}
            >
              <Plus size={14} color={COLORS.blanc} />
              <Text style={styles.addParkingQuickText}>Créer un parking</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Modal d'édition / création */}
      <EditParkingModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveParking}
        parkingToEdit={selectedParking}
        cityName={currentCity.name}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTitle: {
    fontSize: 15,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.noir,
  },
  kpiSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginTop: 1,
  },
  addParkingQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.vert,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addParkingQuickText: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
    color: COLORS.blanc,
  },
  kpiGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  kpiCol: {
    alignItems: 'center',
    flex: 1,
  },
  kpiValue: {
    fontSize: 15,
    fontFamily: FONTS.poppinsBlack,
    color: COLORS.noir,
  },
  kpiLabel: {
    fontSize: 9,
    fontFamily: FONTS.montserratBold,
    color: '#718096',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  kpiDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  filterBar: {
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F0EBE1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: COLORS.vert,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: FONTS.montserratSemiBold,
    color: COLORS.noir,
  },
  filterChipTextActive: {
    fontFamily: FONTS.montserratBold,
    color: COLORS.blanc,
  },
  list: {
    gap: 14,
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  adminCardDisabled: {
    opacity: 0.75,
    backgroundColor: '#FAFAFA',
    borderColor: '#CBD5E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.montserratBold,
    color: '#4A5568',
  },
  sensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sensorBadgeActive: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#B2F5EA',
  },
  sensorBadgeManual: {
    backgroundColor: '#FEFCBF',
    borderWidth: 1,
    borderColor: '#FAF089',
  },
  sensorBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.montserratBold,
  },
  sensorBadgeTextActive: {
    color: '#217346',
  },
  sensorBadgeTextManual: {
    color: '#975A16',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeOnline: {
    backgroundColor: '#E2F3EB',
  },
  statusBadgeOffline: {
    backgroundColor: '#FED7D7',
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.montserratBold,
  },
  statusBadgeTextOnline: {
    color: '#217346',
  },
  statusBadgeTextOffline: {
    color: '#C53030',
  },
  cardName: {
    fontSize: 16,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.noir,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    fontFamily: FONTS.montserrat,
    color: '#718096',
  },
  occupancyBox: {
    alignItems: 'flex-end',
  },
  availBigNumber: {
    fontSize: 22,
    fontFamily: FONTS.poppinsBlack,
    lineHeight: 24,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
    color: '#718096',
    marginTop: 2,
  },
  sensorsSection: {
    marginBottom: 8,
  },
  gaugeContainer: {
    marginBottom: 8,
  },
  gaugeBg: {
    height: 7,
    backgroundColor: '#EDF2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  gaugeStatusText: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
    color: '#4A5568',
  },
  gaugePercentText: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
    color: '#718096',
  },
  iotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  iotBannerText: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
    color: '#217346',
    flex: 1,
  },
  medianSection: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  medianHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medianHeaderTitle: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
    color: COLORS.noir,
  },
  medianHeaderSubtitle: {
    fontSize: 10,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginTop: 1,
  },
  currentAffluenceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentAffluenceText: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
  },
  affluencePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  affluencePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  affluencePillActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  affluencePillIcon: {
    fontSize: 11,
  },
  affluencePillText: {
    fontSize: 10,
    fontFamily: FONTS.montserratSemiBold,
    color: '#4A5568',
  },
  affluencePillTextActive: {
    color: COLORS.blanc,
    fontFamily: FONTS.montserratBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: FONTS.montserrat,
    color: '#718096',
  },
  adminActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE1',
    paddingTop: 10,
  },
  actionBtnTestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1.3,
    justifyContent: 'center',
  },
  actionBtnTestText: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
    color: '#217346',
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF2F7',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  actionBtnEditText: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
    color: '#2D3748',
  },
  actionBtnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  actionBtnToggleOff: {
    backgroundColor: '#FEEBC8',
  },
  actionBtnToggleOn: {
    backgroundColor: '#C6F6D5',
  },
  actionBtnToggleText: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
  },
  actionBtnDelete: {
    padding: 6,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.noir,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
