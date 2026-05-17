/**
 * @architect
 * @architect-pattern ScopeReadinessCheck
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Defines the `ScopeReadinessCheck` fragment shape for one readiness criterion and its result.
 */
import { z } from 'zod';

import { CheckSeveritySchema } from './supporting.js';

export const ScopeReadinessCheckSchema = z.strictObject({
  kind: z.literal('ScopeReadinessCheck'),
  checkId: z.string(),
  label: z.string(),
  severity: CheckSeveritySchema,
  passed: z.boolean(),
  details: z.string().optional(),
});

export type ScopeReadinessCheck = z.infer<typeof ScopeReadinessCheckSchema>;
