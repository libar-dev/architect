Feature: CLI Commands
  The CLI provides commands for building, validating, and generating CLAUDE.md files.

  # Argument parsing
  Scenario: Parse build command
    When parsing arguments "build"
    Then the command should be "build"

  Scenario: Parse validate command
    When parsing arguments "validate"
    Then the command should be "validate"

  Scenario: Parse preview flag
    When parsing arguments "build --preview"
    Then the command should be "build"
    And preview should be enabled

  Scenario: Parse short preview flag
    When parsing arguments "build -p"
    Then the command should be "build"
    And preview should be enabled

  Scenario: Parse variation option
    When parsing arguments "build --variation=testing"
    Then the variation should be "testing"

  Scenario: Parse layer option
    When parsing arguments "additive --layer=advanced"
    Then the layer should be "advanced"

  Scenario: Parse base-dir option
    When parsing arguments "build --base-dir=/custom/path"
    Then the base directory should be "/custom/path"

  Scenario: Parse project-root option
    When parsing arguments "build --project-root=/my/project"
    Then the project root should be "/my/project"

  # Default behavior
  Scenario: Default to help when no command
    When parsing arguments ""
    Then the command should be "help"

  Scenario: Default to build when only options provided
    When parsing arguments "--preview"
    Then the command should be "build"

  # CLI commands enumeration
  Scenario Outline: Recognize all valid commands
    When parsing arguments "<command>"
    Then the command should be "<command>"

    Examples:
      | command  |
      | build    |
      | validate |
      | additive |
      | manifest |
      | init     |
      | help     |
