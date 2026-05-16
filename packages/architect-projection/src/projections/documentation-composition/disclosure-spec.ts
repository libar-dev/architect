/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import { ProjectionFilterSchema } from '../_shared/filter.js';

export const ContentRichnessSchema = z.enum([
  'name-only',
  'summary',
  'summary-with-references',
  'full',
]);

export const GroupingAxisSchema = z.enum([
  'flat',
  'package',
  'product-area',
  'phase',
  'feature',
  'per-entity',
]);

export const RootShapeSchema = z.enum(['navigation', 'summary']);

export const DisclosureSpecSchema = z.strictObject({
  grouping: GroupingAxisSchema,
  richness: ContentRichnessSchema,
  rootShape: RootShapeSchema.optional(),
  emitChildren: z.boolean(),
  committed: z.boolean(),
  filter: ProjectionFilterSchema.optional(),
});

export type ContentRichness = z.infer<typeof ContentRichnessSchema>;
export type GroupingAxis = z.infer<typeof GroupingAxisSchema>;
export type RootShape = z.infer<typeof RootShapeSchema>;
export type DisclosureSpec = z.infer<typeof DisclosureSpecSchema>;
