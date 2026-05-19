# `@libar-dev/architect-cli` — Architecture Review

Scope: `packages/architect-cli/src/**` (26 TS files, ~3,850 LOC). Reviewed
against PDR-001, ADR-005, ADR-006, ADR-009, and the engineering doctrine in
`CLAUDE.md` (no-BC, Zod-first, strict TS, thin composition root).

Headline: the package is in good architectural shape against the
thin-composition-root mandate — the `lint-*` / `validate-*` bins are 5-LOC
shims into `architect-guard`, no direct `architect-core/src/scanner/` or
`/extractor/` imports leak in, and the typed `ParsedArgs` flows through a
single Zod-validated boundary in `pattern-graph-cli.ts`. The findings below
target the durable infrastructure that has settled into CLI files instead of
its rightful package, and a small number of ADR-009 boundary discipline slips.

---

## CRITICAL

### C1. Bundle envelope splice does `JSON.parse(JSON.stringify(...))` to avoid double-encoding — violates output-discipline / ADR-005

- **Severity**: Critical.
- **Architectural impact / ADR**: ADR-005 (codec / renderer separation) — the
  CLI is supposed to invoke renderers, not reach around them. The current
  shape couples `writeJson` to the JSON codec via a round-trip.
- **File:line**:
  `packages/architect-cli/src/cli/commands/_shared/output.ts:44–51` (and the
  `renderEnvelopeWithBundleData` callsite at lines 86–95).
- The code path: `executeArchCommand` / `executeQueryMethod` returns a
  `ProjectionBundle` as the envelope's `data` field;
  `createEnvelope(...)` then wraps it in `{ success, data, metadata }`. To
  render the inner bundle through the projection's pretty JSON renderer and
  embed it inside the envelope, the CLI does
  `JSON.parse(renderPrettyJson(envelope.data))` and spreads it back. That
  is the codepath the brief calls out as forbidden ("no codepath that
  `JSON.stringify`s a string"). It is a real correctness concern as well:
  any non-JSON-safe value the renderer might one day emit (BigInt, NaN,
  cyclic stub) becomes a runtime bomb at the round-trip boundary.
- **Recommended improvement**: Have `renderJson(bundle, { pretty: true })`
  optionally return the **JSON-serializable value tree** rather than the
  string. Then `writeJson(envelope)` can `JSON.stringify` once over the
  whole envelope. Equivalently: hoist envelope construction inside the
  renderer (codec-aware) and have the CLI just `process.stdout.write` the
  result. Either way the round-trip disappears.
- **Trade-offs**: Adding an "as value" mode to the renderer touches
  `architect-projection`'s public surface — but `renderJson(..., { pretty })`
  already has two return shapes (string vs split map), so a third (value
  tree) is a small extension. Net-negative LOC in CLI.

---

## HIGH

### H1. The CLI hosts a complete file-cache infrastructure that belongs in `architect-core`

- **Severity**: High.
- **Architectural impact / ADR**: ADR-006 (single read model) — `buildCliContext`
  is the only caller that benefits from the cache; the MCP server builds
  its own `PatternGraph` and would benefit from the same cache. Embedding
  it in the CLI forces a thin-composition-root package to own durable,
  cross-consumer infrastructure.
- **File:line**:
  `packages/architect-cli/src/cli/pattern-graph-cli-runtime.ts:103–142`
  (CACHE_DIRECTORY, `getCacheFilePath`, `computeSourceSignature`,
  `readCacheRecord`, `writeCacheRecord`, `CacheRecordSchema`).
- About 40 LOC of sha1-keyed mtime-based cache logic, plus `CacheRecordSchema`
  in `pattern-graph-cli-types.ts:39–46`, plus `cache` metadata threading
  through `CliContext`. The cache is real infrastructure: it has a schema,
  on-disk representation, signature algorithm, eviction policy (overwrite-
  on-mismatch). All four belong on the producer of the artefact being
  cached — `buildPatternGraph` in `architect-core`.
- **Recommended improvement**: Move the cache to `architect-core` as a
  decorator over `buildPatternGraph` (e.g. `buildPatternGraphCached`) that
  takes an opt-in cache options bag. CLI keeps the `--no-cache` flag and
  passes it through; `cacheMetadata` becomes part of `BuildResult`.
- **Trade-offs**: Adds a public option surface in core. Worth it: MCP gets
  the same warm-cache wins, the on-disk format becomes a single
  cross-consumer contract, and `pattern-graph-cli-runtime.ts` shrinks back
  toward a real composition root.

### H2. `generate-docs.ts` mutates global `process.cwd` to load the project config

- **Severity**: High.
- **Architectural impact / ADR**: ADR-006 boundary discipline; matches the
  exact concern fixed in commit `676a916 fix(mcp): remove global cwd
  mutation`. The CLI is supposed to be a composition root, not a process-
  state mutator.
- **File:line**:
  `packages/architect-cli/src/cli/generate-docs.ts:172–181` (`withWorkingDirectory`),
  called at lines 194 and 203 inside `loadGenerationConfig`.
- The mutation is technically safe under serial execution (try/finally
  restores `previousCwd`), but it's a global, racey side-effect: any
  concurrent `await` inside the operation sees a temporarily wrong cwd,
  and the docs pipeline's parallel `Promise.all` later in the same `main`
  shows the package is moving toward concurrency.
- **Recommended improvement**: Have `findConfigFile` / `loadProjectConfig`
  / `resolveProjectConfig` accept an explicit `cwd` argument (or already
  resolve everything against `baseDir`). Then drop `withWorkingDirectory`
  entirely. If a transitive `import` truly needs cwd-relative resolution,
  the call site that imports the config module is the only legitimate
  place — and it can use `pathToFileURL(configPath)` (already imported on
  line 5) directly.
- **Trade-offs**: Touches `architect-core`'s `loadProjectConfig` /
  `resolveProjectConfig` signatures, which makes this a no-BC ripple. The
  ripple is bounded and worth taking.

### H3. `parseDisclosureLevel` / `parseFilterValue` / `mergeProjectionFilter` are duplicated between `generate-docs.ts` and `commands/read.ts`

- **Severity**: High.
- **Architectural impact / ADR**: PDR-001 DD-7 / thin composition root — the
  CLI is supposed to share formatter / parser helpers, not duplicate them.
- **File:line**:
  `generate-docs.ts:136–170` vs `commands/read.ts:62–99` — same shape,
  slightly different error wrapping. `splitGeneratorValue`
  (`generate-docs.ts:129–134`) is the same "comma-list parser" shape as
  `parseBundleIncludeValues` (`_shared/schemas.ts:167–181`).
- Net cost is small (~50 LOC), but each duplication is a divergence risk
  for a public CLI surface: `--filter status=...` and `--disclosure ...`
  must mean exactly the same thing in `architect` and `architect-generate`.
- **Recommended improvement**: Move all three into
  `commands/_shared/projection-options.ts` (already exists for related
  helpers). Generate-docs imports them.
- **Trade-offs**: None. Pure consolidation.

### H4. `pattern-graph-cli-runtime.ts` and `generate-docs.ts` each carry their own `resolveSourcePlan` / config-load / source-glob logic

- **Severity**: High.
- **Architectural impact / ADR**: ADR-006 (single read model). Both files
  bridge `(args, workspaceSources, projectConfig)` into a pipeline input.
  They duplicate the "workspace sources vs config sources vs CLI overrides"
  precedence rules.
- **File:line**:
  `pattern-graph-cli-runtime.ts:34–81` (`resolveSourcePlan`) vs
  `generate-docs.ts:183–213` (`isWorkspaceConfigFallbackTarget` +
  `loadGenerationConfig`) + the `effectiveConfig` derivation at lines
  538–550. The precedence rules diverge today: `resolveSourcePlan` falls
  back to `WORKSPACE_TAG_REGISTRY` when no config; `loadGenerationConfig`
  returns `createDefaultResolvedConfig()`.
- **Recommended improvement**: Lift the source-plan resolution into
  `architect-core` as a typed `resolveSourcePlan({ baseDir, cliInput,
  cliFeatures })` that both bins consume. Returns a single
  `ResolvedSourcePlan` with deterministic precedence.
- **Trade-offs**: Adds a public-surface contract in core. Pays off the
  next time anyone touches "where does my config / source list come from?"
  and forces the two bins into a single answer.

### H5. `documentation` command uses the boundary entrypoint `parseAndProjectDocumentationBundle` despite already having typed options

- **Severity**: High.
- **Architectural impact / ADR**: ADR-009 (projection trust boundary) — the
  rule is: `parseAndProject*` for raw options at the trust boundary, typed
  `project*` for internal composition.
- **File:line**:
  `commands/read.ts:167–176`. The `documentType` here is a `string` from
  `requireFirstPositional`, so technically a boundary value — but
  `flags.disclosure` is already a typed `ProgressiveDisclosureLevel`
  (parsed by `parseDisclosureLevel` at the flag-parser layer). The same
  pattern in `generate-docs.ts:431–441` calls the boundary entrypoint
  inside `buildDocumentationProjection` after `disclosureLevel` is already
  typed and `documentType` is validated against `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY`
  at lines 443–455. That second case is a clean re-parse violation.
- **Recommended improvement**: Promote `documentType` to a Zod-validated
  enum at the flag-parse layer (use `SupportedDocumentationTypeSchema` if
  it exists, else define it in `_shared/schemas.ts`). Then both call sites
  use the typed `projectDocumentationBundle` instead of
  `parseAndProjectDocumentationBundle`. The `getProjectionGeneratorMetadata`
  lookup at `generate-docs.ts:443` becomes a single typed-key access.
- **Trade-offs**: Adds one more Zod schema at the CLI boundary; removes a
  re-parse round-trip and a redundant lookup.

---

## MEDIUM

### M1. CLI re-runs `findPatternParseFailure` after `PatternGraphAPI.getPattern` already consulted it

- **Severity**: Medium.
- **Architectural impact / ADR**: ADR-006 (single read model). The API is
  meant to be the read surface; the CLI shouldn't peek behind it.
- **File:line**:
  `commands/read.ts:117–123` calls `findPatternParseFailure(cliContext.graph, pattern)`
  directly after `cliContext.api.getPattern(pattern)` returns `undefined`.
  Per `packages/architect-core/src/read-api/pattern-graph-api.ts:194`, the
  API itself uses the same helper, but its public method doesn't expose
  the result — so the CLI re-runs the lookup to recover parse provenance.
- **Recommended improvement**: Add a `PatternGraphAPI.findParseFailure(name)`
  method (or have `getPattern` return a discriminated union of
  `Found | NotFound | ParseFailed`) so the CLI never reaches past the API.
- **Trade-offs**: Public-surface ripple in `architect-core`. Worth it: it
  removes the only direct `graph` access in a command handler outside the
  runtime layer.

### M2. `error-handler.ts` carries an inline knowledge list of `DocError` discriminants

- **Severity**: Medium.
- **Architectural impact / ADR**: No-BC + Zod-first doctrine — every cross-
  package contract is a Zod schema. The current `isDocError` hand-codes a
  string array of valid `type` values (lines 73–87). If `architect-core`
  adds a new `DocError` variant, the CLI silently drops it onto the
  "generic error" path with no compile error.
- **File:line**:
  `error-handler.ts:73–89`.
- **Recommended improvement**: Export `DocErrorSchema` (or a `DocErrorTypeSchema`
  z.enum) from `architect-core` and use `.safeParse` here. Then a new
  variant either lights up the type system or is rejected at the type
  guard automatically.
- **Trade-offs**: One more public schema; cleanly closes a no-BC blind
  spot.

### M3. `pattern-graph-cli.ts` argv parser duplicates logic that `pattern-graph-cli-commands.ts` already encodes via `flagParsers`

- **Severity**: Medium.
- **Architectural impact / ADR**: Thin composition root, PDR-001 DD-6 (one
  argv shape for the suite). Global argv (`--session`, `--depth`, `--format`,
  `-b`, `-i`, `-f`) is hand-rolled in `parseArgs` at
  `pattern-graph-cli.ts:48–181`, while sub-command argv is uniformly
  driven by the `flagParsers` declarative table in
  `pattern-graph-cli-commands.ts:97–223`. Two argv parsers means two
  shapes to keep in sync.
- **Recommended improvement**: Reuse the `flagParsers` mechanism for
  global flags by introducing a `GLOBAL_FLAG_PARSERS` table, then have the
  REPL and main share one dispatch. The `remaining`-as-passthrough trick
  becomes a single rule in the parser.
- **Trade-offs**: Larger refactor; not urgent. Pay off once another global
  flag arrives.

### M4. Six bins, four composition shapes

- **Severity**: Medium.
- **Architectural impact / ADR**: Thin composition root, uniform suite
  shape. `architect-lint-patterns.ts`, `architect-lint-steps.ts`,
  `architect-lint-process.ts`, `architect-validate.ts` are 5-LOC shims
  into `architect-guard`. `architect.ts` (`pattern-graph-cli.ts`) and
  `architect-generate.ts` (`generate-docs.ts`) carry full argv parsing +
  error handling + version flags + help printing each, separately.
- **File:line**: `cli/generate-docs.ts` (662 LOC) vs `cli/pattern-graph-cli.ts`
  (275 LOC) — they share argv shape concerns (`--help`, `--version`,
  `--base-dir`, `-i/--input`) but no code.
- **Recommended improvement**: Extract a `createBin({ name, parseArgs,
  printHelp, run })` helper in `_shared/` so both bins share the
  `try { ... } catch (e) { handleCliError(e, ...) }` outer shell, version
  / help short-circuits, and `process.argv.slice(2)` parsing. Net LOC
  shrink + consistent UX.
- **Trade-offs**: A new abstraction layer; size-justified because the
  fifth bin (whenever it arrives — `architect-mcp`?) will repeat the
  pattern for a third time.

### M5. `error-handler.ts` is the central exit-code mapper but `structured.ts:227` sets `process.exitCode = 1` out-of-band

- **Severity**: Medium.
- **Architectural impact / ADR**: PDR-001 DD-4 (three severity levels) — exit
  codes should flow through one place. Today `executeDanglingCommand`
  flips `process.exitCode = 1` on drift before returning, then `writeJson`
  emits the envelope, then `main` returns normally — the global exit code
  carries the verdict. It's a working pattern but it scatters exit-code
  decisions: `pattern-graph-cli.ts:238` uses `process.exit(1)`,
  `error-handler.ts` uses `exitWithErrorMessage` / `exitWithProcessError`,
  `structured.ts:227` uses `process.exitCode`.
- **File:line**:
  `_shared/structured.ts:226–228`.
- **Recommended improvement**: Have the `DanglingBaselineResponse` carry
  the verdict typed, and let a single caller in `pattern-graph-cli.ts`
  apply the exit code uniformly (the way `handleCliError` does for the
  throw path). Or: route drift detection through `handleCliError` with a
  dedicated `DriftError` discriminant.
- **Trade-offs**: Small refactor; closes the "exit-code policy is one
  function" invariant.

### M6. `pattern-graph-cli-runtime.ts` builds `createCliProjectionContext` separately for taxonomy and for the main pipeline

- **Severity**: Medium.
- **Architectural impact / ADR**: ADR-006 / ADR-009 — `projection-context.ts`
  is meant to be thin glue. The two-entrypoint shape
  (`createCliProjectionContext` + `createCliTaxonomyProjectionContext`,
  see `projection-context.ts:18–55`) exists because the `taxonomy`
  command runs without a `buildPatternGraph` call (`requiresCliContext:
  false`) and synthesizes an empty `PatternGraph`. That synthesis lives
  in the CLI and conflates "empty graph" with "graph not yet built".
- **File:line**:
  `projection-context.ts:33–55` (`createCliTaxonomyProjectionContext`,
  with the `PatternGraphSchema.parse(graph)` self-validation), and
  `pattern-graph-cli-runtime.ts:144–169`.
- **Recommended improvement**: Either let `taxonomy` go through the
  normal pipeline (one extra `buildPatternGraph` call) and remove the
  synthetic-empty path entirely, or move "empty `ProjectionContext` from a
  `TagRegistry` alone" into `architect-projection` as a named factory.
  Avoid reconstructing context shapes in the CLI.
- **Trade-offs**: Either choice is small. Synth path costs one extra parse
  per `taxonomy` invocation; factory move keeps current perf.

---

## LOW

### L1. `pattern-graph-cli-commands.ts:`  `COMMAND_NAMES` array, `CommandNameSchema`, and `COMMANDS` record are kept in sync by hand

- **Severity**: Low.
- **Architectural impact / ADR**: Zod-first doctrine — types should flow
  from schemas, not parallel literal lists.
- **File:line**:
  `pattern-graph-cli-commands.ts:16–41` (`COMMAND_NAMES`) vs lines 97–103
  (`COMMANDS` constructed from five `*commands` modules) vs line 94
  (`CommandNameSchema = z.enum(COMMAND_NAMES)`). A command added to
  `*commands` but missed from `COMMAND_NAMES` is a runtime error, not a
  type error.
- **Recommended improvement**: Derive `COMMAND_NAMES` from
  `Object.keys(COMMANDS)` typed as `keyof typeof COMMANDS`. Or generate
  the array from the union of the per-family `satisfies Pick<...>`
  groups.
- **Trade-offs**: Minor; tightens the schema-first invariant.

### L2. `generated-docs-manifest.ts` carries hand-rolled type guards instead of Zod schemas

- **Severity**: Low.
- **Architectural impact / ADR**: Zod-first boundaries — the manifest is a
  trust boundary (read from disk, written to disk).
- **File:line**:
  `generated-docs-manifest.ts:157–191` (`isGeneratedDocsManifest`,
  `isGeneratorManifest`, `isManifestEntry`, `isRecord`).
- **Recommended improvement**: Define `GeneratedDocsManifestSchema =
  z.strictObject({ ... })` once, then `type GeneratedDocsManifest =
  z.output<typeof GeneratedDocsManifestSchema>`. The read path becomes
  `safeParse(JSON.parse(raw))`; the write path stays as-is.
- **Trade-offs**: ~30 LOC saved, removes parallel type-vs-guard drift.

### L3. `printVersion` and `getPackageVersion` overlap

- **Severity**: Low.
- **Architectural impact / ADR**: Thin composition root.
- **File:line**:
  `version.ts:32–57` (full helper module) vs `_shared/help.ts:64–67`
  (inline `printVersion`) vs `generate-docs.ts:343–346`
  (inline `printVersion`). Three separate version printers all reading
  the same package metadata.
- **Recommended improvement**: Single `printVersionFor(binName)` in
  `version.ts`, callers pass their bin name.
- **Trade-offs**: None.

---

## Cross-cutting architectural themes

1. **The CLI has accreted infrastructure that should sit in core.** Two
   sizeable lumps — the file-cache layer (H1) and the source-plan / config
   resolver (H4) — are real durable infrastructure that the MCP server
   would also benefit from. Moving them shrinks the CLI back toward a
   composition root and gives `architect-core` a coherent "session
   bootstrap" surface. The dogfood signal is strong: the lint/validate
   bins are clean 5-LOC shims precisely because `architect-guard`
   exposes a `run<X>Cli` runner — the same shape would work for
   `runArchitectQuery({ args, cache, sources })`.

2. **`generate-docs.ts` (662 LOC) is the package's outlier.** It carries
   its own argv parser (M3), its own config loader with cwd mutation
   (H2), its own duplicated filter / disclosure parsers (H3), its own
   version / help printers (L3), and its own three-phase render / write /
   manifest pipeline. None of those concerns is intrinsic to docs
   generation. A `_shared/bin.ts` (M4) plus the H1/H2/H4/H5 moves would
   probably halve this file.

3. **ADR-009 boundary discipline is mostly clean, but the `documentation`
   path leaks** (H5, M1). The pattern is otherwise tight: command
   handlers receive typed `parsed.flags`, schemas in
   `_shared/schemas.ts` enforce one Zod parse per CLI input, and
   `projectionContext` is built once per session. The `documentation`
   verb and the `pattern <Name>` parse-failure peek are the two
   meaningful exceptions worth fixing.

4. **No `architect-core/src/...` reach-throughs.** Verified by grep — the
   CLI consumes only the package-level entrypoints of `architect-core`,
   `architect-guard`, and `architect-projection`. The ADR-006 carve-out
   list isn't violated. The lint / validate bins (5 LOC each) are the
   gold standard the rest of the package should converge toward.

5. **Output discipline is sound except for C1.** Text vs JSON paths are
   separated (`writeProjectionOutput` keys on `args.format`), the
   compact-text and pretty-JSON renderers are invoked once each, and the
   `{success, data, metadata}` envelope is centralised in `createEnvelope`.
   The one round-trip in `renderEnvelopeWithBundleData` is both the
   biggest correctness risk and the cheapest fix in the package.

6. **No-BC / pre-1.0 hygiene is high.** No `// eslint-disable*`,
   no `@ts-ignore`, no `@deprecated` markers, no parallel-implementation
   flags. Zod schemas use `.strictObject(...)` consistently in
   `_shared/schemas.ts`. Type-only imports use `import type` per
   `verbatimModuleSyntax`. The doctrine layer is healthy; the structural
   findings above are about where infrastructure lives, not about
   discipline slips.
