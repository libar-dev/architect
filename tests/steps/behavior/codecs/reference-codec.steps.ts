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
});
