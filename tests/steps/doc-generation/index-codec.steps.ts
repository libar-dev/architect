/**
 * Step definitions for Index Codec behavior tests
 *
 * Regression tests that capture the current behavior of the IndexCodec
 * before any refactoring begins. These tests are a safety net — they
 * verify the codec's output against golden behavior, not against
 * a specification of desired future behavior.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createIndexCodec,
  type IndexCodecOptions,
  type DocumentEntry,
} from '../../../src/renderable/codecs/index-codec.js';
import type { RenderableDocument, SectionBlock } from '../../../src/renderable/schema.js';
import { heading, paragraph } from '../../../src/renderable/schema.js';
import { createTestMasterDataset } from '../../fixtures/dataset-factories.js';
import { createTestPattern } from '../../fixtures/pattern-factories.js';
import type { MasterDataset } from '../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/doc-generation/index-codec.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  // Input
  options: Partial<IndexCodecOptions>;
  dataset: MasterDataset | null;
  documentEntries: DocumentEntry[];

  // Output
  document: RenderableDocument | null;
}

let state: TestState;

function resetState(): void {
  state = {
    options: {},
    dataset: null,
    documentEntries: [],
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find a section block by heading text (level 2 headings only for main sections)
 */
function findSectionByHeading(
  sections: SectionBlock[],
  headingText: string,
  level = 2
): SectionBlock | undefined {
  for (const block of sections) {
    if (block.type === 'heading' && block.level === level && block.text.includes(headingText)) {
      return block;
    }
  }
  return undefined;
}

/**
 * Get all blocks between a heading and the next heading of same or higher level
 */
function getSectionContent(sections: SectionBlock[], headingText: string): SectionBlock[] {
  const result: SectionBlock[] = [];
  let inSection = false;
  let sectionLevel = 0;

  for (const block of sections) {
    if (block.type === 'heading') {
      if (block.text.includes(headingText)) {
        inSection = true;
        sectionLevel = block.level;
        result.push(block);
        continue;
      }
      if (inSection && block.level <= sectionLevel) {
        break;
      }
    }
    if (inSection) {
      result.push(block);
    }
  }
  return result;
}

/**
 * Find a table block within sections
 */
function findTable(sections: SectionBlock[]): SectionBlock | undefined {
  return sections.find((b) => b.type === 'table');
}

/**
 * Find a code block within sections
 */
function findCodeBlock(sections: SectionBlock[]): SectionBlock | undefined {
  return sections.find((b) => b.type === 'code');
}

/**
 * Get the index of the first heading matching a text within sections
 */
function headingIndex(sections: SectionBlock[], headingText: string): number {
  return sections.findIndex((b) => b.type === 'heading' && b.text.includes(headingText));
}

/**
 * Check whether a separator appears after the first occurrence of a heading
 */
function separatorAfterHeading(sections: SectionBlock[], headingText: string): boolean {
  const idx = headingIndex(sections, headingText);
  if (idx < 0) return false;

  // Walk forward from heading until we hit a separator or another H2 heading
  for (let i = idx + 1; i < sections.length; i++) {
    const block = sections[i];
    if (!block) continue;
    if (block.type === 'separator') return true;
    if (block.type === 'heading' && block.level <= 2) break;
  }
  return false;
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the index codec is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Document Metadata
  // ===========================================================================

  Rule('Document metadata is correctly set', ({ RuleScenario }) => {
    RuleScenario('Document title is Documentation Index', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('document title should be {string}', (_ctx: unknown, expectedTitle: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.title).toBe(expectedTitle);
      });
    });

    RuleScenario('Document purpose references @libar-dev/architect', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('document purpose should contain {string}', (_ctx: unknown, expectedText: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.purpose?.toLowerCase()).toContain(expectedText.toLowerCase());
      });
    });

    RuleScenario('Default options produce all sections', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'all expected default sections should exist:',
        (_ctx: unknown, table: Array<{ heading: string }>) => {
          expect(state.document).not.toBeNull();
          for (const row of table) {
            const section = findSectionByHeading(state.document!.sections, row.heading);
            expect(section, `Expected section "${row.heading}" to exist`).toBeDefined();
          }
        }
      );
    });
  });

  // ===========================================================================
  // RULE 2: Package Metadata Section
  // ===========================================================================

  Rule('Package metadata section renders correctly', ({ RuleScenario }) => {
    RuleScenario('Package name shows @libar-dev/architect', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock).toBeDefined();
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('Purpose shows context engineering platform description', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('License shows MIT', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('Pattern counts reflect dataset', ({ When, Then }) => {
      When('decoding with a dataset containing 3 completed and 2 active patterns', () => {
        state.dataset = createTestMasterDataset({
          statusDistribution: { completed: 3, active: 2 },
        });
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('Product area count reflects dataset', ({ When, Then }) => {
      When('decoding with a dataset containing patterns in 2 product areas', () => {
        const patterns = [
          createTestPattern({ name: 'PatternA', productArea: 'Generation', status: 'completed' }),
          createTestPattern({ name: 'PatternB', productArea: 'Analysis', status: 'completed' }),
        ];
        state.dataset = createTestMasterDataset({ patterns });
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Package Metadata table product areas row should show {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            // The Product Areas row is: ['**Product Areas**', '<count>']
            const productAreasRow = tableBlock.rows.find((row) =>
              row.some((cell) => cell.includes('Product Areas'))
            );
            expect(productAreasRow).toBeDefined();
            expect(productAreasRow?.join('')).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('Package metadata section can be disabled', ({ When, Then }) => {
      When('decoding with includePackageMetadata disabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ includePackageMetadata: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });
  });

  // ===========================================================================
  // RULE 3: Document Inventory Section
  // ===========================================================================

  Rule('Document inventory groups entries by topic', ({ RuleScenario }) => {
    RuleScenario('Empty entries produces no inventory section', ({ When, Then }) => {
      When('decoding with no document entries', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ documentEntries: [] });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });

    RuleScenario('Entries grouped by topic produce per-topic tables', ({ When, Then, And }) => {
      When('decoding with document entries in topic {string}', (_ctx: unknown, topic: string) => {
        state.documentEntries = [
          {
            title: 'Architecture Guide',
            path: 'docs/arch.md',
            description: 'Architecture overview',
            audience: 'Developers',
            topic,
          },
        ];
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ documentEntries: state.documentEntries });
        state.document = codec.decode(state.dataset);
      });

      Then('a section with heading {string} should exist', (_ctx: unknown, headingText: string) => {
        expect(state.document).not.toBeNull();
        const section = findSectionByHeading(state.document!.sections, headingText);
        expect(section).toBeDefined();
      });

      And(
        'a subsection with heading {string} should exist',
        (_ctx: unknown, subsectionText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, subsectionText, 3);
          expect(section).toBeDefined();
        }
      );
    });

    RuleScenario('Inventory section can be disabled', ({ When, Then }) => {
      When('decoding with includeDocumentInventory disabled and document entries provided', () => {
        state.documentEntries = [
          {
            title: 'Some Doc',
            path: 'docs/some.md',
            description: 'Some description',
            audience: 'All',
            topic: 'Reference',
          },
        ];
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({
          includeDocumentInventory: false,
          documentEntries: state.documentEntries,
        });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });
  });

  // ===========================================================================
  // RULE 4: Product Area Statistics Section
  // ===========================================================================

  Rule('Product area statistics are computed from dataset', ({ RuleScenario }) => {
    RuleScenario('Product area table includes all areas alphabetically', ({ When, Then }) => {
      When(
        'decoding with a dataset containing patterns in product areas {string} and {string}',
        (_ctx: unknown, area1: string, area2: string) => {
          const patterns = [
            createTestPattern({ name: 'PatternA', productArea: area1, status: 'completed' }),
            createTestPattern({ name: 'PatternB', productArea: area2, status: 'completed' }),
          ];
          state.dataset = createTestMasterDataset({ patterns });
          const codec = createIndexCodec();
          state.document = codec.decode(state.dataset);
        }
      );

      Then(
        'the Product Area Statistics table should list {string} before {string}',
        (_ctx: unknown, firstArea: string, secondArea: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Product Area Statistics');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const firstIdx = tableBlock.rows.findIndex((row) =>
              row.some((cell) => cell.includes(firstArea))
            );
            const secondIdx = tableBlock.rows.findIndex((row) =>
              row.some((cell) => cell.includes(secondArea))
            );
            expect(firstIdx).toBeGreaterThanOrEqual(0);
            expect(secondIdx).toBeGreaterThanOrEqual(0);
            expect(firstIdx).toBeLessThan(secondIdx);
          }
        }
      );
    });

    RuleScenario('Total row aggregates all areas', ({ When, Then }) => {
      When('decoding with a dataset containing patterns in 2 product areas', () => {
        const patterns = [
          createTestPattern({ name: 'PatternA', productArea: 'Generation', status: 'completed' }),
          createTestPattern({ name: 'PatternB', productArea: 'Analysis', status: 'completed' }),
        ];
        state.dataset = createTestMasterDataset({ patterns });
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Product Area Statistics table should have a Total row', () => {
        expect(state.document).not.toBeNull();
        const content = getSectionContent(state.document!.sections, 'Product Area Statistics');
        const tableBlock = findTable(content);
        expect(tableBlock?.type).toBe('table');
        if (tableBlock?.type === 'table') {
          const totalRow = tableBlock.rows.find((row) =>
            row.some((cell) => cell.includes('Total'))
          );
          expect(totalRow).toBeDefined();
        }
      });
    });

    RuleScenario('Progress bar and percentage are computed', ({ When, Then }) => {
      When('decoding with a dataset containing 4 completed patterns in one product area', () => {
        const patterns = [
          createTestPattern({ name: 'P1', productArea: 'Generation', status: 'completed' }),
          createTestPattern({ name: 'P2', productArea: 'Generation', status: 'completed' }),
          createTestPattern({ name: 'P3', productArea: 'Generation', status: 'completed' }),
          createTestPattern({ name: 'P4', productArea: 'Generation', status: 'completed' }),
        ];
        state.dataset = createTestMasterDataset({ patterns });
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Product Area Statistics table should contain a progress bar', () => {
        expect(state.document).not.toBeNull();
        const content = getSectionContent(state.document!.sections, 'Product Area Statistics');
        const tableBlock = findTable(content);
        expect(tableBlock?.type).toBe('table');
        if (tableBlock?.type === 'table') {
          // Progress bar uses █ character
          const tableContent = JSON.stringify(tableBlock.rows);
          expect(tableContent).toContain('%');
        }
      });
    });

    RuleScenario('Product area stats can be disabled', ({ When, Then }) => {
      When('decoding with includeProductAreaStats disabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ includeProductAreaStats: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });
  });

  // ===========================================================================
  // RULE 5: Phase Progress Section
  // ===========================================================================

  Rule('Phase progress summarizes pattern status', ({ RuleScenario }) => {
    RuleScenario('Phase progress shows total counts', ({ When, Then }) => {
      When('decoding with a dataset containing 3 completed and 2 active patterns', () => {
        state.dataset = createTestMasterDataset({
          statusDistribution: { completed: 3, active: 2 },
        });
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Phase Progress section should contain a paragraph with pattern counts', () => {
        expect(state.document).not.toBeNull();
        const content = getSectionContent(state.document!.sections, 'Phase Progress');
        const paragraphBlock = content.find((b) => b.type === 'paragraph');
        expect(paragraphBlock).toBeDefined();
        if (paragraphBlock?.type === 'paragraph') {
          // Should mention total count (5 patterns)
          expect(paragraphBlock.text).toContain('5');
        }
      });
    });

    RuleScenario('Status distribution table shows completed/active/planned', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Phase Progress section should have a table with columns {string}, {string}, {string}',
        (_ctx: unknown, col1: string, col2: string, col3: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Phase Progress');
          const tableBlock = findTable(content);
          expect(tableBlock).toBeDefined();
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            expect(tableBlock.columns).toContain(col1);
            expect(tableBlock.columns).toContain(col2);
            expect(tableBlock.columns).toContain(col3);
          }
        }
      );
    });

    RuleScenario('Per-phase breakdown appears when phases exist', ({ When, Then }) => {
      When('decoding with a dataset containing patterns with phase numbers', () => {
        const patterns = [
          createTestPattern({ name: 'PhasePattern1', phase: 1, status: 'completed' }),
          createTestPattern({ name: 'PhasePattern2', phase: 2, status: 'active' }),
        ];
        state.dataset = createTestMasterDataset({ patterns });
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Phase Progress section should have a "By Phase" sub-section', () => {
        expect(state.document).not.toBeNull();
        const content = getSectionContent(state.document!.sections, 'Phase Progress');
        const byPhaseHeading = content.find(
          (b) => b.type === 'heading' && b.text.includes('By Phase')
        );
        expect(byPhaseHeading).toBeDefined();
      });
    });

    RuleScenario('Phase progress can be disabled', ({ When, Then }) => {
      When('decoding with includePhaseProgress disabled', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ includePhaseProgress: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });
  });

  // ===========================================================================
  // RULE 6: Regeneration Footer
  // ===========================================================================

  Rule('Regeneration footer contains commands', ({ RuleScenario }) => {
    RuleScenario('Regeneration section has heading "Regeneration"', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('a section with heading {string} should exist', (_ctx: unknown, headingText: string) => {
        expect(state.document).not.toBeNull();
        const section = findSectionByHeading(state.document!.sections, headingText);
        expect(section).toBeDefined();
      });
    });

    RuleScenario('Code blocks contain pnpm commands', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Regeneration section should contain a code block with {string}',
        (_ctx: unknown, expectedCommand: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Regeneration');
          const codeBlock = findCodeBlock(content);
          expect(codeBlock).toBeDefined();
          expect(codeBlock?.type).toBe('code');
          if (codeBlock?.type === 'code') {
            expect(codeBlock.content).toContain(expectedCommand);
          }
        }
      );
    });
  });

  // ===========================================================================
  // RULE 7: Section Ordering
  // ===========================================================================

  Rule('Section ordering follows layout contract', ({ RuleScenario }) => {
    RuleScenario(
      'Default layout order is metadata, stats, progress, regeneration',
      ({ When, Then }) => {
        When('decoding with default options', () => {
          state.dataset = createTestMasterDataset();
          const codec = createIndexCodec();
          state.document = codec.decode(state.dataset);
        });

        Then(
          'section ordering should be correct:',
          (_ctx: unknown, table: Array<{ first: string; second: string }>) => {
            expect(state.document).not.toBeNull();
            const sections = state.document!.sections;
            for (const row of table) {
              const firstIdx = headingIndex(sections, row.first);
              const secondIdx = headingIndex(sections, row.second);
              expect(firstIdx, `Expected to find heading "${row.first}"`).toBeGreaterThanOrEqual(0);
              expect(secondIdx, `Expected to find heading "${row.second}"`).toBeGreaterThanOrEqual(
                0
              );
              expect(firstIdx, `Expected "${row.first}" before "${row.second}"`).toBeLessThan(
                secondIdx
              );
            }
          }
        );
      }
    );

    RuleScenario('Preamble appears after metadata and before inventory', ({ When, Then }) => {
      When(
        'decoding with a preamble section and document entries in topic {string}',
        (_ctx: unknown, topic: string) => {
          state.documentEntries = [
            {
              title: 'Guide',
              path: 'docs/guide.md',
              description: 'A guide',
              audience: 'Developers',
              topic,
            },
          ];
          state.dataset = createTestMasterDataset();
          const preambleSection = paragraph('This is the editorial preamble.');
          const codec = createIndexCodec({
            preamble: [preambleSection],
            documentEntries: state.documentEntries,
          });
          state.document = codec.decode(state.dataset);
        }
      );

      Then(
        'section ordering should be correct:',
        (_ctx: unknown, table: Array<{ first: string; second: string }>) => {
          expect(state.document).not.toBeNull();
          const sections = state.document!.sections;
          for (const row of table) {
            const firstIdx = headingIndex(sections, row.first);
            const secondIdx = headingIndex(sections, row.second);
            expect(firstIdx, `Expected to find heading "${row.first}"`).toBeGreaterThanOrEqual(0);
            expect(secondIdx, `Expected to find heading "${row.second}"`).toBeGreaterThanOrEqual(0);
            expect(firstIdx, `Expected "${row.first}" before "${row.second}"`).toBeLessThan(
              secondIdx
            );
          }
        }
      );
    });

    RuleScenario('Separators appear between sections', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec();
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a separator should appear after the {string} heading',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const hasSeparator = separatorAfterHeading(state.document!.sections, headingText);
          expect(hasSeparator).toBe(true);
        }
      );
    });
  });

  // ===========================================================================
  // RULE 8: Custom Purpose Text
  // ===========================================================================

  Rule('Custom purpose text overrides default', ({ RuleScenario }) => {
    RuleScenario('purposeText replaces auto-generated purpose', ({ When, Then }) => {
      When('decoding with purposeText {string}', (_ctx: unknown, purposeText: string) => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ purposeText });
        state.document = codec.decode(state.dataset);
      });

      Then('document purpose should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.purpose).toBe(expected);
      });
    });

    RuleScenario('Empty purposeText uses auto-generated purpose', ({ When, Then }) => {
      When('decoding with empty purposeText', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ purposeText: '' });
        state.document = codec.decode(state.dataset);
      });

      Then('document purpose should contain {string}', (_ctx: unknown, expectedText: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.purpose).toContain(expectedText);
      });
    });
  });

  // ===========================================================================
  // RULE 9: Epilogue Replaces Regeneration Footer
  // ===========================================================================

  Rule('Epilogue replaces regeneration footer', ({ RuleScenario }) => {
    RuleScenario('Epilogue replaces built-in footer', ({ When, Then, And }) => {
      When('decoding with epilogue sections', () => {
        state.dataset = createTestMasterDataset();
        const epilogueSections = [
          heading(2, 'Custom Footer'),
          paragraph('This is a custom footer replacing regeneration.'),
        ];
        const codec = createIndexCodec({ epilogue: epilogueSections });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );

      And('the epilogue heading should be present', () => {
        expect(state.document).not.toBeNull();
        const section = findSectionByHeading(state.document!.sections, 'Custom Footer');
        expect(section).toBeDefined();
      });
    });

    RuleScenario('Empty epilogue preserves regeneration footer', ({ When, Then }) => {
      When('decoding with empty epilogue', () => {
        state.dataset = createTestMasterDataset();
        const codec = createIndexCodec({ epilogue: [] });
        state.document = codec.decode(state.dataset);
      });

      Then('a section with heading {string} should exist', (_ctx: unknown, headingText: string) => {
        expect(state.document).not.toBeNull();
        const section = findSectionByHeading(state.document!.sections, headingText);
        expect(section).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // RULE 10: Package Metadata Overrides
  // ===========================================================================

  Rule('Package metadata overrides work', ({ RuleScenario }) => {
    RuleScenario('Name override replaces package name', ({ When, Then }) => {
      When(
        'decoding with packageMetadataOverrides name {string}',
        (_ctx: unknown, name: string) => {
          state.dataset = createTestMasterDataset();
          const codec = createIndexCodec({
            packageMetadataOverrides: { name },
          });
          state.document = codec.decode(state.dataset);
        }
      );

      Then(
        'the Package Metadata table should show {string} as the package name',
        (_ctx: unknown, expectedName: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const packageRow = tableBlock.rows.find((row) =>
              row.some((cell) => cell.includes('Package'))
            );
            expect(packageRow).toBeDefined();
            expect(packageRow?.join('')).toContain(expectedName);
          }
        }
      );
    });

    RuleScenario('Purpose override replaces purpose', ({ When, Then }) => {
      When(
        'decoding with packageMetadataOverrides purpose {string}',
        (_ctx: unknown, purpose: string) => {
          state.dataset = createTestMasterDataset();
          const codec = createIndexCodec({
            packageMetadataOverrides: { purpose },
          });
          state.document = codec.decode(state.dataset);
        }
      );

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('License override replaces license', ({ When, Then }) => {
      When(
        'decoding with packageMetadataOverrides license {string}',
        (_ctx: unknown, license: string) => {
          state.dataset = createTestMasterDataset();
          const codec = createIndexCodec({
            packageMetadataOverrides: { license },
          });
          state.document = codec.decode(state.dataset);
        }
      );

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });

    RuleScenario('Unset overrides fall through to defaults', ({ When, Then }) => {
      When(
        'decoding with packageMetadataOverrides name {string}',
        (_ctx: unknown, name: string) => {
          state.dataset = createTestMasterDataset();
          const codec = createIndexCodec({
            packageMetadataOverrides: { name },
          });
          state.document = codec.decode(state.dataset);
        }
      );

      Then(
        'the Package Metadata table should contain {string}',
        (_ctx: unknown, expectedText: string) => {
          expect(state.document).not.toBeNull();
          const content = getSectionContent(state.document!.sections, 'Package Metadata');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            const tableContent = JSON.stringify(tableBlock.rows);
            expect(tableContent).toContain(expectedText);
          }
        }
      );
    });
  });
});
