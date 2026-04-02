export function validerEmail(email: string | null): string[] {
  // Sécurité : si c'est null, on le transforme en chaîne vide
  const emailStr = email || '';
  
  // On extrait le préfixe et le domaine seulement si le @ est présent
  const [prefixe, domaine] = emailStr.includes('@') ? emailStr.split('@') : ['', ''];

  // Liste de toutes les règles
  const regles = [
    { enErreur: emailStr.trim() === '', message: 'être renseignée' },
    { enErreur: emailStr.trim() !== '' && !emailStr.includes('@'), message: 'contenir un symbole @' },
    { enErreur: emailStr.includes('@') && !prefixe, message: 'contenir un identifiant avant le @' },
    { enErreur: emailStr.includes('@') && !domaine, message: 'contenir un domaine après le @' },
    { enErreur: emailStr.trim() !== '' && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr), message: 'respecter le format standard (ex: nom@domaine.fr)' },
  ];

  // Filtre ce qui est en erreur et extrait le message
  return regles
    .filter(regle => regle.enErreur)
    .map(regle => regle.message);
}