# `@libar-dev/architect` (Meta) — Consolidated Review Report

**Package:** `@libar-dev/architect@2.0.0-pre.1`
**Size:** 7 bin files (each is a 2-line shebang + `import` shim), 1 README, 1 `package.json`. **Zero source code.**
**Role:** Meta-package. Bin-only re-exports. Installs the full family in one dependency.
**Source:** Direct review (no agent needed — surface area too small).

## Executive Summary

The meta package is **the cleanest in the family by every measurable standard** — necessarily, because it has nearly no surface to be inconsistent on. **7 uniform 2-line bin shims, 1 well-written README that accurately documents what the meta does and explicitly directs JS API consumers to the split that owns the symbol, 5 workspace deps in fixed-group changesets lockstep, no TS source code, no tests, no build step.**

The findings are minor and almost entirely **inherited from family-wide issues**:

1. **`publishConfig.provenance: true`** declared but no workflow to issue the attestation (family-wide blocker, core CI-2).
2. **`.DS_Store` file in `packages/architect/`** — minor cleanup; add to gitignore.
3. **No `prepack` script** — but there's nothing to build (bin shims are runtime-resolved), so this is correct. **Verify** that the `cli` and `mcp` packages' bin subpath exports are stable contracts the meta can depend on.
4. **`publishConfig.provenance` activates** automatically when the family-wide publish workflow lands.

## Critical findings — **none**

## High findings

### H-META-1. `.DS_Store` checked in **[direct observation]**

`packages/architect/.DS_Store` is present. Add to `.gitignore` and remove from git tracking. Same low-impact cleanup as projection's `tests/.DS_Store`.

### H-META-2. Bin subpath contract dependency **[direct observation]**

All 6 cli-routed bins do `import '@libar-dev/architect-cli/bin/architect-XXX';` and the mcp bin does `import '@libar-dev/architect-mcp/bin/architect-mcp';`. This works because:

- `architect-cli/package.json#exports` exposes `./bin/architect` through `./bin/architect-validate` (verified per cli review).
- `architect-mcp/package.json#exports` exposes `./bin/architect-mcp`.

**Verification needed:** the meta's reliance on these subpath exports being stable is implicit. **Recipe:** add the meta to the workspace post-pack smoke test (proposed family-wide `pack-smoke.mjs` per guard's Cleanup-C-GUARD-3 + cli's CL-CLI-H-1) so the bin-import resolution is verified on every publish.

## Medium findings

### M-META-1. `publishConfig.provenance: true` declared but unimplemented (inherited)

Same as core's CI-2, guard's L-PROJ-CI-1, cli's family-wide implication. Activates automatically when the proposed `.github/workflows/publish.yml` lands family-wide.

### M-META-2. No README anchor for v1 monolith consumers expecting `import { ... } from '@libar-dev/architect'` to still work

`README.md:19-29` correctly documents that the meta has no JS API and points to MIGRATION.md. **The current text is accurate.** However:

- A v1 consumer who upgrades blindly will get a clean module-resolution error (good).
- The error message they see is from Node's module resolver, not a curated message from the meta.

**Optional enhancement (low priority):** the meta could declare a `./` export that returns an `Error` at import time with the migration guidance:

```ts
// Not recommended unless v1 → v2 friction proves real
exports: {
  ".": "./error.js"  // exports a thrown error explaining the migration
}
```

This is **not** a normal recommendation — usually module-resolution errors are good enough — but if any reports of v1 consumers tripping land, this is the recipe.

## Low findings

### L-META-1. Lockstep coordination

All 5 split packages are workspace-pinned (`workspace:*`). Per family changesets `fixed` group config, version bumps to any split bump the meta. **Verification needed:** the `fixed` group includes the meta and all 5 splits. If the meta is missing from the `fixed` group, the meta's `dependencies` will pin to an older version after a release. (Per family scope and core's Phase 4B audit, this is configured correctly; reconfirmed here.)

### L-META-2. Family-wide CL-CORE-3 sourcemap fix

Meta ships **only** 7 bin files (each 2 lines) plus README + `package.json`. **No `dist/`**, so no maps. CL-CORE-3 doesn't apply to the meta — the meta is the smallest possible package shape.

## Configuration audit vs family

| Setting                      | Meta                                                | Verdict                                                    |
| ---------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| Has `src/` directory         | **No** — bin-only meta                              | Correct by design.                                         |
| Has `dist/` directory        | **No** — bin shims are direct `.js` files in `bin/` | Correct by design.                                         |
| `prepack`                    | **Absent**                                          | Correct — no build step.                                   |
| `package.json#exports`       | Only `./package.json`                               | Correct — no JS API surface intentional per README.        |
| `package.json#bin`           | 7 entries                                           | Matches README's "all 7 CLI bins" claim.                   |
| `files` allowlist            | `["bin", "README.md"]`                              | Tight, correct.                                            |
| `engines.node`               | `>=20.0.0`                                          | Aligned with family.                                       |
| `publishConfig.access`       | `public`                                            | Aligned.                                                   |
| `publishConfig.provenance`   | `true`                                              | Aligned; unimplemented family-wide.                        |
| Workspace dependencies       | 5 splits at `workspace:*`                           | Correct; changesets fixed-group handles lockstep.          |
| Tests                        | **None**                                            | Correct — nothing to test that isn't tested in the splits. |
| `.gitignore` for `.DS_Store` | Present at the package level? **Verify**            | Add to repo-level `.gitignore` if missing.                 |

## What's healthy (preserve)

1. **README is accurate and concise** — correctly describes the meta's role, lists the 5 splits + 7 bins, points JS API consumers to the splits, and provides v1→v2 migration guidance.
2. **All 7 bin shims are uniform 2-line files** — no drift, no platform-specific code.
3. **Tight `files` allowlist** — no extraneous content in the tarball.
4. **No JS API surface declared in `exports`** — only `./package.json`. Prevents v1 consumers from accidentally getting nonworking imports.
5. **Workspace `*` pin** — relies on changesets fixed-group for lockstep version bumps. Correct shape.
6. **The `architect-mcp` bin shim correctly routes to `architect-mcp` package** (not via cli) — recognizes that mcp is a separate publication unit.

## Cross-package implications for master report

1. **The meta package is the smallest package shape possible** — bin shims + README + manifest. No build, no test, no source. Any structural finding here is necessarily about the family it composes, not about the meta itself.
2. **The meta's bin shims depend on bin subpath exports being stable** in `architect-cli` and `architect-mcp`. A workspace-level pack-smoke test (proposed family-wide) catches accidental breakage.
3. **`publishConfig.provenance: true` consistently across the family** — once the publish workflow lands, all 6 packages benefit simultaneously.
4. **The README is exemplary documentation for what a bin-only meta should claim**. If guard's missing README (DOC-C-GUARD-2) or cli's missing README (DOC-CLI-C-1) need templates, projection's README is the long-form template; this meta's README is the short-form bin-only-package template.

## Overall verdict

`@libar-dev/architect` is **release-ready as a meta-package** subject to the family-wide cleanup landing. The only direct cleanup is `.DS_Store` removal. The meta's identity and contract are well-documented, and the bin shims are uniform.

This package's review essentially restates: **the meta is structurally fine; it inherits the family's shape; ship it when the family ships.**
