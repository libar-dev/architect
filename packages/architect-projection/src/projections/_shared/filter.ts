/**
 * @architect-bounded-context:_shared
 */
import type { ExtractedPattern } from '@libar-dev/architect-core';
import { AcceptedStatusSchema, inferMaturity, MaturitySchema } from '@libar-dev/architect-core';
import { z } from 'zod';

export const MaturityValueSchema = MaturitySchema;
export const StatusValueSchema = AcceptedStatusSchema;

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
  filter: ProjectionFilter | undefined
): ExtractedPattern[] {
  return filter === undefined
    ? [...patterns]
    : patterns.filter((pattern) => filterPattern(pattern, filter));
}

function matchesMaturity(
  pattern: ExtractedPattern,
  maturity: ProjectionFilter['maturity']
): boolean {
  return maturity === undefined || maturity.includes(inferMaturity(pattern.status));
}

function matchesStatus(pattern: ExtractedPattern, status: ProjectionFilter['status']): boolean {
  return status === undefined || status.includes(pattern.status);
}
