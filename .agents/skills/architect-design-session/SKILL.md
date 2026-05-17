---
name: architect-design-session
description: Use when promoting a plan-level Architect spec to design tier — adding deliverables, stubs, exhaustive scenarios, ADR references. Enforces design-only discipline (no implementation drift), uses the Data API for context, treats stubs as ephemeral scaffolds whose value will transfer to code and executable specs at implement time. Do NOT use for: idea-tier or candidate-tier source specs — route to architect-plan-session to promote through the missing rungs first. Also do NOT use for implementation, bugfixes, or generic refactors — design tier writes specs and stubs only, never production code.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Architect Design-Tier Session

You are taking a plan-level spec to design tier. The deliverable is a richer
`.feature` plus stubs in `architect/stubs/`. **Do not write production code in
this session** — that's the implement-spec session.

## Doctrine references

This skill assumes the following shared references — read them once
per session if you haven't:

- [`../_shared/annotation-ownership.md`](../_shared/annotation-ownership.md)
  — split-ownership policy: which `@architect-*` tags belong on the
  feature file vs on stubs; **code stubs MUST NOT use
  `@<prefix>-pattern`**.
- [`../_shared/rule-block-template.md`](../_shared/rule-block-template.md)
  — when Rule blocks belong in a design spec and the optional 4-field
  template (Rule blocks are NOT mandatory).
- [`../_shared/spec-pattern-relationships.md`](../_shared/spec-pattern-relationships.md)
  — design-tier authoring writes the `@architect-executable-specs:`
  forward link; this doc explains how to choose the test-pattern name
  (`<Pattern>Testing` vs `<Pattern>ExecutableTests`).
- [`../_shared/canonical-references.md`](../_shared/canonical-references.md)
  — anti-anecdote rule; consult the live taxonomy
  (`pnpm architect:query taxonomy --format json`) or
  `formal-spec/03-tag-system.md` + `formal-spec/04-tag-registry.md`
  for tag-usage questions.

## Pre-flight (mandatory CLI bootstrap)

Run the canonical bootstrap:

```bash
pnpm architect:query overview
pnpm architect:query scope-validate <pattern> design        # PASS / WARN / BLOCKED
pnpm architect:query context <pattern> --session design     # full bundle: deliverables, deps, stubs
pnpm architect:query dep-tree <pattern>
pnpm architect:query rules --pattern <pattern>
```

There is **no** `stubs` CLI verb — `context --session design` returns stubs.

If `scope-validate` returns BLOCKED, stop and surface the blocker. Do not
attempt to design around a blocked dependency chain.

## Four-Tier Ladder (entering design tier)

Canonical reference: [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md).
Read it once for the tier table, mandatory tags, and full promotion paths.

This skill operates on the **fourth rung** — design tier, reached only by
promoting an existing plan-tier spec. The Plan → Design delta:

- Add stubs in `architect/stubs/<pattern>/`
- Add exhaustive scenarios: error paths, edge cases, integration scenarios
- Add ADR refs for significant architectural decisions
- Effective maturity becomes design via the retained plan-tier file plus stubs/exhaustive scenarios; do not author `@architect-maturity`
- Status stays `roadmap` (it transitions to `active` during `architect-implement-spec`, not here)
- Edit in place — no file move

If the source spec is at idea or candidate tier, **stop** and route through
`architect-plan-session` to promote through the missing rungs. Skipping rungs
is rejected — except for the refactoring carve-out (existing-code coverage may
skip directly to design or executable; see the shared ladder).

## Design-tier deliverables

A design-level `.feature` adds the following to the plan-level shape:

- `Background:` table listing the exact files this design will touch
  (deliverables) — full paths, file-by-file
- Exhaustive scenarios: error paths, edge cases, integration scenarios
- Stub references in `architect/stubs/<pattern>/*`
- `**Rationale:**` and `**Verified by:**` on every Rule
- ADR references where significant decisions were made

## Stubs (ephemeral scaffolds — read this carefully)

Stubs live in `architect/stubs/<pattern>/`. They:

- Are TypeScript files with realistic signatures, types, and JSDoc — no real
  logic
- May include design-decision (DD-N) comments and "When to Use" guidance
- Are **not compiled, not linted, not tested** — they are staging
- Move to `src/` during implementation, then are **deleted** from `architect/stubs/`

When authoring stubs, encode design intent that production code will need but
that doesn't fit naturally in Gherkin: types, function signatures, hidden
constraints, why-this-shape rationale.

## Anti-drift tripwires (stop and redirect if you catch yourself doing any)

1. Writing real implementation logic in a stub — stop. Stubs carry shape, not behavior.
2. Adding a new `.ts` file under `src/` — wrong session. Stop and hand off to `architect-implement-spec`.
3. Running `pnpm test` or modifying `tests/features/` — wrong session.
4. Editing files outside the deliverables table — if you discover the design needs to touch a file you didn't list, **add it to the table** before editing.
5. Re-deriving pattern data outside `PatternGraph` — read via `pnpm architect:query dep-tree`, `pnpm architect:query arch neighborhood`. Do not parallel-pipeline the data.
6. Inventing a new business rule from scratch without an invariant — every rule needs `**Invariant:**`.
7. Promoting an idea straight to design — design tier requires plan tier first. If the source is an idea or candidate, route through `architect-plan-session`.

## Ephemeral spec principle (mandatory understanding)

Design-level specs and stubs are **scaffolds, not permanent documentation**.
At implementation time, the implement-spec skill will:

1. Transfer rule content + business value to `**Invariant:** / **Rationale:** / **Verified by:**` blocks inside executable Gherkin in `tests/features/`
2. Transfer architectural intent and rationale to JSDoc `@architect-*` annotations on the production code
3. **Delete** the design-level `.feature` from `architect/specs/`
4. **Delete** the stubs from `architect/stubs/`

Authoring expectation: write the design-level spec knowing it will be deleted.
Make every line worth reading by the implementer. Do not write anything that
won't transfer to either an annotation or an executable scenario.

## Acceptance criteria for design tier

Before completing this session, verify with the Data API:

```bash
pnpm architect:query scope-validate <pattern> implement     # must return PASS
pnpm architect:query context <pattern> --session implement  # must include deliverables
```

If `scope-validate <pattern> implement` returns WARN or BLOCKED, the design is
not ready — fix the gaps before claiming done.

## Do not

- Do not implement.
- Do not delete the design-level spec or its stubs in this session — the
  implement-spec skill owns that step, after value transfer.
- Do not skip stubs for "obvious" patterns. If a behavior is architecturally
  relevant, it gets a stub.
- Do not author scenarios that the executable test layer can't reach — design
  scenarios are written to become executable.
