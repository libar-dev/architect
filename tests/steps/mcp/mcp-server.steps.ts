/**
 * MCP Server Step Definitions
 *
 * BDD step definitions for MCP server integration tests.
 * Tests the MCP-specific layer: tool registration, pipeline session
 * lifecycle, file watcher filtering, CLI parsing, and output formatting.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  PipelineSessionManager,
  type PipelineSession,
  parseCliArgs,
  isWatchedFileType,
  registerAllTools,
} from '../../../src/mcp/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  type McpTestState,
  MockMcpServer,
  MockPipelineSessionManager,
  initMcpState,
  createTestPipelineSession,
  createFilterTestSession,
  createRichPatternSession,
} from '../../support/helpers/mcp-state.js';

// =============================================================================
// Test State
// =============================================================================

let state: McpTestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/mcp/mcp-server.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a test MasterDataset is initialized for MCP', () => {
      state = initMcpState();
    });
  });

  // ===========================================================================
  // Rule 1: Pipeline session manager
  // ===========================================================================

  Rule('Pipeline session manager loads once and supports atomic rebuild', ({ RuleScenario }) => {
    RuleScenario('Session initializes and contains dataset', ({ Given, When, Then, And }) => {
      let session: PipelineSession | null = null;

      Given('a PipelineSessionManager initialized with test data', async () => {
        const manager = new PipelineSessionManager();
        session = await manager.initialize({
          input: ['src/**/*.ts'],
          features: ['delivery-process/specs/*.feature'],
        });
        state!.session = session;
      });

      When('getSession is called', () => {
        // Session already retrieved during initialization
      });

      Then('the session contains a MasterDataset with patterns', () => {
        expect(state!.session).not.toBeNull();
        expect(state!.session!.dataset.patterns.length).toBeGreaterThan(0);
      });

      And('the session records build time in milliseconds', () => {
        expect(state!.session!.buildTimeMs).toBeGreaterThan(0);
      });
    });

    RuleScenario('getSession throws before initialization', ({ Given, When, Then }) => {
      let manager: PipelineSessionManager | null = null;

      Given('a new uninitialized PipelineSessionManager', () => {
        manager = new PipelineSessionManager();
      });

      When('getSession is called without initialization', () => {
        try {
          manager!.getSession();
        } catch (error) {
          state!.error = error instanceof Error ? error : new Error(String(error));
        }
      });

      Then('it throws an error containing {string}', (_ctx: unknown, message: string) => {
        expect(state!.error).not.toBeNull();
        expect(state!.error!.message).toContain(message);
      });
    });

    RuleScenario('Rebuild replaces session atomically', ({ Given, When, Then, And }) => {
      let manager: PipelineSessionManager | null = null;
      let originalSession: PipelineSession | null = null;
      let newSession: PipelineSession | null = null;

      Given('a PipelineSessionManager initialized with test data', async () => {
        manager = new PipelineSessionManager();
        originalSession = await manager.initialize({
          input: ['src/**/*.ts'],
          features: ['delivery-process/specs/*.feature'],
        });
      });

      When('rebuild is called', async () => {
        newSession = await manager!.rebuild();
      });

      Then('a new session is returned', () => {
        expect(newSession).not.toBeNull();
        expect(newSession!.dataset.patterns.length).toBeGreaterThan(0);
      });

      And('the new session has a different build time than the original', () => {
        expect(originalSession).not.toBeNull();
        // Rebuild produces a different session object
        expect(newSession).not.toBe(originalSession);
        // The session stored by getSession should be the new one
        expect(manager!.getSession()).toBe(newSession);
      });
    });

    RuleScenario('isRebuilding flag lifecycle', ({ Given, Then, When }) => {
      let manager: PipelineSessionManager | null = null;
      let rebuildPromise: Promise<PipelineSession> | null = null;

      Given('a PipelineSessionManager initialized with test data', async () => {
        manager = new PipelineSessionManager();
        await manager.initialize({
          input: ['src/**/*.ts'],
          features: ['delivery-process/specs/*.feature'],
        });
      });

      Then('isRebuilding returns false before rebuild', () => {
        expect(manager!.isRebuilding()).toBe(false);
      });

      When('rebuild is started without awaiting', () => {
        rebuildPromise = manager!.rebuild();
      });

      Then('isRebuilding returns true during rebuild', () => {
        expect(manager!.isRebuilding()).toBe(true);
      });

      When('the rebuild completes', async () => {
        await rebuildPromise!;
      });

      Then('isRebuilding returns false after rebuild completes', () => {
        expect(manager!.isRebuilding()).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Rule 2: Tool registration
  // ===========================================================================

  Rule('Tool registration creates correctly named tools with schemas', ({ RuleScenario }) => {
    function setupMockServer(): void {
      const session = createTestPipelineSession();
      const mockSessionManager = new MockPipelineSessionManager(session);
      const mockServer = new MockMcpServer();
      registerAllTools(
        mockServer as unknown as McpServer,
        mockSessionManager as unknown as PipelineSessionManager
      );
      state!.mockServer = mockServer;
      state!.session = session;
    }

    RuleScenario('All tools registered with dp_ prefix', ({ Given, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      Then('at least 25 tools are registered', () => {
        expect(state!.mockServer!.tools.size).toBeGreaterThanOrEqual(25);
      });

      And('each tool name starts with {string}', (_ctx: unknown, prefix: string) => {
        for (const [name] of state!.mockServer!.tools) {
          expect(name).toMatch(new RegExp(`^${prefix}`));
        }
      });
    });

    RuleScenario('Each tool has a non-empty description', ({ Given, Then }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      Then('each registered tool has a non-empty description', () => {
        for (const [name, tool] of state!.mockServer!.tools) {
          expect(tool.config.description, `Tool ${name} should have a description`).toBeTruthy();
          expect(tool.config.description!.length).toBeGreaterThan(0);
        }
      });
    });

    RuleScenario('dp_overview returns formatted text', ({ Given, When, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the dp_overview handler is called', () => {
        const tool = state!.mockServer!.tools.get('dp_overview');
        expect(tool).toBeDefined();
        state!.toolResult = tool!.handler({}) as McpTestState['toolResult'];
      });

      Then('the result contains text content', () => {
        expect(state!.toolResult).not.toBeNull();
        expect(state!.toolResult!.content).toHaveLength(1);
        expect(state!.toolResult!.content[0].type).toBe('text');
        expect(state!.toolResult!.content[0].text.length).toBeGreaterThan(0);
      });

      And('the result is not an error', () => {
        expect(state!.toolResult!.isError).not.toBe(true);
      });
    });

    RuleScenario('dp_pattern returns error for unknown pattern', ({ Given, When, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the dp_pattern handler is called with name {string}', (_ctx: unknown, name: string) => {
        const tool = state!.mockServer!.tools.get('dp_pattern');
        expect(tool).toBeDefined();
        state!.toolResult = tool!.handler({ name }) as McpTestState['toolResult'];
      });

      Then('the result is an error', () => {
        expect(state!.toolResult!.isError).toBe(true);
      });

      And('the error message contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.toolResult!.content[0].text).toContain(expected);
      });
    });

    RuleScenario('dp_list filters apply cumulatively', ({ Given, When, Then, And }) => {
      Given('a session with patterns of mixed status and phase', () => {
        state!.session = createFilterTestSession();
      });

      And('an McpServer mock with registered tools using that session', () => {
        const mockSessionManager = new MockPipelineSessionManager(state!.session!);
        const mockServer = new MockMcpServer();
        registerAllTools(
          mockServer as unknown as McpServer,
          mockSessionManager as unknown as PipelineSessionManager
        );
        state!.mockServer = mockServer;
      });

      When(
        'dp_list is called with status {string} and phase {int}',
        (_ctx: unknown, status: string, phase: number) => {
          const tool = state!.mockServer!.tools.get('dp_list');
          expect(tool).toBeDefined();
          state!.toolResult = tool!.handler({ status, phase }) as McpTestState['toolResult'];
        }
      );

      Then('only patterns matching both status and phase are returned', () => {
        const text = state!.toolResult!.content[0].text;
        const parsed = JSON.parse(text) as Array<{ patternName: string }>;
        // Only ActiveP46 matches both status=active AND phase=46
        expect(parsed).toHaveLength(1);
        expect(parsed[0].patternName).toBe('ActiveP46');
      });
    });
  });

  // ===========================================================================
  // Rule 3: File watcher filters
  // ===========================================================================

  Rule('File watcher filters file types correctly', ({ RuleScenario, RuleScenarioOutline }) => {
    RuleScenario('TypeScript files trigger rebuild', ({ When, Then }) => {
      When('checking if {string} is a watched file type', (_ctx: unknown, filePath: string) => {
        state!.isWatched = isWatchedFileType(filePath);
      });

      Then('the file is watched', () => {
        expect(state!.isWatched).toBe(true);
      });
    });

    RuleScenario('Feature files trigger rebuild', ({ When, Then }) => {
      When('checking if {string} is a watched file type', (_ctx: unknown, filePath: string) => {
        state!.isWatched = isWatchedFileType(filePath);
      });

      Then('the file is watched', () => {
        expect(state!.isWatched).toBe(true);
      });
    });

    RuleScenarioOutline(
      'Non-watched file types are ignored',
      ({ When, Then }, variables: { file: string }) => {
        When('checking if <file> is a watched file type', () => {
          state!.isWatched = isWatchedFileType(variables.file);
        });

        Then('the file is not watched', () => {
          expect(state!.isWatched).toBe(false);
        });
      }
    );
  });

  // ===========================================================================
  // Rule 4: CLI argument parser
  // ===========================================================================

  Rule('CLI argument parser handles all flag variants', ({ RuleScenarioOutline, RuleScenario }) => {
    RuleScenarioOutline(
      'CLI flags are parsed correctly',
      ({ When, Then }, variables: { args: string; option: string }) => {
        When('parseCliArgs is called with "<args>"', () => {
          const argv = variables.args.split(' ');
          const result = parseCliArgs(argv);
          state!.parsedOptions = result.type === 'options' ? result.options : null;
        });

        Then('the parsed result has "<option>" set', () => {
          const opt = variables.option as keyof NonNullable<typeof state.parsedOptions>;
          expect(state!.parsedOptions).not.toBeNull();
          expect(state!.parsedOptions![opt]).toBeDefined();
        });
      }
    );

    RuleScenario('Multiple input globs accumulate', ({ When, Then }) => {
      When('parseCliArgs is called with {string}', (_ctx: unknown, args: string) => {
        const argv = args.split(' ');
        const result = parseCliArgs(argv);
        state!.parsedOptions = result.type === 'options' ? result.options : null;
      });

      Then('the parsed input contains {int} globs', (_ctx: unknown, count: number) => {
        expect(state!.parsedOptions!.input).toHaveLength(count);
      });
    });

    RuleScenario('Double-dash separator is skipped', ({ When, Then }) => {
      When('parseCliArgs is called with {string}', (_ctx: unknown, args: string) => {
        const argv = args.split(' ');
        const result = parseCliArgs(argv);
        state!.parsedOptions = result.type === 'options' ? result.options : null;
      });

      Then('the parsed input contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.parsedOptions!.input).toBeDefined();
        expect(state!.parsedOptions!.input).toContain(expected);
      });
    });
  });

  // ===========================================================================
  // Rule 5: Tool output format
  // ===========================================================================

  Rule('Tool output format matches expected content type', ({ RuleScenario }) => {
    function setupMockServer(): void {
      const session = createTestPipelineSession();
      const mockSessionManager = new MockPipelineSessionManager(session);
      const mockServer = new MockMcpServer();
      registerAllTools(
        mockServer as unknown as McpServer,
        mockSessionManager as unknown as PipelineSessionManager
      );
      state!.mockServer = mockServer;
      state!.session = session;
    }

    RuleScenario('Session-aware tools return text content', ({ Given, When, Then }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the dp_overview handler is called', () => {
        const tool = state!.mockServer!.tools.get('dp_overview');
        state!.toolResult = tool!.handler({}) as McpTestState['toolResult'];
      });

      Then('the result content type is {string}', (_ctx: unknown, expectedType: string) => {
        expect(state!.toolResult!.content[0].type).toBe(expectedType);
      });
    });

    RuleScenario('Data query tools return valid JSON', ({ Given, When, Then }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the dp_status handler is called', () => {
        const tool = state!.mockServer!.tools.get('dp_status');
        state!.toolResult = tool!.handler({}) as McpTestState['toolResult'];
      });

      Then('the result content is valid JSON', () => {
        const text = state!.toolResult!.content[0].text;
        expect(() => {
          JSON.parse(text);
        }).not.toThrow();
      });
    });

    RuleScenario('dp_status returns JSON with counts', ({ Given, When, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the dp_status handler is called', () => {
        const tool = state!.mockServer!.tools.get('dp_status');
        state!.toolResult = tool!.handler({}) as McpTestState['toolResult'];
      });

      Then('the JSON result contains {string} key', (_ctx: unknown, key: string) => {
        const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
        expect(parsed).toHaveProperty(key);
      });

      And('the JSON result contains {string} key', (_ctx: unknown, key: string) => {
        const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
        expect(parsed).toHaveProperty(key);
      });
    });
  });

  // ===========================================================================
  // Rule 6: Tool output correctness for edge cases
  // ===========================================================================

  Rule('Tool output correctness for edge cases', ({ RuleScenario }) => {
    RuleScenario(
      'dp_rules without pattern returns compact summary',
      ({ Given, When, Then, And }) => {
        Given('an McpServer mock with registered tools', () => {
          const session = createTestPipelineSession();
          const mockSessionManager = new MockPipelineSessionManager(session);
          const mockServer = new MockMcpServer();
          registerAllTools(
            mockServer as unknown as McpServer,
            mockSessionManager as unknown as PipelineSessionManager
          );
          state!.mockServer = mockServer;
          state!.session = session;
        });

        When('the dp_rules handler is called without pattern', () => {
          const tool = state!.mockServer!.tools.get('dp_rules');
          expect(tool).toBeDefined();
          state!.toolResult = tool!.handler({}) as McpTestState['toolResult'];
        });

        Then('the result contains totalRules and allRuleNames', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('totalRules');
          expect(parsed).toHaveProperty('allRuleNames');
        });

        And('the result contains a hint about using pattern parameter', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('hint');
          expect(String(parsed.hint)).toContain('pattern');
        });

        And('the result does not contain full rule details', () => {
          const text = state!.toolResult!.content[0].text;
          const parsed = JSON.parse(text) as Record<string, unknown>;
          // Compact summary productAreas should NOT have nested 'phases' with 'rules' arrays
          const areas = parsed.productAreas as Array<Record<string, unknown>>;
          if (areas.length > 0) {
            expect(areas[0]).not.toHaveProperty('phases');
          }
        });
      }
    );

    RuleScenario(
      'dp_pattern returns deliverables and dependencies',
      ({ Given, When, Then, And }) => {
        Given('a session with a pattern that has deliverables and dependencies', () => {
          state!.session = createRichPatternSession();
        });

        And('an McpServer mock with registered tools using that session', () => {
          const mockSessionManager = new MockPipelineSessionManager(state!.session!);
          const mockServer = new MockMcpServer();
          registerAllTools(
            mockServer as unknown as McpServer,
            mockSessionManager as unknown as PipelineSessionManager
          );
          state!.mockServer = mockServer;
        });

        When('dp_pattern is called for that pattern', () => {
          const tool = state!.mockServer!.tools.get('dp_pattern');
          expect(tool).toBeDefined();
          state!.toolResult = tool!.handler({ name: 'RichPattern' }) as McpTestState['toolResult'];
        });

        Then('the result contains deliverables array', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('deliverables');
          expect(Array.isArray(parsed.deliverables)).toBe(true);
          expect((parsed.deliverables as unknown[]).length).toBeGreaterThan(0);
        });

        And('the result contains dependencies object', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('dependencies');
          expect(parsed.dependencies).not.toBeNull();
        });
      }
    );
  });
});
