# Spec Reconciliation Report — Gear 3 of 6

**Date**: 2026-05-17
**Repository**: `@libar-dev/architect-*` monorepo (commit `b875ff1`)
**Route**: brownfield
**Implementation framework**: GitHub Spec Kit
**Thoroughness**: specs + plans (`spec_thoroughness: "specs_plus_plans"`)
**Reverse-engineering source**: 10 files / ~210 KB under `docs/reverse-engineering/`

---

## Before Reconciliation

- **Specs existed**: 0 under `.specify/` (none in Spec Kit format).
- **Coverage**: 0% via Spec Kit. The repo already maintained a sophisticated parallel spec system at `architect/specs/` (Gherkin features) + `formal-spec/` + ADRs, but no `.specify/` tree.
- **Why this is unusual**: most StackShift'd repos have ad-hoc specs and many gaps. This repo's gaps are _meta_ — CI infrastructure, doctrine doc drift, and W1.5 migration completion. The platform itself is mature.

---

## After Reconciliation

- **Total specs created**: **21** (`001-021`).
- **Coverage**: 100% of FR-001..FR-018 plus three cross-cutting features (agent skills, formal-spec package, doctrine drift) plus the CI/perf gate gap.
- **Plans created**: **5** (one per incomplete feature).
- **Constitution**: `.specify/memory/constitution.md` (252 lines), synthesized from `AGENTS.md` doctrine + ADR-003/005/006/007/009 + PDR-001.

### Status breakdown

| Bucket          | Count | Spec IDs                                      | Plan? |
| --------------- | ----: | --------------------------------------------- | ----- |
| ✅ **COMPLETE** |    15 | 001-005, 007-016, 018                         | No    |
| ⚠️ **PARTIAL**  |     4 | 006, 017, 019, 021                            | Yes   |
| ❌ **MISSING**  |     1 | 020                                           | Yes   |
| **Plans only**  |     — | (overlap with above: 006, 017, 019, 020, 021) | 5     |
| **Total**       |    21 |                                               | 5     |

### Spec inventory

| #   | Spec                                              | Status      | Source                                                             |
| --- | ------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| 001 | Pattern graph construction                        | ✅ COMPLETE | FR-001                                                             |
| 002 | Trust-boundary validation                         | ✅ COMPLETE | FR-002, ADR-009                                                    |
| 003 | Pattern-graph read API                            | ✅ COMPLETE | FR-003, ADR-006                                                    |
| 004 | Fragment projection pipeline                      | ✅ COMPLETE | FR-004, ADR-005, NFR-004                                           |
| 005 | CLI surface (24 subcommands, 7 bins)              | ✅ COMPLETE | FR-005                                                             |
| 006 | MCP server (21 tools, `--watch`)                  | ⚠️ PARTIAL  | FR-006, FR-017 — tool-count doc drift (TD #2, #12)                 |
| 007 | FSM lifecycle enforcement                         | ✅ COMPLETE | FR-007                                                             |
| 008 | Completed-pattern protection                      | ✅ COMPLETE | FR-008                                                             |
| 009 | Scope-creep detection                             | ✅ COMPLETE | FR-009                                                             |
| 010 | Scope-readiness validation                        | ✅ COMPLETE | FR-010, PDR-001 DD-4                                               |
| 011 | Session handoff                                   | ✅ COMPLETE | FR-011                                                             |
| 012 | Doc generation pipeline (8 generators)            | ✅ COMPLETE | FR-012                                                             |
| 013 | Pre-commit guard                                  | ✅ COMPLETE | FR-013                                                             |
| 014 | No-suppression enforcement (No-BC doctrine)       | ✅ COMPLETE | FR-014                                                             |
| 015 | Dangling-reference tracking (`arch dangling`)     | ✅ COMPLETE | FR-015                                                             |
| 016 | Tolerant spec ingestion                           | ✅ COMPLETE | FR-016                                                             |
| 017 | Coordinated package versioning (W1.5 lift)        | ⚠️ PARTIAL  | FR-018 — W1.5 not fully landed (TD #7); MIGRATION map (TD #8)      |
| 018 | Agent skills system (`.agents/skills/`, kernels)  | ✅ COMPLETE | Agent kernels + 7 sessions                                         |
| 019 | Formal-spec package (`@libar-dev/architect-spec`) | ⚠️ PARTIAL  | v0.2 private → v1.0 graduation pending                             |
| 020 | CI workflows + perf gate                          | ❌ MISSING  | NFR-004 + TD #5 (no `.github/workflows/` committed)                |
| 021 | Doctrine + doc drift cleanup (Phase A bundle)     | ⚠️ PARTIAL  | TD #1, #2, #3, #6, #12 + supplementary No-BC violation (see below) |

### Plans

| #   | Plan                                           | Lines | Notes                                                             |
| --- | ---------------------------------------------- | ----: | ----------------------------------------------------------------- |
| 006 | MCP server doc-drift remediation               |   101 | Overlaps with plan 021; recommended single combined PR            |
| 017 | W1.5 lift completion + MIGRATION.md graduation |   109 | Strategic; effort owned by maintainer                             |
| 019 | Formal-spec graduation to v1.0                 |   123 | Depends on 017 (`2.0.0-pre.1` cut); blocks methodology citability |
| 020 | CI workflows + perf gate commit                |   133 | Phase B; ≈4-8 hours; blocks 017's release cut                     |
| 021 | Phase-A doctrine doc drift bundle              |   131 | ≈1-2 hours; includes supplementary No-BC item (#5 — see below)    |

---

## Findings Surfaced During Spec Generation

### Supplementary No-BC violation (NEW — not in `technical-debt-analysis.md`)

While inspecting `packages/architect-core/src/config/role-constants.ts`, the user flagged lines 65-67:

```ts
export const DEFAULT_ROLES = LOCKED_WAVE_ONE_ROLES;
export const DDD_ES_CQRS_ROLES = LOCKED_WAVE_ONE_ROLES;
```

`grep -rn "DDD_ES_CQRS_ROLES" packages/*/src/` returns **only barrel re-exports** — no internal caller uses it. The active use site (`factory.ts:30`, `registry-builder.ts:146`) imports `DEFAULT_ROLES`. This is exactly the **"Backward-compatibility aliases (re-exporting an old name from a new location)"** pattern forbidden by constitution §III.A and AGENTS.md §No-BC.

**Resolution**: Added as item #5 in spec `021-doctrine-doc-drift-fixes/spec.md`. The remediation is a 3-line delete (the alias + 2 barrel re-exports). May be deferred into spec 017 (`2.0.0-pre.1` cut) if the maintainer prefers to batch breaking changes — flagged in spec 021's acceptance criteria.

---

## Coexistence Strategy: `.specify/` vs. `architect/specs/`

This repo now hosts **two complementary spec systems**:

| System             | Lives at               | Source of truth?                                                | Primary audience                       |
| ------------------ | ---------------------- | --------------------------------------------------------------- | -------------------------------------- |
| Spec Kit specs     | `.specify/specs/`      | High-level features + status; **projection** of source of truth | Spec Kit `/speckit.*` workflow; humans |
| Architect specs    | `architect/specs/`     | Design-tier Gherkin features (tier 4 before promotion to tests) | Architect plan/design/implement skills |
| Executable Gherkin | `tests/features/`      | **Source of truth** for behavior (constitution §II Principle 2) | Test runner; doctrine                  |
| ADRs / PDRs        | `architect/decisions/` | **Source of truth** for architectural decisions                 | All contributors                       |

**The constitution (§II Principle 2) is preserved**: annotated production code + executable Gherkin remains the single source of truth. `.specify/specs/` is a higher-level projection — a "table of contents" for the application — that enables `/speckit.*` workflows alongside the architect-\* session skills. Future changes to executable behavior should still update Gherkin first; the `.specify/specs/` checkboxes can be flipped retroactively or maintained in lockstep.

If the maintainer judges that two parallel spec systems creates more maintenance burden than value, the cheapest unwind is to delete `.specify/specs/` and rely on `architect/specs/` + the architect-\* skills exclusively. The reverse-engineering docs at `docs/reverse-engineering/` remain useful regardless.

---

## Verification Checklist (Step 7)

### All levels

- [x] `.specify/` directory exists
- [x] `.specify/memory/constitution.md` exists (252 lines, non-empty)
- [x] 21 `.specify/specs/NNN-feature-name/` directories
- [x] Each feature has `spec.md` with status marker (✅/⚠️/❌)
- [x] `.specify/scripts/bash/check-prerequisites.sh` exists

### Thoroughness Level 2 (specs + plans)

- [x] Every PARTIAL/MISSING feature has `plan.md` (5/5 = 100%)
- [x] Plans cite tech-debt item numbers and constitution sections

### Spec Kit script installation

- [x] `check-prerequisites.sh` (downloaded)
- [x] `setup-plan.sh` (downloaded)
- [x] `create-new-feature.sh` (downloaded)
- [x] `common.sh` (downloaded)
- [ ] `update-agent-context.sh` (404 from upstream — non-blocking for `/speckit.analyze`)

---

## Next Steps (Gear 4)

Proceed to **Gear 4: Gap Analysis**. Two options:

1. Run `/speckit.analyze` to surface cross-spec inconsistencies (now that `.specify/` is populated and 4/5 prerequisite scripts are present).
2. Apply the `stackshift:gap-analysis` skill to produce a prioritized implementation plan from the 5 plans now in `.specify/specs/*/plan.md`.

**Recommended near-term implementation order** (derived from cross-plan dependencies):

1. **Spec 021 + 006** (≈1-2 hours, single combined PR): Phase-A doctrine doc drift + MCP tool-count fix. Quick wins; closes 5 tech-debt items.
2. **Spec 020** (≈4-8 hours): Commit `.github/workflows/`. Unblocks "CI-enforced doctrine" claim in AGENTS.md and enables the perf-regression gate to actually run on PRs.
3. **Spec 017** (multi-day, maintainer-owned): W1.5 lift completion + graduate `MIGRATION.md`. Cut `2.0.0-pre.1`.
4. **Spec 019** (post-17): Promote `formal-spec/` to public `@libar-dev/architect-spec@1.0`.

Specs 001-005, 007-016, 018 are ✅ COMPLETE — they exist to put the working features under spec control for future evolution.

---

## Files Generated by Gear 3

```
.specify/
├── memory/
│   └── constitution.md                          (252 lines)
├── templates/                                   (empty)
├── scripts/
│   └── bash/                                    (4 scripts, 1 upstream 404)
├── specs/
│   ├── 001-pattern-graph-construction/spec.md   (63 lines)
│   ├── 002-trust-boundary-validation/spec.md    (61 lines)
│   ├── 003-pattern-graph-read-api/spec.md       (62 lines)
│   ├── 004-fragment-projection-pipeline/spec.md (71 lines)
│   ├── 005-cli-surface/spec.md                  (68 lines)
│   ├── 006-mcp-server/{spec.md, plan.md}        (79 + 101)
│   ├── 007-fsm-lifecycle-enforcement/spec.md    (76 lines)
│   ├── 008-completed-pattern-protection/spec.md (69 lines)
│   ├── 009-scope-creep-detection/spec.md        (70 lines)
│   ├── 010-scope-readiness-validation/spec.md   (82 lines)
│   ├── 011-session-handoff/spec.md              (81 lines)
│   ├── 012-doc-generation-pipeline/spec.md      (81 lines)
│   ├── 013-pre-commit-guard/spec.md             (71 lines)
│   ├── 014-no-suppression-enforcement/spec.md   (68 lines)
│   ├── 015-dangling-reference-tracking/spec.md  (67 lines)
│   ├── 016-tolerant-spec-ingestion/spec.md      (75 lines)
│   ├── 017-coordinated-package-versioning/{spec.md, plan.md}  (81 + 109)
│   ├── 018-agent-skills-system/spec.md          (86 lines)
│   ├── 019-formal-spec-package/{spec.md, plan.md}             (84 + 123)
│   ├── 020-ci-perf-gate/{spec.md, plan.md}                    (96 + 133)
│   └── 021-doctrine-doc-drift-fixes/{spec.md, plan.md}        (104 + 131)
└── RECONCILIATION_REPORT.md                     (this file)
```

**Result**: 21 specs + 5 plans + constitution + 4 Spec Kit scripts + this report. The repo is now under Spec Kit "spec control" for the full FR-001..FR-018 surface plus the three meta features (formal spec, agent skills, doctrine drift) plus the missing CI workflow.
