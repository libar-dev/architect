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

## Current Branch State (as of 2026-03-05, post Phase 37)

### Completed Phases

- **Phase 2+4 (ArchitectureDocRefactoring):** Committed (17 commits). ARCHITECTURE.md 1,287→358 lines. Convention-tag codec registry.
- **Phase 37 (DocsLiveConsolidation):** Unstaged. Reference docs consolidated into `docs-live/reference/`, compacts into `docs-live/_claude-md/architecture/`. `docs-generated/` reduced to intermediates only.

### Blockers

1. ~~**Test suite blocked** — `session-guides-module-source.feature:101`~~ **FIXED** — rephrased "When" → "Once".
2. **Unstaged changes** — Phase 37 implementation + generated docs need staging and commit.

### To Complete This PR

1. Stage and commit all Phase 37 changes + generated docs
2. Run full test suite to verify green (already verified: 122 files, 7941 tests pass)
3. Identify CLAUDE.md lines to trim (target: remove ~50 lines from Architecture section)

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

### Phase 38 — GeneratedDocQuality | IMPL-READY

**Pattern:** GeneratedDocQuality | **Effort:** 2d | **Depends on:** DocsLiveConsolidation

**What:** Fix REFERENCE-SAMPLE.md duplication, enrich Generation compact overview, add TOC to large reference docs.

**Deliverables (4, all pending):**

| #   | Deliverable                                   | Location                                        | Tests       |
| --- | --------------------------------------------- | ----------------------------------------------- | ----------- |
| 1   | REFERENCE-SAMPLE deduplication                | src/renderable/codecs/reference.ts              | unit        |
| 2   | Generation compact enrichment (5+ KB)         | src/generators/built-in/reference-generators.ts | integration |
| 3   | TOC on reference docs over 200 lines          | src/renderable/codecs/reference.ts              | unit        |
| 4   | Line-count regression guard (under 966 lines) | delivery-process.config.ts                      | integration |

**Website Impact:** Improves quality of all generated pages published at `/delivery-process/generated/` and `/delivery-process/product-areas/`.

**CLAUDE.md trim opportunity:** After quality improvements, the Guides section (104 lines, Product Area Enrichment) can be trimmed — the enrichment workflow is encoded in the spec + API queries.

**Pre-flight:**

```bash
pnpm process:query -- context GeneratedDocQuality --session implement
pnpm process:query -- files GeneratedDocQuality
```

---

### Phase 39 — SessionGuidesModuleSource | BLOCKED → DESIGN-NEEDED

**Pattern:** SessionGuidesModuleSource | **Effort:** 0.5d | **Depends on:** ClaudeModuleGeneration (Phase 25), DocsConsolidationStrategy

**What:** Replace hand-maintained CLAUDE.md "Session Workflows" section (160 lines) with generated `_claude-md/workflow/` modules. Retain `docs/SESSION-GUIDES.md` as public human reference.

**Current status:** BLOCKED on ClaudeModuleGeneration (Phase 25, not yet implemented). The annotation work (adding `@libar-docs-claude-module` tags) is immediately actionable but generation cannot be verified.

**Known issue:** Lint error at line 101 — "When ClaudeModuleGeneration..." starts with Gherkin keyword. Blocks entire test suite.

**CLAUDE.md trim opportunity:** This is the **highest-value** trim — 160 lines of Session Workflows replaced by generated modules. But blocked on Phase 25.

#### Design Session Prompt

```
Design session for SessionGuidesModuleSource (Phase 39).

IMPORTANT: This is a DESIGN session. Produce only spec refinements. No code.

Pre-flight:
  pnpm process:query -- context SessionGuidesModuleSource --session design
  pnpm process:query -- dep-tree SessionGuidesModuleSource

Goals:
1. FIX LINT ERROR: Line 101 starts with "When" (Gherkin keyword in description).
   Rephrase to unblock the test suite. This is the FIRST thing to do.

2. DEPENDENCY ASSESSMENT: Check if ClaudeModuleGeneration exists:
     pnpm process:query -- search ClaudeModuleGeneration
   Check if @libar-docs-claude-module tag is registered:
     grep -r 'claude-module' src/taxonomy/
   If neither exists, deliverables #5-#7 (generation) must be marked deferred.

3. SPLIT DECISION: Should this spec split into:
   - Phase 39a: Annotation work (add claude-module tags to ADR-001, ADR-003,
     PDR-001) — immediately actionable, zero risk
   - Phase 39b: Generation work — blocked on Phase 25
   Update the feature file accordingly.

4. ANNOTATION READINESS: For the actionable deliverables (#1-#4), verify:
   - ADR-001 and ADR-003 feature files exist and have Rule: blocks
   - PDR-001 exists (check delivery-process/decisions/)
   - Tags to add are valid per taxonomy

Input files:
- delivery-process/specs/session-guides-module-source.feature
- src/taxonomy/ (tag registration check)
- delivery-process/specs/claude-module-generation.feature (if exists)

Output: Updated feature file with lint fix, deferred deliverables if needed,
and annotation deliverables refined with specific file paths.
```

---

### Phase 40 — PublishingRelocation | DESIGN-NEEDED

**Pattern:** PublishingRelocation | **Effort:** 0.25d | **Depends on:** DocsConsolidationStrategy

**What:** Move `docs/PUBLISHING.md` (144 lines) to `MAINTAINERS.md` at repo root. Delete original.

**Current spec gaps:**

- No exact section headers listed
- No website manifest update deliverable
- No INDEX.md update deliverable

#### Design Session Prompt

```
Design session for PublishingRelocation (Phase 40).

IMPORTANT: This is a DESIGN session. Produce only spec refinements. No code.

Pre-flight:
  pnpm process:query -- context PublishingRelocation --session design
  pnpm process:query -- dep-tree PublishingRelocation

Goals:
1. SECTION AUDIT: Read docs/PUBLISHING.md. List every section header.
   These become the explicit content list in the spec deliverable.

2. WEBSITE IMPACT: The website manifest maps PUBLISHING.md to
   /delivery-process/guides/publishing/. After deletion:
   - Remove entry from content-manifest.mjs:
     { source: 'PUBLISHING.md', slug: 'publishing', order: 6 }
   - Decision: Does MAINTAINERS.md get published on the website? If yes, where?
     If no, the URL disappears (acceptable for internal-only content).
   Add deliverable for website manifest update.

3. INDEX.MD UPDATE: docs/INDEX.md links to PUBLISHING.md.
   Add deliverable to update INDEX.md cross-reference.

4. CROSS-REFERENCE SCAN: Check if any other docs link to PUBLISHING.md:
     grep -r 'PUBLISHING.md' docs/ docs-live/

Input files:
- delivery-process/specs/publishing-relocation.feature
- docs/PUBLISHING.md (enumerate headers)
- docs/INDEX.md (find link to update)
- ~/dev-projects/libar-dev-website/scripts/content-manifest.mjs (line 22)

Output: Updated feature file with section headers, website deliverable,
and INDEX.md deliverable.
```

---

### Phase 41 — GherkinPatternsRestructure | DESIGN-NEEDED

**Pattern:** GherkinPatternsRestructure | **Effort:** 0.5d | **Depends on:** DocsConsolidationStrategy

**What:** Trim `docs/GHERKIN-PATTERNS.md` from 515 → ~250 lines. Move "Step Linting" section (~148 lines) to `docs/VALIDATION.md`.

**Current spec gaps:**

- No exact line ranges for sections to move
- No specifics on which sections stay vs go
- VALIDATION.md integration point not defined

#### Design Session Prompt

```
Design session for GherkinPatternsRestructure (Phase 41).

IMPORTANT: This is a DESIGN session. Produce only spec refinements. No code.

Pre-flight:
  pnpm process:query -- context GherkinPatternsRestructure --session design

Goals:
1. SECTION MAP: Read docs/GHERKIN-PATTERNS.md (515 lines). For each section:
   | Section Header | Line Range | Action (keep/move/trim/remove) | Target |
   Achieve the target: 515 → ~250 lines = ~265 lines removed or moved.

2. STEP LINTING INTEGRATION: Read docs/VALIDATION.md (281 lines). Identify
   where the Step Linting section (~148 lines) fits. Does it become:
   - A new top-level section?
   - A subsection under existing validation content?
   - Merged with existing linting content?

3. WEBSITE CROSS-LINKS: Both pages are published on the website:
   - /delivery-process/guides/gherkin-patterns/ (loses content)
   - /delivery-process/reference/validation/ (gains content)
   Verify internal links between the two pages still work after the move.
   No manifest changes needed (files stay, content moves).

4. CLAUDE.MD OVERLAP: Check if CLAUDE.md's "Testing" section (275 lines)
   duplicates any GHERKIN-PATTERNS.md content. If so, identify candidates
   for trimming from CLAUDE.md in the implementation PR.

Input files:
- delivery-process/specs/gherkin-patterns-restructure.feature
- docs/GHERKIN-PATTERNS.md (full section audit)
- docs/VALIDATION.md (integration target)
- CLAUDE.md lines 246-520 (Testing section, check overlap)

Output: Updated feature file with section disposition table including
exact line ranges and target locations.
```

---

### Phase 42 — ReadmeRationalization | DESIGN-NEEDED

**Pattern:** ReadmeRationalization | **Effort:** 0.5d | **Depends on:** DocsConsolidationStrategy

**What:** Trim `README.md` from 504 → ~150 lines. Extract enterprise pitch content for the website landing page.

**Current spec gaps:**

- No section-by-section disposition
- No current line ranges
- No website content brief deliverable

#### Design Session Prompt

```
Design session for ReadmeRationalization (Phase 42).

IMPORTANT: This is a DESIGN session. Produce only spec refinements. No code.

Pre-flight:
  pnpm process:query -- context ReadmeRationalization --session design

Goals:
1. FULL SECTION AUDIT: Read README.md (504 lines). Build a disposition table:
   | Section Header | Line Range | Lines | Action | Rationale |
   Actions: KEEP, TRIM (with target line count), EXTRACT (to website),
   REMOVE (redundant with docs/).
   The kept sections must total ~150 lines.

2. WEBSITE LANDING PAGE CONTENT: The libar-dev-website landing page
   (src/pages/index.astro) has only a Hero section. Sections marked EXTRACT
   become raw material for the website's Pipeline, Capabilities, and
   Comparison sections. Create a content brief deliverable listing:
   - Which README sections map to which website sections
   - Key claims/tables to preserve in website form

3. GETTING-STARTED IMPACT: The website publishes README.md as
   /delivery-process/getting-started/. After trimming from 504 to 150 lines,
   this page changes dramatically. Verify the remaining content serves a
   first-time visitor (install + quick example + links to guides).

4. LINK AUDIT: After trimming, verify all remaining links in README.md
   resolve to valid targets. List any that need updating.

Input files:
- delivery-process/specs/readme-rationalization.feature
- README.md (full audit, 504 lines)
- ~/dev-projects/libar-dev-website/src/pages/index.astro (landing page)

Output: Updated feature file with complete section disposition table and
website content brief deliverable.
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
