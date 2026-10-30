import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Share2,
  Calendar,
  BookOpen,
  PenTool,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { apiClient } from '@/lib/api';
import { MOCK_ARTICLES } from '@/lib/mock-data';
import SimpleMarkdownRenderer from '@/components/admin/SimpleMarkdownRenderer';

interface ArticleDetail {
  id: number;
  titre: string;
  contenu: string;
  image_couverture?: string | null;
  source_link?: string | null;
  statut?: string;
  published_at?: string | null;
  created_at?: string;
  readTime?: string;
  categorie: {
    id: number;
    libelle: string;
    icon?: string;
  };
  credits: {
    role: string;
    name: string;
    anonymous?: boolean;
  }[];
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleId = id ? Number(id) : NaN;

  const [article, setArticle] = useState<ArticleDetail | null>(() => {
    // Si l'identifiant correspond directement à un article de démo mocké
    const mock = MOCK_ARTICLES.find((a) => a.id === articleId);
    return mock || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!article && !isNaN(articleId));
  const [hasError, setHasError] = useState<boolean>(isNaN(articleId));

  useEffect(() => {
    if (isNaN(articleId)) {
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const fetched = await apiClient<ArticleDetail>(`/article/${articleId}`);
        if (!isMounted) return;

        // Calcul dynamique du temps de lecture
        const wordCount = fetched.contenu ? fetched.contenu.replace(/<[^>]*>/g, '').split(/\s+/).length : 50;
        const minutes = Math.max(1, Math.ceil(wordCount / 180));

        setArticle({
          ...fetched,
          readTime: `${minutes} min`,
          categorie: {
            id: fetched.categorie?.id ?? 1,
            libelle: fetched.categorie?.libelle ?? 'Vie Locale',
            icon: fetched.categorie?.icon ?? '🗞️',
          },
          credits:
            fetched.credits && fetched.credits.length > 0
              ? fetched.credits
              : [{ role: 'Auteur', name: 'Équipe Rédaction', anonymous: false }],
        });
        setHasError(false);
      } catch {
        if (!isMounted) return;
        // Fallback sur le mock correspondant si présent, sinon erreur
        const fallback = MOCK_ARTICLES.find((a) => a.id === articleId);
        if (fallback) {
          setArticle(fallback);
        } else {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [articleId]);

  const handleNativeShare = async () => {
    if (!article) return;
    await Share.share({
      title: article.titre,
      message: `${article.titre} — Lu sur Journal Collectif`,
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.or} />
        <Text style={styles.loadingText}>Chargement de l&apos;article...</Text>
      </View>
    );
  }

  if (hasError || !article) {
    return (
      <View style={[styles.container, styles.center, { padding: 24 }]}>
        <Text style={styles.errorTitle}>Article introuvable</Text>
        <Text style={styles.errorSub}>
          Cet article n&apos;est plus disponible ou vous ne disposez pas des droits pour le consulter.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Retourner au journal</Text>
        </Pressable>
      </View>
    );
  }

  const formattedDate = article.published_at || article.created_at
    ? new Date(article.published_at || article.created_at!).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date inconnue';

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO IMAGE & NAVIGATION */}
        <View style={styles.heroWrapper}>
          {article.image_couverture ? (
            <Image
              source={{ uri: article.image_couverture }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: COLORS.vert }]} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={styles.iconCircle}
              accessibilityLabel="Retour"
            >
              <ArrowLeft size={20} color={COLORS.blanc} />
            </Pressable>
            <Pressable
              onPress={handleNativeShare}
              style={styles.iconCircle}
              accessibilityLabel="Partager"
            >
              <Share2 size={18} color={COLORS.blanc} />
            </Pressable>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {article.categorie.icon ? `${article.categorie.icon} ` : ''}
                {article.categorie.libelle}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{article.titre}</Text>
          </View>
        </View>

        {/* MÉTADONNÉES */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Calendar size={15} color={COLORS.or} />
            <Text style={styles.metaLabel}>Publié le {formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <BookOpen size={15} color={COLORS.or} />
            <Text style={styles.metaLabel}>Lecture : {article.readTime || '3 min'}</Text>
          </View>
        </View>

        {/* CORPS DE L'ARTICLE */}
        <View style={styles.articleBody}>
          <SimpleMarkdownRenderer content={article.contenu} />

          {/* LIEN SOURCE EVENTUEL */}
          {article.source_link && (
            <View style={styles.sourceBox}>
              <ExternalLink size={14} color={COLORS.vert} />
              <Text style={styles.sourceText} numberOfLines={1}>
                Source : {article.source_link}
              </Text>
            </View>
          )}

          {/* CRÉDITS ÉDITORIAUX & CONFORMITÉ RGPD */}
          <View style={styles.creditsBox}>
            <View style={styles.creditsHeader}>
              <PenTool size={18} color={COLORS.or} />
              <Text style={styles.creditsTitle}>Traçabilité & Équipe Éditoriale</Text>
            </View>
            <Text style={styles.creditsSub}>
              Cet article a été vérifié et modéré par la rédaction locale.
            </Text>

            {article.credits.map((credit, idx) => (
              <View key={idx} style={styles.creditRow}>
                <Text style={styles.creditRole}>{credit.role}</Text>
                <View style={styles.creditNameRow}>
                  {credit.anonymous && (
                    <ShieldCheck size={14} color={COLORS.vert} />
                  )}
                  <Text style={styles.creditName}>{credit.name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.champagne,
    marginTop: 14,
  },
  errorTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 20,
    color: COLORS.noir,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.champagne,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: COLORS.vert,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.blanc,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  heroWrapper: {
    height: 340,
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    backgroundColor: 'rgba(11, 28, 16, 0.58)',
  },
  topBar: {
    marginTop: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(26, 26, 26, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(254, 249, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.or,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: COLORS.noir,
  },
  heroTitle: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.blanc,
    lineHeight: 31,
  },
  metaBar: {
    backgroundColor: COLORS.vert,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
  articleBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 51, 30, 0.05)',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  sourceText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.vert,
    flex: 1,
  },
  creditsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.3)',
    marginTop: 24,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  creditsTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.noir,
  },
  creditsSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginBottom: 14,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 134, 113, 0.15)',
  },
  creditRole: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.champagne,
  },
  creditNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  creditName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.noir,
  },
});
