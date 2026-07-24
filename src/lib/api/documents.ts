import type {
  ChecklistResponse,
  CreateRequirementBody,
  DownloadUrlResponse,
  RequirementsResponse,
  UploadUrlBody,
  UploadUrlResponse,
} from '@/lib/types';
import { apiFetch } from './client';

// --- Requirement templates ---
export function fetchRequirements(): Promise<RequirementsResponse> {
  return apiFetch<RequirementsResponse>('/document-requirements');
}
export function createRequirement(body: CreateRequirementBody) {
  return apiFetch('/document-requirements', { method: 'POST', body: JSON.stringify(body) });
}
export function deleteRequirement(id: string) {
  return apiFetch<void>(`/document-requirements/${id}`, { method: 'DELETE' });
}

// --- Internal (staff) ---
export function fetchVendorChecklist(vendorId: string): Promise<ChecklistResponse> {
  return apiFetch<ChecklistResponse>(`/vendors/${vendorId}/documents`);
}
export function fetchDownloadUrl(documentId: string): Promise<DownloadUrlResponse> {
  return apiFetch<DownloadUrlResponse>(`/documents/${documentId}/download-url`);
}

// --- Vendor portal ---
export function fetchMyChecklist(): Promise<ChecklistResponse> {
  return apiFetch<ChecklistResponse>('/portal/documents');
}
export function requestUploadUrl(body: UploadUrlBody): Promise<UploadUrlResponse> {
  return apiFetch<UploadUrlResponse>('/portal/documents/upload-url', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
export function confirmUpload(documentId: string) {
  return apiFetch<{ documentId: string; status: string }>(
    `/portal/documents/${documentId}/confirm`,
    { method: 'POST' },
  );
}
export function fetchMyDownloadUrl(documentId: string): Promise<DownloadUrlResponse> {
  return apiFetch<DownloadUrlResponse>(`/portal/documents/${documentId}/download-url`);
}

// Uploads a file DIRECTLY to the presigned URL (object storage), NOT through
// our api. No auth header: the signature in the URL is the authorization. The
// Content-Type must match what we asked the api to sign.
export async function uploadFileToUrl(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}
