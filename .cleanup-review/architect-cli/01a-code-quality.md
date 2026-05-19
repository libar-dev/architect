# `architect-cli` — Code Quality Findings

Scope: `packages/architect-cli/src/cli/**` (26 files, ~3.85k LOC). Read-only review against
the doctrine pillars (PDR-001, No-BC, Zod-first, no silent drops, no business logic in CLI).
Focus dimensions: argv parsing safety, error/exit-code discipline, output format, re-parsing,
performance, cross-package routing, security.

---

## Critical

### C1 — Double-parse of every command's argv at the CLI boundary
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli.ts:255` and `:266` /
  `pattern-graph-cli-commands.ts:200-208` and `:210-223`
- **Impact:** Every successful subcommand invocation runs `parseCommandInput(def, argv)`
  twice — once inside `validateCommandInput` (line 255) and again inside `runCommand`
  (line 266 → `pattern-graph-cli-commands.ts:220`). Each invocation does positional Zod
  parsing (`parseAtBoundary(def.positional, ...)`) plus a full flag-bag Zod parse
  (`parseAtBoundary(def.flags, ...)`). For a 2-5 s cold CLI advertised by the data-api
  skill, this is unnecessary CPU and a direct doctrine violation of the "parse once at
  the trust boundary" rule in `CLAUDE.md` → `Zod-first boundaries`.
- **Remediation:** Inline the validation step. `runCommand` already calls
  `parseCommandInput` and `definition.validateParsedInput?.(parsed)` (the two things
  `validateCommandInput` did). Delete the redundant `validateCommandInput` call from
  `main()`; keep only `runCommand`. Alternatively, have `validateCommandInput` return the
  `ParsedCommandInput` and pass it into a refactored `runCommand` so the second parse
  is skipped.
- **Verification:** `pnpm test --filter @libar-dev/architect-cli` still green; add a
  micro-benchmark or instrument `parseCommandInput` with a counter and run any verb —
  count should drop from 2 to 1.

### C2 — Silent fallthrough when `pattern <Name>` does not exist and is not a parse failure
- **File:** `packages/architect-cli/src/cli/commands/read.ts:117-124`
- **Impact:** `read.ts` checks `getPattern(pattern) === undefined` and only throws when
  `findPatternParseFailure` returns a value. If the pattern is simply absent (no parse
  failure on disk), control falls through to
  `writeProjectionOutput(..., projectPatternDetail(..., pattern))`, which emits whatever
  the projection returns for a missing name. This is the "silent drop" doctrine
  violation in `00-scope.md` → "every CLI command must return a meaningful exit code and
  never swallow errors". The data-api skill specifically promises a useful
  "not found / parse failure" verdict here.
- **Remediation:** After the `parseFailure` check, throw a deterministic
  `Pattern not found: ${pattern}` error mirroring `commands/reporting.ts:151` (which
  already does the right thing for `files`). The handoff projection at
  `commands/_shared/handoff.ts:58-60` also does the right thing — copy that idiom.
- **Verification:** `pnpm exec architect-query pattern DefinitelyNotAPattern` should exit
  non-zero with a clear "Pattern not found: …" message and no projection output on
  stdout.

### C3 — Top-level await in five bin entries swallows errors and bypasses `handleCliError`
- **Files:** `packages/architect-cli/src/cli/lint-patterns.ts:5`,
  `lint-process.ts:5`, `lint-steps.ts:5`, `validate-patterns.ts:5`, plus the way
  `generate-docs.ts` and `pattern-graph-cli.ts` already wrap their `main()` in
  `void main().catch(handleCliError)`.
- **Impact:** Four of the six bins use a bare `await runXxxCli(...)`. If the guard
  function rejects, Node emits an `UnhandledPromiseRejection` and exits with a
  non-deterministic code, no structured DocError formatting, no uniform exit-code
  discipline. This is a No-BC-class break of the "uniform error surface" promise in
  `00-scope.md`.
- **Remediation:** Wrap each bin in the same pattern used by the other two:
  ```ts
  void runXxxCli(process.argv.slice(2)).catch((error: unknown) => {
    handleCliError(error, 1);
  });
  ```
  Better: export `runXxxCli` to return a result/exit-code envelope and let the bin
  shim translate.
- **Verification:** Run each bin with bogus arguments that force a rejection; observe
  identical exit-code + stderr shape across all bins.

---

## High

### H1 — `process.chdir` mutates global cwd inside `generate-docs.ts` (three times per invocation)
- **File:** `packages/architect-cli/src/cli/generate-docs.ts:172-181`, called at lines
  194, 203, 212.
- **Impact:** `withWorkingDirectory` does `process.chdir(directory); try { ... } finally
  { process.chdir(previousCwd) }`. This is the same anti-pattern that commit
  `676a916 fix(mcp): remove global cwd mutation` already removed from
  `architect-mcp`. Even though `generate-docs` is short-lived, a thrown error inside
  the `await` between two consecutive `withWorkingDirectory` calls can leave the
  process at the wrong cwd if the harness is hosting the bin (tests, scripts/glue/*),
  and concurrent imports in a long-running test environment will see corrupted cwd.
- **Remediation:** Refactor `loadGenerationConfig` to pass `baseDir` explicitly through
  the config loaders rather than relying on `process.cwd()`. `findConfigFile`,
  `loadProjectConfig`, and `resolveProjectConfig` already accept `baseDir` in the
  runtime CLI path (see `pattern-graph-cli-runtime.ts:38-39`); use the same API here.
- **Verification:** `grep "process.chdir" packages/architect-cli/src/` returns empty.
  Smoke regression: `pnpm test:dogfood` and `pnpm docs:all` produce identical output.

### H2 — `output.ts` round-trips a projection through `renderJson` → `JSON.parse` to embed in an envelope
- **File:** `packages/architect-cli/src/cli/commands/_shared/output.ts:44-51`
- **Impact:** `renderEnvelopeWithBundleData` calls `renderPrettyJson(envelope.data)`
  (synchronously produces a pretty-printed string) and then `JSON.parse(...)` on the
  result, just to nest the bundle inside the envelope under `data`. This is wasted
  CPU per response and a soft re-parse of internal projection output. The renderer
  exists precisely so this string never has to round-trip.
- **Remediation:** Have `renderJson` expose a tree-returning variant (`renderJsonTree`
  or similar in `architect-projection`) for the embedding case, or just
  `stringifyJsonValue({...envelope, data: envelope.data })` and let `JSON.stringify`
  walk the bundle natively — the bundle is already a plain Zod-validated JS object.
- **Verification:** Output shape unchanged: snapshot the JSON of
  `architect query getStatusCounts` and `architect arch dangling --baseline … --strict`
  before and after.

### H3 — `generated-docs-manifest.ts` parses untrusted JSON with hand-rolled type-guards instead of Zod
- **File:** `packages/architect-cli/src/cli/generated-docs-manifest.ts:42-57`,
  `:157-191`
- **Impact:** `loadGeneratedDocsManifest` reads disk JSON and validates with
  `isGeneratedDocsManifest` + `isGeneratorManifest` + `isManifestEntry` — manual
  duck-typing instead of a Zod schema. This is the "Zod-first boundaries" doctrine
  in `CLAUDE.md`. Adding a new `audience`/`role` enum value requires editing three
  hand-rolled predicates; one will inevitably drift. Also: `tracking: 'ignore'` is
  allowed by the entry guard but no callsite writes it, so the API surface and the
  type-guard already disagree.
- **Remediation:** Define `GeneratedDocsManifestSchema = z.strictObject(...)` (with
  `z.enum(['root','progressive-child'])`, etc.), drop the three predicates, and
  derive `GeneratedDocsManifest = z.infer<typeof GeneratedDocsManifestSchema>`. Use
  `safeParse` and treat failure as "no/invalid manifest, fall through to fresh upsert"
  exactly as the predicate path does today.
- **Verification:** A corrupted manifest file (extra field, wrong enum value) returns
  `null` and triggers a fresh write, matching current behaviour.

### H4 — Hand-maintained `knownTypes` whitelist in `isDocError` will silently degrade when core adds variants
- **File:** `packages/architect-cli/src/cli/error-handler.ts:74-89`
- **Impact:** `isDocError` enumerates 12 DocError discriminator strings. If
  `architect-core` adds a 13th (e.g., a new validation variant), `isDocError` returns
  `false` for it, `handleCliError` falls through to `exitWithProcessError`, and the
  user loses the structured context (file path, line, validation errors) the error
  was carrying. Doctrine: the source of truth should be the DocError discriminated
  union itself, not a duplicated string list.
- **Remediation:** Either export `DocErrorTypeSchema = z.enum([...])` from
  `architect-core` and import it here (single source of truth), or export an
  `isDocError` guard from `architect-core` and re-export. Delete the local
  duplicated list.
- **Verification:** Adding a new DocError variant in core breaks the type check at
  the CLI export site (good, surfaces the gap) rather than silently degrading at
  runtime.

### H5 — Main CLI collapses every error to exit code 1; doesn't distinguish parse-failure from runtime-failure
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli.ts:273-275`
- **Impact:** `main().catch((error) => handleCliError(error, 1))` — every failure
  path exits 1. `generate-docs.ts:660-662` already distinguishes
  `BoundaryParseError` (Zod boundary error) → exit 2 vs runtime → exit 1. The main
  CLI should too. Today `pnpm architect:query bundle Foo --include garbage`,
  `pnpm architect:query bundle` (missing positional), and
  `pnpm architect:query pattern ExistingPattern` (pipeline error) all return the
  same exit code, defeating "non-zero = specific failure category" in `00-scope.md`.
- **Remediation:** Mirror `generate-docs.ts:661` —
  `handleCliError(error, error instanceof BoundaryParseError ? 2 : 1)` — and consider
  a third class for "pattern/data not found" (e.g., 3) consumed by scripts.
- **Verification:** `architect bundle MissingPattern; echo $?` → distinct exit code
  from `architect bundle --include bogus; echo $?`.

### H6 — `validate-patterns.ts` and three lint shims have no `--help`/`--version` parity with the rest of the family
- **Files:** `packages/architect-cli/src/cli/validate-patterns.ts`,
  `lint-patterns.ts`, `lint-process.ts`, `lint-steps.ts` (5 lines each).
- **Impact:** The user-facing surface is six bins (`architect`, `architect-generate`,
  `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`,
  `architect-validate`); four of them delegate to `architect-guard` with zero shim
  logic. Whatever `--help`/`--version` UX the guard CLIs expose is inherited
  silently — the cleanup review's "uniform error surface" expectation can drift.
  Also the bins don't print a version pinned to `architect-cli` itself.
- **Remediation:** Either (a) make these four bins go through a tiny shared
  `printCliVersion(name)` + `handleCliError` wrapper for parity, or (b) document
  explicitly in `architect-guard` that those CLIs are the authored UX. Either
  outcome is fine — today the answer is implicit.
- **Verification:** `architect-lint-patterns --version` and
  `architect-validate --version` both print a version line; both bins exit non-zero
  with structured error formatting on a forced failure.

### H7 — REPL help diverges from the actual command surface
- **File:** `packages/architect-cli/src/cli/commands/_shared/help.ts:69-73`
- **Impact:** `printReplHelp` advertises 8 commands
  (`status, list, context, dep-tree, files, scope-validate, handoff, reload, help,
  quit`). The dispatcher accepts all 24 names in `COMMAND_NAMES` (plus `reload`,
  `quit`, `exit`). A REPL user can't discover `pattern`, `bundle`, `rules`,
  `taxonomy`, `arch`, `search`, `overview`, `documentation`, `open-questions`,
  `tags`, `sources`, `unannotated`, `diagnostics`, `query` from the help. This is
  a discoverability bug that will mislead agents driving the REPL.
- **Remediation:** Derive the list from `COMMAND_NAMES`/`COMMANDS` (the same source
  `printGlobalHelp` uses) with REPL-specific verbs (`reload`, `quit`) appended.
- **Verification:** Add a unit test asserting `printReplHelp` output contains every
  entry in `COMMAND_NAMES`.

---

## Medium

### M1 — `pattern-graph-cli.ts` short-flag `-f` is unconditionally consumed by the global parser
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli.ts:97-101`
- **Impact:** Compare against `--feature` (`:102-110`) and `--session`
  (`:111-120`): the long forms defer to the subcommand when `remaining.length > 0`,
  but `-f` always pushes to `features` regardless of whether a subcommand has
  already been seen. PDR-001 DD-6 explicitly calls out positional + flag forms;
  this asymmetry will surprise users invoking `architect bundle Foo -f X` where
  `-f` for the subcommand never gets a chance.
- **Remediation:** Apply the same `if (remaining.length > 0) { remaining.push(arg);
  break; }` guard to `-f`, `-i`, `--input`, and `--base-dir`. Or, simpler: forward
  ALL flags after the subcommand to the subcommand parser and stop the global
  parser at the first positional.
- **Verification:** Add CLI integration tests covering
  `architect bundle Pattern -f X --input Y` and assert global vs subcommand
  ownership of each flag.

### M2 — `projection-context.ts` re-parses an empty hand-built `PatternGraph` on every `taxonomy` call
- **File:** `packages/architect-cli/src/cli/projection-context.ts:31-52`
- **Impact:** `createCliTaxonomyProjectionContext` constructs an empty graph and
  immediately runs `PatternGraphSchema.parse(graph)` (line 50). This is a Zod
  re-parse of internal data — defensive but invoked twice per cold CLI when
  `taxonomy` runs. Negligible perf, but it violates "parse once at the trust
  boundary" — the data didn't cross a trust boundary, it was just constructed.
- **Remediation:** Replace with a one-time construction helper exported from
  `architect-core` that builds an empty `PatternGraph` and is itself the trust
  boundary, then drop the `parse` call here. Or accept the cost and add a comment
  noting this is a deliberate sanity check.
- **Verification:** `taxonomy` output unchanged; profile shows the
  `PatternGraphSchema.parse` line vanishes from the flamegraph.

### M3 — `pattern-graph-cli.ts:262` uses `CommandNameSchema.parse` after `isCommandName` already guarded
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli.ts:251-262`
- **Impact:** Line 251 narrows `args.command` via `isCommandName`. Line 262 then
  calls `CommandNameSchema.parse(args.command)` to re-narrow into the same
  `CommandName` type. TypeScript should already know the type after the guard;
  the `parse` call is a runtime cost paid for a type-system convenience. Compounds
  with C1.
- **Remediation:** Remove line 262; use `args.command as CommandName` after the
  `isCommandName` guard, or restructure so `args.command` carries the narrowed
  type after parse.
- **Verification:** Same as C1.

### M4 — `parseFilterValue` is duplicated between `read.ts` and `generate-docs.ts`
- **Files:** `packages/architect-cli/src/cli/commands/read.ts:66-80` and
  `packages/architect-cli/src/cli/generate-docs.ts:140-155`. The
  `mergeProjectionFilter` helpers are also near-duplicates.
- **Impact:** Two parsers for the same `<status>=<csv>` syntax. If the filter
  grammar evolves (e.g., to support `bounded-context=…`), both must be edited.
  No-BC implies a single source of truth for boundary parsing.
- **Remediation:** Move `parseFilterValue` and `mergeProjectionFilter` into
  `commands/_shared/schemas.ts` (or a new `commands/_shared/projection-filter.ts`)
  and import from both call sites.
- **Verification:** `architect documentation patterns --filter status=active` and
  `architect-generate --filter status=active` accept identical inputs and reject
  identical malformed inputs.

### M5 — `formatPatternParseFailure` is local to `read.ts` but the same failure shape is surfaced elsewhere
- **File:** `packages/architect-cli/src/cli/commands/read.ts:49-60`. The
  `findPatternParseFailure` consumer is unique here, but other commands
  (`context`, `dep-tree`, `files`, `bundle`) would benefit from the same parse-
  failure surfacing when their pattern argument fails to resolve.
- **Impact:** Inconsistent UX. `architect pattern Foo` reports a parse failure with
  `kind/path/message`; `architect dep-tree Foo` would just say "Pattern not
  found" with no parse provenance.
- **Remediation:** Hoist `formatPatternParseFailure` + the parse-failure check
  into a `commands/_shared/pattern-resolver.ts` helper used by every command that
  takes a single pattern positional. The data-api skill documents parse-failure
  surfacing as a feature of `pattern <Name>` — extending it to siblings is a small
  win.
- **Verification:** A pattern with an intentionally broken Gherkin file produces
  the same parse-failure block under `dep-tree`, `files`, `context`, and `bundle`.

### M6 — `requireFirstPositional` swallows missing-positional in REPL mode silently
- **File:** `packages/architect-cli/src/cli/commands/_shared/runtime.ts:11-27`
- **Impact:** In REPL mode, missing positional writes usage to stderr and returns
  `undefined`. Every caller then has its own `if (value === undefined) return;`
  short-circuit (`read.ts:114-116`, `:155-157`, etc.). This is a repeated
  branching anti-pattern and the REPL just keeps running with no failure signal —
  fine for a human REPL but problematic if an agent is driving it for batch work.
- **Remediation:** Either (a) throw uniformly and let `runRepl` catch and continue
  the loop (after restoring it — see H8), or (b) collapse the
  `if (x === undefined) return` boilerplate into a helper that already wrote
  usage.
- **Verification:** REPL session: invalid positional writes usage and returns to
  the prompt; valid invocation runs normally.

### M7 — `runRepl` exits the entire process on the first thrown error inside the loop
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli.ts:183-223`
- **Impact:** Any exception inside the `for await (const rawLine of rl)` body
  propagates out of `runRepl` → out of `main()` → into the top-level
  `handleCliError` → `process.exit(1)`. A user typing a bad command in the REPL
  loses the session. That violates the "REPL = interactive shell" promise.
- **Remediation:** Wrap each per-line `runCommand(...)` in `try/catch`, print the
  formatted error to stderr, and `continue` the loop. Reserve fatal exit for
  `readline` errors and `quit`/`exit`.
- **Verification:** Manual: `architect repl`, type a bad subcommand, see an error
  message, and continue typing. Or unit-test the loop by stubbing `runCommand` to
  throw.

---

## Low

### L1 — `parseArgs` does a strict-object re-parse against `ParsedArgsSchema` after assembling fields by hand
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli.ts:162-180`
- **Impact:** Fields are populated as untyped locals (`let baseDir`, `let help =
  false`, …) and the Zod re-parse on the assembled object catches typos at the
  cost of an extra pass. The pattern is defensible (parse-at-boundary), but the
  CLI is the boundary and the hand-assembled object already has narrow types
  flowing in from `SessionTypeSchema` etc. The parse is mostly redundant.
- **Remediation:** Keep the parse — it's cheap insurance — but add a comment
  noting it's a defensive boundary parse, not a re-parse of validated data.
  Alternatively, move the parse to a single helper that takes raw
  `Record<string, unknown>` and emits `ParsedArgs`.
- **Verification:** Argv test suite unchanged.

### L2 — `cache` path uses sha1 + `fs.statSync` per file on every cold call
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli-runtime.ts:103-125`
- **Impact:** `computeSourceSignature` calls `fs.statSync` per discovered file
  (one sync syscall each) before building. Across the workspace this is ~400+
  syscalls on cold-start. Not catastrophic, but the data-api skill advertises
  "sub-second on warm cache" and any further cold-start tightening will land
  here.
- **Remediation:** Use `fs.promises.stat` in parallel via `Promise.all` to
  overlap syscalls. Or content-hash a small manifest of (path, mtimeMs) once
  per glob batch.
- **Verification:** Profile cold-start before/after; `pnpm architect:query
  overview` should drop measurable wall-clock.

### L3 — `printGlobalHelp` lists `repl` alongside primary verbs without surfacing the discoverability gap
- **File:** `packages/architect-cli/src/cli/commands/_shared/help.ts:16-32`
- **Impact:** `repl` is in `COMMAND_NAMES` so it gets listed. Once H7 lands, REPL
  becomes useful for agents; until then, the global help promises something the
  REPL doesn't deliver. Documentation drift is doctrine drift.
- **Remediation:** After H7, no action. Until then, prepend an `(interactive,
  errors abort session)` note on the `repl` line.
- **Verification:** Visual.

### L4 — `--include` deferred-flag merge already supports comma-list AND repeated flags; data-api skill still flags repeated-flag as a quirk
- **File:** `packages/architect-cli/src/cli/pattern-graph-cli-commands.ts:137-146`
  + `commands/_shared/schemas.ts:167-181`
- **Impact:** Tracing the merge logic, repeated `--include foo --include bar` will
  concatenate into `['foo','bar']` (because `multiple: true` and the parser
  returns an array per call). The data-api skill paraphrases an older quirk
  ("Repeated `--include` silently keeps only the last value"). The skill is
  stale relative to the code; this is informational, not a bug — but worth
  capturing so the skill body can be updated.
- **Remediation:** Update `architect-data-api` skill body and `FEEDBACK.md`. No
  CLI change needed.
- **Verification:** `pnpm exec architect-query bundle SomePattern --include rules
  --include deps --format json | jq .root.routing` shows both blocks.

---

## Cross-cutting themes

1. **Double-parse symmetry.** C1 + L1 + M3 + the projection re-parse at
   `projection-context.ts:50` together signal that "parse once at the trust
   boundary" is enforced verbally but not structurally. A single
   `parseAtCommandBoundary` helper that emits a typed `ParsedCommandInvocation`
   once would eliminate three of these findings. The cost is low and the
   discipline is doctrine-load-bearing.

2. **Bin-entry surface is uneven.** Six bins, three error-handling shapes
   (`void main().catch(handleCliError)`, bare top-level `await`, generate-docs
   with its own exit-code mapping). Picking a single bin wrapper (`runBin(name,
   handler)`) would erase H5, H6, and C3 in one move.

3. **Hand-rolled JSON validation vs Zod-first.** H3 (manifest predicates) and
   H4 (DocError whitelist) are the same anti-pattern: bespoke `is*` predicates
   duplicating types that core already owns. The doctrine fix is to push schemas
   down into `architect-core` / `architect-projection` and import; the CLI is
   the wrong layer to host the type-guards.

4. **Pattern-resolution UX inconsistency.** Three different "pattern not found"
   handling shapes: `read.ts` (parse-failure surfacing or silent fallthrough),
   `handoff.ts` (throw "not found"), `reporting.ts:files` (throw "not found").
   M5 + C2 should converge on the parse-failure-aware version everywhere.

5. **REPL is a second-class surface today.** H7 + M6 + M7 mean the REPL is
   advertised but practically unusable for batch agent driving. Either invest
   to make it agent-grade (continue-on-error, per-command JSON envelope, full
   command surface in help) or downgrade `repl` in the help text. Half-built
   surfaces are worse than declared boundaries.

6. **No business logic in CLI — mostly holds.** The composition root discipline
   is strong: every command is a thin call into `architect-projection` or
   `architect-guard`. The one wart is `output.ts` doing a string→tree round-trip
   (H2). Beyond that, the package is a credit to the doctrine.

7. **Performance is bounded by cold-start.** L2 (`fs.statSync` storm) and the
   double-parse in C1 are the two visible wins. With both fixed, the 2–5 s cold
   target advertised in the data-api skill has measurable headroom — worth
   capturing in a perf-regression test analogous to
   `architect-projection`'s.
