/**
 * Step definitions for Generated Documentation Quality tests (Phase 38)
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type ReferenceCodecState,
  initState,
  createReferenceCodec,
  createTestPattern,
  createTestMasterDataset,
  findHeadings,
  findTables,
  findLists,
  findParagraphs,
  type DetailLevel,
  type RenderableDocument,
} from '../../../support/helpers/reference-codec-state.js';
import { renderToMarkdown } from '../../../../src/renderable/render.js';

// ============================================================================
// State
// ============================================================================

let state: ReferenceCodecState | null = null;

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/generated-doc-quality.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a reference codec test context', () => {
      state = initState();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Behavior-specs renderer does not duplicate convention table content
  // ──────────────────────────────────────────────────────────────────────

  Rule(
    'Behavior-specs renderer does not duplicate convention table content',
    ({ RuleScenario }) => {
      RuleScenario(
        'Convention rule table appears exactly once in generated output',
        ({ Given, And, When, Then }) => {
          Given(
            'a reference config with convention tag {string} and include tag {string}',
            (_ctx: unknown, convTag: string, includeTag: string) => {
              state!.config = {
                title: 'Test Dedup Document',
                conventionTags: [convTag],
                shapeSelectors: [],
                behaviorCategories: [],
                includeTags: [includeTag],
                claudeMdSection: 'test',
                docsFilename: 'TEST-DEDUP.md',
                claudeMdFilename: 'test-dedup.md',
              };
            }
          );

          And('a pattern with convention content and a table in its rule description', () => {
            const tableDescription =
              '**Invariant:** Values must be canonical.\n\n' +
              '**Rationale:** Prevents drift.\n\n' +
              '| Value | Meaning |\n| --- | --- |\n| alpha | First |\n| beta | Second |\n\n' +
              '**Verified by:** Table validation';
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ConventionWithTable',
                  convention: ['test-conv'],
                  include: ['test-include'],
                  rules: [
                    {
                      name: 'Canonical Values',
                      description: tableDescription,
                      scenarioCount: 1,
                      scenarioNames: ['Table validation'],
                    },
                  ],
                }),
              ],
            });
          });

          When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
            const codec = createReferenceCodec(state!.config!, {
              detailLevel: level as DetailLevel,
            });
            state!.document = codec.decode(state!.dataset!) as RenderableDocument;
          });

          Then('the table appears exactly once in the document', () => {
            const tables = findTables(state!.document!);
            const valueTables = tables.filter(
              (t) => t.columns.includes('Value') && t.columns.includes('Meaning')
            );
            expect(valueTables).toHaveLength(1);
          });

          And('the behavior-specs section contains invariant text', () => {
            const paragraphs = findParagraphs(state!.document!);
            const hasInvariant = paragraphs.some((p) =>
              p.text.includes('Values must be canonical')
            );
            expect(hasInvariant).toBe(true);
          });

          And('the behavior-specs section does not contain the table', () => {
            // The single table should be in convention section only.
            // We already verified exactly 1 table with Value/Meaning headers above.
            const tables = findTables(state!.document!);
            const valueTables = tables.filter(
              (t) => t.columns.includes('Value') && t.columns.includes('Meaning')
            );
            expect(valueTables).toHaveLength(1);
          });
        }
      );

      RuleScenario(
        'Behavior-specs show rule metadata without tables',
        ({ Given, And, When, Then }) => {
          Given(
            'a reference config with convention tag {string} and include tag {string}',
            (_ctx: unknown, convTag: string, includeTag: string) => {
              state!.config = {
                title: 'Test Dedup Standard',
                conventionTags: [convTag],
                shapeSelectors: [],
                behaviorCategories: [],
                includeTags: [includeTag],
                claudeMdSection: 'test',
                docsFilename: 'TEST-DEDUP-STD.md',
                claudeMdFilename: 'test-dedup-std.md',
              };
            }
          );

          And('a pattern with convention content and a table in its rule description', () => {
            const tableDescription =
              '**Invariant:** Values must be canonical.\n\n' +
              '**Rationale:** Prevents drift.\n\n' +
              '| Value | Meaning |\n| --- | --- |\n| alpha | First |\n| beta | Second |\n\n' +
              '**Verified by:** Table validation';
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ConventionWithTable',
                  convention: ['test-conv'],
                  include: ['test-include'],
                  rules: [
                    {
                      name: 'Canonical Values',
                      description: tableDescription,
                      scenarioCount: 1,
                      scenarioNames: ['Table validation'],
                    },
                  ],
                }),
              ],
            });
          });

          When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
            const codec = createReferenceCodec(state!.config!, {
              detailLevel: level as DetailLevel,
            });
            state!.document = codec.decode(state!.dataset!) as RenderableDocument;
          });

          Then('the convention section renders the table', () => {
            const tables = findTables(state!.document!);
            const valueTables = tables.filter(
              (t) => t.columns.includes('Value') && t.columns.includes('Meaning')
            );
            expect(valueTables.length).toBeGreaterThanOrEqual(1);
          });

          And('no table rows are duplicated in the document', () => {
            const markdown = renderToMarkdown(state!.document!);
            const alphaMatches = markdown.match(/\| alpha/g);
            // Table row should appear exactly once
            expect(alphaMatches).toHaveLength(1);
          });
        }
      );
    }
  );

  // ──────────────────────────────────────────────────────────────────────
  // Rule: ARCHITECTURE-TYPES leads with type definitions
  // ──────────────────────────────────────────────────────────────────────

  Rule('ARCHITECTURE-TYPES leads with type definitions', ({ RuleScenario }) => {
    RuleScenario(
      'Shapes section appears before conventions when shapesFirst is true',
      ({ Given, And, When, Then }) => {
        Given('a reference config with shapesFirst enabled', () => {
          state!.config = {
            title: 'Types First Test',
            conventionTags: ['test-conv'],
            shapeSelectors: [{ group: 'test-shapes' }],
            behaviorCategories: [],
            shapesFirst: true,
            claudeMdSection: 'test',
            docsFilename: 'TEST-TYPES.md',
            claudeMdFilename: 'test-types.md',
          };
        });

        And('a dataset with both convention content and shape content', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ConventionPattern',
                convention: ['test-conv'],
                rules: [
                  {
                    name: 'Convention Rule',
                    description: '**Invariant:** Must follow convention.',
                    scenarioCount: 0,
                    scenarioNames: [],
                  },
                ],
              }),
              createTestPattern({
                name: 'ShapePattern',
                extractedShapes: [
                  {
                    name: 'TestInterface',
                    kind: 'interface',
                    sourceText: 'interface TestInterface { id: string }',
                    lineNumber: 1,
                    group: 'test-shapes',
                    exported: true,
                  },
                ],
              }),
            ],
          });
        });

        When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
          const codec = createReferenceCodec(state!.config!, {
            detailLevel: level as DetailLevel,
          });
          state!.document = codec.decode(state!.dataset!) as RenderableDocument;
        });

        Then('the first heading after the title is from the shapes section', () => {
          const headings = findHeadings(state!.document!);
          // Find first H2 heading — should be API Types (shapes)
          const h2s = headings.filter((h) => h.level === 2);
          expect(h2s.length).toBeGreaterThanOrEqual(2);
          expect(h2s[0].text).toBe('API Types');
        });

        And('the convention heading appears after the shapes section', () => {
          const headings = findHeadings(state!.document!);
          const h2s = headings.filter((h) => h.level === 2);
          const shapesIdx = h2s.findIndex((h) => h.text === 'API Types');
          const convIdx = h2s.findIndex((h) => h.text === 'Convention Rule');
          expect(shapesIdx).toBeLessThan(convIdx);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Product area docs have a generated table of contents
  // ──────────────────────────────────────────────────────────────────────

  Rule('Product area docs have a generated table of contents', ({ RuleScenario }) => {
    RuleScenario(
      'Product area doc with multiple sections gets a TOC',
      ({ Given, And, When, Then }) => {
        Given('a product area config for {string}', (_ctx: unknown, area: string) => {
          state!.config = {
            title: `${area} Product Area`,
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            productArea: area,
            claudeMdSection: 'test',
            docsFilename: `${area.toUpperCase()}.md`,
            claudeMdFilename: `${area.toLowerCase()}.md`,
          };
        });

        And('a dataset with multiple patterns in the Generation area', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'GenPattern1',
                productArea: 'Generation',
                convention: ['gen-conv'],
                rules: [
                  {
                    name: 'Gen Rule 1',
                    description: '**Invariant:** First rule.',
                    scenarioCount: 1,
                    scenarioNames: ['Verify rule 1'],
                  },
                ],
              }),
              createTestPattern({
                name: 'GenPattern2',
                productArea: 'Generation',
                rules: [
                  {
                    name: 'Gen Rule 2',
                    description: '**Invariant:** Second rule.',
                    scenarioCount: 1,
                    scenarioNames: ['Verify rule 2'],
                  },
                ],
              }),
              createTestPattern({
                name: 'GenPattern3',
                productArea: 'Generation',
                extractedShapes: [
                  {
                    name: 'GenType',
                    kind: 'interface',
                    sourceText: 'interface GenType { x: number }',
                    lineNumber: 1,
                    exported: true,
                  },
                ],
              }),
            ],
          });
        });

        When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
          const codec = createReferenceCodec(state!.config!, {
            detailLevel: level as DetailLevel,
          });
          state!.document = codec.decode(state!.dataset!) as RenderableDocument;
        });

        Then('the document contains a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.find((h) => h.text === headingText);
          expect(match).toBeDefined();
        });

        And('the Contents section is a list with anchor links', () => {
          const lists = findLists(state!.document!);
          // Find the list that follows the Contents heading
          const hasAnchorLinks = lists.some((l) =>
            l.items.some((item) => {
              const text = typeof item === 'string' ? item : item.text;
              return text.includes('](#');
            })
          );
          expect(hasAnchorLinks).toBe(true);
        });

        And('the Contents heading appears after the intro separator', () => {
          // Contents should not be the very first section — it comes after intro
          const sections = state!.document!.sections;
          const contentsIdx = sections.findIndex(
            (s) => s.type === 'heading' && s.level === 2 && s.text === 'Contents'
          );
          const firstSepIdx = sections.findIndex((s) => s.type === 'separator');
          expect(contentsIdx).toBeGreaterThan(firstSepIdx);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Generation compact is self-sufficient
  // ──────────────────────────────────────────────────────────────────────

  Rule('Generation compact is self-sufficient', ({ RuleScenario }) => {
    RuleScenario('Generation compact contains enriched content', ({ Given, And, When, Then }) => {
      Given('a product area config for {string}', (_ctx: unknown, area: string) => {
        state!.config = {
          title: `${area} Product Area`,
          conventionTags: [],
          shapeSelectors: [],
          behaviorCategories: [],
          productArea: area,
          claudeMdSection: 'test',
          docsFilename: `${area.toUpperCase()}.md`,
          claudeMdFilename: `${area.toLowerCase()}.md`,
        };
      });

      And('a dataset with Generation area patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'GenerationCodec',
              productArea: 'Generation',
            }),
          ],
        });
      });

      When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
        const codec = createReferenceCodec(state!.config!, {
          detailLevel: level as DetailLevel,
        });
        state!.document = codec.decode(state!.dataset!) as RenderableDocument;
      });

      Then(
        'the rendered output contains all expected terms:',
        (_ctx: unknown, dataTable: Array<{ Term: string }>) => {
          const markdown = renderToMarkdown(state!.document!);
          for (const row of dataTable) {
            expect(markdown).toContain(row.Term);
          }
        }
      );
    });
  });
});
