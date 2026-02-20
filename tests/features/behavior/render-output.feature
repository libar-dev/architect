@libar-docs
@libar-docs-pattern:RendererOutputFormats
@libar-docs-implements:UniversalMarkdownRenderer
@libar-docs-status:completed
@libar-docs-product-area:Generation
@behavior @render
Feature: Universal Markdown Renderer - Output Formats
  The universal renderer converts RenderableDocument to markdown.
  It is a "dumb printer" with no domain knowledge - all logic lives in codecs.

  Background:
    Given a renderer test context

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
