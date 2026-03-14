/**
 * Implementation Links Step Definitions
 *
 * BDD step definitions for testing implementation link path normalization.
 * Tests that repository prefixes like "libar-platform/" are stripped from
 * implementation paths to generate correct relative links in pattern documents.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createPatternsCodec, normalizeImplPath } from '../../../src/renderable/codecs/patterns.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import type { RuntimeMasterDataset } from '../../../src/generators/pipeline/transform-types.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/pattern-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface ImplementationLinksState {
  dataset: RuntimeMasterDataset | null;
  document: RenderableDocument | null;
  patternDocument: RenderableDocument | null;
  filePath: string | null;
  normalizeResult: string | null;
  patterns: ExtractedPattern[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ImplementationLinksState | null = null;

function initState(): ImplementationLinksState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    patternDocument: null,
    filePath: null,
    normalizeResult: null,
    patterns: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build the dataset from patterns using transformToMasterDataset
 */
function buildDataset(): void {
  state!.dataset = transformToMasterDataset({
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

/**
 * Extract implementation links from the pattern detail document
 * Links are in format: [`filename`](../../path/to/file)
 */
function extractImplementationLinks(
  doc: RenderableDocument
): Array<{ text: string; path: string }> {
  const links: Array<{ text: string; path: string }> = [];

  // Find the Implementations section
  const sections = doc.sections;
  let inImplementationsSection = false;

  for (const section of sections) {
    if (section.type === 'heading' && section.text === 'Implementations') {
      inImplementationsSection = true;
      continue;
    }
    if (inImplementationsSection && section.type === 'heading') {
      // Exited Implementations section
      break;
    }
    if (inImplementationsSection && section.type === 'list') {
      // Extract links from list items
      for (const item of section.items) {
        const itemText = typeof item === 'string' ? item : item.text;
        // Match markdown links: [text](path)
        const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(itemText);
        if (linkMatch) {
          links.push({
            text: linkMatch[1] ?? '',
            path: linkMatch[2] ?? '',
          });
        }
      }
    }
  }

  return links;
}

// =============================================================================
// Feature: Implementation Link Path Normalization
// =============================================================================

const feature = await loadFeature('tests/features/behavior/implementation-links.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a patterns codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Repository prefixes are stripped from implementation paths
  // ===========================================================================

  Rule('Repository prefixes are stripped from implementation paths', ({ RuleScenario }) => {
    RuleScenario(
      'Strip libar-platform prefix from implementation paths',
      ({ Given, When, Then, And }) => {
        Given('a pattern with implementation:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const row = dataTable[0];
          const file = row?.file ?? '';
          const description = row?.description ?? '';

          // Create the target pattern that will have implementedBy
          const targetPattern = createTestPattern({
            name: 'TestPattern',
          });

          // Create an implementation pattern that implements TestPattern
          // The file path of this pattern becomes the implementedBy.file
          const implPattern = createTestPattern({
            name: 'ImplementationPattern',
            filePath: file,
            description,
            implementsPatterns: ['TestPattern'],
          });

          state!.patterns = [targetPattern, implPattern];
        });

        When('the pattern detail document is generated', () => {
          buildDataset();
          const codec = createPatternsCodec({ generateDetailFiles: true });
          state!.document = codec.decode(state!.dataset!);
          // Get TestPattern's detail document
          const files = state!.document.additionalFiles;
          if (files) {
            state!.patternDocument = files['patterns/test-pattern.md'];
          }
        });

        Then('the implementation link path is {string}', (_ctx: unknown, expectedPath: string) => {
          expect(state!.patternDocument).toBeDefined();
          const links = extractImplementationLinks(state!.patternDocument!);
          expect(links.length).toBeGreaterThan(0);
          expect(links[0]?.path).toBe(expectedPath);
        });

        And('the link text is {string}', (_ctx: unknown, expectedText: string) => {
          const links = extractImplementationLinks(state!.patternDocument!);
          expect(links[0]?.text).toBe(expectedText);
        });
      }
    );

    RuleScenario('Strip monorepo prefix from implementation paths', ({ Given, When, Then }) => {
      Given('a pattern with implementation:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const row = dataTable[0];
        const file = row?.file ?? '';
        const description = row?.description ?? '';

        const targetPattern = createTestPattern({
          name: 'TestPattern',
        });

        const implPattern = createTestPattern({
          name: 'ImplementationPattern',
          filePath: file,
          description,
          implementsPatterns: ['TestPattern'],
        });

        state!.patterns = [targetPattern, implPattern];
      });

      When('the pattern detail document is generated', () => {
        buildDataset();
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          state!.patternDocument = files['patterns/test-pattern.md'];
        }
      });

      Then('the implementation link path is {string}', (_ctx: unknown, expectedPath: string) => {
        expect(state!.patternDocument).toBeDefined();
        const links = extractImplementationLinks(state!.patternDocument!);
        expect(links.length).toBeGreaterThan(0);
        expect(links[0]?.path).toBe(expectedPath);
      });
    });

    RuleScenario('Preserve paths without repository prefix', ({ Given, When, Then }) => {
      Given('a pattern with implementation:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const row = dataTable[0];
        const file = row?.file ?? '';
        const description = row?.description ?? '';

        const targetPattern = createTestPattern({
          name: 'TestPattern',
        });

        const implPattern = createTestPattern({
          name: 'ImplementationPattern',
          filePath: file,
          description,
          implementsPatterns: ['TestPattern'],
        });

        state!.patterns = [targetPattern, implPattern];
      });

      When('the pattern detail document is generated', () => {
        buildDataset();
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          state!.patternDocument = files['patterns/test-pattern.md'];
        }
      });

      Then('the implementation link path is {string}', (_ctx: unknown, expectedPath: string) => {
        expect(state!.patternDocument).toBeDefined();
        const links = extractImplementationLinks(state!.patternDocument!);
        expect(links.length).toBeGreaterThan(0);
        expect(links[0]?.path).toBe(expectedPath);
      });
    });
  });

  // ===========================================================================
  // Rule 2: All implementation links in a pattern are normalized
  // ===========================================================================

  Rule('All implementation links in a pattern are normalized', ({ RuleScenario }) => {
    RuleScenario('Multiple implementations with mixed prefixes', ({ Given, When, Then }) => {
      Given('a pattern with implementations:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        // Create the target pattern
        const targetPattern = createTestPattern({
          name: 'TestPattern',
        });

        // Create implementation patterns for each row
        const implPatterns = dataTable.map((row, idx) =>
          createTestPattern({
            name: `ImplementationPattern${idx + 1}`,
            filePath: row.file ?? '',
            description: row.description ?? '',
            implementsPatterns: ['TestPattern'],
          })
        );

        state!.patterns = [targetPattern, ...implPatterns];
      });

      When('the pattern detail document is generated', () => {
        buildDataset();
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          state!.patternDocument = files['patterns/test-pattern.md'];
        }
      });

      Then('the implementation links should be:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        expect(state!.patternDocument).toBeDefined();
        const links = extractImplementationLinks(state!.patternDocument!);

        for (const row of dataTable) {
          const index = parseInt(row.index ?? '0', 10);
          const expectedPath = row.path ?? '';
          expect(links.length).toBeGreaterThanOrEqual(index);
          expect(links[index - 1]?.path, `Link ${index} path should be ${expectedPath}`).toBe(
            expectedPath
          );
        }
      });
    });
  });

  // ===========================================================================
  // Rule 3: normalizeImplPath helper function
  // ===========================================================================

  Rule('normalizeImplPath strips known prefixes', ({ RuleScenario }) => {
    RuleScenario('Strips libar-platform/ prefix', ({ Given, When, Then }) => {
      Given('file path {string}', (_ctx: unknown, path: string) => {
        state!.filePath = path;
      });

      When('normalizeImplPath is called', () => {
        state!.normalizeResult = normalizeImplPath(state!.filePath!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.normalizeResult).toBe(expected);
      });
    });

    RuleScenario('Strips monorepo/ prefix', ({ Given, When, Then }) => {
      Given('file path {string}', (_ctx: unknown, path: string) => {
        state!.filePath = path;
      });

      When('normalizeImplPath is called', () => {
        state!.normalizeResult = normalizeImplPath(state!.filePath!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.normalizeResult).toBe(expected);
      });
    });

    RuleScenario('Returns unchanged path without known prefix', ({ Given, When, Then }) => {
      Given('file path {string}', (_ctx: unknown, path: string) => {
        state!.filePath = path;
      });

      When('normalizeImplPath is called', () => {
        state!.normalizeResult = normalizeImplPath(state!.filePath!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.normalizeResult).toBe(expected);
      });
    });

    RuleScenario('Only strips prefix at start of path', ({ Given, When, Then }) => {
      Given('file path {string}', (_ctx: unknown, path: string) => {
        state!.filePath = path;
      });

      When('normalizeImplPath is called', () => {
        state!.normalizeResult = normalizeImplPath(state!.filePath!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.normalizeResult).toBe(expected);
      });
    });
  });
});
