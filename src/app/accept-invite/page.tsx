'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { acceptInvite, checkInvite } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { AuthLayout, inputClass, primaryButtonClass } from '@/components/AuthLayout';
import { Spinner } from '@/components/Ui';
import type { InviteCheckResult } from '@/lib/types';

const schema = z.object({ password: z.string().min(8, 'At least 8 characters') });
type Values = z.infer<typeof schema>;

function AcceptInviteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [check, setCheck] = useState<InviteCheckResult | 'loading'>('loading');
  const [serverError, setServerError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  // Validate on load and whenever the token changes (e.g. edited in the URL),
  // so a tampered / expired / used token shows an invalid state, not a dead form.
  useEffect(() => {
    let cancelled = false;
    setCheck('loading');
    if (!token) {
      setCheck({ valid: false });
      return;
    }
    checkInvite(token)
      .then((r) => !cancelled && setCheck(r))
      .catch(() => !cancelled && setCheck({ valid: false }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const goAfterJoin = (role: string) =>
    router.push(role === 'VENDOR' ? '/portal' : '/dashboard');

  const join = async (password?: string) => {
    setServerError(null);
    setJoining(true);
    try {
      const res = await acceptInvite({ token, password });
      goAfterJoin(res.user.role);
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong');
      setJoining(false);
    }
  };

  if (check === 'loading') {
    return (
      <AuthLayout title="Checking your invitation…">
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthLayout>
    );
  }

  if (!check.valid) {
    return (
      <AuthLayout
        title="Invitation not valid"
        subtitle="This invite link is invalid, expired, or has already been used."
        footer={
          <Link href="/login" className="font-medium text-brand hover:underline">
            Go to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted">Ask an admin to send you a fresh invitation.</p>
      </AuthLayout>
    );
  }

  const subtitle = `Join ${check.companyName}${check.roleName ? ` as ${check.roleName}` : ''}.`;

  // Existing account: no password needed, just add the membership.
  if (check.hasAccount) {
    return (
      <AuthLayout title="Accept your invitation" subtitle={subtitle}>
        <p className="text-sm text-muted">
          You already have a VendorFlow account for{' '}
          <span className="font-medium text-ink">{check.email}</span>. Joining adds this workspace
          to it.
        </p>
        {serverError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}
        <button onClick={() => join()} disabled={joining} className={`${primaryButtonClass} mt-4`}>
          {joining ? 'Joining…' : 'Join workspace'}
        </button>
      </AuthLayout>
    );
  }

  // New account: set a password.
  return (
    <AuthLayout title="Accept your invitation" subtitle={subtitle}>
      <form onSubmit={handleSubmit((v) => join(v.password))} className="space-y-4" noValidate>
        <p className="text-sm text-muted">
          Set a password for <span className="font-medium text-ink">{check.email}</span>.
        </p>
        <div>
          <label className="text-sm font-medium text-ink">Choose a password</label>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>
        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}
        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Joining…' : 'Join and continue'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AuthLayout title="Loading…">{null}</AuthLayout>}>
      <AcceptInviteInner />
    </Suspense>
  );
}
