# Implementation Plan: CI Workflows + Perf Regression Gate

## Goal

Commit a `.github/workflows/` directory that enforces the six constitution §V quality gates on every PR (typecheck, test, validate:all, format:check, guard:no-suppressions, perf gate) and a release workflow that consumes `@changesets/cli` to publish the `fixed`-group packages on tagged release — turning "CI-enforced doctrine" from an `AGENTS.md` claim into a verifiable, blocking surface (tech-debt #5, Phase B, ≈4-8 hours).

## Current State

### What exists locally

- All six gate scripts work on the developer's machine:
  - `pnpm typecheck` — strict TS across the workspace (`tsconfig.base.json` + `tsconfig.architect-base.json`).
  - `pnpm test` — 2828+ tests across the five publishable packages.
  - `pnpm validate:all` — DoD + anti-pattern detection.
  - `pnpm format:check` — Prettier.
  - `pnpm guard:no-suppressions` — `architect-local/no-suppression-comments` ESLint rule + `scripts/guard-no-suppressions.mjs`.
  - The projection perf-regression test in `@libar-dev/architect-projection`'s test suite, exercising the 36-pattern / 108-rule fixture against the `baseline × 1.5` threshold per NFR-004.
- `eslint.config.mjs` is 434 lines — substantive enforcement, not boilerplate.
- `.changeset/config.json` defines the `fixed` group across all six publishable packages with `access: public`.
- `architect-guard --staged` runs as a pre-commit gate locally; bypassable with `--no-verify` and therefore advisory, not enforcement.

### What is missing

- **`.github/workflows/` directory is absent from the repository.** This is the load-bearing gap (tech-debt #5, High Impact / Medium Effort / Strategic).
- No CI workflow file wires the six local scripts to a PR-blocking surface.
- No `release.yml` consumes changesets; releases (whatever ones happened pre-W1.5) presumably ran manually.
- The "either CI runs on a non-GitHub system, or has not been re-introduced post-split" ambiguity is unresolved. Outside contributors form the impression that the doctrine claims are aspirational, not enforced.
- The perf-regression gate's baseline-file-update process is undocumented; a future maintainer might auto-update the baseline, silently defeating the gate.

## Target State

After this plan lands:

- `.github/workflows/` exists at repo root with at least two files (`ci.yml` + `release.yml`) — possibly a third for the perf gate if separated.
- Every push and PR targeting `main` runs the six gates; failure blocks merge.
- The projection perf-regression gate fires on every PR with the `baseline × 1.5` threshold; baseline is human-updateable only.
- The release workflow consumes `@changesets/cli` and publishes the `fixed` group with `access: public` per NFR-009.
- `AGENTS.md` §"Engineering doctrine" and §"Perf regression gate" link to `.github/workflows/ci.yml` so claims have a verifiable surface.
- If a non-GitHub CI also runs, its location is documented in `AGENTS.md` §"Operational notes" — resolving the ambiguity tracked in tech-debt #5.
- The perf-gate baseline update process is documented in `architect/decisions/` or `docs/`; humans update; workflow does not.

## Technical Approach

1. **Confirm CI provider.** Default assumption is GitHub Actions. If the maintainer's existing CI runs elsewhere (GitLab, self-hosted), this plan still commits the GitHub Actions surface; the external surface is documented separately. The choice is a maintainer call but does not block this plan.

2. **Author `.github/workflows/ci.yml`.** Single-file workflow with multiple jobs. Triggers: `push` and `pull_request` on `main`. Top-level setup steps (checkout, pnpm install with frozen lockfile, pnpm store cache keyed by `pnpm-lock.yaml`) are shared across jobs via a setup composite action or repeated inline. Jobs:
   - `typecheck`: `pnpm typecheck`.
   - `test`: `pnpm test` across all packages.
   - `validate`: `pnpm validate:all`.
   - `format`: `pnpm format:check`.
   - `guard`: `pnpm guard:no-suppressions`.
   - `perf`: `pnpm --filter @libar-dev/architect-projection test -- <perf-suite>` (the projection perf-regression suite). Captures `median / baseline / ratio` to the workflow log; failure prints the offending fixture subset.

3. **Author `.github/workflows/release.yml`.** Triggers: `push` on `main` after a changeset PR merges. Uses `changesets/action` (or equivalent) to: detect pending changesets; if present, open a "Version Packages" PR; if a version PR was just merged, run `pnpm publish` for the `fixed` group with `access: public`. Authenticates to npm via a `NPM_TOKEN` secret. Verifies the `fixed` group invariant before publish — a single-package divergence aborts.

4. **Perf-gate baseline policy.** Decide: baseline file lives at `packages/architect-projection/perf/baseline.json` (or wherever the existing perf test references). Workflow reads it; never writes it. Updating the baseline is a deliberate PR — likely after a profile-justified change — and shows up in `git diff` for the reviewer. Document this in `docs/PERF-GATE.md` or in `architect/decisions/` as a PDR.

5. **pnpm + Node setup.** Use `pnpm/action-setup@v3` to install the workspace's pinned pnpm version. Use `actions/setup-node@v4` with the current LTS Node (matching `engines` declared in workspace `package.json`s). Cache the pnpm store via `actions/cache@v4` keyed by `pnpm-lock.yaml`.

6. **First green run.** After committing the workflow files, open a no-op PR (e.g., a whitespace fix in `README.md`). All six gate jobs must pass green on first run. If any fail, fix the workflow or the underlying gap before merging.

7. **Documentation patches.** Update `AGENTS.md`:
   - §"Engineering doctrine" — link to `.github/workflows/ci.yml`.
   - §"Perf regression gate" — link to the perf job in `ci.yml` and to the baseline policy doc.
   - §"Operational notes" — if non-GitHub CI also runs, document its location.
   Update repo-root `README.md` with a CI badge.

8. **Coordinate with plan 017 and plan 019.** Plan 017 needs `release.yml` to cut `2.0.0-pre.1`; plan 019 needs it to publish `@libar-dev/architect-spec@1.0.0`. This plan ships `release.yml` first.

## Tasks

- [ ] Create `.github/workflows/` directory.
- [ ] Author `.github/workflows/ci.yml` with the six gate jobs (typecheck, test, validate, format, guard, perf).
- [ ] Wire `pnpm install --frozen-lockfile` and pnpm-store caching via `actions/cache`.
- [ ] Configure the matrix or single Node version (current LTS).
- [ ] Wire the perf job to run the projection perf-regression suite against the 36-pattern / 108-rule fixture with the `baseline × 1.5` cap.
- [ ] Configure perf-job output to log `median / baseline / ratio` and surface the offending fixture subset on failure.
- [ ] Author `.github/workflows/release.yml` consuming changesets; publish on tagged release with `access: public`.
- [ ] Add `NPM_TOKEN` secret to the repository (maintainer action — document the requirement in the PR description).
- [ ] Document the perf-baseline update policy — either `docs/PERF-GATE.md` or an ADR/PDR.
- [ ] Patch `AGENTS.md` §"Engineering doctrine" — link to `ci.yml`.
- [ ] Patch `AGENTS.md` §"Perf regression gate" — link to `ci.yml` and to the baseline doc.
- [ ] Patch `AGENTS.md` §"Operational notes" if non-GitHub CI also runs.
- [ ] Add a CI status badge to repo-root `README.md`.
- [ ] Open a no-op PR; verify all six gate jobs pass green.
- [ ] Fix any flaky / slow tests that surface under the workflow that did not surface locally.
- [ ] Confirm the workflow respects the `fixed` group in changesets — single-package divergence aborts.
- [ ] Update `020-ci-perf-gate/spec.md` — flip all `[ ]` acceptance criteria to `[x]`.

## Risks & Mitigations

- **Risk**: The workflow runs cost-real CI minutes; a slow test suite (2828+ tests) makes PR feedback painful.
  - **Mitigation**: Cache pnpm store. Parallelize jobs (each gate is its own job). Profile slow tests separately; investigate `test:fast` vs. full-suite trade-offs if needed.
- **Risk**: A test that passes locally fails in CI due to timing, machine load, or filesystem-order assumptions.
  - **Mitigation**: Surface specific flaky tests in the first green-run pass; either fix them or mark them with an explicit `// FLAKY` and a tracked issue. Do not skip them via `--no-verify`-style bypass — constitution §III.A forbids suppression.
- **Risk**: The perf gate's `baseline × 1.5` threshold proves too tight for normal noise on shared CI runners.
  - **Mitigation**: Run on `ubuntu-latest` exclusively (consistent baseline). If runner noise is real, document and tune the threshold in the baseline policy doc — but never auto-update the baseline.
- **Risk**: A consumer reading the new workflow assumes "CI green = production ready" even for prerelease packages.
  - **Mitigation**: Document explicitly in `AGENTS.md` that the `fixed` group is in prerelease (`2.x.x-pre.1`) until plan 017's `2.0.0` stable lands.
- **Risk**: Publishing the workflow exposes the maintainer to community PRs from external contributors — increased review load.
  - **Mitigation**: This is the intent. The blocking gates ensure the maintainer's review surface is bounded — only PRs that pass the doctrine reach review.
- **Risk**: `NPM_TOKEN` rotation or revocation breaks `release.yml` silently.
  - **Mitigation**: `release.yml` should fail loudly with a clear error message on token issues; document the rotation process in `docs/RELEASE.md`.

## Testing Strategy

- **The plan is the test.** The workflow files themselves are the artifact; the verification is "open a PR and watch CI pass."
- **Unit tests**: existing 2828+ tests (now exercised by CI, where previously they only ran locally).
- **Integration tests**: the projection perf-regression suite — now gated by the workflow.
- **Workflow-syntax check**: `act` (https://github.com/nektos/act) can dry-run the workflow locally before pushing; useful if iterating on the YAML.
- **Smoke**: a no-op PR triggers the full workflow; green-on-first-run is the success bar.
- **Negative test**: an intentional `// eslint-disable` in a fixture branch should make `guard:no-suppressions` fail; revert before merging.
- **Executable Gherkin**: existing scenarios under `tests/features/` continue to pass — they are now exercised by `pnpm test` under CI.

## Success Criteria

- All acceptance criteria in `020-ci-perf-gate/spec.md` reach `[x]`.
- `.github/workflows/` directory exists at repo root; `ci.yml` and `release.yml` are committed.
- A no-op PR triggers all six gate jobs and they pass green.
- The perf gate fires on every PR; baseline is updated only via deliberate PR diff.
- `AGENTS.md` links to the workflow surface; doctrine claims are verifiable.
- The "is CI external?" ambiguity in tech-debt #5 is resolved (either it is, and that's documented; or it isn't, and the new workflows are the answer).
- Constitution §III gates pass for the PR that introduces the workflow.
- `release.yml` is ready for plan 017 (`2.0.0-pre.1`) and plan 019 (`@libar-dev/architect-spec@1.0.0`).

## Dependencies / Coordination

- **Plan 017** (`017-coordinated-package-versioning`) — depends on this plan's `release.yml` for `2.0.0-pre.1`. Strong sequence: **plan 020 first**, then plan 017.
- **Plan 019** (`019-formal-spec-package`) — depends on this plan's `release.yml` for publishing `@libar-dev/architect-spec@1.0.0`. Sequence: plan 020 → plan 017 → plan 019.
- **Spec 014** (`014-no-suppression-enforcement`) — owns the guard script + ESLint rule the workflow invokes; no edits expected here.
- **Spec 004** (`004-fragment-projection-pipeline`) — owns the perf test target and the 36-pattern / 108-rule fixture; no edits expected.
- **External**: GitHub Actions, `pnpm/action-setup@v3`, `actions/setup-node@v4`, `actions/cache@v4`, `changesets/action`, npm registry, `NPM_TOKEN` secret (maintainer-provisioned).
- **Authority**: workflow YAML, baseline policy doc, and `AGENTS.md` patches all ship in one PR. Maintainer approval required per constitution §IX.
