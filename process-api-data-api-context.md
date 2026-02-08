# Process API Data API — Consolidated Session Context

> **Purpose:** PR scope tracker and session context for the Data API feature.
> Tracks what's completed, what remains, and provides session checklists and templates.
>
> **Branch:** `feature/process-api-cli`
> **Created:** 2026-02-07 | **Updated:** 2026-02-08 (post-validation consolidation)

---

## 1. What We're Building

**Delivery Process Data API for Claude Code & AI Agents** — transforming the
process-api CLI from a raw JSON dumper into a context assembler that answers
"what should I read next?" rather than "what data exists?"

### The Problem

Claude Code sessions for design/architecture work require assembling 30-100KB of
curated, multi-source context from hundreds of annotated files. The V1 CLI
(`process-api.ts`, 529 lines) outputs raw `ExtractedPattern` JSON that is too
large (~594KB for list queries) and lacks the assembled, session-oriented context
that AI agents need.

### The Solution

A multi-tier API improvement:

- **Tier 1 (MVP):** Output shaping (594KB → 4KB) + stub integration — **DONE**
- **Tier 2 (MVP):** Context assembly (one-command session start) + architecture queries — **DONE**
- **Tier 3 (This PR):** Session support (handoff, scope-validate) + validation fixes (3A, 3B)
- **Tier 4 (Future):** Relationship graph, CLI ergonomics (caching, REPL), platform integration (MCP)

### Key Architectural Insight

The pipeline already builds `MasterDataset` with `archIndex`, `relationshipIndex`,
`byPhase`, `byStatus`, `byCategory`, `bySource`, and `byQuarter`. All data exists.
The gaps are:

1. **Output shaping** — raw `ExtractedPattern` is too large; need projections
2. **Assembly** — no command combines data from multiple indexes around a focal pattern
3. **File path resolution** — `uses`/`usedBy` references are names, not paths
4. **Stub awareness** — stubs live outside the main annotation system
5. **Session awareness** — no concept of session type in the data model

---

## 2. What Already Exists (V1 Foundation)

### CLI (`src/cli/process-api.ts` — 1216 lines, active)

| Subcommand                          | What it does                               |
| ----------------------------------- | ------------------------------------------ |
| `status`                            | Delivery status counts + completion %      |
| `query <method> [args]`             | Any ProcessStateAPI method by name         |
| `pattern <name>`                    | Full pattern detail (raw ExtractedPattern) |
| `arch roles\|context\|layer\|graph` | Architecture queries                       |

**V1 Specs (Phase 24, active with unlock):**

- `ProcessStateAPICLI` — 6 deliverables (4 completed, 1 deferred: text formatter, superseded by Data API)
- `ProcessStateAPIRelationshipQueries` — 4 deliverables (1 completed, 3 superseded by DataAPIRelationshipGraph)

### Infrastructure (Updated Post-MVP)

| Component          | Location                       | Status                                                      |
| ------------------ | ------------------------------ | ----------------------------------------------------------- |
| ProcessStateAPI    | `src/api/process-state.ts`     | 27 methods, production                                      |
| QueryResult types  | `src/api/types.ts`             | Wired into CLI via output pipeline                          |
| PatternSummarizer  | `src/api/summarize.ts`         | 594KB → 100 bytes per pattern projection                    |
| FuzzyMatcher       | `src/api/fuzzy-match.ts`       | Tiered scoring: exact > prefix > substring > Levenshtein    |
| ContextAssembler   | `src/api/context-assembler.ts` | Session-oriented context bundles from 5 MasterDataset views |
| ContextFormatter   | `src/api/context-formatter.ts` | Plain text renderer (`=== SECTION ===` markers, ADR-008)    |
| StubResolver       | `src/api/stub-resolver.ts`     | Stub discovery, resolution, AD-N decision extraction        |
| ArchQueries        | `src/api/arch-queries.ts`      | Neighborhood, compare, tag usage, source inventory          |
| CoverageAnalyzer   | `src/api/coverage-analyzer.ts` | Annotation coverage analysis, unannotated file detection    |
| PatternHelpers     | `src/api/pattern-helpers.ts`   | Shared lookups: case-insensitive find, suggestions          |
| OutputPipeline     | `src/cli/output-pipeline.ts`   | `--names-only`, `--count`, `--fields`, `--format`           |
| MasterDataset      | `src/generators/pipeline/`     | Full pre-computed views                                     |
| Tag registry       | `src/taxonomy/`                | Extended with `@libar-docs-target` and `@libar-docs-since`  |
| Relationship index | In MasterDataset               | `uses`, `usedBy`, `dependsOn`, `enables`, `implements`      |
| Architecture index | In MasterDataset               | `byContext`, `byLayer`, `byRole`                            |
| CLI arg parsing    | `src/cli/process-api.ts`       | Manual for-loop + switch, 16+ subcommands                   |
| Stub scan paths    | `package.json` (15 scripts)    | `-i 'delivery-process/stubs/**/*.ts'` configured            |

### Stub Annotation Status

All stubs in `delivery-process/stubs/` are fully structured:

- `@libar-docs` opt-in + `@libar-docs-implements` added to all stubs
- `@libar-docs-target` and `@libar-docs-since` registered as taxonomy tags (DataAPIStubIntegration, completed)
- `@target`/`@see`/`@since` converted to plain text (`Target:`, `See:`, `Since:`)
- Stubs are scannable by the pipeline, visible via `stubs` and `decisions` subcommands

---

## 3. Data API Spec Inventory (8 Specs)

### Dependency Graph (with Status)

```
                     ┌── DataAPIOutputShaping (25a) ─────── [DONE] 8/8
ProcessStateAPI ─────┤
(V1, exists)         └── DataAPIContextAssembly (25b) ───── [DONE] 7/7
                              │
                              └── DataAPIDesignSessionSupport (25c) ── [DESIGNED]
                                    │
DataAPIStubIntegration (25a) ──────┘ ─────────────────────── [DONE] 7/7

DataAPIArchitectureQueries (25b) ────────────────────────── [DONE] 6/6

DataAPIRelationshipGraph (25c) ──────────────────────────── [ROADMAP]
DataAPICLIErgonomics (25d) ──────────────────────────────── [DEPRIORITIZED]
DataAPIPlatformIntegration (25d) ────────────────────────── [FUTURE]
```

**Key design decision:** OutputShaping and ContextAssembly are parallel consumers
of MasterDataset, NOT sequential. The artificial dependency was removed during
review. Context assembly builds its own text format via `context-formatter.ts`,
while output shaping transforms pattern lists.

### Spec Detail Summary

| Spec                            | Phase | Status                         | Deliverables | Key Subcommands                                                                            |
| ------------------------------- | ----- | ------------------------------ | ------------ | ------------------------------------------------------------------------------------------ |
| **DataAPIOutputShaping**        | 25a   | **completed** (8/8 done)       | 8            | `list`, `search`, `--names-only`, `--count`, `--fields`                                    |
| **DataAPIStubIntegration**      | 25a   | **completed** (7/7 done)       | 7            | `stubs`, `decisions`, `pdr`                                                                |
| **DataAPIContextAssembly**      | 25b   | **completed** (7/7 done)       | 7            | `context`, `files`, `dep-tree`, `overview`                                                 |
| **DataAPIArchitectureQueries**  | 25b   | **completed** (6/6 done)       | 6            | `arch neighborhood`, `arch compare`, `arch coverage`, `tags`, `sources`, `unannotated`     |
| **DataAPIDesignSessionSupport** | 25c   | **designed** (stubs + PDR-002) | 4            | `scope-validate`, `handoff`                                                                |
| **DataAPIRelationshipGraph**    | 25c   | roadmap                        | 6            | `graph`, `graph impact`, `graph path`, `graph dangling`, `graph orphans`, `graph blocking` |
| **DataAPICLIErgonomics**        | 25d   | deprioritized                  | 6            | `repl`, `--dry-run`, per-subcommand `--help`                                               |
| **DataAPIPlatformIntegration**  | 25d   | future                         | 8            | MCP server, `generate-context-layer`, `cross-package`, `watch`                             |

---

## 4. PR Scope

### Completed (Tier 1+2 MVP — 28 deliverables, 16 subcommands, 4 code reviews)

| Spec                       | Deliverables | Impact                                                                       |
| -------------------------- | ------------ | ---------------------------------------------------------------------------- |
| DataAPIOutputShaping       | 8/8 done     | 594KB → 4KB, `summarizePattern()`, `--names-only`, `--count`, fuzzy matching |
| DataAPIStubIntegration     | 7/7 done     | Taxonomy tags (`target`, `since`), `stubs`, `decisions` subcommands          |
| DataAPIContextAssembly     | 7/7 done     | `context --session`, `dep-tree`, `overview` — core value prop                |
| DataAPIArchitectureQueries | 6/6 done     | `arch neighborhood`, `arch coverage`, `tags`, `sources`, `unannotated`       |

**Validated:** First real design session using API achieved 60% explore agent elimination,
25-35% token reduction. See `process-api-validation-learnings.md` for full metrics.

### Remaining This PR

| Item                                               | Effort   | Priority | Status                   |
| -------------------------------------------------- | -------- | -------- | ------------------------ |
| Fix 3A: deliverables in `context --session design` | Small    | P0       | Pending                  |
| Fix 3B: full Problem/Solution in context output    | Small    | P0       | Pending                  |
| CLAUDE.md update with 16 new subcommands           | ~1-2 hrs | P1       | Pending                  |
| DataAPIDesignSessionSupport implementation         | ~1 day   | P1       | Design done, stubs exist |
| Update dist                                        | 10 min   | P1       | Pending                  |
| Validation: design session using updated API       | ~30 min  | P1       | Pending                  |

**Fix 3A detail:** `context --session design` omits the deliverables table. The session-type
inclusion matrix in `context-assembler.ts` shows deliverables only for `implement`. During
validation, the agent had to read the spec file separately to see deliverables — the table
defines stub targets and is critical input for design sessions.

**Fix 3B detail:** `context --session design` truncates description to the first line. The
full Problem/Solution block is the actual design input. Extending to include the full
description (or first paragraph) makes design context self-contained.

### Deferred

| Spec                       | Why Deferred                                                                                                            | When               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------ |
| DataAPIRelationshipGraph   | Medium priority, not blocking sessions. Good next-PR candidate.                                                         | Next PR            |
| DataAPICLIErgonomics       | Deprioritized per validation: response times fine (~5s), information completeness per command has higher ROI than speed | Future             |
| DataAPIPlatformIntegration | MCP server + monorepo cross-package queries. Large scope (3d, 8 deliverables). Needs real monorepo validation first.    | Post-monorepo bump |
| 3C: `pattern --full`       | Scenario text extraction from Gherkin AST. Medium effort, high ROI.                                                     | Next PR            |

### Success Criteria

| Criterion                                                           | Status  |
| ------------------------------------------------------------------- | ------- |
| `list --status active` returns compact summaries (not 594KB JSON)   | **MET** |
| `context <pattern> --session design` returns curated context bundle | **MET** |
| `stubs <pattern>` returns stub files with target paths              | **MET** |
| `arch coverage` reports annotation completeness                     | **MET** |
| All existing tests pass                                             | **MET** |
| CLAUDE.md updated with new subcommand documentation                 | Pending |
| `pnpm process:query -- <subcommand>` works for all new subcommands  | **MET** |
| 3A+3B fixes validated (design context includes deliverables + desc) | Pending |
| DataAPIDesignSessionSupport `scope-validate` + `handoff` working    | Pending |

### Monorepo Pre-Bump Checklist

- [ ] Fix 3A: Include deliverables in `--session design` context
- [ ] Fix 3B: Extend description to full Problem/Solution block
- [ ] Update CLAUDE.md with new subcommand documentation
- [ ] Implement DataAPIDesignSessionSupport (4 deliverables)
- [ ] Commit and update dist
- [ ] Bump package version in monorepo
- [ ] Update monorepo's DESIGN-SESSION-GUIDE.md with Process API commands
- [ ] Run DS-3 as first monorepo validation

---

## 5. Design Session Results

### MVP Design Sessions (DS-A through DS-D — Implicit)

The 4 MVP specs (OutputShaping, StubIntegration, ContextAssembly, ArchitectureQueries)
proceeded directly from plan-level specs to implementation without explicit design sessions.
Design decisions were made during implementation and captured in ADR-007 (QueryResult envelope
at CLI layer) and ADR-008 (text output path for context commands).

### DS-E: DataAPIDesignSessionSupport (Explicit — 2026-02-07)

The first real API-validated design session. Self-referential: designed the session support
tools (`scope-validate`, `handoff`) while using the API to gather context.

**Artifacts created:**

| File                                                                      | Purpose                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `delivery-process/decisions/pdr-002-session-workflow-commands.feature`    | 7 design decisions (DD-1 through DD-7)                         |
| `delivery-process/stubs/DataAPIDesignSessionSupport/scope-validator.ts`   | Types + 8 function signatures for composable pre-flight checks |
| `delivery-process/stubs/DataAPIDesignSessionSupport/handoff-generator.ts` | Types + 2 function signatures for session handoff generation   |

**Key design decisions (DD-1 through DD-7):**

| DD   | Decision                                                 | Rationale                                                 |
| ---- | -------------------------------------------------------- | --------------------------------------------------------- |
| DD-1 | Text output with `=== MARKERS ===`                       | AI-consumption focused, per ADR-008                       |
| DD-2 | Git integration opt-in via `--git` flag                  | Keeps core logic pure and testable                        |
| DD-3 | Session type inferred from FSM status                    | `active`→implement, `roadmap`→design, `completed`→review  |
| DD-4 | BLOCKED for hard prerequisites, WARN for recommendations | Matches Process Guard severity model                      |
| DD-5 | Current date only for handoff                            | Backdating is a rare edge case                            |
| DD-6 | Both positional and flag forms for `--type`              | CLI ergonomics, consistent with existing patterns         |
| DD-7 | Co-located formatter functions                           | Simpler than assembler/formatter split for these commands |

**Validation baseline:** 60% explore agent elimination, 25-35% token reduction, 41%
context headroom remaining. See `process-api-validation-learnings.md` for full metrics
and `process-api-integration-assessment.md` §5 for the consolidated validation baseline.

---

## 6. Implementation Status

### Completed Specs (28/32 deliverables)

| Spec                       | FSM Journey                  | Deliverables | Code Reviews |
| -------------------------- | ---------------------------- | ------------ | ------------ |
| DataAPIOutputShaping       | roadmap → active → completed | 8/8          | 4 rounds     |
| DataAPIStubIntegration     | roadmap → active → completed | 7/7          | 4 rounds     |
| DataAPIContextAssembly     | roadmap → active → completed | 7/7          | 4 rounds     |
| DataAPIArchitectureQueries | roadmap → active → completed | 6/6          | 4 rounds     |

### Next: DataAPIDesignSessionSupport (4 deliverables)

Design session completed (2026-02-07). Stubs and PDR-002 decision spec created.
Ready for implementation session: `roadmap → active → completed`.

| Deliverable                | Location                     | Stub Exists |
| -------------------------- | ---------------------------- | ----------- |
| Scope validation logic     | src/api/scope-validator.ts   | Yes         |
| scope-validate subcommand  | src/cli/process-api.ts       | —           |
| Handoff document generator | src/api/handoff-generator.ts | Yes         |
| handoff subcommand         | src/cli/process-api.ts       | —           |

---

## 7. Monorepo Integration Context

### Relationship Between Repos

| Repo                                          | Role              | What it contributes            |
| --------------------------------------------- | ----------------- | ------------------------------ |
| `delivery-process` (this repo)                | Package publisher | CLI code, API code, pipeline   |
| `~/dev-projects/new-convex-es/libar-platform` | Consumer monorepo | Stubs, specs, real-world usage |

### What the Monorepo Needs

The monorepo has complex design sessions (DS-1 through DS-7) that require:

1. `context <pattern> --session design` to replace manual context compilation
2. `stubs <pattern>` to find dependency stubs from prior sessions
3. `dep-tree <pattern>` to understand blocking chains
4. `overview` for session planning

### Integration Path

1. **This PR:** Build and test all MVP capabilities in this package
2. **Next step:** Publish pre-release (`0.1.0-pre.X`)
3. **Monorepo PR:** Update dependency, configure new subcommands, validate with
   DS-3 through DS-7 session setup

### What's Already Done in the Monorepo

- All 23 stubs restructured with `@libar-docs-*` tags
- Scan paths configured (`-i 'delivery-process/stubs/**/*.ts'`) in 15 scripts
- Convention docs updated (CLAUDE.md, agent prompts, PDR-009 amendment)
- Spec review completed (`docs/sessions/process-api-spec-review.md`)

---

## 8. Key Design Decisions Already Made

These decisions were made during ideation and planning. Design sessions should
build on them, not revisit them.

| Decision                                              | Rationale                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context assembler uses dedicated text renderer**    | Context output is flat section-oriented text, not progressive-disclosure markdown. `context-formatter.ts` does NOT go through RenderableDocument. |
| **OutputShaping and ContextAssembly are parallel**    | Both consume MasterDataset independently. Context builds its own format.                                                                          |
| **Stubs use Approach A+B hybrid**                     | Phase A (annotation) done. Phase B (taxonomy tags) in this PR. Approach C (separate scanner) deferred.                                            |
| **`session-context` merged into `context --session`** | One unified context command with session type flag, not two overlapping commands.                                                                 |
| **`scope-validate` in SessionSupport**                | Readiness checks are session workflow, not context assembly. Keeps command surface clean.                                                         |
| **Config file reuses `delivery-process.config.ts`**   | Already exists, already loaded by pipeline. Add default paths.                                                                                    |
| **Manual arg parsing continues**                      | Consistent with existing CLI pattern (for-loop + switch, no commander.js).                                                                        |
| **QueryResult envelope for all output**               | Types exist in `src/api/types.ts`. Wire into CLI output layer.                                                                                    |
| **Session support: co-located formatters (DD-7)**     | `scope-validator.ts` and `handoff-generator.ts` each export both builder + formatter. See PDR-002 for DD-1 through DD-7.                          |

---

## 9. PR Description Context

### PR Title

`feat: Process API Data API — output shaping, context assembly, architecture queries, stub integration, and session support`

### PR Summary Points

1. **Output Shaping** — `summarizePattern()` reduces list output from 594KB to 4KB.
   Global modifiers (`--names-only`, `--count`, `--fields`) work with any list query.
   `list` subcommand with composable filters replaces multiple API method calls.
   `search` with fuzzy matching eliminates retry loops.

2. **Context Assembly** — `context <pattern> --session design|implement|planning`
   assembles curated context bundles (~1.5KB) replacing manual 30-100KB context
   compilation. `dep-tree` visualizes dependency chains. `overview` gives project health.

3. **Stub Integration** — `@libar-docs-target` and `@libar-docs-since` taxonomy tags
   make stub metadata structured and queryable. `stubs` subcommand lists design stubs
   with implementation status. `decisions` and `pdr` surface design rationale.

4. **Architecture Queries** — `arch neighborhood` shows 1-hop connections.
   `arch coverage` reports annotation completeness (85%, 112/138 files). `tags` and
   `sources` provide taxonomy and inventory discovery. `unannotated` finds gaps.

5. **Session Support** — `scope-validate` runs pre-flight checks (dependency status,
   FSM readiness, deliverables defined). `handoff` generates session state summaries
   for multi-session work. Composable check functions, individually testable.

### Validated Impact

- **60% explore agent elimination** on first real design session use
- **25-35% token reduction** (189K vs estimated 250-300K pre-API)
- **41% context headroom remaining** (vs ~20% in pre-API sessions)
- Explore agents dropped from 5-7 → 1 (comprehension-only)
- Better design quality: API-assisted sessions produced stricter pure-function
  discipline, cross-cutting consistency, and composable architecture

### What This Enables

- Claude Code sessions start with one command instead of 5-10 explore agents
- AI agents get compact, targeted output instead of 594KB JSON dumps
- Design session context (spec + stubs + deps + architecture) assembled automatically
- Architecture coverage gaps are discoverable and trackable
- Pre-flight session checks prevent wasted effort on unready patterns

---

## 10. Testing Strategy

### Gherkin-Only Policy

All new tests must be `.feature` files with step definitions. No `.test.ts` files.

### Test Locations

| Spec                       | Feature Files                              | Step Definitions |
| -------------------------- | ------------------------------------------ | ---------------- |
| DataAPIOutputShaping       | `tests/features/api/output-shaping/`       | `tests/steps/`   |
| DataAPIStubIntegration     | `tests/features/api/stub-integration/`     | `tests/steps/`   |
| DataAPIContextAssembly     | `tests/features/api/context-assembly/`     | `tests/steps/`   |
| DataAPIArchitectureQueries | `tests/features/api/architecture-queries/` | `tests/steps/`   |

### Key Testing Patterns

- Use `createTestPattern()` and `createTestMasterDataset()` from `tests/fixtures/`
- Set `filePath: '...feature'` for Gherkin-sourced patterns (source categorization uses extension)
- Debug codec output with `npx tsx` standalone scripts before writing step defs
- ScenarioOutline uses `variables` object, NOT `{string}` params

---

## 11. Files to Read Before Starting

### For Any Design/Implementation Session

| Priority | File                                       | Why                                           |
| -------- | ------------------------------------------ | --------------------------------------------- |
| Must     | The spec being worked on                   | Requirements and acceptance criteria          |
| Must     | `src/cli/process-api.ts`                   | CLI structure, arg parsing, subcommand router |
| Must     | `src/api/process-state.ts`                 | ProcessStateAPI 27 methods                    |
| Must     | `src/api/types.ts`                         | QueryResult types, existing type definitions  |
| Should   | `src/api/context-assembler.ts`             | Session-oriented context bundle builder       |
| Should   | `src/api/context-formatter.ts`             | Text formatter with `=== SECTION ===` markers |
| Should   | `src/api/stub-resolver.ts`                 | Stub discovery, AD-N extraction, PDR refs     |
| Should   | `src/cli/output-pipeline.ts`               | Output modifiers and formatting               |
| Should   | `src/validation-schemas/master-dataset.ts` | MasterDataset schema                          |

### For DataAPIDesignSessionSupport Implementation

| File                                                                      | Why                                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `delivery-process/specs/data-api-session-support.feature`                 | Spec with 4 deliverables, 4 scenarios                |
| `delivery-process/stubs/DataAPIDesignSessionSupport/scope-validator.ts`   | Types + function signatures from design              |
| `delivery-process/stubs/DataAPIDesignSessionSupport/handoff-generator.ts` | Types + function signatures from design              |
| `delivery-process/decisions/pdr-002-session-workflow-commands.feature`    | 7 design decisions (DD-1 through DD-7)               |
| `src/api/context-assembler.ts`                                            | Reusable helpers: `requirePattern()`, `resolveFsm()` |
| `src/api/context-formatter.ts`                                            | `=== MARKERS ===` formatting conventions             |
| `src/validation/dod-validator.ts`                                         | `isDeliverableComplete()` for handoff logic          |

---

## 12. Session Checklist Templates

### Design Session Start

- [ ] Run API commands FIRST for context gathering, BEFORE launching explore agents:
  ```bash
  pnpm process:query -- context <SpecName> --session design
  pnpm process:query -- dep-tree <SpecName>
  pnpm process:query -- overview
  pnpm process:query -- stubs <SpecName>
  pnpm process:query -- arch neighborhood <DependencyPattern>
  pnpm process:query -- list --status completed --names-only
  ```
- [ ] Only use explore agents for comprehension questions (implementation patterns,
      formatting conventions, type definitions) that the API doesn't cover
- [ ] Read the target spec file (for scenario text and acceptance criteria)
- [ ] Create stubs in `delivery-process/stubs/{spec-name}/`
- [ ] Document decisions as PDR features if architecturally significant
- [ ] Do NOT transition spec status or write implementation code
- [ ] At session end, note an effectiveness log: which API commands used, where
      explore agents were still needed, any missing information in command output

### Implementation Session Start

- [ ] Run API commands for context:
  ```bash
  pnpm process:query -- context <SpecName> --session implement
  pnpm process:query -- dep-tree <SpecName>
  pnpm process:query -- stubs <SpecName>
  ```
- [ ] Read design session stubs (if created)
- [ ] Transition spec to `@libar-docs-status:active` BEFORE writing code
- [ ] For each deliverable: implement, test, update status
- [ ] Transition to `@libar-docs-status:completed` only when ALL done
- [ ] Run `pnpm docs:all` to regenerate
- [ ] Run `pnpm lint && pnpm test` to verify

### Validated Design Session Prompt Template

```markdown
## Design Session: <SpecName>

Design session for the next spec: **<SpecName>** (Phase X, N deliverables,
M subcommands: `cmd1`, `cmd2`).

Dependencies are done: <DepA> + <DepB> both completed.

### Session rules

- This is a design session — no implementation code, no FSM transitions.
- Record decisions as `.feature` files in `delivery-process/decisions/`.
- Code stubs go in `delivery-process/stubs/<SpecName>/`.
- Make breaking changes freely — nothing is released.

### Process API commands

Run these FIRST for context gathering, BEFORE launching explore agents:

    pnpm process:query -- context <SpecName> --session design
    pnpm process:query -- dep-tree <SpecName>
    pnpm process:query -- overview
    pnpm process:query -- stubs <SpecName>
    pnpm process:query -- arch neighborhood <DependencyPattern>
    pnpm process:query -- list --status completed --names-only

Only use explore agents for comprehension questions (implementation patterns,
formatting conventions, type definitions) that the API doesn't cover.

### Effectiveness log

At session end, note:

1. Which API commands you used and what they provided
2. Where you still needed explore agents or file reads
3. Any missing information in command output

### Key context

@process-api-integration-assessment.md
@docs/INDEX.md
@docs/METHODOLOGY.md
@docs/SESSION-GUIDES.md
```
