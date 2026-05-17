/**
 * @architect-bounded-context:pattern-relations
 */
/**
 * Builds the filtered pattern catalog and its name-resolution helpers for list and search surfaces.
 */

import { AcceptedStatusSchema, findPatternByName, MaturitySchema } from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { PatternCatalog } from '../../fragments/pattern-relations/index.js';

import { filterPatterns } from '../_shared/filter.js';
import { createPatternSummaryFragment } from '../_shared/pattern-helpers.internal.js';

export const PatternCatalogOptionsSchema = z
  .strictObject({
    status: AcceptedStatusSchema.optional(),
    maturity: MaturitySchema.optional(),
    phase: z.number().int().optional(),
    role: z.string().optional(),
    parent: z.string().optional(),
    namesOnly: z.boolean().optional(),
    count: z.boolean().optional(),
  })
  .readonly();

export type PatternCatalogOptions = z.infer<typeof PatternCatalogOptionsSchema>;

export function buildPatternCatalog(
  context: ProjectionContext,
  options: PatternCatalogOptions = {},
): PatternCatalog {
  const canonicalRole = resolveCanonicalRoleFilter(context, options.role);
  const parentChildNames = resolveParentChildNames(context, options.parent);
  const items = filterPatterns(context.graph.patterns, context.projectionFilter)
    .map(createPatternSummaryFragment)
    .filter(
      (summary) =>
        (options.status === undefined || summary.status === options.status) &&
        (options.maturity === undefined || summary.maturity === options.maturity) &&
        (options.phase === undefined || summary.phase === options.phase) &&
        (canonicalRole === undefined || summary.role.toLowerCase() === canonicalRole) &&
        (parentChildNames === undefined || parentChildNames.has(summary.patternName)),
    )
    .sort((left, right) => left.patternName.localeCompare(right.patternName));

  return {
    kind: 'PatternCatalog',
    filters: {
      ...(options.status !== undefined ? { status: options.status } : {}),
      ...(options.maturity !== undefined ? { maturity: options.maturity } : {}),
      ...(options.phase !== undefined ? { phase: options.phase } : {}),
      ...(canonicalRole !== undefined ? { role: canonicalRole } : {}),
      ...(options.parent !== undefined ? { parent: options.parent } : {}),
      namesOnly: options.namesOnly === true,
      count: options.count === true,
    },
    count: items.length,
    names: options.count === true ? [] : items.map((item) => item.patternName),
    items: options.count === true || options.namesOnly === true ? [] : items,
  };
}

export function resolveParentChildNames(
  context: ProjectionContext,
  parent: string | undefined,
): ReadonlySet<string> | undefined {
  if (parent === undefined) {
    return undefined;
  }

  const parentPattern = findPatternByName(context.graph, parent);
  if (parentPattern === undefined) {
    throw new Error(`Parent pattern not found: ${parent}`);
  }

  return new Set(parentPattern.children ?? []);
}

function resolveCanonicalRoleFilter(
  context: ProjectionContext,
  role: string | undefined,
): string | undefined {
  if (role === undefined) {
    return undefined;
  }

  const normalized = role.toLowerCase();
  const definition = context.graph.tagRegistry.roles.find(
    (entry) => entry.tag === normalized || entry.aliases?.includes(normalized) === true,
  );

  return definition?.tag ?? normalized;
}
