# Feature: Doc-Generation Pipeline (`pnpm docs:all`)

## Status
✅ COMPLETE — `architect-generate` bin runs 8 default generators against the live PatternGraph: `patterns`, `architecture`, `roadmap`, `changelog`, `requirements-executable`, `requirements-specs`, `decisions`, `taxonomy`. Output to gitignored `docs-live/`. Deterministic: re-running produces byte-identical output.

## Overview

The doc-generation pipeline is the on-disk projection of the in-memory `PatternGraph`. It takes the annotated TypeScript source plus Gherkin features and emits a stable set of markdown artifacts under `docs-live/`. There are eight default generators, each backed by a Fragment + renderer pair, each enumerated in `DEFAULT_GENERATORS` and dispatched by the `architect-generate` bin. The maintainer runs `pnpm docs:all` to regenerate the whole tree; CI and consumers can subset via `architect-generate -g <name>`.

Determinism is the load-bearing property here. Re-running the pipeline against the same source produces **byte-identical** output — no timestamps, no hash variation, no nondeterministic ordering. This is what lets the pipeline be useful as both a documentation surface and a diff-friendly review artifact: a doc change in a PR signals a model change, not a rebuild artefact. The codec/renderer split (ADR-005) is what makes this possible: codecs construct typed Fragments and renderers stamp them out deterministically.

`docs-live/` is **regenerated, not committed** (gitignored). The single source of truth remains annotated production code + executable Gherkin (Principle 2 of the constitution). The eight generators are projections — they can be replaced, augmented, or rerun without invalidating the source. The maintainer's `docs/` directory holds manual documentation; the `docs-sources/` directory holds inputs that feed those manuals; only `docs-live/` is regenerated.

Reference: `functional-specification.md` FR-012; `data-architecture.md` §3 Projection Fragments; `decision-rationale.md` ADR-005 (codec/renderer separation); `integration-points.md` §`architect-generate` flags.

## User Stories

- As an **AI-augmented developer**, I want `pnpm docs:all` to regenerate all 8 doc categories from current source so generated docs are never stale relative to code.
- As an **AI coding agent**, I want byte-identical re-runs so a documentation diff in a PR signals a real model change, not a rebuild artefact.
- As an **architect maintainer**, I want to subset the run via `architect-generate -g <name>` so I can iterate on one generator without rebuilding the entire tree.
- As a **consumer of the platform**, I want `docs-live/` to be gitignored so I cannot accidentally commit a stale projection.
- As a **doc-template author**, I want each generator backed by a Fragment + renderer pair (ADR-005) so I can change the renderer without touching the data model.

## Acceptance Criteria

- [x] `architect-generate` bin exists and is published as part of `@libar-dev/architect-cli` re-exports.
- [x] `DEFAULT_GENERATORS` enumerates exactly 8 entries: `patterns`, `architecture`, `roadmap`, `changelog`, `requirements-executable`, `requirements-specs`, `decisions`, `taxonomy`.
- [x] `pnpm docs:all` script in `package.json` invokes the bin with the default set.
- [x] Each generator produces output under `docs-live/`.
- [x] Re-running the pipeline against the same source produces byte-identical output (no embedded timestamps, no nondeterministic ordering).
- [x] `docs-live/` is gitignored.
- [x] `architect-generate -g <name>` subsets the run to the named generator (repeatable flag).
- [x] `architect-generate --list-generators` enumerates the available generators.
- [x] `-o <dir>` overrides the output root.
- [x] `-f` forces overwrite of existing output.
- [x] `--disclosure <level>` and `--filter <status=csv>` (repeatable) control output scope.
- [x] `--base-dir <dir>` selects the workspace root.
- [x] Each generator is backed by a Fragment kind + a renderer (ADR-005).
- [x] No generator invokes the shell, the network, or any non-deterministic API.

## Technical Requirements

- **Architecture**: Bin in `@libar-dev/architect-cli` (`generate-docs.ts`); generators in `@libar-dev/architect-projection`; fragment schemas in `architect-projection/src/fragments/`. Read side is `PatternGraphAPI` from `@libar-dev/architect-core`.
- **Inputs**: PatternGraph from current workspace; generator name(s); output directory; disclosure level; status filters.
- **Outputs**: Markdown files under `docs-live/<category>/`. JSON intermediates available via `--format json` per generator.
- **Performance**: Subject to the perf-regression gate (NFR-004) on the 36-pattern / 108-rule fixture. Drift over `baseline × 1.5` fails CI.
- **Invariants** (from `constitution.md` §II Principles 1, 3, 5; §III.E):
  - Source-first: `docs-live/` is never the source.
  - Single read model: every generator consumes one `PatternGraphAPI`.
  - Determinism: re-runs are byte-identical.
  - Perf regression gate: median latency within `baseline × 1.5`.

## Implementation Status

**Completed:**
- ✅ Bin: `packages/architect-cli/src/cli/generate-docs.ts`.
- ✅ `DEFAULT_GENERATORS` declared and exported.
- ✅ All 8 generators implemented with corresponding Fragment + renderer pairs.
- ✅ `pnpm docs:all` script wired in `package.json`.
- ✅ `docs-live/` gitignored.
- ✅ Flags: `-g`, `-o`, `-f`, `--list-generators`, `--base-dir`, `--disclosure`, `--filter`.
- ✅ Determinism verified by re-run-and-diff tests.
- ✅ Subject to perf-regression gate against the 36-pattern / 108-rule fixture.
- ✅ Executable Gherkin coverage in `packages/architect-projection/tests/features/` and `packages/architect-cli/tests/features/` for: all-eight-generators, subset-via-flag, byte-identical-rerun, output-dir-override, disclosure-filter, status-filter.

## Dependencies

- `001-pattern-graph-construction` — generators consume the in-memory PatternGraph.
- `003-pattern-graph-read-api` — read side is `PatternGraphAPI`.
- `004-fragment-projection-pipeline` — each generator is a Fragment + renderer pair.
- `002-trust-boundary-validation` — generator inputs validated at the boundary.
- External: `zod` (Fragment validation); no runtime external services.

## Related Specifications

- ADR-003 — Source-First Pattern Architecture (`docs-live/` is a projection, not the source).
- ADR-005 — Codec / Renderer Separation (every generator is a Fragment + renderer pair).
- ADR-006 — Single Read Model (`PatternGraphAPI` feeds every generator).
- ADR-009 — Projection Trust Boundary.
- Executable Gherkin: `packages/architect-projection/tests/features/generators-*.feature`; `packages/architect-cli/tests/features/generate-docs-*.feature`.
- See also: `.specify/specs/004-fragment-projection-pipeline/spec.md`, `.specify/specs/001-pattern-graph-construction/spec.md`.
