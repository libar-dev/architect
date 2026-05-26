# Ephemeral-Spec Deletion (value-transfer execution detail)

The terminal phase of the spec lifecycle: how value moves out of an
ephemeral design spec into durable surfaces, and what makes a design
spec safe to delete. The **concept** — specs are scaffolds, the
lifecycle ends in deletion — is required context for every session
type and lives in [`../SKILL.md`](../SKILL.md) §"The spec is a
scaffold". This file is the **execution detail** the implement and
review-implementation references use: the transfer checklist, the
five-criterion pre-deletion gate, and deletion timing.

## Concept

Design-level specs and stubs are **scaffolds, not permanent
documentation**. Once implementation completes, the spec's value must
transfer to surfaces that survive the spec's deletion. The durable
artifacts are:

1. **Executable Gherkin** in `tests/features/**/*.feature` — the
   primary carrier. Carries pattern identity (`@architect-pattern`),
   the realization edge (`@architect-implements:<Pattern>`), status,
   dependencies, business invariants (Rule blocks), and scenarios that
   prove the invariants hold.
2. **JSDoc `@architect-*` annotations on production code** — additive
   carrier. Carries technical wiring (`@architect-uses` when the target
   resolves to a declared pattern), "when to use" guidance
   (`@architect-usecase`), implementation classification
   (`@architect-role`, `@architect-bounded-context`), decision links
   (`@architect-decision`), and any architectural `**Rationale:**`
   content that doesn't belong in Gherkin.

## The primary durable artifact is the executable feature file

Per the split-ownership policy in
[`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md), the `.feature`
file is the **canonical pattern definition**. Production-TS JSDoc
annotations are **additive, not mandatory** — sampled completed patterns
(`ConfigLoader`, `DefineConfig`) carry zero `@architect-*` JSDoc on the
production source and are still legitimately complete because the
executable feature carries the full surface.

The maximalist framing "value must transfer to BOTH surfaces" (executable
Gherkin + JSDoc annotations) is a useful default goal, but it is **not**
the deletion gate. The actual gate is in the **Pre-deletion gate** section
below; the split-ownership policy in `annotation-ownership.md` is the
authority for which surface is mandatory vs additive.

## Transfer checklist

| From (ephemeral)                        | To (durable carrier)                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Plan-level rule with invariant          | `Rule:` block in `tests/features/**/*.feature` carrying `**Invariant:**` (+ `**Rationale:**` + `**Verified by:**` at plan tier) |
| Stub's "When to Use" comment            | `@architect-usecase` JSDoc on the implementation (additive)                                                                     |
| Stub's DD-N decision                    | `@architect-decision:DD-N` JSDoc referencing the ADR (additive)                                                                 |
| Design Scenario                         | Executable `Scenario:` block in `tests/features/`                                                                               |
| Scenario without a production-code home | Executable scenario alone — no annotation target exists                                                                         |
| Architectural rationale                 | Either Gherkin Rule block `**Rationale:**` OR JSDoc free text — pick whichever is more discoverable for the reader              |
| Deliverables list                       | Verified by test coverage + (where annotations exist) `@architect-target` resolution                                            |

For the bipartite production↔test pattern naming convention (test
patterns carry `@architect-pattern:<Name>Testing` or
`<Name>ExecutableTests`) see
[`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).
For the optional 4-field Rule template see
[`../../architect-base/references/rule-block-template.md`](../../architect-base/references/rule-block-template.md).

## Anti-patterns (stop)

- **Zombie design spec.** Leaving a design-level spec in
  `architect/specs/` after implementation completes. The spec is
  scaffolding; once the building stands, the scaffolding comes down.
- **Half-transferred value.** Transferring rules to executable specs
  but not to annotations (or vice versa) where both surfaces should
  carry weight. Note: annotations are additive, so transfer to
  executable Gherkin alone is often sufficient — apply this anti-pattern
  only when both surfaces are genuinely required.
- **Retroactive plan-level spec.** Authoring a fresh design or
  plan-level spec for code that already ships. Ephemeral specs describe
  _planned_ work — conjuring one back to "cover" shipped behavior
  inverts the pipeline. Use the `*ExecutableTests` escape hatch in
  [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).

## Pre-deletion gate

A design spec is safe to delete only when **all** of these hold:

1. **Forward link present.** The design spec carries
   `@architect-executable-specs:<path>`.
2. **Forward link resolves.** The path points at a real file under
   `tests/features/`.
3. **Reverse link present.** That target feature carries
   `@architect-implements:<Pattern>` for the focal pattern.
4. **Rich content has landed.** Every Rule block in the design spec
   has a counterpart Rule block in the executable feature carrying
   `**Invariant:**` (and, where present in the source,
   `**Rationale:**` + `**Verified by:**`).
5. **Architecturally significant rationale lives in JSDoc** for any
   production code where the rationale won't fit in Gherkin (judgment
   call — annotations are additive).

When all five hold, deletion is safe. When any fails, fix that surface
before deletion.

## Mechanical check (when shipped)

The candidate spec
`architect/specs/value-transfer-state.feature`
proposes:

- A CLI verb `pnpm architect:query value-transfer <pattern>` returning the
  per-pattern state (`designSpecPath`, `executableSpecPaths`,
  `annotatedSourcePaths`, `forwardLink`, `reverseLinks`, `antipatterns`,
  `deletionReady`, `transferComplete`).
- An MCP tool `architect_value_transfer` with the same input shape.
- Composition into `ArchitectBriefDeterministicBundle` so every
  session-open brief surfaces anti-patterns as graph-derived ground
  truth.

Until that ships, the manual checklist above is the gate. After it
ships, the [`implement`](./implement.md) and
[`review-implementation`](./review-implementation.md) references will
gate `git rm` on `deletionReady === true`.

## Deletion timing

The implementer **asks the user** before deleting:

- **Delete now** — appropriate when the implementation session reviews
  the value transfer thoroughly and the pattern is the only one being
  reviewed.
- **Defer to code review** (more common) — appropriate when several
  related implementations are being reviewed together. The reviewer
  batches the spec deletions in a single PR or review pass, after
  verifying value transfer across the related set. The
  [`review-implementation`](./review-implementation.md) reference is the
  canonical owner of batched deletion.

Default behavior: **ask, don't auto-delete**.

## Sibling references

- [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md) —
  split-ownership policy that makes the executable feature canonical.
- [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md)
  — bipartite production↔test pattern graph + `*ExecutableTests`
  escape hatch.
- [`../../architect-base/SKILL.md`](../../architect-base/SKILL.md)
  §"Anti-anecdote" — the live graph/CLI is canonical over a stale
  paraphrase.

The `value-transfer-state.feature` candidate spec referenced above
(`architect/specs/value-transfer-state.feature`) is
an Architect-internal pointer to the in-progress mechanization of this
gate, not an external doc — keep the reference.
