import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, Check, X, ShieldCheck } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { AiCorrectionResult } from '@/lib/services/ai-assistant.service';

interface AiAssistantModalProps {
  visible: boolean;
  result: AiCorrectionResult | null;
  onApply: (improvedText: string, improvedTitle?: string) => void;
  onDismiss: () => void;
}

export default function AiAssistantModal({
  visible,
  result,
  onApply,
  onDismiss,
}: AiAssistantModalProps) {
  if (!result) return null;

  const handleApply = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onApply(result.improvedText, result.improvedTitle);
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Sparkles size={18} color={COLORS.or} />
              </View>
              <View>
                <Text style={styles.title}>Assistant de Relecture IA</Text>
                <Text style={styles.subtitle}>Clarté citoyenne & fluidité de style</Text>
              </View>
            </View>
            <Pressable onPress={handleDismiss} hitSlop={8}>
              <X size={20} color={COLORS.champagne} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Badge de respect éthique */}
            <View style={styles.ethicsBadge}>
              <ShieldCheck size={14} color="#16A34A" />
              <Text style={styles.ethicsText}>
                Vos idées et votre sens d&apos;origine sont 100% préservés.
              </Text>
            </View>

            {/* Améliorations clés */}
            {result.highlights.length > 0 && (
              <View style={styles.highlightsContainer}>
                {result.highlights.map((h, i) => (
                  <View key={i} style={styles.highlightPill}>
                    <Text style={styles.highlightText}>✓ {h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Comparaison */}
            <Text style={styles.sectionLabel}>Proposition de reformulation :</Text>
            <View style={styles.boxImproved}>
              <Text style={styles.textImproved}>{result.improvedText}</Text>
            </View>

            <Text style={styles.sectionLabelOriginal}>Texte d&apos;origine :</Text>
            <View style={styles.boxOriginal}>
              <Text style={styles.textOriginal}>{result.originalText}</Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable onPress={handleDismiss} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Garder l&apos;original</Text>
            </Pressable>
            <Pressable onPress={handleApply} style={styles.btnApply}>
              <Check size={16} color={COLORS.blanc} />
              <Text style={styles.btnApplyText}>Appliquer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.blanc,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.15)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.noir,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  ethicsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  ethicsText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#15803D',
    flex: 1,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  highlightPill: {
    backgroundColor: 'rgba(11, 28, 16, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  sectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.vert,
    marginBottom: 6,
  },
  boxImproved: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.or,
    marginBottom: 14,
  },
  textImproved: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.noir,
    lineHeight: 20,
  },
  sectionLabelOriginal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.champagne,
    marginBottom: 4,
  },
  boxOriginal: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(142, 134, 113, 0.08)',
    marginBottom: 20,
  },
  textOriginal: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 134, 113, 0.15)',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.champagne,
  },
  btnApply: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.vert,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnApplyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.blanc,
  },
});
