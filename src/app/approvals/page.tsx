'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '@/components/AppShell';
import { approveDocument, fetchApprovalQueue, rejectDocument } from '@/lib/api/approvals';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/components/Toast';
import type { ApprovalQueueItem } from '@/lib/types';

function ApprovalsQueue() {
  const toast = useToast();
  const [items, setItems] = useState<ApprovalQueueItem[] | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchApprovalQueue();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load queue');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (documentId: string, decision: 'approve' | 'reject') => {
    setBusy(documentId);
    setError(null);
    try {
      const comment = comments[documentId];
      if (decision === 'approve') await approveDocument(documentId, comment);
      else await rejectDocument(documentId, comment);
      await load();
      toast.success(decision === 'approve' ? 'Document approved' : 'Document rejected');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageContainer title="Approvals">
      <p className="text-sm text-muted">Documents awaiting your review.</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {!items && <p className="text-sm text-muted">Loading…</p>}
        {items?.length === 0 && (
          <div className="rounded-xl border border-line bg-panel p-6 text-sm text-muted">
            Nothing to review. All caught up.
          </div>
        )}
        {items?.map((it) => (
          <div key={it.documentId} className="rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{it.documentType}</p>
                <p className="text-sm text-muted">
                  {it.vendorName} · uploaded {new Date(it.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                value={comments[it.documentId] ?? ''}
                onChange={(e) =>
                  setComments((m) => ({ ...m, [it.documentId]: e.target.value }))
                }
                placeholder="Comment (optional)"
                className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                disabled={busy === it.documentId}
                onClick={() => decide(it.documentId, 'approve')}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busy === it.documentId}
                onClick={() => decide(it.documentId, 'reject')}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

export default function ApprovalsPage() {
  return <ApprovalsQueue />;
}
