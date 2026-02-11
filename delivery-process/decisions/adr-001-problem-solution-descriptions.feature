@libar-docs
@libar-docs-adr:001
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:ADR001ProblemSolutionDescriptions
@libar-docs-phase:43
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-convention-tag-for-codec-reference-gen
@libar-docs-convention:annotation-system
@libar-docs-completed:2026-01-07
@libar-docs-product-area:Process
Feature: ADR-001 - Problem/Solution Feature Description Structure

  **Context:**
  Feature descriptions in Gherkin files lacked consistent structure.
  - Some features had detailed descriptions, others were sparse
  - Stakeholders struggled to understand the "why" behind features
  - PRD extraction produced inconsistent output quality
  - No standard format for capturing problem statements and solutions
  - Generated documentation quality varied significantly between phases

  **Decision:**
  Adopt a mandatory Problem/Solution structure for all feature descriptions:
  - **Problem:** section with bullet points explaining pain points being addressed
  - **Solution:** section with bullet points explaining the approach
  - Both sections required for PRD-relevant features
  - Lint rule will enforce structure in CI
  - Existing features to be migrated progressively

  **Consequences:**
  - (+) Consistent PRD output quality across all features
  - (+) Clear problem-solution traceability for stakeholders
  - (+) Stakeholders immediately understand "why" behind each feature
  - (+) Better LLM context when planning sessions
  - (-) Requires updating existing feature files (migration effort)
  - (-) Slightly more verbose feature descriptions

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location | Release |
      | Problem/Solution structure definition | complete | No | CLAUDE.md | v0.3.0 |
      | Apply to error-handling.feature | complete | No | tests/features/behavior/error-handling.feature | v0.3.0 |
      | Apply to session-handoffs.feature | complete | No | tests/features/behavior/session-handoffs.feature | v0.3.0 |

  @acceptance-criteria
  Scenario: Feature descriptions have required sections
    Given a feature file with PRD metadata
    When the feature description is parsed
    Then it contains a **Problem:** section
    And it contains a **Solution:** section
