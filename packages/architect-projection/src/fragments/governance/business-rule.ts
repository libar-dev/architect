/**
 * @architect
 * @architect-pattern BusinessRule
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - Defines the `BusinessRule` fragment shape for a single governance rule with feature, rule name, verification, and scope metadata.
 *
 * The numeric phase scope was retired per ADR-013.
 */
import { z } from 'zod';

/**
 * A single governance business rule — its owning feature and package, the
 * invariant it enforces, the scenarios that verify it, and optional pattern
 * and product-area scope metadata.
 *
 * @architect-shape
 */
export const BusinessRuleSchema = z.strictObject({
  kind: z.literal('BusinessRule'),
  id: z.string().optional(),
  feature: z.string(),
  ruleName: z.string(),
  package: z.string(),
  invariant: z.string().optional(),
  rationale: z.string().optional(),
  verifiedBy: z.array(z.string()),
  scenarioCount: z.number().int().nonnegative(),
  pattern: z.string().optional(),
  productArea: z.string().optional(),
});

export type BusinessRule = z.infer<typeof BusinessRuleSchema>;
