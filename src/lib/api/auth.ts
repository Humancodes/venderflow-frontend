import { useAuthStore } from '@/stores/auth';
import type {
  AcceptInviteBody,
  AuthResponse,
  LoginBody,
  LoginResult,
  SignupBody,
} from '@/lib/types';
import { apiFetch } from './client';

// allowRefresh=false on the auth calls: a 401 here means bad credentials, not an
// expired token, so there is nothing to refresh.
export async function signup(body: SignupBody): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>(
    '/auth/signup',
    { method: 'POST', body: JSON.stringify(body) },
    false,
  );
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data;
}

export async function login(body: LoginBody): Promise<LoginResult> {
  const data = await apiFetch<LoginResult>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(body) },
    false,
  );
  // If the email spans multiple companies, hand the choice back to the caller
  // without starting a session.
  if ('needsCompanySelection' in data) {
    return data;
  }
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data;
}

export async function acceptInvite(body: AcceptInviteBody): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>(
    '/auth/accept-invite',
    { method: 'POST', body: JSON.stringify(body) },
    false,
  );
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' }, false).catch(() => {});
  useAuthStore.getState().clear();
}
