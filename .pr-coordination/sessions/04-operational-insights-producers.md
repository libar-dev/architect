# Session 04 — Connect operational-insights fragments to producers (WS-1)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then
> `../EXECUTION-PLAN.md` §4–§8 and `../DECISIONS.md` (esp. **D-7** + **D-8**).

> **STATUS: EXECUTED** (2026-05-25). Edges verified against `ProjectionBundle<…>`
> return types, `kind:'…'` literals, and real schema imports.

## Goal

De-orphan the 9 operational-insights projection-fragment orphans (3rd of 5 contexts):
`AnnotationCoverage`, `OverviewDigest`, `RequirementDigest`, `RoleProfile`,
`RoleProfileCollection`, `SourceInventoryDigest`, `SourceInventoryEntry`,
`TagUsageEntry`, `TagUsageMatrix`. (`OperationalInsightsSupporting` is NOT an
orphan — Session 01 gave it `@architect-uses BlockSchema`.)

## Topology discovered (verify fresh — differs from governance)

All producers live in **one file**, `projections/operational-insights/index.ts`, each
with its own `@architect-pattern`. **The `kind:'…'` literals are built in `build*`
helper functions under `OperationalInsightsProjectionSupport` (lines 3–724); the public
`project*` wrappers (725+) return `ProjectionBundle<X>` and bundle the helper output.**
The truthful producer edge follows the **public `<X>Projection` wrapper** (its declared
`ProjectionBundle<X>` return type) — verified at:

| Producer pattern (`@architect-uses` extended) | `ProjectionBundle<…>` return                              | append                               |
| --------------------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| `AnnotationCoverageProjection`                | `<AnnotationCoverage>` (759)                              | `AnnotationCoverage`                 |
| `OverviewProjection`                          | `<OverviewDigest>` (797)                                  | `OverviewDigest`                     |
| `RequirementDigestProjection`                 | `<RequirementDigest>` (844)                               | `RequirementDigest`                  |
| `RequirementExecutableDigestProjection`       | `<RequirementDigest>` (883)                               | `RequirementDigest`                  |
| `RequirementSpecsDigestProjection`            | `<RequirementDigest>` (920)                               | `RequirementDigest`                  |
| `RoleProfileProjection`                       | `<RoleProfile>` (1107) + `<RoleProfileCollection>` (1114) | `RoleProfile, RoleProfileCollection` |
| `SourceInventoryProjection`                   | `<SourceInventoryDigest>` (1157)                          | `SourceInventoryDigest`              |
| `TagUsageProjection`                          | `<TagUsageMatrix>` (1198)                                 | `TagUsageMatrix`                     |

Each wrapper already carries one `@architect-uses OperationalInsightsProjectionSupport`
line — **extend it** (D-8). 8 identical lines in one file → anchor each edit on its
unique `@architect-pattern` name.

## Embedded sub-fragments → composition edges (not producer edges)

`TagUsageEntry` and `SourceInventoryEntry` have **no `ProjectionBundle` wrapper** — they
are built inside `build*` helpers and embedded in a parent fragment. The truthful edge is
**schema composition on the parent fragment** (verified imports):

- `fragments/operational-insights/tag-usage-matrix.ts` imports `TagUsageEntrySchema`
  (`tags: z.array(TagUsageEntrySchema)`) → add `@architect-uses TagUsageEntry` (new first line).
- `fragments/operational-insights/source-inventory-digest.ts` imports
  `SourceInventoryEntrySchema` (`items: z.array(…)`) → add `@architect-uses SourceInventoryEntry`.

(`RoleProfileCollection` also composes `RoleProfile`, but both are already de-orphaned by
`RoleProfileProjection`, so no composition edge is needed there.)

## D-8 note — `OperationalInsightsProjectionSupport` is NOT multi-line

D-8 warned this pattern carries 9 `@architect-uses` lines (latent bug). **At current HEAD
it has ONE line** (`ProjectionFragmentContracts, BusinessRuleReference` after Session 03).
No collapse needed — confirmed by grep + edges registering first-try. The D-8 "9 lines"
note is stale; treat the parser-keeps-one-line rule as still binding for go-forward edits.

## Out of scope

delivery-reporting, execution-context (later sessions). Cluster D (`ExtractedPattern`).
Any `Rule:`/invariant authoring; any non-projection package.

## Gates + acceptance (met)

Full §6 sequence. `arch orphans` op-insights count → **0** (total 79 → 70);
`RequirementDigest.usedBy` = all 3 producers; `TagUsageEntry.usedBy` = `[TagUsageMatrix]`;
`arch dangling --strict` exit 0; `architect:guard --staged` 0 transitions.

## On completion

Append <20-line entry to `../SESSION-REPORTS-AND-LEARNINGS.md`; bump `../state.json`
(orphan metrics, `lastCommit`, next session = delivery-reporting producers).
