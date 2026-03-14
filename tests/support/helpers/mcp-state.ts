/**
 * MCP Server Test State
 *
 * Shared state and mock infrastructure for MCP server tests.
 *
 * @libar-docs
 */

import type { PipelineSession, ParsedOptions } from '../../../src/mcp/index.js';
import { createTestMasterDataset } from '../../fixtures/dataset-factories.js';
import { createTestPattern } from '../../fixtures/pattern-factories.js';
import { createProcessStateAPI } from '../../../src/api/process-state.js';
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
 * Avoids real file I/O by using in-memory MasterDataset.
 */
export function createTestPipelineSession(): PipelineSession {
  const dataset = createTestMasterDataset({
    statusDistribution: { completed: 3, active: 2, planned: 1 },
  });
  const api = createProcessStateAPI(dataset);
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
 * Returns patterns with known status+phase combinations for dp_list filter verification.
 */
export function createFilterTestSession(): PipelineSession {
  const patterns = [
    createTestPattern({ name: 'ActiveP46', status: 'active', phase: 46 }),
    createTestPattern({ name: 'ActiveP10', status: 'active', phase: 10 }),
    createTestPattern({ name: 'CompletedP46', status: 'completed', phase: 46 }),
    createTestPattern({ name: 'RoadmapP5', status: 'roadmap', phase: 5 }),
  ];
  const dataset = createTestMasterDataset({ patterns });
  const api = createProcessStateAPI(dataset);
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

// =============================================================================
// Mock Pipeline Session Manager
// =============================================================================

/**
 * Lightweight mock that wraps a PipelineSession for tool registration tests.
 * Provides the same interface as PipelineSessionManager without real pipeline builds.
 */
export class MockPipelineSessionManager {
  private session: PipelineSession;
  private rebuilding = false;

  constructor(session: PipelineSession) {
    this.session = session;
  }

  initialize(): PipelineSession {
    return this.session;
  }

  rebuild(): PipelineSession {
    this.rebuilding = true;
    // Simulate rebuild with a new build time
    this.session = {
      ...this.session,
      buildTimeMs: this.session.buildTimeMs + 100,
    };
    this.rebuilding = false;
    return this.session;
  }

  getSession(): PipelineSession {
    return this.session;
  }

  isRebuilding(): boolean {
    return this.rebuilding;
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
  };
}
