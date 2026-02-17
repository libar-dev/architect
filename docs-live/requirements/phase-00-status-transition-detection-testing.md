# ✅ Status Transition Detection Testing

**Purpose:** Detailed requirements for the Status Transition Detection Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
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

| line | content                      |
| ---- | ---------------------------- |
| 2    | @libar-docs-status:active    |
| 10   | """                          |
| 11   | @libar-docs-status:completed |
| 12   | """                          |

**Multiple docstring status tags are all ignored**

- Given a git diff for new file "specs/multi-docstring.feature" with:
- When detecting status transitions
- Then a transition is detected for "specs/multi-docstring.feature"
- And the transition is from "roadmap" to "active"
- And the all-detected-tags list has 3 entries

| line | content                      |
| ---- | ---------------------------- |
| 2    | @libar-docs-status:active    |
| 15   | """                          |
| 16   | @libar-docs-status:roadmap   |
| 17   | """                          |
| 30   | """                          |
| 31   | @libar-docs-status:completed |
| 32   | """                          |

**Only docstring status tags results in no transition**

- Given a git diff for new file "specs/only-docstring.feature" with:
- When detecting status transitions
- Then no transition is detected for "specs/only-docstring.feature"

| line | content                   |
| ---- | ------------------------- |
| 5    | """                       |
| 6    | @libar-docs-status:active |
| 7    | """                       |

**First file-level tag wins over subsequent tags**

- Given a git diff for new file "specs/multi-tag.feature" with:
- When detecting status transitions
- Then a transition is detected for "specs/multi-tag.feature"
- And the transition is from "roadmap" to "active"
- And the transition location is at line 2

| line | content                      |
| ---- | ---------------------------- |
| 2    | @libar-docs-status:active    |
| 50   | @libar-docs-status:completed |

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

**Invariant:** Status transitions must be detected by comparing @libar-docs-status tags at the file level between the old and new versions of a file.
**Rationale:** File-level tags are the canonical source of pattern status — detecting transitions from tags ensures consistency with the FSM validator.
**Verified by:** New file with status tag is detected as transition from roadmap, Modified file with status change is detected, No transition when status unchanged

_Verified by: New file with status tag is detected as transition from roadmap, Modified file with status change is detected, No transition when status unchanged_

**Status tags inside docstrings are ignored**

**Invariant:** Status tags appearing inside Gherkin docstring blocks (between triple-quote delimiters) must not be treated as real status declarations.
**Rationale:** Docstrings often contain example code or documentation showing status tags — parsing these as real would cause phantom status transitions.
**Verified by:** Status tag inside docstring is not used for transition, Multiple docstring status tags are all ignored, Only docstring status tags results in no transition

_Verified by: Status tag inside docstring is not used for transition, Multiple docstring status tags are all ignored, Only docstring status tags results in no transition_

**First valid status tag outside docstrings is used**

**Invariant:** When multiple status tags appear outside docstrings, only the first one determines the file's status.
**Rationale:** A single canonical status per file prevents ambiguity — using the first tag matches Gherkin convention where file-level tags appear at the top.
**Verified by:** First file-level tag wins over subsequent tags

_Verified by: First file-level tag wins over subsequent tags_

**Line numbers are tracked from hunk headers**

**Invariant:** Detected status transitions must include the line number where the status tag appears, derived from git diff hunk headers.
**Rationale:** Line numbers enable precise error reporting — developers need to know exactly where in the file the transition was detected.
**Verified by:** Transition location includes correct line number

_Verified by: Transition location includes correct line number_

**Generated documentation directories are excluded**

**Invariant:** Files in generated documentation directories (docs-generated/, docs-living/) must be excluded from status transition detection.
**Rationale:** Generated files are projections of source files — detecting transitions in them would produce duplicate violations and false positives.
**Verified by:** Status in docs-generated directory is ignored, Status in docs-living directory is ignored

_Verified by: Status in docs-generated directory is ignored, Status in docs-living directory is ignored_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
