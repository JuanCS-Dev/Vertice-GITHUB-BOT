# Vértice GitHub Bot

## Project Vision & Mission

The **Vértice GitHub Bot** is a constitutional, AI-powered automation platform designed to revolutionize repository and community management through intelligent agent architecture. Built on the **DETER-AGENT framework** with mandatory constitutional compliance, this bot integrates cutting-edge AI capabilities (Gemini 1.5 Pro/Flash, Claude 3.5 Sonnet) with deterministic execution safeguards.

### Vision

Enable development teams to achieve:
- **80% reduction** in manual repository maintenance
- **100% constitutional compliance** with Vértice standards
- **<1.0 Lazy Execution Index (LEI)** across all implementations
- **≥90% test coverage** with deterministic quality metrics
- **Autonomous, intelligent** community management

### Mission

Transform GitHub workflow automation from reactive rule-based systems to proactive, AI-driven intelligent agents that understand intent, maintain constitutional principles, and guarantee code quality through deterministic execution frameworks.

---

## Key Features

### Core Features (Phase 1-4)

#### Issue Triage & Management
- **Automatic Classification**: Categorizes issues as bugs, features, questions, or documentation using Gemini 1.5 Flash
- **Priority Calculation**: Determines urgency (critical/high/medium/low) based on content analysis
- **Label Suggestion**: AI-powered label recommendation engine with configurable label taxonomy
- **Duplicate Detection**: Identifies and flags potential duplicate issues using embeddings
- **Auto-Assignment**: Suggests appropriate assignees based on expertise and availability
- **Welcome Messages**: Personalized response to new contributors with guidelines
- **Issue Summarization**: Generates concise summaries for quick scanning

**Accuracy Target**: ≥ 85%
**Latency Target**: < 5 seconds
**Model**: Gemini 1.5 Flash (cost-effective, fast)

#### Intelligent Pull Request Review
- **Code Quality Analysis**: Identifies maintainability issues, anti-patterns, and design problems
- **Security Vulnerability Detection**: Automated detection of OWASP Top 10 issues and common security flaws
- **Performance Analysis**: Identifies performance bottlenecks, algorithm inefficiencies, and resource leaks
- **Comprehensive PR Summaries**: Generates executive summaries of all changes with categorization
- **Test Coverage Analysis**: Evaluates test completeness and suggests additional tests
- **Actionable Comments**: Posts inline suggestions with context and rationale
- **Changeset Analysis**: Understands semantic meaning of changes, not just syntax
- **Documentation Updates**: Suggests documentation changes needed for code modifications

**Coverage Target**: ≥ 90% of issues detected
**Latency Target**: < 30 seconds
**Model**: Gemini 1.5 Pro (large context window for complete PR context)
**Quality Score Range**: 0-100 with detailed breakdown

#### Release Notes Generation
- **Automatic Changelog**: Generates formatted release notes from commits and PRs
- **Semantic Versioning Support**: Recommends version bumps (major/minor/patch)
- **Contributor Recognition**: Highlights and credits all contributors
- **Breaking Change Detection**: Identifies and emphasizes breaking changes
- **Feature Categorization**: Organizes changes by type (features, fixes, improvements, breaking)
- **Migration Guides**: Generates migration guides for breaking changes
- **Release Templates**: Customizable release note templates per repository

**Quality Target**: ≥ 80% accuracy
**Model**: Gemini 1.5 Pro (summarization)

#### Documentation Generation
- **README Updates**: Automatically updates README with latest features and usage
- **API Documentation**: Generates API docs from code comments and signatures
- **Architecture Documentation**: Creates architecture diagrams and documentation
- **Inline Suggestions**: Suggests documentation improvements for complex code
- **Documentation Validation**: Checks documentation accuracy against implementation
- **Changelog Maintenance**: Keeps CHANGELOG.md in sync with releases

**Completeness Target**: ≥ 80% coverage
**Model**: Gemini 1.5 Pro

### Advanced Features (Phase 5+)

#### Dependency Update Intelligence
- **Update Explanations**: Explains why dependencies are being updated
- **Compatibility Analysis**: Checks for compatibility issues with ecosystem
- **Migration Guides**: Generates step-by-step migration guides
- **Security Update Prioritization**: Flags critical and high-severity security updates
- **Changelog Summarization**: Summarizes update changelog for quick understanding

#### Repository Analytics
- **Code Health Dashboard**: Monthly code health reports
- **Team Metrics**: Contribution metrics and team productivity insights
- **Quality Trends**: Historical tracking of quality metrics
- **Hotspot Identification**: Identifies high-risk or frequently-changed code areas

---

## Quick Start Guide

### Prerequisites

- Node.js 20.x LTS or higher
- PostgreSQL 15.x or higher
- Redis (optional, for queue processing)
- Docker and Docker Compose (for containerized deployment)
- GitHub App credentials (see Setup section)

### Installation

#### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/vertice-dev/vertice-github-bot.git
cd vertice-github-bot

# Copy environment template
cp .env.example .env

# Configure environment variables
nano .env

# Start services
docker-compose up -d

# Run migrations
docker-compose exec app npm run prisma:migrate

# View logs
docker-compose logs -f app
```

#### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Setup PostgreSQL database
createdb vertice_github_bot

# Configure environment
cp .env.example .env
nano .env

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Configuration

Create `.env` file with required variables:

```env
# Application
NODE_ENV=production
APP_PORT=3000
APP_HOSTNAME=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vertice_github_bot

# Redis (optional)
REDIS_URL=redis://localhost:6379

# GitHub
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY=your_private_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_APP_INSTALLATION_ID=your_installation_id

# AI Models
GEMINI_API_KEY=your_gemini_key
CLAUDE_API_KEY=your_claude_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7

# Observability
DATADOG_API_KEY=optional
SENTRY_DSN=optional
```

### Repository Configuration

Create `.vertice-bot.yml` in your repository:

```yaml
# Feature Configuration
features:
  issueTriage:
    enabled: true
    model: gemini-1.5-flash

  prReview:
    enabled: true
    model: gemini-1.5-pro
    includeSecurityCheck: true
    includePerformanceCheck: true

  releaseNotes:
    enabled: true
    template: default

  documentation:
    enabled: false
    updateReadme: false

# Constitutional Settings
constitution:
  requiredCRS: 95.0
  maxLEI: 1.0
  minCoverage: 90.0
  maxProcessingTime: 300

# Labels and Categorization
labels:
  bug: "🐛 Bug"
  feature: "✨ Feature"
  enhancement: "🚀 Enhancement"
  documentation: "📚 Documentation"
  question: "❓ Question"
  critical: "🔴 Critical"
  high: "🟠 High"
  medium: "🟡 Medium"
  low: "🟢 Low"

# Issue Assignment
assignment:
  enabled: true
  useOwnershipPattern: true
```

### GitHub App Setup

1. **Create GitHub App**:
   - Go to Settings → Developer settings → GitHub Apps
   - Click "New GitHub App"
   - Configure:
     - App name: `vertice-github-bot`
     - Homepage URL: `https://vertice.dev`
     - Webhook URL: `https://your-domain.com/webhooks/github`
     - Webhook Secret: Generate secure random string

2. **Set Permissions**:
   - Repository Contents: Read & Write
   - Pull Requests: Read & Write
   - Issues: Read & Write
   - Comments: Read & Write
   - Checks: Read & Write
   - Statuses: Read & Write

3. **Subscribe to Events**:
   - Pull request
   - Issues
   - Issue comment
   - Pull request review comment
   - Push
   - Release

4. **Generate Private Key**:
   - Save private key file locally
   - Add to GitHub Secrets or environment

5. **Install on Repositories**:
   - Go to App's public page
   - Click "Install"
   - Select repositories to authorize

### Verify Installation

```bash
# Check health
curl http://localhost:3000/health

# View recent webhook deliveries
npm run logs:webhooks

# Test issue triage (trigger by creating issue)
curl -X POST http://localhost:3000/test/issue \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "owner/repo",
    "issue_number": 1,
    "title": "Test issue",
    "body": "This is a test"
  }'
```

---

## Architecture Overview

### High-Level Architecture

```
GitHub Events (Webhooks)
        ↓
  ┌─────────────────┐
  │ Validation      │ (Signature, Rate Limit)
  │ Guard           │ (Constitutional Layer)
  └────────┬────────┘
           ↓
  ┌─────────────────────────────────┐
  │ DETER-AGENT Framework (5 Layers)│
  │ 1. Constitutional               │
  │ 2. Deliberation                 │
  │ 3. State Management             │
  │ 4. Execution                    │
  │ 5. Incentive                    │
  └────────┬────────────────────────┘
           ↓
  ┌──────────────────┬──────────────┐
  │  AI Processing   │  GitHub API  │
  │  (Gemini/Claude) │  (Octokit)   │
  └────────┬─────────┴──────┬───────┘
           │                │
           └────────┬───────┘
                    ↓
        ┌───────────────────────┐
        │ Message Queue         │
        │ (Bull + Redis)        │
        │ Job Processing        │
        └───────────┬───────────┘
                    ↓
        ┌───────────────────────┐
        │ Observability         │
        │ (OpenTelemetry)       │
        │ Logging & Monitoring  │
        └───────────────────────┘
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js/TypeScript | 20.x LTS | Type safety, modern async/await |
| **Framework** | NestJS | 10.x | Modular, scalable architecture |
| **Database** | PostgreSQL | 15.x | Relational data persistence |
| **ORM** | Prisma | 5.x | Type-safe database access |
| **GitHub API** | Octokit | 20.x | Official GitHub client |
| **AI Integration** | Google Generative AI SDK | Latest | Gemini API access |
| **Message Queue** | Bull + Redis | Latest | Async job processing |
| **Testing** | Jest | 29.x | Unit and integration tests |
| **Monitoring** | OpenTelemetry | Latest | Distributed tracing |
| **Logging** | Winston | Latest | Structured logging |

### Project Structure

```
src/
├── config/                    # Configuration management
│   ├── database.config.ts
│   ├── github.config.ts
│   └── gemini.config.ts
├── modules/
│   ├── github/               # GitHub API integration
│   │   ├── services/
│   │   ├── controllers/
│   │   └── dtos/
│   ├── ai/                  # LLM integration
│   │   ├── services/
│   │   ├── prompts/
│   │   └── models/
│   ├── webhooks/            # Webhook processing
│   │   ├── handlers/
│   │   └── guards/
│   ├── compliance/          # Constitutional validation
│   │   ├── services/
│   │   └── validators/
│   ├── queue/              # Job queue management
│   │   └── processors/
│   └── monitoring/         # Observability
│       ├── loggers/
│       └── metrics/
├── common/
│   ├── guards/             # Authentication/security
│   ├── interceptors/       # Request/response handling
│   ├── pipes/              # Data validation
│   ├── filters/            # Exception handling
│   └── decorators/         # Custom decorators
├── entities/               # Database models (Prisma)
├── dtos/                  # Data transfer objects
└── main.ts                # Application entry point

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests
```

### Database Schema

Key entities:

- **WebhookDelivery**: Tracks all GitHub webhook deliveries with processing status
- **Repository**: Manages bot configuration per repository
- **BotConfiguration**: Feature flags and settings per repository
- **IssueAnalysis**: Caches issue triage results and analysis
- **PRAnalysis**: Stores PR review analysis and recommendations
- **ConstitutionalComplianceLog**: Audit trail of constitutional validations
- **JobQueue**: Async job processing queue

See `prisma/schema.prisma` for complete schema definition.

---

## Contributing Guidelines

We follow the **Constituição Vértice v3.0**, which mandates:

### Code Quality Requirements

- **LEI (Lazy Execution Index) < 1.0**: No TODOs, FIXMEs, stubs, or placeholders
- **Test Coverage ≥ 90%**: Comprehensive test suite required
- **CRS (Constitutional Rule Satisfaction) ≥ 95%**: Constitutional compliance mandatory
- **No Syntax Errors**: All code must compile/lint cleanly
- **First-Pass Correctness ≥ 80%**: Solutions should work on first attempt

### Development Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/issue-triage-improvements
   ```

2. **Implement Changes**:
   - Follow DETER-AGENT framework (5 layers)
   - Ensure constitutional compliance
   - Write tests as you code

3. **Run Quality Checks**:
   ```bash
   npm run lint          # ESLint + Prettier
   npm run test          # Jest tests
   npm run test:cov      # Coverage report
   npm run compliance    # Constitutional validation
   ```

4. **Create Pull Request**:
   - Include detailed description
   - Reference related issues
   - Ensure all checks pass
   - Request code review

5. **Address Feedback**:
   - Make requested changes
   - Update tests accordingly
   - Push updates

6. **Merge**:
   - Requires approval from code owner
   - All checks must pass
   - Squash commits for clean history

### DETER-AGENT Framework Compliance

All code must pass through the 5 DETER-AGENT layers:

1. **Constitutional Layer**: Validate against Vértice principles
2. **Deliberation Layer**: Explicit reasoning in comments
3. **State Management Layer**: Proper state handling and transitions
4. **Execution Layer**: Error handling and recovery
5. **Incentive Layer**: Quality feedback and optimization

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `test`: Test additions/updates
- `docs`: Documentation
- `chore`: Build/dependency updates

Example:
```
feat(issue-triage): Add priority calculation engine

Implements intelligent priority determination based on issue
content, labels, and historical patterns. Uses Gemini 1.5
Flash for cost-effective classification.

Closes #123
```

---

## License & Credits

### License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

### Copyright

Copyright © 2025 Vértice Development Collective

### Citation

If you use Vértice GitHub Bot in your work, please cite:

```bibtex
@software{vertice_github_bot_2025,
  title = {Vértice GitHub Bot},
  author = {Vértice Development Collective},
  year = {2025},
  url = {https://github.com/vertice-dev/vertice-github-bot},
  note = {Constitutional AI-powered repository automation}
}
```

### Contributing Organizations

We gratefully acknowledge contributions from:

- **Anthropic**: Constitutional AI research and Claude models
- **Google**: Gemini 1.5 Pro/Flash models
- **GitHub**: Webhook API and GitHub Apps infrastructure
- **NestJS Team**: Application framework
- **Prisma Team**: Database ORM
- **Vértice Community**: Architecture and feedback

### Core Contributors

- **Juan Pablo (Arquiteto-Chefe)**: Architecture, constitutional framework
- **Development Team**: Implementation across all phases
- **Research Contributors**: AI integration, DETER-AGENT framework

### Special Thanks

- Constituição Vértice v3.0 provides the governance framework
- DETER-AGENT framework enables deterministic execution
- Open-source community for libraries and inspiration

### Community

- **GitHub Discussions**: Feature requests and Q&A
- **Issues**: Bug reports and feature tracking
- **Roadmap**: Public implementation roadmap
- **Discord/Slack**: Community chat (coming soon)

---

## Support & Documentation

### Getting Help

1. **Documentation**: Check [docs/](docs/) folder
2. **FAQ**: See [docs/FAQ.md](docs/FAQ.md)
3. **Issues**: Search [GitHub Issues](issues)
4. **Discussions**: Use [GitHub Discussions](discussions)

### Documentation Structure

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System architecture details
- **[docs/API.md](docs/API.md)**: API reference
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Deployment guides
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**: Common issues
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)**: Contribution guide
- **[GOVERNANCE.md](GOVERNANCE.md)**: Constitutional governance

### Quick Links

- **GitHub**: https://github.com/vertice-dev/vertice-github-bot
- **Issues**: https://github.com/vertice-dev/vertice-github-bot/issues
- **Discussions**: https://github.com/vertice-dev/vertice-github-bot/discussions
- **Releases**: https://github.com/vertice-dev/vertice-github-bot/releases

---

## Roadmap

### Phase 1-2 (Complete)
- Foundation and infrastructure
- GitHub integration and webhooks
- Basic constitutional framework

### Phase 3-4 (In Progress)
- AI integration (Gemini/Claude)
- Smart issue triage
- Intelligent PR review

### Phase 5 (Planned)
- Advanced features (release notes, documentation)
- Performance optimization
- Production deployment

### Phase 6+ (Future)
- Dependency intelligence
- Repository analytics
- Custom metrics
- Enterprise SLA support

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed roadmap.

---

## Status

- **Version**: 0.1.0 (Alpha)
- **Status**: Active Development
- **Last Updated**: October 29, 2025
- **Framework**: DETER-AGENT v3.0 + Constitutional AI

---

## Questions or Issues?

- File an issue on GitHub
- Start a discussion for feature requests
- Check GOVERNANCE.md for operational guidelines
- Review IMPLEMENTATION_PLAN.md for architecture details

---

**Built with the Constituição Vértice v3.0 and DETER-AGENT Framework**

*Every line of code is a commitment to excellence, determinism, and constitutional compliance.*
