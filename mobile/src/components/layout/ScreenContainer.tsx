import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

import { COLORS } from '@/theme/tokens';
import AppHeader from '@/components/navigation/AppHeader';

interface ScreenContainerProps {
  children: ReactNode;
  /** Titre optionnel passé au header */
  headerContextTitle?: string;
  /** Masquer le header si l'écran a son propre en-tête dédié */
  hideHeader?: boolean;
  style?: ViewStyle;
  edges?: Edge[];
}

export default function ScreenContainer({
  children,
  headerContextTitle,
  hideHeader = false,
  style,
  edges = ['top', 'left', 'right'],
}: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {!hideHeader && <AppHeader pageContextTitle={headerContextTitle} />}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
});

