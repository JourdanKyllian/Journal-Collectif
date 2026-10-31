import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface CategoryItem {
  id: number;
  libelle: string;
  icon: string;
  description: string;
}

interface NotificationPreferencesSectionProps {
  categories: CategoryItem[];
  subscribedCategoryIds: number[];
  currentCityShortName: string;
  onToggleCategory: (id: number, label: string) => void;
  onTriggerTestAlert: () => void;
}

export default function NotificationPreferencesSection({
  categories,
  subscribedCategoryIds,
  currentCityShortName,
  onToggleCategory,
  onTriggerTestAlert,
}: NotificationPreferencesSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ABONNEMENTS THÉMATIQUES</Text>
      <Text style={styles.sectionHint}>
        Choisissez les rubriques prioritaires pour vos notifications sur l&apos;ensemble de vos éditions.
      </Text>

      <View style={styles.notifContainer}>
        {categories.map((cat) => {
          const isSub = subscribedCategoryIds.includes(cat.id);
          return (
            <View key={cat.id} style={styles.notifRow}>
              <View style={styles.notifEmojiBox}>
                <Text style={styles.notifEmoji}>{cat.icon}</Text>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.notifLabel}>{cat.libelle}</Text>
                <Text style={styles.notifDesc} numberOfLines={1}>
                  {cat.description}
                </Text>
              </View>
              <Switch
                value={isSub}
                onValueChange={() => onToggleCategory(cat.id, cat.libelle)}
                trackColor={{ false: '#D1CFC9', true: COLORS.or }}
                thumbColor={isSub ? COLORS.vert : '#FFF'}
              />
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        TEST DU DISPOSITIF D&apos;ALERTES
      </Text>
      <Pressable onPress={onTriggerTestAlert} style={styles.demoBtn} hitSlop={6}>
        <BellRing size={18} color={COLORS.or} />
        <Text style={styles.demoBtnText}>
          Déclencher une alerte test sur {currentCityShortName}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.vert,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#718096',
    marginBottom: 14,
    lineHeight: 17,
  },
  notifContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifEmoji: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
    marginRight: 10,
  },
  notifLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.noir,
    marginBottom: 2,
  },
  notifDesc: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: '#718096',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(209, 160, 84, 0.4)',
    marginTop: 10,
  },
  demoBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.noir,
  },
});
