# `@libar-dev/architect-cli` — Simplification Review (Read-Only)

Scope: 26 files, ~3,850 LOC in `packages/architect-cli/src/cli/**`.
Mode: review-only. No edits applied.

---

## High impact

### H1. Parallel argv parsers — `pattern-graph-cli.ts` and `generate-docs.ts` reimplement the same switch loop

- **Impact:** High — ~280 LOC of duplicated control flow; bugs fixed in one parser miss the other.
- **Files:**
  - `pattern-graph-cli.ts:48–181` (global `parseArgs`)
  - `generate-docs.ts:215–316` (separate `parseArgs`)
  - `pattern-graph-cli-commands.ts:113–198` (per-subcommand `parseCommandInput`)
- **Current pattern:** Three hand-written argv loops. Each independently re-implements:
  - `-h`/`-v` / `-b`/`-i` short/long flag fanout
  - `assertHasValue(next, arg)` / `next.startsWith('-')` "value required" guard
  - `--filter` parse + merge (identical body in two files, see H2)
  - Legacy `--category` rejection (`pattern-graph-cli.ts:146–151` + `pattern-graph-cli-commands.ts:123–125`)
- **Simplified pattern:** Lift the per-arg loop in `parseCommandInput` to a shared `parseFlagsLoop(argv, spec)` that accepts a `FlagParser` registry plus a default-value seed. Drive *both* `pattern-graph-cli` global parsing and `generate-docs` from the same registry — global flags become a `FlagParser` table identical in shape to the subcommand tables. Subcommand parsers already exist; the global parser is the outlier.
- **Behavior preservation:** Subcommand registry already encodes `kind`, `multiple`, `parse`, and `--category` rejection (`pattern-graph-cli-commands.ts:123`). Migration is a structural rename + delete.
- **Verification:** Existing CLI smoke tests + `pnpm test --filter @libar-dev/architect-cli` cover the surface.

### H2. `parseFilterValue` + `mergeProjectionFilter` duplicated verbatim across two files

- **Impact:** High — copy-paste of the same Zod-validated helper.
- **Files:**
  - `commands/read.ts:62–99`
  - `generate-docs.ts:136–170`
- **Current pattern:** Two identical implementations of `parseFilterValue` and `mergeProjectionFilter` (the second takes `(current, next)`, the first takes a `readonly ProjectionFilter[]` — the only difference is the reduce shape).
- **Simplified pattern:** Move both to `commands/_shared/projection-options.ts` (already the home for cross-command projection-option normalizers). Export one `parseFilterValue` and one `mergeProjectionFilters(filters: readonly ProjectionFilter[])`; rewrite the array reducer once.
- **Behavior preservation:** Same Zod schema, same `--filter` boundary label, same conditional-spread shape.
- **Verification:** Read-side projection tests + `architect documentation --filter status=...` smoke.

### H3. `buildBusinessRuleSetProjectionOptions` — five branches that compute the same three-field result

- **Impact:** High — readability + maintainability; this is the canonical "cascade of nearly-identical option literals" anti-pattern.
- **File:** `commands/_shared/projection-options.ts:50–106`
- **Current pattern:** Four `if (typedFlags.X !== undefined) return { scope: '…', scopeValue: typedFlags.X, onlyInvariants: … };` blocks plus a default. The combination check above (`scopeFilters.length > 1`) already proves at most one field is set.
- **Simplified pattern:** Table-driven dispatch — one ordered list of `{ flag, scope, extras }` tuples, pick the first present:
  ```ts
  const onlyInvariants = typedFlags.onlyInvariants === true;
  const scoped =
    (typedFlags.pattern   && { scope: 'feature',      scopeValue: typedFlags.pattern })   ||
    (typedFlags.productArea && { scope: 'product-area', scopeValue: typedFlags.productArea }) ||
    (typedFlags.package   && { scope: 'package',      scopeValue: typedFlags.package })   ||
    (typedFlags.feature   && { scope: 'feature',      scopeValue: typedFlags.feature, featureMatch: 'path' as const });
  return scoped ? { ...scoped, onlyInvariants } : { scope: 'all', groupedBy: 'feature', onlyInvariants };
  ```
  Or a `switch (true)` chain — either avoids the nested-ternary smell while compressing 40 LOC → ~10.
- **Behavior preservation:** Same Zod-validated `BusinessRuleSetOptions` shape; precedence order preserved.
- **Verification:** `pnpm architect:query rules --pattern X` / `--product-area Y` / `--package Z` / `--feature glob`.

### H4. `isDocError` re-implements discrimination by enumerating type strings — drifts from `DocError` union

- **Impact:** High — correctness + No-BC.
- **File:** `cli/error-handler.ts:61–90`
- **Current pattern:** Hand-maintained `knownTypes` string array. Already drifts: missing `OPEN_QUESTION_VALIDATION_ERROR` shapes if those exist; any future `DocError` variant fails the type guard silently and falls through to `exitWithProcessError` with stack noise instead of the structured formatter.
- **Simplified pattern:** Either:
  1. Export `isDocError` + a discriminator-set from `@libar-dev/architect-core` alongside the `DocError` union (single source of truth), or
  2. Inline the structural check (`typeof error === 'object' && 'type' in error && 'message' in error`) and let `formatDocError`'s exhaustive `switch` handle unknown variants with `default: return error.message`.
- **Behavior preservation:** Option 2 is strictly more correct — current code silently mis-classifies new error types.
- **Verification:** `error-handler.test.ts` if it exists; otherwise add one with a synthetic `DocError`.

### H5. `pattern-graph-cli-commands.ts` flag-table boilerplate — `kind`/`key` repetition for every boolean

- **Impact:** Medium-high — every boolean flag is 4 lines of metadata for a single bit. `read.ts` + `meta.ts` + `planning.ts` ship ~30 flag entries; ~half are boolean.
- **Files:**
  - `commands/read.ts:274–281, 298–304, 314–323` (status/role/parent/count/namesOnly)
  - `commands/meta.ts:48–60`
  - `commands/reporting.ts:130–135`
  - `commands/planning.ts:32–42, 69–83`
- **Current pattern:**
  ```ts
  '--count': { kind: 'boolean', key: 'count' },
  '--names-only': { kind: 'boolean', key: 'namesOnly' },
  ```
- **Simplified pattern:** Add a `flagRegistry()` builder in `_shared/runtime.ts`:
  ```ts
  const f = flagRegistry()
    .bool('--count', 'count')
    .bool('--names-only', 'namesOnly')
    .value('--status', 'status', parseAcceptedStatusValue)
    .value('--role', 'role')
    .build();
  ```
  Or, simpler still, derive the `key` from the flag (`--names-only` → `namesOnly`) by camelCasing — eliminates the redundant `key` field entirely for the common case.
- **Behavior preservation:** Pure mechanical transform; covered by existing CLI smoke tests.
- **Verification:** Repeat `pnpm test --filter @libar-dev/architect-cli`.

### H6. `output.ts` — three-tier defensive guards for bundle shapes that the type system already enforces

- **Impact:** High — defensive guards on typed inputs (CLAUDE.md anti-pattern).
- **File:** `commands/_shared/output.ts:31–112`
- **Current pattern:** `writeJson` walks four type-narrowing branches (`isBundle(value)`, `isPlainObject + 'data' in value + isBundle(data)`, `looksLikeBundleCandidate(data)`, `looksLikeBundleCandidate(value)`), each throwing structurally identical "malformed projection bundle" errors. `looksLikeBundleCandidate` is a structural sniff of an envelope that the producer already constructs via `createEnvelope` (`output.ts:63`).
- **Simplified pattern:** Producers call `writeJson(createEnvelope(ctx, data))` or `writeJson(plainScalar)`. Make `writeJson` accept the *typed* union `QuerySuccess<unknown> | ProjectionBundle<Fragment> | Fragment | JsonScalar` and dispatch by the discriminator already present in `createEnvelope` (`success: true`). Delete `looksLikeBundleCandidate` entirely — the only callers that produce envelopes are inside this package and already typed.
- **Behavior preservation:** The producer surface is internal — if any structured response slips through, the test suite catches it.
- **Verification:** `pnpm test --filter @libar-dev/architect-cli`, `pnpm architect:query arch dangling --format json`.

---

## Medium impact

### M1. `requireFirstPositional` is invoked with `if (pattern === undefined) return` boilerplate

- **Impact:** Medium — repeated 6× in `read.ts` + `reporting.ts`.
- **Files:**
  - `commands/read.ts:108–116, 149–157, 216–224, 344–352`
  - `commands/reporting.ts:66–73, 100–107`
- **Current pattern:**
  ```ts
  const pattern = requireFirstPositional(context, parsed.positional, 'Usage: …');
  if (pattern === undefined) return;
  // …use pattern
  ```
- **Simplified pattern:** `requireFirstPositional` already short-circuits in REPL mode by writing to stderr. Replace the return-`undefined` channel with a thrown sentinel caught one frame up, or have it write+exit in REPL mode and `throw` in main mode (uniform). Removes 12 LOC + 6 narrowing branches.
- **Behavior preservation:** REPL today writes usage to stderr and continues; new design preserves that via a `REPL_USAGE` sentinel.
- **Verification:** REPL smoke (`echo "pattern\n" | architect repl`).

### M2. `commands/reporting.ts:files` re-implements `requireFirstPositional` inline

- **Impact:** Medium — direct violation of the abstraction created for this exact case.
- **File:** `commands/reporting.ts:136–144`
- **Current pattern:**
  ```ts
  const usage = 'Usage: architect files <pattern> [--related]';
  if (parsed.positional.length !== 1) throw new Error(usage);
  const [pattern] = parsed.positional;
  if (pattern === undefined) throw new Error(usage);
  ```
- **Simplified pattern:** Use `requireFirstPositional(context, parsed.positional, usage)` like every other read command. The `length !== 1` check is the only behavioral difference and is more cleanly expressed as `parsed.positional.length === 1 ? requireFirstPositional(...) : throw`.
- **Behavior preservation:** Identical usage-error string.
- **Verification:** `architect files X extra-arg` should still error.

### M3. `commands/read.ts:bundle` — large `as { … }` type assertion for parsed flags

- **Impact:** Medium — repeated 5× across read/reporting/planning; the cast duplicates information already in the Zod schema.
- **Files:**
  - `commands/read.ts:159–162, 226–236, 284–290, 326–329`
  - `commands/reporting.ts:76, 110, 145`
- **Current pattern:**
  ```ts
  const flags = parsed.flags as { readonly mode?: 'plan' | 'design' | … };
  ```
- **Simplified pattern:** Type `ParsedCommandInput<TFlags>` generically on the schema in `pattern-graph-cli-commands.ts:52–56`:
  ```ts
  export interface ParsedCommandInput<F = Readonly<Record<string, unknown>>> {
    readonly positional: readonly string[];
    readonly flags: F;
    readonly rawArgv: readonly string[];
  }
  ```
  Then `execute(context, parsed: ParsedCommandInput<z.infer<typeof BundleFlagsSchema>>)`. All 6 casts disappear.
- **Behavior preservation:** Pure type-level change; Zod already enforces shape at parse time.
- **Verification:** `pnpm typecheck`.

### M4. `parseSchemaValue` rewraps every Zod error into a generic `new Error(errorMessage)`

- **Impact:** Medium — drops the actual Zod validation detail at every CLI boundary, then later helpers (e.g. `pattern-graph-cli-commands.ts:185–190`) try to recover it via `BoundaryParseError`.
- **File:** `commands/_shared/schemas.ts:115–121`
- **Current pattern:**
  ```ts
  try { return parseAtBoundary(schema, value, errorMessage); }
  catch { throw new Error(errorMessage); }
  ```
- **Simplified pattern:** Let `parseAtBoundary` errors propagate. The downstream handler in `parseCommandInput` already formats `BoundaryParseError` via `formatZodError`. Discarding the cause here is what forces the awkward double-handling later.
- **Behavior preservation:** Improves error fidelity; only changes the *message* on parse failure, not the exit code.
- **Verification:** `architect bundle X --mode bogus` should produce a more specific error.

### M5. `generate-docs.ts` — `parseArgs` repeats `if (next === undefined || next.startsWith('-')) throw …` 7×

- **Impact:** Medium — identical 3-line guard at every value-flag site.
- **File:** `generate-docs.ts:250–298`
- **Current pattern:** `assertHasValue` from `@libar-dev/architect-core` exists and is used by `pattern-graph-cli.ts`. This file reimplements the same check inline.
- **Simplified pattern:** Replace each block with `assertHasValue(next, arg)`. Saves 14 LOC and stays consistent with the sibling parser.
- **Behavior preservation:** `assertHasValue` throws an equivalent `Error`.
- **Verification:** `architect-generate -b` (no value) still errors.

### M6. `pattern-graph-cli.ts` — `--feature`/`--session`/`--depth` "if remaining.length > 0, push and break" pattern repeated

- **Impact:** Medium — the global parser invented a "remaining args inherit unparsed flags" rule that only applies to three flags but is open-coded in three places.
- **File:** `pattern-graph-cli.ts:102–129`
- **Current pattern:**
  ```ts
  case '--feature':
    if (remaining.length > 0) { remaining.push(arg); break; }
    assertHasValue(next, arg); features.push(next); index += 1; break;
  ```
- **Simplified pattern:** Drop the special case. Once a positional/subcommand has been seen, every remaining arg goes to `remaining` unconditionally — that's already what the `default` branch does. The conditional buys nothing because `--feature` after a subcommand is forwarded to that subcommand's own parser anyway.
- **Behavior preservation:** Subcommand parsers re-tokenize their argv slice; the global flag duplication is the smell.
- **Verification:** `pnpm architect:query rules --feature glob`, `pnpm architect:query context X --session implement`.

### M7. `pattern-graph-cli.ts` — `version`/`help` dispatch is checked twice

- **Impact:** Low-medium — readability.
- **File:** `pattern-graph-cli.ts:228–249`
- **Current pattern:**
  ```ts
  if (args.command === null) {
    if (args.version) { printVersion(); return; }
    if (args.help)    { printGlobalHelp(); return; }
    printGlobalHelp(process.stderr); process.exit(1);
  }
  if (args.help)    { printCommandHelp(args.command); return; }
  if (args.version) { printVersion(); return; }
  ```
- **Simplified pattern:** Single early-return ladder ordered by precedence:
  ```ts
  if (args.version) return printVersion();
  if (args.help) return args.command === null ? printGlobalHelp() : printCommandHelp(args.command);
  if (args.command === null) { printGlobalHelp(process.stderr); process.exit(1); }
  ```
- **Behavior preservation:** Same exit code, same outputs.
- **Verification:** `architect --version`, `architect --help`, `architect bundle --help`, `architect` (no args).

### M8. `pattern-graph-cli-runtime.ts` — `findFilesToScan` invoked with the same conditional-spread for `exclude` 4×

- **Impact:** Medium — same conditional-spread shape repeated.
- **File:** `pattern-graph-cli-runtime.ts:83–101, 226–240`
- **Current pattern:**
  ```ts
  const typescriptFiles = await findFilesToScan({
    patterns: [...sourcePlan.input],
    baseDir: sourcePlan.baseDir,
    ...(sourcePlan.exclude.length > 0 ? { exclude: [...sourcePlan.exclude] } : {}),
  });
  ```
- **Simplified pattern:** A `scanFromPlan(sourcePlan, kind: 'input' | 'features')` helper one frame down. If `architect-core`'s `findFilesToScan` accepted `exclude: readonly string[]` with `[]` as the no-op default, the conditional spread vanishes at the boundary.
- **Behavior preservation:** Empty array vs absent property is a Zod boundary choice — verify schema accepts both.
- **Verification:** `pnpm architect:query overview` with and without `exclude` configured.

### M9. `pattern-graph-cli-runtime.ts` — `resolveTagRegistryForTaxonomy` duplicates the front half of `resolveSourcePlan`

- **Impact:** Medium — two functions, same workspace-detection + config-loading prelude.
- **File:** `pattern-graph-cli-runtime.ts:34–81, 144–164`
- **Current pattern:** Both compute `workspaceSources`, `hasWorkspaceSources`, `configPath`, `configResult` and run the same `!configResult.ok && configPath !== null && !hasWorkspaceSources` guard.
- **Simplified pattern:** Extract `loadProjectContext(args)` returning `{ config, workspaceSources, hasWorkspaceSources, configPath }`. Both callers reduce to ~3 lines each.
- **Behavior preservation:** Same error path, same precedence.
- **Verification:** `pnpm architect:query taxonomy` from workspace + standalone repo.

---

## Low impact

### L1. `version.ts` and `help.ts:printVersion` — two implementations of the same string

- **Impact:** Low — cosmetic duplication; no real users of `printVersionAndExit` left.
- **Files:**
  - `version.ts:54–57` (`printVersionAndExit(cliName)`)
  - `commands/_shared/help.ts:64–67` (`printVersion()`)
- **Current pattern:** `version.ts` exports `getPackageVersion`, `getPackageName`, `printVersionAndExit`. The actual CLI uses `help.ts:printVersion()` everywhere; the version-exporter is dead-ish (only `printVersionAndExit` differs by accepting a parameterized `cliName`).
- **Simplified pattern:** Delete `version.ts` (or its dead exports) once `generate-docs.ts:printVersion` is consolidated. Both paths read `readCliPackageMetadata()` already — consolidate on a single `printVersion(cliName?)`.
- **Behavior preservation:** Verify no external `generate-docs`/`validate-patterns` consumers import from `version.ts`.
- **Verification:** `pnpm typecheck` after deletion.

### L2. `error-handler.ts:formatDocError` — `validationErrors` extraction copy-pasted 3×

- **Impact:** Low — same loop in 3 case branches.
- **File:** `cli/error-handler.ts:142–177`
- **Current pattern:** `PATTERN_VALIDATION_ERROR`, `REGISTRY_VALIDATION_ERROR`, `PROCESS_METADATA_VALIDATION_ERROR`/`DELIVERABLE_VALIDATION_ERROR` each open `if (… validationErrors.length > 0) { lines.push('  Validation errors:'); for (const ve …) lines.push(\`    - ${ve}\`) }`.
- **Simplified pattern:** Hoist `appendValidationErrors(lines, errors)` once; each branch becomes a single call.
- **Behavior preservation:** Identical output.
- **Verification:** Synthetic error fixture.

### L3. `error-handler.ts:34–38` — `isReadonlyStringArray` defensive guard

- **Impact:** Low — defensive guard on a typed `DocError.validationErrors: readonly string[]` field.
- **File:** `cli/error-handler.ts:36–38, 142–149, 169–177`
- **Current pattern:** Runtime check (`Array.isArray && every(typeof === 'string')`) on a field whose type already declares `readonly string[]`.
- **Simplified pattern:** Drop the runtime guard; `DocError`'s discriminated-union type narrows correctly inside each `case`. The CLAUDE.md "Defensive guards for typed inputs" rule applies directly.
- **Behavior preservation:** Bounded by Zod parse upstream.
- **Verification:** `pnpm typecheck`.

### L4. `generated-docs-manifest.ts:isGeneratedDocsManifest` — hand-written structural check parallel to a Zod schema

- **Impact:** Low — 35-line hand-rolled type guard for a 6-field shape.
- **File:** `cli/generated-docs-manifest.ts:157–191`
- **Current pattern:** Three hand-written `isX` guards (`isGeneratedDocsManifest`, `isGeneratorManifest`, `isManifestEntry`) duplicating field-by-field structural checks.
- **Simplified pattern:** Replace with a Zod schema `GeneratedDocsManifestSchema` parsed once at `loadGeneratedDocsManifest` (`generated-docs-manifest.ts:42–57`) — the only entry point that needs the guard. CLAUDE.md "Zod-first boundaries" applies.
- **Behavior preservation:** Same null-on-failure semantics via `.safeParse()`.
- **Verification:** Round-trip a hand-edited manifest with a missing field.

### L5. `commands/lifecycle.ts` — three near-identical command defs

- **Impact:** Low — `repl`, `help`, `version` each repeat 7 boilerplate lines.
- **File:** `commands/lifecycle.ts:5–46`
- **Current pattern:** Identical `positional: StringArraySchema`, `flags: EmptyFlagsSchema`, `requiresCliContext: false`, `treatUnknownFlagsAsPositionals: true` for all three.
- **Simplified pattern:** `defineLifecycleCommand(name, helpSignature, execute)` factory.
- **Behavior preservation:** Identical metadata.
- **Verification:** REPL `help`, `version`, `quit`.

### L6. WHAT-not-WHY JSDoc on `error-handler.ts`, `version.ts`, `runtime-helpers.ts`

- **Impact:** Low (per CLAUDE.md "default: no comments").
- **Files:**
  - `cli/error-handler.ts:40–60, 92–107, 195–214` (`@example` blocks)
  - `cli/version.ts:23–27, 36–40, 50–53`
  - `cli/runtime-helpers.ts:1–19`
- **Current pattern:** JSDoc that restates the function name in prose plus an `@example` block.
- **Simplified pattern:** Drop the `@example` blocks and the WHAT prose. Keep `@architect-*` annotations and any genuinely-WHY rationale (e.g. `runtime-helpers.ts:42–58` precedence ordering is WHY — keep that as a one-line comment).
- **Behavior preservation:** Documentation-only.
- **Verification:** `pnpm docs:all`.

---

## Cross-cutting themes

1. **Three argv parsers, one shape.** `pattern-graph-cli.ts`, `generate-docs.ts`, and `pattern-graph-cli-commands.ts` each implement the same `for (let i; …) switch (arg) { case '-h': … case '--input': assertHasValue+push }` loop. The subcommand registry is the right abstraction — the global parsers haven't migrated to it yet. Consolidating saves ~300 LOC and removes a class of "fixed in one, broken in the other" bugs.
2. **Conditional spreads everywhere.** The `…(x !== undefined ? { x } : {})` idiom appears 20+ times across `read.ts`, `reporting.ts`, `runtime.ts`, `projection-context.ts`, `generate-docs.ts`. Root cause is `exactOptionalPropertyTypes: true` clashing with object literals. A small `omitUndefined({...})` helper centralizes this, or the consumer schemas could accept `undefined` for genuinely-optional fields. Same theme noted in core/projection reviews.
3. **Defensive guards on typed inputs.** `isReadonlyStringArray`, `looksLikeBundleCandidate`, `isGeneratedDocsManifest`, `isRecord`, `isPlainObject` — all run-time structural checks on data that either already passed a Zod boundary or is constructed locally with full type information. Each is either replaceable by a single Zod parse at the actual trust boundary (file read, network) or deletable entirely (internal callers).
4. **Type assertions hiding what Zod already proves.** Every `parsed.flags as { readonly … }` cast in command `execute` bodies (~10 sites) duplicates the Zod schema. Generic `ParsedCommandInput<TFlags>` removes them all.
5. **Help-text registration coupling.** `printGlobalHelp` lists commands by reading `COMMANDS[name].helpSignature` while `printCommandHelp` reads `def.usage`/`def.helpDetail`. Two parallel string fields express almost the same data; consolidating to a single `usage: { signature, body?, examples? }` field would let `printGlobalHelp` print signatures consistently and `printCommandHelp` print detail when `body`/`examples` are present.
6. **`scope-validate` positional+flag dual interface (PDR-001 DD-6).** `normalizeScopeValidateInput` handles both — that's correct per ADR. But the conflict-detection branch (`projection-options.ts:30–36`) is the only complex bit; if PDR-001 wants to deprecate the positional form, a clean No-BC removal would shrink this helper by half.

---

## Pattern-state context (Data API)

Verified that `PatternGraphCLI` is `@architect-status:active` with `@architect-implements:PatternGraphAPICLI, DataAPICLIErgonomics` (file: `pattern-graph-cli.ts:5–8`). Refactors that touch CLI surface should land before the pattern flips to `completed` to avoid value-transfer churn — the ergonomics pattern is precisely about cleaning up these seams.
