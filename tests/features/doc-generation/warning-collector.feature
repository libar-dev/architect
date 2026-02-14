@libar-docs
@libar-docs-pattern:WarningCollectorTesting
@libar-docs-implements:WarningCollector
@libar-docs-status:completed
@libar-docs-product-area:Generation
Feature: Warning Collector

  The warning collector provides a unified system for capturing, categorizing,
  and reporting non-fatal issues during document generation. It replaces
  scattered console.warn calls with structured warning handling that integrates
  with the Result pattern.

  Background: Collector setup
    Given a warning collector is initialized

  # ============================================================================
  # RULE 1: Warning Capture
  # ============================================================================

  Rule: Warnings are captured with source context

    Each warning includes the source location, category, and message to
    enable debugging and targeted fixes.

    @acceptance-criteria @unit
    Scenario: Warning includes source file
      Given extraction is processing "src/types.ts"
      When a warning "Missing JSDoc for interface Foo" is raised
      Then the warning includes source "src/types.ts"
      And the warning includes message "Missing JSDoc for interface Foo"

    @acceptance-criteria @unit
    Scenario: Warning includes line number when available
      Given extraction is processing "src/types.ts" at line 42
      When a warning is raised
      Then the warning includes line number 42
      And the warning location is "src/types.ts:42"

    @acceptance-criteria @unit
    Scenario: Warning includes category
      Given extraction encounters a missing shape
      When a warning is raised
      Then the warning has category "extraction"
      And the warning has subcategory "missing-shape"

  # ============================================================================
  # RULE 2: Warning Categories
  # ============================================================================

  Rule: Warnings are categorized for filtering and grouping

    Warning categories enable filtering by severity, source, or type
    for different reporting needs.

    @acceptance-criteria @unit
    Scenario Outline: Warning categories are supported
      Given a warning with category "<category>"
      When the warning is captured
      Then the warning is stored under category "<category>"

      Examples:
        | category |
        | validation |
        | extraction |
        | deduplication |
        | file-access |
        | format |

    @acceptance-criteria @unit
    Scenario: Warnings can be filtered by category
      Given warnings in categories "validation" and "extraction"
      When filtering for "validation" warnings
      Then only validation warnings are returned

    @acceptance-criteria @unit
    Scenario: Warnings can be filtered by source file
      Given warnings from "src/a.ts" and "src/b.ts"
      When filtering for warnings from "src/a.ts"
      Then only warnings from "src/a.ts" are returned

  # ============================================================================
  # RULE 3: Warning Aggregation
  # ============================================================================

  Rule: Warnings are aggregated across the pipeline

    The collector aggregates warnings from all pipeline stages, maintaining
    insertion order and source attribution.

    @acceptance-criteria @unit
    Scenario: Warnings from multiple stages are collected
      Given validation stage produces warning "File may be stale"
      And extraction stage produces warning "Empty rule block"
      And deduplication stage produces warning "Content merged"
      When retrieving all warnings
      Then 3 warnings are returned
      And warnings are in insertion order

    @acceptance-criteria @unit
    Scenario: Warnings are grouped by source file
      Given 3 warnings from "src/a.ts"
      And 2 warnings from "src/b.ts"
      When grouping warnings by source
      Then "src/a.ts" group has 3 warnings
      And "src/b.ts" group has 2 warnings

    @acceptance-criteria @unit
    Scenario: Summary counts by category
      Given 2 validation warnings
      And 3 extraction warnings
      When getting warning summary
      Then summary shows "validation: 2, extraction: 3"

  # ============================================================================
  # RULE 4: Result Integration
  # ============================================================================

  Rule: Warnings integrate with the Result pattern

    The warning collector integrates with Result<T, E> to include warnings
    in successful results, enabling callers to inspect non-fatal issues.

    @acceptance-criteria @unit
    Scenario: Successful result includes warnings
      Given extraction succeeds with 2 warnings
      When the Result is returned
      Then Result.isOk() is true
      And Result.warnings has 2 entries

    @acceptance-criteria @unit
    Scenario: Failed result includes warnings collected before failure
      Given extraction warns "Missing shape" then errors "Invalid syntax"
      When the Result is returned
      Then Result.isError() is true
      And Result.warnings has 1 entry
      And the warning is preserved

    @acceptance-criteria @integration
    Scenario: Warnings propagate through pipeline
      Given source mapper collects warnings
      And decision doc generator collects warnings
      When final Result is returned
      Then all warnings from both stages are present
      And warnings are not duplicated

  # ============================================================================
  # RULE 5: Warning Formatting
  # ============================================================================

  Rule: Warnings can be formatted for different outputs

    The collector provides formatters for console output, JSON, and
    markdown to support different reporting needs.

    @acceptance-criteria @unit
    Scenario: Console format includes color and location
      Given a warning from "src/types.ts:42"
      When formatting for console
      Then output includes yellow color code
      And output is "⚠ src/types.ts:42 - Missing JSDoc"

    @acceptance-criteria @unit
    Scenario: JSON format is machine-readable
      Given a warning with all fields populated
      When formatting as JSON
      Then output is valid JSON
      And includes fields: source, line, category, message

    @acceptance-criteria @unit
    Scenario: Markdown format for documentation
      Given multiple warnings grouped by source
      When formatting as markdown
      Then output includes "## Warnings" header
      And warnings are listed under source file headers

  # ============================================================================
  # RULE 6: Migration from console.warn
  # ============================================================================

  Rule: Existing console.warn calls are migrated to collector

    All console.warn calls in the source mapper and related modules
    are replaced with warning collector calls.

    @acceptance-criteria @integration
    Scenario: Source mapper uses warning collector
      Given extraction triggers a warning condition
      When the warning is raised in source-mapper.ts
      Then no console.warn is called
      And warning appears in collector

    @acceptance-criteria @integration
    Scenario: Shape extractor uses warning collector
      Given a re-export is detected
      When shape extraction warns about re-export
      Then warning is captured with category "extraction"
      And warning includes "re-export" in message
