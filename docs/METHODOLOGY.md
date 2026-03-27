# Architect Methodology

> **Editorial Document:** This document contains design philosophy and rationale that cannot be auto-generated from code annotations. It is maintained manually.

> **Git is the event store. Documentation artifacts are projections. Annotated code is the single source of truth.**

This document explains the _why_ behind `@libar-dev/architect`. For _how_, see [README.md](../README.md) and [TAXONOMY.md](./TAXONOMY.md).

---

## Core Thesis

Traditional documentation fails because it exists outside the code. Developers update code, forget to update docs, and the gap widens until docs become fiction.

**The USDP (Unified Software Delivery Process) inverts this:**

| Traditional Approach           | USDP Approach                      |
| ------------------------------ | ---------------------------------- |
| Docs are written               | Docs are generated                 |
| Status is tracked manually     | Status is FSM-enforced             |
| Requirements live in Jira      | Requirements are Gherkin scenarios |
| AI agents parse stale Markdown | AI agents query typed APIs         |

### The Insight

Event sourcing teaches us: **derive state, don't store it**. Apply this to documentation:

- **Events** = Git commits (changes to annotated code)
- **Projections** = Generated docs (PATTERNS.md, ROADMAP.md)
- **Read Model** = MasterDataset (consumed by codecs, validators, and Data API CLI)

When you run `architect-generate`, you're rebuilding read models from the event stream. The source annotations are always authoritative.

---

## Dogfooding: This Package Documents Itself

Every pattern in this package uses its own annotation system. Real examples:

**Document Extractor** (pattern extraction):

```typescript
/**
 * @architect
 * @architect-pattern Document Extractor
 * @architect-status completed
 * @architect-uses Pattern Scanner, Tag Registry, Zod
 * @architect-used-by Orchestrator, Generators
 */
export function extractPatterns(
  scannedFiles: readonly ScannedFile[], baseDir: string, registry?: TagRegistry
): ExtractionResults { ... }
```

**Pattern Scanner** (file discovery):

```typescript
/**
 * @architect
 * @architect-pattern Pattern Scanner
 * @architect-status completed
 * @architect-uses glob, AST Parser
 * @architect-used-by Doc Extractor, Orchestrator
 */
export async function scanPatterns(
  config: ScannerConfig, registry?: TagRegistry
): Promise<Result<ScanResults, never>> { ... }
```

Run `pnpm docs:patterns` and these annotations become a searchable pattern registry with dependency graphs.

---

## Session Workflow

| Session               | Input               | Output                      | FSM State                          |
| --------------------- | ------------------- | --------------------------- | ---------------------------------- |
| **Planning**          | Pattern brief       | Roadmap spec (`.feature`)   | Creates `roadmap`                  |
| **Design**            | Complex requirement | Decision specs + code stubs | None                               |
| **Implementation**    | Roadmap spec        | Code + tests                | `roadmap` → `active` → `completed` |
| **Planning + Design** | Pattern brief       | Spec + stubs                | Creates `roadmap`                  |

**When to skip sessions:**

| Skip              | When                                                  |
| ----------------- | ----------------------------------------------------- |
| Design            | Single valid approach, straightforward implementation |
| Planning + Design | Ready to code, clear scope, no decisions              |
| Neither           | Multi-session work, architectural decisions           |

---

## Annotation Ownership Strategy

> **Split-Ownership Principle:** Feature files own _what_ and _when_ (planning). Code stubs own _how_ and _with what_ (implementation). Neither duplicates the other.

### Feature Files Own (Planning)

| Tag                    | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `@<prefix>-status`     | FSM state (`roadmap`, `active`, `completed`, `deferred`) |
| `@<prefix>-phase`      | Milestone sequencing                                     |
| `@<prefix>-depends-on` | Pattern-level roadmap dependencies                       |
| `@<prefix>-enables`    | What this unblocks                                       |
| `@<prefix>-release`    | Version targeting                                        |

### Code Stubs Own (Implementation)

| Tag                 | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `@<prefix>-uses`    | Technical dependencies (what this calls)             |
| `@<prefix>-used-by` | Technical consumers (what calls this)                |
| `@<prefix>-usecase` | When/how to use                                      |
| Category flags      | Domain classification (`core`, `api`, `infra`, etc.) |

### Example Split

**Feature file** (specs/my-pattern.feature):

```gherkin
@architect
@architect-pattern:EventStoreDurability
@architect-status:roadmap
@architect-phase:18
@architect-depends-on:EventStoreFoundation
@architect-enables:SagaEngine
Feature: Event Store Durability
```

**Code stub** (src/event-store/durability.ts):

```typescript
/**
 * @architect
 * @architect-status roadmap
 * @architect-event-sourcing
 * @architect-uses EventStoreFoundation, Workpool
 * @architect-used-by SagaEngine, CommandOrchestrator
 */
```

Note: Code stubs must NOT use `@<prefix>-pattern`. The feature file is the canonical pattern definition.

---

## Two-Tier Spec Architecture

| Tier        | Location                | Purpose                                     | Executable |
| ----------- | ----------------------- | ------------------------------------------- | ---------- |
| **Roadmap** | `architect/specs/`      | Planning, deliverables, acceptance criteria | No         |
| **Package** | `{pkg}/tests/features/` | Implementation proof, regression testing    | Yes        |

**Traceability:**

- Roadmap spec: `@<prefix>-executable-specs:{package}/tests/features/behavior/{feature}`
- Package spec: `@<prefix>-implements:{PatternName}`

This separation keeps test output clean (no roadmap noise) while maintaining bidirectional traceability.

---

## Code Stubs

Code is the source of truth. Feature files reference code, not duplicate it.

```typescript
/**
 * @architect
 * @architect-status roadmap
 *
 * ## Reservation Pattern - TTL-Based Pre-Creation Uniqueness
 */
export function reserve(ctx: MutationCtx, args: ReserveArgs): Promise<ReservationResult> {
  throw new Error('ReservationPattern not yet implemented - roadmap pattern');
}
```

| Level         | Contains                  | When                       |
| ------------- | ------------------------- | -------------------------- |
| **Minimal**   | JSDoc annotations only    | Quick exploration          |
| **Interface** | Types + stub functions    | API contracts              |
| **Partial**   | Working code + some stubs | Progressive implementation |

---

## Stubs Architecture

Two types of stubs serve different purposes and live in different locations:

### Code Stubs (Design Session Artifacts)

Design session code stubs define API shapes with `throw new Error("Not implemented")`. They live **outside `src/`** to avoid TypeScript compilation and ESLint issues:

```
architect/
├── stubs/                    # Design session code stubs (not compiled)
│   └── {pattern-name}/      # One directory per pattern
│       └── *.ts             # API shapes, interfaces, throw-not-implemented
├── specs/                    # Tier 1 roadmap specs
└── ...
```

| Phase          | Location                     | Status                               |
| -------------- | ---------------------------- | ------------------------------------ |
| Design         | `architect/stubs/{pattern}/` | `throw new Error("Not implemented")` |
| Implementation | Move/copy to `src/`          | Replace with real logic              |
| Completed      | `src/`                       | Production code                      |

Stubs are scanned by the documentation pipeline (via `-i 'architect/stubs/**/*.ts'`) but excluded from TypeScript compilation (`tsconfig.json` includes only `src/**/*`) and ESLint (`eslint` targets `src tests`).

### Planning Stubs (Test Step Definition Stubs)

Step definitions created during Planning sessions go in a separate directory excluded from test execution:

```
tests/
├── steps/              # Executable (included in test runner)
├── planning-stubs/     # Not yet implemented (excluded)
└── features/           # Feature files
```

| Phase          | Location          | Status                               |
| -------------- | ----------------- | ------------------------------------ |
| Planning       | `planning-stubs/` | `throw new Error("Not implemented")` |
| Implementation | Move to `steps/`  | Replace with real logic              |
| Completed      | `steps/`          | Fully executable                     |

This avoids `.skip()` (forbidden by test safety policy) while preserving planning artifacts.

---

## Related Documentation

| Document                                     | Purpose                                      |
| -------------------------------------------- | -------------------------------------------- |
| [README.md](../README.md)                    | Quick start, FSM diagram, Data API CLI usage |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | FSM validation rules, protection levels, CLI |
| [CONFIGURATION.md](./CONFIGURATION.md)       | Tag prefixes, presets, customization         |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Writing effective specs                      |
| [TAXONOMY.md](./TAXONOMY.md)                 | Tag taxonomy concepts and API                |
