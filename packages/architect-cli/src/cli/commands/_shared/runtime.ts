/**
 * @architect
 * @architect-pattern:CLIRuntimeGuards
 * @architect-status:completed
 * @architect-role:utility
 * @architect-bounded-context:cli
 * @architect-uses CLICommandRegistry, CLIContextTypes
 *
 * ## CLIRuntimeGuards — Command Runtime Precondition Guards
 *
 * The narrow guard layer every command handler calls before doing work:
 * asserts the live CLI context is present (`requireCliContext`) and that a
 * required positional argument was supplied (`requireFirstPositional`), with
 * REPL-vs-one-shot-aware error behaviour.
 *
 * **When to Use:** at the top of a command handler, to fail fast on missing
 * context or missing required arguments.
 */

import type { CommandRuntimeContext } from '../../pattern-graph-cli-commands.js';
import type { CliContext } from '../../pattern-graph-cli-types.js';

export function requireCliContext(context: CommandRuntimeContext): CliContext {
  if (context.cli === null) {
    throw new Error('Internal CLI context missing');
  }
  return context.cli;
}

export function requireFirstPositional(
  context: CommandRuntimeContext,
  positional: readonly string[],
  usage: string,
  replUsage = usage,
): string | undefined {
  const value = positional[0];
  if (value !== undefined) {
    return value;
  }
  if (context.mode === 'repl') {
    process.stderr.write(`${replUsage}\n`);
    return undefined;
  }
  throw new Error(usage);
}
