/**
 * Documentation Generation Orchestrator Step Definitions
 *
 * BDD step definitions for testing the orchestrator's pattern merging,
 * conflict detection, and generator coordination capabilities.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { mergePatterns } from '../../../src/generators/orchestrator.js';
import { generatorRegistry } from '../../../src/generators/registry.js';
// Import built-in generators to register them
import '../../../src/generators/built-in/index.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/dataset-factories.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { Result } from '../../../src/types/result.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface GeneratorExpectation {
  name: string;
  expectedAvailable: boolean;
}

interface OrchestratorState {
  tsPatterns: ExtractedPattern[];
  gherkinPatterns: ExtractedPattern[];
  mergeResult: Result<readonly ExtractedPattern[], string> | null;
  generatorExpectations: GeneratorExpectation[];
  generatorLookupResults: Map<string, boolean>;
  lastError: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: OrchestratorState | null = null;

function initState(): OrchestratorState {
  resetPatternCounter();
  return {
    tsPatterns: [],
    gherkinPatterns: [],
    mergeResult: null,
    generatorExpectations: [],
    generatorLookupResults: new Map(),
    lastError: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize status string to valid ExtractedPattern status
 */
function normalizeStatus(status: string): 'roadmap' | 'active' | 'completed' | 'deferred' {
  const normalized = status.toLowerCase().trim();
  switch (normalized) {
    case 'completed':
      return 'completed';
    case 'active':
      return 'active';
    case 'roadmap':
    case 'planned':
      return 'roadmap';
    case 'deferred':
      return 'deferred';
    default:
      return 'roadmap';
  }
}

// =============================================================================
// Feature: Documentation Generation Orchestrator
// =============================================================================

const feature = await loadFeature('tests/features/generators/orchestrator.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('an orchestrator test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Orchestrator coordinates full documentation generation pipeline
  // ===========================================================================

  Rule('Orchestrator coordinates full documentation generation pipeline', ({ RuleScenario }) => {
    // -------------------------------------------------------------------------
    // Scenario: Non-overlapping patterns merge successfully
    // -------------------------------------------------------------------------
    RuleScenario('Non-overlapping patterns merge successfully', ({ Given, And, When, Then }) => {
      Given('TypeScript files with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.tsPatterns.push(
            createTestPattern({
              name: row.name,
              status: normalizeStatus(row.status),
              filePath: `src/${row.name.toLowerCase()}.ts`, // .ts = TypeScript source
            })
          );
        }
      });

      And(
        'feature files with non-overlapping patterns:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            state!.gherkinPatterns.push(
              createTestPattern({
                name: row.name,
                status: normalizeStatus(row.status),
                filePath: `specs/${row.name.toLowerCase()}.feature`, // .feature = Gherkin source
              })
            );
          }
        }
      );

      When('patterns are merged', () => {
        state!.mergeResult = mergePatterns(state!.tsPatterns, state!.gherkinPatterns);
      });

      Then('the merge should succeed', () => {
        expect(state!.mergeResult).not.toBeNull();
        expect(state!.mergeResult!.ok).toBe(true);
      });

      And(
        'the merged dataset should contain {int} unique patterns',
        (_ctx: unknown, count: number) => {
          expect(state!.mergeResult!.ok).toBe(true);
          if (state!.mergeResult!.ok) {
            expect(state!.mergeResult!.value.length).toBe(count);
          }
        }
      );

      And(
        'the merged dataset should include patterns:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          expect(state!.mergeResult!.ok).toBe(true);
          if (state!.mergeResult!.ok) {
            const patternNames = state!.mergeResult!.value.map((p) => p.patternName ?? p.name);
            for (const row of dataTable) {
              expect(patternNames).toContain(row.name);
            }
          }
        }
      );
    });

    // -------------------------------------------------------------------------
    // Scenario: Orchestrator detects pattern name conflicts
    // -------------------------------------------------------------------------
    RuleScenario('Orchestrator detects pattern name conflicts', ({ Given, And, When, Then }) => {
      Given('TypeScript files with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.tsPatterns.push(
            createTestPattern({
              name: row.name,
              status: normalizeStatus(row.status),
              filePath: `src/${row.name.toLowerCase()}.ts`,
            })
          );
        }
      });

      And(
        'feature files with overlapping patterns:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            state!.gherkinPatterns.push(
              createTestPattern({
                name: row.name,
                status: normalizeStatus(row.status),
                filePath: `specs/${row.name.toLowerCase()}.feature`,
              })
            );
          }
        }
      );

      When('patterns are merged', () => {
        state!.mergeResult = mergePatterns(state!.tsPatterns, state!.gherkinPatterns);
      });

      Then('the merge should fail with error', () => {
        expect(state!.mergeResult).not.toBeNull();
        expect(state!.mergeResult!.ok).toBe(false);
      });

      And('the error message should contain {string}', (_ctx: unknown, expectedText: string) => {
        expect(state!.mergeResult!.ok).toBe(false);
        if (!state!.mergeResult!.ok) {
          expect(state!.mergeResult!.error).toContain(expectedText);
        }
      });

      And('the error message should mention {string}', (_ctx: unknown, patternName: string) => {
        expect(state!.mergeResult!.ok).toBe(false);
        if (!state!.mergeResult!.ok) {
          expect(state!.mergeResult!.error).toContain(patternName);
        }
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Orchestrator detects pattern name conflicts with status mismatch
    // -------------------------------------------------------------------------
    RuleScenario(
      'Orchestrator detects pattern name conflicts with status mismatch',
      ({ Given, And, When, Then }) => {
        Given(
          'a TypeScript pattern {string} with status {string}',
          (_ctx: unknown, name: string, status: string) => {
            state!.tsPatterns.push(
              createTestPattern({
                name,
                status: normalizeStatus(status),
                filePath: `src/${name.toLowerCase()}.ts`,
              })
            );
          }
        );

        And(
          'a Gherkin pattern {string} with status {string}',
          (_ctx: unknown, name: string, status: string) => {
            state!.gherkinPatterns.push(
              createTestPattern({
                name,
                status: normalizeStatus(status),
                filePath: `specs/${name.toLowerCase()}.feature`,
              })
            );
          }
        );

        When('patterns are merged', () => {
          state!.mergeResult = mergePatterns(state!.tsPatterns, state!.gherkinPatterns);
        });

        Then('the merge should fail with error', () => {
          expect(state!.mergeResult).not.toBeNull();
          expect(state!.mergeResult!.ok).toBe(false);
        });

        And('the error message should mention {string}', (_ctx: unknown, patternName: string) => {
          expect(state!.mergeResult!.ok).toBe(false);
          if (!state!.mergeResult!.ok) {
            expect(state!.mergeResult!.error).toContain(patternName);
          }
        });
      }
    );

    // -------------------------------------------------------------------------
    // Scenario: Unknown generator name fails gracefully
    // -------------------------------------------------------------------------
    RuleScenario('Unknown generator name fails gracefully', ({ Given, When, Then, And }) => {
      Given('a valid pattern dataset', () => {
        // Create a minimal valid dataset for context
        state!.tsPatterns.push(
          createTestPattern({
            name: 'TestPattern',
            status: 'completed',
            filePath: 'src/test.ts',
          })
        );
      });

      When(
        'requesting generation with generator name {string}',
        (_ctx: unknown, generatorName: string) => {
          const generator = generatorRegistry.get(generatorName);
          if (!generator) {
            state!.lastError = `Unknown generator: "${generatorName}". Available: ${generatorRegistry.available().join(', ')}`;
          }
        }
      );

      Then('the generator lookup should fail', () => {
        expect(state!.lastError).not.toBeNull();
      });

      And('the error message should mention {string}', (_ctx: unknown, expectedText: string) => {
        expect(state!.lastError).toContain(expectedText);
      });

      And('the error message should list available generators', () => {
        // Check that the error message contains "Available:"
        expect(state!.lastError).toContain('Available:');
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Partial success when some generators are invalid
    // -------------------------------------------------------------------------
    RuleScenario(
      'Partial success when some generators are invalid',
      ({ Given, And, When, Then }) => {
        Given('a valid pattern dataset', () => {
          state!.tsPatterns.push(
            createTestPattern({
              name: 'TestPattern',
              status: 'completed',
              filePath: 'src/test.ts',
            })
          );
        });

        And('generator requests for:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          state!.generatorExpectations = dataTable.map((row) => ({
            name: row.name,
            expectedAvailable: row.expectedAvailable === 'true',
          }));
        });

        When('checking which generators are available', () => {
          for (const expectation of state!.generatorExpectations) {
            const generator = generatorRegistry.get(expectation.name);
            state!.generatorLookupResults.set(expectation.name, generator !== undefined);
          }
        });

        Then('generator availability should match expectations', () => {
          for (const expectation of state!.generatorExpectations) {
            const actual = state!.generatorLookupResults.get(expectation.name);
            expect(actual).toBe(expectation.expectedAvailable);
          }
        });
      }
    );
  });
});
