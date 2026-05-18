# Feature: Scope-Creep Detection

## Status
✅ COMPLETE — ProcessGuard rule `scope-creep` (`packages/architect-guard/src/lint/process-guard/types.ts:210-216`) detects expansion beyond accepted scope on `active` patterns; tied to `ProtectionLevel = 'scope'` for the `active` state (`states.ts:18-23`).

## Overview

While a pattern is in the `active` state, its scope is the set of deliverables and rules committed to in the design spec. Adding new deliverables, new acceptance scenarios, or new dependency edges without revisiting the design is **scope creep** — quietly making the in-flight change larger than the team or the agent originally signed up for. The platform encodes this as a first-class lint rule: an `active` pattern is `ProtectionLevel = 'scope'`, meaning "modifications are allowed but expansion is not."

The `scope-creep` rule compares the staged-diff pattern surface against the pattern's accepted design. Net-new deliverables on an `active` pattern, net-new `@architect-uses` edges, or net-new `Rule:` blocks in the spec are flagged. Renames and refactors are allowed; outright additions require either an explicit design amendment or transitioning the pattern back to `roadmap` (which the FSM does permit: `active → roadmap`).

The rule is intentionally narrow: it does not flag implementation-level changes inside files annotated for the pattern. It flags only contract-level expansion visible at the annotation / Gherkin layer. This keeps the signal sharp and avoids drowning real scope expansion in noise about routine edits.

Reference: `functional-specification.md` FR-009; `data-architecture.md` §1e Protection levels; `decision-rationale.md` "Architecture-as-fitness-function" principle.

## User Stories

- As an **AI-augmented developer**, I want the guard to flag when an in-flight `active` pattern gains a new deliverable or dependency so I notice scope drift before review.
- As an **AI coding agent**, I want `scope-creep` violations to suggest the right corrective action (transition back to `roadmap`, or trim the change) so I can self-correct without asking the user.
- As an **architect maintainer**, I want scope-creep violations to be distinguished from `invalid-status-transition` violations so the report tells me what kind of doctrine breach happened.
- As a **review reader**, I want each scope-creep finding to cite the file and the specific new item (deliverable name, edge name, or rule name) so review feedback can be precise.

## Acceptance Criteria

- [x] `scope-creep` rule registered in `packages/architect-guard/src/lint/process-guard/types.ts:210-216` with `severity: 'error'`.
- [x] Rule triggers only when the owning pattern's status is `active` (i.e., `ProtectionLevel = 'scope'`).
- [x] Net-new deliverables on the active pattern produce a violation.
- [x] Net-new `@architect-uses` edges on the active pattern produce a violation.
- [x] Net-new `Rule:` blocks in the pattern's design spec produce a violation.
- [x] Refactors (renames without net additions) do not produce violations.
- [x] Implementation-level changes inside files of an `active` pattern (without touching annotations or deliverables) do not produce violations.
- [x] Transitioning the pattern back to `roadmap` (an FSM-legal move) clears the violation on the next guard run.
- [x] Violations include `pattern`, `file`, `line`, and a descriptive label of the new item that caused the trigger.
- [x] `--strict` mode promotes any informational warnings adjacent to scope-creep to error (PDR-001 DD-4 alignment).

## Technical Requirements

- **Architecture**: Rule owned by `@libar-dev/architect-guard`; consumes PatternGraph + scope baseline from `@libar-dev/architect-core`. The baseline is computed from the pattern's accepted design spec at build time.
- **Inputs**: PatternGraph derived from current source + scope baseline derived from the pattern's last `roadmap → active` transition point.
- **Outputs**: Violations of shape `{ ruleId: 'scope-creep', severity: 'error', pattern, file, line, addedItem: string, addedItemKind: 'deliverable' | 'use-edge' | 'rule' }`.
- **Performance**: Baseline computation is part of the same PatternGraph build (no extra parse pass).
- **Invariants** (from `constitution.md` §II Principle 6, §IV.A):
  - `active` patterns are scope-locked.
  - Re-scoping requires an FSM transition, not a silent annotation edit.
  - The rule flags contract-level changes only; implementation churn is out of scope.

## Implementation Status

**Completed:**
- ✅ Rule definition: `packages/architect-guard/src/lint/process-guard/types.ts:210-216`.
- ✅ Protection-level mapping: `packages/architect-core/src/validation/fsm/states.ts:18-23`.
- ✅ Wired into `architect-guard --staged` and `architect-guard --all`.
- ✅ Output schema includes `addedItem` and `addedItemKind` discriminator.
- ✅ Executable Gherkin coverage in `packages/architect-guard/tests/features/` for: new-deliverable-flagged, new-use-edge-flagged, new-rule-block-flagged, refactor-rename-not-flagged, impl-change-not-flagged, transition-to-roadmap-clears.

## Dependencies

- `007-fsm-lifecycle-enforcement` — depends on the `active` state being correctly identified.
- `008-completed-pattern-protection` — sibling protection rule on the terminal state.
- `003-pattern-graph-read-api` — scope baseline derived from PatternGraph.
- `013-pre-commit-guard` — composition root for the rule's pre-commit / CI runs.
- External: none.

## Related Specifications

- ADR-003 — Source-First Pattern Architecture (scope baseline is annotation-derived).
- ADR-006 — Single Read Model.
- PDR-001 DD-4 — `--strict` promotes WARN → BLOCKED for adjacent informational findings.
- Executable Gherkin: `packages/architect-guard/tests/features/process-guard-scope-creep*.feature`.
- See also: `.specify/specs/007-fsm-lifecycle-enforcement/spec.md`, `.specify/specs/008-completed-pattern-protection/spec.md`, `.specify/specs/010-scope-readiness-validation/spec.md`.
