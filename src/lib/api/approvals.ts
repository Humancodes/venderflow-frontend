import type { ApprovalQueueResponse } from '@/lib/types';
import { apiFetch } from './client';

export function fetchApprovalQueue(): Promise<ApprovalQueueResponse> {
  return apiFetch<ApprovalQueueResponse>('/approvals');
}

export function approveDocument(id: string, comments?: string) {
  return apiFetch(`/documents/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comments }),
  });
}

export function rejectDocument(id: string, comments?: string) {
  return apiFetch(`/documents/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comments }),
  });
}
