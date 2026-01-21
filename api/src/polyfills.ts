// Polyfill globalThis.crypto for Azure Functions runtime
// Required because @azure/data-tables uses crypto.randomUUID() at module load time
// Node 18 doesn't expose globalThis.crypto properly, but Node 20+ does
// This polyfill ensures compatibility across both versions

import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  (globalThis as unknown as { crypto: typeof webcrypto }).crypto = webcrypto;
}
