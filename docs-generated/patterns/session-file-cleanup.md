# 📋 Session File Cleanup

**Purpose:** Detailed documentation for the Session File Cleanup pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |
| Phase | 100 |

## Description

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

## Acceptance Criteria

**Cleanup runs after generating session files**

- Given session files exist for phases 31 and 33
- And only phase 33 is currently active
- When generating session context
- Then session file for phase 31 is deleted
- And session file for phase 33 is preserved
- And log message indicates "Cleaned up orphaned session file: sessions/phase-31.md"

**Non-session files are preserved**

- Given sessions/ directory contains:
- When cleanup runs
- Then only phase-31.md is deleted
- And .gitkeep is preserved
- And notes.md is preserved

| File | Type |
| --- | --- |
| phase-31.md | orphaned session |
| .gitkeep | infrastructure |
| notes.md | manual notes |

**Permission error during cleanup**

- Given orphaned session file with restricted permissions
- When cleanup attempts to delete the file
- Then warning is logged "Failed to cleanup session/phase-31.md: Permission denied"
- And generation continues successfully
- And exit code is 0 (not failure)

**Missing sessions directory**

- Given sessions/ directory does not exist
- When cleanup runs
- Then no error is thrown
- And cleanup is skipped gracefully

## Business Rules

**Cleanup triggers during session-context generation**

_Verified by: Cleanup runs after generating session files_

**Only phase-*.md files are candidates for cleanup**

_Verified by: Non-session files are preserved_

**Cleanup failures are non-fatal**

_Verified by: Permission error during cleanup, Missing sessions directory_

---

[← Back to Pattern Registry](../PATTERNS.md)
