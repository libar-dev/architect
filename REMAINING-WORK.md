# Remaining work — architect repo ejection campaign

Status snapshot: **bootstrap, lift, Wave 1 verification, and Wave 1.5 structural cleanup are complete.** As of the post-W1.5 commit, `pnpm install` → `build` → `typecheck` → `test` all pass green (2828 tests across 5 publishable packages), the dogfood instance lives at the repo root, `spec/` is renamed to `formal-spec/`, `scripts/` is audited, all 7 bins smoke, and `AGENTS.md`/`CLAUDE.md` are in place. What follows is everything still owed before this repo can publish a `2.0.0-pre.1` release and replace `github.com/libar-dev/architect` history.

## Operating model

- One focused session per wave below. Don't combine waves — each has its own scope and verification gate.
- Treat `pnpm install` → `pnpm build` → `pnpm test` as the unit of "this wave is green." If any of those fails partway, fix it before moving on.
- The architect-studio monorepo continues consuming these packages via `workspace:*` colocation throughout this campaign. The studio dependency cutover is the **last** wave (see W8).

---

## Wave 1 — Install and build (verification gate) — DONE

- [x] `pnpm install` — 377 packages resolved, no errors. (Only warning: `glob@10` deprecation, esbuild postinstall skipped — both harmless.)
- [x] `pnpm build` — green after dropping the meta-package's broken JS barrel (see note below).
- [x] `pnpm typecheck` — green across all 5 publishable packages with TS source.
- [x] `pnpm test` — **2828 tests passing** across 65 test files (`architect-core` 1070 / `-projection` 1534 / `-guard` 37 / `-cli` 17 / `-mcp` 170). One real bug fixed along the way (see CLI tests note).
- [ ] `pnpm -r lint` — still fails because no root eslint config and most packages don't depend on eslint. Deferred to W2.

### Structural changes landed during W1

1. **Meta-package (`@libar-dev/architect`) is now bin-only.** The original `src/index.ts` did `export * from {-core, -projection, -guard}` — but the splits genuinely collide on **8 names** (`BusinessRule`, `BusinessRuleSchema`, `Deliverable`, `DeliverableSchema`, `PhaseProgress`, `StatusDistribution`, `ProjectionError`, `ProjectionErrorCode`) where the **same name refers to different types**. Notably, `BusinessRule` in `-core` is the scan-extraction shape `{ name, description, scenarioCount, scenarioNames, tags }`, while in `-projection` it's the projection-fragment shape with 12 different fields. The monolith hid this latent collision; the split exposed it. Resolving via aliases or namespaces would paper over a real design issue; instead the meta is now bin-only (its `dist/`, `src/`, `tsconfig.json`, JS exports field, build/clean/prepack scripts are all gone). The 7 bins remain — that was always the meta's real value. Zero production code imported the barrel anyway. v1→v2 migration story for JS consumers becomes: "import from the split that owns the symbol; MIGRATION.md will list the moves" (concrete map in the W1.5.7 appendix at the end of this file).

2. **CLI tests' subprocess harness fixed.** `packages/architect-cli/tests/support/run-cli.ts` spawned bins with `cwd = monorepoRoot` so they'd find a live `architect.config.ts`. In the old W1 layout the config was at `examples/self-host/`; in W1.5 it moved back to repo root. **Plus** a real bug surfaced: `architect-cli/src/cli/runtime-helpers.ts:36 resolveInvocationDir()` prefers `process.env.PWD` over `process.cwd()`, and `execFile({ cwd })` doesn't update PWD in the child. The test harness now strips PWD/INIT_CWD when spawning so the CLI falls through to `process.cwd()`. The underlying `resolveInvocationDir` precedence (PWD before cwd) is questionable — likely intentional for symlinked-shell scenarios, but it makes embedding the CLI in other processes brittle. **Worth revisiting** — captured in W1.5.x hardening backlog.

3. **`.sisyphus/` added to gitignore.** Created by `architect-projection`'s perf-fixture telemetry harness during test runs.

4. **`pnpm-lock.yaml` committed.** Standard for a publishing monorepo — CI uses `--frozen-lockfile`.

## Wave 1.5 — Structural cleanup — DONE

Goal: address naming + topology issues that the lift inherited from the monolith's nested layout. The byte-faithful lift kept the studio-era convention `packages/architect/examples/self-host/architect.config.ts` (where "architect" was a package inside studio that needed to dogfood itself **as if** it were a separate consumer). In this repo, the architect package family IS the project, so the "self-host example" wrapping was misleading and added an unneeded layer.

**Critical re-framing:** what previously lived under `examples/self-host/` was **NOT an example for users.** It was **the architect package family's own delivery-process instance** — its specs, decisions, releases, configs, and stubs that govern the architect packages themselves. This is the architect package using architect to manage its own development (dogfood). The directory was named `examples/self-host` as a stopgap during the bootstrap session.

### 1.5.1 Promote dogfood to repo root — DONE

- [x] Move `examples/self-host/architect.config.ts` → repo root `architect.config.ts`.
- [x] Move `examples/self-host/architect/` → repo root `architect/` (contains `specs/`, `decisions/`, `design-reviews/`, `ideations/`, `releases/`, `step-stubs/`, `stubs/`).
- [x] Move `examples/self-host/scripts/` → repo root `scripts/`.
- [x] Move `examples/self-host/tests/` → repo root `tests/`.
- [x] Move `examples/self-host/docs-sources/` → repo root `docs-sources/`.
- [x] Move `examples/self-host/docs/` → repo root `docs/` (these are **manual** docs — confusingly named, not the generated `docs-live/`).
- [x] Move `examples/self-host/{vitest.config.ts, eslint.config.mjs, lint-staged.config.mjs, tsconfig.eslint.json}` → root.
- [x] Reconcile tsconfigs. The dogfood `tsconfig.json` and the bare root `tsconfig.json` both wanted that name. Refactor: rename root bare base to `tsconfig.base.json`, update `tsconfig.architect-base.json` to extend it, then promote dogfood `tsconfig.json` to root (with extends path adjusted to `./tsconfig.architect-base.json` and references adjusted to `./packages/architect-*`).
- [x] Absorb `examples/self-host/package.json` scripts into root `package.json`. The "self-host-example" workspace member is no longer needed; root absorbs the test/lint/CLI-wrapper deps and exposes the `architect:*`, `docs:*`, `validate:*` scripts directly.
- [x] Drop `examples/*` from `pnpm-workspace.yaml`.
- [x] Delete the empty `examples/` directory.
- [x] Delete `README.md.from-monolith` (no salvage value — content was studio-era dev:web/dev:pkg references).
- [x] Delete dogfood `CHANGELOG.md` and `.gitignore` (merged relevant entries to root `.gitignore`).
- [x] Update `packages/architect-cli/tests/support/run-cli.ts`: cwd target moves from `examples/self-host` back to repo root. PWD-stripping logic from W1 stays in place. **Plus** `delete childEnv.PWD` → `delete childEnv['PWD']` to satisfy `noPropertyAccessFromIndexSignature` (latent typecheck failure surfaced when the tsconfig consolidation cleared a previous masking).
- [x] Sweep `examples/self-host/` references in `README.md` (minimal sweep — full rewrite is W4).
- [x] Sweep `packages/architect/` references across the codebase. **The original REMAINING-WORK.md scoped this to a single file (`fragments.ts`); reality was ~100 references across 5 large step-definition files in `packages/architect-projection/tests/features/projections/` (pattern-detail, context-session, reporting, decision-records, config-documentation), plus `fragments.ts`, 1 source ref in `business-rules.internal.ts`, and JSDoc comments in `architect-core/src/{config/self-hosting.ts, taxonomy/{source-ownership.ts, adr-category-values.ts, product-area-values.ts}}`. Bulk-fixed via `sed` on `packages/architect/architect/` → `architect/` + `packages/architect/tests/` → `tests/` + `packages/architect/docs-live/` → `docs-live/`. Individual edits for the residual cases.
- [x] **Fix the 2 hardcoded `/Users/darkomijic/dev-projects/architect-studio` paths** in `packages/architect-projection/tests/{fixtures/fragments.ts, features/projections/documentation-composition/config-documentation.steps.ts}`. Replaced with `/fixtures/architect-studio` (clearly fictional, machine-independent). Tests pass.
- [x] **Drop the `packages/architect/` candidate-path branch** in `business-rules.internal.ts:472`. That branch existed for the studio-era nested layout (`packages/architect/architect/...`). Post-eject the dogfood IS at root, so the prefix is dead code.
- [x] **Rewrite `architect.config.ts` package match regexes:** from `/^\.\.\/architect-core\//` (relative-to-old-dogfood-location) to `/^packages\/architect-core\//` (relative-to-repo-root).

### 1.5.2 Audit and prune `scripts/` — DONE

Original REMAINING-WORK.md described 7 scripts to audit; inventory found 12. Final decisions:

| File | Size | Decision |
|---|---|---|
| `query.ts` | 4.2 KB | **DELETED** — re-implements canonical CLI commands |
| `query.mjs` | 546 B | **DELETED** — MJS variant of above |
| `codemod-wave2.mjs` | 6.7 KB | **DELETED** — one-off codemod, hardcoded studio nested paths |
| `verify-exports.mjs` | 3.3 KB | **DELETED** — asserted v1 `@libar-dev/architect-dev` export map (no longer exists) |
| `lint-patterns.ts` | 481 B | **FIXED** — repointed import from `../../architect-core/src/config/self-hosting.js` to `@libar-dev/architect-core/config` (published surface) |
| `validate-workspace.ts` | 1.4 KB | **KEPT + documented** — added header comment explaining dogfood-only gap-filler vs `architect-validate` bin; revisit folding into bin in a later wave |
| `workspace-smoke.ts` | 1.2 KB | **KEPT** — smoke test |
| `assert-deprecated-query-surfaces.ts` | 1.6 KB | **KEPT** — regression test |
| `generate-docs.mjs` | 573 B | **KEPT** — fixed path from `../../../node_modules/.bin/architect-generate` to `../node_modules/.bin/architect-generate` post-promotion |
| `session-stats.sh` | 5.4 KB | **KEPT** — dev tooling |
| `fetch-pr-comments.mjs` | 22.8 KB | **KEPT** — PR comment fetching |
| `lint-steps.ts` | 1.5 KB | **KEPT** — simple wrapper around `architect-lint-steps` |

### 1.5.3 End-to-end doc generation smoke — DONE

- [x] Ran `pnpm exec node scripts/generate-docs.mjs -g patterns -g architecture -g roadmap -g changelog -g requirements-executable -g requirements-specs -g decisions -g taxonomy -f` from repo root. Output: "Generated 16 files from 268 patterns" into `docs-live/`. 1953 total lines across 8 topics + `decisions/` subdir.
- [x] Added `docs-live/` to `.gitignore`.

### 1.5.4 Author `AGENTS.md` (+ `CLAUDE.md` symlink) — DONE

- [x] Authored fresh `AGENTS.md` at repo root (~150 lines). Selective lift from `architect-studio/AGENTS.md`:
  - **Lifted verbatim (CI-enforced doctrine):** No-BC, Zod-first sections.
  - **Lifted selectively:** Architect State is Code, Architect State Folders, Two Gherkin Parsers, Pattern Graph, Package Family Table, Dependency Acyclic Invariant, Architecture Pipeline, ADR Guardrails, Architect Spec section (path updated to `formal-spec/`).
  - **Dropped:** all desktop app / libar-ui / OmO / two-instance topology / plugin operational content. Single-instance simplification collapsed ~200 lines.
  - **No cross-links to studio plugin paths.** Doctrine kernel (the 9 `_shared/` files in studio plugin) relocates in W9; AGENTS.md inlines the essentials instead.
- [x] Created `CLAUDE.md` as a symlink to `AGENTS.md`.

### 1.5.5 Rename `spec/` → `formal-spec/` — DONE

- [x] `git mv spec formal-spec`.
- [x] Updated `pnpm-workspace.yaml`.
- [x] Updated `formal-spec/package.json` (`repository.directory`, `homepage`).
- [x] Updated `formal-spec/README.md` (status line, publication trajectory table).
- [x] Updated root `README.md` workspace layout block.
- [x] npm package name `@libar-dev/architect-spec` unchanged.

### 1.5.6 Smoke all 7 bins — DONE

All 7 bins respond to `--help` and one real invocation:

- [x] `architect overview` — produces progress + blockers + DATA API hint output.
- [x] `architect-generate --help` (full doc-gen smoke covered by 1.5.3).
- [x] `architect-guard --help`.
- [x] `architect-validate --dod --anti-patterns` — DoD validation + anti-pattern detection produce expected report.
- [x] `architect-lint-steps --help`.
- [x] `architect-lint-patterns --help`.
- [x] `architect-mcp --help` — advertises 18 tools without crashing.

### 1.5.7 MIGRATION.md content prep — DONE

Drafted bin + JS API mapping tables. **See appendix at the end of this file** for the concrete tables W4 will lift into `MIGRATION.md`.

### 1.5.8 `.changeset/` — no action

Captured here to close the loop: the changesets config (`.changeset/config.json`) is correct as-is. Fixed group of 6 publishable packages (they version in lockstep), spec + dogfood ignored, public access, `main` base branch. Nothing to do until W7 produces the first changeset for the initial publish.

### 1.5.x — Hardening backlog (deferred)

- [ ] **Revisit `architect-cli/src/cli/runtime-helpers.ts:36 resolveInvocationDir()`.** Prefers `process.env.PWD` over `process.cwd()`. Likely intentional for symlinked-shell scenarios, but it makes embedding the CLI in other processes brittle (subprocess inherits parent PWD, `execFile({ cwd })` doesn't update it). The test harness already strips PWD/INIT_CWD as a workaround. Considering: invert the precedence, or add a CLI flag to force `cwd`-only, or document explicitly that consumers must pass `--base-dir` rather than relying on cwd. Not part of any planned wave yet; revisit when CLI gets exercised more outside test contexts.

## Wave 2 — Root tooling (eslint, lint-staged, husky, turbo)

The lift skipped opinionated tooling files because they reach across the studio monorepo. Pick a minimal version for the new repo. W1.5 lifted the dogfood `eslint.config.mjs` and `lint-staged.config.mjs` to root, but they're not wired into the workspace yet (and `eslint-plugin-import` isn't installed — would crash if you ran `pnpm lint`).

- [ ] Author a root `eslint.config.mjs` that works across the whole workspace. Studio's version (`architect-studio/eslint.config.mjs`, ~11 KB) bundles the custom `no-suppression-comments` rule plus TailwindCSS / React rules — strip everything React/Tailwind, keep the TypeScript + import + no-suppression bits. Add `eslint-plugin-import` to root devDependencies.
- [ ] Decide on Turbo. Two options:
  - **Skip it.** Use `pnpm -r --filter` for orchestration. Simpler for a 6-package repo.
  - **Keep it.** Lift `turbo.json` (already in studio root) and add `turbo` as a dev dep. Useful if build times grow.
  - Recommendation: skip Turbo for now, add later if needed.
- [ ] Decide on Husky + lint-staged. For a publish-only repo, lint-staged is overkill; rely on CI for pre-merge gates. Skip both unless a maintainer wants local pre-commit.
- [ ] Wire `pnpm format` and `pnpm format:check` to verify they cover everything.

## Wave 3 — folded into Wave 1.5 (DONE)

All sub-items in the original W3 were covered by 1.5.1 (path-reference sweep, regex rewrite, README.md.from-monolith deletion).

## Wave 4 — Public surface docs and README pass

- [ ] Polish the root `README.md` (W1.5 did a minimal sweep to fix broken `examples/self-host/` link and update workspace layout — full rewrite still pending). Add usage examples, migration-from-v1 note, philosophy summary lifted/rewritten from `AGENTS.md`.
- [ ] Author per-package READMEs for the 5 splits and the meta — `packages/architect/README.md` was rewritten during W1 for the bin-only meta; the splits still have none.
- [ ] Migrate `CONTRIBUTING.md`, `MAINTAINERS.md`, `SECURITY.md` (already lifted to repo root) — they reference studio-specific URLs; sweep for `delivery-process` and `architect-studio` mentions.
- [ ] Author `MIGRATION.md` at repo root using the bin + JS-API map drafted in W1.5.7 (see appendix below). Include the v1→v2 import path table for the 8 collision symbols.

## Wave 5 — CI (GitHub Actions)

- [ ] Workflow for PR validation: install, typecheck, lint, build, test, on Node 20 + 22.
- [ ] Workflow for release: triggered on `main` push, runs `pnpm changeset version` PR (changesets/action), then `pnpm changeset publish` on merge with `--provenance` flag set. Configure `NPM_TOKEN` and `id-token: write` permission.
- [ ] Optional: a "consume the published artifacts" job that installs a snapshot from the `next` dist-tag rather than `workspace:*`, to catch packaging bugs that workspace consumption hides.

## Wave 6 — Formal-spec polish

The directory was renamed to `formal-spec/` in W1.5.5 to disambiguate from delivery `architect/specs/`. Content polish is still pending.

- [ ] grep `formal-spec/` for `@architect-studio` / `architect-studio` references and update to `@libar-dev/architect` / the new repo. (W1.5.5 fixed the obvious README references — `status` line + publication trajectory — but content sweep is still needed.)
- [ ] One reference flagged in `formal-spec/README.md:114` changelog: `packages/architect-claude-plugin/MIGRATION.md` (studio plugin path; dead link in this repo). Decide: leave as historical record or rewrite.
- [ ] Decide on license for `@libar-dev/architect-spec`. It's `UNLICENSED` today (because `private: true`); when promoted to v1.0 it'll need CC-BY-4.0 / W3C / OWFa. Don't decide now; record the open question.
- [ ] Re-confirm: the formal spec stays in this repo until v1.0 / second toolchain / governance ask. Don't split prematurely.

## Wave 7 — Publish + public repo cutover

Only after waves 2, 4, 5 are merged and verified.

- [ ] `pnpm changeset` to write the first changeset (`major: "Initial multi-package layout (split from v1.0.0-pre.3 monolith)"`).
- [ ] `pnpm changeset pre enter next` to enter pre-release mode.
- [ ] `pnpm changeset version` and inspect the diff carefully — `2.0.0-pre.1` should land on all 6 publishable packages.
- [ ] Dry-run pack: `pnpm -r --filter './packages/**' pack`, inspect each tarball, verify `files` field is correct and tarballs are reasonable size.
- [ ] `pnpm changeset publish --tag next` — observe each `npm publish` succeed with provenance.
- [ ] Verify on npm: `npm view @libar-dev/architect@next` and the five splits.
- [ ] In a clone of the **public** repo (`gh repo clone libar-dev/architect`):
  - `git tag legacy/v1.0.0-pre.3-monolith`
  - `git checkout -b archive/monolith`
  - `git push origin archive/monolith --tags`
  - Force-push new `main` from this repo: `git push --force-with-lease origin main`
- [ ] Close stale PRs (#12, #13, #14, #17) with a comment pointing to the new layout.
- [ ] Delete obsolete branches (`chore/refactor-before-rebranding`, `feature/rebranding`).
- [ ] Update GitHub repo description, topics, and pinned branches.

## Wave 8 — Studio coordination (last)

Once the published artifacts are stable, decide on studio's dependency.

- [ ] In `architect-studio`, switch `apps/desktop/package.json`, `packages/shared/package.json`, etc. from `workspace:*` to `^2.0.0-pre.1` for the architect packages.
- [ ] Delete `architect-studio/packages/architect{,-core,-projection,-guard,-cli,-mcp}/` after confirming no consumer reads them directly.
- [ ] Update `architect-studio/CLAUDE.md` (which is a symlink to `AGENTS.md`) — drop the "temporarily colocated" language and replace with "consumes published `@libar-dev/architect-*` packages."
- [ ] Update root scripts in `architect-studio/package.json` — `pnpm pkg:*` shortcuts can either be removed or reworked to operate on the studio repo only (since the architect package's specs no longer live in studio).
- [ ] Coordinate the architect-claude-plugin migration timing with Wave 9 (consolidated agent skills move into this repo). Studio's plugin invocations and `pkg:*` shortcuts depend on plugin location — sequence so studio is never left calling a dead path.

## Wave 9 — Consolidate agent skills into the architect package

> **Status:** placeholder for a focused future session. Plugin/skill consolidation is **out of scope for the W1.5 session** that landed this revision. Below: findings from exploration (so the next session doesn't re-derive them) + the user's strategic shape for the consolidation.

### Source inventory (from exploration)

- **`/Users/darkomijic/dev-projects/architect-studio/.opencode/`** is a near-empty harness stub. Only `opencode.jsonc` (disabled plugin reference), `package.json` (one dep on `@opencode-ai/plugin`), and `commands/`+`skills/` directories filled with **symlinks** back to `architect-claude-plugin/`. **Not a parallel codebase** — it's a thin harness shell that mirrors the Claude plugin content.
- **`/Users/darkomijic/dev-projects/architect-studio/packages/architect-claude-plugin/`** has the real content: plugin manifest (`@libar-dev/architect-claude-plugin@0.1.0`), `src/hooks/`, 8 session-typed skills + 1 router, `_shared/` doctrine kernel (9 files), 7 slash commands, dogfooding feedback capture, `MIGRATION.md`.
- **`/Users/darkomijic/dev-projects/architect-studio/.omo-architect-stash`** — outdated Oh My OpenCode (OmO) skills prototype. Reference for the OmO embedded-MCP-in-skills pattern.

### 8 session skills + 1 router (REMAINING-WORK.md's earlier list was missing `architect-refactor-session`)

| Skill | Intent | Purpose |
|---|---|---|
| `architect-session-router` | (router) | Detects intent, runs CLI bootstrap, routes to downstream skill |
| `architect-plan-session` | `planning` | Capture/refine idea or candidate spec (minimum-Gherkin enforcement: ideas ≤30 lines, 5 mandatory tags) |
| `architect-design-session` | `design` | Design-tier spec authoring; runs `scope-validate <pattern> design` gate |
| `architect-implement-spec` | `implement` | Build spec end-to-end; transition FSM states; value transfer (deletion of design spec is explicit) |
| `architect-review-spec` | `review` | Read design-level spec for implementation readiness; find pre-implementation gaps |
| `architect-review-implementation` | `review-implement` | Review **completed** implementations post-merge; batch-delete safe-to-remove specs |
| `architect-refactor-session` | `refactor` | Modify shipped code with **no design spec** (spec was deleted at implement-time) |
| `architect-verify-handoff` | `handoff` | Wrap session, capture state, list blockers, prepare continuation |

### 9 doctrine kernel files in `_shared/`

`four-tier-ladder.md`, `rule-block-template.md`, `spec-pattern-relationships.md`, `annotation-ownership.md`, `fsm-transitions.md`, `session-preamble.md`, `canonical-references.md`, `value-transfer.md`, `multi-session-coordination.md`. This is the **canonical universal doctrine** — harness-agnostic.

### 5 hooks with documented removal mapping

| Hook | What it does today | W9 replacement |
|---|---|---|
| `UserPromptSubmit` | Detects Architect intent in prompt, injects CLI bootstrap as `additionalContext`, sets `sessionTitle` | Router skill becomes entry point; runs bootstrap as skill step |
| `PreToolUse` (Read\|Glob\|Grep on architect paths) | Denies file access until CLI bootstrap has run | Skill-level routing enforcement (skills cannot proceed until router has run bootstrap). Optional per-harness safety-net hook. |
| `CwdChanged` | Re-injects bootstrap when cwd enters architect-scoped dir | Per-harness observability hook (optional) |
| `PostToolUseFailure` | Captures `architect:*` CLI / `mcp__architect__*` failures to `.architect-cli-feedback.md` | Per-harness observability hook OR skill utility |
| `PostCompact` | Re-detects intent from compact summary, re-injects bootstrap if Architect patterns mentioned | Per-harness or router skill extension |

### Two-instance topology collapses to one

The plugin currently routes between two instances (`architect` and `architect-pkg`) via `src/routing/instances.ts`. In this repo there's exactly ONE instance, so the routing logic simplifies considerably. CLI prefixes (`pnpm architect:query`) and MCP namespaces (`mcp__architect__*`) drop the dual-instance disambiguation.

### User's strategic shape for W9 (recorded for the focused session)

- **Core generic setup with skills exposed at `.agents/`** — universal, harness-agnostic skill bodies.
- **Claude Code specifics:** slash commands without the aggressive hooks we have today. Hooks-based bootstrap goes away; skill-level routing handles it.
- **OpenCode specifics:** slash commands (existing prototype in `.opencode/`).
- **Oh My OpenCode specifics:** embedded-MCPs-in-skills (prototype in `.omo-architect-stash`).
- **All textual content symlinked, not duplicated.** Single source of truth per skill body; each harness gets symlinked copies into `.agents/`, `.claude/`, `.opencode/`, etc.
- **Critical:** expose a default set of skills to consumers of the package from `.agents/` AND `.claude/`. Consumers of the architect package family get working skills out of the box.

### Coordination

- W8 (studio cutover) depends on W9 — studio's `pkg:*` shortcuts and plugin invocations need a destination.
- The dogfood instance at repo root will be the first consumer of the relocated skills.

### Out of scope until details land

- Exact package name(s) and npm publication strategy.
- How universal skills get parameterised per harness.
- Whether the OmO `.opencode/` adapter ships in the same package or a sibling.
- Migration sequencing for `.architect-cli-feedback.md` and the dogfooding feedback CLI.
- The user has the implementation plan; treat this section as findings + shape, not a recipe.

## Cross-cutting open questions (capture before publish)

- License audit: is `(MIT AND BUSL-1.1)` still the intended compound license, and is the BUSL-1.1 portion still scoped only to the MCP subset (per `LICENSE-MCP`)? Confirm before first publish — license metadata is hard to change retroactively.
- npm scope provenance: `@libar-dev` org on npm — confirm publishing rights and 2FA setup before W7.
- Changesets pre-mode: stay in `next` tag until 2.0.0 stable, then `pnpm changeset pre exit`. Decide when "stable" means.

---

## Snapshot — current state (post-W1.5)

```
architect/
├── .changeset/                     # config.json (fixed group of 6), README — W7
├── .gitignore                      # node_modules, dist, docs-live/, .DS_Store, .sisyphus/, .architect-cli-feedback.md, .claude-layers/, .plans/, etc.
├── .node-version                   # 22
├── .npmrc                          # auto-install-peers, no shameful hoist
├── .prettierrc, .prettierignore
├── AGENTS.md                       # authored in W1.5.4
├── CLAUDE.md                       # symlink → AGENTS.md
├── CONTRIBUTING.md, LICENSE, LICENSE-MCP, MAINTAINERS.md, SECURITY.md
├── README.md                       # minimal sweep done in W1.5; full polish pending in W4
├── REMAINING-WORK.md               # this file
├── architect.config.ts             # dogfood config (promoted to root in W1.5.1)
├── architect/                      # dogfood specs/decisions/releases/stubs/...
├── docs/                           # manual docs
├── docs-sources/                   # doc-gen inputs
├── docs-live/                      # GITIGNORED — generated docs output
├── scripts/                        # dogfood scripts (post-audit: 8 retained, 4 deleted)
├── tests/                          # dogfood smoke + regression
├── package.json                    # absorbs dogfood scripts + deps
├── pnpm-workspace.yaml             # packages/* + formal-spec
├── pnpm-lock.yaml                  # committed for CI reproducibility
├── tsconfig.base.json              # renamed from tsconfig.json — bare base
├── tsconfig.architect-base.json    # extends tsconfig.base.json; adds noPropertyAccessFromIndexSignature
├── tsconfig.json                   # dogfood project config — references packages, includes architect.config.ts + tests/
├── tsconfig.eslint.json            # eslint TS context
├── vitest.config.ts, eslint.config.mjs, lint-staged.config.mjs
├── packages/
│   ├── architect/                  # @libar-dev/architect (meta — bin-only)
│   ├── architect-core/             # @libar-dev/architect-core
│   ├── architect-projection/       # @libar-dev/architect-projection
│   ├── architect-guard/            # @libar-dev/architect-guard
│   ├── architect-cli/              # @libar-dev/architect-cli
│   └── architect-mcp/              # @libar-dev/architect-mcp
└── formal-spec/                    # @libar-dev/architect-spec (renamed from spec/ in W1.5.5)
```

---

## Appendix — W1.5.7 MIGRATION.md content draft (for W4)

### Bin → package map (all 7 bins)

All 7 bins remain reachable via the meta package `@libar-dev/architect` (which is now bin-only — no JS exports). They are also directly reachable from the split that publishes each.

| Bin | Published by | Purpose |
|---|---|---|
| `architect` | `@libar-dev/architect-cli` | Pattern-graph query CLI: `overview`, `status`, `context`, `dep-tree`, `scope-validate`, `list`, etc. |
| `architect-generate` | `@libar-dev/architect-cli` | Doc generation; ~13 topics via `-g` flag (architecture, roadmap, requirements-executable, decisions, taxonomy, patterns, etc.) |
| `architect-guard` | `@libar-dev/architect-cli` | Process / FSM guard for pre-commit / pre-merge gates (`--staged`, `--all`, `--files`) |
| `architect-validate` | `@libar-dev/architect-cli` | Pattern annotation vs Gherkin feature cross-validation (`--dod`, `--anti-patterns`) |
| `architect-lint-steps` | `@libar-dev/architect-cli` | vitest-cucumber feature/step compatibility checks |
| `architect-lint-patterns` | `@libar-dev/architect-cli` | Pattern annotation quality lint |
| `architect-mcp` | `@libar-dev/architect-mcp` | MCP server (18 tools) — file watcher, pipeline session |

**Meta package:** `@libar-dev/architect` continues to expose all 7 bins via re-export. Consumers can install just the meta and get the full CLI surface.

### JS API → package map (8 collision symbols)

In v1, these symbols were re-exported by the monolith `@libar-dev/architect`. In v2, the meta is bin-only, and **same-name symbols live in different splits with different shapes**. Consumers who imported these from `@libar-dev/architect` must repoint imports to the owning split.

| v1 import from `@libar-dev/architect` | v2 import path | Notes |
|---|---|---|
| `BusinessRule`, `BusinessRuleSchema` (extraction shape) | `@libar-dev/architect-core` | The Gherkin scanner / extraction shape: `{ name, description, scenarioCount, scenarioNames, tags }`. |
| `BusinessRule`, `BusinessRuleSchema` (projection-fragment shape) | `@libar-dev/architect-projection` | The projection fragment shape — 12 fields including `id`, `feature`, `ruleName`, `package`, `invariant`, `rationale`, `verifiedBy`, `pattern`, `phase`, `productArea`. **Different type with the same name** — v1 hid this collision because the monolith chose one. v2 forces an explicit choice. |
| `Deliverable`, `DeliverableSchema` | `@libar-dev/architect-projection` | Two definitions exist within `-projection`: `fragments/pattern-relations/supporting.ts` and `fragments/execution-context/deliverable.ts`. Use whichever matches the projection context. |
| `DeliverableManifest`, `DeliverableManifestSchema` | `@libar-dev/architect-projection` | Same dual-definition note as above. |
| `PhaseProgress`, `PhaseProgressSchema` | `@libar-dev/architect-projection` | From `fragments/delivery-reporting/phase-progress.ts`. |
| `StatusDistribution`, `StatusDistributionSchema` | `@libar-dev/architect-projection` | From `fragments/delivery-reporting/status-distribution.ts`. |
| `ProjectionError`, `ProjectionErrorCode` | `@libar-dev/architect-core` | From `core/src/package/`. Confusingly named — it's the package-resolver error type, not a projection-pipeline error. |

### Migration cheatsheet for common v1 consumers

```ts
// v1
import { buildPatternGraph, BusinessRule, BusinessRuleSchema } from '@libar-dev/architect';

// v2 — extraction context (the most common use)
import { buildPatternGraph } from '@libar-dev/architect-core';
import type { BusinessRule } from '@libar-dev/architect-core';
import { BusinessRuleSchema } from '@libar-dev/architect-core';

// v2 — projection-fragment context
import type { BusinessRule } from '@libar-dev/architect-projection';
import { BusinessRuleSchema } from '@libar-dev/architect-projection';
```

The meta package `@libar-dev/architect` is **no longer importable as JS** — it's bin-only. Any v1 code that did `import ... from '@libar-dev/architect'` will fail to resolve. The migration is mechanical (repoint to the owning split), but unavoidable.

## TODO - Required work that needs additional detailing and specification

### TODO #1 - Doc consolidation
- `formal-spec/` need to be updated to match recent code changes/refactoring
  - this will be published as separate repo later on
  - we should reference content from formal specs in generated docs, skills, etc.
  - generated docs (`docs-live/`) should also not duplicate content from formal specs
  - AGENTS.md/CLAUDE.md also need to be included in information organization strategy and deduplication - this doc is not complete yet.
  - there is probably a decent opportunity to make formal specs less verbose once we decide on appropriate "layering" and organization of docs
- manual docs (`docs/`) and unused docs-sources (`docs-sources/`) neet to be made obsolete once work with generated docs and polishing of skills is coplete - we have ability to generate all required docs
- we should assess what to do wiht `docs-live/TAXONOMY.md` which is generated doc with some content duplicated in the formal specs and taxonomy is also available throuhg PatternGraph API

#### `doc-sources` additional context: 

```markdown
  Quick verdict: **no, the `docs-sources/` files are not currently consumed by doc generation.** Here's the trace:

**The plumbing exists but is unwired:**
- `parseMarkdownToBlocks()` in `packages/architect-core/src/utils/markdown-parser.ts:84` converts markdown → `SectionBlock[]` (exported from core)
- `ReferenceDocConfig.preamble?: readonly SectionBlock[]` in `packages/architect-core/src/config/presentation-contracts.ts:43` — codecs accept preamble content via config
- The intent (per `docs/DOCS-GAP-ANALYSIS.md:722-723`) was: author preamble markdown in `docs-sources/` → load via a `loadPreambleFromMarkdown()` utility → inject into codec config

**What's actually missing:**
- Zero references to `docs-sources` in any package source code, scripts, configs, or tests (only mentions are in README/AGENTS layout diagrams and the gap-analysis doc itself).
- The dogfood `architect.config.ts` has no `preamble:` configuration — no codec is fed any markdown from `docs-sources/`.
- No `loadPreambleFromMarkdown()` utility exists yet; only the low-level `parseMarkdownToBlocks` (tested in isolation against hardcoded strings in `tests/steps/generation/load-preamble.steps.ts`).

**The content state:**
- The 8 files in `docs-sources/` are hardcoded markdown that was meant to feed the codec pipeline.
- They overlap significantly with the manual `docs/` files (e.g., `docs/ANNOTATION-GUIDE.md` vs `docs-sources/annotation-guide.md` — forked siblings, drifting separately).
- `DOCS-GAP-ANALYSIS.md` confirms this is unfinished work: "WP-7 ProceduralGuideCodec design complete (8 findings), DD-7/DD-8 done" but "Phase 5 (guide trimming) … remain pending until generated docs reach quality parity for manual doc archival."

**So today `docs-sources/` is dead-weight content with two outstanding decisions** for a future session: either (a) finish wiring it into the codec pipeline (the design exists), or (b) delete the directory and consolidate with manual `docs/`. Right now it's neither.

`★ Insight ─────────────────────────────────────`
The drift between `docs/ANNOTATION-GUIDE.md` and `docs-sources/annotation-guide.md` is exactly the failure mode the codec pipeline was designed to prevent — one canonical source feeds the generator, no dual maintenance. The fact that both exist and have diverged is itself the evidence that the wiring isn't done. Worth flagging in REMAINING-WORK.md as a small follow-up under W4 (docs polish) since it crosses the docs-cleanup boundary.
`─────────────────────────────────────────────────`
```

### TODO #2 - License consolidation
- `LICENSE` and `LICENSE-MCP` should be consolidated into just one MIT license

