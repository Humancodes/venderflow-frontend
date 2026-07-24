'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { InviteDialog } from '@/components/InviteDialog';
import { useAuthStore } from '@/stores/auth';
import { fetchPendingInvites, fetchUsers, updateUser } from '@/lib/api/users';
import { ApiError } from '@/lib/api/client';
import { roleHasPermission } from '@/lib/permissions';
import type { PendingInvite, UserDto } from '@/lib/types';

const ROLE_OPTIONS = ['ADMIN', 'FINANCE', 'PROCUREMENT'] as const;

function TeamScreen() {
  const me = useAuthStore((s) => s.user);
  const canRead = me ? roleHasPermission(me.role, 'user:read') : false;
  const canManage = me ? roleHasPermission(me.role, 'user:manage') : false;

  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    try {
      const usersRes = await fetchUsers();
      setUsers(usersRes.users);
      if (canManage) {
        const invRes = await fetchPendingInvites();
        setInvites(invRes.invitations);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load team');
    }
  }, [canRead, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRoleChange = async (id: string, role: (typeof ROLE_OPTIONS)[number]) => {
    setError(null);
    try {
      await updateUser(id, { role });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const onToggleActive = async (u: UserDto) => {
    setError(null);
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const actions =
    canManage && canRead ? (
      <button
        onClick={() => setShowInvite(true)}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
      >
        Invite teammate
      </button>
    ) : undefined;

  return (
    <AppShell title="Team Members" actions={actions}>
      {!canRead ? (
        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="text-sm text-muted">
            Your role ({me?.role}) does not have access to team management.
          </p>
        </div>
      ) : (
        <>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            {!users && <p className="px-4 py-3 text-sm text-muted">Loading…</p>}
            {users && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === me?.id;
                    return (
                      <tr key={u.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3 text-ink">
                          {u.email}
                          {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                        </td>
                        <td className="px-4 py-3">
                          {canManage && !isSelf ? (
                            <select
                              value={u.role}
                              onChange={(e) =>
                                onRoleChange(u.id, e.target.value as (typeof ROLE_OPTIONS)[number])
                              }
                              className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              u.isActive
                                ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
                                : 'rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600'
                            }
                          >
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-4 py-3">
                            {!isSelf && (
                              <button
                                onClick={() => onToggleActive(u)}
                                className="text-xs font-medium text-brand hover:underline"
                              >
                                {u.isActive ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {canManage && invites.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-semibold text-ink">Pending invitations</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-line bg-panel">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => (
                      <tr key={inv.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3 text-ink">{inv.email}</td>
                        <td className="px-4 py-3 text-muted">{inv.role}</td>
                        <td className="px-4 py-3 text-muted">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showInvite && (
        <InviteDialog onClose={() => setShowInvite(false)} onInvited={() => void load()} />
      )}
    </AppShell>
  );
}

export default function TeamPage() {
  return (
    <AuthGuard>
      <TeamScreen />
    </AuthGuard>
  );
}
