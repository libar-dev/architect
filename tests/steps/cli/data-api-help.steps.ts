/**
 * Data API CLI Per-Subcommand Help Step Definitions
 *
 * BDD step definitions for testing per-subcommand help output,
 * global help, public command/flag inventory, and the frozen
 * `--format json` behavior for text-oriented subcommands.
 *
 * @architect
 * @architect-implements DataAPICLIErgonomics
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type CLITestState,
  initState,
  getResult,
  runCLICommand,
  createTempDir,
  writeArchPatternFilesWithDeps,
  writeParentHierarchyFeatureFiles,
  writePatternFiles,
} from '../../support/helpers/pattern-graph-api-state.js';

const FROZEN_COMMAND_INVENTORY = [
  'overview [--disclosure <level>]',
  'status',
  'context <pattern> [--session planning|design|implement]',
  'dep-tree <pattern> [--depth <n>]',
  'files <pattern> [--related]',
  'scope-validate <pattern> <design|implement> [--type <design|implement>] [--strict]',
  'handoff --pattern <pattern> [--session planning|design|implement|review] [--modified-file <path>]...',
  'query <method> [args...]',
  'pattern <name>',
  'documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...',
  'bundle <pattern> [--mode <plan|design|implement|review>] [--include <block[,block...]>] [--estimate-tokens]',
  'list [--status <value>] [--role <tag>] [--parent <PatternName>] [--package <workspace-name>] [--count] [--names-only]',
  'open-questions [--parent <PatternName>]',
  'search <query>',
  'arch roles|bounded-context [name]|neighborhood <pattern>|graph|compare <bounded-context-a> <bounded-context-b>|coverage|dangling [--baseline <path>] [--write-baseline] [--strict]|orphans|blocking|packages [name]',
  'rules [--product-area <name>] [--pattern <name>] [--package <workspace-name>] [--feature <path-or-glob>] [--only-invariants] [--count] [--names-only]',
  'diagnostics',
  'tags',
  'taxonomy [--count]',
  'sources',
  'unannotated',
  'repl',
  'help',
  'version',
] as const;

const FROZEN_GLOBAL_FLAGS = [
  '-b, --base-dir <dir>     Base directory (default: cwd)',
  '-i, --input <glob>       TypeScript source glob (repeatable)',
  '-f, --feature <glob>     Gherkin feature glob (repeatable)',
  '--dry-run            Show resolved inputs without running the pipeline',
  '--no-cache           Bypass CLI cache metadata tracking',
  '--session <type>     planning, design, or implement',
  '--depth <n>          Dependency tree depth',
  '--format <type>      Output format: compact (default) or json (pipe via `pnpm -s`)',
  '-h, --help               Show help',
  '-v, --version            Show version',
  'Piping JSON: run via `pnpm -s` so the pnpm banner stays off stdout, e.g.',
  'pnpm -s architect:query bundle <Pattern> --format json | jq',
  'Bare `pnpm architect:query … | jq` fails — the banner breaks the pipe.',
  'Agent environments: load the `architect-data-api` skill for verb shapes,',
  'deterministic gates, JSON shapes, and known quirks.',
] as const;

interface FrozenFormatJsonResult {
  readonly command: string;
  readonly expectedKind: string;
  readonly exitCode: number;
  readonly parsed: Record<string, unknown>;
  readonly expectedDataKeys?: readonly string[];
}

interface HelpTestState extends CLITestState {
  formatJsonResults: FrozenFormatJsonResult[];
}

function initHelpState(): HelpTestState {
  return {
    ...initState(),
    formatJsonResults: [],
  };
}

function getHelpState(current: HelpTestState | null): HelpTestState {
  if (current === null) {
    throw new Error('Help test state not initialized');
  }
  return current;
}

function extractSectionLines(
  stdout: string,
  sectionHeading: string,
  nextHeading?: string,
): string[] {
  const startMarker = `${sectionHeading}\n`;
  const startIndex = stdout.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Could not find section ${sectionHeading}`);
  }

  const sectionStart = startIndex + startMarker.length;
  const sectionText =
    nextHeading === undefined
      ? stdout.slice(sectionStart)
      : stdout.slice(sectionStart, stdout.indexOf(`\n${nextHeading}\n`, sectionStart));

  return sectionText
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .map((line) => line.replace(/^\s+/, ''));
}

let state: HelpTestState | null = null;

const feature = await loadFeature('tests/features/cli/data-api-help.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
  });

  Background(({ Given }) => {
    Given('a temporary working directory', async () => {
      state = initHelpState();
      state.tempContext = await createTempDir({ prefix: 'cli-help-test-' });
    });
  });

  Rule('Per-subcommand help shows usage and flags', ({ RuleScenario }) => {
    RuleScenario('Per-subcommand help for context', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains context usage and session flag', () => {
        const stdout = getResult(state).stdout;
        expect(stdout).toContain('context');
        expect(stdout).toContain('--session');
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario('Global help still works', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario(
      'Global help lists the frozen public command and flag inventory',
      ({ When, Then, And }) => {
        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('global help lists the frozen command inventory', () => {
          const lines = extractSectionLines(
            getResult(state).stdout,
            'Commands:',
            'Global options:',
          );
          expect(lines).toEqual(FROZEN_COMMAND_INVENTORY);
        });

        And('global help lists the frozen notable flags', () => {
          const lines = extractSectionLines(getResult(state).stdout, 'Global options:');
          expect(lines).toEqual(FROZEN_GLOBAL_FLAGS);
        });
      },
    );

    RuleScenario('Unknown subcommand help', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario(
      'Structured subcommands accept the public --format json flag',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('TypeScript files with architecture annotations and dependencies', async () => {
          await writeArchPatternFilesWithDeps(state);
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running the frozen "--format json" contract command set', async () => {
          const commands: ReadonlyArray<{
            command: string;
            expectedKind: string;
            expectedDataKeys?: readonly string[];
          }> = [
            {
              command: "pattern-graph-cli -i 'src/**/*.ts' --format json overview",
              expectedKind: 'OverviewDigest',
            },
            {
              command:
                "pattern-graph-cli -i 'src/**/*.ts' --format json context CompletedPattern --session implement",
              expectedKind: 'SessionContextBundle',
            },
            {
              command:
                "pattern-graph-cli -i 'src/**/*.ts' --format json files CompletedPattern --related",
              expectedKind: 'FileReadingList',
            },
            {
              command:
                "pattern-graph-cli -i 'src/**/*.ts' --format json scope-validate CompletedPattern implement --strict",
              expectedKind: 'ScopeReadinessReport',
            },
            {
              command:
                "pattern-graph-cli -i 'src/**/*.ts' --format json handoff --pattern CompletedPattern --session review",
              expectedKind: 'HandoffRecord',
            },
            {
              command:
                "pattern-graph-cli -i 'src/**/*.ts' --format json dep-tree ContextFormatterImpl --depth 2",
              expectedKind: 'DependencyTree',
            },
            {
              command: "pattern-graph-cli -i 'src/**/*.ts' --format json arch bounded-context api",
              expectedKind: 'BoundedContext',
              expectedDataKeys: ['children', 'root'],
            },
            {
              command: "pattern-graph-cli -i 'src/**/*.ts' --format json open-questions",
              expectedKind: 'OpenQuestionList',
            },
            {
              command:
                "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' --format json bundle ParentEpic --include rules,scenarios,deps,open-questions",
              expectedKind: 'PatternBundleEntry',
            },
          ];

          const helpState = getHelpState(state);
          helpState.formatJsonResults = [];

          for (const entry of commands) {
            await runCLICommand(helpState, entry.command);
            const result = getResult(helpState);
            const expectedDataKeys =
              'expectedDataKeys' in entry ? entry.expectedDataKeys : undefined;

            helpState.formatJsonResults.push({
              command: entry.command,
              expectedKind: entry.expectedKind,
              exitCode: result.exitCode,
              parsed: JSON.parse(result.stdout) as Record<string, unknown>,
              ...(expectedDataKeys !== undefined ? { expectedDataKeys } : {}),
            });
          }
        });

        Then('every frozen "--format json" command exits with code 0', () => {
          for (const result of getHelpState(state).formatJsonResults) {
            expect(result.exitCode, result.command).toBe(0);
          }
        });

        And('every frozen "--format json" command returns structured JSON', () => {
          for (const result of getHelpState(state).formatJsonResults) {
            const topLevelKind = result.parsed['kind'];
            const rootKind = (result.parsed['root'] as { kind?: unknown } | undefined)?.kind;
            const dataRootKind = (
              result.parsed['data'] as { root?: { kind?: unknown } } | undefined
            )?.root?.kind;

            expect(topLevelKind ?? rootKind ?? dataRootKind, result.command).toBe(
              result.expectedKind,
            );

            if (result.expectedDataKeys !== undefined) {
              expect(
                Object.keys(result.parsed['data'] as Record<string, unknown>),
                result.command,
              ).toEqual(result.expectedDataKeys);
            }
          }
        });
      },
    );
  });
});
