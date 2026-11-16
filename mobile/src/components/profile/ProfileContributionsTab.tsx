import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { UserX, FileText } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { apiClient } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';

interface ContributionItem {
  id: number;
  titre: string;
  date?: string;
  created_at?: string;
  statut: 'publie' | 'approuve' | 'en_attente' | 'brouillon' | 'refuse_ou_supprime';
}

interface ProfileContributionsTabProps {
  isLoggedIn: boolean;
  onCountLoaded?: (count: number) => void;
}

export default function ProfileContributionsTab({
  isLoggedIn,
  onCountLoaded,
}: ProfileContributionsTabProps) {
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadContributions() {
      if (!isLoggedIn) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient<{ data: ContributionItem[] }>('/article/mine?limit=50');
        const list = res?.data || [];
        setContributions(list);
        if (onCountLoaded) onCountLoaded(list.length);
      } catch {
        // Fallback gracieux si l'utilisateur n'a pas encore de contributions
        setContributions([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadContributions();
  }, [isLoggedIn, onCountLoaded]);

  const getStatusBadge = (statut: ContributionItem['statut']) => {
    switch (statut) {
      case 'publie':
      case 'approuve':
        return {
          label: 'Approuvé',
          bg: '#E2F3EB',
          text: '#217346',
        };
      case 'en_attente':
        return {
          label: 'En attente',
          bg: '#FEFCBF',
          text: '#975A16',
        };
      case 'refuse_ou_supprime':
        return {
          label: 'Refusé',
          bg: '#FED7D7',
          text: '#9B2C2C',
        };
      default:
        return {
          label: 'Brouillon',
          bg: 'rgba(142, 134, 113, 0.15)',
          text: COLORS.noir,
        };
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.card}>
        <EmptyState
          icon={UserX}
          title="Connexion requise"
          description="Connectez-vous pour visualiser et suivre l'historique de vos contributions citoyennes."
          actionLabel="Se connecter"
          onAction={() => router.push('/modals/login')}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Contributions</Text>
        <Text style={styles.subtitle}>
          Suivez l&apos;état de modération des articles soumis à la rédaction municipale
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={COLORS.or} />
          <Text style={styles.loaderText}>Chargement de vos publications...</Text>
        </View>
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune contribution"
          description="Vous n'avez pas encore proposé d'article pour le Journal Collectif."
          actionLabel="Proposer une actualité"
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <View style={styles.list}>
          {contributions.map((item, index) => {
            const badge = getStatusBadge(item.statut);
            const isLast = index === contributions.length - 1;
            return (
              <View
                key={item.id}
                style={[styles.itemRow, !isLast && styles.itemRowBorder]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.titre}
                  </Text>
                  <Text style={styles.itemDate}>
                    {item.date || item.created_at || 'Récemment'}
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.15)',
    paddingBottom: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 2,
    lineHeight: 15,
  },
  loaderBox: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.champagne,
  },
  list: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.12)',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    lineHeight: 18,
  },
  itemDate: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
});
