import { projectScopeReadinessReport } from '@libar-dev/architect-projection/projections';
import type { CommandDef, CommandName } from '../pattern-graph-cli-commands.js';
import {
  EmptyFlagsSchema,
  HandoffFlagsSchema,
  ScopeValidateFlagsSchema,
  StringArraySchema,
  parseHandoffSessionTypeValue,
  parseScopeTypeValue,
} from './_shared/schemas.js';
import { normalizeHandoffInput, requireProjectedHandoff } from './_shared/handoff.js';
import { normalizeScopeValidateInput } from './_shared/projection-options.js';
import { requireCliContext } from './_shared/runtime.js';
import { writeProjectionOutput } from './_shared/output.js';
import { writeStructuredResponse } from './_shared/structured.js';

export const planningCommands = {
  'scope-validate': {
    name: 'scope-validate',
    positional: StringArraySchema,
    flags: ScopeValidateFlagsSchema,
    usage:
      'Usage: architect scope-validate <pattern> <design|implement> [--type <design|implement>] [--strict]',
    helpSignature:
      'scope-validate <pattern> <design|implement> [--type <design|implement>] [--strict]',
    helpDetail: {
      examples: [
        'architect scope-validate ConfigurationAPI implement',
        'architect scope-validate ConfigurationAPI --type design --strict',
      ],
    },
    flagParsers: {
      '--strict': {
        kind: 'boolean',
        key: 'strict',
      },
      '--type': {
        kind: 'value',
        key: 'type',
        parse: parseScopeTypeValue,
      },
    },
    execute(context, parsed): void {
      const options = normalizeScopeValidateInput(parsed.positional, parsed.flags);
      writeProjectionOutput(
        context.args,
        projectScopeReadinessReport(requireCliContext(context).projection, {
          pattern: options.pattern,
          sessionType: options.scopeType,
          strict: options.strict,
        }),
      );
    },
  },
  handoff: {
    name: 'handoff',
    positional: StringArraySchema,
    flags: HandoffFlagsSchema,
    usage:
      'Usage: architect handoff --pattern <pattern> [--session planning|design|implement|review] [--modified-file <path>]...',
    helpSignature:
      'handoff --pattern <pattern> [--session planning|design|implement|review] [--modified-file <path>]...',
    helpDetail: {
      examples: [
        'architect handoff --pattern ConfigurationAPI',
        'architect handoff --pattern ConfigurationAPI --session review --modified-file src/index.ts',
      ],
    },
    flagParsers: {
      '--pattern': {
        kind: 'value',
        key: 'pattern',
      },
      '--session': {
        kind: 'value',
        key: 'session',
        parse: parseHandoffSessionTypeValue,
      },
      '--modified-file': {
        kind: 'value',
        key: 'modifiedFiles',
        multiple: true,
      },
    },
    execute(context, parsed): void {
      const options = normalizeHandoffInput(
        parsed.positional,
        parsed.flags,
        context.args.sessionTypeExplicit ? context.args.sessionType : undefined,
      );
      writeProjectionOutput(
        context.args,
        requireProjectedHandoff(requireCliContext(context), options),
      );
    },
  },
  query: {
    name: 'query',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    usage: 'Usage: architect query <method> [args...]',
    helpSignature: 'query <method> [args...]',
    helpDetail: {
      body: [
        'Whitelisted methods:',
        '  No-arg:',
        '    getStatusCounts',
        '    getStatusDistribution',
        '    getCompletionPercentage',
        '    listRoles',
        '    getCurrentWork',
        '    getRoadmapItems',
        '    getCompletedPatterns [limit]',
        '  By pattern name:',
        '    getPattern <name>',
        '    getPatternParseFailure <name>',
        '    getPatternDependencies <name>',
        '    getDependencyContext <name> [maxDepth]',
        '    getPatternRelationships <name>',
        '    getRelatedPatterns <name>',
        '    getApiReferences <name>',
        '    getRulesForPattern <name>',
        '    getPatternDeliverables <name>',
        '  By decision:',
        '    getRulesByDecision <decision>',
        '    getPatternsByDecision <decision>',
        '  Package inventory:',
        '    listPackages',
        '  By role:',
        '    getPatternsByRole <role>',
        '    getRoleInfo <role>',
        '  By status:',
        '    getPatternsByNormalizedStatus <completed|active|planned|candidate>',
        '    getPatternsByStatus <status>',
        '  FSM transitions / protection:',
        '    isValidTransition <from> <to>',
        '    checkTransition <from> <to>',
        '    getValidTransitionsFrom <status>',
        '    getProtectionInfo <status>',
      ],
      examples: [
        'architect query getStatusCounts',
        'architect query getStatusDistribution',
        'architect query getPatternDependencies PatternGraph',
        'architect query isValidTransition roadmap active',
      ],
    },
    treatUnknownFlagsAsPositionals: true,
    execute: async (context, parsed): Promise<void> => {
      await writeStructuredResponse(requireCliContext(context), 'query', parsed.positional);
    },
  },
} satisfies Pick<Record<CommandName, CommandDef>, 'scope-validate' | 'handoff' | 'query'>;
