import {
  findPatternParseFailure,
  fuzzyMatchPatterns,
  type AcceptedStatusValue,
} from '@libar-dev/architect-core';
import {
  ProgressiveDisclosureLevelSchema,
  ProjectionFilterSchema,
  parseAndProjectDocumentationBundle,
  projectPatternDetail,
  projectTagUsage,
  type ProgressiveDisclosureLevel,
  type ProjectionFilter,
} from '@libar-dev/architect-projection';
import {
  projectOpenQuestionList,
  projectPatternBundle,
  projectPatternCatalog,
} from '@libar-dev/architect-projection/projections';
import type { CommandDef, CommandName } from '../pattern-graph-cli-commands.js';
import {
  DocumentationFlagsSchema,
  EmptyFlagsSchema,
  ArchFlagsSchema,
  BundleFlagsSchema,
  ListFlagsSchema,
  OpenQuestionsFlagsSchema,
  StringArraySchema,
  parseBundleIncludeValues,
  parseBundleModeValue,
  parseSchemaValue,
  parseAcceptedStatusValue,
  parseRenderFormatValue,
} from './_shared/schemas.js';
import { requireCliContext, requireFirstPositional } from './_shared/runtime.js';
import { writeJson, writeProjectionOutput } from './_shared/output.js';
import { validateStructuredCommandArgs, writeStructuredResponse } from './_shared/structured.js';

type ReadCommandName =
  | 'pattern'
  | 'documentation'
  | 'bundle'
  | 'list'
  | 'open-questions'
  | 'search'
  | 'arch'
  | 'tags';

function formatPatternParseFailure(failure: {
  readonly kind: string;
  readonly path: string;
  readonly message: string;
}): string {
  return [
    'Pattern source failed to parse.',
    `kind: ${failure.kind}`,
    `path: ${failure.path}`,
    `message: ${failure.message}`,
  ].join('\n');
}

function parseDisclosureLevel(value: string): ProgressiveDisclosureLevel {
  return parseSchemaValue(ProgressiveDisclosureLevelSchema, value, '--disclosure');
}

function parseFilterValue(value: string): ProjectionFilter {
  const separatorIndex = value.indexOf('=');
  if (separatorIndex <= 0) {
    throw new Error('--filter requires <status>=<csv>');
  }

  const axis = value.slice(0, separatorIndex);
  const tokens = value
    .slice(separatorIndex + 1)
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return parseSchemaValue(ProjectionFilterSchema, { [axis]: tokens }, '--filter');
}

function mergeProjectionFilter(filters: readonly ProjectionFilter[]): ProjectionFilter | undefined {
  if (filters.length === 0) {
    return undefined;
  }

  return parseSchemaValue(
    ProjectionFilterSchema,
    filters.reduce<ProjectionFilter>(
      (merged, next) => ({
        ...(merged.status !== undefined || next.status !== undefined
          ? { status: [...(merged.status ?? []), ...(next.status ?? [])] }
          : {}),
      }),
      {},
    ),
    '--filter',
  );
}

export const readCommands: Pick<Record<CommandName, CommandDef>, ReadCommandName> = {
  pattern: {
    name: 'pattern',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'pattern <name>',
    treatUnknownFlagsAsPositionals: true,
    execute(context, parsed): void {
      const pattern = requireFirstPositional(
        context,
        parsed.positional,
        'Usage: architect pattern <name>',
      );
      if (pattern === undefined) {
        return;
      }
      const cliContext = requireCliContext(context);
      if (cliContext.api.getPattern(pattern) === undefined) {
        const parseFailure = findPatternParseFailure(cliContext.graph, pattern);
        if (parseFailure !== undefined) {
          throw new Error(formatPatternParseFailure(parseFailure));
        }
      }
      writeProjectionOutput(context.args, projectPatternDetail(cliContext.projection, pattern));
    },
  },
  documentation: {
    name: 'documentation',
    positional: StringArraySchema,
    flags: DocumentationFlagsSchema,
    usage:
      'Usage: architect documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...',
    helpSignature:
      'documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...',
    treatUnknownFlagsAsPositionals: true,
    flagParsers: {
      '--disclosure': {
        kind: 'value',
        key: 'disclosure',
        parse: parseDisclosureLevel,
      },
      '--filter': {
        kind: 'value',
        key: 'filters',
        parse: parseFilterValue,
        multiple: true,
      },
    },
    execute(context, parsed): void {
      const documentType = requireFirstPositional(
        context,
        parsed.positional,
        'Usage: architect documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...',
      );
      if (documentType === undefined) {
        return;
      }

      const flags = parsed.flags as {
        readonly disclosure?: ProgressiveDisclosureLevel;
        readonly filters?: readonly ProjectionFilter[];
      };
      const projectionFilter = mergeProjectionFilter(flags.filters ?? []);
      const cliContext = requireCliContext(context);
      writeProjectionOutput(
        context.args,
        parseAndProjectDocumentationBundle(
          projectionFilter === undefined
            ? cliContext.projection
            : { ...cliContext.projection, projectionFilter },
          {
            documentType,
            ...(flags.disclosure !== undefined ? { disclosureLevel: flags.disclosure } : {}),
          },
        ),
      );
    },
  },
  bundle: {
    name: 'bundle',
    positional: StringArraySchema,
    flags: BundleFlagsSchema,
    usage:
      'Usage: architect bundle <pattern> [--mode <plan|design|implement|review>] [--include <block[,block...]>] [--estimate-tokens]',
    helpSignature:
      'bundle <pattern> [--mode <plan|design|implement|review>] [--include <block[,block...]>] [--estimate-tokens]',
    helpDetail: {
      body: [
        'Include blocks: rules, scenarios, deps, open-questions, docstring',
        'Mode default include sets are used only when --include is omitted.',
        'Token estimation is heuristic in this wave: chars / 4.',
      ],
      examples: [
        'architect bundle ParentEpic --include rules,scenarios,deps,open-questions --format json',
        'architect bundle ParentEpic --mode implement --estimate-tokens --format json',
      ],
    },
    treatUnknownFlagsAsPositionals: true,
    flagParsers: {
      '--mode': {
        kind: 'value',
        key: 'mode',
        parse: parseBundleModeValue,
      },
      '--include': {
        kind: 'value',
        key: 'include',
        parse: parseBundleIncludeValues,
        multiple: true,
      },
      '--estimate-tokens': {
        kind: 'boolean',
        key: 'estimateTokens',
      },
    },
    execute(context, parsed): void {
      const pattern = requireFirstPositional(
        context,
        parsed.positional,
        'Usage: architect bundle <pattern> [--mode <plan|design|implement|review>] [--include <block[,block...]>] [--estimate-tokens]',
      );
      if (pattern === undefined) {
        return;
      }

      const flags = parsed.flags as {
        readonly mode?: 'plan' | 'design' | 'implement' | 'review';
        readonly include?: readonly (
          | 'rules'
          | 'scenarios'
          | 'deps'
          | 'open-questions'
          | 'docstring'
        )[];
        readonly estimateTokens?: boolean;
      };

      writeProjectionOutput(
        context.args,
        projectPatternBundle(requireCliContext(context).projection, {
          pattern,
          ...(flags.mode !== undefined ? { mode: flags.mode } : {}),
          ...(flags.include !== undefined && flags.include.length > 0
            ? { include: flags.include }
            : {}),
          estimateTokens: flags.estimateTokens === true,
        }),
      );
    },
  },
  list: {
    name: 'list',
    positional: StringArraySchema,
    flags: ListFlagsSchema,
    usage:
      'Usage: architect list [--status <value>] [--role <tag>] [--parent <PatternName>] [--package <workspace-name>] [--count] [--names-only]',
    helpSignature:
      'list [--status <value>] [--role <tag>] [--parent <PatternName>] [--package <workspace-name>] [--count] [--names-only]',
    rejectBareValues: true,
    flagParsers: {
      '--status': {
        kind: 'value',
        key: 'status',
        parse: parseAcceptedStatusValue,
      },
      '--role': {
        kind: 'value',
        key: 'role',
      },
      '--parent': {
        kind: 'value',
        key: 'parent',
      },
      '--package': {
        kind: 'value',
        key: 'package',
      },
      '--count': {
        kind: 'boolean',
        key: 'count',
      },
      '--names-only': {
        kind: 'boolean',
        key: 'namesOnly',
      },
    },
    execute(context, parsed): void {
      const flags = parsed.flags as {
        readonly status?: AcceptedStatusValue;
        readonly role?: string;
        readonly parent?: string;
        readonly package?: string;
        readonly count?: boolean;
        readonly namesOnly?: boolean;
      };
      const catalog = projectPatternCatalog(requireCliContext(context).projection, {
        ...(flags.status !== undefined ? { status: flags.status } : {}),
        ...(flags.role !== undefined ? { role: flags.role } : {}),
        ...(flags.parent !== undefined ? { parent: flags.parent } : {}),
        ...(flags.package !== undefined ? { package: flags.package } : {}),
        count: flags.count === true,
        namesOnly: flags.namesOnly === true,
      }).root;
      if (flags.count === true) {
        writeJson(catalog.count);
      } else if (flags.namesOnly === true) {
        writeJson(catalog.names);
      } else {
        writeJson(catalog.items);
      }
    },
  },
  'open-questions': {
    name: 'open-questions',
    positional: StringArraySchema,
    flags: OpenQuestionsFlagsSchema,
    usage: 'Usage: architect open-questions [--parent <PatternName>] [--format compact|json]',
    helpSignature: 'open-questions [--parent <PatternName>]',
    rejectBareValues: true,
    flagParsers: {
      '--parent': {
        kind: 'value',
        key: 'parent',
      },
      '--format': {
        kind: 'value',
        key: 'format',
        parse: parseRenderFormatValue,
      },
    },
    execute(context, parsed): void {
      const flags = parsed.flags as {
        readonly parent?: string;
        readonly format?: 'compact' | 'json';
      };
      writeProjectionOutput(
        flags.format === undefined ? context.args : { ...context.args, format: flags.format },
        projectOpenQuestionList(requireCliContext(context).projection, {
          ...(flags.parent !== undefined ? { parent: flags.parent } : {}),
        }),
      );
    },
  },
  search: {
    name: 'search',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'search <query>',
    treatUnknownFlagsAsPositionals: true,
    execute(context, parsed): void {
      const query = requireFirstPositional(
        context,
        parsed.positional,
        'Usage: architect search <query>',
      );
      if (query === undefined) {
        return;
      }
      const catalog = projectPatternCatalog(requireCliContext(context).projection).root;
      writeJson(fuzzyMatchPatterns(query, catalog.names));
    },
  },
  arch: {
    name: 'arch',
    positional: StringArraySchema,
    flags: ArchFlagsSchema,
    usage:
      'Usage: architect arch roles|bounded-context [name]|neighborhood <pattern>|graph|compare <bounded-context-a> <bounded-context-b>|coverage|dangling [--baseline <path>] [--write-baseline] [--strict]|orphans|blocking|packages [name]',
    helpSignature:
      'arch roles|bounded-context [name]|neighborhood <pattern>|graph|compare <bounded-context-a> <bounded-context-b>|coverage|dangling [--baseline <path>] [--write-baseline] [--strict]|orphans|blocking|packages [name]',
    flagParsers: {
      '--baseline': {
        kind: 'value',
        key: 'baseline',
      },
      '--write-baseline': {
        kind: 'boolean',
        key: 'writeBaseline',
      },
      '--strict': {
        kind: 'boolean',
        key: 'strict',
      },
    },
    validateParsedInput(parsed): void {
      validateStructuredCommandArgs('arch', parsed.positional, parsed.flags);
    },
    execute: async (context, parsed): Promise<void> => {
      await writeStructuredResponse(
        requireCliContext(context),
        'arch',
        parsed.positional,
        parsed.flags,
      );
    },
  },
  tags: {
    name: 'tags',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'tags',
    treatUnknownFlagsAsPositionals: true,
    execute(context): void {
      writeProjectionOutput(context.args, projectTagUsage(requireCliContext(context).projection));
    },
  },
};
export {};
