@architect
@architect-pattern:DescriptionHeaderNormalization
@architect-status:completed
@architect-product-area:Generation
Feature: Description Header Normalization

  Pattern descriptions should not create duplicate headers when rendered.
  If directive descriptions start with markdown headers, those headers
  should be stripped before rendering under the "Description" section.

  Background: Patterns codec test context
    Given a patterns codec test context

  # ===========================================================================
  # Rule 1: Strip leading markdown headers from descriptions
  # ===========================================================================

  Rule: Leading headers are stripped from pattern descriptions

    **Invariant:** Markdown headers at the start of a pattern description are removed before rendering to prevent duplicate headings under the Description section.
    **Rationale:** The codec already emits a "## Description" header; preserving the source header would create a redundant or conflicting heading hierarchy.
    **Verified by:** Strip single leading markdown header, Strip multiple leading headers, Preserve description without leading header

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
      And the Description section does not contain any of:
        | header |
        | ## Topic Name |
        | ### Subtopic |

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

    **Invariant:** Header stripping handles degenerate inputs (header-only, whitespace-only, mid-description headers) without data loss or rendering errors.
    **Rationale:** Patterns with unusual descriptions (header-only stubs, whitespace padding) are common in early roadmap stages; crashing on these would block documentation generation for the entire dataset.
    **Verified by:** Empty description after stripping headers, Description with only whitespace and headers, Header in middle of description is preserved

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
      Given a pattern with description containing middle header
      When the pattern detail document is generated
      Then the Description section contains "Introduction paragraph"
      And the Description section contains middle header text

  # ===========================================================================
  # Rule 3: stripLeadingHeaders helper function
  # ===========================================================================

  Rule: stripLeadingHeaders removes only leading headers

    **Invariant:** The helper function strips only headers that appear before any non-header content; headers occurring after body text are preserved.
    **Rationale:** Mid-description headers are intentional structural elements authored by the user; stripping them would silently destroy document structure.
    **Verified by:** Strips h1 header, Strips h2 through h6 headers, Strips leading empty lines before header, Preserves content starting with text, Returns empty string for header-only input, Handles null/undefined input

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
