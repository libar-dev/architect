# Feature: Dangling Reference Tracking

## Status

✅ COMPLETE — `architect arch dangling [--strict] [--baseline <p>] [--write-baseline]` enumerates unresolved pattern references with baseline-aware comparison; `--strict` exits non-zero on any unresolved reference.

## Overview

When a pattern in the PatternGraph references another pattern by name — via `@architect-implements`, `depends-on`, `uses`, `enables`, `extends`, `see-also`, or `api-ref` — the build pipeline resolves that reference to a concrete node. If the target does not exist (typo, rename, deleted pattern), the reference is **dangling**. Dangling references are not fatal during build (FR-016: tolerant ingestion), but they degrade graph queries and erode trust in the source-first invariant (ADR-003) over time.

This feature gives operators a way to enumerate dangling references at any time and, crucially, to **gate CI** on their absence. The `--strict` flag converts the report into a non-zero exit; the `--baseline <p>` flag enables progressive tightening — capture the current set as a baseline, then fail only on _new_ dangles. The `--write-baseline` flag updates the baseline file in place after the maintainer has accepted a known-good state.

This is the runtime realization of FR-015 and supports the constitution's Principle 5 (Deterministic Verdicts) by making "is the graph clean?" a one-command, single-exit-code question.

## User Stories

- As an architect maintainer, I want `architect arch dangling` to list every unresolved pattern reference so I can find typos before they accumulate.
- As a CI maintainer, I want `architect arch dangling --strict` to exit non-zero so my CI pipeline fails on any new dangling reference.
- As an architect maintainer, I want `--baseline <path>` so I can ratchet down dangles incrementally rather than fixing everything at once.
- As an architect maintainer, I want `--write-baseline` so I can capture the current state as the new floor after deliberate cleanup.
- As an AI coding agent, I want JSON output so I can parse the dangling set programmatically and propose fixes.

## Acceptance Criteria

- [x] CLI verb `architect arch dangling` is registered (dispatched via `writeStructuredResponse(ctx, 'arch', …)`).
- [x] Accepts `--baseline <p>` to compare against a stored set.
- [x] Accepts `--write-baseline` to overwrite the baseline file.
- [x] Accepts `--strict` to convert the dangling report into a non-zero exit.
- [x] Output enumerates source pattern, target name (unresolved), reference kind, and source location.
- [x] `--format json` produces structured output.
- [x] Reference kinds covered include all 7 relation enums (`depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`) per `architect-projection/src/fragments/pattern-relations/supporting.ts:66-74`.
- [x] No silent drops — every unresolved reference appears in the report or in `featureParseFailures` (per FR-016).
- [x] Exit code `0` on clean run or when baseline absorbs all dangles; `1` only with `--strict` and unbaselined dangles.
- [x] Verb is documented alongside the other `arch` subcommands in `integration-points.md` §CLI Surface.

## Technical Requirements

- **Surface**: `architect arch dangling [--baseline <p>] [--write-baseline] [--strict]` CLI verb.
- **Underlying type**: `DanglingReference` exported from `@libar-dev/architect-core`.
- **Engine**: build-time resolution emits a `DanglingReference[]` alongside the validated `PatternGraph`.
- **Baseline format**: stable, diff-friendly representation (JSON sorted by `source`, then `target`, then `kind`).
- **Performance**: O(edges) — dangling detection is a single pass over the resolved edge index.
- **Invariants**:
  - Detection is deterministic: re-running on identical source yields byte-identical reports.
  - Exit code semantics align with the verdict vocabulary (`PASS` = exit 0; `BLOCKED` = exit 1 under `--strict`).
  - Baseline files are check-in-friendly: stable ordering, no timestamps, no machine paths.

## Implementation Status

**Completed:**

- ✅ `arch dangling` verb wired via the `arch` dispatcher in the CLI.
- ✅ `DanglingReference` type exported from `architect-core`.
- ✅ Resolution emitted at build time alongside `featureParseFailures` and other diagnostics.
- ✅ `--baseline` / `--write-baseline` / `--strict` flags documented in `integration-points.md` §CLI Surface.

## Dependencies

- Spec 001 (`pattern-graph-construction`) — build pipeline emits the `DanglingReference[]` payload.
- Spec 016 (`tolerant-spec-ingestion`) — feature-parse failures and dangling references are complementary diagnostic surfaces; neither crashes the build.
- Spec 005 (`cli-surface`) — `arch` dispatcher exposes this verb.

## Related Specifications

- `data-architecture.md` §1a (PatternGraph fields including diagnostics).
- `decision-rationale.md` — the seven relation kinds and why dangling tracking matters.
- AGENTS.md §"Engineering doctrine" — references the dangling baseline workflow.
- `functional-specification.md` FR-015.
- Tech-debt #3 — the "four edges" framing in CLAUDE.md is incomplete; the projection layer has seven relation kinds, all of which can dangle.
