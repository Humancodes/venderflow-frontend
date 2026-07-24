'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createVendor } from '@/lib/api/vendors';
import { ApiError } from '@/lib/api/client';
import { inputClass, primaryButtonClass } from '@/components/AuthLayout';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});
type Values = z.infer<typeof schema>;

export function AddVendorDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    setServerError(null);
    try {
      await createVendor(v);
      onAdded();
      onClose();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Failed to add vendor');
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
        <h2 className="text-lg font-semibold text-ink">Add a vendor</h2>
        <p className="mt-1 text-sm text-muted">Create the record, then invite them to the portal.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div>
            <label className="text-sm font-medium text-ink">Vendor name</label>
            <input className={inputClass} {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Contact email</label>
            <input type="email" className={inputClass} {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
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
              {isSubmitting ? 'Adding…' : 'Add vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
