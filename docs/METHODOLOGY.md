# Delivery Process Methodology

> **Git is the event store. Documentation artifacts are projections. Annotated code is the single source of truth.**

This document explains the _why_ behind `@libar-dev/delivery-process`. For _how_, see [INSTRUCTIONS.md](../INSTRUCTIONS.md).

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
- **Read Model** = ProcessStateAPI (typed queries)

When you run `generate-docs`, you're rebuilding read models from the event stream. The source annotations are always authoritative.

---

## Dogfooding: This Package Documents Itself

Every pattern in this package uses its own annotation system. Real examples:

**ProcessGuardDecider** (pure validation logic):

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern ProcessGuardDecider
 * @libar-docs-status completed
 * @libar-docs-uses FSMTransitions, FSMStates
 * @libar-docs-used-by LintModule
 */
export function validateChanges(input: ValidationInput): ValidationOutput { ... }
```

**PatternScanner** (file discovery):

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern PatternScanner
 * @libar-docs-status completed
 * @libar-docs-uses GherkinASTParser, TypeScriptASTParser
 * @libar-docs-used-by Orchestrator, DualSourceExtractor
 */
export async function scanPatterns(config: ScanConfig): Promise<ScannedFile[]> { ... }
```

Run `pnpm docs:patterns` and these annotations become a searchable pattern registry with dependency graphs.

---

## Four-Stage Workflow

| Stage        | Input               | Output                      | FSM State                            |
| ------------ | ------------------- | --------------------------- | ------------------------------------ |
| **Ideation** | Pattern brief       | Roadmap spec (`.feature`)   | `roadmap`                            |
| **Design**   | Complex requirement | Decision specs + code stubs | `roadmap`                            |
| **Planning** | Roadmap spec        | Implementation plan         | `roadmap`                            |
| **Coding**   | Implementation plan | Code + tests                | `roadmap` -> `active` -> `completed` |

**When to skip stages:**

| Skip     | When                                                  |
| -------- | ----------------------------------------------------- |
| Design   | Single valid approach, straightforward implementation |
| Planning | Single-session work, clear scope                      |
| Neither  | Multi-session work, architectural decisions           |

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
@libar-docs
@libar-docs-pattern:EventStoreDurability
@libar-docs-status:roadmap
@libar-docs-phase:18
@libar-docs-depends-on:EventStoreFoundation
@libar-docs-enables:SagaEngine
Feature: Event Store Durability
```

**Code stub** (src/event-store/durability.ts):

```typescript
/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-event-sourcing
 * @libar-docs-uses EventStoreFoundation, Workpool
 * @libar-docs-used-by SagaEngine, CommandOrchestrator
 */
```

Note: Code stubs must NOT use `@<prefix>-pattern`. The feature file is the canonical pattern definition.

---

## Two-Tier Spec Architecture

| Tier        | Location                | Purpose                                     | Executable |
| ----------- | ----------------------- | ------------------------------------------- | ---------- |
| **Roadmap** | `specs/{area}/`         | Planning, deliverables, acceptance criteria | No         |
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
 * @libar-docs
 * @libar-docs-status roadmap
 *
 * ## Reservation Pattern - TTL-Based Pre-Creation Uniqueness
 */
export function reserve(ctx: MutationCtx, args: ReserveArgs): Promise<ReservationResult> {
  throw new Error('Not yet implemented - roadmap pattern');
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
delivery-process/
├── stubs/                    # Design session code stubs (not compiled)
│   └── {pattern-name}/      # One directory per pattern
│       └── *.ts             # API shapes, interfaces, throw-not-implemented
├── specs/                    # Tier 1 roadmap specs
└── ...
```

| Phase          | Location                            | Status                               |
| -------------- | ----------------------------------- | ------------------------------------ |
| Design         | `delivery-process/stubs/{pattern}/` | `throw new Error("Not implemented")` |
| Implementation | Move/copy to `src/`                 | Replace with real logic              |
| Completed      | `src/`                              | Production code                      |

Stubs are scanned by the documentation pipeline (via `-i 'delivery-process/stubs/**/*.ts'`) but excluded from TypeScript compilation (`tsconfig.json` includes only `src/**/*`) and ESLint (`eslint` targets `src tests`).

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

| Document                                     | Purpose                                         |
| -------------------------------------------- | ----------------------------------------------- |
| [README.md](../README.md)                    | Quick start, FSM diagram, ProcessStateAPI usage |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | FSM validation rules, protection levels, CLI    |
| [CONFIGURATION.md](./CONFIGURATION.md)       | Tag prefixes, presets, customization            |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Writing effective specs                         |
| [INSTRUCTIONS.md](../INSTRUCTIONS.md)        | Complete tag reference                          |
