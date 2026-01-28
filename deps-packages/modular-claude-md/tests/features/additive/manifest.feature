Feature: Shell Manifest Generation
  Generate shell manifest files with aliases for Claude Code's --add-dir workflow.

  # Manifest Entry Generation
  Scenario: Generate manifest entries from additive variations
    Given metadata with additive variations:
      | name    | output_dir           | description           |
      | testing | .claude-layers/testing | Testing best practices |
      | advanced | .claude-layers/advanced | Advanced topics       |
    When generating manifest entries
    Then there should be 2 manifest entries with correct aliases and paths

  Scenario: Generate empty entries when no additive variations
    Given metadata without additive variations
    When generating manifest entries
    Then there should be 0 manifest entries

  # Manifest Content Generation
  Scenario: Generate manifest content with env var export
    Given metadata with additive variations:
      | name | output_dir          | description |
      | docs | .claude-layers/docs | Documentation |
    When generating manifest content
    Then the content should contain the shebang line
    And the content should export CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD

  Scenario: Generate aliases for single layer
    Given metadata with additive variations:
      | name    | output_dir             | description       |
      | testing | .claude-layers/testing | Testing practices |
    When generating manifest content
    Then the content should contain alias "claude-testing"
    And the content should contain description comment "Testing practices"
    And the content should contain the claude-with helper function

  Scenario: Generate aliases for multiple layers
    Given metadata with additive variations:
      | name     | output_dir              | description       |
      | testing  | .claude-layers/testing  | Testing practices |
      | advanced | .claude-layers/advanced | Advanced topics   |
    When generating manifest content
    Then the content should contain all layer aliases and claude-full

  # Manifest File Writing
  Scenario: Write manifest to project root
    Given metadata with additive variations:
      | name    | output_dir             | description |
      | testing | .claude-layers/testing | Testing     |
    And a temporary project directory
    When writing manifest to project root
    Then the manifest file should exist at ".claude-layers/manifest.sh"
    And the manifest file should be executable

  Scenario: Preview manifest without writing
    Given metadata with additive variations:
      | name    | output_dir             | description |
      | testing | .claude-layers/testing | Testing     |
    And a temporary project directory
    When previewing manifest
    Then no manifest file should be created
