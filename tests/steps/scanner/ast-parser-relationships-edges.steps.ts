/**
 * AST Parser Step Definitions - Relationships and Edge Cases
 *
 * BDD step definitions for the AST parser relationship and edge case tests.
 * These tests verify that uses/usedBy relationships are extracted correctly
 * and that malformed/empty input is handled gracefully.
 *
 * @architect
 */

import {
  loadFeature,
  describeFeature,
  afterEachScenario,
  backgroundGiven,
  givenTypeScriptFileWithContent,
  givenMalformedTypeScriptFile,
  givenEmptyTypeScriptFile,
  whenFileIsParsed,
  thenDirectiveCountShouldBe,
  thenDescriptionShouldStartWith,
  thenDescriptionShouldNotStartWithAny,
  thenDescriptionShouldContainAll,
  thenUsesShouldContain,
  thenUsesShouldHaveItemCount,
  thenUsesShouldBeUndefined,
  thenUsedByShouldContain,
  thenUsedByShouldHaveItemCount,
  thenUsedByShouldBeUndefined,
  thenParsingShouldFail,
  thenParseErrorShouldContainFilePath,
} from '../../support/helpers/ast-parser-state.js';

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/scanner/ast-parser-relationships-edges.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    await afterEachScenario();
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a scanner context with temp directory', async () => {
      await backgroundGiven();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Relationship tags extract uses and usedBy dependencies
  // ---------------------------------------------------------------------------

  Rule('Relationship tags extract uses and usedBy dependencies', ({ RuleScenario }) => {
    RuleScenario('Extract @architect-uses with single value', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive uses should contain:', thenUsesShouldContain);
    });

    RuleScenario(
      'Extract @architect-uses with comma-separated values',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive uses should have {int} items', thenUsesShouldHaveItemCount);
        And('the directive uses should contain:', thenUsesShouldContain);
      }
    );

    RuleScenario('Extract @architect-used-by with single value', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive usedBy should contain:', thenUsedByShouldContain);
    });

    RuleScenario(
      'Extract @architect-used-by with comma-separated values',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive usedBy should have {int} items', thenUsedByShouldHaveItemCount);
        And('the directive usedBy should contain:', thenUsedByShouldContain);
      }
    );

    RuleScenario(
      'Extract both uses and usedBy from same directive',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive uses should contain:', thenUsesShouldContain);
        And('the directive usedBy should contain:', thenUsedByShouldContain);
      }
    );

    RuleScenario('NOT capture uses/usedBy values in description', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should start with {string}', thenDescriptionShouldStartWith);
      And(
        'the directive description should not start with any:',
        thenDescriptionShouldNotStartWithAny
      );
      And('the directive uses should contain:', thenUsesShouldContain);
      And('the directive usedBy should contain:', thenUsedByShouldContain);
    });

    RuleScenario(
      'Not set uses/usedBy when no relationship tags exist',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive uses should be undefined', thenUsesShouldBeUndefined);
        And('the directive usedBy should be undefined', thenUsedByShouldBeUndefined);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Edge cases and malformed input are handled gracefully
  // ---------------------------------------------------------------------------

  Rule('Edge cases and malformed input are handled gracefully', ({ RuleScenario }) => {
    RuleScenario('Skip comments without @architect-* tags', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Skip invalid directive with incomplete tag', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle malformed TypeScript gracefully', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with malformed content:', givenMalformedTypeScriptFile);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('parsing should fail with error', thenParsingShouldFail);
      And('the parse error should contain the file path', thenParseErrorShouldContainFilePath);
    });

    RuleScenario('Handle empty file gracefully', ({ Given, When, Then }) => {
      Given('an empty TypeScript file', givenEmptyTypeScriptFile);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle whitespace-only file', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle file with only comments and no exports', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Skip inline comments (non-block)', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle unicode characters in descriptions', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should contain all:', thenDescriptionShouldContainAll);
    });
  });
});
