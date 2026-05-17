import { readFileSync } from 'node:fs';
import { describeFeature, loadFeatureFromText } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { z } from 'zod';

import { PipelineSessionManager } from '../../src/pipeline-session.js';
import {
  invokeTool,
  registerAllTools,
  type RegisteredToolName,
  type ToolResult,
} from '../../src/tool-registry.js';
import {
  ARCHITECT_MCP_TOOLS,
  REGISTERED_TOOL_NAMES,
  buildToolHelpText,
} from '../../src/tool-metadata.js';

import {
  createTestSessionManager,
  TEST_BUNDLE_CHILD_NAME,
  TEST_BUNDLE_PARENT_NAME,
  TEST_DEPENDENCY_NAME,
  TEST_PATTERN_NAME,
} from '../support/session-fixtures.js';

const FROZEN_REGISTERED_TOOL_NAMES = [
  'architect_overview',
  'architect_coverage',
  'architect_context',
  'architect_files',
  'architect_dep_tree',
  'architect_scope_validate',
  'architect_handoff',
  'architect_status',
  'architect_pattern',
  'architect_bundle',
  'architect_list',
  'architect_open_questions',
  'architect_search',
  'architect_rules',
  'architect_taxonomy',
  'architect_arch_neighborhood',
  'architect_arch_blocking',
  'architect_rebuild',
  'architect_config',
  'architect_documentation',
  'architect_help',
] as const satisfies readonly RegisteredToolName[];

const RegisteredToolNameSchema = z.enum(FROZEN_REGISTERED_TOOL_NAMES);

const RemovedInputFixtureSchema = z.strictObject({
  tool: RegisteredToolNameSchema,
  args: z.record(z.string(), z.unknown()),
  removedKey: z.string(),
});

const RemovedInputFixturesSchema = z.array(RemovedInputFixtureSchema).readonly();

const ZERO_ARGUMENT_TOOL_NAMES = [
  'architect_overview',
  'architect_coverage',
  'architect_status',
  'architect_arch_blocking',
  'architect_rebuild',
  'architect_config',
  'architect_help',
] as const satisfies readonly RegisteredToolName[];

interface CapturedRegistration {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: unknown;
  readonly handler: (rawInput: unknown) => Promise<unknown>;
}

interface RemovedInputFixture {
  readonly tool: RegisteredToolName;
  readonly args: Record<string, unknown>;
  readonly removedKey: string;
}

interface RemovedInputResult {
  readonly fixture: RemovedInputFixture;
  readonly error: unknown;
}

interface ZeroArgumentResult {
  readonly name: RegisteredToolName;
  readonly variant: 'empty-object' | 'omitted';
  readonly result: ToolResult | null;
  readonly error: unknown;
}

interface IntegrationState {
  sessionManager: PipelineSessionManager | null;
  result: ToolResult | null;
  zeroArgumentResults: readonly ZeroArgumentResult[];
  caughtError: unknown;
  registeredCaughtError: unknown;
  removedInputResults: readonly RemovedInputResult[];
  capturedBuildTimeMs: number | null;
  registrations: readonly CapturedRegistration[];
}

class CapturingMcpServer {
  readonly registrations: CapturedRegistration[] = [];

  registerTool(
    name: string,
    options: { description: string; inputSchema: unknown },
    handler: (rawInput: unknown) => Promise<unknown>,
  ): void {
    this.registrations.push({
      name,
      description: options.description,
      inputSchema: options.inputSchema,
      handler,
    });
  }
}

const features = [
  'tests/features/mcp-tool-registration.feature',
  'tests/features/mcp-tool-input-validation.feature',
  'tests/features/mcp-server-lifecycle.feature',
].map((path) => loadFeatureFromText(readFileSync(path, 'utf8')));

function ruleNames(feature: ReturnType<typeof loadFeatureFromText>): Set<string> {
  if (!('rules' in feature) || !Array.isArray(feature.rules)) {
    return new Set();
  }

  return new Set(
    feature.rules
      .map((rule: unknown): string => {
        if (typeof rule !== 'object' || rule === null || !('name' in rule)) {
          return '';
        }

        const name = (rule as { name?: unknown }).name;
        return typeof name === 'string' ? name : '';
      })
      .filter((name): name is string => typeof name === 'string' && name.length > 0),
  );
}

let state: IntegrationState | null = null;

function createState(): IntegrationState {
  return {
    sessionManager: null,
    result: null,
    zeroArgumentResults: [],
    caughtError: null,
    registeredCaughtError: null,
    removedInputResults: [],
    capturedBuildTimeMs: null,
    registrations: [],
  };
}

async function runTool(name: RegisteredToolName, args: unknown): Promise<void> {
  state!.result = null;
  state!.caughtError = null;

  try {
    state!.result = await invokeTool(state!.sessionManager!, name, args);
  } catch (error) {
    state!.caughtError = error;
  }
}

async function runUnknownTool(name: string, args: unknown): Promise<void> {
  state!.result = null;
  state!.caughtError = null;

  try {
    state!.result = await invokeTool(state!.sessionManager!, name as RegisteredToolName, args);
  } catch (error) {
    state!.caughtError = error;
  }
}

async function runRegisteredTool(name: RegisteredToolName, args: unknown): Promise<void> {
  state!.registeredCaughtError = null;

  const registration = state!.registrations.find((entry) => entry.name === name);
  if (registration === undefined) {
    throw new Error(`Registered handler not found for ${name}`);
  }

  try {
    await registration.handler(args);
  } catch (error) {
    state!.registeredCaughtError = error;
  }
}

function createUnavailableSessionManager(): PipelineSessionManager {
  return new PipelineSessionManager();
}

function getOutputRoot(): Record<string, unknown> {
  const output = state!.result?.output as { root?: Record<string, unknown> } | null;
  if (output?.root === undefined) {
    throw new Error('Tool output root is unavailable');
  }
  return output.root;
}

function getOutputObject(): Record<string, unknown> {
  const output = state!.result?.output;
  if (typeof output !== 'object' || output === null || Array.isArray(output)) {
    throw new Error('Tool output object is unavailable');
  }
  return output as Record<string, unknown>;
}

function readSource(relativePath: string): string {
  return readFileSync(relativePath, 'utf8');
}

function readRemovedInputFixtures(): readonly RemovedInputFixture[] {
  return RemovedInputFixturesSchema.parse(
    JSON.parse(readFileSync('tests/fixtures/legacy-taxonomy/removed-input.json', 'utf8')),
  );
}

function expectSourceToContain(relativePath: string, snippets: readonly string[]): void {
  const source = readSource(relativePath);
  for (const snippet of snippets) {
    expect(source).toContain(snippet);
  }
}

function bindFeature(feature: ReturnType<typeof loadFeatureFromText>): void {
  const presentRules = ruleNames(feature);
  describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
    type RuleFn = typeof Rule;
    type RuleArgs = Parameters<RuleFn>;
    const ruleIfPresent = (name: RuleArgs[0], body: RuleArgs[1]): void => {
      if (presentRules.has(typeof name === 'string' ? name : '')) {
        Rule(name, body);
      }
    };
    AfterEachScenario(() => {
      state = null;
    });

    Background(({ Given }) => {
      Given('a test session manager seeded with a rich pattern graph', () => {
        state = createState();
        state.sessionManager = createTestSessionManager();
      });
    });

    ruleIfPresent(
      'Every registered tool returns a non-empty projection for its documented happy-path args',
      ({ RuleScenario }) => {
        RuleScenario(
          'architect_overview returns a compact overview digest',
          ({ When, Then, And }) => {
            When('I invoke the "architect_overview" tool with {}', async () => {
              await runTool('architect_overview', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
          },
        );

        RuleScenario(
          'architect_coverage returns JSON-parseable annotation coverage',
          ({ When, Then, And }) => {
            When('I invoke the "architect_coverage" tool with {}', async () => {
              await runTool('architect_coverage', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the coverage output excludes removed taxonomy tags', () => {
              const text = state!.result!.text;
              for (const removed of ['phase', 'maturity', 'arch-layer', 'used-by']) {
                expect(text).not.toContain(removed);
              }
            });
          },
        );

        RuleScenario(
          'architect_status returns a JSON-parseable status distribution',
          ({ When, Then, And }) => {
            When('I invoke the "architect_status" tool with {}', async () => {
              await runTool('architect_status', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
          },
        );

        RuleScenario(
          'architect_context returns a compact session-context bundle',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_context" tool with a name arg targeting the seeded pattern',
              async () => {
                await runTool('architect_context', { name: TEST_PATTERN_NAME, session: 'design' });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text mentions the seeded pattern name', () => {
              expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
            });
          },
        );

        RuleScenario(
          'architect_files returns a compact file reading list for the seeded pattern',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_files" tool with a name arg targeting the seeded pattern',
              async () => {
                await runTool('architect_files', { name: TEST_PATTERN_NAME });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text references the seeded pattern file path', () => {
              expect(state!.result!.text).toContain('rich-pattern.feature');
            });
          },
        );

        RuleScenario(
          'architect_dep_tree returns a compact dependency tree for the seeded pattern',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_dep_tree" tool with a name arg targeting the seeded pattern',
              async () => {
                await runTool('architect_dep_tree', { name: TEST_PATTERN_NAME });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text mentions the seeded pattern name', () => {
              expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
            });
          },
        );

        RuleScenario(
          'architect_scope_validate returns a compact readiness report for the seeded pattern',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_scope_validate" tool with the seeded pattern and session implement',
              async () => {
                await runTool('architect_scope_validate', {
                  name: TEST_PATTERN_NAME,
                  session: 'implement',
                });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text mentions the seeded pattern name', () => {
              expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
            });
          },
        );

        RuleScenario(
          'architect_pattern returns the seeded pattern detail',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_pattern" tool with a name arg targeting the seeded pattern',
              async () => {
                await runTool('architect_pattern', { name: TEST_PATTERN_NAME });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
            And('the result text mentions the seeded pattern name', () => {
              expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
            });
          },
        );

        RuleScenario(
          'architect_bundle returns a JSON-parseable composite pattern bundle',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_bundle" tool with the seeded bundle parent and include blocks',
              async () => {
                await runTool('architect_bundle', {
                  name: TEST_BUNDLE_PARENT_NAME,
                  include: ['rules', 'scenarios', 'deps', 'open-questions'],
                  estimateTokens: true,
                });
                if (state!.caughtError !== null) {
                  const caughtError = state!.caughtError;
                  if (caughtError instanceof Error) {
                    throw caughtError;
                  }
                  throw new Error(typeof caughtError === 'string' ? caughtError : 'Tool failed');
                }
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
            And('the bundle tool output contains the seeded bundle children', () => {
              const output = getOutputObject();
              expect(Object.keys(output['children'] as Record<string, unknown>)).toEqual([
                TEST_BUNDLE_CHILD_NAME,
                TEST_PATTERN_NAME,
              ]);
            });
          },
        );

        RuleScenario(
          'architect_handoff returns a compact handoff record for the seeded pattern',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_handoff" tool with a name arg targeting the seeded pattern',
              async () => {
                await runTool('architect_handoff', { name: TEST_PATTERN_NAME });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text mentions the seeded pattern name', () => {
              expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
              expect(state!.result!.text).toContain('Status: active');
              expect(state!.result!.text).not.toContain('Status: unknown');
              expect(state!.result!.text).not.toContain('Date: unknown');
            });
          },
        );

        RuleScenario(
          'architect_search returns a JSON-parseable search results document',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_search" tool with a query that matches the seeded pattern',
              async () => {
                await runTool('architect_search', { query: 'Rich' });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
          },
        );

        RuleScenario(
          'architect_list returns a JSON-parseable pattern catalog',
          ({ When, Then, And }) => {
            When('I invoke the "architect_list" tool with {}', async () => {
              await runTool('architect_list', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
            And('the pattern catalog filters exclude removed taxonomy filters', () => {
              const filters = getOutputRoot()['filters'] as Record<string, unknown>;
              expect(filters['status']).toBeUndefined();
              expect(filters['role']).toBeUndefined();
              expect(filters['phase']).toBeUndefined();
              expect(filters['maturity']).toBeUndefined();
              expect(filters['namesOnly']).toBe(false);
              expect(filters['count']).toBe(false);
            });
          },
        );

        RuleScenario(
          'architect_open_questions returns a JSON-parseable open question list',
          ({ When, Then, And }) => {
            When('I invoke the "architect_open_questions" tool with {}', async () => {
              await runTool('architect_open_questions', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
            And('the result text mentions the seeded pattern name', () => {
              expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
            });
          },
        );

        RuleScenario(
          'architect_rules returns a JSON-parseable business rule set',
          ({ When, Then, And }) => {
            When('I invoke the "architect_rules" tool with {}', async () => {
              await runTool('architect_rules', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
          },
        );

        RuleScenario('architect_rules accepts product-area options', ({ When, Then, And }) => {
          When(
            'I invoke the "architect_rules" tool with productArea {string}',
            async (_ctx: unknown, productArea: string) => {
              await runTool('architect_rules', { productArea });
            },
          );
          Then('the result text is non-empty', () => {
            expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
          });
          And('the result text parses as JSON', () => {
            expect(() => {
              JSON.parse(state!.result!.text);
            }).not.toThrow();
          });
          And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
            expect(getOutputRoot()['kind']).toBe(kind);
          });
          And('the result text mentions the seeded pattern name', () => {
            expect(state!.result!.text).toContain(TEST_PATTERN_NAME);
          });
        });

        RuleScenario(
          'architect_taxonomy returns a JSON-parseable bounded-context taxonomy digest',
          ({ When, Then, And }) => {
            When('I invoke the "architect_taxonomy" tool with {}', async () => {
              await runTool('architect_taxonomy', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
            And('the result text uses bounded-context taxonomy vocabulary', () => {
              expect(state!.result!.text).toContain('bounded-context');
              expect(state!.result!.text).toContain('contract');
              expect(state!.result!.text).toContain('codec');
              expect(state!.result!.text).not.toContain('arch-layer');
              expect(state!.result!.text).not.toContain('maturity');
            });
          },
        );

        RuleScenario(
          'architect_arch_neighborhood returns a JSON-parseable neighborhood projection',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_arch_neighborhood" tool with a name arg targeting the seeded pattern',
              async () => {
                await runTool('architect_arch_neighborhood', { name: TEST_PATTERN_NAME });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
          },
        );

        RuleScenario(
          'architect_arch_blocking returns a JSON-parseable blocking document',
          ({ When, Then, And }) => {
            When('I invoke the "architect_arch_blocking" tool with {}', async () => {
              await runTool('architect_arch_blocking', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
          },
        );

        RuleScenario(
          'architect_rebuild advances buildTimeMs and returns a compact config projection',
          ({ Given, When, Then, And }) => {
            Given('I capture the current session buildTimeMs', () => {
              state!.capturedBuildTimeMs = state!.sessionManager!.getSession().buildTimeMs;
            });
            When('I invoke the "architect_rebuild" tool with {}', async () => {
              await runTool('architect_rebuild', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the session buildTimeMs has advanced', () => {
              const after = state!.sessionManager!.getSession().buildTimeMs;
              expect(after).toBeGreaterThan(state!.capturedBuildTimeMs!);
            });
          },
        );

        RuleScenario(
          'architect_config returns a JSON-parseable project config snapshot',
          ({ When, Then, And }) => {
            When('I invoke the "architect_config" tool with {}', async () => {
              await runTool('architect_config', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
          },
        );

        RuleScenario(
          'architect_documentation returns a JSON-parseable documentation bundle',
          ({ When, Then, And }) => {
            When(
              'I invoke the "architect_documentation" tool with documentType {string}',
              async (_ctx: unknown, documentType: string) => {
                await runTool('architect_documentation', { documentType });
              },
            );
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output root kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputRoot()['kind']).toBe(kind);
            });
            And('the result text includes bundle routing metadata', () => {
              const parsed = JSON.parse(state!.result!.text) as Record<string, unknown>;
              expect(parsed['children']).toBeDefined();
              expect(parsed['routing']).toBeDefined();
            });
          },
        );

        RuleScenario(
          'architect_documentation accepts disclosure and status filter options',
          ({ When, Then, And }) => {
            When(
              'I invoke the {string} tool with documentType {string}, disclosure {string}, and status filter {string}',
              async (
                _ctx: unknown,
                toolName: string,
                documentType: string,
                disclosure: string,
                status: string,
              ) => {
                await runTool(toolName as RegisteredToolName, {
                  documentType,
                  disclosure,
                  filter: { status: [status] },
                });
              },
            );

            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });

            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });

            And('the result text mentions the completed dependency pattern', () => {
              expect(state!.result!.text).toContain(TEST_DEPENDENCY_NAME);
            });

            And('the result text does not mention the seeded pattern name', () => {
              expect(state!.result!.text).not.toContain(TEST_PATTERN_NAME);
            });
          },
        );

        RuleScenario(
          'architect_help returns a JSON-parseable help document listing every registered tool',
          ({ When, Then, And }) => {
            When('I invoke the "architect_help" tool with {}', async () => {
              await runTool('architect_help', {});
            });
            Then('the result text is non-empty', () => {
              expect(state!.result?.text.length ?? 0).toBeGreaterThan(0);
            });
            And('the result text parses as JSON', () => {
              expect(() => {
                JSON.parse(state!.result!.text);
              }).not.toThrow();
            });
            And('the tool output kind is {string}', (_ctx: unknown, kind: string) => {
              expect(getOutputObject()['kind']).toBe(kind);
            });
            And('the architect_help text mentions every frozen registered tool name', () => {
              for (const name of FROZEN_REGISTERED_TOOL_NAMES) {
                expect(state!.result!.text).toContain(name);
              }
            });
          },
        );
      },
    );

    ruleIfPresent('The registered tool inventory remains frozen', ({ RuleScenario }) => {
      RuleScenario(
        'registerAllTools preserves the frozen MCP tool inventory',
        ({ When, Then, And }) => {
          When('I register all tools on a capturing MCP server', () => {
            const server = new CapturingMcpServer();
            registerAllTools(server, state!.sessionManager!);
            state!.registrations = server.registrations;
          });

          Then('the registered tool names match the frozen MCP contract inventory', () => {
            const registeredNames = state!.registrations.map((entry) => entry.name);
            expect(ARCHITECT_MCP_TOOLS.map((tool) => tool.name)).toEqual(
              FROZEN_REGISTERED_TOOL_NAMES,
            );
            expect(REGISTERED_TOOL_NAMES).toEqual(FROZEN_REGISTERED_TOOL_NAMES);
            expect(registeredNames).toEqual(FROZEN_REGISTERED_TOOL_NAMES);
            expect(new Set(registeredNames).size).toBe(FROZEN_REGISTERED_TOOL_NAMES.length);
          });

          And('each registered tool uses the documented description', () => {
            const descriptions = new Map<string, string>(
              ARCHITECT_MCP_TOOLS.map((tool) => [tool.name, tool.description]),
            );
            for (const registration of state!.registrations) {
              expect(registration.description).toBe(descriptions.get(registration.name));
              expect(registration.inputSchema).toBeDefined();
            }
          });

          And('the metadata help text lists every frozen tool name', () => {
            const helpText = buildToolHelpText();
            expect(helpText).toContain('Registered tools (21):');
            for (const name of FROZEN_REGISTERED_TOOL_NAMES) {
              expect(helpText).toContain(name);
            }
            expect(helpText).toContain('bounded-context');
            for (const removed of ['phase', 'maturity', 'used-by', 'legacy context', 'layer']) {
              expect(helpText).not.toContain(removed);
            }
          });
        },
      );
    });

    ruleIfPresent('invokeTool validates args via the tool input schema', ({ RuleScenario }) => {
      RuleScenario('zero-argument tools accept empty and omitted arguments', ({ When, Then }) => {
        When('I invoke every zero-argument tool with {} and omitted arguments', async () => {
          const results: ZeroArgumentResult[] = [];

          for (const name of ZERO_ARGUMENT_TOOL_NAMES) {
            for (const variant of ['empty-object', 'omitted'] as const) {
              try {
                const args = variant === 'empty-object' ? {} : undefined;
                const result = await invokeTool(state!.sessionManager!, name, args);
                results.push({ name, variant, result, error: null });
              } catch (error) {
                results.push({ name, variant, result: null, error });
              }
            }
          }

          state!.zeroArgumentResults = results;
        });

        Then('every zero-argument tool invocation succeeds with non-empty text', () => {
          expect(state!.zeroArgumentResults).toHaveLength(ZERO_ARGUMENT_TOOL_NAMES.length * 2);
          for (const entry of state!.zeroArgumentResults) {
            expect(entry.error, `${entry.name} ${entry.variant}`).toBeNull();
            expect(
              entry.result?.text.length ?? 0,
              `${entry.name} ${entry.variant}`,
            ).toBeGreaterThan(0);
          }
        });
      });

      RuleScenario('architect_context rejects an empty name', ({ When, Then }) => {
        When('I invoke the "architect_context" tool with an empty name', async () => {
          await runTool('architect_context', { name: '' });
        });
        Then('invokeTool throws a validation error', () => {
          expect(state!.caughtError).toBeDefined();
          expect(state!.result).toBeNull();
        });
      });

      RuleScenario(
        'architect_scope_validate rejects a session value outside the enum',
        ({ When, Then }) => {
          When('I invoke the "architect_scope_validate" tool with session "planning"', async () => {
            await runTool('architect_scope_validate', {
              name: TEST_PATTERN_NAME,
              session: 'planning',
            });
          });
          Then('invokeTool throws a validation error', () => {
            expect(state!.caughtError).toBeDefined();
            expect(state!.result).toBeNull();
          });
        },
      );

      RuleScenario(
        'architect_rules rejects an unknown input key through both invokeTool and registered handlers',
        ({ When, Then, And }) => {
          When('I invoke the "architect_rules" tool with an unknown extra key', async () => {
            await runTool('architect_rules', {
              pattern: TEST_PATTERN_NAME,
              unknownExtraKey: true,
            });
          });

          And('I register all tools on a capturing MCP server', () => {
            const server = new CapturingMcpServer();
            registerAllTools(server, state!.sessionManager!);
            state!.registrations = server.registrations;
          });

          And(
            'I invoke the registered {string} handler with an unknown extra key',
            async (_ctx: unknown, toolName: string) => {
              await runRegisteredTool(RegisteredToolNameSchema.parse(toolName), {
                pattern: TEST_PATTERN_NAME,
                unknownExtraKey: true,
              });
            },
          );

          Then('invokeTool and the registered handler both throw the same validation error', () => {
            expect(state!.caughtError).toBeDefined();
            expect(state!.registeredCaughtError).toBeDefined();
            expect(state!.result).toBeNull();
            expect(state!.caughtError).toBeInstanceOf(Error);
            expect(state!.registeredCaughtError).toBeInstanceOf(Error);

            const invokeMessage = (state!.caughtError as Error).message;
            const registeredMessage = (state!.registeredCaughtError as Error).message;
            expect(invokeMessage).toBe(registeredMessage);
          });

          And(
            'the validation error message mentions both {string} and {string}',
            (_ctx: unknown, first: string, second: string) => {
              const message = (state!.caughtError as Error).message;
              expect(message.startsWith(first)).toBe(true);
              expect(message).toContain(second);
            },
          );
        },
      );

      RuleScenario('architect_open_questions rejects an unknown input key', ({ When, Then }) => {
        When('I invoke the "architect_open_questions" tool with an unknown extra key', async () => {
          await runTool('architect_open_questions', { unknownExtraKey: true });
        });

        Then('invokeTool throws a validation error', () => {
          expect(state!.caughtError).toBeDefined();
          expect(state!.result).toBeNull();
        });
      });

      RuleScenario('architect_bundle rejects an unknown input key', ({ When, Then }) => {
        When('I invoke the "architect_bundle" tool with an unknown extra key', async () => {
          await runTool('architect_bundle', {
            name: TEST_BUNDLE_PARENT_NAME,
            unknownExtraKey: true,
          });
        });

        Then('invokeTool throws a validation error', () => {
          expect(state!.caughtError).toBeDefined();
          expect(state!.result).toBeNull();
        });
      });

      RuleScenario(
        'architect_rules rejects conflicting pattern and productArea filters',
        ({ When, Then }) => {
          When(
            'I invoke the "architect_rules" tool with conflicting pattern and productArea filters',
            async () => {
              await runTool('architect_rules', {
                pattern: TEST_PATTERN_NAME,
                productArea: 'Projection',
              });
            },
          );

          Then('invokeTool throws the error {string}', (_ctx: unknown, expected: string) => {
            expect(state!.caughtError).toBeInstanceOf(Error);
            expect((state!.caughtError as Error).message).toContain(expected);
          });
        },
      );

      RuleScenario(
        'registered handlers validate before reading session state',
        ({ When, And, Then }) => {
          When(
            'I register all tools on a capturing MCP server with unavailable session state',
            () => {
              const server = new CapturingMcpServer();
              registerAllTools(server, createUnavailableSessionManager());
              state!.registrations = server.registrations;
            },
          );

          And(
            'I invoke the registered {string} handler with an unknown extra key',
            async (_ctx: unknown, toolName: string) => {
              await runRegisteredTool(RegisteredToolNameSchema.parse(toolName), {
                pattern: TEST_PATTERN_NAME,
                unknownExtraKey: true,
              });
            },
          );

          Then(
            'the registered handler throws a validation error before reading session state',
            () => {
              expect(state!.registeredCaughtError).toBeInstanceOf(Error);
              expect((state!.registeredCaughtError as Error).message).toContain(
                'Invalid input for architect_rules:',
              );
              expect((state!.registeredCaughtError as Error).message).not.toContain(
                'Session state should not be read',
              );
            },
          );
        },
      );

      RuleScenario(
        'architect_documentation rejects invalid disclosure and filter values',
        ({ When, Then }) => {
          When(
            'I invoke the "architect_documentation" tool with invalid disclosure and filter values',
            async () => {
              await runTool('architect_documentation', {
                documentType: 'patterns',
                disclosure: 'verbose',
                filter: { status: ['unknown'] },
              });
            },
          );

          Then('invokeTool throws a validation error', () => {
            expect(state!.caughtError).toBeDefined();
            expect(state!.result).toBeNull();
          });
        },
      );

      RuleScenario('architect_documentation rejects empty filter values', ({ When, Then }) => {
        When('I invoke the "architect_documentation" tool with empty filter values', async () => {
          await runTool('architect_documentation', {
            documentType: 'patterns',
            filter: { status: [] },
          });
        });

        Then('invokeTool throws a validation error', () => {
          expect(state!.caughtError).toBeDefined();
          expect(state!.result).toBeNull();
        });
      });

      RuleScenario('removed taxonomy inputs are rejected from the fixture', ({ When, Then }) => {
        When('I invoke each removed taxonomy input fixture', async () => {
          const results: RemovedInputResult[] = [];
          for (const fixture of readRemovedInputFixtures()) {
            try {
              await invokeTool(state!.sessionManager!, fixture.tool, fixture.args);
              results.push({ fixture, error: null });
            } catch (error) {
              results.push({ fixture, error });
            }
          }
          state!.removedInputResults = results;
        });

        Then('every removed taxonomy input fixture throws a validation error', () => {
          expect(state!.removedInputResults).toHaveLength(readRemovedInputFixtures().length);
          for (const result of state!.removedInputResults) {
            expect(result.error, result.fixture.removedKey).toBeInstanceOf(Error);
            expect((result.error as Error).message).toContain(
              `Invalid input for ${result.fixture.tool}:`,
            );
            expect((result.error as Error).message).toContain(result.fixture.removedKey);
          }
        });
      });

      RuleScenario('MCP schema help excludes removed taxonomy fields', ({ When, Then }) => {
        When('I register all tools on a capturing MCP server', () => {
          const server = new CapturingMcpServer();
          registerAllTools(server, state!.sessionManager!);
          state!.registrations = server.registrations;
        });

        Then('the registered schema metadata and help text exclude removed taxonomy fields', () => {
          const helpText = buildToolHelpText();
          const registrationsText = JSON.stringify(
            state!.registrations.map((registration) => ({
              name: registration.name,
              description: registration.description,
            })),
          );
          const publicContractText = `${helpText}
${registrationsText}`;
          expect(publicContractText).toContain('bounded-context');
          for (const removed of ['phase', 'maturity', 'used-by', 'legacy context', 'arch-layer']) {
            expect(publicContractText).not.toContain(removed);
          }
        });
      });

      RuleScenario('unknown tool names still fail loudly', ({ When, Then }) => {
        When('I invoke an unknown MCP tool name', async () => {
          await runUnknownTool('architect_unknown_tool', {});
        });
        Then('invokeTool throws an error for the unknown tool name', () => {
          expect(state!.caughtError).toBeDefined();
          expect(state!.result).toBeNull();
        });
      });
    });

    ruleIfPresent(
      'MCP server starts via stdio transport and manages its own lifecycle',
      ({ RuleScenario }) => {
        RuleScenario('stdio server lifecycle wiring is documented in source', ({ Then }) => {
          Then('the MCP server source wires stdio transport and signal shutdown', () => {
            expectSourceToContain('src/server.ts', [
              'new StdioServerTransport()',
              'await server.connect(transport)',
              "process.once('SIGINT'",
              "process.once('SIGTERM'",
              'await server.close()',
            ]);
          });
        });
      },
    );

    ruleIfPresent(
      'PatternGraph rebuild requests coalesce under concurrent load',
      ({ RuleScenario }) => {
        RuleScenario('rebuild coalescing is documented in source', ({ Then }) => {
          Then('the pipeline session source documents coalesced rebuild publication', () => {
            expectSourceToContain('src/pipeline-session.ts', [
              'private rebuildPromise: Promise<PipelineSession> | null = null',
              'private pendingRebuild = false',
              'this.pendingRebuild = true',
              'return this.rebuildPromise',
              'consumePendingRebuild()',
            ]);
          });
        });
      },
    );

    ruleIfPresent(
      'Source file changes trigger automatic dataset rebuild with debouncing',
      ({ RuleScenario }) => {
        RuleScenario('watch mode rebuilds are debounced and isolated', ({ Then }) => {
          Then('the MCP file watcher source wires debounced rebuild error isolation', () => {
            expectSourceToContain('src/file-watcher.ts', [
              'const DEFAULT_DEBOUNCE_MS = 500',
              'this.pendingTimer = setTimeout',
              'this.rebuildPromise = this.runRebuild().finally',
              'await this.options.sessionManager.rebuild()',
              'Rebuild failed; previous dataset remains active',
            ]);
          });
        });
      },
    );

    ruleIfPresent(
      'MCP server is configurable via standard client configuration',
      ({ RuleScenario }) => {
        RuleScenario('CLI options cover standard MCP client configuration', ({ Then }) => {
          Then('the MCP server source documents standard CLI client options', () => {
            expectSourceToContain('src/server.ts', [
              '-i, --input <glob>',
              '-f, --features <glob>',
              '-b, --base-dir <dir>',
              '-w, --watch',
              'resolveMcpBaseDirArg(next)',
            ]);
          });
        });
      },
    );
  });
}

for (const feature of features) {
  bindFeature(feature);
}
