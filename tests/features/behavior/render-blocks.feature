@architect
@architect-pattern:RendererBlockTypes
@architect-implements:UniversalMarkdownRenderer
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:Generation
@behavior @render
Feature: Universal Markdown Renderer - Block Types
  The universal renderer converts RenderableDocument to markdown.
  It is a "dumb printer" with no domain knowledge - all logic lives in codecs.

  Background:
    Given a renderer test context

  Rule: Document metadata renders as frontmatter before sections

      **Invariant:** Title always renders as H1, purpose and detail level render as bold key-value pairs separated by horizontal rule.
      **Rationale:** Consistent frontmatter structure allows downstream tooling and readers to reliably locate the document title and metadata without parsing the full body.

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
      **Rationale:** Markdown only supports heading levels 1-6; unclamped values would produce invalid syntax that renders as plain text in all markdown processors.

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
      **Rationale:** The renderer is a dumb printer; altering paragraph content would break codec-controlled formatting and violate the separation between codec logic and rendering.

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
      **Rationale:** Unescaped pipes corrupt table column boundaries, raw newlines break row parsing, and short rows cause column misalignment in every markdown renderer.

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
        | ------- | ------- |
        | a       | b       |
        | c       | d       |
        """

    Scenario: Render table with alignment
      Given a document with a table with alignments:
        | Column   | Alignment |
        | Left     | left      |
        | Center   | center    |
        | Right    | right     |
      When rendering to markdown
      Then the output contains "| ---- | :----: | ----: |"

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
      **Rationale:** Incorrect prefixes or indentation levels cause markdown parsers to break list continuity, rendering nested items as separate top-level lists or plain text.

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
