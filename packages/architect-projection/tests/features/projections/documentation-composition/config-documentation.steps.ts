import { readFile } from 'node:fs/promises';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { ProjectMetadata } from '@libar-dev/architect-core';
import { expect } from 'vitest';

import {
  FragmentSchema,
  type Fragment,
  PROGRESSIVE_DISCLOSURE_LEVELS,
  ProjectionError,
  SupportedDocumentationTypeRegistryEntrySchema,
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  parseAndProjectConfig,
  parseAndProjectDocumentationBundle,
  parseAndProjectPrChangeReview,
  renderJson,
  renderMarkdown,
  type ArchitectureDiagram,
  type PrChangeReview,
  type ProjectConfigSnapshot,
  type ProjectionBundle,
  type ProjectionContext,
  type SupportedDocumentationType,
} from '../../../../src/index.js';
import { projectArchitectureDiagram } from '../../../../src/projections/documentation-composition/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface DocumentationCompositionState {
  context: ProjectionContext | null;
  configSnapshot: ProjectionBundle<ProjectConfigSnapshot> | null;
  documentationViews: Partial<Record<SupportedDocumentationType, ProjectionBundle<Fragment>>>;
  rejectedTypes: Map<string, unknown>;
  architectureDiagrams: Partial<
    Record<ArchitectureDiagram['scope'], ProjectionBundle<ArchitectureDiagram>>
  >;
  prChangeReview: ProjectionBundle<PrChangeReview> | null;
  invalidOptionsError: string | null;
  barrelAudit: OptionsSchemaBarrelAuditSummary | null;
}

interface OptionsSchemaBarrelAuditSummary {
  rootBarrelHasProjectionAggregate: boolean;
  publicOptionsSchemaExports: string[];
  rootOptionsSchemaExports: string[];
  missingExports: string[];
  unexpectedExports: string[];
}

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/config-documentation.feature'
);

let state: DocumentationCompositionState | null = null;

const projectMetadata = { name: 'Architect Studio' } satisfies ProjectMetadata;

function createState(): DocumentationCompositionState {
  return {
    context: null,
    configSnapshot: null,
    documentationViews: {},
    rejectedTypes: new Map(),
    architectureDiagrams: {},
    prChangeReview: null,
    invalidOptionsError: null,
    barrelAudit: null,
  };
}

const supportedDocumentTypes: readonly SupportedDocumentationType[] =
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key);

const disclosureGroupingAxes = [
  'flat',
  'package',
  'product-area',
  'phase',
  'feature',
  'per-entity',
] as const;

const disclosureRichnessLevels = [
  'name-only',
  'summary',
  'summary-with-references',
  'full',
] as const;

const droppedDocumentTypes = [
  'reference',
  'product-areas',
  'design-review',
  'product-requirements',
] as const;

function assertRequirementDocumentationLinksResolve(
  requirementsView: ProjectionBundle<Fragment> | undefined,
  rootFile: string,
  documentType: 'requirements-executable' | 'requirements-specs',
  expectedTarget: string
): void {
  expect(requirementsView).toBeDefined();

  const rendered = renderMarkdown(requirementsView!, {
    disclosureLevel: 'useful',
    includeChildren: true,
    splitStrategy: 'never',
  });
  expect(typeof rendered).toBe('object');

  if (typeof rendered === 'string') {
    throw new Error(`Expected routed markdown output for ${documentType} docs.`);
  }

  const root = rendered[rootFile];
  expect(root).toBeDefined();
  expect(root).not.toContain('Link Target');

  const childLinkPattern = new RegExp(String.raw`\[[^\]]+\]\((${documentType}/[^)]+\.md)\)`, 'gu');
  const linkTargets = [...root!.matchAll(childLinkPattern)].map((match) => match[1]);
  expect(linkTargets).toContain(expectedTarget);

  for (const target of linkTargets) {
    expect(rendered[target!]).toBeDefined();
  }
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Documentation Composition projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Project config snapshots normalize the legacy Studio payload into fragment contracts',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting a config snapshot with grouped source globs',
        ({ Given, When, Then, And }) => {
          Given(
            'a Documentation Composition config context with project metadata and grouped source globs',
            () => {
              state!.context = createProjectionContext({
                projectMetadata,
                patterns: [
                  createPattern('ProjectionDocs', {
                    status: 'active',
                    phase: 20,
                    role: 'projection',
                  }),
                  createPattern('ProjectionCli', {
                    status: 'roadmap',
                    phase: 21,
                    role: 'service',
                  }),
                ],
              });
            }
          );

          When('I project the config snapshot', () => {
            state!.configSnapshot = parseAndProjectConfig(state!.context!, {
              baseDir: '/fixtures/architect-studio',
              configPath: '/fixtures/architect-studio/architect.config.ts',
              sourceGlobs: {
                input: ['packages/architect-projection/src/**/*.ts'],
                features: ['packages/architect-projection/tests/features/**/*.feature'],
                exclude: ['dist/**', '!coverage/**'],
              },
              buildTimeMs: 184,
            });
          });

          Then('the config snapshot should flatten source globs and preserve graph counts', () => {
            expect(state!.configSnapshot?.root).toEqual({
              kind: 'ProjectConfigSnapshot',
              baseDir: '/fixtures/architect-studio',
              configPath: '/fixtures/architect-studio/architect.config.ts',
              sourceGlobs: [
                'packages/architect-projection/src/**/*.ts',
                'packages/architect-projection/tests/features/**/*.feature',
                '!dist/**',
                '!coverage/**',
              ],
              buildTimeMs: 184,
              patternCount: 2,
              phaseCount: 2,
              roleCount: 2,
              projectName: 'Architect Studio',
            });
          });

          And('the config snapshot root should round-trip through the Fragment schema', () => {
            const rendered = renderJson(state!.configSnapshot!.root);
            expect(typeof rendered).toBe('object');
            expect(rendered).not.toBeNull();
            expect(FragmentSchema.safeParse(rendered).success).toBe(true);
          });
        }
      );

      RuleScenario(
        'parseAndProjectConfig rejects malformed source glob groups',
        ({ Given, When, Then }) => {
          Given(
            'a Documentation Composition config context with project metadata and grouped source globs',
            () => {
              state!.context = createProjectionContext({
                projectMetadata,
                patterns: [createPattern('ProjectionDocs', { status: 'active', phase: 20 })],
              });
            }
          );

          When('I parse-and-project a config snapshot with malformed source glob groups', () => {
            try {
              parseAndProjectConfig(state!.context!, {
                baseDir: '/fixtures/architect-studio',
                configPath: '/fixtures/architect-studio/architect.config.ts',
                buildTimeMs: 184,
                sourceGlobs: {
                  input: 'packages/architect-projection/src/**/*.ts',
                  features: [],
                },
              });
              state!.invalidOptionsError = null;
            } catch (error) {
              state!.invalidOptionsError = error instanceof Error ? error.message : String(error);
            }
          });

          Then('parsing config projection options should fail loudly', () => {
            expect(state!.invalidOptionsError).toContain(
              'Invalid options for parseAndProjectConfig:'
            );
            expect(state!.invalidOptionsError).toContain('sourceGlobs');
          });
        }
      );
    }
  );

  Rule(
    'Documentation dispatch only supports the retained Documentation Composition document types',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting all supported documentation bundles',
        ({ Given, When, Then, And }) => {
          Given(
            'a Documentation Composition documentation context with delivery architecture requirements and decisions data',
            () => {
              state!.context = createDocumentationContext();
            }
          );

          When('I project every supported documentation bundle', () => {
            for (const documentType of supportedDocumentTypes) {
              state!.documentationViews[documentType] = parseAndProjectDocumentationBundle(
                state!.context!,
                { documentType }
              );
            }
          });

          Then(
            'each supported documentation bundle should return a non-empty root section bundle',
            () => {
              for (const documentType of supportedDocumentTypes) {
                const result = state!.documentationViews[documentType];
                expect(result).toBeDefined();
                expect(FragmentSchema.safeParse(result?.root).success).toBe(true);
                expect(result?.routing?.rootRouteId ?? `${documentType}:index`).toBe(
                  `${documentType}:index`
                );
              }
            }
          );

          And(
            'the supported documentation registry should expose metadata for every live surface',
            () => {
              expect(SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key)).toEqual(
                supportedDocumentTypes
              );
              for (const metadata of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
                expect(metadata.displayTitle.length).toBeGreaterThan(0);
                expect(metadata.rootRouteId).toBe(`${metadata.key}:index`);
                expect(metadata.markdownRootTarget).toMatch(/\.md$/);
                expect(metadata.defaultDisclosureLevel).toMatch(
                  /^(essential|important|useful|advanced)$/
                );
                expect(metadata.generatorName.length).toBeGreaterThan(0);
                expect(
                  SupportedDocumentationTypeRegistryEntrySchema.safeParse(metadata).success
                ).toBe(true);
              }
            }
          );

          And(
            'each supported documentation registry entry should define a complete disclosure matrix',
            () => {
              for (const metadata of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
                expect(Object.keys(metadata.disclosureMatrix).sort()).toEqual(
                  [...PROGRESSIVE_DISCLOSURE_LEVELS].sort()
                );

                for (const level of PROGRESSIVE_DISCLOSURE_LEVELS) {
                  const disclosureSpec = metadata.disclosureMatrix[level];

                  expect(disclosureGroupingAxes).toContain(disclosureSpec.grouping);
                  expect(disclosureRichnessLevels).toContain(disclosureSpec.richness);
                  expect(typeof disclosureSpec.emitChildren).toBe('boolean');
                  expect(typeof disclosureSpec.committed).toBe('boolean');
                }
              }
            }
          );

          And(
            'each supported disclosure matrix should define maturity and status filter defaults',
            () => {
              const committedFilter = {
                maturity: ['plan', 'design', 'executable'],
                status: ['active', 'completed'],
              };
              const usefulFilter = {
                maturity: ['design', 'executable'],
                status: ['active', 'completed'],
              };
              const plannedFilter = {
                maturity: ['plan', 'design'],
                status: ['roadmap', 'deferred'],
              };

              for (const metadata of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
                const expectedCommittedFilter =
                  metadata.key === 'roadmap' ? plannedFilter : committedFilter;
                const expectedUsefulFilter =
                  metadata.key === 'roadmap' ? plannedFilter : usefulFilter;

                expect(metadata.disclosureMatrix.essential.filter).toEqual(expectedCommittedFilter);
                expect(metadata.disclosureMatrix.important.filter).toEqual(expectedCommittedFilter);
                expect(metadata.disclosureMatrix.useful.filter).toEqual(expectedUsefulFilter);
                expect(metadata.disclosureMatrix.advanced.filter).toBeUndefined();
              }
            }
          );

          And(
            'each supported documentation default disclosure level should exist in its disclosure matrix',
            () => {
              for (const metadata of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
                expect(metadata.disclosureMatrix[metadata.defaultDisclosureLevel]).toBeDefined();
              }
            }
          );

          And(
            'committed false disclosure levels should only appear on opt-in detail surfaces',
            () => {
              const optInDetailLevels = new Set([
                'business-rules:useful',
                'business-rules:advanced',
                'patterns:useful',
                'patterns:advanced',
                'requirements-executable:useful',
                'requirements-executable:advanced',
                'requirements-specs:useful',
                'requirements-specs:advanced',
              ]);
              const actualOptInDetailLevels = new Set<string>();

              for (const metadata of SUPPORTED_DOCUMENTATION_TYPE_REGISTRY) {
                for (const level of PROGRESSIVE_DISCLOSURE_LEVELS) {
                  if (!metadata.disclosureMatrix[level].committed) {
                    actualOptInDetailLevels.add(`${metadata.key}:${level}`);
                  }
                }
              }

              expect(actualOptInDetailLevels).toEqual(optInDetailLevels);
            }
          );

          And(
            'the patterns documentation bundle should expose per-pattern detail additional files',
            () => {
              const patternsBundle = state!.documentationViews['patterns'];
              expect(patternsBundle?.root.kind).toBe('PatternCatalog');
              expect(JSON.stringify(patternsBundle)).toContain('ProjectionAPI');
            }
          );

          And(
            'the requirements executable documentation links should resolve to emitted files',
            () => {
              assertRequirementDocumentationLinksResolve(
                state!.documentationViews['requirements-executable'],
                'REQUIREMENTS-EXECUTABLE.md',
                'requirements-executable',
                'requirements-executable/architect-projection/projection-api.md'
              );
            }
          );

          And(
            'the requirements specs documentation should omit roadmap requirements by default',
            () => {
              const requirementsView = state!.documentationViews['requirements-specs'];
              expect(requirementsView).toBeDefined();
              expect(JSON.stringify(requirementsView!.root).includes('ProjectionDocs')).toBe(false);
              expect(Object.keys(requirementsView!.children)).toEqual([
                'requirements-specs:idea-active-rules',
              ]);
            }
          );

          And('the roadmap documentation should include roadmap work by default', () => {
            expect(JSON.stringify(state!.documentationViews['roadmap'])).toContain(
              'ProjectionDocs'
            );
          });

          And('advanced business-rule documentation should include candidate rules', () => {
            const advancedBusinessRules = parseAndProjectDocumentationBundle(state!.context!, {
              documentType: 'business-rules',
              disclosureLevel: 'advanced',
            });

            expect(JSON.stringify(advancedBusinessRules)).toContain('Candidate documentation rule');
          });

          And('runtime maturity filter overrides should preserve default status filtering', () => {
            const runtimeOverrideContext = createProjectionContext({
              patterns: state!.context!.graph.patterns,
              projectMetadata,
              projectionFilter: { maturity: ['idea'] },
            });
            const runtimeFilteredBusinessRules = parseAndProjectDocumentationBundle(
              runtimeOverrideContext,
              {
                documentType: 'business-rules',
              }
            );
            const rendered = JSON.stringify(runtimeFilteredBusinessRules);

            if (runtimeFilteredBusinessRules.root.kind !== 'BusinessRuleSet') {
              throw new Error('Expected business-rules documentation bundle root.');
            }
            expect(runtimeFilteredBusinessRules.root.rules).toEqual([]);
            expect(rendered).not.toContain('Idea active documentation rule');
            expect(rendered).not.toContain('Candidate documentation rule');
          });
        }
      );

      RuleScenario(
        'composing requirement details without embedded business-rule detail children',
        ({ Given, When, Then, And }) => {
          Given(
            'a Documentation Composition documentation context with delivery architecture requirements and decisions data',
            () => {
              state!.context = createDocumentationContext();
            }
          );

          When('I project every supported documentation bundle', () => {
            for (const documentType of supportedDocumentTypes) {
              state!.documentationViews[documentType] = parseAndProjectDocumentationBundle(
                state!.context!,
                { documentType }
              );
            }
          });

          Then(
            'the requirements executable documentation should omit business-rule child routes',
            () => {
              const requirementsView = state!.documentationViews['requirements-executable'];
              expect(requirementsView).toBeDefined();

              const childKeys = Object.keys(requirementsView!.children);
              const businessRuleKeys = childKeys.filter((key) => key.includes(':business-rule:'));
              expect(businessRuleKeys).toEqual([]);
            }
          );

          And(
            'requirement detail views should not synthesize business-rule detail sections',
            () => {
              const requirementsView = state!.documentationViews['requirements-executable'];
              const studioSettingsDetail = requirementsView!.children[
                'requirements-executable:desktop:requirement:studio-settings'
              ] as Fragment | undefined;
              expect(studioSettingsDetail).toBeDefined();
              expect(JSON.stringify(studioSettingsDetail)).not.toContain(':business-rule:');

              const ruleMatrixDetail = requirementsView!.children[
                'requirements-executable:architect-projection:requirement:rule-matrix'
              ] as Fragment | undefined;
              expect(ruleMatrixDetail).toBeDefined();
              expect(JSON.stringify(ruleMatrixDetail)).not.toContain(':business-rule:');
            }
          );

          And(
            'requirement business-rule owner routes should resolve against business-rule docs',
            () => {
              const requirementsView = state!.documentationViews['requirements-executable'];
              const businessRulesView = state!.documentationViews['business-rules'];
              expect(requirementsView).toBeDefined();
              expect(businessRulesView).toBeDefined();

              const emittedBusinessRuleRouteIds = new Set<string>();
              const rootRouteId = businessRulesView!.routing?.rootRouteId;
              if (rootRouteId !== undefined) {
                emittedBusinessRuleRouteIds.add(rootRouteId);
              }
              for (const routeId of Object.values(
                businessRulesView!.routing?.childRouteIds ?? {}
              )) {
                emittedBusinessRuleRouteIds.add(routeId);
              }
              const referencedOwnerRouteIds = new Set(
                Object.values(requirementsView!.children)
                  .flatMap((child) =>
                    child.kind === 'RequirementDigest' ? child.businessRuleReferences : []
                  )
                  .map((reference) => reference.ownerRouteId)
              );
              expect(referencedOwnerRouteIds).toContain('business-rules:architect-projection');

              for (const routeId of referencedOwnerRouteIds) {
                expect(emittedBusinessRuleRouteIds.has(routeId)).toBe(true);
              }
            }
          );
        }
      );

      RuleScenario(
        'dropped and unknown documentation types are rejected explicitly',
        ({ Given, When, Then }) => {
          Given(
            'a Documentation Composition documentation context with delivery architecture requirements and decisions data',
            () => {
              state!.context = createDocumentationContext();
            }
          );

          When('I project dropped and unknown documentation bundle types', () => {
            for (const documentType of [...droppedDocumentTypes, 'banana-scope']) {
              try {
                parseAndProjectDocumentationBundle(state!.context!, { documentType });
                state!.rejectedTypes.set(documentType, 'accepted');
              } catch (error) {
                state!.rejectedTypes.set(documentType, error);
              }
            }
          });

          Then('each rejected documentation type should throw UnknownDocumentType', async () => {
            for (const documentType of [...droppedDocumentTypes, 'banana-scope']) {
              const rejection = state!.rejectedTypes.get(documentType);
              expect(rejection).toBeInstanceOf(ProjectionError);
              expect((rejection as ProjectionError).code).toBe('UNKNOWN_DOCUMENT_TYPE');
            }

            const [rootBarrel, projectionsBarrel] = await Promise.all([
              readFile(new URL('../../../../src/index.ts', import.meta.url), 'utf8'),
              readFile(new URL('../../../../src/projections/index.ts', import.meta.url), 'utf8'),
            ]);

            for (const barrel of [rootBarrel, projectionsBarrel]) {
              expect(barrel).not.toMatch(/\bDROPPED_DOCUMENTATION_TYPES\b/u);
              expect(barrel).not.toMatch(/\bDROPPED_DOCUMENTATION_TYPE_REGISTRY\b/u);
              expect(barrel).not.toMatch(/\bDOCUMENTATION_TYPE_REGISTRY\b/u);
              expect(barrel).not.toMatch(/\bDroppedDocumentationType\b/u);
              expect(barrel).not.toMatch(/\bDroppedDocumentationTypeMetadata\b/u);
              expect(barrel).not.toMatch(/\bDocumentationTypeRegistryEntrySchema\b/u);
              expect(barrel).not.toMatch(/\bDocumentationTypeRegistryEntry\b/u);
              expect(barrel).not.toMatch(/\bDocumentationTypeStatus\b/u);
              expect(barrel).not.toMatch(/\bisDroppedDocumentationType\b/u);
            }
          });
        }
      );
    }
  );

  Rule(
    'Architecture diagram projections support the full scope enum explicitly',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting architecture diagrams for each supported scope',
        ({ Given, When, Then, And }) => {
          Given(
            'a Documentation Composition architecture context with bounded contexts layers and product areas',
            () => {
              state!.context = createBoundedContextScopeContext();
            }
          );

          When('I project architecture diagrams for each supported scope', () => {
            state!.architectureDiagrams['component'] = projectArchitectureDiagram(state!.context!, {
              scope: 'component',
            });
            state!.architectureDiagrams['layered'] = projectArchitectureDiagram(state!.context!, {
              scope: 'layered',
            });
            state!.architectureDiagrams['bounded-context'] = projectArchitectureDiagram(
              state!.context!,
              {
                scope: 'bounded-context',
                scopeValue: 'projection',
              }
            );
            state!.architectureDiagrams['product-area'] = projectArchitectureDiagram(
              state!.context!,
              {
                scope: 'product-area',
                scopeValue: 'Studio UI',
              }
            );
          });

          Then('each architecture diagram should preserve the requested scope', () => {
            const componentDiagram = state!.architectureDiagrams['component'];
            const layeredDiagram = state!.architectureDiagrams['layered'];
            const boundedContextDiagram = state!.architectureDiagrams['bounded-context'];
            const productAreaDiagram = state!.architectureDiagrams['product-area'];

            expect(componentDiagram).toBeDefined();
            expect(layeredDiagram).toBeDefined();
            expect(boundedContextDiagram).toBeDefined();
            expect(productAreaDiagram).toBeDefined();

            expect(componentDiagram?.root.scope).toBe('component');
            expect(layeredDiagram?.root.scope).toBe('layered');
            expect(boundedContextDiagram?.root.scope).toBe('bounded-context');
            expect(productAreaDiagram?.root.scope).toBe('product-area');
          });

          And(
            'the bounded-context and product-area diagrams should filter patterns by the explicit scope value',
            () => {
              const boundedContextDiagram = state!.architectureDiagrams['bounded-context'];
              const productAreaDiagram = state!.architectureDiagrams['product-area'];

              expect(boundedContextDiagram?.root).toEqual(
                expect.objectContaining({
                  scope: 'bounded-context',
                  scopeValue: 'projection',
                  patterns: ['ProjectionAPI', 'ProjectionDocs'],
                })
              );

              expect(productAreaDiagram?.root).toEqual(
                expect.objectContaining({
                  scope: 'product-area',
                  scopeValue: 'Studio UI',
                  patterns: ['ProjectionDocs', 'StudioSettings'],
                })
              );
            }
          );
        }
      );
    }
  );

  Rule(
    'PR change review projections derive affected patterns from explicit options',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting PR change review with changed files and branch inputs',
        ({ Given, When, Then, And }) => {
          Given(
            'a Documentation Composition PR review context with changed deliverable and feature files',
            () => {
              state!.context = createDocumentationContext();
            }
          );

          When('I project the PR change review for branch "feat/documentation-composition"', () => {
            state!.prChangeReview = parseAndProjectPrChangeReview(state!.context!, {
              branch: 'feat/documentation-composition',
              changedFiles: [
                'packages/architect-projection/src/projections/documentation-composition/support.ts',
                'apps/desktop/src/views/Settings.tsx',
              ],
            });
          });

          Then('the PR change review should preserve the explicit branch and changed files', () => {
            expect(state!.prChangeReview?.root).toEqual(
              expect.objectContaining({
                kind: 'PrChangeReview',
                branch: 'feat/documentation-composition',
                changedFiles: [
                  'packages/architect-projection/src/projections/documentation-composition/support.ts',
                  'apps/desktop/src/views/Settings.tsx',
                ],
                affectedPatterns: ['ProjectionAPI', 'StudioSettings'],
              })
            );
          });

          And(
            'the PR change review should list affected patterns matched from the changed file options',
            () => {
              expect(state!.prChangeReview?.root.recommendations.length).toBeGreaterThan(0);
            }
          );
        }
      );
    }
  );

  Rule(
    'Projection package options-schema barrels stay aligned with subtree declarations',
    ({ RuleScenario }) => {
      RuleScenario(
        'the projection package options-schema barrel audit stays green',
        ({ Given, When, Then, And }) => {
          Given('the Documentation Composition projection state is initialized', () => {
            state = createState();
          });

          When('I audit the projection package options-schema barrels', async () => {
            const auditModule = (await import(
              new URL('../../../../scripts/options-schema-barrel-audit.mjs', import.meta.url).href
            )) as {
              auditProjectionOptionsSchemaBarrel: () => Promise<OptionsSchemaBarrelAuditSummary>;
            };

            state!.barrelAudit = await auditModule.auditProjectionOptionsSchemaBarrel();
          });

          Then('the audit should report no missing or unexpected root exports', () => {
            expect(state!.barrelAudit).toMatchObject({
              rootBarrelHasProjectionAggregate: true,
              missingExports: [],
              unexpectedExports: [],
            });
          });

          And(
            'the audit should confirm the public subtree export set matches the projections barrel export set',
            () => {
              expect(state!.barrelAudit?.publicOptionsSchemaExports).toEqual(
                state!.barrelAudit?.rootOptionsSchemaExports
              );
              expect(state!.barrelAudit?.publicOptionsSchemaExports.length).toBeGreaterThan(0);
            }
          );
        }
      );
    }
  );
});

function createDocumentationContext(): ProjectionContext {
  const projectionApi = createPattern('ProjectionAPI', {
    status: 'active',
    phase: 20,
    role: 'projection',
    file: 'packages/architect-projection/src/projections/documentation-composition/support.ts',
    description:
      '**Problem:** Documentation tools need a canonical projection layer.\n\n**Solution:** Documentation Composition normalizes docs into fragment contracts.',
    archContext: 'projection',
    archLayer: 'application',
    productArea: 'Projection Platform',
    userRole: 'AI engineer',
    businessValue: 'Deterministic projections for Studio and MCP consumers.',
    quarter: '2026-Q2',
    deliverables: [
      {
        name: 'Documentation Composition projection support',
        status: 'in-progress',
        tests: 2,
        location:
          'packages/architect-projection/src/projections/documentation-composition/support.ts',
        release: 'v0.5.0',
      },
    ],
    executableSpecs: [
      'packages/architect-projection/tests/features/projections/documentation-composition/config-documentation.feature',
    ],
    behaviorFile:
      'packages/architect-projection/tests/features/projections/documentation-composition/config-documentation.feature',
    rules: [
      {
        name: 'Canonical document types',
        description:
          '**Invariant:** Supported document types are explicit and finite.\n**Rationale:** Studio must not silently accept dropped or invented outputs.\n**Verified by:** projecting the supported documentation catalog, rejecting dropped and unknown documentation types',
        scenarioNames: [
          'projecting the supported documentation catalog',
          'rejecting dropped and unknown documentation types',
        ],
        scenarioCount: 2,
      },
    ],
  });
  const projectionDocs = createPattern('ProjectionDocs', {
    status: 'roadmap',
    phase: 21,
    role: 'projection',
    file: 'apps/desktop/src/views/Documentation.tsx',
    description:
      '**Problem:** Studio needs documentation fragments with routed child views.\n\n**Solution:** DocumentationBundle keeps sections structured and bundle children carry drill-down documents.',
    archContext: 'projection',
    archLayer: 'infrastructure',
    productArea: 'Studio UI',
    userRole: 'Architect reviewer',
    businessValue: 'Structured documentation rendering inside Studio.',
    quarter: '2026-Q3',
    deliverables: [
      {
        name: 'Documentation view wiring',
        status: 'pending',
        tests: 1,
        location: 'apps/desktop/src/views/Documentation.tsx',
        release: 'v0.6.0',
      },
    ],
    executableSpecs: ['apps/desktop/tests/features/documentation-view.feature'],
    rules: [
      {
        name: 'Routed documentation drill-down',
        description:
          '**Invariant:** Documentation child views stay structured as DocumentationBundle fragments.\n**Rationale:** Studio detail navigation expects typed sections instead of markdown strings.',
        scenarioNames: ['projecting the supported documentation catalog'],
        scenarioCount: 1,
      },
    ],
  });
  const studioSettings = createPattern('StudioSettings', {
    status: 'completed',
    phase: 19,
    role: 'service',
    file: 'apps/desktop/src/views/Settings.tsx',
    description:
      '**Problem:** Settings needs normalized project diagnostics.\n\n**Solution:** Project config snapshots flatten grouped source globs.',
    archContext: 'studio',
    archLayer: 'application',
    productArea: 'Studio UI',
    userRole: 'Architect reviewer',
    businessValue: 'Project diagnostics stay readable in the Studio shell.',
    quarter: '2026-Q2',
    deliverables: [
      {
        name: 'Settings config card',
        status: 'complete',
        tests: 1,
        location: 'apps/desktop/src/views/Settings.tsx',
        release: 'v0.4.0',
      },
    ],
    executableSpecs: ['apps/desktop/tests/features/settings.feature'],
  });
  const ruleMatrix = createPattern('RuleMatrix', {
    status: 'completed',
    phase: 20,
    role: 'projection',
    file: 'packages/architect-projection/src/projections/documentation-composition/rule-matrix.ts',
    description: 'Requirement details link to bounded business-rule detail documents.',
    archContext: 'projection',
    archLayer: 'application',
    productArea: 'Projection Platform',
    userRole: 'AI engineer',
    businessValue: 'Requirement readers drill into rule details only when needed.',
    executableSpecs: [
      'packages/architect-projection/tests/features/projections/documentation-composition/config-documentation.feature',
    ],
    rules: [
      {
        name: 'Duplicate Guard',
        description:
          '**Invariant:** First duplicate titled rule keeps a distinct route.\n**Rationale:** Stable docs routes must not collide.',
        scenarioNames: ['first duplicate business-rule route'],
        scenarioCount: 1,
      },
      {
        name: 'Duplicate Guard',
        description:
          '**Invariant:** Second duplicate titled rule keeps a distinct route.\n**Rationale:** Stable docs routes must not collide.',
        scenarioNames: ['second duplicate business-rule route'],
        scenarioCount: 1,
      },
      {
        name: 'Context Link',
        description:
          '**Invariant:** Requirement detail pages link to business-rule detail children.\n**Rationale:** Requirement pages stay concise while rule detail remains reachable.',
        scenarioNames: ['requirement detail links to business-rule detail'],
        scenarioCount: 1,
      },
    ],
  });
  const decision = createPattern('ADR006SingleReadModel', {
    status: 'completed',
    phase: 10,
    role: 'service',
    file: 'architect/decisions/adr-006-single-read-model.feature',
    description:
      '**Context:** Projection consumers must not re-derive relationships.\n**Decision:** PatternGraph remains the single read model.\n**Consequences:** Projections normalize graph output instead of leaking raw DTO wrappers.',
    adr: '006',
  });
  const ideaActiveRules = createPattern('IdeaActiveRules', {
    status: 'active',
    maturity: 'idea',
    phase: 22,
    role: 'projection',
    file: 'architect/specs/idea-active-rules.feature',
    productArea: 'Projection Platform',
    rules: [
      {
        name: 'Idea active documentation rule',
        description: '**Invariant:** Runtime maturity filters can opt into idea-tier active rules.',
        scenarioNames: [
          'runtime maturity filter overrides should preserve default status filtering',
        ],
        scenarioCount: 1,
      },
    ],
  });
  const candidateRules = createPattern('CandidateRules', {
    status: 'candidate',
    maturity: 'idea',
    phase: 22,
    role: 'projection',
    file: 'architect/specs/candidate-rules.feature',
    productArea: 'Projection Platform',
    rules: [
      {
        name: 'Candidate documentation rule',
        description: '**Invariant:** Advanced disclosure can opt into candidate-tier rules.',
        scenarioNames: ['advanced business-rule documentation should include candidate rules'],
        scenarioCount: 1,
      },
    ],
  });

  return createProjectionContext({
    projectMetadata,
    patterns: [
      projectionApi,
      projectionDocs,
      studioSettings,
      ruleMatrix,
      decision,
      ideaActiveRules,
      candidateRules,
    ],
    phaseNames: {
      10: 'Architecture Decisions',
      19: 'Studio Integration',
      20: 'Projection Bodies',
      21: 'Documentation Cutover',
    },
    relationshipIndex: {
      ProjectionAPI: createRelationshipEntry({
        dependsOn: ['ADR006SingleReadModel'],
        uses: ['ProjectionDocs'],
      }),
      ProjectionDocs: createRelationshipEntry({
        dependsOn: ['ProjectionAPI'],
        enables: ['StudioSettings'],
      }),
      StudioSettings: createRelationshipEntry({
        uses: ['ProjectionAPI'],
      }),
    },
  });
}

function createBoundedContextScopeContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ProjectionAPI', {
        status: 'active',
        role: 'projection',
        phase: 20,
        archContext: 'projection',
        archLayer: 'application',
        productArea: 'Projection Platform',
        file: 'packages/architect-projection/src/projections/documentation-composition/support.ts',
      }),
      createPattern('ProjectionDocs', {
        status: 'roadmap',
        role: 'projection',
        phase: 21,
        archContext: 'projection',
        archLayer: 'infrastructure',
        productArea: 'Studio UI',
        file: 'apps/desktop/src/views/Documentation.tsx',
      }),
      createPattern('StudioSettings', {
        status: 'completed',
        role: 'service',
        phase: 19,
        archContext: 'studio',
        archLayer: 'application',
        productArea: 'Studio UI',
        file: 'apps/desktop/src/views/Settings.tsx',
      }),
    ],
    relationshipIndex: {
      ProjectionAPI: createRelationshipEntry({
        uses: ['ProjectionDocs'],
      }),
      ProjectionDocs: createRelationshipEntry({
        enables: ['StudioSettings'],
      }),
    },
  });
}
