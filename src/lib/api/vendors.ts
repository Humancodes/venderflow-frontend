import type {
  CreateVendorBody,
  InviteResponse,
  VendorResponse,
  VendorsResponse,
  VendorStatus,
} from '@/lib/types';
import { apiFetch } from './client';

export function fetchVendors(params: {
  page?: number;
  limit?: number;
  status?: VendorStatus;
  search?: string;
}): Promise<VendorsResponse> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.status) q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return apiFetch<VendorsResponse>(`/vendors${qs ? `?${qs}` : ''}`);
}

export function fetchVendor(id: string): Promise<VendorResponse> {
  return apiFetch<VendorResponse>(`/vendors/${id}`);
}

export function createVendor(body: CreateVendorBody): Promise<VendorResponse> {
  return apiFetch<VendorResponse>('/vendors', { method: 'POST', body: JSON.stringify(body) });
}

export function inviteVendor(id: string): Promise<InviteResponse> {
  return apiFetch<InviteResponse>(`/vendors/${id}/invite`, { method: 'POST' });
}

export function fetchMyVendor(): Promise<VendorResponse> {
  return apiFetch<VendorResponse>('/portal/vendor');
}
