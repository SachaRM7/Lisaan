// src/utils/admin-check.ts
// Vérification admin pour l'écran analytics (bêta fermée)

// Remplacer par les emails réels des administrateurs
const ADMIN_EMAILS: readonly string[] = [
  'sacha@lisaan.app',
  'sacha4dev@gmail.com',
];

/**
 * Retourne true si l'email correspond à un admin.
 * La comparaison est case-insensitive.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
