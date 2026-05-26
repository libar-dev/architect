# Session 10 — Connect remaining test features via @architect-implements (WS-1 expansion)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then `../DECISIONS.md`
> (esp. **D-10**, **D-12**). Load skills `architect-base`, `architect-data-api`,
> `architect-refactor-session`.

> **ADR grounding:** `adr-003` RULE 4 — `@architect-implements` is UML realization,
> many-to-one, authored on the **test `.feature`**; it is the SANCTIONED de-orphaning edge
> (NOT the "never author reverse edges" rule, which is only about derived `usedBy`/`enables`).

## Goal

De-orphan the **3 connectable test-feature orphans**. Total orphans 35 → 32. Add a
feature-level `@architect-implements:<ProductionPattern>` to each.

| Feature file                                                        | Test pattern (status)                 | Implements →          | Basis (verified)                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/features/api/context-assembly/compact-text-renderer.feature` | CompactTextRendererTests (`active`)   | `CompactTextRenderer` | step file imports `renderCompactText` from `@libar-dev/architect-projection`; that module is `@architect-pattern CompactTextRenderer` |
| `tests/features/cli/lint-process.feature`                           | LintProcessCliBehavior (`completed`)  | `LintProcessCLI`      | D-12 — scenarios run `"lint-process …"` via `runCommand`; 1:1 to `cli/lint-process.ts` = LintProcessCLI                               |
| `tests/features/cli/lint-patterns.feature`                          | LintPatternsCliBehavior (`completed`) | `LintPatternsCLI`     | D-12 — scenarios run `"lint-patterns …"`; 1:1 to `cli/lint-patterns.ts` = LintPatternsCLI                                             |

## Method

Add a single feature-level `@architect-implements:<Pattern>` tag alongside the existing
`@architect-pattern:` / `@architect-status:` tags. **D-10:** both `lint-*` features are
`completed` — but both **already carry** `@architect-unlock-reason:Retroactive-completion-during-rebrand`
(verified), which satisfies the guard's `completed-protection`. Do **not** add a second
unlock-reason. `compact-text-renderer` is `active` — no unlock-reason concern.

## Deferred (genuine no-target — DO NOT connect; the coordinator records these)

`ArchitectPublicContract` (public-contract.feature — API-freeze, broad core+projection
surface), `DocumentationCommandParityBoundaryTests` (cli-mcp-documentation-parity.feature —
CLI↔MCP boundary), `GenerateDocsCli` (generate-docs.feature — no production GenerateDocs
pattern; D-12 boundary), `EmptyEpic` / `ParentEpic` (list-parent-\*.feature — `list --parent`
fixtures with no step implementation). Authoring any of these would be a phantom edge.

## Read-back (mandatory before handing back)

```bash
pnpm architect:query arch orphans   # CompactTextRendererTests, LintProcessCliBehavior, LintPatternsCliBehavior GONE
pnpm architect:query pattern CompactTextRenderer   # implementedBy includes CompactTextRendererTests
pnpm architect:query pattern LintProcessCLI        # implementedBy includes LintProcessCliBehavior
pnpm architect:query pattern LintPatternsCLI       # implementedBy includes LintPatternsCliBehavior
```

Report the edited-file list + read-back output. **Do not run heavy gates or commit** — the
coordinator owns the §6 gate sequence + commit + bookkeeping.

## Out of scope

New code-originated identities for the un-patterned utilities (`RegistryBuilder`,
`SourceMerge`, `TagRegistrySchemas`, `MarkdownBlockParser`) = Session 11. Working-state specs.
