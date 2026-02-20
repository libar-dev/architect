# ✅ Renderer Block Types

**Purpose:** Detailed documentation for the Renderer Block Types pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

The universal renderer converts RenderableDocument to markdown.
  It is a "dumb printer" with no domain knowledge - all logic lives in codecs.

## Acceptance Criteria

**Render minimal document with title only**

- Given a document with title "Test Document"
- When rendering to markdown
- Then the output starts with "# Test Document"
- And the output ends with a single newline

**Render document with purpose**

- Given a document with title "My Doc" and purpose "Explain the system"
- When rendering to markdown
- Then the output contains "**Purpose:** Explain the system"
- And the output contains "---"

**Render document with detail level**

- Given a document with title "Report" and detail level "full"
- When rendering to markdown
- Then the output contains "**Detail Level:** full"

**Render document with purpose and detail level**

- Given a document with:
- When rendering to markdown
- Then the output contains "**Purpose:** Show everything"
- And the output contains "**Detail Level:** comprehensive"

| field | value |
| --- | --- |
| title | Complete Doc |
| purpose | Show everything |
| detailLevel | comprehensive |

**Render headings at different levels**

- Given a document with heading level "<level>" and text "<text>"
- When rendering to markdown
- Then the output contains "<expected>"

**Clamp heading level 0 to 1**

- Given a document with a heading at level 0 with text "Too Low"
- When rendering to markdown
- Then the output contains "# Too Low"
- And the output does not contain "## Too Low"

**Clamp heading level 7 to 6**

- Given a document with a heading at level 7 with text "Too High"
- When rendering to markdown
- Then the output contains "###### Too High"
- And the output does not contain "####### Too High"

**Render paragraph**

- Given a document with a paragraph "This is some text content."
- When rendering to markdown
- Then the output contains "This is some text content."

**Render paragraph with special characters**

- Given a document with a paragraph "Has *bold* and _italic_ and `code`"
- When rendering to markdown
- Then the output contains "Has *bold* and _italic_ and `code`"

**Render separator**

- Given a document with a separator
- When rendering to markdown
- Then the output contains "---"

**Render basic table**

- Given a document with a table:
- When rendering to markdown
- Then the output contains the table:

| Column1 | Column2 |
| --- | --- |
| a | b |
| c | d |

```markdown
| Column1 | Column2 |
| --- | --- |
| a | b |
| c | d |
```

**Render table with alignment**

- Given a document with a table with alignments:
- When rendering to markdown
- Then the output contains "| --- | :---: | ---: |"

| Column | Alignment |
| --- | --- |
| Left | left |
| Center | center |
| Right | right |

**Render empty table (no columns)**

- Given a document with a table with no columns
- When rendering to markdown
- Then the table is not rendered

**Render table with pipe character in cell**

- Given a document with a table containing "|" in a cell
- When rendering to markdown
- Then the output contains "\|"

**Render table with newline in cell**

- Given a document with a table containing newline in a cell
- When rendering to markdown
- Then the output contains "<br>"

**Render table with short row (fewer cells than columns)**

- Given a document with a table where a row has fewer cells than columns
- When rendering to markdown
- Then the row is padded with empty cells

**Render unordered list**

- Given a document with an unordered list:
- When rendering to markdown
- Then the output contains all of:

| item |
| --- |
| Item 1 |
| Item 2 |
| Item 3 |

| text |
| --- |
| - Item 1 |
| - Item 2 |
| - Item 3 |

**Render ordered list**

- Given a document with an ordered list:
- When rendering to markdown
- Then the output contains all of:

| item |
| --- |
| First item |
| Second item |
| Third item |

| text |
| --- |
| 1. First item |
| 2. Second item |
| 3. Third item |

**Render checkbox list with checked items**

- Given a document with a checkbox list:
- When rendering to markdown
- Then the output contains all of:

| text | checked |
| --- | --- |
| Done | true |
| Not done | false |

| text |
| --- |
| - [x] Done |
| - [ ] Not done |

**Render nested list**

- Given a document with a nested list:
- When rendering to markdown
- Then the output contains all of:

```markdown
- Parent 1
  - Child 1a
  - Child 1b
- Parent 2
```

| text |
| --- |
| - Parent 1 |
| - Child 1a |
| - Child 1b |
| - Parent 2 |

## Business Rules

**Document metadata renders as frontmatter before sections**

**Invariant:** Title always renders as H1, purpose and detail level render as bold key-value pairs separated by horizontal rule.
      **Verified by:** Render minimal document with title only, Render document with purpose, Render document with detail level, Render document with purpose and detail level

_Verified by: Render minimal document with title only, Render document with purpose, Render document with detail level, Render document with purpose and detail level_

**Headings render at correct markdown levels with clamping**

**Invariant:** Heading levels are clamped to the valid range 1-6 regardless of input value.
      **Verified by:** Render headings at different levels, Clamp heading level 0 to 1, Clamp heading level 7 to 6

_Verified by: Render headings at different levels, Clamp heading level 0 to 1, Clamp heading level 7 to 6_

**Paragraphs and separators render as plain text and horizontal rules**

**Invariant:** Paragraph content passes through unmodified, including special markdown characters. Separators render as horizontal rules.
      **Verified by:** Render paragraph, Render paragraph with special characters, Render separator

_Verified by: Render paragraph, Render paragraph with special characters, Render separator_

**Tables render with headers, alignment, and cell escaping**

**Invariant:** Tables must escape pipe characters, convert newlines to line breaks, and pad short rows to match column count.
      **Verified by:** Render basic table, Render table with alignment, Render empty table (no columns), Render table with pipe character in cell, Render table with newline in cell, Render table with short row (fewer cells than columns)

_Verified by: Render basic table, Render table with alignment, Render empty table (no columns), Render table with pipe character in cell, Render table with newline in cell, Render table with short row (fewer cells than columns)_

**Lists render in unordered, ordered, checkbox, and nested formats**

**Invariant:** List type determines prefix: dash for unordered, numbered for ordered, checkbox syntax for checked items. Nesting adds two-space indentation per level.
      **Verified by:** Render unordered list, Render ordered list, Render checkbox list with checked items, Render nested list

_Verified by: Render unordered list, Render ordered list, Render checkbox list with checked items, Render nested list_

---

[← Back to Pattern Registry](../PATTERNS.md)
