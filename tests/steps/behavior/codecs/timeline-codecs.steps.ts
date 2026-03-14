/**
 * Timeline Codecs Step Definitions
 *
 * BDD step definitions for testing the timeline codecs:
 * - RoadmapDocumentCodec
 * - CompletedMilestonesCodec
 * - CurrentWorkCodec
 *
 * Tests document structure, sections, options, and detail file generation.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createRoadmapCodec,
  RoadmapDocumentCodec,
  createMilestonesCodec,
  CompletedMilestonesCodec,
  createCurrentWorkCodec,
  CurrentWorkCodec,
} from '../../../../src/renderable/codecs/timeline.js';
import type { RenderableDocument, TableBlock } from '../../../../src/renderable/schema.js';
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

interface TimelineCodecState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TimelineCodecState | null = null;

function initState(): TimelineCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function findOverallProgressSection(doc: RenderableDocument): {
  paragraph: string;
  table: TableBlock | null;
} {
  const progressIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'Overall Progress');

  if (progressIdx === -1) {
    return { paragraph: '', table: null };
  }

  // Find the paragraph after Overall Progress heading
  let paragraphText = '';
  for (let i = progressIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      paragraphText = section.text;
      break;
    }
    if (isHeading(section)) break;
  }

  // Find the table after Overall Progress heading
  let table: TableBlock | null = null;
  for (let i = progressIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      table = section;
      break;
    }
    if (isHeading(section)) break;
  }

  return { paragraph: paragraphText, table };
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

function findPhaseNavigationTable(doc: RenderableDocument): TableBlock | null {
  return findTableWithHeader(doc, 'Phase');
}

/**
 * Find a phase section by phase number.
 * Note: Phase name mappings (Foundation Types, CMS Integration, etc.)
 * align with createMasterDatasetWithTimeline() output.
 */
function findPhaseSection(
  doc: RenderableDocument,
  phaseNum: number
): {
  heading: string;
  content: string;
} | null {
  const headings = findHeadings(doc);

  for (const heading of headings) {
    // Look for phase headings like "Phase 1" or phase name patterns
    if (
      heading.text.includes(`Phase ${phaseNum}`) ||
      (phaseNum === 1 && heading.text.includes('Foundation Types')) ||
      (phaseNum === 2 && heading.text.includes('CMS Integration')) ||
      (phaseNum === 3 && heading.text.includes('Event Store Enhancement')) ||
      (phaseNum === 4 && heading.text.includes('Advanced Projections'))
    ) {
      // Get next section content
      const headingIdx = doc.sections.indexOf(heading);
      let content = '';
      for (let j = headingIdx + 1; j < doc.sections.length; j++) {
        const section = doc.sections[j];
        if (isHeading(section) && section.level <= heading.level) break;
        if (isParagraph(section)) {
          content += section.text + ' ';
        }
      }

      return { heading: heading.text, content: content.trim() };
    }
  }

  return null;
}

function findQuarterlyTimelineTable(doc: RenderableDocument): TableBlock | null {
  const headings = findHeadings(doc);
  const quarterlyIdx = headings.findIndex((h) => h.text === 'Quarterly Timeline');

  if (quarterlyIdx === -1) return null;

  const headingIdx = doc.sections.indexOf(headings[quarterlyIdx]);
  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) return section;
    if (isHeading(section)) break;
  }

  return null;
}

function createDatasetWithOnlyPlanned(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Planned Feature 1',
      status: 'roadmap',
      phase: 1,
    }),
    createTestPattern({
      name: 'Planned Feature 2',
      status: 'roadmap',
      phase: 2,
    }),
  ];
  return createTestMasterDataset({ patterns });
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

function createDatasetWithDeliverables(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 1,
      deliverables: [
        { name: 'Component A', status: 'complete', tests: 1, location: 'src/componentA/' },
        { name: 'Component B', status: 'in-progress', tests: 0, location: 'src/componentB/' },
      ],
    }),
  ];
  return createTestMasterDataset({ patterns });
}

// =============================================================================
// Feature: Timeline Document Codecs
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/timeline-codecs.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a timeline codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: RoadmapDocumentCodec groups patterns by phase with progress tracking
  // ===========================================================================

  Rule(
    'RoadmapDocumentCodec groups patterns by phase with progress tracking',
    ({ RuleScenario }) => {
      RuleScenario(
        'Decode empty dataset produces minimal roadmap',
        ({ Given, When, Then, And }) => {
          Given('an empty MasterDataset', () => {
            state!.dataset = createTestMasterDataset();
          });

          When('decoding with RoadmapDocumentCodec', () => {
            state!.document = RoadmapDocumentCodec.decode(state!.dataset!);
          });

          Then('the document title is {string}', (_ctx: unknown, title: string) => {
            expect(state!.document!.title).toBe(title);
          });

          And('the document has a purpose', () => {
            expect(state!.document!.purpose).toBeDefined();
            expect(state!.document!.purpose!.length).toBeGreaterThan(0);
          });

          And('the overall progress shows {int} patterns', (_ctx: unknown, count: number) => {
            const { table } = findOverallProgressSection(state!.document!);
            expect(table).toBeDefined();
            const totalRow = table!.rows.find((row) => row[0]?.includes('Total'));
            expect(totalRow).toBeDefined();
            expect(totalRow![1]).toBe(String(count));
          });
        }
      );

      RuleScenario('Decode dataset with multiple phases', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with RoadmapDocumentCodec', () => {
          state!.document = RoadmapDocumentCodec.decode(state!.dataset!);
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

      RuleScenario('Progress section shows correct status counts', ({ Given, When, Then, And }) => {
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

        When('decoding with RoadmapDocumentCodec', () => {
          state!.document = RoadmapDocumentCodec.decode(state!.dataset!);
        });

        Then('the overall progress table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const { table } = findOverallProgressSection(state!.document!);
          expect(table).toBeDefined();

          for (const row of dataTable) {
            const metric = row.metric ?? '';
            const expectedValue = row.value;
            const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
            expect(tableRow, `Should have row for ${metric}`).toBeDefined();
            expect(tableRow![1]).toBe(expectedValue);
          }
        });

        And('the overall progress shows {string}', (_ctx: unknown, expected: string) => {
          const { paragraph } = findOverallProgressSection(state!.document!);
          expect(paragraph).toContain(expected);
        });
      });

      RuleScenario('Phase navigation table with progress', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with RoadmapDocumentCodec', () => {
          state!.document = RoadmapDocumentCodec.decode(state!.dataset!);
        });

        Then(
          'the phase navigation table has columns:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            const table = findPhaseNavigationTable(state!.document!);
            expect(table).toBeDefined();

            for (const row of dataTable) {
              expect(table!.columns).toContain(row.column);
            }
          }
        );

        And('the phase navigation has {int} rows', (_ctx: unknown, count: number) => {
          const table = findPhaseNavigationTable(state!.document!);
          expect(table).toBeDefined();
          expect(table!.rows.length).toBe(count);
        });
      });

      RuleScenario('Phase sections show pattern tables', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with RoadmapDocumentCodec', () => {
          state!.document = RoadmapDocumentCodec.decode(state!.dataset!);
        });

        Then(
          'phase {int} section shows {string}',
          (_ctx: unknown, phaseNum: number, expected: string) => {
            const phase = findPhaseSection(state!.document!, phaseNum);
            expect(phase, `Phase ${phaseNum} section should exist`).not.toBeNull();
            expect(phase!.content).toContain(expected);
          }
        );

        And('phase {int} section shows active patterns', (_ctx: unknown, phaseNum: number) => {
          const phase = findPhaseSection(state!.document!, phaseNum);
          expect(phase, `Phase ${phaseNum} section should exist`).not.toBeNull();
          // Active phase 3 should show active status content
          expect(phase!.heading).toBeDefined();
        });
      });

      RuleScenario('Generate phase detail files when enabled', ({ Given, When, Then }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with generateDetailFiles enabled for roadmap', () => {
          const codec = createRoadmapCodec({ generateDetailFiles: true });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document has phase detail files:', (_ctx: unknown, dataTable: DataTableRow[]) => {
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

        When('decoding with generateDetailFiles disabled for roadmap', () => {
          const codec = createRoadmapCodec({ generateDetailFiles: false });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document has no additional files', () => {
          const additionalFiles = state!.document!.additionalFiles;
          expect(additionalFiles === undefined || Object.keys(additionalFiles).length === 0).toBe(
            true
          );
        });
      });

      RuleScenario('Quarterly timeline shown when quarters exist', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with RoadmapDocumentCodec', () => {
          state!.document = RoadmapDocumentCodec.decode(state!.dataset!);
        });

        Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(sectionName));
          expect(found, `Document should contain "${sectionName}" section`).toBe(true);
        });

        And(
          'the quarterly timeline table has quarters:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            const table = findQuarterlyTimelineTable(state!.document!);
            expect(table).toBeDefined();

            for (const row of dataTable) {
              const quarter = row.quarter ?? '';
              const found = table!.rows.some((r) => r[0]?.includes(quarter));
              expect(found, `Quarterly timeline should include ${quarter}`).toBe(true);
            }
          }
        );
      });
    }
  );

  // ===========================================================================
  // Rule: CompletedMilestonesCodec shows only completed patterns grouped by quarter
  // ===========================================================================

  Rule(
    'CompletedMilestonesCodec shows only completed patterns grouped by quarter',
    ({ RuleScenario }) => {
      RuleScenario('No completed patterns produces empty message', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with only planned patterns', () => {
          state!.dataset = createDatasetWithOnlyPlanned();
        });

        When('decoding with CompletedMilestonesCodec', () => {
          state!.document = CompletedMilestonesCodec.decode(state!.dataset!);
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

      RuleScenario('Summary shows completed counts', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with CompletedMilestonesCodec', () => {
          state!.document = CompletedMilestonesCodec.decode(state!.dataset!);
        });

        Then('the document title is {string}', (_ctx: unknown, title: string) => {
          expect(state!.document!.title).toBe(title);
        });

        And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const table = findSummaryTable(state!.document!);
          expect(table).toBeDefined();

          for (const row of dataTable) {
            const metric = row.metric ?? '';
            const expectedValue = row.value;
            const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
            expect(tableRow, `Should have row for ${metric}`).toBeDefined();
            expect(tableRow![1]).toBe(expectedValue);
          }
        });
      });

      RuleScenario('Quarterly navigation with completed patterns', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with CompletedMilestonesCodec', () => {
          state!.document = CompletedMilestonesCodec.decode(state!.dataset!);
        });

        Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(sectionName));
          expect(found, `Document should contain "${sectionName}" section`).toBe(true);
        });

        And('the quarterly navigation shows quarters with completed counts', () => {
          const table = findTableWithHeader(state!.document!, 'Quarter');
          expect(table).toBeDefined();
          expect(table!.rows.length).toBeGreaterThan(0);
        });
      });

      RuleScenario(
        'Completed phases shown in collapsible sections',
        ({ Given, When, Then, And }) => {
          Given('a MasterDataset with timeline patterns', () => {
            state!.dataset = createMasterDatasetWithTimeline();
          });

          When('decoding with CompletedMilestonesCodec', () => {
            state!.document = CompletedMilestonesCodec.decode(state!.dataset!);
          });

          Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
            const headings = findHeadings(state!.document!);
            const found = headings.some((h) => h.text.includes(sectionName));
            expect(found, `Document should contain "${sectionName}" section`).toBe(true);
          });

          And('the completed phases are collapsible', () => {
            const collapsibles = findCollapsibles(state!.document!);
            expect(collapsibles.length).toBeGreaterThan(0);
          });
        }
      );

      RuleScenario('Recent completions section with limit', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with CompletedMilestonesCodec', () => {
          state!.document = CompletedMilestonesCodec.decode(state!.dataset!);
        });

        Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(sectionName));
          expect(found, `Document should contain "${sectionName}" section`).toBe(true);
        });

        And('recent completions shows at most {int} patterns', (_ctx: unknown, limit: number) => {
          // Find the Recent Completions list
          const headings = findHeadings(state!.document!);
          const recentIdx = headings.findIndex((h) => h.text.includes('Recent Completions'));

          if (recentIdx !== -1) {
            const headingIdx = state!.document!.sections.indexOf(headings[recentIdx]);
            for (let i = headingIdx + 1; i < state!.document!.sections.length; i++) {
              const section = state!.document!.sections[i];
              if (isList(section)) {
                expect(section.items.length).toBeLessThanOrEqual(limit);
                break;
              }
              if (isHeading(section)) break;
            }
          }
        });
      });

      RuleScenario('Generate quarterly detail files when enabled', ({ Given, When, Then }) => {
        Given('a MasterDataset with timeline patterns', () => {
          state!.dataset = createMasterDatasetWithTimeline();
        });

        When('decoding with generateDetailFiles enabled for milestones', () => {
          const codec = createMilestonesCodec({ generateDetailFiles: true });
          state!.document = codec.decode(state!.dataset!);
        });

        Then(
          'the document has quarterly milestone files:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            expect(state!.document!.additionalFiles).toBeDefined();
            const files = Object.keys(state!.document!.additionalFiles!);

            for (const row of dataTable) {
              expect(files).toContain(row.path);
            }
          }
        );
      });
    }
  );

  // ===========================================================================
  // Rule: CurrentWorkCodec shows only active patterns with deliverables
  // ===========================================================================

  Rule('CurrentWorkCodec shows only active patterns with deliverables', ({ RuleScenario }) => {
    RuleScenario('No active work produces empty message', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with only completed patterns', () => {
        state!.dataset = createDatasetWithOnlyCompleted();
      });

      When('decoding with CurrentWorkCodec', () => {
        state!.document = CurrentWorkCodec.decode(state!.dataset!);
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

    RuleScenario('Summary shows overall progress', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with CurrentWorkCodec', () => {
        state!.document = CurrentWorkCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the summary shows overall progress percentage', () => {
        const table = findSummaryTable(state!.document!);
        expect(table).toBeDefined();
        // Check that it has progress-related metrics
        const hasTotal = table!.rows.some((r) => r[0]?.includes('Total'));
        expect(hasTotal).toBe(true);
      });

      And('the summary shows active phases count', () => {
        const table = findSummaryTable(state!.document!);
        expect(table).toBeDefined();
        const hasActivePhases = table!.rows.some((r) => r[0]?.includes('Active Phases'));
        expect(hasActivePhases).toBe(true);
      });
    });

    RuleScenario('Active phases with progress bars', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with CurrentWorkCodec', () => {
        state!.document = CurrentWorkCodec.decode(state!.dataset!);
      });

      Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And(
        'active phase {int} shows progress and status breakdown',
        (_ctx: unknown, phaseNum: number) => {
          const phase = findPhaseSection(state!.document!, phaseNum);
          expect(phase, `Phase ${phaseNum} section should exist`).not.toBeNull();
          // Phase content should contain progress info
          expect(phase!.content).toContain('%');
        }
      );
    });

    RuleScenario('Deliverables rendered when configured', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with deliverables', () => {
        state!.dataset = createDatasetWithDeliverables();
      });

      When('decoding with includeDeliverables enabled for current work', () => {
        const codec = createCurrentWorkCodec({ includeDeliverables: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the active patterns show their deliverables', () => {
        const headings = findHeadings(state!.document!);
        const hasDeliverables = headings.some((h) => h.text.includes('Deliverables'));
        expect(hasDeliverables).toBe(true);
      });
    });

    RuleScenario('All active patterns table', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with CurrentWorkCodec', () => {
        state!.document = CurrentWorkCodec.decode(state!.dataset!);
      });

      Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the active patterns table has columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        // Find the All Active Patterns table
        const headings = findHeadings(state!.document!);
        const allActiveIdx = headings.findIndex((h) => h.text.includes('All Active Patterns'));

        if (allActiveIdx !== -1) {
          const headingIdx = state!.document!.sections.indexOf(headings[allActiveIdx]);
          for (let i = headingIdx + 1; i < state!.document!.sections.length; i++) {
            const section = state!.document!.sections[i];
            if (isTable(section)) {
              for (const row of dataTable) {
                expect(section.columns).toContain(row.column);
              }
              break;
            }
            if (isHeading(section)) break;
          }
        }
      });
    });

    RuleScenario('Generate current work detail files when enabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with timeline patterns', () => {
        state!.dataset = createMasterDatasetWithTimeline();
      });

      When('decoding with generateDetailFiles enabled for current work', () => {
        const codec = createCurrentWorkCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document has current work detail files:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          expect(state!.document!.additionalFiles).toBeDefined();
          const files = Object.keys(state!.document!.additionalFiles!);

          for (const row of dataTable) {
            expect(files).toContain(row.path);
          }
        }
      );
    });
  });
});
