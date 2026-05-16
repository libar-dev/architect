/**
 * @architect
 * @architect-pattern Deliverable
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

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
