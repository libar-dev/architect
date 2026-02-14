# ✅ Description Header Normalization

**Purpose:** Detailed documentation for the Description Header Normalization pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

Pattern descriptions should not create duplicate headers when rendered.
  If directive descriptions start with markdown headers, those headers
  should be stripped before rendering under the "Description" section.

## Acceptance Criteria

**Strip single leading markdown header**

- Given a pattern with directive description:
- When the pattern detail document is generated
- Then the output contains "## Description"
- And the Description section contains "Events that fail processing"
- And the output does not contain "## Poison Event Handling"

```markdown
## Poison Event Handling

Events that fail processing are tracked and isolated.
```

**Strip multiple leading headers**

- Given a pattern with directive description:
- When the pattern detail document is generated
- Then the Description section contains "Actual content starts here"
- And the Description section does not contain any of:

```markdown
## Topic Name
### Subtopic

Actual content starts here.
```

| header |
| --- |
| ## Topic Name |
| ### Subtopic |

**Preserve description without leading header**

- Given a pattern with directive description:
- When the pattern detail document is generated
- Then the Description section contains "Events that fail processing"
- And no headers were stripped

```markdown
Events that fail processing are tracked and isolated.
They are moved to a poison queue for manual review.
```

**Empty description after stripping headers**

- Given a pattern with directive description:
- When the pattern detail document is generated
- Then no Description section is rendered

```markdown
## Just a Header
```

**Description with only whitespace and headers**

- Given a pattern with directive description:
- When the pattern detail document is generated
- Then no Description section is rendered

```markdown

## Header Only

```

**Header in middle of description is preserved**

- Given a pattern with description containing middle header
- When the pattern detail document is generated
- Then the Description section contains "Introduction paragraph"
- And the Description section contains middle header text

**Strips h1 header**

- Given text "# Title\n\nContent"
- When stripLeadingHeaders is called
- Then the result is "Content"

**Strips h2 through h6 headers**

- Given text "### Heading\n\nContent"
- When stripLeadingHeaders is called
- Then the result is "Content"

**Strips leading empty lines before header**

- Given text "\n\n## Header\n\nContent"
- When stripLeadingHeaders is called
- Then the result is "Content"

**Preserves content starting with text**

- Given text "Content without header"
- When stripLeadingHeaders is called
- Then the result is "Content without header"

**Returns empty string for header-only input**

- Given text "## Header Only"
- When stripLeadingHeaders is called
- Then the result is ""

**Handles null/undefined input**

- Given null text
- When stripLeadingHeaders is called
- Then the result is null

## Business Rules

**Leading headers are stripped from pattern descriptions**

_Verified by: Strip single leading markdown header, Strip multiple leading headers, Preserve description without leading header_

**Edge cases are handled correctly**

_Verified by: Empty description after stripping headers, Description with only whitespace and headers, Header in middle of description is preserved_

**stripLeadingHeaders removes only leading headers**

_Verified by: Strips h1 header, Strips h2 through h6 headers, Strips leading empty lines before header, Preserves content starting with text, Returns empty string for header-only input, Handles null/undefined input_

---

[← Back to Pattern Registry](../PATTERNS.md)
