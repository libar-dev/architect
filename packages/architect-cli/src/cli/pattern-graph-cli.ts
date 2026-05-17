#!/usr/bin/env node

/**
 * @architect
 * @architect-cli
 * @architect-pattern PatternGraphCLI
 * @architect-status active
 * @architect-implements PatternGraphAPICLI, DataAPICLIErgonomics
 * @architect-uses CLIRuntimePaths, CLIVersionHelper
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 *
 * ## PatternGraphCLI — Split Runtime Composition Root
 *
 * Coordinates global argument parsing, REPL lifecycle, runtime bootstrap, and
 * dispatch into the architect-query read model. Command families and cache-aware
 * pipeline helpers live in adjacent CLI modules.
 *
 * **When to Use:** Use as the primary runtime boundary for interactive Architect
 * queries, dry-run source planning, and REPL-based session work.
 */

import readline from 'node:readline';
import {
  assertHasValue,
  assertNoNullBytes,
  parseAtBoundary,
  RenderFormatSchema,
  type SessionType,
} from '@libar-dev/architect-core';
import {
  COMMANDS,
  CommandNameSchema,
  isCommandName,
  rejectLegacyCategory,
  runCommand,
  validateCommandInput,
} from './pattern-graph-cli-commands.js';
import { parseIntegerValue, parseSessionTypeValue } from './commands/_shared/schemas.js';
import { printCommandHelp, printGlobalHelp, printVersion } from './commands/_shared/help.js';
import { buildCliContext, writeDryRun } from './pattern-graph-cli-runtime.js';
import { ParsedArgsSchema, type ParsedArgs } from './pattern-graph-cli-types.js';
import { resolveCliBaseDirArg, resolveInvocationDir } from './runtime-helpers.js';

function parseArgs(argv: readonly string[]): ParsedArgs {
  const args = argv
    .filter((arg) => arg !== '--')
    .map((arg) => {
      assertNoNullBytes(arg, 'argument');
      return arg;
    });
  const invocationDir = resolveInvocationDir();
  let baseDir = invocationDir;
  let help = false;
  let version = false;
  let dryRun = false;
  let noCache = false;
  let format: ParsedArgs['format'] = 'compact';
  let sessionType: SessionType = 'implement';
  let sessionTypeExplicit = false;
  let depth = 10;
  const input: string[] = [];
  const features: string[] = [];
  const remaining: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      continue;
    }
    const next = args[index + 1];

    switch (arg) {
      case '-h':
      case '--help':
        help = true;
        break;
      case '-v':
      case '--version':
        version = true;
        break;
      case '-b':
      case '--base-dir':
        assertHasValue(next, arg);
        baseDir = resolveCliBaseDirArg(next);
        index += 1;
        break;
      case '-i':
      case '--input':
        assertHasValue(next, arg);
        input.push(next);
        index += 1;
        break;
      case '-f':
        assertHasValue(next, arg);
        features.push(next);
        index += 1;
        break;
      case '--feature':
        if (remaining.length > 0) {
          remaining.push(arg);
          break;
        }
        assertHasValue(next, arg);
        features.push(next);
        index += 1;
        break;
      case '--session':
        if (remaining.length > 0) {
          remaining.push(arg);
          break;
        }
        assertHasValue(next, arg);
        sessionType = parseSessionTypeValue(next);
        sessionTypeExplicit = true;
        index += 1;
        break;
      case '--depth':
        if (remaining.length > 0) {
          remaining.push(arg);
          break;
        }
        assertHasValue(next, arg);
        depth = parseIntegerValue(next, '--depth requires an integer value');
        index += 1;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--no-cache':
        noCache = true;
        break;
      case '--format': {
        assertHasValue(next, arg);
        try {
          format = parseAtBoundary(RenderFormatSchema, next, '--format');
        } catch {
          throw new Error('--format must be compact or json');
        }
        index += 1;
        break;
      }
      case '--category':
        throw new Error('Legacy --category is no longer supported. Use --role <tag> instead.');
      default:
        if (arg.startsWith('--category=')) {
          rejectLegacyCategory();
        }
        remaining.push(arg);
        break;
    }
  }

  const first = remaining[0];
  if (first?.startsWith('-') === true) {
    throw new Error(`Unknown option: ${first}`);
  }

  return parseAtBoundary(
    ParsedArgsSchema,
    {
      baseDir,
      input,
      features,
      command: first ?? null,
      commandArgs: remaining.slice(1),
      help,
      version,
      dryRun,
      noCache,
      format,
      sessionType,
      sessionTypeExplicit,
      depth,
    },
    'Failed to parse CLI arguments',
  );
}

async function runRepl(args: ParsedArgs): Promise<void> {
  let context = await buildCliContext(args);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  try {
    for await (const rawLine of rl) {
      const line = rawLine.trim();
      if (line.length === 0) {
        continue;
      }
      if (line === 'quit' || line === 'exit') {
        break;
      }
      if (line === 'reload') {
        process.stderr.write('Reloading pipeline\n');
        context = await buildCliContext({ ...args, noCache: true });
        process.stderr.write('Reloaded\n');
        continue;
      }

      const tokens = line.split(/\s+/).filter((token) => token.length > 0);
      const [command, ...commandArgs] = tokens;
      if (command === undefined) {
        continue;
      }

      await runCommand(
        { args, mode: 'repl', cli: context, services: { runRepl } },
        command,
        commandArgs,
      );
    }
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === null) {
    if (args.version) {
      printVersion();
      return;
    }
    if (args.help) {
      printGlobalHelp();
      return;
    }
    printGlobalHelp(process.stderr);
    process.exit(1);
  }

  if (args.help) {
    printCommandHelp(args.command);
    return;
  }

  if (args.version) {
    printVersion();
    return;
  }

  if (!isCommandName(args.command)) {
    throw new Error(`Unknown subcommand: ${args.command}`);
  }

  validateCommandInput(args.command, args.commandArgs);

  if (args.dryRun) {
    await writeDryRun(args);
    return;
  }

  const command = CommandNameSchema.parse(args.command);
  const definition = COMMANDS[command];
  const context = definition.requiresCliContext === false ? null : await buildCliContext(args);

  await runCommand(
    { args, mode: 'main', cli: context, services: { runRepl } },
    command,
    args.commandArgs,
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
