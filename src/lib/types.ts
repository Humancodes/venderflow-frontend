// Hand-written mirror of vendorflow-api/src/contracts/*.
// The backend is the source of truth. When a contract changes there, update
// this file in the same working session so the two never drift.

// Mirrors api: prisma enum Role
export type Role = 'ADMIN' | 'FINANCE' | 'PROCUREMENT' | 'VENDOR';

// Mirrors api: src/contracts/health.ts
export type HealthResponse = {
  status: 'ok';
  db: 'up' | 'down';
  timestamp: string;
};

// Mirrors api: src/contracts/auth.ts
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  companyId: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type SignupBody = {
  companyName: string;
  email: string;
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type AcceptInviteBody = {
  token: string;
  password: string;
};

// Mirrors api: src/contracts/user.ts
export type UserDto = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  companyId: string;
  createdAt: string;
};

export type UsersResponse = {
  users: UserDto[];
};

export type InviteUserBody = {
  email: string;
  role: 'ADMIN' | 'FINANCE' | 'PROCUREMENT';
};

export type UpdateUserBody = {
  role?: 'ADMIN' | 'FINANCE' | 'PROCUREMENT';
  isActive?: boolean;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
};

export type InviteResponse = { invitation: PendingInvite };
export type PendingInvitesResponse = { invitations: PendingInvite[] };
