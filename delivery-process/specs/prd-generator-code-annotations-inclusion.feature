@libar-docs
@libar-docs-pattern:PrdImplementationSection
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-effort:3d
@libar-docs-product-area:DeliveryProcess
@libar-docs-parent:PatternRelationshipModel
Feature: PRD Implementation Section

  **Problem:** Implementation files with `@libar-docs-implements:PatternName` contain rich
  relationship metadata (`@libar-docs-uses`, `@libar-docs-used-by`, `@libar-docs-usecase`)
  that is not rendered in generated PRD documentation. This metadata provides valuable API
  guidance and dependency information.

  **Solution:** Extend the PRD generator to collect all files with `@libar-docs-implements:X`
  and render their metadata in a dedicated "## Implementations" section. This leverages the
  relationship model from PatternRelationshipModel without requiring specs to list file paths.

  **Business Value:**
  | Benefit | How |
  | PRDs include implementation context | `implements` files auto-discovered and rendered |
  | Dependency visibility | `uses`/`used-by` from implementations shown in PRD |
  | Usage guidance in docs | `usecase` annotations rendered as "When to Use" |
  | Zero manual sync | Code declares relationship, PRD reflects it |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Implementation collector | pending | delivery-process/src/generators/ | Yes | unit |
      | PRD section renderer | pending | delivery-process/src/renderable/ | Yes | unit |

  # ============================================================================
  # RULE 1: Implementation Discovery via Relationship Index
  # ============================================================================

  Rule: PRD generator discovers implementations from relationship index

    **Invariant:** When generating PRD for pattern X, the generator queries the
    relationship index for all files where `implements === X`. No explicit listing
    in the spec file is required.

    **Rationale:** The `@libar-docs-implements` tag creates a backward link from
    code to spec. The relationship index aggregates these. PRD generation simply
    queries the index rather than scanning directories.

    **Verified by:** Implementations discovered, Multiple files aggregated

    @acceptance-criteria @happy-path
    Scenario: Implementations discovered from relationship index
      Given a roadmap spec with `@libar-docs-pattern:EventStoreDurability`
      And three TypeScript files with `@libar-docs-implements:EventStoreDurability`
      When the PRD generator processes the pattern
      Then all three implementation files are discovered
      And no directory path is needed in the spec

    @acceptance-criteria @happy-path
    Scenario: Multiple implementations aggregated
      Given pattern "EventStoreDurability" with implementations:
        | File | Uses | Usecase |
        | outbox.ts | Workpool, ActionRetrier | "Capture external results" |
        | idempotentAppend.ts | EventStore | "Prevent duplicate events" |
      When the PRD generator runs
      Then the "## Implementations" section lists both files
      And each file's metadata is rendered separately

  # ============================================================================
  # RULE 2: Implementation Metadata Rendering
  # ============================================================================

  Rule: Implementation metadata appears in dedicated PRD section

    **Invariant:** The PRD output includes a "## Implementations" section listing
    all files that implement the pattern. Each file shows its `uses`, `usedBy`,
    and `usecase` metadata in a consistent format.

    **Rationale:** Developers reading PRDs benefit from seeing the implementation
    landscape alongside requirements, without cross-referencing code files.

    **Verified by:** Section generated, Dependencies rendered, Usecases rendered

    @acceptance-criteria @happy-path
    Scenario: Implementations section generated in PRD
      Given a pattern with implementation files
      When the PRD generator runs
      Then the output includes "## Implementations"
      And each file is listed with its relative path

    @acceptance-criteria @happy-path
    Scenario: Dependencies rendered per implementation
      Given implementation file with `@libar-docs-uses EventStore, Workpool`
      When rendered in PRD
      Then output includes "**Dependencies:** EventStore, Workpool"

    @acceptance-criteria @happy-path
    Scenario: Usecases rendered as guidance
      Given implementation file with `@libar-docs-usecase "When event append must survive failures"`
      When rendered in PRD
      Then output includes "**When to Use:** When event append must survive failures"

    @acceptance-criteria @happy-path
    Scenario: Used-by rendered for visibility
      Given implementation file with `@libar-docs-used-by CommandOrchestrator, SagaEngine`
      When rendered in PRD
      Then output includes "**Used By:** CommandOrchestrator, SagaEngine"

  # ============================================================================
  # RULE 3: No Implementations Graceful Handling
  # ============================================================================

  Rule: Patterns without implementations render cleanly

    **Invariant:** If no files have `@libar-docs-implements:X` for pattern X,
    the "## Implementations" section is omitted (not rendered as empty).

    **Rationale:** Planned patterns may not have implementations yet. Empty
    sections add noise without value.

    **Verified by:** Section omitted when empty

    @acceptance-criteria @happy-path
    Scenario: Section omitted when no implementations exist
      Given a pattern "FuturePattern" with status "roadmap"
      And no files have `@libar-docs-implements:FuturePattern`
      When the PRD generator runs
      Then the output does not include "## Implementations"
