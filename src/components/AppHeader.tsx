'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { logout } from '@/lib/api/auth';

// Internal-app header with primary nav. Vendor portal uses its own minimal
// header instead.
export function AppHeader() {
  const me = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={
        pathname === href ? 'text-sm font-medium text-white' : 'text-sm text-white/70 hover:text-white'
      }
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-line bg-brand text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">VendorFlow</span>
            <span className="h-2 w-2 rounded-full bg-gold" />
          </div>
          <nav className="flex items-center gap-5">
            <NavLink href="/dashboard" label="Team" />
            <NavLink href="/vendors" label="Vendors" />
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{me?.email}</p>
            <p className="text-xs text-white/70">{me?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
