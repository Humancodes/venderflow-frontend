'use client';

import { useEffect } from 'react';
import { refreshSession } from '@/lib/api/client';

// Runs once when the app mounts. The access token starts empty (memory-only),
// so we try a silent /auth/refresh to restore the session from the httpOnly
// cookie. On success the store becomes 'authenticated'; on failure,
// 'unauthenticated'. Either way the store leaves the 'loading' state.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void refreshSession();
  }, []);

  return <>{children}</>;
}
