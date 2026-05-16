import type { CommandDef, CommandName } from '../pattern-graph-cli-commands.js';
import { printGlobalHelp, printReplHelp, printVersion } from './_shared/help.js';
import { EmptyFlagsSchema, StringArraySchema } from './_shared/schemas.js';

export const lifecycleCommands = {
  repl: {
    name: 'repl',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'repl',
    requiresCliContext: false,
    treatUnknownFlagsAsPositionals: true,
    execute: async (context): Promise<void> => {
      if (context.mode === 'repl') {
        return;
      }
      await context.services.runRepl(context.args);
    },
  },
  help: {
    name: 'help',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'help',
    requiresCliContext: false,
    treatUnknownFlagsAsPositionals: true,
    execute(context): void {
      if (context.mode === 'repl') {
        printReplHelp();
        return;
      }
      printGlobalHelp();
    },
  },
  version: {
    name: 'version',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'version',
    requiresCliContext: false,
    treatUnknownFlagsAsPositionals: true,
    execute(): void {
      printVersion();
    },
  },
} satisfies Pick<Record<CommandName, CommandDef>, 'repl' | 'help' | 'version'>;
