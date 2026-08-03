'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';

// Routes that render their own layout and must NOT get the app sidebar:
// public auth pages, the vendor portal (its own chrome), and the root redirect.
const BARE_PREFIXES = ['/login', '/signup', '/accept-invite', '/verify-email', '/portal'];

function isBare(pathname: string): boolean {
  if (pathname === '/') return true;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Rendered once in the root layout. For app routes it keeps AuthGuard + AppShell
// mounted and only swaps {children} on navigation, so the sidebar and its data
// never re-fetch on a link click. Bare routes pass straight through.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const companyId = useAuthStore((s) => s.user?.companyId);

  if (isBare(pathname)) {
    return <>{children}</>;
  }

  // Key the page content by active workspace so switching remounts only the
  // routed content (which refetches with the new token), while AppShell (the
  // sidebar) stays mounted. `display: contents` keeps it layout-neutral.
  return (
    <AuthGuard>
      <AppShell>
        <div key={companyId ?? 'none'} className="contents">
          {children}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
