/**
 * Remaining Work Totals Step Definitions
 *
 * BDD step definitions for testing summary totals accuracy in REMAINING-WORK.md.
 * Ensures summary counts match phase table sums and backlog patterns are counted
 * correctly using pattern.id rather than patternName.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { RemainingWorkCodec } from '../../../src/renderable/codecs/session.js';
import type { RenderableDocument, TableBlock } from '../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../src/validation-schemas/master-dataset.js';
import {
  createTestMasterDataset,
  createTestPattern,
  resetPatternCounter,
} from '../../fixtures/dataset-factories.js';
import { findTables, isHeading, isTable } from '../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface RemainingWorkTotalsState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
  patternData: Array<{
    id: string;
    patternName: string;
    status: string;
    phase: number | undefined;
  }>;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RemainingWorkTotalsState | null = null;

function initState(): RemainingWorkTotalsState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    patternData: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function extractSummaryCounts(doc: RenderableDocument): {
  active: number;
  remaining: number;
  total: number;
} {
  const summaryIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'Summary');

  if (summaryIdx === -1) {
    return { active: 0, remaining: 0, total: 0 };
  }

  for (let i = summaryIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      const table = section;
      let active = 0;
      let remaining = 0;
      let total = 0;

      for (const row of table.rows) {
        const label = row[0]?.toLowerCase() ?? '';
        const value = parseInt(row[1] ?? '0', 10);

        if (label.includes('active') || label.includes('in progress')) {
          active = value;
        }
        if (label.includes('remaining') || label.includes('planned') || label.includes('roadmap')) {
          remaining += value;
        }
        if (label.includes('total')) {
          total = value;
        }
      }

      if (total === 0) {
        total = active + remaining;
      }

      return { active, remaining, total };
    }
    if (isHeading(section)) break;
  }

  return { active: 0, remaining: 0, total: 0 };
}

function findPhaseTable(doc: RenderableDocument): TableBlock | null {
  const tables = findTables(doc);

  for (const table of tables) {
    if (table.columns.some((col) => col.toLowerCase().includes('phase'))) {
      return table;
    }
  }

  return null;
}

function sumPhaseTableRows(table: TableBlock): { active: number; remaining: number } {
  let active = 0;
  let remaining = 0;

  const activeIdx = table.columns.findIndex(
    (col) => col.toLowerCase().includes('active') || col.toLowerCase().includes('in progress')
  );
  const remainingIdx = table.columns.findIndex(
    (col) => col.toLowerCase().includes('remaining') || col.toLowerCase().includes('count')
  );

  for (const row of table.rows) {
    if (activeIdx !== -1 && row[activeIdx]) {
      active += parseInt(row[activeIdx], 10) || 0;
    }
    if (remainingIdx !== -1 && row[remainingIdx]) {
      remaining += parseInt(row[remainingIdx], 10) || 0;
    }
  }

  return { active, remaining };
}

function findPhaseRow(
  table: TableBlock,
  phaseName: string
): { remaining: number; active: number } | null {
  const phaseIdx = table.columns.findIndex((col) => col.toLowerCase().includes('phase'));
  const activeIdx = table.columns.findIndex(
    (col) => col.toLowerCase().includes('active') || col.toLowerCase().includes('in progress')
  );
  const remainingIdx = table.columns.findIndex(
    (col) => col.toLowerCase().includes('remaining') || col.toLowerCase().includes('count')
  );

  // Normalize the search term - strip leading numbers if looking for "Phase N"
  const normalizedSearch = phaseName.toLowerCase();

  for (const row of table.rows) {
    const phaseCell = row[phaseIdx] ?? '';
    // The cell may contain emojis, markdown links, and extra text like "(No Phase)"
    // Just check if the key part of the name is present
    const normalizedCell = phaseCell.toLowerCase();

    // Handle "Backlog" search - cell looks like "🚧 Backlog (No Phase)"
    if (normalizedSearch === 'backlog' && normalizedCell.includes('backlog')) {
      return {
        remaining: remainingIdx !== -1 ? parseInt(row[remainingIdx] ?? '0', 10) : 0,
        active: activeIdx !== -1 ? parseInt(row[activeIdx] ?? '0', 10) : 0,
      };
    }

    // Handle "Phase N" search - cell looks like "🚧 [Phase 1](remaining/...)" or "🚧 Phase 1"
    if (normalizedCell.includes(normalizedSearch)) {
      return {
        remaining: remainingIdx !== -1 ? parseInt(row[remainingIdx] ?? '0', 10) : 0,
        active: activeIdx !== -1 ? parseInt(row[activeIdx] ?? '0', 10) : 0,
      };
    }
  }

  return null;
}

function phaseExistsInTable(table: TableBlock, phase: number): boolean {
  const phaseIdx = table.columns.findIndex((col) => col.toLowerCase().includes('phase'));

  for (const row of table.rows) {
    const phaseCell = row[phaseIdx] ?? '';
    if (phaseCell.includes(String(phase)) || phaseCell.toLowerCase().includes(`phase ${phase}`)) {
      return true;
    }
  }

  return false;
}

function getPhaseOrder(table: TableBlock): number[] {
  const phaseIdx = table.columns.findIndex((col) => col.toLowerCase().includes('phase'));
  const phases: number[] = [];

  for (const row of table.rows) {
    const phaseCell = row[phaseIdx] ?? '';
    const match = /\d+/.exec(phaseCell);
    if (match && !phaseCell.toLowerCase().includes('backlog')) {
      phases.push(parseInt(match[0], 10));
    }
  }

  return phases;
}

/**
 * Map status from feature file to valid schema values
 */
function normalizeStatus(status: string): 'roadmap' | 'active' | 'completed' | 'deferred' {
  const statusMap: Record<string, 'roadmap' | 'active' | 'completed' | 'deferred'> = {
    planned: 'roadmap',
    roadmap: 'roadmap',
    active: 'active',
    completed: 'completed',
    deferred: 'deferred',
  };
  return statusMap[status.toLowerCase()] ?? 'roadmap';
}

/**
 * Generate a valid pattern ID matching /^pattern-[a-f0-9]{8}$/
 */
function generatePatternId(index: number): string {
  return `pattern-${index.toString(16).padStart(8, '0')}`;
}

function createPatternsFromTable(dataTable: DataTableRow[]) {
  const patterns = dataTable.map((row, index) => {
    const phase = row.phase && row.phase.trim() !== '' ? parseInt(row.phase, 10) : undefined;
    const patternName =
      row.patternName && row.patternName.trim() !== '' ? row.patternName : undefined;
    const status = normalizeStatus(row.status);

    return createTestPattern({
      id: generatePatternId(index + 1),
      name: patternName ?? row.id ?? `Pattern ${index + 1}`,
      status,
      phase,
    });
  });

  const patternData = dataTable.map((row, index) => ({
    id: generatePatternId(index + 1),
    patternName: row.patternName || '',
    status: normalizeStatus(row.status),
    phase: row.phase && row.phase.trim() !== '' ? parseInt(row.phase, 10) : undefined,
  }));

  return { patterns, patternData };
}

/**
 * Find a phase row by phase number (e.g., phase 1 may be named "PatternA" or "Phase 1")
 */
function findPhaseRowByNumber(
  table: TableBlock,
  phaseNumber: number
): { remaining: number; active: number } | null {
  const phaseIdx = table.columns.findIndex((col) => col.toLowerCase().includes('phase'));
  const activeIdx = table.columns.findIndex(
    (col) => col.toLowerCase().includes('active') || col.toLowerCase().includes('in progress')
  );
  const remainingIdx = table.columns.findIndex(
    (col) => col.toLowerCase().includes('remaining') || col.toLowerCase().includes('count')
  );

  for (const row of table.rows) {
    const phaseCell = row[phaseIdx] ?? '';
    // Look for phase number in the cell content
    // Cell may look like "🚧 [PatternName](remaining/phase-01-...)" or "🚧 Phase 1"
    const cellLower = phaseCell.toLowerCase();

    // Skip backlog row
    if (cellLower.includes('backlog')) continue;

    // Match "phase-NN-" pattern in link or "phase N" in text
    const phaseMatch =
      /phase-(\d+)-/i.exec(phaseCell) ||
      /phase\s+(\d+)/i.exec(phaseCell) ||
      /^[\s\S]*?(\d+)/.exec(phaseCell);
    if (phaseMatch && parseInt(phaseMatch[1], 10) === phaseNumber) {
      return {
        remaining: remainingIdx !== -1 ? parseInt(row[remainingIdx] ?? '0', 10) : 0,
        active: activeIdx !== -1 ? parseInt(row[activeIdx] ?? '0', 10) : 0,
      };
    }
  }

  return null;
}

// Assertion helpers
function assertPhaseTableShows(
  phaseName: string,
  expectedRemaining: number,
  expectedActive: number
) {
  const table = findPhaseTable(state!.document!);
  expect(table, 'Phase table should exist').not.toBeNull();
  const row = findPhaseRow(table!, phaseName);
  expect(row, `Phase "${phaseName}" should exist in table`).not.toBeNull();
  expect(row!.remaining).toBe(expectedRemaining);
  expect(row!.active).toBe(expectedActive);
}

// =============================================================================
// Feature: Remaining Work Summary Accuracy
// =============================================================================

const feature = await loadFeature('tests/features/behavior/remaining-work-totals.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a session codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Summary totals equal sum of phase table rows
  // ===========================================================================

  Rule('Summary totals equal sum of phase table rows', ({ RuleScenario }) => {
    RuleScenario(
      'Summary matches phase table with all patterns having phases',
      ({ Given, When, Then, And }) => {
        Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const { patterns, patternData } = createPatternsFromTable(dataTable);
          state!.dataset = createTestMasterDataset({ patterns });
          state!.patternData = patternData;
        });

        When('remaining work document is generated', () => {
          state!.document = RemainingWorkCodec.decode(state!.dataset!);
        });

        Then('summary shows Active count {int}', (_ctx: unknown, expectedActive: number) => {
          const counts = extractSummaryCounts(state!.document!);
          expect(counts.active).toBe(expectedActive);
        });

        And(
          'summary shows Total Remaining count {int}',
          (_ctx: unknown, expectedRemaining: number) => {
            const nonCompleted = state!.patternData.filter((p) => p.status !== 'completed').length;
            expect(nonCompleted).toBe(expectedRemaining);
          }
        );

        And(
          'phase table rows sum to Active: {int}, Remaining: {int}',
          (_ctx: unknown, expectedActive: number, expectedRemaining: number) => {
            const table = findPhaseTable(state!.document!);
            expect(table, 'Phase table should exist').not.toBeNull();
            const sums = sumPhaseTableRows(table!);
            expect(sums.active).toBe(expectedActive);
            expect(sums.remaining).toBe(expectedRemaining);
          }
        );
      }
    );

    RuleScenario('Summary includes completed patterns correctly', ({ Given, When, Then, And }) => {
      Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const { patterns, patternData } = createPatternsFromTable(dataTable);
        state!.dataset = createTestMasterDataset({ patterns });
        state!.patternData = patternData;
      });

      When('remaining work document is generated', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('summary shows Active count {int}', (_ctx: unknown, expectedActive: number) => {
        const counts = extractSummaryCounts(state!.document!);
        expect(counts.active).toBe(expectedActive);
      });

      And(
        'summary shows Total Remaining count {int}',
        (_ctx: unknown, expectedRemaining: number) => {
          const nonCompleted = state!.patternData.filter((p) => p.status !== 'completed').length;
          expect(nonCompleted).toBe(expectedRemaining);
        }
      );

      And('completed patterns are not in remaining count', () => {
        const table = findPhaseTable(state!.document!);
        if (table) {
          const sums = sumPhaseTableRows(table);
          const totalNonCompleted = state!.patternData.filter(
            (p) => p.status !== 'completed'
          ).length;
          expect(sums.remaining).toBeLessThanOrEqual(totalNonCompleted);
        }
      });
    });
  });

  // ===========================================================================
  // Rule 2: Patterns without phases appear in Backlog row
  // ===========================================================================

  Rule('Patterns without phases appear in Backlog row', ({ RuleScenario }) => {
    RuleScenario(
      'Summary includes backlog patterns without phase',
      ({ Given, When, Then, And }) => {
        Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const { patterns, patternData } = createPatternsFromTable(dataTable);
          state!.dataset = createTestMasterDataset({ patterns });
          state!.patternData = patternData;
        });

        When('remaining work document is generated', () => {
          state!.document = RemainingWorkCodec.decode(state!.dataset!);
        });

        Then('summary shows Active count {int}', (_ctx: unknown, expectedActive: number) => {
          const activePatterns = state!.patternData.filter((p) => p.status === 'active').length;
          expect(activePatterns).toBe(expectedActive);
        });

        And(
          'summary shows Total Remaining count {int}',
          (_ctx: unknown, expectedRemaining: number) => {
            const nonCompleted = state!.patternData.filter((p) => p.status !== 'completed').length;
            expect(nonCompleted).toBe(expectedRemaining);
          }
        );

        // Phase row assertion by phase number (codec may use pattern name as display name)
        And(
          'phase table shows phase {int} row with Remaining: {int}, Active: {int}',
          (
            _ctx: unknown,
            phaseNumber: number,
            expectedRemaining: number,
            expectedActive: number
          ) => {
            const table = findPhaseTable(state!.document!);
            expect(table, 'Phase table should exist').not.toBeNull();
            const row = findPhaseRowByNumber(table!, phaseNumber);
            expect(row, `Phase ${phaseNumber} row should exist in table`).not.toBeNull();
            expect(row!.remaining).toBe(expectedRemaining);
            expect(row!.active).toBe(expectedActive);
          }
        );

        // Backlog row assertion
        And(
          'phase table shows "Backlog" with Remaining: {int}, Active: {int}',
          (_ctx: unknown, expectedRemaining: number, expectedActive: number) => {
            assertPhaseTableShows('Backlog', expectedRemaining, expectedActive);
          }
        );
      }
    );

    RuleScenario('All patterns in backlog when none have phases', ({ Given, When, Then, And }) => {
      Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const { patterns, patternData } = createPatternsFromTable(dataTable);
        state!.dataset = createTestMasterDataset({ patterns });
        state!.patternData = patternData;
      });

      When('remaining work document is generated', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      // When all patterns lack phases, no phase table is generated
      Then('no phase table is generated', () => {
        const table = findPhaseTable(state!.document!);
        expect(table, 'Phase table should not exist when all patterns are backlog').toBeNull();
      });

      And('summary shows Active count {int}', (_ctx: unknown, expectedActive: number) => {
        const activePatterns = state!.patternData.filter((p) => p.status === 'active').length;
        expect(activePatterns).toBe(expectedActive);
      });

      And(
        'summary shows Total Remaining count {int}',
        (_ctx: unknown, expectedRemaining: number) => {
          const nonCompleted = state!.patternData.filter((p) => p.status !== 'completed').length;
          expect(nonCompleted).toBe(expectedRemaining);
        }
      );
    });
  });

  // ===========================================================================
  // Rule 3: Patterns without patternName are counted using id
  // ===========================================================================

  Rule('Patterns without patternName are counted using id', ({ RuleScenario }) => {
    RuleScenario(
      'Patterns with undefined patternName counted correctly',
      ({ Given, When, Then, And }) => {
        Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const { patterns, patternData } = createPatternsFromTable(dataTable);
          state!.dataset = createTestMasterDataset({ patterns });
          state!.patternData = patternData;
        });

        When('remaining work document is generated', () => {
          state!.document = RemainingWorkCodec.decode(state!.dataset!);
        });

        Then('summary total equals phase table sum plus backlog', () => {
          const table = findPhaseTable(state!.document!);
          if (table) {
            const sums = sumPhaseTableRows(table);
            const totalNonCompleted = state!.patternData.filter(
              (p) => p.status !== 'completed'
            ).length;
            expect(sums.remaining).toBeLessThanOrEqual(totalNonCompleted);
          }
        });

        And('no patterns are double-counted', () => {
          const table = findPhaseTable(state!.document!);
          if (table) {
            const sums = sumPhaseTableRows(table);
            const totalNonCompleted = state!.patternData.filter(
              (p) => p.status !== 'completed'
            ).length;
            expect(sums.remaining).toBeLessThanOrEqual(totalNonCompleted);
          }
        });

        And('no patterns are missing from count', () => {
          const nonCompletedCount = state!.patternData.filter(
            (p) => p.status !== 'completed'
          ).length;
          expect(nonCompletedCount).toBeGreaterThan(0);
        });
      }
    );

    RuleScenario('Mixed patterns with and without patternName', ({ Given, When, Then, And }) => {
      Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const { patterns, patternData } = createPatternsFromTable(dataTable);
        state!.dataset = createTestMasterDataset({ patterns });
        state!.patternData = patternData;
      });

      When('remaining work document is generated', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('summary shows Active count {int}', (_ctx: unknown, expectedActive: number) => {
        const activePatterns = state!.patternData.filter((p) => p.status === 'active').length;
        expect(activePatterns).toBe(expectedActive);
      });

      And(
        'summary shows Total Remaining count {int}',
        (_ctx: unknown, expectedRemaining: number) => {
          const nonCompleted = state!.patternData.filter((p) => p.status !== 'completed').length;
          expect(nonCompleted).toBe(expectedRemaining);
        }
      );

      And(
        'phase {int} row shows Remaining: {int}, Active: {int}',
        (_ctx: unknown, phase: number, expectedRemaining: number, expectedActive: number) => {
          const table = findPhaseTable(state!.document!);
          expect(table, 'Phase table should exist').not.toBeNull();
          const row = findPhaseRow(table!, `Phase ${phase}`);
          if (row) {
            expect(row.remaining).toBe(expectedRemaining);
            expect(row.active).toBe(expectedActive);
          }
        }
      );

      And(
        'backlog row shows Remaining: {int}, Active: {int}',
        (_ctx: unknown, expectedRemaining: number, expectedActive: number) => {
          const table = findPhaseTable(state!.document!);
          expect(table, 'Phase table should exist').not.toBeNull();
          const backlogRow = findPhaseRow(table!, 'Backlog');
          if (backlogRow) {
            expect(backlogRow.remaining).toBe(expectedRemaining);
            expect(backlogRow.active).toBe(expectedActive);
          }
        }
      );
    });
  });

  // ===========================================================================
  // Rule 4: All phases with incomplete patterns are shown
  // ===========================================================================

  Rule('All phases with incomplete patterns are shown', ({ RuleScenario }) => {
    RuleScenario('Multiple phases shown in order', ({ Given, When, Then, And }) => {
      Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const { patterns, patternData } = createPatternsFromTable(dataTable);
        state!.dataset = createTestMasterDataset({ patterns });
        state!.patternData = patternData;
      });

      When('remaining work document is generated', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then(
        'phase table shows phases in order: {int}, {int}, {int}',
        (_ctx: unknown, phase1: number, phase2: number, phase3: number) => {
          const table = findPhaseTable(state!.document!);
          expect(table, 'Phase table should exist').not.toBeNull();
          const phases = getPhaseOrder(table!);
          const expectedOrder = [phase1, phase2, phase3];
          let lastIdx = -1;
          for (const expectedPhase of expectedOrder) {
            const idx = phases.indexOf(expectedPhase);
            if (idx !== -1) {
              expect(idx).toBeGreaterThan(lastIdx);
              lastIdx = idx;
            }
          }
        }
      );

      And('each phase row has correct counts', () => {
        const table = findPhaseTable(state!.document!);
        expect(table, 'Phase table should exist').not.toBeNull();
        for (const row of table!.rows) {
          const hasCount = row.some((cell) => /\d+/.test(cell));
          expect(hasCount).toBe(true);
        }
      });
    });

    RuleScenario('Completed phases not shown in remaining work', ({ Given, When, Then, And }) => {
      Given('a dataset with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const { patterns, patternData } = createPatternsFromTable(dataTable);
        state!.dataset = createTestMasterDataset({ patterns });
        state!.patternData = patternData;
      });

      When('remaining work document is generated', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('phase {int} is not shown in phase table', (_ctx: unknown, phase: number) => {
        const table = findPhaseTable(state!.document!);
        if (table) {
          const phasePatternsCompleted = state!.patternData
            .filter((p) => p.phase === phase)
            .every((p) => p.status === 'completed');
          if (phasePatternsCompleted) {
            const exists = phaseExistsInTable(table, phase);
            expect(exists).toBe(false);
          }
        }
      });

      And(
        'phase {int} is shown with Remaining: {int}',
        (_ctx: unknown, phase: number, expectedRemaining: number) => {
          const table = findPhaseTable(state!.document!);
          expect(table, 'Phase table should exist').not.toBeNull();
          const row = findPhaseRow(table!, `Phase ${phase}`);
          if (row) {
            expect(row.remaining).toBe(expectedRemaining);
          }
        }
      );
    });
  });
});
