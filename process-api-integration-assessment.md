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

| Command                      | Issue                                                        | Severity | Fix              |
| ---------------------------- | ------------------------------------------------------------ | -------- | ---------------- |
| `context --session design`   | Missing deliverables table (critical for design sessions)    | High     | Fix 3A (this PR) |
| `context --session design`   | Description truncated to first line (loses Problem/Solution) | High     | Fix 3B (this PR) |
| `context --session planning` | Same output as design — minimal differentiation              | Low      | Deferred         |
| `pdr`                        | Never resolves — PDR refs not wired to extraction pipeline   | Low      | Out of scope     |

---

## 3. Remaining Issues

### Priority Fixes (This PR)

| Issue                                                        | Location                                         | Severity | Effort |
| ------------------------------------------------------------ | ------------------------------------------------ | -------- | ------ |
| **3A:** Deliverables missing from `context --session design` | `src/api/context-assembler.ts` inclusion matrix  | **High** | Small  |
| **3B:** Description truncated to first line in context       | `src/api/summarize.ts` or `context-formatter.ts` | **High** | Small  |

**3A detail:** The session-type inclusion matrix shows deliverables only for `implement`.
During validation, the agent had to read the spec file separately to see the 4 deliverables.
The deliverables table defines stub targets — it's critical input for design sessions.
Fix: enable deliverables for `design` sessions in the inclusion matrix.

**3B detail:** The context output showed: "Starting a design or implementation session
requires manually compiling elaborate context prompts." — just the first sentence. The full
Problem/Solution block is the actual design input. Fix: extend description to include the
full block rather than truncating at first line.

### Enhancement (Next PR)

| Issue                                       | Location                       | Severity   | Effort |
| ------------------------------------------- | ------------------------------ | ---------- | ------ |
| **3C:** `pattern --full` with scenario text | Gherkin AST content extraction | **Medium** | Medium |

**3C detail:** The biggest file read during validation was the spec itself — specifically
Rule descriptions with validation checklists and acceptance criteria scenarios. A `--full`
flag that includes extracted scenario names and Rule descriptions (not full Gherkin syntax,
just structured content) would eliminate spec file reads during design sessions.

### Low Priority

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

## 5. Validation Baseline (2026-02-07)

First real-world validation during a design session for DataAPIDesignSessionSupport
(Phase 25c, 4 deliverables, 2 subcommands). Session used Opus 4.6, ran 10m 57s,
consumed 59% of context. Full details in `process-api-validation-learnings.md`.

### Key Metrics

| Metric                    | Value                                           |
| ------------------------- | ----------------------------------------------- |
| Explore agent elimination | **60%** (conservative baseline)                 |
| Token reduction           | **25-35%** (189K vs est. 250-300K pre-API)      |
| Context headroom          | **41% remaining** (vs ~20% in pre-API sessions) |
| Explore agents launched   | 1 (vs 5-7 pre-API)                              |
| Session duration          | 10m 57s                                         |
| Files created             | 3 (1 decision spec, 2 code stubs)               |
| Design decisions          | 7 (DD-1 through DD-7)                           |
| Monorepo prediction       | 75-80% elimination after 3A fix                 |

### API Command Value Ratings (Measured In-Session)

| Command                    | Value      | What It Replaced                                     |
| -------------------------- | ---------- | ---------------------------------------------------- |
| `context --session design` | **High**   | 2 explore agents for metadata + dependency status    |
| `stubs <pattern>`          | **High**   | glob+grep for stub existence check (instant vs ~30s) |
| `dep-tree`                 | **Medium** | Manual dependency chain verification                 |
| `status`                   | **Medium** | Pattern count confirmation after stub creation       |
| `overview`                 | **Low**    | Project health context (nice but not essential)      |
| `search`                   | **Low**    | Confirmed pattern visibility in pipeline             |

### Navigation vs. Comprehension Split

The API answers **graph queries** (what exists, what depends on what, what's blocking).
File reads answer **content queries** (how is this implemented, what patterns does it follow).

| File Read During Validation    | Why (all comprehension)                   |
| ------------------------------ | ----------------------------------------- |
| Spec file (full scenario text) | Design decisions need acceptance criteria |
| context-assembler.ts           | Understanding type/interface patterns     |
| context-formatter.ts           | `=== MARKERS ===` formatting conventions  |
| Existing ADR/PDR format        | Template for decision spec structure      |

**This boundary is correct and should not be crossed.** Merging navigation and
comprehension would bloat the API without improving session quality.

**Scale prediction:** In the monorepo, the navigation problem grows quadratically
(cross-package deps, shared contexts, multi-package stubs) while comprehension
stays linear (one file at a time). The API's value increases disproportionately
with codebase size.

### Design Quality Improvement

API-assisted sessions produced noticeably better decisions:

| Aspect                    | Prior Sessions                         | API-Assisted Session                               |
| ------------------------- | -------------------------------------- | -------------------------------------------------- |
| Pure function discipline  | Mixed — some shell deps in core logic  | Strict — git integration opt-in, core logic pure   |
| Cross-cutting consistency | Ad-hoc severity levels                 | Mapped to Process Guard's existing BLOCKED/WARN    |
| Code duplication          | Significant across 4 implemented specs | Identified — reuse of existing building blocks     |
| Composability             | Monolithic validators                  | Individual check functions, independently testable |

**Hypothesis:** Better navigation → better architectural awareness → better design.

---

## 6. Annotation Model Analysis

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

## 7. Remaining Work

| Item                                               | Effort     | Priority | Status                   |
| -------------------------------------------------- | ---------- | -------- | ------------------------ |
| Fix 3A: deliverables in `context --session design` | Small      | **P0**   | Pending                  |
| Fix 3B: full Problem/Solution in context output    | Small      | **P0**   | Pending (bundle with 3A) |
| CLAUDE.md update with 16 new subcommands           | ~1-2 hours | P1       | Pending                  |
| DataAPIDesignSessionSupport implementation         | ~1 day     | P1       | Design done, stubs exist |
| Update dist                                        | 10 min     | P1       | Pending                  |
| Validation: design session using updated API       | ~30 min    | P1       | Pending                  |
| Design session for DataAPIDesignSessionSupport     | ~2-3 hours | —        | **DONE** (2026-02-07)    |

---

## 8. Next Spec: DataAPIDesignSessionSupport

### Design Session Status: COMPLETED (2026-02-07)

The design session was the first real API-validated session. It was self-referential:
designed the session support tools while using the API to gather context. The session
produced the validation baseline (60% explore agent elimination) documented in §5.

### Artifacts Created

| File                                                                      | Purpose                                |
| ------------------------------------------------------------------------- | -------------------------------------- |
| `delivery-process/decisions/pdr-002-session-workflow-commands.feature`    | 7 design decisions (DD-1 through DD-7) |
| `delivery-process/stubs/DataAPIDesignSessionSupport/scope-validator.ts`   | Types + 8 function signatures          |
| `delivery-process/stubs/DataAPIDesignSessionSupport/handoff-generator.ts` | Types + 2 function signatures          |

### Design Decisions Summary (DD-1 through DD-7)

| DD   | Decision                                                                     |
| ---- | ---------------------------------------------------------------------------- |
| DD-1 | Text output with `=== MARKERS ===` (per ADR-008)                             |
| DD-2 | Git integration opt-in via `--git` flag (keeps core pure)                    |
| DD-3 | Session type inferred from FSM status (`active`→implement, `roadmap`→design) |
| DD-4 | BLOCKED for hard prerequisites, WARN for recommendations                     |
| DD-5 | Current date only for handoff (no `--date` flag)                             |
| DD-6 | Both positional and flag forms for `--type`                                  |
| DD-7 | Co-located formatter functions (builder + formatter in same file)            |

### Deliverables — Ready for Implementation

| Deliverable                | Status  | Location                     | Stub Exists | Tests       |
| -------------------------- | ------- | ---------------------------- | ----------- | ----------- |
| Scope validation logic     | planned | src/api/scope-validator.ts   | Yes         | unit        |
| scope-validate subcommand  | planned | src/cli/process-api.ts       | —           | integration |
| Handoff document generator | planned | src/api/handoff-generator.ts | Yes         | unit        |
| handoff subcommand         | planned | src/cli/process-api.ts       | —           | integration |

### Reusable Building Blocks (DO NOT reimplement)

| Function                  | File                           | Used By                                  |
| ------------------------- | ------------------------------ | ---------------------------------------- |
| `findStubPatterns()`      | `src/api/stub-resolver.ts`     | scope-validate (stubs-from-deps check)   |
| `resolveStubs()`          | `src/api/stub-resolver.ts`     | scope-validate (target exists check)     |
| `extractDecisionItems()`  | `src/api/stub-resolver.ts`     | scope-validate (PDR ref check)           |
| `isDeliverableComplete()` | `src/api/context-formatter.ts` | handoff (completed vs in-progress split) |
| `requirePattern()`        | `src/api/context-assembler.ts` | both (pattern lookup with error)         |
| `resolveFsm()`            | `src/api/context-assembler.ts` | scope-validate (FSM check)               |

**Next step:** Implementation session (roadmap → active → completed).

---

## 9. Other Candidate Specs (Deferred)

| Spec                                    | Phase | Effort | Deps Met? | Verdict                                                                                                                                                                                                                    |
| --------------------------------------- | ----- | ------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DataAPIRelationshipGraph                | 25c   | 2d     | Yes       | Runner-up. Graph queries, medium scope.                                                                                                                                                                                    |
| DataAPICLIErgonomics                    | 25d   | 2d     | None      | **Deprioritized per validation.** Agent observed: "Response times (~5s) were fine. Bottleneck is information completeness per command, not speed." Improving output quality (3A, 3B, 3C) has higher ROI than caching/REPL. |
| DataAPIPlatformIntegration              | 25d   | 3d     | All       | Too large — MCP server + monorepo support.                                                                                                                                                                                 |
| ProcessStateAPICLI (V1)                 | 24    | 2d     | N/A       | Legacy, mostly completed/superseded.                                                                                                                                                                                       |
| ProcessStateAPIRelationshipQueries (V1) | 24    | 3d     | N/A       | Superseded by DataAPIRelationshipGraph.                                                                                                                                                                                    |

---

## 10. Path Forward

### Step 1: Fix 3A + 3B (Small, do first)

Enable deliverables for `design` sessions in the context-assembler inclusion matrix.
Extend description to include full Problem/Solution block in context output.
These are the highest-ROI fixes — they address the top two gaps identified during validation.

### Step 2: CLAUDE.md Update (~1-2 hours)

Document all 16 new subcommands with practical examples from this assessment.
Include `dependsOn`/`enables` fields in `arch neighborhood` output documentation.
Add the Process API CLI section with session workflows table.

### Step 3: Implement DataAPIDesignSessionSupport (~1 day)

Design session completed (2026-02-07). Stubs exist with types and function signatures.
PDR-002 captures 7 design decisions. Implementation is straightforward:

1. Implement `scope-validator.ts` (6 check functions + main + formatter)
2. Add `scope-validate` case to CLI router + help text
3. Implement `handoff-generator.ts` (section assembly + formatter)
4. Add `handoff` case to CLI router + help text
5. Write Gherkin tests matching the 4 scenarios in the spec

### Step 4: Update dist + Final Validation

Commit, update dist. Run a validation design session against another roadmap spec
(e.g., DataAPIRelationshipGraph) to exercise the 3A/3B fixes and new session support.

### Step 5: Monorepo Integration

| Task                                                                | Effort     |
| ------------------------------------------------------------------- | ---------- |
| Bump `delivery-process` package version in monorepo                 | 10 min     |
| Update monorepo's DESIGN-SESSION-GUIDE.md with Process API commands | 30 min     |
| Run DS-3 (LLM Integration) as first monorepo validation             | ~1 session |

**Monorepo commands to validate first:**

| Command                    | Why It Matters at Scale                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `arch compare`             | Cross-BC comparison across packages — impossible with explore agents |
| `arch coverage`            | Annotation gaps across 6 packages — hopeless manually                |
| `dep-tree`                 | Cross-package dependency chains                                      |
| `arch neighborhood`        | Cross-package relationships                                          |
| `context --session design` | Multi-package session context assembly                               |

**Remaining estimated effort: ~2-3 days** (3A/3B fixes + CLAUDE.md + implementation + validation).

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
