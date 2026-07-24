import { extname } from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Valide le type MIME et l'extension d'un fichier image.
 *
 * @param {string} mimetype - Le type MIME du fichier soumis.
 * @param {string} filename - Le nom de fichier d'origine.
 * @returns {string[]} Tableau contenant les messages d'erreurs de validation.
 */
export function validateImageFile(
  mimetype: string,
  filename: string,
): string[] {
  const errors: string[] = [];

  if (!ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase())) {
    errors.push(`Le type MIME "${mimetype}" n’est pas autorisé.`);
  }

  const extension = extname(filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    errors.push(`L’extension "${extension}" n’est pas autorisée.`);
  }

  return errors;
}
