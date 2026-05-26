/**
 * @architect
 * @architect-pattern ScopeReadinessCheck
 * @architect-status active
 * @architect-role:contract
 * @architect-uses ExecutionContextSupporting
 * @architect-bounded-context:execution-context
 *
 * Defines the `ScopeReadinessCheck` fragment shape for one readiness criterion and its result.
 */
import { z } from 'zod';

import { CheckSeveritySchema } from './supporting.js';

/**
 * Fragment shape for a single readiness criterion and its outcome — the check
 * identifier and label, its severity, whether it passed, and optional detail
 * text.
 *
 * @architect-shape
 */
export const ScopeReadinessCheckSchema = z.strictObject({
  kind: z.literal('ScopeReadinessCheck'),
  checkId: z.string(),
  label: z.string(),
  severity: CheckSeveritySchema,
  passed: z.boolean(),
  details: z.string().optional(),
});

export type ScopeReadinessCheck = z.infer<typeof ScopeReadinessCheckSchema>;
