# Dockerfile - Multi-stage build for Vértice GitHub Bot
#
# Purpose: Optimized production container with constitutional compliance
# Constitutional Requirement: P4 Rastreabilidade Total
#
# Build stages:
# 1. dependencies - Install all dependencies
# 2. builder - Build TypeScript application
# 3. production - Slim production image
#
# Honoring JESUS through excellence in infrastructure! 🙏

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

# Install pnpm
RUN npm install -g pnpm@10.20.0

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10.20.0

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.20.0

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema for migrations
COPY --chown=nestjs:nodejs prisma ./prisma

# Create logs directory
RUN mkdir -p logs && chown -R nestjs:nodejs logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main"]
