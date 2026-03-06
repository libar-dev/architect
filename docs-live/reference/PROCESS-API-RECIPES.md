# Process API CLI — Recipes & Workflow Guide

> Auto-generated from CLI schema. See [CLI Reference](./PROCESS-API-REFERENCE.md) for flag tables.

## Why Use This

Traditional approach: read generated Markdown, parse it mentally, hope it's current. This CLI queries the **same annotated sources** that generate those docs -- in real time, with typed output.

| Approach                 | Context Cost | Accuracy              | Speed   |
| ------------------------ | ------------ | --------------------- | ------- |
| Parse generated Markdown | High         | Snapshot at gen time  | Slow    |
| **Data API CLI**         | **Low**      | Real-time from source | Instant |

The CLI has two output modes:

- **Text commands** (6) -- formatted for terminal reading or AI context. Use `===` section markers for structure.
- **JSON commands** (12+) -- wrapped in a `QueryResult` envelope. Pipeable to `jq`.

Run `process-api --help` for the full command reference with all flags and 26 available API methods.

## Quick Start

The recommended session startup is three commands:

```bash
pnpm process:query -- overview
pnpm process:query -- scope-validate MyPattern implement
pnpm process:query -- context MyPattern --session implement
```

Example `overview` output:

```text
=== PROGRESS ===
318 patterns (224 completed, 47 active, 47 planned) = 70%

=== ACTIVE PHASES ===
Phase 24: ProcessStateAPIRelationshipQueries (1 active)
Phase 25: DataAPIStubIntegration (1 active)

=== BLOCKING ===
StepLintExtendedRules blocked by: StepLintVitestCucumber

=== DATA API ===
pnpm process:query -- <subcommand>
  overview, context, scope-validate, dep-tree, list, stubs, files, rules, arch blocking
```

## Session Types

The `--session` flag tailors output to what you need right now:

| Type        | Includes                                     | When to Use                        |
| ----------- | -------------------------------------------- | ---------------------------------- |
| `planning`  | Pattern metadata and spec file only          | Creating a new roadmap spec        |
| `design`    | Full: metadata, stubs, deps, deliverables    | Making architectural decisions     |
| `implement` | Focused: deliverables, FSM state, test files | Writing code from an existing spec |

**Decision tree:** Starting to code? `implement`. Complex decisions? `design`. New pattern? `planning`. Not sure? Run `overview` first.

---

## Session Workflow Commands

These 6 commands output structured text (not JSON). They are designed for terminal reading and AI context consumption.

### `overview`

Executive summary: progress percentage, active phases, blocking patterns, and a CLI cheat sheet.

```bash
pnpm process:query -- overview
```

Example output:

```
=== PROGRESS ===
318 patterns (224 completed, 47 active, 47 planned) = 70%

=== ACTIVE PHASES ===
Phase 24: ProcessStateAPIRelationshipQueries (1 active)
Phase 25: DataAPIStubIntegration (1 active)

=== BLOCKING ===
StepLintExtendedRules blocked by: StepLintVitestCucumber

=== DATA API — Use Instead of Explore Agents ===
pnpm process:query -- <subcommand>
  overview, context, scope-validate, dep-tree, list, stubs, files, rules, arch blocking
```

### `scope-validate`

**Highest-impact command.** Pre-flight readiness check that prevents wasted sessions. Returns a PASS/BLOCKED/WARN verdict covering: dependency completion, deliverable definitions, FSM transition validity, and design decisions.

```bash
pnpm process:query -- scope-validate MyPattern implement
```

Checks: dependency completion, deliverable definitions, FSM transition validity, design decisions, executable spec location. Valid session types for scope-validate: `implement`, `design`.

Example output:

```
=== SCOPE VALIDATION: DataAPIDesignSessionSupport (implement) ===

=== CHECKLIST ===
[PASS] Dependencies completed: 2/2 completed
[PASS] Deliverables defined: 4 deliverable(s) found
[BLOCKED] FSM allows transition: completed → active is not valid.
[WARN] Design decisions recorded: No PDR/AD references found in stubs

=== VERDICT ===
BLOCKED: 1 blocker(s) prevent implement session
```

### `context`

Curated context bundle tailored to session type.

```bash
pnpm process:query -- context MyPattern --session design
```

Example output:

```
=== PATTERN: ContextAssemblerImpl ===
Status: active | Category: pattern
## ContextAssembler — Session-Oriented Context Bundle Builder

Pure function composition over MasterDataset.
File: src/api/context-assembler.ts

=== DEPENDENCIES ===
[active] ProcessStateAPI (implementation) src/api/process-state.ts
[completed] MasterDataset (implementation) src/validation-schemas/master-dataset.ts

=== CONSUMERS ===
ContextFormatterImpl (active)
ProcessAPICLIImpl (active)

=== ARCHITECTURE (context: api) ===
MasterDataset (completed, read-model)
ProcessStateAPI (active, service)
...
```

### `dep-tree`

Dependency chain with status indicators. Shows what a pattern depends on, recursively.

```bash
pnpm process:query -- dep-tree MyPattern
```

Use `--depth` to limit recursion depth: `pnpm process:query -- dep-tree MyPattern --depth 2`.

### `files`

File reading list with implementation paths. Use `--related` to include architecture neighbors.

```bash
pnpm process:query -- files MyPattern --related
```

Example output:

```
=== PRIMARY ===
src/cli/process-api.ts

=== ARCHITECTURE NEIGHBORS ===
src/cli/version.ts
src/cli/output-pipeline.ts
src/cli/error-handler.ts
```

### `handoff`

Captures session-end state: deliverable statuses, blockers, and modification date.

```bash
pnpm process:query -- handoff --pattern MyPattern
```

Use `--git` to include recent commits. Use `--session` to tag the handoff with a session id.

Example output:

```
=== HANDOFF: DataAPIDesignSessionSupport (review) ===
Date: 2026-02-21 | Status: completed

=== COMPLETED ===
[x] Scope validation logic (src/api/scope-validator.ts)
[x] Handoff document generator (src/api/handoff-generator.ts)

=== BLOCKERS ===
None
```

---

## Pattern Discovery

These commands output JSON wrapped in a `QueryResult` envelope.

### `status`

Status counts and completion percentage.

```bash
pnpm process:query -- status
```

**Output:** `{ counts: { completed, active, planned, total }, completionPercentage, distribution }`

### `list`

Filtered pattern listing. Composable with output modifiers and list filters.

```bash
pnpm process:query -- list --status roadmap --names-only
```

See Output Modifiers and List Filters for all options. Examples: `list --status active --count`, `list --phase 25 --fields patternName,status,file`.

### `search`

Fuzzy name search with match scores. Suggests close matches when a pattern is not found.

```bash
pnpm process:query -- search EventStore
```

### `pattern`

Full detail for one pattern including deliverables, dependencies, and all relationship fields.

```bash
pnpm process:query -- pattern TransformDataset
```

**Warning:** Completed patterns can produce ~66KB of output. Prefer `context --session` for interactive sessions.

### `stubs`

Design stubs with target paths and resolution status.

```bash
pnpm process:query -- stubs MyPattern
```

Use `--unresolved` to show only stubs missing target files: `pnpm process:query -- stubs --unresolved`.

### `decisions`

AD-N design decisions extracted from stub descriptions.

```bash
pnpm process:query -- decisions MyPattern
```

**Note:** Returns exit code 1 when no decisions are found (unlike `list`/`search` which return empty arrays).

### `pdr`

Cross-reference patterns mentioning a PDR number.

```bash
pnpm process:query -- pdr 1
```

**Note:** Returns exit code 1 when no PDR references are found, same as `decisions`.

### `rules`

Business rules and invariants extracted from Gherkin `Rule:` blocks, grouped by product area, phase, and feature.

```bash
pnpm process:query -- rules --pattern ProcessGuardDecider
```

**Warning:** Unfiltered `rules` output can exceed 600KB. Always use `--pattern` or `--product-area` filters. **Output shape:** `{ productAreas: [{ productArea, ruleCount, invariantCount, phases: [{ phase, features: [{ pattern, source, rules }] }] }], totalRules, totalInvariants }`

---

## Architecture Queries

All architecture queries output JSON. They use `@libar-docs-arch-*` annotations.

### `arch roles`

All arch-roles with pattern counts

```bash
pnpm process:query -- arch roles
```

### `arch context`

All bounded contexts

```bash
pnpm process:query -- arch context
```

### `arch context <name>`

Patterns in one bounded context

```bash
pnpm process:query -- arch context scanner
```

### `arch layer`

All architecture layers

```bash
pnpm process:query -- arch layer
```

### `arch layer <name>`

Patterns in one layer

```bash
pnpm process:query -- arch layer domain
```

### `arch neighborhood <pattern>`

Uses, usedBy, dependsOn, same-context

```bash
pnpm process:query -- arch neighborhood EventStore
```

### `arch compare <c1> <c2>`

Cross-context shared deps + integration

```bash
pnpm process:query -- arch compare scanner codec
```

### `arch coverage`

Annotation completeness across input files

```bash
pnpm process:query -- arch coverage
```

### `arch dangling`

Broken references (names that don't exist)

```bash
pnpm process:query -- arch dangling
```

### `arch orphans`

Patterns with no relationships (isolated)

```bash
pnpm process:query -- arch orphans
```

### `arch blocking`

Patterns blocked by incomplete deps

```bash
pnpm process:query -- arch blocking
```

---

## Metadata & Inventory

### `tags`

Tag usage report — counts per tag and value across all annotated sources.

```bash
pnpm process:query -- tags
```

### `sources`

File inventory by type (TypeScript, Gherkin, Stubs, Decisions).

```bash
pnpm process:query -- sources
```

### `unannotated`

TypeScript files missing the `@libar-docs` opt-in marker. Use `--path` to scope to a directory.

```bash
pnpm process:query -- unannotated --path src/types
```

### `query`

Execute any of the 26 query API methods directly by name. This is the escape hatch for methods not exposed as dedicated subcommands.

```bash
pnpm process:query -- query getStatusCounts
```

Integer-like arguments are automatically coerced to numbers. Run `process-api --help` for the full list of available API methods. Examples: `query isValidTransition roadmap active`, `query getPatternsByPhase 18`, `query getRecentlyCompleted 5`.

---

## Common Recipes

Frequently-used command sequences for daily workflow.

### Starting a Session

The recommended session startup is three commands.

```bash
pnpm process:query -- overview   # project health
pnpm process:query -- scope-validate MyPattern implement   # pre-flight
pnpm process:query -- context MyPattern --session implement   # curated context
```

### Finding What to Work On

Discover available patterns, blockers, and missing implementations.

```bash
pnpm process:query -- list --status roadmap --names-only   # available patterns
pnpm process:query -- arch blocking   # stuck patterns
pnpm process:query -- stubs --unresolved   # missing implementations
```

### Investigating a Pattern

Deep-dive into a specific pattern: search, dependencies, neighbors, and files.

```bash
pnpm process:query -- search EventStore   # fuzzy name search
pnpm process:query -- dep-tree MyPattern --depth 2   # dependency chain
pnpm process:query -- arch neighborhood MyPattern   # what it touches
pnpm process:query -- files MyPattern --related   # file paths
```

### Design Session Prep

Gather full context, design decisions, and stubs before a design session.

```bash
pnpm process:query -- context MyPattern --session design   # full context
pnpm process:query -- decisions MyPattern   # design decisions
pnpm process:query -- stubs MyPattern   # existing stubs
```

### Ending a Session

Capture session-end state for continuity.

```bash
pnpm process:query -- handoff --pattern MyPattern   # capture state
pnpm process:query -- handoff --pattern MyPattern --git   # include commits
```

---
