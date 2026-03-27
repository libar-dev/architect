@architect
@scanner @architect-pattern:GherkinAstParser @unit
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Annotation
Feature: Gherkin AST Parser
  The Gherkin AST parser extracts feature metadata, scenarios, and steps
  from .feature files for timeline generation and process documentation.

  Background:
    Given a Gherkin parser context

  Rule: Successful feature file parsing extracts complete metadata

    **Invariant:** A valid feature file must produce a ParsedFeature with name, description, language, tags, and all nested scenarios with their steps.
    **Rationale:** Downstream generators (timeline, business rules) depend on complete AST extraction; missing fields cause silent gaps in generated documentation.
    **Verified by:** Parse valid feature file with pattern metadata, Parse multiple scenarios, Handle feature without tags

    @function:parseFeatureFile @happy-path
    Scenario: Parse valid feature file with pattern metadata
      Given a Gherkin feature file with content:
        """
        @architect-pattern:ProjectionCategories @architect-phase:15 @architect-status:roadmap
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
        @architect-pattern:MyPattern
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

  Rule: Invalid Gherkin produces structured errors

    **Invariant:** Malformed or incomplete Gherkin input must return a Result.err with the source file path and a descriptive error message.
    **Rationale:** The scanner processes many feature files in batch; structured errors allow graceful degradation and per-file error reporting rather than aborting the entire scan.
    **Verified by:** Return error for malformed Gherkin, Return error for file without feature

    @function:parseFeatureFile @error-handling
    Scenario: Return error for malformed Gherkin
      Given a Gherkin feature file with content:
        """
        This is not valid Gherkin
        @architect-pattern:Invalid
        """
      When the feature file is parsed
      Then parsing should fail
      And the error should reference file "test.feature"

    @function:parseFeatureFile @error-handling
    Scenario: Return error for file without feature
      Given a Gherkin feature file with content:
        """
        @architect-pattern:Invalid
        # Just a comment
        """
      When the feature file is parsed
      Then parsing should fail
      And the error should reference file "test.feature"
