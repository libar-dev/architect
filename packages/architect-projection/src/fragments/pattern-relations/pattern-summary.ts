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

/**
 * The canonical short summary of a pattern — its name, status, maturity, role,
 * source file and origin, and owning package. Reused by catalog and detail
 * projections.
 *
 * @architect-shape
 */
export const PatternSummarySchema = z.strictObject({
  kind: z.literal('PatternSummary'),
  patternName: z.string(),
  status: z.string().optional(),
  maturity: MaturitySchema.optional(),
  role: z.string(),
  file: z.string(),
  source: PatternSourceSchema,
  package: z.string().optional(),
});

/**
 * The pattern summary without its `kind` discriminator — the identity fields a
 * detail projection extends.
 *
 * @architect-shape
 */
export const PatternIdentitySchema = PatternSummarySchema.omit({ kind: true });

export type PatternSummary = z.infer<typeof PatternSummarySchema>;
