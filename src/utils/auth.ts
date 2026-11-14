// ============================================================================
// KigaliFleet Row-Level Security & Super Admin Authorization Helpers
// ============================================================================

import {
  AdminPermissionAction,
  PlatformAdmin,
  SuperAdminModuleId,
  SuperAdminSubRole,
} from '../types';

export const SUPER_ADMIN_EMAILS = [
  'generaskagiraneza@gmail.com',
  'generaskagiraneza9@gmail.com',
];

// Domain-salted SHA-256 digests (`email:password`) — zero plaintext credentials in bundle
const SUPER_ADMIN_CREDENTIAL_DIGESTS: Record<string, string> = {
  'generaskagiraneza@gmail.com': '4bd659f35b6e2ef7046902d376ddd59b2d1f75b7a24d8a91e3c4b44ce1bd711e',
  'generaskagiraneza9@gmail.com': '3724c43191c465ea63c6493dad72f065eb05e3e5fe6a97d45030c91b2946e274',
};

// Pure synchronous SHA-256 implementation for browser & Node verification
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256Hex(ascii: string): string {
  const maxWord = Math.pow(2, 32);
  const words: number[] = [];
  const bytes: number[] = [];

  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }

  const asciiBitLength = bytes.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);

  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] | 0
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Checks if a given email is a recognized master Super Administrator (Platform Owner).
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
 * Verifies if entered password matches the salted SHA-256 Super Admin credential digest.
 */
export function verifySuperAdminPassword(email: string, passwordAttempt: string): boolean {
  const normalized = email.trim().toLowerCase();
  const expectedDigest = SUPER_ADMIN_CREDENTIAL_DIGESTS[normalized];
  if (!expectedDigest || !passwordAttempt) return false;
  const attemptDigest = sha256Hex(`${normalized}:${passwordAttempt}`);
  return attemptDigest === expectedDigest;
}

// ============================================================================
// Granular Superadmin Sub-Role Permission Matrix (PRD Section 6 & 9)
// ============================================================================

const ALL_ACTIONS: AdminPermissionAction[] = [
  'view',
  'create',
  'edit',
  'approve',
  'suspend',
  'delete',
  'export',
  'configure',
];

const ALL_MODULES: SuperAdminModuleId[] = [
  'overview',
  'companies',
  'users',
  'subscriptions',
  'plans',
  'saas_payments',
  'revenue',
  'bookings',
  'fleet',
  'support',
  'notifications',
  'analytics',
  'integrations',
  'health',
  'security',
  'audit',
  'content',
  'settings',
  'admins',
];

export function getDefaultRolePermissions(
  subRole: SuperAdminSubRole
): Partial<Record<SuperAdminModuleId, AdminPermissionAction[]>> {
  if (subRole === 'platform_owner') {
    const full: Partial<Record<SuperAdminModuleId, AdminPermissionAction[]>> = {};
    ALL_MODULES.forEach((m) => {
      full[m] = [...ALL_ACTIONS];
    });
    return full;
  }

  if (subRole === 'platform_admin') {
    return {
      overview: ['view', 'export'],
      companies: ['view', 'create', 'edit', 'approve', 'suspend', 'export'],
      users: ['view', 'edit', 'suspend', 'export'],
      subscriptions: ['view', 'edit', 'approve', 'export'],
      plans: ['view', 'edit'],
      saas_payments: ['view', 'export'],
      revenue: ['view', 'export'],
      bookings: ['view', 'export'],
      fleet: ['view', 'export'],
      support: ['view', 'create', 'edit', 'approve'],
      notifications: ['view', 'create', 'edit', 'configure'],
      analytics: ['view', 'export'],
      integrations: ['view'],
      health: ['view'],
      security: ['view'],
      audit: ['view', 'export'],
      content: ['view', 'create', 'edit', 'approve'],
      settings: ['view'],
      admins: ['view'],
    };
  }

  if (subRole === 'finance_admin') {
    return {
      overview: ['view', 'export'],
      companies: ['view'],
      subscriptions: ['view', 'edit', 'approve', 'export'],
      plans: ['view', 'create', 'edit', 'configure'],
      saas_payments: ['view', 'edit', 'approve', 'export'],
      revenue: ['view', 'export'],
      analytics: ['view', 'export'],
      audit: ['view', 'export'],
      settings: ['view', 'configure'],
    };
  }

  if (subRole === 'support_admin') {
    return {
      overview: ['view'],
      companies: ['view', 'edit'],
      users: ['view', 'edit'],
      bookings: ['view'],
      fleet: ['view'],
      support: ['view', 'create', 'edit', 'approve'],
      notifications: ['view', 'create'],
      content: ['view', 'edit'],
    };
  }

  if (subRole === 'technical_admin') {
    return {
      overview: ['view'],
      integrations: ['view', 'edit', 'configure'],
      health: ['view', 'edit', 'configure'],
      notifications: ['view', 'edit', 'configure'],
      analytics: ['view', 'export'],
      audit: ['view'],
      settings: ['view', 'configure'],
    };
  }

  // security_admin
  return {
    overview: ['view'],
    companies: ['view', 'suspend'],
    users: ['view', 'suspend', 'edit'],
    security: ['view', 'edit', 'approve', 'suspend', 'configure', 'export'],
    audit: ['view', 'export'],
    admins: ['view', 'suspend'],
  };
}

export function hasPlatformPermission(
  admin: PlatformAdmin | undefined | null,
  moduleId: SuperAdminModuleId,
  action: AdminPermissionAction = 'view',
  fallbackEmail?: string
): boolean {
  if (fallbackEmail && isSuperAdminEmail(fallbackEmail)) return true;
  if (!admin) return false;
  if (admin.status !== 'Active') return false;
  if (admin.sub_role === 'platform_owner' || isSuperAdminEmail(admin.email)) return true;
  const modulePerms = admin.permissions?.[moduleId];
  return Array.isArray(modulePerms) && modulePerms.includes(action);
}

/**
 * Prevents privilege self-escalation: only Platform Owners can edit other Platform Owners
 * or promote an administrator to `platform_owner`.
 */
export function canModifyPlatformAdmin(
  actor: PlatformAdmin | undefined | null,
  targetAdmin: PlatformAdmin,
  nextSubRole?: SuperAdminSubRole
): { allowed: boolean; reason?: string } {
  const actorIsOwner =
    actor?.sub_role === 'platform_owner' || isSuperAdminEmail(actor?.email);
  if (!actor || actor.status !== 'Active') {
    return { allowed: false, reason: 'Inactive or unrecognized administrator account.' };
  }
  if (!actorIsOwner && targetAdmin.sub_role === 'platform_owner') {
    return {
      allowed: false,
      reason: 'Only Platform Owners can modify another Platform Owner account.',
    };
  }
  if (!actorIsOwner && nextSubRole === 'platform_owner') {
    return {
      allowed: false,
      reason: 'Only Platform Owners can grant Platform Owner privileges.',
    };
  }
  if (
    targetAdmin.sub_role === 'platform_owner' &&
    isSuperAdminEmail(targetAdmin.email) &&
    nextSubRole &&
    nextSubRole !== 'platform_owner'
  ) {
    return {
      allowed: false,
      reason: 'Master Platform Owner accounts cannot be downgraded.',
    };
  }
  return { allowed: true };
}
