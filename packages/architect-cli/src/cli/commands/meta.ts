import {
  projectAnnotationCoverage,
  projectSourceInventoryDigest,
} from '@libar-dev/architect-projection';
import {
  projectBusinessRuleSet,
  projectTaxonomyDigest,
  summarizeTaxonomyDigest,
} from '@libar-dev/architect-projection/projections';
import type { CommandDef, CommandName } from '../pattern-graph-cli-commands.js';
import { buildTaxonomyProjectionContext } from '../pattern-graph-cli-runtime.js';
import {
  EmptyFlagsSchema,
  RulesFlagsSchema,
  StringArraySchema,
  TaxonomyFlagsSchema,
} from './_shared/schemas.js';
import { buildBusinessRuleSetProjectionOptions } from './_shared/projection-options.js';
import { requireCliContext } from './_shared/runtime.js';
import { writeJson, writeProjectionOutput } from './_shared/output.js';

export const metaCommands = {
  rules: {
    name: 'rules',
    positional: StringArraySchema,
    flags: RulesFlagsSchema,
    usage:
      'Usage: architect rules [--product-area <name>] [--pattern <name>] [--package <workspace-name>] [--feature <path-or-glob>] [--only-invariants] [--count] [--names-only]',
    helpSignature:
      'rules [--product-area <name>] [--pattern <name>] [--package <workspace-name>] [--feature <path-or-glob>] [--only-invariants] [--count] [--names-only]',
    rejectBareValues: true,
    flagParsers: {
      '--product-area': {
        kind: 'value',
        key: 'productArea',
      },
      '--pattern': {
        kind: 'value',
        key: 'pattern',
      },
      '--package': {
        kind: 'value',
        key: 'package',
      },
      '--feature': {
        kind: 'value',
        key: 'feature',
      },
      '--only-invariants': {
        kind: 'boolean',
        key: 'onlyInvariants',
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
        readonly count?: boolean;
        readonly namesOnly?: boolean;
      };
      const ruleSet = projectBusinessRuleSet(
        requireCliContext(context).projection,
        buildBusinessRuleSetProjectionOptions(parsed.flags)
      );
      if (flags.namesOnly === true) {
        const childRuleSets = Object.values(ruleSet.children) as {
          rules: readonly { ruleName: string }[];
        }[];
        const allRules = [...ruleSet.root.rules, ...childRuleSets.flatMap((child) => child.rules)];
        const names = [...new Set(allRules.map((rule) => rule.ruleName))];
        writeJson(names);
        return;
      }
      if (flags.count === true) {
        writeJson(ruleSet.root.rules.length);
        return;
      }
      writeProjectionOutput(context.args, ruleSet);
    },
  },
  taxonomy: {
    name: 'taxonomy',
    positional: StringArraySchema,
    flags: TaxonomyFlagsSchema,
    helpSignature: 'taxonomy [--count]',
    requiresCliContext: false,
    treatUnknownFlagsAsPositionals: true,
    flagParsers: {
      '--count': {
        kind: 'boolean',
        key: 'count',
      },
    },
    async execute(context, parsed): Promise<void> {
      const projection = await buildTaxonomyProjectionContext(context.args);
      const digest = projectTaxonomyDigest(projection);
      const flags = parsed.flags as { readonly count?: boolean };
      if (flags.count === true) {
        const counts = summarizeTaxonomyDigest(digest.root);
        if (context.args.format === 'json') {
          writeJson(counts);
          return;
        }
        process.stdout.write(
          `${String(counts.roles)} roles | ${String(counts.metadata)} metadata tags | ${String(counts.aggregation)} aggregation tags | ${String(counts.total)} total\n`
        );
        return;
      }
      writeProjectionOutput(context.args, digest);
    },
  },
  sources: {
    name: 'sources',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'sources',
    treatUnknownFlagsAsPositionals: true,
    execute(context): void {
      writeJson(projectSourceInventoryDigest(requireCliContext(context).projection).root.items);
    },
  },
  unannotated: {
    name: 'unannotated',
    positional: StringArraySchema,
    flags: EmptyFlagsSchema,
    helpSignature: 'unannotated',
    treatUnknownFlagsAsPositionals: true,
    execute(context): void {
      writeProjectionOutput(
        context.args,
        projectAnnotationCoverage(requireCliContext(context).projection)
      );
    },
  },
} satisfies Pick<Record<CommandName, CommandDef>, 'rules' | 'taxonomy' | 'sources' | 'unannotated'>;
