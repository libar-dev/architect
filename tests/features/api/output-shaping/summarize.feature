@libar-docs
@libar-docs-pattern:PatternSummarizeTests
@libar-docs-status:active
@libar-docs-product-area:DataAPI
Feature: Pattern Summarization

  Validates that summarizePattern() projects ExtractedPattern (~3.5KB) to
  PatternSummary (~100 bytes) with the correct 6 fields.

  Rule: summarizePattern projects to compact summary

    @acceptance-criteria @happy-path
    Scenario: Summary includes all 6 fields for a TypeScript pattern
      Given a TypeScript pattern "OrderSaga" with status "active" in phase 22
      When I summarize the pattern
      Then the summary has patternName "OrderSaga"
      And the summary has status "active"
      And the summary has category "projection"
      And the summary has phase 22
      And the summary has source "typescript"
      And the summary file ends with ".ts"

    @acceptance-criteria @happy-path
    Scenario: Summary includes all 6 fields for a Gherkin pattern
      Given a Gherkin pattern "ProcessGuard" with status "roadmap" in phase 18
      When I summarize the pattern
      Then the summary has patternName "ProcessGuard"
      And the summary has status "roadmap"
      And the summary has source "gherkin"
      And the summary file ends with ".feature"

    @acceptance-criteria @happy-path
    Scenario: Summary uses patternName tag over name field
      Given a pattern with name "internal-name" and patternName tag "PublicName"
      When I summarize the pattern
      Then the summary has patternName "PublicName"

    @acceptance-criteria @edge-case
    Scenario: Summary omits undefined optional fields
      Given a pattern without status or phase
      When I summarize the pattern
      Then the summary does not have a status field
      And the summary does not have a phase field

  Rule: summarizePatterns batch processes arrays

    @acceptance-criteria @happy-path
    Scenario: Batch summarization returns correct count
      Given 5 patterns exist with various statuses
      When I summarize all patterns
      Then I get 5 summaries
      And each summary has a patternName field
