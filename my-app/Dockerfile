# ==============================================================================
# Multi-stage Dockerfile for LifeByDorm Application
# Builds both frontend (Vite/React) and backend (Express/Node) for production
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base - Common Node.js setup
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
# Install dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# ------------------------------------------------------------------------------
# Stage 2: Frontend Dependencies
# ------------------------------------------------------------------------------
FROM base AS frontend-deps
WORKDIR /app
# Copy only package files first to leverage Docker cache
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ------------------------------------------------------------------------------
# Stage 3: Backend Dependencies
# ------------------------------------------------------------------------------
FROM base AS backend-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ------------------------------------------------------------------------------
# Stage 4: Build Frontend
# ------------------------------------------------------------------------------
FROM frontend-deps AS frontend-builder
WORKDIR /app

# Copy source files
COPY . .

# Build arguments for frontend environment variables
ARG VITE_API_BASE=/api
ARG VITE_GOOGLE_CLIENT_ID

# Set environment variables for build
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# Build the frontend
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 5: Build Backend
# ------------------------------------------------------------------------------
FROM backend-deps AS backend-builder
WORKDIR /app/server

# Copy server source files
COPY server/ .

# Build TypeScript
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 6: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend production dependencies and built files
COPY --from=backend-deps /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/package.json ./server/

# Copy seed data for database initialization
COPY server/seed ./server/seed
COPY server/models ./server/models

# Copy frontend build output
COPY --from=frontend-builder /app/dist ./dist

# Copy a production server that serves both API and static files
# We'll modify the server to serve static files in production

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server
WORKDIR /app/server
CMD ["node", "dist/server.js"]
