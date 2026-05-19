# Architecture Review — `@libar-dev/architect-projection`

Scope: 146 TS files, ~15.3k LOC. Anchored to ADR-005 (Codec / Renderer
Separation), ADR-006 (Single Read Model), and ADR-009 (Projection Trust
Boundary). Engineering doctrine: No-BC, Zod-first strict objects, no circular
imports, barrel hygiene.

The package is, on the whole, in good architectural shape. Trust-boundary
discipline (`parseAndProject*`) is enforced uniformly; runtime parses on hot
paths total exactly **two** call sites (both at module-load time on static
data); the JSON renderer is a clean codec-agnostic recursion; URL sanitization
in the markdown renderer is the documented chokepoint that ADR-009 expects;
no circular imports; no direct reaches into `architect-core/src/extractor` or
`architect-core/src/scanner`. Findings below are concentrated in a handful of
ADR-006 re-derivation hotspots, one architectural drift from ADR-005's IR
contract, and a small set of barrel / typing inconsistencies.

---

## Critical

### C1. Re-derived Relationship anti-pattern — fallback to raw `pattern.uses` / `pattern.implementsPatterns` in `normalizePatternRelationships`

**Severity:** Critical
**ADR / doctrine at stake:** ADR-006 — "Three named anti-patterns" Rule
(Re-derived Relationship); the shared helper that every pattern-relations
fragment composes.

**Evidence**
`packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts:117-153`

```ts
export function normalizePatternRelationships(
  context: ProjectionContext,
  patternName: string,
): PatternRelationships {
  const pattern = requirePattern(context, patternName);
  const relationships = getRelationships(context, patternName);

  if (relationships === undefined) {
    return {
      dependsOn: [...(pattern.uses ?? [])],
      enables: [],
      uses: [...(pattern.uses ?? [])],
      usedBy: [],
      implementsPatterns: [...(pattern.implementsPatterns ?? [])],
      implementedBy: [],
      ...(pattern.extendsPattern !== undefined ? { extendsPattern: pattern.extendsPattern } : {}),
      extendedBy: [],
      seeAlso: [...(pattern.seeAlso ?? [])],
      apiRef: [...(pattern.apiRef ?? [])],
    };
  }
  ...
}
```

The PatternGraph contract (`packages/architect-core/src/validation-schemas/pattern-graph.ts:118`)
declares `relationshipIndex` as a **required** Zod field — every pattern is
guaranteed to appear. The `if (relationships === undefined)` branch is either:

1. Unreachable in practice — dead code preserving an old defensive habit,
   OR
2. Hit when `requirePattern` finds a pattern by fuzzy/case-insensitive lookup
   while the index lookup uses the canonical key — in which case the function
   silently returns a **lossy half-derived view** (no `usedBy`, no
   `implementedBy`, no `enables`, no `extendedBy`) that downstream fragment
   consumers cannot distinguish from a legitimately edge-less pattern.

ADR-006 calls this out explicitly: *"Building Map or Set from
pattern.implementsPatterns, uses, or dependsOn in consumer code"*.

**Recommended improvement.** Drop the fallback. If a pattern resolves through
`requirePattern` but not through the index, that is a graph-integrity error
(mismatch between `graph.patterns` and `graph.relationshipIndex`) and should
throw `PATTERN_NOT_FOUND` or a new `RELATIONSHIP_INDEX_DESYNC` code, not paper
over the inconsistency with a synthesized partial view. The
`requirePattern` / `getRelationships` lookups already share their normalization
keys; align them on the canonical key returned by `requirePattern`.

**Trade-offs.** A strict-throw stance is slightly riskier for callers that
pass non-canonical names. Acceptable: the same risk already exists for
`relationships.implementedBy`/`usedBy` which the index is the sole source of
truth for. No reason to accept it asymmetrically just for forward edges.

---

### C2. Re-derived Relationship anti-pattern — `getAffectedPatterns` builds set from raw pattern arrays

**Severity:** Critical
**ADR / doctrine at stake:** ADR-006 Re-derived Relationship.

**Evidence**
`packages/architect-projection/src/projections/governance/decision-records.internal.ts:244-254`

```ts
function getAffectedPatterns(pattern: ExtractedPattern): string[] {
  const values = [
    ...(pattern.uses ?? []),
    ...(pattern.implementsPatterns ?? []),
    ...(pattern.seeAlso ?? []),
    ...(pattern.apiRef ?? []),
    ...(pattern.extendsPattern !== undefined ? [pattern.extendsPattern] : []),
  ];

  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
```

This is the textbook anti-pattern named in ADR-006: a `Set` built from
`pattern.uses`, `pattern.implementsPatterns`, `pattern.seeAlso`,
`pattern.apiRef`. The exact data lives one indirection away in
`relationshipIndex[patternName]` (which also carries the index-resolved,
de-duplicated form), so this helper duplicates resolution that the read
model already performs.

**Recommended improvement.** Replace with
`const rel = getRelationships(context, getPatternName(pattern))` and merge
`rel.uses | rel.implementsPatterns | rel.seeAlso | rel.apiRef`. Pass
`ProjectionContext` instead of the bare `ExtractedPattern`.

**Trade-offs.** A signature change for the helper; trivial inside the
internal module. No public surface impact.

---

### C3. Re-derived Relationship anti-pattern — `hasRelationshipField` falls back from index to raw `pattern.uses` length

**Severity:** Critical
**ADR / doctrine at stake:** ADR-006 Re-derived Relationship; worse than C2
because it actively prefers raw over the index when the index says zero.

**Evidence**
`packages/architect-projection/src/projections/operational-insights/index.ts:423-442`

```ts
case 'depends-on': {
  const relationships = getRelationships(context, getPatternName(pattern));
  return (relationships?.dependsOn.length ?? pattern.uses?.length ?? 0) > 0;
}
case 'enables': {
  const relationships = getRelationships(context, getPatternName(pattern));
  return (relationships?.enables.length ?? 0) > 0;
}
case 'uses':
  return (pattern.uses?.length ?? 0) > 0;
...
case 'implements':
  return (pattern.implementsPatterns?.length ?? 0) > 0;
case 'see-also':
  return (pattern.seeAlso?.length ?? 0) > 0;
case 'api-ref':
  return (pattern.apiRef?.length ?? 0) > 0;
```

Three failure modes in one switch:

- `depends-on` short-circuits on `relationships?.dependsOn.length` — but the
  `?? pattern.uses?.length` fallback fires when the index returns **zero**,
  not when it's missing, so a pattern with zero indexed dependencies but
  non-zero `pattern.uses` gets a `true` answer that contradicts the read
  model. (This is the contradiction-papering form of the anti-pattern.)
- `uses`, `implements`, `see-also`, `api-ref` skip the index entirely.

**Recommended improvement.** Route every case through `getRelationships(...)`
and use `relationships.uses`, `relationships.implementsPatterns`,
`relationships.seeAlso`, `relationships.apiRef`. Drop the `?? pattern.uses?.length`
shim; if the index disagrees with the raw array, the index wins (the index is
post-resolution and post-deduplication).

**Trade-offs.** This is the same shape as C1's resolution; treating both
together keeps the helper's contract uniform.

---

## High

### H1. `findStubPatterns` reverse-walks `implementsPatterns` on raw graph

**Severity:** High
**ADR / doctrine at stake:** ADR-006 Re-derived Relationship.

**Evidence**
`packages/architect-projection/src/projections/execution-context/scope-readiness.internal.ts:335-347`

```ts
function findStubPatterns(
  context: ProjectionContext,
  implementedPattern: string,
): ExtractedPattern[] {
  const lowerImplementedPattern = implementedPattern.toLowerCase();
  return context.graph.patterns.filter(
    (pattern) =>
      pattern.source.file.includes('/stubs/') &&
      (pattern.implementsPatterns ?? []).some(
        (entry) => entry.toLowerCase() === lowerImplementedPattern,
      ),
  );
}
```

This is a reverse-relationship walk: "find every pattern that implements
`X` and lives under `/stubs/`". That reverse direction is exactly what
`relationshipIndex[X].implementedBy` is precomputed for. The current code
case-insensitively scans every pattern in the graph on every call —
O(N) per lookup, plus it reproduces relationship-resolution semantics that
already live in `architect-core/src/generators/pipeline/relationship-resolver.ts`.

**Recommended improvement.** Use `getRelationships(context, implementedPattern).implementedBy`,
then filter by `/stubs/` on the resolved file path. Eliminates the O(N) scan
and removes the duplicated case-insensitive matching logic.

**Trade-offs.** None of consequence. `implementedBy` entries already carry
the stub file path.

---

### H2. ADR-005 IR contract drift — there is no shared `RenderableDocument` IR; the markdown renderer dispatches on fragment kind via 10 bespoke normalizers

**Severity:** High
**ADR / doctrine at stake:** ADR-005 Rule 2 ("RenderableDocument is a typed
intermediate representation") and Rule 5 ("Renderer is codec-agnostic").
The current code lives in a documented intermediate state per
`packages/architect-projection/docs/MIGRATION.md`, so this is drift from
the *declared decision*, not a previously-undocumented mistake.

**Evidence**
`packages/architect-projection/src/renderers/render-markdown.ts:208-219`

```ts
const MARKDOWN_NORMALIZERS = {
  ArchitectureDiagram: normalizeArchitectureDiagram,
  BusinessRuleSet: normalizeBusinessRuleSet,
  DecisionCatalog: normalizeDecisionCatalog,
  DecisionRecord: normalizeDecisionRecord,
  RoadmapTimeline: normalizeRoadmapTimeline,
  ReleaseNotesDigest: normalizeReleaseNotesDigest,
  RequirementDigest: (fragment, options) => normalizeRequirementDigest(fragment, options),
  TaxonomyDigest: normalizeTaxonomyDigest,
  TraceabilityMatrix: normalizeTraceabilityMatrix,
  ValidationRuleDigest: normalizeValidationRuleDigest,
} satisfies StrictKindTable<MarkdownDocument, NormalizeMarkdownOptions, MarkdownNormalizerKind>;
```

ADR-005 specifies that the renderer "accepts any RenderableDocument
regardless of which codec produced it. Rendering depends only on block
types, not on document origin." The current implementation:

- Has no `RenderableDocument` schema — `blocks/schema.ts` defines `Block`,
  but no top-level document/section IR is shared across renderers.
- Markdown, JSON, compact-text, and UI each carry their own
  per-renderer document type (`MarkdownDocument`, `JsonObject`,
  `UiDocument`, raw string output).
- Markdown rendering for the 10 governance/delivery-reporting/documentation-
  composition fragment kinds is fragment-aware and lives inside the renderer
  (1700+ LOC of fragment-specific logic), violating Rule 5.
- The "embedded sections" backdoor at `render-markdown.ts:1094-1106` reads
  `fragment.sections` via reflection (`(fragment as Record<string, unknown>)['sections']`)
  and falls through to the codec-agnostic generic path when present — so the
  package *already* has a partial RenderableDocument shape
  (`DocumentationSection { id, title, blocks }` in
  `fragments/documentation-composition/supporting.ts:17-21`), it's just not
  the universal IR ADR-005 requires.

**Recommended improvement.** Either:

(a) Amend ADR-005 with a follow-up that formalizes the **hybrid** model
that the package has actually converged on — Fragment is the IR, and
codec-agnostic generic rendering is the default; per-kind normalizers are an
opt-in escape hatch — and add the rule that any per-kind normalizer is a
declared exception, not the default. This is the lower-cost path and matches
where the implementation has landed.

(b) Push toward the original ADR-005 shape: introduce a shared
`RenderableDocument` type (`{ title, sections: Section[] }` where each
section is `{ id?, heading, blocks: Block[] }`), have every projection emit
`Fragment<Kind> + Document`, and let the renderer consume only `Document`.
This is the larger refactor but restores the codec/renderer separation as
declared.

Path (a) is what the migration notes and recent commits trend toward;
path (b) is the literal ADR-005 contract. Pick one and stop straddling.

**Trade-offs.** Doing nothing leaves new renderer authors with no clear
guidance — should they add a per-kind normalizer, or stretch the generic
path? Every additional per-kind normalizer makes path (b) harder.

---

### H3. Hidden parallel renderer paths through `Fragment.sections` reflection

**Severity:** High
**ADR / doctrine at stake:** ADR-005 Rule 5 (renderer codec-agnosticism);
ADR-009 (typed fragments inside the boundary).

**Evidence**
`packages/architect-projection/src/renderers/render-markdown.ts:1085-1106`

```ts
function normalizeGenericFragment(
  fragment: Fragment,
  options: NormalizeMarkdownOptions,
): MarkdownDocument {
  const fields = Object.entries(fragment).filter(([key]) => key !== 'kind');
  ...
  const embeddedSections = renderEmbeddedSections(
    (fragment as Record<string, unknown>)['sections'],
    options,
  );

  if (embeddedSections.length > 0) {
    return { ...sections: embeddedSections };
  }
  ...
}
```

`Fragment.sections` is read via reflection on `Record<string, unknown>`,
bypassing the discriminated union. Some fragments carry a structured
`sections: DocumentationSection[]` field (documented in
`fragments/documentation-composition/supporting.ts`); the renderer
opportunistically picks them up. Type-checker assistance is lost at the
exact point ADR-009 says it should be strongest (inside the trust
boundary).

**Recommended improvement.** Promote the `sections: DocumentationSection[]`
field to a typed marker on the fragment base / a typed subset of `Fragment`
(e.g., `SectionedFragment = Fragment & { sections: DocumentationSection[] }`),
and dispatch on that type at the renderer entry rather than reflecting on
a string key. Drop the `as Record<string, unknown>` cast.

**Trade-offs.** Requires either a base-type widening or an explicit
discriminator. Modest cost; large clarity gain.

---

### H4. Re-derive of relationships in `architecture-neighborhood.internal.ts` reads raw `relationships?.implementsPatterns`

**Severity:** High
**ADR / doctrine at stake:** ADR-006 — borderline; uses index correctly but
treats it as optional.

**Evidence**
`packages/architect-projection/src/projections/pattern-relations/architecture-neighborhood.internal.ts:55`

```ts
implements: [...(relationships?.implementsPatterns ?? [])],
```

`relationships?` is `undefined`-tolerant for the same reason as C1.
Per ADR-006, the index is the read model — it cannot be optional from the
consumer's perspective. The optional chain hides the same desync risk and
spreads the "tolerant of missing index" mindset across the codebase.

**Recommended improvement.** Fix C1 first; this and several similar
`relationships?.X ?? []` patterns in `dependency-edges.internal.ts:32`,
`scope-readiness.internal.ts:343`, `_shared/pattern-helpers.internal.ts:144`
inherit safety from C1's resolution. Once `getRelationships` is contractually
non-optional for known patterns, drop the `?` and `?? []` shims.

**Trade-offs.** None — strictly clearer once C1 lands.

---

## Medium

### M1. `summarizeTaxonomyDigest` lives in a projection module but is renderer-only

**Severity:** Medium
**ADR / doctrine at stake:** ADR-005 Rule 5 (renderer codec-agnosticism);
package layering.

**Evidence**
`packages/architect-projection/src/projections/governance/taxonomy-digest.ts:50-62`
exports `summarizeTaxonomyDigest(digest: TaxonomyDigest)` — a *post-projection,
pre-render* fragment summary (counts roles/metadata/aggregation).
`packages/architect-projection/src/renderers/render-markdown.ts:37,944` is the
only caller.

The function takes a `TaxonomyDigest` fragment (not a `ProjectionContext` or
`PatternGraph`) — it's pure fragment math, not a projection. Living under
`projections/` while being renderer-private is a layering smell: it makes the
renderer reach into `projections/` for a helper it actually owns, which is
the inverse of the dependency direction the package is built around.

**Recommended improvement.** Move the function next to the
`TaxonomyDigest` schema in `fragments/governance/taxonomy-digest.ts` (it's a
schema-derived utility) or to the renderer's local `_shared/`. Update the
single caller; remove the renderer → projection import.

**Trade-offs.** Public-surface re-export from `projections/governance/index.ts`
needs to move to the new location.

---

### M2. `documentation-type-registry.cli-surface.ts` is private in practice but not flagged as `.internal.ts`

**Severity:** Medium
**ADR / doctrine at stake:** Barrel hygiene; `.internal.ts` discipline noted
in the scope brief.

**Evidence**
`packages/architect-projection/src/projections/documentation-composition/`
contains four sibling files:

- `documentation-type-registry.ts` (public)
- `documentation-type-registry.cli-surface.ts` (used only by
  `documentation-definition.internal.ts`)
- `documentation-type-registry.disclosure.ts`
- `documentation-type-registry.identity.ts`
- `documentation-type-registry.output-routing.ts`

Only `documentation-definition.internal.ts:23` imports `cli-surface`. The
naming pattern `*.cli-surface.ts`, `*.disclosure.ts`, etc. is invented for
this one subdirectory; it is not part of the package-wide convention
(`.internal.ts` for private, otherwise public). The audit script
(`scripts/options-schema-barrel-audit.mjs`) checks only `*OptionsSchema`
parity and will not catch this.

**Recommended improvement.** Pick one: rename to
`documentation-type-registry-cli-surface.internal.ts` (and siblings to
`*.internal.ts`) so private files surface uniformly, or move the
sub-modules into a `documentation-type-registry/` directory with a single
public `index.ts`. The latter has the bonus of compressing the visual noise
on file listings.

**Trade-offs.** Either rename or relocate touches a handful of imports;
no public-surface impact since none of these are re-exported through
the bounded-context barrel.

---

### M3. `governance/index.ts` re-exports `TaxonomyDigestOptions` from `.internal.ts`

**Severity:** Medium
**ADR / doctrine at stake:** `.internal.ts` discipline (private files
should not appear in barrels).

**Evidence**
`packages/architect-projection/src/projections/governance/index.ts:17`

```ts
export type { TaxonomyDigestOptions } from './taxonomy-digest.internal.js';
```

The convention in this package is that `*.internal.ts` modules are private
to their sibling `*.ts` wrapper. Other subdirectories carefully re-route
internal types through the wrapper module first (e.g.
`pattern-relations/dependency-tree.ts:47` re-exports `DepTreeOptions` from
`./dependency-tree.internal.js` inside the wrapper, then `index.ts` imports
from the wrapper). The governance barrel skips that hop.

**Recommended improvement.** Move the `export type { TaxonomyDigestOptions }`
re-export into `taxonomy-digest.ts`, then have `governance/index.ts` import
from `./taxonomy-digest.js` like its siblings. Strengthen
`scripts/options-schema-barrel-audit.mjs` (or add a sibling rule) to forbid
`.internal.js` imports from any `index.ts`.

**Trade-offs.** None — pure code-organization fix.

---

### M4. `parseAndProject` swallows the schema's parse error context behind a stringified prefix

**Severity:** Medium
**ADR / doctrine at stake:** ADR-009 — the boundary is the single chokepoint;
error fidelity at the boundary is load-bearing for caller debugging.

**Evidence**
`packages/architect-projection/src/projections/_shared/parse-and-project.internal.ts:22-37`

```ts
const errorContext = `Invalid options for ${projectionName}`;

return (context, rawOptions) => {
  ...
  return project(context, parseAtBoundary(schema, optionsInput, errorContext));
};
```

`parseAtBoundary` (in `architect-core`) accepts a `string` context. Multiple
projections feed the same projection-name string, but no schema, no input
slice, and no Zod issue path. Callers see a single error message at the
boundary; for typical Zod issues (extra key, wrong enum, missing prop) the
Zod issue tree is collapsed by `parseAtBoundary`. CLI/MCP callers regularly
need that tree to fix bad option payloads.

**Recommended improvement.** Either expose `parseAtBoundary`'s structured
error (an `Error` carrying the `ZodIssue[]` as a typed cause) and let the
renderer / CLI surface its own format, or surface the projection name as
metadata on a custom `ProjectionBoundaryError` and let callers `instanceof`
it. The flat string sacrifices the bulk of Zod's value at the one place it
matters most.

**Trade-offs.** Custom error class means a breaking change for callers
catching by message. Pre-1.0; document and break.

---

### M5. "Legacy" naming inside the compact-text renderer signals an un-canonicalized fragment field

**Severity:** Medium
**ADR / doctrine at stake:** Zod-first; fragment-schema discipline.

**Evidence**
`packages/architect-projection/src/renderers/render-compact-text.ts:310-353`

```ts
function renderLegacyCheckSeverity(check: ScopeReadinessCheck): 'PASS' | 'WARN' | 'BLOCKED' {
  if (check.passed) return 'PASS';
  if (check.severity === 'warning') return 'WARN';
  return 'BLOCKED';
}
```

`ScopeReadinessCheck` carries `{ passed: boolean, severity: 'warning' | 'error' | ... }`
and the renderer derives a 3-state value at every render, then filters
`report.checks` twice on the derived state. The "Legacy" name is a tell that
the fragment schema should canonicalize this to a single
`outcome: 'PASS' | 'WARN' | 'BLOCKED'` field at projection time, not
re-derive at render time. This is a small Lossy Local Type — the renderer
holds a more-useful shape than the fragment exposes.

**Recommended improvement.** Add an `outcome: 'PASS' | 'WARN' | 'BLOCKED'` to
the `ScopeReadinessCheck` Zod schema (populated by the projection), drop
the renderer-side derivation, drop the `Legacy` naming. The renderer becomes
a one-liner: `[${check.outcome}] ${check.label}`.

**Trade-offs.** Schema change cascades to any contract-freeze test. Pre-1.0;
update them.

---

### M6. `renderers/render-markdown.ts` is 2,222 lines

**Severity:** Medium
**ADR / doctrine at stake:** Maintainability; no explicit ADR but H2/H3 are
the structural symptoms.

**Evidence** `wc -l packages/architect-projection/src/renderers/render-markdown.ts`
prints `2222`. The next-largest renderer is 677 lines (UI).

The file mixes: (a) entry/dispatch, (b) bundle/route concerns, (c) 10
fragment-kind-specific normalizers each ~50-150 lines, (d) generic-fragment
fallback, (e) markdown-emission primitives (text escaping, table rendering,
URL sanitization), (f) section splitting. The URL-sanitization function
`sanitizeMarkdownLinkTarget` (line 1996) is load-bearing security code
sharing a file with table rendering and frontmatter assembly.

**Recommended improvement.** Split into:

- `render-markdown.ts` — entry, dispatch, bundle wiring (≤ 400 lines).
- `render-markdown/normalizers/<kind>.ts` — one file per per-kind normalizer.
- `render-markdown/markdown-primitives.ts` — heading/table/list emitters,
  text-escape helpers.
- `render-markdown/url-sanitizer.ts` — `sanitizeMarkdownLinkTarget` and the
  scheme allowlist (security-critical, deserves its own file with a focused
  test target).

This makes H2's "is this a generic renderer or a per-kind codec" question
materially answerable, and isolates the security-critical surface for
audit.

**Trade-offs.** Pure mechanical split; no behavior change. Risk is in the
test surface following the new layout — the perf gate uses
`renderJson(bundle)` so it is unaffected; contract-feature steps should
keep working without change.

---

## Low

### L1. `Block` schema is the closest thing to ADR-005's `SectionBlock`, but it's named `Block` and exported as such — pin the vocabulary

**Severity:** Low
**ADR / doctrine at stake:** ADR-005 terminology drift.

**Evidence** `packages/architect-projection/src/blocks/schema.ts:96-104`
defines `Block = HeadingBlock | ParagraphBlock | SeparatorBlock | TableBlock | ListBlock | CodeBlock | MermaidBlock | LinkOutBlock | CollapsibleBlock`.
ADR-005 Rule 2 calls this `SectionBlock`. The package's vocabulary diverged
from the ADR.

**Recommended improvement.** Either rename `Block` → `SectionBlock` (pre-1.0
no-BC rename is cheap), or amend ADR-005 to use `Block`. Today, anyone
reading the ADR and grepping the codebase has to bridge the two names.

---

### L2. `_shared/filter.ts` re-exports `MaturityValueSchema` and `StatusValueSchema` from `architect-core` through projections' public barrel

**Severity:** Low
**ADR / doctrine at stake:** Package-boundary hygiene; the projection
package's public surface should not silently widen `architect-core`'s
surface.

**Evidence** `packages/architect-projection/src/projections/index.ts:2-7`

```ts
export {
  MaturityValueSchema,
  ProjectionFilterSchema,
  StatusValueSchema,
  filterPattern,
  filterPatterns,
} from './_shared/filter.js';
```

`MaturityValueSchema` and `StatusValueSchema` are re-exported from
`architect-core` through `filter.ts`. Consumers of
`@libar-dev/architect-projection` can now import core schemas via the
projection package, blurring the dependency arrow.

**Recommended improvement.** Either drop the re-export and require
consumers to depend on `@libar-dev/architect-core` directly for these
schemas, or wrap them in a projection-specific re-export module so the
intent ("we depend on these from core for filter typing, and pass them
through") is documented.

---

### L3. `_internal/format-utils.ts` and `_internal/slug.ts` are imported by renderers, projections, and fragments — `_internal/` is reaching beyond its name

**Severity:** Low
**ADR / doctrine at stake:** Package-internal layering.

**Evidence** `_internal/format-utils.ts` is imported from:
`renderers/render-markdown.ts:19`, `renderers/render-compact-text.ts:24`,
`renderers/render-ui.ts:22`. `_internal/slug.ts` is similarly cross-cutting.

This is fine *if* `_internal/` is documented as "package-private utilities
used across all subdomains." The current naming suggests "deeply internal,
nobody touches" which conflicts with the spread of imports.

**Recommended improvement.** Rename `_internal/` → `_shared/` (matching the
sibling `shared/plain-object.ts` and `projections/_shared/`), or add a
README in `_internal/` that documents the cross-subdomain nature.

---

## Cross-cutting architectural themes

1. **The PatternGraph relationship index is the read model, but the
   projection layer treats it as optional.** ADR-006's anti-patterns
   (Re-derived Relationship, Lossy Local Type) cluster around four call
   sites (C1, C2, C3, H1) that read raw `pattern.uses` /
   `pattern.implementsPatterns` / `pattern.seeAlso` / `pattern.apiRef` /
   `pattern.extendsPattern`. The pattern is consistent: a defensive
   `?? raw-array-fallback` slipped in early, and every new projection in
   the same neighborhood copied it. Fixing C1 — making
   `getRelationships(context, name)` either return a definite
   `RelationshipEntry` or throw — collapses ~30 `?.` and `?? []` shims and
   eliminates the entire ADR-006 anti-pattern footprint in this package.

2. **ADR-005's RenderableDocument IR was never built; the package converged
   on Fragment-as-IR with per-kind renderer normalizers.** H2/H3/M1/M6 are
   all manifestations of the same drift. The package needs to either
   formalize the hybrid model in a follow-up ADR (cheap, matches reality)
   or commit to the original ADR-005 shape (expensive, restores the
   advertised codec/renderer split). Sitting in the middle costs every new
   renderer author the same dilemma. The reflection-based `fragment.sections`
   read path inside the renderer is the strongest evidence that nobody is
   sure which way this should go.

3. **Trust-boundary discipline is genuinely strong.** Exactly two `.parse(`
   sites exist outside `parseAndProject*`, both at module-load time on
   static data; every projection in the public surface uses the shared
   `parseAndProject` helper; renderers do not re-parse their inputs; no
   `safeParse` on hot paths; URL sanitization in markdown is a single
   chokepoint with the documented scheme allowlist. ADR-009's main rules
   are well-implemented. The two follow-up improvements are M4 (preserve
   the Zod issue tree across the boundary) and M5 (canonicalize the
   `ScopeReadinessCheck` outcome so renderers don't re-derive it).

4. **Barrel hygiene is mostly good but the audit only covers
   `*OptionsSchema`.** M2 (`*.cli-surface.ts` naming) and M3 (governance
   barrel reaches into `*.internal.ts`) slipped past the audit because the
   audit's scope is narrow. Extending
   `scripts/options-schema-barrel-audit.mjs` (or adding a sibling) to forbid
   `.internal.js` imports from any `index.ts` would mechanize the
   convention.

5. **The largest renderer file (2,222 LOC) is doing double duty as a
   security-critical surface (URL sanitization) and as a fragment-aware
   codec.** Even if H2 is resolved by formalizing the hybrid model, the
   markdown renderer should be split into per-kind normalizer files plus a
   focused markdown-primitives / url-sanitizer pair (M6) so the audit
   surface for the security-critical pieces is bounded.
