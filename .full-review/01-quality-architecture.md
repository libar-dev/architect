# Phase 1: Code Quality & Architecture Review

Reviewed: `packages/architect-projection/` against the doc-generation consolidation campaign drafted in `.pr-coordination/`.

Raw reports: `01a-code-quality-raw.md`, `01b-architecture-raw.md`.

The two reviews were run independently and **converged on the same structural finding**: a closed dispatch table + entangled documentation types + scattered disclosure ownership form a tightly-coupled subsystem in `src/projections/documentation-composition/` that is precisely what the campaign needs to replace. The convergence is high-signal — not parallel observations of different problems, but two views of the same problem.

## Headline

**The campaign cannot land as a layer on top of the current `documentation-composition/` subsystem. It must replace the registry-driven dispatch core. Pre-split that core before W-DOCS-1, do not retrofit.**

The good news: the layers _around_ that core (BlockSchema substrate, ProjectionBundle routing, parseAndProject trust boundary, OUTPUT-side disclosure with `splitOversizedDocument`) are well-positioned to host `DocDefinition` and `ContentFragment` as new peers.

## Critical issues (campaign blockers)

### C1 — Closed dispatch core is the campaign's substrate, not an obstacle to route around

**File:** `src/projections/documentation-composition/documentation-bundle.internal.ts:64`
**Convergence:** code-quality C1 + architecture F1.

`DOCUMENTATION_PROJECTION_FACTORIES` is statically typed against `SupportedDocumentationType`, a union derived via `as const` from the registry literal in `documentation-types.ts`. Adding a doc requires editing the union, the registry, and the dispatch table in lockstep. The campaign's `DocDefinition.build(graph)` API IS the replacement for this core, not a layer on top of it.

**Action:** delete the registry-driven dispatch when `DocDefinition` lands. Do not parallel-implement (no-BC). Do not extend the union — every new entry deepens the carve-out.

### C2 — `documentation-types.ts` conflates identity, output routing, disclosure policy, and CLI surface

**File:** `src/projections/documentation-composition/documentation-types.ts:35-47, 140-340` (517 LOC total)
**Convergence:** code-quality C2 + architecture F2.

One Zod object holds: doc identity, where it writes on disk, disclosure policy, CLI exposure flags, and the now-dead `'dropped'` lifecycle markers. The campaign's "three orthogonal layers" reframe (Extractors / Routing / Composition / Output-routing) cannot land cleanly until each concern owns its own type.

**Action:** decompose along the campaign's four layer lines. Do this BEFORE introducing `DocDefinition` so the new API consumes orthogonal types from day one.

## High-priority findings (cause major rework if not addressed pre-campaign)

### H1 — Types derived from literal, not from schema (Zod-first violation)

**File:** `documentation-types.ts:140-340` (code-quality H1)

Registry types are produced from the literal via `typeof REGISTRY[number]` instead of via `z.infer<DocumentationTypeSchema>`. Inverts the project's Zod-first doctrine. When `DocDefinition` arrives via config, schema/type drift is guaranteed.

**Action:** schema is canonical; literal is data validated by it.

### H2 — `status: 'dropped'` registry entries are a no-BC shim

**File:** `documentation-types.ts:49-59, 294-339` (code-quality H2 + architecture F3)

`'dropped'` entries exist to keep the registry literal type-compatible with vanished generators. Violates the no-BC doctrine directly, and will collide name-for-name with the campaign's restored `reference` doc.

**Action:** delete the `'dropped'` entries and any code that filters on them.

### H3 — Renderers reach into `documentation-composition/` for metadata (ADR-005/009 drift)

**File:** `src/renderers/render-markdown.ts:50-52`, `src/renderers/markdown-paths.ts:3-4, 26-49` (code-quality H3 + architecture F4)

`render-markdown.ts` calls `getDocumentationTypeMetadata()` and consumes `disclosureMatrix` at render time. `markdown-paths.ts` parses `routing.rootRouteId.split(':')[0]` to derive doc-type-aware behavior. Renderers are doc-type-aware — direct violation of ADR-005 (codec/renderer separation) and ADR-009 (projection trust boundary).

The ContentFragment proposal will route MORE markdown through these paths. The leak gets worse, not better.

**Action:** push disclosure onto `bundle.routing.disclosureSpec` at projection time; renderer trusts the bundle. No renderer-side lookups into the registry.

### H4 — Hardcoded doc-type strings leak across modules

**File:** `src/renderers/markdown-paths.ts:26-49`, `src/fragments/delivery-reporting/index.ts` (code-quality H4)

String literals `'requirements-executable'`, `'milestones'`, etc. appear at routing decision points outside the registry. Symptom of routing-as-data being incompletely realized.

**Action:** routing decisions belong on the registry entry. Renderers consume `bundle.routing`, period.

### H5 — `render-markdown.ts` is 2152 lines, 80 top-level functions, ~10 fragment-specific normalizers

**File:** `src/renderers/render-markdown.ts` (code-quality H5)

ContentFragment will add 6–10 more normalizers. The normalizer table needs to move into fragment-owned modules with a `toMarkdownBlocks(fragment)` contract; render-markdown.ts becomes a thin dispatcher.

**Action:** move per-fragment markdown normalizers into the fragment modules themselves. Renderer dispatches on `Fragment.kind`, doesn't know fragment internals.

### H6 — `MarkdownDocument` envelope is unexported and unschema'd

**File:** `render-markdown.ts` (code-quality H6)

The intermediate envelope is private + structural. The campaign's `composeDoc(title, sections)` returning `RenderableDocument` will compete with it.

**Action:** schema-fy and export, or replace with `RenderableDocument` when that type lands. Don't ship both.

### H7 — Disclosure vocabulary lives inside `documentation-composition/` but is package-wide

**File:** `src/renderers/types.ts` imports `DisclosureSpec` + `LogicalRouteId` from `projections/documentation-composition/` (architecture F5 + F17 + F18)

`DisclosureSpec`, `LogicalRouteId`, and the disclosure enum are conceptually package-level primitives but live inside one projection domain. Layering inversion that the campaign's input-side disclosure axis will exacerbate.

**Action:** promote to `src/disclosure/` + `src/routing/` as peer concerns before adding the input-side axis.

### H8 — 43 projections have three inconsistent signature flavors

**File:** various `parseAndProject*` wrappers (architecture F8)

`DocDefinition.build(graph)` runners cannot call the projections uniformly without an adapter layer. Adapter layers proliferate.

**Action:** normalize to one signature shape before W-DOCS-2. Variance is technical debt that compounds when the campaign adds 6+ new extractors.

## Medium-priority findings (should fix before campaign starts)

### M1 — `Fragment` is a closed 43-variant discriminated union keyed on `kind`

**Reference:** architecture F9 + F19

`ContentFragment` and `RenderableDocument` in PROPOSED-DESIGN don't have a `kind` discriminator and shouldn't — they're composition primitives, not domain fragments. Renderer dispatch needs a top-level distinction.

**Action:** define `RenderInput = ProjectionBundle<Fragment> | RenderableDocument` and have renderers dispatch on input shape first, then on `kind` if it's a `Fragment`.

### M2 — `_internal/` boundary is naming convention, not enforced

**Reference:** architecture F6

`*.internal.ts` files are referenced externally in places. Campaign will introduce a new consumer surface (`DocDefinition` callers) — the boundary needs teeth.

**Action:** lint rule or barrel discipline to make `_internal/` actually sealed.

## Welcomes — what to NOT touch

The architecture review surfaced five places where the current design is well-positioned for the campaign. **Preserve these as-is:**

1. **`BlockSchema` discriminated union** (`src/blocks/schema.ts`) — the 9-block-type substrate. Hosts ContentFragment-emitted blocks without redesign.
2. **`parseAndProject` trust-boundary helper** — clean ADR-009 implementation; reuse for new extractors.
3. **`ProjectionBundle` / `BundleRouting` / `LogicalRouteId` fan-out machinery** — already does multi-target routing; campaign's `DocTarget[]` layers on top.
4. **The `*.ts` ⟷ `*.internal.ts` paired-module pattern** — uniform convention, just needs enforcement (M2).
5. **OUTPUT-side disclosure already wired through `renderMarkdown`** via `splitOversizedDocument`. The campaign's INPUT-side axis composes orthogonally; don't refactor the output side.

## Fights — what to address before the campaign starts

Ranked by campaign impact:

1. **Closed registry-and-dispatch core** (C1, C2, H2). Pre-split, don't retrofit.
2. **Disclosure ownership scattered across renderer + registry + bundle routing** (H3, H7). Consolidate before adding input-side axis.
3. **`documentation-types.ts` mega-module** (C2, H1). The campaign lands here — decompose first.
4. **Renderer doc-type awareness** (H3, H4, H5). Renderers must trust the bundle, not look things up.
5. **Projection signature variance** (H8). Normalize before `DocDefinition.build()` arrives.

## Critical issues for Phase 2 context

The Phase 2 reviewers should give weight to:

- **Trust boundary erosion in markdown rendering** — `render-markdown.ts` (2152 LOC) has fragment-specific normalizers and consumes registry metadata at render time. Security audit should verify no user-controlled strings reach `escapeText`-bypass paths, and that the `link-out` schema is enforced consistently across all 10+ normalizers.
- **Performance risk in the dispatch core** — every doc-gen run walks the 12-entry table. The campaign will multiply this to 40+ docs. Performance review should confirm the perf gate (`baseline × 1.5`) covers `documentation-composition` end-to-end, not just isolated fragment projection.
- **`render-markdown.ts` size** is a security-review concern (large attack surface for markdown-injection bugs) and a perf concern (cold start + cache pressure).
- **`status: 'dropped'` entries** may be referenced from CI / `docs:all` scripts — verify deletion doesn't silently break the build chain.
