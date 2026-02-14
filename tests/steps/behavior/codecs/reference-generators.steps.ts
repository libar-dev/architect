/**
 * Step definitions for Reference Generator Registration tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import type { GeneratorOutput, GeneratorContext } from '../../../../src/generators/types.js';
import { GeneratorRegistry } from '../../../../src/generators/registry.js';
import { registerReferenceGenerators } from '../../../../src/generators/built-in/reference-generators.js';
import { createTestPattern, resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import { buildRegistry } from '../../../../src/taxonomy/registry-builder.js';

// ============================================================================
// State
// ============================================================================

interface ReferenceGeneratorState {
  registry: GeneratorRegistry;
  dataset: MasterDataset | null;
  output: GeneratorOutput | null;
}

function initState(): ReferenceGeneratorState {
  resetPatternCounter();
  return { registry: new GeneratorRegistry(), dataset: null, output: null };
}

let state: ReferenceGeneratorState | null = null;

// ============================================================================
// Helpers
// ============================================================================

function makeMinimalContext(dataset: MasterDataset): GeneratorContext {
  return {
    baseDir: '/tmp/test',
    outputDir: '/tmp/test/output',
    registry: buildRegistry(),
    masterDataset: dataset as GeneratorContext['masterDataset'],
  };
}

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/reference-generators.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a reference generator test context', () => {
      state = initState();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Registration produces the correct number of generators
  // ──────────────────────────────────────────────────────────────────────

  Rule('Registration produces the correct number of generators', ({ RuleScenario }) => {
    RuleScenario(
      'All 27 generators are registered from 13 configs plus meta-generator',
      ({ When, Then }) => {
        When('registering reference generators', () => {
          registerReferenceGenerators(state!.registry);
        });

        Then('{int} generators are registered', (_ctx: unknown, count: number) => {
          expect(state!.registry.available()).toHaveLength(count);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Generator naming follows kebab-case convention
  // ──────────────────────────────────────────────────────────────────────

  Rule('Generator naming follows kebab-case convention', ({ RuleScenario }) => {
    RuleScenario('Detailed generator has name ending in "-reference"', ({ When, Then, And }) => {
      When('registering reference generators', () => {
        registerReferenceGenerators(state!.registry);
      });

      Then('a generator named {string} exists', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });

      And('a generator named {string} exists', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });
    });

    RuleScenario(
      'Summary generator has name ending in "-reference-claude"',
      ({ When, Then, And }) => {
        When('registering reference generators', () => {
          registerReferenceGenerators(state!.registry);
        });

        Then('a generator named {string} exists', (_ctx: unknown, name: string) => {
          expect(state!.registry.has(name)).toBe(true);
        });

        And('a generator named {string} exists', (_ctx: unknown, name: string) => {
          expect(state!.registry.has(name)).toBe(true);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Generator execution produces markdown output
  // ──────────────────────────────────────────────────────────────────────

  Rule('Generator execution produces markdown output', ({ RuleScenario }) => {
    RuleScenario(
      'Generator with matching data produces non-empty output',
      ({ Given, When, Then, And }) => {
        Given(
          'a MasterDataset with a convention-tagged pattern for {string}',
          (_ctx: unknown, conventionTag: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'TestDecision',
                  convention: [conventionTag],
                  rules: [
                    {
                      name: 'Test Convention Rule',
                      description: '**Invariant:** Tests must pass.',
                      scenarioCount: 0,
                      scenarioNames: [],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('running the {string} generator', async (_ctx: unknown, generatorName: string) => {
          registerReferenceGenerators(state!.registry);
          const generator = state!.registry.get(generatorName);
          expect(generator).toBeDefined();
          const context = makeMinimalContext(state!.dataset!);
          state!.output = await generator!.generate([], context);
        });

        Then('the output has {int} file', (_ctx: unknown, count: number) => {
          expect(state!.output!.files).toHaveLength(count);
        });

        And('the output file path starts with {string}', (_ctx: unknown, prefix: string) => {
          expect(state!.output!.files[0]!.path.startsWith(prefix)).toBe(true);
        });

        And('the output file content is non-empty', () => {
          expect(state!.output!.files[0]!.content.length).toBeGreaterThan(0);
        });
      }
    );

    RuleScenario(
      'Generator with no matching data produces minimal output',
      ({ Given, When, Then, And }) => {
        Given('an empty MasterDataset', () => {
          state!.dataset = createTestMasterDataset({ patterns: [] });
        });

        When('running the {string} generator', async (_ctx: unknown, generatorName: string) => {
          registerReferenceGenerators(state!.registry);
          const generator = state!.registry.get(generatorName);
          expect(generator).toBeDefined();
          const context = makeMinimalContext(state!.dataset!);
          state!.output = await generator!.generate([], context);
        });

        Then('the output has {int} file', (_ctx: unknown, count: number) => {
          expect(state!.output!.files).toHaveLength(count);
        });

        And('the output file content contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.output!.files[0]!.content).toContain(text);
        });
      }
    );
  });
});
