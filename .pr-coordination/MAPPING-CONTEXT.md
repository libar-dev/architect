# Documentation projection — mapping working context

> **Captured:** 2026-05-17. **Audience:** a fresh session (or N parallel sessions, one per input doc) that walks hand-authored markdown end-to-end and maps each distinct content piece onto its source aggregate.
> **Pairs with:** [`PROBLEM-DEFINITION.md`](./PROBLEM-DEFINITION.md) — what we're solving and why. Read it first if this is your first session on the campaign.

---

## 1. Goal

Take **four hand-authored markdown documents of varying shape**, walk each end-to-end, and produce a **per-doc matrix** mapping every distinct content piece onto:

- **Source aggregate candidate** — where the content COULD live as canonical source: annotated TS JSDoc, executable Gherkin rule/scenario, Zod schema, decision feature, file metadata, tag registry, or the editorial-framing carve-out.
- **Extractor status** — does the substrate already produce this content type, or is a new extractor needed.
- **Selector option** — which of the nine selector options from `MATRIX-FRAMEWORK.md` § 3 fits this piece.

The aggregate output drives the W-DOCS-2 extractor catalog decision and the W-DOCS-1 substrate spec.

This is **research**, not implementation. No substrate code lands here. No `architect-projection/src/` edits. No new annotation carriers (`DECISIONS.md` D3'').

## 2. Inputs — the four docs (read these end-to-end, no skim)

| #   | File                                         | Lines (approx) | Why this doc                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `docs/ARCHITECTURE.md`                       | 1,627          | Long; varied content types — principle tables, pipeline diagrams, config schema rows, shape catalogues, file-reference tables. Highest content-type diversity per line.                                                                                              |
| 2   | `docs/METHODOLOGY.md`                        | ~250           | Doctrine-heavy; table-heavy; mostly the same patterns as other docs (maintainer's own observation). Good test for "is the table problem reducible across docs".                                                                                                      |
| 3   | `formal-spec/04-tag-registry.md`             | ~700           | Data-rich enumeration (12 tag groups × per-tag rows). The purest "this is derivable from the registry" test case.                                                                                                                                                    |
| 4   | `.agents/skills/_shared/four-tier-ladder.md` | ~130           | Kernel doctrine; small; tier-by-tier promotion rules; tables. Tests whether `_shared/` content has natural source aggregates or genuinely belongs as the canonical site (per `docgen-mapping/00-synthesis.md` § 3 — `_shared/` owns 5 of 11 cross-corpus fragments). |

These four span: long-form architecture, doctrine, formal-spec, kernel. If the same 8-12 content types cover all four, the substrate's job stays bounded.

**Parallelism:** one agent per doc is the natural unit of work. Fork four; aggregate at the end. Each per-doc mapping is independent.

## 3. Output format

### Per-doc mapping file

Path: `.pr-coordination/proto-output/mapping/<doc-slug>.md`

```markdown
# Mapping: <doc/path.md>

> **Mapped:** YYYY-MM-DD. **Lines:** N. **Distinct content pieces:** K.

## Content pieces

### CP-001 — <short description> (lines X-Y)

- **Anchor / quote:** `<short verbatim quote or section heading>`
- **Type:** `principle-table | pipeline-table | field-table | xref-table | shape-snippet | gherkin-snippet | json-snippet | section-prose | editorial-framing | mermaid | bullet-list | file-reference-list | cli-invocation | tag-enum | other:<name>`
- **Source candidate(s):**
  - Primary: `<where this content already lives or could live in source>`
  - Alternatives: `<other plausible source locations, if any>`
- **Extractor status:** `exists | partial | missing`
  - If `exists`: name it (`extractShapes`, `extractBehaviors`, `extractDecisions`, `parseMarkdownToBlocks`, `projectTaxonomyDigest`, etc.)
  - If `partial`: state what works and what's missing
  - If `missing`: name the extractor that would be needed
- **Selector option:** `1 | 2 | 3 | 5 | 6 | 7 | 8 | 9 | combo:<list>` (per `MATRIX-FRAMEWORK.md` § 3)
- **Doc category** (per `MATRIX-FRAMEWORK.md` § 2.3): `reference-spec | architecture-document | feature-spec | decision-log | rule-catalog | roadmap-view | n/a`
- **Notes:** brief; capture anything load-bearing for substrate design

### CP-002 — ...
```

End the file with:

```markdown
## Aggregate observations for this doc

- **Novel content types** (not in the taxonomy above): list them
- **Editorial-framing candidates** (no source aggregate fits): list CP-IDs
- **Doc category fit:** which of the six categories from `MATRIX-FRAMEWORK.md` § 2.3 this doc as a whole belongs to (one primary, optional secondary)
- **Pivot:** if this doc is one materialization of a parameterized recipe, name the pivot (e.g., `productArea`)
- **Recommended composition recipe:** one-paragraph sketch of how this doc would be authored as a `DocDefinition`
```

### Aggregate summary file

Path: `.pr-coordination/proto-output/mapping/SUMMARY.md`

```markdown
# Mapping aggregate summary

## Content types observed across all four docs

| Type            | Count | Existing extractor         | Sites needing new extractor work |
| --------------- | ----- | -------------------------- | -------------------------------- |
| principle-table | N     | partial (extractDecisions) | <list>                           |
| ...             |       |                            |                                  |

## Extractor verdicts

### Already covered (ship as-is)

- ...

### Needs work (W-DOCS-2 priority)

- ...

### No source aggregate today (carve-out candidates)

- ...

## Doc-category coverage

For each of the six categories in `MATRIX-FRAMEWORK.md` § 2.3, which input docs map to it.

## Selector option distribution

How often each of options 1, 2, 3, 5-9 fits. Validates whether option 4 (membership tag) is genuinely needed for any case the others can't cover.

## Editorial-framing carve-out — concrete shape

List every CP across all docs that has no clear source aggregate. Group by editorial intent (positioning, narrative ordering, "why this exists", cross-doc rationale).

## Recommendations for substrate design

- W-DOCS-2 extractor catalog priority order (which extractors unlock most sites)
- Editorial-framing carve-out shape: where should it live? (proposal per FINDINGS Gap A mix of A1 + A3)
- Whether any spec at `architect/specs/documentation-projection/` needs refinement based on what the mapping found
```

## 4. Content-piece taxonomy (the type column)

Walk each doc looking for these distinct content shapes. Each shape has a typical source candidate; the mapping confirms or refines.

| Type                  | Typical shape                                                                               | Typical source candidate(s)                                                           |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `principle-table`     | Named principles with one-line descriptions (e.g., ARCHITECTURE.md "Key Design Principles") | Per-ADR Feature title + first-line description; or hand-curated kernel doc            |
| `pipeline-table`      | Stage × input × effect rows (e.g., scanner/extractor/transformer)                           | Zod schema fields + per-stage JSDoc on the canonical module                           |
| `field-table`         | Field × type × description (e.g., config schema documentation)                              | Zod schema introspection (`extractZodSchemaFields` — currently missing)               |
| `xref-table`          | Tag × purpose, file × purpose, command × purpose, related-doc table                         | Tag registry; file metadata; command registry; declared cross-references              |
| `shape-snippet`       | TypeScript interface / type / enum block                                                    | `extractShapes()` — already exists; preserves JSDoc                                   |
| `gherkin-snippet`     | `Feature:` / `Rule:` / `Scenario:` example block                                            | `extractBehaviors()` — already exists; or sample from real feature file               |
| `json-snippet`        | Example JSON output block                                                                   | Zod schema → JSON schema; or live CLI/MCP output capture                              |
| `mermaid`             | Graph TD/LR, sequenceDiagram, classDiagram, stateDiagram, C4Context                         | `extractGraphDiagram` (partial); other diagram types missing                          |
| `section-prose`       | Multi-paragraph explanatory prose at a section head                                         | JSDoc on a canonical module via `parseMarkdownToBlocks` — already exists              |
| `editorial-framing`   | Positioning ("this doc is for…"), narrative intros, "why this exists"                       | No source aggregate today — carve-out candidate                                       |
| `bullet-list`         | Bulleted enumeration of features, capabilities, dos/don'ts                                  | Tag enumeration; pattern-name list; or hand-authored                                  |
| `file-reference-list` | "Key files" tables, "See `path/to/file.ts`" inline links                                    | File metadata on the symbol; package metadata                                         |
| `cli-invocation`      | `pnpm architect:query …` blocks with explanations                                           | CLI command registry (`COMMANDS` Zod object in `architect-cli`) — D8 prototype source |
| `tag-enum`            | Per-tag-group tables, per-status enum tables                                                | `projectTaxonomyDigest` — already exists                                              |
| `other:<name>`        | Anything that doesn't fit                                                                   | Note it; this becomes a novel-type observation                                        |

Add to the taxonomy only when something genuinely new shows up; mark it `other:<name>` and capture in the aggregate summary's "Content types observed" table.

## 5. Existing extractor inventory (the "exists" column)

Reference this when deciding extractor status. Source: `DEEP-DIVE.md` Q1 + FINDINGS § 2 + `PROJECTION-MAPPING.md` § 4.

| Extractor                                                 | Status              | Coverage                                                                                                                                                 |
| --------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extractShapes()` + `discoverTaggedShapes()`              | ships               | TS interfaces / types / enums / consts; preserves JSDoc as raw source text                                                                               |
| `extractBehaviors()` (via `projectBusinessRuleSet`)       | ships               | Gherkin `Rule:` blocks with rationale + verified-by                                                                                                      |
| `extractDecisions()` (via `projectDecisionCatalog`)       | ships               | Decision feature files; per-ADR Context/Decision/Consequences                                                                                            |
| `parseMarkdownToBlocks()`                                 | ships               | JSDoc / markdown prose → SectionBlock[] (6 of 9 block types)                                                                                             |
| `projectTaxonomyDigest`                                   | ships               | Tag registry with group/value tables                                                                                                                     |
| `projectDependencyEdges` / `projectDependencyTree`        | ships               | `uses`/`implements`/`extends`/`see-also` graphs                                                                                                          |
| `extractGraphDiagram`                                     | partial             | `graph TD` only today; `graph LR`, sequenceDiagram, classDiagram, stateDiagram-v2, C4Context not present                                                 |
| `extractZodSchemaFields`                                  | **missing**         | Would parse `z.strictObject({...}).describe(...)` into rows                                                                                              |
| `extractFunctionSignature` (structured)                   | **missing**         | Today returns raw source text; structured `{name, params, returns, examples}` not available                                                              |
| `extractCliCommands`                                      | **missing**         | D8 prototype hand-rolled this; the real extractor reads `COMMANDS` in `architect-cli/src/cli/cli-schema.ts`                                              |
| `extractMcpTools`                                         | **missing**         | Reads `ARCHITECT_MCP_TOOLS` in `architect-mcp/src/tool-metadata.ts`                                                                                      |
| `extractLintRules`                                        | **missing**         | Would need new `@architect-lint-rule:<id>` JSDoc carrier (contradicts D3''; needs explicit decision)                                                     |
| `extractFSMTransitionMatrix` / `extractProcessGuardRules` | **missing**         | Sources: `validation/fsm/transitions.ts`, `architect-guard/src/lint/process-guard/decider.ts`                                                            |
| `extractAggregations(tag)`                                | partial in registry | Aggregation tags with `targetDoc:` exist in registry (`decision`, `overview`, `intro`); projection-layer consumer for the push model is the unused piece |

## 6. Selector palette (the "selector option" column)

Brief reference; full table in `MATRIX-FRAMEWORK.md` § 3.

| #   | Option                                                                                           | Use when                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tag predicate (`@architect-role:codec`, `@architect-bounded-context:X`)                          | Content is defined by semantic identity already on the source                                                                                        |
| 2   | `@architect-pattern` enumeration (whole graph or filtered)                                       | Content is exhaustive over a level (per-package, per-bounded-context)                                                                                |
| 3   | Aggregation tag with `targetDoc:` (push model)                                                   | Source declares the destination — `@architect-decision`, `@architect-overview`, `@architect-intro` (already in registry, unused at projection layer) |
| 4   | `@architect-doc-inclusion:<enum>` membership tag (NEW carrier)                                   | **Forbidden by D3''** unless the mapping finds a content case the other options provably cannot cover. Flag any such case in the aggregate summary.  |
| 5   | Shape selectors (by group, source path + names)                                                  | TS AST query over existing JSDoc + path globs                                                                                                        |
| 6   | Path-based filters (package, file glob, exclusions)                                              | Content scoped to a package or file path                                                                                                             |
| 7   | Decision-feature filters (path + `@architect-adr-category`)                                      | Content is ADR-driven                                                                                                                                |
| 8   | Registry-direct selectors (taxonomy, FSM tables, CLI/MCP registries)                             | The registry IS the truth — no graph predicate needed                                                                                                |
| 9   | Diagram-scope objects (`{ archContext, archLayer, patterns, include, direction, type, source }`) | Diagram body distinct from doc body                                                                                                                  |

## 7. Worked example — using the maintainer's own ARCHITECTURE.md notes

The maintainer's informal mapping notes (in the session's chat history; not duplicated here) demonstrate the shape. To formalize them:

```markdown
### CP-001 — "Key Design Principles" table (ARCHITECTURE.md ~line 30-40)

- **Anchor / quote:** `### Key Design Principles` header + 6-row table
- **Type:** principle-table
- **Source candidate(s):**
  - Primary: ADR Feature: titles + their first-line description (each principle = one ADR's name + summary)
  - Alternatives: hand-curated kernel doc if some principles don't have an ADR yet
- **Extractor status:** partial — `extractDecisions` returns ADR records, but doesn't currently emit a one-line summary per ADR shape suitable for a row in this table
- **Selector option:** 7 (decision-feature filter)
- **Doc category:** `architecture-document`
- **Notes:** several principles (Single Source of Truth, Single Read Model) DO have ADRs (ADR-003, ADR-006); a couple (Result Monad, Schema-First Validation) may not — those become editorial-framing candidates or motivate new ADRs

### CP-002 — Configuration pipeline stage table (ARCHITECTURE.md ~line 60-72)

- **Anchor / quote:** `### How Configuration Affects the Pipeline` header + 4-row table (Scanner / Extractor / Transformer × Configuration Input × Effect)
- **Type:** pipeline-table
- **Source candidate(s):**
  - Primary: Zod schema fields on `ProjectConfigSchema` + per-stage JSDoc on the canonical scanner/extractor/transformer modules
  - Alternatives: tag predicate `@architect-role:projection` ∩ `@architect-bounded-context:configuration` + per-pattern documentation
- **Extractor status:** missing — needs `extractZodSchemaFields` (PROJECTION-MAPPING.md § 4 lists this as not present today)
- **Selector option:** combo:1+8 (tag predicate on stage modules, plus registry-direct on Zod)
- **Doc category:** `architecture-document` or `reference-spec` depending on which side the substrate puts it
- **Notes:** the third column ("Effect") is editorial framing — derived from JSDoc, not from the schema itself

### CP-003 — `defineConfig` / `loadProjectConfig` / `resolveProjectConfig` signature block (ARCHITECTURE.md ~line 56-58 in the example)

- **Anchor / quote:** `// architect.config.ts` code block + function names
- **Type:** shape-snippet + mermaid (relationships between the three)
- **Source candidate(s):** TS AST extraction of the three function signatures + a Mermaid diagram showing their call relationship
- **Extractor status:** signature extraction `partial` (raw text via `extractShapes`; structured signature missing); relationship Mermaid `missing` (extractClassDiagram / sequenceDiagram not present)
- **Selector option:** combo:5+9 (shape selectors + diagram-scope)
- **Doc category:** `architecture-document`
- **Notes:** docs commonly include cross-references like `src/config/define-config.ts` — file metadata extractor is implied (FINDINGS Gap)
```

This is the shape. Capture every distinct content piece this way.

## 8. Anti-patterns (stop)

- **Skimming the doc.** Read it end-to-end. The mapping's value is in completeness — missed content pieces invalidate the aggregate.
- **Designing the substrate while mapping.** The mapping reports observations; design decisions come from the aggregate read by a separate session. If a substrate design occurs to you, capture it in the per-doc "Notes" field, not as a recommendation.
- **Inventing new selector options.** The nine options in `MATRIX-FRAMEWORK.md` § 3 are the design space. If a content piece appears to need something else, flag it explicitly in the aggregate summary; do not silently introduce option 10.
- **Speculating on extractor coverage.** Reference the inventory in § 5. If a content type fits an existing extractor but with a caveat, mark `partial` with a one-line note — do not mark `exists` unconditionally.
- **Bypassing the per-doc termination check.** Each per-doc file must end with the "Aggregate observations for this doc" block.
- **Touching `architect-projection/src/` or any production code.** Mapping is read-only research.

## 9. Termination criteria per agent

Per-doc agent is done when:

- Every distinct content piece in the input doc has a CP entry
- The "Aggregate observations for this doc" block is complete
- The mapping file is written to `.pr-coordination/proto-output/mapping/<doc-slug>.md`

Aggregate agent (or the orchestrator) is done when:

- All four per-doc files exist
- `SUMMARY.md` is written per the template in § 3
- The "Recommendations for substrate design" section is filled with concrete, falsifiable recommendations (not "consider doing X" prose — actual extractor names, actual carve-out shapes)

## 10. Recommended bootstrap for a fresh agent

```bash
# Confirm the live graph state and verb shapes before any file reads
pnpm architect:query overview
pnpm architect:query taxonomy --count
pnpm architect:query list --status candidate --names-only

# Then read in this order:
# 1. PROBLEM-DEFINITION.md (~120 lines) — what we're solving and why
# 2. MATRIX-FRAMEWORK.md § 2-3 (the three-axis model + the nine selector options)
# 3. PROJECTION-MAPPING.md § 1 (stack vocabulary)
# 4. This file (MAPPING-CONTEXT.md) end-to-end
# 5. proto-output/FINDINGS.md (D8 prototype lessons — the kind of output that survives the mapping pass)
# 6. The four input docs from § 2 above

# Then map.
```

## 11. Cross-references

- [`PROBLEM-DEFINITION.md`](./PROBLEM-DEFINITION.md) — what / why / scope / constraints
- [`MATRIX-FRAMEWORK.md`](./MATRIX-FRAMEWORK.md) — three structural axes, six doc categories, nine selector options
- [`PROJECTION-MAPPING.md`](./PROJECTION-MAPPING.md) — same matrix on the live `architect-projection` stack
- [`proto-output/FINDINGS.md`](./proto-output/FINDINGS.md) — D8 CLI catalog prototype lessons (Gap A-D framed there)
- [`docgen-mapping/00-synthesis.md`](./docgen-mapping/00-synthesis.md) § 2 — cross-corpus duplication map (11 fragments × site counts)
- [`DECISIONS.md`](./DECISIONS.md) — D1-D12 ratified; the load-bearing ones (D2, D3'', D5, D8) appear above
- [`architect/specs/documentation-projection/`](../architect/specs/documentation-projection/) — the four candidate specs the campaign delivers against
