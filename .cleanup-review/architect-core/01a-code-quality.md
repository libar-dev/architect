# architect-core — Code Quality Review

Read-only review of `packages/architect-core/src/**` (106 TS files, ~11.9k LOC).
Focused on correctness, silent-drop hazards, Zod-boundary discipline, error
handling, performance, and production reliability. Findings are grouped by
severity. Every claim points to file:line where feasible. Hypothesis-only
findings are explicitly labelled.

---

## Critical

### C1 — Silent drop: `ProcessMetadataSchema.safeParse` failure logs to `console.warn` and returns `null`

- **Evidence**: `packages/architect-core/src/extractor/dual-source-extractor.ts:93-100`
- **Impact**: Violates ADR-007's silent-drop doctrine. When dual-source feature
  metadata fails schema validation the extractor (a) writes to stdout/stderr,
  not the diagnostic channel, and (b) returns `null` so the caller sees the
  pattern as if it never had process metadata. This is exactly the failure mode
  ADR-007 §Context was written to prevent. Any project picking up the canonical
  read model will silently lose every malformed feature tag set.
- **Remediation**: Replace `console.warn` with an `ExtractionDiagnostic`
  (`createProcessMetadataValidationError` already exists in `types/errors.ts`).
  Push it onto a diagnostics list the function returns, and propagate up through
  `combineSources` → `DualSourceResults.diagnostics`. Same fix at lines 178-184
  for `DeliverableSchema` failures that aren't a status-specific issue.

  ```ts
  const validation = ProcessMetadataSchema.safeParse({...});
  if (!validation.success) {
    return Result.err(createProcessMetadataValidationError(
      feature.filePath,
      'Schema validation failed',
      validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    ));
  }
  ```

- **Verification**: Add an extractor regression test that feeds a feature with
  an invalid `phase:` tag value, asserts no `console.warn` is emitted (spy on
  `process.stderr.write`), and asserts a diagnostic of code
  `'invalid-enum-value'` (or a new dedicated code) is returned.

---

### C2 — Silent drop: collected shape-extraction warnings discarded via `void extractionWarnings`

- **Evidence**: `packages/architect-core/src/extractor/doc-extractor.ts:198-222`
  (line 222 is `void extractionWarnings;`)
- **Impact**: `buildPattern()` carefully accumulates failure messages —
  `Failed to read file`, `[shape-extraction] …`, `[shape-discovery] …` — and
  then explicitly discards the entire array with a `void` statement. Shape
  extraction is the only pipeline stage that surfaces parse / IO failures for
  `architect-shape`-tagged code, and the user (and downstream Studio surface)
  has no way to know any of these warnings occurred. The bug is silent by
  construction.
- **Remediation**: Either (a) thread `extractionWarnings` into the returned
  `ExtractionResults.diagnostics` via `createDiagnostic('parse-failure', …)`
  (the diagnostic code already exists), or (b) lift them onto the
  `ExtractedPattern` itself if they are pattern-local. Delete the `void` line.
- **Verification**: Add a test that points `architect-shape` at a syntactically
  broken TS fixture; assert at least one diagnostic with code `'parse-failure'`
  surfaces on `ExtractionResults.diagnostics`.

---

### C3 — Silent drop: feature parse errors without a recovered pattern name are dropped

- **Evidence**: `packages/architect-core/src/generators/pipeline/build-pipeline.ts:221-236`
- **Impact**: `featureParseFailures = gherkinErrors.flatMap(...)` returns `[]`
  for every error where `error.patternName === undefined` (i.e., the
  `@architect-pattern` tag was unreadable because the file failed to parse
  before that point). Those failures still appear in `warnings.details`, but
  the `PatternGraph.featureParseFailures` projection — the *only* surface the
  CLI / MCP `pattern <Name>` verb uses to report parse provenance — silently
  loses them. Pattern `Foo` in a fundamentally broken file will look "not
  found", not "parse failed", contradicting the `architect-data-api` skill's
  documented behaviour.
- **Remediation**: Always emit a `PatternParseFailure`. Use a synthetic
  `patternName` derived from the file path when none was recoverable
  (e.g., `'<unparseable:' + relativePath + '>'`), and flag it with a new
  `kind: 'spec-parse-failed-name-unknown'`. The schema in
  `validation-schemas/pattern-graph.ts` already supports adding a discriminated
  variant.
- **Verification**: Add a pipeline test that feeds a feature file with broken
  syntax above the `@architect-pattern` line; assert
  `graph.featureParseFailures.length === 1` and the verbatim path appears in
  the failure record.

---

### C4 — `PatternIdentifierSchema` is permissive; `extracted-pattern.ts` BusinessRule / shape schemas use `z.object()` instead of `z.strictObject()`

- **Evidence**: `packages/architect-core/src/validation-schemas/extracted-pattern.ts:13`
  (`BusinessRuleSchema = z.object({...})`) and all of
  `validation-schemas/extracted-shape.ts` (lines 7, 14, 22, 29, 36, 56, 64, 74)
- **Impact**: Engineering doctrine: "every cross-package contract and every
  CLI / MCP input is a Zod schema using `z.strictObject(...)`. Extra properties
  must fail validation, not silently pass." Eight schemas — including the
  central `ExtractedShape` and `ShapeExtractionResult` — silently accept extra
  keys. `ExtractedShape` flows directly into `ExtractedPattern.extractedShapes`
  which is itself part of the `PatternGraph` (the trust boundary per ADR-009).
  An upstream contributor adding a typo'd field (`exportd: true` instead of
  `exported`) gets no validation feedback.
- **Remediation**: Convert all `z.object()` to `z.strictObject()`. Audit
  `output-schemas.ts` (11 more callsites) the same way. The wider count was
  19 `z.object` vs 74 `z.strictObject` — only the strict form is correct here.
- **Verification**: `grep -rn "z\.object(" packages/architect-core/src/ | wc -l`
  should return `0` after the change. Add a unit test that asserts an unknown
  property on `ExtractedShape` parses to a Zod error.

---

### C5 — `Result.unwrap` JSON-stringifies non-Error error values, losing type and stack information

- **Evidence**: `packages/architect-core/src/types/result.ts:70-82`
- **Impact**: When a `Result.err` carries a structured `DocError` (one of the
  12 discriminated factory types in `types/errors.ts`), calling
  `Result.unwrap` throws `new Error(JSON.stringify(error))`. That destroys
  every discriminator field, the typed `cause`, and any branded `SourceFilePath`
  serialization. The caller can no longer `instanceof BoundaryParseError` /
  `error.type === 'FILE_PARSE_ERROR'` after the round-trip; they get a flat
  string message. This contradicts the entire purpose of the discriminated
  error union.
- **Remediation**: Wrap the structured error in a new `ResultUnwrapError`
  class that preserves `cause`:

  ```ts
  class ResultUnwrapError extends Error {
    constructor(public readonly cause: unknown) {
      super(typeof cause === 'object' && cause !== null && 'message' in cause
        ? String((cause as { message: unknown }).message)
        : String(cause));
      this.name = 'ResultUnwrapError';
    }
  }
  ```
  Throw `new ResultUnwrapError(result.error)` so downstream code can recover
  the typed payload via `error.cause`.
- **Verification**: Unit test: `Result.unwrap(Result.err({ type: 'FOO', message: 'bar' } as const))`
  → throws an error whose `.cause` is the original object.

---

## High

### H1 — Untyped extra config-shape keys stripped via string concatenation to bypass a lint check

- **Evidence**: `packages/architect-core/src/config/config-loader.ts:189-195`
  — uses `'codec' + 'Options'` and `'referenceDoc' + 'Configs'` to build
  property names dynamically and delete them before Zod validation.
- **Impact**: This is a textbook anti-pattern: silently accepts undocumented
  config fields, then hides the fact from linters by splitting the property
  names. Two consequences: (1) any consumer using `codecOptions` /
  `referenceDocConfigs` in their `architect.config.ts` will think they are
  configuring something but the values are stripped before validation;
  (2) when the keys are mistyped (`codecOption`, `codecOptions2`) they fail
  strict-object validation with a generic message that doesn't surface the
  semantic that those keys are unsupported. Future readers cannot grep for
  `codecOptions` and find the code that handles it.
- **Remediation**: Either (a) add these keys as optional fields on
  `ArchitectProjectConfigSchema` with proper schemas and document their
  meaning, or (b) remove the strip and let `z.strictObject` reject them with
  a clear error message. The "delete by string-concat" path must go regardless.
- **Verification**: `grep -rn "'codec' + 'Options'\|'referenceDoc'" packages/`
  returns 0 hits. Existing `architect.config.ts` continues to load (or
  rejects with a clear message).

---

### H2 — Catastrophic-backtracking risk in `fileOptInPattern`

- **Evidence**: `packages/architect-core/src/config/regex-builders.ts:13`
  — `\\/\\*\\*[\\s\\S]*?${escapedOptIn}(?!-)[\\s\\S]*?\\*\\/`
- **Impact**: Two nested lazy `[\s\S]*?` quantifiers followed by a literal
  `*/`. On an input where a `/**` is found but no `*/` ever closes it
  (e.g., a TS file with a typo'd JSDoc opener at the very top and minor
  syntactic garbage afterwards), the regex engine can scan exponentially long
  before failing. Files are read in a sequential `for` loop in
  `scanner/index.ts:51-82`, so a single pathological file freezes the entire
  pipeline. Discovered scanner traverses user-controlled globs, so an
  attacker (or buggy generator) can plant such a file.
- **Remediation**: Replace the regex with two cheap string searches:

  ```ts
  hasFileOptIn(content) {
    const openIdx = content.indexOf('/**');
    if (openIdx === -1) return false;
    const closeIdx = content.indexOf('*/', openIdx + 3);
    if (closeIdx === -1) return false;
    const block = content.slice(openIdx, closeIdx);
    // Match the bare opt-in tag (architect) but not architect-pattern etc.
    return new RegExp(`${escapedOptIn}(?!-)`).test(block);
  }
  ```
  Or use a streaming Gherkin/TS comment scanner. Also add a per-file size cap
  (the shape-extractor already uses `5 * 1024 * 1024`; align here).
- **Verification**: Add a fuzz/regression test with a 1MB file containing a
  single unclosed `/**` and no `*/`; `hasFileOptIn` must return `false` in
  under 50ms.

---

### H3 — Sequential `await fs.readFile` in the TS scanner — single-file IO bottleneck

- **Evidence**: `packages/architect-core/src/scanner/index.ts:51-82`
- **Impact**: Every TS file is read sequentially. Across `architect-core`'s
  own 106 files that's tolerable; across a Studio consumer with 5k files this
  becomes the dominant pipeline cost and locks out the perf gate
  (`baseline × 1.5`). The Gherkin scanner already does the right thing
  (`gherkin-scanner.ts:64` uses `Promise.all`); the TS scanner should match.
- **Remediation**: `Promise.all(files.map(async (filePath) => { ... }))`
  with bounded concurrency (e.g., `p-limit(16)` or hand-rolled chunking)
  to avoid `EMFILE`.
- **Verification**: Benchmark scan time on a 1k-file fixture before/after.
  Confirm no regression in the existing perf gate.

---

### H4 — No size cap on `fs.readFileSync` in `doc-extractor.ts`

- **Evidence**: `packages/architect-core/src/extractor/doc-extractor.ts:200-209`
- **Impact**: When a directive declares an `architect-shape` later in the
  file, `buildPattern` synchronously loads the *entire* TS file into memory
  with no size limit. The `shape-extractor.ts` itself enforces `MAX_SOURCE_SIZE_BYTES = 5MB`
  on the buffer it parses, but the read has already happened by then — a 500MB
  rogue file (vendored dist artifact, generated DSL) will OOM the process before
  the cap fires. Also blocks the event loop for the duration of the read.
- **Remediation**: Switch to `await fs.promises.readFile` and stat-check size
  before reading; reject with a diagnostic if the file exceeds the cap.
  Push the cap constant into a single shared `constants.ts` so both extractors
  use the same number.
- **Verification**: Unit test feeds a sparse 10MB fixture and asserts a
  `'parse-failure'` diagnostic, not an OOM.

---

### H5 — `safeRealpathSync` silently swallows errors, weakening output-dir-escape check

- **Evidence**: `packages/architect-core/src/validation-schemas/config.ts:8-14, 28-44`
- **Impact**: `safeRealpathSync` returns `path.resolve(filePath)` (without
  symlink resolution) when the path doesn't yet exist. Combined with line 37
  `if (dir.includes('..')) return false`, the escape check is bypassable in
  two ways: (1) the output dir may not exist yet at config-load time, so
  `safeRealpathSync` returns a non-canonical path and the `startsWith` check
  passes for a symlink-laundered escape; (2) `pattern.includes('..')` matches
  benign filenames like `foo..bar.json` and rejects them. The path-traversal
  refinement is therefore both unsound (false negatives) and noisy (false
  positives).
- **Remediation**: Use `path.relative(baseDir, dir)` and check the result
  starts with neither `..` nor an absolute path. For glob-traversal use the
  existing `hasParentTraversalSegment` from `project-config-schema.ts` which
  already handles separators correctly. Consolidate the two implementations.
- **Verification**: Property-based test enumerating
  `{foo..bar, ../escape, ./safe/.., /etc/foo}` for both
  `GlobPatternSchema` and `createOutputDirSchema`. Existing-passing patterns
  remain valid; escape-shaped patterns are rejected.

---

### H6 — `camelCaseToTitleCase` placeholder generation overflows past 26 acronyms

- **Evidence**: `packages/architect-core/src/utils/string-utils.ts:22-65`
- **Impact**: `KNOWN_ACRONYMS` has 35 entries today; the placeholder is
  `§§${String.fromCharCode(97 + placeholders.length)}§§`. As soon as a single
  input string contains all 35 (improbable in production prose, but possible
  in test fixtures or generated docs), `97 + 26 = 123` produces `'§§{§§'` —
  the literal `{` brace — which can conflict with mermaid / table syntax in
  downstream renderers. Worse, `97 + 35 = 132` produces non-ASCII control
  characters. Bug is latent because no realistic input has triggered it.
- **Remediation**: Use a longer base (e.g., `String.fromCharCode(0xE000 + ...)`,
  Private Use Area) or a multi-char counter (`§§a§§`, `§§ab§§`, …). Or
  reverse the design: index placeholders by acronym hash rather than ordinal.
- **Verification**: Add a test that exercises a string containing all 35
  acronyms; assert the output equals the input with no garbage characters
  left over.

---

### H7 — `recoverPatternNameFromFeatureText` does not require the tag to be at file scope

- **Evidence**: `packages/architect-core/src/scanner/gherkin-ast-parser.ts:428-442`
- **Impact**: After Gherkin parse failure, the scanner walks every line of
  the file looking for a `@architect-pattern:` substring. Any occurrence wins,
  including ones inside a scenario step's docstring, a markdown code block,
  or commented-out text. The recovered name then becomes the
  `featureParseFailures` patternName — potentially attributing a parse failure
  to the wrong pattern. The Data API skill calls out exactly this provenance
  risk.
- **Remediation**: Restrict the search to the first non-blank line block
  (i.e., before the first `Feature:` keyword) and require the tag to start at
  column 0 (or after whitespace only). Optionally fall back to the filename
  stem.
- **Verification**: Test fixture with a malformed feature whose only
  `@architect-pattern:` occurrence sits inside a `"""` docstring; recovery
  must return `undefined`, not the docstring value.

---

### H8 — `JsonInputCodec.safeParse` discards error reason — caller cannot tell parse failed from data being missing

- **Evidence**: `packages/architect-core/src/validation-schemas/codec-utils.ts:98-101`
- **Impact**: `safeParse(content): T | undefined` swallows the structured
  `CodecError` and returns plain `undefined`. Every caller that uses it has
  no way to distinguish "JSON syntax error" from "schema validation failed
  with these specific issues" from "valid empty input". The method exists
  solely to skip error handling — exactly the pattern the project's
  Result-based error doctrine is meant to prevent.
- **Remediation**: Either remove `safeParse` (the `Result`-returning `parse`
  is strictly superior), or have it log to a passed-in diagnostics callback.
  Audit callers (search `.safeParse(` in repo) and migrate them.
- **Verification**: After migration, `grep -rn "codec\.safeParse(" packages/ | wc -l`
  returns 0.

---

### H9 — `BusinessRuleSchema` accepts arbitrary extra keys *and* is wired into a `strictObject` parent

- **Evidence**: `packages/architect-core/src/validation-schemas/extracted-pattern.ts:13-19`
  used in `ExtractedPatternBaseSchema.rules` (line 121)
- **Impact**: The parent `ExtractedPatternBaseSchema` is `z.strictObject`, but
  the `rules: z.array(BusinessRuleSchema)` items are non-strict. A pattern
  could carry rules with extra fields that survive validation, ride through
  the PatternGraph, and confuse Studio surfaces. Same shape as C4 but worth
  calling out separately because rules are an inner contract that flows through
  ADR-009's projection trust boundary.
- **Remediation**: `z.strictObject` for `BusinessRuleSchema` (same as C4).
- **Verification**: Adding `extraField: 'oops'` to a rule object now fails
  validation.

---

### H10 — `Promise.all` on Gherkin parse with no concurrency cap

- **Evidence**: `packages/architect-core/src/scanner/gherkin-scanner.ts:60-69`
- **Impact**: While correct in shape (parallel reads), `Promise.all(files.map(...))`
  with unbounded parallelism on a 5k-file workspace will trigger `EMFILE` /
  `ENOMEM`. The TS scanner has the opposite problem (H3); both should converge
  on the same bounded-concurrency primitive.
- **Remediation**: Use a shared helper `mapConcurrent(items, limit, fn)` with
  a default limit of `os.availableParallelism() * 4` or a hard-coded `16`.
- **Verification**: Integration test against a 2k-file feature fixture; no
  `EMFILE` on a tight `ulimit -n 256` environment.

---

## Medium

### M1 — `safeParse` ignores `_diagnostics` field per schema design but extractors never populate it

- **Evidence**: `packages/architect-core/src/validation-schemas/extracted-pattern.ts:128-131`
  declares `_diagnostics` on `ExtractedPatternDraftSchema`, but no extractor
  in `extractor/*` writes to it. Diagnostics flow through the parallel
  `ExtractionDiagnostic` channel instead.
- **Impact**: Dead schema field signals an aborted refactor. Schema diff between
  `ExtractedPatternDraft` and `ExtractedPattern` is exactly this one optional
  field — a strong hint someone intended diagnostics-on-pattern but didn't
  finish the migration.
- **Remediation**: Either populate it (and remove the parallel
  `ExtractionDiagnostic[]` return) or delete the field from
  `ExtractedPatternDraftSchema`. Pick one source of truth.
- **Verification**: After cleanup, `grep -rn "_diagnostics" packages/architect-core/src/ | wc -l`
  matches the chosen direction (zero if deleted; ≥3 if kept and populated).

---

### M2 — `WeakMap` cache on `PatternGraph` only hits when the *same object identity* is passed

- **Evidence**: `packages/architect-core/src/read-api/pattern-helpers.ts:23`
  (`lowercaseNameIndexCache`) and
  `packages/architect-core/src/read-api/pattern-classification.ts:29`
  (`declaredPatternIndexCache`)
- **Impact**: Both caches key on `PatternGraph` identity. The pipeline runs
  `parseAtBoundary(PatternGraphSchema, graph, ...)` in `build-pipeline.ts:111`
  which returns a *new* object (Zod parse-then-clone). Downstream code uses
  the parsed graph, so the cache works for that hot graph — but anyone holding
  a reference to the pre-parse `RuntimePatternGraph` gets cache misses. Less
  important for correctness than for unobvious memory behaviour: long-running
  MCP servers may produce subtly different timings depending on how they
  shape their internal graph references.
- **Remediation**: Document the identity invariant on the cache, or switch to
  keying on a stable `graph.hash` if you add one. Cheap fix: a comment near
  the cache declaration.
- **Verification**: Conceptual — no functional test needed.

---

### M3 — `extractCsvValue` doesn't deduplicate and doesn't validate values

- **Evidence**: `packages/architect-core/src/scanner/ast-parser.ts:91-99`
- **Impact**: `@architect-uses Foo, Foo, Bar` produces `['Foo', 'Foo', 'Bar']`
  with no diagnostic. Same applies for `implements`, `see-also`, `api-ref`.
  Validity is checked downstream (dangling-reference detection), but the
  duplicate noise propagates into `relationshipIndex` and inflates `dependsOn`
  arrays. The Gherkin path (`extractPatternTags` in `gherkin-ast-parser.ts`)
  also doesn't dedupe.
- **Remediation**: Dedupe in `extractCsvValue` and emit a `'duplicate-value'`
  diagnostic (new code; or fold into `'invalid-enum-value'`) when duplicates
  are removed. Same fix on the Gherkin side.
- **Verification**: Pattern with `@architect-uses A, A` produces exactly one
  entry in `pattern.uses` and one diagnostic.

---

### M4 — `inferBehaviorFilePath` hard-codes `tests/features/behavior/` — magic string

- **Evidence**: `packages/architect-core/src/extractor/gherkin-extractor.ts:522-525`
- **Impact**: The behavior-file inference path is a hardcoded string that
  doesn't come from `architect.config.ts`. Consumer projects with different
  test layouts get incorrect `behaviorFile` fields, which then fail
  `fileExistsAsync` and emit misleading `behaviorFileVerified: false` signals.
- **Remediation**: Lift the prefix into `ResolvedProjectConfig`
  (`config/project-config.ts`) — e.g., `behaviorFileBaseDir` — and default to
  `tests/features/behavior/` for backward compatibility within the dogfood
  repo. Thread it through `GherkinExtractorConfig`.
- **Verification**: New consumer config with
  `behaviorFileBaseDir: 'tests/specs/'` produces correctly-prefixed
  `behaviorFile` values.

---

### M5 — `fileExistsAsync` swallows non-ENOENT errors

- **Evidence**: `packages/architect-core/src/extractor/gherkin-extractor.ts:527-534`
- **Impact**: `fs.access` can throw `EACCES` (permission), `ELOOP` (symlink
  loop), `ENAMETOOLONG`, etc. The current `catch { return false }` conflates
  all of them with "file doesn't exist". A permission error becomes
  `behaviorFileVerified: false`, which the consumer renders as "missing test
  file" — wrong diagnostic.
- **Remediation**: Narrow to `code === 'ENOENT'`; emit a diagnostic for other
  error codes.
- **Verification**: Test passes a path with no read permission; verification
  returns `undefined` (uncertain) plus a diagnostic, not `false` (confirmed
  missing).

---

### M6 — `extractFirstSentenceRaw` regex consumes the trailing period via slicing — fine, but ambiguous on abbreviations

- **Evidence**: `packages/architect-core/src/utils/session-helpers.ts:26-34`
- **Impact**: `extractFirstSentenceRaw('See ADR-007. Then ...')` returns
  `'See ADR-007.'` correctly because the lookahead requires whitespace +
  uppercase. But `'See e.g. SomeName.'` splits after `e.g.` and returns
  `'See e.g.'`, dropping the actual sentence content. Used in handoff /
  session bundle output, so the user gets visibly truncated context.
- **Remediation**: Either accept the limitation and document it, or use a
  better sentence segmenter. At minimum, do not split before known
  abbreviations (`e.g.`, `i.e.`, `etc.`, `vs.`).
- **Verification**: Unit table-test enumerating problematic prefixes.

---

### M7 — `extractPatternTags` discards every metadata tag whose `definition === undefined`

- **Evidence**: `packages/architect-core/src/scanner/gherkin-ast-parser.ts:532`
  — `if (definition === undefined) continue;`
- **Impact**: When a Gherkin feature carries `@architect-unknown-foo: bar`,
  the tag is silently dropped with no diagnostic. The TS path
  (`ast-parser.ts`) at least produces a `DirectiveValidationError` via the
  schema. Asymmetry between TS and Gherkin discovery surfaces.
- **Remediation**: Emit an `'unknown-tag'` diagnostic (new code) when a tag
  prefix is recognised (`@architect-…`) but the tag name is not.
- **Verification**: Feature with `@architect-frobinator:1` produces exactly
  one diagnostic of the new code; pattern still extracts otherwise.

---

### M8 — `BoundaryParseError.cause` typed as `z.ZodError` shadows `Error.cause`

- **Evidence**: `packages/architect-core/src/validation/boundary.ts:38-48`
- **Impact**: TypeScript-side this works due to `override readonly cause`,
  but runtime debuggers and any `JSON.stringify(err.cause)` invocation will
  see the ZodError shape leak across the boundary — defeating the purpose of
  wrapping. The `details` field is the boundary-safe representation; `cause`
  being typed as the underlying library type is exactly the leak Zod-first
  boundaries are supposed to prevent.
- **Remediation**: Either narrow `cause` to `unknown` (preserve runtime
  carry-through but force callers to use `details`), or drop the explicit
  type on `cause` and rely on `Error.cause: unknown` from lib.es2022.
- **Verification**: `BoundaryParseError` thrown across package boundaries
  retains stable `details: readonly BoundaryParseIssue[]` shape without
  importing Zod's types.

---

### M9 — `validation-schemas/extracted-pattern.ts` doesn't pin the `description` of `BusinessRuleSchema` to its origin

- **Evidence**: same file, line 15 — `description: z.string()` (no min length)
- **Impact**: A rule with empty description silently passes. Combined with H9
  (non-strict) and silent-drop tendencies in extractors, an entire spec rule
  could be ingested as `{ name: 'Rule X', description: '', scenarioCount: 0, scenarioNames: [] }`
  and surface as a no-op invariant in PatternBundle projections.
- **Remediation**: `description: z.string().min(1)` or document why empty is
  allowed.
- **Verification**: Existing test corpus passes; new test asserts empty
  description fails validation.

---

### M10 — `crypto.createHash('md5')` for pattern IDs — non-cryptographic, fine, but worth flagging

- **Evidence**: `packages/architect-core/src/utils/id-utils.ts:5`
- **Impact**: ID is `pattern-${md5(filePath:line).slice(0, 8)}` — 32 bits of
  entropy. Birthday-paradox collision probability hits 1% around ~9000
  patterns. The Libar Studio surface ships with 268 patterns today; consumer
  projects scaling to ~5k patterns approach the collision regime. MD5 is
  not the issue (truncated SHA-256 would have the same property at 8 hex
  chars); the input space is.
- **Remediation**: (a) Extend the truncation to 12 chars (~48 bits, ~16M
  patterns before 1% collision); or (b) use the full pattern name as ID for
  Gherkin-canonical patterns (slug already proven non-empty by
  `ExtractedPatternBaseSchema:65`).
- **Verification**: Generate IDs for 10k synthetic patterns; assert zero
  collisions.

---

### M11 — `process.exit` baked into a library file

- **Evidence**: `packages/architect-core/src/utils/errors.ts:24-38`
- **Impact**: `exitWithErrorMessage` / `exitWithProcessError` live in the
  shared core, but `architect-core` is a library — the CLI / MCP / guard
  packages should own process-exit policy. Importing the core in a hosted
  context (e.g., MCP server, Studio embed) and triggering one of these
  helpers kills the host process. Defies ADR-006's read-model boundary.
- **Remediation**: Move both helpers to `packages/architect-cli/src/utils/`
  (or a new `packages/architect-cli-utils/`). Anything in `architect-core`
  that needs to terminate should throw a typed error and let the host decide.
- **Verification**: `grep -rn "process\.exit" packages/architect-core/src/`
  returns no hits.

---

## Low

### L1 — `parseTestsValue` accepts symbols `'✓'`, `'✅'`, `'✗'` but not `'❌'`

- **Evidence**: `packages/architect-core/src/extractor/dual-source-extractor.ts:106-120`
- **Impact**: Authors using common test-status emoji `❌` get parsed as
  fallback `parseInt(❌)` → `NaN` → `0`. Mild surprise; emit a diagnostic or
  expand the symbol set.
- **Remediation**: Add `'❌'`, `'⛔'` to the zero set.

### L2 — `processDeclaration` skips `let`/`var` declarations silently

- **Evidence**: `packages/architect-core/src/extractor/shape-extractor.ts:194-207`
  — `if (node.kind === 'const')`
- **Impact**: A pattern author annotating a `let` exported function alias
  produces no shape. Niche, but emit a diagnostic if it's an
  `ExportNamedDeclaration` we recognised but couldn't process.

### L3 — `inferFeatureLayer` is a chain of `if`/`includes` heuristics with no escape

- **Evidence**: `packages/architect-core/src/extractor/layer-inference.ts:23-43`
- **Impact**: Hardcoded directory names (`orders`, `inventory`, `deciders`)
  bleed dogfood domain into the framework. Should be config-driven via
  `architect.config.ts`. Today, a consumer with a `/orders/` directory that
  is NOT a domain feature gets misclassified.
- **Remediation**: Lift the rules into the existing
  `contextInferenceRules` plumbing in `resolve-config.ts`. Default to the
  current heuristics for the dogfood repo.

### L4 — `parseMarkdownTableRows` accepts table rows even when they don't have a trailing pipe

- **Evidence**: `packages/architect-core/src/utils/parse-markdown-table-rows.ts:13-20`
- **Impact**: `cells(line)` slices off `(1, -1)` — a row missing the trailing
  `|` silently drops the last cell. Used in ADR-table-vs-TS-constant sync
  tests; drift detection becomes unreliable when a contributor edits the
  table without trailing pipes.
- **Remediation**: Reject rows that don't start AND end with `|`; emit a
  diagnostic.

### L5 — `slugify` and `toKebabCase` are nearly identical but diverge in trim behaviour

- **Evidence**: `packages/architect-core/src/utils/string-utils.ts:1-16`
  — `slugify` uses `replace(/^-|-$/g, '')` (single dash at edges only);
  `toKebabCase` uses `^-+|-+$` (multiple).
- **Impact**: `slugify('---foo---')` → `'--foo--'`, while
  `toKebabCase('---foo---')` → `'foo'`. Surprising asymmetry given the
  shared character set.
- **Remediation**: Standardise on the multi-dash trim in both. Add a unit
  test capturing leading/trailing repeats.

### L6 — `Result.unwrap` doesn't preserve `error.stack` from the inner Error

- **Evidence**: `packages/architect-core/src/types/result.ts:73-75`
  — `throw result.error` (preserves stack)
  but L70-82 path throws a *new* Error and the JSON-stringify discards stack.
- **Impact**: Covered by C5, but worth noting separately: when `error instanceof Error === true` the
  stack is preserved; otherwise it is not. Behaviour asymmetry across the
  call site.

### L7 — `compareContexts` always sorts by raw key order rather than a stable comparator

- **Evidence**: `packages/architect-core/src/read-api/architecture-inspection.ts:185-246`
- **Impact**: `sharedDependencies`, `uniqueToContext1`, `uniqueToContext2`
  arrays are populated by iterating a `Set`, whose iteration order is insertion
  order. For determinism (matters for snapshot tests and projection diffs),
  sort the output arrays.

### L8 — `extractWhenToUse` breaks on the first non-bullet line — no support for blank lines mid-list

- **Evidence**: `packages/architect-core/src/scanner/ast-parser.ts:560-570`
- **Impact**: A bullet list with a blank line between items terminates after
  the first segment. Hand-edited JSDoc often has these; the second half of
  the list silently vanishes. Mild authoring footgun.

### L9 — `BatchError.type === 'BATCH_ERROR'` declared in types but never constructed in `architect-core`

- **Evidence**: `packages/architect-core/src/types/errors.ts:212-217`
- **Impact**: Dead-code-adjacent: the type exists, no factory ships, no
  consumer in this package emits it. Either delete or add the factory.

### L10 — `cloneRoleDefinitions` and `cloneRoles` are duplicate (subtly different) implementations

- **Evidence**:
  - `taxonomy/registry-builder.ts:36-41` (`cloneRoleDefinitions`)
  - `config/factory.ts:8-17` (`cloneRoles`)
- **Impact**: Both deep-copy role definitions but `cloneRoles` adds explicit
  `description` / `diagramShape` spread, while `cloneRoleDefinitions` relies
  on the `...role` spread. If a future field is added to `RoleDefinition`,
  only one site will pick it up — silent divergence.
- **Remediation**: Consolidate into a single `cloneRoleDefinition(role)`
  exported from `validation-schemas/tag-registry.ts`.

---

## Cross-cutting themes

1. **Silent drops are still landing in extractor + scanner code despite ADR-007's prohibition.**
   `console.warn` in `dual-source-extractor.ts`, `void extractionWarnings;`
   in `doc-extractor.ts`, the `flatMap(... => [])` swallow in
   `build-pipeline.ts`, and the `definition === undefined; continue` skip in
   `gherkin-ast-parser.ts:532` are all the same anti-pattern. A single
   "diagnostics-or-die" lint pass over the extractor surface would catch them.

2. **`z.object()` lingers where `z.strictObject()` is required.** 19 callsites
   in core, eight of which feed directly into the PatternGraph trust boundary.
   The doctrine is unambiguous, the fix is mechanical, and the perf cost is
   nil. This is a one-PR cleanup.

3. **Filesystem-and-regex paths assume small inputs and friendly content.**
   No size caps on the first read in `doc-extractor` (H4), `fileOptInPattern`
   nested lazy quantifiers (H2), sequential scans (H3), unbounded
   `Promise.all` (H10), `safeRealpathSync` masking errors (H5). The pipeline
   is robust on this repo's 106 files; consumer projects with order-of-magnitude
   more files will surface every one of these.

4. **Errors are typed elaborately but flattened at the worst moments.**
   `types/errors.ts` ships 12 discriminated DocError variants — and then
   `Result.unwrap` JSON-stringifies them (C5), `BoundaryParseError.cause`
   leaks the ZodError type across boundaries (M8), `JsonInputCodec.safeParse`
   returns `undefined` with no reason (H8). The shape of the error system is
   right; the call sites that flatten it back to strings need a sweep.

5. **Config and inference are sprinkled with magic strings that defeat
   reusability.** Hardcoded `tests/features/behavior/` (M4), hardcoded
   `/orders/` / `/deciders/` in `inferFeatureLayer` (L3), stripped-via-string-concat
   `codecOptions` (H1). The package is documented as the ingestion + read-model
   layer; consumer projects can't customise without forking. Externalise these
   into `architect.config.ts` so the package family genuinely supports the
   "consumers wire their own config" claim in `architect-base` §2.
