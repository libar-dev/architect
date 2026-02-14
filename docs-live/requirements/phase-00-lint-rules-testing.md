# ✅ Lint Rules Testing

**Purpose:** Detailed requirements for the Lint Rules Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

The lint system validates @libar-docs-\* documentation annotations for quality.

Rules check parsed directives for completeness and quality, enabling
CI enforcement of documentation standards.

Each rule has a severity level:

- error: Must fix before merge
- warning: Should fix for quality
- info: Suggestions for improvement

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

**Detect description that equals pattern name**

- Given a directive with:
- When I apply the tautological-description rule
- Then a violation should be detected
- And the violation severity should be "error"
- And the violation message should contain "repeats pattern name"

| field       | value               |
| ----------- | ------------------- |
| patternName | CommandOrchestrator |
| description | CommandOrchestrator |

**Detect description that is pattern name with punctuation**

- Given a directive with:
- When I apply the tautological-description rule
- Then a violation should be detected
- And the violation severity should be "error"

| field       | value                 |
| ----------- | --------------------- |
| patternName | Command Orchestrator  |
| description | Command-Orchestrator. |

**Detect short description starting with pattern name**

- Given a directive with:
- When I apply the tautological-description rule
- Then a violation should be detected

| field       | value            |
| ----------- | ---------------- |
| patternName | FSM Types        |
| description | FSM Types module |

**Accept description with substantial content after name**

- Given a directive with:
- When I apply the tautological-description rule
- Then no violation should be detected

| field       | value                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| patternName | FSM Types                                                                                    |
| description | FSM Types provides strongly-typed state machine definitions for entity lifecycle management. |

**Accept meaningfully different description**

- Given a directive with:
- When I apply the tautological-description rule
- Then no violation should be detected

| field       | value                                                       |
| ----------- | ----------------------------------------------------------- |
| patternName | CommandOrchestrator                                         |
| description | The 7-step dual-write pattern for atomic command execution. |

**Ignore empty descriptions**

- Given a directive with:
- When I apply the tautological-description rule
- Then no violation should be detected

| field       | value |
| ----------- | ----- |
| patternName | Test  |
| description |       |

**Ignore missing pattern name**

- Given a directive with description "Some description"
- When I apply the tautological-description rule
- Then no violation should be detected

**Skip headings when finding first line**

- Given a directive with:
- When I apply the tautological-description rule
- Then no violation should be detected

| field       | value                                                    |
| ----------- | -------------------------------------------------------- |
| patternName | Test Pattern                                             |
| description | ## Test Pattern<br><br>This is a meaningful description. |

**Skip "When to use" sections when finding first line**

- Given a directive with:
- When I apply the tautological-description rule
- Then no violation should be detected

| field       | value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| patternName | Test                                                                  |
| description | **When to use:** Some guidance<br><br>This is the actual description. |

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

**Default rules contains all 8 rules**

- When I check the default rules collection
- Then it should contain 8 rules

**Default rules have unique IDs**

- When I check the default rules collection
- Then all rule IDs should be unique

**Default rules are ordered by severity**

- When I check the default rules collection
- Then errors should come before warnings
- And warnings should come before info

**Default rules include all named rules**

- When I check the default rules collection
- Then it should include all rules:

| ruleId                         |
| ------------------------------ |
| missing-pattern-name           |
| invalid-status                 |
| missing-status                 |
| missing-when-to-use            |
| tautological-description       |
| missing-relationships          |
| pattern-conflict-in-implements |

**Filter returns all rules for info severity**

- When I filter rules by minimum severity "info"
- Then I should get 8 rules

**Filter excludes info rules for warning severity**

- When I filter rules by minimum severity "warning"
- Then I should get 7 rules
- And none should have severity "info"

**Filter returns only errors for error severity**

- When I filter rules by minimum severity "error"
- Then I should get 4 rules
- And all should have severity "error"

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
