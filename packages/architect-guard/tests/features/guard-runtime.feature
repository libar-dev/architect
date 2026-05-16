Feature: Architect guard runtime

  Rule: Guard runtime APIs preserve process enforcement behavior

    Scenario: Validate DoD deliverables and acceptance criteria
      When I validate DoD deliverables and acceptance criteria
      Then the DoD result should be met
      And the DoD result should not report missing acceptance criteria

    Scenario: Detect process metadata leaking into TypeScript annotations
      When I detect process metadata in TypeScript annotations
      Then one process metadata violation should be reported

    Scenario: Pass custom tag prefixes through anti-pattern detection
      When I detect anti-patterns with a custom tag prefix
      Then one custom-prefix violation should mention "@acme-quarter"

    Scenario: Do not emit the removed historical tag-duplication anti-pattern id
      When I detect anti-patterns for architect process metadata
      Then the removed tag-duplication anti-pattern id should not be reported

    Scenario: Block completed spec edits without unlock reason
      When I validate a completed spec edit without unlock reason
      Then the process guard should reject the change for completed protection

    Scenario: Run step lint from the guard package
      When I run step lint against a temporary feature pair
      Then the step-lint summary should have no errors

    Scenario: Detect status transitions for added files in files mode
      When I detect file changes for a newly added active spec
      Then the file-change result should include a roadmap to active transition

    Scenario: Idea-tier soft lint passes on a clean idea-tier spec
      When I run idea-tier lint against a clean idea-tier spec
      Then the idea-tier summary should have no warnings

    Scenario: Idea-tier soft lint warns on scenarios in an idea-tier spec
      When I run idea-tier lint against an idea-tier spec containing a scenario
      Then the idea-tier summary should report a no-scenarios warning
      And the idea-tier summary should have no errors

    Scenario: Idea-tier soft lint skips legacy candidate specs without explicit maturity
      When I run idea-tier lint against a candidate spec without explicit maturity
      Then the idea-tier summary should have no warnings
      And the idea-tier summary should have no errors

    Scenario: Idea-tier soft lint waives parent requirement for epic-level specs
      When I run idea-tier lint against an epic-level idea-tier spec without parent
      Then the idea-tier summary should not report an insufficient-tags warning
      And the idea-tier summary should have no errors

    Scenario: Idea-tier soft lint waives parent requirement for slice-level specs
      When I run idea-tier lint against a slice-level idea-tier spec without parent
      Then the idea-tier summary should not report an insufficient-tags warning
      And the idea-tier summary should have no errors
