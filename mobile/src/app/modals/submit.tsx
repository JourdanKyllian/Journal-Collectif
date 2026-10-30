import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  Camera,
  Image as ImageIcon,
  X,
  ShieldCheck,
  Send,
  Trash2,
  Newspaper,
  LogIn,
  AlertCircle,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import Toast from 'react-native-toast-message';
import { apiClient, uploadImageMobile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FeedService } from '@/lib/services/feed.service';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

export default function SubmitArticleModalScreen() {
  const { isLoggedIn } = useAuth();

  const [categories, setCategories] = useState<
    { id: number; libelle: string; icon: string }[]
  >(() => MOCK_CATEGORIES.filter((c) => c.id !== 0));
  const [selectedCategorieId, setSelectedCategorieId] = useState<number>(
    categories[0]?.id ?? 1
  );

  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    FeedService.getCategories()
      .then((cats) => {
        if (!isMounted) return;
        const valid = cats.filter((c) => c.id !== 0);
        if (valid.length > 0) {
          setCategories(valid);
          setSelectedCategorieId(valid[0].id);
        }
      })
      .catch(() => {
        // Fallback silencieux sur mock
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Prise de photo native
  const handleTakePhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        "Veuillez autoriser l'accès à l'appareil photo dans les réglages de votre téléphone."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Sélection depuis la galerie
  const handlePickGallery = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      Toast.show({
        type: 'error',
        text1: 'Connexion requise',
        text2: 'Veuillez vous connecter pour proposer un article.',
      });
      router.push('/modals/login');
      return;
    }

    if (!titre.trim() || !contenu.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Toast.show({
        type: 'error',
        text1: 'Champs manquants',
        text2: 'Veuillez renseigner un titre et un contenu pour votre article.',
      });
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl: string | undefined;
      if (photoUri) {
        const uploadRes = await uploadImageMobile(photoUri);
        uploadedUrl = uploadRes.url;
      }

      const payload: Record<string, unknown> = {
        titre: titre.trim(),
        contenu: `<p>${contenu.trim()}</p>`,
        categorieId: selectedCategorieId,
        is_anonymous: isAnonymous,
      };

      if (uploadedUrl && uploadedUrl.trim()) {
        payload.image_couverture = uploadedUrl.trim();
      }

      await apiClient('/article', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Toast.show({
        type: 'success',
        text1: 'Article envoyé ! 🎉',
        text2: 'Votre proposition a bien été soumise au comité éditorial.',
      });
      router.back();
    } catch (err: unknown) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const rawMsg = err instanceof Error ? err.message : 'Une erreur est survenue';
      let title = 'Échec de soumission';
      let desc = rawMsg;

      if (rawMsg.toLowerCase().includes('téléphone') || rawMsg.toLowerCase().includes('verifies')) {
        title = 'Vérification requise';
        desc = 'Votre numéro de téléphone doit être vérifié pour proposer des articles.';
      } else if (rawMsg.toLowerCase().includes('catégorie')) {
        title = 'Catégorie invalide';
        desc = 'Veuillez choisir une autre catégorie pour votre article.';
      }

      Toast.show({
        type: 'error',
        text1: title,
        text2: desc,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête de la modale */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTitleRow}>
          <Newspaper size={20} color={COLORS.or} />
          <Text style={styles.modalTitle}>Proposer un article</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityLabel="Fermer"
        >
          <X size={20} color={COLORS.blanc} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isLoggedIn && (
          <View style={styles.authBanner}>
            <AlertCircle size={20} color={COLORS.or} />
            <View style={{ flex: 1 }}>
              <Text style={styles.authBannerTitle}>Connexion requise</Text>
              <Text style={styles.authBannerText}>
                Connectez-vous à votre compte citoyen pour soumettre un article au comité éditorial.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/modals/login')}
              style={styles.authLoginBtn}
            >
              <LogIn size={15} color={COLORS.noir} />
              <Text style={styles.authLoginBtnText}>Connexion</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.headerSubtitle}>
          Partagez une initiative, un événement ou une actualité de votre commune avec vos concitoyens.
        </Text>

        {/* SÉLECTION DE LA CATÉGORIE */}
        <Text style={styles.label}>CATÉGORIE THÉMATIQUE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catsRow}
        >
          {categories.map((c) => {
            const isSelected = c.id === selectedCategorieId;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setSelectedCategorieId(c.id);
                }}
                style={[styles.catPill, isSelected && styles.catPillSelected]}
              >
                <Text style={styles.catPillEmoji}>{c.icon}</Text>
                <Text
                  style={[
                    styles.catPillLabel,
                    isSelected && styles.catPillLabelSelected,
                  ]}
                >
                  {c.libelle}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* MODULE NATIF : APPAREIL PHOTO & GALERIE */}
        <Text style={[styles.label, { marginTop: 18 }]}>{"PHOTO D'ILLUSTRATION"}</Text>
        {photoUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} contentFit="cover" />
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={styles.removePhotoBtn}
              hitSlop={6}
            >
              <Trash2 size={15} color={COLORS.blanc} />
              <Text style={styles.removePhotoText}>Supprimer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraRow}>
            <Pressable onPress={handleTakePhoto} style={styles.cameraCard}>
              <View style={styles.cameraIconBox}>
                <Camera size={22} color={COLORS.or} />
              </View>
              <Text style={styles.cameraCardTitle}>Prendre une photo</Text>
              <Text style={styles.cameraCardSub}>Caméra native</Text>
            </Pressable>

            <Pressable onPress={handlePickGallery} style={styles.cameraCard}>
              <View style={styles.cameraIconBox}>
                <ImageIcon size={22} color={COLORS.vert} />
              </View>
              <Text style={styles.cameraCardTitle}>Galerie</Text>
              <Text style={styles.cameraCardSub}>Parcourir vos images</Text>
            </Pressable>
          </View>
        )}

        {/* CHAMPS DE SAISIE */}
        <Text style={styles.label}>{"TITRE DE L'ACTUALITÉ *"}</Text>
        <TextInput
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex: Succès de la première brocante solidaire..."
          placeholderTextColor={COLORS.champagne}
          style={styles.input}
        />

        <Text style={styles.label}>{"CONTENU DE L'ARTICLE *"}</Text>
        <TextInput
          value={contenu}
          onChangeText={setContenu}
          placeholder="Racontez les faits, les détails pratiques ou l'histoire de cette initiative locale..."
          placeholderTextColor={COLORS.champagne}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />

        {/* OPTION D'ANONYMAT RGPD */}
        <View style={styles.rgpdCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.rgpdTitleRow}>
              <ShieldCheck size={16} color={COLORS.vert} />
              <Text style={styles.rgpdTitle}>Anonymat citoyen (RGPD)</Text>
            </View>
            <Text style={styles.rgpdDesc}>
              Masque votre nom au public (« Citoyen Anonyme »). La rédaction locale conserve la traçabilité.
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: '#D1CFC9', true: COLORS.or }}
            thumbColor={COLORS.vert}
          />
        </View>

        {/* BOUTON D'ENVOI */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.blanc} />
          ) : (
            <>
              <Send size={17} color={COLORS.or} />
              <Text style={styles.submitBtnText}>Soumettre au comité de rédaction</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  modalHeader: {
    backgroundColor: COLORS.vert,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.blanc,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: 20,
    paddingBottom: 48,
  },
  authBanner: {
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.or,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  authBannerTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  authBannerText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.champagne,
    marginTop: 2,
  },
  authLoginBtn: {
    backgroundColor: COLORS.or,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  authLoginBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.noir,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.champagne,
    lineHeight: 18,
    marginBottom: 20,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  catsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.3)',
  },
  catPillSelected: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  catPillEmoji: {
    fontSize: 14,
  },
  catPillLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.champagne,
  },
  catPillLabelSelected: {
    color: COLORS.blanc,
    fontFamily: FONTS.bodyBold,
  },
  cameraRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  cameraCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(142, 134, 113, 0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cameraIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraCardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  cameraCardSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    marginTop: 2,
  },
  previewContainer: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 22,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  removePhotoText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.blanc,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.noir,
    marginBottom: 18,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  rgpdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 51, 30, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: 'rgba(20, 51, 30, 0.1)',
  },
  rgpdTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rgpdTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.vert,
  },
  rgpdDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.champagne,
    lineHeight: 16,
    paddingRight: 8,
  },
  submitBtn: {
    backgroundColor: COLORS.vert,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.noir,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.blanc,
  },
});
