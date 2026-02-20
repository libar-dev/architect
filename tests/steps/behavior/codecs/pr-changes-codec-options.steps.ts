/**
 * PR Changes Codec - Options and Filters Step Definitions
 *
 * BDD step definitions for testing the PrChangesCodec options and filters:
 * - Review checklist generation
 * - Dependencies section
 * - changedFiles filter
 * - releaseFilter
 * - OR logic for combined filters
 * - Status filtering (active/completed only)
 *
 * @libar-docs
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
  findReviewChecklistSection,
  findDependenciesSection,
  documentContainsSection,
  getDocumentText,
  findHeadings,
  createActivePatterns,
  createPrRelevantPatterns,
  createPatternsWithDeliverables,
  createPatternsWithDependencies,
  createPatternsWithoutDependencies,
  createPatternsWithDependsOn,
  createPatternsWithEnables,
  createPatternsFromVariousFiles,
  createPatternsWithDifferentReleases,
  createPatternsMatchingFileOrRelease,
  createPatternMatchingBothFileAndRelease,
  createPatternsOfAllStatuses,
  createDeferredPatterns,
  createCompletedPatterns,
  createTestMasterDataset,
} from '../../../support/helpers/pr-changes-codec-state.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PrChangesCodecState | null = null;

// =============================================================================
// Feature: PR Changes Codec - Options and Filters
// =============================================================================

const feature = await loadFeature(
  'tests/features/behavior/codecs/pr-changes-codec-options.feature'
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
