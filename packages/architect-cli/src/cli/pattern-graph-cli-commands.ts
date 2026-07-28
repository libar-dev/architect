/**
 * @architect
 * @architect-pattern:CLICommandRegistry
 * @architect-status:completed
 * @architect-role:service
 * @architect-bounded-context:cli
 * @architect-uses TrustBoundaryParser, ZodErrorBoundary
 *
 * ## CLICommandRegistry — Command Routing & Dispatch
 *
 * The canonical registry of every architect-query command (`overview`,
 * `pattern`, `bundle`, `arch`, ...): owns the command-name enum, per-command
 * flag parsing, input validation at the CLI trust boundary, and dispatch into
 * the per-family command handlers (lifecycle / meta / planning / read /
 * reporting).
 *
 * **When to Use:** as the single seam that turns parsed argv into a validated,
 * routed command invocation. Adding or renaming a CLI command happens here.
 */

import {
  assertHasValue,
  assertNoNullBytes,
  BoundaryParseError,
  formatZodError,
  parseAtBoundary,
} from '@libar-dev/architect-core';
import { z } from 'zod';
import { lifecycleCommands } from './commands/lifecycle.js';
import { metaCommands } from './commands/meta.js';
import { planningCommands } from './commands/planning.js';
import { readCommands } from './commands/read.js';
import { reportingCommands } from './commands/reporting.js';
import type { CliContext, ParsedArgs } from './pattern-graph-cli-types.js';

export const COMMAND_NAMES = [
  'overview',
  'status',
  'context',
  'dep-tree',
  'files',
  'scope-validate',
  'handoff',
  'query',
  'pattern',
  'documentation',
  'bundle',
  'list',
  'open-questions',
  'search',
  'arch',
  'rules',
  'diagnostics',
  'tags',
  'taxonomy',
  'sources',
  'unannotated',
  'repl',
  'help',
  'version',
] as const;

type ReplMode = 'main' | 'repl';

interface FlagParser {
  readonly kind: 'boolean' | 'value';
  readonly key: string;
  readonly parse?: (value: string) => unknown;
  readonly multiple?: boolean;
}

export interface ParsedCommandInput {
  readonly positional: readonly string[];
  readonly flags: Readonly<Record<string, unknown>>;
  readonly rawArgv: readonly string[];
}

export interface CommandServices {
  readonly runRepl: (args: ParsedArgs) => Promise<void>;
}

export interface CommandRuntimeContext {
  readonly args: ParsedArgs;
  readonly mode: ReplMode;
  readonly cli: CliContext | null;
  readonly services: CommandServices;
}

export interface CommandHelpDetail {
  /** Optional body line(s) shown under `Usage:` — e.g. whitelisted methods list. */
  readonly body?: readonly string[];
  readonly examples?: readonly string[];
}

export interface CommandDef {
  readonly name: CommandName;
  readonly positional: z.ZodType<readonly string[]>;
  readonly flags: z.ZodType<Readonly<Record<string, unknown>>>;
  readonly usage?: string;
  /** Signature for the global `--help` Commands list — e.g. `context <pattern> [--session ...]`. */
  readonly helpSignature: string;
  readonly helpDetail?: CommandHelpDetail;
  readonly requiresCliContext?: boolean;
  readonly rejectBareValues?: boolean;
  readonly treatUnknownFlagsAsPositionals?: boolean;
  readonly flagParsers?: Readonly<Record<string, FlagParser>>;
  readonly validateParsedInput?: (parsed: ParsedCommandInput) => void;
  readonly execute: (
    context: CommandRuntimeContext,
    parsed: ParsedCommandInput,
  ) => Promise<void> | void;
}

export const CommandNameSchema = z.enum(COMMAND_NAMES);
export type CommandName = z.infer<typeof CommandNameSchema>;

export const COMMANDS: Record<CommandName, CommandDef> = {
  ...reportingCommands,
  ...planningCommands,
  ...readCommands,
  ...metaCommands,
  ...lifecycleCommands,
};

export function rejectLegacyCategory(): never {
  throw new Error('Legacy --category is no longer supported. Use --role <tag> instead.');
}

export function isCommandName(value: string): value is CommandName {
  return CommandNameSchema.safeParse(value).success;
}

function parseCommandInput(def: CommandDef, argv: readonly string[]): ParsedCommandInput {
  const positional: string[] = [];
  const rawFlags: Record<string, unknown> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) {
      continue;
    }

    if (arg === '--category' || arg.startsWith('--category=')) {
      rejectLegacyCategory();
    }

    const flagParser = def.flagParsers?.[arg];
    if (flagParser !== undefined) {
      if (flagParser.kind === 'boolean') {
        rawFlags[flagParser.key] = true;
        continue;
      }

      const value = argv[index + 1];
      assertHasValue(value, arg);
      const parsedValue = flagParser.parse ? flagParser.parse(value) : value;
      if (flagParser.multiple) {
        const existing = rawFlags[flagParser.key];
        const incoming = Array.isArray(parsedValue) ? (parsedValue as unknown[]) : [parsedValue];
        rawFlags[flagParser.key] = Array.isArray(existing)
          ? [...(existing as unknown[]), ...incoming]
          : [...incoming];
      } else {
        rawFlags[flagParser.key] = parsedValue;
      }
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      if (def.treatUnknownFlagsAsPositionals === true) {
        positional.push(arg);
        continue;
      }
      throw new Error(`Unknown option: ${arg}`);
    }

    assertNoNullBytes(arg, 'argument');

    if (def.rejectBareValues === true) {
      throw new Error(`Unknown option: ${arg}`);
    }

    positional.push(arg);
  }

  let parsedPositional: readonly string[];
  try {
    parsedPositional = parseAtBoundary(
      def.positional,
      positional,
      def.usage ?? 'Invalid arguments',
    );
  } catch {
    throw new Error(def.usage ?? `Unknown subcommand: ${def.name}`);
  }

  let parsedFlags: Readonly<Record<string, unknown>>;
  try {
    parsedFlags = parseAtBoundary(
      def.flags,
      rawFlags,
      def.usage ?? `Failed to parse options for ${def.name}.`,
    );
  } catch (error) {
    const prefix = def.usage ?? `Failed to parse options for ${def.name}.`;
    if (error instanceof BoundaryParseError) {
      throw new Error(formatZodError(error.cause, prefix));
    }
    throw error;
  }

  return {
    positional: parsedPositional,
    flags: parsedFlags,
    rawArgv: argv,
  };
}

export function validateCommandInput(name: string, argv: readonly string[]): void {
  if (!isCommandName(name)) {
    throw new Error(`Unknown subcommand: ${name}`);
  }

  const definition = COMMANDS[name];
  const parsed = parseCommandInput(definition, argv);
  definition.validateParsedInput?.(parsed);
}

export async function runCommand(
  context: CommandRuntimeContext,
  name: string,
  argv: readonly string[],
): Promise<void> {
  if (!isCommandName(name)) {
    throw new Error(`Unknown subcommand: ${name}`);
  }

  const def = COMMANDS[name];
  const parsed = parseCommandInput(def, argv);
  def.validateParsedInput?.(parsed);
  await def.execute(context, parsed);
}
