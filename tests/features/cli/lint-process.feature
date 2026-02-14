@libar-docs
@libar-docs-pattern:LintProcessCli
@libar-docs-status:completed
@libar-docs-product-area:CLI
@libar-docs-implements:CliBehaviorTesting
@cli @lint-process
Feature: lint-process CLI
  Command-line interface for validating changes against delivery process rules.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    @happy-path
    Scenario: Display help with --help flag
      When running "lint-process --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display help with -h flag
      When running "lint-process -h"
      Then exit code is 0
      And stdout contains "--staged"

    @happy-path
    Scenario: Display version with --version flag
      When running "lint-process --version"
      Then exit code is 0
      And stdout contains "lint-process"

    @happy-path
    Scenario: Display version with -v flag
      When running "lint-process -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Mode Selection
  # ============================================================================

  Rule: CLI requires git repository for validation

    @validation
    Scenario: Fail without git repository in staged mode
      When running "lint-process --staged"
      Then exit code is 1
      And output contains "Command failed"

    @validation
    Scenario: Fail without git repository in all mode
      When running "lint-process --all"
      Then exit code is 1
      And output contains "Command failed"

  # ============================================================================
  # RULE 3: File Mode Validation
  # ============================================================================

  Rule: CLI validates file mode input

    @validation
    Scenario: Fail when files mode has no files
      Given a git repository
      When running "lint-process --files"
      Then exit code is 1
      And output contains "No files specified"

    @happy-path
    Scenario: Accept file via positional argument
      Given a git repository
      And a feature file "specs/test.feature" with status "roadmap"
      When running "lint-process specs/test.feature"
      Then exit code is 0

    @happy-path
    Scenario: Accept file via --file flag
      Given a git repository
      And a feature file "specs/test.feature" with status "roadmap"
      When running "lint-process --file specs/test.feature"
      Then exit code is 0

  # ============================================================================
  # RULE 4: No Changes Handling
  # ============================================================================

  Rule: CLI handles no changes gracefully

    @happy-path
    Scenario: No changes detected exits successfully
      Given a git repository
      When running "lint-process --staged"
      Then exit code is 0
      And stdout contains "No changes detected"

  # ============================================================================
  # RULE 5: Output Formats
  # ============================================================================

  Rule: CLI supports multiple output formats

    @happy-path
    Scenario: JSON output format
      Given a git repository
      When running "lint-process --staged --format json"
      Then exit code is 0

    @happy-path
    Scenario: Pretty output format is default
      Given a git repository
      When running "lint-process --staged"
      Then exit code is 0
      And stdout contains "validating"

  # ============================================================================
  # RULE 6: Debug Options
  # ============================================================================

  Rule: CLI supports debug options

    @happy-path
    Scenario: Show state flag displays derived state
      Given a git repository
      When running "lint-process --staged --show-state"
      Then exit code is 0
      And stdout contains "Derived Process State"

  # ============================================================================
  # RULE 7: Unknown Flags
  # ============================================================================

  Rule: CLI warns about unknown flags

    @validation
    Scenario: Warn on unknown flag but continue
      Given a git repository
      When running "lint-process --unknown-flag --staged"
      Then exit code is 0
      And output contains "Warning"
