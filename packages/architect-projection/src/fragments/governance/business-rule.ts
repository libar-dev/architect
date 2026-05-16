/**
 * @architect
 * @architect-pattern BusinessRule
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

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
  phase: z.number().int().optional(),
  productArea: z.string().optional(),
});

export type BusinessRule = z.infer<typeof BusinessRuleSchema>;
