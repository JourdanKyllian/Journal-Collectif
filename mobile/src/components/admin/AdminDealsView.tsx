import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Tag, Clock, Trash2 } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { BonPlan } from '@/lib/services/deals.service';
import AddDealModal from '@/components/admin/AddDealModal';
import EmptyState from '@/components/common/EmptyState';

interface AdminDealsViewProps {
  deals: BonPlan[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleDealStatus: (id: number) => void;
  onDeleteDeal: (id: number, titre: string) => void;
  onSaveNewDeal: (dealData: Omit<BonPlan, 'id'>) => void;
  cityName: string;
  isAddModalVisible: boolean;
  onCloseAddModal: () => void;
  onOpenAddModal: () => void;
}

export default function AdminDealsView({
  deals,
  isRefreshing,
  onRefresh,
  onToggleDealStatus,
  onDeleteDeal,
  onSaveNewDeal,
  cityName,
  isAddModalVisible,
  onCloseAddModal,
  onOpenAddModal,
}: AdminDealsViewProps) {
  const activeCount = deals.filter((d) => d.statut === 'actif').length;
  const partnersCount = new Set(deals.map((d) => d.partenaire)).size;

  return (
    <View style={styles.container}>
      {/* Statistiques des offres */}
      <View style={styles.statsRow}>
        <View style={styles.statCardStatic}>
          <Text style={styles.statCountStatic}>{deals.length}</Text>
          <Text style={styles.statLabelStatic}>Total Offres</Text>
        </View>

        <View style={styles.statCardStatic}>
          <Text style={[styles.statCountStatic, { color: '#276749' }]}>{activeCount}</Text>
          <Text style={styles.statLabelStatic}>Actifs en direct</Text>
        </View>

        <View style={styles.statCardStatic}>
          <Text style={[styles.statCountStatic, { color: '#B7791F' }]}>{partnersCount}</Text>
          <Text style={styles.statLabelStatic}>Partenaires</Text>
        </View>
      </View>

      {/* Liste des bons plans */}
      <FlatList
        data={deals}
        keyExtractor={(item) => `deal-${item.id}`}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isActive = item.statut === 'actif';
          const isScheduled = item.statut === 'programme';

          return (
            <View style={styles.dealAdminCard}>
              <View style={styles.dealAdminHeader}>
                <View style={styles.dealBadgeRow}>
                  <View style={[styles.catBadgeSmall, { backgroundColor: '#F0EBE1' }]}>
                    <Text style={styles.catTextSmall}>{item.categorie.toUpperCase()}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isActive
                        ? styles.statusBadgeActive
                        : isScheduled
                          ? styles.statusBadgeScheduled
                          : styles.statusBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isActive
                          ? styles.statusBadgeTextActive
                          : isScheduled
                            ? styles.statusBadgeTextScheduled
                            : styles.statusBadgeTextInactive,
                      ]}
                    >
                      {isActive ? 'Actif' : isScheduled ? '🗓️ Programmé' : 'Mis en pause'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.dealValueBadge}>{item.valeur}</Text>
              </View>

              <Text style={styles.dealAdminTitle}>{item.titre}</Text>
              <Text style={styles.dealAdminPartner}>
                Partenaire : <Text style={{ color: COLORS.noir }}>{item.partenaire}</Text>
              </Text>

              {item.codePromo && (
                <Text style={styles.dealAdminCode}>
                  Code promo : <Text style={styles.codeTextHighlight}>{item.codePromo}</Text>
                </Text>
              )}

              <View style={styles.dealAdminDatesRow}>
                <Clock size={12} color="#718096" />
                <Text style={styles.dealAdminDatesText}>
                  {item.dateDebut
                    ? `Diffusion : Du ${item.dateDebut} au ${item.dateFin}`
                    : `Fin de validité : ${item.dateFin}`}
                </Text>
              </View>

              <View style={styles.dealAdminActions}>
                <Pressable
                  onPress={() => onToggleDealStatus(item.id)}
                  style={[
                    styles.dealActionBtn,
                    isActive ? styles.dealActionBtnPause : styles.dealActionBtnPlay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dealActionBtnText,
                      isActive ? { color: '#744210' } : { color: '#22543D' },
                    ]}
                  >
                    {isActive
                      ? 'Mettre en pause'
                      : isScheduled
                        ? 'Publier maintenant'
                        : 'Activer l’offre'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onDeleteDeal(item.id, item.titre)}
                  style={styles.dealDeleteBtn}
                  hitSlop={8}
                >
                  <Trash2 size={15} color="#C53030" />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Tag}
            title="Aucun bon plan"
            description="Ajoutez votre première offre pour les citoyens de votre commune."
            actionLabel="Créer une offre"
            onAction={onOpenAddModal}
          />
        }
      />

      {/* Modal convivial d'ajout de bon plan */}
      <AddDealModal
        visible={isAddModalVisible}
        onClose={onCloseAddModal}
        onSave={onSaveNewDeal}
        cityName={cityName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  statCardStatic: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6DD',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statCountStatic: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 20,
    color: COLORS.noir,
    lineHeight: 24,
  },
  statLabelStatic: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 50,
  },
  dealAdminCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  dealAdminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dealBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadgeSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  catTextSmall: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.noir,
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#E2F3EB',
  },
  statusBadgeScheduled: {
    backgroundColor: '#EBF8FF',
  },
  statusBadgeInactive: {
    backgroundColor: '#EDF2F7',
  },
  statusBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#276749',
  },
  statusBadgeTextScheduled: {
    color: '#2B6CB0',
  },
  statusBadgeTextInactive: {
    color: '#718096',
  },
  dealValueBadge: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 13,
    color: COLORS.vert,
  },
  dealAdminTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 15,
    color: COLORS.noir,
    lineHeight: 20,
    marginBottom: 4,
  },
  dealAdminPartner: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  dealAdminCode: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
  },
  codeTextHighlight: {
    fontFamily: FONTS.montserratSemiBold,
    color: COLORS.vert,
    fontWeight: '700',
  },
  dealAdminDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dealAdminDatesText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#718096',
  },
  dealAdminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    paddingTop: 10,
  },
  dealActionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dealActionBtnPause: {
    backgroundColor: '#FEFCBF',
  },
  dealActionBtnPlay: {
    backgroundColor: '#C6F6D5',
  },
  dealActionBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    fontWeight: '700',
  },
  dealDeleteBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 16,
    color: COLORS.noir,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  createBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    fontWeight: '700',
  },
});

