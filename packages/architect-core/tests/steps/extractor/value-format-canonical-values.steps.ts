import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { extractPatternTags } from '../../../src/scanner/gherkin-ast-parser.js';
import { extractPatternsFromGherkin } from '../../../src/extractor/gherkin-extractor.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type {
  MetadataTagDefinition,
  TagRegistry,
} from '../../../src/validation-schemas/tag-registry.js';
import type {
  ScannedGherkinFile,
  GherkinFeature,
} from '../../../src/validation-schemas/feature.js';

const feature = await loadFeature('tests/features/extractor/value-format-canonical-values.feature');

interface State {
  registry: TagRegistry | null;
  metadata: Record<string, unknown> | null;
  diagnostics: readonly { code: string; message: string; suggestion?: string }[];
}

let state: State;

function resetState(): State {
  return { registry: null, metadata: null, diagnostics: [] };
}

function buildRegistryWith(tagDefinition: MetadataTagDefinition): TagRegistry {
  const base = createDefaultTagRegistry();
  return {
    ...base,
    metadataTags: [...base.metadataTags, tagDefinition],
  };
}

function makeScannedFile(tags: readonly string[]): ScannedGherkinFile {
  const featureNode: GherkinFeature = {
    name: 'Synthetic',
    description: '',
    tags,
    language: 'en',
    line: 1,
  };
  return {
    filePath: '/test/synthetic.feature',
    feature: featureNode,
    scenarios: [],
  };
}

function runExtraction(testAreaValue: string): void {
  const registry = state.registry!;
  const tags = [
    'architect',
    'architect-pattern:Synthetic',
    'architect-status:active',
    `architect-test-area:${testAreaValue}`,
  ];

  state.metadata = extractPatternTags(tags, registry) as Record<string, unknown>;

  const result = extractPatternsFromGherkin([makeScannedFile(tags)], {
    baseDir: '/test',
    tagRegistry: registry,
  });
  state.diagnostics = result.diagnostics;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a value-format canonical-values context', () => {
      state = resetState();
    });
  });

  Rule('Value-format dispatch enforces canonical values', ({ RuleScenario }) => {
    RuleScenario(
      'Unknown value for value-format tag emits diagnostic',
      ({ Given, When, Then, And }) => {
        Given(
          'a registry that declares "test-area" as a value-format tag with values "Alpha, Beta"',
          () => {
            state.registry = buildRegistryWith({
              tag: 'test-area',
              format: 'value',
              purpose: 'Synthetic test tag for value-format canonical-values dispatch',
              required: false,
              repeatable: false,
              values: ['Alpha', 'Beta'],
            });
          },
        );

        When('I extract a feature using "@architect-test-area:Gamma"', () => {
          runExtraction('Gamma');
        });

        Then(
          'the diagnostics include "Unrecognized value \'Gamma\' for @architect-test-area"',
          () => {
            const match = state.diagnostics.find(
              (d) =>
                d.code === 'invalid-enum-value' &&
                d.message.includes("Unrecognized value 'Gamma' for @architect-test-area"),
            );
            expect(match).toBeDefined();
          },
        );

        And('the diagnostic lists valid values "Alpha, Beta"', () => {
          const match = state.diagnostics.find((d) => d.code === 'invalid-enum-value');
          expect(match?.suggestion).toContain('Alpha, Beta');
        });
      },
    );

    RuleScenario(
      'Known value for value-format tag emits no diagnostic',
      ({ Given, When, Then, And }) => {
        Given(
          'a registry that declares "test-area" as a value-format tag with values "Alpha, Beta"',
          () => {
            state.registry = buildRegistryWith({
              tag: 'test-area',
              format: 'value',
              purpose: 'Synthetic test tag for value-format canonical-values dispatch',
              required: false,
              repeatable: false,
              values: ['Alpha', 'Beta'],
            });
          },
        );

        When('I extract a feature using "@architect-test-area:Alpha"', () => {
          runExtraction('Alpha');
        });

        Then('no "invalid-enum-value" diagnostic is emitted', () => {
          const match = state.diagnostics.find(
            (d) => d.code === 'invalid-enum-value' && d.message.includes('@architect-test-area'),
          );
          expect(match).toBeUndefined();
        });

        And('the metadata records test-area as "Alpha"', () => {
          expect(state.metadata?.['testArea']).toBe('Alpha');
        });
      },
    );
  });
});
