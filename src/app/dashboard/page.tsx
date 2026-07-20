'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuthStore } from '@/stores/auth';
import { fetchUsers, logout } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import type { UserDto } from '@/lib/types';

function DashboardInner() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers()
      .then((r) => setUsers(r.users))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load users'));
  }, []);

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-brand text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">VendorFlow</span>
            <span className="h-2 w-2 rounded-full bg-gold" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-white/70">{user?.role}</p>
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

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-xl font-semibold text-ink">Team members</h1>
        <p className="mt-1 text-sm text-muted">Everyone in your company. Scoped to you alone.</p>

        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-panel">
          {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
          {!error && !users && <p className="px-4 py-3 text-sm text-muted">Loading…</p>}
          {users && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-ink">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}
