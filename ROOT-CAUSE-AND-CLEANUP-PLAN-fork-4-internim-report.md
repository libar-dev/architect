<task-notification>
<task-id>a2cd769a5d895f244</task-id>
<tool-use-id>toolu_0124mmHPBs9QHDJ7CerSUEjU</tool-use-id>
<output-file>/private/tmp/claude-501/-Users-darkomijic-dev-projects-architect/3fb42fe1-ccd1-41b9-ae07-d905b1a51a73/tasks/a2cd769a5d895f244.output</output-file>
<status>completed</status>
<summary>Agent "Adapter / wave-residue survival forensics" completed</summary>
<result>Yes — `architect-cli` ships a `main` JS API (one line of dead `isDocError, formatDocError, handleCliError` re-export) with zero workspace consumers. Now compiled the report:

---

# Adapter / Wave-Residue Forensics — Final Report

## Section A — Confirmed surviving module-scope aliases

| File:line | Alias | Aliases-to | Wave | Workspace consumers (excl. defining file) |
|---|---|---|---|---|
| `packages/architect-core/src/config/role-constants.ts:66` | `DEFAULT_ROLES` | `LOCKED_WAVE_ONE_ROLES` | Wave 1 (tag taxonomy lock) | 0 (only `index.ts` barrel re-exports) |
| `packages/architect-core/src/config/role-constants.ts:68` | `DDD_ES_CQRS_ROLES` | `LOCKED_WAVE_ONE_ROLES` | Wave 1 (DDD/CQRS rename) | 0 (only `index.ts` + `config/index.ts` re-exports) |
| `packages/architect-core/src/validation-schemas/feature.ts:100` | `ParsedStepSchema` | `GherkinStepSchema` | "Parsed→Gherkin" Zod refactor | 0 (barrel only) |
| `packages/architect-core/src/validation-schemas/feature.ts:101` | `ParsedScenarioSchema` | `GherkinScenarioSchema` | same | 0 |
| `packages/architect-core/src/validation-schemas/feature.ts:102` | `ParsedBackgroundSchema` | `GherkinBackgroundSchema` | same | 0 |
| `packages/architect-core/src/validation-schemas/feature.ts:103` | `ParsedFeatureSchema` | `GherkinFeatureSchema` | same | 0 |
| `packages/architect-core/src/validation-schemas/feature.ts:104` | `FeatureFileSchema` | `ScannedGherkinFileSchema` | same | 0 |
| `packages/architect-core/src/validation-schemas/feature.ts:106-110` | `ParsedStep`/`ParsedScenario`/`ParsedBackground`/`ParsedFeature`/`FeatureFile` types | `z.infer` of the alias schemas | same | 0 |
| `packages/architect-core/src/validation-schemas/extracted-pattern.ts:126` | `ExtractedPatternSchema` | `ExtractedPatternBaseSchema` | renamed; `Base` is local-only | Heavy (but the rename made `Base` private, so the export is the alias — pure rename adapter) |
| `packages/architect-projection/src/projections/_shared/filter.ts:8` | `MaturityValueSchema` | `MaturitySchema` | post-rename | 0 |
| `packages/architect-projection/src/projections/_shared/filter.ts:9` | `StatusValueSchema` | `AcceptedStatusSchema` | post-rename | 0 |
| `packages/architect-mcp/src/tool-input-schemas.ts:115` | `PatternNameSchema` | `NonEmptySafeStringSchema` | semantic re-label | 9 (legit usage) |
| `packages/architect-core/src/config/workflow-loader.ts:42,43` | `CANONICAL_PHASE_NAMES`, `CANONICAL_PHASE_ORDINALS` | `.map(...)` derivations exported | unknown wave | 0 |

### Type-only aliases (forwarder shape)

| File:line | Alias | Aliases-to | Workspace consumers |
|---|---|---|---|
| `packages/architect-core/src/types/branded.ts:33` | `type ModuleId = PatternId` (+ `asModuleId`) | `PatternId` | 0 |
| `packages/architect-core/src/types/errors.ts:193` | `type ScanError = FileSystemError \| FileParseError \| DirectiveValidationError` | union | 0 |
| `packages/architect-core/src/types/errors.ts:204` | `type GenerationError = MarkdownGenerationError \| FileWriteError \| RegistryValidationError` | union | 0 |
| `packages/architect-core/src/validation-schemas/tag-registry.ts:20` | `type RoleDefinition` | `ConfigRoleDefinition` (re-imported with `as` rename) | barrel only |
| `packages/architect-core/src/validation-schemas/doc-directive.ts:36` | `type PatternStatus` | `AcceptedStatusValue` | 0 |
| `packages/architect-core/src/validation-schemas/dual-source.ts:15,16,19,22` | `ProcessStatus`, `AcceptedStatus`, `HierarchyLevel`, `RiskLevel` | taxonomy types (re-imported `as Taxonomy*`) | barrel + intra-module |
| `packages/architect-core/src/validation-schemas/lint.ts:6` | `type LintSeverity = SeverityType` | `SeverityType` | 12+ (legit usage) |
| `packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.ts:53` | `type DocumentationTypeMetadata = SupportedDocumentationTypeMetadata` | parent type | within file only |

### Parser-branch BC adapter (not a const, but the same shape)

- `packages/architect-core/src/scanner/ast-parser.ts:310-316` and `packages/architect-core/src/scanner/gherkin-ast-parser.ts:441-475` (`_deprecatedTags`) — the parser still recognizes `@architect-arch-role`, `@architect-arch-context`, `@architect-arch-layer` as **deprecated-but-accepted** tags rather than rejecting them. This is the surviving runtime adapter for the W1 tag-rename wave. The `@architect-context` → `@architect-bounded-context` rename, however, has been fully purged from the parser.

## Section B — Dogfood-as-public-API survivors

| File | Public path | Consumer count outside defining file |
|---|---|---|
| `packages/architect-core/src/config/cli-schema.ts` (610 LOC) | Re-exported as `CLI_SCHEMA` + 7 types from `architect-core/src/index.ts:236-246` | **0** (referenced only by `architect-guard/src/lint/tier-a-baseline.ts:81` as a *file path* in the baseline list) |
| `packages/architect-core/src/config/presentation-contracts.ts` (70 LOC) | Re-exported from `architect-core/src/index.ts:226-235` (`CodecOptions`, `DiagramScope`, `DiagramSource`, `DocumentEntry`, `IndexCodecOptionsContract`, `ReferenceDocConfig`, `ShapeSelector`) | Used internally by core configs, but the public re-export is dogfood-shaped |
| `packages/architect-core/src/config/self-hosting.ts` (110 LOC) — `ARCHITECT_PACKAGE_ROLES`, `PACKAGE_SELF_HOSTING_SOURCES` | `architect-core/src/index.ts:27-28` + `config/index.ts:25-26` | 1 — `architect-projection/tests/features/perf/business-rule-set-report.steps.ts` (test fixture only) |
| `packages/architect-core/src/extractor/layer-inference.ts` (43 LOC) — hardcoded `/orders/` and `/inventory/` substrings at line 33 | `architect-core/src/extractor/index.ts:22` → public `FEATURE_LAYERS`, `inferFeatureLayer` | Bug-shaped: `/orders/` and `/inventory/` belong to a downstream demo app, not core |
| `packages/architect-guard/src/lint/tier-a-baseline.ts` (1,138 LOC) — `TIER_A_LINT_BASELINE` | NOT re-exported from `architect-guard/src/index.ts` or `lint/index.ts`; **internally used only by `cli/lint-patterns.ts:45`** | OK on the surface, but 1.1k LOC of "current state of this monorepo's own lint debt" lives inside a publishable package |
| `packages/architect-cli/src/index.ts` (1 line) | Public `main` of `@libar-dev/architect-cli`: `export { isDocError, formatDocError, handleCliError } from './cli/error-handler.js';` | **0** — `architect-guard` imports its own local `handleCliError` from `cli/shared.ts`. Entire JS API of `architect-cli` is dead. |

## Section C — Self-declared deletion targets that haven't been deleted

| File:line | Marker comment |
|---|---|
| `packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:64` | `WARNING: This table is a campaign deletion target for W-DOCS-1. … DocDefinition.build(graph) is the replacement path. Do NOT add new entries here. See .pr-coordination/PROPOSED-DESIGN.md.` |
| `packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.ts:55-63` | `Documentation-type registry — closed dispatch table for legacy doc-gen. DO NOT ADD ENTRIES HERE. … This module exists only to carry the 12 pre-campaign entries until they migrate; it will be deleted once the campaign lands.` |
| `packages/architect-core/src/config/config-loader.ts:188-196` | Implicit deletion target — `'codec' + 'Options'` and `'referenceDoc' + 'Configs'` runtime concat to strip BC keys before Zod parse. The concat exists only to hide the key names from a static checker. |

No other `// TODO delete`, `// remove after`, `// kept for compat`, or `@deprecated` JSDoc tags survive in production source — those have been pruned. The two markers above are the survivors.

## Section D — Duplicate implementations of one concept

1. **`runtime-bridge.js`** — two near-identical files:
   - `packages/architect-cli/runtime-bridge.js`
   - `packages/architect-mcp/runtime-bridge.js`
   Differ by 2 lines (package name in the error string, exported function name). Both line 6 carry the Windows bug `path.dirname(new URL(import.meta.url).pathname)`. Neither is canonical.

2. **`handleCliError`** — `packages/architect-cli/src/cli/error-handler.ts` (publicly re-exported from `architect-cli/src/index.ts`) AND `packages/architect-guard/src/cli/shared.ts:24` (used by all 4 guard CLI entrypoints). Guard does not consume the architect-cli version → the cli version is the duplicate-and-dead copy.

3. **`@architect-arch-role` / `@architect-arch-context` / `@architect-arch-layer`** — extracted in BOTH `ast-parser.ts:310-316` and `gherkin-ast-parser.ts:441-475` as legacy tags. Two parsers maintain the same alias list independently.

4. **`SupportedDocumentationTypeMetadata` vs `DocumentationTypeMetadata`** — type-aliased at `documentation-type-registry.ts:53`; both names exported.

5. **`Parsed*Schema` vs `Gherkin*Schema`** + their `z.infer` types — five paired duplicates per Section A.

6. **`DEFAULT_ROLES` vs `DDD_ES_CQRS_ROLES`** — two aliases pointing to the same `LOCKED_WAVE_ONE_ROLES` constant.

## Section E — Patterns of survival

Categorizing why each adapter survived a "No-BC" PR:

- **(a) Author hedge — "let's keep both names, costs nothing":** `DDD_ES_CQRS_ROLES`, `DEFAULT_ROLES`, the 5 `Parsed*Schema` aliases, `MaturityValueSchema`, `StatusValueSchema`, `DocumentationTypeMetadata`, `ScanError`, `GenerationError`, `ProcessStatus`, `AcceptedStatus`, `HierarchyLevel`, `RiskLevel`, `PatternStatus`, `ModuleId`, `ExtractedPatternSchema`. **15 of the 21 alias survivors fall here**.

- **(b) Rename wave forgot to delete the old name:** the legacy `arch-role` / `arch-context` / `arch-layer` parser branches in `ast-parser.ts` and `gherkin-ast-parser.ts` — converted to a warning instead of a hard error, then never cleaned up.

- **(c) Static-analyzer evasion to keep a soft-removed key alive:** `'codec' + 'Options'` and `'referenceDoc' + 'Configs'` in `config-loader.ts:188-196`. Concatenation hides the dropped key names from grep / TS / lint while still stripping them at runtime — the most explicit "we are knowingly carrying a BC shim" survivor.

- **(d) Dogfood drift — internal repo state shipped as public API:** `CLI_SCHEMA` (610 LOC, zero consumers), `presentation-contracts.ts`, `ARCHITECT_PACKAGE_ROLES`, `PACKAGE_SELF_HOSTING_SOURCES`, `TIER_A_LINT_BASELINE` (1,138 LOC), the hardcoded `/orders/` `/inventory/` in `layer-inference.ts`. Different mechanism from aliases but the same root cause: no audit gate distinguishes "consumed in the published surface" from "consumed only by this repo's dogfood loop".

- **(e) Campaign-in-flight markers that became permanent:** the two `// campaign deletion target` notices in `documentation-bundle.internal.ts:64` and `documentation-type-registry.ts:55-63`. The W-DOCS-1 successor (`DocDefinition.build`) didn't land, and the markers froze in place.

- **(f) Cross-package "duplicate the implementation rather than depend on the other package" reflex:** `runtime-bridge.js` × 2; `handleCliError` × 2.

- **(g) Dead JS API kept because no one notices it's dead:** the entire `architect-cli/src/index.ts` (1-line public surface, 0 consumers); 10 dead exports from `architect-core` (`parseMarkdownToBlocks`, `formatUserZodError`, `FEATURE_LAYERS`, `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, `isScopeLocked`, `createFileLoader`, `formatCodecError`) — each confirmed present and each with zero consumers outside defining file + barrel (or test).

## Section F — Total counts

- **Module-scope `export const X = Y` pure aliases:** **11** (`role-constants.ts` ×2, `feature.ts` ×5, `extracted-pattern.ts` ×1, `_shared/filter.ts` ×2, `tool-input-schemas.ts` ×1). Of these, **10 have zero non-barrel workspace consumers**.
- **Module-scope `export type X = Y` pure aliases:** **9** (`branded.ts`, `errors.ts` ×2, `tag-registry.ts`, `doc-directive.ts`, `dual-source.ts` ×4, `lint.ts`, `documentation-type-registry.ts`). All 4 `dual-source.ts` aliases + the doc-directive `PatternStatus` + `ScanError`/`GenerationError`/`ModuleId` have **0 external consumers**.
- **BC schema duplicates flagged in prior review:** 5 schemas + 5 types = **10**, all in `validation-schemas/feature.ts:100-110`. **All present, all dead.**
- **Confirmed dead exports (zero non-barrel/non-test consumers):** `parseMarkdownToBlocks`, `formatUserZodError`, `FEATURE_LAYERS`, `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, `isScopeLocked`, `createFileLoader`, `formatCodecError`, the entire `architect-cli/src/index.ts` 3-symbol API, plus the alias-only exports above → **23+ dead-on-arrival exports**.
- **Deletion-target marker comments still in production source:** **2** (`documentation-bundle.internal.ts:64`, `documentation-type-registry.ts:55-63`).
- **Obfuscated dead-code strips:** **1** (`config-loader.ts:191`, 2 keys).
- **Wave-residue named constants:** **1** (`LOCKED_WAVE_ONE_ROLES`).
- **Duplicate `runtime-bridge.js`:** **2** files (CLI + MCP) — both ship the Windows bug.
- **Dogfood files leaking as public API:** **6** (`cli-schema.ts`, `presentation-contracts.ts`, `self-hosting.ts`, `layer-inference.ts` hardcoded paths, `tier-a-baseline.ts`, `architect-cli/src/index.ts`).
- **Parser-branch BC adapters:** **3 deprecated tags** (`arch-role`/`arch-context`/`arch-layer`) — duplicated across **2 parser files**.

**Distinct files containing at least one survivor: 14.** Concentrated in `architect-core` (10), with 3 in `architect-projection` and 2 in `architect-cli`/`architect-mcp` (the runtime-bridge twins). `architect-guard` is largely clean apart from the 1.1k-LOC dogfood baseline.

## Section G — Root-cause statement

Every "No-BC" PR enforces *additive* discipline (new types, new schemas, new tags) but lacks a *subtractive* gate: nothing in CI fails when an old name continues to be exported after its replacement ships. The repo has type-checking, ESLint, the Zod boundary rule, the perf gate, and `arch dangling --strict` — but no **workspace-consumer audit**. Authors hedge "leave the alias in for one release" and the alias becomes load-bearing for nobody and load-bearing for everyone simultaneously. The obfuscated `'codec' + 'Options'` concat is the smoking gun: it proves the author *knew* a static check would have flagged the BC shim and chose to evade it rather than delete it.

**Single CI mechanism that would catch every flavor above:** a workspace-wide **public-export consumer audit** run on each PR. For every `export` reachable from each package's `package.json` `main` / `exports` field, walk the workspace dependency graph and count consumers; fail the build when (a) consumer count is 0, (b) a symbol is module-scope `export const|type X = Y` where `Y` is itself exported (pure aliasing), (c) a `.ts` file contains string concatenation that produces a property name later passed to `Reflect.deleteProperty` (the evasion smell), or (d) a JSDoc/comment contains `deletion target` / `kept for compat` / `legacy` / `TODO remove` markers on a symbol that has shipped a release. The same script can lift the dogfood-leak detection by checking that any file whose path matches `*self-hosting*`, `*tier-*-baseline*`, or whose top-of-file JSDoc declares `@architect-bounded-context:dogfood` is not transitively reachable from a published `exports` entry.

### Key file paths referenced

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/role-constants.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/config-loader.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/cli-schema.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/presentation-contracts.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/self-hosting.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/layer-inference.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/ast-parser.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/feature.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/dual-source.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-pattern.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/tag-registry.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/doc-directive.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/lint.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/types/branded.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/types/errors.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/filter.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/tier-a-baseline.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/index.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/runtime-bridge.js`
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/runtime-bridge.js`</result>
<usage><total_tokens>75109</total_tokens><tool_uses>61</tool_uses><duration_ms>352952</duration_ms></usage>
</task-notification>