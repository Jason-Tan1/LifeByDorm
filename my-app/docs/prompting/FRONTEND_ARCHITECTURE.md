# LifeByDorm — Frontend Architecture Blueprint

> **Purpose**: This document is a detailed restructuring prompt. Use it to reorganize all
> frontend files from the current flat `my-app/` root into a dedicated `client/` directory,
> following enterprise-grade conventions. Every file, folder, and configuration is listed
> explicitly so nothing is missed and zero functionality is broken.

---

## 1. Target Directory Tree

```
client/
├── public/                         # Static assets served as-is by Vite
│   ├── LifeByDormShortLogo.png
│   └── LifeByDormShortLogoSquare.png
│
├── src/
│   ├── main.tsx                    # React root – mounts <App /> with GoogleOAuthProvider
│   ├── App.tsx                     # Router, lazy-loaded routes, CookieConsent
│   ├── i18n.ts                     # i18next initialization
│   │
│   ├── assets/                     # Images bundled by Vite (import-based)
│   │   ├── BackgroundCampus.jpg
│   │   ├── Default_Campus.png
│   │   ├── Default_Dorm.png
│   │   └── LBDLogo-removebg-preview.png
│   │
│   ├── components/                 # Shared / reusable UI components
│   │   ├── CookieConsent.tsx
│   │   ├── CookieConsent.css
│   │   ├── PageLoader.tsx
│   │   ├── PageLoader.css
│   │   ├── SkeletonCard.tsx
│   │   └── SkeletonCard.css
│   │
│   ├── context/                    # React context providers
│   │   └── UniversityDataContext.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   └── useDebounce.ts
│   │
│   ├── utils/                      # Utility / helper modules
│   │   └── (existing utils)
│   │
│   ├── locales/                    # i18n translation files
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── fr/
│   │       └── translation.json
│   │
│   ├── pages/                      # All route-level page components
│   │   ├── home/                   # Homepage
│   │   │   ├── home.tsx
│   │   │   ├── home.css
│   │   │   ├── searchbar.tsx
│   │   │   ├── searchbar.css
│   │   │   ├── footer.tsx
│   │   │   └── footer.css
│   │   │
│   │   ├── universities/           # University listing & dashboard
│   │   │   ├── AllUniversities.tsx
│   │   │   ├── allUniversities.css
│   │   │   ├── UniversityDash.tsx
│   │   │   ├── universityDash.css
│   │   │   ├── AddDorm.tsx
│   │   │   └── AddDorm.css
│   │   │
│   │   ├── dorms/                  # Dorm detail & review pages
│   │   │   ├── dorms.tsx
│   │   │   ├── dorms.css
│   │   │   ├── DormInfo.tsx
│   │   │   ├── ReviewsList.tsx
│   │   │   ├── review.tsx
│   │   │   └── review.css
│   │   │
│   │   ├── nav/                    # Navbar, About, Contact, Login, Account
│   │   │   ├── navbar.tsx
│   │   │   ├── navbar.css
│   │   │   ├── aboutme.tsx
│   │   │   ├── aboutme.css
│   │   │   ├── contactme.tsx
│   │   │   ├── contactme.css
│   │   │   ├── login.tsx
│   │   │   ├── login.css
│   │   │   ├── account.tsx
│   │   │   └── account.css
│   │   │
│   │   ├── admin/                  # Admin dashboard
│   │   │   └── dashboard.tsx
│   │   │
│   │   └── legal/                  # Legal pages
│   │       ├── TermsOfService.tsx
│   │       ├── PrivacyPolicy.tsx
│   │       └── legal.css
│   │
│   └── __tests__/                  # All frontend tests
│       ├── setup.ts                # Vitest setup (cleanup, jest-dom)
│       ├── home.test.tsx           # Homepage tests
│       └── searchbar.test.tsx      # Searchbar tests
│
├── index.html                      # Vite HTML entry point
├── package.json                    # Frontend dependencies & scripts
├── package-lock.json
├── tsconfig.json                   # Root TS config (references app + node)
├── tsconfig.app.json               # App TS config (includes "src")
├── tsconfig.node.json              # Node TS config (includes "vite.config.ts")
├── vite.config.ts                  # Vite dev server + proxy config
├── vitest.config.ts                # Frontend test runner config
├── eslint.config.js                # ESLint for React/TS
├── .env                            # VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_MAPS_API_KEY
├── .env.local                      # Local overrides (gitignored)
└── .env.example                    # Template for env variables
```

---

## 2. Migration Map (Current → New)

| Current Path | New Path |
|---|---|
| `my-app/src/**` | `client/src/**` (with subfolders reorganized into `pages/`, `__tests__/`) |
| `my-app/src/homepage/*` | `client/src/pages/home/*` |
| `my-app/src/NavBarPages/*` | `client/src/pages/nav/*` |
| `my-app/src/UniversitiesPage/*` | `client/src/pages/universities/*` |
| `my-app/src/dorms/*` | `client/src/pages/dorms/*` |
| `my-app/src/admin/*` | `client/src/pages/admin/*` |
| `my-app/src/legal/*` | `client/src/pages/legal/*` |
| `my-app/src/test/setup.ts` | `client/src/__tests__/setup.ts` |
| `my-app/src/homepage/home.test.tsx` | `client/src/__tests__/home.test.tsx` |
| `my-app/src/homepage/searchbar.test.tsx` | `client/src/__tests__/searchbar.test.tsx` |
| `my-app/src/components/*` | `client/src/components/*` (unchanged) |
| `my-app/src/context/*` | `client/src/context/*` (unchanged) |
| `my-app/src/hooks/*` | `client/src/hooks/*` (unchanged) |
| `my-app/src/utils/*` | `client/src/utils/*` (unchanged) |
| `my-app/src/locales/*` | `client/src/locales/*` (unchanged) |
| `my-app/src/assets/*` | `client/src/assets/*` (unchanged) |
| `my-app/public/*` | `client/public/*` |
| `my-app/index.html` | `client/index.html` |
| `my-app/package.json` | `client/package.json` |
| `my-app/package-lock.json` | `client/package-lock.json` |
| `my-app/vite.config.ts` | `client/vite.config.ts` |
| `my-app/vitest.config.ts` | `client/vitest.config.ts` |
| `my-app/tsconfig.json` | `client/tsconfig.json` |
| `my-app/tsconfig.app.json` | `client/tsconfig.app.json` |
| `my-app/tsconfig.node.json` | `client/tsconfig.node.json` |
| `my-app/eslint.config.js` | `client/eslint.config.js` |
| `my-app/.env` | `client/.env` |
| `my-app/.env.local` | `client/.env.local` |
| `my-app/.env.example` | `client/.env.example` (frontend env only) |

---

## 3. Configuration Updates Required

### 3.1 `client/package.json`

**Keep only frontend dependencies.** Remove all backend dependencies (express, mongoose, bcryptjs, cors, jsonwebtoken, nodemailer, helmet, compression, etc.) that are duplicated in the frontend package.json.

**Scripts** (keep exactly as-is):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

### 3.2 `client/vite.config.ts`

No changes needed. Dev proxy config remains:
```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
    '/auth': { target: 'http://localhost:3000', changeOrigin: true, secure: false }
  }
}
```

### 3.3 `client/vitest.config.ts`

Update the setup file path:
```ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',   // Changed from ./src/test/setup.ts
    css: true,
  },
});
```

### 3.4 `client/index.html`

Update the script src. No change needed if `src/main.tsx` path stays the same relative to `client/`:
```html
<script type="module" src="/src/main.tsx"></script>
```

### 3.5 `client/src/App.tsx`

Update ALL lazy import paths to the new `pages/` subdirectory:
```tsx
const Home = lazy(() => import('./pages/home/home.tsx'));
const AboutMe = lazy(() => import('./pages/nav/aboutme.tsx'));
const ContactMe = lazy(() => import('./pages/nav/contactme.tsx'));
const Account = lazy(() => import('./pages/nav/account.tsx'));
const University = lazy(() => import('./pages/universities/UniversityDash.tsx'));
const Dorms = lazy(() => import('./pages/dorms/dorms.tsx'));
const NavBar = lazy(() => import('./pages/nav/navbar.tsx'));
const SearchBar = lazy(() => import('./pages/home/searchbar.tsx'));
const Review = lazy(() => import('./pages/dorms/review.tsx'));
const AllUniversities = lazy(() => import('./pages/universities/AllUniversities.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService.tsx'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy.tsx'));
```

### 3.6 Internal CSS/Asset Imports

Within each moved page component, verify that CSS imports resolve correctly. Since each page's `.css` file moves alongside its `.tsx` file, **relative imports within the same folder stay unchanged**:
```tsx
// Example: inside client/src/pages/home/home.tsx
import './home.css';           // ✅ Same-folder import — still works
import '../../assets/...';     // ✅ Update depth as needed
```

**Components referenced across pages** (like `navbar.tsx` imported by other pages) should use paths relative to the new structure. Search for cross-folder imports and update:
```tsx
// If home.tsx imports navbar: update relative path
import NavBar from '../nav/navbar';
```

### 3.7 API_BASE Pattern

Multiple frontend files use this pattern (no changes needed — it's self-contained):
```tsx
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');
```

**Files using API_BASE** (10 files — verify each after move):
- `pages/home/home.tsx`
- `pages/home/searchbar.tsx`
- `pages/nav/login.tsx`
- `pages/nav/account.tsx`
- `pages/universities/UniversityDash.tsx`
- `pages/universities/AddDorm.tsx`
- `pages/dorms/dorms.tsx`
- `pages/dorms/review.tsx`
- `pages/admin/dashboard.tsx`
- `context/UniversityDataContext.tsx`

---

## 4. Test Configuration

### Test Files
| Current | New |
|---|---|
| `src/test/setup.ts` | `src/__tests__/setup.ts` |
| `src/homepage/home.test.tsx` | `src/__tests__/home.test.tsx` |
| `src/homepage/searchbar.test.tsx` | `src/__tests__/searchbar.test.tsx` |

### `src/__tests__/setup.ts` (unchanged content)
```ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => { cleanup(); });
```

### Test Import Paths
Update test file imports to match new page locations:
```tsx
// home.test.tsx — update import if it imports from pages/home/home
import Home from '../pages/home/home';
```

---

## 5. Deployment Considerations

### Vercel (Frontend)

A new `client/vercel.json` should be created:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```
> Note: API rewrites are now handled by the backend deployment, not the frontend.

### Docker

The frontend Dockerfile stage will need its build context updated to `client/`. See `BACKEND_ARCHITECTURE.md` for full Docker updates.

---

## 6. Verification Checklist

- [ ] `cd client && npm install` succeeds
- [ ] `npm run dev` starts Vite on port 5173
- [ ] All pages load without 404 or blank screens
- [ ] `npm run build` produces `dist/` without errors
- [ ] `npm run test:run` passes all tests
- [ ] `npm run lint` shows no errors
- [ ] API calls to `/api/*` and `/auth/*` route correctly via Vite proxy
- [ ] Google OAuth login works
- [ ] i18n language switching works (EN / FR)
- [ ] All images load (assets + public)
- [ ] CookieConsent banner renders
- [ ] Admin dashboard loads for admin users
