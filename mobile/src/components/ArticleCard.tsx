import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, BookOpen } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { MobileArticle } from '@/lib/mock-data';
import { resolveImageUrl } from '@/lib/api';

interface ArticleCardProps {
  item: MobileArticle;
  index: number;
}

export default function ArticleCard({ item, index }: ArticleCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={() => router.push(`/articles/${item.id}`)}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
        ]}
      >
        <View style={styles.imageWrapper}>
          {resolveImageUrl(item.image_couverture) ? (
            <Image
              source={{ uri: resolveImageUrl(item.image_couverture)! }}
              style={styles.image}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <View style={[styles.image, { backgroundColor: COLORS.vert }]} />
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.categorie.icon} {item.categorie.libelle}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {item.titre}
          </Text>
          <Text style={styles.excerpt} numberOfLines={2}>
            {item.excerpt}
          </Text>

          <View style={styles.footer}>
            <View style={styles.meta}>
              <Calendar size={13} color={COLORS.champagne} />
              <Text style={styles.metaText}>{item.published_at}</Text>
            </View>
            <View style={styles.meta}>
              <BookOpen size={13} color={COLORS.champagne} />
              <Text style={styles.metaText}>{item.readTime}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 18,
  },
  imageWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: COLORS.or,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: COLORS.noir,
  },
  body: {
    padding: 16,
  },
  title: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.noir,
    lineHeight: 22,
    marginBottom: 6,
  },
  excerpt: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.champagne,
    lineHeight: 19,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 134, 113, 0.15)',
    paddingTop: 10,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.champagne,
  },
});
