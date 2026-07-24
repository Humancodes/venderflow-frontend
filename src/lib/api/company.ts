import type { CompanyResponse } from '@/lib/types';
import { apiFetch } from './client';

export function fetchMyCompany(): Promise<CompanyResponse> {
  return apiFetch<CompanyResponse>('/company');
}
