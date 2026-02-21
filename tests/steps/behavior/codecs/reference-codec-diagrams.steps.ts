/**
 * Step definitions for Reference Codec - Diagram Scoping tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type ReferenceCodecState,
  initState,
  makeConfig,
  createReferenceCodec,
  createTestPattern,
  createTestMasterDataset,
  findHeadings,
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
  'tests/features/behavior/codecs/reference-codec-diagrams.feature'
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
      'include filter selects patterns by include tag membership',
      ({ Given, And, When, Then }) => {
        Given(
          'a reference config with diagramScope include {string}',
          (_ctx: unknown, viewName: string) => {
            state!.config = {
              title: 'Test Reference Document',
              conventionTags: [],
              shapeSources: [],
              behaviorCategories: [],
              diagramScope: { include: [viewName] },
              claudeMdSection: 'test',
              docsFilename: 'TEST-REFERENCE.md',
              claudeMdFilename: 'test.md',
            };
          }
        );

        And(
          'a MasterDataset with patterns in include {string}',
          (_ctx: unknown, viewName: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'PatternScanner',
                  archContext: 'scanner',
                  archRole: 'infrastructure',
                  include: [viewName],
                }),
                createTestPattern({
                  name: 'DocExtractor',
                  archContext: 'extractor',
                  archRole: 'service',
                  include: [viewName],
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

    RuleScenario('Multiple filter dimensions OR together', ({ Given, And, When, Then }) => {
      Given('a reference config with diagramScope combining archContext and include', () => {
        state!.config = {
          title: 'Test Reference Document',
          conventionTags: [],
          shapeSources: [],
          behaviorCategories: [],
          diagramScope: { archContext: ['lint'], include: ['pipeline-stages'] },
          claudeMdSection: 'test',
          docsFilename: 'TEST-REFERENCE.md',
          claudeMdFilename: 'test.md',
        };
      });

      And(
        'a MasterDataset where one pattern matches archContext and another matches include',
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
                include: ['pipeline-stages'],
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
                include: ['codec-transformation'],
                title: 'Codec Transformation',
                direction: 'TB',
              },
              { include: ['pipeline-stages'], title: 'Pipeline Data Flow', direction: 'LR' },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        });

        And('a MasterDataset with patterns in two different include groups', () => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'SessionCodec',
                archContext: 'renderer',
                archRole: 'projection',
                include: ['codec-transformation'],
              }),
              createTestPattern({
                name: 'PatternScanner',
                archContext: 'scanner',
                archRole: 'infrastructure',
                include: ['pipeline-stages'],
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
              { include: ['pipeline-stages'], title: 'Pipeline Data Flow', direction: 'LR' },
            ],
            claudeMdSection: 'test',
            docsFilename: 'TEST-REFERENCE.md',
            claudeMdFilename: 'test.md',
          };
        });

        And(
          'a MasterDataset with patterns in include {string}',
          (_ctx: unknown, viewName: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'PatternScanner',
                  archContext: 'scanner',
                  archRole: 'infrastructure',
                  include: [viewName],
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
});
