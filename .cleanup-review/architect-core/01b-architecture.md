# Architecture Review — `@libar-dev/architect-core`

Scope: `packages/architect-core/src/**` (106 TS, ~9.7k LOC). Anchored to ADR-003 (Source-First Pattern Architecture), ADR-006 (Single Read Model), ADR-007 (Coordinated Taxonomy Redesign), ADR-009 (Projection Trust Boundary), and the engineering doctrine in `CLAUDE.md` (no-BC, Zod-first, no circular imports, strict TS).

Read-only review. Findings anchored to ADRs and grouped by severity.

---

## Critical

### C-1. Inverted dependency: `extractor/` and `generators/pipeline/` import from `read-api/`

**Architectural impact.** `read-api/` is declared in the scope file as the egress surface — the read-side projection over `PatternGraph`. `extractor/` and `generators/pipeline/` are the producers that build the graph. Producers depending on consumers inverts the layering and creates a logical cycle (the read model is meant to be a projection *off* extraction, not a dependency *of* extraction).

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts:28` — `import { getPatternName } from '../read-api/pattern-helpers.js';`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/dual-source-extractor.ts:13` — same import.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/merge-patterns.ts:4` — `import { getPatternName } from '../../read-api/pattern-helpers.js';`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-dataset.ts:2` — same import.

**ADR / doctrine.** Violates the layering stated in `00-scope.md` ("`read-api/` is the egress surface"), and the no-circular-imports rule in `CLAUDE.md`. The TS compiler currently tolerates it because `getPatternName` is a leaf helper, but it is a structural cycle that will trip strict module graph analysis the moment any read-api helper grows a transitive dep on extractor types.

**Recommendation.** `getPatternName` is a 2-line function (`p.patternName ?? p.name`). Move it to `validation-schemas/extracted-pattern.ts` (next to the schema that defines those fields) or to `types/`. Then `read-api/pattern-helpers.ts` re-exports for backward compatibility — but per no-BC, just update the producer imports directly and delete the read-api copy.

**Trade-offs.** Trivial mechanical change. The only cost is updating ~4 import lines; no behavior change.

---

### C-2. ADR-006 Lossy Local Type — `PatternDependencies` / `PatternRelationships` / `ProtectionInfo` in `read-api/types.ts`

**Architectural impact.** ADR-006 §Anti-patterns explicitly names "Lossy Local Type" — a DTO that duplicates a subset of an extracted-pattern / pattern-graph schema with a hand-written extractor. `read-api/types.ts` defines three such hand-written interfaces that mirror canonical schemas, and the `PatternGraphAPI` implementation literally hand-projects fields one-by-one from the canonical `RelationshipEntry` and `Deliverable` into these mirrors.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/types.ts:82-100` — `PatternDependencies` and `PatternRelationships` mirror a subset of `RelationshipEntry` (defined in `validation-schemas/pattern-graph.ts:83`).
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/types.ts:125-131` — `ProtectionInfo` redeclares `level: 'none' | 'scope' | 'hard'` instead of reusing `ProtectionLevel` from `validation/fsm/states.ts:16`.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-graph-api.ts:200-222` — `getPatternDependencies`/`getPatternRelationships` hand-project six-to-ten fields from the canonical entry; `getPatternDeliverables` does the same for `Deliverable`.

**ADR / doctrine.** ADR-006 §Anti-patterns ("Lossy Local Type"); Zod-first doctrine ("Types flow from schemas. Hand-written aliases that diverge are bugs.").

**Recommendation.**
- Replace `PatternDependencies` / `PatternRelationships` with `Pick<RelationshipEntry, ...>` types (or just expose `RelationshipEntry` directly — that *is* the canonical shape).
- Replace `ProtectionInfo.level` with `ProtectionLevel` imported from `validation/fsm/states.ts`.
- `getPatternDeliverables` already returns `Deliverable` shape — just `return [...pattern.deliverables ?? []]` instead of `.map(d => ({...all the fields}))`.

**Trade-offs.** The mirrors are currently a stable public type for consumers. Removing them is a breaking change — but no-BC says break and document, do not alias.

---

### C-3. Triple/quadruple aliasing of the status schema

**Architectural impact.** ADR-007 fixed the taxonomy precisely so that `AcceptedStatusValue` (5 values, extraction boundary) and `ProcessStatusValue` (4 values, FSM) are the **two** named primitives. Today there are at least **five** names for the 5-value status enum reachable from the public barrel, and the existence of these aliases hides the boundary that ADR-007 created.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/domain-enums.ts:25-27`
  ```ts
  export const AcceptedStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
  export const ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES);
  export const StatusValueSchema = AcceptedStatusSchema;   // alias
  ```
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/doc-directive.ts:33-35`
  ```ts
  export const DefaultPatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
  export const AcceptedPatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);  // unused
  export const PatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
  ```
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/states.ts:41` re-exports `StatusValueSchema` from `domain-enums.ts` and `validation/fsm/index.ts:5` re-exports it again.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/dual-source.ts:15-16`
  ```ts
  export type ProcessStatus = ProcessStatusValue;   // hand-written alias
  export type AcceptedStatus = AcceptedStatusValue; // hand-written alias
  ```
- `AcceptedPatternStatusSchema` is defined but exported nowhere — **dead public surface**.

**ADR / doctrine.** Violates No-BC ("Never add backward-compatibility aliases (re-export of an old name from a new location, parallel implementations behind a flag)"). Violates ADR-007 — the whole point of two named primitives is that the type system enforces which boundary you are crossing.

**Recommendation.** Pick the canonical pair: `AcceptedStatusSchema` (5 values) and `ProcessStatusSchema` (4 values), defined once in `domain-enums.ts`. Delete:
- `StatusValueSchema`, `DefaultPatternStatusSchema`, `PatternStatusSchema`, `AcceptedPatternStatusSchema` everywhere they appear.
- `type PatternStatus = AcceptedStatusValue` in `doc-directive.ts:36`.
- `type ProcessStatus` and `type AcceptedStatus` in `dual-source.ts:15-16`.

**Trade-offs.** Several external imports use the alias names (`StatusValueSchema` is used in `architect-projection`). Breaking change — but no-BC says break and document.

---

## High

### H-1. Public barrel uses six `export *` statements — internal types accidentally public

**Architectural impact.** The package's public surface (`packages/architect-core/src/index.ts`) does both explicit named exports *and* six `export * from './<subtree>/index.js'` re-exports. The net effect is that every symbol in `types/`, `validation-schemas/`, `validation/fsm/`, `scanner/`, `extractor/`, `utils/`, and `read-api/` is part of the package's stable public API by default, regardless of whether the author intended it. This is a primary cause of surface bloat — there is no explicit "what we promise" list to point at.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/index.ts:1, 192, 204, 205, 206, 223, 224`
  ```ts
  export * from './types/index.js';
  export * from './validation-schemas/index.js';
  export * from './validation/fsm/index.js';
  export * from './scanner/index.js';
  export * from './extractor/index.js';
  export * from './utils/index.js';
  export * from './read-api/index.js';
  ```

**ADR / doctrine.** ADR-006 implicitly: the named exceptions list in ADR-006 only exists because *anything* downstream can reach into the raw scanner/extractor surface. Wide `export *` makes the named-exceptions discipline difficult to enforce mechanically — there is no choke-point.

**Recommendation.** Replace each `export *` with an explicit named list. Producing the list is mechanical (the TS compiler can enumerate it) but the discipline lasts: every future addition is an intentional public-API choice. As a follow-up, mark scanner/extractor exports with a doc-comment ("Stage-1 consumers only — see ADR-006 named exceptions").

**Trade-offs.** One-time effort to enumerate ~150-200 named exports. Worth it: the explicit list is the artifact that makes the trust boundary visible.

---

### H-2. `read-api/pattern-classification.ts` re-exports pipeline internals as public read-api surface

**Architectural impact.** `pattern-classification.ts` (a read-api module) imports `relationshipResolver` (a `generators/pipeline/` internal) and then re-exports three of its functions verbatim:

```ts
export const buildDeclaredPatternIndex = relationshipResolver.buildDeclaredPatternIndex;
export const inferPackageId = relationshipResolver.inferPackageId;
export const resolveUsesTarget = relationshipResolver.resolveUsesTarget;
```

These three functions are not consumed anywhere outside core (verified by repo-wide grep). They are *pure* pipeline machinery — they have no business on the read-api surface. The single read-api function that legitimately uses them (`classifyEdgeExternality`) wraps them; re-exporting the building blocks alongside the wrapper invites callers to bypass the wrapper.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-classification.ts:75-77` — re-exports.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/index.ts:44-50` — re-exports them from the read-api barrel.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/index.ts:225` — re-exported again via `export * from './read-api/index.js'`.
- Cross-package usage of `buildDeclaredPatternIndex` / `inferPackageId` / `resolveUsesTarget`: **none**.

**ADR / doctrine.** ADR-006 (Single Read Model — read-api is the egress surface, not a republishing point for pipeline internals). No-BC (parallel-impl-by-re-export).

**Recommendation.** Delete lines 75-79 in `pattern-classification.ts` and the matching entries in `read-api/index.ts`. Keep only `classifyEdgeExternality` and its type. If a future caller needs `inferPackageId` outside the pipeline, promote it deliberately with an ADR.

**Trade-offs.** None — these are dead exports today.

---

### H-3. Layering inversion: `config/` depends on `generators/pipeline/`

**Architectural impact.** Three modules in `config/` import the `ContextInferenceRule` type from `generators/pipeline/context-inference.js`. Meanwhile `generators/pipeline/build-pipeline.ts` imports `loadConfig` from `config/config-loader.js`. The dependency direction goes both ways through different files, creating a logical cycle that the TS module loader only avoids because one direction is type-only.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/types.ts:1` — `import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/defaults.ts:2` — same.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/project-config.ts:1` — same.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/resolve-config.ts:1` — same.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/build-pipeline.ts:43` — `import { loadConfig, formatConfigError } from '../../config/config-loader.js';`

`ContextInferenceRule` is a **3-line interface** (`pattern: string; context: string`) — it has no business living under `generators/pipeline/`.

**ADR / doctrine.** No-circular-imports doctrine (`CLAUDE.md`); the structural intent ("config/ is a leaf input to the pipeline").

**Recommendation.** Move `ContextInferenceRule` interface (and the `inferContext` function alongside it) into `config/` (or a new `config/context-inference.ts`). The pipeline imports from config; config no longer imports from pipeline. The `inferContext` function is currently used by `generators/pipeline/transform-dataset.ts:13` — that's a fine consumer of a config-owned utility.

**Trade-offs.** One small file move + import updates. Public-barrel re-export path may need adjusting.

---

### H-4. ADR-007 leftovers: `archRole`, `usecase`, `roadmapSpec` extracted but never read

**Architectural impact.** ADR-007 unified `@architect-role` and explicitly removes `@architect-arch-role`. The Gherkin scanner still **extracts** the deprecated `archRole` value (line 728) into the `FeatureTagMetadata` schema (line 152) and the `DocDirectiveSchema` (line 79), but nothing downstream reads it. Same situation for `usecase` and `roadmapSpec`. The "silent drops in extraction are the bug ADR-007 §Context was created to fix" — but the opposite anti-pattern is now in place: **silent passes**. A field is preserved through the trust boundary but has no consumer, creating doctrinal noise and bait for future hand-written extractors.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts:152` (schema field), :499 (variable), :727-728 (switch case), :788 (output).
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts:151, 154` (schema), :498, :501 (vars), :724-725, :730-731 (switch cases), :787, :790 (output).
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/doc-directive.ts:79` — `archRole: z.string().optional()`.
- Cross-package grep of `\.archRole\b` / `\.roadmapSpec\b` / `\.usecase\b` returns no consumers.

**ADR / doctrine.** ADR-007 §Context (extraction must not drop information that ADR-007 deprecated *and* it must not preserve information that ADR-007 invalidated — both are bugs).

**Recommendation.** Per ADR-007's deprecation flow: route `@architect-arch-role` through `_deprecatedTags`/`createDeprecatedTagDiagnostic` (the path `gherkin-extractor.ts:128-160` already takes for `arch-role:`/`arch-context:`/`arch-layer:`). Then drop the dedicated `archRole` collection. Same treatment for `usecase` and `roadmapSpec` — either route to deprecated-tag diagnostic, or document a sanctioned consumer.

**Trade-offs.** If `usecase` / `roadmapSpec` are intended for a near-future consumer, document the target with an `@architect-target` reference; otherwise delete. ADR-007's silent-drops invariant cuts both ways.

---

### H-5. `ValidationSummary` declared twice with different shapes, both publicly exported

**Architectural impact.** Two different `ValidationSummary` interfaces are exported from `@libar-dev/architect-core`. They mean different things and have incompatible shapes. The barrel resolves to whichever one `export * from './validation-schemas/index.js'` lands second (since `generators/pipeline/index.ts` is also re-exported); consumers cannot rely on which one they get without explicit qualification.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/dual-source.ts:69-75` — `ValidationSummary` = `{ isValid, errors, warnings }`.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-types.ts:14-19` — `ValidationSummary` = `{ totalPatterns, danglingReferences, unknownStatuses, warningCount }`.
- Both reachable from `index.ts:192` and `index.ts:207-222`.

**ADR / doctrine.** Zod-first ("Types flow from schemas. Hand-written aliases that diverge are bugs"). Two same-named types with divergent meanings is the bug case the doctrine warns about.

**Recommendation.** Rename the pipeline one to `TransformValidationSummary` (it describes the transform-dataset step's validation surface) and keep `ValidationSummary` for the dual-source semantic-validation context where it originated. Or invert — whichever name better fits the dominant external use. Either way: one name, one shape.

**Trade-offs.** Breaking change for one consumer name. Necessary.

---

### H-6. `RuntimePatternGraph` is a needless alias of `PatternGraph`

**Architectural impact.** `RuntimePatternGraph` is declared as `export type RuntimePatternGraph = PatternGraph;` in `generators/pipeline/transform-types.ts:26`. Both names are exported from `@libar-dev/architect-core`. Consumers across `architect-cli`, `architect-mcp`, `architect-guard` use `RuntimePatternGraph` *and* `PatternGraph` interchangeably in the same files. ADR-006 names exactly one read model — `PatternGraph`.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-types.ts:26` — alias declaration.
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/cli/pattern-graph-cli-types.ts:8, 56` uses `RuntimePatternGraph`; nearby files use `PatternGraph`.
- `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/cli/validate-patterns.ts:57, 385, 417` uses `RuntimePatternGraph`.

**ADR / doctrine.** ADR-006 (single read model — one name). No-BC (parallel name).

**Recommendation.** Delete `RuntimePatternGraph`. Replace consumers with `PatternGraph`. One canonical name across the workspace.

**Trade-offs.** Mechanical rename across ~5-8 sites.

---

### H-7. `validation-schemas/output-schemas.ts` imports from `extractor/` (leaf folder depends on producer)

**Architectural impact.** `validation-schemas/` should be a leaf — schemas + inferred types only. `output-schemas.ts` imports `EXTRACTION_DIAGNOSTIC_CODES` / `EXTRACTION_DIAGNOSTIC_SEVERITIES` from `extractor/extraction-diagnostics.js`. That coupling means a change to extraction diagnostics code shapes can break the validation-schemas leaf, and any schema-only consumer transitively pulls in extractor code.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/output-schemas.ts:4-7`
  ```ts
  import {
    EXTRACTION_DIAGNOSTIC_CODES,
    EXTRACTION_DIAGNOSTIC_SEVERITIES,
  } from '../extractor/extraction-diagnostics.js';
  ```

**ADR / doctrine.** Layering ("`validation-schemas/` are leaves; `scanner/` and `extractor/` produce inputs"). Also Zod-first — diagnostic codes belong in the same schema file that defines the canonical enum.

**Recommendation.** Move `EXTRACTION_DIAGNOSTIC_CODES` and `EXTRACTION_DIAGNOSTIC_SEVERITIES` constants to `validation-schemas/` (alongside the output schema that uses them), or to `taxonomy/`. `extractor/extraction-diagnostics.ts` then imports them from the canonical leaf and adds the `createDiagnostic` constructors.

**Trade-offs.** One refactor; flips the import direction without changing values.

---

### H-8. Unused FSM validator surface — three exported functions never imported

**Architectural impact.** `validation/fsm/validator.ts` exports `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, plus `validateStatus` related types — and nothing imports them. `validation/fsm/index.ts` does not even re-export `validateStatus` / `validateCompletionMetadata` / `validatePatternStatus`. Either:
1. The functions are dead and should be deleted, or
2. The barrel was meant to expose them and never did.

Either case is a doctrinal smell — public source with no consumer and no path through the documented surface.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/validator.ts:66, 127, 152` define the functions.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/index.ts:19-28` re-exports only `validateTransition` and `getProtectionSummary`.
- Workspace-wide grep returns zero importers for the three other functions (outside the file itself).

**ADR / doctrine.** No-BC ("deleted internal `_var` to silence a warning — delete it instead"). Dead code that *was* designed to be public is the precursor to parallel implementations later.

**Recommendation.** Delete `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, and `validatePatternStatus`'s output type. If any of them is actually needed, surface the requirement and rebuild against current invariants.

**Trade-offs.** None — these are uncalled.

---

## Medium

### M-1. `domain-enums.ts` is a parallel surface to `taxonomy/`

**Architectural impact.** The codebase has **two** "canonical-enum-schemas" locations: `taxonomy/` (value lists + branded helpers) and `domain-enums.ts` (Zod schemas built from those value lists). The naming gradient suggests they exist as a deliberate two-level construct, but the boundary is fuzzy: `validation-schemas/dual-source.ts` imports `AcceptedStatusSchema` from `domain-enums.js` and `RISK_LEVELS` from `taxonomy/`, then declares `RiskLevelSchema` and `HierarchyLevelSchema` locally. Same enum schema (`HierarchyLevelSchema`) is then imported by `extracted-pattern.ts` and `doc-directive.ts` — but never gets a home in `domain-enums.ts` despite being structurally identical to the schemas there.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/domain-enums.ts:25-29` — declares `AcceptedStatusSchema`, `ProcessStatusSchema`, `DeliverableStatusSchema`, `MaturitySchema`.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/dual-source.ts:18, 21` — declares `HierarchyLevelSchema` and `RiskLevelSchema` locally.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/doc-directive.ts:33-35` — declares three more variants of the status schema locally (see C-3).

**ADR / doctrine.** ADR-007 (taxonomy is a coherent single surface). Zod-first ("Types flow from schemas. Hand-written aliases that diverge are bugs").

**Recommendation.** Decide:
- **Option A** (preferred): `domain-enums.ts` is the single source for all closed-enum Zod schemas. Move `HierarchyLevelSchema`, `RiskLevelSchema`, `DeliverableStatusSchema`, and friends in. Delete the local declarations in `dual-source.ts`.
- **Option B**: collapse `domain-enums.ts` into `taxonomy/`. The split adds no value if `taxonomy/` already owns the value lists.

**Trade-offs.** Either way, one structural decision. The current half-and-half is the trap.

---

### M-2. `package/projection-error.ts` — wrong layer and misleading name

**Architectural impact.** A class named `ProjectionError` lives in `architect-core` under `package/projection-error.ts`. ADR-009 names "Projection Trust Boundary" as a *projection-package* concept. Putting a `ProjectionError` in core suggests core has projection responsibilities, which contradicts both ADR-006 ("core produces the graph; projection projects") and the scope file's "no presentation concerns."

The class is only used in core's own tests; `architect-projection` does not import it.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/projection-error.ts:1-17` — defines the class.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/package-resolver.ts:52` — throws it when package resolution fails.
- Grep for `ProjectionError` across packages: only `architect-core/tests/` and the file itself.

**ADR / doctrine.** ADR-009 (Projection Trust Boundary lives in `architect-projection`). ADR-006 (core does not do presentation/projection).

**Recommendation.** Rename to `PackageResolutionError` (or `UnmappedPackageError`) — the actual semantic. Move to `types/errors.ts` alongside the other domain errors. If a `ProjectionError` is eventually needed, it belongs in `architect-projection`.

**Trade-offs.** Breaking rename. One external consumer (`architect-mcp`, `architect-cli`) catches it implicitly via `package-resolver` throw site, so the rename is mechanical.

---

### M-3. `read-api/types.ts` declares `QueryError`/`QuerySuccess`/`QueryResult`/`QueryApiError` — query-protocol concerns in the read model

**Architectural impact.** `read-api/types.ts` mixes two unrelated concerns: (1) the *shape* of read-model views (`PatternDependencies`, `RoleInfo`, `NeighborEntry`) and (2) a Query API *envelope* (`QuerySuccess<T>` / `QueryError` / `QueryApiError` class). The envelope is a CLI/MCP response shape — it belongs alongside the consumer that returns it, not in the read-api types module.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/types.ts:27-57` (envelope types) — and again at 141-165 (`QueryApiError` class + `createSuccess`/`createError`).
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/index.ts:2-19` re-exports them publicly.

**ADR / doctrine.** Bounded contexts (`read-api/` is the read model; the query-response envelope is a transport-layer concern). ADR-006 — read-api projects the graph, it does not define wire shapes.

**Recommendation.** Move the envelope (`QuerySuccess`, `QueryError`, `QueryErrorCode`, `QueryApiError`, `createSuccess`, `createError`, `QueryMetadataExtra`) to either `architect-cli` (where it's actually used to format CLI responses) or a dedicated `read-api/query-envelope.ts`. Keep `read-api/types.ts` to read-view shapes only.

**Trade-offs.** Migration touches one CLI module; small mechanical scope.

---

### M-4. `config/self-hosting.ts` exposes repo-specific globs as published API

**Architectural impact.** `architect-core` is a published library (`@libar-dev/architect-core`). `self-hosting.ts` hardcodes globs to `packages/architect-core/src/**/*.ts`, etc. and exposes them through the public barrel. Other architect-managed projects don't need this — it's repo-local detail that should not be a stable export.

The guard `isArchitectDevWorkspace` (line 98-101) makes the function inert outside the dogfood directory, so the runtime impact is zero — but the *API surface* is still polluted.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/self-hosting.ts:70-91` — repo-specific glob constants.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/self-hosting.ts:97-110` — `resolveWorkspaceSources` only fires inside `packages/architect`.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/index.ts:26-31` re-exports all four symbols publicly.

**ADR / doctrine.** Bounded contexts / package responsibilities — a library should not ship its own workspace topology to consumers.

**Recommendation.** Move `self-hosting.ts` to a `scripts/` or `tools/` location that is wired only into the dogfood CLI/MCP at build time, OR keep it in core but make it explicitly internal (no public re-export from the barrel, internal subpath import only). The `architect-cli` and `architect-mcp` are workspace siblings — they can reach it without a public re-export.

**Trade-offs.** Either re-route to a private package subpath (`@libar-dev/architect-core/internal/self-hosting`) or accept that this is monorepo glue and gate it accordingly.

---

### M-5. `validation-schemas/` mixes `z.object` and `z.strictObject` inconsistently

**Architectural impact.** Engineering doctrine (`CLAUDE.md`): "Use `z.strictObject(...)`, not `z.object()` — extra properties must fail validation, not silently pass." Three modules under `validation-schemas/` still use `z.object`:

- `extracted-shape.ts` — 8 `z.object` schemas.
- `extracted-pattern.ts` — 1 (`BusinessRuleSchema`).
- `output-schemas.ts` — 10 schemas.

Each one is a silent-extra-property leak waiting to ferry stale fields across the trust boundary — exactly the kind of bug ADR-007 §Context names.

**Evidence.** (line numbers from grep)
- `extracted-shape.ts:7, 14, 22, 29, 36, 56, 64, 74`.
- `extracted-pattern.ts:13` (`BusinessRuleSchema`).
- `output-schemas.ts:10, 17, 22, 30, 40, 48, 56, 63, 71, 78`.

**ADR / doctrine.** `CLAUDE.md` doctrine ("Zod-first boundaries"); ADR-007 §Context (silent drops/passes are bugs).

**Recommendation.** Mechanical replace `z.object` → `z.strictObject` in all three files. Run the test suite; expect to find a few unexpected extra-property situations and fix them at the producer (do not loosen the schema).

**Trade-offs.** May surface dormant bugs at the boundary; that's the *point* of the doctrine.

---

### M-6. `types/index.ts` re-exports from `validation-schemas/` — types-folder owns nothing

**Architectural impact.** `types/index.ts` re-exports `Position`, `DocDirective`, `ExportInfo`, `SourceInfo`, `ExtractedPattern`, `ScannerConfig`, `GeneratorConfig` — all from `validation-schemas/`. These are not types `types/` owns; they belong to `validation-schemas/`. Adding `types/` to the chain doubles the public path for the same identifier (you can import `ExtractedPattern` from `types/index.js` *or* `validation-schemas/index.js`). The two paths are then re-aggregated at the top-level barrel.

**Evidence.**
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/types/index.ts:55-61` — type re-exports from validation-schemas.

**ADR / doctrine.** Layering (`types/` should be a leaf — branded primitives, `Result`, error types). Re-exporting validation-schemas through it muddies the boundary.

**Recommendation.** Keep `types/index.ts` to genuinely type-leaf concerns (`Result`, branded IDs, errors, `Position` if it stays a pure utility). Move the re-exports up to the package barrel only.

**Trade-offs.** Importers that took the longer path need updating — pre-1.0 break, no-BC says break.

---

## Low

### L-1. `inferMaturity` called and discarded in `doc-extractor.ts:225`

`void inferMaturity(status);` — pure side-effect-free function whose result is discarded. Either it should populate `pattern.maturity` (the schema doesn't carry one), or the call should be removed.

Anchor: ADR-007 — "Maturity axis replaces track tag" — implies maturity should appear *on the pattern*, not just be silently computed and dropped. Worth deciding whether maturity is an extracted field or a derived projection (currently `transformToPatternGraph` does `byMaturity` via `inferMaturity(pattern.status)` again — so the extractor's call is redundant).

### L-2. `validation/fsm/states.ts:33-35` exports `isFullyEditable` / `isScopeLocked` — neither is used

Two predicate helpers exported, no callers in the workspace. Either expose via the barrel deliberately or delete. Same shape as H-8.

### L-3. `validation-schemas/codec-utils.ts` is not a schema — wrong folder

`codec-utils.ts` is a JSON codec factory built on Zod schemas, but contains *no* schemas itself. It belongs in `utils/` or a new `codecs/` folder. The `@architect-role:codec` JSDoc on the file confirms its intent — it's a codec, not a schema. The "validation-schemas" parent folder is misleading.

### L-4. `read-api/pattern-helpers.ts` has a `WeakMap` cache keyed on `PatternGraph` that bypasses the deepFreeze

`pattern-graph-api.ts:99` deep-freezes the dataset. `pattern-helpers.ts:23` keeps a `WeakMap<PatternGraph, ...>` cache for lowercase-name lookups. The cache is populated lazily by `findPatternByName(graph, name)`. Caching against a frozen graph is fine, but the same graph object identity is required for cache hits — if any consumer mutates and re-wraps the dataset, the cache silently fails. Low risk today, but worth noting that the cache is unobservable from outside and may surprise debugging.

### L-5. `gherkin-extractor.ts` `inferBehaviorFilePath` and `behaviorFile`/`behaviorFileVerified` — half-implemented feature surface

The Gherkin extractor still tracks `behaviorFile` / `behaviorFileVerified`, computes paths, and exposes them on `ExtractedPattern`, but I could not find a downstream consumer that uses the verified flag. Either complete the verification step (the comment mentions verification but the call site passes `behaviorFileVerified: undefined` at `gherkin-extractor.ts:474`) or remove the field. Anchor: ADR-006 — half-implemented fields on `ExtractedPattern` are a lossy-local-type magnet.

---

## Cross-cutting architectural themes

### Theme 1 — The package has the right shape; the surface is over-shared

`architect-core` produces a well-defined `PatternGraph` and serves it through a `PatternGraphAPI`. The principal architecture (scanner → extractor → pipeline → graph → read-api) is intact, and external packages (`architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`) honor ADR-006 — the only direct importers of scanner/extractor outside core are the four named exceptions in ADR-006. **Read-model adherence externally is good.**

The risk is *inside* core: six `export *` statements (H-1) mean every internal name is a public commitment by default. ADR-006's anti-patterns (Parallel Pipeline, Lossy Local Type, Re-derived Relationship) are already present *inside* read-api (`getPatternDependencies`/`getPatternRelationships`/`getPatternDeliverables` re-derive shapes that `RelationshipEntry` and `Deliverable` already publish — see C-2). That's not external misuse — it's core's own read-api running the very anti-pattern it exists to prevent.

### Theme 2 — Aliasing is the dominant doctrinal drift

The repo's No-BC doctrine is loud and unambiguous: "Never add backward-compatibility aliases." The current state of the status / pattern-status / maturity / hierarchy / risk schemas is the **opposite**:

| Concept | Names in the codebase |
| --- | --- |
| 5-value accepted status | `AcceptedStatusSchema`, `StatusValueSchema`, `DefaultPatternStatusSchema`, `PatternStatusSchema`, `AcceptedPatternStatusSchema` (5) |
| 4-value process status | `ProcessStatusSchema`, type alias `ProcessStatus` (2) |
| `PatternGraph` | `PatternGraph`, `RuntimePatternGraph` (2) |
| `ValidationSummary` | two different shapes, same name |

These weren't all introduced as conscious aliases — some are convenience re-exports from `validation/fsm/states.ts` and `utils/session-helpers.ts` that have outlived their purpose. The cleanup posture should be: **single canonical name per concept, defined in one file, exported from one path**. Run a barrel-export audit per concept and delete the extras.

### Theme 3 — Layering boundaries quietly invert

Three independent inversions present:
- `extractor/` → `read-api/` (C-1)
- `generators/pipeline/` → `read-api/` (C-1)
- `config/` ↔ `generators/pipeline/` (H-3)
- `validation-schemas/` → `extractor/` (H-7)
- `types/` → `validation-schemas/` (M-6)

None of them currently breaks compile because each is a single type-only import, but together they describe a folder structure that no longer reflects the intended dependency arrows. The scope file's "`types/`, `taxonomy/`, `validation-schemas/` are leaves; `scanner/` and `extractor/` produce inputs; `read-api/` is the egress surface" is half-aspirational today. A one-time mechanical fix (move `getPatternName` out of `read-api/`, move `ContextInferenceRule` out of `generators/pipeline/`, move diagnostic codes out of `extractor/`, drop the `types/` re-exports) restores the arrows.

### Theme 4 — ADR-007 trust boundary needs a custodian

ADR-007's central commitment is: extraction must surface deprecated tags as diagnostics (not silent drops) and must not silently *pass through* removed fields. The current scanner/extractor honor the diagnostic path beautifully for `arch-role:` / `arch-context:` / `arch-layer:` (see `doc-extractor.ts:96-133` and `gherkin-extractor.ts:128-160`). But `archRole`, `usecase`, `roadmapSpec` are still collected as named optional fields on `FeatureTagMetadataSchema` / `DocDirectiveSchema` (H-4). This is the second flavor of the same bug ADR-007 §Context names — a silent *pass*, where extraction preserves data that no consumer accepts. A single recurring sweep ("for every named field on `FeatureTagMetadataSchema`, is there a consumer?") would catch these.

### Theme 5 — Strictness inconsistency at the boundary

Engineering doctrine demands `z.strictObject` everywhere; in practice ~19 schemas across three files still use `z.object`. Three of those (`ExtractedShapeSchema`, `BusinessRuleSchema`, the lint/validation output schemas) live exactly at the trust boundary the doctrine was written to protect. A mechanical sweep + test run is a high-leverage, low-risk fix (M-5).

---

## File:line index of evidence

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/index.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/domain-enums.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/types.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/defaults.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/project-config.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/resolve-config.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/self-hosting.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/doc-extractor.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/dual-source-extractor.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/build-pipeline.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-types.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-dataset.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/merge-patterns.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/context-inference.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/types.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-graph-api.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-classification.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-helpers.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/doc-directive.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/dual-source.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/output-schemas.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-pattern.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-shape.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/validator.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/states.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/projection-error.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/package-resolver.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/utils/session-helpers.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/taxonomy/hierarchy-levels.ts`
