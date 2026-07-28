'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { AuthLayout } from '@/components/AuthLayout';
import { Spinner } from '@/components/Ui';

type Status = 'verifying' | 'error' | 'notoken';

function VerifyEmail() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  // The token is single-use; guard against React's dev double-effect consuming
  // it twice (which would fail the second call).
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus('notoken');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        // Verified + logged in: go straight into the app.
        router.replace(res.user.role === 'VENDOR' ? '/portal' : '/dashboard');
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e instanceof ApiError ? e.message : 'Verification failed');
      });
  }, [token, router]);

  if (status === 'verifying') {
    return (
      <AuthLayout title="Verifying your email" subtitle="This will only take a moment.">
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthLayout>
    );
  }

  const subtitle =
    status === 'notoken' ? 'This link is missing its token.' : 'This link is invalid or expired.';

  return (
    <AuthLayout
      title="Verification failed"
      subtitle={subtitle}
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      }
    >
      <p className="text-sm text-muted">
        {message || 'Please sign in to request a new verification email.'}
      </p>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Verifying your email" subtitle="This will only take a moment.">
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        </AuthLayout>
      }
    >
      <VerifyEmail />
    </Suspense>
  );
}
