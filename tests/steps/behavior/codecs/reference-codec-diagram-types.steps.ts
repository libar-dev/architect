/**
 * Step definitions for Reference Codec - Diagram Type Rendering tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type ReferenceCodecState,
  initState,
  createReferenceCodec,
  createTestPattern,
  createTestPatternGraph,
  findBlocksByType,
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
  'tests/features/behavior/codecs/reference-codec-diagram-types.feature'
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
  // Rule: Diagram type controls Mermaid output format
  // ──────────────────────────────────────────────────────────────────────

  Rule('Diagram type controls Mermaid output format', ({ RuleScenario }) => {
    RuleScenario('Default diagramType produces flowchart', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScopes archContext {string}',
        (_ctx: unknown, context: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            diagramScopes: [{ archContext: [context] }],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a PatternGraph with arch-annotated patterns in context {string}',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestPatternGraph({
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
          'a reference config with diagramScopes archContext {string} and diagramType {string}',
          (_ctx: unknown, context: string, diagramType: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [
                {
                  archContext: [context],
                  diagramType: diagramType as 'sequenceDiagram',
                },
              ],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a PatternGraph with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestPatternGraph({
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
        'a reference config with diagramScopes archContext {string} and diagramType {string}',
        (_ctx: unknown, context: string, diagramType: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            diagramScopes: [
              {
                archContext: [context],
                diagramType: diagramType as 'stateDiagram-v2',
              },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a PatternGraph with patterns in context {string} with dependsOn relationships',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestPatternGraph({
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
          'a reference config with diagramScopes archContext {string} and diagramType {string}',
          (_ctx: unknown, context: string, diagramType: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [
                {
                  archContext: [context],
                  diagramType: diagramType as 'sequenceDiagram',
                },
              ],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with an orders pattern that uses an external pattern', () => {
          state!.dataset = createTestPatternGraph({
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
        'a reference config with diagramScopes archContext {string} and diagramType {string}',
        (_ctx: unknown, context: string, diagramType: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            diagramScopes: [
              {
                archContext: [context],
                diagramType: diagramType as 'stateDiagram-v2',
              },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And('a PatternGraph with a linear dependsOn chain of workflow patterns', () => {
        state!.dataset = createTestPatternGraph({
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

    RuleScenario('C4 diagram renders system boundary format', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScopes archContext {string} and diagramType {string}',
        (_ctx: unknown, context: string, diagramType: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            diagramScopes: [
              {
                archContext: [context],
                diagramType: diagramType as 'C4Context',
              },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a PatternGraph with patterns in context {string} with uses relationships',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestPatternGraph({
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

      Then('the mermaid content starts with {string}', (_ctx: unknown, prefix: string) => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
        expect(mermaidBlocks[0]!.content.trimStart().startsWith(prefix)).toBe(true);
      });

      And(
        'the mermaid content contains a Boundary block for {string}',
        (_ctx: unknown, context: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain('Boundary(');
          expect(content).toContain(context.charAt(0).toUpperCase() + context.slice(1));
        }
      );

      And('the mermaid content contains System declarations', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks[0]!.content).toContain('System(');
      });

      And('the mermaid content contains Rel declarations', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks[0]!.content).toContain('Rel(');
      });
    });

    RuleScenario(
      'C4 diagram renders neighbor patterns as external systems',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScopes archContext {string} and diagramType {string}',
          (_ctx: unknown, context: string, diagramType: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [
                {
                  archContext: [context],
                  diagramType: diagramType as 'C4Context',
                },
              ],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And('a PatternGraph with an orders pattern that uses an external pattern', () => {
          state!.dataset = createTestPatternGraph({
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

        Then('the mermaid content contains a System_Ext declaration', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          expect(mermaidBlocks[0]!.content).toContain('System_Ext(');
        });
      }
    );

    RuleScenario(
      'Class diagram renders class members and relationships',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScopes archContext {string} and diagramType {string}',
          (_ctx: unknown, context: string, diagramType: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [
                {
                  archContext: [context],
                  diagramType: diagramType as 'classDiagram',
                },
              ],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a PatternGraph with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestPatternGraph({
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

        Then('the mermaid content starts with {string}', (_ctx: unknown, prefix: string) => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          expect(mermaidBlocks.length).toBeGreaterThanOrEqual(1);
          expect(mermaidBlocks[0]!.content.trimStart().startsWith(prefix)).toBe(true);
        });

        And('the mermaid content contains class declarations with members', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain('class ');
          expect(content).toContain('{');
        });

        And('the mermaid content contains relationship arrows', () => {
          const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
          const content = mermaidBlocks[0]!.content;
          expect(content).toContain('..>');
        });
      }
    );

    RuleScenario('Class diagram renders archRole as stereotype', ({ Given, And, When, Then }) => {
      Given(
        'a reference config with diagramScopes archContext {string} and diagramType {string}',
        (_ctx: unknown, context: string, diagramType: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            diagramScopes: [
              {
                archContext: [context],
                diagramType: diagramType as 'classDiagram',
              },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a PatternGraph with a service pattern and a projection pattern in context {string}',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestPatternGraph({
            patterns: [
              createTestPattern({
                name: 'OrderHandler',
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

      Then('the mermaid content contains a service stereotype', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks[0]!.content).toContain('<<service>>');
      });

      And('the mermaid content contains a projection stereotype', () => {
        const mermaidBlocks = findBlocksByType(state!.document!, 'mermaid');
        expect(mermaidBlocks[0]!.content).toContain('<<projection>>');
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
          'a reference config with diagramScopes archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [{ archContext: [context] }],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a PatternGraph with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestPatternGraph({
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
          'a reference config with diagramScopes archContext {string} and showEdgeLabels false',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [{ archContext: [context], showEdgeLabels: false }],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a PatternGraph with patterns in context {string} with uses relationships',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestPatternGraph({
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
        'a reference config with diagramScopes archContext {string}',
        (_ctx: unknown, context: string) => {
          state!.config = {
            title: 'Test Reference Document',
            conventionTags: [],
            shapeSelectors: [],
            behaviorCategories: [],
            diagramScopes: [{ archContext: [context] }],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        }
      );

      And(
        'a PatternGraph with a service pattern and a projection pattern in context {string}',
        (_ctx: unknown, context: string) => {
          state!.dataset = createTestPatternGraph({
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
          'a reference config with diagramScopes archContext {string}',
          (_ctx: unknown, context: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSelectors: [],
              behaviorCategories: [],
              diagramScopes: [{ archContext: [context] }],
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a PatternGraph with a pattern without archRole in context {string}',
          (_ctx: unknown, context: string) => {
            state!.dataset = createTestPatternGraph({
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
