# ✅ Lint Rule Individual Testing

**Purpose:** Detailed requirements for the Lint Rule Individual Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

Individual lint rules that check parsed directives for completeness.
Tests presence/absence checks: pattern name, status, whenToUse, and relationships.

## Acceptance Criteria

**Detect missing pattern name**

- Given a directive without patternName
- When I apply the missing-pattern-name rule
- Then a violation should be detected
- And the violation severity should be "error"
- And the violation message should contain "Pattern missing explicit name"

**Detect empty string pattern name**

- Given a directive with patternName ""
- When I apply the missing-pattern-name rule
- Then a violation should be detected
- And the violation severity should be "error"

**Detect whitespace-only pattern name**

- Given a directive with patternName " "
- When I apply the missing-pattern-name rule
- Then a violation should be detected
- And the violation severity should be "error"

**Accept valid pattern name**

- Given a directive with patternName "CommandOrchestrator"
- When I apply the missing-pattern-name rule
- Then no violation should be detected

**Include file and line in violation**

- Given a directive without patternName
- And the file path is "/path/to/my-file.ts"
- And the line number is 42
- When I apply the missing-pattern-name rule
- Then the violation should have file "/path/to/my-file.ts"
- And the violation should have line 42

**Detect missing status**

- Given a directive without status
- When I apply the missing-status rule
- Then a violation should be detected
- And the violation severity should be "warning"
- And the violation message should contain "@libar-docs-status"

**Accept completed status**

- Given a directive with status "completed"
- When I apply the missing-status rule
- Then no violation should be detected

**Accept active status**

- Given a directive with status "active"
- When I apply the missing-status rule
- Then no violation should be detected

**Accept roadmap status**

- Given a directive with status "roadmap"
- When I apply the missing-status rule
- Then no violation should be detected

**Accept deferred status**

- Given a directive with status "deferred"
- When I apply the missing-status rule
- Then no violation should be detected

**Detect missing whenToUse**

- Given a directive without whenToUse
- When I apply the missing-when-to-use rule
- Then a violation should be detected
- And the violation severity should be "warning"
- And the violation message should contain "When to Use"

**Detect empty whenToUse array**

- Given a directive with empty whenToUse array
- When I apply the missing-when-to-use rule
- Then a violation should be detected

**Accept whenToUse with content**

- Given a directive with whenToUse:
- When I apply the missing-when-to-use rule
- Then no violation should be detected

| value                        |
| ---------------------------- |
| Use when processing commands |

**Detect missing relationship tags**

- Given a directive without relationship tags
- When I apply the missing-relationships rule
- Then a violation should be detected
- And the violation severity should be "info"
- And the violation message should contain "relationship tags"

**Detect empty uses array**

- Given a directive with empty uses array
- When I apply the missing-relationships rule
- Then a violation should be detected

**Accept uses with content**

- Given a directive with uses:
- When I apply the missing-relationships rule
- Then no violation should be detected

| value     |
| --------- |
| FSM Types |

**Accept usedBy with content**

- Given a directive with usedBy:
- When I apply the missing-relationships rule
- Then no violation should be detected

| value               |
| ------------------- |
| CommandOrchestrator |

**Accept both uses and usedBy**

- Given a directive with:
- When I apply the missing-relationships rule
- Then no violation should be detected

| field  | value           |
| ------ | --------------- |
| uses   | FSM Types       |
| usedBy | Decider Factory |

## Business Rules

**Files must declare an explicit pattern name**

**Invariant:** Every annotated file must have a non-empty patternName to be identifiable in the registry.
**Rationale:** Without a pattern name, the file cannot be tracked, linked, or referenced in generated documentation.
**Verified by:** Detect missing pattern name, Detect empty string pattern name, Detect whitespace-only pattern name, Accept valid pattern name, Include file and line in violation

_Verified by: Detect missing pattern name, Detect empty string pattern name, Detect whitespace-only pattern name, Accept valid pattern name, Include file and line in violation_

**Files should declare a lifecycle status**

**Invariant:** Every annotated file should have a status tag to track its position in the delivery lifecycle.
**Rationale:** Missing status prevents FSM validation and roadmap tracking.
**Verified by:** Detect missing status, Accept completed status, Accept active status, Accept roadmap status, Accept deferred status

_Verified by: Detect missing status, Accept completed status, Accept active status, Accept roadmap status, Accept deferred status_

**Files should document when to use the pattern**

**Invariant:** Annotated files should include whenToUse guidance so consumers know when to apply the pattern.
**Rationale:** Without usage guidance, patterns become undiscoverable despite being documented.
**Verified by:** Detect missing whenToUse, Detect empty whenToUse array, Accept whenToUse with content

_Verified by: Detect missing whenToUse, Detect empty whenToUse array, Accept whenToUse with content_

**Files should declare relationship tags**

**Invariant:** Annotated files should declare uses or usedBy relationships to enable dependency tracking and architecture diagrams.
**Rationale:** Isolated patterns without relationships produce diagrams with no edges and prevent dependency analysis.
**Verified by:** Detect missing relationship tags, Detect empty uses array, Accept uses with content, Accept usedBy with content, Accept both uses and usedBy

_Verified by: Detect missing relationship tags, Detect empty uses array, Accept uses with content, Accept usedBy with content, Accept both uses and usedBy_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
