/**
 * @architect
 * @architect-pattern BusinessRuleReference
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - Defines the minimal `BusinessRuleReference` fragment shape used to point back to the owning route.
 */
import { z } from 'zod';

/**
 * Minimal back-reference from a business rule to the route that owns it —
 * carries the feature, rule name, and owning route id.
 *
 * @architect-shape
 */
export const BusinessRuleReferenceSchema = z.strictObject({
  kind: z.literal('BusinessRuleReference'),
  feature: z.string(),
  ruleName: z.string(),
  ownerRouteId: z.string().min(1),
});

export type BusinessRuleReference = z.infer<typeof BusinessRuleReferenceSchema>;
