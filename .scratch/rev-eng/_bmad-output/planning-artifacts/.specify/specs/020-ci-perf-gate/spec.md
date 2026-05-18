# Feature: CI Workflows + Perf Regression Gate

## Status

❌ MISSING — `.github/workflows/` is absent from this worktree at the pinned commit; the perf regression test code exists in `architect-projection`'s test suite but the CI surface that enforces it on every PR is invisible.

## Overview

NFR-004 mandates that `architect-projection` median latency stay within `baseline × 1.5` against the 36-pattern / 108-rule fixture. `AGENTS.md` repeatedly claims "CI-enforced doctrine" and a "Perf regression gate" — yet the `.github/workflows/` directory does not exist in this worktree. Either CI runs on a system not visible from the codebase (GitLab? self-hosted?), or it has not been re-introduced post-W1.5 split. Either way, an outside contributor reading the repo today sees claims of CI enforcement with no corresponding surface — a high-impact doctrine drift.

This gap covers more than just performance. The doctrine in `AGENTS.md` lists six gates that **all** changes must pass: `pnpm typecheck`, `pnpm test`, `pnpm validate:all`, `pnpm format:check`, `pnpm guard:no-suppressions`, and the projection perf gate. Each gate exists as a workspace script, but none of them are wired to a PR-blocking workflow visible in the repository. Pre-commit (`architect-guard --staged`) catches some of this locally, but local hooks are not enforcement — they are advisory and can be bypassed with `--no-verify`.

Strategically, this is the **single most-impactful debt item in the worktree** (tech-debt #5, High Impact / Medium Effort / Strategic quadrant per `technical-debt-analysis.md`). The platform's value proposition is "deterministic gates and CI-enforced doctrine"; the absence of a visible CI surface undermines the proposition even when the underlying code is correct. The remediation is a single medium PR (≈1 day per `technical-debt-analysis.md` §Suggested Migration Phases / Phase B) that commits a `.github/workflows/` directory and wires each script.

The perf regression gate itself is more nuanced. The test code uses a 36-pattern / 108-rule fixture with a median-latency budget of `baseline × 1.5`. The baseline file (presumably checked in alongside the fixture) needs to be updated deliberately when a profile-justified speedup or slowdown is accepted — not auto-updated, otherwise the gate becomes meaningless. The workflow must surface drift to the reviewer rather than silently re-baseline.

The "Either CI runs elsewhere or has not been re-introduced post-split" ambiguity is itself a tracked drift item that should be resolved in the same PR — either by adding the workflows or by documenting the external CI location in `AGENTS.md` so contributors can find it.

## User Stories

- As a **contributor** opening a PR, I want CI to run `pnpm typecheck`, `pnpm test`, `pnpm validate:all`, `pnpm format:check`, `pnpm guard:no-suppressions`, and the projection perf gate automatically on every push, so doctrine violations are blocked before merge rather than relying on maintainer review.
- As an **architect maintainer**, I want the perf regression gate to fail loudly when the projection-pipeline median latency drifts above `baseline × 1.5` against the 36-pattern / 108-rule fixture, so I am not blindsided by perf regressions at release time.
- As an **AI-augmented developer** evaluating the platform, I want the `.github/workflows/` directory to exist as evidence that the "CI-enforced doctrine" claims in `AGENTS.md` are real, so I can trust that downstream changes are gated rather than landing on faith.
- As a **CI maintainer**, I want the perf-gate baseline file to be human-updateable but not auto-updated by the workflow, so the gate retains its meaning across releases.
- As a **release manager**, I want a separate `release.yml` workflow that consumes changesets and publishes the five fixed-versioned packages, so the `coordinated-package-versioning` feature has a corresponding execution surface.

## Acceptance Criteria

- [ ] `.github/workflows/` directory committed at repo root.
- [ ] `.github/workflows/ci.yml` runs on every push and pull_request targeting `main`.
- [ ] `ci.yml` runs `pnpm install` with frozen lockfile.
- [ ] `ci.yml` runs `pnpm typecheck` and blocks merge on failure.
- [ ] `ci.yml` runs `pnpm test` across all five publishable packages (2828+ tests) and blocks on failure.
- [ ] `ci.yml` runs `pnpm validate:all` (DoD + anti-pattern detection) and blocks on failure.
- [ ] `ci.yml` runs `pnpm format:check` (Prettier) and blocks on failure.
- [ ] `ci.yml` runs `pnpm guard:no-suppressions` (custom guard script + ESLint rule `architect-local/no-suppression-comments`) and blocks on failure.
- [ ] `ci.yml` runs the projection perf gate against the 36-pattern / 108-rule fixture with the `baseline × 1.5` threshold per NFR-004; failure blocks merge.
- [ ] Perf baseline file is checked in and updated deliberately via PR — workflow does not auto-update it.
- [ ] `.github/workflows/release.yml` consumes `@changesets/cli`, respects the `fixed` group, and publishes on tagged releases with `access: public` per NFR-009.
- [ ] If CI also runs on a non-GitHub system (GitLab, self-hosted), that location is documented in `AGENTS.md` §"Operational notes" (resolves the "either/or" ambiguity in tech-debt #5).
- [ ] `AGENTS.md` §"Engineering doctrine" and §"Perf regression gate" link to `.github/workflows/ci.yml` so the doctrine claims have a verifiable surface.

## Technical Requirements

- **Runner**: GitHub Actions on `ubuntu-latest` (cheapest, matches the rest of the npm ecosystem).
- **Node version matrix**: At minimum, current LTS. Match `engines` declared in workspace `package.json`s.
- **pnpm**: Use `pnpm/action-setup` to install the pinned pnpm version.
- **Caching**: Cache the pnpm store keyed by `pnpm-lock.yaml` hash to keep run times reasonable.
- **Workflow files** (minimum):
  - `.github/workflows/ci.yml` — typecheck, test, validate:all, format:check, guard:no-suppressions, perf gate.
  - `.github/workflows/release.yml` — changesets-driven publish.
- **Perf gate**:
  - Fixture: 36 patterns / 108 rules (existing).
  - Threshold: median latency ≤ `baseline × 1.5`.
  - Baseline source: committed file (not workflow-mutated).
  - Output: workflow log shows `median / baseline / ratio`; failure prints the offending pattern subset.
- **No-suppressions enforcement**: workflow runs both `architect-local/no-suppression-comments` ESLint rule and `scripts/guard-no-suppressions.mjs` — they catch different shapes.
- **Invariants preserved**:
  - NFR-001 (TypeScript strictness flags) verified by `pnpm typecheck`.
  - NFR-003 (no-BC doctrine) verified by `pnpm guard:no-suppressions`.
  - NFR-004 (perf budget) verified by perf gate.
  - NFR-008 (acyclic package dependency graph) verified by `pnpm validate:all`.
  - NFR-010 (fixed changesets group) preserved by `release.yml` respecting the group.

## Implementation Status

**Completed:**

- ✅ Perf regression test code exists in `architect-projection`'s test suite (referenced in `AGENTS.md` §"Perf regression gate").
- ✅ All workspace scripts exist and are runnable locally: `pnpm typecheck`, `pnpm test`, `pnpm validate:all`, `pnpm format:check`, `pnpm guard:no-suppressions`, `pnpm architect:guard --staged`.
- ✅ `architect-local/no-suppression-comments` ESLint rule + `scripts/guard-no-suppressions.mjs` enforce the no-BC doctrine when invoked.
- ✅ `.changeset/config.json` defines the `fixed` group with all six packages.
- ✅ ESLint config (`eslint.config.mjs`, 434 lines) is substantive — not boilerplate.

**Missing / Drift:**

- ❌ `.github/workflows/` directory absent (tech-debt #5, High Impact / Medium Effort, Strategic quadrant).
- ❌ No `ci.yml` wiring the six gates.
- ❌ No `release.yml` consuming changesets.
- ❌ AGENTS.md claims "CI-enforced doctrine" but the enforcement surface is invisible — doctrine drift (tech-debt #5).
- ⚠️ Ambiguity unresolved: either CI runs on a non-GitHub system or has not been re-introduced post-W1.5 split. The maintainer must decide and document.
- ⚠️ Perf-gate baseline-update process not documented (must be manual to keep the gate meaningful).

## Dependencies

- `004-fragment-projection-pipeline` — supplies the perf gate's test target and the 36-pattern / 108-rule fixture.
- `014-no-suppression-enforcement` — supplies the guard script + ESLint rule that the workflow invokes.
- `017-coordinated-package-versioning` — `release.yml` depends on the `fixed` changesets group being intact.
- `019-formal-spec-package` — depends on `release.yml` to publish `@libar-dev/architect-spec` on tagged release.
- External tooling: GitHub Actions, `pnpm/action-setup`, `@changesets/cli`.

## Related Specifications

- `architect/decisions/ADR-009` — Projection Trust Boundary (the perf gate exercises the same pipeline).
- `technical-debt-analysis.md` item #5 — **High Impact / Medium Effort / Strategic quadrant** — single medium PR estimated at ≈1 day (`Phase B` in §Suggested Migration Phases).
- `technical-debt-analysis.md` §"Code-Quality Posture" — confirms all six gate scripts exist and are runnable.
- `AGENTS.md` §"Engineering doctrine" and §"Perf regression gate" — the doctrine claims this spec gives a verifiable surface.
- `functional-specification.md` NFR-004 — the perf budget this gate enforces.
- `017-coordinated-package-versioning` and `019-formal-spec-package` — both depend on the release workflow.
