/**
 * @architect
 * @architect-pattern GovernanceSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - Houses the shared governance helper schemas for decisions, validation, taxonomy, FSMs, tags, and format types.
 */
import { z } from 'zod';

/**
 * The kind of decision record: architecture, product, domain, or technical.
 *
 * @architect-shape
 */
export const DecisionTypeSchema = z.enum(['ADR', 'PDR', 'DDR', 'TDR']);

/**
 * Lifecycle status of a decision record.
 *
 * @architect-shape
 */
export const DecisionStatusSchema = z.enum([
  'proposed',
  'accepted',
  'rejected',
  'superseded',
  'deprecated',
]);

/**
 * The scope a business-rule set is gathered over.
 *
 * @architect-shape
 */
export const BusinessRuleScopeSchema = z.enum([
  'all',
  'package',
  'product-area',
  'phase',
  'feature',
]);

/**
 * The dimension a business-rule set is grouped by.
 *
 * @architect-shape
 */
export const BusinessRuleGroupingSchema = z.enum(['package', 'product-area', 'phase', 'feature']);

/**
 * Severity assigned to a validation rule.
 *
 * @architect-shape
 */
export const ValidationRuleSeveritySchema = z.enum(['error', 'warning']);

/**
 * One legal transition in an FSM graph — its `from`/`to` states and an optional
 * human-readable description.
 *
 * @architect-shape
 */
export const FsmTransitionSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  description: z.string().optional(),
});

/**
 * A finite-state-machine graph — its initial state, terminal states, full state
 * list, and the set of legal transitions between them.
 *
 * @architect-shape
 */
export const FsmGraphSchema = z.strictObject({
  initialState: z.string(),
  terminalStates: z.array(z.string()),
  states: z.array(z.string()),
  transitions: z.array(FsmTransitionSchema),
});

/**
 * One validation-rule entry — its id, description, severity, and the optional
 * roles it applies to.
 *
 * @architect-shape
 */
export const ValidationRuleEntrySchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  severity: ValidationRuleSeveritySchema,
  appliesToRoles: z.array(z.string()).optional(),
});

/**
 * How strongly a pattern is protected against change at a given lifecycle stage.
 *
 * @architect-shape
 */
export const ProtectionLevelSchema = z.enum(['none', 'scope', 'hard']);

/**
 * Maps a protection level to the statuses it covers and what it permits —
 * whether deliverables may be added and whether an explicit unlock is required.
 *
 * @architect-shape
 */
export const ProtectionLevelEntrySchema = z.strictObject({
  level: ProtectionLevelSchema,
  statuses: z.array(z.string()),
  meaning: z.string().optional(),
  canAddDeliverables: z.boolean(),
  needsUnlock: z.boolean(),
});

/**
 * The category a taxonomy tag belongs to.
 *
 * @architect-shape
 */
export const TagEntryKindSchema = z.enum(['role', 'metadata', 'aggregation']);

/**
 * One taxonomy tag entry — its kind, tag name, purpose, and the full set of
 * optional documentation metadata (format, allowed values, default, example,
 * aliases, and more).
 *
 * @architect-shape
 */
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

/**
 * A named group of taxonomy tag entries.
 *
 * @architect-shape
 */
export const TagGroupEntrySchema = z.strictObject({
  groupName: z.string(),
  entries: z.array(TagEntrySchema),
});

/**
 * The value format a tag accepts — bare value, enum, quoted value, csv, number,
 * or boolean flag.
 *
 * @architect-shape
 */
export const FormatTypeSchema = z.enum(['value', 'enum', 'quoted-value', 'csv', 'number', 'flag']);

/**
 * Documents one tag value format with a description and an example.
 *
 * @architect-shape
 */
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
