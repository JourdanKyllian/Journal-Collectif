import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Trash2,
  Edit3,
  ShieldCheck,
  User,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { resolveImageUrl } from '@/lib/api';
import { EditorialArticle } from '@/lib/services/editorial.service';

interface SwipeableModerationCardProps {
  article: EditorialArticle;
  onApprove: (article: EditorialArticle) => void;
  onReject: (article: EditorialArticle) => void;
  onEdit: (article: EditorialArticle) => void;
}

export default function SwipeableModerationCard({
  article,
  onApprove,
  onReject,
  onEdit,
}: SwipeableModerationCardProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const [confirmingAction, setConfirmingAction] = useState<'approve' | 'reject' | null>(null);

  const handleApprovePress = () => {
    if (confirmingAction !== 'approve') {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setConfirmingAction('approve');
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      swipeableRef.current?.close();
      setConfirmingAction(null);
      onApprove(article);
    }
  };

  const handleRejectPress = () => {
    if (confirmingAction !== 'reject') {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setConfirmingAction('reject');
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      swipeableRef.current?.close();
      setConfirmingAction(null);
      onReject(article);
    }
  };

  // Action Révélée à GAUCHE (Swipe vers la droite -> Autoriser / Publier)
  const renderLeftActions = (
    _progress: SharedValue<number>,
    _drag: SharedValue<number>
  ) => {
    const isConfirming = confirmingAction === 'approve';
    return (
      <View style={styles.leftActionContainer}>
        <Pressable
          onPress={handleApprovePress}
          style={[
            styles.actionButton,
            styles.approveButton,
            isConfirming && styles.approveConfirmButton,
          ]}
        >
          <View style={styles.actionIconCircle}>
            <Check size={20} color={COLORS.blanc} strokeWidth={2.8} />
          </View>
          <Text style={styles.actionLabel}>
            {isConfirming ? 'Confirmer ?' : 'Publier'}
          </Text>
          <Text style={styles.actionSub}>
            {isConfirming ? 'Tap pour valider' : 'Glisser à droite'}
          </Text>
        </Pressable>
      </View>
    );
  };

  // Action Révélée à DROITE (Swipe vers la gauche -> Refuser / Supprimer)
  const renderRightActions = (
    _progress: SharedValue<number>,
    _drag: SharedValue<number>
  ) => {
    const isConfirming = confirmingAction === 'reject';
    return (
      <View style={styles.rightActionContainer}>
        <Pressable
          onPress={handleRejectPress}
          style={[
            styles.actionButton,
            styles.rejectButton,
            isConfirming && styles.rejectConfirmButton,
          ]}
        >
          <View style={styles.actionIconCircle}>
            <Trash2 size={20} color={COLORS.blanc} strokeWidth={2.5} />
          </View>
          <Text style={styles.actionLabel}>
            {isConfirming ? 'Confirmer ?' : 'Refuser'}
          </Text>
          <Text style={styles.actionSub}>
            {isConfirming ? 'Tap pour refuser' : 'Glisser à gauche'}
          </Text>
        </Pressable>
      </View>
    );
  };

  const authorName =
    article.author_name ||
    article.credits?.find((c) => c.role === 'Auteur')?.name ||
    'Citoyen local';

  return (
    <View style={styles.wrapper}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={50}
        rightThreshold={50}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        onSwipeableWillClose={() => {
          setConfirmingAction(null);
        }}
      >
        <View style={styles.card}>
          {/* Ligne Catégorie + Date */}
          <View style={styles.headerRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catEmoji}>
                {article.categorie?.icon || '📰'}
              </Text>
              <Text style={styles.catText}>
                {article.categorie?.libelle || 'Vie Locale'}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Clock size={12} color="#7D8680" />
              <Text style={styles.dateText}>En attente</Text>
            </View>
          </View>

          {/* Titre & Visuel */}
          <View style={styles.mainContentRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.title} numberOfLines={2}>
                {article.titre}
              </Text>
              <Text style={styles.excerpt} numberOfLines={2}>
                {article.excerpt}
              </Text>
            </View>

            {resolveImageUrl(article.image_couverture) ? (
              <Image
                source={{ uri: resolveImageUrl(article.image_couverture)! }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Text style={styles.placeholderEmoji}>
                  {article.categorie?.icon || '📝'}
                </Text>
              </View>
            )}
          </View>

          {/* Auteur + Actions */}
          <View style={styles.footerRow}>
            <View style={styles.authorBadge}>
              {article.is_anonymous ? (
                <>
                  <ShieldCheck size={13} color={COLORS.vert} />
                  <Text style={styles.authorText}>Citoyen Anonyme (RGPD)</Text>
                </>
              ) : (
                <>
                  <User size={13} color="#4A564E" />
                  <Text style={styles.authorText}>{authorName}</Text>
                </>
              )}
            </View>

            <Pressable
              onPress={() => onEdit(article)}
              style={styles.editButton}
              hitSlop={6}
            >
              <Edit3 size={13} color={COLORS.vert} />
              <Text style={styles.editText}>Relire & Éditer</Text>
              <ChevronRight size={13} color={COLORS.vert} />
            </Pressable>
          </View>

          {/* Indication visuelle de balayage */}
          <View style={styles.swipeHintRow}>
            <Text style={styles.swipeHintLeft}>👉 Glisser pour publier</Text>
            <Text style={styles.swipeHintRight}>Glisser pour refuser 👈</Text>
          </View>
        </View>
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3EFE8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  card: {
    backgroundColor: COLORS.blanc,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(209, 207, 201, 0.45)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE8',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  catEmoji: {
    fontSize: 12,
    marginRight: 5,
  },
  catText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#7D8680',
  },
  mainContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 15,
    color: COLORS.noir,
    lineHeight: 20,
    marginBottom: 4,
  },
  excerpt: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#5C6760',
    lineHeight: 17,
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#EBE7DE',
  },
  placeholderThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#F5F2EA',
    borderWidth: 1,
    borderColor: '#D8D4C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 26,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorText: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#4A564E',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EBF4F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  swipeHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
  },
  swipeHintLeft: {
    fontFamily: FONTS.montserrat,
    fontSize: 10,
    color: '#348B68',
    fontWeight: '500',
  },
  swipeHintRight: {
    fontFamily: FONTS.montserrat,
    fontSize: 10,
    color: '#C04B4B',
    fontWeight: '500',
  },
  leftActionContainer: {
    width: 105,
    backgroundColor: '#2E7D5B',
  },
  rightActionContainer: {
    width: 105,
    backgroundColor: '#C53030',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  approveButton: {
    backgroundColor: '#2E7D5B',
  },
  approveConfirmButton: {
    backgroundColor: '#1E5A40',
  },
  rejectButton: {
    backgroundColor: '#C53030',
  },
  rejectConfirmButton: {
    backgroundColor: '#9B2020',
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: COLORS.blanc,
    textAlign: 'center',
    fontWeight: '700',
  },
  actionSub: {
    fontFamily: FONTS.montserrat,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
});

