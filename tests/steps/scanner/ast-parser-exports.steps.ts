/**
 * AST Parser Step Definitions - Export Type Identification
 *
 * BDD step definitions for the AST parser export type tests. These tests verify
 * that the parseFileDirectives function correctly identifies all TypeScript
 * export declaration types.
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
  thenDescriptionShouldContain,
  thenFirstExportShouldBe,
  thenExportCountShouldBe,
  thenExportsShouldIncludeNames,
  thenCodeShouldContain,
  thenDirectivesShouldHaveDetails,
} from '../../support/helpers/ast-parser-state.js';

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/scanner/ast-parser-exports.feature');

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
  // Rule: Export types are correctly identified from TypeScript declarations
  // ---------------------------------------------------------------------------

  Rule('Export types are correctly identified from TypeScript declarations', ({ RuleScenario }) => {
    RuleScenario('Parse function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
      And('the directive description should contain {string}', thenDescriptionShouldContain);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse type export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive should have tags:', thenDirectiveShouldHaveTags);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse interface export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse const export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse class export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse enum export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse const enum export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse abstract class export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse arrow function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse async function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse generic function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse default export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse re-exports with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('{int} exports should be found', thenExportCountShouldBe);
      And('the exports should include names:', thenExportsShouldIncludeNames);
    });

    RuleScenario('Parse multiple exports in single statement', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('{int} exports should be found', thenExportCountShouldBe);
      And('the exports should include names:', thenExportsShouldIncludeNames);
    });

    RuleScenario('Parse multiple directives in same file', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
      And('the directives should have details:', thenDirectivesShouldHaveDetails);
    });
  });
});
