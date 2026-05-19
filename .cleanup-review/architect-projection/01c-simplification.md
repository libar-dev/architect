# `@libar-dev/architect-projection` — Simplification Report (Review-Only)

Scope: `packages/architect-projection/src/**` (146 TS files, ~15.3k LOC).
Mode: read-only. No source modifications were made.

All opportunities below are **behavior-preserving**. The package has a CI perf
gate (`test:perf` baseline × 1.5) — items flagged "perf-relevant" reduce
allocation or eliminate redundant work on a hot path; the rest are pure
readability / DRY wins.

---

## High impact

### H1. Add a single `definedOnly` helper to kill the 80+ conditional-spread sites

**Impact:** High (cross-cutting). 80 occurrences of
`...(x !== undefined ? { x } : {})` (and the variant
`...(opt.k !== undefined ? { k: opt.k } : {})`) appear across renderers,
projections, fragment builders, and routing. This is the package's single
loudest cosmetic smell and the same theme called out as a major issue in
architect-core. There is no helper today — `shared/plain-object.ts` only
exposes `isPlainObject`.

**Evidence (sample, not exhaustive):**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/renderers/render-markdown.ts:509-518` (resolveOptions), `:557-558`, `:1101-1103`, `:1172-1173`, `:1217-1218`, `:1933`, `:2172-2173`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/pattern-detail.ts:67-71`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/pattern-catalog.internal.ts:52-58`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/dependency-tree.internal.ts:105-106`, `:125-126`, `:163-164`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/bundle.internal.ts:84-95`, `:122-127`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/open-question-list.internal.ts:55`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/governance/business-rules.internal.ts:140-151`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:87-88`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:111`, `:132`, `:147-148`, `:163-164`, `:179-182`, `:191-192`, `:262`

**Current pattern (`pattern-detail.ts:67-71`):**
```ts
const detail: PatternDetail = {
  ...summary,
  kind: 'PatternDetail',
  ...(description !== '' ? { description } : {}),
  ...(openQuestions.length > 0 ? { openQuestions } : {}),
  deliverables,
  relationships: normalizePatternRelationships(context, summary.patternName),
  ...(hierarchy !== undefined ? { hierarchy } : {}),
  rules: normalizeRules(pattern),
  stubs: resolveStubRefs(context, summary.patternName),
  deliverableManifest: { pattern: summary.patternName, items: deliverables },
};
```

**Simplified pattern:** Add one helper in `shared/plain-object.ts`:
```ts
export function definedOnly<T extends Record<string, unknown>>(record: T): {
  [K in keyof T]: Exclude<T[K], undefined>;
} {
  const out: Record<string, unknown> = {};
  for (const key in record) {
    const value = record[key];
    if (value !== undefined) out[key] = value;
  }
  return out as { [K in keyof T]: Exclude<T[K], undefined> };
}
```
Then `pattern-detail.ts` becomes:
```ts
const detail: PatternDetail = definedOnly({
  ...summary,
  kind: 'PatternDetail',
  description: description !== '' ? description : undefined,
  openQuestions: openQuestions.length > 0 ? openQuestions : undefined,
  deliverables,
  relationships: normalizePatternRelationships(context, summary.patternName),
  hierarchy,
  rules: normalizeRules(pattern),
  stubs: resolveStubRefs(context, summary.patternName),
  deliverableManifest: { pattern: summary.patternName, items: deliverables },
});
```

**Behavior-preservation:** Identical: properties whose computed values are
`undefined` are not enumerable on the result. Compatible with
`exactOptionalPropertyTypes: true`. Empty arrays and empty strings stay
explicit at the call site, keeping each predicate visible.

**Verification:** `pnpm typecheck && pnpm test --filter=@libar-dev/architect-projection && pnpm --filter @libar-dev/architect-projection test:perf` (perf-relevant — replaces 80 `{}` allocations per fragment built).

---

### H2. `parseBusinessRuleAnnotations` and `deduplicateScenarioNames` are duplicated verbatim

**Impact:** High. Two parallel implementations of the same business-rule
annotation parser exist. They share the same regex shape, the same return
contract, the same edge cases.

**Evidence:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:349-400` (`parseBusinessRuleAnnotations`, private)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/governance/business-rules.internal.ts:535-577` (`parseBusinessRuleAnnotations`, private)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:402-425` (`deduplicateScenarioNames`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/governance/business-rules.internal.ts:579-601` (`deduplicateScenarioNames`, identical body)

**Simplified pattern:** Export the canonical pair from `_shared/pattern-helpers.internal.ts` (or a new
`_shared/rule-annotations.internal.ts`); delete the governance copies and
import. The governance copy reuses `normalizeLineEndings` before matching,
which the `_shared` copy omits — pick one (lineEndings normalization is the
safer default and only adds a single `.replace(/\r\n/g, '\n')`).

**Behavior-preservation:** Bring `normalizeLineEndings` into the shared
implementation; matchers are otherwise identical (same regex, same scopes,
same field merging order). Test suite is the certifier.

**Verification:** `pnpm test --filter=@libar-dev/architect-projection`; existing
governance + pattern-relations snapshots cover both paths.

---

### H3. `getPatternName` and `normalizeAnnotationText` duplicated across `_shared` and `governance-shared`

**Impact:** High (cross-cutting). The base of the import graph repeats the
same lookup, opening the door for divergence.

**Evidence:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:77-79` and `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/governance/governance-shared.internal.ts:33-35` define `getPatternName` with identical bodies.
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:340-347` (private) and `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/governance/governance-shared.internal.ts:41-48` (exported) define `normalizeAnnotationText` with identical bodies.

**Simplified pattern:** Re-export `getPatternName` from
`_shared/pattern-helpers.internal.ts` in `governance-shared.internal.ts`
(or simply update governance callers to import from `_shared`). Same for
`normalizeAnnotationText` — promote the `_shared` private copy to exported,
or import from `governance-shared`.

**Behavior-preservation:** Single function, identical behaviour. Drops two
shadow definitions.

**Verification:** `pnpm typecheck` + full test run.

---

### H4. Collapse the 12-fold `createScopeReadinessCheck({ checkId, label, ... })` duplication

**Impact:** High (readability + DRY). Every `buildXxxCheck` function in
`scope-readiness.internal.ts` repeats `checkId` and `label` 2-3 times across
its branches. The label and id are constants of the check.

**Evidence:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/execution-context/scope-readiness.internal.ts:69-298`
- `buildDependenciesCompletedCheck` repeats `checkId: 'dependencies-completed'` and `label: 'Dependencies completed'` three times (lines 78-79, 100-101, 109-110). Same for `buildDeliverablesDefinedCheck`, `buildFsmAllowsTransitionCheck` (4 branches), `buildDesignDecisionsRecordedCheck`, `buildExecutableSpecsSetCheck` (3 branches), `buildDependencyStubCheck` (3 branches).

**Current pattern:**
```ts
function buildDeliverablesDefinedCheck(pattern: ExtractedPattern): ScopeReadinessCheck {
  const deliverables = normalizeDeliverables(pattern);
  if (deliverables.length > 0) {
    return createScopeReadinessCheck({
      checkId: 'deliverables-defined',
      label: 'Deliverables defined',
      severity: 'info',
      passed: true,
      details: `${String(deliverables.length)} deliverable(s) found`,
    });
  }
  return createScopeReadinessCheck({
    checkId: 'deliverables-defined',
    label: 'Deliverables defined',
    severity: 'error',
    passed: false,
    details: 'No deliverables found in Background table',
  });
}
```

**Simplified pattern:** Curry the identity:
```ts
function checkBuilder(checkId: string, label: string) {
  return (severity: ScopeReadinessCheck['severity'], passed: boolean, details: string)
    : ScopeReadinessCheck => ({ kind: 'ScopeReadinessCheck', checkId, label, severity, passed, details });
}

function buildDeliverablesDefinedCheck(pattern: ExtractedPattern): ScopeReadinessCheck {
  const make = checkBuilder('deliverables-defined', 'Deliverables defined');
  const deliverables = normalizeDeliverables(pattern);
  return deliverables.length > 0
    ? make('info', true, `${String(deliverables.length)} deliverable(s) found`)
    : make('error', false, 'No deliverables found in Background table');
}
```

**Behavior-preservation:** Same checkId / label / severity / passed / details
mapping; only the construction-site duplication is removed.

**Verification:** `pnpm test --filter=@libar-dev/architect-projection` —
scope-readiness fragment has snapshot coverage; identical output expected.

---

### H5. `buildTreeNode` (dependency-tree) repeats the same six-field literal three times

**Impact:** High. Three return statements in one 80-line function build the
same `DependencyTreeNode` shape with identical `status`/`phase` conditional
spreads. Differs only in `truncated` and `children`.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/dependency-tree.internal.ts:90-169`. Look at lines 102-111, 123-130, 161-168 — the same `name + status + phase + isFocal` core repeated.

**Simplified pattern:** Lift a single `makeNode` factory:
```ts
const makeNode = (
  truncated: boolean,
  children: DependencyTreeNode[],
): DependencyTreeNode => ({
  name,
  ...(pattern?.status !== undefined ? { status: pattern.status } : {}),
  ...(pattern?.phase !== undefined ? { phase: pattern.phase } : {}),
  isFocal,
  truncated,
  children,
});

if (visited.has(name)) return makeNode(false, []);
if (depth >= maxDepth) return makeNode(hasChildren, []);
return makeNode(false, recursedChildren);
```
Or, paired with H1, use `definedOnly(...)` directly.

**Behavior-preservation:** Same output structure; same field ordering does
not matter for JSON / snapshot.

**Verification:** Same dependency-tree snapshot fixtures.

---

## Medium impact

### M1. `documentation-bundle.internal.ts` calls `getDocumentationDefinition` twice and contains an unreachable branch

**Impact:** Medium (perf-relevant, defensive). `assertSupportedDocumentType`
already calls `getDocumentationDefinition` and throws if absent. Then
`projectDocumentationBundleInternal` calls it AGAIN and checks for
`undefined` — that branch is unreachable.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:59-71`

**Current pattern:**
```ts
const documentType = assertSupportedDocumentType(options.documentType);
const definition = getDocumentationDefinition(documentType);

if (definition === undefined) {
  throw new ProjectionError('UNKNOWN_DOCUMENT_TYPE', ...); // unreachable
}
```

**Simplified pattern:** Make `assertSupportedDocumentType` return the
definition (it already has it):
```ts
export function requireDocumentationDefinition(documentType: string): DocumentationDefinition {
  const definition = getDocumentationDefinition(documentType);
  if (definition !== undefined) return definition;
  throw new ProjectionError('UNKNOWN_DOCUMENT_TYPE', ...);
}
// caller:
const definition = requireDocumentationDefinition(options.documentType);
```

**Behavior-preservation:** Same error path, same error code, same message.
One fewer lookup per documentation bundle build.

**Verification:** `pnpm typecheck && pnpm test`; documentation-bundle has
tests.

---

### M2. Nested ternary in `buildTimelineBundle` violates the "no nested ternary" doctrine

**Impact:** Medium. Violates the project's documented preference for
switch / if-else chains over nested ternary.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/delivery-reporting/index.ts:117-122`

**Current pattern:**
```ts
const patterns =
  view === 'roadmap'
    ? [...context.graph.byStatus.roadmap, ...context.graph.byStatus.deferred]
    : view === 'milestones'
      ? context.graph.byNormalizedStatus.completed
      : context.graph.byNormalizedStatus.active;
```

**Simplified pattern:**
```ts
function selectTimelinePatterns(graph: PatternGraph, view: RoadmapTimeline['view']): readonly ExtractedPattern[] {
  switch (view) {
    case 'roadmap':    return [...graph.byStatus.roadmap, ...graph.byStatus.deferred];
    case 'milestones': return graph.byNormalizedStatus.completed;
    case 'active':     return graph.byNormalizedStatus.active;
  }
}
```
Exhaustive switch surfaces a missing branch at typecheck time; today the `:` fallback hides it.

**Behavior-preservation:** Same fan-out, same arrays; exhaustiveness checked
by the type system rather than by the implicit default.

**Verification:** `pnpm typecheck && pnpm test`.

---

### M3. `buildTagUsageMatrix` — collapse 9 `if (pattern.X !== undefined)` arms into a tag-spec table

**Impact:** Medium (readability). Nine identical conditional `incrementTagUsage` calls in one loop.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/operational-insights/index.ts:231-242`

**Simplified pattern:**
```ts
const TAG_SOURCES: readonly { readonly tag: string; readonly read: (p: ExtractedPattern) => string | undefined }[] = [
  { tag: 'status',       read: (p) => p.status },
  { tag: 'role',         read: (p) => p.role },
  { tag: 'arch-context', read: (p) => p.boundedContext },
  { tag: 'arch-layer',   read: (p) => p.adrLayer },
  { tag: 'phase',        read: (p) => p.phase === undefined ? undefined : String(p.phase) },
  { tag: 'priority',     read: (p) => p.priority },
  { tag: 'quarter',      read: (p) => p.quarter },
  { tag: 'team',         read: (p) => p.team },
  { tag: 'effort',       read: (p) => p.effort },
];

for (const pattern of patterns) {
  for (const { tag, read } of TAG_SOURCES) {
    const value = read(pattern);
    if (value !== undefined) incrementTagUsage(tagMap, tag, value);
  }
}
```

**Behavior-preservation:** Same tag/value pairs land in `tagMap`. `status`
keeps being unconditional (never `undefined`). Phase keeps `String()`
coercion.

**Verification:** `pnpm test`; `TagUsageMatrix` has snapshot tests.

---

### M4. `patternSatisfiesTag` (operational-insights) — 26-arm switch can be a Map

**Impact:** Medium (readability, perf-neutral). The switch is one of the
hottest loops during coverage build (called per file × per required tag).
Most arms read a single string field and call `hasNonEmptyString`.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/operational-insights/index.ts:378-446`

**Simplified pattern:** Split the table-driven cases from the relationship cases:
```ts
const SIMPLE_STRING_FIELDS: ReadonlyMap<string, keyof ExtractedPattern> = new Map([
  ['role', 'role'], ['arch-context', 'boundedContext'], ['arch-layer', 'adrLayer'],
  ['layer', 'adrLayer'], ['priority', 'priority'], ['quarter', 'quarter'],
  ['team', 'team'], ['effort', 'effort'], ['effort-actual', 'effortActual'],
  ['product-area', 'productArea'], ['user-role', 'userRole'],
  ['business-value', 'businessValue'], ['workflow', 'workflow'], ['risk', 'risk'],
  ['release', 'release'], ['completed', 'completed'], ['target-path', 'targetPath'],
  ['since', 'since'],
]);
// fall back to switch only for status / phase / depends-on / enables / uses / used-by / implements / see-also / api-ref / default.
```
Cuts ~30 lines and makes "is this tag covered?" a single Map lookup.

**Behavior-preservation:** Same boolean per (pattern, tag); identical
`hasNonEmptyString` semantics.

**Verification:** `pnpm test`; `AnnotationCoverage` is snapshot-covered.

---

### M5. Duplicate `deriveLocationPattern` call per inventory entry

**Impact:** Medium (perf-relevant). `deriveLocationPattern(files)` is called
twice on the same files for each `SourceInventoryEntry` in order to drive
the conditional spread.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/operational-insights/index.ts:278-280`

**Current pattern:**
```ts
return {
  kind: 'SourceInventoryEntry',
  type,
  count: files.length,
  ...(deriveLocationPattern(files) !== ''
    ? { locationPattern: deriveLocationPattern(files) }
    : {}),
  files,
};
```

**Simplified pattern (uses H1):**
```ts
const locationPattern = deriveLocationPattern(files);
return definedOnly({
  kind: 'SourceInventoryEntry',
  type,
  count: files.length,
  locationPattern: locationPattern !== '' ? locationPattern : undefined,
  files,
});
```

**Behavior-preservation:** Pure function; one call instead of two.

**Verification:** `pnpm test:perf` (hot path of `arch coverage`); snapshot
should be identical.

---

### M6. `buildScenarioDigests` / `summarizeTokenEstimates` could be tail-call inlines

**Impact:** Medium (readability). `summarizeTokenEstimates` is one reduce
over a `chars` field; `estimateValue` then re-runs `finalizeTokenEstimate`.
This trio could collapse into a single private builder, but the bigger
opportunity in this file is the `getBlockValue` switch ladder being a
parallel structure to `PatternBundleBlocks`.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/bundle.internal.ts:158-199`

**Simplified pattern:** Inline `summarizeTokenEstimates` into the single
caller (line 75-79):
```ts
if (estimateTokens) {
  const chars = [root.tokenEstimate, ...Object.values(children).map((e) => e.tokenEstimate)]
    .reduce((sum, est) => sum + (est?.chars ?? 0), 0);
  root.bundleTokenEstimate = { method: 'char/4', chars, tokens: Math.ceil(chars / 4) };
}
```
And turn `getBlockValue` into a typed default-by-kind table (or keep the
switch but document the exhaustiveness).

**Behavior-preservation:** Same numbers, same shape.

**Verification:** `pnpm test`; bundle has token-estimate snapshots.

---

### M7. `extractDescription` / `extractOpenQuestions` regexes duplicate `BUSINESS_RULE_ANNOTATION_PATTERN` family

**Impact:** Medium. Three nearly identical "look for `**Label:**` markdown
blocks" regexes live in two files (`pattern-helpers.internal.ts` lines
219-220, 236; `business-rules.internal.ts` line 86).

**Evidence:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:219-220` (`**Problem:**` / `**Solution:**`)
- `:236` (`**Open Questions:**`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/governance/business-rules.internal.ts:85-86` (`**Invariant|Rationale|Verified by:**`)

**Simplified pattern:** A single generic helper:
```ts
function* iterateLabeledBlocks(text: string, labels: readonly string[]): Iterable<{ label: string; body: string }> {
  const alternation = labels.map(escapeRegExp).join('|');
  const re = new RegExp(`\\*\\*(${alternation}):\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\*[A-Za-z][^*]*:\\*\\*|$)`, 'gi');
  for (const m of normalizeLineEndings(text).matchAll(re)) {
    if (m[1] && m[2] !== undefined) yield { label: m[1], body: m[2] };
  }
}
```

**Behavior-preservation:** Same matches if labels are equivalent; the only
nuance is that `extractDescription` cares about ordering Problem→Solution,
which the iterator preserves.

**Verification:** `pnpm test --filter=@libar-dev/architect-projection`.

---

### M8. `When to Use` heading is JSDoc boilerplate on 67 files

**Impact:** Medium (signal-to-noise). 67 files carry a `### When to Use`
heading whose body restates the pattern docstring's title in a different
voice. The project ships `test:jsdoc-boilerplate-audit` — this is exactly
the doctrine target.

**Evidence:** `find packages/architect-projection/src -name '*.ts' | xargs grep -l '### When to Use'` → 67 hits. Examples:
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/pattern-summary.ts:29-32`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/architecture-neighborhood.ts:33-35`

**Simplified pattern:** Delete `### When to Use` sections where the content
is a one-liner restatement of `## <Pattern> projection` heading text. Keep
the section only when it adds load-bearing routing guidance.

**Behavior-preservation:** Pure comment removal. No runtime impact.

**Verification:** Re-run `pnpm --filter @libar-dev/architect-projection test:jsdoc-boilerplate-audit`.

---

### M9. Per-file `@architect-bounded-context:` JSDoc duplicated in pairs

**Impact:** Medium. Every `.internal.ts` file leads with a 1-line JSDoc
`@architect-bounded-context:<subdomain>` block, followed by a second
single-line JSDoc describing what the file does. Two JSDoc blocks where
one merged one would do.

**Evidence (sample):**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/dependency-tree.internal.ts:1-6` (two adjacent JSDoc blocks)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/execution-context/handoff.internal.ts:1-6` (same)
- Repeated in ~25 `.internal.ts` files.

**Simplified pattern:** One JSDoc block per file:
```ts
/**
 * @architect-bounded-context:pattern-relations
 *
 * Builds a rooted dependency tree for one pattern with the configured depth
 * and traversal rules.
 */
```

**Behavior-preservation:** None — comment merge only.

---

## Low impact

### L1. Thin public `<X>.ts` / private `<X>.internal.ts` split

**Impact:** Low (architectural taste — opt-in). Every projection in the
`projections/` tree ships as a 30-50-line public wrapper that does
nothing but `projectSingle(buildX(...))` and re-export the option schema
+ type. The pattern is consistent (a real virtue), but it doubles file
count for negligible API hygiene gain, since the only thing the public
file adds is `projectSingle(...)` plumbing.

**Evidence:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/pattern-catalog.ts` (62 lines, half re-exports)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/architecture-neighborhood.ts` (52 lines)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/open-question-list.ts` (41 lines)
- 19 more sibling pairs in `projections/`.

**Simplified pattern:** Two options, in order of preference:
1. **Inline** the public `.ts` wrappers into a single domain-level
   `projections/<domain>/index.ts` (matches `delivery-reporting/index.ts` and
   `operational-insights/index.ts` which already shipped that way). The
   `barrel-audit` script keeps the public surface honest.
2. If sibling files must stay, drop the `.internal.ts` suffix — `tsconfig`
   `verbatimModuleSyntax` already prevents accidental re-export of
   non-public types, and `package.json#exports` already restricts the
   public surface.

**Behavior-preservation:** Pure reorganization. ADR-005 (Codec / Renderer
Separation) and ADR-009 (Projection Trust Boundary) are about what crosses
the boundary, not where files live.

**Verification:** `pnpm --filter @libar-dev/architect-projection test:barrel-audit && pnpm test`. Defer to maintainers — this is a stylistic move and may collide with downstream tooling that targets `.internal.ts`.

---

### L2. `getBlockValue` switch could exit through a typed default Map

**Impact:** Low. The switch in `bundle.internal.ts:166-179` does five
non-discriminated string → fallback lookups. A typed default record makes
the parallel-with-`PatternBundleBlocks` explicit and lets `exhaustiveCheck`
police future `BundleInclude` additions.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/bundle.internal.ts:166-179`

**Simplified pattern:**
```ts
const DEFAULTS: { readonly [K in BundleInclude]: unknown } = {
  docstring: '', rules: [], scenarios: [], deps: {}, 'open-questions': [],
};
function getBlockValue(blocks: PatternBundleBlocks, include: BundleInclude): unknown {
  return (blocks[INCLUDE_TO_FIELD[include]] ?? DEFAULTS[include]) as unknown;
}
```

**Behavior-preservation:** Same defaults, same lookups.

---

### L3. Promote `extractFirstSentenceRaw` to exported helper or inline once

**Impact:** Low. Three call sites in one file (`pattern-helpers.internal.ts`
lines 223, 224, 228) for a 14-line helper. Fine as-is.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:274-286` (`extractFirstSentenceRaw`).

**Simplified pattern:** No action required; flagged because the name
`extractFirstSentenceRaw` reads as the public name and `extractDescription`
reads as the helper. Consider swapping names so the canonical entry is
`extractFirstSentence`.

---

### L4. `findDependencyTreeRoot` infinite-`for` could be a clearer loop

**Impact:** Low. `for (;;)` with a body that conditionally breaks reads
cleverer than a `while (true)` loop and obscures the loop guard. Pure
naming/clarity.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/dependency-tree.internal.ts:63`

---

### L5. Redundant comment in `countLines`

**Impact:** Low. Doctrine says: only WHY comments earn their keep. The
3-line comment explaining `s.split('\n').length` semantics in `countLines`
is mostly a WHAT comment.

**Evidence:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/renderers/render-markdown.ts:496-505`

**Simplified pattern:** Reduce to one line that states the contract:
```ts
// Returns split('\n').length without the intermediate array. '' counts as 1 line.
```

---

## Cross-cutting simplification themes

1. **Conditional-spread sprawl (H1, M5, M6, M8).** A single
   `definedOnly(record)` helper in `shared/plain-object.ts` retires 80
   `...(x !== undefined ? { x } : {})` instances, reduces per-render `{}`
   allocations on hot paths, and unifies how `exactOptionalPropertyTypes`
   contracts are produced. Highest-value single-line change in the package.
2. **Shared helpers re-implemented per subdomain (H2, H3, M7).**
   `parseBusinessRuleAnnotations`, `deduplicateScenarioNames`,
   `getPatternName`, `normalizeAnnotationText` each have two parallel
   definitions. Consolidate in `_shared/pattern-helpers.internal.ts`;
   subdomain shared files (`governance-shared.internal.ts`,
   `execution-context-shared.internal.ts`) become thin re-exporters or
   disappear.
3. **Constant-identity repetition in builder branches (H4, H5).** Pattern
   surfaces a "factory per check id" / "factory per node shape" curry that
   eliminates the literal-string repetition without introducing a new
   abstraction layer.
4. **Defensive re-checks against types the boundary already proved (M1).**
   `assertSupportedDocumentType` followed by `getDocumentationDefinition` +
   `undefined` check is the prototype. Trust the boundary; return the
   value from the asserting function.
5. **Comment / JSDoc bloat (M8, M9, L5).** 67 `### When to Use` headings,
   ~25 double-block `@architect-bounded-context` JSDoc pairs, and one
   countLines WHAT-comment. The package already runs
   `test:jsdoc-boilerplate-audit` — tighten its rules and let it sweep.
6. **Public wrapper / `.internal.ts` sibling sprawl (L1).** Twenty
   `projections/<domain>/<x>.ts` files exist purely to wrap a
   `<x>.internal.ts` build function in `projectSingle(...)`. Some
   subdomains (`delivery-reporting/index.ts`,
   `operational-insights/index.ts`) already chose the consolidated layout;
   the package would read more uniformly if the rest followed.
7. **Doctrine cross-check.** None of the simplifications above touches an
   ADR invariant — ADR-005 (codec/renderer separation), ADR-006 (single
   read model), ADR-009 (trust boundary). The trust boundary continues to
   live at `parseAndProject*`; the helpers being deduplicated all run on
   already-validated `ExtractedPattern` and `BusinessRule` shapes.

---

Total: 5 High, 9 Medium, 5 Low (19 entries). Behavior-preserving across the
board. H1 alone retires ~80 sites and is the recommended starting point.
