import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  buildPatternGraph,
  PACKAGE_SELF_HOSTING_SOURCES,
  WORKSPACE_TAG_REGISTRY,
  type ExtractedPattern,
  type TagRegistry,
} from '@libar-dev/architect-core';
import {
  isBundle,
  parseAndProjectBusinessRuleSet,
  parseAndProjectDocumentationBundle,
  projectAnnotationCoverage,
  projectBoundedContext,
  projectRequirementDigest,
  projectRequirementExecutableDigest,
  parseAndProjectScopeReadinessReport,
  parseAndProjectSessionContext,
  renderJson,
  renderMarkdown,
  type ProjectionContext,
} from '../../../src/index.js';
import { createTestPackageResolver } from '../../support/test-package-resolver.js';
import { buildGraphFromPatterns, buildPatternStub } from '../../support/test-graph-builder.js';
import { createRule, createTagRegistry } from '../projections/governance/support.js';

const feature = await loadFeature('tests/features/perf/business-rule-set-report.feature');

const PRODUCT_AREAS = [
  'Delivery Process',
  'Data API',
  'Projection Pipeline',
  'Renderer Contracts',
  'Governance',
  'Developer Experience',
] as const;

const BOUNDED_CONTEXTS = [
  'delivery-process',
  'data-api',
  'projection-pipeline',
  'renderer-contracts',
  'governance',
  'developer-experience',
] as const;

const ARCH_LAYERS = ['domain', 'application', 'interface', 'infrastructure'] as const;
const STATUSES = ['active', 'completed', 'roadmap'] as const;
const PRIORITIES = ['P0', 'P1', 'P2'] as const;
const QUARTERS = ['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4'] as const;
const TEAMS = ['core-platform', 'projection-runtime', 'docs-foundation'] as const;
const EFFORTS = ['small', 'medium', 'large'] as const;
const EFFORT_ACTUALS = ['small', 'medium', 'large'] as const;
const USER_ROLES = ['maintainer', 'operator', 'reviewer'] as const;
const WORKFLOWS = ['implementation', 'verification', 'handoff'] as const;
const RISKS = ['low', 'medium', 'high'] as const;

const COVERAGE_REQUIRED_TAGS: TagRegistry['metadataTags'] = [
  {
    tag: 'status',
    format: 'enum',
    purpose: 'Tracks delivery status coverage.',
    required: true,
    values: [...STATUSES],
  },
  {
    tag: 'arch-context',
    format: 'value',
    purpose: 'Records bounded-context ownership.',
    required: true,
  },
  {
    tag: 'arch-layer',
    format: 'enum',
    purpose: 'Records architecture layer coverage.',
    required: true,
    values: [...ARCH_LAYERS],
  },
  {
    tag: 'phase',
    format: 'number',
    purpose: 'Tracks phase coverage.',
    required: true,
  },
  {
    tag: 'priority',
    format: 'value',
    purpose: 'Records priority coverage.',
    required: true,
  },
  {
    tag: 'quarter',
    format: 'value',
    purpose: 'Records roadmap quarter coverage.',
    required: true,
  },
  {
    tag: 'team',
    format: 'value',
    purpose: 'Records owning team coverage.',
    required: true,
  },
  {
    tag: 'effort',
    format: 'value',
    purpose: 'Records estimated effort coverage.',
    required: true,
  },
  {
    tag: 'effort-actual',
    format: 'value',
    purpose: 'Records actual effort coverage.',
    required: true,
  },
  {
    tag: 'product-area',
    format: 'value',
    purpose: 'Records product-area coverage.',
    required: true,
  },
  {
    tag: 'user-role',
    format: 'value',
    purpose: 'Records user-role coverage.',
    required: true,
  },
  {
    tag: 'business-value',
    format: 'quoted-value',
    purpose: 'Records business-value coverage.',
    required: true,
  },
  {
    tag: 'workflow',
    format: 'value',
    purpose: 'Records workflow coverage.',
    required: true,
  },
  {
    tag: 'risk',
    format: 'enum',
    purpose: 'Records risk coverage.',
    required: true,
    values: [...RISKS],
  },
  {
    tag: 'release',
    format: 'value',
    purpose: 'Records release coverage.',
    required: true,
  },
  {
    tag: 'completed',
    format: 'value',
    purpose: 'Records completion timestamp coverage.',
    required: true,
  },
  {
    tag: 'target-path',
    format: 'value',
    purpose: 'Records implementation target-path coverage.',
    required: true,
  },
  {
    tag: 'since',
    format: 'value',
    purpose: 'Records introduction-version coverage.',
    required: true,
  },
  {
    tag: 'use-case',
    format: 'csv',
    purpose: 'Records declared use-case coverage.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'uses',
    format: 'csv',
    purpose: 'Records uses relationships.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'depends-on',
    format: 'csv',
    purpose: 'Records depends-on relationships.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'enables',
    format: 'csv',
    purpose: 'Records enables relationships.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'used-by',
    format: 'csv',
    purpose: 'Records used-by relationships.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'implements',
    format: 'csv',
    purpose: 'Records implements relationships.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'see-also',
    format: 'csv',
    purpose: 'Records see-also references.',
    required: true,
    repeatable: true,
  },
  {
    tag: 'api-ref',
    format: 'csv',
    purpose: 'Records api-ref coverage.',
    required: true,
    repeatable: true,
  },
] as const;

interface PerfSample {
  readonly iteration: number;
  readonly projectMs: number;
  readonly renderObjectMs: number;
  readonly renderPrettyMs: number;
  readonly isBundleMicros: number;
}

interface PerfSummary {
  readonly avgMs: number;
  readonly p50Ms: number;
  readonly iterations: number;
}

interface PerfReportState {
  reportPath: string | null;
}

interface BusinessRuleSetPerfFixture {
  readonly context: ProjectionContext;
  readonly patternCount: number;
  readonly ruleCount: number;
  readonly sourceFileCount: number;
  readonly boundedContextCount: number;
  readonly layerCount: number;
  readonly requiredCoverageTagCount: number;
}

interface PerfPatternOptions {
  readonly patternName: string;
  readonly title?: string;
  readonly status: ExtractedPattern['status'];
  readonly role: ExtractedPattern['role'];
  readonly phase: ExtractedPattern['phase'];
  readonly file: string;
  readonly productArea: ExtractedPattern['productArea'];
  readonly boundedContext: ExtractedPattern['boundedContext'];
  readonly adrLayer: ExtractedPattern['adrLayer'];
  readonly quarter: ExtractedPattern['quarter'];
  readonly release: ExtractedPattern['release'];
  readonly completed: ExtractedPattern['completed'];
  readonly userRole: ExtractedPattern['userRole'];
  readonly businessValue: ExtractedPattern['businessValue'];
  readonly team: ExtractedPattern['team'];
  readonly effort: ExtractedPattern['effort'];
  readonly effortActual: ExtractedPattern['effortActual'];
  readonly priority: ExtractedPattern['priority'];
  readonly targetPath: ExtractedPattern['targetPath'];
  readonly uses: ExtractedPattern['uses'];
  readonly dependsOn: readonly string[];
  readonly usedBy: readonly string[];
  readonly enables: readonly string[];
  readonly implementsPatterns: ExtractedPattern['implementsPatterns'];
  readonly seeAlso: ExtractedPattern['seeAlso'];
  readonly apiRef: ExtractedPattern['apiRef'];
  readonly workflow: string;
  readonly risk: string;
  readonly since: string;
  readonly rules: readonly ReturnType<typeof createRule>[];
  readonly adr?: string;
  readonly adrStatus?: ExtractedPattern['adrStatus'];
  readonly adrCategory?: ExtractedPattern['adrCategory'];
}

type ProjectionMeasure = (context: ProjectionContext) => unknown;
type AsyncMeasure = () => Promise<unknown>;

const RENDER_MARKDOWN_DOCUMENT_TYPES = [
  'patterns',
  'decisions',
  'requirements-executable',
] as const;
type RenderMarkdownDocumentType = (typeof RENDER_MARKDOWN_DOCUMENT_TYPES)[number];

let state: PerfReportState = {
  reportPath: null,
};

function createBusinessRuleSetPerfContext(): BusinessRuleSetPerfFixture {
  const patternNames = Array.from(
    { length: 36 },
    (_, patternIndex) => `BusinessRulePerfPattern${String(patternIndex + 1).padStart(2, '0')}`,
  );
  const tagRegistry = createProjectionPerfTagRegistry();
  const patterns = patternNames.map((patternName, patternIndex) => {
    const productArea = PRODUCT_AREAS[patternIndex % PRODUCT_AREAS.length]!;
    const boundedContext = BOUNDED_CONTEXTS[patternIndex % BOUNDED_CONTEXTS.length]!;
    const adrLayer = ARCH_LAYERS[patternIndex % ARCH_LAYERS.length]!;
    const quarter = QUARTERS[patternIndex % QUARTERS.length]!;
    const relatedPattern = patternNames[(patternIndex + 1) % patternNames.length]!;
    const dependencyPattern =
      patternNames[(patternIndex + patternNames.length - 1) % patternNames.length]!;

    const adrNumber = patternIndex % 6 === 0 ? String(Math.floor(patternIndex / 6) + 1) : undefined;

    return createPerfPattern(patternName, {
      patternName,
      ...(adrNumber !== undefined
        ? {
            title: `${productArea} projection decision ${adrNumber}`,
            adr: adrNumber,
            adrStatus: 'accepted',
            adrCategory: 'architecture',
          }
        : {}),
      status: STATUSES[patternIndex % STATUSES.length]!,
      role: patternIndex % 2 === 0 ? 'projection' : 'service',
      phase: 49 + (patternIndex % 4),
      file: `packages/architect-projection/fixtures/perf/${patternName}.feature`,
      productArea,
      boundedContext,
      adrLayer,
      quarter,
      release: `2026.${String((patternIndex % 6) + 1).padStart(2, '0')}`,
      completed: `2026-04-${String((patternIndex % 28) + 1).padStart(2, '0')}`,
      userRole: USER_ROLES[patternIndex % USER_ROLES.length]!,
      businessValue: `Keep ${boundedContext} perf coverage deterministic for ${patternName}.`,
      team: TEAMS[patternIndex % TEAMS.length]!,
      effort: EFFORTS[patternIndex % EFFORTS.length]!,
      effortActual: EFFORT_ACTUALS[patternIndex % EFFORT_ACTUALS.length]!,
      priority: PRIORITIES[patternIndex % PRIORITIES.length]!,
      targetPath: `packages/architect-projection/src/perf/${patternName}.ts`,
      uses: [relatedPattern],
      dependsOn: [dependencyPattern],
      usedBy: [relatedPattern],
      enables: [relatedPattern],
      implementsPatterns: [`${boundedContext}-contract`],
      seeAlso: [`ADR-${String((patternIndex % 4) + 1).padStart(3, '0')}`],
      apiRef: [`https://example.test/${patternName.toLowerCase()}`],
      workflow: WORKFLOWS[patternIndex % WORKFLOWS.length]!,
      risk: RISKS[patternIndex % RISKS.length]!,
      since: `2026-Q${String((patternIndex % 4) + 1)}`,
      rules: Array.from({ length: 3 }, (_, ruleIndex) => {
        const ruleNumber = ruleIndex + 1;
        const ruleLabel = String(ruleNumber);
        const scenarioName = `${patternName} rule ${ruleLabel} exports grouped JSON`;

        return createRule({
          name: `${productArea} rule ${ruleLabel} for ${patternName}`,
          description: [
            `**Invariant:** ${patternName} keeps rule ${ruleLabel} stable across grouped JSON output.`,
            `**Rationale:** The rules command must keep ${productArea} semantics visible to renderer consumers.`,
            `**Verified by:** ${scenarioName}, ${patternName} rule ${ruleLabel} keeps pretty JSON parseable`,
          ].join('\n'),
          scenarioNames: [
            scenarioName,
            `${patternName} rule ${ruleLabel} keeps pretty JSON parseable`,
          ],
          scenarioCount: 2,
        });
      }),
    });
  });

  const graph = buildGraphFromPatterns({
    patterns,
    tagRegistry,
    includeArchIndex: true,
  });

  return {
    context: {
      graph,
      packageResolver: createTestPackageResolver(),
    },
    patternCount: patterns.length,
    ruleCount: patterns.reduce((total, pattern) => total + (pattern.rules?.length ?? 0), 0),
    sourceFileCount: new Set(patterns.map((pattern) => pattern.source.file)).size,
    boundedContextCount: new Set(patterns.map((pattern) => pattern.boundedContext).filter(Boolean))
      .size,
    layerCount: new Set(patterns.map((pattern) => pattern.adrLayer).filter(Boolean)).size,
    requiredCoverageTagCount:
      tagRegistry.metadataTags.filter((tag) => tag.required === true).length +
      (tagRegistry.roles.length > 0 ? 1 : 0),
  };
}

function createProjectionPerfTagRegistry(): TagRegistry {
  return createTagRegistry({
    roles: [
      {
        tag: 'projection',
        domain: 'Projection',
        priority: 10,
        description: 'Projection-owned patterns.',
      },
      {
        tag: 'service',
        domain: 'Application',
        priority: 20,
        description: 'Application service patterns.',
      },
    ],
    metadataTags: COVERAGE_REQUIRED_TAGS,
  });
}

function createPerfPattern(name: string, options: PerfPatternOptions): ExtractedPattern {
  const pattern = buildPatternStub(name, {
    patternName: options.patternName,
    ...(options.title !== undefined ? { title: options.title } : {}),
    status: options.status,
    role: options.role,
    phase: options.phase,
    file: options.file,
    productArea: options.productArea,
    boundedContext: options.boundedContext,
    adrLayer: options.adrLayer,
    quarter: options.quarter,
    release: options.release,
    completed: options.completed,
    userRole: options.userRole,
    businessValue: options.businessValue,
    team: options.team,
    effort: options.effort,
    effortActual: options.effortActual,
    priority: options.priority,
    targetPath: options.targetPath,
    uses: options.uses,
    dependsOn: options.dependsOn,
    usedBy: options.usedBy,
    enables: options.enables,
    implementsPatterns: options.implementsPatterns,
    seeAlso: options.seeAlso,
    apiRef: options.apiRef,
    rules: options.rules,
    ...(options.adr !== undefined ? { adr: options.adr } : {}),
    ...(options.adrStatus !== undefined ? { adrStatus: options.adrStatus } : {}),
    ...(options.adrCategory !== undefined ? { adrCategory: options.adrCategory } : {}),
  });

  return {
    ...pattern,
    workflow: options.workflow,
    risk: options.risk,
    since: options.since,
  };
}

function summarize(values: readonly number[], iterations: number): PerfSummary {
  return {
    avgMs: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50Ms: p50(values),
    iterations,
  };
}

function p50(values: readonly number[]): number {
  const sortedValues = [...values].sort((left, right) => left - right);
  const p50Index = Math.floor((sortedValues.length - 1) / 2);

  return sortedValues[p50Index] ?? 0;
}

function measureProjection(
  context: ProjectionContext,
  project: ProjectionMeasure,
  iterations: number,
  warmupIterations = 5,
): PerfSummary {
  const values: number[] = [];

  for (let iteration = 1; iteration <= warmupIterations; iteration += 1) {
    project(context);
  }

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const startedAt = performance.now();
    const projected = project(context);
    values.push(performance.now() - startedAt);
    expect(projected).toBeDefined();
  }

  return summarize(values, iterations);
}

function measureRenderMarkdownBundles(
  context: ProjectionContext,
  iterations: number,
): Record<RenderMarkdownDocumentType, PerfSummary> {
  const result = {} as Record<RenderMarkdownDocumentType, PerfSummary>;

  for (const documentType of RENDER_MARKDOWN_DOCUMENT_TYPES) {
    result[documentType] = measureProjection(
      context,
      (projectionContext) => {
        const bundle = parseAndProjectDocumentationBundle(projectionContext, { documentType });
        return renderMarkdown(bundle);
      },
      iterations,
    );
  }

  return result;
}

async function measureAsyncOperation(
  measure: AsyncMeasure,
  iterations: number,
): Promise<PerfSummary> {
  const values: number[] = [];

  for (let iteration = 1; iteration <= 2; iteration += 1) {
    await measure();
  }

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const startedAt = performance.now();
    const measured = await measure();
    values.push(performance.now() - startedAt);
    expect(measured).toBeDefined();
  }

  return summarize(values, iterations);
}

async function measureGraphBuild(repoRoot: string, iterations: number): Promise<PerfSummary> {
  const architectPackageRoot = path.join(repoRoot, 'packages/architect');

  return measureAsyncOperation(async () => {
    const result = await buildPatternGraph({
      baseDir: architectPackageRoot,
      input: [...PACKAGE_SELF_HOSTING_SOURCES.typescript, ...PACKAGE_SELF_HOSTING_SOURCES.stubs],
      features: [...PACKAGE_SELF_HOSTING_SOURCES.features],
      tagRegistry: WORKSPACE_TAG_REGISTRY,
      mergeConflictStrategy: 'concatenate',
    });

    expect(result.ok).toBe(true);
    return result.ok ? result.value.graph : undefined;
  }, iterations);
}

async function generateBusinessRuleSetPerfReport(): Promise<string> {
  const fixture = createBusinessRuleSetPerfContext();
  const { context } = fixture;
  const samples: PerfSample[] = [];
  const warmupIterations = 5;
  const iterations = 40;
  const hotPathIterations = 30;
  const graphBuildIterations = 10;
  const repoRoot = path.resolve(import.meta.dirname, '../../../../..');

  for (let iteration = 1; iteration <= warmupIterations; iteration += 1) {
    const bundle = parseAndProjectBusinessRuleSet(context, {
      scope: 'all',
      groupedBy: 'product-area',
    });

    renderJson(bundle);
    renderJson(bundle, { pretty: true });
    isBundle(bundle);
  }

  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    const projectStartedAt = performance.now();
    const bundle = parseAndProjectBusinessRuleSet(context, {
      scope: 'all',
      groupedBy: 'product-area',
    });
    const projectMs = performance.now() - projectStartedAt;

    const renderObjectStartedAt = performance.now();
    const renderedObject = renderJson(bundle);
    const renderObjectMs = performance.now() - renderObjectStartedAt;

    const renderPrettyStartedAt = performance.now();
    const renderedPretty = renderJson(bundle, { pretty: true });
    const renderPrettyMs = performance.now() - renderPrettyStartedAt;

    const isBundleStartedAt = performance.now();
    const bundleDetected = isBundle(bundle);
    const isBundleMicros = (performance.now() - isBundleStartedAt) * 1000;

    expect(typeof renderedObject).toBe('object');
    expect(renderedObject).not.toBeNull();
    expect(typeof renderedPretty).toBe('string');
    expect(JSON.parse(renderedPretty)).toEqual(renderedObject);
    expect(bundleDetected).toBe(true);

    samples.push({ iteration, projectMs, renderObjectMs, renderPrettyMs, isBundleMicros });
  }

  const evidenceDir = path.join(repoRoot, '.sisyphus/evidence');
  const reportPath = path.join(evidenceDir, 'task-3-business-rule-set-perf-report.json');

  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fixture: {
          name: 'BusinessRuleSet grouped-by-product-area bundle',
          patterns: fixture.patternCount,
          rules: fixture.ruleCount,
          sourceFiles: fixture.sourceFileCount,
          boundedContexts: fixture.boundedContextCount,
          layers: fixture.layerCount,
          requiredCoverageTags: fixture.requiredCoverageTagCount,
          warmupIterations,
        },
        project: summarize(
          samples.map((sample) => sample.projectMs),
          iterations,
        ),
        renderObject: summarize(
          samples.map((sample) => sample.renderObjectMs),
          iterations,
        ),
        renderPretty: summarize(
          samples.map((sample) => sample.renderPrettyMs),
          iterations,
        ),
        projectionHotPaths: {
          sessionContextBundle: measureProjection(
            context,
            (projectionContext) =>
              parseAndProjectSessionContext(projectionContext, {
                patterns: ['BusinessRulePerfPattern01'],
                sessionType: 'implement',
              }),
            hotPathIterations,
          ),
          scopeReadinessReport: measureProjection(
            context,
            (projectionContext) =>
              parseAndProjectScopeReadinessReport(projectionContext, {
                pattern: 'BusinessRulePerfPattern01',
                sessionType: 'implement',
                strict: true,
              }),
            hotPathIterations,
          ),
          documentationView: measureProjection(
            context,
            (projectionContext) =>
              parseAndProjectDocumentationBundle(projectionContext, {
                documentType: 'patterns',
              }),
            hotPathIterations,
          ),
          requirementDigestAllAreas: measureProjection(
            context,
            (projectionContext) => projectRequirementDigest(projectionContext),
            hotPathIterations,
            20,
          ),
          requirementDigestExecutable: measureProjection(
            context,
            (projectionContext) => projectRequirementExecutableDigest(projectionContext),
            hotPathIterations,
            20,
          ),
          patternSatisfiesTag: measureProjection(
            context,
            (projectionContext) => projectAnnotationCoverage(projectionContext),
            hotPathIterations,
          ),
          buildBoundedContext: measureProjection(
            context,
            (projectionContext) => projectBoundedContext(projectionContext),
            hotPathIterations,
          ),
          graphBuild: await measureGraphBuild(repoRoot, graphBuildIterations),
        },
        renderMarkdownBundles: measureRenderMarkdownBundles(context, hotPathIterations),
        isBundleP50Micros: p50(samples.map((sample) => sample.isBundleMicros)),
        samples,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  return reportPath;
}

describeFeature(feature, ({ BeforeEachScenario, Rule }) => {
  BeforeEachScenario((): void => {
    state = {
      reportPath: null,
    };
  });

  Rule('Projection hot paths stay under committed budgets', ({ RuleScenario }): void => {
    RuleScenario(
      'Write a budgetable projection perf report for representative documentation bundles',
      ({ When, Then, And }): void => {
        When('I generate the BusinessRuleSet perf report', async () => {
          state.reportPath = await generateBusinessRuleSetPerfReport();
        });

        Then('the perf report evidence file should be written', () => {
          expect(state.reportPath).toContain('task-3-business-rule-set-perf-report.json');
        });

        And(
          'the perf report should include renderMarkdown metrics for representative documentation bundles',
          async () => {
            const reportPath = state.reportPath;
            expect(reportPath).not.toBeNull();
            if (reportPath === null || reportPath === undefined) {
              throw new Error('reportPath missing');
            }
            const report = JSON.parse(await readFile(reportPath, 'utf8')) as {
              readonly renderMarkdownBundles?: Record<string, PerfSummary>;
            };

            expect(Object.keys(report.renderMarkdownBundles ?? {}).sort()).toEqual(
              [...RENDER_MARKDOWN_DOCUMENT_TYPES].sort(),
            );

            for (const documentType of RENDER_MARKDOWN_DOCUMENT_TYPES) {
              const summary = report.renderMarkdownBundles?.[documentType];
              expect(summary).toBeDefined();
              if (summary === undefined) {
                throw new Error(`Missing renderMarkdownBundles summary for ${documentType}`);
              }
              expect(Number.isFinite(summary.avgMs)).toBe(true);
              expect(Number.isFinite(summary.p50Ms)).toBe(true);
              expect(summary.iterations).toBeGreaterThan(0);
            }
          },
        );
      },
    );
  });
});
