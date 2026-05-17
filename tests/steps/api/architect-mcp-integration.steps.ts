import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  invokeTool,
  type RegisteredToolName,
} from '../../../../architect-mcp/src/tool-registry.js';
import type { PipelineSessionManager } from '../../../../architect-mcp/src/pipeline-session.js';

const feature = await loadFeature('tests/features/api/architect-mcp-integration.feature');

interface McpBoundaryState {
  readonly sessionManager: PipelineSessionManager;
  error: Error | null;
}

let state: McpBoundaryState | null = null;

function initState(): McpBoundaryState {
  return {
    sessionManager: {
      getSession(): never {
        throw new Error('Tool handler should not execute for invalid input.');
      },
    } as unknown as PipelineSessionManager,
    error: null,
  };
}

async function captureToolError(toolName: RegisteredToolName, rawInput: unknown): Promise<void> {
  try {
    await invokeTool(state!.sessionManager, toolName, rawInput);
    state!.error = null;
  } catch (error) {
    state!.error = error instanceof Error ? error : new Error(String(error));
  }
}

describeFeature(feature, ({ Rule }) => {
  Rule(
    'MCP tool input parsing rejects malformed raw input before tool execution',
    ({ RuleScenario }) => {
      RuleScenario(
        'Null raw input uses the tool schema and returns a validation error',
        ({ When, Then, And }) => {
          When('MCP tool {string} receives null raw input', async (_ctx, toolName: string) => {
            state = initState();
            await captureToolError(toolName as RegisteredToolName, null);
          });

          Then('the MCP input boundary rejects it with {string}', (_ctx, expected: string) => {
            expect(state!.error).not.toBeNull();
            expect(state!.error?.message).toContain(expected);
          });

          And('the MCP input boundary rejects it with {string}', (_ctx, expected: string) => {
            expect(state!.error).not.toBeNull();
            expect(state!.error?.message).toContain(expected);
          });
        },
      );

      RuleScenario(
        'String raw input is rejected before schema defaults can apply',
        ({ When, Then }) => {
          When('MCP tool {string} receives string raw input', async (_ctx, toolName: string) => {
            state = initState();
            await captureToolError(toolName as RegisteredToolName, 'string');
          });

          Then('the MCP input boundary rejects it with {string}', (_ctx, expected: string) => {
            expect(state!.error).not.toBeNull();
            expect(state!.error?.message).toContain(expected);
          });
        },
      );

      RuleScenario(
        'Number raw input is rejected before schema defaults can apply',
        ({ When, Then }) => {
          When('MCP tool {string} receives number raw input', async (_ctx, toolName: string) => {
            state = initState();
            await captureToolError(toolName as RegisteredToolName, 42);
          });

          Then('the MCP input boundary rejects it with {string}', (_ctx, expected: string) => {
            expect(state!.error).not.toBeNull();
            expect(state!.error?.message).toContain(expected);
          });
        },
      );
    },
  );
});
