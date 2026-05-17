---
name: architect-review-implementation
description: MANDATORY when reviewing one or more COMPLETED Architect implementations to verify value transfer and decide whether to delete the corresponding design specs — triggers on "review implementation", "review the implementation of X", "verify value transfer", "delete these design specs together", "are these specs safe to delete", or any post-implementation review that names completed patterns. Accepts a comma-separated pattern list (multiple specs reviewed as a set is the common case). Output is a per-pattern verdict + recommended action — not a rewrite. Do NOT use for: reviewing design-level SPECS for gaps before implementation (route to architect-review-spec — that skill reviews specs pre-implementation; this one reviews implementations post-merge). Also do NOT use for generic PR review, security audits, performance audits, or architectural-decision review. Invoke BEFORE any Read/Glob/Grep on architect-scoped paths — the Data API (CLI / MCP) is the canonical source.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Implementation Review Session

The implementations are done. The design specs may or may not still
exist. Your job: verify value has transferred to durable surfaces, and
either confirm batched deletion is safe or surface what's blocking it.

This is the **post-implementation** counterpart to
`architect-review-spec` (which reviews specs **before** implementation).
The two skills do not overlap — pick by lifecycle phase.

## Doctrine references

Read these once if you haven't this session — they are the load-bearing
rules this skill operates under:

- [`../_shared/value-transfer.md`](../_shared/value-transfer.md) —
  pre-deletion gate, transfer checklist, anti-patterns.
- [`../_shared/spec-pattern-relationships.md`](../_shared/spec-pattern-relationships.md)
  — bipartite production↔test pattern graph; forward/reverse link pair;
  `*ExecutableTests` escape hatch.
- [`../_shared/annotation-ownership.md`](../_shared/annotation-ownership.md)
  — split-ownership: production-TS annotations are **additive, not
  mandatory**. Do NOT flag missing JSDoc as a value-transfer blocker.

## Pre-flight

```bash
pnpm architect:query overview
pnpm architect:query arch blocking
```

Then for each pattern in scope (comma-separated list from the user):

```bash
pnpm architect:query context <pattern> --session implement
pnpm architect:query rules --pattern <pattern>
pnpm architect:query dep-tree <pattern>
pnpm architect:query files <pattern> --related
```

When `pnpm architect:query value-transfer <pattern>` ships (per
`architect/specs/value-transfer-state.feature`),
also run that per pattern — it returns the deterministic
`deletionReady` verdict. Until shipped, walk the manual gate from
[`../_shared/value-transfer.md`](../_shared/value-transfer.md)
§"Pre-deletion gate".

## Per-pattern verification (apply the gate)

For each pattern, check:

1. **Forward link.** Does the design spec carry
   `@architect-executable-specs:<path>`? If the spec is already
   deleted, this check is moot.
2. **Forward link resolves.** Does that path point at a real file
   under `tests/features/`?
3. **Reverse link.** Does that target feature carry
   `@architect-implements:<Pattern>` for the focal pattern?
4. **Rich content has landed.** Every Rule block in the design spec
   (or in your memory of it, if already deleted) has a counterpart
   Rule block in the executable feature carrying `**Invariant:**`
   (and, where present in the source, `**Rationale:**` +
   `**Verified by:**`).
5. **Production-TS rationale (judgment).** Architecturally significant
   rationale that doesn't fit naturally in Gherkin lives in JSDoc
   `@architect-*` annotations. **Annotations are additive** — absence
   is not a blocker; presence enriches discoverability.

If `pnpm architect:query value-transfer` is available, that verb returns this
gate's verdict deterministically.

## Output format

Produce one table for the reviewed set, then a recommended action per
pattern:

```
**Implementation review — <PatternA>, <PatternB>, <PatternC>**

| Pattern | Forward link | Reverse link | Rich content | Annotations (additive) | Deletion-ready | Recommended action |
| ------- | ------------ | ------------ | ------------ | ---------------------- | -------------- | ------------------ |
| <PatternA> | ✓ <path>      | ✓             | ✓             | ✓ partial              | YES            | `git rm <designSpecPath>` (batched in this PR) |
| <PatternB> | ✓ <path>      | ✗ missing     | ✓             | n/a                    | NO             | Add `@architect-implements:<PatternB>` to <feature path>, then re-review |
| <PatternC> | (spec already deleted) | ✓ | ✓ | n/a | (already done) | confirm earlier deletion was correct |

**Batched deletion plan:**

- Delete now: <PatternA>, <PatternC> (already done)
- Block on: <PatternB> (reverse link missing)
```

If you found nothing wrong: state that in one sentence. Do not generate
a "looks good" report with elaborate restating.

## Spec-deletion step (only if user authorizes)

If the user explicitly authorizes batched deletion in this session:

```bash
git rm <designSpecPath1> <designSpecPath2> …
git rm -r <stubDir1> <stubDir2> …
pnpm architect:query overview          # confirm patterns now show completed without lingering specs
pnpm docs:all                  # regenerate docs
```

Confirm with the user before running `git rm`. The default behaviour
is **review only**; deletion is opt-in per session.

## Anti-patterns (stop)

- **Re-authoring spec content.** This is verification, not design. If
  rich content didn't transfer, surface the gap — do not transfer it
  yourself in this session. Route the gap fix to the implementer or
  to a follow-up `architect-implement-spec` session.
- **Deleting specs whose value hasn't transferred.** Every pre-deletion
  gate criterion in [`../_shared/value-transfer.md`](../_shared/value-transfer.md)
  must hold. If any fails, deletion is blocked.
- **Gating on production-TS JSDoc presence.** Annotations are
  additive — see
  [`../_shared/annotation-ownership.md`](../_shared/annotation-ownership.md).
  A pattern with zero production JSDoc and a complete executable
  feature is legitimately complete.
- **Reading source files via Read/Glob/Grep before the CLI bootstrap.**
  The Data API is faster and more accurate. Run the CLI verbs above first.

## Do not

- Do not transition the FSM in this session. If a pattern needs to be
  reopened, that's a separate `architect-implement-spec` session with
  `@architect-unlock-reason:` (see
  [`../_shared/fsm-transitions.md`](../_shared/fsm-transitions.md)).
- Do not delete specs without explicit user authorization in this
  session.
- Do not paraphrase the implementations back as a "summary." Surface
  per-pattern verdicts only.
