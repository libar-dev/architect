@libar-docs
@libar-docs-pattern:ExtractSummary
@libar-docs-status:completed
@libar-docs-product-area:Behavior
@renderable @utils
Feature: Extract Summary from Pattern Descriptions
  The extractSummary function transforms multi-line pattern descriptions into
  concise, single-line summaries suitable for table display in generated docs.

  **Key behaviors:**
  - Combines multiple lines until finding a complete sentence
  - Truncates at sentence boundaries when possible
  - Adds "..." for incomplete text (no sentence ending)
  - Skips tautological first lines (just the pattern name)
  - Skips section header labels like "Problem:", "Solution:"

  Background:
    Given an extract summary test context

  # ============================================================================
  # Single-line descriptions
  # ============================================================================

  @function:extractSummary @happy-path
  Rule: Single-line descriptions are returned as-is when complete

    Scenario: Complete sentence on single line
      When I extract summary from:
        """
        This is a complete sentence.
        """
      Then the summary should be "This is a complete sentence."

    Scenario: Single line without sentence ending gets ellipsis
      When I extract summary from:
        """
        This text has no period at the end
        """
      Then the summary should be "This text has no period at the end..."

  # ============================================================================
  # Multi-line combining
  # ============================================================================

  @function:extractSummary
  Rule: Multi-line descriptions are combined until sentence ending

    Scenario: Two lines combine into complete sentence
      When I extract summary from:
        """
        Problem: Events are stored in the Event Store but there's no
        infrastructure for routing them to subscribers.
        """
      Then the summary should be "Problem: Events are stored in the Event Store but there's no infrastructure for routing them to subscribers."

    Scenario: Combines lines up to sentence boundary within limit
      When I extract summary from:
        """
        Events are stored in the Event Store.
        Additional context follows here.

        How It Works:
        - Parse annotations in Rule descriptions
        """
      Then the summary should be "Events are stored in the Event Store."

    Scenario: Long multi-line text truncates when exceeds limit
      When I extract summary from:
        """
        Business Value: Provide audit-ready traceability matrices that demonstrate
        test coverage for business rules without manual documentation.
        """
      Then the summary should end with "..."
      And the summary should be at most 120 characters

    Scenario: Multi-line without sentence ending gets ellipsis
      When I extract summary from:
        """
        The delivery process uses dual sources (TypeScript phase files and Gherkin
        feature files) that must remain consistent
        """
      Then the summary should be "The delivery process uses dual sources (TypeScript phase files and Gherkin feature files) that must remain consistent..."

  # ============================================================================
  # Truncation behavior
  # ============================================================================

  @function:extractSummary
  Rule: Long descriptions are truncated at sentence or word boundaries

    Scenario: Long text truncates at sentence boundary within limit
      When I extract summary from:
        """
        Short first sentence. This is a much longer second sentence that would push us over the 120 character limit if we included it in the summary output.
        """
      Then the summary should be "Short first sentence."

    Scenario: Long text without sentence boundary truncates at word with ellipsis
      When I extract summary from:
        """
        This is a very long description without any sentence ending punctuation that continues on and on and on until it exceeds the maximum allowed length for summaries
        """
      Then the summary should end with "..."
      And the summary should be at most 120 characters

  # ============================================================================
  # Skipping logic
  # ============================================================================

  @function:extractSummary
  Rule: Tautological and header lines are skipped

    Scenario: Skips pattern name as first line
      When I extract summary from "EventBusRouting":
        """
        EventBusRouting
        Events are stored but there's no routing infrastructure.
        """
      Then the summary should be "Events are stored but there's no routing infrastructure."

    Scenario: Skips section header labels
      When I extract summary from:
        """
        Problem:
        Events are stored but there's no routing infrastructure.
        """
      Then the summary should be "Events are stored but there's no routing infrastructure."

    Scenario: Skips multiple header patterns
      When I extract summary from:
        """
        Solution:
        Use a pub/sub pattern with event routing.
        """
      Then the summary should be "Use a pub/sub pattern with event routing."

  # ============================================================================
  # Edge cases
  # ============================================================================

  @function:extractSummary @edge-case
  Rule: Edge cases are handled gracefully

    Scenario: Empty description returns empty string
      When I extract summary from:
        """
        """
      Then the summary should be ""

    Scenario: Markdown headers are stripped
      When I extract summary from:
        """
        # Pattern Title
        This is the actual content.
        """
      Then the summary should be "This is the actual content."

    Scenario: Bold markdown is stripped
      When I extract summary from:
        """
        **Problem:** This is bold text that explains the issue.
        """
      Then the summary should be "Problem: This is bold text that explains the issue."

    Scenario: Multiple sentence endings - takes first complete sentence
      When I extract summary from:
        """
        First sentence here! Second sentence follows. Third one too.
        """
      Then the summary should be "First sentence here!"

    Scenario: Question mark as sentence ending
      When I extract summary from:
        """
        Why does this matter? Because it affects everything.
        """
      Then the summary should be "Why does this matter?"
