/**
 * @architect
 * @architect-pattern ArchitectureComparison
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const BoundedContextSummarySchema = z.strictObject({
  name: z.string(),
  patternCount: z.number().int().nonnegative(),
  patterns: z.array(z.string()),
  allDependencies: z.array(z.string()),
});

export const IntegrationRelationshipSchema = z.enum(['uses', 'dependsOn']);

export const ArchitectureIntegrationPointSchema = z.strictObject({
  from: z.string(),
  fromContext: z.string(),
  to: z.string(),
  toContext: z.string(),
  relationship: IntegrationRelationshipSchema,
});

export const ArchitectureComparisonSchema = z.strictObject({
  kind: z.literal('ArchitectureComparison'),
  context1: BoundedContextSummarySchema,
  context2: BoundedContextSummarySchema,
  sharedDependencies: z.array(z.string()),
  uniqueToContext1: z.array(z.string()),
  uniqueToContext2: z.array(z.string()),
  integrationPoints: z.array(ArchitectureIntegrationPointSchema),
});

export type BoundedContextSummary = z.infer<typeof BoundedContextSummarySchema>;
export type ArchitectureIntegrationPoint = z.infer<typeof ArchitectureIntegrationPointSchema>;
export type ArchitectureComparison = z.infer<typeof ArchitectureComparisonSchema>;
