# ✅ Session File Lifecycle

**Purpose:** Detailed requirements for the Session File Lifecycle feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Process   |

## Description

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

## Acceptance Criteria

**Orphaned session files are deleted during generation**

- Given existing session files for phases 8, 9, and 31
- And patterns with only phase 42 as active
- When generating session-context output with cleanup
- Then phase-42.md should exist in sessions directory
- And phase-8.md should not exist in sessions directory
- And phase-9.md should not exist in sessions directory
- And phase-31.md should not exist in sessions directory

**Active phase session files are preserved and regenerated**

- Given an existing session file for phase 42 with stale content
- And patterns with phase 42 as active
- When generating session-context output with cleanup
- Then phase-42.md should exist in sessions directory
- And phase-42.md should have fresh content

**No active phases results in empty sessions directory**

- Given existing session files for phases 8 and 9
- And patterns with no active phases
- When generating session-context output with cleanup
- Then phase-8.md should not exist in sessions directory
- And phase-9.md should not exist in sessions directory

**Cleanup is idempotent**

- Given an empty sessions directory
- And patterns with no active phases
- When generating session-context output with cleanup multiple times
- Then no errors should occur
- And sessions directory should remain empty

**Missing sessions directory is handled gracefully**

- Given no sessions directory exists
- And patterns with no active phases
- When generating session-context output with cleanup
- Then no errors should occur

**Deleted files are tracked in generator output**

- Given existing session files for phases 8 and 31
- And patterns with no active phases
- When generating session-context output with cleanup
- Then the generator output should include files to delete
- And the files to delete should include "sessions/phase-8.md"
- And the files to delete should include "sessions/phase-31.md"

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
