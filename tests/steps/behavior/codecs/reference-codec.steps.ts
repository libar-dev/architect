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
  findLists,
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

function makeConfig(conventionTags: string, behaviorCategories: string): ReferenceDocConfig {
  return {
    title: 'Test Reference Document',
    conventionTags: conventionTags ? conventionTags.split(',').map((t) => t.trim()) : [],
    shapeSources: [],
    behaviorCategories: behaviorCategories
      ? behaviorCategories.split(',').map((t) => t.trim())
      : [],
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
              behaviorCategories: [],
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
            behaviorCategories: [],
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
            behaviorCategories: [],
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

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Composition order follows AD-5
  // ──────────────────────────────────────────────────────────────────────

  Rule(
    'Composition order follows AD-5: conventions then shapes then behaviors',
    ({ RuleScenario }) => {
      RuleScenario(
        'Convention headings appear before shapes before behaviors',
        ({ Given, And, When, Then }) => {
          Given('a reference config with all three content sources', () => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: ['fsm-rules'],
              shapeSources: ['src/lint/*.ts'],
              behaviorCategories: ['process-guard'],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          });

          And('a MasterDataset with convention, shape, and behavior data', () => {
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
                  name: 'ShapePattern',
                  filePath: 'src/lint/rules.ts',
                  extractedShapes: [
                    {
                      name: 'LintRule',
                      kind: 'interface',
                      sourceText: 'export interface LintRule { name: string; }',
                      lineNumber: 1,
                      exported: true,
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

          Then(
            'the heading {string} appears before {string}',
            (_ctx: unknown, first: string, second: string) => {
              const headings = findHeadings(state!.document!);
              const firstIndex = headings.findIndex((h) => h.text.includes(first));
              const secondIndex = headings.findIndex((h) => h.text.includes(second));
              expect(firstIndex).toBeGreaterThanOrEqual(0);
              expect(secondIndex).toBeGreaterThanOrEqual(0);
              expect(firstIndex).toBeLessThan(secondIndex);
            }
          );

          And(
            'the heading {string} appears before {string}',
            (_ctx: unknown, first: string, second: string) => {
              const headings = findHeadings(state!.document!);
              const firstIndex = headings.findIndex((h) => h.text.includes(first));
              const secondIndex = headings.findIndex((h) => h.text.includes(second));
              expect(firstIndex).toBeGreaterThanOrEqual(0);
              expect(secondIndex).toBeGreaterThanOrEqual(0);
              expect(firstIndex).toBeLessThan(secondIndex);
            }
          );
        }
      );
    }
  );

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Convention code examples render as mermaid blocks
  // ──────────────────────────────────────────────────────────────────────

  Rule('Convention code examples render as mermaid blocks', ({ RuleScenario }) => {
    RuleScenario(
      'Convention with mermaid content produces mermaid block in output',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('a MasterDataset with a convention pattern with a mermaid diagram', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'MermaidConvention',
                convention: ['fsm-rules'],
                rules: [
                  {
                    name: 'FSM Diagram',
                    description: [
                      'The FSM enforces valid state transitions.',
                      '',
                      '"""mermaid',
                      'stateDiagram-v2',
                      '    [*] --> roadmap',
                      '    roadmap --> active',
                      '    active --> completed',
                      '"""',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });
      }
    );

    RuleScenario('Summary level omits convention code examples', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with convention tags {string} and behavior tags {string}',
        (_ctx: unknown, convTags: string, behTags: string) => {
          state!.config = makeConfig(convTags, behTags);
        }
      );

      And('a MasterDataset with a convention pattern with a mermaid diagram', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'MermaidConventionSummary',
              convention: ['fsm-rules'],
              rules: [
                {
                  name: 'FSM Diagram',
                  description: [
                    'The FSM enforces valid state transitions.',
                    '',
                    '"""mermaid',
                    'stateDiagram-v2',
                    '    [*] --> roadmap',
                    '    roadmap --> active',
                    '"""',
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

      Then('the document does not contain a mermaid block', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks).toHaveLength(0);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Scoped diagrams are generated from diagramScope config
  // ──────────────────────────────────────────────────────────────────────

  Rule('Scoped diagrams are generated from diagramScope config', ({ RuleScenario }) => {
    RuleScenario(
      'Config with diagramScope produces mermaid block at detailed level',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with arch-annotated patterns in context {string}',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'LintRules',
                  archContext: context,
                  archRole: 'service',
                }),
                createTestPattern({
                  name: 'ProcessGuard',
                  archContext: context,
                  archRole: 'decider',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });
      }
    );

    RuleScenario(
      'Neighbor patterns appear in diagram with distinct style',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with arch patterns where lint uses validation', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'LintRules',
                archContext: 'lint',
                archRole: 'service',
                uses: ['DoDValidator'],
              }),
              createTestPattern({
                name: 'DoDValidator',
                archContext: 'validation',
                archRole: 'service',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content contains {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text);
        });

        And('the mermaid diagram includes a Related subgraph', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain('Related');
        });

        And('the mermaid diagram includes dashed neighbor styling', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain('classDef neighbor');
        });
      }
    );

    RuleScenario(
      'Config without diagramScope produces no diagram section',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a MasterDataset with arch-annotated patterns in context {string}',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ConventionADR',
                  convention: ['fsm-rules'],
                  archContext: context,
                  rules: [
                    {
                      name: 'FSM Rule',
                      description: '**Invariant:** Valid transitions only.',
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

        Then(
          'the document does not have a heading {string}',
          (_ctx: unknown, headingText: string) => {
            const headings = findHeadings(state!.document!);
            const match = headings.some((h) => h.text.includes(headingText));
            expect(match).toBe(false);
          }
        );
      }
    );

    RuleScenario(
      'archLayer filter selects patterns by architectural layer',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archLayer {string}',
          (_ctx: unknown, layer: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archLayer: [layer] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with patterns in domain and infrastructure layers', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'DomainPattern',
                archContext: 'orders',
                archLayer: 'domain',
                archRole: 'decider',
              }),
              createTestPattern({
                name: 'InfraPattern',
                archContext: 'orders',
                archLayer: 'infrastructure',
                archRole: 'repository',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content contains {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text);
        });

        And('the mermaid content does not contain {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).not.toContain(text);
        });
      }
    );

    RuleScenario('archLayer and archContext compose via OR', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScope archLayer {string} and archContext {string}',
        (_ctx: unknown, layer: string, context: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScope: { archLayer: [layer], archContext: [context] },
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a MasterDataset with a domain-layer pattern and a shared-context pattern', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'DomainPattern',
              archContext: 'orders',
              archLayer: 'domain',
              archRole: 'decider',
            }),
            createTestPattern({
              name: 'SharedPattern',
              archContext: 'shared',
              archLayer: 'application',
              archRole: 'service',
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

      Then('the document contains a mermaid block', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
      });

      And(
        'the mermaid content contains both {string} and {string}',
        (_ctx: unknown, text1: string, text2: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text1);
          expect(content).toContain(text2);
        }
      );
    });

    RuleScenario('Summary level omits scoped diagram', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScope archContext {string}',
        (_ctx: unknown, context: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScope: { archContext: [context] },
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a MasterDataset with arch-annotated patterns in context {string}',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'LintRules',
                archContext: context,
                archRole: 'service',
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

      Then('the document does not contain a mermaid block', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks).toHaveLength(0);
      });
    });

    RuleScenario(
      'archView filter selects patterns by view membership',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archView {string}',
          (_ctx: unknown, viewName: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archView: [viewName] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with patterns in arch view {string}',
          (_ctx: unknown, viewName: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'PatternScanner',
                  archContext: 'scanner',
                  archRole: 'infrastructure',
                  archView: [viewName],
                }),
                createTestPattern({
                  name: 'DocExtractor',
                  archContext: 'extractor',
                  archRole: 'service',
                  archView: [viewName],
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content contains {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text);
        });
      }
    );

    RuleScenario('Multiple filter dimensions OR together', ({ Given, And, When, Then }) => {
      Given('a reference config with diagramScope combining archContext and archView', () => {
        state!.config = {
          title: 'Test Reference Document',
          conventionTags: [],
          shapeSources: [],
          behaviorCategories: [],
          diagramScope: { archContext: ['lint'], archView: ['pipeline-stages'] },
          claudeMdSection: 'test',
          docsFilename: 'TEST-REFERENCE.md',
          claudeMdFilename: 'test.md',
        };
      });

      And(
        'a MasterDataset where one pattern matches archContext and another matches archView',
        () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'LintRules',
                archContext: 'lint',
                archRole: 'service',
              }),
              createTestPattern({
                name: 'DocExtractor',
                archContext: 'extractor',
                archRole: 'service',
                archView: ['pipeline-stages'],
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

      Then('the document contains a mermaid block', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
      });

      And(
        'the mermaid content contains both {string} and {string}',
        (_ctx: unknown, text1: string, text2: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text1);
          expect(content).toContain(text2);
        }
      );
    });

    RuleScenario(
      'Explicit pattern names filter selects named patterns',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope patterns {string}',
          (_ctx: unknown, patternName: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { patterns: [patternName] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with multiple arch-annotated patterns', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'LintRules',
                archContext: 'lint',
                archRole: 'service',
              }),
              createTestPattern({
                name: 'DocExtractor',
                archContext: 'extractor',
                archRole: 'service',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content contains {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text);
        });

        And('the mermaid content does not contain {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).not.toContain(text);
        });
      }
    );

    RuleScenario(
      'Self-contained scope produces no Related subgraph',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with self-contained lint patterns', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'LintRules',
                archContext: 'lint',
                archRole: 'service',
                uses: ['ProcessGuard'],
              }),
              createTestPattern({
                name: 'ProcessGuard',
                archContext: 'lint',
                archRole: 'decider',
                uses: ['LintRules'],
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content does not contain {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).not.toContain(text);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Multiple diagram scopes produce multiple mermaid blocks
  // ──────────────────────────────────────────────────────────────────────

  Rule('Multiple diagram scopes produce multiple mermaid blocks', ({ RuleScenario }) => {
    RuleScenario(
      'Config with diagramScopes array produces multiple diagrams',
      ({ Given, And, When, Then }) => {
        Given('a reference config with two diagramScopes', () => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScopes: [
              {
                archView: ['codec-transformation'],
                title: 'Codec Transformation',
                direction: 'TB',
              },
              { archView: ['pipeline-stages'], title: 'Pipeline Data Flow', direction: 'LR' },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        });

        And('a MasterDataset with patterns in two different arch views', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'SessionCodec',
                archContext: 'renderer',
                archRole: 'projection',
                archView: ['codec-transformation'],
              }),
              createTestPattern({
                name: 'PatternScanner',
                archContext: 'scanner',
                archRole: 'infrastructure',
                archView: ['pipeline-stages'],
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

        Then('the document contains {int} mermaid blocks', (_ctx: unknown, count: number) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks).toHaveLength(count);
        });

        And(
          'the document has headings {string} and {string}',
          (_ctx: unknown, heading1: string, heading2: string) => {
            const headings = findHeadings(state!.document!);
            const has1 = headings.some((h) => h.text.includes(heading1));
            const has2 = headings.some((h) => h.text.includes(heading2));
            expect(has1).toBe(true);
            expect(has2).toBe(true);
          }
        );
      }
    );

    RuleScenario(
      'Diagram direction is reflected in mermaid output',
      ({ Given, And, When, Then }) => {
        Given('a reference config with LR direction diagramScope', () => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScopes: [
              { archView: ['pipeline-stages'], title: 'Pipeline Data Flow', direction: 'LR' },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        });

        And(
          'a MasterDataset with patterns in arch view {string}',
          (_ctx: unknown, viewName: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'PatternScanner',
                  archContext: 'scanner',
                  archRole: 'infrastructure',
                  archView: [viewName],
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content contains {string}', (_ctx: unknown, text: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain(text);
        });
      }
    );

    RuleScenario(
      'Legacy diagramScope still works when diagramScopes is absent',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with arch-annotated patterns in context {string}',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'LintRules',
                  archContext: context,
                  archRole: 'service',
                }),
                createTestPattern({
                  name: 'ProcessGuard',
                  archContext: context,
                  archRole: 'decider',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Deep behavior rendering with structured annotations
  // ──────────────────────────────────────────────────────────────────────

  Rule('Deep behavior rendering with structured annotations', ({ RuleScenario }) => {
    RuleScenario(
      'Detailed level renders structured behavior rules',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('a MasterDataset with a behavior pattern with structured rules', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'BehaviorSpec',
                category: 'process-guard',
                description: 'Validates delivery workflow.',
                rules: [
                  {
                    name: 'Invariant Rule',
                    description: [
                      '**Invariant:** Must follow FSM transitions.',
                      '',
                      '**Rationale:** Prevents state corruption.',
                      '',
                      '**Verified by:** Scenario A, Scenario B',
                    ].join('\n'),
                    scenarioCount: 2,
                    scenarioNames: ['Scenario A', 'Scenario B'],
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

        Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });

        And('the document contains text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain(text);
        });

        And('the rendered output includes rationale {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain(text);
        });

        And(
          'the document contains a verified-by list with {string} and {string}',
          (_ctx: unknown, item1: string, item2: string) => {
            const lists = findLists(state!.document!);
            expect(lists.length).toBeGreaterThanOrEqual(1);
            const allItems = lists.flatMap((l) =>
              l.items.map((i) => (typeof i === 'string' ? i : i.text))
            );
            expect(allItems).toContain(item1);
            expect(allItems).toContain(item2);
          }
        );
      }
    );

    RuleScenario(
      'Standard level renders behavior rules without rationale',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('a MasterDataset with a behavior pattern with structured rules', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'BehaviorSpecStd',
                category: 'process-guard',
                description: 'Validates delivery workflow.',
                rules: [
                  {
                    name: 'Invariant Rule',
                    description: [
                      '**Invariant:** Must follow FSM transitions.',
                      '',
                      '**Rationale:** Prevents state corruption.',
                      '',
                      '**Verified by:** Scenario A, Scenario B',
                    ].join('\n'),
                    scenarioCount: 2,
                    scenarioNames: ['Scenario A', 'Scenario B'],
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

        Then('the document has a heading {string}', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text.includes(headingText));
          expect(match).toBe(true);
        });

        And('the document contains text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain(text);
        });

        And('the document does not contain text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).not.toContain(text);
        });
      }
    );

    RuleScenario(
      'Summary level shows behavior rules as truncated table',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And('a MasterDataset with a behavior pattern with structured rules', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'BehaviorSpecSum',
                category: 'process-guard',
                description: 'Validates delivery workflow.',
                rules: [
                  {
                    name: 'Invariant Rule',
                    description: [
                      '**Invariant:** Must follow FSM transitions.',
                      '',
                      '**Rationale:** Prevents state corruption.',
                    ].join('\n'),
                    scenarioCount: 2,
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

        And(
          'the document does not have a heading {string}',
          (_ctx: unknown, headingText: string) => {
            const headings = findHeadings(state!.document!);
            const match = headings.some((h) => h.text.includes(headingText));
            expect(match).toBe(false);
          }
        );
      }
    );

    RuleScenario(
      'Scenario names and verifiedBy merge as deduplicated list',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a MasterDataset with a behavior pattern with overlapping scenarioNames and verifiedBy',
          () => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'BehaviorSpecDedup',
                  category: 'process-guard',
                  description: 'Validates delivery workflow.',
                  rules: [
                    {
                      name: 'Dedup Rule',
                      description: [
                        '**Invariant:** Must follow FSM.',
                        '',
                        '**Verified by:** Scenario A, Scenario B',
                      ].join('\n'),
                      scenarioCount: 3,
                      scenarioNames: ['Scenario A', 'Scenario C'],
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
          'the document contains a verified-by list with {int} unique entries',
          (_ctx: unknown, expectedCount: number) => {
            const lists = findLists(state!.document!);
            expect(lists.length).toBeGreaterThanOrEqual(1);
            const allItems = lists.flatMap((l) =>
              l.items.map((i) => (typeof i === 'string' ? i : i.text))
            );
            // Scenario A (from both sources, deduped), Scenario B (from verifiedBy), Scenario C (from scenarioNames)
            expect(allItems).toHaveLength(expectedCount);
          }
        );
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Shape JSDoc prose renders at standard and detailed levels
  // ──────────────────────────────────────────────────────────────────────

  Rule('Shape JSDoc prose renders at standard and detailed levels', ({ RuleScenario }) => {
    RuleScenario(
      'Standard level includes JSDoc paragraph before code blocks',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with shapeSources {string}',
          (_ctx: unknown, shapeSources: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: shapeSources.split(',').map((s) => s.trim()),
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with a shape pattern with JSDoc', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ShapeWithDoc',
                filePath: 'src/lint/rules.ts',
                extractedShapes: [
                  {
                    name: 'DeciderInput',
                    kind: 'interface',
                    sourceText: 'export interface DeciderInput { state: ProcessState; }',
                    jsDoc: 'Input to the process guard decider function.',
                    lineNumber: 10,
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

        Then('the document contains text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain(text);
        });
      }
    );

    RuleScenario(
      'Detailed level includes JSDoc paragraph and property table',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with shapeSources {string}',
          (_ctx: unknown, shapeSources: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: shapeSources.split(',').map((s) => s.trim()),
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with a shape pattern with JSDoc and property docs', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ShapeWithDocAndProps',
                filePath: 'src/lint/rules.ts',
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
                      { name: 'state', jsDoc: 'Current process state' },
                      { name: 'changes', jsDoc: 'Staged changes to validate' },
                    ],
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

        And('the document has at least {int} table', (_ctx: unknown, minCount: number) => {
          const tables = findTables(state!.document!);
          expect(tables.length).toBeGreaterThanOrEqual(minCount);
        });
      }
    );

    RuleScenario('Shapes without JSDoc render code blocks only', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with shapeSources {string}',
        (_ctx: unknown, shapeSources: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: shapeSources.split(',').map((s) => s.trim()),
            behaviorCategories: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a MasterDataset with a shape pattern without JSDoc', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'ShapeNoDoc',
              filePath: 'src/lint/rules.ts',
              extractedShapes: [
                {
                  name: 'SimpleType',
                  kind: 'type',
                  sourceText: 'export type SimpleType = string;',
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

      Then('the document does not contain text {string}', (_ctx: unknown, text: string) => {
        const rendered = getRenderedMarkdown();
        expect(rendered).not.toContain(text);
      });

      And('the document contains a code block with {string}', (_ctx: unknown, language: string) => {
        const codeBlocks = findBlocksByType(state!.document!, 'code');
        const match = codeBlocks.some((b) => b.language === language);
        expect(match).toBe(true);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Shape sections render param returns and throws documentation
  // ──────────────────────────────────────────────────────────────────────

  Rule('Shape sections render param returns and throws documentation', ({ RuleScenario }) => {
    RuleScenario(
      'Detailed level renders param table for function shapes',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with shapeSources {string}',
          (_ctx: unknown, shapeSources: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: shapeSources.split(',').map((s) => s.trim()),
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with a function shape with param docs', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'FuncWithParams',
                filePath: 'src/lint/process.ts',
                extractedShapes: [
                  {
                    name: 'processOrder',
                    kind: 'function',
                    sourceText:
                      'export function processOrder(orderId: string, quantity: number): OrderResult { }',
                    jsDoc: 'Process an order with validation.',
                    lineNumber: 10,
                    exported: true,
                    params: [
                      {
                        name: 'orderId',
                        type: 'string',
                        description: 'The unique order identifier',
                      },
                      {
                        name: 'quantity',
                        type: 'number',
                        description: 'Number of items to process',
                      },
                    ],
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

        Then(
          'the document has a table with columns {string} and {string} and {string}',
          (_ctx: unknown, col1: string, col2: string, col3: string) => {
            const tables = findTables(state!.document!);
            const match = tables.some(
              (t) =>
                t.columns.includes(col1) && t.columns.includes(col2) && t.columns.includes(col3)
            );
            expect(match).toBe(true);
          }
        );

        And(
          'the table contains param {string} with description {string}',
          (_ctx: unknown, paramName: string, description: string) => {
            const tables = findTables(state!.document!);
            const paramTable = tables.find((t) => t.columns.includes('Parameter'));
            expect(paramTable).toBeDefined();
            const row = paramTable!.rows.find((r) => r[0] === paramName);
            expect(row).toBeDefined();
            expect(row![2]).toContain(description);
          }
        );
      }
    );

    RuleScenario(
      'Detailed level renders returns and throws documentation',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with shapeSources {string}',
          (_ctx: unknown, shapeSources: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: shapeSources.split(',').map((s) => s.trim()),
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with a function shape with returns and throws docs', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'FuncWithReturnsThrows',
                filePath: 'src/lint/validate.ts',
                extractedShapes: [
                  {
                    name: 'validate',
                    kind: 'function',
                    sourceText: 'export function validate(data: string): boolean { }',
                    jsDoc: 'Validate input data.',
                    lineNumber: 5,
                    exported: true,
                    returns: { type: 'boolean', description: 'The processed result' },
                    throws: [
                      { type: 'ValidationError', description: 'When input fails schema check' },
                      { type: 'TypeError', description: 'When input is not a string' },
                    ],
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

        Then('the rendered output contains returns paragraph with type and description', () => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain('Returns');
          expect(rendered).toContain('The processed result');
        });

        And(
          'the document has a table with columns {string} and {string}',
          (_ctx: unknown, col1: string, col2: string) => {
            const tables = findTables(state!.document!);
            const match = tables.some((t) => t.columns.includes(col1) && t.columns.includes(col2));
            expect(match).toBe(true);
          }
        );
      }
    );

    RuleScenario(
      'Standard level renders param table without throws',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with shapeSources {string}',
          (_ctx: unknown, shapeSources: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: shapeSources.split(',').map((s) => s.trim()),
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with a function shape with param and throws docs', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'FuncWithParamThrows',
                filePath: 'src/lint/check.ts',
                extractedShapes: [
                  {
                    name: 'check',
                    kind: 'function',
                    sourceText: 'export function check(input: string): void { }',
                    jsDoc: 'Check input.',
                    lineNumber: 1,
                    exported: true,
                    params: [{ name: 'input', type: 'string', description: 'The input to check' }],
                    throws: [{ type: 'CheckError', description: 'When check fails' }],
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

        Then(
          'the document has a table with columns {string} and {string} and {string}',
          (_ctx: unknown, col1: string, col2: string, col3: string) => {
            const tables = findTables(state!.document!);
            const match = tables.some(
              (t) =>
                t.columns.includes(col1) && t.columns.includes(col2) && t.columns.includes(col3)
            );
            expect(match).toBe(true);
          }
        );

        And(
          'the document does not have a table with column {string}',
          (_ctx: unknown, colName: string) => {
            const tables = findTables(state!.document!);
            const match = tables.some((t) => t.columns.includes(colName));
            expect(match).toBe(false);
          }
        );
      }
    );

    RuleScenario('Shapes without param docs skip param table', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with shapeSources {string}',
        (_ctx: unknown, shapeSources: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: shapeSources.split(',').map((s) => s.trim()),
            behaviorCategories: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a MasterDataset with a shape pattern with JSDoc', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'ShapeNoParams',
              filePath: 'src/lint/types.ts',
              extractedShapes: [
                {
                  name: 'ConfigType',
                  kind: 'interface',
                  sourceText: 'export interface ConfigType { timeout: number; }',
                  jsDoc: 'Configuration type.',
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

      Then(
        'the document does not have a table with column {string}',
        (_ctx: unknown, colName: string) => {
          const tables = findTables(state!.document!);
          const match = tables.some((t) => t.columns.includes(colName));
          expect(match).toBe(false);
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Standard detail level includes narrative but omits rationale
  // ──────────────────────────────────────────────────────────────────────

  Rule('Standard detail level includes narrative but omits rationale', ({ RuleScenario }) => {
    RuleScenario(
      'Standard level includes narrative but omits rationale',
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
                name: 'DetailPatternStandard',
                convention: ['fsm-rules'],
                rules: [
                  {
                    name: 'Standard Test Rule',
                    description: [
                      'This is the narrative content that explains details.',
                      '',
                      '**Invariant:** Must follow FSM.',
                      '',
                      '**Rationale:** Prevents corruption.',
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

        Then('the document contains narrative text', () => {
          const rendered = getRenderedMarkdown();
          expect(rendered).toContain('narrative content that explains');
        });

        And('the document does not contain text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown();
          expect(rendered).not.toContain(text);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Diagram type controls Mermaid output format
  // ──────────────────────────────────────────────────────────────────────

  Rule('Diagram type controls Mermaid output format', ({ RuleScenario }) => {
    RuleScenario('Default diagramType produces flowchart', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScope archContext {string}',
        (_ctx: unknown, context: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScope: { archContext: [context] },
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a MasterDataset with arch-annotated patterns in context {string}',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'OrderHandler',
                archContext: context,
                archRole: 'command-handler',
              }),
              createTestPattern({
                name: 'OrderProjection',
                archContext: context,
                archRole: 'projection',
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

      Then('the document contains a mermaid block', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
      });

      And('the mermaid content starts with {string}', (_ctx: unknown, prefix: string) => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        expect(mermaidBlocks[0]!.content.trimStart().startsWith(prefix)).toBe(true);
      });
    });

    RuleScenario(
      'Sequence diagram renders participant-message format',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string} and diagramType {string}',
          (_ctx: unknown, context: string, diagramType: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: {
                archContext: [context],
                diagramType: diagramType as 'sequenceDiagram',
              },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'OrderService',
                  archContext: context,
                  archRole: 'service',
                  uses: ['InventoryService'],
                }),
                createTestPattern({
                  name: 'InventoryService',
                  archContext: context,
                  archRole: 'service',
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

        Then('the document contains a mermaid block', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        });

        And('the mermaid content starts with {string}', (_ctx: unknown, prefix: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks[0]!.content.trimStart().startsWith(prefix)).toBe(true);
        });

        And(
          'the mermaid content contains {string} declarations',
          (_ctx: unknown, keyword: string) => {
            const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
            expect(mermaidBlocks[0]!.content).toContain(keyword);
          }
        );

        And('the mermaid content contains message arrows between participants', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          const content = mermaidBlocks[0]!.content;
          // Sequence diagram arrows: ->>, -->>, --)
          expect(content).toMatch(/->>|-->>|--\)/);
        });
      }
    );

    RuleScenario('State diagram renders state transitions', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScope archContext {string} and diagramType {string}',
        (_ctx: unknown, context: string, diagramType: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScope: {
              archContext: [context],
              diagramType: diagramType as 'stateDiagram-v2',
            },
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a MasterDataset with patterns in context {string} with dependsOn relationships',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ValidationStep',
                archContext: context,
                archRole: 'service',
                dependsOn: ['InitStep'],
              }),
              createTestPattern({
                name: 'InitStep',
                archContext: context,
                archRole: 'service',
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

      Then('the document contains a mermaid block', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
      });

      And('the mermaid content starts with {string}', (_ctx: unknown, prefix: string) => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks[0]!.content.trimStart().startsWith(prefix)).toBe(true);
      });

      And('the mermaid content contains state transition syntax', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        const content = mermaidBlocks[0]!.content;
        // State diagram transitions: StateName --> OtherState
        expect(content).toMatch(/\w+ --> \w+/);
      });
    });

    RuleScenario(
      'Sequence diagram includes neighbor patterns as participants',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string} and diagramType {string}',
          (_ctx: unknown, context: string, diagramType: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: {
                archContext: [context],
                diagramType: diagramType as 'sequenceDiagram',
              },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a MasterDataset with an orders pattern that uses an external pattern', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'OrderService',
                archContext: 'orders',
                archRole: 'service',
                uses: ['PaymentGateway'],
              }),
              createTestPattern({
                name: 'PaymentGateway',
                archContext: 'payments',
                archRole: 'infrastructure',
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
          'the mermaid content contains participant declarations for both scope and neighbor patterns',
          () => {
            const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
            expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
            const content = mermaidBlocks[0]!.content;
            expect(content).toContain('OrderService');
            expect(content).toContain('PaymentGateway');
          }
        );
      }
    );

    RuleScenario('State diagram adds start and end pseudo-states', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScope archContext {string} and diagramType {string}',
        (_ctx: unknown, context: string, diagramType: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScope: {
              archContext: [context],
              diagramType: diagramType as 'stateDiagram-v2',
            },
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a MasterDataset with a linear dependsOn chain of workflow patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              name: 'StepC',
              archContext: 'workflow',
              archRole: 'service',
              dependsOn: ['StepB'],
            }),
            createTestPattern({
              name: 'StepB',
              archContext: 'workflow',
              archRole: 'service',
              dependsOn: ['StepA'],
            }),
            createTestPattern({
              name: 'StepA',
              archContext: 'workflow',
              archRole: 'service',
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

      Then('the mermaid content contains a start pseudo-state transition', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        expect(mermaidBlocks[0]!.content).toContain('[*] -->');
      });

      And('the mermaid content contains an end pseudo-state transition', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks[0]!.content).toContain('--> [*]');
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Edge labels and custom node shapes enrich diagram readability
  // ──────────────────────────────────────────────────────────────────────

  Rule('Edge labels and custom node shapes enrich diagram readability', ({ RuleScenario }) => {
    RuleScenario(
      'Relationship edges display type labels by default',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'ServiceA',
                  archContext: context,
                  archRole: 'service',
                  uses: ['ServiceB'],
                }),
                createTestPattern({
                  name: 'ServiceB',
                  archContext: context,
                  archRole: 'service',
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

        Then('the mermaid content contains labeled edges with relationship type text', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          // Labeled edge syntax: -->|uses|
          expect(content).toMatch(/-->\|.*\|/);
          expect(content).toContain('uses');
        });
      }
    );

    RuleScenario(
      'Edge labels can be disabled for compact diagrams',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string} and showEdgeLabels false',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context], showEdgeLabels: false },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'CompactA',
                  archContext: context,
                  archRole: 'service',
                  uses: ['CompactB'],
                }),
                createTestPattern({
                  name: 'CompactB',
                  archContext: context,
                  archRole: 'service',
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

        Then('the mermaid content contains unlabeled edges', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          // Unlabeled edge: --> without |label|
          expect(content).not.toMatch(/\|[^|]+\|/);
          expect(content).toContain('-->');
        });
      }
    );

    RuleScenario('archRole controls Mermaid node shape', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScope archContext {string}',
        (_ctx: unknown, context: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSources: [],
            behaviorCategories: [],
            diagramScope: { archContext: [context] },
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a MasterDataset with a service pattern and a projection pattern in context {string}',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'OrderService',
                archContext: context,
                archRole: 'service',
              }),
              createTestPattern({
                name: 'OrderProjection',
                archContext: context,
                archRole: 'projection',
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

      Then('the service node uses rounded rectangle syntax', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        const content = mermaidBlocks[0]!.content;
        // Rounded rectangle: ("label")
        expect(content).toMatch(/OrderService\(".*"\)/);
      });

      And('the projection node uses cylinder syntax', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        const content = mermaidBlocks[0]!.content;
        // Cylinder: [("label")]
        expect(content).toMatch(/OrderProjection\[\(".*"\)\]/);
      });
    });

    RuleScenario(
      'Pattern without archRole uses default rectangle shape',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { archContext: [context] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with a pattern without archRole in context {string}',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'PlainPattern',
                  archContext: context,
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

        Then('the node uses default rectangle syntax', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          const content = mermaidBlocks[0]!.content;
          // Default rectangle: ["label"]
          expect(content).toMatch(/PlainPattern\[".*"\]/);
        });
      }
    );
  });
});
