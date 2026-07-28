'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { AuthLayout, inputClass, primaryButtonClass } from '@/components/AuthLayout';
import { VerifyNotice } from '@/components/VerifyNotice';
import type { AuthResponse, CompanyChoice, LoginResult } from '@/lib/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // Set when the email belongs to more than one company: we hold the entered
  // credentials and show a company picker instead of logging straight in.
  const [choices, setChoices] = useState<CompanyChoice[] | null>(null);
  const [creds, setCreds] = useState<FormValues | null>(null);
  const [selecting, setSelecting] = useState(false);
  // Set when a correct password hits an unverified account.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Arriving from a "Switch company" action: pre-fill the email so the user
  // only needs to confirm their password for the other workspace.
  useEffect(() => {
    try {
      const email = window.localStorage.getItem('vf_switch_email');
      if (email) {
        setValue('email', email);
        window.localStorage.removeItem('vf_switch_email');
      }
    } catch {
      /* ignore storage failures */
    }
  }, [setValue]);

  const goAfterLogin = (res: AuthResponse) => {
    router.push(res.user.role === 'VENDOR' ? '/portal' : '/dashboard');
  };

  const handleResult = (res: LoginResult) => {
    if ('needsVerification' in res) {
      setPendingEmail(res.email);
      return;
    }
    if ('needsCompanySelection' in res) {
      setChoices(res.companies);
      return;
    }
    goAfterLogin(res);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      setCreds(values);
      handleResult(await login(values));
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  };

  const onPickCompany = async (companyId: string) => {
    if (!creds) return;
    setServerError(null);
    setSelecting(true);
    try {
      handleResult(await login({ ...creds, companyId }));
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSelecting(false);
    }
  };

  if (pendingEmail) {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle="Your account isn't verified yet."
        footer={
          <button
            type="button"
            onClick={() => setPendingEmail(null)}
            className="font-medium text-brand hover:underline"
          >
            ← Back to sign in
          </button>
        }
      >
        <VerifyNotice email={pendingEmail} />
      </AuthLayout>
    );
  }

  if (choices) {
    return (
      <AuthLayout
        title="Choose a company"
        subtitle="This email is used by more than one company. Pick which one to sign in to."
        footer={
          <button
            type="button"
            onClick={() => setChoices(null)}
            className="font-medium text-brand hover:underline"
          >
            ← Use a different account
          </button>
        }
      >
        <div className="space-y-2">
          {choices.map((c) => (
            <button
              key={c.companyId}
              type="button"
              disabled={selecting}
              onClick={() => onPickCompany(c.companyId)}
              className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm font-medium text-ink hover:border-brand disabled:opacity-50"
            >
              {c.companyName}
              <span className="text-brand">→</span>
            </button>
          ))}
        </div>
        {serverError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}
      </AuthLayout>
    );
  }

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
