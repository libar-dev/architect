# architect-core — Phase 4 Consolidated: Best Practices & Standards

**Sources:** `raw/4A-language-framework.md` (javascript-typescript:typescript-pro) + `raw/4B-ci-devops.md` (full-stack-orchestration:deployment-engineer).
Findings tagged **[4A]**, **[4B]**, or **[4A+4B]** when both reviewers flagged the same theme.

## Executive Summary

`architect-core` has the correct _language posture_ for a strict TS 5 / Zod 4 / pure-ESM / Node 20 codebase: all four strictness flags (`verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`) on; zero `@ts-ignore`/`eslint-disable` in `src/`; one local ESLint rule (`architect-local/no-suppression-comments`) actively guards the doctrine; `import type` and `.js`-extension relative imports consistent; `import.meta.url`/`fileURLToPath` rather than `__dirname`; Zod 4 modernisms (`z.prettifyError`, `z.iso.datetime`, `.brand<…>()`, `z.discriminatedUnion`) all present where they should be. The branded-types module is exemplary, `validation/boundary.ts` uses the right Zod 4 error formatter, `validation-schemas/export-info.ts` demonstrates `z.discriminatedUnion`, and `config/section-block.ts` shows the right `z.ZodType<T>: z.lazy(...)` recursive idiom.

Three framework-level _gaps_ compound across both reports:

1. **Zod 4 idiom drift on the load-bearing read model + cross-package contracts.** 28 schemas across `validation-schemas/` use the now-open `z.object` (Zod 4 keeps these open at runtime; doctrine requires `z.strictObject`). The `.extend()` call on `PackageConfigSchema` silently drops strictness because Zod 4 changed `.extend`/`pick`/`omit`/`merge` mode propagation. `z.function().optional()` in tag-registry is a Zod-3-era no-op that `@typescript-eslint/no-deprecated` warns on (and the root ESLint config has it as `warn` _specifically_ to catch this). [4A]
2. **TS strictness is quietly defeated in three production-path files** despite the strictness flags being on: 16× `as ProcessStatusValue|string[]|DocDirective['level']` casts in `scanner/ast-parser.ts:279-296` after `Map.get(...)` returns `unknown`; 2× `metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[]` reads through the `[key: string]: unknown` index signature in `scanner/gherkin-ast-parser.ts:494,525` (which propagates across module boundaries via `ReturnType<typeof extractPatternTags>`); and `validation/fsm/validator.ts:92,93,102` casts strings to `ProcessStatusValue` _after_ the type guard rejected them. The three `void X;` expressions slip past the local lint rule because that rule's pattern only matches comments, not `UnaryExpression[operator="void"]`. [4A]
3. **CI/CD is entirely absent and that's amplifying every other problem.** No `.github/workflows/` directory exists; lint, typecheck, and tests run on developer discipline. The package declares `publishConfig.provenance: true` but has no workflow to actually issue the attestation. `prepack` is misplaced at JSON root, so even the manual publish path silently ships stale `dist/`. No Node version matrix despite `engines: ">=20.0.0"` (repo's `.node-version` pins 22). No security scanning, no Dependabot, no automated release validation. [4B]

Two highest-impact wins (each one-line fixes that compound):

1. **Replace `z.function().optional()` with `z.enum(KNOWN_TRANSFORM_NAMES).optional()`** [4A F4A-C-2]. Cascades: the boundary contract becomes data-only, `cloneTagRegistry` (Phase 1 M-CORE-14) collapses to one line, `structuredClone` issues dissolve.
2. **Disable `sourceMap`/`declarationMap` in `tsconfig.architect-base.json`** [4B CL-CORE-3]. Cuts tarball from 426 → ~214 files (50% reduction) family-wide. Becomes critical after Phase 2 H-SIMP-3 lands (strict schemas may inflate `.d.ts` further).

The reports converge on a clear claim: the package's _idioms_ are right; the _application of those idioms_ is uneven; and the _automation that would enforce uniformity_ doesn't exist.

## Critical (P0)

### F4A-C-1. `validateTransition` casts strings to `ProcessStatusValue` after the type guard rejected them **[4A]** (extends Phase 1 C-CORE-5, Phase 2 M-SIMP-2)

`src/validation/fsm/validator.ts:88-105`. Three `as ProcessStatusValue` casts after `!isValidStatusValue(from|to)` — the type system is lied to. The `valid: false` discriminant is the only safety net; callers reading `result.from === 'roadmap'` compile fine and read garbage. **Production caller is `architect-guard`** (Phase 3 TC-C-3 inventory), so this is on the production path.

**Recipe:** discriminated result union — `{ valid: true; from: ProcessStatusValue; to: ProcessStatusValue } | { valid: false; from: string; to: string; error; validAlternatives? }`. The three casts disappear; consumers gain real type narrowing. (Recipe identical to Phase 2 M-SIMP-2.)

### F4A-C-2. `z.function().optional()` is a Zod-3 idiom Zod 4 redefined **[4A]** (extends Phase 1 M-CORE-8)

`src/validation-schemas/tag-registry.ts:32`. Two compounding problems:

1. In Zod 4, `z.function({ input: [...], output: ... })` is the new function-validating factory; the bare `z.function()` is preserved-for-back-compat shape that does NOT validate runtime function args/returns — effectively `z.custom<(value: unknown) => unknown>()` in disguise. Root `eslint.config.mjs:331` sets `@typescript-eslint/no-deprecated: warn` with the comment "Deprecated Zod APIs - will update when needed" — this is the bait the comment was set up to catch.
2. The boundary contract shouldn't hold functions anyway. Functions don't survive JSON / IPC / structured-clone boundaries, which is why `read-api/pattern-graph-api.ts:85-100` ships a hand-rolled `cloneTagRegistry`.

**Recipe:** make the boundary data-only. Replace `transform: z.function().optional()` with `transform: z.enum(KNOWN_TRANSFORM_NAMES).optional()`. Resolve names→functions inside the extractor (`taxonomy/registry-builder.ts`). `cloneTagRegistry` collapses to one line; Phase 1 M-CORE-14 dissolves.

### CL-CORE-1 / CL-CORE-2. Publish-time bugs (already documented in Phase 2) **[4B]**

`prepack` at JSON root (silently ignored — ships stale dist) and broken `./roles` export. Both already covered by Phase 2 raw cleanup output. Phase 4B confirms they're the only critical operational blockers and verifies zero workspace callers of `./roles`.

## High (P1)

### Language / framework

| #       | Source | Location                                                                              | Issue & recipe                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------- | ------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F4A-H-1 | 4A     | `scanner/ast-parser.ts:279-296`                                                       | 16× `Map.get(...) as X` casts after the map's `unknown` value type. Defeats `noUncheckedIndexedAccess`. **Recipe:** instead of `Map<string, unknown>`, return a typed result from `applyTagValue` keyed by the metadata tag's `format` (already a Zod enum). When Phase 2 H-SIMP-6 lands, these 16 sites disappear automatically.                                                                                                                   |
| F4A-H-2 | 4A     | `scanner/gherkin-ast-parser.ts:364-418, 494, 525`                                     | `extractPatternTags` returns a 42-field shape with `[key: string]: unknown`, defeating `noPropertyAccessFromIndexSignature`. 2× `metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[]` reads through it. **Recipe:** split into `ParsedFeatureMetadata` + `FeatureMetadataDiagnostics` (Phase 1 H-CORE-15 / Phase 2 H-SIMP-5 recipe).                                                                                                          |
| F4A-H-3 | 4A     | `validation-schemas/pattern-graph.ts:42-179`                                          | `PatternGraphSchema` + 8 siblings use `z.object` — open at runtime in Zod 4. Hand-written `interface PatternGraph` adds `nameIndex` the schema doesn't declare. `parseAtBoundary(PatternGraphSchema, dataset)` would silently drop `nameIndex`. **Recipe:** `z.strictObject` everywhere + `z.infer` types + move `nameIndex` to `RuntimePatternGraph` (already exists for `workflow`). Phase 2 H-SIMP-3 is the umbrella recipe.                     |
| F4A-H-4 | 4A     | `extractor/gherkin-extractor.ts:129,198` + `scanner/gherkin-ast-parser.ts:70,80`      | `ReturnType<typeof extractPatternTags>` propagates the `[key: string]: unknown` index signature across module boundaries — 6 sites consume `metadata._roleTagValues`/`_unrecognizedRoleValues`/`_deprecatedTags` through the open bag. **Land F4A-H-2, F4A-H-4, H-SIMP-5, and H-SIMP-1 in one PR or none — the chain is fragile if split.**                                                                                                         |
| F4A-H-5 | 4A     | `extractor/gherkin-extractor.ts:192-339`                                              | `buildGherkinRawPattern` returns `Record<string, unknown>` with 35 quoted-key assignments. A typo like `boundedContxt` compiles silently and drops the field. **Recipe:** use `z.input<typeof ExtractedPatternSchema>` as the literal partial type. Under `exactOptionalPropertyTypes`, optional fields are `T \| undefined` rather than spread-omitted. (Phase 2 H-SIMP-5 recipe.)                                                                 |
| F4A-H-6 | 4A     | `package/package-config.ts:10`                                                        | `.extend()` on a Zod 4 `z.strictObject` returns a base `z.object`-flavored schema — **strictness silently dropped.** Zod 4's `pick`/`omit`/`extend`/`merge` all changed internal `ZodObject` mode propagation in v4. **Recipe:** re-declare with `z.strictObject({ ...PackageSchema.shape, match: PackageMatcherSchema })`. A round-trip parse test with an extra property is the unit gate that catches this.                                      |
| F4A-H-7 | 4A     | `doc-extractor.ts:231`, `gherkin-extractor.ts:502`, `validation-schemas/config.ts:10` | Three sync FS calls. `readFileSync` per-pattern in `doc-extractor` (318 reads block the loop on the dogfood graph); `existsSync` is the only reason `extractPatternsFromGherkin` (sync) exists separately from `Async`; `realpathSync` in a Zod refine is acceptable (config-load only). **Recipe:** collapse with Phase 1 H-CORE-6 / Phase 2 H-SIMP-1; the third is fine.                                                                          |
| F4A-H-8 | 4A     | `doc-extractor.ts:219`, `gherkin-extractor.ts:366,536` vs `build-pipeline.ts:108`     | `build-pipeline.ts` correctly converts `path.sep` → `/` before branding a path; the extractors brand `path.relative(...)` directly. On Windows this leaks `\\` into source-file IDs that then mismatch grep, JSON comparisons, and dogfood snapshots. **Recipe:** make the `asSourceFilePath` brand constructor itself normalize: `z.string().transform((p) => p.split(/[\\/]/).join('/')).brand<'SourceFilePath'>()`.                              |
| F4A-H-9 | 4A     | `doc-extractor.ts:249,252`, `gherkin-extractor.ts:604`                                | Three `void X;` expressions evade the no-suppression lint rule. The local rule pattern matches comments, not `UnaryExpression[operator="void"]`. **Recipe:** add `no-restricted-syntax` rule banning `ExpressionStatement > UnaryExpression[operator="void"]` in production src. Two of the three sites have a real `extractionWarnings` accumulator that should surface via the existing `ExtractionDiagnostic[]` channel; the third is dead code. |

### CI/DevOps

| #          | Source                         | Location                                | Issue & recipe                                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CL-CORE-3  | 4B (extends Phase 2)           | `tsconfig.base.json:13-15`              | 50% of published tarball is `.map` files (212/426); `pattern-graph.d.ts` is 509 KB (10,438 lines from 179 source). **Recipe:** set `sourceMap: false, declarationMap: false` in `tsconfig.architect-base.json` (one line, family-wide). Re-measure tarball after Phase 2 H-SIMP-3 (strict schemas) in case the `.d.ts` width changes. |
| CL-CORE-8  | 4B (extends Phase 2)           | `src/package/package-resolver.ts:34-49` | Unbounded `Map<string, Package>` cache — fine in CLI (process exits), slow leak in `architect-mcp` (file watcher → re-resolve on save → never clear). **Recipe:** add `clear(): void` method; have MCP file-watcher call on workspace changes. Or swap for bounded LRU. **MCP stability blocker** before advertising stability.       |
| CL-CORE-11 | 4B (extends Phase 2)           | `package.json:42`                       | `typecheck` only covers `tsconfig.test.json`. Type errors in `src/` go undetected at `pnpm typecheck`. **Recipe:** `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` matching `architect-guard`/`architect-cli`.                                                                                                  |
| CL-CORE-10 | 4B (extends Phase 2)           | `package.json:43`                       | `lint` glob excludes `tests/` (51 step files). **Recipe:** `eslint src tests`.                                                                                                                                                                                                                                                        |
| CL-CORE-4  | 4B (extends Phase 1 H-CORE-10) | `src/config/self-hosting.ts:93`         | Module-load `createArchitect({...}).registry` runs on every import that pulls `self-hosting.ts` transitively — contradicts `sideEffects: false`. **MCP startup cost.** Resolved by Phase 1 H-CORE-10 deletion.                                                                                                                        |

## Medium (P2)

### Zod 4 idiom drift sweep

19 additional `z.object` sites need the strict-sweep:

| File                                         | Sites                           | Notes                                                      |
| -------------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| `validation-schemas/output-schemas.ts:10-78` | 10 schemas                      | CLI/MCP output boundary — open contracts.                  |
| `validation-schemas/extracted-shape.ts:7-74` | 8 schemas                       |                                                            |
| `validation-schemas/extracted-pattern.ts:13` | 1 schema (`BusinessRuleSchema`) | Other 6 schemas in same file are correctly strict — drift. |

(28 total when combined with the 9 in `pattern-graph.ts`.)

### Strictness audit results [4A]

| Issue type                                         | Count       | Where                                                                                             |
| -------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `noPropertyAccessFromIndexSignature` defeated      | 3 sites     | gherkin-ast-parser line 418 index signature + 2 `as` casts at :494,525                            |
| `noUncheckedIndexedAccess` evaded                  | 16 sites    | ast-parser:279-296 `Map.get(...) as X`                                                            |
| `Record<string, unknown>` builders                 | 4 sites     | gherkin-extractor:206,223 + doc-extractor:254-292 + config-loader:190 + project-config-schema:123 |
| Strictness lies (`as X` after rejected type guard) | 1 site      | validator.ts (F4A-C-1)                                                                            |
| `as unknown as X`                                  | **0 sites** | Clean.                                                                                            |
| `any`                                              | **0 sites** | `@typescript-eslint/no-explicit-any: error` enforced.                                             |
| `as const satisfies` correctly used                | 3 sites     | role-constants.ts, self-hosting.ts, resolve-config.ts — exemplary.                                |

### Other medium findings

| #          | Source               | Location                                                                          | Issue                                                                                                                                                                                                                                                                                                          |
| ---------- | -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F4A-M-2    | 4A                   | `types/branded.ts:40-42`                                                          | `asModuleId(id) → id as ModuleId` is the only branded constructor that doesn't parse. Either delete (no callers per Phase 1) or call `asPatternId`.                                                                                                                                                            |
| F4A-M-3    | 4A                   | `read-api/pattern-graph-api.ts:306`, `validation-schemas/extracted-pattern.ts:91` | `getPatternsByQuarter(string)` accepts any string; malformed quarters silently `[]`. **Recipe:** brand `Quarter` via `z.string().regex(QUARTER_PATTERN).brand<'Quarter'>()`.                                                                                                                                   |
| F4A-M-4    | 4A                   | 5 sites                                                                           | `parseInt` + `isNaN` instead of `Number.parseInt` + `Number.isNaN`. `gherkin-ast-parser.ts:486-487`, `dual-source-extractor.ts:56,118-119`, `ast-parser.ts:104`. Global `isNaN` coerces (`isNaN("foo") === true`). **Recipe:** sweep, plus add `@typescript-eslint/prefer-number-properties` to the rule list. |
| CI-1       | 4B                   | (no `.github/workflows/`)                                                         | **No CI pipeline exists at all.** Trigger on PR/push: lint + typecheck + test; matrix `node: [20, 22]`; cache pnpm store / node_modules / .tsbuildinfo; status checks required on protected branch.                                                                                                            |
| CI-2       | 4B                   | (no publish workflow)                                                             | Publish is fully manual. `publishConfig.provenance: true` is declared but no workflow issues the attestation. **Recipe:** add `.github/workflows/publish.yml` triggered on tag push, running `pnpm build && pnpm test && changeset publish` with OIDC trust to npm for provenance.                             |
| CL-CORE-14 | 4B                   | All packages                                                                      | Family-wide normalization opportunity — `test` typecheck guard, `typecheck` scope, `lint` glob, vitest include pattern, eslint as explicit devDep. One PR across all 5 packages is cheaper than 5 PRs.                                                                                                         |
| CL-CORE-6  | 4B (extends Phase 2) | `gherkin-extractor.ts:604`                                                        | Third `void X` soft-suppression beyond Phase 1 M-CORE-2. Addressed by F4A-H-9 lint-rule recipe.                                                                                                                                                                                                                |
| F4A-M-1    | 4A                   | `validation-schemas/{output-schemas,extracted-shape,extracted-pattern}.ts`        | Same as Zod 4 drift table above.                                                                                                                                                                                                                                                                               |
| F4A-M-5    | 4A                   | `config/section-block.ts:75-152`                                                  | 3 `z.union` over literal-tagged variants would benefit from `z.discriminatedUnion('type', [...])` for faster parsing + better errors. The `z.lazy` recursion makes this non-trivial in Zod 4. **Acceptable as-is**; revisit if Zod's recursive discriminated-union support improves.                           |

## Low (P3)

| #       | Source | Issue                                                                                                                   |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| F4A-L-1 | 4A     | `import * as fs from 'fs'` mixed with `from 'node:fs'`. Sweep to `node:` prefix for ESM hygiene (no behavior change).   |
| F4A-L-2 | 4A     | `WORKSPACE_TAG_REGISTRY` IIFE — same recipe as F4A-L-3, dissolves with Phase 1 H-CORE-10.                               |
| F4A-L-3 | 4A     | `DEFAULT_BUILDERS` IIFE at `gherkin-ast-parser.ts:49-52` — lazy memo recipe.                                            |
| F4A-L-4 | 4A     | `z.string().min(1, '...')` used consistently across ~80 sites — Zod 4 idiomatic non-empty-string pattern. **Preserve.** |
| F4A-L-5 | 4A     | `z.array(...).readonly()` used correctly across 35+ sites. **Preserve.**                                                |
| F4A-L-6 | 4A     | `expect.poll`/`expect.soft` not used — correct (no async retried invariants in this surface).                           |
| CI-3    | 4B     | `.changeset/config.json:19` ignores `architect-self-host-example` — removed package. Stale ignore entry.                |

## Zod 4 audit (call-site verdicts)

| Site                           | API                                    | Verdict                                                                      |
| ------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------- |
| `pattern-graph.ts:42-123`      | 9× `z.object`                          | **Drift** — should be `z.strictObject`.                                      |
| `output-schemas.ts:10-78`      | 10× `z.object`                         | **Drift** — CLI/MCP output boundary.                                         |
| `extracted-shape.ts:7-74`      | 8× `z.object`                          | **Drift.**                                                                   |
| `extracted-pattern.ts:13`      | 1× `z.object` (`BusinessRuleSchema`)   | **Drift** — other 6 schemas in same file correctly strict.                   |
| `package-config.ts:10`         | `.extend()` on strict                  | **Drift** — Zod 4 drops strictness through `.extend`.                        |
| `tag-registry.ts:32`           | `transform: z.function().optional()`   | **Wrong shape** — Zod-3 idiom; functions don't belong in boundary contracts. |
| `section-block.ts:75-152`      | 3× `z.union` + literal tags + `z.lazy` | **Correct** — `z.lazy` recursion blocks discriminatedUnion in Zod 4.         |
| `export-info.ts:36`            | `z.discriminatedUnion('type', [...])`  | **Correct** — reference implementation.                                      |
| `validation/boundary.ts:54-65` | `z.prettifyError(parsed.error)`        | **Correct** — Zod 4 modern formatter.                                        |
| `extracted-pattern.ts:128`     | `z.output<typeof Schema>`              | **Correct.**                                                                 |
| `extracted-shape.ts:82`        | `z.input<typeof Schema>`               | **Correct** — exemplary; H-SIMP-5 recipe should follow this template.        |
| `types/branded.ts:7-12`        | 6× `z.string().brand<'…'>()`           | **Correct** — native Zod 4 branded types.                                    |

**Zod 4 idioms not used and not needed:** `z.preprocess`, `z.pipe`, `z.coerce`. Codebase preprocesses through explicit `.transform(...)` chains; no `z.coerce.number()` candidates.

## CI/DevOps audit results

### Lifecycle hooks

| Hook             | Status                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `prepack`        | **CRITICAL DRIFT** in core (top-level vs scripts) — see CL-CORE-1. All siblings correct. |
| `prepare`        | Not used anywhere — fine.                                                                |
| `postinstall`    | Not used anywhere — fine.                                                                |
| `prepublishOnly` | Not used anywhere — fine.                                                                |

### Publish pipeline

| Concern                          | Status                                                                   |
| -------------------------------- | ------------------------------------------------------------------------ |
| `prepack` runs `tsc -b`          | Broken in core (CL-CORE-1).                                              |
| `publishConfig.access: public`   | Correct.                                                                 |
| `publishConfig.provenance: true` | **Declared but unimplemented** — no workflow to issue attestations.      |
| `files: ["dist"]` allowlist      | Correct, tight, matches siblings.                                        |
| `exports` map                    | **Broken `./roles`** (CL-CORE-2). `.` and `./config` correct.            |
| `engines: node >=20.0.0`         | Correct but unenforced (no CI matrix). `.node-version` pins 22.          |
| Tarball size                     | 426 files / 195.8 KB packed / 1.5 MB unpacked. **50% maps** (CL-CORE-3). |

### Family-wide script drift summary

| Setting                  | Core                     | CLI               | Guard                 | MCP              | Projection          | Verdict                                    |
| ------------------------ | ------------------------ | ----------------- | --------------------- | ---------------- | ------------------- | ------------------------------------------ |
| `prepack` location       | top-level (broken)       | scripts           | scripts               | scripts          | scripts             | **CRITICAL — fix core**                    |
| `prepack` command        | `pnpm build`             | `clean && build`  | `clean && build`      | `clean && build` | `clean && build`    | DRIFT — align core                         |
| `lint` glob              | `src`                    | `src tests`       | `src tests`           | `src tests`      | `src tests`         | DRIFT — add `tests` to core                |
| `typecheck` scope        | test-config only         | both              | both                  | both             | test-config only    | DRIFT — align core + projection to both    |
| `test` typecheck guard   | none                     | `build && vitest` | `typecheck && vitest` | none             | none                | DRIFT — align all to `typecheck && vitest` |
| `eslint` explicit devDep | **missing** (root hoist) | yes               | yes                   | yes              | yes                 | DRIFT — add to core                        |
| Test include pattern     | `tests/steps/**`         | n/a               | n/a                   | n/a              | `tests/features/**` | Drift — pick family convention             |

## What's already idiomatic (preserve)

Six patterns called out as exemplary by 4A:

1. **`src/types/branded.ts:7-12`** — `z.string().brand<'PatternId'>()` + `type PatternId = z.output<typeof PatternIdSchema>` is the native Zod 4 way to do nominal typing. Constructor functions parse rather than cast. Reference implementation for the family (one slip: `asModuleId`).
2. **`src/validation/boundary.ts:38-65`** — `BoundaryParseError` wraps `ZodError` with a stable `BoundaryParseIssue[]` shape; uses `z.prettifyError`. The right primitive.
3. **`src/validation-schemas/extracted-shape.ts:81-82`** — separating `z.infer` (post-default, post-transform) from `z.input` (pre-default, pre-transform, the shape callers literally pass). The template H-SIMP-5 wants to generalize.
4. **`src/validation-schemas/export-info.ts:36-43`** — `z.discriminatedUnion('type', [...])` over 6 literal-tagged variants. O(1) parse dispatch on the discriminant, structured error paths.
5. **`src/config/section-block.ts:102-156`** — `z.ZodType<T>: z.lazy(() => ...)` annotation on three recursive schemas. The Zod 4 idiomatic way to break circular type inference.
6. **`as const satisfies T` pattern** at `config/role-constants.ts:64`, `config/self-hosting.ts:68`, `config/resolve-config.ts:41` — TS 5 idiom for narrow literal types preserved while validating conformance.

## ESM and Node-stdlib summary

| Concern                                | Verdict                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.js` extensions on relative imports   | **Correct** — 160/160 relative imports have `.js` suffix.                                         |
| `import type` for type-only imports    | **Correct** — 97 declarations; `@typescript-eslint/consistent-type-imports: error` enforced.      |
| `import.meta.url` vs `__dirname`       | **Correct** — one site (`self-hosting.ts:7`), no `__dirname`/`__filename` anywhere.               |
| `require()`                            | **Zero.**                                                                                         |
| `Buffer.from(string)` without encoding | **Not used.**                                                                                     |
| `fs.exists` (legacy)                   | **Not used.**                                                                                     |
| `util.promisify`                       | **Not used** (native promises throughout).                                                        |
| `AbortSignal`                          | Not used — acceptable; long-running consumer leaks are caching issues, not cancellation issues.   |
| `console.*`                            | 2 sites (Phase 1 M-CORE-12 / Phase 2 CL-CORE-13) — should route through `ExtractionDiagnostic[]`. |

## Recommended landing order (Phase 4 angle)

1. **CL-CORE-1 + CL-CORE-2** (1 min each) — fix `prepack`, delete `./roles`.
2. **F4A-C-1** (~15 LOC) — discriminated `TransitionValidationResult`. Bundle with Phase 2 M-SIMP-2.
3. **F4A-C-2** (cascading) — `z.enum(KNOWN_TRANSFORMS).optional()` replaces `z.function().optional()`. Cascades through `cloneTagRegistry`.
4. **F4A-H-3 + F4A-M-1** (sweep) — `z.object → z.strictObject` across 28 schemas. Combined with Phase 2 H-SIMP-3.
5. **F4A-H-6** (1 line) — re-declare `PackageConfigSchema` with `z.strictObject({...shape, ...})`.
6. **CL-CORE-3** (1 line in base config) — disable `sourceMap`/`declarationMap`. Re-measure tarball after step 4.
7. **CL-CORE-10/11 + script drift sweep** — one family-wide PR aligning `prepack`/`lint`/`typecheck`/`test` scripts.
8. **F4A-H-5** (typed `z.input` partial) — combined with Phase 2 H-SIMP-5.
9. **F4A-H-2 + F4A-H-4** (split metadata bag) — combined with Phase 1 H-CORE-15. **Land these together with H-SIMP-1/5 — the chain is fragile if split.**
10. **F4A-H-1** (typed `applyTagValue`) — combined with Phase 2 H-SIMP-6. The 16 `as` casts in ast-parser disappear automatically.
11. **F4A-H-7** (collapse sync FS) — combined with Phase 1 H-CORE-6 / Phase 2 H-SIMP-1.
12. **F4A-H-8** (POSIX brand normalization) — small.
13. **F4A-H-9** (`no-restricted-syntax` ESLint rule) + delete 3 `void X` lines.
14. **CI-1 + CI-2** — add `.github/workflows/ci.yml` + `publish.yml`. Standalone effort.
15. **F4A-M-4 + F4A-L-1** — `parseInt`/`isNaN` → `Number.*`; `from 'fs'` → `from 'node:fs'`. Mechanical sweeps.

Items 1-7 are doctrine-aligned wins. Items 8-13 chain into the Phase 2 simplification recipes. Items 14-15 are mechanical/family-wide.

## Critical context for Phase 5

The Phase 5 per-package report should highlight:

1. **The package's _idioms_ are sound; the _application_ is uneven.** Zod 4, ESM, Node 20, TS strictness all correctly chosen and largely well-implemented — the gaps are pockets where the chosen idiom wasn't applied (`z.object` instead of `z.strictObject`, `Map<string, unknown>` instead of typed dispatch, `as X` after type guards, `void X;` instead of using the diagnostic channel). The fixes are mechanical sweeps; the corpus is small enough that doctrine compliance is achievable in one or two PRs.
2. **One Critical doctrine breach is on the production path:** `validateTransition`'s `as ProcessStatusValue` casts (F4A-C-1) flow into `architect-guard`'s `decider.ts:300`. A consumer reading `result.from === 'roadmap'` after invalid input reads garbage. This is the kind of finding that's worth highlighting in the master family report because it crosses package boundaries.
3. **No CI/CD is the multiplier.** Every quality finding in Phase 1-3 becomes a developer-discipline question rather than an automation question. Even the simplest CI (lint + typecheck + test on PR) would have caught the misplaced `prepack`, the broken `./roles` export, the `z.function()` deprecation warning, and the lint-coverage gap on `tests/`. Phase 5 should treat CI absence as a structural finding, not a P2 backlog item.
4. **The family-wide drift suggests a workspace-level base config is overdue.** A `pnpm-workspace.yaml` catalog plus a shared `package.json` script template would eliminate 4 of the 7 drift items above by design. Worth recommending in the master report.
