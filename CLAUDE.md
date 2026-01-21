# EduTrack - Development Summary

## Project Overview
EduTrack is a Student Progress Monitoring web application built for educators to track student progress, milestones, and attendance.

## Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v3
- **Backend**: Azure Functions (TypeScript) - planned
- **Database**: Azure Table Storage - planned
- **Auth**: Supabase Auth (email/password)
- **Charts**: Recharts
- **Reports**: jsPDF, xlsx
- **Icons**: Heroicons

## Project Structure
```
EduTrack/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Modal, Badge, Card, Table, Select
│   │   │   ├── layout/          # Sidebar, Topbar, AppLayout
│   │   │   ├── auth/            # LoginForm, LoginHero, ProtectedRoute
│   │   │   ├── dashboard/       # StatCard, RecentActivity, QuickStats, QuarterGoalCard
│   │   │   ├── students/        # StudentTable, StudentForm, StudentCard
│   │   │   ├── milestones/      # MilestoneForm, MilestoneTimeline
│   │   │   ├── programs/        # ProgramTable, ProgramForm
│   │   │   ├── attendance/      # AttendanceGrid, AttendanceCalendar
│   │   │   ├── analytics/       # Charts and analytics components
│   │   │   └── reports/         # Report generation components
│   │   ├── pages/               # All page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API services
│   │   ├── context/             # AuthContext
│   │   ├── types/               # TypeScript interfaces
│   │   ├── constants/           # Routes, etc.
│   │   └── utils/               # Utility functions
│   ├── tailwind.config.js       # Tailwind v3 configuration
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── api/                         # Azure Functions (planned)
└── EduTrack - Student Progress Monitoring.html  # Design mockup reference
```

## Design Specifications (from Mockup)
- **Primary Color**: #10B981 (green)
- **Secondary Color**: #3B82F6 (blue)
- **Warning Color**: #F59E0B (amber)
- **Info Color**: #06B6D4 (cyan)
- **Font**: Inter, 14px body (0.875rem), 13px nav (0.8125rem)
- **Sidebar**: 240px width (w-60), collapsible to 64px (w-16)
- **Topbar Height**: 72px
- **Border Radius**: 14px cards, 10px inputs, 6px badges
- **Background**: #F7F8FA (gray-bg)

## Completed Work

### 1. Tailwind CSS Migration (v4 → v3)
The project was initially set up with Tailwind v4 which uses a different configuration approach (`@theme` blocks in CSS). This caused styling issues. Migration to v3 included:

- **package.json**: Changed `tailwindcss` from `^4.1.18` to `^3.4.17`, removed `@tailwindcss/postcss`
- **tailwind.config.js**: Created proper v3 config with:
  - Custom colors (primary, secondary, success, warning, info, sidebar, gray-bg, gray-border, text-primary, text-secondary)
  - Custom font sizes (nav, body)
  - Custom spacing (sidebar, sidebar-collapsed, topbar)
  - Custom border radius (card, input, badge)
  - Custom shadows (card, card-hover)
- **postcss.config.js**: Changed from `@tailwindcss/postcss` to standard `tailwindcss` plugin
- **index.css**: Replaced v4's `@theme` block with v3's `@tailwind` directives and `@layer components`

### 2. Layout Components
- **AppLayout.tsx**: Main layout wrapper with sidebar margin handling (`lg:ml-60` / `lg:ml-16`)
- **Sidebar.tsx**: Fixed 240px sidebar with collapsible state, navigation items, user profile, logout
- **Topbar.tsx**: 72px sticky header with search, settings, notifications, user avatar

### 3. Auth Components
- **LoginPage.tsx**: Split-screen layout with hero section and login form
- **LoginHero.tsx**: Green gradient hero with features list
- **LoginForm.tsx**: Email/password form with validation
- **AuthContext.tsx**: Supabase auth integration with mock fallback for development

### 4. Common Components
- **Button.tsx**: Primary, secondary, danger variants with loading state
- **Input.tsx**: Form input with label, error, helper text
- **Modal.tsx**: Overlay modal with header, body, footer
- **Card.tsx**: Card container with CardHeader and CardLink
- **Badge.tsx**: Milestone type badges (academic, life-skills, attendance)
- **Select.tsx**: Styled select dropdown
- **Table.tsx**: Table components for data display

### 5. Dashboard Components
- **StatCard.tsx**: Stats display with icon, value, change indicator
- **QuarterGoalCard.tsx**: Circular progress indicator
- **RecentActivity.tsx**: Activity feed with milestone badges
- **QuickStats.tsx**: Program enrollment progress bars

### 6. Pages Implemented
- **LoginPage**: Authentication
- **DashboardPage**: Overview with stats, activity, quick stats
- **StudentsPage**: Student list with search/filter
- **StudentDetailPage**: Individual student profile with milestones timeline
- **ProgramsPage**: Program management
- **AttendancePage**: Attendance tracking
- **AnalyticsPage**: Charts and analytics
- **ReportsPage**: Report generation
- **SettingsPage**: User settings

## Current State
- Frontend builds successfully (`npm run build`)
- CSS output: ~26 kB
- All Tailwind classes working properly
- **Mock data service implemented** - frontend works standalone in development
- Auth context with Supabase integration (uses mock data when Supabase not configured)

## Architecture: Mock Data vs Real API

The frontend uses a **unified data service** that automatically switches between:

1. **Local Development (Mock Data)**: When running `npm run dev` without `VITE_API_URL` set
   - Uses mock data from `src/services/mockData.ts`
   - No backend needed for UI development
   - Full CRUD operations work in-memory

2. **Production / Azure SWA**: When `VITE_API_URL` is set or deployed to Azure Static Web Apps
   - Calls real Azure Functions API at `/api/*`
   - Requires Azure Table Storage backend

### Key Service Files
- `src/services/dataService.ts` - Unified API (use this in components)
- `src/services/mockApi.ts` - Mock data implementations
- `src/services/mockData.ts` - Sample data (students, programs, milestones, etc.)
- `src/services/api.ts` - Real API client

### Usage in Components
```typescript
import { dataService } from '../services/dataService';

// Get students (uses mock or real API automatically)
const response = await dataService.students.getAll({ search: 'John' });

// Create student
const result = await dataService.students.create({ name: 'New Student', ... });
```

## Running the Project

### Frontend Only (with Mock Data)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 - works without any backend!

### With Backend (optional, for Azure Table Storage integration)
1. Install Azurite: `npm install -g azurite`
2. Start Azurite: `azurite --silent --location c:\azurite`
3. Start API: `cd api && npm run start`
4. Start Frontend with API: `VITE_API_URL=http://localhost:7071/api npm run dev`

## Deployment to Azure Static Web Apps

The project is designed for Azure Static Web Apps which:
- Hosts frontend static files
- Runs Azure Functions as the `/api` backend
- Handles auth routing automatically

### Azure SWA Deployment Learnings (IMPORTANT)

#### Environment Variables Required

**Frontend (VITE_ prefix)** - Set in GitHub Secrets AND Azure SWA Configuration:
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL for frontend auth |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

**Backend (Azure Functions)** - Set ONLY in Azure SWA Configuration (Application Settings):
| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Same as VITE_SUPABASE_URL (backend needs it too) |
| `SUPABASE_SERVICE_KEY` | Supabase **service role key** (secret key, NOT anon key) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Table Storage connection string |

⚠️ **Critical**: Backend vars are DIFFERENT from frontend vars. The service key is secret and must never be exposed to frontend.

#### Azure Functions v4 + TypeScript Configuration

For Azure Functions v4 with TypeScript to work on Azure SWA:

1. **package.json** must have:
   ```json
   {
     "type": "commonjs",
     "main": "dist/src/functions/index.js",
     "engines": { "node": ">=18.0.0" },
     "dependencies": {
       "@azure/functions": "^4.5.0"
     }
   }
   ```

2. **host.json** - Set empty routePrefix (SWA adds `/api` automatically):
   ```json
   {
     "version": "2.0",
     "extensionBundle": {
       "id": "Microsoft.Azure.Functions.ExtensionBundle",
       "version": "[4.*, 5.0.0)"
     },
     "extensions": {
       "http": {
         "routePrefix": ""
       }
     }
   }
   ```

3. **src/functions/index.ts** - Must import all function files:
   ```typescript
   import './students';
   import './programs';
   // ... etc
   ```

4. **tsconfig.json** - Output to `dist/`:
   ```json
   {
     "compilerOptions": {
       "module": "commonjs",
       "outDir": "dist",
       "rootDir": "."
     },
     "include": ["src/**/*"]
   }
   ```

#### GitHub Actions Workflow

Minimal working workflow for React + Azure Functions:
```yaml
- uses: Azure/static-web-apps-deploy@v1
  with:
    app_location: "./frontend"
    api_location: "./api"
    output_location: "dist"
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Do NOT use `skip_api_build: true`** - Let Oryx detect and build the API for proper runtime detection.

#### Auth Token Flow (Critical Bug Fix)

When using Supabase Auth with a custom API, the auth token must be passed from frontend to backend:

```typescript
// In AuthContext.tsx - call setAuthToken when session changes
import { setAuthToken } from '../services/dataService';

// On login/session restore:
setAuthToken(session?.access_token ?? null);

// On logout:
setAuthToken(null);
```

Without this, API calls go out without `Authorization: Bearer <token>` header and fail with 401.

#### Common Deployment Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `404 Not Found` on `/api/*` | API not deployed or built | Check workflow, ensure TypeScript compiles |
| `Function language info isn't provided` | Oryx can't detect Node.js | Add `engines` field, don't use `skip_api_build` |
| `Request failed` after login | Auth token not passed to API | Wire up `setAuthToken()` in AuthContext |
| `401 Unauthorized` | Missing/invalid backend env vars | Add `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in Azure |

#### staticwebapp.config.json

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "*.{css,js,png,jpg,jpeg,gif,svg,ico,woff,woff2}"]
  },
  "routes": [
    { "route": "/api/*", "allowedRoles": ["anonymous"] }
  ]
}
```

## Known Issues / TODOs
1. Large JS bundle size (876 kB) - could benefit from code splitting
2. Backend API exists but requires Azurite for local development
3. Azure Table Storage tables auto-create on first access
4. Need to configure Supabase for real authentication

## Key Files for Reference
- **Design Mockup**: `EduTrack - Student Progress Monitoring.html`
- **Tailwind Config**: `frontend/tailwind.config.js`
- **Global Styles**: `frontend/src/index.css`
- **Routes**: `frontend/src/constants/routes.ts`
- **Types**: `frontend/src/types/index.ts`

## Color Classes Reference
```
bg-primary         → #10B981 (green)
bg-primary-dark    → #059669
bg-secondary       → #3B82F6 (blue)
bg-warning         → #F59E0B (amber)
bg-warning-light   → #FEF3C7
bg-info            → #06B6D4 (cyan)
bg-gray-bg         → #F7F8FA
text-text-primary  → #1F2937
text-text-secondary → #6B7280
border-gray-border → #E5E7EB
```

## Border Radius Classes
```
rounded-card   → 14px
rounded-input  → 10px
rounded-badge  → 6px
```
