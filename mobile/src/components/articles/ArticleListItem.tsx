import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, BookOpen } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MobileArticle } from '@/lib/mock-data';

interface ArticleListItemProps {
  item: MobileArticle;
  index: number;
}

export default function ArticleListItem({ item, index }: ArticleListItemProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push(`/articles/${item.id}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(16)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.listItem,
          pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Lire : ${item.titre}`}
      >
        {/* Thumbnail */}
        <View style={styles.listThumb}>
          {item.image_couverture ? (
            <Image
              source={{ uri: item.image_couverture }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.vert }]} />
          )}
          <View style={styles.listBadge}>
            <Text style={styles.listBadgeText}>{item.categorie.icon}</Text>
          </View>
        </View>

        {/* Text */}
        <View style={styles.listBody}>
          <View style={styles.listCategoryRow}>
            <Text style={styles.listCategory}>{item.categorie.libelle}</Text>
          </View>
          <Text style={styles.listTitle} numberOfLines={2}>
            {item.titre}
          </Text>
          <View style={styles.listMeta}>
            <Calendar size={11} color={COLORS.champagne} />
            <Text style={styles.listMetaText}>{item.published_at}</Text>
            <View style={styles.listMetaDot} />
            <BookOpen size={11} color={COLORS.champagne} />
            <Text style={styles.listMetaText}>{item.readTime}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.blanc,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listThumb: {
    width: 100,
    height: 100,
    flexShrink: 0,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  listBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBadgeText: {
    fontSize: 13,
  },
  listBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listCategoryRow: {
    marginBottom: 4,
  },
  listCategory: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: COLORS.or,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.noir,
    lineHeight: 19,
    flex: 1,
    marginBottom: 8,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listMetaText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
  },
  listMetaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.champagne,
    marginHorizontal: 2,
  },
});

