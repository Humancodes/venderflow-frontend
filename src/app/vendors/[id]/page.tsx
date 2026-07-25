'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/stores/auth';
import { fetchVendor } from '@/lib/api/vendors';
import {
  fetchDownloadUrl,
  fetchVendorChecklist,
  staffConfirm,
  staffUploadUrl,
  uploadFileToUrl,
} from '@/lib/api/documents';
import { approveDocument, rejectDocument } from '@/lib/api/approvals';
import { ApiError } from '@/lib/api/client';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ChecklistItem, DocumentStatus, VendorDto } from '@/lib/types';

const statusClass: Record<DocumentStatus, string> = {
  MISSING: 'bg-gray-200 text-gray-600',
  UPLOADED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-amber-100 text-amber-800',
};

function VendorDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const me = useAuthStore((s) => s.user);
  const canApprove = hasPermission(me?.permissions, 'document:approve');
  const canManage = hasPermission(me?.permissions, 'vendor:manage');
  const [vendor, setVendor] = useState<VendorDto | null>(null);
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([fetchVendor(id), fetchVendorChecklist(id)]);
      setVendor(v.vendor);
      setItems(c.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load vendor');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDownload = async (documentId: string) => {
    try {
      const { url } = await fetchDownloadUrl(documentId);
      window.open(url, '_blank');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Download failed');
    }
  };

  const onUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    setError(null);
    try {
      const { documentId, url } = await staffUploadUrl(id, {
        documentType,
        contentType: file.type || 'application/octet-stream',
      });
      await uploadFileToUrl(url, file);
      await staffConfirm(documentId);
      await load();
      toast.success(`${documentType} uploaded`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const onDecide = async (documentId: string, decision: 'approve' | 'reject', comment?: string) => {
    try {
      if (decision === 'approve') await approveDocument(documentId, comment);
      else await rejectDocument(documentId, comment);
      await load();
      toast.success(decision === 'approve' ? 'Document approved' : 'Document rejected');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed');
    }
  };

  return (
    <AppShell title={vendor ? vendor.name : 'Vendor'}>
      <Link href="/vendors" className="text-sm text-brand hover:underline">
        ← Back to directory
      </Link>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {vendor && (
        <div className="mt-4 rounded-xl border border-line bg-panel p-5">
          <p className="text-sm text-muted">{vendor.email}</p>
          <span className="mt-2 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {vendor.status}
          </span>
        </div>
      )}

      <h2 className="mt-8 text-base font-semibold text-ink">Compliance checklist</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">File</th>
            </tr>
          </thead>
          <tbody>
            {!items && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {items?.map((it) => (
              <tr key={it.documentType} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{it.documentType}</td>
                <td className="px-4 py-3 text-muted">{it.required ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[it.status]}`}>
                    {it.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {it.documentId && it.status !== 'MISSING' ? (
                      <button
                        onClick={() => onDownload(it.documentId!)}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                    {canApprove && it.documentId && it.status === 'UPLOADED' && (
                      <>
                        <button
                          onClick={() => onDecide(it.documentId!, 'approve')}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectDocId(it.documentId!)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {canManage && (
                      <label className="cursor-pointer text-xs font-medium text-brand hover:underline">
                        {uploading === it.documentType
                          ? 'Uploading…'
                          : it.status === 'MISSING'
                            ? 'Upload'
                            : 'Replace'}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploading !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void onUpload(it.documentType, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectDocId && (
        <ConfirmDialog
          title="Reject document"
          message="Optionally tell the vendor why, so they can fix and re-upload."
          confirmLabel="Reject"
          danger
          withReason
          onConfirm={(reason) => onDecide(rejectDocId, 'reject', reason || undefined)}
          onClose={() => setRejectDocId(null)}
        />
      )}
    </AppShell>
  );
}

export default function VendorDetailPage() {
  return (
    <AuthGuard>
      <VendorDetail />
    </AuthGuard>
  );
}
