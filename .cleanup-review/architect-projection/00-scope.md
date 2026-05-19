# Cleanup Review — `@libar-dev/architect-projection`

## Target

`packages/architect-projection/src/**` — the Fragment / Projection / Renderer
pipeline. Consumes the `PatternGraph` from `architect-core`, produces typed
Named Domain Fragments, and routes them through codec-agnostic renderers
(markdown, JSON, compact-text, UI).

- **TS files**: 146
- **Lines of code**: ~15,318 (largest package in the suite)
- **Subtree distribution**:
  - `_internal/` — slug, format utils (private)
  - `blocks/` — fragment block schema (the leaf type vocabulary)
  - `context/` — `ProjectionContext` builders
  - `disclosure/` — disclosure levels and spec
  - `fragments/` — `base.ts`, `fragment-schema.internal.ts`, fragment index
  - `projections/` — pattern-relations, execution-context, delivery-reporting, governance, operational-insights, documentation-composition, errors
  - `renderers/` — markdown, JSON, compact-text, UI renderers, markdown-paths, types
  - `routing/` — route-id
  - `shared/` — plain-object helper

## Package facts

- Public surface: 7 subpath exports (`./blocks`, `./context`, `./disclosure`, `./routing`, `./fragments`, `./projections`, `./renderers`) plus the barrel `.`.
- Runtime deps: `@libar-dev/architect-core` (workspace), `zod`.
- `sideEffects: false`.
- Has its own audits and a perf regression gate:
  - `test:barrel-audit` (`scripts/options-schema-barrel-audit.mjs`)
  - `test:jsdoc-boilerplate-audit` (`scripts/jsdoc-boilerplate-audit.mjs`)
  - `test:perf` + `test:perf:baseline` (36-pattern / 108-rule fixture; `baseline × 1.5` gate)

## Architectural responsibilities

Per ADR-005 (Codec / Renderer Separation) and ADR-009 (Projection Trust Boundary):

- `parseAndProject*` is the only sanctioned raw-input entry. Internal callers use
  typed `project*` helpers and typed fragment builders — no re-parsing on hot paths.
- Fragments carry plain-text fields unless a renderer-owned block explicitly marks
  inline Markdown as trusted. Markdown renderers escape prose, validate URL
  schemes, reject protocol-relative targets.
- Renderer is codec-agnostic — same renderer handles any RenderableDocument.

## ADRs that bind this package

- **ADR-005** — Codecs are pure functions; renderer consumes a typed IR (RenderableDocument); CompositeCodec assembles children in declared order.
- **ADR-006** — Consume the `PatternGraph` read model; no Lossy Local Types; no Re-derived Relationships; no Parallel Pipeline.
- **ADR-009** — `parseAndProject*` is the raw-input trust boundary. Plain-text content boundary at fragment text fields. Public names follow fragment-kind vocabulary.

## Review plan

1. **Phase 1 — three parallel agents (each loads the bootstrap):**
   - `code-reviewer` — quality, correctness, security (URL/schema escapes!), perf, reliability
   - `architect-review` — ADR-005/006/009 conformance, boundary discipline, fragment/projection/renderer separation
   - `code-simplifier` — simplification opportunities (read-only)
2. **Phase 2 — consolidated final report** at `02-final-report.md`.

## Output files

- `.cleanup-review/architect-projection/00-scope.md` (this file)
- `.cleanup-review/architect-projection/01-cleanup-findings.md`
- `.cleanup-review/architect-projection/02-final-report.md`
- `.cleanup-review/architect-projection/state.json`
