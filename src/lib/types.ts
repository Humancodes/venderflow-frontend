// Hand-written mirror of vendorflow-api/src/contracts/*.
// The backend is the source of truth. When a contract changes there, update
// this file in the same working session so the two never drift.

// Mirrors api: prisma enum Role
export type Role = 'ADMIN' | 'FINANCE' | 'PROCUREMENT' | 'VENDOR';

// Mirrors api: prisma enum PlanTier
export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS';

// Mirrors api: src/contracts/company.ts
export type CompanyDto = { id: string; name: string; plan: PlanTier };
export type CompanyResponse = { company: CompanyDto };

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

// Mirrors api: src/contracts/vendor.ts
export type VendorStatus = 'INVITED' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'INACTIVE';

export type VendorDto = {
  id: string;
  name: string;
  email: string;
  status: VendorStatus;
  companyId: string;
  createdAt: string;
};

export type VendorsResponse = {
  vendors: VendorDto[];
  total: number;
  page: number;
  limit: number;
};

export type VendorResponse = { vendor: VendorDto };

export type CreateVendorBody = { name: string; email: string };
export type UpdateVendorBody = { name?: string; email?: string; status?: VendorStatus };

// Mirrors api: prisma enum DocumentStatus
export type DocumentStatus = 'MISSING' | 'UPLOADED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

// Mirrors api: src/contracts/documentRequirement.ts
export type RequirementDto = {
  id: string;
  documentType: string;
  required: boolean;
  expiresInDays: number | null;
  companyId: string;
  createdAt: string;
};
export type RequirementsResponse = { requirements: RequirementDto[] };
export type CreateRequirementBody = {
  documentType: string;
  required?: boolean;
  expiresInDays?: number | null;
};

// Mirrors api: src/contracts/document.ts
export type ChecklistItem = {
  documentType: string;
  required: boolean;
  status: DocumentStatus;
  documentId: string | null;
  expiryDate: string | null;
};
export type ChecklistResponse = { items: ChecklistItem[] };
export type UploadUrlBody = { documentType: string; contentType: string };
export type UploadUrlResponse = { documentId: string; key: string; url: string };
export type DownloadUrlResponse = { url: string };

// Mirrors api: src/contracts/approval.ts
export type ApprovalQueueItem = {
  documentId: string;
  vendorId: string;
  vendorName: string;
  documentType: string;
  uploadedAt: string;
};
export type ApprovalQueueResponse = { items: ApprovalQueueItem[] };

// Mirrors api: src/contracts/dashboard.ts
export type DashboardMetrics = {
  totalVendors: number;
  vendorsByStatus: Partial<Record<VendorStatus, number>>;
  pendingDocuments: number;
  expiringSoon: number;
  expired: number;
};
export type MetricsResponse = { metrics: DashboardMetrics };
export type ActivityItem = {
  id: string;
  action: string;
  userId: string | null;
  metadata: unknown;
  createdAt: string;
};
export type ActivityResponse = { items: ActivityItem[] };
