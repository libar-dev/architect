# Architect Refactor Brief — declared model, gating decision, pipeline order

**Status.** Working artifact. Written to be (a) the input every discovery /
review agent loads after `architect-base` + `architect-data-api`, and (b) the
forcing function the human keeps open while ordering the next two refactor
passes. The model section is descriptive of the codebase **as it stands today**;
the decision and pipeline sections describe the path forward.

If you are an agent reading this: treat sections 1-3 as **inputs to your reasoning**
(constraints, decision, order). Treat sections 4-9 as **the live model** to
validate against, not to rediscover. File scanning to learn the model is a
smell — the model is below.

---

## 1. Scale forcing function

Every proposal in this codebase must scale to roughly these numbers and grow
from there. Suggestions that would not survive a 5× multiplier are dead on
arrival.

| Live count (2026-05-17) | Today | Implied 5× target |
| ----------------------- | ----- | ----------------- |
| Delivery patterns       | 262   | ~1,300 |
| Candidate patterns      | 14    | ~70 |
| Extracted business rules | 344  | ~1,700 |
| Fragment kinds (discriminated union) | 42 | ~80 (saturates faster than patterns) |
| Taxonomy entries (roles / metadata / aggregation) | 30 | ~50 |
| Block primitives (heading, paragraph, table, list, code, mermaid, link-out, collapsible, separator) | 9 | 9 (closed set; new primitives are ADR-class) |
| MCP tools | 21 | ~30 |

The Block primitive set is treated as **closed**. New rendering needs compose
existing primitives or earn an ADR. Everything else grows linearly with the
graph.

---

## 2. The one gating decision

Resolve before any markdown / projection cleanup lands:

> **Are Fragments authored as Block arrays directly, or does the renderer
> keep normalising heterogeneous Fragment shapes into Block-equivalent
> structures at render time?**

Today the answer is *mixed*. `BlockSchema` exists (`blocks/schema.ts`, 9
primitives). `DecisionRecord` is authored block-first (`context: Block[]`,
`decision: Block[]`, `consequences: Block[]`, `alternatives: Block[]`). Most
of the other 41 Fragment kinds are authored as typed-but-not-Block shapes,
and the 2,222-line markdown renderer is doing per-Fragment-kind normalisation
to fill the gap.

The decision pins down two very different futures:

| Choice | Where blocks live | Renderer shape | Refactor surface |
| ------ | ----------------- | -------------- | ---------------- |
| **A. Fragment-authors-blocks** | Each Fragment that produces prose carries `Block[]` fields directly | Thin block dispatcher (≤200 LOC); per-block escape stages | 41 Fragment authors update; renderer collapses; future markdown bugs live in one small surface |
| **B. Renderer-normalises** | Fragments stay heterogeneously typed | Renderer keeps the per-kind dispatchers, but escape stages are extracted as a renderer-internal content boundary | Renderer is refactored in place; Fragment authors are untouched; future markdown bugs live in the 2,222-line surface but with property-fuzz-tested escape stages |

A is the lower-floor / higher-ceiling refactor. B is the lower-risk / shorter
half-life refactor. **This brief assumes A** in section 4. If B wins, step 2
of the pipeline changes shape but the order stays the same.

**Capture as ADR amendment before step 2 starts.** Amend ADR-005 with the
decision and the migration plan; close ADR-009's "trusted-inline-Markdown
escape hatch" definition against the chosen renderer surface.

---

## 3. Refactor pipeline (ordered; do not parallelise)

The five steps are sequential. Re-ordering causes rework — specifically,
annotation pull-through done before the diagnostic bus means re-annotating
patterns that silently vanished.

```
Step 1 — Cleanup pass (NOW)
   Workspace lint rules + dedup helpers + barrel hygiene.
   Closes SUITE-RC-1 through SUITE-RC-7 from the cleanup review.
   Outcome: the codebase stops growing the anti-patterns the review found.

Step 2 — Block-IR enforcement at Fragment authoring (DECISION A)
   Migrate 41 Fragment kinds to author Block[] arrays directly.
   Collapse the markdown renderer to a thin per-block dispatcher.
   Property-based fuzz suite on the per-block escape stages (closes ADR-009
   markdown content-safety once and for all).
   Outcome: rendering complexity drops by an order of magnitude; future
   doc-type additions are O(Fragment), not O(Fragment × renderer).

Step 3 — Silent-drop diagnostic bus
   ExtractionDiagnosticBus in architect-core; extraction, lint, CLI all push.
   Workspace ESLint rule bans bare catch {} / console.warn / void warnings
   in extraction & enforcement surfaces.
   Outcome: patterns can no longer silently vanish from the graph. Required
   precondition for step 4.

Step 4 — Annotation pull-through on key abstractions
   Re-annotate the abstractions de-annotated when taxonomy halved.
   The diagnostic bus catches anything that doesn't make it into the graph.
   Outcome: PatternGraph coverage restored; projections become useful.

Step 5 — Universal document generation improvements
   Consume the now-complete graph. New doc types compose Fragment(42) +
   Block(9) + ExtractedShape; no per-doc generators.
   Outcome: the universal doc-gen capability the architect product was always
   going to be.
```

**Why this order is non-negotiable.**

- Step 4 before step 3: re-annotated patterns silently vanish at the
  extraction-side silent drops; you re-annotate twice.
- Step 2 before step 5: universal doc-gen built on a renderer that
  normalises per-Fragment-kind locks in the heterogeneity step 5 was meant
  to eliminate.
- Step 1 before everything: every later step is harder against the
  conditional-spread / alias / duplicate-helper sprawl the review found.

---

## 4. What's about to land (delta vs today)

The next two refactor passes are expected to ship:

| Change | Where | Resolves |
| ------ | ----- | -------- |
| `pickDefined<T>` helper + workspace refactor | `architect-core/utils/` + every package | SUITE-RC-6 (≈600 LOC removed) |
| `parseAndProject*` import-scope ESLint rule | workspace ESLint | SUITE-RC-5 (no more boundary slips) |
| `no-zod-object-in-validation-schemas` ESLint rule + codemod | workspace | SUITE-RC-2 (19 sites in core + mcp Empty/union shapes) |
| Global-mutation ban (`Reflect.set(globalThis…)`, `process.chdir`, etc.) | workspace ESLint | SUITE-RC-3 (catches the next 676a916-class fix) |
| `no-bare-catch` + `no-console` (scoped) | workspace ESLint | SUITE-RC-1 prevention |
| Barrel-hygiene + duplicate-body + `.internal.ts` audits | workspace audits | SUITE-RC-4 + SUITE-RC-7 |
| `ExtractionDiagnosticBus` interface | `architect-core` | SUITE-RC-1 closure (already-shipped silent drops) |
| Block-IR enforcement on 41 Fragment kinds (DECISION A) | `architect-projection/fragments/**` | S-2 from suite report |
| Markdown renderer collapse + property fuzz | `architect-projection/renderers/render-markdown.ts` | S-1 (the three ADR-009 bypasses) |
| Lift file-cache from CLI to core | `architect-core/generators/pipeline/` | SUITE-RC-8 (also unblocks MCP cache reuse) |
| Move `getPatternName` to canonical schemas | `validation-schemas/extracted-pattern.ts` | SUITE-RC-8 inverted-dep fix |
| Tier-A baseline → JSON baseline | `architect-guard/lint/baselines/` | S-4 from suite report |

**Out of scope for this round** (carry to a later pass):
- FSM perimeter heuristic→deterministic refactor (S-3) — bigger move; needs
  its own design pass.
- CLI/MCP twin parity test infrastructure (S-5) — wait for Block-IR landing.
- REPL fate (promote / demote / delete) — decision pending downstream
  consumer inventory.

---

## 5. The model as it stands today

What follows is the **canonical description of what the PatternGraph extracts
and projects**. Treat as authoritative; if code disagrees, that is a finding,
not a model update.

### 5.1 Sources of truth — the two extractors

| Source           | What it reads                                                           | Extractor                                                                 | Output                                                                      |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| TypeScript JSDoc | `@architect-*` directives on `.ts/.tsx` files                           | `DocExtractor` (`packages/architect-core/src/extractor/doc-extractor.ts`) | `ExtractedPattern` with `source.kind = typescript`                          |
| Gherkin specs    | Feature/rule/scenario tags + Background data tables on `.feature` files | `GherkinExtractor` (`gherkin-extractor.ts`)                               | `ExtractedPattern` with `source.kind = gherkin`                             |
| TS tagged shapes | `@architect-shape` blocks within a TS pattern's file                    | `ShapeExtractor` (`shape-extractor.ts`, AST-walked)                       | `extractedShapes[]` attached to the pattern                                 |
| Pattern join     | Both above merged by `patternName`                                      | `DualSourceExtractor.combineSources`                                      | `DualSourcePattern` (`ExtractedPattern + process + deliverables + sources`) |

### 5.2 The 27 `@architect-*` JSDoc directives (TS side)

From `DocDirectiveSchema` + observed grep.

**Identity / classification (8)** — `@architect-pattern <Name>` (REQUIRED),
`@architect-status`, `@architect-role:<role>`, `@architect-bounded-context:<name>`,
`@architect-product-area`, `@architect-level`, `@architect-parent`,
`@architect-phase`.

**Relationships (6)** — `@architect-uses`, `@architect-depends-on`,
`@architect-implements`, `@architect-extends`, `@architect-see-also`,
`@architect-target` (stub deliverable path).

**Lifecycle / governance (4)** — `@architect-completed`, `@architect-since`,
`@architect-unlock-reason <≥10-char rationale>` (FSM bypass),
`@architect-title`.

**ADR-specific (7)** — `@architect-adr`, `@architect-adr-status`,
`@architect-adr-category`, `@architect-adr-theme`, `@architect-adr-layer`,
`@architect-adr-supersedes`, `@architect-adr-superseded-by`.

**Other (2)** — `@architect-decision` (aggregation), `@architect-validation`,
`@architect-cli` (bin marker), `@architect` (opt-in marker — without it the
directive is ignored).

Aggregation tags (no value): `@architect-overview`, `@architect-decision`,
`@architect-intro` (`getAggregationTags`, `doc-extractor.ts:347`).

### 5.3 Free-form JSDoc prose & shape detail

`DocDirective.description` (everything after the tag block) is captured
verbatim. Within it, three sub-shapes are parsed structurally:

- Heading-style docstring (lines like `## DocExtractor — JSDoc Directive Extraction`)
- `### When to Use` bullet lists → `whenToUse: string[]`
- `@example` blocks → `directive.examples: string[]`

When `@architect-shape` blocks exist in the file, `ShapeExtractor` produces an
`ExtractedShape` per tagged interface/type/enum/function/const with:

```ts
ExtractedShape {
  name, kind: 'interface' | 'type' | 'enum' | 'function' | 'const',
  sourceText, jsDoc?, lineNumber,
  typeParameters?, extends?, overloads?,
  exported, group?, includes?,
  propertyDocs[]: { name, jsDoc },        // per-property JSDoc
  params[]:      { name, type?, description },  // @param parsed
  returns?:      { type?, description },        // @returns
  throws[]:      { type?, description },        // @throws
}
```

**This is the JSDoc-prose-to-structured-data path.** It captures per-property
JSDoc, `@param` / `@returns` / `@throws` tables, type parameters, and
`extends` chains. **Step 5 of the pipeline (universal doc generation) consumes
this surface; do not let cleanup work erode it.**

### 5.4 Gherkin extraction — what comes off `.feature` files

From `feature.ts` + `gherkin-extractor.ts` + `dual-source-extractor.ts`.

**Feature-level tags** parsed into structured fields — `@pattern:<Name>` →
`process.pattern`, plus `@phase:<n>`, `@status`, `@quarter`, `@effort`,
`@team`, `@workflow`, `@completed`, `@effort-actual`, `@risk`, `@product-area`,
`@user-role`, `@business-value:"<v>"`.

**Background data tables** → `Deliverable[]` (one row per deliverable).
Headers recognised: `Deliverable`, `Status`, `Tests`, `Location`, `Finding`,
`Release`. Status validates against `DELIVERABLE_STATUS_VALUES`.

**Rules + Scenarios** → `BusinessRule[]` on the pattern + full
`GherkinScenario` records.

- `Rule:` header + tags + scenarios + docstring → projection
  `BusinessRule { invariant, rationale, verifiedBy[], scenarioCount, package, productArea }`.
- Scenario semantic tags (whitelisted in `SEMANTIC_SCENARIO_TAGS`):
  `happy-path`, `validation`, `business-failure`, `business-rule`,
  `compensation`, `idempotency`, `expiration`, `workflow-state`.
- Every step keeps its `keyword`, `text`, optional `dataTable`, optional
  `docString` (with `mediaType`).
- `Examples:` tables on Scenario Outlines preserved with `headers` + `rows`.

**Open Questions block** in feature description → `OpenQuestionList.items[].questions[]`.

### 5.5 Per-pattern read model (`ExtractedPattern` — 60+ fields)

The Zod schema in `validation-schemas/extracted-pattern.ts` is the canonical
shape. Categorised:

| Group                      | Fields                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity                   | `id`, `name`, `patternName`, `title`, `role`, `boundedContext`                                                                                         |
| Source                     | `source.file`, `source.lines`, `directive` (full `DocDirective`), `code`, `exports[]`, `extractedAt`                                                   |
| Status / lifecycle         | `status`, `adr`, `adrStatus`, `adrCategory`, `adrTheme`, `adrLayer`, `adrSupersedes`, `adrSupersededBy`, `since`, `completed`, `unlockReason`          |
| Hierarchy                  | `level`, `parent`, `children[]`, `phase`, `release`, `quarter`                                                                                         |
| Relationships              | `uses[]`, `implementsPatterns[]`, `extendsPattern`, `seeAlso[]`, `apiRef[]`, `targetPath`                                                              |
| Delivery                   | `effort`, `effortActual`, `team`, `workflow`, `risk`, `priority`, `productArea`, `userRole`, `businessValue`                                           |
| Specs                      | `scenarios[]` (`ScenarioRef`), `behaviorFile`, `behaviorFileVerified`, `executableSpecs[]`, `rules[]` (thin `BusinessRule`), `whenToUse[]`, `convention[]` |
| Body                       | `description` (prose), `examples[]`, `include[]`, `extractedShapes[]`, `constraints[]`                                                                 |
| Discovery (review surface) | `discoveredGaps[]`, `discoveredImprovements[]`, `discoveredRisks[]`, `discoveredLearnings[]`                                                           |
| Deliverables (joined)      | `deliverables[]: { name, status, tests, location, finding?, release? }`                                                                                |

### 5.6 Projection Fragments — 42 discriminated-union kinds

These are the **typed shapes you actually get out of the CLI / MCP**. From
`FragmentSchema`.

**Pattern-relations (12)** — `PatternCatalog`, `PatternSummary`, `PatternDetail`,
`PatternBundleEntry`, `BoundedContext`, `ArchitectureNeighborhood`,
`ArchitectureComparison`, `DependencyEdge`, `DependencyEdgeSet`,
`DependencyTree`, `OpenQuestionList`, `OrphanPatternList`.

**Governance (7)** — `BusinessRule`, `BusinessRuleReference`, `BusinessRuleSet`,
`DecisionRecord` (ADR / PDR / DDR / TDR with `context[] / decision[] /
consequences[] / alternatives[]` typed-block arrays), `DecisionCatalog`,
`TaxonomyDigest`, `ValidationRuleDigest`.

**Delivery reporting (5)** — `PhaseProgress`, `StatusDistribution`,
`RoadmapTimeline`, `ReleaseNotesDigest`, `TraceabilityMatrix`.

**Execution context (7)** — `Deliverable`, `DeliverableManifest`,
`FileReadingList`, `HandoffRecord`, `ScopeReadinessCheck`,
`ScopeReadinessReport`, `SessionContextBundle`.

**Operational insights (8)** — `OverviewDigest`, `AnnotationCoverage`,
`TagUsageEntry`, `TagUsageMatrix`, `SourceInventoryEntry`,
`SourceInventoryDigest`, `RoleProfile`, `RoleProfileCollection`,
`RequirementDigest`.

**Documentation composition (3)** — `ProjectConfigSnapshot`,
`ArchitectureDiagram`, `PrChangeReview`.

### 5.7 Typed block primitives (`BlockSchema`)

`packages/architect-projection/src/blocks/schema.ts` defines the inline
content primitives. **This is the IR.** When a Fragment carries prose-ish
content, it should carry `Block[]` — notably `DecisionRecord.context/decision/
consequences/alternatives` already does.

Closed set of 9 primitives: `heading` (levels 1–6), `paragraph`, `separator`,
`table`, `list`, `code`, `mermaid`, `link-out`, `collapsible`.

How ADR prose becomes structured: `decision: BlockSchema[]` rather than a raw
string. **Step 2 of the pipeline propagates this pattern across all 42
Fragment kinds where it applies.**

### 5.8 What's NOT extracted (worth knowing)

- Inline `// architect:` style comments — only JSDoc blocks are scanned.
- Arbitrary test assertions — only `Rule:` + scenario shape, not step-definition code.
- Cross-file shape merging — `extractedShapes` are file-local; re-exports get a separate `ReExportedShape` record but no body.
- Git / blame / owner metadata — not surfaced; nothing reads VCS.
- Comments inside `architect/` design specs are read for graph build but **not** compiled or linted (per `CLAUDE.md` doctrine).

---

## 6. How to pull each shape (canonical verbs)

| You want                                                | Canonical verb                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Everything for a pattern (composite)                    | `bundle <Pattern> --mode <session> --format json`                                                   |
| Full record (deliverables, rules, relationships, stubs) | `pattern <Name>` or `--format json` via `bundle`                                                    |
| Just relationships                                      | `dep-tree <Pattern>` / `arch neighborhood <Pattern>`                                                |
| Just business rules                                     | `rules --pattern <Pattern>` / `rules --package <ws>` / `rules --feature <glob>`                     |
| Just open questions                                     | `open-questions [--parent <X>] --format json`                                                       |
| Decisions catalog                                       | `documentation decisions`                                                                           |
| Extracted shapes (JSDoc bodies, params, returns)        | Live inside `pattern <Name>` / no dedicated verb today — projection consumes them for docs          |
| Tag / role / taxonomy inventory                         | `taxonomy --count` / `tags` / `arch roles`                                                          |
| Graph integrity                                         | `arch dangling --strict` / `arch orphans` / `arch coverage`                                         |
| FSM transition gate                                     | `query isValidTransition <from> <to>`                                                               |

The Data API is the canonical surface for all of the above. The
`bundle <Pattern> --mode <session>` verb is the single composite that
returns everything implementation work needs (docstring + rules + scenarios
+ deps + open-questions in one shot).

---

## 7. Using this brief (for agents)

Two roles, two reading modes.

**Discovery / hypothesis-generation agents.** Sections 1-3 are constraints.
You must (a) propose hypotheses that fit the scale forcing function,
(b) acknowledge which side of the gating decision your hypothesis assumes,
(c) place your hypothesis on the pipeline. A hypothesis that contradicts the
pipeline ordering must justify the contradiction explicitly.

Sections 5-6 are the model to validate against. **Do not file-scan to
rediscover what the model is.** If the model section disagrees with a file
you read, file the disagreement as a finding — it is a drift, not a model
update.

**Adversarial / validation agents.** Sections 1-3 are the assumptions to
attack. If you find a scale at which the forcing function in section 1
breaks, surface it. If you find a third option for the gating decision in
section 2, surface it. If you find a step in section 3 whose order can be
reversed without rework, surface it with the proof.

**Synthesis agents.** Sections 4 and the pipeline in section 3 are your
output template. Group hypotheses into work-blocks aligned to pipeline steps;
flag any hypothesis that does not fit a step.

---

## 8. Provenance and currency

- Pattern / rule / Fragment / tool counts in section 1 are live as of
  2026-05-17 against repo HEAD on `main`.
- Directive list in section 5.2 is from `DocDirectiveSchema` + grep on
  `packages/architect-core/src/**` at the same commit.
- Cleanup-review findings cited in section 4 are from `.cleanup-review/`
  (suite-final-report.md + per-package final reports), generated 2026-05-19.

**Re-verify on disagreement.** Live verbs win: `pnpm architect:query taxonomy
--format json`, `pnpm architect:query overview`, `pnpm architect:query rules
--count`. This brief is canonical only against the date above; the CLI is
canonical against the current commit.
