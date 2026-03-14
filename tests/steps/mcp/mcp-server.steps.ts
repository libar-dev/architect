/**
 * MCP Server Step Definitions
 *
 * BDD step definitions for MCP server integration tests.
 * Tests the MCP-specific layer: tool registration, pipeline session
 * lifecycle, file watcher filtering, CLI parsing, and output formatting.
 *
 * @architect
 * @architect-uses MCPServerImpl, MCPPipelineSession, MCPToolRegistry, MCPFileWatcher
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  PipelineSessionManager,
  type PipelineSession,
  parseCliArgs,
  isWatchedFileType,
  registerAllTools,
} from '../../../src/mcp/index.js';
import { getPackageVersion } from '../../../src/cli/version.js';
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
  AfterEachScenario(async () => {
    if (state?.tempDir) {
      await fs.rm(state.tempDir, { recursive: true, force: true });
    }
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
          features: ['architect/specs/*.feature'],
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
          features: ['architect/specs/*.feature'],
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

    RuleScenario(
      'getSession returns the previous session during rebuild',
      ({ Given, When, Then, And }) => {
        let manager: PipelineSessionManager | null = null;
        let originalSession: PipelineSession | null = null;
        let sessionDuringRebuild: PipelineSession | null = null;
        let rebuiltSession: PipelineSession | null = null;
        let rebuildPromise: Promise<PipelineSession> | null = null;

        Given('a PipelineSessionManager initialized with test data', async () => {
          manager = new PipelineSessionManager();
          originalSession = await manager.initialize({
            input: ['src/**/*.ts'],
            features: ['architect/specs/*.feature'],
          });
        });

        When('rebuild is started without awaiting', () => {
          rebuildPromise = manager!.rebuild();
        });

        Then('getSession still returns the original session during rebuild', () => {
          sessionDuringRebuild = manager!.getSession();
          expect(sessionDuringRebuild).toBe(originalSession);
        });

        When('the rebuild completes', async () => {
          rebuiltSession = await rebuildPromise!;
        });

        And('getSession returns the rebuilt session after completion', () => {
          expect(rebuiltSession).not.toBeNull();
          expect(rebuiltSession).not.toBe(originalSession);
          expect(manager!.getSession()).toBe(rebuiltSession);
        });
      }
    );

    RuleScenario(
      'Concurrent rebuild requests coalesce to the newest session',
      ({ Given, When, Then, And }) => {
        let manager: PipelineSessionManager | null = null;
        let originalSession: PipelineSession | null = null;
        let firstRebuild: Promise<PipelineSession> | null = null;
        let secondRebuild: Promise<PipelineSession> | null = null;
        let firstResult: PipelineSession | null = null;
        let secondResult: PipelineSession | null = null;

        Given('a PipelineSessionManager initialized with test data', async () => {
          manager = new PipelineSessionManager();
          originalSession = await manager.initialize({
            input: ['src/**/*.ts'],
            features: ['architect/specs/*.feature'],
          });
        });

        When('two rebuild calls are started without awaiting', () => {
          firstRebuild = manager!.rebuild();
          secondRebuild = manager!.rebuild();
        });

        Then('isRebuilding returns true while concurrent rebuilds are pending', () => {
          expect(manager!.isRebuilding()).toBe(true);
        });

        When('both rebuild calls complete', async () => {
          [firstResult, secondResult] = await Promise.all([firstRebuild!, secondRebuild!]);
        });

        Then('both rebuild calls resolve to the same latest session', () => {
          expect(firstResult).not.toBeNull();
          expect(firstResult).toBe(secondResult);
          expect(firstResult).not.toBe(originalSession);
        });

        And('getSession returns that same latest session', () => {
          expect(manager!.getSession()).toBe(firstResult);
        });
      }
    );

    RuleScenario(
      'Config without sources falls back to conventional globs',
      ({ Given, When, Then, And }) => {
        let manager: PipelineSessionManager | null = null;
        let session: PipelineSession | null = null;

        Given(
          'a temp project with a config file but no sources and conventional directories',
          async () => {
            state!.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-config-fallback-test-'));
            await fs.mkdir(path.join(state!.tempDir, 'src'), { recursive: true });
            await fs.mkdir(path.join(state!.tempDir, 'architect', 'specs'), {
              recursive: true,
            });

            await fs.writeFile(
              path.join(state!.tempDir, 'architect.config.js'),
              "export default { preset: 'libar-generic' };\n"
            );
            await fs.writeFile(
              path.join(state!.tempDir, 'src', 'example.ts'),
              [
                '/**',
                ' * @architect',
                ' * @architect-pattern ExamplePattern',
                ' * @architect-status roadmap',
                ' */',
                'export const example = 1;',
                '',
              ].join('\n')
            );
            await fs.writeFile(
              path.join(state!.tempDir, 'architect', 'specs', 'example.feature'),
              [
                '@architect',
                'Feature: Example pattern metadata',
                '',
                '  Scenario: Placeholder',
                '    Given nothing',
                '',
              ].join('\n')
            );
            manager = new PipelineSessionManager();
          }
        );

        When('the PipelineSessionManager initializes from that temp project', async () => {
          session = await manager!.initialize({ baseDir: state!.tempDir! });
        });

        Then('initialization succeeds using fallback source globs', () => {
          expect(session).not.toBeNull();
          expect(session!.dataset.patterns.length).toBeGreaterThan(0);
        });

        And('the session source globs include conventional TypeScript and feature paths', () => {
          expect(session!.sourceGlobs.input).toContain('src/**/*.ts');
          expect(session!.sourceGlobs.features).toContain('architect/specs/*.feature');
        });
      }
    );

    RuleScenario('isRebuilding flag lifecycle', ({ Given, Then, When }) => {
      let manager: PipelineSessionManager | null = null;
      let rebuildPromise: Promise<PipelineSession> | null = null;

      Given('a PipelineSessionManager initialized with test data', async () => {
        manager = new PipelineSessionManager();
        await manager.initialize({
          input: ['src/**/*.ts'],
          features: ['architect/specs/*.feature'],
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

    RuleScenario('All tools registered with architect_ prefix', ({ Given, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      Then('at least 25 tools are registered', () => {
        expect(state!.mockServer!.tools.size).toBeGreaterThanOrEqual(25);
      });

      And('each tool name starts with {string}', (_ctx: unknown, prefix: string) => {
        for (const [name] of state!.mockServer!.tools) {
          expect(name.startsWith(prefix)).toBe(true);
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

    RuleScenario('architect_overview returns formatted text', ({ Given, When, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the architect_overview handler is called', () => {
        const tool = state!.mockServer!.tools.get('architect_overview');
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

    RuleScenario(
      'architect_pattern returns error for unknown pattern',
      ({ Given, When, Then, And }) => {
        Given('an McpServer mock with registered tools', () => {
          setupMockServer();
        });

        When(
          'the architect_pattern handler is called with name {string}',
          (_ctx: unknown, name: string) => {
            const tool = state!.mockServer!.tools.get('architect_pattern');
            expect(tool).toBeDefined();
            state!.toolResult = tool!.handler({ name }) as McpTestState['toolResult'];
          }
        );

        Then('the result is an error', () => {
          expect(state!.toolResult!.isError).toBe(true);
        });

        And('the error message contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.toolResult!.content[0].text).toContain(expected);
        });
      }
    );

    RuleScenario('architect_list filters apply cumulatively', ({ Given, When, Then, And }) => {
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
        'architect_list is called with status {string} and phase {int}',
        (_ctx: unknown, status: string, phase: number) => {
          const tool = state!.mockServer!.tools.get('architect_list');
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

    RuleScenario('Version flag returns package version', ({ When, Then }) => {
      let versionText: string | null = null;

      When('parseCliArgs is called with {string}', (_ctx: unknown, args: string) => {
        const argv = args.split(' ');
        const result = parseCliArgs(argv);
        expect(result.type).toBe('version');
        versionText = result.type === 'version' ? result.text : null;
      });

      Then('the version text matches the package version', () => {
        expect(versionText).toBe(`architect-mcp v${getPackageVersion()}`);
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

      When('the architect_overview handler is called', () => {
        const tool = state!.mockServer!.tools.get('architect_overview');
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

      When('the architect_status handler is called', () => {
        const tool = state!.mockServer!.tools.get('architect_status');
        state!.toolResult = tool!.handler({}) as McpTestState['toolResult'];
      });

      Then('the result content is valid JSON', () => {
        const text = state!.toolResult!.content[0].text;
        expect(() => {
          JSON.parse(text);
        }).not.toThrow();
      });
    });

    RuleScenario('architect_status returns JSON with counts', ({ Given, When, Then, And }) => {
      Given('an McpServer mock with registered tools', () => {
        setupMockServer();
      });

      When('the architect_status handler is called', () => {
        const tool = state!.mockServer!.tools.get('architect_status');
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
      'architect_rules without pattern returns compact summary',
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

        When('the architect_rules handler is called without pattern', () => {
          const tool = state!.mockServer!.tools.get('architect_rules');
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
      'architect_pattern returns full metadata including business rules and extracted shapes',
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

        When('architect_pattern is called for that pattern', () => {
          const tool = state!.mockServer!.tools.get('architect_pattern');
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

        And('the result contains directive and source metadata', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('directive');
          expect(parsed).toHaveProperty('source');
        });

        And('the result contains business rules array', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('rules');
          expect(Array.isArray(parsed.rules)).toBe(true);
          expect((parsed.rules as unknown[]).length).toBeGreaterThan(0);
        });

        And('the result contains extracted shapes array', () => {
          const parsed = JSON.parse(state!.toolResult!.content[0].text) as Record<string, unknown>;
          expect(parsed).toHaveProperty('extractedShapes');
          expect(Array.isArray(parsed.extractedShapes)).toBe(true);
          expect((parsed.extractedShapes as unknown[]).length).toBeGreaterThan(0);
        });
      }
    );
  });
});
