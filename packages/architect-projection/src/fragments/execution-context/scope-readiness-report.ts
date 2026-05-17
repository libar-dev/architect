/**
 * @architect
 * @architect-pattern ScopeReadinessReport
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Defines the `ScopeReadinessReport` fragment shape for session readiness checks and verdicts.
 */
import { z } from 'zod';
import { ScopeTypeSchema } from '@libar-dev/architect-core';

import { ScopeVerdictSchema } from './supporting.js';
import { ScopeReadinessCheckSchema } from './scope-readiness-check.js';

export const ScopeReadinessReportSchema = z.strictObject({
  kind: z.literal('ScopeReadinessReport'),
  pattern: z.string(),
  sessionType: ScopeTypeSchema,
  checks: z.array(ScopeReadinessCheckSchema),
  verdict: ScopeVerdictSchema,
});

export type ScopeReadinessReport = z.infer<typeof ScopeReadinessReportSchema>;
