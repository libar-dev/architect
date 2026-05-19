# architect-projection — Phase 1 Consolidated Findings

Three parallel reviews complete. Detailed per-agent reports:

- Code quality: [`01a-code-quality.md`](./01a-code-quality.md) — 27 findings (3 Critical, 10 High, 12 Medium, 10 Low)
- Architecture:  [`01b-architecture.md`](./01b-architecture.md) — 16 findings (3 Critical, 4 High, 6 Medium, 3 Low)
- Simplification: [`01c-simplification.md`](./01c-simplification.md) — 19 opportunities (5 High, 9 Medium, 5 Low) + 7 themes

## What the package gets right

Worth surfacing before the findings, because the discipline is real:

- **Zero non-strict `z.object` callsites** across 146 files — the doctrine landed here.
- **No `@ts-ignore`, no `eslint-disable`, no `@deprecated` shims, no `as any`.**
- **`TRUSTED_MARKDOWN`** symbol is properly module-scoped; the renderer-private escape hatch ADR-009 requires is actually private.
- **`parseAndProject` boundary is uniform** — only two `.parse(` sites in the entire src tree, both at module-load on static data. The hot-path re-parse trap is not present.
- **JSON renderer is genuinely codec-agnostic.**
- **URL sanitisation is a single documented chokepoint** with a scheme allowlist — the right architecture, even where the chokepoint has bugs (see C-PROJ-1 below).
- **No circular imports**, no reaches into `architect-core/src/extractor`.

The findings below are concentrated in three architecturally narrow surfaces — the **markdown renderer's content-safety contract**, the **re-derived relationship anti-pattern**, and **boilerplate / aliasing sprawl** in projection helpers.

## Cross-cutting themes

### T-PROJ-1 — Markdown content-safety contract has three concrete bypasses (ADR-009)

The single most damaging cluster: the markdown renderer's escape pipeline has three independent flaws that each violate ADR-009's plain-text-by-default contract:

- **C1 (quality)** — HTML-entity-encoded payloads pass the URL sanitiser (`&#x6A;avascript:` etc.).
- **C2 (quality)** — Control-char filter is ASCII-only; the renderer accepts U+0085 / U+2028 / U+2029 which can break out of contexts.
- **C3 (quality)** — `escapePlainMarkdownLine` does not escape `=` runs, allowing setext-heading injection in prose.

Add H4 (incomplete entity decoder), H9 (unsanitised Mermaid labels), and H10 (brittle percent-encoded path classification) and the renderer's content boundary needs a coordinated fix — not one-by-one patches.

### T-PROJ-2 — Re-derived Relationship anti-pattern (ADR-006) at four sites

The **architecture** agent surfaced the same anti-pattern at four call sites. ADR-006 §Anti-patterns names this verbatim — consumers should never build `Map<X, Y[]>` from `pattern.implementsPatterns` / `uses` / `dependsOn`; the `relationshipIndex` already computes it. The four sites:

- `projections/_shared/pattern-helpers.internal.ts` (root cause; C1 in architecture report)
- `projections/governance/decision-records.internal.ts` (C2)
- `projections/operational-insights/index.ts` (C3) — actively contradicts the index by falling back to raw `pattern.uses?.length`
- `projections/execution-context/scope-readiness.internal.ts` (H1)

This is the largest architectural drift in the package and is in tension with the otherwise strong ADR-006 adherence at package boundaries.

### T-PROJ-3 — The codec/IR layer ADR-005 promised was never built

**Architecture H2/M6.** ADR-005 mandates a `RenderableDocument` IR consumed by a codec-agnostic renderer. In practice:

- There is no shared `RenderableDocument`.
- The markdown renderer is **2,222 lines** with 10 bespoke per-fragment normalizers dispatching on fragment kind.
- The hidden parallel path via `(fragment as Record<string, unknown>)['sections']` reflection in `normalizeGenericFragment` (H3) is exactly the "codec knows about codecs" coupling ADR-005 was written to prevent.

This is the foundational gap. Every renderer-side bug listed in T-PROJ-1 lives easier in a 2,222-line dispatcher than it would in a small renderer over a typed IR. Resolution requires a project-level decision: formalize the Fragment-as-IR hybrid that has *de facto* emerged, OR build the originally-intended `RenderableDocument`.

### T-PROJ-4 — Conditional-spread sprawl + duplicated helpers (≈80 sites)

**Simplification H1–H5.** The same problem architect-core had, at similar scale:

- ≈80 sites of `...(x !== undefined ? { x } : {})` collapse to one `definedOnly()` helper. Renderer hot paths also win on allocation count.
- `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` are duplicated **verbatim** between `_shared/pattern-helpers.internal.ts` and `governance/business-rules.internal.ts`.
- `getPatternName` and `normalizeAnnotationText` each have two parallel definitions across `_shared` and `governance-shared`.
- 12-arm repetition in `createScopeReadinessCheck`, three repetitions in `buildTreeNode`.

The duplicate-helper cluster is *also* a No-BC violation in spirit — the codebase grew parallel implementations rather than picking one.

### T-PROJ-5 — Allocation hot-paths matter (perf gate ships here)

The package has a 36-pattern / 108-rule CI fixture with a `baseline × 1.5` budget. Five code-quality findings sit on the same hot paths as the perf gate watches:

- **H5** — `new Set(visited)` per recursion in `dependency-tree.internal.ts`.
- **H6** — `changedFiles.map(normalizePath)` re-allocated per pattern in PR review.
- **H7** — `Array.some` O(n²) dedup in `session-context`.
- **M3** — redundant `requirePattern` in `projectPatternDetail`.
- **M4** — wasted copy in `filterPatterns(undefined)`.

These won't fail the gate today but they are the load-bearing surfaces — every future feature ships through them.

### T-PROJ-6 — Barrel hygiene and naming drift

**Architecture M2 / M3 / Low-1 / Low-3:**

- `documentation-type-registry.*.ts` is a four-file naming pattern that is neither `.internal.ts` nor publicly exported — undefined privacy.
- `governance/index.ts` re-exports a type from an `.internal.ts` sibling — the `.internal.ts` convention is breached.
- Vocabulary drift between `Block` and ADR-005's `SectionBlock`.
- `architect-core` schemas re-exported through the projection public surface — surface bloat that the audits don't cover.

The existing `test:barrel-audit` only checks `*OptionsSchema` and misses these. The audit is too narrow.

### T-PROJ-7 — JSDoc boilerplate (auditable, just enable it)

**Simplification M8/M9** — 67 files carry verbatim `### When to Use` boilerplate. The `test:jsdoc-boilerplate-audit` script exists but is not stopping new boilerplate from landing. Tighten the audit or delete what it doesn't catch.

### T-PROJ-8 — Silent failures in routing and parse paths

**Code quality H1 (silent path-canonicalisation drops), H2 (lossy JSON routing serialisation), Low-2 (decode-failure silent fallback), Architecture M4 (parseAndProject's loss of Zod issue context).** Smaller in scope than architect-core's silent-drop cluster but the same shape — failures that should surface as diagnostics return defaults or `''`.

## How to read the priority list

The package's discipline is strong overall — better than core's in several dimensions. The concrete pain is **all** at the markdown renderer (content safety + IR gap) and at the four re-derived-relationship sites. Everything else is leverage refactors (the ≈80-site conditional-spread cluster) that improve maintainability and modestly improve perf.
