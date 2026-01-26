@behavior @dod-validation
@libar-docs-pattern:DoDValidator
@libar-docs-product-area:Validation
Feature: Definition of Done (DoD) Validation
  Validates that completed phases meet Definition of Done criteria:
  1. All deliverables must have "complete" status
  2. At least one @acceptance-criteria scenario must exist

  **Problem:**
  - Phases marked "completed" without all deliverables done
  - Missing acceptance criteria means no BDD tests
  - Manual review burden without automated validation

  **Solution:**
  - isDeliverableComplete() detects completion via status patterns
  - hasAcceptanceCriteria() checks for AC scenarios
  - validateDoDForPhase() validates single phase
  - validateDoD() validates across multiple phases
  - formatDoDSummary() renders console-friendly output

  # ==========================================================================
  # Deliverable Completion Detection
  # ==========================================================================

  Rule: Deliverables can be marked complete in various formats

    @happy-path
    Scenario Outline: Text-based completion statuses are detected
      Given a deliverable with status "<status>"
      When checking if deliverable is complete
      Then the deliverable is considered complete

      Examples:
        | status    |
        | Complete  |
        | complete  |
        | COMPLETE  |
        | Completed |
        | Done      |
        | Finished  |
        | Yes       |

    @happy-path
    Scenario Outline: Symbol-based completion statuses are detected
      Given a deliverable with status "<status>"
      When checking if deliverable is complete
      Then the deliverable is considered complete

      Examples:
        | status |
        | ✓      |
        | ✔      |
        | ✅     |
        | ☑      |

    @edge-case
    Scenario Outline: Incomplete statuses are correctly identified
      Given a deliverable with status "<status>"
      When checking if deliverable is complete
      Then the deliverable is NOT considered complete

      Examples:
        | status      |
        | In Progress |
        | Pending     |
        | TODO        |
        | Not Started |
        | WIP         |
        | ❌          |

  # ==========================================================================
  # Acceptance Criteria Detection
  # ==========================================================================

  Rule: Acceptance criteria must be tagged with @acceptance-criteria

    @happy-path
    Scenario: Feature with @acceptance-criteria scenario passes
      Given a feature with scenarios:
        | name                     | tags                       |
        | Basic functionality test | happy-path                 |
        | Validates edge cases     | acceptance-criteria        |
      When checking for acceptance criteria
      Then acceptance criteria is found

    @edge-case
    Scenario: Feature without @acceptance-criteria fails
      Given a feature with scenarios:
        | name                     | tags       |
        | Basic functionality test | happy-path |
        | Edge case test           | edge-case  |
      When checking for acceptance criteria
      Then acceptance criteria is NOT found

    @edge-case
    Scenario: Tag matching is case-insensitive
      Given a feature with scenarios:
        | name         | tags                |
        | AC scenario  | ACCEPTANCE-CRITERIA |
      When checking for acceptance criteria
      Then acceptance criteria is found

  # ==========================================================================
  # Acceptance Criteria Scenario Extraction
  # ==========================================================================

  Rule: Acceptance criteria scenarios can be extracted by name

    @happy-path
    Scenario: Extract multiple AC scenario names
      Given a feature with scenarios:
        | name                    | tags                        |
        | Setup test              | setup                       |
        | User can log in         | acceptance-criteria         |
        | User can view dashboard | acceptance-criteria         |
        | Edge case test          | edge-case                   |
      When extracting acceptance criteria scenarios
      Then the extracted scenarios are:
        | name                    |
        | User can log in         |
        | User can view dashboard |

    @edge-case
    Scenario: No AC scenarios returns empty list
      Given a feature with scenarios:
        | name       | tags       |
        | Some test  | happy-path |
      When extracting acceptance criteria scenarios
      Then no scenarios are extracted

  # ==========================================================================
  # Single Phase DoD Validation
  # ==========================================================================

  Rule: DoD requires all deliverables complete and AC present

    @happy-path
    Scenario: Phase with all deliverables complete and AC passes
      Given a feature for phase 15 pattern "FeatureX"
      And deliverables with statuses:
        | name           | status   |
        | Implement API  | Complete |
        | Write tests    | Done     |
        | Documentation  | ✅       |
      And a scenario with tags:
        | tag                 |
        | acceptance-criteria |
      When validating DoD for the phase
      Then DoD is met
      And the result message contains "DoD met"

    @edge-case
    Scenario: Phase with incomplete deliverables fails
      Given a feature for phase 15 pattern "FeatureX"
      And deliverables with statuses:
        | name           | status      |
        | Implement API  | Complete    |
        | Write tests    | In Progress |
        | Documentation  | Pending     |
      And a scenario with tags:
        | tag                 |
        | acceptance-criteria |
      When validating DoD for the phase
      Then DoD is NOT met
      And the result has 2 incomplete deliverables
      And the result message contains "2/3 deliverables incomplete"

    @edge-case
    Scenario: Phase without acceptance criteria fails
      Given a feature for phase 15 pattern "FeatureX"
      And deliverables with statuses:
        | name          | status   |
        | Implement API | Complete |
      And a scenario with tags:
        | tag        |
        | happy-path |
      When validating DoD for the phase
      Then DoD is NOT met
      And the result message contains "No @acceptance-criteria scenarios found"

    @edge-case
    Scenario: Phase without deliverables fails
      Given a feature for phase 15 pattern "FeatureX" with no deliverables
      And a scenario with tags:
        | tag                 |
        | acceptance-criteria |
      When validating DoD for the phase
      Then DoD is NOT met
      And the result message contains "No deliverables defined"

  # ==========================================================================
  # Multi-Phase DoD Validation
  # ==========================================================================

  Rule: DoD can be validated across multiple completed phases

    @happy-path
    Scenario: All completed phases passing DoD
      Given features:
        | pattern   | phase | status    | deliverables_complete | has_ac |
        | PatternA  | 10    | completed | true                  | true   |
        | PatternB  | 11    | completed | true                  | true   |
        | PatternC  | 12    | roadmap   | false                 | false  |
      When validating DoD across all features
      Then the summary shows 2 total phases
      And the summary shows 2 passed phases
      And the summary shows 0 failed phases

    @edge-case
    Scenario: Mixed pass/fail results
      Given features:
        | pattern   | phase | status    | deliverables_complete | has_ac |
        | PatternA  | 10    | completed | true                  | true   |
        | PatternB  | 11    | completed | false                 | true   |
        | PatternC  | 12    | completed | true                  | false  |
      When validating DoD across all features
      Then the summary shows 3 total phases
      And the summary shows 1 passed phases
      And the summary shows 2 failed phases

    @edge-case
    Scenario: Only completed phases are validated by default
      Given features:
        | pattern   | phase | status    | deliverables_complete | has_ac |
        | PatternA  | 10    | completed | true                  | true   |
        | PatternB  | 11    | active    | false                 | false  |
        | PatternC  | 12    | roadmap   | false                 | false  |
      When validating DoD across all features
      Then the summary shows 1 total phases
      And the summary shows 1 passed phases

    @integration
    Scenario: Filter to specific phases
      Given features:
        | pattern   | phase | status    | deliverables_complete | has_ac |
        | PatternA  | 10    | completed | true                  | true   |
        | PatternB  | 11    | active    | true                  | true   |
        | PatternC  | 12    | roadmap   | true                  | true   |
      When validating DoD for phases 11, 12
      Then the summary shows 2 total phases
      And the summary shows 2 passed phases

  # ==========================================================================
  # Report Formatting
  # ==========================================================================

  Rule: Summary can be formatted for console output

    @happy-path
    Scenario: Empty summary shows no completed phases message
      Given an empty DoD validation summary
      When formatting the DoD summary
      Then the output shows the summary header
      And the output shows zero phases validated
      And the output shows no completed phases message

    @happy-path
    Scenario: Summary with passed phases shows details
      Given a DoD validation summary with:
        | pattern   | phase | passed | deliverable_count |
        | PatternA  | 10    | true   | 3                 |
        | PatternB  | 11    | true   | 2                 |
      When formatting the DoD summary
      Then the output shows 2 passed and 0 failed
      And the output shows passed phase details

    @happy-path
    Scenario: Summary with failed phases shows details
      Given a DoD validation summary with failures:
        | pattern   | phase | message                          |
        | PatternA  | 10    | 1/2 deliverables incomplete      |
        | PatternB  | 11    | No @acceptance-criteria scenarios found |
      When formatting the DoD summary
      Then the output shows 2 failed phases
      And the output shows failed phase details with messages
