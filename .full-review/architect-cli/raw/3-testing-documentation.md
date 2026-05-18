# architect-cli — Phase 3: Testing & Documentation

**Package:** `@libar-dev/architect-cli@2.0.0-pre.1`
**Reviewed:** 2026-05-17
**Phase 1 baseline:** `1-quality-architecture.md`
**Scope:** 26 src files (~3,870 SLOC); 4 feature files + 4 step files + 1 support file = 9 test files; 6 bins; no README.

---

## 1. Executive Summary

`architect-cli` has the **lowest executable test surface in the family relative to its role as the user-facing composition root**. Nine test files produce 11 scenarios total (10 active, 4 skipped), zero unit tests, and a harness that depends on the live dogfood corpus in the monorepo root — making the test suite simultaneously too narrow (only 2 of 24 commands exercised end-to-end, zero coverage of `generate-docs.ts` or any guard shim bin) and too fragile (corpus coupling means a bad `architect.config.ts` fails all subprocess tests).

Documentation is in the same posture as guard: **no package README** (the only two publishable packages in the family without one), zero ADR/PDR references in source, a 15% `@architect-pattern` annotation rate (4 of 26 files), and an `AGENTS.md` that names all 6 bins but documents none of their flag surfaces or exit-code contracts.

One Phase 1 finding has been **resolved since that phase was written**: H-CLI-7 stated that the 4 guard bin shims bypass `runtime-bridge.js`. All 6 bins now go through `runtime-bridge.js` (confirmed at `bin/architect-guard.js`, `bin/architect-validate.js`, `bin/architect-lint-steps.js`, `bin/architect-lint-patterns.js`). The H-CLI-7 finding is closed.

One Phase 1 finding is **sharpened**: H-CLI-2 (`error-handler.ts` knownTypes drifts from `DocError` union) is now confirmed with a concrete missing discriminator. The `DocError` union in `architect-core/src/types/errors.ts:174-186` has exactly 12 members; `error-handler.ts:74-87` lists exactly 12 strings — matching. However, `errors.ts:213` defines `BatchError<E>` with `type: 'BATCH_ERROR'` as a _separate specialized type_ (not a `DocError` member). The drift risk is real but the discriminator lists are currently aligned. The structural hazard remains: any new `DocError` variant in core will silently break `isDocError` without a compile-time signal. **H-CLI-2 remains open as a structural drift risk.**

---

## 2. Module Coverage Map

| Source file                                      | Lines | Executable test coverage             | Notes                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ----- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                   | 1     | None                                 | Exports `isDocError`, `formatDocError`, `handleCliError` — no consumers anywhere in workspace                                                                                                                                                 |
| `src/cli/error-handler.ts`                       | 233   | None                                 | 12-discriminator type-guard untested; `console.error` vs `stderr.write` drift untested                                                                                                                                                        |
| `src/cli/generate-docs.ts`                       | ~670  | None                                 | Entire `architect-generate` bin is untested                                                                                                                                                                                                   |
| `src/cli/generated-docs-manifest.ts`             | 191   | None                                 | Hand-rolled JSON validators, `pruneStaleGeneratedFiles` untested                                                                                                                                                                              |
| `src/cli/lint-patterns.ts`                       | 5     | None (guard's tests cover this)      | Shim only; guard test surface is the relevant test                                                                                                                                                                                            |
| `src/cli/lint-process.ts`                        | 5     | None                                 | Same                                                                                                                                                                                                                                          |
| `src/cli/lint-steps.ts`                          | 5     | None                                 | Same                                                                                                                                                                                                                                          |
| `src/cli/validate-patterns.ts`                   | 5     | None                                 | Same                                                                                                                                                                                                                                          |
| `src/cli/pattern-graph-cli.ts`                   | ~275  | Partial (2 scenarios via subprocess) | `parseAtBoundary` at exit tested implicitly; `--category` reject path untested                                                                                                                                                                |
| `src/cli/pattern-graph-cli-commands.ts`          | ~220  | Partial (2 of 24 commands)           | `COMMAND_NAMES` has 24 entries; only `overview` and `arch dangling` are tested                                                                                                                                                                |
| `src/cli/pattern-graph-cli-runtime.ts`           | ~250  | None (implicit via above)            | Cache read/write, dual config paths, `resolveTagRegistryForTaxonomy` untested                                                                                                                                                                 |
| `src/cli/pattern-graph-cli-types.ts`             | ~60   | None                                 | Type-only; no logic to test                                                                                                                                                                                                                   |
| `src/cli/runtime-helpers.ts`                     | 86    | Partial                              | `resolveInvocationDir` tested (3 scenarios in `cli-invocation-dir.feature`); `readCliPackageMetadata`, `resolveCliBaseDirArg`, `resolveWorkspaceRoot` untested                                                                                |
| `src/cli/version.ts`                             | ~50   | None                                 | `getPackageName` fallback (`'architect'` cosmetic bug, L-CLI-1) untested                                                                                                                                                                      |
| `runtime-bridge.js`                              | 25    | None                                 | Missing-dist error path untested; POSIX-only `pathname` (M-CLI-4) untested                                                                                                                                                                    |
| `src/cli/commands/_shared/help.ts`               | 74    | None                                 | `printGlobalHelp`, `printCommandHelp`, `printReplHelp` untested                                                                                                                                                                               |
| `src/cli/commands/_shared/schemas.ts`            | 190   | None                                 | `parseSchemaValue` cause-swallowing (H-CLI-Q-7) untested; 8 `parse*` helpers untested                                                                                                                                                         |
| `src/cli/commands/_shared/output.ts`             | ~70   | None                                 | `createValidationMetadata` untested                                                                                                                                                                                                           |
| `src/cli/commands/_shared/structured.ts`         | ~240  | Partial (1 command)                  | `arch dangling` tested as subprocess; `process.exitCode = 1` deferred-exit path (M-CLI-8) not directly verified                                                                                                                               |
| `src/cli/commands/_shared/handoff.ts`            | ~30   | None                                 | Flag narrowing anti-pattern (M-CLI-11) untested                                                                                                                                                                                               |
| `src/cli/commands/_shared/projection-options.ts` | ~60   | None                                 | Same anti-pattern                                                                                                                                                                                                                             |
| `src/cli/commands/_shared/runtime.ts`            | ~30   | None                                 |                                                                                                                                                                                                                                               |
| `src/cli/commands/lifecycle.ts`                  | ~50   | None                                 | `repl`, `help`, `version` commands untested                                                                                                                                                                                                   |
| `src/cli/commands/meta.ts`                       | ~150  | None                                 | `arch`, `rules`, `diagnostics`, `taxonomy`, `sources`, `unannotated` untested                                                                                                                                                                 |
| `src/cli/commands/planning.ts`                   | ~130  | None                                 | `scope-validate`, `handoff` untested                                                                                                                                                                                                          |
| `src/cli/commands/read.ts`                       | ~420  | None                                 | `pattern`, `documentation`, `bundle`, `list`, `open-questions`, `search`, `context`, `dep-tree`, `files`, `status`, `query`, `tags` untested; `parseDisclosureLevel`/`parseFilterValue`/`mergeProjectionFilter` (C-CLI-2 duplicates) untested |
| `src/cli/commands/reporting.ts`                  | ~180  | None                                 | `overview` tested (1 scenario); `arch`, `unannotated` untested                                                                                                                                                                                |

**Summary:** 2 of 24 `COMMAND_NAMES` exercised end-to-end (`overview`, `arch dangling`). `resolveInvocationDir` is the only internal function with direct unit-style tests. 22 of 26 src files have no direct test coverage. 4 of 5 command modules have zero test scenarios.

---

## 3. Findings by Severity

### Critical (P0)

| ID          | Title                                                                             | Location                                        |
| ----------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| TC-C-CLI-1  | 22 of 24 `COMMAND_NAMES` have zero end-to-end test coverage                       | `tests/features/cli-command-resolution.feature` |
| TC-C-CLI-2  | `architect-generate` bin (670 LOC, `generate-docs.ts`) has zero tests of any kind | `src/cli/generate-docs.ts`                      |
| DOC-C-CLI-1 | No package README — second publishable package without one (guard is the other)   | `packages/architect-cli/README.md` (absent)     |

**TC-C-CLI-1 evidence:** `COMMAND_NAMES` at `pattern-graph-cli-commands.ts:16-41` declares 24 commands. `cli-command-resolution.steps.ts` runs `architect overview` and `architect arch dangling` — 2 commands. The remaining 22 (`status`, `context`, `dep-tree`, `files`, `scope-validate`, `handoff`, `query`, `pattern`, `documentation`, `bundle`, `list`, `open-questions`, `search`, `rules`, `diagnostics`, `tags`, `taxonomy`, `sources`, `unannotated`, `repl`, `help`, `version`) have no acceptance scenario, no unit test, and no smoke invocation.

**TC-C-CLI-2 evidence:** `generate-docs.ts` is the entire `architect-generate` bin — 100-LOC hand-rolled argv parser (C-CLI-1), 3 duplicated filter-parsing functions (C-CLI-2), `printHelp`, config resolution, graph build, projection invocation, manifest upsert. The subprocess harness at `tests/support/run-cli.ts:16-23` declares `'architect-generate': 'bin/architect-generate.js'` in `BIN_BY_COMMAND`, but no feature file or step file invokes `runCli('architect-generate ...')`.

### High (P1)

| ID          | Title                                                                                                                                                                     | Location                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| TC-H-CLI-1  | Corpus coupling: all subprocess tests fail when `architect.config.ts` is invalid                                                                                          | `tests/support/run-cli.ts:8,47`                                                 |
| TC-H-CLI-2  | `error-handler.ts` discriminator list (`isDocError:74-87`) has no compile-time link to `DocError` union — silent drift on core change                                     | `src/cli/error-handler.ts:74-87` + `architect-core/src/types/errors.ts:174-186` |
| TC-H-CLI-3  | `parseSchemaValue` cause-swallowing (`H-CLI-Q-7`) untested — downstream consumers have no way to discover the lost `BoundaryParseError.cause`                             | `src/cli/commands/_shared/schemas.ts:115-121`                                   |
| TC-H-CLI-4  | `runtime-bridge.js` missing-dist guard untested — the family's only dist-existence check is in production but not in test                                                 | `runtime-bridge.js:13-17`                                                       |
| TC-H-CLI-5  | Guard bin shims (4 files, 5 LOC each) have zero cli-side smoke invocations for `architect-guard`, `architect-validate`, `architect-lint-steps`, `architect-lint-patterns` | `src/cli/{lint-process,lint-steps,lint-patterns,validate-patterns}.ts`          |
| DOC-H-CLI-1 | `@architect-pattern` annotation rate: 4 of 26 files (15%) — lowest in the family                                                                                          | 4 annotated files vs 22 unannotated                                             |
| DOC-H-CLI-2 | `AGENTS.md` documents all 6 bin names but zero flag surfaces, exit-code contracts, or invocation examples beyond `pnpm architect:query -- <subcommand>`                   | `architect/AGENTS.md:35,144`                                                    |
| DOC-H-CLI-3 | No ADR references in any `src/` file — cli's conformance to ADR-006, ADR-009, and Zod-first is implicit; ADR linkage rate is 0%                                           | `src/cli/*.ts`                                                                  |

**TC-H-CLI-1 detail:** `run-cli.ts:7-8` derives `dogfoodRoot` = monorepo root; `execFile` runs with `cwd: dogfoodRoot`. Every subprocess test therefore reads the live `architect.config.ts`. If the config is temporarily invalid (mid-refactor, broken TypeScript syntax), all 5 subprocess-based scenarios fail with spurious exits unrelated to the tested behavior. Fixture-based isolation (a minimal `architect.config.ts` in a temp directory) would decouple test stability from dogfood corpus state.

**TC-H-CLI-2 detail:** Core defines `DocError` at `errors.ts:174-186` as a 12-member discriminated union. `error-handler.ts:74-87` maintains a parallel `knownTypes` string array of 12 strings. The two lists are currently aligned. `BatchError<E>` at `errors.ts:213` has `type: 'BATCH_ERROR'` but is NOT part of `DocError`; it would not need to appear in `knownTypes`. The real hazard is that adding a 13th `DocError` member in core (e.g., `QUOTA_ERROR`) silently leaves `isDocError` returning `false` for that variant with no TypeScript error. Recipe: replace the string array with `type DocErrorType = DocError['type']` and `const knownTypes: readonly DocErrorType[] = [...]` — type inference will break at compile time when the union gains a new member.

**TC-H-CLI-4 detail:** `runtime-bridge.js:13-17` throws `Error('Missing runtime artifact: ...')` if `dist/` is absent. This is the family's only eager dist-existence guard (noted as family-reference quality in Phase 1). The error path is never exercised in CI. A negative test that temporarily removes `dist/` (or stubs `fs.existsSync` to return false) would pin the error message and exit behavior across refactors.

### Medium (P2)

| ID          | Title                                                                                                                                                                                                                                                                                             | Location                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| TC-M-CLI-1  | `generate-docs.ts:214-315 parseArgs` — `--base-dir`, `--generators`, `--input`, `--output`, `--disclosure`, `--filter` all have zero flag-parsing tests; the "if next is undefined or starts with -" guard repeated 6× is untested error path                                                     | `src/cli/generate-docs.ts:249,257,265,273,285,292` |
| TC-M-CLI-2  | `version.ts` `getPackageName()` fallback returns `'architect'` (L-CLI-1) — untested; an empty/malformed `package.json` would produce the wrong display name silently                                                                                                                              | `src/cli/version.ts:42-47`                         |
| TC-M-CLI-3  | `generated-docs-manifest.ts:157-191` hand-rolled JSON validators (`isGeneratedDocsManifest`, `isGeneratorManifest`, `isManifestEntry`) have zero tests — the manifests they validate gate file pruning                                                                                            | `src/cli/generated-docs-manifest.ts:157-191`       |
| TC-M-CLI-4  | `pattern-graph-cli.ts` flag-order dependency (M-CLI-5): `--feature`, `--session`, `--depth` routing into `remaining` vs parsed depends on command position — no scenario exercises this with mixed flag order                                                                                     | `src/cli/pattern-graph-cli.ts:100-127`             |
| TC-M-CLI-5  | `pattern-graph-cli-commands.ts:113-198 parseCommandInput` two-path error fidelity (M-CLI-6): positional failures suppress Zod cause; flag failures preserve it — no negative test exercises either path directly                                                                                  | `src/cli/pattern-graph-cli-commands.ts:167-191`    |
| TC-M-CLI-6  | Test harness `run-cli.ts:31` splits on whitespace — quoted args like `"two words"` silently misparse; no quoted-argument test exists (L-CLI-4)                                                                                                                                                    | `tests/support/run-cli.ts:31`                      |
| DOC-M-CLI-1 | `architect-generate --help` (via `generate-docs.ts:317-340 printHelp`) has no phantom PDR references (clean), but documents `--disclosure level: essential, important, useful, advanced` without citing whether `useful` or `important` maps to the level 3 enum — low-fidelity for API consumers | `src/cli/generate-docs.ts:331`                     |
| DOC-M-CLI-2 | `commands/_shared/help.ts:29` `printGlobalHelp` references `architect-data-api` skill for agent environments — useful, but the help text is not tested and the reference only appears at runtime                                                                                                  | `src/cli/commands/_shared/help.ts:29-31`           |

---

## 4. The 4 `@skip` Scenarios

### Inventory

| Feature file                    | Line | Tag(s)              | Scenario                                             |
| ------------------------------- | ---- | ------------------- | ---------------------------------------------------- |
| `cli-flag-parsing.feature`      | 41   | `@skip @validation` | `--format with an unknown value is rejected`         |
| `cli-flag-parsing.feature`      | 49   | `@skip @negative`   | `rules subcommand rejects conflicting filters`       |
| `cli-output-formatting.feature` | 42   | `@skip @happy-path` | `markdown format emits a markdown heading on stdout` |
| `cli-output-formatting.feature` | 50   | `@skip @contract`   | `deprecation warnings appear only on stderr`         |

### Scenario Analysis

**Skip 1: `--format with an unknown value is rejected` (`cli-flag-parsing.feature:41`)**

Why skipped: The scenario expects `stderr mentions "Invalid" and "format"` (Zod-shaped diagnostic). The current CLI emits `"--format must be compact or json"` (a plain string from `parseSchemaValue` at `schemas.ts:164`). This is the direct consequence of H-CLI-Q-7 (`parseSchemaValue` swallows the `BoundaryParseError.cause`): the Zod-shaped `Invalid enum value` message is lost and replaced by the hard-coded string.

Recipe: Fix H-CLI-Q-7 first (`parseSchemaValue` should rethrow as `BoundaryParseError` preserving `.cause`), then update the step assertion to match the actual Zod error shape. Do not delete this scenario — it is a valid contract specification for how flag-rejection should work.

**Skip 2: `rules subcommand rejects conflicting filters` (`cli-flag-parsing.feature:49`)**

Why skipped: The scenario expects `stderr mentions "pattern and productArea cannot be used together"` (camelCase). The CLI emits `"--pattern and --product-area cannot be used together"` (hyphenated). The implementation lives in `commands/reporting.ts` (the `rules` command validate logic). This is a documentation-contract mismatch — the CLI is correct; the scenario was written with the wrong expected message format.

Recipe: Fix the scenario assertion to match the actual emitted text (`--pattern and --product-area`), or align the CLI message to the camelCase naming convention. Either is a 1-line fix. This scenario should be unblocked immediately — it is testable today with the right assertion text.

**Skip 3: `markdown format emits a markdown heading on stdout` (`cli-output-formatting.feature:42`)**

Why skipped: The CLI's `--format` flag on the `architect` bin accepts only `compact` and `json` (`RenderFormatSchema` values). There is no `markdown` renderer exposed through the `architect` CLI subcommand surface today. The projection package has `renderMarkdown` but it is not wired to a `--format markdown` flag in `pattern-graph-cli.ts`.

Recipe: This is an aspirational scenario for a feature that does not yet exist. Options: (a) delete the scenario and open a design spec for `--format markdown` support, (b) mark it `@wip` with an implementation spec reference, (c) keep as `@skip` if the feature is roadmapped. Per no-BC doctrine, deleting a `@skip` scenario that specifies unimplemented behavior is acceptable. Recommend **deletion or promotion to Architect State (`architect/specs/`)** rather than living as a dead test.

**Skip 4: `deprecation warnings appear only on stderr` (`cli-output-formatting.feature:50`)**

Why skipped: No CLI invocation currently triggers a deprecation warning. The scenario is a contract placeholder for the future. The CLI has a `--category` reject path (`pattern-graph-cli.ts:144-148`) that acts as a hard removal, not a deprecation warning — so even that legacy path doesn't satisfy the scenario.

Recipe: Same as Skip 3 — delete or move to Architect State. A `@skip @contract` scenario that cannot be triggered by any current invocation accumulates as test-file noise. If the contract matters (and for a publish-quality CLI it does), express it in a design spec, not a skipped Gherkin scenario.

### Summary verdict

| Skip                                 | Action                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Skip 1 (`--format invalid`)          | Fix H-CLI-Q-7 first; then fix step assertion. **Do not delete.**                              |
| Skip 2 (`rules conflicting filters`) | Fix assertion string to match current CLI message. **Unblock today** — no code change needed. |
| Skip 3 (`--format markdown`)         | Delete or move to `architect/specs/` as a design spec. Not a test until the feature exists.   |
| Skip 4 (`deprecation warnings`)      | Delete or move to `architect/specs/`. Untriggerable by any current invocation.                |

---

## 5. Documentation Audit

### ADR linkage

Zero ADR or PDR references in any `src/` file. The three applicable ADRs (ADR-006 single read model, ADR-009 projection trust boundary, Zod-first doctrine) are all conformant in the code but unannotated. Contrast guard, which at least puts PDR-005 in source (even if the PDR is phantom). Cli does not have the phantom-reference problem but also has zero doc anchors.

### `@architect-pattern` annotation rate

4 of 26 files annotated (15%): `error-handler.ts`, `pattern-graph-cli.ts`, `runtime-helpers.ts`, `version.ts`. The 22 unannotated files include the entire `commands/` subtree (7 files), all 4 guard shim files, `generate-docs.ts`, `generated-docs-manifest.ts`, `pattern-graph-cli-commands.ts`, `pattern-graph-cli-runtime.ts`, and `pattern-graph-cli-types.ts`. The absence is most glaring in `pattern-graph-cli-commands.ts` (the `COMMANDS` registry — the most architecturally load-bearing file in the package) and `generate-docs.ts` (the second major bin entrypoint).

Family comparison: core 26%, guard 55%, projection 60%, cli **15%** — lowest by a wide margin.

### Help-text audit (all 6 bins)

**`architect --help`** (via `commands/_shared/help.ts:16-32`):

- No phantom PDR/ADR references. Clean.
- "architect query helper" is the stated name — slightly confusing for consumers who expect "architect CLI" or "architect".
- References `architect-data-api` skill at `:29` — useful for agents, opaque for human users. No explanation of what the skill is.
- Verdict: **Low severity cosmetic issue only.**

**`architect-generate --help`** (via `generate-docs.ts:317-340`):

- Lists `--disclosure level: essential, important, useful, advanced` without documenting enum ordinal or what each level means.
- `--filter <status=csv>` is documented with no example of valid status values (e.g., `active`, `completed`). The only example in the help block uses `status=active,completed` — the values are correct but not formally listed.
- No phantom references. Clean.
- Verdict: **Low severity — functional but thin for API consumers.**

**`architect-guard --help`**, **`architect-validate --help`**, **`architect-lint-steps --help`**, **`architect-lint-patterns --help`**:

- These are implemented in guard's `cli/lint-process.ts:170`, `cli/validate-patterns.ts`, etc.
- `lint-process.ts:170` (guard source) contains the phantom `PDR-005` reference that guard Phase 1 flagged as DOC-C-GUARD-1 (user-visible CLI help). This is a **guard finding**, not a cli finding, but it surfaces via the cli's bin. The cli has no way to fix it — it is a pure shim.
- Verdict: The phantom PDR-005 in `architect-guard --help` is owned by guard (DOC-C-GUARD-1). Cli's responsibility is only to ensure the bin shim routes correctly, which it does.

### AGENTS.md coverage of CLI bins

`AGENTS.md:35` lists all 6 bins by name in the package description table. `AGENTS.md:144-148` documents `pnpm architect:query -- <subcommand>` as the canonical invocation pattern. No flag surfaces, exit-code contracts, or per-command usage examples are documented. The `architect-data-api` skill is cited as the canonical reference for verb shapes — this is an intentional delegation, not a gap, since the skill contains the full parity table and verb shapes. However, the skill is agent-only infrastructure; there is no human-readable equivalent for CLI consumers who are not using agent harnesses.

---

## 6. README Status

**Status: ABSENT.** `packages/architect-cli/README.md` does not exist.

Guard is the only other publishable package without a README (DOC-C-GUARD-2 in the guard report). The pattern now spans two packages. The meta-package (`packages/architect/`) has a README (not reviewed yet); projection and core both have READMEs.

### Proposed README outline

The cli's README should be minimal — the package is a composition root with no JS API consumers. Proposed structure:

```
# @libar-dev/architect-cli

Thin composition root exposing 6 CLI bins for the Architect pattern-graph toolchain.

## Bins

| Bin | Purpose |
|-----|---------|
| `architect`                | Query the pattern graph (24 subcommands) |
| `architect-generate`       | Generate documentation from the pattern graph |
| `architect-guard`          | Process-guard FSM enforcement (delegates to architect-guard) |
| `architect-validate`       | Pattern validation (delegates to architect-guard) |
| `architect-lint-steps`     | Step-lint enforcement (delegates to architect-guard) |
| `architect-lint-patterns`  | Pattern-lint enforcement (delegates to architect-guard) |

## Quick start

npm install @libar-dev/architect-cli
architect --help
architect-generate --help

## architect subcommands

[One-line description of each of the 24 commands or a link to architect --help]

## Exit codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Error (parse error, config error, or command failure) |
| 2    | Boundary parse error (BoundaryParseError from Zod validation) |

## JS API

The package exports isDocError, formatDocError, and handleCliError from dist/index.js.
These are utility functions for consumers who want to handle DocError instances from
architect-core in their own CLI wrappers. Note: the package has no external consumers
of this API as of 2.0.0-pre.1 and may be removed if no consumer emerges (see H-CLI-1).
```

Note: given H-CLI-1 (the 3 exported functions have no external consumers), the README should document the JS API only minimally and flag it as potentially ephemeral. Per no-BC doctrine, deleting unused exports is the right move before 1.0 — the README should not over-invest in documenting dead surface.

---

## 7. CLI Help-Text Audit (Detailed)

### `architect` bin help (runtime)

`commands/_shared/help.ts` builds help dynamically from `COMMANDS[name].helpSignature` entries. Each command has a `helpSignature` in its `CommandDef`. The help output structure is sound (table-driven, no hardcoded strings).

No phantom document references found anywhere in `src/cli/*.ts`. (Zero ADR/PDR strings in the entire `src/` tree.)

The `--format` flag is listed in `GLOBAL_OPTIONS` at `help.ts:4-14` but the enumeration of accepted values (`compact`, `json`) does not appear in the global help. A user who invokes `architect overview --format yaml` gets an error message (`--format must be compact or json`) from `schemas.ts:164` but has no prior indication from `--help` that `yaml` is invalid.

### `architect-generate` bin help (static string)

`generate-docs.ts:317-340` is a static string — not table-driven. Alignment with the actual flag set:

| Flag documented            | Implemented | Notes                                  |
| -------------------------- | ----------- | -------------------------------------- |
| `-b, --base-dir`           | Yes         |                                        |
| `-i, --input`              | Yes         |                                        |
| `-g, --generators`         | Yes         |                                        |
| `-o, --output`             | Yes         |                                        |
| `-f, --overwrite, --force` | Yes         | `--force` is an alias — not documented |
| `--disclosure`             | Yes         | Enum values documented but no ordinal  |
| `--filter`                 | Yes         | Format shown in example only           |
| `--list-generators`        | Yes         |                                        |
| `-h, --help`               | Yes         |                                        |
| `-v, --version`            | Yes         |                                        |

No phantom references. No flags present in help but absent from implementation, or vice versa. **Clean.**

### Runtime-bridge dist-check error message

`runtime-bridge.js:14-16`:

```
Missing runtime artifact: ${relativePath}. Run "pnpm --filter @libar-dev/architect-cli build" first.
```

This message is correct, actionable, and citable. It is the family's only pre-flight dist-existence diagnostic. The message is not tested — if the string changes, nothing breaks until a developer hits the real missing-dist scenario.

---

## 8. `runtime-bridge.js` Coverage

`runtime-bridge.js` provides two behaviors:

1. **Happy path:** `resolveBuiltEntrypoint` + `runArchitectCliEntrypoint` chain that loads `dist/cli/*.js` via dynamic import.
2. **Error path:** `fs.existsSync(distPath) === false` throws an `Error` with the helpful build instruction.

**Happy path:** exercised implicitly by every subprocess test (all 5 subprocess scenarios run through `bin/architect.js → runtime-bridge.js → dist/cli/pattern-graph-cli.js`). The bridge is loaded and succeeds each time the test suite passes.

**Error path:** zero tests. There is no scenario that stubs `fs.existsSync` or removes `dist/` and asserts the error message. The POSIX-only `pathname` issue at `runtime-bridge.js:6` (`new URL(import.meta.url).pathname` produces `/C:/...` on Windows) is also untested.

**Comparison to guard's smoke script:** Guard has `scripts/packed-dangling-baseline-smoke.mjs` that validates dist-resource presence post-pack. Cli has no equivalent — the `runtime-bridge.js` guard is the nearest analog but it only runs at bin-invocation time, not at pack time. A `scripts/smoke.mjs` for cli (parallel to guard's script) would catch the "dist not built before publish" class of error.

---

## 9. Action Plan (ordered by leverage)

### Immediate (no code change required)

1. **Fix Skip 2** (`rules conflicting filters`) — update the step assertion from camelCase to hyphenated format. 1-line fix; unblocks a scenario that is already testable.

### Short-term (1-3 hours each)

2. **Create `README.md`** using the outline in section 6. Template from projection's README. Address H-CLI-1 by documenting the JS API as potentially ephemeral. Close DOC-C-CLI-1.

3. **Delete Skip 3 and Skip 4** (`markdown format`, `deprecation warnings`) or move to `architect/specs/`. Neither is testable today; both are aspirational placeholders. Close by deletion per no-BC doctrine (pre-1.0, spec debt is unwanted).

4. **Add `architect-generate` smoke scenario** — add one happy-path subprocess invocation of `architect-generate --list-generators` to the test suite. Does not require fixtures; the dogfood config has a valid generator list. Closes TC-C-CLI-2 partially.

5. **Add guard-bin smoke scenarios** — add one subprocess invocation for each of `architect-guard --help`, `architect-validate --help`, `architect-lint-steps --help`, `architect-lint-patterns --help`. Trivial; each exits zero and writes to stdout. Closes TC-H-CLI-5.

### Medium-term (depends on H-CLI-Q-7 fix)

6. **Fix H-CLI-Q-7** (`parseSchemaValue` cause-swallowing at `schemas.ts:115-121`) — rethrow as `BoundaryParseError` with `.cause`. Then unblock Skip 1 by fixing the step assertion to match the Zod error shape.

7. **Add `error-handler.ts` type-link** — replace `knownTypes` string array with `type DocErrorType = DocError['type']` + typed const array. Closes TC-H-CLI-2 structural risk.

8. **Add fixture-based invocation dir** — create a minimal fixture `architect.config.ts` in `tests/fixtures/` and spawn some subprocess tests against it instead of `dogfoodRoot`. Closes TC-H-CLI-1 corpus coupling.

### Annotation sweep (low effort, high doctrine value)

9. **Annotate `pattern-graph-cli-commands.ts`** with `@architect-pattern PatternGraphCLIRegistry` — the 24-command registry is the most architecturally significant file in the package and has no annotation.

10. **Annotate `generate-docs.ts`** with `@architect-pattern DocumentationGeneratorCLI`.

11. **Annotate the `commands/` subtree** — each command module (`lifecycle.ts`, `meta.ts`, `planning.ts`, `read.ts`, `reporting.ts`) should have a `@architect-pattern` annotation. This moves annotation rate from 15% to ~35%.

---

## 10. Corrections to Phase 1 Findings

| Phase 1 finding                                             | Status              | Correction                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-CLI-7 (4 guard bin shims bypass `runtime-bridge.js`)      | **Closed**          | All 6 bins now route through `runtime-bridge.js`. Verified at `bin/architect-guard.js`, `bin/architect-validate.js`, `bin/architect-lint-steps.js`, `bin/architect-lint-patterns.js`.                                                                                                                                                   |
| L-CLI-6 (`tests/features/.DS_Store` present)                | **Closed**          | `.DS_Store` absent from `tests/features/` as of review date.                                                                                                                                                                                                                                                                            |
| H-CLI-T-2 ("three of four feature files have `@skip` tags") | **Corrected count** | Exactly 4 scenarios across 2 feature files are `@skip` (2 in `cli-flag-parsing.feature`, 2 in `cli-output-formatting.feature`). `cli-command-resolution.feature` and `cli-invocation-dir.feature` have zero skipped scenarios. The count of skipped scenarios (4) is correct; the "three of four files" characterization was imprecise. |

---

## Numbers

- **Active scenarios:** 10 (3 in command-resolution, 1 in flag-parsing, 1 in output-formatting, 3 in invocation-dir + 2 newly confirmed since Phase 1 from `arch dangling` scenario wiring).
- **Skipped scenarios:** 4 (2 fixable, 2 candidates for deletion).
- **Commands tested end-to-end:** 2 of 24 (8%).
- **Src files with any test coverage:** ~4 of 26 (15% — matching annotation rate by coincidence).
- **`@architect-pattern` annotation rate:** 4 of 26 files (15%).
- **ADR references in src:** 0.
- **Phantom PDR/ADR references in cli-owned help text:** 0 (clean).
- **README:** Absent.
- **Estimated effort to close DOC-C-CLI-1:** 1-2 hours.
- **Estimated effort to close TC-C-CLI-1 for the highest-value missing commands:** 4-8 hours (adding 10 subprocess scenarios for the most user-facing commands: `status`, `context`, `rules`, `list`, `pattern`, `scope-validate`, `handoff`, `tags`, `sources`, `search`).
