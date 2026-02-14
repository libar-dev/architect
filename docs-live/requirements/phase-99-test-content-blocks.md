# 📋 Test Content Blocks

**Purpose:** Detailed requirements for the Test Content Blocks feature

---

## Overview

| Property       | Value                        |
| -------------- | ---------------------------- |
| Status         | planned                      |
| Product Area   | Generation                   |
| Business Value | test what generators capture |
| Phase          | 99                           |

## Description

This feature demonstrates what content blocks are captured and rendered
by the PRD generator. Use this as a reference for writing rich specs.

**Overview**

The delivery process supports **rich Markdown** in descriptions:

- Bullet points work
- _Italics_ and **bold** work
- `inline code` works

**Custom Section**

You can create any section you want using bold headers.
This content will appear in the PRD Description section.

## Acceptance Criteria

**Scenario with DocString for rich content**

- Given a system in initial state
- When the user provides the following configuration:
- Then the system accepts the configuration

```markdown
**Configuration Details**

This DocString contains **rich Markdown content** that will be
rendered in the Acceptance Criteria section.

- Option A: enabled
- Option B: disabled

Use DocStrings when you need multi-line content blocks.
```

**Scenario with DataTable for structured data**

- Given the following user permissions:
- When the user attempts an action
- Then access is granted based on permissions

| Permission | Level    | Description             |
| ---------- | -------- | ----------------------- |
| read       | basic    | Can view resources      |
| write      | elevated | Can modify resources    |
| admin      | full     | Can manage all settings |

**Simple scenario under second rule**

- Given a precondition
- When an action occurs
- Then the expected outcome happens

**Scenario with examples table**

- Given a value of <input>
- When processed
- Then the result is <output>

## Business Rules

**Business rules appear as a separate section**

Rule descriptions provide context for why this business rule exists.
You can include multiple paragraphs here.

    This is a second paragraph explaining edge cases or exceptions.

_Verified by: Scenario with DocString for rich content, Scenario with DataTable for structured data_

**Multiple rules create multiple Business Rule entries**

Each Rule keyword creates a separate entry in the Business Rules section.
This helps organize complex features into logical business domains.

_Verified by: Simple scenario under second rule, Scenario with examples table_

## Deliverables

- Demo item 1 (pending)
- Demo item 2 (complete)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
