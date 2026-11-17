import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { X, ShieldCheck, Lock, Trash2, EyeOff, Scale, HeartHandshake } from 'lucide-react-native';
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
            Confidentialité &amp; Mentions Légales
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
          Le Journal Collectif s&apos;engage à garantir un service transparent, citoyen et hautement sécurisé,
          dans le strict respect du Règlement Général sur la Protection des Données (RGPD n° 2016/679) et
          des directives de la CNIL.
        </Text>

        {/* Section 1 : Éditeur & Mentions Légales */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Scale size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>1. Éditeur & Mentions Légales</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Éditeur du service</Text> : Association Collectif Territorial (Loi 1901),
            œuvrant pour l&apos;information et l&apos;entraide locale.{'\n'}
            • <Text style={styles.bold}>Directeur de la publication</Text> : Équipe de rédaction du Collectif.{'\n'}
            • <Text style={styles.bold}>Hébergement souverain</Text> : Infrastructure conteneurisée sécurisée (Distroless),
            bases PostgreSQL chiffrées au repos, située sur le territoire européen.
          </Text>
        </View>

        {/* Section 2 : Données collectées & Finalités (RGPD) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <EyeOff size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>2. Données Personnelles & Finalités (RGPD)</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Compte Citoyen</Text> : Nom, prénom, email et mot de passe chiffré (bcrypt).
            Utilisés uniquement pour l&apos;accès à votre espace et la signature de vos contributions.{'\n'}
            • <Text style={styles.bold}>Position Géographique</Text> : Vos coordonnées GPS ne sont utilisées
            que localement sur l&apos;appareil pour vous suggérer l&apos;édition communale la plus proche. Elles ne
            sont ni tracées ni conservées sur nos serveurs.{'\n'}
            • <Text style={styles.bold}>Zéro Vente</Text> : Aucune donnée personnelle n&apos;est vendue, louée ou transmise
            à des tiers ou régies publicitaires.
          </Text>
        </View>

        {/* Section 3 : Sécurité & Chiffrement matériel */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Lock size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>3. Sécurité Mobile & Chiffrement</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Chiffrement des flux</Text> : Toutes les communications avec l&apos;API s&apos;effectuent
            exclusivement via TLS/HTTPS chiffré.{'\n'}
            • <Text style={styles.bold}>Trousseau sécurisé</Text> : Vos jetons d&apos;authentification et vos données
            hors-ligne sont stockés dans l&apos;enclave sécurisée de votre téléphone (iOS Keychain / Android Keystore).
          </Text>
        </View>

        {/* Section 4 : CGU & Charte de Modération Citoyenne */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <HeartHandshake size={18} color={COLORS.vert} />
            <Text style={styles.sectionTitle}>4. Conditions d&apos;Utilisation & Charte Citoyenne</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Gratuité</Text> : L&apos;application est entièrement libre et gratuite pour les citoyens.{'\n'}
            • <Text style={styles.bold}>Bienveillance & Modération</Text> : Tout propos haineux, diffamatoire ou illicite entraîne la suspension immédiate du compte.{'\n'}
            • <Text style={styles.bold}>Objets Trouvés</Text> : Le service sert de passerelle bénévole d&apos;entraide. Le Collectif ne saurait être tenu responsable des pertes, vols ou dégradations lors des restitutions entre particuliers.
          </Text>
        </View>

        {/* Section 5 : Droit à l'effacement */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Trash2 size={18} color="#DC2626" />
            <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>
              5. Droit à l&apos;Effacement (Article 17 RGPD)
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Vous disposez d&apos;un droit inconditionnel à l&apos;effacement définitif de toutes vos données.
            Vous pouvez à tout instant supprimer immédiatement votre compte depuis l&apos;onglet « Sécurité »
            de votre profil dans l&apos;application.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour : Novembre 2026 • Version 1.0 (Conforme RGPD & CNIL)
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
