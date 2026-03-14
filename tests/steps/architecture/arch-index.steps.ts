/**
 * Architecture Index Step Definitions
 *
 * BDD step definitions for testing the archIndex built during
 * transformToMasterDataset. The archIndex groups patterns by role,
 * context, and layer for efficient architecture diagram generation.
 *
 * @libar-docs
 */

import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';

import type { RuntimeMasterDataset } from '../../../src/generators/pipeline/transform-types.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createDefaultTagRegistry, createTestPattern } from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface ArchIndexState {
  patterns: ExtractedPattern[];
  dataset: RuntimeMasterDataset | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ArchIndexState | null = null;
let patternCounter = 0;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ArchIndexState {
  patternCounter = 0;
  return {
    patterns: [],
    dataset: null,
  };
}

/**
 * Generate a valid pattern ID matching /^pattern-[a-f0-9]{8}$/
 */
function generatePatternId(): string {
  patternCounter++;
  return `pattern-${patternCounter.toString(16).padStart(8, '0')}`;
}

/**
 * Create a pattern with arch fields directly
 * This bypasses the factory to add arch-specific fields that aren't in TestPatternOptions yet
 */
function createPatternWithArch(options: {
  name: string;
  archRole?: string;
  archContext?: string;
  archLayer?: string;
}): ExtractedPattern {
  // Use the base factory then add arch fields
  const basePattern = createTestPattern({
    id: generatePatternId(),
    name: options.name,
    status: 'completed',
  });

  // Add arch fields directly (they're valid per ExtractedPatternSchema)
  return {
    ...basePattern,
    ...(options.archRole && { archRole: options.archRole }),
    ...(options.archContext && { archContext: options.archContext }),
    ...(options.archLayer && { archLayer: options.archLayer }),
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature(
  'tests/features/behavior/architecture-diagrams/arch-index.feature'
);

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a tag registry is loaded', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: archIndex groups patterns by arch-role
  // ---------------------------------------------------------------------------

  Rule('archIndex groups patterns by arch-role', ({ RuleScenario }) => {
    RuleScenario('Group patterns by role', ({ Given, When, Then, And }) => {
      Given('patterns with arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('transformToMasterDataset runs', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
        });
      });

      Then(
        'archIndex byRole for {string} should contain {int} patterns',
        (_ctx: unknown, role: string, count: number) => {
          const patterns = state?.dataset?.archIndex.byRole[role] ?? [];
          expect(patterns.length).toBe(count);
        }
      );

      And(
        'archIndex byRole for {string} should contain {int} pattern',
        (_ctx: unknown, role: string, count: number) => {
          const patterns = state?.dataset?.archIndex.byRole[role] ?? [];
          expect(patterns.length).toBe(count);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: archIndex groups patterns by arch-context
  // ---------------------------------------------------------------------------

  Rule('archIndex groups patterns by arch-context', ({ RuleScenario }) => {
    RuleScenario('Group patterns by context', ({ Given, When, Then, And }) => {
      Given('patterns with arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('transformToMasterDataset runs', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
        });
      });

      Then(
        'archIndex byContext for {string} should contain {int} patterns',
        (_ctx: unknown, context: string, count: number) => {
          const patterns = state?.dataset?.archIndex.byContext[context] ?? [];
          expect(patterns.length).toBe(count);
        }
      );

      And(
        'archIndex byContext for {string} should contain {int} pattern',
        (_ctx: unknown, context: string, count: number) => {
          const patterns = state?.dataset?.archIndex.byContext[context] ?? [];
          expect(patterns.length).toBe(count);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: archIndex groups patterns by arch-layer
  // ---------------------------------------------------------------------------

  Rule('archIndex groups patterns by arch-layer', ({ RuleScenario }) => {
    RuleScenario('Group patterns by layer', ({ Given, When, Then }) => {
      Given('patterns with arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      When('transformToMasterDataset runs', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
        });
      });

      Then('archIndex byLayer should have counts:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state?.dataset?.archIndex) throw new Error('Dataset archIndex not initialized');
        const byLayer = state.dataset.archIndex.byLayer;
        for (const row of dataTable) {
          // Non-null assertion is safe: BDD table guarantees 'layer' column exists
          const layer = row.layer!;
          const patterns = byLayer[layer] ?? [];
          expect(patterns).toHaveLength(parseInt(row.count, 10));
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: archIndex.all contains all patterns with any arch tag
  // ---------------------------------------------------------------------------

  Rule('archIndex.all contains all patterns with any arch tag', ({ RuleScenario }) => {
    RuleScenario('archIndex.all includes all annotated patterns', ({ Given, When, Then, And }) => {
      Given('patterns with arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      And('a pattern without arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          // Create a pattern with no arch fields
          state!.patterns.push(
            createTestPattern({
              id: generatePatternId(),
              name: row.name,
              status: 'completed',
            })
          );
        }
      });

      When('transformToMasterDataset runs', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
        });
      });

      Then('archIndex all should contain {int} patterns', (_ctx: unknown, count: number) => {
        expect(state?.dataset?.archIndex.all.length).toBe(count);
      });

      And('archIndex all should not contain pattern {string}', (_ctx: unknown, name: string) => {
        const patternNames = state?.dataset?.archIndex.all.map((p) => p.name) ?? [];
        expect(patternNames).not.toContain(name);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Patterns without arch tags are excluded from archIndex
  // ---------------------------------------------------------------------------

  Rule('Patterns without arch tags are excluded from archIndex', ({ RuleScenario }) => {
    RuleScenario('Non-annotated patterns excluded', ({ Given, When, Then, And }) => {
      Given('patterns with arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        if (!state) state = initState();
        for (const row of dataTable) {
          state.patterns.push(
            createPatternWithArch({
              name: row.name,
              archRole: row.archRole !== '-' ? row.archRole : undefined,
              archContext: row.archContext !== '-' ? row.archContext : undefined,
              archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
            })
          );
        }
      });

      And('a pattern without arch annotations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.patterns.push(
            createTestPattern({
              id: generatePatternId(),
              name: row.name,
              status: 'completed',
            })
          );
        }
      });

      When('transformToMasterDataset runs', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
        });
      });

      Then('archIndex all should contain {int} pattern', (_ctx: unknown, count: number) => {
        expect(state?.dataset?.archIndex.all.length).toBe(count);
      });

      And('archIndex all should contain pattern {string}', (_ctx: unknown, name: string) => {
        const patternNames = state?.dataset?.archIndex.all.map((p) => p.name) ?? [];
        expect(patternNames).toContain(name);
      });
    });
  });
});
