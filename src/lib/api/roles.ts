import type { CreateRoleBody, RoleResponse, RolesResponse, UpdateRoleBody } from '@/lib/types';
import { apiFetch } from './client';

export function fetchRoles(): Promise<RolesResponse> {
  return apiFetch<RolesResponse>('/roles');
}
export function createRole(body: CreateRoleBody): Promise<RoleResponse> {
  return apiFetch<RoleResponse>('/roles', { method: 'POST', body: JSON.stringify(body) });
}
export function updateRole(id: string, body: UpdateRoleBody): Promise<RoleResponse> {
  return apiFetch<RoleResponse>(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/roles/${id}`, { method: 'DELETE' });
}
