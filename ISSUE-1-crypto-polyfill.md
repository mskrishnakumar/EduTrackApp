# GitHub Issue: Fix "crypto is not defined" error with polyfill

## Title
Fix: Azure Functions "crypto is not defined" error - Add polyfill solution

## Labels
`bug`, `backend`, `azure`

## Description

### Problem
Azure Functions fail to load with the error:
```
ReferenceError: Worker was unable to load function getCurrentUser: 'crypto is not defined'
    at randomUUID (/home/site/wwwroot/node_modules/@typespec/ts-http-runtime/dist/commonjs/util/uuidUtils.js:12:5)
    at new PipelineRequestImpl (...)
    at Object.<anonymous> (/home/site/wwwroot/node_modules/@azure/data-tables/dist/index.js:3746:31)
```

### Root Cause
- `@azure/data-tables` 13.1.2 depends on `@typespec/ts-http-runtime`
- This package calls `crypto.randomUUID()` at **module load time**
- Node 18's Azure Functions runtime doesn't properly expose `globalThis.crypto`
- Node 20+ has `globalThis.crypto` built-in

### Solution: Polyfill + Node 20
Add a crypto polyfill that runs before any Azure SDK imports.

### Files to Modify

#### 1. Create `api/src/polyfills.ts`
```typescript
// Polyfill globalThis.crypto for Azure Functions runtime
// Required because @azure/data-tables uses crypto.randomUUID() at module load time
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  (globalThis as unknown as { crypto: typeof webcrypto }).crypto = webcrypto;
}
```

#### 2. Update `api/src/functions/index.ts`
```typescript
// IMPORTANT: Polyfill must be imported FIRST before any Azure SDK imports
import '../polyfills';

// Export all Azure Functions for v3
export * from './students';
export * from './programs';
export * from './milestones';
export * from './attendance';
export * from './dashboard';
export * from './users';
export * from './centers';
```

#### 3. Update `api/package.json`
```json
{
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "@azure/data-tables": "^13.2.2"
  }
}
```

### Verification
1. `cd api && npm install && npm run build` - should compile without errors
2. Deploy to Azure SWA
3. Test `/api/users/me` endpoint - should return 200 instead of crashing

### References
- https://github.com/azure/azure-sdk-for-js/issues/36203
- Node.js crypto.randomUUID: https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
