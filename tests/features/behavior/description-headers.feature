Feature: Description Header Normalization

  Pattern descriptions should not create duplicate headers when rendered.
  When directive descriptions start with markdown headers, those headers
  should be stripped before rendering under the "Description" section.

  Background: Patterns codec test context
    Given a patterns codec test context

  # ===========================================================================
  # Rule 1: Strip leading markdown headers from descriptions
  # ===========================================================================

  Rule: Leading headers are stripped from pattern descriptions

    Scenario: Strip single leading markdown header
      Given a pattern with directive description:
        """
        ## Poison Event Handling

        Events that fail processing are tracked and isolated.
        """
      When the pattern detail document is generated
      Then the output contains "## Description"
      And the Description section contains "Events that fail processing"
      And the output does not contain "## Poison Event Handling"

    Scenario: Strip multiple leading headers
      Given a pattern with directive description:
        """
        ## Topic Name
        ### Subtopic

        Actual content starts here.
        """
      When the pattern detail document is generated
      Then the Description section contains "Actual content starts here"
      And the Description section does not contain "## Topic Name"
      And the Description section does not contain "### Subtopic"

    Scenario: Preserve description without leading header
      Given a pattern with directive description:
        """
        Events that fail processing are tracked and isolated.
        They are moved to a poison queue for manual review.
        """
      When the pattern detail document is generated
      Then the Description section contains "Events that fail processing"
      And no headers were stripped

  # ===========================================================================
  # Rule 2: Handle edge cases
  # ===========================================================================

  Rule: Edge cases are handled correctly

    Scenario: Empty description after stripping headers
      Given a pattern with directive description:
        """
        ## Just a Header
        """
      When the pattern detail document is generated
      Then no Description section is rendered

    Scenario: Description with only whitespace and headers
      Given a pattern with directive description:
        """

        ## Header Only

        """
      When the pattern detail document is generated
      Then no Description section is rendered

    Scenario: Header in middle of description is preserved
      Given a pattern with directive description:
        """
        Introduction paragraph.

        ## Section Header

        More content after header.
        """
      When the pattern detail document is generated
      Then the Description section contains "Introduction paragraph"
      And the Description section contains "## Section Header"

  # ===========================================================================
  # Rule 3: stripLeadingHeaders helper function
  # ===========================================================================

  Rule: stripLeadingHeaders removes only leading headers

    Scenario: Strips h1 header
      Given text "# Title\n\nContent"
      When stripLeadingHeaders is called
      Then the result is "Content"

    Scenario: Strips h2 through h6 headers
      Given text "### Heading\n\nContent"
      When stripLeadingHeaders is called
      Then the result is "Content"

    Scenario: Strips leading empty lines before header
      Given text "\n\n## Header\n\nContent"
      When stripLeadingHeaders is called
      Then the result is "Content"

    Scenario: Preserves content starting with text
      Given text "Content without header"
      When stripLeadingHeaders is called
      Then the result is "Content without header"

    Scenario: Returns empty string for header-only input
      Given text "## Header Only"
      When stripLeadingHeaders is called
      Then the result is ""

    Scenario: Handles null/undefined input
      Given null text
      When stripLeadingHeaders is called
      Then the result is null
