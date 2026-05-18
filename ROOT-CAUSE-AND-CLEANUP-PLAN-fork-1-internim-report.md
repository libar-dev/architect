<task-notification>
<task-id>ac3e2b007bb66f89b</task-id>
<tool-use-id>toolu_01JW8XCHYnQcdVjQ2jFHoyrR</tool-use-id>
<output-file>/private/tmp/claude-501/-Users-darkomijic-dev-projects-architect/3fb42fe1-ccd1-41b9-ae07-d905b1a51a73/tasks/ac3e2b007bb66f89b.output</output-file>
<status>completed</status>
<summary>Agent "Audit extraction-layer contract" completed</summary>
<result>I have all the evidence needed. Now I'll compile the audit.

---

# Extraction-Layer Audit: Findings

## 1. Actual flow &amp; `ExtractedPatternSchema.parse` call count

The "single parse-once boundary" is a fiction. The schema is parsed **2x per pattern in production code**, and a third time exists in test fixtures:

| Call site | Line | Trigger |
|---|---|---|
| `extractor/doc-extractor.ts:294` | `buildPattern` (TS source) | Builds plain object, validates → `Result&lt;ExtractedPattern,…&gt;` |
| `extractor/gherkin-extractor.ts:455` (sync) and `:606` (async) | After `buildGherkinRawPattern()` returns `Record&lt;string, unknown&gt;` | Validates → `ExtractedPattern` |
| `generators/pipeline/transform-dataset.ts:103` | **Re-validates** every already-validated `ExtractedPattern` from `raw.patterns` | Adds to `malformedPatterns[]` if it fails |

The third parse is the smoking gun: `transformToPatternGraphWithValidation` receives `ExtractedPattern[]` (the published type) and re-runs `safeParse` defensively. There is no trust boundary — every layer assumes the prior layer might lie.

## 2. Informal shapes between extractor and schema

- **`packages/architect-core/src/extractor/gherkin-extractor.ts:206`** — `buildGherkinRawPattern(...)` return type is `Record&lt;string, unknown&gt;`. The function mutates this map via 45 `assignIfDefined`/`assignIfNonEmpty` calls (lines `:253-295`) plus 3 direct quoted-key assignments (`:298`, `:324`, `:327`). Helpers at `:63-73` take `Record&lt;string, unknown&gt;` as their typed escape hatch.
- **`packages/architect-core/src/extractor/gherkin-extractor.ts:299` and `:313`** — nested `Record&lt;string, unknown&gt;` for `scenarioRef` and `stepObj`.
- **`packages/architect-core/src/scanner/gherkin-ast-parser.ts:364-419`** — `extractPatternTags()` returns an interface with **42 enumerated optional fields plus `[key: string]: unknown` index signature** (line `:418`), and internally accumulates into `const metadata: Record&lt;string, unknown&gt;` (`:436`). All quoted-key writes; index-signature reads (`metadata['_unrecognizedEnums'] as …`) at `:494, :513, :525, :534`.
- **`packages/architect-core/src/scanner/ast-parser.ts:273`** — `const metadataResults = new Map&lt;string, unknown&gt;()`; consumed by **16 hand-coded `as` casts** at `:279-296` (one per field, typo-silent: any `metadataResults.get('xxx')` mis-spelled key just yields `undefined`).
- **`extractor/gherkin-extractor.ts:372`** — `metadata['_unrecognizedEnums'] as { tag: string; value: string; validValues: readonly string[] }[] | undefined` — the index-signature dance even at the consumer side.

There is no `ExtractedPatternDraftSchema` or strict intermediate type. Everything passes through `Record&lt;string, unknown&gt;` until the boundary parse.

## 3. Duplicate implementations

- **`buildRoleLookup`** — 4 instances: `extractor/doc-extractor.ts:58`, `extractor/gherkin-extractor.ts:105`, `scanner/gherkin-ast-parser.ts:54`, plus the structurally identical `buildCanonicalRoleLookup` at `generators/pipeline/transform-dataset.ts:39` (different return shape, same purpose). The doc/gherkin variants are re-invoked **inside the per-tag loop** via `resolveCanonicalRole` (doc-extractor `:76`, gherkin-extractor `:123`), rebuilding the lookup once per role-tag encountered.
- **`resolveCanonicalRole`** — defined separately at `doc-extractor.ts:71`, `gherkin-extractor.ts:118`, `scanner/gherkin-ast-parser.ts:68`, and a fourth on the *read-side* in `read-api/pattern-helpers.ts:137`. Four parallel implementations of the same canonicalization rule.
- **`collectRoleDiagnostics` (doc, `:88-163`) vs `collectDeprecatedTagDiagnostics` (gherkin, `:128-190`)** — near-clones with the same `arch-role:`/`arch-context:`/`arch-layer:` branches; only the input shape differs (`DocDirective.deprecatedTags` vs `metadata._deprecatedTags`).
- **`extractPatternsFromGherkin` (`:353`) vs `extractPatternsFromGherkinAsync` (`:517`)** — sync/async near-clones, ~135 LOC each; the async variant silently drops the `_unrecognizedEnums` diagnostic loop that the sync one has at `:372-390`.
- **JSDoc parser tag-metadata extraction** uses regex-per-format (`ast-parser.ts:147-171`); Gherkin parser uses registry-driven switch (`gherkin-ast-parser.ts:484-541`). Two unrelated dispatch styles produce the same field set.

## 4. TagRegistry triple-record

Confirmed:

- **`config/tag-registry-contract.ts:3-10`** — `RoleDefinition` interface (compile-time contract).
- **`config/role-constants.ts:3-10`** — second `RoleDefinition` interface, identical fields. `LOCKED_WAVE_ONE_ROLES` constant satisfies it (`:64`).
- **`validation-schemas/tag-registry.ts:11-20`** — `RoleDefinitionSchema` Zod + `export type RoleDefinition = ConfigRoleDefinition` (an alias that papers over the duplicate).

`tag-registry-contract.ts` is consumed by registry-builder and the Zod module. `role-constants.ts` is consumed by registry-builder + the Zod module (as a type-only re-export). The Zod schema (`tag-registry.ts`) is **never used to parse** anywhere in the extraction layer — registries flow as TypeScript objects (`createDefaultTagRegistry()` constructs by hand). The schema is decoration; the contract is the interface; the constant is the data. Three records, one of them unused at runtime.

## 5. Surviving `export const X = Y` aliases

In the extraction-layer-adjacent files I scanned: **1 confirmed `DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES`** (`config/role-constants.ts:68`) and **1 doctrinally-aligned `DEFAULT_ROLES = LOCKED_WAVE_ONE_ROLES`** (`:66`). `validation-schemas/tag-registry.ts:20` `export type RoleDefinition = ConfigRoleDefinition` is the type-level equivalent — a silent re-export to keep both names live. The taxonomy folder is clean (no value-aliases, just typed constants).

## 6. Root cause

**The "extraction layer" is not one seam, it is at least four:** (a) JSDoc text → `Map&lt;string, unknown&gt;` + 16 typed casts → `DocDirective`; (b) Gherkin tag list → 42-field `Record&lt;string, unknown&gt;` with `[key: string]: unknown` → consumed by quoted-key reads; (c) `Record&lt;string, unknown&gt;` rawPattern accumulator → `ExtractedPattern` (sync **and** async variants, drifted); (d) `ExtractedPattern` → re-parsed defensively in `transform-dataset.ts:103`. Each seam re-derives role canonicalization (4 `buildRoleLookup` variants, 4 `resolveCanonicalRole` variants) because no upstream layer is trusted to have done it. The cost: typo-silent metadata (mis-spell `'patternName'` in `extractPatternTags` and the field just disappears), divergent diagnostics between sync/async paths, three `RoleDefinition` records and one alias (`DDD_ES_CQRS_ROLES`) kept alive to avoid breaking unknown callers, and a perf tax — `buildRoleLookup` runs once per role-tag-encounter inside per-pattern loops. **The single architectural change:** introduce a Zod-validated `RawDirectivePayload` schema (or `ExtractedPatternDraft`) that every extractor MUST `strictParse` into before handing off; delete the `Record&lt;string, unknown&gt;` accumulators, the `Map&lt;string, unknown&gt;` cast block, and the `[key: string]: unknown` escape hatch; collapse `buildRoleLookup`/`resolveCanonicalRole` into a single memoized `TagRegistry.resolveRole(value)` method on a frozen registry built once at startup. The boundary then parses exactly once; everything downstream is a typed read, not a defensive re-validation.

### Key files cited
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/doc-extractor.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/gherkin-extractor.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/dual-source-extractor.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/extractor/layer-inference.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/ast-parser.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/scanner/gherkin-ast-parser.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-dataset.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/extracted-pattern.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/tag-registry.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/role-constants.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/tag-registry-contract.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/taxonomy/registry-builder.ts`

Hypothesis is confirmed: the extraction layer has **no single parse-once boundary**. There are multiple parsers writing into informal `Record&lt;string, unknown&gt;` / 42-field-plus-index-signature / `Map&lt;string, unknown&gt;+as-cast` accumulators, and `ExtractedPatternSchema` is parsed at least twice in the live pipeline (extractor + transform-dataset) plus once redundantly in pattern-graph schemas.</result>
<usage><total_tokens>106623</total_tokens><tool_uses>28</tool_uses><duration_ms>134011</duration_ms></usage>
</task-notification>