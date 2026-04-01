/**
 * PR Changes Options Step Definitions
 *
 * BDD step definitions for testing the PrChangesCodec filtering capabilities.
 * Tests file-based filtering, release filtering, and combined OR logic.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { generateDocument } from '../../../src/renderable/generate.js';
import { transformToPatternGraph } from '../../../src/generators/pipeline/transform-dataset.js';
import {
  createTestPattern,
  resetPatternCounter,
  createDefaultTagRegistry,
} from '../../fixtures/dataset-factories.js';
import type { CodecOptions } from '../../../src/renderable/generate.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { RuntimePatternGraph } from '../../../src/generators/pipeline/transform-types.js';
import type { OutputFile } from '../../../src/renderable/render.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface PrChangesOptionsState {
  patterns: ExtractedPattern[];
  dataset: RuntimePatternGraph | null;
  outputFiles: OutputFile[];
  markdown: string;
  codecOptions: CodecOptions;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PrChangesOptionsState | null = null;

function initState(): PrChangesOptionsState {
  resetPatternCounter();
  return {
    patterns: [],
    dataset: null,
    outputFiles: [],
    markdown: '',
    codecOptions: {},
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build PatternGraph from current patterns
 */
function buildDataset(): RuntimePatternGraph {
  return transformToPatternGraph({
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

/**
 * Extract pattern names from markdown output.
 * Pattern names appear as h4 headers with status emoji prefix.
 */
function extractPatternNamesFromMarkdown(markdown: string): string[] {
  // Pattern names appear as "#### <emoji> PatternName" in the markdown
  const h4Regex = /^####\s+[^\s]+\s+(.+)$/gm;
  const names: string[] = [];
  let match;

  while ((match = h4Regex.exec(markdown)) !== null) {
    names.push(match[1].trim());
  }

  return names;
}

// =============================================================================
// Feature: PR Changes Options
// =============================================================================

const feature = await loadFeature('tests/features/generators/pr-changes-options.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a PR changes options test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Orchestrator supports PR changes generation options
  // ===========================================================================

  Rule('Orchestrator supports PR changes generation options', ({ RuleScenario }) => {
    // -------------------------------------------------------------------------
    // Scenario: PR changes filters to explicit file list (happy path)
    // -------------------------------------------------------------------------
    RuleScenario('PR changes filters to explicit file list', ({ Given, And, When, Then }) => {
      Given('patterns from multiple files:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.patterns.push(
            createTestPattern({
              name: row.name,
              status: row.status as 'roadmap' | 'active' | 'completed' | 'deferred',
              filePath: row.filePath,
              category: 'core',
            })
          );
        }
      });

      And('changedFiles lists specific files:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const changedFiles = dataTable.map((row) => row.file);
        state!.codecOptions = {
          'pr-changes': {
            changedFiles,
            includeDeliverables: true,
            includeReviewChecklist: false,
          },
        };
      });

      When('generating pr-changes document', () => {
        state!.dataset = buildDataset();
        state!.outputFiles = generateDocument('pr-changes', state!.dataset, state!.codecOptions);
        state!.markdown = state!.outputFiles[0]?.content ?? '';
      });

      Then(
        'only patterns from the changed files are included:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const expectedNames = dataTable.map((row) => row.name);
          const actualNames = extractPatternNamesFromMarkdown(state!.markdown);

          expect(actualNames).toHaveLength(expectedNames.length);
          for (const name of expectedNames) {
            expect(actualNames).toContain(name);
          }
        }
      );
    });

    // -------------------------------------------------------------------------
    // Scenario: PR changes filters by release version (happy path)
    // -------------------------------------------------------------------------
    RuleScenario('PR changes filters by release version', ({ Given, And, When, Then }) => {
      Given(
        'patterns with deliverables tagged with different releases:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            const patternName = String(row.name);
            const safeName = patternName.toLowerCase().replace(/\s+/g, '-');
            const patternStatus = row.status as 'roadmap' | 'active' | 'completed' | 'deferred';
            const releaseTag = row.release;
            state!.patterns.push(
              createTestPattern({
                name: patternName,
                status: patternStatus,
                filePath: `src/${safeName}.ts`,
                category: 'core',
                deliverables: [
                  {
                    name: `${patternName} Feature`,
                    status: patternStatus === 'completed' ? 'complete' : 'in-progress',
                    tests: 1,
                    location: `src/${safeName}/`,
                    release: releaseTag,
                  },
                ],
              })
            );
          }
        }
      );

      And('releaseFilter is {string}', (_ctx: unknown, releaseFilter: string) => {
        state!.codecOptions = {
          'pr-changes': {
            releaseFilter,
            includeDeliverables: true,
            includeReviewChecklist: false,
          },
        };
      });

      When('generating pr-changes document', () => {
        state!.dataset = buildDataset();
        state!.outputFiles = generateDocument('pr-changes', state!.dataset, state!.codecOptions);
        state!.markdown = state!.outputFiles[0]?.content ?? '';
      });

      Then(
        'only release filtered patterns are included:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const expectedNames = dataTable.map((row) => row.name);
          const actualNames = extractPatternNamesFromMarkdown(state!.markdown);

          expect(actualNames).toHaveLength(expectedNames.length);
          for (const name of expectedNames) {
            expect(actualNames).toContain(name);
          }
        }
      );
    });

    // -------------------------------------------------------------------------
    // Scenario: Combined filters use OR logic (happy path)
    // -------------------------------------------------------------------------
    RuleScenario('Combined filters use OR logic', ({ Given, And, When, Then }) => {
      Given(
        'patterns with various files and releases:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            const patternName = String(row.name);
            const safeName = patternName.toLowerCase().replace(/\s+/g, '-');
            const patternStatus = row.status as 'roadmap' | 'active' | 'completed' | 'deferred';
            const patternFilePath = row.filePath;
            const releaseTag = row.release;
            state!.patterns.push(
              createTestPattern({
                name: patternName,
                status: patternStatus,
                filePath: patternFilePath,
                category: 'core',
                deliverables: [
                  {
                    name: `${patternName} Feature`,
                    status: patternStatus === 'completed' ? 'complete' : 'in-progress',
                    tests: 1,
                    location: `src/${safeName}/`,
                    release: releaseTag,
                  },
                ],
              })
            );
          }
        }
      );

      And('changedFiles includes some files:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const changedFiles = dataTable.map((row) => row.file);
        // Initialize codecOptions with just changedFiles - releaseFilter added in next step
        state!.codecOptions = {
          'pr-changes': {
            changedFiles,
            includeDeliverables: true,
            includeReviewChecklist: false,
          },
        };
      });

      And('releaseFilter is set to {string}', (_ctx: unknown, releaseFilter: string) => {
        // Add releaseFilter to existing codecOptions
        state!.codecOptions = {
          'pr-changes': {
            ...state!.codecOptions['pr-changes'],
            releaseFilter,
          },
        };
      });

      When('generating pr-changes document', () => {
        state!.dataset = buildDataset();
        state!.outputFiles = generateDocument('pr-changes', state!.dataset, state!.codecOptions);
        state!.markdown = state!.outputFiles[0]?.content ?? '';
      });

      Then(
        'patterns matching EITHER file OR release are included:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const expectedNames = dataTable.map((row) => row.name);
          const actualNames = extractPatternNamesFromMarkdown(state!.markdown);

          expect(actualNames).toHaveLength(expectedNames.length);
          for (const name of expectedNames) {
            expect(actualNames).toContain(name);
          }
        }
      );
    });
  });
});
