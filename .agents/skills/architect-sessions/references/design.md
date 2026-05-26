# Design — plan → design promotion

Taking a plan-level spec to design tier. The deliverable is a richer `.feature` plus stubs in `architect/stubs/`. **Do not write production code in this session** — that is [`implement.md`](implement.md).

Doctrine depth: split-ownership (which tags live on the feature vs on stubs; **code stubs MUST NOT carry `@architect-pattern`**) in [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md); the optional 4-field Rule template in [`../../architect-base/references/rule-block-template.md`](../../architect-base/references/rule-block-template.md); choosing the test-pattern name (`<Pattern>Testing` vs `<Pattern>ExecutableTests`) in [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).

## Gather context first

Before promoting, confirm the design has somewhere solid to stand. Extract from the plan-level spec and the normative source (ADR/redesign/brief); ask only about gaps:

1. **Source of truth** — which ADR / redesign doc / brief does this design realize? Read it; its types and constraints must land in the deliverables.
2. **Deliverable surface** — which exact files will this touch? (Becomes the `Background:` table.)
3. **Reuse** — do the proposed types/schemas already exist in `packages/`? Reference and reuse, don't redefine.
4. **Decisions** — are there genuinely new architectural decisions (→ ADR refs + stub DD-N), or is this the Nth instance of an established shape (→ keep it lean)?

The detail level is **contextual** (`architect-base` §10): invest depth where the work is architecturally significant or sensitive; skip stubs and exhaustive scenarios for routine, well-understood shapes. Too much detail rots; stripping hard-won nuance to "match the tier" destroys signal. Both fail.

## Pre-flight

Run the pre-flight from [`../../architect-data-api/SKILL.md`](../../architect-data-api/SKILL.md): `overview`, then the `scope-validate <Pattern> design` gate, then `bundle <Pattern> --mode design --format json` (deliverables + stubs + deps + open questions), dropping to `dep-tree` / `rules` as needed. There is **no** `stubs` verb — `context --session design` or the design-mode bundle returns stubs.

If `scope-validate` returns BLOCKED, **stop and surface the blocker.** Do not design around a blocked dependency chain. If the source spec is at idea or candidate tier, **stop** and route through [`plan.md`](plan.md) to promote through the missing rungs — skipping rungs is rejected (except the refactoring carve-out, which is [`architect-refactor-session`](../../architect-refactor-session/SKILL.md), not this).

## Plan → Design delta

A design-level `.feature` adds, on top of the plan-level shape:

- `Background:` table listing the exact files this design will touch — full paths, file-by-file.
- Exhaustive scenarios: error paths, edge cases, integration scenarios.
- Stub references in `architect/stubs/<pattern>/*`.
- `**Rationale:**` and `**Verified by:**` on every Rule.
- ADR references where significant decisions were made.

Status stays `roadmap` (it transitions to `active` during implement, not here). Edit in place — no file move.

## Stubs — ephemeral scaffolds (read carefully)

Stubs live in `architect/stubs/<pattern>/`. They:

- Are TypeScript files with realistic signatures, types, and JSDoc — **no real logic**.
- May include design-decision (DD-N) comments and "When to Use" guidance.
- Are **not compiled, not linted, not tested** — they are staging.
- Move to `src/` during implementation, then are **deleted** from `architect/stubs/`.

Encode in stubs the design intent production code will need but Gherkin can't carry naturally: types, function signatures, hidden constraints, why-this-shape rationale.

## Anti-drift tripwires (stop and redirect if you catch yourself)

1. Writing real implementation logic in a stub — stubs carry shape, not behavior.
2. Adding a `.ts` file under `src/` — wrong session; hand off to [`implement.md`](implement.md).
3. Running `pnpm test` or editing `tests/features/` — wrong session.
4. Editing a file outside the deliverables table — **add it to the table** before editing.
5. Re-deriving pattern data outside `PatternGraph` — read via the Data API verbs, don't parallel-pipeline.
6. Inventing a business rule with no `**Invariant:**`.
7. Promoting an idea straight to design — design requires plan tier first; route through [`plan.md`](plan.md).

## The spec you write here will be deleted

Design-level specs and stubs are scaffolds. At implement time their value transfers to executable Gherkin (invariants/rationale/verified-by) and JSDoc, then the `.feature` and stubs are deleted (full doctrine: [`ephemeral-spec-deletion.md`](ephemeral-spec-deletion.md)). **Author every line knowing it will be deleted** — make it worth the implementer's read. Anything that won't transfer to an annotation or an executable scenario should not be written.

## Acceptance criteria for design tier

Verify with the Data API before claiming done:

```bash
pnpm architect:query scope-validate <pattern> implement     # must return PASS
pnpm architect:query context <pattern> --session implement  # must include deliverables
```

WARN or BLOCKED on `implement` means the design is not ready — fix the gaps first.

## Do not

- Do not implement.
- Do not delete the design spec or its stubs here — [`implement.md`](implement.md) owns that, after value transfer.
- Do not skip stubs for architecturally relevant behavior, and do not author scenarios the executable layer can't reach (design scenarios are written to become executable).

**Next session:** when `scope-validate <pattern> implement` is PASS, continue in [`implement.md`](implement.md). If it returns WARN/BLOCKED, run [`review-spec.md`](review-spec.md) to enumerate the gaps first.
