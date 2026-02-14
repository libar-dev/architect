@libar-docs
@libar-docs-pattern:OutputPipelineTests
@libar-docs-status:active
@libar-docs-product-area:DataAPI
Feature: Output Modifier Pipeline

  Validates the output pipeline transforms: summarization, modifiers,
  list filters, empty stripping, and format output.

  Rule: Output modifiers apply with correct precedence

    @acceptance-criteria @happy-path
    Scenario: Default mode returns summaries for pattern arrays
      Given 3 patterns in the pipeline
      When I apply the output pipeline with default modifiers
      Then the output is an array of 3 summaries
      And each summary has a patternName field

    @acceptance-criteria @happy-path
    Scenario: Count modifier returns integer
      Given 5 patterns in the pipeline
      When I apply the output pipeline with count modifier
      Then the output is the number 5

    @acceptance-criteria @happy-path
    Scenario: Names-only modifier returns string array
      Given 3 patterns named "Alpha", "Beta", "Gamma" in the pipeline
      When I apply the output pipeline with names-only modifier
      Then the output is an array of strings "Alpha", "Beta", "Gamma"

    @acceptance-criteria @happy-path
    Scenario: Fields modifier picks specific fields
      Given 2 patterns in the pipeline
      When I apply the output pipeline with fields "patternName,status"
      Then each output object has only "patternName" and "status" keys

    @acceptance-criteria @happy-path
    Scenario: Full modifier bypasses summarization
      Given 2 patterns in the pipeline
      When I apply the output pipeline with full modifier
      Then each output object has a "directive" field

    @acceptance-criteria @happy-path
    Scenario: Scalar input passes through unchanged
      Given a scalar value in the pipeline
      When I apply the output pipeline with default modifiers
      Then the output equals the original scalar

    @edge-case
    Scenario: Fields with single field returns objects with one key
      Given 5 patterns in the pipeline
      When I apply the output pipeline with fields "patternName"
      Then each result object has exactly 1 key

  Rule: Modifier conflicts are rejected

    @acceptance-criteria @validation
    Scenario: Full combined with names-only is rejected
      When I validate modifiers with full and names-only both true
      Then validation fails with "Conflicting modifiers"

    @acceptance-criteria @validation
    Scenario: Full combined with count is rejected
      When I validate modifiers with full and count both true
      Then validation fails with "Conflicting modifiers"

    @acceptance-criteria @validation
    Scenario: Full combined with fields is rejected
      When I validate modifiers with full and fields "patternName"
      Then validation fails with "Conflicting modifiers"

    @acceptance-criteria @validation
    Scenario: Invalid field name is rejected
      When I validate modifiers with fields "patternName,bogusField"
      Then validation fails with "Invalid field names: bogusField"

  Rule: List filters compose via AND logic

    @acceptance-criteria @happy-path
    Scenario: Filter by status returns matching patterns
      Given a dataset with 3 active and 2 roadmap patterns
      When I apply list filters with status "active"
      Then 3 patterns are returned

    @acceptance-criteria @happy-path
    Scenario: Filter by status and category narrows results
      Given a dataset with active patterns in categories "core" and "api"
      When I apply list filters with status "active" and category "core"
      Then only core patterns are returned

    @acceptance-criteria @happy-path
    Scenario: Pagination with limit and offset
      Given a dataset with 10 roadmap patterns
      When I apply list filters with limit 3 and offset 2
      Then 3 patterns are returned starting from index 2

    @edge-case
    Scenario: Offset beyond array length returns empty results
      Given a dataset with 3 roadmap patterns
      When I apply list filters with status "roadmap" and limit 5 and offset 10
      Then 0 patterns are returned

  Rule: Empty stripping removes noise

    @acceptance-criteria @happy-path
    Scenario: Null and empty values are stripped
      Given an object with null, empty string, and empty array values
      When I strip empty values
      Then the result does not contain null values
      And the result does not contain empty strings
      And the result does not contain empty arrays
