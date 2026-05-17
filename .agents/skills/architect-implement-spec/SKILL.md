---
name: architect-implement-spec
description: MANDATORY when the user is implementing an Architect pattern from its design-level spec — triggers on: "implement" + pattern name, mentions of architect/specs/<pattern>.feature or architect/specs/, scope-validate implement PASS, FSM transition to active, transferring value from stubs to JSDoc annotations and executable Gherkin, or deleting the ephemeral design spec. Also triggers on: building deliverables in listed order, @architect-pattern/@architect-implements annotations, transferring invariants to tests/features/. Do NOT use for: idea/candidate-tier sources where scope-validate is BLOCKED — route to architect-review-spec to surface the blocker first. Also do NOT use for generic code implementation without a spec, refactoring already-shipped code (annotate the existing executable feature instead), bugfixes, one-off prototypes, or idea/candidate-tier specs (route to architect-plan-session for promotion through plan and design tiers first). Invoke BEFORE writing any production code for an Architect pattern; the spec IS the implementation prompt, do not create wrapper documents.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Architect Implementation Session

The design-level `.feature` is your implementation prompt. The stubs encode
shape decisions. Together they specify exactly what to build. This session
ends with the spec's value living in production code and executable specs;
deletion of the design spec is a separate decision (see "Deletion" below).

## Value Transfer (concept)

Design-level specs and stubs are **ephemeral scaffolding**. The
durable artifacts after this session are: (a) executable Gherkin in
`tests/features/**/*.feature` carrying `@architect-implements:<Pattern>`
and the rule content, and (b) — additively — JSDoc `@architect-*`
annotations on production code. The executable feature is the
**canonical pattern definition** per the split-ownership policy;
production-TS annotations enrich discoverability but do not gate
completion. Full doctrine, transfer checklist, and pre-deletion gate:
[`../_shared/value-transfer.md`](../_shared/value-transfer.md).

Related references this skill assumes:

- [`../_shared/annotation-ownership.md`](../_shared/annotation-ownership.md)
  — split-ownership: code stubs MUST NOT use `@<prefix>-pattern`;
  production-TS annotations are additive.
- [`../_shared/spec-pattern-relationships.md`](../_shared/spec-pattern-relationships.md)
  — bipartite production↔test pattern naming
  (`<Pattern>Testing` / `<Pattern>ExecutableTests`); forward/reverse
  link pair.
- [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md) —
  valid FSM transitions and `@architect-unlock-reason:` requirements.

## Pre-flight (mandatory CLI bootstrap)

Run the canonical implement pre-flight from
[`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md) §"Implement"
— it covers `overview`, the `scope-validate` gate, the implement-mode
`bundle`, `files`, `rules --only-invariants`, and the `query isValidTransition`
FSM gate.

If `scope-validate <pattern> implement` is not PASS, stop. Either the design
is incomplete (route to `architect-design-session`) or a dependency is blocked
(route to `architect-review-spec` to find the blocker).

## Implementation order (strict)

1. **Transition FSM to active** before any code change:
   ```bash
   pnpm architect:query query isValidTransition <currentState> active
   ```
   The verb returns a deterministic verdict — proceed only if it confirms
   the transition is valid. See
   [`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md)
   §"Deterministic gates" for the JSON shape. Then bump `@architect-status`
   from `roadmap` to `active` in the spec via your normal edit flow. See
   [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md) for
   the full Process-Guard transition table and the
   `@architect-unlock-reason:` rules for unusual transitions.
2. **Read all deliverable target files** listed in the spec's Background table.
3. **Read the stubs** — they encode design decisions (DD-N) and "When to Use" guidance.
4. **Implement deliverables in the order listed**, guided by Rules + Scenarios.
5. **After each deliverable:** run the closest targeted typecheck / test
   slice for the files you just touched, then run `pnpm typecheck`
   before the next phase boundary. Before any commit or handoff, run
   `pnpm typecheck && pnpm test && pnpm validate:all`. Do not batch
   verification to the end.
6. **Author / refine executable Gherkin** under `tests/features/` as you go —
   transferring the design Scenarios with `**Invariant:** / **Rationale:** /
**Verified by:**` blocks intact. To enumerate just the invariants that need
   to land, use `pnpm architect:query rules --pattern <pattern> --only-invariants`.
7. **Add `@architect-*` JSDoc annotations** to every production file you create
   or modify — at minimum `@architect-implements:<Pattern>` (the realization
   edge). Production code MUST NOT carry `@architect-pattern` — pattern
   identity belongs to the feature file per
   [`../_shared/annotation-ownership.md`](../_shared/annotation-ownership.md).
   Add `@architect-uses` / `@architect-usecase` / `@architect-decision` /
   `@architect-role` / `@architect-bounded-context` as additive enrichment
   where they help discoverability. Reverse edges derive from the declared
   `@architect-uses` targets, they are not authored directly.
8. **When ALL deliverables complete:** transition the spec to `completed`,
   regenerate docs, then perform the value-transfer-and-delete step (next).

## Value transfer (verify before deletion)

Walk the **Pre-deletion gate** in
[`../_shared/value-transfer.md`](../_shared/value-transfer.md) before
proposing deletion. The gate has five criteria (forward link present,
forward link resolves, reverse link present, rich content has landed,
architecturally significant rationale lives in JSDoc where Gherkin
can't carry it). When the `pnpm architect:query value-transfer <pattern>` verb
ships (per
`architect/specs/value-transfer-state.feature`), it
returns the same gate's verdict as a deterministic
`deletionReady: boolean` — until then, walk the criteria manually.

The transfer checklist (rule → executable Gherkin Rule block, stub
"When to Use" → JSDoc, etc.) lives in
[`../_shared/value-transfer.md`](../_shared/value-transfer.md)
§"Transfer checklist". Every line of the design spec that won't
transfer is dead weight — either it transfers, or recognize it was
never worth writing.

## Deletion (ask the user first)

Two valid outcomes. **Default: ask the user** which one applies.

- **Delete now** — appropriate when this session reviewed the value
  transfer thoroughly and the pattern is the only one being reviewed.
- **Defer to code review** (more common) — appropriate when several
  related implementations are being reviewed together. The reviewer
  uses `architect-review-implementation` to verify value transfer
  across the related set and batches the spec deletions in a single
  PR or review pass.

Phrase the prompt to the user something like: "Value transfer is
verified for `<Pattern>`. Delete the design spec now, or defer to code
review where related implementations are batched (the more common
path)?"

If the user authorizes deletion now:

```bash
git rm architect/specs/<pattern>.feature         # delete the design spec
git rm -r architect/stubs/<pattern>/             # if stubs directory exists
pnpm architect:query overview                    # confirm pattern shows completed
pnpm docs:all                                    # regenerate docs
```

If the user defers to code review:

- Leave the design spec and stubs in place.
- In your handoff note, name `architect-review-implementation` as the
  recommended next skill for the reviewer.

If you cannot transfer value because something still depends on it,
that's a **zombie spec** smell — investigate. Either the dependency
is wrong, or the spec is doing something durable it shouldn't be
doing.

## Anti-patterns (stop and redirect)

- **Wrapper documents.** Do not create a "context" or "session-prep" markdown
  alongside the spec. The spec is the prompt.
- **Retroactive specs at any tier.** If you discover code that already
  implements the pattern, do not author a fresh idea, candidate, plan, or
  design-level spec for it. Every tier of the four-tier ladder describes
  _planned_ work — conjuring an ephemeral spec back to "cover" shipped
  behavior inverts the pipeline and leaves a zombie behind. Tag an existing
  executable feature with `@architect-implements:<Pattern>` and enrich its
  rich content (`**Invariant:**` / `**Rationale:**` / `**Verified by:**` on
  rules) instead. Refactoring carve-out: when capturing behavior of code that
  already exists, skip directly to design or executable level — never via
  idea, candidate, or plan tier. See `formal-spec/08-spec-evolution.md`
  § "Anti-Patterns" ("Exception: Refactoring specs").
- **Zombie design specs.** Leaving the design spec in `architect/specs/` after
  implementation is a lie at worst, noise at best.
- **Half-transferred value.** Transferring rules to executable specs but not to
  annotations (or vice versa) leaves the architectural picture incomplete.

## Big-gap escape hatch

If during implementation you discover the design has a major gap that requires
new architectural decisions (not just clarifications), **stop**. Do not paper
over it. Report the gap to the user and recommend re-entering
`architect-design-session` or `architect-review-spec`. Shipping an
under-specified design as code is worse than reopening the design conversation.

## Do not

- Do not skip the FSM transition to `active` before coding.
- Do not delay annotations to a follow-up PR — they are part of the implementation.
- Do not declare done without value transfer + spec/stub deletion.
- Do not introduce backward-compatibility shims (no `@deprecated`, no
  `// eslint-disable`, no `@ts-expect-error`, no re-export aliases). The
  No-BC guard will fail CI.
