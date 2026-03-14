/**
 * PRD Implementation Section Step Definitions
 *
 * BDD step definitions for testing the Implementations section in pattern documents.
 * Tests that code stubs with @libar-docs-implements tags appear in pattern docs
 * with working links to source files.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createPatternsCodec } from '../../../src/renderable/codecs/patterns.js';
import { renderToMarkdown } from '../../../src/renderable/render.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import type { RuntimeMasterDataset } from '../../../src/generators/pipeline/transform-types.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/dataset-factories.js';
import { findHeadings } from '../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../support/world.js';
import { toKebabCase } from '../../../src/utils/index.js';

// =============================================================================
// State Types
// =============================================================================

interface PrdImplementationState {
  dataset: RuntimeMasterDataset | null;
  document: RenderableDocument | null;
  markdown: string;
  patterns: ExtractedPattern[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PrdImplementationState | null = null;

function initState(): PrdImplementationState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    markdown: '',
    patterns: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a pattern (roadmap spec style)
 */
function createRoadmapPattern(options: {
  name: string;
  status?: string;
  category?: string;
  filePath?: string;
}): ExtractedPattern {
  return createTestPattern({
    name: options.name,
    category: options.category ?? 'core',
    status: (options.status ?? 'roadmap') as 'roadmap' | 'active' | 'completed',
    filePath: options.filePath ?? `specs/${options.name.toLowerCase()}.feature`,
  });
}

/**
 * Create an implementation pattern (TypeScript stub style)
 */
function createImplementationPattern(options: {
  name: string;
  filePath: string;
  implements: string;
  description?: string;
}): ExtractedPattern {
  const pattern = createTestPattern({
    name: options.name,
    category: 'event-sourcing',
    status: 'roadmap',
    filePath: options.filePath,
    implementsPatterns: [options.implements],
  });

  // Add description to the directive
  if (options.description) {
    return {
      ...pattern,
      directive: {
        ...pattern.directive,
        description: options.description,
      },
    };
  }

  return pattern;
}

/**
 * Build the dataset from patterns
 */
function buildDataset(): void {
  state!.dataset = transformToMasterDataset({
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

/**
 * Generate the pattern document for a specific pattern
 */
function generatePatternDocument(patternName: string): void {
  buildDataset();

  // Find the pattern
  const pattern = state!.patterns.find(
    (p) => p.patternName === patternName || p.name === patternName
  );
  if (!pattern) {
    throw new Error(`Pattern "${patternName}" not found`);
  }

  // Use the patterns codec with generateDetailFiles enabled
  const codec = createPatternsCodec({ generateDetailFiles: true });
  const mainDoc = codec.decode(state!.dataset!);

  // Build the expected file key: patterns/{kebab-case-name}.md
  const slug = toKebabCase(patternName);
  const fileKey = `patterns/${slug}.md`;

  // Find the detail document in additionalFiles
  const detailDoc = mainDoc.additionalFiles?.[fileKey] as RenderableDocument | undefined;

  if (detailDoc) {
    state!.document = detailDoc;
    state!.markdown = renderToMarkdown(detailDoc);
  } else {
    // Fallback to main doc if no detail found
    state!.document = mainDoc;
    state!.markdown = renderToMarkdown(mainDoc);
  }
}

function headingExists(headingText: string): boolean {
  const headings = findHeadings(state!.document!);
  return headings.some((h) => h.text === headingText);
}

function markdownContains(text: string): boolean {
  return state!.markdown.includes(text);
}

function markdownContainsLink(filePath: string): boolean {
  // Links in markdown look like [text](path)
  return state!.markdown.includes(`](../${filePath})`) || state!.markdown.includes(filePath);
}

// =============================================================================
// Feature: PRD Implementation Section
// =============================================================================

const feature = await loadFeature('tests/features/generators/prd-implementation-section.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a pattern generator test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Implementation files appear in pattern docs
  // ===========================================================================

  Rule(
    'Implementation files appear in pattern docs via @libar-docs-implements',
    ({ RuleScenario }) => {
      RuleScenario(
        'Implementations section renders with file links',
        ({ Given, When, Then, And }) => {
          Given(
            'a pattern {string} defined with:',
            (_ctx: unknown, patternName: string, dataTable: DataTableRow[]) => {
              const fields: Record<string, string> = {};
              for (const row of dataTable) {
                fields[row.Field] = row.Value;
              }

              state!.patterns.push(
                createRoadmapPattern({
                  name: patternName,
                  status: fields.status,
                  category: fields.category,
                })
              );
            }
          );

          And(
            'a TypeScript file {string} that implements {string} with:',
            (
              _ctx: unknown,
              filePath: string,
              implementedPattern: string,
              dataTable: DataTableRow[]
            ) => {
              const fields: Record<string, string> = {};
              for (const row of dataTable) {
                fields[row.Field] = row.Value;
              }

              state!.patterns.push(
                createImplementationPattern({
                  name: fields.name ?? 'Implementation',
                  filePath,
                  implements: implementedPattern,
                  description: fields.description,
                })
              );
            }
          );

          When(
            'generating the pattern document for {string}',
            (_ctx: unknown, patternName: string) => {
              generatePatternDocument(patternName);
            }
          );

          Then('the document contains heading {string}', (_ctx: unknown, heading: string) => {
            expect(headingExists(heading)).toBe(true);
          });

          And('the document contains file link to {string}', (_ctx: unknown, filePath: string) => {
            expect(markdownContainsLink(filePath)).toBe(true);
          });

          And(
            'the document contains implementation description {string}',
            (_ctx: unknown, description: string) => {
              expect(markdownContains(description)).toBe(true);
            }
          );
        }
      );

      RuleScenario(
        'Implementation includes description when available',
        ({ Given, When, Then, And }) => {
          Given(
            'a pattern {string} defined with:',
            (_ctx: unknown, patternName: string, dataTable: DataTableRow[]) => {
              const fields: Record<string, string> = {};
              for (const row of dataTable) {
                fields[row.Field] = row.Value;
              }

              state!.patterns.push(
                createRoadmapPattern({
                  name: patternName,
                  status: fields.status,
                  category: fields.category,
                })
              );
            }
          );

          And(
            'a TypeScript file {string} that implements {string} with:',
            (
              _ctx: unknown,
              filePath: string,
              implementedPattern: string,
              dataTable: DataTableRow[]
            ) => {
              const fields: Record<string, string> = {};
              for (const row of dataTable) {
                fields[row.Field] = row.Value;
              }

              state!.patterns.push(
                createImplementationPattern({
                  name: fields.name ?? 'Implementation',
                  filePath,
                  implements: implementedPattern,
                  description: fields.description,
                })
              );
            }
          );

          When(
            'generating the pattern document for {string}',
            (_ctx: unknown, patternName: string) => {
              generatePatternDocument(patternName);
            }
          );

          Then(
            'the document contains implementation description {string}',
            (_ctx: unknown, description: string) => {
              expect(markdownContains(description)).toBe(true);
            }
          );
        }
      );
    }
  );

  // ===========================================================================
  // Rule 2: Multiple implementations are listed alphabetically
  // ===========================================================================

  Rule('Multiple implementations are listed alphabetically', ({ RuleScenario }) => {
    RuleScenario('Multiple implementations sorted by file path', ({ Given, When, Then, And }) => {
      Given(
        'a pattern {string} defined with:',
        (_ctx: unknown, patternName: string, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          state!.patterns.push(
            createRoadmapPattern({
              name: patternName,
              status: fields.status,
              category: fields.category,
            })
          );
        }
      );

      And(
        'TypeScript files that implement {string}:',
        (_ctx: unknown, implementedPattern: string, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            state!.patterns.push(
              createImplementationPattern({
                name: row.Name,
                filePath: row.File,
                implements: implementedPattern,
              })
            );
          }
        }
      );

      When('generating the pattern document for {string}', (_ctx: unknown, patternName: string) => {
        generatePatternDocument(patternName);
      });

      Then(
        'implementations appear in file path order:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const expectedOrder = dataTable.map((row) => row.File);

          // Find the positions of each file in the markdown
          const positions = expectedOrder.map((file) => {
            const fileName = file.split('/').pop() ?? file;
            return state!.markdown.indexOf(fileName);
          });

          // All files should be found
          for (const position of positions) {
            expect(position).toBeGreaterThan(-1);
          }

          // Verify they appear in order
          for (let i = 1; i < positions.length; i++) {
            expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
          }
        }
      );
    });
  });

  // ===========================================================================
  // Rule 3: Patterns without implementations omit the section
  // ===========================================================================

  Rule('Patterns without implementations omit the section', ({ RuleScenario }) => {
    RuleScenario('No implementations section when none exist', ({ Given, When, Then, And }) => {
      Given(
        'a pattern {string} defined with:',
        (_ctx: unknown, patternName: string, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          state!.patterns.push(
            createRoadmapPattern({
              name: patternName,
              status: fields.status,
              category: fields.category,
            })
          );
        }
      );

      And('no TypeScript files implement {string}', (_ctx: unknown, _patternName: string) => {
        // No action needed - no implementation patterns added
      });

      When('generating the pattern document for {string}', (_ctx: unknown, patternName: string) => {
        generatePatternDocument(patternName);
      });

      Then('the document does not contain heading {string}', (_ctx: unknown, heading: string) => {
        expect(headingExists(heading)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Rule 4: Implementation references use relative file links
  // ===========================================================================

  Rule('Implementation references use relative file links', ({ RuleScenario }) => {
    RuleScenario('Links are relative from patterns directory', ({ Given, When, Then, And }) => {
      Given(
        'a pattern {string} defined with:',
        (_ctx: unknown, patternName: string, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          state!.patterns.push(
            createRoadmapPattern({
              name: patternName,
              status: fields.status,
              category: fields.category,
            })
          );
        }
      );

      And(
        'a TypeScript file {string} that implements {string} with:',
        (
          _ctx: unknown,
          filePath: string,
          implementedPattern: string,
          dataTable: DataTableRow[]
        ) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          state!.patterns.push(
            createImplementationPattern({
              name: fields.name ?? 'Implementation',
              filePath,
              implements: implementedPattern,
              description: fields.description,
            })
          );
        }
      );

      When('generating the pattern document for {string}', (_ctx: unknown, patternName: string) => {
        generatePatternDocument(patternName);
      });

      Then('the implementation link path starts with {string}', (_ctx: unknown, prefix: string) => {
        // Check that the markdown contains a link starting with the prefix
        expect(state!.markdown).toContain(`](${prefix}`);
      });

      And('the implementation link path contains {string}', (_ctx: unknown, pathPart: string) => {
        expect(state!.markdown).toContain(pathPart);
      });
    });
  });
});
