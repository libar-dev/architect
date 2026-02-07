# Process API Data API — Consolidated Session Context

> **Purpose:** Self-contained context for sequencing design sessions, executing
> implementation sessions, and creating the PR description for the Data API feature.
>
> **Branch:** `feature/process-api-cli`
> **Base commit:** `324c5e7` (plan-level specs complete)
> **Created:** 2026-02-07

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

- **Tier 1 (MVP):** Output shaping (594KB → 4KB) + stub integration
- **Tier 2 (MVP):** Context assembly (one-command session start) + architecture queries
- **Tier 3 (Next PR):** Session support (handoff, scope-validate) + relationship graph
- **Tier 4 (Future):** CLI ergonomics (caching, REPL) + platform integration (MCP)

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

### V1 CLI (`src/cli/process-api.ts` — 529 lines, active)

| Subcommand                          | What it does                               |
| ----------------------------------- | ------------------------------------------ |
| `status`                            | Delivery status counts + completion %      |
| `query <method> [args]`             | Any ProcessStateAPI method by name         |
| `pattern <name>`                    | Full pattern detail (raw ExtractedPattern) |
| `arch roles\|context\|layer\|graph` | Architecture queries                       |

**V1 Specs (Phase 24, active with unlock):**

- `ProcessStateAPICLI` — 6 deliverables (4 completed, 1 deferred: text formatter)
- `ProcessStateAPIRelationshipQueries` — 4 deliverables (1 completed, 3 superseded)

### Existing Infrastructure

| Component          | Location                    | Status                                                 |
| ------------------ | --------------------------- | ------------------------------------------------------ |
| ProcessStateAPI    | `src/api/process-state.ts`  | 27 methods, production                                 |
| QueryResult types  | `src/api/types.ts`          | Defined but NOT wired into CLI                         |
| MasterDataset      | `src/generators/pipeline/`  | Full pre-computed views                                |
| Tag registry       | `src/taxonomy/`             | Extensible, supports new tags                          |
| Relationship index | In MasterDataset            | `uses`, `usedBy`, `dependsOn`, `enables`, `implements` |
| Architecture index | In MasterDataset            | `byContext`, `byLayer`, `byRole`                       |
| CLI arg parsing    | `src/cli/process-api.ts`    | Manual for-loop + switch pattern                       |
| Stub scan paths    | `package.json` (15 scripts) | `-i 'delivery-process/stubs/**/*.ts'` configured       |

### Stub Annotation Status

All 23 stubs in `delivery-process/stubs/` have been restructured:

- `@libar-docs` opt-in + `@libar-docs-implements` added to all stubs
- `@target`/`@see`/`@since` converted to plain text (`Target:`, `See:`, `Since:`)
- Stubs are scannable by the pipeline

Phase B (registering `@libar-docs-target` and `@libar-docs-since` as taxonomy
tags for structured access) is planned in DataAPIStubIntegration.

---

## 3. Data API Spec Inventory (8 Specs)

### Dependency Graph (Post-Review)

```
                     ┌── DataAPIOutputShaping (25a, 3d)
ProcessStateAPI ─────┤
(V1, exists)         └── DataAPIContextAssembly (25b, 3d)
                              │
                              └── DataAPIDesignSessionSupport (25c, 1d)
                                    │
DataAPIStubIntegration (25a, 2d) ──┘

DataAPIArchitectureQueries (25b, 2d)     ← independent

DataAPIRelationshipGraph (25c, 2d)       ← independent
DataAPICLIErgonomics (25d, 2d)           ← independent, post-MVP
DataAPIPlatformIntegration (25d, 3d)     ← independent, future
```

**Key design decision:** OutputShaping and ContextAssembly are parallel consumers
of MasterDataset, NOT sequential. The artificial dependency was removed during
review. Context assembly builds its own text format via `context-formatter.ts`,
while output shaping transforms pattern lists.

### Spec Detail Summary

| Spec                            | Phase | Priority | Effort | Deliverables | Key Subcommands                                                                            |
| ------------------------------- | ----- | -------- | ------ | ------------ | ------------------------------------------------------------------------------------------ |
| **DataAPIOutputShaping**        | 25a   | high     | 3d     | 8            | `list`, `search`, `--names-only`, `--count`, `--fields`                                    |
| **DataAPIStubIntegration**      | 25a   | high     | 2d     | 7 (1 done)   | `stubs`, `decisions`, `pdr`                                                                |
| **DataAPIContextAssembly**      | 25b   | high     | 3d     | 7            | `context`, `files`, `dep-tree`, `overview`                                                 |
| **DataAPIArchitectureQueries**  | 25b   | high     | 2d     | 6            | `arch neighborhood`, `arch compare`, `arch coverage`, `tags`, `sources`, `unannotated`     |
| **DataAPIDesignSessionSupport** | 25c   | high     | 1d     | 4            | `scope-validate`, `handoff`                                                                |
| **DataAPIRelationshipGraph**    | 25c   | medium   | 2d     | 6            | `graph`, `graph impact`, `graph path`, `graph dangling`, `graph orphans`, `graph blocking` |
| **DataAPICLIErgonomics**        | 25d   | medium   | 2d     | 6            | `repl`, `--dry-run`, per-subcommand `--help`                                               |
| **DataAPIPlatformIntegration**  | 25d   | medium   | 3d     | 8            | MCP server, `generate-context-layer`, `cross-package`, `watch`                             |

---

## 4. MVP Scope for Current PR

### What Ships in This PR

**Tier 1 + Tier 2 specs** — the specs that transform the CLI from unusable to useful:

| Spec                       | Why MVP                                         | Highest-Impact Deliverables                                     |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| DataAPIOutputShaping       | 594KB → 4KB, eliminates #1 usability problem    | `summarizePattern()`, `--names-only`, `--count`, fuzzy matching |
| DataAPIStubIntegration     | Unlocks design session stub metadata            | taxonomy tags (`target`, `since`), `stubs` subcommand           |
| DataAPIContextAssembly     | "Replace 5-10 explore agents" — core value prop | `context --session`, `dep-tree`, `overview`                     |
| DataAPIArchitectureQueries | Deep architecture exploration for sessions      | `arch neighborhood`, `arch coverage`, `tags`                    |

**Estimated total: ~10d of implementation work** across 4 specs.

### What Does NOT Ship in This PR

| Spec                        | Why Deferred                                 | When    |
| --------------------------- | -------------------------------------------- | ------- |
| DataAPIDesignSessionSupport | Depends on ContextAssembly + StubIntegration | Next PR |
| DataAPIRelationshipGraph    | Medium priority, not blocking sessions       | Next PR |
| DataAPICLIErgonomics        | Performance optimization, post-MVP           | Future  |
| DataAPIPlatformIntegration  | MCP server, monorepo features                | Future  |

### Success Criteria

The PR is done when:

1. `process-api list --status active` returns compact summaries (not 594KB JSON)
2. `process-api context <pattern> --session design` returns curated context bundle
3. `process-api stubs <pattern>` returns stub files with target paths
4. `process-api arch coverage` reports annotation completeness
5. All existing tests continue to pass
6. CLAUDE.md updated with new subcommand documentation
7. `pnpm process:query -- <subcommand>` works for all new subcommands

---

## 5. Design Session Sequencing

Design sessions expand plan-level specs into implementation-level detail.
Sessions can run in parallel where specs are independent.

### Recommended Session Order

#### Wave 1 (Can run in parallel — no dependencies between them)

**DS-A: DataAPIOutputShaping Design**

- Input: OutputShaping spec + V1 CLI code + `src/api/types.ts`
- Decisions needed:
  - `summarizePattern()` field selection and type
  - Output modifier pipeline architecture (middleware chain vs. post-processing)
  - QueryResult envelope wiring strategy
  - Config file format and resolution (reuse `delivery-process.config.ts`?)
  - Fuzzy matching algorithm (Levenshtein vs. substring vs. custom)
- Stubs to create: `src/api/summarize.ts`, `src/cli/output-pipeline.ts`

**DS-B: DataAPIStubIntegration Design**

- Input: StubIntegration spec + taxonomy module + existing stub files
- Decisions needed:
  - `@libar-docs-target` and `@libar-docs-since` tag format (value type)
  - `ExtractedPattern` schema extension for `targetPath` and `since` fields
  - Stub-to-implementation resolver approach (file existence check)
  - AD-N decision extraction strategy (regex from description text)
- Stubs to create: `src/api/stub-resolver.ts`

#### Wave 2 (After Wave 1 designs are complete)

**DS-C: DataAPIContextAssembly Design**

- Input: ContextAssembly spec + MasterDataset schema + relationship/arch indexes
- Decisions needed:
  - `ContextBundle` type design (what fields, what structure)
  - Context assembler algorithm (walk order, what to include per session type)
  - Text renderer format (section headers, indentation, markers)
  - Multi-pattern merge strategy (dedup shared deps)
  - `overview` aggregation logic
- Stubs to create: `src/api/context-assembler.ts`, `src/api/context-formatter.ts`
- Note: Can start after DS-A if `summarizePattern()` type is settled (for dep lists)

**DS-D: DataAPIArchitectureQueries Design**

- Input: ArchitectureQueries spec + existing `arch` subcommand code + archIndex
- Decisions needed:
  - Neighborhood algorithm (1-hop vs. configurable depth)
  - Coverage analyzer scope (what counts as "scannable"?)
  - Cross-context comparison output format
  - Tags/sources aggregation from MasterDataset
- Stubs to create: `src/api/coverage-analyzer.ts`
- Note: Independent of DS-A/DS-B, can run in Wave 1 if capacity allows

### Design Session Context Pattern

For each design session, use:

```bash
pnpm process:query -- pattern <SpecPatternName>
```

Plus read:

- The spec file (from the pattern's filePath)
- The V1 CLI (`src/cli/process-api.ts`)
- The ProcessStateAPI (`src/api/process-state.ts`)
- The relevant MasterDataset types (`src/validation-schemas/master-dataset.ts`)

---

## 6. Implementation Session Sequencing

After design sessions complete, implementation follows the FSM workflow:
`roadmap → active → completed`

### Recommended Implementation Order

1. **DataAPIOutputShaping** — builds foundation all other specs benefit from
   - `summarizePattern()` used by list, context, arch queries
   - Output modifier pipeline (`--names-only`, `--count`, `--fields`) is reusable
   - QueryResult envelope applies to all subcommands
   - Config file defaults reduce all subcommand invocations

2. **DataAPIStubIntegration** — enables richer context assembly
   - Taxonomy tags make stub metadata structured
   - `stubs` subcommand validates stub visibility
   - Must complete before DesignSessionSupport can ship

3. **DataAPIContextAssembly** — the flagship feature
   - `context --session` is the "replace elaborate prompts" command
   - Uses `summarizePattern()` from OutputShaping
   - Uses stub metadata from StubIntegration (enrichment, not blocker)

4. **DataAPIArchitectureQueries** — extends existing `arch` subcommand
   - Can run in parallel with ContextAssembly (independent)
   - `arch coverage` is high-value for dogfooding

### Implementation Session FSM Transitions

For each spec being implemented:

```gherkin
# Before any code:
@libar-docs-status:active    # in the spec file

# After ALL deliverables complete:
@libar-docs-status:completed  # in the spec file
```

Active = scope-locked (no new deliverables). Completed = hard-locked (needs unlock).

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

---

## 9. PR Description Context

### PR Title

`feat: Data API output shaping, context assembly, architecture queries, and stub integration`

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
   `arch coverage` reports annotation completeness. `tags` and `sources` provide
   taxonomy and inventory discovery. `unannotated` finds files missing annotations.

### What This Enables

- Claude Code sessions start with one command instead of 5-10 explore agents
- AI agents get compact, targeted output instead of 594KB JSON dumps
- Design session context (spec + stubs + deps + architecture) assembled automatically
- Architecture coverage gaps are discoverable and trackable

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

| Priority | File                                       | Why                                          |
| -------- | ------------------------------------------ | -------------------------------------------- |
| Must     | The spec being worked on                   | Requirements and acceptance criteria         |
| Must     | `src/cli/process-api.ts`                   | V1 CLI structure, arg parsing pattern        |
| Must     | `src/api/process-state.ts`                 | ProcessStateAPI methods                      |
| Must     | `src/api/types.ts`                         | QueryResult types, existing type definitions |
| Should   | `src/validation-schemas/master-dataset.ts` | MasterDataset schema                         |
| Should   | `src/generators/pipeline/index.ts`         | Transform pipeline                           |
| Should   | `src/taxonomy/registry-builder.ts`         | Tag registration (for StubIntegration)       |

### For Context Assembly Specifically

| File                                           | Why                                   |
| ---------------------------------------------- | ------------------------------------- |
| `src/generators/pipeline/transform-dataset.ts` | Relationship and arch index building  |
| `src/validation-schemas/extracted-pattern.ts`  | Pattern fields available for assembly |

---

## 12. Session Checklist Templates

### Design Session Start

- [ ] Read this context document
- [ ] Read the target spec file
- [ ] Read V1 CLI (`src/cli/process-api.ts`)
- [ ] Read ProcessStateAPI (`src/api/process-state.ts`)
- [ ] Read relevant MasterDataset types
- [ ] Create stubs in `delivery-process/stubs/{spec-name}/`
- [ ] Document decisions as PDR features if architecturally significant
- [ ] Do NOT transition spec status or write implementation code

### Implementation Session Start

- [ ] Read this context document
- [ ] Read the target spec file (requirements + deliverables)
- [ ] Read design session stubs (if created)
- [ ] Transition spec to `@libar-docs-status:active` BEFORE writing code
- [ ] For each deliverable: implement, test, update status
- [ ] Transition to `@libar-docs-status:completed` only when ALL done
- [ ] Run `pnpm docs:all` to regenerate
- [ ] Run `pnpm lint && pnpm test` to verify
