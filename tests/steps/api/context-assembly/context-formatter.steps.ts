/**
 * Context Formatter Step Definitions
 *
 * Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),
 * and formatOverview() plain text rendering functions.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  formatContextBundle,
  formatDepTree,
  formatFileReadingList,
  formatOverview,
} from '../../../../src/api/context-formatter.js';
import type {
  ContextBundle,
  DepTreeNode,
  FileReadingList,
  OverviewSummary,
} from '../../../../src/api/context-assembler.js';

const feature = await loadFeature('tests/features/api/context-assembly/context-formatter.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  bundle: ContextBundle | null;
  tree: DepTreeNode | null;
  overview: OverviewSummary | null;
  fileList: FileReadingList | null;
  output: string;
}

let state: TestState | null = null;

function initState(): TestState {
  return {
    bundle: null,
    tree: null,
    overview: null,
    fileList: null,
    output: '',
  };
}

// =============================================================================
// Helpers — construct minimal ContextBundle fixtures
// =============================================================================

function createDesignBundle(): ContextBundle {
  return {
    metadata: [
      {
        name: 'OrderSaga',
        status: 'roadmap',
        phase: 22,
        category: 'agent',
        file: 'delivery-process/specs/order-saga.feature',
        summary: 'Orchestrates order lifecycle.',
      },
    ],
    specFiles: ['delivery-process/specs/order-saga.feature'],
    stubs: [
      {
        stubFile: 'delivery-process/stubs/order-saga/saga.ts',
        targetPath: 'src/domain/order-saga.ts',
      },
    ],
    dependencies: [
      {
        name: 'EventStore',
        kind: 'planning',
        status: 'completed',
        file: 'src/domain/event-store.ts',
      },
    ],
    sharedDependencies: [],
    consumers: [],
    architectureNeighbors: [],
    deliverables: [
      { name: 'API design', status: 'pending', location: 'src/api/design.ts' },
      { name: 'Interface stubs', status: 'complete', location: 'src/api/stubs.ts' },
    ],
    fsm: undefined,
    testFiles: [],
  };
}

function createImplementBundle(): ContextBundle {
  return {
    metadata: [
      {
        name: 'ProcessGuard',
        status: 'active',
        phase: 14,
        category: 'validation',
        file: 'delivery-process/specs/process-guard.feature',
        summary: 'Validates delivery workflow.',
      },
    ],
    specFiles: ['delivery-process/specs/process-guard.feature'],
    stubs: [],
    dependencies: [],
    sharedDependencies: [],
    consumers: [],
    architectureNeighbors: [],
    deliverables: [
      { name: 'Core types', status: 'complete', location: 'src/types.ts' },
      { name: 'Validation logic', status: 'pending', location: 'src/validate.ts' },
    ],
    fsm: {
      currentStatus: 'active',
      validTransitions: ['completed', 'roadmap'],
      protectionLevel: 'scope',
    },
    testFiles: [],
  };
}

function createTestTree(): DepTreeNode {
  return {
    name: 'Root',
    status: 'completed',
    phase: 1,
    isFocal: false,
    truncated: false,
    children: [
      {
        name: 'Middle',
        status: 'active',
        phase: 2,
        isFocal: false,
        truncated: false,
        children: [
          {
            name: 'Leaf',
            status: 'roadmap',
            phase: 3,
            isFocal: true,
            truncated: false,
            children: [],
          },
        ],
      },
    ],
  };
}

function createTestOverview(total: number, percentage: number): OverviewSummary {
  const completed = Math.round((total * percentage) / 100);
  const active = Math.min(3, total - completed);
  const planned = total - completed - active;
  return {
    progress: {
      total,
      completed,
      active,
      planned,
      percentage,
    },
    activePhases: active > 0 ? [{ phase: 14, name: 'Validation', activeCount: active }] : [],
    blocking: [],
  };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule 1: formatContextBundle renders section markers
  // ===========================================================================

  Rule('formatContextBundle renders section markers', ({ RuleScenario }) => {
    RuleScenario('Design bundle renders all populated sections', ({ Given, When, Then }) => {
      Given('a design context bundle with metadata, stubs, dependencies, and deliverables', () => {
        state = initState();
        state.bundle = createDesignBundle();
      });

      When('I format the bundle', () => {
        state!.output = formatContextBundle(state!.bundle!);
      });

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        }
      );
    });

    RuleScenario('Implement bundle renders deliverables and FSM', ({ Given, When, Then, And }) => {
      Given('an implement context bundle with deliverables and FSM', () => {
        state = initState();
        state.bundle = createImplementBundle();
      });

      When('I format the bundle', () => {
        state!.output = formatContextBundle(state!.bundle!);
      });

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        }
      );

      And('the output contains checkbox markers', () => {
        expect(state!.output).toMatch(/\[x\]|\[ \]/);
      });
    });
  });

  // ===========================================================================
  // Rule 2: formatDepTree renders indented tree
  // ===========================================================================

  Rule('formatDepTree renders indented tree', ({ RuleScenario }) => {
    RuleScenario('Tree renders with arrows and focal marker', ({ Given, When, Then }) => {
      Given('a dep-tree with root, middle, and focal leaf', () => {
        state = initState();
        state.tree = createTestTree();
      });

      When('I format the tree', () => {
        state!.output = formatDepTree(state!.tree!);
      });

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        }
      );
    });
  });

  // ===========================================================================
  // Rule 3: formatOverview renders progress summary
  // ===========================================================================

  Rule('formatOverview renders progress summary', ({ RuleScenario }) => {
    RuleScenario('Overview renders progress line', ({ Given, When, Then }) => {
      Given(
        'an overview with {int} total patterns at {int} percent',
        (_ctx: unknown, total: number, percent: number) => {
          state = initState();
          state.overview = createTestOverview(total, percent);
        }
      );

      When('I format the overview', () => {
        state!.output = formatOverview(state!.overview!);
      });

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        }
      );
    });
  });

  // ===========================================================================
  // Rule 4: formatFileReadingList renders categorized file paths
  // ===========================================================================

  Rule('formatFileReadingList renders categorized file paths', ({ RuleScenario }) => {
    RuleScenario(
      'File list renders primary and dependency sections',
      ({ Given, When, Then, And }) => {
        Given('a file reading list with primary and dependency files', () => {
          state = initState();
          state.fileList = {
            primary: ['specs/order-saga.feature', 'stubs/order-saga/saga.ts'],
            completedDeps: ['src/domain/event-store.ts'],
            roadmapDeps: ['specs/payment-saga.feature'],
            architectureNeighbors: [],
          };
        });

        When('I format the file reading list', () => {
          state!.output = formatFileReadingList(state!.fileList!);
        });

        Then('the output contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.output).toContain(text);
        });

        And('the output contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.output).toContain(text);
        });
      }
    );

    RuleScenario('Empty file reading list renders minimal output', ({ Given, When, Then }) => {
      Given('an empty file reading list', () => {
        state = initState();
        state.fileList = {
          primary: [],
          completedDeps: [],
          roadmapDeps: [],
          architectureNeighbors: [],
        };
      });

      When('I format the file reading list', () => {
        state!.output = formatFileReadingList(state!.fileList!);
      });

      Then('the output is a single newline', () => {
        expect(state!.output).toBe('\n');
      });
    });
  });
});
