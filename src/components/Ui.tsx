import type { ReactNode } from 'react';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label ?? 'Loading…'}
    </div>
  );
}

// Skeleton rows for a table body while data loads.
export function SkeletonRows({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-line last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <span className="block h-3 w-24 animate-pulse rounded bg-line" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
