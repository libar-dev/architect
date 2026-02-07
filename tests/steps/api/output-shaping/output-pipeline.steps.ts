/**
 * Output Pipeline Step Definitions
 *
 * Tests for applyOutputPipeline(), applyListFilters(), validateModifiers(), stripEmpty().
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  applyOutputPipeline,
  applyListFilters,
  validateModifiers,
  stripEmpty,
  DEFAULT_OUTPUT_MODIFIERS,
  DEFAULT_LIST_FILTERS,
  type PipelineInput,
} from '../../../../src/cli/output-pipeline.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/api/output-shaping/output-pipeline.feature');

// =============================================================================
// Test State
// =============================================================================

interface PipelineTestState {
  patterns: ExtractedPattern[];
  dataset: MasterDataset | null;
  output: unknown;
  error: Error | null;
  scalarInput: unknown;
}

let state: PipelineTestState | null = null;

function initState(): PipelineTestState {
  return {
    patterns: [],
    dataset: null,
    output: undefined,
    error: null,
    scalarInput: undefined,
  };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  Rule('Output modifiers apply with correct precedence', ({ RuleScenario }) => {
    RuleScenario(
      'Default mode returns summaries for pattern arrays',
      ({ Given, When, Then, And }) => {
        Given('{int} patterns in the pipeline', (_ctx: unknown, count: number) => {
          state = initState();
          state.patterns = Array.from({ length: count }, (_, i) =>
            createTestPattern({
              name: `Pattern${i}`,
              status: 'active',
              filePath: `src/p${i}.ts`,
            })
          );
        });

        When('I apply the output pipeline with default modifiers', () => {
          const input: PipelineInput = { kind: 'patterns', data: state!.patterns };
          state!.output = applyOutputPipeline(input, DEFAULT_OUTPUT_MODIFIERS);
        });

        Then('the output is an array of {int} summaries', (_ctx: unknown, count: number) => {
          expect(Array.isArray(state!.output)).toBe(true);
          expect((state!.output as unknown[]).length).toBe(count);
        });

        And('each summary has a patternName field', () => {
          for (const item of state!.output as Array<Record<string, unknown>>) {
            expect(item.patternName).toBeDefined();
          }
        });
      }
    );

    RuleScenario('Count modifier returns integer', ({ Given, When, Then }) => {
      Given('{int} patterns in the pipeline', (_ctx: unknown, count: number) => {
        state = initState();
        state.patterns = Array.from({ length: count }, (_, i) =>
          createTestPattern({ name: `P${i}`, filePath: `src/p${i}.ts` })
        );
      });

      When('I apply the output pipeline with count modifier', () => {
        const input: PipelineInput = { kind: 'patterns', data: state!.patterns };
        state!.output = applyOutputPipeline(input, { ...DEFAULT_OUTPUT_MODIFIERS, count: true });
      });

      Then('the output is the number {int}', (_ctx: unknown, expected: number) => {
        expect(state!.output).toBe(expected);
      });
    });

    RuleScenario('Names-only modifier returns string array', ({ Given, When, Then }) => {
      Given(
        '{int} patterns named {string}, {string}, {string} in the pipeline',
        (_ctx: unknown, _count: number, a: string, b: string, c: string) => {
          state = initState();
          state.patterns = [a, b, c].map((name) =>
            createTestPattern({ name, filePath: `src/${name.toLowerCase()}.ts` })
          );
        }
      );

      When('I apply the output pipeline with names-only modifier', () => {
        const input: PipelineInput = { kind: 'patterns', data: state!.patterns };
        state!.output = applyOutputPipeline(input, {
          ...DEFAULT_OUTPUT_MODIFIERS,
          namesOnly: true,
        });
      });

      Then(
        'the output is an array of strings {string}, {string}, {string}',
        (_ctx: unknown, a: string, b: string, c: string) => {
          expect(state!.output).toEqual([a, b, c]);
        }
      );
    });

    RuleScenario('Fields modifier picks specific fields', ({ Given, When, Then }) => {
      Given('{int} patterns in the pipeline', (_ctx: unknown, count: number) => {
        state = initState();
        state.patterns = Array.from({ length: count }, (_, i) =>
          createTestPattern({
            name: `P${i}`,
            status: 'active',
            filePath: `src/p${i}.ts`,
          })
        );
      });

      When(
        'I apply the output pipeline with fields {string}',
        (_ctx: unknown, fieldsStr: string) => {
          const fields = fieldsStr.split(',');
          const input: PipelineInput = { kind: 'patterns', data: state!.patterns };
          state!.output = applyOutputPipeline(input, {
            ...DEFAULT_OUTPUT_MODIFIERS,
            fields,
          });
        }
      );

      Then(
        'each output object has only {string} and {string} keys',
        (_ctx: unknown, key1: string, key2: string) => {
          for (const item of state!.output as Array<Record<string, unknown>>) {
            const keys = Object.keys(item);
            expect(keys.sort()).toEqual([key1, key2].sort());
          }
        }
      );
    });

    RuleScenario('Full modifier bypasses summarization', ({ Given, When, Then }) => {
      Given('{int} patterns in the pipeline', (_ctx: unknown, count: number) => {
        state = initState();
        state.patterns = Array.from({ length: count }, (_, i) =>
          createTestPattern({ name: `P${i}`, filePath: `src/p${i}.ts` })
        );
      });

      When('I apply the output pipeline with full modifier', () => {
        const input: PipelineInput = { kind: 'patterns', data: state!.patterns };
        state!.output = applyOutputPipeline(input, { ...DEFAULT_OUTPUT_MODIFIERS, full: true });
      });

      Then('each output object has a {string} field', (_ctx: unknown, field: string) => {
        for (const item of state!.output as Array<Record<string, unknown>>) {
          expect(item[field]).toBeDefined();
        }
      });
    });

    RuleScenario('Scalar input passes through unchanged', ({ Given, When, Then }) => {
      Given('a scalar value in the pipeline', () => {
        state = initState();
        state.scalarInput = { counts: { completed: 5, active: 2, planned: 3, total: 10 } };
      });

      When('I apply the output pipeline with default modifiers', () => {
        const input: PipelineInput = { kind: 'scalar', data: state!.scalarInput };
        state!.output = applyOutputPipeline(input, DEFAULT_OUTPUT_MODIFIERS);
      });

      Then('the output equals the original scalar', () => {
        expect(state!.output).toEqual(state!.scalarInput);
      });
    });
  });

  Rule('Modifier conflicts are rejected', ({ RuleScenario }) => {
    RuleScenario('Full combined with names-only is rejected', ({ When, Then }) => {
      When('I validate modifiers with full and names-only both true', () => {
        state = initState();
        try {
          validateModifiers({ ...DEFAULT_OUTPUT_MODIFIERS, full: true, namesOnly: true });
        } catch (e) {
          state.error = e instanceof Error ? e : new Error(String(e));
        }
      });

      Then('validation fails with {string}', (_ctx: unknown, expected: string) => {
        expect(state!.error).not.toBeNull();
        expect(state!.error?.message).toContain(expected);
      });
    });

    RuleScenario('Invalid field name is rejected', ({ When, Then }) => {
      When('I validate modifiers with fields {string}', (_ctx: unknown, fieldsStr: string) => {
        state = initState();
        const fields = fieldsStr.split(',');
        try {
          validateModifiers({ ...DEFAULT_OUTPUT_MODIFIERS, fields });
        } catch (e) {
          state.error = e instanceof Error ? e : new Error(String(e));
        }
      });

      Then('validation fails with {string}', (_ctx: unknown, expected: string) => {
        expect(state!.error).not.toBeNull();
        expect(state!.error?.message).toContain(expected);
      });
    });
  });

  Rule('List filters compose via AND logic', ({ RuleScenario }) => {
    RuleScenario('Filter by status returns matching patterns', ({ Given, When, Then }) => {
      Given(
        'a dataset with {int} active and {int} roadmap patterns',
        (_ctx: unknown, activeCount: number, roadmapCount: number) => {
          state = initState();
          const patterns = [
            ...Array.from({ length: activeCount }, (_, i) =>
              createTestPattern({
                name: `Active${i}`,
                status: 'active',
                filePath: `src/a${i}.ts`,
              })
            ),
            ...Array.from({ length: roadmapCount }, (_, i) =>
              createTestPattern({
                name: `Roadmap${i}`,
                status: 'roadmap',
                filePath: `src/r${i}.ts`,
              })
            ),
          ];
          state.dataset = createTestMasterDataset({ patterns });
        }
      );

      When('I apply list filters with status {string}', (_ctx: unknown, status: string) => {
        state!.output = applyListFilters(state!.dataset!, {
          ...DEFAULT_LIST_FILTERS,
          status,
        });
      });

      Then('{int} patterns are returned', (_ctx: unknown, count: number) => {
        expect((state!.output as unknown[]).length).toBe(count);
      });
    });

    RuleScenario('Filter by status and category narrows results', ({ Given, When, Then }) => {
      Given(
        'a dataset with active patterns in categories {string} and {string}',
        (_ctx: unknown, cat1: string, cat2: string) => {
          state = initState();
          const patterns = [
            createTestPattern({
              name: 'CoreOne',
              status: 'active',
              category: cat1,
              filePath: 'src/core1.ts',
            }),
            createTestPattern({
              name: 'CoreTwo',
              status: 'active',
              category: cat1,
              filePath: 'src/core2.ts',
            }),
            createTestPattern({
              name: 'ApiOne',
              status: 'active',
              category: cat2,
              filePath: 'src/api1.ts',
            }),
          ];
          state.dataset = createTestMasterDataset({ patterns });
        }
      );

      When(
        'I apply list filters with status {string} and category {string}',
        (_ctx: unknown, status: string, category: string) => {
          state!.output = applyListFilters(state!.dataset!, {
            ...DEFAULT_LIST_FILTERS,
            status,
            category,
          });
        }
      );

      Then('only core patterns are returned', () => {
        const results = state!.output as ExtractedPattern[];
        expect(results.length).toBe(2);
        for (const p of results) {
          expect(p.category.toLowerCase()).toBe('core');
        }
      });
    });

    RuleScenario('Pagination with limit and offset', ({ Given, When, Then }) => {
      Given('a dataset with {int} roadmap patterns', (_ctx: unknown, count: number) => {
        state = initState();
        const patterns = Array.from({ length: count }, (_, i) =>
          createTestPattern({
            name: `Roadmap${i}`,
            status: 'roadmap',
            filePath: `src/r${i}.ts`,
          })
        );
        state.dataset = createTestMasterDataset({ patterns });
      });

      When(
        'I apply list filters with limit {int} and offset {int}',
        (_ctx: unknown, limit: number, offset: number) => {
          state!.output = applyListFilters(state!.dataset!, {
            ...DEFAULT_LIST_FILTERS,
            limit,
            offset,
          });
        }
      );

      Then(
        '{int} patterns are returned starting from index {int}',
        (_ctx: unknown, count: number, _startIndex: number) => {
          const results = state!.output as ExtractedPattern[];
          expect(results.length).toBe(count);
        }
      );
    });
  });

  Rule('Empty stripping removes noise', ({ RuleScenario }) => {
    RuleScenario('Null and empty values are stripped', ({ Given, When, Then, And }) => {
      Given('an object with null, empty string, and empty array values', () => {
        state = initState();
        state.scalarInput = {
          name: 'test',
          status: null,
          description: '',
          tags: [],
          nested: { value: undefined, keep: 42 },
        };
      });

      When('I strip empty values', () => {
        state!.output = stripEmpty(state!.scalarInput);
      });

      Then('the result does not contain null values', () => {
        const result = state!.output as Record<string, unknown>;
        expect(result.status).toBeUndefined();
      });

      And('the result does not contain empty strings', () => {
        const result = state!.output as Record<string, unknown>;
        expect(result.description).toBeUndefined();
      });

      And('the result does not contain empty arrays', () => {
        const result = state!.output as Record<string, unknown>;
        expect(result.tags).toBeUndefined();
      });
    });
  });
});
