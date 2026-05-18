# architect-core — Phase 2B: Codebase Cleanup

Companion to Phase 1 (`01-quality-architecture.md`). Findings here are
cleanup-angle additions — broken hooks, dead surface, residue, config drift,
publish-bundle waste — phrased as **delete-and-migrate recipes**, never
deprecation cycles (per repo No-BC doctrine).

Cross-references to Phase 1 use the original IDs (`C-CORE-*`, `H-CORE-*`,
`M-CORE-*`, `L-CORE-*`) and only add detail Phase 1 didn't carry.

## Executive Summary

The package is publish-broken in two small but load-bearing ways that Phase 1
flagged once each but didn't link to other failures of the same kind:

1. **`prepack` is in the wrong JSON scope** — `package.json` declares `"prepack"`
   as a top-level key (line 66) instead of inside `"scripts"`. npm/pnpm will not
   execute it, so a publish that doesn't first run `pnpm build` (or runs against
   an older `dist/`) will ship stale artifacts. Every sibling package
   (`architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`)
   has it correctly inside `"scripts"`. This is a one-character class of bug, a
   trivial fix, and silently undermines release confidence until tested.
2. **`./roles` subpath in `exports` resolves to a file that doesn't exist** —
   Phase 1 C-CORE-1 already calls this. The cleanup angle: there are no
   workspace callers of `@libar-dev/architect-core/roles` (`grep` confirms
   zero), so the right action is **delete the `./roles` block**, not invent a
   barrel for it. Same audit shows zero callers of any non-root subpath in the
   workspace **except** `./config`, which `scripts/lint-patterns.ts` uses; the
   `./config` export should stay. Everything else routes through the package
   root.

Beyond those, the headline cleanup gains are:

3. **Map files balloon the published tarball.** 212 of the 426 files in the
   `npm pack` output are `.map` files (`.js.map` + `.d.ts.map`). Combined with
   the 509 KB `dist/validation-schemas/pattern-graph.d.ts` (10,438 lines — a
   TS-inferred-types explosion from the 179-line schema source), the tarball
   ships ~1.5 MB unpacked for a library most consumers won't debug locally.
   Phase 1 didn't measure publish weight; the cleanup recipe (turn off
   `declarationMap`/`sourceMap` in the published `tsconfig.json`) costs nothing
   and roughly halves the file count.
4. **Dead exports surface through the public barrel.** Beyond Phase 1's
   `presentation-contracts.ts`, `cli-schema.ts`, and `feature.ts` BC aliases,
   this audit found another seven exported symbols with zero workspace
   consumers: `parseMarkdownToBlocks`, `formatUserZodError`, `FEATURE_LAYERS`,
   `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`,
   `isFullyEditable`, `isScopeLocked`, `createFileLoader`, `formatCodecError`.
   Each is delete-and-forget.
5. **README references a file that doesn't exist** —
   `packages/architect-core/README.md:14` points consumers to
   `src/zod-primitives.ts` as the "canonical shared Zod primitives" location;
   no such file exists. Either create it (consolidating the Zod helpers
   currently scattered across `argv-hygiene.ts` + the validation-schemas/
   barrel) or fix the README. Comment rot in the only consumer-facing doc the
   package ships.

## Findings

### Critical

#### CL-CORE-1. `prepack` is a top-level key, not a script — hook silently doesn't run

**File:** `packages/architect-core/package.json:66`
**Evidence:** `"prepack": "pnpm build"` is at JSON root, not inside `"scripts"`.
Compare:

- `architect-projection/package.json` — `"prepack": "pnpm clean && pnpm build"` inside `"scripts"`.
- `architect-guard/package.json` — same.
- `architect-cli/package.json` — same.
- `architect-mcp/package.json` — same.

npm and pnpm look for lifecycle hooks under the `scripts` field. A top-level
`"prepack"` is silently ignored. The result: `npm pack` / `pnpm publish` does
**not** run `tsc -b` first. Any release done without a fresh manual `pnpm build`
ships whatever `dist/` happens to be on disk, possibly stale.

**Recipe:** move the line into `"scripts"` and align with the sibling form
(`"prepack": "pnpm clean && pnpm build"`). Cleaning before building is what
every other package does and prevents stale `.js`/`.d.ts` from a prior schema
shape leaking into the tarball.

#### CL-CORE-2. `./roles` subpath has zero workspace consumers — delete the export, don't author a barrel

**Files:**
- `packages/architect-core/package.json:34-37` (the export declaration).
- `dist/` (confirmed: no `roles.{js,d.ts}` artifact produced by `tsc -b`).

Phase 1 C-CORE-1 framed this as "pick one shape and ship it." This audit adds
the consumption data: `grep -rn "from '@libar-dev/architect-core/roles'"`
across the entire workspace and `.pr-coordination/` returns **zero hits**. The
`./roles` subpath is exclusively documentation/intention. The "create
`src/roles.ts`" branch of the fix would manufacture a barrel nobody asked for.

**Recipe:** delete lines 34-37 of `package.json`. Drop `./roles` entirely. The
roles symbols (`DEFAULT_ROLES`, `DDD_ES_CQRS_ROLES`, `ARCHITECT_PACKAGE_ROLES`,
`RoleDefinition`, `buildRegisteredRoleValues`) are all already re-exported
through the package root, which IS the consumer entry point everyone uses.

---

### High

#### CL-CORE-3. Published bundle ships `.map` files and a 509 KB `.d.ts`

**Files:**
- `packages/architect-core/tsconfig.json` (extends `tsconfig.architect-base.json` → `tsconfig.base.json`).
- `tsconfig.base.json:13-15` — `"declarationMap": true, "sourceMap": true`.
- `dist/validation-schemas/pattern-graph.d.ts` — 508,940 bytes, 10,438 lines (from a 179-line `.ts` source).
- `npm pack --dry-run` output for `@libar-dev/architect-core@2.0.0-pre.1`:
  - 426 total files, 1.5 MB unpacked, 195.8 KB packed.
  - 212 of 426 files are `.map` (50% by count).

`sourceMap` and `declarationMap` are useful in a local development workflow
where the build is consumed via workspace symlinks. In a published package,
they ship to every consumer's `node_modules`. The 50/50 split between code and
source-map metadata is the cost of those flags being inherited from
`tsconfig.base.json` without an override at the `architect-base` or
package-leaf layer. Sibling packages all share this; `architect-projection`
ships 582 files in a 1.2 MB unpacked tarball with the same pattern.

The `pattern-graph.d.ts` size is a separate beast: it's the cost of TS
inferring deeply-nested types from Zod schemas with many `.optional()` /
`.default()` chains. Once C-CORE-2 lands (`z.strictObject` + `z.infer`
everywhere), the inferred shapes won't shrink unless the surface itself does.

**Recipe (two-part):**

1. **Stop shipping maps to npm.** Either (a) set `sourceMap: false,
   declarationMap: false` in `tsconfig.architect-base.json` and accept slightly
   harder local debugging, or (b) keep them in dev and have `prepack` re-run
   the build with `--sourceMap false --declarationMap false`. The family
   choice should be made once at the base config. Option (a) is the simpler
   call.
2. **Audit the pattern-graph.d.ts inflation.** When C-CORE-2 converts every
   schema to `z.strictObject` and replaces hand-written interfaces with
   `z.infer`, run `npm pack --dry-run` and check whether the `.d.ts` shrinks.
   If it doesn't, the next step is reducing schema width (e.g., extracting
   `RelationshipEntry` shapes into intermediate `type RE = ...`).

This recommendation also benefits `architect-projection`'s CI perf gate
indirectly — its workspace install pulls less metadata.

#### CL-CORE-4. Module-load-time side effects in a `sideEffects: false` package

**Files:**
- `package.json:21` — `"sideEffects": false`.
- `src/config/self-hosting.ts:7` — computes `workspaceRoot` via
  `path.dirname(fileURLToPath(import.meta.url))` at module load.
- `src/config/self-hosting.ts:93` — `WORKSPACE_TAG_REGISTRY = createArchitect({…}).registry`
  invoked at module load (not lazy).
- `src/scanner/gherkin-ast-parser.ts:49-52` — `DEFAULT_BUILDERS` IIFE at module
  load (lighter, but still load-time work).

`"sideEffects": false` is a contract with bundlers (esbuild, webpack, rollup,
vite) that any import from this package can be tree-shaken if its exports
aren't used. Eager module-load work doesn't break the bundler — TypeScript
ESM treats side-effect-free declarations as values — but it does mean every
process that even *imports the barrel* (and thus drags
`config/self-hosting.ts` transitively) pays for `createArchitect` building a
tag registry, whether or not it uses `WORKSPACE_TAG_REGISTRY`.

Phase 1 H-CORE-10 already flagged `self-hosting.ts` as dogfood plumbing in a
published package. The cleanup angle: even if we keep self-hosting where it
is, **module-load `createArchitect` is wrong**.

**Recipe:**

1. Delete `src/config/self-hosting.ts` and the barrel re-exports (per
   H-CORE-10). Move the eight `ARCHITECT_PACKAGE_ROLES` definitions to
   `architect.config.ts` (which is where every consumer already imports them
   from, per `architect.config.ts:13`); same for `PACKAGE_SELF_HOSTING_SOURCES`
   (only `architect.config.ts` and `scripts/workspace-smoke.ts` use it).
2. If anything must stay in the package, make `WORKSPACE_TAG_REGISTRY` a
   lazy `getWorkspaceTagRegistry()` function and let the test/script call it
   explicitly. No top-level `createArchitect`.

#### CL-CORE-5. Dead exports through the public barrel (10 additional symbols beyond Phase 1)

Phase 1 covered:
- `presentation-contracts.ts` types (H-CORE-4)
- `cli-schema.ts` types (H-CORE-5)
- `feature.ts` BC aliases (H-CORE-12)

This audit grepped each export in the public barrel for non-self,
non-barrel-re-export callers across the workspace. Additional zero-caller
exports:

| # | Symbol | File | Notes |
|---|--------|------|-------|
| 1 | `parseMarkdownToBlocks` | `src/utils/markdown-parser.ts:84` | 216-line markdown→`SectionBlock[]` parser. Zero callers anywhere. The whole file is dead. |
| 2 | `formatUserZodError` | `src/utils/session-helpers.ts:22` | One-line `.trim()` wrapper around `formatZodError`. Zero callers. |
| 3 | `FEATURE_LAYERS` | `src/extractor/layer-inference.ts:14` | The exported array constant; only `FeatureLayer` type is referenced (1 site, via index re-export). |
| 4 | `validateStatus` | `src/validation/fsm/validator.ts:60` | Zero callers across all packages. |
| 5 | `validateCompletionMetadata` | `src/validation/fsm/validator.ts:121` | Zero callers across all packages. |
| 6 | `validatePatternStatus` | `src/validation/fsm/validator.ts:146` | Zero callers across all packages. |
| 7 | `isFullyEditable` | `src/validation/fsm/states.ts:33` | Zero callers across all packages. |
| 8 | `isScopeLocked` | `src/validation/fsm/states.ts:37` | Zero callers across all packages. |
| 9 | `createFileLoader` | `src/validation-schemas/codec-utils.ts:148` | Zero non-test callers; tested but not consumed in product. |
| 10 | `formatCodecError` | `src/validation-schemas/codec-utils.ts:171` | Zero non-test callers. |

**Recipe:**
- **#1**: delete `src/utils/markdown-parser.ts` and its barrel entry
  (`utils/index.ts:10`, `src/index.ts` via `export * from './utils/index.js'`).
- **#2**: delete the function in `session-helpers.ts`; remove the export at
  `utils/index.ts:25`.
- **#3**: delete the `FEATURE_LAYERS` constant; keep the `FeatureLayer` type
  alone in the file (used internally by `gherkin-extractor.ts:308`).
- **#4–#6**: delete the three exports from `validator.ts` and lines 26–29 of
  `validation/fsm/index.ts`. The dispatcher-shaped functions (one calls the
  others) are an over-engineered surface nobody uses.
- **#7–#8**: delete from `states.ts:33-37` and lines 6–7 of
  `validation/fsm/index.ts`. `getProtectionLevel` already conveys the same
  three-way decision.
- **#9–#10**: delete from `codec-utils.ts`; tests on them go too.

After this sweep, the public barrel shrinks by about 15 names without any
visible behavior change. That alone is a Phase 1 H-CORE-1 win (barrel
curation).

#### CL-CORE-6. New `void X` soft-suppression Phase 1 missed: `void metadata.status`

**File:** `src/extractor/gherkin-extractor.ts:604`.

Phase 1 M-CORE-2 listed `void extractionWarnings` and `void inferMaturity(status)`
in `doc-extractor.ts`. This audit found a third instance in `gherkin-extractor.ts:604`,
right before the `ExtractedPatternSchema.safeParse` call. It serves no purpose
— `metadata.status` is already consumed several lines above. It's residue
from a refactor.

**Recipe:** delete the line. While there, also drop `void
inferMaturity(status)` at `doc-extractor.ts:252` — that one calls a function
purely to throw away its return value, which means the function is being
called for side effects that don't exist (it's pure) or for type-narrowing
side effects that should be expressed as a guard. Either way: delete.

The doctrinal rule (`architect-local/no-suppression-comments`) catches
comment-shaped suppressions, not `void X` expressions. Worth a CI-side
addendum if the team wants to enforce: a `no-restricted-syntax` ESLint rule
targeting `UnaryExpression[operator="void"]` in `src/**/*.ts`.

#### CL-CORE-7. Stale README pointer to non-existent `src/zod-primitives.ts`

**File:** `packages/architect-core/README.md:14`.

The only consumer-facing doc the package ships says:

> - `src/zod-primitives.ts` — canonical shared Zod primitives.

There is no such file. `find` and `grep` both confirm zero artifacts. The
"shared Zod primitives" actually live in `src/utils/argv-hygiene.ts`
(`SafeStringSchema`, `NonEmptySafeStringSchema`).

**Recipe:** either rename the README bullet to point to `src/utils/argv-hygiene.ts`,
or create `src/zod-primitives.ts` as the named home and move the schemas
there. The first is one-line; the second is the right architectural call if
the schemas are going to grow (and they likely will once C-CORE-2 hits and
`z.strictObject` becomes ubiquitous).

#### CL-CORE-8. Unbounded `Map` cache in long-lived resolver — leak vector

**File:** `src/package/package-resolver.ts:34-49`.

`createPackageResolver` returns a closure that captures `const cache = new
Map<string, Package>()` and inserts on every miss without bound. In the CLI
this is fine: process exits. In `architect-mcp` and any future server context
(file watcher → re-resolve on save → grow the map forever), it's a slow leak
tied to source-file fan-out.

This isn't a Phase 1 finding; it's adjacent to H-CORE-9 (the `package/`
directory + projection error split) but a different vector.

**Recipe:** swap the unbounded `Map` for an LRU (a 1,000-entry bounded LRU
keyed by source path covers any realistic graph), OR — since the resolver is
constructed per-build and patterns rarely exceed a few thousand — accept that
behavior in CLI but **clear the cache** in any long-running consumer. The
cleanest fix: expose `clear(): void` on the resolver type and have the MCP
file-watcher invalidate on workspace changes.

---

### Medium

#### CL-CORE-9. README references "zod-primitives.ts" + the package's "boundary validation" docs claim that schemas are consolidated when they aren't

`README.md:11-18` claims:

> - `src/zod-primitives.ts` — canonical shared Zod primitives.
> - `src/utils/errors.ts` — `formatZodError` and `parseOrThrow` for trust-boundary parsing.
> - `src/utils/session-helpers.ts` — shared session enums and user-facing Zod formatting helpers.
> - `src/utils/argv-hygiene.ts` — null-byte checks and safe CLI/MCP string schemas.

There are actually four locations for "trust-boundary validation primitives"
in `src/`: `utils/errors.ts`, `utils/argv-hygiene.ts`, `utils/session-helpers.ts`,
and `validation/boundary.ts` (`parseAtBoundary` + `BoundaryParseError`). The
README mentions three of those and an imaginary fifth. Phase 1 H-CORE-3
already noted `parseAtBoundary` is core's own definition but core never uses
it. This is the documentation-side mirror of the same disorganization.

**Recipe:** when CL-CORE-7 is fixed, also add `src/validation/boundary.ts` to
the bullet list, and consider merging `argv-hygiene.ts`'s two Zod schemas
(`SafeStringSchema`, `NonEmptySafeStringSchema`) into `validation/boundary.ts`
so there's exactly one home.

#### CL-CORE-10. `lint` script doesn't lint tests; siblings do

**File:** `package.json:43`.

- `architect-core`: `"lint": "eslint src"` — only `src/`.
- `architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`:
  `"lint": "eslint src tests"` — `src/` + `tests/`.

`tests/` in `architect-core` is 51 step files (~10k+ LOC). Either the team
considers the test-folder lint redundant for core (suspicious — it's the
biggest test surface in the workspace), or this is just drift. Adding
`tests` to the lint glob took five characters and would surface
soft-suppression and dead-import issues in the BDD steps.

**Recipe:** change to `"lint": "eslint src tests"`.

#### CL-CORE-11. `typecheck` only covers `tsconfig.test.json`, missing build typecheck

**File:** `package.json:42`.

- `architect-core`: `"typecheck": "tsc --noEmit -p tsconfig.test.json"`.
- `architect-guard` / `architect-cli`: `"typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json"`.
- `architect-projection`, `architect-mcp`: only `tsconfig.test.json` (same as core).

The `tsconfig.test.json` does extend `tsconfig.json`, so technically the
production source files are typechecked — but they're typechecked in test-mode
config (which adds `vitest/globals` types, `tests/` to includes). The build
config typecheck is structurally different. For the foundation package it's
worth running both.

**Recipe:** align with the architect-guard/architect-cli form:
`"typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json"`.

#### CL-CORE-12. Eager top-level IIFE in scanner — `DEFAULT_BUILDERS` runs at every import

**File:** `src/scanner/gherkin-ast-parser.ts:49-52`.

```ts
const DEFAULT_BUILDERS = (() => {
  const registry = createDefaultTagRegistry();
  return createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
})();
```

Lighter than `self-hosting.ts` (CL-CORE-4) but the same anti-pattern: a
package-private const that runs `createDefaultTagRegistry()` and
`createRegexBuilders()` at module load. The IIFE only runs once per process,
so the cost is amortized, but if `createDefaultTagRegistry()` ever throws on
malformed data (it parses an env-ish input chain) the entire scanner import
goes to the floor on first reference.

**Recipe:** convert to a lazy memo:

```ts
let _defaultBuilders: RegexBuilders | undefined;
function defaultBuilders(): RegexBuilders {
  if (_defaultBuilders === undefined) {
    const registry = createDefaultTagRegistry();
    _defaultBuilders = createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
  }
  return _defaultBuilders;
}
```

Same cost when actually needed; zero cost when scanner is imported for types only.

#### CL-CORE-13. `console.warn` in `dual-source-extractor.ts` (×2) — Phase 1 M-CORE-12 generalizes here

**File:** `src/extractor/dual-source-extractor.ts:94`, `:178`.

Phase 1 M-CORE-12 documented this. The cleanup-recipe angle: both call sites
have the proper diagnostic channel **already in scope** —
`extractProcessMetadata` returns `null`/`ProcessMetadata`, `extractDeliverables`
returns `{ deliverables, diagnostics }`. Both `console.warn` sites are
emitting the kind of diagnostic the rest of the function builds via
`createDiagnostic`. They should be `diagnostics.push(createDiagnostic(...))`
calls. The only obstacle for `:94` is that `extractProcessMetadata` returns
`ProcessMetadata | null` instead of a `Result`-shaped value carrying
diagnostics; fix that signature too.

**Recipe:** change `extractProcessMetadata` to return `{ value: ProcessMetadata | null;
diagnostics: ExtractionDiagnostic[] }`. Push the validation errors as
diagnostics. Same pattern for the deliverables sweep at `:178`. Delete both
`console.warn` calls. This is the **only** remaining `console.*` in `src/`
once these go.

#### CL-CORE-14. The `module` field duplicates `main` — drop it

**File:** `package.json:22-23`:
```
"main": "dist/index.js",
"module": "dist/index.js",
```

Same value. In a `"type": "module"` package, `main` already points to the ESM
entry. The `module` field is a legacy convention from before ESM was
standardized; modern bundlers prefer `exports`. Same redundancy exists across
every sibling, so this is family-wide if anyone cares to sweep.

**Recipe:** delete the `"module"` line. `exports[".]` and `main` are sufficient.
Modify the same line in `architect-projection`, `architect-guard`,
`architect-cli`, `architect-mcp`.

#### CL-CORE-15. `defaults.ts` exports `DEFAULT_PRESENTATION_OUTPUT_DIRECTORY` but Phase 1 deletes presentation surface

**File:** `src/config/defaults.ts` — exports
`DEFAULT_PRESENTATION_OUTPUT_DIRECTORY` (re-exported through `src/index.ts:8`).

Once H-CORE-4 lands and `presentation-contracts.ts` is deleted, the
"presentation" concept goes with it. `DEFAULT_PRESENTATION_OUTPUT_DIRECTORY`
is residue from the same surface and has no callers in `architect-core/src/`.
Grep across the workspace shows zero non-self references except the barrel
re-export.

**Recipe:** include this in the H-CORE-4 deletion sweep. Drop the constant from
`defaults.ts` and the barrel re-export at `src/index.ts:8`.

---

### Low

#### CL-CORE-16. Fuzzy-match helpers exist in two places (core + projection)

**Files:**
- `src/utils/fuzzy-match.ts:10` — `levenshteinDistance`, `fuzzyMatchPatterns`, `findBestMatch`.
- `architect-projection/src/projections/_shared/pattern-helpers.internal.ts:432-484` — `findBestMatch` + `levenshteinDistance` duplicated locally.

Phase 1 didn't span packages. The duplicated functions are byte-identical and
the projection-side copy is just because the import was inconvenient.
Cross-package, not core-internal, but the cleanup-recipe owner is core.

**Recipe:** delete the projection-side `findBestMatch` and
`levenshteinDistance`. Replace with a single `import { findBestMatch,
levenshteinDistance } from '@libar-dev/architect-core'`. (Same shape as the
existing imports from line 6 of that file.)

#### CL-CORE-17. `extractFirstSentenceRaw` is duplicated in projection too

**Files:**
- `src/utils/session-helpers.ts:26` — defined here.
- `architect-projection/src/projections/_shared/pattern-helpers.internal.ts:274` — duplicated.

Same shape as CL-CORE-16. Projection has a local `extractFirstSentenceRaw`
and also imports the same name from core — meaning there are two
`extractFirstSentenceRaw` symbols in projection's module, and the
import-shadowing rules will resolve to one or the other depending on the call
site.

**Recipe:** delete the projection-side `extractFirstSentenceRaw` (line 274 in
that file). Keep the import from core. Verify no behavioral drift between the
two copies before deleting.

#### CL-CORE-18. README documents 4 trust-boundary primitives, code has 5

See CL-CORE-9. The fifth is `parseAtBoundary` / `BoundaryParseError` in
`validation/boundary.ts`. Low because the README is partially stale, not
load-bearing.

#### CL-CORE-19. `prepack` (when fixed) should match sibling `pnpm clean && pnpm build` form

If CL-CORE-1 is fixed by literally moving the line into `scripts`, the result
is `"prepack": "pnpm build"` — without the `pnpm clean` prefix the siblings
use. Without `clean`, stale type artifacts from a prior build (with a
different schema shape) survive in `dist/`, especially the source-map files.

**Recipe:** when fixing CL-CORE-1, write `"prepack": "pnpm clean && pnpm build"`.

#### CL-CORE-20. `tsconfig.tsbuildinfo` checked-in artifact

**File:** `packages/architect-core/tsconfig.tsbuildinfo` exists on disk and is
git-ignored (`.gitignore` has `*.tsbuildinfo`). Not a finding per se — just
note that the projection-side `tsconfig.json` explicitly sets
`tsBuildInfoFile: "./tsconfig.tsbuildinfo"` (line 7 of
`architect-projection/tsconfig.json`) while core inherits the default. The
inconsistency is cosmetic.

**Recipe:** add the same explicit `tsBuildInfoFile` to core for parity, OR
remove it from projection for parity. Either direction works.

---

## Configuration audit

Comparing the four config files (`package.json`, `tsconfig.json`,
`tsconfig.test.json`, `eslint.config.mjs`, `vitest.config.ts`) against the
family bases and the four sibling packages.

| Setting | architect-core | architect-projection | architect-guard | architect-cli | architect-mcp | Verdict |
|--|--|--|--|--|--|--|
| `package.json:prepack` location | top-level (broken — CL-CORE-1) | `scripts` | `scripts` | `scripts` | `scripts` | **DRIFT — fix core** |
| `prepack` command | `pnpm build` (no clean) | `pnpm clean && pnpm build` | `pnpm clean && pnpm build` | `pnpm clean && pnpm build` | `pnpm clean && pnpm build` | **DRIFT — align core** |
| `scripts.lint` | `eslint src` | `eslint src tests` | `eslint src tests` | `eslint src tests` | `eslint src tests` | **DRIFT — add `tests`** |
| `scripts.typecheck` | only `tsconfig.test.json` | only `tsconfig.test.json` | both | both | only `tsconfig.test.json` | Mixed — core matches projection/mcp |
| `scripts.test` shape | `vitest run` | `pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts` | `pnpm typecheck && vitest run --config vitest.config.ts` | `pnpm build && vitest run --config vitest.config.ts` | `pnpm typecheck && vitest run --config vitest.config.ts` | Core lacks typecheck-before-test guard — siblings have it |
| `package.json:files` | `["dist"]` | `["dist"]` | `["dist"]` | `["bin","dist","runtime-bridge.js"]` | `["bin","dist","runtime-bridge.js"]` | OK |
| `package.json:exports` keys | `.` + `./config` + `./roles` + `./package.json` | `.` + 7 subpaths + `./package.json` | `.` + `./package.json` | `.` + 6 bin-subpaths + `./package.json` | `.` + `./bin/architect-mcp` + `./package.json` | **`./roles` broken — CL-CORE-2** |
| `package.json:sideEffects` | `false` | `false` | `false` | `false` | `false` | OK; but inconsistent with CL-CORE-4 |
| `main` + `module` | both `dist/index.js` (redundant `module` — CL-CORE-14) | same | same | same | same | Family-wide cosmetic |
| `engines.node` | `>=20.0.0` | `>=20.0.0` | `>=20.0.0` | `>=20.0.0` | `>=20.0.0` | OK |
| `tsconfig.json:tsBuildInfoFile` | (default) | explicit `"./tsconfig.tsbuildinfo"` | (default) | (default) | (default) | Cosmetic drift (CL-CORE-20) |
| `tsconfig.json:types` | (default) | `["node"]` | (default) | (default) | (default) | Projection explicit — others rely on `tsconfig.architect-base.json` inheritance which doesn't pin `@types/node`. Worth confirming `noImplicitAny` errors don't sneak in. |
| `tsconfig.json:references` | none (leaf) | refs to core | refs to core | refs to core, projection, guard | refs to core, projection | Correct dependency graph |
| `tsconfig.test.json:include` | `src/**/*`, `tests/**/*.ts`, `vitest.config.ts` | same | same | same | same | OK |
| `tsconfig.test.json:tsBuildInfoFile` | (default) | `"./tsconfig.test.tsbuildinfo"` | (default) | (default) | (default) | Cosmetic |
| `tsconfig.test.json:composite` override | `false` | (inherits `true`) | `false` | `false` | `false` | Mixed |
| `eslint.config.mjs` | extends root, adds parser project + test relaxations | extends root, adds same + `arch-projection:shared-plain-object` rule | (uncited — pattern same) | (uncited — pattern same) | (uncited — pattern same) | OK |
| `vitest.config.ts:include` | `tests/steps/**/*.steps.ts` | `tests/features/**/*.steps.ts` | (similar) | (similar) | (similar) | **DRIFT — core uses `steps/` glob, projection uses `features/`**; tests live in `tests/steps/` in core. Investigate whether projection's `features/` glob is a different convention or unintended drift. |
| `vitest.config.ts:coverage` | not configured | not configured | not configured | not configured | not configured | OK across family — coverage tooling isn't wired into CI |
| Repo-root `tsconfig.eslint.json` | exists, referenced by family eslint config | same | same | same | same | OK |
| Repo-root `deny.toml` | recently added (in git status) | n/a | n/a | n/a | n/a | Note: not in committed tree yet |

**Intentional vs unintentional drift:**
- `architect-core` lacking `tests` from its `lint` script and `pnpm clean &&
  pnpm build` from `prepack` — **unintentional** (no doctrine reason, all
  siblings have it).
- `architect-core` lacking explicit `"types": ["node"]` — **probably
  unintentional**; projection's explicit declaration suggests the family was
  drifting toward explicit type packages.
- `tsconfig.test.json:composite: false` everywhere except projection —
  **intentional** for projection (it has its own perf-report vitest config that
  needs cross-file references).
- vitest `tests/steps/**/*.steps.ts` vs `tests/features/**/*.steps.ts` —
  **needs decision**: core puts step files in `tests/steps/`, projection in
  `tests/features/`. Either pattern is valid but the family should pick one.

---

## Dependency audit

Architect-core's declared dependencies, cross-referenced against
`architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`,
and `architect` meta-package.

| Dep | Version (core) | Used in `src/`? | Shared with siblings? | Risk note |
|-----|---|---|---|---|
| `@cucumber/gherkin` | `^29.0.0` | yes — `scanner/gherkin-ast-parser.ts` | core only | Healthy. Active package. |
| `@cucumber/messages` | `^25.0.1` | yes — `scanner/gherkin-ast-parser.ts:18` | core only | Healthy. Companion to `@cucumber/gherkin`. |
| `@typescript-eslint/typescript-estree` | `^8.18.0` | yes — `scanner/ast-parser.ts:18`, `extractor/shape-extractor.ts:12-13` | core only | Heavy install (pulls TS itself transitively, ~30 MB). Justified — core does AST work on TS source. |
| `glob` | `^10.3.10` | yes — `scanner/pattern-scanner.ts:19`, `scanner/gherkin-scanner.ts:19` | **yes** — `architect-guard` (`^10.3.10`, same version) | Both core and guard use `^10.3.10`. **Aligned, no drift.** |
| `zod` | `^4.1.11` | yes (25+ files) | **yes** — projection, guard, cli, mcp, and root devDeps all on `^4.1.11` | **Aligned. No drift.** |
| `@amiceli/vitest-cucumber` (dev) | `^6.3.0` | n/a (test runner) | **yes** — all five packages on `^6.3.0` | Aligned |
| `@types/node` (dev) | `^24.12.0` | n/a | **yes** — all on `^24.12.0` | Aligned |
| `typescript` (dev) | `^5.8.2` | n/a | **yes** — all on `^5.8.2` | Aligned |
| `vitest` (dev) | `^4.1.4` | n/a | **yes** — all on `^4.1.4` | Aligned |

**Findings:**
- **All shared deps are pinned identically across the family.** Notable
  alignment discipline; no drift. This is rare for a multi-package pnpm
  workspace and worth preserving.
- **No declared deps are unused in `src/`.** Verified by grep — every entry
  in `dependencies` has at least one `import` in `src/`.
- **No imports of devDeps from `src/`.** Verified by grep — `vitest`,
  `@amiceli/vitest-cucumber`, `@types/node`, `typescript` are absent from
  `src/`.
- **No suspicious large packages.** The heaviest is
  `@typescript-eslint/typescript-estree`, which is the AST parser core
  actually needs.
- **Missing `eslint` in `architect-core/devDependencies`.** Core's
  `eslint.config.mjs` imports from `../../eslint.config.mjs`, which depends
  on `eslint`, `typescript-eslint`, `eslint-plugin-import`,
  `eslint-config-prettier` — all declared in the **root** package's
  `devDependencies`. The package script `eslint src` works because pnpm
  hoists from the workspace root. Siblings all explicitly declare `"eslint":
  "^9.17.0"` in their own `devDependencies`. **Recipe:** add `"eslint":
  "^9.17.0"` to `architect-core/package.json:devDependencies`. Either every
  package owns its lint toolchain or none does; family convention is the
  former.

---

## Files that should not be in `dist/`

Computed from `npm pack --dry-run`. The published tarball contains:

| Path pattern | Count | Reason it's there | Recommended action |
|---|---|---|---|
| `dist/**/*.js.map` | 106 | `sourceMap: true` in `tsconfig.base.json:14` | **Delete from publish** — see CL-CORE-3. Either turn off in base, or strip in `prepack`. |
| `dist/**/*.d.ts.map` | 106 | `declarationMap: true` in `tsconfig.base.json:13` | **Delete from publish** — same fix as above. |
| `dist/config/self-hosting.{js,d.ts}` | 2 | `src/config/self-hosting.ts` is in `src/`, ships by default | Delete `self-hosting.ts` per Phase 1 H-CORE-10. Cleanup recipe CL-CORE-4. |
| `dist/config/presentation-contracts.{js,d.ts}` | 2 | `src/config/presentation-contracts.ts` exists | Delete the file per Phase 1 H-CORE-4. |
| `dist/config/cli-schema.{js,d.ts}` | 2 (24.5 KB JS!) | `src/config/cli-schema.ts` shouldn't be in core | Move to `architect-cli` per Phase 1 H-CORE-5. |
| `dist/extractor/layer-inference.{js,d.ts}` | 2 | hardcoded `/orders/` / `/inventory/` paths | Delete the path heuristics per Phase 1 H-CORE-11; keep `inferFeatureLayer` if it has a sensible non-hardcoded form. |
| `dist/utils/markdown-parser.{js,d.ts}` | 2 | zero callers (CL-CORE-5 #1) | Delete the file. |
| `dist/validation-schemas/pattern-graph.d.ts` | 1 file, 509 KB | TS-inferred-types explosion from Zod schemas | See CL-CORE-3 — fix the schema surface (C-CORE-2), or accept the size after measuring. |
| `dist/config/tag-registry-contract.{js,d.ts}` | 2 | duplicate of `validation-schemas/tag-registry.ts` (C-CORE-3) | Delete the file per Phase 1 C-CORE-3. |

After applying the Phase 1 deletions plus CL-CORE-3 (map stripping) and
CL-CORE-5 (dead-export sweep), the published tarball should drop from **426
files / 195.8 KB packed / 1.5 MB unpacked** to roughly **170-180 files / under
100 KB packed / ~600 KB unpacked** — a 2× reduction in install footprint
without losing a single consumer-visible API.

---

## Cross-cutting observations

- The package's `sideEffects: false` claim is technically true (no top-level
  imports run statements with observable side effects on third-party state)
  but **culturally inconsistent**: two module-load IIFEs do real work
  (`self-hosting.ts:93`, `gherkin-ast-parser.ts:49`). Either the package
  commits to the spirit of the claim (lazy initialization everywhere) or
  reconsiders it. Bundlers will still tree-shake; the cleanup is for
  consistency, not correctness.
- The `parseAtBoundary` surface (Phase 1 H-CORE-3) and the README's
  zod-primitives reference (CL-CORE-7) both gesture at "we want a single trust
  boundary module" without actually having one. The cleanup-recipe owner for
  this is whoever lands H-CORE-3 first.
- The 27× `structuredClone` in `pattern-graph-api.ts` (Phase 1 H-CORE-8)
  combined with the unbounded `package-resolver.ts` cache (CL-CORE-8) means
  the package isn't designed for long-running server-side use. Both are
  cheap fixes but the package's status as MCP-server substrate is degraded
  until they land.
