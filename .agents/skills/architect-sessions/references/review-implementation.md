# Review (implementation) — post-merge value-transfer verification

The implementations are done; the design specs may or may not still exist. Verify value has transferred to durable surfaces, then either confirm batched deletion is safe or surface what's blocking it.

> This is the **post-implementation** counterpart to [`review-spec.md`](review-spec.md) (which reviews specs _before_ implementation). The two do not overlap — pick by lifecycle phase.

Doctrine depth: the pre-deletion gate + transfer checklist + anti-patterns are in [`ephemeral-spec-deletion.md`](ephemeral-spec-deletion.md); the forward/reverse link pair + `*ExecutableTests` are in [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md); split-ownership (**production-TS JSDoc is additive — never flag its absence as a value-transfer blocker**) is in [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md).

## Gather context first

1. **Which patterns?** Reviewing a comma-separated set as a batch is the common case — get the full list.
2. **Spec state** — are the design specs still present, or already deleted? (Deleted specs make the forward-link check moot; verify against memory of the spec.)
3. **Authorization** — is deletion in scope for _this_ session, or review-only? Default is review-only; deletion is opt-in.

## Pre-flight

Run the implement-mode pre-flight from [`../../architect-data-api/SKILL.md`](../../architect-data-api/SKILL.md) (the reviewer's view of what shipped: `bundle` composite + `scope-validate` + `files` + `rules --only-invariants`), plus the global blocker view `pnpm architect:query arch blocking`. For a batch orientation across the whole reviewed set, run `pnpm architect:query documentation design-review` — it renders every in-scope pattern status-annotated (`Name (role · status)`, e.g. `MCPServer (service · completed)`) grouped by layer / package / theme, so you can see which patterns are `completed` vs still `active` (and which deliverables are still unbuilt `candidate` / `roadmap` specs) at a glance instead of reconstructing it from per-pattern `context` calls. Then, per pattern in scope:

```bash
pnpm architect:query context <pattern> --session implement
pnpm architect:query rules --pattern <pattern>
pnpm architect:query files <pattern> --related
```

When `pnpm architect:query value-transfer <pattern>` ships, run it per pattern — it returns the deterministic `deletionReady` verdict. Until then, walk the manual gate below.

## Per-pattern verification (apply the gate)

For each pattern:

1. **Forward link.** Does the design spec carry `@architect-executable-specs:<path>`? (Moot if the spec is already deleted.)
2. **Forward link resolves.** Does that path point at a real file under `tests/features/`?
3. **Reverse link.** Does that target feature carry `@architect-implements:<Pattern>` for the focal pattern?
4. **Rich content landed — and distilled.** Every Rule block in the design spec has a counterpart in the executable feature carrying `**Invariant:**` (and, where present in the source, `**Rationale:**` + `**Verified by:**`) — but **distilled, not transcribed**: a `**Rationale:**` that only restates its `**Invariant:**`, a `**Verified by:**` repeated verbatim across rules, or a step stub / JSDoc comment re-explaining the pattern (rather than its local how) is **Transcription bloat** ([`ephemeral-spec-deletion.md`](ephemeral-spec-deletion.md)). Remedy = slim the destination, not block deletion.
5. **Production-TS rationale (judgment).** Architecturally significant rationale that doesn't fit in Gherkin lives in JSDoc — but **annotations are additive**, so absence is not a blocker; presence enriches discoverability.
6. **Graph integrity.** `pnpm architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict` — exit 0 means no new dangling references; non-zero means the graph regressed (resolve the new edge, or deliberately rewrite the baseline with `--write-baseline` and explain why).

## Output format

One table for the reviewed set, then a recommended action per pattern:

```
**Implementation review — <PatternA>, <PatternB>, <PatternC>**

| Pattern | Forward link | Reverse link | Rich content | Annotations (additive) | Deletion-ready | Recommended action |
| ------- | ------------ | ------------ | ------------ | ---------------------- | -------------- | ------------------ |
| <PatternA> | ✓ <path> | ✓ | ✓ | ✓ partial | YES | `git rm <designSpecPath>` (batched in this PR) |
| <PatternB> | ✓ <path> | ✗ missing | ✓ | n/a | NO | Add `@architect-implements:<PatternB>` to <feature path>, then re-review |
| <PatternC> | (spec already deleted) | ✓ | ✓ | n/a | (already done) | confirm earlier deletion was correct |

**Batched deletion plan:**
- Delete now: <PatternA>, <PatternC> (already done)
- Block on: <PatternB> (reverse link missing)
```

Found nothing wrong? State it in one sentence — no elaborate restatement.

## Spec-deletion step (only if the user authorizes)

```bash
git rm <designSpecPath1> <designSpecPath2> …
git rm -r <stubDir1> <stubDir2> …
pnpm architect:query overview     # confirm patterns show completed without lingering specs
pnpm docs:all                     # regenerate docs
```

Confirm with the user before `git rm`. Default is **review only**; deletion is opt-in per session.

## Anti-patterns (stop)

- **Re-authoring spec content** — this is verification, not design. If rich content didn't transfer, surface the gap; route the fix to the implementer or a follow-up [`implement.md`](implement.md) session.
- **Deleting specs whose value hasn't transferred** — every pre-deletion gate criterion must hold.
- **Gating on production-TS JSDoc presence** — annotations are additive; a pattern with zero JSDoc and a complete executable feature is legitimately complete.
- **Reading source via Read/Glob/Grep before the CLI bootstrap.**

## Do not

- Do not transition the FSM here. Reopening a pattern is a separate [`implement.md`](implement.md) session with `@architect-unlock-reason:` (the FSM reference).
- Do not delete specs without explicit user authorization this session.
- Do not paraphrase the implementations back as a summary — per-pattern verdicts only.

**Next session:** capture outcomes with [`handoff.md`](handoff.md); route any blocked pattern's fix back to [`implement.md`](implement.md).
