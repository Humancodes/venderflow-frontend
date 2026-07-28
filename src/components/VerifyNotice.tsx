'use client';

import { useState } from 'react';
import { resendVerification } from '@/lib/api/auth';
import { primaryButtonClass } from '@/components/AuthLayout';

// Shown after signup and on a login attempt against an unverified account.
// Explains the pending state and offers to resend the verification link.
export function VerifyNotice({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onResend = async () => {
    setBusy(true);
    try {
      await resendVerification(email);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">
        We sent a verification link to <span className="font-medium text-ink">{email}</span>. Click
        it to activate your account, then sign in. The link expires in 24 hours.
      </p>
      <button
        type="button"
        onClick={onResend}
        disabled={busy || sent}
        className={primaryButtonClass}
      >
        {sent ? 'Verification email sent' : busy ? 'Sending…' : 'Resend verification email'}
      </button>
    </div>
  );
}
