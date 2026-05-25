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

## D-9 — Session 08 deferrals: 3 core test-features have no clean production-pattern target

- **Question:** Three `architect-core/tests` orphans exercise production functions that carry **no `@architect-pattern`** and are not reachable from any pattern that does. What's the de-orphaning edge?
- **Discovered (Session 08, verified against step imports + source):**
  - `SourceMerging` → `mergeSourcesForGenerator` (`config/merge-sources.ts`) — file has no `@architect-pattern`; only re-exported by `src/index.ts` + `config/index.ts` barrels; **not** reachable from `ConfigLoader` (config-loader.ts does not import merge-sources). No owning pattern.
  - `TagRegistrySchemasValidation` → `createDefaultTagRegistry`/`mergeTagRegistries` (`validation-schemas/tag-registry.ts`) — file has no `@architect-pattern` (only `pattern-graph.ts`, `codec-utils.ts`, `extracted-pattern.ts` carry one in that dir). No owning pattern.
  - `TypeScriptTaxonomyImplementation` → `buildRegistry` (`taxonomy/registry-builder.ts`) — file has no `@architect-pattern` (sole hit is an example string in source). No owning pattern in `taxonomy/`.
- **Chosen:** **DEFER all three** — record as "no clean target". Authoring `@architect-implements` against a non-existent pattern trips `arch dangling --strict`; mapping to a transitively-reachable-but-unrelated pattern (e.g. `ConfigLoader` for merge-sources, which it never calls) would be a false edge that lies to every future query. Per PREAMBLE Rule 4/5 + brief discipline, a missing edge beats a plausible-but-false one.
- **Resolution path (next session input):** these need a **new code-originated `@architect-pattern`** on the owning production file (D-3 pattern — `merge-sources.ts`/`tag-registry.ts`/`registry-builder.ts` are data/config contracts), authored under maintainer approval, before the implements edge can land. Out of Session 08 edge-only scope.
- **Consumed by:** sessions/08; the future core-identity session that adds the 3 missing production identities.
- **Status:** resolved (verified against code + step imports, 2026-05-25) → defer; do not author phantom targets.

## D-10 — `completed` test spec without a pre-existing unlock-reason needs one to add `@architect-implements`

- **Question:** Adding `@architect-implements` to a `completed` test `.feature` tripped the process guard's `completed-protection` rule on exactly ONE file (`dual-source-merge.feature`, `DualSourceMergeIntegration`). The other 6 completed features I edited passed. How to resolve in-doctrine?
- **Discovered (Session 08):** guard `--staged` reported **Status transitions: 0, Deliverable changes: 0** (D-6 holds — no FSM transition), but raised `[completed-protection] ... Cannot modify completed spec ... without unlock reason`. Verified the discriminator: `dual-source-merge.feature` is the **only** completed feature I touched that lacks an `@architect-unlock-reason` tag — the other 6 already carry `@architect-unlock-reason:Retroactive-completion-during-rebrand`, which satisfies the guard's spec-file protection. The guard's `completed-protection` rule guards *spec-file modification*, distinct from D-6 (which covers additive JSDoc on production `.ts` — those don't trip this rule).
- **Chosen:** add `@architect-unlock-reason:De-orphan-implements-edge-WS1-session-08` to `dual-source-merge.feature` only. This is the guard's own documented `Fix:` and the architect-base §11 sanctioned mechanism for legitimately modifying a completed spec — NOT a No-BC violation (no `@deprecated`/eslint-disable/compat alias; not softening a removal). The status stays `completed`; only the implements edge + the required unlock-reason are added.
- **Consumed by:** sessions/08. Rule for future sessions: when adding `@architect-implements` to a **completed test feature**, check for a pre-existing `@architect-unlock-reason`; if absent, the guard's `completed-protection` requires one (≥10 meaningful chars) — add the campaign reason. This is orthogonal to D-6's FSM/transition concern.
- **Status:** resolved (process guard is the arbiter, 2026-05-25) → add unlock-reason on the one unprotected completed spec.
