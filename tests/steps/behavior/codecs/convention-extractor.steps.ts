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
});
