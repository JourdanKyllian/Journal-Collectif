import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Search, Car } from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import LostObjectsView from '@/components/tools/LostObjectsView';
import AdminParkingView from '@/components/admin/AdminParkingView';

export type ToolsSubType = 'lost' | 'parking';

interface AdminToolsViewProps {
  currentSubType?: ToolsSubType;
  onSubTypeChange?: (subType: ToolsSubType) => void;
}

export default function AdminToolsView({
  currentSubType,
  onSubTypeChange,
}: AdminToolsViewProps) {
  const [internalSubType, setInternalSubType] = useState<ToolsSubType>('lost');
  const activeSubType = currentSubType ?? internalSubType;

  const handleSubNavChange = (subType: ToolsSubType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setInternalSubType(subType);
    onSubTypeChange?.(subType);
  };

  return (
    <View style={styles.container}>
      {/* Sous-sélecteur ordonné à l'identique de la vue visiteur : 1. Objets perdus, 2. Parkings */}
      <View style={styles.toolsSubNav}>
        {/* 1. Objets Perdus & Trouvés */}
        <Pressable
          onPress={() => handleSubNavChange('lost')}
          style={[styles.toolsSubItem, activeSubType === 'lost' && styles.toolsSubItemActive]}
        >
          <Search size={14} color={activeSubType === 'lost' ? COLORS.noir : '#7D8680'} />
          <Text
            style={[
              styles.toolsSubItemText,
              activeSubType === 'lost' && styles.toolsSubItemTextActive,
            ]}
          >
            Objets trouvés & perdus
          </Text>
        </Pressable>

        {/* 2. Parkings & Affluence */}
        <Pressable
          onPress={() => handleSubNavChange('parking')}
          style={[styles.toolsSubItem, activeSubType === 'parking' && styles.toolsSubItemActive]}
        >
          <Car size={14} color={activeSubType === 'parking' ? COLORS.noir : '#7D8680'} />
          <Text
            style={[
              styles.toolsSubItemText,
              activeSubType === 'parking' && styles.toolsSubItemTextActive,
            ]}
          >
            Parkings & Affluence
          </Text>
        </Pressable>
      </View>

      {/* Affichage direct de l'outil sélectionné */}
      <View style={{ flex: 1 }}>
        {activeSubType === 'lost' ? <LostObjectsView /> : <AdminParkingView />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolsSubNav: {
    flexDirection: 'row',
    backgroundColor: '#EAE6DD',
    borderRadius: 14,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  toolsSubItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 6,
  },
  toolsSubItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toolsSubItemText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#7D8680',
  },
  toolsSubItemTextActive: {
    color: COLORS.noir,
    fontWeight: '700',
  },
});

