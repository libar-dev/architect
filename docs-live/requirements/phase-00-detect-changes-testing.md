# ✅ Detect Changes Testing

**Purpose:** Detailed requirements for the Detect Changes Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

Tests for the detectDeliverableChanges function that parses git diff output.
Verifies that status changes are correctly identified as modifications,
not as additions or removals.

## Acceptance Criteria

**Single deliverable status change is detected as modification**

- Given a git diff with deliverable "Type definitions" changed from "planned" to "completed"
- When detecting deliverable changes
- Then the deliverable "Type definitions" is in the "modified" list
- And the deliverable "Type definitions" is not in the "added" list
- And the deliverable "Type definitions" is not in the "removed" list

**Multiple deliverable status changes are all modifications**

- Given a git diff with deliverables "Type definitions" and "Unit tests" both changing status
- When detecting deliverable changes
- Then the deliverable "Type definitions" is in the "modified" list
- And the deliverable "Unit tests" is in the "modified" list
- And no deliverables are in the "added" list
- And no deliverables are in the "removed" list

**New deliverable is detected as addition**

- Given a git diff with new deliverable "New feature" added
- When detecting deliverable changes
- Then the deliverable "New feature" is in the "added" list
- And the deliverable "New feature" is not in the "modified" list
- And the deliverable "New feature" is not in the "removed" list

**Removed deliverable is detected as removal**

- Given a git diff with deliverable "Deprecated feature" removed
- When detecting deliverable changes
- Then the deliverable "Deprecated feature" is in the "removed" list
- And the deliverable "Deprecated feature" is not in the "modified" list
- And the deliverable "Deprecated feature" is not in the "added" list

**Mixed additions, removals, and modifications are handled correctly**

- Given a git diff with:
- When detecting deliverable changes
- Then the deliverable "Existing feature" is in the "modified" list
- And the deliverable "New feature" is in the "added" list
- And the deliverable "Old feature" is in the "removed" list

| change_type   | deliverable      |
| ------------- | ---------------- |
| status_change | Existing feature |
| added         | New feature      |
| removed       | Old feature      |

**Changes in Examples tables are not detected as deliverable changes**

- Given a git diff with changes only in an Examples table
- When detecting deliverable changes
- Then no deliverables are detected

## Business Rules

**Status changes are detected as modifications not additions**

_Verified by: Single deliverable status change is detected as modification, Multiple deliverable status changes are all modifications_

**New deliverables are detected as additions**

_Verified by: New deliverable is detected as addition_

**Removed deliverables are detected as removals**

_Verified by: Removed deliverable is detected as removal_

**Mixed changes are correctly categorized**

_Verified by: Mixed additions, removals, and modifications are handled correctly_

**Non-deliverable tables are ignored**

_Verified by: Changes in Examples tables are not detected as deliverable changes_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
