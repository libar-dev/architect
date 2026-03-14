@architect
@architect-pattern:TableExtraction
@architect-status:completed
@architect-product-area:Generation
Feature: Table Extraction Without Duplication

  Tables in business rule descriptions should appear exactly once in output.
  The extractTables() function extracts tables for proper formatting, and
  stripMarkdownTables() removes them from the raw text to prevent duplicates.

  Background: Business rules codec test context
    Given a business rules codec test context

  # ===========================================================================
  # Rule 1: Tables appear once in rendered output
  # ===========================================================================

  Rule: Tables in rule descriptions render exactly once

    **Invariant:** Each markdown table in a rule description appears exactly once in the rendered output, with no residual pipe characters in surrounding text.
    **Rationale:** Without deduplication, tables extracted for formatting would also remain in the raw description text, producing duplicate output.
    **Verified by:** Single table renders once in detailed mode, Table is extracted and properly formatted

    Scenario: Single table renders once in detailed mode
      Given a pattern with a rule named "Command categories" and description:
        """
        Categories must be valid.

        | Category | Purpose |
        | --- | --- |
        | aggregate | State change |
        | process | Workflow |
        """
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains exactly 1 table with header "Category"
      And the document does not contain raw pipe characters in text paragraphs

    Scenario: Table is extracted and properly formatted
      Given a pattern with a rule containing a markdown table with columns "Input" and "Output"
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains a table block with headers "Input" and "Output"
      And the table rows are properly aligned

  # ===========================================================================
  # Rule 2: Multiple tables each render once
  # ===========================================================================

  Rule: Multiple tables in description each render exactly once

    **Invariant:** When a rule description contains multiple markdown tables, each table renders as a separate formatted table block with no merging or duplication.
    **Rationale:** Merging or dropping tables would lose distinct data structures that the author intentionally separated, corrupting the rendered documentation.
    **Verified by:** Two tables in description render as two separate tables

    Scenario: Two tables in description render as two separate tables
      Given a pattern with a rule named "Multiple table rule" and description:
        """
        First table:
        | A | B |
        | --- | --- |
        | 1 | 2 |

        Second table:
        | X | Y |
        | --- | --- |
        | 3 | 4 |
        """
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains exactly 2 tables
      And the first table has header "A"
      And the second table has header "X"

  # ===========================================================================
  # Rule 3: stripMarkdownTables helper function
  # ===========================================================================

  Rule: stripMarkdownTables removes table syntax from text

    **Invariant:** stripMarkdownTables removes all pipe-delimited table syntax from input text while preserving all surrounding content unchanged.
    **Rationale:** If table syntax is not stripped from the raw text, the same table data appears twice in the rendered output -- once from the extracted table block and once as raw pipe characters in the description.
    **Verified by:** Strips single table from text, Strips multiple tables from text, Preserves text without tables

    Scenario: Strips single table from text
      Given text containing a markdown table:
        """
        Introduction text.

        | Col1 | Col2 |
        | --- | --- |
        | A | B |

        Conclusion text.
        """
      When stripMarkdownTables is called
      Then the result is:
        """
        Introduction text.

        Conclusion text.
        """

    Scenario: Strips multiple tables from text
      Given text containing two markdown tables
      When stripMarkdownTables is called
      Then the result contains no pipe characters at line starts

    Scenario: Preserves text without tables
      Given text without any markdown tables
      When stripMarkdownTables is called
      Then the result is unchanged
