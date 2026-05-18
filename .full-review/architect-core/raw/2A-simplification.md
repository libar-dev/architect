# architect-core — Phase 2A: Simplification

**Scope:** 106 source files / ~12,360 SLOC.
**Inputs:** Phase 1 consolidated (`01-quality-architecture.md`), source tree.
**Cross-references:** Phase 1 finding IDs (`C-CORE-*`, `H-CORE-*`, `M-CORE-*`, `L-CORE-*`) are used in place of re-stating defect descriptions; this doc focuses on **simplified shape** recipes.

## Executive Summary

The bulk of the simplification leverage clusters in **two regions**: the `extractor/` + `scanner/` tag-parsing complex (parallel sync/async, parallel JSDoc/Gherkin parsers, four buildRoleLookup copies, two `getPatternName` definitions), and the `read-api/pattern-graph-api.ts` defensive cloning layer (27 `structuredClone` calls plus a hand-rebuilt `cloneTagRegistry`). Phase 1 already names every one of these — this phase delivers the concrete after-shape.

Three highest-leverage simplifications, each removing 100+ LOC without losing functionality:

1. **Collapse `extractPatternsFromGherkin` and `extractPatternsFromGherkinAsync` into one async function** (H-CORE-6). Removes ~135 lines of near-duplicate body and the one-off drift around `unrecognizedEnums`.
2. **Replace all 27 `structuredClone` + the hand-written `cloneTagRegistry` with a single `Object.freeze` pass at API construction** (H-CORE-8). `PatternGraphAPI` shrinks from 348 to ~210 lines and `getPatternGraph()` becomes a direct reference return (also fixes the `transform` function carrying through clones — M-CORE-8 becomes irrelevant once nothing clones).
3. **Replace the hand-written `PatternGraph` interface and 8 sibling interfaces with `z.infer` while flipping every `z.object` to `z.strictObject`** (C-CORE-2 + H-CORE-7). Deletes ~55 lines of duplicated interface in `pattern-graph.ts` alone, plus the entire `cloneTagRegistry` becomes mechanical.

Two angles Phase 1 documented but didn't push hard enough on:

- **`extractPatternTags` returns a `Record<string, unknown>` then post-processes via 35× `assignIfDefined` in `buildGherkinRawPattern`** (H-CORE-15 + H-CORE-16). The right shape is a **typed metadata bag built directly into a `z.input<typeof ExtractedPatternSchema>` partial**, which eliminates both the index-signature smell *and* the 35 quoted-key assignments in one pass. Phase 1 names them as separate findings; they share one fix.
- **`config-loader.ts` runs three validation passes for one config value** (`isProjectConfig` hand guard → IIFE strip → `safeParse`). Phase 1 (C-CORE-4 / H-CORE-4) treats these as separate doctrine issues; the simplified shape is **a single `safeParse` call, full stop** — same recipe addresses both.

## High-leverage simplifications

### H-SIMP-1. Collapse the sync/async Gherkin extractor into one async path

**Refs:** H-CORE-6.
**Files:** `src/extractor/gherkin-extractor.ts:353-493` (sync) and `:517-652` (async), ~270 lines combined.

**Current shape.** Two functions, identical except (1) sync `fileExistsSync`/async `Promise.all` for behavior-file verification and (2) sync handles `unrecognizedEnums`, async silently doesn't:

```ts
export function extractPatternsFromGherkin(scannedFiles, config): GherkinExtractionResult { /* 140 lines */ }
export async function extractPatternsFromGherkinAsync(scannedFiles, config): Promise<GherkinExtractionResult> { /* 135 lines */ }
```

**Simplified shape.** One private `extractOnePattern` builder + a single async public entry. Behavior-file verification is `await`'d inline (each call is one `fs.access`); the rare sync caller (if any remains) wraps with `await` at the call site:

```ts
async function extractOnePattern(file: ScannedGherkinFile, ctx: ExtractCtx): Promise<PatternResult> {
  // shared body — emits unrecognizedEnums always, handles deprecated tags, builds pattern.
}

export async function extractPatternsFromGherkin(
  scannedFiles: readonly ScannedGherkinFile[],
  config: GherkinExtractorConfig,
): Promise<GherkinExtractionResult> {
  const ctx = { /* baseDir, registry, scenariosAsUseCases */ };
  const results = await Promise.all(scannedFiles.map((f) => extractOnePattern(f, ctx)));
  return aggregate(results);
}
```

**What's preserved.** Same `GherkinExtractionResult` shape, same diagnostics, same per-pattern `safeParse` (until H-CORE-3 boundary decision lands). Drops the sync function entirely (No-BC; callers move to `await`).

**Severity:** High.

---

### H-SIMP-2. Replace `cloneValue` + `cloneTagRegistry` with one `Object.freeze` at construction

**Refs:** H-CORE-8, M-CORE-14, M-CORE-8.
**File:** `src/read-api/pattern-graph-api.ts:81-348` (entire file).

**Current shape (excerpts).** 27 `cloneValue(...)` calls + a hand-rebuilt `cloneTagRegistry` that exists only because `structuredClone` chokes on the `transform` function:

```ts
function cloneValue<T>(value: T): T { return structuredClone(value); }
function cloneTagRegistry(tagRegistry): TagRegistry { /* 16 lines hand-rebuilding role/tag/aggregation arrays */ }
function clonePatternGraph(graph): PatternGraph {
  const { tagRegistry, ...rest } = graph;
  return { ...cloneValue(rest), tagRegistry: cloneTagRegistry(tagRegistry) };
}
// then in every getter:
getPatternsByStatus(status) { return cloneValue(dataset.byStatus[status]); },
getStatusCounts() { return cloneValue(dataset.counts); },
// ... 25 more callsites
```

**Simplified shape.** Deep-freeze once at construction and return references. The TS types are already `readonly` everywhere they matter:

```ts
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  return Object.freeze(value);
}

export function createPatternGraphAPI(dataset: PatternGraph): PatternGraphAPI {
  deepFreeze(dataset);
  return {
    getPatternsByStatus: (status) => dataset.byStatus[status],
    getStatusCounts: () => dataset.counts,
    // ... 25 more, all direct references
    getPatternGraph: () => dataset,
  };
}
```

**What's preserved.** External read-only contract (all returned types were already `readonly`). Mutations through the API now throw in dev (Object.freeze). `transform` survives intact — M-CORE-8 dissolves.

**Severity:** High. Directly benefits `architect-projection`'s perf gate on the 318-pattern dogfood graph.

---

### H-SIMP-3. Replace hand-written `PatternGraph` + 8 siblings with `z.infer`, switch to `z.strictObject`

**Refs:** C-CORE-2, H-CORE-7, L-CORE-13, M-CORE-10.
**Files:** `src/validation-schemas/pattern-graph.ts:42-179`, `extracted-shape.ts`, `output-schemas.ts`, `extracted-pattern.ts:13`.

**Current shape (pattern-graph.ts:106-179).** Schema uses open `z.object`, then a hand-written `PatternGraph` interface adds `nameIndex` which the schema doesn't declare:

```ts
export const PatternGraphSchema = z.object({ patterns: …, byStatus: ExactStatusGroupsSchema, … });
// 50 lines below:
export interface PatternGraph { patterns: ExtractedPattern[]; byStatus: ExactStatusGroups; …; nameIndex?: ReadonlyMap<…>; }
```

**Simplified shape.** Strict schema is the type-of-record; runtime-only `nameIndex` moves to `RuntimePatternGraph` (already exists in `transform-types.ts` for `workflow`):

```ts
// validation-schemas/pattern-graph.ts
export const PatternGraphSchema = z.strictObject({
  patterns: z.array(ExtractedPatternSchema),
  tagRegistry: TagRegistrySchema,
  byStatus: ExactStatusGroupsSchema,
  byNormalizedStatus: StatusGroupsSchema,
  byMaturity: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byPhase: z.array(PhaseGroupSchema),
  byQuarter: z.record(z.string(), z.array(ExtractedPatternSchema)),
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),
  bySourceType: SourceViewsSchema,
  byProductArea: z.record(z.string(), z.array(ExtractedPatternSchema)),
  counts: StatusCountsSchema,
  phaseCount: z.number().int().nonnegative(),
  roleCount: z.number().int().nonnegative(),
  relationshipIndex: z.record(z.string(), RelationshipEntrySchema).optional(),
  archIndex: ArchIndexSchema.optional(),
  featureParseFailures: z.array(PatternParseFailureSchema).readonly().optional(),
});
export type PatternGraph = z.infer<typeof PatternGraphSchema>;
// Delete: lines 125-179 (every hand-written interface).

// generators/pipeline/transform-types.ts
export interface RuntimePatternGraph extends PatternGraph {
  readonly nameIndex: ReadonlyMap<string, ExtractedPattern>;
  readonly workflow?: LoadedWorkflow;
}
```

Sweep the other 27 `z.object(` sites identified in H-CORE-7 by a single search-and-replace in `validation-schemas/`. Pre-1.0 makes this one PR.

**What's preserved.** Existing `RuntimePatternGraph` already has the right shape; only `findPatternByName` in `pattern-helpers.ts:77` uses `nameIndex` and that path already accepts `PatternGraph` (since `nameIndex` is currently optional) — narrow it to `RuntimePatternGraph` where the index is read.

**Severity:** High.

---

### H-SIMP-4. Extract one `buildRoleLookup` to `utils/`; delete the four copies

**Refs:** H-CORE-13.
**Files:** `extractor/doc-extractor.ts:58-79`, `extractor/gherkin-extractor.ts:105-126`, `scanner/gherkin-ast-parser.ts:54-74`, `read-api/pattern-helpers.ts:126-139`.

**Current shape.** Same `buildRoleLookup` repeated 4×, with two of those calling it inside `resolveCanonicalRole`, **rebuilding the map on every call** (gherkin-extractor.ts:123 and doc-extractor.ts:76 — both inside per-tag loops). Real correctness bug masquerading as duplication.

**Simplified shape.**

```ts
// src/utils/role-lookup.ts (new file)
export interface RoleLike { readonly tag: string; readonly aliases?: readonly string[]; }
export interface RoleLookup {
  readonly canonical: ReadonlyMap<string, string>;
  readonly aliases: ReadonlyMap<string, string>;
  readonly all: ReadonlySet<string>;
  resolve(rawValue: string): string | undefined;
}
export function buildRoleLookup(roles: readonly RoleLike[]): RoleLookup {
  const canonical = new Map<string, string>();
  const aliases = new Map<string, string>();
  for (const role of roles) {
    canonical.set(role.tag, role.tag);
    for (const alias of role.aliases ?? []) aliases.set(alias, role.tag);
  }
  const all = new Set<string>([...canonical.keys(), ...aliases.keys()]);
  return {
    canonical, aliases, all,
    resolve: (v) => canonical.get(v) ?? aliases.get(v),
  };
}
```

Each call site builds the lookup once per extraction run, not per tag. Removes ~80 LOC and the inner-loop allocation.

**What's preserved.** Identical resolution semantics (canonical match preferred, then alias).

**Severity:** High.

---

### H-SIMP-5. `buildGherkinRawPattern` — typed `z.input` partial instead of `Record<string, unknown>` + 35× quoted keys

**Refs:** H-CORE-15, H-CORE-16.
**File:** `src/extractor/gherkin-extractor.ts:192-339`.

**Current shape.** Builds `Record<string, unknown>`, then 35 `assignIfDefined(rawPattern, 'patternName', ...)` calls. Any typo in a quoted key compiles cleanly and drops the field.

**Simplified shape.** Build a typed partial of the schema input directly; the spread-when-defined idiom (already used in `doc-extractor.ts:254-292`) eliminates the helper entirely:

```ts
type RawPattern = z.input<typeof ExtractedPatternSchema>;

const rawPattern: RawPattern = {
  id: patternId,
  name: patternName,
  directive: { /* … */ },
  code: '',
  source: { file: asSourceFilePath(relativePath), lines: [feature.line, feature.line] as const },
  exports: [],
  extractedAt: new Date().toISOString(),
  status: metadata.status,
  ...(metadata.pattern !== undefined && { patternName: metadata.pattern }),
  ...(metadata.boundedContext !== undefined && { boundedContext: metadata.boundedContext }),
  ...(unlockReason !== undefined && { unlockReason }),
  ...(metadata.phase !== undefined && { phase: metadata.phase }),
  ...(metadata.release !== undefined && { release: metadata.release }),
  ...(metadata.uses?.length ? { uses: metadata.uses } : {}),
  /* … remaining 28 fields, each TS-checked against z.input */
};
```

Pre-condition: H-SIMP-3 (TagRegistrySchema + ExtractedPatternSchema already strict), and split `extractPatternTags` per H-CORE-15 so the `metadata` arg has a named type rather than `Record<string, unknown>`.

**What's preserved.** Same output, same `safeParse` result, but typos and missing fields fail compile.

**Severity:** High.

---

### H-SIMP-6. Unify the JSDoc + Gherkin tag parsers around one `applyTagValue` applier

**Refs:** H-CORE-14, M-CORE-11.
**Files:** `scanner/ast-parser.ts:225-401` (parseDirective, 170 lines), `scanner/gherkin-ast-parser.ts:364-551` (extractPatternTags, 180 lines).

**Current shape.** Both functions implement the same registry-format dispatch (`value`/`enum`/`csv`/`flag`/`quoted-value`/`number`) for two input shapes. Drift is visible: Gherkin uses `kebabToCamel`, JSDoc hand-maps every key.

**Simplified shape.** One shared applier with two thin tokenizers:

```ts
// src/taxonomy/tag-parsing.ts
export interface TagToken { readonly tagName: string; readonly rawValue: string | undefined; }
export interface AppliedTags {
  readonly metadata: Record<string, unknown>; // typed by H-SIMP-5's RawPattern
  readonly diagnostics: TagDiagnostic[];
}
export function applyTags(tokens: readonly TagToken[], registry: TagRegistry): AppliedTags {
  // single switch on definition.format
  // single kebabToCamel for metadataKey fallback
  // single _unrecognizedEnums collector
}

// scanner/ast-parser.ts — JSDoc tokenizer just emits TagToken[]
// scanner/gherkin-ast-parser.ts — Gherkin tokenizer just emits TagToken[]
```

`parseDirective` shrinks to ~40 glue lines; `extractPatternTags` shrinks to a tokenizer + the deprecated-tag branch. Drift impossible.

**What's preserved.** Both surfaces' return shapes (after H-CORE-15 split). `_unrecognizedEnums` collected by the shared applier.

**Severity:** High.

---

### H-SIMP-7. Delete `presentation-contracts.ts`, the `isProjectConfig` guard, and the `'codec' + 'Options'` strip

**Refs:** C-CORE-4, H-CORE-4.
**Files:** `src/config/presentation-contracts.ts` (entire file), `src/config/project-config-schema.ts:118-141` (`isProjectConfig`), `src/config/config-loader.ts:188-196` (strip IIFE).

**Current shape — config-loader.ts:188-196.**

```ts
if (isProjectConfig(exported)) {
  const configForValidation = (() => {
    const copy = { ...(exported as Record<string, unknown>) };
    for (const key of ['codec' + 'Options', 'referenceDoc' + 'Configs']) {
      Reflect.deleteProperty(copy, key);
    }
    return copy;
  })();
  const parseResult = ArchitectProjectConfigSchema.safeParse(configForValidation);
  // …
}
```

Three layers of validation: a hand-coded guard, a string-concat strip, and finally Zod.

**Simplified shape.** Delete `presentation-contracts.ts` and its barrel re-exports. Delete `isProjectConfig` and the strip. Make `ArchitectProjectConfigSchema` strict; let it own the rejection:

```ts
const parseResult = ArchitectProjectConfigSchema.safeParse(exported);
if (!parseResult.success) {
  return { ok: false, error: { type: 'config-load-error', path: configPath,
    message: `Invalid project config: ${formatZodIssues(parseResult.error)}` } };
}
const resolved = resolveProjectConfig(parseResult.data, { configPath });
return { ok: true, value: resolved };
```

Zod's strict-object error message will name `codecOptions` and `referenceDocConfigs` directly — that's the right hint.

**What's preserved.** Discovery, default fallback, and the success-path resolution. Behavior change is that legacy fields now produce a clear error instead of silent strip — which is what No-BC asks for.

**Severity:** High.

---

### H-SIMP-8. Delete the 6 BC alias schemas in `feature.ts`

**Refs:** H-CORE-12.
**File:** `src/validation-schemas/feature.ts:100-110`.

**Current shape.**

```ts
export const ParsedStepSchema = GherkinStepSchema;
export const ParsedScenarioSchema = GherkinScenarioSchema;
export const ParsedBackgroundSchema = GherkinBackgroundSchema;
export const ParsedFeatureSchema = GherkinFeatureSchema;
export const FeatureFileSchema = ScannedGherkinFileSchema;

export type ParsedStep = z.infer<typeof ParsedStepSchema>;
export type ParsedScenario = z.infer<typeof ParsedScenarioSchema>;
export type ParsedBackground = z.infer<typeof ParsedBackgroundSchema>;
export type ParsedFeature = z.infer<typeof ParsedFeatureSchema>;
export type FeatureFile = z.infer<typeof FeatureFileSchema>;
```

**Simplified shape.** Delete all 10 lines plus the barrel re-exports in `validation-schemas/index.ts:74-83`. Sweep any external callers to `Gherkin*` names.

**What's preserved.** All real schemas (`Gherkin*`) remain.

**Severity:** High (pure deletion, No-BC).

---

### H-SIMP-9. Delete `void extractionWarnings`, `void inferMaturity(status)`, `void metadata.status`

**Refs:** M-CORE-2.
**Files:** `extractor/doc-extractor.ts:249,252`, `extractor/gherkin-extractor.ts:604`.

**Current shape (doc-extractor.ts:225-253).**

```ts
const extractionWarnings: string[] = [];
// 24 lines that push to extractionWarnings
void extractionWarnings;

const status = directive.status ?? 'roadmap';
void inferMaturity(status);
```

`extractionWarnings` is accumulated and discarded. `inferMaturity(status)` is called for side-effects that don't exist (the function is pure). `void metadata.status` in async path adds nothing.

**Simplified shape.** Two valid endpoints:

1. **If the warnings matter:** thread them through `ExtractionResults` (already has a `diagnostics` channel):
   ```ts
   for (const warning of extractionWarnings) {
     diagnostics.push(createDiagnostic(relativePath, 'parse-failure', warning));
   }
   ```
2. **If they don't:** delete the whole `extractionWarnings` accumulator and every push to it, plus the `void inferMaturity(status)` call.

The async `void metadata.status` is dead — delete it. Doctrine forbids soft suppression; the choice is "surface or delete," not "leave the void."

**Severity:** High (doctrine violation).

---

## Medium-leverage simplifications

### M-SIMP-1. `dual-source-extractor.extractProcessMetadata` — table-driven tag parsing

**Refs:** None (Phase 1 didn't flag).
**File:** `src/extractor/dual-source-extractor.ts:48-104`.

**Current shape.** 13 `tags.find(tag => tag.startsWith('xxx:'))?.replace('xxx:', '')` calls in a row, each rebuilding the iteration:

```ts
const quarter = tags.find((tag) => tag.startsWith('quarter:'))?.replace('quarter:', '');
const effort = tags.find((tag) => tag.startsWith('effort:'))?.replace('effort:', '');
const team = tags.find((tag) => tag.startsWith('team:'))?.replace('team:', '');
const workflow = tags.find((tag) => tag.startsWith('workflow:'))?.replace('workflow:', '');
// ... 9 more
```

**Simplified shape.** One pass plus a Map:

```ts
const TAG_KEYS = ['quarter','effort','team','workflow','completed','effort-actual',
                  'risk','product-area','user-role','business-value'] as const;
const values = new Map<string, string>();
for (const tag of tags) {
  for (const key of TAG_KEYS) {
    if (tag.startsWith(`${key}:`)) { values.set(key, tag.slice(key.length + 1)); break; }
  }
}
const businessValue = values.get('business-value')?.replace(/^["']|["']$/g, '');
```

13 array scans → 1.

**What's preserved.** Same output; same `safeParse` shape.

**Severity:** Medium.

---

### M-SIMP-2. `validateTransition` — widen result type, drop the `as ProcessStatusValue` lies

**Refs:** C-CORE-5.
**File:** `src/validation/fsm/validator.ts:88-105`.

**Current shape.** Casts strings to `ProcessStatusValue` after the guard already rejected them:

```ts
if (!isValidStatusValue(from)) {
  return { valid: false, from: from as ProcessStatusValue, to: to as ProcessStatusValue, error: ... };
}
```

**Simplified shape.** Discriminated result removes the cast:

```ts
export type TransitionValidationResult =
  | { valid: true; from: ProcessStatusValue; to: ProcessStatusValue }
  | { valid: false; from: string; to: string; error: string; validAlternatives?: readonly ProcessStatusValue[] };

export function validateTransition(from: string, to: string): TransitionValidationResult {
  if (!isValidStatusValue(from)) return { valid: false, from, to, error: `Invalid source status '${from}'. …` };
  if (!isValidStatusValue(to))   return { valid: false, from, to, error: `Invalid target status '${to}'. …` };
  if (VALID_TRANSITIONS[from].includes(to)) return { valid: true, from, to };
  return { valid: false, from, to, error: getTransitionErrorMessage(from, to), validAlternatives: getValidTransitionsFrom(from) };
}
```

Caller already branches on `valid` — `from`/`to` narrow correctly on each arm.

**Severity:** Medium.

---

### M-SIMP-3. `aggregateContextDependencies` + `findIntegrationPoints` — fetch relationships once

**Refs:** L-CORE-5.
**File:** `src/read-api/architecture-inspection.ts:123-183`.

**Current shape.** `aggregateContextDependencies` and `findIntegrationPoints` each call `getRelationshipsForPattern(dataset, pattern)` per pattern; `compareContexts` calls both, so each pattern is looked up twice in the relationship cache.

**Simplified shape.** Build once at `compareContexts` entry, pass the snapshot down:

```ts
function snapshotRelationships(
  dataset: PatternGraph,
  patterns: readonly ExtractedPattern[],
): ReadonlyMap<string, RelationshipEntry> {
  const map = new Map<string, RelationshipEntry>();
  for (const p of patterns) map.set(getPatternName(p), getRelationshipsForPattern(dataset, p));
  return map;
}
```

Both helpers accept `(patterns, snapshot)` and read from the map — one lookup per pattern in `compareContexts`.

**Severity:** Medium.

---

### M-SIMP-4. `populateByRoleView` — eliminate the two-pass sort

**Refs:** None.
**File:** `src/generators/pipeline/transform-dataset.ts:61-86`.

**Current shape.** Group into `Map<role, Pattern[]>`, then iterate `sortRoleDefinitionsForOutput(roles)` to assemble the ordered output record. Means a second pass over a sorted copy of `roles`.

**Simplified shape.** Sort once, iterate once:

```ts
export function populateByRoleView(patterns, roles): Record<string, ExtractedPattern[]> {
  const canonicalRoleByValue = buildCanonicalRoleLookup(roles);
  const byRole: Record<string, ExtractedPattern[]> = {};
  // Initialize in canonical order so insertion order = output order
  for (const role of sortRoleDefinitionsForOutput(roles)) byRole[role.tag] = [];
  for (const pattern of patterns) {
    if (pattern.role === undefined) continue;
    const canonicalRole = canonicalRoleByValue.get(pattern.role);
    if (canonicalRole !== undefined) byRole[canonicalRole]!.push(pattern);
  }
  // Strip empty buckets
  for (const tag of Object.keys(byRole)) if (byRole[tag]!.length === 0) delete byRole[tag];
  return byRole;
}
```

**Severity:** Medium.

---

### M-SIMP-5. `mergeTagRegistries` — inline `mergeByTag`, drop the closure

**Refs:** None.
**File:** `src/validation-schemas/tag-registry.ts:83-109`.

**Current shape.** 11-line nested `mergeByTag` closure with conditional early-return, then called three times.

**Simplified shape.**

```ts
function mergeByTag<T extends { tag: string }>(base: readonly T[], over?: readonly T[]): T[] {
  if (!over) return [...base];
  const merged = new Map(base.map((item) => [item.tag, item] as const));
  for (const item of over) merged.set(item.tag, item);
  return [...merged.values()];
}
```

Same behavior, no nested function, no `Array.from` (faster `new Map` from tuple iterator). Moves outside `mergeTagRegistries` if used elsewhere; otherwise keep nested — but drop the closure-capture pattern.

**Severity:** Low. Listed here because it's worth the read-time win.

---

### M-SIMP-6. `Result.unwrap` — guard `JSON.stringify` against circular refs

**Refs:** L-CORE-10.
**File:** `src/types/result.ts:70-82`.

**Current shape.**

```ts
const errorMessage =
  typeof result.error === 'object' && result.error !== null
    ? JSON.stringify(result.error)
    : String(result.error);
throw new Error(errorMessage);
```

Throws `TypeError: Converting circular structure to JSON` on circular errors — masking the real error.

**Simplified shape.**

```ts
function safeStringify(value: unknown): string {
  try { return JSON.stringify(value); }
  catch { return String(value); }
}
```

**Severity:** Medium (defect-grade for a publicly-shipped helper).

---

### M-SIMP-7. `package-config.ts` — `.extend` on a `strictObject` Zod-v4 caveat

**Refs:** L-CORE-11.
**File:** `src/package/package-config.ts:10-12`.

In Zod v4, `.extend(...)` on a `z.strictObject` does not propagate strict mode. Recipe:

```ts
export const PackageConfigSchema = z.strictObject({
  ...PackageSchema.shape,
  // additional fields here
});
```

**Severity:** Low-medium (subtle correctness).

---

### M-SIMP-8. `findPatternByName` — discriminated overload split

**Refs:** None.
**File:** `src/read-api/pattern-helpers.ts:62-80`.

**Current shape.** One function with `isPatternArray` guard switching between `dataset.nameIndex` map and a linear `find`:

```ts
function isPatternArray(source: PatternGraph | readonly ExtractedPattern[]): source is readonly ExtractedPattern[] {
  return Array.isArray(source);
}
export function findPatternByName(source, name): ExtractedPattern | undefined {
  const lower = name.toLowerCase();
  if (isPatternArray(source)) return source.find((p) => getPatternName(p).toLowerCase() === lower);
  return source.nameIndex?.get(lower) ?? source.patterns.find((p) => getPatternName(p).toLowerCase() === lower);
}
```

Mixed-mode signature; the `find` fallback path runs even when `nameIndex` is set on the dataset but the dataset is passed instead of patterns.

**Simplified shape.** Split into two functions; callers pick:

```ts
export function findPatternByNameInArray(patterns: readonly ExtractedPattern[], name: string): ExtractedPattern | undefined {
  const lower = name.toLowerCase();
  return patterns.find((p) => getPatternName(p).toLowerCase() === lower);
}
export function findPatternInGraph(dataset: PatternGraph, name: string): ExtractedPattern | undefined {
  const lower = name.toLowerCase();
  return dataset.nameIndex?.get(lower) ?? findPatternByNameInArray(dataset.patterns, name);
}
```

(Requires H-SIMP-3 to push `nameIndex` to `RuntimePatternGraph` to be airtight.)

**Severity:** Medium.

---

### M-SIMP-9. `cloneRoles` + `cloneRoleDefinitions` — one helper

**Refs:** M-CORE-9.
**Files:** `config/factory.ts:9-18`, `taxonomy/registry-builder.ts:34-39`.

Both clone `RoleDefinition[]`. They've already drifted: `factory.ts` preserves `diagramShape`; `registry-builder.ts` doesn't.

**Simplified shape.**

```ts
// src/taxonomy/registry-builder.ts (or a new utils/clone-roles.ts)
export function cloneRoleDefinitions(roles: readonly RoleDefinition[]): RoleDefinition[] {
  return roles.map((role) => ({
    tag: role.tag, domain: role.domain, priority: role.priority,
    ...(role.description !== undefined && { description: role.description }),
    ...(role.diagramShape !== undefined && { diagramShape: role.diagramShape }),
    ...(role.aliases !== undefined && { aliases: [...role.aliases] }),
  }));
}
```

Use both call sites. Drop `cloneRoles`. (Even better: under H-SIMP-2, the dataset is frozen — callers don't need to clone at all; just reference. Re-evaluate after H-SIMP-2.)

**Severity:** Medium.

---

### M-SIMP-10. `extractDataTable` and `extractExamples` share a row-mapping shape

**Refs:** None.
**File:** `src/scanner/gherkin-ast-parser.ts:109-169`.

**Current shape.** `extractDataTable` and `extractExamples` each map cucumber rows to `Record<string, string>` keyed by header. Almost identical logic.

**Simplified shape.**

```ts
function mapRows(
  headers: readonly string[],
  rows: readonly Messages.TableRow[],
): GherkinDataTableRow[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => { obj[header] = row.cells[i]?.value ?? ''; });
    return obj;
  });
}
```

`extractDataTable` uses headers from row 0; `extractExamples` uses `example.tableHeader`. Either way, share `mapRows`.

**Severity:** Low.

---

### M-SIMP-11. `asModuleId` — make it parse like its siblings or delete

**Refs:** M-CORE-13.
**File:** `src/types/branded.ts:40-42`.

**Current shape.**

```ts
export function asModuleId(id: string): ModuleId { return id as ModuleId; }
```

Every other branded constructor calls `Schema.parse(id)`. Either delete (grep shows no consumers in `src/`) or make it `return asPatternId(id);` since `ModuleId = PatternId`.

**Severity:** Medium (doctrine: bare `as`).

---

### M-SIMP-12. `string-utils.camelCaseToTitleCase` — precompute acronym regex table

**Refs:** L-CORE-4.
**File:** `src/utils/string-utils.ts:59-99`.

**Current shape.** Rebuilds 5 `RegExp`s per known acronym (~32 acronyms × 5 = 160 regexes) per call. The placeholder mechanism with character indices breaks at 26 acronyms (`String.fromCharCode(97 + N)` with N≥26 produces non-letters that can collide with input).

**Simplified shape.** Precompute at module scope:

```ts
const ACRONYM_RULES: readonly { acronym: string; regexes: readonly RegExp[] }[] =
  KNOWN_ACRONYMS.map((acronym) => {
    const e = acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
      acronym,
      regexes: [
        new RegExp(`([a-z])${e}([A-Z])`, 'g'),
        new RegExp(`${e}([A-Z])`, 'g'),
        new RegExp(`${e}(\\d)`, 'g'),
        new RegExp(`([a-z])${e}(?![A-Za-z])`, 'g'),
        new RegExp(`(?<![A-Za-z])${e}(?![A-Za-z])`, 'g'),
      ],
    };
  });

// Placeholder uses an index-based sentinel that can't collide:
const placeholderFor = (i: number) => `§§${i}§§`;
```

Removes ~160 regex allocations per call.

**Severity:** Medium (correctness: 26-acronym ceiling; perf: hot path on rendering).

---

### M-SIMP-13. `inferPatternName` — emit diagnostic instead of `'unknown-pattern'`

**Refs:** L-CORE-8.
**File:** `src/extractor/doc-extractor.ts:309-328`.

**Current shape.** Last-resort returns `${primaryTag}-pattern`, producing `"unknown-pattern"` when no info exists. Downstream consumers can't distinguish a real pattern named "unknown-pattern" from a fallback.

**Simplified shape.** Return `undefined` from `inferPatternName` and have `buildPattern` push a `missing-pattern-name` diagnostic + skip the pattern (matches gherkin extractor behavior, gherkin-extractor.ts:396-405).

**Severity:** Medium.

---

### M-SIMP-14. `aggregateTagUsage` — drive from `dataset.tagRegistry.metadataTags`

**Refs:** L-CORE-6.
**File:** `src/read-api/graph-inventory.ts:50-84`.

**Current shape.** Hardcodes 8 tags (`status`, `role`, `arch-context`, `phase`, `priority`, `quarter`, `team`, `effort`).

**Simplified shape.**

```ts
const TAG_KEY_FOR_PATTERN: Record<string, keyof ExtractedPattern> = {
  status: 'status', role: 'role', 'bounded-context': 'boundedContext',
  phase: 'phase', priority: 'priority', quarter: 'quarter', team: 'team', effort: 'effort',
};
for (const pattern of dataset.patterns) {
  for (const tag of dataset.tagRegistry.metadataTags) {
    const key = TAG_KEY_FOR_PATTERN[tag.tag];
    if (key === undefined) continue;
    const value = pattern[key];
    if (value === undefined) continue;
    increment(tag.tag, String(value));
  }
}
```

(`arch-context` is unconditionally wrong in the current code — `pattern.boundedContext` is named `bounded-context` in the registry. M-SIMP-14 is also a defect fix.)

**Severity:** Medium.

---

### M-SIMP-15. Replace dual `getPatternName` shadows

**Refs:** M-CORE-1.
**Files:** `read-api/pattern-helpers.ts:58`, `generators/pipeline/relationship-resolver.ts:9-11`.

**Current shape.** Identical 1-line function defined twice. Once in pipeline (private), once in read-api (exported). `transform-dataset.ts` imports the read-api one; `relationship-resolver.ts` uses its private copy.

**Simplified shape.** Move `getPatternName` to `validation-schemas/extracted-pattern.ts` (next to the schema). Both call sites import from there. Resolves the read-api ↔ pipeline tangle in H-CORE-2 from this direction.

**Severity:** Medium.

---

### M-SIMP-16. `parseTestsValue` — single Set membership check

**Refs:** None.
**File:** `src/extractor/dual-source-extractor.ts:106-120`.

**Current shape.**

```ts
function parseTestsValue(value: string): number {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'yes' || trimmed === 'true' || trimmed === '✓' || trimmed === '✅') return 1;
  if (trimmed === 'no' || trimmed === 'false' || trimmed === '✗' || trimmed === '' || trimmed === '-') return 0;
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? 0 : parsed;
}
```

**Simplified shape.**

```ts
const TRUTHY_TESTS = new Set(['yes', 'true', '✓', '✅']);
const FALSY_TESTS = new Set(['no', 'false', '✗', '', '-']);
function parseTestsValue(value: string): number {
  const trimmed = value.trim().toLowerCase();
  if (TRUTHY_TESTS.has(trimmed)) return 1;
  if (FALSY_TESTS.has(trimmed)) return 0;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
```

**Severity:** Low.

---

### M-SIMP-17. Defensive copies of readonly arrays — sweep

**Refs:** Phase 1 sweep pattern 1.
**Files:** `taxonomy/registry-builder.ts:34-39`, `config/factory.ts:9-18`, `validation-schemas/tag-registry.ts:54-81`, `read-api/pattern-graph-api.ts:85-100`.

Once H-SIMP-2 (deep-freeze) and H-SIMP-3 (strict schemas) land, every `[...x]`/`Array.from(x)` in `createDefaultTagRegistry`, `cloneRoles`, and `cloneTagRegistry` becomes pure overhead with no caller able to mutate. Sweep them after H-SIMP-2.

**Severity:** Medium (depends on H-SIMP-2).

---

## Low-leverage simplifications

### L-SIMP-1. `discoverTaggedShapes` — JSDoc index built once

**Refs:** L-CORE-1.
**File:** `src/extractor/shape-extractor.ts:629-678`.
Currently calls `extractPrecedingJsDoc(sourceCode, declaration.node, comments)` per declaration, scanning all comments each time. Precompute via `prepareJsDocComments(comments)` (already exists at `:421`) and binary-search by `nodeStart`.

**Severity:** Low.

---

### L-SIMP-2. Hoist module-level regexes in `shape-extractor.ts`

**Refs:** L-CORE-2.
**File:** `src/extractor/shape-extractor.ts:610-627`.
`extractShapeTag` / `extractIncludeTag` build inline regex literals per call. Hoist to module scope.

**Severity:** Low.

---

### L-SIMP-3. `extractFirstSentenceRaw` regex misses cases

**Refs:** L-CORE-3.
**File:** `src/utils/session-helpers.ts:26-34`.
Pattern `[.!?](?=\s+[A-Z]|\s*$)` misses `?!`, `.)`, and capital-after-`(`. Either add a unit-test fixture and tighten, or accept the simplification and document the boundaries inline.

**Severity:** Low.

---

### L-SIMP-4. Per-tag `[...(existing ?? []), …].push` allocations

**Refs:** L-CORE-7.
**Files:** `scanner/gherkin-ast-parser.ts:494-498,513-516,525-529,533-536`, `generators/pipeline/transform-dataset.ts:175-200`.

```ts
const existing = metadata[key] as string[] | undefined;
metadata[key] = [...(existing ?? []), ...transformed];
```

Allocates a fresh array per iteration. Mutate in place:

```ts
const existing = (metadata[key] as string[] | undefined) ?? (metadata[key] = []);
existing.push(...transformed);
```

For multimap shapes use `Map<K, V[]>` (already in transform-dataset.ts for some buckets). Keeps O(n) instead of O(n²).

**Severity:** Low.

---

### L-SIMP-5. `getPatternsByQuarter(string)` — validate quarter shape

**Refs:** L-CORE-14.
**File:** `src/read-api/pattern-graph-api.ts:306`.
Accepts any string; malformed quarters silently return `[]`. Either validate against `QUARTER_PATTERN` (already exported from taxonomy) and throw or use a branded `Quarter` type.

**Severity:** Low.

---

### L-SIMP-6. Consolidate tiny `utils/` files

**Refs:** L-CORE-12.
**Files:** `utils/id-utils.ts` (7 lines), `utils/collection-utils.ts` (12 lines).

`utils/id-utils.ts` (one function) and `utils/collection-utils.ts` (one function) are below the threshold worth a module. Fold each into `utils/index.ts` directly or into a `utils/misc.ts`. Saves one round-trip per import.

**Severity:** Low.

---

### L-SIMP-7. `loadConfig` adapter is redundant

**Refs:** None.
**File:** `src/config/config-loader.ts:88-104`.

`loadConfig` is a 14-line adapter around `loadProjectConfig` that returns a flatter shape. Inline at the one call site, or delete entirely and migrate callers to `loadProjectConfig`. Reduces public surface.

**Severity:** Low.

---

### L-SIMP-8. `parseDirective` description/example loop — split

**Refs:** M-CORE-11.
**File:** `src/scanner/ast-parser.ts:320-351`.

```ts
const descriptionLines: string[] = [];
const examples: string[] = [];
let inExample = false;
let exampleBuffer: string[] = [];
for (const line of lines) {
  if (line.startsWith('@example')) { … }
  if (line.startsWith('@param') || line.startsWith('@returns') || line.startsWith('@')) { … }
  if (inExample) { … } else if (!line.startsWith('@')) descriptionLines.push(line);
}
if (exampleBuffer.length > 0) examples.push(exampleBuffer.join('\n'));
```

Two extractors (`extractDescription` and `extractExamples`) read better than one state-machine loop. Each does one pass over `lines`.

**Severity:** Low.

---

### L-SIMP-9. `extractCsvValue` empty-result inconsistency

**Refs:** None.
**File:** `src/scanner/ast-parser.ts:91-99`.

Returns `undefined` for "no match," but if match returns empty list after split, returns `[]`. Downstream `tag.length > 0` checks rely on both shapes. Pick one (probably `undefined` to match other extractors) and unify.

**Severity:** Low.

---

### L-SIMP-10. `findIntegrationPoints` — single pass, two relations

**Refs:** None.
**File:** `src/read-api/architecture-inspection.ts:144-183`.
Two nearly-identical inner loops (one for `uses`, one for `dependsOn`). Iterate once over a config of `[['uses', relationships.uses], ['dependsOn', relationships.dependsOn]]`.

**Severity:** Low.

---

## Sweep patterns

These appear in many places; each fix is small but the aggregate is meaningful.

### SWEEP-1. `...(x !== undefined && { x })` everywhere

Used in `gherkin-extractor.ts`, `doc-extractor.ts`, `dual-source-extractor.ts`, `factory.ts`, `pattern-graph-api.ts`, error factories in `errors.ts`. Recipe (add to `utils/object-utils.ts`):

```ts
export function omitUndefined<T extends object>(obj: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) result[k] = v;
  return result as { [K in keyof T]: Exclude<T[K], undefined> };
}
```

Each builder loses ~10-30 lines of spread. **Caution:** under `exactOptionalPropertyTypes` the typed return shape needs care. Apply selectively after H-SIMP-3 establishes that schemas are the contract.

**Severity:** Medium overall, applied piecemeal.

---

### SWEEP-2. `[...existing.push, x]` → `existing.push(x)` in build loops

Already covered by L-SIMP-4. Same pattern recurs in `taxonomy/registry-builder.ts` and `validation-schemas/tag-registry.ts:88-97`.

---

### SWEEP-3. `as ProcessStatusValue` / `as DocDirective['level']` / `as string[]` after `Map.get`

`scanner/ast-parser.ts:279-296` has 16 of these. They all stem from `metadataResults: Map<string, unknown>`. Once H-SIMP-6 (one tag applier, typed bag) lands, every cast in this block disappears.

---

### SWEEP-4. `findIndex(... === xxx)` repeated for header columns

`dual-source-extractor.ts:131-138` has 6 `headers.findIndex((header) => header.toLowerCase() === 'xxx')`. Recipe:

```ts
const headerIndex = new Map(headers.map((h, i) => [h.toLowerCase(), i] as const));
const deliverableIdx = headerIndex.get('deliverable') ?? -1;
```

Linear scan + 6 searches → one Map build + 6 lookups.

---

### SWEEP-5. `Map.get(...) ?? []; existing.push(...); Map.set(k, existing)` multimap idiom

Six copies across `transform-dataset.ts` (lines 175-200), `gherkin-ast-parser.ts:534-537`, `dual-source-extractor.ts:208-211`. The doctrine says "three similar lines is better than a premature abstraction," but six identical 4-line copies is over the line. Recipe:

```ts
// utils/multimap.ts
export function pushToMultimap<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const arr = map.get(key);
  if (arr === undefined) map.set(key, [value]);
  else arr.push(value);
}
```

For `Record<string, V[]>` (used in `byQuarter`, `byProductAreaMap`):

```ts
export function pushToRecord<V>(rec: Record<string, V[]>, key: string, value: V): void {
  (rec[key] ??= []).push(value);
}
```

**Severity:** Medium.

---

### SWEEP-6. Per-call `safeParse` and `safeParse` issue formatting

Multiple call sites repeat:

```ts
const validationErrors = validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
```

(`gherkin-extractor.ts:475, 630`, `doc-extractor.ts:301`, `scanner/ast-parser.ts:384-389`, `transform-dataset.ts:108`, `config-loader.ts:198-200`.) Recipe:

```ts
// utils/zod-issues.ts
export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}
export function joinZodIssues(error: z.ZodError, sep = '; '): string {
  return formatZodIssues(error).join(sep);
}
```

`utils/errors.ts:formatZodError` already exists but has a slightly different output shape — consolidate.

**Severity:** Low-Medium.

---

## What's already clean — don't refactor these

- **`src/utils/fuzzy-match.ts`** — concise, correct, scoring tier-list reads top-to-bottom. The `[prevRow, currRow] = [currRow, prevRow]` swap is the right Levenshtein shape.
- **`src/validation/fsm/transitions.ts`** — small, table-driven, exhaustive error messages. The only thing it could lose is the `options` parameter for tag prefix (unused at 90% of call sites) but that's nitpicky.
- **`src/types/result.ts`** — discriminated `Ok`/`Err` + utilities; the one wart (`Result.unwrap`'s `JSON.stringify` on circular refs, M-SIMP-6) is a one-liner fix, not a redesign.
- **`src/validation/boundary.ts`** — `parseAtBoundary` is the right shape. The problem is non-use inside core (H-CORE-3), not the helper itself.
- **`src/extractor/extraction-diagnostics.ts`** — closed enum of codes, exhaustive severity table, simple factory. Don't touch except for M-CORE-5 (move codes to `validation-schemas/`).
- **`src/types/errors.ts`** — discriminated `DocError` union + factory functions. Verbose but exactly the shape doctrine wants. The factory bodies are repetitive (`...(originalError !== undefined && { originalError })`) but each one is local and clear.

---

## Phase 2 dependency ordering

Recommended landing order to minimize churn:

1. **H-SIMP-3** (strict schemas + z.infer) → enables typed builders.
2. **H-SIMP-7 + H-SIMP-8 + H-SIMP-9** (deletions: presentation-contracts, BC aliases, voids) — pure removals, no rework downstream.
3. **H-SIMP-4** (one buildRoleLookup) — small, isolated, prerequisite for H-SIMP-6.
4. **H-SIMP-5** (typed buildGherkinRawPattern) — needs strict schemas (1).
5. **H-SIMP-6** (one tag applier) — refactors both parsers; needs typed metadata bag.
6. **H-SIMP-1** (collapse sync/async extractor) — wraps the H-SIMP-5/6 cleanup.
7. **H-SIMP-2** (deep-freeze API) — independent; do whenever, but biggest perf win after H-SIMP-3 because the typed dataset is provably read-only.
8. Medium-tier and sweeps follow opportunistically.
