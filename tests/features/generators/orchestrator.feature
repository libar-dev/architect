@libar-docs
@libar-docs-pattern:DocumentationOrchestrator
@libar-docs-status:completed
@libar-docs-product-area:Generator
@libar-docs-implements:GeneratorInfrastructureTesting
Feature: Documentation Generation Orchestrator

  Tests the orchestrator's pattern merging, conflict detection, and generator
  coordination capabilities. The orchestrator coordinates the full documentation
  generation pipeline: Scanner -> Extractor -> Generators -> File Writer.

  Background: Orchestrator test context
    Given an orchestrator test context

  # ===========================================================================
  # Rule 1: Orchestrator coordinates full documentation generation pipeline
  # ===========================================================================

  Rule: Orchestrator coordinates full documentation generation pipeline

    @acceptance-criteria @happy-path
    Scenario: Non-overlapping patterns merge successfully
      Given TypeScript files with patterns:
        | name          | status    |
        | CoreTypes     | completed |
        | ApiHandler    | active    |
        | DataValidator | roadmap   |
      And feature files with non-overlapping patterns:
        | name           | status    |
        | LoginBehavior  | completed |
        | SearchBehavior | active    |
      When patterns are merged
      Then the merge should succeed
      And the merged dataset should contain 5 unique patterns
      And the merged dataset should include patterns:
        | name           |
        | CoreTypes      |
        | ApiHandler     |
        | DataValidator  |
        | LoginBehavior  |
        | SearchBehavior |

    @acceptance-criteria @validation
    Scenario: Orchestrator detects pattern name conflicts
      Given TypeScript files with patterns:
        | name      | status    |
        | MyFeature | completed |
        | CoreTypes | active    |
      And feature files with overlapping patterns:
        | name      | status  |
        | MyFeature | roadmap |
        | OtherSpec | active  |
      When patterns are merged
      Then the merge should fail with error
      And the error message should contain "Pattern conflicts detected"
      And the error message should mention "MyFeature"

    @acceptance-criteria @validation
    Scenario: Orchestrator detects pattern name conflicts with status mismatch
      Given a TypeScript pattern "UserAuth" with status "completed"
      And a Gherkin pattern "UserAuth" with status "roadmap"
      When patterns are merged
      Then the merge should fail with error
      And the error message should mention "UserAuth"

    @acceptance-criteria @validation
    Scenario: Unknown generator name fails gracefully
      Given a valid pattern dataset
      When requesting generation with generator name "invalid-generator"
      Then the generator lookup should fail
      And the error message should mention "invalid-generator"
      And the error message should list available generators

    @acceptance-criteria @validation
    Scenario: Partial success when some generators are invalid
      Given a valid pattern dataset
      And generator requests for:
        | name             | expectedAvailable |
        | patterns         | true              |
        | invalid-gen      | false             |
        | another-invalid  | false             |
      When checking which generators are available
      Then generator availability should match expectations
