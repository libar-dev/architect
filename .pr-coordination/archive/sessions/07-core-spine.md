# Session 07 — Connect architect-core production spine (WS-1 expansion, core pt.1)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then `../EXECUTION-PLAN.md`
> §4–§8 and `../DECISIONS.md` (esp. **D-3**, **D-6**, **D-8**). Load skills `architect-base`,
> `architect-data-api`, `architect-refactor-session`.

> **ADR grounding (load-bearing — the maintainer flagged ADR-006 explicitly):**
> `architect/decisions/adr-006-single-read-model-architecture.feature` — the **read model
> is `PatternGraph`**, NOT `ExtractedPattern`. `ExtractedPattern` is the canonical
> per-pattern **record contract** the graph is built from. Feature consumers consume the
> PatternGraph; raw scanner/extractor imports are sanctioned ONLY in pipeline-orchestration
> code that builds the graph (so the A3 orchestrator→stage edges are ADR-correct).
> ADR-001/007: roles from the 8 canonical values; `@architect-uses` is space/comma, no colon.

## Goal

De-orphan the **10 `architect-core/src` production orphans** (the extractor + read-api
spine): `DualSourceExtractor`, `PatternGraphApi`, `GraphInventory`, `PatternClassification`,
`PatternHelpers`, `ArchitectureInspection`, `ShapeExtractor`, `GherkinAstParser`,
`LayerInference`, `AstParser`. Total orphans 58 → ~48.

## Method (campaign discipline — non-negotiable)

Additive `@architect-uses` JSDoc only. **Verify every edge against the file's real import
statements before authoring** (the one sanctioned code-read). **D-8**: exactly ONE
`@architect-uses` line per pattern — extend the existing line, never add a second (the
parser keeps only one). After authoring, **read back via the Data API**
(`pnpm architect:query pattern <X>` → `uses`/`usedBy`; `arch orphans`) BEFORE gates —
"annotation in the file" ≠ "edge in the graph".

## A1 — Create `ExtractedPattern` identity (D-3 approved; code-originated)

`packages/architect-core/src/validation-schemas/extracted-pattern.ts` exports
`ExtractedPattern`/`ExtractedPatternSchema` (the ~60-field record) with **no**
`@architect-pattern`. Add file-level JSDoc:

```
@architect-pattern ExtractedPattern
@architect-role:contract
@architect-bounded-context:validation-schemas
@architect-status:active
```

`role:contract` (NOT read-model — `PatternGraph` is the read model per ADR-006; mirror its
`role:contract`). Before committing, confirm sibling schemas' bounded-context and mirror if
they differ from `validation-schemas`. Create identity in the SAME commit as the edges
below (else `arch dangling --strict` trips on the not-yet-existing target).

## A2 — Read-model + read-api + extractor edges (verified imports)

Each row's `@architect-uses` was verified against the file's real imports. Re-confirm live
before authoring; correct the row if the import set differs.

| Pattern (file)                                                                                                                                    | `@architect-uses`                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `PatternGraph` (validation-schemas/pattern-graph.ts) — imports `ExtractedPatternSchema` (line ~21, composed into byStatus views); `uses:[]` today | `ExtractedPattern`                               |
| `PatternHelpers` (read-api/pattern-helpers.ts)                                                                                                    | `ExtractedPattern, PatternGraph`                 |
| `PatternGraphApi` (read-api/pattern-graph-api.ts) — imports only ExtractedPattern + pattern-helpers, NOT pattern-graph.js                         | `ExtractedPattern, PatternHelpers`               |
| `GraphInventory` (read-api/graph-inventory.ts)                                                                                                    | `ExtractedPattern, PatternGraph, PatternHelpers` |
| `PatternClassification` (read-api/pattern-classification.ts)                                                                                      | `ExtractedPattern, PatternGraph`                 |
| `ArchitectureInspection` (read-api/architecture-inspection.ts)                                                                                    | `ExtractedPattern, PatternGraph, PatternHelpers` |
| `DualSourceExtractor` (extractor/dual-source-extractor.ts) — imports ExtractedPattern + `getPatternName` from pattern-helpers                     | `ExtractedPattern, PatternHelpers`               |

`relationship-resolver`, `./types.js`, `fuzzy-match`, `ArchIndex`, `PatternParseFailure`
are util/local symbols — `search` each; edge ONLY those confirmed as graph patterns.

## A3 — Extractor feeders ← consumers (orchestration→stage, ADR-006-sanctioned)

These 4 import no spine patterns; they de-orphan via an incoming edge from their
already-connected orchestrator (which has empty `uses` today — first line). **Confirm the
exact import line** (`ast-parser` substring also matches `gherkin-ast-parser` — verify):

- `DocExtractor` (extractor/doc-extractor.ts, imports `discoverTaggedShapes` from shape-extractor) → `@architect-uses ShapeExtractor`
- `GherkinExtractor` (extractor/gherkin-extractor.ts, imports `extractPatternTags` from gherkin-ast-parser + `inferFeatureLayer` from layer-inference) → `@architect-uses GherkinAstParser, LayerInference`
- **AstParser**: find its true importer (candidate: `scanner/gherkin-scanner.ts` GherkinScanner, or gherkin-extractor) and add `@architect-uses AstParser` to that pattern's existing line (extend per D-8).

## Out of scope

Phase B (14 core test-feature `@architect-implements` edges) is **Session 08**. Guard,
dogfood test features, working-state specs, and any `Rule:`/invariant authoring are later.

## Gates + acceptance

Run the full `../EXECUTION-PLAN.md §6` sequence. Acceptance:

- `pnpm architect:query arch orphans` → no `packages/architect-core/src/...` rows.
- `pnpm architect:query pattern ExtractedPattern` → `role:contract`, `usedBy` lists the 7
  consumers (incl. `PatternGraph`).
- `pnpm architect:query pattern PatternGraph` → `uses` includes `ExtractedPattern`.
- `arch dangling --strict` exit 0; `architect:guard --staged` 0 status transitions (D-6 —
  no `@architect-unlock-reason`); `test:dogfood` 1057 + projection perf 3/3 unchanged.
- `docs:all` regenerates docs-live (ARCHITECTURE/PATTERNS/CHANGELOG + manifest) — stage with code.

## On completion

`git add` explicit files only (never `-A`) → `architect:guard --staged` → commit. Append
<20-line entry to `../SESSION-REPORTS-AND-LEARNINGS.md`; bump `../state.json`
(`lastCompletedSession`, `currentMetrics.orphansTotal`, add `ExtractedPattern` to `newPatterns`).
