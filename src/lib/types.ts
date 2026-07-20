// Hand-written mirror of vendorflow-api/src/contracts/*.
// The backend is the source of truth. When a contract changes there, update the
// matching type here in the same working session so the two never drift.

// Mirrors api: src/contracts/health.ts -> healthResponseSchema
export type HealthResponse = {
  status: 'ok';
  db: 'up' | 'down';
  timestamp: string;
};
