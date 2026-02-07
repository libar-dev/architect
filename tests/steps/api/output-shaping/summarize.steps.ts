/**
 * Pattern Summarization Step Definitions
 *
 * Tests for summarizePattern() and summarizePatterns() projection functions.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  summarizePattern,
  summarizePatterns,
  type PatternSummary,
} from '../../../../src/api/summarize.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';

const feature = await loadFeature('tests/features/api/output-shaping/summarize.feature');

// =============================================================================
// Test State
// =============================================================================

interface SummarizeTestState {
  pattern: ExtractedPattern | null;
  patterns: ExtractedPattern[];
  summary: PatternSummary | null;
  summaries: readonly PatternSummary[];
}

let state: SummarizeTestState | null = null;

function initState(): SummarizeTestState {
  return {
    pattern: null,
    patterns: [],
    summary: null,
    summaries: [],
  };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  Rule('summarizePattern projects to compact summary', ({ RuleScenario }) => {
    RuleScenario(
      'Summary includes all 6 fields for a TypeScript pattern',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript pattern {string} with status {string} in phase {int}',
          (_ctx: unknown, name: string, status: string, phase: number) => {
            state = initState();
            state.pattern = createTestPattern({
              name,
              patternName: name,
              status: status as 'active' | 'roadmap' | 'completed' | 'deferred',
              phase,
              category: 'projection',
              filePath: 'src/domain/order-saga.ts',
            });
          }
        );

        When('I summarize the pattern', () => {
          state!.summary = summarizePattern(state!.pattern!);
        });

        Then('the summary has patternName {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.patternName).toBe(expected);
        });

        And('the summary has status {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.status).toBe(expected);
        });

        And('the summary has category {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.category).toBe(expected);
        });

        And('the summary has phase {int}', (_ctx: unknown, expected: number) => {
          expect(state!.summary!.phase).toBe(expected);
        });

        And('the summary has source {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.source).toBe(expected);
        });

        And('the summary file ends with {string}', (_ctx: unknown, ext: string) => {
          expect(state!.summary!.file.endsWith(ext)).toBe(true);
        });
      }
    );

    RuleScenario(
      'Summary includes all 6 fields for a Gherkin pattern',
      ({ Given, When, Then, And }) => {
        Given(
          'a Gherkin pattern {string} with status {string} in phase {int}',
          (_ctx: unknown, name: string, status: string, phase: number) => {
            state = initState();
            state.pattern = createTestPattern({
              name,
              patternName: name,
              status: status as 'active' | 'roadmap' | 'completed' | 'deferred',
              phase,
              category: 'projection',
              filePath: 'specs/process-guard.feature',
            });
          }
        );

        When('I summarize the pattern', () => {
          state!.summary = summarizePattern(state!.pattern!);
        });

        Then('the summary has patternName {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.patternName).toBe(expected);
        });

        And('the summary has status {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.status).toBe(expected);
        });

        And('the summary has source {string}', (_ctx: unknown, expected: string) => {
          expect(state!.summary!.source).toBe(expected);
        });

        And('the summary file ends with {string}', (_ctx: unknown, ext: string) => {
          expect(state!.summary!.file.endsWith(ext)).toBe(true);
        });
      }
    );

    RuleScenario('Summary uses patternName tag over name field', ({ Given, When, Then }) => {
      Given(
        'a pattern with name {string} and patternName tag {string}',
        (_ctx: unknown, name: string, patternName: string) => {
          state = initState();
          const pattern = createTestPattern({
            name,
            filePath: 'src/test.ts',
          });
          // Override patternName to differ from name (factory always sets patternName = name)
          state.pattern = { ...pattern, patternName };
        }
      );

      When('I summarize the pattern', () => {
        state!.summary = summarizePattern(state!.pattern!);
      });

      Then('the summary has patternName {string}', (_ctx: unknown, expected: string) => {
        expect(state!.summary!.patternName).toBe(expected);
      });
    });

    RuleScenario('Summary omits undefined optional fields', ({ Given, When, Then, And }) => {
      Given('a pattern without status or phase', () => {
        state = initState();
        state.pattern = createTestPattern({
          name: 'SimplePattern',
          filePath: 'src/test.ts',
        });
        // Ensure status and phase are undefined
        (state.pattern as Record<string, unknown>).status = undefined;
        (state.pattern as Record<string, unknown>).phase = undefined;
      });

      When('I summarize the pattern', () => {
        state!.summary = summarizePattern(state!.pattern!);
      });

      Then('the summary does not have a status field', () => {
        expect(state!.summary!.status).toBeUndefined();
      });

      And('the summary does not have a phase field', () => {
        expect(state!.summary!.phase).toBeUndefined();
      });
    });
  });

  Rule('summarizePatterns batch processes arrays', ({ RuleScenario }) => {
    RuleScenario('Batch summarization returns correct count', ({ Given, When, Then, And }) => {
      Given('5 patterns exist with various statuses', () => {
        state = initState();
        const statuses: Array<'active' | 'roadmap' | 'completed'> = [
          'active',
          'roadmap',
          'completed',
          'active',
          'roadmap',
        ];
        state.patterns = statuses.map((status, i) =>
          createTestPattern({
            name: `Pattern${i}`,
            patternName: `Pattern${i}`,
            status,
            filePath: `src/pattern-${i}.ts`,
          })
        );
      });

      When('I summarize all patterns', () => {
        state!.summaries = summarizePatterns(state!.patterns);
      });

      Then('I get {int} summaries', (_ctx: unknown, count: number) => {
        expect(state!.summaries).toHaveLength(count);
      });

      And('each summary has a patternName field', () => {
        for (const summary of state!.summaries) {
          expect(summary.patternName).toBeDefined();
          expect(summary.patternName.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
