import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Formate un numéro de téléphone pour correspondre aux standards internationaux.
 * Utilise la norme mondiale pour appliquer les bons espacements selon le pays.
 */
export function formatInternationalPhone(
  value: string | undefined | null,
): string | null {
  if (!value || value.trim() === '') return null;

  let cleaned = value.trim();

  // On convertit manuellement les "00" en "+" pour forcer la détection internationale
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // On parse le numéro. Par défaut, on assume que c'est un numéro FR ('FR') si aucun '+' n'est tapé (ex: 06...)
  const phoneNumber = parsePhoneNumberFromString(cleaned, 'FR');

  // Si la librairie reconnaît le numéro comme valide
  if (phoneNumber && phoneNumber.isValid()) {
    // Renvoie le format parfait (ex: +33 6 12 34 56 78, +41 79 123 45 67, +1 213-373-4253)
    return phoneNumber.formatInternational();
  }

  // Fallback si le numéro est vraiment étrange : on le nettoie au max, la Regex des DTOs le rejettera si besoin
  return cleaned.replace(/[\s\-.]/g, '');
}
