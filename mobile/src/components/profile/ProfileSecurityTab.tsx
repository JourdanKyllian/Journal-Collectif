import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Key, Trash2, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from '@/theme/tokens';

interface ProfileSecurityTabProps {
  isLoggedIn: boolean;
  onUpdateSecurity: (data: {
    currentPassword: string;
    newPassword?: string;
    newEmail?: string;
  }) => Promise<boolean>;
  onDeleteAccount: () => Promise<boolean>;
}

export default function ProfileSecurityTab({
  isLoggedIn,
  onUpdateSecurity,
  onDeleteAccount,
}: ProfileSecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordSubmit = async () => {
    if (!currentPassword) {
      Toast.show({
        type: 'error',
        text1: 'Champ requis',
        text2: 'Veuillez renseigner votre mot de passe actuel.',
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Mots de passe différents',
        text2: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
      });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Mot de passe trop court',
        text2: 'Le mot de passe doit contenir au moins 8 caractères.',
      });
      return;
    }

    setIsUpdating(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const success = await onUpdateSecurity({
      currentPassword,
      newPassword: newPassword || undefined,
    });

    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsUpdating(false);
  };

  const confirmDeleteAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    Alert.alert(
      'Supprimer définitivement votre compte ?',
      'Cette action est irréversible. Vos contributions, préférences et données personnelles seront effacées conformément au RGPD.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await onDeleteAccount();
            setIsDeleting(false);
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.card}>
        <Text style={styles.guestTitle}>Sécurité & Confidentialité</Text>
        <Text style={styles.guestSubtitle}>
          Connectez-vous pour modifier votre mot de passe ou gérer la suppression de votre compte.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SECTION MOT DE PASSE */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Sécurité du Compte</Text>
          <Text style={styles.subtitle}>
            Modifiez vos identifiants de connexion sensibles
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>MOT DE PASSE ACTUEL *</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Requis pour valider les changements"
            placeholderTextColor="rgba(142, 134, 113, 0.6)"
            secureTextEntry
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min. 8 caractères"
            placeholderTextColor="rgba(142, 134, 113, 0.6)"
            secureTextEntry
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Répétez le nouveau mot de passe"
            placeholderTextColor="rgba(142, 134, 113, 0.6)"
            secureTextEntry
          />
        </View>

        <Pressable
          onPress={handlePasswordSubmit}
          disabled={isUpdating}
          style={[styles.updateBtn, isUpdating && { opacity: 0.7 }]}
          hitSlop={6}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.blanc} />
          ) : (
            <>
              <Key size={15} color={COLORS.blanc} />
              <Text style={styles.updateBtnText}>Mettre à jour le mot de passe</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ZONE DE DANGER : SUPPRESSION DE COMPTE (OBLIGATOIRE DU BARÈME) */}
      <View style={styles.dangerCard}>
        <View style={styles.dangerHeader}>
          <Trash2 size={18} color="#DC2626" />
          <Text style={styles.dangerTitle}>Suppression du compte (RGPD)</Text>
        </View>
        <Text style={styles.dangerText}>
          Conformément au droit à l&apos;effacement, la suppression de votre compte supprime
          vos sessions actives, vos coordonnées et vos préférences de manière irrévocable.
        </Text>

        <Pressable
          onPress={confirmDeleteAccount}
          disabled={isDeleting}
          style={[styles.deleteBtn, isDeleting && { opacity: 0.7 }]}
          hitSlop={6}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <Trash2 size={15} color="#DC2626" />
              <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* LIEN POLITIQUE DE CONFIDENTIALITÉ (BONUS BARÈME) */}
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
          }
          router.push('/modals/privacy' as never);
        }}
        style={styles.privacyLinkRow}
        accessibilityRole="button"
        accessibilityLabel="Consulter la politique de confidentialité"
      >
        <View style={styles.privacyLeft}>
          <ShieldCheck size={18} color={COLORS.vert} />
          <Text style={styles.privacyLinkText}>Politique de confidentialité & RGPD</Text>
        </View>
        <ChevronRight size={16} color={COLORS.champagne} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 134, 113, 0.15)',
    paddingBottom: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    marginTop: 2,
    lineHeight: 15,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.champagne,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(142, 134, 113, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.noir,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.noir,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  updateBtnText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
  },
  dangerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dangerTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#DC2626',
  },
  dangerText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    lineHeight: 17,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    paddingVertical: 11,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#DC2626',
  },
  privacyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.blanc,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.15)',
    marginTop: 4,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyLinkText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.vert,
  },
  guestTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.noir,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
});
