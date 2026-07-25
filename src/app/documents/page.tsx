'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/stores/auth';
import { createRequirement, deleteRequirement, fetchRequirements } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { RequirementDto } from '@/lib/types';

function Requirements() {
  const toast = useToast();
  const me = useAuthStore((s) => s.user);
  const canManage = hasPermission(me?.permissions, 'template:manage');
  const [reqToDelete, setReqToDelete] = useState<RequirementDto | null>(null);

  const [items, setItems] = useState<RequirementDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetchRequirements();
      setItems(res.requirements);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async () => {
    if (!documentType.trim()) return;
    setError(null);
    try {
      await createRequirement({
        documentType: documentType.trim(),
        expiresInDays: expiresInDays ? Number(expiresInDays) : null,
      });
      setDocumentType('');
      setExpiresInDays('');
      await load();
      toast.success('Requirement added');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to add');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteRequirement(id);
      await load();
      toast.success('Requirement deleted');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete');
    }
  };

  return (
    <AppShell title="Documents">
      <p className="text-sm text-muted">
        The document checklist every vendor must complete.
      </p>

      {canManage && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-panel p-4">
          <div>
            <label className="text-xs font-medium text-muted">Document type</label>
            <input
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g. GST Certificate"
              className="mt-1 w-56 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Expires in (days)</label>
            <input
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="never"
              className="mt-1 w-32 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={onAdd}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
          >
            Add requirement
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Document type</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No requirements yet.
                </td>
              </tr>
            )}
            {items?.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{r.documentType}</td>
                <td className="px-4 py-3 text-muted">{r.required ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-muted">
                  {r.expiresInDays ? `${r.expiresInDays} days` : 'Never'}
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setReqToDelete(r)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reqToDelete && (
        <ConfirmDialog
          title={`Delete "${reqToDelete.documentType}"?`}
          message="Vendors will no longer be asked for this document."
          confirmLabel="Delete"
          danger
          onConfirm={() => onDelete(reqToDelete.id)}
          onClose={() => setReqToDelete(null)}
        />
      )}
    </AppShell>
  );
}

export default function DocumentsPage() {
  return (
    <AuthGuard>
      <Requirements />
    </AuthGuard>
  );
}
