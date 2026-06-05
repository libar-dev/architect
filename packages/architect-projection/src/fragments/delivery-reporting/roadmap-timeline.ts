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

import { PatternSummarySchema } from '../pattern-relations/index.js';
import { StatusCountsSchema } from './supporting.js';

/**
 * A roadmap view — one of `roadmap`, `milestones`, or `current` — over a flat,
 * deterministically ordered set of pattern summaries plus their status counts.
 *
 * @architect-shape
 */
export const RoadmapTimelineSchema = z.strictObject({
  kind: z.literal('RoadmapTimeline'),
  view: z.enum(['roadmap', 'milestones', 'current']),
  patterns: z.array(PatternSummarySchema),
  counts: StatusCountsSchema,
});

export type RoadmapTimeline = z.infer<typeof RoadmapTimelineSchema>;
