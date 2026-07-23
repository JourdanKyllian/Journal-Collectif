import { validateImageFile } from './image.validator';

describe('validateImageFile - Sécurité & Format', () => {
  it('devrait valider un fichier JPEG conforme', () => {
    const errors = validateImageFile('image/jpeg', 'photo.jpg');
    expect(errors).toHaveLength(0);
  });

  it('devrait valider un fichier PNG conforme', () => {
    const errors = validateImageFile('image/png', 'illustration.png');
    expect(errors).toHaveLength(0);
  });

  it('devrait valider un fichier WEBP conforme', () => {
    const errors = validateImageFile('image/webp', 'banner.webp');
    expect(errors).toHaveLength(0);
  });

  it('devrait rejeter un type MIME non autorisé', () => {
    const errors = validateImageFile('application/pdf', 'document.pdf');
    expect(errors).toContain('Le type MIME "application/pdf" n’est pas autorisé.');
  });

  it('devrait rejeter une extension de fichier non autorisée', () => {
    const errors = validateImageFile('image/jpeg', 'script.exe');
    expect(errors).toContain('L’extension ".exe" n’est pas autorisée.');
  });

  it('devrait rejeter une tentative de double extension malveillante', () => {
    const errors = validateImageFile('image/png', 'image.png.php');
    expect(errors).toContain('L’extension ".php" n’est pas autorisée.');
  });
});
