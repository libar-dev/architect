# Process API Integration Assessment

> **Purpose:** Consolidated reference for Process API capabilities, known gaps, and next steps.
> Serves as decision context and shareable context for Claude Code sessions.
>
> **Branch:** `feature/process-api-cli`

---

## 1. MVP Status Summary

Four specs are **completed** and have passed 4 rounds of code review:

| Spec                           | Phase | Deliverables | Key Subcommands                                                        |
| ------------------------------ | ----- | ------------ | ---------------------------------------------------------------------- |
| **DataAPIOutputShaping**       | 25a   | 8/8 done     | `list`, `search`, `--names-only`, `--count`, `--fields`                |
| **DataAPIStubIntegration**     | 25a   | 7/7 done     | `stubs`, `decisions`, `pdr`                                            |
| **DataAPIContextAssembly**     | 25b   | 7/7 done     | `context`, `files`, `dep-tree`, `overview`                             |
| **DataAPIArchitectureQueries** | 25b   | 6/6 done     | `arch neighborhood/compare/coverage`, `tags`, `sources`, `unannotated` |

**Total: 28 deliverables completed, 16 subcommands implemented.**

---

## 2. Verified API Commands

All 16 subcommands tested against live data (152 patterns in the dataset).

| Command                           | Quality     | Notes                                                                                       |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `overview`                        | Excellent   | 3 compact sections: PROGRESS, ACTIVE PHASES, BLOCKING. Best token efficiency.               |
| `context --session implement`     | Excellent   | Deliverables + FSM state. Most actionable session mode.                                     |
| `arch neighborhood` (TS patterns) | Excellent   | Rich cross-context dependency visualization with uses/usedBy/dependsOn/enables/sameContext. |
| `arch neighborhood` (Gherkin)     | Good        | Shows `dependsOn`/`enables` fields alongside `uses`/`usedBy`/`sameContext`.                 |
| `arch compare`                    | Excellent   | Cross-context comparison with shared deps and integration points.                           |
| `arch coverage`                   | Outstanding | 85% coverage (112/138), identifies annotation gaps and unused taxonomy.                     |
| `arch context <name>`             | Good        | Patterns in bounded context. Supports `--count`/`--names-only` modifiers.                   |
| `arch layer <name>`               | Good        | Patterns in architecture layer. Supports `--count`/`--names-only` modifiers.                |
| `arch roles`                      | Good        | Lists all arch-roles with counts and pattern names.                                         |
| `tags`                            | Very useful | 8 tag types with full value distributions and counts.                                       |
| `search`                          | Good        | Fuzzy matching works well for both prefix and substring matches.                            |
| `pattern`                         | Good        | Most comprehensive single-pattern query (~3KB of structured detail).                        |
| `stubs`                           | Good        | Shows stub files with target paths and resolution status (targetExists boolean).            |
| `status`                          | Solid       | Counts + percentages in compact format.                                                     |
| `sources`                         | Good        | File inventory by type (110 TS, 39 Gherkin, 2 Stubs, 1 Decisions).                          |
| `list --status X`                 | Good        | Filtering + `--count`, `--names-only`, `--fields` all work.                                 |
| `files --related`                 | Good        | Includes implementation file paths for completed deps via `implementedBy` lookup.           |
| `dep-tree`                        | Good        | Full tree with reverse-computed `enables`/`usedBy` auto-populated.                          |

### Known Gaps

| Command                      | Issue                                                      | Severity |
| ---------------------------- | ---------------------------------------------------------- | -------- |
| `context --session design`   | Good for metadata + deps, but missing deliverables table   | Low      |
| `context --session planning` | Same output as design — minimal differentiation            | Low      |
| `pdr`                        | Never resolves — PDR refs not wired to extraction pipeline | Low      |

---

## 3. Remaining Issues

| Issue                                      | Location                             | Severity | Effort               |
| ------------------------------------------ | ------------------------------------ | -------- | -------------------- |
| `pdr` never resolves any references        | PDR extraction not wired to pipeline | Low      | Out of scope         |
| Stub `targetPath: "tag)"` parsing artifact | `src/api/stub-resolver.ts`           | Low      | 30 min investigation |

---

## 4. Design Session Dry Run Results

Simulated design session for **DataAPIDesignSessionSupport** (next spec to implement),
testing each API command against the phases of a real design workflow.

### Phase-by-Phase API Coverage

| Design Session Phase     | API Command                | Coverage  | Notes                                                  |
| ------------------------ | -------------------------- | --------- | ------------------------------------------------------ |
| 1. Pattern understanding | `context --session design` | Good      | Deliverables table not in output                       |
| 2. Dependency chain      | `dep-tree`                 | Good      | Full tree with reverse-computed `enables`/`usedBy`     |
| 2b. Dependency status    | `context --session design` | Good      | Shows deps with status correctly                       |
| 3. Related code          | `files --related`          | Good      | Includes implementation file paths via `implementedBy` |
| 4. Architecture position | `arch neighborhood`        | Good      | Includes `dependsOn`/`enables` for Gherkin patterns    |
| 5. Existing stubs        | `stubs`                    | Excellent | Shows resolution status clearly                        |
| 6. Project overview      | `overview`                 | Excellent | Perfect session start context                          |

### What the API Eliminates

| Activity                  | Before (explore agents)        | After (API)                      |
| ------------------------- | ------------------------------ | -------------------------------- |
| Understand pattern + deps | 2-3 explore agents (~30s each) | `context --session design` (~5s) |
| Check project state       | Read PATTERNS.md (500+ lines)  | `overview` (~5s)                 |
| Find stubs                | Glob + grep for stubs/         | `stubs <pattern>` (~5s)          |
| Find tag vocabulary       | Read taxonomy config files     | `tags` (~5s)                     |
| Check annotation coverage | Manual file counting           | `arch coverage` (~5s)            |

### What Still Requires Explore Agents

1. **CLI code structure** — how to add a new subcommand (for-loop + switch pattern in `src/cli/process-api.ts`) <!-- TODO(User): configure auto-generation from source like @docs-generated/docs - **not in scope** -->

### What's Covered by Existing Docs (No Explore Needed)

| Topic                                    | Document                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ProcessStateAPI method signatures        | `pnpm process:query -- --help` lists all 27 methods; `docs/PROCESS-API.md` has full reference         |
| ProcessStateAPI programmatic usage       | `_claude-md/api/process-state-api.md`                                                                 |
| Process API CLI examples                 | `_claude-md/api/process-api-cli.md`                                                                   |
| MasterDataset schema & views             | `docs-generated/docs/ARCHITECTURE-REFERENCE.md` (MasterDataset Schema + Pre-computed Views sections)  |
| Transform function & pipeline            | `docs-generated/docs/ARCHITECTURE-REFERENCE.md` (Transform Function + Orchestrator Pipeline sections) |
| Codec system & block vocabulary          | `docs-generated/docs/ARCHITECTURE-REFERENCE.md` (Codec Factory Pattern + Block Vocabulary sections)   |
| Test patterns (vitest-cucumber)          | `_claude-md/testing/vitest-cucumber.md`                                                               |
| Test implementation issues               | `_claude-md/testing/test-implementation.md`                                                           |
| Testing policy (Gherkin-only)            | `_claude-md/testing/testing-policy.md`                                                                |
| Gherkin authoring patterns               | `_claude-md/authoring/gherkin-patterns.md`                                                            |
| Feature file rich content                | `_claude-md/authoring/feature-content.md`                                                             |
| Session workflows (planning/design/impl) | `docs/SESSION-GUIDES.md`                                                                              |
| Session details (CLAUDE.md)              | `_claude-md/workflow/session-details.md`                                                              |
| Annotation system & tag formats          | `_claude-md/api/annotation-system.md`, `_claude-md/api/tag-formats.md`                                |
| Dual-source architecture                 | `_claude-md/api/dual-source.md`                                                                       |
| Relationship model                       | `_claude-md/api/relationships.md`                                                                     |
| FSM & handoff rules                      | `_claude-md/workflow/fsm-handoff.md`                                                                  |
| Process Guard validation                 | `_claude-md/validation/process-guard.md`                                                              |
| Anti-pattern detection                   | `_claude-md/validation/anti-patterns.md`                                                              |

### Quantified Improvement

**API + existing docs eliminate all but one explore agent for a design session.**
Only CLI code structure (`src/cli/process-api.ts` for-loop + switch pattern) genuinely
requires code exploration. Everything else — including MasterDataset schema and pre-computed
views — is covered by the Process API CLI, `docs/PROCESS-API.md`,
`docs-generated/docs/ARCHITECTURE-REFERENCE.md`, and the CLAUDE.md module tree.

---

## 5. Annotation Model Analysis

### Dual-Source Architecture (By Design)

| Concern           | Gherkin Patterns                 | TypeScript Patterns                         |
| ----------------- | -------------------------------- | ------------------------------------------- |
| Relationship type | `dependsOn`/`enables` (planning) | `uses`/`usedBy` (runtime)                   |
| Architecture tags | None                             | `archContext`, `archRole`, `archLayer`      |
| Ownership         | Specs, planning deps, timeline   | Implementations, runtime deps, architecture |
| Example           | DataAPIContextAssembly           | ContextAssemblerImpl                        |

**Implication:** Gherkin patterns are "planning-layer" artifacts. TypeScript patterns are
"runtime-layer" artifacts. Architecture queries will always show a subset of the full
pattern graph when querying Gherkin patterns.

### Reverse Lookups

All four reverse lookups are auto-computed in the second pass of `transform-dataset.ts`,
with dedup guards and deterministic sorting:

| Forward Relationship | Reverse         | Auto-Computed     |
| -------------------- | --------------- | ----------------- |
| `implementsPatterns` | `implementedBy` | Yes (second pass) |
| `extendsPattern`     | `extendedBy`    | Yes (second pass) |
| `dependsOn`          | `enables`       | Yes (second pass) |
| `uses`               | `usedBy`        | Yes (second pass) |

### Coverage Analysis

- **85% annotation coverage** (112/138 files annotated)
- **20 unannotated files:** 7 barrel exports (not meaningful to annotate), 8 type/schema
  definitions, 5 utility/infrastructure files
- **Notable gap:** `src/types/result.ts` (Result monad used everywhere) is unannotated
- **8 stub files** in `delivery-process/stubs/` across 4 pattern groups, all properly
  annotated with `@libar-docs-implements` and taxonomy tags

### Taxonomy Reference

Two generation commands produce authoritative tag/metadata references:

| Command                  | Output                                                                                                                            | Notes                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm docs:taxonomy`     | `docs-generated/TAXONOMY.md` + 3 detail files (`taxonomy/categories.md`, `taxonomy/metadata-tags.md`, `taxonomy/format-types.md`) | **Preferred.** Codec-based, progressive disclosure, domain grouping. |
| `pnpm docs:tag-taxonomy` | `delivery-process/tag-taxonomy.md`                                                                                                | **Deprecated.** Legacy standalone generator. Will be removed.        |

Use `pnpm docs:taxonomy` for the definitive list of all available `@libar-docs-*` tags,
categories, metadata formats, and aggregation tags.

---

## 6. Remaining Work

| Item                                           | Effort     | Priority |
| ---------------------------------------------- | ---------- | -------- |
| CLAUDE.md update with new commands             | ~1-2 hours | P1       |
| Design session for DataAPIDesignSessionSupport | ~2-3 hours | P2       |

---

## 7. Next Spec: DataAPIDesignSessionSupport

### Why It's the Perfect Next Step

1. **Smallest scope:** 4 deliverables, 1d effort, 2 subcommands (`scope-validate`, `handoff`)
2. **Dependencies are done:** DataAPIContextAssembly + DataAPIStubIntegration both completed
3. **Self-referential validation:** Running a design session TO design the session support
   feature, USING the `context --session design` command
4. **Tests the hardest claim:** "Replace explore agents with one command"
5. **Natural next in sequence:** Phase 25c, after 25a+25b

### Deliverables

| Deliverable                | Status  | Location                     | Tests       |
| -------------------------- | ------- | ---------------------------- | ----------- |
| Scope validation logic     | planned | src/api/scope-validator.ts   | unit        |
| scope-validate subcommand  | planned | src/cli/process-api.ts       | integration |
| Handoff document generator | planned | src/api/handoff-generator.ts | unit        |
| handoff subcommand         | planned | src/cli/process-api.ts       | integration |

### What API Commands the Design Session Would Exercise

| Command                                                | Purpose in Session                       |
| ------------------------------------------------------ | ---------------------------------------- |
| `context DataAPIDesignSessionSupport --session design` | Assembles deps + metadata                |
| `dep-tree DataAPIDesignSessionSupport`                 | Dependency chain visualization           |
| `overview`                                             | Project-wide health check                |
| `stubs DataAPIDesignSessionSupport`                    | Check for existing stubs (none expected) |
| `arch neighborhood DataAPIContextAssembly`             | Understand parent pattern connections    |
| `list --status completed --names-only`                 | Verify completed dependencies            |
| `search SessionSupport`                                | Fuzzy pattern name matching              |

---

## 8. Other Candidate Specs (Deferred)

| Spec                                    | Phase | Effort | Deps Met? | Verdict                                                        |
| --------------------------------------- | ----- | ------ | --------- | -------------------------------------------------------------- |
| DataAPIRelationshipGraph                | 25c   | 2d     | Yes       | Runner-up. Graph queries, medium scope.                        |
| DataAPICLIErgonomics                    | 25d   | 2d     | None      | Caching/REPL is infra, less about validating API data quality. |
| DataAPIPlatformIntegration              | 25d   | 3d     | All       | Too large — MCP server + monorepo support.                     |
| ProcessStateAPICLI (V1)                 | 24    | 2d     | N/A       | Legacy, mostly completed/superseded.                           |
| ProcessStateAPIRelationshipQueries (V1) | 24    | 3d     | N/A       | Superseded by DataAPIRelationshipGraph.                        |

---

## 9. Path Forward

### CLAUDE.md Update (~1-2 hours)

Document all new subcommands with practical examples from this assessment.
Include the `dependsOn`/`enables` fields in `arch neighborhood` output documentation.
Note the behavior change: `arch context <name>` and `arch layer <name>` return
summarized patterns by default (consistent with `list` and `query`).

### Design Session for DataAPIDesignSessionSupport (~2-3 hours)

Run a real design session using the API. Produces stubs + decisions as real
forward-progress artifacts, while validating the "replace explore agents" claim end-to-end.

**Remaining estimated effort: ~3-5 hours.**

---

## Appendix: Command Quick Reference

All commands use the prefix: `pnpm process:query --`

### Status & Overview

```bash
# Project health at a glance (text, best token efficiency)
pnpm process:query -- overview

# Pattern counts and completion percentages (JSON)
pnpm process:query -- status
```

### Pattern Lookup

```bash
# Full detail for one pattern (~3KB structured JSON)
pnpm process:query -- pattern DataAPIOutputShaping

# Fuzzy search by name (prefix + substring matching)
pnpm process:query -- search Session
pnpm process:query -- search OutputShaping
```

### List & Filter

```bash
# List all patterns (summarized JSON)
pnpm process:query -- list

# Filter by status
pnpm process:query -- list --status completed
pnpm process:query -- list --status roadmap

# Filter by category, source, or phase
pnpm process:query -- list --category core
pnpm process:query -- list --source gherkin
pnpm process:query -- list --phase 25

# Output modifiers (composable with any filter)
pnpm process:query -- list --status completed --count           # → integer
pnpm process:query -- list --status completed --names-only      # → string[]
pnpm process:query -- list --status roadmap --fields name,status,phase  # → picked fields
```

### Context Assembly (Text Output)

```bash
# Design session context (metadata + deps)
pnpm process:query -- context DataAPIDesignSessionSupport --session design

# Implementation session context (deliverables + FSM state)
pnpm process:query -- context DataAPIDesignSessionSupport --session implement

# File reading list (spec + implementation files for deps)
pnpm process:query -- files DataAPIOutputShaping --related

# Dependency tree visualization
pnpm process:query -- dep-tree DataAPIDesignSessionSupport
pnpm process:query -- dep-tree DataAPIDesignSessionSupport --depth 3
```

### Architecture Queries (JSON)

```bash
# Dependency neighborhood: uses/usedBy/dependsOn/enables/sameContext
pnpm process:query -- arch neighborhood DataAPIContextAssembly

# Compare two bounded contexts (shared deps, integration points)
pnpm process:query -- arch compare scanner generator

# Annotation coverage analysis
pnpm process:query -- arch coverage

# Patterns by bounded context (supports --count, --names-only)
pnpm process:query -- arch context scanner
pnpm process:query -- arch context scanner --count

# Patterns by architecture layer
pnpm process:query -- arch layer domain

# All architecture roles with counts
pnpm process:query -- arch roles

# Dependency graph for a specific pattern
pnpm process:query -- arch graph ProcessStateAPI
```

### Stubs, Decisions & Tags

```bash
# List all stubs with resolution status
pnpm process:query -- stubs

# Stubs for a specific pattern
pnpm process:query -- stubs DataAPIStubIntegration

# Only unresolved stubs (missing target files)
pnpm process:query -- stubs --unresolved

# Design decisions from stub descriptions
pnpm process:query -- decisions DataAPIStubIntegration

# Tag usage report (counts per tag and value)
pnpm process:query -- tags

# Source file inventory grouped by type
pnpm process:query -- sources

# Unannotated TypeScript files
pnpm process:query -- unannotated
```

### Generic Query (Any ProcessStateAPI Method)

```bash
# Call any ProcessStateAPI method by name
pnpm process:query -- query getCurrentWork
pnpm process:query -- query getRoadmapItems
pnpm process:query -- query getPatternsByPhase 25
pnpm process:query -- query isValidTransition roadmap active
pnpm process:query -- query getPatternRelationships DataAPIOutputShaping
```
