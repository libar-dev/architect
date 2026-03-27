/**
 * PR Changes Codec - Core Rendering Step Definitions
 *
 * BDD step definitions for testing the PrChangesCodec core rendering:
 * - Empty results and no-changes states
 * - Summary section with filter information
 * - Phase and priority grouping
 * - Flat list (workflow sort)
 * - Pattern detail rendering (metadata, description)
 * - Deliverables rendering
 * - Acceptance criteria and business rules
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createPrChangesCodec,
  PrChangesCodec,
} from '../../../../src/renderable/codecs/pr-changes.js';
import type { PrChangesCodecState } from '../../../support/helpers/pr-changes-codec-state.js';
import {
  initPrChangesState,
  findSummaryTable,
  findNoChangesSection,
  documentContainsSection,
  getDocumentText,
  findHeadings,
  findTableWithHeader,
  findLists,
  createActivePatterns,
  createPrRelevantPatterns,
  createPatternsWithDeliverables,
  createPatternsWithMixedReleaseDeliverables,
  createPatternsInMultiplePhases,
  createPatternsWithPriorities,
  createDetailedPattern,
  createPatternWithBusinessValue,
  createPatternsWithScenarios,
  createPatternsWithBusinessRules,
  createTestMasterDataset,
} from '../../../support/helpers/pr-changes-codec-state.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PrChangesCodecState | null = null;

// =============================================================================
// Feature: PR Changes Codec - Core Rendering
// =============================================================================

const feature = await loadFeature(
  'tests/features/behavior/codecs/pr-changes-codec-rendering.feature'
);

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a PR changes codec test context', () => {
      state = initPrChangesState();
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
});
