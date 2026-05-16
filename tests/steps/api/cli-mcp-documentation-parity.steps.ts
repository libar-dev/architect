import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { invokeTool } from '../../../../architect-mcp/src/tool-registry.js';
import { PipelineSessionManager } from '../../../../architect-mcp/src/pipeline-session.js';
import { runCLI } from '../../support/helpers/cli-runner.js';

const feature = await loadFeature('tests/features/api/cli-mcp-documentation-parity.feature');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_HOST_ROOT = path.resolve(__dirname, '../..', '..');

interface DocumentationParityState {
  sessionManager: PipelineSessionManager | null;
  cliOutput: unknown;
  mcpOutput: unknown;
}

let state: DocumentationParityState | null = null;

function initState(): DocumentationParityState {
  return {
    sessionManager: null,
    cliOutput: null,
    mcpOutput: null,
  };
}

async function runDocumentationCli(
  documentType: string,
  options: { disclosure?: string; filter?: string } = {}
): Promise<unknown> {
  const args = ['--base-dir', '.', '--format', 'json', 'documentation', documentType];
  if (options.disclosure !== undefined) {
    args.push('--disclosure', options.disclosure);
  }
  if (options.filter !== undefined) {
    args.push('--filter', options.filter);
  }

  const result = await runCLI('architect', args, { cwd: PACKAGE_HOST_ROOT });
  if (result.exitCode !== 0) {
    throw new Error(
      `architect documentation failed (${String(result.exitCode)}): ${result.stderr || result.stdout}`
    );
  }
  return JSON.parse(result.stdout) as unknown;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the package-hosted documentation parity fixture is initialized', async () => {
      state = initState();
      state.sessionManager = new PipelineSessionManager();
      await state.sessionManager.initialize({ baseDir: PACKAGE_HOST_ROOT });
    });
  });

  Rule(
    'CLI and MCP documentation boundaries serialize the same projection bundle',
    ({ RuleScenarioOutline, RuleScenario }) => {
      RuleScenarioOutline(
        'CLI and MCP produce identical JSON for a bundle',
        ({ When, And, Then }, examples: Record<string, unknown>) => {
          const documentType = String(examples['docType']);

          When('I generate "<docType>" via the CLI documentation command as JSON', async () => {
            state!.cliOutput = await runDocumentationCli(documentType);
          });

          And('I generate "<docType>" via the MCP architect_documentation tool', async () => {
            const result = await invokeTool(state!.sessionManager!, 'architect_documentation', {
              documentType,
            });
            state!.mcpOutput = JSON.parse(result.text) as unknown;
          });

          Then('the two outputs deep-equal', () => {
            expect(state!.cliOutput).toEqual(state!.mcpOutput);
          });
        }
      );

      RuleScenario(
        'CLI and MCP produce identical JSON for filtered and disclosed business rules',
        ({ When, And, Then }) => {
          When(
            'I generate {string} via the CLI documentation command as JSON with disclosure {string} and filter {string}',
            async (_ctx: unknown, documentType: string, disclosure: string, filter: string) => {
              state!.cliOutput = await runDocumentationCli(documentType, { disclosure, filter });
            }
          );

          And(
            'I generate {string} via the MCP architect_documentation tool with disclosure {string} and completed-status filter',
            async (_ctx: unknown, documentType: string, disclosure: string) => {
              const result = await invokeTool(state!.sessionManager!, 'architect_documentation', {
                documentType,
                disclosure,
                filter: { status: ['completed'] },
              });
              state!.mcpOutput = JSON.parse(result.text) as unknown;
            }
          );

          Then('the two outputs deep-equal', () => {
            expect(state!.cliOutput).toEqual(state!.mcpOutput);
          });
        }
      );
    }
  );
});
