/**
 * Context Renderer Step Definitions
 *
 * Tests the projection-layer compact text renderer for session context,
 * dependency trees, overview digests, and file reading lists.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createPackageResolver, type ExtractedPattern } from '@libar-dev/architect-core';

import {
  type FileReadingList,
  parseAndProjectDependencyContext,
  parseAndProjectFileReadingList,
  parseAndProjectSessionContext,
  projectOverviewDigest,
  type ProjectionContext,
  renderCompactText,
} from '@libar-dev/architect-projection';
import {
  createPatternGraphWithStatus,
  createTestPatternGraph,
} from '../../../fixtures/dataset-factories.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';

const feature = await loadFeature(
  'tests/features/api/context-assembly/compact-text-renderer.feature',
);

interface TestState {
  output: string;
}

let state: TestState | null = null;

function initState(): TestState {
  return {
    output: '',
  };
}

function createProjectionContext(graph: ProjectionContext['graph']): ProjectionContext {
  return {
    graph,
    packageResolver: createPackageResolver([
      { id: 'test-package', displayName: 'Test Package', match: /^/u },
    ]),
  };
}

function renderSessionContext(
  patterns: ExtractedPattern[],
  sessionType: 'design' | 'implement',
): string {
  const dataset = createTestPatternGraph({ patterns });
  const focalPattern = patterns.find((pattern) => pattern.implementsPatterns === undefined);
  if (focalPattern === undefined) {
    throw new Error('Expected a focal pattern for session context rendering.');
  }

  return renderCompactText(
    parseAndProjectSessionContext(createProjectionContext(dataset), {
      patterns: [focalPattern.patternName ?? focalPattern.name],
      sessionType,
    }),
  );
}

function renderDependencyContextFor(patterns: ExtractedPattern[], pattern: string): string {
  const dataset = createTestPatternGraph({ patterns });
  return renderCompactText(
    parseAndProjectDependencyContext(createProjectionContext(dataset), {
      pattern,
      maxDepth: 5,
    }),
  );
}

function renderOverview(total: number, percentage: number): string {
  const completed = Math.round((total * percentage) / 100);
  const active = Math.min(3, total - completed);
  const planned = total - completed - active;
  const dataset = createPatternGraphWithStatus({ completed, active, planned });

  return renderCompactText(projectOverviewDigest(createProjectionContext(dataset)));
}

function renderProjectedFileReadingList(patterns: ExtractedPattern[], pattern: string): string {
  const dataset = createTestPatternGraph({ patterns });
  const fileReadingList = parseAndProjectFileReadingList(createProjectionContext(dataset), {
    pattern,
  });

  if (fileReadingList === undefined) {
    throw new Error(`Expected projected file reading list for pattern ${pattern}.`);
  }

  return renderCompactText(fileReadingList);
}

function renderManualFileReadingList(list: FileReadingList): string {
  return renderCompactText(list);
}

describeFeature(feature, ({ Rule }) => {
  Rule('formatContextBundle renders section markers', ({ RuleScenario }) => {
    RuleScenario('Design bundle renders all populated sections', ({ Given, When, Then }) => {
      Given('a design context bundle with metadata, stubs, dependencies, and deliverables', () => {
        state = initState();
      });

      When('I format the bundle', () => {
        state!.output = renderSessionContext(
          [
            createTestPattern({
              name: 'OrderSaga',
              status: 'roadmap',
              role: 'agent',
              filePath: 'architect/specs/order-saga.feature',
              description: 'Orchestrates order lifecycle.',
              dependsOn: ['EventStore'],
              deliverables: [
                { name: 'API design', status: 'pending', tests: 0, location: 'src/api/design.ts' },
                {
                  name: 'Interface stubs',
                  status: 'complete',
                  tests: 1,
                  location: 'src/api/stubs.ts',
                },
              ],
            }),
            createTestPattern({
              name: 'EventStore',
              status: 'completed',
              filePath: 'src/domain/event-store.ts',
            }),
            createTestPattern({
              name: 'OrderSagaStub',
              status: 'roadmap',
              filePath: 'architect/stubs/order-saga/saga.ts',
              implementsPatterns: ['OrderSaga'],
              targetPath: 'src/domain/order-saga.ts',
            }),
          ],
          'design',
        );
      });

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        },
      );
    });

    RuleScenario('Implement bundle renders deliverables and FSM', ({ Given, When, Then, And }) => {
      Given('an implement context bundle with deliverables and FSM', () => {
        state = initState();
      });

      When('I format the bundle', () => {
        state!.output = renderSessionContext(
          [
            createTestPattern({
              name: 'ProcessGuard',
              status: 'active',
              role: 'validation',
              filePath: 'architect/specs/process-guard.feature',
              description: 'Validates delivery workflow.',
              deliverables: [
                { name: 'Core types', status: 'complete', tests: 1, location: 'src/types.ts' },
                {
                  name: 'Validation logic',
                  status: 'pending',
                  tests: 0,
                  location: 'src/validate.ts',
                },
              ],
            }),
          ],
          'implement',
        );
      });

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        },
      );

      And('the output contains checkbox markers', () => {
        expect(state!.output).toMatch(/\[x\]|\[ \]/);
      });
    });
  });

  Rule('formatDependencyContext renders a bidirectional focal view', ({ RuleScenario }) => {
    RuleScenario(
      'Context renders the focal summary and bidirectional trees',
      ({ Given, When, Then }) => {
        Given('a dependency context with root, middle, and focal leaf', () => {
          state = initState();
        });

        When('I format the dependency context', () => {
          state!.output = renderDependencyContextFor(
            [
              createTestPattern({ name: 'Root', status: 'completed' }),
              createTestPattern({ name: 'Middle', status: 'active', dependsOn: ['Root'] }),
              createTestPattern({ name: 'Leaf', status: 'roadmap', dependsOn: ['Middle'] }),
            ],
            'Leaf',
          );
        });

        Then(
          'the output contains all expected sections',
          (_ctx: unknown, table: Array<{ section: string }>) => {
            for (const row of table) {
              expect(state!.output).toContain(row.section.trim());
            }
          },
        );
      },
    );
  });

  Rule('formatOverview renders progress summary', ({ RuleScenario }) => {
    RuleScenario('Overview renders progress line', ({ Given, When, Then }) => {
      Given(
        'an overview with {int} total patterns at {int} percent',
        (_ctx: unknown, total: number, percent: number) => {
          state = initState();
          state.output = renderOverview(total, percent);
        },
      );

      When('I format the overview', () => {});

      Then(
        'the output contains all expected sections',
        (_ctx: unknown, table: Array<{ section: string }>) => {
          for (const row of table) {
            expect(state!.output).toContain(row.section.trim());
          }
        },
      );
    });

    RuleScenario('Overview renders architect query guidance', ({ Given, When, Then, And }) => {
      Given(
        'an overview with {int} total patterns at {int} percent',
        (_ctx: unknown, total: number, percentage: number) => {
          state = initState();
          state.output = renderOverview(total, percentage);
        },
      );

      When('I format the overview', () => {});

      Then('the output contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.output).toContain(text);
      });

      And('the output contains {string}', (_ctx: unknown, text: string) => {
        expect(state!.output).toContain(text);
      });
    });
  });

  Rule('formatFileReadingList renders categorized file paths', ({ RuleScenario }) => {
    RuleScenario(
      'File list renders primary and dependency sections',
      ({ Given, When, Then, And }) => {
        Given('a file reading list with primary and dependency files', () => {
          state = initState();
        });

        When('I format the file reading list', () => {
          state!.output = renderProjectedFileReadingList(
            [
              createTestPattern({
                name: 'OrderSaga',
                status: 'roadmap',
                filePath: 'specs/order-saga.feature',
                dependsOn: ['EventStore', 'PaymentSaga'],
              }),
              createTestPattern({
                name: 'EventStore',
                status: 'completed',
                filePath: 'src/domain/event-store.ts',
              }),
              createTestPattern({
                name: 'PaymentSaga',
                status: 'roadmap',
                filePath: 'specs/payment-saga.feature',
                deliverables: [
                  {
                    name: 'Payment flow',
                    status: 'pending',
                    tests: 0,
                    location: 'src/payment-saga.ts',
                  },
                ],
              }),
              createTestPattern({
                name: 'OrderSagaStub',
                status: 'roadmap',
                filePath: 'stubs/order-saga/saga.ts',
                implementsPatterns: ['OrderSaga'],
              }),
            ],
            'OrderSaga',
          );
        });

        Then('the output contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.output).toContain(text);
        });

        And('the output contains {string}', (_ctx: unknown, text: string) => {
          expect(state!.output).toContain(text);
        });
      },
    );

    RuleScenario('Empty file reading list renders minimal output', ({ Given, When, Then }) => {
      Given('an empty file reading list', () => {
        state = initState();
      });

      When('I format the file reading list', () => {
        state!.output = renderManualFileReadingList({
          kind: 'FileReadingList',
          pattern: 'OrderSaga',
          primary: [],
          completedDeps: [],
          roadmapDeps: [],
          architectureNeighbors: [],
        });
      });

      Then('the output is a single newline', () => {
        expect(state!.output).toBe('\n');
      });
    });
  });
});
