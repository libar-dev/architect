import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  FragmentSchema,
  projectAnnotationCoverage,
  projectOverviewDigest,
  projectRequirementExecutableDigest,
  projectRequirementDigest,
  projectRequirementSpecsDigest,
  projectRoleProfile,
  projectRoleProfiles,
  projectSourceInventoryDigest,
  projectTagUsage,
  renderJson,
  type AnnotationCoverage,
  type OverviewDigest,
  type ProjectionBundle,
  type ProjectionContext,
  type RequirementDigest,
  type RoleProfile,
  type SourceInventoryEntry,
  type TagUsageMatrix,
} from '../../../../src/index.js';
import { createTestPackageResolver } from '../../../support/test-package-resolver.js';
import {
  createPattern,
  createProjectionContext,
  createRelationshipEntry,
  createTagRegistry,
} from './support.js';

interface OperationalInsightsState {
  context: ProjectionContext | null;
  overview: ProjectionBundle<OverviewDigest> | null;
  annotationCoverage: ProjectionBundle<AnnotationCoverage> | null;
  tagUsage: ProjectionBundle<TagUsageMatrix> | null;
  sourceInventory: SourceInventoryEntry[] | null;
  roleProfile: RoleProfile | undefined;
  roleProfiles: RoleProfile[] | null;
  allRequirements: ProjectionBundle<RequirementDigest> | null;
  filteredRequirements: ProjectionBundle<RequirementDigest> | null;
  executableRequirements: ProjectionBundle<RequirementDigest> | null;
  specRequirements: ProjectionBundle<RequirementDigest> | null;
}

const feature = await loadFeature(
  'tests/features/projections/operational-insights/reporting.feature'
);

let state: OperationalInsightsState | null = null;

function createState(): OperationalInsightsState {
  return {
    context: null,
    overview: null,
    annotationCoverage: null,
    tagUsage: null,
    sourceInventory: null,
    roleProfile: undefined,
    roleProfiles: null,
    allRequirements: null,
    filteredRequirements: null,
    executableRequirements: null,
    specRequirements: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Operational Insights reporting projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Overview ports the legacy progress and blocking semantics into the fragment shape',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting an overview digest for mixed delivery work',
        ({ Given, When, Then, And }) => {
          Given(
            'a Operational Insights overview context with active phases and blocking dependencies',
            () => {
              const phaseOneDependency = createPattern('ProjectionBundleContract', {
                status: 'roadmap',
                phase: 7,
                file: 'architect/specs/projection-bundle-contract.feature',
              });
              const phaseOnePattern = createPattern('OperationalInsightsSchemas', {
                status: 'active',
                phase: 7,
                file: 'architect/specs/operational-insights-schemas.feature',
                dependsOn: ['ProjectionBundleContract'],
              });
              const phaseTwoDependency = createPattern('CoverageGraphInput', {
                status: 'active',
                phase: 19,
                file: 'packages/architect-query/src/api/coverage-analyzer.ts',
              });
              const phaseTwoPattern = createPattern('OperationalInsightsProjectionBodies', {
                status: 'roadmap',
                phase: 19,
                file: 'packages/architect-projection/src/projections/operational-insights/support.ts',
                dependsOn: ['OperationalInsightsSchemas', 'CoverageGraphInput'],
              });
              const completed = createPattern('ProjectionDeliveryReporting', {
                status: 'completed',
                phase: 18,
              });
              const unnamedActive = createPattern('OperationalInsightsUnnamedPhase', {
                status: 'active',
                phase: 18,
              });
              const candidate = createPattern('OperationalInsightsFutureIdeas', {
                status: 'candidate',
                phase: 20,
              });

              state!.context = createProjectionContext({
                patterns: [
                  phaseOneDependency,
                  phaseOnePattern,
                  phaseTwoDependency,
                  phaseTwoPattern,
                  completed,
                  unnamedActive,
                  candidate,
                ],
                phaseNames: {
                  7: 'Schema Lock',
                  19: 'Projection Bodies',
                  20: 'Future Work',
                },
                relationshipIndex: {
                  OperationalInsightsSchemas: createRelationshipEntry({
                    dependsOn: ['ProjectionBundleContract'],
                  }),
                  OperationalInsightsProjectionBodies: createRelationshipEntry({
                    dependsOn: ['OperationalInsightsSchemas', 'CoverageGraphInput'],
                  }),
                },
              });
            }
          );

          When('I project the overview digest', () => {
            state!.overview = projectOverviewDigest(state!.context!);
          });

          Then(
            'the overview digest should expose delivery progress active phases and blocking entries',
            () => {
              expect(state!.overview).toEqual({
                root: {
                  kind: 'OverviewDigest',
                  progress: {
                    total: 6,
                    completed: 1,
                    active: 3,
                    planned: 2,
                    candidate: 1,
                    percentage: 17,
                  },
                  activePhases: [
                    {
                      phase: 7,
                      name: 'Schema Lock',
                      patternCount: 2,
                      activeCount: 1,
                    },
                    {
                      phase: 18,
                      name: undefined,
                      patternCount: 2,
                      activeCount: 1,
                    },
                    {
                      phase: 19,
                      name: 'Projection Bodies',
                      patternCount: 2,
                      activeCount: 1,
                    },
                  ],
                  blocking: [
                    {
                      pattern: 'OperationalInsightsSchemas',
                      status: 'active',
                      blockedBy: ['ProjectionBundleContract'],
                    },
                    {
                      pattern: 'OperationalInsightsProjectionBodies',
                      status: 'roadmap',
                      blockedBy: ['OperationalInsightsSchemas', 'CoverageGraphInput'],
                    },
                  ],
                  cliHints: [
                    '=== DATA API — Use Instead of Explore Agents ===',
                    'pnpm architect:query -- <subcommand>',
                    '',
                    '  overview                             Project health (this output)',
                    '  context <pattern> --session <type>   Curated context bundle (planning/design/implement)',
                    '  scope-validate <pattern> <session>   Pre-flight check before starting work',
                    '  dep-tree <pattern>                   Dependency chains',
                    '  list --status roadmap                Available patterns to work on',
                    '  stubs --unresolved                   Design stubs missing implementations',
                    '  files <pattern>                      File paths for a pattern',
                    '  rules                                Business rules from Gherkin',
                    '  arch blocking                        Patterns stuck on incomplete deps',
                    '',
                    'Full reference: pnpm architect:query -- --help',
                  ],
                },
                children: {},
              });
            }
          );

          And('the overview digest should preserve unnamed active phase parity', () => {
            expect(state!.overview?.root.activePhases).toContainEqual({
              phase: 18,
              name: undefined,
              patternCount: 2,
              activeCount: 1,
            });

            const rendered = renderJson(state!.overview!.root);
            expect(typeof rendered).toBe('object');
            expect(rendered).not.toBeNull();
            expect(FragmentSchema.safeParse(rendered).success).toBe(true);
          });
        }
      );
    }
  );

  Rule('Annotation coverage stays numeric and graph-only', ({ RuleScenario }) => {
    RuleScenario(
      'projecting annotation coverage with required tag gaps',
      ({ Given, When, Then }) => {
        Given(
          'a Operational Insights coverage context with ten source files and three annotation gaps',
          () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('CoveredOne', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/overview.ts',
                }),
                createPattern('CoveredTwo', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/annotation-coverage.ts',
                }),
                createPattern('CoveredThree', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/tag-usage.ts',
                }),
                createPattern('CoveredFour', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/source-inventory.ts',
                }),
                createPattern('CoveredFive', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/role-profile.ts',
                }),
                createPattern('CoveredSix', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/requirement-digest.ts',
                }),
                createPattern('CoveredSeven', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/support.ts',
                }),
                createPattern('MissingRole', {
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/missing-role.ts',
                }),
                createPattern('MissingLayer', {
                  role: 'service',
                  file: 'packages/architect-projection/src/projections/operational-insights/missing-layer.ts',
                }),
                createPattern('MissingBoth', {
                  file: 'packages/architect-projection/src/projections/operational-insights/missing-both.ts',
                }),
              ],
              tagRegistry: createTagRegistry({
                roles: [
                  {
                    tag: 'service',
                    domain: 'Application',
                    priority: 20,
                    description: 'Application service patterns.',
                  },
                ],
                metadataTags: [
                  {
                    tag: 'arch-layer',
                    format: 'enum',
                    purpose: 'Records the architecture layer.',
                    required: true,
                    repeatable: false,
                    values: ['domain', 'application', 'infrastructure'],
                    example: '@architect-layer:application',
                  },
                ],
              }),
            });
          }
        );

        When('I project the annotation coverage digest', () => {
          state!.annotationCoverage = projectAnnotationCoverage(state!.context!);
        });

        Then(
          'the annotation coverage digest should expose raw counts percentages and per-tag gaps',
          () => {
            expect(state!.annotationCoverage).toEqual({
              root: {
                kind: 'AnnotationCoverage',
                totalSourceFiles: 10,
                annotatedFiles: 7,
                unannotatedFiles: [
                  'packages/architect-projection/src/projections/operational-insights/missing-both.ts',
                  'packages/architect-projection/src/projections/operational-insights/missing-layer.ts',
                  'packages/architect-projection/src/projections/operational-insights/missing-role.ts',
                ],
                coveragePercentage: 70,
                gapsByTag: {
                  'arch-layer': [
                    'packages/architect-projection/src/projections/operational-insights/missing-both.ts',
                    'packages/architect-projection/src/projections/operational-insights/missing-layer.ts',
                  ],
                  role: [
                    'packages/architect-projection/src/projections/operational-insights/missing-both.ts',
                    'packages/architect-projection/src/projections/operational-insights/missing-role.ts',
                  ],
                },
              },
              children: {},
            });
          }
        );
      }
    );

    RuleScenario(
      'annotation coverage does not read relationships for scalar required tags',
      ({ Given, When, Then }) => {
        Given(
          'a Operational Insights coverage context with scalar required tags and a guarded relationship index',
          () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('CoveredOne', {
                  role: 'service',
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/covered-one.ts',
                }),
                createPattern('MissingRole', {
                  archLayer: 'application',
                  file: 'packages/architect-projection/src/projections/operational-insights/missing-role.ts',
                }),
              ],
              tagRegistry: createTagRegistry({
                roles: [
                  {
                    tag: 'service',
                    domain: 'Application',
                    priority: 20,
                    description: 'Application service patterns.',
                  },
                ],
                metadataTags: [
                  {
                    tag: 'arch-layer',
                    format: 'enum',
                    purpose: 'Records the architecture layer.',
                    required: true,
                    repeatable: false,
                    values: ['domain', 'application', 'infrastructure'],
                    example: '@architect-layer:application',
                  },
                ],
              }),
            });

            Object.defineProperty(state!.context.graph, 'relationshipIndex', {
              configurable: true,
              get() {
                throw new Error('relationshipIndex should not be read for scalar coverage tags');
              },
            });
          }
        );

        When('I project the annotation coverage digest', () => {
          state!.annotationCoverage = projectAnnotationCoverage(state!.context!);
        });

        Then(
          'the annotation coverage digest should be computed without reading relationship entries',
          () => {
            expect(state!.annotationCoverage?.root).toEqual({
              kind: 'AnnotationCoverage',
              totalSourceFiles: 2,
              annotatedFiles: 1,
              unannotatedFiles: [
                'packages/architect-projection/src/projections/operational-insights/missing-role.ts',
              ],
              coveragePercentage: 50,
              gapsByTag: {
                role: [
                  'packages/architect-projection/src/projections/operational-insights/missing-role.ts',
                ],
              },
            });
          }
        );
      }
    );
  });

  Rule('Tag usage and source inventory preserve reporting aggregations', ({ RuleScenario }) => {
    RuleScenario(
      'projecting tag usage and source inventory for mixed source types',
      ({ Given, When, Then, And }) => {
        Given('a Operational Insights reporting context with mixed tags and source files', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('ServiceActiveOne', {
                status: 'active',
                role: 'service',
                archContext: 'projection',
                archLayer: 'application',
                phase: 19,
                quarter: '2026-Q2',
                team: 'projection',
                effort: 'm',
                priority: 'high',
                file: 'packages/architect-projection/src/projections/operational-insights/overview.ts',
              }),
              createPattern('ServiceCompleted', {
                status: 'completed',
                role: 'service',
                archContext: 'projection',
                archLayer: 'application',
                phase: 19,
                quarter: '2026-Q2',
                team: 'projection',
                effort: 'm',
                priority: 'high',
                file: 'packages/architect-projection/src/projections/operational-insights/support.ts',
              }),
              createPattern('CliRoadmap', {
                status: 'roadmap',
                role: 'cli',
                archContext: 'tooling',
                archLayer: 'application',
                phase: 20,
                team: 'tooling',
                priority: 'medium',
                file: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
              }),
              createPattern('DecisionRecord', {
                status: 'completed',
                role: 'service',
                file: 'packages/architect/architect/decisions/adr-006.feature',
                adr: '006',
              }),
              createPattern('ProjectionFeature', {
                status: 'active',
                role: 'service',
                file: 'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
              }),
              createPattern('ProjectionStub', {
                status: 'roadmap',
                role: 'service',
                file: 'packages/architect/architect/stubs/operational-insights.stub.ts',
              }),
            ],
          });
        });

        When('I project the tag usage and source inventory views', () => {
          state!.tagUsage = projectTagUsage(state!.context!);
          state!.sourceInventory = projectSourceInventoryDigest(state!.context!).root.items;
        });

        Then('the tag usage matrix should preserve the aggregated counts', () => {
          expect(state!.tagUsage).toEqual({
            root: {
              kind: 'TagUsageMatrix',
              tags: [
                {
                  kind: 'TagUsageEntry',
                  tag: 'role',
                  count: 6,
                  values: [
                    { value: 'service', count: 5 },
                    { value: 'cli', count: 1 },
                  ],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'status',
                  count: 6,
                  values: [
                    { value: 'active', count: 2 },
                    { value: 'completed', count: 2 },
                    { value: 'roadmap', count: 2 },
                  ],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'arch-context',
                  count: 3,
                  values: [
                    { value: 'projection', count: 2 },
                    { value: 'tooling', count: 1 },
                  ],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'arch-layer',
                  count: 3,
                  values: [{ value: 'application', count: 3 }],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'phase',
                  count: 3,
                  values: [
                    { value: '19', count: 2 },
                    { value: '20', count: 1 },
                  ],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'priority',
                  count: 3,
                  values: [
                    { value: 'high', count: 2 },
                    { value: 'medium', count: 1 },
                  ],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'team',
                  count: 3,
                  values: [
                    { value: 'projection', count: 2 },
                    { value: 'tooling', count: 1 },
                  ],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'effort',
                  count: 2,
                  values: [{ value: 'm', count: 2 }],
                },
                {
                  kind: 'TagUsageEntry',
                  tag: 'quarter',
                  count: 2,
                  values: [{ value: '2026-Q2', count: 2 }],
                },
              ],
              patternCount: 6,
            },
            children: {},
          });
        });

        And('the source inventory should preserve categorized unique files', () => {
          expect(state!.sourceInventory).toEqual([
            {
              kind: 'SourceInventoryEntry',
              type: 'TypeScript (annotated)',
              count: 3,
              locationPattern: 'packages/**/*.ts',
              files: [
                'packages/architect-cli/src/cli/pattern-graph-cli.ts',
                'packages/architect-projection/src/projections/operational-insights/overview.ts',
                'packages/architect-projection/src/projections/operational-insights/support.ts',
              ],
            },
            {
              kind: 'SourceInventoryEntry',
              type: 'Gherkin (features)',
              count: 1,
              locationPattern:
                'packages/architect-projection/tests/features/projections/operational-insights/**/*.feature',
              files: [
                'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
              ],
            },
            {
              kind: 'SourceInventoryEntry',
              type: 'Decisions',
              count: 1,
              locationPattern: 'packages/architect/architect/decisions/**/*.feature',
              files: ['packages/architect/architect/decisions/adr-006.feature'],
            },
            {
              kind: 'SourceInventoryEntry',
              type: 'Stubs',
              count: 1,
              locationPattern: 'packages/architect/architect/stubs/**/*.ts',
              files: ['packages/architect/architect/stubs/operational-insights.stub.ts'],
            },
          ]);
        });
      }
    );
  });

  Rule(
    'Role profiles normalize configured role definitions deterministically',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting one role and the full role catalog',
        ({ Given, When, Then, And }) => {
          Given(
            'a Operational Insights role context with configured roles aliases and examples',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('ContextAssemblerImpl', { role: 'service' }),
                  createPattern('PatternGraphAPI', { role: 'service' }),
                  createPattern('PatternGraphCli', { role: 'cli' }),
                ],
                tagRegistry: createTagRegistry({
                  roles: [
                    {
                      tag: 'service',
                      domain: 'Application',
                      priority: 20,
                      description: 'Coordinates use cases and delegates to lower layers.',
                      aliases: ['app-service'],
                    },
                    {
                      tag: 'cli',
                      domain: 'Delivery',
                      priority: 30,
                      description: 'Owns command-line entrypoints.',
                    },
                  ],
                }),
              });
            }
          );

          When('I project the role profile for "APP-SERVICE" and all role profiles', () => {
            state!.roleProfile = projectRoleProfile(state!.context!, 'APP-SERVICE')?.root;
            state!.roleProfiles = projectRoleProfiles(state!.context!).root.items;
          });

          Then('the single role profile should resolve the canonical role definition', () => {
            expect(state!.roleProfile).toEqual({
              kind: 'RoleProfile',
              tag: 'service',
              domain: 'Application',
              priority: 20,
              count: 2,
              description: 'Coordinates use cases and delegates to lower layers.',
              examples: ['ContextAssemblerImpl', 'PatternGraphAPI'],
            });
          });

          And(
            'the role profile catalog should stay in registry order with deterministic examples',
            () => {
              expect(state!.roleProfiles).toEqual([
                {
                  kind: 'RoleProfile',
                  tag: 'service',
                  domain: 'Application',
                  priority: 20,
                  count: 2,
                  description: 'Coordinates use cases and delegates to lower layers.',
                  examples: ['ContextAssemblerImpl', 'PatternGraphAPI'],
                },
                {
                  kind: 'RoleProfile',
                  tag: 'cli',
                  domain: 'Delivery',
                  priority: 30,
                  count: 1,
                  description: 'Owns command-line entrypoints.',
                  examples: ['PatternGraphCli'],
                },
              ]);
            }
          );
        }
      );
    }
  );

  Rule(
    'Requirement digests stay structured and filterable without renderable docs',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting requirement digests for all areas and one product area',
        ({ Given, When, Then, And }) => {
          Given(
            'a Operational Insights requirement context with product requirements and one ADR decision',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('CoverageProjection', {
                    status: 'completed',
                    productArea: 'Projection Platform',
                    userRole: 'Maintainer',
                    description: 'Expose graph-only annotation coverage as a typed fragment.',
                    useCases: ['Report numeric coverage in Studio dashboards'],
                    rules: [
                      {
                        name: 'Numeric coverage only',
                        description: '**Invariant:** Coverage values remain numeric.',
                        scenarioNames: ['Dashboard reads annotation coverage'],
                        scenarioCount: 1,
                      },
                    ],
                    executableSpecs: [
                      'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                    ],
                  }),
                  createPattern('RequirementCatalog', {
                    status: 'active',
                    productArea: 'Projection Platform',
                    description:
                      'Aggregate requirement digests without creating renderable documents.',
                    behaviorFile: 'packages/architect/tests/features/query/context.feature',
                  }),
                  createPattern('RoleInsights', {
                    status: 'roadmap',
                    productArea: 'Tooling Insights',
                    description: '',
                    executableSpecs: ['packages/architect/tests/features/query/context.feature'],
                  }),
                  createPattern('OperatorNeeds', {
                    status: 'active',
                    userRole: 'Operator',
                    businessValue: 'Expose requirement digests beyond product-area tags.',
                    description:
                      'Include PRD patterns that only carry user-role/business-value metadata.',
                    executableSpecs: ['packages/architect/tests/features/query/context.feature'],
                  }),
                  createPattern('ADRProjectionDecision', {
                    status: 'completed',
                    productArea: 'Projection Platform',
                    description: 'ADR entries must stay out of requirement digests.',
                    adr: '019',
                  }),
                ],
              });
            }
          );

          When(
            'I project the requirement digests for all areas and for "Projection Platform"',
            () => {
              state!.allRequirements = projectRequirementDigest(state!.context!);
              state!.filteredRequirements = projectRequirementDigest(
                state!.context!,
                'Projection Platform'
              );
            }
          );

          Then(
            'the all-areas requirement digest should aggregate every non-ADR product requirement',
            () => {
              expect(state!.allRequirements).toEqual({
                root: {
                  kind: 'RequirementDigest',
                  productArea: 'All Product Areas',
                  businessRuleReferences: [
                    {
                      kind: 'BusinessRuleReference',
                      feature: 'CoverageProjection',
                      ruleName: 'Numeric coverage only',
                      ownerRouteId: 'business-rules:architect-projection',
                    },
                  ],
                  requirements: [
                    {
                      pattern: 'OperatorNeeds',
                      ownerRouteId:
                        'requirements-executable:architect-projection:requirement:operator-needs',
                      status: 'active',
                      description: [
                        { type: 'heading', level: 2, text: 'Requirement' },
                        {
                          type: 'paragraph',
                          text: 'Include PRD patterns that only carry user-role/business-value metadata.',
                        },
                      ],
                      testFiles: ['packages/architect/tests/features/query/context.feature'],
                    },
                    {
                      pattern: 'CoverageProjection',
                      ownerRouteId:
                        'requirements-executable:architect-projection:requirement:coverage-projection',
                      status: 'completed',
                      description: [
                        { type: 'heading', level: 2, text: 'Requirement' },
                        {
                          type: 'paragraph',
                          text: 'Expose graph-only annotation coverage as a typed fragment.',
                        },
                        { type: 'heading', level: 3, text: 'Use Cases' },
                        {
                          type: 'list',
                          ordered: false,
                          items: ['Report numeric coverage in Studio dashboards'],
                        },
                        { type: 'heading', level: 3, text: 'Business Rules' },
                        {
                          type: 'list',
                          ordered: false,
                          items: ['Numeric coverage only'],
                        },
                      ],
                      testFiles: [
                        'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                      ],
                    },
                    {
                      pattern: 'RequirementCatalog',
                      ownerRouteId:
                        'requirements-executable:architect-projection:requirement:requirement-catalog',
                      status: 'active',
                      description: [
                        { type: 'heading', level: 2, text: 'Requirement' },
                        {
                          type: 'paragraph',
                          text: 'Aggregate requirement digests without creating renderable documents.',
                        },
                      ],
                      testFiles: ['packages/architect/tests/features/query/context.feature'],
                    },
                    {
                      pattern: 'RoleInsights',
                      ownerRouteId:
                        'requirements-specs:architect-projection:requirement:role-insights',
                      status: 'roadmap',
                      description: [
                        { type: 'paragraph', text: 'No requirement description recorded.' },
                      ],
                      testFiles: ['packages/architect/tests/features/query/context.feature'],
                    },
                  ],
                },
                children: {},
              });
            }
          );

          And(
            'the all-areas requirement digest should include product-metadata requirements without a product area',
            () => {
              expect(
                state!.allRequirements?.root.requirements.map((requirement) => requirement.pattern)
              ).toContain('OperatorNeeds');
            }
          );

          And(
            'the filtered requirement digest should keep structured blocks and test file references',
            () => {
              expect(state!.filteredRequirements).toEqual({
                root: {
                  kind: 'RequirementDigest',
                  productArea: 'Projection Platform',
                  businessRuleReferences: [
                    {
                      kind: 'BusinessRuleReference',
                      feature: 'CoverageProjection',
                      ruleName: 'Numeric coverage only',
                      ownerRouteId: 'business-rules:architect-projection',
                    },
                  ],
                  requirements: [
                    {
                      pattern: 'CoverageProjection',
                      ownerRouteId:
                        'requirements-executable:architect-projection:requirement:coverage-projection',
                      status: 'completed',
                      description: [
                        { type: 'heading', level: 2, text: 'Requirement' },
                        {
                          type: 'paragraph',
                          text: 'Expose graph-only annotation coverage as a typed fragment.',
                        },
                        { type: 'heading', level: 3, text: 'Use Cases' },
                        {
                          type: 'list',
                          ordered: false,
                          items: ['Report numeric coverage in Studio dashboards'],
                        },
                        { type: 'heading', level: 3, text: 'Business Rules' },
                        {
                          type: 'list',
                          ordered: false,
                          items: ['Numeric coverage only'],
                        },
                      ],
                      testFiles: [
                        'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                      ],
                    },
                    {
                      pattern: 'RequirementCatalog',
                      ownerRouteId:
                        'requirements-executable:architect-projection:requirement:requirement-catalog',
                      status: 'active',
                      description: [
                        { type: 'heading', level: 2, text: 'Requirement' },
                        {
                          type: 'paragraph',
                          text: 'Aggregate requirement digests without creating renderable documents.',
                        },
                      ],
                      testFiles: ['packages/architect/tests/features/query/context.feature'],
                    },
                  ],
                },
                children: {},
              });
            }
          );
        }
      );

      RuleScenario(
        'requirement digests aggregate business-rule references for duplicate feature names',
        ({ Given, When, Then, And }) => {
          Given(
            'a Operational Insights requirement context with duplicate feature names across packages',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('SharedRequirementRef', {
                    status: 'active',
                    productArea: 'Alpha',
                    phase: 12,
                    file: 'packages/architect-core/src/shared-requirement-ref.ts',
                    description: 'First package owns one rule for the shared requirement.',
                    behaviorFile: 'packages/architect/tests/features/query/context.feature',
                    rules: [
                      {
                        name: 'Alpha rule',
                        description: '**Invariant:** Alpha rule stays attached.',
                        scenarioNames: ['duplicate feature rule alpha'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                  createPattern('SharedRequirementRef', {
                    patternName: 'SharedRequirementRef',
                    status: 'completed',
                    productArea: 'Beta',
                    phase: 18,
                    file: 'packages/architect-projection/src/shared-requirement-ref.ts',
                    description:
                      'Second package contributes another rule to the same feature name.',
                    executableSpecs: [
                      'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                    ],
                    rules: [
                      {
                        name: 'Beta rule',
                        description: '**Invariant:** Beta rule stays attached.',
                        scenarioNames: ['duplicate feature rule beta'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                ],
              });
            }
          );

          When('I project the requirement digest for all areas', () => {
            state!.allRequirements = projectRequirementDigest(state!.context!);
          });

          Then(
            'the all-areas requirement digest should aggregate duplicate-feature business-rule references deterministically',
            () => {
              expect(state!.allRequirements?.root.businessRuleReferences).toEqual([
                {
                  kind: 'BusinessRuleReference',
                  feature: 'SharedRequirementRef',
                  ruleName: 'Alpha rule',
                  ownerRouteId: 'business-rules:architect-core',
                },
                {
                  kind: 'BusinessRuleReference',
                  feature: 'SharedRequirementRef',
                  ruleName: 'Beta rule',
                  ownerRouteId: 'business-rules:architect-projection',
                },
              ]);
            }
          );

          And(
            'the all-areas requirement digest should expose stable owner routes for duplicate-feature entries',
            () => {
              expect(state!.allRequirements?.root.requirements).toEqual([
                {
                  pattern: 'SharedRequirementRef',
                  ownerRouteId:
                    'requirements-executable:architect-core:requirement:shared-requirement-ref',
                  status: 'active',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    {
                      type: 'paragraph',
                      text: 'First package owns one rule for the shared requirement.',
                    },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    {
                      type: 'list',
                      ordered: false,
                      items: ['Alpha rule'],
                    },
                  ],
                  testFiles: ['packages/architect/tests/features/query/context.feature'],
                },
                {
                  pattern: 'SharedRequirementRef',
                  ownerRouteId:
                    'requirements-executable:architect-projection:requirement:shared-requirement-ref',
                  status: 'completed',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    {
                      type: 'paragraph',
                      text: 'Second package contributes another rule to the same feature name.',
                    },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    {
                      type: 'list',
                      ordered: false,
                      items: ['Beta rule'],
                    },
                  ],
                  testFiles: [
                    'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                  ],
                },
              ]);
            }
          );
        }
      );

      RuleScenario(
        'executable requirement digests keep duplicate-feature references local to each child',
        ({ Given, When, Then, And }) => {
          Given(
            'a Operational Insights requirement context with duplicate feature names across packages',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('SharedRequirementRef', {
                    status: 'active',
                    productArea: 'Alpha',
                    phase: 12,
                    file: 'packages/architect-core/src/shared-requirement-ref.ts',
                    description: 'First package owns one rule for the shared requirement.',
                    behaviorFile: 'packages/architect/tests/features/query/context.feature',
                    rules: [
                      {
                        name: 'Alpha rule',
                        description: '**Invariant:** Alpha rule stays attached.',
                        scenarioNames: ['duplicate feature rule alpha'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                  createPattern('SharedRequirementRef', {
                    patternName: 'SharedRequirementRef',
                    status: 'completed',
                    productArea: 'Beta',
                    phase: 18,
                    file: 'packages/architect-projection/src/shared-requirement-ref.ts',
                    description:
                      'Second package contributes another rule to the same feature name.',
                    executableSpecs: [
                      'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                    ],
                    rules: [
                      {
                        name: 'Beta rule',
                        description: '**Invariant:** Beta rule stays attached.',
                        scenarioNames: ['duplicate feature rule beta'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                ],
              });
            }
          );

          When('I project the requirements-executable digest', () => {
            state!.executableRequirements = projectRequirementExecutableDigest(state!.context!);
          });

          Then(
            'the executable requirement root should aggregate duplicate-feature references deterministically',
            () => {
              expect(state!.executableRequirements?.root.businessRuleReferences).toEqual([
                {
                  kind: 'BusinessRuleReference',
                  feature: 'SharedRequirementRef',
                  ruleName: 'Alpha rule',
                  ownerRouteId: 'business-rules:architect-core',
                },
                {
                  kind: 'BusinessRuleReference',
                  feature: 'SharedRequirementRef',
                  ruleName: 'Beta rule',
                  ownerRouteId: 'business-rules:architect-projection',
                },
              ]);
            }
          );

          And(
            'the executable requirement root should expose stable owner routes for duplicate-feature entries',
            () => {
              expect(state!.executableRequirements?.root.requirements).toEqual([
                {
                  pattern: 'SharedRequirementRef',
                  ownerRouteId:
                    'requirements-executable:architect-core:requirement:shared-requirement-ref',
                  status: 'active',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    {
                      type: 'paragraph',
                      text: 'First package owns one rule for the shared requirement.',
                    },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    {
                      type: 'list',
                      ordered: false,
                      items: ['Alpha rule'],
                    },
                  ],
                  testFiles: ['packages/architect/tests/features/query/context.feature'],
                },
                {
                  pattern: 'SharedRequirementRef',
                  ownerRouteId:
                    'requirements-executable:architect-projection:requirement:shared-requirement-ref',
                  status: 'completed',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    {
                      type: 'paragraph',
                      text: 'Second package contributes another rule to the same feature name.',
                    },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    {
                      type: 'list',
                      ordered: false,
                      items: ['Beta rule'],
                    },
                  ],
                  testFiles: [
                    'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                  ],
                },
              ]);
            }
          );

          And(
            'the executable requirement root should preserve all-areas sort order for duplicate-feature entries',
            () => {
              expect(
                state!.executableRequirements?.root.requirements.map((entry) => entry.ownerRouteId)
              ).toEqual([
                'requirements-executable:architect-core:requirement:shared-requirement-ref',
                'requirements-executable:architect-projection:requirement:shared-requirement-ref',
              ]);
            }
          );

          And(
            'the executable requirement package and detail children should keep only local business-rule references',
            () => {
              expect(
                state!.executableRequirements?.children['requirements-executable:architect-core']
              ).toEqual({
                kind: 'RequirementDigest',
                productArea: 'architect-core',
                requirements: [
                  {
                    pattern: 'SharedRequirementRef',
                    ownerRouteId:
                      'requirements-executable:architect-core:requirement:shared-requirement-ref',
                    status: 'active',
                    description: [
                      { type: 'heading', level: 2, text: 'Requirement' },
                      {
                        type: 'paragraph',
                        text: 'First package owns one rule for the shared requirement.',
                      },
                      { type: 'heading', level: 3, text: 'Business Rules' },
                      {
                        type: 'list',
                        ordered: false,
                        items: ['Alpha rule'],
                      },
                    ],
                    testFiles: ['packages/architect/tests/features/query/context.feature'],
                  },
                ],
                businessRuleReferences: [
                  {
                    kind: 'BusinessRuleReference',
                    feature: 'SharedRequirementRef',
                    ruleName: 'Alpha rule',
                    ownerRouteId: 'business-rules:architect-core',
                  },
                ],
              });

              expect(
                state!.executableRequirements?.children[
                  'requirements-executable:architect-projection:requirement:shared-requirement-ref'
                ]
              ).toEqual({
                kind: 'RequirementDigest',
                productArea: 'SharedRequirementRef',
                requirements: [
                  {
                    pattern: 'SharedRequirementRef',
                    ownerRouteId:
                      'requirements-executable:architect-projection:requirement:shared-requirement-ref',
                    status: 'completed',
                    description: [
                      { type: 'heading', level: 2, text: 'Requirement' },
                      {
                        type: 'paragraph',
                        text: 'Second package contributes another rule to the same feature name.',
                      },
                      { type: 'heading', level: 3, text: 'Business Rules' },
                      {
                        type: 'list',
                        ordered: false,
                        items: ['Beta rule'],
                      },
                    ],
                    testFiles: [
                      'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                    ],
                  },
                ],
                businessRuleReferences: [
                  {
                    kind: 'BusinessRuleReference',
                    feature: 'SharedRequirementRef',
                    ruleName: 'Beta rule',
                    ownerRouteId: 'business-rules:architect-projection',
                  },
                ],
              });
            }
          );
        }
      );

      RuleScenario(
        'executable requirement routes use resolver package ids outside packages slash star',
        ({ Given, When, Then }) => {
          Given(
            'a Operational Insights requirement context with a tests-features executable requirement',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('HarnessRequirement', {
                    status: 'active',
                    productArea: 'Projection Platform',
                    file: 'tests/features/harness-requirement.ts',
                    description:
                      'Executable requirements outside packages should still get stable routes.',
                    executableSpecs: ['tests/features/harness-requirement.feature'],
                    rules: [
                      {
                        name: 'Harness rule',
                        description:
                          '**Invariant:** Harness requirement keeps its local business rule.',
                        scenarioNames: ['harness requirement route'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                ],
                packageResolver: createTestPackageResolver(),
              });
            }
          );

          When('I project the requirements-executable digest', () => {
            state!.executableRequirements = projectRequirementExecutableDigest(state!.context!);
          });

          Then(
            'the executable requirement digest should use the resolver-derived package id for routes',
            () => {
              expect(state!.executableRequirements?.root.requirements).toEqual([
                {
                  pattern: 'HarnessRequirement',
                  ownerRouteId:
                    'requirements-executable:architect-dev:requirement:harness-requirement',
                  status: 'active',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    {
                      type: 'paragraph',
                      text: 'Executable requirements outside packages should still get stable routes.',
                    },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    {
                      type: 'list',
                      ordered: false,
                      items: ['Harness rule'],
                    },
                  ],
                  testFiles: ['tests/features/harness-requirement.feature'],
                },
              ]);

              expect(state!.executableRequirements?.children).toHaveProperty(
                'requirements-executable:architect-dev'
              );
              expect(state!.executableRequirements?.children).toHaveProperty(
                'requirements-executable:architect-dev:requirement:harness-requirement'
              );
            }
          );
        }
      );

      RuleScenario(
        'package scoped architect releases stay out of requirement digests',
        ({ Given, When, Then }) => {
          Given(
            'a Operational Insights requirement context with a nested architect release pattern',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('NestedArchitectRelease', {
                    status: 'completed',
                    productArea: 'Projection Platform',
                    file: 'packages/architect/architect/releases/2026-q2-release.feature',
                    description: 'Release notes must not appear in requirement digests.',
                    rules: [
                      {
                        name: 'Release rule',
                        description: '**Invariant:** Release notes stay excluded.',
                        scenarioNames: ['nested architect release exclusion'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                  createPattern('RealRequirement', {
                    status: 'active',
                    productArea: 'Projection Platform',
                    description: 'Real requirement stays present.',
                    executableSpecs: [
                      'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                    ],
                  }),
                ],
              });
            }
          );

          When('I project the requirement digest for all areas', () => {
            state!.allRequirements = projectRequirementDigest(state!.context!);
          });

          Then(
            'the nested architect release pattern should be excluded from the all-areas requirement digest',
            () => {
              expect(state!.allRequirements?.root.requirements).toEqual([
                {
                  pattern: 'RealRequirement',
                  ownerRouteId:
                    'requirements-executable:architect-projection:requirement:real-requirement',
                  status: 'active',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    { type: 'paragraph', text: 'Real requirement stays present.' },
                  ],
                  testFiles: [
                    'packages/architect-projection/tests/features/projections/operational-insights/reporting.feature',
                  ],
                },
              ]);
            }
          );
        }
      );

      RuleScenario(
        'requirements-specs digests keep duplicate planned feature names routable per package',
        ({ Given, When, Then, And }) => {
          Given(
            'a Operational Insights requirement context with duplicate planned feature names across packages',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('SharedPlannedRequirement', {
                    status: 'roadmap',
                    productArea: 'Alpha',
                    file: 'packages/architect-core/src/shared-planned-requirement.ts',
                    description: 'Package-specific planned requirement alpha.',
                    rules: [
                      {
                        name: 'Alpha planned rule',
                        description: '**Invariant:** Planned alpha rule stays attached.',
                        scenarioNames: ['duplicate planned feature alpha'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                  createPattern('SharedPlannedRequirement', {
                    patternName: 'SharedPlannedRequirement',
                    status: 'roadmap',
                    productArea: 'Beta',
                    file: 'packages/architect-projection/src/shared-planned-requirement.ts',
                    description: 'Package-specific planned requirement beta.',
                    rules: [
                      {
                        name: 'Beta planned rule',
                        description: '**Invariant:** Planned beta rule stays attached.',
                        scenarioNames: ['duplicate planned feature beta'],
                        scenarioCount: 1,
                      },
                    ],
                  }),
                ],
              });
            }
          );

          When('I project the requirements-specs digest', () => {
            state!.specRequirements = projectRequirementSpecsDigest(state!.context!);
          });

          Then(
            'the requirements-specs root should aggregate duplicate planned features deterministically',
            () => {
              expect(state!.specRequirements?.root.requirements).toEqual([
                {
                  pattern: 'SharedPlannedRequirement',
                  ownerRouteId:
                    'requirements-specs:architect-core:requirement:shared-planned-requirement',
                  status: 'roadmap',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    { type: 'paragraph', text: 'Package-specific planned requirement alpha.' },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    { type: 'list', ordered: false, items: ['Alpha planned rule'] },
                  ],
                  testFiles: [],
                },
                {
                  pattern: 'SharedPlannedRequirement',
                  ownerRouteId:
                    'requirements-specs:architect-projection:requirement:shared-planned-requirement',
                  status: 'roadmap',
                  description: [
                    { type: 'heading', level: 2, text: 'Requirement' },
                    { type: 'paragraph', text: 'Package-specific planned requirement beta.' },
                    { type: 'heading', level: 3, text: 'Business Rules' },
                    { type: 'list', ordered: false, items: ['Beta planned rule'] },
                  ],
                  testFiles: [],
                },
              ]);
            }
          );

          And(
            'the requirements-specs child routes should stay package-stable for duplicate planned feature names',
            () => {
              expect(state!.specRequirements?.children).toHaveProperty(
                'requirements-specs:architect-core:requirement:shared-planned-requirement'
              );
              expect(state!.specRequirements?.children).toHaveProperty(
                'requirements-specs:architect-projection:requirement:shared-planned-requirement'
              );
            }
          );
        }
      );
    }
  );
});
