/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import { ProjectionFilterSchema } from '../_shared/filter.js';

export const ContentRichnessSchema = z
  .enum(['name-only', 'summary', 'summary-with-references', 'full'])
  .describe(
    'Per-entry content depth in a disclosure spec. "name-only" = bare identifier; "summary" = short summary blocks; "summary-with-references" = summary plus link-outs to detail; "full" = complete content inline.'
  );

export const GroupingAxisSchema = z
  .enum(['flat', 'package', 'product-area', 'phase', 'feature', 'per-entity'])
  .describe(
    'Axis used to partition entries within a disclosure spec. "flat" = no grouping, all entries in one section; "package" = grouped by package; "product-area" = grouped by product-area tag; "phase" = grouped by phase number; "feature" = grouped by feature; "per-entity" = one section per entity with no aggregation.'
  );

export const RootShapeSchema = z
  .enum(['navigation', 'summary'])
  .describe(
    'Presentation shape of the root index document. "navigation" = TOC-style index linking to children; "summary" = content-bearing summary entries embedded inline at the root.'
  );

export const DisclosureSpecSchema = z
  .strictObject({
    grouping: GroupingAxisSchema.describe(
      'Axis used to partition the projected entries into sections.'
    ),
    richness: ContentRichnessSchema.describe(
      'How much content each entry carries — from bare names through full inline content.'
    ),
    rootShape: RootShapeSchema.optional().describe(
      'Presentation shape of the root index. Defaults to navigation behaviour when omitted.'
    ),
    emitChildren: z
      .boolean()
      .describe('Whether children fan out into separate files instead of being inlined.'),
    committed: z
      .boolean()
      .describe(
        'Whether this disclosure choice is invariant for the doc type, as opposed to context-dependent and overridable.'
      ),
    filter: ProjectionFilterSchema.optional().describe(
      'Optional ProjectionFilter narrowing which patterns appear in this disclosure.'
    ),
  })
  .describe(
    'Composition recipe for a single documentation output — declares grouping axis, per-entry richness, root-document shape, child fan-out, commitment, and optional filtering.'
  );

export type ContentRichness = z.infer<typeof ContentRichnessSchema>;
export type GroupingAxis = z.infer<typeof GroupingAxisSchema>;
export type RootShape = z.infer<typeof RootShapeSchema>;
export type DisclosureSpec = z.infer<typeof DisclosureSpecSchema>;
