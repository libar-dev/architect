# ✅ Universal Markdown Renderer

**Purpose:** Detailed requirements for the Universal Markdown Renderer feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Behavior  |

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

| field       | value           |
| ----------- | --------------- |
| title       | Complete Doc    |
| purpose     | Show everything |
| detailLevel | comprehensive   |

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

- Given a document with a paragraph "Has _bold_ and _italic_ and `code`"
- When rendering to markdown
- Then the output contains "Has _bold_ and _italic_ and `code`"

**Render separator**

- Given a document with a separator
- When rendering to markdown
- Then the output contains "---"

**Render basic table**

- Given a document with a table:
- When rendering to markdown
- Then the output contains the table:

| Column1 | Column2 |
| ------- | ------- |
| a       | b       |
| c       | d       |

```markdown
| Column1 | Column2 |
| ------- | ------- |
| a       | b       |
| c       | d       |
```

**Render table with alignment**

- Given a document with a table with alignments:
- When rendering to markdown
- Then the output contains "| --- | :---: | ---: |"

| Column | Alignment |
| ------ | --------- |
| Left   | left      |
| Center | center    |
| Right  | right     |

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

| item   |
| ------ |
| Item 1 |
| Item 2 |
| Item 3 |

| text     |
| -------- |
| - Item 1 |
| - Item 2 |
| - Item 3 |

**Render ordered list**

- Given a document with an ordered list:
- When rendering to markdown
- Then the output contains all of:

| item        |
| ----------- |
| First item  |
| Second item |
| Third item  |

| text           |
| -------------- |
| 1. First item  |
| 2. Second item |
| 3. Third item  |

**Render checkbox list with checked items**

- Given a document with a checkbox list:
- When rendering to markdown
- Then the output contains all of:

| text     | checked |
| -------- | ------- |
| Done     | true    |
| Not done | false   |

| text           |
| -------------- |
| - [x] Done     |
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

| text       |
| ---------- |
| - Parent 1 |
| - Child 1a |
| - Child 1b |
| - Parent 2 |

**Render code block with language**

- Given a document with a code block in "typescript":
- When rendering to markdown
- Then the output contains all of:

```markdown
const x = 42;
```

| text          |
| ------------- |
| ```typescript |
| const x = 42; |
| ```           |

**Render code block without language**

- Given a document with a code block without language:
- When rendering to markdown
- Then the output contains all of:

```markdown
plain code
```

| text       |
| ---------- |
| ```        |
| plain code |

**Render mermaid diagram**

- Given a document with a mermaid block:
- When rendering to markdown
- Then the output contains all of:

```markdown
graph TD
A --> B
```

| text       |
| ---------- |
| ```mermaid |
| graph TD   |
| A --> B    |

**Render collapsible block**

- Given a document with a collapsible block with summary "Click to expand"
- And the collapsible contains a paragraph "Hidden content here"
- When rendering to markdown
- Then the output contains all of:

| text                               |
| ---------------------------------- |
| <details>                          |
| <summary>Click to expand</summary> |
| Hidden content here                |
| </details>                         |

**Render collapsible with HTML entities in summary**

- Given a document with a collapsible block with summary "Items <5 & >3"
- When rendering to markdown
- Then the output contains "<summary>Items &lt;5 &amp; &gt;3</summary>"

**Render nested collapsible content**

- Given a document with a collapsible containing a table
- When rendering to markdown
- Then the output contains "<details>"
- And the output contains a table between details tags

**Render link-out block**

- Given a document with a link-out "See details" to "patterns/core.md"
- When rendering to markdown
- Then the output contains "[See details](patterns/core.md)"

**Render link-out with spaces in path**

- Given a document with a link-out "My File" to "path/my file.md"
- When rendering to markdown
- Then the output contains "[My File](path/my%20file.md)"

**Render document with additional files**

- Given a document with title "Main" and 2 additional files
- When rendering with files to "docs/MAIN.md"
- Then 3 output files are returned
- And the first output file path is "docs/MAIN.md"

**Render document without additional files**

- Given a document with title "Simple" and no additional files
- When rendering with files to "docs/SIMPLE.md"
- Then 1 output file is returned

**Render complex document with multiple block types**

- Given a document with:
- And the document has sections:
- When rendering to markdown
- Then the output contains all of:

| field   | value            |
| ------- | ---------------- |
| title   | Complex Document |
| purpose | Test all blocks  |

| type      | content   |
| --------- | --------- |
| heading   | Section 1 |
| paragraph | Some text |
| separator |           |
| heading   | Section 2 |

| text               |
| ------------------ |
| # Complex Document |
| ## Section 1       |
| Some text          |
| ---                |
| ## Section 2       |

**Claude context renders title and headings as section markers**

- Given a document with title "Test Document"
- And the document has sections:
- When rendering to claude context
- Then the claude context output contains "=== TEST DOCUMENT ==="
- And the claude context output contains "=== SECTION ONE ==="
- And the claude context output does not contain "#"

| type      | content     |
| --------- | ----------- |
| heading   | Section One |
| paragraph | Body text   |

**Claude context renders sub-headings with different markers**

- Given a document with title "Doc"
- And the document has a heading at level 3 with text "Sub Section"
- When rendering to claude context
- Then the claude context output contains "--- Sub Section ---"
- And the claude context output does not contain "=== SUB SECTION ==="

**Claude context omits mermaid blocks**

- Given a document with title "Diagram Doc"
- And the document has a mermaid block:
- When rendering to claude context
- Then the claude context output does not contain any of:

```markdown
graph TD
A --> B
```

| text     |
| -------- |
| mermaid  |
| graph TD |

**Claude context flattens collapsible blocks**

- Given a document with title "Collapsible Doc"
- And a collapsible block with summary "Click to expand"
- And the collapsible contains a paragraph "Hidden content here"
- When rendering to claude context
- Then the claude context output contains all of:
- And the claude context output does not contain any of:

| text                    |
| ----------------------- |
| Hidden content here     |
| --- Click to expand --- |

| text      |
| --------- |
| <details> |
| <summary> |

**Claude context renders link-out as plain text**

- Given a document with title "Link Doc"
- And the document has a link-out "See details" to "patterns/core.md"
- When rendering to claude context
- Then the claude context output contains "-> See details"
- And the claude context output does not contain "[See details]"

**Claude context omits separator tokens**

- Given a document with title "Sep Doc"
- And the document has sections:
- When rendering to claude context
- Then the claude context output contains all of:
- And the claude context output does not contain "---"

| type      | content |
| --------- | ------- |
| paragraph | Before  |
| separator |         |
| paragraph | After   |

| text   |
| ------ |
| Before |
| After  |

**Claude context produces fewer characters than markdown**

- Given a document with title "Doc" and a mermaid block and collapsible
- When rendering to markdown
- And rendering to claude context
- Then the claude context output is shorter than the markdown output

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
