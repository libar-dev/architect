# Session 08 — Connect architect-core test features via @architect-implements (WS-1 expansion, core pt.2)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then `../DECISIONS.md`.
> Load skills `architect-base`, `architect-data-api`, `architect-refactor-session`.
> **Run AFTER Session 07 has committed** (its spine patterns are several implements targets).

> **ADR grounding:** `architect/decisions/adr-003-source-first-pattern-architecture.feature`
> (RULE 4: `@architect-implements` is UML realization, many-to-one; RULE 6: reverse links
> are the PRIMARY, self-maintaining traceability) + `adr-002-gherkin-only-testing.feature`
> (test `.feature` files carry `@architect-implements` links). Authoring `@architect-implements`
> on a test feature is the SANCTIONED de-orphaning edge — it is NOT the "never author reverse
> edges" rule (that rule is only about derived `usedBy`/`enables`).

## Goal

De-orphan the **14 `architect-core/tests/features` executable-test orphans**. Each carries
`@architect-pattern` + `@architect-status` but **no `@architect-implements`** — add a
feature-level `@architect-implements:<ProductionPattern>`. Total orphans ~48 → ~34.

The orphaned test patterns (file → confirm target):
`ShapeExtraction`, `DualSourceMergeIntegration`, `PatternGraphApiReverseLookup`,
`ConfigResolution`, `ConfigurationAPI`, `ProjectConfigLoader`, `SourceMerging`,
`CodecUtilsValidation`, `CrossPackageEdgeClassification`, `DocStringMediaType`,
`FileDiscovery`, `PatternReferenceValidation`, `TagRegistrySchemasValidation`,
`TypeScriptTaxonomyImplementation`.

## Method — per feature, investigative (NOT mechanical)

For EACH feature file:

1. Read its tags + scenarios to identify the **production module/behavior it exercises**.
2. Map that to the production pattern's `@architect-pattern` name; **confirm it exists**
   via `pnpm architect:query search <Name>` / `list --names-only`.
3. Add a single feature-level `@architect-implements:<Pattern>` tag (CSV if it verifies
   several: `@architect-implements:A,B`).
4. **If no clean production-pattern target exists, SKIP it** — record in the session report
   as "no target; deferred". **Never author a phantom target** (it trips `arch dangling --strict`).

Confirmed targets (verified this session):

- `ShapeExtraction` (extractor/shape-extraction-types.feature) → `ShapeExtractor`
- `DualSourceMergeIntegration` (extractor/dual-source-merge.feature) → `DualSourceExtractor`
- `PatternGraphApiReverseLookup` (read-api/pattern-graph-api.feature) → `PatternGraphApi`
- config features → `ConfigLoader` / `ProjectConfigLoader` both exist (map per feature: e.g.
  `ProjectConfigLoader` test → `ProjectConfigLoader`; `ConfigResolution`/`ConfigurationAPI`/
  `SourceMerging` → verify which config pattern each exercises).

Needs investigation (search returned only the test itself — find the real production pattern
by reading scenarios): `FileDiscovery`, `TagRegistrySchemasValidation`, `CodecUtilsValidation`,
`CrossPackageEdgeClassification`, `DocStringMediaType`, `PatternReferenceValidation`,
`TypeScriptTaxonomyImplementation`. Candidates to check: scanner patterns (FileScanner/
GherkinScanner/AstParser/DocStringMediaType extraction), `LayerInference`/edge-classification,
codec-utils, tag-registry/taxonomy builder patterns.

**Do NOT rename** any test pattern to the `…ExecutableTests`/`…Testing` suffix — an identity
rename is No-BC-out-of-scope; the graph treats the suffix as human-facing only. Only add the
`@architect-implements` edge.

## Read-back + gates + acceptance

After authoring, read back (`pattern <TestPattern>` → `implementsPatterns`; or `pattern
<ProductionPattern>` → `implementedBy`; `arch orphans`). Run the full `../EXECUTION-PLAN.md
§6` sequence. Acceptance:

- `arch orphans` → no `packages/architect-core/tests/...` rows (minus any explicitly-deferred
  no-target features, named in the report).
- Each connected test pattern's `implementsPatterns` shows its target; the target's
  `implementedBy` shows the test.
- `arch dangling --strict` exit 0; `architect:guard --staged` 0 transitions; `test:dogfood`
  1057 + perf 3/3 unchanged; `docs:all` regenerated + staged.

## On completion

`git add` explicit files (never `-A`) → guard `--staged` → commit. Append <20-line entry to
`../SESSION-REPORTS-AND-LEARNINGS.md` (note any deferred no-target features); bump
`../state.json` (`lastCompletedSession`, `orphansTotal`).
