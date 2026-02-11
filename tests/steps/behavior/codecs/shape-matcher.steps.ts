/**
 * Step definitions for Shape Matcher tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  matchesShapePattern,
  extractShapesFromDataset,
} from '../../../../src/renderable/codecs/shape-matcher.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import type { ExtractedShape } from '../../../../src/validation-schemas/extracted-shape.js';
import { createTestPattern, resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';

// ============================================================================
// State
// ============================================================================

interface ShapeMatcherState {
  matchResult: boolean | null;
  dataset: MasterDataset | null;
  extractedShapes: readonly ExtractedShape[];
}

function initState(): ShapeMatcherState {
  resetPatternCounter();
  return { matchResult: null, dataset: null, extractedShapes: [] };
}

let state: ShapeMatcherState | null = null;

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/shape-matcher.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a shape matcher test context', () => {
      state = initState();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Exact paths match without wildcards
  // ──────────────────────────────────────────────────────────────────────

  Rule('Exact paths match without wildcards', ({ RuleScenario }) => {
    RuleScenario('Exact path matches identical path', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is true', () => {
        expect(state!.matchResult).toBe(true);
      });
    });

    RuleScenario('Exact path does not match different path', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is false', () => {
        expect(state!.matchResult).toBe(false);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Single-level globs match one directory level
  // ──────────────────────────────────────────────────────────────────────

  Rule('Single-level globs match one directory level', ({ RuleScenario }) => {
    RuleScenario('Single glob matches file in target directory', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is true', () => {
        expect(state!.matchResult).toBe(true);
      });
    });

    RuleScenario('Single glob does not match nested subdirectory', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is false', () => {
        expect(state!.matchResult).toBe(false);
      });
    });

    RuleScenario('Single glob does not match wrong extension', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is false', () => {
        expect(state!.matchResult).toBe(false);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Recursive globs match any depth
  // ──────────────────────────────────────────────────────────────────────

  Rule('Recursive globs match any depth', ({ RuleScenario }) => {
    RuleScenario('Recursive glob matches file at target depth', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is true', () => {
        expect(state!.matchResult).toBe(true);
      });
    });

    RuleScenario('Recursive glob matches file at deeper depth', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is true', () => {
        expect(state!.matchResult).toBe(true);
      });
    });

    RuleScenario('Recursive glob matches file at top level', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is true', () => {
        expect(state!.matchResult).toBe(true);
      });
    });

    RuleScenario('Recursive glob does not match wrong prefix', ({ When, Then }) => {
      When(
        'matching path {string} against pattern {string}',
        (_ctx: unknown, filePath: string, pattern: string) => {
          state!.matchResult = matchesShapePattern(filePath, pattern);
        }
      );

      Then('the match result is false', () => {
        expect(state!.matchResult).toBe(false);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Dataset shape extraction deduplicates by name
  // ──────────────────────────────────────────────────────────────────────

  Rule('Dataset shape extraction deduplicates by name', ({ RuleScenario }) => {
    RuleScenario('Shapes are extracted from matching patterns', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with patterns:',
        (_ctx: unknown, dataTable: Array<Record<string, string>>) => {
          const patterns = dataTable.map((row) =>
            createTestPattern({
              filePath: row['filePath']!,
              extractedShapes: [
                {
                  name: row['shapeName']!,
                  kind: row['shapeKind']! as ExtractedShape['kind'],
                  sourceText: `export ${row['shapeKind']!} ${row['shapeName']!} {}`,
                  lineNumber: 1,
                  exported: true,
                },
              ],
            })
          );
          state!.dataset = createTestMasterDataset({ patterns });
        }
      );

      When('extracting shapes with source pattern {string}', (_ctx: unknown, pattern: string) => {
        state!.extractedShapes = extractShapesFromDataset(state!.dataset!, [pattern]);
      });

      Then('{int} shapes are returned', (_ctx: unknown, count: number) => {
        expect(state!.extractedShapes).toHaveLength(count);
      });

      And(
        'the shape names are {string} and {string}',
        (_ctx: unknown, name1: string, name2: string) => {
          const names = state!.extractedShapes.map((s) => s.name);
          expect(names).toContain(name1);
          expect(names).toContain(name2);
        }
      );
    });

    RuleScenario('Duplicate shape names are deduplicated', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with patterns:',
        (_ctx: unknown, dataTable: Array<Record<string, string>>) => {
          const patterns = dataTable.map((row) =>
            createTestPattern({
              filePath: row['filePath']!,
              extractedShapes: [
                {
                  name: row['shapeName']!,
                  kind: row['shapeKind']! as ExtractedShape['kind'],
                  sourceText: `export ${row['shapeKind']!} ${row['shapeName']!} {}`,
                  lineNumber: 1,
                  exported: true,
                },
              ],
            })
          );
          state!.dataset = createTestMasterDataset({ patterns });
        }
      );

      When('extracting shapes with source pattern {string}', (_ctx: unknown, pattern: string) => {
        state!.extractedShapes = extractShapesFromDataset(state!.dataset!, [pattern]);
      });

      Then('{int} shapes are returned', (_ctx: unknown, count: number) => {
        expect(state!.extractedShapes).toHaveLength(count);
      });
    });

    RuleScenario('No shapes returned when glob does not match', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with patterns:',
        (_ctx: unknown, dataTable: Array<Record<string, string>>) => {
          const patterns = dataTable.map((row) =>
            createTestPattern({
              filePath: row['filePath']!,
              extractedShapes: [
                {
                  name: row['shapeName']!,
                  kind: row['shapeKind']! as ExtractedShape['kind'],
                  sourceText: `export ${row['shapeKind']!} ${row['shapeName']!} {}`,
                  lineNumber: 1,
                  exported: true,
                },
              ],
            })
          );
          state!.dataset = createTestMasterDataset({ patterns });
        }
      );

      When('extracting shapes with source pattern {string}', (_ctx: unknown, pattern: string) => {
        state!.extractedShapes = extractShapesFromDataset(state!.dataset!, [pattern]);
      });

      Then('{int} shapes are returned', (_ctx: unknown, count: number) => {
        expect(state!.extractedShapes).toHaveLength(count);
      });
    });
  });
});
