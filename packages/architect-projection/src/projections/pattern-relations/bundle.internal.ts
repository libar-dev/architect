/**
 * @architect-bounded-context:pattern-relations
 */
import { getRelationshipsForPattern } from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectionBundle } from '../../fragments/base.js';
import type { BusinessRule } from '../../fragments/governance/index.js';
import type {
  BundleInclude,
  BundleMode,
  BundleScenarioDigest,
  BundleTokenEstimate,
  PatternBundleBlocks,
  PatternBundleEntry,
} from '../../fragments/pattern-relations/pattern-bundle-entry.js';
import {
  BundleIncludeSchema,
  BundleModeSchema,
} from '../../fragments/pattern-relations/pattern-bundle-entry.js';
import { createEntityRouteId, createIndexRouteId } from '../../routing/route-id.js';
import { projectBusinessRuleSet } from '../governance/business-rules.js';

import { requirePattern } from '../_shared/pattern-helpers.internal.js';
import { projectPatternDetail } from './pattern-detail.js';
import { projectPatternSummary } from './pattern-summary.js';
import { resolveParentChildNames } from './pattern-catalog.internal.js';

export const PatternBundleOptionsSchema = z
  .strictObject({
    pattern: z.string(),
    mode: BundleModeSchema.optional(),
    include: z.array(BundleIncludeSchema).min(1).readonly().optional(),
    estimateTokens: z.boolean().optional(),
  })
  .readonly();

export type PatternBundleOptions = z.infer<typeof PatternBundleOptionsSchema>;
export { BundleIncludeSchema, BundleModeSchema };

const DEFAULT_MODE: BundleMode = 'implement';
const MODE_DEFAULT_INCLUDES: Record<BundleMode, readonly BundleInclude[]> = {
  plan: ['docstring', 'open-questions'],
  design: ['docstring', 'rules', 'scenarios', 'open-questions'],
  implement: ['docstring', 'rules', 'scenarios', 'deps', 'open-questions'],
  review: ['rules', 'scenarios', 'deps', 'open-questions'],
};

export function buildPatternBundle(
  context: ProjectionContext,
  options: PatternBundleOptions,
): ProjectionBundle<PatternBundleEntry> {
  const mode = options.mode ?? DEFAULT_MODE;
  const includes = resolveIncludes(options.include, mode);
  const estimateTokens = options.estimateTokens === true;
  requirePattern(context, options.pattern);
  const childNames = [
    ...(resolveParentChildNames(context, options.pattern) ?? new Set<string>()),
  ].sort((left, right) => left.localeCompare(right));

  const children = Object.fromEntries(
    childNames.map((childName) => [
      childName,
      buildBundleEntry(context, childName, 'member', mode, includes, estimateTokens),
    ]),
  ) as Record<string, PatternBundleEntry>;

  const root = buildBundleEntry(context, options.pattern, 'root', mode, includes, estimateTokens, {
    members: childNames,
    memberCount: childNames.length,
  });

  if (estimateTokens) {
    root.bundleTokenEstimate = summarizeTokenEstimates([
      root.tokenEstimate,
      ...Object.values(children).map((entry) => entry.tokenEstimate),
    ]);
  }

  return {
    root,
    children,
    ...(childNames.length > 0
      ? {
          routing: {
            rootRouteId: createIndexRouteId('bundle'),
            childRouteIds: Object.fromEntries(
              childNames.map((childName) => [childName, createEntityRouteId('bundle', childName)]),
            ),
            childPathStrategy: 'nested' as const,
            anchorStrategy: 'heading-slug' as const,
          },
        }
      : {}),
  };
}

function buildBundleEntry(
  context: ProjectionContext,
  patternName: string,
  entryRole: PatternBundleEntry['entryRole'],
  mode: BundleMode,
  includes: readonly BundleInclude[],
  estimateTokens: boolean,
  extra: Partial<Pick<PatternBundleEntry, 'members' | 'memberCount'>> = {},
): PatternBundleEntry {
  const pattern = projectPatternSummary(context, patternName).root;
  const detail = projectPatternDetail(context, patternName).root;
  const relationships = getRelationshipsForPattern(
    context.graph,
    requirePattern(context, patternName),
  );
  const rules =
    includes.includes('rules') || includes.includes('scenarios')
      ? projectBusinessRuleSet(context, {
          scope: 'feature',
          scopeValue: patternName,
        }).root.rules
      : [];
  const blocks: PatternBundleBlocks = {
    ...(includes.includes('docstring') ? { docstring: detail.description ?? '' } : {}),
    ...(includes.includes('rules') ? { rules } : {}),
    ...(includes.includes('scenarios') ? { scenarios: buildScenarioDigests(rules) } : {}),
    ...(includes.includes('deps') ? { deps: relationships } : {}),
    ...(includes.includes('open-questions') ? { openQuestions: detail.openQuestions ?? [] } : {}),
  };
  const entry: PatternBundleEntry = {
    kind: 'PatternBundleEntry',
    entryRole,
    mode,
    includes: [...includes],
    pattern,
    blocks,
    ...extra,
  };

  if (estimateTokens) {
    entry.blockTokenEstimates = includes.map((include) => ({
      include,
      estimate: estimateValue(getBlockValue(blocks, include)),
    }));
    entry.tokenEstimate = estimateValue({ pattern, blocks });
  }

  return entry;
}

function resolveIncludes(
  requested: readonly BundleInclude[] | undefined,
  mode: BundleMode,
): BundleInclude[] {
  const source =
    requested !== undefined && requested.length > 0 ? requested : MODE_DEFAULT_INCLUDES[mode];
  return [...new Set(source)];
}

function buildScenarioDigests(rules: readonly BusinessRule[]): BundleScenarioDigest[] {
  return rules.map((rule) => ({
    ruleName: rule.ruleName,
    scenarios: [...rule.verifiedBy],
    count: rule.scenarioCount,
  }));
}

function getBlockValue(blocks: PatternBundleBlocks, include: BundleInclude): unknown {
  switch (include) {
    case 'docstring':
      return blocks.docstring ?? '';
    case 'rules':
      return blocks.rules ?? [];
    case 'scenarios':
      return blocks.scenarios ?? [];
    case 'deps':
      return blocks.deps ?? {};
    case 'open-questions':
      return blocks.openQuestions ?? [];
  }
}

function summarizeTokenEstimates(
  estimates: readonly (BundleTokenEstimate | undefined)[],
): BundleTokenEstimate {
  const chars = estimates.reduce((sum, estimate) => sum + (estimate?.chars ?? 0), 0);
  return finalizeTokenEstimate(chars);
}

function estimateValue(value: unknown): BundleTokenEstimate {
  const chars = typeof value === 'string' ? value.length : JSON.stringify(value).length;
  return finalizeTokenEstimate(chars);
}

function finalizeTokenEstimate(chars: number): BundleTokenEstimate {
  return {
    method: 'char/4',
    chars,
    tokens: Math.ceil(chars / 4),
  };
}
