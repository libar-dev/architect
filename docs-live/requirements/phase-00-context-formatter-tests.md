# 🚧 Context Formatter Tests

**Purpose:** Detailed requirements for the Context Formatter Tests feature

---

## Overview

| Property     | Value  |
| ------------ | ------ |
| Status       | active |
| Product Area | API    |

## Description

Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),
and formatOverview() plain text rendering functions.

## Acceptance Criteria

**Design bundle renders all populated sections**

- Given a design context bundle with metadata, stubs, dependencies, and deliverables
- When I format the bundle
- Then the output contains all expected sections

| section              |
| -------------------- |
| === PATTERN:         |
| === STUBS ===        |
| === DEPENDENCIES === |
| === DELIVERABLES === |

**Implement bundle renders deliverables and FSM**

- Given an implement context bundle with deliverables and FSM
- When I format the bundle
- Then the output contains all expected sections
- And the output contains checkbox markers

| section              |
| -------------------- |
| === DELIVERABLES === |
| === FSM ===          |

**Tree renders with arrows and focal marker**

- Given a dep-tree with root, middle, and focal leaf
- When I format the tree
- Then the output contains all expected sections

| section         |
| --------------- |
| ->              |
| <- YOU ARE HERE |

**Overview renders progress line**

- Given an overview with 69 total patterns at 52 percent
- When I format the overview
- Then the output contains all expected sections

| section          |
| ---------------- |
| 69 patterns      |
| 52%              |
| === PROGRESS === |

**File list renders primary and dependency sections**

- Given a file reading list with primary and dependency files
- When I format the file reading list
- Then the output contains "=== PRIMARY ==="
- And the output contains "=== COMPLETED DEPENDENCIES ==="

**Empty file reading list renders minimal output**

- Given an empty file reading list
- When I format the file reading list
- Then the output is a single newline

## Business Rules

**formatContextBundle renders section markers**

_Verified by: Design bundle renders all populated sections, Implement bundle renders deliverables and FSM_

**formatDepTree renders indented tree**

_Verified by: Tree renders with arrows and focal marker_

**formatOverview renders progress summary**

_Verified by: Overview renders progress line_

**formatFileReadingList renders categorized file paths**

_Verified by: File list renders primary and dependency sections, Empty file reading list renders minimal output_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
