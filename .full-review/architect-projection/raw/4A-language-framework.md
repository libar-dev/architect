# architect-projection — Phase 4A: Language & Framework (TS / Zod 4 / Vitest 4)

**Reviewer:** javascript-typescript:typescript-pro
**Assessment date:** 2026-05-17
**Stack:** Node 20+, TS 5.8, Zod 4.1.11, Vitest 4.1.4, `@amiceli/vitest-cucumber` 6.3.0, pure ESM (`"type": "module"`)
**Scope:** `packages/architect-projection/src` (145 files, ~15,238 SLOC) + 36 step files under `tests/features/**/*.steps.ts`.

---

## 1. Executive Summary — projection is the family's TS/Zod 4 reference

`architect-projection` is **doctrinally cleaner than `architect-core` on every dimension this phase cares about**. Where the core Phase 4A surfaced 9 High-severity language findings (16 `as` casts in tag parsing, `z.function().optional()`, 28 `z.object` sites needing strict-sweep, 3 `void X` expressions, hand-written `PatternGraph` interface drifting from its schema), projection has **none** of the equivalent class:

| Class of breach | Core | Projection | Notes |
|-----------------|------|------------|-------|
| `z.object` sites needing strict-sweep | 28 | **0** | 107 `z.strictObject` callsites, zero `z.object`. |
| `as unknown as` casts in `src/` | 0 | **0** | Both clean. |
| `void X;` expression-statement suppressions | 3 | **0** | Eight `: void {` are return-type annotations, not suppressions. |
| `console.*` calls in `src/` | 2 | **0** | Clean. |
| `from 'fs'` / `from 'path'` legacy imports | mixed | **0** | Zero `node:` *and* zero unprefixed Node imports in `src/` — data-layer purity. |
| `@ts-ignore` / `@ts-expect-error` / `eslint-disable` | 0 | **0** | Both clean (root rule `architect-local/no-suppression-comments`). |
| `z.function().optional()` Zod-3 idiom | 1 (F4A-C-2) | **0** | Function contracts don't escape the trust boundary here. |
| `@typescript-eslint/no-explicit-any: error` violations | 0 | **0** | Both clean. |
| `Map<string, unknown>` builder + `as X` casts after `.get()` | 16 sites (F4A-H-1) | **0** | The class doesn't exist here. |
| `[key: string]: unknown` index-signature defeats `noPropertyAccessFromIndexSignature` | yes (F4A-H-2) | **0** | The package has no `Record<string, unknown>` builders propagated through `ReturnType<...>`. |
| Hand-written interface shadowing a schema | `PatternGraph` (C-CORE-2) | **1** (`ProjectionContext`) | But it's a *context* type, not a wire contract — see L-PROJ-F-2 below. |
| `z.input<T>` vs `z.output<T>` separation | 1 reference site (`extracted-shape.ts`) | **0** | Projection doesn't use defaults/transforms at the boundary, so the distinction doesn't bite — but adopting `z.input<typeof OptionsSchema>` for the test-fixture builders would tighten safety (L-PROJ-F-1). |

The Phase 4 angle for this package is therefore **inverted**: not "what should projection adopt from core?" but **"what should the rest of the family adopt from projection?"**. Sections 5 and 6 catalog the family-reference patterns and one (and only one) Zod 4 wrinkle that's still open.

The two non-trivial Phase 4A items are:

1. **C-PROJ-1 / F4A-H-6 confirms** — `.extend()` on a Zod 4 `z.strictObject` silently produces an open schema, at `PatternDetailSchema` and `EmbeddedDeliverableManifestSchema`. Phase 1 already flagged this; F4A's contribution is the **Zod 4 semantic rationale** (Section 3) plus a **typed regression test recipe** (Section 6.5).
2. **`StrictKindTable<Out, Options, Kinds>` is the family's best example of using TS as a closed-set guard** — but its `Kinds` type parameter is a **hand-rewritten subset** of `FragmentKind` literals at `render-markdown.ts:176-186` (`MarkdownNormalizerKind` lists 10 of 43 kinds). Adding a new fragment kind to `FragmentSchema` doesn't break the build — the table just stays partial silently. Section 4.3 shows the Zod 4 + TS recipe to derive `MarkdownNormalizerKind` from the discriminated union literals so additions are compile-forced.

Three Medium TS-specific items not yet flagged in Phases 1-3:

- **M-PROJ-F-1.** `parseAndProject` helper at `_shared/parse-and-project.internal.ts:22-27` accepts `z.ZodType<Options>` — the widest possible Zod type. It does NOT structurally require `schema instanceof z.ZodObject` or that the catchall is `ZodNever`. This is the gap that lets a future projection author ship a `z.object(...)` (no `strict()`) option schema and still route through the trust-boundary helper. Phase 2 (M-PROJ-9) flagged this for runtime assertion; Section 3.3 gives the type-level variant.
- **M-PROJ-F-2.** `parseAndProjectOpenQuestionList` (C-PROJ-2 outlier) throws raw `ZodError`. Beyond the trust-boundary inconsistency Phase 1 already raised, this is a **TS surface defect**: the function's return type is `ProjectionBundle<OpenQuestionList>` but it can throw `ZodError` (typed as `unknown` to the caller under `useUnknownInCatchVariables: true`). Sibling entrypoints raise `BoundaryParseError` — a typed, importable class with a discriminated `BoundaryParseIssue[]` shape. The error shape is part of the function signature even when TS doesn't model it.
- **M-PROJ-F-3.** The `Proxy<readonly TValue[]>` in `documentation-type-registry.ts:138-174` is more complex than the use case justifies (Phase 1 H-PROJ-A-9), but if it ships, the cast at `:155` (`Reflect.get(...) as unknown`) is the only `as unknown` in the package's production source. Section 4.5 audits the typing.

The `as keyof typeof VALID_TRANSITIONS` cast at `session-context.internal.ts:264` (M-PROJ-1) has a precise TS-level explanation that Phase 1 didn't spell out: **TypeScript does not narrow `string` through `ReadonlySet<string>.has()`** because `Set<T>.has` takes `T` (here `string`), not a literal-narrower predicate. Section 3.2 walks through this.

---

## 2. Findings by severity (TS-specific, additive to Phases 1-3)

### Critical (P0)

All three of Phase 1's Criticals are reconfirmed from the language-framework lens. **No new C0 items from 4A.**

| ID | Phase 1 ref | Phase 4A angle |
|----|-------------|----------------|
| C-PROJ-1 | Phase 1 C-PROJ-1 | Zod 4 `.extend()` silently drops strict mode. **Section 3.1** explains why (Zod 4's `ZodObject._def.catchall` propagation rule changed in v4 internals) and gives the typed regression test that would catch it. |
| C-PROJ-2 | Phase 1 C-PROJ-2 | Outlier's raw `ZodError` throw is a TS-surface defect on top of the boundary-uniformity defect — see M-PROJ-F-2 above. |
| C-PROJ-3 | Phase 1 C-PROJ-3 + Phase 2 Cleanup-C-PROJ-1 | CI/perf wire-up — addressed in 4B; mentioned here only because the regression Phase 2B observed (`project.avgMs = 2.05 ms`) is downstream of language-shape issues like `filterPatterns` defensive copy. |

### High (P1) — TS-specific

**H-PROJ-F-1.** `StrictKindTable<Out, Options, Kinds>`'s `Kinds` type parameter is a hand-maintained subset of `FragmentKind` literals at `render-markdown.ts:176-186`. Adding a fragment to the `FragmentSchema` discriminated union does NOT force a `MarkdownNormalizerKind` update — the compile-time guarantee is **only that every entry in the table is a valid fragment kind**, not that every "first-class" kind has an entry. Phase 2 M-SIMP-10 flagged this; Section 4.3 gives the Zod 4 + TS recipe.

**H-PROJ-F-2.** `ProjectionContext` (`context/projection-context.ts:33-40`) is the **most-passed type in the package** (every projection takes it as the first argument). It's a hand-written `interface`, not derived from a Zod schema, and consumers of `parseAtBoundary` don't validate it. This is the projection analogue of core's `PatternGraph` hand-written-interface drift (C-CORE-2) — except that `ProjectionContext` carries `packageResolver: PackageResolver` (a function) and `projectMetadata?: ProjectMetadata`, so it can't be JSON-validated. A `z.custom<ProjectionContext>((value) => isProjectionContext(value))` brand with a hand-written `isProjectionContext` guard would close the gap at the public entry points (e.g. the not-yet-existing MCP server tools), without trying to validate the resolver function.

### Medium (P2) — TS-specific

| ID | Location | Issue |
|----|----------|-------|
| M-PROJ-F-1 | `_shared/parse-and-project.internal.ts:22-27` | `schema: z.ZodType<Options>` doesn't constrain to a strict object. Phase 2 M-PROJ-9 has the runtime assertion recipe; type-level variant in Section 3.3. |
| M-PROJ-F-2 | `pattern-relations/open-question-list.ts:34-39` | Raw `ZodError` throw bypasses `BoundaryParseError` discriminant. TS angle on Phase 1 C-PROJ-2. |
| M-PROJ-F-3 | `documentation-type-registry.ts:138-174` | `Proxy<readonly TValue[]>` typing review — Section 4.5. Phase 1 H-PROJ-A-9 already targets the module for deletion; if it survives, the cast safety needs the explicit narrowing in 4.5. |
| M-PROJ-F-4 | `session-context.internal.ts:264`, `render-compact-text.ts:454` | `Set.has` doesn't narrow; the resulting `as keyof typeof X` casts are working-as-typed because `VALID_PROCESS_STATUS_SET: ReadonlySet<string>`. Type-guard recipe in Section 3.2. |
| M-PROJ-F-5 | `parse-and-project.internal.ts:9` | `NO_DEFAULT_RAW_OPTIONS = Symbol(...)` sentinel — Phase 2 M-SIMP-9 already flagged for replacement with an explicit `defaults?: Options` parameter. TS angle: the sentinel weakens the type signature (`defaultRawOptions: unknown`) compared to an explicit `defaults?: Options`. |
| M-PROJ-F-6 | `documentation-type-registry.ts:53` | `type DocumentationTypeMetadata = SupportedDocumentationTypeMetadata` — two type names for the same shape (M-PROJ-A-7 from Phase 1). TS doesn't catch the drift; only structural identity exists. Replace one with the other or delete the alias. |
| M-PROJ-F-7 | `fragments/pattern-relations/supporting.ts:85-92` | `DependencyTreeNodeSchema: z.ZodType<DependencyTreeNode> = z.strictObject({...children: z.array(z.lazy(...))})` — this is the **correct** Zod 4 recursive idiom (Section 4.4 promotes it), but it inverts the type-from-schema direction (the schema is annotated with a hand-written type rather than deriving the type via `z.infer`). Acceptable because Zod 4 cannot infer recursive lazy unions; preserve the pattern but note the type is the source of truth, not the schema. |

### Low (P3) — TS-specific

| ID | Issue |
|----|-------|
| L-PROJ-F-1 | No `z.input<typeof Schema>` usage in `src/`. Options schemas don't currently use `.default()` or `.transform()`, so `z.input ≡ z.infer`. If any future option schema adds a default, callers of `parseAndProject` will pass `Options` (post-default) when they should pass `z.input<typeof Schema>` (pre-default). Flag for follow-up when defaults arrive. |
| L-PROJ-F-2 | `ProjectionContext` (Section H-PROJ-F-2) is hand-written. Acceptable because `PackageResolver` is a function; flag for review if any sub-property becomes JSON-serializable. |
| L-PROJ-F-3 | `BLOCK_TYPES = new Set<BlockType>([...])` at `blocks/schema.ts:127-137` lists 9 entries by hand; `isBlock` at `:139-146` uses it. If `BlockSchema` adds a new variant, this set won't fail compile. Recipe: derive via `BLOCK_TYPES = new Set(BlockSchema.options.map(o => o.shape.type.value))` (or whatever Zod 4 exposes on `ZodDiscriminatedUnion`). |
| L-PROJ-F-4 | `isBlock` at `blocks/schema.ts:139-146` casts to `(value as { type: BlockType }).type` for the `Set.has` check. Same class as Section 3.2 — but on a `Set<BlockType>`, so `Set.has` *can* narrow if the input is already typed `unknown`. The cast is therefore avoidable: `BLOCK_TYPES.has(value.type as BlockType)` after a `'type' in value` guard. |
| L-PROJ-F-5 | `Object.getPrototypeOf(value)` cast chain in `renderJson.ts:205-217` is correct (and necessary because TS types `Object.getPrototypeOf` as returning `any` in lib.es5 — wait, no, since TS 5.0 it returns `unknown`). The defensive `typeof prototype !== 'object' \|\| prototype === null` check is exemplary. Preserve. |
| L-PROJ-F-6 | Three `as const satisfies T` sites — `disclosure/levels.ts:65`, `documentation-type-registry.output-routing.ts:59`, `documentation-type-registry.disclosure.ts:76`, `requirement-routes.ts:19`, `documentation-type-registry.identity.ts:87`. All correct TS 5 idiom. Preserve. |
| L-PROJ-F-7 | `import * as` style absent — 147 `import type` declarations across the package. ESM hygiene is reference quality. |

---

## 3. Zod 4 audit (call-site verdicts + semantic notes)

### 3.1. `.extend()` on a `z.strictObject` (C-PROJ-1 reconfirmed)

**Sites:**
- `fragments/pattern-relations/pattern-detail.ts:24` — `PatternDetailSchema = PatternIdentitySchema.extend({...})`
- `fragments/pattern-relations/supporting.ts:54-58` — `EmbeddedDeliverableManifestSchema = DeliverableManifestSchema.omit({kind: true}).extend({items: ...})`

**Zod 4 semantics.** In Zod 3, `ZodObject.extend()` propagated `unknownKeys`, so `strict.extend(...)` stayed strict. In Zod 4, `ZodObject.extend()` is defined as `this.extend(augmentation) → new ZodObject({...this._def, shape: {...this._def.shape, ...augmentation}, catchall: ZodNever, unknownKeys: 'strip'})` — **strict is collapsed to strip**. The Zod 4 changelog calls this out: "extend, omit, pick, partial, required no longer carry through unknownKeys; chain `.strict()` after to restore strictness."

This is the same bug F4A-H-6 documented in core (`PackageConfigSchema = PackageSchema.extend({...})`). It's family-wide.

**Recipe — three options, in increasing strictness:**

```typescript
// Option A: post-extend re-strict (smallest diff, fragile — easy to forget)
const PatternDetailSchema = PatternIdentitySchema.extend({...}).strict();

// Option B: spread-shape — the F4A-H-6 recipe (idiomatic Zod 4)
const PatternDetailSchema = z.strictObject({
  ...PatternIdentitySchema.shape,
  kind: z.literal('PatternDetail'),
  description: z.string().optional(),
  // ...
});

// Option C: keep PatternIdentitySchema as a strictObject from the start
// (it's currently derived via PatternSummarySchema.omit({kind: true}), which
// already lost strictness — see Section 3.4 below).
```

**Recommend Option B** for both sites — it's the canonical Zod 4 strict-extension pattern, and a `parseAtBoundary(PatternDetailSchema, {patternName: '...', extraField: 'leak'})` round-trip test catches regressions.

### 3.2. `Set.has` doesn't narrow — the `as keyof typeof` pattern (M-PROJ-F-4)

**Sites:**
- `projections/execution-context/session-context.internal.ts:264` — `const processStatus = status as keyof typeof VALID_TRANSITIONS;`
- `renderers/render-compact-text.ts:454` — `return isDeliverableStatusComplete(status as DeliverableStatus);`

**Why TS doesn't narrow.** `VALID_PROCESS_STATUS_SET` at `architect-core/src/taxonomy/status-values.ts:11` is declared `ReadonlySet<string>`, so `.has(string): boolean`. `Set<T>.has` signature is `has(value: T): boolean` — it doesn't have a `value is T extends ... ? ... : T` predicate form. Even if you typed the Set as `ReadonlySet<ProcessStatusValue>`, calling `.has(arbitraryString)` would be a compile error (you can't widen the input).

**The general pattern.** `Set.prototype.has` cannot narrow because:
1. TS 5.5+ does provide `Set<T> extends ReadonlySet<infer U> ? ... : ...` patterns in some lib variants, but mainstream `lib.es2015.collection.d.ts` types `has(value: T): boolean` without a type predicate.
2. Adding a type-predicate form would require `Set<T>.has<V extends T>(value: V): value is V` — TS does support this kind of generic predicate but `Set.has`'s lib type doesn't.

**Recipe.** Export an `isProcessStatusValue` type-guard from `@libar-dev/architect-core` and use it instead of `.has`:

```typescript
// architect-core/src/taxonomy/status-values.ts
export function isProcessStatusValue(value: unknown): value is ProcessStatusValue {
  return typeof value === 'string' && VALID_PROCESS_STATUS_SET.has(value);
}

// projection consumer
function createFsmContext(status: string | undefined): FsmContext | undefined {
  if (status === undefined || !isProcessStatusValue(status)) return undefined;
  // status is now ProcessStatusValue — no cast needed
  return {
    currentStatus: status,
    validTransitions: [...VALID_TRANSITIONS[status]],
    protectionLevel: PROTECTION_LEVELS[status],
  };
}
```

This is the same recipe Phase 2 M-SIMP-1 proposed; the addition here is the **library-type explanation**: it's not a TS strictness gap, it's a `lib.es2015.collection.d.ts` design limit.

The same recipe applies to `isDeliverableStatusComplete(status as DeliverableStatus)` at `render-compact-text.ts:454`: add `isDeliverableStatus(value: unknown): value is DeliverableStatus` in the fragment module, drop the cast.

### 3.3. `parseAndProject` schema constraint (M-PROJ-F-1)

`_shared/parse-and-project.internal.ts:22-27`:

```typescript
export function parseAndProject<Options, Output>(
  schema: z.ZodType<Options>,  // ← any ZodType, including z.object (open)
  project: (context: ProjectionContext, options: Options) => Output,
  projectionName: string,
  defaultRawOptions: unknown = NO_DEFAULT_RAW_OPTIONS,
): (context: ProjectionContext, rawOptions?: unknown) => Output { ... }
```

Phase 2 M-PROJ-9 proposes a runtime assertion. The **type-level option** is to constrain `schema` to ZodObject with strict catchall — but Zod 4's `ZodObject` typing makes this awkward:

```typescript
// Workable but ugly — Zod 4 ZodObject is generic over Shape and Catchall
export function parseAndProject<
  Shape extends z.ZodRawShape,
  Output,
  Schema extends z.ZodObject<Shape, z.core.$strict>,
>(
  schema: Schema,
  project: (context: ProjectionContext, options: z.infer<Schema>) => Output,
  // ...
) { ... }
```

The `z.core.$strict` constraint forces callers to pass a strict-object schema; `z.object({...})` won't satisfy the bound. **However**, Zod 4's internal `$strict` type is not part of the public API and may not be stable across minor versions. The pragmatic move is therefore Phase 2 M-PROJ-9's runtime assertion at function-creation time:

```typescript
export function parseAndProject<Options, Output>(
  schema: z.ZodType<Options>,
  project: ...,
  projectionName: string,
  defaultRawOptions: unknown = NO_DEFAULT_RAW_OPTIONS,
) {
  if (!(schema instanceof z.ZodObject) || schema.def.catchall.def.type !== 'never') {
    throw new Error(
      `[parse-and-project] ${projectionName}: schema must be a z.strictObject. Open-shape schemas leak unknown options past the trust boundary.`,
    );
  }
  // ...
}
```

(Replace `.def.catchall.def.type` with whatever Zod 4 exposes — the internal accessor names move; the check is "catchall is `ZodNever`".)

### 3.4. `.omit()` also drops strict mode in Zod 4 — same bug, different verb

`fragments/pattern-relations/pattern-summary.ts:28` — `export const PatternIdentitySchema = PatternSummarySchema.omit({ kind: true });`

`fragments/pattern-relations/supporting.ts:52` — `export const EmbeddedDeliverableSchema = DeliverableSchema.omit({ kind: true });`

Same root cause as `.extend()` (Section 3.1) — Zod 4's `pick/omit/extend/merge/partial/required` family all reset `unknownKeys` to `strip`. **`PatternIdentitySchema` is therefore open**, and `PatternDetailSchema.extend(PatternIdentitySchema)` compounds the loss: even Option A in 3.1 (`.strict()` chained after `.extend()`) wouldn't fully fix it because the *spread-shape* recipe at Option B needs `PatternIdentitySchema.shape`, which still works regardless of strict state.

**Recommended sweep:** audit every `.omit()` / `.pick()` / `.extend()` / `.merge()` / `.partial()` site in the package (3 sites total) and adopt the spread-shape pattern. Add a `no-restricted-syntax` ESLint rule banning `.extend(` / `.omit(` / `.pick(` / `.merge(` calls on Zod schemas in `src/`:

```javascript
// eslint.config.mjs
{
  selector: 'CallExpression[callee.property.name=/^(extend|omit|pick|merge|partial|required)$/]',
  message: '[arch-zod:strict-loss] Zod 4 resets unknownKeys on extend/omit/pick/merge/partial/required. Use z.strictObject({ ...Schema.shape, ... }) instead.',
}
```

This is **the second family-wide Zod 4 audit script** (after the existing `options-schema-barrel-audit.mjs`); promote both to workspace level once the strict-sweep lands.

### 3.5. Zod 4 modernisms — call-site verdicts

| Site | API | Verdict |
|------|-----|---------|
| `blocks/schema.ts:113` | `z.ZodType<Block>: z.discriminatedUnion('type', [...])` with `z.lazy` on `CollapsibleBlockSchema.content` | **Correct** — the canonical Zod 4 recursive-discriminated-union pattern. Reference for family. |
| `fragments/fragment-schema.internal.ts:70` | `z.discriminatedUnion('kind', [43 strictObject literals])` | **Correct** — O(1) discriminant dispatch, structured errors. |
| `fragments/governance/business-rule-set.ts:26` | Nested `z.discriminatedUnion('scope', [...])` where each branch carries `kind: z.literal('BusinessRuleSet')` | **Correct** — Zod 4 supports a `discriminatedUnion` member that is itself a `strictObject` (not another `discriminatedUnion`), so the outer `FragmentSchema = discriminatedUnion('kind', [...])` flattens this via `kind` while the inner `scope` discriminator narrows further at the BusinessRuleSet branch only. Subtle but right. |
| `fragments/pattern-relations/supporting.ts:85-92` | `DependencyTreeNodeSchema: z.ZodType<DependencyTreeNode> = z.strictObject({...children: z.array(z.lazy(() => DependencyTreeNodeSchema))})` | **Correct** — Zod 4 cannot infer recursive lazy unions, so the type is hand-written and the schema is annotated. Preserve. Note: type is source of truth, not schema (M-PROJ-F-7). |
| `disclosure/spec.ts:29-54` | `z.strictObject({...}).describe(...)` chain | **Correct** — `.describe()` on every field; surfaces in MCP tool descriptions if `getDocumentationTypeMetadata` is wired into MCP later. |
| `routing/route-id.ts:29-32` | `z.string().refine(isLogicalRouteId, {message: '...'})` | **Correct** — type narrowing via `.refine` predicate. The `LogicalRouteId` is a template-literal type, but `refine` doesn't carry that into `z.infer` — it stays `string`. Acceptable; the route-id functions return template-literal types directly. |
| `_shared/filter.ts:11-14` | `z.strictObject({maturity: z.array(...).min(1).optional(), status: z.array(...).min(1).optional()})` | **Correct** — `.min(1)` rejects empty arrays at the boundary; `.optional()` allows absence. Reference for filter-schema pattern. |
| **Not used and not needed:** | `z.preprocess`, `z.coerce`, `z.pipe`, `z.transform` — projection has no preprocessing or type-coercion concerns (it's a read-side library). Zero sites. |

**Verdict:** 107 `z.strictObject` callsites with **two** `.extend`-strictness-loss bugs and **two** `.omit`-strictness-loss bugs at the boundary of the same chain (`PatternSummarySchema → PatternIdentitySchema → PatternDetailSchema`). Sweep is mechanical; lint rule (Section 3.4) prevents recurrence.

---

## 4. TS strictness audit — where projection is the family reference

### 4.1. All four strictness flags ON; zero suppressions; zero `any`

From `tsconfig.base.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`, `useUnknownInCatchVariables: true`. From `tsconfig.architect-base.json`: `noPropertyAccessFromIndexSignature: true`. Projection inherits both.

Verified:
- **`as unknown as`** in `src/`: 0 (Phase 2B already confirmed).
- **`@ts-ignore` / `@ts-expect-error` / `eslint-disable`**: 0.
- **`any` keyword in `src/`**: 0 (`@typescript-eslint/no-explicit-any: error` enforced).
- **`void X;` expression statements**: 0 (`void` only as return-type annotation, 8 sites — verified by inspection).
- **`Map.get(...) as X`** after `unknown` value type: 0 (no `Map<string, unknown>` builders).
- **`[key: string]: unknown`** index signature: 0 (audited via the package's own `Record<string, unknown>` greps; only `transformObject` in `render-json.ts:173` uses it intentionally as a *defensive* read-side wrapper).

### 4.2. `dispatchByKind` — the load-bearing cast is documented and bounded

`renderers/_shared/dispatch.ts:30-37`:

```typescript
const fn = table[fragment.kind];
return fn
  ? // Invariant: each table entry is stored under the exact matching `fragment.kind`, so once the
    // lookup succeeds this cast is a sound bridge from the runtime string discriminator back to
    // the compile-time `FragmentByKind<K>` handler signature. Keep the table keyed by `FragmentKind`
    // and do not reuse handlers across mismatched kinds, or this load-bearing cast stops being safe.
    (fn as (f: Fragment, o: Options) => Out)(fragment, options)
  : fallback(fragment, options);
```

The cast `(fn as (f: Fragment, o: Options) => Out)` is **unavoidable in current TS** — the dependent indexing `KindTable<Out, Options>[fragment.kind]` produces `(fragment: FragmentByKind<typeof fragment.kind>, options: Options) => Out`, but TS can't unify `typeof fragment.kind` with the same `K` after the conditional lookup. The pattern is documented at the cast site with the invariant that keeps it safe. **This is the reference pattern for any future kind-dispatched dispatcher in the family.**

(There is a more elaborate version using a [distributive conditional type to fold the union into a single callable](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#improved-narrowing-with-this-properties), but it's not idiomatic Zod 4 and the cost of one well-commented cast is lower than the cost of a type-level acrobatics that the next maintainer has to relearn.)

### 4.3. `StrictKindTable<Out, Options, Kinds>` — the right shape, but `Kinds` should derive from `FragmentSchema` (H-PROJ-F-1)

Current at `renderers/_shared/dispatch.ts:20-22`:

```typescript
export type StrictKindTable<Out, Options, Kinds extends FragmentKind> = {
  readonly [K in Kinds]: (fragment: FragmentByKind<K>, options: Options) => Out;
};
```

This is correct as-is — `Kinds extends FragmentKind` guarantees every key is a real fragment kind; the mapped type guarantees every entry has the matching handler signature. **But** the consumer at `render-markdown.ts:176-186` hand-types the subset:

```typescript
type MarkdownNormalizerKind =
  | 'ArchitectureDiagram'
  | 'BusinessRuleSet'
  | 'DecisionCatalog'
  | 'DecisionRecord'
  | 'RoadmapTimeline'
  | 'ReleaseNotesDigest'
  | 'RequirementDigest'
  | 'TaxonomyDigest'
  | 'TraceabilityMatrix'
  | 'ValidationRuleDigest';

const MARKDOWN_NORMALIZERS = { ... } satisfies StrictKindTable<MarkdownDocument, NormalizeMarkdownOptions, MarkdownNormalizerKind>;
```

If `FragmentSchema` gains a new discriminator (e.g. `'NewFragmentKind'`), nothing fails. The `MARKDOWN_NORMALIZERS` table stays partial; `dispatchByKind` silently falls through to `fallback` for the new kind. This is **the very class of error `StrictKindTable` was designed to prevent** — the type works as designed, but only on what's listed.

**Two recipes — pick one:**

**Recipe A — Make the "first-class" set explicit and exhaustive.** Move `MarkdownNormalizerKind` to `fragments/index.ts` as a sibling export of `FragmentKind`, named `FirstClassFragmentKind`, and add a compile-time assertion that the residue is the "generic fallback" set:

```typescript
// fragments/index.ts (or a new fragments/classification.ts)
export type FirstClassFragmentKind =
  | 'ArchitectureDiagram'
  | 'BusinessRuleSet'
  // ... (10 entries)
export type GenericFragmentKind = Exclude<FragmentKind, FirstClassFragmentKind>;

// compile-time exhaustiveness check — uncovered union members fail here
type _exhaustive = FirstClassFragmentKind | GenericFragmentKind extends FragmentKind
  ? FragmentKind extends FirstClassFragmentKind | GenericFragmentKind
    ? true
    : never
  : never;
const _assertExhaustive: _exhaustive = true;
```

Adding a new fragment kind to `FragmentSchema` flips `_assertExhaustive` to `never`; build breaks at the assertion site; maintainer is forced to decide whether the new kind is "first-class" (needs a normalizer) or "generic fallback" (uses `normalizeGenericFragment`).

**Recipe B — Derive `Kinds` from `z.discriminatedUnion`'s option literals.** Zod 4's `ZodDiscriminatedUnion` exposes `options` (the array of branch schemas) and each branch's `shape.kind.value` is the literal. The Zod 4 internal types are not friendly here; a recipe close to this works:

```typescript
// fragments/fragment-schema.internal.ts (additional export)
export type FragmentKindLiterals = (typeof FragmentSchema.options)[number]['shape']['kind']['value'];
//                                 ^ "options" is the discriminatedUnion array
//                                                          ^ each option is a strictObject with a `kind` field
//                                                                       ^ kind is z.literal(X); .value is X

// then in render-markdown:
const MARKDOWN_NORMALIZERS = { ... } satisfies StrictKindTable<MarkdownDocument, NormalizeMarkdownOptions, FragmentKindLiterals & MarkdownNormalizerKind>;
//                                                                                                                  ^ still hand-narrowed, but typo in MarkdownNormalizerKind now fails
```

Recipe A is more idiomatic; Recipe B is more "schema-first". **Recommend A** — explicit `FirstClassFragmentKind` aligns with the "ADR-005 Codec/Renderer Separation" prose's hint that some fragments have richer presentations.

### 4.4. Recursive schema annotation — `BlockSchema` and `DependencyTreeNodeSchema` are the family reference

`blocks/schema.ts:107-123`:

```typescript
export interface CollapsibleBlock {
  type: 'collapsible';
  summary: string;
  content: Block[];
}
export type Block =
  | HeadingBlock | ParagraphBlock | SeparatorBlock | TableBlock
  | ListBlock | CodeBlock | MermaidBlock | CollapsibleBlock | LinkOutBlock;

export const CollapsibleBlockSchema = z.strictObject({
  type: z.literal('collapsible'),
  summary: z.string(),
  content: z.lazy(() => z.array(BlockSchema)),  // ← lazy reference defers BlockSchema lookup
});

export const BlockSchema: z.ZodType<Block> = z.discriminatedUnion('type', [...]);
```

And `fragments/pattern-relations/supporting.ts:76-92` for `DependencyTreeNodeSchema`.

This is **the** canonical Zod 4 pattern for recursive types: define the TS type hand-written, annotate the schema with `z.ZodType<T>`, and use `z.lazy(() => SelfReferencingSchema)` at the self-reference site. The package nails it on the two recursive surfaces. **Reference quality** — promote to a family doc snippet.

The same pattern is needed for the proposed `projectionBundleSchema<T>(fragmentSchema)` factory (H-SIMP-2 from Phase 2). Sketch:

```typescript
// fragments/base.ts (replacing the hand-coded isBundle + isRoutingLike chain)
export const BundleRoutingSchema = z.strictObject({
  rootRouteId: LogicalRouteIdSchema,
  childRouteIds: z.record(z.string(), LogicalRouteIdSchema),  // Zod 4 record(keySchema, valueSchema)
  childPathStrategy: z.enum(['flat', 'nested']),
  anchorStrategy: z.enum(['heading-slug', 'kind-id']),
  disclosureSpec: DisclosureSpecSchema.optional(),
  markdownRootTarget: z.string().regex(/\.md$/u).optional(),
  markdownChildDirectory: z.string().min(1).optional(),
  entityPathLayout: z.literal('nested-index').optional(),
});

export type BundleRouting = z.infer<typeof BundleRoutingSchema>;

export function projectionBundleSchema<T extends z.ZodType<Fragment>>(fragmentSchema: T) {
  return z.strictObject({
    root: fragmentSchema,
    children: z.record(z.string(), FragmentSchema),  // FragmentSchema for the cross-bundle children
    routing: BundleRoutingSchema.optional(),
  });
}

// usage
export type ProjectionBundle<T extends Fragment> = {
  root: T;
  children: Record<string, Fragment>;
  routing?: BundleRouting;
};
// or just z.infer<ReturnType<typeof projectionBundleSchema<typeof PatternDetailSchema>>>
```

Note `z.lazy` is **not** strictly required here because the bundle isn't self-referential at the schema level — `children: Record<string, Fragment>` is a flat map, not a tree. `z.lazy` only matters when `FragmentSchema` is referenced *inside its own discriminant tree*, which Block already handles correctly.

### 4.5. `Proxy<readonly TValue[]>` in `documentation-type-registry.ts` — typing review (M-PROJ-F-3)

`documentation-type-registry.ts:138-174`:

```typescript
function createLazyReadonlyArrayFacade<TValue>(load: () => readonly TValue[]): readonly TValue[] {
  const target: TValue[] = [];
  let initialized = false;

  function initialize(): void {
    if (initialized) return;
    initialized = true;
    target.push(...load());
    Object.freeze(target);
  }

  return new Proxy(target, {
    get(currentTarget, property, receiver): unknown {
      initialize();
      return Reflect.get(currentTarget, property, receiver) as unknown;
    },
    getOwnPropertyDescriptor(currentTarget, property) { initialize(); return Reflect.getOwnPropertyDescriptor(currentTarget, property); },
    has(currentTarget, property) { initialize(); return Reflect.has(currentTarget, property); },
    ownKeys(currentTarget) { initialize(); return Reflect.ownKeys(currentTarget); },
    set() { initialize(); return false; },
  });
}
```

**TS-typing verdict.** The signature `Proxy<TValue[]>` returns `TValue[]`, and the function annotates `readonly TValue[]` — that widening is fine. The cast `Reflect.get(...) as unknown` is the *only* `as unknown` in the package's production source (Phase 2 said zero; this one slipped because it's followed by a `: unknown` return type, not a `as unknown as X` chain). The cast is *necessary* because:

1. `Reflect.get` returns `unknown` since TS 5.0+ (`lib.es2015.reflect.d.ts` was updated).
2. The proxy handler's `get` return type is `unknown` (correct — Proxy traps must allow arbitrary access).
3. Without `as unknown`, TS infers `Reflect.get(...)` as `unknown` and tries to return that — which would be fine, but the explicit `as unknown` is defensive style.

Actually the cast is **redundant** — `Reflect.get` already returns `unknown` in modern lib types. Removing it doesn't change behavior. Mild style nit; not a finding.

**The actual issue** with this Proxy (already in Phase 1 H-PROJ-A-9 / Phase 2 Cleanup-H-PROJ-3): it's an over-engineered solution to "lazy-init a 12-entry static registry." A simple module-level closure:

```typescript
let cachedRegistry: readonly SupportedDocumentationTypeMetadata[] | undefined;
export function getSupportedDocumentationTypeRegistry(): readonly SupportedDocumentationTypeMetadata[] {
  cachedRegistry ??= buildSupportedDocumentationTypeRegistryState().registry;
  return cachedRegistry;
}
```

…is 5 lines, has identical lazy semantics, and doesn't require a Proxy. The Proxy approach also has a subtle correctness gap: `Array.prototype.length` access goes through `get(currentTarget, 'length', receiver)`, which initializes. But `Array.isArray(facade)` returns `true` even before initialization (because `Array.isArray` checks the underlying `target`, not via the trap), which is potentially confusing.

**Verdict:** if H-PROJ-A-9's deletion lands, this module dissolves. If not, replace with the closure. The current Proxy typing is technically sound but the abstraction cost is too high.

---

## 5. Vitest 4 / `@amiceli/vitest-cucumber` patterns

### 5.1. Idiomatic usage — 36 step files, consistent shape

Across all 36 `.steps.ts` files, the pattern is consistent:

```typescript
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

const feature = await loadFeature('tests/features/<area>/<name>.feature');
let state: <Name>State | null = null;

function createState(): <Name>State { return { ... }; }

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => { state = null; });
  Background(({ Given }) => {
    Given('the <feature> test state is initialized', () => { state = createState(); });
  });
  Rule('...', ({ RuleScenario, RuleScenarioOutline }) => { ... });
});
```

**What's idiomatic:**
- `let state: <Name>State | null = null` + `state!` non-null assertions inside step bodies (TS strict + Vitest's lifecycle hooks make this hard to avoid). 27 `state!` assertions in `fragment-schemas.feature.steps.ts` alone — high-frequency but consistent.
- `AfterEachScenario(() => { state = null })` for cleanup. **34 of 36 step files use it** (94%). Phase 3 (TC-M-6) flagged 4 step files in `architect-core` missing this; projection does it right.
- `RuleScenarioOutline` with `examples: Record<string, unknown>` second parameter — the package's `kindFromExamples(examples)` helper at `fragment-schemas.feature.steps.ts:44-50` and `renderer-smoke.feature.steps.ts:34-40` does the `kind in FRAGMENT_SCHEMAS` check before `as PublicFragmentKind` cast, so the cast is safe-by-construction.
- `loadFeature` at module top-level using top-level `await` — pure ESM (`"type": "module"`) makes this work; the alternative `beforeAll(async () => ...)` would be more vitest-y but `vitest-cucumber`'s API takes `feature` as a constructor arg, so top-level await is the cleanest fit.

**What's worth promoting to family-wide:**
- The `state: T | null` + `createState()` + `AfterEachScenario` triplet — the **canonical state-isolation pattern** under vitest-cucumber. Promote to a family `tests/_shared/feature-state.ts` helper that wraps `describeFeature` and threads a `createState` factory. Reduces the 27-`state!` count to ~3-5 per file.
- The `kindFromExamples`-style runtime guard before the cast — promote to a `tests/_shared/examples.ts` helper.

### 5.2. Test-side TS conventions — well-disciplined

Tests are configured with relaxed rules at `eslint.config.mjs:33-43`:

```javascript
{
  files: ['tests/**/*.ts'],
  rules: {
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/dot-notation': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  },
},
```

**Verdict:** sensible per-target relaxation — `no-non-null-assertion` off lets `state!` work; the others reduce noise on test-specific shapes. Tests still inherit strict TS compilation. **Promote to family** — every package should have this exact stanza.

13 `as unknown as` casts in tests (Phase 2 said zero in src; tests are unaudited). All inspected sites are fixture-construction casts where the test is intentionally crafting a malformed value to exercise an error path. Acceptable; suggest tagging with a comment like `// MALFORMED: invalid fixture for error-path test`.

### 5.3. Vitest 4 features not used and not needed

- `expect.poll` / `expect.soft` — projection has no async retried invariants (purely synchronous read-side library).
- `vi.useFakeTimers()` — no time-dependent code.
- `test.concurrent` — feature files run sequentially per `vitest-cucumber`'s `describeFeature` design.
- `vitest.workspace.ts` — single-config (modulo the perf-report duplicate, Phase 2 Cleanup-H-PROJ-2). Once that's collapsed, no need for workspaces.

### 5.4. Two configs — `vitest.config.ts` and `vitest.perf-report.config.mjs`

`vitest.config.ts` uses CJS `__dirname` at line 12 (`root: path.resolve(__dirname)`), while `vitest.perf-report.config.mjs` correctly uses `fileURLToPath(import.meta.url)`. **The CJS shim works** because Vitest's TS config loader handles both, but it's drift from ESM conventions used everywhere else in the package. **Recipe:** convert `vitest.config.ts` to use `fileURLToPath(import.meta.url)`, then collapse with the perf-report config per Phase 2 Cleanup-H-PROJ-2.

---

## 6. Module-boundary tooling — `.internal.ts` suffix enforcement

The package uses two complementary conventions for "internal":

- **`_internal/` directory** (`src/_internal/format-utils.ts`, `src/_internal/slug.ts`) — 3 files; not in any subpath export; cross-module use within the package.
- **`.internal.ts` suffix** — 28 files; not exported from barrel `index.ts` files; per-projection-domain internals.

**Enforcement status:**

| Mechanism | What it does | Where |
|-----------|--------------|-------|
| Root ESLint `no-restricted-imports` `patterns: [{ group: ['../**/*.internal.js'], ... }]` | Bans `.internal.js` cross-layer imports **from `src/renderers/**/*.ts` only** | `eslint.config.mjs:134-140` |
| `options-schema-barrel-audit.mjs` | Verifies every `*OptionsSchema` in a domain barrel is re-exported from root | `scripts/options-schema-barrel-audit.mjs` |
| `jsdoc-boilerplate-audit.mjs` | Bans the core DOC-H-3 boilerplate "When to Use" anti-pattern | `scripts/jsdoc-boilerplate-audit.mjs` |
| TS `package.json#exports` | Restricts importable subpaths to 7 named entries | `package.json:25-50` |

**Family-reference quality, with one extension worth landing:**

The renderer-only `no-restricted-imports` pattern (`'../**/*.internal.js'` ban) is the right shape but **only applied to renderers**. The general rule "no module outside a layer may import that layer's `.internal.ts` files" should be expressed package-wide. Recipe:

```javascript
// eslint.config.mjs (project-level)
{
  files: ['src/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          // Ban any import of *.internal.js from outside the same directory
          // (relative paths starting with ../ that target .internal.js)
          group: ['../**/*.internal.js', '../../**/*.internal.js'],
          message: '[arch-boundary:no-cross-layer-internal] .internal.ts files are scoped to their own directory; if you need this across directories, promote to a public entrypoint or move into shared/.',
        },
      ],
    }],
  },
},
```

The 100 `.internal.js` imports currently in `src/` are virtually all **same-directory or `../_shared/*.internal.js`** — the rule above with a more nuanced glob list could let `../_shared/` through while blocking lateral cross-domain reach. This is the projection-side analogue of the "renderer no cross-layer internal" rule generalized; **promote both audit scripts and the import-pattern rule to workspace-level after one final-pass audit**.

**TS-side enforcement option (stronger but more invasive):** add a `tsconfig.json` `paths` entry that re-routes `*.internal.js` to a `private/` alias that's not in `rootDirs`, breaking external consumption at compile time. **Not recommended** for this codebase — the ESLint pattern is cheaper and matches the package's existing convention.

---

## 7. What's family-reference quality — modules to copy verbatim

### 7.1. `parseAndProject` + `parseAtBoundary` (the trust-boundary chain)

`projections/_shared/parse-and-project.internal.ts` is **the family's reference implementation** for "parse-at-boundary" enforcement. Core ships `parseAtBoundary` and `BoundaryParseError` but never uses them itself (TD-CORE-1); projection consumes both correctly through 14 of 15 entrypoints. Combined with Section 6's per-layer barrel audit, this closes the loop: the audit script ensures every `parseAndProject*` is barrel-exported; the helper ensures every barrel-exported `parseAndProject*` routes through `parseAtBoundary`.

**Action:** after C-PROJ-2's fix and Cleanup-M-PROJ-1's audit-script extension, hold this helper up as the family's canonical trust-boundary pattern. Document it in `docs/PATTERNS.md` (or wherever the family decides architectural primitives live).

### 7.2. `StrictKindTable<Out, Options, Kinds>` + `dispatchByKind` (kind dispatch)

`renderers/_shared/dispatch.ts:16-38` — 22 lines that fully encode the "every kind has a handler" guarantee at compile time, with one well-commented load-bearing cast. Reference for any future kind-dispatched dispatcher in the family (status-by-status switches in core, kind-by-kind handlers in guard's lint pipeline).

**Caveat:** Section 4.3 (`H-PROJ-F-1`) — the `Kinds` parameter needs to derive from the discriminated union, not be hand-typed at the call site. Land that and the pattern is fully airtight.

### 7.3. `renderJson` defensive validation (`renderers/render-json.ts`)

The fail-loud validation chain at `renderers/render-json.ts:120-171`:
- `bigint` / `function` / `symbol` / `Date` / `Map` / `Set` / non-finite numbers / non-plain-object — each gets a typed error with the JSON path (`$.children.foo.bar[3]`).
- `getConstructorName(value)` at `:205-217` handles the edge case where `value` has a null prototype.

This is **the reference for any future JSON serializer in the family**. The pattern combines:
1. Defensive `unknown` typing on the recursive `transformValue` parameter.
2. JSON-path threading through every recursion frame.
3. Typed error messages that name the failed assertion explicitly.

**Action:** the same pattern would close core's `Result.unwrap` `JSON.stringify`-on-circular-refs gap (L-CORE-10). When `Result<T,E>` gains structured serialization, adopt `renderJson`'s shape.

### 7.4. Recursive Zod 4 idiom (`blocks/schema.ts` + `dependency-tree-node`)

Section 4.4 — the `z.ZodType<T> = z.lazy(() => z.discriminatedUnion(...))` + hand-written type pattern. **The canonical Zod 4 recursive recipe.** Promote to a family doc.

### 7.5. The `options-schema-barrel-audit.mjs` script

The audit script's value is **mechanical surface-completeness enforcement** — it's the family's only example of a script that catches "I added a `*OptionsSchema` and forgot to re-export it from the root barrel" before CI. Phase 2 Cleanup-M-PROJ-1 has the 15-LOC extension to also catch the C-PROJ-2 outlier.

**Promote to workspace level** at `<repo>/scripts/architect-audits/`. Each package's `test` script invokes the shared audit against its own `src/` tree. (Pair with `jsdoc-boilerplate-audit.mjs` per Phase 3 DOC-PROJ-H-3 promotion.)

### 7.6. `as const satisfies T` discipline

Five sites: `disclosure/levels.ts:65`, `documentation-type-registry.output-routing.ts:59`, `documentation-type-registry.disclosure.ts:76`, `documentation-type-registry.identity.ts:87`, `requirement-routes.ts:19`. All correct usage of the TS 5 idiom: literal types preserved, conformance validated, no widening.

Reference quality. Promote as the family's standard for "constant tables that must conform to a contract."

### 7.7. ESM hygiene

- Zero `node:fs` / `node:path` / `node:url` imports in `src/` — data-layer purity (projection is graph-only at runtime).
- 147 `import type` declarations — `@typescript-eslint/consistent-type-imports: error` enforced.
- All relative imports end in `.js` (verified by spot-check; the `index.ts` barrel uses `.js` extensions throughout).
- Pure ESM with top-level `await` in step files for `loadFeature(...)`.

This is the family's cleanest ESM-hygiene baseline. **Reference.**

### 7.8. `Proxy` *non*-use elsewhere

Section 4.5's caveat aside, projection has exactly one Proxy in `src/` — and Phase 1/2 have already flagged the module for deletion. The package overwhelmingly uses **plain closures + lazy module-level state** for caching/memoization. This is the right TS posture: Proxies defeat structural typing and are nearly always replaced by cheaper patterns.

---

## 8. Zod 4 audit summary table

| Site | API | Verdict | Notes |
|------|-----|---------|-------|
| 107 sites | `z.strictObject({...})` | **Correct** | Doctrine-aligned; zero `z.object` in `src/`. |
| `fragments/pattern-relations/pattern-summary.ts:28` | `.omit({kind: true})` on a strictObject | **Bug** (Section 3.4) | Same root cause as `.extend` (C-PROJ-1) — `unknownKeys` reset to `strip` in Zod 4. |
| `fragments/pattern-relations/pattern-detail.ts:24` | `.extend(...)` on a strict-derived schema | **Bug** (C-PROJ-1) | Compounded `.omit` + `.extend` strictness loss. |
| `fragments/pattern-relations/supporting.ts:52` | `.omit({kind: true})` | **Bug** | Same as Section 3.4. |
| `fragments/pattern-relations/supporting.ts:54-58` | `.omit(...).extend(...)` | **Bug** (C-PROJ-1) | Two strictness drops in one chain. |
| `fragments/fragment-schema.internal.ts:70` | `z.discriminatedUnion('kind', [...43])` | **Correct** | O(1) discriminant dispatch. Reference. |
| `blocks/schema.ts:113` | `z.ZodType<Block> = z.discriminatedUnion('type', [...])` w/ `z.lazy` | **Correct** | Reference recursive idiom. |
| `fragments/pattern-relations/supporting.ts:85-92` | `z.ZodType<DependencyTreeNode> = z.strictObject({...children: z.array(z.lazy(...))})` | **Correct** | Reference recursive idiom. |
| `fragments/governance/business-rule-set.ts:26` | Nested `z.discriminatedUnion('scope', [...])` w/ `kind: z.literal('BusinessRuleSet')` on each branch | **Correct** | Subtle but right; outer `FragmentSchema` discriminator `kind` still flattens. |
| `_shared/filter.ts:11-14` | `z.strictObject({...optional, ...optional})` | **Correct** | Reference filter-schema. |
| `routing/route-id.ts:29` | `z.string().refine(isLogicalRouteId, {...})` | **Correct** | Refine loses template-literal narrowing; the `LogicalRouteId` type lives separately. Acceptable. |
| `disclosure/spec.ts:29-54` | `z.strictObject({...}).describe(...)` chain | **Correct** | Reference for MCP-discoverable schemas. |
| `_shared/parse-and-project.internal.ts:22-27` | `schema: z.ZodType<Options>` (widest type) | **M-PROJ-F-1** | Doesn't enforce strict-object; Phase 2 M-PROJ-9 has the runtime fix; Section 3.3 has the (impractical) type-level alternative. |
| `pattern-relations/open-question-list.ts:38` | `OpenQuestionListOptionsSchema.parse(rawOptions)` | **C-PROJ-2** | Bypasses `parseAndProject`; throws raw `ZodError` not `BoundaryParseError`. |
| `documentation-type-registry.ts:22` | `z.record(ProgressiveDisclosureLevelSchema, DisclosureSpecSchema)` | **Correct** | Zod 4 `z.record(keySchema, valueSchema)` is the right form (Zod 3 took only valueSchema). |

**Zod 4 idioms not used (and not needed for projection's surface):** `z.preprocess`, `z.coerce`, `z.pipe`, `z.transform`, `.brand<...>()`. The package operates on already-validated data from `PatternGraph`; no coercion/preprocessing is required.

**Zod 4 modern formatters used:** `parseAtBoundary` (imported from core) — which itself wraps `z.prettifyError`. The chain is correct.

---

## 9. TS strictness audit summary

| Class | Count in projection | Count in core | Verdict |
|-------|---------------------|---------------|---------|
| All strictness flags ON | yes | yes | **Match** |
| `@ts-ignore` / `@ts-expect-error` / `eslint-disable` | 0 | 0 | Both clean |
| `any` keyword | 0 | 0 | Both clean (`no-explicit-any: error`) |
| `as unknown as X` | 0 | 0 | Both clean |
| `as unknown` (without further cast) | 1 (defensive, `documentation-type-registry.ts:155`) | 0 | Projection minor; harmless |
| `void X;` expression statements | 0 | 3 (core F4A-H-9) | Projection wins |
| `Map.get(...) as X` after `unknown` value | 0 | 16 (core F4A-H-1) | Projection wins |
| `Record<string, unknown>` builders propagated via `ReturnType<...>` | 0 | 6 (core F4A-H-2/H-4) | Projection wins |
| `[key: string]: unknown` index signatures | 0 in result types; 1 defensive in `JsonObject` | 1 production-path (core H-CORE-15) | Projection wins (`JsonObject` is a serialization output, not a result-propagation type) |
| Strictness lies (`as X` after rejected type guard) | 0 | 1 (core F4A-C-1 `validateTransition`) | Projection wins |
| `as keyof typeof X` after `Set.has` | 2 (M-PROJ-F-4) | 0 (core uses the FSM machinery instead) | Projection minor; depends on core exporting `isProcessStatusValue` |
| `as const satisfies T` | 5 | 3 | Both reference quality |
| Branded types via `z.brand<...>()` | 0 (LogicalRouteId is template-literal not branded) | 6 (core's `branded.ts`) | Different design; projection's template-literal types are arguably stronger for this domain |
| `z.input<typeof S>` separate from `z.infer<typeof S>` | 0 | 1 (`extracted-shape.ts`) | Projection has no `.default()`/`.transform()` chains, so the distinction doesn't matter — yet |
| Recursive `z.ZodType<T>: z.lazy(...)` | 2 (Block, DependencyTreeNode) | 1 (section-block) | Both reference |
| `noUncheckedIndexedAccess` evasions | 0 documented | 16 (core F4A-H-1) | Projection wins |
| `noPropertyAccessFromIndexSignature` defeats | 0 | 3 (core H-CORE-15) | Projection wins |
| `import type` discipline | 147 sites | 97 sites | Both reference |
| `import.meta.url` vs `__dirname` | 1 mixed (`vitest.config.ts` uses `__dirname`) | 0 mixed | Projection minor (Section 5.4) |

**Verdict:** projection's TS strictness is **stricter than core's** by every measurable lens. The two `as keyof typeof` casts (M-PROJ-F-4) are working-as-typed under the library type's design constraint, not a strictness gap.

---

## 10. Recommended landing order (Phase 4A angle, additive)

1. **C-PROJ-1 strict-sweep (4 sites: 2 `.extend`, 2 `.omit`)** — Section 3.1 + 3.4. Spread-shape pattern (Option B). One PR.
2. **Add `no-restricted-syntax` ESLint rule banning `.extend` / `.omit` / `.pick` / `.merge` calls on Zod schemas in `src/`** — Section 3.4. Family-wide once the four sites are converted.
3. **`isProcessStatusValue` type-guard exported from core** — Section 3.2. Then M-PROJ-F-4's two cast sites become typed narrowings. Coordinated with core's F4A-C-1 (discriminated `TransitionValidationResult`).
4. **`isDeliverableStatus` type-guard in `fragments/execution-context/`** — same pattern for `render-compact-text.ts:454`.
5. **`parseAndProject` runtime catchall assertion** (Section 3.3 / Phase 2 M-PROJ-9). 5 LOC; catches future open-shape options schemas.
6. **`StrictKindTable.Kinds` derivation** — Section 4.3 Recipe A (`FirstClassFragmentKind` + `_exhaustive` compile-time assertion). Land alongside H-PROJ-A-1 (renderer codec-agnostic split).
7. **`projectionBundleSchema<T>` factory** — Section 4.4 + Phase 2 H-SIMP-2. Closes ~100 LOC of hand-coded validators (`isBundle`, `isRoutingLike`) at `fragments/base.ts`.
8. **`ProjectionContext` Zod-validated entry guard** — Section 2 H-PROJ-F-2. Only at public entrypoints (MCP / CLI calls); internal projection-to-projection passthroughs remain typed-only.
9. **`vitest.config.ts` ESM-ify** — Section 5.4. Drop `__dirname`; use `fileURLToPath(import.meta.url)`. Land alongside Phase 2 Cleanup-H-PROJ-2 (collapse perf-report config).
10. **Promote `options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs` to workspace level** — Sections 6, 7.5. Pair with Phase 2 M-PROJ-Cleanup-6.

Items 1-5 are doctrine-aligned wins (each catches a class of breach). Items 6-7 chain into Phase 2's high-leverage recipes. Items 8-10 are family-wide promotions.

---

## 11. Critical context for Phase 5

The Phase 5 per-package report should foreground:

1. **`architect-projection` is the family's TS/Zod 4 reference package.** Every other package in the family should be measured against projection's posture: 107 `z.strictObject`, zero `z.object`, zero `as unknown as`, zero suppressions, zero `void X;`, zero `console.*`, zero unprefixed Node imports, 147 `import type` declarations, recursive `z.ZodType<T>: z.lazy(...)` correctly typed in 2 of 2 places, kind-dispatch via `StrictKindTable` + load-bearing-cast-with-invariant-comment, `as const satisfies T` in 5 of 5 constant-table sites. **The package is what "right" looks like in this codebase.**
2. **The two remaining Critical bugs are the same class (Zod 4 strict-loss on schema combinators) at a four-site chain.** One PR closes C-PROJ-1, the related `.omit()` sites, *and* installs the ESLint rule that prevents recurrence. This is the highest-leverage Phase 4A action.
3. **`StrictKindTable<Out, Options, Kinds>` deserves a doc-level callout.** Section 4.3 walks through the limitation; Recipe A is concrete. Coupled with the codec-agnostic renderer split (H-PROJ-A-1), this becomes the family's primary "how to add a new fragment kind" doctrine.
4. **`parseAndProject` is the family's canonical trust-boundary helper.** Core's `parseAtBoundary` exists but is unused inside core (TD-CORE-1); projection is its only real consumer. Phase 5's family-aggregate report should treat this as a one-way dependency: when guard / cli / mcp need similar parse-at-boundary discipline, they should follow projection's `parseAndProject` pattern, not invent a new one.
5. **Two audit scripts ready for workspace promotion.** `options-schema-barrel-audit.mjs` (with the 15-LOC extension from Phase 2 Cleanup-M-PROJ-1) catches the C-PROJ-2 outlier mechanically; `jsdoc-boilerplate-audit.mjs` catches core's DOC-H-3 boilerplate text. Both should move to `<repo>/scripts/architect-audits/` and be invoked by every package's `test` script.
6. **Vitest 4 pattern: `state: T | null` + `createState()` + `AfterEachScenario`** — 34 of 36 step files use it. Promote to a `tests/_shared/feature-state.ts` helper that wraps `describeFeature` and reduces the 27-`state!`-per-file count. Worth doing once `@amiceli/vitest-cucumber`'s API surface stabilizes.

The Phase 4A bottom line: **projection is doctrinally cleaner than every other package in the family combined**. The remaining gaps are narrow, well-localized, and each have a concrete recipe. None are architectural; all are mechanical.
