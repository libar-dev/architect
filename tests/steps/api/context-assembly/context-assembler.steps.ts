/**
 * Context Assembler Step Definitions
 *
 * Tests for assembleContext(), buildDepTree(), buildFileReadingList(),
 * and buildOverview() pure functions.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  assembleContext,
  buildDepTree,
  buildFileReadingList,
  buildOverview,
  type ContextBundle,
  type DepTreeNode,
  type FileReadingList,
  type OverviewSummary,
  type SessionType,
} from '../../../../src/api/context-assembler.js';
import { QueryApiError } from '../../../../src/api/types.js';
import { createProcessStateAPI } from '../../../../src/api/process-state.js';
import type { ProcessStateAPI } from '../../../../src/api/process-state.js';
import type { RuntimeMasterDataset } from '../../../../src/generators/pipeline/transform-types.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import {
  createTestPattern,
  createTestMasterDataset,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';

const feature = await loadFeature('tests/features/api/context-assembly/context-assembler.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  dataset: RuntimeMasterDataset | null;
  api: ProcessStateAPI | null;
  bundle: ContextBundle | null;
  tree: DepTreeNode | null;
  fileList: FileReadingList | null;
  overview: OverviewSummary | null;
  error: Error | null;
  patterns: ExtractedPattern[];
}

let state: TestState | null = null;

function initState(): TestState {
  resetPatternCounter();
  return {
    dataset: null,
    api: null,
    bundle: null,
    tree: null,
    fileList: null,
    overview: null,
    error: null,
    patterns: [],
  };
}

function buildDatasetAndApi(patterns: ExtractedPattern[]): void {
  if (state === null) return;
  state.dataset = createTestMasterDataset({ patterns });
  state.api = createProcessStateAPI(state.dataset);
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule 1: assembleContext produces session-tailored context bundles
  // ===========================================================================

  Rule('assembleContext produces session-tailored context bundles', ({ RuleScenario }) => {
    RuleScenario(
      'Design session includes stubs, consumers, and architecture',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern {string} with status {string} in phase {int}',
          (_ctx: unknown, name: string, status: string, phase: number) => {
            state = initState();
            const base = createTestPattern({
              name,
              status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
              phase,
              filePath: `architect/specs/${name.toLowerCase()}.feature`,
              deliverables: [
                { name: 'API design', status: 'pending', tests: 0, location: 'src/api/design.ts' },
                {
                  name: 'Interface stubs',
                  status: 'complete',
                  tests: 1,
                  location: 'src/api/stubs.ts',
                },
              ],
            });
            // Manually add arch fields (not in TestPatternOptions)
            state.patterns.push({
              ...base,
              archRole: 'bounded-context',
              archContext: 'orders',
              archLayer: 'domain',
            } as ExtractedPattern);
          }
        );

        And(
          'the pattern has dependencies {string} and {string}',
          (_ctx: unknown, dep1: string, dep2: string) => {
            state!.patterns[0] = {
              ...state!.patterns[0],
              dependsOn: [dep1, dep2],
            } as ExtractedPattern;
            // Add dependency patterns
            state!.patterns.push(
              createTestPattern({
                name: dep1,
                status: 'completed',
                filePath: `src/domain/${dep1.toLowerCase()}.ts`,
              })
            );
            state!.patterns.push(
              createTestPattern({
                name: dep2,
                status: 'completed',
                filePath: `src/domain/${dep2.toLowerCase()}.ts`,
              })
            );
          }
        );

        And('the pattern has stubs in the relationship index', () => {
          // Add a stub pattern that implements OrderSaga
          state!.patterns.push(
            createTestPattern({
              name: 'OrderSagaStub',
              status: 'roadmap',
              filePath: 'architect/stubs/order-saga/saga.ts',
              implementsPatterns: ['OrderSaga'],
              targetPath: 'src/domain/order-saga.ts',
            })
          );
        });

        And('the pattern has architecture context {string}', (_ctx: unknown, _archCtx: string) => {
          // Add an architecture neighbor with arch fields
          const neighbor = createTestPattern({
            name: 'OrderCommandHandler',
            status: 'completed',
            filePath: 'src/orders/command-handler.ts',
          });
          state!.patterns.push({
            ...neighbor,
            archRole: 'bounded-context',
            archContext: 'orders',
            archLayer: 'application',
          } as ExtractedPattern);
          buildDatasetAndApi(state!.patterns);
        });

        And('the pattern has deliverables', () => {
          // Already set in Given step via deliverables option
        });

        When(
          'I assemble context for {string} with session {string}',
          (_ctx: unknown, name: string, session: string) => {
            state!.bundle = assembleContext(state!.dataset!, state!.api!, {
              patterns: [name],
              sessionType: session as SessionType,
              baseDir: process.cwd(),
            });
          }
        );

        Then('the bundle contains metadata for {string}', (_ctx: unknown, name: string) => {
          expect(state!.bundle!.metadata.length).toBeGreaterThan(0);
          expect(state!.bundle!.metadata[0].name).toBe(name);
        });

        And('the bundle contains spec files', () => {
          expect(state!.bundle!.specFiles.length).toBeGreaterThan(0);
        });

        And('the bundle contains stubs', () => {
          expect(state!.bundle!.stubs.length).toBeGreaterThan(0);
        });

        And('the bundle contains dependencies', () => {
          expect(state!.bundle!.dependencies.length).toBeGreaterThan(0);
        });

        And('the bundle contains architecture neighbors', () => {
          expect(state!.bundle!.architectureNeighbors.length).toBeGreaterThan(0);
        });

        And('the bundle contains deliverables', () => {
          expect(state!.bundle!.deliverables.length).toBeGreaterThan(0);
        });

        And('the bundle does NOT contain FSM context', () => {
          expect(state!.bundle!.fsm).toBeUndefined();
        });
      }
    );

    RuleScenario(
      'Planning session includes only metadata and dependencies',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern {string} with status {string} in phase {int}',
          (_ctx: unknown, name: string, status: string, phase: number) => {
            state = initState();
            state.patterns.push(
              createTestPattern({
                name,
                status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
                phase,
                filePath: `architect/specs/${name.toLowerCase()}.feature`,
              })
            );
          }
        );

        And(
          'the pattern has dependencies {string} and {string}',
          (_ctx: unknown, dep1: string, dep2: string) => {
            state!.patterns[0] = {
              ...state!.patterns[0],
              dependsOn: [dep1, dep2],
            } as ExtractedPattern;
            state!.patterns.push(createTestPattern({ name: dep1, status: 'completed' }));
            state!.patterns.push(createTestPattern({ name: dep2, status: 'roadmap' }));
            buildDatasetAndApi(state!.patterns);
          }
        );

        When(
          'I assemble context for {string} with session {string}',
          (_ctx: unknown, name: string, session: string) => {
            state!.bundle = assembleContext(state!.dataset!, state!.api!, {
              patterns: [name],
              sessionType: session as SessionType,
              baseDir: process.cwd(),
            });
          }
        );

        Then('the bundle contains metadata for {string}', (_ctx: unknown, name: string) => {
          expect(state!.bundle!.metadata[0].name).toBe(name);
        });

        And('the bundle contains dependencies', () => {
          expect(state!.bundle!.dependencies.length).toBeGreaterThan(0);
        });

        And('the bundle does NOT contain spec files', () => {
          expect(state!.bundle!.specFiles.length).toBe(0);
        });

        And('the bundle does NOT contain stubs', () => {
          expect(state!.bundle!.stubs.length).toBe(0);
        });

        And('the bundle does NOT contain architecture neighbors', () => {
          expect(state!.bundle!.architectureNeighbors.length).toBe(0);
        });
      }
    );

    RuleScenario(
      'Implement session includes deliverables and FSM',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern {string} with status {string} in phase {int}',
          (_ctx: unknown, name: string, status: string, phase: number) => {
            state = initState();
            state.patterns.push(
              createTestPattern({
                name,
                status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
                phase,
                filePath: `architect/specs/${name.toLowerCase()}.feature`,
                deliverables: [
                  { name: 'Core types', status: 'complete', tests: 1, location: 'src/types.ts' },
                  { name: 'Validation', status: 'pending', tests: 0, location: 'src/validate.ts' },
                ],
              })
            );
            buildDatasetAndApi(state.patterns);
          }
        );

        And('the pattern has deliverables', () => {
          // Already set in Given step via deliverables option
        });

        When(
          'I assemble context for {string} with session {string}',
          (_ctx: unknown, name: string, session: string) => {
            state!.bundle = assembleContext(state!.dataset!, state!.api!, {
              patterns: [name],
              sessionType: session as SessionType,
              baseDir: process.cwd(),
            });
          }
        );

        Then('the bundle contains metadata for {string}', (_ctx: unknown, name: string) => {
          expect(state!.bundle!.metadata[0].name).toBe(name);
        });

        And('the bundle contains spec files', () => {
          expect(state!.bundle!.specFiles.length).toBeGreaterThan(0);
        });

        And('the bundle contains deliverables', () => {
          expect(state!.bundle!.deliverables.length).toBeGreaterThan(0);
        });

        And(
          'the bundle contains FSM context with status {string}',
          (_ctx: unknown, expectedStatus: string) => {
            expect(state!.bundle!.fsm).toBeDefined();
            expect(state!.bundle!.fsm!.currentStatus).toBe(expectedStatus);
          }
        );

        And('the bundle does NOT contain stubs', () => {
          expect(state!.bundle!.stubs.length).toBe(0);
        });

        And('the bundle does NOT contain consumers', () => {
          expect(state!.bundle!.consumers.length).toBe(0);
        });
      }
    );

    RuleScenario(
      'Multi-pattern context merges metadata from both patterns',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern {string} with status {string} in phase {int} depending on {string}',
          (_ctx: unknown, name: string, status: string, phase: number, dep: string) => {
            state = initState();
            state.patterns.push(
              createTestPattern({
                name,
                status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
                phase,
                filePath: `architect/specs/${name.toLowerCase()}.feature`,
                dependsOn: [dep],
              })
            );
          }
        );

        And(
          'a second pattern {string} with status {string} in phase {int} depending on {string}',
          (_ctx: unknown, name: string, status: string, phase: number, dep: string) => {
            state!.patterns.push(
              createTestPattern({
                name,
                status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
                phase,
                filePath: `architect/specs/${name.toLowerCase()}.feature`,
                dependsOn: [dep],
              })
            );
          }
        );

        And(
          'a shared dependency pattern {string} with status {string}',
          (_ctx: unknown, name: string, status: string) => {
            state!.patterns.push(
              createTestPattern({
                name,
                status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
                filePath: `src/${name.toLowerCase()}.ts`,
              })
            );
            buildDatasetAndApi(state!.patterns);
          }
        );

        When(
          'I assemble context for both patterns with session {string}',
          (_ctx: unknown, session: string) => {
            // Assemble context for the first two patterns (not the dependency)
            const patternNames = state!.patterns.slice(0, 2).map((p) => p.patternName);
            state!.bundle = assembleContext(state!.dataset!, state!.api!, {
              patterns: patternNames,
              sessionType: session as SessionType,
              baseDir: process.cwd(),
            });
          }
        );

        Then('the bundle contains metadata for {string}', (_ctx: unknown, name: string) => {
          const found = state!.bundle!.metadata.find((m) => m.name === name);
          expect(found).toBeDefined();
        });

        And('the bundle contains metadata for {string}', (_ctx: unknown, name: string) => {
          const found = state!.bundle!.metadata.find((m) => m.name === name);
          expect(found).toBeDefined();
        });

        And(
          'the bundle lists {string} as a shared dependency',
          (_ctx: unknown, depName: string) => {
            expect(state!.bundle!.sharedDependencies).toContain(depName);
          }
        );
      }
    );

    RuleScenario('Pattern not found returns error with suggestion', ({ Given, When, Then }) => {
      Given('a pattern {string} exists in the dataset', (_ctx: unknown, name: string) => {
        state = initState();
        state.patterns.push(createTestPattern({ name }));
        buildDatasetAndApi(state.patterns);
      });

      When(
        'I assemble context for {string} with session {string}',
        (_ctx: unknown, name: string, session: string) => {
          try {
            assembleContext(state!.dataset!, state!.api!, {
              patterns: [name],
              sessionType: session as SessionType,
              baseDir: process.cwd(),
            });
          } catch (err) {
            state!.error = err as Error;
          }
        }
      );

      Then('an error is thrown with code {string}', (_ctx: unknown, code: string) => {
        expect(state!.error).toBeInstanceOf(QueryApiError);
        expect((state!.error as QueryApiError).code).toBe(code);
      });
    });

    RuleScenario(
      'Description preserves Problem and Solution structure',
      ({ Given, When, Then }) => {
        Given('a pattern {string} with structured description', (_ctx: unknown, name: string) => {
          state = initState();
          const base = createTestPattern({
            name,
            status: 'roadmap',
            phase: 22,
            filePath: `architect/specs/${name.toLowerCase()}.feature`,
          });
          state.patterns.push({
            ...base,
            directive: {
              ...base.directive,
              description:
                '**Problem:** Orders fail silently during checkout. ' +
                '**Solution:** Implement saga pattern for reliable order processing.',
            },
          } as ExtractedPattern);
          buildDatasetAndApi(state.patterns);
        });

        When(
          'I assemble context for {string} with session {string}',
          (_ctx: unknown, name: string, session: string) => {
            state!.bundle = assembleContext(state!.dataset!, state!.api!, {
              patterns: [name],
              sessionType: session as SessionType,
              baseDir: process.cwd(),
            });
          }
        );

        Then(
          'the metadata summary contains {string} and {string}',
          (_ctx: unknown, part1: string, part2: string) => {
            const summary = state!.bundle!.metadata[0]?.summary ?? '';
            expect(summary).toContain(part1);
            expect(summary).toContain(part2);
          }
        );
      }
    );

    RuleScenario('Solution text with inline bold is not truncated', ({ Given, When, Then }) => {
      Given(
        'a pattern {string} with Solution containing inline bold',
        (_ctx: unknown, name: string) => {
          state = initState();
          const base = createTestPattern({
            name,
            status: 'roadmap',
            phase: 22,
            filePath: `architect/specs/${name.toLowerCase()}.feature`,
          });
          state.patterns.push({
            ...base,
            directive: {
              ...base.directive,
              description:
                '**Problem:** Orders fail silently during checkout.\n' +
                '**Solution:** Implement saga pattern with **Pre-flight check:** readiness verification.',
            },
          } as ExtractedPattern);
          buildDatasetAndApi(state.patterns);
        }
      );

      When(
        'I assemble context for {string} with session {string}',
        (_ctx: unknown, name: string, session: string) => {
          state!.bundle = assembleContext(state!.dataset!, state!.api!, {
            patterns: [name],
            sessionType: session as SessionType,
            baseDir: process.cwd(),
          });
        }
      );

      Then('the metadata summary contains {string}', (_ctx: unknown, expected: string) => {
        const summary = state!.bundle!.metadata[0]?.summary ?? '';
        expect(summary).toContain(expected);
      });
    });
  });

  // ===========================================================================
  // Rule 2: buildDepTree walks dependency chains with cycle detection
  // ===========================================================================

  Rule('buildDepTree walks dependency chains with cycle detection', ({ RuleScenario }) => {
    RuleScenario(
      'Dependency tree shows chain with status markers',
      ({ Given, When, Then, And }) => {
        Given(
          'a dependency chain: {string} completed -> {string} active -> {string} roadmap',
          (_ctx: unknown, root: string, middle: string, leaf: string) => {
            state = initState();
            state.patterns = [
              createTestPattern({
                name: root,
                status: 'completed',
                phase: 1,
                enables: [middle],
              }),
              createTestPattern({
                name: middle,
                status: 'active',
                phase: 2,
                dependsOn: [root],
                enables: [leaf],
              }),
              createTestPattern({
                name: leaf,
                status: 'roadmap',
                phase: 3,
                dependsOn: [middle],
              }),
            ];
            buildDatasetAndApi(state.patterns);
          }
        );

        When(
          'I build a dep-tree for {string} with depth {int}',
          (_ctx: unknown, name: string, depth: number) => {
            state!.tree = buildDepTree(state!.dataset!, {
              pattern: name,
              maxDepth: depth,
              includeImplementationDeps: true,
            });
          }
        );

        Then('the tree root is {string}', (_ctx: unknown, rootName: string) => {
          expect(state!.tree!.name).toBe(rootName);
        });

        And(
          'the focal node {string} is marked with isFocal',
          (_ctx: unknown, focalName: string) => {
            const focal = findNodeInTree(state!.tree!, focalName);
            expect(focal).toBeDefined();
            expect(focal!.isFocal).toBe(true);
          }
        );
      }
    );

    RuleScenario('Depth limit truncates branches', ({ Given, When, Then }) => {
      Given(
        'a dependency chain: {string} completed -> {string} active -> {string} roadmap -> {string} roadmap',
        (_ctx: unknown, a: string, b: string, c: string, d: string) => {
          state = initState();
          state.patterns = [
            createTestPattern({ name: a, status: 'completed', phase: 1, enables: [b] }),
            createTestPattern({
              name: b,
              status: 'active',
              phase: 2,
              dependsOn: [a],
              enables: [c],
            }),
            createTestPattern({
              name: c,
              status: 'roadmap',
              phase: 3,
              dependsOn: [b],
              enables: [d],
            }),
            createTestPattern({ name: d, status: 'roadmap', phase: 4, dependsOn: [c] }),
          ];
          buildDatasetAndApi(state.patterns);
        }
      );

      When(
        'I build a dep-tree for {string} with depth {int}',
        (_ctx: unknown, name: string, depth: number) => {
          state!.tree = buildDepTree(state!.dataset!, {
            pattern: name,
            maxDepth: depth,
            includeImplementationDeps: true,
          });
        }
      );

      Then('truncated branches are indicated', () => {
        const hasAnyTruncated = findTruncatedNode(state!.tree!);
        expect(hasAnyTruncated).toBe(true);
      });
    });

    RuleScenario('Circular dependencies are handled safely', ({ Given, When, Then }) => {
      Given(
        'patterns {string} depends on {string} and {string} depends on {string}',
        (_ctx: unknown, a: string, b: string, b2: string, a2: string) => {
          state = initState();
          state.patterns = [
            createTestPattern({
              name: a,
              status: 'roadmap',
              dependsOn: [b],
              enables: [b],
            }),
            createTestPattern({
              name: b2,
              status: 'roadmap',
              dependsOn: [a2],
              enables: [a2],
            }),
          ];
          buildDatasetAndApi(state.patterns);
        }
      );

      When(
        'I build a dep-tree for {string} with depth {int}',
        (_ctx: unknown, name: string, depth: number) => {
          // Should NOT throw / infinite loop
          state!.tree = buildDepTree(state!.dataset!, {
            pattern: name,
            maxDepth: depth,
            includeImplementationDeps: true,
          });
        }
      );

      Then('the tree does not infinitely recurse', () => {
        expect(state!.tree).toBeDefined();
        expect(state!.tree!.name).toBeDefined();
      });
    });

    RuleScenario('Standalone pattern returns single-node tree', ({ Given, When, Then, And }) => {
      Given('a standalone pattern {string} with no dependencies', (_ctx: unknown, name: string) => {
        state = initState();
        state.patterns = [
          createTestPattern({
            name,
            status: 'active',
          }),
        ];
        buildDatasetAndApi(state.patterns);
      });

      When(
        'I build a dep-tree for {string} with depth {int}',
        (_ctx: unknown, name: string, depth: number) => {
          state!.tree = buildDepTree(state!.dataset!, {
            pattern: name,
            maxDepth: depth,
            includeImplementationDeps: true,
          });
        }
      );

      Then('the tree root is {string}', (_ctx: unknown, rootName: string) => {
        expect(state!.tree!.name).toBe(rootName);
      });

      And('the tree has no children', () => {
        expect(state!.tree!.children.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Rule 3: buildOverview provides executive project summary
  // ===========================================================================

  Rule('buildOverview provides executive project summary', ({ RuleScenario }) => {
    RuleScenario(
      'Overview shows progress, active phases, and blocking',
      ({ Given, When, Then, And }) => {
        Given('a dataset with phased patterns including dependencies', () => {
          state = initState();
          // Create patterns with explicit phases and a dependency chain
          // so that activePhases and blocking are non-empty
          const completedDep = createTestPattern({
            name: 'CompletedDep',
            status: 'completed',
            phase: 10,
          });
          const activePattern = createTestPattern({
            name: 'ActiveWork',
            status: 'active',
            phase: 11,
            dependsOn: ['IncompleteDep'],
          });
          const incompleteDep = createTestPattern({
            name: 'IncompleteDep',
            status: 'roadmap',
            phase: 11,
          });
          const planned = createTestPattern({
            name: 'PlannedWork',
            status: 'roadmap',
            phase: 12,
          });
          state.dataset = createTestMasterDataset({
            patterns: [completedDep, activePattern, incompleteDep, planned],
          });
          state.api = createProcessStateAPI(state.dataset);
        });

        When('I build the overview', () => {
          state!.overview = buildOverview(state!.dataset!);
        });

        Then('the progress shows completed, active, and planned counts', () => {
          expect(state!.overview!.progress.total).toBe(4);
          expect(state!.overview!.progress.completed).toBe(1);
          expect(state!.overview!.progress.active).toBe(1);
          expect(state!.overview!.progress.planned).toBeGreaterThanOrEqual(2);
        });

        And('at least one active phase is listed with pattern counts', () => {
          expect(state!.overview!.activePhases.length).toBeGreaterThan(0);
          const firstPhase = state!.overview!.activePhases[0];
          expect(firstPhase).toBeDefined();
          expect(firstPhase.phase).toBeDefined();
          expect(firstPhase.activeCount).toBeGreaterThan(0);
        });

        And('blocking entries include patterns with incomplete dependencies', () => {
          expect(state!.overview!.blocking.length).toBeGreaterThan(0);
          const blockedEntry = state!.overview!.blocking.find((b) => b.pattern === 'ActiveWork');
          expect(blockedEntry).toBeDefined();
          expect(blockedEntry!.blockedBy).toContain('IncompleteDep');
        });
      }
    );

    RuleScenario('Empty dataset returns zero-state overview', ({ Given, When, Then, And }) => {
      Given('an empty dataset with {int} patterns', (_ctx: unknown, _count: number) => {
        state = initState();
        state.dataset = createTestMasterDataset();
        state.api = createProcessStateAPI(state.dataset);
      });

      When('I build the overview', () => {
        state!.overview = buildOverview(state!.dataset!);
      });

      Then(
        'the progress shows total {int} with {int} percent',
        (_ctx: unknown, total: number, percent: number) => {
          expect(state!.overview!.progress.total).toBe(total);
          expect(state!.overview!.progress.percentage).toBe(percent);
        }
      );

      And('no active phases are listed', () => {
        expect(state!.overview!.activePhases.length).toBe(0);
      });

      And('no blocking is reported', () => {
        expect(state!.overview!.blocking.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Rule 4: buildFileReadingList returns paths by relevance
  // ===========================================================================

  Rule('buildFileReadingList returns paths by relevance', ({ RuleScenario }) => {
    RuleScenario('File list includes primary and related files', ({ Given, When, Then, And }) => {
      Given('a pattern {string} with dependencies', (_ctx: unknown, name: string) => {
        state = initState();
        state.patterns = [
          createTestPattern({
            name,
            status: 'roadmap',
            filePath: `architect/specs/${name.toLowerCase()}.feature`,
            dependsOn: ['CompletedDep', 'RoadmapDep'],
          }),
          createTestPattern({
            name: 'CompletedDep',
            status: 'completed',
            filePath: 'src/domain/completed-dep.ts',
          }),
          createTestPattern({
            name: 'RoadmapDep',
            status: 'roadmap',
            filePath: 'architect/specs/roadmap-dep.feature',
          }),
        ];
        buildDatasetAndApi(state.patterns);
      });

      When('I build the file reading list with related', () => {
        state!.fileList = buildFileReadingList(state!.dataset!, 'OrderSaga', true);
      });

      Then('primary files include the spec file', () => {
        expect(state!.fileList!.primary.length).toBeGreaterThan(0);
        expect(state!.fileList!.primary[0]).toContain('.feature');
      });

      And('completed dependency files are listed', () => {
        expect(state!.fileList!.completedDeps.length).toBeGreaterThan(0);
      });

      And('roadmap dependency files are listed', () => {
        expect(state!.fileList!.roadmapDeps.length).toBeGreaterThan(0);
      });
    });

    RuleScenario(
      'File list includes implementation files for completed dependencies',
      ({ Given, And, When, Then }) => {
        Given(
          'a pattern {string} that depends on {string}',
          (_ctx: unknown, name: string, dep: string) => {
            state = initState();
            state.patterns = [
              createTestPattern({
                name,
                status: 'roadmap',
                filePath: `architect/specs/${name.toLowerCase()}.feature`,
                dependsOn: [dep],
              }),
              createTestPattern({
                name: dep,
                status: 'completed',
                filePath: `architect/specs/${dep.toLowerCase()}.feature`,
              }),
              // Implementation pattern that declares @architect-implements CompletedLib
              createTestPattern({
                name: `${dep}Impl`,
                status: 'completed',
                filePath: 'src/lib/completed-lib.ts',
                implementsPatterns: [dep],
              }),
            ];
          }
        );

        And(
          '{string} is completed and implemented by {string}',
          (_ctx: unknown, _dep: string, _implFile: string) => {
            // Setup already done in Given step — patterns include the implementation
            buildDatasetAndApi(state!.patterns);
          }
        );

        When(
          'I build the file reading list for {string} with related',
          (_ctx: unknown, name: string) => {
            state!.fileList = buildFileReadingList(state!.dataset!, name, true);
          }
        );

        Then(
          'completed dependency files include {string}',
          (_ctx: unknown, expectedFile: string) => {
            expect(state!.fileList!.completedDeps).toContain(expectedFile);
          }
        );
      }
    );

    RuleScenario('File list without related returns only primary', ({ Given, When, Then, And }) => {
      Given('a pattern {string} with dependencies', (_ctx: unknown, name: string) => {
        state = initState();
        state.patterns = [
          createTestPattern({
            name,
            status: 'roadmap',
            filePath: `architect/specs/${name.toLowerCase()}.feature`,
            dependsOn: ['SomeDep'],
          }),
          createTestPattern({
            name: 'SomeDep',
            status: 'completed',
            filePath: 'src/domain/dep.ts',
          }),
        ];
        buildDatasetAndApi(state.patterns);
      });

      When('I build the file reading list without related', () => {
        state!.fileList = buildFileReadingList(state!.dataset!, 'OrderSaga', false);
      });

      Then('primary files include the spec file', () => {
        expect(state!.fileList!.primary.length).toBeGreaterThan(0);
      });

      And('no dependency files are listed', () => {
        expect(state!.fileList!.completedDeps.length).toBe(0);
        expect(state!.fileList!.roadmapDeps.length).toBe(0);
      });
    });
  });
});

// =============================================================================
// Tree Traversal Helpers
// =============================================================================

function findNodeInTree(node: DepTreeNode, name: string): DepTreeNode | undefined {
  if (node.name === name) return node;
  for (const child of node.children) {
    const found = findNodeInTree(child, name);
    if (found !== undefined) return found;
  }
  return undefined;
}

function findTruncatedNode(node: DepTreeNode): boolean {
  if (node.truncated) return true;
  for (const child of node.children) {
    if (findTruncatedNode(child)) return true;
  }
  return false;
}
