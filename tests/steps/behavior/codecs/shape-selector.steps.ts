/**
 * Step definitions for Shape Selector filtering tests
 *
 * Tests the filterShapesBySelectors function that provides fine-grained
 * shape selection via structural discriminated union selectors.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { filterShapesBySelectors } from '../../../../src/renderable/codecs/shape-matcher.js';
import type { ShapeSelector } from '../../../../src/renderable/codecs/shape-matcher.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import type {
  ExtractedShape,
  ShapeKind,
} from '../../../../src/validation-schemas/extracted-shape.js';
import { createTestPattern, resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';

// ============================================================================
// Helpers
// ============================================================================

function createShape(name: string, kind: ShapeKind, group?: string): ExtractedShape {
  return {
    name,
    kind,
    sourceText: `export ${kind} ${name} {}`,
    lineNumber: 1,
    exported: true,
    ...(group !== undefined ? { group } : {}),
  };
}

interface ShapeRow {
  'Pattern Source': string;
  'Shape Name': string;
  Group: string;
  Kind: string;
}

function buildDatasetFromRows(rows: readonly ShapeRow[]): MasterDataset {
  resetPatternCounter();
  // Group rows by pattern source
  const bySource = new Map<string, ShapeRow[]>();
  for (const row of rows) {
    const existing = bySource.get(row['Pattern Source']);
    if (existing !== undefined) {
      existing.push(row);
    } else {
      bySource.set(row['Pattern Source'], [row]);
    }
  }

  const patterns = [...bySource.entries()].map(([source, sourceRows]) => {
    const shapes = sourceRows.map((r) =>
      createShape(r['Shape Name'], r.Kind as ShapeKind, r.Group.length > 0 ? r.Group : undefined)
    );
    return createTestPattern({
      filePath: source,
      extractedShapes: shapes,
    });
  });

  return createTestMasterDataset({ patterns });
}

// ============================================================================
// State
// ============================================================================

interface SelectorTestState {
  dataset: MasterDataset | null;
  resultShapes: readonly ExtractedShape[];
}

function initState(): SelectorTestState {
  resetPatternCounter();
  return { dataset: null, resultShapes: [] };
}

let state: SelectorTestState | null = null;

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/shape-selector.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a shape selector test context', () => {
      state = initState();
    });
  });

  Rule('Reference doc configs select shapes via shapeSelectors', ({ RuleScenario }) => {
    // ────────────────────────────────────────────────────────────────
    // Scenario: Select specific shapes by source and names
    // ────────────────────────────────────────────────────────────────

    RuleScenario('Select specific shapes by source and names', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with patterns containing these extracted shapes:',
        (_ctx: unknown, table: readonly ShapeRow[]) => {
          state!.dataset = buildDatasetFromRows(table);
        }
      );

      When(
        'filtering with selector source {string} and names {string}, {string}',
        (_ctx: unknown, source: string, name1: string, name2: string) => {
          const selectors: readonly ShapeSelector[] = [{ source, names: [name1, name2] }];
          state!.resultShapes = filterShapesBySelectors(state!.dataset!, selectors);
        }
      );

      Then(
        '2 shapes are returned including {string} and {string}',
        (_ctx: unknown, name1: string, name2: string) => {
          expect(state!.resultShapes).toHaveLength(2);
          const names = state!.resultShapes.map((s) => s.name);
          expect(names).toContain(name1);
          expect(names).toContain(name2);
        }
      );

      And('shape {string} is not included', (_ctx: unknown, name: string) => {
        expect(state!.resultShapes.some((s) => s.name === name)).toBe(false);
      });
    });

    // ────────────────────────────────────────────────────────────────
    // Scenario: Select all shapes in a group
    // ────────────────────────────────────────────────────────────────

    RuleScenario('Select all shapes in a group', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with patterns containing these extracted shapes:',
        (_ctx: unknown, table: readonly ShapeRow[]) => {
          state!.dataset = buildDatasetFromRows(table);
        }
      );

      When('filtering with selector group {string}', (_ctx: unknown, group: string) => {
        const selectors: readonly ShapeSelector[] = [{ group }];
        state!.resultShapes = filterShapesBySelectors(state!.dataset!, selectors);
      });

      Then(
        '2 shapes are returned including {string} and {string}',
        (_ctx: unknown, name1: string, name2: string) => {
          expect(state!.resultShapes).toHaveLength(2);
          const names = state!.resultShapes.map((s) => s.name);
          expect(names).toContain(name1);
          expect(names).toContain(name2);
        }
      );

      And('shape {string} is not included', (_ctx: unknown, name: string) => {
        expect(state!.resultShapes.some((s) => s.name === name)).toBe(false);
      });
    });

    // ────────────────────────────────────────────────────────────────
    // Scenario: Select all tagged shapes from a source file
    // ────────────────────────────────────────────────────────────────

    RuleScenario('Select all tagged shapes from a source file', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with patterns containing these extracted shapes:',
        (_ctx: unknown, table: readonly ShapeRow[]) => {
          state!.dataset = buildDatasetFromRows(table);
        }
      );

      When('filtering with selector source {string}', (_ctx: unknown, source: string) => {
        const selectors: readonly ShapeSelector[] = [{ source }];
        state!.resultShapes = filterShapesBySelectors(state!.dataset!, selectors);
      });

      Then('3 shapes are returned', () => {
        expect(state!.resultShapes).toHaveLength(3);
      });

      And('shape {string} is not included', (_ctx: unknown, name: string) => {
        expect(state!.resultShapes.some((s) => s.name === name)).toBe(false);
      });
    });

    RuleScenario('Source-only selector returns all matching shapes', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with patterns containing these extracted shapes:',
        (_ctx: unknown, table: readonly ShapeRow[]) => {
          state!.dataset = buildDatasetFromRows(table);
        }
      );

      When('filtering with selector source {string}', (_ctx: unknown, source: string) => {
        const selectors: readonly ShapeSelector[] = [{ source }];
        state!.resultShapes = filterShapesBySelectors(state!.dataset!, selectors);
      });

      Then(
        '2 shapes are returned including {string} and {string}',
        (_ctx: unknown, name1: string, name2: string) => {
          expect(state!.resultShapes).toHaveLength(2);
          const names = state!.resultShapes.map((s) => s.name);
          expect(names).toContain(name1);
          expect(names).toContain(name2);
        }
      );
    });
  });
});
