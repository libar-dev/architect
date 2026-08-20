# Ephemeral-spec deletion (value-transfer execution detail)

The terminal phase of the spec lifecycle: how value moves out of an
ephemeral design spec into executable Gherkin and JSDoc, and what makes a design
spec safe to delete. The **concept** (specs are temporary records, the
lifecycle ends in deletion) is required context for every session
type and lives in [`../SKILL.md`](../SKILL.md) §"The spec is a
temporary record". This file is the **execution detail** the implement and
review-implementation references use: the transfer checklist, the
five-criterion pre-deletion gate, and deletion timing.

## Concept

Design-level specs and step-definition stubs are **temporary records, not
permanent documentation**. Once implementation completes, the spec's
value must transfer to artifacts that survive the spec's deletion. (A
**code/contract stub** is the exception: it is not deleted but
_promoted_. It carries its own `@architect-pattern` identity to `src/`
per ADR-003, where it persists as a code-originated pattern; only the
behavioral design `.feature` is deleted.) The durable artifacts are:

1. **Executable Gherkin** in `tests/features/**/*.feature`. The
   primary carrier. Carries pattern identity (`@architect-pattern`),
   the realization edge (`@architect-implements:<Pattern>`), status,
   dependencies, business invariants (Rule blocks), and scenarios that
   prove the invariants hold.
2. **JSDoc `@architect-*` annotations on production code.** Additive
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
annotations are **additive, not mandatory**. A completed,
feature-identity-owned pattern carries zero `@architect-*` identity JSDoc
on its realizing production source and is still legitimately complete
because the executable feature carries the full identity, status, deps, and invariants. (Confirm the
current set live rather than trusting a frozen name. Samples rot:
`pnpm architect:q 'g.patterns.filter(p => p.status === "completed").map(p => p.name)'`,
then `pnpm architect:q 'const p = g.pattern("<Name>"); return {file: p?.sourceFile, realizing: p?.implementedBy}'`.)

The maximalist framing "value must transfer to BOTH artifacts" (executable
Gherkin + JSDoc annotations) is a useful default goal, but it is **not**
the deletion gate. The actual gate is in the **Pre-deletion gate** section
below; the split-ownership policy in `annotation-ownership.md` is the
authority for which artifact is mandatory vs additive.

## Transfer checklist

| From (ephemeral)                        | To (durable carrier)                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-level rule with invariant          | `Rule:` block in `tests/features/**/*.feature` carrying `**Invariant:**` verbatim. Carry `**Rationale:**` **only where it states a why beyond the invariant** (drop it when it merely restates); `**Verified by:**` names the **actual** executable `Scenario:` titles, never a boilerplate string repeated across rules. Distill, don't transcribe. |
| Stub's "When to Use" comment            | `@architect-usecase` JSDoc on the implementation (additive)                                                                                                                                                                                                                                                                                          |
| Stub's DD-N decision                    | `@architect-decision:DD-N` JSDoc referencing the ADR (additive)                                                                                                                                                                                                                                                                                      |
| Design Scenario                         | Executable `Scenario:` block in `tests/features/`                                                                                                                                                                                                                                                                                                    |
| Scenario without a production-code home | Executable scenario alone. No annotation target exists.                                                                                                                                                                                                                                                                                              |
| Architectural rationale                 | Either Gherkin Rule block `**Rationale:**` OR JSDoc free text. Pick whichever is more discoverable for the reader.                                                                                                                                                                                                                                   |
| Deliverables list                       | Verified by test coverage + (where annotations exist) `@architect-target` resolution                                                                                                                                                                                                                                                                 |

For the bipartite production↔test pattern naming convention (test
patterns carry `@architect-pattern:<Name>Testing` or
`<Name>ExecutableTests`) see
[`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).
For the optional 4-field Rule template see
[`../../architect-base/references/rule-block-template.md`](../../architect-base/references/rule-block-template.md).

## Anti-patterns (stop)

- **Zombie design spec.** Leaving a design-level spec in
  `architect/specs/` after implementation completes. The spec is a
  working file; once the code ships, that file comes down.
- **Half-transferred value.** Transferring rules to executable specs
  but not to annotations (or vice versa) where both artifacts should
  carry weight. Note: annotations are additive, so transfer to
  executable Gherkin alone is often sufficient. Apply this anti-pattern
  only when both artifacts are genuinely required.
- **Retroactive plan-level spec.** Authoring a fresh design or
  plan-level spec for code that already ships. Ephemeral specs describe
  _planned_ work. Conjuring one back to "cover" shipped behavior
  inverts the pipeline. Use the `*ExecutableTests` escape hatch in
  [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).
- **Transcription bloat.** Copying rule prose across the transfer
  instead of distilling it. Symptoms: a `**Rationale:**` that inverts
  its own `**Invariant:**`; the **same** `**Verified by:**` string on
  every rule (the backfill smell, e.g. ADR-003's six identical
  copies); a step stub or production-JSDoc comment that re-states what
  the pattern _is_ rather than its local wiring / how (see
  [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md)
  §"Critical: do not duplicate explanation"); a house-motif phrase
  where a concrete path / field / ADR ref would be exact. The fix is to
  **slim the destination** (executable feature, stub, or JSDoc), then
  delete the spec. Never keep the working file because its successor
  reads long.

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
   call. Annotations are additive).

When all five hold, deletion is safe. When any fails, fix that artifact
before deletion.

**Distillation is a transfer-quality check, not a sixth deletion
blocker.** The five criteria gate _whether value landed_;
**Transcription bloat** (above) gates _whether it landed clean_. A
verbose destination never justifies keeping the working file. The remedy is
always to slim the executable feature / stub / JSDoc, then delete.
Verify distillation at review sign-off
([`review-implementation.md`](review-implementation.md)), not by
retaining the spec.

## Mechanical check (when shipped)

The candidate spec
`architect/specs/value-transfer-state.feature`
proposes:

- A deterministic per-pattern value-transfer read returning
  (`designSpecPath`, `executableSpecPaths`,
  `annotatedSourcePaths`, `forwardLink`, `reverseLinks`, `antipatterns`,
  `deletionReady`, `transferComplete`). The planned form is the pure
  kernel `projectValueTransferState` /
  `parseAndProjectValueTransferState`, plus the typed MCP tool
  `architect_value_transfer`. No named CLI command, graph-handle method,
  or q-import is added. Plain-JS q bodies cannot import this planned
  projection (ADR-014).
- An MCP tool `architect_value_transfer` with the same input shape.
- Composition into `ArchitectBriefDeterministicBundle` so every
  session-open brief shows anti-patterns as graph-derived ground
  truth.

Until that ships, the manual checklist above is the gate. After it
ships, the [`implement`](./implement.md) and
[`review-implementation`](./review-implementation.md) references will
gate `git rm` on `deletionReady === true`.

## Deletion timing

The implementer **asks the user** before deleting:

- **Delete now.** Appropriate when the implementation session reviews
  the value transfer thoroughly and the pattern is the only one being
  reviewed.
- **Defer to code review** (more common). Appropriate when several
  related implementations are being reviewed together. The reviewer
  batches the spec deletions in a single PR or review pass, after
  verifying value transfer across the related set. The
  [`review-implementation`](./review-implementation.md) reference is the
  canonical owner of batched deletion.

Default behavior: **ask, don't auto-delete**.

## Sibling references

- [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md).
  Split-ownership policy that makes the executable feature canonical.
- [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md).
  Bipartite production↔test pattern graph + `*ExecutableTests`
  escape hatch.
- [`../../architect-base/SKILL.md`](../../architect-base/SKILL.md)
  §"Anti-anecdote". The live graph is canonical over a stale
  paraphrase.

The `value-transfer-state.feature` candidate spec referenced above
(`architect/specs/value-transfer-state.feature`) is
an Architect-internal pointer to the in-progress mechanization of this
gate, not an external doc. Keep the reference.
