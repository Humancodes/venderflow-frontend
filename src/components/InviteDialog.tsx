'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { inviteUser } from '@/lib/api/users';
import { fetchRoles } from '@/lib/api/roles';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/components/Toast';
import { inputClass, primaryButtonClass } from '@/components/AuthLayout';
import type { RoleDto } from '@/lib/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  roleId: z.string().min(1, 'Select a role'),
});
type Values = z.infer<typeof schema>;

export function InviteDialog({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetchRoles()
      .then((r) => setRoles(r.roles))
      .catch(() => {});
  }, []);

  const onSubmit = async (v: Values) => {
    setServerError(null);
    try {
      await inviteUser(v);
      toast.success('Invitation sent');
      onInvited();
      onClose();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Failed to send invite');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-panel p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-ink">Invite a teammate</h2>
        <p className="mt-1 text-sm text-muted">They will get an email link to set a password.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium text-ink">Email</label>
            <input type="email" className={inputClass} {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Role</label>
            <select className={inputClass} defaultValue="" {...register('roleId')}>
              <option value="" disabled>
                Select a role…
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.roleId && <p className="mt-1 text-xs text-red-600">{errors.roleId.message}</p>}
          </div>
          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} flex-1`}>
              {isSubmitting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
