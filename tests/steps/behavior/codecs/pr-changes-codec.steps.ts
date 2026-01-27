/**
 * PR Changes Codec Step Definitions
 *
 * BDD step definitions for testing the PrChangesCodec:
 * - Filter by changedFiles and releaseFilter
 * - Grouping by phase, priority, or flat list
 * - Review checklist and dependencies generation
 * - Acceptance criteria and business rules rendering
 *
 * Tests document structure, sections, filters, and options.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createPrChangesCodec,
  PrChangesCodec,
} from '../../../../src/renderable/codecs/pr-changes.js';
import type { RenderableDocument, TableBlock } from '../../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import {
  createTestMasterDataset,
  createTestPattern,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findTableWithHeader,
  findLists,
  isHeading,
  isTable,
  isParagraph,
  isList,
} from '../../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface PrChangesCodecState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PrChangesCodecState | null = null;

function initState(): PrChangesCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

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

function findNoChangesSection(
  doc: RenderableDocument
): { heading: string; message: string } | null {
  const headings = findHeadings(doc);
  const noChangesHeading = headings.find((h) => h.text.includes('No Changes'));

  if (!noChangesHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(noChangesHeading);
  let message = '';

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      message = section.text;
      break;
    }
    if (isHeading(section)) break;
  }

  return { heading: noChangesHeading.text, message };
}

function findReviewChecklistSection(doc: RenderableDocument): string | null {
  const headings = findHeadings(doc);
  const checklistHeading = headings.find((h) => h.text.includes('Review Checklist'));

  if (!checklistHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(checklistHeading);

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      return section.text;
    }
    if (isHeading(section)) break;
  }

  return null;
}

function findDependenciesSection(doc: RenderableDocument): {
  dependsOn: string[];
  enables: string[];
} | null {
  const headings = findHeadings(doc);
  const depsHeading = headings.find((h) => h.text === 'Dependencies');

  if (!depsHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(depsHeading);
  const result = { dependsOn: [] as string[], enables: [] as string[] };

  let currentSubsection: 'dependsOn' | 'enables' | null = null;

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section)) {
      if (section.level <= 2) break;
      if (section.text.includes('Depends On')) {
        currentSubsection = 'dependsOn';
      } else if (section.text.includes('Enables')) {
        currentSubsection = 'enables';
      }
    }
    if (isList(section) && currentSubsection) {
      for (const item of section.items) {
        const text = typeof item === 'string' ? item : item.text;
        result[currentSubsection].push(text);
      }
    }
  }

  return result;
}

function documentContainsSection(doc: RenderableDocument, sectionName: string): boolean {
  const headings = findHeadings(doc);
  return headings.some((h) => h.text.includes(sectionName));
}

function getDocumentText(doc: RenderableDocument): string {
  const parts: string[] = [];

  for (const section of doc.sections) {
    if (isHeading(section) || isParagraph(section)) {
      parts.push(section.text);
    }
    if (isList(section)) {
      for (const item of section.items) {
        parts.push(typeof item === 'string' ? item : item.text);
      }
    }
  }

  return parts.join('\n');
}

// =============================================================================
// Pattern Factory Helpers
// =============================================================================

function createActivePatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Active Pattern 1',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
    }),
    createTestPattern({
      name: 'Active Pattern 2',
      status: 'active',
      phase: 2,
      filePath: 'src/events/order-created.ts',
    }),
  ];
}

function createPrRelevantPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Completed Feature',
      status: 'completed',
      phase: 1,
      filePath: 'src/core/feature.ts',
    }),
    createTestPattern({
      name: 'Active Feature 1',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/cmd.ts',
    }),
    createTestPattern({
      name: 'Active Feature 2',
      status: 'active',
      phase: 2,
      filePath: 'src/events/event.ts',
    }),
  ];
}

function createPatternsWithDeliverables(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Pattern With Deliverables',
      status: 'active',
      phase: 1,
      filePath: 'src/feature.ts',
      deliverables: [
        {
          name: 'Component A',
          status: 'complete',
          tests: 1,
          location: 'src/componentA/',
          release: 'v0.2.0',
        },
        {
          name: 'Component B',
          status: 'in-progress',
          tests: 0,
          location: 'src/componentB/',
          release: 'v0.2.0',
        },
      ],
    }),
  ];
}

function createPatternsWithMixedReleaseDeliverables(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Pattern With Mixed Releases',
      status: 'active',
      phase: 1,
      filePath: 'src/feature.ts',
      deliverables: [
        {
          name: 'v0.2.0 Component',
          status: 'complete',
          tests: 1,
          location: 'src/v020/',
          release: 'v0.2.0',
        },
        {
          name: 'v0.3.0 Component',
          status: 'in-progress',
          tests: 0,
          location: 'src/v030/',
          release: 'v0.3.0',
        },
      ],
    }),
  ];
}

function createPatternsInMultiplePhases(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Phase 1 Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/phase1.ts',
    }),
    createTestPattern({
      name: 'Phase 2 Pattern',
      status: 'active',
      phase: 2,
      filePath: 'src/phase2.ts',
    }),
    createTestPattern({
      name: 'Another Phase 1 Pattern',
      status: 'completed',
      phase: 1,
      filePath: 'src/phase1b.ts',
    }),
  ];
}

function createPatternsWithPriorities(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'High Priority Pattern',
      status: 'active',
      phase: 1,
      priority: 'high',
      filePath: 'src/high.ts',
    }),
    createTestPattern({
      name: 'Medium Priority Pattern',
      status: 'active',
      phase: 1,
      priority: 'medium',
      filePath: 'src/medium.ts',
    }),
    createTestPattern({
      name: 'Low Priority Pattern',
      status: 'active',
      phase: 1,
      priority: 'low',
      filePath: 'src/low.ts',
    }),
  ];
}

function createDetailedPattern(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Detailed Pattern',
      status: 'active',
      phase: 2,
      filePath: 'src/detailed.ts',
      description: 'This is a detailed description of the pattern explaining its purpose.',
    }),
  ];
}

function createPatternWithBusinessValue(): ExtractedPattern[] {
  const pattern = createTestPattern({
    name: 'Business Value Pattern',
    status: 'active',
    phase: 1,
    filePath: 'src/business-value.ts',
  });

  // Add businessValue directly (not supported by factory but allowed by schema)
  (pattern as { businessValue?: string }).businessValue = 'Improves user experience';

  return [pattern];
}

function createPatternsWithScenarios(): ExtractedPattern[] {
  const pattern = createTestPattern({
    name: 'Pattern With Scenarios',
    status: 'active',
    phase: 1,
    filePath: 'src/with-scenarios.ts',
  });

  // Add scenarios to the pattern
  (pattern as { scenarios?: unknown[] }).scenarios = [
    {
      featureFile: 'tests/features/test.feature',
      featureName: 'Test Feature',
      featureDescription: 'Test description',
      scenarioName: 'Test Scenario',
      semanticTags: ['@happy-path'],
      tags: ['@test'],
      steps: [
        { keyword: 'Given', text: 'a precondition' },
        { keyword: 'When', text: 'an action occurs' },
        { keyword: 'Then', text: 'a result is expected' },
      ],
    },
  ];

  return [pattern];
}

function createPatternsWithBusinessRules(): ExtractedPattern[] {
  const pattern = createTestPattern({
    name: 'Pattern With Rules',
    status: 'active',
    phase: 1,
    filePath: 'src/with-rules.ts',
  });

  // Add business rules to the pattern
  (pattern as { rules?: unknown[] }).rules = [
    {
      name: 'Business Rule 1',
      description: 'This rule ensures consistency.',
      scenarioCount: 2,
      scenarioNames: ['Scenario A', 'Scenario B'],
    },
  ];

  return [pattern];
}

function createPatternsWithDependsOn(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Dependent Pattern',
      status: 'active',
      phase: 2,
      filePath: 'src/dependent.ts',
      dependsOn: ['Foundation Types', 'Base Utilities'],
    }),
  ];
}

function createPatternsWithEnables(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Enabling Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/enabling.ts',
      enables: ['Advanced Features', 'Domain Model'],
    }),
  ];
}

function createPatternsWithDependencies(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Pattern With Deps',
      status: 'active',
      phase: 2,
      filePath: 'src/deps.ts',
      dependsOn: ['Foundation Types'],
      enables: ['Advanced Features'],
    }),
  ];
}

function createPatternsWithoutDependencies(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Independent Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/independent.ts',
    }),
  ];
}

function createPatternsFromVariousFiles(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Commands Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
    }),
    createTestPattern({
      name: 'Events Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/events/order-created.ts',
    }),
    createTestPattern({
      name: 'Domain Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/domain/order.ts',
    }),
  ];
}

function createPatternsWithDifferentReleases(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'v0.2.0 Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/v020.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/v020/',
          release: 'v0.2.0',
        },
      ],
    }),
    createTestPattern({
      name: 'v0.3.0 Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/v030.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/v030/',
          release: 'v0.3.0',
        },
      ],
    }),
  ];
}

function createPatternsMatchingFileOrRelease(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'File Match Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
    }),
    createTestPattern({
      name: 'Release Match Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/other/path.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/other/',
          release: 'v0.2.0',
        },
      ],
    }),
  ];
}

function createPatternMatchingBothFileAndRelease(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Both Match Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/commands/',
          release: 'v0.2.0',
        },
      ],
    }),
  ];
}

function createPatternsOfAllStatuses(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Completed Pattern',
      status: 'completed',
      phase: 1,
      filePath: 'src/completed.ts',
    }),
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/active.ts',
    }),
    createTestPattern({
      name: 'Roadmap Pattern',
      status: 'roadmap',
      phase: 2,
      filePath: 'src/roadmap.ts',
    }),
  ];
}

function createDeferredPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/active.ts',
    }),
    createTestPattern({
      name: 'Deferred Pattern',
      status: 'deferred',
      phase: 2,
      filePath: 'src/deferred.ts',
    }),
  ];
}

function createCompletedPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Completed Pattern 1',
      status: 'completed',
      phase: 1,
      filePath: 'src/completed1.ts',
    }),
    createTestPattern({
      name: 'Completed Pattern 2',
      status: 'completed',
      phase: 1,
      filePath: 'src/completed2.ts',
    }),
  ];
}

// =============================================================================
// Feature: PR Changes Document Codec
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/pr-changes-codec.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a PR changes codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec handles empty results gracefully
  // ===========================================================================

  Rule('PrChangesCodec handles empty results gracefully', ({ RuleScenario }) => {
    RuleScenario(
      'No changes when no patterns match changedFiles filter',
      ({ Given, When, Then, And }) => {
        Given('a MasterDataset with active patterns', () => {
          state!.dataset = createTestMasterDataset({ patterns: createActivePatterns() });
        });

        When('decoding with changedFiles filter for non-matching paths', () => {
          const codec = createPrChangesCodec({
            changedFiles: ['src/nonexistent/path.ts'],
          });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document title is {string}', (_ctx: unknown, title: string) => {
          expect(state!.document!.title).toBe(title);
        });

        And('the document contains {string} section', (_ctx: unknown, sectionName: string) => {
          expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
        });

        And('the no changes message mentions the file filter', () => {
          const noChanges = findNoChangesSection(state!.document!);
          expect(noChanges).not.toBeNull();
          expect(noChanges!.message).toContain('files matching');
        });
      }
    );

    RuleScenario(
      'No changes when no patterns match releaseFilter',
      ({ Given, When, Then, And }) => {
        Given('a MasterDataset with active patterns', () => {
          state!.dataset = createTestMasterDataset({ patterns: createActivePatterns() });
        });

        When('decoding with releaseFilter {string}', (_ctx: unknown, release: string) => {
          const codec = createPrChangesCodec({ releaseFilter: release });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document contains {string} section', (_ctx: unknown, sectionName: string) => {
          expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
        });

        And('the no changes message mentions the release filter', () => {
          const noChanges = findNoChangesSection(state!.document!);
          expect(noChanges).not.toBeNull();
          expect(noChanges!.message).toContain('release');
        });
      }
    );

    RuleScenario(
      'No changes with combined filters when nothing matches',
      ({ Given, When, Then, And }) => {
        Given('a MasterDataset with active patterns', () => {
          state!.dataset = createTestMasterDataset({ patterns: createActivePatterns() });
        });

        When('decoding with changedFiles and releaseFilter that match nothing', () => {
          const codec = createPrChangesCodec({
            changedFiles: ['src/nonexistent.ts'],
            releaseFilter: 'v9.9.9',
          });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document contains {string} section', (_ctx: unknown, sectionName: string) => {
          expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
        });

        And('the no changes message mentions both filters', () => {
          const noChanges = findNoChangesSection(state!.document!);
          expect(noChanges).not.toBeNull();
          expect(noChanges!.message).toContain('files matching');
          expect(noChanges!.message).toContain('release');
        });
      }
    );
  });

  // ===========================================================================
  // Rule: PrChangesCodec generates summary with filter information
  // ===========================================================================

  Rule('PrChangesCodec generates summary with filter information', ({ RuleScenario }) => {
    RuleScenario('Summary section shows pattern counts', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with PR-relevant patterns', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPrRelevantPatterns() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
      });

      And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findSummaryTable(state!.document!);
        expect(table).not.toBeNull();

        for (const row of dataTable) {
          const metric = row.metric ?? '';
          const expectedValue = row.value;
          const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
          expect(tableRow, `Should have row for ${metric}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedValue);
        }
      });
    });

    RuleScenario('Summary shows release tag when releaseFilter is set', ({ Given, When, Then }) => {
      Given('a MasterDataset with PR-relevant patterns with deliverables', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsWithDeliverables() });
      });

      When('decoding with releaseFilter {string}', (_ctx: unknown, release: string) => {
        const codec = createPrChangesCodec({ releaseFilter: release });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the summary table includes release tag row', () => {
        const table = findSummaryTable(state!.document!);
        expect(table).not.toBeNull();
        const releaseRow = table!.rows.find((r) => r[0]?.includes('Release Tag'));
        expect(releaseRow, 'Should have Release Tag row').toBeDefined();
      });
    });

    RuleScenario(
      'Summary shows files filter count when changedFiles is set',
      ({ Given, When, Then }) => {
        Given('a MasterDataset with PR-relevant patterns', () => {
          state!.dataset = createTestMasterDataset({ patterns: createPrRelevantPatterns() });
        });

        When('decoding with changedFiles filter for matching paths', () => {
          const codec = createPrChangesCodec({
            changedFiles: ['src/core/feature.ts', 'src/commands/cmd.ts'],
          });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the summary table includes files filter row', () => {
          const table = findSummaryTable(state!.document!);
          expect(table).not.toBeNull();
          const filesRow = table!.rows.find((r) => r[0]?.includes('Files Filter'));
          expect(filesRow, 'Should have Files Filter row').toBeDefined();
        });
      }
    );
  });

  // ===========================================================================
  // Rule: PrChangesCodec groups changes by phase when sortBy is "phase"
  // ===========================================================================

  Rule('PrChangesCodec groups changes by phase when sortBy is "phase"', ({ RuleScenario }) => {
    RuleScenario('Changes grouped by phase with default sortBy', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns in multiple phases', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsInMultiplePhases() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
      });

      And('the document contains phase headings:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const headings = findHeadings(state!.document!);
        const headingTexts = headings.map((h) => h.text);

        for (const row of dataTable) {
          const expected = row.heading ?? '';
          expect(
            headingTexts.some((h) => h.includes(expected)),
            `Document should contain heading "${expected}"`
          ).toBe(true);
        }
      });
    });

    RuleScenario('Pattern details shown within phase groups', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns in multiple phases', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsInMultiplePhases() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('phase groups contain pattern headings with status emoji', () => {
        const headings = findHeadings(state!.document!);
        // Look for pattern headings (level 4) that contain emoji
        const patternHeadings = headings.filter(
          (h) => h.level === 4 && (h.text.includes('✅') || h.text.includes('🔄'))
        );
        expect(patternHeadings.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec groups changes by priority when sortBy is "priority"
  // ===========================================================================

  Rule(
    'PrChangesCodec groups changes by priority when sortBy is "priority"',
    ({ RuleScenario }) => {
      RuleScenario('Changes grouped by priority', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with patterns with different priorities', () => {
          state!.dataset = createTestMasterDataset({ patterns: createPatternsWithPriorities() });
        });

        When('decoding with sortBy {string}', (_ctx: unknown, sortBy: string) => {
          const codec = createPrChangesCodec({ sortBy: sortBy as 'priority' });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
          expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
        });

        And(
          'the document contains priority headings:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            const headings = findHeadings(state!.document!);
            const headingTexts = headings.map((h) => h.text);

            for (const row of dataTable) {
              const expected = row.heading ?? '';
              expect(
                headingTexts.some((h) => h.includes(expected)),
                `Document should contain heading "${expected}"`
              ).toBe(true);
            }
          }
        );
      });

      RuleScenario('Priority groups show correct patterns', ({ Given, When, Then, And }) => {
        Given('a MasterDataset with patterns with different priorities', () => {
          state!.dataset = createTestMasterDataset({ patterns: createPatternsWithPriorities() });
        });

        When('decoding with sortBy {string}', (_ctx: unknown, sortBy: string) => {
          const codec = createPrChangesCodec({ sortBy: sortBy as 'priority' });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('high priority section contains high priority patterns', () => {
          const text = getDocumentText(state!.document!);
          expect(text).toContain('High Priority Pattern');
        });

        And('low priority section contains low priority patterns', () => {
          const text = getDocumentText(state!.document!);
          expect(text).toContain('Low Priority Pattern');
        });
      });
    }
  );

  // ===========================================================================
  // Rule: PrChangesCodec shows flat list when sortBy is "workflow"
  // ===========================================================================

  Rule('PrChangesCodec shows flat list when sortBy is "workflow"', ({ RuleScenario }) => {
    RuleScenario('Flat changes list with workflow sort', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with PR-relevant patterns', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPrRelevantPatterns() });
      });

      When('decoding with sortBy {string}', (_ctx: unknown, sortBy: string) => {
        const codec = createPrChangesCodec({ sortBy: sortBy as 'workflow' });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
      });

      And('the changes section contains pattern entries', () => {
        const headings = findHeadings(state!.document!);
        const patternHeadings = headings.filter((h) => h.level === 4);
        expect(patternHeadings.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec renders pattern details with metadata and description
  // ===========================================================================

  Rule(
    'PrChangesCodec renders pattern details with metadata and description',
    ({ RuleScenario }) => {
      RuleScenario('Pattern detail shows metadata table', ({ Given, When, Then }) => {
        Given('a MasterDataset with a detailed pattern', () => {
          state!.dataset = createTestMasterDataset({ patterns: createDetailedPattern() });
        });

        When('decoding with PrChangesCodec', () => {
          state!.document = PrChangesCodec.decode(state!.dataset!);
        });

        Then(
          'pattern details include metadata table with:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            const table = findTableWithHeader(state!.document!, 'Property');
            expect(table).not.toBeNull();

            for (const row of dataTable) {
              const property = row.property ?? '';
              const found = table!.rows.some((r) => r[0]?.includes(property));
              expect(found, `Table should have property "${property}"`).toBe(true);
            }
          }
        );
      });

      RuleScenario(
        'Pattern detail shows business value when available',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with a pattern with business value', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternWithBusinessValue(),
            });
          });

          When('decoding with PrChangesCodec', () => {
            state!.document = PrChangesCodec.decode(state!.dataset!);
          });

          Then(
            'pattern details include metadata table with:',
            (_ctx: unknown, dataTable: DataTableRow[]) => {
              const table = findTableWithHeader(state!.document!, 'Property');
              expect(table).not.toBeNull();

              for (const row of dataTable) {
                const property = row.property ?? '';
                const found = table!.rows.some((r) => r[0]?.includes(property));
                expect(found, `Table should have property "${property}"`).toBe(true);
              }
            }
          );
        }
      );

      RuleScenario('Pattern detail shows description', ({ Given, When, Then }) => {
        Given('a MasterDataset with a detailed pattern', () => {
          state!.dataset = createTestMasterDataset({ patterns: createDetailedPattern() });
        });

        When('decoding with PrChangesCodec', () => {
          state!.document = PrChangesCodec.decode(state!.dataset!);
        });

        Then('pattern details include description text', () => {
          const text = getDocumentText(state!.document!);
          expect(text).toContain('detailed description');
        });
      });
    }
  );

  // ===========================================================================
  // Rule: PrChangesCodec renders deliverables when includeDeliverables is enabled
  // ===========================================================================

  Rule(
    'PrChangesCodec renders deliverables when includeDeliverables is enabled',
    ({ RuleScenario }) => {
      RuleScenario(
        'Deliverables shown when patterns have deliverables',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns with deliverables', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithDeliverables(),
            });
          });

          When('decoding with includeDeliverables enabled', () => {
            const codec = createPrChangesCodec({ includeDeliverables: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the document contains deliverables lists', () => {
            const text = getDocumentText(state!.document!);
            expect(text).toContain('Deliverables');
            expect(text).toContain('Component A');
          });
        }
      );

      RuleScenario(
        'Deliverables filtered by release when releaseFilter is set',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns with mixed release deliverables', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithMixedReleaseDeliverables(),
            });
          });

          When(
            'decoding with releaseFilter {string} and includeDeliverables',
            (_ctx: unknown, release: string) => {
              const codec = createPrChangesCodec({
                releaseFilter: release,
                includeDeliverables: true,
              });
              state!.document = codec.decode(state!.dataset!);
            }
          );

          Then('only deliverables for {string} are shown', (_ctx: unknown, _release: string) => {
            const text = getDocumentText(state!.document!);
            expect(text).toContain('v0.2.0 Component');
            expect(text).not.toContain('v0.3.0 Component');
          });
        }
      );

      RuleScenario(
        'No deliverables section when includeDeliverables is disabled',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns with deliverables', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithDeliverables(),
            });
          });

          When('decoding with includeDeliverables disabled', () => {
            const codec = createPrChangesCodec({ includeDeliverables: false });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the document does not contain deliverables lists', () => {
            const text = getDocumentText(state!.document!);
            expect(text).not.toContain('**Deliverables:**');
          });
        }
      );
    }
  );

  // ===========================================================================
  // Rule: PrChangesCodec renders acceptance criteria from scenarios
  // ===========================================================================

  Rule('PrChangesCodec renders acceptance criteria from scenarios', ({ RuleScenario }) => {
    RuleScenario(
      'Acceptance criteria rendered when patterns have scenarios',
      ({ Given, When, Then }) => {
        Given('a MasterDataset with patterns with scenarios', () => {
          state!.dataset = createTestMasterDataset({ patterns: createPatternsWithScenarios() });
        });

        When('decoding with PrChangesCodec', () => {
          state!.document = PrChangesCodec.decode(state!.dataset!);
        });

        Then('the document contains {string} sections', (_ctx: unknown, sectionName: string) => {
          expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
        });
      }
    );

    RuleScenario('Acceptance criteria shows scenario steps', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with scenarios and steps', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsWithScenarios() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('acceptance criteria sections contain step lists', () => {
        const lists = findLists(state!.document!);
        const stepList = lists.find((l) =>
          l.items.some((item) => {
            const text = typeof item === 'string' ? item : item.text;
            return text.includes('Given') || text.includes('When') || text.includes('Then');
          })
        );
        expect(stepList).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec renders business rules from Gherkin Rule keyword
  // ===========================================================================

  Rule('PrChangesCodec renders business rules from Gherkin Rule keyword', ({ RuleScenario }) => {
    RuleScenario('Business rules rendered when patterns have rules', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with business rules', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsWithBusinessRules() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('the document contains {string} sections', (_ctx: unknown, sectionName: string) => {
        expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
      });
    });

    RuleScenario(
      'Business rules show rule names and verification info',
      ({ Given, When, Then, And }) => {
        Given('a MasterDataset with patterns with business rules', () => {
          state!.dataset = createTestMasterDataset({ patterns: createPatternsWithBusinessRules() });
        });

        When('decoding with PrChangesCodec', () => {
          state!.document = PrChangesCodec.decode(state!.dataset!);
        });

        Then('business rules sections contain rule names', () => {
          const text = getDocumentText(state!.document!);
          expect(text).toContain('Business Rule 1');
        });

        And('business rules sections contain verification info', () => {
          const text = getDocumentText(state!.document!);
          expect(text).toContain('Verified by');
        });
      }
    );
  });

  // ===========================================================================
  // Rule: PrChangesCodec generates review checklist when includeReviewChecklist is enabled
  // ===========================================================================

  Rule(
    'PrChangesCodec generates review checklist when includeReviewChecklist is enabled',
    ({ RuleScenario }) => {
      RuleScenario(
        'Review checklist generated with standard items',
        ({ Given, When, Then, And }) => {
          Given('a MasterDataset with PR-relevant patterns', () => {
            state!.dataset = createTestMasterDataset({ patterns: createPrRelevantPatterns() });
          });

          When('decoding with includeReviewChecklist enabled', () => {
            const codec = createPrChangesCodec({ includeReviewChecklist: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
            expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
          });

          And(
            'the review checklist contains standard items:',
            (_ctx: unknown, dataTable: DataTableRow[]) => {
              const checklist = findReviewChecklistSection(state!.document!);
              expect(checklist).not.toBeNull();

              for (const row of dataTable) {
                const item = row.item ?? '';
                expect(checklist, `Checklist should contain "${item}"`).toContain(item);
              }
            }
          );
        }
      );

      RuleScenario(
        'Review checklist includes completed patterns item when applicable',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with completed patterns', () => {
            state!.dataset = createTestMasterDataset({ patterns: createCompletedPatterns() });
          });

          When('decoding with includeReviewChecklist enabled', () => {
            const codec = createPrChangesCodec({ includeReviewChecklist: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the review checklist contains {string}', (_ctx: unknown, item: string) => {
            const checklist = findReviewChecklistSection(state!.document!);
            expect(checklist).not.toBeNull();
            expect(checklist).toContain(item);
          });
        }
      );

      RuleScenario(
        'Review checklist includes active work item when applicable',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with active patterns', () => {
            state!.dataset = createTestMasterDataset({ patterns: createActivePatterns() });
          });

          When('decoding with includeReviewChecklist enabled', () => {
            const codec = createPrChangesCodec({ includeReviewChecklist: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the review checklist contains {string}', (_ctx: unknown, item: string) => {
            const checklist = findReviewChecklistSection(state!.document!);
            expect(checklist).not.toBeNull();
            expect(checklist).toContain(item);
          });
        }
      );

      RuleScenario(
        'Review checklist includes dependencies item when patterns have dependencies',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns with dependencies', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithDependencies(),
            });
          });

          When('decoding with includeReviewChecklist enabled', () => {
            const codec = createPrChangesCodec({ includeReviewChecklist: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the review checklist contains {string}', (_ctx: unknown, item: string) => {
            const checklist = findReviewChecklistSection(state!.document!);
            expect(checklist).not.toBeNull();
            expect(checklist).toContain(item);
          });
        }
      );

      RuleScenario(
        'Review checklist includes deliverables item when patterns have deliverables',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns with deliverables', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithDeliverables(),
            });
          });

          When('decoding with includeReviewChecklist enabled', () => {
            const codec = createPrChangesCodec({ includeReviewChecklist: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the review checklist contains {string}', (_ctx: unknown, item: string) => {
            const checklist = findReviewChecklistSection(state!.document!);
            expect(checklist).not.toBeNull();
            expect(checklist).toContain(item);
          });
        }
      );

      RuleScenario(
        'No review checklist when includeReviewChecklist is disabled',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with PR-relevant patterns', () => {
            state!.dataset = createTestMasterDataset({ patterns: createPrRelevantPatterns() });
          });

          When('decoding with includeReviewChecklist disabled', () => {
            const codec = createPrChangesCodec({ includeReviewChecklist: false });
            state!.document = codec.decode(state!.dataset!);
          });

          Then(
            'the document does not contain a {string} section',
            (_ctx: unknown, sectionName: string) => {
              expect(documentContainsSection(state!.document!, sectionName)).toBe(false);
            }
          );
        }
      );
    }
  );

  // ===========================================================================
  // Rule: PrChangesCodec generates dependencies section when includeDependencies is enabled
  // ===========================================================================

  Rule(
    'PrChangesCodec generates dependencies section when includeDependencies is enabled',
    ({ RuleScenario }) => {
      RuleScenario(
        'Dependencies section shows depends on relationships',
        ({ Given, When, Then, And }) => {
          Given('a MasterDataset with patterns with dependsOn relationships', () => {
            state!.dataset = createTestMasterDataset({ patterns: createPatternsWithDependsOn() });
          });

          When('decoding with includeDependencies enabled', () => {
            const codec = createPrChangesCodec({ includeDependencies: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
            expect(documentContainsSection(state!.document!, sectionName)).toBe(true);
          });

          And(
            'the dependencies section contains {string} subsection',
            (_ctx: unknown, _subsection: string) => {
              const deps = findDependenciesSection(state!.document!);
              expect(deps).not.toBeNull();
              expect(deps!.dependsOn.length).toBeGreaterThan(0);
            }
          );
        }
      );

      RuleScenario('Dependencies section shows enables relationships', ({ Given, When, Then }) => {
        Given('a MasterDataset with patterns with enables relationships', () => {
          state!.dataset = createTestMasterDataset({ patterns: createPatternsWithEnables() });
        });

        When('decoding with includeDependencies enabled', () => {
          const codec = createPrChangesCodec({ includeDependencies: true });
          state!.document = codec.decode(state!.dataset!);
        });

        Then(
          'the dependencies section contains {string} subsection',
          (_ctx: unknown, _subsection: string) => {
            const deps = findDependenciesSection(state!.document!);
            expect(deps).not.toBeNull();
            expect(deps!.enables.length).toBeGreaterThan(0);
          }
        );
      });

      RuleScenario(
        'No dependencies section when patterns have no dependencies',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns without dependencies', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithoutDependencies(),
            });
          });

          When('decoding with includeDependencies enabled', () => {
            const codec = createPrChangesCodec({ includeDependencies: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then(
            'the document does not contain a {string} section',
            (_ctx: unknown, sectionName: string) => {
              expect(documentContainsSection(state!.document!, sectionName)).toBe(false);
            }
          );
        }
      );

      RuleScenario(
        'No dependencies section when includeDependencies is disabled',
        ({ Given, When, Then }) => {
          Given('a MasterDataset with patterns with dependencies', () => {
            state!.dataset = createTestMasterDataset({
              patterns: createPatternsWithDependencies(),
            });
          });

          When('decoding with includeDependencies disabled', () => {
            const codec = createPrChangesCodec({ includeDependencies: false });
            state!.document = codec.decode(state!.dataset!);
          });

          Then(
            'the document does not contain a {string} section',
            (_ctx: unknown, sectionName: string) => {
              expect(documentContainsSection(state!.document!, sectionName)).toBe(false);
            }
          );
        }
      );
    }
  );

  // ===========================================================================
  // Rule: PrChangesCodec filters patterns by changedFiles
  // ===========================================================================

  Rule('PrChangesCodec filters patterns by changedFiles', ({ RuleScenario }) => {
    RuleScenario('Patterns filtered by changedFiles match', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns from various files', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsFromVariousFiles() });
      });

      When('decoding with changedFiles filter matching specific patterns', () => {
        const codec = createPrChangesCodec({
          changedFiles: ['src/commands/order.ts'],
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('only patterns from those files are included', () => {
        const text = getDocumentText(state!.document!);
        expect(text).toContain('Commands Pattern');
        expect(text).not.toContain('Events Pattern');
        expect(text).not.toContain('Domain Pattern');
      });
    });

    RuleScenario('changedFiles filter matches partial paths', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns from various files', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsFromVariousFiles() });
      });

      When('decoding with changedFiles filter for a directory path', () => {
        const codec = createPrChangesCodec({
          changedFiles: ['src/commands'],
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('patterns under that directory are included', () => {
        const text = getDocumentText(state!.document!);
        expect(text).toContain('Commands Pattern');
      });
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec filters patterns by releaseFilter
  // ===========================================================================

  Rule('PrChangesCodec filters patterns by releaseFilter', ({ RuleScenario }) => {
    RuleScenario('Patterns filtered by release version', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with different release deliverables', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createPatternsWithDifferentReleases(),
        });
      });

      When('decoding with releaseFilter {string}', (_ctx: unknown, release: string) => {
        const codec = createPrChangesCodec({ releaseFilter: release });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('only patterns with v0.2.0 deliverables are included', () => {
        const text = getDocumentText(state!.document!);
        expect(text).toContain('v0.2.0 Pattern');
        expect(text).not.toContain('v0.3.0 Pattern');
      });
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec uses OR logic for combined filters
  // ===========================================================================

  Rule('PrChangesCodec uses OR logic for combined filters', ({ RuleScenario }) => {
    RuleScenario(
      'Combined filters match patterns meeting either criterion',
      ({ Given, When, Then }) => {
        Given('a MasterDataset with patterns matching file or release', () => {
          state!.dataset = createTestMasterDataset({
            patterns: createPatternsMatchingFileOrRelease(),
          });
        });

        When('decoding with both changedFiles and releaseFilter', () => {
          const codec = createPrChangesCodec({
            changedFiles: ['src/commands/order.ts'],
            releaseFilter: 'v0.2.0',
          });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('patterns matching either filter are included', () => {
          const text = getDocumentText(state!.document!);
          expect(text).toContain('File Match Pattern');
          expect(text).toContain('Release Match Pattern');
        });
      }
    );

    RuleScenario('Patterns matching both criteria are not duplicated', ({ Given, When, Then }) => {
      Given('a MasterDataset with a pattern matching both file and release', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createPatternMatchingBothFileAndRelease(),
        });
      });

      When('decoding with both changedFiles and releaseFilter', () => {
        const codec = createPrChangesCodec({
          changedFiles: ['src/commands/order.ts'],
          releaseFilter: 'v0.2.0',
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the pattern appears only once', () => {
        const headings = findHeadings(state!.document!);
        const patternHeadings = headings.filter(
          (h) => h.level === 4 && h.text.includes('Both Match Pattern')
        );
        expect(patternHeadings.length).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Rule: PrChangesCodec only includes active and completed patterns
  // ===========================================================================

  Rule('PrChangesCodec only includes active and completed patterns', ({ RuleScenario }) => {
    RuleScenario('Roadmap patterns are excluded', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns of all statuses', () => {
        state!.dataset = createTestMasterDataset({ patterns: createPatternsOfAllStatuses() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('roadmap patterns are not included', () => {
        const text = getDocumentText(state!.document!);
        expect(text).toContain('Completed Pattern');
        expect(text).toContain('Active Pattern');
        expect(text).not.toContain('Roadmap Pattern');
      });
    });

    RuleScenario('Deferred patterns are excluded', ({ Given, When, Then }) => {
      Given('a MasterDataset with deferred patterns', () => {
        state!.dataset = createTestMasterDataset({ patterns: createDeferredPatterns() });
      });

      When('decoding with PrChangesCodec', () => {
        state!.document = PrChangesCodec.decode(state!.dataset!);
      });

      Then('deferred patterns are not included', () => {
        const text = getDocumentText(state!.document!);
        expect(text).toContain('Active Pattern');
        expect(text).not.toContain('Deferred Pattern');
      });
    });
  });
});
