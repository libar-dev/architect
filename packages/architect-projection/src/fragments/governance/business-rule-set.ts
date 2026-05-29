/**
 * @architect
 * @architect-pattern BusinessRuleSet
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - Defines the `BusinessRuleSet` fragment shape for a scoped collection of business rules, including optional grouping metadata.
 */
import { z } from 'zod';

import { BusinessRuleSchema } from './business-rule.js';
import { BusinessRuleGroupingSchema } from './supporting.js';

const BusinessRuleGroupingEntrySchema = z.strictObject({
  childKey: z.string(),
  label: z.string(),
  secondaryLabel: z.string().optional(),
  featureCount: z.number().int().nonnegative(),
  ruleCount: z.number().int().nonnegative(),
  invariantCount: z.number().int().nonnegative(),
});

/**
 * A scoped collection of business rules — discriminated on `scope` (all,
 * product-area, phase, feature, package, or decision) with optional grouping
 * metadata describing how the rules are bucketed.
 *
 * @architect-shape
 */
export const BusinessRuleSetSchema = z.discriminatedUnion('scope', [
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('all'),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('product-area'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('phase'),
    scopeValue: z.number().int(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('feature'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('package'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
  z.strictObject({
    kind: z.literal('BusinessRuleSet'),
    scope: z.literal('decision'),
    scopeValue: z.string(),
    rules: z.array(BusinessRuleSchema),
    groupedBy: BusinessRuleGroupingSchema.optional(),
    groupingEntries: z.array(BusinessRuleGroupingEntrySchema).optional(),
  }),
]);

export type BusinessRuleSet = z.infer<typeof BusinessRuleSetSchema>;
