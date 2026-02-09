# 📋 Streaming Git Diff

**Purpose:** Detailed requirements for the Streaming Git Diff feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Product Area | DeliveryProcess |
| Business Value | enable process guard on large repositories |
| Phase | 99 |

## Description

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

## Acceptance Criteria

**Large diff does not cause memory overflow**

- Given a repository with 500+ changed files since main
- And total diff size exceeds 10MB
- When running "lint-process --all"
- Then command completes without ENOBUFS error
- And memory usage stays below 50MB

**Streaming produces same results as buffered**

- Given a repository with known status transitions
- When comparing streaming vs buffered implementation
- Then detected status transitions are identical
- And detected deliverable changes are identical

**Status transitions detected incrementally**

- Given a streaming diff with status changes in multiple files
- When processing the stream line-by-line
- Then status transitions are detected as each file section completes
- And results accumulate into final ChangeDetection structure

**Deliverable changes detected incrementally**

- Given a streaming diff with DataTable modifications
- When processing the stream line-by-line
- Then deliverable additions and removals are tracked per file
- And correlation (modification detection) happens at end of file section

**Git command failure returns Result error**

- Given git command exits with non-zero code
- When stream processing completes
- Then Result.err is returned with error message
- And partial results are discarded

**Malformed diff lines are skipped**

- Given a diff stream with unexpected line format
- When parsing encounters malformed line
- Then line is skipped without throwing
- And processing continues with next line

## Business Rules

**Git commands stream output instead of buffering**

_Verified by: Large diff does not cause memory overflow, Streaming produces same results as buffered_

**Diff content is parsed as it streams**

_Verified by: Status transitions detected incrementally, Deliverable changes detected incrementally_

**Streaming errors are handled gracefully**

_Verified by: Git command failure returns Result error, Malformed diff lines are skipped_

## Deliverables

- Streaming git execution utility (pending)
- Line-by-line diff parser (pending)
- Async detectBranchChanges (pending)
- Async detectStagedChanges (pending)
- Integration with existing CLI (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
