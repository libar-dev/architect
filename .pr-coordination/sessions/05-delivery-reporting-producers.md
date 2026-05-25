# Session 05 — Connect delivery-reporting fragments to producers (WS-1)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first**, then
> `../EXECUTION-PLAN.md` §4–§8 and `../DECISIONS.md` (esp. **D-7** + **D-8**).

> **STATUS: EXECUTED** (2026-05-25). Edges verified against `ProjectionBundle<…>`
> returns, `kind:'…'` literals, and real schema imports.

## Goal

De-orphan the 6 delivery-reporting projection-fragment orphans (4th of 5 contexts):
`PhaseProgress`, `StatusDistribution`, `RoadmapTimeline`, `ReleaseNotesDigest`,
`TraceabilityMatrix`, `DeliveryReportingSupporting`.

## Producer edges (same split topology as op-insights)

Producers all in `projections/delivery-reporting/index.ts`; `kind:` literals built in
`build*` helpers under `DeliveryReportingProjectionSupport`, public `project*` wrappers
return `ProjectionBundle<X>`. Edge follows the **wrapper**; each carries one
`@architect-uses DeliveryReportingProjectionSupport` line — **extend it** (D-8), anchoring
each edit on its unique `@architect-pattern` name:

| Producer pattern               | `ProjectionBundle<…>` return      | append               |
| ------------------------------ | --------------------------------- | -------------------- |
| `PhaseProgressProjection`      | `<PhaseProgress>` (570)           | `PhaseProgress`      |
| `StatusDistributionProjection` | `<StatusDistribution>` (610)      | `StatusDistribution` |
| `RoadmapTimelineProjection`    | `<RoadmapTimeline>` (651/657/661) | `RoadmapTimeline`    |
| `ReleaseNotesProjection`       | `<ReleaseNotesDigest>` (700)      | `ReleaseNotesDigest` |
| `TraceabilityMatrixProjection` | `<TraceabilityMatrix>` (740)      | `TraceabilityMatrix` |

## Supporting import edge — `Deliverable`, NOT `EmbeddedDeliverable`

`DeliveryReportingSupporting` (`fragments/delivery-reporting/supporting.ts`) imports
`PatternSummarySchema` (→ pattern `PatternSummary`) and `EmbeddedDeliverableSchema`. **The
recon's `EmbeddedDeliverable` target is WRONG — it is not a graph pattern** (`search
EmbeddedDeliverable` → empty). `EmbeddedDeliverableSchema = DeliverableSchema.omit({ kind:
true })`, so the truthful dependency is `Deliverable` (the shape it derives from; Session 02
precedent: import edges follow the symbol's pattern). Authoring `EmbeddedDeliverable` would
trip `arch dangling --strict`. Add `@architect-uses PatternSummary, Deliverable` (new first
line, after `@architect-role:contract`).

## D-8 note

`DeliveryReportingProjectionSupport` has ONE `@architect-uses line`
(`DeliveryReportingFragmentContracts`) at HEAD — D-8's "6 lines" note is stale, no collapse
needed (same as op-insights).

## Out of scope

execution-context (Session 06). Cluster D (`ExtractedPattern`). Any `Rule:`/invariant
authoring; any non-projection package.

## Gates + acceptance (met)

Full §6 sequence. `arch orphans` delivery-reporting count → **0** (total 70 → 64);
`PhaseProgress.usedBy=[PhaseProgressProjection]`;
`DeliveryReportingSupporting.uses=[PatternSummary, Deliverable]`; `arch dangling --strict`
exit 0; `architect:guard --staged` 0 transitions.

## On completion

Append <20-line entry to `../SESSION-REPORTS-AND-LEARNINGS.md`; bump `../state.json`
(orphan metrics, `lastCommit`, next session = execution-context producers).
