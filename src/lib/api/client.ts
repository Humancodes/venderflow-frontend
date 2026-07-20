import { useAuthStore } from '@/stores/auth';
import type { AuthResponse } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Single in-flight refresh shared by all callers, so a burst of 401s triggers
// exactly one /auth/refresh, not one per request.
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    // credentials: 'include' sends the httpOnly refresh cookie cross-origin.
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      useAuthStore.getState().clear();
      return false;
    }
    const data = (await res.json()) as AuthResponse;
    useAuthStore.getState().setAuth(data.user, data.accessToken);
    return true;
  } catch {
    useAuthStore.getState().clear();
    return false;
  }
}

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// The typed fetch wrapper. Attaches the access token, and on a 401 tries a
// silent refresh once, then retries the original request.
export async function apiFetch<T>(path: string, init?: RequestInit, allowRefresh = true): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401 && allowRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, init, false);
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
