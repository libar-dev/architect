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

  # ===========================================================================
  # RULE 1: Tab Handling
  # ===========================================================================

  Rule: Tabs are normalized to spaces before dedent

    **Invariant:** Tab characters must be converted to spaces before calculating the minimum indentation level.
    **Rationale:** Mixing tabs and spaces produces incorrect indentation calculations — normalizing first ensures consistent dedent depth.
    **Verified by:** Tab-indented code is properly dedented, Mixed tabs and spaces are normalized

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

  # ===========================================================================
  # RULE 2: Empty Line Handling
  # ===========================================================================

  Rule: Empty lines are handled correctly

    **Invariant:** Empty lines (including lines with only whitespace) must not affect the minimum indentation calculation and must be preserved in output.
    **Verified by:** Empty lines with trailing spaces are preserved, All empty lines returns original text

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

  # ===========================================================================
  # RULE 3: Single Line and Minimal Input
  # ===========================================================================

  Rule: Single line input is handled

    **Invariant:** Single-line input must have its leading whitespace removed without errors or unexpected transformations.
    **Verified by:** Single line with indentation is dedented, Single line without indentation is unchanged

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

  # ===========================================================================
  # RULE 4: Unicode and Special Characters
  # ===========================================================================

  Rule: Unicode whitespace is handled

    **Invariant:** Non-breaking spaces and other Unicode whitespace characters must be treated as content, not as indentation to be removed.
    **Verified by:** Non-breaking space is treated as content

    @edge-case @unicode
    Scenario: Non-breaking space is treated as content
      Given input text with non-breaking spaces in content
      When dedenting the text
      Then the output preserves non-breaking spaces in content

  # ===========================================================================
  # RULE 5: Relative Indentation Preservation
  # ===========================================================================

  Rule: Relative indentation is preserved

    **Invariant:** After removing the common leading whitespace, the relative indentation between lines must remain unchanged.
    **Verified by:** Nested code blocks preserve relative indentation, Mixed indentation levels are preserved relatively

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
