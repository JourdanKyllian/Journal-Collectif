import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function ErrorState({
  title = 'Impossible de charger les données',
  message = 'Une erreur est survenue lors de la synchronisation. Vérifiez votre connexion internet.',
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRetry();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AlertTriangle size={32} color="#DC2626" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={handlePress}
        disabled={isRetrying}
        style={[styles.retryBtn, isRetrying && { opacity: 0.6 }]}
        hitSlop={8}
      >
        <RefreshCw size={15} color={COLORS.blanc} />
        <Text style={styles.retryText}>
          {isRetrying ? 'Chargement...' : 'Réessayer'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.noir,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
  },
});
