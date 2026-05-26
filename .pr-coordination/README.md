# PR Coordination — Re-enable Architect Core Functionality

Committed coordination package for the PR on `campaign/docs-and-skills-consolidation`.
Self-contained: does **not** rely on `.scratch/` (maintainer tmp, gitignored + `.claudeignore`'d).

**Context:** ~30 refactoring PRs stripped production `@architect-*` annotations — the
PatternGraph kept pattern identities but lost edges/shapes/invariants (~40% orphans), so the
Data API couldn't be used for context-gathering. This PR re-enables core functionality
(annotations + skills + docs together).

**Current state:** WS-0, WS-1, WS-2 are **DONE**; **WS-3 (docs)** is the open workstream — the
generated-doc projection roadmap (R1–R7) in `DOCS-IA-FINDINGS.md §6`.

## Fresh session — read this, in order

1. **`PREAMBLE.md`** — load the mandatory skills (`architect-base`, `architect-data-api`,
   `architect-sessions`); commit to API-first.
2. **`DECISIONS.md`** — the "Key durable decisions" digest = the standing rules all work must respect.
3. **`DOCS-IA-FINDINGS.md` §6** — the WS-3 remaining roadmap (R1–R7), prioritized. R2 (validation-rules escaping) is the cheapest unblock.
4. **`state.json` → `ws3.followUps`** — the open WS-3 + cross-package threads.
5. **`EXECUTION-PLAN.md` §6** — the gate sequence to run before any commit.

## Files

| File                               | Purpose                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PREAMBLE.md`                      | **Read first every session** — mandatory skills + API-first discipline                                                   |
| `DECISIONS.md`                     | Standing-rules digest (all decisions resolved); resolved bodies in `archive/`                                            |
| `DOCS-IA-FINDINGS.md`              | WS-3 docs-IA audit + projection roadmap (R1–R7) — the active hand-off                                                    |
| `EXECUTION-PLAN.md`                | Why/diagnosis, workstream status, **§6 gates**, method guardrails                                                        |
| `SESSION-REPORTS-AND-LEARNINGS.md` | Append-only log for the active workstream (WS-3)                                                                         |
| `HUD-IDEATION.md`                  | Progressive-disclosure read-surface ideation (steps 3–4 remain)                                                          |
| `state.json`                       | Phase tracking + metrics                                                                                                 |
| `archive/`                         | Completed-work history (WS-0/1/2 session log, resolved decisions, WS-1 strategy, session prompts) — not on the read-path |

## How to run a session

1. Read `PREAMBLE.md` (load skills; commit to API-first), then the read-path above.
2. Execute the scoped WS-3 work; capture any judgment call in `DECISIONS.md` before the code.
3. Run the full gate sequence (`EXECUTION-PLAN.md §6`) before committing — never `--no-verify`.
4. Append a tight entry to `SESSION-REPORTS-AND-LEARNINGS.md`; bump `state.json`.

> At PR/campaign close, the doctrine's full archive (gitignored sibling
> `.pr-coordination-archive-<date>/`) replaces this interim `archive/` subfolder —
> see `architect-refactor-session/references/multi-session-coordination.md`.
