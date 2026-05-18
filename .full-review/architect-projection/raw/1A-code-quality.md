# architect-projection — Phase 1A Code Quality Review

**Scope:** code quality of `@libar-dev/architect-projection@2.0.0-pre.1` — 145 source files, ~15,238 SLOC, 83 test files. Architecture concerns are a parallel agent.

## Executive Summary

The package's _idioms_ are strong: zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME`, doctrine-correct `z.strictObject` use across all 107 schema sites, `parseAtBoundary` actually wired in via a shared `parseAndProject` helper (closing the gap CORE has open), discriminated-union `Fragment` schema, and a real module-private `TRUSTED_MARKDOWN` symbol that stays inside `render-markdown.ts`. The architecture-level lint rules are honored — renderers do not import documentation-composition or `.internal.js` files, do not construct route IDs, and the trust symbol does not leak.

The _application_ of those idioms is uneven on the load-bearing files. `render-markdown.ts` is 2,227 lines; `projections/operational-insights/index.ts` is 1,200 lines (build-helpers + 8 projections + 7 JSDoc walls + a 4-bucket dispatch glued together by `createBucketedRequirementDigest`); `business-rules.internal.ts` is 602 lines and reimplements `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` already living in `_shared/pattern-helpers.internal.ts`. `getPatternName`, `createStatusCounts`, `isPrimitiveLike`, `toTabularRows`, `getTabularColumns`, and `isBlockArray` each exist in 2-3 sites within this package — a low-effort consolidation pass dissolves ~200 LOC. Two error styles coexist (16 raw `Error` vs 9 `ProjectionError` with discriminated codes), `PatternDetailSchema` ships the Zod 4 `.extend()`-drops-strict bug from core (F4A-H-6), and `filterPatterns` does an unconditional defensive copy at all 14 hot call sites even when no filter is active.

Two CL-CORE-\* findings are confirmed in place: `fuzzy-match` (Levenshtein + scoring) at `pattern-helpers.internal.ts:432-514` and `extractFirstSentenceRaw` at lines 274-286 — both duplicated from `architect-core/src/utils/`. The architect-core deletion plan (CL-CORE-16/17) calls for removing the projection copies; flagged here and confirmed grep-able.

No critical-severity defects, but four High items materially affect the perf-gate downstream of H-CORE-8 and the schema doctrine.

## Findings by Severity

### Critical (P0)

None.

### High (P1)

#### H-PROJ-1 — `PatternDetailSchema` inherits the Zod 4 `.extend()` strict-loss bug (F4A-H-6 in this package)

`src/fragments/pattern-relations/pattern-detail.ts:24` and `src/fragments/pattern-relations/supporting.ts:54-58`.

```ts
// pattern-summary.ts:17-28 — strict base
export const PatternSummarySchema = z.strictObject({ ... });
export const PatternIdentitySchema = PatternSummarySchema.omit({ kind: true });

// pattern-detail.ts:24 — .extend() chain off a strict-derived schema
export const PatternDetailSchema = PatternIdentitySchema.extend({ ... });

// supporting.ts:54-58 — same pattern
export const EmbeddedDeliverableManifestSchema = DeliverableManifestSchema.omit({
  kind: true,
}).extend({ items: z.array(EmbeddedDeliverableSchema) });
```

In Zod 4, `.extend()` drops the strict modifier (this is the same bug `architect-core` reviewers flagged in F4A-H-6 for `PackageConfigSchema`). `PatternDetailSchema` is the most-consumed read fragment in the package (it backs `projectPatternDetail`, `projectPatternBundle`, `projectArchitectureNeighborhood`, the UI renderer's `renderPatternDetail`, and the markdown generic fallback). Extra unknown properties currently pass validation here.

**Recommendation:** Declare these schemas with explicit shapes via `z.strictObject({ ...BaseShape.shape, ...newFields })` rather than `.extend()`.

```ts
export const PatternDetailSchema = z.strictObject({
  ...PatternIdentitySchema.shape,
  kind: z.literal('PatternDetail'),
  description: z.string().optional(),
  openQuestions: z.array(z.string()).optional(),
  deliverables: z.array(EmbeddedDeliverableSchema),
  relationships: PatternRelationshipsSchema,
  hierarchy: PatternHierarchySchema.optional(),
  rules: z.array(EmbeddedRuleRefSchema),
  stubs: z.array(StubRefSchema),
  deliverableManifest: EmbeddedDeliverableManifestSchema.optional(),
});
```

#### H-PROJ-2 — `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` duplicated (governance vs \_shared)

`src/projections/_shared/pattern-helpers.internal.ts:349-425` AND `src/projections/governance/business-rules.internal.ts:535-602`.

Both files implement the same `**(Invariant|Rationale|Verified by):**` parser and the same case-insensitive scenario-name dedupe over the same `BUSINESS_RULE_ANNOTATION_PATTERN` regex. The governance copy has already drifted slightly: it returns `BusinessRuleAnnotations` (a typed interface), while the `_shared` copy returns an inline `{ invariant?; rationale?; verifiedBy? }` object. They are otherwise byte-for-byte equivalent functions. Both run inside the perf-gate code path (`buildBusinessRule` calls one, `normalizeRules` in `pattern-helpers` calls the other; both are invoked per pattern in `buildPatternBundle` / `buildPatternDetail`).

**Recommendation:** Move `parseBusinessRuleAnnotations` and `deduplicateScenarioNames` to `_shared/business-rule-annotations.internal.ts` and import from both call sites. Co-locate the regex constant.

```ts
// _shared/business-rule-annotations.internal.ts
export interface BusinessRuleAnnotations { ... }
export function parseBusinessRuleAnnotations(description: string): BusinessRuleAnnotations { ... }
export function deduplicateScenarioNames(...): string[] { ... }
```

#### H-PROJ-3 — `getPatternName` exists three times across this package

Sites:

- `src/projections/_shared/pattern-helpers.internal.ts:77-79`
- `src/projections/governance/governance-shared.internal.ts:33-35`
- (implicit via inline `pattern.patternName ?? pattern.name` elsewhere — grep confirms the two helper sites)

Identical bodies. The governance copy was created so governance files wouldn't import from `_shared/pattern-helpers.internal.ts`, but the governance projection already imports `requirePattern` and the bundle code already crosses this boundary, so the separation is not load-bearing.

**Recommendation:** Delete `governance-shared.internal.ts#getPatternName` and import from `_shared/pattern-helpers.internal.ts`. While there, audit `slugify` (the governance copy at `governance-shared.internal.ts:50-56` is _different_ from `slugForFilename` at `_internal/slug.ts:11-18` because it does not camelCase-split; the architect-core `slugify` is the third variant). Pick one canonical slug function and document the camelCase-handling decision in its JSDoc.

#### H-PROJ-4 — `createStatusCounts` duplicated between two large projections

`src/projections/delivery-reporting/index.ts:219-227` AND `src/projections/operational-insights/index.ts:534-543`.

Both are identical 5-line `filter`-based folds over `isPatternComplete`/`isPatternActive`/`isPatternPlanned`/`'candidate'`. Each is called multiple times per projection (operational-insights:123,142, delivery-reporting:76,88,248) and the operational-insights version is one of the highest-traffic helpers in the perf-gate path.

**Recommendation:** Move `createStatusCounts` to `_shared/status-counts.internal.ts`. While unifying, fix the small inefficiency: each call walks `patterns` four times (one filter per status). One single-pass tally is a measurable win at the perf-gate fixture size:

```ts
export interface StatusCounts {
  completed: number;
  active: number;
  planned: number;
  candidate: number;
  total: number;
}

export function createStatusCounts(patterns: readonly ExtractedPattern[]): StatusCounts {
  let completed = 0,
    active = 0,
    planned = 0,
    candidate = 0;
  for (const p of patterns) {
    if (isPatternComplete(p.status)) completed++;
    else if (isPatternActive(p.status)) active++;
    else if (isPatternPlanned(p.status)) planned++;
    else if (p.status === 'candidate') candidate++;
  }
  return { completed, active, planned, candidate, total: patterns.length };
}
```

#### H-PROJ-5 — Renderer tabular-data helpers duplicated verbatim between `render-markdown.ts` and `render-ui.ts`

`src/renderers/render-markdown.ts:1624-1693` AND `src/renderers/render-ui.ts:602-648`.

Identical `isBlockArray`, `toTabularRows`, `getTabularColumns`. The render-ui version has `isPrimitiveLike`/`isPrimitiveRecord` peers, and render-markdown has its own `isPrimitiveLike` at line 1628. These three helpers plus `humanizeKey` + `isPrimitive` + `stableStringify` form a renderer-agnostic "generic field shaping" kernel.

**Recommendation:** Extract `renderers/_shared/tabular.ts` and `renderers/_shared/primitives.ts`. The renderer-internal-only import boundary is respected because these helpers don't reach into projections or fragments — they only inspect `unknown`/`Block`. Adds ~80 LOC to delete from two of the biggest files in the package.

#### H-PROJ-6 — `filterPatterns` unconditionally allocates when no filter is set

`src/projections/_shared/filter.ts:22-29`. Called 14 times in projection helpers, every call on the perf-gate path:

```ts
export function filterPatterns(patterns, filter): ExtractedPattern[] {
  return filter === undefined ? [...patterns] : patterns.filter(...);
}
```

The `[...patterns]` defensive copy on the no-filter path costs O(n) allocation per call even though the caller never mutates the returned array. With 14 call sites × 36-pattern fixture × multiple projection calls per fragment, this is a measurable allocation hit against the perf-gate `baseline × 1.5` budget (H-CORE-8 sits upstream; this is the projection-side analogue).

**Recommendation:** Return the input array when no filter is set, and let TypeScript readonly-ness enforce immutability:

```ts
export function filterPatterns(
  patterns: readonly ExtractedPattern[],
  filter: ProjectionFilter | undefined,
): readonly ExtractedPattern[] {
  return filter === undefined ? patterns : patterns.filter((p) => filterPattern(p, filter));
}
```

Callers that genuinely need a fresh array (one `.sort(...)` site in pattern-catalog) can spread locally. The current contract returns `ExtractedPattern[]` (mutable) by convention, but no caller actually mutates the result — grep confirms.

#### H-PROJ-7 — Two error styles in the same package (16 raw `Error` vs 9 typed `ProjectionError`)

Typed errors at projection time use `ProjectionError` with a discriminated `ProjectionErrorCode` (`'PATTERN_NOT_FOUND' | 'DECISION_NOT_FOUND' | 'RULE_NOT_FOUND' | …`). 16 raw `Error` throws bypass this and lose the discriminator:

- `src/_internal/slug.ts:5` — `slugForRouteSegment` unreachable input
- `src/routing/route-id.ts:70,119` — `parseLogicalRouteId` / `assertLogicalRouteSegment`
- `src/renderers/render-markdown.ts:258, 373, 438, 1253, 2037` — five raw throws in the markdown renderer
- `src/renderers/render-json.ts:139,146,150,154,158,167` — six JSON-safety throws
- `src/projections/pattern-relations/pattern-catalog.internal.ts:76` — `Parent pattern not found`
- `src/projections/documentation-composition/documentation-type-registry.ts:95` — `Unsupported documentation type`

The pattern-catalog case is the most painful — that exact "pattern not found" condition has a proper `'PATTERN_NOT_FOUND'` code five files away in `_shared/pattern-helpers.internal.ts:92`.

**Recommendation:** Either expand `ProjectionErrorCode` to include `'INVALID_ROUTE_ID'`, `'RENDERER_ROUTING_MISSING'`, `'RENDERER_INVALID_PATH'`, `'RENDERER_INVALID_VALUE'`, etc. and convert all 16 sites; OR introduce a sibling `RendererError` class for renderer-time failures and treat `routing/*` errors as boundary failures (Zod-validated by `LogicalRouteIdSchema`, never thrown). The pattern-catalog raw throw is unambiguously a `PATTERN_NOT_FOUND` and should be converted today.

#### H-PROJ-8 — `render-markdown.ts` is 2,227 lines in one file

The file mixes: render-orchestration (lines 221-356), routing/path resolution (357-499), document normalization for 10 fragment kinds (569-1088), generic-fragment fallback (1090-1224), metadata resolution (1230-1334), block rendering (1733-1903), markdown text/escape (1905-2015), routed-path validation (2030-2115), and oversized-document splitting (2117-2227). Three concerns each are large enough to justify their own files:

1. `routed-paths.ts` — `normalizeRoutedOutputPath` / `isSafeRoutedOutputPath` / `sanitizeMarkdownLinkTarget` / `decodeLinkTargetForClassification` / `containsControlCharacters` + tests. This is the security-critical link-validation layer per the README's "Markdown/content trust boundary" section.
2. `splitting.ts` — `splitOversizedDocument` / `groupByH2` / `shouldSplitFromLineCount`.
3. `normalizers/*.ts` — one file per fragment kind, importing the shared block helpers. The `MARKDOWN_NORMALIZERS` table at line 208 already groups them by kind; the file split is a mechanical extraction.

The `TRUSTED_MARKDOWN` symbol must stay private to the rendering pipeline. Best place is `_shared/trusted-markdown.internal.ts` with the trust-symbol + `trustedMarkdown()` mint helper exported only inside `src/renderers/` — the existing `[trust-boundary:trusted-markdown-firewall]` lint rule already enforces this at AST level.

**Recommendation:** No semantic changes, pure file split. The work is ~1 day. Maintainability + reviewability dividend pays back fast and a separate `routed-paths.ts` is a much better place to grow test coverage for the link-safety code.

### Medium (P2)

#### M-PROJ-1 — `session-context.internal.ts:264` TS-strictness evasion via `as keyof typeof VALID_TRANSITIONS`

```ts
function createFsmContext(status: string | undefined): FsmContext | undefined {
  if (status === undefined || !VALID_PROCESS_STATUS_SET.has(status)) {
    return undefined;
  }
  const processStatus = status as keyof typeof VALID_TRANSITIONS;
  return { ... };
}
```

The `Set.has` does not narrow the type to the key union because `VALID_PROCESS_STATUS_SET` is a `Set<string>`. Same pattern as the architect-core `validateTransition` issue (C-CORE-5). Fix by exporting a type-guarded `isValidProcessStatus(status: string): status is ProcessStatusValue` from architect-core and using it here. This also dissolves the cast in `scope-readiness.internal.ts:164` where `const processStatus = status` is assigned and then keyed against `VALID_TRANSITIONS[processStatus]`.

#### M-PROJ-2 — `requirement-routes.ts:72` casts unvalidated child route key to `LogicalRouteId`

```ts
childRouteIds: Object.fromEntries(
  childRouteKeys.map((routeId) => [routeId, routeId as LogicalRouteId]),
),
```

The `routeId` here is the child key (`packageId`/feature name slug), which is already a logical route ID earlier in the flow — but the type system can't see that. The cast accepts any string. Either thread a `LogicalRouteId[]` type all the way through `createBucketedRequirementDigest` / `createRequirementChildRouteIdForBucket`, or validate at this boundary with `LogicalRouteIdSchema.parse`.

#### M-PROJ-3 — `dependency-tree.internal.ts:113` allocates a fresh `Set` at every recursion frame

```ts
const nextVisited = new Set(visited);
nextVisited.add(name);
```

For a depth-`d` traversal with branching factor `b`, this is O(d × b × n) Set-clone cost. The standard trick is to mutate `visited` before the recursive call and delete after:

```ts
visited.add(name);
const children = childNames.filter(...).map((c) => buildTreeNode(..., visited));
visited.delete(name);
```

This converts the cost to O(1) per frame. Default `maxDepth` is unbounded in `DepTreeOptionsSchema` (`z.number().int()`); pin to a reasonable upper bound.

#### M-PROJ-4 — `BundleRouting` is a hand-written interface parallel to its Zod-validated peers

`src/fragments/base.ts:6-25`. Every other contract in `fragments/**` is `z.infer<typeof XSchema>`. `BundleRouting` is the only structural type that ships _only_ as a TS interface — and there's even a hand-written validator (`isRoutingLike` at lines 64-77) implementing what `z.strictObject(...).safeParse(...)` would do for free. The validator already references `DisclosureSpecSchema.safeParse` and `isLogicalRouteId`, so the Zod machinery is in scope.

**Recommendation:** Define `BundleRoutingSchema` and infer the type. `isRoutingLike`, `isOptionalString`, `isOptionalEntityPathLayout`, `isChildPathStrategy`, `isAnchorStrategy` all collapse into `BundleRoutingSchema.safeParse(value).success`.

#### M-PROJ-5 — `documentation-bundle.internal.ts` ships two parallel option schemas (strict-typed + raw)

```ts
export const ProjectDocumentationBundleOptionsSchema = z.strictObject({
  documentType: z.custom<SupportedDocumentationType>(...),
  disclosureLevel: ProgressiveDisclosureLevelSchema.optional(),
}).readonly();

export const RawProjectDocumentationBundleOptionsSchema = z.strictObject({
  documentType: z.string(),
  disclosureLevel: ProgressiveDisclosureLevelSchema.optional(),
}).readonly();
```

The reason for the split is that `z.custom<SupportedDocumentationType>` references `getDocumentationTypeMetadata`, which triggers the lazy proxy in `documentation-type-registry.ts:138`. Callers that just want option-validation without registry resolution use the raw schema, then `projectDocumentationBundleInternal` does its own `assertSupportedDocumentType`.

This is two-stage validation hidden behind two schemas. Documentation-bundle is also marked "campaign deletion target for W-DOCS-1" so it may resolve itself. Either way, a single schema with `documentType: z.string()` + `assertSupportedDocumentType` at the entrypoint would be one fewer surface to misread.

#### M-PROJ-6 — `pattern-helpers.internal.ts:432-514` and `:274-286` duplicate architect-core utils (CL-CORE-16/17)

Confirmed:

- `findBestMatch` + `scoreMatch` + `levenshteinDistance` at lines 432-514
- `extractFirstSentenceRaw` at lines 274-286

`architect-core/src/utils/fuzzy-match.ts` and `architect-core/src/utils/extract-first-sentence.ts` are the upstream copies (per `architect-core/05-package-report.md` CL-CORE-16/17). When core deletes them per the consolidation plan, change direction: delete the projection-side copies and import the core symbols. Sweep this together with H-CORE-13 (`buildRoleLookup` consolidation) and TC-H-3 (the missing core `fuzzy-match.feature` tests) so the canonical implementation lands with coverage.

#### M-PROJ-7 — `bundle.internal.ts:57-112` resolves the same pattern twice

```ts
requirePattern(context, options.pattern);          // line 57 — validates exists
// ... downstream ...
function buildBundleEntry(...) {
  ...
  const relationships = getRelationshipsForPattern(
    context.graph,
    requirePattern(context, patternName),         // line 112 — same lookup again
  );
}
```

`buildBundleEntry` is also called once per child name plus once for the root, so each child pays the lookup twice. `findPatternByName` does a `Map.get`-equivalent so it's not catastrophic, but on perf-gate scale (36 patterns × bundle traversal) it's wasted work. Hoist the `ExtractedPattern` resolution out of `buildBundleEntry` and pass the pattern in.

#### M-PROJ-8 — `operational-insights/index.ts` is 1,200 lines

The build-helpers (1-714) + 8 projections with JSDoc walls (757-1199) + bucketed-requirement dispatch (945-1067) all live in one file. The bucketed dispatch in particular reads as a small state machine that would be clearer in its own file (`requirement-bucket-router.internal.ts`). The 24 `case 'foo': return hasNonEmptyString(pattern.foo)` lines in `patternSatisfiesTag:378-446` are a data-driven table dressed up as a switch — convert to:

```ts
const SIMPLE_STRING_TAGS = new Map<string, (p: ExtractedPattern) => string | undefined>([
  ['role', (p) => p.role],
  ['arch-context', (p) => p.boundedContext],
  ['arch-layer', (p) => p.adrLayer],
  // ...
]);
function patternSatisfiesTag(context, pattern, tag): boolean {
  const fn = SIMPLE_STRING_TAGS.get(tag);
  if (fn) return hasNonEmptyString(fn(pattern));
  // ... relationship-based tags ...
}
```

#### M-PROJ-9 — `parseAndProject` does not constrain `schema` to a strict object

`src/projections/_shared/parse-and-project.internal.ts:22-37`:

```ts
export function parseAndProject<Options, Output>(
  schema: z.ZodType<Options>,        // ← any Zod schema, including z.object
  ...
)
```

Doctrine requires strict cross-package option schemas (Zod-first, `z.strictObject` only). The constraint should be enforced at the helper signature:

```ts
export function parseAndProject<Options extends z.core.SomeType, Output>(
  schema: z.ZodObject<Options> & { _zod: { def: { catchall: z.ZodNever } } },
  // or simpler — pin via the helper's own runtime check that schema is strict
);
```

Practical Zod 4 typing here is awkward; the simpler safety net is a runtime assertion inside the helper that throws if `schema instanceof z.ZodObject` and `schema._def.catchall` is not `ZodNever`. (Zod 4 internals; pin a small test.)

#### M-PROJ-10 — `documentation-type-registry.ts:138-174` proxy facade is an unusual lazy-load pattern

`createLazyReadonlyArrayFacade` creates a `Proxy` over `target: TValue[] = []` that initializes on first access. The intent (avoid module-load-time work) is reasonable, but:

1. `set()` returning `false` will throw in strict mode TS but silently fail in loose. Worth a `throw new Error('SUPPORTED_DOCUMENTATION_TYPE_REGISTRY is readonly')` to surface accidental mutations.
2. The `as unknown` cast at line 155 (`Reflect.get(currentTarget, property, receiver) as unknown`) bypasses the `Proxy`-handler return type. Use a typed `get<K extends keyof T>` overload signature on the handler.
3. A vanilla `let cached: readonly TValue[] | undefined; export function getRegistry() { ... }` would be 8 lines and equivalent. The proxy lets `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY` look array-shaped to consumers, but consumers could just call `.values()` on a function instead. The proxy is more clever than the use case requires.

### Low (P3)

#### L-PROJ-1 — `architecture-diagram.internal.ts:121` interpolates `pattern.role` into mermaid label without escaping

```ts
const roleSuffix = hasText(pattern.role) ? `<br/>(${pattern.role.trim()})` : '';
```

Mermaid is an intentional raw-content surface per the README ("`code` and `mermaid` block bodies are intentional raw content surfaces"), so this is documented behavior. However, `pattern.role` is annotation-derived input — if it contains a `"` character the resulting `${node.nodeId}["${node.label}"]` line breaks Mermaid syntax. Worth either escaping double-quotes here or pinning a regex on role values at extraction time. Same applies to `pattern.boundedContext` and `pattern.adrLayer` when used as Mermaid subgraph titles (lines 270, 264). Not a security risk in this codebase (no untrusted role values), but a robustness gap.

#### L-PROJ-2 — `project-config.internal.ts:57-58` calls `resolveProjectName` twice

```ts
...(resolveProjectName(context, options.projectName) !== undefined
  ? { projectName: resolveProjectName(context, options.projectName) }
  : {}),
```

```ts
// Cleaner:
const projectName = resolveProjectName(context, options.projectName);
return {
  ...
  ...(projectName !== undefined ? { projectName } : {}),
};
```

#### L-PROJ-3 — `extractDescription` regex falls over for two-sentence descriptions

`src/projections/_shared/pattern-helpers.internal.ts:214-229`. The regex `[.!?](?=\s+[A-Z]|\s*$)` extracts everything before the first sentence terminator. If a description's first sentence ends with `e.g.` or `i.e.` followed by a capitalized word, the regex truncates mid-clause. Architect-core has the same edge case (L-CORE-3). Will be fixed in core; ensure the projection side moves to the core import (M-PROJ-6) so the fix lands here automatically.

#### L-PROJ-4 — `escapePlainMarkdownLine` regex (`render-markdown.ts:1973-1984`) re-creates 6 RegExp objects per line

```ts
function escapePlainMarkdownLine(line: string): string {
  const escapedInline = line.replace(/([\\`*_\[\]()!])/g, '\\$1');
  ...
  return escapedInline
    .replace(/^(\s*)(#{1,6})(?=\s)/, '$1\\$2')
    .replace(/^(\s*)>(?=\s?)/, '$1\\>')
    .replace(/^(\s*)([-+*])(?=\s)/, '$1\\$2')
    .replace(/^(\s*)(\d+)\.(?=\s)/, '$1$2\\.')
    .replace(/^(\s*)(-{3,}|_{3,}|\*{3,})(\s*)$/, '$1\\$2$3');
}
```

JS engines cache literal regexes (V8 since ages), so this is mostly fine, but for hot path on the perf gate, hoisting these as module-level `const` is free defensive perf and clarifies intent. Repeats for `escapePlainMarkdownText`/`escapeHtml`/`escapeTableCell` chain.

#### L-PROJ-5 — `Array.from({ length: rightLength + 1 }, ...)` allocator in Levenshtein

`pattern-helpers.internal.ts:496-497`. Pre-allocating with `new Array(n)` and a `for` loop is ~2× faster than `Array.from({ length })`. The function only runs on `requirePattern` miss (fuzzy suggestion path), so not hot, but if/when the core copy lands (CL-CORE-16) the perf win is worth applying.

#### L-PROJ-6 — `extractFirstSentenceRaw` regex compiled inside the function

`pattern-helpers.internal.ts:279`. `const sentenceEndPattern = /[.!?](?=\s+[A-Z]|\s*$)/;` is rebuilt per call. Hoist or rely on engine caching (per L-PROJ-4 — engines cache).

#### L-PROJ-7 — `render-markdown.ts:1455-1461` ternary chain instead of map lookup

```ts
const heading =
  groupedBy === 'product-area'
    ? 'Product Area Detail'
    : groupedBy === 'feature'
      ? 'Feature Detail'
      : groupedBy === 'package'
        ? 'Package Detail'
        : 'Phase Detail';
```

A `Record<typeof groupedBy, string>` is shorter and exhaustive-by-type.

#### L-PROJ-8 — `routing/route-id.ts:124-126` uses `value !== undefined` in `is string` guard

```ts
function isLogicalRouteSegment(value: string | undefined): value is string {
  return value !== undefined && ROUTE_SEGMENT_PATTERN.test(value);
}
```

Functionally correct. Idiomatically prefer `typeof value === 'string'` since the type input could narrow further. Trivial.

## Sweep patterns

Five recurring shapes are each cheap to fix once and recur many times:

1. **"Helper duplicated within the package."** `getPatternName` (×2), `parseBusinessRuleAnnotations` (×2), `deduplicateScenarioNames` (×2), `createStatusCounts` (×2), `isBlockArray` (×2), `toTabularRows` (×2), `getTabularColumns` (×2), `isPrimitiveLike` (×2). Total: 8 duplications, ~120 LOC of dead repetition. One audit pass + four `_shared/` files.

2. **"Two slugify dialects within projection + one in core."** `slugForFilename` (camelCase-splitting), `governance/governance-shared.internal.ts#slugify` (non-splitting), `architect-core#slugify` (third variant). Pick one canonical, delete the other two. Capture the camelCase-splitting decision in JSDoc on the survivor so future "should I split CamelCase?" debates land at the source.

3. **"Hand-written validator parallel to a Zod schema."** `BundleRouting`/`isRoutingLike`. Same kind of drift architect-core suffered with `PatternGraph` / `PatternGraphSchema`. Pattern: every cross-cutting interface gets `XSchema` next to it and the type flows from `z.infer`. Run the audit across `fragments/base.ts` (the one offender), then enforce via a lint rule that forbids exported `interface` declarations in `fragments/**` and `routing/**`.

4. **"`as KeyType` casts after `Set.has` narrowing."** Two confirmed sites (`session-context.internal.ts:264`, `scope-readiness.internal.ts:164`); same shape as C-CORE-5. The root fix is in architect-core (export `isValidProcessStatus`); the projection-side cleanup is a 6-line sweep.

5. **"Raw `Error` for a condition that has a `ProjectionErrorCode`."** Pattern-catalog "Parent pattern not found" is the clearest; renderer markdown's "missing routing metadata" / "unsafe routed output path" deserve their own discriminated codes since they're regularly-caught error paths in upstream tools.

## What's healthy and worth preserving

- **TRUSTED_MARKDOWN firewall actually works.** The symbol is module-private, the lint rule has 5 AST selectors enforcing it, and nothing in `src/` mentions `TRUSTED_MARKDOWN` outside `render-markdown.ts`. Strong.
- **`renderJson` defensive validation.** Throws on `bigint`/`function`/`symbol`/`Date`/`Map`/`Set`/non-plain-object/`NaN`/`Infinity` with a JSON path in every message. Discrete, exhaustive, fail-loud — the right shape for a serializer.
- **`sanitizeMarkdownLinkTarget` + `normalizeRoutedOutputPath`.** HTML-entity decode → control-character check → protocol-relative reject → scheme allowlist → URL-encode. Defense-in-depth done right; this is the single security-critical chokepoint and it's clearly written.
- **`parseAndProject` + `parseAtBoundary`.** Wires the architect-core boundary helper that core's own surface doesn't use (TD-CORE-1). One unified parse-once-at-the-boundary path across all `parseAndProject*` exports. The projection package is using the core idiom the core package preached and ignored.
- **`FragmentSchema` discriminated union.** All 42 fragment kinds collected into one `z.discriminatedUnion('kind', [...])`. `FragmentByKind<K>` extraction utility is clean.
- **`StrictKindTable<Out, Options, Kinds>`** type at `renderers/_shared/dispatch.ts:20-22`. Forces the markdown renderer's normalizer table to be exhaustive for the kinds it claims to handle while keeping the UI renderer's table partial via `KindTable<Out, Options>`. Excellent compile-time/runtime alignment.
- **Doctrine-correct schema use.** 107 `z.strictObject` callsites, zero `z.object`. Two `.extend()` chains (H-PROJ-1) are the only doctrine slip.
- **`as const satisfies T`** used correctly across `documentation-type-registry.*.ts`, `disclosure-matrix.ts`, `requirement-routes.ts:19`. Idiomatic Zod-4-era TS.
- **`@architect-pattern` annotations on every exported `project*` function.** The pattern-graph extractor sees every projection as a registered pattern; this is exactly what "Architect State is Code" demands. The boilerplate "When to Use" issue (DOC-H-3 in core) recurs here mildly but the deeper structure is right.
- **Single-pass `parseAndProject`-style trust boundary.** Each `parseAndProject*` function is one line, the validation runs once, typed options flow into the projection without re-parsing. Same shape end-to-end across the package.
- **No suppressions.** Zero `@ts-ignore` / `@ts-expect-error` / `eslint-disable` / `void X;` / `TODO` / `FIXME` / `HACK` / `XXX` in `src/`. This is the cleanest such audit across the family per the architect-core report (which has the same record). Keep it.

## Cross-references to architect-core findings

- **CL-CORE-16/17 (duplicated `fuzzy-match`, `extractFirstSentenceRaw`)** — confirmed in place at `_shared/pattern-helpers.internal.ts:432-514` and `:274-286`. Delete after core deletes its copies (CL-CORE-16/17 action plan step 31-37).
- **F4A-H-6 (Zod 4 `.extend()` drops strict)** — confirmed in `pattern-detail.ts:24` and `supporting.ts:54-58`. H-PROJ-1.
- **H-CORE-8 (27× `structuredClone` per `PatternGraphAPI` read)** — projection consumes the read API heavily; perf gate sits downstream. H-PROJ-6 (defensive copy in `filterPatterns`) is the projection-side analogue. Both should land before re-baselining the perf budget (per the cross-package recommendations §4).
- **C-CORE-5 (`validateTransition` casts strings to `ProcessStatusValue`)** — same pattern recurs at `session-context.internal.ts:264` and `scope-readiness.internal.ts:164` (M-PROJ-1). Both projection sites depend on architect-core exporting `isValidProcessStatus` first.
- **TD-CORE-1 (`parseAtBoundary` unused in core)** — projection actually uses it via `parseAndProject` helper. Projection is the consumer that gives the helper its real-world test coverage; sweep 26 of the core action plan lands the trust-boundary use _back_ in core so both sides match.
