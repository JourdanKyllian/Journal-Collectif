// Liste des rôles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  REDACTEUR: 'redacteur',
  USER: 'utilisateur',
} as const;

// Matrice de permissions
export const PERMISSIONS = {
  // Accès global au dashboard
  dashboardAccess: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REDACTEUR],
  
  // Accès par section
  manageArticles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REDACTEUR],
  manageLostObjects: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REDACTEUR],
  manageAlerts: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  manageUsers: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  manageSettings: [ROLES.SUPER_ADMIN],
};

// Vérifie les droits
export const hasPermission = (
  userRole: string | null | undefined, 
  allowedRoles: string[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole.toLowerCase());
};