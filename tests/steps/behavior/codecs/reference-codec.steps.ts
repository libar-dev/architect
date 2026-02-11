/**
 * Step definitions for Reference Document Codec tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import type { RenderableDocument } from '../../../../src/renderable/schema.js';
import type { DetailLevel } from '../../../../src/renderable/codecs/types/base.js';
import {
  createReferenceCodec,
  type ReferenceDocConfig,
} from '../../../../src/renderable/codecs/reference.js';
import { createTestPattern, resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findParagraphs,
  findTables,
  findBlocksByType,
} from '../../../support/helpers/document-assertions.js';

// ============================================================================
// State
// ============================================================================

interface ReferenceCodecState {
  config: ReferenceDocConfig | null;
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

function initState(): ReferenceCodecState {
  resetPatternCounter();
  return { config: null, dataset: null, document: null };
}

let state: ReferenceCodecState | null = null;

// ============================================================================
// Helpers
// ============================================================================

function makeConfig(conventionTags: string, behaviorTags: string): ReferenceDocConfig {
  return {
    title: 'Test Reference Document',
    conventionTags: conventionTags ? conventionTags.split(',').map((t) => t.trim()) : [],
    shapeSources: [],
    behaviorTags: behaviorTags ? behaviorTags.split(',').map((t) => t.trim()) : [],
    claudeMdSection: 'test',
    docsFilename: 'TEST-REFERENCE.md',
    claudeMdFilename: 'test.md',
  };
}

function getRenderedMarkdown(): string {
  const doc = state!.document!;
  // Flatten all paragraph text for content assertions
  return findParagraphs(doc)
    .map((p) => p.text)
    .join('\n');
}

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/reference-codec.feature');

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
  // Rule: Empty datasets produce fallback content
  // ──────────────────────────────────────────────────────────────────────

  Rule('Empty datasets produce fallback content', ({ RuleScenario }) => {
    RuleScenario(
      'Codec with no matching content produces fallback message',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('an empty MasterDataset', () => {
          state!.dataset = createTestMasterDataset({ patterns: [] });
        });

        When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
          const codec = createReferenceCodec(state!.config!, {
            detailLevel: level as DetailLevel,
          });
          state!.document = codec.decode(state!.dataset!) as RenderableDocument;
        });

        Then('the document title matches the config title', () => {
          expect(state!.document!.title).toBe(state!.config!.title);
        });

        And('the document contains a no-content fallback paragraph', () => {
          const text = getRenderedMarkdown();
          expect(text).toContain('No content found');
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Convention content is rendered as sections
  // ──────────────────────────────────────────────────────────────────────

  Rule('Convention content is rendered as sections', ({ RuleScenario }) => {
    RuleScenario(
      'Convention rules appear as H2 headings with content',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a MasterDataset with a convention-tagged pattern:',
          (_ctx: unknown, dataTable: Array<Record<string, string>>) => {
            const row = dataTable[0]!;
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ConventionPattern',
                  convention: [row['convention']!],
                  rules: [
                    {
                      name: row['ruleName']!,
                      description: `**Invariant:** ${row['invariant']!}`,
                      scenarioCount: 0,
                      scenarioNames: [],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
          const codec = createReferenceCodec(state!.config!, {
            detailLevel: level as DetailLevel,
          });
          state!.document = codec.decode(state!.dataset!) as RenderableDocument;
        });

        Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });

        And('the document contains text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain(text);
        });
      }
    );

    RuleScenario('Convention tables are rendered in the document', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with convention tags {string} and behavior tags {string}',
        (_ctx: unknown, convTags: string, behTags: string) => {
          state!.config = makeConfig(convTags, behTags);
        }
      );

      And('a MasterDataset with a convention pattern with a table', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'TablePattern',
              convention: ['fsm-rules'],
              rules: [
                {
                  name: 'Protection Levels',
                  description: [
                    '| Status | Protection |',
                    '| --- | --- |',
                    '| roadmap | None |',
                    '| active | Scope-locked |',
                  ].join('\n'),
                  scenarioCount: 0,
                  scenarioNames: [],
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

      Then('the document has at least {int} table', (_ctx: unknown, minCount: number) => {
        const tables = findTables(state!.document!);
        expect(tables.length).toBeGreaterThanOrEqual(minCount);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Detail level controls output density
  // ──────────────────────────────────────────────────────────────────────

  Rule('Detail level controls output density', ({ RuleScenario }) => {
    RuleScenario('Summary level omits narrative and rationale', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with convention tags {string} and behavior tags {string}',
        (_ctx: unknown, convTags: string, behTags: string) => {
          state!.config = makeConfig(convTags, behTags);
        }
      );

      And('a MasterDataset with a convention pattern with narrative and rationale', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'DetailPattern',
              convention: ['fsm-rules'],
              rules: [
                {
                  name: 'Detail Test Rule',
                  description: [
                    '**Invariant:** Must follow FSM.',
                    '',
                    '**Rationale:** Prevents corruption.',
                    '',
                    'This is the narrative content that explains details.',
                  ].join('\n'),
                  scenarioCount: 0,
                  scenarioNames: [],
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

      Then('the document does not contain text {string}', (_ctx: unknown, text: string) => {
        const rendered = getRenderedMarkdown();
        expect(rendered).not.toContain(text);
      });

      And('the document does not contain narrative text', () => {
        const rendered = getRenderedMarkdown();
        expect(rendered).not.toContain('narrative content that explains');
      });
    });

    RuleScenario(
      'Detailed level includes rationale and verified-by',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('a MasterDataset with a convention pattern with narrative and rationale', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'DetailPatternFull',
                convention: ['fsm-rules'],
                rules: [
                  {
                    name: 'Detail Test Rule',
                    description: [
                      '**Invariant:** Must follow FSM.',
                      '',
                      '**Rationale:** Prevents corruption.',
                      '',
                      'This is the narrative content.',
                    ].join('\n'),
                    scenarioCount: 0,
                    scenarioNames: [],
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

        Then('the document contains text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain(text);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Behavior sections are rendered from category-matching patterns
  // ──────────────────────────────────────────────────────────────────────

  Rule('Behavior sections are rendered from category-matching patterns', ({ RuleScenario }) => {
    RuleScenario(
      'Behavior-tagged patterns appear in a Behavior Specifications section',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a MasterDataset with a behavior pattern in category {string}',
          (_ctx: unknown, category: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ProcessGuardSpec',
                  category,
                  description: 'Validates delivery workflow changes at commit time.',
                }),
              ],
            });
          }
        );

        When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
          const codec = createReferenceCodec(state!.config!, {
            detailLevel: level as DetailLevel,
          });
          state!.document = codec.decode(state!.dataset!) as RenderableDocument;
        });

        Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Shape sources are extracted from matching patterns
  // ──────────────────────────────────────────────────────────────────────

  Rule('Shape sources are extracted from matching patterns', ({ RuleScenario }) => {
    RuleScenario(
      'Shapes appear when source file matches shapeSources glob',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with shapeSources {string}',
          (_ctx: unknown, shapeSources: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: shapeSources.split(',').map((s) => s.trim()),
              behaviorTags: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with a pattern at {string} with extracted shapes',
          (_ctx: unknown, filePath: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ShapePattern',
                  filePath,
                  extractedShapes: [
                    {
                      name: 'DeciderInput',
                      kind: 'interface',
                      sourceText:
                        'export interface DeciderInput {\n  state: ProcessState;\n  changes: Change[];\n}',
                      jsDoc: 'Input to the process guard decider function.',
                      lineNumber: 10,
                      exported: true,
                      propertyDocs: [
                        {
                          name: 'state',
                          jsDoc: 'Current process state derived from file annotations',
                        },
                        { name: 'changes', jsDoc: 'Staged or detected changes to validate' },
                      ],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
          const codec = createReferenceCodec(state!.config!, {
            detailLevel: level as DetailLevel,
          });
          state!.document = codec.decode(state!.dataset!) as RenderableDocument;
        });

        Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });

        And(
          'the document contains a code block with {string}',
          (_ctx: unknown, language: string) => {
            const codeBlocks = findBlocksByType(state!.document!, 'code');
            const match = codeBlocks.some((b) => b.language === language);
            expect(match).toBe(true);
          }
        );
      }
    );

    RuleScenario('Summary level shows shapes as a compact table', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with shapeSources {string}',
        (_ctx: unknown, shapeSources: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: shapeSources.split(',').map((s) => s.trim()),
            behaviorTags: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a MasterDataset with a pattern at {string} with extracted shapes',
        (_ctx: unknown, filePath: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ShapePattern',
                filePath,
                extractedShapes: [
                  {
                    name: 'DeciderInput',
                    kind: 'interface',
                    sourceText: 'export interface DeciderInput { state: ProcessState; }',
                    lineNumber: 10,
                    exported: true,
                  },
                ],
              }),
            ],
          });
        }
      );

      When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
        const codec = createReferenceCodec(state!.config!, {
          detailLevel: level as DetailLevel,
        });
        state!.document = codec.decode(state!.dataset!) as RenderableDocument;
      });

      Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
        const headings = findHeadings(state!.document!);
        const match = headings.some((h) => h.text.includes(headingText));
        expect(match).toBe(true);
      });

      And('the document has at least {int} table', (_ctx: unknown, minCount: number) => {
        const tables = findTables(state!.document!);
        expect(tables.length).toBeGreaterThanOrEqual(minCount);
      });
    });

    RuleScenario('No shapes when source file does not match glob', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with shapeSources {string}',
        (_ctx: unknown, shapeSources: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: shapeSources.split(',').map((s) => s.trim()),
            behaviorTags: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a MasterDataset with a pattern at {string} with extracted shapes',
        (_ctx: unknown, filePath: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ShapePattern',
                filePath,
                extractedShapes: [
                  {
                    name: 'Unrelated',
                    kind: 'type',
                    sourceText: 'export type Unrelated = string;',
                    lineNumber: 1,
                    exported: true,
                  },
                ],
              }),
            ],
          });
        }
      );

      When('decoding at detail level {string}', (_ctx: unknown, level: string) => {
        const codec = createReferenceCodec(state!.config!, {
          detailLevel: level as DetailLevel,
        });
        state!.document = codec.decode(state!.dataset!) as RenderableDocument;
      });

      Then(
        'the document does not have a heading {string}',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(false);
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Convention and behavior content compose in a single document
  // ──────────────────────────────────────────────────────────────────────

  Rule('Convention and behavior content compose in a single document', ({ RuleScenario }) => {
    RuleScenario(
      'Both convention and behavior sections appear when data exists',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('a MasterDataset with both convention and behavior data', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ConventionADR',
                convention: ['fsm-rules'],
                rules: [
                  {
                    name: 'FSM Transitions',
                    description: '**Invariant:** Valid transitions only.',
                    scenarioCount: 0,
                    scenarioNames: [],
                  },
                ],
              }),
              createTestPattern({
                name: 'BehaviorSpec',
                category: 'process-guard',
                description: 'Process Guard validates workflow.',
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

        Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });

        And('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });
      }
    );
  });
});
