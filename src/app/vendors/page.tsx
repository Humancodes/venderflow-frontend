'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { AddVendorDialog } from '@/components/AddVendorDialog';
import { useAuthStore } from '@/stores/auth';
import { fetchVendors, inviteVendor } from '@/lib/api/vendors';
import { ApiError } from '@/lib/api/client';
import { roleHasPermission } from '@/lib/permissions';
import type { VendorDto, VendorStatus, VendorsResponse } from '@/lib/types';

const LIMIT = 10;
const STATUSES: VendorStatus[] = ['INVITED', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE'];

const statusClass: Record<VendorStatus, string> = {
  INVITED: 'bg-gray-200 text-gray-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-gray-200 text-gray-500',
};

function VendorDirectory() {
  const me = useAuthStore((s) => s.user);
  const canCreate = me ? roleHasPermission(me.role, 'vendor:create') : false;
  const canManage = me ? roleHasPermission(me.role, 'vendor:manage') : false;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VendorStatus | ''>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VendorsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [invited, setInvited] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchVendors({
        page,
        limit: LIMIT,
        search: search || undefined,
        status: status || undefined,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load vendors');
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const onInvite = async (v: VendorDto) => {
    try {
      await inviteVendor(v.id);
      setInvited((m) => ({ ...m, [v.id]: true }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invite failed');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const actions = canCreate ? (
    <button
      onClick={() => setShowAdd(true)}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
    >
      Add vendor
    </button>
  ) : undefined;

  return (
    <AppShell title="Vendor Directory" actions={actions}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {data ? `${data.total} vendor${data.total === 1 ? '' : 's'}` : 'Loading…'}
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name or email…"
            className="w-64 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as VendorStatus | '');
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data?.vendors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No vendors match.
                </td>
              </tr>
            )}
            {data?.vendors.map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/vendors/${v.id}`} className="text-brand hover:underline">
                    {v.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{v.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[v.status]}`}
                  >
                    {v.status}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    {invited[v.id] ? (
                      <span className="text-xs text-muted">Invite sent</span>
                    ) : (
                      <button
                        onClick={() => onInvite(v)}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Invite to portal
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>
          Page {data?.page ?? 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {showAdd && <AddVendorDialog onClose={() => setShowAdd(false)} onAdded={() => void load()} />}
    </AppShell>
  );
}

export default function VendorsPage() {
  return (
    <AuthGuard>
      <VendorDirectory />
    </AuthGuard>
  );
}
