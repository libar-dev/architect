# Remaining work — architect repo ejection campaign

Status snapshot: the **bootstrap and lift are complete** (phases 1–5 of the plan), committed as the initial commit. What follows is everything still owed before this repo can publish a `2.0.0-pre.1` release and replace `github.com/libar-dev/architect` history. Work in a feature branch (e.g. `wave-1/install-and-build`) and merge to `main` in stages.

## Operating model

- One focused session per wave below. Don't combine waves — each has its own scope and verification gate.
- Treat `pnpm install` → `pnpm build` → `pnpm test` as the unit of "this wave is green." If any of those fails partway, fix it before moving on.
- The architect-studio monorepo continues consuming these packages via `workspace:*` colocation throughout this campaign. The studio dependency cutover is the **last** wave (see W7).

---

## Wave 1 — Install and build (verification gate)

The lift is byte-faithful but unverified — TypeScript and the TS server have never seen this layout. Until `pnpm install` runs successfully, all later waves are blocked.

- [ ] `cd ~/dev-projects/architect && pnpm install` — expect workspace symlinks to materialize.
- [ ] `pnpm build` from root. Likely failures and where:
  - Package `tsconfig.json` files still extend `"../../tsconfig.architect-base.json"` — that path resolves correctly in the new layout, **so this should just work**, but verify.
  - `architect-projection` requires its `scripts/options-schema-barrel-audit.mjs` to run pre-test. Confirm the script is present and works standalone.
  - `architect-guard` has a post-build `copy-dangling-baseline.mjs` script — verify the baseline file it copies lives in `src/` (not `../../somewhere`).
  - `architect-cli` and `architect-mcp` ship `runtime-bridge.js` at the package root — verify it doesn't reference paths outside the package.
- [ ] `pnpm typecheck` across all 6 publishable packages.
- [ ] `pnpm -r lint` — expect this to need the eslint config that wasn't lifted (see W2).

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
