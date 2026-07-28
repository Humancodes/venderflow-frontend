'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signup } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { AuthLayout, inputClass, primaryButtonClass } from '@/components/AuthLayout';
import { VerifyNotice } from '@/components/VerifyNotice';

// Mirrors the api's signupSchema (companyName, email, password min 8).
const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await signup(values);
      setPendingEmail(res.email);
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  };

  if (pendingEmail) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="One more step to activate your workspace."
        footer={
          <>
            Already verified?{' '}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <VerifyNotice email={pendingEmail} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your company"
      subtitle="You will be the admin of this workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="text-sm font-medium text-ink">Company name</label>
          <input className={inputClass} {...register('companyName')} />
          {errors.companyName && (
            <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Email</label>
          <input type="email" autoComplete="email" className={inputClass} {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Password</label>
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
          {isSubmitting ? 'Creating…' : 'Create company'}
        </button>
      </form>
    </AuthLayout>
  );
}
