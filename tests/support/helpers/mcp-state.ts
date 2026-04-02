/**
 * MCP Server Test State
 *
 * Shared state and mock infrastructure for MCP server tests.
 *
 * @architect
 * @architect-uses MCPPipelineSession, PatternGraphAPI, TagRegistry
 */

import type { PipelineSession, ParsedOptions } from '../../../src/mcp/index.js';
import { createTestPatternGraph } from '../../fixtures/dataset-factories.js';
import { createTestPattern } from '../../fixtures/pattern-factories.js';
import { createPatternGraphAPI } from '../../../src/api/pattern-graph-api.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';

// =============================================================================
// Types
// =============================================================================

type TextContent = { type: 'text'; text: string };
type ToolResult = { content: TextContent[]; isError?: boolean };

interface RegisteredToolInfo {
  readonly name: string;
  readonly config: { title?: string; description?: string; inputSchema?: unknown };
  readonly handler: (...args: readonly unknown[]) => unknown;
}

export interface McpTestState {
  session: PipelineSession | null;
  mockServer: MockMcpServer | null;
  toolResult: ToolResult | null;
  logMessages: string[];
  error: Error | null;
  parsedOptions: ParsedOptions | null;
  isWatched: boolean | null;
  tempDir: string | null;
}

// =============================================================================
// Mock MCP Server
// =============================================================================

/**
 * Records registerTool() calls for verification without requiring
 * real MCP transport or stdio.
 */
export class MockMcpServer {
  readonly tools = new Map<string, RegisteredToolInfo>();

  registerTool(
    name: string,
    config: { title?: string; description?: string; inputSchema?: unknown },
    handler: (...args: readonly unknown[]) => unknown
  ): { enabled: boolean } {
    this.tools.set(name, { name, config, handler });
    return { enabled: true };
  }
}

// =============================================================================
// Test Session Factory
// =============================================================================

/**
 * Creates a PipelineSession from test factories.
 * Avoids real file I/O by using in-memory PatternGraph.
 */
export function createTestPipelineSession(): PipelineSession {
  const dataset = createTestPatternGraph({
    statusDistribution: { completed: 3, active: 2, planned: 1 },
  });
  const api = createPatternGraphAPI(dataset);
  const registry = createDefaultTagRegistry();

  return {
    dataset,
    api,
    registry,
    baseDir: '/tmp/test-project',
    sourceGlobs: { input: ['src/**/*.ts'], features: ['specs/**/*.feature'] },
    buildTimeMs: 42,
  };
}

/**
 * Creates a PipelineSession with specific patterns for filter testing.
 * Returns patterns with known status+phase combinations for architect_list filter verification.
 */
export function createFilterTestSession(): PipelineSession {
  const patterns = [
    createTestPattern({ name: 'ActiveP46', status: 'active', phase: 46 }),
    createTestPattern({ name: 'ActiveP10', status: 'active', phase: 10 }),
    createTestPattern({ name: 'CompletedP46', status: 'completed', phase: 46 }),
    createTestPattern({ name: 'RoadmapP5', status: 'roadmap', phase: 5 }),
  ];
  const dataset = createTestPatternGraph({ patterns });
  const api = createPatternGraphAPI(dataset);
  const registry = createDefaultTagRegistry();

  return {
    dataset,
    api,
    registry,
    baseDir: '/tmp/test-project',
    sourceGlobs: { input: ['src/**/*.ts'], features: ['specs/**/*.feature'] },
    buildTimeMs: 99,
  };
}

/**
 * Creates a PipelineSession with a pattern that has deliverables and dependencies.
 * Used for architect_pattern enrichment tests.
 */
export function createRichPatternSession(): PipelineSession {
  const dep = createTestPattern({
    name: 'DepPattern',
    status: 'completed',
    filePath: 'specs/dep.feature',
  });
  const focal = createTestPattern({
    name: 'RichPattern',
    status: 'active',
    phase: 46,
    filePath: 'specs/rich-pattern.feature',
    dependsOn: ['DepPattern'],
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
  });
  const dataset = createTestPatternGraph({ patterns: [focal, dep] });
  const api = createPatternGraphAPI(dataset);
  const registry = createDefaultTagRegistry();

  return {
    dataset,
    api,
    registry,
    baseDir: '/tmp/test-project',
    sourceGlobs: { input: ['src/**/*.ts'], features: ['specs/**/*.feature'] },
    buildTimeMs: 55,
  };
}

// =============================================================================
// Mock Pipeline Session Manager
// =============================================================================

/**
 * Lightweight mock that wraps a PipelineSession for tool registration tests.
 * Provides the same interface as PipelineSessionManager without real pipeline builds.
 */
export class MockPipelineSessionManager {
  private session: PipelineSession;
  private rebuildPromise: Promise<PipelineSession> | null = null;
  private pendingRebuild = false;

  constructor(session: PipelineSession) {
    this.session = session;
  }

  async initialize(): Promise<PipelineSession> {
    await Promise.resolve();
    return this.session;
  }

  async rebuild(): Promise<PipelineSession> {
    if (this.rebuildPromise !== null) {
      this.pendingRebuild = true;
      return this.rebuildPromise;
    }

    this.rebuildPromise = this.runRebuildLoop();
    try {
      return await this.rebuildPromise;
    } finally {
      this.pendingRebuild = false;
      this.rebuildPromise = null;
    }
  }

  getSession(): PipelineSession {
    return this.session;
  }

  isRebuilding(): boolean {
    return this.rebuildPromise !== null;
  }

  private async runRebuildLoop(): Promise<PipelineSession> {
    let latestSession = this.session;

    for (;;) {
      this.pendingRebuild = false;
      const newSession = {
        ...latestSession,
        buildTimeMs: latestSession.buildTimeMs + 100,
      };
      await Promise.resolve(); // Yield before swap to mirror production atomic rebuild semantics
      this.session = newSession;
      latestSession = newSession;

      // Another caller may set pendingRebuild while the async boundary yields.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!this.pendingRebuild) {
        return latestSession;
      }
    }
  }
}

// =============================================================================
// State Management
// =============================================================================

export function initMcpState(): McpTestState {
  return {
    session: null,
    mockServer: null,
    toolResult: null,
    logMessages: [],
    error: null,
    parsedOptions: null,
    isWatched: null,
    tempDir: null,
  };
}
