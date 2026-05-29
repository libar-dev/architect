# PR Coordination — Re-enable Architect Core Functionality

Committed coordination package for the PR on `campaign/docs-and-skills-consolidation`.
Self-contained: does **not** rely on `.scratch/` (maintainer tmp, gitignored + `.claudeignore`'d).

**Context:** ~30 refactoring PRs stripped production `@architect-*` annotations — the
PatternGraph kept pattern identities but lost edges/shapes/invariants (~40% orphans), so the
Data API couldn't be used for context-gathering. This PR re-enables core functionality
(annotations + skills + docs together).

**Current state:** WS-0/1/2 **DONE**. **WS-3 (universal doc generation) is an in-progress capability, not
done** — the goal is to replace the entire manual `docs/` corpus with universal generators, and ADR-010
(composable-helper composition) + the `api-reference` shape tier are only **step 1**. Its hard-won
foundation lives here and stays live: `DOCS-IA-FINDINGS.md` (the information-architecture base — source map,
overlap matrix, generator ledger, target-state corpus, roadmap), `HUD-IDEATION.md` (the read-surface
disclosure model), and `EXECUTION-PLAN.md` (the WS-3 plan + gates). The PatternGraph carriers below are the
spec-graph **entry points** into that work, not a replacement for the base. Campaign-resolved residue (the
WS-5/6/7 handoffs) is archived; the standing-rules digest is consolidated. See `CONSOLIDATION-2026-05-27.md`.

## Fresh session — read this, in order

1. **`PREAMBLE.md`** — load the mandatory skills (`architect-base`, `architect-data-api`,
   `architect-sessions`); commit to API-first.
2. **`DECISIONS.md`** — the "Key durable decisions" digest = the standing rules all work must respect.
3. **`DOCS-IA-FINDINGS.md`** — the IA base + target-state corpus + roadmap (R1, R3–R7; R2 escaping shipped)
   driving the manual-docs → universal-generator replacement.
4. **`EXECUTION-PLAN.md` §6** — the gate sequence to run before any commit.

Spec-graph entry points for the doc-gen capability: the `DocumentationProjection` epic (carries the guiding
principle + MVP discipline + corpus scope), `TaxonomyDocumentationCluster` (the MVP first proof-point — one
source, many audience shapes), `ApiReferenceShapeCoverage` (the `@architect-shape` pass),
`ArchitectBriefDeterministicBundle` (`Q-TOKEN-BUDGET-SIGNAL`, from `HUD-IDEATION.md`), and
`DecisionRecordTemporalHygiene`.

## Files

| File                               | Purpose                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PREAMBLE.md`                      | **Read first every session** — mandatory skills + API-first discipline                                                 |
| `DECISIONS.md`                     | Standing-rules digest (all decisions resolved); resolved bodies in `archive/`                                          |
| `DOCS-IA-FINDINGS.md`              | **The doc-gen capability base** — IA audit, overlap matrix, generator ledger, target-state corpus, roadmap (R1, R3–R7) |
| `HUD-IDEATION.md`                  | Read-surface progressive-disclosure model (steps 1–2 shipped; 3–4 → `ArchitectBriefDeterministicBundle`)               |
| `EXECUTION-PLAN.md`                | Why/diagnosis, workstream status, **§6 gates**, method guardrails                                                      |
| `CONSOLIDATION-2026-05-27.md`      | Disposition of every doc + what is base-vs-archived + pre-deletion checklist                                           |
| `SESSION-REPORTS-AND-LEARNINGS.md` | Append-only session log                                                                                                |
| `state.json`                       | Phase tracking + metrics                                                                                               |
| `archive/`                         | Completed-work history — WS-0/1/2 log, resolved decisions, WS-1 strategy, the WS-5/6/7 handoffs, session prompts       |

## How to run a session

1. Read `PREAMBLE.md` (load skills; commit to API-first), then the read-path above.
2. Execute the scoped doc-gen work; capture any judgment call in `DECISIONS.md` before the code.
3. Run the full gate sequence (`EXECUTION-PLAN.md §6` / architect-base §6) before committing — never `--no-verify`.
4. Append a tight entry to `SESSION-REPORTS-AND-LEARNINGS.md`; bump `state.json`.

> At PR/campaign close, the doctrine's full archive (gitignored sibling
> `.pr-coordination-archive-<date>/`) replaces this interim `archive/` subfolder —
> see `architect-refactor-session/references/multi-session-coordination.md`.
