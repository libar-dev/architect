Feature: Architect guard runtime

  Rule: Guard runtime APIs preserve process enforcement behavior

    Scenario: Detect process metadata leaking into TypeScript annotations
      When I detect process metadata in TypeScript annotations
      Then one process metadata violation should be reported

    Scenario: Pass custom tag prefixes through anti-pattern detection
      When I detect anti-patterns with a custom tag prefix
      Then one custom-prefix violation should mention "@acme-team"

    Scenario: Do not emit the removed historical tag-duplication anti-pattern id
      When I detect anti-patterns for architect process metadata
      Then the removed tag-duplication anti-pattern id should not be reported

    Scenario: Flag the same @architect-pattern identity declared in two feature files
      When I detect anti-patterns for two features sharing one pattern identity
      Then a duplicate-pattern-identity violation is reported for each file

    Scenario: Allow distinct pattern identities across feature files
      When I detect anti-patterns for two features with distinct pattern identities
      Then no duplicate-pattern-identity violation is reported

    Scenario: Flag retired taxonomy tags as removed tags
      When I detect removed tags in a feature using retired ADR-013 taxonomy tags
      Then a removed-tag violation is reported for each retired tag
      And no removed-tag violation is reported for the status or level look-alikes

    Scenario: Warn on completed spec edits without unlock reason
      When I validate a completed spec edit without unlock reason
      Then the process guard should warn for completed protection
      And the process guard should not block the change

    Scenario: Suppress completed-protection warning with unlock reason
      When I validate a completed spec edit with an unlock reason
      Then the process guard should not warn for completed protection
      And the process guard should not block the change

    Scenario: Warn on pending scope added to an active spec
      When I validate a pending deliverable added to an active spec
      Then the process guard should warn for scope creep
      And the process guard should not block the change

    Scenario: Stay silent on real-progress scope added to an active spec
      When I validate an in-progress deliverable added to an active spec
      Then the process guard should not warn for scope creep
      And the process guard should not block the change

    Scenario: Strict mode promotes the completed-protection warning to a blocking error
      When I validate a completed spec edit without unlock reason in strict mode
      Then the process guard should block the change for completed protection

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
