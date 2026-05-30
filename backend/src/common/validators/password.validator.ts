export function isValidPassword(password: string): string[] {
  // Liste de toutes les règles dans un tableau (Condition d'erreur + Message)
  const regles = [
    { enErreur: password.length < 12, message: 'faire au moins 12 caractères' },
    { enErreur: !/[A-Z]/.test(password), message: 'contenir au moins une majuscule' },
    { enErreur: !/[a-z]/.test(password), message: 'contenir au moins une minuscule' },
    { enErreur: !/[0-9]/.test(password), message: 'contenir au moins un chiffre' },
    { enErreur: !/[^A-Za-z0-9]/.test(password), message: 'contenir au moins un caractère spécial' },
  ];

  // Filtre ce qui est en erreur, et on extrait juste le message
  return regles
    .filter(regle => regle.enErreur)
    .map(regle => regle.message);
}