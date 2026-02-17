@libar-docs
@libar-docs-pattern:UniversalMarkdownRenderer
@libar-docs-status:completed
@libar-docs-product-area:Generation
@behavior @render
Feature: Universal Markdown Renderer
  The universal renderer converts RenderableDocument to markdown.
  It is a "dumb printer" with no domain knowledge - all logic lives in codecs.

  Background:
    Given a renderer test context

  Rule: Document metadata renders as frontmatter before sections

      **Invariant:** Title always renders as H1, purpose and detail level render as bold key-value pairs separated by horizontal rule.
      **Verified by:** Render minimal document with title only, Render document with purpose, Render document with detail level, Render document with purpose and detail level

    @happy-path
    Scenario: Render minimal document with title only
      Given a document with title "Test Document"
      When rendering to markdown
      Then the output starts with "# Test Document"
      And the output ends with a single newline

    Scenario: Render document with purpose
      Given a document with title "My Doc" and purpose "Explain the system"
      When rendering to markdown
      Then the output contains "**Purpose:** Explain the system"
      And the output contains "---"

    Scenario: Render document with detail level
      Given a document with title "Report" and detail level "full"
      When rendering to markdown
      Then the output contains "**Detail Level:** full"

    Scenario: Render document with purpose and detail level
      Given a document with:
        | field       | value                |
        | title       | Complete Doc         |
        | purpose     | Show everything      |
        | detailLevel | comprehensive        |
      When rendering to markdown
      Then the output contains "**Purpose:** Show everything"
      And the output contains "**Detail Level:** comprehensive"

  Rule: Headings render at correct markdown levels with clamping

      **Invariant:** Heading levels are clamped to the valid range 1-6 regardless of input value.
      **Verified by:** Render headings at different levels, Clamp heading level 0 to 1, Clamp heading level 7 to 6

    Scenario Outline: Render headings at different levels
      Given a document with heading level "<level>" and text "<text>"
      When rendering to markdown
      Then the output contains "<expected>"

      Examples:
        | level | text          | expected              |
        | 1     | Section Title | # Section Title       |
        | 2     | Section Title | ## Section Title      |
        | 3     | Section Title | ### Section Title     |
        | 4     | Section Title | #### Section Title    |
        | 5     | Section Title | ##### Section Title   |
        | 6     | Section Title | ###### Section Title  |

    Scenario: Clamp heading level 0 to 1
      Given a document with a heading at level 0 with text "Too Low"
      When rendering to markdown
      Then the output contains "# Too Low"
      And the output does not contain "## Too Low"

    Scenario: Clamp heading level 7 to 6
      Given a document with a heading at level 7 with text "Too High"
      When rendering to markdown
      Then the output contains "###### Too High"
      And the output does not contain "####### Too High"

  Rule: Paragraphs and separators render as plain text and horizontal rules

      **Invariant:** Paragraph content passes through unmodified, including special markdown characters. Separators render as horizontal rules.
      **Verified by:** Render paragraph, Render paragraph with special characters, Render separator

    Scenario: Render paragraph
      Given a document with a paragraph "This is some text content."
      When rendering to markdown
      Then the output contains "This is some text content."

    Scenario: Render paragraph with special characters
      Given a document with a paragraph "Has *bold* and _italic_ and `code`"
      When rendering to markdown
      Then the output contains "Has *bold* and _italic_ and `code`"

    Scenario: Render separator
      Given a document with a separator
      When rendering to markdown
      Then the output contains "---"

  Rule: Tables render with headers, alignment, and cell escaping

      **Invariant:** Tables must escape pipe characters, convert newlines to line breaks, and pad short rows to match column count.
      **Verified by:** Render basic table, Render table with alignment, Render empty table (no columns), Render table with pipe character in cell, Render table with newline in cell, Render table with short row (fewer cells than columns)

    @happy-path
    Scenario: Render basic table
      Given a document with a table:
        | Column1 | Column2 |
        | a       | b       |
        | c       | d       |
      When rendering to markdown
      Then the output contains the table:
        """
        | Column1 | Column2 |
        | --- | --- |
        | a | b |
        | c | d |
        """

    Scenario: Render table with alignment
      Given a document with a table with alignments:
        | Column   | Alignment |
        | Left     | left      |
        | Center   | center    |
        | Right    | right     |
      When rendering to markdown
      Then the output contains "| --- | :---: | ---: |"

    Scenario: Render empty table (no columns)
      Given a document with a table with no columns
      When rendering to markdown
      Then the table is not rendered

    Scenario: Render table with pipe character in cell
      Given a document with a table containing "|" in a cell
      When rendering to markdown
      Then the output contains "\|"

    Scenario: Render table with newline in cell
      Given a document with a table containing newline in a cell
      When rendering to markdown
      Then the output contains "<br>"

    Scenario: Render table with short row (fewer cells than columns)
      Given a document with a table where a row has fewer cells than columns
      When rendering to markdown
      Then the row is padded with empty cells

  Rule: Lists render in unordered, ordered, checkbox, and nested formats

      **Invariant:** List type determines prefix: dash for unordered, numbered for ordered, checkbox syntax for checked items. Nesting adds two-space indentation per level.
      **Verified by:** Render unordered list, Render ordered list, Render checkbox list with checked items, Render nested list

    @happy-path
    Scenario: Render unordered list
      Given a document with an unordered list:
        | item   |
        | Item 1 |
        | Item 2 |
        | Item 3 |
      When rendering to markdown
      Then the output contains all of:
        | text     |
        | - Item 1 |
        | - Item 2 |
        | - Item 3 |

    Scenario: Render ordered list
      Given a document with an ordered list:
        | item        |
        | First item  |
        | Second item |
        | Third item  |
      When rendering to markdown
      Then the output contains all of:
        | text            |
        | 1. First item   |
        | 2. Second item  |
        | 3. Third item   |

    Scenario: Render checkbox list with checked items
      Given a document with a checkbox list:
        | text     | checked |
        | Done     | true    |
        | Not done | false   |
      When rendering to markdown
      Then the output contains all of:
        | text             |
        | - [x] Done       |
        | - [ ] Not done   |

    Scenario: Render nested list
      Given a document with a nested list:
        """
        - Parent 1
          - Child 1a
          - Child 1b
        - Parent 2
        """
      When rendering to markdown
      Then the output contains all of:
        | text          |
        | - Parent 1    |
        |   - Child 1a  |
        |   - Child 1b  |
        | - Parent 2    |

  Rule: Code blocks and mermaid diagrams render with fenced syntax

      **Invariant:** Code blocks use triple backtick fencing with optional language hint. Mermaid blocks use mermaid as the language hint.
      **Verified by:** Render code block with language, Render code block without language, Render mermaid diagram

    Scenario: Render code block with language
      Given a document with a code block in "typescript":
        """
        const x = 42;
        """
      When rendering to markdown
      Then the output contains all of:
        | text           |
        | ```typescript  |
        | const x = 42;  |
        | ```            |

    Scenario: Render code block without language
      Given a document with a code block without language:
        """
        plain code
        """
      When rendering to markdown
      Then the output contains all of:
        | text       |
        | ```        |
        | plain code |

    Scenario: Render mermaid diagram
      Given a document with a mermaid block:
        """
        graph TD
          A --> B
        """
      When rendering to markdown
      Then the output contains all of:
        | text       |
        | ```mermaid |
        | graph TD   |
        | A --> B    |

  Rule: Collapsible blocks render as HTML details elements

      **Invariant:** Summary text is HTML-escaped to prevent injection. Collapsible content renders between details tags.
      **Verified by:** Render collapsible block, Render collapsible with HTML entities in summary, Render nested collapsible content

    @happy-path
    Scenario: Render collapsible block
      Given a document with a collapsible block with summary "Click to expand"
      And the collapsible contains a paragraph "Hidden content here"
      When rendering to markdown
      Then the output contains all of:
        | text                              |
        | <details>                         |
        | <summary>Click to expand</summary>|
        | Hidden content here               |
        | </details>                        |

    Scenario: Render collapsible with HTML entities in summary
      Given a document with a collapsible block with summary "Items <5 & >3"
      When rendering to markdown
      Then the output contains "<summary>Items &lt;5 &amp; &gt;3</summary>"

    Scenario: Render nested collapsible content
      Given a document with a collapsible containing a table
      When rendering to markdown
      Then the output contains "<details>"
      And the output contains a table between details tags

  Rule: Link-out blocks render as markdown links with URL encoding

      **Invariant:** Link paths with spaces are percent-encoded for valid URLs.
      **Verified by:** Render link-out block, Render link-out with spaces in path

    Scenario: Render link-out block
      Given a document with a link-out "See details" to "patterns/core.md"
      When rendering to markdown
      Then the output contains "[See details](patterns/core.md)"

    Scenario: Render link-out with spaces in path
      Given a document with a link-out "My File" to "path/my file.md"
      When rendering to markdown
      Then the output contains "[My File](path/my%20file.md)"

  Rule: Multi-file documents produce correct output file collections

      **Invariant:** Output file count equals 1 (main) plus additional file count. The first output file always uses the provided base path.
      **Verified by:** Render document with additional files, Render document without additional files

    @happy-path
    Scenario: Render document with additional files
      Given a document with title "Main" and 2 additional files
      When rendering with files to "docs/MAIN.md"
      Then 3 output files are returned
      And the first output file path is "docs/MAIN.md"

    Scenario: Render document without additional files
      Given a document with title "Simple" and no additional files
      When rendering with files to "docs/SIMPLE.md"
      Then 1 output file is returned

  Rule: Complex documents render all block types in sequence

      **Invariant:** Multiple block types in a single document render in order without interference.
      **Verified by:** Render complex document with multiple block types

    Scenario: Render complex document with multiple block types
      Given a document with:
        | field   | value            |
        | title   | Complex Document |
        | purpose | Test all blocks  |
      And the document has sections:
        | type      | content            |
        | heading   | Section 1          |
        | paragraph | Some text          |
        | separator |                    |
        | heading   | Section 2          |
      When rendering to markdown
      Then the output contains all of:
        | text               |
        | # Complex Document |
        | ## Section 1       |
        | Some text          |
        | ---                |
        | ## Section 2       |

  Rule: Claude context renderer produces compact AI-optimized output

      **Invariant:** Claude context replaces markdown syntax with section markers, omits visual-only blocks (mermaid, separators), flattens collapsible content, and produces shorter output than markdown.
      **Verified by:** Claude context renders title and headings as section markers, Claude context renders sub-headings with different markers, Claude context omits mermaid blocks, Claude context flattens collapsible blocks, Claude context renders link-out as plain text, Claude context omits separator tokens, Claude context produces fewer characters than markdown

    @happy-path
    Scenario: Claude context renders title and headings as section markers
      Given a document with title "Test Document"
      And the document has sections:
        | type      | content      |
        | heading   | Section One  |
        | paragraph | Body text    |
      When rendering to claude context
      Then the claude context output contains "=== TEST DOCUMENT ==="
      And the claude context output contains "=== SECTION ONE ==="
      And the claude context output does not contain "#"

    Scenario: Claude context renders sub-headings with different markers
      Given a document with title "Doc"
      And the document has a heading at level 3 with text "Sub Section"
      When rendering to claude context
      Then the claude context output contains "--- Sub Section ---"
      And the claude context output does not contain "=== SUB SECTION ==="

    Scenario: Claude context omits mermaid blocks
      Given a document with title "Diagram Doc"
      And the document has a mermaid block:
        """
        graph TD
          A --> B
        """
      When rendering to claude context
      Then the claude context output does not contain any of:
        | text     |
        | mermaid  |
        | graph TD |

    Scenario: Claude context flattens collapsible blocks
      Given a document with title "Collapsible Doc"
      And a collapsible block with summary "Click to expand"
      And the collapsible contains a paragraph "Hidden content here"
      When rendering to claude context
      Then the claude context output contains all of:
        | text                    |
        | Hidden content here     |
        | --- Click to expand --- |
      And the claude context output does not contain any of:
        | text       |
        | <details>  |
        | <summary>  |

    Scenario: Claude context renders link-out as plain text
      Given a document with title "Link Doc"
      And the document has a link-out "See details" to "patterns/core.md"
      When rendering to claude context
      Then the claude context output contains "-> See details"
      And the claude context output does not contain "[See details]"

    Scenario: Claude context omits separator tokens
      Given a document with title "Sep Doc"
      And the document has sections:
        | type      | content  |
        | paragraph | Before   |
        | separator |          |
        | paragraph | After    |
      When rendering to claude context
      Then the claude context output contains all of:
        | text   |
        | Before |
        | After  |
      And the claude context output does not contain "---"

    Scenario: Claude context produces fewer characters than markdown
      Given a document with title "Doc" and a mermaid block and collapsible
      When rendering to markdown
      And rendering to claude context
      Then the claude context output is shorter than the markdown output
