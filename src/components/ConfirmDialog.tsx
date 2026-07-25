'use client';

import { useState, type ReactNode } from 'react';

// Reusable modal for confirmations and destructive actions. With withReason it
// also collects an optional text reason (used for document rejection),
// replacing crude window.prompt/confirm calls.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  withReason = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  withReason?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm(reason);
    } finally {
      setBusy(false);
      onClose();
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
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
        {withReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={3}
            className="mt-4 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handle}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-light'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
