# Information architecture map — `docs/` corpus

Scope: 15 hand-maintained markdown files under `/Users/darkomijic/dev-projects/architect/docs/`. Total 5,427 lines. Five flagged for deletion; ten substantive migration targets. Maps each section onto the four-channel taxonomy (DATA, DERIVABLE-PROSE, EDITORIAL, WORKED-EXAMPLE, CROSS-REF) and proposes wave assignments for the upcoming W-DOCS campaign.

Read alongside `.pr-coordination/PROPOSED-DESIGN.md` § 10 (wiki-tree-with-index), § 11 (W-DOCS-1 PoC), `DECISIONS.md` D1–D12, and `INVENTORY.md` § 6/§ 7.

---

## A. Delete-on-contact validation

### A.1 `DOCS-GAP-ANALYSIS.md` (795 lines)

**Justification:** Pure meta-document about a previous documentation-consolidation effort that has since been superseded by the current W-DOCS campaign. Contains: a prior gap analysis between `docs/` and `docs-live/`, a now-stale 9-work-package list (WP-1..WP-9), an out-of-date "website publishing pipeline" section referring to a `docs-generated/` directory that no longer participates in `docs:all`, a stale prioritisation matrix, and a stale "spec coverage status" appendix. The current campaign's plan-of-record is `PROPOSED-DESIGN.md` + `DECISIONS.md`, which already supersede every section here. Pure delete.

**Salvage:** None. Any genuinely-useful observation has been re-derived independently in `PROPOSED-DESIGN.md` § 7 (waves) and `INVENTORY.md` § 6 (doc audit). The line counts cited in the appendix are stale.

### A.2 `CROSS-INSTANCE-CONVENTIONS.md` (66 lines)

**Justification:** Documents a "two delivery processes" world that no longer exists. CLAUDE.md states explicitly: "There is exactly one delivery-process instance here (this repo IS the architect family). When studio hosted these packages temporarily, there were two instances and a session-router skill to disambiguate. That complexity is gone now." The `Studio-ADR-NNN` / `Pkg-ADR-NNN` prefix convention, the `architect-pkg` instance label, and the cross-instance ADR-numbering caveats are all post-W1.5 obsolete. Pure delete.

**Salvage:** None. The "Principle ADRs" paragraph (lines 24-36) is the only weakly-reusable nugget (concept that some ADRs are auditable principles, not deliverables) — but that idea, if it survives, belongs in `formal-spec/06-adr-format.md` or `_shared/four-tier-ladder.md`, not in a cross-instance compat doc.

### A.3 `PR-NOTE-TAXONOMY-CAMPAIGN.md` (35 lines)

**Justification:** A reviewer-facing PR note for a campaign already merged ("Wave 1, 2, 2.5, 3, 4, plus M1-M4"). References `.pr-coordination/05-..08-...md` files for a different (earlier) campaign than the current one. The notes about `arch bounded-context` rename, `@architect-uses` narrowing, and the dangling-baseline flag are already captured authoritatively in the executable specs and ADRs they document. Once that PR landed, this file's job ended. Pure delete.

**Salvage:** None.

### A.4 `INDEX.md` (349 lines)

**Justification:** Self-declared deprecated (header: "superseded by the auto-generated `../docs-live/INDEX.md`"). Body is a hand-curated TOC across the 11-doc set, with per-file line-range tables that are out-of-date the moment any doc changes. With the wiki-tree-with-index design (D8), navigation is auto-derived. There is no editorial framing here that the generator cannot reproduce. Pure delete (in current shape).

**Salvage:** The four "Reading Order" lists (lines 41-61: For New Users / For Developers-AI / For Team Leads-CI) are mild editorial framing about audience progression. If retained, these become a short `preamble()` on the future top-level `docs-live/INDEX.md` or a `ReadingPath` definition (DECISIONS § D3a' Reading Paths). Cost is ~20 lines, gain is questionable since the generated navigation surfaces (audience facets, alphabetical, by tier) should cover this. Recommend salvage-only-if-trivial.

### A.5 `TAXONOMY.md` (74 lines)

**Justification:** Self-declared deprecated (header: "use the auto-generated `../docs-live/TAXONOMY.md`"). Body is a thin concept introduction (3 sentences) plus the same format-types table that lives in `formal-spec/03-tag-system.md`, plus regeneration commands, plus a related-docs table. Every fact here is either generated already (`docs-live/TAXONOMY.md`) or duplicated in the formal spec. Pure delete.

**Salvage:** The framing paragraph "A taxonomy in @libar-dev/architect covers three things: Roles / Metadata tags / Format types" is one sentence of editorial value; it belongs as a `preamble()` on the live `taxonomy` wiki-tree index, NOT as a separate file.

---

## B. Per-file TOC inventory (substantive 10)

Coding scheme: `DATA` (table/list from graph/Zod/code) · `D-PROSE` (paragraph from JSDoc/Rule rationale) · `EDIT` (genuine human framing) · `WORKED-EX` (move to executable Gherkin) · `XREF` (pointer-only).

### B.1 `ANNOTATION-GUIDE.md` (214 lines)

Already explicitly defers to `docs-live/reference/ANNOTATION-REFERENCE.md`. Most content is reproducible from the tag registry + Gherkin Rule sources.

| H2 / H3                       | Content shape                                    | Class       |
| ----------------------------- | ------------------------------------------------ | ----------- |
| Getting started — file-level opt-in | TS + Gherkin example blocks                | D-PROSE + WORKED-EX |
| Ownership model               | 2-row table: who owns what                       | D-PROSE (from `_shared/annotation-ownership.md`) |
| Shape extraction (modes 1 + 2)| Two prose blocks describing extractor behaviour  | D-PROSE     |
| Annotation patterns by file type | 4 example blocks (service/contract/barrel/Gherkin) | WORKED-EX (move to Gherkin executable spec) |
| Quick reference by tag group  | Table: 9 groups → representative tags            | DATA (from tag registry) |
| Format types                  | Table: 6 formats with syntax                     | DATA (formal-spec/03 — fragment-reuse) |
| Verification — CLI commands   | 5 CLI invocation examples                        | DATA (from CLI schema) |
| Verification — common issues  | 5-row table: symptom / cause / fix               | EDIT (human-authored troubleshooting) |
| Related documentation         | 5-row link table                                 | XREF (auto from doc graph) |

### B.2 `ARCHITECTURE.md` (1627 lines)

See § D for full decomposition. Headline: 12 H2 sections + ~30 H3/H4 subsections. The largest single document and the most heterogeneous (mixes pipeline schematic, codec catalog, design-pattern rationale, programmatic-usage worked examples, and a CLI quick-reference appendix). Detailed table follows in § D.

### B.3 `CLI.md` (89 lines)

Already a near-empty shell — self-declared deprecated and already redirects to generated pages.

| H2 / H3              | Content shape                                  | Class                          |
| -------------------- | ---------------------------------------------- | ------------------------------ |
| (Preamble)           | Session-start three-command recipe             | EDIT (1 paragraph)             |
| Generated References | 4-link bulleted list to `docs-live/patterns/*` | XREF                           |
| Package-host wrapper | Two code blocks: `pnpm pkg:query` / local      | DATA (from package.json scripts) |
| Output Reference — JSON Envelope | JSON shape + error shape           | DATA (from `QueryResult` Zod schema) |
| Output Reference — Exit Codes | 2-row table                           | DATA (from CLI schema)         |
| Output Reference — JSON Piping | Prose tip + example                  | EDIT                           |

### B.4 `MCP-SETUP.md` (138 lines)

Pure operational reference — but most content is mechanically derivable from the MCP tool registry and CLI schema.

| H2 / H3                | Content shape                                          | Class                                |
| ---------------------- | ------------------------------------------------------ | ------------------------------------ |
| Quick Start — Claude Code | JSON `.mcp.json` snippet                            | EDIT (canonical config example)     |
| Quick Start — Claude Desktop | JSON snippet                                     | EDIT                                 |
| Quick Start — With File Watching | JSON snippet                                 | EDIT                                 |
| Quick Start — With Explicit Globs (Monorepo) | JSON snippet                     | EDIT                                 |
| How It Works           | 4-bullet description of dataset loading + caching      | D-PROSE (from JSDoc on PipelineSession) |
| Available Tools        | 18-row table: tool name → description                  | DATA (from `architect-mcp` tool registry) |
| CLI Options            | Flag table (`-i`, `-f`, `-b`, `-w`, `-h`, `-v`)        | DATA (from CLI Zod schema)           |
| Troubleshooting        | 3 micro-paragraphs                                     | EDIT                                 |

### B.5 `CONFIGURATION.md` (267 lines)

Self-declared deprecated; live source is `docs-live/reference/CONFIGURATION-GUIDE.md`. Body is mostly Zod-schema-shaped.

| H2 / H3                   | Content shape                                              | Class                                       |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| Quick Reference           | Role-set list + minimal `defineConfig` code                | DATA (from role catalog + Zod schema)       |
| Quick Reference — Role-set behavior | 2-row table                                      | D-PROSE                                     |
| Quick Reference — Default selection | 1 paragraph                                       | D-PROSE                                     |
| Role examples — Service-style | TS code block                                         | WORKED-EX                                   |
| Role examples — Contract-style | TS code block                                        | WORKED-EX                                   |
| Unified Config File — Discovery Order | 3-step list                                  | DATA (from `loadProjectConfig` JSDoc)       |
| Unified Config File — Config File Format | TS code block                             | EDIT (canonical example)                    |
| Unified Config File — Sources Configuration | Field table                            | DATA (from `ArchitectProjectConfig` Zod schema) |
| Unified Config File — Output Configuration  | Field table                            | DATA (Zod)                                  |
| Unified Config File — Generator Overrides   | Table + example                        | DATA + EDIT                                 |
| Unified Config File — Monorepo Example      | Directory-tree snippet + paragraph     | EDIT                                        |
| Custom Configuration — Custom Tag Prefix    | TS example                             | WORKED-EX                                   |
| Custom Configuration — Custom Roles         | TS example                             | WORKED-EX                                   |
| Programmatic Config Loading | TS code block                                            | DATA (from `loadProjectConfig` shape)       |
| Related Documentation     | 4-row link table                                           | XREF                                        |

### B.6 `GHERKIN-PATTERNS.md` (365 lines)

Self-declared deprecated. Heavy on example Gherkin blocks — almost every section is a candidate executable spec.

| H2 / H3                          | Content shape                                | Class                                |
| -------------------------------- | -------------------------------------------- | ------------------------------------ |
| Essential Patterns — Roadmap Spec Structure | Gherkin example + bullet of "key elements" | WORKED-EX + D-PROSE     |
| Essential Patterns — Rule Blocks | Gherkin Outline example                      | WORKED-EX                            |
| Essential Patterns — Scenario Outline | Outline example                         | WORKED-EX                            |
| Essential Patterns — Executable Test Feature | Gherkin example                  | WORKED-EX                            |
| DataTable & DocString Usage — Background DataTable | example                    | WORKED-EX                            |
| DataTable & DocString Usage — Scenario DataTable   | example                    | WORKED-EX                            |
| DataTable & DocString Usage — DocString for Code   | example                    | WORKED-EX                            |
| Tag Conventions — Semantic Tags  | 9-row tag table                              | DATA (from registry — these are scenario tags) |
| Tag Conventions — Convention Tags | 4-row tag table                             | D-PROSE                              |
| Tag Conventions — Combining Tags | Gherkin snippet                              | WORKED-EX                            |
| Feature File Rich Content — Code-First Principle | 2 paragraphs + 2-row table   | EDIT (genuine doctrine)              |
| Feature File Rich Content — Rule Block Structure | Rule example + 3-row table   | D-PROSE (mirrors formal-spec/05 § 6) |
| Feature File Rich Content — Feature Description Patterns | 3-row table          | D-PROSE                              |
| Feature File Rich Content — Valid Rich Content | 6-row content-type table       | D-PROSE                              |
| Feature File Rich Content — Syntax Notes       | Two paragraphs                 | D-PROSE                              |
| Quick Reference                  | 6-row element-use table                      | DATA (cross-link table)              |
| Related Documentation            | 4-row link table                             | XREF                                 |

### B.7 `METHODOLOGY.md` (249 lines)

Explicitly self-declared editorial: "This document contains design philosophy and rationale that cannot be auto-generated from code annotations." But large portions are still derivable.

| H2 / H3                          | Content shape                                              | Class                                  |
| -------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Core Thesis                      | 1 paragraph + 4-row "USDP vs Traditional" comparison table | EDIT                                   |
| Core Thesis — The Insight        | Bullet list (Events / Projections / Read Model)            | EDIT                                   |
| Dogfooding                       | 2 TS code-block examples + connecting prose                | WORKED-EX                              |
| Session Workflow                 | 4-row session-table + 3-row skip table                     | D-PROSE (overlaps `_shared/four-tier-ladder.md`) |
| Annotation ownership strategy    | Doctrine paragraph + 2 tables (feature owns / TS owns) + example split | D-PROSE (canonical-doc = `_shared/annotation-ownership.md`) |
| Two-Tier Spec Architecture       | 4-row tier table + "Executable Coverage Patterns" paragraph | D-PROSE (canonical-doc = `_shared/four-tier-ladder.md`) |
| Code Stubs                       | TS stub example + 3-row level table                        | D-PROSE (canonical-doc = `formal-spec/07-stub-format.md`) |
| Stubs Architecture — Code Stubs (Design Artifacts) | Directory tree + 3-row phase table       | D-PROSE (canonical-doc = `formal-spec/07`) |
| Stubs Architecture — Planning Stubs | Directory tree + 3-row phase table                      | D-PROSE                                |
| Related Documentation            | 5-row link table                                           | XREF                                   |

### B.8 `PROCESS-GUARD.md` (341 lines)

Self-declared deprecated. Body splits between the FSM rule catalog (mechanically derivable from the Decider) and the per-error troubleshooting essays (genuinely editorial).

| H2 / H3                       | Content shape                                          | Class                                |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------ |
| Quick Reference — Protection Levels | 4-row table                                       | DATA (from FSM Decider)              |
| Quick Reference — Valid Transitions | 4-row table                                       | DATA (from FSM transitions table)    |
| Quick Reference — Escape Hatches | 4-row table                                         | EDIT (operator handbook)             |
| Error: `completed-protection` | Error message block + 3 paragraphs + 1 Gherkin example | D-PROSE (from validator JSDoc) + WORKED-EX |
| Error: `invalid-status-transition` | Error block + fix snippets + 4-row invalid-transitions table | DATA + EDIT |
| Error: `scope-creep`          | Error block + 2 fix options + rationale paragraph     | D-PROSE                              |
| Warning: `session-scope`      | Warning block + 2 fix options                          | D-PROSE                              |
| Error: `session-excluded`     | Error block + 2 fix options                            | D-PROSE                              |
| Warning: `deliverable-removed` | Warning block + 1 fix paragraph                       | D-PROSE                              |
| CLI Usage — Modes             | 3-row flag table                                       | DATA (CLI schema)                    |
| CLI Usage — Options           | 6-row flag table                                       | DATA (CLI schema)                    |
| CLI Usage — Exit Codes        | 2-row table                                            | DATA                                 |
| CLI Usage — Examples          | 5 bash invocations                                     | EDIT (recipes — canonical examples)  |
| Pre-commit Setup — Husky      | Bash snippet                                           | EDIT                                 |
| Pre-commit Setup — package.json | JSON snippet                                         | EDIT                                 |
| Programmatic API              | TS code example + 7-row function table                 | DATA (from `@libar-dev/architect-guard` exports) |
| Architecture                  | ASCII diagram + 2 paragraphs                           | D-PROSE                              |
| Related Documentation         | 3-row link table                                       | XREF                                 |

### B.9 `SESSION-GUIDES.md` (391 lines)

Long checklist-style operational doc. Heavy overlap with `_shared/` and the session-skill bodies.

| H2 / H3                          | Content shape                                              | Class                                 |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| Session Decision Tree            | ASCII decision tree                                        | EDIT                                  |
| Session Decision Tree — comparison | 4-row session-type table                                 | D-PROSE (canonical-doc = `_shared/four-tier-ladder.md`) |
| Planning Session — Context Gathering | 2 bash commands                                        | DATA (CLI schema)                     |
| Planning Session — Checklist     | 6 checklist items with embedded Gherkin                    | D-PROSE                               |
| Planning Session — Do NOT        | 3-bullet anti-list                                         | EDIT                                  |
| Planning Session — Example       | XREF only                                                  | XREF                                  |
| Design Session — Context Gathering | 3 bash commands                                          | DATA                                  |
| Design Session — When Required   | 2-col table                                                | D-PROSE                               |
| Design Session — Checklist       | 6 checklist items + stub example                           | D-PROSE + WORKED-EX                   |
| Design Session — Do NOT          | 4-bullet anti-list                                         | EDIT                                  |
| Implementation Session — Context Gathering (Step 0) | 3 bash commands                       | DATA                                  |
| Implementation Session — Execution Checklist | 6-step procedure with Gherkin examples         | D-PROSE                               |
| Implementation Session — Do NOT  | 4-bullet anti-list                                         | EDIT                                  |
| Planning + Design — When to Use  | 2-col table                                                | D-PROSE                               |
| Planning + Design — Checklist    | 6-step procedure                                           | D-PROSE                               |
| Planning + Design — Handoff Complete When | Three sub-checklists                              | D-PROSE                               |
| Handoff Documentation            | Bash + markdown template + Gherkin discovery-tag examples  | EDIT                                  |
| Quick Reference: FSM Protection  | 4-row protection-level table                               | DATA (FSM)                            |
| Related Documentation            | 6-row link table                                           | XREF                                  |

### B.10 `VALIDATION.md` (427 lines)

CLI-flag-heavy reference; most content is Zod-driven.

| H2 / H3                          | Content shape                                            | Class                                  |
| -------------------------------- | -------------------------------------------------------- | -------------------------------------- |
| Which Command Do I Run?          | ASCII decision tree                                      | EDIT                                   |
| Command Summary                  | 4-row table                                              | DATA (from CLI registry)               |
| `lint-patterns` — CLI Flags      | 7-row flag table                                         | DATA (CLI Zod schema)                  |
| `lint-patterns` — Rules          | 8-row rule table                                         | DATA (from `LintRule` registry)        |
| `lint-steps`                     | Preamble + scope description                             | D-PROSE                                |
| `lint-steps` — Feature File Rules | 5-row table                                             | DATA (lint-steps rule registry)        |
| `lint-steps` — `hash-in-description` | Bad/good Gherkin examples                            | WORKED-EX                              |
| `lint-steps` — `keyword-in-description` | Bad/good examples                                 | WORKED-EX                              |
| `lint-steps` — Step Definition Rules | 3-row table                                          | DATA                                   |
| `lint-steps` — `regex-step-pattern` | Bad/good TS examples                                  | WORKED-EX                              |
| `lint-steps` — Cross-File Rules  | 4-row table                                              | DATA                                   |
| `lint-steps` — The Two-Pattern Problem | Bad/good cross-file example                        | WORKED-EX                              |
| `lint-steps` — `missing-and-destructuring` | Bad/good TS examples                           | WORKED-EX                              |
| `lint-steps` — CLI Reference     | 3-row flag table + scan-scope literal + exit codes       | DATA                                   |
| `architect-guard`                | 4-bullet capability list + XREF to PROCESS-GUARD         | XREF                                   |
| `validate-patterns` — CLI Flags  | 12-row flag table                                        | DATA                                   |
| `validate-patterns` — Architecture Note (ADR-006) | 2 paragraphs                            | D-PROSE                                |
| `validate-patterns` — Anti-Pattern Detection | 2 sub-tables                                  | DATA                                   |
| `validate-patterns` — DoD Validation | 2 bullets                                            | D-PROSE                                |
| CI/CD Integration — package.json scripts | JSON snippet                                     | DATA + EDIT                            |
| CI/CD Integration — Pre-commit / GitHub Actions | 2 bash/yaml snippets                      | EDIT                                   |
| Exit Codes                       | 2-col table                                              | DATA                                   |
| Programmatic API                 | TS code block + reference                                | DATA (from package exports)            |
| Related Documentation            | 4-row link table                                         | XREF                                   |

---

## C. Overlap with `formal-spec/` and `_shared/`

Severity: H = full subject overlap (high drift risk if both retained), M = significant subset overlap, L = passing reference. The deletion targets per D5 are `docs/` and `formal-spec/` themselves; this table maps what data sources to point the fragment at.

| docs/ file              | formal-spec/ overlap                                 | _shared/ overlap                              | Sev |
| ----------------------- | ---------------------------------------------------- | --------------------------------------------- | --- |
| ANNOTATION-GUIDE.md     | `03-tag-system.md` (full), `04-tag-registry.md`, `05-feature-spec-format.md` (Tag Header Block § 1) | `annotation-ownership.md` (full) | H   |
| ARCHITECTURE.md         | `10-pattern-graph.md` (full), `11-project-configuration.md` (Configuration Architecture), `12-live-documentation-api.md` (Codec Architecture / Available Codecs) | `canonical-references.md` (passing) | H   |
| CLI.md                  | `12-live-documentation-api.md` (CLI surface)         | `canonical-references.md` (data API)          | M   |
| MCP-SETUP.md            | `12-live-documentation-api.md` (MCP tool surface)    | `canonical-references.md` (MCP)               | M   |
| CONFIGURATION.md        | `11-project-configuration.md` (full overlap — schema, role sets, layout) | none                          | H   |
| GHERKIN-PATTERNS.md     | `05-feature-spec-format.md` (full — § 1-7), `08-spec-evolution.md` (lifecycle examples) | `rule-block-template.md` (Rule structure), `spec-pattern-relationships.md` (passing) | H   |
| METHODOLOGY.md          | `00-overview.md` (Core thesis), `06-adr-format.md` (decisions), `07-stub-format.md` (Code Stubs / Stubs Architecture), `08-spec-evolution.md` (tier ownership) | `four-tier-ladder.md` (full), `annotation-ownership.md` (full), `value-transfer.md` (passing), `multi-session-coordination.md` (passing) | H   |
| PROCESS-GUARD.md        | `09-delivery-lifecycle.md` (FSM, protection levels, ProcessGuard rules — full overlap) | `fsm-transitions.md` (full) | H   |
| SESSION-GUIDES.md       | `09-delivery-lifecycle.md` (Session Types, Scope-Validate Pre-Flight), `08-spec-evolution.md` (tier transitions) | `four-tier-ladder.md`, `value-transfer.md`, `multi-session-coordination.md`, `session-preamble.md` (all H), `spec-pattern-relationships.md` (M) | H   |
| VALIDATION.md           | `09-delivery-lifecycle.md` (ProcessGuard validation) | `fsm-transitions.md` (M), `annotation-ownership.md` (L) | M   |

Concrete chain examples (mirrors INVENTORY.md § 6 drift table):

- `docs/PROCESS-GUARD.md` ↔ `formal-spec/09-delivery-lifecycle.md` ↔ `_shared/fsm-transitions.md` ↔ `validation/fsm/transitions.ts` — four locations all stating the same FSM rules. Single `fsm-transitions` ContentFragment sourced from the transitions table closes all four.
- `docs/CONFIGURATION.md` ↔ `formal-spec/11-project-configuration.md` ↔ Zod `project-config-schema.ts` — three locations all stating the same config field set. Single `project-config-schema` ContentFragment with `reflects: project-config-schema.ts` closes all three.
- `docs/ANNOTATION-GUIDE.md` ↔ `formal-spec/04-tag-registry.md` ↔ `docs-live/TAXONOMY.md` ↔ `_shared/annotation-ownership.md` — already flagged as the tag-registry drift surface.
- `docs/METHODOLOGY.md` § Two-Tier Spec Architecture ↔ `_shared/four-tier-ladder.md` ↔ `formal-spec/08-spec-evolution.md` — same tier story told three times.
- `docs/GHERKIN-PATTERNS.md` § Rule Block Structure ↔ `_shared/rule-block-template.md` ↔ `formal-spec/05-feature-spec-format.md` § 6 — Rule block authoring told three times.

---

## D. ARCHITECTURE.md decomposition (1627 lines)

The single biggest doc, and the most heterogeneous. The header already concedes deprecation in favour of three generated outputs: `docs-live/ARCHITECTURE.md`, `docs-live/reference/ARCHITECTURE-CODECS.md`, `docs-live/reference/ARCHITECTURE-TYPES.md`.

### D.1 Section-by-section map

| H2 §                           | Lines       | Subject                                  | Derivable from                                          | Editorial residue                                    | Owned by                                       |
| ------------------------------ | ----------- | ---------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| Executive Summary              | 30-69       | One-paragraph package pitch              | Partly — overview blurb is human                        | What This Package Does + Key Design Principles → `preamble()` | `formal-spec/00-overview.md`                   |
| Configuration Architecture     | 72-139      | Configuration entry point + resolution flow | Yes — extract from `defineConfig` JSDoc + `resolveProjectConfig` shape | Configuration Resolution diagram                    | `formal-spec/11-project-configuration.md`, fragment `project-config-schema` |
| Four-Stage Pipeline            | 142-345     | Scanner → Extractor → Transformer → Codec | Yes — all stages have annotated entry-points         | The 4 stage-purpose paragraphs are editorial framing | `formal-spec/10-pattern-graph.md`              |
| Pipeline Factory (ADR-006)     | 219-302 (sub) | `buildPatternGraph()` signature + 4 sub-tables | Yes — extractor on `PipelineOptions` / `BuildResult` / `PipelineWarning` / `ScanMetadata` / `PipelineError` Zod schemas | Anti-pattern paragraph                              | Same                                           |
| Unified Transformation         | 348-477     | `PatternGraph` schema + RuntimePatternGraph + single-pass | Yes — `PatternGraphSchema` is a Zod source        | Innovation framing paragraph                         | `formal-spec/10-pattern-graph.md`              |
| Codec Architecture             | 481-525     | Block vocabulary + codec concepts + factory pattern | Yes — block enum + codec exports inventory      | Concepts paragraph                                   | `formal-spec/12-live-documentation-api.md`, fragment `block-type-catalog` |
| Available Codecs               | 527-863     | 21 codec entries with options tables     | Yes (full) — every codec has a Zod options schema       | None of substance                                    | `docs-live/reference/ARCHITECTURE-CODECS.md` (already lives here) |
| Progressive Disclosure         | 866-911     | Split logic + detail levels + 11-row split-pattern table | Yes — extract from codec config                         | Three short framing paragraphs                       | Fragment `progressive-disclosure-split`         |
| Source Systems                 | 914-1013    | TypeScript scanner + Gherkin scanner + Status Normalization | Yes — scanner JSDoc + Gherkin TAG_LOOKUP             | None of substance                                    | `formal-spec/10-pattern-graph.md` (extraction sub-section) |
| Key Design Patterns            | 1015-1093   | Result monad + Schema-first + Tag Registry | Half-derivable — code examples are real, prose is doctrine | Three doctrinal paragraphs                         | `_shared/*` (TBD — likely a new `result-monad.md` shared doc — or `formal-spec` if it's normative) |
| Data Flow Diagrams             | 1096-1277   | 3 ASCII art diagrams (orchestrator + factory + graph views + codec txform) | No — these are hand-drawn. Auto-generate Mermaid equivalents from the pipeline. | None — ASCII art is replaceable by generated Mermaid | Generator output (Mermaid)                     |
| Workflow Integration           | 1281-1389   | 4 workflows (planning / impl / release / session-context) with TS examples | Partly — code examples ARE real codec usage examples    | Workflow framing paragraphs (~half editorial)        | Move TS to executable Gherkin under `tests/features/programmatic-usage/*.feature`; keep framing as preamble |
| Programmatic Usage             | 1392-1445   | 3 TS examples (direct codec / generateDocument / additionalFiles) | Yes — derive from package exports                    | A few connecting paragraphs                          | Same as above                                  |
| Extending the System           | 1449-1514   | Custom codec + custom generator examples | Half-derivable — show the shape of `z.codec` + `DocumentGenerator` interface, but the editorial walkthrough is real | Two paragraphs of framing                            | `formal-spec/12-live-documentation-api.md` (extension points sub-section) |
| Quick Reference                | 1518-1591   | Codec-to-generator mapping table + CLI examples + filter patterns + output mode shortcuts | Yes (full) — derivable from registry                    | None of substance                                    | Generated CLI reference                        |
| Related Documentation          | 1595-1602   | 4-row link list                          | Yes                                                     | None                                                 | Auto-derived doc graph                         |
| Code References                | 1604-1627   | 22-row file/symbol catalog               | Yes (full) — file inventory from package source         | None                                                 | Auto-derived from `@architect-implements`      |

### D.2 Proposed wiki-tree shape (`docs-live/architecture/`)

Wiki-tree-with-index per DECISIONS § D1 + § D8. Root index aggregates child summaries; each child page is one bounded subject; navigation surfaces (Mermaid index map, breadcrumb, audience facets) are derived.

```
docs-live/architecture/
├── INDEX.md                       # preamble() + child summaries + nav surfaces (D8 derived)
├── 01-overview.md                 # ← "Executive Summary" preamble + key principles table + pipeline diagram
├── 02-configuration.md            # ← "Configuration Architecture" (resolve flow, files, fragment `project-config-schema`)
├── 03-pipeline-stages.md          # ← "Four-Stage Pipeline" sans Pipeline-Factory sub
├── 04-pipeline-factory.md         # ← "Pipeline Factory (ADR-006)" full sub-section
├── 05-pattern-graph.md            # ← "Unified Transformation" (schema, RuntimePatternGraph, single-pass)
├── 06-codecs/                     # nested wiki tree
│   ├── INDEX.md                   # codec catalog overview + table
│   ├── concepts.md                # ← "Codec Architecture" (block vocab, factory pattern)
│   ├── progressive-disclosure.md  # ← "Progressive Disclosure"
│   ├── pattern-focused.md         # PatternsDocument, Requirements
│   ├── timeline-focused.md        # Roadmap, Milestones, CurrentWork, Changelog
│   ├── session-focused.md        # SessionContext, RemainingWork
│   ├── planning.md                # PlanningChecklist, SessionPlan, SessionFindings
│   ├── other.md                   # Adr, PrChanges, Traceability, Overview, BusinessRules, Architecture, Taxonomy, ValidationRules
│   └── reference-and-composition.md # ReferenceCodec, CompositeCodec
├── 07-source-systems.md           # ← "Source Systems" (TS scanner, Gherkin scanner, status normalisation)
├── 08-design-patterns.md          # ← "Key Design Patterns" (Result monad, schema-first, tag registry)
├── 09-data-flow.md                # ← "Data Flow Diagrams" but rendered as generated Mermaid
├── 10-workflows.md                # ← "Workflow Integration" (planning/impl/release/session-context)
├── 11-programmatic-usage.md       # ← "Programmatic Usage" + "Extending the System"
└── 12-reference.md                # ← "Quick Reference" + "Code References" (auto-derived tables)
```

Mapping notes:

- The current "Available Codecs" mega-section (~340 lines) becomes the `06-codecs/` sub-tree — itself a wiki-tree-with-index of 8 leaf pages grouped by the existing H3 sub-categories. One leaf per codec class, options table generated from each codec's Zod schema.
- The 22-row "Code References" appendix (lines 1604-1627) becomes an auto-derived block on `12-reference.md` — sourced from `@architect-implements` edges. No hand maintenance.
- `01-overview.md` is the only page with significant `preamble()` content; everything else is data-table-driven.
- `09-data-flow.md` REPLACES the four ASCII diagrams with generated Mermaid (codec dispatch graph, PatternGraph view fan-out, pipeline factory data flow). Per D8, the index map at INDEX.md is a Mermaid of the directory tree itself.

### D.3 What goes to `_shared/` / `formal-spec/` instead

| Subject                         | Target                                                  | Reason                                                                       |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| PatternGraph schema             | `formal-spec/10-pattern-graph.md` (already canonical)   | Spec, not implementation                                                     |
| Configuration schema            | `formal-spec/11-project-configuration.md` (canonical)   | Spec, not implementation                                                     |
| Block vocabulary                | `formal-spec/12-live-documentation-api.md` (canonical)  | Spec                                                                         |
| Result monad                    | New `_shared/result-monad.md` OR `formal-spec` if normative | Pattern is used everywhere — cross-cuts both impl and spec                |
| Tag registry algorithm          | `formal-spec/04-tag-registry.md` (canonical)            | Spec                                                                         |
| FSM enforcement                 | `formal-spec/09-delivery-lifecycle.md` + `_shared/fsm-transitions.md` | Spec + shared kernel                                                |

---

## E. Per-doc migration recommendation

Migration-kind legend:
- **WIKI-TREE** = ≥3 child pages + index per D1 / D8
- **SINGLE-DOC** = one generated page, possibly under a parent wiki tree
- **GENERATED-INSERT-ONLY** = source content goes only into fragments + insert directives; no standalone doc
- **DELETE** = no replacement
- **SALVAGE-TO-PREAMBLE** = squeeze residual editorial into a `preamble()` on another doc; no standalone doc

Waves per `PROPOSED-DESIGN.md` § 7 + § 10.3 (W-DOCS-1 PoC narrows to one file).

| Doc                            | Lines | Migration kind         | Wave                  | Key extractors needed                                                                                          | Notes                                                                                       |
| ------------------------------ | ----- | ---------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ANNOTATION-GUIDE.md            | 214   | WIKI-TREE              | W-DOCS-1 (PoC target per D4') | tag-registry, format-types, annotation-ownership, file-opt-in-marker (4 fragments)                   | This IS the W-DOCS-1 meta-PoC subject. Becomes `.agents/skills/annotation-guide/` wiki tree per D7. |
| ARCHITECTURE.md                | 1627  | WIKI-TREE              | W-DOCS-5              | codec-catalog, block-types, pipeline-stages, pattern-graph-schema, project-config-schema, progressive-disclosure, code-references | Largest doc; becomes `docs-live/architecture/` tree of 12+ pages — see § D.2. |
| CLI.md                         | 89    | SINGLE-DOC             | W-DOCS-5              | cli-command-catalog, json-envelope-schema                                                                       | Already a thin redirect; generate from CLI Zod schema like the existing `docs-live/reference/CLI-REFERENCE.md`. |
| MCP-SETUP.md                   | 138   | SINGLE-DOC             | W-DOCS-5              | mcp-tool-catalog, mcp-cli-options                                                                               | Mostly auto-derivable; keep canonical `.mcp.json` examples as preamble.                      |
| CONFIGURATION.md               | 267   | SINGLE-DOC             | W-DOCS-2 + W-DOCS-5   | project-config-schema (from Zod), role-set-catalog, generator-overrides-schema                                  | Heavy Zod-driven content; one of the cleanest migrations.                                    |
| GHERKIN-PATTERNS.md            | 365   | WIKI-TREE              | W-DOCS-5              | scenario-tag-catalog, rule-block-template, datatable-shapes, feature-rich-content-rules                          | Move 11 worked-example Gherkin blocks into `tests/features/authoring/*.feature`; keep doctrine prose as preamble fragments. |
| METHODOLOGY.md                 | 249   | SALVAGE-TO-PREAMBLE + GENERATED-INSERT-ONLY | W-DOCS-6 (doctrine carrier) | annotation-ownership, four-tier-ladder, stub-format (all canonical-doc'd to `_shared/` or `formal-spec/`) | The "Editorial Document" framing is honest, but most overlaps with `_shared/`. Distill the *genuinely* editorial Core-Thesis (~30 lines) into a preamble; everything else routes through fragments to existing canonical docs. |
| PROCESS-GUARD.md               | 341   | SINGLE-DOC             | W-DOCS-5              | fsm-transitions, protection-levels, processguard-error-catalog, processguard-cli-flags                          | Error-catalog section is genuinely editorial; protection levels and transitions are pure DATA. Replaces `docs-live/reference/PROCESS-GUARD-REFERENCE.md` (already a thin equivalent). |
| SESSION-GUIDES.md              | 391   | WIKI-TREE              | W-DOCS-6 (doctrine carrier — D7) | session-types, four-tier-ladder, scope-validate-rules, session-checklist-templates                  | Per D7 this is canonically a tree of `.agents/skills/architect-*-session/` skills. The standalone `docs/SESSION-GUIDES.md` becomes generated-insert into a single overview page at `docs-live/sessions/INDEX.md`. |
| VALIDATION.md                  | 427   | SINGLE-DOC             | W-DOCS-5              | lint-rule-catalog (lint-patterns), lint-rule-catalog (lint-steps), validate-cli-flags, dod-checks, anti-pattern-detectors | Already exists as `docs-live/reference/VALIDATION-TOOLS-GUIDE.md` — just needs the new fragment-based pipeline. |
| --- (dead weight)              |       |                        |                       |                                                                                                                |                                                                                             |
| DOCS-GAP-ANALYSIS.md           | 795   | DELETE                 | W-DOCS-7              | —                                                                                                              | Pure delete.                                                                                |
| CROSS-INSTANCE-CONVENTIONS.md  | 66    | DELETE                 | W-DOCS-7              | —                                                                                                              | Pure delete (post-W1.5 obsolete).                                                           |
| PR-NOTE-TAXONOMY-CAMPAIGN.md   | 35    | DELETE                 | W-DOCS-7              | —                                                                                                              | Pure delete (PR landed).                                                                    |
| INDEX.md                       | 349   | DELETE (auto-replaced) | W-DOCS-3 / W-DOCS-7   | doc-graph (for auto-derived nav)                                                                               | Auto-replaced by generated `docs-live/INDEX.md` + per-tree INDEX.md pages.                  |
| TAXONOMY.md                    | 74    | DELETE                 | W-DOCS-7              | —                                                                                                              | Concept paragraph salvageable as `preamble()` on `docs-live/TAXONOMY.md`.                   |

---

## F. ContentFragment opportunities specific to `docs/`

Each fragment is reused across at least two of the 10 substantive docs. ID conventions follow `PROPOSED-DESIGN.md` § 3b (kebab-case, single noun). Disclosure depths follow `PROPOSED-DESIGN.md` § 10.4 (essential / important / useful / advanced).

| #   | Fragment ID                  | Canonical doc                                            | Data source                                                                                       | Embedded in (file · disclosure)                                                                                                |
| --- | ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| F1  | `fsm-transitions`            | `formal-spec/09-delivery-lifecycle.md`                   | `packages/architect-guard/src/lint/fsm/transitions.ts` (Decider)                                  | PROCESS-GUARD.md `advanced`; VALIDATION.md `important`; SESSION-GUIDES.md `important`; METHODOLOGY.md `useful`; `_shared/fsm-transitions.md` `advanced` |
| F2  | `protection-levels`          | `formal-spec/09-delivery-lifecycle.md`                   | `packages/architect-guard/src/lint/process-guard/protection-levels.ts`                            | PROCESS-GUARD.md `advanced`; SESSION-GUIDES.md `important`; VALIDATION.md `useful`                                            |
| F3  | `project-config-schema`      | `formal-spec/11-project-configuration.md`                | `packages/architect-core/src/config/project-config-schema.ts` (Zod, with `reflects:`)             | CONFIGURATION.md `advanced`; ARCHITECTURE.md (`02-configuration.md`) `advanced`; MCP-SETUP.md `useful`                        |
| F4  | `tag-registry`               | `formal-spec/04-tag-registry.md`                         | `packages/architect-core/src/taxonomy/registry-builder.ts` + `docs-live/TAXONOMY.md`              | ANNOTATION-GUIDE.md `advanced`; GHERKIN-PATTERNS.md `useful`; CONFIGURATION.md `important`; METHODOLOGY.md `useful`            |
| F5  | `format-types`               | `formal-spec/03-tag-system.md` § Format Types            | tag-registry format-type enum                                                                     | ANNOTATION-GUIDE.md `important`; CONFIGURATION.md `useful`; (legacy) TAXONOMY.md `link-only`                                  |
| F6  | `annotation-ownership`       | `_shared/annotation-ownership.md`                        | hand-written kernel; reflected by lint-patterns rules                                             | ANNOTATION-GUIDE.md `important`; METHODOLOGY.md `advanced`; GHERKIN-PATTERNS.md `useful`                                       |
| F7  | `rule-block-template`        | `_shared/rule-block-template.md` (with `formal-spec/05-feature-spec-format.md § 6` cross-link) | hand-written kernel + Rule extractor                                                | GHERKIN-PATTERNS.md `advanced`; METHODOLOGY.md `useful`; SESSION-GUIDES.md `useful`                                            |
| F8  | `cli-command-catalog`        | `formal-spec/12-live-documentation-api.md` § CLI surface | `packages/architect-cli/src/commands/` (CLI Zod schemas)                                          | CLI.md `advanced`; SESSION-GUIDES.md `important`; PROCESS-GUARD.md `useful`; VALIDATION.md `useful`                            |
| F9  | `mcp-tool-catalog`           | `formal-spec/12-live-documentation-api.md` § MCP surface | `packages/architect-mcp/src/tool-registry.ts`                                                     | MCP-SETUP.md `advanced`; CLI.md `link-only`                                                                                    |
| F10 | `codec-catalog`              | `docs-live/architecture/06-codecs/INDEX.md`              | `packages/architect-projection/src/codecs/*` exports + per-codec options Zod                      | ARCHITECTURE.md (`06-codecs/`) `advanced`; CONFIGURATION.md (generator overrides) `useful`                                     |
| F11 | `four-tier-ladder`           | `_shared/four-tier-ladder.md`                            | hand-written kernel + spec lifecycle extractor                                                    | METHODOLOGY.md `advanced`; SESSION-GUIDES.md `important`; SESSION-GUIDES.md children `useful`                                  |
| F12 | `stub-format`                | `formal-spec/07-stub-format.md`                          | hand-written spec + `architect/stubs/` extractor                                                  | METHODOLOGY.md `important`; SESSION-GUIDES.md (Design Session) `important`; ARCHITECTURE.md `link-only`                       |
| F13 | `progressive-disclosure-split` | `docs-live/architecture/06-codecs/progressive-disclosure.md` | codec config table from each codec's Zod options                                            | ARCHITECTURE.md `advanced`; CONFIGURATION.md `useful`                                                                          |
| F14 | `scenario-tag-catalog`       | `docs-live/reference/GHERKIN-AUTHORING-GUIDE.md`         | `packages/architect-core/src/taxonomy/scenario-tags.ts`                                            | GHERKIN-PATTERNS.md `advanced`; ANNOTATION-GUIDE.md `useful`; SESSION-GUIDES.md `useful`                                       |

Each of F1, F2, F3, F4, F8 closes a documented drift surface from `INVENTORY.md` § 6. F1 + F2 + F12 are also the most-reused fragments (≥4 consumers each) and are good first-wave PoC targets.

---

## G. The `docs/INDEX.md` question

**Recommendation:** Delete `docs/INDEX.md`; replace with auto-generated `docs-live/INDEX.md` (already exists today and is the declared replacement) that aggregates per-wiki-tree INDEX pages.

### Reasoning

1. **D8 explicitly mechanises navigation.** Index emission is mechanical: every wiki tree directory has a per-tree `INDEX.md` derived from child summaries + Mermaid index map + breadcrumb + audience facets. A hand-maintained docs/INDEX.md cannot beat the generator on freshness, and the line-range-per-file tables in the current `docs/INDEX.md` are already stale on every edit.

2. **D1 declares the wiki-tree-with-index a first-class shape.** That means the top-level `docs-live/INDEX.md` is the aggregator of all wiki-tree INDEX pages — itself one wiki-tree-with-index whose children are the other wiki trees (`docs-live/architecture/INDEX.md`, `docs-live/sessions/INDEX.md`, `docs-live/reference/INDEX.md`, `formal-spec/INDEX.md`, etc.). The generator can compose this top-level INDEX from the metadata each child tree's INDEX already declares.

3. **D5 names `docs/` itself as a deletion target.** Retaining a hand-maintained INDEX inside a directory slated for deletion would be a regression.

4. **What we keep from the existing file is small and salvageable.**
   - The four "Reading Order" lists (For New Users / For Developers-AI / For Team Leads-CI / For Maintainers) are mild editorial framing about audience progression. If retained, these become a `preamble()` slot on `docs-live/INDEX.md` or a small ReadingPath set (DECISIONS § D3a' Reading Paths).
   - The "Document Roles Summary" table (lines 320-336) is replaced by the audience-facet navigation surface — D8 says facets are derived from existing metadata, not hand-maintained.
   - The "Auto-Generated Documentation" appendix is purely about `docs-live/` and trivially regenerable.

5. **Risk of leaving it in place:** the file becomes a third source of truth alongside `docs-live/INDEX.md` and the per-tree INDEX pages, defeating the campaign's premise. Every new wiki tree would add a maintenance step to a doc that's already deprecated.

### What to do during the campaign

- W-DOCS-3 (multi-target output) lands the index emitter — at that point `docs/INDEX.md` is fully shadowed by generated `docs-live/INDEX.md`.
- W-DOCS-7 (cleanup pass) deletes `docs/INDEX.md` alongside the other 14 docs in the corpus.
- If the four reading-order lists are worth preserving, they migrate to a tiny `docs-sources/reading-paths.md` source file consumed by a `ReadingPath` extractor — but this is opt-in editorial, not a separate INDEX.

---

## Source map (audited for this report)

Files read in full (15):

- `/Users/darkomijic/dev-projects/architect/docs/ANNOTATION-GUIDE.md`
- `/Users/darkomijic/dev-projects/architect/docs/ARCHITECTURE.md`
- `/Users/darkomijic/dev-projects/architect/docs/CLI.md`
- `/Users/darkomijic/dev-projects/architect/docs/CONFIGURATION.md`
- `/Users/darkomijic/dev-projects/architect/docs/CROSS-INSTANCE-CONVENTIONS.md`
- `/Users/darkomijic/dev-projects/architect/docs/DOCS-GAP-ANALYSIS.md` (heading-level scan — body is stale meta-content)
- `/Users/darkomijic/dev-projects/architect/docs/GHERKIN-PATTERNS.md`
- `/Users/darkomijic/dev-projects/architect/docs/INDEX.md`
- `/Users/darkomijic/dev-projects/architect/docs/MCP-SETUP.md`
- `/Users/darkomijic/dev-projects/architect/docs/METHODOLOGY.md`
- `/Users/darkomijic/dev-projects/architect/docs/PR-NOTE-TAXONOMY-CAMPAIGN.md`
- `/Users/darkomijic/dev-projects/architect/docs/PROCESS-GUARD.md`
- `/Users/darkomijic/dev-projects/architect/docs/SESSION-GUIDES.md`
- `/Users/darkomijic/dev-projects/architect/docs/TAXONOMY.md`
- `/Users/darkomijic/dev-projects/architect/docs/VALIDATION.md`

Cross-references (heading-level):

- `/Users/darkomijic/dev-projects/architect/.pr-coordination/PROPOSED-DESIGN.md` § 1, 3b, 7, 10, 11
- `/Users/darkomijic/dev-projects/architect/.pr-coordination/DECISIONS.md` D1–D12
- `/Users/darkomijic/dev-projects/architect/.pr-coordination/INVENTORY.md` § 6, § 7
- `/Users/darkomijic/dev-projects/architect/.agents/skills/_shared/*.md` (file inventory)
- `/Users/darkomijic/dev-projects/architect/formal-spec/00-overview.md, 03-tag-system.md, 05-feature-spec-format.md, 07-stub-format.md, 09-delivery-lifecycle.md, 10-pattern-graph.md, 11-project-configuration.md` (heading inventory)
