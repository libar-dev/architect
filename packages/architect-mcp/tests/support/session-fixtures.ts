/**
 * Test-only session fixtures for architect-mcp handler tests.
 *
 * Builds an in-memory PatternGraph + PatternGraphAPI via architect-core public
 * factories, then wraps them in a PipelineSession and a minimal manager that
 * exposes the subset of the PipelineSessionManager API that invokeTool touches
 * (getSession, rebuild).
 */

import {
  asDirectiveTag,
  asPatternId,
  asRoleName,
  asSourceFilePath,
  createDefaultTagRegistry,
  createPackageResolver,
  createPatternGraphAPI,
  transformToPatternGraph,
  type ExtractedPattern,
} from '@libar-dev/architect-core';

import type { PipelineSession, PipelineSessionManager } from '../../src/pipeline-session.js';

export const TEST_PATTERN_NAME = 'RichPattern';
export const TEST_DEPENDENCY_NAME = 'DepPattern';
export const TEST_BUNDLE_PARENT_NAME = 'RichEpic';
export const TEST_BUNDLE_CHILD_NAME = 'GapChild';

function createPattern(options: {
  readonly id: string;
  readonly name: string;
  readonly status: ExtractedPattern['status'];
  readonly file: string;
  readonly uses?: readonly string[];
  readonly productArea?: string;
  readonly deliverables?: ExtractedPattern['deliverables'];
  readonly rules?: ExtractedPattern['rules'];
  readonly extractedShapes?: ExtractedPattern['extractedShapes'];
  readonly description?: string;
  readonly parent?: ExtractedPattern['parent'];
  readonly children?: ExtractedPattern['children'];
  readonly level?: ExtractedPattern['level'];
}): ExtractedPattern {
  return {
    id: asPatternId(options.id),
    name: options.name,
    patternName: options.name,
    role: asRoleName('projection'),
    status: options.status,
    directive: {
      tags: [asDirectiveTag('@architect-pattern')],
      description: options.description ?? `Test description for ${options.name}.`,
      examples: [],
      position: { startLine: 1, endLine: 10 },
      patternName: options.name,
      status: options.status,
      role: 'projection',
      ...(options.uses !== undefined && options.uses.length > 0 ? { uses: [...options.uses] } : {}),
      ...(options.productArea !== undefined ? { productArea: options.productArea } : {}),
      ...(options.parent !== undefined ? { parent: options.parent } : {}),
      ...(options.children !== undefined ? { children: options.children } : {}),
      ...(options.level !== undefined ? { level: options.level } : {}),
    },
    code: `export function ${options.name}() {}`,
    source: {
      file: asSourceFilePath(options.file),
      lines: [1, 10],
    },
    exports: [{ name: options.name, type: 'function' }],
    extractedAt: '2024-01-01T00:00:00.000Z',
    ...(options.uses !== undefined && options.uses.length > 0 ? { uses: [...options.uses] } : {}),
    ...(options.productArea !== undefined ? { productArea: options.productArea } : {}),
    ...(options.deliverables !== undefined ? { deliverables: options.deliverables } : {}),
    ...(options.rules !== undefined ? { rules: options.rules } : {}),
    ...(options.extractedShapes !== undefined ? { extractedShapes: options.extractedShapes } : {}),
    ...(options.parent !== undefined ? { parent: options.parent } : {}),
    ...(options.children !== undefined ? { children: options.children } : {}),
    ...(options.level !== undefined ? { level: options.level } : {}),
  };
}

function buildRichSession(): PipelineSession {
  const registry = createDefaultTagRegistry();
  const parent = createPattern({
    id: 'pattern-00000004',
    name: TEST_BUNDLE_PARENT_NAME,
    status: 'active',
    file: 'specs/rich-epic.feature',
    level: 'epic',
    children: [TEST_PATTERN_NAME, TEST_BUNDLE_CHILD_NAME],
    description:
      '**Problem:** Bundler consumers need one request.\n\n**Solution:** Group immediate members together.',
  });
  const dep = createPattern({
    id: 'pattern-00000001',
    name: TEST_DEPENDENCY_NAME,
    status: 'completed',
    file: 'specs/dep.feature',
    productArea: 'Projection',
  });
  const focal = createPattern({
    id: 'pattern-00000002',
    name: TEST_PATTERN_NAME,
    status: 'active',
    file: 'specs/rich-pattern.feature',
    uses: [TEST_DEPENDENCY_NAME],
    parent: TEST_BUNDLE_PARENT_NAME,
    productArea: 'Projection',
    deliverables: [
      { name: 'Server entry point', status: 'complete', tests: 2, location: 'src/server.ts' },
      { name: 'Tool registry', status: 'in-progress', tests: 0, location: 'src/tools.ts' },
    ],
    rules: [
      {
        name: 'Rich pattern metadata stays queryable',
        description: 'Pattern detail output should include business rules and extracted shapes.',
        scenarioCount: 1,
        scenarioNames: ['Pattern detail includes full metadata'],
      },
    ],
    extractedShapes: [
      {
        name: 'RichPatternShape',
        kind: 'interface',
        sourceText: 'export interface RichPatternShape { enabled: boolean; }',
        lineNumber: 12,
        exported: true,
      },
    ],
    description:
      '**Problem:** Rich pattern has design gaps.\n\n**Open Questions:**\n- Who owns the MCP open question surface?\n\n**Solution:** Expose the gaps through the projection contract.',
  });
  const bundleChild = createPattern({
    id: 'pattern-00000003',
    name: TEST_BUNDLE_CHILD_NAME,
    status: 'completed',
    file: 'specs/gap-child.feature',
    parent: TEST_BUNDLE_PARENT_NAME,
    productArea: 'Projection',
    rules: [
      {
        name: 'Gap child scenarios stay queryable',
        description:
          '**Invariant:** Gap child scenarios must remain grouped under bundle output.\n\n**Verified by:** Gap child bundle scenario',
        scenarioCount: 1,
        scenarioNames: ['Gap child bundle scenario'],
      },
    ],
    description:
      '**Problem:** Gap child still has open questions.\n\n**Open Questions:**\n- Which release closes the gap?\n\n**Solution:** Keep it visible in bundle output.',
  });
  const dataset = transformToPatternGraph({
    patterns: [parent, focal, dep, bundleChild],
    tagRegistry: registry,
  });
  if (
    dataset.patterns.find(
      (pattern) => (pattern.patternName ?? pattern.name) === TEST_BUNDLE_PARENT_NAME
    ) === undefined
  ) {
    (dataset.patterns as ExtractedPattern[]).push(parent);
  }
  const api = createPatternGraphAPI(dataset);

  return {
    dataset,
    api,
    registry,
    baseDir: '/tmp/architect-mcp-test-project',
    configPath: '/tmp/architect-mcp-test-project/architect.config.ts',
    packageResolver: createPackageResolver([
      { id: 'mcp-test', displayName: 'MCP Test', match: /.*/u },
    ]),
    sourceGlobs: { input: ['src/**/*.ts'], features: ['specs/**/*.feature'] },
    buildTimeMs: 42,
    diagnostics: [] as PipelineSession['diagnostics'],
  };
}

/**
 * Minimal stand-in for PipelineSessionManager that exposes only the methods
 * invokeTool actually calls (getSession, rebuild). Cast to
 * PipelineSessionManager at the boundary because structural compatibility is
 * sufficient here.
 */
class StaticSessionManager {
  private session: PipelineSession;

  constructor(session: PipelineSession) {
    this.session = session;
  }

  getSession(): PipelineSession {
    return this.session;
  }

  async rebuild(): Promise<PipelineSession> {
    const next = { ...this.session, buildTimeMs: this.session.buildTimeMs + 1 };
    await Promise.resolve();
    this.session = next;
    return next;
  }

  async initialize(): Promise<PipelineSession> {
    await Promise.resolve();
    return this.session;
  }

  isRebuilding(): boolean {
    return false;
  }
}

export function createTestSessionManager(): PipelineSessionManager {
  return new StaticSessionManager(buildRichSession()) as unknown as PipelineSessionManager;
}
