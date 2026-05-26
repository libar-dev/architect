/**
 * @architect
 * @architect-pattern RoadmapTimeline
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - Defines the RoadmapTimeline fragment shape for roadmap, milestones, and
 *   current views.
 */
import { z } from 'zod';

import { QuarterEntrySchema } from './supporting.js';

/**
 * A roadmap view — one of `roadmap`, `milestones`, or `current` — over a set of
 * quarter entries.
 *
 * @architect-shape
 */
export const RoadmapTimelineSchema = z.strictObject({
  kind: z.literal('RoadmapTimeline'),
  view: z.enum(['roadmap', 'milestones', 'current']),
  quarters: z.array(QuarterEntrySchema),
});

export type RoadmapTimeline = z.infer<typeof RoadmapTimelineSchema>;
