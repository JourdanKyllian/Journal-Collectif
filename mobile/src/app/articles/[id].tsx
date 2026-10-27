import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
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
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_ARTICLES } from '@/lib/mock-data';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article =
    MOCK_ARTICLES.find((a) => a.id === Number(id)) ?? MOCK_ARTICLES[0];

  const handleNativeShare = async () => {
    await Share.share({
      title: article.titre,
      message: `${article.titre} — Lu sur Journal Collectif (Collectif Châlonnais)`,
    });
  };

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
          {/* Utilisation de StyleSheet.absoluteFill au lieu de absoluteFillObject */}
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.iconCircle}>
              <ArrowLeft size={20} color={COLORS.blanc} />
            </Pressable>
            <Pressable onPress={handleNativeShare} style={styles.iconCircle}>
              <Share2 size={18} color={COLORS.blanc} />
            </Pressable>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {article.categorie.icon} {article.categorie.libelle}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{article.titre}</Text>
          </View>
        </View>

        {/* MÉTADONNÉES */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Calendar size={15} color={COLORS.or} />
            <Text style={styles.metaLabel}>Publié le {article.published_at}</Text>
          </View>
          <View style={styles.metaItem}>
            <BookOpen size={15} color={COLORS.or} />
            <Text style={styles.metaLabel}>Lecture : {article.readTime}</Text>
          </View>
        </View>

        {/* CORPS DE L'ARTICLE */}
        <View style={styles.articleBody}>
          <Text style={styles.bodyText}>{article.contenu}</Text>

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
  bodyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.noir,
    lineHeight: 25,
    marginBottom: 32,
  },
  creditsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.3)',
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
