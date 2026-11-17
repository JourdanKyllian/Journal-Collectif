import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CONSENT_STORAGE_KEY = 'jc_privacy_consent_choice';

export type ConsentChoice = 'all' | 'essential';

let memoryConsent: ConsentChoice | null = null;
let isLoaded = false;

export const ConsentService = {
  /**
   * Récupère le choix de consentement actuel (null si l'utilisateur ne s'est pas encore prononcé)
   */
  async getConsentChoice(): Promise<ConsentChoice | null> {
    if (isLoaded) return memoryConsent;
    try {
      if (Platform.OS === 'web') {
        isLoaded = true;
        return memoryConsent;
      }
      const saved = await SecureStore.getItemAsync(CONSENT_STORAGE_KEY);
      if (saved === 'all' || saved === 'essential') {
        memoryConsent = saved;
      } else {
        memoryConsent = null;
      }
      isLoaded = true;
      return memoryConsent;
    } catch {
      isLoaded = true;
      return null;
    }
  },

  /**
   * Enregistre le choix de consentement de l'utilisateur
   */
  async saveConsentChoice(choice: ConsentChoice): Promise<void> {
    memoryConsent = choice;
    isLoaded = true;
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(CONSENT_STORAGE_KEY, choice);
      } catch {
        // En cas d'erreur de stockage, le cache mémoire est préservé
      }
    }
  },

  /**
   * Réinitialise le choix pour permettre à l'utilisateur de reconfigurer ses préférences
   */
  async resetConsent(): Promise<void> {
    memoryConsent = null;
    isLoaded = true;
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(CONSENT_STORAGE_KEY);
      } catch {
        // Ignoré
      }
    }
  },
};
