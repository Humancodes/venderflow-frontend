'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuthStore } from '@/stores/auth';
import { logout } from '@/lib/api/auth';
import { fetchMyVendor } from '@/lib/api/vendors';
import {
  confirmUpload,
  fetchMyChecklist,
  fetchMyDownloadUrl,
  requestUploadUrl,
  uploadFileToUrl,
} from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/components/Toast';
import type { ChecklistItem, DocumentStatus, VendorDto } from '@/lib/types';

const statusClass: Record<DocumentStatus, string> = {
  MISSING: 'bg-gray-200 text-gray-600',
  UPLOADED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-amber-100 text-amber-800',
};

function Portal() {
  const toast = useToast();
  const me = useAuthStore((s) => s.user);
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDto | null>(null);
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (me && me.role !== 'VENDOR') router.replace('/dashboard');
  }, [me, router]);

  const load = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([fetchMyVendor(), fetchMyChecklist()]);
      setVendor(v.vendor);
      setItems(c.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onUpload = async (documentType: string, file: File) => {
    setBusy(documentType);
    setError(null);
    try {
      const { documentId, url } = await requestUploadUrl({
        documentType,
        contentType: file.type || 'application/octet-stream',
      });
      await uploadFileToUrl(url, file); // straight to storage, not our api
      await confirmUpload(documentId);
      await load();
      toast.success(`${documentType} uploaded`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  const onDownload = async (documentId: string) => {
    try {
      const { url } = await fetchMyDownloadUrl(documentId);
      window.open(url, '_blank');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Download failed');
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-brand text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">VendorFlow</span>
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="ml-2 text-xs text-white/70">Vendor portal</span>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-semibold text-ink">Your onboarding</h1>
        {vendor && (
          <p className="mt-1 text-sm text-muted">
            {vendor.name} · {vendor.email} ·{' '}
            <span className="font-medium">{vendor.status}</span>
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <h2 className="mt-8 text-base font-semibold text-ink">Required documents</h2>
        <div className="mt-3 space-y-3">
          {!items && <p className="text-sm text-muted">Loading…</p>}
          {items?.map((it) => (
            <div
              key={it.documentType}
              className="flex items-center justify-between rounded-xl border border-line bg-panel p-4"
            >
              <div>
                <p className="font-medium text-ink">
                  {it.documentType}
                  {it.required && <span className="ml-1 text-red-500">*</span>}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[it.status]}`}
                >
                  {it.status}
                </span>
                {it.expiryDate && (
                  <span className="ml-2 text-xs text-muted">
                    expires {new Date(it.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {it.documentId && it.status !== 'MISSING' && (
                  <button
                    onClick={() => onDownload(it.documentId!)}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    View
                  </button>
                )}
                <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface">
                  {busy === it.documentType
                    ? 'Uploading…'
                    : it.status === 'MISSING'
                      ? 'Upload'
                      : 'Replace'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={busy !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onUpload(it.documentType, f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function PortalPage() {
  return (
    <AuthGuard>
      <Portal />
    </AuthGuard>
  );
}
