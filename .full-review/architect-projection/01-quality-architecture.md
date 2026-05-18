# architect-projection — Phase 1 Consolidated: Code Quality & Architecture

**Sources:** `raw/1A-code-quality.md` + `raw/1B-architecture.md`. Findings tagged **[1A]**, **[1B]**, or **[1A+1B]**.

## Executive Summary

`architect-projection` shows **substantially stronger doctrine adherence than `architect-core`**: 107 `z.strictObject` sites and zero `z.object`; zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME`/`void X`; `parseAtBoundary` (which core exports but never uses) **is actually wired in here** through the shared `parseAndProject` helper — projection is the consumer that gives the core primitive real-world coverage; `TRUSTED_MARKDOWN` is correctly module-private, enforced by 5-AST-selector lint rule; the `options-schema-barrel-audit.mjs` script mechanically enforces public-surface completeness. The 6-subdomain partition is real and observable across `fragments/`, `projections/`, and disclosure tagging.

The Critical findings are *not* doctrine breaches; they're structural defects in places the doctrine doesn't yet reach:

1. **The advertised CI perf gate is a fake.** `tests/features/perf/business-rule-set-report.steps.ts` writes a JSON report to `.sisyphus/evidence/` and asserts only `Number.isFinite(summary.avgMs)` + `summary.iterations > 0`. **No baseline is loaded; no comparison performed; no test fails on regression.** The README, AGENTS.md, and 00-scope of this review all claim a `baseline × 1.5` budget — the claim is rhetorical. Given that core's `H-CORE-8` (27× `structuredClone`) directly affects this package's perf path, the gate's absence is high-leverage.
2. **One projection (`parseAndProjectOpenQuestionList`) bypasses the shared `parseAndProject` wrapper** and uses raw `OptionsSchema.parse(rawOptions)`. The 14 sibling entrypoints all route through `parseAndProject` → `parseAtBoundary`. The outlier throws a raw `ZodError` with no projection-name context; siblings throw `BoundaryParseError`. README explicitly claims uniform behavior; this site falsifies it.
3. **The Zod 4 `.extend()` strictness-loss bug (core's F4A-H-6) is confirmed in this package** at `PatternDetailSchema` (the richest, most-consumed fragment) and `EmbeddedDeliverableManifestSchema`. `.extend()` on a `z.strictObject` silently produces an open schema; unknown fields pass through.

Two structural Highs that affect family architecture:

- **The renderer is no longer codec-agnostic** (ADR-005 Rule 5 violation). `render-markdown.ts` (2,227 LOC) has 10 fragment-kind-specific normalizers and imports `summarizeTaxonomyDigest` directly from `fragments/governance/`. Adding a new fragment kind now requires renderer changes. Either move per-fragment composition to the projection layer (or fragments expose their own `toBlocks()`) — or retroactively supersede ADR-005 with a "Fragment-aware Renderer" decision.
- **`BundleRouting` and `ProjectionBundle<T>` — the most-crossed contract in the package — are hand-written interfaces, not `z.infer`** (1B H-PROJ-4). Same anti-pattern as core's `PatternGraph` (C-CORE-2) on projection's analogous load-bearing contract. The runtime guard `isBundle` is independently hand-coded over `BundleRouting` and will drift.

Cross-package confirmations: **CL-CORE-16/17** (fuzzy-match + extractFirstSentenceRaw duplication) confirmed at `pattern-helpers.internal.ts:432-514` and `:274-286`. **F4A-H-6** confirmed at two sites above. **H-CORE-8 downstream pressure** materializes as `filterPatterns` doing an unconditional `[...patterns]` defensive copy on the no-filter path at all 14 hot call sites (H-PROJ-6 / 1A). **C-CORE-5 pattern** (cast strings to enum after Set.has narrowing) recurs at `session-context.internal.ts:264` and `scope-readiness.internal.ts:164`.

## Critical (P0)

### C-PROJ-1. Zod 4 `.extend()` silently drops strict mode at the most-consumed fragment **[1A+1B]** (confirms core F4A-H-6)

`src/fragments/pattern-relations/pattern-detail.ts:24`, `src/fragments/pattern-relations/supporting.ts:54-58`. `PatternDetailSchema = PatternIdentitySchema.extend({...})` and `EmbeddedDeliverableManifestSchema = DeliverableManifestSchema.omit({kind: true}).extend({...})`. In Zod 4, `.extend()` does NOT propagate the strict modifier — the resulting schema accepts unknown fields. `PatternDetail` backs `projectPatternDetail`, `projectPatternBundle`, `projectArchitectureNeighborhood`, the UI renderer's `renderPatternDetail`, and the markdown generic fallback — it's the richest fragment in the package.

**Recipe:** `z.strictObject({ ...PatternIdentitySchema.shape, ...newFields })`. Same fix as core F4A-H-6.

### C-PROJ-2. `parseAndProjectOpenQuestionList` bypasses the shared trust-boundary wrapper **[1B]**

`src/projections/pattern-relations/open-question-list.ts:38` — `return projectOpenQuestionList(context, OpenQuestionListOptionsSchema.parse(rawOptions))`. 14 sibling entrypoints route through `parseAndProject()` in `_shared/parse-and-project.internal.ts` (which calls `parseAtBoundary` and emits a `BoundaryParseError` with `projectionName` context). This outlier throws a raw `ZodError` with no projection context — MCP consumers see inconsistent error shapes.

**Recipe:** rewrite as `parseAndProject(OpenQuestionListOptionsSchema, projectOpenQuestionList, 'parseAndProjectOpenQuestionList', {})`. Extend `options-schema-barrel-audit.mjs` to require every `parseAndProject*` export to reference the shared helper.

### C-PROJ-3. Advertised `baseline × 1.5` perf gate does not exist — it's a report generator misdescribed **[1B]**

`tests/features/perf/business-rule-set-report.feature` + `steps.ts:721-762`. Writes a JSON report to `.sisyphus/evidence/task-3-business-rule-set-perf-report.json` and asserts only `Number.isFinite(summary.avgMs)` + `summary.iterations > 0`. The README, AGENTS.md ("Perf regression gate"), and the 00-scope review document all claim a `baseline × 1.5` budget. **The CI guarantee is rhetorical.**

**Recipe:** land a real budget. Add a committed `baseline.json` next to the feature; load it; fail when `avgMs > baseline.avgMs * 1.5`. This is the right choice given H-CORE-8's downstream pressure. Alternatively, restate the README to claim only a perf-evidence report, not a gate — but option (a) is the doctrine-aligned move.

## High (P1)

### Architecture (10 items from 1B)

| # | Title | Location |
|---|-------|----------|
| H-PROJ-A-1 | **Renderer not codec-agnostic** — ADR-005 Rule 5 violated. `MARKDOWN_NORMALIZERS` table at `render-markdown.ts:208-219` has 10 fragment-kind-specific normalizers; `render-ui.ts` (677 LOC) mirrors the pattern. Adding a fragment requires renderer changes. **Recipe:** move per-fragment composition to projection layer (fragments expose `toBlocks()` / `toRenderableDocument()`); OR retroactively supersede ADR-005. Don't leave the gap undocumented. |
| H-PROJ-A-2 | **`disclosure/spec.ts:9` imports `ProjectionFilterSchema` from `projections/_shared/filter.js`** — supposed-primitive disclosure layer transitively drags projection internals. Future projection importing disclosure closes a cycle. **Recipe:** move `ProjectionFilterSchema` into `src/disclosure/projection-filter.ts`; have `projections/_shared/filter.ts` re-export. |
| H-PROJ-A-3 | **`summarizeTaxonomyDigest` is a runtime helper inside `fragments/`** (the contracts layer). `fragments/governance/taxonomy-digest.ts:33`; imported by renderer at `render-markdown.ts:39`. Renderers gain back-channel to fragment-side logic bypassing projection. **Recipe:** move to `projections/governance/taxonomy-digest.ts` or inline 4 lines. |
| H-PROJ-A-4 | **`BundleRouting`/`ProjectionBundle<T>` hand-written interfaces** at `fragments/base.ts:6-31`, not `z.infer` from a schema. Runtime guards (`isBundle`, `isRoutingLike`) hand-coded over the interface. Same anti-pattern as core's C-CORE-2. **Recipe:** author `BundleRoutingSchema` + generic `projectionBundleSchema<T>(fragmentSchema)` factory; derive types via `z.infer`. |
| H-PROJ-A-5 | **`render-markdown.ts` is 2,227 LOC mixing 8 concerns** — render orchestration + routing/path resolution + 10 fragment-kind normalizers + generic fallback + block rendering + markdown escape + routed-path validation + oversized-document splitting. **Recipe:** mechanical 4-way split (`routed-paths.ts`, `splitting.ts`, `normalizers/*.ts`, block rendering). `TRUSTED_MARKDOWN` stays renderer-private. |
| H-PROJ-A-6 | **Duplicates of `architect-core` utils** (CL-CORE-16/17 confirmed): `findBestMatch`/`scoreMatch`/`levenshteinDistance` at `pattern-helpers.internal.ts:432-514`; `extractFirstSentenceRaw` at `:274-286`. **Recipe:** delete projection copies after core's CL-CORE-16/17 land canonical implementations + tests. |
| H-PROJ-A-7 | **Triple-duplicated slug functions** with **subtle behavior differences**: `_internal/slug.ts#slugForFilename` (camelCase-aware), `governance/governance-shared.internal.ts#slugify` (non-splitting), `architect-core#slugify` (third variant). `render-markdown.ts` uses one; `render-ui.ts` uses another. **Two patterns with the same name produce different anchors in markdown vs UI output — real cross-renderer parity defect.** **Recipe:** canonicalize on `slugForFilename`; delete others. |
| H-PROJ-A-8 | **Dual schema for `ProjectDocumentationBundleOptions`** — `ProjectDocumentationBundleOptionsSchema` (typed via `z.custom`) + `RawProjectDocumentationBundleOptionsSchema` (plain `z.string()`). Only the raw schema is used at the trust boundary; the typed version is dead. **Recipe:** delete the typed schema; let `assertSupportedDocumentType` dispatch inside the projection. |
| H-PROJ-A-9 | **`documentation-type-registry.ts` proxy/lazy-init machinery** (174 LOC, `createLazyReadonlyArrayFacade` Proxy + 4-file decomposition `*.identity.ts`/`*.cli-surface.ts`/`*.disclosure.ts`/`*.output-routing.ts` for a 12-entry static registry). The comment at `:55-63` admits the whole module is "campaign deletion target for W-DOCS-1". **Recipe:** if W-DOCS-1 lands this cycle, module dissolves. If not, replace proxy with `let cached; export function getRegistry() {...}`. |
| H-PROJ-A-10 | **`summarizeTaxonomyDigest` re-exported through BOTH `projections/index.ts` and `fragments/index.ts`** — symbol surfaces in two of seven subpath barrels with the same ownership claim. **Recipe:** moves with H-PROJ-A-3; delete the fragments re-export. |

### Code quality (8 items from 1A)

| # | Title | Location |
|---|-------|----------|
| H-PROJ-Q-1 | F4A-H-6 confirmed (same as C-PROJ-1) — listed for the strictObject-spread recipe. |
| H-PROJ-Q-2 | **`parseBusinessRuleAnnotations` + `deduplicateScenarioNames` duplicated** between `governance/business-rules.internal.ts:535-602` and `_shared/pattern-helpers.internal.ts:349-425`. Both run on the perf-gate path. The governance copy returns a typed `BusinessRuleAnnotations`; the `_shared` copy returns inline object — already drifted. **Recipe:** consolidate into `_shared/business-rule-annotations.internal.ts`. |
| H-PROJ-Q-3 | **`getPatternName` exists 3 times within projection** — `_shared/pattern-helpers.internal.ts:77-79`, `governance/governance-shared.internal.ts:33-35`, + inline `?? `-fallbacks. **Recipe:** delete governance copy; import from `_shared/`. |
| H-PROJ-Q-4 | **`createStatusCounts` duplicated** between `delivery-reporting/index.ts:219-227` and `operational-insights/index.ts:534-543`. **Each is also a perf-gate hot path doing 4 sequential filter passes.** **Recipe:** consolidate into `_shared/status-counts.internal.ts` with single-pass tally. |
| H-PROJ-Q-5 | **Renderer tabular-data helpers duplicated verbatim** between `render-markdown.ts:1624-1693` and `render-ui.ts:602-648` (`isBlockArray`, `toTabularRows`, `getTabularColumns`, `isPrimitiveLike`). **Recipe:** extract `renderers/_shared/tabular.ts` + `renderers/_shared/primitives.ts`. |
| H-PROJ-Q-6 | **`filterPatterns` unconditionally allocates** `[...patterns]` on the no-filter path at all 14 hot call sites. **Projection-side analogue of H-CORE-8.** **Recipe:** return input array when `filter === undefined`; type return as `readonly ExtractedPattern[]`. |
| H-PROJ-Q-7 | **Two error styles in the same package** — 16 raw `Error` throws vs 9 typed `ProjectionError` with discriminated `ProjectionErrorCode`. Worst case: `pattern-catalog.internal.ts:76` throws raw `Error("Parent pattern not found")` when `'PATTERN_NOT_FOUND'` code exists 5 files away. **Recipe:** expand `ProjectionErrorCode` to cover renderer/routing errors; convert 16 raw throws. |
| H-PROJ-Q-8 | **`render-markdown.ts` size** (2,227 LOC) — same as H-PROJ-A-5; companion finding from code-quality lens. |

## Medium (P2) — abbreviated table

| # | Source | Issue |
|---|--------|-------|
| M-PROJ-1 | 1A | `session-context.internal.ts:264` uses `as keyof typeof VALID_TRANSITIONS` after `Set.has` — same shape as C-CORE-5. Also recurs at `scope-readiness.internal.ts:164`. **Recipe:** export `isValidProcessStatus` type-guard from core; use it here. |
| M-PROJ-2 | 1A | `requirement-routes.ts:72` casts unvalidated child key to `LogicalRouteId`. **Recipe:** validate via `LogicalRouteIdSchema.parse` or thread `LogicalRouteId[]` through. |
| M-PROJ-3 | 1A | `dependency-tree.internal.ts:113` allocates fresh `Set` per recursion frame (`new Set(visited)`). **Recipe:** mutate `visited` before recursion, delete after — O(1) per frame. |
| M-PROJ-4 | 1A | `BundleRouting` hand-written validator (`isRoutingLike`) parallel to no schema. **Same as H-PROJ-A-4 from the code-quality lens.** |
| M-PROJ-5 | 1A | `documentation-bundle.internal.ts` ships parallel typed + raw schemas. **Same as H-PROJ-A-8.** |
| M-PROJ-6 | 1A | Confirms CL-CORE-16/17 — see H-PROJ-A-6. |
| M-PROJ-7 | 1A | `bundle.internal.ts:57-112` resolves the same pattern twice — `requirePattern` at line 57, then again inside `buildBundleEntry` per child. **Recipe:** hoist resolution. |
| M-PROJ-8 | 1A | `operational-insights/index.ts` is 1,200 LOC + 24-case `patternSatisfiesTag` switch that's a data-driven table dressed up as a switch. **Recipe:** `Map<tag, accessor>` lookup. |
| M-PROJ-9 | 1A | `parseAndProject` helper takes `z.ZodType<Options>` — doesn't constrain to a strict object. **Recipe:** add runtime assertion that `schema instanceof z.ZodObject && schema._def.catchall instanceof z.ZodNever`. |
| M-PROJ-10 | 1A | `documentation-type-registry.ts` proxy facade more complex than use case justifies. **Same as H-PROJ-A-9.** |
| M-PROJ-A-1 | 1B | `BlockSchema` defined as `z.ZodType<Block>` with hand-written union — adding a block requires editing 4 places. **Recipe:** `z.discriminatedUnion + z.lazy` pattern from `section-block.ts` core recipe. |
| M-PROJ-A-2 | 1B | `isBundle` runtime predicate parallel to no Zod schema (dissolves with H-PROJ-A-4). |
| M-PROJ-A-3 | 1B | `pattern-helpers.internal.ts` (515 LOC, 13 exports) mixes 7 concerns. **Recipe:** split by concern. |
| M-PROJ-A-4 | 1B | `delivery-reporting/index.ts` (742 LOC) + `operational-insights/index.ts` (1,200 LOC) are massive single files. **Recipe:** split each `project*` into own file (matches `pattern-relations/`, `execution-context/`, `governance/`). |
| M-PROJ-A-5 | 1B | `getPatternName` duplicated within projections (same as H-PROJ-Q-3). |
| M-PROJ-A-6 | 1B | `normalizeLineEndings` duplicates core's `utils/string-utils.ts:101`. |
| M-PROJ-A-7 | 1B | `DocumentationTypeMetadata` aliased to `SupportedDocumentationTypeMetadata` — two names for same shape. |
| M-PROJ-A-8 | 1B | `LogicalRouteId` template-literal type + `LogicalRouteIdSchema` + `parseLogicalRouteId` + `tryParseLogicalRouteId` — type, schema, parsing live next to each other independently maintained. **Recipe:** `z.string().pipe(z.transform(...))` collapses to one source. |
| M-PROJ-A-9 | 1B | `ProjectionContext.packageResolver` required but README claims "graph only" projections. README too strong — projections do use `context.packageResolver(...)`. Either weaken README or fold resolver into graph. |
| M-PROJ-A-10 | 1B | `MARKDOWN_NORMALIZERS` covers 10 of 47 fragment kinds via `StrictKindTable<Out, Options, Kinds>` — the type contract is partial but the type system doesn't say which 10 are first-class. |

## Low (P3) — abbreviated

| # | Issue |
|---|-------|
| L-PROJ-1 | `architecture-diagram.internal.ts:121` interpolates `pattern.role` into Mermaid label without escaping double-quotes. Robustness gap (Mermaid is intentional raw surface). |
| L-PROJ-2 | `project-config.internal.ts:57-58` calls `resolveProjectName` twice. |
| L-PROJ-3 | `extractDescription` regex edge case (same as L-CORE-3; fixed via core consolidation). |
| L-PROJ-4 | `escapePlainMarkdownLine` regexes rebuilt per call (engines cache, but hoist for clarity). |
| L-PROJ-5 | `Array.from({ length: n })` allocator in Levenshtein — pre-allocate with `new Array(n)`. |
| L-PROJ-6 | `extractFirstSentenceRaw` regex inside function. |
| L-PROJ-7 | `render-markdown.ts:1455-1461` ternary chain for `groupedBy` — use `Record<typeof groupedBy, string>`. |
| L-PROJ-8 | `routing/route-id.ts:124-126` `value !== undefined` guard — prefer `typeof value === 'string'`. |
| L-PROJ-A-1 | `errors.ts` `ProjectionErrorCode` is TS string union, not `z.enum`. |
| L-PROJ-A-2 | `RoleDefinition` derived via deep indexing into `tagRegistry`; import directly from core. |
| L-PROJ-A-3 | `FragmentKind` is implicit (45 `z.literal` declarations in discriminated union) — no first-class closed enum. |
| L-PROJ-A-4 | `.readonly()` usage on Options schemas mixed across files. |
| L-PROJ-A-5 | `errors.ts` has no `@architect-pattern` annotation — invisible to PatternGraph. |
| L-PROJ-A-6 | `_internal/format-utils.ts` + `_internal/slug.ts` used cross-module; consider promoting to `shared/`. |
| L-PROJ-A-7 | Hardcoded path heuristics `ARCHITECT_RELEASE_RE`/`ARCHITECT_DESIGN_TIER_RE` in `operational-insights/index.ts:941-942`. Same pattern as H-CORE-11 (`/orders/`/`/inventory/`). |
| L-PROJ-A-8 | `compareQuarterLabels` inline regex parses two formats. Extract to `_shared/quarter-label.ts`. |
| L-PROJ-A-9 | `escapePlainMarkdownText` security-critical but module-private; tests can only verify end-to-end. |
| L-PROJ-A-10 | ADR-009 prose says "raw internal helpers hidden when validated entrypoint exists"; both `parseAndProject*` and `project*` are barrel exports for every domain. Either ADR is too strong or barrel exposes too much. |

## ADR Conformance Summary

| ADR | Status | Notes |
|-----|--------|-------|
| ADR-005 Codec/Renderer Separation Rule 5 (renderer codec-agnostic) | **VIOLATED** | `MARKDOWN_NORMALIZERS` 10-entry kind dispatch + `summarizeTaxonomyDigest` import. Either land H-PROJ-A-1 split or supersede ADR-005. |
| ADR-009 Projection Trust Boundary (parse-at-boundary) | **Mostly held** | 14/15 entrypoints route through `parseAndProject`; one outlier (C-PROJ-2). |
| ADR-009 Markdown content boundary (escape, scheme allowlist, reject `//`) | **Held** | `sanitizeMarkdownLinkTarget` + `normalizeRoutedOutputPath` correctly implement defense-in-depth. |
| ADR-009 `TRUSTED_MARKDOWN` renderer-private | **Held** | Module-private symbol; 5-AST-selector lint rule. |
| ADR-009 Raw internal helpers hidden when validated entrypoint exists | **Not held** | Both `parseAndProject*` and `project*` are barrel-exported peers. |
| ADR-006 Single Read Model | **Held** | Projection consumes `PatternGraph` only via read API. |

## What's healthy and worth preserving

- **`parseAndProject` + `parseAtBoundary` actually wired correctly** — projection is the real-world consumer that gives core's helper its test coverage (closes core's TD-CORE-1 from the consumer side).
- **`renderJson` defensive validation** — throws on `bigint`/`function`/`symbol`/`Date`/`Map`/`Set`/non-plain-object/`NaN`/`Infinity` with JSON-path in every message. Exhaustive, fail-loud.
- **`sanitizeMarkdownLinkTarget` + `normalizeRoutedOutputPath`** — HTML-entity decode → control-character check → protocol-relative reject → scheme allowlist → URL-encode. The security-critical chokepoint done right.
- **`TRUSTED_MARKDOWN` firewall actually works** — module-private; 5-AST-selector lint rule.
- **`FragmentSchema` discriminated union** — 47 fragment kinds in one `z.discriminatedUnion('kind', [...])`.
- **`StrictKindTable<Out, Options, Kinds>` type** — compile-time exhaustiveness for markdown's per-kind dispatch.
- **107 `z.strictObject` callsites; zero `z.object`; zero suppressions** — the cleanest doctrine adherence across the family so far.
- **`options-schema-barrel-audit.mjs`** — mechanical enforcement of public-surface completeness; exemplary discipline. (Extend it to catch C-PROJ-2.)
- **6-subdomain partition** is real and observable across `fragments/`, `projections/`, `disclosure/` tagging.

## Cross-package implications

1. **Projection is the live consumer of core's `parseAtBoundary`.** Sweep 26 of core's action plan (use `parseAtBoundary` at `buildPatternGraph` entry) has projection as proof-of-concept — both sides match after.
2. **CL-CORE-16/17 (fuzzy-match + extractFirstSentenceRaw duplicates) confirmed.** Delete projection copies when core's canonical implementations + tests land.
3. **F4A-H-6 (Zod 4 `.extend` strictness loss) confirmed** at two projection sites (C-PROJ-1). Family-wide audit needed — guard/cli/mcp may have the same pattern.
4. **H-CORE-8 downstream pressure is real** — `filterPatterns` defensive copy (H-PROJ-Q-6) is the projection-side analogue. Both should land before re-baselining the perf budget (after C-PROJ-3 is real).
5. **C-CORE-5 pattern recurs** at `session-context.internal.ts:264`, `scope-readiness.internal.ts:164` (M-PROJ-1). Depends on core exporting `isValidProcessStatus`.
6. **MCP review will see C-PROJ-2's error-shape inconsistency** — the lone `parseAndProjectOpenQuestionList` outlier throws `ZodError` while siblings throw `BoundaryParseError`.
7. **Cross-renderer slug parity defect** (H-PROJ-A-7) — `slugForFilename` vs `slugify` produce different anchors. Same pattern in both renderers should produce same anchor. Bite-waiting-to-happen.

## Critical context for Phase 2

The Phase 2 agents (simplifier + cleanup-reviewer) should pay particular attention to:

1. **The 2,227-LOC `render-markdown.ts` split (H-PROJ-A-5)** — the highest-leverage simplification in the package. Concrete 4-way split is identified in 1B.
2. **The 8 in-package duplications** (`getPatternName`×2, `parseBusinessRuleAnnotations`×2, `deduplicateScenarioNames`×2, `createStatusCounts`×2, `isBlockArray`×2, `toTabularRows`×2, `getTabularColumns`×2, `isPrimitiveLike`×2) — ~120 LOC of dead repetition that one audit pass closes.
3. **`operational-insights/index.ts` 1,200 LOC + `delivery-reporting/index.ts` 742 LOC** — single-file overloads that should split by `project*` function (the pattern siblings already use).
4. **`pattern-helpers.internal.ts` 515 LOC + 13 exports across 7 concerns** — split by concern; the fuzzy-match and extractFirstSentenceRaw go first when core deletes its copies.
5. **No-BC posture: `documentation-type-registry.ts` is "campaign deletion target for W-DOCS-1"** per its own comment. If the cleanup-reviewer can confirm W-DOCS-1 is reasonable to land, the whole module + the dual-schema H-PROJ-A-8 dissolves.
