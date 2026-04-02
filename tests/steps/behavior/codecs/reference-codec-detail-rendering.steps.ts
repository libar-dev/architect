/**
 * Step definitions for Reference Codec - Detail Level Rendering tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type ReferenceCodecState,
  initState,
  makeConfig,
  getRenderedMarkdown,
  createReferenceCodec,
  createTestPattern,
  createTestPatternGraph,
  findHeadings,
  findLists,
  findParagraphs,
  findTables,
  findBlocksByType,
  findCollapsibles,
  findLinkOuts,
  type DetailLevel,
  type RenderableDocument,
} from '../../../support/helpers/reference-codec-state.js';

// ============================================================================
// State
// ============================================================================

let state: ReferenceCodecState | null = null;

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature(
  'tests/features/behavior/codecs/reference-codec-detail-rendering.feature'
);

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

        And('a PatternGraph with a convention pattern with narrative and rationale', () => {
          state!.dataset = createTestPatternGraph({
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
          const rendered = getRenderedMarkdown(state!);
          expect(rendered).toContain('narrative content that explains');
        });

        And('the document does not contain text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown(state!);
          expect(rendered).not.toContain(text);
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

        And('a PatternGraph with a behavior pattern with structured rules', () => {
          state!.dataset = createTestPatternGraph({
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
          const rendered = getRenderedMarkdown(state!);
          expect(rendered).toContain(text);
        });

        And('the rendered output includes rationale {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown(state!);
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

        And('a PatternGraph with a behavior pattern with structured rules', () => {
          state!.dataset = createTestPatternGraph({
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
          const rendered = getRenderedMarkdown(state!);
          expect(rendered).toContain(text);
        });

        And('the document does not contain text {string}', (_ctx: unknown, text: string) => {
          const rendered = getRenderedMarkdown(state!);
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

        And('a PatternGraph with a behavior pattern with structured rules', () => {
          state!.dataset = createTestPatternGraph({
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
          'a PatternGraph with a behavior pattern with overlapping scenarioNames and verifiedBy',
          () => {
            state!.dataset = createTestPatternGraph({
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
    RuleScenario('Standard level includes JSDoc in code blocks', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with source selector {string}',
        (_ctx: unknown, shapeSource: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [{ source: shapeSource }],
            behaviorCategories: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a PatternGraph with a shape pattern with JSDoc', () => {
        state!.dataset = createTestPatternGraph({
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
        const rendered = getRenderedMarkdown(state!);
        expect(rendered).toContain(text);
      });
    });

    RuleScenario(
      'Detailed level includes JSDoc in code block and property table',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with source selector {string}',
          (_ctx: unknown, shapeSource: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [{ source: shapeSource }],
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with a shape pattern with JSDoc and property docs', () => {
          state!.dataset = createTestPatternGraph({
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
          const rendered = getRenderedMarkdown(state!);
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
        'a reference config with source selector {string}',
        (_ctx: unknown, shapeSource: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [{ source: shapeSource }],
            behaviorCategories: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a PatternGraph with a shape pattern without JSDoc', () => {
        state!.dataset = createTestPatternGraph({
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
        const rendered = getRenderedMarkdown(state!);
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
          'a reference config with source selector {string}',
          (_ctx: unknown, shapeSource: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [{ source: shapeSource }],
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with a function shape with param docs', () => {
          state!.dataset = createTestPatternGraph({
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
          'a reference config with source selector {string}',
          (_ctx: unknown, shapeSource: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [{ source: shapeSource }],
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with a function shape with returns and throws docs', () => {
          state!.dataset = createTestPatternGraph({
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
          const rendered = getRenderedMarkdown(state!);
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
          'a reference config with source selector {string}',
          (_ctx: unknown, shapeSource: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [{ source: shapeSource }],
              behaviorCategories: [],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with a function shape with param and throws docs', () => {
          state!.dataset = createTestPatternGraph({
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
        'a reference config with source selector {string}',
        (_ctx: unknown, shapeSource: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [{ source: shapeSource }],
            behaviorCategories: [],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a PatternGraph with a shape pattern with JSDoc', () => {
        state!.dataset = createTestPatternGraph({
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
  // Rule: Collapsible blocks wrap behavior rules for progressive disclosure
  // ──────────────────────────────────────────────────────────────────────

  Rule('Collapsible blocks wrap behavior rules for progressive disclosure', ({ RuleScenario }) => {
    RuleScenario(
      'Behavior pattern with many rules uses collapsible blocks at detailed level',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a PatternGraph with a behavior pattern with {int} structured rules',
          (_ctx: unknown, ruleCount: number) => {
            const rules = [];
            for (let i = 1; i <= ruleCount; i++) {
              rules.push({
                name: `Rule ${i}`,
                description: `**Invariant:** Must follow rule ${i}\n\n**Rationale:** Prevents issue ${i}`,
                scenarioCount: 2,
                scenarioNames: [`Scenario ${i}A`, `Scenario ${i}B`],
              });
            }
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'MultiRuleBehavior',
                  category: 'process-guard',
                  description: 'Pattern with multiple rules.',
                  rules,
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
          'the document contains at least {int} collapsible block',
          (_ctx: unknown, count: number) => {
            const blocks = findCollapsibles(state!.document!);
            expect(blocks.length).toBeGreaterThanOrEqual(count);
          }
        );

        And('each collapsible block summary includes a rule name', () => {
          const blocks = findCollapsibles(state!.document!);
          for (const block of blocks) {
            expect(block.summary).toMatch(/Rule \d+/);
          }
        });
      }
    );

    RuleScenario(
      'Behavior pattern with few rules does not use collapsible blocks',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a PatternGraph with a behavior pattern with {int} structured rules',
          (_ctx: unknown, ruleCount: number) => {
            const rules = [];
            for (let i = 1; i <= ruleCount; i++) {
              rules.push({
                name: `Rule ${i}`,
                description: `**Invariant:** Must follow rule ${i}\n\n**Rationale:** Prevents issue ${i}`,
                scenarioCount: 2,
                scenarioNames: [`Scenario ${i}A`, `Scenario ${i}B`],
              });
            }
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'FewRuleBehavior',
                  category: 'process-guard',
                  description: 'Pattern with few rules.',
                  rules,
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

        Then('the document does not contain collapsible blocks', () => {
          const blocks = findCollapsibles(state!.document!);
          expect(blocks.length).toBe(0);
        });
      }
    );

    RuleScenario(
      'Summary level never produces collapsible blocks',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a PatternGraph with a behavior pattern with {int} structured rules',
          (_ctx: unknown, ruleCount: number) => {
            const rules = [];
            for (let i = 1; i <= ruleCount; i++) {
              rules.push({
                name: `Rule ${i}`,
                description: `**Invariant:** Must follow rule ${i}`,
                scenarioCount: 0,
                scenarioNames: [],
              });
            }
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'SummaryBehavior',
                  category: 'process-guard',
                  description: 'Pattern for summary level.',
                  rules,
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

        Then('the document does not contain collapsible blocks', () => {
          const blocks = findCollapsibles(state!.document!);
          expect(blocks.length).toBe(0);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Link-out blocks provide source file cross-references
  // ──────────────────────────────────────────────────────────────────────

  Rule('Link-out blocks provide source file cross-references', ({ RuleScenario }) => {
    RuleScenario(
      'Behavior pattern includes source file link-out at detailed level',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with convention tags {string} and behavior tags {string}',
          (_ctx: unknown, convTags: string, behTags: string) => {
            state!.config = makeConfig(convTags, behTags);
          }
        );

        And(
          'a PatternGraph with a behavior pattern in category {string}',
          (_ctx: unknown, category: string) => {
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'LinkOutBehavior',
                  category,
                  description: 'Pattern for link-out testing.',
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
          'the document contains at least {int} link-out block',
          (_ctx: unknown, count: number) => {
            const blocks = findLinkOuts(state!.document!);
            expect(blocks.length).toBeGreaterThanOrEqual(count);
          }
        );

        And('the link-out path references a source file', () => {
          const blocks = findLinkOuts(state!.document!);
          expect(blocks.length).toBeGreaterThan(0);
          const hasSourceRef = blocks.some(
            (b) => b.path.endsWith('.ts') || b.path.endsWith('.feature')
          );
          expect(hasSourceRef).toBe(true);
        });
      }
    );

    RuleScenario('Standard level includes source file link-out', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with convention tags {string} and behavior tags {string}',
        (_ctx: unknown, convTags: string, behTags: string) => {
          state!.config = makeConfig(convTags, behTags);
        }
      );

      And(
        'a PatternGraph with a behavior pattern in category {string}',
        (_ctx: unknown, category: string) => {
          state!.dataset = createTestPatternGraph({
            patterns: [
              createTestPattern({
                name: 'LinkOutStandard',
                category,
                description: 'Pattern for standard level link-out.',
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
        'the document contains at least {int} link-out block',
        (_ctx: unknown, count: number) => {
          const blocks = findLinkOuts(state!.document!);
          expect(blocks.length).toBeGreaterThanOrEqual(count);
        }
      );
    });

    RuleScenario('Summary level omits link-out blocks', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with convention tags {string} and behavior tags {string}',
        (_ctx: unknown, convTags: string, behTags: string) => {
          state!.config = makeConfig(convTags, behTags);
        }
      );

      And(
        'a PatternGraph with a behavior pattern in category {string}',
        (_ctx: unknown, category: string) => {
          state!.dataset = createTestPatternGraph({
            patterns: [
              createTestPattern({
                name: 'LinkOutSummary',
                category,
                description: 'Pattern for summary level link-out.',
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

      Then('the document does not contain link-out blocks', () => {
        const blocks = findLinkOuts(state!.document!);
        expect(blocks.length).toBe(0);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Rule: Include tags route cross-cutting content into reference documents
  // ──────────────────────────────────────────────────────────────────────────

  Rule('Include tags route cross-cutting content into reference documents', ({ RuleScenario }) => {
    RuleScenario(
      'Include-tagged pattern appears in behavior section',
      ({ Given, And, When, Then }) => {
        Given('a reference config with includeTags {string}', (_ctx: unknown, tags: string) => {
          state = initState();
          state.config = {
            title: 'Test Reference',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            includeTags: tags.split(',').map((t) => t.trim()),
            claudeMdSection: 'test',
            docsFilename: 'TEST.md',
            claudeMdFilename: 'test.md',
          };
        });

        And(
          'a PatternGraph with a pattern that has include {string}',
          (_ctx: unknown, includeTag: string) => {
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'IncludedPattern',
                  category: 'core',
                  description: 'A pattern included via include tag.',
                  include: [includeTag],
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

        Then('the document has a heading {string}', (_ctx: unknown, heading: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text === heading);
          expect(match).toBe(true);
        });

        And('the document contains text {string}', (_ctx: unknown, text: string) => {
          const paras = findParagraphs(state!.document!);
          const match = paras.some((p) => p.text.includes(text));
          const headings = findHeadings(state!.document!);
          const headingMatch = headings.some((h) => h.text.includes(text));
          expect(match || headingMatch).toBe(true);
        });
      }
    );

    RuleScenario(
      'Include-tagged pattern is additive with category-selected patterns',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with behavior tags {string} and includeTags {string}',
          (_ctx: unknown, behTags: string, includeTags: string) => {
            state = initState();
            state.config = {
              title: 'Test Reference',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: behTags.split(',').map((t) => t.trim()),
              includeTags: includeTags.split(',').map((t) => t.trim()),
              claudeMdSection: 'test',
              docsFilename: 'TEST.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with a category pattern and an include-tagged pattern', () => {
          state!.dataset = createTestPatternGraph({
            patterns: [
              createTestPattern({
                name: 'LintPattern',
                category: 'lint',
                description: 'A pattern in the lint category.',
              }),
              createTestPattern({
                name: 'IncludedPattern',
                category: 'core',
                description: 'A pattern included via include tag.',
                include: ['reference-sample'],
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
          const paras = findParagraphs(state!.document!);
          const match = paras.some((p) => p.text.includes(text));
          const headings = findHeadings(state!.document!);
          const headingMatch = headings.some((h) => h.text.includes(text));
          expect(match || headingMatch).toBe(true);
        });

        And('the document contains text {string}', (_ctx: unknown, text: string) => {
          const paras = findParagraphs(state!.document!);
          const match = paras.some((p) => p.text.includes(text));
          const headings = findHeadings(state!.document!);
          const headingMatch = headings.some((h) => h.text.includes(text));
          expect(match || headingMatch).toBe(true);
        });
      }
    );

    RuleScenario(
      'Pattern without matching include tag is excluded',
      ({ Given, And, When, Then }) => {
        Given('a reference config with includeTags {string}', (_ctx: unknown, tags: string) => {
          state = initState();
          state.config = {
            title: 'Test Reference',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            includeTags: tags.split(',').map((t) => t.trim()),
            claudeMdSection: 'test',
            docsFilename: 'TEST.md',
            claudeMdFilename: 'test.md',
          };
        });

        And(
          'a PatternGraph with a pattern that has include {string}',
          (_ctx: unknown, includeTag: string) => {
            state!.dataset = createTestPatternGraph({
              patterns: [
                createTestPattern({
                  name: 'NonMatchingPattern',
                  category: 'core',
                  description: 'A pattern with non-matching include.',
                  include: [includeTag],
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

        Then('the document does not have a heading {string}', (_ctx: unknown, heading: string) => {
          const headings = findHeadings(state!.document!);
          const match = headings.some((h) => h.text === heading);
          expect(match).toBe(false);
        });
      }
    );
  });
});
