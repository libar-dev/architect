@libar-docs
@scanner @libar-docs-pattern:GherkinAstParser @unit
@libar-docs-status:completed
@libar-docs-product-area:Scanner
Feature: Gherkin AST Parser
  The Gherkin AST parser extracts feature metadata, scenarios, and steps
  from .feature files for timeline generation and process documentation.

  Background:
    Given a Gherkin parser context

  # ===========================================================================
  # Success Scenarios
  # ===========================================================================

  @function:parseFeatureFile @happy-path
  Scenario: Parse valid feature file with pattern metadata
    Given a Gherkin feature file with content:
      """
      @libar-docs-pattern:ProjectionCategories @libar-docs-phase:15 @libar-docs-status:roadmap
      Feature: Projection Categories
        A taxonomy that categorizes projections by purpose.

        @acceptance-criteria @happy-path
        Scenario: Define a View projection
          Given a projection definition
          When category is set to "view"
          Then projection is client-exposed
      """
    When the feature file is parsed
    Then parsing should succeed
    And the feature should have properties:
      | field       | value                                               |
      | name        | Projection Categories                               |
      | description | A taxonomy that categorizes projections by purpose. |
      | language    | en                                                  |
    And the feature tags should be:
      | tag                          |
      | pattern:ProjectionCategories |
      | phase:15                     |
      | status:roadmap               |
    And 1 scenario should be parsed
    And scenario 1 should have properties:
      | field | value                    |
      | name  | Define a View projection |
    And scenario 1 should have tags:
      | tag                 |
      | acceptance-criteria |
      | happy-path          |
    And scenario 1 should have 3 steps
    And scenario 1 step 1 should be:
      | field   | value                   |
      | keyword | Given                   |
      | text    | a projection definition |

  @function:parseFeatureFile
  Scenario: Parse multiple scenarios
    Given a Gherkin feature file with content:
      """
      @libar-docs-pattern:MyPattern
      Feature: My Pattern
        Description

        Scenario: First scenario
          Given setup
          When action
          Then result

        Scenario: Second scenario
          Given other setup
          When other action
          Then other result
      """
    When the feature file is parsed
    Then parsing should succeed
    And 2 scenarios should be parsed
    And the scenarios should have names:
      | name            |
      | First scenario  |
      | Second scenario |

  @function:parseFeatureFile
  Scenario: Handle feature without tags
    Given a Gherkin feature file with content:
      """
      Feature: Simple Feature
        A feature without tags

        Scenario: Simple scenario
          Given setup
      """
    When the feature file is parsed
    Then parsing should succeed
    And the feature should have no tags

  # ===========================================================================
  # Error Scenarios
  # ===========================================================================

  @function:parseFeatureFile @error-handling
  Scenario: Return error for malformed Gherkin
    Given a Gherkin feature file with content:
      """
      This is not valid Gherkin
      @libar-docs-pattern:Invalid
      """
    When the feature file is parsed
    Then parsing should fail
    And the error should reference file "test.feature"

  @function:parseFeatureFile @error-handling
  Scenario: Return error for file without feature
    Given a Gherkin feature file with content:
      """
      @libar-docs-pattern:Invalid
      # Just a comment
      """
    When the feature file is parsed
    Then parsing should fail
    And the error should reference file "test.feature"
