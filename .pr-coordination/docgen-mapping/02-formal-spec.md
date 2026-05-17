# Formal-Spec Corpus — Information Architecture Map

> Read-only analysis for the doc-generation campaign. Maps `formal-spec/*.md` content to
> source-of-truth in code/specs, classifies drift surfaces, and recommends migration
> targets per `.pr-coordination/PROPOSED-DESIGN.md` §10–11 and `DECISIONS.md` D1–D12.
>
> Kernel decision honored: **no new annotation carriers.** All proposals resolve drift
> via `ContentFragment`s at INPUT-disclosure depths plus fenced generated-insert
> directives — never new tags.

Total corpus: 14 numbered sections + appendix + README + REVIEW-FINDINGS = ~4,300 lines.
The REVIEW-2026-05-17-FINDINGS document already documents per-section drift fixes applied
on the same day this report was written — the drift surface enumeration below uses that
review as a starting baseline (every "fix applied" row is a drift that recurred and
needs a generated insert to stop recurring).

---

## A. Per-section TOC inventory

Each H2 is classified by content shape. Where multiple shapes coexist under one heading
(typical), the dominant shape is listed first and the secondary in parentheses.

### `README.md` (154 lines) — framing only

| H2 / H3                                | Lines    | Shape                                                                |
| -------------------------------------- | -------- | -------------------------------------------------------------------- |
| What This Is / What This Is Not        | 11–34    | NORMATIVE-PROSE                                                      |
| Why Formalize This (metrics table)     | 36–62    | NORMATIVE-PROSE (+ informative metrics table — unverifiable numbers) |
| Conformance Levels                     | 64–73    | SCHEMA-TABLE (mirrors §01 Conformance Summary — INTRA-doc drift)     |
| Reading Guide                          | 75–93    | CROSS-REF (table of section links)                                   |
| Relationship to @libar-dev/architect   | 95–116   | SCHEMA-TABLE (package family — mirrors CLAUDE.md "Package family")   |
| Publication Trajectory                 | 118–124  | NORMATIVE-PROSE                                                      |
| CHANGELOG                              | 126–end  | NORMATIVE-PROSE (editorial — historical)                             |

### `00-overview.md` (192 lines)

| H2 / H3                            | Lines   | Shape                                                                                                            |
| ---------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| What Are Architecture-Connected... | 7–37    | NORMATIVE-PROSE (+ inline Gherkin EXAMPLE)                                                                       |
| Five Core Concepts                 | 39–103  | NORMATIVE-PROSE (5 subsections, each definitional — pattern / graph / evolution / delivery / projection)         |
| Component Map                      | 105–126 | EXAMPLE (ASCII diagram — purely illustrative, hand-authored)                                                     |
| The Architectural Connection       | 128–142 | NORMATIVE-PROSE (+ 5-row SCHEMA-TABLE of connection layers — stable, no code mirror)                             |
| Quick Start: A Minimal Valid Spec  | 144–174 | EXAMPLE (Gherkin)                                                                                                |
| Terminology                        | 176–end | SCHEMA-TABLE (glossary — 12 terms, mostly normative but should mirror `_shared/` doctrine wording where overlap) |

### `01-conformance.md` (121 lines)

| H2                  | Lines    | Shape                                                                  |
| ------------------- | -------- | ---------------------------------------------------------------------- |
| Keyword Conventions | 7–15     | NORMATIVE-PROSE (RFC 2119 boilerplate)                                 |
| Conformance Levels  | 17–75    | NORMATIVE-PROSE (3 level subsections, ordered MUST/SHOULD/MAY lists)   |
| Conformance Summary | 77–93    | SCHEMA-TABLE (Level matrix — mirrors PROCESS-GUARD.md DoD requirements) |
| Versioning          | 95–103   | NORMATIVE-PROSE                                                        |
| Extension Points    | 105–end  | NORMATIVE-PROSE                                                        |

### `02-artifact-types.md` (264 lines)

| H2                                       | Lines    | Shape                                                                                              |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| Overview                                 | 7–22     | NORMATIVE-PROSE (+ 4-row SCHEMA-TABLE of types — mirrors §11 layout table)                         |
| Canonical Directory Layout               | 24–91    | SCHEMA-TABLE (ASCII tree; mirrors §11 Canonical Project Layout — INTRA-doc drift)                  |
| Type 1: Feature Spec                     | 93–138   | SCHEMA-TABLE (required tags — mirrors §03/§04 — drift risk)                                        |
| Type 2: ADR                              | 140–171  | SCHEMA-TABLE (required tags — mirrors §03/§04/§06 — drift risk)                                    |
| Type 3: Design Stub                      | 173–203  | SCHEMA-TABLE (required tags — mirrors §03/§04/§07 — drift risk)                                    |
| Type 4: Release Manifest                 | 205–237  | SCHEMA-TABLE (required tags — mirrors §03/§04 — drift risk)                                        |
| File Naming Rules                        | 239–253  | SCHEMA-TABLE (naming conventions)                                                                  |
| Artifact Type Selection Guide            | 255–end  | NORMATIVE-PROSE (selection table — guidance)                                                       |

### `03-tag-system.md` (252 lines)

| H2                                       | Lines    | Shape                                                                                |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| Overview                                 | 7–17     | NORMATIVE-PROSE                                                                      |
| Tag Prefix                               | 19–32    | NORMATIVE-PROSE                                                                      |
| Gate Tag                                 | 34–59    | NORMATIVE-PROSE (+ Gherkin/TS EXAMPLE)                                               |
| Tag Syntax                               | 61–90    | NORMATIVE-PROSE (Gherkin vs JSDoc — 2 subsections)                                   |
| Format Types                             | 92–110   | SCHEMA-TABLE (mirrors `taxonomy/format-types.ts`)                                    |
| Tag Ordering                             | 112–151  | EXAMPLE (recommended order, hand-curated)                                            |
| Required vs Optional Tags by Artifact Type | 153–223 | SCHEMA-TABLE (6 sub-tables — duplicates §02 Required Tags entries — INTRA-doc drift) |
| Tag Validation Rules                     | 225–235  | NORMATIVE-PROSE (numbered MUST list)                                                 |
| Tag Taxonomy                             | 237–end  | NORMATIVE-PROSE (+ CROSS-REF to §11 + `architect:query taxonomy`)                    |

### `04-tag-registry.md` (397 lines) — **HIGH-DRIFT EPICENTER**

| H2 / H3                                          | Lines    | Shape                                                                                                    |
| ------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| About This Registry                              | 7–22     | NORMATIVE-PROSE                                                                                          |
| Group 1: Core Identity                           | 24–55    | TAG-TABLE (mirrors `taxonomy/registry-builder.ts` + `maturity-values.ts` + `status-values.ts`)           |
| Group 2: Classification                          | 57–104   | TAG-TABLE (mirrors `arch-layer-values.ts` + role values in `registry-builder.ts`)                        |
| Group 3: Planning (NOT canonical)                | 106–135  | TAG-TABLE (informative — "Removed" markers, **kept for migration reference only**)                       |
| Group 4: Relationships                           | 137–175  | TAG-TABLE (mirrors authored vs derived edges in extractor)                                               |
| Group 5: Product & Business (NOT canonical)      | 177–191  | TAG-TABLE (informative — "Removed" markers)                                                              |
| Group 6: ADR                                     | 193–212  | TAG-TABLE (mirrors `adr-category-values.ts` + ADR fields in registry-builder)                            |
| Group 7: Hierarchy                               | 214–241  | TAG-TABLE (mirrors `hierarchy-levels.ts`; parent-carve-out duplicates `_shared/four-tier-ladder.md`)     |
| Group 8: Design Rule Narration                   | 243–250  | NORMATIVE-PROSE                                                                                          |
| Group 9: Stub-Specific                           | 252–265  | TAG-TABLE                                                                                                |
| Group 10: Release (NOT canonical)                | 267–280  | TAG-TABLE (informative)                                                                                  |
| Group 11: Process Enforcement                    | 282–293  | TAG-TABLE                                                                                                |
| Group 12: Discovery (NOT canonical)              | 295–310  | TAG-TABLE (informative)                                                                                  |
| Summary: Tag Count by Group                      | 312–342  | TAG-TABLE (canonical vs removed count — INTRA-doc drift with the per-group tables)                       |
| Status → Maturity Defaults / DEFAULT_MATURITY... | 344–end  | LIFECYCLE-DIAGRAM (mirrors `maturity-values.ts` + `DEFAULT_MATURITY_BY_STATUS` in extractor)             |

### `05-feature-spec-format.md` (372 lines)

| H2                                       | Lines    | Shape                                                                              |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| Overview / Document Structure            | 7–30     | NORMATIVE-PROSE                                                                    |
| 1. Tag Header Block                      | 31–72    | EXAMPLE (3 Gherkin samples at L1/L1-accept/L2)                                     |
| 2. Feature Title                         | 74–92    | NORMATIVE-PROSE (+ EXAMPLES)                                                       |
| 3. Feature Description                   | 94–158   | NORMATIVE-PROSE (Plan-Level vs Design-Level — 2 subsections; mirrors §08 contrast) |
| 4. Background: Deliverables              | 159–202  | SCHEMA-TABLE (5-column format — mirrors `Deliverable` type in §10)                 |
| 5. Section Separators                    | 204–216  | NORMATIVE-PROSE (style guideline)                                                  |
| 6. Rule Blocks                           | 218–282  | NORMATIVE-PROSE (mirrors `_shared/rule-block-template.md` — INTRA-repo drift)      |
| 7. Scenarios                             | 283–356  | NORMATIVE-PROSE (+ scenario-tag table — mirrors `scenario-layer-types.ts`)         |
| Plan-Level vs. Design-Level Comparison   | 358–end  | SCHEMA-TABLE (mirrors §08 maturity-tier comparison — INTRA-doc drift)              |

### `06-adr-format.md` (202 lines)

| H2                                       | Lines    | Shape                                                                                                |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| Overview / ADR vs PDR                    | 7–25     | NORMATIVE-PROSE                                                                                      |
| Document Structure                       | 27–38    | NORMATIVE-PROSE (ASCII outline)                                                                      |
| Tag Header                               | 40–67    | TAG-TABLE (ADR tags — mirrors §04 Group 6)                                                           |
| Feature Description (Context/Decision/Consequences) | 69–127 | NORMATIVE-PROSE (+ EXAMPLEs)                                                                         |
| Background: Deliverables                 | 129–139  | EXAMPLE (mirrors §05)                                                                                |
| Rule Blocks                              | 141–165  | NORMATIVE-PROSE (+ EXAMPLE — mirrors §05 rule block, ADR variant)                                    |
| Supersession                             | 167–185  | NORMATIVE-PROSE (+ EXAMPLE)                                                                          |
| Quality Criteria                         | 187–end  | NORMATIVE-PROSE                                                                                      |

### `07-stub-format.md` (210 lines)

| H2                                       | Lines    | Shape                                                                                       |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| Overview                                 | 7–17     | NORMATIVE-PROSE                                                                             |
| Directory Convention                     | 19–37    | NORMATIVE-PROSE                                                                             |
| JSDoc Annotation Block                   | 39–105   | EXAMPLE (TypeScript) + TAG-TABLE (required stub tags — mirrors §04 Group 9)                 |
| Code Conventions                         | 107–179  | NORMATIVE-PROSE (4 subsections: interfaces / methods / placeholders / unused parameters)    |
| Exported Type Surface                    | 181–186  | NORMATIVE-PROSE                                                                             |
| Stub Lifecycle                           | 188–end  | LIFECYCLE-DIAGRAM (mirrors `_shared/value-transfer.md` — INTRA-repo drift)                  |

### `08-spec-evolution.md` (570 lines) — **largest, multi-tier ladder**

| H2 / H3                                  | Lines    | Shape                                                                                                          |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| Core Principle: Design Artifacts...      | 7–28     | NORMATIVE-PROSE (+ ASCII LIFECYCLE-DIAGRAM)                                                                    |
| Two Lifecycle Tracks                     | 30–64    | NORMATIVE-PROSE (+ ASCII LIFECYCLE-DIAGRAM)                                                                    |
| Five Maturity Levels                     | 66–98    | NORMATIVE-PROSE (+ Brief example block)                                                                        |
| Idea Tier — Lightweight Pre-Candidate    | 100–195  | LIFECYCLE-DIAGRAM (+ TAG-TABLE — 6-tag minimum; mirrors `_shared/four-tier-ladder.md` directly)                |
| Level 1: Candidate Spec                  | 196–264  | NORMATIVE-PROSE (+ SCHEMA-TABLE diff: candidate vs plan-level)                                                 |
| Level 2: Plan-Level Spec                 | 266–297  | SCHEMA-TABLE (characteristics — mirrors §05 Plan-Level vs Design-Level Comparison)                             |
| Level 3: Design-Level Spec               | 298–331  | SCHEMA-TABLE (plan→design diff — mirrors §05)                                                                  |
| Level 4: Executable Spec                 | 332–344  | NORMATIVE-PROSE                                                                                                |
| Value Transfer Process / Survives table  | 345–410  | LIFECYCLE-DIAGRAM (+ TAG-TABLE: surviving vs dropped tags — mirrors `_shared/value-transfer.md` + `annotation-ownership.md`) |
| N:1 Pattern Mapping                      | 388–409  | NORMATIVE-PROSE (+ EXAMPLE)                                                                                    |
| Process and Editorial Specs              | 411–419  | NORMATIVE-PROSE                                                                                                |
| File Locations After Transfer            | 421–436  | EXAMPLE                                                                                                        |
| Value Transfer Summary                   | 438–452  | SCHEMA-TABLE (mirrors `_shared/value-transfer.md`)                                                             |
| Lifecycle Diagram                        | 454–503  | LIFECYCLE-DIAGRAM (ASCII)                                                                                      |
| Comparison: Plan vs. Design vs. Executable | 505–520 | SCHEMA-TABLE (definitive tier-comparison table — INTRA-doc drift with §05 + earlier §08 tables)                |
| Folder Organization                      | 522–556  | EXAMPLE (project structure)                                                                                    |
| Anti-Patterns                            | 558–end  | NORMATIVE-PROSE                                                                                                |

### `09-delivery-lifecycle.md` (216 lines) — **HIGH-DRIFT (FSM)**

| H2                                       | Lines    | Shape                                                                                                             |
| ---------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| Overview                                 | 7–13     | NORMATIVE-PROSE                                                                                                   |
| States (refinement + delivery track tables) | 15–31  | LIFECYCLE-DIAGRAM (mirrors `validation/fsm/states.ts`)                                                            |
| State Transition Diagram                 | 33–48    | LIFECYCLE-DIAGRAM (ASCII — mirrors `validation/fsm/transitions.ts`)                                               |
| Transition Matrix                        | 50–69    | LIFECYCLE-DIAGRAM (mirrors `validation/fsm/transitions.ts` directly + `_shared/fsm-transitions.md`)               |
| Protection Levels                        | 71–98    | LIFECYCLE-DIAGRAM (3 subsections — mirrors `process-guard/derive-state.ts` + `process-guard/decider.ts`)          |
| ProcessGuard Rules (6 numbered)          | 100–164  | NORMATIVE-PROSE (mirrors `architect-guard/src/lint/process-guard/*` and `tests/features/process-guard-rules.feature`) |
| Session Types                            | 166–183  | SCHEMA-TABLE (mirrors session-state-reader.ts)                                                                    |
| Scope-Validate Pre-Flight                | 184–202  | NORMATIVE-PROSE (mirrors CLI/MCP `scope-validate` — see `architect-data-api/SKILL.md`)                            |
| Lifecycle Integration with Spec Evolution | 204–end | SCHEMA-TABLE (mirrors §08 + `_shared/four-tier-ladder.md` — INTRA-repo drift)                                     |

### `10-pattern-graph.md` (258 lines) — **HIGH-DRIFT (data model)**

| H2 / H3                                  | Lines    | Shape                                                                                                                 |
| ---------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| Overview                                 | 7–19     | NORMATIVE-PROSE                                                                                                       |
| Core Structure                           | 21–31    | SCHEMA-TABLE (mirrors `PatternGraph` type)                                                                            |
| ExtractedPattern (8 subsections)         | 33–145   | SCHEMA-TABLE × 8 (identity / source / status / relationships / architecture / rules / deliverables / ADR / hierarchy — mirrors `ExtractedPattern` Zod schema) |
| Pre-Computed Views                       | 147–195  | SCHEMA-TABLE × 6 (status / phase / role / source-type / product-area / statistics — mirrors `PatternGraphAPI` shape)  |
| Optional Indexes                         | 197–220  | SCHEMA-TABLE × 2 (relationship index / architecture index — mirrors PatternGraphAPI optional shape)                   |
| Tag Registry                             | 222–242  | SCHEMA-TABLE (mirrors `TagRegistry` Zod — same data as §04 from a different angle)                                    |
| Build Pipeline                           | 244–end  | NORMATIVE-PROSE (numbered list — mirrors pipeline-session shape; informative)                                         |

### `11-project-configuration.md` (258 lines) — **HIGH-DRIFT (config schema)**

| H2                                       | Lines    | Shape                                                                                                              |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| Overview / Configuration File            | 7–36     | NORMATIVE-PROSE (+ TypeScript EXAMPLE)                                                                             |
| Configuration Schema                     | 38–98    | SCHEMA-TABLE (mirrors `project-config-schema.ts` — top-level + source + output + project metadata)                 |
| Role Sets                                | 100–122  | NORMATIVE-PROSE (mirrors `DEFAULT_ROLES` constant in `config/role-constants.ts`)                                   |
| Tag Taxonomy Customization               | 124–141  | EXAMPLE                                                                                                            |
| Canonical Project Layout                 | 143–209  | SCHEMA-TABLE (ASCII tree — mirrors §02 Canonical Directory Layout — INTRA-doc drift)                               |
| Generator Configuration                  | 211–240  | SCHEMA-TABLE (mirrors `default-generators.ts` + `projectionOptions` schema)                                        |
| Minimal Configuration                    | 242–end  | EXAMPLE                                                                                                            |

### `12-live-documentation-api.md` (225 lines)

| H2                                       | Lines    | Shape                                                                                                  |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| Overview                                 | 7–47     | NORMATIVE-PROSE (+ ASCII diagram)                                                                      |
| Architecture                             | 49–80    | NORMATIVE-PROSE (+ SCHEMA-TABLE of component responsibilities)                                         |
| API Surface (`architect_documentation`)  | 82–105   | SCHEMA-TABLE (mirrors MCP tool schema in `tool-metadata.ts`)                                           |
| RenderableDocument as API Response Format | 107–143  | SCHEMA-TABLE (9 block types — mirrors `RenderableDocumentSchema` Zod + Document Envelope type)         |
| MVP Projection Set                       | 145–160  | SCHEMA-TABLE (mirrors `DOCUMENT_TYPES` const + projection registry)                                    |
| Caching Strategy                         | 162–187  | NORMATIVE-PROSE (cache contract — informative)                                                         |
| Progressive Disclosure                   | 189–209  | NORMATIVE-PROSE (+ numbered workflow)                                                                  |
| Security Considerations                  | 211–219  | NORMATIVE-PROSE                                                                                        |
| Migration Path                           | 220–end  | NORMATIVE-PROSE                                                                                        |

### `appendix-a-examples.md` (561 lines)

| Example | Lines    | Shape | Description                                       |
| ------- | -------- | ----- | ------------------------------------------------- |
| 1       | 7–50     | EXAMPLE | Candidate spec (Refinement — DarkModeTheme)     |
| 2       | 53–88    | EXAMPLE | Minimal Plan-Level (Level 1, UserRegistration)  |
| 3       | 91–249   | EXAMPLE | Full Plan-Level (Level 2, ProjectConnection)    |
| 4       | 251–300  | EXAMPLE | Design-Level Spec excerpt (McpIntegration step) |
| 5       | 302–383  | EXAMPLE | ADR in Gherkin (ADR-005 Electron+React)         |
| 6       | 385–501  | EXAMPLE | TypeScript Design Stub (IPCBridge)              |
| 7       | 503–549  | EXAMPLE | Minimal `architect.config.ts`                   |
| Summary | 551–end  | SCHEMA-TABLE | Example coverage table                      |

---

## B. Drift surface enumeration

Drift surfaces sorted by severity. The first three rows match `INVENTORY.md` §6; the
remaining rows are new findings from this analysis. The "Source-of-truth" column names
the canonical artifact whose serialization must drive the formal-spec text.

| #   | Section(s)                          | Topic                                                              | Code / spec source-of-truth                                                                                              | Severity   |
| --- | ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | §04 (entire) + §03 Required tables  | Tag registry — every group table, every enum value list            | `packages/architect-core/src/taxonomy/registry-builder.ts` + `status-values.ts` + `arch-layer-values.ts` + `maturity-values.ts` + `adr-category-values.ts` + `hierarchy-levels.ts` + `format-types.ts`; cross-checked by `tests/features/api/canonical-values-sync.feature` | **HIGH**   |
| 2   | §09 (entire FSM section)            | FSM states + transition matrix + 6 ProcessGuard rules              | `packages/architect-core/src/validation/fsm/transitions.ts` + `states.ts`; `packages/architect-guard/src/lint/process-guard/*.ts`; executable: `packages/architect-guard/tests/features/process-guard-rules.feature` | **HIGH**   |
| 3   | §11 Configuration Schema            | `architect.config.ts` field tables (top-level + source + output)   | `packages/architect-core/src/config/project-config-schema.ts` (Zod) + `defaults.ts` + `default-generators.ts`            | **HIGH**   |
| 4   | §10 ExtractedPattern (8 subsections) | Pattern data model — every field/type table                       | `packages/architect-core/src/extractor/*` (ExtractedPattern Zod schema) + `PatternGraphAPI` shape                         | **HIGH**   |
| 5   | §10 Tag Registry struct             | `TagRegistry` shape served by data API                             | `packages/architect-core/src/config/tag-registry-contract.ts`                                                             | medium     |
| 6   | §04 DEFAULT_MATURITY_BY_STATUS      | Status→maturity auto-default mapping                               | `packages/architect-core/src/taxonomy/maturity-values.ts` (constant) + extractor's `effective_maturity` resolution        | **HIGH**   |
| 7   | §04 Role Values table               | Canonical 8 roles                                                  | `taxonomy/registry-builder.ts` (DEFAULT_ROLES) + `config/role-constants.ts`                                              | **HIGH**   |
| 8   | §04 Architecture Layer Values       | `application` / `domain` / `infrastructure`                        | `taxonomy/arch-layer-values.ts`                                                                                          | **HIGH**   |
| 9   | §04 Hierarchy Level Values          | `epic` / `phase` / `task` / `slice` + parent carve-out             | `taxonomy/hierarchy-levels.ts` + `_shared/four-tier-ladder.md`                                                            | medium     |
| 10  | §04 ADR status lifecycle            | `proposed` / `accepted` / `deprecated` / `superseded`              | `taxonomy/adr-category-values.ts` + ADR fields in `registry-builder.ts`                                                  | medium     |
| 11  | §05 Deliverables 5-column format    | Deliverables table column types                                    | `packages/architect-core/src/extractor/deliverables.ts` (Zod) + `taxonomy/deliverable-status.ts`                         | medium     |
| 12  | §05 §07 Rule block template         | Invariant / Rationale / Verified by structure                      | `.agents/skills/_shared/rule-block-template.md` (doctrine)                                                               | medium     |
| 13  | §05 Scenario tags table             | `@happy-path` / `@validation` / `@edge-case`                       | `taxonomy/scenario-layer-types.ts` + step-lint rules                                                                     | medium     |
| 14  | §07 Stub lifecycle                  | Stubs deleted at implement-time                                    | `.agents/skills/_shared/value-transfer.md` (doctrine) + `architect-implement-spec` skill                                  | medium     |
| 15  | §08 "What survives the transfer"    | Per-tag survives/drops table                                       | `.agents/skills/_shared/value-transfer.md` + `_shared/annotation-ownership.md`                                           | **HIGH**   |
| 16  | §08 Idea-tier 6-tag minimum         | Tag list + line budget + anti-patterns                             | `.agents/skills/_shared/four-tier-ladder.md` + grader contract `grade_candidate_tier.py`                                 | medium     |
| 17  | §08 Tier comparison table (3 cols)  | Plan vs Design vs Executable diff                                  | `_shared/four-tier-ladder.md` + step-lint validators in `architect-guard/src/validation/`                                | medium     |
| 18  | §09 Session types table             | `planning` / `design` / `implement` contexts                       | `architect-mcp/src/pipeline-session/*` + session-state-reader in process-guard                                           | medium     |
| 19  | §09 Scope-Validate results          | `PASS` / `BLOCKED` / `WARN`                                        | CLI `scope-validate` verb in `architect-cli` + MCP `architect_scope_validate` tool                                       | medium     |
| 20  | §11 Generator list                  | 7 named generators                                                 | `config/default-generators.ts` (`DEFAULT_GENERATORS` const) + projection registry                                        | medium     |
| 21  | §11 Canonical Project Layout (tree) | Directory tree                                                     | Mirrors §02 same tree (INTRA-doc drift); both are hand-authored — code source is the `sources` defaults in `defaults.ts` | low        |
| 22  | §12 9 RenderableDocument block types | `heading` / `paragraph` / `separator` / `table` / `list` / `code` / `mermaid` / `collapsible` / `link-out` | `architect-projection/src/renderers/_shared/dispatch.ts` + `RenderableDocumentSchema` Zod                                | medium     |
| 23  | §12 MVP projection set table        | 4 projections + type keys                                          | `DOCUMENT_TYPES` const + `architect-mcp/src/tool-metadata.ts`                                                            | medium     |
| 24  | §12 `architect_documentation` tool params | `documentType` / `disclosure` / `filter`                       | `architect-mcp/src/tool-metadata.ts` Zod schema                                                                          | medium     |
| 25  | README "Relationship to @libar-dev/architect" | 5-package family + CLI/MCP counts                          | Workspace manifests + `architect-cli/src/cli/pattern-graph-cli.ts --help` + `architect-mcp/src/tool-metadata.ts` (count) | medium     |
| 26  | README "Why Formalize This" metrics | 386 patterns / 929 rules / 33 ADRs etc.                            | NOT VERIFIABLE FROM CODE — historical peak numbers from studio repo, deliberately preserved per O-8                       | low (cosmetic — not a code drift) |
| 27  | §00 Terminology glossary            | 12 terms (Pattern / Pattern graph / Tag / Gate tag / Rule / Invariant / Deliverable / Stub / ADR / Projection / ProcessGuard / Spec evolution / Conformance level) | Partially mirrors `_shared/canonical-references.md` + `architect-data-api/SKILL.md` glossary entries                     | low        |
| 28  | §03 Tag Ordering (recommended)      | Authoring style — recommended tag order                            | No code mirror (style convention) — but spec/skill examples should obey it consistently                                  | low        |
| 29  | §02 Type 1–4 required-tags tables   | 4 per-type required tag tables                                     | Redundant projection of §04 (groups 1–4 + 6 + 9) — INTRA-doc drift; code source is `registry-builder.ts`                  | medium     |
| 30  | §03 "Required vs Optional Tags by Artifact Type" (6 sub-tables) | Per-artifact required tag matrix              | Same as #29 — redundant view of §04 — INTRA-doc drift                                                                    | medium     |
| 31  | §05 §08 Plan-vs-Design comparison tables | Tier characteristics diff                                     | INTRA-repo drift: appears in §05, §08 (twice), `_shared/four-tier-ladder.md`                                             | medium     |
| 32  | §01 Conformance Summary             | Level matrix                                                       | Mirrors §01 normative-prose Level 1/2/3 sections directly (INTRA-doc); also overlaps with `docs/PROCESS-GUARD.md`        | low        |
| 33  | Appendix-A Example 7 + §11 minimal config | `defineConfig` minimal example                                | `packages/architect-core/src/config/define-config.ts` JSDoc + `tests/features/.../define-config.feature`                  | low        |
| 34  | Appendix-A Example 5 ADR rule structure | ADR Gherkin shape                                              | `architect/decisions/*.feature` real ADRs + `tests/features/api/canonical-values-sync.feature`                            | medium     |

> _Cross-cutting observation:_ INTRA-doc drift dominates the medium-severity rows. §02
> repeats §04 (tag tables), §03 re-tabulates §04 (required-tag matrix), §05 mirrors §08
> (tier comparison), §02 and §11 share the same canonical directory tree. These
> internal duplications compound external drift — fix the code-sourced tables (rows 1–10)
> first and they propagate naturally into the duplicated views once those views become
> ContentFragments rather than separate hand-authored tables.

---

## C. Generated-insert opportunities

For every row in §B with severity ≥ medium, classified by fix-type. Extractor naming
follows the PROPOSED-DESIGN §6 convention (`extract<Topic>For<Audience>`); the "Exists?"
column reflects PROPOSED-DESIGN §2 inventory.

| Drift # | Fix type           | Extractor needed                                          | Exists per §2?         | Notes                                                                                          |
| ------- | ------------------ | --------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 1       | GENERATED-INSERT × N (one per Group table) | `extractTagRegistryForFormalSpec(group)`                  | NEW (extends §2 #3 — `extractTaxonomyTable`) | One fenced insert per group in §04. Driver: `pnpm architect:query taxonomy --group=<n>` → fenced table |
| 2       | WIKI-TREE          | `extractFSMTransitionMatrix` + `extractProcessGuardRules`  | NEW                    | §09 becomes `docs-live/formal-spec/09-delivery-lifecycle/` with sub-pages per ProcessGuard rule. Sources: `transitions.ts` for matrix, `process-guard/decider.ts` for rules, `tests/features/process-guard-rules.feature` for invariants |
| 3       | GENERATED-INSERT   | `extractProjectConfigSchemaForDocs()`                     | NEW (Zod-to-Markdown)  | §11 Schema tables driven from `project-config-schema.ts` via `zod-to-md` style traversal. Three inserts: top-level, source, output |
| 4       | CONTENT-FRAGMENT   | `extractExtractedPatternFieldShape()`                     | partial — §2 #5 may cover | §10 ExtractedPattern subsections become one ContentFragment per field group sourced from the Zod schema; replaces 8 tables |
| 5       | CONTENT-FRAGMENT   | (reuse #4 extractor)                                      | partial                | §10 Tag Registry inset — same fragment family                                                  |
| 6       | GENERATED-INSERT   | `extractMaturityStatusDefaults()`                         | NEW                    | §04 DEFAULT_MATURITY_BY_STATUS table; driver `pnpm architect:query taxonomy maturity --defaults` |
| 7       | GENERATED-INSERT   | `extractRoleValues()`                                     | partial — subset of #1 | §04 Role Values 8-row table; same driver as #1                                                 |
| 8       | GENERATED-INSERT   | `extractArchLayerValues()`                                | partial — subset of #1 | §04 Arch Layer 3-row table                                                                     |
| 9       | GENERATED-INSERT   | `extractHierarchyLevels()` + `extractParentCarveOut()`    | partial                | Parent carve-out cross-references `_shared/four-tier-ladder.md`; use ContentFragment for carve-out prose |
| 10      | GENERATED-INSERT   | `extractAdrStatusLifecycle()`                             | partial                | §04 Group 6 ADR table                                                                          |
| 11      | GENERATED-INSERT   | `extractDeliverablesSchema()`                             | NEW                    | §05 Deliverables 5-column schema definition (column types) — from `deliverable-status.ts` + Zod  |
| 12      | CONTENT-FRAGMENT   | none — sourced from `_shared/rule-block-template.md`      | NEW (cross-skill)      | §05 / §07 / Appendix examples should all `preamble.import('rule-block-template')` rather than re-author |
| 13      | GENERATED-INSERT   | `extractScenarioLayerTypes()`                             | NEW                    | §05 scenario-tag 3-row table                                                                   |
| 14      | CONTENT-FRAGMENT   | sourced from `_shared/value-transfer.md`                  | NEW (cross-skill)      | §07 stub lifecycle prose                                                                       |
| 15      | CONTENT-FRAGMENT   | sourced from `_shared/value-transfer.md` + `annotation-ownership.md` | NEW (cross-skill) | §08 "What survives the transfer" table — single source for spec + skill + maintainer docs       |
| 16      | CONTENT-FRAGMENT   | sourced from `_shared/four-tier-ladder.md`                | NEW (cross-skill)      | §08 Idea-tier 6-tag minimum + anti-patterns                                                    |
| 17      | CONTENT-FRAGMENT   | sourced from `_shared/four-tier-ladder.md`                | NEW (cross-skill)      | §05/§08 tier comparison (one canonical 3-column table, multiple fragment consumers)            |
| 18      | GENERATED-INSERT   | `extractSessionTypes()`                                   | NEW                    | §09 session-types table — from MCP pipeline-session metadata                                   |
| 19      | GENERATED-INSERT   | `extractScopeValidateOutcomes()`                          | NEW                    | §09 Scope-Validate PASS/BLOCKED/WARN — from CLI verb schema                                    |
| 20      | GENERATED-INSERT   | `extractGeneratorList()`                                  | partial (§2 #7?)       | §11 generators 7-entry list — from `default-generators.ts`                                     |
| 21      | CONTENT-FRAGMENT   | one canonical directory-tree fragment                     | NEW                    | §02 and §11 both import the same `canonical-project-layout` fragment                           |
| 22      | GENERATED-INSERT   | `extractBlockTypeRegistry()`                              | NEW                    | §12 9-block-type table — from `RenderableDocumentSchema` Zod                                   |
| 23      | GENERATED-INSERT   | `extractDocumentTypes()`                                  | partial                | §12 MVP projection table — from `DOCUMENT_TYPES` const                                         |
| 24      | GENERATED-INSERT   | `extractMcpToolSchema('architect_documentation')`         | partial — generic MCP tool extractor probably exists | §12 tool-params table                                                                          |
| 25      | GENERATED-INSERT   | `extractPackageFamily()` + `extractCliMcpVerbCounts()`    | NEW                    | README "Relationship" table; verb counts from `--help` parse                                   |
| 27      | CONTENT-FRAGMENT   | `formal-spec-glossary` fragment                           | NEW (cross-skill)      | §00 Terminology — shared with `_shared/canonical-references.md` and `architect-data-api/SKILL.md` |
| 29      | GENERATED-INSERT   | `extractRequiredTagsByArtifactType(type)`                 | derived from #1        | §02 4 per-type tables — each is a filter over the §04 registry insert                          |
| 30      | GENERATED-INSERT   | `extractRequiredTagsByConformanceLevel(level, artifactType)` | derived from #1     | §03 6 sub-tables — another filter projection                                                   |
| 31      | CONTENT-FRAGMENT   | (same as #17)                                             | NEW                    | §05 + §08 tier-comparison: collapse to single fragment imported in both locations              |
| 34      | (no fix needed)    | —                                                         | —                      | Appendix examples already validated by `tests/features/api/canonical-values-sync.feature` for ADRs — kept as hand-authored illustration |

**Summary by fix-type:**

- **GENERATED-INSERT:** 17 (drifts 1, 3, 6, 7, 8, 9, 10, 11, 13, 18, 19, 20, 22, 23, 24, 25, 29, 30)
- **CONTENT-FRAGMENT:** 8 (drifts 4, 5, 12, 14, 15, 16, 17, 21, 27, 31)
- **WIKI-TREE:** 1 (drift 2 — §09 only)
- **No fix:** 26 (cosmetic metrics), 34 (already covered)

---

## D. The normative-vs-derivable boundary

For each section, the percentage estimates how much survives in a hand-authored
`docs-sources/formal-spec/<n>-intro.md` preamble after migration. Numbers are
qualitative — generated/derivable is what ContentFragments + generated-inserts can take
over; normative editorial is the MUST/SHOULD/MAY prose, rationale, and original
explanations that must remain hand-authored.

| Section                                       | Normative editorial (preamble survives) | Derivable from code/spec data | Notes                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| README.md                                     | ~75%                                    | ~25%                          | Metrics table (#26) and Reading Guide are derivable. Most prose framing is editorial.                                 |
| 00-overview.md                                | ~85%                                    | ~15%                          | "Five Core Concepts" and "Component Map" are conceptual prose. Terminology table can be a ContentFragment.            |
| 01-conformance.md                             | ~80%                                    | ~20%                          | MUST/SHOULD/MAY lists are editorial. Conformance Summary matrix should be derived from the prose lists (auto-mirror). |
| 02-artifact-types.md                          | ~40%                                    | ~60%                          | Required-tag tables (60% of lines) are pure derivable projection of §04. Selection guide stays editorial.             |
| 03-tag-system.md                              | ~55%                                    | ~45%                          | Tag mechanics prose is normative; Required-vs-Optional tables (lines 153–223) are derivable from §04.                 |
| **04-tag-registry.md**                        | **~15%**                                | **~85%**                      | Every group table is a code mirror. Only the section intros + "informative" callouts survive as editorial.            |
| 05-feature-spec-format.md                     | ~50%                                    | ~50%                          | Deliverables table format, scenario tags, rule-block structure all derivable. Style guidance is editorial.            |
| 06-adr-format.md                              | ~70%                                    | ~30%                          | ADR-specific tag table + status lifecycle derivable; Context/Decision/Consequences structure is editorial.            |
| 07-stub-format.md                             | ~55%                                    | ~45%                          | Required tag table + lifecycle ASCII derivable; code conventions are editorial.                                       |
| 08-spec-evolution.md                          | ~45%                                    | ~55%                          | Tier comparison tables + "what survives transfer" table + idea-tier 6-tag minimum derivable; tracks prose editorial.  |
| **09-delivery-lifecycle.md**                  | **~25%**                                | **~75%**                      | FSM states, transition matrix, protection levels, ProcessGuard rules all from code. Only overview prose editorial.    |
| **10-pattern-graph.md**                       | **~10%**                                | **~90%**                      | Almost entirely a Zod-schema mirror. Build-pipeline numbered list survives.                                           |
| **11-project-configuration.md**               | **~30%**                                | **~70%**                      | Schema tables + canonical-layout tree + generator list derivable. Tag-taxonomy customisation prose stays.             |
| 12-live-documentation-api.md                  | ~55%                                    | ~45%                          | Block-type registry + projection table + tool params derivable. Cache lifecycle / progressive disclosure editorial.   |
| appendix-a-examples.md                        | ~30% (commentary)                       | ~70% (Gherkin/TS bodies)      | If paired with executable features (see §E), bodies become extractor outputs; commentary survives.                    |

**Three highest-leverage migration targets** (sections where ≥70% is derivable):
**§04 (85%)**, **§10 (90%)**, **§09 (75%)**, with **§11 (70%)** close behind.
These are also the three named in `INVENTORY.md` §6, confirming the prior analysis.

---

## E. Examples appendix analysis

`appendix-a-examples.md` has 7 examples (561 lines). Pairing status with executable
Gherkin in `tests/features/`:

| Ex. | Example artifact                                  | Real executable feature? | Status                                                                                                                                                                                                                       |
| --- | ------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `DarkModeTheme` candidate spec                    | **No**                   | Studio-era fictional pattern. No real candidate spec by this name in the architect repo. Pure illustration.                                                                                                                  |
| 2   | `UserRegistration` minimal L1 spec                | **No**                   | Generic example; no `UserRegistration` pattern in this repo.                                                                                                                                                                 |
| 3   | `ProjectConnection` full L2 spec                  | **No**                   | Studio desktop-app pattern; not in the architect repo. Fictional deliverable paths (`apps/desktop/src/...`).                                                                                                                 |
| 4   | `McpIntegration` design-level rule excerpt        | **Partial**              | `tests/features/api/architect-mcp-integration.feature` is the real executable analogue. The excerpt is hand-authored and could be replaced by an `extractDesignLevelRuleExample()` over the executable feature.              |
| 5   | `ADR-005 Electron+React` ADR                      | **No**                   | Fictional ADR (studio repo). Real architect ADRs live in `architect/decisions/adr-001..adr-009`. Replacing with a real ADR snippet would also exercise drift-detection paths.                                                |
| 6   | `IPCBridge` TypeScript stub                       | **No**                   | Studio-era. No `IPCBridge` stub in the architect repo. Pure illustration.                                                                                                                                                    |
| 7   | Minimal `architect.config.ts`                     | **Yes (effectively)**    | `packages/architect-core/tests/features/config/define-config.feature` exercises real `defineConfig` calls. Example is consistent with code (verified by REVIEW-FINDINGS #2 import-path fix).                                 |

**Diagnosis:** Six of seven examples are studio-era leftovers (REVIEW-FINDINGS O-2 flags
this explicitly). They are **not** auto-extractable from `tests/features/` because the
patterns they describe (`UserRegistration`, `ProjectConnection`, `DarkModeTheme`,
`IPCBridge`, `ADR005ElectronReactStack`) **do not exist** in this repo.

**Implication for the doc-gen campaign:** Appendix A is **NOT** a candidate for
`extractBehaviors`-style auto-extraction in its current form. Two options:

1. **Keep hand-authored, mark as "Illustrative — Studio-era reference".** Low risk, no
   automation. Drift risk is bounded because the examples are explicitly fictional.
2. **Rewrite around real repo patterns and extract via `extractCanonicalExamples()`.**
   Higher value (examples track the real codebase), but requires editorial decision
   (REVIEW-FINDINGS O-2 explicitly defers this as out of scope).

Recommended: **option 1 short-term, option 2 as a separate W-DOCS wave.** Example 4
(McpIntegration design-level rule) is the lowest-hanging fruit for partial automation
because a real executable feature exists.

---

## F. Recommendations

### F.1 Migration table (per-section wave assignment)

Wave naming follows `.pr-coordination/PROPOSED-DESIGN.md` §10–11. Wiki-tree targets
follow D5; fragment sources follow D1–D4.

| Section | W-DOCS wave            | Wiki-tree path                                | Fragment sources                                              | Generated inserts                                                                                          |
| ------- | ---------------------- | --------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| README.md | W-DOCS-3 (framing)   | `docs-live/formal-spec/` (index)              | (none — editorial)                                            | `extractPackageFamily()`, `extractCliMcpVerbCounts()` (drift #25)                                          |
| 00      | W-DOCS-3               | `docs-live/formal-spec/00-overview/`          | `formal-spec-glossary` (terminology, #27)                     | (none — purely editorial)                                                                                  |
| 01      | W-DOCS-3               | `docs-live/formal-spec/01-conformance/`       | `conformance-levels` (mirrors README L1/L2/L3 split, #32)     | `extractConformanceSummary()` (derived from prose, #32)                                                    |
| 02      | W-DOCS-2 (tag-driven)  | `docs-live/formal-spec/02-artifact-types/`    | `canonical-project-layout` (#21)                              | `extractRequiredTagsByArtifactType('feature')` × 4 types (#29)                                             |
| 03      | W-DOCS-2               | `docs-live/formal-spec/03-tag-system/`        | (none)                                                        | `extractRequiredTagsByConformanceLevel(level, type)` × 6 tables (#30); `extractFormatTypes()` (subset of #1) |
| **04**  | **W-DOCS-1 (HIGHEST PRIORITY — drift surface #1)** | `docs-live/formal-spec/04-tag-registry/<group>/` (one page per group) | `default-maturity-by-status` (#16)                            | One `extractTagRegistryForFormalSpec(group)` per Group 1–12 (#1, #6, #7, #8, #9, #10)                      |
| 05      | W-DOCS-2               | `docs-live/formal-spec/05-feature-spec-format/` | `rule-block-template` (#12), `tier-comparison` (#17, #31)     | `extractDeliverablesSchema()` (#11), `extractScenarioLayerTypes()` (#13)                                   |
| 06      | W-DOCS-2               | `docs-live/formal-spec/06-adr-format/`        | (reuse `rule-block-template`)                                 | `extractAdrStatusLifecycle()` (#10)                                                                        |
| 07      | W-DOCS-2               | `docs-live/formal-spec/07-stub-format/`       | `stub-lifecycle` (#14, sourced from `_shared/value-transfer.md`), `rule-block-template` (#12)  | (none — required-tag table is a §04 projection)                                                            |
| 08      | W-DOCS-1 / W-DOCS-2 (split) | `docs-live/formal-spec/08-spec-evolution/<tier>/` | `four-tier-ladder` (#16, #17), `value-transfer` (#15), `tier-comparison` (#17, #31) | (mostly fragment-driven)                                                                                   |
| **09**  | **W-DOCS-1 (HIGHEST — drift surface #2)** | `docs-live/formal-spec/09-delivery-lifecycle/<rule-N>/` (one page per ProcessGuard rule + matrix + states) | `fsm-transitions` (#2, sourced from `_shared/fsm-transitions.md`)        | `extractFSMTransitionMatrix()`, `extractProcessGuardRules()`, `extractSessionTypes()`, `extractScopeValidateOutcomes()` (#2, #18, #19) |
| **10**  | **W-DOCS-1 (HIGHEST — drift surface #4)** | `docs-live/formal-spec/10-pattern-graph/` | `extracted-pattern-shape` (#4, #5)                            | `extractExtractedPatternFieldShape(group)` × 8 + `extractTagRegistryShape()` (#4, #5)                      |
| **11**  | **W-DOCS-1 (HIGHEST — drift surface #3)** | `docs-live/formal-spec/11-project-configuration/` | `canonical-project-layout` (#21)                              | `extractProjectConfigSchemaForDocs()` × 3 (top-level / source / output) (#3); `extractGeneratorList()` (#20) |
| 12      | W-DOCS-3               | `docs-live/formal-spec/12-live-documentation-api/` | (none)                                                        | `extractBlockTypeRegistry()`, `extractDocumentTypes()`, `extractMcpToolSchema('architect_documentation')` (#22–#24) |
| App. A  | W-DOCS-DEFERRED        | `docs-live/formal-spec/appendix-a-examples/`  | (none — keep hand-authored)                                   | (defer per §E option 1)                                                                                    |

### F.2 Prioritized list of generated-insert directives — ship order

Ordered by **leverage / risk ratio**: high-drift impact, low risk to ship, and a clear
single source of truth.

| Rank | Directive                                                       | Drift # | Source                                                  | Why ship first                                                                                                                          |
| ---- | --------------------------------------------------------------- | ------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `extractTagRegistryForFormalSpec(group)` — §04 Group 1 + 2 + 4 + 6 + 7 + 11 (the canonical groups) | 1, 7–10 | `taxonomy/registry-builder.ts` + `*-values.ts`         | The single largest drift surface; CI gate already exists (`canonical-values-sync.feature`) so generated inserts inherit drift-detection |
| 2    | `extractFSMTransitionMatrix()` — §09 transition matrix          | 2       | `validation/fsm/transitions.ts`                         | Single 5×5 table, single source, executable feature already enforces it. Trivial extractor.                                             |
| 3    | `extractProcessGuardRules()` — §09 six numbered rules           | 2       | `architect-guard/src/lint/process-guard/decider.ts`     | REVIEW-FINDINGS O-6 explicitly identifies this drift. Each rule becomes a `disclosure: rule-N` page in the wiki-tree.                   |
| 4    | `extractProjectConfigSchemaForDocs()` — §11 schema tables        | 3       | `config/project-config-schema.ts` (Zod)                 | Zod schema is the canonical source; mature `zod-to-json-schema` style traversal already exists in the projection pipeline.              |
| 5    | `extractMaturityStatusDefaults()` — §04 DEFAULT_MATURITY_BY_STATUS | 6     | `taxonomy/maturity-values.ts`                           | 5-row table. Currently authored as REVIEW-FINDINGS Group 1B-H2 mitigation; auto-extraction closes the contract.                         |
| 6    | `extractExtractedPatternFieldShape()` — §10 (one driver, 8 calls) | 4, 5  | `extractor/*` + `PatternGraphAPI` Zod                   | §10 is 90% derivable; this is the highest yield-per-extractor of any item.                                                              |
| 7    | `extractBlockTypeRegistry()` — §12 9-block-type table           | 22      | `RenderableDocumentSchema` Zod                          | Small, contained, already validated by perf-gate fixtures.                                                                              |
| 8    | `extractDocumentTypes()` + `extractMcpToolSchema('architect_documentation')` — §12 projection set + tool params | 23, 24 | `architect-mcp/src/tool-metadata.ts` | Drift here directly affects MCP consumers; high downstream value.                                                                       |
| 9    | `extractDeliverablesSchema()` — §05 5-column                    | 11      | `extractor/deliverables.ts` + `taxonomy/deliverable-status.ts` | Stable shape; isolated table; cheap.                                                                                                    |
| 10   | `extractScenarioLayerTypes()` — §05 scenario-tags               | 13      | `taxonomy/scenario-layer-types.ts`                      | 3-row table. Trivial.                                                                                                                   |

### F.3 ContentFragments unique to formal-spec scope

Fragments that the formal-spec corpus needs *and* that other documentation (skills,
`docs/`, `docs-sources/`) consumes — therefore must live in a shared fragment registry,
not duplicated. INPUT disclosure-depth means each fragment carries its source pointer
so downstream consumers can re-render at the appropriate depth.

| Fragment id                     | Source-of-truth                                                                | Used by (formal-spec)             | Used by (other)                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `rule-block-template`           | `.agents/skills/_shared/rule-block-template.md`                                | §05, §06, §07, Appendix Ex 3 / 4 / 5 | `architect-plan-session`, `architect-design-session`, `architect-implement-spec`, `docs/`     |
| `value-transfer`                | `.agents/skills/_shared/value-transfer.md`                                     | §07 lifecycle, §08 "what survives" | `architect-implement-spec`, `architect-refactor-session`, `architect-review-implementation`   |
| `annotation-ownership`          | `.agents/skills/_shared/annotation-ownership.md`                               | §07 (production vs stub), §08      | `architect-implement-spec`, `architect-refactor-session`, `docs/`                              |
| `four-tier-ladder`              | `.agents/skills/_shared/four-tier-ladder.md`                                   | §08 idea-tier + tier comparison    | All architect-* session skills, `docs/`                                                       |
| `tier-comparison`               | Derived from `four-tier-ladder` + plan/design/executable diffs                 | §05, §08 (twice)                   | `architect-review-spec`, `architect-design-session`                                            |
| `fsm-transitions`               | `.agents/skills/_shared/fsm-transitions.md` (which itself wraps `transitions.ts`) | §09 transitions + protection levels | `architect-implement-spec`, `architect-review-spec`, `docs/PROCESS-GUARD.md`                  |
| `canonical-project-layout`      | Hand-authored tree (no code mirror — `defaults.ts` sources are too narrow)     | §02, §11                           | `docs/CONFIGURATION.md`, all session-skill onboarding                                          |
| `canonical-references`          | `.agents/skills/_shared/canonical-references.md`                               | §00 terminology subset              | `architect-data-api/SKILL.md` glossary, `architect-session-router`                            |
| `formal-spec-glossary`          | NEW fragment, derived from §00 Terminology table                               | §00                                | `_shared/canonical-references.md` (reverse import), any consumer of formal-spec doc           |
| `spec-pattern-relationships`    | `.agents/skills/_shared/spec-pattern-relationships.md`                         | §08 (N:1 mapping prose)             | `architect-implement-spec`, `architect-review-implementation`                                  |
| `stub-lifecycle`                | `_shared/value-transfer.md` + §07 prose                                        | §07                                | `architect-design-session`, `architect-implement-spec`                                         |
| `process-guard-rule-N` (×6)     | `architect-guard/src/lint/process-guard/decider.ts` per-rule docblocks         | §09 (one per rule)                  | `docs/PROCESS-GUARD.md`, ProcessGuard error messages                                          |

**Fragments NOT needed (formal-spec only — keep inline):**

- ASCII component-map diagram in §00 (purely illustrative, not reused anywhere else).
- Quick-start Gherkin example in §00 (already an EXAMPLE shape; appendix examples duplicate purpose).
- CHANGELOG entries (editorial — historical record only).

---

## Appendix: Cross-reference of REVIEW-2026-05-17-FINDINGS "fixes" to drift surfaces

The 2026-05-17 review applied 9 categories of fixes. Each is a drift that recurred,
which means a generated insert here would have prevented the manual fix. Mapping for
campaign-planning context:

| Review fix #            | What was fixed                                  | Drift # in §B | Generated-insert prevents recurrence?               |
| ----------------------- | ----------------------------------------------- | ------------- | --------------------------------------------------- |
| 1 Version normalization | Header versions + package.json                  | (none)        | Editorial — out of doc-gen scope                    |
| 2 Broken import paths   | `@libar-dev/architect/config` → `architect-core` | 33           | Yes — Example 7 driven from real `define-config` feature |
| 3 Reference-impl description | README package family                       | 25           | Yes — `extractPackageFamily()`                      |
| 4 FSM/state wording     | 4 → 5 states                                    | 2, 6          | Yes — `extractFSMTransitionMatrix()` + `extractMaturityStatusDefaults()` |
| 5 Tag drift (depends-on → uses) | §00, §03, §04, examples                  | 1, 4          | Yes — `extractTagRegistryForFormalSpec()` + `extractExtractedPatternFieldShape()` |
| 6 Pattern Graph fields  | §10 removed phantom fields                      | 4             | Yes — same as above                                 |
| 7 Live Documentation API | §12 3 fictional tools → 1 real tool            | 22, 23, 24    | Yes — `extractMcpToolSchema()` + `extractDocumentTypes()` |
| 8 Soft / unsourced claims | §00 "148:1 compression" removed                | 26            | No — editorial choice                               |
| 9 Dead path references  | `architect/tag-taxonomy.md` reframed            | (none)        | Editorial                                           |

**Take-away for the campaign:** 6 of the 9 review categories (Cat 2, 3, 4, 5, 6, 7) are
preventable by the top-10 generated-insert directives in §F.2. The review-2026-05-17
artifact itself could be retired once those inserts ship — its remaining open items
(O-1 to O-10) are then either subsumed by automation or genuinely editorial.

---

## End of report

Lines: ~470. Read-only analysis; no source files modified.
