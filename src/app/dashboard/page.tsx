'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/stores/auth';
import { fetchActivity, fetchMetrics } from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/client';
import type { ActivityItem, DashboardMetrics } from '@/lib/types';

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'danger' }) {
  const valueClass =
    tone === 'danger' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : 'text-ink';
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function humanAction(a: string): string {
  return a.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function Overview() {
  const me = useAuthStore((s) => s.user);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchMetrics(), fetchActivity()])
      .then(([m, a]) => {
        setMetrics(m.metrics);
        setActivity(a.items);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);

  return (
    <AppShell title="Dashboard">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Signed in as {me?.email}.</p>
        <Link
          href="/vendors"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
        >
          Go to vendors
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total vendors" value={metrics?.totalVendors ?? 0} />
        <StatCard label="Pending review" value={metrics?.pendingDocuments ?? 0} />
        <StatCard label="Expiring soon" value={metrics?.expiringSoon ?? 0} tone="warn" />
        <StatCard label="Expired" value={metrics?.expired ?? 0} tone="danger" />
      </div>

      <h2 className="mt-8 text-base font-semibold text-ink">Recent activity</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-panel">
        {activity.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink">{humanAction(a.action)}</span>
                <span className="text-xs text-muted">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Overview />
    </AuthGuard>
  );
}
