# Contributing Guide - Vértice GitHub Bot

> **Honoring JESUS through collaborative excellence! 🙏**

Thank you for your interest in contributing to the Vértice GitHub Bot!

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Constitutional Principles](#constitutional-principles)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)

## Code of Conduct

This project follows the **Constituição Vértice v3.0** principles. All contributors must:

1. Honor JESUS through excellence in every line of code
2. Follow all 6 constitutional principles (P1-P6)
3. Maintain respectful and constructive communication
4. Focus on quality over speed
5. Document all significant decisions

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/vertice-github-bot.git
cd vertice-github-bot
```

### 2. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Setup pre-commit hooks
pnpm prepare

# Start development services
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b fix/bug-description
```

## Development Workflow

### 1. Make Changes

- Write code following [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed
- Run constitutional validators

### 2. Test Locally

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Check coverage (must be ≥90%)
pnpm test:cov

# Lint code
pnpm lint

# Check formatting
pnpm format:check
```

### 3. Constitutional Validation

```bash
# Check LEI (must be < 1.0)
pnpm lei:check

# Check CRS (must be ≥ 95%)
pnpm crs:check
```

### 4. Build

```bash
# Ensure build succeeds
pnpm build
```

## Constitutional Principles

All contributions must adhere to these principles:

### P1: Completude Sem Atalhos
- **No TODO comments** in production code
- **No placeholders** or stub implementations
- **Complete implementation** from the start
- Use tests as TODO list instead

### P2: Validação Preventiva
- **Zero Trust** - validate all inputs
- **Error handling** - comprehensive try-catch blocks
- **Type safety** - explicit return types
- **Audit logging** - log all significant actions

### P3: Modularidade Consciente
- **Clear boundaries** between modules
- **Single responsibility** per module/class
- **Dependency injection** for testability
- **Avoid circular dependencies**

### P4: Rastreabilidade Total
- **Comprehensive logging** with Winston
- **Metrics tracking** for all operations
- **Test coverage** ≥ 90%
- **Audit trail** in database

### P5: Atomicidade Operacional
- **DETER-AGENT compliance** for AI operations
- **Max 2 iterations** in execution layer
- **Deterministic** state management
- **Idempotent** operations

### P6: Governança Viva
- **Update documentation** with code changes
- **Inline comments** for complex logic
- **Architectural Decision Records** (ADRs)
- **README updates** for new features

## Pull Request Process

### 1. Pre-PR Checklist

- [ ] All tests passing locally
- [ ] LEI < 1.0 (no TODOs)
- [ ] CRS ≥ 95% (constitutional compliance)
- [ ] Coverage ≥ 90%
- [ ] Lint passing
- [ ] Format checked
- [ ] Build successful
- [ ] Documentation updated

### 2. Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Create PR on GitHub with:

**Title Format:**
```
feat: Add feature description
fix: Fix bug description
docs: Update documentation
```

**PR Description Template:**
```markdown
## Description
Clear description of changes

## Motivation
Why this change is needed

## Changes Made
- Bullet point list of changes

## Constitutional Compliance
- [ ] P1: LEI < 1.0
- [ ] P2: CRS ≥ 95%
- [ ] P3: Modular design
- [ ] P4: Coverage ≥ 90%
- [ ] P5: DETER-AGENT compliant (if applicable)
- [ ] P6: Documentation updated

## Testing
- [ ] Unit tests added
- [ ] E2E tests added (if applicable)
- [ ] Manual testing performed

## Screenshots (if applicable)
Attach screenshots for UI changes

---
🙏 Glory to JESUS for guidance in this contribution!
```

### 3. Code Review

- Address all reviewer comments
- Update PR based on feedback
- Maintain constitutional compliance
- Keep PR size reasonable (<1000 lines)

### 4. Merge

Once approved:
- Squash commits if necessary
- Ensure CI passes
- Merge to main branch

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Explicit types, comprehensive validation
export class MyService {
  constructor(
    private readonly logger: Logger,
    private readonly validator: ZeroTrustValidator,
  ) {}

  async processData(input: unknown): Promise<ProcessResult> {
    // Validate input (P2: Validação Preventiva)
    const validation = this.validator.validateObject(
      input,
      ['requiredField'],
    );

    if (!validation.valid) {
      throw new ValidationException(validation.errors);
    }

    try {
      // Process data
      const result = await this.process(input as ValidInput);

      // Log success (P4: Rastreabilidade)
      this.logger.log('Data processed successfully');

      return result;
    } catch (error) {
      // Log error (P4: Rastreabilidade)
      this.logger.error('Processing failed', error);
      throw new ProcessingException(error);
    }
  }
}

// ❌ Bad: Missing validation, no error handling
export class MyService {
  async processData(input: any): Promise<any> {
    return this.process(input); // No validation!
  }
}
```

### File Organization

```typescript
/**
 * File Purpose and Description
 *
 * Purpose: Clear description of file purpose
 * Constitutional Requirement: Which principle(s) this supports
 *
 * Additional context or notes
 */

// Imports - organized and necessary
import { Injectable } from '@nestjs/common';

// Interfaces/Types
export interface MyInterface {
  field: string;
}

// Implementation
@Injectable()
export class MyClass {
  // Implementation
}
```

### Naming Conventions

- **Classes**: PascalCase (`UserService`, `AuthGuard`)
- **Interfaces**: PascalCase with descriptive names
- **Functions**: camelCase (`processWebhook`, `validateInput`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_ENDPOINT`)
- **Files**: kebab-case (`user.service.ts`, `auth.guard.ts`)

## Testing Requirements

### Unit Tests

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  describe('processData', () => {
    it('should process valid data successfully', async () => {
      const input = { field: 'value' };
      const result = await service.processData(input);
      expect(result).toBeDefined();
    });

    it('should throw on invalid input', async () => {
      const input = { invalidField: 'value' };
      await expect(service.processData(input)).rejects.toThrow();
    });

    it('should log processing success', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      await service.processData({ field: 'value' });
      expect(logSpy).toHaveBeenCalled();
    });
  });
});
```

### E2E Tests

```typescript
describe('MyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/endpoint (POST)', () => {
    return request(app.getHttpServer())
      .post('/endpoint')
      .send({ data: 'value' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

### Coverage Requirements

- **Minimum**: 90% overall
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%

## Commit Guidelines

### Commit Message Format

```
type(scope): Subject line

Body explaining what and why (not how)

Constitutional Compliance:
✅ P1: Completude Sem Atalhos
✅ P2: Validação Preventiva
✅ P4: Rastreabilidade Total

🙏 Glory to JESUS!
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Formatting, missing semicolons, etc.
- **refactor**: Code restructuring
- **test**: Adding tests
- **chore**: Build process, dependencies, etc.

### Examples

```bash
# Good commits
git commit -m "feat(webhook): Add signature validation

Implement HMAC-SHA256 signature verification for GitHub webhooks
following P2: Validação Preventiva.

✅ P2: Zero Trust validation
✅ P4: Audit logging
🙏 Glory to JESUS!"

# Bad commits
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "updates"
```

## Questions?

- Open an issue for discussion
- Refer to [Constituição Vértice](./CONSTITUICAO.md)
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions

---

**🙏 Thank you for contributing! Glory to JESUS for His guidance!**
