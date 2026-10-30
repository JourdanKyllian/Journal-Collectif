import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ChevronDown, Calendar, BookOpen } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MobileArticle } from '@/lib/mock-data';

const HERO_HEIGHT = 300;

interface HeroCardProps {
  article: MobileArticle;
}

export default function HeroCard({ article }: HeroCardProps) {
  const bounceY = useSharedValue(0);

  React.useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [bounceY]);

  const chevronAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/articles/${article.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.93 }]}
      accessibilityRole="button"
      accessibilityLabel={`Lire l'article : ${article.titre}`}
    >
      {/* Image plein-format */}
      {article.image_couverture ? (
        <Image
          source={{ uri: article.image_couverture }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.vert }]} />
      )}

      {/* Véritable dégradé cinématique */}
      <LinearGradient
        colors={['transparent', 'rgba(11, 28, 16, 0.45)', 'rgba(11, 28, 16, 0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Contenu bas */}
      <View style={styles.heroContent}>
        {/* Badge catégorie */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {article.categorie.icon} {article.categorie.libelle}
          </Text>
        </View>

        <Text style={styles.heroTitle} numberOfLines={3}>
          {article.titre}
        </Text>

        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <Calendar size={12} color="rgba(254,249,241,0.7)" />
            <Text style={styles.heroMetaText}>{article.published_at}</Text>
          </View>
          <View style={styles.heroMetaDot} />
          <View style={styles.heroMetaItem}>
            <BookOpen size={12} color="rgba(254,249,241,0.7)" />
            <Text style={styles.heroMetaText}>{article.readTime} de lecture</Text>
          </View>
        </View>
      </View>

      {/* Chevron animé – invitation à scroller */}
      <Animated.View style={[styles.heroScrollHint, chevronAnimStyle]}>
        <ChevronDown size={20} color="rgba(254,249,241,0.6)" strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: HERO_HEIGHT,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.vert,
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.or,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: COLORS.noir,
  },
  heroTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    color: COLORS.blanc,
    lineHeight: 28,
    letterSpacing: -0.5,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: 'rgba(254, 249, 241, 0.75)',
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(254, 249, 241, 0.4)',
  },
  heroScrollHint: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    opacity: 0.7,
  },
});

