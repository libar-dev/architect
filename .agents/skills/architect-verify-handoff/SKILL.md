---
name: architect-verify-handoff
description: Use at session end to capture canonical Architect state for continuation — runs the handoff CLI command, lists current pattern state, dependencies, blockers, modified files, and outstanding work. Produces a compact handoff note, not a session recap. Do NOT use for: mid-implementation status reports — used at session end, not session middle. Also do NOT use for sprint retros, daily standups, or generic "what did I do today" summaries — handoffs are forward-looking pattern state for the next session, not backward-looking recaps.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Handoff Verification

The session is wrapping. Capture exactly what the next session will need —
nothing more.

## Doctrine references

When the handoff captures FSM state or routes to a downstream skill,
defer to the shared references:

- [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md) —
  canonical valid transitions; `@architect-unlock-reason:` audit-trail
  requirement; what `scope-validate` outputs mean.
- [`../_shared/canonical-references.md`](../_shared/canonical-references.md)
  — anti-anecdote rule for any judgment call about "what the
  methodology says."

## Pre-flight

Run the canonical handoff pre-flight from
[`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md) §"Handoff"
(it covers `overview`, `context`, `arch blocking`, and `open-questions` for
forward-looking signal). Then run the anchor verb of this skill — it writes
the canonical record:

```bash
pnpm architect:query handoff --pattern <pattern> --session <intent> [--modified-file <path>...]
```

For multi-pattern sessions, run `handoff` per pattern.

## What to extract

For each pattern touched:

| Field                         | Source                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Session intent                | What you were doing (`planning` / `design` / `implement` / `review`)                       |
| Pattern name                  | The primary pattern under work                                                             |
| Current FSM state             | `pnpm architect:query context <pattern> --session implement` — read the `=== FSM ===` line |
| Transitions made this session | Your edit history                                                                          |
| Files modified                | Pass to `--modified-file` flags on handoff                                                 |
| Open dependencies             | `pnpm architect:query dep-tree <pattern>` minus the satisfied ones                         |
| Open blockers                 | `pnpm architect:query arch blocking` filtered to anything touching this pattern            |
| Outstanding open questions    | `pnpm architect:query open-questions [--parent <pattern>]` — forward-looking signal        |
| Outstanding work              | What you didn't finish, with one-line "why" each                                           |

## Handoff note format

```
**Architect handoff — <PatternName> (<intent>)**

- State: <current FSM state> (was: <previous>)
- Modified: <files>
- Blockers: <list or "none">
- Outstanding: <list with one-line "why" each>
- Recommended next: <skill name to invoke> for <one-line reason>
```

Five fields, no recap of conversation, no thanks-for-this-session prose.
The next session reads this verbatim and starts work.

## Recommended-next-skill table

The four-tier ladder has four rungs (idea → candidate → plan → design); the
implement and review skills sit alongside. Use this table to set the
`Recommended next:` field in the handoff note:

| Session ended at | Spec state                                                | Recommended next skill                                                             |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Idea tier        | Idea captured, ready to refine                            | `architect-plan-session` (promote idea → candidate)                                |
| Candidate tier   | Open questions resolved, acceptance gate cleared          | `architect-plan-session` (promote candidate → plan; flips status to `roadmap`)     |
| Plan tier        | Plan-level spec ready for design tier                     | `architect-design-session` (promote plan → design)                                 |
| Design tier      | `scope-validate <pattern> implement` returns PASS         | `architect-implement-spec`                                                         |
| Design tier      | `scope-validate <pattern> implement` returns WARN/BLOCKED | `architect-review-spec` (find gaps) then back to `architect-design-session`        |
| Implement        | Spec deleted, value transferred                           | (none — pattern complete, optionally start next pattern's planning)                |
| Implement        | Value transferred, spec deletion deferred to code review  | `architect-review-implementation` (batched value-transfer verification + deletion) |
| Review           | Gap list produced                                         | `architect-design-session` to fix gaps, OR `architect-implement-spec` if PASS      |
| Review-implement | Per-pattern verdicts produced, batched deletion proposed  | (none if user authorized deletion this session; otherwise re-invoke when ready)    |

The full ladder lives at [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md).

## Anti-patterns (stop)

- **Free-form recap.** "We talked about X, then I implemented Y, and the user
  said Z." Cut it. The handoff is forward-looking only.
- **Skipping `handoff` CLI.** That command writes the canonical record. If you
  skip it, the next session has no authoritative source.
- **Recommending the wrong next skill.** Cross-check the recommended-next
  skill against the table above. The most common miscalls: routing a candidate
  spec to design-session (it needs plan tier first), or routing a BLOCKED
  design back to implement (it needs review-spec first to surface the
  blocker).

## Do not

- Do not declare a session "done" without running `handoff`.
- Do not commit or push without the user's explicit approval (governed by the
  Claude Code permission system, not this skill, but worth restating).
