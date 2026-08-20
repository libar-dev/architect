# Navigability + Trust + Core-Annotate — implementation blueprint

> Campaign-scoped, ephemeral. Derived from the design workflow (`wf_c9fee317-394`). Full per-cluster design specs (exact edits, new contracts, executable-spec changes) live in `.pr-coordination/NAVIGABILITY-DESIGN.json` — slice by cluster with `jq '.specs[] | select(.cluster | startswith("N1"))'`. Delete when the chunk lands.

## Scope (user-selected: navigability + trust + core-annotate; net-new verbs + broad REMOVE/prune deferred)

| Key    | Cluster                                                                                                                                                                                                   | Breaking?                                                | docs-live ripple |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------- |
| **N1** | dep-tree → smart **bidirectional** transitive dependency-context (upstream `dependsOn` + downstream `usedBy`, focal-rooted, no `--direction` flag). Closes dep-tree-direction **and** reverse-dependents. | YES (fragment-kind `DependencyTree`→`DependencyContext`) | yes              |
| **N2** | resolve `rules`/`bundle`/`context`/`files` through `implementedBy` (reverse-trace from a TS pattern surfaces its specs' rules+scenarios)                                                                  | no                                                       | no               |
| **N3** | ADR→enforcing-rule navigability: `rules --decision <ADR>` + navigable `enforcesDecisions`/`enforcedBy` edges + neighborhood `seeAlso`                                                                     | no                                                       | yes              |
| **T1** | one canonical (derived) package key + **fail-loud** `--package`/`arch packages` filters                                                                                                                   | YES (`--package` value-space scoped→unscoped)            | no               |
| **T2** | status-vocabulary reconciliation — `StatusFilterSchema` accepts the normalized `planned` bucket for filtering, separate from the FSM schema                                                               | no                                                       | no               |
| **T3** | populate `documentation traceability` from `implementedBy` edges + a docs:all degenerate-generator guard (**hook deferred**)                                                                              | no                                                       | yes              |
| **A1** | substantive decider/read-api invariants + hoist jsdoc-boilerplate audit to scan architect-core                                                                                                            | no                                                       | yes              |
| **A2** | navigable ADR-006↔PatternGraph edge + schema-contract-vs-runtime-read-model JSDoc                                                                                                                         | no                                                       | yes              |

## Lanes & global order

- **L0 — kernel contracts (architect-core), SEQUENCED, gates everything.** `pattern-graph-api.ts` contended by 6 clusters → single sequenced owner. Internal order: A2 JSDoc body → N3 enforces-decision tag/schema/parser/reverse-edge → N1 `getDependencyContext` + N2 `rule-aggregation` + N3 `getRulesByDecision`/`getPatternsByDecision` + T1 `listPackages` + neighborhood `seeAlso`/`enforcedBy` → T2 `StatusFilterSchema` → A1 boilerplate-JSDoc delete on shared core files. **architect-core must build green before any other lane.**
- **L1 — pattern-relations projection** (N1 dep-context rewrite+rename FIRST, then N3 seeAlso-walk + neighborhood) **∥ L3 — delivery-reporting** (T3 traceability populate + degenerate-guard module; **generate-docs.ts hook DEFERRED**). File-disjoint → parallel.
- **L2 — governance + CLI/MCP** (heavy contention: `business-rules.internal.ts` triple-shared T1→N2→N3 branch-on-scope; `structured.ts` QUERY_METHODS one consolidated append; `schemas.ts`/`meta.ts`/`read.ts` T1+T2+N3; N1 dep-tree CLI/MCP wiring in lockstep with the fragment rename).
- **L4 — executable specs + remaining annotations** (each cluster's `.feature`/`.steps`, A1 audit-hoist/fsm-feature/decider, A2 ADR-006 see-also, N3 api-reference `@architect-enforces-decision`). Internally parallel — disjoint spec files.
- **DOCS-LIVE-REGEN** — single `pnpm docs:all` over the unified tree, then determinism check. LAST, once.

## Load-bearing risks (mitigations baked into lane prompts)

1. `pattern-graph-api.ts` 6-cluster contention → single L0 owner, all method-appends in one pass.
2. T2 `StatusFilterSchema` MUST NOT touch `ProcessStatusSchema` (FSM) or `AcceptedStatusSchema` (authored-tag) — else `isValidTransition` + FSM specs break.
3. N3 `RelationshipEntrySchema` strictObject add → optional fields + populate in resolver, update every producer.
4. `business-rules.internal.ts` triple-edit → branch-on `options.scope`, never wholesale rewrite.
5. T3 degenerate-guard would red-fail roadmap/current-work (no cluster repopulates them) → ship guard module + spec, **defer** the generate-docs.ts hook wiring.
6. N1 breaking fragment-kind → migrate renderer dispatch + CLI (`reporting.ts`) + MCP (`tool-registry.ts`) + barrels in the same merge.
7. T1 breaking `--package` value-space → rewrite the dogfood CLI spec in L4.
8. Perf gate: N1 closure reuses `relationshipIndex` (no per-node scans); N3 seeAlso-walk scoped to adr-bearing patterns.
9. Determinism: single `pnpm docs:all` last over the merged N1+N3+T3+A1+A2 ripple.

## Execution

- **WF-Impl-1** = L0 (this run). Review manifest: is architect-core green + contracts as spec'd?
- **WF-Impl-2** = L1∥L3 → L2 → L4 → verify (docs:all once + full gates + dangling + perf + re-dogfood the closed gaps).
- Baseline left **uncommitted** per user; new work organized for grouped commit at the end.
