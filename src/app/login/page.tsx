'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { AuthLayout, inputClass, primaryButtonClass } from '@/components/AuthLayout';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await login(values);
      router.push(res.user.role === 'VENDOR' ? '/portal' : '/dashboard');
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to VendorFlow."
      footer={
        <>
          New here?{' '}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Create a company
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="text-sm font-medium text-ink">Email</label>
          <input type="email" autoComplete="email" className={inputClass} {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            autoComplete="current-password"
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
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
