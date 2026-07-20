import { create } from 'zustand';
import type { AuthUser } from '@/lib/types';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

// The access token lives HERE, in memory, not in localStorage. It is lost on a
// hard refresh and re-obtained via a silent /auth/refresh using the httpOnly
// cookie. That keeps the long-lived secret out of any JS-readable storage.
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: Status;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));
