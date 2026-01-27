Feature: Metadata Loader
  The loader module loads and validates metadata.json configuration files.
  It verifies required fields exist and module files are present.

  # Basic loading
  Scenario: Load valid metadata file
    Given a valid metadata.json file
    When loading the metadata
    Then the metadata should be loaded successfully
    And the document title should be "Test Project"

  Scenario: Throw error when metadata file not found
    Given a non-existent metadata path
    When loading the metadata
    Then an error should be thrown with message "Metadata file not found"

  Scenario: Throw error when JSON is invalid
    Given an invalid JSON metadata file
    When loading the metadata
    Then an error should be thrown with message "JSON"

  # Required field validation
  Scenario: Throw error when document.title is missing
    Given a metadata file missing document.title
    When loading the metadata
    Then an error should be thrown with message "document.title"

  Scenario: Throw error when sections array is missing
    Given a metadata file missing sections array
    When loading the metadata
    Then an error should be thrown with message "sections"

  Scenario: Throw error when variations array is missing
    Given a metadata file missing variations array
    When loading the metadata
    Then an error should be thrown with message "variations"

  # Module file validation
  Scenario: Validation passes when all module files exist
    Given a metadata file with module paths:
      | path           |
      | core/intro.md  |
      | core/rules.md  |
    And all module files exist
    When validating the metadata
    Then validation should pass
    And there should be 0 errors

  Scenario: Validation fails when module file is missing
    Given a metadata file with module paths:
      | path              |
      | core/intro.md     |
      | core/missing.md   |
    And module "core/intro.md" exists
    And module "core/missing.md" does not exist
    When validating the metadata
    Then validation should fail
    And there should be 1 error containing "Module not found"

  # Duplicate variation detection
  Scenario: Validation fails when variation names are duplicated
    Given a metadata file with variations:
      | name    |
      | default |
      | default |
    When validating the metadata
    Then validation should fail
    And there should be 1 error containing "Duplicate variation name"

  Scenario: Validation fails when additive layer conflicts with variation name
    Given a metadata file with:
      | type      | name    |
      | variation | testing |
      | additive  | testing |
    When validating the metadata
    Then validation should fail
    And there should be 1 error containing "conflicts"
