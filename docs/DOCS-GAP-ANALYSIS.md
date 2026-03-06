# Documentation Gap Analysis: docs/ vs docs-live/

> **Purpose:** Input document for planning and design sessions to close the gap between
> manual reference docs (`docs/`) and auto-generated docs (`docs-live/`), ultimately
> enabling deprecation of manual docs when generated quality is sufficient.
>
> **Date:** 2026-03-06
> **Branch:** feature/docs-consolidation (commit 223ace6)
> **Status:** Analysis complete, ready for spec authoring

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Related Specs & Prior Work](#2-related-specs--prior-work)
3. [Consolidation Mechanism](#3-consolidation-mechanism)
4. [Current State](#4-current-state)
5. [Website Publishing Pipeline](#5-website-publishing-pipeline)
6. [File-by-File Gap Analysis](#6-file-by-file-gap-analysis)
7. [Cross-Cutting Quality Gaps](#7-cross-cutting-quality-gaps)
8. [Unused Generation Capabilities](#8-unused-generation-capabilities)
9. [Website Sync Script Gaps](#9-website-sync-script-gaps)
10. [Recommended Work Packages](#10-recommended-work-packages)
11. [Prioritization Matrix](#11-prioritization-matrix)
12. [Appendix: File Inventories](#12-appendix-file-inventories)

---

## 1. Executive Summary

### The Goal

Replace all 11 manual docs in `docs/` with auto-generated equivalents in `docs-live/`
of **equal or better quality**, enabling:

- Zero manual documentation maintenance
- Single source of truth (annotated code drives everything)
- Automatic website publishing via the existing Starlight pipeline

### Key Findings

| Dimension                 | Current State                                                | Gap                                                                      |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Manual docs**           | 11 files, ~4,537 lines                                       | Curated editorial content, examples, decision trees                      |
| **Generated docs**        | 48 files, ~20,548 lines                                      | Comprehensive reference, but missing tutorials/guides/philosophy         |
| **Website sync**          | Reads from 3 dirs (`docs/`, `docs-live/`, `docs-generated/`) | `docs-generated/` is now empty after consolidation; sync script is stale |
| **Generation pipeline**   | 22 codecs exist, only 8 run in `docs:all`                    | 14 codecs available but unused for published docs                        |
| **Content types missing** | N/A                                                          | How-to guides, decision trees, getting-started, philosophy, CI recipes   |

### The Core Challenge

Manual docs contain three content types that current codecs cannot generate:

1. **Editorial content** (philosophy, analogies, design rationale beyond Rule: blocks)
2. **Procedural guides** (step-by-step checklists, decision trees, CLI recipes)
3. **Integration patterns** (CI/CD setup, pre-commit hooks, GitHub Actions examples)

These require either new codec capabilities or a hybrid approach where some
curated content is maintained alongside generated reference material.

---

## 2. Related Specs & Prior Work

### Master Roadmap: DocsConsolidationStrategy

**Spec:** `delivery-process/specs/docs-consolidation-strategy.feature`
**Status:** roadmap | **Phase:** 35 | **Depends on:** CodecDrivenReferenceGeneration (completed)

This is the **canonical plan** for the entire consolidation initiative. It defines a
6-phase strategy with 13 deliverables to replace ~5,400 lines of manual docs with
generated equivalents. Work packages in this gap analysis should map to its phases.

**Deliverable Status (from spec Background):**

| Deliverable                                 | Status   | Phase | Maps to WP                                      |
| ------------------------------------------- | -------- | ----- | ----------------------------------------------- |
| Preamble capability on ReferenceDocConfig   | complete | --    | N/A (done)                                      |
| Phase 1 - Taxonomy consolidation            | pending  | 35    | Taxonomy deprecation                            |
| Phase 2 - Codec listings extraction         | complete | 35    | N/A (done)                                      |
| Phase 3 - Process Guard consolidation       | pending  | 35    | WP-5                                            |
| Phase 4 - Architecture decomposition        | complete | 35    | N/A (done)                                      |
| Phase 5 - Guide trimming                    | pending  | 35    | WP-9                                            |
| Phase 6 - Index navigation update           | pending  | 35    | WP-2                                            |
| Phase 37 - docs-live/ consolidation         | complete | 37    | N/A (done, commit 223ace6)                      |
| Phase 38 - Generated doc quality            | pending  | 38    | WP-9                                            |
| Phase 39 - Session workflow module gen      | pending  | 39    | Blocked on Phase 25                             |
| Phase 40 - PUBLISHING.md relocation         | complete | 40    | N/A (done)                                      |
| Phase 41 - GHERKIN-PATTERNS.md restructure  | pending  | 41    | WP-7                                            |
| Phase 42 - README.md rationalization        | pending  | 42    | Not in this analysis                            |
| Phase 43 - PROCESS-API.md hybrid generation | complete | 43    | N/A (done); WP-6 extends with recipe generation |

**Key Invariants from Spec:**

1. **Convention tags are the primary consolidation mechanism** -- each phase registers a
   convention tag, annotates sources, adds a ReferenceDocConfig entry, and replaces the
   manual section with a pointer to generated output.
2. **Preamble preserves editorial context** -- `ReferenceDocConfig.preamble` accepts
   `SectionBlock[]` prepended before generated content for introductory prose.
3. **Each phase is independently deliverable** -- no phase requires another to function.
4. **Manual docs retain editorial and tutorial content** -- ~2,300 lines of philosophy,
   workflow guides, and tutorials stay manual.
5. **Audience alignment determines location** -- `docs/` for website users, repo root for
   GitHub metadata, CLAUDE.md for AI sessions.

### All Related Specs

| Spec                                         | Pattern                         | Status    | Phase | Role in Gap Analysis                             |
| -------------------------------------------- | ------------------------------- | --------- | ----- | ------------------------------------------------ |
| `docs-consolidation-strategy.feature`        | DocsConsolidationStrategy       | roadmap   | 35    | Master roadmap for all consolidation work        |
| `docs-live-consolidation.feature`            | DocsLiveConsolidation           | completed | 37    | Established docs-live/ as single output dir      |
| `publishing-relocation.feature`              | PublishingRelocation            | completed | 40    | Moved PUBLISHING.md to MAINTAINERS.md            |
| `codec-driven-reference-generation.feature`  | CodecDrivenReferenceGeneration  | completed | 27    | Foundation: config-driven codec factory          |
| `doc-generation-proof-of-concept.feature`    | DocGenerationProofOfConcept     | completed | 27    | Historical: ADR-021 POC (superseded)             |
| `process-api-hybrid-generation.feature`      | ProcessApiHybridGeneration      | completed | 43    | CLI schema as single source for reference tables |
| `claude-module-generation.feature`           | ClaudeModuleGeneration          | completed | 25    | Claude module tags + behavior spec sourcing      |
| `reference-doc-showcase.feature`             | ReferenceDocShowcase            | completed | 30    | All 9 content block types across 3 detail levels |
| `validator-read-model-consolidation.feature` | ValidatorReadModelConsolidation | completed | 100   | MasterDataset as single read model (ADR-006)     |

**Query these specs:** `pnpm process:query -- decisions DocsConsolidationStrategy`

### Completed Foundation Work

The following capabilities are already in place and available for new work:

- **Config-driven codec factory** (`createReferenceCodec`) -- add a `ReferenceDocConfig`
  entry and get detailed + summary docs automatically (CodecDrivenReferenceGeneration)
- **Preamble support** -- editorial prose can be prepended to any generated doc
- **3 detail levels** -- detailed, standard, summary from same codec (ReferenceDocShowcase)
- **9 content block types** -- headings, paragraphs, tables, code, mermaid, lists, sections,
  metadata, collapsible (all exercised in REFERENCE-SAMPLE.md)
- **CLI schema extraction** -- `src/cli/cli-schema.ts` drives both help text and doc generation
- **Convention tag mechanism** -- `@libar-docs-convention` annotations compose into reference docs
- **Product area meta with diagram scopes** -- C4Context + graph LR per area

---

## 3. Consolidation Mechanism

Understanding how consolidation works is essential for design sessions. The mechanism
is defined in DocsConsolidationStrategy Rule 1 and implemented by CodecDrivenReferenceGeneration.

### How Convention Tags Drive Generation

```
Step 1: Register convention tag value in src/taxonomy/conventions.ts
          e.g., 'codec-registry', 'pipeline-architecture', 'taxonomy-rules'

Step 2: Annotate source files with @libar-docs-convention:<value>
          TypeScript: JSDoc blocks with structured content
          Gherkin: Rule: blocks with Invariant/Rationale markers

Step 3: Add ReferenceDocConfig in delivery-process.config.ts
          {
            title: 'Available Codecs Reference',
            conventionTags: ['codec-registry'],     // <-- matches step 2
            docsFilename: 'ARCHITECTURE-CODECS.md',
            claudeMdFilename: 'architecture-codecs.md',
            claudeMdSection: 'architecture',
          }

Step 4: pnpm docs:all generates:
          docs-live/reference/ARCHITECTURE-CODECS.md     (detailed)
          docs-live/_claude-md/architecture/architecture-codecs.md (summary)

Step 5: Replace manual doc section with pointer to generated output
```

### Content Sources Available in ReferenceDocConfig

| Source                 | Config Field                      | What It Produces                                                         |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| Convention annotations | `conventionTags`                  | Structured prose from JSDoc/Gherkin                                      |
| Type shapes            | `shapeSelectors` / `shapeSources` | TypeScript type definitions with field docs                              |
| Behavior specs         | `behaviorCategories`              | Rule invariants, scenarios, acceptance criteria                          |
| Diagrams               | `diagramScopes`                   | Mermaid C4Context, graph LR, classDiagram, stateDiagram, sequenceDiagram |
| Include tags           | `includeTags`                     | Filter patterns by tag for scoped reference                              |
| Editorial preamble     | `preamble`                        | Hand-authored SectionBlock[] prepended to output                         |

### Existing Convention Tags (from delivery-process.config.ts)

| Tag Value               | Used By                | Produces                             |
| ----------------------- | ---------------------- | ------------------------------------ |
| `codec-registry`        | ARCHITECTURE-CODECS.md | All 20 codecs with factory patterns  |
| `pipeline-architecture` | ARCHITECTURE-TYPES.md  | MasterDataset interface, shapes      |
| `taxonomy-rules`        | REFERENCE-SAMPLE.md    | Tag rules + 6 diagram types showcase |

### What This Means for New Work

To consolidate a manual doc section, a design session needs to decide:

1. **Which convention tag value** to register (or reuse existing)
2. **Which source files** to annotate with `@libar-docs-convention:<value>`
3. **What content structure** the JSDoc/Gherkin annotations should use
4. **Which ReferenceDocConfig fields** to populate (shapes? diagrams? behaviors?)
5. **Whether preamble** is needed for editorial context that can't be annotated
6. **Output filenames** and whether to add a new website sync section

This is a well-established pattern with 3 successful implementations. New phases
should follow the same recipe.

---

## 4. Current State

### Directory Layout After Commit 223ace6

```
delivery-process/
  docs/              11 manual files (~4,985 lines)  -- human-authored reference
  docs-live/         48 generated files (~20,548 lines) -- auto-generated, committed
  docs-generated/    empty after pnpm docs:all       -- gitignored build cache
  _claude-md/        10 AI-optimized compacts         -- composed into CLAUDE.md
```

### What `pnpm docs:all` Generates (9 generators)

| Generator               | Output Location           | Files | Content                                          |
| ----------------------- | ------------------------- | ----- | ------------------------------------------------ |
| `adrs`                  | docs-live/decisions/      | 8     | ADR index + 7 individual ADRs                    |
| `business-rules`        | docs-live/business-rules/ | 8     | Overview + 7 area breakdowns (569 rules)         |
| `taxonomy`              | docs-live/taxonomy/       | 4     | Overview + categories, formats, metadata tags    |
| `validation-rules`      | docs-live/validation/     | 4     | Overview + error catalog, FSM, protection levels |
| `reference-docs`        | docs-live/reference/      | 4     | Codecs, types, process-API ref, sample           |
| `product-area-docs`     | docs-live/product-areas/  | 8     | Overview + 7 area docs with diagrams             |
| `claude-modules`        | docs-live/\_claude-md/    | 10    | Compact AI context modules                       |
| `process-api-reference` | docs-live/reference/      | 1     | CLI command reference                            |
| `cli-recipe`            | docs-live/reference/      | 1     | CLI recipes & workflow guide                     |

### What `pnpm docs:all-preview` Adds (14 more generators)

These exist and are functional but NOT in the standard build:

| Generator          | Would Produce                    | Potential Value for Website   |
| ------------------ | -------------------------------- | ----------------------------- |
| `patterns`         | PATTERNS.md + per-pattern detail | High -- pattern catalog       |
| `roadmap`          | ROADMAP.md + per-phase detail    | Medium -- project status      |
| `milestones`       | COMPLETED-MILESTONES.md          | Low -- internal tracking      |
| `requirements`     | PRODUCT-REQUIREMENTS.md          | Medium -- feature specs       |
| `session`          | SESSION-CONTEXT.md               | Low -- ephemeral session data |
| `remaining`        | REMAINING-WORK.md                | Low -- internal tracking      |
| `current`          | CURRENT-WORK.md                  | Low -- internal tracking      |
| `session-plan`     | SESSION-PLAN.md                  | Low -- ephemeral              |
| `session-findings` | SESSION-FINDINGS.md              | Low -- internal               |
| `pr-changes`       | PR-CHANGES.md                    | Low -- per-PR artifact        |
| `changelog`        | CHANGELOG-GENERATED.md           | High -- release history       |
| `traceability`     | TRACEABILITY.md                  | Medium -- spec coverage       |
| `architecture`     | ARCHITECTURE.md                  | High -- architecture diagrams |
| `overview-rdm`     | OVERVIEW.md                      | Medium -- project overview    |

---

## 5. Website Publishing Pipeline

### Framework

- **Astro + Starlight** (v0.37.6) with Mermaid rendering support
- Content synced at build time via `scripts/sync-content.mjs`
- Markdown processed: H1 stripped, frontmatter injected, links rewritten

### Sync Script Architecture

```
sync-content.mjs
  reads: content-manifest.mjs (section structure, link rewrites)
  sources:
    docs/           -> guides/ + reference/     (manual docs)
    docs-live/      -> product-areas/ + decisions/  (generated)
    docs-generated/ -> generated/               (business-rules, taxonomy)
  output: src/content/docs/delivery-process/
```

### Website Section Structure (from content-manifest.mjs)

| Section                | Directory      | Source                                     | Collapsed |
| ---------------------- | -------------- | ------------------------------------------ | --------- |
| Tutorial               | tutorial/      | delivery-process-tutorials repo            | No        |
| Guides                 | guides/        | docs/ manual (5 files)                     | No        |
| Reference              | reference/     | docs/ manual (5 files)                     | No        |
| Product Areas          | product-areas/ | docs-live/product-areas/                   | No        |
| Architecture Decisions | decisions/     | docs-live/decisions/                       | Yes       |
| Generated Reference    | generated/     | docs-generated/ (business-rules, taxonomy) | Yes       |

### CRITICAL: Sync Script is Stale After Consolidation

The sync script (`sync-content.mjs`) has a **blocking issue**:

| Problem                                        | Detail                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `docsGenerated` still required                 | Line 78-83: resolves `docs-generated/` as a source                                      |
| Required source files expect `docs-generated/` | Lines 112-113: expects `BUSINESS-RULES.md` and `TAXONOMY.md` in `docs-generated/`       |
| `syncGenerated()` reads from `docs-generated/` | Lines 456-503: business-rules, taxonomy, reference-sample synced from `docs-generated/` |
| **But `docs-generated/` is now empty**         | After commit 223ace6, `pnpm docs:all` outputs everything to `docs-live/`                |
| Impact                                         | Website build will warn (non-strict) or fail (strict/CI) for business-rules + taxonomy  |

**Fix required:** Update sync script to read business-rules, taxonomy, validation, and
reference content from `docs-live/` instead of `docs-generated/`.

### Content NOT Currently Synced to Website

These `docs-live/` subdirectories exist but have no sync function:

| Directory                       | Files    | Content                                                                                                              |
| ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `docs-live/reference/`          | 5 files  | ARCHITECTURE-CODECS.md, ARCHITECTURE-TYPES.md, PROCESS-API-RECIPES.md, PROCESS-API-REFERENCE.md, REFERENCE-SAMPLE.md |
| `docs-live/taxonomy/`           | 3 files  | categories.md, format-types.md, metadata-tags.md                                                                     |
| `docs-live/validation/`         | 3 files  | error-catalog.md, fsm-transitions.md, protection-levels.md                                                           |
| `docs-live/business-rules/`     | 7 files  | Per-area business rule extractions                                                                                   |
| `docs-live/_claude-md/`         | 10 files | AI context (may not need website publishing)                                                                         |
| `docs-live/INDEX.md`            | 1 file   | Generated docs master index                                                                                          |
| `docs-live/TAXONOMY.md`         | 1 file   | Taxonomy overview                                                                                                    |
| `docs-live/VALIDATION-RULES.md` | 1 file   | Validation rules overview                                                                                            |
| `docs-live/BUSINESS-RULES.md`   | 1 file   | Business rules overview                                                                                              |

---

## 6. File-by-File Gap Analysis

### Legend

- **Replacement Ready**: Generated equivalent exists and is comparable quality
- **Partial Coverage**: Generated docs cover some content, gaps remain
- **No Coverage**: No generated equivalent exists; content is editorial/procedural

### docs/ Files vs docs-live/ Equivalents

| Manual Doc              | Lines | Generated Equivalent                                                                                                                                                 | Coverage     | Gap Description                                                                                                                                                                                                                                                                                     |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **INDEX.md**            | 353   | docs-live/INDEX.md (112 lines)                                                                                                                                       | Partial      | Manual has audience-based reading orders, document roles matrix, codec reference table. Generated has only file listing with regeneration commands.                                                                                                                                                 |
| **METHODOLOGY.md**      | 238   | None                                                                                                                                                                 | None         | Core thesis (USDP inversion), event sourcing analogy, dogfooding examples, design philosophy. Pure editorial -- no annotation source exists for this content.                                                                                                                                       |
| **CONFIGURATION.md**    | 357   | docs-live/product-areas/CONFIGURATION.md (1,082 lines)                                                                                                               | Partial      | Generated has exhaustive pattern listings but lacks: preset selection rationale, decision rules ("when to use each preset"), monorepo setup example, backward compatibility guide, programmatic config loading examples.                                                                            |
| **SESSION-GUIDES.md**   | 389   | docs-live/\_claude-md/process/process-overview.md (138 lines)                                                                                                        | Minimal      | Decision tree for choosing session type, step-by-step checklists per session type, handoff documentation templates, "Do NOT" lists. Generated compact is AI-focused, not developer-facing.                                                                                                          |
| **ARCHITECTURE.md**     | 1,638 | docs-live/product-areas/GENERATION.md (1,065 lines) + docs-live/reference/ARCHITECTURE-CODECS.md (630 lines) + docs-live/reference/ARCHITECTURE-TYPES.md (429 lines) | Partial      | Generated covers pipeline stages and codec listings well. Missing: executive summary, data flow diagrams, workflow integration section, "Extending the System" guide, programmatic usage examples, quick reference card.                                                                            |
| **GHERKIN-PATTERNS.md** | 366   | None                                                                                                                                                                 | None         | Authoring style guide: 4 essential patterns, DataTable/DocString usage, tag conventions, feature file rich content rules, step linting reference. Pure editorial guidance -- no annotation source exists.                                                                                           |
| **ANNOTATION-GUIDE.md** | 270   | docs-live/taxonomy/metadata-tags.md (649 lines)                                                                                                                      | Partial      | Generated has exhaustive tag reference (56 tags). Missing: getting-started guide, shape extraction modes explanation, "Zod schema gotcha" documentation, verification steps, common issues troubleshooting table.                                                                                   |
| **PROCESS-API.md**      | ~60   | docs-live/reference/PROCESS-API-REFERENCE.md + PROCESS-API-RECIPES.md                                                                                                | **Replaced** | Trimmed to pointer file with operational reference (JSON envelope, exit codes, piping). All prose content now generated by CliRecipeCodec (WP-6 complete).                                                                                                                                          |
| **PROCESS-GUARD.md**    | 341   | docs-live/validation/error-catalog.md (79 lines) + docs-live/validation/fsm-transitions.md (49 lines) + docs-live/validation/protection-levels.md                    | Partial      | Generated has error types, FSM matrix, protection levels. Missing: error fix rationale ("why this rule exists"), escape hatch alternatives, pre-commit setup instructions (Husky), programmatic API guide, Decider pattern architecture diagram.                                                    |
| **VALIDATION.md**       | 418   | docs-live/product-areas/VALIDATION.md (1,115 lines)                                                                                                                  | Partial      | Generated has pattern listings and business rules. Missing: "Which command do I run?" decision tree, 32+ individual lint rule explanations with code examples, anti-pattern detection rationale, CI/CD integration patterns (GitHub Actions YAML), vitest-cucumber two-pattern problem explanation. |
| **TAXONOMY.md**         | 107   | docs-live/TAXONOMY.md (199 lines) + docs-live/taxonomy/ (3 files)                                                                                                    | Good         | Generated taxonomy reference is actually more comprehensive than manual. Manual adds: architecture explanation (file structure of src/taxonomy/), preset-to-taxonomy mapping, generation commands. Small gap.                                                                                       |

### Coverage Summary

| Coverage Level   | Files                                   | Lines | % of Manual Content |
| ---------------- | --------------------------------------- | ----- | ------------------- |
| Good (>80%)      | 1 (TAXONOMY.md)                         | 107   | 2%                  |
| Partial (40-80%) | 7                                       | 3,685 | 74%                 |
| Minimal (<40%)   | 1 (SESSION-GUIDES.md)                   | 389   | 8%                  |
| None (0%)        | 2 (METHODOLOGY.md, GHERKIN-PATTERNS.md) | 604   | 12%                 |

---

## 7. Cross-Cutting Quality Gaps

### 7.1 Missing Content Types in Generated Docs

| Content Type                 | Present in docs/                         | Present in docs-live/        | Examples                                                                          |
| ---------------------------- | ---------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| Decision trees               | Yes (3 docs)                             | No                           | "Which validation command?", "Which session type?", "When to use design session?" |
| Step-by-step checklists      | Yes (SESSION-GUIDES)                     | No                           | Planning session checklist, implementation 5-step execution order                 |
| CLI recipes with output      | Yes (PROCESS-API)                        | Yes (PROCESS-API-RECIPES.md) | WP-6 complete: generated from CLI_SCHEMA                                          |
| Error fix guides             | Yes (PROCESS-GUARD)                      | Partial (error-catalog)      | "completed-protection: add unlock-reason tag" with alternatives                   |
| Code examples (before/after) | Yes (VALIDATION)                         | No                           | Lint rule violation + fix side-by-side                                            |
| Philosophical rationale      | Yes (METHODOLOGY)                        | No                           | USDP inversion thesis, event sourcing analogy                                     |
| Integration patterns         | Yes (VALIDATION, PROCESS-GUARD)          | No                           | Husky pre-commit, GitHub Actions YAML, package.json scripts                       |
| Getting-started guides       | Yes (ANNOTATION-GUIDE)                   | No                           | "Add your first annotation" walkthrough                                           |
| Gotcha documentation         | Yes (ANNOTATION-GUIDE, GHERKIN-PATTERNS) | No                           | "Zod schema needs constant not type alias", "# kills Gherkin parsing"             |
| Audience-based navigation    | Yes (INDEX)                              | No                           | "New user read X, Developer read Y, Team Lead read Z"                             |

### 7.2 Structural Quality Comparison

| Quality Dimension          | docs/ (Manual)            | docs-live/ (Generated)         | Winner    |
| -------------------------- | ------------------------- | ------------------------------ | --------- |
| Consistency of format      | Medium (varies by author) | High (codec templates)         | Generated |
| Completeness of coverage   | Medium (11 topics)        | High (48 files, 196 patterns)  | Generated |
| Depth of individual topics | High (deep dives)         | Medium (broad but shallow)     | Manual    |
| Practical examples         | High (code + CLI output)  | Low (few examples)             | Manual    |
| Cross-referencing          | Medium (manual links)     | High (auto-generated links)    | Generated |
| Diagrams                   | Medium (4 ASCII diagrams) | High (Mermaid C4 + LR)         | Generated |
| Freshness / accuracy       | Medium (may drift)        | High (regenerated from source) | Generated |
| Accessibility to newcomers | High (reading orders)     | Low (reference-heavy)          | Manual    |
| Troubleshooting guidance   | High (error tables)       | Low (error catalog only)       | Manual    |

### 7.3 Website Quality Requirements

For libar.dev publication, docs need:

| Requirement                         | docs/ Status                   | docs-live/ Status              | Gap                |
| ----------------------------------- | ------------------------------ | ------------------------------ | ------------------ |
| Starlight frontmatter compatibility | Handled by sync                | Handled by sync                | None               |
| Mermaid diagram rendering           | ASCII only                     | C4Context + graph LR           | Generated better   |
| Internal link resolution            | Manual links rewritten by sync | Internal links may not resolve | Needs sync update  |
| Progressive disclosure              | Good (sections, tables)        | Good (collapsible sections)    | None               |
| Mobile-friendly tables              | Some wide tables               | Some wide tables               | Both need review   |
| Code block syntax highlighting      | Good (```typescript)           | Good (```typescript)           | None               |
| Broken link detection               | Not automated                  | Not automated                  | Both need CI check |

---

## 8. Unused Generation Capabilities

### Codecs Available But Not in docs:all

Three of the 14 unused codecs could directly fill gaps:

| Codec          | Would Generate                         | Fills Gap For                           |
| -------------- | -------------------------------------- | --------------------------------------- |
| `architecture` | ARCHITECTURE.md with Mermaid diagrams  | docs/ARCHITECTURE.md data flow diagrams |
| `changelog`    | CHANGELOG-GENERATED.md                 | Release history (new content)           |
| `patterns`     | Full pattern catalog with detail pages | docs/INDEX.md codec reference table     |

### New Codecs Needed

| Proposed Codec       | Content Type                                | Source Data                                                    | Fills Gap For                                   |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `guides` or `how-to` | Step-by-step procedural guides              | Feature file Rule: blocks + new annotation type                | SESSION-GUIDES, getting-started                 |
| `decision-trees`     | Mermaid flowchart decision trees            | New annotation or Rule: block extension                        | "Which command?" trees                          |
| `integration`        | CI/CD setup recipes                         | New annotation type or config                                  | VALIDATION CI section, PROCESS-GUARD pre-commit |
| `error-guide`        | Error diagnosis + fix walkthrough           | Existing error-catalog + new "fix" annotations                 | PROCESS-GUARD error fixes                       |
| ~~`cli-recipes`~~    | ~~CLI command sequences with explanations~~ | **Done (WP-6)** -- `CliRecipeGenerator` consuming `CLI_SCHEMA` | PROCESS-API recipes                             |

---

## 9. Website Sync Script Gaps

### 9.1 Blocking: docs-generated/ Source is Empty

**Priority: P0 (blocks website build)**

After consolidation, `syncGenerated()` reads from `docs-generated/` which is now empty.
Business rules, taxonomy, and reference-sample content is now in `docs-live/`.

**Required changes to `sync-content.mjs`:**

1. Remove `docsGenerated` from REQUIRED_SOURCES (or make optional)
2. Update `REQUIRED_SOURCE_FILES` to read BUSINESS-RULES.md and TAXONOMY.md from `docsLive`
3. Update `syncGenerated()` to read from `docs-live/` subdirectories:
   - `docs-live/business-rules/` instead of `docs-generated/business-rules/`
   - `docs-live/taxonomy/` instead of `docs-generated/taxonomy/`
   - `docs-live/BUSINESS-RULES.md` instead of `docs-generated/BUSINESS-RULES.md`
   - `docs-live/TAXONOMY.md` instead of `docs-generated/TAXONOMY.md`
   - `docs-live/reference/REFERENCE-SAMPLE.md` instead of `docs-generated/docs/REFERENCE-SAMPLE.md`
4. Update `getSyncedRouteForSourceFile()` to resolve new paths

### 9.2 Missing: New docs-live/ Content Not Synced

**Priority: P1 (content exists but not published)**

| Content                    | Source                                  | Proposed Website Section                     |
| -------------------------- | --------------------------------------- | -------------------------------------------- |
| Validation rules (3 files) | docs-live/validation/                   | Generated Reference > Validation             |
| Reference docs (4 files)   | docs-live/reference/                    | Generated Reference > Architecture Reference |
| Top-level indexes          | docs-live/INDEX.md, VALIDATION-RULES.md | Generated Reference root                     |

### 9.3 Future: Replacing Manual Docs Sections

**Priority: P2 (after quality parity)**

When generated docs reach quality parity with manual docs for specific sections,
the sync script should be updated to read from `docs-live/` instead of `docs/`:

| Manual Section     | Replacement Source                | Readiness                  |
| ------------------ | --------------------------------- | -------------------------- |
| reference/taxonomy | docs-live/TAXONOMY.md + taxonomy/ | Ready now                  |
| guides/ (all 5)    | New generated guides              | Needs new codec            |
| reference/ (all 5) | docs-live/ equivalents            | Needs quality improvements |

---

## 10. Recommended Work Packages

### WP-1: Fix Website Sync Script (P0)

**Type:** Implementation session
**Scope:** libar-dev-website repo
**Effort:** Small (1 session)
**Spec alignment:** Consequence of DocsLiveConsolidation (Phase 37, completed).
No new delivery-process spec needed -- this is a website-repo fix.

Update `sync-content.mjs` and `content-manifest.mjs` to:

- Read business-rules, taxonomy from `docs-live/` instead of `docs-generated/`
- Add sync functions for validation/, reference/ subdirectories
- Remove `docsGenerated` from required sources
- Add new website sections for validation rules and reference docs

**Key files to modify:**

- `libar-dev-website/scripts/sync-content.mjs` (lines 78-83, 93-114, 456-503)
- `libar-dev-website/scripts/content-manifest.mjs` (add new sections)

### WP-2: Enhance Generated Index (P1)

**Type:** Design + Implementation
**Scope:** delivery-process repo
**Effort:** Small (1-2 sessions)
**Spec alignment:** Maps to DocsConsolidationStrategy Phase 6 (Index navigation update, pending).
Update the existing deliverable status when implementing.

Improve `docs-live/INDEX.md` to include:

- Audience-based reading orders (New User, Developer, Team Lead)
- Document roles matrix
- Codec reference table
- Cross-references between manual and generated docs

**Approach:** Extend IndexCodec or create NavigationCodec that reads pattern metadata
to generate audience-appropriate navigation.

### WP-3: Add Architecture Generator to docs:all (P1)

**Type:** Implementation session
**Scope:** delivery-process repo
**Effort:** Small (1 session)
**Spec alignment:** Extends Phase 4 (Architecture decomposition, complete). Phase 4
decomposed the manual ARCHITECTURE.md; this adds the generated Mermaid equivalent.

The `architecture` codec already exists in `docs:all-preview`. Add it to `docs:all`
and configure output to `docs-live/`. This provides Mermaid architecture diagrams
that partially replace the manual ARCHITECTURE.md data flow diagrams.

### WP-4: Add Changelog Generator to docs:all (P2)

**Type:** Implementation session
**Scope:** delivery-process repo
**Effort:** Small (1 session)
**Spec alignment:** New work, not covered by DocsConsolidationStrategy. Consider
adding as a new deliverable if a spec is created.

The `changelog` codec exists. Add to `docs:all`, configure output to `docs-live/`.
New content for the website (no manual equivalent to replace).

### WP-5: Create Error Guide Codec (P2)

**Type:** Design + Implementation
**Scope:** delivery-process repo
**Effort:** Medium (2-3 sessions)
**Spec alignment:** Maps to DocsConsolidationStrategy Phase 3 (Process Guard
consolidation, pending). The spec says "enhanced ValidationRulesCodec" -- design
session should decide whether to enhance existing codec or create new one.

Create a codec that generates error diagnosis guides from:

- Existing validation error catalog data
- New `**Fix:**` and `**Alternative:**` markers in Rule: blocks
- Pre-commit setup instructions from config

This replaces the manual PROCESS-GUARD.md "Error Messages and Fixes" section.

**Design questions for session:**

- Enhance `ValidationRulesCodec` or create separate `ErrorGuideCodec`?
- Convention tag approach: annotate error-handling code in `src/lint/` with
  `@libar-docs-convention:process-guard-errors`, or use existing behavior extraction?
- Preamble for Husky/CI setup content that can't come from annotations?

### WP-6: Create CLI Recipe Codec (P2)

**Type:** Design + Implementation
**Scope:** delivery-process repo
**Effort:** Medium (2-3 sessions)
**Spec alignment:** Extends ProcessApiHybridGeneration (Phase 43, completed). Phase 43
generated reference tables from CLI schema; this adds recipe/guide content. The manual
PROCESS-API.md prose was explicitly kept in Phase 43 -- this WP addresses that remainder.

Create a codec that generates CLI recipe guides from:

- Process API command metadata (already extracted via `src/cli/cli-schema.ts`)
- New `**Recipe:**` annotation in feature files
- Session type metadata

This replaces manual PROCESS-API.md "Common Recipes" and "Session Workflow Commands".

**Design questions for session:**

- Extend `ProcessApiReferenceGenerator` or create separate recipe generator?
- Where should recipe annotations live? (CLI schema? Feature files? New recipe files?)
- How to handle "Why Use This" motivational prose? (Preamble?)

### WP-7: Create Procedural Guide Codec (P3)

**Type:** Design + Implementation
**Scope:** delivery-process repo
**Effort:** Large (3-5 sessions)
**Spec alignment:** Maps to DocsConsolidationStrategy Phase 41 (GHERKIN-PATTERNS.md
restructure, pending) and Phase 39 (Session workflow module generation, pending --
blocked on ClaudeModuleGeneration Phase 25). Also relates to Phase 5 (Guide trimming).

**Note on Phase 39:** The session-guides-module-source.feature spec already has
`@libar-docs-claude-module` and `@libar-docs-claude-section:workflow` tags. Once
Phase 25 ships ClaudeModuleCodec, the CLAUDE.md session section auto-generates.
This WP addresses the **public-facing** SESSION-GUIDES.md, not the AI context version.

Create a codec (or codec family) for generating how-to guides:

- Session workflow checklists from SESSION-GUIDES feature file Rule: blocks
- Getting-started walkthrough from ANNOTATION-GUIDE content
- Decision trees as Mermaid flowcharts

This is the largest gap -- SESSION-GUIDES.md (389 lines of checklists) and
GHERKIN-PATTERNS.md (366 lines of authoring guidance) have no generation source.

**Key Design Decisions for session:**

- Should procedural content live in Rule: blocks with new markers
  (`**Checklist:**`, `**Step:**`), or a separate annotation system?
- Can the existing `session-guides-module-source.feature` Rule: blocks serve
  as source for both AI compact AND public guide, using detail levels?
- Phase 41 says "trim to ~250 lines, Step Linting moves to VALIDATION.md" --
  should the remaining ~250 lines become preamble or a separate manual page?

### WP-8: Decide Methodology Page Disposition (P3)

**Type:** Design session
**Scope:** delivery-process repo
**Effort:** Small (1 session)
**Spec alignment:** DocsConsolidationStrategy explicitly says "Keep: philosophy and
core thesis" for METHODOLOGY.md. The master spec already decided this stays manual.
Also relates to Phase 42 (README.md rationalization) which trims README and moves
pitch content to website.

METHODOLOGY.md (238 lines) contains philosophy that cannot be extracted from code.
The master spec already decided to keep it. Design session should confirm and decide:

1. **Keep as-is** (aligned with master spec)
2. **Encode as invariants** in a feature file for queryability via Process Data API
3. **Merge relevant parts into README.md** as part of Phase 42

**Recommendation:** Option 1, with option 2 as enhancement. The philosophy is
inherently editorial, but encoding core thesis as Rule: blocks would make it
queryable (`pnpm process:query -- rules --pattern Methodology`) without replacing
the human-readable prose.

### WP-9: Quality Polish for Website Publication (P1)

**Type:** Implementation session
**Scope:** Both repos
**Effort:** Medium (2-3 sessions)
**Spec alignment:** Maps to DocsConsolidationStrategy Phase 38 (Generated doc quality
improvements, pending) and Phase 5 (Guide trimming, pending). Phase 38 specifically
calls out "fix REFERENCE-SAMPLE duplication, enrich Generation compact, add TOC".

Review all docs-live/ content for website readiness:

- Fix any wide tables that break mobile layout
- Ensure all Mermaid diagrams render correctly in Starlight
- Add missing cross-references ("See Also" sections)
- Verify all internal links resolve after sync
- Split oversized files (business-rules/generation.md at 4,372 lines)
- Add descriptions to frontmatter for SEO
- Phase 38 items: fix REFERENCE-SAMPLE duplication, enrich Generation compact, add TOC
- Phase 5 items: trim 30 lines of duplicated tag reference from ANNOTATION-GUIDE.md,
  trim 67 lines of duplicated preset detail from CONFIGURATION.md

---

## 11. Prioritization Matrix

### By Impact and Effort

| Priority | Work Package                 | Impact                                     | Effort   | Blocks             |
| -------- | ---------------------------- | ------------------------------------------ | -------- | ------------------ |
| **P0**   | WP-1: Fix sync script        | Unblocks website build                     | Small    | Website deployment |
| **P1**   | WP-2: Enhanced index         | Better navigation                          | Small    | Nothing            |
| **P1**   | WP-3: Architecture generator | Fills ARCHITECTURE.md gap                  | Small    | Nothing            |
| **P1**   | WP-9: Quality polish         | Website-ready content                      | Medium   | Website launch     |
| **P2**   | WP-4: Changelog generator    | New website content                        | Small    | Nothing            |
| **P2**   | WP-5: Error guide codec      | Replaces PROCESS-GUARD                     | Medium   | WP-1               |
| ~~P2~~   | ~~WP-6: CLI recipe codec~~   | **Done**                                   | Complete | N/A                |
| **P3**   | WP-7: Procedural guide codec | Replaces SESSION-GUIDES + GHERKIN-PATTERNS | Large    | WP-5, WP-6         |
| **P3**   | WP-8: Methodology decision   | Clarifies hybrid approach                  | Small    | Nothing            |

### Master Spec Phases NOT Covered by Work Packages

| Phase                                  | Description                               | Why Not Included                                                 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Phase 1 - Taxonomy consolidation       | Redirect docs/TAXONOMY.md to generated    | Trivial -- just delete manual + update INDEX.md. Can do in WP-9. |
| Phase 39 - Session workflow module gen | Generate CLAUDE.md session section        | Blocked on Phase 25 (ClaudeModuleCodec). Not actionable yet.     |
| Phase 42 - README.md rationalization   | Trim to ~150 lines, move pitch to website | Separate initiative, not a docs/ vs docs-live/ gap.              |

### Recommended Execution Order

```
Phase A (immediate):  WP-1 (fix sync) -> WP-9 (quality polish)
Phase B (short-term): WP-2 (index) + WP-3 (architecture) + WP-4 (changelog)
Phase C (medium):     WP-5 (error guide) + WP-6 (CLI recipes)
Phase D (long-term):  WP-7 (procedural guides) + WP-8 (methodology decision)
```

### Deprecation Roadmap

| Manual Doc          | Can Deprecate After               | Prerequisite WPs                        |
| ------------------- | --------------------------------- | --------------------------------------- |
| TAXONOMY.md         | Now (generated version is better) | WP-1 (sync fix)                         |
| ARCHITECTURE.md     | WP-3 + WP-9                       | Architecture generator + quality polish |
| PROCESS-GUARD.md    | WP-5                              | Error guide codec                       |
| PROCESS-API.md      | Done (WP-6 complete)              | Trimmed to pointer file                 |
| ANNOTATION-GUIDE.md | WP-7 (partial)                    | Guide codec with getting-started        |
| VALIDATION.md       | WP-5 + WP-7                       | Error guide + procedural guides         |
| SESSION-GUIDES.md   | WP-7                              | Procedural guide codec                  |
| GHERKIN-PATTERNS.md | WP-7 or never                     | Authoring guide is inherently editorial |
| METHODOLOGY.md      | Never (hybrid)                    | N/A -- keep as manual                   |
| CONFIGURATION.md    | WP-7 (partial)                    | Guide codec with preset selection       |
| INDEX.md            | WP-2                              | Enhanced index generation               |

### Realistic Target

Reduce from **11 manual docs to 3** (METHODOLOGY.md, GHERKIN-PATTERNS.md, and a
simplified INDEX.md) after completing WP-1 through WP-7. This eliminates ~80% of
manual maintenance burden while preserving irreducibly editorial content.

---

## 10.5. Spec Coverage Status

Maps each WP to its delivery-process spec, design status, and code stubs.

| WP   | Pattern                    | Spec Status  | Design Status                                | Stubs   |
| ---- | -------------------------- | ------------ | -------------------------------------------- | ------- |
| WP-1 | N/A (website repo)         | Out of scope | N/A                                          | N/A     |
| WP-2 | EnhancedIndexGeneration    | roadmap      | Design complete (6 findings)                 | 3 stubs |
| WP-3 | (master spec deliverable)  | completed    | Trivial config change done                   | N/A     |
| WP-4 | (master spec deliverable)  | completed    | Trivial config change done                   | N/A     |
| WP-5 | ErrorGuideCodec            | completed    | Design complete (6 findings)                 | 3 stubs |
| WP-6 | CliRecipeCodec             | completed    | Design + implementation complete             | 3 stubs |
| WP-7 | ProceduralGuideCodec       | completed    | Design complete (8 findings), DD-7/DD-8 done | 5 stubs |
| WP-8 | (master spec: keep manual) | N/A          | Already decided                              | N/A     |
| WP-9 | (master spec Phase 38)     | pending      | Implementation tasks                         | N/A     |

### Design Session Summary

All 4 new specs (ErrorGuideCodec, CliRecipeCodec, EnhancedIndexGeneration,
ProceduralGuideCodec) have completed design sessions with findings and code stubs:

- **ProceduralGuideCodec** design found that no new codec class is needed -- reuses
  `createReferenceCodec()` with two `ReferenceDocConfig` entries. Preamble content
  authored as markdown in `docs-sources/` and parsed into `SectionBlock[]` at config
  load time by a shared `loadPreambleFromMarkdown()` utility (DD-7/DD-8).
- **ErrorGuideCodec** extends the existing `ValidationRulesCodec` with a new
  `includeErrorGuide` toggle and convention-tagged annotations on `src/lint/` source.
- **CliRecipeCodec** creates a sibling `CliRecipeGenerator` to `ProcessApiReferenceGenerator`,
  both standalone `DocumentGenerator` implementations consuming `CLI_SCHEMA` directly.
- **EnhancedIndexGeneration** creates a new `IndexCodec` registered in `CodecRegistry`,
  composing MasterDataset-driven statistics with editorial preamble navigation content.

**Master spec status:** 11/15 deliverables complete. WP-3 (promote architecture) and
WP-4 (promote changelog) are now done. WP-6 (CliRecipeCodec) is completed -- PROCESS-API.md
trimmed from ~509 to ~60 lines with pointers to two generated files. Phase 3 (WP-5,
ErrorGuideCodec) and Phase 5 (guide trimming, partially addressed by WP-7 DD-7/DD-8)
have progressed. The 4 pending deliverables map to WP-2 (Phase 6), WP-9 (Phase 38),
Phase 1 (taxonomy consolidation), and Phase 5 (guide trimming remainder).

---

## 12. Appendix: File Inventories

### A. Manual docs/ (11 files, ~4,537 lines)

| File                | Lines | Generatability                              |
| ------------------- | ----- | ------------------------------------------- |
| INDEX.md            | 353   | Partial (navigation is editorial)           |
| ANNOTATION-GUIDE.md | 270   | Partial (tags auto, gotchas manual)         |
| ARCHITECTURE.md     | 1,638 | Partial (pipeline auto, rationale manual)   |
| CONFIGURATION.md    | 357   | Partial (options auto, rationale manual)    |
| GHERKIN-PATTERNS.md | 366   | Low (style guide is editorial)              |
| METHODOLOGY.md      | 238   | None (philosophy)                           |
| PROCESS-API.md      | ~60   | Complete (pointer file + generated recipes) |
| PROCESS-GUARD.md    | 341   | Partial (rules auto, fix guides manual)     |
| SESSION-GUIDES.md   | 389   | Low (checklists are procedural)             |
| TAXONOMY.md         | 107   | High (generated version is better)          |
| VALIDATION.md       | 418   | Partial (rules auto, examples manual)       |

### B. Generated docs-live/ (48 files, ~20,548 lines)

**Top-level indexes (6 files):**
INDEX.md, PRODUCT-AREAS.md, BUSINESS-RULES.md, DECISIONS.md, TAXONOMY.md, VALIDATION-RULES.md

**Product areas (7 files):**
ANNOTATION.md, CONFIGURATION.md, CORE-TYPES.md, DATA-API.md, GENERATION.md, PROCESS.md, VALIDATION.md

**Architecture decisions (7 files):**
adr-001 through adr-006, adr-021

**Business rules (7 files):**
annotation.md, configuration.md, core-types.md, data-api.md, generation.md, process.md, validation.md

**Reference (5 files):**
ARCHITECTURE-CODECS.md, ARCHITECTURE-TYPES.md, PROCESS-API-RECIPES.md, PROCESS-API-REFERENCE.md, REFERENCE-SAMPLE.md

**Taxonomy (3 files):**
categories.md, format-types.md, metadata-tags.md

**Validation (3 files):**
error-catalog.md, fsm-transitions.md, protection-levels.md

**AI modules (10 files in \_claude-md/):**
7 product area overviews + 3 architecture reference compacts

### C. Website Sections (content-manifest.mjs)

| Section                | Source                   | Current File Count |
| ---------------------- | ------------------------ | ------------------ |
| Tutorial               | External repo (10 parts) | 11                 |
| Guides                 | docs/ manual (5 files)   | 5                  |
| Reference              | docs/ manual (5 files)   | 5                  |
| Product Areas          | docs-live/ (8 files)     | 8                  |
| Architecture Decisions | docs-live/ (8 files)     | 8                  |
| Generated Reference    | docs-generated/ (STALE)  | 0 (broken)         |

### D. Codec Inventory (22 total)

**In docs:all (9):** adrs, business-rules, taxonomy, validation-rules, reference-docs, product-area-docs, claude-modules, process-api-reference, cli-recipe

**In docs:all-preview only (14):** patterns, roadmap, milestones, requirements, session, remaining, current, session-plan, session-findings, pr-changes, changelog, traceability, architecture, overview-rdm
