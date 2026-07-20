'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

// Wrap protected pages. While the initial silent refresh is in flight we show a
// loading state; if it resolves to unauthenticated we bounce to /login. This is
// a UX gate only. The real protection is the backend rejecting requests without
// a valid access token.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
    );
  }

  return <>{children}</>;
}
