/**
 * Transform Dataset Step Definitions
 *
 * BDD step definitions for testing the transformToMasterDataset function
 * and related utility functions (completionPercentage, isFullyCompleted).
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  transformToMasterDataset,
  completionPercentage,
  isFullyCompleted,
  type RuntimeMasterDataset,
  type RawDataset,
} from '../../../src/generators/pipeline/transform-dataset.js';
import type { StatusCounts } from '../../../src/validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { LoadedWorkflow } from '../../../src/config/workflow-loader.js';
import {
  createTestPattern,
  createDefaultTagRegistry,
  resetPatternCounter,
} from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface TransformDatasetState {
  // Input building
  patterns: ExtractedPattern[];
  workflow: LoadedWorkflow | undefined;

  // Results
  dataset: RuntimeMasterDataset | null;

  // For utility function tests
  statusCounts: StatusCounts | null;
  percentageResult: number | null;
  isCompletedResult: boolean | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TransformDatasetState | null = null;

function initState(): TransformDatasetState {
  resetPatternCounter();
  return {
    patterns: [],
    workflow: undefined,
    dataset: null,
    statusCounts: null,
    percentageResult: null,
    isCompletedResult: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function createRawDataset(): RawDataset {
  return {
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: state!.workflow,
  };
}

function addPattern(options: Partial<Parameters<typeof createTestPattern>[0]> = {}): void {
  state!.patterns.push(createTestPattern(options));
}

// =============================================================================
// Feature: Transform Dataset Pipeline
// =============================================================================

const feature = await loadFeature('tests/features/behavior/transform-dataset.feature');

describeFeature(feature, ({ Scenario, ScenarioOutline, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a transform dataset test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Empty Dataset Edge Case
  // ===========================================================================

  Scenario('Transform empty dataset', ({ Given, When, Then, And }) => {
    Given('an empty raw dataset', () => {
      // state.patterns is already empty
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('the dataset has {int} patterns', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.patterns.length).toBe(count);
    });

    And('all status counts are 0', () => {
      expect(state!.dataset!.counts.completed).toBe(0);
      expect(state!.dataset!.counts.active).toBe(0);
      expect(state!.dataset!.counts.planned).toBe(0);
      expect(state!.dataset!.counts.total).toBe(0);
    });

    And('the phase count is {int}', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.phaseCount).toBe(count);
    });

    And('the category count is {int}', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.categoryCount).toBe(count);
    });
  });

  // ===========================================================================
  // Status Grouping
  // ===========================================================================

  Scenario('Group patterns by status', ({ Given, When, Then, And }) => {
    Given('a raw dataset with status distribution:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      for (const row of dataTable) {
        const count = parseInt(row.count);
        // Status values now match directly (roadmap, active, completed, deferred)
        const status = row.status as 'roadmap' | 'active' | 'completed' | 'deferred';
        for (let i = 0; i < count; i++) {
          addPattern({ status });
        }
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('byStatus.completed has {int} patterns', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.byStatus.completed.length).toBe(count);
    });

    And('byStatus.active has {int} patterns', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.byStatus.active.length).toBe(count);
    });

    And('byStatus.planned has {int} patterns', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.byStatus.planned.length).toBe(count);
    });

    And('counts.total is {int}', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.counts.total).toBe(count);
    });
  });

  Scenario('Normalize status variants to canonical values', ({ Given, When, Then }) => {
    const statusMappings: Array<{ status: string; expected: string }> = [];

    Given('patterns with various status values:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      for (const row of dataTable) {
        const status = row.status ?? '';
        const expected = row.expected ?? '';
        statusMappings.push({ status, expected });
        addPattern({
          name: `Pattern with ${status}`,
          status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
        });
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('each pattern is grouped in the expected status bucket', () => {
      for (const mapping of statusMappings) {
        const bucket =
          state!.dataset!.byStatus[mapping.expected as keyof typeof state.dataset.byStatus];
        const found = bucket.some((p) => p.name.includes(mapping.status));
        expect(
          found,
          `Pattern with status "${mapping.status}" should be in "${mapping.expected}" bucket`
        ).toBe(true);
      }
    });
  });

  // ===========================================================================
  // Phase Grouping
  // ===========================================================================

  Scenario('Group patterns by phase', ({ Given, When, Then }) => {
    Given('patterns in multiple phases:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      for (const row of dataTable) {
        const phase = parseInt(row.phase);
        const count = parseInt(row.count);
        for (let i = 0; i < count; i++) {
          addPattern({ phase });
        }
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'byPhase has {int} phase groups with counts:',
      (_ctx: unknown, count: number, dataTable: DataTableRow[]) => {
        expect(state!.dataset!.byPhase.length).toBe(count);
        for (const row of dataTable) {
          const phase = parseInt(row.phase);
          const expectedCount = parseInt(row.count);
          const phaseGroup = state!.dataset!.byPhase.find((p) => p.phaseNumber === phase);
          expect(phaseGroup, `Phase ${phase} should exist`).toBeDefined();
          expect(phaseGroup!.patterns.length).toBe(expectedCount);
        }
      }
    );
  });

  Scenario('Sort phases by phase number', ({ Given, When, Then }) => {
    Given('patterns in phases 3, 1, 2 (out of order)', () => {
      addPattern({ phase: 3, name: 'Phase 3 Pattern' });
      addPattern({ phase: 1, name: 'Phase 1 Pattern' });
      addPattern({ phase: 2, name: 'Phase 2 Pattern' });
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('byPhase is sorted as [1, 2, 3]', () => {
      const phaseNumbers = state!.dataset!.byPhase.map((p) => p.phaseNumber);
      expect(phaseNumbers).toEqual([1, 2, 3]);
    });
  });

  Scenario('Compute per-phase status counts', ({ Given, When, Then }) => {
    Given('phase 1 with 2 completed and 1 active patterns', () => {
      addPattern({ phase: 1, status: 'completed' });
      addPattern({ phase: 1, status: 'completed' });
      addPattern({ phase: 1, status: 'active' });
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('phase 1 counts are:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      const phase1 = state!.dataset!.byPhase.find((p) => p.phaseNumber === 1);
      expect(phase1).toBeDefined();

      for (const row of dataTable) {
        const field = row.field as keyof StatusCounts;
        const value = parseInt(row.value);
        expect(phase1!.counts[field]).toBe(value);
      }
    });
  });

  Scenario('Patterns without phase are not in byPhase', ({ Given, When, Then, And }) => {
    Given('{int} patterns without phase metadata', (_ctx: unknown, count: number) => {
      for (let i = 0; i < count; i++) {
        addPattern({ name: `No Phase Pattern ${i}` });
      }
    });

    And('{int} patterns in phase {int}', (_ctx: unknown, count: number, phase: number) => {
      for (let i = 0; i < count; i++) {
        addPattern({ phase, name: `Phase ${phase} Pattern ${i}` });
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('byPhase has {int} phase group', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.byPhase.length).toBe(count);
    });

    And('phaseCount is {int}', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.phaseCount).toBe(count);
    });
  });

  // ===========================================================================
  // Quarter Grouping
  // ===========================================================================

  Scenario('Group patterns by quarter', ({ Given, When, Then }) => {
    Given('patterns in multiple quarters:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      for (const row of dataTable) {
        const count = parseInt(row.count);
        for (let i = 0; i < count; i++) {
          addPattern({ quarter: row.quarter });
        }
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'byQuarter has {int} quarters with counts:',
      (_ctx: unknown, count: number, dataTable: DataTableRow[]) => {
        expect(Object.keys(state!.dataset!.byQuarter).length).toBe(count);
        for (const row of dataTable) {
          const quarter = row.quarter ?? '';
          const expectedCount = parseInt(row.count ?? '0');
          const quarterPatterns = state!.dataset!.byQuarter[quarter];
          expect(quarterPatterns?.length).toBe(expectedCount);
        }
      }
    );
  });

  Scenario('Patterns without quarter are not in byQuarter', ({ Given, When, Then, And }) => {
    Given('{int} patterns without quarter', (_ctx: unknown, count: number) => {
      for (let i = 0; i < count; i++) {
        addPattern({ name: `No Quarter Pattern ${i}` });
      }
    });

    And('{int} patterns in quarter {string}', (_ctx: unknown, count: number, quarter: string) => {
      for (let i = 0; i < count; i++) {
        addPattern({ quarter, name: `${quarter} Pattern ${i}` });
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('byQuarter has {int} quarter', (_ctx: unknown, count: number) => {
      expect(Object.keys(state!.dataset!.byQuarter).length).toBe(count);
    });
  });

  // ===========================================================================
  // Category Grouping
  // ===========================================================================

  Scenario('Group patterns by category', ({ Given, When, Then, And }) => {
    Given('patterns in categories:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      for (const row of dataTable) {
        const count = parseInt(row.count);
        for (let i = 0; i < count; i++) {
          addPattern({ category: row.category });
        }
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'byCategory has {int} categories with counts:',
      (_ctx: unknown, count: number, dataTable: DataTableRow[]) => {
        expect(Object.keys(state!.dataset!.byCategory).length).toBe(count);
        for (const row of dataTable) {
          const category = row.category ?? '';
          const expectedCount = parseInt(row.count ?? '0');
          const categoryPatterns = state!.dataset!.byCategory[category];
          expect(categoryPatterns?.length).toBe(expectedCount);
        }
      }
    );

    And('categoryCount is {int}', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.categoryCount).toBe(count);
    });
  });

  // ===========================================================================
  // Source Grouping
  // ===========================================================================

  Scenario('Group patterns by source file type', ({ Given, When, Then, And }) => {
    Given('patterns from different sources:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      for (const row of dataTable) {
        const source = row.source ?? '';
        addPattern({
          filePath: source,
          name: `Pattern from ${source}`,
        });
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('bySource.typescript has {int} patterns', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.bySource.typescript.length).toBe(count);
    });

    And('bySource.gherkin has {int} pattern', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.bySource.gherkin.length).toBe(count);
    });
  });

  Scenario('Patterns with phase are also in roadmap view', ({ Given, When, Then, And }) => {
    Given('{int} patterns with phase metadata', (_ctx: unknown, count: number) => {
      for (let i = 0; i < count; i++) {
        addPattern({ phase: 1, name: `Phase Pattern ${i}` });
      }
    });

    And('{int} patterns without phase', (_ctx: unknown, count: number) => {
      for (let i = 0; i < count; i++) {
        addPattern({ name: `No Phase Pattern ${i}` });
      }
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('bySource.roadmap has {int} patterns', (_ctx: unknown, count: number) => {
      expect(state!.dataset!.bySource.roadmap.length).toBe(count);
    });
  });

  // PRD view test removed - requires extending pattern factories to support productArea/userRole/businessValue
  // See transform-dataset.ts lines 167-169 for the actual implementation

  // ===========================================================================
  // Relationship Index
  // ===========================================================================

  Scenario('Build relationship index from patterns', ({ Given, When, Then, And }) => {
    Given(
      'a pattern {string} that uses {string}',
      (_ctx: unknown, name: string, target: string) => {
        addPattern({ name, patternName: name, uses: [target] });
      }
    );

    And(
      'a pattern {string} that is used by {string}',
      (_ctx: unknown, name: string, user: string) => {
        addPattern({ name, patternName: name, usedBy: [user] });
      }
    );

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'the relationship index for {string} uses contains {string}',
      (_ctx: unknown, name: string, target: string) => {
        expect(state!.dataset!.relationshipIndex[name]?.uses).toContain(target);
      }
    );

    And(
      'the relationship index for {string} usedBy contains {string}',
      (_ctx: unknown, name: string, user: string) => {
        expect(state!.dataset!.relationshipIndex[name]?.usedBy).toContain(user);
      }
    );
  });

  Scenario('Build relationship index with all relationship types', ({ Given, When, Then }) => {
    Given(
      'a pattern {string} with relationships:',
      (_ctx: unknown, name: string, dataTable: DataTableRow[]) => {
        const uses: string[] = [];
        const usedBy: string[] = [];
        const dependsOn: string[] = [];
        const enables: string[] = [];

        for (const row of dataTable) {
          switch (row.type) {
            case 'uses':
              uses.push(row.targets);
              break;
            case 'usedBy':
              usedBy.push(row.targets);
              break;
            case 'dependsOn':
              dependsOn.push(row.targets);
              break;
            case 'enables':
              enables.push(row.targets);
              break;
          }
        }

        addPattern({ name, patternName: name, uses, usedBy, dependsOn, enables });
      }
    );

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'the relationship index for {string} contains:',
      (_ctx: unknown, name: string, dataTable: DataTableRow[]) => {
        const rel = state!.dataset!.relationshipIndex[name];
        expect(rel).toBeDefined();

        for (const row of dataTable) {
          const field = row.field as keyof typeof rel;
          expect(rel[field]).toContain(row.value);
        }
      }
    );
  });

  // ===========================================================================
  // Reverse Lookup: enables from dependsOn
  // ===========================================================================

  Scenario('Reverse lookup computes enables from dependsOn', ({ Given, And, When, Then }) => {
    Given('a pattern {string} with no relationships', (_ctx: unknown, name: string) => {
      addPattern({ name, patternName: name });
    });

    And(
      'a pattern {string} that depends on {string}',
      (_ctx: unknown, name: string, dep: string) => {
        addPattern({ name, patternName: name, dependsOn: [dep] });
      }
    );

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'the relationship index for {string} enables contains {string}',
      (_ctx: unknown, name: string, enabled: string) => {
        expect(state!.dataset!.relationshipIndex[name]?.enables).toContain(enabled);
      }
    );
  });

  // ===========================================================================
  // Reverse Lookup: usedBy from uses
  // ===========================================================================

  Scenario('Reverse lookup computes usedBy from uses', ({ Given, And, When, Then }) => {
    Given('a pattern {string} with no relationships', (_ctx: unknown, name: string) => {
      addPattern({ name, patternName: name });
    });

    And('a pattern {string} that uses {string}', (_ctx: unknown, name: string, target: string) => {
      addPattern({ name, patternName: name, uses: [target] });
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'the relationship index for {string} usedBy contains {string}',
      (_ctx: unknown, name: string, user: string) => {
        expect(state!.dataset!.relationshipIndex[name]?.usedBy).toContain(user);
      }
    );
  });

  // ===========================================================================
  // Reverse Lookup: merges with explicit annotations without duplicates
  // ===========================================================================

  Scenario(
    'Reverse lookup merges with explicit annotations without duplicates',
    ({ Given, And, When, Then }) => {
      Given(
        'a pattern {string} that enables {string} explicitly',
        (_ctx: unknown, name: string, target: string) => {
          addPattern({ name, patternName: name, enables: [target] });
        }
      );

      And(
        'a pattern {string} that depends on {string}',
        (_ctx: unknown, name: string, dep: string) => {
          addPattern({ name, patternName: name, dependsOn: [dep] });
        }
      );

      When('transforming to MasterDataset', () => {
        state!.dataset = transformToMasterDataset(createRawDataset());
      });

      Then(
        'the relationship index for {string} enables contains {string}',
        (_ctx: unknown, name: string, enabled: string) => {
          expect(state!.dataset!.relationshipIndex[name]?.enables).toContain(enabled);
        }
      );

      And(
        'the relationship index for {string} enables has exactly {int} entry',
        (_ctx: unknown, name: string, count: number) => {
          expect(state!.dataset!.relationshipIndex[name]?.enables).toHaveLength(count);
        }
      );
    }
  );

  // ===========================================================================
  // Completion Percentage Function
  // ===========================================================================

  ScenarioOutline(
    'Calculate completion percentage',
    (
      { Given, When, Then },
      variables: { completed: string; total: string; percentage: string }
    ) => {
      Given('status counts with completed {string} of total {string}', () => {
        const completed = parseInt(variables.completed);
        const total = parseInt(variables.total);
        state!.statusCounts = {
          completed,
          active: 0,
          planned: total - completed,
          total,
        };
      });

      When('calculating completion percentage', () => {
        state!.percentageResult = completionPercentage(state!.statusCounts!);
      });

      Then('the result is {string} percent', () => {
        expect(state!.percentageResult).toBe(parseInt(variables.percentage));
      });
    }
  );

  // ===========================================================================
  // Is Fully Completed Function
  // ===========================================================================

  ScenarioOutline(
    'Check if fully completed',
    (
      { Given, When, Then },
      variables: {
        completed: string;
        active: string;
        planned: string;
        total: string;
        expected: string;
      }
    ) => {
      Given(
        'status counts {string} completed {string} active {string} planned of {string} total',
        () => {
          state!.statusCounts = {
            completed: parseInt(variables.completed),
            active: parseInt(variables.active),
            planned: parseInt(variables.planned),
            total: parseInt(variables.total),
          };
        }
      );

      When('checking if fully completed', () => {
        state!.isCompletedResult = isFullyCompleted(state!.statusCounts!);
      });

      Then('the result is {string}', () => {
        const expected = variables.expected === 'true';
        expect(state!.isCompletedResult).toBe(expected);
      });
    }
  );

  // ===========================================================================
  // Workflow Integration
  // ===========================================================================

  Scenario('Include workflow in result when provided', ({ Given, When, Then, And }) => {
    Given('a workflow with phases:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      const phases = dataTable.map((row) => ({
        order: parseInt(row.order ?? '0'),
        name: row.name ?? '',
        description: `${row.name ?? ''} phase`,
      }));

      state!.workflow = {
        config: {
          name: 'Test Workflow',
          version: '1.0',
          phases,
        },
        // Simplified LoadedWorkflow with just what we need
        phaseLookup: new Map(phases.map((p) => [p.order, p])),
      } as LoadedWorkflow;
    });

    And('patterns in phases 1 and 2', () => {
      addPattern({ phase: 1, name: 'Phase 1 Pattern' });
      addPattern({ phase: 2, name: 'Phase 2 Pattern' });
    });

    When('transforming with the workflow', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then(
      'the result includes the workflow with phase names:',
      (_ctx: unknown, dataTable: DataTableRow[]) => {
        expect(state!.dataset!.workflow).toBeDefined();
        for (const row of dataTable) {
          const phaseNum = parseInt(row.phase);
          const expectedName = row.name;
          const phase = state!.dataset!.byPhase.find((p) => p.phaseNumber === phaseNum);
          expect(phase?.phaseName).toBe(expectedName);
        }
      }
    );
  });

  Scenario('Result omits workflow when not provided', ({ Given, When, Then }) => {
    Given('patterns without a workflow', () => {
      addPattern({ name: 'Pattern 1' });
      addPattern({ name: 'Pattern 2' });
    });

    When('transforming to MasterDataset', () => {
      state!.dataset = transformToMasterDataset(createRawDataset());
    });

    Then('the result does not include workflow', () => {
      expect(state!.dataset!.workflow).toBeUndefined();
    });
  });
});
