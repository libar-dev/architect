/**
 * @architect
 * @architect-pattern PatternCatalog
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `PatternCatalog` fragment shape for filtered pattern-summary catalogs, including counts, names-only mode, and filters.
 */
import { z } from 'zod';

import { PatternSummarySchema } from './pattern-summary.js';

/**
 * The filter criteria applied to a pattern catalog — status, role, parent, and
 * package narrowing plus the names-only and count-only output modes.
 *
 * @architect-shape
 */
export const PatternCatalogFilterSchema = z.strictObject({
  status: z.string().optional(),
  role: z.string().optional(),
  parent: z.string().optional(),
  package: z.string().optional(),
  namesOnly: z.boolean(),
  count: z.boolean(),
});

/**
 * A filtered catalog of pattern summaries — the applied filters, the total
 * count, the names-only list, and the full summary items.
 *
 * @architect-shape
 */
export const PatternCatalogSchema = z.strictObject({
  kind: z.literal('PatternCatalog'),
  filters: PatternCatalogFilterSchema,
  count: z.number().int().nonnegative(),
  names: z.array(z.string()),
  items: z.array(PatternSummarySchema),
});

export type PatternCatalog = z.infer<typeof PatternCatalogSchema>;
