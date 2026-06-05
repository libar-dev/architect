# Design — plan → design promotion

Taking a plan-level spec to design tier. The deliverable is a richer `.feature` plus stubs in `architect/stubs/`. **Do not write production code in this session** — that is [`implement.md`](implement.md).

Doctrine depth: split-ownership (which tags live on the feature vs on stubs; a **code/contract stub carries its own code-originated `@architect-pattern`** — a _distinct_ name — plus `@architect-implements`/`@architect-target`, while a **step-definition stub MUST NOT carry `@architect-pattern`** per ADR-008) in [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md); the optional 4-field Rule template in [`../../architect-base/references/rule-block-template.md`](../../architect-base/references/rule-block-template.md); choosing the test-pattern name (`<Pattern>Testing` vs `<Pattern>ExecutableTests`) in [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).

## Gather context first

Before promoting, confirm the design has somewhere solid to stand. Extract from the plan-level spec and the normative source (ADR/redesign/brief); ask only about gaps:

1. **Source of truth** — which ADR / redesign doc / brief does this design realize? Read it; its types and constraints must land in the deliverables.
2. **Deliverable surface** — which exact files will this touch? (Becomes the `Background:` table.)
3. **Reuse** — do the proposed types/schemas already exist in `packages/`? Reference and reuse, don't redefine.
4. **Decisions** — are there genuinely new architectural decisions (→ ADR refs + stub DD-N), or is this the Nth instance of an established shape (→ keep it lean)?

The detail level is **contextual** (`architect-base` §10): invest depth where the work is architecturally significant or sensitive; skip stubs and exhaustive scenarios for routine, well-understood shapes. Too much detail rots; stripping hard-won nuance to "match the tier" destroys signal. Both fail.

## Pre-flight

Run the pre-flight from [`../../architect-data-api/SKILL.md`](../../architect-data-api/SKILL.md): `overview`, then the `scope-validate <Pattern> design` gate, then `bundle <Pattern> --mode design --format json` (blocks: docstring + open-questions + rules + scenarios), dropping to `dep-tree` / `rules` as needed. The design-mode bundle carries **no** `stubs` / `deliverables` / `deps` block — and there is no `stubs` verb; the spec's deliverables and stubs surface through `context --session design` (its `=== SPEC ===` section), not the bundle.

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
- **Carry their own code-originated identity.** In `.ts` JSDoc, author: `@architect` + `@architect-pattern <ContractName>` (a _distinct_ name from the design pattern, e.g. `EmissionDescriptor` for `TaxonomyDocumentationCluster`) + `@architect-role:contract` + `@architect-status roadmap` + `@architect-bounded-context:<context>` (optional enrichment) + `@architect-implements <DesignPattern>` + `@architect-target <src path>`. **Mind the surface-dependent syntax** (the lint enforces it; full rule in [`../../architect-base/references/taxonomy.md`](../../architect-base/references/taxonomy.md)): in `.ts` JSDoc `@architect-pattern` / `@architect-implements` / `@architect-target` / `@architect-status` are **space**-separated, while `@architect-role:` / `@architect-bounded-context:` / `@architect-product-area:` take a **colon** — `.feature` files use a colon for `@architect-pattern:` / `@architect-implements:`. `@architect-status` is **always `roadmap`** on a stub (it advances only when the stub is promoted to `src/` — see implement.md). This is mandated by `formal-spec/04-tag-registry.md` + `07-stub-format.md` (`@architect-pattern`/`@architect-implements`/`@architect-target` are MUST on stubs) and ADR-003 ("identity travels with code from stub through production"), and it makes the stub a first-class, queryable graph node: `pattern <ContractName>` resolves, and the design pattern's `implementedBy` points back at it. (A _step-definition_ stub under `architect/step-stubs/` is the exception — no `@architect-pattern`, per ADR-008 — because the spec owns identity there.)
- May include design-decision (DD-N) comments and "When to Use" guidance — these travel with the code to `src/`.
- Are **not compiled, not linted, not tested** — they are staging.
- Move to `src/` during implementation: the **contract identity persists** there as a code-originated pattern (its `@architect-status` advances `roadmap` → `active` → `completed` with the build — _not_ frozen at design-time `roadmap`); only the design `.feature` is deleted at value transfer. The stub is the _embryo_ of the shipped pattern, not throwaway — it leaves `architect/stubs/` by being promoted, not discarded.

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
