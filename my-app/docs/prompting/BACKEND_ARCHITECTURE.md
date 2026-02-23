# LifeByDorm — Backend Architecture Blueprint

> **Purpose**: This document is a detailed restructuring prompt. Use it to reorganize all
> backend files from the current `my-app/server/` subdirectory into a standalone `server/`
> directory at the project root, with enterprise-grade conventions for source, tests, models,
> seed data, infrastructure (Docker), and deployment configuration.

---

## 1. Target Directory Tree

```
server/
├── src/                            # All backend source code
│   ├── server.ts                   # Express app — middleware, routes, DB connection (1650 lines)
│   ├── validation.ts               # Zod schemas & validation middleware
│   ├── s3.ts                       # AWS S3 upload/signed-URL utilities
│   ├── lambda.ts                   # AWS Lambda handler (serverless-http wrapper)
│   │
│   ├── models/                     # Mongoose schemas & TS interfaces
│   │   ├── user.ts                 # User model (IUser, email/password/oauth/verification)
│   │   ├── dorm.ts                 # Dorm model (IDorm, slug, amenities, approval status)
│   │   ├── universities.ts         # University model (IUniversity, slug, location)
│   │   └── userreview.ts           # UserReview model (IReview, ratings, status, indexes)
│   │
│   └── api/                        # Vercel serverless entrypoint
│       └── index.ts                # Re-exports Express app for Vercel Functions
│
├── tests/                          # All backend test files
│   ├── server.test.ts              # API integration tests (supertest + vitest)
│   └── test-db.js                  # Database connection test utility
│
├── seed/                           # Database seed data & migration scripts
│   ├── seed.ts                     # Main seed script (inserts universities + dorms)
│   ├── universityInformation.json  # University seed data (16 KB)
│   ├── dormInformation.json        # Dorm seed data (8 KB)
│   ├── admins.json                 # Admin email list
│   ├── indexes.js                  # MongoDB index creation script
│   └── migrate-slugs.js           # Data migration: add slug fields
│
├── dist/                           # Compiled JS output (gitignored)
│
├── package.json                    # Backend dependencies & scripts
├── package-lock.json
├── tsconfig.json                   # TypeScript config for backend
├── vitest.config.ts                # Backend test runner config
├── serverless.yml                  # AWS Lambda (Serverless Framework) config
├── .env                            # Backend environment variables (gitignored)
├── .env.local                      # Local overrides (gitignored)
├── .env.production                 # Production env (gitignored)
├── .gitignore                      # Backend-specific gitignore
└── vercel.json                     # Vercel deployment config for API
```

---

## 2. Migration Map (Current → New)

| Current Path | New Path |
|---|---|
| `my-app/server/server.ts` | `server/src/server.ts` |
| `my-app/server/validation.ts` | `server/src/validation.ts` |
| `my-app/server/s3.ts` | `server/src/s3.ts` |
| `my-app/server/lambda.ts` | `server/src/lambda.ts` |
| `my-app/server/models/*` | `server/src/models/*` |
| `my-app/server/api/index.ts` | `server/src/api/index.ts` |
| `my-app/server/server.test.ts` | `server/tests/server.test.ts` |
| `my-app/server/test-db.js` | `server/tests/test-db.js` |
| `my-app/server/seed/*` | `server/seed/*` (unchanged location) |
| `my-app/server/dist/*` | `server/dist/*` (unchanged) |
| `my-app/server/package.json` | `server/package.json` |
| `my-app/server/package-lock.json` | `server/package-lock.json` |
| `my-app/server/tsconfig.json` | `server/tsconfig.json` |
| `my-app/server/vitest.config.ts` | `server/vitest.config.ts` |
| `my-app/server/serverless.yml` | `server/serverless.yml` |
| `my-app/server/vercel.json` | `server/vercel.json` |
| `my-app/server/.env` | `server/.env` |
| `my-app/server/.env.local` | `server/.env.local` |
| `my-app/server/.env.production` | `server/.env.production` |
| `my-app/server/.gitignore` | `server/.gitignore` |
| `my-app/server/server.ts.old` | **DELETE** (legacy, not needed) |

---

## 3. Configuration Updates Required

### 3.1 `server/tsconfig.json`

Update `rootDir` and `include` to point to the new `src/` folder:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "jsx": "react",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "seed"]
}
```

### 3.2 `server/package.json`

Update scripts to reflect the `src/` subdirectory:

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "deploy": "npx serverless deploy",
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "devStart": "nodemon --exec ts-node src/server.ts",
    "seed": "ts-node seed/seed.ts",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

> **Key changes:**
> - `dev` → `ts-node src/server.ts` (was `ts-node server.ts`)
> - `devStart` → `nodemon --exec ts-node src/server.ts` (was `nodemon --exec ts-node server.ts`)
> - `seed` stays as `ts-node seed/seed.ts` (seed folder is at the server root, not inside `src/`)
> - `start` stays as `node dist/server.js` (TypeScript compiles `src/server.ts` → `dist/server.js`)

### 3.3 `server/vitest.config.ts`

No changes needed — the config itself is simple:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],  // ADD: explicitly point to tests/ folder
  },
});
```

### 3.4 Internal Import Paths (within `src/`)

Since all source files move into `src/` together, **relative imports between them stay the same**:

```ts
// server.ts — these imports are unchanged because models/ is still a sibling
import { User, IUser } from './models/user';
import { UserReview } from './models/userreview';
import { University } from './models/universities';
import { Dorm } from './models/dorm';
import { uploadToS3, getSignedFileUrl } from './s3';
import { validate, registerSchema, ... } from './validation';
```

```ts
// lambda.ts — unchanged
import serverless from 'serverless-http';
import app from './server';
```

```ts
// api/index.ts — unchanged
import app from '../server';
```

### 3.5 `server/serverless.yml`

Update the handler path:
```yaml
functions:
  api:
    handler: src/lambda.handler    # Was: lambda.handler
```

> Or if using esbuild bundling (which is the case), it may need:
> ```yaml
> handler: dist/lambda.handler
> ```
> Verify based on your Serverless Framework build config.

### 3.6 `server/vercel.json`

Update the API rewrite destination:
```json
{
  "version": 2,
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/src/api/index.ts" }
  ]
}
```

### 3.7 Seed Script Import Paths

The seed script (`seed/seed.ts`) imports models. Since models are now at `src/models/`, update:
```ts
// seed.ts — update model imports
import { University } from '../src/models/universities';
import { Dorm } from '../src/models/dorm';
```

---

## 4. Docker & Infrastructure

### 4.1 Target Docker Directory Tree

```
docker/
├── Dockerfile                      # Multi-stage production build
├── Dockerfile.dev                  # Development build with hot-reloading
├── docker-compose.yml              # Production compose (MongoDB + App)
├── docker-compose.dev.yml          # Development compose (MongoDB + Backend + Frontend)
├── mongo-init.js                   # MongoDB initialization script
└── .dockerignore                   # Docker build exclusions
```

### 4.2 Migration Map (Docker Files)

| Current Path | New Path |
|---|---|
| `my-app/Dockerfile` | `docker/Dockerfile` |
| `my-app/Dockerfile.dev` | `docker/Dockerfile.dev` |
| `my-app/docker-compose.yml` | `docker/docker-compose.yml` |
| `my-app/docker-compose.dev.yml` | `docker/docker-compose.dev.yml` |
| `my-app/docker/mongo-init.js` | `docker/mongo-init.js` |
| `my-app/.dockerignore` | `docker/.dockerignore` |

### 4.3 `docker/Dockerfile` (Production)

Update all COPY/WORKDIR paths. Build context is now the **project root** (parent of both `client/` and `server/`):

```dockerfile
# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Stage 2: Frontend Dependencies
FROM base AS frontend-deps
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 3: Backend Dependencies
FROM base AS backend-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 4: Build Frontend
FROM frontend-deps AS frontend-builder
WORKDIR /app/client
COPY client/ .
ARG VITE_API_BASE=/api
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

# Stage 5: Build Backend
FROM backend-deps AS backend-builder
WORKDIR /app/server
COPY server/ .
RUN npm run build

# Stage 6: Production Runtime
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy backend
COPY --from=backend-deps /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/package.json ./server/
COPY server/seed ./server/seed
COPY server/src/models ./server/src/models

# Copy frontend build output
COPY --from=frontend-builder /app/client/dist ./dist

RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

WORKDIR /app/server
CMD ["node", "dist/server.js"]
```

### 4.4 `docker/Dockerfile.dev`

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Frontend
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm ci --legacy-peer-deps

# Backend
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --legacy-peer-deps

COPY . .
EXPOSE 5173 3000
CMD ["npm", "run", "dev"]
```

### 4.5 `docker/docker-compose.yml` (Production)

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: lifebydorm-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-adminpassword}
      MONGO_INITDB_DATABASE: lifebydorm
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - lifebydorm-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  app:
    build:
      context: ..                    # Project root (parent of docker/)
      dockerfile: docker/Dockerfile
      args:
        - VITE_API_BASE=/api
        - VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-}
    container_name: lifebydorm-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-adminpassword}@mongodb:27017/lifebydorm?authSource=admin
      ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET:-your-super-secret-jwt-key-change-in-production}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      ADMIN_EMAILS: ${ADMIN_EMAILS:-}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-}
      AWS_REGION: ${AWS_REGION:-us-east-1}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET:-}
    ports:
      - "3000:3000"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - lifebydorm-network

  seeder:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dev
    container_name: lifebydorm-seeder
    environment:
      MONGODB_URI: mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-adminpassword}@mongodb:27017/lifebydorm?authSource=admin
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - lifebydorm-network
    command: ["npm", "run", "seed"]
    profiles:
      - seed
    working_dir: /app/server

networks:
  lifebydorm-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
```

### 4.6 `docker/docker-compose.dev.yml`

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: lifebydorm-mongodb-dev
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: adminpassword
      MONGO_INITDB_DATABASE: lifebydorm
    volumes:
      - mongodb_data_dev:/data/db
    ports:
      - "27017:27017"
    networks:
      - lifebydorm-network-dev

  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dev
    container_name: lifebydorm-backend-dev
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3000
      MONGODB_URI: mongodb://admin:adminpassword@mongodb:27017/lifebydorm?authSource=admin
      ACCESS_TOKEN_SECRET: dev-secret-key-not-for-production
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      ADMIN_EMAILS: ${ADMIN_EMAILS:-}
    volumes:
      - ../server:/app/server
      - /app/server/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    networks:
      - lifebydorm-network-dev
    command: ["npm", "run", "devStart"]
    working_dir: /app/server

  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.dev
    container_name: lifebydorm-frontend-dev
    restart: unless-stopped
    environment:
      VITE_API_BASE: http://localhost:3000
      VITE_GOOGLE_CLIENT_ID: ${VITE_GOOGLE_CLIENT_ID:-}
    volumes:
      - ../client/src:/app/client/src
      - ../client/public:/app/client/public
      - ../client/index.html:/app/client/index.html
      - ../client/vite.config.ts:/app/client/vite.config.ts
      - /app/client/node_modules
    ports:
      - "5173:5173"
    networks:
      - lifebydorm-network-dev
    command: ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
    working_dir: /app/client

networks:
  lifebydorm-network-dev:
    driver: bridge

volumes:
  mongodb_data_dev:
    driver: local
```

---

## 5. Root-Level Project Files

After restructuring, the **project root** should look like:

```
LifeByDorm/
├── client/                         # Frontend (React + Vite)
├── server/                         # Backend (Express + MongoDB)
├── docker/                         # Docker infrastructure
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── mongo-init.js
│   └── .dockerignore
├── docs/                           # Documentation & prompts
│   └── prompting/
│       ├── FRONTEND_ARCHITECTURE.md
│       └── BACKEND_ARCHITECTURE.md
├── .gitignore                      # Root gitignore
├── .env.example                    # Combined env template
├── README.md                       # Project readme
└── AWS_LAMBDA_DEPLOYMENT.md        # Lambda deployment guide
```

### Root `.gitignore`

```gitignore
# Dependencies
node_modules/
client/node_modules/
server/node_modules/

# Build outputs
dist/
client/dist/
server/dist/

# Environment files
.env
.env.local
.env.development
.env.production
client/.env
client/.env.local
server/.env
server/.env.local
server/.env.production

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel/

# Serverless
.serverless/

# Logs
*.log
```

---

## 6. Vercel Deployment (Root-Level)

The root `vercel.json` for the frontend+backend monorepo:

```json
{
  "version": 2,
  "buildCommand": "cd client && npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/((?!assets/|api/).*)", "destination": "/index.html" }
  ]
}
```

The root `api/index.ts` (Vercel serverless function) needs path update:
```ts
import app from '../server/src/server.js';
export default app;
```

---

## 7. Environment Variables Reference

### Backend `.env` Variables
| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `ADMIN_EMAILS` | ❌ | Comma-separated admin emails |
| `FRONTEND_URL` | ❌ | CORS allowed origin |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `EMAIL_USER` | ❌ | Gmail address for sending codes |
| `EMAIL_PASS` | ❌ | Gmail app password |
| `AWS_BUCKET_NAME` | ❌ | S3 bucket for image uploads |
| `AWS_REGION` | ❌ | AWS region (default: us-east-1) |
| `AWS_ACCESS_KEY_ID` | ❌ | S3 IAM key |
| `AWS_SECRET_ACCESS_KEY` | ❌ | S3 IAM secret |
| `NODE_ENV` | ❌ | `production` / `development` |
| `PORT` | ❌ | Server port (default: 3000) |

### Frontend `.env` Variables
| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID (frontend) |
| `VITE_GOOGLE_MAPS_API_KEY` | ❌ | Google Maps API key |
| `VITE_API_BASE` | ❌ | API base URL (production only) |

---

## 8. Verification Checklist

### Backend
- [ ] `cd server && npm install` succeeds
- [ ] `npm run build` compiles TS to `dist/` without errors
- [ ] `npm start` launches Express on port 3000
- [ ] `npm run dev` launches with ts-node (hot reload via nodemon)
- [ ] `npm run test:run` passes all tests
- [ ] `npm run seed` seeds the database
- [ ] All API endpoints respond correctly:
  - `GET /` → Server status
  - `GET /api/stats/homepage` → Homepage stats
  - `GET /api/universities` → University list
  - `POST /register` → User registration
  - `POST /login` → User login
  - `POST /auth/send-code` → Email verification
  - `POST /auth/verify-code` → Code verification
  - `POST /auth/google` → Google OAuth

### Docker
- [ ] `docker compose -f docker/docker-compose.yml build` succeeds
- [ ] `docker compose -f docker/docker-compose.yml up` starts MongoDB + App
- [ ] `docker compose -f docker/docker-compose.dev.yml up` starts dev environment
- [ ] Health checks pass for all services
- [ ] MongoDB data persists across restarts

### Integration
- [ ] Frontend proxy routes (`/api/*` and `/auth/*`) reach the backend
- [ ] CORS allows frontend origin
- [ ] Google OAuth flow works end-to-end
- [ ] Image uploads to S3 work
- [ ] Email verification codes are sent/verified
- [ ] Admin dashboard operations work (approve/decline reviews/dorms)

---

## 9. Critical Integrity Rules

> **⚠️ These rules MUST be followed to prevent breaking the application:**

1. **Never rename the `default export`** of `server.ts` — `lambda.ts`, `api/index.ts`, and `vercel.json` all depend on it.
2. **Keep model collection names unchanged** — `'user'`, `'Dorm'`, `'University'`, `'userreview'` — as they map to MongoDB collections containing live data.
3. **Keep the seed script paths to JSON files** — `seed/universityInformation.json` and `seed/dormInformation.json` are loaded at runtime.
4. **Preserve the `server.ts.old` → DELETE** — it's truly legacy and not imported anywhere.
5. **The `dist/` directory structure must match imports** — if `rootDir` is `./src`, then `import './server'` in `lambda.ts` compiles correctly to `dist/lambda.js` importing `dist/server.js`.
6. **All env variables must exist in the correct `.env` file** — backend vars in `server/.env`, frontend vars in `client/.env`.
