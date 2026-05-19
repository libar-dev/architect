# Cleanup Review — `@libar-dev/architect-core`

## Target

`packages/architect-core/src/**` — the canonical model, scanner / extractor pipeline,
taxonomy registry, configuration loader, validation schemas, and `PatternGraphAPI`
read surface for the entire architect family.

- **TS files**: 106
- **Lines of code**: ~9,746 (cloc)
- **Top-level subtrees**:
  - `config/` — `defineConfig`, project / role / preset constants, config loader, workflow loader
  - `domain-enums.ts` — canonical enum values shared across the family
  - `extractor/` — gherkin extractor, doc extractor, dual-source extractor, shape extractor, extraction-diagnostics, layer inference
  - `generators/` — internal generators used by `architect-cli` / docs pipeline
  - `package/` — package metadata helpers
  - `read-api/` — `PatternGraphAPI` (the single read model surface)
  - `scanner/` — directive scanner, file scanner, source-stripping
  - `taxonomy/` — canonical tag values (status, maturity, role, layer, product-area, conventions, etc.)
  - `types/` — branded primitives, `Result` type, error hierarchy
  - `utils/` — string/markdown/argv helpers, fuzzy matching, runtime helpers
  - `validation/` — schema-level validators (not the FSM guard — see `architect-guard`)
  - `validation-schemas/` — Zod schemas at the boundaries

## Package facts

- Public surface (`exports`): `.` (barrel) and `./config`.
- Runtime deps: `@cucumber/gherkin`, `@cucumber/messages`, `@typescript-eslint/typescript-estree`, `glob`, `zod`.
- `sideEffects: false`.
- Node ≥ 20.

## Architectural responsibilities

`architect-core` is the **ingestion and read-model** layer. It does NOT render, does NOT validate FSM transitions, does NOT host CLI / MCP commands.

- Produces the `PatternGraph` consumed by `architect-projection`, `architect-guard`, and queried via `architect-cli` / `architect-mcp`.
- Owns the canonical pattern shape (`ExtractedPattern`, branded IDs, taxonomy enums).
- Owns extraction-time diagnostics (silent-drop avoidance per ADR-007 §Context).

## ADRs that bind this package

- **ADR-003** — TS source owns pattern identity; tier-1 specs are ephemeral.
- **ADR-006** — Single read model: consumers query `PatternGraph`, not raw extractor/scanner output (with named exceptions: `lint-patterns.ts`, `AntiPatternDetector`, `CoverageAnalyzer`, `SessionStateReader`).
- **ADR-007** — `AcceptedStatusValue` (5 values) at extraction boundaries, `ProcessStatusValue` (4 values) inside FSM. Unified role replaces categories + arch-role. Maturity axis replaces track tag.

## Review plan

1. **Phase 1 — three parallel agents (each loads the bootstrap):**
   - `code-reviewer` → quality, correctness, security, perf, reliability
   - `architect-review` → ADR conformance, boundary correctness, read-model adherence, no parallel pipelines
   - `code-simplifier` → simplification opportunities (read-only)
2. **Phase 2 — consolidated final report** at `.cleanup-review/architect-core/02-final-report.md`.

## Output files

- `.cleanup-review/architect-core/00-scope.md` (this file)
- `.cleanup-review/architect-core/01-cleanup-findings.md`
- `.cleanup-review/architect-core/02-final-report.md`
- `.cleanup-review/architect-core/state.json`
