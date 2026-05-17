/**
 * @architect-bounded-context:governance
 */
/**
 * Builds governance business-rule fragments and sets from extracted patterns and annotation metadata.
 */

import type { ExtractedPattern } from '@libar-dev/architect-core';
import { findPatternByName } from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import { ProjectionError } from '../errors.js';
import { type ProjectionBundle } from '../../fragments/base.js';
import { type BusinessRule, type BusinessRuleSet } from '../../fragments/governance/index.js';
import { BusinessRuleGroupingSchema } from '../../fragments/governance/supporting.js';
import { filterPattern, filterPatterns } from '../_shared/filter.js';

import {
  getPatternName,
  normalizeAnnotationText,
  normalizeLineEndings,
  slugify,
} from './governance-shared.internal.js';
import { createEntityRouteId, createIndexRouteId } from '../../routing/route-id.js';

type ExtractedRule = NonNullable<ExtractedPattern['rules']>[number];

type ScopedRuleSet =
  | Extract<BusinessRuleSet, { scope: 'package' }>
  | Extract<BusinessRuleSet, { scope: 'product-area' }>
  | Extract<BusinessRuleSet, { scope: 'phase' }>
  | Extract<BusinessRuleSet, { scope: 'feature' }>;

interface GroupedBusinessRuleChild {
  readonly key: string;
  readonly sortKey: string;
  readonly root: ScopedRuleSet;
}

interface BusinessRuleAnnotations {
  readonly invariant?: string;
  readonly rationale?: string;
  readonly verifiedBy?: readonly string[];
}

export const BusinessRuleSetOptionsSchema = z
  .discriminatedUnion('scope', [
    z.strictObject({
      scope: z.literal('all'),
      groupedBy: BusinessRuleGroupingSchema.optional(),
      onlyInvariants: z.boolean().optional(),
    }),
    z.strictObject({
      scope: z.literal('package'),
      scopeValue: z.string(),
      groupedBy: BusinessRuleGroupingSchema.optional(),
      onlyInvariants: z.boolean().optional(),
    }),
    z.strictObject({
      scope: z.literal('product-area'),
      scopeValue: z.string(),
      groupedBy: BusinessRuleGroupingSchema.optional(),
      onlyInvariants: z.boolean().optional(),
    }),
    z.strictObject({
      scope: z.literal('phase'),
      scopeValue: z.number().int(),
      groupedBy: BusinessRuleGroupingSchema.optional(),
      onlyInvariants: z.boolean().optional(),
    }),
    z.strictObject({
      scope: z.literal('feature'),
      scopeValue: z.string(),
      featureMatch: z.enum(['name', 'path']).optional(),
      groupedBy: BusinessRuleGroupingSchema.optional(),
      onlyInvariants: z.boolean().optional(),
    }),
  ])
  .readonly();

export type BusinessRuleSetOptions = z.infer<typeof BusinessRuleSetOptionsSchema>;

const DEFAULT_PRODUCT_AREA = 'Platform';
const BUSINESS_RULE_ANNOTATION_PATTERN =
  /\*\*(Invariant|Rationale|Verified by):\*\*\s*([\s\S]*?)(?=\n\s*\*\*[A-Za-z][^*]*:\*\*|$)/gi;
const BASE_COLLATOR = new Intl.Collator(undefined, { sensitivity: 'base' });
const NUMERIC_BASE_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export function buildBusinessRule(
  context: ProjectionContext,
  feature: string,
  ruleName: string,
): BusinessRule | undefined {
  const pattern = requirePatternByName(context, feature);

  if (context.projectionFilter !== undefined && !filterPattern(pattern, context.projectionFilter)) {
    return undefined;
  }

  const rule = (pattern.rules ?? []).find(
    (entry) => entry.name.toLowerCase() === ruleName.toLowerCase(),
  );

  if (rule === undefined) {
    throw new ProjectionError(
      'RULE_NOT_FOUND',
      `Business rule not found: "${ruleName}" in feature "${getPatternName(pattern)}".`,
    );
  }

  return createBusinessRuleFragment(context, pattern, rule);
}

export function buildBusinessRuleSet(
  context: ProjectionContext,
  options: BusinessRuleSetOptions = { scope: 'all' },
): ProjectionBundle<BusinessRuleSet> {
  const groupedBy = options.groupedBy;
  const rules = filterBusinessRules(collectBusinessRules(context, options), options);
  const groupedChildren =
    groupedBy === undefined ? [] : createBusinessRuleChildren(rules, groupedBy, options);
  const root = createBusinessRuleSetRoot(
    options,
    rules,
    groupedBy === undefined
      ? undefined
      : createBusinessRuleGroupingEntries(groupedChildren, groupedBy),
  );
  const children = Object.fromEntries(
    groupedChildren.map(({ key, root: childRoot }) => [key, childRoot]),
  );

  return {
    root,
    children,
    ...(Object.keys(children).length > 0
      ? {
          routing: {
            rootRouteId: createIndexRouteId('business-rules'),
            childRouteIds: Object.fromEntries(
              groupedChildren.map(({ key }) => [key, createEntityRouteId('business-rules', key)]),
            ),
            childPathStrategy: 'nested' as const,
            anchorStrategy: 'heading-slug' as const,
          },
        }
      : {}),
  };
}

function collectBusinessRules(
  context: ProjectionContext,
  options: BusinessRuleSetOptions,
): BusinessRule[] {
  return filterPatterns(context.graph.patterns, context.projectionFilter)
    .filter((pattern) => (pattern.rules?.length ?? 0) > 0)
    .filter((pattern) => patternMatchesRuleSetScope(context, pattern, options))
    .flatMap((pattern) =>
      (pattern.rules ?? []).map((rule) => createBusinessRuleFragment(context, pattern, rule)),
    )
    .filter((rule) => options.onlyInvariants !== true || rule.invariant !== undefined)
    .sort(compareBusinessRules);
}

function patternMatchesRuleSetScope(
  context: ProjectionContext,
  pattern: ExtractedPattern,
  options: BusinessRuleSetOptions,
): boolean {
  if (options.scope === 'package') {
    const canonicalPackageName = inferWorkspacePackageName(pattern.source.file);
    if (canonicalPackageName !== undefined) {
      return canonicalPackageName === options.scopeValue;
    }
    const packageId = context.packageResolver(pattern.source.file).id;
    return packageId.startsWith('@') && packageId === options.scopeValue;
  }

  if (options.scope === 'feature' && options.featureMatch === 'path') {
    return matchesFeaturePath(pattern.source.file, options.scopeValue);
  }

  return true;
}

function createBusinessRuleFragment(
  context: ProjectionContext,
  pattern: ExtractedPattern,
  rule: ExtractedRule,
): BusinessRule {
  const annotations = parseBusinessRuleAnnotations(rule.description);

  return {
    kind: 'BusinessRule',
    feature: getPatternName(pattern),
    ruleName: rule.name,
    package: context.packageResolver(pattern.source.file).id,
    ...(annotations.invariant !== undefined ? { invariant: annotations.invariant } : {}),
    ...(annotations.rationale !== undefined ? { rationale: annotations.rationale } : {}),
    verifiedBy: deduplicateScenarioNames(rule.scenarioNames, annotations.verifiedBy),
    scenarioCount: rule.scenarioCount,
    pattern: getPatternName(pattern),
    ...(pattern.phase !== undefined ? { phase: pattern.phase } : {}),
    productArea: pattern.productArea ?? DEFAULT_PRODUCT_AREA,
  };
}

function filterBusinessRules(
  rules: readonly BusinessRule[],
  options: BusinessRuleSetOptions,
): BusinessRule[] {
  switch (options.scope) {
    case 'all':
      return [...rules];
    case 'product-area':
      return rules.filter(
        (rule) => rule.productArea?.toLowerCase() === options.scopeValue.toLowerCase(),
      );
    case 'package':
      return [...rules];
    case 'phase':
      return rules.filter((rule) => rule.phase === options.scopeValue);
    case 'feature':
      if (options.featureMatch === 'path') {
        return [...rules];
      }
      return rules.filter(
        (rule) => rule.feature.toLowerCase() === options.scopeValue.toLowerCase(),
      );
  }
}

function createBusinessRuleSetRoot(
  options: BusinessRuleSetOptions,
  rules: readonly BusinessRule[],
  groupingEntries?: BusinessRuleSet['groupingEntries'],
): BusinessRuleSet {
  switch (options.scope) {
    case 'all':
      return {
        kind: 'BusinessRuleSet',
        scope: 'all',
        rules: [...rules],
        ...(options.groupedBy !== undefined ? { groupedBy: options.groupedBy } : {}),
        ...(groupingEntries !== undefined ? { groupingEntries } : {}),
      };
    case 'package':
      return {
        kind: 'BusinessRuleSet',
        scope: 'package',
        scopeValue: options.scopeValue,
        rules: [...rules],
        ...(options.groupedBy !== undefined ? { groupedBy: options.groupedBy } : {}),
        ...(groupingEntries !== undefined ? { groupingEntries } : {}),
      };
    case 'product-area':
      return {
        kind: 'BusinessRuleSet',
        scope: 'product-area',
        scopeValue: options.scopeValue,
        rules: [...rules],
        ...(options.groupedBy !== undefined ? { groupedBy: options.groupedBy } : {}),
        ...(groupingEntries !== undefined ? { groupingEntries } : {}),
      };
    case 'phase':
      return {
        kind: 'BusinessRuleSet',
        scope: 'phase',
        scopeValue: options.scopeValue,
        rules: [...rules],
        ...(options.groupedBy !== undefined ? { groupedBy: options.groupedBy } : {}),
        ...(groupingEntries !== undefined ? { groupingEntries } : {}),
      };
    case 'feature':
      return {
        kind: 'BusinessRuleSet',
        scope: 'feature',
        scopeValue: options.scopeValue,
        rules: [...rules],
        ...(options.groupedBy !== undefined ? { groupedBy: options.groupedBy } : {}),
        ...(groupingEntries !== undefined ? { groupingEntries } : {}),
      };
  }
}

function createBusinessRuleChildren(
  rules: readonly BusinessRule[],
  groupedBy: NonNullable<BusinessRuleSetOptions['groupedBy']>,
  options: BusinessRuleSetOptions,
): GroupedBusinessRuleChild[] {
  if (groupedBy === 'phase' && rules.some((rule) => rule.phase === undefined)) {
    throw new ProjectionError(
      'INVALID_SCOPE',
      'Cannot group business rules by phase when one or more projected rules have no phase.',
    );
  }

  const grouped = new Map<string, { root: ScopedRuleSet; sortKey: string }>();

  for (const rule of rules) {
    if (groupedBy === 'package') {
      const key = slugify(rule.package);
      const existing = grouped.get(key);
      if (existing === undefined) {
        grouped.set(key, {
          sortKey: rule.package,
          root: {
            kind: 'BusinessRuleSet',
            scope: 'package',
            scopeValue: rule.package,
            rules: [rule],
            ...(options.scope === 'all' ? {} : { groupedBy }),
          },
        });
      } else {
        existing.root.rules.push(rule);
      }
      continue;
    }

    if (groupedBy === 'product-area') {
      const area = rule.productArea ?? DEFAULT_PRODUCT_AREA;
      const key = slugify(area);
      const existing = grouped.get(key);
      if (existing === undefined) {
        grouped.set(key, {
          sortKey: area,
          root: {
            kind: 'BusinessRuleSet',
            scope: 'product-area',
            scopeValue: area,
            rules: [rule],
            ...(options.scope === 'all' ? {} : { groupedBy }),
          },
        });
      } else {
        existing.root.rules.push(rule);
      }
      continue;
    }

    if (groupedBy === 'phase' && rule.phase !== undefined) {
      const key = `phase-${String(rule.phase)}`;
      const existing = grouped.get(key);
      if (existing === undefined) {
        grouped.set(key, {
          sortKey: key,
          root: {
            kind: 'BusinessRuleSet',
            scope: 'phase',
            scopeValue: rule.phase,
            rules: [rule],
            ...(options.scope === 'all' ? {} : { groupedBy }),
          },
        });
      } else {
        existing.root.rules.push(rule);
      }
      continue;
    }

    if (groupedBy === 'feature') {
      const key = slugify(rule.feature);
      const existing = grouped.get(key);
      if (existing === undefined) {
        grouped.set(key, {
          sortKey: rule.feature,
          root: {
            kind: 'BusinessRuleSet',
            scope: 'feature',
            scopeValue: rule.feature,
            rules: [rule],
            ...(options.scope === 'all' ? {} : { groupedBy }),
          },
        });
      } else {
        existing.root.rules.push(rule);
      }
    }
  }

  return [...grouped.entries()]
    .sort((left, right) => NUMERIC_BASE_COLLATOR.compare(left[1].sortKey, right[1].sortKey))
    .map(([key, value]) => ({
      key,
      sortKey: value.sortKey,
      root: {
        ...value.root,
        rules: [...value.root.rules].sort(compareBusinessRules),
        ...(options.scope === 'all' ? {} : { groupedBy }),
      },
    }));
}

function createBusinessRuleGroupingEntries(
  children: readonly GroupedBusinessRuleChild[],
  groupedBy: NonNullable<BusinessRuleSetOptions['groupedBy']>,
): NonNullable<BusinessRuleSet['groupingEntries']> | undefined {
  if (children.length === 0) {
    return undefined;
  }

  return children.map(({ key, root }) => ({
    childKey: key,
    label: getBusinessRuleSetScopeValue(root),
    ...(groupedBy === 'feature'
      ? { secondaryLabel: root.rules[0]?.productArea ?? DEFAULT_PRODUCT_AREA }
      : {}),
    featureCount: new Set(root.rules.map((rule) => rule.feature)).size,
    ruleCount: root.rules.length,
    invariantCount: root.rules.filter((rule) => hasText(rule.invariant)).length,
  }));
}

function compareBusinessRules(left: BusinessRule, right: BusinessRule): number {
  return (
    [
      BASE_COLLATOR.compare(
        left.productArea ?? DEFAULT_PRODUCT_AREA,
        right.productArea ?? DEFAULT_PRODUCT_AREA,
      ),
      (left.phase ?? Number.MAX_SAFE_INTEGER) - (right.phase ?? Number.MAX_SAFE_INTEGER),
      BASE_COLLATOR.compare(left.feature, right.feature),
      BASE_COLLATOR.compare(left.ruleName, right.ruleName),
    ].find((value) => value !== 0) ?? 0
  );
}

function inferWorkspacePackageName(sourceFile: string): string | undefined {
  const normalized = normalizePosixPath(sourceFile);
  const packageSegment =
    /(?:^|\/)packages\/(architect(?:-[^/]+)?)\//u.exec(normalized)?.[1] ??
    /^\.\.\/(architect(?:-[^/]+)?)\//u.exec(normalized)?.[1];

  if (packageSegment === undefined) {
    return undefined;
  }

  return packageSegment === 'architect'
    ? '@libar-dev/architect-dev'
    : `@libar-dev/${packageSegment}`;
}

function matchesFeaturePath(sourceFile: string, filter: string): boolean {
  const candidatePaths = getFeaturePathCandidates(sourceFile);
  const normalizedFilter = normalizePosixPath(filter);

  if (!containsGlobToken(normalizedFilter)) {
    return candidatePaths.includes(normalizedFilter);
  }

  const filterPattern = globToRegExp(normalizedFilter);
  return candidatePaths.some((candidate) => filterPattern.test(candidate));
}

function getFeaturePathCandidates(sourceFile: string): string[] {
  const normalizedSource = normalizePosixPath(sourceFile);
  const candidates = [normalizedSource];

  if (normalizedSource.startsWith('../')) {
    candidates.push(`packages/${normalizedSource.slice('../'.length)}`);
  }

  return [...new Set(candidates)];
}

function normalizePosixPath(value: string): string {
  return value.split('\\').join('/').replace(/^\.\//u, '');
}

function containsGlobToken(value: string): boolean {
  return /[*?[]/u.test(value);
}

function globToRegExp(glob: string): RegExp {
  let pattern = '^';

  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];

    if (char === '*' && next === '*') {
      pattern += '.*';
      index += 1;
      continue;
    }

    if (char === '*') {
      pattern += '[^/]*';
      continue;
    }

    if (char === '?') {
      pattern += '[^/]';
      continue;
    }

    pattern += escapeRegExp(char ?? '');
  }

  return new RegExp(`${pattern}$`, 'u');
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/gu, '\\$&');
}

function requirePatternByName(context: ProjectionContext, feature: string): ExtractedPattern {
  const pattern = findPatternByName(context.graph, feature);
  if (pattern !== undefined) {
    return pattern;
  }

  throw new ProjectionError('RULE_NOT_FOUND', `Feature not found: "${feature}".`);
}

function getBusinessRuleSetScopeValue(fragment: ScopedRuleSet): string {
  switch (fragment.scope) {
    case 'package':
    case 'product-area':
    case 'feature':
    case 'phase':
      return String(fragment.scopeValue);
  }
}

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

function parseBusinessRuleAnnotations(description: string): BusinessRuleAnnotations {
  if (!description || description.trim().length === 0) {
    return {};
  }

  const annotations: {
    invariant?: string;
    rationale?: string;
    verifiedBy?: string[];
  } = {};

  for (const match of normalizeLineEndings(description).matchAll(
    BUSINESS_RULE_ANNOTATION_PATTERN,
  )) {
    const label = match[1]?.toLowerCase();
    const rawValue = match[2] ?? '';

    if (label === 'verified by') {
      const verifiedBy = rawValue
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (verifiedBy.length > 0) {
        annotations.verifiedBy = verifiedBy;
      }
      continue;
    }

    const normalizedValue = normalizeAnnotationText(rawValue);
    if (!normalizedValue) {
      continue;
    }

    if (label === 'invariant') {
      annotations.invariant = normalizedValue;
    } else if (label === 'rationale') {
      annotations.rationale = normalizedValue;
    }
  }

  return annotations;
}

function deduplicateScenarioNames(
  scenarioNames: readonly string[],
  verifiedBy: readonly string[] | undefined,
): string[] {
  const seen = new Map<string, string>();

  for (const name of scenarioNames) {
    const key = name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, name);
    }
  }

  if (verifiedBy !== undefined) {
    for (const name of verifiedBy) {
      const key = name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, name);
      }
    }
  }

  return [...seen.values()];
}
