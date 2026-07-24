'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { acceptInvite } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { AuthLayout, inputClass, primaryButtonClass } from '@/components/AuthLayout';

const schema = z.object({ password: z.string().min(8, 'At least 8 characters') });
type Values = z.infer<typeof schema>;

function AcceptInviteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const token = params.get('token') ?? '';

  const onSubmit = async (v: Values) => {
    setServerError(null);
    try {
      const res = await acceptInvite({ token, password: v.password });
      router.push(res.user.role === 'VENDOR' ? '/portal' : '/dashboard');
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  };

  return (
    <AuthLayout title="Accept your invitation" subtitle="Set a password to join your team.">
      {!token ? (
        <p className="text-sm text-red-600">This invitation link is missing its token.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
      )}
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
