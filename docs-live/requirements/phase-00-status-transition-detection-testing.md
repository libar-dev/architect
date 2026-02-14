# ✅ Status Transition Detection Testing

**Purpose:** Detailed requirements for the Status Transition Detection Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Validation |

## Description

Tests for the detectStatusTransitions function that parses git diff output.
  Verifies that status tags inside docstrings are ignored and only file-level
  tags are used for FSM transition validation.

## Acceptance Criteria

**New file with status tag is detected as transition from roadmap**

- Given a git diff for new file "specs/new.feature" with status "active"
- When detecting status transitions
- Then a transition is detected for "specs/new.feature"
- And the transition is from "roadmap" to "active"
- And the transition is marked as new file

**Modified file with status change is detected**

- Given a git diff for modified file "specs/existing.feature" changing from "roadmap" to "active"
- When detecting status transitions
- Then a transition is detected for "specs/existing.feature"
- And the transition is from "roadmap" to "active"
- And the transition is not marked as new file

**No transition when status unchanged**

- Given a git diff for modified file "specs/unchanged.feature" with same status "active"
- When detecting status transitions
- Then no transition is detected for "specs/unchanged.feature"

**Status tag inside docstring is not used for transition**

- Given a git diff for new file "specs/test.feature" with:
- When detecting status transitions
- Then a transition is detected for "specs/test.feature"
- And the transition is from "roadmap" to "active"
- And the transition location is at line 2

| line | content |
| --- | --- |
| 2 | @libar-docs-status:active |
| 10 | """ |
| 11 | @libar-docs-status:completed |
| 12 | """ |

**Multiple docstring status tags are all ignored**

- Given a git diff for new file "specs/multi-docstring.feature" with:
- When detecting status transitions
- Then a transition is detected for "specs/multi-docstring.feature"
- And the transition is from "roadmap" to "active"
- And the all-detected-tags list has 3 entries

| line | content |
| --- | --- |
| 2 | @libar-docs-status:active |
| 15 | """ |
| 16 | @libar-docs-status:roadmap |
| 17 | """ |
| 30 | """ |
| 31 | @libar-docs-status:completed |
| 32 | """ |

**Only docstring status tags results in no transition**

- Given a git diff for new file "specs/only-docstring.feature" with:
- When detecting status transitions
- Then no transition is detected for "specs/only-docstring.feature"

| line | content |
| --- | --- |
| 5 | """ |
| 6 | @libar-docs-status:active |
| 7 | """ |

**First file-level tag wins over subsequent tags**

- Given a git diff for new file "specs/multi-tag.feature" with:
- When detecting status transitions
- Then a transition is detected for "specs/multi-tag.feature"
- And the transition is from "roadmap" to "active"
- And the transition location is at line 2

| line | content |
| --- | --- |
| 2 | @libar-docs-status:active |
| 50 | @libar-docs-status:completed |

**Transition location includes correct line number**

- Given a git diff for new file "specs/line-tracking.feature" starting at line 5 with status "active"
- When detecting status transitions
- Then a transition is detected for "specs/line-tracking.feature"
- And the transition location is at line 5

**Status in docs-generated directory is ignored**

- Given a git diff for new file "docs-generated/patterns.md" with status "completed"
- When detecting status transitions
- Then no transition is detected for "docs-generated/patterns.md"

**Status in docs-living directory is ignored**

- Given a git diff for new file "docs-living/roadmap.md" with status "active"
- When detecting status transitions
- Then no transition is detected for "docs-living/roadmap.md"

## Business Rules

**Status transitions are detected from file-level tags**

_Verified by: New file with status tag is detected as transition from roadmap, Modified file with status change is detected, No transition when status unchanged_

**Status tags inside docstrings are ignored**

_Verified by: Status tag inside docstring is not used for transition, Multiple docstring status tags are all ignored, Only docstring status tags results in no transition_

**First valid status tag outside docstrings is used**

_Verified by: First file-level tag wins over subsequent tags_

**Line numbers are tracked from hunk headers**

_Verified by: Transition location includes correct line number_

**Generated documentation directories are excluded**

_Verified by: Status in docs-generated directory is ignored, Status in docs-living directory is ignored_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
