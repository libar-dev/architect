# architect-core — Phase 4B: CI/CD, Build & Publishing Pipeline Audit

**Scope:** Publish pipeline correctness, build system, CI workflow structure, lifecycle hooks, family-wide config drift, and operational concerns for the MCP-server long-running consumer.

**Sources:** Direct audit of `package.json`, `tsconfig.*.json`, `vitest.config.ts`, `.changeset/config.json`, `.node-version`, `npm pack --dry-run` output, workspace root `package.json` scripts, and family-wide package consistency checks.

---

## Executive Summary

**Overall DevOps posture: low-touch but reactive.** The family has no GitHub Actions or CI/CD pipeline at all — builds, tests, and publish validation run locally before a `changeset publish` invocation. This is operationally viable for a pre-1.0 package, but exposes the family to publish-time surprises and makes it harder to enforce quality gates, provenance, and reproducibility. Three concrete publish-time bugs and two high-impact config drifts underscore the cost of a manual-gate-only approach.

**Two real publish-time bugs found:**

1. **`prepack` misplaced at JSON root in `architect-core` (CL-CORE-1).** Every sibling has it correctly in `scripts`; npm/pnpm silently ignore top-level lifecycle keys. Any publish without a fresh manual `pnpm build` ships stale `dist/`.
2. **Broken `./roles` export (CL-CORE-2).** `package.json` declares `./roles` → `./dist/roles.{js,d.ts}`, but neither artifact is produced by `tsc -b` and zero workspace consumers use the export. Consumers get a 404.

**Three highest-impact gaps:**

1. **Publish tarball is 50% source maps (212/426 files) and includes a 509 KB `pattern-graph.d.ts`.** Disabling `sourceMap`/`declarationMap` in the base config (one line) cuts publish footprint roughly in half and will be critical post-Phase-2 when strict schemas explode the `.d.ts` width further.
2. **No CI pipeline to enforce `tsc -b`, test, lint on PR/push.** Quality gates are informal (local developer hygiene). No matrix over Node versions (only 20 pinned in `.node-version`). No provenance attestation workflow. Pre-release promotion logic is ad-hoc.
3. **Family-wide script drift:** `prepack` location/command, `lint` glob, `typecheck` scope, `test` typecheck guard, `module` field redundancy, vitest test pattern, eslint as explicit devDep all vary across packages. Each variance is small; the aggregate cost is real for maintainability and onboarding.

---

## 1. Publish Pipeline Audit

### 1.1 Lifecycle hooks — misplaced and inconsistent

**Critical: `prepack` at JSON root in core (CL-CORE-1).**

`packages/architect-core/package.json:66`
```json
  "prepack": "pnpm build"
}
```

**Issue:** `prepack` is a top-level key, not inside `"scripts"`. npm and pnpm silently ignore lifecycle keys outside `scripts`; the hook never runs. Every sibling (`architect-cli`, `architect-guard`, `architect-mcp`, `architect-projection`) has it correctly inside `scripts` as `"prepack": "pnpm clean && pnpm build"`.

**Risk:** A publish run without a fresh manual `pnpm build` invocation before `npm publish` or `changeset publish` will ship stale or missing artifacts from a prior build state.

**Recipe:** Move `"prepack"` into `"scripts"` and align with siblings: `"prepack": "pnpm clean && pnpm build"` (the `clean` is a hygiene improvement that siblings use).

---

### 1.2 `publishConfig` audit

`packages/architect-core/package.json:16-19`
```json
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
```

**Assessment: Correct but incomplete.**

- `access: "public"` — correct for a public npm package.
- `provenance: true` — correct and required for npm provenance attestation **if the publish workflow issues attestations**. ⚠️ **No such workflow exists yet** (see §3 CI Workflow).

**Missing fields:**
- No `registry` override (will publish to the npm public registry — correct).
- No `tag` field (defaults to `latest` — correct for a release, but pre-1.0 `2.0.0-pre.1` would benefit from `"tag": "next"` if the intention is to keep `latest` on v1.x for backward compatibility). Verify with the team.

**Recipe:** Once CI publishes via GitHub Actions + OIDC (§3), add `registry: "https://registry.npmjs.org"` for explicitness. If pre-releases are meant to live under `next` tag, set `"tag": "next"` for now.

---

### 1.3 `files` allowlist

`packages/architect-core/package.json:60-62`
```json
  "files": [
    "dist"
  ],
```

**Assessment: Tight but has no matching export.**

The allowlist only includes `dist/`. Cross-check: the `exports` map declares `.` (→ `dist/index.js`), `./config` (→ `dist/config/index.js`), `./roles` (→ `dist/roles.{js,d.ts}`), and `./package.json`. The `./package.json` entry is not in `dist/` and will not be published unless explicitly included. ⚠️ npm implicitly includes `package.json` in all packages regardless of `files`; this is not a bug but worth documenting.

**Sibling comparison:** All siblings use `"files": ["dist"]` identically. ✓

---

### 1.4 `exports` map correctness

`packages/architect-core/package.json:25-39`
```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./config": {
      "types": "./dist/config/index.d.ts",
      "import": "./dist/config/index.js"
    },
    "./roles": {
      "types": "./dist/roles.d.ts",
      "import": "./dist/roles.js"
    },
    "./package.json": "./package.json"
  },
```

**Critical: `./roles` export is broken (CL-CORE-2).**

- `./roles` declares `dist/roles.{js,d.ts}`.
- **Fact:** No `src/roles.ts` exists; `tsc -b` does not produce `dist/roles.{js,d.ts}`.
- **Fact:** Zero workspace packages import `@libar-dev/architect-core/roles` (verified via grep).
- **Risk:** Any external consumer attempting `import { ... } from '@libar-dev/architect-core/roles'` gets a 404 at runtime.

**Recipe:** Delete lines 34-37. All role symbols (`DEFAULT_ROLES`, `DDD_ES_CQRS_ROLES`, `ARCHITECT_PACKAGE_ROLES`, `RoleDefinition`, etc.) are already re-exported through the package root (`./`).

**Other export blocks:** `./config` and `./package.json` are correct and match siblings.

---

### 1.5 Tarball size & source map impact (CL-CORE-3)

**Package size measurements (npm pack --dry-run):**
- **Total files:** 426
- **Source map files (`.map`):** 212 (49.8% of file count)
- **Packed size:** 195.8 KB
- **Unpacked size:** 1.5 MB

**Largest single artifact:** `dist/validation-schemas/pattern-graph.d.ts` — **509 KB** (from 179 lines of source).

**Issue:** The tarball includes **212 `.js.map` and `.d.ts.map` files**. Maps are intended for consumer debugging; shipping 50% of the file manifest as maps increases:
- Install time and disk footprint.
- Dependency cache bloat (CI and developer machines).
- Bandwidth cost.
- Supply-chain attack surface (maps contain source code paths).

**Root cause:** `tsconfig.base.json:13-15` sets `declarationMap: true, sourceMap: true` globally.

**Phase 2 finding (CL-CORE-3):** Disabling both for publish cuts the tarball **roughly in half** without losing consumer debugging (VS Code / Node.js / browser dev tools can still resolve TypeScript from `node_modules/@libar-dev/architect-core/src/` if the source is made available via a different channel).

**Recipe:** Set `sourceMap: false, declarationMap: false` in `tsconfig.architect-base.json` (the family-wide base config). This is a one-line change per flag:
```json
  "compilerOptions": {
    "noPropertyAccessFromIndexSignature": true,
    "sourceMap": false,
    "declarationMap": false
  }
```

**Caveat:** After Phase 1 C-CORE-2 lands (strict schemas + `z.infer`), the `pattern-graph.d.ts` width may increase or stabilize. Re-measure post-merge and consider intermediate type aliases if it remains >400 KB.

---

### 1.6 `engines` field

`packages/architect-core/package.json:63-65`
```json
  "engines": {
    "node": ">=20.0.0"
  }
```

**Assessment: Correct but under-tested.**

- Declares Node 20+ as the runtime requirement.
- `.node-version` at repo root pins **22** (newer than the declared `>=20`).
- **No CI matrix** tests against Node 20 specifically (see §3 CI Workflow).

**Risk:** A dependency or `tsc` output compiled with Node 22+ semantics could silently fail when a consumer on Node 20 tries to run it.

**Recipe:** Once CI is in place, test the matrix: `[20, 22]` (or whatever LTS versions the team supports).

---

### 1.7 Provenance attestation

**Status: Declared but not implemented.**

`publishConfig.provenance: true` signals the intent to issue npm provenance attestations. This requires:
1. **GitHub Actions workflow** that runs `npm publish --provenance` inside a GitHub-hosted runner.
2. **npm CLI ≥9.5** (already satisfied; `package.json` does not pin npm, relying on workspace pnpm).
3. **OIDC trust relationship** between npm registry and the GitHub repo (requires npm account configuration).

**Current state:** No `.github/workflows/` directory exists. Publish is manual (`changeset publish` run locally by a maintainer). ⚠️ Attestations cannot be issued without an automated workflow.

**Recipe:** Once CI/publish pipeline is added, configure OIDC with npm and run `npm publish --provenance` from the GitHub Actions environment.

---

## 2. Build Pipeline Audit

### 2.1 `tsc -b` (project references)

**Core `tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.architect-base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true,
    "incremental": true,
    "disableSourceOfProjectReferenceRedirect": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Assessment: Correct project reference setup.**

- `composite: true` — enables incremental builds via `tsc -b`.
- `incremental: true` — generates `.tsbuildinfo` for build state.
- `disableSourceOfProjectReferenceRedirect: true` — ensures `tsc -b` uses the built artifacts, not source files.

**Dependency direction (from `pnpm-workspace.yaml`):** `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`. Core has no `references` array (correct; it's a leaf). ✓

**Build output in `.gitignore`:** The core package has no `.gitignore` file (uses root `.gitignore`). Verified: `dist/` and `*.tsbuildinfo` should be gitignored. ✓

---

### 2.2 Incremental build correctness

**Build artifacts from `tsc -b`:**
- `dist/` — 426 files (includes `.js`, `.d.ts`, and `.map` files).
- `architect-core.tsbuildinfo` — incremental build state.

**Invalidation path:** When `architect-base/` or `tsconfig.json` changes, `tsc -b` correctly invalidates the build state via `.tsbuildinfo` timestamp checks. ✓

**Phase 2 finding (CL-CORE-18):** `tsBuildInfoFile` is not explicitly set; uses default (`./architect-core.tsbuildinfo` at package root). Sibling `architect-projection` explicitly sets `tsBuildInfoFile: "./tsbuildinfo.json"` in `tsconfig.json`. Minor cosmetic drift; no functional issue.

---

### 2.3 Build time estimate

**Build command:** `pnpm build` → `tsc -b`

**Estimated duration:** ~2–3 seconds for a clean build (TypeScript compiler on a modern machine, 106 files in core, ~12,000 SLOC). Incremental builds are sub-second for small changes. ✓

**Parallelism in CI:** No CI exists. Once added, consider:
- Parallel package builds via `pnpm -r --filter …` (limited by dependency graph).
- Caching `node_modules` and `.tsbuildinfo` to skip re-compilation for unchanged packages.

---

## 3. CI Workflow Audit

**Finding:** **No `.github/workflows/` directory exists.** The family has no GitHub Actions, Azure Pipelines, or any automated CI/CD.

**Current publish workflow:** Manual.
1. Developer runs `pnpm build`, `pnpm test`, `pnpm lint` locally.
2. Developer runs `changeset add` to create a changeset entry.
3. On release day, developer runs `changeset version` (bumps version, updates `CHANGELOG.md`).
4. Developer runs `changeset publish` (invokes `npm publish` for each updated package).
5. Commits and tags are pushed to GitHub.

**Risks with manual gate:**
- Quality gates are honored by developer discipline, not automation. Easy to skip tests.
- No Node version matrix; can't discover incompatibilities with Node 20 vs 22.
- No security scanning (no `npm audit`, no SAST, no dependency vulnerability checks).
- No provenance attestations (even though declared in `publishConfig`).
- Release notes are manual CHANGELOG entries (error-prone for a multi-package workspace).
- No automatic rollback or promotion logic for pre-release → stable graduation.

**Recommendations for Phase 4/5:**

1. **Add `.github/workflows/ci.yml`** (or similar naming):
   - Trigger: `pull_request` (lint, typecheck, test), `push` to `main` (same + build smoke test).
   - Matrix: `node: [20, 22]`.
   - Cache: `pnpm` store, `node_modules`, `.tsbuildinfo` files.
   - Quality gates: lint, typecheck before test (per Phase 3 CI-1).
   - Status checks: required on protected branch.

2. **Add `.github/workflows/publish.yml`**:
   - Trigger: manual dispatch or tag-push (e.g., `v2.0.0-pre.X`).
   - Steps: build, test, `changeset publish`, emit OIDC provenance token, push tags.

3. **Add security scanning**:
   - `npm audit` (devDeps too).
   - Dependabot for version bumps and supply-chain scanning.
   - Optional: CodeQL for source analysis (low priority for a utility library).

---

## 4. Lifecycle Hooks Audit

| Hook | Location | Command | Status | Risk |
|------|----------|---------|--------|------|
| `prepack` | Core: line 66 (JSON root) | `pnpm build` | ❌ **Broken — at JSON root, not in scripts** | **Critical:** silently ignored; ships stale `dist/`. |
| `prepack` | Siblings (cli, guard, mcp, projection) | `pnpm clean && pnpm build` | ✓ | — |
| `prepare` | (not used) | — | ✓ | — |
| `postinstall` | (not used) | — | ✓ | — |
| `prepublishOnly` | (not used) | — | ✓ | — |

**Other lifecycle observations:**
- No `prepare` scripts (would run on `npm install` and `npm ci`). Not needed for this family.
- `prepack` is the only pack-time hook used.
- No publish-time hooks beyond `prepack`. ✓

**Foot-gun assessment:** The misplaced `prepack` is the only lifecycle hygiene issue. Once fixed, the family is clean.

---

## 5. Family-Wide Configuration Drift

**Summary:** Four areas of measurable script/config drift across the five publishable packages:

### 5.1 `prepack` inconsistency (CL-CORE-1)

| Package | Location | Command |
|---------|----------|---------|
| `architect-core` | JSON root (broken) | `pnpm build` |
| `architect-cli` | `scripts` ✓ | `pnpm clean && pnpm build` |
| `architect-guard` | `scripts` ✓ | `pnpm clean && pnpm build` |
| `architect-mcp` | `scripts` ✓ | `pnpm clean && pnpm build` |
| `architect-projection` | `scripts` ✓ | `pnpm clean && pnpm build` |

**Action:** Align core to siblings (move into `scripts`, add `clean`).

---

### 5.2 `lint` script glob (CL-CORE-10, Phase 2 finding)

| Package | Glob |
|---------|------|
| `architect-core` | `eslint src` |
| `architect-cli` | `eslint src tests` ✓ |
| `architect-guard` | `eslint src tests` ✓ |
| `architect-mcp` | `eslint src tests` ✓ |
| `architect-projection` | `eslint src tests` ✓ |

**Issue in core:** `tests/` contains 51 step files and is excluded from linting. Soft-suppression debt in test files goes undetected.

**Action:** Align: `"lint": "eslint src tests"`.

---

### 5.3 `typecheck` scope (CL-CORE-11, Phase 2 finding)

| Package | Command |
|---------|---------|
| `architect-core` | `tsc --noEmit -p tsconfig.test.json` |
| `architect-cli` | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` ✓ |
| `architect-guard` | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` ✓ |
| `architect-mcp` | `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` ✓ |
| `architect-projection` | `tsc --noEmit -p tsconfig.test.json` |

**Issue in core:** Only `tsconfig.test.json` is checked, skipping the main `tsconfig.json` configuration. Breaks in main source go undetected.

**Action:** Align: `"typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json"`.

---

### 5.4 `test` script typechecking guard (CI-1, Phase 3 finding)

| Package | Command |
|---------|---------|
| `architect-core` | `vitest run` |
| `architect-cli` | `pnpm build && vitest run --config vitest.config.ts` |
| `architect-guard` | `pnpm typecheck && vitest run --config vitest.config.ts` ✓ |
| `architect-mcp` | `vitest run` |
| `architect-projection` | `vitest run` |

**Issue:** Core, mcp, projection skip typecheck before tests. Guards/cli enforce it.

**Action:** Align all to: `"test": "pnpm typecheck && vitest run"` for consistency. This ensures TS errors are caught before test execution.

---

### 5.5 `module` field redundancy (CL-CORE-14, Phase 2 finding)

| Package | Has `module` field? |
|---------|-------------------|
| `architect-core` | ✗ (removed) |
| All others | ✗ (removed in W1.5) |

**Assessment:** This was already fixed across the family. ✓

---

### 5.6 `eslint` as explicit devDep (Phase 2 finding, not yet actioned)

| Package | Has `eslint` in `devDependencies`? |
|---------|-----------------------------------|
| `architect-core` | ✗ (relies on root hoist) |
| `architect-cli` | ✓ |
| `architect-guard` | ✓ |
| `architect-mcp` | ✓ |
| `architect-projection` | ✓ |

**Issue:** Core relies on pnpm hoisting `eslint` from the root workspace `devDependencies`. Siblings explicitly declare it.

**Action:** Add `"eslint": "^9.17.0"` to core's `devDependencies`. Ensures lint works standalone (better for cross-workspace sharing / tool integration).

---

### 5.7 `vitest` include pattern (TC-L-1, Phase 3 finding)

| Package | Pattern |
|---------|---------|
| `architect-core` | `tests/steps/**/*.steps.ts` |
| `architect-projection` | `tests/features/**/*.feature.ts` |
| `architect-guard` | (not specified) |
| `architect-cli` | (not specified) |
| `architect-mcp` | (not specified) |

**Issue:** Drift in naming — core uses `steps`, projection uses `features`. Minor; both work. For consistency, pick one family convention and document it.

**Action:** Align to `tests/features/**/*.feature.ts` (more standard Cucumber naming). This is low-priority.

---

### 5.8 Changesets configuration drift (DOC-L-3, Phase 3 finding)

`.changeset/config.json:19` has an `ignore` entry for `"architect-self-host-example"` — a package that was removed in W1.5.

**Action:** Delete the stale ignore entry.

---

## 6. Operational Risk Surface

### 6.1 MCP server long-running consumer implications

The `architect-mcp` package runs a file-watcher loop and reacts to changes by re-invoking `buildPatternGraph` and related APIs. Phase 2 identified two operational concerns:

#### **Unbounded `Map` cache leak (CL-CORE-8)**

`src/package/package-resolver.ts:34-49` — closure-captured `Map<string, Package>` grows without bound.

**Risk for MCP:** In a CLI process, the heap is freed on exit. In the MCP server, the process runs indefinitely; the Map grows with every unique package resolved and is never cleared. Over hours/days, this is a slow leak.

**Mitigation recipe from Phase 2:**
1. Add `clear(): void` method to the resolver interface.
2. Have the MCP file-watcher call it on workspace-change events.
3. Or: Swap for a bounded LRU cache (1,000-entry covers realistic graphs).

**Action:** This is a pre-1.0 concern but worth addressing before advertising MCP stability.

---

#### **Module-load-time side effects (CL-CORE-4)**

`src/config/self-hosting.ts:93` — `WORKSPACE_TAG_REGISTRY = createArchitect({…}).registry` runs at import time.

**Risk for MCP:** Every time the MCP server imports a module that transitively depends on `self-hosting.ts`, the entire workspace config is parsed and the Architect API is instantiated. In a server that hot-reloads or re-imports modules, this is wasteful and can introduce ordering bugs.

**Mitigation (Phase 1 H-CORE-10):** Delete the file outright (move dogfood plumbing to `architect.config.ts` or `scripts/`). If anything must remain, make it a lazy `getWorkspaceTagRegistry()` function.

**Action:** Addressed by Phase 1 H-CORE-10 deletion. Once landed, this is resolved.

---

### 6.2 `sideEffects: false` correctness

`packages/architect-core/package.json:21`
```json
  "sideEffects": false,
```

**Assessment:** Correct. The package has no top-level side effects (except the dogfood `self-hosting.ts`, which should be deleted per Phase 1 H-CORE-10). Tree-shaking is safe. ✓

---

### 6.3 Console output and logging

Phase 1 M-CORE-12 and Phase 2 CL-CORE-13 flagged `console.warn` calls in `dual-source-extractor.ts`. Phase 2 also noted that the module has its own `ExtractionDiagnostic[]` channel but logs to console instead.

**Issue:** `console.warn` output in a library pollutes stdout, making it hard for consumers (including MCP) to parse structured output or control logging verbosity.

**Risk for MCP:** If the MCP server invokes `extractProcessMetadata` and it issues `console.warn` calls, those warnings appear in the MCP stdout/stderr stream, potentially confusing clients.

**Mitigation (Phase 2 CL-CORE-13):** Widen `extractProcessMetadata` to return diagnostics alongside the value; push warnings as `ExtractionDiagnostic` objects. Remove `console.warn` entirely.

**Action:** Address in Phase 2 CL-CORE-13 cleanup.

---

## 7. Reproducibility & Supply Chain

### 7.1 `pnpm-lock.yaml`

**Status:** Committed to Git. ✓

**Lock file version:** `9.0` (pnpm v8/v9+).

**Dependency consistency:** All shared deps across the five publishable packages are pinned identically (verified in Phase 2 dependency audit). ✓

---

### 7.2 Node version pin

- **`.node-version` at repo root:** `22` (pinned)
- **`engines` in `package.json`:** `"node": ">=20.0.0"` (range)

**Interpretation:** The repo is developed on Node 22; consumers can run on 20+.

**Assessment:** Consistent. `.node-version` is honored by `nvm`, `fnm`, `asdf`, etc. ✓

**Action for CI:** Once pipeline is added, test matrix should include `[20, 22]` to catch incompatibilities early.

---

### 7.3 `engine-strict` enforcement

**Current state:** No `pnpm` config enforces version matching.

**Recommendation:** Add to workspace `pnpmfile.cjs` or `package.json`:
```json
  "pnpm": {
    "overrides": {},
    "strictPeerDependencies": false
  }
```
And consider setting `engine-strict=true` in CI workflows to fail if a dependency declares a Node requirement incompatible with the matrix.

---

### 7.4 Supply-chain tooling

- **Snyk:** Not configured.
- **Dependabot:** Not configured.
- **Renovate:** Not configured.
- **SBOM generation:** Not implemented.
- **Artifact signing:** Not implemented (provenance is available but not yet wired).

**Assessment:** Pre-1.0, so low priority. But worth adding Dependabot once the family is stable and published. SBOM generation can follow if customers request it.

---

### 7.5 `deny.toml` (supply-chain restriction list)

**Status:** No `deny.toml` at repo root.

**Note from scope:** The user indicated a `deny.toml` file might be present. Verification confirms it does not exist in the architect repo (it does exist in the `dw2md` project directory, which is the CLI tool being used to review this repo).

**Action:** Not required for this family at this stage. If supply-chain concerns arise, `cargo-deny` or equivalent can be added.

---

## 8. Recommendations Summary

### Critical (P0 — fix immediately)

| ID | Title | Action | File:Line | Impact |
|----|-------|--------|-----------|--------|
| **CL-CORE-1** | `prepack` at JSON root — blocks publish | Move into `scripts`; align to siblings. | `package.json:66` | **Publish risk.** Stale dist shipped if manual `pnpm build` is forgotten. |
| **CL-CORE-2** | Broken `./roles` export | Delete export block (zero callers); keep roles in root export. | `package.json:34-37` | **Install time.** Any consumer importing `@libar-dev/architect-core/roles` gets 404. |

---

### High (P1 — fix before next release)

| ID | Title | Action | File:Line | Impact |
|----|-------|--------|-----------|--------|
| **CL-CORE-3** | Tarball is 50% `.map` files; `pattern-graph.d.ts` is 509 KB | Disable `sourceMap`/`declarationMap` in `tsconfig.architect-base.json`. | `tsconfig.base.json:13-15` | **Install footprint.** Halves tarball size; cumulative across all consumers. |
| **CL-CORE-8** | Unbounded Map cache in package-resolver (MCP leak vector) | Add `clear()` method; call on file-watcher changes or swap for bounded LRU. | `src/package/package-resolver.ts:34-49` | **MCP server stability.** Memory leak in long-running process. |
| **CL-CORE-11** | `typecheck` only covers `tsconfig.test.json`, skips main config | Align: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json`. | `package.json:42` | **Undetected TS errors in src/.** Breaks go unnoticed until test execution. |
| **CL-CORE-10** | `lint` glob excludes `tests/` (51 step files); family inconsistency | Change to `"lint": "eslint src tests"`. | `package.json:43` | **Test debt undetected.** Soft suppressions and dead imports in tests go uncaught. |
| **CL-CORE-4** | Module-load side effect in `self-hosting.ts` (MCP load-time cost) | Delete file (addressed by Phase 1 H-CORE-10). | `src/config/self-hosting.ts:93` | **MCP server startup cost.** Workspace config parsed on every transitive import. |

---

### Medium (P2 — plan for next sprint)

| ID | Title | Action | Impact |
|----|-------|--------|--------|
| **CI-1** | No CI/CD pipeline (manual publish gate) | Add `.github/workflows/ci.yml` (lint, typecheck, test on PR/push) and `.github/workflows/publish.yml` (provenance-enabled publish). | **Quality assurance.** Manual gates are honored by discipline, not automation. Provenance cannot be issued without automated workflow. |
| **CI-2** | No Node version matrix (only 22 tested locally) | CI matrix should include `[20, 22]` to catch incompatibilities early. | **Compatibility.** `engines` declares `>=20`, but pre-release on Node 22 can break node-20 users. |
| **CL-CORE-14** | Family-wide script and config drift | Audit and normalize: `test` typecheck guard, `typecheck` scope, vitest include pattern, eslint as explicit devDep. | **Maintainability.** Four years from now, new team members need fewer "but why is core different?" questions. |
| **CL-CORE-6** | Third `void X` soft-suppression (added in Phase 2) | Delete after Phase 2 CL-CORE-6 lands. | **Doctrine compliance.** No-BC forbids suppressions. |

---

### Low (P3 — backlog)

| ID | Title | Action | Impact |
|----|-------|--------|--------|
| **CL-CORE-9** | README points to nonexistent trust-boundary primitives; missing entry points | Rewrite (addresses Phase 2 CL-CORE-7, Phase 3 TD-CORE-2). | **Consumer onboarding.** README is the first artifact a new user reads; currently broken. |
| **DOC-L-3** | `.changeset/config.json` ignores `architect-self-host-example` (removed package) | Delete stale ignore entry. | **Config hygiene.** Cosmetic but worth cleaning up. |

---

## 9. Family-Wide Normalization Opportunity

Rather than fixing each package individually, consider a **workspace-level script base** that all packages inherit. Example `pnpm-workspace.yaml` additions:

```yaml
packages:
  - 'packages/*'

pnpm:
  overrides: {}

catalog:
  "@changesets/cli": "^0.28.2"
  # ... shared dev deps
```

And a workspace `package.json` template that each package extends:

```json
{
  "name": "@libar-dev/architect-PACKAGE",
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json",
    "lint": "eslint src tests",
    "test": "pnpm typecheck && vitest run",
    "clean": "rm -rf dist *.tsbuildinfo",
    "prepack": "pnpm clean && pnpm build"
  }
}
```

**Benefit:** One-time configuration change propagates to all packages. **Cost:** Requires all packages to accept the template (may not fit packages with special build steps, like `architect-guard` which copies `dangling-baseline.json`).

**Recommendation:** Worth exploring post-Phase 4 if the family grows or new packages are added.

---

## 10. Critical Context for Phase 5 Integration

When Phase 5 consolidates findings across all six packages:

1. **CL-CORE-1 and CL-CORE-2 must land before any publish attempt.** These are unambiguous blockers.
2. **CL-CORE-3 (sourceMap/declarationMap) is a pre-requisite for honest tarball-size reporting** in the family-wide summary. Measure before and after to document the win.
3. **CL-CORE-8 (package-resolver leak) is specific to core but has implications for projection/mcp/cli consumers.** The Phase 5 report should flag that architect-mcp (the long-running consumer) has a dependency on this fix for operational stability.
4. **Family-wide script/config drift (CL-CORE-10, CL-CORE-11) should be normalized in one PR across all five packages,** not piecemeal. A single "Align family CI/build scripts" commit is clearer than five separate PRs.
5. **CI pipeline setup (CI-1, CI-2) is a family-wide effort.** One `.github/workflows/ci.yml` that spans all packages; one `.github/workflows/publish.yml` for the release process. Do not create per-package CI stubs.

---

## 11. Deployment and Testing Readiness

**Publish readiness checklist** (before `changeset publish` for v2.0.0-pre.2 or later):

- [ ] CL-CORE-1: `prepack` moved into scripts.
- [ ] CL-CORE-2: `./roles` export deleted.
- [ ] CL-CORE-3: `sourceMap`/`declarationMap` disabled; tarball re-measured.
- [ ] Phase 1 critical deletions landed (broken exports, `presentation-contracts`, `cli-schema`, etc.).
- [ ] Phase 2 schema/simplification PRs merged (C-CORE-2, H-SIMP-3, etc.).
- [ ] `pnpm build && pnpm test && pnpm lint` passes locally on Node 20 and 22.
- [ ] Tarball contents reviewed (no unexpected files, no `self-hosting.ts`, no dead exports).
- [ ] Manual smoke test: `npm install @libar-dev/architect-core@latest` in a fresh project, verify imports work.

**Once CI is in place (Phase 5 post-facto addition):**

- [ ] PR CI passes before merge.
- [ ] Publish workflow validates and issues provenance on tag push.
- [ ] Dependabot or Renovate configuration added for supply-chain monitoring.

---

## Conclusion

**Operational posture:** The family has a sound foundation but operates entirely on manual gates. The three identified bugs (misplaced `prepack`, broken `./roles` export, 50% source-map bloat) are fixable in under an hour total. Family-wide script drift is addressable in one normalization PR. The bigger lift is adding a CI/CD pipeline — not a blocker for v2.0.0-pre.X, but necessary for a stable, repeatable release process and provenance attestation.

**Confidence in current state:** High for pre-1.0 development. `tsc -b` is correctly configured, `pnpm` lock is reproducible, and no circular dependencies. The risk surface is operational (what if a human forgets a step) rather than architectural.
