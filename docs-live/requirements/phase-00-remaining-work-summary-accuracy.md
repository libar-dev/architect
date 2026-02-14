# ✅ Remaining Work Summary Accuracy

**Purpose:** Detailed requirements for the Remaining Work Summary Accuracy feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Summary totals in REMAINING-WORK.md must match the sum of phase table rows.
The backlog calculation must correctly identify patterns without phases
using pattern.id (which is always defined) rather than patternName.

## Acceptance Criteria

**Summary matches phase table with all patterns having phases**

- Given a dataset with patterns:
- When remaining work document is generated
- Then summary shows Active count 2
- And summary shows Total Remaining count 3
- And phase table rows sum to Active: 2, Remaining: 3

| id  | patternName | status  | phase |
| --- | ----------- | ------- | ----- |
| p1  | PatternA    | active  | 1     |
| p2  | PatternB    | active  | 1     |
| p3  | PatternC    | planned | 2     |

**Summary includes completed patterns correctly**

- Given a dataset with patterns:
- When remaining work document is generated
- Then summary shows Active count 1
- And summary shows Total Remaining count 2
- And completed patterns are not in remaining count

| id  | patternName | status    | phase |
| --- | ----------- | --------- | ----- |
| p1  | PatternA    | active    | 1     |
| p2  | PatternB    | completed | 1     |
| p3  | PatternC    | planned   | 2     |

**Summary includes backlog patterns without phase**

- Given a dataset with patterns:
- When remaining work document is generated
- Then summary shows Active count 2
- And summary shows Total Remaining count 3
- And phase table shows phase 1 row with Remaining: 1, Active: 1
- And phase table shows "Backlog" with Remaining: 2, Active: 1

| id  | patternName | status  | phase |
| --- | ----------- | ------- | ----- |
| p1  | PatternA    | active  | 1     |
| p2  | PatternB    | active  |       |
| p3  | PatternC    | planned |       |

**All patterns in backlog when none have phases**

- Given a dataset with patterns:
- When remaining work document is generated
- Then no phase table is generated
- And summary shows Active count 1
- And summary shows Total Remaining count 2

| id  | patternName | status  | phase |
| --- | ----------- | ------- | ----- |
| p1  | PatternA    | active  |       |
| p2  | PatternB    | planned |       |

**Patterns with undefined patternName counted correctly**

- Given a dataset with patterns:
- When remaining work document is generated
- Then summary total equals phase table sum plus backlog
- And no patterns are double-counted
- And no patterns are missing from count

| id  | patternName | status  | phase |
| --- | ----------- | ------- | ----- |
| p1  |             | active  | 1     |
| p2  |             | planned |       |

**Mixed patterns with and without patternName**

- Given a dataset with patterns:
- When remaining work document is generated
- Then summary shows Active count 2
- And summary shows Total Remaining count 4
- And phase 1 row shows Remaining: 2, Active: 2
- And backlog row shows Remaining: 2, Active: 0

| id  | patternName | status  | phase |
| --- | ----------- | ------- | ----- |
| p1  | PatternA    | active  | 1     |
| p2  |             | active  | 1     |
| p3  | PatternC    | planned |       |
| p4  |             | planned |       |

**Multiple phases shown in order**

- Given a dataset with patterns:
- When remaining work document is generated
- Then phase table shows phases in order: 1, 3, 5
- And each phase row has correct counts

| id  | patternName | status  | phase |
| --- | ----------- | ------- | ----- |
| p1  | A           | active  | 1     |
| p2  | B           | planned | 5     |
| p3  | C           | planned | 3     |

**Completed phases not shown in remaining work**

- Given a dataset with patterns:
- When remaining work document is generated
- Then phase 1 is not shown in phase table
- And phase 2 is shown with Remaining: 1

| id  | patternName | status    | phase |
| --- | ----------- | --------- | ----- |
| p1  | A           | completed | 1     |
| p2  | B           | completed | 1     |
| p3  | C           | active    | 2     |

## Business Rules

**Summary totals equal sum of phase table rows**

_Verified by: Summary matches phase table with all patterns having phases, Summary includes completed patterns correctly_

**Patterns without phases appear in Backlog row**

_Verified by: Summary includes backlog patterns without phase, All patterns in backlog when none have phases_

**Patterns without patternName are counted using id**

_Verified by: Patterns with undefined patternName counted correctly, Mixed patterns with and without patternName_

**All phases with incomplete patterns are shown**

_Verified by: Multiple phases shown in order, Completed phases not shown in remaining work_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
