'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '@/components/AppShell';
import { InviteDialog } from '@/components/InviteDialog';
import { useAuthStore } from '@/stores/auth';
import { fetchPendingInvites, fetchUsers, updateUser } from '@/lib/api/users';
import { fetchRoles } from '@/lib/api/roles';
import { ApiError } from '@/lib/api/client';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { PendingInvite, RoleDto, UserDto } from '@/lib/types';

function TeamScreen() {
  const toast = useToast();
  const me = useAuthStore((s) => s.user);
  const [userToDeactivate, setUserToDeactivate] = useState<UserDto | null>(null);
  const canRead = hasPermission(me?.permissions, 'user:read');
  const canManage = hasPermission(me?.permissions, 'user:manage');

  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    try {
      const usersRes = await fetchUsers();
      setUsers(usersRes.users);
      if (canManage) {
        const [invRes, rolesRes] = await Promise.all([fetchPendingInvites(), fetchRoles()]);
        setInvites(invRes.invitations);
        setRoles(rolesRes.roles);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load team');
    }
  }, [canRead, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRoleChange = async (id: string, roleId: string) => {
    try {
      await updateUser(id, { roleId });
      await load();
      toast.success('Role updated');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const onToggleActive = async (u: UserDto) => {
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      await load();
      toast.success(u.isActive ? 'User deactivated' : 'User reactivated');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed');
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
    <PageContainer title="Team Members" actions={actions}>
      {!canRead ? (
        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="text-sm text-muted">
            Your role does not have access to team management.
          </p>
        </div>
      ) : (
        <>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            {!users && <p className="px-4 py-3 text-sm text-muted">Loading…</p>}
            {users && (
              <table className="w-full min-w-[640px] text-left text-sm">
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
                          {canManage && !isSelf && roles.length > 0 ? (
                            <select
                              value={u.roleId ?? ''}
                              onChange={(e) => onRoleChange(u.id, e.target.value)}
                              className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                              {u.roleName ?? '—'}
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
                                onClick={() =>
                                  u.isActive ? setUserToDeactivate(u) : onToggleActive(u)
                                }
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
              <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-panel">
                <table className="w-full min-w-[640px] text-left text-sm">
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
                        <td className="px-4 py-3 text-muted">{inv.roleName ?? '—'}</td>
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

      {userToDeactivate && (
        <ConfirmDialog
          title={`Deactivate ${userToDeactivate.email}?`}
          message="They will be signed out and cannot log in until reactivated."
          confirmLabel="Deactivate"
          danger
          onConfirm={() => onToggleActive(userToDeactivate)}
          onClose={() => setUserToDeactivate(null)}
        />
      )}
    </PageContainer>
  );
}

export default function TeamPage() {
  return <TeamScreen />;
}
