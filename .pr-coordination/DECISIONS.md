# Decisions — questions that need human judgment

> **Campaign-ephemeral, durable facts only.** This log holds the judgment-calls
> one campaign needed before code — `Question / Options / Recommendation /
Status (resolved-with-sha)` — then archived at campaign close. Keep entries
> tight: implementation detail and execution narrative belong in the consuming
> session prompt, `SESSION-REPORTS-AND-LEARNINGS.md`, or the commit body —
> **not here**. This is the _opposite_ of a durable ADR (`architect/decisions/`,
> permanent); see `.agents/skills/architect-base/references/decision-records.md`.
>
> **Resolved bodies archived** (2026-05-26) → [`archive/DECISIONS-resolved.md`](archive/DECISIONS-resolved.md).
> The standing rules they encode are distilled in the digest below; all
> campaign decisions are now resolved (D-4 closed 2026-05-26).

## Key durable decisions (standing rules future work must respect)

- **D-3** — un-patterned shipped abstractions get a code-originated `.ts` `@architect-pattern` (approve each candidate).
- **D-6** — additive `@architect-uses` on a `completed` pattern needs no `@architect-unlock-reason` (the guard is the arbiter).
- **D-7** — de-orphan fragments via the producer (`<X>Projection uses <X>`), never the re-export barrel (that inverts the dependency).
- **D-8** — `@architect-uses` is ONE comma-separated line; a second line is silently dropped. Read back via the Data API after authoring.
- **D-10** — adding `@architect-implements` to a `completed` test spec needs an `@architect-unlock-reason` (≥10 meaningful chars).
- **D-11** — producerless grouping barrels use barrel→submodule edges (GitModule precedent); fragment barrels with a producer use D-7.
- **D-12** — a `runCommand` CLI test `@architect-implements` the command's 1:1 production pattern (verify the command string).
- **D-15** — the component view filters test-feature patterns by **source path** (`tests/features/`); `implementsPatterns` is NOT a test discriminator (production sub-modules implement barrels). Grounded in value-transfer: `role`/`bounded-context` are production-owned — tag production, never mass-tag tests.
- **D-16 / D-18** — component & architecture-diagram views are **production-only**: exclude test features, decision records (`architect/decisions/`), and all working-state under `architect/`.
- **D-19** — architecture diagrams draw only **forward** dependency edges (`depends-on`/`uses` collapsed to one arrow; keep `see-also`; drop the derived `enables`). `enables`/`usedBy` are purely computed, never authored — absent from the directive vocabulary + `ExtractedPattern` fields.
- **D-21** — skills = `architect-base` (+refs), `architect-data-api`, `architect-sessions` (+refs), `architect-refactor-session` (+refs), `omo-plan-author`.
- **D-23** — `architect-sessions` is **mandatory**; `architect-refactor-session` stays **unadvertised** (the transitional non-spec-driven carve-out — still loads via its skill-description routing).

> Read-surface disclosure vocabulary (D-17): read verbs use `ContentRichness`
> (`name-only…full`), not the progressive level — see `HUD-IDEATION.md`
> (steps 3–4 carried into `ArchitectBriefDeterministicBundle`).

- **WS-5** — `package` is resolved into `ArchIndex.byPackage` at `transformToPatternGraph()` time (derived from `pattern.source.file`, not annotated — implements ADR-006); the read API serves it cheaply via the `byPackage` index. No `@architect-package` tag is authored or extracted; package identity is infrastructure, not annotation.
- **WS-7 (rendering home)** — the `@architect-shape` API surface renders into a **new `api-reference` documentType** (root `API-REFERENCE.md` + per-package `api-reference/<pkg>.md` children, modelled on `business-rules`), NOT into the `patterns` doc. The `patterns` doc is flat (`projectPatternCatalog` emits no children); option (a) would have required building a patterns lens tree on a `completed` projection AND conflated the API surface with the pattern catalog. A new documentType is the ADR-005/006-aligned lens and the smaller change.
- **WS-7 (annotation done-bar)** — annotate every exported `interface`/`enum`/`function` directly; for Zod-first contracts annotate the **schema `const`** (its source carries the fields), NOT the paired `z.infer`/`z.output` type alias; standalone (non-Zod) `type`/`const` exports annotated directly. Exclude `*.internal.ts`. (Former extractor gotcha — substring `architect-shape` in prose false-tagging a declaration — is resolved structurally: `extractShapeTag`/`extractIncludeTag` now anchor to a standalone JSDoc tag line, covered by the `ShapeExtraction` discovery Rule, so the prose caveat no longer applies.)
- **WS-8 (projection simplification)** — the four routed-doc factories' shared mechanics (group → sort → root+children → routing → empty-degradation) are extracted into `buildGroupedRoutedBundle` (`projections/_shared/grouped-routed-bundle.internal.ts`); `api-reference` + `business-rules` migrated onto it byte-identical. The identical navigation-link logic is shared via `buildChildRouteLinks` inside `render-markdown.ts`. `requirements-executable/-specs` (genuine two-level outlier) and `architecture` (fixed-lens) intentionally stay bespoke.
- **WS-8 (universal-projection engine — FALSIFIED, reverted)** — prototyped a declarative `defineGroupedRoutedDocType` engine on `api-reference` (byte-identical, all gates green) to test moving doc types from hand-written factories to configuration. **Reverted.** Measurement: +67 LOC indirection over `buildGroupedRoutedBundle` with **zero** per-type reduction; the per-type leaf (Zod schema + leaf renderer + `MARKDOWN_NORMALIZERS` kind-dispatch) is irreducible and provably cannot move into the engine without a `render-markdown.ts`↔doc-type-config import cycle (the ADR-005 renderer↔projection layering wall). Durable conclusion: the generalization that pays is **composable helpers** (`buildGroupedRoutedBundle` + `buildChildRouteLinks`), not a projection-kind framework. Recorded durably in **ADR-010** (documentation composition via helpers, not a framework).

## ADR-013 taxonomy-retirement design forks (resolved in-implementation)

- **TR-1 (DoD validator)** — the entire DoD validation surface (`validateDoD`,
  `validateDoDForPhase`, `getDeliverableWorkflowPatterns`, `formatDoDSummary`,
  `DoDValidationResult`/`DoDValidationSummary`, `getPhaseStatusEmoji`, plus the
  `isDeliverableComplete`/`hasAcceptanceCriteria`/`extractAcceptanceCriteriaScenarios`
  helpers that only fed it) is **keyed on numeric phase** — it gates on
  `pattern.phase !== undefined` and reports "0 phases" because no pattern carries a
  populated phase. Per ADR-013 it is unpopulated machinery. **Removed entirely**
  (whole `dod-validator.ts`, DoD types, and the `--dod`/`--phase` CLI flags in
  `validate-patterns.ts`). No non-phase grouping was ever populated, so no
  replacement keying is introduced.
- **TR-2 (dual-source ProcessMetadata phase)** — `extractProcessMetadata`
  REQUIRED a `phase:` tag (returned `null` without one), and `ProcessMetadataSchema`
  made `phase` required. The guard's `detectDuplicateFeatureIdentities` uses it ONLY
  for `metadata.pattern`. Removed the required `phase` field + parse so the
  duplicate-identity check works for any feature with a `@architect-pattern` tag.
  `combineSources`/`validateDualSource`/`DualSourcePattern`/`CrossValidationError`
  (the phase-mismatch diagnostic) are dead in the live pipeline (only re-exported +
  used by tests) — removed.
- **TR-3 (RoadmapTimeline / PhaseProgress / overview activePhases)** — the
  `RoadmapTimeline` fragment was `quarters: QuarterEntry[]` (quarter-keyed) and
  `PhaseProgress`/`ActivePhaseEntry` were numeric-phase-keyed. `roadmap` and
  `current-work` doc types depend on `RoadmapTimeline` (registry), so it is KEPT but
  re-shaped to a flat `patterns: PatternSummary[]` + `counts` (no quarter grouping).
  `PhaseProgressProjection`/`PhaseProgress`/`projectCompletedMilestones` (milestones
  view) have no doc-registry consumer and are pure numeric-phase machinery —
  **removed**. `OverviewDigest.activePhases`/`ActivePhaseEntry` removed.
- **TR-4 (governance business-rule phase scope)** — `BusinessRuleScope`/
  `BusinessRuleGrouping` carried `'phase'`, `BusinessRule.phase`, and a `phase`
  `BusinessRuleSet` variant, all populated from `pattern.phase`. Removed the `phase`
  scope/grouping/variant and the `rule.phase` field + its render column.

## ADR-013 release-axis retirement design forks (resolved in-implementation)

These extend ADR-013 (widened in place — no ADR-014) to retire the release axis
(`@architect-release`) and the `@architect-completed` completion-date field.
NOTE: the FSM status `completed` (`@architect-status:completed`,
`pattern.status === 'completed'`, `byNormalizedStatus.completed`) is a DIFFERENT
thing and was left fully untouched.

- **RR-1 (changelog reshape, not removal)** — the `changelog` doc type rendered
  the release-bucketed `ReleaseNotesDigest` (Unreleased → tagged releases → Earlier,
  with completion dates). Both inputs (`pattern.release`, `pattern.completed`) are
  retired, so the whole release-bucketing machinery (`buildReleaseEntries` +
  `buildUnreleasedEntries`/`buildTaggedReleaseEntries`/`buildEarlierFallbackEntries`/
  `createReleaseEntry`/`deduplicateDeliverables`/`deduplicatePatterns`, plus
  `ReleaseNotesDigest`/`ReleaseEntry`/`ReleaseEntrySchema` and
  `normalizeReleaseNotesDigest`) was **removed**. The `changelog` doc TYPE stays
  registered (14-type enum unchanged) but its projection is reshaped to
  `projectChangelog` → a release-free completed-patterns view via the existing
  `RoadmapTimeline` `milestones` view (the `completed` set in name order, status
  counts, no children, no date/release column). The `ReleaseNotesProjection`
  pattern is renamed to `ChangelogProjection` (No-BC: old pattern deleted, no
  alias); its `*ExecutableTests` feature reshaped to `ChangelogProjectionExecutableTests`.
  Output stays `CHANGELOG.md` (file name comes from the registry
  `markdownRootTarget`, not the bundle routing); H1 stays "Changelog" via a
  `view === 'milestones'` metadata special-case. NOT degenerate — 124 completed
  patterns render.
- **RR-2 (getRecentlyCompleted reshaped, not removed)** — the read-API
  `getRecentlyCompleted` filtered+sorted by `pattern.completed` (date). With the
  date retired, recency-by-date is no longer expressible from the read model
  (history lives in git). KEPT the method (it is on the `PatternGraphAPI` interface
  + `query` passthrough whitelist) but reshaped it to return the `completed` set in
  deterministic **name** order, capped by limit — no calendar/ordinal recency. Its
  executable feature Rule + steps (`PatternGraphApi` consistency) updated in lockstep:
  invariant "ordered by completed date descending / has a completed date" →
  "ordered by pattern name ascending".
- **RR-3 (degenerate-guard stale entry fixed)** — `PRIMARY_COLLECTION_BY_KIND` had
  a stale `RoadmapTimeline: 'quarters'` (TR-3 reshaped the fragment to `patterns`),
  a silent no-op since `quarters` no longer exists. Removed the `ReleaseNotesDigest`
  entry and fixed `RoadmapTimeline` → `'patterns'`, so the guard now correctly
  catches an empty roadmap/current-work/changelog. (Adjacent fix the reshape exposed.)
- **RR-4 (`process` metadata group emptied)** — the registry-builder `process`
  metadata-tag group held only `['completed']`; removed `completed` (the metadata
  tag def + the suffix). Left the group as `process: []` to match the existing
  empty-group convention (`traceability`/`extraction`/`convention` are already `[]`).
- **RR-5 (`architect/releases/`)** — deleted `vNEXT.feature` (`ReleaseVNEXT`,
  active) — pure release-axis residue (it documents the `@architect-release:vNEXT`
  staging workflow). **Left `v1.0.0.feature`** (`ReleaseV100`, completed) and
  surfaced it rather than deleting blindly: it is a historical release note, the
  skill marks `architect/releases/` "Permanent", and it is an orphan node with no
  edges. Deleting the whole release-notes concept is beyond this PR's clean scope —
  flagging for human/coordinator judgment.

## Adversarial-review cleanup (post-retirement residue sweep)

Mechanical dead-context removal applied by the independent reviewer after the
three retirement passes. All gates re-run green (typecheck · test · validate:all ·
docs:check · dangling --strict · guard:no-suppressions).

- **CR-1 (tier-a-baseline stale block)** — `tier-a-baseline.ts` carried 17 entries
  for `projections/delivery-reporting/index.ts` (incl. the `PhaseProgress`/
  `PhaseProgressSchema`/`ReleaseNotesDigest`/`ReleaseNotesDigestSchema` entries
  named in the prompt, plus `ProjectionContext`/`StatusDistribution`/
  `RoadmapTimeline`/`TraceabilityMatrix` and their `*Schema` variants at line
  numbers 546/582/618/666/703 — all beyond the file's current 448 lines).
  A raw (un-baselined) lint over the full config glob proved the file now has
  **zero** Tier-A violations (every target resolves; the lone live violation is
  an `info` on the *fragments* index). `applyTierABaseline` is a subtraction-only
  allowlist with no stale-entry detection, so the block was pure dead context AND
  a latent mis-suppression hazard (stale line numbers could mask a future
  violation). **Removed the whole 17-entry block.** Safe: removing an unused
  allowlist entry can only make the gate stricter, never looser.
- **CR-2 (retired-axis test-fixture residue)** — `tests/fixtures/pattern-factories.ts`
  spread `phase`/`quarter` (both retired from `ExtractedPattern` + `DocDirective`)
  into the factory output and carried a dead `TestDeliverable.release` field +
  stale "release tracking" comments; `tests/fixtures/dataset-factories.ts` JSDoc
  described retired `phase`/`quarter`/`completion-date` metadata;
  `architect-projection/tests/fixtures/fragments.ts` listed a `tag: 'quarter'`
  TagUsageEntry (quarter is no longer a registered tag). Removed the `phase`/
  `quarter` field defs, spreads, and timeline/roadmap factory assignments (KEPT
  `effort`/`team`/`workflow`/`deliverables` — deferred process-metadata band — and
  the FSM `completed` status); dropped `TestDeliverable.release`; swapped the
  fixture tag to a live axis (`bounded-context`); corrected the JSDoc. Two
  consuming step files (`compact-text-renderer.steps.ts`) passed `phase:` to the
  factory — removed those dead args.
- **CR-3 (`projectCompletedMilestones` rename residue, RR-1 follow-through)** —
  the `progressive-disclosure.md` renderer-contract fixture and its assertion in
  `contract.feature.steps.ts` still named `projectCompletedMilestones` (renamed to
  `projectChangelog` in RR-1). Updated both to `projectChangelog`.
- **CR-4 (contradictory retirement comments)** — `validate-patterns.feature` +
  `validate-patterns.steps.ts` carried a comment claiming "the `@architect-phase`
  tag remains" — false after ADR-013 retired it. Rewrote both to state the tag was
  retired and the surviving `phase {int}` step column is vestigial.
- **CR-5 (`includePhaseProgress` config flag)** — removed the phase-named
  `includePhaseProgress?` flag from `IndexCodecOptionsContract`
  (`presentation-contracts.ts`). Pre-existing dead surface (only re-exported, never
  consumed) but named after the retired axis; sibling dead flags
  (`includeProductAreaStats`/`includeDocumentInventory`) left untouched (not
  phase-related, out of this sweep's scope).

## Adversarial-review pass 2 (semantic/contract gaps the green gates passed over)

Four verified contract/correctness gaps Codex found after the 3-pass retirement,
plus one orphan deletion. All gates re-run green (typecheck · test · test:dogfood ·
validate:all · docs:all/docs:check no-drift · dangling --strict · guard:no-suppressions).

- **CR-6 (F1 — retired tags silently dropped, not guarded)** — `REMOVED_TAG_SUFFIXES`
  in `anti-patterns.ts` held only `['brief']`; ADR-013 retired `quarter`, numeric
  `phase`, `release`, `completed`, so re-introducing them was silently ignored.
  Added the four suffixes. **Confirmed the matcher is suffix-exact** (line ~178:
  `normalized === '<prefix><suffix>' || normalized.startsWith('<prefix><suffix>:')`),
  so `completed` flags `@architect-completed`/`@architect-completed:…` but NOT
  `@architect-status:completed`, and `phase` flags `@architect-phase`/`:N` but NOT
  `@architect-level:phase` (verified empirically + by a new regression scenario).
  Removed the two stray hard-locked `@architect-completed:<date>` annotation lines
  from `adr-002`/`adr-005` (in the same change, so validation stays green). Added a
  guard-runtime scenario ("Flag retired temporal and release tags as removed tags")
  asserting the four retired suffixes flag while the status/level look-alikes don't;
  exported `detectRemovedTags` from the validation barrel to make it testable.
- **CR-7 (F2 — protection read-API contradicted PDR-006)** — `getProtectionSummary`
  returned `requiresUnlock: level === 'hard'`, the `hard` description said
  "Hard-locked - requires unlock-reason to modify", and `validateStatus` emitted
  "terminal state. Use unlock-reason to modify." PDR-006 made completed protection
  **advisory** (edits WARN, unlock-reason OPTIONAL/suppressor, `completed→active|roadmap`
  valid). Reconciled the read surface to advisory and **separated protection level
  from enforcement severity**: kept `level` (`none|scope|hard`) but replaced the
  misleading `requiresUnlock` boolean with `unlockSuppressesWarning` (= `level !== 'none'`,
  true for both `scope` active-scope-creep and `hard` completed — mirroring
  `decider.ts` exactly), reworded the `hard`/`scope` descriptions and the terminal
  message to the advisory model. Propagated through `ProtectionInfo` (read-API type),
  `getProtectionInfo()` forwarding, the projection digest fragment
  (`needsUnlock`→`unlockSuppressesWarning`, internal builder, doc comments), the
  markdown renderer column ("Needs Unlock"→"Unlock Suppresses Warning"), and all
  affected fixtures + read-API/projection tests. No-BC rename, no alias. Did NOT
  touch the guard FSM transitions (already correct).
- **CR-8 (F3 — `getRecentlyCompleted` lies by name)** — post-RR-2 the method has no
  recency input; it returns the alphabetical-first N completed patterns. **Renamed
  to `getCompletedPatterns`** (has real consumers: read-API interface+impl, the CLI
  `query` passthrough whitelist + case in `structured.ts`, help text in `planning.ts`,
  the read-API consistency feature+steps incl. the `recentlyCompleted` state field,
  and the dogfood `pattern-graph-cli-core.feature` scenario). No alias (No-BC).
- **CR-9 (F6 — `DoDValidationTypes` identity survived the DoD deletion)** — TR-1
  deleted the DoD validator; `validation/types.ts` now holds the surviving
  anti-pattern validation contract (`AntiPatternId`/`AntiPatternViolation`/
  `AntiPatternThresholds`/`WithTagRegistry`). **Re-patterned to
  `AntiPatternValidationTypes`** (JSDoc heading + body), updated the `@architect-uses`
  edges in `anti-patterns.ts` and `validation/index.ts`, and removed five stale
  `tier-a-baseline.ts` entries (3 referencing the deleted `dod-validator.ts`, 2 for
  the now-resolving `anti-patterns.ts → DoDValidationTypes`/`GherkinTypes` targets).
  `arch dangling --strict` stays clean (0 dangling); docs-live regenerates with the
  new name.
- **Orphan deletion** — removed the zero-reference
  `architect-projection/tests/fixtures/documentation-composition/documentation-types.md`
  (stale `projectReleaseNotesDigest`/quarter/release content, no consumers) and its
  now-empty parent directory.
- **CR-10 (historical release node + two ADR-013-orphaned roadmap specs removed)** —
  user-approved removals; zero inbound `@architect-uses`/`@architect-implements`/
  `@architect-parent`/`@architect-see-also` edges on any of the three (word-boundary
  grep confirmed — `DoDValidation*` substring hits are the live `DoDValidationTypes`/
  `DoDValidator`, a different pattern). **Deleted `architect/releases/v1.0.0.feature`**
  (`ReleaseV100`, completed) — a pure historical release-note whose v1.0.0 tag already
  lives in git, inflating the completed lens as dead context; `architect/releases/` is
  now empty (last file — `vNEXT.feature` was already gone). **Culled
  `architect/specs/dod-validation.feature`** (`DoDValidation`) — substrate
  (`dod-validator.ts`, `--dod`/`--phase`) deleted in TR-1; ADR-013 decided NOT to
  reintroduce non-phase DoD keying. **Culled
  `architect/specs/effort-variance-tracking.feature`** (`EffortVarianceTracking`) —
  premised on `effort`/`effort-actual` 0-residue + variance/ETA tracking the doctrine
  forbids. **Trimmed `architect/specs/step-definition-completion.feature`** (kept — real
  step-def value): removed the single retired-axis line `And quarter-based grouping
  scenarios pass` from the `remaining-work-enhancement` priority-sorting scenario; its
  `Given`/`When`/`Then priority-based sorting` remain valid. No dangling target —
  `remaining-work-enhancement.feature` was itself already deleted, so the quarter line
  pointed at non-existent content (clean, no follow-up for that file). **Surface (not
  acted on):** `architect/releases/*.feature` is an EXPLICIT source glob in
  `packages/architect-core/src/config/self-hosting.ts:83` (not a broad `architect/**`);
  it now matches nothing — harmless, but a candidate for the deferred config-cleanup
  session. docs-live regenerated; `arch dangling --strict` stays clean.

## Open

None — all campaign decisions (D-1–D-23) are resolved. Full bodies → [`archive/DECISIONS-resolved.md`](archive/DECISIONS-resolved.md); the standing rules are distilled in the digest above. (D-4 — fragment-union light model — resolved 2026-05-26: shipped in WS-1.)
