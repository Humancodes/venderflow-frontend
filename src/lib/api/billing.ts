import type { CheckoutResponse, SubscriptionResponse } from '@/lib/types';
import { apiFetch } from './client';

export function fetchSubscription(): Promise<SubscriptionResponse> {
  return apiFetch<SubscriptionResponse>('/subscription');
}

export function startCheckout(plan: 'STARTER' | 'GROWTH' | 'BUSINESS'): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}
