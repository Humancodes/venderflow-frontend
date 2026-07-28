'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { logout } from '@/lib/api/auth';
import { fetchMyCompany } from '@/lib/api/company';
import { hasPermission, type Permission } from '@/lib/permissions';
import type { CompanyDto, PlanTier, Role } from '@/lib/types';

type NavItem = { label: string; href?: string; perm?: Permission; soon?: boolean; icon: ReactNode };

const I = (path: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: I(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>) },
  { label: 'Vendor Directory', href: '/vendors', perm: 'vendor:read', icon: I(<><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" /></>) },
  { label: 'Team Members', href: '/team', perm: 'user:read', icon: I(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>) },
  { label: 'Documents', href: '/documents', perm: 'template:read', icon: I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>) },
  { label: 'Approvals', href: '/approvals', perm: 'document:approve', icon: I(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>) },
  { label: 'Settings', href: '/settings', perm: 'user:manage', icon: I(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.14.31.4.55.72.66" /></>) },
  { label: 'Billing', href: '/billing', perm: 'vendor:read', icon: I(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>) },
];

const PLAN_LABEL: Record<PlanTier, string> = {
  FREE: 'Free plan',
  STARTER: 'Starter plan',
  GROWTH: 'Growth plan',
  BUSINESS: 'Business plan',
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  FINANCE: 'Finance',
  PROCUREMENT: 'Procurement',
  VENDOR: 'Vendor',
};

function initials(email: string): string {
  return (email.split('@')[0] ?? '').slice(0, 2).toUpperCase() || '?';
}

export function AppShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const me = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (me && me.role === 'VENDOR') router.replace('/portal');
  }, [me, router]);

  useEffect(() => {
    fetchMyCompany()
      .then((r) => setCompany(r.company))
      .catch(() => {});
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Switch workspace. Because each company is a separate account (email is
  // unique only per company and passwords are independent), switching means
  // re-authenticating into the other company. We pre-fill the email so the
  // user only confirms their password on the login screen.
  const onSwitchCompany = async () => {
    if (me) {
      try {
        window.localStorage.setItem('vf_switch_email', me.email);
      } catch {
        /* ignore storage failures */
      }
    }
    await logout();
    router.replace('/login');
  };

  const canSee = (perm?: Permission) => !perm || hasPermission(me?.permissions, perm);

  const sidebar = (
    <>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-base font-bold text-brand">
            V
          </span>
          <span className="text-lg font-bold tracking-tight">VendorFlow</span>
        </div>
        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-semibold text-brand">
            {(company?.name?.[0] ?? '·').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{company?.name ?? 'Loading…'}</p>
            <p className="truncate text-xs text-white/60">{company ? PLAN_LABEL[company.plan] : ''}</p>
          </div>
          <button
            onClick={onSwitchCompany}
            title="Switch company"
            aria-label="Switch company"
            className="shrink-0 text-white/50 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3l4 4-4 4" />
              <path d="M20 7H4" />
              <path d="M8 21l-4-4 4-4" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          if (!canSee(item.perm)) return null;
          if (item.soon || !item.href) {
            return (
              <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-2 text-white/40">
                <span className="flex items-center gap-3 text-sm">
                  {item.icon}
                  {item.label}
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
              </div>
            );
          }
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active ? 'bg-white/10 font-medium text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {me ? initials(me.email) : '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{me?.email}</p>
            <p className="truncate text-xs text-white/60">{me ? ROLE_LABEL[me.role] : ''}</p>
          </div>
          <button onClick={onLogout} title="Sign out" aria-label="Sign out" className="text-white/70 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v10" />
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand text-white lg:flex">{sidebar}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-brand text-white">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-line bg-panel px-4 py-3 lg:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="text-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="text-base font-bold tracking-tight text-brand">VendorFlow</span>
        </div>

        <div className="border-b border-line bg-panel">
          <div className="flex items-center justify-between gap-3 px-4 py-5 sm:px-8">
            <h1 className="text-lg font-semibold text-ink">{title}</h1>
            {actions}
          </div>
        </div>
        <main className="px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
