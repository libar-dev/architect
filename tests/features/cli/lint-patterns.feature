@libar-docs
@libar-docs-pattern:LintPatternsCli
@libar-docs-status:completed
@libar-docs-product-area:DataAPI
@libar-docs-implements:CliBehaviorTesting
@cli @lint-patterns
Feature: lint-patterns CLI
  Command-line interface for validating pattern annotation quality.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    @happy-path
    Scenario: Display help with --help flag
      When running "lint-patterns --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display version with -v flag
      When running "lint-patterns -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input patterns

    @validation
    Scenario: Fail without --input flag
      When running "lint-patterns"
      Then exit code is 1
      And output contains "No input patterns"

  # ============================================================================
  # RULE 3: Lint Passes
  # ============================================================================

  Rule: Lint passes for valid patterns

    @happy-path
    Scenario: Lint passes for complete annotations
      Given a TypeScript file "src/pattern.ts" with complete annotations
      When running "lint-patterns -i src/pattern.ts"
      Then exit code is 0
      And stdout contains "No issues found"

  # ============================================================================
  # RULE 4: Lint Rule Enforcement
  # ============================================================================

  Rule: Lint detects violations in incomplete patterns

    @validation
    Scenario: Report violations for incomplete annotations
      Given a TypeScript file "src/missing.ts" without pattern name
      When running "lint-patterns -i src/missing.ts"
      Then exit code is 1
      And stdout contains "error"

  # ============================================================================
  # RULE 5: Output Formats
  # ============================================================================

  Rule: CLI supports multiple output formats

    @happy-path
    Scenario: JSON output format
      Given a TypeScript file "src/pattern.ts" with complete annotations
      When running "lint-patterns -i src/pattern.ts --format json"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Pretty output format is default
      Given a TypeScript file "src/pattern.ts" with complete annotations
      When running "lint-patterns -i src/pattern.ts"
      Then exit code is 0
      And stdout contains "No issues found"

  # ============================================================================
  # RULE 6: Strict Mode
  # ============================================================================

  Rule: Strict mode treats warnings as errors

    @validation
    Scenario: Strict mode fails on warnings
      Given a TypeScript file "src/warning.ts" with missing status
      When running "lint-patterns -i src/warning.ts --strict"
      Then exit code is 1

    @happy-path
    Scenario: Non-strict mode passes with warnings
      Given a TypeScript file "src/warning.ts" with missing status
      When running "lint-patterns -i src/warning.ts"
      Then exit code is 0
