# `@libar-dev/architect` Family — Root-Cause Analysis & Systematic Cleanup Plan

**Purpose:** Final pre-1.0 cleanup plan, root-cause-centric. This document supersedes the symptom-class enumeration in `CLEANUP-MANDATE.md` (which remains valid as a per-class taxonomy reference). The mandate captures *what* is wrong across 15 symptom classes; this document captures *why* the symptoms recur after 27 refactoring PRs and defines the systematic fix.

**Validated by:** four parallel deep-investigation agents auditing the four layer seams in current `main` (2026-05-18), each carrying a falsifiable hypothesis. All four hypotheses were confirmed with file-level evidence.

**Stakes:** If this cleanup fails, the codebase gets deleted and replaced with a 10×-smaller rewrite the user has already prepared. Cleanup-vs-rewrite decision criteria are in §6.

---

## 1. The validated root cause *(one sentence + the causal chain)*

> **After 27 refactoring PRs the family's *boxes* are correct (packages split, taxonomy halved, projection pipeline shaped, ADRs documented), but the *seams between boxes* were never contractualized — every layer has a Zod schema that exists alongside a hand-written interface, the interface wins because it adds runtime fields the schema can't express, and the doctrine's trust-boundary helpers are exported but used once or zero times inside the packages that export them. Cleanup PRs add new names; nothing in CI subtracts old ones. So every wave leaves residue, and the residue accumulates faster than the next wave can delete it.**

The causal chain runs through five mechanical observations, each independently confirmed:

**M1 — The Zod schemas are decorative at every cross-package contract.**
- `PatternGraphSchema` (ADR-006's single read model) is `z.object`, not `z.strictObject`. Every nested schema in the same file is also open.
- The hand-written `interface PatternGraph` *adds* `nameIndex: ReadonlyMap<...>` (line 177) — a runtime-only field Zod cannot express.
- **`PatternGraphSchema.parse` is never called on real pipeline output anywhere in `src/`** (one call exists, on a synthetic empty fallback graph in cli runtime).
- **`TagRegistrySchema.parse/safeParse` is never called in core's `src/` either** — the schema is pure decoration.
- The same pattern repeats at every seam: `BundleRouting`, `ProjectionBundle<T>`, `ProjectionContext`, `RoleDefinition`, `TagRegistry`, `RuntimePatternGraph`, the five `Parsed*` BC alias schemas, plus the type aliases in `dual-source.ts`/`errors.ts`/`branded.ts`. **In every case the interface is the load-bearing contract; the schema is theatre.**

**M2 — The doctrine's central primitive is unused by its owner.**
- `parseAtBoundary` is exported from `architect-core/src/validation/boundary.ts`.
- `grep parseAtBoundary( packages/architect-core/src/` returns **exactly one** call site (inside a util in `utils/errors.ts:21`).
- The four real extraction sites in core (`transform-dataset.ts:103`, `doc-extractor.ts:294`, `gherkin-extractor.ts:455` and `:606`) call `.safeParse` directly, bypassing the helper.
- Guard has zero `parseAtBoundary` call sites despite three explicit trust boundaries (git diff capture, CLI argv, baseline JSON read).

**M3 — Doctrine breaches in one schema cascade into adapters in every consumer.**
- `tag-registry.ts:32` declares `transform: z.function().optional()`.
- `structuredClone` cannot copy functions, so the read API needs `cloneTagRegistry` (`pattern-graph-api.ts:81-100`) to escape the function by reference.
- `cloneTagRegistry` plus 23 other `cloneValue/structuredClone` calls in `pattern-graph-api.ts` (24 total) are defensive copying around a contract that should be immutable.
- The schema can't be `parse`d at the read-API entry because the schema doesn't match the runtime shape (open + missing `nameIndex` + can't express the function).
- The whole `27× structuredClone per read` performance regression flagged across reviews is downstream of *one* `z.function()` in *one* schema. **One doctrine breach forced four adapters downstream.**

**M4 — Multiple parse points exist where one should.**
- `ExtractedPatternSchema.safeParse` is called twice in production code per pattern: once in each extractor (doc + gherkin sync + gherkin async = three sites, two paths) and **again defensively** at `transform-dataset.ts:103`.
- The defensive re-parse exists because the pipeline does not trust the prior layer to have produced a valid `ExtractedPattern`. The prior layer is *typed* as `ExtractedPattern` but the type system permits whatever the writer chose to assert.
- Sync/async pairs have already drifted: the async Gherkin extractor *silently drops* the `_unrecognizedEnums` diagnostic loop the sync variant carries.

**M5 — No subtractive CI gate.**
- Every "No-BC" PR enforces *additive* discipline (new schemas, new tags, new types). Nothing fails when an old name continues to be exported after its replacement ships.
- The smoking-gun is `config-loader.ts:188-196`: `'codec' + 'Options'` and `'referenceDoc' + 'Configs'` — string-concatenation runtime evasion proving the author *knew* a static check would catch the BC shim and chose to hide it rather than delete it.
- The repo has type-checking, ESLint, Zod boundary lint, a perf gate, and `arch dangling --strict`. It has no **workspace-consumer audit**. So every alias and every dead export survives every cleanup.

This is why **the same set of symptoms shows up in every review** despite massive deletion work: the seams aren't formal, the doctrine primitives aren't enforced, and CI doesn't catch what survives.

---

## 2. What that means for the four layer seams

The system is a chain: **annotation → ExtractedPattern → PatternGraph → ProjectionContext + Fragment → renderer output**. Each arrow is a *seam*. None of the four arrows is currently a formal, parse-once, schema-as-only-source contract. The fix is to make each seam exactly that.

### Seam S1 — Extraction → ExtractedPattern

**Current state (validated):**
- Two extractors (`DocExtractor` for TypeScript JSDoc, `GherkinExtractor` for `.feature` files) plus shape/dual-source plumbing.
- Both extractors write through informal accumulators: `Record<string, unknown>` (45 `assignIfDefined` calls + 3 quoted-key writes in `buildGherkinRawPattern`), `Map<string, unknown>` consumed by 16 `as` casts in `parseDirective`, and `extractPatternTags`'s 42-field interface with `[key: string]: unknown` escape hatch.
- Four `buildRoleLookup` implementations + four `resolveCanonicalRole` implementations (one of them on the *read* side at `read-api/pattern-helpers.ts:137`) because no layer trusts the upstream to have done canonicalization.
- `TagRegistry` is a hand-written interface in three files; the Zod schema is decorative.
- Sync/async Gherkin extractors are ~135 LOC near-clones, already drifted on diagnostics.

**The contract S1 needs:**
- One Zod schema `ExtractedPatternDraftSchema` (strict, with `_diagnostics` field) consumed at the extractor exit point.
- Both extractors emit only `ExtractedPatternDraft`; the consumer parses once via `parseAtBoundary(ExtractedPatternDraftSchema, raw, ctx)`.
- One `TagRegistry` type-of-record — `type TagRegistry = z.infer<typeof TagRegistrySchema>`. Delete the parallel interfaces in `config/tag-registry-contract.ts` and `config/role-constants.ts`. The schema becomes the only source, parsed once at registry construction, frozen thereafter.
- One canonical `TagRegistry.resolveRole(value)` method on the frozen registry, memoized. Delete all four ad-hoc `buildRoleLookup`/`resolveCanonicalRole` instances.
- Delete the sync Gherkin extractor; keep only async. The `existsSync` it was built around is itself an anti-pattern.

**Validation criterion:**
- `grep "Record<string, unknown>" packages/architect-core/src/extractor packages/architect-core/src/scanner` → zero results.
- `grep "as \(SourceFilePath\|ProcessStatusValue\|AcceptedStatusValue\|RoleId\)" packages/architect-core/src/extractor packages/architect-core/src/scanner` → zero results.
- `grep "\[key: string\]: unknown" packages/architect-core/src/scanner` → zero results.
- One `buildRoleLookup` definition in the whole monorepo.
- `ExtractedPatternDraftSchema.parse` called exactly once per pattern (at the extractor exit); `ExtractedPatternSchema` becomes a derived `z.infer` type, not a separate schema to be re-parsed.

### Seam S2 — ExtractedPattern → PatternGraph

**Current state (validated):**
- `PatternGraphSchema` is open `z.object`; `interface PatternGraph` adds `nameIndex: ReadonlyMap` and `RuntimePatternGraph` adds `workflow?`; both are runtime-only fields outside the schema.
- `transformToPatternGraph` produces the runtime shape; **`PatternGraphSchema.parse` is never called on it** (only on a synthetic empty graph as a fallback in cli runtime).
- `pattern-graph-api.ts` runs `structuredClone` 24 times per read and maintains `cloneTagRegistry` because the registry schema carries a `z.function()` field.
- FSM (`isValidStatusValue`) is non-exported; both consumers (`process-guard/decider.ts:300`, `cli/commands/_shared/structured.ts:119`) cast through a local helper before calling validator functions; the validator is never tested against raw strings.
- `parseAtBoundary` is used once in core's `src/`, in a util that callers must opt into.
- `package.json` declares an `./roles` export to nonexistent files (install-time 404).

**The contract S2 needs:**
- `PatternGraphSchema` becomes `z.strictObject` everywhere in the file (along with every nested schema).
- Decision on runtime fields: either (a) lift `nameIndex` and `workflow` into the schema (as `z.map` and a sub-schema), or (b) introduce `GraphRuntime { graph: PatternGraph; nameIndex: ...; workflow?: ... }` that the pipeline returns and the read API unwraps at its boundary. **(b) is recommended** — keeps the schema honest about what's transferable.
- Delete the parallel `interface PatternGraph`. Every consumer's import switches to `type PatternGraph = z.infer<typeof PatternGraphSchema>`. Same for `StatusGroups`, `SourceViews`, `ArchIndex`, `RelationshipEntry`.
- Replace `transform: z.function()` with `transform: z.enum(KNOWN_TRANSFORM_NAMES).optional()`. Resolution of names → functions happens inside the registry builder; the registry's *transferable* shape is fully clonable.
- `cloneTagRegistry` deletes. `clonePatternGraph` becomes `Object.freeze` plus `freeze` on the views — 27× `structuredClone` becomes 0×.
- `buildPatternGraph` ends with one `parseAtBoundary(PatternGraphSchema, runtime.graph, 'pattern-graph-build')`. This is the load-bearing change: the read-API becomes a real trust boundary.
- Export `isValidStatusValue` + `StatusValueSchema` from core. `validateTransition` returns a discriminated `TransitionValidationResult`; drop the three `as ProcessStatusValue` casts. Guard's three regex captures parse via `parseAtBoundary(StatusValueSchema, ...)`.
- Add `tests/features/validation/fsm-transitions.feature` (core) + `tests/features/validation/fsm-transitions-via-guard.feature` (guard). Scenario Outline: 4 legal + 3 illegal + 1 garbage.
- Delete the broken `./roles` export from `package.json`.

**Validation criterion:**
- `grep "z\.object(" packages/architect-core/src/validation-schemas` → zero results.
- `grep "interface PatternGraph\b" packages/architect-core/src/` → zero results.
- `grep "structuredClone\|cloneValue\|cloneTagRegistry" packages/architect-core/src/read-api/` → zero results.
- `grep "as ProcessStatusValue\|as AcceptedStatusValue" packages/architect-core/src/` → zero results.
- `parseAtBoundary` call sites in core `src/` ≥ 4 (build entry + each extractor exit + FSM).
- FSM feature scenarios ≥ 8.

### Seam S3 — PatternGraph → ProjectionContext → Fragment

**Current state (validated):**
- 15 `parseAndProject*` exports; 14 route through the shared `parseAndProject` wrapper; **one bypasses it** (`parseAndProjectOpenQuestionList` calls `OpenQuestionListOptionsSchema.parse` directly and throws raw `ZodError`).
- Many `project*` functions have no `parseAndProject*` wrapper — pattern-summary, pattern-detail, orphan-pattern-list, dependency-edges, architecture-context/comparison/neighborhood. **The trust boundary is optional, not enforced.**
- `ProjectionContext` is a hand-written interface. **131 functions consume it; zero validate it.** Two separate `createProjectionContext` factories live in the CLI (no shared factory).
- Disclosure/grouping/filtering policy is split: the registry writes a `disclosureMatrix` per doc type; the renderer (`render-markdown.ts:448-453`) re-resolves with **renderer-override-wins** and branches on `richness`/`rootShape` inside per-kind normalizers. **The contract is advisory, not load-bearing.**
- `PatternDetailSchema` strictness-loss: chain `z.strictObject` → `.omit()` → `.extend()` with no `.strict()` recovery. Zod 4 `.omit()` strips `unknownKeys`. The most-consumed fragment silently accepts extra properties.
- `summarizeTaxonomyDigest` is a runtime helper at `fragments/governance/taxonomy-digest.ts:33-45` (a `@architect-role:contract` file). `render-markdown.ts:39` imports it. ADR-005 Rule 5 violation. Triple-re-exported through three barrels.
- 10 of 43 fragments have bespoke normalizers in the renderer; the other 33 fall through to a renderer-owned generic dispatcher.

**The contract S3 needs:**
- One `ProjectionContextSchema` (strict). Two factories collapse to one. Every projection entry parses via `parseAndProject` (the wrapper becomes the *only* public way to invoke projections; direct `project*` calls become package-internal).
- Delete `parseAndProjectOpenQuestionList`'s direct `.parse` call; route through the shared wrapper.
- Fix the `PatternDetailSchema` chain with `z.strictObject({ ...Base.shape, ...newFields })` spread. Add a regression test that calls `parseAtBoundary(PatternDetailSchema, { ...valid, extraField })` and asserts rejection.
- Move `summarizeTaxonomyDigest` into `projections/`; delete from `fragments/`. Add a workspace ESLint rule banning runtime imports from `fragments/` (which is contract-only).
- Decide on disclosure ownership. The honest choice is **projection owns it; renderer is purely typographic.** Recipe: delete the `options.disclosureSpec` override path in `render-markdown.ts:448-453`. The renderer reads `bundle.routing.disclosureSpec`; if the caller wants a different disclosure level, they call the projection again with different options. This is the single-most-impactful contractual move in S3.
- For the 10 fragment-kind normalizers: either codify them as fragment-kind metadata so the registry owns the presentation policy, or retire them into the generic dispatcher with kind-specific data, not kind-specific code. **The renderer is not allowed to encode presentation policy per fragment kind.**
- `MarkdownNormalizerKind` becomes exhaustive over the 43 fragment kinds via `StrictKindTable` (existing pattern); compile-time exhaustiveness instead of silent fallback.

**Validation criterion:**
- `grep "OptionsSchema.parse\|\.parse(.*Options)" packages/architect-projection/src/projections/` → zero non-wrapper sites.
- Exactly one `createProjectionContext` factory.
- `parseAndProject` is the only export consumers use to invoke a projection (the raw `project*` exports become file-private).
- `grep "from '\.\./fragments" packages/architect-projection/src/renderers/` → zero runtime imports (type-only imports allowed).
- `grep "options\.disclosureSpec" packages/architect-projection/src/renderers/` → zero results.
- `PatternDetailSchema.parse({ valid, extraField })` rejects.
- `MarkdownNormalizerKind` equals `FragmentSchema['kind']` (verified at compile-time via `StrictKindTable`).

### Seam S4 — Fragment → renderer output

**Current state (validated):**
- Four renderers: `renderCompactText`, `renderJson`, `renderMarkdown`, `renderUi`.
- `renderJson` is the family reference for defensive validation; preserve.
- `renderMarkdown` (2,227 LOC) mixes 8 concerns plus the 10 fragment-aware normalizers + the runtime import flagged in S3 + the disclosure-override path.
- Cross-renderer slug parity defect: `slugForFilename` vs `slugify` produce different anchors in markdown vs UI for the same pattern.
- The 33 fragments without bespoke normalizers fall through to a renderer-owned generic dispatcher — meaning the renderer owns shape for 23% of fragments explicitly and the other 77% by default.

**The contract S4 needs:**
- Renderers receive `Fragment[]` plus `RendererOptions` (strict schema); they emit serialized output. They do not import from `fragments/` runtime; they do not call back into projections; they do not own disclosure decisions.
- One canonical `slugify` in `_shared/slugify.ts` used by every renderer. Cross-renderer slug parity becomes a property test: same fragment → same slug everywhere.
- `render-markdown.ts` splits along the 8 concerns (target ~9 files, mechanical, no semantic change). Per-fragment presentation lives in fragment-kind metadata or in the projection layer, not in the renderer.

**Validation criterion:**
- `renderMarkdown` ≤ 500 LOC per file across the split.
- One `slugify` function in the package.
- `grep "from '\.\./fragments" packages/architect-projection/src/renderers/` → zero results (mirror of S3 check).
- Property test: for every pattern in the dogfood graph, every renderer produces the same anchor identity for that pattern.

---

## 3. The single CI gate that prevents regression

**The workspace-consumer audit.** This is the missing mechanical leverage that lets adapters survive every "No-BC" cleanup.

The audit runs on every PR. For every symbol reachable from each publishable package's `exports` field, walk the workspace dependency graph and count consumers. Fail the build when **any** of the following is true:

1. **Zero-consumer public export.** A symbol is exported from a package's public `exports` and has zero consumers in any package outside the defining file's barrel chain. This catches `cli-schema.ts`, the entire `architect-cli/src/index.ts` JS API, the 10 dead exports in core, the `Parsed*Schema`/`Parsed*` type aliases, every `MaturityValueSchema = ...`-style relabel.

2. **Pure module-scope alias.** A symbol matches `export (const|type) [A-Z]\w+ = [A-Z]\w+;?` where the RHS is itself exported. This catches `DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES`, the four `dual-source.ts` aliases, every relabel.

3. **Runtime evasion strip.** A `.ts` file contains string concatenation whose result is later passed to `Reflect.deleteProperty` or compared to a property key. This catches the `'codec' + 'Options'` strip.

4. **Stale deletion-target marker.** A JSDoc/comment contains `deletion target` / `kept for compat` / `legacy` / `TODO remove` / `// removed` *and* the symbol has shipped in at least one release. This catches the `documentation-type-registry.ts` and `documentation-bundle.internal.ts` markers.

5. **Dogfood file in published surface.** A file matching `*self-hosting*`, `*tier-*-baseline*`, or whose top-of-file JSDoc declares `@architect-bounded-context:dogfood` is transitively reachable from a published `exports` entry. This catches `cli-schema.ts`, `presentation-contracts.ts`, `self-hosting.ts`, `tier-a-baseline.ts`, and the hardcoded `/orders/`/`/inventory/` in `layer-inference.ts`.

6. **Hand-written interface shadows a Zod schema.** A `type X = z.infer<typeof XSchema>` and an `interface X` both exist for the same `X`. The second is a doctrine breach — pick one source.

7. **Doctrine primitive imported but unused inside the defining package.** `parseAtBoundary`, `parseAndProject`, `StrictKindTable`, `Result<T,E>` exist but the defining package has zero call sites in `src/` outside the definition file. Owner must use what owner exports.

The audit is ~150 LOC, runs in <2 seconds, and fails fast. It is the single highest-leverage mechanical change in the whole cleanup because **it converts every flavor of survival into a build break**.

This audit is the precondition for all four seam contracts being durable. Without it, every adapter the cleanup deletes will be reintroduced within three PRs.

---

## 4. The Perspective / Enforcement cluster — delete

The `arch blocking` view shows ~22 patterns deadlocked. The largest cluster is `PerspectiveAwareProjections` ← `EnforcementConfiguration` plus dependent perspective specs.

**These specs target deleted file paths.** They reference `src/api/pattern-graph-api.ts`, `src/generators/pipeline/transform-dataset.ts`, `src/renderable/codecs/{patterns,session,timeline,planning,...}.ts`, `src/mcp/tool-registry.ts`, and `src/lint/process-guard/`. None of these paths exist anymore — they were deleted across PRs #15/#17/#22/#28/#31. The specs are pre-W1.5 plan-tier work that nobody re-targeted to the new package layout. `scope-validate` is blocked because the listed deliverables don't exist.

**Worse, what they propose adds policy at the wrong seam.** "Perspective filtering at codec defaults" puts a new policy axis at the consumer boundary — exactly the layer that S3/S4 are removing policy *from*. If the work landed, it would be a fifth source of doc-gen presentation decisions on top of the four that already conflict.

**Recipe:** the kernel PR (§5) deletes the `Perspective*` and `EnforcementConfiguration` design specs. If a perspective-filtering capability is genuinely wanted later, it gets re-authored at idea/candidate tier *after* S3 contractualizes the projection boundary — as a perspective registry consumed by `parseAndProject`, not as a renderer-side filter.

Deleting these specs unblocks ~5 patterns immediately, breaks no consumer (the specs ship nothing), and removes a stale planning artifact that would otherwise pollute future planning sessions.

---

## 5. Systematic cleanup plan — six PRs

The plan is sequenced so that the kernel PR unblocks the four sweep PRs, and the dead-code sweep at the end is enabled by the audit script the kernel installs.

### PR-K — Kernel (the contract-and-audit PR)

**One PR, ~1 week of focused work.** Lands all of the following together:

1. **Workspace-consumer audit script** (§3). Wired into CI as a required check on every PR. Promoted from a one-off audit to the doctrine's mechanical floor.
2. **One-line FSM core export** (`export function isValidStatusValue` + `export { ProcessStatusSchema as StatusValueSchema } from '../domain-enums.js'`). The cross-package unblock.
3. **The four seam-schema draft definitions:**
   - `ExtractedPatternDraftSchema` (S1) — even if extractors don't yet use it, the schema lands so subsequent PRs can adopt it.
   - `PatternGraphSchema` rewritten as strict + `GraphRuntime` boundary type (S2).
   - `ProjectionContextSchema` (S3) — even if consumers don't yet parse against it, the schema lands.
   - `RendererOptionsSchema` (S4).
4. **Tarball + script normalization:**
   - `sourceMap: false, declarationMap: false` in `tsconfig.architect-base.json`.
   - `prepack` at `scripts` not at root of `package.json` (core fix).
   - Family-wide `package.json` script normalization (`lint`, `typecheck`, `test`, `vitest.include`, `node:` prefix).
   - Delete the broken `./roles` export.
5. **Delete the Perspective / Enforcement specs** (§4). Single coordinated deletion.
6. **Delete `cli-schema.ts` from core** (verified zero workspace consumers). Drop `architect-cli/src/index.ts` (verified dead). Drop the 10 confirmed-dead exports.
7. **Phantom PDR-005 decision.** Author PDR-005 (the FSM enforcement is decision-worthy) or strip all 11 references. One or the other in this PR.
8. **`.github/workflows/ci.yml` + `publish.yml`.** Provenance attestation activates here.

The audit script in step 1 is the gate that makes every subsequent PR easier. The deletions in steps 5-6 are mass deletions enabled by the audit having proven zero consumers.

### PR-1 — Adopt the S1 contract (extraction)

**One PR per package, ~1 week.** Targets `architect-core`.

- Both extractors emit `ExtractedPatternDraft`, parsed via `parseAtBoundary(ExtractedPatternDraftSchema, raw)`.
- Delete `buildGherkinRawPattern`'s `Record<string, unknown>` accumulator. The sync Gherkin extractor disappears.
- One `buildRoleLookup` + one `resolveCanonicalRole` in the workspace.
- `extractPatternTags` returns a strict schema (no index signature). The 16 `Map.get(...) as X` casts in `parseDirective` go away.
- `TagRegistrySchema` becomes the only type-of-record; delete `config/tag-registry-contract.ts` and the parallel interface in `config/role-constants.ts`.
- `transform: z.function()` becomes `transform: z.enum(KNOWN_TRANSFORM_NAMES)`. Functions resolved inside the registry builder.
- `cloneTagRegistry` deletes.
- Replace `DDD_ES_CQRS_ROLES` / `DEFAULT_ROLES` with one canonical `BUILTIN_ROLES` consumed by the dogfood config; delete the others.
- Audit script enforces zero `Record<string, unknown>` and zero `[key: string]: unknown` in extractor + scanner.

### PR-2 — Adopt the S2 contract (graph + read-API)

**One PR, ~1 week.** Targets `architect-core` + `architect-guard` + `architect-projection`.

- `PatternGraphSchema` strict throughout. Hand-written `interface PatternGraph` deleted. Consumers switch to `z.infer`.
- `GraphRuntime { graph: PatternGraph; nameIndex: ...; workflow?: ... }` introduced as the pipeline's return type; read-API unwraps at its boundary.
- `buildPatternGraph` ends with one `parseAtBoundary(PatternGraphSchema, runtime.graph)`.
- `cloneValue/structuredClone` calls in `pattern-graph-api.ts` replaced with `Object.freeze` + frozen views. 27× → 0×.
- Discriminated `TransitionValidationResult`; FSM tests in core + guard; `parseAtBoundary(StatusValueSchema, capture)` at guard's three boundary sites.
- Projection's three `Set.has` cast sites use the now-exported `isValidStatusValue`.

### PR-3 — Adopt the S3 contract (projection)

**One PR, ~1 week.** Targets `architect-projection`.

- `ProjectionContextSchema` strict; one factory; every projection parses via `parseAndProject`.
- The one outlier (`parseAndProjectOpenQuestionList`) routes through the shared wrapper.
- Direct `project*` exports become file-private; `parseAndProject` is the only public way to invoke a projection.
- `summarizeTaxonomyDigest` moves to `projections/`; deleted from `fragments/`.
- `render-markdown.ts:448-453` disclosure-override path **deleted**. Renderer reads only `bundle.routing.disclosureSpec`. If callers want a different disclosure, they call the projection again.
- 10 fragment-kind normalizers either move to fragment-kind metadata (registry owns the presentation) or merge into the generic dispatcher.
- `PatternDetailSchema` chain rewritten as `z.strictObject({ ...Base.shape, ...newFields })`. Regression test: `parseAtBoundary` rejects `{ valid, extraField }`.
- `MarkdownNormalizerKind` exhaustive over 43 kinds via `StrictKindTable`.
- `documentation-type-registry.ts` Proxy facade DELETED. The replacement `DocDefinition.build` pattern (referenced in the deletion-target marker) lands here.
- Perf gate WIRED in `package.json`. Re-baseline after the read-API defensive-copy deletion (PR-2).

### PR-4 — Adopt the S4 contract (renderer)

**One PR, ~3-5 days.** Targets `architect-projection`.

- `render-markdown.ts` split across 8 concerns.
- One `slugify` in `_shared/slugify.ts`. Cross-renderer parity property test.
- Zero runtime imports from `fragments/` in any renderer. ESLint rule enforces.
- `RendererOptionsSchema` strict; renderers consume options through one parse boundary.

### PR-D — Final dead-code mass-deletion (audit-enabled)

**One PR per package, parallelizable, ~3 days total.** Each runs the audit and deletes whatever the audit flags as zero-consumer that wasn't already deleted in PR-K through PR-4.

- The 5 BC schema aliases in `feature.ts` + their 5 type aliases.
- The 9 type-only aliases (`branded.ts`, `errors.ts` × 2, `tag-registry.ts`, `doc-directive.ts`, `dual-source.ts` × 4, `documentation-type-registry.ts`).
- Wave-residue `LOCKED_WAVE_ONE_ROLES` → renamed `BUILTIN_ROLES` (or whatever the audit names it); the aliases `DDD_ES_CQRS_ROLES` + `DEFAULT_ROLES` deleted.
- The parser branches for deprecated `@architect-arch-*` tags in `ast-parser.ts:310-316` + `gherkin-ast-parser.ts:441-475`.
- The two `runtime-bridge.js` copies → one canonical `runtime-bridge.ts` under a workspace template.
- `tier-a-baseline.ts` migrated to JSON (following the `dangling-baseline.json` template that already exists).
- `self-hosting.ts` symbols moved to repo-root `architect.config.ts`; deleted from core's `src/`.
- `presentation-contracts.ts` deleted entirely. The obfuscated `'codec' + 'Options'` strip in `config-loader.ts:188-196` deleted.
- The hardcoded `/orders/` and `/inventory/` heuristics in `layer-inference.ts` deleted.
- READMEs for `architect-guard`, `architect-cli`, `architect-mcp` written.

**Total scope: 6 PRs, ~5-6 weeks of focused work for one engineer, parallelizable to 3-4 weeks for a pair.**

---

## 6. Cleanup vs rewrite — the honest decision

The user has prepared a 10×-smaller-scope rewrite as a fallback. The question: is the cleanup above worth ~5-6 weeks compared to whatever the rewrite takes?

**The cleanup wins if and only if:**

1. **The doctrine is correct and the patterns to copy from exist in the codebase.** Both are true. `parseAndProject + parseAtBoundary` is the right shape; `StrictKindTable` + `dispatchByKind` is the right shape; `Result<T,E>` is the right shape; branded types are the right shape; `renderJson`'s defensive validation is the right shape; the `Fragment` discriminated union over 43 kinds is the right shape. The cleanup applies these *existing* patterns to the seams that don't yet use them. **The cleanup is not a redesign; it is finishing a design already in flight.**

2. **The downstream consumers (Architect Studio desktop/web/CI) can absorb 2.0 breaking changes.** The user has said yes (No-BC posture is policy). The operational surface (CLI verbs + MCP tools + projection outputs) is stable; only the JS API on `@libar-dev/architect-core` and siblings breaks. Most downstream code consumes the operational surface.

3. **The dogfood patterns (262 delivery patterns + 116 completed) carry valuable history.** The PatternGraph itself is the institutional memory of the project. Throwing it away to rewrite the surrounding code is throwing away the dogfood. The cleanup preserves it; the rewrite re-extracts everything from current source.

4. **The 27 PRs of cleanup work were not wasted.** They removed real cruft, established the projection pipeline shape, halved the taxonomy, split the package. The 4 seam contracts are the *next* PR-set's worth of work, not the *replacement* for what was done.

**The rewrite wins if:**

- The user is psychologically out of budget for "one more refactoring effort" (a non-technical reason but a real one).
- The audit gate in §3 turns out to be unimplementable in <300 LOC (it should be ~150; if it isn't, the cleanup loses its mechanical floor).
- The 10×-smaller scope explicitly excludes the dogfood-patterns + the 27-directive annotation grammar + the dual-source extractor — i.e., the rewrite isn't reproducing the part of the system that's actually working.

**Recommended decision criterion:**

- Spend ~3 days on **PR-K's first three items only**: the audit script, the FSM one-line export, and the four seam-schema drafts. These three items are the load-bearing infrastructure for everything else. If they land cleanly in 3 days, the cleanup is feasible — proceed with the rest. If they take 2 weeks, the rewrite is cheaper.
- If proceeding, **set a hard 6-week timer** on the full plan. If PR-D hasn't landed by then, stop and switch to the rewrite. Time-box the rescue.

---

## 7. What to preserve *(don't break during cleanup)*

The cleanup is finishing a design already in the codebase. These patterns are the reference shapes the seams must adopt:

1. **`parseAndProject` + `parseAtBoundary` chain** — trust-boundary pattern. Promote to family-wide.
2. **`StrictKindTable<Out, Options, Kinds>` + `dispatchByKind`** — compile-time exhaustive dispatch.
3. **`renderJson` defensive validation** — exhaustive rejection with JSON path in every error.
4. **`Result<T, E>` + discriminated `DocError` union** — exhaustive error handling.
5. **`z.string().brand<...>()` for `PatternId` / `SourceFilePath` / etc.** — preserve and consume across siblings.
6. **`commands/_shared/schemas.ts` (cli) + `tool-input-schemas.ts` (mcp)** — strict-object schemas at every boundary.
7. **`createStrictReadonlyObjectSchema` helper (mcp)** — promote family-wide.
8. **`defineToolHandler<TSchema>` builder (mcp)** — type-preserving definer pattern.
9. **Frozen-inventory test (mcp's 21-tool registry test)** — already caught the "18 vs 21" doc lie. Promote the shape.
10. **`dangling-baseline.ts` template (guard)** — `tier-a-baseline.ts` migration follows this shape.
11. **`packed-dangling-baseline-smoke.mjs` (guard) + `tests/support/run-cli.ts` (cli)** — post-pack contract test infrastructure. Combine to workspace `pack-smoke.mjs`.
12. **`options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs` (projection)** — only mechanical surface audits in the family. Folded into the workspace-consumer audit (§3).
13. **`z.discriminatedUnion('kind', [...])` over 43 fragment kinds (`FragmentSchema`)** — reference for tagged unions.
14. **`DependencyTreeNodeSchema = z.ZodType<...>: z.strictObject({...z.lazy(...)})`** — correct Zod 4 recursive idiom.
15. **6-subdomain partition in projection (`fragments/` + `projections/` mirrored)** — clean modularization.
16. **`as const satisfies T` discipline** + 147 `import type` declarations + zero `node:`-unprefixed legacy imports in projection — ESM hygiene reference.
17. **Single-pass `transformToPatternGraph`** — the architectural backbone the read API rests on. Annotate (Class E) but don't rewrite.
18. **The 27-directive annotation grammar + 30-tag taxonomy** — three years of iteration; do not redesign.
19. **The composite `bundle <Pattern> --mode <session>` CLI verb (PR #35)** — the right shape for downstream consumers.
20. **The frozen `dangling-baseline.json` workflow** — exemplary "baseline + strict drift detection" pattern.

---

## 8. Validation pointers *(how to verify the root cause against current code)*

Anyone who wants to verify the analysis above should reproduce the four agent findings:

1. **M1 (decorative schemas):** `grep -n "z\.object(" packages/architect-core/src/validation-schemas/pattern-graph.ts` — confirm `:106-123` and nested. Then `grep -rn "PatternGraphSchema\.\(parse\|safeParse\)" packages/architect-core/src/` — confirm zero non-test, non-fallback sites.

2. **M2 (unused doctrine primitive):** `grep -rn "parseAtBoundary(" packages/architect-core/src/` — confirm exactly one call site outside the definition.

3. **M3 (cascade):** read `packages/architect-core/src/validation-schemas/tag-registry.ts:32` (`z.function().optional()`) then `packages/architect-core/src/read-api/pattern-graph-api.ts:81-100` (`cloneTagRegistry`). The causal arrow is the line `transform: tag.transform` (line ~95) — the function escaping by reference.

4. **M4 (multiple parses):** `grep -rn "ExtractedPatternSchema\.\(safeParse\|parse\)" packages/architect-core/src/` — confirm sites in `doc-extractor.ts:294`, `gherkin-extractor.ts:455`, `:606`, `transform-dataset.ts:103`.

5. **M5 (no subtractive gate):** read `packages/architect-core/src/config/config-loader.ts:188-196`. The `'codec' + 'Options'` string concatenation is the smoking gun.

6. **Validate the DDD_ES_CQRS_ROLES survival:** `cat packages/architect-core/src/config/role-constants.ts:64-72` and `grep -rn DDD_ES_CQRS_ROLES packages/` to confirm zero non-barrel consumers.

7. **Validate the Perspective/Enforcement deadlock:** `pnpm architect:query arch blocking | head -30` (the data API shows the cluster). Then `cat architect/specs/perspective-aware-projections.feature | grep -i "src/"` to see the cited file paths; `ls packages/architect-core/src/api packages/architect-core/src/renderable 2>&1` confirms they don't exist.

8. **Validate the doc-gen split policy:** `grep -n "disclosureSpec" packages/architect-projection/src/renderers/render-markdown.ts` — see lines 240-453, especially `:448-453` (the override path).

The Data API (`pnpm architect:query ...`) is the canonical source for pattern/graph state. Use it for everything except investigating the *implementation* (where Read/Grep on `packages/*/src/` is correct, because you're auditing the code behind the data API).

---

## 9. Closing note

The architect family is the user's only project that grew organically rather than being architected up-front. After 27 refactoring PRs the boxes are correct — the seams just have never been designed. **Designing the four seams is one PR-set's worth of work, not a rewrite, and the audit gate in §3 is what makes it stick.** If the kernel PR (§5 PR-K) lands cleanly in 3 days, the rest of the cleanup is mechanical sweeps with a clear definition of done. If it doesn't, the 10× rewrite is the right answer.

The most important commitment is the audit gate. Without it, no amount of cleanup survives the next refactor.
