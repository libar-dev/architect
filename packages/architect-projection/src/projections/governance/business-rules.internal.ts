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
import { projectSingle, type BundleRouting, type ProjectionBundle } from '../../fragments/base.js';
import { type BusinessRule, type BusinessRuleSet } from '../../fragments/governance/index.js';
import { BusinessRuleGroupingSchema } from '../../fragments/governance/supporting.js';
import { filterPattern, filterPatterns } from '../_shared/filter.js';
import {
  buildGroupedRoutedBundle,
  type GroupDescriptor,
} from '../_shared/grouped-routed-bundle.internal.js';

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

type BusinessRuleGrouping = NonNullable<BusinessRuleSetOptions['groupedBy']>;

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

  // Ungrouped: a single flat rule set with no child routing.
  if (groupedBy === undefined) {
    return projectSingle(createBusinessRuleSetRoot(options, rules));
  }

  if (groupedBy === 'phase' && rules.some((rule) => rule.phase === undefined)) {
    throw new ProjectionError(
      'INVALID_SCOPE',
      'Cannot group business rules by phase when one or more projected rules have no phase.',
    );
  }

  return buildGroupedRoutedBundle<BusinessRule, BusinessRuleSet>({
    items: rules,
    groupKey: (rule) => businessRuleGroupKey(rule, groupedBy),
    compareGroups: (left, right) =>
      NUMERIC_BASE_COLLATOR.compare(
        businessRuleGroupFacets(left, groupedBy).sortKey,
        businessRuleGroupFacets(right, groupedBy).sortKey,
      ),
    buildRoot: (items, groups) =>
      createBusinessRuleSetRoot(
        options,
        items,
        businessRuleGroupingEntries(groups, groupedBy),
      ),
    buildGroupChild: (group) => createScopedBusinessRuleSet(group, groupedBy, options),
    buildRouting: businessRuleRouting,
  });
}

function businessRuleRouting(childKeys: readonly string[]): BundleRouting {
  return {
    rootRouteId: createIndexRouteId('business-rules'),
    childRouteIds: Object.fromEntries(
      childKeys.map((key) => [key, createEntityRouteId('business-rules', key)]),
    ),
    childPathStrategy: 'nested',
    anchorStrategy: 'heading-slug',
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

/** The stable child key (and route segment) for a rule under the grouping axis. */
function businessRuleGroupKey(rule: BusinessRule, groupedBy: BusinessRuleGrouping): string {
  switch (groupedBy) {
    case 'package':
      return slugify(rule.package);
    case 'product-area':
      return slugify(rule.productArea ?? DEFAULT_PRODUCT_AREA);
    case 'phase':
      return `phase-${String(rule.phase)}`;
    case 'feature':
      return slugify(rule.feature);
  }
}

/**
 * The group's deterministic ordering key and human-facing label, both derived
 * from its first-seen rule. They coincide for every axis except `phase`, where
 * the sort key is the stable `phase-N` route segment but the label is the bare
 * phase number.
 */
function businessRuleGroupFacets(
  group: GroupDescriptor<BusinessRule>,
  groupedBy: BusinessRuleGrouping,
): { readonly sortKey: string; readonly label: string } {
  const first = group.items[0];
  switch (groupedBy) {
    case 'package': {
      const value = first?.package ?? '';
      return { sortKey: value, label: value };
    }
    case 'product-area': {
      const value = first?.productArea ?? DEFAULT_PRODUCT_AREA;
      return { sortKey: value, label: value };
    }
    case 'phase':
      return { sortKey: group.key, label: String(first?.phase ?? 0) };
    case 'feature': {
      const value = first?.feature ?? '';
      return { sortKey: value, label: value };
    }
  }
}

function createScopedBusinessRuleSet(
  group: GroupDescriptor<BusinessRule>,
  groupedBy: BusinessRuleGrouping,
  options: BusinessRuleSetOptions,
): ScopedRuleSet {
  const rules = [...group.items].sort(compareBusinessRules);
  // Scoped child queries echo their grouping axis; the documentation `scope:'all'`
  // root does not, matching the prior projection's child shape.
  const groupedByField = options.scope === 'all' ? {} : { groupedBy };
  const first = group.items[0];

  switch (groupedBy) {
    case 'package':
      return {
        kind: 'BusinessRuleSet',
        scope: 'package',
        scopeValue: first?.package ?? '',
        rules,
        ...groupedByField,
      };
    case 'product-area':
      return {
        kind: 'BusinessRuleSet',
        scope: 'product-area',
        scopeValue: first?.productArea ?? DEFAULT_PRODUCT_AREA,
        rules,
        ...groupedByField,
      };
    case 'phase':
      return {
        kind: 'BusinessRuleSet',
        scope: 'phase',
        scopeValue: first?.phase ?? 0,
        rules,
        ...groupedByField,
      };
    case 'feature':
      return {
        kind: 'BusinessRuleSet',
        scope: 'feature',
        scopeValue: first?.feature ?? '',
        rules,
        ...groupedByField,
      };
  }
}

function businessRuleGroupingEntries(
  groups: readonly GroupDescriptor<BusinessRule>[],
  groupedBy: BusinessRuleGrouping,
): NonNullable<BusinessRuleSet['groupingEntries']> | undefined {
  if (groups.length === 0) {
    return undefined;
  }

  return groups.map((group) => {
    const sortedRules = [...group.items].sort(compareBusinessRules);
    return {
      childKey: group.key,
      label: businessRuleGroupFacets(group, groupedBy).label,
      ...(groupedBy === 'feature'
        ? { secondaryLabel: sortedRules[0]?.productArea ?? DEFAULT_PRODUCT_AREA }
        : {}),
      featureCount: new Set(group.items.map((rule) => rule.feature)).size,
      ruleCount: group.items.length,
      invariantCount: group.items.filter((rule) => hasText(rule.invariant)).length,
    };
  });
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
