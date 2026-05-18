# Feature: Coordinated Package Versioning

## Status
⚠️ PARTIAL — Lockstep versioning via `fixed` changesets group ships and works; the W1.5 split-package migration is not fully landed (tech-debt #7); v1→v2 collision map lives in `REMAINING-WORK.md` §W1.5.7 and has not yet graduated to a standalone `MIGRATION.md` (tech-debt #8).

## Overview

All six publishable packages — `@libar-dev/architect-core`, `architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`, and the `@libar-dev/architect` meta package — are versioned in lockstep. This is enforced by the `fixed` group in `.changeset/config.json`. Any change to any package bumps every package together; consumers never face a partial-bump matrix where, say, `core@1.4.0` is incompatible with `projection@1.3.7`.

This invariant is load-bearing because the dependency graph between the packages is tight: `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp` (constitution §III.D). A `core` schema change implicitly invalidates downstream consumers; lockstep versioning makes the invalidation visible as a coordinated bump.

The implementation is mature, but **two pre-1.0 completion items remain open**:

1. **W1.5 split-package migration not fully landed** (tech-debt #7). The original v1 monolith has been split into the five publishable packages, but lingering work tracked in `REMAINING-WORK.md` (57 KB) is still in flight — the maintainer's working backlog supersedes anything else on this point.
2. **v1→v2 collision map is not yet a standalone document** (tech-debt #8). The map currently lives in `REMAINING-WORK.md` §W1.5.7 and is scheduled to graduate to `MIGRATION.md` at the `2.0.0-pre.1` release. Today consumers reading `MIGRATION.md` (8 KB) get the old v1-monolith → v2-split story but not the full symbol-relocation map.

This spec captures both the working state and the gaps so the migration can land cleanly.

## User Stories

- As a consumer of `@libar-dev/architect-*`, I want all six packages versioned in lockstep so I never face a partial-bump compatibility puzzle.
- As an architect maintainer, I want `@changesets/cli` to refuse a non-lockstep version bump so the invariant is enforced by tooling, not by reviewer attention.
- As a consumer migrating from v1 to v2, I want a single `MIGRATION.md` with the full symbol-relocation table so I do not have to spelunk through `REMAINING-WORK.md`.
- As an architect maintainer, I want the W1.5 lift completed before cutting `1.0` so the splits stabilize without further reshuffling.
- As a CI maintainer, I want the perf-regression gate (constitution §III.E) to run against every lockstep bump so cross-package perf drift is caught at release time.

## Acceptance Criteria

- [x] `.changeset/config.json` has a `fixed` array containing all six publishable packages.
- [x] A changeset that bumps only one package fails the changesets CLI (lockstep enforcement).
- [x] `access: public` is set so all six packages publish to the public npm registry.
- [x] Constitution §III.F (Coordinated Versioning) documents the invariant.
- [x] AGENTS.md §"Package family" enumerates the six packages and their dependency direction.
- [ ] **W1.5 split-package migration fully landed.** Tracked in `REMAINING-WORK.md` (57 KB). (tech-debt #7)
- [ ] **Standalone `MIGRATION.md` with v1→v2 collision map.** Currently in `REMAINING-WORK.md` §W1.5.7, scheduled to graduate at `2.0.0-pre.1`. (tech-debt #8)
- [x] Meta package `@libar-dev/architect` has **no JS exports** — bin re-exports only (AGENTS.md §"Package family").
- [x] The dependency graph remains acyclic: `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp` (constitution §III.D).

## Technical Requirements

- **Surface**: `.changeset/config.json` (fixed group), `@changesets/cli` v2.27.x.
- **Lockstep invariant**: every release tag advances all six packages by the same semver step.
- **Dependency direction**: enforced by both convention and the build graph (circular imports are rejected).
- **Meta package**: bin-only re-export; no JS API surface; consumers needing JS imports must depend on the splits.
- **Migration doc**: `MIGRATION.md` to be expanded with the full symbol-relocation map (see W1.5.7 in `REMAINING-WORK.md`).
- **Invariants**:
  - No package is versioned independently of the others.
  - The meta package never gains a JS export — if a consumer needs `import x from '@libar-dev/architect'` it is a sign the consumer should depend on the appropriate split directly.
  - Changesets `access: public` (no private publishes).

## Implementation Status

**Completed:**
- ✅ `.changeset/config.json` `fixed` array enforces lockstep.
- ✅ All six packages publish; `access: public`.
- ✅ Acyclic dependency graph stable.
- ✅ Meta package is bin-only (no JS exports).
- ✅ Constitution §III.F and §III.D capture the invariants.

**Missing / Drift:**
- ⚠️ Tech-debt #7 — W1.5 split-package migration not fully landed. Working backlog in `REMAINING-WORK.md` (57 KB). Owned by the maintainer; estimate not derivable from the worktree.
- ⚠️ Tech-debt #8 — v1→v2 collision map graduation to standalone `MIGRATION.md` (8 KB) at `2.0.0-pre.1`. Today's `MIGRATION.md` carries the old v1-monolith → v2-split story but not the full symbol-relocation map. Effort: ≈1-2 hours; falls out of #7 at release prep.

## Dependencies

- `@changesets/cli` v2.27.x (release tooling).
- npm registry (publication target).
- Spec 001 (`pattern-graph-construction`) — `core` is the dependency root; its bumps propagate.
- Spec 004 (`fragment-projection-pipeline`) — `projection` consumes `core`.
- Spec 005 (`cli-surface`) — `cli` consumes `guard` → `core`.
- Spec 006 (`mcp-server`) — `mcp` consumes `core` + `projection`.

## Related Specifications

- AGENTS.md §"Package family" (the six-package table).
- AGENTS.md §"Dependency direction" (acyclic invariant).
- Constitution §III.D (Dependency Direction) and §III.F (Coordinated Versioning).
- `MIGRATION.md` (current v1→v2 narrative; pending the collision-map graduation).
- `REMAINING-WORK.md` §W1.5.7 (the source of the not-yet-graduated collision map).
- `technical-debt-analysis.md` Items #7, #8 (Strategic quadrant).
- `functional-specification.md` FR-018, NFR-008.
