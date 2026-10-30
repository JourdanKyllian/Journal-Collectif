import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { X, Shield, UserCheck, Mail, Lock, LogIn, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { COLORS, FONTS } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';

export default function LoginModalScreen() {
  const { login } = useAuth();
  const { currentCity } = useCity();

  const [email, setEmail] = useState('visiteur.complet@exemple.fr');
  const [password, setPassword] = useState('user123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        router.back();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCapsule}>
            <Sparkles size={18} color={COLORS.or} />
          </View>
          <View>
            <Text style={styles.title}>Espace Citoyen</Text>
            <Text style={styles.subtitle}>Édition de {currentCity.shortName}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityLabel="Fermer la fenêtre de connexion"
        >
          <X size={20} color={COLORS.blanc} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(280)}>
          {/* Champ Email */}
          <Text style={styles.label}>ADRESSE EMAIL</Text>
          <View style={styles.inputWrapper}>
            <Mail size={18} color={COLORS.champagne} style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre.email@exemple.fr"
              placeholderTextColor={COLORS.champagne}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {/* Champ Mot de Passe */}
          <Text style={styles.label}>MOT DE PASSE</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color={COLORS.champagne} style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.champagne}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* Bouton de Soumission */}
          <Pressable
            onPress={handleLogin}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              isSubmitting && { opacity: 0.75 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.blanc} size="small" />
            ) : (
              <>
                <LogIn size={18} color={COLORS.blanc} />
                <Text style={styles.submitText}>Se connecter</Text>
              </>
            )}
          </Pressable>

          {/* Comptes de test en un clic */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>COMPTES DE DÉMONSTRATION</Text>
            <Text style={styles.demoSectionHint}>
              Appuyez pour préremplir instantanément un profil de test :
            </Text>

            <Pressable
              onPress={() => setDemoAccount('visiteur.complet@exemple.fr', 'user123')}
              style={styles.demoCard}
            >
              <View style={[styles.demoIconBox, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
                <UserCheck size={18} color={COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoRole}>Citoyen Engagé</Text>
                <Text style={styles.demoEmail}>visiteur.complet@exemple.fr</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setDemoAccount('superadmin@journal.fr', 'superadmin123')}
              style={styles.demoCard}
            >
              <View style={[styles.demoIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                <Shield size={18} color={COLORS.or} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoRole}>Gérant de Rédaction (Super Admin)</Text>
                <Text style={styles.demoEmail}>superadmin@journal.fr</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  header: {
    backgroundColor: COLORS.vert,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCapsule: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: COLORS.blanc,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.vert,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.blanc,
    letterSpacing: -0.2,
  },
  demoSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 134, 113, 0.18)',
  },
  demoSectionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: COLORS.champagne,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  demoSectionHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    lineHeight: 16,
    marginBottom: 14,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  demoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoRole: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  demoEmail: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 1,
  },
});
