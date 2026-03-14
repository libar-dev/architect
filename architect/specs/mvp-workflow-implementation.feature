@architect
@architect-pattern:MvpWorkflowImplementation
@architect-status:completed
@architect-unlock-reason:Add-process-workflow-include-tag
@architect-phase:99
@architect-release:v1.0.0
@architect-effort:8h
@architect-product-area:Process
@architect-include:process-workflow
@architect-business-value:align-package-with-pdr005-fsm
@architect-priority:high
Feature: MVP Workflow Implementation

  **Problem:**
  PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`)
  but the Architect package validation schemas and generators may still
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

    **Invariant:** The scanner and validation schemas must accept exactly the four PDR-005 status values: roadmap, active, completed, deferred.
    **Rationale:** Unrecognized status values silently drop patterns from generated documents, causing missing documentation across the entire monorepo.

    **Verified by:** Scanner extracts new status values; Scenario Outline: All four status values are valid

    @acceptance-criteria
    Scenario: Scanner extracts new status values
      Given a feature file with @architect-status:roadmap
      When the scanner processes the file
      Then the status field is "roadmap"

    @acceptance-criteria
    Scenario Outline: All four status values are valid
      Given a feature file with @architect-status:<status>
      When validating the pattern
      Then validation passes

      Examples:
        | status    |
        | roadmap   |
        | active    |
        | completed |
        | deferred  |

  Rule: Generators map statuses to documents

    **Invariant:** Each status value must route to exactly one target document: roadmap/deferred to ROADMAP.md, active to CURRENT-WORK.md, completed to CHANGELOG-GENERATED.md.
    **Rationale:** Incorrect status-to-document mapping causes patterns to appear in the wrong document or be omitted entirely, breaking the project overview for all consumers.

    **Verified by:** Roadmap and deferred appear in ROADMAP.md; Active appears in CURRENT-WORK.md; Completed appears in CHANGELOG-GENERATED.md

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
    Scenario: Completed appears in CHANGELOG-GENERATED.md
      Given patterns with status "completed"
      When generating CHANGELOG-GENERATED.md
      Then they appear in the changelog
