@libar-docs-implements:CliBehaviorTesting
@cli @generate-tag-taxonomy
Feature: generate-tag-taxonomy CLI
  Command-line interface for generating TAG_TAXONOMY.md from tag registry configuration.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    @happy-path
    Scenario: Display help with --help flag
      When running "generate-tag-taxonomy --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display help with -h flag
      When running "generate-tag-taxonomy -h"
      Then exit code is 0
      And stdout contains "--output"

    @happy-path
    Scenario: Display version with --version flag
      When running "generate-tag-taxonomy --version"
      Then exit code is 0
      And stdout contains "generate-tag-taxonomy"

    @happy-path
    Scenario: Display version with -v flag
      When running "generate-tag-taxonomy -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Output Handling
  # ============================================================================

  Rule: CLI generates taxonomy at specified output path

    @happy-path
    Scenario: Generate taxonomy at default path
      When running "generate-tag-taxonomy"
      Then exit code is 0
      And stdout contains "Generated:"
      And file "docs/architecture/TAG_TAXONOMY.md" exists in working directory

    @happy-path
    Scenario: Generate taxonomy at custom output path
      When running "generate-tag-taxonomy -o taxonomy.md"
      Then exit code is 0
      And stdout contains "Generated:"
      And file "taxonomy.md" exists in working directory

    @happy-path
    Scenario: Create output directory if missing
      When running "generate-tag-taxonomy -o nested/path/taxonomy.md"
      Then exit code is 0
      And file "nested/path/taxonomy.md" exists in working directory

  # ============================================================================
  # RULE 3: Overwrite Handling
  # ============================================================================

  Rule: CLI respects overwrite flag for existing files

    @validation
    Scenario: Fail when output file exists without --overwrite
      Given file "taxonomy.md" exists with content "existing content"
      When running "generate-tag-taxonomy -o taxonomy.md"
      Then exit code is 1
      And stderr contains "already exists"

    @happy-path
    Scenario: Overwrite existing file with -f flag
      Given file "taxonomy.md" exists with content "existing content"
      When running "generate-tag-taxonomy -o taxonomy.md -f"
      Then exit code is 0
      And stdout contains "Generated:"
      And file "taxonomy.md" does not contain "existing content"

    @happy-path
    Scenario: Overwrite existing file with --overwrite flag
      Given file "docs/TAG_TAXONOMY.md" exists with content "ORIGINAL_PLACEHOLDER_CONTENT"
      When running "generate-tag-taxonomy -o docs/TAG_TAXONOMY.md --overwrite"
      Then exit code is 0
      And file "docs/TAG_TAXONOMY.md" does not contain "ORIGINAL_PLACEHOLDER_CONTENT"

  # ============================================================================
  # RULE 4: Output Content Validation
  # ============================================================================

  Rule: Generated taxonomy contains expected sections

    @happy-path
    Scenario: Generated file contains category documentation
      When running "generate-tag-taxonomy -o taxonomy.md"
      Then exit code is 0
      And file "taxonomy.md" contains "Categories"

    @happy-path
    Scenario: Generated file reports statistics
      When running "generate-tag-taxonomy -o taxonomy.md"
      Then exit code is 0
      And stdout contains "Categories:"

  # ============================================================================
  # RULE 5: Unknown Flags
  # ============================================================================

  Rule: CLI warns about unknown flags

    @validation
    Scenario: Warn on unknown flag but continue
      When running "generate-tag-taxonomy --unknown-flag -o taxonomy.md"
      Then exit code is 0
      And stderr contains "Warning"
      And file "taxonomy.md" exists in working directory
