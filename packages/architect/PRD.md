# architect (shell / composition root) — Package PRD

> Scope: the "shell" — the bin-only meta package `@libar-dev/architect` (`packages/architect/`) plus the workspace composition root (root `package.json`, `architect.config.ts`, `pnpm-workspace.yaml`, `tsconfig.architect-base.json`, `eslint.config.mjs`) and the repo's dogfood/self-hosting wiring. Recorded from code/config as-is, not from annotations.

## Purpose

The shell is the **assembly layer** that turns five independently published runtime packages into one installable, runnable toolchain and one self-hosting dev environment. It does two distinct jobs. As a **distribution artifact**, the meta package `@libar-dev/architect` (`packages/architect/package.json`) installs the whole family in one dependency and re-exposes all 7 CLI/MCP bins — bin-only, no JS API. As a **composition root**, the repo root wires the workspace (`pnpm-workspace.yaml`), the shared strict-TS base (`tsconfig.base.json` → `tsconfig.architect-base.json`), the lint doctrine (`eslint.config.mjs`), and a script surface (root `package.json`) that dispatches to the package-owned bins, and it hosts the dogfood delivery-process instance (`architect.config.ts` + `architect/` + `tests/` + `docs-live/`) that runs the toolchain against this repo itself.

## Public interface

### Bins (7) — meta package re-exposes, owner packages implement

The meta package's bin shims (`packages/architect/bin/*.js`) are one-line re-exports; the implementation lives in the owner package's own `./bin/<name>` export.

| Bin                       | Owner package              | Shim re-exports                             |
| ------------------------- | -------------------------- | ------------------------------------------- |
| `architect`               | `@libar-dev/architect-cli` | `architect-cli/bin/architect`               |
| `architect-generate`      | `@libar-dev/architect-cli` | `architect-cli/bin/architect-generate`      |
| `architect-guard`         | `@libar-dev/architect-cli` | `architect-cli/bin/architect-guard`         |
| `architect-lint-patterns` | `@libar-dev/architect-cli` | `architect-cli/bin/architect-lint-patterns` |
| `architect-lint-steps`    | `@libar-dev/architect-cli` | `architect-cli/bin/architect-lint-steps`    |
| `architect-validate`      | `@libar-dev/architect-cli` | `architect-cli/bin/architect-validate`      |
| `architect-mcp`           | `@libar-dev/architect-mcp` | `architect-mcp/bin/architect-mcp`           |

So 6 of 7 bins are owned by `architect-cli`; only `architect-mcp` is owned by `architect-mcp`. The CLI and MCP composition-root internals are out of scope here (other agents cover them).

### Root script surface (`package.json`, 31 scripts)

Scripts dispatch to package owners via `pnpm exec architect-<bin>` or run the dogfood CLI through `tsx` against `packages/architect-cli/src`. Grouped by intent:

- **build / typecheck / lint / test** — `build`, `typecheck`, `lint`, `test` fan out across `./packages/**` via `pnpm -r --filter`; `typecheck:dogfood` (`tsc -b tsconfig.json`) and `test:dogfood` (`vitest run`) compile/test the repo-root dogfood instance; `smoke` (`tsx scripts/workspace-smoke.ts`), `clean`, `format`, `format:check`.
- **query** — `architect:query` (full verb surface, `tsx ... pattern-graph-cli.ts --base-dir .`), plus convenience aliases `architect:overview`, `architect:status`.
- **guard** — `architect:guard` (`--staged`), `architect:guard:all` (`--all`), `architect:lint-steps`; validation pair `validate:patterns`, `validate:all` (`--dod --anti-patterns`).
- **docs** — `docs:patterns`, `docs:architecture`, `docs:roadmap`, `docs:taxonomy`, `docs:api-reference`, and `docs:all` (`architect-generate --base-dir . --all -f`) → regenerates git-tracked `docs-live/`.
- **release / ci-adjacent** — `changeset`, `changeset:version`, `changeset:publish`, `release`; doctrine guards `audit:subtractive`, `guard:no-suppressions`, `check:skills`.

> Note: the `pkg:*` and `ci:architect:*` script families referenced in some planning context **do not exist** in the current root `package.json`. The live surface is leaner than briefed; CI presumably invokes the existing scripts directly.

### Config contract — `architect.config.ts` (49 lines)

`export default defineConfig({ ... })` where `defineConfig` is owned by `@libar-dev/architect-core` (`src/config/define-config.ts`, re-exported from the package root and `./config`). The dogfood config consumes core-owned constants rather than hand-authoring values:

- `roles: ARCHITECT_PACKAGE_ROLES` — the 8-role enum (sourced from `architect-core/src/config/self-hosting.ts`, shared with the static `WORKSPACE_TAG_REGISTRY`).
- `productAreas: ARCHITECT_PACKAGE_PRODUCT_AREAS`.
- `sources: { typescript, stubs, features }` — spread from `PACKAGE_SELF_HOSTING_SOURCES`.
- `output: { directory: 'docs-live', overwrite: true }`.
- `generators: DEFAULT_GENERATORS`.
- `packages: [...]` — 7 display-grouping entries with `match` globs/regexes (5 runtime packages + `architect-dev` = `tests/features/` + `architect-pkg-content` = `architect/`).

Consumers in other repos supply their own `architect.config.ts` of the same shape; this file is the dogfood instance.

### Shared TS base

`tsconfig.architect-base.json` extends `tsconfig.base.json` and adds `noPropertyAccessFromIndexSignature: true`. The base enforces the strict doctrine: `strict`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `isolatedModules`, `declaration`+`declarationMap`, `module: ESNext` / `moduleResolution: bundler`. `eslint.config.mjs` layers `strictTypeChecked` + `stylisticTypeChecked`, a local `no-suppression-comments` rule (No-BC enforcement, production `src` only), and `architect-projection` boundary import rules.

## Enumerated functionality

- **Bin composition** — 7 thin re-export shims in `packages/architect/bin/`; the meta `package.json` `bin` map points at them; owner packages (`architect-cli` ×6, `architect-mcp` ×1) carry the real entrypoints via their own `./bin/*` exports.
- **Script dispatch** — root `package.json` is the human/CI entrypoint; `pnpm exec architect-<bin>` resolves to the meta/owner bin, or `tsx` runs the CLI source directly (dogfood uses source, not built dist).
- **Config loading** — `defineConfig` (core-owned) validates and types `architect.config.ts`; the dogfood config pulls roles/areas/sources/generators from `architect-core` constants so taxonomy stays single-sourced.
- **Workspace / build wiring** — `pnpm-workspace.yaml` globs `packages/*` + `formal-spec`; `pnpm@10.4.1` pinned; recursive filtered build/test; shared tsconfig base + flat ESLint config + Prettier.
- **Dogfood / self-hosting** — `architect.config.ts` + `architect/` working state (specs, decisions, releases, stubs, step-stubs, slices, ideations, design-reviews) + `tests/` (executable Gherkin under `tests/features/`, steps, support, fixtures) + `docs-live/` (git-tracked generated output, determinism-gate diff target) + `scripts/` (smoke, validate-workspace, generate-docs, subtractive audit, no-suppressions guard, skill-symlink check).
- **Formal-spec** — `formal-spec/` is the `@libar-dev/architect-spec` v0.2.0 methodology RFC (private, `*.md` only, 13 numbered chapters + appendix). A workspace member for tooling, but ships no code; it is the spec the package family is the reference implementation of.

## Dependencies

Family dependency graph (strictly acyclic; confirmed via `architect:query overview` and each package's `dependencies`):

```
architect-core        (leaf — no @libar-dev deps; deps: @cucumber/gherkin, typescript-estree, glob, zod)
   ▲   ▲   ▲
   │   │   └──────────── architect-guard      → core
   │   └────── architect-projection → core
   │              ▲
   ├── architect-cli → core, guard, projection
   └── architect-mcp → core, projection      (+ @modelcontextprotocol/sdk, chokidar)

architect (meta)  → core, projection, guard, cli, mcp   (workspace:* — install-everything)
```

`architect-core` is the single sink; nothing depends on `cli`, `mcp`, or the meta package internally. The meta package depends on all five (so installing it installs the family). The repo-root `package.json` depends on `architect-core` + `architect-guard` (runtime) and dev-depends on cli/mcp/projection.

Notable external tooling: **pnpm** (workspaces, pinned `10.4.1`), **tsx** (run CLI source directly), **vitest** + `@vitest/coverage-v8` + `@amiceli/vitest-cucumber` (executable Gherkin tests), **typescript** + **typescript-eslint** + **eslint** + **eslint-plugin-import** + **eslint-config-prettier** + **prettier**, **@changesets/cli** (release), **zod** (boundary contracts). Each owner package builds with its own bundler (per-package `build` scripts, not centralized here).

## Consumers

- **Developers** — run the dogfood scripts (`pnpm architect:query`, `architect:guard`, `validate:all`, `docs:all`) against this repo.
- **CI** — invokes build/typecheck/lint/test, the guards (`guard:no-suppressions`, `audit:subtractive`, `check:skills`), the docs determinism gate (`docs:all` + `git diff --exit-code docs-live`), and changesets release.
- **Agents / harnesses** — Codex, Claude Code, OpenCode reach the toolchain through `pnpm architect:query` (CLI) and the `architect-mcp` server.
- **Studio / desktop (proprietary)** — consume the same projections the shell exposes.
- **Consuming repos** — install `@libar-dev/architect` (or the granular splits for a narrower footprint), wire their own `architect.config.ts` of the same shape, and expose their own `architect:query` script.

## Load-bearing vs incidental (cut-list)

### Load-bearing — must stay

- **The meta `package.json` bin map + the 7 shim files** — the entire reason the meta package exists (single-install distribution of the family's bins). Bin-only is a deliberate v1→v2 contract (no JS barrel).
- **`defineConfig` + `architect.config.ts` shape** — the stable public config contract every architect-managed repo wires; single-sources taxonomy from `architect-core` constants.
- **`pnpm-workspace.yaml` + `tsconfig.base.json`/`tsconfig.architect-base.json` + the No-BC ESLint rule** — the acyclic-build + strict-type + no-suppression doctrine the whole family depends on.
- **`docs-live/` generation wiring (`docs:all`) + the dogfood `architect/`+`tests/` instance** — the self-hosting proof and the determinism gate; this is the product validating itself.

### Incidental / deletion-candidate — specific

- **Highest-confidence cut — the per-doc `docs:*` scripts (`docs:patterns`, `docs:architecture`, `docs:roadmap`, `docs:taxonomy`, `docs:api-reference`).** Five single-generator wrappers around `architect-generate -g <type> -f` that `docs:all` already subsumes. As the projection pipeline collapses the documentType-first star into source-first Views over one engine, per-documentType invocation scripts are exactly the accreted surface that should disappear; keep `docs:all` only.
- **`tsconfig.architect-base.json` adds a single flag** (`noPropertyAccessFromIndexSignature`) over `tsconfig.base.json`. Two base files for one extra option is borderline; the flag could fold into `tsconfig.base.json` and the extra file be deleted — verify no package extends only the plain base first.
- **Convenience query aliases `architect:overview` / `architect:status`** duplicate `architect:query overview` / `architect:query status`. Harmless, but pure sugar — candidates to drop if the script list is being trimmed.
- **Naming drift to fix, not necessarily cut:** a bin named `architect-lint-patterns` exists, but the wired root script is `validate:patterns` (→ `architect-validate`), and `architect:lint-steps` wraps `architect-lint-steps`. The `lint-patterns` bin has no root-script entrypoint — confirm it is still reached (e.g. by the guard pipeline) or it is a dangling bin.
- **Planning-context script families `pkg:*` and `ci:architect:*` do not exist** in the current root `package.json` — no cut needed, but any doc/skill claiming they exist is stale and should be corrected.

## Size signal

- **Packages:** 6 in `packages/` (`architect` meta + 5 runtime: core, projection, guard, cli, mcp) + 1 workspace member `formal-spec` (`@libar-dev/architect-spec`, docs-only). pnpm workspace globs `packages/*` + `formal-spec`.
- **Root scripts:** 31.
- **Bins:** 7 (6 cli-owned, 1 mcp-owned).
- **Config size:** `architect.config.ts` ≈ 49 lines (mostly the 7-entry `packages` display map); `tsconfig.base.json` ≈ 28 lines, `tsconfig.architect-base.json` ≈ 8 lines, `eslint.config.mjs` ≈ 435 lines (the large surface is `architect-projection` import-boundary rules, not generic shell config), `pnpm-workspace.yaml` 3 lines.
- **Pattern-graph scale (dogfood, from `architect:query overview`):** 267 delivery patterns + 20 candidates; per-package node counts core 31 / projection 103 / guard 20 / cli 4 / mcp 5.
