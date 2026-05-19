# architect-mcp — Simplification Review

Review-only pass. Findings grouped by impact. Snippets are illustrative — line numbers anchor the current pattern in source.

---

## High impact

### H1. Collapse 21 per-tool `defineToolHandler` entries into a data-driven table

- **Impact**: ~270 LOC removed from `tool-registry.ts`. Each new tool today writes ~15 LOC of boilerplate (handler arrow + projection call). A declarative table reduces that to one or two lines per tool.
- **File**: `packages/architect-mcp/src/tool-registry.ts:360-632` (the `TOOL_HANDLERS` map)
- **Current pattern**: every entry has the same wrapper shape — strict-object schema, destructure input, build `ProjectionContext`, call a `project*` function, render. Variation is in three orthogonal axes only: (a) the input shape, (b) the projection function, (c) text vs JSON rendering. Example of the boilerplate density (lines 461-464):

  ```ts
  architect_pattern: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ name: PatternNameSchema }),
    handle: ({ name }, session) =>
      renderJsonToolResult(projectPatternDetail(getProjectionContext(session), name)),
  }),
  ```

  Twelve more entries follow the same `name-only` / `name + optional opts` shape with no real divergence.

- **Simplified pattern**: a small declarative builder per shape family. Three families cover 17 of 21 tools:

  ```ts
  // (a) zero-arg, text-rendered
  const ZERO_ARG_TEXT = {
    architect_overview: projectOverviewDigest,
  } as const;

  // (b) zero-arg, json-rendered
  const ZERO_ARG_JSON = {
    architect_coverage: projectAnnotationCoverage,
    architect_status: projectStatusDistribution,
  } as const;

  // (c) name-only, json-rendered
  const NAME_JSON = {
    architect_pattern: projectPatternDetail,
    architect_arch_neighborhood: projectArchitectureNeighborhood,
  } as const;

  function expandFamily<F extends Record<string, (ctx: ProjectionContext) => ProjectionBundle<Fragment>>>(
    table: F,
    render: typeof renderTextToolResult | typeof renderJsonToolResult,
  ): Record<keyof F, ToolHandler> { /* ... */ }
  ```

  Leave the 4 truly bespoke handlers (`architect_rules`, `architect_search`, `architect_help`, `architect_arch_blocking`, `architect_rebuild`) as explicit entries. Keep `defineToolHandler` as the escape hatch.

- **Behavior preservation**: identical — the projection call, render function, and schema for each tool are all preserved verbatim; they just route through the family table.
- **Verification**: existing `architect-mcp-integration.feature.steps.ts` exercises every tool by name through `invokeTool` and the registered handler; both go through the same `TOOL_HANDLERS` map.

---

### H2. Merge `tool-input-schemas.ts` + `tool-metadata.ts` + tool wiring into per-tool entries

- **Impact**: ~220 LOC total saved across three files; eliminates the indirection where every tool's description, schema, and handler live in three different files.
- **Files**:
  - `packages/architect-mcp/src/tool-input-schemas.ts:32-101` (15 separate `*Shape` exports, only used by `tool-registry.ts`)
  - `packages/architect-mcp/src/tool-metadata.ts:1-104` (description map and help builder)
  - `packages/architect-mcp/src/tool-registry.ts:360-632` (consumer)
- **Current pattern**: to read or modify `architect_bundle` you read three files — schema shape, description, handler.

  ```ts
  // tool-input-schemas.ts
  export const BundleOptionsShape = bundleOptionsShape;
  // tool-metadata.ts
  { name: 'architect_bundle', description: 'Composite root-plus-immediate-member ...' },
  // tool-registry.ts
  architect_bundle: defineToolHandler({
    inputSchema: createStrictReadonlyObjectSchema({ name: PatternNameSchema, ...BundleOptionsShape }),
    handle: ({ name, mode, include, estimateTokens }, session) => ...,
  }),
  ```

- **Simplified pattern**: one entry per tool in `tool-registry.ts` carrying name + description + schema + handler. The shape primitives in `tool-input-schemas.ts` are used in exactly one place — inline them at the call site (they are tiny one-liners). Move description string next to the handler.

  ```ts
  architect_bundle: defineToolHandler({
    description: 'Composite root-plus-immediate-member bundle...',
    inputSchema: z.strictObject({
      name: PatternNameSchema,
      ...bundleOptionsShape,
      // (or just write the 3 optional fields inline)
    }).readonly(),
    handle: ({ name, mode, include, estimateTokens }, session) => ...,
  }),
  ```

  Drop `tool-metadata.ts` entirely. `ARCHITECT_MCP_TOOLS`, `REGISTERED_TOOL_NAMES`, `getToolDescription`, `TOOL_METADATA_BY_NAME`, `MCP_SERVER_INSTRUCTIONS`, `buildToolHelpText` all derive trivially from a single source-of-truth map.

- **Behavior preservation**: same names, same descriptions, same schemas. `buildToolHelpText` is only used in tests; produce it via `Object.entries(TOOL_HANDLERS).map(...)` if needed.
- **Verification**: test step file imports `buildToolHelpText`, `REGISTERED_TOOL_NAMES`, and per-tool names — all derivable from the single map.

---

### H3. `parseServerCliArgs` re-validates objects this code just constructed

- **Impact**: ~25 LOC removed; eliminates a Zod schema that adds no boundary trust.
- **File**: `packages/architect-mcp/src/server.ts:52-78`, called from lines 89, 96, 143
- **Current pattern**: `parseCliArgs` builds a typed object literal field-by-field, then hands it to `parseServerCliArgs`, which Zod-parses it.

  ```ts
  const SessionOptionsSchema = z.strictObject({ /* ... */ }).readonly();
  const ParsedCliArgsSchema = z.discriminatedUnion('mode', [ /* ... */ ]);

  function parseServerCliArgs(rawArgs: ParsedCliArgs): ParsedCliArgs {
    const parsed = ParsedCliArgsSchema.safeParse(rawArgs);
    if (parsed.success) return parsed.data;
    throw new Error(formatZodError(parsed.error, '...'));
  }
  ```

- **Simplified pattern**: drop both schemas and `parseServerCliArgs`. The trust boundary is the raw `argv` string parsing loop — that already enforces shape (via `assertHasValue`, the switch on known flags, and `assertNoNullBytes`). The discriminated union is reconstructed from typed locals; nothing untyped enters.

  ```ts
  return {
    mode: 'serve',
    session: {
      ...(input.length > 0 ? { input } : {}),
      ...(features.length > 0 ? { features } : {}),
      ...(baseDir !== undefined ? { baseDir } : {}),
      ...(watch ? { watch: true } : {}),
    },
  };
  ```

- **Behavior preservation**: identical. The schema's "extra property" check fires only on bugs in this same file. Doctrine §"Parse once at the trust boundary" — the parse boundary is `argv`, not a literal a few lines above.
- **Verification**: typecheck + the integration step file's CLI scenarios.

---

### H4. `mergeOptions` reduces to one spread per source

- **Impact**: ~10 LOC saved; the function reads more cleanly.
- **File**: `packages/architect-mcp/src/server.ts:154-165`
- **Current pattern**: eight conditional spreads merge two `SessionOptions`:

  ```ts
  return {
    ...(session.input !== undefined ? { input: session.input } : {}),
    ...(session.features !== undefined ? { features: session.features } : {}),
    ...(session.baseDir !== undefined ? { baseDir: session.baseDir } : {}),
    ...(session.watch !== undefined ? { watch: session.watch } : {}),
    ...(options.input !== undefined ? { input: options.input } : {}),
    ...(options.features !== undefined ? { features: options.features } : {}),
    ...(options.baseDir !== undefined ? { baseDir: options.baseDir } : {}),
    ...(options.watch !== undefined ? { watch: options.watch } : {}),
  };
  ```

- **Simplified pattern**: with `exactOptionalPropertyTypes`, only the source object's defined keys appear, so a single helper handles both:

  ```ts
  function omitUndefined<T extends object>(o: T): T {
    return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
  }
  return { ...omitUndefined(session), ...omitUndefined(options) };
  ```

  Or, since each field is independent, just merge with a `??`:

  ```ts
  return omitUndefined({
    input: options.input ?? session.input,
    features: options.features ?? session.features,
    baseDir: options.baseDir ?? session.baseDir,
    watch: options.watch ?? session.watch,
  });
  ```

- **Behavior preservation**: identical merge precedence (`options` wins over `session` per-field).
- **Verification**: existing integration tests cover server-options merging.

---

### H5. `getProjectionContext` + `getSourceGlobGroups` conditional spreads

- **Impact**: ~25 LOC saved across two helpers used 21 times.
- **File**: `packages/architect-mcp/src/tool-registry.ts:176-205`
- **Current pattern**: two helpers that each conditionally spread to dodge `exactOptionalPropertyTypes`:

  ```ts
  function getProjectionContext(session: PipelineSession): ProjectionContext {
    return {
      graph: session.dataset,
      packageResolver: session.packageResolver,
      ...(session.projectMetadata !== undefined ? { projectMetadata: session.projectMetadata } : {}),
      ...(session.tagExampleOverrides !== undefined ? { tagExampleOverrides: session.tagExampleOverrides } : {}),
    };
  }
  ```

- **Simplified pattern**: single `omitUndefined` helper used everywhere conditional spreads appear in this package (also reused by H4, H6, H10, H11, H12):

  ```ts
  return omitUndefined({
    graph: session.dataset,
    packageResolver: session.packageResolver,
    projectMetadata: session.projectMetadata,
    tagExampleOverrides: session.tagExampleOverrides,
  });
  ```

  `getSourceGlobGroups` collapses the same way.

- **Behavior preservation**: identical output objects (no `undefined`-valued keys present, same key set under all conditions).
- **Verification**: schema parsing of `ProjectionContext` at downstream projection trust boundary catches any shape regression.

---

## Medium impact

### M1. Defensive guard on already-parsed input

- **Impact**: ~10 LOC removed; clearer trust boundary.
- **File**: `packages/architect-mcp/src/tool-registry.ts:223-237`
- **Current pattern**:

  ```ts
  function parseToolInput<TSchema extends z.ZodType>(toolName, schema, rawInput) {
    if (rawInput !== undefined && rawInput !== null
        && (typeof rawInput !== 'object' || Array.isArray(rawInput))) {
      throw new Error(`Invalid input for ${toolName}: expected object`);
    }
    return parseAtBoundary(schema, rawInput ?? {}, `Invalid input for ${toolName}`);
  }
  ```

  Zod's `strictObject` already rejects non-objects, arrays, and unknown keys with a precise error. The hand-rolled guard is redundant.

- **Simplified pattern**:

  ```ts
  function parseToolInput<TSchema extends z.ZodType>(toolName, schema, rawInput) {
    return parseAtBoundary(schema, rawInput ?? {}, `Invalid input for ${toolName}`);
  }
  ```

- **Behavior preservation**: Zod returns a structured `ZodError` for non-object input rather than the hand-rolled string. The integration tests that assert "invokeTool throws a validation error" remain green because they assert on the *fact* of throw, not the message text — confirm by spot-check of any `invokeTool` test expectation in `architect-mcp-integration.feature.steps.ts`.
- **Verification**: integration step file's "rejects an unknown input key" / "Invalid input" scenarios. If a test asserts exact text, accept the slight message drift or wrap Zod's error to preserve it.

---

### M2. `describeTool` indirection is one-line passthrough

- **Impact**: ~3 LOC; small but easy.
- **File**: `packages/architect-mcp/src/tool-registry.ts:211-213`, used line 655
- **Current pattern**:

  ```ts
  function describeTool(name: RegisteredToolName): string {
    return getToolDescription(name);
  }
  ```

- **Simplified pattern**: call `getToolDescription(name)` directly at line 655, drop the wrapper. If H2 lands, this collapses with `tool-metadata.ts` anyway.
- **Behavior preservation**: identical.
- **Verification**: `pnpm typecheck`.

---

### M3. `getRequestedSessionType` is one default-value resolution

- **Impact**: ~3 LOC; clarity gain.
- **File**: `packages/architect-mcp/src/tool-registry.ts:207-209`, used once at line 382
- **Current pattern**:

  ```ts
  function getRequestedSessionType(value: SessionType | undefined): SessionType {
    return value ?? 'implement';
  }
  ```

- **Simplified pattern**: inline `requestedSession ?? 'implement'` at the call site.
- **Behavior preservation**: identical.

---

### M4. Two near-identical render helpers — `renderJsonToolResult` defensive runtime check

- **Impact**: ~6 LOC; removes a runtime branch that asserts a known-static invariant.
- **File**: `packages/architect-mcp/src/tool-registry.ts:162-170`
- **Current pattern**:

  ```ts
  function renderJsonToolResult<TFragment extends Fragment>(output: ProjectionBundle<TFragment>) {
    const rendered = renderJson(output, { pretty: true });
    if (typeof rendered !== 'string') {
      throw new Error('renderJson expected pretty output to return a string payload.');
    }
    return { text: rendered, output };
  }
  ```

  `renderJson` is in `@libar-dev/architect-projection`; with `pretty: true` it returns a string by contract.

- **Simplified pattern**: if the projection package's return type for `renderJson(_, { pretty: true })` is overloaded to return `string`, the guard becomes dead. If it currently returns `string | object`, fix the overload upstream (no-BC: that's the right repair) rather than re-checking here. Once the overload is typed, the function is two lines.
- **Behavior preservation**: behavior change only on the never-hit branch.
- **Verification**: type-level only.

---

### M5. `applyFallbackDefaults` mutates its argument

- **Impact**: clarity and consistency with the rest of `pipeline-session.ts` (which is otherwise immutable in style).
- **File**: `packages/architect-mcp/src/pipeline-session.ts:224-251`
- **Current pattern**: takes `{ baseDir, input: string[], features: string[] }` and mutates the arrays in place. `initialize` (line 92) calls it for its side effect, while local arrays `input` / `features` get mutated.

  ```ts
  if (!applied) {
    this.applyFallbackDefaults({ baseDir, input, features });
  }
  ```

- **Simplified pattern**: return the additions and concatenate at the call site:

  ```ts
  private computeFallbackDefaults(baseDir: string): { input: readonly string[]; features: readonly string[] } { ... }

  // initialize:
  if (!applied) {
    const fb = this.computeFallbackDefaults(baseDir);
    input.push(...fb.input);
    features.push(...fb.features);
  }
  ```

  Or, better, build `input` / `features` immutably with `flatMap` and avoid the local mutation throughout `initialize`.

- **Behavior preservation**: identical fallback logic; the only change is ownership of the array writes.
- **Verification**: pipeline-session integration scenarios.

---

### M6. `runRebuildLoop` uses `for (;;)` — readability nit

- **Impact**: minor; one-line readability.
- **File**: `packages/architect-mcp/src/pipeline-session.ts:144-157`
- **Current pattern**:

  ```ts
  for (;;) {
    const newSession = await this.buildSession(...);
    this.session = newSession;
    latestSession = newSession;
    if (!this.consumePendingRebuild()) return latestSession;
  }
  ```

- **Simplified pattern**: `do { ... } while (this.consumePendingRebuild());` — same control flow, more idiomatic.
- **Behavior preservation**: identical.

---

### M7. JSDoc rationale comment vs the code

- **Impact**: docstring deletion — ~7 LOC.
- **File**: `packages/architect-mcp/src/tool-registry.ts:353-359`
- **Current pattern**: a comment describing the difference between `registerAllTools` and `invokeTool`. The names already say what the code does; the only fact worth keeping is the *why* — that `invokeTool` returns the structured output for in-process consumers. That fact fits in the JSDoc on `invokeTool` itself.
- **Simplified pattern**: move the one-line "the desktop main process can consume the typed projection output directly" rationale to JSDoc on `invokeTool`. Drop the standalone comment.
- **Behavior preservation**: comment-only.

---

## Low impact

### L1. `isWatchedFileType` redundant `architect.config.*` checks

- **Impact**: 3 LOC; minor logic-clarity gain.
- **File**: `packages/architect-mcp/src/file-watcher.ts:33-40`
- **Current pattern**:

  ```ts
  function isWatchedFileType(filePath: string): boolean {
    return (
      filePath.endsWith('.ts') ||
      filePath.endsWith('.feature') ||
      filePath.endsWith('architect.config.ts') ||
      filePath.endsWith('architect.config.js')
    );
  }
  ```

  `architect.config.ts` already matches `.ts`. The `.js` check is the only non-redundant extra; the `.ts` line for config is dead.

- **Simplified pattern**:

  ```ts
  function isWatchedFileType(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.feature') || filePath.endsWith('.js');
  }
  ```

  Or, if the intent was to gate `.js` to config-only, keep the explicit `architect.config.js` clause and drop the redundant `.ts` one.

- **Behavior preservation**: identical.

---

### L2. `runtime-helpers.resolveMcpBaseDirArg` final fallback is unreachable

- **Impact**: 2 LOC removed; eliminates a dead branch.
- **File**: `packages/architect-mcp/src/runtime-helpers.ts:14-30`
- **Current pattern**:

  ```ts
  const candidates = [
    path.resolve(process.cwd(), value),
    path.resolve(resolveInvocationDir(), value),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0] ?? path.resolve(value);
  ```

  `candidates[0]` always exists (it's a 2-element literal). The `?? path.resolve(value)` is dead — `noUncheckedIndexedAccess` typing motivates the `??` but a `[0]!` or destructure makes it explicit.

- **Simplified pattern**:

  ```ts
  const [cwdCandidate, invocationCandidate] = [
    path.resolve(process.cwd(), value),
    path.resolve(resolveInvocationDir(), value),
  ];
  if (fs.existsSync(cwdCandidate)) return cwdCandidate;
  if (fs.existsSync(invocationCandidate)) return invocationCandidate;
  return cwdCandidate;
  ```

- **Behavior preservation**: identical.

---

### L3. Two log-message paths for `signal`/`error`

- **Impact**: small consistency win.
- **File**: `packages/architect-mcp/src/server.ts:247-252`, `packages/architect-mcp/src/file-watcher.ts:71-73`, `packages/architect-mcp/src/file-watcher.ts:114-117`
- **Current pattern**: the `error instanceof Error ? error.message : String(error)` ternary is repeated in three places. The `architect-core` package exports `formatZodError` for one error family; a tiny `formatUnknownError(e: unknown): string` would centralize the other.
- **Simplified pattern**: one helper, used in both `file-watcher.ts` log lines and any `server.ts` catch.
- **Behavior preservation**: identical messages.

---

## Cross-cutting themes

1. **Conditional-spread for optional fields is the dominant cliché** — H4, H5, M5, and parts of H1/H2 all repeat `...(x !== undefined ? { k: x } : {})`. The codebase needs a single `omitUndefined` (or `compact`) helper, applied wherever optional projection contracts cross a `strictObject` boundary. Once landed, this single utility removes ~60+ LOC across the package and a similar amount across the larger workspace.

2. **Three-file-per-tool authoring** — adding a new MCP tool currently touches `tool-input-schemas.ts`, `tool-metadata.ts`, and `tool-registry.ts`. H1+H2 collapse this to a single per-tool entry. Co-location is more important than the SoC the split was reaching for: the only shared consumers of those files are each other.

3. **Defensive checks on inputs that are already typed or already parsed** — M1 (rejects non-objects before Zod), M4 (asserts `renderJson` returns a string), H3 (re-validates an object literal the same file just built). These all violate doctrine §"Parse once at the trust boundary." The trust boundaries here are `argv` and `rawInput`; everything downstream is typed.

4. **Tiny pass-through wrappers** — `describeTool` (M2), `getRequestedSessionType` (M3), `parseServerCliArgs` (H3). Each one adds a function name without adding meaning. Inline at the call site.

5. **Comment-as-narration drift** — `tool-registry.ts:353-359` (M7), and the per-handler JSDoc on each `architect-pattern` file repeating the architect annotation block. The annotation tags + executable feature are canonical; the prose comment is a partial duplicate that can rot. Trim to one-line `## When to Use` blocks and keep the tags.

6. **`for (;;)` and array-mutating helpers** — `pipeline-session.ts` (M5, M6) reads consistently except for these two spots; both have idiomatic immutable rewrites.
