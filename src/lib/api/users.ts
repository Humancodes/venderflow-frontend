import type {
  InviteResponse,
  InviteUserBody,
  PendingInvitesResponse,
  UpdateUserBody,
  UserDto,
  UsersResponse,
} from '@/lib/types';
import { apiFetch } from './client';

export function fetchUsers(): Promise<UsersResponse> {
  return apiFetch<UsersResponse>('/users');
}

export function fetchPendingInvites(): Promise<PendingInvitesResponse> {
  return apiFetch<PendingInvitesResponse>('/users/invitations');
}

export function inviteUser(body: InviteUserBody): Promise<InviteResponse> {
  return apiFetch<InviteResponse>('/users/invite', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateUser(id: string, body: UpdateUserBody): Promise<{ user: UserDto }> {
  return apiFetch<{ user: UserDto }>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
