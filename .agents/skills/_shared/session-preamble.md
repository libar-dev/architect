# Universal Session Preamble (canonical reference)

Six load-bearing rules that apply to every Architect session type
(`-plan`, `-design`, `-implement`, `-review`, `-handoff`, the
`review-implementation` skill, and any campaign-flow skill). They are
not refactor-specific.

This file is the canonical full text. The full convention for
multi-session campaigns lives in
[`./multi-session-coordination.md`](./multi-session-coordination.md).

## The six rules

1. **Data API first, file-based search second.** Every pattern-related
   question goes through `mcp__architect__*` MCP tools or
   `pnpm architect:query` (see
   [`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md) for the
   verb-by-verb reference) before any `Read` / `Glob` / `Grep`. This is
   a discipline, not an enforced gate — the Data API is faster
   (sub-ms for MCP, 2–5s for CLI) and more accurate than file scanning.

2. **Gates are non-negotiable.** The session's `Gates` block is a
   complete list, every command runs, a failing gate is
   stop-and-surface. No silencing, no mocking, no `--no-verify`.
   Validation cadence: run `pnpm typecheck` between phases and
   `pnpm typecheck && pnpm test && pnpm validate:all` before any
   commit or handoff. Include **all** runtime package test suites
   — `pnpm test` filters every `packages/*`, so partial gate coverage
   that omits any package allows pre-existing failures to spill into
   a later session.

3. **Commit hygiene.** `chore(scope): imperative summary`; commit body
   references issue ids when relevant
   (`Closes P0-1, P0-2 from <plan-package>/CONFIRMED-ISSUES.md`);
   never `git add -A` on a multi-commit refactor branch (sweeps WIP
   into commits).

4. **Decisions captured before code.** Items needing human judgment go
   to `DECISIONS.md` with question / options / recommendation /
   consumed-by-session. Without this separation, agents fabricate
   answers under pressure.

5. **Incomplete scope is next-session input, not silent debt — do
   not follow the prompt blindly.** When investigation surfaces
   drift mid-session, stop and classify: _same-root-cause_ (apply
   inline + record) vs _different-root-cause_ (defer + record in
   `DECISIONS.md` or the learnings log). Never land a surface-only
   commit that leaves gates red. Full classification heuristic and
   the entry templates live in
   [`./multi-session-coordination.md`](./multi-session-coordination.md);
   this is the single most-reused heuristic across multi-session
   work.

6. **Per-session learnings propagate forward.** After each session
   the coordinator appends one tight entry to the learnings log and
   rewrites the _unstarted_ session prompts' "Scope discipline"
   sections with newly-discovered rules. Preambles are calibrated
   against real surprises from prior sessions, not boilerplate.

## When this file is loaded

Skills loading this preamble explicitly pin the rule set so a session
prompt does not drift from the kernel between commits. This file
covers any session that is part of (or could become part of) a
campaign.

## Sibling references

- [`./multi-session-coordination.md`](./multi-session-coordination.md)
  — full coordination convention (folder layout, coordinator + worker
  split, DECISIONS / learnings templates, scope-discovery rule). The
  six rules above are the floor; that file builds the campaign-level
  discipline on top.
- [`./canonical-references.md`](./canonical-references.md) — kernel
  self-containment + anti-anecdote rule.
- [`./four-tier-ladder.md`](./four-tier-ladder.md) — tier table
  referenced by Rule 5 (incomplete scope often surfaces a missing
  rung).
- [`./fsm-transitions.md`](./fsm-transitions.md) — referenced by
  any session that touches `@architect-status` (covered by Rules 1
  and 2: read state via Data API, never bypass guard).
