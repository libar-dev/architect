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

    Scenario: Single table renders once in detailed mode
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Command categories |
        | description | **Invariant:** Categories must be valid.\n\n\| Category \| Purpose \|\n\| --- \| --- \|\n\| aggregate \| State change \|\n\| process \| Workflow \| |
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

    Scenario: Two tables in description render as two separate tables
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Multiple table rule |
        | description | First table:\n\| A \| B \|\n\| --- \| --- \|\n\| 1 \| 2 \|\n\nSecond table:\n\| X \| Y \|\n\| --- \| --- \|\n\| 3 \| 4 \| |
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains exactly 2 tables
      And the first table has header "A"
      And the second table has header "X"

  # ===========================================================================
  # Rule 3: stripMarkdownTables helper function
  # ===========================================================================

  Rule: stripMarkdownTables removes table syntax from text

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
