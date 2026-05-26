/**
 * @architect
 * @architect-pattern Deliverable
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Defines the `Deliverable` fragment shape for one execution-context deliverable record.
 */
import { z } from 'zod';

/**
 * Fragment shape for one execution-context deliverable record — its name,
 * status, the tests that cover it, its source location, and optional finding
 * and release metadata.
 *
 * @architect-shape
 */
export const DeliverableSchema = z.strictObject({
  kind: z.literal('Deliverable'),
  name: z.string(),
  status: z.string(),
  tests: z.array(z.string()),
  location: z.string(),
  finding: z.string().optional(),
  release: z.string().optional(),
});

export type Deliverable = z.infer<typeof DeliverableSchema>;
