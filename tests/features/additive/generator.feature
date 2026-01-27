Feature: Additive Layer Generator
  The generator creates additive layer files for Claude Code's --add-dir feature.
  Layers contain only their specific content, not base/core content.

  # Basic generation
  Scenario: Generate single additive layer
    Given a metadata configuration with:
      | layer_name | output_dir                    | tags     |
      | testing    | .claude-layers/testing        | testing  |
    And module "testing/intro.md" with tags "testing"
    When generating layer "testing"
    Then a CLAUDE.md file should be created at ".claude-layers/testing/CLAUDE.md"
    And the content should contain "testing Context"

  # Budget handling
  Scenario: Use default budget when not specified
    Given a metadata configuration with:
      | layer_name | output_dir             | tags    |
      | advanced   | .claude-layers/advanced | advanced |
    And module "advanced/tips.md" with tags "advanced"
    When generating layer "advanced"
    Then the budget should be 2000

  Scenario: Use custom budget when specified
    Given a metadata configuration with:
      | layer_name | output_dir             | tags     | budget_tokens |
      | premium    | .claude-layers/premium | premium  | 5000          |
    And module "premium/content.md" with tags "premium"
    When generating layer "premium"
    Then the budget should be 5000

  # Generate all layers
  Scenario: Generate all additive layers
    Given a metadata configuration with multiple layers:
      | layer_name | output_dir                 | tags       |
      | testing    | .claude-layers/testing     | testing    |
      | advanced   | .claude-layers/advanced    | advanced   |
    And modules for all layers:
      | path               | tags     |
      | testing/intro.md   | testing  |
      | advanced/tips.md   | advanced |
    When generating all layers
    Then 2 layer files should be created

  # Missing additive variations
  Scenario: Handle metadata without additive_variations
    Given a metadata configuration with no additive_variations
    When generating all layers
    Then 0 layer files should be created
    And a warning should be logged

  # Layer lookup
  Scenario: Find layer by name
    Given a metadata configuration with:
      | layer_name | output_dir                    | tags     |
      | testing    | .claude-layers/testing        | testing  |
    When looking up layer "testing"
    Then the layer should be found

  Scenario: Return undefined for unknown layer
    Given a metadata configuration with:
      | layer_name | output_dir                    | tags     |
      | testing    | .claude-layers/testing        | testing  |
    When looking up layer "unknown"
    Then the layer should not be found
