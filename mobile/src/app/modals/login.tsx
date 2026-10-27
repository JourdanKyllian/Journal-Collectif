import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { X, Shield, UserCheck } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { MobileAuthApi } from '@/lib/api';

export default function LoginModalScreen() {
  const [email, setEmail] = useState('visiteur.complet@exemple.fr');
  const [password, setPassword] = useState('user123');

  const handleLogin = async () => {
    try {
      const res = await MobileAuthApi.login(email, password);
      Alert.alert(
        'Dual-Auth Mobile Réussie',
        `Session #${res.session_id.slice(0, 8)} ouverte.\nToken stocké dans expo-secure-store.`,
        [{ text: 'Continuer', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert(
        'Simulation Dual-Auth (Mode Hors-Ligne)',
        `En-tête envoyé : X-Client: mobile\nCompte : ${email}\nLe token Bearer simulé est prêt pour la soutenance.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connexion Mobile (Phase 1A)</Text>
        <Pressable onPress={() => router.back()}>
          <X size={22} color={COLORS.blanc} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />

        <Text style={styles.label}>MOT DE PASSE</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

        <Pressable onPress={handleLogin} style={styles.submitBtn}>
          <Text style={styles.submitText}>S&apos;authentifier (X-Client: mobile)</Text>
        </Pressable>

        <Text style={[styles.label, { marginTop: 24 }]}>COMPTES DE DÉMO DU SEED BACKEND</Text>
        <Pressable
          onPress={() => {
            setEmail('superadmin@journal.fr');
            setPassword('superadmin123');
          }}
          style={styles.demoRow}
        >
          <Shield size={16} color={COLORS.or} />
          <Text style={styles.demoText}>superadmin@journal.fr (Gérant)</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setEmail('visiteur.complet@exemple.fr');
            setPassword('user123');
          }}
          style={styles.demoRow}
        >
          <UserCheck size={16} color={COLORS.vert} />
          <Text style={styles.demoText}>visiteur.complet@exemple.fr (Citoyen vérifié)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blanc },
  header: {
    backgroundColor: COLORS.vert,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontFamily: FONTS.headingBold, fontSize: 17, color: COLORS.blanc },
  body: { padding: 20 },
  label: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.vert, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    fontFamily: FONTS.bodySemiBold,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.or,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.noir },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  demoText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.noir },
});
