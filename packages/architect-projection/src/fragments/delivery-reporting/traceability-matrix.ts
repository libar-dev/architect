/**
 * @architect
 * @architect-pattern TraceabilityMatrix
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - Defines the TraceabilityMatrix fragment shape for pattern-to-test trace
 *   rows.
 */
import { z } from 'zod';

import { TraceRowSchema } from './supporting.js';

/**
 * A pattern-to-test traceability matrix carrying one trace row per pattern.
 *
 * @architect-shape
 */
export const TraceabilityMatrixSchema = z.strictObject({
  kind: z.literal('TraceabilityMatrix'),
  rows: z.array(TraceRowSchema),
});

export type TraceabilityMatrix = z.infer<typeof TraceabilityMatrixSchema>;
