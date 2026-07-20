# vendorflow-web

Frontend for VendorFlow. Next.js 15 (App Router) + TypeScript + Tailwind v4.
Calls vendorflow-api over HTTP only. `src/lib/types.ts` and (from Phase 1)
`src/lib/permissions.ts` are hand-written mirrors of the api's `contracts/`.

## Local setup

1. Install:
   ```
   npm install
   ```
2. Copy env (defaults to http://localhost:4000):
   ```
   cp .env.example .env.local
   ```
3. Run (api must be running too):
   ```
   npm run dev
   ```
4. Open http://localhost:3000 . The home page calls the api's /health
   cross-origin and prints the JSON.
