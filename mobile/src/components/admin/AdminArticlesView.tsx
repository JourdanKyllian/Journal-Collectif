import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Sparkles,
  Eye,
  FileEdit,
  Archive,
  Trash2,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { EditorialArticle, EditorialStats } from '@/lib/services/editorial.service';
import SwipeableModerationCard from '@/components/admin/SwipeableModerationCard';
import AdminAlertsView from '@/components/admin/AdminAlertsView';
import EmptyState from '@/components/common/EmptyState';

export type ArticleFilterType = 'pending' | 'published' | 'drafts' | 'alerts';

interface AdminArticlesViewProps {
  stats: EditorialStats;
  activeAlertsCount: number;
  pendingArticles: EditorialArticle[];
  publishedArticles: EditorialArticle[];
  draftArticles: EditorialArticle[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onApprovePending: (article: EditorialArticle) => void;
  onRejectPending: (article: EditorialArticle) => void;
  onViewArticle: (article: EditorialArticle) => void;
  onEditArticle: (article: EditorialArticle) => void;
  onUnpublishArticle: (article: EditorialArticle) => void;
  onDeleteDraft: (id: number) => void;
}

export default function AdminArticlesView({
  stats,
  activeAlertsCount,
  pendingArticles,
  publishedArticles,
  draftArticles,
  isLoading,
  isRefreshing,
  onRefresh,
  onApprovePending,
  onRejectPending,
  onViewArticle,
  onEditArticle,
  onUnpublishArticle,
  onDeleteDraft,
}: AdminArticlesViewProps) {
  const [articleFilter, setArticleFilter] = useState<ArticleFilterType>('pending');

  const handleFilterPress = (filter: ArticleFilterType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setArticleFilter(filter);
  };

  return (
    <View style={styles.container}>
      {/* 4 Compteurs Clés : En attente | En ligne | Brouillons | Alertes */}
      <View style={styles.statsRow}>
        {/* 1. En attente */}
        <Pressable
          onPress={() => handleFilterPress('pending')}
          style={[styles.statCard, articleFilter === 'pending' && styles.statCardActive]}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#FBF0D8' }]}>
            <Clock size={14} color="#B7791F" />
          </View>
          <Text style={styles.statCount}>{stats.en_attente}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            En attente
          </Text>
        </Pressable>

        {/* 2. En ligne */}
        <Pressable
          onPress={() => handleFilterPress('published')}
          style={[styles.statCard, articleFilter === 'published' && styles.statCardActive]}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#E2F3EB' }]}>
            <CheckCircle2 size={14} color="#276749" />
          </View>
          <Text style={styles.statCount}>{stats.publie}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            En ligne
          </Text>
        </Pressable>

        {/* 3. Brouillons */}
        <Pressable
          onPress={() => handleFilterPress('drafts')}
          style={[styles.statCard, articleFilter === 'drafts' && styles.statCardActive]}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#EDE9E2' }]}>
            <FileText size={14} color="#4A5568" />
          </View>
          <Text style={styles.statCount}>{stats.brouillon}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Brouillons
          </Text>
        </Pressable>

        {/* 4. Alertes */}
        <Pressable
          onPress={() => handleFilterPress('alerts')}
          style={[styles.statCard, articleFilter === 'alerts' && styles.statCardAlertActive]}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
            <AlertTriangle size={14} color="#DC2626" />
          </View>
          <Text style={[styles.statCount, activeAlertsCount > 0 && { color: '#DC2626' }]}>
            {activeAlertsCount}
          </Text>
          <Text
            style={[styles.statLabel, activeAlertsCount > 0 && { color: '#B91C1C' }]}
            numberOfLines={1}
          >
            Alertes
          </Text>
        </Pressable>
      </View>

      {/* Contenu selon le filtre actif */}
      {isLoading && pendingArticles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.vert} />
          <Text style={styles.loadingText}>Chargement du studio...</Text>
        </View>
      ) : articleFilter === 'alerts' ? (
        <View style={{ flex: 1 }}>
          <AdminAlertsView />
        </View>
      ) : articleFilter === 'pending' ? (
        <FlatList
          data={pendingArticles}
          keyExtractor={(item) => `pending-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.moderationHeader}>
              <Sparkles size={14} color={COLORS.or} />
              <Text style={styles.moderationNotice}>
                Glissez vers la droite pour publier ou vers la gauche pour refuser
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SwipeableModerationCard
              article={item}
              onApprove={onApprovePending}
              onReject={onRejectPending}
              onEdit={onEditArticle}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={CheckCircle2}
              iconColor="#16A34A"
              title="File de modération vide"
              description="Toutes les propositions citoyennes ont été traitées !"
            />
          }
        />
      ) : articleFilter === 'published' ? (
        <FlatList
          data={publishedArticles}
          keyExtractor={(item) => `pub-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.standardCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.catBadgeSmall}>
                  <Text style={styles.catEmojiSmall}>{item.categorie?.icon || '📰'}</Text>
                  <Text style={styles.catTextSmall}>
                    {item.categorie?.libelle || 'Général'}
                  </Text>
                </View>
                <Text style={styles.publishedDateText}>
                  En ligne • {item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Récemment'}
                </Text>
              </View>

              <Text style={styles.standardTitle} numberOfLines={2}>
                {item.titre}
              </Text>
              <Text style={styles.standardExcerpt} numberOfLines={2}>
                {item.excerpt}
              </Text>

              <View style={styles.standardActionsRow}>
                <Pressable
                  onPress={() => onViewArticle(item)}
                  style={styles.actionPill}
                  hitSlop={4}
                >
                  <Eye size={13} color="#4A5568" />
                  <Text style={styles.actionPillText}>Voir</Text>
                </Pressable>

                <Pressable
                  onPress={() => onEditArticle(item)}
                  style={styles.actionPill}
                  hitSlop={4}
                >
                  <FileEdit size={13} color={COLORS.vert} />
                  <Text style={[styles.actionPillText, { color: COLORS.vert }]}>
                    Modifier
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onUnpublishArticle(item)}
                  style={[styles.actionPill, styles.actionPillDanger]}
                  hitSlop={4}
                >
                  <Archive size={13} color="#C53030" />
                  <Text style={[styles.actionPillText, { color: '#C53030' }]}>
                    Dépublier
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={CheckCircle2}
              title="Aucun article en ligne"
              description="Publiez des articles pour enrichir le journal."
            />
          }
        />
      ) : (
        <FlatList
          data={draftArticles}
          keyExtractor={(item) => `draft-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.standardCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.catBadgeSmall}>
                  <Text style={styles.catEmojiSmall}>{item.categorie?.icon || '📝'}</Text>
                  <Text style={styles.catTextSmall}>
                    {item.categorie?.libelle || 'Brouillon'}
                  </Text>
                </View>
                <Text style={styles.draftDateText}>Brouillon de rédaction</Text>
              </View>

              <Text style={styles.standardTitle} numberOfLines={2}>
                {item.titre}
              </Text>
              <Text style={styles.standardExcerpt} numberOfLines={2}>
                {item.excerpt}
              </Text>

              <View style={styles.standardActionsRow}>
                <Pressable
                  onPress={() => onEditArticle(item)}
                  style={[styles.actionPill, { backgroundColor: '#E2F3EB' }]}
                  hitSlop={4}
                >
                  <FileEdit size={13} color={COLORS.vert} />
                  <Text
                    style={[
                      styles.actionPillText,
                      { color: COLORS.vert, fontWeight: '700' },
                    ]}
                  >
                    Continuer la rédaction
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => onDeleteDraft(item.id)}
                  style={[styles.actionPill, styles.actionPillDanger]}
                  hitSlop={4}
                >
                  <Trash2 size={13} color="#C53030" />
                  <Text style={[styles.actionPillText, { color: '#C53030' }]}>
                    Supprimer
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={FileText}
              title="Aucun brouillon"
              description="Vos brouillons en cours d'écriture apparaîtront ici."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6DD',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardActive: {
    borderColor: COLORS.vert,
    backgroundColor: '#F5FAF7',
    borderWidth: 1.5,
  },
  statCardAlertActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 16,
    color: COLORS.noir,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: FONTS.montserrat,
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 50,
  },
  moderationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3ECE0',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  moderationNotice: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#6F5C34',
    flex: 1,
    lineHeight: 15,
  },
  standardCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECE0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  catEmojiSmall: {
    fontSize: 11,
  },
  catTextSmall: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.noir,
    fontWeight: '600',
  },
  publishedDateText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#276749',
    fontWeight: '600',
  },
  draftDateText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#718096',
  },
  standardTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 14,
    color: COLORS.noir,
    lineHeight: 19,
    marginBottom: 4,
  },
  standardExcerpt: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
    marginBottom: 10,
  },
  standardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    paddingTop: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
  },
  actionPillDanger: {
    backgroundColor: '#FFF5F5',
  },
  actionPillText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#4A5568',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: '#718096',
    marginTop: 10,
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
});
