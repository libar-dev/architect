# architect-projection — Phase 2A: Simplification Recipes

**Scope:** Concrete before/after recipes for findings Phase 1 named without showing the after-shape. Cites finding IDs from `01-quality-architecture.md` rather than re-deriving them.

## 1. Executive summary

The package has **two structurally outsized files** (`render-markdown.ts` 2,227 LOC, `operational-insights/index.ts` 1,200 LOC) and one mid-sized one (`delivery-reporting/index.ts` 742 LOC) that all break the sibling convention of "one file per `project*` function" used in `pattern-relations/` and `execution-context/`. Their decomposition is the highest-leverage simplification in the package — `render-markdown.ts` alone splits into 9 files of which 5 are pure renderer-block code that ports verbatim. The package also carries roughly **120 LOC of in-package duplication** across 8 helper pairs (Phase 1 H-PROJ-Q-2..5, H-PROJ-A-6, M-PROJ-5..6 and slug-trio H-PROJ-A-7) where one consolidated `_shared/` module per pair, behind unchanged call sites, closes the drift surface. Three small algorithmic wins are also concentrated on the perf-gate path: `createStatusCounts` 4-pass filter → single-pass tally (H-PROJ-Q-4), `filterPatterns` no-filter copy elimination (H-PROJ-Q-6), and `dependency-tree` Set-clone → mutate+backtrack (M-PROJ-3). The schema-derivation recipe for `ProjectionBundle<T>` (H-PROJ-A-4) is the only recipe that introduces a new abstraction worth introducing — it dissolves a 100-LOC hand-coded `isBundle`/`isRoutingLike` and aligns the most-crossed contract with the package's Zod-first doctrine.

**Top three highest-leverage recipes:**
1. **Split `render-markdown.ts`** (H-PROJ-A-5 / H-PROJ-Q-8) — 4-way mechanical split (`routed-paths.ts`, `splitting.ts`, `normalizers/*.ts`, `block-rendering.ts`) with `TRUSTED_MARKDOWN` staying renderer-private.
2. **`projectionBundleSchema<T>(fragmentSchema)` factory** (H-PROJ-A-4 / M-PROJ-4 / M-PROJ-A-2) — replaces `BundleRouting` + `ProjectionBundle<T>` + `isBundle` + `isRoutingLike` (~100 LOC) with one `z.infer`'d schema; `isBundle` becomes a thin `safeParse` wrapper.
3. **Single-pass `createStatusCounts`** (H-PROJ-Q-4) — collapses 4 sequential `Array.filter` passes into one accumulator-loop on a perf-gate hot path that runs across `buildOverviewDigest`, `buildPhaseProgress`, `buildStatusDistribution`, and every quarter/release bucket.

**Anything Phase 1 missed?** Two things. (a) `parseAndProject` (`_shared/parse-and-project.internal.ts:22`) uses a `Symbol` sentinel (`NO_DEFAULT_RAW_OPTIONS`) to distinguish "no default provided" from "default is `undefined`" — this can be the simpler `arguments.length`-style overload or just split into two helpers, but the simpler win is to drop the sentinel by accepting a 2-tuple `{ default?: unknown }` option object so the option is explicit. (b) `dispatchByKind`/`StrictKindTable` is doing real type-system work and Phase 1 correctly flags `MARKDOWN_NORMALIZERS` (M-PROJ-A-10) as covering 10 of 47 kinds — the existing `StrictKindTable<Out, Options, Kinds>` already encodes the partial-table type-check; the simplification is to **promote `Kinds` from a hand-listed string union (`render-markdown.ts:176-186`) to the kind-tag literals of a `z.discriminatedUnion` subset** so adding a new normalizer requires only adding the entry to the table.

---

## 2. High-leverage simplifications (with before/after)

### 2.1 `render-markdown.ts` 2,227-LOC split (H-PROJ-A-5, H-PROJ-Q-8)

The current single file contains 8 concerns. Sibling renderers (`render-ui.ts`, `render-json.ts`, `render-compact-text.ts`) stay single-file because they're under ~700 LOC; markdown's bundle-routing/h2-splitting concerns are what bloats it. Existing `renderers/_shared/dispatch.ts` proves the renderer-shared pattern is acceptable.

**After: file-split layout**

```
src/renderers/
├── render-markdown.ts                   # ~250 LOC: renderMarkdown, renderBundle, resolveOptions, normalizeFragment
├── markdown/
│   ├── routed-paths.ts                  # ~180 LOC: resolveChildOutputPaths, createUniqueRoutedPath,
│   │                                    #          resolveChildRoutePath, resolveBundleDisclosureSpec,
│   │                                    #          extractDirectory, extractFileName, addRoutedDocument,
│   │                                    #          addUniqueEntry, isSafeRoutedOutputPath,
│   │                                    #          normalizeRequiredRoutedOutputPath, normalizeRoutedOutputPath,
│   │                                    #          decodeLinkTargetForClassification,
│   │                                    #          isControlCharacter, containsControlCharacters,
│   │                                    #          sanitizeMarkdownLinkTarget
│   ├── splitting.ts                     # ~140 LOC: splitOversizedDocument, groupByH2,
│   │                                    #          shouldSplitFromLineCount, countLines,
│   │                                    #          renderMarkdownDocument (the measure/emit pass driver)
│   ├── document-types.ts                # ~80 LOC: MarkdownDocument, H2Group, SplitResult,
│   │                                    #          RenderedMarkdownDocument, MarkdownMetadata,
│   │                                    #          NormalizeMarkdownOptions, ChildRouteRef,
│   │                                    #          RoutedChildOutputMaps, ResolvedMarkdownOptions
│   ├── trusted-markdown.ts              # ~120 LOC: TRUSTED_MARKDOWN symbol + Trusted* block types,
│   │                                    #          MarkdownRenderableBlock, trustedMarkdown(),
│   │                                    #          trustedMarkdownParagraph(), trustedMarkdownHeading(),
│   │                                    #          trustedMarkdownList(), markdownTable(),
│   │                                    #          isTrustedMarkdown(), isTrustedListItemObject(),
│   │                                    #          renderMarkdownText(), renderMarkdownLinkText()
│   ├── block-rendering.ts               # ~280 LOC: renderDocument, renderBlock, renderTable,
│   │                                    #          renderList, renderListItem, renderCollapsible,
│   │                                    #          renderLinkOut, pickFence, escapePlainMarkdownText,
│   │                                    #          escapePlainMarkdownLine, escapeHtml,
│   │                                    #          escapeTableCell, toMarkdownLink,
│   │                                    #          toSafeRoutedMarkdownLink,
│   │                                    #          rewriteDocumentationLinks, toRelativePath,
│   │                                    #          splitPathSegments
│   ├── generic-fragment.ts              # ~160 LOC: normalizeGenericFragment, renderEmbeddedSections,
│   │                                    #          isRecord, formatPrimitive, formatPrimitiveLike,
│   │                                    #          renderRecordArrayTable, hasText, dedupeStrings,
│   │                                    #          appendBundleBackLink, createMarkdownDocument,
│   │                                    #          resolveFragmentMetadata, deriveTitle,
│   │                                    #          getRoadmapViewTitle
│   └── normalizers/
│       ├── index.ts                     # ~30 LOC: MARKDOWN_NORMALIZERS table + dispatch wiring
│       ├── architecture-diagram.ts      # normalizeArchitectureDiagram
│       ├── business-rule-set.ts         # normalizeBusinessRuleSet, createBusinessRuleTable,
│       │                                # buildBusinessRuleGroupingSummary, buildBusinessRuleGroupingLinks
│       ├── decision-catalog.ts          # normalizeDecisionCatalog
│       ├── decision-record.ts           # normalizeDecisionRecord
│       ├── roadmap-timeline.ts          # normalizeRoadmapTimeline
│       ├── release-notes-digest.ts      # normalizeReleaseNotesDigest
│       ├── requirement-digest.ts        # normalizeRequirementDigest, renderRequirementPatternCell
│       ├── taxonomy-digest.ts           # normalizeTaxonomyDigest, buildTaxonomyGroupTable
│       ├── traceability-matrix.ts       # normalizeTraceabilityMatrix
│       └── validation-rule-digest.ts    # normalizeValidationRuleDigest, buildFsmStateDiagram
```

**Import map (key entries):**

| New file | Re-exports needed | Imports from |
|----------|-------------------|--------------|
| `render-markdown.ts` | `renderMarkdown` (public) | `markdown/routed-paths.ts`, `markdown/splitting.ts`, `markdown/document-types.ts`, `markdown/normalizers/index.ts`, `markdown/generic-fragment.ts`, `markdown/block-rendering.ts` |
| `markdown/normalizers/index.ts` | `MARKDOWN_NORMALIZERS`, `normalizeFragment` | per-kind files + `markdown/document-types.ts` + `_shared/dispatch.ts` |
| `markdown/normalizers/<kind>.ts` | one `normalize<Kind>` each | `markdown/document-types.ts`, `markdown/trusted-markdown.ts`, `markdown/generic-fragment.ts` (for `resolveFragmentMetadata`/`createMarkdownDocument`), `fragments/<domain>/index.ts`, `blocks/schema.js` |
| `markdown/trusted-markdown.ts` | all trusted helpers + `MarkdownRenderableBlock` type | module-private `TRUSTED_MARKDOWN` symbol stays internal to this file, exported only via the `trustedMarkdown*` factories — keeps the ADR-009 firewall identical |
| `markdown/block-rendering.ts` | `renderDocument` | `markdown/trusted-markdown.ts`, `markdown/document-types.ts` |

**Firewall preservation (load-bearing):** the `TRUSTED_MARKDOWN` symbol moves to `markdown/trusted-markdown.ts` but stays **module-private** — only the constructor helpers (`trustedMarkdown`, `trustedMarkdownParagraph`, `trustedMarkdownHeading`, `trustedMarkdownList`, `markdownTable`) are exported. The 5-AST-selector lint rule needs its target glob extended to `src/renderers/markdown/trusted-markdown.ts` and continues to ban exports of the symbol itself. No widening of the firewall.

**Why this exact split:** `routed-paths.ts` and `splitting.ts` are the two bundle-only concerns (~320 LOC together) — extracting them moves the entire `renderBundle` tail-context out of the main file. `block-rendering.ts` is the only renderer-codec concern; per-kind normalizers compose blocks but never serialize them. The 10 normalizer files match the existing one-file-per-projection convention in `pattern-relations/`. `generic-fragment.ts` is the fallback path used when no `MARKDOWN_NORMALIZERS` entry matches — keeping it next to `block-rendering.ts` would be wrong because it shapes documents, not strings.

---

### 2.2 The 8 in-package duplications (H-PROJ-Q-2..5, H-PROJ-A-6, M-PROJ-5..6, H-PROJ-A-7)

One consolidated `_shared/` file per pair. After-shape and target paths below.

#### 2.2.1 `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` (H-PROJ-Q-2)

Currently at `projections/_shared/pattern-helpers.internal.ts:349-425` **and** `projections/governance/business-rules.internal.ts:535-602`. Already drifted — governance copy `normalizeLineEndings(description)` before regex; `_shared` copy doesn't. The two consumers (`normalizeRules` in pattern-helpers; `buildBusinessRuleSet` in business-rules) need different `BusinessRuleAnnotations` return shapes (one inline; one typed). Make the typed one canonical.

**New file:** `projections/_shared/business-rule-annotations.internal.ts`

```ts
/**
 * @architect-bounded-context:_shared
 */
import { normalizeAnnotationText, normalizeLineEndings } from './text-normalize.internal.js';

const BUSINESS_RULE_ANNOTATION_PATTERN =
  /\*\*(Invariant|Rationale|Verified by):\*\*\s*([\s\S]*?)(?=\n\s*\*\*[A-Za-z][^*]*:\*\*|$)/gi;

export interface BusinessRuleAnnotations {
  readonly invariant?: string;
  readonly rationale?: string;
  readonly verifiedBy?: readonly string[];
}

export function parseBusinessRuleAnnotations(description: string): BusinessRuleAnnotations {
  if (!description || description.trim().length === 0) {
    return {};
  }

  const annotations: { invariant?: string; rationale?: string; verifiedBy?: string[] } = {};

  for (const match of normalizeLineEndings(description).matchAll(BUSINESS_RULE_ANNOTATION_PATTERN)) {
    const label = match[1]?.toLowerCase();
    const rawValue = match[2] ?? '';
    if (label === undefined) continue;

    if (label === 'verified by') {
      const verifiedBy = rawValue
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      if (verifiedBy.length > 0) annotations.verifiedBy = verifiedBy;
      continue;
    }

    const normalized = normalizeAnnotationText(rawValue);
    if (!normalized) continue;
    if (label === 'invariant') annotations.invariant = normalized;
    else if (label === 'rationale') annotations.rationale = normalized;
  }

  return annotations;
}

export function deduplicateScenarioNames(
  scenarioNames: readonly string[],
  verifiedBy: readonly string[] | undefined,
): string[] {
  const seen = new Map<string, string>();
  for (const name of scenarioNames) {
    const key = name.toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, name);
  }
  if (verifiedBy !== undefined) {
    for (const name of verifiedBy) {
      const key = name.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, name);
    }
  }
  return [...seen.values()];
}
```

**Deletions:** `pattern-helpers.internal.ts:340-425` (the `normalizeAnnotationText` private + both functions); `business-rules.internal.ts:535-602`. Both files import from the new shared module. The behavior unification is to **always** `normalizeLineEndings` first (governance behavior) — this is a bugfix-by-consolidation, not a regression: pattern-helpers's previous lack of normalization was a latent bug on Windows-line-ending descriptions.

#### 2.2.2 `getPatternName` (H-PROJ-Q-3, M-PROJ-A-5)

Three copies. Canonical: `projections/_shared/pattern-helpers.internal.ts:77-79`. **Delete** `projections/governance/governance-shared.internal.ts:33-35`. Update governance projection files to import from `_shared`. Search for inline `pattern.patternName ?? pattern.name` and replace 1:1.

#### 2.2.3 `createStatusCounts` (H-PROJ-Q-4) — perf-gate hot path

Two copies at `delivery-reporting/index.ts:219-227` and `operational-insights/index.ts:534-543`. Both run 4 sequential `Array.filter` passes. Single-pass version below in §2.3.

**New file:** `projections/_shared/status-counts.internal.ts` — content is the single-pass version (§2.3). Delete both copies; both files import from the new module. `StatusCounts` type lives next to the function.

#### 2.2.4 Renderer tabular helpers (H-PROJ-Q-5)

Currently duplicated verbatim between `render-markdown.ts:1624-1693` and `render-ui.ts:602-648` (`isBlockArray`, `toTabularRows`, `getTabularColumns`, `isPrimitiveLike`). After the §2.1 split, `isBlockArray`/`toTabularRows`/`getTabularColumns` land in `markdown/generic-fragment.ts` next to `renderRecordArrayTable`; extract instead to:

**New file:** `renderers/_shared/tabular.ts`

```ts
import type { Block } from '../../blocks/schema.js';
import { isBlock } from '../../blocks/schema.js';
import { isPrimitive } from '../../_internal/format-utils.js';

export type Primitive = string | number | boolean;
export type PrimitiveLike = Primitive | readonly Primitive[];
export type TabularRow = Readonly<Record<string, PrimitiveLike | undefined>>;

export function isBlockArray(value: unknown): value is Block[] {
  return Array.isArray(value) && value.every(isBlock);
}

export function isPrimitiveLike(value: unknown): value is PrimitiveLike {
  return isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive));
}

export function toTabularRows(value: unknown): TabularRow[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rows: TabularRow[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return null;
    const row: Record<string, PrimitiveLike | undefined> = {};
    for (const [key, fieldValue] of Object.entries(entry as Record<string, unknown>)) {
      if (key === 'kind') continue;
      if (fieldValue !== undefined && !isPrimitiveLike(fieldValue)) return null;
      row[key] = fieldValue as PrimitiveLike | undefined;
    }
    rows.push(row);
  }
  return rows;
}

export function getTabularColumns(rows: readonly TabularRow[]): string[] {
  const columns = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (key !== 'kind') columns.add(key);
    }
  }
  return [...columns].sort((left, right) => left.localeCompare(right));
}
```

Markdown's `render-markdown.ts:1632-1646` (`getTabularColumns`) had an extra `if (key === 'kind') continue` guard inside `Object.entries` that ui's copy lacked but only at the `getTabularColumns` site — ui's `toTabularRows` already strips `kind`, so the columns set never contains it. Unifying on the markdown-version logic is the safe pick.

#### 2.2.5 Fuzzy-match + `extractFirstSentenceRaw` (H-PROJ-A-6, M-PROJ-6)

Cross-package duplicate of core. **Wait for core's CL-CORE-16/17** to land canonical implementations + tests in `@libar-dev/architect-core`, then delete `pattern-helpers.internal.ts:274-286` (`extractFirstSentenceRaw`) and `:427-514` (`suggestPattern`/`findBestMatch`/`scoreMatch`/`levenshteinDistance`) and import from core. No new file in projection.

#### 2.2.6 Slug-trio (H-PROJ-A-7) — cross-renderer parity defect

Three slug functions with different behaviour:
- `_internal/slug.ts#slugForFilename` — camelCase-aware (splits `BusinessRuleSet` → `business-rule-set`)
- `governance/governance-shared.internal.ts#slugify` — non-splitting (`BusinessRuleSet` → `businessruleset`)
- `architect-core#slugify` — third variant

`render-markdown.ts` uses `slugForFilename`; `render-ui.ts` uses something else. **Real defect:** same pattern produces different anchors in markdown vs UI.

**Recipe:**
1. Canonicalize on `_internal/slug.ts#slugForFilename`.
2. Delete `governance-shared.internal.ts:50-56#slugify`; replace its 2 governance call sites with `slugForFilename`.
3. Audit `architect-core#slugify` separately (cross-package — flag in core).
4. Promote `_internal/slug.ts` to `shared/slug.ts` (L-PROJ-A-6 already flags `_internal/` cross-module usage as a smell).

**Diff at governance call sites:** `slugify(group.tag)` → `slugForFilename(group.tag)`. Behaviour difference is intentional — governance previously emitted lowercased-concatenated slugs; now slugs are dash-delimited, matching markdown anchors. **This is a no-BC behaviour change** for whoever consumes governance taxonomy anchors directly. Per doctrine, that's correct.

#### 2.2.7 `ProjectDocumentationBundleOptions` dual schema (H-PROJ-A-8, M-PROJ-5)

`documentation-bundle.internal.ts` ships `ProjectDocumentationBundleOptionsSchema` (typed via `z.custom`) **and** `RawProjectDocumentationBundleOptionsSchema` (plain `z.string()`). Only the raw schema is used at the trust boundary; the typed version is dead. **Recipe:** delete the typed schema and its `ProjectDocumentationBundleOptions` type; `assertSupportedDocumentType` dispatches inside the projection from the parsed `string`. Update barrel exports.

#### 2.2.8 `normalizeLineEndings` (M-PROJ-A-6)

Duplicates core's `utils/string-utils.ts:101`. **Recipe:** delete `governance-shared.internal.ts:37-39` after core re-exports `normalizeLineEndings` from its public surface. If core doesn't expose it yet, the `_shared/text-normalize.internal.ts` mentioned in §2.2.1 owns it locally; either is acceptable.

---

### 2.3 `createStatusCounts` 4-pass filter → single-pass tally (H-PROJ-Q-4)

Perf-gate hot path — called from `buildOverviewDigest` (1 call), `buildPhaseProgress` (1 call per phase), `buildStatusDistribution` (1 call), `buildQuarterEntries` (1 call per quarter), `buildReleaseEntries` (1 call per release), `buildTimelineBundle` (1+N calls). On the 36-pattern × 108-rule fixture this fires roughly 20–40 times per gate run; each pass allocates an intermediate filtered array it never uses.

**Before** (`operational-insights/index.ts:534-544`, identical at `delivery-reporting/index.ts:219-227`):

```ts
function createStatusCounts(
  patterns: readonly ExtractedPattern[],
): ProjectionContext['graph']['counts'] {
  return {
    completed: patterns.filter((p) => isPatternComplete(p.status)).length,
    active: patterns.filter((p) => isPatternActive(p.status)).length,
    planned: patterns.filter((p) => isPatternPlanned(p.status)).length,
    candidate: patterns.filter((p) => p.status === 'candidate').length,
    total: patterns.length,
  };
}
```

**After** (`projections/_shared/status-counts.internal.ts`):

```ts
/**
 * @architect-bounded-context:_shared
 */
import {
  isPatternActive,
  isPatternComplete,
  isPatternPlanned,
  type ExtractedPattern,
} from '@libar-dev/architect-core';

export interface StatusCounts {
  readonly completed: number;
  readonly active: number;
  readonly planned: number;
  readonly candidate: number;
  readonly total: number;
}

export function createStatusCounts(patterns: readonly ExtractedPattern[]): StatusCounts {
  let completed = 0;
  let active = 0;
  let planned = 0;
  let candidate = 0;

  for (const pattern of patterns) {
    if (isPatternComplete(pattern.status)) completed++;
    if (isPatternActive(pattern.status)) active++;
    if (isPatternPlanned(pattern.status)) planned++;
    if (pattern.status === 'candidate') candidate++;
  }

  return { completed, active, planned, candidate, total: patterns.length };
}
```

**Notes:** 4 passes → 1 pass, zero intermediate allocations, behaviour preserved exactly (the four predicates are independently disjoint — `candidate` is its own bucket and `isPatternPlanned` excludes it, so the parallel-counter form does not double-count). `StatusCounts` becomes the type both consumers import; `ProjectionContext['graph']['counts']` continues to be structurally compatible.

---

### 2.4 `filterPatterns` no-filter copy elimination (H-PROJ-Q-6)

`projections/_shared/filter.ts:22-29` allocates `[...patterns]` on every no-filter call. Phase 1 inventories 14 hot call sites. The defensive copy serves no caller — callers receive an array they then iterate, sort (into a new array), or pass back through `.filter()`. Hand-mutation would already be caught by `readonly ExtractedPattern[]` typing on the input.

**Before:**

```ts
export function filterPatterns(
  patterns: readonly ExtractedPattern[],
  filter: ProjectionFilter | undefined,
): ExtractedPattern[] {
  return filter === undefined
    ? [...patterns]
    : patterns.filter((pattern) => filterPattern(pattern, filter));
}
```

**After:**

```ts
export function filterPatterns(
  patterns: readonly ExtractedPattern[],
  filter: ProjectionFilter | undefined,
): readonly ExtractedPattern[] {
  if (filter === undefined) return patterns;
  return patterns.filter((pattern) => filterPattern(pattern, filter));
}
```

**Caller-side audit:** all 14 call sites already use the result read-only — they spread into `new Map`, iterate via `for…of`, or pass through `.filter`/`.map`/`.sort` (which produces a new array). The `readonly` return type makes the contract explicit; any current caller that mutates the result was already wrong. One callsite at `resolvePatternsForRole` (`operational-insights/index.ts:521-531`) chains `.filter(...)` — that creates a new array, so no change needed.

**Why this is the doctrine-aligned move:** core's H-CORE-8 (27× `structuredClone` on the read API) is the upstream analogue; deleting projection's defensive copy is the downstream half. **Land both before re-baselining the perf budget** (after C-PROJ-3 makes the gate real).

---

### 2.5 `BundleRouting` / `ProjectionBundle<T>` → `z.infer` from a generic schema factory (H-PROJ-A-4, M-PROJ-4, M-PROJ-A-2)

`fragments/base.ts:6-31` defines hand-written `BundleRouting` and `ProjectionBundle<T>` interfaces; `:33-101` defines a 70-LOC hand-coded `isBundle` / `isRoutingLike` chain that re-implements schema validation. Same anti-pattern as core's C-CORE-2.

**After:** `fragments/base.ts`

```ts
import { z } from 'zod';

import { DisclosureSpecSchema } from '../disclosure/spec.js';
import { LogicalRouteIdSchema } from '../routing/route-id.js';

import type { Fragment, FragmentSchema } from './fragment-schema.internal.js';

export const BundleRoutingSchema = z.strictObject({
  rootRouteId: LogicalRouteIdSchema,
  childRouteIds: z.record(z.string(), LogicalRouteIdSchema).readonly(),
  childPathStrategy: z.enum(['flat', 'nested']),
  anchorStrategy: z.enum(['heading-slug', 'kind-id']),
  disclosureSpec: DisclosureSpecSchema.optional(),
  markdownRootTarget: z.string().optional(),
  markdownChildDirectory: z.string().optional(),
  entityPathLayout: z.enum(['flat', 'nested-index']).optional(),
});

export type BundleRouting = z.infer<typeof BundleRoutingSchema>;

/**
 * Generic factory: derive a per-fragment bundle schema by passing the
 * fragment's own schema. The factory caches nothing — each call returns a
 * fresh schema instance, which Zod tolerates cheaply.
 */
export function projectionBundleSchema<S extends z.ZodTypeAny>(fragmentSchema: S) {
  return z.strictObject({
    root: fragmentSchema,
    children: z.record(z.string(), z.lazy(() => FragmentSchema)),
    routing: BundleRoutingSchema.optional(),
  });
}

/** The pan-fragment shape, used by renderers that don't know the root kind. */
export const ProjectionBundleSchema = projectionBundleSchema(z.lazy(() => FragmentSchema));
export type ProjectionBundle<T extends Fragment = Fragment> = {
  readonly root: T;
  readonly children: Readonly<Record<string, Fragment>>;
  readonly routing?: BundleRouting;
};

export function isBundle<T extends Fragment>(value: unknown): value is ProjectionBundle<T> {
  return ProjectionBundleSchema.safeParse(value).success;
}

export function projectSingle<T extends Fragment>(fragment: T): ProjectionBundle<T> {
  return { root: fragment, children: {} };
}
```

**What disappears:** `isFragmentLike`, `isRoutingLike`, `isOptionalString`, `isOptionalEntityPathLayout`, `isValidDisclosureSpec`, `isChildPathStrategy`, `isAnchorStrategy`, `isRouteIdValue` — ~50 LOC of hand-coded type guards collapse into `safeParse`. **The hand-written `ProjectionBundle<T>` type is retained as a thin alias** because deriving a per-`T` `z.infer` for an open generic isn't ergonomic in Zod 4 (`projectionBundleSchema(MySchema)`'s inferred type widens `root` to `Fragment` if not pinned); keeping `ProjectionBundle<T>` as a tiny structural type backed by `BundleRouting = z.infer<...>` is the right compromise.

**Doctrine check:** `BundleRoutingSchema` uses `z.strictObject` (per Phase 1 doctrine) and never `.extend()`s (avoids F4A-H-6). `z.record(z.string(), LogicalRouteIdSchema)` is a closed shape — no key drift. The `z.lazy(() => FragmentSchema)` breaks the circular import between `base.ts` and `fragment-schema.internal.ts`.

---

## 3. Medium-leverage simplifications

### 3.1 `dependency-tree.internal.ts:113` Set-clone → mutate+backtrack (M-PROJ-3)

Current `buildTreeNode` allocates `new Set(visited)` per recursion frame to maintain DFS cycle detection. The standard pattern is mutate-before-recurse / delete-after-recurse — O(1) per frame.

**Before** (`dependency-tree.internal.ts:102-159`):

```ts
if (visited.has(name)) {
  return { /* truncated leaf */ };
}

const nextVisited = new Set(visited);
nextVisited.add(name);

// ... depth check, relationship lookup, child collection ...

const children = childNames
  .filter(...)
  .map((childName) =>
    buildTreeNode(context, childName, focalName, depth + 1, maxDepth,
                  includeImplementationDeps, nextVisited),
  );

return { name, ..., children };
```

**After:**

```ts
if (visited.has(name)) {
  return { /* truncated leaf — unchanged */ };
}

visited.add(name);
try {
  // ... depth check, relationship lookup, child collection ...

  const children = childNames
    .filter(...)
    .map((childName) =>
      buildTreeNode(context, childName, focalName, depth + 1, maxDepth,
                    includeImplementationDeps, visited),
    );

  return { name, ..., children };
} finally {
  visited.delete(name);
}
```

**Why `try…finally`:** guarantees the backtrack even if `findPatternByName` or relationship lookups ever throw — preserves the invariant that `visited` matches the caller's expectation on every exit path. The cost is a tiny `try` overhead vs. allocating a fresh `Set` (O(N) copy per frame, where N is the depth of the current path). On the dependency graphs the gate exercises this is a measurable allocation win.

**Caller change:** none — `buildDependencyTreeRoot` (line 30) already passes `new Set<string>()` from a clean state and never reuses it, so the in-place mutation has no external observer.

---

### 3.2 `patternSatisfiesTag` 24-case switch → `Map<tag, accessor>` table (M-PROJ-8)

`operational-insights/index.ts:378-446`. The switch is a data-driven table dressed up as a switch — every case is `hasNonEmptyString(pattern.<field>)` or `(pattern.<field>?.length ?? 0) > 0` with three relationship-lookup outliers.

**After** (in-file or split to `_shared/pattern-tag-table.internal.ts`):

```ts
type TagAccessor = (context: ProjectionContext, pattern: ExtractedPattern) => boolean;

const stringTagAccessor = (field: keyof ExtractedPattern): TagAccessor =>
  (_, pattern) => {
    const value = pattern[field];
    return typeof value === 'string' && value.trim().length > 0;
  };

const arrayTagAccessor = (field: keyof ExtractedPattern): TagAccessor =>
  (_, pattern) => {
    const value = pattern[field];
    return Array.isArray(value) && value.length > 0;
  };

const relationshipTagAccessor =
  (read: (entry: RelationshipEntry, pattern: ExtractedPattern) => number): TagAccessor =>
  (context, pattern) => {
    const relationships = getRelationships(context, getPatternName(pattern));
    return relationships !== undefined && read(relationships, pattern) > 0;
  };

const PATTERN_TAG_ACCESSORS: ReadonlyMap<string, TagAccessor> = new Map([
  ['status',         (_, p) => p.status.length > 0],
  ['role',           stringTagAccessor('role')],
  ['arch-context',   stringTagAccessor('boundedContext')],
  ['arch-layer',     stringTagAccessor('adrLayer')],
  ['layer',          stringTagAccessor('adrLayer')],
  ['phase',          (_, p) => p.phase !== undefined],
  ['priority',       stringTagAccessor('priority')],
  ['quarter',        stringTagAccessor('quarter')],
  ['team',           stringTagAccessor('team')],
  ['effort',         stringTagAccessor('effort')],
  ['effort-actual',  stringTagAccessor('effortActual')],
  ['product-area',   stringTagAccessor('productArea')],
  ['user-role',      stringTagAccessor('userRole')],
  ['business-value', stringTagAccessor('businessValue')],
  ['workflow',       stringTagAccessor('workflow')],
  ['risk',           stringTagAccessor('risk')],
  ['release',        stringTagAccessor('release')],
  ['completed',      stringTagAccessor('completed')],
  ['target-path',    stringTagAccessor('targetPath')],
  ['since',          stringTagAccessor('since')],
  ['depends-on',     relationshipTagAccessor((r, p) => r.dependsOn.length || (p.uses?.length ?? 0))],
  ['enables',        relationshipTagAccessor((r) => r.enables.length)],
  ['uses',           arrayTagAccessor('uses')],
  ['used-by',        relationshipTagAccessor((r) => r.usedBy.length)],
  ['implements',     arrayTagAccessor('implementsPatterns')],
  ['see-also',       arrayTagAccessor('seeAlso')],
  ['api-ref',        arrayTagAccessor('apiRef')],
]);

function patternSatisfiesTag(
  context: ProjectionContext,
  pattern: ExtractedPattern,
  tag: string,
): boolean {
  const accessor = PATTERN_TAG_ACCESSORS.get(tag);
  return accessor === undefined ? true : accessor(context, pattern);
}
```

**Why this is a clarity win, not just compression:** the table makes the tag→field mapping a single inspectable artifact. Adding a new tag is one line. The three relationship-tag cases stay legible because their accessor factories name them. The `default: return true` semantics (unknown tag is satisfied) ports verbatim to `accessor === undefined`.

**Behaviour preservation:** the original `case 'depends-on'` was `(relationships?.dependsOn.length ?? pattern.uses?.length ?? 0) > 0` — the order matters (prefer `relationships.dependsOn`, fall back to `pattern.uses`). The `relationshipTagAccessor` factory receives both and replicates the same `||` short-circuit on the integer-or-0 result; equivalent.

---

### 3.3 `operational-insights/index.ts` (1,200 LOC) → split by `project*` function (M-PROJ-A-4)

Matches sibling convention from `pattern-relations/` and `execution-context/`.

**Proposed layout:**

```
src/projections/operational-insights/
├── index.ts                                    # ~80 LOC: barrel re-exports only
├── operational-insights-shared.internal.ts     # ~280 LOC: SOURCE_TYPE_PRIORITY,
│                                               #   OVERVIEW_CLI_HINTS, RequirementSourceEntry,
│                                               #   incrementTagUsage, collectSourceFileEntries,
│                                               #   resolveRequiredCoverageTags, fileSatisfiesTag,
│                                               #   patternSatisfiesTag (post-§3.2), hasNonEmptyString,
│                                               #   categorizeFile, deriveLocationPattern,
│                                               #   resolveRoleDefinition, createRoleProfile,
│                                               #   resolvePatternsForRole,
│                                               #   createRequirementSourceEntries,
│                                               #   createRequirementProjectionSourceData,
│                                               #   createRequirementDigest,
│                                               #   dedupeBusinessRuleReferences,
│                                               #   createBusinessRuleReferencesForPattern,
│                                               #   resolveRequirementPatterns,
│                                               #   compareNormalizedStatus,
│                                               #   createRequirementEntry,
│                                               #   createRequirementOwnerRouteId,
│                                               #   buildRequirementDescription,
│                                               #   resolveRequirementTestFiles,
│                                               #   ARCHITECT_RELEASE_RE, ARCHITECT_DESIGN_TIER_RE,
│                                               #   isPlannedStatus,
│                                               #   createBucketedRequirementDigest,
│                                               #   resolveRequirementBucket, usesFlatSpecsRoute,
│                                               #   createRequirementChildRouteIdForBucket
├── annotation-coverage.internal.ts             # ~50 LOC: buildAnnotationCoverage
├── annotation-coverage.ts                      # ~30 LOC: parseAndProjectAnnotationCoverage,
│                                               #          projectAnnotationCoverage
├── overview-digest.internal.ts                 # ~60 LOC: buildOverviewDigest
├── overview-digest.ts                          # ~30 LOC: parseAndProjectOverviewDigest,
│                                               #          projectOverviewDigest
├── requirement-digest.internal.ts              # ~30 LOC: buildRequirementDigest +
│                                               #          projectBucketedRequirementDigest
├── requirement-digest.ts                       # ~80 LOC: parseAndProject*,
│                                               #          projectRequirementDigest,
│                                               #          projectRequirementExecutableDigest,
│                                               #          projectRequirementSpecsDigest
├── role-profile.internal.ts                    # ~30 LOC: buildRoleProfile, buildRoleProfiles
├── role-profile.ts                             # ~40 LOC: parseAndProject*,
│                                               #          projectRoleProfile, projectRoleProfiles
├── source-inventory.internal.ts                # ~40 LOC: buildSourceInventory
├── source-inventory.ts                         # ~30 LOC: parseAndProjectSourceInventoryDigest,
│                                               #          projectSourceInventoryDigest
├── tag-usage.internal.ts                       # ~40 LOC: buildTagUsageMatrix
└── tag-usage.ts                                # ~30 LOC: parseAndProjectTagUsage,
                                                #          projectTagUsage
```

The pattern matches `pattern-relations/`: every public `project*` has its own `.ts` + `.internal.ts` pair. `*.internal.ts` is **not** re-exported from `index.ts`; `*.ts` files are. Shared helpers live in `operational-insights-shared.internal.ts` (matches `governance/governance-shared.internal.ts` / `execution-context/execution-context-shared.internal.ts`).

---

### 3.4 `delivery-reporting/index.ts` (742 LOC) → split by `project*` function (M-PROJ-A-4)

```
src/projections/delivery-reporting/
├── index.ts                                    # barrel re-exports only
├── delivery-reporting-shared.internal.ts       # createTimelineBundle, buildQuarterEntries,
│                                               # buildReleaseEntries, buildUnreleasedEntries,
│                                               # buildTaggedReleaseEntries,
│                                               # buildQuarterFallbackEntries,
│                                               # buildEarlierFallbackEntries, createReleaseEntry,
│                                               # deduplicateDeliverables, buildTraceRows,
│                                               # getTimelineRouting, createChildren, sortPatterns,
│                                               # deduplicatePatterns, deduplicateStrings,
│                                               # getDeliveryTotal, calculateDeliveryPercentage,
│                                               # compareQuarterLabels, parseQuarterLabel
├── phase-progress.internal.ts                  # buildPhaseProgress
├── phase-progress.ts                           # parseAndProject* + projectPhaseProgress
├── status-distribution.internal.ts             # buildStatusDistribution
├── status-distribution.ts                      # projectStatusDistribution
├── roadmap-timeline.internal.ts                # buildTimelineBundle
├── roadmap-timeline.ts                         # projectRoadmapTimeline, projectCompletedMilestones,
│                                               # projectCurrentWork
├── release-notes.internal.ts                   # buildReleaseNotes
├── release-notes.ts                            # projectReleaseNotesDigest
├── traceability-matrix.internal.ts             # buildTraceabilityMatrix
└── traceability-matrix.ts                      # projectTraceabilityMatrix
```

`createStatusCounts` does **not** live here post-§2.2.3 — it has moved to `projections/_shared/status-counts.internal.ts`. Both `delivery-reporting-shared.internal.ts` and the per-projection `*.internal.ts` files import it.

---

### 3.5 `pattern-helpers.internal.ts` (515 LOC, 13 exports, 7 concerns) split by concern (M-PROJ-A-3)

After §2.2.1, §2.2.5, and §2.2.6 land, the remaining concerns are:

| Concern | Functions | Destination |
|---------|-----------|-------------|
| Pattern lookup + identity | `getPatternName`, `requirePattern`, `getRelationships`, `resolveIndexedEntry` | `projections/_shared/pattern-lookup.internal.ts` |
| Pattern → fragment normalization | `createPatternSummaryFragment`, `normalizePatternRelationships`, `normalizeDeliverables`, `buildPatternHierarchy`, `normalizeRules`, `resolveStubRefs`, `normalizeImplementationRef`, `resolveTestRefs`, `deriveSource` | `projections/_shared/pattern-normalize.internal.ts` |
| Description-text parsing | `extractDescription`, `extractOpenQuestions` (+ `extractFirstSentenceRaw` if core doesn't yet expose it) | `projections/_shared/description-text.internal.ts` |
| Misc | `uniqueSortedStrings`, `isDefined` | `projections/_shared/collection-utils.internal.ts` (or absorb into core's utils as L-CORE-3 sibling) |

Business-rule annotations live in `_shared/business-rule-annotations.internal.ts` (§2.2.1).

**Result:** four ~80-120 LOC files of cohesive concerns, all imported via the same `projections/_shared/` namespace. Call-site changes are import-path only.

---

## 4. Sweep patterns (recurring shapes worth fixing in batch)

| # | Pattern | Where | Recipe |
|---|---------|-------|--------|
| SW-1 | **Regex hoisted into module scope** (L-PROJ-4, L-PROJ-6) | `pattern-helpers.internal.ts:219-220, 236, 279, 363-364`; `render-markdown.ts:1972-1985` (`escapePlainMarkdownLine`); `routing/route-id.ts:26` (already hoisted — exemplar) | Promote all `RegExp` literals declared inside hot-path functions to `const FOO_RE = /…/` at module scope. Engines cache, but the explicit pattern documents stability and trims hot-path setup. |
| SW-2 | **`humanizeKey` / `stableStringify` consolidation** | Currently in `_internal/format-utils.ts`; used cross-module by `render-markdown.ts:19`, `render-ui.ts:22` | Move `_internal/format-utils.ts` → `shared/format-utils.ts` (matches L-PROJ-A-6 recommendation). `_internal/` should be reserved for module-local primitives, not cross-module shared utils. |
| SW-3 | **Slug canonicalization** (H-PROJ-A-7) | See §2.2.6 | Canonicalize on `slugForFilename`; delete `governance/governance-shared.internal.ts#slugify`; promote `_internal/slug.ts` → `shared/slug.ts`. |
| SW-4 | **Set-clone DFS pattern** | `dependency-tree.internal.ts:113` (M-PROJ-3, see §3.1); audit other recursive traversals for the same shape | The mutate+backtrack form (try/finally) is correct everywhere DFS visits unique nodes. Search `new Set(visited)` and `new Set(seen)` family-wide. |
| SW-5 | **`(?: pattern.<field>?.length ?? 0) > 0`** repeated | All over `operational-insights/index.ts` `patternSatisfiesTag` and `dependency-tree.internal.ts:120-121` (`relationships.enables.length > 0 \|\| (… && relationships.usedBy.length > 0)`) | Add `hasItems(arr: readonly T[] \| undefined): boolean` to `_shared/collection-utils.internal.ts`; one inline reads `hasItems(pattern.uses)`. |
| SW-6 | **`as keyof typeof FOO` after `Set.has` narrowing** (C-CORE-5 pattern, M-PROJ-1) | `session-context.internal.ts:264`, `scope-readiness.internal.ts:164` | After core exports `isValidProcessStatus` as a type predicate, replace both casts with the predicate. No projection-local work required first. |
| SW-7 | **`Array.from({ length: n }, …)` allocator** (L-PROJ-5) | `pattern-helpers.internal.ts:496` (Levenshtein) — moves away when CL-CORE-16/17 lands | Pre-allocate with `new Array<number>(n+1)` and a `for` init loop. Only matters at hot-path scale; deprioritized vs. §2.3/§2.4. |
| SW-8 | **`projectionBundleSchema` factory adoption** | Per-fragment schemas can use `projectionBundleSchema(MyFragmentSchema)` to derive their own bundle shape | Optional follow-up: every `project*` entrypoint with a per-fragment bundle gets a `MyFragmentBundleSchema` typed as `projectionBundleSchema(MyFragmentSchema)`. Useful at MCP boundary for stricter parse-at-boundary checks but not load-bearing. |
| SW-9 | **`parseAndProject` sentinel value** | `_shared/parse-and-project.internal.ts:9, 26, 32-34` | Drop the `NO_DEFAULT_RAW_OPTIONS` symbol; accept the default as an options object `{ default?: unknown }` or split into `parseAndProject` and `parseAndProjectWithDefault`. Cleaner public contract; ~5 LOC drop. |
| SW-10 | **`open-question-list.ts:38` ZodError bypass** (C-PROJ-2) | Single site; recipe in Phase 1 (§Critical). Mentioned here because it's a sweep target for `options-schema-barrel-audit.mjs` extension: enforce that every `parseAndProject*` calls the shared helper. |

---

## 5. Recommended landing order

Ordered for minimum-rework with maximum dependency safety. Each step assumes the prior step landed.

1. **§2.4 `filterPatterns` no-filter copy elimination** (H-PROJ-Q-6). One-file change; opaque to callers; `readonly` return tightens the contract. No dependencies. Land first.
2. **§2.3 `createStatusCounts` single-pass + §2.2.3 consolidation** (H-PROJ-Q-4). One new `_shared/status-counts.internal.ts`; delete two copies; update two import sites. Independent of step 1; lands in parallel.
3. **§3.1 `dependency-tree` mutate+backtrack** (M-PROJ-3). Single-function refactor; no caller change. Lands in parallel.
4. **§2.2.2 `getPatternName` consolidation** (H-PROJ-Q-3) + **§2.2.8 `normalizeLineEndings` consolidation** (M-PROJ-A-6). Trivial; opens the door for §2.2.1 and §3.5.
5. **§2.2.1 `parseBusinessRuleAnnotations` + `deduplicateScenarioNames`** consolidation (H-PROJ-Q-2). Requires §2.2.8 to already host `normalizeLineEndings`.
6. **§3.2 `patternSatisfiesTag` table** (M-PROJ-8). Self-contained in `operational-insights/index.ts`. Prepares the file for the §3.3 split.
7. **§2.5 `BundleRouting` / `ProjectionBundle<T>` Zod schema** (H-PROJ-A-4 / M-PROJ-4 / M-PROJ-A-2). Touches `fragments/base.ts` only; `isBundle` callers downstream (`render-markdown.ts:38, 227`, MCP tool registry) are unaffected because the signature is identical. Land before §2.1 split, since the §2.1 split imports `isBundle` and the type is exercised by every renderer.
8. **§2.2.4 renderer tabular helpers extraction** (H-PROJ-Q-5). New `renderers/_shared/tabular.ts`; both renderers update imports. Land before §2.1 split because the markdown renderer will need to import these helpers from the new shared location in the new normalizer files.
9. **§2.2.6 slug-trio canonicalization** (H-PROJ-A-7). Behaviour change on governance anchors — flag in release notes; this is a no-BC win. Land before §2.1 split so the new normalizer files import the canonical slug.
10. **§3.4 `delivery-reporting/index.ts` split** (M-PROJ-A-4). Self-contained; uses the new `_shared/status-counts.internal.ts` from step 2.
11. **§3.3 `operational-insights/index.ts` split** (M-PROJ-A-4). Uses §3.2's table; uses `_shared/status-counts.internal.ts` from step 2.
12. **§3.5 `pattern-helpers.internal.ts` split** (M-PROJ-A-3). Touches every consumer of pattern-helpers — sweep import paths. Land **after** §2.2.1 (which already removed `parseBusinessRuleAnnotations`/`deduplicateScenarioNames` from it).
13. **§2.1 `render-markdown.ts` 4-way split** (H-PROJ-A-5, H-PROJ-Q-8). The biggest single change; lands last because every prior step trims its surface area. Update the 5-AST-selector `TRUSTED_MARKDOWN` lint rule to cover `markdown/trusted-markdown.ts` as part of the same PR.
14. **§2.2.7 `ProjectDocumentationBundleOptions` dual-schema deletion** (H-PROJ-A-8 / M-PROJ-5). Independent of all renderer/projection work; can be slotted anywhere.
15. **Cross-package deletions waiting on core (§2.2.5 fuzzy-match + `extractFirstSentenceRaw`)** (H-PROJ-A-6 / M-PROJ-6). Block on core's CL-CORE-16/17.

Steps 1-3 are mechanical and can land same-PR; 4-6 are short focused PRs; 7-9 are medium; 10-13 each warrant their own PR (large file moves); 14-15 are independent.

---

## 6. What's already clean — do not refactor

These are exemplary and should be **preserved**, not "improved":

1. **`projections/_shared/filter.ts`** (40 LOC). Pure, focused, `z.strictObject` + `z.infer`, no duplication. Once §2.4's `readonly` tightening lands, this file is a model for the rest of `_shared/`.
2. **`renderers/_shared/dispatch.ts`** (`StrictKindTable<Out, Options, Kinds>` + `dispatchByKind`). Real type-system work that catches missing normalizers at compile time. The dispatch primitive itself does not need touching; only the kind-list it's parameterized over (Phase 1's M-PROJ-A-10 covers that).
3. **`renderers/render-json.ts`**. Exhaustive defensive validation (rejects `bigint`/`function`/`symbol`/`Date`/`Map`/`Set`/`NaN`/`Infinity` with JSON-path messages). Fail-loud, codec-agnostic, no per-fragment branches. Leave alone.
4. **`routing/route-id.ts`** (127 LOC). Schema + type predicate + parser + factory functions, all consistent, all using a single hoisted regex (`ROUTE_SEGMENT_PATTERN`). Phase 1 M-PROJ-A-8 flags `LogicalRouteId` as a type-literal/`tryParseLogicalRouteId`/schema "drift" candidate, but the three live in 30 lines next to each other and the failure modes match — keep as-is.
5. **`disclosure/spec.ts`** (60 LOC). `z.strictObject` + every field `.describe()`-annotated. Compact, deductive, doctrine-aligned. Only follow-up is H-PROJ-A-2 (move `ProjectionFilterSchema` here from `projections/_shared/filter.ts` to break the layering inversion) — that's already on the Phase 1 list and isn't a simplification.

---

## Cross-references

- Phase 1 raw findings: `/Users/darkomijic/dev-projects/architect/.full-review/architect-projection/01-quality-architecture.md`
- Sibling-convention exemplars: `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/`, `…/execution-context/`
- Core's downstream prerequisites: `/Users/darkomijic/dev-projects/architect/.full-review/architect-core/05-package-report.md` (CL-CORE-16/17 for §2.2.5; C-CORE-5 / `isValidProcessStatus` export for SW-6)
- Doctrine: `/Users/darkomijic/dev-projects/architect/AGENTS.md` (no-BC; Zod-first; `z.strictObject`; TS strictness flags retained)
