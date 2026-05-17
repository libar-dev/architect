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
