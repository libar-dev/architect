@libar-docs
@libar-docs-pattern:DedentHelper
@libar-docs-status:completed
@libar-docs-product-area:Generation
@behavior @dedent
Feature: Dedent Helper Function Edge Cases

  The dedent helper function normalizes indentation in code blocks extracted
  from DocStrings. It handles various whitespace patterns including tabs,
  mixed indentation, and edge cases.

  **Problem:**
  - DocStrings in Gherkin files have consistent indentation for alignment
  - Tab characters vs spaces create inconsistent indentation calculation
  - Edge cases like empty lines, all-empty input, single lines need handling

  **Solution:**
  - Normalize tabs to spaces before calculating minimum indentation
  - Handle edge cases gracefully without throwing errors
  - Preserve relative indentation after removing common prefix

  Background:
    Given a dedent test context

  # =============================================================================
  # Tab Handling
  # =============================================================================

  Rule: Tabs are normalized to spaces before dedent

    @happy-path @tabs
    Scenario: Tab-indented code is properly dedented
      Given input text with tab indentation:
        """
        		const x = 1;
        		const y = 2;
        """
      When dedenting the text
      Then the output is:
        """
        const x = 1;
        const y = 2;
        """

    @edge-case @tabs
    Scenario: Mixed tabs and spaces are normalized
      Given input text with mixed indentation:
        """
        	  const x = 1;
        	  const y = 2;
        """
      When dedenting the text
      Then the output has no leading whitespace on first non-empty line

  # =============================================================================
  # Empty Line Handling
  # =============================================================================

  Rule: Empty lines are handled correctly

    @edge-case @empty-lines
    Scenario: Empty lines with trailing spaces are preserved
      Given input text:
        """
            function foo() {

              return 42;
            }
        """
      When dedenting the text
      Then empty lines remain in output
      And the output preserves relative indentation

    @edge-case @empty-lines
    Scenario: All empty lines returns original text
      Given input with only empty lines
      When dedenting the text
      Then the output equals the input

  # =============================================================================
  # Single Line and Minimal Input
  # =============================================================================

  Rule: Single line input is handled

    @edge-case @single-line
    Scenario: Single line with indentation is dedented
      Given input text "    const x = 1;"
      When dedenting the text
      Then the output is "const x = 1;"

    @edge-case @single-line
    Scenario: Single line without indentation is unchanged
      Given input text "const x = 1;"
      When dedenting the text
      Then the output is "const x = 1;"

  # =============================================================================
  # Unicode and Special Characters
  # =============================================================================

  Rule: Unicode whitespace is handled

    @edge-case @unicode
    Scenario: Non-breaking space is treated as content
      Given input text with non-breaking spaces in content
      When dedenting the text
      Then the output preserves non-breaking spaces in content

  # =============================================================================
  # Relative Indentation Preservation
  # =============================================================================

  Rule: Relative indentation is preserved

    @happy-path @relative-indent
    Scenario: Nested code blocks preserve relative indentation
      Given input text:
        """
            function foo() {
              if (true) {
                return 42;
              }
            }
        """
      When dedenting the text
      Then the output is:
        """
        function foo() {
          if (true) {
            return 42;
          }
        }
        """

    @edge-case @relative-indent
    Scenario: Mixed indentation levels are preserved relatively
      Given input text:
        """
            level0
              level1
                level2
              level1
            level0
        """
      When dedenting the text
      Then the output is:
        """
        level0
          level1
            level2
          level1
        level0
        """
