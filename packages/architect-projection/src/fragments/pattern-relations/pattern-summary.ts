/**
 * @architect
 * @architect-pattern PatternSummary
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `PatternSummary` fragment shape for the canonical short pattern summary reused by catalog and detail projections.
 */
import { MaturitySchema } from '@libar-dev/architect-core';
import { z } from 'zod';

import { PatternSourceSchema } from './supporting.js';

export const PatternSummarySchema = z.strictObject({
  kind: z.literal('PatternSummary'),
  patternName: z.string(),
  status: z.string().optional(),
  maturity: MaturitySchema.optional(),
  role: z.string(),
  phase: z.number().int().optional(),
  file: z.string(),
  source: PatternSourceSchema,
});

export type PatternSummary = z.infer<typeof PatternSummarySchema>;
