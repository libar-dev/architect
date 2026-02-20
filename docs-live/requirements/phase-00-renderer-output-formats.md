# ✅ Renderer Output Formats

**Purpose:** Detailed requirements for the Renderer Output Formats feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

The universal renderer converts RenderableDocument to markdown.
It is a "dumb printer" with no domain knowledge - all logic lives in codecs.

## Acceptance Criteria

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

## Business Rules

**Code blocks and mermaid diagrams render with fenced syntax**

**Invariant:** Code blocks use triple backtick fencing with optional language hint. Mermaid blocks use mermaid as the language hint.
**Verified by:** Render code block with language, Render code block without language, Render mermaid diagram

_Verified by: Render code block with language, Render code block without language, Render mermaid diagram_

**Collapsible blocks render as HTML details elements**

**Invariant:** Summary text is HTML-escaped to prevent injection. Collapsible content renders between details tags.
**Verified by:** Render collapsible block, Render collapsible with HTML entities in summary, Render nested collapsible content

_Verified by: Render collapsible block, Render collapsible with HTML entities in summary, Render nested collapsible content_

**Link-out blocks render as markdown links with URL encoding**

**Invariant:** Link paths with spaces are percent-encoded for valid URLs.
**Verified by:** Render link-out block, Render link-out with spaces in path

_Verified by: Render link-out block, Render link-out with spaces in path_

**Multi-file documents produce correct output file collections**

**Invariant:** Output file count equals 1 (main) plus additional file count. The first output file always uses the provided base path.
**Verified by:** Render document with additional files, Render document without additional files

_Verified by: Render document with additional files, Render document without additional files_

**Complex documents render all block types in sequence**

**Invariant:** Multiple block types in a single document render in order without interference.
**Verified by:** Render complex document with multiple block types

_Verified by: Render complex document with multiple block types_

**Claude context renderer produces compact AI-optimized output**

**Invariant:** Claude context replaces markdown syntax with section markers, omits visual-only blocks (mermaid, separators), flattens collapsible content, and produces shorter output than markdown.
**Verified by:** Claude context renders title and headings as section markers, Claude context renders sub-headings with different markers, Claude context omits mermaid blocks, Claude context flattens collapsible blocks, Claude context renders link-out as plain text, Claude context omits separator tokens, Claude context produces fewer characters than markdown

_Verified by: Claude context renders title and headings as section markers, Claude context renders sub-headings with different markers, Claude context omits mermaid blocks, Claude context flattens collapsible blocks, Claude context renders link-out as plain text, Claude context omits separator tokens, Claude context produces fewer characters than markdown_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
