import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Plus,
  Landmark,
  Newspaper,
  Tag,
  Briefcase,
  Users as UsersGroupIcon,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';

export type MainNavType = 'articles' | 'deals' | 'tools' | 'team';

interface AdminHeaderProps {
  mainNav: MainNavType;
  onSelectNav: (tab: MainNavType) => void;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  onBack: () => void;
}

export default function AdminHeader({
  mainNav,
  onSelectNav,
  title,
  subtitle,
  actionText,
  onAction,
  onBack,
}: AdminHeaderProps) {
  const handleNavPress = (tab: MainNavType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onSelectNav(tab);
  };

  return (
    <View style={styles.topHeader}>
      {/* Barre supérieure : retour et badge pro */}
      <View style={styles.topHeaderContent}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <ArrowLeft size={18} color={COLORS.blanc} />
          <Text style={styles.backButtonText}>Vue Lecteur</Text>
        </Pressable>

        <View style={styles.proBadge}>
          <Landmark size={12} color={COLORS.or} />
          <Text style={styles.proBadgeText}>Compte Pro Édition</Text>
        </View>
      </View>

      {/* Titre dynamique et bouton d'action principal */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.journalSubtitle}>{subtitle}</Text>
          <Text style={styles.journalName} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {actionText && onAction && (
          <Pressable onPress={onAction} style={styles.actionButton} hitSlop={6}>
            <Plus size={16} color={COLORS.noir} strokeWidth={2.8} />
            <Text style={styles.actionButtonText}>{actionText}</Text>
          </Pressable>
        )}
      </View>

      {/* Navigation principale à 4 onglets */}
      <View style={styles.mainNavRow}>
        <Pressable
          onPress={() => handleNavPress('articles')}
          style={[styles.mainNavItem, mainNav === 'articles' && styles.mainNavItemActive]}
        >
          <Newspaper
            size={14}
            color={mainNav === 'articles' ? COLORS.noir : 'rgba(255,255,255,0.75)'}
          />
          <Text
            style={[styles.mainNavItemText, mainNav === 'articles' && styles.mainNavItemTextActive]}
            numberOfLines={1}
          >
            Articles
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleNavPress('deals')}
          style={[styles.mainNavItem, mainNav === 'deals' && styles.mainNavItemActive]}
        >
          <Tag
            size={14}
            color={mainNav === 'deals' ? COLORS.noir : 'rgba(255,255,255,0.75)'}
          />
          <Text
            style={[styles.mainNavItemText, mainNav === 'deals' && styles.mainNavItemTextActive]}
            numberOfLines={1}
          >
            Bons plans
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleNavPress('tools')}
          style={[styles.mainNavItem, mainNav === 'tools' && styles.mainNavItemActive]}
        >
          <Briefcase
            size={14}
            color={mainNav === 'tools' ? COLORS.noir : 'rgba(255,255,255,0.75)'}
          />
          <Text
            style={[styles.mainNavItemText, mainNav === 'tools' && styles.mainNavItemTextActive]}
            numberOfLines={1}
          >
            Outils
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleNavPress('team')}
          style={[styles.mainNavItem, mainNav === 'team' && styles.mainNavItemActive]}
        >
          <UsersGroupIcon
            size={14}
            color={mainNav === 'team' ? COLORS.noir : 'rgba(255,255,255,0.75)'}
          />
          <Text
            style={[styles.mainNavItemText, mainNav === 'team' && styles.mainNavItemTextActive]}
            numberOfLines={1}
          >
            Équipe
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: COLORS.vert,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  topHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  backButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  proBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: COLORS.or,
    letterSpacing: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  journalSubtitle: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 10,
    color: COLORS.or,
    letterSpacing: 1.2,
  },
  journalName: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 20,
    color: COLORS.blanc,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.or,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.noir,
    fontWeight: '700',
  },
  mainNavRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 3,
    borderRadius: 14,
    gap: 4,
  },
  mainNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 11,
    gap: 4,
  },
  mainNavItemActive: {
    backgroundColor: COLORS.blanc,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mainNavItemText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  mainNavItemTextActive: {
    color: COLORS.noir,
    fontWeight: '700',
  },
});

