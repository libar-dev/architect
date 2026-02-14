@libar-docs-implements:CliBehaviorTesting
@cli @validate-patterns
Feature: validate-patterns CLI
  Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    @happy-path
    Scenario: Display help with --help flag
      When running "validate-patterns --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display help with -h flag
      When running "validate-patterns -h"
      Then exit code is 0
      And stdout contains "--input"

    @happy-path
    Scenario: Display version with --version flag
      When running "validate-patterns --version"
      Then exit code is 0
      And stdout contains "validate-patterns"

    @happy-path
    Scenario: Display version with -v flag
      When running "validate-patterns -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input and feature patterns

    @validation
    Scenario: Fail without --input flag
      When running "validate-patterns -F features/*.feature"
      Then exit code is 1
      And stderr contains "No TypeScript sources specified"

    @validation
    Scenario: Fail without --features flag
      When running "validate-patterns -i src/*.ts"
      Then exit code is 1
      And stderr contains "No feature files specified"

  # ============================================================================
  # RULE 3: Cross-Source Validation
  # ============================================================================

  Rule: CLI validates patterns across TypeScript and Gherkin sources

    @happy-path
    Scenario: Validation passes for matching patterns
      Given a TypeScript file "src/pattern.ts" with pattern "TestPattern" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "TestPattern" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And stdout contains "All validations passed"

    @validation
    Scenario: Detect phase mismatch between sources
      Given a TypeScript file "src/pattern.ts" with pattern "MismatchPattern" at phase 1 status "active"
      And a Gherkin file "features/test.feature" with pattern "MismatchPattern" at phase 2 status "active"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 1
      And stdout contains "Phase mismatch"

    @validation
    Scenario: Detect status mismatch between sources
      Given a TypeScript file "src/pattern.ts" with pattern "StatusMismatch" at phase 1 status "active"
      And a Gherkin file "features/test.feature" with pattern "StatusMismatch" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 1
      And stdout contains "Status mismatch"

  # ============================================================================
  # RULE 4: Output Formats
  # ============================================================================

  Rule: CLI supports multiple output formats

    @happy-path
    Scenario: JSON output format
      Given a TypeScript file "src/pattern.ts" with pattern "JsonTest" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "JsonTest" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature --format json"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Pretty output format is default
      Given a TypeScript file "src/pattern.ts" with pattern "PrettyTest" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "PrettyTest" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And stdout contains "Pattern Validation Summary"

  # ============================================================================
  # RULE 5: Strict Mode
  # ============================================================================

  Rule: Strict mode treats warnings as errors

    @validation
    Scenario: Strict mode exits with code 2 on warnings
      Given a TypeScript file "src/pattern.ts" with pattern "StrictTest" at phase 1 status "active"
      When running "validate-patterns -i src/*.ts -F features/*.feature --strict"
      Then exit code is 2

    @happy-path
    Scenario: Non-strict mode passes with warnings
      Given a TypeScript file "src/pattern.ts" with pattern "NonStrictTest" at phase 1 status "active"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0

  # ============================================================================
  # RULE 6: Unknown Flags
  # ============================================================================

  Rule: CLI warns about unknown flags

    @validation
    Scenario: Warn on unknown flag but continue
      Given a TypeScript file "src/pattern.ts" with pattern "UnknownFlagTest" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "UnknownFlagTest" at phase 1 status "completed"
      When running "validate-patterns --unknown-flag -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And output contains "Warning"
