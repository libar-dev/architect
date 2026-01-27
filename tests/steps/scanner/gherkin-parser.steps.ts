/**
 * Gherkin Parser Step Definitions
 *
 * BDD step definitions for testing the Gherkin AST parser.
 * Tests parseFeatureFile function for extracting feature metadata,
 * scenarios, and steps from .feature files.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { parseFeatureFile } from '../../../src/scanner/gherkin-ast-parser.js';
import type { Result } from '../../../src/types/result.js';

// =============================================================================
// Types
// =============================================================================

type DataTableRow = Record<string, string>;

interface ParsedScenario {
  name: string;
  tags: string[];
  steps: Array<{ keyword: string; text: string }>;
}

interface ParsedFeature {
  name: string;
  description: string;
  tags: string[];
  language: string;
}

interface GherkinParseResult {
  feature: ParsedFeature;
  scenarios: ParsedScenario[];
}

interface GherkinParserState {
  fileContent: string;
  fileName: string;
  result: Result<GherkinParseResult, { file: string; error: Error }> | null;
}

// =============================================================================
// Module State
// =============================================================================

let state: GherkinParserState | null = null;

function initState(): GherkinParserState {
  return {
    fileContent: '',
    fileName: 'test.feature',
    result: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/scanner/gherkin-parser.feature');

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a Gherkin parser context', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Step Handlers
  // ---------------------------------------------------------------------------

  const givenGherkinFileWithContent = (_ctx: unknown, docString: string) => {
    if (!state) throw new Error('State not initialized');
    state.fileContent = docString;
  };

  const whenFeatureFileIsParsed = () => {
    if (!state) throw new Error('State not initialized');
    state.result = parseFeatureFile(state.fileContent, state.fileName);
  };

  const thenParsingShouldSucceed = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.result?.ok).toBe(true);
  };

  const thenParsingShouldFail = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.result?.ok).toBe(false);
  };

  const thenFeatureShouldHaveProperties = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const feature = state.result.value.feature;
    for (const row of table) {
      const field = row.field as keyof ParsedFeature;
      expect(feature[field]).toBe(row.value);
    }
  };

  const thenFeatureTagsShouldBe = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const expectedTags = table.map((row) => row.tag);
    expect(state.result.value.feature.tags).toEqual(expectedTags);
  };

  const thenFeatureShouldHaveNoTags = () => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    expect(state.result.value.feature.tags).toEqual([]);
  };

  const thenScenarioCountShouldBe = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    expect(state.result.value.scenarios).toHaveLength(count);
  };

  const thenScenarioShouldHaveProperties = (
    _ctx: unknown,
    index: number,
    table: DataTableRow[]
  ) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const scenario = state.result.value.scenarios[index - 1];
    expect(scenario).toBeDefined();

    for (const row of table) {
      if (row.field === 'name') {
        expect(scenario?.name).toBe(row.value);
      }
    }
  };

  const thenScenarioShouldHaveTags = (_ctx: unknown, index: number, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const scenario = state.result.value.scenarios[index - 1];
    const expectedTags = table.map((row) => row.tag);
    expect(scenario?.tags).toEqual(expectedTags);
  };

  const thenScenarioShouldHaveSteps = (_ctx: unknown, index: number, stepCount: number) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const scenario = state.result.value.scenarios[index - 1];
    expect(scenario?.steps).toHaveLength(stepCount);
  };

  const thenScenarioStepShouldBe = (
    _ctx: unknown,
    scenarioIndex: number,
    stepIndex: number,
    table: DataTableRow[]
  ) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const step = state.result.value.scenarios[scenarioIndex - 1]?.steps[stepIndex - 1];
    expect(step).toBeDefined();

    for (const row of table) {
      if (row.field === 'keyword') {
        expect(step?.keyword).toBe(row.value);
      }
      if (row.field === 'text') {
        expect(step?.text).toBe(row.value);
      }
    }
  };

  const thenScenariosShouldHaveNames = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    if (!state.result?.ok) throw new Error('Parse did not succeed');

    const expectedNames = table.map((row) => row.name);
    const actualNames = state.result.value.scenarios.map((s) => s.name);
    expect(actualNames).toEqual(expectedNames);
  };

  const thenErrorShouldReferenceFile = (_ctx: unknown, fileName: string) => {
    if (!state) throw new Error('State not initialized');
    if (state.result?.ok) throw new Error('Parse should have failed');

    expect(state.result.error.file).toBe(fileName);
    expect(state.result.error.error.message).toBeDefined();
  };

  // ---------------------------------------------------------------------------
  // Success Scenarios
  // ---------------------------------------------------------------------------

  Scenario('Parse valid feature file with pattern metadata', ({ Given, When, Then, And }) => {
    Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
    When('the feature file is parsed', whenFeatureFileIsParsed);
    Then('parsing should succeed', thenParsingShouldSucceed);
    And('the feature should have properties:', thenFeatureShouldHaveProperties);
    And('the feature tags should be:', thenFeatureTagsShouldBe);
    And('{int} scenario should be parsed', thenScenarioCountShouldBe);
    And('scenario {int} should have properties:', thenScenarioShouldHaveProperties);
    And('scenario {int} should have tags:', thenScenarioShouldHaveTags);
    And('scenario {int} should have {int} steps', thenScenarioShouldHaveSteps);
    And('scenario {int} step {int} should be:', thenScenarioStepShouldBe);
  });

  Scenario('Parse multiple scenarios', ({ Given, When, Then, And }) => {
    Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
    When('the feature file is parsed', whenFeatureFileIsParsed);
    Then('parsing should succeed', thenParsingShouldSucceed);
    And('{int} scenarios should be parsed', thenScenarioCountShouldBe);
    And('the scenarios should have names:', thenScenariosShouldHaveNames);
  });

  Scenario('Handle feature without tags', ({ Given, When, Then, And }) => {
    Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
    When('the feature file is parsed', whenFeatureFileIsParsed);
    Then('parsing should succeed', thenParsingShouldSucceed);
    And('the feature should have no tags', thenFeatureShouldHaveNoTags);
  });

  // ---------------------------------------------------------------------------
  // Error Scenarios
  // ---------------------------------------------------------------------------

  Scenario('Return error for malformed Gherkin', ({ Given, When, Then, And }) => {
    Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
    When('the feature file is parsed', whenFeatureFileIsParsed);
    Then('parsing should fail', thenParsingShouldFail);
    And('the error should reference file {string}', thenErrorShouldReferenceFile);
  });

  Scenario('Return error for file without feature', ({ Given, When, Then, And }) => {
    Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
    When('the feature file is parsed', whenFeatureFileIsParsed);
    Then('parsing should fail', thenParsingShouldFail);
    And('the error should reference file {string}', thenErrorShouldReferenceFile);
  });
});
