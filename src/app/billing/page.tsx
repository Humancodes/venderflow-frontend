'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/stores/auth';
import { fetchSubscription, startCheckout } from '@/lib/api/billing';
import { ApiError } from '@/lib/api/client';
import { hasPermission } from '@/lib/permissions';
import type { PlanTier, SubscriptionDto } from '@/lib/types';

const PLANS: { tier: PlanTier; name: string; limit: string; paid: boolean }[] = [
  { tier: 'FREE', name: 'Free', limit: '5 vendors', paid: false },
  { tier: 'STARTER', name: 'Starter', limit: '100 vendors', paid: true },
  { tier: 'GROWTH', name: 'Growth', limit: '500 vendors', paid: true },
  { tier: 'BUSINESS', name: 'Business', limit: 'Unlimited vendors', paid: true },
];

function Billing() {
  const me = useAuthStore((s) => s.user);
  const canManage = hasPermission(me?.permissions, 'billing:manage');
  const [sub, setSub] = useState<SubscriptionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<PlanTier | null>(null);

  useEffect(() => {
    fetchSubscription()
      .then((r) => setSub(r.subscription))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);

  const onUpgrade = async (tier: 'STARTER' | 'GROWTH' | 'BUSINESS') => {
    setBusy(tier);
    setError(null);
    try {
      const { url } = await startCheckout(tier);
      window.location.href = url; // Razorpay hosted checkout (simulated in dev)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Checkout failed');
      setBusy(null);
    }
  };

  const usagePct =
    sub && sub.vendorLimit ? Math.min(100, Math.round((sub.vendorsUsed / sub.vendorLimit) * 100)) : 0;

  return (
    <AppShell title="Billing">
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {sub && (
        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="text-xs uppercase tracking-wide text-muted">Current plan</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{sub.plan}</p>
          <p className="mt-3 text-sm text-muted">
            {sub.vendorsUsed} / {sub.vendorLimit ?? '∞'} vendors used
          </p>
          {sub.vendorLimit && (
            <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-line">
              <div className="h-full bg-brand" style={{ width: `${usagePct}%` }} />
            </div>
          )}
        </div>
      )}

      <h2 className="mt-8 text-base font-semibold text-ink">Plans</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const current = sub?.plan === p.tier;
          return (
            <div
              key={p.tier}
              className={`rounded-xl border p-5 ${current ? 'border-brand bg-brand/5' : 'border-line bg-panel'}`}
            >
              <p className="font-semibold text-ink">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.limit}</p>
              <div className="mt-4">
                {current ? (
                  <span className="text-xs font-medium text-brand">Current plan</span>
                ) : p.paid && canManage ? (
                  <button
                    disabled={busy !== null}
                    onClick={() => onUpgrade(p.tier as 'STARTER' | 'GROWTH' | 'BUSINESS')}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
                  >
                    {busy === p.tier ? 'Redirecting…' : 'Upgrade'}
                  </button>
                ) : (
                  <span className="text-xs text-muted">{p.paid ? '' : '—'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!canManage && (
        <p className="mt-4 text-xs text-muted">Only admins can change the plan.</p>
      )}
    </AppShell>
  );
}

export default function BillingPage() {
  return (
    <AuthGuard>
      <Billing />
    </AuthGuard>
  );
}
