/**
 * @architect
 * @architect-pattern ProjectionFilter
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:_shared
 * @architect-uses ExtractedPattern
 *
 * ## ProjectionFilter - Single Maturity/Status Narrowing Predicate
 *
 * The one place projection-side maturity/status narrowing is expressed:
 * `ProjectionFilter` (optional `maturity[]` + `status[]`) plus `filterPattern` /
 * `filterPatterns` over `ExtractedPattern`. Every projection that narrows its
 * pattern set by maturity or status consults this contract rather than
 * re-deriving the predicate.
 *
 * ### When to Use
 *
 * - Narrowing a projection's `ExtractedPattern` set by maturity or status.
 * - Validating raw filter options against the shared `ProjectionFilterSchema`.
 * - Reusing the canonical maturity/status matching semantics across projections.
 */
import type { ExtractedPattern } from '@libar-dev/architect-core';
import { inferMaturity, MaturitySchema, StatusValueSchema } from '@libar-dev/architect-core';
import { z } from 'zod';

export const MaturityValueSchema = MaturitySchema;
export { StatusValueSchema };

export const ProjectionFilterSchema = z.strictObject({
  maturity: z.array(MaturityValueSchema).min(1).optional(),
  status: z.array(StatusValueSchema).min(1).optional(),
});

export type ProjectionFilter = z.infer<typeof ProjectionFilterSchema>;

export function filterPattern(pattern: ExtractedPattern, filter: ProjectionFilter): boolean {
  return matchesMaturity(pattern, filter.maturity) && matchesStatus(pattern, filter.status);
}

export function filterPatterns(
  patterns: readonly ExtractedPattern[],
  filter: ProjectionFilter | undefined,
): ExtractedPattern[] {
  return filter === undefined
    ? [...patterns]
    : patterns.filter((pattern) => filterPattern(pattern, filter));
}

function matchesMaturity(
  pattern: ExtractedPattern,
  maturity: ProjectionFilter['maturity'],
): boolean {
  return maturity === undefined || maturity.includes(inferMaturity(pattern.status));
}

function matchesStatus(pattern: ExtractedPattern, status: ProjectionFilter['status']): boolean {
  return status === undefined || status.includes(pattern.status);
}
