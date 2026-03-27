@architect
@architect-pattern:SessionFileLifecycle
@architect-status:completed
@architect-unlock-reason:Add-process-workflow-include-tag
@architect-product-area:Process
@architect-include:process-workflow
@behavior @session-lifecycle
Feature: Session File Lifecycle Management
  Orphaned session files are automatically cleaned up during generation,
  maintaining a clean docs-living/sessions/ directory.

  **Problem:**
  - Session files for completed phases become orphaned and show stale data
  - Manual cleanup is error-prone and easily forgotten
  - Stale session files mislead LLMs reading docs-living/ for context
  - No tracking of which files were cleaned up during generation
  - Accumulating orphaned files clutter the sessions directory over time

  **Solution:**
  - DELETE strategy removes orphaned files during session-context generation
  - Only active phase session files are preserved and regenerated
  - COMPLETED-MILESTONES.md serves as authoritative history (no session files needed)
  - Generator output tracks deleted files for transparency and debugging
  - Cleanup is idempotent and handles edge cases (missing dirs, empty state)

  Background: Session lifecycle test context
    Given a temporary output directory with sessions subdirectory

  Rule: Orphaned session files are removed during generation

      **Invariant:** Only session files for active phases are preserved; all other phase files must be deleted during cleanup and replaced with fresh content.
      **Rationale:** Stale session files for completed or deferred phases mislead LLMs that read the sessions directory for context, causing incorrect planning decisions.

      **Verified by:** Orphaned session files are deleted during generation, Active phase session files are preserved and regenerated

    @happy-path @cleanup
    Scenario: Orphaned session files are deleted during generation
      Given existing session files for phases 8, 9, and 31
      And patterns with only phase 42 as active
      When generating session-context output with cleanup
      Then phase-42.md should exist in sessions directory
      And phase-8.md should not exist in sessions directory
      And phase-9.md should not exist in sessions directory
      And phase-31.md should not exist in sessions directory

    @happy-path @preserve
    Scenario: Active phase session files are preserved and regenerated
      Given an existing session file for phase 42 with stale content
      And patterns with phase 42 as active
      When generating session-context output with cleanup
      Then phase-42.md should exist in sessions directory
      And phase-42.md should have fresh content

  Rule: Cleanup handles edge cases without errors

      **Invariant:** Cleanup must be idempotent, tolerate missing directories, and produce empty results when no phases are active.

      **Rationale:** Generator runs are not guarded by precondition checks for directory existence. Cleanup must never crash regardless of filesystem state.

      **Verified by:** No active phases results in empty sessions directory, Cleanup is idempotent, Missing sessions directory is handled gracefully

    @edge-case @no-active
    Scenario: No active phases results in empty sessions directory
      Given existing session files for phases 8 and 9
      And patterns with no active phases
      When generating session-context output with cleanup
      Then phase-8.md should not exist in sessions directory
      And phase-9.md should not exist in sessions directory

    @edge-case @idempotent
    Scenario: Cleanup is idempotent
      Given an empty sessions directory
      And patterns with no active phases
      When generating session-context output with cleanup multiple times
      Then no errors should occur
      And sessions directory should remain empty

    @edge-case @missing-dir
    Scenario: Missing sessions directory is handled gracefully
      Given no sessions directory exists
      And patterns with no active phases
      When generating session-context output with cleanup
      Then no errors should occur

  Rule: Deleted files are tracked in cleanup results

      **Invariant:** The cleanup result must include the relative paths of all deleted session files for transparency and debugging.
      **Rationale:** Without deletion tracking, operators cannot audit what the generator removed, making it impossible to diagnose missing file issues after a run.

      **Verified by:** Deleted files are tracked in generator output

    @tracking @deleted-files
    Scenario: Deleted files are tracked in generator output
      Given existing session files for phases 8 and 31
      And patterns with no active phases
      When generating session-context output with cleanup
      Then the generator output should include files to delete
      And the files to delete should include "sessions/phase-8.md"
      And the files to delete should include "sessions/phase-31.md"
