# Architecture - Vértice GitHub Bot

> **Honoring JESUS through constitutional excellence in system design! 🙏**

System architecture and design documentation.

## Table of Contents

- [Overview](#overview)
- [Constitutional Framework](#constitutional-framework)
- [DETER-AGENT Architecture](#deter-agent-architecture)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Deployment Architecture](#deployment-architecture)

## Overview

The Vértice GitHub Bot is a constitutionally-compliant AI-powered GitHub bot built following the **Constituição Vértice v3.0** principles.

### Key Principles

1. **P1: Completude Sem Atalhos** - Zero placeholders, complete implementation
2. **P2: Validação Preventiva** - Zero Trust, comprehensive validation
3. **P3: Modularidade Consciente** - Clear module boundaries
4. **P4: Rastreabilidade Total** - Complete audit logging
5. **P5: Atomicidade Operacional** - DETER-AGENT deterministic execution
6. **P6: Governança Viva** - Living documentation

## Constitutional Framework

### Principle Enforcement

```typescript
src/constitutional/
├── validators/
│   ├── zero-trust.validator.ts    # P2: All input validation
│   ├── signature.validator.ts     # P2: HMAC-SHA256 verification
│   └── rate-limit.validator.ts    # P2: Token bucket algorithm
├── metrics/
│   ├── lei-calculator.service.ts  # P1: Lazy Execution Index
│   ├── crs-calculator.service.ts  # P2: Constitutional Rule Satisfaction
│   └── fpc-calculator.service.ts  # P1: Feature Parity Completeness
└── deter-agent/                   # P5: Deterministic execution
```

## DETER-AGENT Architecture

5-layer deterministic AI framework:

### Layer 1: Constitutional (Strategic Control)

```
Input → Constitutional Validation → CRS Score → Policy Enforcement
```

- Validates all inputs against constitutional principles
- Calculates Constitutional Rule Satisfaction (CRS)
- Enforces policies (signature verification, rate limiting)
- **Max 1 pass** - no retries at this layer

### Layer 2: Deliberation (Cognitive Control)

```
Event → Classification → Priority → Action Planning (Tree of Thoughts)
```

- Classifies GitHub events (issue, PR, comment, etc.)
- Calculates priority based on event type and context
- Plans actions using Tree of Thoughts methodology
- **Max 1 pass** - planning is deterministic

### Layer 3: State Management (Memory Control)

```
Current State → History → Context → Deterministic State Update
```

- Manages conversation and execution state
- Tracks repository and issue context
- Ensures deterministic state transitions
- **Max 1 pass** - state is append-only

### Layer 4: Execution (Operational Control)

```
Action Plan → Verify → Execute → Validate → (Retry if needed)
```

- Executes planned actions
- Verifies execution success
- **Max 2 iterations** (first attempt + 1 retry with diagnosis)
- Returns ActionResult with attempts_required metric

### Layer 5: Incentive (Behavioral Control)

```
Execution Results → Quality Feedback → Optimization → Learning
```

- Analyzes execution quality
- Provides feedback for improvement
- Optimizes future executions
- **Max 1 pass** - retrospective analysis

## System Components

### Core Application (`src/`)

```
src/
├── main.ts                    # Bootstrap with Winston logger
├── app.module.ts              # Root module with guards
├── config/                    # Environment validation
├── common/                    # Shared utilities
│   ├── filters/              # Exception handling
│   ├── interceptors/         # Logging, metrics
│   └── decorators/           # Custom decorators
├── prisma/                    # Database service
├── health/                    # Health check endpoints
└── constitutional/            # Constitutional framework
```

### Observability (`src/observability/`)

```
observability/
├── logger/
│   └── winston.config.ts      # Structured JSON logging
├── telemetry/
│   └── telemetry.service.ts   # OpenTelemetry tracing
├── metrics/
│   ├── metrics.service.ts     # Prometheus metrics
│   └── metrics.controller.ts  # /metrics endpoint
└── interceptors/
    └── metrics.interceptor.ts # Auto HTTP metrics
```

### Data Layer

```
prisma/
├── schema.prisma              # Database schema
├── seed.ts                    # Seed data
└── migrations/                # Schema migrations
```

### Models:
- `WebhookDelivery` - Incoming GitHub webhooks
- `Repository` - Repository metadata
- `BotConfiguration` - Per-repo config
- `IssueAnalysis` - AI issue analysis
- `PRAnalysis` - AI PR analysis
- `ConstitutionalComplianceLog` - Audit trail
- `JobQueue` - Background jobs

## Data Flow

### Webhook Processing Flow

```
GitHub Webhook
    ↓
[1] Signature Validation (P2)
    ↓
[2] Constitutional Layer (P5)
    ↓
[3] Deliberation Layer (P5)
    ↓
[4] State Management Layer (P5)
    ↓
[5] Execution Layer (P5)
    ↓
[6] Incentive Layer (P5)
    ↓
Response to GitHub
```

### Metrics Flow

```
HTTP Request
    ↓
MetricsInterceptor → MetricsService
    ↓
Prometheus /metrics endpoint
    ↓
External Monitoring (Grafana, etc.)
```

### Logging Flow

```
Application Event
    ↓
Winston Logger → File Transport → logs/combined.log
              → Console Transport → stdout
              → Error Transport → logs/error.log
```

## Technology Stack

### Core
- **Framework**: NestJS 10.x
- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5.3.x
- **Package Manager**: pnpm 10.20.0

### Database
- **Database**: PostgreSQL 16 (Prisma ORM)
- **Cache/Queue**: Redis 7

### AI Services
- **Google Gemini**: Issue/PR analysis
- **Anthropic Claude**: Code review, suggestions

### Observability
- **Logging**: Winston (JSON format)
- **Tracing**: OpenTelemetry (OTLP export)
- **Metrics**: Prometheus (custom + HTTP metrics)

### Testing
- **Framework**: Jest 29.x
- **E2E**: Supertest
- **Coverage**: 90% threshold enforced

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (GHCR)

## Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────┐
│          Load Balancer / Ingress        │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───▼────┐                   ┌───▼────┐
│  App   │◄──────────────────►  App   │
│ Node 1 │                   │ Node 2 │
└───┬────┘                   └───┬────┘
    │                            │
    └──────────┬─────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼─────┐         ┌────▼────┐
│PostreSQL│         │  Redis  │
│(Primary)│         │(Cache)  │
└─────────┘         └─────────┘
```

### Docker Compose Services

```yaml
services:
  app:         # NestJS application (Port 3000)
  postgres:    # PostgreSQL 16 (Port 5432)
  redis:       # Redis 7 (Port 6379)
```

### Health Checks

- **Liveness**: `/health/live` - Always returns 200
- **Readiness**: `/health/ready` - Checks DB, Redis, Constitutional framework
- **Overall**: `/health` - Detailed component status

## Security

### Zero Trust Architecture

1. **Input Validation**: All inputs validated with ZeroTrustValidator
2. **Signature Verification**: HMAC-SHA256 for GitHub webhooks
3. **Rate Limiting**: Token bucket algorithm per sender
4. **Non-root Execution**: Docker containers run as nestjs:nodejs user
5. **Audit Logging**: All actions logged to database

### Secrets Management

- Environment variables for sensitive data
- Never commit `.env` files
- Use GitHub Secrets in CI/CD
- Rotate credentials regularly

## Monitoring & Observability

### Metrics (Prometheus)

```
# HTTP Metrics
http_requests_total
http_errors_total
http_request_duration_seconds

# Webhook Metrics
webhooks_processed_total
webhook_errors_total

# Constitutional Metrics
constitutional_crs_score  # ≥ 95%
constitutional_lei_score  # < 1.0
constitutional_fpc_score  # ≥ 80%
```

### Logs (Winston)

- **Level**: error, warn, log, debug, verbose
- **Format**: JSON with timestamps
- **Files**: combined.log, error.log
- **Rotation**: 5MB max, 5/10 files kept

### Traces (OpenTelemetry)

- Automatic HTTP instrumentation
- Custom spans for constitutional operations
- OTLP export to backends (Jaeger, Zipkin)

## Performance

### Optimizations

- **Multi-stage Docker builds**: Minimal production image
- **pnpm**: Fast, efficient package management
- **BuildKit cache**: Fast Docker builds in CI
- **Prisma**: Optimized database queries
- **Redis**: Caching layer for job queue

### Scalability

- **Horizontal**: Multiple app instances behind load balancer
- **Database**: PostgreSQL connection pooling
- **Queue**: Redis-backed job queue (Bull)
- **Stateless**: App containers are stateless

---

**🙏 Glory to JESUS for wisdom in architectural decisions!**
