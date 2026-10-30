import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Landmark,
  Eye,
  FileEdit,
  Archive,
  Trash2,
  Sparkles,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { useCity } from '@/context/CityContext';
import {
  EditorialService,
  EditorialArticle,
  EditorialStats,
} from '@/lib/services/editorial.service';
import SwipeableModerationCard from '@/components/admin/SwipeableModerationCard';

export default function MobileAdminDashboardScreen() {
  const { currentCity } = useCity();

  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'drafts'>('pending');
  const [pendingArticles, setPendingArticles] = useState<EditorialArticle[]>([]);
  const [publishedArticles, setPublishedArticles] = useState<EditorialArticle[]>([]);
  const [draftArticles, setDraftArticles] = useState<EditorialArticle[]>([]);
  const [stats, setStats] = useState<EditorialStats>({
    brouillon: 0,
    en_attente: 0,
    publie: 0,
    planifie: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const [pending, published, drafts, statsData] = await Promise.all([
        EditorialService.getArticlesByStatus('en_attente'),
        EditorialService.getArticlesByStatus('publie'),
        EditorialService.getArticlesByStatus('brouillon'),
        EditorialService.getStats(),
      ]);

      setPendingArticles(pending);
      setPublishedArticles(published);
      setDraftArticles(drafts);
      setStats({
        ...statsData,
        en_attente: pending.length,
        publie: published.length,
        brouillon: drafts.length,
      });
    } catch {
      // Fallback silencieux
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    fetchData();
  };

  // 1. Validation & publication immédiate d'une proposition citoyenne
  const handleApprovePending = async (article: EditorialArticle) => {
    try {
      await EditorialService.publishArticle(article.id);
      setPendingArticles((prev) => prev.filter((a) => a.id !== article.id));
      setPublishedArticles((prev) => [
        { ...article, statut: 'publie', published_at: new Date().toISOString() },
        ...prev,
      ]);
      setStats((prev) => ({
        ...prev,
        en_attente: Math.max(0, prev.en_attente - 1),
        publie: prev.publie + 1,
      }));

      Toast.show({
        type: 'success',
        text1: 'Article validé & publié ! ✨',
        text2: `"${article.titre}" est désormais en ligne sur le journal.`,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de publier cet article pour le moment.',
      });
    }
  };

  // 2. Refus d'une proposition citoyenne
  const handleRejectPending = async (article: EditorialArticle) => {
    try {
      await EditorialService.deleteArticle(article.id);
      setPendingArticles((prev) => prev.filter((a) => a.id !== article.id));
      setStats((prev) => ({
        ...prev,
        en_attente: Math.max(0, prev.en_attente - 1),
      }));

      Toast.show({
        type: 'info',
        text1: 'Proposition écartée',
        text2: `"${article.titre}" a été retiré de la file de modération.`,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de supprimer cette proposition.',
      });
    }
  };

  // 3. Dépublication d'un article en ligne
  const handleUnpublish = (article: EditorialArticle) => {
    Alert.alert(
      'Dépublier cet article ?',
      `L'article "${article.titre}" sera retiré du site public et basculé en statut Brouillon.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dépublier',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await EditorialService.unpublishArticle(article.id);
            setPublishedArticles((prev) => prev.filter((a) => a.id !== article.id));
            setDraftArticles((prev) => [{ ...article, statut: 'brouillon' }, ...prev]);
            setStats((prev) => ({
              ...prev,
              publie: Math.max(0, prev.publie - 1),
              brouillon: prev.brouillon + 1,
            }));
            Toast.show({
              type: 'info',
              text1: 'Article dépublié',
              text2: 'Bascule en brouillon effectuée.',
            });
          },
        },
      ]
    );
  };

  // 4. Suppression définitive d'un brouillon
  const handleDeleteDraft = (id: number) => {
    Alert.alert(
      'Supprimer le brouillon ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await EditorialService.deleteArticle(id);
            setDraftArticles((prev) => prev.filter((a) => a.id !== id));
            setStats((prev) => ({
              ...prev,
              brouillon: Math.max(0, prev.brouillon - 1),
            }));
          },
        },
      ]
    );
  };

  // 5. Ouverture de l'éditeur mobile avec préremplissage
  const handleEdit = (article: EditorialArticle) => {
    router.push({
      pathname: '/admin/editor',
      params: {
        id: article.id,
        initialTitre: article.titre,
        initialContenu: article.contenu,
        initialCategorieId: article.categorie?.id || 1,
        initialImage: article.image_couverture || '',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* En-tête Studio Mobile */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
          >
            <ArrowLeft size={18} color={COLORS.blanc} />
            <Text style={styles.backButtonText}>Vue Lecteur</Text>
          </Pressable>

          <View style={styles.proBadge}>
            <Landmark size={12} color={COLORS.or} />
            <Text style={styles.proBadgeText}>Compte Pro Édition</Text>
          </View>
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.journalSubtitle}>STUDIO DE RÉDACTION</Text>
            <Text style={styles.journalName} numberOfLines={1}>
              {currentCity.nomJournal || currentCity.name}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/admin/editor')}
            style={styles.newArticleButton}
            hitSlop={6}
          >
            <Plus size={16} color={COLORS.noir} strokeWidth={2.8} />
            <Text style={styles.newArticleButtonText}>Écrire</Text>
          </Pressable>
        </View>

        {/* Cartes de statistiques / Compteurs cliquables */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => setActiveTab('pending')}
            style={[
              styles.statCard,
              activeTab === 'pending' && styles.statCardActive,
            ]}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#FBF0D8' }]}>
              <Clock size={15} color="#B7791F" />
            </View>
            <Text style={styles.statCount}>{stats.en_attente}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('published')}
            style={[
              styles.statCard,
              activeTab === 'published' && styles.statCardActive,
            ]}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#E2F3EB' }]}>
              <CheckCircle2 size={15} color="#276749" />
            </View>
            <Text style={styles.statCount}>{stats.publie}</Text>
            <Text style={styles.statLabel}>En ligne</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('drafts')}
            style={[
              styles.statCard,
              activeTab === 'drafts' && styles.statCardActive,
            ]}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#EDE9E2' }]}>
              <FileText size={15} color="#4A5568" />
            </View>
            <Text style={styles.statCount}>{stats.brouillon}</Text>
            <Text style={styles.statLabel}>Brouillons</Text>
          </Pressable>
        </View>
      </View>

      {/* Barre d'onglets de filtrage */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('pending')}
          style={[styles.tabItem, activeTab === 'pending' && styles.tabItemActive]}
        >
          <Text
            style={[
              styles.tabItemText,
              activeTab === 'pending' && styles.tabItemTextActive,
            ]}
          >
            Demandes citoyennes ({pendingArticles.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('published')}
          style={[styles.tabItem, activeTab === 'published' && styles.tabItemActive]}
        >
          <Text
            style={[
              styles.tabItemText,
              activeTab === 'published' && styles.tabItemTextActive,
            ]}
          >
            En ligne ({publishedArticles.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('drafts')}
          style={[styles.tabItem, activeTab === 'drafts' && styles.tabItemActive]}
        >
          <Text
            style={[
              styles.tabItemText,
              activeTab === 'drafts' && styles.tabItemTextActive,
            ]}
          >
            Brouillons ({draftArticles.length})
          </Text>
        </Pressable>
      </View>

      {/* CONTENU PRINCIPAL SELON L'ONGLET */}
      {isLoading && pendingArticles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.vert} />
          <Text style={styles.loadingText}>Chargement du studio de rédaction...</Text>
        </View>
      ) : activeTab === 'pending' ? (
        /* --- ONGLET : DEMANDES CITOYENNES (AVEC GESTE DE SWIPE WHATSAPP) --- */
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
                Glissez une carte vers la droite pour publier ou vers la gauche pour refuser
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SwipeableModerationCard
              article={item}
              onApprove={handleApprovePending}
              onReject={handleRejectPending}
              onEdit={handleEdit}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>File de modération vide</Text>
              <Text style={styles.emptyDesc}>
                Toutes les propositions citoyennes de votre commune ont été traitées.
              </Text>
            </View>
          }
        />
      ) : activeTab === 'published' ? (
        /* --- ONGLET : ARTICLES EN LIGNE DU JOURNAL --- */
        <FlatList
          data={publishedArticles}
          keyExtractor={(item) => `published-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.standardCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.catBadgeSmall}>
                  <Text style={styles.catEmojiSmall}>
                    {item.categorie?.icon || '📰'}
                  </Text>
                  <Text style={styles.catTextSmall}>
                    {item.categorie?.libelle || 'Vie Locale'}
                  </Text>
                </View>

                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>En ligne</Text>
                </View>
              </View>

              <View style={styles.standardCardBody}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.standardTitle} numberOfLines={2}>
                    {item.titre}
                  </Text>
                  <Text style={styles.standardExcerpt} numberOfLines={2}>
                    {item.excerpt}
                  </Text>
                </View>

                {item.image_couverture && (
                  <Image
                    source={{ uri: item.image_couverture }}
                    style={styles.standardThumbnail}
                    contentFit="cover"
                  />
                )}
              </View>

              <View style={styles.standardActionsRow}>
                <Pressable
                  onPress={() => router.push(`/articles/${item.id}`)}
                  style={styles.actionPill}
                  hitSlop={4}
                >
                  <Eye size={13} color="#4A5568" />
                  <Text style={styles.actionPillText}>Voir la fiche</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleEdit(item)}
                  style={styles.actionPill}
                  hitSlop={4}
                >
                  <FileEdit size={13} color={COLORS.vert} />
                  <Text style={[styles.actionPillText, { color: COLORS.vert }]}>
                    Modifier
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleUnpublish(item)}
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Aucun article en ligne</Text>
            </View>
          }
        />
      ) : (
        /* --- ONGLET : BROUILLONS --- */
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
                  <Text style={styles.catEmojiSmall}>
                    {item.categorie?.icon || '📝'}
                  </Text>
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
                  onPress={() => handleEdit(item)}
                  style={[styles.actionPill, { backgroundColor: '#E2F3EB' }]}
                  hitSlop={4}
                >
                  <FileEdit size={13} color={COLORS.vert} />
                  <Text style={[styles.actionPillText, { color: COLORS.vert, fontWeight: '700' }]}>
                    Continuer la rédaction
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteDraft(item.id)}
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Aucun brouillon</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  topHeader: {
    backgroundColor: COLORS.vert,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 158, 57, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(201, 158, 57, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  proBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.or,
    letterSpacing: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journalSubtitle: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.or,
    letterSpacing: 1.2,
  },
  journalName: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 20,
    color: COLORS.blanc,
    marginTop: 2,
  },
  newArticleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.or,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  newArticleButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.noir,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  statCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: COLORS.or,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 18,
    color: COLORS.blanc,
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: FONTS.montserrat,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.blanc,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DE',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.vert,
  },
  tabItemText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#7D8680',
  },
  tabItemTextActive: {
    color: COLORS.vert,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 40,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 17,
    color: COLORS.noir,
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: '#7D8680',
    textAlign: 'center',
    lineHeight: 19,
  },
  standardCard: {
    backgroundColor: COLORS.blanc,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DD',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EA',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  catEmojiSmall: {
    fontSize: 11,
    marginRight: 4,
  },
  catTextSmall: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.vert,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF6F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D5B',
  },
  onlineText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: '#2E7D5B',
  },
  draftDateText: {
    fontFamily: FONTS.montserrat,
    fontSize: 10,
    color: '#8A928C',
  },
  standardCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
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
    color: '#657169',
    lineHeight: 16,
  },
  standardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#EBE7DE',
  },
  standardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EA',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2EFE8',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionPillDanger: {
    backgroundColor: '#FDF0F0',
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
    color: '#657169',
    marginTop: 12,
  },
});
