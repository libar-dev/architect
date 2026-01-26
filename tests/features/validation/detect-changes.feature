@behavior @detect-changes @libar-docs-pattern:DetectChanges
@libar-docs-product-area:Validation
Feature: Deliverable Change Detection from Git Diff
  Tests for the detectDeliverableChanges function that parses git diff output.
  Verifies that status changes are correctly identified as modifications,
  not as additions or removals.

  Background:
    Given a detect changes test context

  # ==========================================================================
  # Modification Detection (Status Changes)
  # ==========================================================================

  Rule: Status changes are detected as modifications not additions

    @happy-path
    Scenario: Single deliverable status change is detected as modification
      Given a git diff with deliverable "Type definitions" changed from "planned" to "completed"
      When detecting deliverable changes
      Then the deliverable "Type definitions" is in the "modified" list
      And the deliverable "Type definitions" is not in the "added" list
      And the deliverable "Type definitions" is not in the "removed" list

    @happy-path
    Scenario: Multiple deliverable status changes are all modifications
      Given a git diff with deliverables "Type definitions" and "Unit tests" both changing status
      When detecting deliverable changes
      Then the deliverable "Type definitions" is in the "modified" list
      And the deliverable "Unit tests" is in the "modified" list
      And no deliverables are in the "added" list
      And no deliverables are in the "removed" list

  # ==========================================================================
  # Addition Detection (New Deliverables)
  # ==========================================================================

  Rule: New deliverables are detected as additions

    @happy-path
    Scenario: New deliverable is detected as addition
      Given a git diff with new deliverable "New feature" added
      When detecting deliverable changes
      Then the deliverable "New feature" is in the "added" list
      And the deliverable "New feature" is not in the "modified" list
      And the deliverable "New feature" is not in the "removed" list

  # ==========================================================================
  # Removal Detection (Deleted Deliverables)
  # ==========================================================================

  Rule: Removed deliverables are detected as removals

    @happy-path
    Scenario: Removed deliverable is detected as removal
      Given a git diff with deliverable "Deprecated feature" removed
      When detecting deliverable changes
      Then the deliverable "Deprecated feature" is in the "removed" list
      And the deliverable "Deprecated feature" is not in the "modified" list
      And the deliverable "Deprecated feature" is not in the "added" list

  # ==========================================================================
  # Mixed Changes
  # ==========================================================================

  Rule: Mixed changes are correctly categorized

    @integration
    Scenario: Mixed additions, removals, and modifications are handled correctly
      Given a git diff with:
        | change_type  | deliverable         |
        | status_change | Existing feature   |
        | added        | New feature         |
        | removed      | Old feature         |
      When detecting deliverable changes
      Then the deliverable "Existing feature" is in the "modified" list
      And the deliverable "New feature" is in the "added" list
      And the deliverable "Old feature" is in the "removed" list
