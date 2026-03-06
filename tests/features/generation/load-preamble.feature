@libar-docs
@libar-docs-pattern:LoadPreambleParser
@libar-docs-status:active
@libar-docs-product-area:Generation
@behavior @load-preamble
Feature: Markdown-to-SectionBlock Parser

  The parseMarkdownToBlocks function converts raw markdown content into
  a readonly SectionBlock[] array using a 5-state line-by-line state machine.
  This enables preamble content to be authored as markdown files instead of
  verbose inline TypeScript object literals.

  **Problem:**
  Preamble content authored as inline TypeScript SectionBlock[] literals is
  verbose (540+ lines per codec config) and hard to review.

  **Solution:**
  A shared parser reads markdown and produces the same SectionBlock[] shape
  that codecs expect, enabling markdown authoring with TypeScript type safety.

  Background:
    Given a markdown parser test context

  Rule: Headings are parsed into HeadingBlock

    **Invariant:** Lines starting with 1-6 hash characters followed by a space produce HeadingBlock with the correct level and text.
    **Rationale:** Headings are the primary structural element in preamble markdown and must map exactly to HeadingBlock level values.
    **Verified by:** Single heading is parsed, All heading levels are parsed correctly

    @happy-path @headings
    Scenario: Single heading is parsed
      Given markdown with a level 2 heading "Getting Started"
      When parsing the markdown to blocks
      Then block 1 is a heading at level 2 with text "Getting Started"

    @happy-path @headings
    Scenario: All heading levels are parsed correctly
      Given markdown with all six heading levels
      When parsing the markdown to blocks
      Then 6 heading blocks are produced with levels 1 through 6

  Rule: Paragraphs are parsed into ParagraphBlock

    **Invariant:** Consecutive non-empty, non-construct lines produce a single ParagraphBlock with lines joined by spaces.
    **Rationale:** Multi-line paragraphs in markdown are a single logical block separated by blank lines.
    **Verified by:** Single line paragraph, Multi-line paragraph joined with space

    @happy-path @paragraphs
    Scenario: Single line paragraph
      Given markdown with a single paragraph line
      When parsing the markdown to blocks
      Then block 1 is a paragraph with text "This is a simple paragraph."

    @happy-path @paragraphs
    Scenario: Multi-line paragraph joined with space
      Given markdown with a two-line paragraph
      When parsing the markdown to blocks
      Then block 1 is a paragraph with joined text

  Rule: Separators are parsed into SeparatorBlock

    **Invariant:** Lines matching exactly three or more dashes, asterisks, or underscores produce SeparatorBlock.
    **Rationale:** Horizontal rules serve as visual separators in preamble content and must be faithfully represented.
    **Verified by:** Triple dash separator

    @happy-path @separators
    Scenario: Triple dash separator
      Given markdown with a separator between paragraphs
      When parsing the markdown to blocks
      Then the result has a paragraph then separator then paragraph

  Rule: Tables are parsed into TableBlock

    **Invariant:** A line starting with pipe followed by a separator row produces TableBlock with columns from the header and rows from subsequent pipe-delimited lines.
    **Rationale:** Tables are heavily used in preamble content for structured reference data and must preserve column names and cell values exactly.
    **Verified by:** Simple table with header and rows

    @happy-path @tables
    Scenario: Simple table with header and rows
      Given markdown with a two-column table
      When parsing the markdown to blocks
      Then block 1 is a table with the expected columns and rows

  Rule: Unordered lists are parsed into ListBlock

    **Invariant:** Lines starting with dash-space or asterisk-space produce ListBlock with ordered=false and string items.
    **Rationale:** Unordered lists are common in preamble content for enumerating capabilities or constraints.
    **Verified by:** Dash list items, GFM checkbox list items

    @happy-path @lists
    Scenario: Dash list items
      Given markdown with three dash list items
      When parsing the markdown to blocks
      Then block 1 is an unordered list with 3 items

    @edge-case @lists
    Scenario: GFM checkbox list items
      Given markdown with GFM checkbox items
      When parsing the markdown to blocks
      Then block 1 is an unordered list with checkbox text preserved

  Rule: Ordered lists are parsed into ListBlock

    **Invariant:** Lines starting with a digit followed by period-space produce ListBlock with ordered=true.
    **Rationale:** Ordered lists represent sequential steps in procedural guides and must preserve ordering semantics.
    **Verified by:** Numbered list items

    @happy-path @lists
    Scenario: Numbered list items
      Given markdown with three numbered list items
      When parsing the markdown to blocks
      Then block 1 is an ordered list with 3 items

  Rule: Code blocks are parsed into CodeBlock

    **Invariant:** Fenced code blocks with a language info string produce CodeBlock with the language and content fields.
    **Rationale:** Code examples in preamble content must preserve the language annotation for syntax highlighting in generated docs.
    **Verified by:** Code block with language, Empty code block

    @happy-path @code
    Scenario: Code block with language
      Given markdown with a typescript code block
      When parsing the markdown to blocks
      Then block 1 is a code block with language "typescript" and content

    @edge-case @code
    Scenario: Empty code block
      Given markdown with an empty code block
      When parsing the markdown to blocks
      Then block 1 is a code block with empty content

  Rule: Mermaid blocks are parsed into MermaidBlock

    **Invariant:** Code fences with the info string "mermaid" produce MermaidBlock instead of CodeBlock.
    **Rationale:** Mermaid diagrams have a dedicated SectionBlock type for specialized rendering in generated docs.
    **Verified by:** Mermaid diagram block

    @happy-path @mermaid
    Scenario: Mermaid diagram block
      Given markdown with a mermaid diagram
      When parsing the markdown to blocks
      Then block 1 is a mermaid block with graph content

  Rule: Mixed content produces correct block sequence

    **Invariant:** A markdown document with multiple construct types produces blocks in document order with correct types.
    **Rationale:** Preamble files combine headings, paragraphs, code blocks, and tables in sequence. The parser must handle transitions between all state machine states correctly.
    **Verified by:** Mixed content in sequence

    @happy-path @mixed
    Scenario: Mixed content in sequence
      Given markdown with heading, paragraph, table, code, and list
      When parsing the markdown to blocks
      Then 5 blocks are produced in the correct order

  Rule: Bold and inline formatting is preserved in paragraphs

    **Invariant:** Inline markdown formatting such as bold, italic, and code spans are preserved as-is in ParagraphBlock text.
    **Rationale:** The parser produces structural blocks. Inline formatting is the responsibility of the markdown renderer, not the block parser.
    **Verified by:** Bold text preserved in paragraph

    @edge-case @formatting
    Scenario: Bold text preserved in paragraph
      Given markdown with bold and code span formatting
      When parsing the markdown to blocks
      Then block 1 is a paragraph preserving inline formatting
