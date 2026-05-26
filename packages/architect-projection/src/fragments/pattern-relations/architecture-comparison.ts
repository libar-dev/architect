/**
 * @architect
 * @architect-pattern ArchitectureComparison
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `ArchitectureComparison` fragment shape for side-by-side bounded-context comparisons, including shared/unique dependencies and integration points.
 */
import { z } from 'zod';

/**
 * A compact summary of one bounded context — its name, pattern count, member
 * patterns, and the full set of dependencies it draws on.
 *
 * @architect-shape
 */
export const BoundedContextSummarySchema = z.strictObject({
  name: z.string(),
  patternCount: z.number().int().nonnegative(),
  patterns: z.array(z.string()),
  allDependencies: z.array(z.string()),
});

/**
 * The kind of relationship that links two patterns across bounded contexts.
 *
 * @architect-shape
 */
export const IntegrationRelationshipSchema = z.enum(['uses', 'dependsOn']);

/**
 * One cross-context integration point — the source and target patterns, their
 * respective contexts, and the relationship that connects them.
 *
 * @architect-shape
 */
export const ArchitectureIntegrationPointSchema = z.strictObject({
  from: z.string(),
  fromContext: z.string(),
  to: z.string(),
  toContext: z.string(),
  relationship: IntegrationRelationshipSchema,
});

/**
 * A side-by-side comparison of two bounded contexts — their summaries, the
 * dependencies they share or hold uniquely, and the integration points between
 * them.
 *
 * @architect-shape
 */
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
