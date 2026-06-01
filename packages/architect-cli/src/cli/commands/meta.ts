import {
  projectAnnotationCoverage,
  projectSourceInventoryDigest,
} from '@libar-dev/architect-projection';
import {
  collectBusinessRuleProductAreas,
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
  resolveDecisionFilter,
  resolvePackageFilter,
  resolveProductAreaFilter,
} from './_shared/schemas.js';
import {
  assertSingleRuleScopeFilter,
  buildBusinessRuleSetProjectionOptions,
} from './_shared/projection-options.js';
import { requireCliContext } from './_shared/runtime.js';
import { writeJson, writeProjectionOutput } from './_shared/output.js';

export const metaCommands = {
  rules: {
    name: 'rules',
    positional: StringArraySchema,
    flags: RulesFlagsSchema,
    usage:
      'Usage: architect rules [--product-area <name>] [--pattern <name>] [--package <workspace-package-id>] [--feature <path-or-glob>] [--decision <ADR>] [--only-invariants] [--count] [--names-only]',
    helpSignature:
      'rules [--product-area <name>] [--pattern <name>] [--package <workspace-package-id>] [--feature <path-or-glob>] [--decision <ADR>] [--only-invariants] [--count] [--names-only]',
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
      '--decision': {
        kind: 'value',
        key: 'decision',
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
        readonly package?: string;
        readonly decision?: string;
        readonly productArea?: string;
      };
      const cliContext = requireCliContext(context);
      // Reject combined scope filters before resolving any individual value, so
      // the conflict error wins over a per-flag fail-loud (package / decision /
      // product-area).
      assertSingleRuleScopeFilter(parsed.flags);
      let resolvedFlags: Readonly<Record<string, unknown>> = parsed.flags;
      if (flags.package !== undefined) {
        resolvedFlags = {
          ...resolvedFlags,
          package: resolvePackageFilter(cliContext.api.listPackages(), flags.package),
        };
      }
      if (flags.decision !== undefined) {
        resolvedFlags = {
          ...resolvedFlags,
          decision: resolveDecisionFilter(cliContext.api.getPatternGraph(), flags.decision),
        };
      }
      if (flags.productArea !== undefined) {
        resolvedFlags = {
          ...resolvedFlags,
          productArea: resolveProductAreaFilter(
            collectBusinessRuleProductAreas(cliContext.projection),
            flags.productArea,
          ),
        };
      }
      const ruleSet = projectBusinessRuleSet(
        cliContext.projection,
        buildBusinessRuleSetProjectionOptions(resolvedFlags),
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
          `${String(counts.roles)} roles | ${String(counts.metadata)} metadata tags | ${String(counts.aggregation)} aggregation tags | ${String(counts.total)} total\n`,
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
        projectAnnotationCoverage(requireCliContext(context).projection),
      );
    },
  },
} satisfies Pick<Record<CommandName, CommandDef>, 'rules' | 'taxonomy' | 'sources' | 'unannotated'>;
