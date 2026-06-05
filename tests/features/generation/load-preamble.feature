@architect
@architect-pattern:LoadPreambleParser
@architect-status:active
@architect-implements:MarkdownBlockParser
@architect-product-area:Generation
@behavior @load-preamble
Feature: Markdown-to-Block Parser

  The parseMarkdownToBlocks function converts raw markdown content into
  a readonly Block[] array using a 5-state line-by-line state machine.
  This enables preamble content to be authored as markdown files instead of
  verbose inline TypeScript object literals.

  **Problem:**
  Preamble content authored as inline TypeScript Block[] literals is
  verbose (540+ lines per codec config) and hard to review.

  **Solution:**
  A shared parser reads markdown and produces the same Block[] shape
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

  Rule: Code-fence language is a single identifier-shaped token

    **Invariant:** The language emitted for a fenced code block is the first whitespace-delimited token of the info string, kept only when it is identifier-shaped (1-64 characters of letters, digits, underscore, plus, hyphen, or dot); a non-conforming or absent token yields a code block with no language.
    **Rationale:** The canonical CodeBlockSchema constrains `language` to that identifier shape, and CommonMark treats the first word of a code-fence info string as the language. Normalizing at parse time keeps every emitted code block valid against the one shared block vocabulary.
    **Verified by:** Info string with a trailing attribute keeps only the language token, Non-identifier info string yields no language

    @edge-case @code
    Scenario: Info string with a trailing attribute keeps only the language token
      Given markdown with a code fence info string carrying extra tokens
      When parsing the markdown to blocks
      Then block 1 is a code block with language "ts"

    @edge-case @code
    Scenario: Non-identifier info string yields no language
      Given markdown with a non-identifier code fence info string
      When parsing the markdown to blocks
      Then block 1 is a code block with no language

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

  Rule: Parser output validates against the canonical block schema

    **Invariant:** Every block parseMarkdownToBlocks emits validates against the canonical BlockSchema from architect-core; the parser shares one block vocabulary with the projection renderers rather than a divergent shape.
    **Rationale:** The two former block vocabularies (architect-core SectionBlock, architect-projection BlockSchema) were reconciled to one canonical BlockSchema in architect-core (No-BC). Validating parser output against that schema at the test boundary makes producer/schema drift impossible.
    **Verified by:** A mixed markdown document's blocks all validate against the canonical schema

    @happy-path @schema
    Scenario: A mixed markdown document's blocks all validate against the canonical schema
      Given markdown with heading, paragraph, table, code, and list
      When parsing the markdown to blocks
      Then every produced block validates against the canonical block schema
