@libar-docs
@libar-docs-pattern:SessionFileCleanup
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:2h
@libar-docs-product-area:Process
@libar-docs-include:process-workflow
@libar-docs-depends-on:SessionFileLifecycle
@libar-docs-business-value:ensure-session-directory-only-contains-active-phase-files
@libar-docs-priority:low
Feature: Session File Cleanup Behavior

  **Problem:**
  Session files (docs-living/sessions/phase-*.md) are ephemeral working
  documents for active phases. When phases complete or are paused, orphaned
  session files should be cleaned up. The cleanup behavior is documented
  but not specified with acceptance criteria.

  **Solution:**
  Formalize cleanup behavior with specifications covering:
  - When cleanup triggers
  - What files are deleted vs preserved
  - Error handling
  - Logging/notification of cleanup actions

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Cleanup trigger integration | pending | Yes | @libar-dev/delivery-process/src/generators/ |
      | File pattern matching | pending | Yes | @libar-dev/delivery-process/src/utils/ |
      | Error handling | pending | Yes | @libar-dev/delivery-process/src/utils/ |
      | Cleanup logging | pending | Yes | @libar-dev/delivery-process/src/utils/ |

  Rule: Cleanup triggers during session-context generation

    **Invariant:** Orphaned session files for inactive phases must be removed during session-context generation.
    **Rationale:** Stale session files mislead developers into thinking a phase is still active, causing wasted effort on completed or paused work.

    @acceptance-criteria
    Scenario: Cleanup runs after generating session files
      Given session files exist for phases 31 and 33
      And only phase 33 is currently active
      When generating session context
      Then session file for phase 31 is deleted
      And session file for phase 33 is preserved
      And log message indicates "Cleaned up orphaned session file: sessions/phase-31.md"

  Rule: Only phase-*.md files are candidates for cleanup

    **Invariant:** Cleanup must only target files matching the `phase-*.md` naming convention.
    **Rationale:** Deleting non-session files (infrastructure files, manual notes) would destroy user content that cannot be regenerated.

    @acceptance-criteria
    Scenario: Non-session files are preserved
      Given sessions/ directory contains:
        | File              | Type              |
        | phase-31.md       | orphaned session  |
        | .gitkeep          | infrastructure    |
        | notes.md          | manual notes      |
      When cleanup runs
      Then only phase-31.md is deleted
      And .gitkeep is preserved
      And notes.md is preserved

  Rule: Cleanup failures are non-fatal

    **Invariant:** A cleanup failure must never prevent session-context generation from completing successfully.
    **Rationale:** Cleanup is a housekeeping side-effect; blocking the primary generation workflow on a file-system error would break the developer's session for a non-critical concern.

    @acceptance-criteria
    Scenario: Permission error during cleanup
      Given orphaned session file with restricted permissions
      When cleanup attempts to delete the file
      Then warning is logged "Failed to cleanup session/phase-31.md: Permission denied"
      And generation continues successfully
      And exit code is 0 (not failure)

    @acceptance-criteria
    Scenario: Missing sessions directory
      Given sessions/ directory does not exist
      When cleanup runs
      Then no error is thrown
      And cleanup is skipped gracefully
