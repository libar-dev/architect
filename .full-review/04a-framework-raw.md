# Phase 4a — Framework & Language Best Practices (raw)

Scope: `packages/architect-projection/` against TypeScript 5.8 (strict suite) + Zod 4.1 + ESM-only stack, ahead of the doc-gen consolidation campaign.

## Posture snapshot

The package is in unusually good shape for a 135-file projection pipeline. The doctrine is fully observed where it bites the compiler:

- **Zero `// eslint-disable*` directives**, **zero `@ts-ignore` / `@ts-expect-error`**, **zero `@deprecated` markers** anywhere in `src/` — the no-BC discipline is real.
- **Zero `z.object(`** call sites; **113 `z.strictObject`** — the strict-object discipline is universal.
- **Zero `as any` / `as unknown` / non-null `!` assertions** in `src/`. The one load-bearing cast (`dispatch.ts:30`) is documented with an invariant block, not hidden.
- **128 `z.infer<typeof Schema>` uses** — the inference pattern is the norm. Drift sites stand out because the surrounding code does NOT drift.
- ESM packaging is hygienic: `"type": "module"`, `sideEffects: false`, every `*.js` import suffix present, dist emits `.js`, `.js.map`, `.d.ts`, `.d.ts.map` for all 5 sub-entries documented in `exports`.
- `prepack: pnpm clean && pnpm build` catches drift between `src/` and `dist/` on every publish.
- Dev-dependency versions (`vitest 4.1.4`, `eslint 9.17`, `typescript 5.8`, `@amiceli/vitest-cucumber 6.3.0`, `@types/node 24.12`) are identical across all five publishable packages — no skew.
- `noUncheckedIndexedAccess` is honoured (e.g., `markdown-paths.ts:65-90` destructures `split()` results then guards each segment against `undefined`).
- `noPropertyAccessFromIndexSignature` is honoured (e.g., `fragments/base.ts:26-38` uses `value['root']` not `value.root` for `Record<string, unknown>` lookups).

That posture is the baseline. The findings below are the residual gaps a campaign-readiness review surfaces, ranked by campaign impact.

---

## Finding F1 — `sideEffects: false` is a lie at `documentation-types.ts` import time (High)

**File:** `src/projections/documentation-composition/documentation-types.ts:342-344` (validation loop), `:140-340` (registry literal), `:359-377` (re-frozen exports).

**Current pattern.** Loading this module runs:

1. A 200-LOC frozen registry literal.
2. `DOCUMENTATION_TYPE_REGISTRY.forEach((entry) => DocumentationTypeRegistryEntrySchema.parse(entry))` — a 12-pass Zod parse at every import.
3. Three more `Object.freeze` passes over the filtered registries.

Yet `package.json` declares `"sideEffects": false`, telling bundlers and tree-shakers that nothing happens at import time. Any consumer that imports a single type (e.g. `type SupportedDocumentationType`) pays the full parse cost, OR the bundler honours `sideEffects: false` and elides the validation entirely.

**Why it matters for the campaign.** The campaign multiplies the consumer count of `documentation-types.ts` (`renderers/markdown-paths.ts` already pulls `getDocumentationTypeMetadata` at render time — see Phase 1 H3). Every new `DocDefinition` consumer that imports a type pays an unbounded parse. Worse, when this module is replaced (per Phase 1 C1), losing the `forEach` parse silently removes the schema/literal alignment check.

**Migration/fix.** Convert the eager parse into a build-time check or a test:

```ts
// documentation-types.ts — drop the forEach at module load.
const DOCUMENTATION_TYPE_REGISTRY = Object.freeze([...] as const satisfies readonly DocumentationTypeRegistryEntry[]);

// New file: src/projections/documentation-composition/__validate__/registry-shape.test.ts
import { describe, it, expect } from 'vitest';
import { DOCUMENTATION_TYPE_REGISTRY, DocumentationTypeRegistryEntrySchema } from '../documentation-types.js';

describe('DOCUMENTATION_TYPE_REGISTRY shape', () => {
  it.each(DOCUMENTATION_TYPE_REGISTRY.map((e) => [e.key, e]))('%s matches schema', (_, entry) => {
    expect(() => DocumentationTypeRegistryEntrySchema.parse(entry)).not.toThrow();
  });
});
```

The `satisfies readonly DocumentationTypeRegistryEntry[]` already gives compile-time shape validation; the runtime parse is belt-and-braces and breaks the `sideEffects: false` contract. Move it to the test layer.

---

## Finding F2 — `Block` types are hand-written, not `z.infer`'d — Zod-first inversion (High)

**File:** `src/blocks/schema.ts:5-72` (hand-written types), `:73-152` (Zod schemas).

**Current pattern.** Two sources of truth for the same 9-block-type union:

```ts
// Hand-written (lines 5-72):
export interface CodeBlock {
  type: 'code';
  language?: string | undefined;
  content: string;
}
// Mirror Zod schema (lines 119-123):
export const CodeBlockSchema = z.strictObject({
  type: z.literal('code'),
  language: z.string().optional(),
  content: z.string(),
});
// Then the discriminated union is `z.ZodType<Block>` (line 142) —
// schema is constrained TO match the hand-written type, not vice versa.
```

The annotation `BlockSchema: z.ZodType<Block>` does catch drift, but it makes the **type** canonical and the **schema** secondary. That is the inverse of doctrine ("types flow from schemas via `z.infer`"). It also means the schemas cannot grow `.describe()` metadata (Finding F4) without re-doing the type derivation.

**Why it matters for the campaign.** `BlockSchema` is the campaign's load-bearing substrate — every ContentFragment normalizer emits `Block[]`, and the headline `.describe()` extraction demo wants to surface block schemas in generated docs. Per-block `.describe()` calls become awkward when the type is the source of truth.

**Migration/fix.** Flip the direction. Define schemas first, derive types:

```ts
export const CodeBlockSchema = z.strictObject({
  type: z.literal('code'),
  language: z
    .string()
    .optional()
    .describe('Language hint for syntax highlighting (e.g. "ts", "bash").'),
  content: z.string().describe('Raw code text. Rendered inside a fenced block.'),
});
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

// And the union:
export const BlockSchema = z.discriminatedUnion('type', [
  HeadingBlockSchema,
  ParagraphBlockSchema /* ... */,
]);
export type Block = z.infer<typeof BlockSchema>;
```

Watch for the `exactOptionalPropertyTypes` interaction — `z.string().optional()` infers to `string | undefined` on the property _value_, which behaves slightly differently than `field?: string` (omitted-vs-present-undefined). Today's hand-written types already use `language?: string | undefined`, so the inferred shape matches.

---

## Finding F3 — `documentation-types.ts` registry type derived from literal, not from Zod schema (High)

**File:** `src/projections/documentation-composition/documentation-types.ts:346-357`.

**Current pattern.** The schema exists (`DocumentationTypeRegistryEntrySchema`) but the public types come from the literal:

```ts
type InternalDocumentationTypeMetadata = (typeof DOCUMENTATION_TYPE_REGISTRY)[number];
export type SupportedDocumentationType = SupportedDocumentationTypeMetadata['key'];
```

This is the same inversion as F2 but uglier: the schema is declared (lines 35-65), then ignored as a type source.

**Why it matters for the campaign.** `DocDefinition` is meant to replace registry-driven dispatch with config-supplied definitions. The day a consumer passes a `DocDefinition` from outside, the registry literal disappears, but every external consumer typed against `SupportedDocumentationType` (a union of 12 string literals) breaks. With `z.infer`-derived types, the boundary is the schema; the literal is just data.

**Migration/fix.** Replace the literal-derived type with a schema-derived type:

```ts
export type SupportedDocumentationTypeRegistryEntry = z.infer<
  typeof SupportedDocumentationTypeRegistryEntrySchema
>;
export type SupportedDocumentationType = SupportedDocumentationTypeRegistryEntry['key'];
// SupportedDocumentationType is now `string` at the type level — accurate when the
// registry is supplied via DocDefinition. Use scope-validate/runtime checks for closed-set
// guarantees, not the type system.
```

(Phase 1 H1 names this finding "schema is canonical; literal is data validated by it" — confirming with code coordinates.)

---

## Finding F4 — Zero `.describe()` calls on any of the 135 source files (High)

**File:** entire `src/` tree. Confirmed by `grep -rn "\.describe(" src/ | wc -l` → 0.

**Current pattern.** None of the 113 `z.strictObject` schemas carries `.describe()` metadata. The DEEP-DIVE headline demo (`extractZodSchemaFields('ProgressiveDisclosurePolicySchema')` producing a disclosure-tier table) returns empty.

**Why it matters for the campaign.** This is the **most consequential** finding for campaign readiness. Two specific schema files are kitchen-sink demos for the new `extractZodSchemaFields` extractor:

- `src/projections/documentation-composition/progressive-disclosure.ts` — `ProgressiveDisclosurePolicySchema` (3 fields), `ProgressiveDisclosureLevelSchema` (4 enum cases).
- `src/projections/documentation-composition/disclosure-spec.ts` — `DisclosureSpecSchema` (6 fields), `ContentRichnessSchema` (4 enum cases), `GroupingAxisSchema` (6 enum cases), `RootShapeSchema` (2 enum cases).

Ship the campaign's `extractZodSchemaFields` against these schemas today and the generated table is empty. See priority-target table below.

**Migration/fix.** See table at end of this file for sequencing. The mechanical change per field is:

```ts
export const ProgressiveDisclosurePolicySchema = z.strictObject({
  level: ProgressiveDisclosureLevelSchema.describe(
    'Disclosure tier this policy applies to. Determines whether content is always included, nearby, available on request, or relegated to reference docs.',
  ),
  availability: z
    .enum(['always', 'nearby', 'available', 'reference'])
    .describe('Where the content surfaces relative to the primary document path.'),
  purpose: z
    .string()
    .min(1)
    .describe('One-sentence rationale for placing content at this disclosure level.'),
});
```

(Confirms Phase 3 D-C2 with the exact schema files and field counts.)

---

## Finding F5 — `LogicalRouteId` is a template-literal alias, not a Zod brand (Medium)

**File:** `src/projections/documentation-composition/progressive-disclosure.ts:47-50` (alias), `src/fragments/base.ts:3-6` (duplicate `BundleRouteId` alias).

**Current pattern.** Two identical template-literal types with parallel runtime validators:

```ts
// progressive-disclosure.ts
export type LogicalRouteId =
  | `${string}:index`
  | `${string}:${string}`
  | `${string}:${string}:${string}:${string}`;

// fragments/base.ts
export type BundleRouteId =
  | `${string}:index`
  | `${string}:${string}`
  | `${string}:${string}:${string}:${string}`;
```

The template-literal type passes type checks for any 2/4-segment colon-separated string, but it does NOT prevent `myString` from being passed where `LogicalRouteId` is expected — the constraint is structural-only. The runtime validator (`isLogicalRouteId`) is the actual enforcement. The two aliases are name-equivalent but not type-equivalent (TypeScript sees them as separate nominal types only by accident at assignment sites).

**Why it matters for the campaign.** The campaign's `DocDefinition.build(graph)` returns route IDs that flow into both the renderer (uses `LogicalRouteId`) and the bundle (uses `BundleRouteId`). Without a brand, mistaken `string` assignment is silent; with a brand, the compiler catches the error.

**Migration/fix.** Use `z.brand` and consolidate the alias:

```ts
// New file: src/routing/route-id.ts (lifted out of documentation-composition per Phase 1 H7)
export const LogicalRouteIdSchema = z
  .string()
  .refine(isLogicalRouteId, {
    message:
      'Logical route IDs must be docType:index, docType:stableEntityId, or docType:stableEntityId:childKind:stableChildId.',
  })
  .brand<'LogicalRouteId'>();

export type LogicalRouteId = z.infer<typeof LogicalRouteIdSchema>;
// LogicalRouteId is now `string & z.BRAND<'LogicalRouteId'>` — nominal, enforced at the parse boundary.
```

Delete the duplicate `BundleRouteId` alias in `fragments/base.ts` and import `LogicalRouteId` instead. (Also addresses Phase 1 H7 — disclosure vocabulary lifted out of one projection domain.)

---

## Finding F6 — `MARKDOWN_NORMALIZERS` table lacks exhaustiveness check (Medium)

**File:** `src/renderers/render-markdown.ts:181-192`, type from `src/renderers/_shared/dispatch.ts:14-16`.

**Current pattern.** `KindTable<Out, Options>` is explicitly `Partial<Record<FragmentKind, ...>>` (note the `?:`). The dispatcher has a fallback path, so partial registration is by design. But the campaign will add 6–10 normalizers, and silent omission will pass every existing test (confirmed by Phase 3 T-H1: the test fixture casts non-fragments to fake the canonical path).

**Why it matters for the campaign.** A new `ContentFragment` normalizer accidentally omitted from `MARKDOWN_NORMALIZERS` falls through to `normalizeGenericFragment` and emits a misleading "no-op" markdown. No test fails.

**Migration/fix.** Add a parallel "complete" table type for the markdown renderer specifically, while leaving `KindTable` partial elsewhere:

```ts
// render-markdown.ts
type CompleteKindTable<Out, Options> = {
  readonly [K in FragmentKind]: (fragment: FragmentByKind<K>, options: Options) => Out;
};

const MARKDOWN_NORMALIZERS = {
  ArchitectureDiagram: normalizeArchitectureDiagram,
  // ... existing entries ...
} satisfies Partial<CompleteKindTable<MarkdownDocument, NormalizeMarkdownOptions>>;
// To force exhaustiveness when the campaign stabilizes, drop `Partial<>`:
//   satisfies CompleteKindTable<MarkdownDocument, NormalizeMarkdownOptions>;
```

Once ContentFragment lands and every fragment has a markdown normalizer (the goal), promote to the non-Partial form. TS then flags every missing entry.

---

## Finding F7 — Renderer reaches into `documentation-composition/` registry (Medium)

**File:** `src/renderers/render-markdown.ts:50` (`import { getDocumentationTypeMetadata }`), `src/renderers/markdown-paths.ts:3, 26, 48`.

**Current pattern.** `render-markdown.ts` and `markdown-paths.ts` both import `getDocumentationTypeMetadata` from a _projection_ module and consume `disclosureMatrix`, `childDirectory`, `markdownRootTarget` at render time. Hardcoded doc-type literals leak: `'requirements-executable'` (markdown-paths:26), `'milestones'` (markdown-paths:48).

This is the doctrine-flagged issue (Phase 1 H3 + H4), but from a framework lens it is also a layer inversion: `@architect-bounded-context:rendering` modules importing from `@architect-bounded-context:documentation-composition`. The dependency graph leaks. ESLint `import/no-cycle` is on, but `no-restricted-imports` is not configured to forbid this cross-bounded-context call.

**Why it matters for the campaign.** ContentFragment routes more markdown through `render-markdown.ts`. If renderers continue to look up registry metadata, the campaign's "renderer trusts the bundle" goal becomes harder, not easier.

**Migration/fix.** Encode the doctrine as a lint rule once the renderer stops needing the import:

```js
// eslint.config.mjs additions (project-level — applies to architect-projection):
{
  files: ['packages/architect-projection/src/renderers/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['*/projections/documentation-composition/*'],
        message: 'Renderers must consume routing/disclosure from bundle.routing, not from the documentation-composition registry. See ADR-005/ADR-009.',
      }],
    }],
  },
},
```

(Sequencing: refactor first per Phase 1 H3/H4, then enable the rule to prevent regression.)

---

## Finding F8 — `TRUSTED_MARKDOWN` symbol can be enforced via lint, not just convention (Medium)

**File:** `src/renderers/render-markdown.ts:85` (declaration), `:1856, :1884, :1890` (use sites).

**Current pattern.** `TRUSTED_MARKDOWN` is a module-private `Symbol` — security invariant I3 (Phase 2). The protection is "it's not exported." That's perfect today, but the campaign adds composition APIs (`composeDoc`, `ContentFragment.toMarkdownBlocks`) that may be tempted to plumb pre-rendered markdown across the module boundary.

**Why it matters for the campaign.** ContentFragment authors who want to embed hand-authored markdown will discover they need TRUSTED_MARKDOWN to bypass `escapeText`, and a well-meaning refactor will export it.

**Migration/fix.** Tighten the contract with a lint rule that prevents _anyone_ from importing the constant by name:

```js
// eslint.config.mjs additions:
{
  files: ['packages/architect-projection/src/**', 'packages/architect-projection/tests/**'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: "ImportSpecifier[imported.name='TRUSTED_MARKDOWN']",
      message: 'TRUSTED_MARKDOWN is module-private to render-markdown.ts. Pre-escape content before passing strings to the renderer instead.',
    }],
  },
},
```

(Locks Phase 2 I3 / Phase 3 D-C1 / Phase 3 T-C2 simultaneously.)

---

## Finding F9 — `vitest.config.ts` uses `__dirname` instead of `import.meta.dirname` (Low)

**File:** `packages/architect-projection/vitest.config.ts:1, 11`.

**Current pattern.**

```ts
import path from 'path';                  // CommonJS-style import
// ...
root: path.resolve(__dirname),            // __dirname is CommonJS
```

The sibling `vitest.perf-report.config.mjs` uses the ESM-native form (`fileURLToPath(import.meta.url)`). Inconsistent.

**Why it matters for the campaign.** Low. Vitest's loader shims `__dirname` for `.ts` configs, so it works today. But the campaign adds perf measurements (per Phase 2 H2) that may copy this config pattern; consistency is cheap to fix.

**Migration/fix.**

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /* ... */
  },
  root: import.meta.dirname,
  clearScreen: false,
});
```

Node ≥ 20.11 (engines is `>= 20.0.0`) supports `import.meta.dirname`. Bump engines to `>= 20.11` if you want the type checker to know.

---

## Finding F10 — `prepack` skips typecheck of test config (Low)

**File:** `packages/architect-projection/package.json` scripts.

**Current pattern.** `prepack: pnpm clean && pnpm build`. `build` runs `tsc -b --force` against `tsconfig.json` (production sources), but not `tsconfig.test.json`. Type errors in tests don't block publish — they shouldn't, but the absence is worth noting.

**Why it matters for the campaign.** Low. The full `test` script runs typecheck of the test config, but that runs in CI, not at pack time. A local `pnpm pack` from a broken-test state succeeds.

**Migration/fix.** Acceptable as-is. If tightening: `prepack: pnpm clean && pnpm test`.

---

## Finding F11 — `*.internal.ts` boundary not lint-enforced (Low)

**File:** convention-wide; 50+ `*.internal.ts` files; `fragments/index.ts:68` re-exports an `*.internal.ts` symbol publicly.

**Current pattern.** Naming convention only. The barrel audit script (`scripts/options-schema-barrel-audit.mjs`) enforces a different invariant (options-schema barrel completeness) — it does NOT enforce internal/public boundary.

**Why it matters for the campaign.** Phase 1 M2 already flagged. The campaign's `DocDefinition` will introduce a new consumer surface; tightening the boundary now means the new API can't accidentally consume internals.

**Migration/fix.** Add to root ESLint config:

```js
{
  files: ['packages/architect-projection/src/**'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/*.internal.js', '**/*.internal'],
        message: 'Internal modules are package-private. Re-export through the nearest non-internal sibling if you need to expose them.',
      }],
    }],
  },
},
```

(Allow the existing intentional re-exports — namely `fragments/index.ts:68` for `FragmentSchema` — by file-scoping the rule, or by renaming `fragment-schema.internal.ts` since it is in practice public.)

---

## Finding F12 — Options-schema barrel-audit script could enforce `.describe()` (Low)

**File:** `packages/architect-projection/scripts/options-schema-barrel-audit.mjs`.

**Current pattern.** The script scans for `*OptionsSchema` exports and checks they're routed through the projections barrel + the root barrel. Pure name/export discipline; doesn't open the schemas.

**Why it matters for the campaign.** The campaign's `.describe()` discipline (per F4) needs enforcement. A peer script that loads each `*OptionsSchema` at audit time and asserts every shape entry has a description gives a build-time gate, surfacing missing descriptions as CI failures rather than as silently-empty doc tables.

**Migration/fix.** Add a second audit step:

```js
// scripts/options-schema-describe-audit.mjs (new)
// At test:barrel-audit time, dynamically import each OptionsSchema, walk its shape,
// and assert every leaf has `_def.description` set when the schema is on an allowlist
// of campaign-extractable schemas (start with: ProgressiveDisclosurePolicySchema,
// DisclosureSpecSchema). Fail with a clear list of un-described fields.
```

Wire into the existing `test:barrel-audit` script. (Confirms Phase 3 D-C2 / Phase 4 prep — `.describe()` discipline as a build-time check.)

---

## `.describe()` campaign-priority targets

The campaign's headline extractor will generate disclosure / routing / options tables from Zod schemas. The 8 below are sampled by their probability of being demoed first and by how much config surface their fields expose. **P0** = unblocks the headline demo; **P1** = stabilises the second-wave demos; **P2** = nice-to-have. All entries currently show `bare` for `.describe()` state.

| #   | Schema                                                                  | File                                                                    | Field count                                                                                   | Current `.describe()` | Campaign extractor target?                                                     | Priority                                                   |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | `ProgressiveDisclosurePolicySchema`                                     | `projections/documentation-composition/progressive-disclosure.ts:16-20` | 3 (level, availability, purpose)                                                              | bare                  | **yes** — DEEP-DIVE headline demo                                              | **P0**                                                     |
| 2   | `ProgressiveDisclosureLevelSchema`                                      | `progressive-disclosure.ts:13`                                          | 4 enum cases                                                                                  | bare                  | **yes** — paired table                                                         | **P0**                                                     |
| 3   | `DisclosureSpecSchema`                                                  | `projections/documentation-composition/disclosure-spec.ts:26-33`        | 6 (grouping, richness, rootShape, emitChildren, committed, filter)                            | bare                  | **yes** — ContentFragment ref table                                            | **P0**                                                     |
| 4   | `ContentRichnessSchema`                                                 | `disclosure-spec.ts:8-13`                                               | 4 enum cases                                                                                  | bare                  | yes                                                                            | **P0**                                                     |
| 5   | `GroupingAxisSchema`                                                    | `disclosure-spec.ts:15-22`                                              | 6 enum cases                                                                                  | bare                  | yes                                                                            | **P1**                                                     |
| 6   | `RootShapeSchema`                                                       | `disclosure-spec.ts:24`                                                 | 2 enum cases                                                                                  | bare                  | yes                                                                            | **P1**                                                     |
| 7   | `DocumentationTypeRegistryEntrySchema` (+ Supported / Dropped variants) | `projections/documentation-composition/documentation-types.ts:35-65`    | 8–10 (key, status, generatorAliases, childDirectory, markdownRootTarget, disclosureMatrix, …) | bare                  | yes — but module being replaced (Phase 1 C1)                                   | **P1** if pre-replacement docs target it; **P2** otherwise |
| 8   | `BlockSchema` variants (Heading / Paragraph / Code / List / …)          | `blocks/schema.ts:73-152`                                               | 9 schemas × 2–4 fields each                                                                   | bare                  | likely — ContentFragment renders into Blocks; reference docs for the substrate | **P1**                                                     |

Six P0 schemas, totalling **23 fields + enum cases**, gate the headline demo. None of them changes wire shape — `.describe()` is metadata-only. Adding them is a one-session change.

---

## Bottom line

The package is well-typed, no-BC-clean, ESM-correct, and Zod-strict-clean. The framework-level findings are concentrated in three areas:

1. **`.describe()` discipline (F4 + F12)** — the campaign's headline demo is empty until 6 schemas get descriptions. This is the single highest-leverage fix.
2. **Schema-as-source-of-truth (F2 + F3 + F5)** — three Zod-first inversions where types lead schemas. Untangling them is a precondition for any `.describe()`-driven extractor to surface useful metadata.
3. **Boundary enforcement (F7 + F8 + F11)** — three convention-only walls (`*.internal`, `TRUSTED_MARKDOWN`, renderer↔registry) that the campaign will add new consumers around. Encode them as lint rules now, before the new consumers land.

The `sideEffects: false` lie (F1) is the highest-severity finding individually because it's the only one that breaks a published-package contract, but its blast radius is currently small.
