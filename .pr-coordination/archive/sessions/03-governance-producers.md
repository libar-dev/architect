# Session 03 — Connect governance fragment kinds to their producers (WS-1)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first** (mandatory skills +
> API-first discipline), then `../EXECUTION-PLAN.md` §4–§8 and `../DECISIONS.md`
> (esp. **D-7** + **D-8**).

> **STATUS: EXECUTED** (2026-05-25). Edges below are the **verified** set (each
> confirmed against `ProjectionBundle<…>` returns + `kind:'…'` literals + real imports).

## Goal

De-orphan the 7 governance projection-fragment orphans (2nd of 5 contexts).
Two-part model (D-7), both verified against code:

1. **Produced fragments → their producer.** Every `<X>Projection` returns
   `ProjectionBundle<X>` and builds `{ kind: 'X', … }`, so `<X>Projection
@architect-uses <X>` is a true producer→product edge.
2. **`Supporting` helper-bundle.** Here it is **inverted** vs Session 02:
   `GovernanceSupporting` imports only `zod` (a pure source bundle), so the
   import-edge trick yields nothing. It is de-orphaned by **incoming** edges from
   the producers that import its schemas (`BusinessRulesProjection` imports
   `BusinessRuleGroupingSchema`; `TaxonomyDigestProjection` imports `TagEntry`/
   `TagGroupEntry`). The D-7 model is direction-agnostic — follow the real import.

**D-8 (load-bearing):** the parser keeps only ONE `@architect-uses` line per pattern.
**Extend the existing comma-separated line** — never add a second `@architect-uses`
line. After authoring, **read back via the Data API** before gates.

## API-first investigation (model the behaviour — done before editing)

```bash
pnpm -s architect:query arch orphans | jq -r '.data[] | select(.file|test("governance")) | .pattern'
pnpm architect:query arch bounded-context governance
grep -rn "kind: '" packages/architect-projection/src/projections/ | grep -iE "BusinessRule|Decision|Taxonomy|ValidationRule"
grep -rn "governance/supporting" packages/architect-projection/src/   # GovernanceSupporting consumers
```

The 7 orphans were: `BusinessRule`, `BusinessRuleReference`, `BusinessRuleSet`,
`DecisionCatalog`, `GovernanceSupporting`, `TaxonomyDigest`, `ValidationRuleDigest`.
(`DecisionRecord` is NOT an orphan — Session 01 gave it `@architect-uses BlockSchema`.)
(`ProgressiveGovernance` is a roadmap `.feature` spec, not a projection fragment — out of scope.)

## Scope (this session) — verified edges

Each producer's public `.ts` owns `@architect-pattern <X>Projection` and already
carries `@architect-uses GovernanceProjectionSupport, ProjectionFragmentContracts`
(all `@architect-status completed`). **Extend that one line:**

| Producer pattern (file)                                                   | append to `@architect-uses`                           | builds (verified `kind:`)                               |
| ------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `BusinessRulesProjection` (`governance/business-rules.ts`)                | `BusinessRule, BusinessRuleSet, GovernanceSupporting` | `BusinessRule` (internal:198), `BusinessRuleSet` (×9)   |
| `DecisionCatalogProjection` (`governance/decision-records.ts`)            | `DecisionCatalog, DecisionRecord`                     | `DecisionCatalog` (internal:54), `DecisionRecord` (104) |
| `TaxonomyDigestProjection` (`governance/taxonomy-digest.ts`)              | `TaxonomyDigest, GovernanceSupporting`                | `TaxonomyDigest` (internal:60)                          |
| `ValidationRuleDigestProjection` (`governance/validation-rule-digest.ts`) | `ValidationRuleDigest`                                | `ValidationRuleDigest` (internal:53)                    |

`GovernanceSupporting` is reached by two **incoming** edges: from
`BusinessRulesProjection` (imports `BusinessRuleGroupingSchema`) and from
`TaxonomyDigestProjection` (imports `TagEntry`/`TagGroupEntry`). Verified imports in
`business-rules.internal.ts:16` and `taxonomy-digest.internal.ts:20`.

### Cross-context edge (governance orphan, operational-insights producer)

`BusinessRuleReference` (`fragments/governance/business-rule-reference.ts`) is built
**cross-context** at `operational-insights/index.ts:615` (`kind: 'BusinessRuleReference'`),
inside the `OperationalInsightsProjectionSupport` pattern (one `@architect-uses
ProjectionFragmentContracts` line — **no D-8 multi-line bug present**, contra D-8's
stale "9 lines" note). Extend it to `ProjectionFragmentContracts, BusinessRuleReference`.
Landed here (not deferred to Session 04) because it de-orphans a **governance** fragment.

## Out of scope (defer to later sessions, one context each)

- operational-insights, delivery-reporting, execution-context (same two-part model;
  verify producers/imports fresh — do not assume symmetry).
- Cluster D (`ExtractedPattern`, core package). Any `Rule:`/invariant authoring;
  any non-projection package. `ProgressiveGovernance` roadmap spec.

## Gates (before commit) — full sequence in `../EXECUTION-PLAN.md §6`

Includes `git add <edited files> && pnpm architect:guard --staged`. `docs:all` will
change `docs-live/` (new edges) — regenerate and commit it.

## Acceptance (met)

- `arch orphans` governance-fragment count → **0** (total 86 → 79).
- `pattern BusinessRule` → `usedBy: [BusinessRulesProjection]`; `dep-tree BusinessRule`
  → `BusinessRule ← BusinessRulesProjection`.
- `arch dangling --strict` exit 0; `architect:guard --staged` passes (0 status transitions).

## On completion

Append a <20-line entry to `../SESSION-REPORTS-AND-LEARNINGS.md`; bump `../state.json`
(orphan metrics, `lastCommit`, next session = operational-insights producers).
