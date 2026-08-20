import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  parseFeatureFile,
  type ParsedFeatureFile,
} from '../../../src/scanner/gherkin-ast-parser.js';
import type { Result } from '../../../src/types/result.js';
import type { GherkinFileError } from '../../../src/validation-schemas/feature.js';

type DataTableRow = Record<string, string>;

interface ParsedScenario {
  name: string;
  tags: readonly string[];
  steps: ReadonlyArray<{ keyword: string; text: string }>;
}

interface ParsedFeature {
  name: string;
  description: string;
  tags: readonly string[];
  language: string;
}

interface GherkinParseResult {
  feature: ParsedFeature;
  scenarios: readonly ParsedScenario[];
}

interface GherkinParserState {
  fileContent: string;
  fileName: string;
  result: Result<ParsedFeatureFile, GherkinFileError> | null;
}

let state: GherkinParserState | null = null;

function initState(): GherkinParserState {
  return { fileContent: '', fileName: 'test.feature', result: null };
}

const feature = await loadFeature('tests/features/scanner/gherkin-parser.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a Gherkin parser context', () => {
      state = initState();
    });
  });

  const givenGherkinFileWithContent = (_ctx: unknown, docString: string) => {
    state!.fileContent = docString;
  };
  const whenFeatureFileIsParsed = () => {
    state!.result = parseFeatureFile(state!.fileContent, state!.fileName);
  };
  const thenParsingShouldSucceed = () => {
    expect(state!.result?.ok).toBe(true);
  };
  const thenParsingShouldFail = () => {
    expect(state!.result?.ok).toBe(false);
  };
  const thenFeatureShouldHaveProperties = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    const parsedFeature = state!.result.value.feature;
    for (const row of table) {
      const field = row['field'] as keyof ParsedFeature;
      expect(parsedFeature[field]).toBe(row['value']);
    }
  };
  const thenFeatureTagsShouldBe = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    expect(state!.result.value.feature.tags).toEqual(table.map((row) => row['tag']));
  };
  const thenFeatureShouldHaveNoTags = () => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    expect(state!.result.value.feature.tags).toEqual([]);
  };
  const thenScenarioCountShouldBe = (_ctx: unknown, count: number) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    expect(state!.result.value.scenarios).toHaveLength(count);
  };
  const thenScenarioShouldHaveProperties = (
    _ctx: unknown,
    index: number,
    table: DataTableRow[],
  ) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    const scenario = state!.result.value.scenarios[index - 1];
    expect(scenario).toBeDefined();
    for (const row of table) {
      if (row['field'] === 'name') expect(scenario?.name).toBe(row['value']);
    }
  };
  const thenScenarioShouldHaveTags = (_ctx: unknown, index: number, table: DataTableRow[]) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    expect(state!.result.value.scenarios[index - 1]?.tags).toEqual(table.map((row) => row['tag']));
  };
  const thenScenarioShouldHaveSteps = (_ctx: unknown, index: number, stepCount: number) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    expect(state!.result.value.scenarios[index - 1]?.steps).toHaveLength(stepCount);
  };
  const thenScenarioStepShouldBe = (
    _ctx: unknown,
    scenarioIndex: number,
    stepIndex: number,
    table: DataTableRow[],
  ) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    const step = state!.result.value.scenarios[scenarioIndex - 1]?.steps[stepIndex - 1];
    expect(step).toBeDefined();
    for (const row of table) {
      if (row['field'] === 'keyword') expect(step?.keyword).toBe(row['value']);
      if (row['field'] === 'text') expect(step?.text).toBe(row['value']);
    }
  };
  const thenScenariosShouldHaveNames = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state!.result?.ok) throw new Error('Parse did not succeed');
    expect(state!.result.value.scenarios.map((scenario) => scenario.name)).toEqual(
      table.map((row) => row['name']),
    );
  };
  const thenErrorShouldReferenceFile = (_ctx: unknown, fileName: string) => {
    if (state!.result?.ok) throw new Error('Parse should have failed');
    expect(state!.result!.error.file).toBe(fileName);
    expect(state!.result!.error.error.message).toBeDefined();
  };

  Rule('Successful feature file parsing extracts complete metadata', ({ RuleScenario }) => {
    RuleScenario('Parse valid feature file with pattern metadata', ({ Given, When, Then, And }) => {
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

    RuleScenario('Parse multiple scenarios', ({ Given, When, Then, And }) => {
      Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
      When('the feature file is parsed', whenFeatureFileIsParsed);
      Then('parsing should succeed', thenParsingShouldSucceed);
      And('{int} scenarios should be parsed', thenScenarioCountShouldBe);
      And('the scenarios should have names:', thenScenariosShouldHaveNames);
    });

    RuleScenario('Handle feature without tags', ({ Given, When, Then, And }) => {
      Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
      When('the feature file is parsed', whenFeatureFileIsParsed);
      Then('parsing should succeed', thenParsingShouldSucceed);
      And('the feature should have no tags', thenFeatureShouldHaveNoTags);
    });
  });

  Rule('Invalid Gherkin produces structured errors', ({ RuleScenario }) => {
    RuleScenario('Return error for malformed Gherkin', ({ Given, When, Then, And }) => {
      Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
      When('the feature file is parsed', whenFeatureFileIsParsed);
      Then('parsing should fail', thenParsingShouldFail);
      And('the error should reference file {string}', thenErrorShouldReferenceFile);
    });

    RuleScenario('Return error for file without feature', ({ Given, When, Then, And }) => {
      Given('a Gherkin feature file with content:', givenGherkinFileWithContent);
      When('the feature file is parsed', whenFeatureFileIsParsed);
      Then('parsing should fail', thenParsingShouldFail);
      And('the error should reference file {string}', thenErrorShouldReferenceFile);
    });
  });
});
