import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, it } from 'vitest';

import {
  FragmentSchema,
  parseAndProjectFileReadingList,
  parseAndProjectHandoffRecord,
  parseAndProjectScopeReadinessReport,
  parseAndProjectSessionContext,
  projectDeliverable,
  projectDeliverableManifest,
  renderJson,
  type Deliverable,
  type DeliverableManifest,
  type FileReadingList,
  type HandoffRecord,
  type ProjectionBundle,
  type ProjectionContext,
  type ScopeReadinessReport,
  type SessionContextBundle,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface ExecutionContextState {
  context: ProjectionContext | null;
  scopeReport: ProjectionBundle<ScopeReadinessReport> | null;
  planningContext: ProjectionBundle<SessionContextBundle> | null;
  designContext: ProjectionBundle<SessionContextBundle> | null;
  implementContext: ProjectionBundle<SessionContextBundle> | null;
  fileReadingList: FileReadingList | undefined;
  deliverableManifest: DeliverableManifest | undefined;
  deliverable: Deliverable | undefined;
  handoff: ProjectionBundle<HandoffRecord> | null;
  invalidOptionsError: string | null;
}

const feature = await loadFeature(
  'tests/features/projections/execution-context/context-session.feature'
);

let state: ExecutionContextState | null = null;

function createState(): ExecutionContextState {
  return {
    context: null,
    scopeReport: null,
    planningContext: null,
    designContext: null,
    implementContext: null,
    fileReadingList: undefined,
    deliverableManifest: undefined,
    deliverable: undefined,
    handoff: null,
    invalidOptionsError: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Execution Context projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Scope readiness separates implementation blockers from design warnings',
    ({ RuleScenario }) => {
      RuleScenario(
        'implementation readiness blocks when a dependency is incomplete',
        ({ Given, When, Then, And }) => {
          Given(
            'a Execution Context scope projection context with an incomplete implementation dependency',
            () => {
              const pattern = createPattern('ProjectionBody', {
                status: 'roadmap',
                dependsOn: ['DependencyPattern'],
                deliverables: [
                  {
                    name: 'ProjectionBody module',
                    status: 'in-progress',
                    tests: 2,
                    location:
                      'packages/architect-projection/src/projections/execution-context/session-context.ts',
                  },
                ],
                description: 'Implements the context/session body projections.',
                executableSpecs: ['tests/features/query/context.feature'],
              });
              const dependency = createPattern('DependencyPattern', {
                status: 'roadmap',
              });
              const stub = createPattern('ProjectionBodyStub', {
                file: 'architect/stubs/projection-body.stub.ts',
                implementsPatterns: ['ProjectionBody'],
                description: 'DD-1: Keep projection helpers pure.',
              });

              state!.context = createProjectionContext({
                patterns: [pattern, dependency, stub],
                relationshipIndex: {
                  ProjectionBody: createRelationshipEntry({
                    dependsOn: ['DependencyPattern'],
                    implementedBy: [
                      {
                        name: 'ProjectionBodyStub',
                        file: 'architect/stubs/projection-body.stub.ts',
                        description: 'Projection stub',
                      },
                    ],
                  }),
                },
              });
            }
          );

          When('I project scope readiness for "ProjectionBody" in the implement session', () => {
            state!.scopeReport = parseAndProjectScopeReadinessReport(state!.context!, {
              pattern: 'ProjectionBody',
              sessionType: 'implement',
            });
          });

          Then('the scope readiness verdict should be "BLOCKED"', () => {
            expect(state!.scopeReport?.root.verdict).toBe('BLOCKED');
          });

          And('the scope readiness check "dependencies-completed" should be an error', () => {
            expect(state!.scopeReport?.root.checks).toContainEqual(
              expect.objectContaining({
                kind: 'ScopeReadinessCheck',
                checkId: 'dependencies-completed',
                severity: 'error',
                passed: false,
              })
            );
          });
        }
      );

      RuleScenario(
        'design readiness uses graph-only stub coverage without baseDir semantics',
        ({ Given, When, Then, And }) => {
          Given(
            'a Execution Context scope projection context with a missing dependency stub',
            () => {
              const pattern = createPattern('ProjectionBody', {
                status: 'roadmap',
                dependsOn: ['DependencyPattern'],
              });
              const dependency = createPattern('DependencyPattern', {
                status: 'completed',
              });

              state!.context = createProjectionContext({
                patterns: [pattern, dependency],
              });
            }
          );

          When('I project scope readiness for "ProjectionBody" in the design session', () => {
            state!.scopeReport = parseAndProjectScopeReadinessReport(state!.context!, {
              pattern: 'ProjectionBody',
              sessionType: 'design',
            });
          });

          Then('the scope readiness verdict should be "WARN"', () => {
            expect(state!.scopeReport?.root.verdict).toBe('WARN');
          });

          And('the scope readiness check "stubs-from-deps-exist" should be a warning', () => {
            expect(state!.scopeReport?.root.checks).toContainEqual(
              expect.objectContaining({
                kind: 'ScopeReadinessCheck',
                checkId: 'stubs-from-deps-exist',
                severity: 'warning',
                passed: false,
              })
            );
          });
        }
      );

      RuleScenario(
        'strict readiness promotes design warnings to blockers',
        ({ Given, When, Then, And }) => {
          Given(
            'a Execution Context scope projection context with a missing dependency stub',
            () => {
              const pattern = createPattern('ProjectionBody', {
                status: 'roadmap',
                dependsOn: ['DependencyPattern'],
              });
              const dependency = createPattern('DependencyPattern', {
                status: 'completed',
              });

              state!.context = createProjectionContext({
                patterns: [pattern, dependency],
              });
            }
          );

          When(
            'I project scope readiness for "ProjectionBody" in the design session with strict mode',
            () => {
              state!.scopeReport = parseAndProjectScopeReadinessReport(state!.context!, {
                pattern: 'ProjectionBody',
                sessionType: 'design',
                strict: true,
              });
            }
          );

          Then('the scope readiness verdict should be "BLOCKED"', () => {
            expect(state!.scopeReport?.root.verdict).toBe('BLOCKED');
          });

          And('the scope readiness check "stubs-from-deps-exist" should be an error', () => {
            expect(state!.scopeReport?.root.checks).toContainEqual(
              expect.objectContaining({
                kind: 'ScopeReadinessCheck',
                checkId: 'stubs-from-deps-exist',
                severity: 'error',
                passed: false,
              })
            );
          });
        }
      );
    }
  );

  Rule('Session context varies by session type', ({ RuleScenario }) => {
    RuleScenario(
      'planning design and implement sessions expose different shapes',
      ({ Given, When, Then, And }) => {
        Given(
          'a Execution Context session projection context with metadata stubs neighbors and tests',
          () => {
            const pattern = createPattern('ProjectionBody', {
              status: 'active',
              file: 'architect/specs/projection-body.feature',
              description:
                '**Problem:** Session work needs predictable context bundles.\n\n**Solution:** Projection bodies normalize those bundles.',
              executableSpecs: ['tests/features/query/context.feature'],
              deliverables: [
                {
                  name: 'Session context module',
                  status: 'in-progress',
                  tests: 2,
                  location:
                    'packages/architect-projection/src/projections/execution-context/session-context.ts',
                },
              ],
              archContext: 'projection',
              dependsOn: ['DependencyPattern'],
              uses: ['UtilityPattern'],
            });
            const dependency = createPattern('DependencyPattern', {
              status: 'completed',
              file: 'architect/specs/dependency-pattern.feature',
            });
            const utility = createPattern('UtilityPattern', {
              status: 'active',
              file: 'packages/architect-projection/src/projections/execution-context/support.ts',
            });
            const consumer = createPattern('ConsumerPattern', {
              status: 'active',
              file: 'packages/architect-mcp/src/tool-registry.ts',
            });
            const enabled = createPattern('EnabledPattern', {
              status: 'roadmap',
              file: 'docs-live/INDEX.md',
            });
            const neighbor = createPattern('NeighborPattern', {
              status: 'active',
              file: 'packages/architect-projection/src/projections/pattern-relations/pattern-detail.ts',
              archContext: 'projection',
              role: 'projection',
            });
            const stub = createPattern('ProjectionBodyStub', {
              file: 'architect/stubs/projection-body.stub.ts',
              targetPath:
                'packages/architect-projection/src/projections/execution-context/session-context.ts',
              implementsPatterns: ['ProjectionBody'],
            });

            state!.context = createProjectionContext({
              patterns: [pattern, dependency, utility, consumer, enabled, neighbor, stub],
              relationshipIndex: {
                ProjectionBody: createRelationshipEntry({
                  dependsOn: ['DependencyPattern'],
                  uses: ['UtilityPattern'],
                  usedBy: ['ConsumerPattern'],
                  enables: ['EnabledPattern'],
                  implementedBy: [
                    {
                      name: 'ProjectionBodyStub',
                      file: 'architect/stubs/projection-body.stub.ts',
                      description: 'Projection stub',
                    },
                  ],
                }),
              },
              includeArchIndex: true,
            });
          }
        );

        When('I project session context for the planning design and implement sessions', () => {
          state!.planningContext = parseAndProjectSessionContext(state!.context!, {
            patterns: ['ProjectionBody'],
            sessionType: 'planning',
          });
          state!.designContext = parseAndProjectSessionContext(state!.context!, {
            patterns: ['ProjectionBody'],
            sessionType: 'design',
          });
          state!.implementContext = parseAndProjectSessionContext(state!.context!, {
            patterns: ['ProjectionBody'],
            sessionType: 'implement',
          });
        });

        Then('the planning session context should stay minimal', () => {
          expect(state!.planningContext?.root).toMatchObject({
            sessionType: 'planning',
            stubs: [],
            consumers: [],
            architectureNeighbors: [],
            deliverables: [],
            testFiles: [],
          });
          expect(state!.planningContext?.root.metadata[0]).toMatchObject({
            name: 'ProjectionBody',
            summary:
              'Problem: Session work needs predictable context bundles. Solution: Projection bodies normalize those bundles.',
          });
        });

        And(
          'the design session context should include stubs consumers and architecture neighbors',
          () => {
            expect(state!.designContext?.root.stubs).toEqual([
              {
                stubFile: 'architect/stubs/projection-body.stub.ts',
                targetPath:
                  'packages/architect-projection/src/projections/execution-context/session-context.ts',
                name: 'ProjectionBodyStub',
              },
            ]);
            expect(state!.designContext?.root.consumers).toEqual([
              {
                name: 'ConsumerPattern',
                status: 'active',
                file: 'packages/architect-mcp/src/tool-registry.ts',
                kind: 'implementation',
              },
              {
                name: 'EnabledPattern',
                status: 'roadmap',
                file: 'docs-live/INDEX.md',
                kind: 'planning',
              },
            ]);
            expect(state!.designContext?.root.architectureNeighbors).toEqual([
              {
                name: 'NeighborPattern',
                status: 'active',
                role: 'projection',
                archContext: 'projection',
                file: 'packages/architect-projection/src/projections/pattern-relations/pattern-detail.ts',
              },
            ]);
          }
        );

        And('the implement session context should include test files and FSM data', () => {
          expect(state!.implementContext?.root.testFiles).toEqual([
            'tests/features/query/context.feature',
          ]);
          expect(state!.implementContext?.root.fsm).toEqual({
            currentStatus: 'active',
            validTransitions: ['completed', 'roadmap'],
            protectionLevel: 'scope',
          });
          expect(state!.implementContext?.root.fsmByPattern).toEqual([
            {
              pattern: 'ProjectionBody',
              fsm: {
                currentStatus: 'active',
                validTransitions: ['completed', 'roadmap'],
                protectionLevel: 'scope',
              },
            },
          ]);
          expect(state!.implementContext?.root.stubs).toEqual([]);
          expect(state!.implementContext?.root.architectureNeighbors).toEqual([]);
        });

        And(
          'each projected session bundle root should round-trip through the Fragment schema',
          () => {
            for (const bundle of [
              state!.planningContext,
              state!.designContext,
              state!.implementContext,
            ]) {
              const rendered = renderJson(bundle!.root);
              expect(typeof rendered).toBe('object');
              expect(rendered).not.toBeNull();
              expect(FragmentSchema.safeParse(rendered).success).toBe(true);
            }
          }
        );
      }
    );

    RuleScenario(
      'parseAndProjectSessionContext rejects invalid session options',
      ({ Given, When, Then }) => {
        Given(
          'a Execution Context session projection context with metadata stubs neighbors and tests',
          () => {
            const pattern = createPattern('ProjectionBody', {
              status: 'active',
              file: 'architect/specs/projection-body.feature',
            });

            state!.context = createProjectionContext({ patterns: [pattern] });
          }
        );

        When('I parse-and-project session context with an invalid session type', () => {
          try {
            parseAndProjectSessionContext(state!.context!, {
              patterns: ['ProjectionBody'],
              sessionType: 'review',
            });
            state!.invalidOptionsError = null;
          } catch (error) {
            state!.invalidOptionsError = error instanceof Error ? error.message : String(error);
          }
        });

        Then('parsing session context options should fail loudly', () => {
          expect(state!.invalidOptionsError).toContain(
            'Invalid options for parseAndProjectSessionContext:'
          );
          expect(state!.invalidOptionsError).toContain('sessionType');
        });
      }
    );
  });

  Rule('Reading lists and deliverables stay deterministic', ({ RuleScenario }) => {
    RuleScenario(
      'reading-list and deliverable lookups normalize the same graph data',
      ({ Given, When, Then, And }) => {
        Given(
          'a Execution Context reading-list projection context with completed and roadmap dependencies',
          () => {
            const pattern = createPattern('ProjectionBody', {
              file: 'architect/specs/projection-body.feature',
              behaviorFile: 'tests/features/query/projection-body.feature',
              deliverables: [
                {
                  name: 'Projection module',
                  status: 'in-progress',
                  tests: 1,
                  location:
                    'packages/architect-projection/src/projections/execution-context/session-context.ts',
                },
                {
                  name: 'Projection tests',
                  status: 'pending',
                  tests: 1,
                  location:
                    'packages/architect-projection/tests/features/projections/execution-context/context-session.feature',
                },
              ],
              archContext: 'projection',
            });
            const completedDependency = createPattern('CompletedDependency', {
              status: 'completed',
              file: 'architect/specs/completed-dependency.feature',
              behaviorFile: 'tests/features/query/completed-dependency.feature',
            });
            const completedDependencyImpl = createPattern('CompletedDependencyImpl', {
              file: 'packages/architect-projection/src/projections/pattern-relations/support.ts',
              implementsPatterns: ['CompletedDependency'],
            });
            const roadmapDependency = createPattern('RoadmapDependency', {
              status: 'roadmap',
              file: 'architect/specs/roadmap-dependency.feature',
              behaviorFile: 'tests/features/query/roadmap-dependency.feature',
              deliverables: [
                {
                  name: 'Roadmap dependency module',
                  status: 'pending',
                  tests: 1,
                  location: 'packages/architect-query/src/api/scope-validator.ts',
                },
              ],
            });
            const neighbor = createPattern('NeighborPattern', {
              file: 'packages/architect-projection/src/projections/governance/business-rules.ts',
              archContext: 'projection',
            });
            const stub = createPattern('ProjectionBodyStub', {
              file: 'architect/stubs/projection-body.stub.ts',
              implementsPatterns: ['ProjectionBody'],
            });

            state!.context = createProjectionContext({
              patterns: [
                pattern,
                completedDependency,
                completedDependencyImpl,
                roadmapDependency,
                neighbor,
                stub,
              ],
              relationshipIndex: {
                ProjectionBody: createRelationshipEntry({
                  dependsOn: ['CompletedDependency', 'RoadmapDependency'],
                  implementedBy: [
                    {
                      name: 'ProjectionBodyStub',
                      file: 'architect/stubs/projection-body.stub.ts',
                      description: 'Projection stub',
                    },
                  ],
                }),
                CompletedDependency: createRelationshipEntry({
                  implementedBy: [
                    {
                      name: 'CompletedDependencyImpl',
                      file: 'packages/architect-projection/src/projections/pattern-relations/support.ts',
                      description: 'Completed dependency implementation',
                    },
                  ],
                }),
              },
              includeArchIndex: true,
            });
          }
        );

        When('I project the file reading list and deliverable views for "ProjectionBody"', () => {
          state!.fileReadingList = parseAndProjectFileReadingList(state!.context!, {
            pattern: 'ProjectionBody',
          })?.root;
          state!.deliverableManifest = projectDeliverableManifest(
            state!.context!,
            'ProjectionBody'
          )?.root;
          state!.deliverable = projectDeliverable(
            state!.context!,
            'ProjectionBody',
            'projection tests'
          )?.root;
        });

        Then(
          'the file reading list should separate primary completed roadmap and architecture files',
          () => {
            expect(state!.fileReadingList).toEqual({
              kind: 'FileReadingList',
              pattern: 'ProjectionBody',
              primary: [
                'architect/specs/projection-body.feature',
                'tests/features/query/projection-body.feature',
                'packages/architect-projection/src/projections/execution-context/session-context.ts',
                'packages/architect-projection/tests/features/projections/execution-context/context-session.feature',
                'architect/stubs/projection-body.stub.ts',
              ],
              completedDeps: [
                'architect/specs/completed-dependency.feature',
                'tests/features/query/completed-dependency.feature',
                'packages/architect-projection/src/projections/pattern-relations/support.ts',
              ],
              roadmapDeps: [
                'architect/specs/roadmap-dependency.feature',
                'tests/features/query/roadmap-dependency.feature',
                'packages/architect-query/src/api/scope-validator.ts',
              ],
              architectureNeighbors: [
                'packages/architect-projection/src/projections/governance/business-rules.ts',
              ],
            });
          }
        );

        And('the deliverable manifest should preserve the declared deliverable order', () => {
          expect(state!.deliverableManifest?.items.map((item) => item.name)).toEqual([
            'Projection module',
            'Projection tests',
          ]);
        });

        And('the single deliverable lookup should be case-insensitive', () => {
          expect(state!.deliverable).toEqual({
            kind: 'Deliverable',
            name: 'Projection tests',
            status: 'pending',
            tests: ['tests/features/query/projection-body.feature'],
            location:
              'packages/architect-projection/tests/features/projections/execution-context/context-session.feature',
          });
        });
      }
    );

    RuleScenario(
      'reading-list without related files stays focused on primary sources',
      ({ Given, When, Then }) => {
        Given(
          'a Execution Context reading-list projection context with completed and roadmap dependencies',
          () => {
            const pattern = createPattern('ProjectionBody', {
              file: 'architect/specs/projection-body.feature',
              behaviorFile: 'tests/features/query/projection-body.feature',
              deliverables: [
                {
                  name: 'Projection module',
                  status: 'in-progress',
                  tests: 1,
                  location:
                    'packages/architect-projection/src/projections/execution-context/session-context.ts',
                },
              ],
              archContext: 'projection',
            });
            const completedDependency = createPattern('CompletedDependency', {
              status: 'completed',
              file: 'architect/specs/completed-dependency.feature',
            });
            const roadmapDependency = createPattern('RoadmapDependency', {
              status: 'roadmap',
              file: 'architect/specs/roadmap-dependency.feature',
            });
            const neighbor = createPattern('NeighborPattern', {
              file: 'packages/architect-projection/src/projections/governance/business-rules.ts',
              archContext: 'projection',
            });
            const stub = createPattern('ProjectionBodyStub', {
              file: 'architect/stubs/projection-body.stub.ts',
              implementsPatterns: ['ProjectionBody'],
            });

            state!.context = createProjectionContext({
              patterns: [pattern, completedDependency, roadmapDependency, neighbor, stub],
              relationshipIndex: {
                ProjectionBody: createRelationshipEntry({
                  dependsOn: ['CompletedDependency', 'RoadmapDependency'],
                  implementedBy: [
                    {
                      name: 'ProjectionBodyStub',
                      file: 'architect/stubs/projection-body.stub.ts',
                      description: 'Projection stub',
                    },
                  ],
                }),
              },
              includeArchIndex: true,
            });
          }
        );

        When('I project the file reading list for "ProjectionBody" without related files', () => {
          state!.fileReadingList = parseAndProjectFileReadingList(state!.context!, {
            pattern: 'ProjectionBody',
            includeRelated: false,
          })?.root;
        });

        Then('the file reading list should keep only primary files', () => {
          expect(state!.fileReadingList).toEqual({
            kind: 'FileReadingList',
            pattern: 'ProjectionBody',
            primary: [
              'architect/specs/projection-body.feature',
              'tests/features/query/projection-body.feature',
              'packages/architect-projection/src/projections/execution-context/session-context.ts',
              'architect/stubs/projection-body.stub.ts',
            ],
            completedDeps: [],
            roadmapDeps: [],
            architectureNeighbors: [],
          });
        });
      }
    );
  });

  Rule('Handoff stays flattened and separate from scope/context bundles', ({ RuleScenario }) => {
    RuleScenario(
      'handoff projection derives flattened session state from graph data',
      ({ Given, When, Then }) => {
        Given(
          'a Execution Context handoff projection context with mixed deliverable progress',
          () => {
            const pattern = createPattern('ProjectionBody', {
              status: 'active',
              deliverables: [
                {
                  name: 'Completed projection module',
                  status: 'complete',
                  tests: 1,
                  location:
                    'packages/architect-projection/src/projections/execution-context/session-context.ts',
                },
                {
                  name: 'Renderer parity',
                  status: 'in-progress',
                  tests: 1,
                  location: 'packages/architect-projection/src/renderers/render-compact-text.ts',
                },
                {
                  name: 'Follow-up tests',
                  status: 'pending',
                  tests: 1,
                  location:
                    'packages/architect-projection/tests/features/projections/execution-context/context-session.feature',
                },
              ],
              discoveredGaps: ['Scope details no longer have blocker arrays.'],
              discoveredImprovements: ['Keep handoff output flattened for compact rendering.'],
              discoveredLearnings: ['Design-session stub checks can stay graph-only.'],
            });
            const dependency = createPattern('DependencyPattern', {
              status: 'roadmap',
            });

            state!.context = createProjectionContext({
              patterns: [pattern, dependency],
              relationshipIndex: {
                ProjectionBody: createRelationshipEntry({
                  dependsOn: ['DependencyPattern'],
                }),
              },
            });
          }
        );

        When('I project handoff for "ProjectionBody" in the implement session', () => {
          state!.handoff = parseAndProjectHandoffRecord(state!.context!, {
            pattern: 'ProjectionBody',
            sessionType: 'implement',
            filesModified: [
              'packages/architect-projection/src/projections/execution-context/support.ts',
              'packages/architect-projection/tests/features/projections/execution-context/context-session.steps.ts',
            ],
          });
        });

        Then(
          'the handoff record should expose flattened completed in-progress discovered blockers and next-session fields',
          () => {
            expect(state!.handoff?.root).toEqual({
              kind: 'HandoffRecord',
              pattern: 'ProjectionBody',
              status: 'active',
              sessionType: 'implement',
              completed: [
                '[x] Completed projection module (packages/architect-projection/src/projections/execution-context/session-context.ts)',
              ],
              inProgress: [
                '[ ] Renderer parity (packages/architect-projection/src/renderers/render-compact-text.ts)',
              ],
              filesModified: [
                'packages/architect-projection/src/projections/execution-context/support.ts',
                'packages/architect-projection/tests/features/projections/execution-context/context-session.steps.ts',
              ],
              discovered: [
                'Gaps: Scope details no longer have blocker arrays.',
                'Improvements: Keep handoff output flattened for compact rendering.',
                'Learnings: Design-session stub checks can stay graph-only.',
              ],
              blockers: ['DependencyPattern (roadmap)'],
              nextSession:
                '1. Renderer parity (packages/architect-projection/src/renderers/render-compact-text.ts)\n2. Follow-up tests (packages/architect-projection/tests/features/projections/execution-context/context-session.feature)',
            });

            const completedContext = createProjectionContext({
              patterns: [
                createPattern('PatternGraphAPICLI', {
                  status: 'completed',
                  deliverables: [
                    {
                      name: 'CLI subcommand registry',
                      status: 'complete',
                      tests: 2,
                      location: 'packages/architect-cli/src/cli/commands/index.ts',
                    },
                  ],
                }),
              ],
            });

            const completedHandoff = parseAndProjectHandoffRecord(completedContext, {
              pattern: 'PatternGraphAPICLI',
              sessionType: 'implement',
            });

            expect(completedHandoff.root.status).toBe('completed');
            expect(completedHandoff.root.pattern).toBe('PatternGraphAPICLI');
          }
        );
      }
    );
  });
});

describe('Execution Context context and session projections adversarial coverage', () => {
  it('rejects extra session-context option properties at the strict parse boundary', () => {
    const pattern = createPattern('ProjectionBody', {
      status: 'active',
      file: 'architect/specs/projection-body.feature',
    });
    const context = createProjectionContext({ patterns: [pattern] });

    expect(() =>
      parseAndProjectSessionContext(context, {
        patterns: ['ProjectionBody'],
        sessionType: 'implement',
        extra: 'not allowed',
      })
    ).toThrow(/Invalid options for parseAndProjectSessionContext:[\s\S]*Unrecognized key: "extra"/u);
  });
});
