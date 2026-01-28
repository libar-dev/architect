@libar-docs
@libar-docs-pattern:StreamingGitDiff
@libar-docs-status:roadmap
@libar-docs-phase:99
@libar-docs-effort:2d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:enable-process-guard-on-large-repositories
@libar-docs-priority:high
@libar-docs-depends-on:ProcessGuardLinter
Feature: Streaming Git Diff for Process Guard

  **Problem:**
  The process guard (`lint-process --all`) fails with `ENOBUFS` error on large
  repositories. The current implementation uses `execSync` which buffers the
  entire `git diff` output in memory. When comparing against `main` in repos
  with hundreds of changed files, the diff output can exceed Node.js buffer
  limits (~1MB default), causing the pipe to overflow.

  This prevents using `--all` mode in CI/CD pipelines for production repositories.

  **Solution:**
  Replace synchronous buffered git execution with streaming approach:

  1. Use `spawn` instead of `execSync` for git diff commands
  2. Process diff output line-by-line as it streams
  3. Extract status transitions and deliverable changes incrementally
  4. Never hold full diff content in memory

  **Design Principles:**
  - Constant memory usage regardless of diff size
  - Same validation results as current implementation
  - Backward compatible - no CLI changes required
  - Async/await API for streaming operations

  **Scope:**
  Only `detect-changes.ts` requires modification. The `deriveProcessState`
  and validation logic remain unchanged - they receive the same data structures.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable                          | Status  | Location                                    |
      | Streaming git execution utility      | Planned | src/lint/process-guard/git-stream.ts        |
      | Line-by-line diff parser             | Planned | src/lint/process-guard/diff-parser.ts       |
      | Async detectBranchChanges            | Planned | src/lint/process-guard/detect-changes.ts    |
      | Async detectStagedChanges            | Planned | src/lint/process-guard/detect-changes.ts    |
      | Integration with existing CLI        | Planned | src/cli/lint-process.ts                     |

  # ============================================================================
  # STREAMING EXECUTION
  # ============================================================================

  Rule: Git commands stream output instead of buffering

    @acceptance-criteria
    Scenario: Large diff does not cause memory overflow
      Given a repository with 500+ changed files since main
      And total diff size exceeds 10MB
      When running "lint-process --all"
      Then command completes without ENOBUFS error
      And memory usage stays below 50MB

    @acceptance-criteria
    Scenario: Streaming produces same results as buffered
      Given a repository with known status transitions
      When comparing streaming vs buffered implementation
      Then detected status transitions are identical
      And detected deliverable changes are identical

  # ============================================================================
  # INCREMENTAL PARSING
  # ============================================================================

  Rule: Diff content is parsed as it streams

    @acceptance-criteria
    Scenario: Status transitions detected incrementally
      Given a streaming diff with status changes in multiple files
      When processing the stream line-by-line
      Then status transitions are detected as each file section completes
      And results accumulate into final ChangeDetection structure

    @acceptance-criteria
    Scenario: Deliverable changes detected incrementally
      Given a streaming diff with DataTable modifications
      When processing the stream line-by-line
      Then deliverable additions and removals are tracked per file
      And correlation (modification detection) happens at end of file section

  # ============================================================================
  # ERROR HANDLING
  # ============================================================================

  Rule: Streaming errors are handled gracefully

    @acceptance-criteria
    Scenario: Git command failure returns Result error
      Given git command exits with non-zero code
      When stream processing completes
      Then Result.err is returned with error message
      And partial results are discarded

    @acceptance-criteria
    Scenario: Malformed diff lines are skipped
      Given a diff stream with unexpected line format
      When parsing encounters malformed line
      Then line is skipped without throwing
      And processing continues with next line
