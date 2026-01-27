# Documentation Index

> **@libar-dev/delivery-process** — A source-first delivery process where everything is code.

## Quick Navigation

| If you want to...              | Read this                                                          |
| ------------------------------ | ------------------------------------------------------------------ |
| Get started quickly            | [README.md](../README.md) → [CONFIGURATION.md](./CONFIGURATION.md) |
| Understand the "why"           | [METHODOLOGY.md](./METHODOLOGY.md)                                 |
| Learn the architecture         | [ARCHITECTURE.md](./ARCHITECTURE.md)                               |
| Run AI coding sessions         | [SESSION-GUIDES.md](./SESSION-GUIDES.md)                           |
| Write Gherkin specs            | [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md)                       |
| Enforce delivery process rules | [PROCESS-GUARD.md](./PROCESS-GUARD.md)                             |
| Validate annotation quality    | [VALIDATION.md](./VALIDATION.md)                                   |
| Look up tag definitions        | [INSTRUCTIONS.md](../INSTRUCTIONS.md)                              |
| Publish to npm                 | [PUBLISHING.md](./PUBLISHING.md)                                   |

## Reading Order for New Users

1. **[README.md](../README.md)** — Quick start, installation, basic usage
2. **[CONFIGURATION.md](./CONFIGURATION.md)** — Presets, tag prefixes, setup
3. **[METHODOLOGY.md](./METHODOLOGY.md)** — Core thesis, delivery workflow, two-tier specs
4. **[SESSION-GUIDES.md](./SESSION-GUIDES.md)** — Planning/Design/Implementation workflows
5. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Deep dive into pipeline and codecs

## Document Roles

| Document                                     | Audience    | Purpose                            |
| -------------------------------------------- | ----------- | ---------------------------------- |
| [METHODOLOGY.md](./METHODOLOGY.md)           | Everyone    | "Why" — Core thesis and principles |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | Developers  | "How" — Technical implementation   |
| [CONFIGURATION.md](./CONFIGURATION.md)       | Users       | "Setup" — Getting started          |
| [SESSION-GUIDES.md](./SESSION-GUIDES.md)     | AI/Devs     | "Workflow" — Day-to-day usage      |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | Team Leads  | "Governance" — Enforcement rules   |
| [VALIDATION.md](./VALIDATION.md)             | CI/CD       | "Quality" — Automated checks       |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Writers     | "Specs" — Writing good Gherkin     |
| [TAXONOMY.md](./TAXONOMY.md)                 | Reference   | "Lookup" — Tag definitions         |
| [PUBLISHING.md](./PUBLISHING.md)             | Maintainers | "Release" — npm publishing         |

## Key Concepts

### Dual-Source Architecture

- **Feature files** own planning metadata: status, phase, quarter, effort
- **TypeScript code** owns implementation relationships: uses, used-by

### Delivery Workflow

```
roadmap → active → completed
    ↓
 deferred
```

Pre-commit hooks (`lint-process`) enforce valid transitions.

### ProcessStateAPI

For AI coding sessions, use typed queries instead of reading generated docs:

```typescript
const api = createProcessStateAPI(dataset);
api.getCurrentWork(); // What's active
api.getRoadmapItems(); // What can be started
api.isValidTransition('roadmap', 'active');
```

See [METHODOLOGY.md](./METHODOLOGY.md#processstateapi) for full API reference.
