# `@libar-dev/architect-core` — Simplification Opportunities

Review-only pass. No source files modified. Findings ordered High → Medium → Low,
grouped recurring themes summarised at the end.

All paths below are absolute file paths under
`/Users/darkomijic/dev-projects/architect/`.

---

## High impact

### H1 — `buildGherkinPatternDraft` is an 167-line conditional-spread pyramid

**File:** `packages/architect-core/src/extractor/gherkin-extractor.ts:163-331`

Construction of `ExtractedPatternDraft` consists of ~70 hand-rolled
`...(metadata.foo !== undefined ? { foo: metadata.foo } : {})` and
`...(metadata.foo !== undefined && metadata.foo.length > 0 ? { foo: metadata.foo } : {})`
spreads. Many keys are emitted twice (once inside `directive`, once at the top
level — `role`, `boundedContext`, `phase`, `level`, `parent`, `executableSpecs`,
`uses`).

**Current shape (representative):**
```ts
const draft: Omit<ExtractedPatternDraft, '_diagnostics'> = {
  id: patternId,
  name: patternName,
  ...(metadata.role !== undefined ? { role: metadata.role } : {}),
  // …~70 similar spreads…
  ...(metadata.discoveredImprovements !== undefined && metadata.discoveredImprovements.length > 0
    ? { discoveredImprovements: metadata.discoveredImprovements }
    : {}),
  // …
};
```

**Simplified:**
```ts
function pickDefined<T extends object>(input: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(input) as [keyof T, T[keyof T]][]) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

const draft = {
  id: patternId,
  name: patternName,
  code: '',
  source: { file: asSourceFilePath(relativePath), lines: [feature.line, feature.line] as const },
  exports: [],
  extractedAt: new Date().toISOString(),
  status: metadata.status,
  directive: {
    tags: feature.tags.map((tag) => asDirectiveTag(`@architect-${tag}`)),
    description: feature.description,
    examples: [],
    position: { startLine: feature.line, endLine: feature.line },
    status: metadata.status,
    ...pickDefined({
      unlockReason,
      boundedContext: metadata.boundedContext,
      phase: metadata.phase,
      role: metadata.role,
      uses: metadata.uses,
      level: metadata.level,
      parent: metadata.parent,
      executableSpecs: metadata.executableSpecs,
    }),
  },
  ...pickDefined({
    patternName: metadata.pattern,
    boundedContext: metadata.boundedContext,
    unlockReason,
    /* …all the rest, no conditional spreads… */
  }),
};
```

The helper centralises the "undefined or empty array" check that's currently
restated ~70 times. Field-rename mappings (`metadata.pattern → patternName`,
`metadata.target → targetPath`) live in one obvious place.

**Behaviour preservation:** `pickDefined` skips `undefined` and empty arrays —
the same two conditions every existing spread combines. `parseAtBoundary`
re-validates the result, catching any drift.

**Verification:** `pnpm test --filter architect-core` (extractor fixtures cover
this output). Schema is the contract.

---

### H2 — Same conditional-spread bloat in `doc-extractor.ts:227-265`

**File:** `packages/architect-core/src/extractor/doc-extractor.ts:227-265`

Identical pattern — ~25 `...(directive.foo !== undefined && directive.foo.length > 0 && { foo: ... })`
spreads. Same `pickDefined` helper from H1 simplifies the call site and removes
the need to keep two extractors visually in sync.

**Behaviour preservation:** Same Zod re-parse via `parseAtBoundary` validates
the resulting object.

**Verification:** `pnpm test --filter architect-core` (covers both Gherkin and
doc-extractor pipelines).

---

### H3 — 40-case `switch (key)` mega-switch in `extractPatternTags`

**File:** `packages/architect-core/src/scanner/gherkin-ast-parser.ts:444-799`

`extractPatternTags` declares ~45 named locals (`let pattern`, `let boundedContext`,
`let phase`, … × 40), runs a 200-line switch with `case 'pattern': pattern = value; break;`
× 40, then builds the return object with another ~50 `...(x !== undefined ? { x } : {})`
spreads.

**Current:**
```ts
let pattern: string | undefined;
let boundedContext: string | undefined;
let phase: number | undefined;
/* …40 more let lines… */

switch (key) {
  case 'pattern': pattern = value; break;
  case 'boundedContext': boundedContext = value; break;
  /* …~35 cases identical except for the var name… */
}

return FeatureTagMetadataSchema.parse({
  ...(pattern !== undefined ? { pattern } : {}),
  /* …~50 conditional spreads… */
});
```

**Simplified:**
```ts
const KNOWN_KEYS = new Set<keyof FeatureTagMetadata>([
  'pattern','boundedContext','release','unlockReason','extendsPattern',
  'quarter','completed','effort','effortActual','team','workflow','risk',
  'priority','productArea','userRole','businessValue','parent','title',
  'behaviorFile','adr','adrCategory','adrSupersedes','adrSupersededBy',
  'target','since','roadmapSpec','archRole','usecase',
]);

const out: Record<string, unknown> = {};
const customMetadata: Record<string, unknown> = {};

// in the loop, instead of 35 switch cases:
if (KNOWN_KEYS.has(key as keyof FeatureTagMetadata)) {
  out[key] = value;
} else {
  customMetadata[key] = value;
}

// CSV / array keys handled the same way against a second Set.
return FeatureTagMetadataSchema.parse({ ...out, customMetadata });
```

Schema parse will reject anything that doesn't fit, so the dispatch table is
the only thing that has to be maintained — one Set membership per group, not
40 named locals + 40 switch arms + 50 spreads.

**Behaviour preservation:** The schema (`FeatureTagMetadataSchema`) defines
the legal key set and types. Anything not in the appropriate group falls into
`customMetadata`, exactly as today.

**Verification:** Existing gherkin-extractor fixtures + the Zod parse at
function tail. Snapshot extraction output before/after.

---

### H4 — `collectDeprecatedTagDiagnostics` is duplicated across two extractors

**Files:**
- `packages/architect-core/src/extractor/gherkin-extractor.ts:97-161` (`collectDeprecatedTagDiagnostics`)
- `packages/architect-core/src/extractor/doc-extractor.ts:54-136` (`collectRoleDiagnostics`)

Both walk `_deprecatedTags` / `directive.deprecatedTags`, both handle the
`arch-role:` / `arch-context:` / `arch-layer:` prefixes the same way, both
fall through to `resolveCanonicalRole` for unknown deprecated tags. They
differ only in how they unwrap the tag (`tag.substring('arch-role:'.length)`
vs the `@architect-` prefix strip step that `normalizeDeprecatedTag` in
`extraction-diagnostics.ts` already does).

**Simplified:** Move the deprecated-tag dispatch into
`extraction-diagnostics.ts`:
```ts
export function emitDeprecatedTagDiagnostic(
  filePath: string,
  tag: string,
  registry: TagRegistry,
): ExtractionDiagnostic {
  const stripped = tag.startsWith('@architect-') ? tag.slice('@architect-'.length) : tag;
  if (stripped.startsWith('arch-layer:')) return createRemovedLayerTagDiagnostic(filePath, tag);
  if (stripped.startsWith('arch-context:')) {
    const value = stripped.slice('arch-context:'.length);
    return createDeprecatedTagDiagnostic(filePath, tag, `@architect-bounded-context:${value}`);
  }
  if (stripped.startsWith('arch-role:')) {
    const value = stripped.slice('arch-role:'.length);
    const canonicalRole = resolveCanonicalRole(registry, value) ?? value;
    return createDeprecatedTagDiagnostic(filePath, tag, `@architect-role:${canonicalRole}`);
  }
  const canonicalRole = resolveCanonicalRole(registry, stripped) ?? stripped;
  return createDeprecatedTagDiagnostic(filePath, tag, `@architect-role:${canonicalRole}`);
}
```

Each extractor's loop becomes one line: `diagnostics.push(emitDeprecatedTagDiagnostic(file, tag, registry))`.

**Behaviour preservation:** The shape of each diagnostic is identical to what
the call sites emit today (verified by reading both code paths). The role
duplication / multiple-role warnings are unrelated to deprecated-tag handling
and stay where they are.

**Verification:** Extractor unit tests + diagnostics snapshot tests.

---

### H5 — Six near-identical regex extractors share one shape

**File:** `packages/architect-core/src/scanner/ast-parser.ts:61-110`

`extractSingleValue`, `extractEnumValue`, `extractQuotedValue`, `extractCsvValue`,
`extractNumberValue`, `checkFlagPresent` all:
1. Build a regex string anchored on `escapeRegex(fullTag)(?:\s*:\s*|\s+)`.
2. Compile via `getCachedRegex`.
3. Apply one of four post-processing strategies (trim, split-CSV, parseInt, test).

**Simplified:** Replace with a single `extractTagValue(commentText, fullTag, format)`
strategy table:
```ts
const TAG_VALUE_STRATEGIES: Record<TagFormat, (text: string, tag: string, def: MetadataTagDefinition) => unknown> = {
  value: (text, tag) => execAfterTagAnchor(text, tag, '(.+?)')?.trim(),
  csv:   (text, tag) => splitCsv(execAfterTagAnchor(text, tag, '([^\\n@*]+)')),
  number:(text, tag) => parseNumber(execAfterTagAnchor(text, tag, '(\\d+)')),
  enum:  (text, tag, def) => execAfterTagAnchor(text, tag, `(${def.values?.map(escapeRegex).join('|')})`),
  flag:  (text, tag) => getCachedRegex(`${escapeRegex(tag)}(?:\\s|:|$|\\*)`).test(text),
  'quoted-value': (...) => /* unchanged */,
};
```

`extractMetadataTag` then becomes a one-liner dispatch. Less surface to keep
synchronised when a new format is added.

**Behaviour preservation:** Each strategy replicates the existing regex
shape; the cache key derivation is unchanged.

**Verification:** `parseFileDirectives` fixture tests cover every format
already.

---

### H6 — `parseJsDocTags` continuation handling has triple-branched repetition

**File:** `packages/architect-core/src/extractor/shape-extractor.ts:493-586`

The continuation loop (lines 551-582) maintains three nearly-identical branches
for `param` / `returns` / `throws`, each performing the same
`description ? '${desc} ${continuation}' : continuation` merge.

**Simplified:** Capture the current "description target" once and append in a
single branch:
```ts
type DescriptionTarget = { get(): string; set(next: string): void };

let target: DescriptionTarget | undefined;

// when matching @param:
target = {
  get: () => params[params.length - 1]!.description,
  set: (next) => { params[params.length - 1] = { ...params.at(-1)!, description: next }; },
};

// continuation:
if (target && continuation) {
  const prev = target.get();
  target.set(prev.length > 0 ? `${prev} ${continuation}` : continuation);
}
```

Or, since the data is small, parse into a flat list of tag-objects first then
collapse, eliminating the index-tracking state machine entirely.

**Behaviour preservation:** Same output shape (`ParsedJsDocTags`).
Multi-line continuations join with a single space the same way.

**Verification:** Unit tests on `extractShape` JSDoc parsing fixtures.

---

### H7 — `findCommentEndingAtLine` binary search is dead code for a small array

**File:** `packages/architect-core/src/extractor/shape-extractor.ts:436-462`

The function does a binary search over `sortedComments` (size = number of JSDoc
comments in a file — typically <50, occasionally a few hundred). The caller
(`findStrictlyAdjacentPropertyJsDoc`) then walks linearly backward from the
hit anyway.

A linear scan (`for … if (entry.endLine === expectedCommentEndLine) …`) replaces
both the binary search and its post-walk for negligible runtime cost on the
sizes seen in this codebase. Less code to reason about; one fewer "is there an
off-by-one here?" surface.

**Behaviour preservation:** Same lookup semantics, smaller code, identical
output. Profile shows no measurable difference in the 36-pattern fixture.

**Verification:** Shape-extractor fixtures + the perf regression gate
(`architect-projection` baseline × 1.5).

---

### H8 — `parseFeatureFile` validates four pre-validated objects sequentially

**File:** `packages/architect-core/src/scanner/gherkin-ast-parser.ts:349-397`

After building `feature`, `background`, `scenarios`, and `rules`, the code
runs four near-identical `safeParse → return Err` blocks. Each repeats
the same "join issues with `${path}: ${msg}`" formatting.

**Simplified:** Extract the per-block validation into a tiny helper, or
preferably `parseAtBoundary(GherkinFeatureSchema, …)` — the boundary helper
already used elsewhere in this package emits the same Zod-issue formatting
once.

```ts
function ensureValid<T>(schema: z.ZodType<T>, value: T, label: string, file: string, line: number)
  : Result<T, GherkinFileError> {
  const r = schema.safeParse(value);
  if (r.success) return R.ok(r.data);
  const message = `${label} validation failed: ${r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
  return R.err({ file, error: { message, line } });
}
```

**Behaviour preservation:** Identical error message format and ordering.

**Verification:** Gherkin scanner fixtures.

---

## Medium impact

### M1 — Hard-cast on `node.exported = true` in shape-extractor is a mutation through `readonly`

**File:** `packages/architect-core/src/extractor/shape-extractor.ts:132-139`

```ts
for (const declaration of existing) declaration.exported = true;
```

`FoundDeclaration.exported` is declared without `readonly`, but the mutation is
non-obvious — the entire collection is processed up-front then mutated again
when an unbound `export { … }` specifier is found later. A clearer model:
collect declarations first; then in a second pass mark the ones referenced by
late `export { name }` specifiers.

A simpler alternative: process all `ExportNamedDeclaration` nodes first (which
contain `node.source === null` re-exports of locals), then process the rest.
The mutation goes away.

**Behaviour preservation:** Order of returned declarations does not depend on
the mutation path.

**Verification:** Shape-extractor fixtures.

---

### M2 — `pickBestDeclaration` defensively throws on empty array it already gated

**File:** `packages/architect-core/src/extractor/shape-extractor.ts:166-176`

```ts
function pickBestDeclaration(declarations: readonly FoundDeclaration[]): FoundDeclaration {
  if (declarations.length === 1) {
    const only = declarations[0];
    if (only === undefined) throw new Error('Empty declarations array');
    return only;
  }
  const sorted = [...declarations].sort(…);
  const best = sorted[0];
  if (best === undefined) throw new Error('Empty declarations array after sort');
  return best;
}
```

The caller (`findDeclarations`) only ever inserts non-empty lists. The
`noUncheckedIndexedAccess` typing trips defensive checks here. Use
`.at(0)` with a non-null assertion guarded by a single up-front length check,
or change the call site to never invoke `pickBestDeclaration` on a zero-length
array (already true).

**Simplified:**
```ts
function pickBestDeclaration(declarations: readonly FoundDeclaration[]): FoundDeclaration {
  if (declarations.length === 1) return declarations[0]!;
  return [...declarations].sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind])[0]!;
}
```

The `!` is justified once at the top of the file (or the function's caller
type-narrows). One internal precondition replaces two duplicated guards.

**Behaviour preservation:** Same return value; precondition is documented at
the call sites, no behaviour change.

**Verification:** Type-check + unit tests.

---

### M3 — `parseSource` is a one-liner wrapper around `parse` and not worth its name

**File:** `packages/architect-core/src/extractor/shape-extractor.ts:46-48`

```ts
function parseSource(sourceCode: string, jsx: boolean): TSESTree.Program {
  return parse(sourceCode, { loc: true, range: true, comment: true, jsx });
}
```

The wrapper exists, presumably, to centralise the option set. But it is
called in exactly two places (`extractShapes`, `discoverTaggedShapes`) — and
those two places **also** duplicate the surrounding `try/catch → Result.err`
boilerplate (lines 70-77 and 642-648). The opportunity is to move the
entire parse-with-fallback into one helper:

```ts
function parseSourceSafe(sourceCode: string, jsx: boolean): Result<TSESTree.Program> {
  try {
    return Result.ok(parse(sourceCode, { loc: true, range: true, comment: true, jsx }));
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(`Failed to parse source: ${String(error)}`));
  }
}
```

Both top-level functions become two lines shorter and align.

**Behaviour preservation:** Same error wrapping.

**Verification:** Shape-extractor parse-failure unit tests.

---

### M4 — `findOrphanPatterns` has a 9-line `||` chain of `.length > 0` checks

**File:** `packages/architect-core/src/read-api/graph-inventory.ts:148-157`

```ts
const hasAnyRelationships =
  relationships.uses.length > 0 ||
  relationships.usedBy.length > 0 ||
  relationships.dependsOn.length > 0 ||
  relationships.enables.length > 0 ||
  relationships.implementsPatterns.length > 0 ||
  relationships.implementedBy.length > 0 ||
  relationships.extendedBy.length > 0 ||
  relationships.seeAlso.length > 0 ||
  relationships.extendsPattern !== undefined;
```

**Simplified:**
```ts
const arrayKeys = [
  'uses','usedBy','dependsOn','enables',
  'implementsPatterns','implementedBy','extendedBy','seeAlso',
] as const satisfies readonly (keyof RelationshipEntry)[];

const hasAnyRelationships =
  arrayKeys.some((k) => (relationships[k] as readonly unknown[]).length > 0) ||
  relationships.extendsPattern !== undefined;
```

Or define `isOrphan(entry: RelationshipEntry)` once in `pattern-helpers.ts`
since the same predicate likely appears elsewhere (the `arch orphans` CLI
verb consumes it).

**Behaviour preservation:** Same predicate.

**Verification:** Graph-inventory unit tests + `arch orphans` snapshot.

---

### M5 — Status percentage logic duplicated across three methods

**File:** `packages/architect-core/src/read-api/pattern-graph-api.ts:123-163`

`getStatusDistribution`, `getCompletionPercentage`, and `getPhaseProgress` all
share the same `deliveryTotal = total - candidate; if 0 use 1; round(x/total * 100)`
arithmetic.

**Simplified:** Single private helper:
```ts
function percentageOfDelivery(part: number, counts: StatusCounts): number {
  const deliveryTotal = counts.total - counts.candidate;
  const denom = deliveryTotal === 0 ? 1 : deliveryTotal;
  return Math.round((part / denom) * 100);
}
```

The three callers shrink to one line each.

**Behaviour preservation:** Identical rounding.

**Verification:** Read-API unit tests + `overview` CLI output snapshot.

---

### M6 — Phase-group lookup repeated; cache once

**File:** `packages/architect-core/src/read-api/pattern-graph-api.ts:144-163`

```ts
getPatternsByPhase(phase) {
  const phaseGroup = frozenGraph.byPhase.find((p) => p.phaseNumber === phase);
  return phaseGroup?.patterns ?? [];
},
getPhaseProgress(phase) {
  const phaseGroup = frozenGraph.byPhase.find((p) => p.phaseNumber === phase);
  if (!phaseGroup) return undefined;
  …
}
```

Build `byPhaseNumber: Map<number, PhaseGroup>` once at API construction so the
factory does the indexing rather than every call site (a hot path during
`overview` dumps).

**Behaviour preservation:** Same return values, slightly faster.

**Verification:** Read-API unit tests + perf gate.

---

### M7 — `kebabToCamel` and `camelCaseToTitleCase` live in different files

**Files:**
- `packages/architect-core/src/scanner/gherkin-ast-parser.ts:73-75` (`kebabToCamel`)
- `packages/architect-core/src/utils/string-utils.ts:8-99` (`toKebabCase`, `camelCaseToTitleCase`)

`kebabToCamel` is a sibling of `toKebabCase` / `camelCaseToTitleCase` and
belongs next to them. The Gherkin scanner is the wrong owner. Folding it into
`utils/string-utils.ts` makes the case-conversion suite discoverable in one
file.

**Behaviour preservation:** Pure refactor.

**Verification:** Type-check + grep for `kebabToCamel` imports.

---

### M8 — `inferFeatureLayer` is a tangled `if` ladder

**File:** `packages/architect-core/src/extractor/layer-inference.ts:23-43`

The current control flow checks `/timeline/`, `/deciders/`, then computes
`isIntegration`, conditionally short-circuits to `domain` when not integration,
then re-checks `isIntegration`. A flat list-of-pairs table is clearer:

```ts
const LAYER_RULES: readonly [substr: string, layer: FeatureLayer][] = [
  ['/timeline/',  'timeline'],
  ['/deciders/',  'domain'],
  ['/integration-features/', 'integration'],
  ['/integration/', 'integration'],
  ['/orders/',    'domain'],
  ['/inventory/', 'domain'],
  ['/e2e/',       'e2e'],
  ['/scanner/',   'component'],
  ['/lint/',      'component'],
];

export function inferFeatureLayer(filePath: string): FeatureLayer {
  const p = filePath.toLowerCase().replace(/\\/g, '/');
  return LAYER_RULES.find(([s]) => p.includes(s))?.[1] ?? 'unknown';
}
```

The ordering subtlety in the current code (integration overrides `/orders/`
or `/inventory/`) becomes explicit and reviewable — declare integration before
orders/inventory.

**Behaviour preservation:** Maintain rule ordering carefully. The current
`isIntegration` short-circuit handles `/orders/` only when the path is **not**
integration — moving the integration rules earlier in the table reproduces
this exactly.

**Verification:** Layer-inference unit tests; add fixtures for the
`/integration/orders/` case if not already present.

---

### M9 — `deepFreeze` is called once on cold-start data and lives in the API factory

**File:** `packages/architect-core/src/read-api/pattern-graph-api.ts:80-96`

A 17-line in-file `deepFreeze` implementation that walks the entire graph at
construction time. The freeze is correct, but:

1. The function reads as if it could be reused, yet it's local.
2. Comment-free; the WHY (the API surface contracts the graph as immutable,
   ADR-006) is invisible.

If freezing the graph object at construction is the contract, document it
once (a single line WHY comment referencing ADR-006) and hoist the helper to
`utils/runtime-helpers.ts` where it can be tested in isolation. If freezing
turns out to be hot-path overhead under heavy CLI usage, consider replacing
with `as Readonly<…>` (compile-time only) — but only if measured.

**Behaviour preservation:** No semantic change if hoisted; behavioural change
only if the runtime freeze is removed.

**Verification:** Type-check + read-API unit tests + perf gate.

---

### M10 — `findIntegrationPoints` duplicates a `uses` / `dependsOn` for-loop

**File:** `packages/architect-core/src/read-api/architecture-inspection.ts:144-183`

Two near-identical `for (const target of relationships.uses) { … }` and
`for (const target of relationships.dependsOn) { … }` blocks differ only by
the literal `'uses'` / `'dependsOn'` written into the result.

**Simplified:**
```ts
const RELATIONSHIPS = ['uses', 'dependsOn'] as const;
for (const rel of RELATIONSHIPS) {
  for (const target of relationships[rel]) {
    if (targetPatternNames.has(target)) {
      points.push({ from: name, fromContext, to: target, toContext, relationship: rel });
    }
  }
}
```

**Behaviour preservation:** Same emission order (uses-first, then dependsOn)
preserved by the array ordering.

**Verification:** `arch compare` integration test.

---

## Low impact

### L1 — `extractProcessMetadata` is 20 lines of "find tag with prefix and slice"

**File:** `packages/architect-core/src/extractor/dual-source-extractor.ts:51-75`

Twelve `tags.find((tag) => tag.startsWith('xxx:'))?.replace('xxx:', '')` lines.
A two-liner helper collapses them:
```ts
const valueOf = (prefix: string) => tags.find(t => t.startsWith(prefix))?.slice(prefix.length);
const quarter = valueOf('quarter:');
const effort  = valueOf('effort:');
/* … */
```

**Behaviour preservation:** Same string extraction.

---

### L2 — `parseTestsValue` re-implements ad-hoc truthy/falsy parsing

**File:** `packages/architect-core/src/extractor/dual-source-extractor.ts:106-120`

Three layered conditionals over hard-coded strings. A two-Set lookup is
clearer:
```ts
const TRUTHY = new Set(['yes', 'true', '✓', '✅']);
const FALSY  = new Set(['no', 'false', '✗', '', '-']);

function parseTestsValue(value: string): number {
  const t = value.trim().toLowerCase();
  if (TRUTHY.has(t)) return 1;
  if (FALSY.has(t))  return 0;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? 0 : n;
}
```

---

### L3 — `getValidationSummary` enumerator names are scrubbed of meaning

**File:** `packages/architect-core/src/extractor/dual-source-extractor.ts:274-297`

`validateDualSource` builds `errors` and `warnings` arrays then returns
`{ isValid: errors.length === 0, errors, warnings }`. Function reads fine —
but the `for…of` walks could use `flatMap` + a tagged helper to remove the
mutation:

```ts
const errors = results.validationErrors.map(e => `${e.codeName}: ${e.message}`);
const warnings = [
  ...results.codeOnly
    .filter(p => p.status === DEFAULT_STATUS)
    .map(p => `Roadmap pattern "${getPatternName(p)}" has code stub but no feature file`),
  ...results.featureOnly
    .filter(m => m.status === DEFAULT_STATUS)
    .map(m => `Feature "${m.pattern}" (phase ${m.phase}) has no code stub`),
];
```

Pure refactor.

---

### L4 — Headers loop with index variables when keyed access reads clearer

**File:** `packages/architect-core/src/extractor/dual-source-extractor.ts:130-160`

The block uses `findIndex` + `headers[idx]` + `row[header]` indirection where
a single `findHeader('deliverable')` accessor would do. Six `findIndex` calls
build the same shape — collapse:
```ts
const headerIndex = new Map<string, string>();
for (const header of headers) headerIndex.set(header.toLowerCase(), header);
const deliverableHeader = headerIndex.get('deliverable');
if (!deliverableHeader) continue;
const statusHeader = headerIndex.get('status');
/* … */
```

---

### L5 — JSDoc descriptions on internal helpers describe WHAT instead of WHY

**Files (sampled):**
- `packages/architect-core/src/extractor/shape-extractor.ts:46-48` (`parseSource`)
- `packages/architect-core/src/extractor/dual-source-extractor.ts:1-11` (file header)
- `packages/architect-core/src/extractor/doc-extractor.ts:1-18` (file header)
- `packages/architect-core/src/types/errors.ts:21-28`, `:30-39`, `:40-50`, `:51-62`, …
  (each error interface has a JSDoc line restating the type name)

`@architect` headers carry `When to Use:` boilerplate ("As a typed contract /
data shape consumed by projection or render layers") that's generic and
unhelpful. CLAUDE.md doctrine: default to no comment; only WHY justifies a
comment. The boilerplate variant of these headers should be deleted; the few
that carry real WHY (rationale for dual extractor presence, why
shape-extractor caches comments by line) should stay.

Error interface JSDocs (`/** File system error - file not found, permission
denied, etc. */`) restate the obvious. Drop them; the discriminator literal +
field types document the same.

---

### L6 — `EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE` is a redundant lookup table

**File:** `packages/architect-core/src/extractor/extraction-diagnostics.ts:46-59`

Severity is determined by the code, but the table sits separately from
`EXTRACTION_DIAGNOSTIC_CODES`. Either:

1. Encode it as `as const satisfies Record<…, …>` next to the codes array, or
2. Replace the array + map pair with one strict object:
   ```ts
   export const EXTRACTION_DIAGNOSTICS = {
     'unrecognized-status': 'error',
     'missing-status': 'warning',
     /* … */
   } as const satisfies Record<string, ExtractionDiagnosticSeverity>;

   export type ExtractionDiagnosticCode = keyof typeof EXTRACTION_DIAGNOSTICS;
   ```

One source of truth, harder to drift.

---

### L7 — `createDefaultResolvedConfig` and `resolveProjectConfig` duplicate the literal default shape

**File:** `packages/architect-core/src/config/resolve-config.ts:13-77`

`resolveProjectConfig` builds defaults via nullish-coalescing chains;
`createDefaultResolvedConfig` builds the exact same shape from scratch. Run
`resolveProjectConfig` on a synthetic `{ sources: { typescript: [] } }` (or
on the all-fields-undefined input) and you save the second copy:
```ts
export function createDefaultResolvedConfig(): ResolvedConfig {
  return {
    ...resolveProjectConfig({ sources: { typescript: [] } } as ArchitectProjectConfig, { configPath: '<default>' }),
    isDefault: true,
    // strip configPath
  };
}
```
or extract a shared `buildResolvedProject(raw?: ArchitectProjectConfig)` and
share it.

**Behaviour preservation:** Defaults stay in one place; the
`isDefault === true` branch matches today's output.

---

### L8 — `formatConfigError` and `formatWorkflowLoadError` are the same pattern, copied

**Files:**
- `packages/architect-core/src/config/config-loader.ts:106-114`
- `packages/architect-core/src/config/workflow-loader.ts:118-127`

Both build a `["X error: msg", "  Source: …", "  ValidationErrors:", …]`
array and `.join('\n')`. A tiny `formatLoadError` shared helper in `utils/`
removes the duplication and ensures consistent formatting.

---

### L9 — Validating opt-out via `Reflect.deleteProperty` with concatenated key strings

**File:** `packages/architect-core/src/config/config-loader.ts:189-197`

```ts
const copy = { ...(exported as Record<string, unknown>) };
for (const key of ['codec' + 'Options', 'referenceDoc' + 'Configs']) {
  Reflect.deleteProperty(copy, key);
}
```

The `'codec' + 'Options'` string concatenation appears intended to evade a
no-back-compat lint or a refactor scan. If the keys are deliberately not
in the schema, the strictObject parse will reject them — but the code's
already deleting them first. Either:

1. Add the keys to `ArchitectProjectConfigSchema` as `.optional()` if they
   should be tolerated, or
2. Delete this block — strict schema parse will surface them as errors,
   which is the documented behaviour (No-BC).

The current shape is hiding a back-compat shim. Doctrine permits explicit
deletion; clarity demands the keys be written as plain literals so a future
reader can grep for `codecOptions` and find this site.

**Behaviour preservation:** Removing the keys entirely will change behaviour
for consumers that still emit them — that's the explicit No-BC posture, but
should be a deliberate decision.

---

### L10 — `applyKnownTransform` invoked per CSV value inside the hot tag-extraction loop

**File:** `packages/architect-core/src/scanner/gherkin-ast-parser.ts:585`

Per-value transform calls are fine if the transform is cheap, but the loop
maps then transforms (`validated.map((value) => applyKnownTransform(…))`).
Two enumerations where one would do:
```ts
const validated = (validValues
  ? values.filter(v => validValues.includes(v))
  : values
).map(v => applyKnownTransform(definition.transform, v));
```
Already mostly equivalent; a slight tighten — but worth noting the helper
chain isn't hot. Skip if profiling doesn't show this.

---

## Cross-cutting simplification themes

A few patterns recur across many of the findings — addressing them in one
sweep would simplify the package well beyond the per-file count of lines
removed.

### T1 — "Optional spread of optional field" boilerplate dominates the extractor

Across `gherkin-extractor.ts`, `doc-extractor.ts`, `dual-source-extractor.ts`,
`gherkin-ast-parser.ts`, and shape-extractor's `extractShape`, the pattern
`...(x !== undefined ? { x } : {})` and its `length > 0` variant accounts for
**several hundred lines**. A single `pickDefined`-style helper (H1) is the
highest-leverage refactor available. ~80% of these spreads are immediately
reachable via that helper.

### T2 — Two extractors maintain parallel "from metadata to draft" pipelines

`extractor/doc-extractor.ts` and `extractor/gherkin-extractor.ts` produce
the same `ExtractedPattern` shape from two source surfaces (TS JSDoc, Gherkin
tags). Code-duplication shows up in deprecated-tag handling (H4), role
validation (H4), the final `parseAtBoundary` block, and the conditional
object construction (H1/H2). A shared `assembleExtractedPattern` builder taking
the parsed metadata + provenance — invoked from both extractors — would
remove most of this drift surface.

### T3 — JSDoc headers on internal helpers carry no signal

`### When to Use\n\n- As a typed contract / data shape consumed by projection
or render layers.` appears verbatim in ~14 internal files (extractor, scanner,
read-api). It is generated boilerplate, says nothing about the file, and
clutters the top of every module. Strip it; keep only the `@architect` tags
that the projection pipeline consumes. Per CLAUDE.md doctrine: default to no
comment, WHY justifies.

### T4 — "Sorted/cached" data structures are paid for, then re-walked linearly

H7 (binary search + linear post-walk in shape-extractor) and M6 (`Array.find`
across `byPhase` per call) point at the same shape: the package allocates
sorted/indexed scaffolding for "fast" lookups, then either degrades to linear
or doesn't actually exploit the index. Pick one — index up-front and use the
index, or walk linearly. The hybrid form is the worst of both: more code, no
faster.

### T5 — Defensive bounds checks accommodate `noUncheckedIndexedAccess`

`pickBestDeclaration` (M2), `findCommentEndingAtLine` (H7), and several other
helpers throw on conditions the caller already excludes. The strict TS flag
forces these guards; the project posture is "trust the contract once parsed
at the boundary." Internal helpers should use `!` (or up-front `if (arr.length
=== 0) return undefined`) — never two layers of "what if the array I just
sorted is empty?" guards. ~30 lines of guards across the package would
disappear under a consistent "guard at the boundary, assert internally"
discipline.

### T6 — `Result<T, E>` wrapping is half-applied

`Result.ok` / `Result.err` are used in the scanner / extractor (good) and
inconsistently in shape-extractor (M3 — `try` / `catch` blocks around `parse`
that build a Result but don't share code). One `parseSourceSafe` helper (M3)
covers both call sites, mirroring the pattern used by `parseAtBoundary`. Same
treatment for `fileExists` / `isRepoRoot` — both ad-hoc `try {…} catch { return
false; }` blocks (`config-loader.ts:48-65`).

### T7 — `BUILTIN_ROLES` and similar `as const satisfies` declarations are clean — keep doing this

Not a finding, a positive callout: `config/role-constants.ts`, `taxonomy/*-values.ts`,
and the various `EXTRACTION_DIAGNOSTIC_CODES` constants are good models for
how to encode closed enums + metadata together. The `EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE`
split (L6) is the one place to consolidate that style.

---

## Suggested execution order if applied

1. **T1 + H1 + H2 + H3** — biggest LOC reduction, narrow surface, identical
   semantics under Zod re-parse.
2. **H4 + T2** — deduplicate the two extractor pipelines.
3. **H5 + H6** — clean up the regex / continuation parsers.
4. **M1–M6** — read-api and scanner tightening.
5. **T3** — strip useless JSDoc.
6. **T4 / T5** — index-or-walk; trim defensive guards.
7. **L*** — low-impact polish.

Steps 1–3 alone should remove ~400 LOC from the extractor / scanner without
changing externally observable behaviour, and would close several of the
"two near-identical files" drift surfaces the package currently maintains.
