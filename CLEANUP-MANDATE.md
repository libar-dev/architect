# `@libar-dev/architect` — Pre-Release Cleanup Mandate

**Scope:** Definition of work and success criteria for the consolidated cleanup that must land **before any new feature work** on the architect package family. Synthesized from `.full-review/` (30 review artifacts across 6 packages, 4 phases each) into a single class-based mandate.

**Stance:** Pre-1.0, No-BC. **Breaking changes are wanted.** Deprecation aliases are forbidden. Adapters, compat shims, and "softening" wrappers from previous refactor waves are dead weight that the next refactor will trip on. Every class below prefers **deletion + consumer migration** over "rename and re-export the old name."

**Out of scope of this document:** detailed implementation plan, line-level edits, sequencing PRs. This document defines _what_ and _why_ — planning + execution happen in subsequent sessions and must use this as canonical scope.

**How to use this:** Each section is a **class of issue**, not a list of isolated fixes. A class describes (a) the pattern, (b) where it manifests across packages, (c) why it matters for the family, (d) the breaking-change posture, (e) the definition of done that a planning agent must validate against. When a planning session investigates a class it should expand into individual fix sites against the underlying `.full-review/*/05-package-report.md` and `.full-review/99-master-report.md` reports for exact locations.

---

## Doctrine reminder (operating constraints)

These are not "best practices" — they are the gates that turn each class into a binary pass/fail check:

1. **No-BC.** No `// eslint-disable*`, no `@ts-ignore`/`@ts-expect-error`, no `@deprecated`-as-soft-removal, no BC re-export aliases, no `_var` rename hacks. Delete; don't soften.
2. **Zod-first boundaries.** Every cross-package contract and every CLI/MCP/file/git-diff input boundary is `z.strictObject(...)` (not `z.object()`). Types flow from schemas (`z.infer`), never the other way around. Parse once at the trust boundary.
3. **TS strictness.** `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes` — all on. No circular imports within or across packages.
4. **Architect State is Code.** `@architect-*` annotations on production code + Gherkin tags on executable specs are the **single source of truth**. Generated docs, PatternGraph, and read-API projections are projections. If a module isn't annotated it doesn't exist to the platform.
5. **Single-source rule.** One canonical definition per concern. If a function or schema exists twice, one is wrong by definition; pick one and migrate callers; never reconcile both.

---

## Class A — Adapter / compat-shim / preset removal _(the primary theme)_

**Pattern.** Previous refactor waves renamed canonical exports but preserved the old names as aliases "for compatibility." The aliases now ship in published barrels, cement old names into consumer code, and prevent the next refactor from being clean. The doctrine has explicitly forbidden this for ~6 sessions; the cruft keeps surviving because each fix was scoped narrowly.

**Canonical example confirmed in current main:**

- `packages/architect-core/src/config/role-constants.ts` ships `export const DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES;` — pure alias from a prior wave.
- Re-exported through `src/config/index.ts` and `src/index.ts` so the alias becomes a public 2.0 contract.

**Manifestations across the family:**

- **Core — `presentation-contracts.ts`** — obsolete `CodecOptions`/`ReferenceDocConfig`/`DEFAULT_PRESENTATION_OUTPUT_DIRECTORY` types kept alive by the obfuscated `'codec' + 'Options'` string-concat strip in `config-loader.ts`. Pure adapter for a deleted concept.
- **Core — 6 BC alias schemas in `validation-schemas/feature.ts`** — `ParsedStepSchema` etc., parallel to `Gherkin*` names. Both shipped through the barrel.
- **Core — `cli-schema.ts` (610 LOC, 22 KB)** — CLI concern hosted in core. **Verified zero workspace consumers.** Cli already has its own help system. Phase 1 said "move to cli"; the cli review (`.full-review/architect-cli/05-package-report.md` C-CLI-3) verified: **delete from core; don't move.**
- **Core — `self-hosting.ts` `ARCHITECT_PACKAGE_ROLES` + `PACKAGE_SELF_HOSTING_SOURCES`** — dogfood plumbing computed at module load in a `sideEffects: false` package. The repo's own `architect.config.ts` is the only real consumer.
- **Core — `./roles` `package.json#exports` entry** — points to `dist/roles.{js,d.ts}` files `tsc -b` never produces. Install-time 404 for any consumer who follows it. Zero callers.
- **Core — 10 additional dead exports** (`parseMarkdownToBlocks`, `formatUserZodError`, `FEATURE_LAYERS`, `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, `isScopeLocked`, `createFileLoader`, `formatCodecError`) — grep-verified zero workspace consumers.
- **Core — `cloneTagRegistry` hand-rebuild** — exists only because the registry schema carries a `z.function()` `transform` field that defeats `structuredClone`. Adapter around a doctrine breach.
- **Cli — entire `src/index.ts` JS API surface** — verified zero workspace consumers. The only `handleCliError` import in the workspace resolves to a _different_ function in guard. Cli should become bin-only.
- **Guard — `tier-a-baseline.ts` (1,138 LOC)** — dogfood lint baseline shipped in the published barrel as `TIER_A_LINT_BASELINE`. 45.8 KB / 7.8% of the tarball. Hardcoded in-repo paths exported to consumers who cannot override.
- **Guard — `loadConfig`** — 12-line wrapper duplicating `loadProjectConfig`. 4 of 6 callers already migrated; the wrapper survives.
- **Projection — `documentation-type-registry.ts` (174 LOC Proxy facade)** — wraps a 12-entry static registry; the file's own comment marks it "campaign deletion target."
- **Projection + cli — duplicate `runtime-bridge.js`** — two near-identical copies differing only by function name + error string.

**Why this matters.** Compat adapters are the load-bearing reason every other class below stays hard to fix. They prevent barrel curation (Class F), preserve hand-written type aliases shadowing schemas (Class B), keep duplicated implementations alive (Class G), and broadcast wrong layering choices (Class H). Removing them is the prerequisite for everything else.

**Breaking-change posture:** Yes. Every alias deletion is a 2.0 break by design. v1 consumers who track this repo follow the No-BC doctrine and expect this — and the npm metadata (`2.0.0-pre.1` family-wide) signals the break.

**Definition of done:**

- No `export const X = Y` aliases anywhere in `src/` (where Y is the canonical name). The `DDD_ES_CQRS_ROLES` shape, in all forms, is gone.
- No "removed-but-kept-for-compat" comments. If something is deleted, its name is deleted too.
- No `'foo' + 'Bar'` runtime-obfuscation strips or similar adapters around deleted concepts.
- No 0-consumer exports anywhere in the family (verified by a workspace grep at PR time; ideally automated — see Class M).
- No file whose comment marks it as a deletion target.
- Single-pass migrations land in the same PR as the deletion; no "follow-up issue to remove the alias later."
- `MIGRATION.md` enumerates the breaks but **does not** advertise compat paths.

---

## Class B — Zod-first contract integrity

**Pattern.** Cross-package contracts and trust-boundary schemas must be `z.strictObject`. Hand-written `interface`/`type` parallels shadowing those schemas are a recipe for silent drift. Zod 4 changed `extend`/`omit`/`pick`/`partial`/`required` to reset `unknownKeys: 'strip'` — strict schemas silently become open whenever they get extended.

**Manifestations:**

- **Core (28 sites)** — `PatternGraphSchema` (the ADR-006 single read model) is `z.object`, shadowed by a hand-written `PatternGraph` interface that adds a `nameIndex` field the schema doesn't validate. 28 schemas under `validation-schemas/` use `z.object` where doctrine requires `strictObject`. Hand-written `BundleRouting`, `ProjectionBundle`, `ProjectionContext`, etc., parallel to (or instead of) `z.infer` from authoritative schemas.
- **Core — duplicate type-of-record** for `TagRegistry` / `RoleDefinition` / `MetadataTagDefinition` / `AggregationTagDefinition`. The same record exists three times: `config/tag-registry-contract.ts` (interface), `config/role-constants.ts` (another interface), `validation-schemas/tag-registry.ts` (Zod schema that _re-exports the interface type_). Pick one source; eliminate the other two.
- **Core — `z.function().optional()`** on the `transform` field of `TagRegistry`. Zod-3 idiom Zod 4 redefined; `@typescript-eslint/no-deprecated` flags it; functions don't belong in boundary contracts. Replace with `z.enum(KNOWN_TRANSFORM_NAMES).optional()` and resolve names→functions inside the registry builder.
- **Core — `PackageConfigSchema = PackageSchema.extend({...})`** — Zod 4 `.extend` silently drops strict mode.
- **Projection — strictness-loss chain `pattern-summary.ts` (`.omit()`) → `pattern-detail.ts` (`.extend()`) → `supporting.ts` (`.omit().extend()`)** — compounded loss on the most-consumed fragment (`PatternDetailSchema`).
- **Guard — `process-guard/types.ts`** — 14 hand-written interfaces, zero `z.infer`. The package whose anti-pattern detector enforces doctrine on siblings doesn't follow doctrine.
- **Guard — `AntiPatternThresholdsSchema`** — open `z.object` paired with a parallel data literal.
- **Confirmed clean:** projection-cli-mcp on the chain operators; mcp + cli + projection on strict/open ratio. **Three packages prove the doctrine is achievable.**

**Why this matters.** Open `z.object` on a cross-package contract means consumers' extra properties pass validation silently — the doctrine's "parse once at the trust boundary" promise is a lie if the schema isn't strict. Zod 4 strictness-loss compounds this for any package that uses `.extend()`/`.omit()` chains.

**Breaking-change posture:** Strictifying schemas is a behavioral break for consumers who pass extra fields. Wanted.

**Definition of done:**

- Family-wide grep finds zero `z\.object\(` in `src/` for cross-package or trust-boundary contracts. (Internal helpers may use `z.object` if they aren't crossing module boundaries — but default to strict.)
- Every `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` chain either ends in `.strict()` _or_ is replaced with `z.strictObject({ ...Base.shape, ...newFields })` spread.
- Workspace audit script (extension of projection's `options-schema-barrel-audit.mjs`) runs in CI and fails on strictness-loss chains.
- Zero hand-written interfaces shadowing Zod schemas. Every cross-package type derives via `z.infer`.
- `TagRegistry`/`RoleDefinition`/`MetadataTagDefinition` exist exactly once (schema-derived).
- No `z.function()` in any boundary contract.

---

## Class C — Trust-boundary parsing (parse-once doctrine)

**Pattern.** `parseAtBoundary` is the family's canonical helper for validating untrusted input at trust boundaries. The doctrine: parse once at the boundary into a typed shape; internal code uses cheap shape checks afterward; raw `ZodError` never leaks to consumers — `BoundaryParseError` does, with `cause` preserved.

**Manifestations of breach:**

- **Core uses `parseAtBoundary` zero times inside its own `src/`** despite being the package that exports it. `buildPatternGraph`'s entry point doesn't parse its inputs through the helper.
- **Core — three-layer validation** in `config-loader.ts`: hand-coded `isProjectConfig` guard + obfuscated IIFE strip + `safeParse`. Replace with one `safeParse` call.
- **Core — 16 `Map.get(...) as X` casts** in `parseDirective` defeating `noUncheckedIndexedAccess`. The map is the boundary; should parse once into a typed shape.
- **Core — `buildGherkinRawPattern` 35 typo-silent quoted-key assignments** on `Record<string, unknown>`. Replace with `z.input<typeof ExtractedPatternSchema>` to anchor the shape.
- **Core — `extractPatternTags` returns a 42-field shape with `[key: string]: unknown`** that defeats `noPropertyAccessFromIndexSignature` and propagates the index signature across module boundaries via `ReturnType<...>`. Two `as UnrecognizedEnumEntry[]` reads through the looseness.
- **Guard uses `parseAtBoundary` zero times** despite having three real trust boundaries (git diff text in `detect-changes.ts`, CLI argv in 4 bins, `dangling-baseline.json` file read).
- **Guard — 3 fresh `as ProcessStatusValue` casts** at `detect-changes.ts:{414, 440, 452}` applied to raw regex captures from git diff text — the very boundary that should `parseAtBoundary`.
- **Projection — one outlier** `parseAndProjectOpenQuestionList` that bypasses the shared `parseAndProject` wrapper and throws raw `ZodError` instead of `BoundaryParseError`. 14 sibling entrypoints route through the helper correctly. MCP exposes this as an inconsistent error shape to MCP clients.
- **Cli — `parseSchemaValue`** swallows `BoundaryParseError.cause`, breaking the diagnostic chain.

**Reference shapes the family already has** (don't reinvent — copy):

- `architect-cli/src/cli/pattern-graph-cli-commands.ts` — `parseCommandInput` is the family reference for `parseAtBoundary` with `cause` preserved.
- `architect-projection` `_shared/parse-and-project.internal.ts` — universal trust-boundary wrapper for projection entrypoints.
- `architect-mcp` — 1 universal `parseAtBoundary` site at the MCP request boundary.

**Definition of done:**

- Every external input boundary across the family parses through `parseAtBoundary` (or `parseAndProject` for projection-shaped entrypoints).
- Zero `as X` casts on values coming out of any boundary (git captures, file reads, argv, map lookups, MCP request payloads).
- No raw `ZodError` ever leaves a package boundary — `BoundaryParseError` with preserved `cause` is the only shape consumers see.
- The three-layer validation in `config-loader.ts` collapses to one `safeParse`.
- An ESLint rule or audit script catches `as ProcessStatusValue`-style casts on boundary outputs.

---

## Class D — FSM trust-boundary collapse _(highest-leverage single edit in the family)_

**Pattern.** The FSM defining the spec lifecycle (`idea → candidate → plan → design → executable → completed → archived`) is implemented in `architect-core/src/validation/fsm/`, consumed on the production path by `architect-guard/src/lint/process-guard/decider.ts:300`, and tested **zero times in either package**. Both packages defer testing to "the other side." A `process-guard-rules.feature` even cites a "phase-state-machine feature suite" that doesn't exist.

**Both packages cast strings to `ProcessStatusValue` at the boundary:**

- Core's `validateTransition` casts after `isValidStatusValue` already rejected — the type guard lies.
- Guard adds 3 fresh casts on raw regex captures from git diff text _before_ feeding core's already-lying validator.

**The one-line cross-package unblock:** `isValidStatusValue` already exists at `architect-core/src/validation/fsm/validator.ts` as a non-exported local; `ProcessStatusSchema` exists at `domain-enums.ts`. Adding `export` + 2 re-export lines lets:

- Guard parse boundary captures via `parseAtBoundary(StatusValueSchema, ...)`.
- Projection drop 3 `Set.has` cast sites.
- Core drop 3 `as ProcessStatusValue` lines in its own `validateTransition` via a discriminated `TransitionValidationResult` union.

**Phantom PDR-005 — 11 references across 3 packages** including the user-visible `architect-guard --help` output and `docs-sources/gherkin-patterns.md` (which propagates into generated docs). The PDR does not exist.

**Why this matters.** The FSM is a contract between two packages with zero shared test surface. The trust-boundary collapse turns a contract into a coincidence.

**Definition of done:**

- `isValidStatusValue` exported from core; `StatusValueSchema` re-exported.
- `TransitionValidationResult` is a discriminated union; consumers narrow via the discriminator, not via casts.
- Zero casts on FSM status values across core + guard + projection.
- FSM transition tests exist in both core (`tests/features/validation/fsm-transitions.feature`) and guard (`tests/features/validation/fsm-transitions-via-guard.feature`), covering legal + illegal + garbage scenarios.
- PDR-005 either authored (the FSM enforcement is decision-worthy) or all 11 references stripped in one coordinated PR. No silent reference rot.

---

## Class E — Annotation correctness _(PatternGraph honesty)_

**Pattern.** "Architect State is Code" depends on `@architect-pattern` annotations on production files being correct and present. Today the annotation rate ranges from 15% (cli) to 60% (projection) to 0% in some core subsystems. Worse, boilerplate "When to Use" text generated during a documentation pass is wrong for many files.

**Manifestations:**

- **Core — 16 annotated files carry boilerplate "When to Use" text wrong for 14 of them.**
- **Core — `transformToPatternGraph`** (the architectural backbone Phase 1 called "the strongest architectural choice") has no annotation and no JSDoc.
- **Core — `parseAtBoundary`** (the doctrine's central primitive) has no annotation and is therefore invisible to the PatternGraph and generated docs. README points to non-existent files.
- **Core — taxonomy + utils subsystems** at near-0% annotation rate. 78 source files invisible to PatternGraph.
- **Guard — `lint/steps/` 7 of 8 files + `lint/idea-tier/` 4 of 4 files unannotated.**
- **Guard — `git/` module annotated `@architect-bounded-context:generator`** — wrong; it's only consumed by `process-guard`.
- **Cli — 15% annotation rate, the family's worst.**
- **Mcp — 55%; gaps are mostly in test fixtures.**
- **Doc-genertion lies:** projection's README claims renderers are codec-agnostic; `render-markdown.ts` imports `summarizeTaxonomyDigest` and 10 fragment-aware normalizers, contradicting both the README and ADR-005.

**Definition of done:**

- An ESLint or workspace audit rule (extend `jsdoc-boilerplate-audit.mjs`) flags every exported symbol without `@architect-pattern` or an explicit exemption.
- Every annotated module's "When to Use" text matches the file's actual concern (no boilerplate carryover).
- Bounded-context annotations match the module's actual consumer set.
- Every load-bearing primitive (`transformToPatternGraph`, `parseAtBoundary`, `parseAndProject`, `dispatchByKind`, `Result`, branded types) has accurate `@architect-pattern` + relationship tags.

---

## Class F — Dead code & barrel sprawl

**Pattern.** Public barrels accumulate exports that no workspace consumer references. Wildcard re-exports (`export *`) make this invisible. The cumulative effect across the family is ~150 publicly-exported symbols with zero workspace consumers — locking in names, blocking refactors, inflating tarballs.

**Manifestations:**

- **Guard — 94% dead barrel surface.** 12 `export *` wildcards in `src/index.ts`; only 9 of ~150 exports externally consumed.
- **Core — `src/index.ts`** (272 lines, 7 wildcards) leaks scanner/extractor internals + the Class A adapters listed above.
- **Core — 10 additional dead exports** beyond the adapter list (Class A) — `markdown-parser.ts` helpers, internal `session-helpers`, fully-shadowed validators, etc.
- **Cli — entire `src/index.ts` JS API surface dead.** Cli becomes bin-only.
- **Projection — triple barrel re-export of `summarizeTaxonomyDigest`** (resolved by moving it out of the fragments contract layer, then deleting from fragments — Class H).
- **Projection — duplicate `vitest.perf-report.config.mjs`** near-identical to `vitest.config.ts`.
- **Cli + mcp — duplicate `runtime-bridge.js`** (~30 LOC each, two near-identical copies with a Windows-breaking bug).
- **`.DS_Store` files** in `packages/architect/`, `packages/architect-projection/tests/`, `packages/architect-guard/tests/.DS_Store`.

**Tarball multiplier (one line + this class):** the family base tsconfig sets `sourceMap: true, declarationMap: true`. Disabling cuts each publishable package's tarball by ~46–50% — `architect-core` 426 → ~170 files, projection 582 → ~290 files, guard 583 KB → ~315 KB, cli 52 KB → ~37 KB. The dead-code deletion compounds on top.

**Definition of done:**

- Zero `export *` in any `src/index.ts` across the family. Every barrel is explicit named exports.
- A workspace post-build audit fails when a publicly-exported symbol has zero workspace consumers and is not marked as a public API anchor in a manifest.
- `sourceMap` + `declarationMap` off family-wide in `tsconfig.architect-base.json`.
- One canonical `runtime-bridge.ts` under a workspace template; cli + mcp consume it.
- One `vitest.config.ts` per package; no near-duplicate variants.
- `.DS_Store` in repo `.gitignore`; tracked copies removed.
- README absence closed (Class L).

---

## Class G — Single-source rule violations _(duplication that has already drifted)_

**Pattern.** When the same algorithm is implemented twice, one is wrong by definition. The family has multiple cases where the duplicates have _already_ drifted — silently producing different outputs for the same input.

**Manifestations:**

- **Core — `buildRoleLookup` exists 4 times.** Two of the copies are called _inside per-tag loops_, rebuilding the map on every tag — a real allocation bug masquerading as duplication.
- **Core — two parallel `@architect-*` tag parsers** (JSDoc + Gherkin AST) implementing the same format dispatch. Should share a single `applyTagValue` applier under `taxonomy/tag-parsing.ts`; both parsers become tokenizers + applier-call.
- **Core — sync/async near-clone in `gherkin-extractor.ts`** (~135 LOC duplicated; already drifted on `unrecognizedEnums`). Keep async only; the sync wrapper exists purely for an unnecessary `existsSync`.
- **Core — `ExtractedPatternSchema` parsed three times** along the pipeline.
- **Projection — `fuzzy-match` and `extractFirstSentenceRaw` duplicated from core** in `pattern-helpers.internal.ts`.
- **Projection — `getPatternName` exists 3 times within projection** (let alone counting `architect-core`).
- **Projection — `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` duplicated** (both on the perf-gate hot path; already drifted).
- **Projection — `createStatusCounts` duplicated + 4-pass filter on the perf-gate hot path.**
- **Projection — renderer tabular helpers duplicated verbatim between markdown + UI** renderers.
- **Projection — triple-duplicated slug functions producing a real cross-renderer parity defect.** `slugForFilename` vs `slugify` produce different anchors in markdown vs UI output for the same pattern — a future user-reported "broken link" bug.
- **Projection — `parseDisclosureLevel`/`parseFilterValue`/`mergeProjectionFilter`** duplicated byte-for-byte across drifted call paths.
- **Cli — duplicate projection-filter helpers** between `generate-docs.ts` and `commands/read.ts`.
- **Cli + mcp — duplicate `runtime-bridge.js`** (also in Class F).
- **Family — `validateTransition` casts on both sides of the FSM boundary** (Class D).

**Why this matters.** Every drift here is a silent contract break — same input, different outputs, depending on which call site the consumer reached. The slug parity defect is the bite-waiting-to-happen.

**Definition of done:**

- Each duplicated helper has exactly one canonical implementation.
- Every caller imports from the canonical location (no in-package re-implementation, no copy-paste justified by "this one is slightly different").
- `madge --circular` clean (some consolidations require dependency-direction fixes — handle as part of Class H).
- The cross-renderer slug parity defect is closed: same pattern → same anchor in every output.

---

## Class H — Architectural layer correctness

**Pattern.** Several modules sit in the wrong package or the wrong layer of their package. Each instance pulls a consumer chain into the wrong dependency direction.

**Manifestations:**

- **Core hosts CLI concerns** — `cli-schema.ts` (610 LOC). Recipe: **delete** (Class A); cli already has its own help system. Cli's review verified zero consumers.
- **Core hosts projection concerns** — `src/package/` directory ships `ProjectionError` (a projection concept), and `package/` name collides with `package.json` semantics. Move to projection; rename core's directory to `workspace-package/`.
- **Core hardcodes dogfood layer hints** — `layer-inference.ts` matches `/orders/` and `/inventory/` as "domain" cues. Pure dogfood leak; delete.
- **Core hardcodes its own workspace root** — `self-hosting.ts` runs `createArchitect()` at module load. Class A overlaps.
- **Guard `git/` module** — annotated `@architect-bounded-context:generator`; actually consumed only by `process-guard/detect-changes.ts` _inside_ guard. Phase 1 said "promote to core because consumed by core"; Phase 2 verified that's false. Demote to `src/lint/process-guard/_git/`.
- **Guard — `validateCompletionMetadata` deletion in core creates a DoD gap in guard.** Either preserve the logic in guard's DoD checker before core deletes, or accept the feature loss explicitly.
- **Guard — `getDeliverableWorkflowPatterns`** belongs in core's `PatternGraphAPI`.
- **Projection — `disclosure/spec.ts` imports `ProjectionFilterSchema` from `projections/_shared/filter.ts`** — disclosure is a layer-0 primitive that should not drag application code.
- **Projection — `render-markdown.ts` imports `summarizeTaxonomyDigest` from the fragments runtime layer** — ADR-005 Rule 5 violation. The README claim "renderers operate on Fragments only" is contradicted by the code.
- **Projection — `summarizeTaxonomyDigest`** is a runtime helper inside the `fragments/` _contracts_ layer; move to `projections/`, delete from fragments.
- **Projection — 10 fragment-kind-specific normalizers inside the renderer** — codec-agnostic violation. Move per-fragment composition out of the renderer or update ADR-005 to acknowledge fragment-aware renderers.

**Definition of done:**

- Every module sits in the layer that owns its concern; the package dependency graph (`core ← projection`, `core ← guard ← cli`, `core, projection ← mcp`) is the only allowed shape.
- No cross-layer imports through internal paths — only through public contracts.
- README claims about layer/codec posture match the code (or the code matches the README and ADR-005 is updated).
- `madge --circular` clean within each package.

---

## Class I — Single-file overloads

**Pattern.** Several files have grown past the size where their internal concerns are still legible. The reviews highlight 6 specific files; each mixes 5–8 concerns and has substantial untested code paths.

**Manifestations:**

- **Projection — `render-markdown.ts` 2,227 LOC mixing 8 concerns + 10 fragment-kind normalizers.** Split target ~9 files.
- **Guard — `validate-patterns.ts` 935 LOC mixing 8 concerns** with zero tests.
- **Projection — `operational-insights/index.ts` 1,200 LOC** + **`delivery-reporting/index.ts` 742 LOC** — single-file overloads not matching the sibling per-`project*` convention.
- **Projection — `pattern-helpers.internal.ts` 515 LOC, 13 exports, 7 unrelated concerns.**
- **Cli — `generate-docs.ts` ~670 LOC, zero tests** + 112-LOC hand-rolled argv parser (Class J).
- **Core — `src/index.ts` 272 lines** with 7 wildcards (Class F).
- **Guard — `tier-a-baseline.ts` 1,138 LOC** of generated content (Class A overlap).

**Definition of done:**

- Each file ≤ ~500 LOC, or an ADR explicitly justifies the size.
- Concerns separated by directory; one canonical entry-point per directory.
- Coverage threshold met for every helper after split.

---

## Class J — Hand-rolled CLI argv & runtime hazards

**Pattern.** Several bins parse argv by hand into hand-rolled interfaces, with inline `if (next === undefined || next.startsWith('-'))` checks, `parseInt + isNaN`, and `as` casts on flag-narrowing. The family already has a Zod-first reference shape — `commands/_shared/schemas.ts` + `parseCommandInput` — that should be the only pattern in use.

**Manifestations:**

- **Cli — `generate-docs.ts` 112-LOC hand-rolled argv parser** with 6 inline checks. Same anti-pattern as guard.
- **Guard — 4 CLI bins parse argv by hand into hand-rolled interfaces** (~360 LOC); `parseInt + isNaN` × 5; zero Zod at the trust boundary.
- **Cli — 13 `as` casts** in command `execute()` flag-narrowing — curable by a `CommandDef<F>` generic.
- **Cli — 3 exit-code strategies.** Unify on one `runCliEntrypoint(main)` helper.
- **Family — `void main()` async-call sites** evade `no-suppression-comments`: 2 in cli, 3 in guard, 3 in core, 1 in mcp. Single ESLint `no-restricted-syntax` rule banning the pattern closes all 9 in one PR.
- **Cli + mcp — `runtime-bridge.js:6` Windows-breaking bug.** Two copies; `new URL(import.meta.url).pathname` returns paths with a leading `/` on Windows drive paths. Replace with `fileURLToPath(new URL('.', import.meta.url))`; consolidate to one canonical TS file under a workspace template.

**Definition of done:**

- Every CLI bin parses argv through a Zod argv schema + `parseAtBoundary`.
- Zero `as` casts in `execute()` flag-narrowing.
- One `runCliEntrypoint(main)` helper across the family.
- Zero `void main()` patterns in production `src/`; the ESLint rule banning it is in place.
- One canonical TS `runtime-bridge`; cli + mcp consume the same file; Windows path resolution is correct.

---

## Class K — Test coverage and quality gates _(automation that exists but isn't wired)_

**Pattern.** Several quality gates already exist as code, just unwired. Several load-bearing modules have zero tests. The gap is **automation**, not "we need to write a test framework."

**Wired/Unwired observations:**

- **Projection — perf gate fully implemented** (`tests/perf/compare-baseline.mjs`, 26-metric committed baseline, correct comparator) but never invoked. `package.json` doesn't reference it. **One-line wire-up.**
- **Guard — `packed-dangling-baseline-smoke.mjs` implemented but never invoked.** Wire to `prepack`. **One-line.**
- **Family — no `.github/workflows/` exists at all.** All quality gates run on developer discipline.

**Zero-coverage hot spots:**

- **Family — zero FSM tests** (Class D).
- **Cli — 22 of 24 commands have zero end-to-end tests.** `architect-generate` bin (~670 LOC) entirely untested.
- **Guard — `cli/validate-patterns.ts` 934 LOC zero tests.**
- **Guard — `derive-state.ts` 172 LOC zero tests.**
- **Guard — DoD failure paths zero tests.**
- **Guard — 4 of 5 anti-pattern sub-detectors NEVER REACHED in tests** (`features: []`).
- **Guard — `checkScopeCreep` + `checkSessionScope`** zero scenarios despite a false "verified by step bindings" claim.
- **Guard — `dangling-baseline.ts` in-process functions zero tests.**
- **Core — 23 of 25 `PatternGraphAPI` methods have no behavioral assertions.**
- **Core — all `src/utils/` modules** (including `fuzzy-match` praised in Phase 1) zero tests.
- **Core — pipeline internals, `graph-inventory` functions, `compareContexts` 145 LOC** zero tests.
- **Projection — 3 fragment kinds excluded from parametric gates** (`RoadmapTimeline`, `PatternBundleEntry`, `BusinessRuleReference`).
- **Projection — `parseAndProjectOpenQuestionList` trust-boundary path untested** (compounds C-PROJ-2).

**Test-quality items:**

- **Stale `@skip` scenarios** — cli has 4; 2 unblockable today, 2 should be deleted.
- **4 step files in core + 4 in projection** missing `AfterEachScenario`.
- **Vitest `include` pattern 3-way drift** across packages (`tests/steps/**`, `tests/features/**`, `tests/**/*.steps.ts`).
- **`patternCounter` not reset** between scenarios in core tests.
- **Test fixtures using `as unknown as ExtractedPattern`** instead of `ExtractedPatternSchema.parse`.

**Definition of done:**

- `.github/workflows/ci.yml` — pnpm install + lint + typecheck + test on PR/push, matrix `node: [20, 22]`.
- `.github/workflows/publish.yml` — tag-push trigger with OIDC provenance for `npm publish`.
- Projection perf gate runs in CI; baseline updated explicitly via committed PR, not silently.
- Guard's dangling-baseline smoke runs at `prepack` across the family (promoted to a workspace `pack-smoke.mjs`).
- FSM transition tests exist in both core and guard (Class D).
- Zero `@skip` scenarios without a tracked, dated reason. Aspirational placeholders deleted, not preserved.
- A coverage floor enforced for any module marked as a load-bearing primitive (validators, FSM, PatternGraphAPI, CLI bins, MCP tools, DoD checker).
- All step files have `AfterEachScenario`; vitest include pattern aligned across packages.

---

## Class L — Documentation truth

**Pattern.** Documentation drifts from code without anyone noticing because doc generation is partial and READMEs are absent in half the packages. Some claims in shipped docs are demonstrably false.

**Manifestations:**

- **No README** in `architect-guard`, `architect-cli`, `architect-mcp`. **Mcp is the most user-facing of the three** — MCP clients (Claude Code, Claude Desktop, etc.) integrate via tool discovery and depend heavily on metadata.
- **Projection README quickstart doesn't compile** — constructs `ProjectionContext` as `{ graph }` only; `packageResolver` is required. Any TypeScript consumer following the README hits `TS2322`.
- **Projection `docs/MIGRATION.md` claims "perf gate is now live in CI."** It isn't.
- **Projection README claims "Renderers operate on Fragments only."** Contradicted by `render-markdown.ts` importing `summarizeTaxonomyDigest` + 10 fragment-aware normalizers.
- **Core README points to dead alternatives** (`formatZodError`, `parseOrThrow`, `src/zod-primitives.ts`) and never mentions `buildPatternGraph`, `createPatternGraphAPI`, or `parseAtBoundary`.
- **Core — 16 annotated files carry boilerplate "When to Use"** wrong for 14 of them (Class E overlap).
- **AGENTS.md** cites a `ProcessGuard` symbol that doesn't exist in the guard barrel.
- **`mcp` package.json description** claims "18 tools"; 21 are registered. The frozen-inventory test catches this. AGENTS.md and the scope inherited the wrong count.
- **Phantom PDR-005** referenced 11 times across 3 packages, including in user-visible `architect-guard --help` output and `docs-sources/gherkin-patterns.md` which propagates into generated docs.
- **`ddd-inventory.md` missing 9 fragment kinds** present in `FragmentSchema`.

**Definition of done:**

- Every publishable package has a README that compiles its own examples.
- Every cited symbol in every doc actually exists in the public API at the cited path.
- Every claim about runtime behavior (perf gate, codec-agnostic renderers, tool counts, FSM enforcement decision) matches the code, or the code matches the claim.
- Phantom PDR-005 either authored or fully stripped (Class D).
- Doc-generation completeness: every fragment kind appears in `ddd-inventory.md`; every load-bearing primitive appears in generated PatternGraph docs.

---

## Class M — Build, publish, CI/CD plumbing

**Pattern.** The repo declares all the right intentions in `package.json` fields (`publishConfig.provenance: true`, `prepack` scripts, etc.) but the supporting automation doesn't exist. Every quality finding in this review becomes a developer-discipline question rather than an automation question.

**Manifestations:**

- **No `.github/workflows/` directory exists at all.** Zero CI workflows family-wide.
- **`publishConfig.provenance: true`** declared by every publishable package with no workflow to issue the attestation.
- **Core — `prepack` misplaced at JSON root** in `package.json` (silently ignored by npm/pnpm). Manual publish path ships stale `dist/`.
- **Core — `./roles` export** points to nonexistent files (install-time 404 for any consumer who follows it). Class A overlap.
- **Family — `sourceMap: true, declarationMap: true`** in `tsconfig.architect-base.json`. 50% of every tarball is `.map` files. Class F overlap.
- **`typecheck` scope drift:** 2 of 6 packages cover both `tsconfig.json` AND `tsconfig.test.json`. Guard + cli are correct; core, projection, mcp need to catch up.
- **`lint` glob drift:** core's `lint` excludes `tests/` (51 step files). Siblings include.
- **`test` chain drift:** several packages skip typechecking before tests; guard + cli + projection have variants. Pick one.
- **`module` field family-wide cosmetic.**
- **`eslint` not in core's devDeps** (relies on root hoist; siblings explicit).
- **`vitest.include` pattern 3-way drift** (Class K).
- **`node:` prefix inconsistent** in 7 files in guard; sweep family-wide.
- **Changesets has a stale ignore entry** referencing a removed package.
- **Custom audit scripts are not workspace-promoted:** projection's `options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs` (only 2 mechanical surface audits in the family) and guard's `packed-dangling-baseline-smoke.mjs` + cli's `tests/support/run-cli.ts` (the only post-pack contract test infrastructure) live in single packages.

**Definition of done:**

- `.github/workflows/ci.yml` — pnpm + lint + typecheck + test on PR/push, matrix `node: [20, 22]`, pnpm-store cache.
- `.github/workflows/publish.yml` — tag-push trigger; OIDC provenance attestation; `changeset publish` orchestration. Provenance flag becomes real.
- Single normalization PR aligns `prepack`/`lint`/`typecheck`/`test`/`module`/`eslint`/`vitest.include`/`node:` prefix across all 5 publishable packages.
- `tsconfig.architect-base.json` ships with `sourceMap: false, declarationMap: false`. Tarballs ~50% smaller family-wide.
- 4 audit scripts promoted to workspace level: `jsdoc-boilerplate-audit.mjs` (extended for Class E), `options-schema-barrel-audit.mjs` (extended with Zod 4 strictness-loss check from Class B + `parseAndProject*` outlier check from Class C), `pack-smoke.mjs` (combining guard's dangling smoke + cli's `run-cli.ts` harness, catches Class A `./roles`-shape bugs at pack time), `dead-export-audit.mjs` (catches the Class F 0-consumer cases mechanically).
- Workspace ESLint config carries the family-wide rules: `no-restricted-syntax` banning `void main()`, `no-console-log` in `src/`, `no-restricted-imports` enforcing layer boundaries, and projection's existing 4 trust-boundary AST selectors promoted family-wide.

---

## Class N — Operational correctness for long-running processes _(MCP-specific)_

**Pattern.** MCP is the family's only long-running consumer. Several patterns that are fine for one-shot CLI invocations are real correctness defects when the process lives for hours and serves many requests. These were measured during the MCP review and need to be addressed before the family advertises MCP stability.

**Manifestations:**

- **`process.chdir()` in `PipelineSessionManager.withWorkingDirectory` is not signal-safe.** SIGINT during `await operation()` leaves cwd corrupted across in-flight tool calls.
- **`server.close()` aborts in-flight tool calls mid-projection.** Shutdown handler does not await in-flight.
- **`chokidar` lacks `awaitWriteFinish`.** Bursty atomic-write IDEs trigger one wasted rebuild cycle per save.
- **`getProjectionContext()` rebuilt 19× per non-cached MCP tool call** — amplifies core's hot-path defensive copies (Class O). Cache context on session.
- **`self-hosting.ts` IIFE fires on every MCP boot** — module-load side effect in a `sideEffects: false` package. Class A deletion eliminates the cost.
- **`Reflect.set(globalThis.console, 'log', ...)` monkey-patch** in `server.ts` — a band-aid for upstream `console.log` calls in src that the family `no-console-log` ESLint rule fixes at the root.

**Definition of done:**

- `process.chdir` wrapped in a SIGINT-safe try/finally that always restores cwd.
- Graceful shutdown awaits in-flight tool calls (Promise.allSettled with a timeout).
- `awaitWriteFinish: { stabilityThreshold: 200 }` set on chokidar.
- Projection context cached on `PipelineSession`; not rebuilt per tool dispatch.
- Module-load side effects eliminated from the cold path (Class A).
- The console monkey-patch deleted after the upstream root cause is fixed (Class M ESLint rule).

---

## Class O — Performance hot-path defensive copies

**Pattern.** The read-side API defensively `structuredClone`s outputs to keep callers from mutating internal state. The graph is built once per pipeline run; cloning per read is wasted work, and one of the cloned objects can't actually be cloned because it carries a `z.function()`.

**Manifestations:**

- **Core — 27× `structuredClone` per `PatternGraphAPI` read.**
- **Core — `cloneTagRegistry` hand-rebuilds the registry** because `structuredClone` chokes on the `transform` function field. The hand-rebuild is the visible adapter; the root cause is `z.function()` in the schema (Class B).
- **Projection — `filterPatterns` unconditional `[...patterns]` copy on the no-filter path × 14 hot call sites** — projection-side analogue of the core finding.
- **Projection — Set-clone-per-frame** in `dependency-tree`.
- **Projection — `createStatusCounts` duplicated + 4-pass filter on the perf-gate hot path** (Class G overlap).

**Why this matters.** Projection has the family's only enforced perf gate (`baseline × 1.5`, 26 metrics). Once Class K wires it, the core fix here translates directly into headroom on the gate. The cli/mcp consumers benefit too — MCP especially, because it rebuilds the projection context 19× per non-cached tool call (Class N).

**Definition of done:**

- The graph + tag registry are frozen once at API construction (`deepFreeze`); no per-read cloning.
- `filterPatterns` no-op fast path on no-filter.
- Hot-path duplicates consolidated (Class G).
- Perf gate baseline re-recorded after these changes; baseline change PR is explicit, not silent.

---

## Cross-cutting systematic actions _(do these once, family-wide)_

Several "do this once across all packages" moves close many findings simultaneously. Subsequent planning sessions should treat each of these as a single workstream:

1. **One workspace base tsconfig update** (`sourceMap` + `declarationMap` off). Touches every package's tarball.
2. **One CI/CD workstream** (`ci.yml` + `publish.yml`). Activates `publishConfig.provenance` everywhere.
3. **One script normalization PR** across all 5 publishable `package.json` files (`prepack`, `lint`, `typecheck`, `test`, `module`, `eslint`, `vitest.include`, `node:` prefix sweep).
4. **One audit-script promotion** to workspace level: `jsdoc-boilerplate-audit.mjs`, `options-schema-barrel-audit.mjs` (extended), `pack-smoke.mjs` (combined), `dead-export-audit.mjs` (new but small). All ~15 LOC extensions on existing infrastructure.
5. **One workspace ESLint config** for the family rules — no `void main()`, no `console.*` in `src/`, no `export *` in barrels, no `as X` casts on boundary outputs, projection's 4 trust-boundary AST selectors family-wide.
6. **One canonical `runtime-bridge.ts`** under a workspace template; cli + mcp consume it.
7. **One coordinated phantom-PDR-005 cleanup** spanning 3 packages — either author the PDR or strip all 11 references.
8. **One coordinated FSM trust-boundary PR** — the one-line core export + the discriminated union + the `parseAtBoundary` adoption at guard's 3 sites + FSM tests in both packages.
9. **One Zod 4 strictness-loss sweep** across all packages (~4 confirmed problem sites; audit script keeps it from recurring).
10. **One `parseAtBoundary` adoption sweep** at the 4 packages currently missing it at their boundaries.

---

## Preserve list _(don't break)_

The reviews identified ~20 patterns as "family reference quality" — explicitly preserve these during cleanup. They are the templates the rest of the family should standardize on:

1. **`parseAndProject` + `parseAtBoundary` chain** (projection's `_shared/parse-and-project.internal.ts`) — trust-boundary pattern.
2. **`parseCommandInput`** (cli's `pattern-graph-cli-commands.ts`) — `parseAtBoundary` reference with `BoundaryParseError.cause` preserved.
3. **`StrictKindTable<Out, Options, Kinds>` + `dispatchByKind`** (projection) — compile-time exhaustive dispatch.
4. **`renderJson` defensive validation** (projection) — exhaustive rejection of unsafe values with JSON path in every error. Family reference for serializers.
5. **`DependencyTreeNodeSchema = z.ZodType<...>: z.strictObject({...z.lazy(...)})`** (projection) — correct Zod 4 recursive idiom.
6. **`branded.ts`** (core) — 6 brands via `z.string().brand<...>()`. Reference for the family; guard + cli + mcp should consume.
7. **`commands/_shared/schemas.ts`** (cli) + **`tool-input-schemas.ts`** (mcp) — strict-object schemas at every boundary. Zod 4 references.
8. **`createStrictReadonlyObjectSchema` helper** (mcp) — promote family-wide.
9. **`defineToolHandler<TSchema>` builder** (mcp) — type-preserving definer pattern.
10. **`Result<T, E>` discipline** at internal boundaries — family-wide; preserve.
11. **`dangling-baseline.ts:7-15`** (guard) — projection-reference template for the `tier-a-baseline` JSON migration.
12. **`packed-dangling-baseline-smoke.mjs`** (guard) + **`tests/support/run-cli.ts`** (cli) — only post-pack contract test infrastructure. Promote to workspace `pack-smoke.mjs`.
13. **`options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs`** (projection) — only mechanical surface audits. Promote to workspace.
14. **`as const satisfies T` discipline** — used correctly in 8+ sites; preserve.
15. **`z.discriminatedUnion('kind', [...])`** in projection's `FragmentSchema` over 43 kinds — reference for tagged unions.
16. **The 6-subdomain partition** in projection (`fragments/` + `projections/` mirrored) — clean modularization.
17. **Frozen-inventory tests** (mcp's 21-tool registry test) — guards against accidental drift. Already caught the "18 vs 21" doc lie.
18. **Trust-boundary lint rules** (projection's 4 architecture AST selectors in repo-root `eslint.config.mjs`) — mechanical enforcement; promote to workspace.
19. **Single-pass `transformToPatternGraph`** (core) — the architectural backbone the read API rests on. Annotate (Class E) but don't rewrite.
20. **`Result.unwrap` + discriminated `DocError` union** (core) — reference for exhaustive error handling.

---

## Suggested high-level ordering _(not a plan — a sequencing rationale)_

This is sequencing logic only. A subsequent planning session will turn this into PRs.

- **M1 — Unblockers** (Class A's hottest items + the one-line FSM core export + the broken `./roles` + `prepack` placement + maps off). Mostly deletions and 1-line fixes. Removes friction for everything else.
- **M2 — Family normalization sweep** (Class M scripts + Class F barrel curation + Class A bulk-deletion of the dead surface revealed by M1). The big "delete dead weight" PR.
- **M3 — Contract integrity** (Class B + Class C + Class D). Doctrine compliance at the boundaries. The audit scripts from M2 keep this from re-rotting.
- **M4 — Layering corrections** (Class H + Class G consolidations + Class I splits). The structural reshape that the deletions in M1/M2 made possible.
- **M5 — Documentation truth** (Class L + Class E). After M3/M4 the code matches what the docs _should_ say; now align the docs.
- **M6 — Coverage backfill + perf gate enforcement** (Class K + Class O re-baseline). Lock in the cleanup so it can't silently regress.
- **M7 — Operational hardening for MCP** (Class N). Specifically gates MCP's stability label.
- **M8 — CI/CD activation** (Class M workflows). With the audit scripts and ESLint rules from M2 in place, CI is enforcement, not discovery.

The master report's release-readiness order — **MCP first, meta with it, projection next, cli after coverage, guard after the FSM core edit, core last** — survives this re-grouping unchanged.

---

## Overall definition of done _(what "ready for 2.0 stable" means)_

The mandate is complete when the following are simultaneously true:

1. **Zero adapter / preset / compat-alias exports** anywhere in `src/`. `DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES` and every analogue is gone, not deprecated.
2. **Zero hand-written interfaces shadowing Zod schemas** at cross-package contracts. Every cross-package type derives via `z.infer`.
3. **Zero `export *` barrels** in `src/index.ts` family-wide. No 0-consumer public exports.
4. **Zero raw `ZodError` leaks** at any package boundary. `parseAtBoundary` (or `parseAndProject` for projection) is the only shape at every trust boundary.
5. **Zero casts on boundary outputs** — no `as ProcessStatusValue`, no `as UnrecognizedEnumEntry[]`, no `Map.get(...) as X` on a boundary map. Discriminated unions or type guards everywhere.
6. **Zero `.extend()/.omit()/.pick()/.partial()/.required()` chains** that don't end in `.strict()`.
7. **FSM tested** in both core and guard. PDR-005 authored or all 11 references stripped.
8. **Every package has a compile-checked README** that describes what it does and how to consume it.
9. **CI workflows exist.** `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm validate:all && pnpm architect:guard --staged` runs on every PR. Tag pushes attest provenance.
10. **Workspace audit scripts run in CI**: dead-export detection, Zod strictness-loss, JSDoc boilerplate, pack-smoke, dangling baseline.
11. **Projection's perf gate is wired and enforced.** Baseline changes land via explicit PRs.
12. **MCP is operationally safe for long-running use** — signal-safe `process.chdir`, graceful shutdown, debounced watcher, cached session context.
13. **Tarball footprint roughly halved** family-wide (CL-CORE-3 family fix + Class A deletions).
14. **~3,500 LOC net deletion** across the family with ~+200 LOC of doctrine-aligned additions (audit scripts, CI yamls, FSM tests, READMEs, missing scenarios).
15. **`madge --circular` clean** within and across packages. Dependency direction `core ← projection`, `core ← guard ← cli`, `core, projection ← mcp` is the only shape.
16. **Annotation rate ≥ 50%** across every package, with the family-reference primitives (parseAtBoundary, transformToPatternGraph, parseAndProject, FSM validator, every CLI bin, every MCP tool, every DoD checker) annotated 100%.

When all 16 are true, the family is `2.0.0` material. None of the 16 require speculative work — every recipe is already in the codebase or in the `.full-review/` reports.

---

## Pointers for validation

A planning agent investigating any class above should consult, in this order:

1. **`.full-review/99-master-report.md`** for the cross-package framing and recommended landing order.
2. **`.full-review/<package>/05-package-report.md`** for the per-package consolidated finding tables — every finding ID referenced indirectly above has a row there.
3. **`.full-review/<package>/{01,02,03,04}-*.md`** for the per-phase findings underlying the consolidated report, with file:line citations and recipe sketches.
4. **`.full-review/<package>/raw/*.md`** for the underlying agent transcripts — useful when a consolidated finding is too compact to validate against the codebase. (User note: the last few `05-package-report.md` files may have synthesis issues from context exhaustion; the raw transcripts are the fallback.)
5. **`AGENTS.md` / `CLAUDE.md`** for the engineering doctrine the cleanup must respect.
6. **`_bmad-output/planning-artifacts/architecture.md` + `epics.md` + `prd.md`** and **`analysis-report.md`** for high-level repo understanding and navigation (reverse-engineering context).
7. **`.pr-coordination/gradual-mapping/01-extraction-what-pattern-graph-extracts.md`** for the PatternGraph extraction surface — relevant when Class E annotation work needs to know what the platform actually projects from `@architect-*` annotations.

Subsequent planning sessions should expand classes into PRs with **deletion-first, single-source, doctrine-aligned** recipes. Every adapter survived because the previous fix scoped narrowly; the cleanup will only stick if each class is landed as a whole.
