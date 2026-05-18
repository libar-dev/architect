# architect-core — Phase 1A: Code Quality Review

## Executive Summary

`@libar-dev/architect-core` is a 12,360-SLOC, 106-file ingestion-and-read-model foundation. The big-picture craftsmanship is good (Result monad, branded types, boundary parser, no `@ts-ignore`/`eslint-disable` suppressions, no lurking TODO/FIXME debt). The serious cost is concentrated in three places: **(1)** the Zod-first doctrine is half-applied — 28 of 90 schemas use the open `z.object` instead of `z.strictObject`, and several modules carry hand-written interfaces that parallel (and silently diverge from) their Zod schemas; **(2)** the extractor/scanner trio has 1,900 SLOC across `gherkin-extractor.ts`, `shape-extractor.ts`, `ast-parser.ts`, `gherkin-ast-parser.ts` with a near-clone sync/async pair, 4× duplicated `buildRoleLookup`/`resolveCanonicalRole`, two parallel `@architect-*` parsers, and a giant untyped `Record<string, unknown>` pipe that gets parsed twice; **(3)** `PatternGraphAPI` calls `structuredClone` on every read (27 sites), which is correct semantically but expensive at the scale this read model already serves. There are also a handful of small but pointed doctrine violations (dead `void x;` statements, an obfuscated string-concat that evades a lint rule, an unsafe `as ProcessStatusValue` cast after a type guard failed, and ~10 unused `Parsed*Schema` aliases that look like classic BC residue).

Findings are listed below grouped by severity. Locations are absolute.

---

## Critical

### C1. Hand-written `PatternGraph` interface diverges from `PatternGraphSchema`

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/pattern-graph.ts` (lines 42-179)

The file defines `PatternGraphSchema` via Zod (lines 106-123) but then declares a **separate hand-written `PatternGraph` interface** (lines 161-179) that drifts from the schema. Specifically the interface includes `nameIndex?: ReadonlyMap<...>` (line 177) which is **not** in the Zod schema. The same pattern repeats for `StatusGroups`, `ExactStatusGroups`, `PhaseGroup`, `SourceViews`, `ArchIndex` — all duplicated as hand-written interfaces (lines 125-160).

This is a direct doctrine violation ("Types flow from schemas: `type X = z.infer<typeof XSchema>` is canonical. Hand-written type aliases that diverge from a schema are a bug.") and it has already produced a divergence (`nameIndex`).

**Fix:**

```ts
// Delete lines 125-160 and 161-179. Replace with:
export type StatusGroups = z.infer<typeof StatusGroupsSchema>;
export type ExactStatusGroups = z.infer<typeof ExactStatusGroupsSchema>;
export type PhaseGroup = z.infer<typeof PhaseGroupSchema>;
export type SourceViews = z.infer<typeof SourceViewsSchema>;
export type ArchIndex = z.infer<typeof ArchIndexSchema>;
export type PatternGraph = z.infer<typeof PatternGraphSchema>;
```

Then add `nameIndex` to `PatternGraphSchema` (probably as a transient field not parsed; if it's a runtime-only construct, split a `RuntimePatternGraph` type that extends `PatternGraph` and live with it — but the schema must be the canonical contract). Either way, the hand-written declarations must go.

### C2. Cross-package `PatternGraph` schema uses `z.object` (not `z.strictObject`)

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/pattern-graph.ts` (lines 42, 49, 57, 65, 72, 79, 85, 98, 106)

Every shape in this file — including the top-level `PatternGraphSchema` that is the cross-package contract — uses `z.object()`. Per doctrine: "Use `z.strictObject(...)` for closed records — never `z.object()` (which is open). Extra properties must fail validation, not silently pass." `PatternGraph` is the canonical read-model boundary; if a stale field slips into a fixture or a producer drifts, it will be silently swallowed.

**Fix:** replace every `z.object(` with `z.strictObject(` in this file.

```ts
// Before
export const PatternGraphSchema = z.object({
  patterns: z.array(ExtractedPatternSchema),
  // ...
});

// After
export const PatternGraphSchema = z.strictObject({
  patterns: z.array(ExtractedPatternSchema),
  // ...
});
```

### C3. Hand-written `ArchitectProjectConfig` parallel to `ArchitectProjectConfigSchema`

**Files:**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/project-config.ts` (lines 48-64 and the surrounding hand-written interfaces)
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/project-config-schema.ts` (lines 102-116)

The user-facing project config is defined twice: as a TypeScript interface (`ArchitectProjectConfig`, lines 48-64 of `project-config.ts`) and as a Zod schema (`ArchitectProjectConfigSchema`, lines 102-116 of `project-config-schema.ts`). The same is true for `SourcesConfig`, `OutputConfig`, `GeneratorSourceOverride`, `ProjectMetadata`, `RegenerationCommand`. The `as ArchitectProjectConfig` cast at `config-loader.ts:212` confirms the two have drifted in TS's eyes.

**Fix:** delete `project-config.ts`'s `ArchitectProjectConfig`/`SourcesConfig`/`OutputConfig`/`GeneratorSourceOverride`/`ProjectMetadata`/`RegenerationCommand` interfaces and export them via `z.infer` from the schemas:

```ts
// project-config-schema.ts
export type ArchitectProjectConfig = z.infer<typeof ArchitectProjectConfigSchema>;
export type SourcesConfig = z.infer<typeof SourcesConfigSchema>;
// ...
```

Then `config-loader.ts:212` no longer needs the `as ArchitectProjectConfig` cast — `parseResult.data` already has that type.

### C4. `isProjectConfig` hand-coded type guard duplicates the schema's keys

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/project-config-schema.ts` (lines 118-141)

`isProjectConfig` reimplements a brittle key-existence check, then `config-loader.ts:188-196` does **both** `isProjectConfig(exported)` **and** `ArchitectProjectConfigSchema.safeParse(...)`. The hand-coded key list (lines 124-138) duplicates the schema's fields — when somebody adds a field to the schema, this guard silently drifts. This violates the "parse once at the trust boundary" rule and is provably the wrong tool: Zod's `safeParse` is _the_ validated guard.

**Fix:** delete `isProjectConfig`. At the only call site (`config-loader.ts:188`), drop the guard and parse unconditionally:

```ts
// config-loader.ts
const exported = module.default;
if (exported === undefined || exported === null) {
  /* keep error */
}

const parseResult = ArchitectProjectConfigSchema.safeParse(exported);
if (!parseResult.success) {
  /* return zod error */
}
// parseResult.data is fully typed; no second cast needed
```

Also delete the bizarre `configForValidation` IIFE / Reflect.deleteProperty block at `config-loader.ts:189-195` once Zod is the single gate — `z.strictObject` will reject the stripped keys with a useful message.

### C5. `validateTransition` returns a fake `ProcessStatusValue` via `as` after type guard failed

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/validator.ts` (lines 88-105)

When the function detects an invalid status, it still returns it inside a typed result by _casting_ a string to `ProcessStatusValue`:

```ts
if (!isValidStatusValue(from)) {
  return {
    valid: false,
    from: from as ProcessStatusValue, // <-- lying
    to: to as ProcessStatusValue,
    error: `Invalid source status ...`,
  };
}
```

This claims the value is a `ProcessStatusValue` after the type guard explicitly rejected it. Downstream consumers that branch on `result.from === 'roadmap'` etc. will compile fine but read a garbage string. The discriminated `valid: false` flag is the right defense; the type system should reflect it.

**Fix:** widen the result type for the invalid branch, so the cast is unnecessary.

```ts
export type TransitionValidationResult =
  | { valid: true; from: ProcessStatusValue; to: ProcessStatusValue }
  | {
      valid: false;
      from: ProcessStatusValue | string; // explicitly mixed
      to: ProcessStatusValue | string;
      error: string;
      validAlternatives?: readonly ProcessStatusValue[];
    };
```

Then drop every `as ProcessStatusValue` in this file. (Cleaner alternative: return a separate "invalid input" branch that does not pretend to carry the user-supplied strings as enum values.)

---

## High

### H1. `gherkin-extractor.ts` is a 674-line file with a sync/async near-clone

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts`

- `extractPatternsFromGherkin` (lines 353-493) — 140 lines, sync, does the whole feature-to-pattern transform.
- `extractPatternsFromGherkinAsync` (lines 517-652) — 135 lines, async, repeats every single step of the sync function with `behaviorFileVerified` deferred to a `Promise.all` at the end.

The only meaningful difference is the file-existence check (`fileExistsSync` vs `fileExistsAsync`). Everything else — `extractPatternTags`, `validateUnlockReason`, `collectDeprecatedTagDiagnostics`, the missing-pattern/missing-status diagnostics, the `whenToUse` derivation, the `buildGherkinRawPattern` call, the `safeParse` against `ExtractedPatternSchema` — is duplicated verbatim. Bug fixes have to be applied twice; the sync version even has the `unrecognizedEnums` handler (lines 372-390) that the async version lacks, so they already diverge.

**Fix:** keep only the async function and have the (rare) sync caller `await` it. If there is a genuine perf reason to keep a sync entry, factor a shared `extractOneFeature(file, baseDir, registry, scenariosAsUseCases)` that returns a `{ pattern, behaviorPathToVerify, diagnostics, error }` shape, then the sync/async difference collapses to a 5-line loop.

```ts
function extractOnePattern(file, ctx): {
  pattern?: ExtractedPattern;
  behaviorPathToVerify?: string;
  diagnostics: ExtractionDiagnostic[];
  error?: GherkinPatternValidationError;
} { /* shared body */ }

export async function extractPatternsFromGherkinAsync(...) {
  const perFile = scannedFiles.map((f) => extractOnePattern(f, ctx));
  const patterns = await Promise.all(perFile.map(async (r) => {
    if (!r.pattern) return undefined;
    if (!r.behaviorPathToVerify) return r.pattern;
    return { ...r.pattern, behaviorFileVerified: await fileExistsAsync(r.behaviorPathToVerify) };
  }));
  // ...
}
```

### H2. `buildRoleLookup` / `resolveCanonicalRole` duplicated four times

**Files (all are the same function body):**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/doc-extractor.ts` (lines 58-79)
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts` (lines 105-126)
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts` (lines 54-74)
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-helpers.ts` exports a third variant `resolveCanonicalRole(dataset, role)` (lines 137-139)

The first three are byte-for-byte the same logic with a `RoleLike` shape. The fourth takes a `PatternGraph` and is the public canonical form, but the others reinvent the same lookup because nothing exports a generic-roles helper.

**Fix:** extract one shared helper to `src/taxonomy/registry-builder.ts` (or `src/utils/role-lookup.ts`) and import it everywhere.

```ts
// src/utils/role-lookup.ts
export interface RoleLike {
  readonly tag: string;
  readonly aliases?: readonly string[];
}

export interface RoleLookup {
  readonly canonical: ReadonlyMap<string, string>;
  readonly aliases: ReadonlyMap<string, string>;
  readonly all: ReadonlySet<string>;
}

export function buildRoleLookup(roles: readonly RoleLike[]): RoleLookup {
  /* … */
}
export function resolveCanonicalRole(
  rawValue: string | undefined,
  roles: readonly RoleLike[],
): string | undefined {
  /* … */
}
```

Then delete the three private copies and have `pattern-helpers.resolveCanonicalRole` call `resolveCanonicalRole(role, dataset.tagRegistry.roles)`.

### H3. Two parallel `@architect-*` tag parsers (JSDoc and Gherkin)

**Files:**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/ast-parser.ts` — `extractMetadataTag` / `extractSingleValue` / `extractEnumValue` / `extractQuotedValue` / `extractCsvValue` / `extractNumberValue` / `checkFlagPresent` (lines 61-110), then a 170-line `parseDirective` (lines 225-401) that handles the format dispatch and pulls 25 metadata keys out by name.
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts` — `extractPatternTags` (lines 364-551) does the same job but for Gherkin tag arrays, with its own `Record<string, unknown>` accumulator and its own per-format switch (lines 484-541).

Both functions enumerate the same registry's `format: 'value' | 'enum' | 'csv' | 'flag' | 'quoted-value' | 'number'` and produce a metadata object. They share a `MetadataTagDefinition` shape but no shared logic. Bug fixes apply twice, and they have already drifted: the JSDoc parser handles `extends`/`level`/`parent` differently than the Gherkin parser (`extractPatternTags` uses a `kebabToCamel` rename, the JSDoc side hand-maps each key).

**Fix:** factor a shared `applyMetadataTag(metadata, tagDef, rawValue, options)` that takes the registry definition and a raw string value and applies the format rule. The Gherkin path supplies the value as `tag.substring(colonIdx+1)`; the JSDoc path supplies the value as the regex match. Concretely:

```ts
// src/taxonomy/tag-parsing.ts
export interface TagApplyContext {
  readonly metadata: Record<string, unknown>;
  readonly tagName: string; // 'status', 'phase', …
  readonly rawValue: string;
  readonly definition: MetadataTagDefinition;
}

export function applyTagValue(ctx: TagApplyContext): void {
  /* shared format switch */
}
```

Both `ast-parser.ts:parseDirective` and `gherkin-ast-parser.ts:extractPatternTags` shrink to a thin source-specific tokenizer + a call to the shared applier.

### H4. `extractPatternTags` returns a hand-typed 42-field shape with index signature

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts` (lines 364-419)

The return type is a 42-property inline interface ending in `readonly [key: string]: unknown` (line 418). The body builds a `Record<string, unknown>` (line 436) and the consumer (`gherkin-extractor.ts:367`) accesses it like `metadata.pattern`, `metadata.status`, `metadata.level` — i.e. via property access that completely bypasses the index signature's `unknown`. With `noPropertyAccessFromIndexSignature` enabled (per AGENTS.md) this _should_ fail; the inline interface defeats the rule by listing every key explicitly.

Worse, downstream the `metadata` is consumed twice with hand-rolled `as` casts: `metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[] | undefined` appears at `gherkin-ast-parser.ts:494` and `:525`. The `_unrecognizedEnums`, `_roleTagValues`, `_unrecognizedRoleValues`, `_deprecatedTags` keys are clearly _internal_ signaling, not pattern metadata, but they share the same bag.

**Fix:** split the return into two explicit types — the parsed pattern fields and an "extractor diagnostics" companion:

```ts
interface ParsedFeatureMetadata {
  // 38 typed pattern fields, no index signature
}

interface FeatureMetadataDiagnostics {
  readonly deprecatedTags?: readonly string[];
  readonly roleTagValues?: readonly string[];
  readonly unrecognizedRoleValues?: readonly string[];
  readonly unrecognizedEnums?: readonly UnrecognizedEnumEntry[];
}

export function extractPatternTags(
  tags: readonly string[],
  registry?: TagRegistry,
): { metadata: ParsedFeatureMetadata; diagnostics: FeatureMetadataDiagnostics } {
  /* … */
}
```

This kills the `_*` prefix smell and the `as` casts simultaneously.

### H5. 27× `structuredClone` per public read-API method

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-graph-api.ts` (lines 81-345)

`createPatternGraphAPI` (`PatternGraphAPI` is the central read surface used by CLI, MCP, and projection) wraps **every single returned value** in `cloneValue` (= `structuredClone`). 27 call sites in 264 lines. Three observations:

1. The `RelationshipEntry`, `PatternGraph`, etc. shapes are already declared `readonly` in their TS types. Cloning is the runtime enforcement, fine — but `structuredClone` walks the entire object graph each call. For `getPatternGraph()` (line 344), that's a deep copy of the _entire_ read model on every call; for `getRecentlyCompleted()` it copies every completed pattern.
2. `cloneTagRegistry` (lines 85-100) hand-rebuilds a `tagRegistry` so it can preserve the `transform` function reference (which `structuredClone` would reject as not-cloneable). This is correct, but it's an early-warning sign: the model contains non-cloneable values.
3. Calls like `cloneValue(dataset.byStatus[status])` are wasteful when the caller is going to map/filter it anyway. Callers can't avoid the clone because the API forces it.

**Fix:** give the API two surfaces — one returns frozen-shallow views (cheap, mutability-safe via `Object.freeze` at construction time), one returns mutable deep clones for callers that need to mutate. Or simply: deep-freeze the entire dataset once at construction time and return references. `structuredClone` should be reserved for cross-realm boundaries (worker messaging, IPC), not in-process reads.

```ts
function deepFreeze<T>(obj: T): T {
  /* recursive Object.freeze */
}

export function createPatternGraphAPI(dataset: PatternGraph): PatternGraphAPI {
  const frozen = deepFreeze({ ...dataset, tagRegistry: cloneTagRegistry(dataset.tagRegistry) });
  return {
    getPatternsByNormalizedStatus: (s) => frozen.byNormalizedStatus[s], // no clone
    // …
  };
}
```

If any current test depends on mutating a returned array, it's wrong and will surface immediately. Either way, the 27× deep clone is paying for a property the type system already claims.

### H6. Validation schemas use `z.object` instead of `z.strictObject` across 28 sites

**Files:**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/output-schemas.ts` (lines 10, 17, 22, 30, 40, 48, 56, 63, 71, 78) — 10 schemas, all of them the output boundary for CLI/MCP commands
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/pattern-graph.ts` (lines 42, 49, 57, 65, 72, 79, 85, 98, 106) — 9 schemas, the canonical read model (also flagged as C2)
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-shape.ts` (lines 7, 14, 22, 29, 36, 56, 64, 74) — 8 schemas
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-pattern.ts` (line 13 — `BusinessRuleSchema`)

The output schemas are particularly bad: they are the surface that downstream tooling (CLI bins, MCP tools) commits to. Open objects there mean an extra field can silently slip out the door for years.

**Fix:** replace `z.object(` with `z.strictObject(` everywhere in `validation-schemas/`. The pre-1.0 No-BC posture makes this a one-line PR. Any test fixture that fails will reveal a real over-broad value.

### H7. Double-parsing `ExtractedPatternSchema` — extraction then transform

**Files:**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/doc-extractor.ts` (line 294) — `ExtractedPatternSchema.safeParse(pattern)` at extraction time
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts` (lines 455 and 606) — same parse for each Gherkin pattern, in both sync and async paths
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-dataset.ts` (line 103) — `ExtractedPatternSchema.safeParse(pattern)` **again**, on already-typed `ExtractedPattern[]`

`transformToPatternGraphWithValidation` re-parses every pattern even though the extractor already returned `ExtractedPattern[]` (the type guarantees it parsed successfully). The CPU cost scales linearly with pattern count; on the 318-pattern dogfood graph it's parsing 318 patterns twice. Doctrine: "Parse once at the trust boundary."

**Fix:** if the transform wants to defend against bad input, take `unknown[]` and parse once there; otherwise drop the second `safeParse` and trust the type:

```ts
// transform-dataset.ts:102-120 → just iterate
for (const pattern of rawPatterns) {
  // no parse — pattern is already ExtractedPattern
  patterns.push(pattern);
  allPatternNames.add(getPatternName(pattern));
  if (!isKnownStatus(pattern.status)) unknownStatusSet.add(pattern.status);
}
```

The `malformedPatterns` collection becomes dead code (already-extracted patterns can't be malformed at this point). If the only role of this second parse is to catch test fixtures that bypass the extractor, write a separate `validateRawDataset(unknown)` entrypoint and leave the hot path alone.

### H8. `Record<string, unknown>` builder pattern in `buildGherkinRawPattern`

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts` (lines 192-339)

`buildGherkinRawPattern` builds a `Record<string, unknown>` by calling `assignIfDefined` (line 63) ~35 times with a hand-typed property name (`"patternName"`, `"status"`, …). A typo in any quoted key compiles cleanly and silently drops the field. The 35-line block at lines 253-295 is genuinely fragile — `assignIfDefined(rawPattern, 'patternName', metadata.pattern)` works only because `metadata.pattern` happens to match `patternName` on the schema side (one drift one debug night).

**Fix:** build a strongly-typed input partial whose keys match the schema, then let TS check it:

```ts
function buildGherkinRawPattern(input: …): z.input<typeof ExtractedPatternSchema> {
  const result: z.input<typeof ExtractedPatternSchema> = {
    id: input.patternId,
    name: input.patternName,
    // … only spread present fields:
    ...(input.metadata.status !== undefined && { status: input.metadata.status }),
  };
  return result;
}
```

This deletes both `assignIfDefined` and `assignIfNonEmpty` and gets compile-time checking of every key.

### H9. Hardcoded business domain paths in core (`/orders/`, `/inventory/`)

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/layer-inference.ts` (lines 33-36)

```ts
if (!isIntegration) {
  if (normalizedPath.includes('/orders/') || normalizedPath.includes('/inventory/')) {
    return 'domain';
  }
}
```

`@libar-dev/architect-core` is a published library; baking in `/orders/` and `/inventory/` as "domain" cues is a dogfooding leak from a sample app or older demo. Consumer projects don't have these directories.

**Fix:** delete the two hardcoded checks. If layer inference for specific directory names is a user need, accept a `domainPathSegments?: readonly string[]` parameter and let the consumer configure it via `architect.config.ts`. Pre-1.0 doctrine: break it now, not later.

### H10. `self-hosting.ts` ships workspace paths from the published package

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/self-hosting.ts` (lines 70-110)

Hardcodes `packages/architect-core`, `packages/architect-projection`, … as workspace globs and exports `resolveWorkspaceSources(baseDir)` that triggers when `baseDir.endsWith('/packages/architect')`. This is dogfood plumbing leaking into the published `dist/`. A library consumer either gets confused by the export or — worse — has it silently match their own monorepo's `packages/architect/` directory.

**Fix:** move `PACKAGE_SELF_HOSTING_SOURCES`, `ARCHITECT_PACKAGE_ROLES`, `WORKSPACE_TAG_REGISTRY`, and `resolveWorkspaceSources` to a dogfood-only file outside `src/` (e.g. `scripts/self-hosting-config.ts` or a private workspace package). The published bundle should not include them.

---

## Medium

### M1. Local `getPatternName` shadows the canonical one

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/relationship-resolver.ts` (line 9)

```ts
function getPatternName(pattern: ExtractedPattern): string {
  return pattern.patternName ?? pattern.name;
}
```

…while `src/read-api/pattern-helpers.ts:58` exports the same function. The two implementations are identical _today_; if either evolves, the relationship-resolver's view of "which name is canonical" will diverge from the rest of the read API.

**Fix:** import the canonical one. `relationship-resolver.ts` already lives under `generators/pipeline/`, so the import path is `../../read-api/pattern-helpers.js`.

### M2. Obfuscated property names to evade lint (`'codec' + 'Options'`)

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/config-loader.ts` (line 191)

```ts
for (const key of ['codec' + 'Options', 'referenceDoc' + 'Configs']) {
  Reflect.deleteProperty(copy, key);
}
```

String concatenation in array literals is a textbook obfuscation pattern, usually written to hide identifiers from grep/lint or to silence a no-unknown-keys rule. This is a code smell flagged by the doctrine ("No `eslint-disable*` of any flavour") in spirit if not in letter. The intent is unclear: why is the loader silently stripping `codecOptions` and `referenceDocConfigs` from the user's config before Zod sees it?

**Fix:** if these are deprecated config keys, document and reject them via Zod with a clear error. If they're internal-only and the user's config might have them, either ignore them via `z.strictObject` (which will reject and tell the user) or list them explicitly:

```ts
const STRIP_LEGACY_KEYS = ['codecOptions', 'referenceDocConfigs'] as const;
const configForValidation = Object.fromEntries(
  Object.entries(exported as Record<string, unknown>).filter(
    ([k]) => !(STRIP_LEGACY_KEYS as readonly string[]).includes(k),
  ),
);
```

…or, better, delete the strip entirely and let `z.strictObject` reject. The current form makes a static reader believe something fishy is happening.

### M3. `void x;` dead-code suppressions

**Files:**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/doc-extractor.ts` lines 249, 252
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts` line 604

```ts
// doc-extractor.ts:249-252
void extractionWarnings; // ← silences unused-var warning
void inferMaturity(status); // ← computes and throws away the result

// gherkin-extractor.ts:604
void metadata.status; // ← reads a property for no reason
```

These are precisely the kind of "soft suppression" the No-BC doctrine forbids. `extractionWarnings` is populated (lines 232-236) but never emitted; if the warnings matter, surface them; if they don't, stop accumulating them. `void inferMaturity(status)` either calls a side-effectful function (it isn't) or is dead — delete it.

**Fix:** in `doc-extractor.ts`, decide whether shape-extraction warnings flow into the `diagnostics` channel; if yes, add them; if no, delete the array and the `void` line together. Same for `gherkin-extractor.ts:604`.

### M4. `Parsed*Schema` and `FeatureFileSchema` aliases are unused BC residue

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/feature.ts` (lines 100-110)

```ts
export const ParsedStepSchema = GherkinStepSchema;
export const ParsedScenarioSchema = GherkinScenarioSchema;
export const ParsedBackgroundSchema = GherkinBackgroundSchema;
export const ParsedFeatureSchema = GherkinFeatureSchema;
export const FeatureFileSchema = ScannedGherkinFileSchema;

export type ParsedStep = z.infer<typeof ParsedStepSchema>;
// ...
```

`grep -rn 'ParsedStepSchema|ParsedScenarioSchema|ParsedBackgroundSchema|ParsedFeatureSchema|FeatureFileSchema'` across `src/` returns zero hits outside the alias declarations and the barrel `index.ts` re-export. They are dead aliases — exactly the "renaming for backwards compatibility" pattern the doctrine forbids.

**Fix:** delete lines 100-110 of `feature.ts`. Remove the corresponding exports from `validation-schemas/index.ts:74-83`.

### M5. `validateDualSource`/`extractProcessMetadata` use `console.warn` for errors

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/dual-source-extractor.ts` (lines 94-99, 178-184)

```ts
console.warn(
  `Process metadata validation failed in ${feature.filePath}: ` +
    validation.error.issues.map(...).join(', '),
);
return null;
```

This module has its own `ExtractionDiagnostic` channel (used elsewhere in the same file) but in two spots it logs directly to `console.warn` and silently drops the result. Consumers (CLI/MCP) cannot intercept, structured-log, or test against these messages.

**Fix:** push these into the `ExtractionDiagnostic[]` return channel like the rest of the file. `extractProcessMetadata` returns `ProcessMetadata | null` today — widen to `{ metadata: ProcessMetadata | null; diagnostics: ExtractionDiagnostic[] }` and bubble.

### M6. `asModuleId` is a raw `as` cast while every other branded constructor parses

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/types/branded.ts` (line 41)

```ts
export function asModuleId(id: string): ModuleId {
  return id as ModuleId;
}
```

Every other `as*` constructor in the file goes through `ZodSchema.parse(...)`. This one quietly skips validation. Either delete `asModuleId` (the comment says `ModuleId = PatternId` already), or make it call `asPatternId`.

**Fix:**

```ts
export function asModuleId(id: string): ModuleId {
  return asPatternId(id);
}
```

…or delete it entirely if no one calls it (a quick grep shows no callers).

### M7. `parseDirective` is a 170-line function with 25 typed casts

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/ast-parser.ts` (lines 225-401)

The function is doing five distinct jobs: (1) extract `tags[]` from comment lines, (2) extract `inlineDescription`, (3) extract every metadata tag through the format-dispatch, (4) collect deprecated tags, (5) extract `description`/`examples`. Each metadata key is retrieved from a `Map<string, unknown>` and cast (lines 279-296):

```ts
const patternName = metadataResults.get('pattern') as string | undefined;
const status = metadataResults.get('status') as AcceptedStatusValue | undefined;
const boundedContext = metadataResults.get('bounded-context') as string | undefined;
// ... 18 more
```

These casts are the inverse of the doctrine's Zod-first stance: the registry knows each tag's format type at compile time, but the dispatch returns `unknown` and forces the caller to remember which TypeScript type to assert.

**Fix:** factor:

- `extractTagsAndDescription(lines, patterns)` → `{ tags, inlineDescription, descriptionLines, examples }`
- `extractMetadata(commentText, registry)` → `ParsedMetadata` (a strongly-typed bag with no `unknown` casts; format-specific helpers return their actual TS type)
- `collectDeprecatedTags(tags, registry)` → `readonly string[]`

`parseDirective` becomes ~40 lines of glue.

### M8. `cloneTagRegistry` rebuilds a tagRegistry by hand because `transform` is a function

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-graph-api.ts` (lines 85-100)

The function exists because `structuredClone` can't clone a function reference. This is _correct_ defensive coding, but it's the side effect of trying to clone a registry that contains live functions in the first place. Combined with H5 (no need for clone-on-read), this whole helper goes away.

**Fix:** drop after addressing H5.

### M9. Local `cloneRoles` in `factory.ts` overlaps `cloneRoleDefinitions` in `registry-builder.ts`

**Files:**

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/factory.ts` (lines 9-18)
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/taxonomy/registry-builder.ts` (lines 34-39)

Two near-identical helpers for "clone an array of role definitions". The `factory.ts` version preserves `diagramShape`; the `registry-builder.ts` version doesn't. They have already drifted.

**Fix:** one helper, exported from one place; pick the one that preserves all keys.

### M10. `transform: z.function().optional()` is an untyped escape hatch

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/tag-registry.ts` (line 32)

Zod's `z.function()` does not validate runtime function shape. Any function passes. A wrong-arity transform makes it through the registry parse and blows up at extraction time.

**Fix:** if `transform` is part of the cross-package contract, declare it explicitly as `z.custom<(value: string) => string>(v => typeof v === 'function')` so the _contract_ is clear, and tighten the call site to coerce:

```ts
transform: z.custom<(value: string) => unknown>(v => typeof v === 'function').optional(),
```

…then in callers (`gherkin-ast-parser.ts:431-433`) check the runtime shape (`typeof result === 'string'`) — which they already do — and consider whether `transform` belongs in a serializable registry at all (it's not JSON-safe).

### M11. `RoleDefinitionSchema`+`RoleDefinition` type re-aliased to config type

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/tag-registry.ts` (line 20)

```ts
export const RoleDefinitionSchema = z.strictObject({
  /* fields */
});
export type RoleDefinition = ConfigRoleDefinition; // ← not z.infer<typeof RoleDefinitionSchema>
```

`RoleDefinition` is exported with the _config-side_ TS type, not the Zod-inferred one. The two are _almost_ the same but their `aliases` differs (`z.array(...).default([])` infers `string[]` after default; the config one is `readonly string[] | undefined`). Subtle drift.

**Fix:**

```ts
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;
```

If anything in `config/role-constants.ts` depends on the looser shape, fix that downstream (probably it should adopt the schema's type).

### M12. Output schemas declare a `BusinessRuleSchema` with `z.object`

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-pattern.ts` (line 13)

`BusinessRuleSchema = z.object({...})` — same H6 concern, but on a single nested schema. It's embedded in `ExtractedPatternSchema.rules`, which is itself the public pattern shape.

**Fix:** `z.strictObject`.

---

## Low

### L1. `discoverTaggedShapes` re-finds declarations and comments

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/shape-extractor.ts` (lines 629-678)

`discoverTaggedShapes` runs `findDeclarations` on the AST (line 650), then for each declaration runs `extractPrecedingJsDoc` (line 657) which iterates the _full comment list_ per declaration. For a 600-line file with 30 declarations and 50 comments, that's 1,500 comment iterations. A sorted index over comment-end lines (already implemented in `prepareJsDocComments`/`findCommentEndingAtLine` for the property-doc path) would make this O(n log n) instead of O(n²).

**Fix:** build `prepareJsDocComments(comments)` once outside the loop, then binary-search per declaration. Same pattern used at lines 421-462 of the same file.

### M-Low overlap: shape-extractor regex caches are unused

`/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/ast-parser.ts:39-50` defines `REGEX_CACHE` and `getCachedRegex` — this is good. But `discoverTaggedShapes` (in `shape-extractor.ts`) and `extractShapeTag`/`extractIncludeTag` (lines 610-627) build fresh `RegExp` literals inline on every invocation. Cheap individually; meaningful in a large-file batch run.

**Fix:** hoist the regex literals (`/architect-shape(?!-)(?:\s+([^\s*/]+))?/`, `/architect-include(?!-)(?:\s+([^\n@*]+))?/`) to module scope.

### L2. `extractFirstSentenceRaw` doesn't handle `?!`/`.)` combos

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/utils/session-helpers.ts` (lines 26-34)

The regex `/[.!?](?=\s+[A-Z]|\s*$)/` misses `"Hello world. (something)"` (capital after `(`) and `"Hello world. it works."` (lowercase after period — valid sentence in some prose). Edge cases. Not load-bearing for now.

**Fix:** worth a test fixture + tighter regex if downstream tools rely on it; otherwise leave for now.

### L3. `camelCaseToTitleCase` does six regex replaces per known acronym

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/utils/string-utils.ts` (lines 59-99)

For each of the 37 `KNOWN_ACRONYMS`, the function rebuilds 5 regexes and runs 5 replaces, even when the acronym is absent (the `if (result.includes(acronym))` guard helps but still rebuilds the regex per match). For long strings this is fine; for hot-path use it isn't.

**Fix:** precompute one `Map<acronym, RegExp[]>` at module scope. Not urgent.

### L4. `findIntegrationPoints` calls `getRelationshipsForPattern` twice per pattern in `compareContexts`

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/architecture-inspection.ts` (lines 144-183, 200-244)

`aggregateContextDependencies` and `findIntegrationPoints` each call `getRelationshipsForPattern` per pattern in their loops, and `compareContexts` calls both for both contexts. With the WeakMap cache in `pattern-helpers.ts` it's not free — cache hit, but still the lookup chain.

**Fix:** in `compareContexts`, fetch the relationship index once via `getCanonicalRelationshipIndex(dataset)` and pass it to the helpers.

### L5. `aggregateTagUsage` hardcodes which tags to track

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/graph-inventory.ts` (lines 50-84)

The `increment(...)` block enumerates 8 tags (status, role, arch-context, phase, priority, quarter, team, effort) by hand. Adding a new metadata tag means editing this function. With a `TagRegistry` available, this could iterate `dataset.tagRegistry.metadataTags`.

**Fix:** drive the loop from the registry. Optional, not load-bearing.

### L6. `extractPatternTags` mutates while iterating with `[...(existing ?? []), value]`

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts` (lines 513-516, 533-536)

Inside a `for (const tag of tags)` loop, the metadata accumulator does `metadata[key] = [...(existing ?? []), ...transformed]` per repeatable tag. For features with 30+ tags this is O(n²) for the CSV/repeatable paths.

**Fix:** keep a temporary `Map<string, string[]>` for repeatable values and assemble the array once at the end.

### L7. `inferPatternName` returns `${primaryTag}-pattern` as a last-resort

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/doc-extractor.ts` (lines 309-328)

When neither `directive.patternName`, the description heading, nor `exports[0]` is available, the function falls back to `${tagWithoutPrefix}-pattern` — e.g., a directive tagged only `@architect` returns `unknown-pattern`. Then `slugify(name)` runs on it in `ExtractedPatternBaseSchema.name.refine` and may pass. This makes "no name available" silently succeed with a garbage name.

**Fix:** return a diagnostic instead of a fake name. The caller is already collecting diagnostics, so this is a 5-line refactor.

### L8. Mutable mutation through readonly arrays via `as` widening

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/shape-extractor.ts` (lines 87-91)

```ts
shapes.push(
  extractShape(sourceCode, declaration, ast.comments ?? [], {
    includeJsDoc,
    preserveFormatting,
  }),
);
```

`extractShape` is annotated to return a fresh `ExtractedShape`, but inside `discoverTaggedShapes` (line 670), `{ ...shape, group: tagResult.group, ...(includeValues !== undefined && { includes: includeValues }) }` is _re-creating_ the shape just to add two fields. This is fine but minor: the `extractShape` could accept an optional `{ group?, includes? }` instead.

### L9. `Result.unwrap` JSON.stringifies non-Error errors

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/types/result.ts` (lines 70-82)

If the error is an object with circular refs or non-cloneable members, `JSON.stringify` throws and the original error is lost. Low-impact (most errors are `Error` instances) but worth catching.

**Fix:** wrap in `try`/`catch` and fall back to `Object.prototype.toString.call(...)` if stringify throws.

### L10. `package-config.ts` extends a strictObject

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/package-config.ts` (lines 10-12)

```ts
export const PackageConfigSchema = PackageSchema.extend({ match: PackageMatcherSchema });
```

In Zod v4, `.extend(...)` on a strictObject produces a strictObject only if the chain is explicit. Worth a Zod test to confirm `PackageConfigSchema.parse({ id, displayName, match, extra: 'nope' })` still fails. If it doesn't, the strict guarantee silently disappeared.

**Fix:** if the test fails, re-declare:

```ts
export const PackageConfigSchema = z.strictObject({
  ...PackageSchema.shape,
  match: PackageMatcherSchema,
});
```

### L11. `id-utils.ts` is 7 lines but exported as `utils/index.ts`

**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/utils/id-utils.ts` (whole file)

7 lines, one export. Not a problem; just an observation that the `utils/` folder has very small files (`fuzzy-match.ts` is the only substantive one). If you ever pursue a flatter `utils.ts`, it would consolidate well.

---

## Patterns to address as a sweep (not finding-sized)

These are repeated micro-patterns visible across the codebase. They are individually small but the cumulative cost is real and they all fall under the same fix.

1. **Defensive cloning of readonly arrays** (`[...(role.aliases ?? [])]`, `Array.from(tag.values)`, `[...registry.metadataTags]`) appears in `taxonomy/registry-builder.ts:34-39`, `config/factory.ts:9-18`, `validation-schemas/tag-registry.ts:54-81`, and `read-api/pattern-graph-api.ts:85-100`. If the source arrays are `readonly`, the type system already protects the consumer; the clones cost allocations.

2. **`...(x !== undefined && { x })` spread pattern.** This is used everywhere (`gherkin-extractor.ts:225-294`, `doc-extractor.ts:265-291`, `factory.ts:33-50`, …) and is the right thing to do under `exactOptionalPropertyTypes`. No fix; just observe that it makes object literals very long. Consider a `omitUndefined()` helper:

   ```ts
   function omitUndefined<T extends object>(
     obj: T,
   ): { [K in keyof T]-?: Exclude<T[K], undefined> } {
     return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as any;
   }
   ```

   Then `{ id, name, ...omitUndefined({ patternName, role, status, … }) }`. Trade: one less explicit listing per call site, less typed defensiveness — judgment call.

3. **`(existing ?? []).push` then `set` pattern** (used in `transform-dataset.ts:175-200`, `gherkin-ast-parser.ts:534-537`, etc.) is fine, but a `Multimap<K,V>` helper would eliminate 8-10 copies.

---

## What's healthy and worth preserving

To balance the above, several patterns in `architect-core` are exemplary:

- **`parseAtBoundary` and `BoundaryParseError`** (`src/validation/boundary.ts`) are exactly the right shape for "parse once at the trust boundary." The doctrine is correctly _implemented_ here — what's needed is to make every call site use it.
- **The `Result<T, E>` monad** (`src/types/result.ts`) and the discriminated `DocError` union (`src/types/errors.ts`) are clean, exhaustive, well-documented.
- **The FSM transition table** (`src/validation/fsm/transitions.ts`) is small, readable, and produces good error messages.
- **No suppressions.** Zero `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` comments in `src/`. Zero `TODO`/`FIXME`/`HACK` markers. That's discipline.
- **Branded types** (`src/types/branded.ts`) are correctly nominal via Zod's `.brand<...>()`. (One slip-up at `asModuleId` — see M6.)
- **The fuzzy-match implementation** (`src/utils/fuzzy-match.ts`) is concise and correct.

The cleanup recommended above is mostly aligning a few sloppy modules with the doctrine the rest of the package already proves it can keep.
