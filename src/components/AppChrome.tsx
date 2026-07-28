'use client';

import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';

// Routes that render their own layout and must NOT get the app sidebar:
// public auth pages, the vendor portal (its own chrome), and the root redirect.
const BARE_PREFIXES = ['/login', '/signup', '/accept-invite', '/portal'];

function isBare(pathname: string): boolean {
  if (pathname === '/') return true;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Rendered once in the root layout. For app routes it keeps AuthGuard + AppShell
// mounted and only swaps {children} on navigation, so the sidebar and its data
// never re-fetch on a link click. Bare routes pass straight through.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isBare(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
