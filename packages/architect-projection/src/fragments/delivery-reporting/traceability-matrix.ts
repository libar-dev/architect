/**
 * @architect
 * @architect-pattern TraceabilityMatrix
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { TraceRowSchema } from './supporting.js';

export const TraceabilityMatrixSchema = z.strictObject({
  kind: z.literal('TraceabilityMatrix'),
  rows: z.array(TraceRowSchema),
});

export type TraceabilityMatrix = z.infer<typeof TraceabilityMatrixSchema>;
