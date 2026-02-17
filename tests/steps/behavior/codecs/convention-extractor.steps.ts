/**
 * Step definitions for Convention Extractor tests
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import {
  extractConventions,
  type ConventionBundle,
} from '../../../../src/renderable/codecs/convention-extractor.js';
import { createTestPattern, resetPatternCounter } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';

// ============================================================================
// State
// ============================================================================

interface ConventionExtractorState {
  dataset: MasterDataset | null;
  result: ConventionBundle[];
}

function initState(): ConventionExtractorState {
  resetPatternCounter();
  return { dataset: null, result: [] };
}

let state: ConventionExtractorState | null = null;

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/convention-extractor.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a convention extractor test context', () => {
      state = initState();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Empty and missing inputs produce empty results
  // ──────────────────────────────────────────────────────────────────────

  Rule('Empty and missing inputs produce empty results', ({ RuleScenario }) => {
    RuleScenario('Empty convention tags returns empty array', ({ Given, When, Then }) => {
      Given('an empty MasterDataset', () => {
        state!.dataset = createTestMasterDataset({ patterns: [] });
      });

      When('extracting conventions for no tags', () => {
        state!.result = extractConventions(state!.dataset!, []);
      });

      Then('the convention result is empty', () => {
        expect(state!.result).toHaveLength(0);
      });
    });

    RuleScenario('No matching patterns returns empty array', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns but no convention tags', () => {
        state!.dataset = createTestMasterDataset({
          patterns: [createTestPattern({ name: 'PlainPattern' })],
        });
      });

      When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
        state!.result = extractConventions(state!.dataset!, [tag]);
      });

      Then('the convention result is empty', () => {
        expect(state!.result).toHaveLength(0);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Convention bundles are extracted from matching patterns
  // ──────────────────────────────────────────────────────────────────────

  Rule('Convention bundles are extracted from matching patterns', ({ RuleScenario }) => {
    RuleScenario(
      'Single pattern with one convention tag produces one bundle',
      ({ Given, When, Then, And }) => {
        Given('a pattern tagged with convention {string}', (_ctx: unknown, tag: string) => {
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'ADR004',
                convention: [tag],
                rules: [
                  {
                    name: 'Test Rule',
                    description: 'Test rule description',
                    scenarioCount: 0,
                    scenarioNames: [],
                  },
                ],
              }),
            ],
          });
        });

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('{int} convention bundle is returned', (_ctx: unknown, count: number) => {
          expect(state!.result).toHaveLength(count);
        });

        And('the bundle convention tag is {string}', (_ctx: unknown, expectedTag: string) => {
          expect(state!.result[0]!.conventionTag).toBe(expectedTag);
        });

        And('the bundle has {int} rule', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules).toHaveLength(count);
        });
      }
    );

    RuleScenario(
      'Pattern with CSV conventions contributes to multiple bundles',
      ({ Given, When, Then }) => {
        Given(
          'a pattern tagged with conventions {string} and {string}',
          (_ctx: unknown, tag1: string, tag2: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'MultiConvention',
                  convention: [tag1, tag2],
                  rules: [
                    {
                      name: 'Shared Rule',
                      description: 'Content',
                      scenarioCount: 0,
                      scenarioNames: [],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When(
          'extracting conventions for tags {string} and {string}',
          (_ctx: unknown, tag1: string, tag2: string) => {
            state!.result = extractConventions(state!.dataset!, [tag1, tag2]);
          }
        );

        Then('{int} convention bundles are returned', (_ctx: unknown, count: number) => {
          expect(state!.result).toHaveLength(count);
        });
      }
    );

    RuleScenario(
      'Multiple patterns with same convention merge into one bundle',
      ({ Given, And, When, Then }) => {
        Given(
          'a pattern {string} tagged with convention {string} with rule {string}',
          (_ctx: unknown, name: string, tag: string, ruleName: string) => {
            const pattern = createTestPattern({
              name,
              convention: [tag],
              rules: [
                {
                  name: ruleName,
                  description: `${ruleName} description`,
                  scenarioCount: 0,
                  scenarioNames: [],
                },
              ],
            });
            // Build dataset incrementally — store patterns
            if (!state!.dataset) {
              state!.dataset = createTestMasterDataset({ patterns: [pattern] });
            } else {
              state!.dataset = createTestMasterDataset({
                patterns: [...state!.dataset.patterns, pattern],
              });
            }
          }
        );

        And(
          'a pattern {string} tagged with convention {string} with rule {string}',
          (_ctx: unknown, name: string, tag: string, ruleName: string) => {
            const pattern = createTestPattern({
              name,
              convention: [tag],
              rules: [
                {
                  name: ruleName,
                  description: `${ruleName} description`,
                  scenarioCount: 0,
                  scenarioNames: [],
                },
              ],
            });
            state!.dataset = createTestMasterDataset({
              patterns: [...state!.dataset!.patterns, pattern],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('{int} convention bundle is returned', (_ctx: unknown, count: number) => {
          expect(state!.result).toHaveLength(count);
        });

        And('the bundle has {int} source decisions', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.sourceDecisions).toHaveLength(count);
        });

        And('the bundle has {int} rules', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules).toHaveLength(count);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Structured content is extracted from rule descriptions
  // ──────────────────────────────────────────────────────────────────────

  Rule('Structured content is extracted from rule descriptions', ({ RuleScenario }) => {
    RuleScenario(
      'Invariant and rationale are extracted from rule description',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern with convention {string} and rule description:',
          (_ctx: unknown, tag: string, docString: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'StructuredADR',
                  convention: [tag],
                  rules: [
                    {
                      name: 'Structured Rule',
                      description: docString,
                      scenarioCount: 2,
                      scenarioNames: ['Transition validation', 'State protection'],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('the first rule has invariant {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[0]!.invariant).toBe(expected);
        });

        And('the first rule has rationale {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[0]!.rationale).toBe(expected);
        });
      }
    );

    RuleScenario(
      'Tables in rule descriptions are extracted as structured data',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern with convention {string} and rule description:',
          (_ctx: unknown, tag: string, docString: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'TableADR',
                  convention: [tag],
                  rules: [
                    {
                      name: 'Table Rule',
                      description: docString,
                      scenarioCount: 0,
                      scenarioNames: [],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('the first rule has {int} table', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules[0]!.tables).toHaveLength(count);
        });

        And('the table has {int} data rows', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules[0]!.tables[0]!.rows).toHaveLength(count);
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Code examples in rule descriptions are preserved
  // ──────────────────────────────────────────────────────────────────────

  Rule('Code examples in rule descriptions are preserved', ({ RuleScenario }) => {
    RuleScenario(
      'Mermaid diagram in rule description is extracted as code example',
      ({ Given, When, Then, And }) => {
        Given(
          'a convention pattern with a mermaid diagram in tag {string}',
          (_ctx: unknown, tag: string) => {
            // Build description with """mermaid""" DocString programmatically
            // (cannot nest """ inside a Gherkin DocString)
            const description = [
              'The FSM enforces valid state transitions.',
              '',
              '"""mermaid',
              'stateDiagram-v2',
              '    [*] --> roadmap',
              '    roadmap --> active',
              '    active --> completed',
              '"""',
            ].join('\n');
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'MermaidADR',
                  convention: [tag],
                  rules: [
                    {
                      name: 'FSM Diagram Rule',
                      description,
                      scenarioCount: 0,
                      scenarioNames: [],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('the first rule has {int} code example', (_ctx: unknown, count: number) => {
          const rule = state!.result[0]!.rules[0]!;
          expect(rule.codeExamples).toBeDefined();
          expect(rule.codeExamples).toHaveLength(count);
        });

        And('the code example has language {string}', (_ctx: unknown, language: string) => {
          const example = state!.result[0]!.rules[0]!.codeExamples![0]!;
          expect(example.type).toBe('code');
          if (example.type === 'code') {
            expect(example.language).toBe(language);
          }
        });
      }
    );

    RuleScenario(
      'Rule description without code examples has no code examples field',
      ({ Given, When, Then }) => {
        Given(
          'a pattern with convention {string} and rule description:',
          (_ctx: unknown, tag: string, docString: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'PlainADR',
                  convention: [tag],
                  rules: [
                    {
                      name: 'Plain Rule',
                      description: docString,
                      scenarioCount: 0,
                      scenarioNames: [],
                    },
                  ],
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('the first rule has no code examples', () => {
          const rule = state!.result[0]!.rules[0]!;
          expect(rule.codeExamples).toBeUndefined();
        });
      }
    );
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: TypeScript JSDoc conventions are extracted alongside Gherkin
  // ──────────────────────────────────────────────────────────────────────

  Rule('TypeScript JSDoc conventions are extracted alongside Gherkin', ({ RuleScenario }) => {
    RuleScenario(
      'TypeScript pattern with heading sections produces multiple rules',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript pattern with convention {string} and heading sections',
          (_ctx: unknown, tag: string) => {
            // Build description with ## headings programmatically
            // (vitest-cucumber strips markdown headers from DocStrings)
            const description = [
              '## Valid State Transitions',
              '**Invariant:** Only defined FSM transitions are allowed.',
              '**Rationale:** Prevents state corruption.',
              '',
              '## Terminal States Are Immutable',
              '**Invariant:** Completed patterns cannot be modified without unlock.',
            ].join('\n');
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'TsConventionPattern',
                  convention: [tag],
                  description,
                  filePath: 'src/conventions/fsm-rules.ts',
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('{int} convention bundle is returned', (_ctx: unknown, count: number) => {
          expect(state!.result).toHaveLength(count);
        });

        And('the bundle has {int} rules', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules).toHaveLength(count);
        });

        And('the first rule name is {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[0]!.ruleName).toBe(expected);
        });

        And('the first rule has invariant {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[0]!.invariant).toBe(expected);
        });

        And('the second rule name is {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[1]!.ruleName).toBe(expected);
        });
      }
    );

    RuleScenario(
      'TypeScript pattern without headings becomes single rule',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript pattern {string} with convention {string} and description:',
          (_ctx: unknown, name: string, tag: string, docString: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name,
                  convention: [tag],
                  description: docString,
                  filePath: 'src/conventions/fsm-rules.ts',
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('{int} convention bundle is returned', (_ctx: unknown, count: number) => {
          expect(state!.result).toHaveLength(count);
        });

        And('the bundle has {int} rule', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules).toHaveLength(count);
        });

        And('the first rule name is {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[0]!.ruleName).toBe(expected);
        });

        And('the first rule has invariant {string}', (_ctx: unknown, expected: string) => {
          expect(state!.result[0]!.rules[0]!.invariant).toBe(expected);
        });
      }
    );

    RuleScenario(
      'TypeScript and Gherkin conventions merge in same bundle',
      ({ Given, And, When, Then }) => {
        Given(
          'a pattern {string} tagged with convention {string} with rule {string}',
          (_ctx: unknown, name: string, tag: string, ruleName: string) => {
            const pattern = createTestPattern({
              name,
              convention: [tag],
              rules: [
                {
                  name: ruleName,
                  description: `${ruleName} description`,
                  scenarioCount: 0,
                  scenarioNames: [],
                },
              ],
            });
            state!.dataset = createTestMasterDataset({ patterns: [pattern] });
          }
        );

        And(
          'a TypeScript pattern {string} with convention {string} and description:',
          (_ctx: unknown, name: string, tag: string, docString: string) => {
            const pattern = createTestPattern({
              name,
              convention: [tag],
              description: docString,
              filePath: 'src/conventions/ts-conventions.ts',
            });
            state!.dataset = createTestMasterDataset({
              patterns: [...state!.dataset!.patterns, pattern],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('{int} convention bundle is returned', (_ctx: unknown, count: number) => {
          expect(state!.result).toHaveLength(count);
        });

        And('the bundle has {int} source decisions', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.sourceDecisions).toHaveLength(count);
        });

        And('the bundle has {int} rules', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules).toHaveLength(count);
        });
      }
    );

    RuleScenario(
      'TypeScript pattern with convention but empty description',
      ({ Given, When, Then }) => {
        Given(
          'a TypeScript pattern with convention {string} and empty description',
          (_ctx: unknown, tag: string) => {
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'EmptyTsPattern',
                  convention: [tag],
                  description: '',
                  filePath: 'src/conventions/empty.ts',
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('the convention result is empty', () => {
          expect(state!.result).toHaveLength(0);
        });
      }
    );

    RuleScenario(
      'TypeScript description with tables is extracted correctly',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript pattern with convention {string} and table description',
          (_ctx: unknown, tag: string) => {
            // Build description with ## heading and table programmatically
            // (vitest-cucumber strips markdown headers from DocStrings)
            const description = [
              '## Status Protection',
              '**Invariant:** Each status has a protection level.',
              '',
              '| Status | Protection |',
              '| --- | --- |',
              '| roadmap | None |',
              '| active | Scope-locked |',
            ].join('\n');
            state!.dataset = createTestMasterDataset({
              patterns: [
                createTestPattern({
                  name: 'TsTablePattern',
                  convention: [tag],
                  description,
                  filePath: 'src/conventions/tables.ts',
                }),
              ],
            });
          }
        );

        When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
          state!.result = extractConventions(state!.dataset!, [tag]);
        });

        Then('the first rule has {int} table', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules[0]!.tables).toHaveLength(count);
        });

        And('the table has {int} data rows', (_ctx: unknown, count: number) => {
          expect(state!.result[0]!.rules[0]!.tables[0]!.rows).toHaveLength(count);
        });
      }
    );

    RuleScenario('TypeScript description with code examples', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript pattern with convention {string} and mermaid description',
        (_ctx: unknown, tag: string) => {
          // Build description with """mermaid""" DocString programmatically
          const description = [
            '## FSM Diagram',
            'The FSM enforces valid state transitions.',
            '',
            '"""mermaid',
            'stateDiagram-v2',
            '    [*] --> roadmap',
            '    roadmap --> active',
            '    active --> completed',
            '"""',
          ].join('\n');
          state!.dataset = createTestMasterDataset({
            patterns: [
              createTestPattern({
                name: 'TsMermaidPattern',
                convention: [tag],
                description,
                filePath: 'src/conventions/mermaid.ts',
              }),
            ],
          });
        }
      );

      When('extracting conventions for tag {string}', (_ctx: unknown, tag: string) => {
        state!.result = extractConventions(state!.dataset!, [tag]);
      });

      Then('the first rule has {int} code example', (_ctx: unknown, count: number) => {
        const rule = state!.result[0]!.rules[0]!;
        expect(rule.codeExamples).toBeDefined();
        expect(rule.codeExamples).toHaveLength(count);
      });

      And('the code example has language {string}', (_ctx: unknown, language: string) => {
        const example = state!.result[0]!.rules[0]!.codeExamples![0]!;
        expect(example.type).toBe('code');
        if (example.type === 'code') {
          expect(example.language).toBe(language);
        }
      });
    });
  });
});
