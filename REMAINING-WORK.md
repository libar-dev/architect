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

## Wave 1.5 — Structural cleanup (next)

This wave addresses naming + topology issues that the lift inherited from the monolith's nested layout. The byte-faithful lift kept the studio-era convention `packages/architect/examples/self-host/architect.config.ts` (where "architect" was a package inside studio that needed to dogfood itself **as if** it were a separate consumer). In this repo, the architect package family IS the project, so the "self-host example" wrapping is misleading and adds an unneeded layer.

**Critical re-framing:** what currently lives under `examples/self-host/` is **NOT an example for users.** It is **the architect package family's own delivery-process instance** — its specs, decisions, releases, configs, and stubs that govern the architect packages themselves. This is the architect package using architect to manage its own development (dogfood). The directory was named `examples/self-host` as a stopgap during the bootstrap session. Studio's `CLAUDE.md` documents this clearly: studio ran TWO delivery-process instances (studio root + `packages/architect/architect/`); the latter is what came across to this repo on eject.

### 1.5.1 Promote dogfood to repo root

The architect package family has a single delivery-process instance here; nest it at root rather than under `examples/`.

- [ ] Move `examples/self-host/architect.config.ts` → repo root `architect.config.ts`.
- [ ] Move `examples/self-host/architect/` → repo root `architect/` (contains `specs/`, `decisions/`, `design-reviews/`, `ideations/`, `releases/`, `step-stubs/`, `stubs/`).
- [ ] Move `examples/self-host/scripts/` → repo root `scripts/` (after the audit in 1.5.2).
- [ ] Move `examples/self-host/tests/` → repo root `tests/` (or fold into the per-package test suites if the contents are package-specific).
- [ ] Move `examples/self-host/docs-sources/` → repo root `docs-sources/`.
- [ ] Move `examples/self-host/{tsconfig.json, tsconfig.eslint.json, vitest.config.ts, eslint.config.mjs, lint-staged.config.mjs}` → root, reconciling with the existing root configs (the root currently has `tsconfig.json` + `tsconfig.architect-base.json` only).
- [ ] Update `examples/self-host/package.json`: the dogfood doesn't need to be a separate workspace member if its scripts move to root; either delete the package entirely or keep a thin one if there's a reason. Update `pnpm-workspace.yaml` accordingly.
- [ ] Delete the empty `examples/` directory. (Add it back later only if there's a real user-facing contrived example to put in it.)
- [ ] Update `packages/architect-cli/tests/support/run-cli.ts`: the cwd target moves from `examples/self-host` back to repo root (which is where the live config now lives). The PWD-stripping logic from W1 stays in place.
- [ ] Sweep references to `examples/self-host/` across `README.md`, package READMEs, `spec/appendix-a-examples.md`, and any test fixtures.
- [ ] If any in-repo content (test fixtures, scripts) hard-coded paths like `packages/architect/...` (the studio-era nested-monolith location), update them. A few fixture files in `packages/architect-projection/tests/fixtures/fragments.ts` are known examples — sweep for `packages/architect/` patterns.

### 1.5.2 Audit and prune `scripts/`

The scripts directory accumulated alternative implementations of features the published bins also provide. The principle going forward: a script either glues bins together or runs a smoke / regression / one-off — it never re-implements a feature the canonical CLI already covers.

- [ ] **Delete `query.ts` and `query.mjs`.** They re-implement the architect CLI's pattern-graph query commands (overview, status, dangling) using `buildPatternGraph` + custom dispatch. The canonical `architect <subcommand>` CLI is the right path.
- [ ] **Delete `codemod-wave2.mjs`.** One-off codemod from a past refactor. No future value.
- [ ] **Delete or rewrite `verify-exports.mjs`.** Written to assert the v1 `@libar-dev/architect-dev` export map, which no longer exists. Either drop it or rewrite it to verify the v2 published surface (per-package `exports` field consistency, no leaked internal paths).
- [ ] **Fix or remove `lint-patterns.ts`.** It's a thin wrapper around `pnpm exec architect-lint-patterns`, but its relative import path `../../architect-core/src/config/self-hosting.js` is broken in the new layout (and pulls from `src/`, which only works in TS-built contexts). Either repoint at `@libar-dev/architect-core` (published surface) or delete the wrapper and call the bin directly from package.json scripts.
- [ ] **Decide on `validate-workspace.ts`.** Implements its own validation using `buildPatternGraph` + `WORKSPACE_TAG_REGISTRY`. Either (a) fold its logic into the canonical `architect-validate` bin (most likely the right answer — if dogfood needs it, real consumers will too), (b) document explicitly as a "dogfood-only" gap-filler with a comment explaining what it covers that the bin doesn't, or (c) delete it.
- [ ] **Keep `workspace-smoke.ts`, `assert-deprecated-query-surfaces.ts`, `generate-docs.mjs`, `session-stats.sh`, `fetch-pr-comments.mjs`.** These are smoke / regression / glue / dev tooling — legitimate dogfood scripts.

### 1.5.3 End-to-end doc generation smoke

The `architect-generate -g <topic>` bin covers ~13 doc topics (architecture, roadmap, current-work, requirements-executable, requirements-specs, validation-rules, changelog, traceability, decisions, business-rules, taxonomy, patterns); studio ran them via `scripts/generate-docs-all.mjs`. This repo has an analogue at `examples/self-host/scripts/generate-docs.mjs`. Wave 1 verified `architect overview` (the only bin exercised by CLI tests). Doc generation is untested in the new layout.

- [ ] Run the full `docs:all` orchestrator from the dogfood location (post-1.5.1 that's repo root). Inspect output for completeness and coherence.
- [ ] Confirm `output.directory: 'docs-live'` works as expected. Add `docs-live/` to `.gitignore` (the generated output is a build artifact, not committed source).
- [ ] If anything is missing or broken (likely candidates: hardcoded relative paths in generators, missing `architect/specs/` content the lift didn't bring across), file fixes as part of this wave or follow-up tasks.
- [ ] Promote a minimal doc-gen smoke (one topic, exit code 0, non-empty output) into the W1 verification gate so future waves catch regressions.

### 1.5.4 Author repo `CLAUDE.md` (+ `AGENTS.md` symlink)

Studio's `CLAUDE.md` is ~500 lines, of which:

- ~50% is studio-specific (libar-ui, desktop app, OmO, two-instance topology, web/electron architecture, plugin's session-router skill, cross-instance conventions, browser-automation paths) — **drop**.
- ~30% is architect-package-family doctrine (No-BC + Zod-first boundaries, "Architect State is Code", Architect Spec section, package family table, dependency direction acyclic invariant, pattern graph as core abstraction, two Gherkin parsers, architect state folders not compiled/linted/tested) — **lift selectively**.
- ~20% is plugin / claude-plugin operational ("session-router skill resolves which instance", `UserPromptSubmit` hook injects bootstrap, `PreToolUse` blocks bare reads on Architect-scoped paths) — **most drops; small bits about CLI/MCP feedback file get rewritten**.

A major **simplification opportunity:** in studio, the two-instance topology forced constant "which instance applies here" disambiguation. In this repo there's exactly ONE instance, so that entire section collapses.

- [ ] Author a fresh `AGENTS.md` at repo root (~150 line target). Selective lift from studio, not byte-faithful.
- [ ] Add `CLAUDE.md` as a symlink to `AGENTS.md` (matches studio convention; harnesses look for either name).
- [ ] Cross-link the (renamed) `formal-spec/` and the dogfood `architect/` directory so a fresh session knows where the methodology lives vs where this project's specs live.
- [ ] Keep the No-BC and Zod-first sections verbatim — they're CI-enforced doctrine that survived the eject.

### 1.5.5 Rename `spec/` → `formal-spec/`

Two unrelated "spec" concepts coexist in this codebase and contributors conflate them constantly:

| Term | What it is | Current path |
|---|---|---|
| **Architect Spec** | Formal contract defining how Architect-managed projects work (artifact types, tag system, file formats, FSM transitions). The methodology's RFC / standard document. | `spec/` (package `@libar-dev/architect-spec`) |
| **Delivery specs** | Per-feature Gherkin `.feature` files describing individual features in the lifecycle (idea → candidate → plan → design → executable). | `examples/self-host/architect/specs/` (per 1.5.1, will become `architect/specs/`) |

- [ ] Rename directory `spec/` → `formal-spec/`.
- [ ] Update `formal-spec/package.json`: `repository.directory: "formal-spec"`, `homepage: "https://github.com/libar-dev/architect/tree/main/formal-spec"`.
- [ ] Update `pnpm-workspace.yaml` (currently lists `spec`).
- [ ] Sweep cross-refs in `formal-spec/README.md`, `formal-spec/*.md` files, all package READMEs, root README, and the architect-core source that may reference `spec/` paths (e.g. `packages/architect-core/src/index.ts` if it mentions the formal spec).
- [ ] npm package name `@libar-dev/architect-spec` stays unchanged — only the on-disk directory moves.

### 1.5.6 Smoke all 7 bins post-cleanup

Wave 1 only exercised `architect overview` via the CLI test suite. The other six bins are untested in this repo's layout.

- [ ] `architect --help` (covered indirectly by W1 tests, but re-verify).
- [ ] `architect-generate --help` and at least one real `-g <topic> -f` invocation against the dogfood config.
- [ ] `architect-guard --help` and `architect-guard --all` (or `--staged` in a dirty tree).
- [ ] `architect-validate --help` and `architect-validate --dod --anti-patterns`.
- [ ] `architect-lint-steps --help`.
- [ ] `architect-lint-patterns --help`.
- [ ] `architect-mcp --help` (server should advertise its 18 tools without crashing).
- [ ] Verify each is reachable both as a direct package bin (`pnpm exec architect-generate`) and via the meta package's bin re-exports.

### 1.5.7 v1→v2 import + bin map for MIGRATION.md

This is a content prerequisite for the W4 `MIGRATION.md` author task — capture the map now while it's fresh.

- [ ] Document the bin → package mapping table (all 7 bins, which split publishes each, what they're for).
- [ ] Document the JS API → package mapping for v1 symbols that consumers may have imported from `@libar-dev/architect`. Particularly important: the 8 name-collision types from W1 (where `BusinessRule` and friends now live exclusively in one split).
- [ ] Note that the meta `@libar-dev/architect` is now bin-only — consumers who imported JS APIs from it must migrate to the split that owns each symbol.

### 1.5.8 `.changeset/` — no action

Captured here to close the loop: the changesets config (`.changeset/config.json`) is correct as-is. Fixed group of 6 publishable packages (they version in lockstep), spec + dogfood ignored, public access, `main` base branch. Nothing to do until W7 produces the first changeset for the initial publish.

## Wave 2 — Root tooling (eslint, lint-staged, husky, turbo)

The lift skipped opinionated tooling files because they reach across the studio monorepo. Pick a minimal version for the new repo.

- [ ] Author a root `eslint.config.mjs` for the new repo. Studio's version (`architect-studio/eslint.config.mjs`, ~11 KB) bundles the custom `no-suppression-comments` rule plus TailwindCSS / React rules — strip everything React/Tailwind, keep the TypeScript + import + no-suppression bits.
- [ ] Decide on Turbo. Two options:
  - **Skip it.** Use `pnpm -r --filter` for orchestration. Simpler for a 6-package repo.
  - **Keep it.** Lift `turbo.json` (already in studio root) and add `turbo` as a dev dep. Useful if build times grow.
  - Recommendation: skip Turbo for now, add later if needed.
- [ ] Decide on Husky + lint-staged. For a publish-only repo, lint-staged is overkill; rely on CI for pre-merge gates. Skip both unless a maintainer wants local pre-commit.
- [ ] Wire `pnpm format` and `pnpm format:check` to verify they cover everything.

## Wave 3 — folded into Wave 1.5

The original W3 was "fix path references in `examples/self-host/`". The 1.5.1 promotion supersedes most of those item-level tasks because the entire `examples/self-host/` tree moves to repo root and gets restructured. The few items 1.5.1 doesn't directly address are surfaced here so they don't get lost:

- [ ] `examples/self-host/architect.config.ts` had a `packages` array with regexes like `/^\.\.\/architect-core\//` written for when this dir lived at `packages/architect/examples/self-host/` inside studio (so package paths were `../../architect-core/`). After 1.5.1's promotion to root, the right relative path is `./packages/architect-core/` — easier still, switch the matching strategy to use workspace package names instead of regex paths.
- [ ] Decide what to do with `README.md.from-monolith` (the v1 monolith's README). Either delete or carve relevant content into the W4 `MIGRATION.md`.

## Wave 4 — Public surface docs and README pass

- [ ] Polish the root `README.md` (placeholder is in place — add usage examples, migration-from-v1 note, philosophy summary lifted/rewritten from `architect-studio/AGENTS.md`).
- [ ] Author per-package READMEs for the 5 splits and the meta — `packages/architect/README.md` was rewritten during W1 for the bin-only meta; the splits still have none.
- [ ] Migrate `CONTRIBUTING.md`, `MAINTAINERS.md`, `SECURITY.md` (already lifted to repo root) — they reference studio-specific URLs; sweep for `delivery-process` and `architect-studio` mentions.
- [ ] Author `MIGRATION.md` at repo root using the bin + JS-API map prepared in 1.5.7 as concrete content. Include the v1→v2 import path table for the 8 collision symbols (`BusinessRule`, `Deliverable`, `PhaseProgress`, `StatusDistribution` + schemas, `ProjectionError` + code) — these are the symbols where dropping the meta barrel forces consumers to repoint imports.

## Wave 5 — CI (GitHub Actions)

- [ ] Workflow for PR validation: install, typecheck, lint, build, test, on Node 20 + 22.
- [ ] Workflow for release: triggered on `main` push, runs `pnpm changeset version` PR (changesets/action), then `pnpm changeset publish` on merge with `--provenance` flag set. Configure `NPM_TOKEN` and `id-token: write` permission.
- [ ] Optional: a "consume the published artifacts" job that installs `examples/self-host` from the `next` dist-tag rather than `workspace:*`, to catch packaging bugs that workspace consumption hides.

## Wave 6 — Formal-spec polish + decision on co-location

The directory was renamed to `formal-spec/` in 1.5.5 to disambiguate from delivery `architect/specs/`. Content polish is still pending.

- [ ] grep `formal-spec/` for `@architect-studio` / `architect-studio` references and update to `@libar-dev/architect` / the new repo.
- [ ] Update formal-spec README cross-links — they currently point at studio-era paths.
- [ ] Decide on license for `@libar-dev/architect-spec`. It's `UNLICENSED` today (because `private: true`); when promoted to v1.0 it'll need CC-BY-4.0 / W3C / OWFa. Don't decide now; record the open question.
- [ ] Re-confirm: the formal spec stays in this repo until v1.0 / second toolchain / governance ask. Don't split prematurely.

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
- [ ] Coordinate the architect-claude-plugin migration timing with Wave 9 (consolidated agent skills move into this repo). Studio's plugin invocations and `pkg:*` shortcuts depend on plugin location — sequence so studio is never left calling a dead path.

## Wave 9 — Consolidate agent skills into the architect package (high-level placeholder)

> Details to be provided in a later session. Capturing the high-level shape now.

Two harness-specific delivery-doctrine packages currently live in `architect-studio`:

- **`/Users/darkomijic/dev-projects/architect-studio/.opencode/`** — generic / OpenAgent harness configuration. `opencode.jsonc` + `oh-my-openagent.jsonc` + supporting scripts. Repo-local execution harness wrappers.
- **`/Users/darkomijic/dev-projects/architect-studio/packages/architect-claude-plugin/`** — Claude Code plugin. Hooks (`UserPromptSubmit`, `PreToolUse`), session-typed skills (`architect-session-router`, `-plan-session`, `-design-session`, `-implement-spec`, `-review-spec`, `-review-implementation`, `-verify-handoff`), `_shared/` doctrine kernel, slash commands, dogfooding feedback hooks.

Studio's CLAUDE.md describes them as "per-harness wirings of the same workflow discipline" — the skill bodies are the canonical doctrine, the harness-specific code is a thin adaptation layer.

### Goals

- [ ] Move both into this repo so the architect package family owns its delivery-doctrine adaptations end-to-end. They are part of "what architect ships," not part of studio.
- [ ] Restructure into a **universal-skills + per-harness-extensions** layout. The user has details (TBD next session) on how to configure universal skills with specific extensions for different harnesses (Claude Code, OmO/OpenAgent, others).
- [ ] **Remove hooks.** Hooks-based bootstrap (`UserPromptSubmit` injects context, `PreToolUse` blocks bare reads on Architect-scoped paths) gets replaced by the universal-skills + per-harness-extension model. The user has the plan for this — capturing the constraint now so the next-session design doesn't reintroduce hooks.
- [ ] Expose the consolidated package to **consumers** — both end-users of the architect toolchain and other Libar projects that want the same delivery doctrine. The shape is likely a single workspace package (or two, split by harness) under `packages/` in this repo.

### Coordination with other waves

- W8 (studio cutover) depends on this — studio's `pkg:*` shortcuts and plugin invocations need a destination.
- The dogfood instance (per W1.5) will be the first consumer of the relocated skills.

### Out of scope until details land

- Exact package name(s) and npm publication strategy.
- How universal skills get parameterised per harness.
- Whether the OmO `.opencode/` adapter ships in the same package or a sibling.
- Migration sequencing for `.architect-cli-feedback.md` and the dogfooding feedback CLI.

## Cross-cutting open questions (capture before publish)

- License audit: is `(MIT AND BUSL-1.1)` still the intended compound license, and is the BUSL-1.1 portion still scoped only to the MCP subset (per `LICENSE-MCP`)? Confirm before first publish — license metadata is hard to change retroactively.
- npm scope provenance: `@libar-dev` org on npm — confirm publishing rights and 2FA setup before W7.
- Changesets pre-mode: stay in `next` tag until 2.0.0 stable, then `pnpm changeset pre exit`. Decide when "stable" means.

---

## Snapshot — current vs planned (post-W1.5)

### Current (post-W1 commit `00ff320`)

```
architect/
├── .changeset/             # config.json (fixed group of 6), README — W7
├── .gitignore              # node_modules, dist, .DS_Store, .sisyphus/
├── .node-version           # 22
├── .npmrc                  # auto-install-peers, no shameful hoist
├── .prettierrc, .prettierignore
├── CONTRIBUTING.md, LICENSE, LICENSE-MCP, MAINTAINERS.md, SECURITY.md
├── README.md               # placeholder; W4 will rewrite
├── REMAINING-WORK.md       # this file
├── package.json            # root workspace
├── pnpm-workspace.yaml
├── pnpm-lock.yaml          # committed for CI reproducibility
├── tsconfig.json, tsconfig.architect-base.json
├── packages/
│   ├── architect/                  # @libar-dev/architect (meta — bin-only post-W1)
│   ├── architect-core/             # @libar-dev/architect-core
│   ├── architect-projection/       # @libar-dev/architect-projection
│   ├── architect-guard/            # @libar-dev/architect-guard
│   ├── architect-cli/              # @libar-dev/architect-cli
│   └── architect-mcp/              # @libar-dev/architect-mcp
├── examples/
│   └── self-host/                  # dogfood instance — relocation pending in W1.5
├── spec/                           # @libar-dev/architect-spec — rename pending in W1.5
└── docs/                           # empty
```

### Planned (post-W1.5)

```
architect/
├── architect.config.ts            # dogfood config promoted from examples/self-host/
├── architect/                     # dogfood specs/decisions/releases/stubs/...
├── scripts/                       # dogfood scripts (after audit; query.*, codemod-wave2, verify-exports gone)
├── tests/                         # dogfood smoke + regression
├── docs-sources/                  # dogfood doc-gen inputs
├── docs-live/                     # GITIGNORED — generated docs output
├── packages/                      # publishable packages (unchanged from current)
│   ├── architect/                 # bin-only meta
│   ├── architect-core/, architect-projection/, architect-guard/
│   ├── architect-cli/, architect-mcp/
│   └── architect-claude-plugin?   # arrives in W9
├── formal-spec/                   # renamed from spec/ — methodology RFC
├── AGENTS.md, CLAUDE.md           # CLAUDE.md is a symlink — authored in W1.5
├── CONTRIBUTING.md, LICENSE, LICENSE-MCP, MAINTAINERS.md, SECURITY.md
├── MIGRATION.md                   # v1→v2 import + bin map (W4)
├── README.md                      # rewritten (W4)
├── REMAINING-WORK.md
├── package.json, pnpm-workspace.yaml, pnpm-lock.yaml
└── tsconfig.json, tsconfig.architect-base.json
```
