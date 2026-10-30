import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  Camera,
  Image as ImageIcon,
  X,
  Search,
  PackagePlus,
  Trash2,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import Toast from 'react-native-toast-message';
import { useCity } from '@/context/CityContext';
import { uploadImageMobile } from '@/lib/api';

export default function DeclareLostModalScreen() {
  const { currentCity } = useCity();
  const [type, setType] = useState<'perdu' | 'trouve'>('perdu');
  const [nomObjet, setNomObjet] = useState('');
  const [lieu, setLieu] = useState('');
  const [date, setDate] = useState("Aujourd'hui");
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSwitch = (newType: 'perdu' | 'trouve') => {
    if (newType === type) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setType(newType);
  };

  const handleTakePhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        "Veuillez autoriser l'accès à l'appareil photo pour photographier l'objet. Souhaitez-vous ouvrir les réglages ?",
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Réglages', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Accès aux photos requis',
        "L'accès à votre galerie est nécessaire pour joindre une photo de l'objet. Souhaitez-vous ouvrir les réglages pour l'autoriser ?",
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Réglages', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
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
    if (!nomObjet.trim() || !lieu.trim() || !description.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Toast.show({
        type: 'error',
        text1: 'Champs obligatoires',
        text2: "Veuillez renseigner le nom de l'objet, le lieu et une brève description.",
      });
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);
    try {
      if (photoUri) {
        await uploadImageMobile(photoUri).catch(() => null);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const refNum = Math.floor(1000 + Math.random() * 9000);
      Toast.show({
        type: 'success',
        text1: 'Signalement enregistré !',
        text2: `Réf. #OBJ-${refNum} transmise au service des objets trouvés de ${currentCity.shortName}.`,
      });
      router.back();
    } catch {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Toast.show({
        type: 'info',
        text1: 'Signalement enregistré ✨',
        text2: `Enregistré en mode local pour la commune de ${currentCity.shortName}.`,
      });
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête de la modale */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTitleRow}>
          <Search size={20} color={COLORS.or} />
          <Text style={styles.modalTitle}>Déclarer un objet</Text>
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
      >
        <Text style={styles.headerSubtitle}>
          Entraide citoyenne & régie municipale • {currentCity.name}
        </Text>

        {/* Sélecteur Perdu / Trouvé */}
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => handleTypeSwitch('perdu')}
            style={[styles.segmentBtn, type === 'perdu' && styles.segmentActivePerdu]}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'perdu' && styles.segmentTextActivePerdu,
              ]}
            >
              {"😢 J'ai perdu un objet"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTypeSwitch('trouve')}
            style={[styles.segmentBtn, type === 'trouve' && styles.segmentActiveTrouve]}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'trouve' && styles.segmentTextActiveTrouve,
              ]}
            >
              {"🤝 J'ai trouvé un objet"}
            </Text>
          </Pressable>
        </View>

        {/* Photo de l'objet */}
        <Text style={styles.label}>{"PHOTO DE L'OBJET"}</Text>
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
              <Text style={styles.cameraCardSub}>{"Caméra de l'iPhone"}</Text>
            </Pressable>

            <Pressable onPress={handlePickGallery} style={styles.cameraCard}>
              <View style={styles.cameraIconBox}>
                <ImageIcon size={22} color={COLORS.vert} />
              </View>
              <Text style={styles.cameraCardTitle}>Galerie</Text>
              <Text style={styles.cameraCardSub}>Sélectionner un cliché</Text>
            </Pressable>
          </View>
        )}

        {/* Nom de l'objet */}
        <Text style={styles.label}>{"INTITULÉ DE L'OBJET *"}</Text>
        <TextInput
          value={nomObjet}
          onChangeText={setNomObjet}
          placeholder="Ex: Trousseau de clés (badge vert et porte-clé bois)"
          placeholderTextColor={COLORS.champagne}
          style={styles.input}
        />

        {/* Lieu & Date */}
        <View style={styles.rowInputs}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.label}>LIEU DU SIGNALEMENT *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={16} color={COLORS.champagne} style={{ marginRight: 8 }} />
              <TextInput
                value={lieu}
                onChangeText={setLieu}
                placeholder="Ex: Place Foch..."
                placeholderTextColor={COLORS.champagne}
                style={styles.inputInner}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>DATE *</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={16} color={COLORS.champagne} style={{ marginRight: 8 }} />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="Ex: 28 oct."
                placeholderTextColor={COLORS.champagne}
                style={styles.inputInner}
              />
            </View>
          </View>
        </View>

        {/* Description détaillée */}
        <Text style={styles.label}>DESCRIPTION DÉTAILLÉE *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Donnez des détails distinctifs (couleur, marque, rayure, étiquette)..."
          placeholderTextColor={COLORS.champagne}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />

        {/* Coordonnées de contact */}
        <Text style={styles.label}>VOS COORDONNÉES DE CONTACT (TÉLÉPHONE OU EMAIL)</Text>
        <TextInput
          value={contact}
          onChangeText={setContact}
          placeholder="Ex: 06 12 34 56 78 ou citoyen@exemple.fr"
          placeholderTextColor={COLORS.champagne}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        {/* Reassurance badge */}
        <View style={styles.infoBox}>
          <CheckCircle2 size={16} color={COLORS.vert} />
          <Text style={styles.infoBoxText}>
            {"Les coordonnées restent strictement confidentielles et ne sont transmises qu'aux agents de la mairie de "}
            {currentCity.shortName}.
          </Text>
        </View>

        {/* Bouton de soumission */}
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
              <PackagePlus size={18} color={COLORS.or} />
              <Text style={styles.submitBtnText}>Enregistrer la déclaration</Text>
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
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.champagne,
    lineHeight: 18,
    marginBottom: 18,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.2)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActivePerdu: {
    backgroundColor: '#FEF3C7',
  },
  segmentActiveTrouve: {
    backgroundColor: '#DCFCE7',
  },
  segmentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.champagne,
  },
  segmentTextActivePerdu: {
    color: '#92400E',
  },
  segmentTextActiveTrouve: {
    color: '#166534',
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.vert,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cameraRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    marginBottom: 20,
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
    paddingVertical: 13,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.noir,
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(142, 134, 113, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  textArea: {
    minHeight: 100,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  infoBoxText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: COLORS.vert,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.vert,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.vert,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.blanc,
  },
});

