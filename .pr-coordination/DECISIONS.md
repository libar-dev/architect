# Decisions — questions that need human judgment

> Tight entries only. Implementation details live in the session prompt that
> consumes the decision, not here.

## D-1 — WS-1 pilot scope

- **Question:** Which subsystem does the annotation re-enablement pilot target first?
- **Options:** projection/doc-gen pipeline / whole-graph edges-only sweep / core extraction layer.
- **Recommendation:** projection — 49 orphans (highest density), matches the doc-gen goal, cleanest before/after.
- **Consumed by:** sessions/01-projection-renderer-spine.md
- **Status:** resolved (maintainer, 2026-05-25) → projection.

## D-2 — Enrichment depth per pattern

- **Question:** Edges+classification first, or full enrichment (incl. shapes+invariants) per pattern?
- **Options:** edges+classification first then a shapes/rules pass / full enrichment one pattern at a time.
- **Recommendation:** edges+classification first — fastest path to a navigable graph.
- **Consumed by:** EXECUTION-PLAN §3, all WS-1 sessions.
- **Status:** resolved (maintainer, 2026-05-25) → edges + classification first.

## D-3 — Identity for un-patterned shipped abstractions

- **Question:** How to add `ExtractedPattern`, `BlockSchema`, un-patterned codecs to the graph?
- **Options:** code-originated `.ts` `@architect-pattern` / behavioral `.feature` + `@architect-implements` / defer.
- **Recommendation:** code-originated `.ts` identity — they're data contracts, matching how `DocExtractor`/`MarkdownRenderer` are already modeled. Candidates surfaced for approval before each addition.
- **Consumed by:** sessions/01 (BlockSchema), Cluster D (ExtractedPattern).
- **Status:** resolved (maintainer, 2026-05-25) → code-originated. Approve each candidate before creation.

## D-4 — Fragment union membership modeling

- **Question:** Should `ProjectionFragmentSchema` carry `@architect-uses` to all ~44 fragment kinds?
- **Options:** light (edge only into renderer spine; rely on bounded-context) / full (44 edges for complete union navigability).
- **Recommendation:** light — 44 edges is edge-spam; bounded-context already answers "what fragments exist in context X."
- **Consumed by:** sessions/01 (Cluster C).
- **Status:** open — proceeding with light model unless maintainer prefers full.

## D-5 — PR scope

- **Question:** Do annotations + skills + docs land in this PR or split out?
- **Options:** one PR / separate PRs.
- **Recommendation:** —
- **Consumed by:** EXECUTION-PLAN §2.
- **Status:** resolved (maintainer, 2026-05-25) → one PR ("re-enable core functionality"); WS-0/1/2/3 together.

## D-6 — Additive `@architect-uses` on `completed` patterns

- **Question:** Does adding an additive `@architect-uses` edge to a `completed` pattern's source require `@architect-unlock-reason` (FSM reopening)?
- **Options:** require unlock-reason on every completed pattern touched / treat additive enrichment as non-reopening (no unlock-reason).
- **Recommendation:** no unlock-reason — additive enrichment is not a status transition.
- **Evidence:** `pnpm architect:guard --staged` on Session 01's 11 edits (incl. 5 `completed` renderers) → `Status transitions: 0`, `Deliverable changes: 0`, **passed** (exit 0). Aligns with architect-base §8 (production JSDoc is additive, does not gate completion) + `architect-refactor-session` (`@architect-unlock-reason` is only for an actual `completed → active` status change).
- **Consumed by:** all WS-1 sessions (19 of the remaining orphans are `completed`).
- **Status:** resolved (process guard, 2026-05-25) → no unlock-reason for edge-only enrichment. The guard is the arbiter — run `architect:guard --staged` at commit. Add `@architect-unlock-reason` ONLY if a session genuinely flips a `completed` pattern's status or changes its deliverables/invariants.

## D-7 — How to de-orphan the fragment kinds (producer, not barrel)

- **Question:** What truthful edge connects the ~40 orphan fragment kinds (PatternDetail, etc.)?
- **Options:** (a) barrel → members — `<Context>FragmentContracts uses <fragments>`; (b) producer → fragment — each `<X>Projection uses <X>`.
- **Rejected (a):** the barrel (`fragments/<ctx>/index.ts`) is a **pure re-export surface** (`export { X } from './x.js'`, no logic). Declaring it "uses" what it re-exports **inverts the dependency** — a publishing surface depends on nothing; consumers depend on it. This was a false model (caught at review).
- **Chosen (b):** each projection function genuinely **constructs** its fragment — verified: `PatternDetailProjection` returns `ProjectionBundle<PatternDetail>` and builds `kind: 'PatternDetail'`. So `<X>Projection @architect-uses <X>` is a true producer→product edge and answers "what produces PatternDetail?". Additive — keep existing `uses …FragmentContracts/…ProjectionSupport` edges. Some functions produce >1 fragment (e.g. `DependencyEdgeProjection` → `DependencyEdgeSet` + `DependencyEdge`) — verify per function via the return type + `kind:` literals.
- **Carve-out — `Supporting` bundles have no producer:** per-context `*Supporting` fragments (e.g. `PatternRelationsSupporting`, `fragments/<ctx>/supporting.ts`) are **helper-schema bundles**, not produced by any projection function (verified: no `ProjectionBundle<…Supporting>`, no `kind:'…Supporting'`). Connect them via the schemas they **import** (verified: `PatternRelationsSupporting` imports `DeliverableSchema`/`DeliverableManifestSchema` → `@architect-uses Deliverable, DeliverableManifest`), not via a producer.
- **Standing rule:** put **only verified** mappings in a session prompt. Orphan set, producers, and imports are all confirmed against the API + code before they enter a prompt — no predicted rows.
- **Consumed by:** sessions/02-\*.
- **Status:** resolved (verified against code, 2026-05-25) → producer→fragment for produced fragments; import-edge for `Supporting` bundles.

## D-8 — `@architect-uses` MUST be a single comma-separated line (parser keeps only one)

- **Question:** When a pattern already has an `@architect-uses` line, do you add the new edge as a **second `@architect-uses` line** or **extend the existing line**?
- **Discovered (Session 02):** the parser retains **only ONE `@architect-uses` line per pattern** — additional lines are silently dropped. Verified two ways: (1) appending `@architect-uses PatternDetail` as a second line to `PatternDetailProjection` left its graph `uses` unchanged (`["PatternRelationsProjectionSupport","PatternRelationsFragmentContracts"]`, the first line only) and `PatternDetail` stayed orphaned; (2) `OperationalInsightsProjectionSupport` carries **9** `@architect-uses` lines in source but the graph shows `uses: ["ProjectionFragmentContracts"]` — one edge. Root: `ast-parser.ts` `readStringArrayMetadata(metadataResults,'uses')` reads a single metadata value; comma-splitting **within** one line works (proven by Session 01 renderers + `PatternRelationsSupporting`), multi-line accumulation does **not**.
- **Chosen:** **extend the existing `@architect-uses` line** — `@architect-uses Existing1, Existing2, NewFragment`. Never add a second `@architect-uses` line. (This corrects the "append a new `@architect-uses` line" wording in EXECUTION-PLAN §5 and sessions/02 — the coordinator should fix that wording for the remaining context sessions.)
- **Latent breakage (pre-existing, out of Session 02 scope — fix in the owning context/package session):** 5 patterns already lose edges to this bug — `OperationalInsightsProjectionSupport` (9 lines, operational-insights session), `DeliveryReportingProjectionSupport` (6 lines, delivery-reporting session), and in `architect-guard`: `DeriveProcessState`, `ProcessGuardDecider`, `LintPatternsCLI` (2 lines each, guard expansion). Each is fixed by collapsing its multiple `@architect-uses` lines into one comma-separated line, then re-verifying with `pattern <X>` that every intended target appears in `uses`.
- **Verification rule (load-bearing):** "the annotation is in the file" ≠ "the edge is in the graph." After authoring edges, **always read back via the Data API** (`pattern <X>` → `uses`/`usedBy`, or `arch orphans`) before running the gates. The file content alone does not prove registration.
- **Consumed by:** all remaining WS-1 sessions (every context after pattern-relations, plus guard).
- **Status:** resolved (verified against parser + API, 2026-05-25) → single comma-separated `@architect-uses` line; Data-API read-back is mandatory post-edit.
