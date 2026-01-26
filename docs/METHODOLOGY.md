# Delivery Process Methodology

> **The unified software delivery process (USDP) for documentation-driven development with AI agents.**

This guide describes the core methodology for using `@libar-dev/delivery-process` to maintain living documentation that serves as the single source of truth for your software development process.

---

## Table of Contents

- [Core Thesis](#core-thesis)
- [Four-Stage Workflow](#four-stage-workflow)
- [FSM-Enforced Workflow](#fsm-enforced-workflow)
- [Two-Tier Spec Architecture](#two-tier-spec-architecture)
- [Code Stubs](#code-stubs)
- [Annotation Ownership Strategy](#annotation-ownership-strategy)
- [Planning Stubs Architecture](#planning-stubs-architecture)
- [ProcessStateAPI](#processstateapi)

---

## Core Thesis

**Git is the event store. Documentation artifacts are projections. Feature files are the single source of truth.**

This is the USDP (Unified Software Delivery Process) — a novel approach where:

| Principle | Description |
|-----------|-------------|
| **Structured specs replace prompts** | `.feature` files provide precise AI context, not imprecise human prompts |
| **Generated documentation** | Docs are always fresh because they're generated, never manually edited |
| **FSM-enforced workflow** | State transitions are validated programmatically, not just documented |

### Why This Matters

| Traditional Approach | USDP Approach |
|---------------------|---------------|
| Docs drift from reality | Docs are generated from source |
| Manual status tracking | FSM prevents invalid transitions |
| Imprecise requirements | Gherkin scenarios are executable |
| Multiple sources of truth | Single source: annotated code + feature files |

---

## Four-Stage Workflow

The delivery process follows a structured four-stage workflow that integrates planning, design, and implementation with FSM state management.

### Visual Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FOUR-STAGE DELIVERY WORKFLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: IDEATION        STAGE 2: DESIGN           STAGE 3: PLANNING      │
│  ─────────────────        ───────────────           ────────────────        │
│  Pattern Brief (.md)  ──► Design Doc (optional) ──► Implementation Plan    │
│                                                                             │
│                              ◄────────────────────────────────────────►     │
│                                     @<prefix>-status: roadmap               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         STAGE 4: CODING                                     │
│                         ────────────────                                    │
│                                                                             │
│  @<prefix>-status: roadmap ──► active ──► completed                         │
│                                                                             │
│  Outputs: Code + Executable Specs + FSM Transitions                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stage Details

| Stage | Name | Input | Output | FSM Impact |
|-------|------|-------|--------|------------|
| 1 | **Ideation** | Pattern brief / requirements | Roadmap spec (`.feature`) | Creates `roadmap` spec |
| 2 | **Design** | Complex requirement | Design document | None |
| 3 | **Planning** | Roadmap spec | Implementation plan | None |
| 4 | **Coding** | Implementation plan | Code + tests | `roadmap→active→completed` |

### When to Skip Stages

| Skip Stage | When |
|------------|------|
| Design | Straightforward implementation path, single valid approach |
| Planning | Single-session work, clear scope, small changes |
| Neither | Complex multi-session work, architectural decisions required |

> **Note:** Tag prefix shown as `@<prefix>-` is configurable. Default is `@libar-docs-` (DDD_ES_CQRS_PRESET) or `@docs-` (GENERIC_PRESET). See [CONFIGURATION.md](./CONFIGURATION.md).

---

## FSM-Enforced Workflow

The delivery process uses a **linter-enforced finite state machine** to ensure process discipline. Invalid transitions are rejected programmatically — not just documented.

### State Transitions

```text
roadmap ──→ active ──→ completed (terminal)
   │          │
   │          ↓
   │       roadmap (blocked/regressed)
   ↓
deferred ──→ roadmap
```

### State Definitions

| State | Purpose | Example |
|-------|---------|---------|
| `roadmap` | Planned work, not yet started | "Add caching layer" |
| `active` | Work in progress | "Implementing caching" |
| `completed` | Finished and verified | "Caching deployed" |
| `deferred` | Postponed (can return to roadmap) | "Caching deprioritized" |

### Protection Levels

| State | Protection | What's Allowed |
|-------|------------|----------------|
| `roadmap` | None | Full editing |
| `deferred` | None | Full editing |
| `active` | **Scope-locked** | Implementation only, no new deliverables |
| `completed` | **Hard-locked** | Requires `@<prefix>-unlock-reason` to modify |

### Why Protection Matters

| Protection | Purpose | Without It |
|------------|---------|------------|
| **Scope-lock** | Prevents scope creep during implementation | Features grow unbounded |
| **Hard-lock** | Preserves completed work integrity | Completed specs quietly modified |
| **Unlock-reason** | Audit trail for exceptions | Changes happen without justification |

### Linter Enforcement

Use the `lint-process` CLI to validate FSM rules:

```bash
# Validate staged changes (pre-commit)
npx lint-process --staged

# Validate all specs
npx lint-process --all
```

---

## Two-Tier Spec Architecture

Feature specs are organized into two tiers with metadata-based traceability:

### Tier 1: Roadmap Specs (Planning)

| Aspect | Details |
|--------|---------|
| **Location** | `{specs-directory}/{product-area}/` |
| **Purpose** | Planning, tracking, deliverables, acceptance criteria |
| **Executable** | No |
| **Key tag** | `@<prefix>-executable-specs:{package}/tests/features/behavior/{feature}` |

### Tier 2: Package Specs (Implementation)

| Aspect | Details |
|--------|---------|
| **Location** | `{packages-directory}/{package}/tests/features/behavior/` |
| **Purpose** | Implementation proof, regression testing |
| **Executable** | Yes (vitest-cucumber or similar) |
| **Key tag** | `@<prefix>-implements:{PatternName}` |

### Traceability

```
Tier 1 Roadmap Spec                    Tier 2 Package Spec
──────────────────                     ────────────────────
@<prefix>-executable-specs:      ──→   (directory location)
                                 ←──   @<prefix>-implements:PatternName
```

### Why Two Tiers?

| Single Tier Problem | Two-Tier Solution |
|---------------------|-------------------|
| Roadmap noise in test output | Roadmap specs are non-executable |
| Test scenarios lack business context | Roadmap specs have deliverables + acceptance criteria |
| No traceability | Tags link tiers bidirectionally |

### Example Traceability

```gherkin
# Tier 1: Roadmap spec ({specs-directory}/my-pattern.feature)
@<prefix>-pattern:MyPattern
@<prefix>-status:active
@<prefix>-executable-specs:my-package/tests/features/behavior/my-pattern
Feature: My Pattern

# Tier 2: Package spec ({packages-directory}/my-package/tests/features/behavior/my-pattern.feature)
@<prefix>-implements:MyPattern
Feature: My Pattern Behavior
```

---

## Code Stubs

**Code is the source of truth. Feature files reference code, not duplicate it.**

### What Are Code Stubs?

Annotated TypeScript files that define APIs before implementation:

```typescript
/**
 * @<prefix>
 * @<prefix>-status roadmap
 *
 * ## Reservation Pattern - TTL-Based Pre-Creation Uniqueness
 *
 * Atomic claim with OCC eliminates check-then-create races.
 */
export interface ReservationResult {
  reservationId: string;
  key: string;
  expiresAt: number;
}

export function reserve(ctx: MutationCtx, args: ReserveArgs): Promise<ReservationResult> {
  throw new Error("ReservationPattern not yet implemented - roadmap pattern");
}
```

### Levels of Code Stub Detail

| Level | Contains | When Used |
|-------|----------|-----------|
| **Minimal** | JSDoc annotations only | Quick exploration |
| **Interface** | Types + interfaces + stub functions | API contracts |
| **Partial** | Working code + some stub functions | Progressive implementation |

### Where Content Belongs

| Content | Location | Why |
|---------|----------|-----|
| API documentation | Code stubs (JSDoc) | Stays synchronized with implementation |
| Mermaid diagrams | Code comments | Generator extracts for architecture docs |
| Business rules | Feature file `Rule:` blocks | BDD + business-rules generator |
| Acceptance criteria | Feature file Scenarios | Testing |

### Feature Files Should Reference Code

Instead of duplicating API details in feature files:

```gherkin
Rule: Reservations use atomic claim with OCC

  **Invariant:** Only one reservation can exist for a given key.

  **API:** See `{your-package}/src/reservations/reserve.ts`

  **Verified by:** Concurrent reservations, Expired reservation cleanup
```

---

## Annotation Ownership Strategy

> **Split-Ownership Principle:** Feature files own roadmap/planning metadata (WHAT and WHEN). Code stubs own implementation relationships (HOW and WITH WHAT). Neither duplicates the other — they complement each other.

### Feature Files Own (Roadmap/Planning)

| Tag | Purpose | Why Feature File |
|-----|---------|------------------|
| `@<prefix>-status` | FSM state | Planning concern |
| `@<prefix>-phase` | Milestone sequencing | Release planning |
| `@<prefix>-effort` | Estimated/actual effort | Planning/tracking |
| `@<prefix>-depends-on` | Pattern-level dependencies | Roadmap sequencing |
| `@<prefix>-enables` | Forward roadmap unlocks | What this unblocks |
| `@<prefix>-business-value` | Why this matters | Prioritization |
| `@<prefix>-release` | Version targeting | Release planning |
| `@<prefix>-product-area` | Organizational grouping | Portfolio management |

### Code Stubs Own (Implementation Relationships)

| Tag | Purpose | Why Code Stub |
|-----|---------|---------------|
| `@<prefix>-uses` | Concrete dependencies | Implementation detail |
| `@<prefix>-used-by` | Concrete consumers | Dependency graph |
| `@<prefix>-usecase` | When/how to use | API guidance |
| Category flags | Technical categorization | Code organization |
| `@<prefix>-constraint` | Implementation constraints | Technical detail |

### Example: Split Ownership in Practice

**Feature file** (roadmap concern):

```gherkin
@<prefix>
@<prefix>-pattern:EventStoreDurability
@<prefix>-status:roadmap
@<prefix>-phase:18
@<prefix>-depends-on:EventStoreFoundation,DurableFunctionAdapters
@<prefix>-enables:SagaEngine,ProjectionRebuilder
Feature: Event Store Durability
```

**Code stub** (implementation concern — no `@<prefix>-pattern`):

```typescript
/**
 * @<prefix>
 * @<prefix>-status roadmap
 * @<prefix>-event-sourcing
 *
 * @<prefix>-uses EventStoreFoundation, Workpool
 * @<prefix>-used-by SagaEngine, CommandOrchestrator
 * @<prefix>-usecase "When event append must survive failures"
 */
```

> **Important:** Code stubs must NOT use `@<prefix>-pattern`. The feature file is the canonical pattern definition. Code stubs provide relationship metadata without claiming to be pattern sources.

---

## Planning Stubs Architecture

Step definition stubs created during Planning+Design sessions are placed in a special directory structure that excludes them from test execution.

### Directory Structure

```
{packages-directory}/{package}/tests/
├── steps/              # Executable step definitions (included in test runner)
├── planning-stubs/     # Planning artifacts (excluded from test runner)
│   ├── feature-a/
│   ├── feature-b/
│   └── ...
└── features/           # Feature files (unchanged)
```

### Lifecycle

| Phase | Location | Status |
|-------|----------|--------|
| Planning session | `tests/planning-stubs/` | Stubs with `throw new Error("Not implemented")` |
| Implementation session | Move to `tests/steps/` | Replace throws with real logic |
| Completed | `tests/steps/` | Fully executable tests |

### Why This Architecture?

| Problem | Solution |
|---------|----------|
| Stub tests fail with "Not implemented" | Exclude from test runner until implementation |
| Can't use `.skip()` (test safety policy) | Place in separate directory |
| Stubs have documentation value | Keep stubs for planning reference |
| Test framework syntax errors | Templates enforce correct patterns |

---

## ProcessStateAPI

For AI coding sessions, use `ProcessStateAPI` instead of parsing generated documentation. This dramatically reduces context usage and provides real-time accuracy.

### Setup

```typescript
import {
  generators,
  api as apiModule,
  createDefaultTagRegistry,
} from '@libar-dev/delivery-process';

// Build dataset from extracted patterns (from scanPatterns + extractPatterns)
const tagRegistry = createDefaultTagRegistry();
const dataset = generators.transformToMasterDataset({
  patterns: extractedPatterns,
  tagRegistry,
});
const stateApi = apiModule.createProcessStateAPI(dataset);
```

### Key Queries

#### Status Queries

| Method | Returns | Description |
|--------|---------|-------------|
| `getPatternsByNormalizedStatus(status)` | `ExtractedPattern[]` | Patterns by "completed"/"active"/"planned" |
| `getPatternsByStatus(status)` | `ExtractedPattern[]` | Patterns by exact FSM status |
| `getStatusCounts()` | `StatusCounts` | `{completed, active, planned, total}` |
| `getCompletionPercentage()` | `number` | Overall completion percentage |

#### Phase Queries

| Method | Returns | Description |
|--------|---------|-------------|
| `getPatternsByPhase(phase)` | `ExtractedPattern[]` | All patterns in a phase |
| `getPhaseProgress(phase)` | `PhaseProgress \| undefined` | Progress metrics for a phase |
| `getActivePhases()` | `PhaseGroup[]` | Phases with active work |
| `getAllPhases()` | `PhaseGroup[]` | All phases sorted by number |

#### FSM Queries

| Method | Returns | Description |
|--------|---------|-------------|
| `isValidTransition(from, to)` | `boolean` | Check if transition is valid |
| `checkTransition(from, to)` | `TransitionCheck` | Detailed validation result |
| `getValidTransitionsFrom(status)` | `ProcessStatusValue[]` | Valid target states |
| `getProtectionInfo(status)` | `ProtectionInfo` | Protection level details |

#### Pattern Queries

| Method | Returns | Description |
|--------|---------|-------------|
| `getPattern(name)` | `ExtractedPattern \| undefined` | Find pattern by name |
| `getPatternDependencies(name)` | `PatternDependencies \| undefined` | dependsOn, enables, uses, usedBy |
| `getPatternDeliverables(name)` | `PatternDeliverable[]` | Deliverables list |
| `getCurrentWork()` | `ExtractedPattern[]` | Active patterns only |
| `getRoadmapItems()` | `ExtractedPattern[]` | Roadmap + deferred patterns |

### Common Query Patterns

```typescript
// Before starting work - check what's available
api.getCurrentWork();           // What's being worked on
api.getRoadmapItems();          // What can be started
api.getPatternsByPhase(15);     // All patterns in phase 15

// Before FSM transitions - validate
api.isValidTransition('roadmap', 'active');  // Can we start?
api.getProtectionInfo('completed');          // What protection level?

// During implementation - get details
api.getPattern('MyFeature');                 // Full pattern
api.getPatternDeliverables('MyFeature');     // Just deliverables

// Progress tracking
api.getPhaseProgress(15);        // Phase completion metrics
api.getStatusCounts();           // Overall status counts
api.getCompletionPercentage();   // Overall completion %
```

### Benefits Over Generated Docs

| Aspect | Generated Docs | ProcessStateAPI |
|--------|----------------|-----------------|
| Context cost | High (read markdown) | Low (typed queries) |
| Accuracy | Snapshot at generation time | Real-time from source |
| Speed | Requires regeneration | Instant queries |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [CONFIGURATION.md](./CONFIGURATION.md) | Tag prefixes, presets, customization |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Pipeline architecture, codec system |
| [SESSION-GUIDES.md](./SESSION-GUIDES.md) | Session workflows for planning, design, implementation |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Rich Gherkin patterns for BDD specs |
| [../INSTRUCTIONS.md](../INSTRUCTIONS.md) | Complete tag reference, CLI commands |
