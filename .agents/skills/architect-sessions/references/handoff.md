# Handoff — end-of-session state capture

The session is wrapping. Capture exactly what the next session needs — forward-looking pattern state, not a backward-looking recap.

Doctrine depth: valid FSM transitions + `@architect-unlock-reason:` + what `scope-validate` outputs mean are in [`../../architect-base/references/fsm-transitions.md`](../../architect-base/references/fsm-transitions.md).

## Pre-flight

Run the handoff pre-flight from [`../../architect-data-api/SKILL.md`](../../architect-data-api/SKILL.md) (`overview`, `context`, `arch blocking`, `open-questions` for forward-looking signal), then the anchor verb that writes the canonical record:

```bash
pnpm architect:query handoff --pattern <pattern> --session <intent> [--modified-file <path>...]
```

Run `handoff` per pattern for multi-pattern sessions.

## What to extract

For each pattern touched:

| Field | Source |
| ----- | ------ |
| Session intent | What you were doing (`planning` / `design` / `implement` / `review`) |
| Pattern name | The primary pattern under work |
| Current FSM state | `pnpm architect:query context <pattern> --session implement` — read the `=== FSM ===` line |
| Transitions made | Your edit history |
| Files modified | Pass to `--modified-file` flags on `handoff` |
| Open dependencies | `pnpm architect:query dep-tree <pattern>` minus the satisfied ones |
| Open blockers | `pnpm architect:query arch blocking` filtered to this pattern |
| Outstanding open questions | `pnpm architect:query open-questions [--parent <pattern>]` |
| Outstanding work | What you didn't finish, one-line "why" each |

## Handoff note format

```
**Architect handoff — <PatternName> (<intent>)**

- State: <current FSM state> (was: <previous>)
- Modified: <files>
- Blockers: <list or "none">
- Outstanding: <list with one-line "why" each>
- Recommended next: <reference or skill to open> for <one-line reason>
```

Five fields, no recap of conversation, no thanks-for-this-session prose. The next session reads this verbatim and starts work.

## Recommended-next table

Set the `Recommended next:` field from where the session ended (all references are in this skill unless noted):

| Session ended at | Spec state | Recommended next |
| ---------------- | ---------- | ---------------- |
| Idea tier | Idea captured, ready to refine | [`plan.md`](plan.md) (promote idea → candidate) |
| Candidate tier | Open questions resolved, acceptance gate cleared | [`plan.md`](plan.md) (promote candidate → plan; flips status to `roadmap`) |
| Plan tier | Plan-level spec ready for design | [`design.md`](design.md) |
| Design tier | `scope-validate <pattern> implement` = PASS | [`implement.md`](implement.md) |
| Design tier | `scope-validate <pattern> implement` = WARN/BLOCKED | [`review-spec.md`](review-spec.md) (find gaps) → [`design.md`](design.md) |
| Implement | Spec deleted, value transferred | (none — pattern complete; optionally start the next pattern's planning) |
| Implement | Value transferred, deletion deferred | [`review-implementation.md`](review-implementation.md) (batched verification + deletion) |
| Review (spec) | Gap list produced | [`design.md`](design.md) to fix, or [`implement.md`](implement.md) if PASS |
| Review (implementation) | Per-pattern verdicts, batched deletion proposed | (none if user authorized deletion; otherwise re-invoke when ready) |
| Refactor (no design spec) | Shipped code evolved in place | [`architect-refactor-session`](../../architect-refactor-session/SKILL.md) |

The full ladder is in [`../../architect-base/references/four-tier-ladder.md`](../../architect-base/references/four-tier-ladder.md).

## Anti-patterns (stop)

- **Free-form recap** ("we talked about X, then I implemented Y…") — cut it; the handoff is forward-looking only.
- **Skipping the `handoff` CLI** — that command writes the canonical record; skip it and the next session has no authoritative source.
- **Recommending the wrong next step** — cross-check the table. Most common miscalls: routing a candidate to design (it needs plan tier first), or routing a BLOCKED design to implement (it needs review-spec first).

## Do not

- Do not declare a session "done" without running `handoff`.
- Do not commit or push without the user's explicit approval.
