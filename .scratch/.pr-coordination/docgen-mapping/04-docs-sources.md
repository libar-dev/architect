# docs-sources/ Corpus Mapping

Read-only analysis of `/Users/darkomijic/dev-projects/architect/docs-sources/` (8 files, 1,397 lines total) against the corresponding `/Users/darkomijic/dev-projects/architect/docs/` manual files, with reference to the pre-refactor outputs at `/Users/darkomijic/dev-projects/delivery-process/docs-live/reference/`.

**Bottom line:** The 8 files are not preambles — they are full hand-authored reference docs that were meant to be _concatenated_ with extractor output (JSDoc prose, taxonomy tables, CLI command tables, error-guide blocks) by a generator that no longer exists. The pre-refactor reference outputs (e.g. `PROCESS-GUARD-REFERENCE.md` = 258 lines) are essentially `docs-sources/<file>.md` + extractor-derived sections. After W1.5 dropped the generator, every `docs-sources/*.md` was duplicated into `docs/*.md` with a deprecation banner and minor edits — so both copies now drift from the live taxonomy and CLI surface they describe.

For the new `preamble()`-based design (PROPOSED-DESIGN § 10–11, DECISIONS D10–D12), most of the content in these files **must not be preserved verbatim**: anything that is a table of values, a CLI flag list, an error code, a tag taxonomy, or a rule catalog has to come from extractors. Only the editorial framing — intros, "why use this", "when to use", decision trees, narrative gotchas — is salvageable as `preamble()` input.

---

## A. Per-file analysis

### A.1 `docs-sources/annotation-guide.md` — 221 lines

- **Structure:** 8 sections — Getting Started, Shape Extraction, Zod Gotcha, Annotation Patterns by File Type, Tag Groups Quick Reference, Verification (CLI), Common Issues.
- **Content shape:** Mixed — ~60% editorial framing (file-opt-in concept, dual-source ownership rationale, shape extraction modes prose, zod schema-vs-alias warning) and ~40% derivable data (the 12-group tag taxonomy table on lines 172–186, the CLI verification command list, the common-issues table).
- **Relationship to `docs/ANNOTATION-GUIDE.md` (214 lines):** Divergent siblings. Both descend from a common ancestor but have drifted independently:
  - `docs-sources/` uses the **old** ownership model (`uses`/`status`/`phase`/`depends-on` split by source) and the **old** tag prefix (`@architect-`); references `@extract-shapes` (now `@architect-extract-shapes`), 12 tag groups, "Mode 2: File-Level Wildcard" which is dead in v2.
  - `docs/ANNOTATION-GUIDE.md` is **newer**: rewritten ownership model around `@architect-implements` (executable feature is canonical), 9-group tag table, names the W1.5 retained surface (`role`, `bounded-context`, `usecase`, `decision`), references `pnpm pkg:query` and `docs-live/TAXONOMY.md`.
  - Overlap ~50% conceptually but ~10% verbatim.
- **Salvage verdict:** **SALVAGE-SECTIONS** (~3 short preambles), then DELETE the rest.
- **What's salvageable:**
  - "File-Level Opt-In" 1-paragraph intro (lines 3–4) → `1-getting-started.md` preamble.
  - "Dual-Source Ownership" rationale paragraph (the 2-line concept, NOT the table) → `2-ownership-model.md` preamble.
  - "Critical Gotcha: Zod Schemas" prose (lines 94–102) → `3-shape-extraction.md` preamble (warning paragraph only; the wrong/correct table must be regenerated from extractor data).
  - All five "Annotation Patterns by File Type" code snippets are reasonable preamble fodder for `6-patterns-by-file-type.md` (PROPOSED-DESIGN line 722 already pencils this in as preamble).
- **What to discard:** Tag Groups table (lines 168–186) — must come from `projectTaxonomyDigest`; CLI verification block — `extractCliCommands`; Common Issues table — derivable from validation-rule annotations or accept that this is generic FAQ that probably belongs in a `7-2-common-issues.md` preamble (PROPOSED-DESIGN line 725 plans for exactly that, so a 6-row table written by hand is fine).
- **Salvageable line count:** ~60 lines of the 221.

### A.2 `docs-sources/cli-recipes.md` — 55 lines

- **Structure:** 3 sections — Why Use This, Quick Start (1 command block + 1 output sample), Session Types (1 table + decision sentence).
- **Content shape:** ~90% editorial framing — purpose pitch, when-to-use guidance, decision tree. The only data-shaped element is the Session Types table, which is small (4 rows) and stable enough to live as preamble.
- **Relationship to `docs/`:** No matching manual doc. The closest analogue is `docs/CLI.md` (89 lines), which is a flat command reference with no overlap. The pre-refactor `delivery-process/docs-live/reference/CLI-RECIPES.md` (476 lines) was this 55-line preamble + extractor-derived command groups + recipe annotations.
- **Salvage verdict:** **KEEP-AS-PREAMBLE** — this is the cleanest file in the corpus; it is precisely what a good preamble looks like.
- **Target preamble for new `DocDefinition`:** `docs-sources/cli-recipes-intro.md` (or `docs-sources/data-api-cli/1-intro.md`) embedded at the top of the `DataAPICLIErgonomics` / `CLI-RECIPES.md` doc-definition. The Quick Start sample output should be regenerated from a live `overview` invocation rather than frozen at the cited 318-pattern snapshot, but the _narrative around it_ is preamble.
- **Caveats:** The "318 patterns (224 completed…)" sample output (lines 30–33) is stale — strip or replace with `{{ extractedOverview }}` block when porting.
- **Salvageable line count:** ~45 lines (strip stale output sample).

### A.3 `docs-sources/configuration-guide.md` — 214 lines

- **Structure:** 8 sections — Quick Reference (role-set table + config example), Choosing a Role Set (3 sub-sections × code block + prose), Unified Config File (4 tables + config example), Monorepo Setup, Custom Prefixes, Programmatic Config Loading.
- **Content shape:** ~40% editorial framing (when-to-use-which-role-set, monorepo prose, discovery-order paragraph) and ~60% schema-derivable data (Sources/Output/GeneratorOverrides field tables, exact config-file shape, exact API signatures).
- **Relationship to `docs/CONFIGURATION.md` (267 lines):** Near-twin with drift. Both files have identical heading skeletons; the diff shows trivial Markdown reformatting (em-dash vs `--`, table column widths) for 80% of content, plus a **content-level conflict**: `docs-sources/` documents three role choices (Built-in / DDD_ES_CQRS / Custom) with the `DDD_ES_CQRS_ROLES` import; `docs/CONFIGURATION.md` was edited to drop `DDD_ES_CQRS_ROLES` and document only `DEFAULT_ROLES` + Custom, listing the eight authored roles. The two files contradict each other on what role-sets exist.
- **Salvage verdict:** **SALVAGE-SECTIONS**.
- **What's salvageable as preamble:**
  - "Choosing a Role Set" rationale paragraphs (NOT the code blocks, NOT the comparison table) — 1 paragraph per role-set option.
  - "Discovery Order" 3-step list (stable behavior, ~5 lines).
  - "Monorepo Setup" prose + ASCII tree (~12 lines).
  - "Custom Prefixes and Opt-in Tags" rationale (NOT the code block — the block should come from a stub).
- **What to discard:** Every `ConfigSchema`-derivable table (Sources, Output, GeneratorOverrides) must be regenerated from the Zod schema via `extractZodFieldTable` or equivalent. The "Programmatic Config Loading" code block belongs in a stub or extracted from the exported `loadProjectConfig` JSDoc.
- **Salvageable line count:** ~40 lines of the 214.

### A.4 `docs-sources/gherkin-patterns.md` — 260 lines

- **Structure:** 7 sections — Essential Patterns (4 code-heavy sub-sections), DataTable/DocString Usage, Tag Conventions, Feature Description Patterns, Feature File Rich Content, Syntax Notes and Gotchas, Quick Reference.
- **Content shape:** ~50% Gherkin code examples, ~30% editorial framing (Code-First Principle prose, "Forbidden in Feature Descriptions" gotchas), ~20% derivable tables (semantic-tag table, valid-rich-content table).
- **Relationship to `docs/GHERKIN-PATTERNS.md` (365 lines):** Sibling drift. The manual `docs/` version is the superset — it carries 4 sub-sections instead of 3 under "Tag Conventions" (adds Convention Tags and Combining Tags), longer rich-content examples, and explicit cross-links to ANNOTATION-GUIDE/VALIDATION. The `docs-sources/` version has minor unique content: tag-value-constraint examples (`@architect-pattern:My Pattern` → hyphenated), and an extra "Syntax Notes and Gotchas" block on forbidden content. Overlap ~70% verbatim.
- **Salvage verdict:** **SALVAGE-SECTIONS**.
- **What's salvageable as preamble:**
  - Roadmap-spec, Rule-block, Scenario-Outline, executable-test code blocks (each ~15–20 lines) → could live as preamble fragments under a `gherkin-authoring/` bundle (PROPOSED-DESIGN doesn't yet sketch this doc, but the W-DOCS-5 wave covers it).
  - "Code-First Principle" prose (~6 lines).
  - "Forbidden in Feature Descriptions" gotcha table (4 rows; rarely changes, content is parser behavior not configurable, so preamble is fine).
- **What to discard:** Semantic Tags table — must come from tag taxonomy with `extractedFor: 'gherkin-tags'` filter; Feature Description Patterns table is hand-wavy taxonomy of conventions, probably preamble; Quick Reference at end is a manual digest of everything above — drop it (the index page will provide cross-links).
- **Salvageable line count:** ~80 lines of the 260.

### A.5 `docs-sources/index-navigation.md` — 77 lines

- **Structure:** 3 tables — Quick Navigation (if-you-want-to → read-this), Reading Order (numbered list with descriptions), Document Roles + Key Concepts glossary.
- **Content shape:** 100% navigation/index data. Every row is `<filename> → <description>` or `<concept> → <definition>`.
- **Relationship to `docs/INDEX.md` (349 lines):** Subset. `docs/INDEX.md` is the maintained index for the manual docs (15 entries, sectioned by audience, with content summaries); `docs-sources/index-navigation.md` references targets like `PRODUCT-AREAS.md`, `BUSINESS-RULES.md`, `VALIDATION-RULES.md`, `DataAPICLIErgonomics`, `PatternGraphAPICLI` — most of which **do not exist** in the current repo. Several rows point cross-tree to `../docs/SESSION-GUIDES.md`. Some entries are duplicated (`ARCHITECTURE.md` appears twice in both tables).
- **Salvage verdict:** **DELETE**.
- **Justification:** PROPOSED-DESIGN § 11 (`WikiIndexDefinition`) explicitly states that `INDEX.md` is generated mechanically from the wiki tree; the File Map, Concept Index, Key Entities Reference, and Diagram Catalog are all derived. A hand-authored navigation table is exactly the artifact the new design replaces. The Key Concepts glossary at the bottom (5 entries) could in principle become a `concept` annotation source, but those are better authored as `@architect-concept` JSDoc on the canonical type, not duplicated here.
- **Salvageable line count:** 0.

### A.6 `docs-sources/process-guard.md` — 155 lines

- **Structure:** 6 sections — Quick Reference (3 tables: Protection Levels, Valid Transitions, Escape Hatches), CLI Usage (Modes, Options, Exit Codes, Examples), Pre-commit Setup, Programmatic API, Architecture diagram.
- **Content shape:** ~85% derivable — every table is FSM-rule or CLI-flag data; every code block is a callable API surface; the Mermaid diagram describes the Decider topology. Maybe ~15% editorial framing.
- **Relationship to `docs/PROCESS-GUARD.md` (341 lines):** Strict subset. `docs/` adds the entire "Error Messages and Fixes" section (lines 40–191 — 7 error codes with cause/fix prose, ~150 lines) that `docs-sources/` lacks. The pre-refactor reference output `delivery-process/docs-live/reference/PROCESS-GUARD-REFERENCE.md` (258 lines) corresponds to `docs-sources/process-guard.md` + extracted `ProcessGuardDecider` JSDoc + the `process-guard-errors` convention block — confirming that error guides were intended to come from a `@architect-convention:process-guard-errors` annotation, not be hand-written.
- **Salvage verdict:** **SALVAGE-SECTIONS** (minimal — 1 small preamble).
- **What's salvageable:** Almost nothing as preamble. The Mermaid diagram (4 lines, the Decider topology) is stable and could be a preamble or, better, a `@architect-diagram` annotation on `validateChanges`. The "Pre-commit Setup" Husky snippet is a stable example and worth ~12 lines of preamble.
- **What to discard:** Protection-Levels table — derive from FSM annotation on `ProcessState`; Valid-Transitions table — derive from FSM transition map; Escape-Hatches table — likely needs a `@architect-convention:escape-hatch` annotation source; all CLI tables — `extractCliCommands('architect-guard')`; Programmatic API block — `extractJSDocProse` on `@libar-dev/architect-guard`.
- **Salvageable line count:** ~15 lines of the 155. The "Error Messages and Fixes" content in `docs/PROCESS-GUARD.md` is the more valuable artifact and should drive an `@architect-error-code` annotation campaign — but that lives in `docs/`, not `docs-sources/`.

### A.7 `docs-sources/session-workflow-guide.md` — 152 lines

- **Structure:** 7 sections — Session Decision Tree (Mermaid), Session Type Contracts table, Implementation Execution Order (numbered steps + Do-NOT table), Planning Session (CLI block + checklist + Do-NOT), Design Session (same), Planning+Design Session, Handoff Documentation, FSM-protection Quick Reference.
- **Content shape:** ~70% editorial framing (decision tree, when-to-use sub-tables, checklists, do-not lists, narrative). ~30% derivable (CLI command blocks, FSM-protection table at the end).
- **Relationship to `docs/SESSION-GUIDES.md` (391 lines):** Strict subset. `docs/` adds: per-session checklist items with code examples, a complete Tier-2 feature-stub example, handoff template with code, Discovery Tags block. Overlap ~80% conceptually; `docs-sources/` is a tight ~40% trim of the same content with cleaner Mermaid diagram. Same heading skeleton.
- **Salvage verdict:** **KEEP-AS-PREAMBLE** (multi-file).
- **Target preamble files for new `DocDefinition`:** Best split as multiple small preamble files under `docs-sources/session-workflow/`:
  - `1-decision-tree.md` — Mermaid diagram + decision questions (~25 lines).
  - `2-session-contracts.md` — Session Type Contracts table (4 rows, stable) (~10 lines).
  - `3-execution-order.md` — numbered 5-step list + Do-NOT table for implementation (~20 lines).
  - `4-planning.md`, `5-design.md`, `6-planning-plus-design.md` — Goal sentence + Context-Gathering CLI block + checklist + Do-NOT, per session (~25 lines each).
  - `7-handoff.md` — Handoff command block + prose (~10 lines).
- **What to discard:** FSM-Protection Quick Reference at the bottom (duplicate of process-guard data — must come from extractor).
- **Note:** Once skill files exist (`.agents/skills/architect-plan-session/`, etc.), much of this content overlaps with the kernel-skill bodies. PROPOSED-DESIGN line 247 already references `preamble('docs-sources/skills/design-session-frontmatter.md')` — the same split applies here.
- **Salvageable line count:** ~120 lines of the 152.

### A.8 `docs-sources/validation-tools-guide.md` — 263 lines

- **Structure:** 7 sections — Which-Command decision tree, Command Summary table, then a sub-section per CLI tool (`architect-lint-patterns`, `architect-lint-steps`, `architect-guard`, `architect-validate`) each with bash block + flags table + rules table + (sometimes) anti-pattern / DoD callouts, then CI/CD Integration, Exit Codes, Programmatic API.
- **Content shape:** ~80% derivable — every flag table, every rule table, every CLI block is extractor territory. ~20% editorial framing (Which-Command decision tree, anti-pattern rationale).
- **Relationship to `docs/VALIDATION.md` (427 lines):** Sibling-with-drift, `docs/` is the larger superset. `docs/VALIDATION.md` is ~160 lines longer because it carries detailed rule examples (the two-pattern problem for `scenario-outline-function-params`, the `hash-in-description` BAD/GOOD comparison, code samples for `regex-step-pattern` and `missing-and-destructuring`), an Architecture Note (ADR-006) callout, a richer DoD/anti-pattern section. Overlap ~75% on the tabular content. The `docs-sources/` version is the leaner pre-extractor sketch.
- **Salvage verdict:** **SALVAGE-SECTIONS** (small).
- **What's salvageable:** "Which Command Do I Run?" decision tree (lines 1–18) — 18-line preamble for the validation-tools-overview doc. Architecture Note about ADR-006 (from `docs/`, not `docs-sources/`) — preamble for the validate-patterns doc. The narrative around DoD validation and the anti-pattern rationale prose (~10 lines).
- **What to discard:** Every CLI flag table — `extractCliCommands`; every rules table — `extractLintRules` or equivalent on the `STEP_LINT_RULES`, `PATTERN_LINT_RULES` annotated registries; CI/CD scripts block — derivable from a recipe annotation; exit codes table — derivable from the CLI surface.
- **Salvageable line count:** ~30 lines of the 263.

---

## B. Overlap analysis

For each `docs-sources/<file>.md` paired with the corresponding `docs/<FILE>.md`:

| Pair                                                   | docs-sources/ age                                                                                          | Content delta                                                                                                                                          | Preamble-shape?                                                                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `annotation-guide.md` ↔ `docs/ANNOTATION-GUIDE.md`     | **Older** (`@architect-pattern` ownership model, 12-group taxonomy).                                       | `docs/` carries the v2 `@architect-implements` model, names retained roles, 9-group taxonomy. `docs-sources/` has nothing unique that's correct today. | **Accreted** — has tag taxonomy table and full Common-Issues table that are derivable.                                                        |
| `cli-recipes.md` ↔ (none)                              | New. No manual sibling.                                                                                    | N/A — pre-refactor `CLI-RECIPES.md` reference (476 lines) is the target shape; this is its preamble.                                                   | **Clean preamble** — exemplar.                                                                                                                |
| `configuration-guide.md` ↔ `docs/CONFIGURATION.md`     | **Older** (documents `DDD_ES_CQRS_ROLES`; v2 dropped this import).                                         | `docs/` documents the W1.5 retained role list (`projection`, `service`, …); `docs-sources/` documents three role-set options. **Contradiction.**       | **Accreted** — Sources/Output/GeneratorOverrides tables, full code example.                                                                   |
| `gherkin-patterns.md` ↔ `docs/GHERKIN-PATTERNS.md`     | **Same generation, lean variant** (no Convention Tags section).                                            | `docs/` is the superset; `docs-sources/` adds the "Forbidden in Feature Descriptions" gotcha table (which is actually unique and worth salvaging).     | **Mixed** — heavy code examples are preamble-shaped, but rule-name tables are derivable.                                                      |
| `index-navigation.md` ↔ `docs/INDEX.md`                | **Stale** — references files that don't exist (PRODUCT-AREAS.md, BUSINESS-RULES.md, DataAPICLIErgonomics). | `docs/INDEX.md` is fully maintained; `docs-sources/` is an outdated parallel index.                                                                    | **Accreted** — pure navigation data, exactly what `WikiIndexDefinition` generates.                                                            |
| `process-guard.md` ↔ `docs/PROCESS-GUARD.md`           | **Older** — missing 152 lines of Error Messages and Fixes that `docs/` adds.                               | `docs/` adds the entire error-code guide. `docs-sources/` adds Mermaid Decider diagram and clean Examples block.                                       | **Accreted** — FSM tables, CLI tables, escape-hatch table all derivable.                                                                      |
| `session-workflow-guide.md` ↔ `docs/SESSION-GUIDES.md` | **Same generation, lean variant** — ~40% size of `docs/`, identical skeleton.                              | `docs/` has full checklist code samples + handoff template + Tier-2 stub example; `docs-sources/` has cleaner Mermaid diagram.                         | **Cleanest** of the bunch — mostly editorial framing (decision tree, checklists, narrative) with only the trailing FSM table being derivable. |
| `validation-tools-guide.md` ↔ `docs/VALIDATION.md`     | **Same generation, lean variant** — `docs/` is ~165 lines longer with rule examples.                       | `docs/` adds BAD/GOOD code samples per rule (Two-Pattern Problem); `docs-sources/` is the table-only sketch.                                           | **Accreted** — flag tables, rules tables, CI scripts are all extractor surface.                                                               |

**Pattern across the corpus:** Three of the eight files (`annotation-guide`, `configuration-guide`, `index-navigation`) are **older** than their `docs/` siblings and contradict the v2 surface — they leak the pre-W1.5 vocabulary (`@architect-phase`, `DDD_ES_CQRS_ROLES`, dead presets, dead doc names). The other five are **leaner siblings of the same generation** that were spec'd as "preamble" but accreted derivable tables.

**Net:** The corpus is _not_ a clean stash of editorial framing waiting to be reused. It's a half-finished input-side mirror of the manual docs, with most of the bulk being content that the new design must source from extractors.

---

## C. The "preamble file" specification

Based on this corpus, a healthy `preamble()` file is:

| Property      | Target                                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Length        | **20–60 lines.** `cli-recipes.md` (55) is the upper end of healthy; the per-session splits sketched in A.7 (10–25 lines each) are the sweet spot.                                                                                                               |
| Content type  | Editorial framing — purpose, when-to-use, decision trees, narrative gotchas, irreducible code-pattern examples. **Not** data.                                                                                                                                   |
| Heading depth | Starts at `## ` (the parent `DocDefinition` provides the `# Title` via `heading('…', 1)`). Two heading levels deep at most.                                                                                                                                     |
| Tables        | Allowed only when the data is **categorical and stable** (e.g. "Use Planning + Design" / "Use Planning Only" — the rows describe **rules of thumb**, not configurable values). Anything keyed by a CLI flag, FSM state name, tag name, or rule ID is forbidden. |
| Code blocks   | Allowed for **canonical authoring patterns** (a representative annotated file shape, a Mermaid decision tree). Forbidden for API signatures, schemas, or CLI outputs — those come from extractors / stubs.                                                      |
| Cross-links   | Allowed to other docs in the same generation surface (use stable `routeId`s, not file paths). Forbidden to `docs/` since that tree is going away.                                                                                                               |
| Drift surface | Should be authored once and rarely touched. If a preamble changes when a CLI flag is added, the preamble is **wrong** — that data needs to move into the extractor.                                                                                             |

**Exemplar (KEEP-AS-PREAMBLE):** `docs-sources/cli-recipes.md` (55 lines).

- Single editorial pitch ("Why Use This") + one Quick-Start command block (3 commands, stable) + one sample output (stale — should be excised when porting) + one Session-Types table (4 rows, stable rules of thumb) + one decision sentence.
- Zero CLI-flag tables. Zero schema-derivable lists. Zero references to dead/non-existent files.
- If you stripped the stale sample output (lines 28–43), the remaining ~45 lines are exactly the editorial framing a `preamble('docs-sources/data-api-cli/1-intro.md')` call should load.

**Anti-exemplar (DELETE):** `docs-sources/index-navigation.md` (77 lines).

- 100% navigation data (file → description), partially stale (points at PRODUCT-AREAS.md, DataAPICLIErgonomics, etc. that don't exist).
- This is precisely the content `WikiIndexDefinition` generates from the wiki tree at projection time. Authoring it by hand recreates the duplication that the new design is meant to eliminate.
- Five concept-glossary entries at the bottom are tempting but belong on the canonical types as `@architect-concept` annotations, not in a hand-maintained nav file.

**Honorable mention (also anti-exemplar):** `docs-sources/process-guard.md` (155 lines).

- 85% derivable: every table is FSM-rule data or CLI-flag data. The pre-refactor `PROCESS-GUARD-REFERENCE.md` output confirms the _expected_ split was small preamble + heavy extractor output; this file flipped the ratio and absorbed content that belongs in annotations.

---

## D. Net recommendation

| File                        | Lines     | Salvage verdict          | Target preamble path (if salvaged)                                                                                                                                  | Salvageable lines |
| --------------------------- | --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `annotation-guide.md`       | 221       | SALVAGE-SECTIONS         | `docs-sources/annotation-guide/{1-getting-started,2-ownership-model,3-shape-extraction,6-patterns-by-file-type,7-common-issues}.md` (5 small preambles)             | ~60               |
| `cli-recipes.md`            | 55        | KEEP-AS-PREAMBLE         | `docs-sources/data-api-cli/1-intro.md` (single file)                                                                                                                | ~45               |
| `configuration-guide.md`    | 214       | SALVAGE-SECTIONS         | `docs-sources/configuration-guide/{role-set-choice,discovery-order,monorepo,custom-prefix-intro}.md` (4 small preambles)                                            | ~40               |
| `gherkin-patterns.md`       | 260       | SALVAGE-SECTIONS         | `docs-sources/gherkin-authoring/{roadmap-spec,rule-blocks,scenario-outline,executable-test,code-first,forbidden-syntax}.md` (6 small preambles)                     | ~80               |
| `index-navigation.md`       | 77        | DELETE                   | —                                                                                                                                                                   | 0                 |
| `process-guard.md`          | 155       | SALVAGE-SECTIONS         | `docs-sources/process-guard/{decider-diagram-intro,pre-commit-setup}.md` (2 tiny preambles)                                                                         | ~15               |
| `session-workflow-guide.md` | 152       | KEEP-AS-PREAMBLE (split) | `docs-sources/session-workflow/{1-decision-tree,2-session-contracts,3-execution-order,4-planning,5-design,6-planning-plus-design,7-handoff}.md` (7 small preambles) | ~120              |
| `validation-tools-guide.md` | 263       | SALVAGE-SECTIONS         | `docs-sources/validation-tools/{which-command,dod-rationale,anti-pattern-rationale}.md` (3 small preambles)                                                         | ~30               |
| **Total**                   | **1,397** | —                        | —                                                                                                                                                                   | **~390**          |

**Salvageable: ~390 lines (28%). Discard: ~1,007 lines (72%).**

Roll-up by verdict:

- **KEEP-AS-PREAMBLE (whole file):** 2 of 8 — `cli-recipes.md`, `session-workflow-guide.md`. Together: 207 source lines → ~165 salvageable lines.
- **SALVAGE-SECTIONS:** 5 of 8 — `annotation-guide.md`, `configuration-guide.md`, `gherkin-patterns.md`, `process-guard.md`, `validation-tools-guide.md`. Together: 1,113 source lines → ~225 salvageable lines. The other ~890 lines are derivable (tables, flag lists, rule catalogs, API surfaces) and must come from extractors in the new pipeline.
- **DELETE:** 1 of 8 — `index-navigation.md` (77 lines). Replaced by `WikiIndexDefinition` per PROPOSED-DESIGN § 11.

**Actions for the new doc-generation campaign:**

1. **Do not** seed the new `preamble()` content tree by copying the 8 files wholesale. Three of them carry stale v1 vocabulary that contradicts the post-W1.5 surface (`@architect-phase`, `DDD_ES_CQRS_ROLES`, dead presets).
2. **Do** mine the editorial-framing fragments listed in A.1–A.8 — but author them fresh against the current `docs/` (`docs/ANNOTATION-GUIDE.md`, `docs/CONFIGURATION.md`, `docs/PROCESS-GUARD.md`, `docs/VALIDATION.md`) as the source of truth, using the docs-sources/ extracts only as a structural skeleton.
3. **Best candidates to port first** (lowest drift, highest preamble-shape): `cli-recipes.md` (whole-file) and `session-workflow-guide.md` (split into 7 files). These are the W-DOCS-1 PoC's most defensible pilots — they will exercise the `preamble()` + multi-`DocDefinition` surface with content that genuinely is editorial and that nobody plausibly wants to keep authoring twice.
4. **Best deletion candidate to ship in the same PR as the new design:** `docs-sources/index-navigation.md` — it directly contradicts the `WikiIndexDefinition` premise (D11 navigation derived from tree) and references files that don't exist. Deleting it removes a confusing precedent.
