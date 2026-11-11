// ============================================================================
// KigaliFleet Row-Level Security & Super Admin Authorization Helpers
// ============================================================================

export const SUPER_ADMIN_EMAILS = [
  'generaskagiraneza@gmail.com',
  'generaskagiraneza9@gmail.com',
];

export const SUPER_ADMIN_PASSWORDS: Record<string, string> = {
  'generaskagiraneza@gmail.com': 'kg0f$2KG',
  'generaskagiraneza9@gmail.com': 'kg0f$9KG',
};

/**
 * Checks if a given email is a recognized Super Administrator.
 * Super Admin accounts are never publicly announced or displayed in public demo lists.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

/**
 * Validates whether the current user holds active Super Admin credentials.
 */
export function isSuperAdminUser(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  if (user.email && isSuperAdminEmail(user.email)) return true;
  return false;
}

/**
 * Verifies if entered password matches the Super Admin security key.
 */
export function verifySuperAdminPassword(email: string, passwordAttempt: string): boolean {
  const normalized = email.trim().toLowerCase();
  const validPass = SUPER_ADMIN_PASSWORDS[normalized];
  if (!validPass) return false;
  return passwordAttempt === validPass;
}
