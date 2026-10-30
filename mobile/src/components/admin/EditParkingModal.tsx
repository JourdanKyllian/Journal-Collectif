import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  Radio,
  Sliders,
  Car,
  Zap,
  MapPin,
  Clock,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { ParkingSpot, ParkingType, AffluenceMediane } from '@/lib/services/parking.service';

interface EditParkingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (parkingData: Omit<ParkingSpot, 'id'>, editId?: string) => void;
  parkingToEdit?: ParkingSpot | null;
  cityName: string;
}

const PARKING_TYPES: { type: ParkingType; label: string; icon: string }[] = [
  { type: 'Souterrain', label: 'Souterrain', icon: '🏢' },
  { type: 'Surface', label: 'Surface', icon: '🅿️' },
  { type: 'Gare', label: 'Gare & Parvis', icon: '🚆' },
  { type: 'Enclos', label: 'Enclos barriéré', icon: '🚧' },
];

const AFFLUENCE_OPTIONS: {
  key: AffluenceMediane;
  label: string;
  badge: string;
  desc: string;
}[] = [
  { key: 'calme', label: 'Calme', badge: '🟢', desc: 'Places faciles' },
  { key: 'moderee', label: 'Modérée', badge: '🟡', desc: 'Habituelle' },
  { key: 'forte', label: 'Forte', badge: '🟠', desc: 'Difficile' },
  { key: 'saturee', label: 'Saturée', badge: '🔴', desc: 'Quasi complet' },
];

function EditParkingForm({
  onClose,
  onSave,
  parkingToEdit,
  cityName,
}: Omit<EditParkingModalProps, 'visible'>) {
  const [name, setName] = useState<string>(parkingToEdit?.name ?? '');
  const [type, setType] = useState<ParkingType>(parkingToEdit?.type ?? 'Surface');
  const [total, setTotal] = useState<string>(String(parkingToEdit?.total ?? 120));
  const [available, setAvailable] = useState<string>(String(parkingToEdit?.available ?? 80));
  const [affluenceMediane, setAffluenceMediane] = useState<AffluenceMediane>(
    parkingToEdit?.affluenceMediane ?? 'moderee'
  );
  const [evSpots, setEvSpots] = useState<string>(String(parkingToEdit?.evSpots ?? 2));
  const [freeGracePeriod, setFreeGracePeriod] = useState<string>(
    parkingToEdit?.freeGracePeriod ?? '30 min gratuites'
  );
  const [distance, setDistance] = useState<string>(parkingToEdit?.distance ?? '350 m');
  const [address, setAddress] = useState<string>(
    parkingToEdit?.address ?? `Centre-ville, ${cityName}`
  );
  const [hasSensors, setHasSensors] = useState<boolean>(parkingToEdit?.hasSensors ?? false);
  const [isActive, setIsActive] = useState<boolean>(parkingToEdit?.isActive ?? true);
  const [statusNote, setStatusNote] = useState<string>(
    parkingToEdit?.statusNote ?? 'Ouvert 24h/24'
  );

  const handleSave = () => {
    if (!name.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const totalNum = Math.max(1, parseInt(total, 10) || 100);
    const availNum = hasSensors
      ? Math.min(totalNum, Math.max(0, parseInt(available, 10) || 0))
      : 0;
    const evNum = Math.max(0, parseInt(evSpots, 10) || 0);

    onSave(
      {
        name: name.trim(),
        type,
        total: totalNum,
        available: availNum,
        affluenceMediane: hasSensors ? undefined : affluenceMediane,
        evSpots: evNum,
        freeGracePeriod: freeGracePeriod.trim() || 'Payant selon barème',
        distance: distance.trim() || 'À proximité',
        address: address.trim() || `${name.trim()}, ${cityName}`,
        hasSensors,
        isActive,
        statusNote:
          statusNote.trim() ||
          (hasSensors
            ? 'Capteurs connectés • Temps réel'
            : `Non équipé • Affluence ${affluenceMediane}`),
      },
      parkingToEdit?.id
    );

    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.modalOverlay}
    >
      <View style={styles.modalContent}>
        {/* Poignée supérieure */}
        <View style={styles.dragHandle} />

        {/* En-tête */}
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalSubtitle}>VOIRIE & STATIONNEMENT • {cityName.toUpperCase()}</Text>
            <Text style={styles.modalTitle}>
              {parkingToEdit ? 'Paramètres du parking' : 'Nouveau parking municipal'}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={10}
          >
            <X size={18} color="#718096" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {/* 1. NOM DU PARKING */}
          <Text style={styles.fieldLabel}>NOM DE L’ÉQUIPEMENT *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex: Parking Hôtel de Ville, Parking de la Gare..."
            placeholderTextColor="#A0AEC0"
            style={styles.input}
          />

          {/* 2. TYPE DE PARKING */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>TYPE DE STATIONNEMENT</Text>
          <View style={styles.typeGrid}>
            {PARKING_TYPES.map((t) => {
              const isSelected = type === t.type;
              return (
                <Pressable
                  key={t.type}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setType(t.type);
                  }}
                  style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.typeCardLabel,
                      isSelected && styles.typeCardLabelSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 3. SECTION SOUS-CATÉGORIE : ÉQUIPEMENT EN CAPTEURS */}
          <View style={styles.sensorsSwitchCard}>
            <View style={styles.sensorIconCircle}>
              <Radio size={20} color={hasSensors ? '#217346' : '#975A16'} />
            </View>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.sensorsCardTitle}>
                {hasSensors ? 'Équipé de capteurs IoT (Temps réel)' : 'Non équipé (Affluence médiane)'}
              </Text>
              <Text style={styles.sensorsCardDesc}>
                {hasSensors
                  ? 'Synchronisation automatique en direct via capteurs connectés ou caméras.'
                  : 'Aucun capteur physique : affiche la capacité maximale et une affluence médiane estimée.'}
              </Text>
            </View>
            <Switch
              value={hasSensors}
              onValueChange={(val) => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHasSensors(val);
              }}
              trackColor={{ false: '#CBD5E0', true: '#C6F6D5' }}
              thumbColor={hasSensors ? COLORS.vert : '#FFFFFF'}
            />
          </View>

          {/* 4. STATUT EN LIGNE (VISIBILITÉ VISITEURS) */}
          <View style={styles.statusSwitchCard}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.statusSwitchTitle}>
                {isActive ? '🟢 En service (En ligne)' : '🔴 Hors service (Caché)'}
              </Text>
              <Text style={styles.statusSwitchDesc}>
                {isActive
                  ? 'Visible des résidents et visiteurs sur l’application citoyenne.'
                  : 'Masqué de l’application publique (travaux, déviation, marché...).'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={(val) => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsActive(val);
              }}
              trackColor={{ false: '#FED7D7', true: '#C6F6D5' }}
              thumbColor={isActive ? COLORS.vert : '#E53E3E'}
            />
          </View>

          {/* 5. CAPACITÉ & AFFLUENCE */}
          {hasSensors ? (
            <View style={styles.rowTwoCols}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>CAPACITÉ TOTALE *</Text>
                <View style={styles.inputWithIcon}>
                  <Car size={16} color="#718096" />
                  <TextInput
                    value={total}
                    onChangeText={setTotal}
                    keyboardType="numeric"
                    placeholder="200"
                    placeholderTextColor="#A0AEC0"
                    style={styles.numericInput}
                  />
                  <Text style={styles.unitText}>places</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>PLACES LIBRES (TEMPS RÉEL)</Text>
                <View style={styles.inputWithIcon}>
                  <Sliders size={16} color={COLORS.vert} />
                  <TextInput
                    value={available}
                    onChangeText={setAvailable}
                    keyboardType="numeric"
                    placeholder="120"
                    placeholderTextColor="#A0AEC0"
                    style={styles.numericInput}
                  />
                  <Text style={styles.unitText}>libres</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fieldLabel}>CAPACITÉ MAXIMALE DU PARC *</Text>
              <View style={styles.inputWithIcon}>
                <Car size={16} color="#718096" />
                <TextInput
                  value={total}
                  onChangeText={setTotal}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#A0AEC0"
                  style={styles.numericInput}
                />
                <Text style={styles.unitText}>places maximum</Text>
              </View>

              {/* Sélecteur d'affluence médiane */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                AFFLUENCE MÉDIANE CONSTATÉE
              </Text>
              <View style={styles.affluenceGrid}>
                {AFFLUENCE_OPTIONS.map((opt) => {
                  const isSelected = affluenceMediane === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setAffluenceMediane(opt.key);
                      }}
                      style={[
                        styles.affluenceOption,
                        isSelected && styles.affluenceOptionSelected,
                      ]}
                    >
                      <Text style={styles.affluenceBadgeIcon}>{opt.badge}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.affluenceOptionTitle,
                            isSelected && styles.affluenceOptionTitleSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={styles.affluenceOptionDesc}>{opt.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* 6. BORNES ÉLECTRIQUES & GRATUITÉ */}
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>BORNES ÉLEC. (IRVE)</Text>
              <View style={styles.inputWithIcon}>
                <Zap size={16} color={COLORS.or} />
                <TextInput
                  value={evSpots}
                  onChangeText={setEvSpots}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#A0AEC0"
                  style={styles.numericInput}
                />
                <Text style={styles.unitText}>bornes</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>DISTANCE INDICATIVE</Text>
              <TextInput
                value={distance}
                onChangeText={setDistance}
                placeholder="ex: 200 m"
                placeholderTextColor="#A0AEC0"
                style={styles.input}
              />
            </View>
          </View>

          {/* 7. TARIFS & FRANCHISE */}
          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>RÈGLE TARIFAIRE / GRATUITÉ</Text>
          <View style={styles.inputWithIcon}>
            <Clock size={16} color="#718096" />
            <TextInput
              value={freeGracePeriod}
              onChangeText={setFreeGracePeriod}
              placeholder="ex: 30 min gratuites, Gratuit après 19h..."
              placeholderTextColor="#A0AEC0"
              style={[styles.numericInput, { flex: 1 }]}
            />
          </View>

          {/* Raccourcis franchise */}
          <View style={styles.presetsRow}>
            {[
              '30 min gratuites',
              '1h gratuite',
              'Gratuit après 19h',
              '15 min dépose-minute',
              '100% Gratuit',
            ].map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setFreeGracePeriod(p);
                }}
                style={styles.presetChip}
              >
                <Text style={styles.presetText}>{p}</Text>
              </Pressable>
            ))}
          </View>

          {/* 8. ADRESSE & DESTINATION DU LIEN GPS */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            ADRESSE DE NAVIGATION (POUR LE GUIDAGE GPS)
          </Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={16} color={COLORS.vert} />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={`Adresse ou repère à ${cityName}...`}
              placeholderTextColor="#A0AEC0"
              style={[styles.numericInput, { flex: 1 }]}
            />
          </View>

          {/* NOTE OU CONSIGNES EN DIRECT */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>NOTE D’AFFLUENCE EN DIRECT</Text>
          <TextInput
            value={statusNote}
            onChangeText={setStatusNote}
            placeholder="ex: Accès dégagé, Travaux partiels au niveau -1..."
            placeholderTextColor="#A0AEC0"
            style={styles.input}
          />

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Pied de page avec bouton d'enregistrement */}
        <View style={styles.modalFooter}>
          <Pressable
            onPress={onClose}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={[
              styles.saveBtn,
              !name.trim() && { opacity: 0.5 },
            ]}
            disabled={!name.trim()}
          >
            <Check size={16} color={COLORS.blanc} />
            <Text style={styles.saveBtnText}>
              {parkingToEdit ? 'Enregistrer' : 'Créer le parking'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function EditParkingModal({
  visible,
  onClose,
  onSave,
  parkingToEdit,
  cityName,
}: EditParkingModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <EditParkingForm
        key={parkingToEdit ? parkingToEdit.id : 'new'}
        onClose={onClose}
        onSave={onSave}
        parkingToEdit={parkingToEdit}
        cityName={cityName}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE1',
  },
  modalSubtitle: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
    color: '#718096',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.noir,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: FONTS.montserratBold,
    color: '#4A5568',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.montserrat,
    color: COLORS.noir,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  numericInput: {
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.montserratBold,
    color: COLORS.noir,
    flex: 1,
  },
  unitText: {
    fontSize: 12,
    fontFamily: FONTS.montserrat,
    color: '#718096',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  typeCardSelected: {
    borderColor: COLORS.vert,
    backgroundColor: '#F0FFF4',
  },
  typeIcon: {
    fontSize: 18,
  },
  typeCardLabel: {
    fontSize: 12,
    fontFamily: FONTS.montserratSemiBold,
    color: '#4A5568',
  },
  typeCardLabelSelected: {
    fontFamily: FONTS.montserratBold,
    color: COLORS.vert,
  },
  sensorsSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1.5,
    borderColor: '#EDF2F7',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  sensorIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sensorsCardTitle: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: COLORS.noir,
  },
  sensorsCardDesc: {
    fontSize: 11,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginTop: 2,
    lineHeight: 15,
  },
  statusSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  statusSwitchTitle: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: COLORS.noir,
  },
  statusSwitchDesc: {
    fontSize: 11,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginTop: 2,
    lineHeight: 15,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  affluenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  affluenceOption: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  affluenceOptionSelected: {
    borderColor: COLORS.vert,
    backgroundColor: '#F0FFF4',
  },
  affluenceBadgeIcon: {
    fontSize: 16,
  },
  affluenceOptionTitle: {
    fontSize: 12,
    fontFamily: FONTS.montserratSemiBold,
    color: COLORS.noir,
  },
  affluenceOptionTitleSelected: {
    fontFamily: FONTS.montserratBold,
    color: COLORS.vert,
  },
  affluenceOptionDesc: {
    fontSize: 10,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginTop: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 11,
    fontFamily: FONTS.montserratSemiBold,
    color: '#4A5568',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE1',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONTS.montserratSemiBold,
    color: '#718096',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.vert,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: FONTS.montserratBold,
    color: COLORS.blanc,
  },
});
