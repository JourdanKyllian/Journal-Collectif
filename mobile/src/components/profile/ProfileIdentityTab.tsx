import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Save, Check } from 'lucide-react-native';
import { COLORS, FONTS } from '@/theme/tokens';
import { UserProfile } from '@/context/AuthContext';

const AVATAR_OPTIONS = [
  { id: 'default_01', color: '#217346', label: 'Vert' },
  { id: 'default_02', color: '#D4AF37', label: 'Or' },
  { id: 'default_03', color: '#1F2937', label: 'Noir' },
  { id: 'default_04', color: '#C5B498', label: 'Champagne' },
];

interface ProfileIdentityTabProps {
  user: UserProfile | null;
  isLoggedIn: boolean;
  onSave: (data: {
    firstname?: string;
    lastname?: string;
    tel?: string;
    bio?: string;
    avatar_ref?: string;
  }) => Promise<boolean>;
}

export default function ProfileIdentityTab({
  user,
  isLoggedIn,
  onSave,
}: ProfileIdentityTabProps) {
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [tel, setTel] = useState(user?.tel || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarRef, setAvatarRef] = useState(user?.avatar_ref || 'default_01');
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectAvatar = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAvatarRef(id);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) return;
    setIsSaving(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await onSave({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      tel: tel.trim(),
      bio: bio.trim(),
      avatar_ref: avatarRef,
    });
    setIsSaving(false);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.card}>
        <Text style={styles.guestTitle}>Connectez-vous pour gérer votre identité</Text>
        <Text style={styles.guestSubtitle}>
          La personnalisation du profil citoyen et la signature de vos contributions nécessitent un compte.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Profil Public</Text>
          <Text style={styles.subtitle}>
            Ces informations sont visibles sur vos articles et contributions
          </Text>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isSaving}
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          hitSlop={6}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.blanc} />
          ) : (
            <>
              <Save size={14} color={COLORS.blanc} />
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.formGrid}>
        <View style={styles.fieldCol}>
          <Text style={styles.label}>PRÉNOM</Text>
          <TextInput
            style={styles.input}
            value={firstname}
            onChangeText={setFirstname}
            placeholder="Ex: Jean"
            placeholderTextColor="rgba(142, 134, 113, 0.6)"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldCol}>
          <Text style={styles.label}>NOM</Text>
          <TextInput
            style={styles.input}
            value={lastname}
            onChangeText={setLastname}
            placeholder="Ex: Dupont"
            placeholderTextColor="rgba(142, 134, 113, 0.6)"
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
        <TextInput
          style={styles.input}
          value={tel}
          onChangeText={setTel}
          placeholder="+33 6 12 34 56 78"
          placeholderTextColor="rgba(142, 134, 113, 0.6)"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>BIOGRAPHIE (AUTEURS)</Text>
          <Text style={styles.charCount}>{bio.length}/250</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={bio}
          onChangeText={(text) => {
            if (text.length <= 250) setBio(text);
          }}
          placeholder="Présentez votre activité ou votre engagement local..."
          placeholderTextColor="rgba(142, 134, 113, 0.6)"
          multiline
          numberOfLines={3}
          maxLength={250}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>COULEUR D&apos;AVATAR</Text>
        <View style={styles.avatarColorRow}>
          {AVATAR_OPTIONS.map((item) => {
            const isSelected = avatarRef === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectAvatar(item.id)}
                style={[
                  styles.avatarColorCircle,
                  { backgroundColor: item.color },
                  isSelected && styles.avatarColorCircleSelected,
                ]}
                hitSlop={6}
              >
                {isSelected && <Check size={18} color="#FFFFFF" strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.blanc,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.noir,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.blanc,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  fieldCol: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.champagne,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  charCount: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.champagne,
    opacity: 0.7,
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
  textarea: {
    height: 74,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  avatarColorRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  avatarColorCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarColorCircleSelected: {
    borderColor: COLORS.noir,
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
