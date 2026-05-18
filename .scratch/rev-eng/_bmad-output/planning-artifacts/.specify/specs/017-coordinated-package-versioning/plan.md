# Implementation Plan: Coordinated Package Versioning (W1.5 Close-out + MIGRATION.md Graduation)

## Goal

Complete the W1.5 split-package migration (tech-debt #7) and graduate the v1→v2 collision map from `REMAINING-WORK.md §W1.5.7` into a standalone `MIGRATION.md` aligned with the `2.0.0-pre.1` release (tech-debt #8), so the six-package family ships its first release with a fully-landed split and a citation-stable migration document.

## Current State

### What works today

- `.changeset/config.json` defines a `fixed` group containing all six publishable packages: `@libar-dev/architect-core`, `architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`, and the `@libar-dev/architect` meta. A single-package bump is rejected by `@changesets/cli`.
- All six packages publish with `access: public` (NFR-009).
- The dependency direction is acyclic (constitution §III.D): `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`. No runtime package depends on the meta.
- The meta package has **no JS exports** — bin re-exports only (AGENTS.md §"Package family").
- `MIGRATION.md` at repo root (8 KB today) carries the v1-monolith → v2-split narrative — the broad-strokes story is correct.

### What is in flight

- The W1.5 split-package migration. The live working backlog is `REMAINING-WORK.md` (57 KB). The maintainer's own self-assessment in `docs/DOCS-GAP-ANALYSIS.md` is authoritative on what remains.
- Outstanding items track at least: post-split test fixture reorganization, taxonomy retirement (e.g. `@architect-usecase` per recent commit `691da3c`), and any in-flight v1 symbol re-export removals.

### What is missing

- A standalone, self-contained `MIGRATION.md` that includes the full **v1 → v2 symbol-relocation table** (per-export source path → destination package + import example). Today this map exists only as `§W1.5.7` inside `REMAINING-WORK.md`. Consumers reading `MIGRATION.md` get the high-level reshuffle but not the symbol-level guidance needed to update their imports.
- A clear post-W1.5 release plan — when the `fixed` group cuts `2.0.0-pre.1`, how does the prerelease channel handle it, what does the rollback story look like.

## Target State

After this plan lands:

- Every item flagged in `REMAINING-WORK.md` as W1.5-scope is either landed, deferred with a tracked follow-up, or explicitly out-of-scope-for-1.0 with rationale.
- `MIGRATION.md` includes the full symbol-relocation table extracted from `§W1.5.7`. Each entry has: v1 symbol name, v1 import path, v2 destination package, v2 import path, and a copy-pasteable before/after import example. No consumer needs to spelunk `REMAINING-WORK.md` to migrate.
- `REMAINING-WORK.md §W1.5.7` is either deleted (graduated) or marked "graduated — see MIGRATION.md".
- `2.0.0-pre.1` is cut via `pnpm changeset version` with the `fixed` group intact; all six packages move together.
- The acyclic dep graph is verified post-cut (no new cycles introduced during the close-out).
- All five remaining `[ ]` items in spec `017`'s acceptance criteria flip to `[x]`.

## Technical Approach

1. **Audit W1.5 remainder.** Read `REMAINING-WORK.md` end-to-end (it is 57 KB; the maintainer's canonical backlog). Categorize each open item: must-land-pre-1.0, defer-with-issue, drop-from-scope. Produce a checklist that the rest of this plan can drive against.

2. **Validate the dependency graph and bin set.** Run `pnpm --filter ... ls` per package to confirm the import graph matches the documented direction. Run `pnpm exec architect-cli` style invocations on each bin to confirm the seven bins still resolve. The meta package must continue to expose only bin re-exports.

3. **Extract the v1→v2 collision map.** Open `REMAINING-WORK.md §W1.5.7`. For each entry, capture: v1 symbol name; v1 import path (likely `@libar-dev/architect`); v2 destination package; v2 import path; a one-line note if the symbol was also renamed during the move. Validate each entry against the actual exports of the target package — a `pnpm exec tsc --noEmit` against a tiny consumer fixture is the cheapest way to confirm import paths resolve.

4. **Author `MIGRATION.md`.** Structure: short executive summary; the high-level reshuffle (preserve from the current 8 KB); the new symbol-relocation table; a worked migration example for a non-trivial v1 consumer; pointers back to per-package READMEs and the constitution. Cite `2.0.0-pre.1` as the target release tag.

5. **Land remaining W1.5 work.** Drive the must-land-pre-1.0 items from step 1 to completion. Each lands as its own PR or atomic commit; this plan tracks coordination, not the individual work items.

6. **Cut `2.0.0-pre.1`.** Add a changeset for each open delta if not already in place. Run `pnpm changeset version` — verify all six packages bump in lockstep to `2.0.0-pre.1`. Run the full quality-gate stack (constitution §V) before publishing.

7. **Retire `REMAINING-WORK.md §W1.5.7`.** Either delete the section or replace with "graduated — see `MIGRATION.md`". Same treatment for any closed-out checklist items elsewhere in the file.

8. **Verify acyclic dep graph post-cut.** Run `pnpm validate:all` and inspect the import graph one more time. Any new cycles introduced by the close-out must be resolved before publish.

## Tasks

- [ ] Read `REMAINING-WORK.md` and produce a categorized W1.5 close-out checklist (must / defer / drop).
- [ ] Validate the import graph against the documented direction; document any deviations as new tech-debt items.
- [ ] Extract `§W1.5.7` collision map into a structured table (CSV or markdown table in-PR notes is fine for the working copy).
- [ ] For each entry, verify the v2 destination resolves: write a tiny consumer fixture and `pnpm exec tsc --noEmit` it.
- [ ] Author the new `MIGRATION.md` body — executive summary, reshuffle overview, symbol-relocation table, worked example, references.
- [ ] Land the must-land-pre-1.0 items from step 1 (own PRs per item).
- [ ] Add the changeset(s) for the prerelease bump.
- [ ] Run `pnpm changeset version` and confirm lockstep `2.0.0-pre.1` across all six packages.
- [ ] Retire `REMAINING-WORK.md §W1.5.7` (delete or mark graduated).
- [ ] Run constitution §V quality-gate stack: typecheck, test, validate:all, format:check, guard:no-suppressions, perf gate. All must pass.
- [ ] Run `pnpm exec architect-mcp --help` and `pnpm exec architect overview` smoke tests against the dogfood workspace.
- [ ] Publish `2.0.0-pre.1` via the release workflow (depends on plan 020 for `release.yml`) or manually if the workflow is not yet in place.
- [ ] Update `017-coordinated-package-versioning/spec.md` — flip the two `[ ]` items to `[x]`.

## Risks & Mitigations

- **Risk**: `REMAINING-WORK.md` contains items the maintainer considers out-of-scope-for-1.0 and which a plan-driver might wrongly chase.
  - **Mitigation**: The categorization step (1) must be reviewed by the maintainer before driving any further work. The plan provides the structure; the maintainer owns the scope call.
- **Risk**: A symbol in `§W1.5.7` no longer exists in v2 (renamed or removed during the lift) — the migration table contains a dead row.
  - **Mitigation**: The `tsc --noEmit` validation in step 4 catches this. Removed/renamed symbols get a special row in the table flagging the removal with a recommended replacement, not a dead import path.
- **Risk**: Cutting `2.0.0-pre.1` exposes a new cycle introduced by an unrelated PR.
  - **Mitigation**: `pnpm validate:all` runs on every quality gate; a cycle would have been caught earlier. If discovered at release time, hold the cut and patch the offender in a follow-up.
- **Risk**: `fixed` group enforcement fails (a future package addition forgets to register).
  - **Mitigation**: Spec 020's `release.yml` should verify the `fixed` group includes every workspace package marked `private: false`. Add an assertion now.
- **Risk**: Prerelease channel misconfiguration causes `2.0.0-pre.1` to publish as a stable release.
  - **Mitigation**: Use `@changesets/cli pre enter` explicitly; verify with a `--dry-run` first; review the resulting tarball before `npm publish`.

## Testing Strategy

- **Unit tests**: existing test suite (2828+ tests) must continue to pass.
- **Integration tests**: the projection perf-regression gate (NFR-004) must remain green against the 36-pattern / 108-rule fixture.
- **Consumer-fixture test**: a small downstream consumer (mock package importing from each of the six published packages) compiled with `pnpm exec tsc --noEmit` after the bump confirms every v2 import path resolves. This fixture can live under `tests/migration-consumer/` and be invoked by CI on prerelease.
- **Executable Gherkin**: existing scenarios under `tests/features/` and `packages/*/tests/features/` continue to pass.
- **Smoke tests**: every bin runs `--help` without error.

## Success Criteria

- All acceptance criteria in `017-coordinated-package-versioning/spec.md` reach `[x]`.
- `MIGRATION.md` contains the full symbol-relocation table; no migrating consumer needs to read `REMAINING-WORK.md`.
- `2.0.0-pre.1` published with all six packages in lockstep; the `fixed` group invariant is intact.
- `REMAINING-WORK.md §W1.5.7` retired (deleted or marked graduated).
- All constitution §III gates pass: typecheck, test, validate:all, guard, format:check, guard:no-suppressions, perf gate (within `baseline × 1.5`).
- `pnpm validate:all` reports no cycle, no anti-pattern regressions, no DoD failures.
- Acyclic dep graph (§III.D) preserved.

## Dependencies / Coordination

- **Plan 020** (`020-ci-perf-gate`) — provides `release.yml` which consumes `@changesets/cli` and respects the `fixed` group. If plan 020 has not landed by `2.0.0-pre.1` time, the prerelease can be cut manually; preferred sequence is **plan 020 first**, then this plan uses its `release.yml`.
- **Plan 019** (`019-formal-spec-package`) — the spec package is currently inside the `fixed` group. Plan 019 wants to extract it post-1.0 so methodology and impl move on independent cadences. This plan should keep the spec **inside** the `fixed` group for `2.0.0-pre.1`; plan 019 handles the extraction in a later cycle.
- **Plan 006** (`006-mcp-server`) — completely independent (docs-only); does not block this plan.
- **Maintainer authority**: `REMAINING-WORK.md` is the maintainer's canonical backlog and supersedes anything in this plan. The scope categorization step (1) must be maintainer-reviewed.
- **External tooling**: `@changesets/cli` v2.27.x, npm registry, GitHub Actions (if `release.yml` is wired by then).
