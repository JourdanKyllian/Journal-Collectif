/**
 * Formate un numéro de téléphone pour correspondre aux standards internationaux.
 * Convertit les numéros locaux FR (06...) en +33, gère le préfixe 00, et nettoie la saisie.
 */
export function formatInternationalPhone(
  value: string | undefined | null,
): string | null {
  if (!value || value.trim() === '') return null;

  // 1. Nettoyage : On supprime tous les espaces, tirets et points
  let cleaned = value.trim().replace(/[\s\-.]/g, '');

  // 2. Transformation du préfixe international "00" en "+"
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // 3. Gestion du format local français (commence par 0, fait 10 chiffres)
  if (cleaned.match(/^0[1-9]\d{8}$/)) {
    cleaned = '+33' + cleaned.slice(1);
  }

  // 4. Si l'utilisateur a oublié le '+' mais a rentré au moins 11 chiffres
  if (
    !cleaned.startsWith('+') &&
    cleaned.length >= 11 &&
    !cleaned.startsWith('0')
  ) {
    cleaned = '+' + cleaned;
  }

  // 5. Formatage avec espacement pour la lisibilité
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    return '+' + digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  return cleaned;
}
