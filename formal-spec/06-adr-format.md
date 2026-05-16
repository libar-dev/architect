# 06 — ADR Format

> **Architect Spec v0.1.0** — Architecture Decision Records in Gherkin format.

---

## Overview

Architecture Decision Records (ADRs) capture significant architecture and technology
decisions in the same Gherkin format used for feature specs. This makes decisions
**first-class citizens** in the pattern graph — queryable, cross-referenced, and
connected to the patterns they affect.

ADRs follow the same structural conventions as feature specs (§05) with specific
adaptations for decision documentation.

## ADR vs. PDR

| Type    | Prefix | Purpose                             | Example                                    |
| ------- | ------ | ----------------------------------- | ------------------------------------------ |
| **ADR** | `adr-` | Architecture or technology decision | Database selection, communication protocol |
| **PDR** | `pdr-` | Process or methodology decision     | Testing strategy, session workflow         |

Both types use the same format. The distinction is in the `@architect-adr-category` tag value.

## Document Structure

```
1. Tag header block (ADR-specific tags)
2. Feature title: ADR-NNN - Decision Title
3. Feature description:
   a. **Context:** — situation and alternatives
   b. **Decision:** — what was decided
   c. **Consequences:** — impact table
4. Background: Deliverables
5. Rule blocks (prefixed with "Decision:")
6. Scenarios
```

## Tag Header

ADRs use a specific tag set. See §04 Group 6 for the complete ADR tag reference.

```gherkin
@architect
@architect-adr:004
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-pattern:ADR004LifecycleArchitecture
@architect-status:completed
@architect-product-area:Process
```

### ADR Numbering

- ADR numbers are zero-padded to 3 digits: `001`, `004`, `012`
- Numbers are assigned sequentially within the project
- The pattern name includes the number: `ADR004LifecycleArchitecture`

### ADR Status Lifecycle

| Status       | Meaning                                                      |
| ------------ | ------------------------------------------------------------ |
| `proposed`   | Under discussion, not yet ratified                           |
| `accepted`   | Ratified and in effect                                       |
| `deprecated` | No longer recommended but not replaced                       |
| `superseded` | Replaced by a newer ADR (use `@architect-adr-superseded-by`) |

## Feature Description

ADR descriptions use three mandatory sections:

### Context

```gherkin
Feature: ADR-004 - Lifecycle-Oriented Feature Architecture

  **Context:** The desktop app has 19 planned features spanning UI views,
  data integration, and workflow tooling. Without a principled organization
  scheme, feature dependencies become tangled and implementation sequencing
  is ad hoc. We need a framework that naturally orders features by their
  infrastructure dependencies.
```

**Requirements:**

- MUST describe the situation that prompted the decision
- SHOULD mention alternatives considered
- SHOULD explain constraints that limited the options

### Decision

```gherkin
  **Decision:** Organize features into 5 lifecycle phases where each phase's
  features depend only on artifacts from earlier phases:

  | Phase | Focus | Features |
  | 1 | Foundation | ProjectConnection, McpIntegration, IPCBridge, AppShell |
  | 2 | Core Views | Dashboard, PatternBrowser, Explorer, Settings |
  | 3 | Authoring | SpecCreator, StubEditor, DeliverableTracker |
  | 4 | Workflow | PlanningBoard, DesignReview, ImplQueue |
  | 5 | Advanced | ProcessPresets, SessionWorkbench, TaxonomyManager, SpecLifecycle |
```

**Requirements:**

- MUST state what was decided
- MAY include decision mappings as data tables
- SHOULD be specific enough to be actionable

### Consequences

```gherkin
  **Consequences:**
  | Type | Impact |
  | Positive | Clear implementation ordering reduces planning overhead |
  | Positive | Each phase delivers user-visible value independently |
  | Negative | Phase boundaries constrain creative feature grouping |
  | Negative | Cross-phase features require explicit dependency management |
```

**Requirements:**

- MUST be a table with `| Type | Impact |` columns
- Type values: `Positive` or `Negative`
- SHOULD include both positive and negative consequences

## Background: Deliverables

ADRs include a deliverables table listing the artifacts affected by the decision:

```gherkin
  Background: Deliverables
    Given the following deliverables:
      | Deliverable           | Status    | Location                                        | Tests | Test Type |
      | lifecycle-phases      | complete  | architect/specs/feature-inventory.md             | No    | n/a       |
      | phase-dependency-map  | complete  | _coordination/ROADMAP.md                         | No    | n/a       |
```

## Rule Blocks

ADR rules formalize the decision's invariants. Rules in ADRs SHOULD use the `Decision:`
prefix to distinguish them from behavioral rules in feature specs:

```gherkin
  Rule: Decision: features map to lifecycle stages

    **Invariant:** Every desktop feature belongs to exactly one lifecycle phase.
    **Rationale:** Prevents circular dependencies and ensures clear implementation ordering.
    **Verified by:** Phase assignment validation, dependency chain check.

    @acceptance-criteria @happy-path
    Scenario: Phase assignment validation
      Given the feature inventory with phase assignments
      When the dependency graph is analyzed
      Then no feature depends on a feature in a later phase
```

### ADR Rule Guidelines

- ADRs typically have 2-4 rules (fewer than feature specs)
- Each rule formalizes one aspect of the decision
- Rules SHOULD be testable — the decision should be verifiable
- Rules are compact and durable — no procedural details or session-specific content

## Supersession

When an ADR is superseded:

1. The old ADR's `@architect-adr-status` changes to `superseded`
2. The old ADR adds `@architect-adr-superseded-by:NNN` pointing to the new ADR
3. The new ADR adds `@architect-adr-supersedes:NNN` pointing to the old ADR

```gherkin
# Old ADR (superseded)
@architect-adr:003
@architect-adr-status:superseded
@architect-adr-superseded-by:005

# New ADR (superseding)
@architect-adr:005
@architect-adr-status:accepted
@architect-adr-supersedes:003
```

The superseded ADR remains in the project as historical record — it is never deleted.

## Quality Criteria

ADRs MUST be:

- **Compact** — capture the decision, not the discussion process
- **Durable** — readable and relevant months or years later
- **Self-contained** — understandable without external context
- **Specific** — "we chose X over Y because Z", not "we discussed options"

ADRs MUST NOT contain:

- Session transcripts or conversation logs
- Procedural details about how the decision was reached
- Temporary state or in-progress markers
- Implementation code (use stubs for that)
