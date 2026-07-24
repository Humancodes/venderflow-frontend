import type { ActivityResponse, MetricsResponse } from '@/lib/types';
import { apiFetch } from './client';

export function fetchMetrics(): Promise<MetricsResponse> {
  return apiFetch<MetricsResponse>('/dashboard/metrics');
}

export function fetchActivity(): Promise<ActivityResponse> {
  return apiFetch<ActivityResponse>('/activity');
}
