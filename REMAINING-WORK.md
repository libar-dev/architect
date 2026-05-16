# Remaining work — architect repo ejection campaign

Status snapshot: the **bootstrap, lift, and Wave 1 verification are complete**. As of the post-W1 commit, `pnpm install` → `build` → `typecheck` → `test` all pass green (2828 tests across 5 publishable packages). What follows is everything still owed before this repo can publish a `2.0.0-pre.1` release and replace `github.com/libar-dev/architect` history. Subsequent waves can be done on `main` directly (single maintainer, pre-public) or in feature branches.

## Operating model

- One focused session per wave below. Don't combine waves — each has its own scope and verification gate.
- Treat `pnpm install` → `pnpm build` → `pnpm test` as the unit of "this wave is green." If any of those fails partway, fix it before moving on.
- The architect-studio monorepo continues consuming these packages via `workspace:*` colocation throughout this campaign. The studio dependency cutover is the **last** wave (see W7).

---

## Wave 1 — Install and build (verification gate) — DONE

- [x] `pnpm install` — 377 packages resolved, no errors. (Only warning: `glob@10` deprecation, esbuild postinstall skipped — both harmless.)
- [x] `pnpm build` — green after dropping the meta-package's broken JS barrel (see note below).
- [x] `pnpm typecheck` — green across all 5 publishable packages with TS source.
- [x] `pnpm test` — **2828 tests passing** across 65 test files (`architect-core` 1070 / `-projection` 1534 / `-guard` 37 / `-cli` 17 / `-mcp` 170). One real bug fixed along the way (see CLI tests note).
- [ ] `pnpm -r lint` — still fails because no root eslint config and most packages don't depend on eslint. Deferred to W2.

### Structural changes landed during W1

1. **Meta-package (`@libar-dev/architect`) is now bin-only.** The original `src/index.ts` did `export * from {-core, -projection, -guard}` — but the splits genuinely collide on **8 names** (`BusinessRule`, `BusinessRuleSchema`, `Deliverable`, `DeliverableSchema`, `PhaseProgress`, `StatusDistribution`, `ProjectionError`, `ProjectionErrorCode`) where the **same name refers to different types**. Notably, `BusinessRule` in `-core` is the scan-extraction shape `{ name, description, scenarioCount, scenarioNames, tags }`, while in `-projection` it's the projection-fragment shape with 12 different fields. The monolith hid this latent collision; the split exposed it. Resolving via aliases or namespaces would paper over a real design issue; instead the meta is now bin-only (its `dist/`, `src/`, `tsconfig.json`, JS exports field, build/clean/prepack scripts are all gone). The 7 bins remain — that was always the meta's real value. Zero production code imported the barrel anyway. v1→v2 migration story for JS consumers becomes: "import from the split that owns the symbol; MIGRATION.md will list the moves."

2. **CLI tests' subprocess harness fixed.** `packages/architect-cli/tests/support/run-cli.ts` spawned bins with `cwd = monorepoRoot` so they'd find a live `architect.config.ts`. In the new layout the config moved to `examples/self-host/`, so the cwd was updated. **Plus** a real bug surfaced: `architect-cli/src/cli/runtime-helpers.ts:36 resolveInvocationDir()` prefers `process.env.PWD` over `process.cwd()`, and `execFile({ cwd })` doesn't update PWD in the child. The test harness now strips PWD/INIT_CWD when spawning so the CLI falls through to `process.cwd()`. The underlying `resolveInvocationDir` precedence (PWD before cwd) is questionable — likely intentional for symlinked-shell scenarios, but it makes embedding the CLI in other processes brittle. **Worth revisiting** — possibly W2 or as a separate hardening pass.

3. **`.sisyphus/` added to gitignore.** Created by `architect-projection`'s perf-fixture telemetry harness during test runs.

4. **`pnpm-lock.yaml` committed.** Standard for a publishing monorepo — CI uses `--frozen-lockfile`.

## Wave 2 — Root tooling (eslint, lint-staged, husky, turbo)

The lift skipped opinionated tooling files because they reach across the studio monorepo. Pick a minimal version for the new repo.

- [ ] Author a root `eslint.config.mjs` for the new repo. Studio's version (`architect-studio/eslint.config.mjs`, ~11 KB) bundles the custom `no-suppression-comments` rule plus TailwindCSS / React rules — strip everything React/Tailwind, keep the TypeScript + import + no-suppression bits.
- [ ] Decide on Turbo. Two options:
  - **Skip it.** Use `pnpm -r --filter` for orchestration. Simpler for a 6-package repo.
  - **Keep it.** Lift `turbo.json` (already in studio root) and add `turbo` as a dev dep. Useful if build times grow.
  - Recommendation: skip Turbo for now, add later if needed.
- [ ] Decide on Husky + lint-staged. For a publish-only repo, lint-staged is overkill; rely on CI for pre-merge gates. Skip both unless a maintainer wants local pre-commit.
- [ ] Wire `pnpm format` and `pnpm format:check` to verify they cover everything.

## Wave 3 — `examples/self-host` polish (path fixes)

The dogfooding lift was verbatim. Several path references are wrong for the new layout.

- [ ] `examples/self-host/architect.config.ts` — the `packages` array uses regexes like `/^\.\.\/architect-core\//` from when this lived at `packages/architect/`. From `examples/self-host/`, the path to a package is `../../packages/architect-core/`. Update the regexes accordingly, **or** switch the matching strategy to use workspace package names.
- [ ] `examples/self-host/tsconfig.json` — fix the `references` paths (currently `../architect-core` etc., should be `../../packages/architect-core` etc.).
- [ ] `examples/self-host/docs:all` and similar scripts in `examples/self-host/package.json` — verify glob inputs.
- [ ] `examples/self-host/scripts/verify-exports.mjs` — written for `@libar-dev/architect-dev`. Decide whether to keep it (it asserted on the old dev workspace's export map) or delete it.
- [ ] Make `pnpm --filter architect-self-host-example smoke` pass end-to-end.
- [ ] Decide what to do with `README.md.from-monolith` — the README from the original v1 monolith. Either delete or carve into a `MIGRATION.md`.

## Wave 4 — Public surface docs and README pass

- [ ] Polish the root `README.md` (placeholder is in place — add usage examples, migration-from-v1 note, philosophy summary lifted/rewritten from `architect-studio/AGENTS.md`).
- [ ] Author per-package READMEs for the 5 splits and the meta — `packages/architect/README.md` exists as a draft; the splits have none.
- [ ] Migrate `CONTRIBUTING.md`, `MAINTAINERS.md`, `SECURITY.md` (already lifted to repo root) — they reference studio-specific URLs; sweep for `delivery-process` and `architect-studio` mentions.
- [ ] Author a `MIGRATION.md` at repo root: what changed in v2, public-API moves between modules, import-path migrations.

## Wave 5 — CI (GitHub Actions)

- [ ] Workflow for PR validation: install, typecheck, lint, build, test, on Node 20 + 22.
- [ ] Workflow for release: triggered on `main` push, runs `pnpm changeset version` PR (changesets/action), then `pnpm changeset publish` on merge with `--provenance` flag set. Configure `NPM_TOKEN` and `id-token: write` permission.
- [ ] Optional: a "consume the published artifacts" job that installs `examples/self-host` from the `next` dist-tag rather than `workspace:*`, to catch packaging bugs that workspace consumption hides.

## Wave 6 — Spec polish + decision on co-location

The spec lifted unchanged. It still says `@architect-studio/spec` internally in some places.

- [ ] grep `spec/` for `@architect-studio` / `architect-studio` and update.
- [ ] Update spec README cross-links — currently they may point at studio paths.
- [ ] Decide on license for `@libar-dev/architect-spec`. It's `UNLICENSED` today (because `private: true`); when promoted to v1.0 it'll need CC-BY-4.0 / W3C / OWFa. Don't decide now; record the open question.
- [ ] Re-confirm: spec stays in this repo until v1.0 / second toolchain / governance ask. Don't split prematurely.

## Wave 7 — Publish + public repo cutover

Only after waves 1–5 are merged and verified.

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
- [ ] Decide what happens to the architect-claude-plugin (still in studio). Options: keep in studio, lift to a third repo, lift back into the new architect repo as a sibling package.

## Cross-cutting open questions (capture before publish)

- License audit: is `(MIT AND BUSL-1.1)` still the intended compound license, and is the BUSL-1.1 portion still scoped only to the MCP subset (per `LICENSE-MCP`)? Confirm before first publish — license metadata is hard to change retroactively.
- npm scope provenance: `@libar-dev` org on npm — confirm publishing rights and 2FA setup before W7.
- Changesets pre-mode: stay in `next` tag until 2.0.0 stable, then `pnpm changeset pre exit`. Decide when "stable" means.

---

## Snapshot of what's in the repo right now

```
architect/
├── .changeset/             # config.json (fixed group of 6), README
├── .gitignore              # node_modules, dist, .DS_Store, etc.
├── .node-version           # 22
├── .npmrc                  # auto-install-peers, no shameful hoist
├── .prettierrc, .prettierignore
├── CONTRIBUTING.md, LICENSE, LICENSE-MCP, MAINTAINERS.md, SECURITY.md
├── README.md               # placeholder; W4 will rewrite
├── REMAINING-WORK.md       # this file
├── package.json            # root workspace
├── pnpm-workspace.yaml
├── tsconfig.json, tsconfig.architect-base.json
├── packages/
│   ├── architect/                  # @libar-dev/architect (meta)
│   ├── architect-core/             # @libar-dev/architect-core
│   ├── architect-projection/       # @libar-dev/architect-projection
│   ├── architect-guard/            # @libar-dev/architect-guard
│   ├── architect-cli/              # @libar-dev/architect-cli
│   └── architect-mcp/              # @libar-dev/architect-mcp
├── examples/
│   └── self-host/                  # corpus + smoke (private, path fixes pending)
├── spec/                            # @libar-dev/architect-spec (private)
└── docs/                            # empty for now
```
