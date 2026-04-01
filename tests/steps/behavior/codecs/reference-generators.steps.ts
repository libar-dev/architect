/**
 * Step definitions for Reference Generator Registration tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { PatternGraph } from '../../../../src/validation-schemas/pattern-graph.js';
import type { ExtractedShape } from '../../../../src/validation-schemas/extracted-shape.js';
import type { GeneratorOutput, GeneratorContext } from '../../../../src/generators/types.js';
import { GeneratorRegistry } from '../../../../src/generators/registry.js';
import {
  registerReferenceGenerators,
  createProductAreaConfigs,
} from '../../../../src/generators/built-in/reference-generators.js';
import type { ReferenceDocConfig } from '../../../../src/renderable/codecs/reference.js';
import { createTestPattern, resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { createTestPatternGraph } from '../../../fixtures/dataset-factories.js';
import { buildRegistry } from '../../../../src/taxonomy/registry-builder.js';

// ============================================================================
// Test Configs
// ============================================================================

/**
 * Test configs: 7 product area configs + 2 manual reference configs.
 * Mirrors the shape of architect.config.ts.
 */
const TEST_CONFIGS: readonly ReferenceDocConfig[] = [
  ...createProductAreaConfigs(),
  {
    title: 'Architecture Types Reference',
    conventionTags: ['pipeline-architecture'],
    shapeSelectors: [{ group: 'pattern-graph' }],
    behaviorCategories: [],
    claudeMdSection: 'architecture',
    docsFilename: 'ARCHITECTURE-TYPES.md',
    claudeMdFilename: 'architecture-types.md',
    diagramScopes: [{ title: 'PatternGraph View Fan-out', source: 'pattern-graph-views' }],
  },
  {
    title: 'Reference Generation Sample',
    conventionTags: ['taxonomy-rules'],
    shapeSelectors: [{ group: 'reference-sample' }],
    behaviorCategories: [],
    includeTags: ['reference-sample'],
    claudeMdSection: 'architecture',
    docsFilename: 'REFERENCE-SAMPLE.md',
    claudeMdFilename: 'reference-sample.md',
  },
];

// ============================================================================
// State
// ============================================================================

interface ReferenceGeneratorState {
  registry: GeneratorRegistry;
  dataset: PatternGraph | null;
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

function makeMinimalContext(dataset: PatternGraph): GeneratorContext {
  return {
    baseDir: '/tmp/test',
    outputDir: '/tmp/test/output',
    registry: buildRegistry(),
    patternGraph: dataset as GeneratorContext['patternGraph'],
  };
}

function createShape(name: string, group?: string): ExtractedShape {
  return {
    name,
    kind: 'interface',
    sourceText: `export interface ${name} {}`,
    lineNumber: 1,
    exported: true,
    ...(group !== undefined ? { group } : {}),
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
      'Generators are registered from configs plus meta-generators',
      ({ When, Then }) => {
        When('registering reference generators', () => {
          registerReferenceGenerators(state!.registry, TEST_CONFIGS);
        });

        Then('{int} generators are registered', (_ctx: unknown, count: number) => {
          expect(state!.registry.available()).toHaveLength(count);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Product area configs produce a separate meta-generator
  // ──────────────────────────────────────────────────────────────────────

  Rule('Product area configs produce a separate meta-generator', ({ RuleScenario }) => {
    RuleScenario('Product area meta-generator is registered', ({ When, Then, And }) => {
      When('registering reference generators', () => {
        registerReferenceGenerators(state!.registry, TEST_CONFIGS);
      });

      Then('a generator named {string} exists', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });

      And('a generator named {string} exists', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Generator naming follows kebab-case convention
  // ──────────────────────────────────────────────────────────────────────

  Rule('Generator naming follows kebab-case convention', ({ RuleScenario }) => {
    RuleScenario('Detailed generator has name ending in "-reference"', ({ When, Then, And }) => {
      When('registering reference generators', () => {
        registerReferenceGenerators(state!.registry, TEST_CONFIGS);
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
          registerReferenceGenerators(state!.registry, TEST_CONFIGS);
        });

        Then('a generator named {string} exists', (_ctx: unknown, name: string) => {
          expect(state!.registry.has(name)).toBe(true);
        });

        And('a generator named {string} exists', (_ctx: unknown, name: string) => {
          expect(state!.registry.has(name)).toBe(true);
        });
      }
    );

    RuleScenario('Architecture-types generators are registered', ({ When, Then, And }) => {
      When('registering reference generators', () => {
        registerReferenceGenerators(state!.registry, TEST_CONFIGS);
      });

      Then('a generator named {string} exists', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });

      And('a generator named {string} exists', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Generator execution produces markdown output
  // ──────────────────────────────────────────────────────────────────────

  Rule('Generator execution produces markdown output', ({ RuleScenario }) => {
    RuleScenario(
      'Product area generator with matching data produces non-empty output',
      ({ Given, When, Then, And }) => {
        Given(
          'a PatternGraph with a pattern in product area {string}',
          (_ctx: unknown, area: string) => {
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'TestAnnotationPattern',
                  productArea: area,
                  rules: [
                    {
                      name: 'Test Rule',
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
          registerReferenceGenerators(state!.registry, TEST_CONFIGS);
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
      'Product area generator with no patterns still produces intro',
      ({ Given, When, Then, And }) => {
        Given('an empty PatternGraph', () => {
          state!.dataset = createTestPatternGraph({ patterns: [] });
        });

        When('running the {string} generator', async (_ctx: unknown, generatorName: string) => {
          registerReferenceGenerators(state!.registry, TEST_CONFIGS);
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

    RuleScenario(
      'ARCHITECTURE-TYPES generator produces shapes and convention content',
      ({ Given, When, Then, And }) => {
        Given(
          'a PatternGraph with pipeline architecture conventions and master dataset shapes',
          () => {
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'Documentation Generation Orchestrator',
                  category: 'core',
                  convention: ['pipeline-architecture'],
                  description: `## Orchestrator Pipeline Responsibilities

**Invariant:** Orchestrator owns final generation wiring.

## Steps 9-10: Codec Execution and File Writing

Codec decode and file write happen after shared dataset build.`,
                }),
                createTestPattern({
                  name: 'PatternGraph',
                  category: 'core',
                  extractedShapes: [
                    createShape('PatternGraphSchema', 'pattern-graph'),
                    createShape('PipelineOptions', 'pattern-graph'),
                  ],
                }),
              ],
            });
          }
        );

        When('running the {string} generator', async (_ctx: unknown, generatorName: string) => {
          registerReferenceGenerators(state!.registry, TEST_CONFIGS);
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

        And(
          'the output file content contains all of {string}, {string}, {string}, and {string}',
          (_ctx: unknown, text1: string, text2: string, text3: string, text4: string) => {
            const content = state!.output!.files[0]!.content;
            expect(content).toContain(text1);
            expect(content).toContain(text2);
            expect(content).toContain(text3);
            expect(content).toContain(text4);
          }
        );
      }
    );
  });
});
