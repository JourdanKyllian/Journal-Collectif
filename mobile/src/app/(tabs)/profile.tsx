import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { UserCheck, LogIn, Globe, BellRing } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { COLORS, FONTS } from '@/theme/tokens';
import { TenantStorage } from '@/lib/api';

export default function ProfileScreen() {
  const [tenant, setTenant] = useState('collectif-chalonnais');

  const switchTenant = async (newSlug: string) => {
    setTenant(newSlug);
    await TenantStorage.setTenant(newSlug);
    Alert.alert('Multi-Tenant (X-Journal)', `En-tête HTTP basculé sur : ${newSlug}`);
  };

  const triggerInstantNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Test Direct Jury : Alerte Mairie',
        body: 'Démonstration instantanée du module natif expo-notifications.',
        data: { articleId: '1' },
      },
      trigger: null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Espace Citoyen</Text>
        <Text style={styles.subtitle}>Authentification Bearer & Multi-Tenant</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserCheck size={28} color={COLORS.or} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Citoyen Engagé</Text>
            <Text style={styles.email}>visiteur.complet@exemple.fr</Text>
          </View>
          <Pressable
            onPress={() => router.push('/modals/login')}
            style={styles.loginBtn}
          >
            <LogIn size={16} color={COLORS.noir} />
            <Text style={styles.loginBtnText}>Dual-Auth</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>TENANT ACTIF (HEADER X-JOURNAL)</Text>
        {['collectif-chalonnais', 'mairie-epernay', 'vitry-le-francois'].map((slug) => (
          <Pressable
            key={slug}
            onPress={() => switchTenant(slug)}
            style={[styles.tenantRow, tenant === slug && styles.tenantActive]}
          >
            <Globe size={18} color={tenant === slug ? COLORS.or : COLORS.champagne} />
            <Text style={styles.tenantText}>{slug}</Text>
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 22 }]}>OUTIL DE SOUTENANCE JURY</Text>
        <Pressable onPress={triggerInstantNotification} style={styles.demoBtn}>
          <BellRing size={18} color={COLORS.or} />
          <Text style={styles.demoBtnText}>
            Tester une notification immédiate (ou réduisez l&apos;app 5s)
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blanc },
  header: { backgroundColor: COLORS.vert, padding: 20 },
  title: { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.or },
  subtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.blanc, marginTop: 4 },
  content: { padding: 20 },
  profileCard: {
    backgroundColor: COLORS.vert,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.noir,
    borderWidth: 2,
    borderColor: COLORS.or,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: FONTS.headingBold, fontSize: 16, color: COLORS.blanc },
  email: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.champagne },
  loginBtn: {
    backgroundColor: COLORS.or,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loginBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.noir },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  tenantActive: {
    borderWidth: 1.5,
    borderColor: COLORS.or,
  },
  tenantText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.noir },
  demoBtn: {
    backgroundColor: COLORS.noir,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  demoBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.blanc },
});
