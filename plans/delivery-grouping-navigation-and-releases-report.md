# Delivery Grouping, Navigation & Releases — Decision Report

**Date:** 2026-06-05
**Type:** Ideation + decision session (self-contained handoff for a fresh execution session)
**Status:** Decisions locked. No code/spec changes made this session. Mechanical work scoped for a fresh session. Release-model wiring deliberately deferred.

> This report is self-contained: a fresh session should be able to execute the "Mechanical work" section from this file alone, without the originating conversation.

---

## 1. The two questions

**Q1 — Epics as durable navigation aids.** Because value transfer deletes design specs once they become executable (`ephemeral-spec-deletion.md`), browsing `architect/specs/` shows progressively fewer files and a human loses the thread of _which specs formed one logical unit of completed work, and where their executable specs now live_. Want: thin epics in the architect state folder as a durable navigation/reference index — also usable as a grouping key when generating docs (business-rules, requirements).

**Q2 — Releases / phases.** The package was just extracted from a monorepo and is **not practicing releases yet**. The monorepo's release/phase machinery arrived as residue. Want: figure out how to tackle releases/phases, including whether phases are a useful _additional_ grouping for specs that together complete an epic. Guiding instinct: **less is more if we don't need it**; phases may still be valuable for _planning_ at any semver level.

---

## 2. What we found — live graph (this repo)

- **Epic→member is edge-derived.** `gherkin-extractor.ts:539` inverts each pattern's `@architect-parent` into a `parentToChildren` map. The epic's `**Members:**` prose is **not parsed anywhere** — it is pure human documentation and a drift risk (the authoritative member set is the reverse parent edges).
- **The epic already survives value transfer.** `DesignReviewProjection` is `active`, TS-owned, its design spec already deleted — yet it still carries `@architect-parent:DocumentationProjection` in JSDoc (`design-review.ts:9`). The parent edge rides to the durable surface. Idea-tier epics are not in the deletion-gate scope to begin with (the gate targets design-tier specs only).
- **`@architect-implements` is a fully traversable, bidirectional navigation edge — verified.** `DesignReviewProjection → implementedBy:[DesignReviewProjectionExecutableTests]`; `EmissionDescriptor → implementedBy:[EmissionDescriptorTesting], implementsPatterns:[TaxonomyDocumentationCluster]`. Reverse edges built at `relationship-resolver.ts:104,141–152`. (An earlier "implementedBy is missing" finding was a **JSON-path error** on our side — relationships live under `.root.relationships` for bundle-style verbs, the documented "three envelope shapes" gotcha — not a graph defect. No fix needed.)
- **The hierarchy `phase` rung is registered but unused.** Taxonomy registry has `@architect-level` (epic/phase/task/slice) + `@architect-parent`. Zero patterns use `@architect-level:phase`.
- **The temporal axis is empty.** `getAllPhases`, `getActivePhases`, `getQuarters` all return `[]`.
- **Release nodes are graph orphans.** `ReleaseV100` (completed), `ReleaseVNEXT` (active) have no edges (`arch neighborhood` empty). The changelog projection (`ReleaseNotesDigest`, `release-notes-digest.ts`) is a **Zod contract only** — it ships empty and does **not** read the release nodes. So retiring the nodes breaks nothing technically — **but see §4: vNEXT is a wanted construct, not dead weight.**
- **"Phase" is overloaded across four senses** (the key disambiguation):
  1. Hierarchy `@architect-level:phase` (epic›phase›task) — registered, **unused**.
  2. Numeric delivery-sequence `@architect-phase:N` — **cut at the registry by the Wave 1–4 taxonomy migration** (ADR-001 snapshot note), but ~8 vestigial annotations remain on test features.
  3. USDP 6-phase lifecycle (Inception→Retrospective) — **ADR-001 Rule 8**.
  4. Release-version phase ("phase N of vX") — `phase-numbering-conventions.feature`, **never built**.
- **`@architect-quarter` is still canonical** — ADR-001 Rule 6 lists it in `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES`, Rule 7 defines its `YYYY-QN` format. So retiring it touches a published architect-core constant.
- **Generated docs currently group by `package`** (business-rules), not by epic.

## 3. What we found — old repos (empirical grounding)

Two older, far-more-populated implementations were surveyed: `libar-platform/architect/` (mature production delivery process, 49 features) and `architect-studio/.../architect/` (the extraction source, 38 features).

**Tag frequency (the headline):**

| Tag                     | libar-platform | architect-studio |
| ----------------------- | -------------- | ---------------- |
| `@architect-release`    | 53             | 2                |
| `@architect-phase`      | 33             | 2                |
| `@architect-quarter`    | 28             | 0                |
| `@architect-implements` | 32             | 17               |
| `@architect-level`      | 1 (epic)       | 0                |
| `@architect-parent`     | 0              | 0                |

**Key findings:**

- **Releases were the primary, mature, _generated_ organizing unit.** Codified in libar-platform's `adr-002-release-management-architecture`: thin (~20-line) release files + `@architect-release:<v>` tags on deliverables + **generated changelog/roadmap**. Verbatim insight: _"releases (external versions) are what actually matter"_ and _"phases become optional internal detail, not primary organizer."_ The `CHANGELOG-GENERATED.md` was real and populated — **sourced from release files + tags, not git** (despite "git is the event store" framing).
- **Numeric phases were used heavily, then deliberately demoted** (TS phase files archived; values were messy — `100` sentinels, junk literals).
- **phase-numbering / living-roadmap-cli were aspirational** — never built.
- **Epics were barely used, never edge-derived, never durable/terminal, and bloated where used.** The current repo's edge-derived epic→members model is a **net-new invention with no prior art to restore.** (The bloat failure mode recurs: old + current epics both ballooned into design-substrate docs.)
- **`implementedBy` was first-class in the mature tooling** (reverse-resolver + rendered "## Implementations" doc section) — corroborating it is intended to work, which it does today.
- **Navigation/grouping in practice:** by release → phase → product-area, cross-linked via `implementedBy`. Epics/parents played **no** navigational role historically.

## 4. Corrections made during the session (kept honest)

1. **"implementedBy gap" was false** — a `.root` JSON-path parsing error. The edge works in both directions. No FEEDBACK.md entry, no fix.
2. **A heavy PDR-006 draft was written, then withdrawn** — it conflated two lineages (taxonomy + process) and was over-engineered. Removed (uncommitted, net-zero).
3. **The tag retirements belong to the taxonomy lineage** (ADR-001 / ADR-007), not a new process decision record — ADR-001 already cut `@architect-phase`; ADR-001 owns `@architect-quarter` and the USDP phases; ADR-007 (`@architect-status:active`) is the live narrowing vehicle.
4. **vNEXT and the release nodes are NOT dead weight.** vNEXT is the established "accumulate unreleased scope under a floating label, name the version once scope is clear" practice — i.e. the **forward-planning staging container**. It is currently unwired, not unwanted. Kept.
5. **`.pr-coordination/` is for non-spec-driven bootstrap work**, not the home for this.

---

## 5. Decisions (locked)

1. **Epics/slices are durable, thin, edge-derived navigation nodes.** Deletion-exempt (the value-transfer gate targets only design-tier specs). Members derived from reverse `@architect-parent` edges, never hand-listed. Design rationale that accretes during member design goes to ADRs/JSDoc — the epic stays a thin index. (Net-new doctrine; the code already proves the survival mechanism.)
2. **Two orthogonal axes.** A durable **structural hierarchy** (`epic › phase › task` via `@architect-level`/`@architect-parent`) is the read model's navigation + doc-grouping unit. A **temporal release axis** is separate. A pattern's hierarchy position never encodes when it shipped; the release axis never groups patterns structurally. (Conflating the two was the documented mistake of the pre-extraction process.)
3. **Release has a two-sided lifecycle:**
   - **Planned / unreleased** (vNEXT, or a named future target) = **live read-model state** — a forward-planning grouping you assign roadmap work to _before_ cutting. This is live intent, not history, so it legitimately lives in the read model. **vNEXT is kept** as the standing staging node. This is the proven thin-node + `@architect-release` tag model.
   - **Shipped** = the cut is a git event; _"history lives in git."_ The changelog is a generated projection.
   - **Direction:** thin release nodes + `@architect-release` tag + generated changelog (matches both libar-platform ADR-002 and the user's vNEXT practice, and — unlike pure-git — **supports planning ahead**, since git tags are retrospective and cannot hold a not-yet-cut release).
4. **`implements` + epics is sufficient for navigation** (verified). No wiring work needed.
5. **Hierarchy `@architect-level:phase` is held in reserve** — introduced only when an epic is large enough to need an intermediate planning bucket. It is the plan-ahead / sub-epic-grouping container candidate. Costs nothing to adopt later (already registered).
6. **Numeric/quarter/USDP-phase retirement rides the taxonomy lineage**, not a process record. `@architect-phase` is already cut at the registry; the quarter + USDP-phase removal and vestigial-tag cleanup are a new ADR amending ADR-001 / extending ADR-007's active narrowing.
7. **Retire genuinely-aspirational residue:** `phase-numbering-conventions.feature`, `living-roadmap-cli.feature` (confirmed orphans, never built, old monorepo paths).

## 6. Keep / Retire / Defer

|                      | Item                                                                    | Disposition                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Keep**             | `ReleaseVNEXT` (forward-planning staging)                               | Keep — wire later when releases are practiced                                                                                             |
| **Keep**             | Changelog projection contract (`ReleaseNotesDigest`)                    | Keep — wire to source later                                                                                                               |
| **Keep**             | Hierarchy axis; `implements` edge                                       | Keep — working as intended                                                                                                                |
| **Keep**             | Hierarchy `@architect-level:phase` rung                                 | Hold in reserve (unused, zero-cost)                                                                                                       |
| **Retire**           | `phase-numbering-conventions.feature`, `living-roadmap-cli.feature`     | Delete (orphans, aspirational)                                                                                                            |
| **Retire**           | Vestigial `@architect-phase:N` annotations (~8 test features)           | Clean up (registry tag already cut)                                                                                                       |
| **Retire/re-scope**  | `@architect-quarter` + USDP-6-phase canonical defs                      | Via taxonomy ADR (touches `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES`, schema, `byQuarter`/`byPhase` views, `getQuarters`/`getPatternsByPhase`) |
| **Defer**            | Release-model wiring (changelog source: nodes vs git; tag registration) | Decide at first practiced release                                                                                                         |
| **Defer**            | `ReleaseV100` (shipped) representation: thin node vs git tag            | Decide with the release-model wiring                                                                                                      |
| **Defer (optional)** | `grouping: by-epic` for business-rules/requirements projections         | Feature work, only if wanted                                                                                                              |

---

## 7. Mechanical work for a fresh session (the handoff)

Run the standard gates after each unit: `pnpm typecheck && pnpm test && pnpm validate:all && pnpm architect:guard --staged`, plus `pnpm docs:all && pnpm docs:check` for determinism. No-BC throughout (delete, don't shim). Commit only when the user asks.

1. **Skills doctrine (the net-new decision).** Edit the canonical `.agents/skills/` set (`.claude`/`.codex`/`.opencode` are symlinks):
   - `architect-sessions/references/ephemeral-spec-deletion.md` — add: `@architect-level:epic|slice` specs are **durable** (deletion-exempt); their members are **edge-derived** from reverse `@architect-parent`, which persists on each member's durable surface, so the epic stays an accurate index after every member's design spec is deleted.
   - `architect-base/SKILL.md` §3 (folder-role table) — epic/slice lifetime = durable navigation node.
   - `architect-base/references/four-tier-ladder.md` + `spec-pattern-relationships.md` — "members are edge-derived; don't hand-list names; keep the epic a thin index."
   - Run `pnpm check:skills`.
2. **Slim the `DocumentationProjection` epic** (`architect/specs/documentation-projection/00-documentation-projection.feature`, ~79 lines). Move the accreted "Resolved direction (…)" design substrate to ADRs (the emission-mode born-accepted ADR the epic already anticipates; note **ADR-011 is reserved** by the epic for the composition-basis amendment) + JSDoc. Drop the hand-listed member **names** from `**Members:**` (keep only the member-type classification — capability-invariant vs deliverable-family — if it carries signal the edges don't). This is editing an idea-tier epic → `architect-sessions` (plan), not refactor-session.
3. **Taxonomy ADR** (amends ADR-001 / extends ADR-007's active narrowing): retire `@architect-quarter` + the USDP-6-phase canonical definitions; clean up the ~8 vestigial `@architect-phase:N` annotations on test features; confirm removal from `CANONICAL_FEATURE_ONLY_TAG_SUFFIXES`, the `ExtractedPattern` schema fields, the `byPhase`/`byQuarter` views, and `getPatternsByPhase`/`getQuarters` — or explicitly re-scope. Author it as a born-accepted record (`@architect-adr-category:process`/`architecture`, theme `taxonomy`) — **do not** duplicate this into a process record.
4. **Retire orphans:** delete `architect/specs/phase-numbering-conventions.feature` and `architect/specs/living-roadmap-cli.feature` (confirmed no consumers: `usedBy`/`implementedBy` empty).
5. **Release model — record the direction, don't build it:** the thin-node + `@architect-release` tag + generated-changelog model (supports vNEXT staging + planning ahead). The open sub-decisions — changelog source (release nodes vs git), `@architect-release` tag registration, and `ReleaseV100`'s representation (thin node vs git tag) — are deferred until the first release is cut. **Keep `ReleaseVNEXT`.**

## 8. Open / deferred decisions

- **Release changelog source:** thin release nodes + `@architect-release` tag (ADR-002 proven; supports planning ahead) **vs** pure-git derivation (cleaner event-sourcing, but git tags are retrospective and **lose forward planning**). Leaning toward the node+tag model given the vNEXT practice. Decide at first practiced release.
- **Editorial release narrative** (highlights / breaking changes / migration notes) can't be derived from git or status — it needs a carrier (the thin release node, or an annotated git-tag message). Folded into the above.
- **`ReleaseV100` (shipped) representation:** thin node vs git tag — decide with the model.
- **`grouping: by-epic`** for business-rules/requirements projections — optional payoff; the epic becomes a generated-doc grouping key (today they group by package).
- **(minor)** Whether `documentation patterns` should render an "## Implementations" section (the mature tooling did; the edge is present, only the rendering may be absent) — verify and decide.

## 9. References & evidence

- **This repo — decisions:** ADR-001 (canonical values; `@architect-quarter` Rule 6/7, USDP phases Rule 8, `@architect-phase`-cut note), ADR-007 (active coordinated taxonomy redesign), ADR-003 (source-first — parent edge travels with identity), ADR-006 (single read model), ADR-010 (composition helpers; ADR-011 reserved), PDR-005 (process-guard FSM).
- **This repo — code:** `gherkin-extractor.ts:539` (parentToChildren / edge-derived members); `relationship-resolver.ts:104,141–152` (reverse edges incl. `implementedBy`); `fragments/delivery-reporting/release-notes-digest.ts` (changelog contract, unpopulated).
- **This repo — doctrine:** `ephemeral-spec-deletion.md`, `four-tier-ladder.md`, `spec-pattern-relationships.md`, `taxonomy.md`, `decision-records.md`.
- **Old repos:** `libar-platform/architect/.../adr-002-release-management-architecture` (thin release files + tags + generated changelog; "releases are what matter, phases are internal detail"); `CHANGELOG-GENERATED.md` (populated, node+tag-sourced); tag-frequency table (§3).
- **Verified empty/orphan:** `getAllPhases`/`getActivePhases`/`getQuarters` = `[]`; `arch neighborhood ReleaseVNEXT`/`ReleaseV100`/`PhaseNumberingConventions`/`LivingRoadmapCLI` = no edges.
