# Session reports and learnings

> Append-only log. One entry per session. Keep entries tight (< 20 lines).

## Session 00 — Campaign bootstrap (planning, no code)

Diagnosed the graph: 270 patterns, 107 orphans (40%) — projection 49, specs 32,
core 24, guard 2; role 64%, bounded-context 58%, `@architect-shape` ~absent.
Root cause: ~30 refactoring PRs kept pattern identity but stripped edges/shapes/
invariants. Confirmed scope with maintainer (D-1..D-5). Authored this package.
No production code touched.

**Rules for upcoming sessions**

1. Edges first; classification is mostly present in projection — don't re-tag what exists.
2. Author edge-target identity (Cluster B/D) before edges that reference it, or same commit — `arch dangling` is strict.
3. Add `Rule:` invariants only where architecturally significant; no ceremonial rules.
4. `.scratch/` is invisible to fresh sessions — keep everything needed inside `.pr-coordination/`.

## Session 01 — Projection renderer spine + block primitives (uncommitted in tree)

Cluster A (5 renderer/dispatch files) + Cluster B (`BlockSchema` new identity +
5 fragment consumers). Projection orphans **49 → 40**, total **107 → 98**.
All gates green (build, format:check, lint, typecheck, typecheck:dogfood, test,
test:dogfood 1057, validate:all, arch dangling 0, perf, audit:subtractive).
`docs:all` regenerated PATTERNS/ARCHITECTURE/CHANGELOG + manifest — commit with the code.

**Additional scope discovered:** the planned prompt asserted a uniform
"all 4 renderers → FragmentRendererDispatch" edge. **`JsonRenderer` does not use
dispatch** (generic serialization) — adding it would have been a false edge.
Also `MarkdownRenderer` + `UiRenderer` (not just markdown) import `Block` → both
get `BlockSchema`. **Resolution:** inline — verified every edge against imports;
corrected `sessions/01` + EXECUTION-PLAN §5 to the per-file verified set.

### Rules for upcoming sessions

1. **Verify every `@architect-uses` edge against the file's actual imports.** Never
   assume sibling files (renderers, fragments) have identical dependencies. A
   plausible-but-false edge is worse than a missing one — it lies to the graph.
2. `@architect-uses` is **space-separated, no colon** (`@architect-uses A, B`).
   `@architect-role:` / `@architect-bounded-context:` use a colon. Do not mix.
3. Adding a new code-originated identity (e.g. `BlockSchema`) or new edges changes
   `docs-live/` — regenerate via `pnpm docs:all` and commit it in the same change.

## Session 02 — Connect pattern-relations fragments to producers (uncommitted in tree)

D-7 two-part model applied to all 10 pattern-relations orphans: 8 producers got a
producer→fragment edge (9 fragments; `DependencyEdgeProjection` produces both
`DependencyEdge` + `DependencyEdgeSet`), and `PatternRelationsSupporting` got an
import edge (`Deliverable, DeliverableManifest`). Projection pattern-relations
orphans **10 → 0**; total **98 → 86** (the Supporting edge also de-orphaned
`Deliverable` + `DeliverableManifest`). All 13 gates green; guard `--staged`:
13 modified, **0 status transitions** (confirms D-6 on 8 `completed` patterns),
passed. `arch dangling --strict` count 0, no drift. `docs:all` updated
ARCHITECTURE/PATTERNS/CHANGELOG/manifest — staged with the code.

**Additional scope discovered (inline-fixed + recorded as D-8):** the planned
method ("append a **new** `@architect-uses` line") is **wrong** — the parser keeps
only ONE `@architect-uses` line per pattern; a second line is silently dropped.
First attempt left all 9 fragments orphaned (caught by Data-API read-back before
gates). Fixed inline by **extending the existing comma-separated line**. Same bug
already breaks 5 pre-existing patterns (see D-8) — deferred to their owning
sessions.

### Rules for upcoming sessions

1. **One `@architect-uses` line per pattern, comma-separated.** Extend the existing
   line; never add a second `@architect-uses` line (it's dropped). See **D-8**.
2. **Read back via the Data API after authoring edges** (`pattern <X>` →
   `uses`/`usedBy`, or `arch orphans`) **before** running gates. "Annotation in the
   file" ≠ "edge in the graph." This caught the multi-line bug cheaply.
3. Next context = **governance** (`BusinessRule`, `BusinessRuleSet`,
   `BusinessRuleReference`, `DecisionCatalog`, + its `*Supporting` bundle). Re-verify
   producers/imports fresh — do not assume symmetry with pattern-relations.
4. Coordinator: fix the "append a new line" wording in EXECUTION-PLAN §5 +
   remaining `sessions/NN-*.md` to "extend the existing line" (D-8).

## Session 03 — Connect governance fragments to producers (uncommitted in tree)

D-7 model applied to all 7 governance projection orphans. 4 producers got
producer→fragment edges (`BusinessRulesProjection`→`BusinessRule,BusinessRuleSet`;
`DecisionCatalogProjection`→`DecisionCatalog,DecisionRecord`;
`TaxonomyDigestProjection`→`TaxonomyDigest`; `ValidationRuleDigestProjection`→
`ValidationRuleDigest`). `GovernanceSupporting` (imports only zod) de-orphaned by
**incoming** edges from the 2 producers that import its schemas — the inverse of
Session 02's outgoing-import Supporting model. All edges extended the existing single
`@architect-uses` line (D-8) and **registered first-try** (Data-API read-back: orphans
86→79, `BusinessRule.usedBy=[BusinessRulesProjection]`). All 13 gates green
(1057 dogfood tests, perf 3/3, validate:all, audit:subtractive, arch dangling 0).
`docs:all` → ARCHITECTURE.md +27 (the new edges + derived `enables`).

**Additional scope discovered (inline-fixed):**

1. **Cross-context producer.** `BusinessRuleReference` is a governance fragment but is
   built at `operational-insights/index.ts:615` inside `OperationalInsightsProjectionSupport`.
   Edge landed here (governance session) — a session is scoped by orphans resolved, not
   files touched. Extended that pattern's single `@architect-uses` line.
2. **D-8 "9 lines" note is stale.** `OperationalInsightsProjectionSupport` carries ONE
   `@architect-uses` line at current HEAD, not 9. The latent multi-line bug D-8 warned
   about is **not present** — verified by grep + the edge registering first-try. Session 04
   should still re-confirm via `pattern <X>` but is likely unaffected.

### Rules for upcoming sessions

1. `Supporting` bundles connect in **whichever import direction is real** — outgoing
   (it imports schemas, Session 02) or incoming (it's a pure source bundle imported by
   producers, Session 03 `GovernanceSupporting`). Check the actual imports; don't assume.
2. A fragment's producer may live in a **different bounded-context** — verify via
   `grep "kind: '<Fragment>'"` across all `projections/`, not just the fragment's own context.
3. Next context = **operational-insights** (`AnnotationCoverage`, `OverviewDigest`,
   `RequirementDigest` ×3 producers, `RoleProfile`/`RoleProfileCollection`,
   `SourceInventoryDigest`/`Entry`, `TagUsageMatrix`/`Entry`). Re-verify the D-8 state of
   `OperationalInsightsProjectionSupport` before editing.

## Session 04 — Connect operational-insights fragments to producers (uncommitted in tree)

Committed prior session = `0ec6441`. De-orphaned all 9 operational-insights orphans.
**New topology** vs governance: all producers in one `index.ts`, each its own
`@architect-pattern`; `kind:` literals built in `build*` helpers (under
`OperationalInsightsProjectionSupport`) while public `project*` wrappers return
`ProjectionBundle<X>`. Used the **wrapper** as producer (8 edges:
`AnnotationCoverageProjection`→`AnnotationCoverage`, `OverviewProjection`→`OverviewDigest`,
3× Requirement\*→`RequirementDigest`, `RoleProfileProjection`→`RoleProfile,RoleProfileCollection`,
`SourceInventoryProjection`→`SourceInventoryDigest`, `TagUsageProjection`→`TagUsageMatrix`).
All edges registered first-try (orphans 79→70). 13 gates green.

**Additional scope discovered (inline-fixed):**

1. **Embedded sub-fragments need composition edges, not producer edges.** `TagUsageEntry`
   - `SourceInventoryEntry` have no `ProjectionBundle` wrapper — built in helpers, embedded
     in a parent. Connected via verified schema composition on the parent fragment
     (`TagUsageMatrix`→`TagUsageEntry`, `SourceInventoryDigest`→`SourceInventoryEntry`; both
     parents do `z.array(<Entry>Schema)`). First `@architect-uses` line on those fragments.
2. **D-8 "9 lines" confirmed stale.** `OperationalInsightsProjectionSupport` has ONE
   `@architect-uses` line at HEAD, not 9 — no collapse needed (delivery-reporting's
   `DeliveryReportingProjectionSupport` likely the same; still re-verify in Session 05).

### Rules for upcoming sessions

1. **Three edge shapes now proven:** producer→fragment (wrapper returns `ProjectionBundle<X>`),
   Supporting import-edge (Session 02) / incoming-edge (Session 03), and **fragment→sub-fragment
   composition** (parent schema `z.array(childSchema)`). Pick by what the code actually does.
2. When `kind:` literals sit in helper functions, the producer edge still follows the **public
   `<X>Projection` wrapper's `ProjectionBundle<X>` return type**, not the helper.
3. Next context = **delivery-reporting** (`PhaseProgress`, `StatusDistribution`,
   `RoadmapTimeline`, `ReleaseNotesDigest`, `TraceabilityMatrix`, + `DeliveryReportingSupporting`
   which imports `PatternSummarySchema`/`EmbeddedDeliverableSchema` — outgoing import-edge).
