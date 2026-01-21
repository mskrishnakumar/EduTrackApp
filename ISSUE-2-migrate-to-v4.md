# GitHub Issue: Migrate Azure Functions v3 → v4

## Title
Migrate Azure Functions from v3 to v4 (if polyfill doesn't fix crypto issue)

## Labels
`enhancement`, `backend`, `azure`

## Description

### Context
If the polyfill solution (Issue #1) doesn't resolve the "crypto is not defined" error, a full migration to Azure Functions v4 is required.

### Why v4?
- Azure Functions v4 has better Node 20 support
- Simpler programmatic function registration (no function.json files)
- Better TypeScript support
- Future-proof (v3 will eventually be deprecated)

---

## Migration Steps

### 1. Update `api/package.json`

```json
{
  "name": "edutrack-api",
  "version": "1.0.0",
  "main": "dist/src/functions/index.js",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "prestart": "npm run build",
    "start": "func start",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "@azure/data-tables": "^13.2.2",
    "@azure/functions": "^4.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.0",
    "azure-functions-core-tools": "^4.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 2. Delete All function.json Folders

Remove these 26 folders from `api/`:
```
api/getStudents/
api/getStudent/
api/createStudent/
api/updateStudent/
api/deleteStudent/
api/getPrograms/
api/getProgram/
api/createProgram/
api/updateProgram/
api/deleteProgram/
api/getStudentMilestones/
api/createMilestone/
api/updateMilestone/
api/deleteMilestone/
api/getAttendance/
api/markAttendance/
api/getStudentsForAttendance/
api/getDashboardStats/
api/getProgressAnalytics/
api/getCurrentUser/
api/updateCurrentUser/
api/getCenters/
api/getCenter/
api/createCenter/
api/updateCenter/
api/deleteCenter/
```

### 3. Migrate Function Files to v4 Pattern

#### Example: `api/src/functions/users.ts`

**Before (v3):**
```typescript
import { AzureFunction, Context, HttpRequest } from '@azure/functions';

export const getCurrentUser: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // ... logic ...
  context.res = { status: 200, body: response };
};

export const updateCurrentUser: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // ... logic ...
  context.res = { status: 200, body: response };
};
```

**After (v4):**
```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyAuth } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { User, UserEntity, ApiResponse, CenterEntity } from '../types';

// GET /api/users/me
app.http('getCurrentUser', {
  methods: ['GET'],
  route: 'users/me',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const authResult = await verifyAuth(req, context);
    if (!authResult.success) {
      return { status: authResult.status, jsonBody: { success: false, error: authResult.error } };
    }

    const user = authResult.user!;

    try {
      const usersTable = getTableClient(TABLES.USERS);
      const entity = await usersTable.getEntity<UserEntity>('user', user.id);
      const userEntity = entityToObject<UserEntity>(entity);

      let centerName: string | null = null;
      if (userEntity.centerId) {
        try {
          const centersTable = getTableClient(TABLES.CENTERS);
          const center = await centersTable.getEntity<CenterEntity>('center', userEntity.centerId);
          centerName = center.name;
        } catch {
          centerName = null;
        }
      }

      const userData: User = {
        id: userEntity.rowKey,
        email: userEntity.email,
        displayName: userEntity.displayName,
        role: userEntity.role,
        centerId: userEntity.centerId || null,
        centerName: centerName,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
      };

      return { status: 200, jsonBody: { success: true, data: userData } };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        const userData: User = {
          id: user.id,
          email: user.email || '',
          displayName: user.displayName || '',
          role: user.role,
          centerId: user.centerId || null,
          centerName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { status: 200, jsonBody: { success: true, data: userData } };
      }

      context.error('Error fetching user:', error);
      return { status: 500, jsonBody: { success: false, error: 'Failed to fetch user profile' } };
    }
  }
});

// PUT /api/users/me
app.http('updateCurrentUser', {
  methods: ['PUT'],
  route: 'users/me',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // ... similar migration pattern ...
  }
});
```

### 4. Update Middleware for v4

**`api/src/middleware/auth.ts`** - Change signature:
```typescript
// Before (v3)
export async function verifyAuth(req: HttpRequest, context: Context)

// After (v4)
import { HttpRequest, InvocationContext } from '@azure/functions';
export async function verifyAuth(req: HttpRequest, context: InvocationContext)
```

### 5. Update `api/src/functions/index.ts`

```typescript
// v4 uses programmatic registration - just import files to register
import './students';
import './programs';
import './milestones';
import './attendance';
import './dashboard';
import './users';
import './centers';
```

### 6. Update GitHub Workflow

Add explicit build command in `.github/workflows/azure-static-web-apps-*.yml`:
```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    # ... existing config ...
    api_build_command: "npm install && npm run build"
```

### 7. Update `api/host.json` (if needed)

Ensure it's v4 compatible:
```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  }
}
```

---

## Key Differences: v3 vs v4

| Aspect | v3 | v4 |
|--------|----|----|
| Function definition | Export named function + function.json | `app.http()` registration |
| Handler signature | `(context: Context, req: HttpRequest)` | `(req: HttpRequest, context: InvocationContext)` |
| Response | `context.res = { body: ... }` | `return { jsonBody: ... }` |
| Logging | `context.log()` | `context.info()`, `context.error()` |
| Function discovery | function.json in separate folders | Programmatic via imports |

---

## Files to Migrate

1. `api/src/functions/students.ts` - 5 functions
2. `api/src/functions/programs.ts` - 5 functions
3. `api/src/functions/milestones.ts` - 4 functions
4. `api/src/functions/attendance.ts` - 3 functions
5. `api/src/functions/dashboard.ts` - 2 functions
6. `api/src/functions/users.ts` - 2 functions
7. `api/src/functions/centers.ts` - 5 functions
8. `api/src/middleware/auth.ts` - Update types

---

## Verification

1. Run locally: `cd api && npm install && npm run build && npm start`
2. Test endpoints with curl/Postman
3. Deploy to Azure SWA
4. Verify all `/api/*` endpoints work

---

## References
- Azure Functions v4 migration: https://learn.microsoft.com/en-us/azure/azure-functions/functions-node-upgrade-v4
- v4 HTTP triggers: https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4
