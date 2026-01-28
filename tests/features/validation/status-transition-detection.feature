@behavior @status-transitions @libar-docs-pattern:DetectChanges
@libar-docs-product-area:Validation
Feature: Status Transition Detection from Git Diff
  Tests for the detectStatusTransitions function that parses git diff output.
  Verifies that status tags inside docstrings are ignored and only file-level
  tags are used for FSM transition validation.

  Background:
    Given a status transition test context

  # ==========================================================================
  # Basic Status Detection
  # ==========================================================================

  Rule: Status transitions are detected from file-level tags

    @happy-path
    Scenario: New file with status tag is detected as transition from roadmap
      Given a git diff for new file "specs/new.feature" with status "active"
      When detecting status transitions
      Then a transition is detected for "specs/new.feature"
      And the transition is from "roadmap" to "active"
      And the transition is marked as new file

    @happy-path
    Scenario: Modified file with status change is detected
      Given a git diff for modified file "specs/existing.feature" changing from "roadmap" to "active"
      When detecting status transitions
      Then a transition is detected for "specs/existing.feature"
      And the transition is from "roadmap" to "active"
      And the transition is not marked as new file

    @edge-case
    Scenario: No transition when status unchanged
      Given a git diff for modified file "specs/unchanged.feature" with same status "active"
      When detecting status transitions
      Then no transition is detected for "specs/unchanged.feature"

  # ==========================================================================
  # Docstring Awareness
  # ==========================================================================

  Rule: Status tags inside docstrings are ignored

    @happy-path
    Scenario: Status tag inside docstring is not used for transition
      Given a git diff for new file "specs/test.feature" with:
        | line | content                           |
        | 2    | @libar-docs-status:active         |
        | 10   | """                               |
        | 11   | @libar-docs-status:completed      |
        | 12   | """                               |
      When detecting status transitions
      Then a transition is detected for "specs/test.feature"
      And the transition is from "roadmap" to "active"
      And the transition location is at line 2

    @happy-path
    Scenario: Multiple docstring status tags are all ignored
      Given a git diff for new file "specs/multi-docstring.feature" with:
        | line | content                           |
        | 2    | @libar-docs-status:active         |
        | 15   | """                               |
        | 16   | @libar-docs-status:roadmap        |
        | 17   | """                               |
        | 30   | """                               |
        | 31   | @libar-docs-status:completed      |
        | 32   | """                               |
      When detecting status transitions
      Then a transition is detected for "specs/multi-docstring.feature"
      And the transition is from "roadmap" to "active"
      And the all-detected-tags list has 3 entries

    @edge-case
    Scenario: Only docstring status tags results in no transition
      Given a git diff for new file "specs/only-docstring.feature" with:
        | line | content                           |
        | 5    | """                               |
        | 6    | @libar-docs-status:active         |
        | 7    | """                               |
      When detecting status transitions
      Then no transition is detected for "specs/only-docstring.feature"

  # ==========================================================================
  # First Tag Wins
  # ==========================================================================

  Rule: First valid status tag outside docstrings is used

    @happy-path
    Scenario: First file-level tag wins over subsequent tags
      Given a git diff for new file "specs/multi-tag.feature" with:
        | line | content                           |
        | 2    | @libar-docs-status:active         |
        | 50   | @libar-docs-status:completed      |
      When detecting status transitions
      Then a transition is detected for "specs/multi-tag.feature"
      And the transition is from "roadmap" to "active"
      And the transition location is at line 2

  # ==========================================================================
  # Line Number Tracking
  # ==========================================================================

  Rule: Line numbers are tracked from hunk headers

    @happy-path
    Scenario: Transition location includes correct line number
      Given a git diff for new file "specs/line-tracking.feature" starting at line 5 with status "active"
      When detecting status transitions
      Then a transition is detected for "specs/line-tracking.feature"
      And the transition location is at line 5

  # ==========================================================================
  # Generated Docs Filtering
  # ==========================================================================

  Rule: Generated documentation directories are excluded

    @edge-case
    Scenario: Status in docs-generated directory is ignored
      Given a git diff for new file "docs-generated/patterns.md" with status "completed"
      When detecting status transitions
      Then no transition is detected for "docs-generated/patterns.md"

    @edge-case
    Scenario: Status in docs-living directory is ignored
      Given a git diff for new file "docs-living/roadmap.md" with status "active"
      When detecting status transitions
      Then no transition is detected for "docs-living/roadmap.md"
