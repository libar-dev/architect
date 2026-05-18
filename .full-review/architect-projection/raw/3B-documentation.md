# architect-projection — Phase 3B: Documentation Review

**Phase:** 3B — Documentation Completeness & Accuracy
**Package:** `@libar-dev/architect-projection@2.0.0-pre.1`
**Source:** 145 files, ~15,238 SLOC
**Date:** 2026-05-17
**Reviewer:** documentation-architect agent

---

## 1. Executive Summary

`architect-projection` has the strongest documentation discipline in the family: a
substantive README covering architecture invariants, disclosure vocabulary, and
trust-boundary contracts; a dedicated `docs/` subdirectory with migration mapping,
fragment catalog, and performance budgets; a `jsdoc-boilerplate-audit.mjs` script
that mechanically prevents the three worst core-specific anti-patterns from entering
projection; and 87 of 145 source files carrying `@architect-pattern` annotations
(60% annotation rate — versus core's 28/106 = 26%).

Four issues pull the quality down from exemplary to adequate. The most impactful is
a broken usage example at `README.md:29`: `const context: ProjectionContext = { graph }` is
a TypeScript compile error because `packageResolver` is a required field on
`ProjectionContext` (`src/context/projection-context.ts:35`). Any consumer who copies
this example will get a type error. The second issue is the `MIGRATION.md:62` claim
that "The projection perf gate is now live in CI" — Phase 2 established that
`compare-baseline.mjs` is fully written but never invoked from `package.json:65`;
PERF.md correctly describes the gate as a local command, creating a contradiction
between the two docs. Third, `docs/ddd-inventory.md` catalogs 41 fragment entries
but `fragment-schema.internal.ts` has 43 discriminated-union members; 9 distinct
fragment file names are absent from the inventory. Fourth, ADR linkage is mentioned
inline but never linked to the actual decision files in `architect/decisions/`.

The annotation coverage gap (58 of 145 files unannotated) is significant but
follows an observable pattern: `.internal.ts` files (implementation, not contract)
and barrel `index.ts` files account for the majority. However, 23 non-internal,
non-barrel files are unannotated, including several load-bearing public surfaces
(`blocks/schema.ts`, `context/projection-context.ts`, `routing/route-id.ts`,
`projections/errors.ts`, `projections/_shared/filter.ts`, `disclosure/spec.ts`).

---

## 2. README Audit — Section by Section

### 2.1 Pipeline Overview and Usage Examples

**Location:** `README.md:1–55`

**Status: FAILING — broken example at line 29.**

The usage example constructs `ProjectionContext` as:

```ts
const context: ProjectionContext = { graph }; // graph from buildPatternGraph()
```

`ProjectionContext` is defined at `src/context/projection-context.ts:33–38` as:

```ts
export interface ProjectionContext {
  readonly graph: PatternGraph;
  readonly packageResolver: PackageResolver;   // required — no `?`
  readonly projectMetadata?: ProjectMetadata;
  ...
}
```

`packageResolver` is required. The comment at `:28` even cites "ARCHITECTURE.md §2" and
says "It maps `pattern.source.file` to a workspace `Package`". Constructing
`ProjectionContext` without it is a TypeScript compile error. A new consumer copying
this example will see `TS2322: Type '{ graph: PatternGraph }' is not assignable to
type 'ProjectionContext'`.

The second example block (`README.md:39–47`, "With option validation") is a
near-duplicate of the first, adds no clarifying information about `packageResolver`,
and continues to omit it. The two examples together communicate that `{ graph }` is
sufficient to construct the context — directly contradicting the actual type.

**Cross-reference:** Phase 1 finding M-PROJ-A-9 noted this tension: "README claims
'graph only' projections but projections do use `context.packageResolver(...)`".
The issue is more severe than M-PROJ-A-9 framed it: it's not merely a claim in prose,
it's a code example that will not compile.

**Fix:** Provide a minimal runnable example. At minimum:

```ts
import { buildPatternGraph, createPackageResolver } from '@libar-dev/architect-core';
import {
  parseAndProjectSessionContext,
  renderCompactText,
  type ProjectionContext,
} from '@libar-dev/architect-projection';

const graph = await buildPatternGraph({ ... });
const context: ProjectionContext = {
  graph,
  packageResolver: createPackageResolver(graph),
};
const bundle = parseAndProjectSessionContext(context, {
  patterns: ['UnifiedRoleSystem'],
  sessionType: 'implement',
});
console.log(renderCompactText(bundle));
```

---

### 2.2 Architecture Invariants — "project\* functions"

**Location:** `README.md:68–77`

**Status: Partially accurate, one claim overstated.**

The README states at line 68–70:

> `project*` functions must only read `ProjectionContext.graph`, and
> `parseAndProject*` wrappers must limit themselves to option parsing plus a
> call into the matching projection helper.

`ProjectionContext` has `packageResolver`, `projectMetadata`, `tagExampleOverrides`,
and `perspective` in addition to `graph`. Several projections use `packageResolver`
at runtime (the constraint is documented on the type itself at `:28`). Saying
`project*` reads "only `ProjectionContext.graph`" is overstated.

**Fix:** Replace "must only read `ProjectionContext.graph`" with "read from
`ProjectionContext` without touching raw `PatternGraph` internals or filesystem."

---

### 2.3 Architecture Invariants — Renderers "operate on Fragments only"

**Location:** `README.md:74–75`

**Status: Inaccurate as of current code — ADR-005 Rule 5 violation.**

The README states:

> Renderers cannot import `PatternGraph` or `ProjectionContext`. They operate
> on `Fragment`s only.

Phase 1 finding H-PROJ-A-3 documents that `render-markdown.ts:39` imports
`summarizeTaxonomyDigest` directly from `../fragments/index.js` (which re-exports
it from `fragments/governance/taxonomy-digest.ts:33`). The `summarizeTaxonomyDigest`
function is a runtime helper that lives in the fragments layer (contracts layer),
not in the projection layer. This is a back-channel from the renderer to fragment-side
logic that bypasses the projection.

Additionally, `MARKDOWN_NORMALIZERS` at `render-markdown.ts:208–219` has 10
fragment-kind-specific normalizers. This directly violates ADR-005 Rule 5 ("The
markdown renderer is codec-agnostic... Rendering depends only on block types, not on
document origin"). The README's claim that renderers "operate on Fragments only" is
technically true (they receive Fragment values) but omits that the renderer contains
10 kind-specific dispatch branches — which is the behavior ADR-005 Rule 5 intended
to prevent.

The README should either:

1. Acknowledge the ADR-005 Rule 5 violation and link to H-PROJ-A-1 as a known
   architectural debt item, or
2. Reframe the claim: "Renderers receive Fragments as input but currently contain
   kind-specific normalization paths pending the H-PROJ-A-1 split."

---

### 2.4 Architecture Invariants — ESLint Boundary Rules Table

**Location:** `README.md:79–97`

**Status: Accurate and well-written.**

The four-rule table (`arch-boundary:renderer-no-doc-composition`,
`arch-boundary:renderer-no-route-construction`,
`arch-boundary:renderer-no-cross-layer-internal`,
`trust-boundary:trusted-markdown-firewall`) is factually correct per Phase 1's
verification. Each rule's `[scope:rule-id]` tag format is documented. The TRUSTED_MARKDOWN
5-AST-selector firewall is correctly described.

One minor gap: the table references "repo-root `eslint.config.mjs`" but does not
link to it or provide a path. Consumers grepping a lint error with a `[trust-boundary:*]`
tag have no direct link to navigate to the rule definition. A parenthetical
`(root `eslint.config.mjs`, lines covering `src/renderers/\*_/_.ts`)` would close
this navigation gap without requiring a full path reference.

---

### 2.5 Markdown/Content Trust Boundary

**Location:** `README.md:99–117`

**Status: Accurate. Phase 1 confirmed all claims.**

The claims in this section are all verified by Phase 1:

- `parseAndProject*` validates raw options once at the projection boundary —
  confirmed for 14/15 entrypoints (C-PROJ-2 is the lone exception).
- Fragment block text is plain text by default — correct.
- `renderMarkdown` escapes plain-text block content — confirmed via
  `sanitizeMarkdownLinkTarget` at `render-markdown.ts:2001` and
  `escapePlainMarkdownLine` chain.
- `link-out.path` scheme allowlist (relative/root-relative + `http:`/`https:`/`mailto:`)
  — confirmed. Unsafe schemes rendered as plain text.
- Routed output paths stricter than `link-out.path` — confirmed via
  `normalizeRoutedOutputPath` at `render-markdown.ts:2043`.

The only gap: the README does not acknowledge that C-PROJ-2
(`parseAndProjectOpenQuestionList`) bypasses the `parseAndProject` shared wrapper
and calls `OpenQuestionListOptionsSchema.parse(rawOptions)` directly (confirmed in
`src/projections/pattern-relations/open-question-list.ts:38`), throwing a raw
`ZodError` instead of a `BoundaryParseError`. The trust-boundary section says
"validates raw options once at the projection boundary" without caveat — readers
should know about the outlier.

---

### 2.6 Documentation Composition Contract

**Location:** `README.md:119–156`

**Status: Accurate.**

The disclosure vocabulary (`essential | important | useful | advanced`), route ID
format (`<docType>:index`, `<docType>:<stableEntityId>`, etc.), and bundle shape
invariants (`{ root, children, routing? }`) are all accurately described. The
claim that "domain fragments remain renderer-neutral" is accurate for the fragment
layer itself, though the renderer-side normalizers (H-PROJ-A-1) put per-kind logic
in the renderer rather than the projection.

---

### 2.7 Cross-Package Consumer Guidance

**Status: Missing.**

The README does not tell `cli` or `mcp` consumers what NOT to import. Specifically:

- No guidance that `.internal.ts` files should not be imported by external consumers.
- No guidance that the `_internal/` directory (`src/_internal/slug.ts`,
  `src/_internal/format-utils.ts`) is package-private.
- No guidance that `project*` raw helpers (exported from the barrel) should only be
  used when the caller already holds pre-validated options.
- No guidance about which subpath export (`./blocks`, `./fragments`, `./projections`,
  `./renderers`, `./disclosure`, `./routing`) to prefer for narrowed imports.

The `src/index.ts` file header (lines 1–16) gives guidance on subpath exports but
only in code comments that won't appear in the npm-published README. Consumers have
to read source to discover the subpath preference guidance.

**Finding DOC-PROJ-M-1**: Add a "Consumer guidance" section to README covering:
what NOT to import (raw `project*` at external boundaries, `.internal.ts` files,
`_internal/` directory), which subpath exports to prefer for each consumer type
(CLI uses `./projections` + `./renderers`; MCP uses same; test fixtures may use
`./fragments` directly), and the distinction between `parseAndProject*` (boundary)
vs `project*` (pre-validated internal).

---

### 2.8 Testing Section

**Location:** `README.md:149–156`

**Status: Accurate but incomplete.**

The `pnpm test` command is correct. The note about "Gherkin feature files + vitest-cucumber
step definitions under `tests/features/**` and `tests/steps/**`" is accurate. However,
there is no mention of the perf gate, the `compare-baseline.mjs` comparator, or what
`pnpm test` does NOT run (the perf comparator — see PERF.md finding below). A consumer
running `pnpm test` will pass even when the perf baseline is exceeded.

---

## 3. JSDoc Coverage Map

### 3.1 Summary Statistics

| Layer          | Files   | Annotated | Rate    | Notes                                                                                                                              |
| -------------- | ------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `fragments/`   | 49      | 36        | 73%     | All named fragment schemas annotated; supporting.ts files, base.ts, open-question-list.ts, pattern-bundle-entry.ts miss annotation |
| `projections/` | 57      | 32        | 56%     | All `.ts` public files annotated; all `.internal.ts` and index barrels unannotated by convention                                   |
| `renderers/`   | 8       | 5         | 63%     | `markdown-paths.ts`, `types.ts`, `index.ts` unannotated                                                                            |
| `blocks/`      | 1       | 0         | 0%      | `blocks/schema.ts` — major public surface, no annotation                                                                           |
| `disclosure/`  | 3       | 0         | 0%      | Three disclosure files, zero annotations                                                                                           |
| `routing/`     | 2       | 0         | 0%      | `route-id.ts` and barrel unannotated                                                                                               |
| `context/`     | 1       | 0         | 0%      | `projection-context.ts` — load-bearing public type, unannotated                                                                    |
| `_internal/`   | 2       | 0         | 0%      | By convention (private); expected                                                                                                  |
| `shared/`      | 1       | 0         | 0%      | `plain-object.ts` unannotated                                                                                                      |
| **Total**      | **145** | **87**    | **60%** | vs core's 28/106 = 26%                                                                                                             |

### 3.2 Public Surfaces Missing Annotation

The following non-internal, non-barrel files with public exports lack `@architect-pattern`:

| File                                                                       | Public Exports                                                                                         | Priority                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| `src/blocks/schema.ts`                                                     | All block types (HeadingBlock, ParagraphBlock, CodeBlock, etc.) — the entire Block discriminated union | High                       |
| `src/context/projection-context.ts`                                        | `ProjectionContext`, `PerspectiveHint`, `TagExampleOverride`                                           | High                       |
| `src/projections/errors.ts`                                                | `ProjectionError`, `ProjectionErrorCode`                                                               | High (cited as L-PROJ-A-5) |
| `src/projections/_shared/filter.ts`                                        | `filterPattern`, `filterPatterns`, `ProjectionFilterSchema`                                            | High                       |
| `src/routing/route-id.ts`                                                  | `LogicalRouteId`, `createIndexRouteId`, `createEntityRouteId`, `parseLogicalRouteId`                   | High                       |
| `src/disclosure/spec.ts`                                                   | `DisclosureLevel`, `DisclosureSpec`                                                                    | Medium                     |
| `src/disclosure/levels.ts`                                                 | Level constants                                                                                        | Medium                     |
| `src/fragments/base.ts`                                                    | `ProjectionBundle<T>`, `BundleRouting`, `isBundle`, `projectSingle`                                    | Medium                     |
| `src/fragments/pattern-relations/open-question-list.ts`                    | `OpenQuestionList`                                                                                     | Medium                     |
| `src/fragments/pattern-relations/pattern-bundle-entry.ts`                  | `PatternBundleEntry`                                                                                   | Medium                     |
| `src/projections/documentation-composition/documentation-type-registry.ts` | Registry facade (deletion candidate per H-PROJ-A-9)                                                    | Low (slated for deletion)  |

### 3.3 The `parseAndProject*` / `project*` Function-Level JSDoc

The 14 `parseAndProject*` functions and 15+ `project*` functions do not carry
individual function-level JSDoc (`@param`, `@returns`, `@throws`). Documentation
exists at the file/module level via the `@architect-pattern` block and the prose
sections (Value, Invariant, Behavior, When to Use), which is rich and sufficient for
understanding intent.

However, `@throws` is absent everywhere. `parseAndProject*` wrappers throw
`BoundaryParseError` from `@libar-dev/architect-core` on invalid options;
`project*` functions throw `ProjectionError` on missing patterns, unknown
document types, etc. Consumers using TypeScript cannot see thrown error types from
the IDE. A `@throws {BoundaryParseError} when options fail schema validation` on each
`parseAndProject*` would close the discoverability gap.

### 3.4 Fragment Schema Field-Level Invariants

Field-level invariants are not documented in JSDoc on the Zod schema fields. This is
partially mitigated by the `ddd-inventory.md` catalog (Section 7), but consumers
looking at `PatternDetailSchema` in their IDE see no per-field documentation.
`PatternDetail` is the richest, most-consumed fragment (backing `projectPatternDetail`,
`projectPatternBundle`, `projectArchitectureNeighborhood`, UI renderer, and markdown
generic fallback). Its 10+ fields have no field-level explanations.

### 3.5 Boilerplate Check (DOC-H-3 Analogue)

The `jsdoc-boilerplate-audit.mjs` script detects three phrases that indicate
copy-paste boilerplate: "As a typed contract", "data shape consumed by projection or
render layers", and "Private helpers used exclusively". **None of these appear in
projection source files** — confirmed by the audit script itself (it passes CI).
The core DOC-H-3 problem (16 files with identical "When to Use" boilerplate) does
NOT recur in projection.

The 80 "### When to Use" sections that do exist contain file-specific content —
each is a short bullet describing the particular fragment, projection, or renderer's
specific use case. The content is thin in some cases (open-question-list.ts:9 reads
"Projects the open-question list for patterns, optionally filtered to a parent scope")
but it is not identical boilerplate.

---

## 4. Findings by Severity

### High (documentation defects that will mislead consumers or produce errors)

#### DOC-PROJ-H-1. README usage example produces a TypeScript compile error

`README.md:29`: `const context: ProjectionContext = { graph }` omits the required
`packageResolver` field. `ProjectionContext.packageResolver` is declared without `?`
at `src/context/projection-context.ts:35`. The comment on the example line says
"graph from `buildPatternGraph()`" but does not hint at `packageResolver`. Both usage
examples (lines 22–35 and 39–47) repeat the error.

**Impact:** Any copy-paste consumer sees `TS2322`. Misleads readers about what
`ProjectionContext` requires.

**Fix:** Update both examples to include `packageResolver`. Consider importing and
using `createPackageResolver` from core, or document that a pre-built `PackageResolver`
is needed.

#### DOC-PROJ-H-2. MIGRATION.md claims perf gate is "live in CI" — it is not wired

`docs/MIGRATION.md:62–68`:

> The projection perf gate is now live in CI.

Phase 2 Cleanup-C-PROJ-1 established definitively that `compare-baseline.mjs` is
implemented and committed but not invoked from `package.json:65`. The gate would
fail if wired (current evidence: `project.avgMs = 2.05 ms` against a 1.5 ms hard
budget). `PERF.md` correctly describes the comparator as a local command ("Run the
gate locally from the monorepo root"). The two documents contradict each other:
MIGRATION.md says "live in CI"; PERF.md says "run locally".

**Impact:** Consumers (and CI reviewers) believe perf regressions will be caught
automatically. They will not. The MIGRATION.md claim is aspirational, not factual.

**Fix:** Change MIGRATION.md to: "The projection perf gate comparator is implemented
(`tests/perf/compare-baseline.mjs`) but is not yet wired into CI (tracked as
Cleanup-C-PROJ-1). Run locally per PERF.md to check for regressions."

#### DOC-PROJ-H-3. README states renderers "operate on Fragments only" — inaccurate

`README.md:74–75` claims the renderer boundary is absolute. `render-markdown.ts:39`
imports `summarizeTaxonomyDigest` from `../fragments/index.js` (a fragment-layer
runtime helper), and the 10-entry `MARKDOWN_NORMALIZERS` table at `render-markdown.ts:208–219`
implements kind-specific rendering logic (H-PROJ-A-1, ADR-005 Rule 5 violation). The
README's invariant does not hold for the current codebase.

**Impact:** Consumers adding a new fragment kind follow the README and assume the
renderer needs no changes — the code says otherwise.

**Fix:** Either add a note acknowledging the MARKDOWN_NORMALIZERS exception, or mark
the section as "Intended invariant — see H-PROJ-A-1 for current deviation."

---

### Medium (inaccuracies that reduce trust or leave gaps)

#### DOC-PROJ-M-1. No cross-package consumer guidance on import boundaries

The README has no section explaining what `cli` and `mcp` consumers should NOT
import. The `_internal/` directory naming convention (private within a module),
`.internal.ts` suffix (private to a subdomain), and the 7 subpath exports are not
explained in the README. Consumers must read `src/index.ts` comments (which are
code comments, not doc-visible) to learn subpath preferences.

**Fix:** Add a "Consumer import guidance" section to README covering: use
`parseAndProject*` at boundaries (never raw `project*`); do not import from
`*.internal.ts` files or from `src/_internal/`; prefer narrowed subpath imports
(`./projections`, `./renderers`) over the root barrel for tree-shaking.

#### DOC-PROJ-M-2. README architecture invariant overstates `project*` read scope

`README.md:68`: "project\* functions must only read `ProjectionContext.graph`" — but
`ProjectionContext.packageResolver`, `projectMetadata`, `perspective`, and
`tagExampleOverrides` are also read by projections at runtime.

**Fix:** Revise to: "`project*` functions read from `ProjectionContext` without
bypassing the graph abstraction (no direct `dataset.patterns` / `graph.archIndex` /
`graph.relationshipIndex` access)."

#### DOC-PROJ-M-3. Trust-boundary section does not acknowledge the C-PROJ-2 outlier

`README.md:99–101` states the `parseAndProject*` boundary is uniform. The outlier
`parseAndProjectOpenQuestionList` (`src/projections/pattern-relations/open-question-list.ts:38`)
calls `OpenQuestionListOptionsSchema.parse(rawOptions)` directly and throws a raw
`ZodError` rather than a `BoundaryParseError`.

**Fix:** Either fix C-PROJ-2 (one-line rewrite per Phase 1 recipe) and then the
README is accurate, or add a caveat. Fixing C-PROJ-2 is strongly preferred over
documenting a defect.

#### DOC-PROJ-M-4. `_internal/` directory vs `.internal.ts` suffix convention undocumented

`src/_internal/` contains `slug.ts` and `format-utils.ts` (cross-module shared
utilities). `.internal.ts` is the per-module private-helper suffix convention.
These two patterns have different semantics (`_internal/` is package-wide private;
`.internal.ts` is subdomain-private) but no documentation explains either convention
or their difference. The ESLint rule `arch-boundary:renderer-no-cross-layer-internal`
references `.internal.js` but only in the context of renderer boundaries.

**Fix:** Add a brief "File naming conventions" subsection to README: `_internal/`
houses package-level private utilities not exported from any barrel;
`*.internal.ts` files are subdomain-private implementation modules not re-exported
from subdomain barrels.

---

### Low (gaps that reduce discoverability but do not mislead)

#### DOC-PROJ-L-1. ADR links are inline names only, not file paths

`README.md` mentions ADR-005 and ADR-009 by name in prose and the lint rule table,
and ADR-006 in the architecture invariants (line 70). None link to the actual decision
files at `architect/decisions/adr-00X-*.feature`. The ADR text in the decisions
directory is the authoritative source for each rule's rationale. A consumer wanting
to understand WHY the renderer boundary exists must discover `AGENTS.md` → `architect/decisions/`.

**Fix:** Add an "ADR references" section to README: "See `architect/decisions/` for
the full decision text. This package is governed by ADR-005, ADR-006, and ADR-009."

#### DOC-PROJ-L-2. `blocks/schema.ts` — no annotation; entire Block type hierarchy invisible to PatternGraph

`src/blocks/schema.ts` defines the entire Block discriminated union (HeadingBlock,
ParagraphBlock, CodeBlock, ListBlock, CollapsibleBlock, LinkOutBlock, TableBlock,
MermaidBlock, SeparatorBlock, etc.). This is the type-level vocabulary for fragment
data that flows into all four renderers. Zero `@architect-pattern` annotation. It
does not appear in the PatternGraph, is invisible to generated docs, and has no
"When to Use" context.

**Fix:** Add `@architect-pattern BlockSchema` + `@architect-role:contract` + a
"When to Use" section.

#### DOC-PROJ-L-3. `context/projection-context.ts` — no annotation; `ProjectionContext` invisible to PatternGraph

`ProjectionContext` is the most-crossed type boundary in the package (every
projection function's first argument). It has a good JSDoc comment block but no
`@architect-pattern` annotation, making it invisible to PatternGraph and generated docs.

**Fix:** Add `@architect-pattern ProjectionContext` + `@architect-role:contract`.

#### DOC-PROJ-L-4. `routing/route-id.ts` — no annotation; route ID contract invisible to PatternGraph

`LogicalRouteId`, `createIndexRouteId`, `createEntityRouteId`, and
`parseLogicalRouteId` implement the routing ID contract described in detail in
the README. No annotation. The type and its invariants cannot be queried via
PatternGraph.

**Fix:** Add `@architect-pattern LogicalRouteIdContract` + `@architect-role:contract`.

#### DOC-PROJ-L-5. `projections/errors.ts` — no annotation (L-PROJ-A-5, confirmed)

`ProjectionError` and `ProjectionErrorCode` form the public error surface. Annotated
in Phase 1 as L-PROJ-A-5. No `@architect-pattern` annotation means they are
invisible in the PatternGraph. The error surface is a public contract — consumers
catch `ProjectionError` and switch on `code`.

**Fix:** Add `@architect-pattern ProjectionErrorBoundary` + `@architect-role:contract`.

#### DOC-PROJ-L-6. `parseAndProject*` / `project*` functions missing `@throws` JSDoc

All 14 `parseAndProject*` wrappers throw `BoundaryParseError` from `@libar-dev/architect-core`
when options fail schema validation. All `project*` functions that look up patterns
throw `ProjectionError('PATTERN_NOT_FOUND', ...)`. Neither is documented with
`@throws`. IDE hover information is silent about error behavior.

#### DOC-PROJ-L-7. PERF.md does not acknowledge the gate is unwired

`docs/PERF.md:3` says "The projection package has a CI gate for the BusinessRuleSet
hot path". The gate runs locally only (the script itself says "Run the gate locally
from the monorepo root"). The CI claim is inaccurate to the extent it implies the
gate fails PRs — it does not, because it is not in `package.json:65`.

This is the same event as DOC-PROJ-H-2 (MIGRATION.md), but PERF.md has the
correct two-step local procedure while also calling it a "CI gate". The document
contradicts itself: it says "CI gate" at the top but "run locally" in the procedure.

**Fix:** Change opening to: "The projection package has a perf comparator gate for
the BusinessRuleSet hot path. The comparator (`tests/perf/compare-baseline.mjs`) is
implemented and can be run locally; CI wiring is tracked separately."

---

## 5. ADR Linkage Table

| ADR                               | Governed Concepts                                                         | Referenced in README                | Referenced in MIGRATION.md            | Linked to `architect/decisions/`? |
| --------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------- | --------------------------------- |
| ADR-005 Codec/Renderer Separation | Renderer codec-agnosticism; MARKDOWN_NORMALIZERS                          | Line 89 (inline in lint table only) | No direct reference                   | No                                |
| ADR-006 Single Read Model         | `project*` reads from graph only; ADR-006 lint rules                      | Line 70 (inline)                    | Lines 157–170 (ADR-006 leaks section) | No                                |
| ADR-009 Projection Trust Boundary | `parseAndProject*` parse-once rule; markdown escaping; `TRUSTED_MARKDOWN` | Line 89 (inline in lint table)      | No direct reference                   | No                                |

**Overall:** All three ADRs are referenced by number in the README and MIGRATION.md,
but never as clickable links and never with a navigation pointer to `architect/decisions/`.
An onboarding engineer who reads the README knows ADR-005/006/009 govern these
behaviors but cannot easily locate the decision text. The ADRs themselves use
`@architect-pattern` annotations and live in the PatternGraph — they are first-class
addressable artifacts but the package docs treat them as mere names.

**Recommended addition:** Add to README "Architecture invariants" section:

```
These invariants are codified in three ADRs in `architect/decisions/`:
- `adr-005-codec-based-markdown-rendering.feature` (renderer boundary)
- `adr-006-single-read-model-architecture.feature` (graph read model)
- `adr-009-projection-trust-boundary.feature` (parse-at-boundary rule)
```

---

## 6. Architect State Health by Area

### 6.1 Overall Annotation Rate

87 of 145 source files carry `@architect-pattern` (60%). 58 files are unannotated.
Breaking this down:

| Category                                      | Count | Expected annotation?                                        |
| --------------------------------------------- | ----- | ----------------------------------------------------------- |
| `.internal.ts` files (implementation private) | ~27   | No — convention                                             |
| `index.ts` barrel files                       | ~12   | Some — subdomain barrels carry `@architect-bounded-context` |
| Non-internal, non-barrel unannotated          | 23    | **Yes** — these are the gaps                                |

### 6.2 Fragments Layer (47 claimed, 43 actual)

**The scope document claims "47 fragment kinds." The `fragment-schema.internal.ts`
discriminated union at lines 70–114 has exactly 43 members.** This is a scope
document inaccuracy, not a code defect.

All 43 fragment schemas that ARE in the discriminated union are annotated except:

| Fragment file                                         | Missing annotation                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `fragments/base.ts`                                   | `ProjectionBundle<T>`, `BundleRouting` — cross-cutting foundation |
| `fragments/pattern-relations/open-question-list.ts`   | `OpenQuestionList` fragment schema                                |
| `fragments/pattern-relations/pattern-bundle-entry.ts` | `PatternBundleEntry`                                              |

The following 9 fragment files exist on disk but are NOT in `ddd-inventory.md`:

| File                         | Reason absent from inventory    |
| ---------------------------- | ------------------------------- |
| `business-rule-reference.ts` | Not in ddd-inventory.md catalog |
| `open-question-list.ts`      | Not in ddd-inventory.md catalog |
| `dependency-edge-set.ts`     | Not in ddd-inventory.md catalog |
| `architecture-comparison.ts` | Not in ddd-inventory.md catalog |
| `architecture-context.ts`    | Not in ddd-inventory.md catalog |
| `orphan-pattern-list.ts`     | Not in ddd-inventory.md catalog |
| `pattern-bundle-entry.ts`    | Not in ddd-inventory.md catalog |
| `role-profile-collection.ts` | Not in ddd-inventory.md catalog |
| `source-inventory-digest.ts` | Not in ddd-inventory.md catalog |

All nine have `@architect-pattern` annotations in code (so they ARE visible to
PatternGraph), but they are invisible to a human reading `ddd-inventory.md`.

### 6.3 Projections Layer

All public `.ts` files in `projections/` subdirectories carry `@architect-pattern`
annotations. The internal `.internal.ts` files are unannotated by convention — this
is correct behavior (they are implementation, not contract).

The 6-subdomain partition (`pattern-relations`, `delivery-reporting`, `governance`,
`execution-context`, `operational-insights`, `documentation-composition`) is
observable and annotated with `@architect-bounded-context:*` at the subdomain barrel
level.

### 6.4 Renderers Layer

Four of five renderer files are annotated:

- `render-markdown.ts` — `@architect-pattern MarkdownRenderer` ✓
- `render-json.ts` — `@architect-pattern JsonRenderer` ✓
- `render-compact-text.ts` — `@architect-pattern CompactTextRenderer` ✓
- `render-ui.ts` — `@architect-pattern UiRenderer` ✓
- `renderers/_shared/dispatch.ts` — `@architect-pattern FragmentRendererDispatch` ✓
- `renderers/markdown-paths.ts` — **unannotated** (route path resolution for markdown renderer)
- `renderers/types.ts` — **unannotated** (renderer option types: `RenderMarkdownOptions`, `RenderJsonOptions`, etc.)

`renderers/types.ts` exports `RenderMarkdownOptions`, `RenderJsonOptions`, `RenderCompactOptions`,
`RenderUiOptions`, `MarkdownRenderEvent`, and `ProjectionInput`. These are public
option surfaces; their absence from PatternGraph means consumers cannot query "what
options does renderMarkdown accept?" via the toolchain's own APIs.

### 6.5 Disclosure Layer

All three `disclosure/` files (`levels.ts`, `spec.ts`, `index.ts`) are unannotated.
`disclosure/spec.ts` defines `DisclosureSpec` and the annotation-side vocabulary
(`essential | important | useful | advanced`) — this is a public contract worth
annotating. Phase 1 finding H-PROJ-A-2 flagged `disclosure/spec.ts` for layering
inversion; the annotation gap is secondary to that structural issue.

### 6.6 Routing Layer

`routing/route-id.ts` and `routing/index.ts` are unannotated. `LogicalRouteId` is
the stable identifier vocabulary described in the README's "Documentation Composition
Contract" section. The README describes its format in detail (`<docType>:index`,
`<docType>:<stableEntityId>`, etc.) — but the type itself is invisible to PatternGraph.

### 6.7 Blocks Layer

`blocks/schema.ts` — the entire Block discriminated union — is unannotated. This is
the vocabulary through which all fragments express their data. Six block type
consumers (all four renderers + any UI consumer) depend on it. It has no annotation
and does not appear in PatternGraph or generated docs.

---

## 7. `docs/` Subdirectory Audit

### 7.1 `docs/MIGRATION.md`

**Overall status: Mostly accurate, two material inaccuracies.**

**Section: "Performance gate" (lines 60–68)**

Claims: "The projection perf gate is now live in CI."

Reality: The gate comparator (`tests/perf/compare-baseline.mjs`) is fully written
(Phase 2, Cleanup-C-PROJ-1) but NOT invoked from the test script (`package.json:65`).
Running `pnpm test` does NOT invoke `compare-baseline.mjs`. The perf gate will
not fail CI on regression. This is a factual error — see DOC-PROJ-H-2.

**Section: Table A (Codec to Projection Mapping) — lines 70–108**

Accurate. All projection function names in the table match current barrel exports
in `src/projections/index.ts`. The mapping from old codec filenames to new
projection/renderer pairs is complete and verified.

**Section: Table B (API Formatter to Projection Mapping) — lines 110–126**

Accurate. Function names match current exports.

**Section: Table C (MCP Tool to Projection Mapping) — lines 128–153**

Accurate for the 18 tools listed. (Note: AGENTS.md says 21 tools; the discrepancy
is in the MCP package, not this table.)

**Section: "Residual ADR-006 leaks (now closed)" — lines 157–170**

Accurate historical record.

**Section: Renderer Overview (lines 178–215)**

Accurate descriptions of all four renderers. The `renderMarkdown` description
mentions "dedicated normalizer" per fragment kind — this is consistent with the
actual `MARKDOWN_NORMALIZERS` table but it should be noted this means the renderer
is NOT codec-agnostic (ADR-005 Rule 5), though the migration doc does not call this
out as a deviation.

### 7.2 `docs/ddd-inventory.md`

**Overall status: Structurally sound, 9 fragments missing from the catalog.**

The inventory covers 41 fragment file entries (including `supporting.ts` files and
`base.ts`). The actual `fragments/` directory contains 49 non-barrel, non-internal
files. The missing 9 are all real, annotated fragments that appear in
`fragment-schema.internal.ts`:

| Missing from inventory                                | Subdomain            | Classification |
| ----------------------------------------------------- | -------------------- | -------------- |
| `business-rule-reference.ts` (BusinessRuleReference)  | governance           | Primitive      |
| `open-question-list.ts` (OpenQuestionList)            | pattern-relations    | Primitive      |
| `dependency-edge-set.ts` (DependencyEdgeSet)          | pattern-relations    | Composite      |
| `architecture-comparison.ts` (ArchitectureComparison) | pattern-relations    | Composite      |
| `architecture-context.ts` (BoundedContext)            | pattern-relations    | Primitive      |
| `orphan-pattern-list.ts` (OrphanPatternList)          | pattern-relations    | Primitive      |
| `pattern-bundle-entry.ts` (PatternBundleEntry)        | pattern-relations    | Primitive      |
| `role-profile-collection.ts` (RoleProfileCollection)  | operational-insights | Composite      |
| `source-inventory-digest.ts` (SourceInventoryDigest)  | operational-insights | Composite      |

The "47 kinds" count in the review scope document is also inaccurate: the
discriminated union at `fragment-schema.internal.ts:70–114` has exactly 43 members.

The composition map is accurate for the fragments it covers but does not include
composition details for `BusinessRuleReference`, `DependencyEdgeSet`, or
`RoleProfileCollection`.

The "Spec Lifecycle Alignment" note (line 225–232) correctly records the Action 5
deletion of the lifecycle-management subdomain with a pointer to the ideation documents.
This is good housekeeping.

### 7.3 `docs/PERF.md`

**Overall status: Internally inconsistent — calls itself a "CI gate" while documenting local-only procedure.**

`PERF.md:3`: "The projection package has a CI gate for the BusinessRuleSet hot path"

`PERF.md:12–16`: "Run the gate locally from the monorepo root:

````bash
pnpm --filter @libar-dev/architect-projection exec vitest --config vitest.perf-report.config.mjs run
node packages/architect-projection/tests/perf/compare-baseline.mjs
```"

The Vitest run and the `compare-baseline.mjs` comparator are invoked manually.
Neither is in the `package.json` test script. The document accurately describes
the budget table and the refresh protocol (`refresh-perf-baseline:` PR convention),
but the framing of "CI gate" is aspirational rather than operational.

The budget table itself is accurate and well-structured:

| Metric | Budget | Notes |
|--------|--------|-------|
| `project.avgMs` | 1.5 ms | Currently exceeded (2.05 ms per Phase 2 evidence) |
| `renderObject.avgMs` | 1.0 ms | Defined |
| `renderPretty.avgMs` | 5.0 ms | Defined |
| `isBundleP50Micros` | 50 us | Defined |
| `projectionHotPaths.patternSatisfiesTag.avgMs` | 8.0 ms | Defined |
| `projectionHotPaths.buildBoundedContext.avgMs` | 8.0 ms | Defined |

**Fix:** Change "CI gate" to "perf comparator" throughout. Add a note: "The
comparator is not yet wired into `pnpm test` (tracked as Cleanup-C-PROJ-1). Until
wired, run both commands above after any projection-layer change on the hot path."

---

## 8. Finding Index by Severity

| ID | Severity | Description | Location |
|----|----------|-------------|----------|
| DOC-PROJ-H-1 | High | README usage example omits required `packageResolver` — produces TS2322 | `README.md:29` |
| DOC-PROJ-H-2 | High | MIGRATION.md claims perf gate "live in CI" — unwired | `docs/MIGRATION.md:62` |
| DOC-PROJ-H-3 | High | README "renderers operate on Fragments only" contradicts MARKDOWN_NORMALIZERS | `README.md:74–75`, `render-markdown.ts:208–219` |
| DOC-PROJ-M-1 | Medium | No cross-package consumer import guidance (what NOT to import) | `README.md` (missing section) |
| DOC-PROJ-M-2 | Medium | README overstates `project*` read scope as "only `context.graph`" | `README.md:68` |
| DOC-PROJ-M-3 | Medium | Trust boundary section silent on C-PROJ-2 outlier | `README.md:99–101`, `open-question-list.ts:38` |
| DOC-PROJ-M-4 | Medium | `_internal/` directory vs `.internal.ts` suffix convention undocumented | `README.md` (missing section) |
| DOC-PROJ-M-5 | Medium | `ddd-inventory.md` missing 9 fragment entries (catalog stale) | `docs/ddd-inventory.md` |
| DOC-PROJ-L-1 | Low | ADR references never linked to `architect/decisions/` files | `README.md`, `docs/MIGRATION.md` |
| DOC-PROJ-L-2 | Low | `blocks/schema.ts` unannotated — Block hierarchy invisible to PatternGraph | `src/blocks/schema.ts` |
| DOC-PROJ-L-3 | Low | `context/projection-context.ts` unannotated | `src/context/projection-context.ts` |
| DOC-PROJ-L-4 | Low | `routing/route-id.ts` unannotated | `src/routing/route-id.ts` |
| DOC-PROJ-L-5 | Low | `projections/errors.ts` unannotated (confirms L-PROJ-A-5) | `src/projections/errors.ts` |
| DOC-PROJ-L-6 | Low | `parseAndProject*` / `project*` missing `@throws` JSDoc | All projection files |
| DOC-PROJ-L-7 | Low | PERF.md calls itself a "CI gate" while documenting local-only procedure | `docs/PERF.md:3` |

---

## 9. What Is Healthy and Should Be Preserved

- **`jsdoc-boilerplate-audit.mjs`** — mechanical CI-enforced check against the three
  worst boilerplate phrases. The only such audit in the family. Passes cleanly.
  Promote to workspace level after closing the audit-script gap (Cleanup-M-PROJ-1).

- **Fragment-level "Value / Invariant / Behavior / When to Use" structure** — the
  annotated projections and fragments use a consistent four-section module-level JSDoc
  pattern that is more informative than anything in core. It communicates intent,
  contract, and use case in a scannable format.

- **`docs/MIGRATION.md` Table A/B/C** — the most complete codec-to-projection
  transition record in the family. Accurate and should be preserved as the historical
  reference for any v1→v2 migration.

- **`docs/ddd-inventory.md` composition map** — the two-level composition map
  correctly documents the nested relationships for `SessionContextBundle`,
  `PatternDetail`, and other composites. Once the 9 missing entries are added, this
  will be the authoritative fragment catalog.

- **60% annotation rate** — more than double core's 26%. The 6-subdomain partition
  is visible in the PatternGraph via `@architect-bounded-context:*` tags on subdomain
  barrels.

- **No core DOC-H-3 boilerplate recurrence** — the `jsdoc-boilerplate-audit.mjs`
  audit is working exactly as designed.
````
