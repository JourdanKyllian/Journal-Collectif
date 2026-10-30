import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Ticket,
  Gift,
  Tag,
  Utensils,
  Store,
  Calendar,
  Clock,
  KeyRound,
  ExternalLink,
  Check,
  Zap,
  CalendarClock,
  PauseCircle,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { BonPlan, DealCategory } from '@/lib/services/deals.service';

interface AddDealModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (deal: Omit<BonPlan, 'id'>) => void;
  cityName: string;
}

interface CategoryOption {
  id: DealCategory;
  label: string;
  icon: typeof Ticket;
  emoji: string;
  defaultBadge: string;
  placeholderTitle: string;
  defaultImage: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'code_promo',
    label: 'Code Promo',
    icon: Tag,
    emoji: '🏷️',
    defaultBadge: '-15%',
    placeholderTitle: 'Ex: -15% sur tout le magasin dès 20€...',
    defaultImage:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'billetterie',
    label: 'Billetterie',
    icon: Ticket,
    emoji: '🎟️',
    defaultBadge: '-20%',
    placeholderTitle: 'Ex: Tarif riverain sur la billetterie...',
    defaultImage:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'concours',
    label: 'Jeu Concours',
    icon: Gift,
    emoji: '🎁',
    defaultBadge: 'Jeu Concours',
    placeholderTitle: 'Ex: Gagnez 2 places VIP pour le festival...',
    defaultImage:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'restauration',
    label: 'Sortie & Resto',
    icon: Utensils,
    emoji: '🍽️',
    defaultBadge: '1 Offert',
    placeholderTitle: 'Ex: Un café ou dessert offert pour tout repas...',
    defaultImage:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
  },
];

const VALUE_SUGGESTIONS = [
  '-15%',
  '-20%',
  '-30%',
  '-50%',
  '1 Offert',
  'Gratuit',
  'Jeu Concours',
  'Tarif Réduit',
];

type PublishingMode = 'immediat' | 'programme' | 'pause';

export default function AddDealModal({
  visible,
  onClose,
  onSave,
  cityName,
}: AddDealModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<DealCategory>('code_promo');
  const [titre, setTitre] = useState('');
  const [partenaire, setPartenaire] = useState('');
  const [valeur, setValeur] = useState('-15%');
  const [description, setDescription] = useState('');
  const [codePromo, setCodePromo] = useState('');
  const [lienUrl, setLienUrl] = useState('');

  // GESTION DU CALENDRIER (Mise en ligne & Expiration)
  const [publishingMode, setPublishingMode] = useState<PublishingMode>('immediat');
  const [dateDebut, setDateDebut] = useState('05 nov. 2026');
  const [heureDebut, setHeureDebut] = useState('09:00');

  const [dateFin, setDateFin] = useState('31 déc. 2026');
  const [heureFin, setHeureFin] = useState('23:59');

  const [estExclusif, setEstExclusif] = useState(true);
  const [conditions, setConditions] = useState(
    'Sur présentation de l’application en caisse.'
  );

  const currentCategoryConfig =
    CATEGORY_OPTIONS.find((c) => c.id === selectedCategory) || CATEGORY_OPTIONS[0];

  const handleSelectCategory = (cat: CategoryOption) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedCategory(cat.id);
    if (!valeur || VALUE_SUGGESTIONS.includes(valeur)) {
      setValeur(cat.defaultBadge);
    }
  };

  const handleSelectValueSuggestion = (sug: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setValeur(sug);
  };

  const handleSelectPublishingMode = (mode: PublishingMode) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setPublishingMode(mode);
  };

  // Raccourcis de dates
  const formatDateOffset = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const months = [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleSave = () => {
    if (!titre.trim() || !partenaire.trim()) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const finalDateFin = `${dateFin.trim()} à ${heureFin.trim() || '23:59'}`;
    const finalDateDebut =
      publishingMode === 'programme'
        ? `${dateDebut.trim()} à ${heureDebut.trim() || '09:00'}`
        : undefined;

    const statut: 'actif' | 'programme' | 'expire' =
      publishingMode === 'programme'
        ? 'programme'
        : publishingMode === 'immediat'
        ? 'actif'
        : 'expire';

    onSave({
      titre: titre.trim(),
      partenaire: partenaire.trim(),
      valeur: valeur.trim() || currentCategoryConfig.defaultBadge,
      description:
        description.trim() ||
        `Offre réservée aux résidents de ${cityName} avec l’application Journal Collectif.`,
      categorie: selectedCategory,
      codePromo: codePromo.trim() ? codePromo.trim().toUpperCase() : undefined,
      lienUrl: lienUrl.trim() || undefined,
      dateDebut: finalDateDebut,
      dateFin: finalDateFin,
      estExclusif,
      statut,
      conditions: conditions.trim() || undefined,
      image: currentCategoryConfig.defaultImage,
    });

    // Réinitialisation
    setTitre('');
    setPartenaire('');
    setDescription('');
    setCodePromo('');
    setLienUrl('');
    setPublishingMode('immediat');
    onClose();
  };

  const isValid = titre.trim().length > 0 && partenaire.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.container}>
          {/* BARRE SUPÉRIEURE DE NAVIGATION */}
          <View style={styles.navBar}>
            <Pressable
              onPress={onClose}
              style={styles.navCancelBtn}
              hitSlop={10}
            >
              <Text style={styles.navCancelText}>Annuler</Text>
            </Pressable>

            <View style={styles.navTitleBox}>
              <Text style={styles.navSubtitle}>COMMERCE & BONS PLANS</Text>
              <Text style={styles.navTitle}>Nouveau Bon Plan</Text>
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={[styles.navSaveBtn, !isValid && styles.navSaveBtnDisabled]}
              hitSlop={10}
            >
              <Text
                style={[
                  styles.navSaveText,
                  !isValid && styles.navSaveTextDisabled,
                ]}
              >
                Créer
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. CHOIX DE LA CATÉGORIE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TYPE DE BON PLAN</Text>
              <View style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => handleSelectCategory(cat)}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryIconCircle,
                          isSelected && styles.categoryIconCircleSelected,
                        ]}
                      >
                        <Icon
                          size={18}
                          color={isSelected ? COLORS.noir : COLORS.vert}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryCardTitle,
                          isSelected && styles.categoryCardTitleSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                      <Text style={styles.categoryCardEmoji}>{cat.emoji}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. DIFFUSION & MISE EN LIGNE (MANUELLE OU PROGRAMMÉE) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MODE DE MISE EN LIGNE</Text>

              <View style={styles.modeSelectorRow}>
                <Pressable
                  onPress={() => handleSelectPublishingMode('immediat')}
                  style={[
                    styles.modeOption,
                    publishingMode === 'immediat' && styles.modeOptionActive,
                  ]}
                >
                  <Zap
                    size={14}
                    color={publishingMode === 'immediat' ? COLORS.noir : '#718096'}
                  />
                  <Text
                    style={[
                      styles.modeOptionText,
                      publishingMode === 'immediat' && styles.modeOptionTextActive,
                    ]}
                  >
                    Immédiate
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectPublishingMode('programme')}
                  style={[
                    styles.modeOption,
                    publishingMode === 'programme' && styles.modeOptionActive,
                  ]}
                >
                  <CalendarClock
                    size={14}
                    color={publishingMode === 'programme' ? COLORS.noir : '#718096'}
                  />
                  <Text
                    style={[
                      styles.modeOptionText,
                      publishingMode === 'programme' && styles.modeOptionTextActive,
                    ]}
                  >
                    Programmée
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectPublishingMode('pause')}
                  style={[
                    styles.modeOption,
                    publishingMode === 'pause' && styles.modeOptionActive,
                  ]}
                >
                  <PauseCircle
                    size={14}
                    color={publishingMode === 'pause' ? COLORS.noir : '#718096'}
                  />
                  <Text
                    style={[
                      styles.modeOptionText,
                      publishingMode === 'pause' && styles.modeOptionTextActive,
                    ]}
                  >
                    En pause
                  </Text>
                </Pressable>
              </View>

              {/* SI PROGRAMMÉE : CALENDRIER DE DÉBUT */}
              {publishingMode === 'programme' && (
                <View style={styles.calendarSubBox}>
                  <View style={styles.subBoxHeader}>
                    <CalendarClock size={15} color={COLORS.or} />
                    <Text style={styles.subBoxTitle}>Lancement programmé</Text>
                  </View>

                  <View style={styles.dateHourRow}>
                    <View style={{ flex: 1.6 }}>
                      <Text style={styles.miniLabel}>Date de lancement</Text>
                      <View style={styles.inputWithIconSmall}>
                        <Calendar size={14} color="#718096" style={{ marginRight: 6 }} />
                        <TextInput
                          value={dateDebut}
                          onChangeText={setDateDebut}
                          placeholder="Ex: 05 nov. 2026"
                          placeholderTextColor="#A0AEC0"
                          style={styles.smallInput}
                        />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniLabel}>Heure précise</Text>
                      <View style={styles.inputWithIconSmall}>
                        <Clock size={14} color="#718096" style={{ marginRight: 6 }} />
                        <TextInput
                          value={heureDebut}
                          onChangeText={setHeureDebut}
                          placeholder="09:00"
                          placeholderTextColor="#A0AEC0"
                          style={styles.smallInput}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Raccourcis date de début */}
                  <View style={styles.quickChipsRow}>
                    <Pressable
                      onPress={() => setDateDebut(formatDateOffset(1))}
                      style={styles.quickChip}
                    >
                      <Text style={styles.quickChipText}>Demain</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setDateDebut(formatDateOffset(3))}
                      style={styles.quickChip}
                    >
                      <Text style={styles.quickChipText}>Dans 3 jours</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setHeureDebut('08:00')}
                      style={styles.quickChip}
                    >
                      <Text style={styles.quickChipText}>08h00</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setHeureDebut('12:00')}
                      style={styles.quickChip}
                    >
                      <Text style={styles.quickChipText}>12h00</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* 3. FIN DE VALIDITÉ & HEURE D'EXPIRATION */}
            <View style={styles.section}>
              <View style={styles.labelWithHint}>
                <Text style={styles.sectionLabel}>FIN DE VALIDITÉ & EXPIRATION *</Text>
                <Text style={styles.hintText}>Date et heure de clôture</Text>
              </View>

              <View style={styles.dateHourRow}>
                <View style={{ flex: 1.6 }}>
                  <Text style={styles.miniLabel}>Date de clôture</Text>
                  <View style={styles.inputWithIconSmall}>
                    <Calendar size={14} color="#718096" style={{ marginRight: 6 }} />
                    <TextInput
                      value={dateFin}
                      onChangeText={setDateFin}
                      placeholder="Ex: 31 déc. 2026"
                      placeholderTextColor="#A0AEC0"
                      style={styles.smallInput}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Heure de fin</Text>
                  <View style={styles.inputWithIconSmall}>
                    <Clock size={14} color="#718096" style={{ marginRight: 6 }} />
                    <TextInput
                      value={heureFin}
                      onChangeText={setHeureFin}
                      placeholder="23:59"
                      placeholderTextColor="#A0AEC0"
                      style={styles.smallInput}
                    />
                  </View>
                </View>
              </View>

              {/* Raccourcis de durée de fin */}
              <View style={styles.quickChipsRow}>
                <Pressable
                  onPress={() => setDateFin(formatDateOffset(7))}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>+ 7 jours</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDateFin(formatDateOffset(30))}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>+ 1 mois</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDateFin('31 déc. 2026')}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>Fin d&apos;année</Text>
                </Pressable>
                <Pressable
                  onPress={() => setHeureFin('23:59')}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>23h59</Text>
                </Pressable>
                <Pressable
                  onPress={() => setHeureFin('19:00')}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>19h00</Text>
                </Pressable>
              </View>

              {/* BANDEAU SYNTHÈSE TEMPS RÉEL */}
              <View style={styles.scheduleSummaryBox}>
                <View
                  style={[
                    styles.summaryDot,
                    {
                      backgroundColor:
                        publishingMode === 'immediat'
                          ? '#2E7D32'
                          : publishingMode === 'programme'
                          ? COLORS.or
                          : '#C05621',
                    },
                  ]}
                />
                <Text style={styles.scheduleSummaryText} numberOfLines={2}>
                  {publishingMode === 'immediat' && (
                    <>
                      <Text style={{ fontWeight: '700' }}>En ligne immédiatement</Text> jusqu’au{' '}
                      {dateFin} à {heureFin}
                    </>
                  )}
                  {publishingMode === 'programme' && (
                    <>
                      <Text style={{ fontWeight: '700' }}>Programmé :</Text> diffusion du{' '}
                      {dateDebut} à {heureDebut} au {dateFin} à {heureFin}
                    </>
                  )}
                  {publishingMode === 'pause' && (
                    <>
                      <Text style={{ fontWeight: '700' }}>En pause (Brouillon) :</Text> expirera
                      le {dateFin} à {heureFin} si activé
                    </>
                  )}
                </Text>
              </View>
            </View>

            {/* 4. TITRE DE L'OFFRE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TITRE DE L&apos;OFFRE *</Text>
              <TextInput
                value={titre}
                onChangeText={setTitre}
                placeholder={currentCategoryConfig.placeholderTitle}
                placeholderTextColor="#A0AEC0"
                style={styles.textInput}
              />
            </View>

            {/* 5. PARTENAIRE & COMMERCE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ENSEIGNE OU PARTENAIRE *</Text>
              <View style={styles.inputWithIcon}>
                <Store size={16} color="#718096" style={styles.leftInputIcon} />
                <TextInput
                  value={partenaire}
                  onChangeText={setPartenaire}
                  placeholder="Ex: Librairie des Halles, Cinéma Municipal..."
                  placeholderTextColor="#A0AEC0"
                  style={styles.textInputWithIcon}
                />
              </View>
            </View>

            {/* 6. VALEUR MISE EN AVANT (TAG VISUEL) */}
            <View style={styles.section}>
              <View style={styles.labelWithHint}>
                <Text style={styles.sectionLabel}>TAG DE VALEUR EN AVANT</Text>
                <Text style={styles.hintText}>Apparaît en badge sur la carte</Text>
              </View>
              <TextInput
                value={valeur}
                onChangeText={setValeur}
                placeholder="Ex: -20%, 1 Offert, Jeu Concours..."
                placeholderTextColor="#A0AEC0"
                style={styles.textInput}
              />

              {/* Suggestions rapides en 1 tap */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
              >
                {VALUE_SUGGESTIONS.map((sug) => {
                  const isSugSelected = valeur === sug;
                  return (
                    <Pressable
                      key={sug}
                      onPress={() => handleSelectValueSuggestion(sug)}
                      style={[
                        styles.suggestionPill,
                        isSugSelected && styles.suggestionPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.suggestionPillText,
                          isSugSelected && styles.suggestionPillTextActive,
                        ]}
                      >
                        {sug}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 7. CHAMPS SPÉCIFIQUES SELON LA CATÉGORIE */}
            {selectedCategory === 'code_promo' && (
              <View style={styles.section}>
                <View style={styles.labelWithHint}>
                  <Text style={styles.sectionLabel}>CODE PROMO À APPLIQUER</Text>
                  <Text style={styles.hintText}>Copié en 1 clic par le lecteur</Text>
                </View>
                <View style={styles.inputWithIcon}>
                  <KeyRound size={16} color={COLORS.vert} style={styles.leftInputIcon} />
                  <TextInput
                    value={codePromo}
                    onChangeText={setCodePromo}
                    placeholder="Ex: COLLECTIF20"
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="characters"
                    style={[styles.textInputWithIcon, styles.codePromoInput]}
                  />
                </View>
              </View>
            )}

            {(selectedCategory === 'billetterie' ||
              selectedCategory === 'concours') && (
              <View style={styles.section}>
                <View style={styles.labelWithHint}>
                  <Text style={styles.sectionLabel}>
                    {selectedCategory === 'concours'
                      ? 'LIEN DU RÈGLEMENT OU DU JEU (OPTIONNEL)'
                      : 'LIEN DE RÉSERVATION OU BILLETTERIE'}
                  </Text>
                </View>
                <View style={styles.inputWithIcon}>
                  <ExternalLink size={16} color="#718096" style={styles.leftInputIcon} />
                  <TextInput
                    value={lienUrl}
                    onChangeText={setLienUrl}
                    placeholder="Ex: https://billetterie-spectacles.fr"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="url"
                    autoCapitalize="none"
                    style={styles.textInputWithIcon}
                  />
                </View>
              </View>
            )}

            {/* 8. DESCRIPTION DÉTAILLÉE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DESCRIPTION DE L&apos;OFFRE</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Expliquez ce dont bénéficie le citoyen et comment en profiter..."
                placeholderTextColor="#A0AEC0"
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textAreaInput]}
              />
            </View>

            {/* 9. SWITCH EXCLUSIVITÉ CITOYENNE */}
            <View style={styles.switchCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={styles.switchTitleRow}>
                  <Sparkles size={14} color={COLORS.or} />
                  <Text style={styles.switchTitle}>Exclusivité Citoyenne</Text>
                </View>
                <Text style={styles.switchDesc}>
                  Affiche l&apos;étoile dorée « Exclusivité » pour valoriser l&apos;avantage auprès des lecteurs.
                </Text>
              </View>
              <Switch
                value={estExclusif}
                onValueChange={(val) => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setEstExclusif(val);
                }}
                trackColor={{ false: '#CBD5E0', true: COLORS.or }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : estExclusif ? COLORS.noir : '#F4F3F4'}
              />
            </View>

            {/* 10. CONDITIONS D'UTILISATION */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONDITIONS PARTICULIÈRES (OPTIONNEL)</Text>
              <TextInput
                value={conditions}
                onChangeText={setConditions}
                placeholder="Ex: Valable du mardi au vendredi, non cumulable..."
                placeholderTextColor="#A0AEC0"
                style={styles.textInput}
              />
            </View>

            {/* BOUTON D'ENREGISTREMENT INFÉRIEUR */}
            <Pressable
              onPress={handleSave}
              disabled={!isValid}
              style={[styles.bottomSaveBtn, !isValid && styles.bottomSaveBtnDisabled]}
            >
              <Check size={18} color={isValid ? COLORS.noir : '#A0AEC0'} />
              <Text
                style={[
                  styles.bottomSaveBtnText,
                  !isValid && styles.bottomSaveBtnTextDisabled,
                ]}
              >
                {publishingMode === 'immediat'
                  ? 'Publier le bon plan'
                  : publishingMode === 'programme'
                  ? 'Programmer le bon plan'
                  : 'Enregistrer en pause'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DE',
    backgroundColor: '#FFFFFF',
  },
  navCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navCancelText: {
    fontFamily: FONTS.montserrat,
    fontSize: 15,
    color: '#718096',
  },
  navTitleBox: {
    alignItems: 'center',
  },
  navSubtitle: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 9,
    color: COLORS.or,
    letterSpacing: 1,
  },
  navTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 16,
    color: COLORS.noir,
    marginTop: 1,
  },
  navSaveBtn: {
    backgroundColor: COLORS.or,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  navSaveBtnDisabled: {
    backgroundColor: '#EDF2F7',
  },
  navSaveText: {
    fontFamily: FONTS.montserratBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  navSaveTextDisabled: {
    color: '#A0AEC0',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
  },
  section: {
    gap: 7,
  },
  sectionLabel: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.8,
  },
  labelWithHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#A0AEC0',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCardSelected: {
    borderColor: COLORS.vert,
    backgroundColor: '#EAF4EE',
    borderWidth: 1.5,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconCircleSelected: {
    backgroundColor: COLORS.or,
  },
  categoryCardTitle: {
    flex: 1,
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#4A5568',
  },
  categoryCardTitleSelected: {
    color: COLORS.noir,
    fontWeight: '700',
  },
  categoryCardEmoji: {
    fontSize: 14,
  },
  modeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    padding: 3,
    borderRadius: 12,
    gap: 4,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  modeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeOptionText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#718096',
  },
  modeOptionTextActive: {
    color: COLORS.noir,
    fontWeight: '700',
  },
  calendarSubBox: {
    backgroundColor: '#FDFCF9',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    gap: 10,
  },
  subBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBoxTitle: {
    fontFamily: FONTS.montserratBold,
    fontSize: 12,
    color: '#8C6C2D',
  },
  dateHourRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#718096',
    marginBottom: 4,
  },
  inputWithIconSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  smallInput: {
    flex: 1,
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: COLORS.noir,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickChipText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#4A5568',
  },
  scheduleSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scheduleSummaryText: {
    flex: 1,
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#4A5568',
    lineHeight: 16,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  switchTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  switchDesc: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FONTS.montserrat,
    fontSize: 14,
    color: COLORS.noir,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  leftInputIcon: {
    marginRight: 8,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: FONTS.montserrat,
    fontSize: 14,
    color: COLORS.noir,
  },
  codePromoInput: {
    fontFamily: FONTS.poppinsBold,
    letterSpacing: 1,
    color: COLORS.vert,
  },
  textAreaInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  suggestionsRow: {
    paddingVertical: 6,
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
  },
  suggestionPillActive: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  suggestionPillText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#4A5568',
  },
  suggestionPillTextActive: {
    color: COLORS.blanc,
  },
  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.or,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomSaveBtnDisabled: {
    backgroundColor: '#EDF2F7',
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomSaveBtnText: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 15,
    color: COLORS.noir,
  },
  bottomSaveBtnTextDisabled: {
    color: '#A0AEC0',
  },
});
