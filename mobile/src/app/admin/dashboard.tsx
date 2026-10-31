import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useCity } from '@/context/CityContext';
import {
  EditorialService,
  EditorialArticle,
  EditorialStats,
} from '@/lib/services/editorial.service';
import { DealsService, BonPlan, MOCK_DEALS } from '@/lib/services/deals.service';
import { AlertsService } from '@/lib/services/alerts.service';

import AdminHeader, { MainNavType } from '@/components/admin/AdminHeader';
import AdminArticlesView from '@/components/admin/AdminArticlesView';
import AdminDealsView from '@/components/admin/AdminDealsView';
import AdminToolsView, { ToolsSubType } from '@/components/admin/AdminToolsView';
import AdminUsersView from '@/components/admin/AdminUsersView';

export default function MobileAdminDashboardScreen() {
  const { currentCity } = useCity();

  // Navigation principale : Articles | Bons plans | Outils | Équipe
  const [mainNav, setMainNav] = useState<MainNavType>('articles');
  const [toolsSubType, setToolsSubType] = useState<ToolsSubType>('lost');

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
  const [isAddDealModalVisible, setIsAddDealModalVisible] = useState<boolean>(false);

  // Compteur d'alertes en temps réel
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(() =>
    AlertsService.getAlerts().filter((a) => a.isActive).length
  );

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
      // Mode hors-ligne silencieux
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

  useEffect(() => {
    return AlertsService.subscribe((updated) => {
      setActiveAlertsCount(updated.filter((a) => a.isActive).length);
    });
  }, []);

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
              setDraftArticles((prev) => [{ ...article, statut: 'brouillon' }, ...prev]);
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

  const handleView = (article: EditorialArticle) => {
    router.push({
      pathname: '/articles/[id]',
      params: { id: article.id },
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

  const handleSaveNewDeal = async (dealData: Omit<BonPlan, 'id'>) => {
    const created = await DealsService.addDeal(dealData);
    setDeals((prev) => [created, ...prev]);
    Toast.show({
      type: 'success',
      text1: created.statut === 'actif' ? 'Bon plan publié ! 🏷️' : 'Bon plan enregistré en pause 📝',
      text2: created.titre,
    });
  };

  // Titres et boutons du header
  const getHeaderInfo = () => {
    switch (mainNav) {
      case 'team':
        return {
          subtitle: 'COLLABORATEURS & ACCÈS',
          title: 'Gestion Équipe',
          actionText: undefined,
          onAction: undefined,
        };
      case 'deals':
        return {
          subtitle: 'PRIVILÈGES & SORTIES',
          title: 'Bons Plans',
          actionText: 'Nouveau',
          onAction: () => setIsAddDealModalVisible(true),
        };
      case 'tools':
        if (toolsSubType === 'parking') {
          return {
            subtitle: 'VOIRIE & STATIONNEMENT',
            title: 'Parkings municipaux',
            actionText: undefined,
            onAction: undefined,
          };
        }
        return {
          subtitle: 'SERVICES MUNICIPAUX',
          title: 'Objets trouvés & perdus',
          actionText: 'Déclarer',
          onAction: () => router.push('/modals/declare-lost'),
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
      {/* En-tête modulaire Studio */}
      <AdminHeader
        mainNav={mainNav}
        onSelectNav={setMainNav}
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        actionText={headerInfo.actionText}
        onAction={headerInfo.onAction}
        onBack={() => router.back()}
      />

      {/* Vue Articles & Alertes */}
      {mainNav === 'articles' && (
        <AdminArticlesView
          stats={stats}
          activeAlertsCount={activeAlertsCount}
          pendingArticles={pendingArticles}
          publishedArticles={publishedArticles}
          draftArticles={draftArticles}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onApprovePending={handleApprovePending}
          onRejectPending={handleRejectPending}
          onViewArticle={handleView}
          onEditArticle={handleEdit}
          onUnpublishArticle={handleUnpublish}
          onDeleteDraft={handleDeleteDraft}
        />
      )}

      {/* Vue Bons Plans */}
      {mainNav === 'deals' && (
        <AdminDealsView
          deals={deals}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onToggleDealStatus={handleToggleDealStatus}
          onDeleteDeal={handleDeleteDeal}
          onSaveNewDeal={handleSaveNewDeal}
          cityName={currentCity.name}
          isAddModalVisible={isAddDealModalVisible}
          onCloseAddModal={() => setIsAddDealModalVisible(false)}
          onOpenAddModal={() => setIsAddDealModalVisible(true)}
        />
      )}

      {/* Vue Outils Municipaux (Objets perdus & Parkings) */}
      {mainNav === 'tools' && (
        <AdminToolsView
          currentSubType={toolsSubType}
          onSubTypeChange={setToolsSubType}
        />
      )}

      {/* Vue Gestion Équipe */}
      {mainNav === 'team' && <AdminUsersView />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
});
