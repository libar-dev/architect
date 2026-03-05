# Documentation Consolidation — Session Tracker

> **Branch:** `feature/docs-consolidation`
> **Parent Pattern:** DocsConsolidationStrategy (Phase 35, roadmap)
> **Created:** 2026-03-05
> **Goal:** Consolidate ~3,857 lines of manual docs and ~6,986 lines of generated docs into a compact, website-publishable structure. Each PR also trims CLAUDE.md by replacing hand-maintained sections with Process Data API queries.

---

## Session Discipline

**Design sessions produce specs. Implementation sessions produce code. Never both.**

| Session Type       | Input                                | Output                                                                     | Never Do                           |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------- |
| **Design**         | Pattern brief or planning-level spec | Refined spec with Rules, deliverables, acceptance criteria, code locations | Write implementation code          |
| **Implementation** | Design-level or impl-ready spec      | Code + tests + generated docs                                              | Add new deliverables, expand scope |

### Why Separation Matters

This package is mission-critical infrastructure consumed by a monorepo with ~600 files. A design mistake discovered mid-implementation wastes the entire session. Separating design from implementation means:

1. **Design sessions** are cheap — they produce `.feature` file edits, no compilation needed
2. **Implementation sessions** have a locked scope — the spec defines what "done" means
3. **FSM enforces this** — `active` specs are scope-locked, no new deliverables allowed

### Process Data API — Use It First

**Before launching explore agents or reading files**, query the Data API. It uses 5-10x less context than file reads and returns structured, current data.

```bash
# Session start ritual (3 commands, ~30 seconds)
pnpm process:query -- overview                              # Project health
pnpm process:query -- scope-validate <Pattern> <session>    # Pre-flight check
pnpm process:query -- context <Pattern> --session <type>    # Curated context bundle

# Design session context
pnpm process:query -- context <Pattern> --session design    # Full: stubs + deps + deliverables
pnpm process:query -- dep-tree <Pattern>                    # Dependency chains
pnpm process:query -- stubs <Pattern>                       # Design stubs
pnpm process:query -- decisions <Pattern>                   # Design decisions (DD-N)

# Implementation session context
pnpm process:query -- context <Pattern> --session implement # Focused: deliverables + FSM + tests
pnpm process:query -- files <Pattern>                       # File paths for implementation

# Session end
pnpm process:query -- handoff --pattern <Pattern>           # Capture state for next session
```

### CLAUDE.md Reduction Goal

**Current:** 1,093 lines across 9 sections. Target: ~600 lines.

Every PR in this consolidation should identify CLAUDE.md sections that can be replaced by Data API queries. The API already serves most of this content programmatically.

| CLAUDE.md Section                          | Lines | Replacement                                                           | Priority |
| ------------------------------------------ | ----- | --------------------------------------------------------------------- | -------- |
| Testing (vitest-cucumber rules, quirks)    | 275   | Keep — hard-won tribal knowledge, no API equivalent                   | -        |
| Authoring (Gherkin patterns, rich content) | 200   | Partially replace — `rules` and `tags` commands cover some            | Medium   |
| Session Workflows                          | 160   | Replace — `context --session`, `scope-validate`, `handoff` cover this | **High** |
| Validation (Process Guard, anti-patterns)  | 109   | Replace — `query getProtectionInfo`, `query getValidTransitionsFrom`  | **High** |
| Guides (Product Area Enrichment)           | 104   | Replace — `arch coverage`, `unannotated`, product area queries        | **High** |
| Project Overview                           | 86    | Trim — `overview` command covers progress/health                      | Medium   |
| Data API CLI                               | 66    | Keep — this IS the API reference                                      | -        |
| Architecture                               | 51    | Replace — generated ARCHITECTURE-CODECS.md + ARCHITECTURE-TYPES.md    | Medium   |
| Common Commands                            | 36    | Keep — essential quick reference                                      | -        |

**Estimated reduction per PR:** ~50-80 lines. Target 3 PRs to reach ~600 lines.

---

## Current Branch State (as of 2026-03-05, post Phase 25)

### Completed Phases

- **Phase 2+4 (ArchitectureDocRefactoring):** Committed (17 commits). ARCHITECTURE.md 1,287→358 lines. Convention-tag codec registry.
- **Phase 37 (DocsLiveConsolidation):** Committed. Reference docs consolidated into `docs-live/reference/`, compacts into `docs-live/_claude-md/architecture/`. `docs-generated/` reduced to intermediates only.
- **Phase 38 (GeneratedDocQuality):** Implemented. Duplicate tables fixed, Generation compact enriched (4.3 KB), ARCHITECTURE-TYPES reordered (types first), TOC added to all product area docs.
- **Phase 40 (PublishingRelocation):** Implemented. PUBLISHING.md (144 lines) moved to MAINTAINERS.md at repo root. INDEX.md cleaned (3 references removed). Website manifest updated in separate repo.
- **Phase 25 (ClaudeModuleGeneration):** Completed. Full pipeline: 3 taxonomy tags, schema fields, parser extraction, ClaudeModuleCodec, generator registration.
- **Phase 39 (SessionGuidesModuleSource):** Completed. First consumer of ClaudeModule pipeline. 3 hand-written files replaced by generated output. CLAUDE.md Session Workflows section now generated.
- **Phase 42 (ReadmeRationalization):** Completed. README.md trimmed from 504 → 142 lines (72% reduction). 10 enterprise/duplicate sections removed. INDEX.md updated.
- **Phase 43 (ProcessApiHybridGeneration):** Completed. CLI schema as single source of truth. 3 reference tables generated from schema. showHelp() refactored. Three-way sync eliminated.

### Active Phases

None. All active phases completed.

### Blockers

None.

---

## Phase Tracker

### Legend

| Status        | Meaning                                                |
| ------------- | ------------------------------------------------------ |
| DONE          | Committed and tested                                   |
| IMPL-READY    | Spec is implementation-ready, no design session needed |
| DESIGN-NEEDED | Spec needs a design session before implementation      |
| BLOCKED       | Dependency not yet available                           |

---

### Phase 2+4 — ArchitectureDocRefactoring ✓ DONE

**Pattern:** ArchitectureDocRefactoring (Phase 36)
**Status:** `completed` — FSM terminal state
**Committed in:** Current branch (17 commits)

Decomposed ARCHITECTURE.md from 1,287 → 358 lines. Convention-tag codec registry on 14 files. Generated ARCHITECTURE-CODECS.md + ARCHITECTURE-TYPES.md.

---

### Phase 37 — DocsLiveConsolidation ✓ DONE

**Pattern:** DocsLiveConsolidation (Phase 37)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Consolidated reference docs from `docs-generated/` into `docs-live/` as the single output directory for all website-published and Claude-readable content.

**Changes made (8 files):**

| File                                                                 | Change                                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/generators/built-in/reference-generators.ts`                    | Output prefix `docs/` → `reference/` (lines 196, 440)                            |
| `delivery-process.config.ts`                                         | Added `outputDirectory: 'docs-live'` to `reference-docs` override                |
| `.gitignore`                                                         | Added `docs-generated/` to ignore list                                           |
| `package.json`                                                       | Removed `docs-generated` from `files` array                                      |
| `src/lint/process-guard/detect-changes.ts`                           | Added `docs-live/` to `isGeneratedDocsPath()`                                    |
| `docs/ARCHITECTURE.md`                                               | Updated 4 cross-references from `docs-generated/docs/` to `docs-live/reference/` |
| `tests/features/doc-generation/architecture-doc-refactoring.feature` | Updated 6 file path references                                                   |
| `tests/features/behavior/codecs/reference-generators.feature`        | Updated output path assertion                                                    |

**Additional fix:** `session-guides-module-source.feature:101` — rephrased "When ClaudeModuleGeneration" to "Once ClaudeModuleGeneration" to fix Gherkin keyword-in-description lint error that blocked the entire test suite.

**Result:**

- `docs-live/reference/` — ARCHITECTURE-CODECS.md, ARCHITECTURE-TYPES.md, REFERENCE-SAMPLE.md
- `docs-live/_claude-md/architecture/` — architecture-codecs.md, architecture-types.md, reference-sample.md
- `docs-generated/` — only intermediates: business-rules/, taxonomy/, BUSINESS-RULES.md, TAXONOMY.md
- 122 test files, 7941 tests all passing

**Website impact (pending):** `sync-content.mjs` in libar-dev-website needs updating to read reference docs from `docs-live/reference/` instead of `docs-generated/docs/`.

---

### Phase 38 — GeneratedDocQuality ✓ DONE

**Pattern:** GeneratedDocQuality (Phase 38)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Fixed four quality issues in generated documentation output.

**Deliverables (4, all complete):**

| #   | Deliverable                                       | Result                                                                                 |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Fix duplicate convention tables in behavior-specs | Removed 6 lines from `buildBehaviorSectionsFromPatterns` — tables now appear once only |
| 2   | Enrich Generation compact (target: 4+ KB)         | Expanded `PRODUCT_AREA_META.Generation` intro + invariants: 1.4 KB → 4.3 KB            |
| 3   | Reorder ARCHITECTURE-TYPES.md: types first        | Added `shapesFirst` config flag + decode path refactor — API Types now leads           |
| 4   | Add TOC to product area doc headers               | `buildTableOfContents()` inserts anchor-linked Contents for docs with 3+ H2s           |

**Changes made (5 files):**

| File                                                   | Change                                                                                                                                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderable/codecs/reference.ts`                   | D1: removed table extraction from behavior-specs; D2: enriched Generation meta; D3: added `shapesFirst` to interface + decode refactor; D4: added `buildTableOfContents()` helper |
| `src/config/project-config-schema.ts`                  | Added `shapesFirst: z.boolean().optional()` to `ReferenceDocConfigSchema`                                                                                                         |
| `delivery-process.config.ts`                           | Added `shapesFirst: true` to ARCHITECTURE-TYPES config                                                                                                                            |
| `delivery-process/specs/generated-doc-quality.feature` | FSM: roadmap → active → completed, all deliverables complete                                                                                                                      |

**New tests:** `tests/features/behavior/codecs/generated-doc-quality.feature` — 31 tests covering all 4 deliverables.

**Result:**

- REFERENCE-SAMPLE.md: 1,166 → 1,075 lines (no duplicate tables)
- ARCHITECTURE-TYPES.md: API Types section now appears in first 10 lines
- Generation compact: 1.4 KB → 4.3 KB (self-sufficient with codec inventory + pipeline summary)
- All 7 product area docs now have `## Contents` with anchor links
- 123 test files, 7,972 tests all passing

**Website Impact:** Improves quality of all generated pages published at `/delivery-process/generated/` and `/delivery-process/product-areas/`.

**CLAUDE.md trim opportunity:** After quality improvements, the Guides section (104 lines, Product Area Enrichment) can be trimmed — the enrichment workflow is encoded in the spec + API queries.

**Pre-flight:**

```bash
pnpm process:query -- context GeneratedDocQuality --session implement
pnpm process:query -- files GeneratedDocQuality
```

---

### Phase 39 — SessionGuidesModuleSource | DONE

**Pattern:** SessionGuidesModuleSource (Phase 39)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Replaced 3 hand-written `_claude-md/workflow/` files (156 lines) with codec-generated output from the spec's 9 Rule blocks. First real consumer of the ClaudeModuleGeneration pipeline (Phase 25).

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                         | Impact                                                   | Resolution                                                 |
| ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| `claude-module` is file-level, not Rule-level   | Cannot selectively tag individual Rules in ADR/PDR files | Removed deliverables #2-#4 (tag ADR-001, ADR-003, PDR-001) |
| ADR-001 has 9 Rules, only 2-3 workflow-relevant | Tagging ADR-001 would create noisy, diluted context      | Spec itself captures workflow invariants as Rule blocks    |
| PDR-001 Rules are CLI implementation decisions  | Not session workflow guidance, wrong audience            | Removed from scope entirely                                |
| Phase 25 `claude-section` enum lacks `workflow` | Must add value before annotation works                   | Added `workflow` to Phase 25 spec enum (complete)          |
| Lint error (line 101) already fixed in Phase 37 | No action needed                                         | Confirmed: "Once ClaudeModuleGeneration..."                |

#### Implementation Session Report (2026-03-05, completion)

**Deliverables (7, all complete):**

| #   | Deliverable                                                                                            | Status   | Location                                                    |
| --- | ------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------- |
| 1   | Session workflow behavior spec with Rule blocks (9 Rules: session types, FSM, escape hatches, handoff) | complete | delivery-process/specs/session-guides-module-source.feature |
| 2   | Verify SESSION-GUIDES.md retained with correct INDEX.md links                                          | complete | docs/SESSION-GUIDES.md                                      |
| 3   | Add `workflow` to Phase 25 claude-section enum                                                         | complete | delivery-process/specs/claude-module-generation.feature     |
| 4   | Add claude-module and claude-section:workflow tags to this spec                                        | complete | delivery-process/specs/session-guides-module-source.feature |
| 5   | Generated \_claude-md/workflow/session-workflows.md replaces hand-written                              | complete | \_claude-md/workflow/session-workflows.md                   |
| 6   | Generated \_claude-md/workflow/fsm-handoff.md replaces hand-written                                    | complete | \_claude-md/workflow/session-workflows.md                   |
| 7   | CLAUDE.md Session Workflows section replaced with modular-claude-md include                            | complete | CLAUDE.md                                                   |

**Changes made (8 files):**

| File                                                          | Change                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/renderable/generate.ts`                                  | Added per-document-type renderer selection via `DOCUMENT_TYPE_RENDERERS` map        |
| `src/renderable/codecs/claude-module.ts`                      | Removed redundant H3 heading; normalized rule headings from H4 to canonical H2      |
| `delivery-process/specs/session-guides-module-source.feature` | Added claude-module/section/tags; deliverables #4-#7 complete; FSM active→completed |
| `delivery-process.config.ts`                                  | Added `claude-modules` generatorOverride with `outputDirectory: '_claude-md'`       |
| `package.json`                                                | Added `docs:claude-modules` script; appended to `docs:all` chain                    |
| `_claude-md/metadata.json`                                    | Replaced 3 hand-written workflow subsections with 1 generated file reference        |
| `_claude-md/workflow/session-details.md`                      | Deleted — content now in generated session-workflows.md (Rules 4, 5, 6)             |
| `_claude-md/workflow/fsm-handoff.md`                          | Deleted — content now in generated session-workflows.md (Rules 7, 8)                |

**Generated files (2):**

| File                                       | Content                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `_claude-md/CLAUDE-MODULES.md`             | Index listing 1 module: session-workflows (workflow, 9 rules)   |
| `_claude-md/workflow/session-workflows.md` | 149 lines: Problem/Solution intro + 9 Rule sections with tables |

**Pipeline fix (pre-requisite for generation):**

The ClaudeModuleCodec (Phase 25) used `heading(3, ...)` and `heading(4, ...)` directly, but the `renderToClaudeMdModule` renderer adds +2 offset — this would have produced H5/H6. Fixed by:

1. Removing redundant `heading(3, pattern.name)` — the `document()` title already carries the name
2. Normalizing rule headings to `heading(2, ...)` — canonical level, rendered as H4 by the module renderer
3. Adding `DOCUMENT_TYPE_RENDERERS` map in `generate.ts` to route `claude-modules` through `renderToClaudeMdModule`

**Result:**

- `_claude-md/workflow/` reduced from 3 hand-written files (156 lines) to 1 generated file (149 lines)
- CLAUDE.md Session Workflows section: 153 lines of generated content (was 161 lines hand-written)
- `docs/SESSION-GUIDES.md` retained (389 lines, unchanged)
- `pnpm docs:claude-modules` added to `docs:all` chain for automatic regeneration
- 123 test files, 7,972 tests all passing

---

### Phase 40 — PublishingRelocation ✓ DONE

**Pattern:** PublishingRelocation (Phase 40)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Moved `docs/PUBLISHING.md` (144 lines) to `MAINTAINERS.md` at repo root. Deleted original. Updated INDEX.md and website manifest.

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                                          | Impact                                           | Resolution                                          |
| ---------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| PUBLISHING.md has zero relative links                            | No link rewriting needed in MAINTAINERS.md       | Simplifies move to pure copy + header rename        |
| Spec references non-existent "Phase 6 (IndexNavigationUpdate)"   | False dependency for INDEX.md cleanup            | INDEX.md update is now deliverable #3 of this phase |
| Website manifest maps PUBLISHING.md to /guides/publishing/       | Dead sync target after deletion                  | Deliverable #4 removes manifest entry               |
| docs-live/GENERATION.md references PUBLISHING.md 4 times         | Generated content, auto-updated by pnpm docs:all | No manual action needed                             |
| INDEX.md has 3 PUBLISHING.md references (lines 32, 260-272, 338) | Broken links and stale navigation                | All 3 removed in deliverable #3                     |
| MAINTAINERS.md is NOT published on website                       | URL /guides/publishing/ disappears               | Acceptable — maintainer-only content                |

#### Implementation Session Report (2026-03-05)

**Deliverables (5, all complete):**

| #   | Deliverable                                                         | Status   | Location                                       |
| --- | ------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| 1   | Create MAINTAINERS.md at repo root with all PUBLISHING.md content   | complete | MAINTAINERS.md                                 |
| 2   | Delete docs/PUBLISHING.md                                           | complete | docs/PUBLISHING.md                             |
| 3   | Remove PUBLISHING.md entries from docs/INDEX.md (3 locations)       | complete | docs/INDEX.md                                  |
| 4   | Remove PUBLISHING.md from website content-manifest.mjs guides array | complete | libar-dev-website/scripts/content-manifest.mjs |
| 5   | Add MAINTAINERS.md link rewrite to content-manifest.mjs             | complete | libar-dev-website/scripts/content-manifest.mjs |

**Changes made (5 files across 2 repos):**

| File                                                            | Change                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `MAINTAINERS.md`                                                | Created at repo root with all PUBLISHING.md content, H1 renamed to "Maintainer Guide" |
| `docs/PUBLISHING.md`                                            | Deleted via git rm                                                                    |
| `docs/INDEX.md`                                                 | Removed 3 PUBLISHING.md references (line 32, lines 260-272, line 338)                 |
| `delivery-process/specs/publishing-relocation.feature`          | FSM: roadmap → active → completed, all 5 deliverables marked complete                 |
| `libar-dev-website/scripts/content-manifest.mjs` _(other repo)_ | Removed PUBLISHING.md from guides array, added MAINTAINERS.md link rewrite            |

**Result:**

- MAINTAINERS.md: 144 lines with all 8 H2 sections preserved intact
- docs/INDEX.md: zero PUBLISHING.md references remaining
- Website manifest: guides array reduced from 6 to 5 entries, link rewrite added
- 123 test files, 7,972 tests all passing

**Website impact:** URL `/guides/publishing/` will no longer exist. Any remaining cross-references in generated docs that use `./PUBLISHING.md` will resolve to the GitHub-hosted MAINTAINERS.md via the link rewrite. The libar-dev-website repo change needs a separate commit.

---

### Phase 41 — GherkinPatternsRestructure | DONE

**Pattern:** GherkinPatternsRestructure (Phase 41)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Moved Step Linting section (148 lines) from `docs/GHERKIN-PATTERNS.md` to `docs/VALIDATION.md`. GHERKIN-PATTERNS.md trimmed from 515 → 366 lines. VALIDATION.md expanded from 281 → 416 lines.

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                                      | Impact                                                                         | Resolution                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Only Step Linting (148 lines) is misplaced content           | Original ~250 target required removing 116 lines of valid authoring content    | Revised target to ~370 lines — all remaining content is legitimate guide material                              |
| VALIDATION.md line 96 is a redirect pointer                  | lint-steps is the only tool of 4 without inline documentation                  | Replace redirect with full content — lint-steps becomes self-contained like the other 3 tools                  |
| CLAUDE.md Testing section (274 lines) overlaps significantly | Two-Pattern Problem, vitest-cucumber Rules, Hash Comments all cover same rules | Overlap is intentional: CLAUDE.md = AI debugging "why", lint-steps = tool reference "what". No trim this phase |
| 7 cross-reference locations identified                       | INDEX.md needs section table + line count updates for both docs                | Added deliverable #5 for INDEX.md updates                                                                      |
| Website manifest unaffected                                  | Both files stay at existing URLs, only content moves                           | No manifest changes needed                                                                                     |

#### Implementation Session Report (2026-03-05)

**Deliverables (6, all complete):**

| #   | Deliverable                                                                               | Status   | Location                                     |
| --- | ----------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| 1   | Move Step Linting section (lines 346-493) to VALIDATION.md, replacing redirect at line 96 | complete | docs/VALIDATION.md                           |
| 2   | Remove Step Linting section from GHERKIN-PATTERNS.md (result: ~370 lines)                 | complete | docs/GHERKIN-PATTERNS.md                     |
| 3   | Update cross-references between the two docs                                              | complete | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md |
| 4   | Verify related-documentation tables in both files                                         | complete | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md |
| 5   | Update INDEX.md section tables and line counts for both docs                              | complete | docs/INDEX.md                                |
| 6   | Add lint-steps cross-reference row in GHERKIN-PATTERNS.md Quick Reference                 | complete | docs/GHERKIN-PATTERNS.md                     |

**Changes made (4 files):**

| File                                                          | Change                                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `docs/VALIDATION.md`                                          | Replaced redirect pointer (line 96) with full Step Linting content (281 → 416 lines)           |
| `docs/GHERKIN-PATTERNS.md`                                    | Removed Step Linting section (515 → 366 lines), lint-steps Quick Reference row → VALIDATION.md |
| `docs/INDEX.md`                                               | Updated line counts (GP: 1-366, VAL: 1-416), section tables reflect moved content              |
| `delivery-process/specs/gherkin-patterns-restructure.feature` | FSM: roadmap → active → completed, all 6 deliverables marked complete                          |

**Result:**

- GHERKIN-PATTERNS.md: 515 → 366 lines (authoring guide only, no tooling reference)
- VALIDATION.md: 281 → 416 lines (all 4 validation tools now have inline documentation)
- lint-steps section in VALIDATION.md: 4 subsections (Feature File Rules, Step Definition Rules, Cross-File Rules, CLI Reference)
- VALIDATION.md Related Documentation: updated description from "Step linting rules" to "Gherkin authoring patterns"
- GHERKIN-PATTERNS.md Quick Reference: lint-steps row now links to VALIDATION.md#lint-steps
- INDEX.md: line counts and section tables updated for both docs
- 123 test files, 7,972 tests all passing

**CLAUDE.md trim opportunity:** None from this phase. The ~60 lines estimated in the tracker for Validation section trimming is better addressed by a future phase replacing CLAUDE.md Validation content (lines 521+) with Data API queries.

---

### Phase 42 — ReadmeRationalization | DONE

**Pattern:** ReadmeRationalization (Phase 42)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Trimmed README.md from 504 → 142 lines. Removed 10 enterprise pitch/duplicate sections. All enterprise content already covered by 9 website landing page components — zero information loss.

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                                   | Impact                                                   | Resolution                                            |
| --------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Website has 9 landing components, not "only Hero"         | No content creation needed — extraction is deletion      | Deliverable #3 becomes mapping doc, not content brief |
| Metrics.astro has identical "Proven at Scale" claims      | Section 8 (47 lines) is 100% redundant                   | Safe EXTRACT with zero information loss               |
| Pillars.astro covers FSM, dual-source, relationships      | Sections 9, 11, 12 redundant with website                | Safe EXTRACT                                          |
| generate-docs flags table duplicates --help output        | CLI section is 68 lines but only command table is unique | Trim flags table, retain command summary only         |
| INDEX.md line 22 references README as 1-504               | Stale line count after trim                              | Add deliverable #5 for INDEX.md update                |
| README maps to /getting-started/ via content-manifest.mjs | Trimmed README is a better getting-started page          | No manifest change needed; add Rule 3                 |
| Line 93 `[Configuration](#configuration)` anchor breaks   | Internal link to deleted section                         | Replace with docs/CONFIGURATION.md link               |

#### Implementation Session Report (2026-03-05)

**Deliverables (6, all complete):**

| #   | Deliverable                                                                         | Status   | Location      |
| --- | ----------------------------------------------------------------------------------- | -------- | ------------- |
| 1   | Trim README.md to ~150 lines per section disposition table                          | complete | README.md     |
| 2   | Remove Configuration section (lines 441-474) duplicating docs/CONFIGURATION.md      | complete | README.md     |
| 3   | Document README-to-website component mapping for extracted enterprise sections      | complete | spec file     |
| 4   | Verify all retained links in trimmed README resolve to valid targets                | complete | README.md     |
| 5   | Update INDEX.md Quick Navigation line count for README (1-504 → ~1-142)             | complete | docs/INDEX.md |
| 6   | Verify trimmed README serves as effective getting-started page at /getting-started/ | complete | README.md     |

**Changes made (3 files):**

| File                                                    | Change                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `README.md`                                             | Trimmed from 504 → 142 lines per disposition table; 10 sections removed, 6 trimmed |
| `docs/INDEX.md`                                         | Updated README line count (1-504 → 1-142) and section table (17 rows → 7 rows)     |
| `delivery-process/specs/readme-rationalization.feature` | FSM: roadmap → active → completed, all 6 deliverables marked complete              |

**Sections removed (10):**

| Section                   | Lines Removed | Website Coverage                   |
| ------------------------- | ------------- | ---------------------------------- |
| Built for AI-Assisted Dev | 17            | DataAPI.astro + CodeExamples.astro |
| Proven at Scale           | 47            | Metrics.astro (identical content)  |
| FSM-Enforced Workflow     | 32            | Pillars.astro + Workflows.astro    |
| Data API CLI              | 26            | DataAPI.astro (richer demo)        |
| Rich Relationship Model   | 23            | Pillars.astro pillar 04            |
| How It Compares           | 21            | Pillars.astro (implicit)           |
| Design-First Development  | 4             | doc index pointer                  |
| Document Durability Model | 4             | doc index pointer                  |
| Use Cases                 | 11            | Quick Start + website              |
| Configuration             | 34            | docs/CONFIGURATION.md (duplicate)  |

**Result:**

- README.md: 504 → 142 lines (72% reduction)
- Install instructions now within first 20 lines (was line 56)
- All 18 relative links verified valid
- `#configuration` anchor replaced with `docs/CONFIGURATION.md` link
- INDEX.md section table updated (17 → 7 rows, line ranges corrected)
- 123 test files, 7,972 tests all passing

**Website impact:** README maps to /getting-started/ via content-manifest.mjs. The trimmed version is a better getting-started page — install within 20 lines, practical steps immediately after. No manifest changes needed.

---

### Phase 43 — ProcessApiHybridGeneration | DONE

**Pattern:** ProcessApiHybridGeneration (Phase 43)
**Status:** `completed` — FSM terminal state
**Completed:** 2026-03-05

Created declarative CLI schema as single source of truth for reference tables. Three-way sync (parser, help text, markdown) eliminated. Generated `PROCESS-API-REFERENCE.md` with 3 tables from schema.

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                                          | Impact                                            | Resolution                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Spec referenced `src/cli/parser.ts` — file doesn't exist         | All 4 deliverables had wrong path                 | Fixed to `src/cli/process-api.ts` + `src/cli/output-pipeline.ts` |
| Orchestrator only does full-file writes (no partial replacement) | Marker-based replacement not supported            | Split Output Reference into separate generated file (Option B)   |
| `ReferenceDocConfig` is MasterDataset-sourced (ADR-006)          | CLI schema data is not annotation-derived         | Standalone generator, not ReferenceDocConfig                     |
| `--format` in Output Modifiers table but not in interface        | Generated table would be incomplete               | Schema includes `--format` alongside modifiers                   |
| `--session` parsed as global option but absent from table        | Intentional — documented in Session Types section | Schema captures in separate `sessionOptions` group               |
| `showHelp()` lines 271-370 is third copy of same data            | Three-way sync: parser, help text, markdown       | Schema drives both help text and doc generation (deliverable #6) |

#### Implementation Session Report (2026-03-05)

**Deliverables (7, all complete):**

| #   | Deliverable                                          | Status   | Location                                                   |
| --- | ---------------------------------------------------- | -------- | ---------------------------------------------------------- |
| 1   | Create declarative CLI schema with option groups     | complete | src/cli/cli-schema.ts                                      |
| 2   | Sync test: schema entries match parseArgs() behavior | complete | tests/features/behavior/cli/process-api-reference.feature  |
| 3   | ProcessApiReferenceGenerator: standalone generator   | complete | src/generators/built-in/process-api-reference-generator.ts |
| 4   | Register generator in orchestrator config            | complete | delivery-process.config.ts                                 |
| 5   | Trim PROCESS-API.md Output Reference to link         | complete | docs/PROCESS-API.md                                        |
| 6   | Refactor showHelp() to consume CLI schema            | complete | src/cli/process-api.ts                                     |
| 7   | Behavior spec with scenarios for all 3 tables        | complete | tests/features/behavior/cli/process-api-reference.feature  |

**Files created (4):**

| File                                                         | Purpose                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `src/cli/cli-schema.ts`                                      | Declarative CLI schema: 4 option groups, inter-table prose |
| `src/generators/built-in/process-api-reference-generator.ts` | Standalone DocumentGenerator, ADR-006 compliant            |
| `tests/features/behavior/cli/process-api-reference.feature`  | 28 tests: table generation, sync test, schema coverage     |
| `tests/steps/behavior/cli/process-api-reference.steps.ts`    | Step definitions with DataTable patterns                   |

**Files modified (6):**

| File                                                           | Change                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/cli/process-api.ts`                                       | showHelp() refactored: 3 sections now schema-driven via formatHelpOptions()   |
| `src/generators/built-in/codec-generators.ts`                  | Import + registration of ProcessApiReferenceGenerator                         |
| `delivery-process.config.ts`                                   | Added `process-api-reference` generator override with `outputDirectory`       |
| `package.json`                                                 | Added `docs:process-api-reference` script, appended to `docs:all` chain       |
| `docs/PROCESS-API.md`                                          | Output Reference section: 3 tables → link to generated file (509 → 466 lines) |
| `delivery-process/specs/process-api-hybrid-generation.feature` | FSM: roadmap → active → completed, all 7 deliverables marked complete         |

**Generated files (1):**

| File                                           | Content                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `docs-live/reference/PROCESS-API-REFERENCE.md` | 54 lines: 3 tables + inter-table prose, auto-generated header |

**Result:**

- CLI schema defines 4 option groups: globalOptions (6), outputModifiers (5), listFilters (8), sessionOptions (1)
- PROCESS-API-REFERENCE.md: 54 lines with 3 markdown tables and inter-table prose
- PROCESS-API.md: 509 → 466 lines (Output Reference section replaced with link)
- showHelp(): Options, Output Modifiers, List Filters now schema-driven
- `pnpm docs:process-api-reference` added to `docs:all` chain
- 124 test files, 8,000 tests all passing

**CLAUDE.md trim opportunity:** The "Data API CLI" section (66 lines) could trim ~30 lines — the generated reference file is the authoritative source for flag/modifier/filter tables.

---

### Phase 25 — ClaudeModuleGeneration | DONE

**Pattern:** ClaudeModuleGeneration | **Effort:** 1.5d | **Depends on:** none (phantom dependency removed)

**What:** Generate CLAUDE.md modules directly from behavior spec feature files using dedicated `claude-*` tags. Full pipeline: taxonomy → parser → schema → codec → generator.

**Current status:** COMPLETED. All 9 implementation deliverables done. 2 prototype deliverables marked n/a (first real consumer is Phase 39 SessionGuidesModuleSource).

#### Implementation Session Report (2026-03-05)

**Deliverables (11, 9 complete, 2 n/a):**

| #   | Deliverable                     | Status   | Location                                |
| --- | ------------------------------- | -------- | --------------------------------------- |
| 1   | claude-module tag definition    | complete | taxonomy/registry-builder.ts            |
| 2   | claude-section tag definition   | complete | taxonomy/registry-builder.ts            |
| 3   | claude-tags tag definition      | complete | taxonomy/registry-builder.ts            |
| 4   | DocDirective schema fields      | complete | validation-schemas/doc-directive.ts     |
| 5   | ExtractedPattern schema fields  | complete | validation-schemas/extracted-pattern.ts |
| 6   | Gherkin parser tag extraction   | complete | extractor/gherkin-extractor.ts          |
| 7   | ClaudeModuleCodec               | complete | renderable/codecs/claude-module.ts      |
| 8   | Claude module generator         | complete | generators/built-in/codec-generators.ts |
| 9   | Generator registry integration  | complete | renderable/generate.ts                  |
| 10  | Process Guard annotated example | n/a      | First consumer is Phase 39              |
| 11  | Example generated module        | n/a      | First consumer is Phase 39              |

**Files created (2):**

| File                                     | Purpose                                         |
| ---------------------------------------- | ----------------------------------------------- |
| `src/taxonomy/claude-section-values.ts`  | CLAUDE_SECTION_VALUES enum constant             |
| `src/renderable/codecs/claude-module.ts` | ClaudeModuleCodec with content extraction logic |

**Files modified (8):**

| File                                                      | Change                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `delivery-process/specs/claude-module-generation.feature` | FSM: roadmap → active → completed, phantom dep removed       |
| `src/taxonomy/registry-builder.ts`                        | 3 tag definitions + claude group in METADATA_TAGS_BY_GROUP   |
| `src/taxonomy/index.ts`                                   | Export CLAUDE_SECTION_VALUES                                 |
| `src/validation-schemas/doc-directive.ts`                 | 3 claude fields (claudeModule, claudeSection, claudeTags)    |
| `src/validation-schemas/extracted-pattern.ts`             | 3 claude fields (mirrors doc-directive)                      |
| `src/scanner/gherkin-ast-parser.ts`                       | Return type annotations for claude fields                    |
| `src/extractor/gherkin-extractor.ts`                      | assignIfDefined/assignIfNonEmpty for claude fields (2 sites) |
| `src/renderable/generate.ts`                              | claude-modules document type + codec + factory registration  |
| `src/renderable/codecs/index.ts`                          | Export ClaudeModuleCodec + factory + options                 |
| `src/generators/built-in/codec-generators.ts`             | Register claude-modules generator                            |

**Result:**

- Full pipeline operational: `@libar-docs-claude-module` → ClaudeModuleCodec → `_claude-md/{section}/{module}.md`
- Registry-driven extraction: adding tags to registry auto-handles parsing
- 123 test files, 7,972 tests all passing
- Unblocks Phase 39 generation deliverables (#4-#7)

---

## PR Sequence

### PR 1 — Current branch (feature/docs-consolidation)

**Scope:** Phase 2+4 (ArchitectureDocRefactoring) — already committed.

**Remaining work:**

1. Fix lint error in session-guides-module-source.feature:101
2. `pnpm build && pnpm docs:all` to regenerate
3. Commit generated docs + spec tweaks + test files
4. Include untracked roadmap specs (Phases 37-43) as planning artifacts
5. Verify full test suite green

**CLAUDE.md trim target:** ~50 lines from Architecture section (replace with generated doc pointers).

---

### PR 2 — Phase 37 + 38 (DocsLiveConsolidation + GeneratedDocQuality)

**Scope:** Merge output directories + fix generated doc quality.

**Pre-requisite:** Design sessions for Phase 40-42 can run in parallel (they're independent).

**Website change required:** Update `sync-content.mjs` source resolution in libar-dev-website.

**CLAUDE.md trim target:** ~80 lines from Guides section (Product Area Enrichment → API queries).

---

### PR 3 — Phase 40 + 41 (PublishingRelocation + GherkinPatternsRestructure)

**Scope:** Mechanical doc moves — smallest blast radius.

**Pre-requisite:** Design sessions for both must be complete.

**Website change required:** Remove PUBLISHING.md from content-manifest.mjs.

**CLAUDE.md trim target:** ~60 lines from Validation section (replace with `query getProtectionInfo`).

---

### PR 4 — Phase 42 (ReadmeRationalization)

**Scope:** README trim — high visibility, do alone.

**Pre-requisite:** Design session must be complete. Website landing page content brief ready.

**Website change required:** Content at /getting-started/ changes significantly. May need website-side adjustments.

**CLAUDE.md trim target:** ~50 lines from Project Overview (replace with `overview` command).

---

### PR 5 — Phase 43 (ProcessApiHybridGeneration)

**Scope:** Generated tables in PROCESS-API.md.

**Pre-requisite:** None beyond DocsConsolidationStrategy being active.

**CLAUDE.md trim target:** ~30 lines from Data API CLI section (tables are now authoritative in generated output).

---

### PR 6 — Phase 39 (SessionGuidesModuleSource) — DONE

**Completed:** 2026-03-05. Included in current branch.

**CLAUDE.md trim achieved:** 160 lines of Session Workflows replaced by generated modules.

---

## Design Session Checklist

For each design session, follow this protocol:

```
1. [ ] Run pre-flight API queries (context, dep-tree, scope-validate)
2. [ ] Read the current spec file
3. [ ] Read all input files listed in the prompt
4. [ ] Refine spec: add exact line ranges, section headers, file paths
5. [ ] Add website impact deliverable if any docs are moved/renamed/deleted
6. [ ] Add CLAUDE.md trim deliverable identifying specific lines to remove
7. [ ] Verify all acceptance criteria are concrete and testable
8. [ ] Update deliverable table with Test Type column filled in
9. [ ] Run step-lint check: pnpm build && pnpm test (verify no parse errors)
10. [ ] Commit refined spec to branch
```

## Implementation Session Checklist

For each implementation session, follow this protocol:

```
1. [ ] Run pre-flight: pnpm process:query -- scope-validate <Pattern> implement
2. [ ] Run context: pnpm process:query -- context <Pattern> --session implement
3. [ ] Transition FSM to active FIRST (before any code)
4. [ ] For each deliverable: implement → test → mark complete
5. [ ] Trim identified CLAUDE.md lines (per tracker deliverable)
6. [ ] Regenerate docs: pnpm build && pnpm docs:all
7. [ ] Run full test suite: pnpm test
8. [ ] Transition FSM to completed (only if ALL deliverables done)
9. [ ] Run handoff: pnpm process:query -- handoff --pattern <Pattern>
10. [ ] Commit with descriptive message referencing phase number
```
