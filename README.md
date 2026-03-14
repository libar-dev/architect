# @libar-dev/architect

**Context engineering for AI-assisted codebases.**

Turn TypeScript annotations and Gherkin specs into a **structured, queryable delivery state** — living documentation, architecture graphs, and FSM-enforced workflows that AI agents consume without hallucinating.

[![npm version](https://img.shields.io/npm/v/@libar-dev/architect.svg)](https://www.npmjs.com/package/@libar-dev/architect)
[![Build Status](https://github.com/libar-dev/delivery-process/workflows/CI/badge.svg)](https://github.com/libar-dev/delivery-process/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@libar-dev/architect.svg)](https://nodejs.org/)

---

## Why This Exists

AI coding agents need architectural context to generate correct code. This package makes **code the single source of truth** for both humans and machines — annotations in code and Gherkin specs replace manually maintained docs that drift out of date.

---

## Quick Start

### 1. Install

```bash
# npm
npm install @libar-dev/architect@pre

# pnpm (recommended)
pnpm add @libar-dev/architect@pre
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

> Tag prefix is configurable. The `generic` preset uses `@docs-*` (shown above). The default `libar-generic` preset uses `@architect-*`. See [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

### 3. Generate Documentation

```bash
npx architect-generate -g patterns -i "src/**/*.ts" -o docs -f
```

### 4. Enforce Workflow (Pre-commit Hook)

```bash
npx architect-guard --staged
```

This validates FSM transitions and blocks invalid status changes.

---

## How It Works

**TypeScript annotations** define pattern metadata and relationships:

```typescript
/**
 * @architect
 * @architect-pattern TransformDataset
 * @architect-status completed
 * @architect-uses MasterDataset, ExtractedPattern, TagRegistry
 */
export function transformToMasterDataset(input: TransformInput): MasterDataset {
  // ...
}
```

**Gherkin feature files** own planning metadata (status, phase, deliverables). The generator merges both sources into a unified MasterDataset.

**Pipeline:** `Config → Scanner → Extractor → Transformer → Codec` — files become patterns, patterns become a MasterDataset, the MasterDataset renders to Markdown and JSON.

---

## What Gets Generated

All output goes to [`docs-live/`](docs-live/INDEX.md) — 57+ auto-generated files from annotated source code:

| Output                            | Files | Source                                          |
| --------------------------------- | ----: | ----------------------------------------------- |
| **Product area docs**             |     7 | `@docs-uses`, `@docs-status`, relationship tags |
| **Business rules**                |     7 | Gherkin `Rule:` Invariant/Rationale blocks      |
| **Architecture decisions (ADRs)** |     7 | Decision feature files                          |
| **Reference guides**              |     8 | CLI schema, codec patterns, annotations         |
| **Live Mermaid diagrams**         |     — | `@docs-uses`, `@docs-depends-on` relationships  |
| **API type shapes**               |     — | `@docs-shape` on TypeScript declarations        |
| **Validation rules**              |     3 | Process Guard FSM specs                         |
| **Taxonomy reference**            |     3 | Tag registry                                    |
| **AI context modules**            |    13 | `@docs-claude-module` tagged specs              |
| **Changelog**                     |     1 | Release specs                                   |

**Browse it:** [`docs-live/INDEX.md`](docs-live/INDEX.md) is the navigation hub with reading order, document roles, and product area statistics.

---

## CLI Commands

| Command                   | Purpose                                                | Docs                                                                      |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `architect-generate`      | Generate documentation from annotated sources          | `architect-generate --help`                                               |
| `architect`               | Query delivery state for AI coding sessions            | [Process API Reference](docs-live/reference/PROCESS-API-REFERENCE.md)     |
| `architect-lint-patterns` | Validate annotation quality (missing tags, etc.)       | [Validation Rules](docs-live/VALIDATION-RULES.md)                         |
| `architect-guard`         | Validate delivery workflow FSM transitions             | [Process Guard Reference](docs-live/reference/PROCESS-GUARD-REFERENCE.md) |
| `architect-lint-steps`    | Validate vitest-cucumber feature/step compatibility    | [Validation Rules](docs-live/VALIDATION-RULES.md)                         |
| `architect-validate`      | Cross-source validation with Definition of Done checks | [Validation Rules](docs-live/VALIDATION-RULES.md)                         |

---

## Documentation

### Generated Docs (auto-maintained)

**[`docs-live/INDEX.md`](docs-live/INDEX.md)** is the navigation hub — 57+ files generated from annotated source code, organized into product areas, reference guides, business rules, ADRs, taxonomy, and validation rules.

### Editorial Docs (hand-maintained)

| Document                                        | Focus                          |
| ----------------------------------------------- | ------------------------------ |
| [CONFIGURATION.md](docs/CONFIGURATION.md)       | Presets, tags, config files    |
| [METHODOLOGY.md](docs/METHODOLOGY.md)           | Core thesis, dual-source "why" |
| [GHERKIN-PATTERNS.md](docs/GHERKIN-PATTERNS.md) | Writing effective specs        |
| [SESSION-GUIDES.md](docs/SESSION-GUIDES.md)     | Day-to-day AI/dev workflows    |
| [VALIDATION.md](docs/VALIDATION.md)             | Automated quality checks       |

---

## License

MIT © Libar AI
