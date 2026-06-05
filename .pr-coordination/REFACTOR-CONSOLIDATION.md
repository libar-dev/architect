# Refactor consolidation — decision-record retirement campaign (Item 1)

**Purpose.** Essential, verified context for the finalization sessions that follow
(item 2 — changed-code review; item 3 — skills/formal-spec/doc reconciliation; item 4 —
the `DocumentationProjection` epic). This is the single source to start from; it
supersedes the two mid/late-session handoff notes (one of which is now stale — §3).

**Branch:** `campaign/docs-and-skills-consolidation` · everything **staged, not committed**.

## 0. Verification provenance (nothing taken for granted)

Built from first-hand checks, not from the handoff notes:
- Live API tour green — 0 dangling, no drift, FSM gate behaving.
- 3 read-only verification agents (schema/core · projection/changelog · guard+ADR-001) —
  every enumerated ADR-013 / ADR-012 / PDR-006 claim checked with file:line evidence.
- All decision diffs read first-hand (3 new records in full + every modified ADR/PDR diff).
- Campaign `DECISIONS.md` fork-log read (TR-1..4, RR-1..5, CR-1..10).
- **Three** parallel item-1 reports cross-checked; every unique item independently validated before folding in (§4 R9–R11, broadenings of R1/R2/R4/R6, severity re-scoping of R5/R8).
- Gates **independently confirmed green** by a parallel run (see §5).

## 1. What was decided

**Three new born-accepted records** (`@architect-status:completed`, code-proves-decision, ADR-010 pattern):

| Record | Decision |
|---|---|
| **ADR-013** Taxonomy Retirement | Retire `@architect-quarter`, the 6-phase USDP workflow, numeric `@architect-phase`, the `@architect-release` axis, and `@architect-completed` date. Releases (when real) derive from git tags per `ArchitectureDelta`, never annotated. |
| **ADR-012** Delivery Navigation | Navigation = durable **edge-derived structural hierarchy** (`@architect-level`/`@architect-parent`); epics/slices are thin, members derived from reverse parent edges, exempt from value-transfer deletion. Purely structural — no temporal axis. |
| **PDR-006** Advisory Process Guard | Commit-time protection is **advisory** for completed-reopen + active-scope. `completed→active`/`completed→roadmap` first-class; `@architect-unlock-reason` **optional** (suppresses a warning). `--strict` (CI) still promotes to blocking. |

**Coordinated edits to existing records:**
- **ADR-001** — Rules 3 & 4 rewritten to advisory model; **Rules 7 & 8 deleted** (quarter format, USDP phases); **Rule 6 narrowed** (`quarter`/`completed`/`effort`/`effort-actual` dropped → package adds only `workflow`, floor stays `team`); constant renames surfaced (`DEFAULT_ROLES`→`BUILTIN_ROLES`, `ARCHITECT_PACKAGE_ROLES`); deliverables block removed.
- **ADR-007** — `active`→`completed`, heavily slimmed (phase ordinals, 5-spec deliverables table, "normative redesign-doc" rule removed).
- **PDR-005** — transition matrix + protection reconciled to PDR-006 (`completed→roadmap invalid`→`valid`).
- **PDR-001** — `roadmap`→`completed` (status correction); verified-by cleanup.
- **ADR-002/003/005/008/009** — decisions-only slimming (deliverables blocks removed, monorepo-specific stats/filenames/wave-framing stripped, `@architect-completed:` date tags dropped from 002/005, ADR-009 title loses "and W7 Naming").
- **Deleted specs:** `v1.0.0`, `vNEXT`, `dod-validation`, `effort-variance-tracking`, `living-roadmap-cli`, `phase-numbering-conventions`; `step-definition-completion` trimmed (one retired-axis line, no dangling target).

## 2. Verified impact — the born-accepted claims are TRUE

Every removal ADR-013/PDR-006 asserts has actually landed (so the records are honest, not "decisions ahead of the build"):

| Claim | Verdict | Evidence |
|---|---|---|
| `quarter`/`phase`/`release`/`completed` gone from `ExtractedPattern` | ✅ | `extracted-pattern.ts:95-153` |
| `byQuarter`/`byPhase` views gone | ✅ | `pattern-graph.ts:163-177` |
| `getQuarters`/`getAllPhases`/`getPatternsByPhase` gone from read-API | ✅ | whitelist has `getCompletedPatterns` (CR-8 rename) instead |
| USDP 6-phase constants gone | ✅ | no Inception/Elaboration/… anywhere |
| No `release:`/`completed:` parser/extractor cases | ✅ | `dual-source-extractor.ts:43-92` |
| `buildReleaseEntries`/`ReleaseNotesDigest`/`ReleaseEntry` removed | ✅ | source deleted; 0 references |
| changelog reshaped → release-free `RoadmapTimeline` milestones view | ✅ | `delivery-reporting/index.ts:97-121`; renders **123 completed**, name-ordered |
| **0** reads of `pattern.release`/`pattern.completed` | ✅ | grep across all packages = 0 |
| Guard genuinely advisory (warn-not-block, unlock optional) | ✅ | `decider.ts:140-143,178-210,281-321` + 6 guard scenarios |
| `completed→active`/`roadmap` valid; `completed→deferred` rejected | ✅ | live FSM: true/true/false |
| Retired-tag guard added (F1), suffix-exact | ✅ | `REMOVED_TAG_SUFFIXES=['brief','quarter','phase','release','completed']`; flags `@architect-completed` but NOT `@architect-status:completed` |
| ADR-001 Rule 6 sync-tested against narrowed constants | ✅ | `canonical-values-sync.feature:103-123` ↔ `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES=['team']` |
| Deleted patterns absent from graph | ✅ | ReleaseV100/ReleaseVNEXT/DoDValidation/EffortVarianceTracking/LivingRoadmapCli/PhaseNumberingConventions all ABSENT |

**Fork-log (the "how", from campaign `DECISIONS.md`):** TR-1 removed the whole DoD validator; TR-2 removed required-`phase` from dual-source + dead `combineSources`/`validateDualSource`; TR-3 reshaped `RoadmapTimeline` (quarters→flat) and removed `PhaseProgress`/`projectCompletedMilestones`/`OverviewDigest.activePhases`; TR-4 dropped business-rule `phase` scope; RR-1..5 removed release machinery + renamed `ReleaseNotesProjection`→`ChangelogProjection`; CR-6..9 are Codex-found contract fixes (F1 retired-tag guard, F2 `requiresUnlock`→`unlockSuppressesWarning`, F3 `getRecentlyCompleted`→`getCompletedPatterns`, F6 `DoDValidationTypes`→`AntiPatternValidationTypes`).

## 3. The two handoff notes vs. live state (anti-anecdote)

The **"last session report" (final) matches live state.** The **"other important context" note is mid-session and now STALE** — do not carry these forward:
- ❌ "`release`/`completed` still live" → removed (§2).
- ❌ "`buildReleaseEntries` still live" → removed.
- ❌ "`ReleaseV100` is a live read-model node" → deleted (CR-10), confirmed absent.
- ❌ "2 residual `@architect-phase:` annotations" → now only intentional detector fixtures + one prose mention (`model-enriched-data-api.feature:225`).

## 4. Remaining work — captured & classified

Nothing here was in scope for item 1. Items marked **[+validated]** were surfaced by the parallel report and verified first-hand this session.

| # | Item | Status / evidence | Feeds |
|---|---|---|---|
| **R1** | **Process-metadata band residue** — `effort`/`effortActual`/`team`/`workflow`/`risk`/`priority`/`since`/`userRole`/`businessValue` still in `ExtractedPattern`/`ProcessMetadataSchema`, ~0-populated, **no ADR covers it**, deferred (CR-2). Tension: ADR-001 Rule 6 says package adds only `workflow`, yet schema still carries the rest. **[+validated N4]** the band has *live machinery*: `generator-options.ts:31,34,37,48` (`REMAINING_WORK_GROUP_BY`/`SORT_BY`, `PR_CHANGES_SORT_BY`, `PRIORITY_VALUES`) still group/sort by `priority`/`effort`/`workflow`. Decide cull-vs-keep, then code; if cull, widen ADR-013 in place (careful — `team`/`workflow` are legit Rule-6 tags). | item 2 + a decision |
| **R2** | **`architect/releases/` + the release-manifest concept is still canonized in authoritative records/docs** (not just an empty glob) — dir empty after CR-10. **(a) Code globs [+validated N2]:** `self-hosting.ts:83`, `pipeline-session.ts:246-248`, `scripts/lint-steps.ts:23`; test residue (`reporting.steps.ts:1413` fixture `2026-q2-release.feature`; generic config-merge examples `source-merging.steps.ts:13-14`, `define-config.steps.ts:131`). **(b) Durable ADR [+validated F2]:** `adr-008…feature:50` folder table lists `releases/ \| Release definitions \| Durable` — a *permanent* record canonizing it. **(c) Skill:** `architect-base/SKILL.md:56,61` (§3 folder-role lists `architect/releases/` "Permanent"). **(d) Formal-spec [+validated F2/F3]:** `02-artifact-types.md:18,83,205,208` makes "Release Manifest" a first-class Type-4 artifact + "Permanent"; `11-project-configuration.md:28,159,199`; `03-tag-system.md:211` (Release Manifests as a Level-2 standard). Decide the release-axis story once, then sweep all four layers. | item 2 (code) + item 3 (ADR/skill/formal-spec) |
| **R3** | **`DocumentationProjection` epic false "live" claims** — `00-documentation-projection.feature:33` still asserts `quarter`/`phase` schema fields (`extracted-pattern.ts:113,124`), `byQuarter`/`byPhase` views, and tag registration "are all live" — **falsified by ADR-013** (live wrong claim in an *active* spec). Its R1 open-question ("populate-or-rescope-or-retire") is now **resolved-retired** and should collapse. | item 4 |
| **R4** | **PDR-006 drift across authoritative lifecycle surfaces (not just skills)** — the old *terminal / unlock-required / hard-block* model survives at multiple authority levels. **Formal-spec (most load-bearing) [+validated F1]:** `09-delivery-lifecycle.md:40,69,95,106,111-112` is the full hard-block model ("completed → anything NOT ALLOWED without `@architect-unlock-reason`", "REJECT with 'completed pattern requires unlock-reason'"); `01-conformance.md` Level-3 normatively requires §09; `00-overview.md:88` uses pre-advisory protection framing. **Skills:** `architect-base/SKILL.md:82,186-187,195`, `references/fsm-transitions.md:21,29,34-35,66`, `references/taxonomy.md:50`, `architect-refactor-session/SKILL.md:76-77`, `architect-sessions/references/review-implementation.md:78`. **No** surface reflects advisory/optional. Also: ADR-012 edge-derived-epics doctrine not yet in skills. Run `pnpm check:skills` after skill edits. | item 3 (formal-spec + skills) |
| **R5** | **`changelog` doc honest-rename** — registered + renders correctly; "Changelog" is just release-keyed *naming* over a status=completed view. Rename to a completed-work inventory (re-earns "Changelog" when git-tag releases land). **Severity: naming debt / follow-up, NOT a correctness defect.** Best done inside the projection rework (churns route-id/registry/tests). | item 4 / projection rework |
| **R6** | **Retired phase/release concepts in formal-spec AND package PRDs** — **Formal-spec [+validated F3]:** `10-pattern-graph.md:163` still documents the `byPhase` view (`Map<number, ExtractedPattern[]>`); `03-tag-system.md:100` uses `@architect-phase:2` as the canonical "number" example (ADR-001 already swapped its copy to `@architect-adr 2`); release-manifest definitions (overlap R2). Note many entries are already correctly marked "Removed"/"not part of v0.2.0". **Package PRDs (new surface) [+validated F3]:** `cli/PRD.md:37` advertises the **removed** `getPatternsByPhase` (though :117 already marks it "deletion-candidate"); `projection/PRD.md:50-52,138-139` lists the **removed** `projectPhaseProgress`/`projectReleaseNotesDigest` and states **"13 document types"** (live count is 14). | item 3 |
| **R7** | **Known-deferred residue (user's call to leave)** — stale `plans/delivery-grouping-…report.md` + `plans/documentation-projection-design-handoff.md` carry the now-stale mid-session analysis (they *are* the "other important context" note). | item 5 (deferred) |
| **R8** | **Minor / low-risk** — (a) stale `dist/fragments/delivery-reporting/release-notes-digest.{d.ts,js}` (clear on next `pnpm build`); (b) prose `@architect-phase:50` at `model-enriched-data-api.feature:225`; (c) **naming debt** (not correctness): protection `level` enum value `"hard"` while behavior is advisory (deliberate per CR-7: level≠severity); (d) **pre-existing, non-blocking** [+validated]: `validate:all` passes but prints two invalid-pattern-name diagnostics in *unchanged* files — `taxonomy-embedded.ts`, `managed-region.ts` (not campaign-introduced; don't mistake for a regression). | item 2 |
| **R9** | **[+validated N3] TS scanner dead `phase` residue** — `ast-parser.ts:312` `const phase = readNumberMetadata(metadataResults, 'phase')`; `:387` `...(phase !== undefined && { phase })`. Latent dead code (always `undefined` now → harmless, gates green) but a real **hole in ADR-013's "schema field removed" claim**: the scanner *read* of phase survived the cull. Remove both lines. | item 2 (dead-code) |
| **R10** | **[+validated N1] `ArchitectureDelta` spec carries doctrine-forbidden concepts** — `architecture-delta.feature` (roadmap, unbuilt): `@architect-replaces` (non-existent tag + no-history-forbidden "replaces" edge, line 21), "deprecated patterns…replaces annotations" (No-BC forbids `@deprecated`/deprecation, lines 16/47/51), "constraints introduced by phases" (retired numeric phase, lines 10/58-61). **Its git-tag release-boundary mechanism (line 20) IS doctrine-aligned and is what ADR-013 forward-points to** — so this spec must be reconciled before it can be the clean git-tag release vehicle ADR-013 relies on. | item 4 / spec-review; relevant to ADR-013's forward note |
| **R11** | **[+validated N5] `DecisionRecordTemporalHygiene` contradicts bootstrap doctrine** — `decision-record-temporal-hygiene.feature` (candidate, unbuilt): line 17 "amended only by a new superseding record, **never by editing the existing one**"; lines 14/24 prescribe a NEW superseding ADR, not an in-place edit — the **opposite** of the bootstrap "consolidate in place / no amend-chains / no supersedes edges" doctrine that *this campaign followed*. Re-scope to the bootstrap in-place model (or mark it a post-1.0 spec). Its premise ("shipped ADRs carry execution/temporal context, unaudited") is partly resolved by the campaign's in-place slimming. | item 3 / item 4 (doctrine reconciliation) |

**Unifying frame for items 2–4:** the read model moved to the new decision model; the **spec/doctrine/skill layer hasn't caught up.** R3/R4/R6/R10/R11 are all the same shape — unbuilt specs, skills, and formal docs still encode the pre-retirement / pre-PDR-006 / pre-bootstrap world.

## 5. Confidence & what was NOT done this session

- **High confidence** the decision corpus is internally consistent and the born-accepted records are honest — verified against code, FSM, projections, guard, and the sync test (not just prose).
- **Gates independently confirmed green** by a parallel run: `pnpm typecheck`, `pnpm test`, `pnpm docs:check`, `pnpm check:skills` all **pass**; `pnpm validate:all` **passes** (printing only the two pre-existing R8(d) diagnostics). Corroborated by my own green API tour + `arch dangling` (0/no-drift). No re-run needed before items 2/3.
- **Did not** read every changed code file (per instruction) — targeted API + 3 agents + decision diffs + 3 cross-checked parallel reports instead.
- **Authority-ordering for fixes:** the same stale doctrine (terminal-unlock, release manifests, numeric phase) recurs at four authority levels — **permanent ADRs** (adr-008) > **formal-spec normative docs** (§09, conformance-referenced) > **skills** > **PRDs**. Fix in that order: a stale permanent ADR or conformance spec misleads far more than stale skill/PRD prose.
