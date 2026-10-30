import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
  FileText,
  Eye,
  Edit2,
  Bold,
  Italic,
  Heading2,
  Quote,
  List,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { uploadImageMobile } from '@/lib/api';
import { EditorialService } from '@/lib/services/editorial.service';
import { FeedService } from '@/lib/services/feed.service';
import SimpleMarkdownRenderer from '@/components/admin/SimpleMarkdownRenderer';

export default function MobileArticleEditorScreen() {
  const params = useLocalSearchParams();
  const editId = params.id ? Number(params.id) : undefined;

  const [categories, setCategories] = useState<
    { id: number; libelle: string; icon: string }[]
  >(() => MOCK_CATEGORIES.filter((c) => c.id !== 0));

  const [titre, setTitre] = useState<string>((params.initialTitre as string) || '');
  const [contenu, setContenu] = useState<string>((params.initialContenu as string) || '');
  const [categorieId, setCategorieId] = useState<number>(
    params.initialCategorieId ? Number(params.initialCategorieId) : 1
  );
  const [photoUri, setPhotoUri] = useState<string | null>(
    (params.initialImage as string) || null
  );

  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    FeedService.getCategories()
      .then((cats) => {
        if (!isMounted) return;
        const valid = cats.filter((c) => c.id !== 0);
        if (valid.length > 0) {
          setCategories(valid);
          const initialId = params.initialCategorieId
            ? Number(params.initialCategorieId)
            : undefined;
          const exists = initialId && valid.some((c) => c.id === initialId);
          if (exists) {
            setCategorieId(initialId);
          } else {
            setCategorieId(valid[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback silencieux sur MOCK_CATEGORIES
      });
    return () => {
      isMounted = false;
    };
  }, [params.initialCategorieId]);

  // Prise de photo directe avec la caméra native
  const handleTakePhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission requise',
        "L'accès à l'appareil photo est nécessaire pour capturer une illustration."
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
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Sélection dans la pellicule
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
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Insertion de balises de formatage rapide dans la zone de texte
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setContenu((prev) => `${prev}${prefix}${suffix}`);
  };

  // Sauvegarde (Publier ou Brouillon)
  const handleSave = async (statut: 'publie' | 'brouillon') => {
    if (!titre.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Titre manquant',
        text2: 'Veuillez saisir un titre pour votre article.',
      });
      return;
    }

    if (!contenu.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Contenu manquant',
        text2: 'Veuillez renseigner le texte de votre article.',
      });
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = photoUri;
      // Téléversement si nouvelle photo locale
      if (photoUri && !photoUri.startsWith('http')) {
        const uploadRes = await uploadImageMobile(photoUri);
        finalImageUrl = uploadRes.url;
      }

      await EditorialService.saveArticle({
        id: editId,
        titre,
        contenu,
        categorieId: selectedCat ? selectedCat.id : categorieId,
        image_couverture: finalImageUrl || undefined,
        statut,
        currentStatut: params.initialStatut as
          | 'publie'
          | 'brouillon'
          | 'en_attente'
          | undefined,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Toast.show({
        type: 'success',
        text1: statut === 'publie' ? 'Article publié ! 🚀' : 'Brouillon enregistré 📝',
        text2: titre,
      });

      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
      Toast.show({
        type: 'error',
        text1: 'Échec de sauvegarde',
        text2: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === categorieId) || categories[0];

  return (
    <View style={styles.container}>
      {/* Barre de navigation supérieure */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
        >
          <ArrowLeft size={20} color={COLORS.blanc} />
        </Pressable>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {editId ? "Modifier l'article" : 'Nouvel article'}
        </Text>

        {/* Sélecteur de mode Écriture vs Rendu */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setActiveMode('edit')}
            style={[styles.modeBtn, activeMode === 'edit' && styles.modeBtnActive]}
          >
            <Edit2 size={13} color={activeMode === 'edit' ? COLORS.noir : '#8E9A92'} />
            <Text
              style={[
                styles.modeBtnText,
                activeMode === 'edit' && styles.modeBtnTextActive,
              ]}
            >
              Édition
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveMode('preview')}
            style={[styles.modeBtn, activeMode === 'preview' && styles.modeBtnActive]}
          >
            <Eye size={13} color={activeMode === 'preview' ? COLORS.noir : '#8E9A92'} />
            <Text
              style={[
                styles.modeBtnText,
                activeMode === 'preview' && styles.modeBtnTextActive,
              ]}
            >
              Rendu
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeMode === 'edit' ? (
          <>
            {/* 1. PHOTO DE COUVERTURE */}
            <Text style={styles.fieldLabel}>PHOTO DE COUVERTURE (16:9)</Text>
            {photoUri ? (
              <View style={styles.coverPreviewBox}>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.coverImage}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  style={styles.removePhotoBtn}
                  hitSlop={6}
                >
                  <Trash2 size={14} color={COLORS.blanc} />
                  <Text style={styles.removePhotoText}>Supprimer</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoPickerRow}>
                <Pressable onPress={handleTakePhoto} style={styles.photoPickerCard}>
                  <View style={[styles.photoIconCircle, { backgroundColor: '#EAF4EE' }]}>
                    <Camera size={20} color={COLORS.vert} />
                  </View>
                  <Text style={styles.photoPickerTitle}>Appareil photo</Text>
                  <Text style={styles.photoPickerSub}>Prendre sur le vif</Text>
                </Pressable>

                <Pressable onPress={handlePickGallery} style={styles.photoPickerCard}>
                  <View style={[styles.photoIconCircle, { backgroundColor: '#F8F1DE' }]}>
                    <ImageIcon size={20} color={COLORS.or} />
                  </View>
                  <Text style={styles.photoPickerTitle}>Galerie</Text>
                  <Text style={styles.photoPickerSub}>Choisir une image</Text>
                </Pressable>
              </View>
            )}

            {/* 2. CHOIX DE LA CATÉGORIE */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
              CATÉGORIE THÉMATIQUE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catsRow}
            >
              {categories.map((c) => {
                const isSelected = c.id === categorieId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setCategorieId(c.id);
                    }}
                    style={[
                      styles.catPill,
                      isSelected && styles.catPillSelected,
                    ]}
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

            {/* 3. TITRE DE L'ARTICLE */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
              TITRE DE L&apos;ACTUALITÉ *
            </Text>
            <TextInput
              value={titre}
              onChangeText={setTitre}
              placeholder="Ex: Inauguration des nouveaux jardins partagés..."
              placeholderTextColor="#95A099"
              style={styles.titleInput}
              multiline
            />

            {/* 4. BARRE D'OUTILS DE FORMATAGE DU CONTENU */}
            <View style={styles.toolbarHeaderRow}>
              <Text style={styles.fieldLabel}>CONTENU DE L&apos;ARTICLE *</Text>
              <View style={styles.toolbar}>
                <Pressable
                  onPress={() => insertFormatting('**mot en gras**')}
                  style={styles.toolBtn}
                  hitSlop={4}
                  accessibilityLabel="Gras"
                >
                  <Bold size={14} color={COLORS.noir} />
                </Pressable>
                <Pressable
                  onPress={() => insertFormatting('*mot en italique*')}
                  style={styles.toolBtn}
                  hitSlop={4}
                  accessibilityLabel="Italique"
                >
                  <Italic size={14} color={COLORS.noir} />
                </Pressable>
                <Pressable
                  onPress={() => insertFormatting('\n## Titre de section\n')}
                  style={styles.toolBtn}
                  hitSlop={4}
                  accessibilityLabel="Sous-titre"
                >
                  <Heading2 size={14} color={COLORS.noir} />
                </Pressable>
                <Pressable
                  onPress={() => insertFormatting('\n> Citation remarquable\n')}
                  style={styles.toolBtn}
                  hitSlop={4}
                  accessibilityLabel="Citation"
                >
                  <Quote size={14} color={COLORS.noir} />
                </Pressable>
                <Pressable
                  onPress={() => insertFormatting('\n- Point clé\n')}
                  style={styles.toolBtn}
                  hitSlop={4}
                  accessibilityLabel="Liste"
                >
                  <List size={14} color={COLORS.noir} />
                </Pressable>
              </View>
            </View>

            <TextInput
              value={contenu}
              onChangeText={setContenu}
              placeholder="Rédigez ici votre article. Vous pouvez utiliser les boutons d'outils ci-dessus pour le gras, l'italique et les sous-titres..."
              placeholderTextColor="#95A099"
              multiline
              textAlignVertical="top"
              style={styles.contentInput}
            />
          </>
        ) : (
          /* --- MODE RENDU VISUEL LECTEUR (LIVE PREVIEW) --- */
          <View style={styles.previewContainer}>
            <View style={styles.previewHeaderCard}>
              <Text style={styles.previewNotice}>
                Aperçu fidèle du rendu sur l&apos;application des lecteurs
              </Text>
            </View>

            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={styles.previewHeroImage}
                contentFit="cover"
              />
            )}

            <View style={styles.previewBody}>
              <View style={styles.previewCatRow}>
                <View style={styles.previewCatBadge}>
                  <Text style={styles.previewCatEmoji}>{selectedCat.icon}</Text>
                  <Text style={styles.previewCatText}>{selectedCat.libelle}</Text>
                </View>
                <Text style={styles.previewDate}>Aujourd&apos;hui · Rédaction</Text>
              </View>

              <Text style={styles.previewTitle}>
                {titre || 'Titre de l’actualité...'}
              </Text>

              <View style={styles.previewDivider} />

              <SimpleMarkdownRenderer content={contenu} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Barre d'action inférieure */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => handleSave('brouillon')}
          disabled={isSubmitting}
          style={styles.draftButton}
        >
          <FileText size={16} color={COLORS.vert} />
          <Text style={styles.draftButtonText}>Brouillon</Text>
        </Pressable>

        <Pressable
          onPress={() => handleSave('publie')}
          disabled={isSubmitting}
          style={styles.publishButton}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.blanc} />
          ) : (
            <>
              <Check size={18} color={COLORS.blanc} strokeWidth={2.8} />
              <Text style={styles.publishButtonText}>
                {editId ? 'Mettre à jour' : 'Publier direct'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.vert,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 16,
    color: COLORS.blanc,
    flex: 1,
    marginHorizontal: 10,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 3,
    borderRadius: 20,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  modeBtnActive: {
    backgroundColor: COLORS.or,
  },
  modeBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#8E9A92',
  },
  modeBtnTextActive: {
    color: COLORS.noir,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 110,
  },
  fieldLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#5C6760',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coverPreviewBox: {
    position: 'relative',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#EBE7DE',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  removePhotoText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: COLORS.blanc,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoPickerCard: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2DED5',
    alignItems: 'center',
  },
  photoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoPickerTitle: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  photoPickerSub: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#7D8680',
    marginTop: 2,
  },
  catsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blanc,
    borderWidth: 1,
    borderColor: '#DDD9CF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  catPillSelected: {
    backgroundColor: COLORS.vert,
    borderColor: COLORS.vert,
  },
  catPillEmoji: {
    fontSize: 13,
    marginRight: 6,
  },
  catPillLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#424E46',
  },
  catPillLabelSelected: {
    color: COLORS.blanc,
  },
  titleInput: {
    backgroundColor: COLORS.blanc,
    borderWidth: 1,
    borderColor: '#E2DED5',
    borderRadius: 14,
    padding: 14,
    fontFamily: FONTS.poppinsBold,
    fontSize: 16,
    color: COLORS.noir,
    lineHeight: 22,
  },
  toolbarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#EDE9DF',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  toolBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.blanc,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInput: {
    backgroundColor: COLORS.blanc,
    borderWidth: 1,
    borderColor: '#E2DED5',
    borderRadius: 14,
    padding: 14,
    fontFamily: FONTS.montserrat,
    fontSize: 14,
    color: '#202923',
    lineHeight: 22,
    minHeight: 220,
  },
  previewContainer: {
    backgroundColor: COLORS.blanc,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD9CF',
    overflow: 'hidden',
  },
  previewHeaderCard: {
    backgroundColor: '#F3EFE6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E0D2',
  },
  previewNotice: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#656F68',
    textAlign: 'center',
  },
  previewHeroImage: {
    width: '100%',
    height: 200,
  },
  previewBody: {
    padding: 18,
  },
  previewCatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE8',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  previewCatEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  previewCatText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: COLORS.vert,
  },
  previewDate: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#8A928C',
  },
  previewTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 20,
    color: COLORS.noir,
    lineHeight: 27,
    marginBottom: 12,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#EBE7DE',
    marginVertical: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.blanc,
    borderTopWidth: 1,
    borderTopColor: '#E6E2D8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    flexDirection: 'row',
    gap: 12,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F0ECE3',
  },
  draftButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.vert,
  },
  publishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.vert,
  },
  publishButtonText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 14,
    color: COLORS.blanc,
    fontWeight: '700',
  },
});
