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

## Current Branch State (as of 2026-03-05, post Phase 38)

### Completed Phases

- **Phase 2+4 (ArchitectureDocRefactoring):** Committed (17 commits). ARCHITECTURE.md 1,287→358 lines. Convention-tag codec registry.
- **Phase 37 (DocsLiveConsolidation):** Committed. Reference docs consolidated into `docs-live/reference/`, compacts into `docs-live/_claude-md/architecture/`. `docs-generated/` reduced to intermediates only.
- **Phase 38 (GeneratedDocQuality):** Implemented. Duplicate tables fixed, Generation compact enriched (4.3 KB), ARCHITECTURE-TYPES reordered (types first), TOC added to all product area docs. 123 test files, 7,972 tests passing.

### Blockers

None.

### To Complete This PR

1. Commit Phase 38 changes + regenerated docs
2. Run final test suite verification (already verified: 123 files, 7972 tests pass)
3. Identify CLAUDE.md lines to trim (target: remove ~80 lines from Guides section)

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

### Phase 39 — SessionGuidesModuleSource | DESIGN COMPLETE

**Pattern:** SessionGuidesModuleSource | **Effort:** 0.5d | **Depends on:** ClaudeModuleGeneration (Phase 25), DocsConsolidationStrategy

**What:** Replace hand-maintained CLAUDE.md "Session Workflows" section (160 lines) with generated `_claude-md/workflow/` modules. Retain `docs/SESSION-GUIDES.md` as public human reference.

**Current status:** DESIGN COMPLETE. Spec revised with 9 Rule blocks capturing session workflow invariants. Generation deliverables (#4-#7) deferred pending Phase 25.

**CLAUDE.md trim opportunity:** This is the **highest-value** trim — 160 lines of Session Workflows replaced by generated modules. Blocked on Phase 25 for generation, but Rule blocks are immediately queryable via `pnpm process:query -- rules`.

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                         | Impact                                                   | Resolution                                                 |
| ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| `claude-module` is file-level, not Rule-level   | Cannot selectively tag individual Rules in ADR/PDR files | Removed deliverables #2-#4 (tag ADR-001, ADR-003, PDR-001) |
| ADR-001 has 9 Rules, only 2-3 workflow-relevant | Tagging ADR-001 would create noisy, diluted context      | Spec itself captures workflow invariants as Rule blocks    |
| PDR-001 Rules are CLI implementation decisions  | Not session workflow guidance, wrong audience            | Removed from scope entirely                                |
| Phase 25 `claude-section` enum lacks `workflow` | Must add value before annotation works                   | Added `workflow` to Phase 25 spec enum (complete)          |
| Lint error (line 101) already fixed in Phase 37 | No action needed                                         | Confirmed: "Once ClaudeModuleGeneration..."                |

**Deliverables (7, 1 complete, 3 pending, 3 deferred):**

| #   | Deliverable                                                                                            | Status   | Location                                                    |
| --- | ------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------- |
| 1   | Session workflow behavior spec with Rule blocks (9 Rules: session types, FSM, escape hatches, handoff) | pending  | delivery-process/specs/session-guides-module-source.feature |
| 2   | Verify SESSION-GUIDES.md retained with correct INDEX.md links                                          | pending  | docs/SESSION-GUIDES.md                                      |
| 3   | Add `workflow` to Phase 25 claude-section enum                                                         | complete | delivery-process/specs/claude-module-generation.feature     |
| 4   | Add claude-module and claude-section:workflow tags to this spec                                        | deferred | delivery-process/specs/session-guides-module-source.feature |
| 5   | Generated \_claude-md/workflow/session-workflows.md replaces hand-written                              | deferred | \_claude-md/workflow/session-workflows.md                   |
| 6   | Generated \_claude-md/workflow/fsm-handoff.md replaces hand-written                                    | deferred | \_claude-md/workflow/fsm-handoff.md                         |
| 7   | CLAUDE.md Session Workflows section replaced with modular-claude-md include                            | deferred | CLAUDE.md                                                   |

**Changes made (2 files):**

| File                                                          | Change                                                                                                                                                                                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delivery-process/specs/session-guides-module-source.feature` | Complete rewrite: new deliverables table (removed flawed ADR/PDR tagging), added 6 new Rule blocks (session types, planning, design, implementation, FSM errors, handoff), updated 3 existing Rules, added design findings table |
| `delivery-process/specs/claude-module-generation.feature`     | Added `"workflow"` to claude-section enum values (line 86)                                                                                                                                                                       |

**Result:**

- 9 Rule blocks capture all session workflow invariants from `_claude-md/workflow/` hand-written files
- Queryable immediately: `pnpm process:query -- rules SessionGuidesModuleSource`
- 123 test files, 7,972 tests all passing

**Next steps (implementation session):**

1. Deliverable #1 can be marked complete — the Rule blocks ARE the deliverable (self-referential)
2. Deliverable #2 verification: SESSION-GUIDES.md (389 lines) exists, INDEX.md links confirmed (4 references)
3. Deliverables #4-#7 remain deferred until Phase 25 ships

---

### Phase 40 — PublishingRelocation | DESIGN COMPLETE

**Pattern:** PublishingRelocation | **Effort:** 0.25d | **Depends on:** DocsConsolidationStrategy

**What:** Move `docs/PUBLISHING.md` (144 lines) to `MAINTAINERS.md` at repo root. Delete original. Update INDEX.md and website manifest.

**Current status:** DESIGN COMPLETE. Spec refined with 3 Rule blocks, 5 deliverables (up from 2), full section audit, and website impact analysis. Fixed stale "Phase 6" reference.

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

**Deliverables (5, all pending):**

| #   | Deliverable                                                         | Status  | Location                                       |
| --- | ------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| 1   | Create MAINTAINERS.md at repo root with all PUBLISHING.md content   | pending | MAINTAINERS.md                                 |
| 2   | Delete docs/PUBLISHING.md                                           | pending | docs/PUBLISHING.md                             |
| 3   | Remove PUBLISHING.md entries from docs/INDEX.md (3 locations)       | pending | docs/INDEX.md                                  |
| 4   | Remove PUBLISHING.md from website content-manifest.mjs guides array | pending | libar-dev-website/scripts/content-manifest.mjs |
| 5   | Add MAINTAINERS.md link rewrite to content-manifest.mjs             | pending | libar-dev-website/scripts/content-manifest.mjs |

**Changes made (1 file):**

| File                                                   | Change                                                                                                                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delivery-process/specs/publishing-relocation.feature` | Added 3 new deliverables, full section audit table (8 H2s, 6 H3s), design findings table, new Rule 3 (cross-references and website manifest), fixed "Phase 6" reference, expanded Rule 1 invariant with H2 enumeration |

**Result:**

- 3 Rule blocks with concrete invariants and acceptance criteria
- 5 deliverables covering file move, deletion, INDEX.md cleanup, manifest removal, and link rewrite
- 123 test files, 7,972 tests all passing

**Next steps (implementation session):**

1. Create MAINTAINERS.md (pure copy with H1 rename to "Maintainer Guide")
2. Delete docs/PUBLISHING.md
3. Remove 3 references from docs/INDEX.md
4. Update libar-dev-website content-manifest.mjs (remove entry + add link rewrite)
5. Regenerate docs: `pnpm build && pnpm docs:all`

**Pre-flight:**

```bash
pnpm process:query -- context PublishingRelocation --session implement
pnpm process:query -- files PublishingRelocation
```

---

### Phase 41 — GherkinPatternsRestructure | DESIGN COMPLETE

**Pattern:** GherkinPatternsRestructure | **Effort:** 0.5d | **Depends on:** DocsConsolidationStrategy

**What:** Move Step Linting section (148 lines) from `docs/GHERKIN-PATTERNS.md` to `docs/VALIDATION.md`. Trim GHERKIN-PATTERNS.md from 515 → ~370 lines (revised from original ~250 target after section audit).

**Current status:** DESIGN COMPLETE. Spec refined with section disposition table, exact line ranges, VALIDATION.md integration point, and 3 Rule blocks. Line target revised from ~250 to ~370 based on audit findings.

#### Design Session Report (2026-03-05)

**Key findings that changed the plan:**

| Finding                                                      | Impact                                                                         | Resolution                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Only Step Linting (148 lines) is misplaced content           | Original ~250 target required removing 116 lines of valid authoring content    | Revised target to ~370 lines — all remaining content is legitimate guide material                              |
| VALIDATION.md line 96 is a redirect pointer                  | lint-steps is the only tool of 4 without inline documentation                  | Replace redirect with full content — lint-steps becomes self-contained like the other 3 tools                  |
| CLAUDE.md Testing section (274 lines) overlaps significantly | Two-Pattern Problem, vitest-cucumber Rules, Hash Comments all cover same rules | Overlap is intentional: CLAUDE.md = AI debugging "why", lint-steps = tool reference "what". No trim this phase |
| 7 cross-reference locations identified                       | INDEX.md needs section table + line count updates for both docs                | Added deliverable #5 for INDEX.md updates                                                                      |
| Website manifest unaffected                                  | Both files stay at existing URLs, only content moves                           | No manifest changes needed                                                                                     |

**Deliverables (6, all pending):**

| #   | Deliverable                                                                               | Status  | Location                                     |
| --- | ----------------------------------------------------------------------------------------- | ------- | -------------------------------------------- |
| 1   | Move Step Linting section (lines 346-493) to VALIDATION.md, replacing redirect at line 96 | pending | docs/VALIDATION.md                           |
| 2   | Remove Step Linting section from GHERKIN-PATTERNS.md (result: ~370 lines)                 | pending | docs/GHERKIN-PATTERNS.md                     |
| 3   | Update cross-references between the two docs                                              | pending | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md |
| 4   | Verify related-documentation tables in both files                                         | pending | docs/GHERKIN-PATTERNS.md, docs/VALIDATION.md |
| 5   | Update INDEX.md section tables and line counts for both docs                              | pending | docs/INDEX.md                                |
| 6   | Add lint-steps cross-reference row in GHERKIN-PATTERNS.md Quick Reference                 | pending | docs/GHERKIN-PATTERNS.md                     |

**Changes made (1 file):**

| File                                                          | Change                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `delivery-process/specs/gherkin-patterns-restructure.feature` | Complete rewrite: revised line target (250→370), added section disposition table, added design findings table, added deliverables #5-#6, added Rule block for INDEX.md updates, refined existing deliverables with exact line ranges |

**Result:**

- Spec has exact line ranges for every section (keep/move disposition)
- VALIDATION.md integration point defined: replace lines 76-98 (redirect → inline content)
- 7 cross-reference locations mapped (4 need updates, 4 confirmed still accurate)
- CLAUDE.md overlap analyzed — no trim this phase (intentional dual-purpose content)
- 123 test files, 7,972 tests all passing

**CLAUDE.md trim opportunity:** None from this phase. The ~60 lines estimated in the tracker for Validation section trimming is better addressed by a future phase replacing CLAUDE.md Validation content (lines 521+) with Data API queries.

**Next steps (implementation session):**

1. Move Step Linting content (GHERKIN-PATTERNS.md lines 346-493 → VALIDATION.md replacing lines 76-98)
2. Update Quick Reference table in GHERKIN-PATTERNS.md
3. Update all 7 cross-reference locations
4. Update INDEX.md section tables and line counts

**Pre-flight:**

```bash
pnpm process:query -- context GherkinPatternsRestructure --session implement
pnpm process:query -- files GherkinPatternsRestructure
```

---

### Phase 42 — ReadmeRationalization | DESIGN COMPLETE

**Pattern:** ReadmeRationalization | **Effort:** 0.5d | **Depends on:** DocsConsolidationStrategy

**What:** Trim `README.md` from 504 → ~150 lines. Enterprise pitch content already fully covered by 9 website landing page components — extraction is pure deletion with zero content loss.

**Current status:** DESIGN COMPLETE. Spec refined with 18-section disposition table, 7 design findings, 6 deliverables (up from 4), 3 Rule blocks, README-to-website component mapping, and link audit.

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

**Deliverables (6, all pending):**

| #   | Deliverable                                                                         | Status  | Location      |
| --- | ----------------------------------------------------------------------------------- | ------- | ------------- |
| 1   | Trim README.md to ~150 lines per section disposition table                          | pending | README.md     |
| 2   | Remove Configuration section (lines 441-474) duplicating docs/CONFIGURATION.md      | pending | README.md     |
| 3   | Document README-to-website component mapping for extracted enterprise sections      | pending | spec file     |
| 4   | Verify all retained links in trimmed README resolve to valid targets                | pending | README.md     |
| 5   | Update INDEX.md Quick Navigation line count for README (1-504 → ~1-150)             | pending | docs/INDEX.md |
| 6   | Verify trimmed README serves as effective getting-started page at /getting-started/ | pending | README.md     |

**Changes made (1 file):**

| File                                                    | Change                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delivery-process/specs/readme-rationalization.feature` | Complete rewrite: 18-section disposition table with line ranges, 7 design findings table, README-to-website component mapping (5 EXTRACT sections → 5 website components), updated deliverables (4→6), expanded Rule 1 with section enumeration, new Rule 3 for getting-started page integrity |

**Result:**

- 18 sections audited with exact line ranges and KEEP/TRIM/EXTRACT/REMOVE disposition
- Line count math validated: KEEP (15) + TRIM (121) + separators (6) = ~142 lines
- 5 EXTRACT sections mapped to existing website components (Metrics, Pillars, DataAPI, Workflows)
- All retained links verified valid; one broken anchor identified (`#configuration` → deleted section)
- 123 test files, 7,972 tests all passing

**CLAUDE.md trim opportunity:** ~50 lines from Project Overview section (replace with `overview` command).

**Next steps (implementation session):**

1. Trim README.md per disposition table (504 → ~150 lines)
2. Fix `#configuration` anchor → `docs/CONFIGURATION.md` link
3. Update INDEX.md line count (line 22: 1-504 → ~1-150)
4. Verify /getting-started/ page alignment

**Pre-flight:**

```bash
pnpm process:query -- context ReadmeRationalization --session implement
pnpm process:query -- files ReadmeRationalization
```

---

### Phase 43 — ProcessApiHybridGeneration | IMPL-READY

**Pattern:** ProcessApiHybridGeneration | **Effort:** 1d | **Depends on:** DocsConsolidationStrategy

**What:** Generate the 3 reference tables in `docs/PROCESS-API.md` from CLI parser source. Keep narrative prose manual.

**Deliverables (4, all pending):**

| #   | Deliverable                          | Location                   | Tests       |
| --- | ------------------------------------ | -------------------------- | ----------- |
| 1   | CLI schema extraction from parser    | src/cli/parser.ts          | integration |
| 2   | ProcessApiCodec for table generation | src/renderable/codecs/     | integration |
| 3   | Hybrid PROCESS-API.md output         | docs/PROCESS-API.md        | integration |
| 4   | Reference doc config entry           | delivery-process.config.ts | integration |

**Why impl-ready:** The `cli-patterns` convention tag already exists in taxonomy. The preamble capability is complete. The spec identifies exact tables to generate (Global Options, Output Modifiers, List Filters).

**CLAUDE.md trim opportunity:** After this, the "Data API CLI" section (66 lines) could be trimmed since the generated tables are authoritative.

**Pre-flight:**

```bash
pnpm process:query -- context ProcessApiHybridGeneration --session implement
pnpm process:query -- files ProcessApiHybridGeneration
```

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

### PR 6 — Phase 39 (SessionGuidesModuleSource) — DEFERRED

**Blocked on:** ClaudeModuleGeneration (Phase 25).

**When unblocked:** This is the highest-value CLAUDE.md trim (160 lines of Session Workflows).

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
