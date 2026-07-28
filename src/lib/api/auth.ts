import { useAuthStore } from '@/stores/auth';
import type {
  AcceptInviteBody,
  AuthResponse,
  LoginBody,
  LoginResult,
  SignupBody,
  VerificationPendingResponse,
} from '@/lib/types';
import { apiFetch } from './client';

// allowRefresh=false on the auth calls: a 401 here means bad credentials, not an
// expired token, so there is nothing to refresh.

// Signup no longer starts a session: it returns a "verify your email" state.
export async function signup(body: SignupBody): Promise<VerificationPendingResponse> {
  return apiFetch<VerificationPendingResponse>(
    '/auth/signup',
    { method: 'POST', body: JSON.stringify(body) },
    false,
  );
}

export async function login(body: LoginBody): Promise<LoginResult> {
  const data = await apiFetch<LoginResult>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(body) },
    false,
  );
  // Non-session outcomes (pick a company / verify your email): hand back to the
  // caller without starting a session.
  if ('needsCompanySelection' in data || 'needsVerification' in data) {
    return data;
  }
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data;
}

// The verification link lands here: exchange the token for a live session.
export async function verifyEmail(token: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>(
    '/auth/verify-email',
    { method: 'POST', body: JSON.stringify({ token }) },
    false,
  );
  useAuthStore.getState().setAuth(data.user, data.accessToken);
  return data;
}

// Ask for a fresh verification email. Fire-and-forget; the server never reveals
// whether the address exists.
export async function resendVerification(email: string): Promise<void> {
  await apiFetch('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, false);
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
