@libar-docs
@behavior @detect-changes @libar-docs-pattern:DetectChangesTesting
@libar-docs-implements:DetectChanges
@libar-docs-status:completed
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

    **Invariant:** When a deliverable's status value changes between versions, the change detector must classify it as a modification, not an addition or removal.
    **Rationale:** Correct change classification drives scope-creep detection — misclassifying a status change as an addition would trigger false scope-creep violations on active specs.
    **Verified by:** Single deliverable status change is detected as modification, Multiple deliverable status changes are all modifications

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

    **Invariant:** Deliverables present in the new version but absent in the old version must be classified as additions.
    **Rationale:** Addition detection powers the scope-creep rule — new deliverables added to active specs must be flagged as violations.
    **Verified by:** New deliverable is detected as addition

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

    **Invariant:** Deliverables present in the old version but absent in the new version must be classified as removals.
    **Rationale:** Removal detection enables the deliverable-removed warning — silently dropping deliverables could hide incomplete work.
    **Verified by:** Removed deliverable is detected as removal

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

    **Invariant:** When a single diff contains additions, removals, and modifications simultaneously, each change must be independently categorized.
    **Rationale:** Real-world commits often contain mixed changes — incorrect categorization of any single change cascades into wrong validation decisions.
    **Verified by:** Mixed additions, removals, and modifications are handled correctly

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

  # ==========================================================================
  # Non-Deliverable Table Filtering
  # ==========================================================================

  Rule: Non-deliverable tables are ignored

    **Invariant:** Changes to non-deliverable tables (e.g., ScenarioOutline Examples tables) must not be detected as deliverable changes.
    **Rationale:** Feature files contain many table structures — only the Background deliverables table is semantically relevant to process guard validation.
    **Verified by:** Changes in Examples tables are not detected as deliverable changes

    @edge-case
    Scenario: Changes in Examples tables are not detected as deliverable changes
      Given a git diff with changes only in an Examples table
      When detecting deliverable changes
      Then no deliverables are detected
