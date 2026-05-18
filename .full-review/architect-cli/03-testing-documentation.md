# architect-cli — Phase 3 Consolidated: Testing & Documentation

**Source:** `raw/3-testing-documentation.md` (combined test-coverage + documentation single-agent pass).

## Headline

**Cli has the worst test coverage in the family for its role.** Only 2 of 24 `COMMAND_NAMES` have end-to-end tests (`overview`, `arch dangling`). The entire `architect-generate` bin (~670 LOC including the C-CLI-1 hand-rolled argv parser) has **zero tests of any kind**. `@architect-pattern` annotation rate is **15% (4 of 26 files)** — **lowest in the family** (projection 60%, guard 55%, core 26%).

## Critical findings

| #           | Issue                                                                                                                                                                                                                                                                                                       | Location |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TC-CLI-C-1  | **22 of 24 commands have zero tests.** Untested: `status`, `context`, `rules`, `list`, `pattern`, `dep-tree`, `files`, `scope-validate`, `handoff`, `query`, `documentation`, `bundle`, `search`, `tags`, `taxonomy`, `sources`, `unannotated`, `open-questions`, `diagnostics`, `repl`, `help`, `version`. |
| TC-CLI-C-2  | **`generate-docs.ts` (~670 LOC) zero tests** — including the C-CLI-1 argv parser and the C-CLI-2 duplicated filter helpers.                                                                                                                                                                                 |
| TC-CLI-C-3  | `runtime-bridge.js` missing-dist error path exercised in production on every bin invocation but never in CI. Closing TC-H-GUARD-7 family-wide (via `pack-smoke.mjs` workspace promotion) covers this.                                                                                                       |
| TC-CLI-C-4  | `error-handler.ts` 12-discriminator `isDocError` has no compile-time link to core's `DocError` union — silent drift risk. Same recipe as H-CLI-2 / DocErrorTypeSchema.                                                                                                                                      |
| DOC-CLI-C-1 | **No package README** — cli joins guard as the only two publishable packages without one.                                                                                                                                                                                                                   |

## The 4 `@skip` scenarios (resolution)

| #                                     | Recipe                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Skip 1 — `--format invalid` rejection | Blocked by H-CLI-Q-7 (`parseSchemaValue` swallows `BoundaryParseError.cause`). Fix the swallowing, then unblock. Do not delete. |
| Skip 2 — `rules conflicting filters`  | Step file assertion expects camelCase; CLI emits hyphenated. **1-line fix unblocks today, no code change.**                     |
| Skip 3 — `--format markdown`          | `markdown` renderer not wired to `architect` bin. **Aspirational placeholder; delete or promote to design spec.**               |
| Skip 4 — `deprecation warnings`       | No invocation triggers it. **Untriggerable; delete or promote.**                                                                |

## Documentation

- **No README** (DOC-CLI-C-1). Cli + guard are the only publishable packages without one.
- **Help-text is clean**: zero phantom PDR/ADR references in any cli-owned help output. (The phantom PDR-005 in `architect-guard --help` is guard's DOC-C-GUARD-1, not cli's.)
- **`@architect-pattern` annotation rate: 15%** (lowest in family).
- **Zero ADR references in source.** Conformance is real but invisible to tooling.
- AGENTS.md and repo README cover the 6 bins at the family level — usable but not a substitute for a package README.

## What was closed by Phase 1 vs verified clean

- **H-CLI-7 closed:** all 6 bin shims now route through `runtime-bridge.js` (confirmed by inspection).
- **L-CLI-6 clean:** no `.DS_Store` in test features.

## Critical context for Phase 4 / master report

- The TS strictness fixes from Phase 2 don't help unless tests are added behind them. Coverage backfill is essential.
- The 22 untested commands + the entire `generate-docs.ts` represent the largest test gap in the family by absolute LOC.
- `tests/support/run-cli.ts` already exists as a real-subprocess CLI harness — it's the right test infrastructure; just not extended to cover the 22 commands.
