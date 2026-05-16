/**
 * @architect
 * @architect-pattern GovernanceSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const DecisionTypeSchema = z.enum(['ADR', 'PDR', 'DDR', 'TDR']);

export const DecisionStatusSchema = z.enum([
  'proposed',
  'accepted',
  'rejected',
  'superseded',
  'deprecated',
]);

export const BusinessRuleScopeSchema = z.enum([
  'all',
  'package',
  'product-area',
  'phase',
  'feature',
]);

export const BusinessRuleGroupingSchema = z.enum(['package', 'product-area', 'phase', 'feature']);

export const ValidationRuleSeveritySchema = z.enum(['error', 'warning']);

export const FsmTransitionSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  description: z.string().optional(),
});

export const FsmGraphSchema = z.strictObject({
  initialState: z.string(),
  terminalStates: z.array(z.string()),
  states: z.array(z.string()),
  transitions: z.array(FsmTransitionSchema),
});

export const ValidationRuleEntrySchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  severity: ValidationRuleSeveritySchema,
  appliesToRoles: z.array(z.string()).optional(),
});

export const ProtectionLevelSchema = z.enum(['none', 'scope', 'hard']);

export const ProtectionLevelEntrySchema = z.strictObject({
  level: ProtectionLevelSchema,
  statuses: z.array(z.string()),
  meaning: z.string().optional(),
  canAddDeliverables: z.boolean(),
  needsUnlock: z.boolean(),
});

export const TagEntryKindSchema = z.enum(['role', 'metadata', 'aggregation']);

export const TagEntrySchema = z.strictObject({
  kind: TagEntryKindSchema,
  tag: z.string(),
  purpose: z.string(),
  format: z.string().optional(),
  required: z.boolean().optional(),
  repeatable: z.boolean().optional(),
  values: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  example: z.string().optional(),
  domain: z.string().optional(),
  priority: z.number().int().optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  targetDoc: z.string().optional(),
});

export const TagGroupEntrySchema = z.strictObject({
  groupName: z.string(),
  entries: z.array(TagEntrySchema),
});

export const FormatTypeSchema = z.enum(['value', 'enum', 'quoted-value', 'csv', 'number', 'flag']);

export const FormatTypeEntrySchema = z.strictObject({
  format: FormatTypeSchema,
  description: z.string(),
  example: z.string(),
});

export type DecisionType = z.infer<typeof DecisionTypeSchema>;
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;
export type BusinessRuleScope = z.infer<typeof BusinessRuleScopeSchema>;
export type BusinessRuleGrouping = z.infer<typeof BusinessRuleGroupingSchema>;
export type ValidationRuleSeverity = z.infer<typeof ValidationRuleSeveritySchema>;
export type FsmTransition = z.infer<typeof FsmTransitionSchema>;
export type FsmGraph = z.infer<typeof FsmGraphSchema>;
export type ValidationRuleEntry = z.infer<typeof ValidationRuleEntrySchema>;
export type ProtectionLevel = z.infer<typeof ProtectionLevelSchema>;
export type ProtectionLevelEntry = z.infer<typeof ProtectionLevelEntrySchema>;
export type TagEntryKind = z.infer<typeof TagEntryKindSchema>;
export type TagEntry = z.infer<typeof TagEntrySchema>;
export type TagGroupEntry = z.infer<typeof TagGroupEntrySchema>;
export type FormatType = z.infer<typeof FormatTypeSchema>;
export type FormatTypeEntry = z.infer<typeof FormatTypeEntrySchema>;
