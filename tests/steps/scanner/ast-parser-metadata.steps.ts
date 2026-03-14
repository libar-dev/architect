/**
 * AST Parser Step Definitions - Metadata Extraction
 *
 * BDD step definitions for the AST parser metadata tests. These tests verify
 * that the parseFileDirectives function correctly extracts metadata, tags,
 * and When to Use sections from JSDoc comments.
 *
 * @architect
 */

import {
  loadFeature,
  describeFeature,
  afterEachScenario,
  backgroundGiven,
  givenTypeScriptFileWithContent,
  whenFileIsParsed,
  thenDirectiveCountShouldBe,
  thenDirectiveShouldHaveTag,
  thenDirectiveShouldHaveTags,
  thenDirectiveShouldHaveTagCount,
  thenDirectiveShouldNotHaveAnyTags,
  thenDescriptionShouldBe,
  thenDescriptionShouldContainAll,
  thenDescriptionShouldNotContainAny,
  thenDirectiveShouldHaveExampleCount,
  thenExamplesShouldContain,
  thenPositionShouldBe,
  thenFirstExportSignatureShouldContain,
  thenWhenToUseShouldHaveItemCount,
  thenWhenToUseShouldContain,
  thenWhenToUseShouldBeUndefined,
} from '../../support/helpers/ast-parser-state.js';

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/scanner/ast-parser-metadata.feature');

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
  // Rule: Metadata is correctly extracted from JSDoc comments
  // ---------------------------------------------------------------------------

  Rule('Metadata is correctly extracted from JSDoc comments', ({ RuleScenario }) => {
    RuleScenario('Extract examples from directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive should have {int} examples', thenDirectiveShouldHaveExampleCount);
      And('the examples should contain:', thenExamplesShouldContain);
    });

    RuleScenario('Extract multi-line description', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should contain all:', thenDescriptionShouldContainAll);
    });

    RuleScenario('Track line numbers correctly', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive position should be:', thenPositionShouldBe);
    });

    RuleScenario('Extract function signature information', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And(
        'the first export signature should contain {string}',
        thenFirstExportSignatureShouldContain
      );
    });

    RuleScenario('Ignore @param and @returns in description', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should be {string}', thenDescriptionShouldBe);
      And('the directive description should not contain any:', thenDescriptionShouldNotContainAny);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Tags are extracted only from the directive section
  // ---------------------------------------------------------------------------

  Rule(
    'Tags are extracted only from the directive section, not from description or examples',
    ({ RuleScenario }) => {
      RuleScenario('Extract multiple tags from directive section', ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive should have {int} tags', thenDirectiveShouldHaveTagCount);
        And('the directive should have tags:', thenDirectiveShouldHaveTags);
      });

      RuleScenario('Extract tag with description on same line', ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive should have {int} tag', thenDirectiveShouldHaveTagCount);
        And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
      });

      RuleScenario('NOT extract tags mentioned in description', ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive should have {int} tag', thenDirectiveShouldHaveTagCount);
        And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
        And('the directive should not have any tags:', thenDirectiveShouldNotHaveAnyTags);
      });

      RuleScenario(
        'NOT extract tags mentioned in @example sections',
        ({ Given, When, Then, And }) => {
          Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
          When('the file is parsed for directives', whenFileIsParsed);
          Then('{int} directive should be found', thenDirectiveCountShouldBe);
          And('the directive should have {int} tag', thenDirectiveShouldHaveTagCount);
          And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
          And('the directive should not have any tags:', thenDirectiveShouldNotHaveAnyTags);
        }
      );
    }
  );

  // ---------------------------------------------------------------------------
  // Rule: When to Use sections are extracted in all supported formats
  // ---------------------------------------------------------------------------

  Rule('When to Use sections are extracted in all supported formats', ({ RuleScenario }) => {
    RuleScenario(
      'Extract When to Use heading format with bullet points',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive whenToUse should have {int} items', thenWhenToUseShouldHaveItemCount);
        And('the directive whenToUse should contain:', thenWhenToUseShouldContain);
      }
    );

    RuleScenario('Extract When to use inline format', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive whenToUse should have {int} item', thenWhenToUseShouldHaveItemCount);
      And('the directive whenToUse should contain:', thenWhenToUseShouldContain);
    });

    RuleScenario(
      'Extract asterisk bullets in When to Use section',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive whenToUse should contain:', thenWhenToUseShouldContain);
      }
    );

    RuleScenario('Not set whenToUse when section is missing', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive whenToUse should be undefined', thenWhenToUseShouldBeUndefined);
    });
  });
});
