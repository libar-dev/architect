Feature: Content Renderer
  The renderer module builds CLAUDE.md content from metadata and module files.
  It supports both complete variations and additive layers.

  # Complete Variation Rendering
  Scenario: Build variation with document header
    Given a metadata document titled "My Project" with description "Project description"
    And a section "Core" with tag "core" and module "core/intro.md"
    And module "core/intro.md" contains:
      """
      ### Introduction
      Welcome to the project.
      """
    And a variation "default" with tags "core"
    When building the variation
    Then the output should start with "# My Project"
    And the output should contain description blockquote

  Scenario: Build variation with section headers
    Given a metadata document titled "Test"
    And a section "Getting Started" with tag "core" and module "docs/start.md"
    And module "docs/start.md" has heading content
    And a variation "default" with tags "core"
    When building the variation
    Then the output should contain section header and module heading

  Scenario: Build variation filtering by tags
    Given a metadata document titled "Test"
    And sections:
      | title   | tag     | module            |
      | Public  | public  | public/info.md    |
      | Private | private | private/secret.md |
    And modules with content:
      | path              | content           |
      | public/info.md    | ### Public Info   |
      | private/secret.md | ### Secret Info   |
    And a variation "public-only" with tags "public"
    When building the variation
    Then output includes public content but not private

  Scenario: Build variation with preamble
    Given a metadata document titled "Test" with preamble tagline "Important Rules" and rules:
      | rule                    |
      | Always write tests      |
      | Never skip code review  |
    And a section "Core" with tag "core" and module "core/main.md"
    And module "core/main.md" contains "### Main Content"
    And a variation "default" with tags "core"
    When building the variation
    Then the output should contain preamble with rules

  Scenario: Skip section when no matching subsections
    Given a metadata document titled "Test"
    And a section "Docs" with tag "docs" and module "docs/guide.md"
    And module "docs/guide.md" contains "### Guide"
    And a variation "other" with tags "other-tag"
    When building the variation
    Then the output should not contain "## Docs"

  # Additive Layer Rendering
  Scenario: Build additive layer with simplified header
    Given a metadata document titled "Test"
    And a section "Advanced" with tag "advanced" and module "advanced/tips.md"
    And module "advanced/tips.md" contains "### Pro Tips"
    And an additive layer "advanced" with tags "advanced" and output ".layers/advanced"
    When building the additive layer
    Then the output should have additive layer structure

  Scenario: Build additive layer with description
    Given a metadata document titled "Test"
    And a section "Testing" with tag "testing" and module "testing/guide.md"
    And module "testing/guide.md" contains "### Testing Guide"
    And an additive layer "testing" with tags "testing", output ".layers/testing", and description "Testing best practices"
    When building the additive layer
    Then the output should contain "> Testing best practices"

  # Edge Cases
  Scenario: Handle missing module file gracefully
    Given a metadata document titled "Test"
    And a section "Core" with tag "core" and module "missing/file.md"
    And a variation "default" with tags "core"
    When building the variation
    Then a warning should be logged containing "Module not found"
    And the output should contain section header for Core
