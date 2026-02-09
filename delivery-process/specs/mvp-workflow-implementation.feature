@libar-docs
@libar-docs-pattern:MvpWorkflowImplementation
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-libar-docs-opt-in-marker
@libar-docs-phase:99
@libar-docs-release:v1.0.0
@libar-docs-effort:8h
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:align-package-with-pdr005-fsm
@libar-docs-priority:high
Feature: MVP Workflow Implementation

  **Problem:**
  PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`)
  but the delivery-process package validation schemas and generators may still
  reference legacy status values. Need to ensure alignment.

  **Solution:**
  Implement PDR-005 status values via taxonomy module refactor:
  1. Create taxonomy module as single source of truth (src/taxonomy/status-values.ts)
  2. Update validation schemas to import from taxonomy module
  3. Update generators to use normalizeStatus() for display bucket mapping

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Taxonomy module as single source of truth | complete | src/taxonomy/status-values.ts |
      | Update DefaultPatternStatusSchema | complete | src/validation-schemas/doc-directive.ts |
      | Update ProcessMetadataSchema status | complete | src/validation-schemas/dual-source.ts |
      | Update generator status mapping | complete | src/renderable/codecs/ |
      | Fix type errors from status change | complete | src/ (typecheck passes) |
      | Run pnpm typecheck | complete | 0 errors |
      | Run pnpm test | complete | 1972 tests pass |

  Rule: PDR-005 status values are recognized

    @acceptance-criteria
    Scenario: Scanner extracts new status values
      Given a feature file with @libar-docs-status:roadmap
      When the scanner processes the file
      Then the status field is "roadmap"

    @acceptance-criteria
    Scenario Outline: All four status values are valid
      Given a feature file with @libar-docs-status:<status>
      When validating the pattern
      Then validation passes

      Examples:
        | status    |
        | roadmap   |
        | active    |
        | completed |
        | deferred  |

  Rule: Generators map statuses to documents

    @acceptance-criteria
    Scenario: Roadmap and deferred appear in ROADMAP.md
      Given patterns with status "roadmap" or "deferred"
      When generating ROADMAP.md
      Then they appear as planned work

    @acceptance-criteria
    Scenario: Active appears in CURRENT-WORK.md
      Given patterns with status "active"
      When generating CURRENT-WORK.md
      Then they appear as active work

    @acceptance-criteria
    Scenario: Completed appears in CHANGELOG
      Given patterns with status "completed"
      When generating CHANGELOG-GENERATED.md
      Then they appear in the changelog
