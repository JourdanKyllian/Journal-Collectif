import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import {
  AlertTriangle,
  Info,
  Flame,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  X,
  Radio,
  Megaphone,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { AlertsService, AlertItem, AlertType } from '@/lib/services/alerts.service';

const TYPE_CONFIG: Record<
  AlertType,
  { label: string; bg: string; text: string; icon: typeof AlertTriangle; border: string }
> = {
  urgent: {
    label: 'Urgence absolue',
    bg: '#FEE2E2',
    text: '#DC2626',
    border: '#F87171',
    icon: Flame,
  },
  warning: {
    label: 'Vigilance / Attention',
    bg: '#FEF3C7',
    text: '#D97706',
    border: '#FBBF24',
    icon: AlertTriangle,
  },
  info: {
    label: 'Information municipale',
    bg: '#DBEAFE',
    text: '#2563EB',
    border: '#93C5FD',
    icon: Info,
  },
  event: {
    label: 'Événement local',
    bg: '#E0E7FF',
    text: '#4F46E5',
    border: '#A5B4FC',
    icon: Radio,
  },
};

export default function AdminAlertsView() {
  const [alerts, setAlerts] = useState<AlertItem[]>(() => AlertsService.getAlerts());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Formulaire d'alerte
  const [formType, setFormType] = useState<AlertType>('warning');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  useEffect(() => {
    return AlertsService.subscribe((updated) => {
      setAlerts(updated);
    });
  }, []);

  const activeAlerts = alerts.filter((a) => a.isActive);

  const handleOpenCreateModal = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(null);
    setFormType('warning');
    setFormTitle('');
    setFormMessage('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (alertItem: AlertItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(alertItem.id);
    setFormType(alertItem.type);
    setFormTitle(alertItem.title);
    setFormMessage(alertItem.message);
    setFormStartDate(alertItem.startDate ?? '');
    setFormEndDate(alertItem.endDate ?? '');
    setIsModalVisible(true);
  };

  const handleToggleActive = async (id: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    await AlertsService.toggleActive(id);
    Toast.show({
      type: 'success',
      text1: 'Statut du bandeau mis à jour',
      visibilityTime: 1800,
    });
  };

  const handleDelete = (id: number, title: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Supprimer l’alerte',
      `Êtes-vous sûr de vouloir retirer définitivement l’alerte « ${title} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await AlertsService.deleteAlert(id);
            Toast.show({
              type: 'info',
              text1: 'Alerte supprimée',
            });
          },
        },
      ]
    );
  };

  const handleSaveAlert = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Champs obligatoires',
        text2: 'Veuillez renseigner au minimum un titre et un message.',
      });
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingId) {
      await AlertsService.updateAlert(editingId, {
        type: formType,
        title: formTitle.trim(),
        message: formMessage.trim(),
        startDate: formStartDate || null,
        endDate: formEndDate || null,
      });
      Toast.show({
        type: 'success',
        text1: 'Alerte modifiée avec succès',
      });
    } else {
      await AlertsService.createAlert({
        type: formType,
        title: formTitle.trim(),
        message: formMessage.trim(),
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        isActive: true,
      });
      Toast.show({
        type: 'success',
        text1: 'Alerte publiée en ligne',
        text2: 'Le bandeau est actif sur l’application et le site.',
      });
    }

    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Bannière récapitulative de statut d'urgence */}
      <View
        style={[
          styles.statusCard,
          activeAlerts.length > 0 ? styles.statusCardAlert : styles.statusCardCalm,
        ]}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusBadgeRow}>
            {activeAlerts.length > 0 ? (
              <>
                <View style={styles.pulseDot} />
                <Text style={styles.statusTitleAlert}>
                  {activeAlerts.length} {activeAlerts.length > 1 ? 'Alertes actives' : 'Alerte active'}
                </Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} color="#16A34A" />
                <Text style={styles.statusTitleCalm}>Aucune alerte active (Situation normale)</Text>
              </>
            )}
          </View>

          <Pressable
            onPress={handleOpenCreateModal}
            style={styles.createBtn}
            hitSlop={6}
          >
            <Plus size={15} color={COLORS.blanc} strokeWidth={2.8} />
            <Text style={styles.createBtnText}>Nouvelle alerte</Text>
          </Pressable>
        </View>

        <Text style={styles.statusDesc}>
          {activeAlerts.length > 0
            ? 'Les alertes actives défilent en temps réel sur le bandeau supérieur de l’application citoyenne.'
            : 'Créez une alerte pour informer immédiatement les citoyens d’intempéries, de travaux majeurs ou d’urgences.'}
        </Text>
      </View>

      {/* Liste des alertes */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>
          Toutes les alertes enregistrées ({alerts.length})
        </Text>

        {alerts.map((item) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
          const IconComp = config.icon;

          return (
            <View
              key={item.id}
              style={[
                styles.alertCard,
                item.isActive && { borderColor: config.border },
              ]}
            >
              {/* Entête de carte : Type + Switch ON/OFF */}
              <View style={styles.cardTopRow}>
                <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                  <IconComp size={12} color={config.text} strokeWidth={2.4} />
                  <Text style={[styles.typeBadgeText, { color: config.text }]}>
                    {config.label}
                  </Text>
                </View>

                <View style={styles.switchRow}>
                  <Text
                    style={[
                      styles.switchLabel,
                      item.isActive ? styles.switchLabelActive : styles.switchLabelInactive,
                    ]}
                  >
                    {item.isActive ? 'En ligne' : 'Masquée'}
                  </Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleActive(item.id)}
                    trackColor={{ false: '#CBD5E1', true: COLORS.vert }}
                    thumbColor={COLORS.blanc}
                    ios_backgroundColor="#CBD5E1"
                  />
                </View>
              </View>

              {/* Titre & Message */}
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertMessage}>{item.message}</Text>

              {/* Période de validité */}
              <View style={styles.dateRow}>
                <Calendar size={13} color="#94A3B8" />
                <Text style={styles.dateText}>
                  {item.startDate ? `Du ${item.startDate}` : 'Immédiate'}
                  {item.endDate ? ` au ${item.endDate}` : ' (Permanente)'}
                </Text>
              </View>

              {/* Actions carte */}
              <View style={styles.cardActionsRow}>
                <Pressable
                  onPress={() => handleOpenEditModal(item)}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>Modifier</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(item.id, item.title)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Trash2 size={15} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modale d'ajout / modification d'une alerte */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Modifier l’alerte' : 'Diffuser une alerte'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Bandeau d’information pour les résidents
              </Text>
            </View>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              style={styles.closeBtn}
            >
              <X size={20} color={COLORS.noir} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Choix du niveau d'urgence */}
            <Text style={styles.inputLabel}>NIVEAU DE L’ALERTE *</Text>
            <View style={styles.typeSelectorRow}>
              {(['urgent', 'warning', 'info'] as AlertType[]).map((t) => {
                const conf = TYPE_CONFIG[t];
                const isSelected = formType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setFormType(t);
                    }}
                    style={[
                      styles.typeSelectorChip,
                      isSelected && { backgroundColor: conf.bg, borderColor: conf.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorChipText,
                        isSelected && { color: conf.text, fontWeight: '700' },
                      ]}
                    >
                      {t === 'urgent' ? '🔴 Urgence' : t === 'warning' ? '🟠 Attention' : '🔵 Info'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Titre */}
            <Text style={styles.inputLabel}>TITRE DU BANDEAU *</Text>
            <TextInput
              style={styles.textInput}
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="Ex : Fermeture quai sud suite inondation"
              placeholderTextColor="#94A3B8"
            />

            {/* Message détaillé */}
            <Text style={styles.inputLabel}>MESSAGE COMPLET *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formMessage}
              onChangeText={setFormMessage}
              placeholder="Explications complètes, déviations et consignes pour les habitants..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />

            {/* Dates de diffusion */}
            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>DATE DE DÉBUT</Text>
                <TextInput
                  style={styles.textInput}
                  value={formStartDate}
                  onChangeText={setFormStartDate}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>DATE DE FIN (EXPIRATION)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formEndDate}
                  onChangeText={setFormEndDate}
                  placeholder="AAAA-MM-JJ (optionnel)"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Aperçu en direct */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>APERÇU DU BANDEAU CITOYEN</Text>
            <View
              style={[
                styles.previewBanner,
                { backgroundColor: TYPE_CONFIG[formType].bg, borderColor: TYPE_CONFIG[formType].border },
              ]}
            >
              <Megaphone size={16} color={TYPE_CONFIG[formType].text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewTitle, { color: TYPE_CONFIG[formType].text }]}>
                  {formTitle || 'Titre de l’alerte'}
                </Text>
                <Text style={styles.previewMessage} numberOfLines={2}>
                  {formMessage || 'Le texte du message apparaîtra ici...'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer modale */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveAlert}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>
                {editingId ? 'Enregistrer les modifications' : 'Diffuser l’alerte'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  statusCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusCardAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusCardCalm: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  statusTitleAlert: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 14,
    color: '#991B1B',
  },
  statusTitleCalm: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 13,
    color: '#166534',
  },
  statusDesc: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.vert,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  createBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: COLORS.blanc,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
    gap: 12,
  },
  sectionHeader: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  alertCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    fontWeight: '600',
  },
  switchLabelActive: {
    color: '#16A34A',
  },
  switchLabelInactive: {
    color: '#94A3B8',
  },
  alertTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 15,
    color: COLORS.noir,
    marginBottom: 4,
  },
  alertMessage: {
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#94A3B8',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  editBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#334155',
  },
  deleteBtn: {
    padding: 6,
  },
  // Modale
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 18,
    color: COLORS.noir,
  },
  modalSubtitle: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeSelectorChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeSelectorChipText: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#64748B',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: COLORS.noir,
    marginBottom: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
  },
  previewTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 13,
  },
  previewMessage: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.vert,
  },
  submitBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.blanc,
    fontWeight: '700',
  },
});
