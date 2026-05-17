import { projectOverviewDigest, projectStatusDistribution } from '@libar-dev/architect-projection';
import {
  projectDependencyTree,
  projectFileReadingList,
  projectSessionContextBundle,
} from '@libar-dev/architect-projection/projections';
import type { SessionType } from '@libar-dev/architect-core';
import type { CommandDef, CommandName } from '../pattern-graph-cli-commands.js';
import {
  ContextFlagsSchema,
  DepTreeFlagsSchema,
  EmptyFlagsSchema,
  FilesFlagsSchema,
  StringArraySchema,
  parseIntegerValue,
  parseSessionTypeValue,
} from './_shared/schemas.js';
import { requireCliContext, requireFirstPositional } from './_shared/runtime.js';
import { writeProjectionOutput } from './_shared/output.js';
import { writeStructuredResponse } from './_shared/structured.js';

export const reportingCommands = {
  overview: {
    name: 'overview',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'overview',
    treatUnknownFlagsAsPositionals: true,
    execute(context): void {
      writeProjectionOutput(
        context.args,
        projectOverviewDigest(requireCliContext(context).projection),
      );
    },
  },
  status: {
    name: 'status',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'status',
    treatUnknownFlagsAsPositionals: true,
    execute(context): void {
      writeProjectionOutput(
        context.args,
        projectStatusDistribution(requireCliContext(context).projection),
      );
    },
  },
  context: {
    name: 'context',
    positional: StringArraySchema,
    flags: ContextFlagsSchema,
    usage: 'Usage: architect context <pattern> [--session planning|design|implement]',
    helpSignature: 'context <pattern> [--session planning|design|implement]',
    helpDetail: {
      examples: ['architect context ConfigurationAPI --session implement'],
    },
    treatUnknownFlagsAsPositionals: true,
    flagParsers: {
      '--session': {
        kind: 'value',
        key: 'session',
        parse: parseSessionTypeValue,
      },
    },
    execute(context, parsed): void {
      const pattern = requireFirstPositional(
        context,
        parsed.positional,
        'Usage: architect context <pattern> [--session planning|design|implement]',
        'Usage: architect context <pattern>',
      );
      if (pattern === undefined) {
        return;
      }
      const flags = parsed.flags as { readonly session?: SessionType };
      writeProjectionOutput(
        context.args,
        projectSessionContextBundle(requireCliContext(context).projection, {
          patterns: [pattern],
          sessionType: flags.session ?? context.args.sessionType,
        }),
      );
    },
  },
  'dep-tree': {
    name: 'dep-tree',
    positional: StringArraySchema,
    flags: DepTreeFlagsSchema,
    usage: 'Usage: architect dep-tree <pattern> [--depth <n>]',
    helpSignature: 'dep-tree <pattern> [--depth <n>]',
    treatUnknownFlagsAsPositionals: true,
    flagParsers: {
      '--depth': {
        kind: 'value',
        key: 'depth',
        parse: (value) => parseIntegerValue(value, '--depth requires an integer value'),
      },
    },
    execute(context, parsed): void {
      const pattern = requireFirstPositional(
        context,
        parsed.positional,
        'Usage: architect dep-tree <pattern> [--depth <n>]',
        'Usage: architect dep-tree <pattern>',
      );
      if (pattern === undefined) {
        return;
      }
      const flags = parsed.flags as { readonly depth?: number };
      writeProjectionOutput(
        context.args,
        projectDependencyTree(requireCliContext(context).projection, {
          pattern,
          maxDepth: flags.depth ?? context.args.depth,
          includeImplementationDeps: false,
        }),
      );
    },
  },
  files: {
    name: 'files',
    positional: StringArraySchema,
    flags: FilesFlagsSchema,
    usage: 'Usage: architect files <pattern> [--related]',
    helpSignature: 'files <pattern> [--related]',
    helpDetail: {
      examples: ['architect files ConfigurationAPI', 'architect files ConfigurationAPI --related'],
    },
    flagParsers: {
      '--related': {
        kind: 'boolean',
        key: 'related',
      },
    },
    execute(context, parsed): void {
      const usage = 'Usage: architect files <pattern> [--related]';
      if (parsed.positional.length !== 1) {
        throw new Error(usage);
      }
      const [pattern] = parsed.positional;
      if (pattern === undefined) {
        throw new Error(usage);
      }
      const flags = parsed.flags as { readonly related?: boolean };
      const readingList = projectFileReadingList(requireCliContext(context).projection, {
        pattern,
        includeRelated: flags.related === true,
      });
      if (readingList === undefined) {
        throw new Error(`Pattern not found: ${pattern}`);
      }
      writeProjectionOutput(context.args, readingList);
    },
  },
  diagnostics: {
    name: 'diagnostics',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'diagnostics',
    treatUnknownFlagsAsPositionals: true,
    execute: async (context, parsed): Promise<void> => {
      await writeStructuredResponse(requireCliContext(context), 'diagnostics', parsed.positional);
    },
  },
} satisfies Pick<
  Record<CommandName, CommandDef>,
  'overview' | 'status' | 'context' | 'dep-tree' | 'files' | 'diagnostics'
>;
