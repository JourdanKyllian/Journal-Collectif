import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Sparkles,
  Clock,
  Copy,
  ExternalLink,
  Check,
  Store,
  Gift,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { BonPlan, DealCategory } from '@/lib/services/deals.service';

export interface DealCardProps {
  deal: BonPlan;
  index: number;
  isCopied: boolean;
  isParticipated: boolean;
  categoryLabels: Record<DealCategory | 'all', { label: string; icon: string }>;
  onCopyCode: (deal: BonPlan) => void;
  onParticipate: (deal: BonPlan) => void;
  onOpenLink: (deal: BonPlan) => void;
}

export default function DealCard({
  deal,
  index,
  isCopied,
  isParticipated,
  categoryLabels,
  onCopyCode,
  onParticipate,
  onOpenLink,
}: DealCardProps) {
  const getBadgeStyle = () => {
    switch (deal.categorie) {
      case 'concours':
        return { bg: '#FDF2D9', text: COLORS.or, border: '#F2D99C' };
      case 'billetterie':
        return { bg: '#E2F3EB', text: '#217346', border: '#C2E5D4' };
      case 'code_promo':
        return { bg: '#EBF4FF', text: '#2B6CB0', border: '#C3DAFE' };
      case 'restauration':
        return { bg: '#FEEBC8', text: '#C05621', border: '#FBD38D' };
      default:
        return { bg: '#F7FAFC', text: '#4A5568', border: '#E2E8F0' };
    }
  };

  const badgeStyle = getBadgeStyle();
  const catInfo = categoryLabels[deal.categorie];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify().damping(16)}
      style={styles.cardWrapper}
    >
      <View style={styles.card}>
        {deal.image && (
          <View style={styles.imageBox}>
            <Image
              source={{ uri: deal.image }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
            <View style={[styles.valueTag, { backgroundColor: COLORS.vert }]}>
              <Text style={styles.valueTagText}>{deal.valeur}</Text>
            </View>

            {deal.estExclusif && (
              <View style={styles.exclusiveBadge}>
                <Sparkles size={11} color={COLORS.noir} />
                <Text style={styles.exclusiveBadgeText}>Exclusivité Citoyenne</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
              ]}
            >
              <Text style={[styles.categoryPillText, { color: badgeStyle.text }]}>
                {catInfo?.icon} {catInfo?.label || deal.categorie}
              </Text>
            </View>

            <View style={styles.partnerRow}>
              <Store size={12} color="#718096" />
              <Text style={styles.partnerName} numberOfLines={1}>
                {deal.partenaire}
              </Text>
            </View>
          </View>

          <Text style={styles.dealTitle}>{deal.titre}</Text>
          <Text style={styles.dealDescription} numberOfLines={2}>
            {deal.description}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.clockRow}>
              <Clock size={12} color="#A0AEC0" />
              <Text style={styles.dateText}>Valable jusqu&apos;au {deal.dateFin}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {deal.codePromo && (
              <Pressable
                onPress={() => onCopyCode(deal)}
                style={[
                  styles.codeBtn,
                  isCopied && styles.codeBtnCopied,
                ]}
              >
                {isCopied ? (
                  <>
                    <Check size={14} color="#FFFFFF" />
                    <Text style={[styles.codeBtnText, { color: '#FFFFFF' }]}>
                      {deal.codePromo} copié !
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color={COLORS.vert} />
                    <Text style={styles.codeBtnText}>
                      Code : <Text style={styles.codeTextBold}>{deal.codePromo}</Text>
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            {deal.categorie === 'concours' && (
              <Pressable
                onPress={() => onParticipate(deal)}
                style={[
                  styles.participateBtn,
                  isParticipated && styles.participateBtnDone,
                ]}
              >
                {isParticipated ? (
                  <>
                    <Check size={14} color={COLORS.vert} />
                    <Text style={styles.participateBtnDoneText}>Inscrit au tirage</Text>
                  </>
                ) : (
                  <>
                    <Gift size={14} color={COLORS.noir} />
                    <Text style={styles.participateBtnText}>Participer au jeu</Text>
                  </>
                )}
              </Pressable>
            )}

            {deal.lienUrl && (
              <Pressable
                onPress={() => onOpenLink(deal)}
                style={styles.linkBtn}
                hitSlop={6}
              >
                <Text style={styles.linkBtnText}>
                  {deal.categorie === 'billetterie' ? 'Réserver' : 'Voir l’offre'}
                </Text>
                <ExternalLink size={12} color={COLORS.vert} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageBox: {
    width: '100%',
    height: 150,
    backgroundColor: '#EDF2F7',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  valueTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  valueTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.or,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exclusiveBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    letterSpacing: 0.3,
  },
  cardContent: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 160,
  },
  partnerName: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#718096',
  },
  dealTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    marginBottom: 6,
    lineHeight: 22,
  },
  dealDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#4A5568',
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    marginBottom: 12,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#A0AEC0',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.vert,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  codeBtnCopied: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
    borderStyle: 'solid',
  },
  codeBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.vert,
  },
  codeTextBold: {
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  participateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.or,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  participateBtnDone: {
    backgroundColor: '#E2F3EB',
  },
  participateBtnText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  participateBtnDoneText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.vert,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  linkBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.vert,
  },
});
