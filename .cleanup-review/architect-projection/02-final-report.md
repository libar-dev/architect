# Cleanup Review — `@libar-dev/architect-projection`

## Review Target

`packages/architect-projection/src/**` — 146 TS files, ~15.3k LOC.
Fragment / Projection / Renderer pipeline. The largest package in the suite,
ships the CI perf regression gate (36-pattern / 108-rule fixture,
`baseline × 1.5`). Detailed agent reports:
[`01a-code-quality.md`](./01a-code-quality.md) · [`01b-architecture.md`](./01b-architecture.md) · [`01c-simplification.md`](./01c-simplification.md) · [`01-cleanup-findings.md`](./01-cleanup-findings.md).

## Executive summary

The 62 findings across the three agents reduce to **five structural root
causes**. Most of the high-impact issues are not independent — they are
symptoms of one of these five mechanisms. Action plan is organised by root
cause; fixing each collapses 3–15 findings.

The package is, in many dimensions, the most disciplined in the suite —
zero non-strict `z.object` callsites, no `@ts-ignore` / `eslint-disable` /
`@deprecated` / `as any`, uniform `parseAndProject` boundary, only two
`.parse(` sites in the entire src tree (both at module-init on static data).
The damage is **architecturally narrow**: the markdown renderer's content
boundary has three independent ADR-009 bypasses, four sites still build
relationship lookups locally (the ADR-006 anti-pattern named "Re-derived
Relationship"), and the `RenderableDocument` IR that ADR-005 promised was
never actually built — there is a 2,222-line markdown renderer hosting all
of it instead.

Raw counts: **6 Critical · 14 High · 18 Medium · 13 Low** (quality + arch) +
**5 High · 9 Medium · 5 Low** simplification opportunities.

---

## What the package gets right (front-load before the findings)

These are real load-bearing strengths and they bound how bad the findings are:

- **Zero non-strict `z.object` callsites** across 146 files — RC-CORE-2 is closed here.
- **No `@ts-ignore`, no `eslint-disable`, no `@deprecated` shims, no `as any`.**
- **`TRUSTED_MARKDOWN` symbol is module-scoped** — the renderer-private trust escape ADR-009 requires is genuinely private.
- **`parseAndProject` boundary is uniform** — only two `.parse(` sites in the entire src tree, both module-init on static data. The hot-path re-parse trap is closed.
- **JSON renderer is genuinely codec-agnostic.**
- **URL sanitisation is a single documented chokepoint** with a scheme allowlist — the right architecture, even where the chokepoint has bugs.
- **No circular imports**, no reaches into `architect-core/src/extractor` or `src/scanner`.

The root causes below are real damage in real surfaces; they are not "the package is broken."

---

## Root causes (the synthesis)

### RC-PROJ-1 — The `RenderableDocument` IR ADR-005 promised was never actually built

**Pattern.** ADR-005 specifies a typed `RenderableDocument` intermediate representation: codecs decode `PatternGraph → RenderableDocument`, then a codec-agnostic renderer consumes the IR. In practice the IR was skipped — fragments became the de-facto IR, the markdown renderer is 2,222 lines with 10 bespoke per-fragment normalizers dispatching on fragment kind, and there is a hidden reflection-based path via `(fragment as Record<string, unknown>)['sections']` in `normalizeGenericFragment`.

**Findings this explains.**
- Architecture H2 — no shared `RenderableDocument`.
- Architecture H3 — hidden parallel rendering path via reflection (`normalizeGenericFragment`).
- Architecture M6 — 2,222-line `render-markdown.ts` mixes dispatch, primitives, and security-critical URL sanitisation.
- Architecture M1 — renderer reaching into `projections/governance/taxonomy-digest.ts` for `summarizeTaxonomyDigest` (would not be necessary if rendering operated on a typed IR).
- The renderer hosts **all of RC-PROJ-2 below** — every markdown content-safety bypass lives easier in a 2,222-line dispatcher.

**ADR anchor.** ADR-005 §Rule 2 ("RenderableDocument is a typed intermediate representation") and §Rule 5 ("The markdown renderer is codec-agnostic"). The current renderer is *not* codec-agnostic — it knows the shape of every fragment kind.

**Structural fix.** This needs a project-level decision, captured in an ADR amendment:

- **Option A — formalize the Fragment-as-IR hybrid.** Treat fragments themselves as the IR; rewrite the markdown renderer over a small block vocabulary; delete the per-fragment normalizers. ADR-005 is amended to reflect what shipped.
- **Option B — build the `RenderableDocument`** ADR-005 originally specified. Codecs translate fragments → blocks; the renderer becomes a small per-block dispatcher.

Either option closes the gap; neither requires a rewrite of the entire package. Without this decision, the renderer is the structural home for every future markdown bug.

### RC-PROJ-2 — Markdown content-safety contract has three independent escape stages, each with a bug

**Pattern.** ADR-009 specifies a plain-text-by-default content boundary with a renderer-private trust escape. The renderer implements this as **three independent escape stages** — URL scheme check, control-char filter, prose escape — each written separately and each with a different bypass. The architecture (one chokepoint per concern) is right; the implementation has three bugs at the chokepoints.

**Findings this explains.**
- C1 — HTML-entity-encoded payloads pass the URL sanitiser (`&#x6A;avascript:`).
- C2 — Control-char filter is ASCII-only; U+0085 / U+2028 / U+2029 pass through.
- C3 — `escapePlainMarkdownLine` does not escape `=` runs → setext-heading injection in prose.
- High (quality) H3 — `mailto:` accepted with no inner validation.
- High (quality) H4 — incomplete entity decoder.
- High (quality) H9 — unsanitised Mermaid labels.
- High (quality) H10 — brittle percent-encoded path classification.
- Low (quality) — decode-failure silent fallback.

**ADR anchor.** ADR-009 explicitly enumerates the boundary: "Markdown renderers escape plain-text prose/list/link labels, validate outbound URL schemes, reject protocol-relative targets, and allow raw content only for intentional surfaces such as code fences and mermaid diagrams." The current implementation honours the structure but leaks at each stage.

**Structural fix.** Coordinated content-boundary pass on `renderers/render-markdown.ts`:

1. URL stage — HTML-entity decode before scheme check; tighten allowlist; reject percent-encoded scheme separators.
2. Control-char stage — Unicode-aware filter (use `\p{Cc}\p{Cf}` with the `u` flag, not ASCII-only ranges).
3. Prose stage — escape `=`, `-` runs at column 1 to prevent setext-heading injection.
4. Mermaid stage — allow-list characters in mermaid labels; route untrusted strings through an escape.

Add a property-based fuzz suite over the boundary (the inputs are well-defined). This is the single highest-priority correctness work in the package.

### RC-PROJ-3 — `Re-derived Relationship` anti-pattern at four sites

**Pattern.** ADR-006 §Anti-patterns names this verbatim: consumers must not build `Map<string, ExtractedPattern[]>` from `pattern.implementsPatterns` / `uses` / `dependsOn`. The `relationshipIndex` already computes it. Four sites still do.

**Findings this explains.**
- Architecture C1 — `projections/_shared/pattern-helpers.internal.ts` (root cause of the cluster).
- Architecture C2 — `projections/governance/decision-records.internal.ts`.
- Architecture C3 — `projections/operational-insights/index.ts` — **actively contradicts the index** by falling back to raw `pattern.uses?.length`.
- Architecture H1 — `projections/execution-context/scope-readiness.internal.ts`.
- Several Mediums in the optional-chain shims spread from C1.

**ADR anchor.** ADR-006 §Rule 3 ("Relationship resolution is computed once") and the named Anti-patterns table.

**Structural fix.** Replace local Map/Set construction with reads from `relationshipIndex` in all four files. One coordinated commit, ~50 lines of diff per file. Add an ESLint rule banning construction of `Map`/`Set` keyed by pattern name from `pattern.implementsPatterns` / `pattern.uses` / `pattern.dependsOn` outside `architect-core/src/generators/pipeline/relationship-resolver.ts`. CI then prevents recurrence.

**Side benefit.** `relationshipIndex` reads are O(1); the parallel constructions were O(n). Perf gate should tick down.

### RC-PROJ-4 — Allocation hot-paths matter because the perf gate ships here

**Pattern.** Several individually-small findings sit on the exact code paths the 36-pattern / 108-rule perf fixture exercises. None will fail the gate today, but every future feature ships through them.

**Findings this explains.**
- H5 — `new Set(visited)` per recursion in `dependency-tree.internal.ts`.
- H6 — `changedFiles.map(normalizePath)` re-allocated per pattern in PR review.
- H7 — `Array.some` O(n²) dedup in `session-context`.
- M3 — redundant `requirePattern` in `projectPatternDetail`.
- M4 — wasted copy in `filterPatterns(undefined)`.
- M5 — `JSON.stringify` per bundle entry for token estimates.
- Knock-on from RC-PROJ-6 below — every `...(x !== undefined ? { x } : {})` is an empty-object allocation in the rendering hot path.

**ADR anchor.** Not directly an ADR — engineering doctrine ("perf regression gate") in `CLAUDE.md`.

**Structural fix.** Group into a dedicated "perf hot-path sweep" sprint where each change runs `pnpm test:perf:baseline` and the wins are measured against the gate. Don't bundle with RC-PROJ-2 / RC-PROJ-3 fixes — those are correctness, this is throughput.

### RC-PROJ-5 — Duplicated helpers + parallel implementations (No-BC echo)

**Pattern.** Same shape as architect-core's RC-CORE-4: convention-only no-BC, no mechanical audit, parallel implementations accumulate.

**Findings this explains.**
- Simplification H2 — `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` duplicated **verbatim** between `_shared/pattern-helpers.internal.ts` and `governance/business-rules.internal.ts`.
- Simplification H3 — `getPatternName` and `normalizeAnnotationText` each have two parallel definitions across `_shared` and `governance-shared`.
- Architecture M3 — `governance/index.ts` re-exports a type from an `.internal.ts` sibling (the `.internal` convention is breached).
- Architecture M2 — `documentation-type-registry.*.ts` is a four-file naming pattern that is neither `.internal.ts` nor publicly exported (undefined privacy).
- Architecture Low-3 — `architect-core` schemas re-exported through the projection public surface.

**Structural fix.** Pick one canonical location for each duplicated helper; delete parallels. Pre-1.0, no-BC. Tighten `test:barrel-audit` — its current scope (`*OptionsSchema` only) misses every finding above; the audit should also flag:
- Cross-file duplicate function bodies (AST-based, name-agnostic).
- Imports from `.internal.ts` files outside the same directory.
- Public-surface exports that match a `architect-core` type name (re-export drift).

### RC-PROJ-6 — Conditional-spread sprawl (≈80 sites — cross-package with core's RC-CORE-6)

**Pattern.** Same root cause as architect-core's RC-CORE-6, second instance. ≈80 sites of `...(x !== undefined ? { x } : {})`. A `definedOnly()` helper retires the lot. Allocation-count win in the rendering hot path (every empty-object spread allocates).

**Findings this explains.**
- Simplification H1 — 80 sites flagged.
- Architecture H4 — optional-chain shims spreading from C1; intersects.
- Knock-on improvement on RC-PROJ-4 perf hot-paths.

**Structural fix.** Reuse the `pickDefined` / `definedOnly` helper landed for RC-CORE-6 — exported from `architect-core` and imported here. One cross-package coordinated commit. Risk near-zero because `parseAndProject*` re-validates downstream and types are unchanged.

### RC-PROJ-7 — Hygiene audits exist but are too narrow

**Pattern.** The package already ships `test:barrel-audit` (`scripts/options-schema-barrel-audit.mjs`) and `test:jsdoc-boilerplate-audit` (`scripts/jsdoc-boilerplate-audit.mjs`). Both are insufficient — `test:barrel-audit` only checks `*OptionsSchema`, and `test:jsdoc-boilerplate-audit` did not stop 67 verbatim `### When to Use` headers from landing.

**Findings this explains.**
- Simplification M8 — 67 files carry `### When to Use` JSDoc boilerplate.
- Simplification M9 — ~25 `.internal.ts` files have two adjacent JSDoc blocks where one would do.
- All of RC-PROJ-5's findings (the audits should have caught the duplicated helpers and the `.internal` exports).

**Structural fix.** Tighten both audits. After tightening:
- One sweep removes the 67 boilerplate hits.
- The duplicated helpers from RC-PROJ-5 fail CI until removed.
- The four-file `documentation-type-registry` naming pattern is decided one way or the other.

---

## Findings the synthesis does NOT explain (genuinely independent)

- **Silent path-canonicalisation drops** (code-quality H1) — narrow bug in `markdown-paths.ts`.
- **Lossy JSON routing serialisation** (code-quality H2) — `render-json.ts` specific.
- **Unbounded fuzzy-suggestion scan on errors** (code-quality H8) — error helper hot path.
- **Error-type inconsistency in `route-id.ts`** (code-quality Low) — unrelated to any cluster.
- **Vocabulary drift `Block` vs `SectionBlock`** (architecture Low-1) — ADR-005 amendment territory.

Five surgical fixes, individually small.

---

## Recommended Action Plan (root-cause ordered)

| Order | Root cause | Fix | Findings collapsed |
| ----- | ---------- | --- | ------------------ |
| 1 | RC-PROJ-2 | Coordinated content-boundary pass on `render-markdown.ts` + property-based fuzz suite | C1, C2, C3 + 4 Highs + 1 Low |
| 2 | RC-PROJ-3 | Replace 4 local Map/Set constructions with `relationshipIndex` reads + ESLint rule | C1-arch, C2-arch, C3-arch, H1-arch + perf side-benefit |
| 3 | RC-PROJ-1 | ADR amendment + IR consolidation (project decision required first) | H2, H3, M6, M1 — unlocks all future renderer work |
| 4 | RC-PROJ-6 | Reuse core's `pickDefined`; refactor 80 sites | 1 H simplification + perf knock-on |
| 5 | RC-PROJ-5 | Helper-duplication sweep + tighten `barrel-audit` | 2 H + 2 M simplifications, 2 M architecture |
| 6 | RC-PROJ-7 | Tighten `jsdoc-boilerplate-audit` + sweep | 67-file boilerplate + ~25 file dedup |
| 7 | RC-PROJ-4 | Perf hot-path sweep, measured against `test:perf:baseline` | 5 Highs + 2 Mediums |
| — | independent | 5 surgical fixes | individual |

Ordering rationale:
- 1 + 2 are the package's correctness gaps; do first.
- 3 is a precondition for further renderer evolution but requires a project-level decision — could happen in parallel.
- 4 + 5 are coordinated with `architect-core` (cross-package root causes); one ADR-aligned commit cycle.
- 6 mechanizes drift prevention before further refactors land.
- 7 last — measurable, lower-stakes.

## Verification Suggestions

- After RC-PROJ-2: markdown XSS regression suite with HTML-entity payloads, Unicode line separators, setext-heading injection, mermaid label fuzz.
- After RC-PROJ-3: `pnpm test:perf` should be flat or improved.
- After RC-PROJ-4 + RC-PROJ-6: `pnpm test:perf:baseline` measures allocation pressure improvements.
- `pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck` after each chunk.

## Review Metadata

- Phase 1 agents: `cleanup-review:code-reviewer`, `cleanup-review:architect-review`,
  `cleanup-review:code-simplifier` (parallel)
- Bootstrap: `architect-base` + `architect-data-api` loaded for every agent
- ADR anchors used: 005, 006, 009
- Read-only review — no source modifications
- **Synthesis note**: organised by root cause; severity counts and per-agent reports remain available in linked files. Root causes RC-PROJ-5 (No-BC) and RC-PROJ-6 (conditional-spread sprawl) are echoes of RC-CORE-4 and RC-CORE-6 — see suite final report for cross-package linkage.
