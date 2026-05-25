/**
 * @architect
 * @architect-pattern PrChangeReview
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 * @architect-uses BlockSchema
 *
 * ### When to Use
 *
 * - Defines the PrChangeReview fragment shape for branch changes and reviewer
 *   recommendations.
 */
import { z } from 'zod';

import { BlockSchema } from '../../blocks/schema.js';

export const PrChangeReviewSchema = z.strictObject({
  kind: z.literal('PrChangeReview'),
  branch: z.string(),
  changedFiles: z.array(z.string()),
  affectedPatterns: z.array(z.string()),
  recommendations: z.array(BlockSchema),
});

export type PrChangeReview = z.infer<typeof PrChangeReviewSchema>;
