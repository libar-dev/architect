/**
 * Patterns Codec Step Definitions
 *
 * BDD step definitions for testing the PatternsDocumentCodec.
 * Tests document structure, sections, options, and detail file generation.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createPatternsCodec,
  PatternsDocumentCodec,
} from '../../../src/renderable/codecs/patterns.js';
import type { RenderableDocument, TableBlock } from '../../../src/renderable/schema.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import {
  createTestPatternGraph,
  createPatternGraphWithStatus,
  createPatternGraphWithCategories,
  createPatternGraphWithRelationships,
  createTestPattern,
  resetPatternCounter,
} from '../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findTableWithHeader,
  findMermaidBlocks,
  isHeading,
  isTable,
  isParagraph,
  isList,
} from '../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface PatternsCodecState {
  dataset: PatternGraph | null;
  document: RenderableDocument | null;
  markdown: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PatternsCodecState | null = null;

function initState(): PatternsCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    markdown: '',
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function findProgressSection(doc: RenderableDocument): {
  paragraph: string;
  table: TableBlock | null;
} {
  const progressIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'Progress');

  if (progressIdx === -1) {
    return { paragraph: '', table: null };
  }

  // Find the paragraph after Progress heading
  let paragraphText = '';
  for (let i = progressIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      paragraphText = section.text;
      break;
    }
    if (isHeading(section)) break;
  }

  // Find the table after Progress heading
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

function getPatternTable(doc: RenderableDocument): TableBlock | undefined {
  return findTableWithHeader(doc, 'Pattern');
}

function getCategorySections(
  doc: RenderableDocument
): Array<{ name: string; patternCount: number }> {
  const result: Array<{ name: string; patternCount: number }> = [];
  const headings = findHeadings(doc);

  // Category sections are H3 headings after the main sections
  for (const heading of headings) {
    if (heading.level === 3) {
      // Count patterns in this category (look for pattern list)
      const headingIdx = doc.sections.indexOf(heading);
      let patternCount = 0;

      for (let i = headingIdx + 1; i < doc.sections.length; i++) {
        const section = doc.sections[i];
        if (isHeading(section) && section.level <= 3) break;
        if (isList(section)) {
          patternCount = section.items.length;
          break;
        }
      }

      result.push({ name: heading.text, patternCount });
    }
  }

  return result;
}

// =============================================================================
// Feature: Patterns Document Codec
// =============================================================================

const feature = await loadFeature('tests/features/behavior/patterns-codec.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a patterns codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: Document structure includes progress tracking and category navigation
  // ===========================================================================

  Rule(
    'Document structure includes progress tracking and category navigation',
    ({ RuleScenario }) => {
      RuleScenario('Decode empty dataset', ({ Given, When, Then, And }) => {
        Given('an empty PatternGraph', () => {
          state!.dataset = createTestPatternGraph();
        });

        When('decoding with PatternsDocumentCodec', () => {
          state!.document = PatternsDocumentCodec.decode(state!.dataset!);
        });

        Then('the document title is {string}', (_ctx: unknown, title: string) => {
          expect(state!.document!.title).toBe(title);
        });

        And('the document has a purpose', () => {
          expect(state!.document!.purpose).toBeDefined();
          expect(state!.document!.purpose!.length).toBeGreaterThan(0);
        });

        And('the progress section shows {int} patterns', (_ctx: unknown, count: number) => {
          const { table } = findProgressSection(state!.document!);
          expect(table).toBeDefined();
          // Total row should show the count
          const totalRow = table!.rows.find((row) => row[0]?.includes('Total'));
          expect(totalRow).toBeDefined();
          expect(totalRow![1]).toBe(String(count));
        });
      });

      RuleScenario(
        'Decode dataset with patterns - document structure',
        ({ Given, When, Then, And }) => {
          Given(
            'a PatternGraph with {int} patterns across {int} categories',
            (_ctx: unknown, patternCount: number, categoryCount: number) => {
              const categories = ['core', 'ddd', 'saga'].slice(0, categoryCount);
              state!.dataset = createPatternGraphWithCategories(
                categories,
                Math.ceil(patternCount / categoryCount)
              );
            }
          );

          When('decoding with PatternsDocumentCodec', () => {
            state!.document = PatternsDocumentCodec.decode(state!.dataset!);
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
        }
      );

      RuleScenario('Progress summary shows correct counts', ({ Given, When, Then, And }) => {
        Given(
          'a PatternGraph with status distribution:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            const counts: Record<string, number> = {};
            for (const row of dataTable) {
              counts[row.status] = parseInt(row.count);
            }
            state!.dataset = createPatternGraphWithStatus(counts);
          }
        );

        When('decoding with PatternsDocumentCodec', () => {
          state!.document = PatternsDocumentCodec.decode(state!.dataset!);
        });

        Then('the progress section shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const { table } = findProgressSection(state!.document!);
          expect(table).toBeDefined();

          for (const row of dataTable) {
            const status = row.status ?? '';
            const expectedCount = row.count;
            const tableRow = table!.rows.find((r) => r[0]?.includes(status));
            expect(tableRow, `Should have row for ${status}`).toBeDefined();
            expect(tableRow![1]).toBe(expectedCount);
          }
        });

        And('the progress shows {string}', (_ctx: unknown, expected: string) => {
          const { paragraph } = findProgressSection(state!.document!);
          expect(paragraph).toContain(expected);
        });
      });
    }
  );

  // ===========================================================================
  // Rule: Pattern table presents all patterns sorted by status then name
  // ===========================================================================

  Rule('Pattern table presents all patterns sorted by status then name', ({ RuleScenario }) => {
    RuleScenario('Pattern table includes all patterns', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with {int} patterns', (_ctx: unknown, count: number) => {
        state!.dataset = createTestPatternGraph({ patternCount: count });
      });

      When('decoding with PatternsDocumentCodec', () => {
        state!.document = PatternsDocumentCodec.decode(state!.dataset!);
      });

      Then('the pattern table has {int} rows', (_ctx: unknown, count: number) => {
        const table = getPatternTable(state!.document!);
        expect(table).toBeDefined();
        expect(table!.rows.length).toBe(count);
      });

      And('the pattern table has columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = getPatternTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          expect(table!.columns).toContain(row.column);
        }
      });
    });

    RuleScenario('Pattern table is sorted by status then name', ({ Given, When, Then }) => {
      Given('a PatternGraph with patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const patterns = dataTable.map((row) => {
          // Status values now match directly (roadmap, active, completed, deferred)
          return createTestPattern({
            name: row.name ?? 'Unnamed',
            status: (row.status ?? 'completed') as 'roadmap' | 'active' | 'completed' | 'deferred',
          });
        });
        state!.dataset = createTestPatternGraph({ patterns });
      });

      When('decoding with PatternsDocumentCodec', () => {
        state!.document = PatternsDocumentCodec.decode(state!.dataset!);
      });

      Then('the pattern table rows are in order:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = getPatternTable(state!.document!);
        expect(table).toBeDefined();

        for (let i = 0; i < dataTable.length; i++) {
          const expectedName = dataTable[i].name;
          const actualRow = table!.rows[i];
          expect(actualRow[0]).toContain(expectedName);
        }
      });
    });
  });

  // ===========================================================================
  // Rule: Category sections group patterns by domain
  // ===========================================================================

  Rule('Category sections group patterns by domain', ({ RuleScenario }) => {
    RuleScenario('Category sections with pattern lists', ({ Given, When, Then }) => {
      Given(
        'a PatternGraph with patterns in categories:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const patterns = [];
          for (const row of dataTable) {
            const count = parseInt(row.count);
            for (let i = 0; i < count; i++) {
              patterns.push(createTestPattern({ category: row.category }));
            }
          }
          state!.dataset = createTestPatternGraph({ patterns });
        }
      );

      When('decoding with PatternsDocumentCodec', () => {
        state!.document = PatternsDocumentCodec.decode(state!.dataset!);
      });

      Then('the document has category sections:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const categorySections = getCategorySections(state!.document!);

        for (const row of dataTable) {
          const expectedCategory = row.category ?? '';
          const expectedCount = parseInt(row.patternCount ?? '0');
          const section = categorySections.find((s) =>
            s.name.toLowerCase().includes(expectedCategory)
          );
          expect(section, `Should have section for ${expectedCategory}`).toBeDefined();
          expect(section!.patternCount).toBe(expectedCount);
        }
      });
    });

    RuleScenario('Filter to specific categories', ({ Given, When, Then, And }) => {
      Given(
        'a PatternGraph with patterns in categories:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const patterns = [];
          for (const row of dataTable) {
            const count = parseInt(row.count);
            for (let i = 0; i < count; i++) {
              patterns.push(createTestPattern({ category: row.category }));
            }
          }
          state!.dataset = createTestPatternGraph({ patterns });
        }
      );

      When(
        'decoding with filterCategories {string} and {string}',
        (_ctx: unknown, cat1: string, cat2: string) => {
          const codec = createPatternsCodec({ filterCategories: [cat1, cat2] });
          state!.document = codec.decode(state!.dataset!);
        }
      );

      Then('the document has {int} patterns in the table', (_ctx: unknown, count: number) => {
        const table = getPatternTable(state!.document!);
        expect(table).toBeDefined();
        expect(table!.rows.length).toBe(count);
      });

      And('the category sections include only:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const categorySections = getCategorySections(state!.document!);
        const expectedCategories = dataTable.map((row) => row.category.toLowerCase());

        for (const section of categorySections) {
          const sectionCategory = section.name.toLowerCase();
          const found = expectedCategories.some((cat) => sectionCategory.includes(cat));
          expect(found, `Section "${section.name}" should be in expected categories`).toBe(true);
        }

        expect(categorySections.length).toBe(expectedCategories.length);
      });
    });
  });

  // ===========================================================================
  // Rule: Dependency graph visualizes pattern relationships
  // ===========================================================================

  Rule('Dependency graph visualizes pattern relationships', ({ RuleScenario }) => {
    RuleScenario('Dependency graph included when relationships exist', ({ Given, When, Then }) => {
      Given('a PatternGraph with pattern relationships', () => {
        state!.dataset = createPatternGraphWithRelationships();
      });

      When('decoding with default options', () => {
        state!.document = PatternsDocumentCodec.decode(state!.dataset!);
      });

      Then('the document contains a mermaid dependency graph', () => {
        const mermaidBlocks = findMermaidBlocks(state!.document!);
        expect(mermaidBlocks.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('No dependency graph when no relationships', ({ Given, When, Then }) => {
      Given('a PatternGraph without relationships', () => {
        state!.dataset = createTestPatternGraph({ patternCount: 3 });
      });

      When('decoding with default options', () => {
        state!.document = PatternsDocumentCodec.decode(state!.dataset!);
      });

      Then('the document does not contain a mermaid block', () => {
        const mermaidBlocks = findMermaidBlocks(state!.document!);
        expect(mermaidBlocks.length).toBe(0);
      });
    });

    RuleScenario('Dependency graph disabled by option', ({ Given, When, Then }) => {
      Given('a PatternGraph with pattern relationships', () => {
        state!.dataset = createPatternGraphWithRelationships();
      });

      When('decoding with includeDependencyGraph disabled', () => {
        const codec = createPatternsCodec({ includeDependencyGraph: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document does not contain a mermaid block', () => {
        const mermaidBlocks = findMermaidBlocks(state!.document!);
        expect(mermaidBlocks.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Rule: Detail file generation creates per-pattern pages
  // ===========================================================================

  Rule('Detail file generation creates per-pattern pages', ({ RuleScenario }) => {
    RuleScenario('Generate individual pattern files when enabled', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with named patterns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const patterns = [];
        for (const row of dataTable) {
          patterns.push(
            createTestPattern({
              category: row.category,
              name: row.name,
              patternName: row.name,
            })
          );
        }
        state!.dataset = createTestPatternGraph({ patterns });
      });

      When('decoding with generateDetailFiles enabled', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document has individual pattern files:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          expect(state!.document!.additionalFiles).toBeDefined();
          const files = Object.keys(state!.document!.additionalFiles!);

          for (const row of dataTable) {
            expect(files).toContain(row.path);
          }
        }
      );

      And('category links are anchor links', () => {
        // Find the Categories section list
        const sections = state!.document!.sections;
        const categoriesIdx = sections.findIndex((s) => isHeading(s) && s.text === 'Categories');

        if (categoriesIdx !== -1) {
          for (let i = categoriesIdx + 1; i < sections.length; i++) {
            const section = sections[i];
            if (isList(section)) {
              for (const item of section.items) {
                const text = typeof item === 'string' ? item : item.text;
                expect(text).toContain('#');
              }
              break;
            }
            if (isHeading(section)) break;
          }
        }
      });

      And('pattern links point to individual files', () => {
        // Find pattern list items in category sections (H3 headings followed by lists)
        const sections = state!.document!.sections;
        let foundPatternLink = false;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (isHeading(section) && section.level === 3) {
            // Look for list after category heading
            for (let j = i + 1; j < sections.length; j++) {
              const nextSection = sections[j];
              if (isList(nextSection)) {
                for (const item of nextSection.items) {
                  const text = typeof item === 'string' ? item : item.text;
                  if (text.includes('patterns/')) {
                    foundPatternLink = true;
                  }
                }
                break;
              }
              if (isHeading(nextSection)) break;
            }
          }
        }
        expect(foundPatternLink).toBe(true);
      });
    });

    RuleScenario('No detail files when disabled', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with patterns in {int} categories', (_ctx: unknown, count: number) => {
        const categories = ['core', 'ddd', 'saga'].slice(0, count);
        state!.dataset = createPatternGraphWithCategories(categories, 2);
      });

      When('decoding with generateDetailFiles disabled', () => {
        const codec = createPatternsCodec({ generateDetailFiles: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document has no additional files', () => {
        const additionalFiles = state!.document!.additionalFiles;
        expect(additionalFiles === undefined || Object.keys(additionalFiles).length === 0).toBe(
          true
        );
      });

      And('category links are anchor links', () => {
        // Find the Categories section list
        const sections = state!.document!.sections;
        const categoriesIdx = sections.findIndex((s) => isHeading(s) && s.text === 'Categories');

        if (categoriesIdx !== -1) {
          for (let i = categoriesIdx + 1; i < sections.length; i++) {
            const section = sections[i];
            if (isList(section)) {
              for (const item of section.items) {
                const text = typeof item === 'string' ? item : item.text;
                expect(text).toContain('#');
              }
              break;
            }
            if (isHeading(section)) break;
          }
        }
      });
    });

    RuleScenario('Individual pattern file contains full details', ({ Given, When, Then, And }) => {
      Given(
        'a PatternGraph with a pattern named {string} in category {string}',
        (_ctx: unknown, name: string, category: string) => {
          const patterns = [
            createTestPattern({
              category,
              name,
              patternName: name,
              description: `Description for ${name}`,
            }),
          ];
          state!.dataset = createTestPatternGraph({ patterns });
        }
      );

      When('decoding with generateDetailFiles enabled', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the {string} additional file exists', (_ctx: unknown, path: string) => {
        expect(state!.document!.additionalFiles).toBeDefined();
        expect(state!.document!.additionalFiles![path]).toBeDefined();
      });

      And(
        'the pattern file has title containing {string}',
        (_ctx: unknown, expectedTitle: string) => {
          const files = state!.document!.additionalFiles!;
          const patternFile = Object.values(files)[0];
          expect(patternFile.title).toContain(expectedTitle);
        }
      );

      And('the pattern file contains an Overview section', () => {
        const files = state!.document!.additionalFiles!;
        const patternFile = Object.values(files)[0];
        const headings = findHeadings(patternFile);
        const overviewHeading = headings.find((h) => h.text === 'Overview');
        expect(overviewHeading).toBeDefined();
      });
    });
  });
});
