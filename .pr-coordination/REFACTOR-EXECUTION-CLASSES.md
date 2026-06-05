# Refactor execution — classes of change (ADR-013 / PDR-006 / ADR-012 consolidation)

**Date:** 2026-06-05 · **Branch:** `campaign/docs-and-skills-consolidation`
**Companion to:** [`REFACTOR-CONSOLIDATION.md`](REFACTOR-CONSOLIDATION.md) — the **verified context source** (what was decided, what already landed, the R1–R11 register with `file:line` evidence). Read it first; this document does not repeat its evidence, it consumes it.
**Grounding:** the born-accepted decision corpus — **ADR-013** (taxonomy retirement), **PDR-006** (advisory process guard), **ADR-012** (delivery navigation) — plus the bootstrap doctrine in `CLAUDE.md`. Read every record through the Data API (`pnpm architect:query documentation decisions`, `pattern ADR013…`), never paraphrased.

---

## How to use this document — the contract for every class below

This plan is deliberately organized as **classes of change**, not as sessions, file lists, or step sequences. The repo is event-sourced: a file-enumerated plan is a snapshot that rots, and it teaches an executing agent that an unlisted surface is "out of scope." Every class below is written to force the opposite — deep understanding, then full-scope discovery.

The contract that makes this safe — hold every class to it:

1. **A class is a complete unit of issue, not a session.** Discover its *entire* extent and clean it up in full. How many sessions/PRs that takes is the executor's call.
2. **Seed examples are starting points, never the boundary.** Where this plan (or `REFACTOR-CONSOLIDATION.md`) names a specific surface, it is a place to *begin discovery*. An unlisted surface exhibiting the same class of issue is **in scope by definition**. If you find yourself thinking "that wasn't in the list," that is the signal the list was a seed and you have found more of the class.
3. **Completion is a property that holds against live state — not "the seeds were edited."** Each class states verifiable completion criteria: standing gates that must stay green, detection sweeps that must come back clean (you design and run them), and the judgment call (if any) resolved and grounded. Done means the property holds when re-checked against the live graph, not that you touched the named files.
4. **Re-verify, don't trust.** `REFACTOR-CONSOLIDATION.md` was first-hand verified, but state moves every commit (anti-anecdote: the live CLI/PatternGraph wins over any prose, including this document). Confirm each claim against live state before acting on it.
5. **Decisions are born-accepted.** Where a class carries a judgment call, the doctrine ground is given but the call is **not** pre-made here. Resolve it as part of the work, prove it with the code, then **record it by widening the relevant ADR in place** (no new ADR, no amend-chain — the campaign's own "widen ADR-013 in place" precedent; `CLAUDE.md` bootstrap doctrine).

**The standing-gate floor (every class, non-negotiable):** `pnpm typecheck && pnpm test && pnpm validate:all`, plus `pnpm docs:check` (projection determinism), `pnpm check:skills` (skill-symlink wiring) where doctrine surfaces change, `pnpm architect:query arch dangling --strict` (graph integrity), and `pnpm architect:guard --staged`. A class is never complete with a red gate; never `--no-verify`, never suppress. Each class adds its own properties **on top** of this floor.

---

## Class map — the logical grouping

The four classes partition the remaining work along two axes: **which layer** the issue lives in (production code vs. authoritative non-code surfaces), and **whether the governing decision is already settled** (propagate it) or **still open** (resolve it, then record). Each cell is one cohesive class.

| | **Decision settled — propagate it** | **Decision open — resolve, then record** |
|---|---|---|
| **Read-model / production code** | **Class 1 — Retired-axis read-model residue** | **Class 2 — Process-metadata band** |
| **Authoritative non-code surfaces** | **Class 4 — Doctrine/spec/skill reconciliation** | **Class 3 — Release-axis story** |

Two classes (1, 4) **execute decisions already made** — the work is exhaustive discovery and consistent propagation. Two classes (2, 3) **carry one open judgment call each** — the work additionally requires making that call on doctrine grounds and recording it born-accepted.

---

## Class 1 — Retired-axis read-model residue

**Invariant.** No production code in `packages/*/src/**` reads, branches on, re-exposes, or derives a view from a **retired axis** — `@architect-quarter`, numeric `@architect-phase`, `@architect-release`, or the `@architect-completed` *completion date*. ADR-013's "the schema field is removed" is true with **zero latent residue** across the whole read side, not just the sampled spots.

**Why this class exists.** ADR-013 retired these four axes and `REFACTOR-CONSOLIDATION.md` §2 verified the *schema fields* and *derived views* are gone. But the same verification surfaced residue the original cull missed at the edges: a dead scanner *read* of `phase` that survived the field removal, a retired-tag guard that did not yet flag re-introduction of the retired suffixes, stale build artifacts. The pattern is clear — the cull removed the obvious definitions but left *reads, guards, and edge machinery* behind. This class proves the retirement holds across the entire read side.

**Judgment call.** None — these four retirements are settled by ADR-013. (Two look-alikes are explicitly **not** retired and must survive untouched: the FSM status `@architect-status:completed` / `pattern.status === 'completed'`, and the structural `@architect-level:phase`. The retired things are the *temporal/release* axes only.)

**In scope.** Every production read/branch/derivation/guard touching the four retired axes. **Out of scope:** the process-metadata band (`effort`/`priority`/`workflow`/… — Class 2); the release *concept's* canonization in doctrine (Class 3 owns release end-to-end; this class only ensures no *production code* still reads `pattern.release`).

**Where to begin discovery.** Read ADR-013 through the Data API. Then design a sweep for *reads* (not just definitions) of each retired field across all six packages, and a parallel check that the retired-tag guard is suffix-exact and covers all five retired suffixes while sparing the status/level look-alikes. The hard part is judgment, not grep: distinguish genuine residue from *intentional* detector fixtures and prose mentions (the consolidation doc identified legitimate intentional cases — do not "fix" those). Seeds to start from live in §4 R9 (a scanner phase-read) and R8b (a prose mention); treat them as the first two finds, not the set.

**Completion criteria.**
- The standing-gate floor is green.
- A documented retired-axis read sweep (you author and run it) returns only hits that are either removed or individually justified as intentional fixtures/prose — with the justification recorded.
- The retired-tag guard provably flags all five retired suffixes **and** provably does **not** flag `@architect-status:completed` or `@architect-level:phase` (a regression scenario asserts both directions).
- `arch dangling --strict` is clean.
- No production code path reads, sorts, groups, or renders by a retired axis.

---

## Class 2 — Process-metadata band

**Invariant.** `ExtractedPattern` / `ProcessMetadataSchema` carry **exactly** the process-metadata tags ADR-001 Rule 6 sanctions (the package adds only `workflow`; the floor is `team`), and **no** live grouping / sorting / rendering machinery references a band member that no pattern actually populates.

**Why this class exists.** A band of process-metadata fields — `effort`, `effortActual`, `risk`, `priority`, `since`, `userRole`, `businessValue`, alongside the legitimate `team` / `workflow` — still sits in the schema at ~0 population, covered by **no ADR**, while live machinery (generator grouping/sort options) still groups and sorts by members of it. Meanwhile ADR-001 Rule 6 was *already* narrowed (in this campaign) to "package adds only `workflow`." So the schema and the rule it is supposed to satisfy have drifted apart, and there is dead group/sort surface keyed on fields nothing fills. Bootstrap doctrine is explicit: "unpopulated machinery is residue to delete, not maintain."

**Judgment call (the one open decision in this class).** **Cull the unpopulated band, or keep it as forward-looking machinery?** Decide it on doctrine grounds, not preference. The doctrine lean is **cull** — but the call is yours to make against live population data and the cost of the machinery, and two members are load-bearing and must survive whatever you decide: `workflow` (the package legitimately adds it per Rule 6) and `team` (the Rule-6 floor). Whatever you choose, the schema, the live machinery, **ADR-001 Rule 6**, and **ADR-013** must end mutually consistent — and the decision is recorded *after* the code proves it, by **widening ADR-013 in place** (no ADR-014), per the campaign's own precedent.

**In scope.** The process-metadata band only — its schema definition, extraction/parse, every group/sort/render path keyed on it, business-rule scope/grouping, and fixtures. **Out of scope:** the retired quarter/phase/release/completed-date axes (Class 1); the release axis (Class 3).

**Where to begin discovery.** Read ADR-001 (Rule 6) and ADR-013 through the Data API, and confirm the live population of each band member before deciding (a field nothing fills is the doctrine's definition of residue). Then trace each band member through the full read side: schema → extractor/parser → generator group-by/sort-by/priority options → business-rule scope/grouping/variants → renderer columns → fixtures. The consolidation doc's §4 R1 names the generator-options sort/group surface and the fixture spreads as seeds; the full surface is what you must find.

**Completion criteria.**
- The cull-vs-keep decision is made and explicitly grounded in doctrine + live population data.
- The schema carries exactly the tags ADR-001 Rule 6 sanctions — no more, no fewer — with `team` and `workflow` preserved.
- No dead group/sort/render path references a band member the decision removed.
- ADR-001 Rule 6, the schema, and the canonical-values **sync test** all agree (the sync feature passes for the right reason, not by coincidence).
- ADR-013 is widened in place to record the decision; the standing-gate floor is green.

---

## Class 3 — Release-axis story

**Invariant.** The "release" concept is expressed **consistently across every authoritative surface — code *and* doctrine** — either as **git-tag-derived per `ArchitectureDelta`** or deleted outright; **no** surface canonizes `architect/releases/` or a "Release Manifest" as a permanent, first-class artifact while it is empty/unpopulated; and no empty source glob still points at a removed release directory.

**Why this class exists.** The release retirement is **half-done**, and the unfinished half is the more authoritative one. The *code* globs are empty (`architect/releases/` was deleted), but four authority layers still canonize the release axis as permanent and first-class: a **permanent ADR** (the folder-role table marking `releases/` "Durable"), the **formal-spec** (a first-class "Release Manifest" Type-4 "Permanent" artifact and a Level-2 standard), the **skills** (folder-role "Permanent"), and **package PRDs** (advertising removed release projections). ADR-013 already forward-points to the replacement: releases derive from **git tags via `ArchitectureDelta`**. But the `ArchitectureDelta` spec itself — the vehicle ADR-013 leans on — currently carries doctrine-**forbidden** concepts (`@architect-replaces`, "deprecated patterns", numeric "phases"), so it cannot yet *be* that clean vehicle. The release story has to be settled once and made true everywhere, vehicle included.

**Judgment call.** **Is there any populated release *surface* in the read model, or is "release" purely a git-tag-derived view with no manifest/annotated artifact at all?** ADR-013's forward note leans **git-tag-only** (history lives in git; no annotated release axis). Resolve it once on that ground, and decide in passing whether the now-empty `architect/releases/` folder concept survives at all. Record by **widening ADR-013 in place** and correcting the permanent ADR's folder-role canonization so the two no longer contradict each other.

**In scope.** Everything release: residual code globs/fixtures; the release canonization wherever it appears across permanent ADRs, formal-spec, skills, and PRDs; **and the entire `ArchitectureDelta` spec** (both as the git-tag release vehicle and its forbidden-concept cleanup — `@architect-replaces`, deprecation language, numeric phases). **Out of scope:** non-release doctrine drift (Class 4) — even though both touch doctrine layers, they own disjoint concepts.

**Where to begin discovery.** Read ADR-013, the permanent folder-role ADR, and the `ArchitectureDelta` spec through the Data API. Then sweep the authority layers **in authority order** (permanent ADRs → formal-spec normative → skills → PRDs) for every canonization of release manifests / `architect/releases` / the release axis, and find every empty source glob still pointing at the deleted directory. The consolidation doc's §4 R2 + R10 enumerate the surfaces found so far; the canonization recurs — expect more than the seeds.

**Completion criteria.**
- The release story is decided and grounded in ADR-013's git-tag direction.
- Every authoritative surface — code globs **and** all four doctrine layers — tells the *same* release story; none canonizes an empty `architect/releases/` or a "Release Manifest" as permanent/first-class unless it is actually populated.
- The `ArchitectureDelta` spec is free of `@architect-replaces`, deprecation language, and numeric-phase concepts, and reads as a coherent git-tag release-boundary vehicle.
- No empty source glob references a removed release directory.
- The permanent folder-role ADR and ADR-013 are mutually consistent and the decision is recorded; standing-gate floor + `check:skills` green.

---

## Class 4 — Doctrine / spec / skill reconciliation to the post-retirement model

**Invariant.** Every authoritative **non-code** surface — permanent ADRs, formal-spec normative docs, skills, package PRDs, and unbuilt/active specs — reflects the decisions the read model **already implements**: the **advisory** process-guard model (PDR-006), **edge-derived structural epics** (ADR-012), the retirement of numeric-`phase`/`quarter` concepts (ADR-013, the *non-release* part), and the **bootstrap in-place-amendment** doctrine. No authoritative surface asserts a retired concept as live, describes the guard as terminal / hard-block / unlock-required, omits edge-derived epics, or prescribes amend-by-superseding-record.

**Why this class exists.** This is the consolidation doc's unifying frame (§4): *the read model moved to the new decision model; the spec/doctrine/skill layer hasn't caught up.* Concretely, the same stale world recurs at multiple authority levels — the **advisory** guard (PDR-006) is contradicted by the formal-spec's full hard-block lifecycle (which the conformance spec normatively *requires*) and by several skills; ADR-012's edge-derived epics are absent from the skills; retired numeric-`phase`/`quarter` concepts are still documented as live or canonical in the formal-spec (a `byPhase` view, `@architect-phase` as the canonical "number" example) and in PRDs (removed methods advertised, a stale doc-type count); the `DocumentationProjection` epic's own *active* spec asserts retired schema fields/views are "live"; and a candidate spec (`DecisionRecordTemporalHygiene`) prescribes the **opposite** of the bootstrap in-place doctrine this very campaign followed. Stale authority misleads in proportion to its authority — which is why this class moves in authority order.

**Judgment call (one, narrow).** **`DecisionRecordTemporalHygiene`** — re-scope it to the bootstrap **in-place-amendment** model the campaign demonstrated, or mark it explicitly a **post-1.0** spec whose append-only/supersede premise is suspended during bootstrap? Decide on `CLAUDE.md`'s bootstrap doctrine. Everything else in this class is *propagating settled decisions*, not making new ones.

**In scope.** All authoritative non-code surfaces, for every drift **except** release (Class 3) and the process-metadata band (Class 2). **Out of scope:** code residue (Classes 1–2); the release axis (Class 3); and the `DocumentationProjection` epic *build* plus the changelog honest-rename — those are downstream roadmap work (see "Not in any class"). This class only makes the epic's *specs* honest, not the epic itself.

**Where to begin discovery.** Read PDR-006, ADR-012, ADR-013, and the bootstrap doctrine (`CLAUDE.md`) through the Data API and the repo. Then sweep the authority layers **in strict authority order** — permanent ADRs > formal-spec normative (conformance-referenced) > skills > PRDs > unbuilt specs — for each stale concept: the hard-block/terminal/unlock-required guard model, missing edge-derived-epic doctrine, retired numeric-`phase`/`quarter` presented as live, false "live" claims in active/unbuilt specs, and append-only ADR-amendment prescriptions. The consolidation doc's §4 R3/R4/R6/R10(non-release)/R11 enumerate surfaces found so far; the same stale model recurs across surfaces not yet enumerated — find the complete set. Run `pnpm check:skills` after any skill edit.

**Completion criteria.**
- A detection sweep (per stale concept × per authority layer, which you design) returns only reconciled surfaces.
- No authoritative non-code surface contradicts the advisory-guard model (PDR-006), the edge-derived-epic model (ADR-012), the retirement of numeric-`phase`/`quarter` (ADR-013), or the bootstrap in-place-amendment doctrine.
- The formal-spec's conformance levels and its delivery-lifecycle section are internally consistent with PDR-006 (no normatively-required section still mandates the hard-block model).
- The `DecisionRecordTemporalHygiene` re-scope is decided and grounded.
- `pnpm check:skills` + the standing-gate floor are green.

---

## Not in any class — chores & deferrals (deliberately excluded)

These are excluded *on purpose*: a class earns its place only if its scope is latent (must be discovered) and its correctness needs judgment. The items below are mechanical, deliberately-named, or downstream — folding them into the plan would pad it with no-thought work.

- **Changelog honest-rename (§4 R5).** Coupled to the `DocumentationProjection` epic *build* (it churns route-id/registry/tests); do it inside that rework, not here.
- **The `DocumentationProjection` epic build itself.** Downstream roadmap work. This consolidation only makes its specs honest (Class 4).
- **Stale `plans/*` working notes (§4 R7).** Deferred by explicit user call.
- **Mechanical / deliberately-named residue (§4 R8a/c/d).** Stale `dist/` artifacts (clear on next build); the protection `level: "hard"` enum name (deliberate — level ≠ severity, per CR-7); the two pre-existing invalid-pattern-name diagnostics in *unchanged* files (not campaign-introduced — do not mistake for a regression). A class sweeps these in passing if it touches them; none warrants a plan.

---

## Cross-class relationships & suggested order

- **Classes 1 and 2 are code-side and independent** — either can go first. Class 1 propagates a settled decision; Class 2 carries one open call.
- **Class 3 owns the `ArchitectureDelta` spec**, which is the git-tag release vehicle ADR-013 forward-points to — so Class 3 should land before any downstream release tooling depends on that vehicle being clean.
- **Classes 3 and 4 both touch doctrine layers but on disjoint concepts** (release vs. everything-else). Run them aware of each other so two efforts don't edit the same formal-spec section blind; authority-order discipline applies within each.
- **All four share the standing-gate floor.** A class is done only when the gates **and** its own stated properties hold against live state — not when the seed examples were edited.
