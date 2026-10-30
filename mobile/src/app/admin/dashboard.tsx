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
  Newspaper,
  Tag,
  Briefcase,
  Car,
  Search,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { resolveImageUrl } from '@/lib/api';
import { useCity } from '@/context/CityContext';
import {
  EditorialService,
  EditorialArticle,
  EditorialStats,
} from '@/lib/services/editorial.service';
import {
  DealsService,
  BonPlan,
  MOCK_DEALS,
} from '@/lib/services/deals.service';
import SwipeableModerationCard from '@/components/admin/SwipeableModerationCard';
import ParkingView from '@/components/tools/ParkingView';
import LostObjectsView from '@/components/tools/LostObjectsView';

type MainNavType = 'articles' | 'deals' | 'tools';
type ArticleFilterType = 'pending' | 'published' | 'drafts';
type ToolsSubType = 'parking' | 'lost';

export default function MobileAdminDashboardScreen() {
  const { currentCity } = useCity();

  // Navigation principale à 3 onglets demandée : Articles | Bons plans | Outils
  const [mainNav, setMainNav] = useState<MainNavType>('articles');

  // Sous-filtres spécifiques
  const [articleFilter, setArticleFilter] = useState<ArticleFilterType>('pending');
  const [toolsSubType, setToolsSubType] = useState<ToolsSubType>('parking');

  // Données éditoriales
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

  // Données Bons Plans
  const [deals, setDeals] = useState<BonPlan[]>(MOCK_DEALS);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const [pending, published, drafts, statsData, dealsData] = await Promise.all([
        EditorialService.getArticlesByStatus('en_attente'),
        EditorialService.getArticlesByStatus('publie'),
        EditorialService.getArticlesByStatus('brouillon'),
        EditorialService.getStats(),
        DealsService.getDeals(),
      ]);

      setPendingArticles(pending);
      setPublishedArticles(published);
      setDraftArticles(drafts);
      setDeals(dealsData);
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

  // --- ACTIONS ARTICLES ---
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
            try {
              await EditorialService.unpublishArticle(article.id);
              setPublishedArticles((prev) => prev.filter((a) => a.id !== article.id));
              setDraftArticles((prev) => [
                { ...article, statut: 'brouillon' },
                ...prev,
              ]);
              setStats((prev) => ({
                ...prev,
                publie: Math.max(0, prev.publie - 1),
                brouillon: prev.brouillon + 1,
              }));

              Toast.show({
                type: 'info',
                text1: 'Article retiré du direct',
                text2: `"${article.titre}" est à nouveau en brouillon.`,
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Impossible de dépublier cet article.',
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteDraft = (id: number) => {
    Alert.alert(
      'Supprimer ce brouillon ?',
      'Cette action est irréversible. Le texte sera définitivement effacé.',
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
            Toast.show({
              type: 'info',
              text1: 'Brouillon supprimé',
            });
          },
        },
      ]
    );
  };

  const handleEdit = (article: EditorialArticle) => {
    router.push({
      pathname: '/admin/editor',
      params: {
        id: article.id,
        initialTitre: article.titre,
        initialContenu: article.contenu,
        initialCategorieId: article.categorie?.id || 1,
        initialImage: article.image_couverture || '',
        initialStatut: article.statut,
      },
    });
  };

  // --- ACTIONS BONS PLANS ---
  const handleToggleDealStatus = async (id: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = await DealsService.toggleDealStatus(id);
    if (updated) {
      setDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, statut: updated.statut } : d))
      );
      Toast.show({
        type: 'success',
        text1: updated.statut === 'actif' ? 'Bon plan réactivé ✨' : 'Bon plan mis en pause ⏸️',
        text2: updated.titre,
      });
    }
  };

  const handleDeleteDeal = (id: number, titre: string) => {
    Alert.alert(
      'Supprimer ce bon plan ?',
      `Confirmez-vous la suppression de l'offre "${titre}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await DealsService.deleteDeal(id);
            setDeals((prev) => prev.filter((d) => d.id !== id));
            Toast.show({
              type: 'info',
              text1: 'Offre retirée',
            });
          },
        },
      ]
    );
  };

  const handleAddDealQuick = () => {
    Alert.alert(
      'Nouveau bon plan local',
      'Souhaitez-vous ajouter une offre partenaire (billetterie, concours ou code promo) pour les citoyens ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer une offre',
          onPress: () => {
            const newDeal: BonPlan = {
              id: Date.now(),
              titre: 'Remise Privilège Commerce Local',
              description: 'Offre exclusive réservée aux lecteurs de ' + currentCity.name + '.',
              categorie: 'code_promo',
              partenaire: 'Partenaire Local',
              valeur: '-20%',
              codePromo: 'CITOYEN26',
              dateFin: '31 déc. 2026',
              statut: 'actif',
            };
            setDeals((prev) => [newDeal, ...prev]);
            Toast.show({
              type: 'success',
              text1: 'Bon plan ajouté ! 🏷️',
              text2: 'Visible dès maintenant par les citoyens',
            });
          },
        },
      ]
    );
  };

  // Titres & sous-titres dynamiques selon l'onglet principal actif
  const getHeaderInfo = () => {
    switch (mainNav) {
      case 'deals':
        return {
          subtitle: 'COMMERCE & PRIVILÈGES',
          title: 'Bons Plans Partenaires',
          actionText: 'Nouveau',
          onAction: handleAddDealQuick,
        };
      case 'tools':
        return {
          subtitle: 'SERVICES MUNICIPAUX',
          title: 'Voirie & Stationnement',
          actionText: undefined,
          onAction: undefined,
        };
      case 'articles':
      default:
        return {
          subtitle: 'STUDIO DE RÉDACTION',
          title: currentCity.nomJournal || currentCity.name,
          actionText: 'Écrire',
          onAction: () => router.push('/admin/editor'),
        };
    }
  };

  const headerInfo = getHeaderInfo();

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
            <Text style={styles.journalSubtitle}>{headerInfo.subtitle}</Text>
            <Text style={styles.journalName} numberOfLines={1}>
              {headerInfo.title}
            </Text>
          </View>

          {headerInfo.actionText && (
            <Pressable
              onPress={headerInfo.onAction}
              style={styles.newArticleButton}
              hitSlop={6}
            >
              <Plus size={16} color={COLORS.noir} strokeWidth={2.8} />
              <Text style={styles.newArticleButtonText}>{headerInfo.actionText}</Text>
            </Pressable>
          )}
        </View>

        {/* 3 Navigations Principales : Articles | Bons plans | Outils */}
        <View style={styles.mainNavRow}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setMainNav('articles');
            }}
            style={[
              styles.mainNavItem,
              mainNav === 'articles' && styles.mainNavItemActive,
            ]}
          >
            <Newspaper
              size={15}
              color={mainNav === 'articles' ? COLORS.noir : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.mainNavItemText,
                mainNav === 'articles' && styles.mainNavItemTextActive,
              ]}
            >
              Articles
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setMainNav('deals');
            }}
            style={[
              styles.mainNavItem,
              mainNav === 'deals' && styles.mainNavItemActive,
            ]}
          >
            <Tag
              size={15}
              color={mainNav === 'deals' ? COLORS.noir : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.mainNavItemText,
                mainNav === 'deals' && styles.mainNavItemTextActive,
              ]}
            >
              Bons plans ({deals.filter((d) => d.statut === 'actif').length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setMainNav('tools');
            }}
            style={[
              styles.mainNavItem,
              mainNav === 'tools' && styles.mainNavItemActive,
            ]}
          >
            <Briefcase
              size={15}
              color={mainNav === 'tools' ? COLORS.noir : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.mainNavItemText,
                mainNav === 'tools' && styles.mainNavItemTextActive,
              ]}
            >
              Outils
            </Text>
          </Pressable>
        </View>
      </View>

      {/* --- ONGLET 1 : ARTICLES (FILTRABLE VIA LES 3 COMPTEURS) --- */}
      {mainNav === 'articles' && (
        <>
          {/* Cartes de statistiques / Compteurs cliquables */}
          <View style={styles.statsRow}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setArticleFilter('pending');
              }}
              style={[
                styles.statCard,
                articleFilter === 'pending' && styles.statCardActive,
              ]}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#FBF0D8' }]}>
                <Clock size={15} color="#B7791F" />
              </View>
              <Text style={styles.statCount}>{stats.en_attente}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setArticleFilter('published');
              }}
              style={[
                styles.statCard,
                articleFilter === 'published' && styles.statCardActive,
              ]}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#E2F3EB' }]}>
                <CheckCircle2 size={15} color="#276749" />
              </View>
              <Text style={styles.statCount}>{stats.publie}</Text>
              <Text style={styles.statLabel}>En ligne</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setArticleFilter('drafts');
              }}
              style={[
                styles.statCard,
                articleFilter === 'drafts' && styles.statCardActive,
              ]}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#EDE9E2' }]}>
                <FileText size={15} color="#4A5568" />
              </View>
              <Text style={styles.statCount}>{stats.brouillon}</Text>
              <Text style={styles.statLabel}>Brouillons</Text>
            </Pressable>
          </View>

          {/* CONTENU PRINCIPAL SELON LE FILTRE D'ARTICLE */}
          {isLoading && pendingArticles.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.vert} />
              <Text style={styles.loadingText}>Chargement du studio...</Text>
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
          ) : articleFilter === 'published' ? (
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

                    {resolveImageUrl(item.image_couverture) && (
                      <Image
                        source={{ uri: resolveImageUrl(item.image_couverture)! }}
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
        </>
      )}

      {/* --- ONGLET 2 : GESTION DES BONS PLANS --- */}
      {mainNav === 'deals' && (
        <View style={{ flex: 1 }}>
          {/* Statistiques bons plans */}
          <View style={styles.statsRow}>
            <View style={styles.statCardStatic}>
              <Text style={styles.statCountStatic}>{deals.length}</Text>
              <Text style={styles.statLabelStatic}>Total Offres</Text>
            </View>

            <View style={styles.statCardStatic}>
              <Text style={[styles.statCountStatic, { color: '#276749' }]}>
                {deals.filter((d) => d.statut === 'actif').length}
              </Text>
              <Text style={styles.statLabelStatic}>Actifs en direct</Text>
            </View>

            <View style={styles.statCardStatic}>
              <Text style={[styles.statCountStatic, { color: '#B7791F' }]}>
                {new Set(deals.map((d) => d.partenaire)).size}
              </Text>
              <Text style={styles.statLabelStatic}>Partenaires</Text>
            </View>
          </View>

          {/* Liste d'administration des bons plans */}
          <FlatList
            data={deals}
            keyExtractor={(item) => `deal-${item.id}`}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isActive = item.statut === 'actif';
              return (
                <View style={styles.dealAdminCard}>
                  <View style={styles.dealAdminHeader}>
                    <View style={styles.dealBadgeRow}>
                      <View style={[styles.catBadgeSmall, { backgroundColor: '#F0EBE1' }]}>
                        <Text style={styles.catTextSmall}>
                          {item.categorie.toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isActive
                              ? styles.statusBadgeTextActive
                              : styles.statusBadgeTextInactive,
                          ]}
                        >
                          {isActive ? 'Actif' : 'Mis en pause'}
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

                  <View style={styles.dealAdminActions}>
                    <Pressable
                      onPress={() => handleToggleDealStatus(item.id)}
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
                        {isActive ? 'Mettre en pause' : 'Activer l’offre'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteDeal(item.id, item.titre)}
                      style={styles.dealDeleteBtn}
                    >
                      <Trash2 size={15} color="#C53030" />
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* --- ONGLET 3 : OUTILS MUNICIPAUX (PARKINGS & OBJETS TROUVÉS) --- */}
      {mainNav === 'tools' && (
        <View style={{ flex: 1 }}>
          {/* Sous-sélecteur Parkings vs Objets Perdus */}
          <View style={styles.toolsSubNav}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setToolsSubType('parking');
              }}
              style={[
                styles.toolsSubItem,
                toolsSubType === 'parking' && styles.toolsSubItemActive,
              ]}
            >
              <Car
                size={14}
                color={toolsSubType === 'parking' ? COLORS.noir : '#7D8680'}
              />
              <Text
                style={[
                  styles.toolsSubItemText,
                  toolsSubType === 'parking' && styles.toolsSubItemTextActive,
                ]}
              >
                Parkings & Affluence
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setToolsSubType('lost');
              }}
              style={[
                styles.toolsSubItem,
                toolsSubType === 'lost' && styles.toolsSubItemActive,
              ]}
            >
              <Search
                size={14}
                color={toolsSubType === 'lost' ? COLORS.noir : '#7D8680'}
              />
              <Text
                style={[
                  styles.toolsSubItemText,
                  toolsSubType === 'lost' && styles.toolsSubItemTextActive,
                ]}
              >
                Objets trouvés & perdus
              </Text>
            </Pressable>
          </View>

          {/* Affichage direct de l'outil sélectionné */}
          <View style={{ flex: 1 }}>
            {toolsSubType === 'parking' ? <ParkingView /> : <LostObjectsView />}
          </View>
        </View>
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 14,
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
  mainNavRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 3,
    borderRadius: 14,
    gap: 4,
  },
  mainNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 6,
  },
  mainNavItemActive: {
    backgroundColor: COLORS.blanc,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mainNavItemText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  mainNavItemTextActive: {
    color: COLORS.noir,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
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
    padding: 10,
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
    fontSize: 17,
    color: COLORS.noir,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
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
    gap: 4,
    backgroundColor: '#F5F2EB',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  catEmojiSmall: {
    fontSize: 11,
  },
  catTextSmall: {
    fontFamily: FONTS.montserratBold,
    fontSize: 11,
    color: '#5C6560',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  onlineText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: '#2E7D32',
  },
  draftDateText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#8E9A92',
  },
  standardCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  standardThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#EAE6DD',
  },
  standardTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 15,
    color: COLORS.noir,
    lineHeight: 20,
    marginBottom: 4,
  },
  standardExcerpt: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#6B7570',
    lineHeight: 16,
  },
  standardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EB',
    paddingTop: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F2EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: '#718096',
  },
  // --- STYLES BONS PLANS ADMIN ---
  dealAdminCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DD',
  },
  dealAdminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#E2F3EB',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEEBC8',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.montserratBold,
  },
  statusBadgeTextActive: {
    color: '#217346',
  },
  statusBadgeTextInactive: {
    color: '#C05621',
  },
  dealValueBadge: {
    fontSize: 12,
    fontFamily: FONTS.poppinsBlack,
    color: COLORS.vert,
  },
  dealAdminTitle: {
    fontSize: 15,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.noir,
    marginBottom: 4,
  },
  dealAdminPartner: {
    fontSize: 12,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginBottom: 2,
  },
  dealAdminCode: {
    fontSize: 12,
    fontFamily: FONTS.montserrat,
    color: '#718096',
    marginBottom: 10,
  },
  codeTextHighlight: {
    fontFamily: FONTS.montserratBold,
    color: COLORS.vert,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dealActionBtnPause: {
    backgroundColor: '#FEEBC8',
  },
  dealActionBtnPlay: {
    backgroundColor: '#E2F3EB',
  },
  dealActionBtnText: {
    fontSize: 12,
    fontFamily: FONTS.montserratBold,
  },
  dealDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  // --- STYLES OUTILS ADMIN ---
  toolsSubNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toolsSubItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F7FAFC',
  },
  toolsSubItemActive: {
    backgroundColor: '#EAF4EE',
    borderWidth: 1,
    borderColor: '#C2E5D4',
  },
  toolsSubItemText: {
    fontSize: 12,
    fontFamily: FONTS.montserratSemiBold,
    color: '#718096',
  },
  toolsSubItemTextActive: {
    color: COLORS.vert,
    fontWeight: '700',
  },
});
