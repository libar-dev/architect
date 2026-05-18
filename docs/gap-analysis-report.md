# Gap Analysis Report

**Date:** 2026-05-17
**Route:** brownfield
**Analysis Method:** Manual review (BF-2c fallback)
**Inputs:**

- `.specify/specs/` — 21 Spec Kit feature specifications + 5 plans
- `.specify/RECONCILIATION_REPORT.md` — Gear 3 reconciliation output
- `docs/reverse-engineering/technical-debt-analysis.md` — 12-item debt inventory
- Code under `packages/architect-*/`

> **Note on method.** The AST-powered roadmap (`run-ast-analysis.mjs`) is the primary brownfield path but its `dist/` artifacts are not built in this environment. `/speckit.analyze` is a separate slash-command not invocable from this skill context. The fallback used here is the manual path (BF-2c) — but the heavy lifting was already done during Gear 2 (reverse engineering) and Gear 3 (reconciliation), so this report consolidates those findings into the canonical gap-analysis shape rather than re-deriving them.

---

## Executive Summary

- **Overall Completion:** ~88% (by spec count; weighted lower against pre-1.0 milestones)
- **Complete Features:** 15 / 21 (71%) — specs 001-005, 007-016, 018
- **Partial Features:** 4 / 21 (19%) — specs 006, 017, 019, 021
- **Missing Features:** 1 / 21 (5%) — spec 020 (CI workflows + perf gate)
- **Critical Issues:** 1 — `.github/workflows/` absent; the "CI-enforced doctrine" claim in `AGENTS.md` has no enforcement surface in this worktree.
- **Clarifications Needed:** 5 (see Clarifications section)

**Verdict.** This is an inverted gap profile: the runtime is mature (2828 tests, full TypeScript strictness across the workspace, dogfooded architect pipeline). The gaps are **(a) documentation drift**, **(b) the W1.5 split-package migration's last mile**, **(c) the missing CI surface**, and **(d) graduating the formal spec to public v1.0**. The `no-suppressions` doctrine forbids the TODO / `@ts-ignore` / `@deprecated`-as-shim smells gap analyses usually surface, so the inventory is unusually short.

---

## Analysis Results

### Inconsistencies Detected

1. **006-mcp-server** (PARTIAL — doc drift)
   - Specification: MCP server ships **21 tools**, registered in `ARCHITECT_MCP_TOOLS`.
   - Implementation: `packages/architect-mcp/src/tool-metadata.ts:1-71` does ship 21 tools.
   - Drift: `packages/architect/package.json` description says "18 tools"; `docs/MCP-SETUP.md:88-106` enumerates 18.
   - Impact: External consumers reading npm or the setup doc form a stale tool inventory. (Tech-debt #2, #12.)

2. **AGENTS.md ↔ `architect-cli` / `architect-mcp` runtime-helpers**
   - Specification (`AGENTS.md` §"Operational notes"): `process.env.PWD` is checked **before** `process.cwd()`; embedders should strip `PWD` and `INIT_CWD`.
   - Implementation: `packages/architect-cli/src/cli/runtime-helpers.ts:36-56` and `packages/architect-mcp/src/runtime-helpers.ts:16-36` try `process.cwd()` first; `INIT_CWD`/`PWD` are fallbacks on failure only.
   - Impact: Subprocess embedders strip env vars that would have been ignored anyway. The doctrine is wrong about its own runtime. (Tech-debt #1.)

3. **AGENTS.md "four edges" ↔ projection's seven relation kinds**
   - Specification (`AGENTS.md` §"Pattern graph"): four edge kinds (`depends-on`, `uses`, `implements`, `see-also`).
   - Implementation: `packages/architect-projection/src/fragments/pattern-relations/supporting.ts:66-74` ships **seven** (`depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`).
   - Impact: External consumers writing edge-filter logic against the doc miss `enables`, `extends`, `api-ref`. (Tech-debt #3.)

4. **No `.github/workflows/` directory committed**
   - Specification (spec 020 + `AGENTS.md` §"Engineering doctrine" + §"Perf regression gate"): "CI-enforced" typecheck, test, validate:all, format:check, guard:no-suppressions, perf-regression gate. Release via `@changesets/cli`.
   - Implementation: absent from this worktree. All six gate scripts work locally; none of them are wired to a PR-blocking surface. (Tech-debt #5.)
   - Impact: First-time contributors form the impression that the doctrine claims are aspirational. The perf-regression test exists but does not fire on PRs.

5. **`REMAINING-WORK.md §W1.5.7` ↔ `MIGRATION.md`**
   - Specification (`AGENTS.md` §"Package family"): v1→v2 collision map "will graduate to a standalone `MIGRATION.md` at the `2.0.0-pre.1` release."
   - Implementation: today the map lives only inside `REMAINING-WORK.md` (57 KB). `MIGRATION.md` (8 KB) has the broad-strokes story but no symbol-relocation table. (Tech-debt #8.)
   - Impact: Consumers migrating from v1 cannot find the per-symbol relocation guide without spelunking the backlog.

6. **`PWD/INIT_CWD` revisiting note still flagged in `REMAINING-WORK.md`**
   - The note is flagged `[NEEDS REVISITING]` even though the runtime patch landed (tech-debt #1 is doc-only). (Tech-debt #6; couples with #1.)

7. **Backward-compatibility alias in `role-constants.ts:65-67`** (supplementary, surfaced during Gear 3 spec generation)
   - `packages/architect-core/src/config/role-constants.ts:65-67` re-exports `DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES`. Grep against `packages/*/src/` shows only barrel re-exports; no internal caller uses it.
   - This is exactly the "renaming-an-old-name-from-a-new-location" pattern forbidden by constitution §III.A and `AGENTS.md` §No-BC.
   - Resolution: tracked as item #5 inside spec `021-doctrine-doc-drift-fixes/spec.md`; may be deferred into spec 017's `2.0.0-pre.1` cut.

8. **`@architect-usecase` retirement is mid-flight** (Tech-debt #4)
   - Commit `691da3c refactor(taxonomy): retire @architect-usecase` is the live campaign. Lingering references may remain in docs not yet regenerated; surface them with grep and clean up incidentally.

9. **`1abd4b1 WIP` in `main` history** (Tech-debt #9)
   - Non-final commit message in the trunk. Hygiene smell, not a correctness issue.

10. **Two undocumented `architect.config.ts` keys silently stripped** (Tech-debt #11)
    - `codecOptions` and `referenceDocConfigs` are stripped before validation in `packages/architect-core/src/config/config-loader.ts:189-195`. The strip uses string concat to dodge an unused-property lint check — a workaround that future readers will find puzzling. Decide: document the strip or remove the keys entirely.

11. **Two Gherkin parsers in play** (Tech-debt #10, structural footgun, deprioritize)
    - `@cucumber/gherkin` (build time, `architect/specs/`) + `@amiceli/vitest-cucumber` (test time, `tests/features/`). Documented; collapsing onto one parser is a multi-day refactor with low payoff. Accept and document.

---

## Gap Details

### Missing Features (1 feature)

#### 020-ci-perf-gate: CI Workflows + Perf Regression Gate &nbsp;**[P0]**

**Specification:** `.specify/specs/020-ci-perf-gate/spec.md` + `plan.md`
**Status:** MISSING
**Impact:** The "CI-enforced doctrine" claim in `AGENTS.md` has no enforcement surface visible in this worktree. The projection perf-regression test exists in code but does not fire on every PR.
**Effort:** ~4-8 hours
**Dependencies:**

- Blocks: spec 017 (`2.0.0-pre.1` release cut needs `release.yml`); spec 019 (formal-spec publish workflow).
- Depends on: none — all six gate scripts already run locally.

**Acceptance criteria** (from spec 020):

- `.github/workflows/ci.yml` runs the six gates on every push and PR targeting `main`; failure blocks merge.
- `.github/workflows/release.yml` consumes `@changesets/cli` and publishes the `fixed` group with `access: public` (NFR-009).
- Perf-regression gate fires with `baseline × 1.5` threshold; baseline is human-updateable only (no auto-rebase).
- `AGENTS.md` §"Engineering doctrine" + §"Perf regression gate" link to the workflow file.

### Partial Features (4 features)

#### 006-mcp-server: MCP Server (Tool-Count Doc Drift) &nbsp;**[P0]**

**Specification:** `.specify/specs/006-mcp-server/spec.md` + `plan.md`
**Status:** PARTIAL — code is correct (21 tools, `z.strictObject(...).readonly()` discipline, 500ms watch debounce, `architect_rebuild` manual refresh, stdio transport). Two docs are stale.

**Implemented:**

- 21 tools in `ARCHITECT_MCP_TOOLS` (`packages/architect-mcp/src/tool-metadata.ts:1-71`).
- `z.strictObject(...).readonly()` on every input schema (ADR-009 trust boundary).
- `--watch` mode + `architect_rebuild`.
- Wiring snippet in `docs/MCP-SETUP.md` (the wiring section is correct; only the *tool list* is stale).
- `CLAUDE.md` / `AGENTS.md` §"Package family" cites 21 tools correctly.

**Missing:**

- `packages/architect/package.json` meta description says "18 tools" — should say 21 (Tech-debt #2).
- `docs/MCP-SETUP.md:88-106` enumerates 18 tools — should enumerate all 21 with the registry as anchor (Tech-debt #12).

**Effort to Complete:** ~30 min as part of the Phase A bundle (021).
**Blockers:** None.

#### 017-coordinated-package-versioning: W1.5 Close-out + MIGRATION.md Graduation &nbsp;**[P1]**

**Specification:** `.specify/specs/017-coordinated-package-versioning/spec.md` + `plan.md`
**Status:** PARTIAL — the `fixed` changesets group is configured, acyclic dependency direction is verified, all six packages publish with `access: public`. The remaining work is W1.5 close-out and graduating the v1→v2 collision map to `MIGRATION.md`.

**Implemented:**

- `.changeset/config.json` `fixed` group across all six publishable packages.
- All six packages declare `access: public` (NFR-009).
- Acyclic dependency direction (constitution §III.D).
- Meta package has no JS exports — bin re-exports only.
- `MIGRATION.md` (8 KB) carries the v1-monolith → v2-split narrative at the broad-strokes level.

**Missing:**

- Standalone `MIGRATION.md` with the per-symbol relocation table (today only lives as `REMAINING-WORK.md §W1.5.7`) — Tech-debt #8.
- Resolution of W1.5 remainder items per `REMAINING-WORK.md` (57 KB; maintainer's canonical backlog) — Tech-debt #7.
- `2.0.0-pre.1` release cut via `pnpm changeset version` with the `fixed` group intact.
- Post-cut verification that no new dependency cycles were introduced.

**Effort to Complete:** Multi-day, maintainer-owned (not derivable from worktree).
**Blockers:**

- Spec 020 (need `release.yml` to actually publish the `2.0.0-pre.1` cut).
- Decisions in `REMAINING-WORK.md` itself — which items must-land-pre-1.0 vs. defer-with-issue vs. drop-from-scope.

#### 019-formal-spec-package: Graduate `@libar-dev/architect-spec` to v1.0 &nbsp;**[P1]**

**Specification:** `.specify/specs/019-formal-spec-package/spec.md` + `plan.md`
**Status:** PARTIAL — `formal-spec/` exists at the monorepo root with v0.2 draft text checked in; the reference implementation parses and validates it. The package is `private: true`.

**Implemented:**

- `formal-spec/` directory with v0.2 draft: Pattern model, four-tier ladder, FSM transitions, annotation grammar, edge taxonomy.
- Reference-implementation conformance is testable via dogfood fixtures.
- Cross-references from `docs/reverse-engineering/functional-specification.md` already point at `formal-spec/` and `docs/METHODOLOGY.md`.

**Missing:**

- v1.0.0 cut to npm with `access: public`.
- Independent release cadence (currently rides the `fixed` changesets group → every `core` patch bumps the spec).
- `formal-spec/README.md` for the methodology-reader audience (not contributors).
- Finalized publishable `docs/METHODOLOGY.md` (still a draft per `docs/DOCS-GAP-ANALYSIS.md`).
- CI workflow that publishes the spec on tagged release (blocked by spec 020).
- `MIGRATION.md` guidance on pinning `@libar-dev/architect-spec` to a specific version (blocked by spec 017).

**Effort to Complete:** ~1-2 days after specs 017 + 020 land.
**Blockers:**

- Spec 020 (release workflow).
- Spec 017 (release cadence decision: stay in `fixed` group or extract).

#### 021-doctrine-doc-drift-fixes: Phase A Bundle &nbsp;**[P0]**

**Specification:** `.specify/specs/021-doctrine-doc-drift-fixes/spec.md` + `plan.md`
**Status:** PARTIAL — five tech-debt items grouped into a single short PR.

**Implemented:**

- All target code already behaves correctly. `process.cwd()` precedence, 21 tools, 7 relation kinds — code is right; docs lag.

**Missing:**

- Patch `AGENTS.md` §"Operational notes" to describe actual cwd precedence; remove obsolete strip guidance (#1).
- Patch `packages/architect/package.json` `description` from "18 tools" to "21 tools" (#2).
- Patch `CLAUDE.md` / `AGENTS.md` §"Pattern graph" to enumerate all seven relation kinds, or to be explicit that "four edges" is the high-level model with seven projection-level kinds underneath (#3).
- Retire `REMAINING-WORK.md` PWD revisiting note (#6).
- Patch `docs/MCP-SETUP.md:88-106` to enumerate all 21 tools, anchored to the registry (#12).
- (Optional, may defer into spec 017) Delete `DDD_ES_CQRS_ROLES` alias in `role-constants.ts:65-67` and its barrel re-exports.

**Effort to Complete:** ~1-2 hours.
**Blockers:** None.

---

## Technical Debt

### High Priority (Blocking)

- **Tech-debt #5 — Missing CI workflow.** `.github/workflows/` absent. Doctrine claim has no enforcement surface. (Strategic, ≈4-8h. Tracked by spec 020.)
- **Tech-debt #7 — W1.5 lift not fully landed.** Live backlog in `REMAINING-WORK.md`. Blocks `2.0.0-pre.1`. (Strategic, multi-day. Tracked by spec 017.)
- **Tech-debt #1 — `PWD`/`cwd()` precedence doctrine drift.** High impact / low effort; consumers strip env vars that would have been ignored anyway. (Quick Win. Tracked by spec 021.)

### Medium Priority

- **Tech-debt #2 — MCP tool-count drift (`package.json`).** "18 tools" → 21. (Quick Win. Spec 006 + 021.)
- **Tech-debt #3 — "Four edges" framing is incomplete.** Missing `enables`, `extends`, `api-ref`. (Quick Win. Spec 021.)
- **Tech-debt #12 — `docs/MCP-SETUP.md` lists 18 tools.** Same root cause as #2; different file. (Quick Win. Spec 006 + 021.)
- **Tech-debt #8 — `v1→v2` collision-map graduation.** Lives in `REMAINING-WORK.md §W1.5.7`; should graduate to `MIGRATION.md`. (Strategic, falls out of #7 naturally. Spec 017.)
- **Tech-debt #10 — Two Gherkin parsers in play.** Structurally a footgun for new contributors; today mitigated by documentation. Deprioritize — collapsing onto one parser is a multi-day refactor with low payoff.

### Low Priority

- **Tech-debt #4 — `@architect-usecase` retirement is mid-flight.** Lingering references may remain in docs not yet regenerated. Opportunistic, ≈30 min when revisiting the taxonomy campaign.
- **Tech-debt #6 — `REMAINING-WORK.md` `PWD` revisiting note.** Couples with #1; retire alongside spec 021.
- **Tech-debt #9 — `1abd4b1 WIP` in `main` history.** Hygiene smell, not a correctness issue.
- **Tech-debt #11 — Two stripped undocumented `architect.config.ts` keys.** `codecOptions` and `referenceDocConfigs` stripped via string concat to dodge a lint check. Document or remove.

### Supplementary (surfaced during Gear 3)

- **`DDD_ES_CQRS_ROLES` BC alias in `role-constants.ts:65-67`.** Forbidden by constitution §III.A. 3-line delete + 2 barrel re-export removals. Tracked as item #5 in spec 021; may defer into spec 017.

---

## Prioritized Roadmap

### Phase 1: P0 Critical (~6-10 hours)

**Goals:**

- Eliminate doctrinal drift between docs and runtime (first impression for outside contributors).
- Make the "CI-enforced doctrine" claim actually enforced.
- Unblock the `2.0.0-pre.1` release cut (spec 017 needs `release.yml`).

**Tasks:**

1. **Single combined PR: spec 021 + spec 006** (~1-2h). Phase A bundle closes tech-debt #1, #2, #3, #6, #12 (and optionally the `DDD_ES_CQRS_ROLES` BC alias). Anchor `docs/MCP-SETUP.md` tool list to the registry to bound future drift risk structurally.
2. **Commit `.github/workflows/`: spec 020** (~4-8h). Two files minimum (`ci.yml`, `release.yml`); a third for the perf gate if separated. Wire the six gates to a PR-blocking surface. Document baseline-update process in `architect/decisions/`. Resolve the "or non-GitHub CI also runs" ambiguity in `AGENTS.md` §"Operational notes."

### Phase 2: P1 High Value (multi-day, maintainer-owned)

**Goals:**

- Close out W1.5 and cut `2.0.0-pre.1`.
- Graduate the methodology to a public, citation-stable v1.0 package.

**Tasks:**

3. **Spec 017 — W1.5 close-out + `MIGRATION.md` graduation** (multi-day). Audit `REMAINING-WORK.md`; categorize each item must-land / defer / drop; extract `§W1.5.7` symbol-relocation table into `MIGRATION.md` with copy-pasteable before/after import examples; cut `2.0.0-pre.1` via `pnpm changeset version` with the `fixed` group intact; verify no new cycles post-cut.
4. **Spec 019 — Promote `@libar-dev/architect-spec` to v1.0** (~1-2 days, post-017). Set `private: false`; decide independent release cadence vs. `fixed` group; write `formal-spec/README.md` for methodology readers; finalize `docs/METHODOLOGY.md`; publish under the workflow from spec 020.

### Phase 3: P2/P3 Enhancements (opportunistic)

**Goals:**

- Workspace hygiene; finish in-flight refactors; clean fill-in debt.

**Tasks:**

5. **Tech-debt #4 — finish `@architect-usecase` retirement docs sweep** (~30 min, opportunistic).
6. **Tech-debt #11 — decide on stripped `architect.config.ts` keys.** Either document `codecOptions` / `referenceDocConfigs` in the schema or remove them and their string-concat strip (~30 min).
7. **Tech-debt #9 — `1abd4b1 WIP` hygiene** (no action required; flag for next branch retro).
8. **Workspace scaffolding** — decide whether to commit `.stackshift-state.json`, `analysis-report.md`, `.specify/`, `docs/reverse-engineering/`, `docs/gap-analysis-report.md` on the way to `1.0`, or `.gitignore` them.
9. **Deprioritize: Tech-debt #10 — two Gherkin parsers.** Accept; structurally documented in `AGENTS.md`.

---

## Clarifications Needed (5 total)

### Critical (P0) — 1 item

1. **Spec 020 — CI surface scope.** `AGENTS.md` §"Operational notes" hints "either CI runs on a non-GitHub system, or has not been re-introduced post-split." Resolve before authoring `ci.yml`: is there a non-GitHub CI today that the workflow file needs to align with or replace?

### Important (P1) — 3 items

2. **Spec 017 — `REMAINING-WORK.md` triage.** Which W1.5 backlog items are must-land-pre-1.0, which defer-with-issue, which drop-from-scope? Maintainer call; not derivable from the worktree.
3. **Spec 019 — Formal-spec release cadence.** Extract `@libar-dev/architect-spec` from the `fixed` changesets group (independent cadence) or keep it bundled (every `core` patch bumps the spec)? Tradeoff: pin-stability for citations vs. ship-discipline burden.
4. **Spec coexistence — `.specify/specs/` vs `architect/specs/`.** RECONCILIATION_REPORT.md flags two parallel spec systems. Decide: maintain both in lockstep (`/speckit.*` workflow alongside `architect-*` skills), or delete `.specify/specs/` and rely on `architect/specs/` exclusively. If keeping both, codify which is the source of truth for status checkboxes (recommendation: `architect/specs/` + executable Gherkin per constitution §II Principle 2).

### Nice-to-Have (P2) — 1 item

5. **Spec 021 — Bundling decision for the `DDD_ES_CQRS_ROLES` BC-alias delete.** Ship inside spec 021's Phase A bundle, or batch into spec 017's `2.0.0-pre.1` breaking-changes cut? The 3-line delete is a breaking change for any external consumer importing the alias; safer to bundle with other breaks.

---

## Recommendations

1. **Resolve clarification #1 first** — without knowing whether a non-GitHub CI exists, spec 020 is at risk of duplicating or contradicting an existing surface.
2. **Ship Phase 1 in two PRs**: (a) spec 021 + 006 combined (~1-2h), then (b) spec 020 (~4-8h). Both can land within a single working day if the CI scope is clear.
3. **Treat spec 017 as the release-engineering meta-spec** — it gates 019, and its outputs (`MIGRATION.md`, `2.0.0-pre.1` cut) are the primary external signal that the W1.5 lift is "done."
4. **Decide the spec-coexistence policy explicitly** (clarification #4) before drift sets in between `.specify/specs/` and `architect/specs/`. Recommended: `architect/specs/` is the source of truth; `.specify/` is a projection regenerated from it, or deleted entirely.
5. **Re-run gap analysis after Phase 1 lands** — `/speckit.analyze` will give cross-spec inconsistency reports once the prerequisite scripts complete and the AST analysis tool's `dist/` is built.
6. **Keep updating specs in lockstep with code** — the no-suppressions doctrine ("deletes don't defers") means the only debt this repo accumulates is doctrinal drift; the cure is to write the doc patch in the same PR as the code change.

---

## Next Steps

1. **(Skill chain)** Run `stackshift:complete-spec` (Step 5) to resolve the 5 clarifications interactively, starting with #1 (CI surface scope).
2. **(Begin implementation)** After clarification #1 is resolved, open the Phase 1 PRs in order: (021 + 006) → (020).
3. **(Per-feature execution)** Use `/speckit.tasks 021-doctrine-doc-drift-fixes` (and similar) to generate task lists; `/speckit.implement <feature>` to drive each task to completion.
4. **(Status hygiene)** Flip the `[ ]` boxes in each spec.md to `[x]` as acceptance criteria are met. Update `.specify/RECONCILIATION_REPORT.md`'s status table on the way to `1.0`.
5. **(Re-validate)** After Phase 1, re-run `stackshift:gap-analysis` (this skill) or `/speckit.analyze` to verify Phase 1 closure and re-prioritize Phase 2.

---

## Appendix: Spec-by-Spec Status (from RECONCILIATION_REPORT)

| #   | Spec                                            | Status     | Roadmap Phase | Effort       |
| --- | ----------------------------------------------- | ---------- | ------------- | ------------ |
| 001 | Pattern graph construction                      | ✅ COMPLETE | —             | —            |
| 002 | Trust-boundary validation                       | ✅ COMPLETE | —             | —            |
| 003 | Pattern-graph read API                          | ✅ COMPLETE | —             | —            |
| 004 | Fragment projection pipeline                    | ✅ COMPLETE | —             | —            |
| 005 | CLI surface (24 subcommands, 7 bins)            | ✅ COMPLETE | —             | —            |
| 006 | MCP server (21 tools)                           | ⚠️ PARTIAL | Phase 1 P0    | ~30 min      |
| 007 | FSM lifecycle enforcement                       | ✅ COMPLETE | —             | —            |
| 008 | Completed-pattern protection                    | ✅ COMPLETE | —             | —            |
| 009 | Scope-creep detection                           | ✅ COMPLETE | —             | —            |
| 010 | Scope-readiness validation                      | ✅ COMPLETE | —             | —            |
| 011 | Session handoff                                 | ✅ COMPLETE | —             | —            |
| 012 | Doc generation pipeline (8 generators)          | ✅ COMPLETE | —             | —            |
| 013 | Pre-commit guard                                | ✅ COMPLETE | —             | —            |
| 014 | No-suppression enforcement (No-BC doctrine)     | ✅ COMPLETE | —             | —            |
| 015 | Dangling-reference tracking (`arch dangling`)   | ✅ COMPLETE | —             | —            |
| 016 | Tolerant spec ingestion                         | ✅ COMPLETE | —             | —            |
| 017 | Coordinated package versioning (W1.5 close-out) | ⚠️ PARTIAL | Phase 2 P1    | multi-day    |
| 018 | Agent skills system                             | ✅ COMPLETE | —             | —            |
| 019 | Formal-spec package graduation                  | ⚠️ PARTIAL | Phase 2 P1    | ~1-2 days    |
| 020 | CI workflows + perf gate                        | ❌ MISSING  | Phase 1 P0    | ~4-8 hours   |
| 021 | Doctrine + doc drift fixes (Phase A bundle)     | ⚠️ PARTIAL | Phase 1 P0    | ~1-2 hours   |
