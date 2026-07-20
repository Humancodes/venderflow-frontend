'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import type { HealthResponse } from '@/lib/types';

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<HealthResponse>('/health')
      .then(setHealth)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">VendorFlow</h1>
      <div className="rounded-lg border p-4">
        <p className="font-medium">API /health (cross-origin):</p>
        {error && <p className="text-red-600">{error}</p>}
        {health ? (
          <pre className="mt-2 text-sm">{JSON.stringify(health, null, 2)}</pre>
        ) : (
          !error && <p className="text-gray-500">loading…</p>
        )}
      </div>
    </main>
  );
}
