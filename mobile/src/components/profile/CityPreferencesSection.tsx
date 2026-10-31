import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import {
  Landmark,
  Check,
  Star,
  Bell,
  Trash2,
  Compass,
  Plus,
} from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { City } from '@/context/CityContext';

interface CityPreferencesSectionProps {
  currentCity: City;
  followedCities: City[];
  isPrimary: (slug: string) => boolean;
  isProManager: boolean;
  hasAlertsEnabled: (slug: string) => boolean;
  onSwitchCity: (slug: string) => void;
  onSetPrimary: (slug: string) => void;
  onToggleAlerts: (slug: string) => void;
  onRemoveFollowed: (slug: string, name: string) => void;
  onOpenDirectory: () => void;
}

export default function CityPreferencesSection({
  currentCity,
  followedCities,
  isPrimary,
  isProManager,
  hasAlertsEnabled,
  onSwitchCity,
  onSetPrimary,
  onToggleAlerts,
  onRemoveFollowed,
  onOpenDirectory,
}: CityPreferencesSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          MES ÉDITIONS TERRITORIALES ({followedCities.length})
        </Text>
        {isProManager ? (
          <View style={styles.proLockedBadge}>
            <Text style={styles.proLockedBadgeText}>Édition liée</Text>
          </View>
        ) : (
          <Pressable onPress={onOpenDirectory} style={styles.addEditionLink} hitSlop={6}>
            <Plus size={14} color={COLORS.vert} />
            <Text style={styles.addEditionLinkText}>Ajouter</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.sectionHint}>
        Sélectionnez les journaux locaux dont vous souhaitez suivre l&apos;actualité et recevoir les alertes.
      </Text>

      <View style={styles.editionsContainer}>
        {followedCities.map((city) => {
          const isSelected = city.slug === currentCity.slug;
          const isThisPrimary = isPrimary(city.slug);
          const alertsActive = hasAlertsEnabled(city.slug);

          return (
            <View
              key={city.slug}
              style={[
                styles.editionCard,
                isSelected && styles.editionCardActive,
              ]}
            >
              <Pressable
                onPress={() => onSwitchCity(city.slug)}
                style={styles.editionTopRow}
              >
                <View
                  style={[
                    styles.editionIconBox,
                    isSelected && styles.editionIconBoxActive,
                  ]}
                >
                  <Landmark
                    size={20}
                    color={isSelected ? COLORS.blanc : COLORS.champagne}
                  />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={styles.editionNameRow}>
                    <Text
                      style={[
                        styles.editionName,
                        isSelected && styles.editionNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {city.name}
                    </Text>
                    <View style={styles.postalBadge}>
                      <Text style={styles.postalText}>{city.postalCode}</Text>
                    </View>
                  </View>
                  <Text style={styles.editionJournalType} numberOfLines={1}>
                    {city.nomJournal || city.typeJournal || 'Journal territorial'}
                  </Text>
                </View>

                <View style={styles.statusBadgesCol}>
                  {isSelected ? (
                    <View style={styles.activeTag}>
                      <Check size={11} color={COLORS.blanc} strokeWidth={3} />
                      <Text style={styles.activeTagText}>Actif</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onSwitchCity(city.slug)}
                      style={styles.activateBtn}
                    >
                      <Text style={styles.activateBtnText}>Consulter</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>

              <View style={styles.editionDivider} />

              <View style={styles.editionOptionsRow}>
                <Pressable
                  onPress={() => onSetPrimary(city.slug)}
                  style={[
                    styles.primaryOptionBtn,
                    isThisPrimary && styles.primaryOptionBtnActive,
                  ]}
                  hitSlop={6}
                >
                  <Star
                    size={13}
                    color={isThisPrimary ? COLORS.or : COLORS.champagne}
                    fill={isThisPrimary ? COLORS.or : 'transparent'}
                  />
                  <Text
                    style={[
                      styles.primaryOptionText,
                      isThisPrimary && styles.primaryOptionTextActive,
                    ]}
                  >
                    {isThisPrimary ? 'Édition principale' : 'Définir principale'}
                  </Text>
                </Pressable>

                <View style={styles.notifToggleContainer}>
                  <Bell
                    size={13}
                    color={alertsActive ? COLORS.vert : COLORS.champagne}
                  />
                  <Text style={styles.notifToggleLabel}>Alertes</Text>
                  <Switch
                    value={alertsActive}
                    onValueChange={() => onToggleAlerts(city.slug)}
                    trackColor={{ false: '#D1CFC9', true: COLORS.or }}
                    thumbColor={alertsActive ? COLORS.vert : '#FFF'}
                    style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                  />
                </View>

                {followedCities.length > 1 && !isThisPrimary && (
                  <Pressable
                    onPress={() => onRemoveFollowed(city.slug, city.name)}
                    hitSlop={8}
                    style={styles.deleteEditionBtn}
                    accessibilityLabel={`Ne plus suivre ${city.name}`}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        <Pressable onPress={onOpenDirectory} style={styles.addJournalButton}>
          <Compass size={18} color={COLORS.vert} />
          <Text style={styles.addJournalButtonText}>
            Explorer l&apos;annuaire des journaux locaux
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.vert,
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#718096',
    marginBottom: 14,
    lineHeight: 17,
  },
  proLockedBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proLockedBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: '#4A5568',
  },
  addEditionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  addEditionLinkText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.vert,
  },
  editionsContainer: {
    gap: 12,
  },
  editionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  editionCardActive: {
    borderColor: COLORS.vert,
    borderWidth: 2,
  },
  editionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  editionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  editionIconBoxActive: {
    backgroundColor: COLORS.vert,
  },
  editionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  editionName: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.noir,
  },
  editionNameActive: {
    color: COLORS.vert,
    fontFamily: FONTS.bold,
  },
  postalBadge: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  postalText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#718096',
  },
  editionJournalType: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#718096',
  },
  statusBadgesCol: {
    alignItems: 'flex-end',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.vert,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
  },
  activateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  activateBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#475569',
  },
  editionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  editionOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FAFBFB',
  },
  primaryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  primaryOptionBtnActive: {},
  primaryOptionText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#718096',
  },
  primaryOptionTextActive: {
    color: COLORS.or,
    fontFamily: FONTS.semiBold,
  },
  notifToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifToggleLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#718096',
  },
  deleteEditionBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  addJournalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    marginTop: 4,
  },
  addJournalButtonText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.vert,
  },
});
