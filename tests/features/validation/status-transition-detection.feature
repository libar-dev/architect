@architect
@behavior @status-transitions @architect-pattern:StatusTransitionDetectionTesting
@architect-implements:DetectChanges
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Validation
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

    **Invariant:** Status transitions must be detected by comparing @architect-status tags at the file level between the old and new versions of a file.
    **Rationale:** File-level tags are the canonical source of pattern status — detecting transitions from tags ensures consistency with the FSM validator.
    **Verified by:** New file with status tag is detected as transition from roadmap, Modified file with status change is detected, No transition when status unchanged

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

    **Invariant:** Status tags appearing inside Gherkin docstring blocks (between triple-quote delimiters) must not be treated as real status declarations.
    **Rationale:** Docstrings often contain example code or documentation showing status tags — parsing these as real would cause phantom status transitions.
    **Verified by:** Status tag inside docstring is not used for transition, Multiple docstring status tags are all ignored, Only docstring status tags results in no transition

    @happy-path
    Scenario: Status tag inside docstring is not used for transition
      Given a git diff for new file "specs/test.feature" with:
        | line | content                           |
        | 2    | @architect-status:active         |
        | 10   | """                               |
        | 11   | @architect-status:completed      |
        | 12   | """                               |
      When detecting status transitions
      Then a transition is detected for "specs/test.feature"
      And the transition is from "roadmap" to "active"
      And the transition location is at line 2

    @happy-path
    Scenario: Multiple docstring status tags are all ignored
      Given a git diff for new file "specs/multi-docstring.feature" with:
        | line | content                           |
        | 2    | @architect-status:active         |
        | 15   | """                               |
        | 16   | @architect-status:roadmap        |
        | 17   | """                               |
        | 30   | """                               |
        | 31   | @architect-status:completed      |
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
        | 6    | @architect-status:active         |
        | 7    | """                               |
      When detecting status transitions
      Then no transition is detected for "specs/only-docstring.feature"

  # ==========================================================================
  # First Tag Wins
  # ==========================================================================

  Rule: First valid status tag outside docstrings is used

    **Invariant:** When multiple status tags appear outside docstrings, only the first one determines the file's status.
    **Rationale:** A single canonical status per file prevents ambiguity — using the first tag matches Gherkin convention where file-level tags appear at the top.
    **Verified by:** First file-level tag wins over subsequent tags

    @happy-path
    Scenario: First file-level tag wins over subsequent tags
      Given a git diff for new file "specs/multi-tag.feature" with:
        | line | content                           |
        | 2    | @architect-status:active         |
        | 50   | @architect-status:completed      |
      When detecting status transitions
      Then a transition is detected for "specs/multi-tag.feature"
      And the transition is from "roadmap" to "active"
      And the transition location is at line 2

  # ==========================================================================
  # Line Number Tracking
  # ==========================================================================

  Rule: Line numbers are tracked from hunk headers

    **Invariant:** Detected status transitions must include the line number where the status tag appears, derived from git diff hunk headers.
    **Rationale:** Line numbers enable precise error reporting — developers need to know exactly where in the file the transition was detected.
    **Verified by:** Transition location includes correct line number

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

    **Invariant:** Files in generated documentation directories (docs-generated/, docs-living/) must be excluded from status transition detection.
    **Rationale:** Generated files are projections of source files — detecting transitions in them would produce duplicate violations and false positives.
    **Verified by:** Status in docs-generated directory is ignored, Status in docs-living directory is ignored

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
