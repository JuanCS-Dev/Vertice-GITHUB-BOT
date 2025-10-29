# Setup Guide - Vértice GitHub Bot

> **Honoring JESUS through excellence in every line of code! 🙏**

Complete installation and setup guide for the Vértice GitHub Bot.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Docker Setup](#docker-setup)
- [Development Environment](#development-environment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher
- **pnpm**: v10.20.0 or higher
- **Docker & Docker Compose**: Latest version (optional, for containerized setup)
- **PostgreSQL**: 16.x (if not using Docker)
- **Redis**: 7.x (if not using Docker)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vertice-github-bot.git
cd vertice-github-bot
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Generate Prisma Client

```bash
pnpm prisma generate
```

## Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` and set the following required variables:

```env
# Database
DATABASE_URL="postgresql://vertice:password@localhost:5432/vertice_github_bot"

# GitHub
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
GEMINI_API_KEY="your-gemini-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## Database Setup

### Option 1: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up postgres redis -d

# Run migrations
pnpm prisma db push

# Seed database (optional)
pnpm prisma db seed
```

### Option 2: Local PostgreSQL

```bash
# Create database
createdb vertice_github_bot

# Run migrations
pnpm prisma db push

# Seed database (optional)
pnpm prisma db seed
```

## Running the Application

### Development Mode (Hot Reload)

```bash
pnpm start:dev
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
# Build
pnpm build

# Start
pnpm start:prod
```

### Watch Mode

```bash
pnpm start:debug
```

## Docker Setup

### Production Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development with Docker

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Includes:
# - PostgreSQL with pgAdmin (http://localhost:5050)
# - Redis with Redis Commander (http://localhost:8081)
# - Hot reload enabled
```

## Development Environment

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Code Quality

```bash
# Linting
pnpm lint

# Format check
pnpm format:check

# Format fix
pnpm format
```

### Constitutional Validation

```bash
# Check LEI (Lazy Execution Index)
pnpm lei:check

# Check CRS (Constitutional Rule Satisfaction)
pnpm crs:check
```

### Database Operations

```bash
# Prisma Studio (DB GUI)
pnpm prisma studio

# Create migration
pnpm prisma migrate dev --name migration-name

# Reset database
pnpm prisma migrate reset
```

## Available Endpoints

After starting the application, the following endpoints are available:

- **Health Check**: `GET /health`
- **Liveness Probe**: `GET /health/live`
- **Readiness Probe**: `GET /health/ready`
- **Metrics (Prometheus)**: `GET /metrics`
- **Metrics Summary (JSON)**: `GET /metrics/summary`

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check DATABASE_URL in .env matches your setup

3. Test connection:
   ```bash
   pnpm prisma db pull
   ```

### Prisma Client Not Generated

```bash
# Regenerate Prisma Client
pnpm prisma generate
```

### Docker Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Check [Constituição Vértice](./CONSTITUICAO.md) for development principles

---

**🙏 Glory to JESUS for His guidance in this project!**
