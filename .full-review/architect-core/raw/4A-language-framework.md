# architect-core — Phase 4A: TypeScript Language & Framework Best Practices

**Scope:** TS 5.8 idioms, Zod 4 patterns, pure-ESM correctness, Node 20 stdlib hygiene, Vitest 4 / `@amiceli/vitest-cucumber` patterns, deprecated APIs.
**Source root:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/` (106 files, ~12,360 SLOC)
**Cross-references:** Phase 1 (`C/H/M/L-CORE-*`), Phase 2 (`H/M/L-SIMP-*`, `CL-CORE-*`), Phase 3 (`TC-*`, `DOC-*`, `TD-CORE-*`). Findings here are framed around the **language/framework angle** of issues those phases identified — they do not re-derive root causes.

---

## 1. Executive Summary

The package has the right _posture_ for a strict, Zod-first, TS 5 / Node 20 / pure-ESM codebase: `verbatimModuleSyntax` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature` all on; zero `@ts-ignore`/`@ts-expect-error`/`eslint-disable` in `src/`; one local ESLint rule (`architect-local/no-suppression-comments`) actively guards the doctrine; `import type` and `.js`-extension relative imports are used consistently; `import.meta.url`/`fileURLToPath` rather than `__dirname`; Zod 4 APIs (`z.prettifyError`, `z.iso.datetime`, `.brand<…>()`, `z.discriminatedUnion` for `ExportInfoSchema`) appear where they should.

The framework-angle gaps cluster in three places. **First, Zod 4 idiom drift on the load-bearing read model** — `PatternGraphSchema` and 8 nested shapes use `z.object` (Zod 4 keeps these open at runtime; `.extend()` in v4 no longer propagates strictness), and `nameIndex: ReadonlyMap` is in the hand-typed `PatternGraph` interface but not in the schema, so `parseAtBoundary` silently drops it. **Second, the TS strictness flags are quietly defeated in three production-path files**: 16× `as ProcessStatusValue`/`as string[]`/`as DocDirective['level']` in `scanner/ast-parser.ts:279-296` after a `Map.get` returns `unknown`; 2× `as UnrecognizedEnumEntry[]` reads through the `[key: string]: unknown` index signature in `scanner/gherkin-ast-parser.ts:494,525`; and `validation/fsm/validator.ts:92,93,102` casts strings to `ProcessStatusValue` _after_ the type guard rejected them. **Third, Node-stdlib hygiene is mixed** — three synchronous fs calls (`readFileSync` in `doc-extractor.ts:231`, `existsSync` in `gherkin-extractor.ts:502`, `realpathSync` in `validation-schemas/config.ts:10`) sit on hot paths; `path.join` is used with `path.sep` rather than `path.posix` for IDs, which leaks Windows backslashes into source-file paths inside the graph; and three `void X;` expressions (`doc-extractor.ts:249,252`, `gherkin-extractor.ts:604`) survive only because the local lint rule pattern doesn't catch `UnaryExpression[operator="void"]`.

**Two most impactful TS/Zod modernization wins.** (1) Sweep `z.object → z.strictObject` in `validation-schemas/` (28 sites; aligns with Phase 1 C-CORE-2/H-CORE-7) and replace the hand-written `PatternGraph`/`StatusGroups`/`ExactStatusGroups`/`PhaseGroup`/`SourceViews`/`ArchIndex` interfaces with `z.infer<typeof XSchema>`. (2) Build the gherkin raw pattern as a typed `z.input<typeof ExtractedPatternSchema>` rather than `Record<string, unknown>` (closes H-CORE-15 + H-CORE-16 in one pass and eliminates the `[key: string]: unknown` index signature that defeats `noPropertyAccessFromIndexSignature`).

**Two deprecated patterns to retire.** (a) `z.function().optional()` in `validation-schemas/tag-registry.ts:32` — Zod 4 changed `z.function()` from "no-op runtime, return-typed pass-through" into a strict function-args-validator factory (`z.function({ input, output })`); the current usage is a Zod-3-era no-op now flagged by `@typescript-eslint/no-deprecated` (which is set to `warn` for exactly this reason at root `eslint.config.mjs:331`). Replace with a string-name resolver, not the new `z.function(...)`. (b) `parseInt(str, 10)` + `isNaN(num)` at `scanner/gherkin-ast-parser.ts:486-487`, `extractor/dual-source-extractor.ts:118-119`, `scanner/ast-parser.ts:104`, `extractor/dual-source-extractor.ts:56` — `Number.isNaN` is the strict-mode-correct call; `Number.parseInt` makes the call site greppable as integer-rather-than-float.

---

## 2. Findings by Severity

### Critical

#### F4A-C-1. `validateTransition` casts strings to `ProcessStatusValue` after the type guard rejected them — strictness is silently broken

**File:** `src/validation/fsm/validator.ts:88-105`. Extends Phase 1 **C-CORE-5** with the TS angle.

```ts
export function validateTransition(from: string, to: string): TransitionValidationResult {
  if (!isValidStatusValue(from)) {
    return {
      valid: false,
      from: from as ProcessStatusValue,        // <-- cast to a type the guard just rejected
      to: to as ProcessStatusValue,
      error: `Invalid source status '${from}'...`,
    };
  }
  if (!isValidStatusValue(to)) {
    return { valid: false, from, to: to as ProcessStatusValue, error: ... };
  }
```

This is the textbook reason `as X` after a type guard is wrong: the discriminant `valid: false` is the only thing keeping callers from reading garbage; downstream code that branches on `result.from === 'roadmap'` compiles fine and is wrong. `architect-guard/src/lint/process-guard/decider.ts:300` is the production caller (per Phase 3 TC-C-3 inventory) — so this is on the production path, not a corner of internals.

**Recipe (after-shape):** discriminated result type plus `Number.isNaN`-style strictness.

```ts
export type TransitionValidationResult =
  | { readonly valid: true; readonly from: ProcessStatusValue; readonly to: ProcessStatusValue }
  | {
      readonly valid: false;
      readonly from: string;
      readonly to: string;
      readonly error: string;
      readonly validAlternatives?: readonly ProcessStatusValue[];
    };

export function validateTransition(from: string, to: string): TransitionValidationResult {
  if (!isValidStatusValue(from)) {
    return { valid: false, from, to, error: `Invalid source status '${from}'.` };
  }
  if (!isValidStatusValue(to)) {
    return { valid: false, from, to, error: `Invalid target status '${to}'.` };
  }
  const validTargets = VALID_TRANSITIONS[from];
  if (validTargets.includes(to)) return { valid: true, from, to };
  return {
    valid: false,
    from,
    to,
    error: getTransitionErrorMessage(from, to),
    validAlternatives: getValidTransitionsFrom(from),
  };
}
```

The three `as ProcessStatusValue` lines disappear; callers who today do `result.from satisfies ProcessStatusValue` get a compiler error that points them at the discriminant — which is the whole point of a discriminated union. **Coincides with Phase 2 M-SIMP-2 — adopt that recipe verbatim.**

#### F4A-C-2. `z.function().optional()` is a Zod-3 idiom that Zod 4 redefined and `@typescript-eslint/no-deprecated` now warns on

**File:** `src/validation-schemas/tag-registry.ts:32`. Extends Phase 1 **M-CORE-8** with the Zod-version angle.

```ts
export const MetadataTagDefinitionSchema = z.strictObject({
  // ...
  transform: z.function().optional(), // <-- Zod 4: this is a deprecated, near-no-op shape
});
```

Two compounding problems:

1. **Zod 4 changed `z.function()` semantics.** In Zod 4, `z.function({ input: [...], output: ... })` is the new function-validating factory; the bare `z.function()` is preserved-for-back-compat shape that does not validate runtime function args or returns — it's effectively `z.custom<(value: unknown) => unknown>()` in disguise. Root `eslint.config.mjs:331` sets `@typescript-eslint/no-deprecated` to `warn` "Deprecated Zod APIs - will update when needed"; this is the bait the comment was set up to catch.
2. **Boundary contract shouldn't hold functions anyway.** `validation-schemas/tag-registry.ts` is a cross-package contract. Functions don't survive JSON / IPC / structured-clone boundaries, which is why `read-api/pattern-graph-api.ts:85-100` ships a hand-rolled `cloneTagRegistry` (Phase 1 M-CORE-14).

**Recipe (after-shape):** make the boundary data-only; resolve names to functions inside the extractor.

```ts
// validation-schemas/tag-registry.ts
const KNOWN_TRANSFORM_NAMES = ['stripQuotes', 'padAdr'] as const;
type KnownTransformName = (typeof KNOWN_TRANSFORM_NAMES)[number];

export const MetadataTagDefinitionSchema = z.strictObject({
  // ...
  transform: z.enum(KNOWN_TRANSFORM_NAMES).optional(), // serializable boundary
});

// taxonomy/registry-builder.ts — internal resolution
const TRANSFORMS: Record<KnownTransformName, (value: string) => string> = {
  stripQuotes,
  padAdr,
};
function resolveTransform(name: KnownTransformName | undefined) {
  return name === undefined ? undefined : TRANSFORMS[name];
}
```

`cloneTagRegistry` (`read-api/pattern-graph-api.ts:85-100`) collapses to one line because every field is now structurally cloneable. The `transform: z.function().optional()` deprecation warning disappears.

---

### High

#### F4A-H-1. 16× `Map.get(...) as X` casts in `parseDirective` defeat `noUncheckedIndexedAccess` and `noPropertyAccessFromIndexSignature`

**File:** `src/scanner/ast-parser.ts:279-296`. Compounds Phase 1 **M-CORE-11** + **H-CORE-14** with the TS strictness angle.

```ts
const metadataResults = new Map<string, unknown>();
for (const tagDef of registry.metadataTags) {
  const result = extractMetadataTag(commentText, tagDef, registry.tagPrefix);
  if (result !== undefined) metadataResults.set(tagDef.tag, result);
}

const patternName = metadataResults.get('pattern') as string | undefined; // :279
const status = metadataResults.get('status') as AcceptedStatusValue | undefined; // :280
const boundedContext = metadataResults.get('bounded-context') as string | undefined;
const uses = metadataResults.get('uses') as string[] | undefined;
const phase = metadataResults.get('phase') as number | undefined;
const level = metadataResults.get('level') as DocDirective['level'];
// ... 10 more casts through line 296
```

The map's `unknown` value type forces every read to be an `as`-cast. None of them are validated by Zod (the cast is just told-you-so). When Phase 1 H-SIMP-6 lands (one `applyTagValue` applier in `taxonomy/tag-parsing.ts`), the applier already has format-typed value shapes — the casts then disappear _automatically_. But before H-SIMP-6, these 16 sites are the largest cluster of TS-strictness-evasion in `src/`.

**Recipe (after-shape):** instead of `Map<string, unknown>`, return a typed result from `applyTagValue` keyed by the metadata tag definition's `format` (already a Zod enum).

```ts
type TagValueByFormat = {
  readonly value: string;
  readonly enum: string;
  readonly csv: readonly string[];
  readonly flag: true;
  readonly 'quoted-value': string;
  readonly number: number;
};
function applyTagValue<F extends FormatType>(
  format: F,
  rawValue: string,
  definition: MetadataTagDefinition,
): TagValueByFormat[F] | undefined { ... }
```

Now `extractMetadata(commentText, registry)` returns a strongly-typed `ParsedDirectiveMetadata` and `parseDirective` shrinks to glue with zero `as` casts.

#### F4A-H-2. `extractPatternTags` index signature `[key: string]: unknown` defeats `noPropertyAccessFromIndexSignature`; 2× `as UnrecognizedEnumEntry[]` reads through it

**File:** `src/scanner/gherkin-ast-parser.ts:364-418, 494, 525`. Compounds Phase 1 **H-CORE-15** with the TS angle.

```ts
export function extractPatternTags(...): {
  readonly pattern?: string;
  readonly status?: AcceptedStatusValue;
  // ... 42 hand-typed readonly fields ...
  readonly _deprecatedTags?: readonly string[];
  readonly _roleTagValues?: readonly string[];
  readonly _unrecognizedRoleValues?: readonly string[];
  readonly include?: readonly string[];
  readonly usecase?: string;
  readonly [key: string]: unknown;       // <-- defeats `noPropertyAccessFromIndexSignature`
} {
```

```ts
// :494, :525
const existing = metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[] | undefined;
metadata['_unrecognizedEnums'] = [...(existing ?? []), { tag, value, validValues }];
```

The `architect-base` rule `noPropertyAccessFromIndexSignature` is supposed to make this kind of bucket-as-result impossible. The index-signature escape hatch was bolted on so consumers like `gherkin-extractor.ts:606` can pattern-match on every tag without re-typing, but its cost is two `as`-casts on a value the function itself wrote into the bag.

**Recipe (after-shape):** split into two strict shapes — a typed `ParsedFeatureMetadata` for the public surface and a private `FeatureMetadataDiagnostics` for the `_*` collectors. Internal callers consume the second from the function's return; public callers see only the first.

```ts
export interface ParsedFeatureMetadata {
  readonly pattern?: string;
  readonly status?: AcceptedStatusValue;
  // ... real fields only — no `_*` prefix, no index signature
}
export interface FeatureMetadataDiagnostics {
  readonly unrecognizedEnums: readonly UnrecognizedEnumEntry[];
  readonly deprecatedTags: readonly string[];
  readonly roleTagValues: readonly string[];
  readonly unrecognizedRoleValues: readonly string[];
}
export function extractPatternTags(
  tags: readonly string[],
  registry?: TagRegistry,
): { readonly metadata: ParsedFeatureMetadata; readonly diagnostics: FeatureMetadataDiagnostics };
```

Both `as UnrecognizedEnumEntry[]` reads dissolve because the inner accumulator is the typed array directly. Pairs with **Phase 1 H-SIMP-5** (`buildGherkinRawPattern` builds `z.input<typeof ExtractedPatternSchema>` directly).

#### F4A-H-3. `PatternGraphSchema` + 8 siblings use `z.object` — Zod 4 keeps these open at runtime AND the hand-written `PatternGraph` interface diverges from the schema

**File:** `src/validation-schemas/pattern-graph.ts:42-179`. Extends Phase 1 **C-CORE-2** + **H-CORE-7** with the Zod-version angle.

Two Zod-4-specific framework concerns on top of the doctrine breach Phase 1 already documented:

1. **`z.object` is open in Zod 4.** Extras pass `safeParse` and survive to consumers. `parseAtBoundary(PatternGraphSchema, dataset)` (which the package preaches but doesn't yet use — Phase 1 H-CORE-3) would not catch a downstream library accidentally injecting a `byProductGroup` view. The 9 schemas in this file are the cross-package read-model contract; doctrine has them as `z.strictObject` by definition.
2. **The hand-written `interface PatternGraph` adds `nameIndex?: ReadonlyMap<string, ExtractedPattern>` (line 177) that the schema does not declare.** If `parseAtBoundary(PatternGraphSchema, dataset)` runs, `nameIndex` is silently dropped — `safeParse` returns a new object reconstructed from `.shape`, and Maps don't survive Zod transforms anyway. This is exactly the "type lies, schema is truth" failure mode `z.infer` is designed to prevent.

**Recipe (after-shape):** `z.strictObject` everywhere, `z.infer<typeof PatternGraphSchema>` as the only source of `PatternGraph`, and move `nameIndex` to `RuntimePatternGraph` (already exists in `generators/pipeline/transform-types.ts` for `workflow`).

```ts
// validation-schemas/pattern-graph.ts
export const PatternGraphSchema = z.strictObject({
  patterns: z.array(ExtractedPatternSchema),
  tagRegistry: TagRegistrySchema,
  byStatus: ExactStatusGroupsSchema, // also z.strictObject
  byNormalizedStatus: StatusGroupsSchema,
  byMaturity: z.record(z.string(), z.array(ExtractedPatternSchema)),
  // ... no `nameIndex` ...
});
export type PatternGraph = z.infer<typeof PatternGraphSchema>;

// generators/pipeline/transform-types.ts (runtime augmentation)
export interface RuntimePatternGraph extends PatternGraph {
  readonly nameIndex: ReadonlyMap<string, ExtractedPattern>;
  // ... other runtime-only fields ...
}
```

Every `interface` from line 125-179 collapses to a one-line `export type X = z.infer<typeof XSchema>`. Phase 2 H-SIMP-3 wraps this; this finding is the Zod-4-versioning rationale for landing it.

#### F4A-H-4. Inferred ReturnType<typeof extractPatternTags> is the only reason 4 modules type-check — the index signature leaks across module boundaries

**Files:** `src/extractor/gherkin-extractor.ts:129,198`, `src/scanner/gherkin-ast-parser.ts:70,80`.

```ts
function collectDeprecatedTagDiagnostics(
  metadata: ReturnType<typeof extractPatternTags>, // <- exports the index-signature shape
  filePath: string,
  roles: readonly RoleLike[],
): ExtractionDiagnostic[];
```

`ReturnType<T>` is the right TS 5 idiom in general, but here it propagates the `[key: string]: unknown` index signature (F4A-H-2) into every consumer. Today 6 sites consume `metadata._roleTagValues`/`metadata._unrecognizedRoleValues`/`metadata._deprecatedTags` through this index signature — and these properties are _not_ in the explicit field list at `gherkin-ast-parser.ts:364-417`; they're only present as part of the open bag. If the H-CORE-15 fix lands without H-CORE-6 (collapse sync/async extractor) coordinating, these consumers silently lose the `_*` fields.

**Recipe (after-shape):** consumers depend on a named explicit shape, not `ReturnType<typeof ...>`:

```ts
function collectDeprecatedTagDiagnostics(
  diagnostics: FeatureMetadataDiagnostics, // from F4A-H-2 recipe
  filePath: string,
  roles: readonly RoleLike[],
): ExtractionDiagnostic[];
```

Land F4A-H-2, F4A-H-4, H-SIMP-5, and H-SIMP-1 in one PR or none. The chain is fragile if split.

#### F4A-H-5. `buildGherkinRawPattern` returns `Record<string, unknown>` with 35× quoted-key assignments — typo-silent

**File:** `src/extractor/gherkin-extractor.ts:192-339`. Extends Phase 1 **H-CORE-16** with the Zod-4 `z.input` angle.

```ts
function buildGherkinRawPattern(input: {...}): Record<string, unknown> {
  const rawPattern: Record<string, unknown> = {
    id: patternId,
    name: patternName,
    // ... 35+ quoted-key spreads:
    ...(metadata.role !== undefined && { role: metadata.role }),
    ...(metadata.boundedContext !== undefined && { boundedContext: metadata.boundedContext }),
    // ...
  };
```

A typo like `boundedContxt` compiles silently and drops the field. Then `ExtractedPatternSchema.safeParse(rawPattern)` at line 606 succeeds (the field is optional) and the value is gone.

**Recipe (after-shape):** use `z.input<typeof ExtractedPatternSchema>` as the literal type of the partial.

```ts
import type { ExtractedPatternSchema } from '../validation-schemas/extracted-pattern.js';
type RawPattern = z.input<typeof ExtractedPatternSchema>;

function buildGherkinRawPattern(input: {...}): RawPattern {
  const rawPattern: RawPattern = {
    id: patternId,
    name: patternName,
    role: metadata.role,                              // optional fields = `T | undefined`; no spread needed
    boundedContext: metadata.boundedContext,
    // ...
  };
  return rawPattern;
}
```

Under `exactOptionalPropertyTypes: true`, the optional fields need to be `T | undefined` rather than spread-omitted. `z.input` gives the pre-transform shape (`SourceInfoSchema.lines`'s tuple, `PatternIdSchema.parse`'s string-before-brand) where as `z.output` gives the post-transform shape — picking `z.input` here is the right Zod 4 idiom because `safeParse` runs on this very value. Same recipe applies to `doc-extractor.ts:254-292` (which builds the equivalent shape with the same problem).

#### F4A-H-6. `package-config.ts:10` uses `.extend()` on a Zod 4 schema — extend does NOT propagate strictness in Zod 4

**File:** `src/package/package-config.ts:10`. Extends Phase 1 **L-CORE-11** + Phase 2 **M-SIMP-7** with the verified Zod-4 behavior.

```ts
export const PackageConfigSchema = PackageSchema.extend({
  match: PackageMatcherSchema,
});
```

If `PackageSchema` is `z.strictObject`, `.extend()` in Zod 4 returns a base `z.object`-flavored schema — **strictness is dropped**. The Phase 2 audit found this is one of only two `.extend()` call sites in the whole package (the other is in test fixtures). Zod 4's [`pick`/`omit`/`extend`/`merge`](https://zod.dev/v4/changelog) all changed their internal `ZodObject` mode propagation in v4.

**Recipe (after-shape):** re-declare with `z.strictObject(...PackageSchema.shape, …)`.

```ts
export const PackageConfigSchema = z.strictObject({
  ...PackageSchema.shape,
  match: PackageMatcherSchema,
});
```

A round-trip parsing test for `PackageConfigSchema` with an extra property is the unit gate that catches this if anyone re-introduces `.extend()`.

#### F4A-H-7. Three sync FS calls on hot paths inside an otherwise-async pipeline

**Files:** `src/extractor/doc-extractor.ts:231` (`fs.readFileSync`), `src/extractor/gherkin-extractor.ts:502` (`fs.existsSync`), `src/validation-schemas/config.ts:10` (`fs.realpathSync`). Extends Phase 1 **H-CORE-6** with the Node-stdlib angle.

- `doc-extractor.ts:231` reads the source file _for every pattern in the graph_ to look up tagged shapes (`sourceContent.includes('architect-shape')`). The 318-pattern dogfood graph reads up to 318 files synchronously, blocking the event loop. The shape extraction runs inside `processFile`, which is already inside `Promise.all`-friendly territory.
- `gherkin-extractor.ts:502` (`fileExistsSync`) is the only reason `extractPatternsFromGherkin` (sync) and `extractPatternsFromGherkinAsync` (async) are two functions — the sync wrapper exists _purely_ to call `fs.existsSync`. The async version uses `fs.promises.access` correctly at line 510.
- `validation-schemas/config.ts:10` (`safeRealpathSync`) inside a Zod `.refine` — Zod refines can't be async without `.refineAsync`, but the refine is checking that `outputDirectory` is within `baseDir`. This is a config-load-time call (happens once at boot), not hot — acceptable.

**Recipe:** for the first two, collapse to async-only (matches Phase 1 H-CORE-6 + Phase 2 H-SIMP-1). For the third, leave as-is and add an `@architect-status` comment noting why sync is acceptable here ("Zod refine context — config-load only, not hot").

#### F4A-H-8. `path.relative(...).split(path.sep).join('/')` — POSIX-paths-as-IDs handled correctly in one place, missed in others

**Files:** `src/generators/pipeline/build-pipeline.ts:108` (correct), `src/extractor/doc-extractor.ts:219`, `src/extractor/gherkin-extractor.ts:366,536` (questionable).

```ts
// build-pipeline.ts:108 — correct
return path.relative(baseDir, filePath).split(path.sep).join('/');
```

```ts
// extractor/doc-extractor.ts:219 — leaks `path.sep`
const relativePath = path.relative(baseDir, filePath);
// then used in `asSourceFilePath(relativePath)` — branded as a SourceFilePath
```

`build-pipeline.ts` knows that pattern-graph IDs (and the `source.file` branded path) need stable, POSIX-style separators because the graph crosses serialization boundaries (JSON output, MCP transport, golden snapshot files). The two extractors don't do the conversion before branding the path. On macOS/Linux this is a no-op; on Windows the brand carries backslashes that then mismatch grep, JSON comparisons, and the dogfood snapshot fixtures.

**Recipe:** factor a single helper `toPosixPath(p: string): string` in `utils/` (or call `path.posix.normalize` after converting separators) and call it everywhere `asSourceFilePath` or `asOutputFilePath` is built. The brand constructor `asSourceFilePath` should _itself_ do the conversion — that's the right place to enforce the invariant.

```ts
// types/branded.ts
const SourceFilePathSchema = z
  .string()
  .transform((p) => p.split(/[\\/]/).join('/')) // normalize before branding
  .brand<'SourceFilePath'>();
```

#### F4A-H-9. Three `void X;` expressions evade the no-suppression lint rule because the rule pattern only matches comments, not expressions

**Files:** `src/extractor/doc-extractor.ts:249,252`, `src/extractor/gherkin-extractor.ts:604`. Compounds Phase 1 **M-CORE-2** + Phase 2 **CL-CORE-6** with the lint-config angle.

```ts
// doc-extractor.ts:249, :252
void extractionWarnings;
void inferMaturity(status);
```

The local plugin `architect-local/no-suppression-comments` at root `eslint.config.mjs:9-42` matches comment values — it does not match `UnaryExpression[operator="void"]` expressions. So `void X;` slips through as a "suppression of unused-variable" the way `@ts-ignore` slips through for unused types — same intent, different syntactic form.

**Recipe (after-shape):** add a `no-restricted-syntax` companion rule (already exemplified in root `eslint.config.mjs:143-171` for `TRUSTED_MARKDOWN` patterns).

```ts
// root eslint.config.mjs, in the production-src block (after line 70)
{
  files: ['packages/*/src/**/*.ts', 'src/**/*.ts'],
  ignores: ['**/tests/**', '**/*.steps.ts', '**/*.spec.ts', '**/*.test.ts'],
  rules: {
    'architect-local/no-suppression-comments': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExpressionStatement > UnaryExpression[operator="void"]',
        message:
          '[no-bc:no-void-expression] Do not use `void X;` to silence unused-variable warnings. Delete the variable or surface its value through the diagnostic channel. See AGENTS.md → "Engineering doctrine → No-BC".',
      },
    ],
  },
},
```

Two of the three `void` sites have a legitimate accumulator (`extractionWarnings`) that should be surfaced via the existing `ExtractionDiagnostic[]` channel; the third (`void metadata.status`) is dead code — `metadata.status` is just read for its side-effect-of-narrowing. After the rule lands, all three become lint errors that force the fix.

---

### Medium

#### F4A-M-1. 19 schemas in `validation-schemas/{output-schemas,extracted-shape,extracted-pattern}.ts` use `z.object` — the CLI/MCP output boundary is open

**Files:**

- `src/validation-schemas/output-schemas.ts:10-78` — 10 schemas (the CLI/MCP output contract).
- `src/validation-schemas/extracted-shape.ts:7-74` — 8 schemas.
- `src/validation-schemas/extracted-pattern.ts:13` — `BusinessRuleSchema`.

Same Zod-4 framework concern as F4A-H-3. These are output schemas — they should reject extras at the boundary. Pre-1.0 No-BC: this is a one-line sweep.

**Recipe:** `z.object(` → `z.strictObject(` family-wide. The 28 sites Phase 1 H-CORE-7 enumerated land here. Test fixtures that fail will reveal exactly which over-broad values today's tests accept by accident.

#### F4A-M-2. `asModuleId` is the only branded constructor that doesn't parse

**File:** `src/types/branded.ts:40-42`. Extends Phase 1 **M-CORE-13** with the framework angle.

```ts
export function asModuleId(id: string): ModuleId {
  return id as ModuleId;
}
```

Every other constructor in the file calls `Schema.parse(...)`; this one is a raw assertion. Since `ModuleId = PatternId`, the right shape is to call `asPatternId`:

```ts
export function asModuleId(id: string): ModuleId {
  return asPatternId(id);
}
```

Or — if there are no callers (Phase 1 says there aren't) — delete the export.

#### F4A-M-3. Per-file `z.iso.datetime` is used correctly once but `z.string().regex(...)` for ISO/semver is used elsewhere

**Files:**

- `src/validation-schemas/extracted-pattern.ts:74` — `z.iso.datetime({ error: 'Must be valid ISO 8601 timestamp' })` (Zod 4 modern idiom).
- `src/validation-schemas/workflow-config.ts:33` — `z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format')` (a fine pattern, but Zod 4 has no native `z.semver` — keep as-is, note for consistency).
- `src/validation-schemas/extracted-pattern.ts:91` and `dual-source.ts:30` — `z.string().regex(QUARTER_PATTERN)` (no error message — Zod default suffices but worth a sentence).

Note for completeness: the Zod 4 `z.iso.datetime` usage is the framework-correct pattern. The semver case has no Zod 4 first-class API.

**Recipe:** for `QUARTER_PATTERN`, brand the type so consumers like `getPatternsByQuarter(string)` (Phase 1 L-CORE-14) become `getPatternsByQuarter(quarter: Quarter)`. `Quarter = z.output<typeof QuarterSchema>` with `QuarterSchema = z.string().regex(QUARTER_PATTERN).brand<'Quarter'>()`. The 1 production call site (`read-api/pattern-graph-api.ts:306`) needs to be reached via `asQuarter(input)` or a parsing helper.

#### F4A-M-4. `parseInt` + `isNaN` instead of `Number.parseInt` + `Number.isNaN`

**Files:** `src/scanner/gherkin-ast-parser.ts:486-487`, `src/extractor/dual-source-extractor.ts:56,118-119`, `src/scanner/ast-parser.ts:104`.

```ts
// gherkin-ast-parser.ts:486
const num = parseInt(rawValue, 10);
if (!isNaN(num)) metadata[key] = num;
```

Global `isNaN` coerces its argument (`isNaN("foo") === true`, `isNaN(undefined) === true`). `Number.isNaN` rejects non-number types at the type level under strict TS — and `Number.parseInt` makes the call greppable as "integer parse" rather than the polysemous `parseInt`. Both are Node 20-correct and TS-strict idioms.

**Recipe:** sweep `parseInt(` → `Number.parseInt(` and `isNaN(` → `Number.isNaN(` in the four sites. Add `@typescript-eslint/prefer-number-properties` to the rule list if available (most TS-ESLint versions ship it; not currently in root config).

#### F4A-M-5. Zod `z.ZodType<T>` annotations on `z.lazy` schemas — correct but worth surfacing as the documented pattern

**File:** `src/config/section-block.ts:102, 130, 144`.

```ts
export const ListItemSchema: z.ZodType<ListItem> = z.lazy(() => ...);
export const CollapsibleBlockSchema: z.ZodType<CollapsibleBlock> = z.lazy(() => ...);
export const SectionBlockSchema: z.ZodType<SectionBlock> = z.lazy(() => ...);
```

Zod 4's `z.lazy` requires an explicit annotation to break the circular-reference type inference; the file does this correctly. This is the idiomatic Zod 4 pattern for recursive types. Worth mentioning in §6 (What's already idiomatic).

#### F4A-M-6. `pattern-graph-api.ts` uses `NonNullable<PatternGraph['tagRegistry']['roles']>[number]` to derive the role item type — well-targeted TS 5 idiom

**File:** `src/read-api/pattern-graph-api.ts:115`, `src/read-api/pattern-helpers.ts:21`.

```ts
type RegistryRoleDefinition = NonNullable<PatternGraph['tagRegistry']['roles']>[number];
```

This is the right TS idiom for deriving an array element type from a parent shape. Once C-CORE-3 lands (tag-registry type-of-record is the Zod schema), this becomes `z.infer<typeof RoleDefinitionSchema>` from `validation-schemas/tag-registry.ts`. The intermediate derivation is fine for now.

---

### Low

#### F4A-L-1. `import * as fs from 'fs'` vs `import * as fs from 'node:fs'` inconsistency

**Files:** `src/extractor/doc-extractor.ts:19` (`'fs'`), `src/validation-schemas/config.ts:1` (`'fs'`), `src/extractor/gherkin-extractor.ts:19` (`'node:fs'`). Same for `path`.

Pure ESM with Node 20 accepts both; `node:` prefix is the recommended-by-Node form because it short-circuits the package-name lookup and protects against an npm-package named `fs` shadowing the builtin. The rest of the package uses bare specifiers.

**Recipe:** sweep `from 'fs'` → `from 'node:fs'`, `from 'path'` → `from 'node:path'`, `from 'fs/promises'` → `from 'node:fs/promises'`. Pure-ESM hygiene; no behavior change.

#### F4A-L-2. `WORKSPACE_TAG_REGISTRY = createArchitect({...}).registry` runs at every import — already flagged

**File:** `src/config/self-hosting.ts:93`. Phase 2 CL-CORE-4 already documented this. Framework angle: ESM with `sideEffects: false` (which the package declares at `package.json:21`) explicitly tells bundlers "no side effects expected at module load." This module breaks that contract.

**Recipe:** lazy memo — `let _registry: ... | undefined; export function getWorkspaceTagRegistry() { return (_registry ??= createArchitect(...).registry); }`. Combine with Phase 1 H-CORE-10 (delete the file outright; move dogfood plumbing to `architect.config.ts`).

#### F4A-L-3. `DEFAULT_BUILDERS` IIFE in `gherkin-ast-parser.ts:49-52` — same eager-eval pattern, smaller blast radius

**File:** `src/scanner/gherkin-ast-parser.ts:49-52`. Phase 2 CL-CORE-12 already noted.

```ts
const DEFAULT_BUILDERS = (() => {
  const registry = createDefaultTagRegistry();
  return createRegexBuilders(registry.tagPrefix, registry.fileOptInTag);
})();
```

Same framework concern as F4A-L-2 — module-load-time eager evaluation in a `sideEffects: false` package. Lazy memo recipe applies.

#### F4A-L-4. `z.string().min(1, '...')` pattern is consistent across the codebase — note for preservation

**Files:** ~80 sites in `validation-schemas/`. The `min(1, 'error msg')` form is the Zod 4 idiomatic non-empty-string pattern (vs Zod 3's `.nonempty()` which was removed). The codebase uses it consistently. Worth keeping.

#### F4A-L-5. `z.array(...).readonly()` is used correctly across 35+ sites

`z.array(X).readonly()` produces `readonly X[]` in Zod 4; combined with `exactOptionalPropertyTypes`, this gives the strongest possible type signal at boundaries. The codebase uses it consistently in `extracted-pattern.ts`, `feature.ts`, `extracted-shape.ts`, `tag-registry.ts`. Note for preservation.

#### F4A-L-6. `expect.poll`/`expect.soft`/`expect.assertions` are not used — judgment call

Vitest 4 has `expect.poll` for retried-until-stable assertions and `expect.soft` for non-fatal assertions. The 24 step files in `tests/steps/` don't use either. For pure unit-style step assertions over synchronous APIs, this is correct — `expect.poll` is for async invariants and the package isn't testing async invariants worth retrying. **No action**, included for completeness.

---

## 3. Zod 4 Audit (call sites)

| Site                                               | API                                                        | Verdict                    | Notes                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validation-schemas/pattern-graph.ts:42-123`       | 9× `z.object`                                              | **Drift**                  | Open at runtime; should be `z.strictObject`. Phase 1 C-CORE-2.                                                                                                                                                                                                                                           |
| `validation-schemas/output-schemas.ts:10-78`       | 10× `z.object`                                             | **Drift**                  | CLI/MCP output boundary; should be `z.strictObject`.                                                                                                                                                                                                                                                     |
| `validation-schemas/extracted-shape.ts:7-74`       | 8× `z.object`                                              | **Drift**                  | Should be `z.strictObject`.                                                                                                                                                                                                                                                                              |
| `validation-schemas/extracted-pattern.ts:13`       | 1× `z.object` (`BusinessRuleSchema`)                       | **Drift**                  | Other 6 schemas in same file are correctly `z.strictObject`.                                                                                                                                                                                                                                             |
| `package/package-config.ts:10`                     | `.extend()` on `PackageSchema`                             | **Drift**                  | Zod 4 `.extend()` doesn't propagate strictness. Re-declare as `z.strictObject({ ...PackageSchema.shape, … })`.                                                                                                                                                                                           |
| `validation-schemas/tag-registry.ts:32`            | `transform: z.function().optional()`                       | **Wrong shape**            | Zod 4 `z.function()` semantics changed; functions don't belong in boundary contracts anyway. Replace with `z.enum(KNOWN_TRANSFORM_NAMES).optional()`.                                                                                                                                                    |
| `config/section-block.ts:75-152`                   | 3× `z.union` + 9× `z.literal('…')` + 3× `z.lazy`           | **Correct**                | Tagged with `type: z.literal('…')` discriminant — would benefit from `z.discriminatedUnion('type', […])` for faster parsing + better errors, but the `z.lazy` recursion makes this non-trivial in Zod 4. **Acceptable as-is**; flag for revisit if Zod's recursive discriminated-union support improves. |
| `validation-schemas/export-info.ts:36`             | `z.discriminatedUnion('type', [...])`                      | **Correct**                | Reference implementation for the rest of the codebase.                                                                                                                                                                                                                                                   |
| `validation-schemas/pattern-graph.ts:27,34`        | 2× `z.literal('FEATURE_PARSE_ERROR'\|'spec-parse-failed')` | **Could be discriminated** | `FeatureParseErrorSchema` and `PatternParseFailureSchema` are siblings carrying different `type`/`kind` discriminants — not a union today. If they ever join one, `z.discriminatedUnion` is the right shape.                                                                                             |
| `validation-schemas/config.ts:26,32,52`            | `z.string().transform(path.resolve)`                       | **Correct**                | Transform-at-boundary, the right Zod idiom.                                                                                                                                                                                                                                                              |
| `validation-schemas/extracted-pattern.ts:26,46,51` | 3× `z.string().transform(...)` brand applicators           | **Correct**                | Brand + transform composition is the right Zod 4 pattern.                                                                                                                                                                                                                                                |
| `validation-schemas/extracted-pattern.ts:74`       | `z.iso.datetime({...})`                                    | **Correct**                | Zod 4 modern format API; preserve.                                                                                                                                                                                                                                                                       |
| `utils/argv-hygiene.ts:25-34`                      | `z.string().refine(no-null-byte)`                          | **Correct**                | Trust-boundary primitive.                                                                                                                                                                                                                                                                                |
| `validation/boundary.ts:54-65`                     | `z.prettifyError(parsed.error)`                            | **Correct**                | Zod 4 modern error formatter (replaced Zod 3's `error.format()`).                                                                                                                                                                                                                                        |
| `validation-schemas/extracted-pattern.ts:128`      | `z.output<typeof ExtractedPatternBaseSchema>`              | **Correct**                | Right choice — `z.output` for post-transform shape.                                                                                                                                                                                                                                                      |
| `validation-schemas/extracted-shape.ts:82`         | `z.input<typeof ShapeExtractionOptionsSchema>`             | **Correct**                | Exemplary — uses `z.input` for the pre-default shape passed by callers, `z.infer/output` for the post-default shape. The H-SIMP-5 recipe should follow this template.                                                                                                                                    |
| `types/branded.ts:7-12`                            | 6× `z.string().brand<'…'>()`                               | **Correct**                | Native Zod 4 branded types — exemplary.                                                                                                                                                                                                                                                                  |
| `package/package-config.ts:5`                      | `z.instanceof(RegExp)`                                     | **Correct (with caveat)**  | Boundary contracts ideally shouldn't ship `RegExp` instances (don't serialize); but `PackageMatcherSchema` is the union of a regex and a string-prefix and is consumed internally only. Acceptable.                                                                                                      |

**Zod 4 idioms not used and not needed:** `z.preprocess`, `z.pipe`, `z.coerce`. The codebase preprocesses through explicit `.transform(...)` chains; the cases where `z.coerce.number()` could shorten a `z.string().transform(Number)` aren't present.

---

## 4. TS Strictness Audit (places where casts evade the flags)

### `noPropertyAccessFromIndexSignature` defeated

| File:line                                | Pattern                                                                        | Recipe                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `scanner/gherkin-ast-parser.ts:418`      | `[key: string]: unknown` on return type                                        | Split into `ParsedFeatureMetadata` + `FeatureMetadataDiagnostics` (F4A-H-2). |
| `scanner/gherkin-ast-parser.ts:494,525`  | `metadata['_unrecognizedEnums'] as UnrecognizedEnumEntry[] \| undefined`       | Falls out when F4A-H-2 lands.                                                |
| `extractor/gherkin-extractor.ts:372-374` | `metadata['_unrecognizedEnums'] as { tag, value, validValues }[] \| undefined` | Same.                                                                        |

### `noUncheckedIndexedAccess` evaded

| File:line                       | Pattern                                            | Recipe                                                                           |
| ------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `scanner/ast-parser.ts:279-296` | 16× `metadataResults.get('key') as X \| undefined` | Replace `Map<string, unknown>` with typed result from `applyTagValue` (F4A-H-1). |

### `exactOptionalPropertyTypes` partial — `...(x !== undefined && { x })` spreads

This is the _correct_ idiom for `exactOptionalPropertyTypes` at object construction time (a property with value `undefined` is rejected). The codebase uses it consistently. Phase 2 sweep #2 proposed an `omitUndefined()` helper to compress these — that's an ergonomics call, not a strictness one. **Preserve current pattern**.

### Strictness lies (casts after type-guard rejection)

| File:line                               | Pattern                                                        | Severity               |
| --------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| `validation/fsm/validator.ts:92,93,102` | `from as ProcessStatusValue` after `!isValidStatusValue(from)` | **Critical** (F4A-C-1) |

### `Record<string, unknown>` builders (one-off objects assembled before parse)

| File:line                                | Pattern                                                                            | Recipe                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `extractor/gherkin-extractor.ts:223,206` | `const rawPattern: Record<string, unknown> = {...}` with 35 quoted-key assignments | Use `z.input<typeof ExtractedPatternSchema>` (F4A-H-5).                                                              |
| `extractor/doc-extractor.ts:254-292`     | Same shape, 28 fields                                                              | Same recipe.                                                                                                         |
| `config/config-loader.ts:190`            | `const copy = { ...(exported as Record<string, unknown>) }`                        | Falls out when `isProjectConfig` deletion + `Reflect.deleteProperty` string-concat go (Phase 1 C-CORE-4 / H-CORE-4). |
| `config/project-config-schema.ts:123`    | `const obj = value as Record<string, unknown>`                                     | Same — `isProjectConfig` itself is deletion-candidate.                                                               |

### `as const satisfies T` — used correctly

| File:line                     | Pattern                                        |
| ----------------------------- | ---------------------------------------------- |
| `config/role-constants.ts:64` | `as const satisfies readonly RoleDefinition[]` |
| `config/self-hosting.ts:68`   | `as const satisfies readonly RoleDefinition[]` |
| `config/resolve-config.ts:41` | `satisfies readonly ContextInferenceRule[]`    |

Three sites total. These are exemplary TS 5 idioms — `satisfies` keeps the narrow literal types for read access while validating against the interface. Preserve.

### `as unknown as X` — none

Grep confirms zero `as unknown as X` casts in `src/`. The one `as ArchitectProjectConfig` at `config-loader.ts:212` is a single-step cast on already-parsed Zod output (`parseResult.data`) where the explicit type would be `z.output<typeof ArchitectProjectConfigSchema>`. Replace with: `resolveProjectConfig(parseResult.data, { configPath })` — the parameter type already constrains the call. Minor cleanup.

### `any` — none

`@typescript-eslint/no-explicit-any: 'error'` is enforced; grep confirms no `any` in `src/`.

---

## 5. ESM and Node-stdlib Audit

### Pure ESM correctness

| Concern                                  | Verdict       | Evidence                                                                                                                                     |
| ---------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.js` extensions on relative imports     | **Correct**   | All 160 `^import {` lines in `src/` have `.js` suffix on relative imports.                                                                   |
| `import type` for type-only imports      | **Correct**   | 97 `^import type` declarations; `@typescript-eslint/consistent-type-imports: 'error'` in root config. `verbatimModuleSyntax: true` enforces. |
| `import.meta.url` instead of `__dirname` | **Correct**   | Only one use: `config/self-hosting.ts:7`. No `__dirname`/`__filename` anywhere in `src/`.                                                    |
| `require()` calls                        | **Zero**      | Grep confirms.                                                                                                                               |
| Top-level `await`                        | **Not used**  | All async work is inside async functions. No reason it'd be needed in the current API surface.                                               |
| Dynamic `import()`                       | **Used once** | `config-loader.ts` likely uses it for the user-config-as-module load. Acceptable.                                                            |

### Node stdlib

| Concern                                   | Verdict          | Site(s)                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync FS on hot paths                      | **3 sites**      | `doc-extractor.ts:231` (`readFileSync` per-pattern), `gherkin-extractor.ts:502` (`existsSync` in sync wrapper), `validation-schemas/config.ts:10` (`realpathSync` in Zod refine — acceptable).                                                                |
| `fs/promises` vs `fs`                     | **Mixed**        | Async sites correctly use `fs/promises`; sync sites use `fs`. Once F4A-H-7 collapses sync extractor, only `validation-schemas/config.ts` keeps sync.                                                                                                          |
| POSIX path normalization                  | **Inconsistent** | `build-pipeline.ts:108` does it right; `doc-extractor.ts`/`gherkin-extractor.ts` brand `path.relative(...)` directly. F4A-H-8.                                                                                                                                |
| `Buffer.from(string)` without encoding    | **Not used**     | Grep confirms — no `Buffer.from`/`new Buffer` anywhere.                                                                                                                                                                                                       |
| `fs.exists` (legacy)                      | **Not used**     | The sync sites use `existsSync` (not deprecated) and the async sites use `fs.promises.access` (idiomatic Node 20).                                                                                                                                            |
| `util.promisify`                          | **Not used**     | All async APIs use native promises.                                                                                                                                                                                                                           |
| `AbortSignal` / `AbortController`         | **Not used**     | No I/O paths take `AbortSignal`. Acceptable — `architect-core` doesn't do long-running streaming I/O. Phase 2 CL-CORE-4 (file-watcher leak) is `architect-mcp`'s problem; `package-resolver.ts:34-49` is the cache that needs invalidation, not cancellation. |
| `crypto`                                  | **Not used**     | No hash needs — `generatePatternId` uses a deterministic non-crypto digest (presumably `pattern-{8-char-hex}` from line+filepath). Confirms ID generation doesn't need `crypto.createHash`.                                                                   |
| `console.*`                               | **2 sites**      | `extractor/dual-source-extractor.ts:94,178` — Phase 1 M-CORE-12 / Phase 2 CL-CORE-13 already document. Diagnostic channel is in scope; should surface there.                                                                                                  |
| `import * as fs from 'fs'` vs `'node:fs'` | **Mixed**        | F4A-L-1.                                                                                                                                                                                                                                                      |

---

## 6. What's Already Idiomatic (Preserve)

Five patterns that exemplify modern TS 5 / Zod 4 / pure-ESM:

1. **`src/types/branded.ts:7-12`** — `z.string().brand<'PatternId'>()` + `type PatternId = z.output<typeof PatternIdSchema>` is the native Zod 4 way to do nominal typing. The constructor functions parse rather than cast (one slip: `asModuleId`, F4A-M-2). Reference implementation for the family.

2. **`src/validation/boundary.ts:38-65`** — `BoundaryParseError` class wraps `z.ZodError` with a stable `BoundaryParseIssue[]` shape callers can read without depending on Zod's internal `$ZodIssue` type. Uses `z.prettifyError` (Zod 4's replacement for `z.formatError`). The right primitive — its only flaw is non-use inside core (Phase 1 H-CORE-3).

3. **`src/validation-schemas/extracted-shape.ts:81-82`** — separating `z.infer<typeof Schema>` (post-default, post-transform) from `z.input<typeof Schema>` (pre-default, pre-transform, the shape callers literally pass). This is the Zod 4 distinction that H-SIMP-5 wants generalized to `buildGherkinRawPattern`.

4. **`src/validation-schemas/export-info.ts:36-43`** — `z.discriminatedUnion('type', [...])` over 6 literal-tagged variants is the right Zod 4 idiom for tagged unions; gives O(1) parse dispatch on the discriminant and structured error paths.

5. **`src/config/section-block.ts:102-156`** — `z.ZodType<T>: z.lazy(() => ...)` annotation on recursive schemas is the Zod 4 idiomatic way to break the otherwise-circular type inference. The three recursive schemas (`ListItem`, `CollapsibleBlock`, `SectionBlock`) all do this correctly.

Bonus: **the `as const satisfies` pattern in `config/role-constants.ts:64`** is exemplary TS 5 idiom — narrow literal types preserved while checking conformance to the interface.

---

## 7. Severity-ranked recommended action plan (TS/framework angle only)

1. **F4A-C-1** — `validateTransition` discriminated union (1 file, ~15 LOC). Coincides with Phase 2 M-SIMP-2 — bundle.
2. **F4A-C-2** — replace `z.function().optional()` with `z.enum(KNOWN_TRANSFORMS).optional()`. Coincides with Phase 1 M-CORE-8 + Phase 1 M-CORE-14. The fix cascades through `cloneTagRegistry`.
3. **F4A-H-3 + F4A-M-1** — `z.object → z.strictObject` sweep (28 sites). Coincides with Phase 1 H-CORE-7 + Phase 2 H-SIMP-3.
4. **F4A-H-5** — typed `buildGherkinRawPattern` via `z.input<typeof ExtractedPatternSchema>`. Coincides with Phase 2 H-SIMP-5. Pre-requisite: F4A-H-3.
5. **F4A-H-2 + F4A-H-4** — split `extractPatternTags` return into typed metadata + diagnostics. Coincides with Phase 1 H-CORE-15.
6. **F4A-H-1** — typed `applyTagValue` in `taxonomy/tag-parsing.ts`; 16 `as` casts in `ast-parser.ts:279-296` disappear. Coincides with Phase 2 H-SIMP-6.
7. **F4A-H-6** — `package-config.ts` re-declare with `z.strictObject({ ...shape, … })`. One line.
8. **F4A-H-7** — collapse sync FS hot paths (`doc-extractor.ts:231`, `gherkin-extractor.ts:502`). Coincides with Phase 1 H-CORE-6 + Phase 2 H-SIMP-1.
9. **F4A-H-8** — normalize POSIX separators inside `asSourceFilePath`/`asOutputFilePath` brand constructors. Three brand-constructor changes.
10. **F4A-H-9** — add `no-restricted-syntax` rule banning `void X;` expressions in production src. One ESLint config block. Then delete the 3 `void` lines.
11. **F4A-M-2** — `asModuleId` calls `asPatternId` (or deletes the export).
12. **F4A-M-3** — brand `Quarter`; `getPatternsByQuarter` takes branded parameter. Coincides with Phase 1 L-CORE-14 + Phase 2 L-SIMP-5.
13. **F4A-M-4** — sweep `parseInt`/`isNaN` → `Number.parseInt`/`Number.isNaN`. 5 sites.
14. **F4A-L-1** — sweep `from 'fs'` → `from 'node:fs'` etc. ~10 sites.
15. **F4A-L-2 + F4A-L-3** — lazy memo for `WORKSPACE_TAG_REGISTRY` and `DEFAULT_BUILDERS`. Coincides with Phase 1 H-CORE-10 + Phase 2 CL-CORE-4/CL-CORE-12.

Items 1-6 are the framework wins that compound — they make Items 7-9 mechanical and they unblock the rest of Phase 2's simplification recipes (H-SIMP-1/4/6/9). Items 10-15 are family-hygiene sweeps that can run in parallel.

---

## Appendix A — Files inspected for this phase

- `package.json`, `tsconfig.json`, `tsconfig.test.json`, parent `tsconfig.architect-base.json`, grandparent `tsconfig.base.json`
- `vitest.config.ts`, `eslint.config.mjs` (per-package + root)
- `src/index.ts`, `src/types/{branded,result,errors}.ts`
- `src/validation/boundary.ts`, `src/validation/fsm/validator.ts`
- `src/validation-schemas/{pattern-graph,tag-registry,extracted-pattern,extracted-shape,output-schemas,feature,export-info,config}.ts`
- `src/scanner/{ast-parser,gherkin-ast-parser}.ts`
- `src/extractor/{doc-extractor,gherkin-extractor,dual-source-extractor}.ts`
- `src/read-api/pattern-graph-api.ts`
- `src/config/{self-hosting,role-constants,section-block,config-loader,project-config-schema}.ts`
- `src/utils/{argv-hygiene,errors,markdown-parser}.ts`
- `src/package/package-config.ts`
- Sample of `tests/steps/**/*.steps.ts`
