# Phase 2b — Performance review (architect-projection)

Scope: campaign-readiness perf of `packages/architect-projection/`. Generic web-perf concerns excluded by scope.

## Top-line verdict

The projection + JSON-render pipeline is **healthy at 8× load and headroom is large**. Today's baseline (40-iter avg from `tests/perf/baselines/business-rule-set.baseline.json`):

- `parseAndProjectBusinessRuleSet` end-to-end project: avg 1.17 ms, p50 0.54 ms (budget 1.5 ms)
- `renderJson` (object): avg 0.44 ms (budget 1 ms)
- `renderJson` (pretty): avg 0.76 ms (budget 5 ms)
- All 7 hot-path projections sit at 0.01–0.22 ms avg against an 8 ms budget
- `graphBuild`: 291 ms p50 against a 2000 ms budget (single dominant cost — but fixed per `docs:all` run, not per doc)

The 36-pattern / 108-rule fixture exercises the projection layer well. **The campaign will not bust these projection budgets even at 5× doc fan-out**, because the projection cost is bounded by graph size (constant), not doc count.

**However**, the gate has a critical coverage gap (M1) — it does not measure `renderMarkdown` of a documentation bundle end-to-end, and the OUTPUT-side splitter (`splitOversizedDocument`) does redundant rendering (H1) that the campaign's larger doc count will multiply. Two genuine fix-before-campaign items, two should-fix-soon items, the rest is monitoring/scaffold guidance.

## Measurements I ran

1. `wc -l` on `render-markdown.ts` → **2152 lines**, with **27 top-level `normalize*` / `render*` functions** (`grep -cE "^function normalize|^function render[A-Z]"`).
2. `JSON.stringify` call sites in `src/**/*.ts`: **5 total** — one in `format-utils.ts:39` (used by `stableStringify`), one in `render-json.ts:59` (the pretty path), one in `render-markdown.ts:1710` (only the "unknown block" diagnostic), and two in places measuring or path-encoding. **No hot-path deep clones via `JSON.parse(JSON.stringify(...))` anywhere.**
3. `findPatternByName` caches via `graph.nameIndex: Map` in core (`packages/architect-core/src/read-api/pattern-helpers.ts:77`); `getCanonicalRelationshipIndex` uses a WeakMap keyed on the graph. **Cross-projection memoization already exists at the core layer.**
4. `filterPatterns(patterns, undefined)` returns `[...patterns]` (`src/projections/_shared/filter.ts:25`) — a full shallow clone on the no-filter path, called 20+ times per `docs:all`.

---

## Findings

### H1 — `addRoutedDocument` renders each output document 2N+1 times when splitting kicks in

**Severity:** High
**File:** `src/renderers/render-markdown.ts:308–325, 447–466, 2054–2103`

`addRoutedDocument` first calls `shouldSplit`, which calls `renderDocument(document, options)` (line 464) purely to count newlines. If the doc trips the budget, `splitOversizedDocument` is invoked — that function calls the `renderFn` callback once per H2 sub-section to count its lines (line 2078), THEN `addRoutedDocument` calls `renderDocument` a final time for the parent (line 320) plus once for every kept sub-file (line 323).

**Estimated impact:** For a single doc that splits into `N` sub-files: `1 (shouldSplit) + N (line 2078 sub-line-count) + 1 (parent) + N (subFiles) = 2N + 2` renders, where ~`N + 1` is the minimum. For a `requirements-executable` bundle with ~10 H2 groups that's ~22 renders vs 11 minimum — **~2× wasted work in the renderer per oversized doc.** The campaign expects more docs to hit size budgets (a 40-doc target with disclosure-driven fan-out), so this scales linearly with the new doc count.

**Why it matters for the campaign:** The doc-gen step is the only doc-count-sensitive part of the pipeline; this is exactly where 5× will land hardest.

**Fix:** Track line counts during the first render and reuse them:

```ts
function addRoutedDocument(entries, basePath, document, options): void {
  const rendered = renderDocument(document, options);
  const lineCount = rendered.split('\n').length;
  if (!shouldSplitFromLineCount(lineCount, basePath, options)) {
    addUniqueEntry(entries, basePath, rendered);
    return;
  }
  // splitOversizedDocument receives pre-rendered groups + line counts;
  // it no longer needs renderFn for measurement.
  const splitResult = splitOversizedDocument(document, options.sizeBudget!, basePath, options);
  addUniqueEntry(entries, basePath, renderDocument(splitResult.parent, options));
  for (const [path, sub] of Object.entries(splitResult.subFiles)) {
    addUniqueEntry(entries, path, renderDocument(sub, options));
  }
}
```

A cheaper alternative: render with a `measureOnly: true` flag returning a precomputed line count without producing the string. Worst-case complexity drops from O(2N+2) to O(N+1).

---

### H2 — Perf gate has zero coverage of `renderMarkdown` + bundle routing + splitter

**Severity:** High
**File:** `tests/features/perf/business-rule-set-report.steps.ts:608–658`, `tests/perf/compare-baseline.mjs:12–28`

The gate measures `parseAndProjectDocumentationBundle({ documentType: 'patterns' })` (line 628–635, "documentationView" hot path) but **never calls `renderMarkdown` on the bundle**. The Markdown renderer is by far the most complex code in the package (2152 LOC, 27 normalizer/renderer functions) and the place where the campaign's per-doc fan-out lands. The "renderObject"/"renderPretty" budgets cover JSON only.

**Estimated impact:** Today, `renderMarkdown` of a bundle is unmeasured. If a future refactor regresses a fragment normalizer (e.g., a quadratic table-width pass) by 10×, the gate will not catch it. Pair this with H1 above (2× rendering wasted on splits) and the campaign's larger doc count amplifies whatever regression slips through.

**Why it matters for the campaign:** The campaign explicitly multiplies the area the gate doesn't cover.

**Fix:** Add `renderMarkdownDocumentationBundle` as a 4th top-level metric in `business-rule-set-report.steps.ts`, with a budget (suggested 15 ms avg for the 36-pattern fixture):

```ts
renderMarkdownBundle: measureProjection(
  context,
  (ctx) => {
    const bundle = parseAndProjectDocumentationBundle(ctx, { documentType: 'patterns' });
    return renderMarkdown(bundle, { routeProfile: defaultMarkdownRouteProfile });
  },
  hotPathIterations
),
// And inside the run loop, measure for at least 3 documentationTypes
// ('patterns', 'requirements-executable', 'roadmap') — the three with the
// most fragment variety. Add same budgets to HOT_PATH_BUDGETS in
// tests/perf/compare-baseline.mjs.
```

Extend to at least 3 representative documentation types so the table-rendering and bundle-children paths are both exercised.

---

### M1 — Documentation-bundle perf gate uses only one document type ('patterns')

**Severity:** Medium
**File:** `tests/features/perf/business-rule-set-report.steps.ts:628–635`

The "documentationView" hot path only exercises `documentType: 'patterns'`. The 12 supported documentation types route through different projection compositions; `requirements-executable`/`traceability`/`taxonomy` each touch different fragment combinations. The campaign will add 6+ new doc types — none will land on the gate by default.

**Estimated impact:** Hidden regression budget. A change that doubles `projectTraceabilityMatrix` time slips by silently.

**Why it matters for the campaign:** Newly-added doc types ship without perf-gate coverage until someone remembers to wire them in.

**Fix:** Parameterise the hot-path table over `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY` and bake per-type budgets. Either:

- Loop the 12 (soon 18+) types and store one budget keyed by document-type, or
- Pick 4 representative types (`patterns`, `requirements-executable`, `roadmap`, `taxonomy`) and assert each.

The second is cheaper and stays representative.

---

### M2 — `filterPatterns(patterns, undefined)` allocates a fresh shallow clone every call

**Severity:** Medium
**File:** `src/projections/_shared/filter.ts:22–28`

```ts
return filter === undefined
  ? [...patterns]
  : patterns.filter((pattern) => filterPattern(pattern, filter));
```

The no-filter branch unconditionally clones. The function is invoked from 20+ projection sites (grep above). For a 36-pattern fixture that's <1 µs each, but at the post-campaign scale (~200+ patterns × ~40 docs × ~3 filter calls per projection) it sums to 24k allocations per `docs:all`.

**Estimated impact:** Negligible today (~1 ms total); a measurable but not gate-busting cost at scale. Mostly a GC-pressure cleanup.

**Why it matters for the campaign:** Won't bust the gate, but compounds with new extractors each adding their own filter calls.

**Fix:** Return the original array on the no-filter path. All call sites treat the result as readonly:

```ts
export function filterPatterns(
  patterns: readonly ExtractedPattern[],
  filter: ProjectionFilter | undefined,
): readonly ExtractedPattern[] {
  return filter === undefined ? patterns : patterns.filter((p) => filterPattern(p, filter));
}
```

(Signature change from `ExtractedPattern[]` → `readonly ExtractedPattern[]` will surface any caller that was mutating — code-quality bonus.)

---

### M3 — Perf baseline last refreshed at the initial multi-package split commit

**Severity:** Medium
**File:** `tests/perf/baselines/business-rule-set.baseline.json`

`git log --oneline -1` on the baseline → `ee58aac chore: initial multi-package layout`. The baseline pre-dates every W1.5 change. The `baseline × 1.5` gate is currently anchored to numbers from the package's first stable state, not the current state.

**Estimated impact:** Hard-budget HARD_BUDGETS (1.5 ms for `project`, etc.) still bound the gate, so silent drift is limited to `1.5×` of the original baseline. But that 1.5× window has been frozen for the entire post-W1.5 development cycle — any optimisations made since don't tighten the gate, and any regressions within 1.5× went uncaught.

**Why it matters for the campaign:** Refreshing the baseline before the campaign starts gives the gate a tighter anchor, so post-campaign regression detection has real signal rather than 50% slack from a year-old baseline.

**Fix:** Run `pnpm --filter @libar-dev/architect-projection test:perf` on a stable build, copy the report → `tests/perf/baselines/business-rule-set.baseline.json`, commit alongside the campaign kickoff. Add a quarterly cadence (or a `scripts/refresh-perf-baseline.mjs` glue) so the baseline doesn't ossify again.

---

### M4 — Documentation-type lookups are O(N) linear scans, called from the renderer hot path

**Severity:** Medium
**File:** `src/projections/documentation-composition/documentation-types.ts:379–385`, `src/renderers/render-markdown.ts:413`

```ts
export function getDocumentationTypeMetadata(key: string) {
  return SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.find((entry) => entry.key === key);
}
```

`renderMarkdown` calls this once per bundle (line 413). With 12 entries today, it's ~12 string compares — negligible. But the campaign roadmap adds 6+ new types and ContentFragment composition may call lookups multiple times per document.

**Estimated impact:** ~0.001 ms today; possibly 0.01 ms with 40 entries × multiple calls per render. Not a gate-buster.

**Why it matters for the campaign:** Cheap to fix now; expensive once the lookup pattern proliferates.

**Fix:** Build a `Map<string, SupportedDocumentationTypeMetadata>` at module load:

```ts
const SUPPORTED_BY_KEY = new Map(SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((e) => [e.key, e]));
export function getDocumentationTypeMetadata(key: string) {
  return SUPPORTED_BY_KEY.get(key);
}
```

Same for `DROPPED_DOCUMENTATION_TYPE_REGISTRY`. Bonus: removes the need to filter `'dropped'` entries at lookup time once they're deleted per H2 in Phase 1.

---

### M5 — `splitOversizedDocument` size budget is a line count, not a byte count

**Severity:** Medium
**File:** `src/renderers/render-markdown.ts:447–466`, `2054–2103`

The split decision is `rendered.split('\n').length > options.sizeBudget`. Tables, mermaid blocks, and code fences emit many lines per "thing" — meaning the policy is line-skewed, not content-skewed. More importantly, the `split('\n')` builds another full array of strings just to count them.

**Estimated impact:** Minor allocation overhead per oversized doc (one array of `lineCount` strings, discarded). Combined with H1 (2N+2 renders), the wasted `split` arrays add up — but only on the hot oversized path.

**Why it matters for the campaign:** Same hot path as H1; both fix-together.

**Fix:** Count newlines without allocating:

```ts
function countLines(s: string): number {
  let n = 1;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}
```

Folds naturally into the H1 fix (return `{ rendered, lineCount }` from a single helper).

---

### L1 — `stableStringify` deep-clones values before stringifying

**Severity:** Low
**File:** `src/_internal/format-utils.ts:22–40`, used at `render-markdown.ts:1106, 1115`

`stableStringify` builds a full deep-sorted clone via `sortValue` (which allocates new arrays/objects at every level), then `JSON.stringify`s. Called only from `normalizeGenericFragment` for unknown-shape values landing in fragments. Today's reachable cases are small (config dumps, debug blocks).

**Estimated impact:** Negligible today; warrants attention only if ContentFragments start emitting larger arbitrary-shape payloads.

**Why it matters for the campaign:** Worth a watch-item — if ContentFragments emit large embedded JSON blobs via the generic fragment path, this allocates 2× the embedded size.

**Fix (only if measured):** Use a `replacer` function on `JSON.stringify` that sorts keys at serialization time — single pass, no intermediate clone:

```ts
export function stableStringify(value: unknown, indent?: number): string {
  return JSON.stringify(value, (_, v) => (isPlainObject(v) ? sortKeys(v) : v), indent);
}
```

Defer until profiled.

---

### L2 — `isBundle` runs a regex on every child route ID + a full `Object.values` walk

**Severity:** Low
**File:** `src/fragments/base.ts:21–39, 71–76`

`isBundle` is the runtime discriminator between `Fragment` and `ProjectionBundle<Fragment>`. It walks every child fragment, validates routing if present (regex-test each route ID). Today the perf gate reports p50 ~2.6 µs per call — well under the 50 µs budget. But it's called twice per doc-gen (once by `renderMarkdown`, once by `renderJson`) and the regex `/^([A-Za-z0-9][A-Za-z0-9_-]*)(:([A-Za-z0-9][A-Za-z0-9_-]*)){1,3}$/u` is not cheap.

**Estimated impact:** Below noise today. Will scale linearly with `children.length`; ContentFragment composition may grow children.

**Why it matters for the campaign:** Monitoring item only. If `isBundle` p50 starts approaching 25 µs (50% of budget) after the campaign lands, switch to a sentinel:

```ts
const BUNDLE_TAG = Symbol.for('@libar-dev/architect-projection/bundle');
// projectSingle and friends set bundle[BUNDLE_TAG] = true
// isBundle becomes: typeof value === 'object' && value !== null && BUNDLE_TAG in value
```

Defer.

---

### L3 — `JSON.stringify` deep-walks the entire serialised tree twice in the pretty path

**Severity:** Low
**File:** `src/renderers/render-json.ts:53–60`

```ts
const payload = isBundle(input)
  ? serializeBundle(input, opts)
  : serializeFragment(input, opts, '$');
return resolvedOptions.pretty ? JSON.stringify(payload, null, 2) : payload;
```

The `serialize*` helpers walk the input tree and produce a plain-object copy (which the gate measures at 0.44 ms avg, "renderObject"). The pretty path then `JSON.stringify`s that copy — that's a second full walk, taking the avg to 0.76 ms.

**Estimated impact:** The current 0.32 ms delta between renderObject and renderPretty is the second walk. Not a hot path; well under the 5 ms budget.

**Why it matters for the campaign:** Informational only. Worth recording as the largest avoidable cost in the JSON renderer if pretty becomes a default at scale.

**Fix (only if pretty becomes hot):** Stream stringify during the first walk (small custom serializer), or accept the doubled cost.

---

### L4 — Stable key ordering allocates a fresh sorted array for every object during JSON serialization

**Severity:** Low
**File:** `src/renderers/render-json.ts:178, 189–194`

`transformObject` calls `orderEntries(Object.entries(value), stableKeyOrder)` per object. `orderEntries` always materialises `[...entries].sort(...)` even when the input is already in stable order (which it typically is — fragment objects have fixed key order from their Zod schemas).

**Estimated impact:** ~0 cost today (gate baseline is 0.44 ms for full JSON serialization). Compounds linearly with bundle size.

**Why it matters for the campaign:** Monitoring item; gate covers it.

**Fix (only if profile shows it):** Skip the sort when the input is already sorted (single linear check). Or accept it as part of stability-by-design.

---

### L5 — `renderBlock` `default` branch JSON-stringifies the block for the diagnostic comment

**Severity:** Low
**File:** `src/renderers/render-markdown.ts:1710`

```ts
return [`<!-- Unknown block type: ${JSON.stringify(block)} -->`, ''];
```

If a future `BlockSchema` extension lands without a corresponding `renderBlock` arm, the fallback `JSON.stringify`s the whole block — which could be a 100KB nested object — every render. Today's discriminated-union shape makes this unreachable, but if ContentFragments emit a block kind that's added to the schema but not the renderer, doc generation will silently embed huge HTML comments.

**Estimated impact:** Currently unreachable. If triggered: potentially several MB of HTML comments per doc.

**Why it matters for the campaign:** ContentFragment work will add block types; the asymmetric add (schema-only) becomes a real risk.

**Fix:** Throw instead of producing a diagnostic comment that's silently shipped to disk:

```ts
default: {
  const exhaustive: never = block;
  throw new Error(`renderBlock: unhandled block kind: ${(exhaustive as { type: string }).type}`);
}
```

`never`-exhaustiveness check makes this a compile-time error when a new block type is added without a render arm — better than runtime silent megabyte comments.

---

## Summary for parent agent

The projection pipeline is structurally healthy and will not bust the perf gate on projection time alone. The two real campaign-relevant items are:

1. **H1 — `addRoutedDocument` does 2N+2 renders when documents split** — fixing this halves rendering work on the exact path the campaign will multiply.
2. **H2 — perf gate has no `renderMarkdown` coverage** — the 2152-LOC renderer is unmonitored; the campaign lands there. Add a bundle-Markdown metric before W-DOCS-1.

Two MediumPlus follow-ups: refresh the stale baseline (M3) and parameterise the gate over more documentation types (M1). Everything else is informational scaffolding for post-campaign tuning.

**Will the campaign bust the perf gate?** No — projection cost is graph-size-bounded, not doc-count-bounded. But the gate doesn't measure the multiplied path. Fix H1 + H2 and the campaign's 5× fan-out will be observable and bounded; skip them and any renderer regression introduced during the campaign goes undetected.
