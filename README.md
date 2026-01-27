# @libar-dev/delivery-process

**A source-first delivery process where everything is code.**

Turn TypeScript annotations and Gherkin feature files into **living documentation**, **architecture diagrams**, **dependency graphs**, **traceability matrices**, and **enforced delivery workflows** — without ever writing Markdown by hand.

[![npm version](https://img.shields.io/npm/v/@libar-dev/delivery-process.svg)](https://www.npmjs.com/package/@libar-dev/delivery-process)
[![Build Status](https://github.com/libar-dev/delivery-process/workflows/CI/badge.svg)](https://github.com/libar-dev/delivery-process/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@libar-dev/delivery-process.svg)](https://nodejs.org/)

> **Pre-release v0.1.0-pre.0** – This is an early release. We welcome feedback and contributions!

## Why Source-First?

Traditional docs drift from code. This package makes **code the single source of truth**:

| Aspect             | Traditional Docs             | Source-First (This Package)                          |
| ------------------ | ---------------------------- | ---------------------------------------------------- |
| **Source**         | Separate Markdown/Confluence | Annotations in TypeScript + Gherkin feature files    |
| **Freshness**      | Manual updates → drift       | Always generated → always current                    |
| **Enforcement**    | Guidelines                   | FSM-enforced workflow (roadmap → active → completed) |
| **Traceability**   | Manual links                 | Rich relationships (implements, uses, depends-on)    |
| **AI Integration** | Parse Markdown               | Direct typed ProcessStateAPI queries                 |

## Accelerates AI Development

Annotations give AI agents precise context without reading docs. Use `ProcessStateAPI` for typed queries instead of parsing generated Markdown:

```typescript
const api = createProcessStateAPI(dataset);
api.getCurrentWork(); // What's active right now
api.getRoadmapItems(); // What can be started
api.getPatternDependencies('MyPattern'); // uses, used-by, depends-on, enables
api.isValidTransition('roadmap', 'active'); // FSM check
```

No more hallucinated code from outdated docs — everything is code the AI can understand.

## Rich Relationship Model

The package supports a full taxonomy of relationships:

| Relationship   | Tag(s)                               | Arrow Style | Meaning                       |
| -------------- | ------------------------------------ | ----------- | ----------------------------- |
| Realization    | `@libar-docs-implements`             | `..>`       | Code realizes a pattern spec  |
| Generalization | `@libar-docs-extends`                | `-->>`      | Pattern extends another       |
| Dependency     | `@libar-docs-uses` / `used-by`       | `-->`       | Technical coupling            |
| Sequencing     | `@libar-docs-depends-on` / `enables` | `-.->`      | Roadmap ordering              |
| Hierarchy      | `@libar-docs-parent` / `level`       | —           | Epic → Phase → Task           |
| Traceability   | `@libar-docs-executable-specs`       | `...>`      | Links tiers (roadmap ↔ specs) |

Auto-generated dependency graph:

```mermaid
graph TD
    CommandOrchestrator --> EventStore
    CommandOrchestrator --> CommandBus
    CommandOrchestrator --> Workpool
    SagaOrchestration -.-> CommandBusFoundation
    EventStoreDurability -.-> DurableFunctionAdapters
```

## Dual-Source Architecture

**Feature files** own planning metadata (status, phase, effort, depends-on):

```gherkin
@libar-docs-pattern:ReservationPattern
@libar-docs-status:roadmap
@libar-docs-phase:15
@libar-docs-depends-on:EventStoreFoundation
@libar-docs-enables:SagaEngine
Feature: Reservation Pattern
```

**TypeScript stubs** own implementation relationships:

```typescript
/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-uses EventStoreFoundation, Workpool
 * @libar-docs-used-by SagaEngine, CommandOrchestrator
 */
export function reserve(...) { ... }
```

## Quick Start

### 1. Install

```bash
npm install @libar-dev/delivery-process@pre
# or pnpm add @libar-dev/delivery-process@pre
```

**Requirements:** Node.js >= 18.0.0

### 2. Annotate Your Code

```typescript
/** @libar-docs */

/**
 * @libar-docs-pattern CommandOrchestrator
 * @libar-docs-status completed
 * @libar-docs-uses EventStore, CommandBus
 */
export class CommandOrchestrator { ... }
```

### 3. Generate Docs

```bash
npx generate-docs -g patterns,roadmap -i "src/**/*.ts" -o docs -f
```

### 4. Enforce Workflow (Pre-commit Hook)

```bash
npx lint-process --staged
```

See [docs/INDEX.md](docs/INDEX.md) for full navigation.

## Features at a Glance

- **Living docs** — always generated from source
- **FSM enforcement** — prevents invalid transitions (Process Guard)
- **AI-native** — ProcessStateAPI for agents
- **TypeScript-first** — annotations integrate with language server
- **Dual-source** — Gherkin for planning, TS for implementation
- **Rich outputs** — patterns, roadmap, changelog, traceability, ADRs
- **Quality gates** — Definition of Done validation and anti-pattern detection

## ProcessStateAPI — For AI Agents

Give your AI assistant typed queries instead of making it parse markdown:

```typescript
import {
  generators,
  api as apiModule,
  createDefaultTagRegistry,
} from '@libar-dev/delivery-process';

const tagRegistry = createDefaultTagRegistry();
const dataset = generators.transformToMasterDataset({
  patterns: extractedPatterns,
  tagRegistry,
});
const api = apiModule.createProcessStateAPI(dataset);

// Status queries
api.getCurrentWork(); // Active patterns
api.getRoadmapItems(); // Available to start
api.getCompletionPercentage(); // Overall progress

// Relationship queries
api.getPatternDependencies('Saga'); // What it uses
api.getPatternRelationships('Saga'); // All relationships
api.getRelatedPatterns('EventStore'); // Everything connected

// Workflow queries
api.isValidTransition('roadmap', 'active');
api.getProtectionInfo('completed'); // { level: 'hard', requiresUnlock: true }
```

## CLI Commands

| Command                 | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `generate-docs`         | Generate documentation from annotated sources |
| `lint-patterns`         | Validate annotation quality                   |
| `lint-process`          | Validate delivery workflow (pre-commit hooks) |
| `validate-patterns`     | Cross-source validation with DoD checks       |
| `generate-tag-taxonomy` | Generate tag reference from TypeScript source |

## Configuration

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Default: DDD-ES-CQRS preset (21 categories)
const dp = createDeliveryProcess();

// Generic preset (3 categories, simpler)
const dp = createDeliveryProcess({ preset: 'generic' });
```

| Preset                  | Tag Prefix     | Categories | Use Case                         |
| ----------------------- | -------------- | ---------- | -------------------------------- |
| `ddd-es-cqrs` (default) | `@libar-docs-` | 21         | DDD/Event Sourcing architectures |
| `generic`               | `@docs-`       | 3          | Simple projects                  |

## Documentation

- **[docs/INDEX.md](docs/INDEX.md)** — Documentation navigation hub
- **[docs/METHODOLOGY.md](docs/METHODOLOGY.md)** — Core thesis and FSM
- **[docs/PROCESS-GUARD.md](docs/PROCESS-GUARD.md)** — Workflow enforcement
- **[docs/GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md)** — Writing effective specs
- **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)** — Presets and custom tags
- **[INSTRUCTIONS.md](INSTRUCTIONS.md)** — Complete tag reference

## License

MIT © Libar AI
