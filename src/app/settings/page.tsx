'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '@/components/AppShell';
import { useAuthStore } from '@/stores/auth';
import { createRole, deleteRole, fetchRoles, updateRole } from '@/lib/api/roles';
import { ApiError } from '@/lib/api/client';
import { PERMISSIONS, hasPermission, type Permission } from '@/lib/permissions';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { RoleDto } from '@/lib/types';

function RolesSettings() {
  const toast = useToast();
  const me = useAuthStore((s) => s.user);
  const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null);
  const canManage = hasPermission(me?.permissions, 'user:manage');

  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetchRoles();
      setRoles(r.roles);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load roles');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePermission = async (role: RoleDto, perm: Permission) => {
    if (role.isSystem) return;
    setError(null);
    const permissions = role.permissions.includes(perm)
      ? role.permissions.filter((p) => p !== perm)
      : [...role.permissions, perm];
    // optimistic
    setRoles((rs) => rs.map((r) => (r.id === role.id ? { ...r, permissions } : r)));
    try {
      await updateRole(role.id, { permissions });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed');
      await load(); // revert on failure
    }
  };

  const onAdd = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createRole({ name: newName.trim(), permissions: [] });
      setNewName('');
      await load();
      toast.success('Role created');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create role');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (role: RoleDto) => {
    setError(null);
    try {
      await deleteRole(role.id);
      await load();
      toast.success('Role deleted');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };

  if (!canManage) {
    return (
      <PageContainer title="Settings">
        <div className="rounded-xl border border-line bg-panel p-6 text-sm text-muted">
          Only admins can manage roles.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings">
      <h2 className="text-base font-semibold text-ink">Roles &amp; permissions</h2>
      <p className="mt-1 text-sm text-muted">
        Define roles and toggle what each can do. System roles are locked.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-panel p-4">
        <div>
          <label className="text-xs font-medium text-muted">New role name</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Auditor"
            className="mt-1 w-56 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          onClick={onAdd}
          disabled={busy}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
        >
          Add role
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{role.name}</span>
                {role.isSystem && (
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                    System
                  </span>
                )}
              </div>
              {!role.isSystem && (
                <button
                  onClick={() => setRoleToDelete(role)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PERMISSIONS.map((perm) => {
                const on = role.permissions.includes(perm);
                return (
                  <label
                    key={perm}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                      role.isSystem ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    } ${on ? 'border-brand bg-brand/5' : 'border-line'}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={role.isSystem}
                      onChange={() => togglePermission(role, perm)}
                    />
                    <span className="text-ink">{perm}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {roleToDelete && (
        <ConfirmDialog
          title={`Delete role "${roleToDelete.name}"?`}
          message="This cannot be undone. Roles in use cannot be deleted."
          confirmLabel="Delete role"
          danger
          onConfirm={() => onDelete(roleToDelete)}
          onClose={() => setRoleToDelete(null)}
        />
      )}
    </PageContainer>
  );
}

export default function SettingsPage() {
  return <RolesSettings />;
}
