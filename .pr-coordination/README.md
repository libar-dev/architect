# PR Coordination — Re-enable Architect Core Functionality

Committed coordination package for the PR on
`campaign/docs-and-skills-consolidation`. Self-contained: does **not** rely on
`.scratch/` (maintainer tmp, gitignored + `.claudeignore`'d).

**Context:** ~30 refactoring PRs stripped production `@architect-*` annotations.
The PatternGraph kept pattern identities but lost edges/shapes/invariants —
40% of patterns are orphans, so the Data API can't be used for context-gathering.
This PR re-enables core functionality (annotations + skills + docs together).

## Start here

| File                               | Purpose                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `PREAMBLE.md`                      | **Read first every session** — mandatory skills + API-first discipline   |
| `EXECUTION-PLAN.md`                | Scope, diagnosis, workstreams, grounded phase-1 worklist, gates, metrics |
| `DECISIONS.md`                     | Locked decisions (D-1..D-7)                                              |
| `sessions/NN-slug.md`              | Paste-ready worker prompts (pilot 01–06 done; next: WS-1 expansion)      |
| `SESSION-REPORTS-AND-LEARNINGS.md` | Append-only per-session log                                              |
| `state.json`                       | Phase + baseline metrics                                                 |

## Workstreams

- **WS-0** Finalize hygiene — DONE (unstaged in tree).
- **WS-1** Annotation re-enablement — projection pilot → expand. Detailed in EXECUTION-PLAN.
- **WS-2** Skills — full updates (detail TBD).
- **WS-3** Docs — updates aligned to the re-enabled graph (detail TBD).

## How to run a session

1. Read `PREAMBLE.md` (load the mandatory skills; commit to API-first), then
   `EXECUTION-PLAN.md` §3–§8 + `DECISIONS.md`.
2. Open the next `sessions/NN-slug.md`, execute exactly that scope.
3. Run the full gate sequence (EXECUTION-PLAN §6) before committing.
4. Append a tight entry to `SESSION-REPORTS-AND-LEARNINGS.md`; bump `state.json`.
