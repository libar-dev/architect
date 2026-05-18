# architect-projection — Phase 2B: Codebase Cleanup

**Reviewer:** `codebase-cleanup:code-reviewer` lens.
**Source:** projection's `src/` (145 .ts files, ~15,238 SLOC), `tests/` (83 step files plus the perf folder + fixtures), `package.json`, `tsconfig{,.test}.json`, `eslint.config.mjs`, `vitest.config.ts`, `vitest.perf-report.config.mjs`, `scripts/{options-schema-barrel-audit,jsdoc-boilerplate-audit}.mjs`, `tests/perf/{compare-baseline.mjs,baselines/business-rule-set.baseline.json}`, `docs/PERF.md`, `dist/` (npm pack dry-run: 582 files, 231 kB packed, 1.2 MB unpacked).

This document is the cleanup-lens companion to Phase 1 (`01-quality-architecture.md`); IDs from that file are cited verbatim (`C-PROJ-*`, `H-PROJ-*`, `M-PROJ-*`, `L-PROJ-*`). Core-side IDs from `architect-core/05-package-report.md` and `04-best-practices.md` are also cited where confirmed.

---

## 1. Executive Summary

Projection's cleanup posture is **noticeably stronger than core's**: zero `@ts-ignore`, zero `eslint-disable`, zero `TODO`/`FIXME`, zero `void X;`, zero `console.*` in `src/`, zero `as unknown as` in `src/`, zero `z.object` (107 strictObject sites), zero `.skip`/`.only` in tests, no `node:fs`/network imports in `src/` (the data layer is genuinely pure), no `node_modules` import drift, no stray scripts on the published path, `.DS_Store` files locally present but `.gitignore`-ed. The package self-enforces with two custom audits, a local AST lint rule banning duplicate `isPlainObject`, and four projection-renderer boundary lint rules. Doctrine surface — clean.

The highest-impact cleanups are all **finding the gap between the doctrine the package preaches and the automation that enforces it**, not new doctrine breaches:

1. **The advertised "Drift over baseline × 1.5 fails the gate" claim in `AGENTS.md:78` and `docs/PERF.md` is wired to no automation.** `tests/perf/compare-baseline.mjs` is a fully implemented ratcheted gate (`min(hard, baseline × 1.5)` over 26 metric sites including `project/renderObject/renderPretty/isBundleP50Micros` + 8 projection hot paths + 3 markdown bundle types). It loads `tests/perf/baselines/business-rule-set.baseline.json` (a real committed baseline). But `package.json#scripts.test` never invokes it; only `docs/PERF.md:16` mentions the two-command sequence. There is no CI workflow (`.github/workflows/` does not exist family-wide — see core `CI-1`). This sharpens Phase 1's **C-PROJ-3**: the gate is *implemented* but *unwired*. A one-line `package.json` change (or a CI job) makes the rhetoric real.
2. **`scripts/options-schema-barrel-audit.mjs` does not catch C-PROJ-2.** The audit checks that every `*OptionsSchema` exported from a subtree's `index.ts` is also re-exported by `projections/index.ts` — barrel completeness of *schemas*. It does **not** assert that every `parseAndProject*` entrypoint uses the shared `parseAndProject(...)` wrapper. The C-PROJ-2 outlier (`open-question-list.ts:38` calls `OptionsSchema.parse` directly) sits in the audit's natural scope but isn't covered. Adding ~15 lines to the audit would close C-PROJ-2 mechanically and prevent regression.
3. **`summarizeTaxonomyDigest` is re-exported through three barrels** (`fragments/index.ts:43`, `fragments/governance/index.ts:14`, `projections/index.ts:50`) — the same runtime helper appears as a public export in two of the seven subpath modules listed in `package.json#exports` (H-PROJ-A-3, H-PROJ-A-10). Single ownership move resolves both findings.
4. **`documentation-type-registry.ts` carries a self-described "campaign deletion target" comment at `:55-63`** and ships a 174-LOC Proxy-based lazy facade for a 12-entry static table. The "campaign" (W-DOCS-1 per `.pr-coordination/`) is identified as not-yet-landed. As long as the proxy stays, every consumer of `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY` pays Proxy interception cost on every read. The simplification recipe is already in H-PROJ-A-9; cleanup angle is "this module's lifecycle should not exceed the W-DOCS-1 PR".
5. **Tarball composition: 50% of published files are `.map`** (290 maps out of 580 dist files). Same problem as core's CL-CORE-3, fixed by the same one-line `tsconfig.base.json` edit (already in the family-wide action plan). Projection inherits the gap; no projection-specific fix is needed.

Two **net-new** Mediums from this lens not surfaced in Phase 1:

- The `documentation-type-registry.ts` Proxy initializer at `:138-174` is **module-load side effect-free at the file boundary but lazy-initializes a frozen state on first property access** — fine for the runtime, but the lazy state is held in a module-scoped `let` (`:75`). A new `getRegistry()`/clear surface (as H-CORE-8 maps to for `cloneTagRegistry`) would lift this to an explicit lifecycle.
- The `vitest.perf-report.config.mjs` is **near-duplicate of `vitest.config.ts`** (12 lines vs 14 lines; same 30s timeout, same env, only `include` differs). One `vitest.config.ts` with a `projects` field — or a `vitest --include 'tests/features/perf/**/*.steps.ts'` flag passed on the CLI — collapses the file.

Nothing in this report contradicts Phase 1; it adds the cleanup-lens detail and quantifies the unwired-automation gap.

---

## 2. Findings by severity

### Critical (P0)

#### Cleanup-C-PROJ-1. `pnpm test` does not invoke the perf gate, yet `AGENTS.md` + `docs/PERF.md` claim it does

- **Source/evidence:**
  - `package.json:65` — `"test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts"`. No call to `vitest --config vitest.perf-report.config.mjs` and no call to `node tests/perf/compare-baseline.mjs`.
  - `vitest.config.ts:8` — `exclude: ['tests/support/**/*.ts', 'tests/fixtures/**/*.ts']` and `include: ['tests/features/**/*.steps.ts']`. This **does** run `tests/features/perf/business-rule-set-report.steps.ts` because it sits under `tests/features/`. So the report *gets written* by `pnpm test`, but the budget comparison does not.
  - `tests/perf/compare-baseline.mjs:30-34, 154-170` — implements the real `min(hard, baseline × 1.5)` ratchet across `project.avgMs`, `renderObject.avgMs`, `renderPretty.avgMs`, `isBundleP50Micros`, all 8 `projectionHotPaths.*`, and 3 `renderMarkdownBundles.*`. Compiles a `failures[]` and sets `process.exitCode = 1` on any breach.
  - `tests/perf/baselines/business-rule-set.baseline.json` — committed real baseline (generated 2026-05-17T10:25 per the `generatedAt` field) covering all 26 measured metrics.
  - `docs/PERF.md:14-22` — documents the two-command sequence as the local invocation pattern.
  - `AGENTS.md:78` — "Drift over `baseline × 1.5` fails the gate."
- **What is actually happening:**
  - `pnpm test` writes `.sisyphus/evidence/task-3-business-rule-set-perf-report.json` (the file is in-tree today, generated 2026-05-17T13:34).
  - The report is asserted-finite only (`steps.ts:728-757` checks `Number.isFinite(summary.avgMs)`, `iterations > 0`, and that the 3 expected document types are present). Nothing budget-related.
  - The comparator script exists, works, and ratchets — it just sits between the test and the doc that markets it.
- **Why this is critical, not high:** The doctrine claim is load-bearing for several Phase 1 / Phase 2 family-wide recommendations (e.g., core H-CORE-8 says "land the perf budget after deep-freeze refactor"). The recommendation reads differently if the budget gate is implemented-but-disconnected vs. nonexistent.
- **Delete-or-fix recipe (pick one):**
  - **(a) Wire the gate.** Change `package.json:65` to:
    ```json
    "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.perf-report.config.mjs && vitest run --config vitest.config.ts && node tests/perf/compare-baseline.mjs"
    ```
    Or split into `test:perf` + `test:functional` and chain both from `test`. This is the doctrine-aligned move.
  - **(b) Climb-down the claim.** If the gate is intentionally local-only (e.g., to keep CI fast pre-CI), edit `AGENTS.md:78` and `docs/PERF.md:1-22` to say "run locally before merging perf-sensitive PRs" and drop "fails the gate" / "CI gate" language.
- **Either way:** the audit-script discipline (see § 5 below) should add a check that `package.json#scripts.test` either references `compare-baseline.mjs` OR the README does not claim a CI gate. This is *exactly* the kind of doctrine-vs-automation gap the existing barrel-audit pattern was created to enforce.

This finding rectifies C-PROJ-3's framing: the gate logic is real and ratcheted; only the wiring is rhetorical.

### High (P1)

#### Cleanup-H-PROJ-1. Triple barrel re-export of `summarizeTaxonomyDigest` makes the symbol public in 2 of 7 subpath exports

- **Source/evidence:**
  - `package.json:25-58` declares 7 subpath exports: `.`, `./blocks`, `./context`, `./disclosure`, `./routing`, `./fragments`, `./projections`, `./renderers`.
  - `src/fragments/governance/taxonomy-digest.ts:33` — `summarizeTaxonomyDigest` definition.
  - `src/fragments/governance/index.ts:14` — re-export 1.
  - `src/fragments/index.ts:43` — re-export 2 (aggregates to `./fragments` subpath).
  - `src/projections/index.ts:50` — re-export 3 (aggregates to `./projections` subpath).
  - `src/renderers/render-markdown.ts:39` — consumer; imports from `'../fragments/index.js'`.
  - Cross-package consumer: `architect-cli/src/cli/commands/meta.ts:105` consumes via the projections barrel.
- **Why it matters (cleanup angle):** The same runtime helper is publicly addressable as `@libar-dev/architect-projection/fragments → summarizeTaxonomyDigest` AND `@libar-dev/architect-projection/projections → summarizeTaxonomyDigest`. Either consumers can pick at random and drift, or the package gives the impression that the function belongs to two layers when ADR-005 says fragments are pure contracts and runtime helpers belong to projections. Phase 1 captured this as H-PROJ-A-3 (architecture lens) + H-PROJ-A-10 (cleanup lens — duplicate re-export).
- **Delete-or-fix recipe:**
  1. Move `src/fragments/governance/taxonomy-digest.ts` to `src/projections/governance/taxonomy-digest-summary.ts` (or inline the 4-line function inside `render-markdown.ts:945-955` — the function literally counts entries by category).
  2. Delete the re-export at `src/fragments/governance/index.ts:14`.
  3. Delete the re-export at `src/fragments/index.ts:43`.
  4. Keep `src/projections/index.ts:50` (now sourcing from the new projections-side path).
  5. Update `src/renderers/render-markdown.ts:39` to import from the projections side, or inline if that path was chosen.
  6. **Verify with the existing barrel audit.** `scripts/options-schema-barrel-audit.mjs` is schema-only today (line 13: it matches `*OptionsSchema` only); after this move, no audit drift surfaces. See § 5 for the matching audit extension.

#### Cleanup-H-PROJ-2. `vitest.perf-report.config.mjs` duplicates `vitest.config.ts` minus 2 lines

- **Source/evidence:**
  - `vitest.config.ts` (14 lines): 30s timeout, node env, `include: ['tests/features/**/*.steps.ts']`, `exclude: ['tests/support/**/*.ts', 'tests/fixtures/**/*.ts']`, `globals: true`.
  - `vitest.perf-report.config.mjs` (16 lines): same 30s timeout, same node env, `include: ['tests/features/perf/**/*.steps.ts']` (subset of `vitest.config.ts#include`), no `exclude`, `globals: true`. Uses `node:url` and `fileURLToPath` to compute `root` instead of `__dirname`.
- **Why it exists:** The functional config and the perf-report config are conceptually different runs (perf needs the report written before `compare-baseline.mjs` reads it; functional `vitest.config.ts` accidentally runs the perf-report step too). But the only delta is `include`, and projection's `vitest.config.ts` already excludes nothing perf-related.
- **Cleanup angle:** Two configs, near-identical, with one using `__dirname` (Node 20 ESM has it via `import.meta.dirname`; `vitest.config.ts:1` uses `import path from 'path'` and `__dirname` at line 12 — this only works because vitest transpiles the file). The duplication is 100% accidental: a perf-specific run could be a CLI flag override.
- **Delete-or-fix recipe:**
  - **(a)** Delete `vitest.perf-report.config.mjs` entirely. Replace the local-perf-run command in `docs/PERF.md:15` with:
    ```bash
    pnpm --filter @libar-dev/architect-projection exec vitest run --config vitest.config.ts tests/features/perf
    ```
    The argument after `--config` overrides `include` to the path filter (vitest supports positional include paths).
  - **(b)** If a separate config is preferred, switch `vitest.config.ts:1,12` from `path` + `__dirname` to `node:path` + `import.meta.dirname` so the two files share the same idiom and then convert to TS `vitest.config.ts` for both (the `.mjs` extension is gratuitously different).
- **Note on `tsconfig.test.json:10`:** the test tsconfig already includes both `vitest.config.ts` and `vitest.perf-report.config.mjs` so the file is type-checked; deletion is safe from a build perspective.

#### Cleanup-H-PROJ-3. The 174-LOC Proxy facade in `documentation-type-registry.ts` carries a self-described deletion comment but ships in production

- **Source/evidence:**
  - `src/projections/documentation-composition/documentation-type-registry.ts:55-63` — JSDoc says: "**DO NOT ADD ENTRIES HERE.** … this module exists only to carry the 12 pre-campaign entries until they migrate; it will be deleted once the campaign lands."
  - `src/projections/documentation-composition/documentation-type-registry.ts:138-174` — `createLazyReadonlyArrayFacade` defines a Proxy intercepting `get`, `getOwnPropertyDescriptor`, `has`, `ownKeys`, `set` over a `TValue[]` target; every property access calls `initialize()` (cheap if already initialized but always one branch + one `Reflect.*` call).
  - Decomposition: `documentation-type-registry.{cli-surface,disclosure,identity,output-routing}.ts` — 4 sibling files (60 + 76 + 92 + 59 = 287 lines) compose a 12-entry table at module load. `composeSupportedDocumentationTypeMetadata` at `:109-118` spreads four object maps keyed by `identity.key`.
  - `.pr-coordination/PRE-WDOCS-READINESS.md` confirms W-DOCS-1 is in design (not yet started).
- **Cleanup angle:** Three issues stack here:
  1. **Module-load complexity for a constant.** A 12-entry constant table is built across 5 files with a Proxy facade because of a not-yet-started campaign.
  2. **Proxy interception in the hot path.** `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY` is touched by every documentation-composition projection (`documentation-bundle.ts`, `pr-change-review.ts`, etc.) — every iteration goes through Proxy `ownKeys`/`get` traps.
  3. **The deletion comment is doctrinally correct but operationally a smell.** If W-DOCS-1 lands this cycle, the file disappears. If not, the proxy is unnecessary complexity *now*.
- **Delete-or-fix recipe (per Phase 1 H-PROJ-A-9, restated with cleanup-lens specifics):**
  - **Short term (no campaign assumption):** replace `createLazyReadonlyArrayFacade(...)` with:
    ```ts
    let cachedRegistry: readonly SupportedDocumentationTypeMetadata[] | undefined;
    export function getSupportedDocumentationTypeRegistry(): readonly SupportedDocumentationTypeMetadata[] {
      cachedRegistry ??= buildSupportedDocumentationTypeRegistryState().registry;
      return cachedRegistry;
    }
    ```
    Switch existing call sites from `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY` to `getSupportedDocumentationTypeRegistry()`. Net delta: delete `:138-174` (37 lines), replace 2 const-expressions with 2 functions. Proxy interception cost vanishes; lifecycle becomes explicit.
  - **Long term (W-DOCS-1 lands):** dissolve the 5 files; replace with `DocDefinition` instances. The deletion comment is the spec.

### Medium (P2)

#### Cleanup-M-PROJ-1. The audit script `options-schema-barrel-audit.mjs` does not cover the `parseAndProject*` shape

- **Source/evidence:**
  - `scripts/options-schema-barrel-audit.mjs:12-14` — regex matches export names ending in `OptionsSchema` only.
  - `src/projections/pattern-relations/open-question-list.ts:38` — outlier (C-PROJ-2) is not caught because the audit doesn't look at function-call shapes inside `parseAndProject*` exports.
- **Recipe:** see § 5 below — adding a single-regex check on the body of every exported `parseAndProject*` identifier (require it to either be assigned to `parseAndProject(...)` OR call `parseAndProject(...)` inside its body) closes C-PROJ-2 mechanically. ~15 LOC.

#### Cleanup-M-PROJ-2. `tsconfig.tsbuildinfo` (104 KB) is checked-in tooling output in the source-of-truth tree

- **Source/evidence:** `packages/architect-projection/tsconfig.tsbuildinfo` exists at 104,971 bytes (per `ls -la`).
- **Gitignore status:** `.gitignore:6` has `*.tsbuildinfo` — file is **not** tracked in git, but exists in the working tree. This is fine for incremental local builds; flagging only because it ships in the local tarball composition decisions and influences `tests/perf/baselines/` discoverability.
- **Verdict:** **Skip — not a real finding.** The file is correctly gitignored; this is incremental-build state. (Kept in this report only for completeness; no action.)

#### Cleanup-M-PROJ-3. `package.json#scripts.typecheck` only covers `tsconfig.test.json`

- **Source/evidence:** `package.json:62` — `"typecheck": "tsc --noEmit -p tsconfig.test.json"`. Same problem as core's `CL-CORE-11`.
- **What's covered:** `tsconfig.test.json:10` includes `src/**/*`, `tests/**/*.ts`, `vitest.config.ts`, `vitest.perf-report.config.mjs`. Because `src/**` is included, type errors in `src/` *are* caught. But the build target (`tsconfig.json`) is not re-validated; if test-only config relaxes anything (it doesn't here, since `tsconfig.test.json` extends `tsconfig.json`), the gap would matter.
- **Family-wide drift verdict (from core 04-best-practices.md):** core says "DRIFT — align core + projection to both". Confirmed in projection.
- **Recipe:** align with siblings (guard, cli, mcp all use both):
  ```json
  "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json"
  ```
  One-line family-normalization PR (per core action plan step 40).

#### Cleanup-M-PROJ-4. Local lint rule scope is narrower than the doctrine it claims

- **Source/evidence:**
  - `eslint.config.mjs:14-30` defines the `no-restricted-syntax` rule banning duplicate `isPlainObject` declarations.
  - The rule's selector at `:21-25` is `FunctionDeclaration[id.name="isPlainObject"]` + `VariableDeclarator[id.name="isPlainObject"]`. It catches `function isPlainObject(...) {}` and `const isPlainObject = ...`, but **not** `const x = function isPlainObject() {}`, **not** `class { isPlainObject() {} }`, **not** TypeScript `interface { isPlainObject(): boolean }` (the last would be a type, so probably fine).
  - The rule ignores `src/shared/plain-object.ts` (the canonical home) per `:16`.
- **Cleanup angle:** the rule is currently sufficient (only 1 canonical implementation), but the AST surface is narrow enough that a refactor introducing a class method or shorthand object property with that name would silently bypass it. Compare to the family-root `no-suppression-comments` rule in `eslint.config.mjs:1-44` which scans every comment.
- **Recipe (optional):** broaden to `Identifier[name="isPlainObject"]` with a `:not(ImportSpecifier):not(ImportSpecifier > *):not(MemberExpression > *)` exclusion — but only if the canonical-source pattern grows. Today's rule is fine; flag for future-proofing.

#### Cleanup-M-PROJ-5. The fixture file `tests/fixtures/fragments.ts` (42 KB) is the entire test-input surface in one file

- **Source/evidence:** `tests/fixtures/fragments.ts` is 42,863 bytes. By comparison, the entire `tests/fixtures/documentation-composition/` and `tests/fixtures/renderers/` subdirectories together are ~10 KB.
- **Why this is cleanup-relevant:** any test fixture change drops a diff into a 42 KB file; ownership is implicit ("whoever last edited it"). Phase 1 doesn't surface this because it's outside `src/`.
- **Recipe:** split by subdomain to mirror `src/fragments/` partition (pattern-relations, delivery-reporting, governance, execution-context, operational-insights, documentation-composition). 6 files of ~7 KB each. Mechanical split.

#### Cleanup-M-PROJ-6. `package.json` declares `"author": "Libar AI"` as a string but no `funding` or `keywords` (consistency with siblings)

- **Source/evidence:** `package.json:6` — author. All 5 publishable packages match. No `keywords` field anywhere; no `funding` field anywhere.
- **Verdict:** **Not a finding — siblings match.** Documenting as a family-wide normalization candidate only if a master-report sweep cares.

### Low (P3)

| ID | File:line | Issue |
|---|---|---|
| Cleanup-L-PROJ-1 | `.DS_Store` files | 4 stray `.DS_Store` files in the working tree (`/packages/architect-projection/.DS_Store`, `src/.DS_Store`, `tests/.DS_Store`, `node_modules/.DS_Store`). All gitignored. Local hygiene only. |
| Cleanup-L-PROJ-2 | `tests/fixtures/fragments.ts` | Single 42 KB fixture file (see Cleanup-M-PROJ-5). |
| Cleanup-L-PROJ-3 | `vitest.config.ts:1,12` | Uses `import path from 'path'` (legacy) + `__dirname` (legacy). Sibling files in the perf config use `node:path` + `import.meta.dirname`. Inconsistent. |
| Cleanup-L-PROJ-4 | `eslint.config.mjs:35-43` | Test-only override disables 6 `@typescript-eslint` rules. Reasonable, but the list grew over time and could be a single shared override imported from the root. |
| Cleanup-L-PROJ-5 | `package.json:65` | `pnpm test` command runs 4 sequential commands; if any fail mid-chain, the user sees only one failure. Common pattern in monorepos; not a defect. |
| Cleanup-L-PROJ-6 | `package.json` | No `keywords` field for npm discoverability (siblings match — family-wide). |
| Cleanup-L-PROJ-7 | `dist/` | Per `ls dist/`, the README and docs/ directory are not included (correct per `files: ["dist"]`). `npm pack --dry-run` confirms only `dist/` + `package.json` go out. No leakage. |

---

## 3. Configuration audit — projection vs family base

The family base (`tsconfig.architect-base.json` + `tsconfig.base.json` at repo root + repo-root `eslint.config.mjs`) sets the doctrine. Below: projection's specific configs vs that base.

### TypeScript

| Concern | `tsconfig.base.json` (family) | `tsconfig.architect-base.json` | `architect-projection/tsconfig.json` | `architect-projection/tsconfig.test.json` | Verdict |
|---|---|---|---|---|---|
| `strict` | `true` | (inherits) | (inherits) | (inherits) | Held. |
| `noUncheckedIndexedAccess` | `true` | (inherits) | (inherits) | (inherits) | Held. |
| `exactOptionalPropertyTypes` | `true` | (inherits) | (inherits) | (inherits) | Held. |
| `verbatimModuleSyntax` | `true` | (inherits) | (inherits) | (inherits) | Held. |
| `noPropertyAccessFromIndexSignature` | (off) | **`true` (architect-only)** | (inherits) | (inherits) | Held. |
| `declarationMap` / `sourceMap` | `true` / `true` | (inherits) | (inherits) | (inherits) | **DRIFT** — same family-wide problem as core CL-CORE-3 (50% of tarball is `.map` files: 290/580). Family-wide one-line fix. |
| `composite` | (off) | (off) | `true` | `true` (inherits) | Correct for project references. |
| `incremental` | (off) | (off) | `true` | (inherits) | Correct. |
| `tsBuildInfoFile` | (default) | (default) | `./tsconfig.tsbuildinfo` | `./tsconfig.test.tsbuildinfo` | Held — distinct names prevent collision. |
| `disableSourceOfProjectReferenceRedirect` | (off) | (off) | `true` | (inherits) | Held — required for `tsc -b --force`. |
| `types` | (default — auto) | (default — auto) | `["node"]` | `["node", "vitest/globals"]` | Held. |

### ESLint

| Concern | Family root config | Projection override | Verdict |
|---|---|---|---|
| `architect-local/no-suppression-comments` | Active on `packages/*/src/**/*.ts` excluding tests | (inherits) | Held. |
| `@typescript-eslint/no-unused-vars` with `^_` ignore | Active on `src/**/*.ts` | (inherits) | Held. |
| `no-restricted-syntax` for `isPlainObject` | Not defined upstream | **Active in projection only** (`eslint.config.mjs:14-30`) | Healthy local enforcement (see Cleanup-M-PROJ-4). |
| Four renderer boundary rules | **Defined in repo root for projection's `src/renderers/**`** | (inherits) | Held. |
| Project parser config | `tsconfig.test.json` referenced as parser project | (extends with tsconfig path resolution) | Held. |
| Test-file rule relaxations | Not defined upstream | **Active in projection only** (`eslint.config.mjs:33-43`) | Healthy; could be hoisted (Cleanup-L-PROJ-4). |

### `package.json` scripts vs siblings

| Setting | core | guard | cli | mcp | **projection** | Verdict |
|---|---|---|---|---|---|---|
| `prepack` location | top-level (broken) | scripts | scripts | scripts | **scripts** | Correct. |
| `prepack` command | `pnpm build` | `pnpm clean && pnpm build` | `pnpm clean && pnpm build` | `pnpm clean && pnpm build` | **`pnpm clean && pnpm build`** | Correct. |
| `lint` glob | `eslint src` (gap) | `eslint src tests` | `eslint src tests` | `eslint src tests` | **`eslint src tests`** | Correct. |
| `typecheck` scope | `tsconfig.test.json` only | both | both | `tsconfig.test.json` only | **`tsconfig.test.json` only** | **DRIFT** — Cleanup-M-PROJ-3. |
| `test` typecheck guard | (none) | `typecheck && vitest` | `build && vitest` | `typecheck && vitest` | **2 audits + `typecheck && vitest`** | Held (with audits added). |
| `eslint` as devDep | missing (root hoist) | yes | yes | yes | **yes** | Correct. |
| Test include pattern | `tests/steps/**` | `tests/features/**` | `tests/features/**` | `tests/features/**` | **`tests/features/**`** | Held — projection + 3 siblings on one convention; core is the family outlier. |
| `compare-baseline.mjs` in `test` chain | n/a | n/a | n/a | n/a | **not invoked** | **Cleanup-C-PROJ-1 (this report).** |

### Vitest

| Concern | Sibling pattern | Projection | Verdict |
|---|---|---|---|
| Config in TS | guard, cli, mcp use `.ts` | `vitest.config.ts` + `vitest.perf-report.config.mjs` | **Two configs** — Cleanup-H-PROJ-2 (deduplicate). |
| 30s timeout | guard, cli, mcp at 30s | 30s | Held. |
| `globals: true` | All siblings | Both projection configs | Held. |
| `node:` prefix on stdlib | guard, mcp consistent | `vitest.config.ts:1` uses `'path'` (legacy) | Inconsistent (Cleanup-L-PROJ-3). |

### Tarball composition (`npm pack --dry-run`)

- Total files: **582**
- Maps: **290** of 580 dist files (50.0%)
- `.d.ts`: 145
- `.js`: 145
- `package.json`: 1
- Packed size: 231.1 kB
- Unpacked size: 1.2 MB

**No scripts/, no docs/, no tests/, no .sisyphus/, no fixtures/** ship — clean inclusion list via `files: ["dist"]`.

Tarball reduction available via family-wide `sourceMap: false; declarationMap: false` per core CL-CORE-3: 580 → 290 files, projected ~600 kB unpacked.

---

## 4. Dependency audit

`package.json` declares:

| Kind | Name | Version | Imported in `src/`? | Imported in `tests/`? | Cross-package alignment | Verdict |
|---|---|---|---|---|---|---|
| dep | `@libar-dev/architect-core` | `workspace:*` | **Yes** (110 import sites in `src/`) | Yes (~20 sites) | All siblings depend on `workspace:*` | Correct. |
| dep | `zod` | `^4.1.11` | **Yes** (extensively) | Yes | All 5 packages aligned at `^4.1.11` | Correct. |
| devDep | `@amiceli/vitest-cucumber` | `^6.3.0` | No | **Yes** (in step files) | All 5 packages aligned | Correct. |
| devDep | `@types/node` | `^24.12.0` | No (src has no `node:` imports) | Yes (via `node:perf_hooks`, etc.) | All 5 packages aligned at `^24.12.0` | Correct. |
| devDep | `eslint` | `^9.17.0` | n/a | n/a | guard/cli/mcp/projection at `^9.17.0`; core **missing** (root hoist) | Correct here. |
| devDep | `typescript` | `^5.8.2` | n/a | n/a | All 5 packages aligned at `^5.8.2` | Correct. |
| devDep | `vitest` | `^4.1.4` | n/a | Yes (configs) | All 5 packages aligned at `^4.1.4` | Correct. |

**Findings:** **None.** Projection's dependency manifest is in perfect family alignment. No phantom deps in `src/` (would be devDeps leaked), no phantom devDeps (deps declared but unused). The `src/` tree has zero `node:`/stdlib imports — confirming the README's "no filesystem, no network" claim for the data layer.

**Notable absence:** projection does NOT bundle `glob` (core, guard need it for file discovery — projection is graph-consumer-only, no filesystem access). Confirms the intended architecture.

---

## 5. The audit scripts — what they actually check, and the gap that lets C-PROJ-2 slip

### `scripts/options-schema-barrel-audit.mjs` (128 LOC)

**What it does:**
1. Reads `src/projections/index.ts` + every `src/projections/<subdomain>/index.ts`.
2. Collects all exported identifiers matching `*OptionsSchema` (regexes at `:12-14`).
3. Asserts: every `*OptionsSchema` exported from any subdomain index is **also** re-exported from `src/projections/index.ts`.
4. Asserts: `src/index.ts` contains `export * from './projections/index.js';` (anchoring the projections aggregate to the root barrel).
5. Asserts: no `*OptionsSchema` is exported by the root projections barrel that doesn't trace to a subdomain.

**Strengths:**
- Pure regex over file text — fast, no AST dependency, fits the family's "mechanical doctrine guard" pattern.
- Closes the gap where a new `*OptionsSchema` could be defined in a subdomain but forgotten in the root barrel.
- Idempotent, runnable in `pnpm test`, exits non-zero on drift with a `formatFailure` summary.

**Gaps:**
1. **Schema-name-only.** Only `*OptionsSchema` exports are surveyed. The `parseAndProject*` entrypoints — which share the same trust-boundary discipline — are not.
2. **No body-shape check.** Even if a `parseAndProject*` export is found, the audit doesn't verify it goes through `parseAndProject(schema, project, name, defaults)` from `_shared/parse-and-project.internal.ts`.
3. **Does NOT catch C-PROJ-2** at `src/projections/pattern-relations/open-question-list.ts:38` (the outlier that calls `OptionsSchema.parse` directly). The script's regex doesn't look at function bodies; the outlier is invisible.

**Recipe (closes C-PROJ-2 mechanically, ~15 LOC):**

Add a second pass that scans each file in `src/projections/*/*.ts` (non-`.internal.ts`):

```js
const parseAndProjectExportPattern =
  /export\s+const\s+(parseAndProject[A-Za-z0-9_]+)\s*=\s*parseAndProject\s*\(/gu;

const parseAndProjectExportFunctionPattern =
  /export\s+function\s+(parseAndProject[A-Za-z0-9_]+)\s*\(/gu;
```

For every `export function parseAndProject*` declaration (the form the outlier uses), require either:
- the body to contain `parseAndProject(` (the shared helper call), OR
- emit a failure with the file:line.

Net delta: ~15 LOC inserted; one extra `auditParseAndProjectShape` function in the same file. Becomes part of `pnpm test:barrel-audit`. Phase 1's C-PROJ-2 recipe pairs with this.

### `scripts/jsdoc-boilerplate-audit.mjs` (77 LOC)

**What it does:**
1. Walks every `.ts` file in `src/` recursively.
2. Checks for the presence of 3 specific boilerplate phrases (`'As a typed contract'`, `'data shape consumed by projection or render layers'`, `'Private helpers used exclusively'`).
3. Fails the run if any source file contains any of these phrases.

**Strengths:**
- Mirrors the `DOC-H-3` pattern flagged in core (boilerplate JSDoc "When to Use" text that's wrong for the file).
- Already prevents 3 specific bad-JSDoc patterns from reentering the codebase.
- Fast, deterministic, exits non-zero on drift.

**Gaps:**
1. **Phrase-fixed.** Three phrases, hardcoded at `:8-12`. Any new boilerplate that emerges from a future AI-assisted PR won't be caught until someone adds it to the list.
2. **No `@architect-pattern` annotation completeness check.** The file does not assert that every public symbol carries an annotation, or that every file with `@architect-pattern` also has a behavioral test (the kind of thing the `core/raw/3A-test-coverage` agent surfaced).
3. **No "no copied-without-edit JSDoc" check.** Two files with identical 5+ line JSDoc blocks would pass the current audit. The "duplicate boilerplate" mechanism the audit is named after isn't directly enforced — only specific phrase matches.

**Recipe (optional, narrow scope):**
The audit is fit-for-purpose for its current claim ("flag known-bad phrases"). If the package wants to enforce "every annotated `@architect-pattern` file must have a When-to-Use that doesn't match the next file's When-to-Use", a second-level audit could read the JSDoc above each `@architect-pattern` and SHA-1 it, failing on any cross-file collision. Out of scope for this review.

### Does C-PROJ-2 fall into the audit's natural scope?

**Yes, unambiguously.** The barrel audit's stated purpose is "mechanical enforcement of public-surface completeness" (per Phase 1 Healthy table). The `parseAndProject*` entrypoint shape — same projection-name, same wrapper, same `BoundaryParseError` contract — is **exactly** the public-surface completeness invariant that the audit was built to enforce. The C-PROJ-2 outlier is the audit's missing case. Extension is ~15 LOC and lands C-PROJ-2's recipe by construction.

---

## 6. The perf-evidence file at `.sisyphus/evidence/` — what's emitted, and is it useful

### What gets written

`.sisyphus/evidence/task-3-business-rule-set-perf-report.json` (currently 12 KB on-disk, regenerated on every `pnpm test`):

- **Top-level metadata:** `generatedAt` ISO timestamp; `fixture` (36 patterns, 108 rules, 6 bounded contexts, 4 layers, 27 required coverage tags).
- **3 hard metric summaries:** `project`, `renderObject`, `renderPretty` — each `{avgMs, p50Ms, iterations}` over 40 iterations.
- **8 projection hot-path metrics:** `sessionContextBundle`, `scopeReadinessReport`, `documentationView`, `requirementDigestAllAreas`, `requirementDigestExecutable`, `patternSatisfiesTag`, `buildBoundedContext`, `graphBuild` — all `{avgMs, p50Ms, iterations}`.
- **3 markdown-bundle render summaries:** `patterns`, `decisions`, `requirements-executable`.
- **1 scalar:** `isBundleP50Micros`.
- **40 raw samples:** the per-iteration timings for the project/renderObject/renderPretty/isBundleMicros loop.

Total: 26 metric values that `compare-baseline.mjs` budgets against, plus 40 raw samples for post-hoc analysis.

### Comparison with the committed baseline

`tests/perf/baselines/business-rule-set.baseline.json` (generated 2026-05-17T10:25): same shape. Sample values: `project.avgMs = 0.544 ms`, `renderObject.avgMs = 0.480 ms`, `renderPretty.avgMs = 0.646 ms`, `isBundleP50Micros = 5.083 µs`.

The current evidence file (generated 2026-05-17T13:34, ~3 hours later in the same day) shows `project.avgMs = 2.05 ms` and `renderPretty.avgMs = 1.88 ms`. Looking at the raw samples: iterations 1, 18, 34, 36 show anomalously high values (10.5, 30.9, 8.3, 11.3 ms). Mean is dragged up by 4-5 outliers, p50 (0.577 ms) is in line with baseline (0.526 ms).

**Interpretation:**
- The report is **information-rich**: 26 budgetable metrics + 40 raw samples + fixture metadata, enough to do post-hoc analysis or replot a histogram.
- The report is **statistically fragile** by `avgMs`: 40 iterations is not enough samples to suppress GC pauses / event-loop dropouts (visible in the current report: iteration 18 is 50× the median).
- The comparator's `min(hard, baseline × 1.5)` rule on `avgMs` would currently **fail** this evidence file (`project.avgMs = 2.05 ms` > `hard 1.5 ms`). The fact that nothing fails in `pnpm test` is a direct consequence of Cleanup-C-PROJ-1: the comparator isn't run.

**Is the report useful or noise?**
- Useful: yes — to a human running the gate locally with a clear before/after profile. The raw samples enable distribution analysis.
- Noise risk: `avgMs` as the gate metric over 40 iterations is too sensitive to GC/JIT pauses. Switching budgets to `p50Ms` (already emitted) would harden the gate against false positives.
- Storage: `.sisyphus/evidence/` is a git-ignored or git-tracked directory for evidence artifacts; the file is intended-to-be-regenerated. The samples appearing in commits would noise-up `git log`. Confirm `.sisyphus/evidence/` is `.gitignore`-d (per the `.gitignore` review earlier: `dist/`, `coverage/`, `.generated-docs-tmp/`, `docs-live/` are listed; `.sisyphus/` is **not** explicitly ignored). Worth adding `.sisyphus/evidence/` to `.gitignore` so future evidence files don't sneak into commits.

**Recipe:**
1. Wire `compare-baseline.mjs` into `pnpm test` (Cleanup-C-PROJ-1 (a)).
2. Switch comparator's hard-budget field from `avgMs` to `p50Ms` for `project/renderObject/renderPretty` (already done for `isBundleP50Micros`). Avoids GC-pause false fails. ~3-line edit in `compare-baseline.mjs:13-17`.
3. Add `.sisyphus/evidence/` to root `.gitignore` so the evidence file is not version-controlled, only the baseline is.

---

## 7. Files that should not be in `dist/`

`npm pack --dry-run` confirms only `dist/**` ships. Within `dist/`, this is the audit:

| Path | Why considered | Verdict |
|---|---|---|
| `dist/**/*.map` (290 files) | Source maps inflate tarball 50%. Same family-wide issue as core CL-CORE-3. | **Disable family-wide** via one-line `tsconfig.base.json` edit. Projection inherits the fix. |
| `dist/**/*.d.ts.map` (subset of above) | Declaration maps generally unused by consumers. | **Disable family-wide.** |
| `dist/_internal/**` | 5 files under `dist/_internal/`; corresponds to `src/_internal/` (the directory `format-utils.ts`, `slug.ts`, etc. that L-PROJ-A-6 flagged for promotion). | **Keep** — these are imported transitively from the public barrels. But the path `_internal` is a public surface convention violation; renaming to `shared/` (L-PROJ-A-6) would clarify. |
| `dist/fragments/**/*.internal.d.ts` and `.js` | `.internal.ts` source files reach `dist` because TypeScript compiles all files in `tsconfig.json#include`. Per the renderer boundary lint rule, these are imports-banned from the renderer layer but still publicly resolvable. | **Keep, but document.** Phase 1 ADR-009 says "raw internal helpers hidden when validated entrypoint exists" is "Not held" (`L-PROJ-A-10`). The `.internal.ts → dist/.internal.js` chain materializes the gap. No quick fix; ADR clarification needed. |
| `dist/shared/plain-object.{js,d.ts,...}` | The canonical `isPlainObject`. Not re-exported from the root barrel — only the local-private helpers in `src/renderers/**` use it. | **Keep.** Public via subpath unintentionally, but practically harmless. |

**Things absent from `dist/` that could surprise (audited):**
- `scripts/options-schema-barrel-audit.mjs` and `scripts/jsdoc-boilerplate-audit.mjs` — **not in dist** (correct; these are workspace-only tools).
- `tests/perf/compare-baseline.mjs` — **not in dist** (correct; workspace-only).
- `tests/perf/baselines/business-rule-set.baseline.json` — **not in dist** (correct).
- `vitest.perf-report.config.mjs` — **not in dist** (correct).
- `docs/` — **not in dist** (correct).
- `README.md` — **not in dist** — actually, this **is a small surprise**. `package.json#files = ["dist"]` excludes `README.md`. npm tarballs by default *do* include the README when present. With `files: ["dist"]` only, README is excluded. Siblings (core, guard, cli, mcp) have the same pattern. **Verdict:** family-wide — README is published only via the GitHub repo, not the tarball. Could be a quiet docs-discoverability gap, but it's consistent across siblings.

---

## Cross-package implications (cleanup-lens)

1. **Family `sourceMap: false; declarationMap: false`** — core CL-CORE-3 is the canonical fix; projection inherits 50% tarball reduction.
2. **Family `typecheck` script normalization** — core CL-CORE-11 + Cleanup-M-PROJ-3 of this report — projection + core both need both project paths. One PR aligns 5 packages.
3. **`summarizeTaxonomyDigest` cleanup** (Cleanup-H-PROJ-1) affects `architect-cli` (`src/cli/commands/meta.ts:8,105` is a real consumer). If the helper moves to `projections/governance/`, CLI's import path changes. Coordinated PR.
4. **Wire the perf gate** (Cleanup-C-PROJ-1) — once `compare-baseline.mjs` runs in `pnpm test`, the family-wide CI absence (core CI-1) becomes the next bottleneck: a developer must remember to run `pnpm test` locally. Adding `.github/workflows/ci.yml` (core action plan step 38) makes the gate automatic family-wide. **Projection's perf gate is the single strongest CI candidate in the family** because the comparator + baseline already exist.
5. **`documentation-type-registry.ts` deletion comment** (Cleanup-H-PROJ-3 / H-PROJ-A-9) cross-references `architect-core/src/config/presentation-contracts.ts` (`ReferenceDocConfig`, etc., kept alive by the `'codec' + 'Options'` strip in core). Both are W-DOCS-1 deletion candidates. Family-wide synthesis should track them together.
6. **`tests/perf/baselines/`** — Phase 1 said "baselines aren't loaded — what's in there then?" The answer: `business-rule-set.baseline.json` IS the baseline, IS loaded by `compare-baseline.mjs`, and IS up-to-date (2026-05-17). The "aren't loaded" framing was over-broad; the gap is **wiring**, not **content**.

---

## Numbers

- **Critical (P0):** 1 (Cleanup-C-PROJ-1 — perf gate unwired).
- **High (P1):** 3 (triple barrel re-export, duplicate vitest config, documentation-type-registry proxy facade).
- **Medium (P2):** 6 (4 unique to this report + 2 already in Phase 1 confirmed from cleanup lens).
- **Low (P3):** 7 (mostly stylistic / discoverability).
- **Total Phase 1 findings overlap re-cited:** 4 (C-PROJ-2, C-PROJ-3, H-PROJ-A-3, H-PROJ-A-9, H-PROJ-A-10).
- **Net-new in this report:** Cleanup-C-PROJ-1, Cleanup-H-PROJ-2, Cleanup-M-PROJ-1, Cleanup-M-PROJ-3, Cleanup-M-PROJ-4, Cleanup-M-PROJ-5, plus 7 lows.
- **Dependency drift:** none.
- **Tarball-reduction opportunity (family-wide):** ~50% (290 map files out of 580).
- **Audit-script extension to close C-PROJ-2 mechanically:** ~15 LOC.
- **Doctrine breaches in src/:** zero (no `@ts-ignore`, no `eslint-disable`, no `TODO`/`FIXME`, no `void X;`, no `console.*`, no `as unknown as`, no `z.object`, no `.skip`/`.only`, no `from 'fs'` legacy).

## Overall verdict (cleanup lens)

Projection is **the cleanest publishable package in the family** by doctrine compliance: zero suppressions, zero deprecation residue, zero legacy idioms, zero phantom deps, two custom audits already self-enforcing public-surface invariants, four eslint boundary rules guarding the renderer firewall. The package's *idioms* are not just right — they're enforced by the package's own tooling.

The cleanup work that remains is **wiring the doctrine the package preaches to the automation that should enforce it**: hook `compare-baseline.mjs` into `pnpm test`, extend the barrel audit to cover `parseAndProject*` shape, dissolve the `summarizeTaxonomyDigest` triple re-export, deduplicate the perf vitest config, and either delete the `documentation-type-registry` Proxy facade or assume W-DOCS-1's deletion. None of these are doctrine violations; all of them are the gap between "the package promises X" and "the test suite enforces X". This is a different cleanup mode from core's "doctrine inconsistent on load-bearing surfaces" — and it's the easier mode to close.
