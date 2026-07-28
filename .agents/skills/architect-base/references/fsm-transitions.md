# FSM Transitions (canonical reference)

Reference for the Architect PatternGraph's status transitions
and the `@architect-unlock-reason:` audit-trail requirement. The
`architect-sessions` implement and handoff references rely on this
table, and the `architect_scope_validate` verdicts and
`g.api.isValidTransition` answers on the read surface
(`architect-graph-handle`, ADR-014) resolve against it.

The kernel splits "transitions" into two categories that are easy to
conflate:

1. **Process-Guard FSM transitions** — validated by `architect-guard` at
   commit time. These are the four-row table below.
2. **Maturity-driven status flips** — driven by spec-authoring sessions
   (the four-tier ladder), governed by the acceptance gate, not by
   Process Guard.

Putting both in the same table makes it look like Process Guard
authorizes all of them. It does not. Keep them separate.

## Process-Guard FSM transitions (validated)

```
roadmap   ──► active                       (implement session starts)
roadmap   ──► deferred                     (work parked)
active    ──► completed                    (implementation done, value transferred)
active    ──► roadmap                      (implementation rolled back)
deferred  ──► roadmap                      (work resumed)
completed ──► active                       (advisory reopen)
completed ──► roadmap                      (advisory reopen)
```

Notes:

- `completed` is no longer terminal. Reopening to `active` or `roadmap`
  is a valid, advisory transition.
- Skipping rungs (e.g., `roadmap` → `completed` directly) is rejected
  unless the unlock-reason mechanism authorizes it. Use the
  `architect_scope_validate` MCP tool as the pre-flight
  check that catches bad transitions before they fire.
- Verify a candidate transition programmatically with
  `pnpm architect:q 'g.api.isValidTransition("<currentState>","<targetState>")'`
  — the check returns a deterministic answer.

## Maturity-driven status flips (acceptance-gate, not FSM)

```
candidate ──► roadmap                      (acceptance gate cleared during planning)
```

This flip is performed by the spec author at the moment the
`@architect-status` tag is bumped from `candidate` to `roadmap` —
typically during plan-tier authoring (the `architect-sessions` plan
reference) when promoting a candidate to the plan tier. It is NOT
validated by Process Guard's transition rules
(Process Guard's table starts at `roadmap`). The acceptance gate is
human judgment plus the four-tier-ladder shape requirements; see
[`./four-tier-ladder.md`](./four-tier-ladder.md) § "Valid promotion paths".

Treating `candidate → roadmap` as a Process-Guard transition is a
common mistake — surface the distinction when reviewing FSM-related
spec edits.

## `@architect-unlock-reason:` requirements

`architect-guard` treats `@architect-unlock-reason:<short reason>` as an
advisory-warning suppressor for completed reopen/edit and as a required
marker for genuinely unusual transitions:

- Reopening or editing a `completed` pattern when you want the commit
  path to stay silent instead of warning.
- Any transition the standard FSM table above does not include.
- Re-completing a pattern that was reopened (the original
  unlock-reason should remain alongside a new one).

Authoring rules (verified against the guard's runtime checks):

- Minimum length: **10 characters**. Short reasons like `fix` are rejected.
- Cannot be a placeholder: `test`, `xxx`, `bypass`, `temp`, `todo`,
  `fixme`. Placeholder values are treated as no unlock reason at all.
- The reason is human-readable, free-text, and shows up in audit
  reads over the read surface (e.g.
  `pnpm architect:q 'g.api.getPattern("<Pattern>")'` — the full
  canonical record).

## Pre-flight: use scope-validate

Before transitioning a pattern, run the pre-flight via the
`architect_scope_validate` MCP tool (pattern + `design`|`implement`
session), and verify the FSM leg deterministically:

```bash
pnpm architect:q 'g.api.isValidTransition("<from>","<to>")'
```

The session parameter selects the readiness target. The check
returns PASS / WARN / BLOCKED with explicit reasons, including any FSM
transition the requested session would require.

If `architect_scope_validate` returns BLOCKED with "FSM allows
transition: X → Y is not valid", the Process-Guard transition table
above is the source of truth — promote through the missing rungs first.

## Provenance (informational, verified at commit time)

This file is **self-contained** — the FSM transition table, unlock-reason
rules (10-char minimum, placeholder rejection), and the
`isValidTransition` check are all canonical here. Verify the check
live with `pnpm architect:q 'g.api.isValidTransition("roadmap","active")'`;
verify the FSM behavior live with the `architect_scope_validate` MCP
tool. No external doc dependency.

See [`../SKILL.md`](../SKILL.md) §"Anti-anecdote" — when a sampled
finding contradicts this table, the live graph
(`g.api.isValidTransition`) wins, not the sample.
