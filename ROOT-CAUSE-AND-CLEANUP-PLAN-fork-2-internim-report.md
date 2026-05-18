<task-notification>
<task-id>a54516e3689095964</task-id>
<tool-use-id>toolu_01YZCuvUiLpjYm2zQgKZEnsP</tool-use-id>
<output-file>/private/tmp/claude-501/-Users-darkomijic-dev-projects-architect/3fb42fe1-ccd1-41b9-ae07-d905b1a51a73/tasks/a54516e3689095964.output</output-file>
<status>completed</status>
<summary>Agent "Audit graph-build / read-api contract" completed</summary>
<result>I have everything needed. Producing the audit.

---

# PatternGraph Build &amp; Read-API Contract Audit

## 1. Confirmed: `PatternGraphSchema` is OPEN, hand-written interface ADDS unvalidated fields

**`packages/architect-core/src/validation-schemas/pattern-graph.ts:106-123`** — `PatternGraphSchema = z.object({...})`. Open. Plus every nested schema (`StatusGroupsSchema:42`, `ExactStatusGroupsSchema:49`, `StatusCountsSchema:57`, `PhaseGroupSchema:65`, `SourceViewsSchema:72`, `ImplementationRefSchema:79`, `RelationshipEntrySchema:85`, `ArchIndexSchema:98`) is also `z.object`, not `z.strictObject`. The doctrine in `CLAUDE.md` says: "Use `z.strictObject(...)` for closed records — never `z.object()` (which is open)."

**`pattern-graph.ts:161-179`** — hand-written `interface PatternGraph` adds **`nameIndex?: ReadonlyMap&lt;...&gt;`** (line 177). `ReadonlyMap` cannot exist in a Zod schema and is therefore invisible to validation. The read-API depends on it: `pattern-helpers.ts:77` does `source.nameIndex?.get(lower)`. The transform builds it (`transform-dataset.ts:269-273, 290`). A `PatternGraphSchema.parse(x)` would strip it (or rather, since the schema is open, would silently accept the Map but its type is `Record&lt;...&gt;`); either way the type and the schema are not the same shape.

**Other hand-written-shadows-schema instances in core:**

| Type                                                                              | Defined as `interface` (hand-written)                                                                                   | Schema                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PatternGraph`                                                                    | `validation-schemas/pattern-graph.ts:161` adds `nameIndex`                                                              | `PatternGraphSchema:106` (open)                                                                                                                                                                                                                                                       |
| `RuntimePatternGraph`                                                             | `generators/pipeline/transform-types.ts:32` extends with `workflow?`                                                    | no Zod equivalent                                                                                                                                                                                                                                                                     |
| `ExactStatusGroups` / `StatusGroups` / `SourceViews` / `PhaseGroup` / `ArchIndex` | `pattern-graph.ts:125-160` are interfaces (parallel to schemas)                                                         | corresponding `z.object` schemas, not `z.infer`                                                                                                                                                                                                                                       |
| `RoleDefinition`                                                                  | `config/role-constants.ts:3` interface                                                                                  | `RoleDefinitionSchema` `z.strictObject` in `validation-schemas/tag-registry.ts:11` — and the interface is re-aliased back at `validation-schemas/tag-registry.ts:20` (`export type RoleDefinition = ConfigRoleDefinition`), so the schema's inferred shape is intentionally discarded |
| `TagRegistry`                                                                     | `config/tag-registry-contract.ts` interface, re-exported at `tag-registry.ts:52`                                        | `TagRegistrySchema` in `tag-registry.ts:41`                                                                                                                                                                                                                                           |
| `BundleRouting`, `ProjectionBundle`                                               | `architect-projection/src/fragments/base.ts:6, 27` interfaces with custom `isRoutingLike` shape-check (`base.ts:64-77`) | no Zod schema at all                                                                                                                                                                                                                                                                  |
| `ProjectionContext`                                                               | `architect-projection/src/context/projection-context.ts:33` interface                                                   | no Zod schema                                                                                                                                                                                                                                                                         |

Every cross-package read-API contract in core is double-declared: a Zod schema (open) and a parallel `interface` (the actually consumed one). The interfaces are what TypeScript checks; the schemas are decorative.

## 2. Parse-boundary trace — only TWO real parse points

- **`transform-dataset.ts:103`** — `ExtractedPatternSchema.safeParse(pattern)` per raw pattern. This is real.
- **Other parses** of `ExtractedPatternSchema.safeParse` at `extractor/doc-extractor.ts:294`, `extractor/gherkin-extractor.ts:455, 606`. So patterns are parsed in extractor and re-parsed in transform. Double parse.
- **`PatternGraphSchema.parse` is never called on real pipeline output.** The only `PatternGraphSchema.parse` in `src/` lives at `architect-cli/src/cli/pattern-graph-cli-runtime.ts:194` — on a synthetic empty graph used as a fallback context. The other two occurrences (`tests/steps/extractor/edge-classification.steps.ts:69`, `tests/steps/read-api/pattern-graph-api.steps.ts:89`) are tests.
- **`TagRegistrySchema.parse`/`safeParse`** in core's own `src/`: **zero**. Only used in one test (`tests/steps/validation/tag-registry-schemas.steps.ts:56`).

So the read API's input is **trusted, never parsed**. The schema exists but is decorative.

## 3. `cloneTagRegistry` exists because `z.function()` lives in the registry

**`validation-schemas/tag-registry.ts:32`** — `transform: z.function().optional()`. The doctrine in `CLAUDE.md` says Zod-3-style `z.function()` is the idiom kept here. But `structuredClone` cannot copy functions.

**`read-api/pattern-graph-api.ts:81-100`** — the hand-rolled adapter:

```ts
function cloneValue&lt;T&gt;(value: T): T {
  return structuredClone(value);
}
function cloneTagRegistry(tagRegistry: PatternGraph['tagRegistry']): PatternGraph['tagRegistry'] {
  return {
    ...tagRegistry,
    roles: tagRegistry.roles.map((role) =&gt; ({ ... })),
    metadataTags: tagRegistry.metadataTags.map((tag) =&gt; ({
      ...tag,
      ...(tag.transform !== undefined ? { transform: tag.transform } : {}),  // function passed through, not cloned
    })),
    ...
  };
}
function clonePatternGraph(graph: PatternGraph): PatternGraph {
  const { tagRegistry, ...rest } = graph;
  return { ...cloneValue(rest), tagRegistry: cloneTagRegistry(tagRegistry) };
}
```

The `transform` function escapes the deep-clone by reference. This is an adapter in `pattern-graph-api.ts` built around a doctrine breach in `validation-schemas/tag-registry.ts`. `cloneValue/structuredClone` is invoked **24 times** in `pattern-graph-api.ts` (`grep -c cloneValue\|structuredClone` = 24 — not 27, but per-read it still fires multiply per call site).

## 4. FSM trust-boundary collapse

- **`validation/fsm/validator.ts:52`** — `function isValidStatusValue(...)` is non-exported. Confirmed.
- **Casts inside the FSM module:** three `as ProcessStatusValue` casts at `validator.ts:92, 93, 102` — all inside `validateTransition`'s **failure** branch, where input has already been proven invalid by `isValidStatusValue`. Plus one `as AcceptedStatusValue | undefined` at `scanner/ast-parser.ts:280`.
- **FSM tests:** zero feature files under `tests/features/` mention transitions/FSM in core (`find … -name "*fsm*"` returns nothing; no `tests/features/validation/fsm*.feature` exists). The only consumers are `architect-guard/src/lint/process-guard/decider.ts:300` and `architect-cli/src/cli/commands/_shared/structured.ts:119-125`. **Both consumers cast strings into `ProcessStatusValue` via a `parseProcessStatusValue` helper before calling validator functions** — so the FSM's only `isValidStatusValue` narrowing is fired on already-narrowed inputs at every real call site, and never tested against raw strings. Phase 3 was right: no executable specs for the FSM transition table.

## 5. `parseAtBoundary` audit inside core's own `src/`

`grep -rn "parseAtBoundary(" packages/architect-core/src/` yields **exactly one** call site:

- `utils/errors.ts:21` — `return parseAtBoundary(schema, raw, context);` (inside a generic error helper)

Core defines `parseAtBoundary` (`validation/boundary.ts:54`), exports it at the public surface (`index.ts:200`), and uses it once internally — in a util that callers must opt into. Every other "parse at boundary" in core (the `ExtractedPatternSchema.safeParse` calls in `transform-dataset.ts:103`, `doc-extractor.ts:294`, `gherkin-extractor.ts:455, 606`) calls `.safeParse` directly, bypassing the helper. The helper does not own the boundary it advertises.

## 6. The `./roles` broken export — CONFIRMED

`packages/architect-core/package.json:30-33`:

```json
"./roles": {
  "types": "./dist/roles.d.ts",
  "import": "./dist/roles.js"
}
```

- `dist/roles.{js,d.ts}` does **not** exist (`ls packages/architect-core/dist/ | grep -i role` = empty).
- `src/roles.ts` does **not** exist either.
- Workspace callers: `grep -rn "architect-core/roles"` across `packages/` and `architect/` = **zero**.

Dead export, broken target, zero consumers.

## 7. Root-cause statement

The graph-build seam fails to be one place because **the read model is described by two co-equal type sources** — a Zod schema that nothing parses against (`PatternGraphSchema`, open `z.object`) and a hand-written `interface PatternGraph` that adds a runtime-only field (`nameIndex: ReadonlyMap&lt;…&gt;`) the schema cannot express. The pipeline trusts the interface, the schema is decorative, and the read-API spends its budget on `structuredClone`/`cloneTagRegistry` defensive copying instead of validation — defensive copying it only needs because `transform: z.function()` smuggles a non-cloneable value into the trusted shape (`tag-registry.ts:32`). Downstream, FSM types narrow only at the surface (`isValidStatusValue` is private, every consumer pre-casts) and `parseAtBoundary` is exported as the doctrinal entry but used exactly once in core's own code.

**Single move that fixes it:** make `PatternGraphSchema` the only definition. Convert every `z.object` in `pattern-graph.ts` to `z.strictObject`; delete the parallel `interface PatternGraph` and replace every consumer's import with `type PatternGraph = z.infer&lt;typeof PatternGraphSchema&gt;`; move `nameIndex` and `workflow` either onto the schema (as `z.map` / a workflow sub-schema) or off the type entirely into a sibling `GraphRuntime { graph: PatternGraph; nameIndex: …; workflow?: … }` that lives inside the pipeline and is unwrapped at the read-API boundary. Either choice forces one source.

**Second move that enforces it:** make `buildPatternGraph` call `parseAtBoundary(PatternGraphSchema, runtime.graph)` exactly once before returning. That turns the read-API into a real trust boundary, kills the `cloneTagRegistry` adapter (replace `z.function()` with a registered-transform id resolved by the consumer), removes the FSM casts (parse the status at ingest, never narrow at consumption), and makes the `27×` `structuredClone` either a no-op or replaceable with `Object.freeze`.

## Files relevant to the audit (absolute)

- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/pattern-graph.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation-schemas/tag-registry.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-dataset.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/transform-types.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/generators/pipeline/build-pipeline.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-graph-api.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/read-api/pattern-helpers.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/boundary.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/validator.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/transitions.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/validation/fsm/states.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/self-hosting.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/config/role-constants.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/package-config.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/src/package/package-resolver.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-core/package.json`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/context/projection-context.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/fragments/base.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/cli/pattern-graph-cli-runtime.ts`</result>
  <usage><total_tokens>104516</total_tokens><tool_uses>64</tool_uses><duration_ms>193190</duration_ms></usage>
  </task-notification>
