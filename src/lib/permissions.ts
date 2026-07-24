import type { Role } from './types';

// Hand-written mirror of vendorflow-api/src/contracts/permissions.ts.
// FOR UI GATING ONLY (hiding buttons a role cannot use). Never trusted for
// security: the backend copy is the one that enforces.
export const PERMISSIONS = [
  'user:read',
  'user:manage',
  'vendor:read',
  'vendor:create',
  'vendor:manage',
  'template:read',
  'template:manage',
  'document:read',
  'document:approve',
  'billing:manage',
  'report:view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'user:read',
    'user:manage',
    'vendor:read',
    'vendor:create',
    'vendor:manage',
    'template:read',
    'template:manage',
    'document:read',
    'document:approve',
    'billing:manage',
    'report:view',
  ],
  FINANCE: ['vendor:read', 'template:read', 'document:read', 'document:approve', 'report:view'],
  PROCUREMENT: ['vendor:read', 'vendor:create', 'vendor:manage', 'template:read', 'document:read'],
  VENDOR: [],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
