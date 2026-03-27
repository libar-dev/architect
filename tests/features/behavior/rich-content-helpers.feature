@architect
@architect-pattern:RichContentHelpersTesting
@architect-implements:RichContentHelpers
@architect-status:completed
@architect-unlock-reason:Retroactive-completion
@architect-phase:44
@architect-product-area:Generation
@behavior

Feature: Rich Content Rendering Helpers
  As a document codec author
  I need helpers to render Gherkin rich content
  So that DataTables, DocStrings, and scenarios render consistently across codecs

  The helpers handle edge cases like:
  - Unclosed DocStrings (fallback to plain paragraph)
  - Windows CRLF line endings (normalized to LF)
  - Empty inputs (graceful handling)
  - Missing table cells (empty string fallback)

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | parseDescriptionWithDocStrings helper | complete | src/renderable/codecs/helpers.ts |
      | renderDataTable helper | complete | src/renderable/codecs/helpers.ts |
      | renderScenarioContent helper | complete | src/renderable/codecs/helpers.ts |

  Rule: DocString parsing handles edge cases

    **Invariant:** DocString parsing must gracefully handle empty input, missing language hints, unclosed delimiters, and non-LF line endings without throwing errors.
    **Rationale:** Codecs receive uncontrolled user content from feature file descriptions; unhandled edge cases would crash document generation for the entire pipeline.
    **Verified by:** Empty description returns empty array, Description with no DocStrings returns single paragraph, Single DocString parses correctly, DocString without language hint uses text, Unclosed DocString returns plain paragraph fallback, Windows CRLF line endings are normalized

    Scenario: Empty description returns empty array
      Given a description ""
      When parsing for DocStrings
      Then the result is an empty array

    Scenario: Description with no DocStrings returns single paragraph
      Given a description "This is plain text without any code blocks."
      When parsing for DocStrings
      Then the result contains 1 block
      And block 1 is a paragraph with text "This is plain text without any code blocks."

    @acceptance-criteria
    Scenario: Single DocString parses correctly
      Given a description with embedded DocString containing typescript code
      When parsing for DocStrings
      Then the result contains 3 blocks with types:
        | index | type      | language   |
        | 1     | paragraph |            |
        | 2     | code      | typescript |
        | 3     | paragraph |            |

    Scenario: DocString without language hint uses text
      Given a description with embedded DocString without language hint
      When parsing for DocStrings
      Then block 2 is a code block with language "text"

    Scenario: Unclosed DocString returns plain paragraph fallback
      Given a description with unclosed DocString
      When parsing for DocStrings
      Then the result contains 1 block
      And block 1 is a paragraph

    Scenario: Windows CRLF line endings are normalized
      Given a description with CRLF line endings
      When parsing for DocStrings
      Then line endings are normalized to LF

  Rule: DataTable rendering produces valid markdown

    **Invariant:** DataTable rendering must produce a well-formed table block for any number of rows, substituting empty strings for missing cell values.
    **Rationale:** Malformed tables break markdown rendering and downstream tooling; missing cells would produce undefined values that corrupt table alignment.
    **Verified by:** Single row DataTable renders correctly, Multi-row DataTable renders correctly, Missing cell values become empty strings

    Scenario: Single row DataTable renders correctly
      Given a DataTable with headers "Name" and "Value"
      And a row with values "foo" and "bar"
      When rendering the DataTable
      Then the output is a table block with 1 row

    @acceptance-criteria
    Scenario: Multi-row DataTable renders correctly
      Given a DataTable with headers "A" and "B" and "C"
      And rows:
        | A | B | C |
        | 1 | 2 | 3 |
        | 4 | 5 | 6 |
      When rendering the DataTable
      Then the output is a table block with 2 rows

    Scenario: Missing cell values become empty strings
      Given a DataTable with headers "Col1" and "Col2"
      And a row with only "Col1" value "only-first"
      When rendering the DataTable
      Then the row has empty string for "Col2"

  Rule: Scenario content rendering respects options

    **Invariant:** Scenario rendering must honor the includeSteps option, producing step lists only when enabled, and must include embedded DataTables when present.
    **Rationale:** Ignoring the includeSteps option would bloat summary views with unwanted detail, and dropping embedded DataTables would lose structured test data.
    **Verified by:** Render scenario with steps, Skip steps when includeSteps is false, Render scenario with DataTable in step

    @acceptance-criteria
    Scenario: Render scenario with steps
      Given a scenario "Test Scenario" with steps:
        | keyword | text          |
        | Given   | initial state |
        | When    | action taken  |
        | Then    | expected result |
      When rendering scenario content with default options
      Then the output contains a list block with 3 items

    Scenario: Skip steps when includeSteps is false
      Given a scenario "Test Scenario" with steps:
        | keyword | text          |
        | Given   | some step     |
      When rendering scenario content with includeSteps false
      Then the output does not contain a list block

    Scenario: Render scenario with DataTable in step
      Given a scenario "Table Test" with a step containing a DataTable
      When rendering scenario content with default options
      Then the output contains a table block

  Rule: Business rule rendering handles descriptions

    **Invariant:** Business rule rendering must always include the rule name as a bold paragraph, and must parse descriptions for embedded DocStrings when present.
    **Rationale:** Omitting the rule name makes rendered output unnavigable, and skipping DocString parsing would output raw delimiter syntax instead of formatted code blocks.
    **Verified by:** Rule with simple description, Rule with no description, Rule with embedded DocString in description

    @acceptance-criteria
    Scenario: Rule with simple description
      Given a business rule "Must validate input" with description "Ensures all input is validated."
      When rendering the business rule
      Then the output contains a bold paragraph with the rule name
      And the output contains the description as a paragraph

    Scenario: Rule with no description
      Given a business rule "Simple Rule" with no description
      When rendering the business rule
      Then the output contains a bold paragraph with the rule name
      And no description paragraph is rendered

    Scenario: Rule with embedded DocString in description
      Given a business rule "Code Example" with description containing a DocString
      When rendering the business rule
      Then the description is parsed for DocStrings
      And code blocks are rendered from embedded DocStrings

  # ═══════════════════════════════════════════════════════════════════════════
  # DocString Dedentation
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: DocString content is dedented when parsed

    **Invariant:** DocString code blocks must be dedented to remove common leading whitespace while preserving internal relative indentation, empty lines, and trimming trailing whitespace from each line.
    **Rationale:** Without dedentation, code blocks inherit the Gherkin indentation level, rendering as deeply indented and unreadable in generated markdown.
    **Verified by:** Code block preserves internal relative indentation, Empty lines in code block are preserved, Trailing whitespace is trimmed from each line, Code with mixed indentation is preserved

    @acceptance-criteria
    Scenario: Code block preserves internal relative indentation
      Given a description with DocString containing nested code
      When parsing for DocStrings
      Then the code block has correct nested indentation

    Scenario: Empty lines in code block are preserved
      Given a description with DocString containing empty lines:
        """
        line1

        line2
        """
      When parsing for DocStrings
      Then the code block contains 3 lines
      And line 2 of the code block is empty

    Scenario: Trailing whitespace is trimmed from each line
      Given a description with DocString where lines have trailing spaces
      When parsing for DocStrings
      Then no line in the code block ends with whitespace

    Scenario: Code with mixed indentation is preserved
      Given a description with DocString containing mixed indent code
      When parsing for DocStrings
      Then the code block preserves the indentation structure
