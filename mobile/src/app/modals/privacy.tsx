import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { X, ShieldCheck, Lock, Trash2, EyeOff, FileText, Cookie } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS } from '@/theme/tokens';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicyModal() {
  const { theme } = useTheme();

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ShieldCheck size={22} color={COLORS.or} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Politique de Confidentialité
          </Text>
        </View>
        <Pressable
          onPress={handleClose}
          style={styles.closeBtn}
          accessibilityLabel="Fermer la politique de confidentialité"
        >
          <X size={20} color={COLORS.champagne} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>
          Le Journal Collectif s&apos;engage à garantir un traitement loyal, transparent et sécurisé de
          vos données personnelles, conformément au Règlement Général sur la Protection des Données
          (RGPD n° 2016/679).
        </Text>

        {/* Section 1 : Responsable de traitement */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <FileText size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>1. Responsable du Traitement</Text>
          </View>
          <Text style={styles.paragraph}>
            Les données sont traitées par le Collectif Territorial sous l&apos;égide de la commune éditrice
            sélectionnée. Aucune donnée n&apos;est vendue, louée ou cédée à des fins commerciales ou
            publicitaires tierces.
          </Text>
        </View>

        {/* Section 2 : Données collectées */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <EyeOff size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>2. Données Collectées & Finalités</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Compte & Authentification</Text> : Adresse email, nom, prénom,
            mot de passe haché (bcrypt). Utilisés pour l&apos;accès aux services citoyens et la publication
            d&apos;articles ou signalements.{'\n'}
            • <Text style={styles.bold}>Position Géographique</Text> : Vos coordonnées GPS ne sont
            utilisées que localement pour vous proposer l&apos;édition communale la plus proche. Elles ne
            sont jamais enregistrées sur nos serveurs.{'\n'}
            • <Text style={styles.bold}>Données locales hors-ligne</Text> : Vos articles favoris et
            votre cache sont chiffrés sur le matériel via le trousseau sécurisé (Keychain / Keystore).
          </Text>
        </View>

        {/* Section 3 : Traceurs & Cookies */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Cookie size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>3. Traceurs & Données Locales (Cookies)</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Traceurs Essentiels (Indispensables)</Text> : Utilisés pour
            maintenir votre session connectée, sécuriser vos requêtes et retenir l&apos;édition communale
            active. Ils ne requièrent pas de consentement et ne peuvent pas être désactivés sans
            rendre l&apos;authentification inopérante.{'\n'}
            • <Text style={styles.bold}>Traceurs Optionnels (Mesure citoyenne)</Text> : Mesures
            anonymisées de lecture d&apos;articles permettant au collectif d&apos;adapter les rubriques.
            Le refus des traceurs optionnels ne bloque aucune fonctionnalité de l&apos;application.
          </Text>
        </View>

        {/* Section 4 : Sécurité du stockage */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Lock size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>4. Sécurité & Chiffrement</Text>
          </View>
          <Text style={styles.paragraph}>
            Les échanges réseau sont protégés par un protocole TLS chiffré de bout en bout. Les
            sessions mobiles utilisent des jetons d&apos;accès JWT temporaires stockés dans l&apos;enclave
            sécurisée de votre système d&apos;exploitation.
          </Text>
        </View>

        {/* Section 5 : Droit à l'effacement */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Trash2 size={18} color="#DC2626" />
            <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>
              5. Droit à l&apos;Effacement (Droit à l&apos;Oubli)
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Conformément à l&apos;article 17 du RGPD, vous disposez d&apos;un droit inconditionnel à
            l&apos;effacement de l&apos;ensemble de vos données personnelles. Vous pouvez procéder à tout moment
            à la suppression définitive et instantanée de votre compte depuis l&apos;onglet Sécurité de
            votre profil dans l&apos;application.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour : Novembre 2026 • Version 1.0 (Conforme RGPD)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 16 : 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.15)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 134, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 40,
  },
  lead: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.noir,
    lineHeight: 21,
    marginBottom: 20,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.15)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.vert,
  },
  paragraph: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.noir,
    lineHeight: 19,
  },
  bold: {
    fontFamily: FONTS.bodyBold,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    textAlign: 'center',
  },
});
