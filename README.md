# @libar-dev/delivery-process

**Context engineering for AI-assisted codebases.**

Turn TypeScript annotations and Gherkin specs into a **structured, queryable delivery state** — living documentation, architecture graphs, and FSM-enforced workflows that AI agents consume without hallucinating.

[![npm version](https://img.shields.io/npm/v/@libar-dev/delivery-process.svg)](https://www.npmjs.com/package/@libar-dev/delivery-process)
[![Build Status](https://github.com/libar-dev/delivery-process/workflows/CI/badge.svg)](https://github.com/libar-dev/delivery-process/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@libar-dev/delivery-process.svg)](https://nodejs.org/)

---

## Why This Exists

AI coding agents need architectural context to generate correct code. This package makes **code the single source of truth** for both humans and machines — annotations in code and Gherkin specs replace manually maintained docs that drift out of date.

---

## Quick Start

### 1. Install

```bash
# npm
npm install @libar-dev/delivery-process@pre

# pnpm (recommended)
pnpm add @libar-dev/delivery-process@pre
```

**Requirements:** Node.js >= 18.0.0, ESM project (`"type": "module"` in package.json)

### 2. Annotate Your Code

```typescript
/** @docs */

/**
 * @docs-pattern UserAuthentication
 * @docs-status roadmap
 * @docs-uses SessionManager, TokenValidator
 *
 * ## User Authentication
 *
 * Handles user login, logout, and session management.
 */
export class UserAuthentication {
  // ...
}
```

> Tag prefix is configurable. The `generic` preset uses `@docs-*` (shown above). The default `libar-generic` preset uses `@libar-docs-*`. See [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

### 3. Generate Documentation

```bash
npx generate-docs -g patterns -i "src/**/*.ts" -o docs -f
```

### 4. Enforce Workflow (Pre-commit Hook)

```bash
npx lint-process --staged
```

This validates FSM transitions and blocks invalid status changes.

---

## How It Works

**TypeScript annotations** define pattern metadata and relationships:

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-uses MasterDataset, ExtractedPattern, TagRegistry
 */
export function transformToMasterDataset(input: TransformInput): MasterDataset {
  // ...
}
```

**Gherkin feature files** own planning metadata (status, phase, deliverables). The generator merges both sources into a unified MasterDataset.

**Pipeline:** `Config → Scanner → Extractor → Transformer → Codec` — files become patterns, patterns become a MasterDataset, the MasterDataset renders to Markdown and JSON.

---

## What Gets Generated

| Content Block                     | Source                                         |
| --------------------------------- | ---------------------------------------------- |
| **Convention tables**             | Gherkin `Rule:` Invariant/Rationale            |
| **Live Mermaid diagrams**         | `@docs-uses`, `@docs-depends-on` relationships |
| **API Types**                     | `@docs-shape` on TypeScript declarations       |
| **Behavior specifications**       | Feature descriptions + `Rule:` blocks          |
| **Architecture decision records** | Decision feature files                         |
| **Roadmap & status tracking**     | `@docs-status`, `@docs-phase` tags             |

**See it live:** [docs-live/product-areas/](docs-live/product-areas/) contains 7 generated product area documents with live Mermaid diagrams and extracted API types.

---

## CLI Commands

| Command             | Purpose                                                | Docs                                      |
| ------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `generate-docs`     | Generate documentation from annotated sources          | `generate-docs --help`                    |
| `process-api`       | Query delivery state for AI coding sessions            | [PROCESS-API.md](docs/PROCESS-API.md)     |
| `lint-patterns`     | Validate annotation quality (missing tags, etc.)       | [VALIDATION.md](docs/VALIDATION.md)       |
| `lint-process`      | Validate delivery workflow FSM transitions             | [PROCESS-GUARD.md](docs/PROCESS-GUARD.md) |
| `lint-steps`        | Validate vitest-cucumber feature/step compatibility    | [VALIDATION.md](docs/VALIDATION.md)       |
| `validate-patterns` | Cross-source validation with Definition of Done checks | [VALIDATION.md](docs/VALIDATION.md)       |

---

## Documentation

**[docs/INDEX.md](docs/INDEX.md)** provides a complete table of contents with section links, line numbers, and reading paths by role.

| Document                                        | Focus                           |
| ----------------------------------------------- | ------------------------------- |
| [CONFIGURATION.md](docs/CONFIGURATION.md)       | Presets, tags, config files     |
| [METHODOLOGY.md](docs/METHODOLOGY.md)           | Core thesis, dual-source "why"  |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)         | Pipeline, codecs, MasterDataset |
| [SESSION-GUIDES.md](docs/SESSION-GUIDES.md)     | Day-to-day AI/dev workflows     |
| [GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md) | Writing effective specs         |
| [PROCESS-GUARD.md](docs/PROCESS-GUARD.md)       | FSM enforcement rules           |
| [PROCESS-API.md](docs/PROCESS-API.md)           | Data API CLI query interface    |
| [VALIDATION.md](docs/VALIDATION.md)             | Automated quality checks        |
| [TAXONOMY.md](docs/TAXONOMY.md)                 | Tag taxonomy and API            |
| [ANNOTATION-GUIDE.md](docs/ANNOTATION-GUIDE.md) | Annotation mechanics, shapes    |

---

## License

MIT © Libar AI
