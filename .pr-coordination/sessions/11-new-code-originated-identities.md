# Session 11 — New code-originated identities (WS-1 expansion, D-13)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then `../DECISIONS.md`
> (esp. **D-3**, **D-9**, **D-10**, **D-13**). Load skills `architect-base`,
> `architect-data-api`, `architect-refactor-session`.

> **ADR grounding:** D-3 — code-originated `@architect-pattern` identity is legitimate for
> shipped data/utility contracts with no behavioral feature (matching `ExtractedPattern`,
> `BlockSchema`). The identity goes on the production `.ts`; the executable test realizes it
> via `@architect-implements` (ADR-003 RULE 4). **De-orphaning fact (verified,
> graph-inventory.ts:154-155):** `implementedBy` counts as a relationship, so each new
> identity is non-orphan the instant a test feature implements it — **no `@architect-uses`
> edge needed.**

## Goal

Create **4 new code-originated identities** + the **5 `@architect-implements` edges** that
realize them, de-orphaning 5 test features (incl. all 3 D-9 deferrals). Total orphans
32 → 27. **Identity + implements edges in the SAME commit** (the coordinator commits; you
just edit + read back) — else `dangling --strict` trips on the not-yet-existing target.

## Part A — add 4 file-level `@architect-pattern` JSDoc blocks (production `.ts`)

Each target file currently has **no** top JSDoc block (starts with `import`). Prepend a
block at the very top, **mirroring the exact tag style of**
`packages/architect-core/src/validation-schemas/extracted-pattern.ts` (lines 1-20) —
`@architect-pattern <Name>` (space), `@architect-status active` (space), `@architect-role:<x>`
(colon), `@architect-bounded-context:<x>` (colon), then a `## <Name> - …` heading + a 2-4
line description.

| File                                                             | `@architect-pattern`  | `@architect-role:` | `@architect-bounded-context:` |
| ---------------------------------------------------------------- | --------------------- | ------------------ | ----------------------------- |
| `packages/architect-core/src/taxonomy/registry-builder.ts`       | `RegistryBuilder`     | `utility`          | `configuration`               |
| `packages/architect-core/src/config/merge-sources.ts`            | `SourceMerge`         | `utility`          | `configuration`               |
| `packages/architect-core/src/validation-schemas/tag-registry.ts` | `TagRegistrySchemas`  | `contract`         | `validation-schemas`          |
| `packages/architect-core/src/utils/markdown-parser.ts`           | `MarkdownBlockParser` | `codec`            | `rendering`                   |

All four `@architect-status active`. Roles/contexts are pre-verified (D-13) — all reuse
existing contexts. Do **not** add `@architect-uses` edges (not needed for de-orphaning; the
`registry-builder ↔ tag-registry` import is mutually circular, so an edge would be ugly).

## Part B — add 5 `@architect-implements` tags (test `.feature`)

Add a file-level `@architect-implements:<Pattern>` tag (colon form, matching each file's
existing `@architect-pattern:` style) in the tag block before `Feature:`.

| Feature file                                                                     | Test pattern (status)                          | implements →          |
| -------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------- |
| `tests/features/api/stub-integration/taxonomy-tags.feature`                      | StubTaxonomyTagTests (`active`)                | `RegistryBuilder`     |
| `packages/architect-core/tests/features/types/tag-registry-builder.feature`      | TypeScriptTaxonomyImplementation (`completed`) | `RegistryBuilder`     |
| `packages/architect-core/tests/features/config/source-merging.feature`           | SourceMerging (`completed`)                    | `SourceMerge`         |
| `packages/architect-core/tests/features/validation/tag-registry-schemas.feature` | TagRegistrySchemasValidation (`active`)        | `TagRegistrySchemas`  |
| `tests/features/generation/load-preamble.feature`                                | LoadPreambleParser (`active`)                  | `MarkdownBlockParser` |

**D-10:** the two `completed` features (`tag-registry-builder.feature`,
`source-merging.feature`) **already carry** an `@architect-unlock-reason` — do **not** add a
second. The other three are `active`.

## Read-back (mandatory before handing back)

```bash
pnpm architect:query arch orphans   # the 5 test features GONE; total ~27; no new identity appears as orphan
pnpm architect:query pattern RegistryBuilder      # resolves; role:utility; implementedBy = StubTaxonomyTagTests, TypeScriptTaxonomyImplementation
pnpm architect:query pattern SourceMerge          # resolves; implementedBy = SourceMerging
pnpm architect:query pattern TagRegistrySchemas   # resolves; implementedBy = TagRegistrySchemasValidation
pnpm architect:query pattern MarkdownBlockParser  # resolves; implementedBy = LoadPreambleParser
```

Report the edited-file list + read-back output, and **confirm none of the 4 new identities
appear in `arch orphans`**. **Do not run heavy gates or commit** — the coordinator owns the
§6 gate sequence + commit + bookkeeping.

## Out of scope

The terminal-floor orphans (~22 working-state specs + 5 untargetable integration/fixture
features) — documented, not forced. WS-2 (skills) / WS-3 (docs) are the next workstreams.
