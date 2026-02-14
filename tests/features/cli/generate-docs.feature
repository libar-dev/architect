@libar-docs
@libar-docs-pattern:GenerateDocsCli
@libar-docs-status:completed
@libar-docs-product-area:DataAPI
@libar-docs-implements:CliBehaviorTesting
@cli @generate-docs
Feature: generate-docs CLI
  Command-line interface for generating documentation from annotated TypeScript.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    @happy-path
    Scenario: Display help with --help flag
      When running "generate-docs --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display version with -v flag
      When running "generate-docs -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input patterns

    @validation
    Scenario: Fail without --input flag
      When running "generate-docs -o docs"
      Then exit code is 1
      And output contains "No source files specified"

  # ============================================================================
  # RULE 3: List Generators
  # ============================================================================

  Rule: CLI lists available generators

    @happy-path
    Scenario: List generators with --list-generators
      When running "generate-docs --list-generators"
      Then exit code is 0
      And stdout contains "patterns"

  # ============================================================================
  # RULE 4: Generate Documents
  # ============================================================================

  Rule: CLI generates documentation from source files

    @happy-path
    Scenario: Generate patterns documentation
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
      Then exit code is 0
      And file "docs/PATTERNS.md" exists in working directory

    @happy-path
    Scenario: Use default generator (patterns) when not specified
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -o docs -f"
      Then exit code is 0
      And stdout contains "patterns"

  # ============================================================================
  # RULE 5: Unknown Options
  # ============================================================================

  Rule: CLI rejects unknown options

    @validation
    Scenario: Unknown option causes error
      When running "generate-docs --unknown-flag"
      Then exit code is 1
      And output contains "Unknown option"
