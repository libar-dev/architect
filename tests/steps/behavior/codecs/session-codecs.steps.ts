/**
 * Session Codecs Step Definitions
 *
 * BDD step definitions for testing the session codecs:
 * - SessionContextCodec
 * - RemainingWorkCodec
 *
 * Tests document structure, sections, options, and detail file generation.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createSessionContextCodec,
  SessionContextCodec,
  createRemainingWorkCodec,
  RemainingWorkCodec,
} from '../../../../src/renderable/codecs/session.js';
import type {
  RenderableDocument,
  TableBlock,
  CollapsibleBlock,
} from '../../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import {
  createTestMasterDataset,
  createMasterDatasetWithStatus,
  createMasterDatasetWithTimeline,
  createTestPattern,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findTableWithHeader,
  findCollapsibles,
  isHeading,
  isTable,
  isParagraph,
  isList,
} from '../../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface SessionCodecState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: SessionCodecState | null = null;

function initState(): SessionCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function findSessionStatusSection(doc: RenderableDocument): {
  paragraph: string;
  table: TableBlock | null;
} {
  const statusIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'Session Status');

  if (statusIdx === -1) {
    return { paragraph: '', table: null };
  }

  // Find the paragraph after Session Status heading
  let paragraphText = '';
  for (let i = statusIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      paragraphText += section.text + ' ';
    }
    if (isHeading(section)) break;
  }

  // Find the table after Session Status heading
  let table: TableBlock | null = null;
  for (let i = statusIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      table = section;
      break;
    }
    if (isHeading(section)) break;
  }

  return { paragraph: paragraphText.trim(), table };
}

function findSummaryTable(doc: RenderableDocument): TableBlock | null {
  const summaryIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'Summary');

  if (summaryIdx === -1) {
    return null;
  }

  for (let i = summaryIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      return section;
    }
    if (isHeading(section)) break;
  }

  return null;
}

function findByPriorityTable(doc: RenderableDocument): TableBlock | null {
  const priorityIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'By Priority');

  if (priorityIdx === -1) {
    return null;
  }

  for (let i = priorityIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      return section;
    }
    if (isHeading(section)) break;
  }

  return null;
}

function findBlockedItemsTable(doc: RenderableDocument): TableBlock | null {
  const blockedIdx = doc.sections.findIndex(
    (s) => isHeading(s) && s.text.includes('Blocked Items')
  );

  if (blockedIdx === -1) {
    return null;
  }

  for (let i = blockedIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      return section;
    }
    if (isHeading(section)) break;
  }

  return null;
}

function findCollapsibleWithSummary(
  doc: RenderableDocument,
  summaryText: string
): CollapsibleBlock | null {
  const collapsibles = findCollapsibles(doc);
  return collapsibles.find((c) => c.summary.includes(summaryText)) ?? null;
}

function createDatasetWithOnlyCompleted(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Feature 1',
      status: 'completed',
      phase: 1,
      quarter: 'Q4-2025',
    }),
    createTestPattern({
      name: 'Completed Feature 2',
      status: 'completed',
      phase: 1,
      quarter: 'Q4-2025',
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithBlockedPatterns(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Foundation Pattern',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 2,
    }),
    createTestPattern({
      name: 'Blocked Pattern',
      status: 'roadmap',
      phase: 2,
      dependsOn: ['Active Pattern'],
    }),
    createTestPattern({
      name: 'Ready Pattern',
      status: 'roadmap',
      phase: 3,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithManyPlannedPatterns(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Base',
      status: 'completed',
      phase: 1,
    }),
  ];

  // Create 10 planned patterns
  for (let i = 1; i <= 10; i++) {
    patterns.push(
      createTestPattern({
        name: `Planned Pattern ${i}`,
        status: 'roadmap',
        phase: 2,
      })
    );
  }

  return createTestMasterDataset({ patterns });
}

function createDatasetWithPrioritizedPatterns(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Critical Feature',
      status: 'roadmap',
      phase: 1,
      priority: 'critical',
    }),
    createTestPattern({
      name: 'High Priority Feature',
      status: 'roadmap',
      phase: 2,
      priority: 'high',
    }),
    createTestPattern({
      name: 'Medium Priority Feature',
      status: 'active',
      phase: 2,
      priority: 'medium',
    }),
    createTestPattern({
      name: 'Low Priority Feature',
      status: 'roadmap',
      phase: 3,
      priority: 'low',
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithActionablePatterns(): MasterDataset {
  // Create a dataset where some planned patterns are actionable (not blocked)
  const patterns = [
    createTestPattern({
      name: 'Foundation Pattern',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      name: 'Active Work',
      status: 'active',
      phase: 2,
    }),
    // Actionable (no dependencies)
    createTestPattern({
      name: 'Actionable Feature 1',
      status: 'roadmap',
      phase: 3,
    }),
    // Actionable (no dependencies)
    createTestPattern({
      name: 'Actionable Feature 2',
      status: 'roadmap',
      phase: 3,
    }),
    // Blocked (depends on Active Work)
    createTestPattern({
      name: 'Blocked Feature',
      status: 'roadmap',
      phase: 4,
      dependsOn: ['Active Work'],
    }),
  ];
  return createTestMasterDataset({ patterns });
}

// =============================================================================
// Feature: Session Document Codecs
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/session-codecs.feature');

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
  // Rule: SessionContextCodec provides working context for AI sessions
  // ===========================================================================

  Rule('SessionContextCodec provides working context for AI sessions', ({ RuleScenario }) => {
    RuleScenario(
      'Decode empty dataset produces minimal session context',
      ({ Given, When, Then, And }) => {
        Given('an empty MasterDataset', () => {
          state!.dataset = createTestMasterDataset();
        });

        When('decoding with SessionContextCodec', () => {
          state!.document = SessionContextCodec.decode(state!.dataset!);
        });

        Then('the document title is {string}', (_ctx: unknown, title: string) => {
          expect(state!.document!.title).toBe(title);
        });

        And('the document has a purpose', () => {
          expect(state!.document!.purpose).toBeDefined();
          expect(state!.document!.purpose!.length).toBeGreaterThan(0);
        });

        And('the session status shows {int} active patterns', (_ctx: unknown, count: number) => {
          const { table } = findSessionStatusSection(state!.document!);
          expect(table).toBeDefined();
          const activeRow = table!.rows.find((row) => row[0]?.includes('Active'));
          expect(activeRow).toBeDefined();
          expect(activeRow![1]).toBe(String(count));
        });
      }
    );

    RuleScenario('Decode dataset with timeline patterns', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with SessionContextCodec', () => {
        state!.document = SessionContextCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains sections:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const headings = findHeadings(state!.document!);
        const headingTexts = headings.map((h) => h.text);

        for (const row of dataTable) {
          const expected = row.heading ?? '';
          expect(
            headingTexts.some((h) => h.includes(expected)),
            `Document should contain section "${expected}"`
          ).toBe(true);
        }
      });
    });

    RuleScenario('Session status shows current focus', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with status distribution:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const counts: Record<string, number> = {};
          for (const row of dataTable) {
            counts[row.status] = parseInt(row.count);
          }
          state!.dataset = createMasterDatasetWithStatus(counts);
        }
      );

      When('decoding with SessionContextCodec', () => {
        state!.document = SessionContextCodec.decode(state!.dataset!);
      });

      Then('the session status section shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const { table } = findSessionStatusSection(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const metric = row.metric ?? '';
          const expectedValue = row.value;
          const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
          expect(tableRow, `Should have row for ${metric}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedValue);
        }
      });

      And('the session status shows current focus', () => {
        const { paragraph } = findSessionStatusSection(state!.document!);
        expect(paragraph).toContain('Current Focus');
      });
    });

    RuleScenario('Phase navigation for incomplete phases', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with SessionContextCodec', () => {
        state!.document = SessionContextCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the phase navigation table has columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findTableWithHeader(state!.document!, 'Phase');
        expect(table).toBeDefined();

        for (const row of dataTable) {
          expect(table!.columns).toContain(row.column);
        }
      });

      And('the phase navigation shows only incomplete phases', () => {
        const table = findTableWithHeader(state!.document!, 'Phase');
        expect(table).toBeDefined();
        // Timeline patterns have phases 1-4, with 1 and 2 complete
        // So we should only see phases 3 and 4 in the navigation
        expect(table!.rows.length).toBe(2);
      });
    });

    RuleScenario('Active work grouped by phase', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with SessionContextCodec', () => {
        state!.document = SessionContextCodec.decode(state!.dataset!);
      });

      Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the active work shows patterns grouped by phase', () => {
        const headings = findHeadings(state!.document!);
        // Active work section should have phase subheadings
        const phaseHeadings = headings.filter((h) => h.text.includes('Phase'));
        expect(phaseHeadings.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Blocked items section with dependencies', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with blocked patterns', () => {
        state!.dataset = createDatasetWithBlockedPatterns();
      });

      When('decoding with includeDependencies enabled for session', () => {
        const codec = createSessionContextCodec({ includeDependencies: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the blocked items table shows pattern and blocker', () => {
        const table = findBlockedItemsTable(state!.document!);
        expect(table).toBeDefined();
        expect(table!.columns).toContain('Pattern');
        expect(table!.columns).toContain('Blocked By');
      });
    });

    RuleScenario('No blocked items section when disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with blocked patterns', () => {
        state!.dataset = createDatasetWithBlockedPatterns();
      });

      When('decoding with includeDependencies disabled for session', () => {
        const codec = createSessionContextCodec({ includeDependencies: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document does not contain {string}', (_ctx: unknown, text: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(text));
        expect(found, `Document should not contain "${text}"`).toBe(false);
      });
    });

    RuleScenario('Recent completions collapsible', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with SessionContextCodec', () => {
        state!.document = SessionContextCodec.decode(state!.dataset!);
      });

      Then('the document contains a collapsible {string}', (_ctx: unknown, summaryText: string) => {
        const collapsible = findCollapsibleWithSummary(state!.document!, summaryText);
        expect(collapsible, `Document should contain collapsible "${summaryText}"`).not.toBeNull();
      });

      And('the recent completions shows completed patterns', () => {
        const collapsible = findCollapsibleWithSummary(state!.document!, 'Recent Completions');
        expect(collapsible).not.toBeNull();
        // The collapsible should contain a list of completed patterns
        const lists = collapsible!.content.filter((b) => b.type === 'list');
        expect(lists.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Generate session phase detail files when enabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with generateDetailFiles enabled for session', () => {
        const codec = createSessionContextCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document has session detail files:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        expect(state!.document!.additionalFiles).toBeDefined();
        const files = Object.keys(state!.document!.additionalFiles!);

        for (const row of dataTable) {
          expect(files).toContain(row.path);
        }
      });
    });

    RuleScenario('No detail files when disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with generateDetailFiles disabled for session', () => {
        const codec = createSessionContextCodec({ generateDetailFiles: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document has no additional files', () => {
        const additionalFiles = state!.document!.additionalFiles;
        expect(additionalFiles === undefined || Object.keys(additionalFiles).length === 0).toBe(
          true
        );
      });
    });
  });

  // ===========================================================================
  // Rule: RemainingWorkCodec aggregates incomplete work by phase
  // ===========================================================================

  Rule('RemainingWorkCodec aggregates incomplete work by phase', ({ RuleScenario }) => {
    RuleScenario('All work complete produces celebration message', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with only completed patterns', () => {
        state!.dataset = createDatasetWithOnlyCompleted();
      });

      When('decoding with RemainingWorkCodec', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains {string}', (_ctx: unknown, text: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(text));
        expect(found, `Document should contain "${text}"`).toBe(true);
      });
    });

    RuleScenario('Summary shows remaining counts', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with status distribution:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const counts: Record<string, number> = {};
          for (const row of dataTable) {
            counts[row.status] = parseInt(row.count);
          }
          state!.dataset = createMasterDatasetWithStatus(counts);
        }
      );

      When('decoding with RemainingWorkCodec', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findSummaryTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const status = row.status ?? '';
          const expectedCount = row.count;
          const tableRow = table!.rows.find((r) => r[0]?.includes(status));
          expect(tableRow, `Should have row for ${status}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedCount);
        }
      });
    });

    RuleScenario('Phase navigation with remaining count', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with RemainingWorkCodec', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the by phase table has columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findTableWithHeader(state!.document!, 'Phase');
        expect(table).toBeDefined();

        for (const row of dataTable) {
          expect(table!.columns).toContain(row.column);
        }
      });
    });

    RuleScenario('By priority shows ready vs blocked', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with blocked patterns', () => {
        state!.dataset = createDatasetWithBlockedPatterns();
      });

      When('decoding with RemainingWorkCodec', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the by priority table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findByPriorityTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const priority = row.priority ?? '';
          const found = table!.rows.some((r) => r[0]?.includes(priority));
          expect(found, `Priority table should show "${priority}"`).toBe(true);
        }
      });
    });

    RuleScenario('Next actionable items section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with actionable patterns', () => {
        state!.dataset = createDatasetWithActionablePatterns();
      });

      When('decoding with RemainingWorkCodec', () => {
        state!.document = RemainingWorkCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the next actionable items are not blocked', () => {
        // The actionable patterns dataset has:
        // - "Blocked Feature" which depends on "Active Work" (still active, not complete)
        // - "Actionable Feature 1" and "Actionable Feature 2" which have no dependencies
        // This validates that next actionable filters out blocked items.
        const headings = findHeadings(state!.document!);
        const nextActionableIdx = headings.findIndex((h) =>
          h.text.includes('Next Actionable Items')
        );

        expect(nextActionableIdx, 'Next Actionable Items section should exist').toBeGreaterThan(-1);

        const headingIdx = state!.document!.sections.indexOf(headings[nextActionableIdx]);
        // Find the list after the heading
        for (let i = headingIdx + 1; i < state!.document!.sections.length; i++) {
          const section = state!.document!.sections[i];
          if (isList(section)) {
            // Blocked items should not appear
            const listItems: string[] = section.items.map((item) =>
              typeof item === 'string' ? item : item.text
            );
            const hasBlockedItem = listItems.some((itemText) =>
              itemText.includes('Blocked Feature')
            );
            expect(hasBlockedItem).toBe(false);

            // Actionable items should appear
            const hasActionableItem = listItems.some((itemText) =>
              itemText.includes('Actionable Feature')
            );
            expect(hasActionableItem).toBe(true);
            break;
          }
          if (isHeading(section)) break;
        }
      });
    });

    RuleScenario('Next actionable respects maxNextActionable limit', ({ Given, When, Then }) => {
      Given('a MasterDataset with many planned patterns', () => {
        state!.dataset = createDatasetWithManyPlannedPatterns();
      });

      When('decoding with maxNextActionable set to {int}', (_ctx: unknown, limit: number) => {
        const codec = createRemainingWorkCodec({ maxNextActionable: limit });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the next actionable items shows at most {int} items',
        (_ctx: unknown, limit: number) => {
          const headings = findHeadings(state!.document!);
          const nextActionableIdx = headings.findIndex((h) =>
            h.text.includes('Next Actionable Items')
          );

          if (nextActionableIdx !== -1) {
            const headingIdx = state!.document!.sections.indexOf(headings[nextActionableIdx]);
            for (let i = headingIdx + 1; i < state!.document!.sections.length; i++) {
              const section = state!.document!.sections[i];
              if (isList(section)) {
                expect(section.items.length).toBeLessThanOrEqual(limit);
                break;
              }
              if (isHeading(section)) break;
            }
          }
        }
      );
    });

    RuleScenario('Sort by phase option', ({ Given, When, Then }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with sortBy set to {string}', (_ctx: unknown, sortBy: string) => {
        const codec = createRemainingWorkCodec({
          sortBy: sortBy as 'phase' | 'priority' | 'effort' | 'quarter',
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the remaining work is ordered by phase number', () => {
        // The By Phase section should exist and show phases in order
        const table = findTableWithHeader(state!.document!, 'Phase');
        expect(table).toBeDefined();

        // Extract phase numbers from rows (format: "Phase N" or similar)
        const phaseNumbers: number[] = [];
        for (const row of table!.rows) {
          const phaseMatch = row[0]?.match(/Phase (\d+)/);
          if (phaseMatch) {
            phaseNumbers.push(parseInt(phaseMatch[1]));
          }
        }

        // Verify phases are in ascending order
        for (let i = 1; i < phaseNumbers.length; i++) {
          expect(phaseNumbers[i]).toBeGreaterThanOrEqual(phaseNumbers[i - 1]);
        }
      });
    });

    RuleScenario('Sort by priority option', ({ Given, When, Then }) => {
      Given('a MasterDataset with prioritized patterns', () => {
        state!.dataset = createDatasetWithPrioritizedPatterns();
      });

      When('decoding with sortBy set to {string}', (_ctx: unknown, sortBy: string) => {
        const codec = createRemainingWorkCodec({
          sortBy: sortBy as 'phase' | 'priority' | 'effort' | 'quarter',
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the remaining work shows priority groupings', () => {
        // The By Priority section should exist
        const headings = findHeadings(state!.document!);
        const hasPrioritySection = headings.some((h) => h.text.includes('By Priority'));
        expect(hasPrioritySection).toBe(true);
      });
    });

    RuleScenario('Generate remaining work detail files when enabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with generateDetailFiles enabled for remaining', () => {
        const codec = createRemainingWorkCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document has remaining detail files:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          expect(state!.document!.additionalFiles).toBeDefined();
          const files = Object.keys(state!.document!.additionalFiles!);

          for (const row of dataTable) {
            expect(files).toContain(row.path);
          }
        }
      );
    });

    RuleScenario('No detail files when disabled for remaining', ({ Given, When, Then }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with generateDetailFiles disabled for remaining', () => {
        const codec = createRemainingWorkCodec({ generateDetailFiles: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document has no additional files', () => {
        const additionalFiles = state!.document!.additionalFiles;
        expect(additionalFiles === undefined || Object.keys(additionalFiles).length === 0).toBe(
          true
        );
      });
    });
  });
});
